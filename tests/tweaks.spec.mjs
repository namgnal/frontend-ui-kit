import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readFile } from 'node:fs/promises';
import { DEFAULT_VALUES, makePatch } from '../skills/frontend-ui-kit/assets/tweaks/model.mjs';
const config = JSON.parse(await readFile(new URL('../demo/design.config.json', import.meta.url), 'utf8'));
const storageKey = `fui:tweaks:v1:${config.projectId}`;
const patchFile = values => ({ name: 'values.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(makePatch(config, { ...DEFAULT_VALUES, ...values }))) });
async function openPanel(page, route = 'chat') {
  await page.goto(`/tweaks.html#${route}`); await page.getByRole('button', { name: '打开调节面板' }).click();
}
test('normal entry neither loads controls nor reads/writes their stored settings', async ({ page }) => {
  const requests = []; page.on('request', req => requests.push(req.url()));
  await page.addInitScript(({ key, patch }) => {
    localStorage.setItem(key, JSON.stringify(patch)); window.tweakAccesses = 0;
    for (const method of ['getItem', 'setItem', 'removeItem']) {
      const original = Storage.prototype[method];
      Storage.prototype[method] = function (...args) { if (String(args[0]).startsWith('fui:tweaks:')) window.tweakAccesses++; return original.apply(this, args); };
    }
  }, { key: storageKey, patch: makePatch(config, { ...DEFAULT_VALUES, title: '不应该出现在普通页面', radius: 24 }) });
  await page.goto('/#chat');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('把复杂，留给设计。');
  await expect(page.getByRole('button', { name: /调节面板/ })).toHaveCount(0);
  expect(await page.evaluate(() => window.tweakAccesses)).toBe(0);
  expect(requests.some(url => /tweaks\.(js|css)/.test(url))).toBe(false);
});
test('panel starts closed; keyboard close restores focus and preserves a product draft', async ({ page }) => {
  await page.goto('/tweaks.html#chat');
  await expect(page.getByRole('complementary', { name: '设计参数' })).toHaveCount(0);
  const composer = page.getByRole('textbox', { name: '消息', exact: true });
  await composer.fill('面板不能清掉这段草稿');
  await page.getByRole('button', { name: '打开调节面板' }).focus(); await page.keyboard.press('Enter');
  await expect(page.getByRole('button', { name: '关闭调节面板' })).toBeFocused();
  await page.getByLabel('强调色').selectOption('plum');
  await expect(composer).toHaveValue('面板不能清掉这段草稿');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button', { name: '打开调节面板' })).toBeFocused();
  await expect(composer).toHaveValue('面板不能清掉这段草稿');
  await composer.press('Enter'); await expect(page.locator('.fui-message').last()).toContainText('面板不能清掉这段草稿');
});
test('all controls update preview, compare original and recover without interpreting title as HTML', async ({ page }) => {
  await openPanel(page);
  await page.getByLabel('强调色').selectOption('plum');
  for (const name of ['正文字号', '内容间距', '控件圆角', '微反馈时长']) await page.getByRole('slider', { name }).press('End');
  await page.getByRole('textbox', { name: '页面标题' }).fill('$& <img src=x>中文标题');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('$& <img src=x>中文标题');
  await expect(page.locator('h1 img')).toHaveCount(0);
  await expect(page.locator('.fui-message-body').first()).toHaveCSS('font-size', '20px');
  await expect(page.locator('.fui-composer')).toHaveCSS('padding-top', '28px');
  await expect(page.locator('.fui-composer .fui-button')).toHaveCSS('border-radius', '24px');
  await page.getByRole('button', { name: '对比原版' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('把复杂，留给设计。');
  await expect(page.locator('.fui-composer')).toHaveCSS('padding-top', '12px');
  await page.getByRole('button', { name: '返回调整' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('$& <img src=x>中文标题');
  await page.getByRole('button', { name: '恢复原版' }).click();
  await expect(page.locator('.fui-composer .fui-button')).toHaveCSS('border-radius', '10px');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('把复杂，留给设计。');
});
test('explicit save survives reload and reset removes only this project settings', async ({ page }) => {
  await openPanel(page);
  await page.evaluate(() => localStorage.setItem('another-project', 'keep'));
  await page.getByRole('textbox', { name: '页面标题' }).fill('重新打开仍然保留');
  await page.getByRole('button', { name: '保存到本机' }).click();
  await page.reload(); await expect(page.getByRole('heading', { level: 1 })).toHaveText('重新打开仍然保留');
  await page.getByRole('button', { name: '打开调节面板' }).click();
  await page.getByRole('button', { name: '恢复原版' }).click(); await page.reload();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('把复杂，留给设计。');
  expect(await page.evaluate(() => localStorage.getItem('another-project'))).toBe('keep');
  expect(await page.evaluate(key => localStorage.getItem(key), storageKey)).toBeNull();
});
test('export and import preserve multiple values, project and baseline', async ({ page }) => {
  await openPanel(page);
  await page.getByLabel('导入参数', { exact: true }).setInputFiles(patchFile({ title: '导入导出 $&', spacing: 24, accent: 'ink' }));
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('导入导出 $&');
  const download = page.waitForEvent('download'); await page.getByRole('button', { name: '导出参数' }).click();
  const file = await download; const exported = JSON.parse(await readFile(await file.path(), 'utf8'));
  expect(exported.baseline).toEqual({ revision: 0, values: DEFAULT_VALUES });
  expect(exported.values).toMatchObject({ title: '导入导出 $&', spacing: 24, accent: 'ink' });
  await page.getByRole('button', { name: '恢复原版' }).click();
  await page.getByLabel('导入参数', { exact: true }).setInputFiles({ name: 'saved.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(exported)) });
  await expect(page.locator('.fui-composer')).toHaveCSS('padding-top', '24px');
});
test('invalid, foreign and stale imports leave current preview unchanged', async ({ page }) => {
  await openPanel(page); await page.getByRole('textbox', { name: '页面标题' }).fill('当前内容');
  const valid = makePatch(config, { ...DEFAULT_VALUES, title: '不应应用' });
  for (const value of [ { ...valid, projectId: 'other' }, { ...valid, baseline: { ...valid.baseline, revision: 1 } },
    { ...valid, values: { ...valid.values, radius: 999 } } ]) {
    await page.getByLabel('导入参数', { exact: true }).setInputFiles({ name: 'bad.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(value)) });
    await expect(page.locator('.fuit-notice')).not.toHaveText('');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('当前内容');
  }
});
test('blocked browser storage keeps edits usable and export still works', async ({ page }) => {
  await page.addInitScript(() => { for (const key of ['getItem', 'setItem', 'removeItem']) Storage.prototype[key] = () => { throw new Error('storage blocked'); }; });
  await openPanel(page); await expect(page.locator('.fuit-notice')).toContainText('可继续调整或导出');
  await page.getByRole('textbox', { name: '页面标题' }).fill('不用存储也可调整');
  await page.getByRole('button', { name: '保存到本机' }).click(); await expect(page.locator('.fuit-notice')).toContainText('可导出');
  const download = page.waitForEvent('download'); await page.getByRole('button', { name: '导出参数' }).click();
  expect(JSON.parse(await readFile(await (await download).path(), 'utf8')).values.title).toBe('不用存储也可调整');
});
test('corrupted saved data is not applied and reduced motion overrides inline tuning', async ({ page }) => {
  await page.addInitScript(key => localStorage.setItem(key, '{bad'), storageKey);
  await openPanel(page); await expect(page.locator('.fuit-notice')).toContainText('未恢复');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('把复杂，留给设计。');
  await page.getByRole('slider', { name: '微反馈时长' }).press('End');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const duration = await page.locator('.fui-composer .fui-button').evaluate(el => getComputedStyle(el).transitionDuration);
  expect(duration.split(',').every(v => parseFloat(v) === 0)).toBe(true);
});
for (const width of [1360, 360]) for (const dark of [false, true]) for (const accent of ['jade', 'ink', 'plum']) {
  test(`optional panel ${width}px ${dark ? 'dark' : 'light'} ${accent}: accessible, no page overflow`, async ({ page }) => {
    const errors = []; page.on('pageerror', e => errors.push(e.message));
    await page.setViewportSize({ width, height: 1000 }); await openPanel(page);
    await page.getByLabel('强调色').selectOption(accent);
    if (dark) await page.getByRole('button', { name: '深色模式' }).click();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
    expect(result.violations.map(v => ({ id: v.id, targets: v.nodes.map(n => n.target) }))).toEqual([]);
    expect(errors).toEqual([]);
    if (accent === 'plum') await page.screenshot({ path: `test-results/tweaks-${width}-${dark ? 'dark' : 'light'}.png`, fullPage: true });
  });
}
