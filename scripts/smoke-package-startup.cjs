// Exercise real server and bot entrypoints while confining integrations locally.
const {spawn} = require('node:child_process');
const net = require('node:net');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const timeout = ms => new Promise(resolve => setTimeout(resolve, ms));

async function freePort() {
  const server = net.createServer();
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port;
  await new Promise(resolve => server.close(resolve));
  return port;
}

function launch(cwd, args, env) {
  const child = spawn(process.execPath, args, {cwd, env: {...process.env, ...env},
    windowsHide: true, stdio: ['ignore', 'pipe', 'pipe']});
  let output = '';
  child.stdout.on('data', chunk => { output += chunk; });
  child.stderr.on('data', chunk => { output += chunk; });
  return {child, get output() { return output; }};
}

async function stop(run) {
  if (run.child.exitCode !== null || run.child.signalCode !== null) return;
  const exited = new Promise(resolve => run.child.once('exit', resolve));
  run.child.kill();
  await Promise.race([exited, timeout(3000)]);
  if (run.child.exitCode === null && run.child.signalCode === null) throw new Error('Smoke child did not exit');
}

async function serverSmoke() {
  const port = await freePort();
  const run = launch(path.join(root, 'server'), ['--import', 'tsx', 'src/index.ts'], {
    NODE_ENV: 'package_startup_smoke', PORT: String(port),
    DATABASE_URL: 'postgres://smoke:smoke@127.0.0.1:1/smoke', ANTHROPIC_API_KEY: '',
  });
  try {
    let response;
    for (let i = 0; i < 100; i++) {
      if (run.child.exitCode !== null) throw new Error(`Server exited: ${run.output}`);
      try { response = await fetch(`http://127.0.0.1:${port}/does-not-exist`); break; }
      catch { await timeout(100); }
    }
    if (response?.status !== 404) throw new Error(`Server did not start: ${run.output}`);
    const oracle = await fetch(`http://127.0.0.1:${port}/api/v1/claude/ask`, {
      method: 'POST', headers: {'content-type': 'application/json'},
      body: JSON.stringify({question: 'How do I move?', gameContext: '', dynamicContext: ''}),
    });
    if (oracle.status !== 503 || (await oracle.json()).message !== 'Oracle is not configured.') {
      throw new Error(`Unexpected local oracle route status: ${oracle.status}`);
    }
    const invalidStats = await fetch(`http://127.0.0.1:${port}/api/v1/game/stats`, {
      method: 'POST', headers: {'content-type': 'application/json'}, body: '{}',
    });
    if (invalidStats.status !== 400) throw new Error(`Stats validation status: ${invalidStats.status}`);
    console.log(`TURNARCHIST_SERVER_STARTUP_SMOKE_OK ${JSON.stringify({port, notFound:404, oracle:503, invalidStats:400})}`);
  } finally { await stop(run); }
}

async function botSmoke() {
  const run = launch(path.join(root, 'bot'), [
    '--require', path.join(root, 'bot', 'tests', 'mock-startup.cjs'),
    '--import', 'tsx', 'src/index.ts',
  ], {DISCORD_BOT_TOKEN: 'startup-smoke-token', DISCORD_CLIENT_ID: '123456789012345678',
    ANTHROPIC_API_KEY: 'startup-smoke-key'});
  try {
    for (let i = 0; i < 100; i++) {
      if (run.output.includes('TURNARCHIST_BOT_STARTUP_SMOKE_OK') &&
          run.output.includes('Slash commands registered.')) {
        console.log('TURNARCHIST_BOT_ENTRYPOINT_OK');
        return;
      }
      if (run.child.exitCode !== null) throw new Error(`Bot exited: ${run.output}`);
      await timeout(100);
    }
    throw new Error(`Bot startup timed out: ${run.output}`);
  } finally { await stop(run); }
}

(async () => { await serverSmoke(); await botSmoke(); })().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
