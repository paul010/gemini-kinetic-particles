import { installKitMock, KIT_TEST } from './newsletter-qa-kit.mjs';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const base = process.env.NEWSLETTER_BASE_URL ?? 'http://127.0.0.1:4180';
assert(['localhost', '127.0.0.1'].includes(new URL(base).hostname), 'Language QA is local only');
const output = resolve(process.env.NEWSLETTER_LANGUAGE_OUTPUT ?? '/tmp/dailycosmos-language-qa');
await mkdir(output, { recursive: true });
const modulePath = process.env.NEWSLETTER_PLAYWRIGHT_MODULE ?? '/tmp/dalei-newsletter-qa-20261005/isolated-qa/node_modules/playwright/index.mjs';
const { chromium } = await import(pathToFileURL(resolve(modulePath)).href);
const browser = await chromium.launch({ executablePath: process.env.NEWSLETTER_BROWSER_PATH ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true });
const contexts = [], kitMocks = [], results = [], accessibility = [], errors = [], requests = [];
async function newContext(blockStorage = false) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
  contexts.push(context);
  await context.addInitScript(({ blockStorage }) => {
    window.__copied = '';
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async text => {
      if (window.__denyCopy) throw new Error('Clipboard denied by local QA');
      window.__copied = text;
    } } });
    if (blockStorage) {
      Object.defineProperty(Storage.prototype, 'getItem', { value() { throw new DOMException('Storage disabled', 'SecurityError'); } });
      Object.defineProperty(Storage.prototype, 'setItem', { value() { throw new DOMException('Storage disabled', 'SecurityError'); } });
    }
  }, { blockStorage });
  const kitMock = await installKitMock(context, base);
  kitMocks.push(kitMock);
  context.on('request', request => requests.push({ method: request.method(), url: request.url(), hasBody: Boolean(request.postData()) }));
  const page = await context.newPage();
  page.setDefaultTimeout(8000); page.on('pageerror', error => errors.push(error.message));
  return { context, page, kitMock };
}
const { page, context } = await newContext();
const chooseHome = lang => page.locator('header [role="group"] button').filter({ hasText: ({ en: /^EN$/, zh: /^简$/, zhHant: /^繁$/ })[lang] }).click();
const choosePage = lang => page.locator('.nl-language').getByRole('button', { name: ({ en: 'EN · English', zh: '简体中文', zhHant: '繁體中文' })[lang], exact: true }).click();
const check = async (name, fn) => {
  try { await fn(); results.push({ name, status: 'passed' }); }
  catch (error) { results.push({ name, status: 'failed', error: error.stack }); }
  console.log(results.at(-1));
};
const tag = lang => ({ en: 'en', zh: 'zh-CN', zhHant: 'zh-Hant' })[lang];
async function waitLanguage(lang, traditionalText) {
  await page.waitForFunction(value => document.documentElement.lang === value, tag(lang));
  if (lang === 'zhHant' && traditionalText) await page.getByText(traditionalText, { exact: false }).first().waitFor();
}
async function audit(page, name, root) {
  const axePath = process.env.NEWSLETTER_AXE_PATH ?? '/tmp/dalei-newsletter-qa-20261005/isolated-qa/node_modules/axe-core/axe.min.js';
  await page.addScriptTag({ path: axePath });
  const report = await page.evaluate(async root => {
    const report = await window.axe.run(document.querySelector(root), { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] } });
    return { violations: report.violations, incomplete: report.incomplete.map(({ id }) => id), passes: report.passes.length };
  }, root);
  accessibility.push({ name, ...report });
  assert.equal(report.violations.length, 0, JSON.stringify(report.violations.map(({ id }) => id)));
}
await check('English remains default; creator invitation and page title agree without a homepage form', async () => {
  await page.goto(base); await page.locator('.home-newsletter').waitFor();
  assert.equal(await page.locator('html').getAttribute('lang'), 'en');
  assert.match(await page.locator('.home-newsletter__subscribe').innerText(), /Get the free AI letter/);
  assert.equal(await page.locator('.home-newsletter__subscribe').getAttribute('href'), '/newsletter');
  assert.equal(await page.locator('.home-newsletter form,input,iframe').count(), 0);
  assert.match(await page.title(), /Practical AI/);
  assert(!/[\p{Script=Han}]/u.test(await page.locator('.home-newsletter').innerText()));
});
await check('Home selector switches promo immediately in simplified and OpenCC traditional Chinese', async () => {
  await chooseHome('zh'); await waitLanguage('zh');
  assert.match(await page.locator('.home-newsletter__subscribe').innerText(), /免费订阅/);
  await chooseHome('zhHant'); await waitLanguage('zhHant', '免費訂閱');
  assert.match(await page.locator('.home-newsletter__subscribe').innerText(), /訂閱/);
  assert.match(await page.title(), /實戰/);
});
await check('Language persists through SPA navigation, standalone selection, browser back, refresh and home return', async () => {
  await page.locator('.home-newsletter__subscribe').click(); await page.locator('.newsletter').waitFor();
  await waitLanguage('zhHant'); await page.locator('.kit-signup[data-kit-load="ready"]').waitFor();
  assert.equal(await page.locator('.nl-language button[aria-pressed="true"]').innerText(), '繁');
  await page.reload(); await page.locator('.newsletter').waitFor(); await waitLanguage('zhHant'); await page.locator('.kit-signup[data-kit-load="ready"]').waitFor();
  await choosePage('en'); await waitLanguage('en');
  assert.match(await page.title(), /AI Practice Letter/);
  assert(!/Subscription demo/.test(await page.title()));
  assert(!/[\p{Script=Han}]/u.test(await page.locator('main').innerText()));
  await page.locator('.nl-wordmark').click(); await page.locator('.home-newsletter').waitFor();
  assert.match(await page.locator('.home-newsletter__subscribe').innerText(), /Get the free AI letter/);
  await page.locator('.home-newsletter__resource a').click(); await page.locator('.practice-card').waitFor();
  assert.match(await page.title(), /practice card/);
  await choosePage('zh'); await waitLanguage('zh');
  await page.goBack(); await page.locator('.home-newsletter').waitFor();
  assert.match(await page.locator('.home-newsletter__subscribe').innerText(), /免费订阅/);
});
await check('Sample letters remain marked as unsent and every translated state preserves the demo safety rules', async () => {
  await page.goto(base + '/newsletter/demo'); await page.locator('.newsletter').waitFor(); await choosePage('en');
  assert.match(await page.locator('.nl-letter-meta').innerText(), /Not sent/);
  await page.locator('#newsletter-email').fill('invalid'); await page.locator('.nl-input-row button').click();
  assert.match(await page.locator('#email-error').innerText(), /complete email/);
  await choosePage('zhHant'); await waitLanguage('zhHant', '請輸入完整');
  await choosePage('en'); await page.locator('#newsletter-email').fill('reader@real-mail.test'); await page.locator('.nl-input-row button').click();
  assert.match(await page.locator('#email-error').innerText(), /do not enter a real email/);
  await page.locator('#newsletter-email').fill('reader@example.com'); await page.locator('.nl-input-row button').click();
  await page.getByRole('heading', { name: 'Demo: confirm your email next' }).waitFor();
  await choosePage('zhHant'); await waitLanguage('zhHant', '演示：下一步是確認郵箱');
  await page.getByRole('button', { name: '查看歡迎內容（演示）' }).click();
  await page.getByRole('heading', { name: '演示：確認後的歡迎內容' }).waitFor();
  await choosePage('en'); assert.match(await page.locator('.nl-result').innerText(), /No email was verified/);
  await page.getByRole('button', { name: 'Return and clear the demo' }).click();
  await page.locator('.nl-demo-options summary').click(); await page.locator('#demo-outcome').selectOption('error');
  await page.locator('#newsletter-email').fill('reader@example.com'); await page.locator('.nl-input-row button').click();
  await page.getByRole('heading', { name: 'Demo: service temporarily unavailable' }).waitFor();
  await choosePage('zh'); assert.match(await page.locator('.nl-result').innerText(), /服务暂不可用/);
});
await check('Practice-card reading translation and clipboard payload match each selected language; originals retain 300–500 Chinese characters', async () => {
  await page.goto(base + '/newsletter/first-ai-card'); await page.locator('.practice-card').waitFor();
  for (const lang of ['en', 'zh', 'zhHant']) {
    await choosePage(lang); await waitLanguage(lang, lang === 'zhHant' ? '三輪提示' : undefined);
    await page.locator('button.practice-card__button').first().click();
    const shownPrompts = (await page.locator('.practice-card__prompts pre').allTextContents());
    const copied = await page.evaluate(() => window.__copied);
    for (const text of shownPrompts) assert(copied.includes(text), `Clipboard mismatch for ${lang}`);
    await page.locator('button.practice-card__button').nth(1).click();
    assert.equal(await page.evaluate(() => window.__copied), await page.locator('.practice-card__blank').first().innerText());
    assert(!await page.locator('input,textarea,form').count());
    if (lang === 'en') assert(!/[\p{Script=Han}]/u.test(await page.locator('main').innerText()));
    if (lang === 'zh') {
      const count = [...(await page.locator('.practice-card__lesson-grid p').allTextContents()).join('').matchAll(/\p{Script=Han}/gu)].length;
      assert(count >= 300 && count <= 500, String(count)); results.push({ name: 'Original first lesson Chinese character count', status: 'passed', chineseCharacters: count });
    }
  }
  await page.evaluate(() => { window.__denyCopy = true; }); await page.locator('button.practice-card__button').first().click();
  assert.match(await page.getByRole('status').innerText(), /瀏覽器未允許複製/);
  await choosePage('en'); assert.match(await page.getByRole('status').innerText(), /did not allow copying/);
});
await check('Three languages × four routes × 320/390/768/1440px layouts never overflow; selectors work by keyboard', async () => {
  for (const route of ['/', '/newsletter', '/newsletter/demo', '/newsletter/first-ai-card']) {
    await page.goto(base + route); await page.locator(route === '/' ? '.home-newsletter' : route.endsWith('first-ai-card') ? '.practice-card' : '.newsletter').waitFor();
    for (const lang of ['en', 'zh', 'zhHant']) {
      if (route === '/') await chooseHome(lang); else await choosePage(lang);
      await waitLanguage(lang, route === '/' && lang === 'zhHant' ? '免費訂閱' : undefined);
      for (const width of [320, 390, 768, 1440]) {
        await page.setViewportSize({ width, height: width < 768 ? 844 : 1000 });
        assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${route}, ${lang}, ${width}`);
        if ([390,1440].includes(width)) await page.screenshot({ path: output + '/' + ({ '/':'home', '/newsletter':'newsletter', '/newsletter/demo':'demo', '/newsletter/first-ai-card':'card' })[route] + '-' + lang + '-' + width + '.png', fullPage: route !== '/' });
      }
      if (route !== '/') await audit(page, `${route}-${lang}`, route.endsWith('first-ai-card') ? '.practice-card' : '.newsletter');
    }
  }
  await page.locator('.nl-language button[aria-label="EN · English"]').focus(); await page.keyboard.press('Enter');
  await waitLanguage('en'); assert.equal(await page.locator('.nl-language button[aria-label="EN · English"]').getAttribute('aria-pressed'), 'true');
});
await check('Blocked localStorage keeps a same-tab selection across navigation and degrades safely on refresh', async () => {
  const { page: restricted } = await newContext(true);
  await restricted.goto(base); await restricted.locator('.home-newsletter').waitFor();
  await restricted.locator('header [role="group"] button').filter({ hasText: /^繁$/ }).click();
  await restricted.waitForFunction(() => document.querySelector('.home-newsletter__subscribe')?.textContent.includes('訂閱'));
  await restricted.locator('.home-newsletter__resource a').click(); await restricted.locator('.practice-card').waitFor();
  assert.equal(await restricted.locator('html').getAttribute('lang'), 'zh-Hant');
  await restricted.locator('.nl-language button[aria-label="EN · English"]').click();
  await restricted.locator('.practice-card__header a').first().click(); await restricted.locator('.home-newsletter').waitFor();
  assert.equal(await restricted.locator('html').getAttribute('lang'), 'en');
  await restricted.reload(); await restricted.locator('.home-newsletter').waitFor();
  assert.equal(await restricted.locator('html').getAttribute('lang'), 'en');
});
await check('Other tabs receive shared language changes, including clearing the saved preference', async () => {
  const second = await context.newPage(); await second.goto(base + '/newsletter'); await second.locator('.newsletter').waitFor();
  await page.goto(base); await page.locator('.home-newsletter').waitFor(); await chooseHome('zh');
  await second.waitForFunction(() => document.documentElement.lang === 'zh-CN');
  await page.evaluate(() => localStorage.removeItem('dalei-lang-v2'));
  await second.waitForFunction(() => document.documentElement.lang === 'en');
  await second.close();
});
await check('No unmocked writes or email addresses in URLs/persistent storage; no browser runtime errors', async () => {
  assert(requests.every(request => ['GET', 'HEAD', 'OPTIONS'].includes(request.method) || request.url === KIT_TEST.visit));
  assert(kitMocks.every(mock => mock.report().subscriptionMocks === 0 && mock.report().liveWrites === 0));
  assert.equal(requests.filter(request => /reader%40|reader@|example\.com/.test(request.url) && new URL(request.url).origin === new URL(base).origin).length, 0);
  const values = await page.evaluate(() => ({ local: { ...localStorage }, session: { ...sessionStorage } }));
  assert(!JSON.stringify(values).includes('reader@'));
  assert.deepEqual(errors, []);
});
for (const context of contexts) await context.close(); await browser.close();
await writeFile(output + '/language-results.json', JSON.stringify({ base, results, errors, requests: requests.map(({ method,url }) => ({ method,url })), kitMocks: kitMocks.map(mock => mock.report()), status: results.some(x => x.status === 'failed') ? 'failed' : 'passed' }, null, 2));
await writeFile(output + '/language-accessibility.json', JSON.stringify(accessibility, null, 2));
if (results.some(result => result.status === 'failed')) process.exitCode = 1;
