import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
const script = 'skills/frontend-ui-kit/scripts/check-tokens.mjs';
test('packaged assets resolve their semantic tokens', () => {
  const result = JSON.parse(execFileSync(process.execPath, [script], { encoding: 'utf8' }));
  assert.equal(result.missing, 0); assert.ok(result.defined > 0);
});
test('missing tokens fail with a useful name, and valid tokens pass', () => {
  const fixture = mkdtempSync(join(tmpdir(), 'fui-token-test-'));
  try {
    writeFileSync(join(fixture, 'test.css'), '.demo { --fui-bg: white; color: var(--fui-unknown); }');
    const bad = spawnSync(process.execPath, [script, fixture], { encoding: 'utf8' });
    assert.equal(bad.status, 1); assert.match(bad.stderr, /--fui-unknown/);
    writeFileSync(join(fixture, 'test.css'), '.demo { --fui-bg: white; color: var(--fui-bg); }');
    assert.equal(spawnSync(process.execPath, [script, fixture]).status, 0);
  } finally { rmSync(fixture, { recursive: true }); }
});
