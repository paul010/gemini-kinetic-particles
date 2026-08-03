import React, { useEffect, useMemo, useRef, useState } from 'react';
import { MODELS, REF_MODEL, TESTS, Model, BenchTest, Result, LocalizedText } from './data/bench';

interface Props {
  onHome: () => void;
}

/* ---- i18n (same pattern as the homepage: EN default, 简, 繁 via OpenCC) ---- */
type Lang = 'en' | 'zh' | 'zhHant';
const STORAGE_KEY = 'dalei-lang-v2';
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
    return () => {
      alive = false;
    };
  }, [active, conv]);
  return conv;
};

const ALL_MODELS: Model[] = [REF_MODEL, ...MODELS];
const modelById = new Map(ALL_MODELS.map((m) => [m.id, m]));
// the reference pseudo-model's name is localized; real vendors keep their names
const REF_NAME: LocalizedText = { en: 'Da Lei Ref', zh: '大雷基准' };

const CATS: { key: string; label: LocalizedText }[] = [
  { key: 'all', label: { en: 'All', zh: '全部' } },
  { key: 'svg', label: { en: 'SVG', zh: 'SVG' } },
  { key: 'landing', label: { en: 'Landing', zh: '落地页' } },
  { key: 'webpage', label: { en: 'Webpage', zh: '网页' } },
  { key: '3d', label: { en: '3D', zh: '3D' } },
  { key: 'design', label: { en: 'Design', zh: '设计' } },
  { key: 'logic', label: { en: 'Logic', zh: '逻辑' } },
];

const ModelChip: React.FC<{ id: string; size?: number; t: (x: LocalizedText) => string }> = ({ id, size = 22, t }) => {
  const m = modelById.get(id);
  if (!m) return null;
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className="grid shrink-0 place-items-center rounded-md font-mono font-bold text-white"
        style={{ width: size, height: size, backgroundColor: m.color, fontSize: size * 0.5 }}
      >
        {m.mark}
      </span>
      <span className="font-mono text-xs text-ink/70">{id === 'dalei-ref' ? t(REF_NAME) : m.name}</span>
    </span>
  );
};

const verdictTone = (v?: Result['verdict']) =>
  v === 'win' ? 'text-gold border-gold/40 bg-gold/10' : v === 'fail' ? 'text-ember border-ember/40 bg-ember/10' : 'text-ink/50 border-ink/15 bg-ink/5';
const verdictLabel = (v: Result['verdict'], t: (x: LocalizedText) => string) =>
  v === 'win' ? t({ en: 'Best', zh: '最佳' }) : v === 'fail' ? t({ en: 'Fail', zh: '翻车' }) : v === 'ok' ? t({ en: 'OK', zh: '可用' }) : '';

/* renders a result's artifact at a given scale ('tile' | 'full') */
const Artifact: React.FC<{ r: Result; full?: boolean; t: (x: LocalizedText) => string }> = ({ r, full, t }) => {
  if (r.kind === 'svg' && r.svg) {
    return <div className="bench-svg h-full w-full" dangerouslySetInnerHTML={{ __html: r.svg }} />;
  }
  if (r.kind === 'image' && r.image) {
    return <img src={r.image} alt={t({ en: 'Benchmark result preview', zh: '评测结果预览' })} loading="lazy" decoding="async" className="h-full w-full object-cover" />;
  }
  if (r.kind === 'html' && r.html) {
    return <iframe title="result" srcDoc={r.html} sandbox="allow-scripts" className={`h-full w-full bg-white ${full ? '' : 'pointer-events-none'}`} />;
  }
  if (r.kind === 'link' && r.url) {
    return (
      <a href={r.url} target="_blank" rel="noreferrer" className="grid h-full w-full place-items-center font-mono text-xs text-gold hover:underline">
        {t({ en: 'Open link', zh: '打开链接' })} ↗
      </a>
    );
  }
  return <span className="font-mono text-[11px] text-ink/35">{t({ en: 'Pending', zh: '待录入' })}</span>;
};

interface ShowcaseProps {
  t: (x: LocalizedText) => string;
  onOpen: (entry: { test: BenchTest; r: Result }) => void;
}

