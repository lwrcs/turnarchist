"""Small demonstration updates between PPO rollouts; no evaluation-time learning."""
import hashlib
from collections import deque
import numpy as np
import torch
from stable_baselines3.common.callbacks import BaseCallback


class Rehearsal(BaseCallback):
    def __init__(self,groups,rate=.001,rejection_feedback=False):
        super().__init__()
        self.groups=groups
        self.rate=rate
        self.rng=np.random.default_rng(123)
        self.started=False
        self.updates=0
        self.rejection_feedback=rejection_feedback
        self.rejections=deque(maxlen=256)

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
        if self.rejections:
            indices=self.rng.integers(len(self.rejections),size=32)
            samples=[self.rejections[i] for i in indices]
            x=torch.as_tensor(np.stack([s[0] for s in samples]),device=self.model.device)
            y=torch.as_tensor([s[1] for s in samples],dtype=torch.long,device=self.model.device)
            logits=self.model.policy.get_distribution(x).distribution.logits
            rejected=torch.nn.functional.one_hot(y,num_classes=logits.shape[1]).bool()
            penalty=-torch.logsumexp(logits.masked_fill(rejected,-torch.inf),dim=1).mean()
            loss=loss+.5*penalty
            self.logger.record('rehearsal/rejection_loss',float(penalty.detach()))
            self.logger.record('rehearsal/rejection_samples',len(self.rejections))
        if not torch.isfinite(loss): raise RuntimeError('Nonfinite rehearsal loss')
        self.optimizer.zero_grad(set_to_none=True)
        loss.backward()
        torch.nn.utils.clip_grad_norm_(self.model.policy.parameters(),.5,error_if_nonfinite=True)
        self.optimizer.step()
        self.optimizer.zero_grad(set_to_none=True)
        self.updates+=1
        self.logger.record('rehearsal/loss',float(loss.detach()))
        self.logger.record('rehearsal/updates',self.updates)

    def _on_step(self):
        if self.rejection_feedback:
            for i,info in enumerate(self.locals.get('infos',[])):
                if 'rejectedAction' in info:
                    self.rejections.append((np.asarray(self.locals['new_obs'][i],dtype=np.float32).copy(),info['rejectedAction']))
        return True


def configure(navigation,combat,contract,rejection_feedback=False):
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
              'rejectionFeedback':{'enabled':rejection_feedback,'version':1,'coefficient':.5,'capacity':256,
                                   'selection':'unrecorded zero-turn action with identical policy observations; nonterminal only',
                                   'resume':'rejection buffer starts empty'},
              'datasets':{str(p):hashlib.sha256((p/'demonstrations.npz').read_bytes()).hexdigest()
                          for p in [navigation,combat]}}
    return Rehearsal([(x,y),(cx,cy)],rejection_feedback=rejection_feedback),metadata
