import { installKitMock, allowReadOnlyKit, KIT_TEST } from './newsletter-qa-kit.mjs';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const base = process.env.NEWSLETTER_BASE_URL ?? 'http://127.0.0.1:4192';
const production = process.env.NEWSLETTER_PRODUCTION_MODE === '1';
assert(production ? base === 'https://dailycosmos.net' : ['127.0.0.1', 'localhost'].includes(new URL(base).hostname), 'Use the local preview, or explicitly opt into read-only production QA');
const output = resolve(process.env.NEWSLETTER_HOME_OUTPUT ?? 'output/home-fusion-review');
await mkdir(output, { recursive: true });
const { chromium } = await import(pathToFileURL(resolve(process.env.NEWSLETTER_PLAYWRIGHT_MODULE ?? '/tmp/dalei-newsletter-qa-20261005/isolated-qa/node_modules/playwright/index.mjs')).href);
const browser = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
await context.addInitScript(() => { try { if (!localStorage.getItem('dalei-lang-v2')) localStorage.setItem('dalei-lang-v2', 'zh'); } catch {} });
const blockedWrites = [], requests = [], errors = [], results = [], layouts = [], accessibility = [];
const mock = production ? null : await installKitMock(context, base);
if (production) await allowReadOnlyKit(context, base, blockedWrites);
context.on('request', r => { const u = new URL(r.url()); requests.push({ origin: u.origin, path: u.pathname, method: r.method() }); });
context.on('page', p => p.on('pageerror', e => errors.push(e.message)));
const page = await context.newPage(); page.setDefaultTimeout(15000);
const primary = () => page.locator('.home-newsletter__subscribe');
const home = async () => { const r = await page.goto(base + '/', { waitUntil: 'domcontentloaded' }); assert.equal(r.status(), 200); await primary().waitFor(); await page.locator('.hero-visual__button img').evaluate(image => image.decode()); };
const noOverflow = async () => assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'No horizontal overflow');
const choose = async lang => {
 await page.getByRole('button', { name: { en: 'EN', zh: '简', zhHant: '繁' }[lang], exact: true }).click();
 await page.waitForFunction(tag => document.documentElement.lang === tag, { en: 'en', zh: 'zh-CN', zhHant: 'zh-Hant' }[lang]);
 // OpenCC is an existing lazy-loaded chunk; wait for the rendered translation,
 // rather than treating the earlier document-language event as completion.
 await primary().filter({hasText:{en:'Get the free AI letter',zh:'免费订阅 AI 实战信',zhHant:'免費訂閱 AI 實戰信'}[lang]}).waitFor();
};
const theme = async target => { await page.setViewportSize({ width: 1440, height: 900 }); if (await page.locator('html').getAttribute('data-theme') !== target) await page.getByRole('button', { name: /Switch to (dark|light) mode/ }).click(); assert.equal(await page.locator('html').getAttribute('data-theme'), target); };
const check = async (name, fn) => { try { await fn(); results.push({ name, status: 'passed' }); } catch (e) { results.push({ name, status: 'failed', error: e.message }); } console.log(results.at(-1)); };
const audit = async name => {
 await page.addScriptTag({ path: process.env.NEWSLETTER_AXE_PATH ?? '/tmp/dalei-newsletter-qa-20261005/isolated-qa/node_modules/axe-core/axe.min.js' });
 const r = await page.evaluate(async () => { const r = await window.axe.run(document.querySelector('#creator-intro'), { runOnly: { type: 'tag', values: ['wcag2a','wcag2aa','wcag21a','wcag21aa'] } }); return { violations: r.violations.map(v => ({ id:v.id, targets:v.nodes.map(n => n.target) })), incomplete:r.incomplete.map(v => ({ id:v.id, targets:v.nodes.map(n => n.target) })) }; });
 accessibility.push({ name, ...r }); assert.equal(r.violations.length, 0, JSON.stringify(r.violations));
};
await check('Original creator hero leads; one email invitation replaces the standalone form screen', async () => {
 await home();
 assert.match(await page.locator('#creator-intro h1').innerText(), /用 AI，做点实事。.*做完了，讲给你听。/s);
 assert.match(await page.locator('#creator-intro').innerText(), /大雷早上好.*@dalei2025.*和你有什么关系.*动手.*值得花时间/s);
 assert.equal(await page.locator('#home').count(),1);
 assert.equal(await page.locator('a[href="/newsletter"]').count(),1);
 assert.equal(await primary().getAttribute('href'),'/newsletter');
 assert.equal(await page.locator('form,input[type="email"],.kit-signup,iframe').count(),0);
 assert(!requests.some(r => [KIT_TEST.embed,KIT_TEST.sdk].some(url => r.origin+r.path===url)), 'Home does not load Kit');
 assert(!/300–500|每日发送名单|每天一封|Kit|筹备|三个一/.test(await page.locator('#creator-intro').innerText()));
 assert.equal(await page.locator('.hero-visual__button img').getAttribute('src'),'/hero-blue-cartoon-20260912.webp');
 for(const id of ['work','videos','about','now','connect'])assert.equal(await page.locator('section#'+id).count(),1);
 await noOverflow();
});
await check('Three languages and light/dark themes keep the primary invitation visible across 320/390/768/1440px', async () => {
 for(const mode of ['light','dark']){
  await theme(mode);
  for(const lang of ['en','zh','zhHant']){
   await choose(lang);
   for(const [width,height] of [[320,740],[390,844],[768,1024],[1440,900]]){
    await page.setViewportSize({width,height}); await page.evaluate(() => scrollTo(0,0)); await noOverflow();
    const box=await primary().boundingBox(),header=await page.locator('header').boundingBox();
    assert(box && box.y>=header.y+header.height && box.y+box.height<=height, JSON.stringify({mode,lang,width,box,header}));
    assert.equal(await page.locator('#creator-intro .home-newsletter form').count(),0);
    const appearance = await primary().evaluate(element => {
     const style = getComputedStyle(element);
     const parse = color => color.match(/[\d.]+/g).map(Number);
     const foreground = parse(style.color), background = parse(style.backgroundColor);
     const luminance = color => color.slice(0,3).map(channel => channel/255).map(channel => channel<=0.04045 ? channel/12.92 : ((channel+0.055)/1.055)**2.4).reduce((sum,channel,index) => sum+channel*[0.2126,0.7152,0.0722][index],0);
     const lights = [luminance(foreground),luminance(background)].sort((a,b)=>a-b);
     return { color:style.color, background:style.backgroundColor, opaque:background.length===3||background[3]===1, contrast:(lights[1]+0.05)/(lights[0]+0.05) };
    });
    assert(appearance.opaque && appearance.contrast>=4.5, 'Primary invitation must render an opaque background and readable text: '+JSON.stringify(appearance));
    if(lang==='en')assert(!/[\p{Script=Han}]/u.test(await page.locator('.home-newsletter').innerText()));
    if(lang==='zhHant')assert.match(await primary().innerText(),/免費訂閱 AI 實戰信/);
    layouts.push({mode,lang,width,height,primary:box,appearance,status:'passed'});
    if([390,1440].includes(width))await page.screenshot({path:output+`/home-${lang}-${width}-${mode}.png`,fullPage:false});
    if(lang==='zh' && [390,1440].includes(width))await audit(`${mode}-${width}`);
   }
  }
 }
});
await check('Keyboard and modified-click invitation use the real Newsletter route; back, forward and refresh work', async () => {
 await home(); await theme('light'); await choose('zh');
 for(let i=0;i<24 && !await primary().evaluate(n=>n===document.activeElement);i++)await page.keyboard.press('Tab');
 assert(await primary().evaluate(n=>n===document.activeElement));
 assert.equal(await primary().evaluate(n=>getComputedStyle(n).outlineStyle),'solid');
 assert.equal(await primary().evaluate(n=>getComputedStyle(n).outlineWidth),'3px');
 const original=page.url();
 const [tab]=await Promise.all([context.waitForEvent('page'),primary().click({modifiers:['Meta']})]);
 await tab.waitForURL(base+'/newsletter'); await tab.locator('.kit-signup[data-kit-load="ready"]').waitFor(); assert.equal(page.url(),original); await tab.close();
 await primary().focus(); await page.keyboard.press('Enter'); await page.locator('.kit-signup[data-kit-load="ready"]').waitFor();
 assert.equal(await page.locator('.kit-signup form').getAttribute('data-uid'),KIT_TEST.uid);
 assert.equal(await page.locator('.kit-signup form').getAttribute('action'),KIT_TEST.subscription);
 assert.match(await page.locator('.kit-signup__help').innerText(),/确认邮件.*每封可退订/);
 await page.reload(); await page.locator('.kit-signup[data-kit-load="ready"]').waitFor();
 await page.goBack(); await primary().waitFor();
 await page.goForward(); await page.locator('.kit-signup[data-kit-load="ready"]').waitFor();
 await home(); await page.reload(); await primary().waitFor();
});
await check('Original practice card remains public, localized and reachable by keyboard', async () => {
 await choose('zhHant');
 const card=page.locator('.home-newsletter__resource a'); await card.focus(); await page.keyboard.press('Enter');
 await page.getByRole('heading',{name:'第一張 AI 實戰卡',exact:true}).waitFor(); assert.equal(await page.locator('html').getAttribute('lang'),'zh-Hant');
 assert.equal(await page.locator('form,input,textarea,iframe').count(),0);
 await page.reload(); await page.getByRole('heading',{name:'第一張 AI 實戰卡',exact:true}).waitFor();
 await page.goBack(); await primary().waitFor(); await choose('zh');
});
await check('Existing project filters, full directory, hero links and desktop home navigation still work', async () => {
 await home(); await page.setViewportSize({width:1440,height:900});
 const initial=await page.locator('#work .project-card h3').allTextContents(); assert(initial.length>=7);
 await page.getByRole('button',{name:/查看全部 \d+ 个项目/}).click();
 const expanded=await page.locator('#work .project-card h3').allTextContents(); assert(expanded.length>initial.length); for(const title of initial)assert(expanded.includes(title));
 await page.getByRole('button',{name:'收起完整目录',exact:true}).click(); assert.equal(await page.locator('#work .project-card h3').count(),initial.length);
 const filters=page.getByRole('group',{name:'筛选项目'});
 await filters.getByRole('button').nth(1).click(); assert.equal(await filters.getByRole('button').nth(1).getAttribute('aria-pressed'),'true'); assert((await page.locator('#work .project-card h3').count())>0);
 await filters.getByRole('button').first().click();
 await page.locator('header').getByRole('button',{name:'首页',exact:true}).click();
 await page.waitForFunction(()=>Math.abs(document.querySelector('#home').getBoundingClientRect().top)<4);
 await page.locator('#creator-intro').getByRole('button',{name:'找个作品试试',exact:true}).click();
 await page.waitForFunction(()=>Math.abs(document.querySelector('#work').getBoundingClientRect().top-96)<4);
 await page.locator('header').getByRole('button',{name:'首页',exact:true}).click();
 await page.locator('#creator-intro').getByRole('button',{name:'看实战视频',exact:true}).click();
 await page.waitForFunction(()=>Math.abs(document.querySelector('#videos').getBoundingClientRect().top-96)<4);
 const links=await page.locator('#videos a[href^="https://www.youtube.com/watch?v="]').evaluateAll(nodes=>nodes.map(n=>n.getAttribute('href')));
 assert(links.length>=2 && links.every(h=>/^https:\/\/www.youtube.com\/watch\?v=[\w-]{11}$/.test(h)));
});
await check('Search palette and mobile menu preserve creator navigation and language choice', async () => {
 await home(); await page.keyboard.press('Meta+k'); await page.getByRole('dialog').waitFor();
 await page.getByPlaceholder('搜索项目、视频、页面…').fill('人生'); await page.getByRole('option').filter({hasText:'人生冒险'}).first().waitFor();
 await page.keyboard.press('Escape'); await page.getByRole('dialog').waitFor({state:'hidden'});
 await page.setViewportSize({width:390,height:844});
 const menu=page.getByRole('button',{name:'Menu',exact:true}); await menu.click(); assert.equal(await menu.getAttribute('aria-expanded'),'true');
 await page.locator('#mobile-nav').getByRole('button',{name:'首页',exact:true}).click(); assert.equal(await menu.getAttribute('aria-expanded'),'false');
 await choose('en'); await page.reload(); await primary().waitFor(); assert.equal(await page.locator('html').getAttribute('lang'),'en'); assert.match(await primary().innerText(),/Get the free AI letter/);
});
await check('Original Life Quest, Skills and map-route direct URLs still render', async () => {
 await page.setViewportSize({width:1440,height:900});
 for(const path of ['/life-quest','/skills','/map-route-broll']){
  const r=await page.goto(base+path,{waitUntil:'domcontentloaded'}); assert.equal(r.status(),200); await page.locator('main h1').waitFor(); assert((await page.locator('main h1').first().innerText()).length>3); assert.equal(await page.locator('.home-newsletter').count(),0);
 }
});
if(!production)await check('An unavailable Kit form cannot disable the homepage invitation; fallback stays on the Newsletter page', async () => {
 mock.state.script='embed-error'; await home(); assert(await primary().isVisible()); await primary().click();
 await page.locator('.kit-signup[data-kit-load="unavailable"]').waitFor(); assert.equal(await page.locator('.kit-signup__fallback a').first().getAttribute('href'),KIT_TEST.share);
 assert.equal(await page.locator('.kit-signup input').count(),0); mock.state.script='ready';
});
await check('No real subscription or browser runtime errors occurred', async () => {
 assert.deepEqual(errors,[]);
 assert(!requests.some(r=>r.origin+r.path===KIT_TEST.subscription));
 if(mock){assert.equal(mock.report().subscriptionMocks,0);assert.equal(mock.report().liveWrites,0);}
 assert(blockedWrites.every(r=>r.origin+r.path===KIT_TEST.visit),'Only anonymous Kit visits were attempted and blocked');
});
await writeFile(output+'/home-results.json',JSON.stringify({testedAt:new Date().toISOString(),base,production,results,layouts,accessibility,errors,requests,blockedWrites,kit:mock?.report()??null,limits:['No actual email addresses, submissions, confirmation, unsubscribe or sends. All service writes intercepted.','Axe incomplete results remain recorded; zero violations is not a blanket WCAG certification.']},null,2));
await context.close(); await browser.close();
if(results.some(r=>r.status==='failed'))process.exitCode=1;
