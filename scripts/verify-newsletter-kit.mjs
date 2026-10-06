import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { installKitMock, KIT_TEST } from './newsletter-qa-kit.mjs';

const base = process.env.NEWSLETTER_BASE_URL ?? 'http://127.0.0.1:4180';
assert(['localhost', '127.0.0.1'].includes(new URL(base).hostname), 'Mock subscription QA is local only');
const output = resolve(process.env.NEWSLETTER_KIT_OUTPUT ?? '/tmp/dailycosmos-kit-integration-qa/results');
await mkdir(output, { recursive: true });
const { chromium } = await import(pathToFileURL(resolve(process.env.NEWSLETTER_PLAYWRIGHT_MODULE ?? '/tmp/dalei-newsletter-qa-20261005/isolated-qa/node_modules/playwright/index.mjs')).href);
const browser = await chromium.launch({ executablePath: process.env.NEWSLETTER_BROWSER_PATH ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true });
const results = [], runs = [], accessibility = [], errors = [], contexts = [];
const check = async (name, fn) => {
  try { await fn(); results.push({ name, status: 'passed' }); }
  catch (error) { results.push({ name, status: 'failed', error: error.stack }); }
  console.log(results.at(-1));
};
async function fixture(options = {}) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' }); contexts.push(context);
  if (options.storageBlocked) await context.addInitScript(() => {
    for (const method of ['getItem', 'setItem', 'removeItem']) Object.defineProperty(Storage.prototype, method, { value() { throw new DOMException('Storage disabled for local QA', 'SecurityError'); } });
  });
  if (options.language) await context.addInitScript(lang => localStorage.setItem('dalei-lang-v2', lang), options.language);
  const mock = await installKitMock(context, base); Object.assign(mock.state, options);
  const page = await context.newPage(); page.setDefaultTimeout(10000);
  page.on('pageerror', error => errors.push({ message: error.message }));
  page.on('console', event => {
    // Check console content in memory; retain only a Boolean for possible data exposure.
    if (event.text().includes('reader@example.com')) errors.push({ message: 'Reserved email address unexpectedly appeared in browser console' });
  });
  const signup = () => page.locator('.kit-signup').first();
  const input = () => signup().locator('input[name="email_address"]');
  const submit = () => signup().locator('[data-element="submit"]');
  const load = async (path = '/newsletter', state = 'ready') => {
    const response = await page.goto(base + path); assert.equal(response.status(), 200);
    await signup().waitFor();
    if (state) await signup().and(page.locator(`[data-kit-load="${state}"]`)).waitFor();
    if (path === '/' && state === 'ready') await page.evaluate(async () => {
      const image = document.querySelector('.home-newsletter__avatar'); if (image instanceof HTMLImageElement) await image.decode();
    });
  };
  const record = name => runs.push({ name, ...mock.report() });
  return { context, page, mock, signup, input, submit, load, record };
}
const noConfirmation = async signup => {
  const text = await signup.innerText();
  assert(!/subscription (?:is )?confirmed|successfully subscribed|you are (?:now )?subscribed|已成功订阅|已成功訂閱|订阅成功|訂閱成功|邮箱已确认|郵箱已確認/i.test(text), 'Submitting alone never proves confirmation');
};
const noPersistentEmail = async page => {
  const contains = await page.evaluate(() => JSON.stringify({ local: { ...localStorage }, session: { ...sessionStorage }, cookie: document.cookie }).includes('reader@example.com'));
  assert(!contains, 'Email is not persisted in cookies or browser storage');
  assert(!page.url().includes('reader'), 'Email is not placed in the URL');
};
async function audit(page, label) {
  await page.addScriptTag({ path: process.env.NEWSLETTER_AXE_PATH ?? '/tmp/dalei-newsletter-qa-20261005/isolated-qa/node_modules/axe-core/axe.min.js' });
  const report = await page.evaluate(async () => { const r = await window.axe.run(document.querySelector('.kit-signup'), { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] } }); return { violations: r.violations, incomplete: r.incomplete.map(({ id }) => id), passes: r.passes.length }; });
  accessibility.push({ label, ...report }); assert.equal(report.violations.length, 0, JSON.stringify(report.violations.map(v => ({ id: v.id, targets: v.nodes.map(n => n.target) }))));
}
await check('Original official embed and SDK initialize the configured public form; only email is required', async () => {
  const f = await fixture(); await f.load();
  assert(f.mock.state.assets.some(x => x.kind === 'embed') && f.mock.state.assets.some(x => x.kind === 'sdk'));
  const form = f.signup().locator('form');
  assert.equal(await form.getAttribute('data-sv-form'), KIT_TEST.id); assert.equal(await form.getAttribute('data-uid'), KIT_TEST.uid);
  assert.equal(await form.getAttribute('action'), KIT_TEST.subscription);
  assert.equal(await form.getAttribute('method'), 'post');
  assert.equal(await f.signup().locator('input[required]').count(), 1);
  assert.equal(await f.input().getAttribute('type'), 'email'); assert.equal(await f.input().getAttribute('inputmode'), 'email');
  const id = await f.input().getAttribute('id'); assert.equal(await f.signup().locator('label').getAttribute('for'), id);
  assert.equal(await f.input().getAttribute('aria-label'), 'Email address');
  assert(!(await f.signup().locator('.kit-signup__mount').evaluate(node => node.inert)));
  assert(!(await f.submit().isDisabled())); await noConfirmation(f.signup());
  await audit(f.page, 'ready-English'); f.record('official-initialization');
});
await check('Invalid and empty input are rejected locally, with focused accessible feedback and zero subscription requests', async () => {
  const f = await fixture(); await f.load();
  for (const value of ['', 'invalid']) {
    await f.input().fill(value); await f.submit().click();
    await f.signup().getByRole('alert').waitFor();
    assert.match(await f.signup().getByRole('alert').innerText(), /complete email/i);
    assert(await f.input().evaluate(input => document.activeElement === input));
    assert.equal(f.mock.state.subscriptions.length, 0);
    assert.equal(await f.input().getAttribute('aria-invalid'), 'true');
    const errorId = await f.signup().getByRole('alert').getAttribute('id');
    assert(errorId && (await f.input().getAttribute('aria-describedby')).split(' ').includes(errorId), 'Invalid input points to the actual accessible error');
  }
  await audit(f.page, 'invalid-English'); f.record('invalid-input');
});
await check('Keyboard submission suppresses synchronous duplicate submits and shows only a pending-confirmation message after mock success', async () => {
  const f = await fixture({ response: 'deferred' }); await f.load();
  await f.input().fill('reader@example.com'); await f.submit().focus(); await f.page.keyboard.press('Enter');
  await f.submit().and(f.page.locator(':disabled')).waitFor();
  await f.signup().locator('form').evaluate(form => { for (let i = 0; i < 4; i++) form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })); });
  assert.equal(f.mock.state.subscriptions.length, 1);
  assert.equal(await f.signup().locator('[data-element="success"]').count(), 0);
  await noConfirmation(f.signup()); f.mock.release();
  await f.signup().locator('[data-element="success"]').waitFor();
  assert.match(await f.signup().locator('[data-element="success"]').innerText(), /confirm/i);
  assert.equal(await f.input().count(), 0); await noPersistentEmail(f.page); await noConfirmation(f.signup());
  await audit(f.page, 'pending-English'); f.record('duplicate-and-pending');
});
await check('HTTP, network and unknown-result errors are generic, do not reveal platform text or membership, and permit an explicit retry', async () => {
  for (const response of ['http-error', 'network-error', 'unknown']) {
    const f = await fixture({ response }); await f.load();
    await f.input().fill('reader@example.com'); await f.submit().click();
    await f.signup().getByRole('alert').waitFor();
    const text = await f.signup().getByRole('alert').innerText();
    assert.match(text, /not confirmed|did not confirm|has not confirmed/i);
    assert(!/Service unavailable for local QA|Result is unknown for local QA|already subscribed|reader@example.com/.test(text));
    assert.equal(await f.signup().locator('[data-element="success"]').count(), 0);
    assert(!(await f.submit().isDisabled())); assert.equal(f.mock.state.subscriptions.length, 1);
    await noConfirmation(f.signup()); await noPersistentEmail(f.page);
    f.mock.state.response = 'success'; await f.input().fill('reader@example.com'); await f.submit().click();
    await f.signup().locator('[data-element="success"]').waitFor(); assert.equal(f.mock.state.subscriptions.length, 2);
    await noConfirmation(f.signup()); f.record('error-' + response);
  }
});
await check('A slow submission reports unknown progress at 20 seconds and does not automatically retry or mark confirmation', async () => {
  const f = await fixture({ response: 'deferred' }); await f.load(); await f.page.clock.install();
  await f.input().fill('reader@example.com'); await f.submit().click();
  await f.submit().and(f.page.locator(':disabled')).waitFor();
  await f.page.clock.fastForward(20100);
  await f.signup().getByRole('status').getByText(/not (?:yet )?confirmed|unconfirmed|check your inbox/i).waitFor();
  assert.equal(f.mock.state.subscriptions.length, 1);
  await f.page.clock.fastForward(20100); assert.equal(f.mock.state.subscriptions.length, 1);
  assert.equal(await f.signup().locator('[data-element="success"]').count(), 0); await noConfirmation(f.signup());
  f.mock.release(); await f.signup().locator('[data-element="success"]').waitFor(); f.record('slow-uncertain');
});
await check('Embed and SDK failures fail closed, show the real hosted fallback and support a fresh loading attempt', async () => {
  for (const script of ['embed-error', 'sdk-error']) {
    const f = await fixture({ script }); await f.load('/newsletter', 'unavailable');
    assert(await f.signup().locator('.kit-signup__mount').isHidden());
    assert(await f.signup().locator('.kit-signup__mount').evaluate(node => node.inert));
    const fallback = f.signup().locator(`.kit-signup__fallback a[href="${KIT_TEST.share}"]`);
    assert.equal(await fallback.getAttribute('href'), KIT_TEST.share); assert.equal(await fallback.getAttribute('target'), '_blank');
    assert.match(await fallback.getAttribute('rel'), /noopener/);
    assert.equal(f.mock.state.subscriptions.length, 0);
    await audit(f.page, script);
    f.mock.state.script = 'ready'; await f.signup().locator('.kit-signup__fallback button').click();
    await f.signup().and(f.page.locator('[data-kit-load="ready"]')).waitFor();
    assert(!(await f.submit().isDisabled())); assert.equal(await f.input().inputValue(), ''); f.record(script + '-retry');
  }
});
await check('Unavailable storage skips both official scripts, preserves interface language selection and shows a safe hosted fallback', async () => {
  const f = await fixture({ storageBlocked: true }); await f.load('/newsletter', 'unavailable');
  assert.equal(f.mock.state.assets.length, 0); assert.equal(f.mock.state.subscriptions.length, 0); assert.equal(f.mock.state.visits, 0);
  assert(await f.signup().locator('.kit-signup__mount').isHidden()); assert(await f.signup().locator('.kit-signup__mount').evaluate(node => node.inert));
  assert.equal(await f.signup().locator(`a[href="${KIT_TEST.share}"]`).getAttribute('target'), '_blank');
  await f.page.locator('.nl-language button[aria-label="简体中文"]').click();
  await f.signup().getByText(/订阅表单暂时无法加载/).waitFor(); assert.equal(await f.page.locator('html').getAttribute('lang'), 'zh-CN');
  await f.page.locator('.nl-wordmark').click(); await f.page.locator('.home-newsletter').waitFor();
  await f.signup().and(f.page.locator('[data-kit-load="unavailable"]')).waitFor();
  assert.equal(await f.page.locator('html').getAttribute('lang'), 'zh-CN'); assert.equal(f.mock.state.assets.length, 0);
  await audit(f.page, 'storage-unavailable'); f.record('storage-unavailable');
});
await check('SDK timeout never exposes the uninitialized native form or permits keyboard submission', async () => {
  const f = await fixture({ script: 'sdk-hang' }); await f.page.clock.install(); await f.load('/newsletter', null);
  await f.page.waitForFunction(() => document.querySelector('.kit-signup__mount form') !== null);
  assert(await f.signup().locator('.kit-signup__mount').isHidden()); assert(await f.signup().locator('.kit-signup__mount').evaluate(node => node.inert));
  await f.page.clock.fastForward(12100); await f.signup().and(f.page.locator('[data-kit-load="unavailable"]')).waitFor();
  assert.equal(f.mock.state.subscriptions.length, 0); assert(await f.signup().locator('.kit-signup__mount').isHidden());
  f.mock.release(); f.record('SDK-timeout');
});
await check('English, simplified and traditional labels, buttons, validation and exact pending text stay synchronized', async () => {
  for (const [language, label, button, pending] of [
    ['en', 'Email address', /Subscribe free/, /confirm/i], ['zh', '邮箱', /免费订阅/, /还差一步.*确认/], ['zhHant', '郵箱', /免費訂閱/, /還差一步.*確認/],
  ]) {
    const f = await fixture({ language }); await f.load();
    await f.page.getByRole('textbox', { name: label, exact: true }).waitFor(); assert.match(await f.submit().innerText(), button);
    await f.input().fill('invalid'); await f.submit().click(); await f.signup().getByRole('alert').waitFor();
    assert.equal(await f.page.locator('.nl-language button[aria-pressed="true"]').innerText(), language === 'en' ? 'EN' : language === 'zh' ? '简' : '繁');
    await f.input().fill('reader@example.com'); await f.submit().click();
    await f.signup().locator('[data-element="success"]').waitFor(); assert.match(await f.signup().locator('[data-element="success"]').innerText(), pending);
    await noConfirmation(f.signup()); await noPersistentEmail(f.page); await audit(f.page, 'pending-' + language);
    await f.page.screenshot({ path: output + '/pending-' + language + '.png', fullPage: true }); f.record('localized-' + language);
  }
});
await check('320/390/1440px home and subscription routes remain usable; first-screen form geometry is recorded honestly', async () => {
  const f = await fixture({ language: 'zh' });
  const geometry = [];
  for (const path of ['/', '/newsletter']) for (const width of [320,390,1440]) {
    await f.page.setViewportSize({ width, height: width === 320 ? 740 : width === 390 ? 844 : 1000 }); await f.load(path);
    assert(await f.page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    const field = await f.input().boundingBox(), button = await f.submit().boundingBox();
    assert(field && button && field.width > 100 && button.width > 100, 'Form remains visible and operable');
    geometry.push({ path, width, height: f.page.viewportSize().height, field, button, fieldInFirstViewport: field.y >= 64 && field.y + field.height <= f.page.viewportSize().height, buttonInFirstViewport: button.y >= 64 && button.y + button.height <= f.page.viewportSize().height });
    await f.page.screenshot({ path: output + '/' + (path === '/' ? 'home' : 'newsletter') + '-zh-' + width + '.png', fullPage: false });
    await writeFile(output + '/form-geometry.json', JSON.stringify(geometry,null,2));
    if (path === '/') assert(field.y >= 64 && button.y + button.height <= f.page.viewportSize().height, 'Homepage primary form belongs in the first viewport: ' + JSON.stringify(geometry.at(-1)));
  }
  await writeFile(output + '/form-geometry.json', JSON.stringify(geometry,null,2)); f.record('responsive-form');
});
await check('Navigation and refresh clear unsent address input, while publicly visiting the card never creates confirmation state', async () => {
  const f = await fixture(); await f.load('/'); await f.input().fill('reader@example.com');
  await f.page.locator('.home-newsletter__resource a').click(); await f.page.locator('.practice-card').waitFor();
  assert.equal(await f.page.locator('form,input,iframe').count(), 0);
  assert.match(await f.page.locator('.practice-card__disclosure').innerText(), /does not confirm an email|does not.*subscription/i);
  await f.page.locator('.practice-card__header a[href="/"]').click(); await f.signup().and(f.page.locator('[data-kit-load="ready"]')).waitFor();
  assert.equal(await f.input().inputValue(), ''); await f.input().fill('reader@example.com');
  await f.page.reload(); await f.signup().and(f.page.locator('[data-kit-load="ready"]')).waitFor(); assert.equal(await f.input().inputValue(), '');
  await noPersistentEmail(f.page); assert.equal(f.mock.state.subscriptions.length,0); f.record('navigation-privacy');
});
await check('An in-flight official request can finish after leaving without leaking its address or applying old pending state to a new widget', async () => {
  for (const destination of ['/', '/newsletter/first-ai-card']) {
    const f = await fixture({ response: 'deferred' }); await f.load();
    await f.input().fill('reader@example.com'); await f.submit().click();
    await f.submit().and(f.page.locator(':disabled')).waitFor();
    assert.equal(f.mock.state.subscriptions.length, 1);
    await f.signup().locator('form').evaluate(form => {
      window.__previousKitForm = form; window.__previousKitCompleted = 0;
      form.addEventListener('ckjs:submission:complete', () => { window.__previousKitCompleted += 1; });
    });
    await f.page.locator('.nl-wordmark').click(); await f.page.locator('.home-newsletter').waitFor();
    await f.signup().and(f.page.locator('[data-kit-load="ready"]')).waitFor();
    if (destination !== '/') { await f.page.locator('.home-newsletter__resource a').click(); await f.page.locator('.practice-card').waitFor(); }
    assert(await f.page.evaluate(() => !window.__previousKitForm.isConnected && window.__previousKitForm.querySelector('input[name="email_address"]').value === ''), 'Unmount clears the detached form’s address');
    if (destination === '/') {
      assert.equal(await f.input().inputValue(), ''); assert.equal(await f.signup().locator('[data-element="success"]').count(), 0);
    } else assert.equal(await f.page.locator('.kit-signup').count(), 0);
    f.mock.release();
    await f.page.waitForFunction(() => window.__previousKitCompleted === 1);
    assert.equal(f.mock.state.subscriptions.length, 1, 'Leaving neither retries nor claims to cancel the server request');
    if (destination !== '/') {
      assert.equal(await f.page.locator('.kit-signup').count(), 0);
      assert.match(await f.page.locator('.practice-card__disclosure').innerText(), /does not confirm an email|does not.*subscription/i);
      await f.page.locator('.practice-card__header a[href="/"]').click(); await f.signup().and(f.page.locator('[data-kit-load="ready"]')).waitFor();
    }
    assert.equal(await f.input().inputValue(), ''); assert.equal(await f.signup().locator('[data-element="success"]').count(), 0);
    await noConfirmation(f.signup()); await noPersistentEmail(f.page); f.record('detached-request-' + destination);
  }
});
await check('Existing Life Quest, Skills and map routes keep rendering with no subscription submission', async () => {
  const f = await fixture();
  for (const path of ['/life-quest','/skills','/map-route-broll']) {
    const response = await f.page.goto(base + path); assert.equal(response.status(),200); await f.page.locator('main h1').waitFor();
    assert((await f.page.locator('main h1').first().innerText()).length > 3); assert.equal(await f.page.locator('.kit-signup').count(),0);
  }
  assert.equal(f.mock.state.subscriptions.length,0); f.record('old-routes');
});
await check('No browser errors, no real service writes and no raw request bodies are recorded', async () => {
  assert.deepEqual(errors,[]); assert(runs.every(run => run.liveWrites === 0));
  assert(!JSON.stringify(runs).includes('reader@example.com'));
});
const officialSources = [];
for (const file of ['official-embed.js','ck.5.js']) {
  const bytes=await readFile(KIT_TEST.directory + '/' + file); officialSources.push({ file, bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex') });
}
for (const context of contexts) await context.close(); await browser.close();
await writeFile(output + '/kit-browser-results.json', JSON.stringify({ testedAt: new Date().toISOString(), base, results, runs, errors, officialSources, liveWrites:0, limitations:['All test form POSTs were intercepted and mocked; no real address was submitted.', 'A mock success means pending email confirmation only. Actual inbox confirmation, delivery and unsubscribe require the owner’s separate real test.'] },null,2));
await writeFile(output + '/kit-accessibility.json', JSON.stringify(accessibility,null,2));
if (results.some(result => result.status==='failed')) process.exitCode=1;
