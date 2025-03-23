const fs = require("fs");
const path = require("path");

const mapFilePath = path.resolve(__dirname, "dist/bundle.js.map"); // adjust if needed
const outputDir = path.resolve(__dirname, "gpt_export");
const outputFile = path.join(outputDir, "source_bundle.txt");

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir);
}

// Read and parse the map file
const rawMap = fs.readFileSync(mapFilePath, "utf-8");
const map = JSON.parse(rawMap);

const sources = map.sources || [];
const sourcesContent = map.sourcesContent || [];

if (sources.length !== sourcesContent.length) {
  console.error("Mismatch between sources and sourcesContent lengths.");
  process.exit(1);
}

let fullOutput = "";
let includedFiles = 0;

for (let i = 0; i < sources.length; i++) {
  const originalPath = sources[i];
  const content = sourcesContent[i];

  // Skip vendor code from node_modules or webpack/runtime
  if (
    originalPath.includes("node_modules") ||
    originalPath.includes("webpack/runtime") ||
    originalPath.includes("__webpack") ||
    originalPath.includes("@babel")
  ) {
    continue;
  }

  // Normalize the path for clarity
  let cleanPath = originalPath
    .replace(/^webpack:\/\/[^/]+\/\.\//, "") // remove webpack:// prefix
    .replace(/^(\.\.\/)+/, "") // remove ../
    .replace(/^\.\//, ""); // remove ./

  fullOutput += `--- ${cleanPath} ---\n${content}\n\n`;
  includedFiles++;
}

// Write the combined output file
fs.writeFileSync(outputFile, fullOutput, "utf-8");
console.log(`✅ Extracted ${includedFiles} TypeScript files to ${outputFile}`);
