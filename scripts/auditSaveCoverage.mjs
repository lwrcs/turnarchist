#!/usr/bin/env node
/**
 * Save coverage audit — zero dependencies.
 *
 * Scans src/entity/ and src/item/ for concrete classes, then checks whether
 * each class is mapped in the save codec registries (entityToKind / itemToKind
 * in enemiesBuiltins.ts / itemsBuiltins.ts).
 *
 * A class is "covered" if it or any of its ancestors appears in the instanceof
 * mapping chain (e.g. wizard subclasses are covered by instanceof WizardEnemy).
 *
 * Run: node scripts/auditSaveCoverage.mjs
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

function walk(dir, ext = ".ts") {
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) results.push(...walk(full, ext));
    else if (entry.isFile() && entry.name.endsWith(ext)) results.push(full);
  }
  return results;
}

function readFile(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

// ---------------------------------------------------------------------------
// 1. Collect concrete classes from source directories
// ---------------------------------------------------------------------------

const BASE_ENTITY_CLASSES = new Set([
  "Entity", "Enemy", "Drawable", "Resource", "Projectile",
]);

const BASE_ITEM_CLASSES = new Set([
  "Item", "Weapon", "Light", "Equippable", "Usable",
]);

// Utility classes that are not spawnable room entities / pickup items
const SKIP_ENTITY_CLASSES = new Set([
  "EnemyAIHandler",
  "ChestLayer",
  "Drop",
  "DownladderMaker", // level-transition helper, not a room entity
  "DownLadderMaker",
]);

const SKIP_ITEM_CLASSES = new Set([
  "ItemGroup",
  "XpCrystal",    // base; MeleeXpCrystal / MagicXpCrystal / RangedXpCrystal registered individually
  "Pickable",
  "DropTable",    // data utility, not a pickup item
]);

/**
 * Returns [{ className, filePath, extendsClass, isAbstract }].
 */
function collectClasses(dir, baseClassExclusions) {
  const files = walk(dir);
  const results = [];
  // Match: [export] [abstract] class ClassName [extends Parent]
  const re = /^(export\s+)?(abstract\s+)?class\s+(\w+)(?:\s+extends\s+(\w+))?/gm;
  for (const filePath of files) {
    const src = readFile(filePath);
    let m;
    re.lastIndex = 0;
    while ((m = re.exec(src)) !== null) {
      const isExported = !!m[1];
      const isAbstract = !!m[2];
      const className = m[3];
      const extendsClass = m[4] ?? null;
      if (!isExported) continue;
      if (baseClassExclusions.has(className)) continue;
      results.push({ className, filePath: path.relative(ROOT, filePath), extendsClass, isAbstract });
    }
  }
  return results;
}

const entityClasses = collectClasses(
  path.join(ROOT, "src", "entity"),
  BASE_ENTITY_CLASSES,
);

const itemClasses = collectClasses(
  path.join(ROOT, "src", "item"),
  BASE_ITEM_CLASSES,
);

// ---------------------------------------------------------------------------
// 2. Extract instanceof → kind mappings from codec files
// ---------------------------------------------------------------------------

/**
 * Extracts all `if (X instanceof Y) return "kind"` mappings.
 * Returns Map<className, kindString>.
 */
function extractInstanceofMappings(filePath) {
  const src = readFile(filePath);
  const map = new Map();
  const re = /if\s*\(\w+\s+instanceof\s+(\w+)\)\s+return\s+"([^"]+)"/g;
  let m;
  while ((m = re.exec(src)) !== null) {
    map.set(m[1], m[2]);
  }
  return map;
}

const enemyMappings = extractInstanceofMappings(
  path.join(ROOT, "src", "game", "save", "registry", "enemiesBuiltins.ts"),
);

const itemMappings = extractInstanceofMappings(
  path.join(ROOT, "src", "game", "save", "registry", "itemsBuiltins.ts"),
);

// ---------------------------------------------------------------------------
// 3. Build inheritance map for "covered via parent" checks
// ---------------------------------------------------------------------------

