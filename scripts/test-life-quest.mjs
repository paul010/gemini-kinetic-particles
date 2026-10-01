import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';

const root = new URL('../', import.meta.url);
const read = path => readFile(new URL(path, root), 'utf8');
const source = await read('data/site.ts');
const js = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText;
const { PROJECTS, HOME_PROJECT_ORDER, HOME_SPOTLIGHT_ID } = await import(
  `data:text/javascript;base64,${Buffer.from(js).toString('base64')}`
);
const ids = PROJECTS.map(p => p.id);
assert.equal(new Set(ids).size, ids.length, 'project IDs must remain unique');
const project = PROJECTS.find(p => p.id === 'life-quest');
assert.equal(HOME_PROJECT_ORDER[0], 'life-quest');
assert.equal(HOME_SPOTLIGHT_ID, 'kindle-dashboard', 'preserve the existing spotlight');
assert.equal(project.featured, true);
assert.match(project.description.en, /private/);
assert.deepEqual(project.links.map(({ href, kind }) => ({ href, kind })), [
  { href: '/life-quest', kind: 'internal' },
]);
assert(PROJECTS.find(p => p.id === 'ai-passport-2026'), 'preserve the AB-731 project');
const router = await read('index.tsx');
assert.match(router, /React\.lazy\(\(\) => import\('\.\/lifequest\/LifeQuest'\)\)/);
assert.match(router, /p\.endsWith\('\/life-quest'\) \|\| hash === '#\/life-quest'/);
assert.match(router, /route === 'life-quest'/);
assert.match(await read('public/sitemap.xml'), /https:\/\/dailycosmos\.net\/life-quest/);
const component = await read('lifequest/LifeQuest.tsx');
assert.match(component, /https:\/\/ai-passport\.folotoy\.cn\/en\/plays\/802\//);
assert.match(component, /AI gameplay illustration, not a device screenshot/);
assert.match(component, /year-2000 example birthday/);
assert.match(component, /onError=\{\(\) => setStatus\('error'\)\}/);
assert.match(component, /aria-pressed/);
assert(!/fapc_|fapt_|github_pat_|1982/.test(component), 'No credential or private birthday in the component');
assert.match(component, /No AI service or automatic personal-data upload is connected\./);

for (const name of ['real-home', 'real-quests', 'real-life-tokens', 'real-tipo', 'cover-illustration']) {
  const bytes = await readFile(new URL(`public/life-quest/${name}.webp`, root));
  assert.equal(bytes.toString('ascii', 0, 4), 'RIFF');
  assert.equal(bytes.toString('ascii', 8, 12), 'WEBP');
  let dimensions;
  for (let offset = 12; offset + 8 <= bytes.length;) {
    const type = bytes.toString('ascii', offset, offset + 4);
    const size = bytes.readUInt32LE(offset + 4);
    const payload = bytes.subarray(offset + 8, offset + 8 + size);
    assert(!['EXIF', 'XMP ', 'ICCP'].includes(type), `${name} must have no private metadata`);
    if (type === 'VP8 ') dimensions = [payload.readUInt16LE(6) & 0x3fff, payload.readUInt16LE(8) & 0x3fff];
    if (type === 'VP8L') {
      const value = payload.readUInt32LE(1);
      dimensions = [(value & 0x3fff) + 1, ((value >>> 14) & 0x3fff) + 1];
    }
    if (type === 'VP8X') dimensions = [payload.readUIntLE(4, 3) + 1, payload.readUIntLE(7, 3) + 1];
    offset += 8 + size + (size % 2);
  }
  assert.deepEqual(dimensions, [900, 1200], `${name} keeps the full 3:4 image`);
  assert(bytes.length < 400_000, `${name} should remain web-sized`);
}
console.log('Life Quest: routing, project isolation, copy boundaries and five metadata-free 3:4 assets passed.');
