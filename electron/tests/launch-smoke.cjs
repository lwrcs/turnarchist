// Run with the installed Electron executable, not Node. Uses a hidden window.
const {app, BrowserWindow} = require('electron');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const userData = fs.mkdtempSync(path.join(os.tmpdir(), 'turnarchist-electron-smoke-'));
process.on('exit', () => {
  const target = path.resolve(userData);
  const tempRoot = path.resolve(os.tmpdir());
  if (target.startsWith(tempRoot + path.sep) && path.basename(target).startsWith('turnarchist-electron-smoke-')) {
    try { fs.rmSync(target, {recursive: true, force: true}); } catch { /* Electron may still hold a file. */ }
  }
});
app.setPath('userData', userData);
process.env.ELECTRON_USERDATA = userData;
app.commandLine.appendSwitch('disable-gpu');

async function run() {
  const win = new BrowserWindow({
    width: 544, height: 544, show: false,
    webPreferences: {
      preload: path.resolve(__dirname, '..', 'preload.js'),
      contextIsolation: true, nodeIntegration: false, sandbox: false,
    },
  });
  const failed = [];
  win.webContents.on('did-fail-load', (_event, code, description, url) => {
    failed.push({code, description, url});
  });
  await win.loadFile(path.resolve(__dirname, '..', 'app', 'play.html'), {search: '?agent=1'});
  const deadline = Date.now() + 20000;
  let state;
  do {
    state = await win.webContents.executeJavaScript(`(() => {
      const game=window.agent?.game, ctor=game?.constructor;
      return {loaded:!!game, rooms:game?.level?.rooms?.length??0,
        images:ctor ? Object.fromEntries(['tileset','objset','mobset','playerset','itemset','fxset','fontsheet']
          .map(name=>[name,ctor[name]?.naturalWidth??0])) : {},
        saveBridge:!!window.electronSave};
    })()`);
    if (state.loaded && Object.values(state.images).length === 7 &&
        Object.values(state.images).every(width => width > 0)) break;
    await new Promise(resolve => setTimeout(resolve, 100));
  } while (Date.now() < deadline);
  if (!state.loaded || state.rooms < 1 || Object.values(state.images).some(width => width < 1) ||
      !state.saveBridge || failed.length) {
    throw new Error(`Renderer failed: ${JSON.stringify({state, failed})}`);
  }
  const save = await win.webContents.executeJavaScript(`(() => {
    const bridge=window.electronSave;
    bridge.write('autosave','{"smoke":1}');
    const read=bridge.read('autosave');
    bridge.remove('autosave');
    return {read, removed:!bridge.exists('autosave')};
  })()`);
  if (save.read !== '{"smoke":1}' || !save.removed) throw new Error('Preload save bridge failed');
  console.log('TURNARCHIST_ELECTRON_SMOKE_OK ' + JSON.stringify({rooms: state.rooms,
    images: state.images, saveBridge: true, userData, failedRequests: failed.length}));
  win.destroy();
  app.exit(0);
}

app.whenReady().then(run).catch(error => {
  console.error('TURNARCHIST_ELECTRON_SMOKE_FAILED', error);
  app.exit(1);
});
