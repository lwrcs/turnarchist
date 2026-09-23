"""Explicit live-controller smoke suite using the existing isolated process supervisor.
No dependencies, browser downloads, planner budgets or ordinary smoke cases are changed.
"""
from __future__ import annotations
import argparse
import contextlib
import functools
import json
import hashlib
import sys
import threading
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import horizon_smoke as supervisor


def main() -> int:
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--out',type=Path,required=True)
    parser.add_argument('--chromium')
    parser.add_argument('--multi-room',action='store_true',help='Require a verified action in a second distinct room without changing controller limits')
    parser.add_argument('--continuation',action='store_true',help='Reproduce the viewer settings: 20 actions, depth 17, 128 simulations; unchanged time limits')
    parser.add_argument('--seeds',nargs='+',type=int,default=[1])
    parser.add_argument('--scenarios',nargs='+',choices=['standard','cave','forest'],default=['standard'])
    args=parser.parse_args()
    if args.continuation and (args.multi_room or args.seeds != [1] or args.scenarios != ['standard']):
        parser.error('The continuation regression is the reported standard seed-1 exit route; run other suites separately.')
    root=Path(__file__).resolve().parents[1]
    out=args.out.expanduser()
    cases=Path(str(out)+'.cases')
    if not out.is_absolute() or out.resolve().is_relative_to(root) or out.exists() or cases.exists() or Path(str(out)+'.evidence.json').exists():
        parser.error('Use a new absolute report path outside the checkout.')
    if len(set(args.seeds))!=len(args.seeds) or len(set(args.scenarios))!=len(args.scenarios) or any(not 0<=s<=0xffffffff for s in args.seeds) or len(args.seeds)*len(args.scenarios)>64:
        parser.error('Unique unsigned seeds/scenarios and at most 64 cases are required.')
    cases.mkdir(parents=True)
    report={'suite':'horizon-continuation-browser-v1' if args.continuation else 'horizon-rooms-browser-v1' if args.multi_room else 'horizon-live-browser-v1','actualGame':True,'pass':False,'runs':[],
            'coverage':{'seeds':args.seeds,'scenarios':args.scenarios},'python':sys.version}
    server=None
    try:
        class Handler(SimpleHTTPRequestHandler):
            def log_message(self,*_): pass
            def end_headers(self):
                self.send_header('Cache-Control','no-store');super().end_headers()
            def copyfile(self,src,dst):
                with contextlib.suppress(BrokenPipeError,ConnectionResetError):super().copyfile(src,dst)
        server=ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Handler,directory=str(root)))
        thread=threading.Thread(target=server.serve_forever,daemon=True);thread.start()
        entry='horizon-continuation-validation.html' if args.continuation else 'horizon-room-validation.html' if args.multi_room else 'horizon-live-validation.html'
        for scenario in args.scenarios:
            for seed in args.seeds:
                directory=cases/f'{scenario}-{seed}';directory.mkdir()
                request={'seed':seed,'scenario':scenario,'url':f'http://127.0.0.1:{server.server_address[1]}/{entry}',
                         'chromium':args.chromium,'caseTimeoutMs':180000,'operationTimeoutMs':30000,
                         'journal':str(directory/'progress.jsonl'),'result':str(directory/'result.json')}
                report['runs'].append(supervisor.execute_case(request,directory))
        report['pass']=len(report['runs'])==len(args.seeds)*len(args.scenarios) and all(r.get('pass') is True for r in report['runs'])
    except Exception as error:
        report['error']={'name':type(error).__name__,'message':str(error)}
    finally:
        if server:server.shutdown();server.server_close()
        paths=['src/game/agentEnvironment.ts','src/game/agentPlanningWarnings.ts','src/game/agentPlanningInteraction.ts','src/game/agentPlanningPaths.ts','src/game/agentPlanningEmptyLoot.ts','src/game/agentPlanningAttachedLoot.ts','src/game/agentPlanningResources.ts','src/game/agentPlanningSpawners.ts','agent-horizon-host.js','agent-horizon-controller.js','agent-horizon-goals.js','training/horizon-live-smoke.js','training/horizon-room-smoke.js','training/horizon-continuation-smoke.js']
        sources=[]
        for name in paths:
            file=root/name
            if file.is_file() and file.stat().st_size<=300000:
                raw=file.read_bytes();sources.append({'path':name,'sha256':hashlib.sha256(raw).hexdigest(),'content':raw.decode('utf8')})
        report['sourceHashes']={s['path']:s['sha256'] for s in sources}
        if not report['pass']:
            evidence=Path(str(out)+'.evidence.json');report['evidenceFile']=str(evidence)
            supervisor.write_new(evidence,{'format':'horizon-live-evidence-v1','privacy':'Selected source and bounded diagnostics; no full snapshots or environment dump.','report':report,'sources':sources})
        supervisor.write_new(out,report)
    print(json.dumps({'pass':report['pass'],'report':str(out),'actualGame':True,'cases':len(report['runs'])}))
    return 0 if report['pass'] else 1

if __name__=='__main__':raise SystemExit(main())
