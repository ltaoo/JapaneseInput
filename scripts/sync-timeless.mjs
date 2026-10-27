import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { createHash } from "node:crypto";

const source = resolve(process.argv[2] || "/Users/mayfair/Documents/other/timeless");
const target = new URL("../vendor/timeless/", import.meta.url);
const files = {
  "index.js": "packages/timeless/dist/index.esm.js",
  "dom.js": "packages/timeless-dom/dist/timeless.dom.esm.js",
  "shadcn.js": "packages/shadcn/dist/index.esm.js",
  "shadcn.css": "packages/shadcn/dist/timeless.shadcn.css",
  "LICENSE": "LICENSE",
};
// Read everything first so a missing upstream build cannot leave a partial snapshot.
const contents = Object.fromEntries(Object.entries(files).map(([name, path]) => [name, readFileSync(resolve(source, path))]));
mkdirSync(target, { recursive: true });
for (const [name, content] of Object.entries(contents)) writeFileSync(new URL(name, target), content);
writeFileSync(new URL("source.json", target), JSON.stringify({
  version: JSON.parse(readFileSync(resolve(source, "packages/timeless/package.json"), "utf8")).version,
  files: Object.fromEntries(Object.entries(contents).map(([name, content]) => [name, {
    source: files[name], sha256: createHash("sha256").update(content).digest("hex"),
  }])),
}, null, 2) + "\n");
console.log(`Timeless snapshot copied from ${source}`);
