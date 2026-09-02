/**
 * Regenerates the subsetted Material Symbols font from the icon list in
 * `src/components/ui/icon.tsx`. Run after adding icons:
 *
 *   node scripts/refresh-icon-font.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const iconSrc = readFileSync(resolve(root, "src/components/ui/icon.tsx"), "utf8");
const block = iconSrc.match(/ICON_NAMES = \[([\s\S]*?)\] as const/)?.[1] ?? "";
const names = [...block.matchAll(/"([a-z_]+)"/g)].map((m) => m[1]).sort();

if (names.length === 0) {
  console.error("No icon names found in src/components/ui/icon.tsx");
  process.exit(1);
}

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36";
const cssUrl = `https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&icon_names=${names.join(",")}`;

const css = await fetch(cssUrl, { headers: { "User-Agent": UA } }).then((r) =>
  r.text(),
);
const fontUrl = css.match(/https:\/\/fonts\.gstatic\.com[^)]+/)?.[0];
if (!fontUrl) {
  console.error("Could not find font URL in Google Fonts response");
  process.exit(1);
}

const buffer = Buffer.from(
  await fetch(fontUrl, { headers: { "User-Agent": UA } }).then((r) =>
    r.arrayBuffer(),
  ),
);
const out = resolve(root, "src/assets/fonts/material-symbols-outlined.woff2");
writeFileSync(out, buffer);

console.log(`Wrote ${out}`);
console.log(`${names.length} icons · ${(buffer.length / 1024).toFixed(1)} KB`);
