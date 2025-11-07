// Vite plugin: auto-generate public/background/manifest.json during dev when files change
// Supports extensions: .webp, .jpg, .jpeg, .png

import path from 'path';
import { buildManifest, allowedExts } from './background-manifest-lib.mjs';

export default function BackgroundManifestPlugin() {
  const root = process.cwd();
  const backgroundDir = path.join(root, 'public', 'background');

  const isInBackgroundDir = (filePath) => {
    const rel = path.relative(backgroundDir, filePath);
    return rel && !rel.startsWith('..') && !path.isAbsolute(rel);
  };

  const isAllowedImage = (filePath) => allowedExts.has(path.extname(filePath).toLowerCase());

  return {
    name: 'background-manifest-plugin',
    apply: 'serve', // only in dev server
    configureServer(server) {
      // Initial build
      buildManifest(root);

      // Watch for changes in public/background
      server.watcher.on('add', (filePath) => {
        if (isInBackgroundDir(filePath) && isAllowedImage(filePath)) {
          buildManifest(root);
        }
      });
      server.watcher.on('unlink', (filePath) => {
        if (isInBackgroundDir(filePath) && isAllowedImage(filePath)) {
          buildManifest(root);
        }
      });
      // Optional: handle rename as add/unlink events will cover
    },
  };
}