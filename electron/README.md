# Turnarchist Electron build

Wraps the browser game as an Electron app so it can be shipped through Steam.

The root repo (dev loop, file structure, `play.html`) is untouched by anything in this directory. All Electron-specific concerns live here.

## Commands

Run from inside `electron/`:

```bash
npm install          # one-time: installs electron + @electron/packager
npm start            # stages app/ and launches the game in an Electron window
npm run pack:win     # produces electron/dist/Turnarchist-win32-x64/ — Steam Windows depot
npm run pack:mac     # produces electron/dist/Turnarchist-darwin-x64/
npm run pack:mac-arm # produces electron/dist/Turnarchist-darwin-arm64/
npm run pack         # runs all three
```

The parent repo must have had `npm install` run at least once so `../node_modules/.bin/webpack` exists. You do not need to run `npm run build` in the root — `build.js` invokes webpack directly with its own config.

## Layout

```
electron/
├── package.json                 # separate — declares electron, @electron/packager
├── main.js                      # Electron main process
├── preload.js                   # empty; exists for contextIsolation hygiene
├── play.electron.html           # Electron entrypoint HTML (committed)
├── webpack.electron.config.js   # webpack config for the Electron bundle
├── build.js                     # stages everything into app/
├── pack.js                      # wraps @electron/packager (invoked by pack:* scripts)
├── app/                         # [generated] what Electron actually loads
└── dist/                        # [generated] per-platform packaged output
```

## Architecture

### Why staged `app/` instead of loading files from the repo directly

Electron loads files via `file://`. The game expects all its assets (the game bundle, `res/`, `style.css`) to sit in a single directory next to the HTML. Staging them into `app/` keeps the root repo clean and avoids any path cross-talk.

`build.js`:

1. Wipes `app/`.
2. Runs webpack using `webpack.electron.config.js` — outputs `app/dist/bundle.js` and `app/dist/assets/*.png`.
3. Copies `../res/` → `app/res/` (audio, level PNGs, fonts, favicons).
4. Copies `../style.css` → `app/style.css`.
5. Copies `play.electron.html` → `app/play.html`.

Asset copying is straight `fs.cpSync`. Rerun `npm start` after changing any resource.

### Why a separate webpack config

The root `webpack.config.js` sets `output.publicPath: "/dist/"`. Under `file://` that becomes `file:///dist/...` and every hashed image 404s. `webpack.electron.config.js` inherits from the root config and overrides:

- `publicPath: "auto"` — webpack resolves asset URLs relative to where `bundle.js` was loaded from. Works under both `http://` and `file://`.
- `mode: "production"` — smaller bundle for shipping.
- `devtool: false` — no source maps in the Steam build.

The root config is not modified, so the GitHub Pages build is unaffected.

### Why a separate HTML entrypoint

`play.electron.html` is a trimmed copy of the root `play.html`. It drops:

- Google Tag Manager (`gtag.js`) and legacy `analytics.js` — no network, no tracking.
- Service worker registration — irrelevant for a local `file://` app.
- Cache-busting timestamp on the `<script>` tag — nothing to cache-bust locally.
- PWA manifest link and `apple-touch-icon` — web-only concepts.

It keeps the `<canvas id="gameCanvas">`, the viewport meta, `theme-color`, and the CSS link. The bundle loads with a plain `<script src="dist/bundle.js"></script>`.

### Storage under `file://`

`src/utility/cookies.ts` already falls back to `localStorage` when `document.cookie` is unavailable. Electron's `file://` renderer blocks cookies by default, so the fallback engages automatically. No changes needed in `src/`.

### Telemetry and external links

`src/api/index.ts` (stats beacon) and `src/gui/feedbackButton.ts` (Google Form link) are wrapped in try/catch and will no-op if the player is offline. They're left in place — nothing to strip.

## Handing the build to Steam

1. `npm run pack:win` → upload `electron/dist/Turnarchist-win32-x64/` as a Steam Windows depot. `Turnarchist.exe` sits at the top of the folder.
2. `npm run pack:mac` / `npm run pack:mac-arm` → upload `Turnarchist-darwin-x64/` or `Turnarchist-darwin-arm64/` as macOS depots. Each folder contains `Turnarchist.app`.

Notes:

- macOS builds can be produced from Windows (unsigned `.app` bundle). Apple code-signing/notarization requires a macOS host, but Steam doesn't require notarization — an unsigned mac build works for a Steam depot.
- Icons: the executable icon is generated automatically at pack time from `res/favicon_maskable.png` (512×512). `pack.js` uses `png2icons` to produce `build-resources/icon.ico` and `icon.icns`, then hands the basename to `@electron/packager`, which picks the right extension per platform. To change the icon, swap the source PNG or edit `iconSourcePng` in `pack.js`.
- The first packaging run downloads the Electron binary for each target platform (~80–100 MB each); subsequent runs are cached in `~/.electron`.
- Why not `electron-builder`? On Windows without Developer Mode enabled, electron-builder fails while extracting its macOS code-signing toolchain (symlink permission errors). `@electron/packager` has no signing dependencies and sidesteps this entirely.
