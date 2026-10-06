import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ts from 'typescript';

const root = new URL('../', import.meta.url);
const output = new URL('output/newsletter-letter-tests/', root);
await mkdir(output, { recursive: true });
const compile = async (sourceName, fileName) => {
  const source = await readFile(new URL(sourceName, root), 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  });
  const target = new URL(fileName, output);
  await writeFile(target, outputText);
  return import(target.href);
};
const { sampleLetter } = await compile('newsletter/content.ts', 'content.mjs');
const { default: LetterPreview } = await compile('newsletter/LetterPreview.tsx', 'preview.mjs');
for (const video of [sampleLetter.video, undefined]) {
  const letter = { ...sampleLetter, video };
  const html = renderToStaticMarkup(React.createElement(LetterPreview, { letter }));
  for (const section of ['一个结论', '一个原理', '一个判断', '一个动手练习']) {
    assert.equal(html.split(section).length - 1, 1, `Exactly one ${section}`);
  }
  assert(html.includes(sampleLetter.source.url), 'Evidence link remains available without video');
  assert(html.includes(sampleLetter.title), 'Useful letter still renders without video');
  assert.equal(html.includes('相关公开视频'), Boolean(video), 'Video block is optional');
  assert.equal(html.includes(sampleLetter.video.url), Boolean(video), 'Only actual video links appear');
  assert(!html.includes('待配视频'), 'No video placeholder blocks or distracts from the letter');
}
console.log('Newsletter letter: sourced content renders with or without a related video; optional video omitted cleanly.');
