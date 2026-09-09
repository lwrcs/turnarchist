"""Paired procedural-dungeon results; surviving a budget is never labeled a win."""
import argparse
import json
from pathlib import Path


def summary(rows):
    n=len(rows)
    if not n: raise ValueError('Empty dungeon evaluation')
    return {'episodes':n,'deaths':sum(r['status']=='dead' for r in rows),
            'budgetIncomplete':sum(r['status']=='budget-incomplete' for r in rows),
            'unsupported':sum(r['status']=='unsupported-decision' for r in rows),
            'reachedDeeperFloor':sum(r['maxDepth']>r['initialDepth'] for r in rows),
            'maximumDepth':max(r['maxDepth'] for r in rows),
            **{'mean'+key[0].upper()+key[1:]:sum(r[key] for r in rows)/n
               for key in ['roomsVisited','positionsVisited','healthLost','gameActions','helperActions']}}


def report(directory,against=None):
    directory=Path(directory)
    manifest=json.loads((directory/'manifest.json').read_text())
    if against:
        against=Path(against)
        old=json.loads((against/'manifest.json').read_text())
        for key in ('encoder','reward','helper','gameContract','budget','heldOutSeeds'):
            if manifest[key]!=old[key]: raise ValueError('Evaluation mismatch: '+key)
    result={'limitation':'Finite held-out random seed sample. Budget survivors are incomplete runs, not wins.', 'policies':{}}
    for policy in ['random','deterministic','sampled']:
        filename=f'{policy}-evaluation.json'
        rows=json.loads((directory/filename).read_text())
        result['policies'][policy]=summary(rows)
        if against:
            before=json.loads((against/filename).read_text())
            key=lambda r:(r['seed'],r['rotation'])
            lookup={key(r):r for r in before}
            if len(lookup)!=len(before) or len({key(r) for r in rows})!=len(rows): raise ValueError('Duplicate seed/view')
            if set(lookup)!={key(r) for r in rows}: raise ValueError('Different episode plan')
            result['policies'][policy]['paired']={
                metric:{'improved':sum((r[metric]-lookup[key(r)][metric])*sign>0 for r in rows),
                        'worsened':sum((r[metric]-lookup[key(r)][metric])*sign<0 for r in rows)}
                for metric,sign in [('maxDepth',1),('roomsVisited',1),('positionsVisited',1),('healthLost',-1)]}
    return result


if __name__=='__main__':
    parser=argparse.ArgumentParser()
    parser.add_argument('directory',type=Path)
    parser.add_argument('--against',type=Path)
    args=parser.parse_args()
    print(json.dumps(report(args.directory,args.against),indent=2))