const ScrollWorldShowcase: React.FC<ShowcaseProps> = ({ t, onOpen }) => {
  const hostRef = useRef<HTMLElement>(null);
  const [active, setActive] = useState(0);
  const [sceneProgress, setSceneProgress] = useState(0);
  const scenes = useMemo(
    () => TESTS.flatMap((test) => test.results.filter((r) => r.simulated && r.featured && r.image).map((r) => ({ test, r }))),
    [],
  );

  useEffect(() => {
    if (!scenes.length || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let frame = 0;
    const update = () => {
      const el = hostRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const range = Math.max(1, el.offsetHeight - window.innerHeight);
      const progress = Math.max(0, Math.min(0.9999, -rect.top / range));
      const position = progress * scenes.length;
      setActive(Math.min(scenes.length - 1, Math.floor(position)));
      setSceneProgress(position % 1);
    };
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [scenes.length]);

  if (!scenes.length) return null;
  const jumpTo = (index: number) => {
    const el = hostRef.current;
    if (!el) return;
    const range = Math.max(1, el.offsetHeight - window.innerHeight);
    const target = el.offsetTop + (index / scenes.length) * range + 2;
    window.scrollTo({ top: target, behavior: 'smooth' });
  };
  const current = scenes[active];
  const currentModel = modelById.get(current.r.modelId);

  return (
    <>
      <section
        ref={hostRef}
        aria-label={t({ en: 'Simulated benchmark gallery', zh: '模拟评测展廊' })}
        className="relative hidden bg-[#05090f] text-white md:block"
        style={{ height: `${Math.max(420, scenes.length * 105)}vh` }}
      >
        <div className="sticky top-[57px] h-[calc(100svh-57px)] min-h-[560px] overflow-hidden">
          {scenes.map(({ test, r }, index) => {
            const distance = Math.abs(index - active);
            const isActive = index === active;
            return (
              <button
                key={`${test.id}-${r.modelId}`}
                onClick={() => onOpen({ test, r })}
                tabIndex={isActive ? 0 : -1}
                aria-hidden={!isActive}
                aria-label={`${t(test.title)} · ${modelById.get(r.modelId)?.name || r.modelId}`}
                className="absolute inset-0 h-full w-full text-left transition-opacity duration-700 ease-out"
                style={{ opacity: isActive ? 1 : 0, pointerEvents: isActive ? 'auto' : 'none' }}
              >
                <img
                  src={r.image}
                  alt=""
                  loading={index === 0 ? 'eager' : 'lazy'}
                  className="h-full w-full object-cover will-change-transform"
                  style={{ transform: `scale(${1.065 - sceneProgress * 0.025 + distance * 0.01}) translate3d(0, ${sceneProgress * -0.7}%, 0)` }}
                />
              </button>
            );
          })}
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(3,7,12,.92)_0%,rgba(3,7,12,.48)_34%,rgba(3,7,12,.06)_66%,rgba(3,7,12,.58)_100%)]" />
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(3,7,12,.54)_0%,transparent_28%,transparent_58%,rgba(3,7,12,.88)_100%)]" />

          <div className="absolute left-8 top-8 z-10 max-w-xl lg:left-14 lg:top-12">
            <div className="mb-5 flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.24em] text-white/60">
              <span className="h-px w-10 bg-cyan-300/70" />
              Scroll World · Simulated Gallery
            </div>
            <h1 className="max-w-3xl font-display text-5xl font-semibold leading-[0.94] tracking-[-0.045em] lg:text-7xl">
              {t({ en: 'Scroll through what a benchmark could reveal.', zh: '滚动穿过每一种模型想象。' })}
            </h1>
            <p className="mt-5 max-w-lg text-sm leading-relaxed text-white/66 lg:text-base">
              {t({
                en: 'A cinematic preview layer for the workbench. These frames are clearly marked simulations; recorded runs can replace them one by one.',
                zh: '为评测台增加一层电影感预览。这些画面均明确标注为模拟展示，之后可以被真实跑测结果逐一替换。',
              })}
            </p>
            <a href="#benchmark-cases" className="pointer-events-auto mt-6 inline-flex items-center gap-2 rounded-lg border border-white/20 bg-black/20 px-4 py-2 font-mono text-[11px] text-white/80 backdrop-blur-md hover:border-white/45 hover:text-white">
              {t({ en: 'Skip to prompts', zh: '直接进入提示词' })} ↓
            </a>
          </div>

          <div className="absolute bottom-9 left-8 z-10 max-w-2xl lg:bottom-12 lg:left-14">
            <div className="mb-4 flex items-center gap-3">
              <span className="rounded-md border border-amber-300/35 bg-amber-300/10 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-amber-200">
                {t({ en: 'Simulation · not a real score', zh: '模拟展示 · 非真实跑分' })}
              </span>
              <span className="font-mono text-[10px] text-white/45">0{active + 1} / 0{scenes.length}</span>
            </div>
            <h2 className="font-display text-3xl font-semibold tracking-tight lg:text-5xl">{t(current.test.title)}</h2>
            <div className="mt-4 flex flex-wrap items-center gap-5">
              {currentModel && (
                <span className="inline-flex items-center gap-2.5">
                  <span className="grid h-8 w-8 place-items-center rounded-lg font-mono text-sm font-bold text-white" style={{ backgroundColor: currentModel.color }}>
                    {currentModel.mark}
                  </span>
                  <span>
                    <span className="block text-sm font-semibold">{currentModel.name}</span>
                    <span className="block font-mono text-[10px] uppercase tracking-wider text-white/45">visual direction</span>
                  </span>
                </span>
              )}
              <span className="h-8 w-px bg-white/18" />
              <span className="font-display text-4xl font-semibold text-white">{current.r.score}</span>
              <span className="max-w-[15rem] text-xs leading-relaxed text-white/52">{t(current.test.whatItTests)}</span>
            </div>
          </div>

          <nav aria-label={t({ en: 'Gallery scenes', zh: '展廊场景' })} className="absolute right-7 top-1/2 z-20 flex -translate-y-1/2 flex-col items-end gap-4 lg:right-10">
            {scenes.map(({ test, r }, index) => (
              <button key={`${test.id}-${r.modelId}-rail`} onClick={() => jumpTo(index)} className="group flex items-center gap-3" aria-label={`${t(test.title)} ${index + 1}`}>
                <span className={`font-mono text-[9px] uppercase tracking-widest transition-opacity ${active === index ? 'text-white/70' : 'text-white/0 group-hover:text-white/45'}`}>
                  {modelById.get(r.modelId)?.name}
                </span>
                <span className={`block rounded-full transition-all ${active === index ? 'h-8 w-1 bg-cyan-300' : 'h-1.5 w-1.5 bg-white/35 group-hover:bg-white/70'}`} />
              </button>
            ))}
          </nav>

          <div className="absolute bottom-0 left-0 z-20 h-0.5 bg-white/10" style={{ width: '100%' }}>
            <div className="h-full bg-cyan-300 transition-[width] duration-150" style={{ width: `${((active + sceneProgress) / scenes.length) * 100}%` }} />
          </div>
        </div>
      </section>

      <section className="bg-[#05090f] px-5 pb-8 pt-6 text-white md:hidden">
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-cyan-300">Scroll World · Simulated</span>
        <h1 className="mt-3 font-display text-4xl font-semibold leading-none tracking-tight">{t({ en: 'Model visions, side by side.', zh: '不同模型，不同画面。' })}</h1>
        <p className="mt-3 text-sm leading-relaxed text-white/60">{t({ en: 'Concept previews only, ready to be replaced by recorded runs.', zh: '仅作模拟预览，可随时替换为真实跑测结果。' })}</p>
        <div className="-mx-5 mt-6 flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-3">
          {scenes.map(({ test, r }) => (
            <button key={`${test.id}-${r.modelId}-mobile`} onClick={() => onOpen({ test, r })} className="relative aspect-[4/3] w-[82vw] shrink-0 snap-center overflow-hidden rounded-xl border border-white/10 bg-white/5 text-left">
              <img src={r.image} alt="" loading="lazy" className="h-full w-full object-cover" />
              <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent p-4 pt-12">
                <span className="block font-mono text-[9px] uppercase tracking-widest text-amber-200">{t({ en: 'Simulated', zh: '模拟展示' })}</span>
                <span className="mt-1 block font-display text-xl font-semibold">{t(test.title)}</span>
              </span>
            </button>
          ))}
        </div>
      </section>
    </>
  );
};

