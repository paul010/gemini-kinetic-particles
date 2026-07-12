import React, { useEffect, useMemo, useState } from 'react';

/* ---------------------------------------------------------------------------
 * /notebooklm — a bilingual showcase for the "YAML style-spec → hand-drawn
 * slide deck in NotebookLM" technique.
 *
 * Credit: the technique of feeding NotebookLM a YAML style specification to get
 * consistent line-art / doodle slide decks was shared by しらき@パワポ図解
 * (@kumiko_shiraki). The YAML below is an ORIGINAL template written for this
 * page (not a copy of anyone's prompt) — swap in your own spec freely.
 * ------------------------------------------------------------------------- */

type Lang = 'en' | 'zh' | 'zhHant';
interface T { en: string; zh: string }

const STORAGE_KEY = 'dalei-lang-v2';
const SOURCE_URL = 'https://x.com/kumiko_shiraki/status/2076230080750137560';

const detectInitialLang = (): Lang => {
  if (typeof window === 'undefined') return 'en';
  const saved = window.localStorage.getItem(STORAGE_KEY);
  return saved === 'zh' || saved === 'zhHant' ? saved : 'en';
};

let _s2t: ((s: string) => string) | null = null;
const useS2T = (active: boolean) => {
  const [conv, setConv] = useState<((s: string) => string) | null>(() => _s2t);
  useEffect(() => {
    if (!active || _s2t) {
      if (_s2t && !conv) setConv(() => _s2t);
      return;
    }
    let alive = true;
    import('opencc-js')
      .then((m) => {
        _s2t = (m as any).Converter({ from: 'cn', to: 'tw' });
        if (alive) setConv(() => _s2t);
      })
      .catch(() => {});
    return () => { alive = false; };
  }, [active, conv]);
  return conv;
};

/* ============================ style presets ============================== */

interface Preset {
  id: string;
  name: T;
  vibe: T;
  ink: string;
  accent: string;
  paper: string;
  aesthetic: string;
  line: string;
  fill: string;
  texture: string;
}

const PRESETS: Preset[] = [
  {
    id: 'line',
    name: { en: 'Minimal line art', zh: '简约线画' },
    vibe: { en: 'Thin single-weight lines, one blue accent, lots of white space.', zh: '统一细线条，单一蓝色点缀，大量留白。' },
    ink: '#33475b', accent: '#2f6fb0', paper: '#fbfaf6',
    aesthetic: 'line_art',
    line: 'thin, single-weight, hand-drawn, open shapes',
    fill: 'none',
    texture: 'clean paper, a thin winding path along the bottom',
  },
  {
    id: 'doodle',
    name: { en: 'Crayon doodle', zh: '蜡笔涂鸦' },
    vibe: { en: 'Notebook-grid paper, playful crayon fills, multi-color, stick figures.', zh: '方格笔记本纸，俏皮蜡笔填色，多彩，火柴人。' },
    ink: '#2b3a55', accent: '#7c5cbf', paper: '#fdfcf4',
    aesthetic: 'crayon_doodle',
    line: 'wobbly hand-drawn marker, playful',
    fill: 'light crayon hatching in accent tints',
    texture: 'faint grid-paper background, washi-tape corners, tiny stars',
  },
  {
    id: 'warm',
    name: { en: 'Warm line', zh: '暖橙线画' },
    vibe: { en: 'Orange thin lines, rounded cards, gentle and friendly.', zh: '橙色细线，圆角卡片，温和亲切。' },
    ink: '#3a3632', accent: '#e8863c', paper: '#fbf7f0',
    aesthetic: 'line_art',
    line: 'thin rounded lines, soft corners',
    fill: 'sparse accent fill on key shapes only',
    texture: 'rounded rectangle cards, one accent per slide',
  },
  {
    id: 'info',
    name: { en: 'Flat infographic', zh: '扁平信息图' },
    vibe: { en: 'Flat vector people, donut & bar charts, business-report clarity.', zh: '扁平矢量人物，环形图与柱状图，商务报告的清晰感。' },
    ink: '#26445f', accent: '#2b7cc0', paper: '#ffffff',
    aesthetic: 'flat_infographic',
    line: 'clean flat vector, medium weight',
    fill: 'solid accent + one soft yellow secondary',
    texture: 'generous grids, chart-forward layout',
  },
];

