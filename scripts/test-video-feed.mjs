import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';

const source = await readFile(new URL('../data/latest-videos.ts', import.meta.url), 'utf8');
const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
const { parseLatestVideos, videoTitle, fetchLatestVideos } = await import(`data:text/javascript;base64,${Buffer.from(js).toString('base64')}`);
const snapshot = JSON.parse(await readFile(new URL('../data/video-snapshot.json', import.meta.url), 'utf8'));
const parsed = parseLatestVideos(snapshot);
assert.equal(parsed.length, 6);
assert.equal(parsed[0].id, 'vQuzOnBGhbw');
assert.deepEqual(parseLatestVideos({ ...snapshot, videos: [...snapshot.videos].reverse() }), parsed);
assert.deepEqual(videoTitle('GPT-6 Astra在Terminal-Bench达57.9%  GPT-6 Astra Scores 57.9% on Terminal-Bench'), { zh: 'GPT-6 Astra在Terminal-Bench达57.9%', en: 'GPT-6 Astra Scores 57.9% on Terminal-Bench' });
assert.deepEqual(videoTitle('中文节目'), { zh: '中文节目', en: '中文节目' });
for (const bad of [null, {}, { ...snapshot, channelId: 'other' }, { ...snapshot, videos: [] },
  { ...snapshot, videos: [...snapshot.videos, snapshot.videos[0]] },
  ...['id', 'date', 'publishedAt', 'duration', 'title'].map(key => ({ ...snapshot, videos: [{ ...snapshot.videos[0], [key]: '' }, ...snapshot.videos.slice(1)] }))]) {
  assert.throws(() => parseLatestVideos(bad));
}
const originalFetch = globalThis.fetch;
try {
  globalThis.fetch = async () => new Response(JSON.stringify(snapshot), { status: 200 });
  assert.deepEqual(await fetchLatestVideos(), parsed);
  globalThis.fetch = async () => new Response('', { status: 503 });
  await assert.rejects(fetchLatestVideos(), /503/);
  globalThis.fetch = async () => new Response('{broken');
  await assert.rejects(fetchLatestVideos());
} finally { globalThis.fetch = originalFetch; }
console.log('Video feed: parsing, sorting, localization, validation and fetch failure tests passed.');
