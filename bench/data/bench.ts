// 大雷 AI 评测台 — data model.
// Add a result: append to a test's `results` with one of the kinds below.
//   kind 'svg'  → paste the raw <svg>…</svg> the model produced (renders inline)
//   kind 'html' → paste a full HTML doc (renders in a sandboxed iframe)
//   kind 'image'→ a screenshot path (put files in public/bench/…) or URL
//   kind 'link' → an external URL (opens out)
//   kind 'pending' → a reserved slot you'll fill later

import type { LocalizedText } from '../../data/site';
export type { LocalizedText };

export interface Model {
  id: string;
  name: string;
  vendor: string;
  color: string; // brand-ish accent
  mark: string; // 1-char lettermark
}

export type ResultKind = 'svg' | 'html' | 'image' | 'link' | 'pending';

export interface Result {
  modelId: string;
  date?: string;
  kind: ResultKind;
  svg?: string;
  html?: string;
  image?: string;
  url?: string;
  note?: LocalizedText;
  verdict?: 'win' | 'ok' | 'fail';
}

export interface BenchTest {
  id: string;
  title: LocalizedText;
  category: 'svg' | 'webpage' | 'landing' | 'logic' | 'design';
  prompt: string; // the fixed test prompt — kept verbatim across languages
  whatItTests: LocalizedText;
  results: Result[];
}

export const MODELS: Model[] = [
  { id: 'claude', name: 'Claude', vendor: 'Anthropic', color: '#d97757', mark: 'C' },
  { id: 'gpt', name: 'ChatGPT', vendor: 'OpenAI', color: '#10a37f', mark: 'O' },
  { id: 'gemini', name: 'Gemini', vendor: 'Google', color: '#4285f4', mark: 'G' },
  { id: 'grok', name: 'Grok', vendor: 'xAI', color: '#1c1a17', mark: 'X' },
  { id: 'deepseek', name: 'DeepSeek', vendor: 'DeepSeek', color: '#4d6bfe', mark: 'D' },
  { id: 'qwen', name: 'Qwen', vendor: 'Alibaba', color: '#615ced', mark: 'Q' },
];

// A hand-authored reference answer (大雷基准) so the SVG rendering is visible
// out of the box. Real model captures go in alongside it.
const REF_BUTTERFLY = `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="w" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#caa45a"/><stop offset="1" stop-color="#d97757"/>
    </linearGradient>
  </defs>
  <g fill="url(#w)" stroke="#1c1a17" stroke-width="2">
    <path d="M100 100 C60 40, 20 50, 30 95 C20 140, 70 150, 100 100 Z"/>
    <path d="M100 100 C140 40, 180 50, 170 95 C180 140, 130 150, 100 100 Z"/>
    <path d="M100 100 C72 120, 45 130, 48 160 C70 170, 95 140, 100 110 Z"/>
    <path d="M100 100 C128 120, 155 130, 152 160 C130 170, 105 140, 100 110 Z"/>
  </g>
  <rect x="98" y="55" width="4" height="90" rx="2" fill="#1c1a17"/>
  <circle cx="100" cy="52" r="6" fill="#1c1a17"/>
  <path d="M100 50 C92 38, 86 34, 84 28" stroke="#1c1a17" stroke-width="2" fill="none"/>
  <path d="M100 50 C108 38, 114 34, 116 28" stroke="#1c1a17" stroke-width="2" fill="none"/>
</svg>`;

export const TESTS: BenchTest[] = [
  {
    id: 'pelican-bike',
    title: { en: 'Pelican riding a bicycle (SVG)', zh: '鹈鹕骑自行车 SVG' },
    category: 'svg',
    prompt: 'Generate an SVG of a pelican riding a bicycle.',
    whatItTests: {
      en: 'Spatial composition, proportion, and one-shot complex structure — the industry’s classic hard SVG test.',
      zh: '空间组合、比例、复杂结构的「一次成型」能力 —— 业界经典硬核题。',
    },
    results: [
      { modelId: 'claude', kind: 'pending' },
      { modelId: 'gpt', kind: 'pending' },
      { modelId: 'gemini', kind: 'pending' },
      { modelId: 'grok', kind: 'pending' },
    ],
  },
  {
    id: 'butterfly',
    title: { en: 'Symmetric gradient butterfly (SVG)', zh: '对称渐变蝴蝶 SVG' },
    category: 'svg',
    prompt: '用 SVG 画一只左右对称的蝴蝶，翅膀要有渐变色彩、带触角与身体。只输出 SVG。',
    whatItTests: { en: 'Symmetry, gradients, path control, and taste.', zh: '对称性、渐变、路径控制与审美。' },
    results: [
      { modelId: 'dalei-ref', kind: 'svg', svg: REF_BUTTERFLY, note: { en: 'Da Lei reference (hand-drawn sample)', zh: '大雷参考基准（手绘示例）' }, verdict: 'ok' },
      { modelId: 'claude', kind: 'pending' },
      { modelId: 'gpt', kind: 'pending' },
      { modelId: 'gemini', kind: 'pending' },
    ],
  },
  {
    id: 'saas-landing',
    title: { en: 'AI notes app landing page', zh: 'AI 笔记 App 落地页' },
    category: 'landing',
    prompt:
      '做一个 AI 笔记应用的落地页：单文件 HTML + Tailwind(CDN)，含 hero 标题、3 个特性、定价、CTA，配色现代克制，自适应。只输出 HTML。',
    whatItTests: {
      en: 'Layout taste, information hierarchy, and a complete runnable single-file output.',
      zh: '排版审美、信息层级、可运行的完整单文件输出。',
    },
    results: [
      { modelId: 'claude', kind: 'pending' },
      { modelId: 'gpt', kind: 'pending' },
      { modelId: 'gemini', kind: 'pending' },
      { modelId: 'deepseek', kind: 'pending' },
    ],
  },
  {
    id: 'solar-system',
    title: { en: 'Solar-system animation (SVG)', zh: '太阳系动画 SVG' },
    category: 'svg',
    prompt: '用纯 SVG + CSS 动画做一个太阳系：太阳居中，几颗行星沿轨道公转。只输出单文件。',
    whatItTests: { en: 'Animation, orbital geometry, pure front-end implementation.', zh: '动画、轨道几何、纯前端实现。' },
    results: [
      { modelId: 'claude', kind: 'pending' },
      { modelId: 'gemini', kind: 'pending' },
      { modelId: 'qwen', kind: 'pending' },
    ],
  },
];

// 大雷参考基准 shown as a pseudo-model so its reference answers render.
export const REF_MODEL: Model = { id: 'dalei-ref', name: '大雷基准', vendor: '大雷', color: '#8a682c', mark: '大' };
