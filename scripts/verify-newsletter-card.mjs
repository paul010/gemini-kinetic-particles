import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
const base = process.env.NEWSLETTER_BASE_URL ?? 'http://127.0.0.1:4176';
assert(['127.0.0.1', 'localhost'].includes(new URL(base).hostname), 'Local preview only');
const output = resolve(process.env.NEWSLETTER_CARD_OUTPUT ?? 'output/newsletter-home-review/card');
await mkdir(output, { recursive: true });
const playwright = await import(process.env.NEWSLETTER_PLAYWRIGHT_MODULE ? pathToFileURL(resolve(process.env.NEWSLETTER_PLAYWRIGHT_MODULE)).href : 'playwright');
const browser = await playwright.chromium.launch({ executablePath: process.env.NEWSLETTER_BROWSER_PATH ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
// Keep tests from changing the Mac clipboard shared with the user's browser.
await context.addInitScript(() => {
  window.__copyCalls = 0; window.__copyMode = 'ok'; window.__copied = '';
  Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async text => {
    window.__copyCalls += 1;
    if (window.__copyMode === 'fail') throw new Error('Clipboard denied for test');
    if (window.__copyMode === 'pending') await new Promise(resolve => { window.__finishCopy = resolve; });
    window.__copied = text;
  } } });
});
await context.route('**/*', route => new URL(route.request().url()).origin === new URL(base).origin ? route.continue() : route.abort());
const requests = [], errors = [], results = [], accessibility = [];
context.on('request', request => requests.push({ url: request.url(), method: request.method(), body: request.postData() }));
const page = await context.newPage(); page.setDefaultTimeout(7000); page.on('pageerror', error => errors.push(error.message));
const path = '/newsletter/first-ai-card';
const load = async suffix => { await page.goto(base + path + (suffix ?? '')); await page.getByRole('heading', { name: '第一张 AI 实战卡', exact: true }).waitFor(); };
const check = async (name, fn) => { try { await fn(); results.push({ name, status: 'passed' }); } catch (error) { results.push({ name, status: 'failed', error: error.message }); } console.log(results.at(-1)); };
const copyPrompts = () => page.getByRole('button', { name: '复制三轮提示', exact: true });
const audit = async state => {
  await page.addScriptTag({ path: process.env.NEWSLETTER_AXE_PATH });
  const report = await page.evaluate(async () => { const r = await window.axe.run(document.querySelector('.practice-card'), { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] } }); return { violations: r.violations, incomplete: r.incomplete.map(({ id }) => id), passes: r.passes.length }; });
  accessibility.push({ state, ...report }); assert.equal(report.violations.length, 0, JSON.stringify(report.violations.map(({ id, nodes }) => ({ id, targets: nodes.map(n => n.target) }))));
};
await check('Public candidate contains all five resources, original fictional sample and no subscription claim', async () => {
  await load();
  assert.equal(await page.locator('html').getAttribute('lang'), 'zh-CN');
  assert.equal(await page.locator('meta[name="robots"]').getAttribute('content'), 'noindex, nofollow');
  assert.match(await page.locator('.practice-card__preview').innerText(), /资源预览.*订阅入口筹备中/);
  assert.match(await page.locator('.practice-card__disclosure').innerText(), /访问本页不代表邮箱已确认或已订阅/);
  assert.equal(await page.locator('main section').count(), 5);
  assert.match(await page.locator('main').innerText(), /虚构练习材料，无真实个人或活动数据/);
  assert.equal(await page.locator('input,textarea,form,iframe').count(), 0);
  await page.screenshot({ path: output + '/card-desktop.png', fullPage: true }); await audit('desktop-light');
});
await check('Lesson has exactly three one-sections, one exercise and 300–500 Chinese characters', async () => {
  const labels = await page.locator('.practice-card__lesson-grid h3').allTextContents();
  assert.deepEqual(labels, ['一个结论', '一个原理', '一个判断', '一个动手练习']);
  const text = (await page.locator('.practice-card__lesson-grid p').allTextContents()).join('');
  const chineseCharacters = [...text.matchAll(/\p{Script=Han}/gu)].length;
  assert(chineseCharacters >= 300 && chineseCharacters <= 500, String(chineseCharacters));
  assert.equal(await page.locator('.practice-card__prompts article').count(), 3);
  assert.equal(await page.locator('.practice-card__check li').count(), 4);
  assert.equal(await page.locator('footer a').getAttribute('href'), 'https://www.youtube.com/@dalei2025');
  results.push({ name: 'Lesson character count', status: 'passed', chineseCharacters });
});
await check('Keyboard copy returns full prompts; blank card and denied clipboard remain usable', async () => {
  await copyPrompts().focus(); await page.keyboard.press('Enter');
  await page.getByRole('status').getByText(/已复制三轮提示/).waitFor();
  assert.match(await page.evaluate(() => window.__copied), /第 1 轮[\s\S]*第 2 轮[\s\S]*第 3 轮/);
  await page.getByRole('button', { name: '复制空白卡', exact: true }).click();
  await page.getByRole('status').getByText(/已复制空白卡/).waitFor();
  assert.match(await page.evaluate(() => window.__copied), /原文或材料：[\s\S]*下一步亲自核实/);
  await page.evaluate(() => { window.__copyMode = 'fail'; }); await copyPrompts().click();
  await page.getByRole('status').getByText(/当前浏览器未允许复制/).waitFor();
  assert(await page.locator('.practice-card__blank').isVisible());
});
await check('Pending copy disables duplicate clicks without storing reader data', async () => {
  await page.evaluate(() => { window.__copyMode = 'pending'; });
  const before = await page.evaluate(() => window.__copyCalls);
  await copyPrompts().click(); assert(await copyPrompts().isDisabled());
  await copyPrompts().evaluate(button => { button.click(); button.click(); });
  assert.equal(await page.evaluate(() => window.__copyCalls), before + 1);
  await page.evaluate(() => { window.__finishCopy(); window.__copyMode = 'ok'; });
  await page.waitForFunction(() => !document.querySelector('.practice-card__button').disabled);
});
await check('320px and 390px page, prompts and blank template never overflow', async () => {
  for (const width of [320, 390]) {
    await page.setViewportSize({ width, height: 844 }); await load();
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await page.screenshot({ path: output + `/card-mobile-${width}.png`, fullPage: true });
    if (width === 390) await audit('mobile-light');
  }
});
await check('Home resource link, back, bookmark, refresh and fake confirmed query preserve candidate state', async () => {
  await page.goto(base + '/'); await page.getByRole('link', { name: '查看第一张 AI 实战卡预览', exact: true }).click();
  await page.getByRole('heading', { name: '第一张 AI 实战卡', exact: true }).waitFor();
  assert.match(page.url(), /\/newsletter\/first-ai-card$/);
  await page.reload(); await page.getByRole('heading', { name: '第一张 AI 实战卡', exact: true }).waitFor();
  await load('?confirmed=true'); assert.match(await page.locator('.practice-card__disclosure').innerText(), /不代表邮箱已确认/);
  await page.locator('header a[href="/"]').click(); await page.locator('.home-newsletter').waitFor();
  assert.notEqual(await page.evaluate(() => document.querySelector('meta[name="robots"]')?.getAttribute('content') ?? null), 'noindex, nofollow');
  await page.goBack(); await page.getByRole('heading', { name: '第一张 AI 实战卡', exact: true }).waitFor();
  await page.goto(base + '/#/newsletter/first-ai-card'); await page.getByRole('heading', { name: '第一张 AI 实战卡', exact: true }).waitFor();
});
await check('Dark theme remains readable, and printable PDF keeps preview label', async () => {
  await page.setViewportSize({ width: 1440, height: 1000 }); await load();
  await page.evaluate(() => { document.documentElement.dataset.theme = 'dark'; });
  await audit('desktop-dark'); await page.screenshot({ path: output + '/card-desktop-dark.png', fullPage: true });
  await page.evaluate(() => { document.documentElement.dataset.theme = 'light'; });
  await page.emulateMedia({ media: 'print' });
  assert(await page.locator('.practice-card__preview').isVisible());
  await page.pdf({ path: output + '/first-ai-card-preview.pdf', format: 'A4', printBackground: true, margin: { top: '12mm', right: '12mm', bottom: '12mm', left: '12mm' } });
  await page.emulateMedia({ media: 'screen' });
});
await check('External-service outage is harmless; no Kit traffic, PII, request body or runtime error', async () => {
  await load(); assert(await page.locator('.practice-card__blank').isVisible());
  assert(!requests.some(request => /kit\.com|convertkit|notion/.test(request.url)));
  assert(requests.every(request => request.method === 'GET' && !request.body));
  const storage = await page.evaluate(() => ({ local: { ...localStorage }, session: { ...sessionStorage }, cookies: document.cookie }));
  const { 'dalei-lang-v2': language, ...otherLocal } = storage.local;
  assert(language === undefined || ['en', 'zh', 'zhHant'].includes(language), 'Only existing host language preference allowed');
  assert.deepEqual(otherLocal, {}, 'Resource does not create persistent reader data');
  assert.deepEqual(storage.session, {}); assert.equal(storage.cookies, '');
  assert.equal(errors.length, 0);
});
await writeFile(output + '/card-browser-results.json', JSON.stringify({ testedAt: new Date().toISOString(), browser: await browser.version(), base, results, pageErrors: errors, notes: ['Independent headless browser; external requests blocked.', 'Clipboard mocked in-page; real Mac clipboard untouched.', 'Public page does not establish or validate subscriber state.'] }, null, 2) + '\n');
await writeFile(output + '/card-axe-results.json', JSON.stringify(accessibility, null, 2) + '\n');
await context.close(); await browser.close(); assert(results.every(result => result.status === 'passed'), 'Card checks failed; see card-browser-results.json');
