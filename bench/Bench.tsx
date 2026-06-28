import React, { useMemo, useState } from 'react';
import { MODELS, REF_MODEL, TESTS, Model, BenchTest, Result } from './data/bench';

interface Props {
  onHome: () => void;
}

const ALL_MODELS: Model[] = [REF_MODEL, ...MODELS];
const modelById = new Map(ALL_MODELS.map((m) => [m.id, m]));

const CATS: { key: string; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'svg', label: 'SVG' },
  { key: 'landing', label: '落地页' },
  { key: 'webpage', label: '网页' },
  { key: 'design', label: '设计' },
  { key: 'logic', label: '逻辑' },
];

const ModelChip: React.FC<{ id: string; size?: number }> = ({ id, size = 22 }) => {
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
      <span className="font-mono text-xs text-ink/70">{m.name}</span>
    </span>
  );
};

const verdictTone = (v?: Result['verdict']) =>
  v === 'win' ? 'text-gold border-gold/40 bg-gold/10' : v === 'fail' ? 'text-ember border-ember/40 bg-ember/10' : 'text-ink/50 border-ink/15 bg-ink/5';
const verdictLabel = (v?: Result['verdict']) => (v === 'win' ? '最佳' : v === 'fail' ? '翻车' : v === 'ok' ? '可用' : '');

/* renders a result's artifact at a given scale ('tile' | 'full') */
const Artifact: React.FC<{ r: Result; full?: boolean }> = ({ r, full }) => {
  if (r.kind === 'svg' && r.svg) {
    return <div className="bench-svg h-full w-full" dangerouslySetInnerHTML={{ __html: r.svg }} />;
  }
  if (r.kind === 'image' && r.image) {
    return <img src={r.image} alt="" className="h-full w-full object-cover" />;
  }
  if (r.kind === 'html' && r.html) {
    return <iframe title="result" srcDoc={r.html} sandbox="allow-scripts" className={`h-full w-full bg-white ${full ? '' : 'pointer-events-none'}`} />;
  }
  if (r.kind === 'link' && r.url) {
    return (
      <a href={r.url} target="_blank" rel="noreferrer" className="grid h-full w-full place-items-center font-mono text-xs text-gold hover:underline">
        打开链接 ↗
      </a>
    );
  }
  return <span className="font-mono text-[11px] text-ink/35">待录入</span>;
};

const Bench: React.FC<Props> = ({ onHome }) => {
  const [cat, setCat] = useState('all');
  const [msg, setMsg] = useState('');
  const [open, setOpen] = useState<{ test: BenchTest; r: Result } | null>(null);

  const tests = useMemo(() => (cat === 'all' ? TESTS : TESTS.filter((t) => t.category === cat)), [cat]);

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setMsg('已复制 Prompt');
      setTimeout(() => setMsg(''), 1600);
    } catch {
      /* noop */
    }
  };

  return (
    <div className="min-h-screen bg-paper font-sans text-ink">
      <header className="sticky top-0 z-40 border-b border-ink/10 bg-paper/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-5 py-4 sm:px-8">
          <div className="flex items-center justify-between gap-3">
            <button onClick={onHome} className="font-mono text-xs text-ink/55 hover:text-ink">← Da Lei · 大雷</button>
            <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-gold">AI Benchmark</span>
          </div>
          <div>
            <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">大雷 AI 评测台</h1>
            <p className="mt-1 max-w-2xl text-sm text-ink/60">
              一套固定题目、同一套规范，横向对照各家模型的真实输出 —— 录视频直接打开即可展示的稀缺个人横评。
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {CATS.map((c) => (
              <button
                key={c.key}
                onClick={() => setCat(c.key)}
                className={`rounded-full px-3 py-1 text-xs transition-colors ${cat === c.key ? 'bg-accent text-paper' : 'border border-ink/15 text-ink/60 hover:text-ink'}`}
              >
                {c.label}
              </button>
            ))}
            {msg && <span className="ml-auto font-mono text-xs text-gold">{msg}</span>}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-8 sm:px-8">
        <div className="flex flex-col gap-10">
          {tests.map((test) => (
            <section key={test.id} className="rounded-2xl border border-ink/10 bg-surface/40 p-6 sm:p-7">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="font-display text-2xl font-semibold tracking-tight">{test.title}</h2>
                  <p className="mt-1 text-sm text-ink/55">{test.whatItTests}</p>
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
                    复制
                  </button>
                </div>
                <p className="whitespace-pre-wrap font-mono text-xs leading-relaxed text-ink/75">{test.prompt}</p>
              </div>

              {/* Results grid */}
              <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {test.results.map((r, i) => {
                  const clickable = r.kind !== 'pending';
                  return (
                    <figure
                      key={r.modelId + i}
                      onClick={clickable ? () => setOpen({ test, r }) : undefined}
                      className={`overflow-hidden rounded-xl border bg-paper ${clickable ? 'cursor-pointer border-ink/10 hover:border-gold/40' : 'border-dashed border-ink/15'}`}
                    >
                      <div className="relative grid aspect-[4/3] place-items-center overflow-hidden bg-[repeating-conic-gradient(#0000_0_25%,#1c1a170a_0_50%)] [background-size:16px_16px]">
                        <Artifact r={r} />
                        {verdictLabel(r.verdict) && (
                          <span className={`absolute right-2 top-2 rounded-full border px-2 py-0.5 font-mono text-[10px] ${verdictTone(r.verdict)}`}>
                            {verdictLabel(r.verdict)}
                          </span>
                        )}
                      </div>
                      <figcaption className="flex items-center justify-between gap-2 px-3 py-2">
                        <ModelChip id={r.modelId} />
                        <span className="font-mono text-[10px] text-ink/40">{r.date || (r.kind === 'pending' ? '待录入' : '')}</span>
                      </figcaption>
                    </figure>
                  );
                })}
              </div>
            </section>
          ))}
        </div>

        <p className="mt-10 text-center font-mono text-[11px] text-ink/40">
          想加结果？编辑 <span className="text-ink/60">bench/data/bench.ts</span> —— 贴 SVG / HTML / 截图(public/bench/)/ 链接即可。
        </p>
      </main>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-[120] grid place-items-center bg-ink/50 p-4 backdrop-blur-sm" onClick={() => setOpen(null)}>
          <div className="relative flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-ink/10 bg-paper" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between gap-3 border-b border-ink/10 px-5 py-3">
              <div className="flex items-center gap-3">
                <ModelChip id={open.r.modelId} size={26} />
                <span className="font-display text-sm font-semibold">{open.test.title}</span>
              </div>
              <button onClick={() => setOpen(null)} className="grid h-8 w-8 place-items-center rounded-full border border-ink/15 text-ink/60 hover:text-ink" aria-label="关闭">×</button>
            </div>
            <div className="grid min-h-[50vh] flex-1 place-items-center overflow-auto bg-[repeating-conic-gradient(#0000_0_25%,#1c1a170a_0_50%)] [background-size:18px_18px] p-4">
              <div className="h-[60vh] w-full">
                <Artifact r={open.r} full />
              </div>
            </div>
            {open.r.note && <p className="border-t border-ink/10 px-5 py-3 text-sm text-ink/65">{open.r.note}</p>}
          </div>
        </div>
      )}
    </div>
  );
};

export default Bench;
