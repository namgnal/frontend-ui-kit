import { test, expect } from '@playwright/test';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
test('plain HTML reference opens offline with local CSS and native disclosure', async ({ page }) => {
  const remote = [], errors = [];
  page.on('request', req => { if (/^https?:/.test(req.url())) remote.push(req.url()); });
  page.on('pageerror', e => errors.push(e.message));
  await page.goto(pathToFileURL(resolve('skills/frontend-ui-kit/assets/prototypes/static-reference.html')).href);
  await expect(page.getByRole('heading', { level: 1 })).toContainText('把注意力');
  expect(await page.locator('body').evaluate(el => getComputedStyle(el).getPropertyValue('--fui-bg').trim())).toBe('#f5f7f7');
  await page.locator('summary').focus(); await page.keyboard.press('Enter');
  await expect(page.locator('.fui-accordion-content')).toBeVisible();
  await page.setViewportSize({ width: 360, height: 900 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(remote).toEqual([]); expect(errors).toEqual([]);
});
