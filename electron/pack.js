#!/usr/bin/env node
// Packages the staged app into a platform-specific folder Steam can consume.
// Usage: node pack.js <platform> <arch>
//   platform: win32 | darwin | linux
//   arch:     x64 | arm64
//
// Runs build.js first to stage app/, then invokes @electron/packager.

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const { packager } = require("@electron/packager");
const png2icons = require("png2icons");

const [, , platform = "win32", arch = "x64"] = process.argv;

const electronDir = __dirname;
const repoRoot = path.resolve(electronDir, "..");
const iconSourcePng = path.join(repoRoot, "res", "favicon_maskable.png");
const buildResourcesDir = path.join(electronDir, "build-resources");
const iconBasename = path.join(buildResourcesDir, "icon"); // passed to packager without extension

function log(msg) {
  process.stdout.write(`[electron-pack] ${msg}\n`);
}

function generateIcons() {
  log(`generating icons from ${path.relative(repoRoot, iconSourcePng)}`);
  fs.mkdirSync(buildResourcesDir, { recursive: true });
  const png = fs.readFileSync(iconSourcePng);

  const ico = png2icons.createICO(png, png2icons.BILINEAR, 0, false, true);
  if (!ico) throw new Error("png2icons failed to produce ICO");
  fs.writeFileSync(`${iconBasename}.ico`, ico);

  const icns = png2icons.createICNS(png, png2icons.BILINEAR, 0);
  if (!icns) throw new Error("png2icons failed to produce ICNS");
  fs.writeFileSync(`${iconBasename}.icns`, icns);
}

log(`staging app/ via build.js`);
execSync("node build.js", { cwd: electronDir, stdio: "inherit" });

generateIcons();

log(`packaging platform=${platform} arch=${arch}`);

packager({
  dir: electronDir,
  name: "Turnarchist",
  appVersion: require("./package.json").version,
  platform,
  arch,
  out: path.join(electronDir, "dist"),
  overwrite: true,
  prune: true,
  icon: iconBasename,
  // Regex patterns matched against paths relative to electronDir (leading "/").
  // Ignore our own build outputs and files that don't need to ship.
  ignore: [
    /^\/dist($|\/)/,
    /^\/build-resources($|\/)/,
    /^\/pack\.js$/,
    /^\/build\.js$/,
    /^\/webpack\.electron\.config\.js$/,
    /^\/play\.electron\.html$/,
    /^\/README\.md$/,
    /^\/\.gitignore$/,
  ],
})
  .then((appPaths) => {
    for (const p of appPaths) log(`built: ${p}`);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
