import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve, extname } from 'node:path';
import { pathToFileURL } from 'node:url';

const root = resolve(new URL('..', import.meta.url).pathname);
const config = JSON.parse(await readFile(resolve(root, 'vercel.json'), 'utf8'));
const output = resolve(root, 'output/playwright/newsletter-seo');
await mkdir(output, { recursive: true });
const results = [], errors = [], blockedWrites = [];
// Local approximation of the checked-in Vercel redirects/rewrites. Edge behavior
// must be checked on a deployment before claiming production success.
const server = createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  const redirect = config.redirects.find(rule => rule.source === url.pathname);
  if (redirect) { res.writeHead(308, { Location: redirect.destination + url.search }); res.end(); return; }
  const rewrite = config.rewrites.find(rule => rule.source === url.pathname);
  let file = rewrite?.destination ?? url.pathname;
  try {
    if (file.includes('..')) throw new Error('Invalid path');
    let data;
    try { data = await readFile(resolve(root, 'dist', '.' + file)); }
    catch { file = '/index.html'; data = await readFile(resolve(root, 'dist/index.html')); }
    const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.xml': 'application/xml', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.png': 'image/png' };
    res.writeHead(200, { 'Content-Type': types[extname(file)] ?? 'application/octet-stream' }); res.end(data);
  } catch { res.writeHead(404); res.end(); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const base = `http://127.0.0.1:${server.address().port}`;
const { chromium } = await import(pathToFileURL(resolve(process.env.NEWSLETTER_PLAYWRIGHT_MODULE ?? '/tmp/newsletter-fix-qa/node_modules/playwright/index.mjs')).href);
let browser;
const expected = [
  ['/', 'https://dailycosmos.net/', 'index, follow'],
  ['/newsletter', 'https://dailycosmos.net/newsletter', 'index, follow'],
  ['/newsletter/demo', 'https://dailycosmos.net/newsletter/demo', 'noindex, nofollow'],
  ['/newsletter/first-ai-card', 'https://dailycosmos.net/newsletter/first-ai-card', 'noindex, nofollow'],
];
async function metadata(page, route) {
  const [, canonical, robots] = expected.find(([path]) => path === route);
  await page.waitForFunction(({ canonical, robots }) => document.querySelector('link[rel="canonical"]')?.href === canonical && document.querySelector('meta[name="robots"]')?.content === robots, { canonical, robots });
  assert.equal(await page.locator('link[rel="canonical"]').count(), 1);
  assert.equal(await page.locator('meta[name="robots"]').count(), 1);
  assert.equal(await page.locator('meta[property="og:url"]').getAttribute('content'), canonical);
}
try {
  for (const [path, canonical, robots] of expected) {
    for (const suffix of path === '/' ? [''] : ['', '/']) {
      const response = await fetch(base + path + suffix); assert.equal(response.status, 200);
      const html = await response.text();
      assert.equal((html.match(/rel="canonical"/g) ?? []).length, 1);
      assert(html.includes(`rel="canonical" href="${canonical}"`));
      assert(html.includes(`name="robots" content="${robots}"`));
      assert(html.includes(`property="og:url" content="${canonical}"`));
    }
  }
  for (const path of ['/content', '/content/']) {
    const response = await fetch(base + path + '?source=check', { redirect: 'manual' });
    assert.equal(response.status, 308); assert.equal(response.headers.get('location'), '/?source=check');
  }
  const sitemap = await (await fetch(base + '/sitemap.xml')).text();
  assert(sitemap.includes('<loc>https://dailycosmos.net/newsletter</loc>'));
  assert(!sitemap.includes('/newsletter/demo') && !sitemap.includes('/newsletter/first-ai-card'));
  results.push({ check: 'Initial HTML, slash variants, sitemap and two exact redirects', status: 'passed', note: 'Local config emulation, not Vercel edge validation' });
  browser = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true });
  for (const width of [390, 1440]) for (const [lang, tag, name] of [['en', 'en', 'EN · English'], ['zh', 'zh-CN', '简体中文'], ['zhHant', 'zh-Hant', '繁體中文']]) {
    const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
    await context.addInitScript(lang => {
      localStorage.setItem('dalei-lang-v2', lang);
      Object.defineProperty(navigator, 'clipboard', { value: { writeText: async text => { window.__copied = text; } } });
    }, lang);
    await context.route('**/*', route => {
      const request = route.request();
      if (!['GET', 'HEAD'].includes(request.method())) { blockedWrites.push({ method: request.method(), pathname: new URL(request.url()).pathname }); return route.abort(); }
      return new URL(request.url()).origin === base ? route.continue() : route.abort();
    });
    const page = await context.newPage(); page.setDefaultTimeout(10000); page.on('pageerror', error => errors.push(error.message));
    await page.goto(base); await page.locator('.home-newsletter__subscribe').click();
    await page.locator('.newsletter').waitFor(); await metadata(page, '/newsletter');
    await page.waitForFunction(tag => document.documentElement.lang === tag, tag);
    await page.locator('.nl-language').getByRole('button', { name, exact: true }).click();
    assert.equal(await page.locator('.nl-language button[aria-pressed="true"]').count(), 1);
    await page.locator('.kit-signup[data-kit-load="unavailable"]').waitFor();
    assert.equal(await page.locator('.kit-signup a[href="https://dalei-team.kit.com/552003a794"]').count(), 1);
    assert.equal(await page.locator('#newsletter-privacy a[href="mailto:support@dailycosmos.net"]').count(), 1);
    await page.reload(); await page.locator('.newsletter').waitFor(); await metadata(page, '/newsletter');
    await page.waitForFunction(tag => document.documentElement.lang === tag, tag);
    await page.locator('.nl-wordmark').click(); await page.locator('.home-newsletter').waitFor(); await metadata(page, '/');
    await page.goBack(); await page.locator('.newsletter').waitFor(); await metadata(page, '/newsletter');
    await page.goto(base + '/newsletter/demo'); await page.locator('#newsletter-email').waitFor(); await metadata(page, '/newsletter/demo');
    await page.locator('#newsletter-email').fill('reader@example.com');
    await page.reload(); await page.locator('#newsletter-email').waitFor(); assert.equal(await page.locator('#newsletter-email').inputValue(), ''); await metadata(page, '/newsletter/demo');
    await page.locator('.nl-wordmark').click(); await page.locator('.home-newsletter').waitFor(); await metadata(page, '/');
    await page.goto(base + '/newsletter/first-ai-card'); await page.locator('.practice-card').waitFor(); await metadata(page, '/newsletter/first-ai-card');
    await page.locator('.practice-card__button').filter({ hasText: /复制八行|複製八行|Copy the eight/ }).first().click();
    assert((await page.evaluate(() => window.__copied)).length > 100);
    const pending = page.waitForEvent('download'); await page.locator('.practice-card__button').filter({ hasText: /下载新人|下載新人|Download your starter/ }).first().click();
    const download = await pending; assert.equal(download.suggestedFilename(), `dalei-ai-starter-${lang}.md`);
    assert((await readFile(await download.path(), 'utf8')).includes(await page.evaluate(() => window.__copied)));
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await page.screenshot({ path: resolve(output, `card-${lang}-${width}.png`), fullPage: false });
    await page.locator('header a[href="/newsletter"]').click(); await page.locator('.newsletter').waitFor(); await metadata(page, '/newsletter');
    await page.goBack(); await page.locator('.practice-card').waitFor(); await metadata(page, '/newsletter/first-ai-card');
    await page.goto(base + '/#/newsletter'); await page.locator('.newsletter').waitFor(); await metadata(page, '/newsletter');
    await context.close(); results.push({ check: 'Language, navigation/back/refresh/hash, demo input clearing, unavailable-form fallback, card copy/download/privacy', lang, width, status: 'passed' });
  }
  assert.deepEqual(errors, []);
  assert.equal(blockedWrites.filter(write => write.pathname.includes('/subscriptions')).length, 0);
} finally {
  if (browser) await browser.close();
  await new Promise(resolve => server.close(resolve));
  await writeFile(resolve(output, 'results.json'), JSON.stringify({ results, errors, blockedWrites, liveWrites: 0, realSubscriptions: 0, scope: 'built files + local Vercel config emulation; all external browser requests blocked' }, null, 2));
}
console.log(`${results.length} checks passed; zero real subscriptions or emails.`);
