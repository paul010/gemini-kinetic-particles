import { allowReadOnlyKit, KIT_TEST } from './newsletter-qa-kit.mjs';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
const { chromium } = await import(process.env.NEWSLETTER_PLAYWRIGHT_MODULE ? pathToFileURL(resolve(process.env.NEWSLETTER_PLAYWRIGHT_MODULE)).href : 'playwright');
const base = 'https://dailycosmos.net';
const output = resolve(process.env.NEWSLETTER_PRODUCTION_OUTPUT ?? 'output/newsletter-production-review');
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.NEWSLETTER_BROWSER_PATH ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
// Preserve the original Chinese smoke assertions; separately check every locale below.
await context.addInitScript(() => localStorage.setItem('dalei-lang-v2', 'zh'));
const requests = [], errors = [], checks = [], accessibility = [];
context.on('request', r => requests.push({ origin: new URL(r.url()).origin, path: new URL(r.url()).pathname, method: r.method(), hasBody: !!r.postData() }));
const blockedWrites = [];
await allowReadOnlyKit(context, base, blockedWrites);
const page = await context.newPage();
page.setDefaultTimeout(12000);
page.on('pageerror', e => errors.push(e.message));
const test = async (name, fn) => { try { await fn(); checks.push({ name, status: 'passed' }); } catch (e) { checks.push({ name, status: 'failed', error: e.message }); } console.log(checks.at(-1)); };
const home = async () => { const r = await page.goto(base + '/', { waitUntil: 'domcontentloaded' }); assert.equal(r.status(), 200); await page.locator('.home-newsletter').waitFor(); await page.locator('.home-newsletter__subscribe').waitFor(); await page.locator('.hero-visual__button img').evaluate(image => image.decode()); };
const noOverflow = async () => assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
const audit = async name => { await page.addScriptTag({ path: process.env.NEWSLETTER_AXE_PATH }); const r = await page.evaluate(async () => { const r = await window.axe.run(document.querySelector('.home-newsletter') ?? document.querySelector('main'), { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] } }); return { violations: r.violations.map(v => ({ id: v.id, targets: v.nodes.map(n => n.target) })), incomplete: r.incomplete.map(v => v.id) }; }); accessibility.push({ name, ...r }); assert.equal(r.violations.length, 0); };
await test('HTTPS home restores the creator IP and one real Newsletter invitation, preserving original sections', async () => {
  await home();
  assert.match(await page.locator('#creator-intro').innerText(), /大雷早上好.*@dalei2025/s);
  assert.match(await page.locator('#creator-intro h1').innerText(), /用 AI，做点实事。/);
  await page.locator('.hero-visual__button img').evaluate(image => image.decode());
  assert.equal(await page.locator('.hero-visual__button img').getAttribute('src'), '/hero-blue-cartoon-20260912.webp');
  assert.equal(await page.locator('a[href="/newsletter"]').count(), 1);
  assert.equal(await page.locator('form,input[type="email"],.kit-signup,iframe').count(), 0);
  for (const id of ['creator-intro', 'work', 'videos', 'about', 'now', 'connect']) assert.equal(await page.locator('section#' + id).count(), 1);
  await noOverflow(); await audit('home-desktop');
  await page.screenshot({ path: output + '/production-home-desktop.png', fullPage: false });
});
await test('320px and 390px mobile primary invitations fit the first viewport', async () => {
  for (const width of [320, 390]) {
    await page.setViewportSize({ width, height: width === 320 ? 740 : 844 }); await home(); await noOverflow();
    for (const selector of ['.home-newsletter__subscribe']) { const b = await page.locator(selector).boundingBox(); assert(b && b.y >= 64 && b.y + b.height <= page.viewportSize().height); }
    await page.screenshot({ path: output + '/production-home-mobile-' + width + '.png', fullPage: false });
  }
  await audit('home-mobile');
});
await test('Keyboard page navigation, back and direct refresh retain real consent and pending-confirmation rules', async () => {
  await page.locator('.home-newsletter__subscribe').focus(); await page.keyboard.press('Enter');
  await page.locator('.kit-signup[data-kit-load="ready"] input[name="email_address"]').waitFor();
  assert.match(await page.locator('.kit-signup__help').innerText(), /提交后需点击中文确认邮件中的按钮/);
  await page.reload(); await page.locator('.kit-signup[data-kit-load="ready"] input[name="email_address"]').waitFor();
  await page.goBack(); await page.locator('.home-newsletter').waitFor();
});
await test('Public card route and refresh contain all original resources without subscription claims', async () => {
  const r = await page.goto(base + '/newsletter/first-ai-card', { waitUntil: 'domcontentloaded' }); assert.equal(r.status(), 200);
  await page.getByRole('heading', { name: '第一张 AI 实战卡', exact: true }).waitFor();
  assert.match(await page.locator('.practice-card__preview').innerText(), /公开资源.*原创 AI 实战卡/);
  assert.match(await page.locator('.practice-card__disclosure').innerText(), /访问本页不代表邮箱已确认或已订阅/);
  assert.equal(await page.locator('main section').count(), 5);
  assert.equal(await page.locator('input,textarea,form,iframe').count(), 0);
  await noOverflow(); await audit('practice-card-mobile');
  await page.screenshot({ path: output + '/production-card-mobile.png', fullPage: true });
  await page.reload(); await page.getByRole('heading', { name: '第一张 AI 实战卡', exact: true }).waitFor();
});
await test('Live English, simplified and traditional copy synchronizes across all newsletter routes and refresh', async () => {
  // This context has no forced language seed, so it also verifies the English default.
  const localized = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
  await allowReadOnlyKit(localized, base, blockedWrites);
  localized.on('request', r => requests.push({ origin: new URL(r.url()).origin, path: new URL(r.url()).pathname, method: r.method(), hasBody: !!r.postData() }));
  const p = await localized.newPage();
  p.on('pageerror', error => errors.push(error.message));
  p.setDefaultTimeout(12000);
  try {
    await p.goto(base + '/', { waitUntil: 'domcontentloaded' });
    await p.locator('.home-newsletter__subscribe').waitFor();
    const locales = [
      { tag: 'en', selector: 'EN', button: 'Subscribe free · Confirm to get your practice card', input: 'Email address', card: 'Your first AI practice card', note: /in Chinese/ },
      { tag: 'zh-CN', selector: '简', button: '免费订阅 · 确认后领实战卡', input: '邮箱', card: '第一张 AI 实战卡', note: /中文/ },
      { tag: 'zh-Hant', selector: '繁', button: '免費訂閱 · 確認後領實戰卡', input: '郵箱', card: '第一張 AI 實戰卡', note: /中文/ },
    ];
    for (const locale of locales) {
      await p.goto(base + '/', { waitUntil: 'domcontentloaded' });
      await p.getByRole('button', { name: locale.selector, exact: true }).click();
      await p.locator('.home-newsletter__subscribe').waitFor();
      assert.equal(await p.locator('.home-newsletter__subscribe').getAttribute('href'), '/newsletter');
      assert.equal(await p.locator('html').getAttribute('lang'), locale.tag);
      assert.match(await p.locator('.home-newsletter__note').innerText(), locale.note);
      assert(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      await p.locator('.hero-visual__button img').evaluate(image => image.decode());
      await p.screenshot({ path: output + '/production-home-' + locale.tag + '-390.png', fullPage: false });
      await p.locator('.home-newsletter__subscribe').click();
      await p.getByLabel(locale.input, { exact: true }).waitFor();
      assert(!(await p.getByRole('button', { name: locale.button, exact: true }).isDisabled()));
      assert.equal(await p.locator('html').getAttribute('lang'), locale.tag);
      await p.reload(); await p.getByLabel(locale.input, { exact: true }).waitFor();
      await p.goto(base + '/newsletter/first-ai-card', { waitUntil: 'domcontentloaded' });
      await p.getByRole('heading', { name: locale.card, exact: true }).waitFor();
      assert.equal(await p.locator('html').getAttribute('lang'), locale.tag);
      assert.match(await p.title(), new RegExp(locale.card));
      await p.screenshot({ path: output + '/production-card-' + locale.tag + '-390.png', fullPage: true });
      await p.reload(); await p.getByRole('heading', { name: locale.card, exact: true }).waitFor();
    }
  } finally { await localized.close(); }
});
await test('Existing Life Quest, Skills and map-route pages render from direct URLs', async () => {
  await page.setViewportSize({ width: 1440, height: 900 });
  for (const path of ['/life-quest', '/skills', '/map-route-broll']) {
    const r = await page.goto(base + path, { waitUntil: 'domcontentloaded' }); assert.equal(r.status(), 200);
    await page.locator('main h1').waitFor(); assert((await page.locator('main h1').first().innerText()).length > 3);
    assert.equal(await page.locator('.home-newsletter').count(), 0);
    await page.screenshot({ path: output + '/production-' + path.slice(1) + '.png', fullPage: false });
  }
});
await test('Public Kit scripts are read-only; every write attempt is blocked and no form is submitted', async () => {
  assert.deepEqual(errors, []);
  assert(!requests.some(r => r.path === new URL(KIT_TEST.subscription).pathname), 'No subscription submission was attempted');
  assert(blockedWrites.every(r => r.origin === new URL(KIT_TEST.visit).origin && r.path === new URL(KIT_TEST.visit).pathname), 'Only official anonymous visit attempts are allowed and blocked');
  assert(!requests.some(r => r.origin === base && (r.hasBody || !['GET', 'HEAD'].includes(r.method))));
});
await writeFile(output + '/production-browser-results.json', JSON.stringify({ testedAt: new Date().toISOString(), base, browser: await browser.version(), checks, errors, requests, accessibility, blockedWrites, limits: ['Fresh isolated context; approved site and exact official Kit script GETs only. All service writes, including anonymous visits, are blocked.', 'No real subscribe, confirmation, unsubscribe, analytics or email send tests.'] }, null, 2));
await browser.close();
assert(checks.every(c => c.status === 'passed'), 'Production smoke failed; inspect evidence');
