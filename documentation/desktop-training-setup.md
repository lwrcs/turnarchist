# Turnarchist desktop training setup

Verified 2026-09-08. Development remains on the Mac; the Windows desktop runs
WSL2 Ubuntu 26.04 in the `TurnarchistTraining` distribution. Its virtual disk
lives at `E:\WSL\TurnarchistTraining`. Use the Linux filesystem for dependencies,
checkouts, datasets and checkpoints; C: has little free space.

The default Linux user is `harrison` (no Linux password configured). Windows SSH
authentication is separate. Administrative setup can use `wsl -d
TurnarchistTraining -u root`; ordinary work should use the default user.

The Python environment is `/home/harrison/turnarchist-training/.venv`.
Activate it inside Ubuntu with:

```sh
source /home/harrison/turnarchist-training/.venv/bin/activate
```

Verified packages: Python 3.14.4, PyTorch 2.14.0+cu126 (CUDA 12.6),
Gymnasium 1.3.0, Stable Baselines3 2.9.0 and sb3-contrib 2.9.0.
TensorBoard, Git and tmux are installed. PyTorch came from its official
CUDA 12.6 index; RL packages came from PyPI and system tools from Ubuntu.

The RTX 3080 Ti is visible inside WSL. A 100-update GPU learning smoke check
reduced synthetic regression loss from 9.539 to 0.795. A separate 128-step
CartPole PPO check on CPU saved and reloaded a checkpoint with identical
deterministic predictions. Results and the toy checkpoint are under
`/home/harrison/turnarchist-training/`; they are not game training artifacts.

A first browser-backed game-to-Python combat pilot now lives in `training/`.
It includes restricted observation encoding, a five-action schema, PPO training,
reward v1, checkpoint loading with compatibility checks and small evaluations.
See `training/README.md` for commands and limitations. This is a narrow combat
experiment, not a complete dungeon agent or full headless simulation.

Keep the desktop awake during runs. The Mac must also remain awake and
connected for active development and SSH control. A future detached desktop
job should survive SSH disconnection; verify that behavior before unattended
training. WSL's reported virtual filesystem capacity is not the host drive's
actual available space: check E: before large downloads or dataset generation.
