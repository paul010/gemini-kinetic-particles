import raw from './prompts.json';

/* ---------------------------------------------------------------------------
 * The 3D prompt workbench data layer. Prompts are vendored verbatim from
 * petergpt/3d-prompt-collection (prompts.json in that repo) — all credit to
 * the author; every card on /lab3d links back. Section ranges mirror the
 * upstream README. EXECUTED registers the prompts we've actually run into
 * live pages on this site, so the workbench doubles as a results index.
 * ------------------------------------------------------------------------- */

export interface LocalizedText { en: string; zh: string }

interface RawPrompt { title: string; prompt: string }
const prompts = (raw as { title: string; prompts: RawPrompt[] }).prompts;

export interface SectionDef { key: string; from: number; to: number; label: LocalizedText }
export const SECTIONS: SectionDef[] = [
  { key: 'worlds', from: 1, to: 30, label: { en: 'Big 3D Worlds', zh: '宏大 3D 世界' } },
  { key: 'playable', from: 31, to: 42, label: { en: 'Playable Scenes', zh: '可玩场景' } },
  { key: 'art', from: 43, to: 49, label: { en: 'Living Art Worlds', zh: '活的艺术世界' } },
  { key: 'vantage', from: 50, to: 52, label: { en: 'Impossible Vantages', zh: '不可能的视角' } },
  { key: 'nature', from: 53, to: 59, label: { en: 'Natural Spectacles', zh: '自然奇观' } },
  { key: 'cosmic', from: 60, to: 63, label: { en: 'Elemental & Cosmic', zh: '元素与宇宙' } },
];

export interface LabPrompt {
  n: number;           // 1-based, matches upstream numbering
  title: string;
  text: string;
  section: SectionDef;
  /** set when this prompt has been executed into a live page */
  route?: string;
  resultLabel?: LocalizedText;
}

/** Prompts we've run — the whole point of the workbench. Add entries as more
 * prompts get executed; each links a prompt number to its live page. */
const EXECUTED: { n: number; route: string; resultLabel: LocalizedText }[] = [
  { n: 26, route: '/cappadocia', resultLabel: { en: 'Balloons at dawn — live', zh: '黎明热气球 · 已上线' } },
];

export const LAB_PROMPTS: LabPrompt[] = prompts.map((p, i) => {
  const n = i + 1;
  const section = SECTIONS.find((s) => n >= s.from && n <= s.to) ?? SECTIONS[0];
  const done = EXECUTED.find((e) => e.n === n);
  return { n, title: p.title, text: p.prompt, section, route: done?.route, resultLabel: done?.resultLabel };
});

export const EXECUTED_COUNT = EXECUTED.length;
export const SOURCE_REPO = 'https://github.com/petergpt/3d-prompt-collection';
