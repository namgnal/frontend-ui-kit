import { chromium } from '@playwright/test';
import { spawn } from 'node:child_process';
import { mkdir } from 'node:fs/promises';

// Run after npm run build. This process owns and stops its own preview server.
const port = 4176;
const server = spawn(process.execPath, ['scripts/serve.mjs'], { env: { ...process.env, PORT: String(port) }, stdio: 'ignore' });
let browser;
try {
  let ready = false;
  for (let i = 0; i < 50; i++) {
    try { ready = (await fetch(`http://127.0.0.1:${port}/`)).ok; } catch {}
    if (ready) break;
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  if (!ready) throw Error('Preview did not start');
  browser = await chromium.launch({ executablePath: process.env.FUI_BROWSER || undefined });
  await mkdir('docs/images', { recursive: true });
  for (const [name, route, width, height] of [
    ['chat', 'chat', 1360, 1000], ['dashboard', 'dashboard', 1360, 1000],
    ['landing', 'landing', 1360, 1000], ['mobile-chat', 'chat', 390, 844],
  ]) {
    const page = await browser.newPage({ viewport: { width, height }, reducedMotion: 'reduce' });
    await page.goto(`http://127.0.0.1:${port}/#${route}`);
    await page.getByRole('heading', { level: 1 }).waitFor();
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: `docs/images/${name}.png`, fullPage: true, animations: 'disabled' });
    await page.close();
  }
  console.log('Captured four demo screenshots.');
} finally {
  await browser?.close();
  server.kill();
}