const buildYaml = (p: Preset, lang: 'ja' | 'en' | 'zh', slides: number): string => {
  return `# NotebookLM — hand-drawn slide deck (style spec)
# Paste this YAML into your NotebookLM prompt, above your topic/sources.
# Technique credit: しらき@パワポ図解 (@kumiko_shiraki)

deck:
  language: ${lang}
  slides: ${slides}
  aspect_ratio: "16:9"
  audience: general
  goal: explain the topic clearly with one idea per slide

style:
  aesthetic: ${p.aesthetic}
  line: ${p.line}
  fill: ${p.fill}
  texture: ${p.texture}
  palette:
    ink: "${p.ink}"
    accent: "${p.accent}"     # use ONE accent color only
    paper: "${p.paper}"
  icons: simple, one concept each; keep line weight identical everywhere
  people: minimalist friendly figures, consistent proportions
  decoration: sparse (a few plants, clouds, a light path) — never crowd

layout:
  cover: oversized number or short serif headline + one-line subtitle
  section: big "01 / 02" numeral, a calm illustration
  content: heading top-left, 3-column icon rows, <= 20 words per slide
  data: hand-styled donut or bar chart, labels beside the shape
  closing: warm one-line call to action

rules:
  - one message per slide, generous white space
  - at most 3 columns and ~20 words per slide
  - never mix more than one accent color
  - keep every icon at the same line weight
  - prefer icons + short labels over paragraphs`;
};

/* ============================ SVG mockups =============================== */
/* Original, minimal thumbnails that evoke each style — not the source images. */

const Mock: React.FC<{ p: Preset; active: boolean }> = ({ p, active }) => (
  <svg viewBox="0 0 200 118" className="h-full w-full" role="img" aria-hidden="true">
    <rect x="0" y="0" width="200" height="118" rx="6" fill={p.paper} stroke={active ? p.accent : 'rgba(0,0,0,0.12)'} strokeWidth={active ? 2 : 1} />
    {p.id === 'doodle' && (
      <g stroke="rgba(0,0,0,0.06)" strokeWidth="0.5">
        {Array.from({ length: 11 }).map((_, i) => <line key={`v${i}`} x1={i * 18 + 6} y1="4" x2={i * 18 + 6} y2="114" />)}
        {Array.from({ length: 7 }).map((_, i) => <line key={`h${i}`} x1="4" y1={i * 18 + 6} x2="196" y2={i * 18 + 6} />)}
      </g>
    )}
    <text x="14" y="34" fontFamily="'Cormorant Garamond', Georgia, serif" fontSize="26" fontWeight="700" fill={p.accent}>01</text>
    <rect x="14" y="42" width="86" height="7" rx="3.5" fill={p.ink} opacity="0.85" />
    <rect x="14" y="54" width="64" height="5" rx="2.5" fill={p.ink} opacity="0.35" />
    {/* three line icons */}
    <g fill="none" stroke={p.ink} strokeWidth="1.5" strokeLinecap="round">
      <circle cx="30" cy="86" r="9" />
      <rect x="82" y="77" width="18" height="18" rx="3" />
      <path d="M138 95 l7 -12 7 12 z" />
    </g>
    {p.fill !== 'none' && (
      <g fill={p.accent} opacity="0.18">
        <circle cx="30" cy="86" r="9" />
        {p.id === 'info' && <rect x="82" y="77" width="18" height="18" rx="3" />}
      </g>
    )}
    {p.id === 'info' && (
      <g>
        <circle cx="168" cy="40" r="15" fill="none" stroke={p.accent} strokeWidth="6" />
        <circle cx="168" cy="40" r="15" fill="none" stroke="#e9c93c" strokeWidth="6" strokeDasharray="30 100" />
      </g>
    )}
    {/* bottom path */}
    <path d="M8 110 C 60 100, 140 118, 192 106" fill="none" stroke={p.accent} strokeWidth="1.2" opacity="0.55" />
  </svg>
);

