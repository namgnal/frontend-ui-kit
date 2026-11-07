import { test, expect } from '@playwright/test';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { build } from 'esbuild';
import { makePatch } from '../skills/frontend-ui-kit/assets/tweaks/model.mjs';
test('apply exported parameters to a real file, build final view, and retain design without panel/storage', async ({ page }, info) => {
  const config = JSON.parse(await readFile('demo/design.config.json', 'utf8'));
  const directory = info.outputPath('applied-project'); await mkdir(directory, { recursive: true });
  const target = resolve(directory, 'design.config.json'), patch = resolve(directory, 'export.json');
  await writeFile(target, JSON.stringify(config));
  await writeFile(patch, JSON.stringify(makePatch(config, { ...config.values, title: '应用后保留 $&', radius: 22, fontSize: 19, accent: 'plum' })));
  const apply = spawnSync(process.execPath, ['skills/frontend-ui-kit/scripts/apply-tweaks.mjs', '--config', target, '--patch', patch], { encoding: 'utf8' });
  expect(apply.status, apply.stderr).toBe(0);
  const bundle = await build({ entryPoints: ['demo/final.tsx'], bundle: true, outdir: directory, write: false,
    define: { 'process.env.NODE_ENV': '"production"' }, plugins: [{ name: 'use-applied-fixture', setup(builder) {
      builder.onLoad({ filter: /demo[/\\]design\.config\.json$/ }, async () => ({ contents: await readFile(target, 'utf8'), loader: 'json' }));
    } }] });
  const js = bundle.outputFiles.find(f => f.path.endsWith('.js')).text;
  const css = bundle.outputFiles.find(f => f.path.endsWith('.css')).text;
  await page.goto('about:blank');
  await page.setContent('<html lang="zh-CN"><head><title>Applied configuration</title></head><body><div id="root"></div></body></html>');
  await page.addStyleTag({ content: css });
  await page.evaluate(() => { for (const key of ['getItem', 'setItem', 'removeItem']) Storage.prototype[key] = () => { throw Error('Final view must not use browser presets'); }; });
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.addScriptTag({ content: js });
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('应用后保留 $&');
  await expect(page.locator('.fui-composer .fui-button')).toHaveCSS('border-radius', '22px');
  await expect(page.locator('.fui-message-body').first()).toHaveCSS('font-size', '19px');
  await expect(page.getByRole('button', { name: /调节面板/ })).toHaveCount(0);
  await page.getByRole('textbox', { name: '消息', exact: true }).fill('设计调整后仍然能发送');
  await page.getByRole('button', { name: '发送', exact: true }).click();
  await expect(page.locator('.fui-message').last()).toContainText('设计调整后仍然能发送');
  expect(errors).toEqual([]);
});
