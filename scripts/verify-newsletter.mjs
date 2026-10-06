import { installKitMock, KIT_TEST } from './newsletter-qa-kit.mjs';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

// Tooling is installed separately, keeping website package.json/lock unchanged.
const playwright = process.env.NEWSLETTER_PLAYWRIGHT_MODULE
  ? await import(pathToFileURL(resolve(process.env.NEWSLETTER_PLAYWRIGHT_MODULE)).href)
  : await import('playwright');
const base = process.env.NEWSLETTER_BASE_URL ?? 'http://127.0.0.1:4173';
assert(['127.0.0.1', 'localhost'].includes(new URL(base).hostname), 'Local preview only');
const output = resolve('output/newsletter-review');
await mkdir(output, { recursive: true });
const browser = await playwright.chromium.launch({
  executablePath: process.env.NEWSLETTER_BROWSER_PATH ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true,
});
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
// These original editorial regression cases intentionally use the Chinese edition.
await context.addInitScript(() => localStorage.setItem('dalei-lang-v2', 'zh'));
const requests = [];
const errors = [];
const consoles = [];
const results = [];
const kitMock = await installKitMock(context, base);
context.on('request', request => requests.push({ url: request.url(), method: request.method(), hasBody: Boolean(request.postData()) }));
const page = await context.newPage();
page.setDefaultTimeout(8000);
page.on('pageerror', error => errors.push(error.message));
page.on('console', message => consoles.push(message.text()));
const check = async (name, fn) => {
  try { await fn(); results.push({ name, status: 'passed' }); }
  catch (error) { results.push({ name, status: 'failed', error: error.message }); }
  console.log(results.at(-1));
};
const input = () => page.getByLabel('邮箱（仅演示）', { exact: true });
const submit = () => page.getByRole('button', { name: '演示订阅流程', exact: true });
const waitFor = async (locator) => locator.waitFor({ state: 'visible' });
const reset = async () => {
  await page.getByRole('button', { name: '返回并清空演示', exact: true }).click();
  await waitFor(input());
};
const assertNoOverflow = async () => assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'No horizontal overflow');
const homeSignature = async () => page.evaluate(() => ({
  headings: [...document.querySelectorAll('h1,h2')].map(e => e.textContent),
  nav: [...document.querySelectorAll('header a')].map(e => [e.textContent, e.getAttribute('href')]),
  lang: document.documentElement.lang,
  robots: document.querySelector('meta[name="robots"]')?.getAttribute('content') ?? null,
}));
const axeReports = [];
const auditAccessibility = async (state) => {
  await page.addScriptTag({ path: process.env.NEWSLETTER_AXE_PATH });
  const report = await page.evaluate(async () => {
    const r = await window.axe.run(document.querySelector('.newsletter'), {
      runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] },
    });
    return { violations: r.violations, incomplete: r.incomplete.map(({ id }) => id), passes: r.passes.length };
  });
  axeReports.push({ state, ...report });
  assert.equal(report.violations.length, 0, JSON.stringify(report.violations.map(({ id, nodes }) => ({ id, targets: nodes.map(n => n.target) }))));
};

