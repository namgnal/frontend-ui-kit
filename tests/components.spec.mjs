import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { mkdir } from 'node:fs/promises';

test.beforeEach(async ({ page }) => { await page.goto('/#lab'); });
test('button does not submit a surrounding form', async ({ page }) => {
  await page.getByRole('button', { name: '普通按钮', exact: true }).click();
  await expect(page.getByLabel('表单提交次数')).toHaveText('0');
  await expect(page.getByLabel('操作结果')).toHaveText('普通按钮');
});
test('radio keys wrap, skip disabled, maintain one tab stop and respect RTL', async ({ page }) => {
  const first = page.getByRole('radio', { name: '第一项' });
  const last = page.getByRole('radio', { name: '最后一项' });
  await first.focus(); await page.keyboard.press('ArrowUp');
  await expect(last).toBeFocused(); await expect(last).toBeChecked();
  await page.keyboard.press('ArrowRight'); await expect(first).toBeFocused();
  await page.keyboard.press('ArrowRight'); await expect(last).toBeFocused();
  await page.keyboard.press('Home'); await expect(first).toBeFocused();
  await page.keyboard.press('End'); await expect(last).toBeFocused();
  await expect(page.locator('[role=radio][tabindex="0"]')).toHaveCount(1);
  await page.getByRole('radiogroup').evaluate(el => el.dir = 'rtl');
  await page.keyboard.press('ArrowLeft'); await expect(first).toBeFocused();
});
test('attachment open and remove are keyboard reachable and independent', async ({ page }) => {
  const open = page.getByRole('button', { name: /^打开 一个/ });
  const remove = page.getByRole('button', { name: /^移除 一个/ });
  await open.focus(); await page.keyboard.press('Enter');
  await expect(page.getByLabel('操作结果')).toHaveText('打开附件');
  await page.keyboard.press('Tab'); await expect(remove).toBeFocused();
  await page.keyboard.press('Space'); await expect(page.getByLabel('操作结果')).toHaveText('移除附件');
  await expect(page.locator('.fui-filename > :last-child')).toHaveText('.pdf');
});
test('native disclosure supports keyboard and removes collapsed descendants from tab order', async ({ page }) => {
  const summary = page.locator('summary');
  await summary.focus(); await page.keyboard.press('Enter');
  await expect(page.getByRole('button', { name: '详情内操作' })).toBeVisible();
  await page.keyboard.press('Tab'); await expect(page.getByRole('button', { name: '详情内操作' })).toBeFocused();
  await summary.focus(); await page.keyboard.press('Space');
  await expect(page.getByRole('button', { name: '详情内操作' })).toBeHidden();
  await page.keyboard.press('Tab'); await expect(page.getByLabel('模拟发送失败')).toBeFocused();
});
test('IME composition and keyCode 229 do not send; Shift+Enter adds newline', async ({ page }) => {
  const input = page.getByRole('textbox', { name: '消息' });
  await input.fill('你好，界面');
  await input.dispatchEvent('compositionstart', { data: '' });
  await input.dispatchEvent('keydown', { key: 'Enter', isComposing: true });
  await expect(page.getByLabel('已发送消息')).toHaveText('[]');
  await input.dispatchEvent('compositionend', { data: '面' });
  await input.dispatchEvent('keydown', { key: 'Enter', keyCode: 229 });
  await expect(page.getByLabel('已发送消息')).toHaveText('[]');
  // Human follow-up is later than the narrow post-composition guard.
  await page.waitForTimeout(80);
  await input.press('Shift+Enter'); await expect(input).toHaveValue('你好，界面\n');
  await input.press('Enter');
  await expect(page.getByLabel('已发送消息')).toHaveText('["你好，界面\\n"]');
  await expect(input).toHaveValue('');
});
test('failed send keeps draft and a successful retry clears it', async ({ page }) => {
  await page.getByLabel('模拟发送失败').check();
  const input = page.getByRole('textbox', { name: '消息' });
  await input.fill('失败也不能丢失'); await input.press('Enter');
  await expect(page.getByRole('alert')).toContainText('内容已保留');
  await expect(input).toHaveValue('失败也不能丢失');
  await page.getByLabel('模拟发送失败').uncheck();
  await page.getByRole('button', { name: '发送', exact: true }).click();
  await expect(input).toHaveValue('');
  await expect(page.getByLabel('已发送消息')).toHaveText('["失败也不能丢失"]');
});
test('pending send is deduplicated and does not erase a newer draft', async ({ page }) => {
  const input = page.getByRole('textbox', { name: '消息' });
  await input.fill('第一条');
  await input.press('Enter'); await input.press('Enter');
  await input.fill('正在写下一条');
  await expect(page.getByLabel('已发送消息')).toHaveText('["第一条"]');
  await expect(input).toHaveValue('正在写下一条');
});
test('failed outgoing message remains recoverable alongside a newer draft', async ({ page }) => {
  await page.getByLabel('模拟发送失败').check();
  const input = page.getByRole('textbox', { name: '消息' });
  await input.fill('未送出的旧内容'); await input.press('Enter');
  await input.fill('新草稿');
  await expect(page.locator('.fui-recovery blockquote')).toHaveText('未送出的旧内容');
  await expect(input).toHaveValue('新草稿');
  await expect(page.getByRole('button', { name: '发送', exact: true })).toBeDisabled();
  await page.getByRole('button', { name: '放回输入框' }).click();
  await expect(input).toHaveValue('新草稿\n未送出的旧内容');
  await page.getByLabel('模拟发送失败').uncheck();
  await page.getByRole('button', { name: '发送', exact: true }).click();
  await expect(input).toHaveValue('');
});
test('copy reports pending and rejection accurately, and keeps whitespace', async ({ page }) => {
  await expect(page.locator('pre code')).toHaveText('  第一行\n\n  最后一行\n', { useInnerText: false });
  await page.getByLabel('剪贴板模拟').selectOption('delay');
  await page.getByRole('button', { name: '复制代码' }).click();
  await expect(page.getByRole('button', { name: '复制代码' })).toBeDisabled();
  await expect(page.getByRole('button', { name: '已复制' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: '已复制' })).toBeVisible();
  await page.getByLabel('剪贴板模拟').selectOption('error');
  await page.getByRole('button', { name: '已复制' }).click();
  await expect(page.locator('.fui-code-error')).toContainText('复制失败');
});
test('real clipboard writes demo code with Windows newline normalization', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/#dashboard');
  const original = await page.locator('pre code').textContent();
  await page.getByRole('button', { name: '复制代码' }).click();
  await expect(page.getByRole('button', { name: '已复制' })).toBeVisible();
  expect((await page.evaluate(() => navigator.clipboard.readText())).replace(/\r\n/g, '\n')).toBe(original);
});
test('stream follows bottom, preserves reading position, then jumps back', async ({ page }) => {
  const viewport = page.getByRole('region', { name: '流式记录' });
  const distance = () => viewport.evaluate(el => el.scrollHeight - el.clientHeight - el.scrollTop);
  await page.getByRole('button', { name: '开始追加' }).click();
  await expect.poll(distance).toBeLessThan(4);
  await viewport.evaluate(el => { el.scrollTop = 0; });
  await expect(page.getByRole('button', { name: '回到最新', exact: true })).toBeVisible();
  const countBefore = await viewport.locator('p').count();
  await expect.poll(() => viewport.locator('p').count()).toBeGreaterThan(countBefore + 2);
  expect(await viewport.evaluate(el => el.scrollTop)).toBe(0);
  await page.getByRole('button', { name: '回到最新', exact: true }).click();
  await expect.poll(distance).toBeLessThan(4);
  await page.getByRole('button', { name: '停止追加' }).click();
});
test('reduced motion disables busy spin and control transitions', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  expect(await page.locator('.fui-status .fui-spinner').evaluate(el => getComputedStyle(el).animationName)).toBe('none');
  const durations = await page.locator('.fui-button').first().evaluate(el => getComputedStyle(el).transitionDuration);
  expect(durations.split(',').every(v => parseFloat(v) === 0)).toBe(true);
});
test('workbench filter and landing CTA are functional', async ({ page }) => {
  await page.goto('/#dashboard'); await page.getByRole('radio', { name: '进行中', exact: true }).click();
  await expect(page.locator('.task-row')).toHaveCount(2);
  await page.goto('/#landing'); await page.getByRole('link', { name: /体验思考空间/ }).click();
  await expect(page.getByRole('heading', { name: '把复杂，留给设计。' })).toBeVisible();
});
for (const route of ['chat', 'dashboard', 'landing']) {
  for (const width of [1360, 360]) {
    for (const theme of ['light', 'dark']) {
      test(`${route} ${width}px ${theme}: layout, focus, accessibility, console, screenshot`, async ({ page, browser }) => {
        const errors = []; page.on('pageerror', e => errors.push(e.message));
        page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
        await page.setViewportSize({ width, height: width === 360 ? 900 : 1000 });
        await page.goto(`/#${route}`);
        if (theme === 'dark') await page.getByRole('button', { name: '深色模式' }).click();
        await expect(page.locator('.demo-root')).toHaveAttribute('data-fui-theme', theme);
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
        await page.keyboard.press('Tab');
        const focusTarget = page.locator('a').first(); await focusTarget.focus();
        expect(await focusTarget.evaluate(el => getComputedStyle(el).outlineStyle)).not.toBe('none');
        const a11y = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
        expect(a11y.violations.map(v => ({ id: v.id, impact: v.impact, nodes: v.nodes.map(n => n.target) }))).toEqual([]);
        expect(errors).toEqual([]);
        await mkdir('test-results/screenshots', { recursive: true });
        await page.screenshot({ path: `test-results/screenshots/${route}-${width}-${theme}.png`, fullPage: true });
        test.info().annotations.push({ type: 'browser-version', description: browser.version() });
      });
    }
  }
}
