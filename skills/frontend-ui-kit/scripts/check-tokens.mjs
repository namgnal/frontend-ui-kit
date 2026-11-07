#!/usr/bin/env node
import { readdir, readFile } from 'node:fs/promises';
import { resolve, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = process.argv[2] ? resolve(process.argv[2]) : fileURLToPath(new URL('../assets/', import.meta.url));
async function files(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  return (await Promise.all(entries.map(e => e.isDirectory() ? files(resolve(dir, e.name)) : resolve(dir, e.name)))).flat();
}
try {
  const paths = (await files(root)).filter(p => ['.css', '.tsx', '.ts', '.html'].includes(extname(p)));
  const defined = new Set(), used = new Map();
  for (const path of paths) {
    const source = await readFile(path, 'utf8');
    for (const m of source.matchAll(/(--fui-[\w-]+)\s*:/g)) defined.add(m[1]);
    for (const m of source.matchAll(/var\(\s*(--fui-[\w-]+)/g)) used.set(m[1], path);
  }
  const missing = [...used].filter(([token]) => !defined.has(token));
  if (!paths.length || !defined.size) throw Error('No token definitions found.');
  if (missing.length) throw Error(missing.map(([token, path]) => `${token} is undefined (${path})`).join('\n'));
  console.log(JSON.stringify({ files: paths.length, defined: defined.size, referenced: used.size, missing: 0 }));
} catch (error) { console.error(String(error)); process.exitCode = 1; }
