import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const base = process.env.NEWSLETTER_BASE_URL ?? 'http://127.0.0.1:4176';
assert(['127.0.0.1', 'localhost'].includes(new URL(base).hostname), 'Local preview only');
const output = resolve(process.env.NEWSLETTER_HOME_OUTPUT ?? 'output/newsletter-home-review/home');
await mkdir(output, { recursive: true });
const playwright = process.env.NEWSLETTER_PLAYWRIGHT_MODULE
  ? await import(pathToFileURL(resolve(process.env.NEWSLETTER_PLAYWRIGHT_MODULE)).href)
  : await import('playwright');
const browser = await playwright.chromium.launch({
  executablePath: process.env.NEWSLETTER_BROWSER_PATH ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true,
});
const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
// These original editorial regression cases intentionally use the Chinese edition.
await context.addInitScript(() => localStorage.setItem('dalei-lang-v2', 'zh'));
await context.route('**/*', route => new URL(route.request().url()).origin === new URL(base).origin ? route.continue() : route.abort());
const requests = [], pageErrors = [], results = [], accessibility = [], contrast = [];
context.on('request', request => requests.push({ url: request.url(), method: request.method(), body: request.postData() }));
const page = await context.newPage();
page.setDefaultTimeout(7000);
page.on('pageerror', error => pageErrors.push(error.message));
const promo = () => page.locator('.home-newsletter');
const closed = () => promo().getByRole('button', { name: '订阅即将开放', exact: true });
const preview = () => promo().getByRole('link', { name: '查看实战信预览' });
const loadHome = async () => { await page.goto(base + '/'); await promo().waitFor(); await page.evaluate(() => document.fonts.ready); };
const noOverflow = async () => assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'No horizontal overflow');
const visibleInViewport = async locator => {
  const box = await locator.boundingBox();
  assert(box && box.y >= 64 && box.y + box.height <= page.viewportSize().height, 'Visible below fixed header in first viewport');
};
const check = async (name, fn) => {
  try { await fn(); results.push({ name, status: 'passed' }); }
  catch (error) { results.push({ name, status: 'failed', error: error.message }); }
  console.log(results.at(-1));
};
const audit = async state => {
  assert(process.env.NEWSLETTER_AXE_PATH, 'Supply NEWSLETTER_AXE_PATH for accessibility evidence');
  await page.addScriptTag({ path: process.env.NEWSLETTER_AXE_PATH });
  const report = await page.evaluate(async () => {
    const result = await window.axe.run(document.querySelector('.home-newsletter'), {
      runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] },
    });
    return { violations: result.violations, incomplete: result.incomplete.map(({ id }) => id), passes: result.passes.length };
  });
  accessibility.push({ state, ...report });
  assert.equal(report.violations.length, 0, JSON.stringify(report.violations.map(({ id, nodes }) => ({ id, targets: nodes.map(n => n.target) }))));
  // axe reports some contrast checks as incomplete for this styled host page.
  // Every promo text node has the section's solid paper background: verify its
  // computed color independently, including alpha blending, in both themes.
  const colors = await promo().evaluate(section => {
    const rgba = value => value.match(/[\d.]+/g).map(Number);
    const luminance = rgb => rgb.slice(0, 3).map(value => {
      const s = value / 255; return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
    }).reduce((sum, value, i) => sum + value * [0.2126, 0.7152, 0.0722][i], 0);
    const background = rgba(getComputedStyle(section).backgroundColor);
    return ['eyebrow', 'title', 'subtitle', 'resource', 'preview', 'status', 'status-label', 'visual-note'].flatMap(name => {
      const node = section.querySelector('.home-newsletter__' + name);
      if (!node.getClientRects().length) return [];
      const style = getComputedStyle(node), foreground = rgba(style.color), alpha = foreground[3] ?? 1;
      const blended = foreground.slice(0, 3).map((value, i) => value * alpha + background[i] * (1 - alpha));
      const l1 = luminance(blended), l2 = luminance(background);
      const minimum = parseFloat(style.fontSize) >= 24 ? 3 : 4.5;
      return [{ name, foreground: style.color, background: getComputedStyle(section).backgroundColor, ratio: (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05), minimum }];
    });
  });
  contrast.push({ state, colors });
  assert(colors.every(color => color.ratio >= color.minimum), JSON.stringify(colors.filter(color => color.ratio < color.minimum)));
};

