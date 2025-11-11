const fs = require("fs");
const path = require("path");

const yamlPath = path.join(process.cwd(), "content", "_data", "figures.yaml");
const imgRoot = path.join(process.cwd(), "content", "_assets", "images");

const text = fs.readFileSync(yamlPath, "utf8");
const lines = text.split(/\r?\n/);

let currentId = null;
const pairs = [];

for (let line of lines) {
  let m = line.match(/^\s*(?:-\s*)?id:\s*["']?([^"']+?)["']?\s*$/);
  if (m) { currentId = m[1].trim(); continue; }

  m = line.match(/^\s*src:\s*["']?([^"']+?)["']?\s*$/);
  if (m) { pairs.push({ id: currentId || "(unknown)", src: m[1].trim() }); }
}

const missing = [];
for (const { id, src } of pairs) {
  const p = path.join(imgRoot, src);
  if (!fs.existsSync(p)) missing.push({ id, src, expected: p });
}

if (missing.length === 0) {
  console.log("✅ All figure src files exist under:", imgRoot);
} else {
  console.log("❌ Missing figure images (" + missing.length + "):");
  console.table(missing);
  console.log("\n→ Try: git lfs pull   (if these are large image files)\n");
}