await check('Desktop layout, unconfigured disclosure and only one required input', async () => {
  await page.goto(base + '/newsletter/demo');
  await waitFor(page.getByRole('heading', { name: /把 AI 新知/ }));
  assert(await page.getByText('尚未开放订阅。本页不收集邮箱，也不会发送邮件。').isVisible());
  assert(await page.getByText('每日一封 · 读者免费 · 有相关视频时推荐', { exact: true }).isVisible());
  assert(await page.getByText('一个结论、一个原理、一个判断。再加一个动手练习和证据来源；有合适的相关视频时附上链接。', { exact: true }).isVisible());
  assert.equal(await page.locator('input[required]').count(), 1);
  await page.locator('.nl-author img').evaluate(image => image.decode());
  assert(await page.locator('.nl-author img').evaluate(image => image.complete && image.naturalWidth > 0), 'Local author image loads');
  assert.equal(await page.locator('meta[name="robots"]').getAttribute('content'), 'noindex, nofollow');
  await assertNoOverflow();
  const rect = await submit().boundingBox();
  assert(rect.y + rect.height <= 1000, 'CTA visible in desktop viewport');
  await page.screenshot({ path: output + '/desktop.png', fullPage: true });
});
if (process.env.NEWSLETTER_AXE_PATH) await check('WCAG A/AA automated check in idle state', async () => auditAccessibility('idle'));
await check('Empty and malformed input remain idle, with accessible errors', async () => {
  await submit().click();
  assert(await page.getByRole('alert').isVisible());
  await input().fill('not-an-email');
  await input().press('Enter');
  assert.equal(await input().getAttribute('aria-invalid'), 'true');
  assert(await input().evaluate(e => e === document.activeElement));
});
await check('Non-demo reserved address is rejected without leaving the form', async () => {
  await input().fill('reader@example.org');
  await submit().click();
  assert.match(await page.getByRole('alert').innerText(), /只演示/);
  assert(await submit().isVisible());
});
await check('Duplicate clicks are disabled, cancellation prevents a delayed result', async () => {
  await input().fill('reader@example.com');
  await input().press('Enter');
  assert(await page.getByRole('button', { name: '演示处理中…' }).isDisabled());
  assert.equal(await input().inputValue(), '');
  await page.getByRole('button', { name: '取消演示' }).click();
  await page.waitForTimeout(1100);
  assert(await submit().isVisible());
  assert.equal(await page.getByRole('heading', { name: '演示：下一步是确认邮箱' }).count(), 0);
  assert.equal(await input().inputValue(), '');
});
await check('Keyboard submission reaches pending and demo welcome, never claims live confirmation', async () => {
  await input().fill('reader@example.com');
  await input().press('Tab');
  assert(await submit().evaluate(e => e === document.activeElement));
  await page.keyboard.press('Enter');
  const pending = page.getByRole('heading', { name: '演示：下一步是确认邮箱' });
  await waitFor(pending);
  assert(await pending.evaluate(e => e === document.activeElement));
  assert(await page.getByText('本次未发送确认邮件，未创建订阅。').isVisible());
  await page.screenshot({ path: output + '/pending.png', fullPage: false });
  if (process.env.NEWSLETTER_AXE_PATH) await auditAccessibility('pending');
  await page.getByRole('button', { name: '查看欢迎内容（演示）' }).click();
  await waitFor(page.getByRole('heading', { name: '演示：确认后的欢迎内容' }));
  assert(await page.getByText('这是欢迎内容预览。没有验证邮箱，也没有实际订阅。').isVisible());
  await page.screenshot({ path: output + '/welcome.png', fullPage: false });
  await reset();
  assert(await input().evaluate(e => e === document.activeElement));
});
await check('Repeated demo address has the same non-enumerating feedback', async () => {
  await input().fill('reader@example.com');
  await submit().click();
  await waitFor(page.getByRole('heading', { name: '演示：下一步是确认邮箱' }));
  assert(await page.getByText('本次未发送确认邮件，未创建订阅。').isVisible());
  await reset();
});
await check('Service failure is explicit and retry returns to an empty form', async () => {
  await page.getByText('演示状态选项', { exact: true }).click();
  await page.getByLabel('模拟结果', { exact: true }).selectOption('error');
  await input().fill('reader@example.com');
  await submit().click();
  const heading = page.getByRole('heading', { name: '演示：服务暂不可用' });
  await waitFor(heading);
  assert(await heading.evaluate(e => e === document.activeElement));
  await page.screenshot({ path: output + '/error.png', fullPage: false });
  if (process.env.NEWSLETTER_AXE_PATH) await auditAccessibility('error');
  await page.getByRole('button', { name: '返回重试（演示）' }).click();
  assert.equal(await input().inputValue(), '');
});
await check('Refresh and fake confirmation query cannot create a confirmed state', async () => {
  await page.getByLabel('模拟结果', { exact: true }).selectOption('pending');
  await input().fill('reader@example.com');
  await page.reload();
  await waitFor(input());
  assert.equal(await input().inputValue(), '');
  await page.goto(base + '/newsletter/demo?confirmed=true');
  await waitFor(input());
  assert.equal(await page.getByRole('heading', { name: '演示：确认后的欢迎内容' }).count(), 0);
});
await check('FAQ and internal anchors work with keyboard and have valid targets', async () => {
  const summary = page.getByText('读者需要付费吗？', { exact: true });
  await summary.focus();
  await page.keyboard.press('Enter');
  assert(await summary.evaluate(e => e.parentElement.open));
  assert(await page.evaluate(() => [...document.querySelectorAll('.newsletter a[href^="#"]')].every(a => document.getElementById(a.getAttribute('href').slice(1)))));
  await page.getByRole('link', { name: '读一封示例', exact: true }).click();
  assert.equal(new URL(page.url()).hash, '#sample-letter');
});
await check('390px and 320px mobile layouts, keyboard focus and readable sample', async () => {
  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 740 });
    await page.goto(base + '/newsletter/demo');
    await waitFor(input());
    await assertNoOverflow();
    assert(await page.getByText('示例草稿 · 未发送', { exact: true }).isVisible());
    await input().focus();
    assert(await input().evaluate(e => e === document.activeElement));
    const r = await submit().boundingBox();
    assert(r.width <= width - 40, 'CTA fits mobile width');
    await page.screenshot({ path: output + `/mobile-${width}.png`, fullPage: true });
    if (width === 390 && process.env.NEWSLETTER_AXE_PATH) await auditAccessibility('mobile-390');
  }
});
await check('Home round-trip restores metadata and leaves visible homepage/navigation unchanged', async () => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(base + '/');
  await waitFor(page.locator('h1'));
  const before = await homeSignature();
  await page.screenshot({ path: output + '/home-desktop.png', fullPage: false });
  await page.goto(base + '/newsletter/demo');
  await waitFor(input());
  await page.locator('.nl-wordmark').click();
  await waitFor(page.locator('h1'));
  assert.deepEqual(await homeSignature(), before);
  await page.goBack();
  await waitFor(input());
  await page.goForward();
  await waitFor(page.locator('h1'));
  assert.deepEqual(await homeSignature(), before);
  await page.setViewportSize({ width: 390, height: 844 });
  await assertNoOverflow();
  await page.screenshot({ path: output + '/home-mobile.png', fullPage: false });
});
await check('Existing Life Quest route still renders', async () => {
  await page.goto(base + '/life-quest');
  await page.locator('h1').waitFor();
  assert.match(await page.title(), /Life Quest/);
  assert((await page.locator('h1').innerText()).length > 0);
});
await check('Inputs never appear in URLs, requests, console, persistent storage or cookies', async () => {
  assert(!JSON.stringify(requests).includes('reader@example'), 'No email in requests');
  assert(!JSON.stringify(consoles).includes('reader@example'), 'No email in console');
  assert(!requests.some(r => r.url === KIT_TEST.subscription), 'Demo sends no subscription request');
  assert(!requests.some(r => r.url === KIT_TEST.subscription), 'Demo never submits to Kit');
  const storage = await page.evaluate(() => ({ local: { ...localStorage }, session: { ...sessionStorage }, cookies: document.cookie }));
  assert(!JSON.stringify(storage).includes('reader@example'), 'No email stored');
  assert(!page.url().includes('reader'), 'No email URL');
  assert.equal(errors.length, 0, 'No page errors');
});

const report = {
  testedAt: new Date().toISOString(), base,
  browser: await browser.version(), results, pageErrors: errors,
  notes: ['External host-page font/feed requests blocked for repeatability.', 'This verifies demo states; real Kit confirmation, unsubscribe and sending remain unverified.'],
};
await writeFile(output + '/browser-results.json', JSON.stringify(report, null, 2));
if (process.env.NEWSLETTER_AXE_PATH) await writeFile(output + '/axe-results.json', JSON.stringify(axeReports, null, 2));
await context.close();
await browser.close();
assert(results.every(r => r.status === 'passed'), 'One or more browser checks failed; see browser-results.json');
