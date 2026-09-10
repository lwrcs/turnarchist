"""Shared live-inference/recording history; conservative human directional import."""
from collections import deque
import argparse
import hashlib
import json
from pathlib import Path
import numpy as np
from combat_pilot import encode, rotate_features
from dungeon_pilot import ENCODER, REWARD, HELPER, ExplorationMemory, navigation_features, helper_action, seed_plan, actual_seed


def reserved_seeds():
    seeds=seed_plan('held-out',32)
    return set(seeds)|{actual_seed(s) for s in seeds}


def validate_seed(seed):
    if type(seed)!=int or not 0<=seed<2**32 or seed in reserved_seeds():
        raise ValueError('Seed is invalid or reserved for evaluation')


class History:
    def __init__(self,view,rotation=0):
        if rotation not in range(4): raise ValueError('Invalid rotation')
        self.rotation=rotation; self.view=view; self.seq=0
        self.memory=ExplorationMemory(view,0)
        frame=rotate_features(encode(view),rotation)
        self.frames=deque([frame.copy(),frame.copy()],maxlen=2)

    def observation(self):
        return np.concatenate((*self.frames,self.memory.features(self.view,self.rotation),
                               navigation_features(self.view,self.rotation,self.memory.used_passages)))

    def advance(self,record):
        if record['seq']!=self.seq+1 or record['before']!=self.view: raise ValueError('Recording history gap or mismatch')
        after=record['after']
        # Validate perception before mutating history; diagnostics are never accepted.
        frame=rotate_features(encode(after),self.rotation)
        boundary=after['decision']=='world' and helper_action(after) is None
        if record['decisionEnd']!=boundary: raise ValueError('Decision boundary mismatch')
        self.memory.observe(self.view,after,0,bool(record.get('terminated')),record['action'])
        self.view=after; self.seq=record['seq']
        if boundary:self.frames.append(frame)


def equipped(view):
    return [(i.get('kind'),i.get('traits')) for i in view['inventory'] if i and i.get('equipped')]


def convert(envelope):
    if envelope.get('schemaVersion')!=1: raise ValueError('Unknown teaching recording schema')
    meta=envelope['meta']; validate_seed(meta['seed'])
    if meta.get('perceptionView')!='restricted-grid': raise ValueError('Privileged-view recording requires separate review')
    if meta.get('protocol')!='starter': raise ValueError('Normal equipment runs require manual compatibility review')
    h=History(meta['initial'],meta.get('rotation',0)); baseline=equipped(meta['initial'])
    xs=[]; ys=[]; segments=[]; reasons={}; human=0
    for r in envelope['records']:
        if r['before']['contract']!=meta['contract'] or r['after']['contract']!=meta['contract']: raise ValueError('Game contract changed within session')
        obs=h.observation().copy(); reason=None
        if r['source']=='human':
            human+=1
            if r['segment'] in meta.get('excludedSegments',[]): reason='excluded segment'
            elif r['action']['type']!='Move': reason='non-directional action retained as history'
            elif r['before']['decision']!='world' or helper_action(r['before']) is not None: reason='helper decision context'
            elif equipped(r['before'])!=baseline: reason='changed equipment'
            elif not r['info']['recorded']: reason='unrecorded action'
            elif r.get('terminated'): reason='terminal action requires review'
            else:
                direction=r['action'].get('direction')
                if direction not in ['up','right','down','left']: raise ValueError('Invalid direction')
                xs.append(obs);ys.append((['up','right','down','left'].index(direction)-h.rotation)%4);segments.append(r['segment'])
            if reason:reasons[reason]=reasons.get(reason,0)+1
        h.advance(r)
    return xs,ys,{'humanActions':human,'accepted':len(xs),'excluded':reasons,'segments':segments}


def main():
    p=argparse.ArgumentParser();p.add_argument('recording',type=Path);p.add_argument('--out',type=Path,required=True);p.add_argument('--checkpoint-manifest',type=Path,required=True);a=p.parse_args()
    raw=a.recording.read_bytes(); envelope=json.loads(raw);xs,ys,report=convert(envelope)
    source=json.loads(a.checkpoint_manifest.read_text()); contract=dict(envelope['meta']['contract'])
    if source['gameContract']!=contract or source['encoder']!=ENCODER: raise ValueError('Checkpoint/game/encoder mismatch')
    if not xs: raise ValueError('No compatible human directional examples: '+json.dumps(report))
    a.out.mkdir(parents=True,exist_ok=False)
    np.savez_compressed(a.out/'demonstrations.npz',observations=np.asarray(xs,dtype=np.float32),actions=np.asarray(ys,dtype=np.int64))
    manifest={'encoder':ENCODER,'reward':REWARD,'helper':HELPER,'gameContract':contract,'trainingSeeds':[envelope['meta']['seed']],
              'humanDemonstrations':{'version':1,'session':envelope['meta']['id'],'sourceSha256':hashlib.sha256(raw).hexdigest(),
                 'splitUnit':'entire session and seed','perceptionView':'restricted-grid','protocol':'starter'},'samples':len(xs)}
    (a.out/'manifest.json').write_text(json.dumps(manifest,indent=2));(a.out/'import-report.json').write_text(json.dumps(report,indent=2));(a.out/'complete.json').write_text(json.dumps({'samples':len(xs)}));print(json.dumps(report))


if __name__=='__main__': main()
