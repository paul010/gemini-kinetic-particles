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
const requests = [], errors = [], checks = [], accessibility = [];
context.on('request', r => requests.push({ origin: new URL(r.url()).origin, path: new URL(r.url()).pathname, method: r.method(), hasBody: !!r.postData() }));
await context.route('**/*', route => {
  const r = route.request();
  return new URL(r.url()).origin === base && ['GET', 'HEAD'].includes(r.method()) ? route.continue() : route.abort();
});
const page = await context.newPage();
page.setDefaultTimeout(12000);
page.on('pageerror', e => errors.push(e.message));
const test = async (name, fn) => { try { await fn(); checks.push({ name, status: 'passed' }); } catch (e) { checks.push({ name, status: 'failed', error: e.message }); } console.log(checks.at(-1)); };
const home = async () => { const r = await page.goto(base + '/', { waitUntil: 'domcontentloaded' }); assert.equal(r.status(), 200); await page.locator('.home-newsletter').waitFor(); };
const noOverflow = async () => assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
const audit = async name => { await page.addScriptTag({ path: process.env.NEWSLETTER_AXE_PATH }); const r = await page.evaluate(async () => { const r = await window.axe.run(document.querySelector('.home-newsletter') ?? document.querySelector('main'), { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] } }); return { violations: r.violations.map(v => ({ id: v.id, targets: v.nodes.map(n => n.target) })), incomplete: r.incomplete.map(v => v.id) }; }); accessibility.push({ name, ...r }); assert.equal(r.violations.length, 0); };
await test('HTTPS home serves new branded preview, disabled CTA and original sections', async () => {
  await home();
  assert.match(await page.locator('.home-newsletter__eyebrow').innerText(), /大雷早上好.*@dalei2025/s);
  const avatar = page.locator('.home-newsletter__avatar');
  await avatar.waitFor();
  await page.waitForFunction(() => document.querySelector('.home-newsletter__avatar')?.naturalWidth > 0);
  const bytes = await (await context.request.get(base + await avatar.getAttribute('src'))).body();
  const crypto = await import('node:crypto');
  assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'), '1fbc7bc1c59ca10ac41b7a774186dd1b4a149a978007bff86c1ee66411bbdf19');
  assert(await page.getByRole('button', { name: '订阅即将开放', exact: true }).isDisabled());
  assert.equal(await page.locator('.home-newsletter form,.home-newsletter input,.home-newsletter iframe').count(), 0);
  for (const id of ['creator-intro', 'work', 'videos', 'about', 'now', 'connect']) assert.equal(await page.locator('section#' + id).count(), 1);
  await noOverflow(); await audit('home-desktop');
  await page.screenshot({ path: output + '/production-home-desktop.png', fullPage: false });
});
await test('320px and 390px mobile CTA and preview link fit the first viewport', async () => {
  for (const width of [320, 390]) {
    await page.setViewportSize({ width, height: width === 320 ? 740 : 844 }); await home(); await noOverflow();
    for (const selector of ['.home-newsletter__subscribe', '.home-newsletter__preview']) { const b = await page.locator(selector).boundingBox(); assert(b && b.y >= 64 && b.y + b.height <= page.viewportSize().height); }
    await page.screenshot({ path: output + '/production-home-mobile-' + width + '.png', fullPage: false });
  }
  await audit('home-mobile');
});
await test('Keyboard preview navigation, back and direct refresh retain unconfigured disclosure', async () => {
  await page.locator('.home-newsletter__preview').focus(); await page.keyboard.press('Enter');
  await page.getByLabel('邮箱（仅演示）', { exact: true }).waitFor();
  assert(await page.getByText('尚未开放订阅。本页不收集邮箱，也不会发送邮件。').isVisible());
  await page.reload(); await page.getByLabel('邮箱（仅演示）', { exact: true }).waitFor();
  await page.goBack(); await page.locator('.home-newsletter').waitFor();
});
await test('Public card route and refresh contain all original resources without subscription claims', async () => {
  const r = await page.goto(base + '/newsletter/first-ai-card', { waitUntil: 'domcontentloaded' }); assert.equal(r.status(), 200);
  await page.getByRole('heading', { name: '第一张 AI 实战卡', exact: true }).waitFor();
  assert.match(await page.locator('.practice-card__preview').innerText(), /资源预览.*订阅入口筹备中/);
  assert.match(await page.locator('.practice-card__disclosure').innerText(), /访问本页不代表邮箱已确认或已订阅/);
  assert.equal(await page.locator('main section').count(), 5);
  assert.equal(await page.locator('input,textarea,form,iframe').count(), 0);
  await noOverflow(); await audit('practice-card-mobile');
  await page.screenshot({ path: output + '/production-card-mobile.png', fullPage: true });
  await page.reload(); await page.getByRole('heading', { name: '第一张 AI 实战卡', exact: true }).waitFor();
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
await test('No runtime errors or subscription-service attempts occurred; live forms never submitted', async () => {
  assert.deepEqual(errors, []);
  assert(!requests.some(r => /kit\.com|convertkit/.test(r.origin)));
  assert(!requests.some(r => r.origin === base && (r.hasBody || !['GET', 'HEAD'].includes(r.method()))));
});
await writeFile(output + '/production-browser-results.json', JSON.stringify({ testedAt: new Date().toISOString(), base, browser: await browser.version(), checks, errors, requests, accessibility, limits: ['Fresh isolated context, same-origin GET/HEAD only; external requests blocked.', 'No real subscribe, confirmation, unsubscribe, analytics or email send tests.'] }, null, 2));
await browser.close();
assert(checks.every(c => c.status === 'passed'), 'Production smoke failed; inspect evidence');
