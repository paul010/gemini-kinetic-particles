import assert from 'node:assert/strict';
import {mkdir,readFile} from 'node:fs/promises';
import {build} from 'esbuild';
import * as OpenCC from 'opencc-js';
const out=new URL('../output/video-archive/',import.meta.url);
await mkdir(out,{recursive:true});
await build({stdin:{contents:"import React from 'react';import {renderToStaticMarkup} from 'react-dom/server';import Resources from './components/VideoResources';import Archive from './components/VideoArchive';export {earlierEpisodes} from './components/VideoArchive';export * from './data/video-resources';export const render=(id,t)=>renderToStaticMarkup(React.createElement(Resources,{video:{id},t}));export const archive=(videos,t)=>renderToStaticMarkup(React.createElement(Archive,{videos,t}));",resolveDir:process.cwd(),loader:'tsx'},bundle:true,platform:'node',format:'esm',outfile:new URL('subject.mjs',out).pathname,external:['react','react-dom/server'],plugins:[{name:'omit-css',setup(api){api.onLoad({filter:/\.css$/},()=>({contents:'',loader:'js'}));}}],logLevel:'silent'});
const {render,archive,earlierEpisodes,allEpisodeResources:episodeResources,episodeNotes,EPISODE_INDEX}=await import(new URL('subject.mjs',out));
const rows=JSON.parse(await readFile(new URL('../data/video-archive.json',import.meta.url),'utf8'));
assert.equal(rows.length,79);
assert.equal(new Set(rows.map(x=>x.id)).size,79);
assert.equal(episodeResources.length,78);
assert.equal(new Set(episodeResources.map(x=>x.id)).size,78);
assert(!rows.some(x=>x.id==='oPEbK2ieTF8'||x.id==='om2B9D7MW-M'),'Unavailable and member videos never enter the curated archive');
assert.deepEqual(rows.map(x=>x.publishedAt),rows.map(x=>x.publishedAt).sort().reverse());
for(const row of rows){assert(/^[\w-]{11}$/.test(row.id));assert.equal(episodeNotes(row.id),row.notes);assert(row.notes.startsWith(EPISODE_INDEX+'/blob/master/episodes/'));assert(row.notes.endsWith('/'+row.id+'.md'));assert.equal(row.verifiedOn,['BXOIJDP6lBw','0bjp1kTeGpg','J83yWCsozIo','7NWgQ8vDHlM','ZhpEzNN-8OQ','lW0L4Mgs6UM','529J4Chjg6o','0ZJF_vmySVs'].includes(row.id)?'2026-10-28':'2026-10-25');assert(Number.isFinite(Date.parse(row.publishedAt)));}
const current=rows.slice(0,6).map(({id})=>({id}));
const all=earlierEpisodes(current,'all'),projects=earlierEpisodes(current,'projects'),notes=earlierEpisodes(current,'notes');
assert.equal(all.length,73);assert.equal(projects.length,38);assert.equal(notes.length,35);
assert.equal(projects.length+notes.length,all.length);
for(const row of all)assert(!current.some(x=>x.id===row.id));
assert.equal(earlierEpisodes(rows,'all').length,0);
const cn2tw=OpenCC.Converter({from:'cn',to:'tw'});
for(const lang of ['zh','zhHant','en']){
 const t=x=>lang==='en'?x.en:lang==='zhHant'?cn2tw(x.zh):x.zh;
 for(const item of episodeResources){
  const html=render(item.id,t);
  if(item.project)assert(html.includes(item.project.url));
  else assert(html.includes(lang==='en'?'has not been verified':lang==='zh'?'尚未核验':'尚未覈驗')||html.includes('尚未核驗'));
  let depth=0;for(const tag of html.match(/<\/?a\b[^>]*>/g)||[]){if(tag.startsWith('</')){assert.equal(depth,1);depth--;}else{assert.equal(depth,0);depth++;}}assert.equal(depth,0);
 }
 const html=archive(current,t);assert(html.includes('id="video-archive"'));assert(html.includes('2026-10-28'));assert(!html.includes('video-archive-item'),'Do not render the entire archive until opened');
 assert.equal(episodeNotes('unknownvideo'),EPISODE_INDEX);
}
assert(render('DoIe_HhIs1c',x=>x.en).includes('tree/main-1.x'));
assert(render('V3gFalsA-Bc',x=>x.en).includes('CodebuffAI/freebuff'));
assert(render('zclnRmatV78',x=>x.en).includes('historical device photos'));
for(const id of ['0di83rTyEow','aHIMOJ8ZCMA','T-KbmUbzCOM','JPLZ_PTLLxY','6_5213cvu3s']){const html=render(id,x=>x.en);assert(html.includes('/materials/lesson-'));assert(html.includes('not an importable'));}
assert(render('RwgPxMWz0WQ',x=>x.en).includes('not source for the recorded hosted Agent Builder'));
assert(render('RByntb59B8Y',x=>x.en).includes('has not been verified'));
assert(render('QpmeaE0PA6w',x=>x.en).includes('NVIDIA-NeMo/Speech'));
assert(render('bkTgfDqVGYE',x=>x.en).includes('ruvnet/ruflo'));
assert(render('Nij92dSF0F4',x=>x.en).includes('google-gemma/cookbook'));
assert(render('VCFSe0UCi5M',x=>x.en).includes('not rerun here'));
assert(render('ysLr-Zmrf2s',x=>x.en).includes('ShawnPana/phone-harness'));
for(const id of ['4lDbhyM_9kY','i6T1CaeEaOE','M2LahYRwORo','2oqWZ539EqU','wVm5S0e7ZhI'])assert(render(id,x=>x.en).includes('has not been verified'));
assert(render('4lDbhyM_9kY',x=>x.en).includes('not a demo of the Microsoft Skill Recorder'));
assert(render('2oqWZ539EqU',x=>x.en).includes('sole critical safeguard'));
assert(render('BXOIJDP6lBw',x=>x.en).includes('QwenLM/BabelArena'));
assert(render('BXOIJDP6lBw',x=>x.en).includes('not the whole episode'));
assert(render('0bjp1kTeGpg',x=>x.en).includes('Gucci233/FlexPart'));
assert(render('J83yWCsozIo',x=>x.en).includes('has not been verified'));
assert(!render('J83yWCsozIo',x=>x.en).includes('public project source'));
assert(render('7NWgQ8vDHlM',x=>x.en).includes('sharepoint-hackathon/issues/175'));
assert(render('7NWgQ8vDHlM',x=>x.en).includes('has not been verified'));
assert(render('lW0L4Mgs6UM',x=>x.en).includes('microsoft/copilot-studio-mcp'));
assert(render('lW0L4Mgs6UM',x=>x.en).includes('documents only'));
assert(!render('lW0L4Mgs6UM',x=>x.en).includes('public project source'));
assert(render('0ZJF_vmySVs',x=>x.en).includes('pollen-robotics/microduck'));
assert(render('0ZJF_vmySVs',x=>x.en).includes('not the whole episode'));
for(const id of ['ZhpEzNN-8OQ','529J4Chjg6o']){assert(render(id,x=>x.en).includes('has not been verified'));assert(!render(id,x=>x.en).includes('public project source'));}
const css=await readFile(new URL('../components/video-resources.css',import.meta.url),'utf8');
assert(css.includes('min-height:44px')&&css.includes(':focus-visible')&&css.includes('grid-template-columns:1fr'));
console.log('Archive: 79 verified episodes; 73 earlier entries (38 project/reference/material links, 35 source-unverified); migration/source boundaries, exclusion, dates, fallback and 3 languages passed.');
