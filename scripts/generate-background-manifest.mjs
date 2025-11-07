// Generate manifest.json for public/background by scanning images (webp/jpg/jpeg/png)
// Usage:
// - pnpm run generate:background-manifest
// - Automatically runs before `pnpm build` and `pnpm dev` via prebuild/predev hooks

import { buildManifest } from './background-manifest-lib.mjs';

async function main() {
  await buildManifest(process.cwd());
}

main();