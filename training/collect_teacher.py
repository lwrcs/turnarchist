"""Collect restricted-input baseline demonstrations, retaining outcome labels."""
import argparse
import hashlib
import json
from pathlib import Path

import numpy as np

from combat_pilot import CombatEnv, ENCODER, ROOT, SCENARIOS


def local_action(action, rotation):
    if action == {'type':'Wait'}:
        return 4
    if action.get('type') != 'Move' or action.get('direction') not in ('up','right','down','left'):
        raise ValueError('Teacher selected an action outside the pilot action contract')
    world=('up','right','down','left').index(action['direction'])
    return (world-rotation)%4


def main():
    parser=argparse.ArgumentParser()
    parser.add_argument('--out',type=Path,required=True)
    parser.add_argument('--repeats',type=int,default=2)
    args=parser.parse_args()
    if not 1 <= args.repeats <= 20:
        parser.error('Use 1..20 repeats of the three training fixtures in four views')
    args.out.mkdir(parents=True,exist_ok=False)
    env=CombatEnv(args.out,rotate_frames=True)
    observations,actions,episode_ids=[],[],[]
    outcomes=[]
    rng=np.random.default_rng(456)
    try:
        env.page.add_script_tag(path=str(ROOT/'agent-baseline.js'))
        version=env.page.evaluate('() => AgentBaseline.Policy.version')
        for _ in range(args.repeats):
            for scenario in SCENARIOS:
                episode_seed=int(rng.integers(0,2**31))
                for rotation in range(4):
                    obs,_=env.reset(seed=episode_seed,options={'scenario':scenario,'rotation':rotation})
                    env.page.evaluate('() => { window.demoTeacher = new AgentBaseline.Policy(); }')
                    initial_health=env.view['player']['health']
                    while True:
                        before=env.view
                        # The teacher receives the same restricted perception API,
                        # though it can use more traits/history than the small learner.
                        action=env.page.evaluate('(view) => window.demoTeacher.choose(view)',before)
                        local=local_action(action,rotation)
                        observations.append(obs.copy())
                        actions.append(local)
                        episode_ids.append(len(outcomes))
                        obs,_,done,truncated,info=env.step(local)
                        env.page.evaluate('''([before, action, after, turnDelta]) =>
                            window.demoTeacher.feedback(before,action,after,{turnDelta})''',
                            [before,action,env.view,env.trace[-1]['turnDelta']])
                        if done or truncated:
                            outcomes.append({**info,'initialHealth':initial_health,
                                             'trace':list(env.trace)})
                            break
        np.savez_compressed(args.out/'demonstrations.npz',
                            observations=np.asarray(observations,dtype=np.float32),
                            actions=np.asarray(actions,dtype=np.int64),
                            episode_ids=np.asarray(episode_ids,dtype=np.int64))
        manifest={'encoder':{**ENCODER,'version':2,'coordinateRotation':'random-quarter-turn-per-episode'},
                  'gameContract':env.contract,'teacherVersion':version,
                  'teacherSha256':hashlib.sha256((ROOT/'agent-baseline.js').read_bytes()).hexdigest(),
                  'trainingScenarios':SCENARIOS,'samples':len(actions),'episodes':len(outcomes),
                  'limitation':'Fixed training fixtures only. Failed episodes retained for filtering; no automatic training.'}
        (args.out/'manifest.json').write_text(json.dumps(manifest,indent=2))
        (args.out/'outcomes.json').write_text(json.dumps(outcomes,indent=2))
        (args.out/'complete.json').write_text(json.dumps({'episodes':len(outcomes),'samples':len(actions)}))
        print(json.dumps({'episodes':len(outcomes),'samples':len(actions),
                          'cleared':sum(r['status']=='cleared' for r in outcomes),
                          'clearedWithoutHealthLoss':sum(r['status']=='cleared' and r['health']>=r['initialHealth'] for r in outcomes)}),flush=True)
    finally:
        env.close()


if __name__=='__main__':
    main()
