import { build } from 'esbuild';
import { mkdir, copyFile } from 'node:fs/promises';
await mkdir('dist', { recursive: true });
await build({ entryPoints: ['demo/main.tsx', 'demo/tweaks.tsx', 'demo/final.tsx'], bundle: true, outdir: 'dist', minify: true,
  sourcemap: false, target: ['es2022'], define: { 'process.env.NODE_ENV': '"production"' } });
await copyFile('demo/index.html', 'dist/index.html');
await copyFile('demo/tweaks.html', 'dist/tweaks.html');
await copyFile('demo/final.html', 'dist/final.html');
console.log('Built local demo (no CDN dependencies).');
