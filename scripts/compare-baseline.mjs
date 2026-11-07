// Reproduce the one historical screenshot outlier under identical settled capture conditions.
import { chromium } from '@playwright/test';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { mkdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
if (!process.argv[2]) throw Error('Pass the previous project directory as the first argument.');
const browser = await chromium.launch({ headless: true, executablePath: process.env.FUI_BROWSER || undefined });
try {
  await mkdir('verification/baseline-comparison', { recursive: true });
  const snapshots = [];
  for (const [label, folder] of [['previous', resolve(process.argv[2])], ['current', process.cwd()]]) {
    const page = await browser.newPage({ viewport: { width: 360, height: 1000 } });
    await page.goto(`${pathToFileURL(resolve(folder, 'dist/index.html')).href}#landing`);
    await page.evaluate(() => document.fonts.ready);
    await page.keyboard.press('Tab'); await page.locator('a').first().focus();
    await page.waitForTimeout(300);
    const screenshot = await page.screenshot({ fullPage: true, animations: 'disabled', path: `verification/baseline-comparison/${label}.png` });
    snapshots.push({ label, sha256: createHash('sha256').update(screenshot).digest('hex') });
    await page.close();
  }
  const result = { route: 'landing', viewport: '360x1000', browser: browser.version(), byteIdentical: snapshots[0].sha256 === snapshots[1].sha256, snapshots };
  await writeFile('verification/baseline-comparison/result.json', JSON.stringify(result, null, 2));
  console.log(JSON.stringify(result));
  if (!result.byteIdentical) process.exitCode = 1;
} finally { await browser.close(); }
