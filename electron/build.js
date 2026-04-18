#!/usr/bin/env node
// Stages the game into electron/app/ so Electron can load it via file://.
//
// Steps:
//   1. Wipe electron/app/
//   2. Run webpack with webpack.electron.config.js (outputs to app/dist/)
//   3. Copy res/ and style.css from the repo root into app/
//   4. Copy play.electron.html -> app/play.html

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const electronDir = __dirname;
const repoRoot = path.resolve(electronDir, "..");
const appDir = path.join(electronDir, "app");

function log(msg) {
  process.stdout.write(`[electron-build] ${msg}\n`);
}

function wipeAppDir() {
  if (fs.existsSync(appDir)) {
    log("clearing app/");
    fs.rmSync(appDir, { recursive: true, force: true });
  }
  fs.mkdirSync(appDir, { recursive: true });
}

function runWebpack() {
  log("running webpack (production)");
  const webpackBin = path.join(
    repoRoot,
    "node_modules",
    ".bin",
    process.platform === "win32" ? "webpack.cmd" : "webpack",
  );
  const configPath = path.join(electronDir, "webpack.electron.config.js");
  execSync(`"${webpackBin}" --config "${configPath}"`, {
    cwd: repoRoot,
    stdio: "inherit",
  });
}

function copyTree(src, dst) {
  log(`copying ${path.relative(repoRoot, src)} -> ${path.relative(electronDir, dst)}`);
  fs.cpSync(src, dst, { recursive: true });
}

function stageStaticAssets() {
  copyTree(path.join(repoRoot, "res"), path.join(appDir, "res"));
  copyTree(path.join(repoRoot, "style.css"), path.join(appDir, "style.css"));
  copyTree(
    path.join(electronDir, "play.electron.html"),
    path.join(appDir, "play.html"),
  );
}

function main() {
  wipeAppDir();
  runWebpack();
  stageStaticAssets();
  log("done.");
}

main();
