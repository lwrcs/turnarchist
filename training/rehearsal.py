"""Small demonstration updates between PPO rollouts; no evaluation-time learning."""
import hashlib
import numpy as np
import torch
from stable_baselines3.common.callbacks import BaseCallback


class Rehearsal(BaseCallback):
    def __init__(self,groups,rate=.001):
        super().__init__()
        self.groups=groups
        self.rate=rate
        self.rng=np.random.default_rng(123)
        self.started=False
        self.updates=0

    def _on_training_start(self):
        # Stateless SGD leaves PPO's Adam moments intact. No optimizer state to resume.
        self.optimizer=torch.optim.SGD(self.model.policy.parameters(),lr=self.rate)

    def _on_rollout_start(self):
        if not self.started:
            self.started=True
            return
        self.update()

    def update(self):
        self.model.policy.set_training_mode(True)
        xs=[]; ys=[]
        for x,y in self.groups:
            indices=self.rng.integers(len(x),size=32)
            xs.append(torch.as_tensor(x[indices],device=self.model.device))
            ys.append(torch.as_tensor(y[indices],dtype=torch.long,device=self.model.device))
        loss=-self.model.policy.get_distribution(torch.cat(xs)).log_prob(torch.cat(ys)).mean()
        if not torch.isfinite(loss): raise RuntimeError('Nonfinite rehearsal loss')
        self.optimizer.zero_grad(set_to_none=True)
        loss.backward()
        torch.nn.utils.clip_grad_norm_(self.model.policy.parameters(),.5,error_if_nonfinite=True)
        self.optimizer.step()
        self.optimizer.zero_grad(set_to_none=True)
        self.updates+=1
        self.logger.record('rehearsal/loss',float(loss.detach()))
        self.logger.record('rehearsal/updates',self.updates)

    def _on_step(self): return True


def configure(navigation,combat,contract):
    from dungeon_imitation import load_navigation
    from imitate import load_demonstrations
    from dungeon_pilot import OBS_SIZE
    from combat_pilot import SIZE
    x,y,nav=load_navigation(navigation)
    cx,cy,other=load_demonstrations(combat)
    if nav['gameContract']!=contract or other['gameContract']!=contract:
        raise ValueError('Rehearsal game contract mismatch')
    cx=np.pad(cx,((0,0),(0,OBS_SIZE-SIZE*2)))
    metadata={'version':1,'method':'one SGD demonstration update between PPO rollouts',
              'rate':.001,'batch':'32 navigation + 32 combat','rngSeed':123,
              'resume':'sampling RNG restarts; SGD has no momentum',
              'datasets':{str(p):hashlib.sha256((p/'demonstrations.npz').read_bytes()).hexdigest()
                          for p in [navigation,combat]}}
    return Rehearsal([(x,y),(cx,cy)]),metadata
