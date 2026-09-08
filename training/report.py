"""Summarize paired evaluation files without treating truncation as success."""
import argparse
from collections import Counter, defaultdict
import json
from pathlib import Path


def summarize(rows):
    groups = defaultdict(list)
    for row in rows:
        groups[row['scenario']].append(row)
    result = {}
    for scenario, episodes in groups.items():
        outcomes = Counter(e['status'] for e in episodes)
        actions = Counter(t['action'] for e in episodes for t in e.get('trace', []))
        world_actions = Counter(t['worldAction'] for e in episodes for t in e.get('trace', []) if 'worldAction' in t)
        by_rotation = defaultdict(Counter)
        for episode in episodes:
            by_rotation[episode.get('rotation',0)][episode['status']] += 1
        clears=[e for e in episodes if e['status']=='cleared']
        health_known=[e for e in clears if e.get('health') is not None and e.get('initialHealth') is not None]
        result[scenario] = {
            'episodes':len(episodes), 'cleared':outcomes['cleared'], 'dead':outcomes['dead'],
            'budgetIncomplete':outcomes['budget-incomplete'],
            'healthPreservingClears':sum(e['health']>=e['initialHealth'] for e in health_known) if len(health_known)==len(clears) else None,
            'clearHealthComparisonKnown':len(health_known),
            'otherOutcomes':{k:v for k,v in outcomes.items() if k not in ('cleared','dead','budget-incomplete')},
            'meanDecisions':sum(e['steps'] for e in episodes)/len(episodes),
            'policyActionCounts':dict(sorted(actions.items())),
            'worldActionCounts':dict(sorted(world_actions.items())),
            'unrecordedDecisions':sum(t.get('recorded') is False for e in episodes for t in e.get('trace', [])),
            'recordingStatusKnown':sum('recorded' in t for e in episodes for t in e.get('trace', [])),
            'worldTurns':sum(t.get('turnDelta',0) for e in episodes for t in e.get('trace', [])),
            'turnDeltaKnown':sum('turnDelta' in t for e in episodes for t in e.get('trace', [])),
            'dominantActionFraction':max(actions.values())/sum(actions.values()) if actions else None,
            'distinctPositions':[len({(t['x'],t['y']) for t in e['trace']}) if e.get('trace') else None for e in episodes],
            'rotations':dict(sorted(Counter(e.get('rotation',0) for e in episodes).items())),
            'outcomesByRotation':{k:dict(v) for k,v in sorted(by_rotation.items())},
        }
    return result


def compare(directory):
    directory = Path(directory)
    random = json.loads((directory/'random-evaluation.json').read_text())
    trained = json.loads((directory/'evaluation.json').read_text())
    key = lambda row:(row['scenario'],row['seed'],row.get('rotation',0))
    matched = [key(r) for r in random] == [key(r) for r in trained]
    result = {'matchedEpisodePlan':matched, 'random':summarize(random), 'trained':summarize(trained),
              'limitation':'Fixed fixture geometry: repeated seeds and coordinate rotations do not establish layout generalization.'}
    if (directory/'manifest.json').exists():
        manifest=json.loads((directory/'manifest.json').read_text())
        result['scenarioRoles']={name:('training-fixture' if name in manifest.get('trainingScenarios',[]) else
                                      'held-out-fixture' if name in manifest.get('transferScenarios',[]) else 'unclassified')
                                 for name in result['trained']}
    sampled_path = directory/'stochastic-evaluation.json'
    if sampled_path.exists():
        sampled = json.loads(sampled_path.read_text())
        result['stochastic'] = summarize(sampled)
        result['matchedStochasticPlan'] = [key(r) for r in random] == [key(r) for r in sampled]
    return result


if __name__=='__main__':
    parser=argparse.ArgumentParser()
    parser.add_argument('directory',type=Path)
    args=parser.parse_args()
    print(json.dumps(compare(args.directory),indent=2))