/* ============================ page ====================================== */

const STEPS: { t: T; d: T }[] = [
  { t: { en: 'Open NotebookLM', zh: '打开 NotebookLM' }, d: { en: 'Add your sources (docs, PDFs, notes) or just a topic. Go to the visual / slide generation.', zh: '导入你的资料（文档、PDF、笔记）或直接给一个主题，进入幻灯片/可视化生成。' } },
  { t: { en: 'Paste the YAML first', zh: '先贴 YAML' }, d: { en: 'Put the style spec at the top of your prompt, then describe the deck you want below it.', zh: '把风格规格放在提示词最上面，下面再写你想要的这套幻灯片内容。' } },
  { t: { en: 'Generate & nudge', zh: '生成并微调' }, d: { en: 'Generate, then tweak one field at a time — accent color, slide count, aesthetic — and regenerate.', zh: '生成后每次只改一个字段（点缀色、页数、风格），再重新生成。' } },
];

const RULES: T[] = [
  { en: 'One message per slide — resist cramming.', zh: '每页只讲一件事 —— 别硬塞。' },
  { en: 'Exactly one accent color across the whole deck.', zh: '整套只用一个点缀色。' },
  { en: 'Keep every icon at the same line weight.', zh: '所有图标保持同一线条粗细。' },
  { en: 'Icons + short labels beat paragraphs.', zh: '图标 + 短标签，胜过整段文字。' },
  { en: 'Generous white space is the whole look.', zh: '大量留白，正是这个风格的灵魂。' },
  { en: 'Change one field at a time when iterating.', zh: '迭代时每次只改一个字段。' },
];

interface Props { onHome: () => void }