await check('Desktop first screen uses approved copy, visible disabled CTA and explicit preview status', async () => {
  await loadHome();
  assert.equal(await promo().getAttribute('lang'), 'zh-CN');
  assert.match(await promo().getByRole('heading').innerText(), /把 AI 方法，\s*变成你能检查的小成果/);
  assert.match(await promo().locator('.home-newsletter__eyebrow').innerText(), /大雷早上好·AI 实战信/);
  for (const copy of ['每天一封 300–500 字：一个结论、一个原理、一个判断，再动手练一次', '从《第一张 AI 实战卡》开始，内含原创样例、三轮提示、空白卡和检查方法']) {
    assert(await promo().getByText(copy, { exact: true }).isVisible());
  }
  assert(await closed().isDisabled());
  assert.match(await promo().locator('#home-newsletter-status').innerText(), /当前为预览，不收集邮箱/);
  assert.match(await promo().locator('#home-newsletter-status').innerText(), /免费阅读.*确认订阅后领取.*随时退订/);
  assert.equal(await promo().locator('input,form,iframe').count(), 0);
  await visibleInViewport(closed()); await visibleInViewport(preview()); await noOverflow();
  await page.screenshot({ path: output + '/home-desktop-1440.png', fullPage: false });
  await audit('desktop-light');
});
await check('Disabled CTA ignores repeated clicks; preview link supports native new-tab semantics', async () => {
  const before = page.url();
  await closed().evaluate(button => { button.click(); button.click(); button.click(); });
  assert.equal(page.url(), before);
  assert.equal(await preview().getAttribute('href'), '/newsletter');
  const [tab] = await Promise.all([context.waitForEvent('page'), preview().click({ modifiers: ['Meta'] })]);
  await tab.waitForURL(base + '/newsletter');
  await tab.getByLabel('邮箱（仅演示）', { exact: true }).waitFor();
  assert.equal(page.url(), before);
  await tab.close();
});
await check('320px, 390px and tablet show the complete CTA within first screen without overflow', async () => {
  for (const [width, height] of [[320, 740], [390, 844], [768, 1024]]) {
    await page.setViewportSize({ width, height }); await loadHome();
    await noOverflow(); await visibleInViewport(closed()); await visibleInViewport(preview());
    const box = await promo().getByRole('heading').boundingBox();
    assert(box.y >= 64, 'Headline clear of header');
    await page.screenshot({ path: output + `/home-${width}.png`, fullPage: false });
    if (width === 390) await audit('mobile-light');
  }
});
await check('Keyboard preview navigation, back, forward and direct refresh preserve demo disclosure', async () => {
  await page.setViewportSize({ width: 1440, height: 900 }); await loadHome();
  await preview().focus();
  assert(await preview().evaluate(link => link === document.activeElement));
  assert.match(await preview().evaluate(link => getComputedStyle(link).outlineStyle), /solid/);
  await page.keyboard.press('Enter');
  await page.getByLabel('邮箱（仅演示）', { exact: true }).waitFor();
  assert.match(page.url(), /\/newsletter$/);
  assert(await page.getByText('尚未开放订阅。本页不收集邮箱，也不会发送邮件。').isVisible());
  await page.goBack(); await promo().waitFor(); assert(await closed().isDisabled());
  await page.goForward(); await page.getByLabel('邮箱（仅演示）', { exact: true }).waitFor();
  await page.reload(); await page.getByLabel('邮箱（仅演示）', { exact: true }).waitFor();
  await page.getByRole('link', { name: '返回大雷主站', exact: true }).click(); await promo().waitFor();
  await page.reload(); await promo().waitFor(); await visibleInViewport(closed());
});
await check('Original hero and all original sections remain; desktop nav returns to Newsletter first screen', async () => {
  assert.equal(await page.locator('#creator-intro h1').count(), 1);
  assert(await page.locator('#creator-intro').getByRole('button', { name: '找个作品试试', exact: true }).isVisible());
  assert(await page.locator('#creator-intro').getByRole('button', { name: '看实战视频', exact: true }).isVisible());
  assert.equal(await page.locator('#home').count(), 1);
  for (const id of ['work', 'videos', 'about', 'now', 'connect']) assert.equal(await page.locator(`section#${id}`).count(), 1);
  await page.locator('header').getByRole('button', { name: '作品与工具', exact: true }).click();
  await page.waitForFunction(() => Math.abs(document.querySelector('#work').getBoundingClientRect().top - 96) < 4);
  await page.locator('header').getByRole('button', { name: '首页', exact: true }).click();
  await page.waitForFunction(() => Math.abs(document.querySelector('#home').getBoundingClientRect().top) < 4);
  await visibleInViewport(closed());
});
await check('Mobile menu, language switch and theme remain usable; promo follows the chosen language', async () => {
  await page.setViewportSize({ width: 390, height: 844 }); await loadHome();
  const menu = page.getByRole('button', { name: 'Menu', exact: true });
  await menu.click(); assert.equal(await menu.getAttribute('aria-expanded'), 'true');
  await page.locator('#mobile-nav').getByRole('button', { name: '首页', exact: true }).click();
  assert.equal(await menu.getAttribute('aria-expanded'), 'false');
  await page.getByRole('button', { name: '简', exact: true }).click();
  assert.equal(await page.getByRole('button', { name: '简', exact: true }).getAttribute('aria-pressed'), 'true');
  assert.equal(await promo().getAttribute('lang'), 'zh-CN');
  await menu.click(); await page.locator('#mobile-nav').getByRole('button', { name: '主题', exact: true }).click();
  assert.equal(await page.locator('html').getAttribute('data-theme'), 'dark');
  await menu.click(); await noOverflow(); await audit('mobile-dark');
  await page.screenshot({ path: output + '/home-390-dark.png', fullPage: false });
  await page.setViewportSize({ width: 1440, height: 900 }); await loadHome();
  await audit('desktop-dark'); await page.screenshot({ path: output + '/home-desktop-dark.png', fullPage: false });
  await page.getByRole('button', { name: '切换到浅色模式 / Switch to light mode', exact: true }).click();
  await page.getByRole('button', { name: 'EN', exact: true }).click();
  assert.equal(await promo().getAttribute('lang'), 'en');
  assert.match(await promo().locator('h2').innerText(), /small results you can verify/);
});
await check('With external requests unavailable, local preview works and performs no subscription traffic', async () => {
  await loadHome(); assert(await closed().isDisabled());
  await preview().click(); await page.getByLabel('邮箱（仅演示）', { exact: true }).waitFor();
  assert(await page.getByText('尚未开放订阅。本页不收集邮箱，也不会发送邮件。').isVisible());
  assert(!requests.some(request => /kit\.com|convertkit/.test(request.url)), 'No Kit request');
  const ownRequests = requests.filter(request => new URL(request.url).origin === new URL(base).origin);
  assert(ownRequests.every(request => !request.body && request.method === 'GET'), 'No same-origin submitted data');
  assert(!requests.some(request => /example\.com|%40/i.test(request.url) || /example\.com|%40/i.test(request.body ?? '')), 'No email in request URLs or bodies');
  assert.equal(pageErrors.length, 0, 'No runtime page errors');
});
await writeFile(output + '/home-browser-results.json', JSON.stringify({ testedAt: new Date().toISOString(), base, browser: await browser.version(), results, pageErrors, notes: ['Fresh isolated headless browser; external requests blocked, including baseline analytics attempts. Same-origin reads and absence of email traffic are checked separately.', 'Real Kit form, confirmation and unsubscribe are outside this preview verification.'] }, null, 2) + '\n');
await writeFile(output + '/home-axe-results.json', JSON.stringify(accessibility, null, 2) + '\n');
await writeFile(output + '/home-contrast-results.json', JSON.stringify(contrast, null, 2) + '\n');
await context.close(); await browser.close();
assert(results.every(result => result.status === 'passed'), 'One or more checks failed; see home-browser-results.json');
