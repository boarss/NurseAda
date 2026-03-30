/**
 * Generates PWA PNG icons from public/brand/nurseada-logo.svg
 * Run from apps/web: node scripts/generate-pwa-icons.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const svgPath = path.join(root, "public", "brand", "nurseada-logo.svg");
const iconsDir = path.join(root, "public", "icons");

const svg = fs.readFileSync(svgPath);

for (const size of [192, 512]) {
  const out = path.join(iconsDir, `icon-${size}.png`);
  await sharp(svg).resize(size, size).png().toFile(out);
  console.log("wrote", path.relative(root, out));
}

const brandPng = path.join(root, "public", "brand", "nurseada-logo.png");
await sharp(svg).resize(256, 256).png().toFile(brandPng);
console.log("wrote", path.relative(root, brandPng));