const NotebookLM: React.FC<Props> = ({ onHome }) => {
  const [lang, setLang] = useState<Lang>(detectInitialLang);
  const s2t = useS2T(lang === 'zhHant');
  const t = (txt: T) => (lang === 'en' ? txt.en : lang === 'zhHant' ? (s2t ? s2t(txt.zh) : txt.zh) : txt.zh);
  useEffect(() => { if (typeof window !== 'undefined') window.localStorage.setItem(STORAGE_KEY, lang); }, [lang]);

  const [presetId, setPresetId] = useState('line');
  const [deckLang, setDeckLang] = useState<'ja' | 'en' | 'zh'>('ja');
  const [slides, setSlides] = useState(9);
  const [copied, setCopied] = useState(false);

  const preset = PRESETS.find((p) => p.id === presetId)!;
  const yaml = useMemo(() => buildYaml(preset, deckLang, slides), [preset, deckLang, slides]);

  const copy = () => {
    navigator.clipboard?.writeText(yaml).then(() => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    }).catch(() => {});
  };

  const LANGS: { code: Lang; label: string }[] = [{ code: 'en', label: 'EN' }, { code: 'zh', label: '简' }, { code: 'zhHant', label: '繁' }];

  return (
    <div className="min-h-screen bg-paper font-sans text-ink">
      <header className="sticky top-0 z-40 border-b border-ink/10 bg-paper/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-5 py-4 sm:px-8">
          <button onClick={onHome} className="font-mono text-xs text-ink/55 transition-colors hover:text-ink">← Da Lei · 大雷</button>
          <div className="flex items-center gap-3">
            <span className="hidden font-mono text-[11px] uppercase tracking-[0.2em] text-gold sm:inline">NotebookLM · slide YAML</span>
            <div className="flex overflow-hidden rounded-full border border-ink/15">
              {LANGS.map((l) => (
                <button key={l.code} onClick={() => setLang(l.code)}
                  className={`px-2.5 py-1 font-mono text-[11px] transition-colors ${lang === l.code ? 'bg-ink text-paper' : 'text-ink/55 hover:text-ink'}`}>
                  {l.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-14">
        <p className="font-mono text-xs uppercase tracking-[0.22em] text-ink/45">{t({ en: 'Technique · NotebookLM + a YAML style spec', zh: '技法 · NotebookLM + 一段 YAML 风格规格' })}</p>
        <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight sm:text-5xl">
          {t({ en: 'Hand-drawn slide decks from NotebookLM', zh: '用 NotebookLM 生成手绘线画风幻灯片' })}
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-relaxed text-ink/65">
          {t({
            en: 'Feed NotebookLM a short YAML “style spec” before your topic, and it renders any material as a consistent, line-art slide deck — same line weight, one accent color, lots of white space. Pick a look, copy the YAML, paste it above your prompt.',
            zh: '在你的主题前面先给 NotebookLM 一段简短的 YAML「风格规格」，它就能把任意材料生成成风格统一的线画幻灯片 —— 统一线条、单一点缀色、大量留白。选一种风格、复制 YAML、贴在提示词最上面即可。',
          })}
        </p>

        {/* credit */}
        <div className="mt-5 flex flex-wrap items-center gap-2 rounded-2xl border-l-[3px] border-gold bg-surface/40 px-4 py-3">
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-gold">{t({ en: 'Credit', zh: '来源' })}</span>
          <p className="text-[13.5px] leading-relaxed text-ink/70">
            {t({ en: 'Technique shared by ', zh: '技法来自 ' })}
            <a href="https://x.com/kumiko_shiraki" target="_blank" rel="noopener noreferrer" className="text-gold underline underline-offset-2 hover:opacity-80">しらき@パワポ図解 (@kumiko_shiraki)</a>
            {t({ en: '. The YAML here is an original template rebuilt for study — ', zh: '。此处 YAML 为学习而重写的原创模板 —— ' })}
            <a href={SOURCE_URL} target="_blank" rel="noopener noreferrer" className="text-gold underline underline-offset-2 hover:opacity-80">{t({ en: 'see the original post ↗', zh: '查看原推 ↗' })}</a>.
          </p>
        </div>

        {/* ===== style picker ===== */}
        <section className="mt-8">
          <h2 className="font-mono text-[11px] uppercase tracking-[0.2em] text-gold">{t({ en: 'Step 1 · Pick a look', zh: '第 1 步 · 选一种风格' })}</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {PRESETS.map((p) => {
              const active = p.id === presetId;
              return (
                <button key={p.id} onClick={() => setPresetId(p.id)}
                  className={`group flex flex-col overflow-hidden rounded-2xl border text-left transition-all ${active ? 'border-gold/60 ring-2 ring-gold/20' : 'border-ink/10 hover:border-gold/40'}`}>
                  <div className="aspect-[200/118] w-full bg-surface/40">
                    <Mock p={p} active={active} />
                  </div>
                  <div className="flex flex-1 flex-col p-4">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-display text-lg font-semibold tracking-tight">{t(p.name)}</h3>
                      <span className="h-4 w-4 shrink-0 rounded-full" style={{ backgroundColor: p.accent }} />
                    </div>
                    <p className="mt-1.5 text-[12.5px] leading-relaxed text-ink/60">{t(p.vibe)}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* ===== yaml ===== */}
        <section className="mt-10 grid gap-6 lg:grid-cols-[1fr_1.15fr]">
          <div>
            <h2 className="font-mono text-[11px] uppercase tracking-[0.2em] text-gold">{t({ en: 'Step 2 · Tune & copy the YAML', zh: '第 2 步 · 调整并复制 YAML' })}</h2>
            <div className="mt-4 space-y-4">
              <div className="rounded-2xl border border-ink/10 bg-surface/40 p-4">
                <p className="font-mono text-[11px] uppercase tracking-wider text-ink/50">{t({ en: 'Deck language', zh: '幻灯片语言' })}</p>
                <div className="mt-2 flex gap-2">
                  {([['ja', '日本語'], ['en', 'English'], ['zh', '中文']] as const).map(([code, label]) => (
                    <button key={code} onClick={() => setDeckLang(code)}
                      className={`rounded-full border px-3 py-1.5 font-mono text-[11px] transition-colors ${deckLang === code ? 'border-ink bg-ink text-paper' : 'border-ink/15 text-ink/60 hover:border-ink/40'}`}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="rounded-2xl border border-ink/10 bg-surface/40 p-4">
                <div className="flex items-center justify-between">
                  <p className="font-mono text-[11px] uppercase tracking-wider text-ink/50">{t({ en: 'Slides', zh: '页数' })}</p>
                  <span className="font-mono text-sm text-gold">{slides}</span>
                </div>
                <input type="range" min={5} max={15} value={slides} onChange={(e) => setSlides(Number(e.target.value))}
                  className="mt-2 w-full accent-gold" />
              </div>
              <div className="rounded-2xl border border-ink/10 bg-surface/40 p-4">
                <p className="font-mono text-[11px] uppercase tracking-wider text-ink/50">{t({ en: 'Palette', zh: '配色' })}</p>
                <div className="mt-2 flex items-center gap-2">
                  {[preset.ink, preset.accent, preset.paper].map((c) => (
                    <span key={c} className="flex items-center gap-1.5 rounded-full border border-ink/10 bg-paper px-2 py-1">
                      <span className="h-3.5 w-3.5 rounded-full border border-ink/10" style={{ backgroundColor: c }} />
                      <span className="font-mono text-[10px] text-ink/55">{c}</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="lg:sticky lg:top-24 lg:self-start">
            <div className="overflow-hidden rounded-2xl border border-ink/15 bg-ink/[0.97]">
              <div className="flex items-center justify-between gap-3 border-b border-paper/10 px-4 py-2.5">
                <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-paper/50">{t(preset.name)} · style.yaml</span>
                <button onClick={copy} className="rounded-md border border-paper/25 px-2.5 py-1 font-mono text-[11px] text-paper/80 transition-colors hover:border-gold hover:text-gold">
                  {copied ? t({ en: 'Copied ✓', zh: '已复制 ✓' }) : t({ en: 'Copy YAML', zh: '复制 YAML' })}
                </button>
              </div>
              <pre className="max-h-[30rem] overflow-auto whitespace-pre px-4 py-4 font-mono text-[12px] leading-relaxed text-paper/85">{yaml}</pre>
            </div>
          </div>
        </section>

        {/* ===== how to use ===== */}
        <section className="mt-12">
          <h2 className="font-mono text-[11px] uppercase tracking-[0.2em] text-gold">{t({ en: 'Step 3 · Use it in NotebookLM', zh: '第 3 步 · 在 NotebookLM 里使用' })}</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            {STEPS.map((s, i) => (
              <div key={i} className="rounded-2xl border border-ink/10 bg-surface/40 p-5">
                <span className="font-mono text-xs text-gold">0{i + 1}</span>
                <h3 className="mt-1 font-semibold text-ink">{t(s.t)}</h3>
                <p className="mt-2 text-[13.5px] leading-relaxed text-ink/60">{t(s.d)}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ===== rules ===== */}
        <section className="mt-10 rounded-3xl border border-ink/10 bg-surface/40 p-6 sm:p-8">
          <h2 className="font-display text-2xl font-semibold tracking-tight">{t({ en: 'What keeps the look consistent', zh: '让整套风格统一的关键' })}</h2>
          <ul className="mt-5 grid gap-x-8 gap-y-3 sm:grid-cols-2">
            {RULES.map((r, i) => (
              <li key={i} className="flex items-start gap-2.5 text-[14px] leading-relaxed text-ink/70">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-gold" />{t(r)}
              </li>
            ))}
          </ul>
        </section>

        <p className="mt-10 text-xs leading-relaxed text-ink/45">
          {t({
            en: 'Rebuilt by 大雷 for learning. The line-art-via-YAML technique is credited to しらき@パワポ図解; this page’s YAML is an original template, and the style thumbnails are original renderings (not the source images). Verify NotebookLM’s current capabilities before you rely on them.',
            zh: '大雷为学习而重建。「YAML 生成线画幻灯片」技法署名 しらき@パワポ図解；本页 YAML 为原创模板，风格缩略图也是原创绘制（非原图）。NotebookLM 的具体能力请以官方最新为准。',
          })}
        </p>
      </main>
    </div>
  );
};

export default NotebookLM;
