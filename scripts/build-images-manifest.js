#!/usr/bin/env node
/**
 * Genera js/data/images-manifest.json: el listado de TODAS las imágenes que el
 * catálogo estático ya tiene en su CDN (carpeta imagenes/).
 *
 * El frontend compara las rutas que llegan del ERP contra este manifiesto y
 * sólo pide al ERP las imágenes que NO están aquí (enfoque mixto).
 *
 * Re-genera este archivo cada vez que cambien las imágenes del catálogo:
 *   node scripts/build-images-manifest.js
 */
"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const IMAGES_DIR = path.join(ROOT, "imagenes");
const OUT_FILE = path.join(ROOT, "js", "data", "images-manifest.json");

const IMAGE_EXT = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif", ".avif", ".svg"]);

function walk(dir, acc) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === ".DS_Store") continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full, acc);
    } else if (IMAGE_EXT.has(path.extname(entry.name).toLowerCase())) {
      // Ruta relativa a la raíz del catálogo, con / (igual que en el JSON del ERP).
      // Normaliza a NFC: macOS presenta los nombres en NFD, pero git/GitHub
      // (y el JSON) usan NFC, así que sin esto fallarían los nombres acentuados.
      acc.push(path.relative(ROOT, full).split(path.sep).join("/").normalize("NFC"));
    }
  }
  return acc;
}

if (!fs.existsSync(IMAGES_DIR)) {
  console.error("No existe la carpeta imagenes/:", IMAGES_DIR);
  process.exit(1);
}

const list = walk(IMAGES_DIR, []).sort();
fs.writeFileSync(OUT_FILE, JSON.stringify(list));
console.log("Manifiesto generado:", OUT_FILE, "(" + list.length + " imágenes)");