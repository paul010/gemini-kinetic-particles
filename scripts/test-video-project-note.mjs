import assert from 'node:assert/strict';
import {mkdir,readFile} from 'node:fs/promises';
import {build} from 'esbuild';
import * as OpenCC from 'opencc-js';
const out=new URL('../output/video-project-note/',import.meta.url);
await mkdir(out,{recursive:true});
await build({stdin:{contents:`import React from 'react';import {renderToStaticMarkup} from 'react-dom/server';import Note from './components/VideoProjectNote';export {TV_EPISODE_ID,TV_REPOSITORY,tvProjectCopy} from './components/VideoProjectNote';export const render=(videos,t)=>renderToStaticMarkup(React.createElement(Note,{videos,t}));`,resolveDir:process.cwd(),loader:'tsx'},bundle:true,platform:'node',format:'esm',outfile:new URL('subject.mjs',out).pathname,external:['react','react-dom/server'],plugins:[{name:'omit-css',setup(api){api.onLoad({filter:/\\.css$/},()=>({contents:'',loader:'js'}));}}],logLevel:'silent'});
const {render,TV_EPISODE_ID,TV_REPOSITORY,tvProjectCopy}=await import(new URL('subject.mjs',out));
assert.equal(TV_REPOSITORY,'https://github.com/paul010/dalei-tvhome');
assert.equal(TV_EPISODE_ID,'1K3fVbbBeQg');
assert.equal(render([],x=>x.en),'');
assert.equal(render([{id:'jb9WKcArVKM'}],x=>x.en),'');
const convert=OpenCC.Converter({from:'cn',to:'tw'});
for(const lang of ['en','zh','zhHant']){
 const t=x=>lang==='en'?x.en:lang==='zhHant'?convert(x.zh):x.zh;
 for(const videos of [[{id:TV_EPISODE_ID}],[{id:'jb9WKcArVKM'},{id:TV_EPISODE_ID}],[{id:TV_EPISODE_ID},{id:TV_EPISODE_ID}]]){
  const html=render(videos,t);
  assert.equal((html.match(/<aside /g)||[]).length,1);
  assert.equal((html.match(/<a /g)||[]).length,3);
  assert(html.includes('aria-labelledby="video-project-dalei-tvhome-title"'));
  assert(html.includes(TV_REPOSITORY+'/blob/main/README.zh-CN.md'));
  assert(html.includes('https://www.youtube.com/watch?v='+TV_EPISODE_ID));
  let depth=0;
  for(const anchor of html.match(/<\/?a\b[^>]*>/g)||[]){if(anchor.startsWith('</')){assert.equal(depth,1);depth--;}else{assert.equal(depth,0,'No nested anchors');depth++;}}
  assert.equal(depth,0);
  assert(!html.includes('<iframe')&&!/href="[^"]+\.apk"/.test(html));
  assert(html.includes(lang==='en'?'No firmware upgrade':lang==='zh'?'不刷机':'不刷機'));
 }
}
assert(tvProjectCopy.scope.en.includes('not a ready-made APK'));
assert(tvProjectCopy.scope.zh.includes('个人定制版'));
const css=await readFile(new URL('../components/video-project-note.css',import.meta.url),'utf8');
assert(css.includes('min-height:44px')&&css.includes(':focus-visible'));
console.log('Video project note: exact episode mapping, real source/readme links, three-language scope, no nested anchors/APK claims and empty/unrelated feeds passed.');
