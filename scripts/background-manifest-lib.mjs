// Shared library to generate public/background/manifest.json
// Supports image extensions: .webp, .jpg, .jpeg, .png

import { promises as fs } from 'fs';
import path from 'path';

export const allowedExts = new Set(['.webp', '.jpg', '.jpeg', '.png']);

export function extractNumber(name) {
  const m = name.match(/bg(\d+)\.(webp|jpe?g|png)$/i);
  return m ? parseInt(m[1], 10) : NaN;
}

export function sortImages(images) {
  return images.sort((a, b) => {
    const na = extractNumber(a);
    const nb = extractNumber(b);
    const aIsNum = Number.isFinite(na);
    const bIsNum = Number.isFinite(nb);
    if (aIsNum && bIsNum) return na - nb;
    if (aIsNum) return -1;
    if (bIsNum) return 1;
    return a.localeCompare(b);
  });
}

export async function buildManifest(root = process.cwd(), options = {}) {
  const backgroundDir = options.backgroundDir ?? path.join(root, 'public', 'background');
  const manifestPath = options.manifestPath ?? path.join(backgroundDir, 'manifest.json');
  const exts = options.allowedExts ?? allowedExts;

  try {
    await fs.access(backgroundDir);
  } catch (e) {
    console.warn(`[manifest] Directory not found: ${backgroundDir}`);
    return;
  }

  try {
    const entries = await fs.readdir(backgroundDir, { withFileTypes: true });
    const imageFiles = entries
      .filter((d) => {
        if (!d.isFile()) return false;
        const ext = path.extname(d.name).toLowerCase();
        return exts.has(ext);
      })
      .map((d) => d.name);

    const images = sortImages(imageFiles);

    const manifest = {
      version: 1,
      generatedAt: new Date().toISOString(),
      count: images.length,
      images,
    };

    await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2) + '\n', 'utf8');
    console.log(`[manifest] Updated ${manifestPath} (${images.length} images)`);
  } catch (err) {
    console.error('[manifest] Failed to update manifest:', err);
  }
}