/**
 * Given a className and an inheritance map, walk up the chain and return true
 * if this class or any ancestor is in the given mappings set.
 */
function isCoveredViaInheritance(className, extendsMap, mappings) {
  let current = className;
  const seen = new Set();
  while (current && !seen.has(current)) {
    seen.add(current);
    if (mappings.has(current)) return true;
    current = extendsMap.get(current) ?? null;
  }
  return false;
}

// Build extends maps: className → parentClassName
const entityExtendsMap = new Map(
  entityClasses.filter((c) => c.extendsClass).map((c) => [c.className, c.extendsClass]),
);
const itemExtendsMap = new Map(
  itemClasses.filter((c) => c.extendsClass).map((c) => [c.className, c.extendsClass]),
);

// ---------------------------------------------------------------------------
// 4. Cross-reference and report
// ---------------------------------------------------------------------------

let entityGaps = 0;
let itemGaps = 0;

console.log("\n=== ENTITY COVERAGE AUDIT ===\n");

const unmappedEntities = entityClasses.filter(({ className, isAbstract }) => {
  if (isAbstract) return false; // abstract classes can't be instantiated
  if (SKIP_ENTITY_CLASSES.has(className)) return false;
  return !isCoveredViaInheritance(className, entityExtendsMap, enemyMappings);
});

if (unmappedEntities.length === 0) {
  console.log("  All concrete entity classes are mapped (directly or via parent).\n");
} else {
  for (const { className, filePath } of unmappedEntities) {
    console.log(`  ✗ ${className.padEnd(30)} (${filePath})`);
    entityGaps++;
  }
  console.log();
}

// Orphan kinds (mapped but class not found in entity files)
const entityClassNames = new Set(entityClasses.map((c) => c.className));
const orphanEntityKinds = [...enemyMappings.entries()].filter(
  ([cls]) => !entityClassNames.has(cls) && !SKIP_ENTITY_CLASSES.has(cls) && !BASE_ENTITY_CLASSES.has(cls),
);
if (orphanEntityKinds.length > 0) {
  console.log("  Orphan entity kinds (class no longer exists):");
  for (const [cls, kind] of orphanEntityKinds) {
    console.log(`    ✗ "${kind}" references missing class ${cls}`);
    entityGaps++;
  }
  console.log();
}

console.log("=== ITEM COVERAGE AUDIT ===\n");

const unmappedItems = itemClasses.filter(({ className, isAbstract }) => {
  if (isAbstract) return false;
  if (SKIP_ITEM_CLASSES.has(className)) return false;
  return !isCoveredViaInheritance(className, itemExtendsMap, itemMappings);
});

if (unmappedItems.length === 0) {
  console.log("  All concrete item classes are mapped (directly or via parent).\n");
} else {
  for (const { className, filePath } of unmappedItems) {
    console.log(`  ✗ ${className.padEnd(30)} (${filePath})`);
    itemGaps++;
  }
  console.log();
}

// Orphan kinds (mapped but class not found in item files)
const itemClassNames = new Set(itemClasses.map((c) => c.className));
const orphanItemKinds = [...itemMappings.entries()].filter(
  ([cls]) => !itemClassNames.has(cls) && !SKIP_ITEM_CLASSES.has(cls) && !BASE_ITEM_CLASSES.has(cls),
);
if (orphanItemKinds.length > 0) {
  console.log("  Orphan item kinds (class no longer exists):");
  for (const [cls, kind] of orphanItemKinds) {
    console.log(`    ✗ "${kind}" references missing class ${cls}`);
    itemGaps++;
  }
  console.log();
}

// ---------------------------------------------------------------------------
// 5. Summary
// ---------------------------------------------------------------------------

const total = entityGaps + itemGaps;
console.log(
  `=== SUMMARY: ${total} gap(s) — ${entityGaps} entity, ${itemGaps} item ===\n`,
);

process.exit(0); // gaps are warnings, not hard errors
