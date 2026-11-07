#!/usr/bin/env node
// Applies an explicit design patch to a dedicated JSON config. Never scans or rewrites JSX/CSS.
import { readFileSync, writeFileSync, openSync, closeSync, unlinkSync, renameSync, lstatSync, copyFileSync, constants } from 'node:fs';
import { resolve, extname, dirname, basename, join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { parseJSON, validateConfig, applyPatch } from '../assets/tweaks/model.mjs';

function run() {
  const args = process.argv.slice(2), options = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--check') options.check = true;
    else if (['--config', '--patch'].includes(args[i]) && args[i + 1] && !args[i + 1].startsWith('--')) options[args[i].slice(2)] = args[++i];
    else throw Error('用法：node apply-tweaks.mjs --config design.config.json --patch exported.tweaks.json [--check]');
  }
  if (!options.config || !options.patch) throw Error('必须指定 --config 与 --patch。');
  const target = resolve(options.config), patchPath = resolve(options.patch);
  if (extname(target).toLowerCase() !== '.json' || !lstatSync(target).isFile() || lstatSync(target).isSymbolicLink()) throw Error('仅支持普通 .json 配置文件。');
  if (target === patchPath) throw Error('配置文件与参数文件不能是同一个文件。');
  const before = readFileSync(target), source = validateConfig(parseJSON(before.toString('utf8')));
  const next = applyPatch(source, parseJSON(readFileSync(patchPath, 'utf8')));
  if (options.check) { console.log(JSON.stringify({ status: 'compatible', projectId: source.projectId, from: source.revision, to: next.revision })); return; }
  const lock = `${target}.fui.lock`, temp = join(dirname(target), `.${basename(target)}.${randomUUID()}.tmp`);
  let fd, backup;
  try {
    fd = openSync(lock, 'wx');
    if (!readFileSync(target).equals(before)) throw Error('配置刚被修改，未覆盖，请重新加载。');
    writeFileSync(temp, JSON.stringify(next, null, 2) + '\n', { flag: 'wx' });
    backup = `${target}.backup-${randomUUID()}`;
    copyFileSync(target, backup, constants.COPYFILE_EXCL);
    if (!readFileSync(target).equals(before)) throw Error('保存前配置已变化，未覆盖，请重新加载。');
    renameSync(temp, target);
    console.log(JSON.stringify({ status: 'applied', path: target, revision: next.revision, backup }));
  } finally {
    try { unlinkSync(temp); } catch (e) { if (e.code !== 'ENOENT') throw e; }
    if (fd !== undefined) { closeSync(fd); unlinkSync(lock); }
  }
}
try { run(); } catch (error) { console.error(error.message); process.exitCode = 1; }
