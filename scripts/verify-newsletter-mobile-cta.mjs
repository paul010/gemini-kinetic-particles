import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { installKitMock } from './newsletter-qa-kit.mjs';

const base=process.env.NEWSLETTER_BASE_URL ?? 'http://127.0.0.1:4184';
assert(['localhost','127.0.0.1'].includes(new URL(base).hostname),'Targeted mobile QA is local only');
const output=resolve(process.env.NEWSLETTER_MOBILE_OUTPUT ?? '/tmp/dailycosmos-kit-integration-qa/final-mobile');
await mkdir(output,{recursive:true});
const {chromium}=await import(pathToFileURL(resolve(process.env.NEWSLETTER_PLAYWRIGHT_MODULE ?? '/tmp/dalei-newsletter-qa-20261005/isolated-qa/node_modules/playwright/index.mjs')).href);
const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
const results=[],accessibility=[],errors=[];
for(const [lang,tag,label] of [['en','en','Email address'],['zh','zh-CN','邮箱'],['zhHant','zh-Hant','郵箱']]){
 const context=await browser.newContext({viewport:{width:320,height:740},reducedMotion:'reduce'});
 await context.addInitScript(lang=>localStorage.setItem('dalei-lang-v2',lang),lang);
 const mock=await installKitMock(context,base);const page=await context.newPage();page.setDefaultTimeout(10000);
 page.on('pageerror',error=>errors.push(error.message));
 const record={lang,tag,status:'failed'};
 try{
  const response=await page.goto(base+'/newsletter');assert.equal(response.status(),200);
  await page.locator('.kit-signup[data-kit-load="ready"]').waitFor();
  await page.getByRole('textbox',{name:label,exact:true}).waitFor();
  await page.evaluate(async()=>{await document.fonts.ready;const image=document.querySelector('.nl-author img');if(image instanceof HTMLImageElement)await image.decode();});
  assert.equal(await page.locator('html').getAttribute('lang'),tag);
  const field=await page.locator('input[name="email_address"]').boundingBox(),button=await page.locator('[data-element="submit"]').boundingBox();
  Object.assign(record,{field,button,buttonBottom:button.y+button.height,viewport:{width:320,height:740},signupMargin:await page.locator('.nl-signup').evaluate(node=>getComputedStyle(node).marginTop)});
  await page.screenshot({path:output+'/newsletter-'+lang+'-320.png',fullPage:false});
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'No horizontal overflow');
  await page.addScriptTag({path:process.env.NEWSLETTER_AXE_PATH ?? '/tmp/dalei-newsletter-qa-20261005/isolated-qa/node_modules/axe-core/axe.min.js'});
  const axe=await page.evaluate(async()=>{const r=await window.axe.run(document.querySelector('.newsletter'),{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa']}});return{violations:r.violations,incomplete:r.incomplete.map(({id})=>id),passes:r.passes.length};});
  accessibility.push({lang,...axe});assert.equal(axe.violations.length,0,JSON.stringify(axe.violations.map(v=>v.id)));
  assert(field.y>=64 && field.y+field.height<=740,'Email field stays within the first viewport: '+JSON.stringify(field));
  assert(button.y>=64 && button.y+button.height<=740,'Primary submit stays within the first viewport: '+JSON.stringify(button));
  assert.equal(mock.report().subscriptionMocks,0);assert.equal(mock.report().liveWrites,0);record.status='passed';
 }catch(error){record.error=error.message;}
 results.push(record);console.log(record);await context.close();
}
await browser.close();await writeFile(output+'/mobile-cta-results.json',JSON.stringify({base,results,errors,liveWrites:0},null,2));await writeFile(output+'/mobile-cta-accessibility.json',JSON.stringify(accessibility,null,2));
if(results.some(row=>row.status!=='passed')||errors.length)process.exitCode=1;
