const fs = require("fs");
const path = require("path");
const yaml = require("js-yaml");

function load(p) {
  if (!fs.existsSync(p)) return null;
  return p.endsWith(".json")
    ? JSON.parse(fs.readFileSync(p, "utf8"))
    : yaml.load(fs.readFileSync(p, "utf8"));
}

const base = path.join(process.cwd(), "content", "_data");
const data = load(path.join(base, "objects.yaml")) || load(path.join(base, "objects.json"));
if (!data) { console.error("❌ no objects data"); process.exit(1); }

const allObjects = Array.isArray(data) ? data : (data.object_list || data.objects || []);
const filtersDef = data.object_filters || data.filters || [];
const filterOrder = data.object_display_order || data.filter_order || [];

console.log("filtersDef count:", Array.isArray(filtersDef) ? filtersDef.length : 0);
console.log("filterOrder:", Array.isArray(filterOrder) ? filterOrder : "(none)");

function get(pathStr, obj) {
  // supports dot paths like "foo.bar"
  return pathStr.split(".").reduce((acc, key) => acc && acc[key], obj);
}

// guess candidate fields for filters (from defs or order)
const candidates = new Set();
if (Array.isArray(filtersDef)) {
  for (const f of filtersDef) {
    for (const k of ["key","field","property","prop","name"]) {
      if (f && typeof f[k] === "string") candidates.add(f[k]);
    }
  }
}
for (const f of filterOrder) if (typeof f === "string") candidates.add(f);

console.log("Candidate filter fields:", Array.from(candidates));

const issues = [];
for (const field of candidates) {
  const seen = new Map();
  for (const o of allObjects) {
    const v = get(field, o);
    if (v === undefined) continue;
    const t = Array.isArray(v) ? "array" : (v===null?"null":typeof v);
    if (t !== "string") {
      issues.push({ field, type: t, sample: JSON.stringify(v).slice(0, 120) });
      break; // one sample is enough
    }
  }
}
if (issues.length === 0) {
  console.log("✅ All candidate filter fields hold strings.");
} else {
  console.log("❌ Non-string values in filter fields:");
  console.table(issues);
}
