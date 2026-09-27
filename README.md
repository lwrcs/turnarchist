# Turnarchist

A turn-based roguelike for the browser, with a Canvas renderer and a browser-backed agent simulation and training interface. The browser game is bundled with Webpack; the Electron wrapper under `electron/` packages it for Windows and macOS.

## Local play

Use the Node version in `.node-version` (also constrained by `package.json`). From the repository root:

```sh
npm ci
npm run watch
python training/local_server.py
```

Open `http://127.0.0.1:8000/play.html`. The local server also supports saving teaching recordings from `teach.html`. Run the server and watcher in separate terminals. If a watcher is already running, reuse it rather than starting another process that writes `dist/`.

## Checks

```sh
npm run typecheck
npm test
npm run test:horizon
```

The Python training tools use the separate environment described in `training/README.md`. In that environment, run the root and Horizon Python suites separately:

```sh
python -m unittest discover -s training -p 'test_*.py'
python -m unittest discover -s training/tests -p 'horizon*_tests.py'
```

These focused suites do not replace a real-browser game check. See `electron/README.md` for desktop packaging and `documentation/agent-training.md` for agent compatibility. The current engineering checklist and validated results are in `documentation/engineering-stabilization-2026-09-27.md`.

## Web release staging

After the checks, stage a fresh production bundle and tracked web assets into a new directory outside the checkout:

```sh
npm run stage:web -- --out /path/to/new-stage
npm run stage:web -- --verify /path/to/new-stage
```

The staging command refuses an existing destination or dirty source by default. Use `--allow-dirty` only for a diagnostic artifact. `release-manifest.json` records the source revision, package version, default gameplay settings identity, build inputs, and hashes of every staged file, including unbundled scripts and authored level images. Verification detects missing, extra, or changed files. It does not certify live gameplay or offline behavior; those remain separate release checks.

The root `package.json` version is the game release version. The in-game label, agent contract, and packaged Electron app derive their game version from it. Save, replay, generation, observation/action, planning, and model schema versions are separate compatibility boundaries. `electron/package.json` describes the private wrapper package and is not used for the packaged game's version.
