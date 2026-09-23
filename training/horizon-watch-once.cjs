#!/usr/bin/env node
/* One development WATCH cycle, then close only our own watcher. Never production-build. */
'use strict';
const fs = require('node:fs'), path = require('node:path');
const root = path.resolve(__dirname, '..');
let watcher, compiler, finished = false, watchdog;
function finish(error) {
  if (finished) return; finished = true; clearTimeout(watchdog);
  const done = () => { if (error) console.error(String(error.message || error)); process.exitCode = error ? 1 : 0; };
  const closeCompiler = () => compiler?.close ? compiler.close(closeError => { if (closeError) error = error || closeError; done(); }) : done();
  if (watcher) watcher.close(closeError => { if (closeError) error = error || closeError; closeCompiler(); }); else closeCompiler();
}
try {
  process.chdir(root);
  const webpack = require(path.join(root, 'node_modules/webpack'));
  const configFile = path.join(root, 'webpack.config.js');
  if (!fs.existsSync(configFile)) throw new Error('Expected webpack.config.js; do not guess an alternate config');
  const config = require(configFile);
  if (!config || Array.isArray(config) || typeof config !== 'object' || config.mode !== 'development') {
    throw new Error('Expected the inspected single development config; use the approved existing watcher for changed configurations');
  }
  compiler = webpack(config);
  watchdog = setTimeout(() => finish(new Error('Development watcher exceeded its 180-second budget')), 180000);
  process.once('SIGTERM', () => finish(new Error('Development watcher interrupted')));
  process.once('SIGINT', () => finish(new Error('Development watcher interrupted')));
  watcher = compiler.watch({ ...(config.watchOptions || {}), aggregateTimeout: 200, poll: 1000 }, (error, stats) => {
    if (error) return finish(error);
    console.log(stats.toString({ all: false, errors: true, warnings: true, timings: true, hash: true }));
    if (stats.hasErrors()) return finish(new Error('Development compilation failed; inspect the logged source errors'));
    // Defer close until compiler.watch has returned its handle, even with a synchronous test stub.
    setImmediate(() => finish(null));
  });
} catch (error) { finish(error); }