const Bench: React.FC<Props> = ({ onHome }) => {
  const [cat, setCat] = useState('all');
  const [msg, setMsg] = useState('');
  const [open, setOpen] = useState<{ test: BenchTest; r: Result } | null>(null);
  const [lang, setLang] = useState<Lang>(detectInitialLang);
  const s2t = useS2T(lang === 'zhHant');
  const t = (txt: LocalizedText) => (lang === 'en' ? txt.en : lang === 'zhHant' ? (s2t ? s2t(txt.zh) : txt.zh) : txt.zh);
  useEffect(() => {
    if (typeof window !== 'undefined') window.localStorage.setItem(STORAGE_KEY, lang);
  }, [lang]);
  useEffect(() => {
    const id = window.location.hash.slice(1);
    if (!id) return;
    const frame = requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView());
    return () => cancelAnimationFrame(frame);
  }, []);

  const tests = useMemo(() => (cat === 'all' ? TESTS : TESTS.filter((bt) => bt.category === cat)), [cat]);

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setMsg(t({ en: 'Copied prompt', zh: '已复制 Prompt' }));
      setTimeout(() => setMsg(''), 1600);
    } catch {
      /* noop */
    }
  };

  const LANGS: { code: Lang; label: string }[] = [
    { code: 'en', label: 'EN' },
    { code: 'zh', label: '简' },
    { code: 'zhHant', label: '繁' },
  ];

  return (
    <div className="min-h-screen bg-paper font-sans text-ink">
      <header className="sticky top-0 z-40 border-b border-ink/10 bg-paper/85 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-5 sm:px-8">
            <button onClick={onHome} className="font-mono text-xs text-ink/55 hover:text-ink">← Da Lei · 大雷</button>
            <div className="flex items-center gap-3">
              <span className="hidden font-mono text-[11px] uppercase tracking-[0.2em] text-gold sm:inline">AI Benchmark</span>
              <div className="flex overflow-hidden rounded-full border border-ink/15">
                {LANGS.map((l) => (
                  <button
                    key={l.code}
                    onClick={() => setLang(l.code)}
                    className={`px-2.5 py-1 font-mono text-[11px] transition-colors ${lang === l.code ? 'bg-ink text-paper' : 'text-ink/55 hover:text-ink'}`}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            </div>
        </div>
      </header>

      <ScrollWorldShowcase t={t} onOpen={setOpen} />

      <main id="benchmark-cases" className="mx-auto max-w-6xl scroll-mt-20 px-5 py-10 sm:px-8 sm:py-14">
        <div className="mb-9 grid gap-6 border-b border-ink/10 pb-8 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-gold">Fixed prompts · One rubric</span>
            <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-5xl">{t({ en: 'Da Lei AI Benchmark', zh: '大雷 AI 评测台' })}</h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink/60">
              {t({
                en: 'Copy a fixed prompt, run it across models, then replace each simulated frame with the recorded output. Simulations are visual staging only and never count as real scores.',
                zh: '复制同一条固定提示词，在不同模型中跑测，再把模拟画面替换成真实结果。模拟图只用于视觉展陈，绝不计入真实跑分。',
              })}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {CATS.map((c) => (
              <button
                key={c.key}
                onClick={() => setCat(c.key)}
                className={`rounded-full px-3 py-1 text-xs transition-colors ${cat === c.key ? 'bg-accent text-paper' : 'border border-ink/15 text-ink/60 hover:text-ink'}`}
              >
                {t(c.label)}
              </button>
            ))}
            {msg && <span className="ml-auto font-mono text-xs text-gold">{msg}</span>}
          </div>
        </div>
        <div className="flex flex-col gap-10">
          {tests.map((test) => (
            <section id={test.id} key={test.id} className="scroll-mt-20 rounded-2xl border border-ink/10 bg-surface/40 p-6 sm:p-7">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="font-display text-2xl font-semibold tracking-tight">{t(test.title)}</h2>
                  <p className="mt-1 text-sm text-ink/55">{t(test.whatItTests)}</p>
                </div>
                <span className="rounded-full border border-ink/15 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-ink/45">
                  {test.category}
                </span>
              </div>

              {/* Prompt */}
              <div className="mt-4 rounded-xl border border-ink/10 bg-ink/[0.02] p-3">
                <div className="mb-1.5 flex items-center justify-between">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-gold">Prompt</span>
                  <button onClick={() => copy(test.prompt)} className="rounded-full border border-ink/15 px-2.5 py-0.5 font-mono text-[11px] text-ink/70 hover:border-gold/50 hover:text-ink">
                    {t({ en: 'Copy', zh: '复制' })}
                  </button>
                </div>
                <p className="max-h-64 overflow-y-auto whitespace-pre-wrap pr-2 font-mono text-xs leading-relaxed text-ink/75">{test.prompt}</p>
              </div>

              {/* Results grid */}
              <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {test.results.map((r, i) => {
                  const clickable = r.kind !== 'pending';
                  return (
                    <figure
                      key={r.modelId + i}
                      onClick={clickable ? () => setOpen({ test, r }) : undefined}
                      className={`group overflow-hidden rounded-xl border bg-paper transition-[border-color,transform,box-shadow] duration-300 ${clickable ? 'cursor-pointer border-ink/10 hover:-translate-y-1 hover:border-gold/40 hover:shadow-[0_18px_45px_rgba(28,26,23,.11)]' : 'border-dashed border-ink/15'}`}
                    >
                      <div className="relative grid aspect-[4/3] place-items-center overflow-hidden bg-[repeating-conic-gradient(#0000_0_25%,#1c1a170a_0_50%)] [background-size:16px_16px]">
                        <Artifact r={r} t={t} />
                        {r.simulated && (
                          <>
                            <span className="absolute left-2 top-2 rounded-md border border-amber-200/30 bg-black/55 px-2 py-1 font-mono text-[9px] uppercase tracking-[0.14em] text-amber-100 backdrop-blur-md">
                              {t({ en: 'Simulated', zh: '模拟展示' })}
                            </span>
                            {r.score && <span className="absolute bottom-2 right-2 rounded-md border border-white/15 bg-black/55 px-2 py-1 font-display text-xl font-semibold text-white backdrop-blur-md">{r.score}<small className="ml-0.5 font-mono text-[8px] text-white/55">/100</small></span>}
                          </>
                        )}
                        {!r.simulated && verdictLabel(r.verdict, t) && (
                          <span className={`absolute right-2 top-2 rounded-full border px-2 py-0.5 font-mono text-[10px] ${verdictTone(r.verdict)}`}>
                            {verdictLabel(r.verdict, t)}
                          </span>
                        )}
                      </div>
                      <figcaption className="flex items-center justify-between gap-2 px-3 py-2">
                        <ModelChip id={r.modelId} t={t} />
                        <span className="font-mono text-[10px] text-ink/40">
                          {r.simulated ? t({ en: 'Visual concept', zh: '视觉概念' }) : r.date || (r.kind === 'pending' ? t({ en: 'Pending', zh: '待录入' }) : '')}
                        </span>
                      </figcaption>
                    </figure>
                  );
                })}
              </div>
            </section>
          ))}
        </div>

        <p className="mt-10 text-center font-mono text-[11px] text-ink/40">
          {t({ en: 'Add a result? Edit ', zh: '想加结果？编辑 ' })}
          <span className="text-ink/60">bench/data/bench.ts</span>
          {t({ en: '. Paste an SVG, HTML, screenshot (public/bench/), or link.', zh: '，贴入 SVG、HTML、截图（public/bench/）或链接即可。' })}
        </p>
      </main>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-[120] grid place-items-center bg-ink/50 p-4 backdrop-blur-sm" onClick={() => setOpen(null)}>
          <div className="relative flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-ink/10 bg-paper" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between gap-3 border-b border-ink/10 px-5 py-3">
              <div className="flex items-center gap-3">
                <ModelChip id={open.r.modelId} size={26} t={t} />
                <span className="font-display text-sm font-semibold">{t(open.test.title)}</span>
                {open.r.simulated && <span className="rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-amber-700">{t({ en: 'Simulated', zh: '模拟展示' })}</span>}
              </div>
              <button onClick={() => setOpen(null)} className="grid h-8 w-8 place-items-center rounded-full border border-ink/15 text-ink/60 hover:text-ink" aria-label={t({ en: 'Close', zh: '关闭' })}>×</button>
            </div>
            <div className="grid min-h-[50vh] flex-1 place-items-center overflow-auto bg-[repeating-conic-gradient(#0000_0_25%,#1c1a170a_0_50%)] [background-size:18px_18px] p-4">
              <div className="h-[60vh] w-full">
                <Artifact r={open.r} full t={t} />
              </div>
            </div>
            {open.r.note && <p className="border-t border-ink/10 px-5 py-3 text-sm text-ink/65">{t(open.r.note)}</p>}
          </div>
        </div>
      )}
    </div>
  );
};

export default Bench;
