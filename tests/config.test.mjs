import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { DEFAULT_VALUES, validateValues, validateConfig, makePatch, applyPatch, compatiblePatch, previewVariables, parseJSON } from '../skills/frontend-ui-kit/assets/tweaks/model.mjs';
const config = { kind: 'frontend-ui-kit/design-config', version: 1, projectId: 'test-product', revision: 0, values: { ...DEFAULT_VALUES } };
const script = resolve('skills/frontend-ui-kit/scripts/apply-tweaks.mjs');
function fixture(run) {
  const dir = mkdtempSync(join(tmpdir(), 'fui-config-test-'));
  try { run(dir); } finally { assert.ok(dir.startsWith(join(tmpdir(), 'fui-config-test-'))); rmSync(dir, { recursive: true }); }
}
test('inherit defaults emit no inline overrides and do not mutate inputs', () => {
  assert.deepEqual(previewVariables(DEFAULT_VALUES, false), {});
  assert.deepEqual(previewVariables(DEFAULT_VALUES, true), {});
  const before = JSON.stringify(config);
  applyPatch(config, makePatch(config, { ...DEFAULT_VALUES, title: '新标题' }));
  assert.equal(JSON.stringify(config), before);
});
test('multiple settings and literal replacement metacharacters survive one round trip', () => {
  const values = { accent: 'plum', fontSize: 20, spacing: 28, radius: 24, motion: 400, title: '$& <span>标题</span>' };
  const patch = parseJSON(JSON.stringify(makePatch(config, values)));
  const next = applyPatch(config, patch);
  assert.deepEqual(next.values, values); assert.equal(next.revision, 1);
});
test('invalid types, unknown keys, ranges, versions and malformed JSON fail closed', () => {
  for (const values of [ { ...DEFAULT_VALUES, fontSize: '20' }, { ...DEFAULT_VALUES, spacing: 9 },
    { ...DEFAULT_VALUES, radius: 99 }, { ...DEFAULT_VALUES, motion: -1 }, { ...DEFAULT_VALUES, accent: 'red' },
    { ...DEFAULT_VALUES, title: '' }, { ...DEFAULT_VALUES, title: 'x\ny' }, { ...DEFAULT_VALUES, title: 'x'.repeat(81) },
    { ...DEFAULT_VALUES, arbitraryCSS: 'body{}' }, { ...DEFAULT_VALUES, fontSize: NaN }, [] ]) {
    assert.throws(() => validateValues(values));
  }
  assert.throws(() => validateConfig({ ...config, version: 2 }));
  assert.throws(() => validateConfig({ ...config, projectId: '../other' }));
  assert.throws(() => parseJSON('{nope}'));
  assert.throws(() => parseJSON(' '.repeat(65537)));
  assert.throws(() => validateValues(JSON.parse('{"__proto__":{},"accent":"inherit","fontSize":null,"spacing":null,"radius":null,"motion":null,"title":null}')));
});
test('wrong project, stale revision and same-revision manual edits are rejected', () => {
  const patch = makePatch(config, { ...DEFAULT_VALUES, title: '新标题' });
  assert.throws(() => compatiblePatch({ ...config, projectId: 'different' }, patch), /其他项目/);
  assert.throws(() => compatiblePatch({ ...config, revision: 1 }, patch), /原版配置已变化/);
  assert.throws(() => compatiblePatch({ ...config, values: { ...DEFAULT_VALUES, radius: 12 } }, patch), /原版配置已变化/);
});
test('file apply checks without writing, applies once with an exact backup, then refuses replay', () => fixture(dir => {
  const target = join(dir, 'design.config.json'), patch = join(dir, 'patch.json');
  const original = JSON.stringify(config, null, 4) + '\n';
  const values = { ...DEFAULT_VALUES, radius: 24, title: '$& 中文标题' };
  writeFileSync(target, original); writeFileSync(patch, JSON.stringify(makePatch(config, values)));
  writeFileSync(join(dir, 'App.tsx'), 'const keep = true;');
  const args = [script, '--config', target, '--patch', patch];
  assert.equal(spawnSync(process.execPath, [...args, '--check']).status, 0);
  assert.equal(readFileSync(target, 'utf8'), original); assert.equal(readdirSync(dir).length, 3);
  const run = spawnSync(process.execPath, args, { encoding: 'utf8' }); assert.equal(run.status, 0, run.stderr);
  const result = JSON.parse(run.stdout);
  assert.equal(readFileSync(result.backup, 'utf8'), original);
  assert.deepEqual(JSON.parse(readFileSync(target, 'utf8')).values, values);
  const after = readFileSync(target, 'utf8');
  assert.equal(spawnSync(process.execPath, args).status, 1);
  assert.equal(readFileSync(target, 'utf8'), after);
  assert.equal(readFileSync(join(dir, 'App.tsx'), 'utf8'), 'const keep = true;');
  assert.ok(!readdirSync(dir).some(n => n.endsWith('.tmp') || n.endsWith('.lock')));
}));
test('manual changes to source file reject old patch without overwriting', () => fixture(dir => {
  const target = join(dir, 'design.config.json'), patch = join(dir, 'patch.json');
  writeFileSync(target, JSON.stringify({ ...config, values: { ...DEFAULT_VALUES, fontSize: 19 } }));
  writeFileSync(patch, JSON.stringify(makePatch(config, { ...DEFAULT_VALUES, radius: 24 })));
  const before = readFileSync(target, 'utf8');
  const result = spawnSync(process.execPath, [script, '--config', target, '--patch', patch], { encoding: 'utf8' });
  assert.equal(result.status, 1); assert.match(result.stderr, /原版配置已变化/);
  assert.equal(readFileSync(target, 'utf8'), before); assert.equal(readdirSync(dir).length, 2);
}));
test('existing writer lock is respected and not deleted by a failed writer', () => fixture(dir => {
  const target = join(dir, 'design.config.json'), patch = join(dir, 'patch.json');
  writeFileSync(target, JSON.stringify(config)); writeFileSync(`${target}.fui.lock`, 'another writer');
  writeFileSync(patch, JSON.stringify(makePatch(config, { ...DEFAULT_VALUES, radius: 14 })));
  const before = readFileSync(target, 'utf8');
  const result = spawnSync(process.execPath, [script, '--config', target, '--patch', patch]);
  assert.equal(result.status, 1); assert.equal(readFileSync(target, 'utf8'), before);
  assert.equal(readFileSync(`${target}.fui.lock`, 'utf8'), 'another writer');
}));
test('helper refuses non-JSON source instead of rewriting product code', () => fixture(dir => {
  const target = join(dir, 'App.tsx'), patch = join(dir, 'patch.json');
  writeFileSync(target, JSON.stringify(config)); writeFileSync(patch, JSON.stringify(makePatch(config, DEFAULT_VALUES)));
  assert.equal(spawnSync(process.execPath, [script, '--config', target, '--patch', patch]).status, 1);
  assert.equal(readFileSync(target, 'utf8'), JSON.stringify(config));
}));
