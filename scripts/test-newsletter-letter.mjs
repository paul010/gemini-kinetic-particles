import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ts from 'typescript';

const root = new URL('../', import.meta.url);
const output = new URL('output/newsletter-letter-tests/', root);
await mkdir(output, { recursive: true });
// Compile the actual locale dependency graph; do not mock the new translation hook.
const sources = ['content.ts', 'practice-card-content.ts', 'site-language.ts', 'translations.ts', 'locale.ts', 'LetterPreview.tsx'];
for (const name of sources) {
  const source = await readFile(new URL('newsletter/' + name, root), 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  });
  const withExtensions = outputText.replace(/(['"])(\.\/[^'"]+)\1/g, (match, quote, path) => `${quote}${path}.mjs${quote}`);
  await writeFile(new URL(name.replace(/\.(tsx|ts)$/, '.mjs'), output), withExtensions);
}
const { sampleLetter } = await import(new URL('content.mjs', output));
const { newsletterEnglish } = await import(new URL('translations.mjs', output));
const { default: LetterPreview } = await import(new URL('LetterPreview.mjs', output));
assert.deepEqual(sampleLetter.sections.map(section => section.label), ['一个结论', '一个原理', '一个判断', '一个动手练习']);
const count = [...sampleLetter.sections.map(section => section.text).join('').matchAll(/\p{Script=Han}/gu)].length;
assert(count >= 300 && count <= 500, `Chinese original remains 300–500 characters: ${count}`);
for (const video of [sampleLetter.video, undefined]) {
  const letter = { ...sampleLetter, video };
  // Without a browser's explicit preference, rendering must follow the site's English default.
  const html = renderToStaticMarkup(React.createElement(LetterPreview, { letter }));
  for (const section of sampleLetter.sections) {
    const label = newsletterEnglish[section.label];
    assert.equal(html.split(label).length - 1, 1, `Exactly one ${label}`);
    assert(html.includes(newsletterEnglish[section.text]), 'Each section includes its reading translation');
  }
  assert(html.includes(sampleLetter.source.url), 'Evidence link remains available without video');
  assert(html.includes(newsletterEnglish[sampleLetter.title]), 'Useful letter still renders without video');
  assert.equal(html.includes('Related public video'), Boolean(video), 'Video block is optional');
  assert.equal(html.includes(sampleLetter.video.url), Boolean(video), 'Only actual video links appear');
  assert(html.includes('Sample draft'), 'Draft state is translated');
  assert(html.includes('Not sent'), 'No translation claims actual delivery');
  assert(!html.includes('待配视频'), 'No placeholder video distracts from the letter');
}
console.log(`Newsletter letter: English default renders sourced content with or without a related video; Chinese original remains ${count} characters.`);
