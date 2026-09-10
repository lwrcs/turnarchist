"""Loopback-only checkpoint inference. No training, game control or uploads."""
import argparse
import hashlib
import json
import secrets
import threading
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import torch
from stable_baselines3 import PPO
from dungeon_pilot import ENCODER, REWARD, HELPER, helper_action
from teaching_data import History, validate_seed, reserved_seeds


def main():
    p=argparse.ArgumentParser();p.add_argument('--model',type=Path,required=True);p.add_argument('--port',type=int,default=8766);p.add_argument('--token-file',type=Path,required=True);a=p.parse_args()
    token=secrets.token_urlsafe(32)
    with a.token_file.open('x') as f:f.write(token)
    a.token_file.chmod(0o600)
    torch.set_num_threads(2);model=PPO.load(a.model,device='cpu');manifest=json.loads((a.model.parent/'manifest.json').read_text())
    if any(manifest[k]!=v for k,v in [('encoder',ENCODER),('reward',REWARD),('helper',HELPER)]):raise ValueError('Unsupported checkpoint contract')
    name=a.model.parent.name+' · '+hashlib.sha256(a.model.read_bytes()).hexdigest()[:12];sessions={};lock=threading.Lock()
    origins={'http://localhost:8000','http://127.0.0.1:8000'}
    class Handler(BaseHTTPRequestHandler):
        def log_message(self,*args):pass
        def respond(self,status):
            self.send_response(status);origin=self.headers.get('Origin')
            if origin in origins:self.send_header('Access-Control-Allow-Origin',origin)
            self.send_header('Content-Type','application/json');self.send_header('Cache-Control','no-store');self.end_headers()
        def do_OPTIONS(self):
            if self.headers.get('Origin') not in origins:self.respond(403);return
            self.send_response(204);self.send_header('Access-Control-Allow-Origin',self.headers['Origin']);self.send_header('Access-Control-Allow-Headers','Content-Type, Authorization');self.send_header('Access-Control-Allow-Methods','POST');self.end_headers()
        def do_POST(self):
            if self.headers.get('Origin') not in origins or self.headers.get('Authorization')!='Bearer '+token:self.respond(403);self.wfile.write(b'{"error":"Unauthorized origin or token"}');return
            try:
                length=int(self.headers.get('Content-Length','0'))
                if not 0<length<=8*1024*1024:raise ValueError('Invalid request size')
                body=json.loads(self.rfile.read(length))
                with lock:
                    if self.path=='/start':
                        for key in list(sessions):
                            if time.monotonic()-sessions[key][1]>7200:del sessions[key]
                        if len(sessions)>=16:raise ValueError('Inference session limit reached; restart service after finishing sessions')
                        validate_seed(body['meta']['seed']);contract=dict(body['view']['contract'])
                        if contract!=manifest['gameContract']:raise ValueError('Game build differs from checkpoint; compatible checkpoint required')
                        key=secrets.token_urlsafe(16);sessions[key]=(History(body['view'],body['meta'].get('rotation',0)),time.monotonic());result={'id':key,'model':name,'encoder':ENCODER}
                    elif self.path in ['/advance','/predict']:
                        h,_=sessions[body['id']];sessions[body['id']]=(h,time.monotonic())
                        if self.path=='/advance':h.advance(body['record']);result={'seq':h.seq}
                        else:
                            if body['seq']!=h.seq:raise ValueError('Stale observation sequence')
                            action=helper_action(h.view);probabilities=None
                            if action is None and h.view['decision']=='world':
                                with torch.no_grad():probs=model.policy.get_distribution(torch.as_tensor(h.observation()).unsqueeze(0)).distribution.probs[0].numpy()
                                local=int(probs.argmax());action={'type':'Move','direction':['up','right','down','left'][(local+h.rotation)%4]};probabilities=probs.tolist()
                            result={'seq':h.seq,'action':action,'probabilities':probabilities}
                    elif self.path=='/config':result={'reservedSeeds':sorted(reserved_seeds()),'model':name}
                    else:raise ValueError('Unknown endpoint')
                self.respond(200);self.wfile.write(json.dumps(result).encode())
            except Exception as e:self.respond(400);self.wfile.write(json.dumps({'error':str(e)}).encode())
    print('Teaching inference on loopback port '+str(a.port)+'; model '+name,flush=True)
    ThreadingHTTPServer(('127.0.0.1',a.port),Handler).serve_forever()


if __name__=='__main__':main()
