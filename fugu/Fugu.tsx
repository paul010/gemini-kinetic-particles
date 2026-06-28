import React, { useEffect, useRef, useState } from 'react';

/* ---------------------------------------------------------------------------
 * /fugu — a research report page: an independent, CPU-only reproduction of the
 * Sakana Fugu / TRINITY "learned model orchestration" claim, using the
 * open-source openfugu reimplementation. All numbers below come from a numpy
 * harness committed alongside this page (research/fugu/validate.py) — nothing
 * is hand-waved; the script reruns it.
 * ------------------------------------------------------------------------- */

type Lang = 'en' | 'zh' | 'zhHant';
interface LocalizedText { en: string; zh: string }

const STORAGE_KEY = 'dalei-lang-v2';
const detectInitialLang = (): Lang => {
  if (typeof window === 'undefined') return 'en';
  const saved = window.localStorage.getItem(STORAGE_KEY);
  return saved === 'zh' || saved === 'zhHant' ? saved : 'en';
};

// Simplified → Traditional via OpenCC, lazy-loaded only when 繁體 is chosen.
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

/* ---- the measured results (research/fugu/results.json) -------------------- */
// sep-CMA-ES mean-policy reward per generation (seed 0); plateaus by ~gen 4.
const CURVE = [0.711, 0.848, 0.844, 0.849, 0.864, 0.867, 0.869, 0.87, 0.87, 0.87, 0.87, 0.87, 0.87, 0.87, 0.87, 0.87, 0.87, 0.87, 0.87, 0.87];
const RANDOM = 0.434;
const BEST_SINGLE = 0.489;
const ORACLE = 0.874;
const LEARNED = 0.874;
const SEEDS = 8;
const LIFT_MEAN = 79.0;
const LIFT_MIN = 55.8;
const LIFT_MAX = 92.2;
const PCT_ORACLE = 99.9;
const GENS_95 = 2;

const CONTROL_CHECKS: LocalizedText[] = [
  { en: 'A Verifier ACCEPT terminates the loop early (before max-turns)', zh: 'Verifier 给出 ACCEPT 时循环提前终止(早于 max-turns)' },
  { en: 'A cold Verifier at turn 0 is re-routed to Worker, not a no-op end', zh: '第 0 轮就被选到的「冷」Verifier 被改派为 Worker,而非空操作直接结束' },
  { en: 'With suppression off, raw step_trinity ends as verifier_no_response', zh: '关闭抑制后,原始 step_trinity 会以 verifier_no_response 结束(忠实复现)' },
  { en: 'A Thinker’s <suggested_role> overrides the router’s next decision', zh: 'Thinker 的 <suggested_role> 会覆盖路由器的下一步决策' },
  { en: 'Only Solver turns fold a <think> into the router observation', zh: '只有 Solver 轮次会把 <think> 折叠进路由器的观测(obs)' },
  { en: 'The full loop runs offline with a mock worker pool — no API keys', zh: '整个循环用 mock 工作池离线跑通 —— 不需要任何 API Key' },
];

/* small inline line chart for the convergence curve.
   The curve draws itself in when scrolled into view (reads well on camera);
   falls back to fully-drawn instantly under prefers-reduced-motion. */
const ConvergenceChart: React.FC<{ t: (x: LocalizedText) => string }> = ({ t }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const reduced =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const [shown, setShown] = useState(reduced);
  useEffect(() => {
    if (shown || !svgRef.current) return;
    if (!('IntersectionObserver' in window)) {
      setShown(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setShown(true);
          io.disconnect();
        }
      },
      { threshold: 0.35 }
    );
    io.observe(svgRef.current);
    return () => io.disconnect();
  }, [shown]);

  const W = 680, H = 260, padL = 48, padR = 16, padT = 18, padB = 34;
  const n = CURVE.length;
  const ymin = 0.4, ymax = 0.9;
  const x = (i: number) => padL + (i / (n - 1)) * (W - padL - padR);
  const y = (v: number) => padT + (1 - (v - ymin) / (ymax - ymin)) * (H - padT - padB);
  const line = CURVE.map((v, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(' ');
  const hline = (v: number) => `M${padL} ${y(v).toFixed(1)} L${(W - padR).toFixed(1)} ${y(v).toFixed(1)}`;
  // shaded "lift" region: the gain of the learned curve over the best-single baseline
  const area = `${line} L${x(CURVE.length - 1).toFixed(1)} ${y(BEST_SINGLE).toFixed(1)} L${x(0).toFixed(1)} ${y(BEST_SINGLE).toFixed(1)} Z`;
  return (
    <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="convergence curve">
      {/* y grid + labels */}
      {[0.4, 0.5, 0.6, 0.7, 0.8, 0.9].map((g) => (
        <g key={g}>
          <line x1={padL} x2={W - padR} y1={y(g)} y2={y(g)} stroke="#1c1a17" strokeOpacity={0.08} />
          <text x={padL - 8} y={y(g) + 4} textAnchor="end" fontFamily="'JetBrains Mono', monospace" fontSize="11" fill="#1c1a17" fillOpacity={0.5}>{g.toFixed(1)}</text>
        </g>
      ))}
      {/* oracle + best-single reference lines */}
      <path d={hline(ORACLE)} stroke="#8a682c" strokeWidth={1.5} strokeDasharray="3 4" fill="none" />
      <text x={W - padR} y={y(ORACLE) - 6} textAnchor="end" fontFamily="'JetBrains Mono', monospace" fontSize="11" fill="#8a682c">oracle {ORACLE}</text>
      <path d={hline(BEST_SINGLE)} stroke="#1c1a17" strokeOpacity={0.4} strokeWidth={1.5} strokeDasharray="3 4" fill="none" />
      <text x={W - padR} y={y(BEST_SINGLE) - 6} textAnchor="end" fontFamily="'JetBrains Mono', monospace" fontSize="11" fill="#1c1a17" fillOpacity={0.55}>{t({ en: 'best single', zh: '最强单模型' })} {BEST_SINGLE}</text>
      {/* shaded gain over the best single worker (the "+79% lift", made visible) — fades in after the curve draws */}
      <g style={{ opacity: shown ? 1 : 0, transition: 'opacity 0.6s ease 0.85s' }}>
        <path d={area} fill="#8a682c" fillOpacity={0.1} stroke="none" />
        <text x={x(CURVE.length - 1) - 6} y={(y(CURVE[CURVE.length - 1]) + y(BEST_SINGLE)) / 2 + 4} textAnchor="end" fontFamily="'JetBrains Mono', monospace" fontSize="11" fontWeight={700} fill="#8a682c" fillOpacity={0.85}>+{LIFT_MEAN}%</text>
      </g>
      {/* the learned-router curve — draws itself in on scroll-into-view */}
      <path
        d={line}
        stroke="#1c1a17"
        strokeWidth={2.5}
        fill="none"
        pathLength={1}
        style={{
          strokeDasharray: 1,
          strokeDashoffset: shown ? 0 : 1,
          transition: reduced ? 'none' : 'stroke-dashoffset 1.05s cubic-bezier(0.22, 1, 0.36, 1)',
        }}
      />
      {CURVE.map((v, i) =>
        i % 2 === 0 ? (
          <circle
            key={i}
            cx={x(i)}
            cy={y(v)}
            r={2.4}
            fill="#1c1a17"
            style={{
              opacity: shown ? 1 : 0,
              transition: reduced ? 'none' : `opacity 0.3s ease ${0.2 + (i / n) * 0.85}s`,
            }}
          />
        ) : null
      )}
      {/* x label */}
      <text x={(W) / 2} y={H - 6} textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontSize="11" fill="#1c1a17" fillOpacity={0.5}>{t({ en: 'sep-CMA-ES generation', zh: 'sep-CMA-ES 迭代代数' })}</text>
    </svg>
  );
};

const Stat: React.FC<{ value: string; label: LocalizedText; t: (x: LocalizedText) => string; gold?: boolean }> = ({ value, label, t, gold }) => (
  <div className="rounded-2xl border border-ink/10 bg-surface/50 p-5">
    <div className={`font-display text-3xl font-semibold tracking-tight sm:text-4xl ${gold ? 'text-gold' : ''}`}>{value}</div>
    <div className="mt-1 text-xs leading-relaxed text-ink/55">{t(label)}</div>
  </div>
);

const SectionLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="mb-3 font-mono text-[11px] uppercase tracking-[0.22em] text-gold">{children}</div>
);

interface Props { onHome: () => void }

const Fugu: React.FC<Props> = ({ onHome }) => {
  const [lang, setLang] = useState<Lang>(detectInitialLang);
  const s2t = useS2T(lang === 'zhHant');
  const t = (txt: LocalizedText) => (lang === 'en' ? txt.en : lang === 'zhHant' ? (s2t ? s2t(txt.zh) : txt.zh) : txt.zh);
  useEffect(() => {
    if (typeof window !== 'undefined') window.localStorage.setItem(STORAGE_KEY, lang);
  }, [lang]);

  const LANGS: { code: Lang; label: string }[] = [
    { code: 'en', label: 'EN' },
    { code: 'zh', label: '简' },
    { code: 'zhHant', label: '繁' },
  ];

  return (
    <div className="min-h-screen bg-paper font-sans text-ink">
      <header className="sticky top-0 z-40 border-b border-ink/10 bg-paper/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-3 px-5 py-4 sm:px-8">
          <button onClick={onHome} className="font-mono text-xs text-ink/55 transition-colors hover:text-ink">← Da Lei · 大雷</button>
          <div className="flex items-center gap-3">
            <span className="hidden font-mono text-[11px] uppercase tracking-[0.2em] text-gold sm:inline">Research</span>
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

      <main className="mx-auto max-w-4xl px-5 py-10 sm:px-8 sm:py-14">
        {/* Title */}
        <p className="font-mono text-xs uppercase tracking-[0.22em] text-ink/45">{t({ en: 'Paper reproduction', zh: '论文复现' })}</p>
        <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight sm:text-5xl">
          {t({ en: 'Does learned model orchestration ', zh: '「学习式模型编排」' })}
          <span className="text-gradient">{t({ en: 'actually work?', zh: '真的成立吗?' })}</span>
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-ink/65">
          {t({
            en: 'Sakana AI’s Fugu claims a tiny model can route a query across a pool of frontier LLMs and beat any single one of them. I reproduced the core claim from the TRINITY paper (arXiv:2512.04695) and the open-source openfugu reimplementation — entirely on CPU, with only numpy. Here is exactly what I checked and what I measured.',
            zh: 'Sakana AI 的 Fugu 宣称:一个极小的模型可以把一条查询路由到一池前沿大模型里,并打败其中任意单一模型。我从 TRINITY 论文(arXiv:2512.04695)和开源复现 openfugu 出发,把这个核心结论复现了一遍 —— 全程在 CPU、仅用 numpy。下面是我具体验证了什么、量到了什么。',
          })}
        </p>

        {/* TL;DR stat band */}
        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat value={`+${LIFT_MEAN}%`} label={{ en: 'mean lift over the best single worker (8 seeds)', zh: '相比最强单模型的平均提升(8 个种子)' }} t={t} gold />
          <Stat value={`${PCT_ORACLE}%`} label={{ en: 'of the oracle (per-query best) recovered', zh: '逼近 oracle(逐题最优)的程度' }} t={t} />
          <Stat value={`~${GENS_95}`} label={{ en: 'generations to converge (paper says ~5)', zh: '收敛所需代数(论文称 ~5)' }} t={t} />
          <Stat value="6/6" label={{ en: 'control-flow behaviours matched', zh: '控制流行为全部吻合' }} t={t} />
        </div>

        {/* What is Fugu */}
        <section className="mt-14">
          <SectionLabel>{t({ en: '01 · The idea', zh: '01 · 这是什么' })}</SectionLabel>
          <h2 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">{t({ en: 'A 0.6B router, not a 100B model', zh: '一个 0.6B 的路由器,而不是 100B 的大模型' })}</h2>
          <div className="mt-4 space-y-4 text-[15px] leading-relaxed text-ink/70">
            <p>{t({
              en: 'Fugu presents itself as one model behind an OpenAI-compatible endpoint, but internally it is a coordinator that dispatches each query to the best worker in a swappable pool of frontier models. The TRINITY variant is strikingly small: a Qwen3-0.6B backbone produces a hidden state, and a bias-free linear head (~19.5k numbers total, including the SVF adaptation offsets) scores the 7 worker slots and 3 roles. The chosen worker answers. No worker weights are touched.',
              zh: 'Fugu 对外是一个挂在 OpenAI 兼容接口后面的「单模型」,但内部其实是一个协调器:把每条查询派发给一池(可热插拔的)前沿模型中最合适的那个。TRINITY 这一支小得惊人:用 Qwen3-0.6B 主干产生一个隐状态,再用一个无偏置的线性头(连同 SVF 适配偏移量总共约 1.95 万个数)给 7 个工作槽位、3 种角色打分,得分最高的工作模型来回答。不改动任何工作模型的权重。',
            })}</p>
            <p>{t({
              en: 'The two surprises worth testing: (1) the router is trained gradient-free, with sep-CMA-ES over that ~19.5k-vector — no backprop through the backbone; (2) it is supposed to converge in only a handful of generations and still beat the best single model. Those are the two things I reproduced.',
              zh: '两个值得验证的「反直觉」点:(1) 这个路由器是无梯度训练的 —— 用 sep-CMA-ES 在那个约 1.95 万维的向量上搜索,不对主干做反向传播;(2) 它据称只需寥寥数代就能收敛,并且仍然打败最强单模型。这两点正是我复现的对象。',
            })}</p>
          </div>
        </section>

        {/* Part A */}
        <section className="mt-14">
          <SectionLabel>{t({ en: '02 · Check one — the loop', zh: '02 · 检验一 —— 编排循环' })}</SectionLabel>
          <h2 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">{t({ en: 'Driving the real Coordinator with no weights', zh: '不用权重,直接驱动真实的 Coordinator' })}</h2>
          <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-ink/70">
            {t({
              en: 'openfugu’s mini.py imports torch lazily, so I can import the actual Coordinator class and feed it a scripted router (a fixed sequence of decisions) with a mock worker pool. That exercises the genuine step_trinity control flow — role injection, the Thinker override, cold-verifier handling, observation growth, termination — without any model. All six documented behaviours reproduce:',
              zh: 'openfugu 的 mini.py 是惰性导入 torch 的,所以我可以直接 import 真正的 Coordinator 类,喂给它一个脚本化路由器(一串固定决策)和一个 mock 工作池。这样就能在没有任何模型的情况下,跑真实的 step_trinity 控制流 —— 角色注入、Thinker 覆盖、冷 Verifier 处理、观测增长、终止判定。六条有据可查的行为全部复现:',
            })}
          </p>
          <ul className="mt-5 space-y-2">
            {CONTROL_CHECKS.map((c, i) => (
              <li key={i} className="flex items-start gap-3 rounded-xl border border-ink/10 bg-surface/40 px-4 py-3 text-sm leading-relaxed text-ink/75">
                <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent/10 font-mono text-[11px] font-bold text-accent">✓</span>
                {t(c)}
              </li>
            ))}
          </ul>
        </section>

        {/* Part B */}
        <section className="mt-14">
          <SectionLabel>{t({ en: '03 · Check two — the claim', zh: '03 · 检验二 —— 核心结论' })}</SectionLabel>
          <h2 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">{t({ en: 'Can ES learn a router that beats every single worker?', zh: 'ES 能学出一个打败所有单模型的路由器吗?' })}</h2>
          <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-ink/70">
            {t({
              en: 'I built a synthetic but honest test: 7 specialist workers, each strong on 2 of 5 task categories and weak elsewhere, so no single worker dominates. A query carries a hidden vector; a linear router (worker × hidden) picks a worker by argmax. I train that router with a from-scratch sep-CMA-ES — the same gradient-free optimizer family the paper uses — to maximise reward on a held-out set, then compare against the baselines.',
              zh: '我搭了一个合成但不偷工的测试:7 个专家模型,每个只在 5 类任务里的 2 类上强、其余弱,所以没有任何单一模型能通吃。每条查询带一个隐向量;线性路由器(工作模型 × 隐维度)用 argmax 选模型。我用自己从零实现的 sep-CMA-ES —— 与论文同族的无梯度优化器 —— 在留出集上训练这个路由器最大化奖励,再与各基线对比。',
            })}
          </p>

          <div className="mt-6 rounded-2xl border border-ink/10 bg-surface/40 p-5 sm:p-6">
            <ConvergenceChart t={t} />
          </div>

          {/* results table */}
          <div className="mt-6 overflow-hidden rounded-2xl border border-ink/10">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-ink/[0.04] text-left font-mono text-[11px] uppercase tracking-wider text-ink/55">
                  <th className="px-4 py-3 font-medium">{t({ en: 'Strategy', zh: '策略' })}</th>
                  <th className="px-4 py-3 text-right font-medium">{t({ en: 'Mean reward', zh: '平均奖励' })}</th>
                  <th className="px-4 py-3 text-right font-medium">{t({ en: 'vs best single', zh: '相对最强单模型' })}</th>
                </tr>
              </thead>
              <tbody className="font-mono text-[13px]">
                <tr className="border-t border-ink/8">
                  <td className="px-4 py-3 text-ink/70">{t({ en: 'Random routing', zh: '随机路由' })}</td>
                  <td className="px-4 py-3 text-right text-ink/70">{RANDOM}</td>
                  <td className="px-4 py-3 text-right text-ember">−11%</td>
                </tr>
                <tr className="border-t border-ink/8">
                  <td className="px-4 py-3 text-ink/70">{t({ en: 'Best single worker', zh: '最强单模型(固定)' })}</td>
                  <td className="px-4 py-3 text-right text-ink/70">{BEST_SINGLE}</td>
                  <td className="px-4 py-3 text-right text-ink/45">—</td>
                </tr>
                <tr className="border-t border-ink/8 bg-gold/[0.06]">
                  <td className="px-4 py-3 font-semibold text-ink">{t({ en: 'Learned router (sep-CMA-ES)', zh: '学习的路由器(sep-CMA-ES)' })}</td>
                  <td className="px-4 py-3 text-right font-semibold text-ink">{LEARNED}</td>
                  <td className="px-4 py-3 text-right font-semibold text-gold">+{LIFT_MEAN}%</td>
                </tr>
                <tr className="border-t border-ink/8">
                  <td className="px-4 py-3 text-ink/70">{t({ en: 'Oracle (per-query best)', zh: 'Oracle(逐题最优,上限)' })}</td>
                  <td className="px-4 py-3 text-right text-ink/70">{ORACLE}</td>
                  <td className="px-4 py-3 text-right text-accent">+79%</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs leading-relaxed text-ink/50">
            {t({
              en: `Across ${SEEDS} random seeds the learned router lifts the best single worker by +${LIFT_MEAN}% on average (range +${LIFT_MIN}% … +${LIFT_MAX}%), recovering ${PCT_ORACLE}% of the oracle and converging within ~${GENS_95} generations — directly corroborating the paper’s “converges in a few generations” and “beats the best single model” claims, in a controlled setting.`,
              zh: `在 ${SEEDS} 个随机种子下,学习的路由器平均把最强单模型抬高 +${LIFT_MEAN}%(区间 +${LIFT_MIN}% … +${LIFT_MAX}%),逼近 oracle 的 ${PCT_ORACLE}%,约 ${GENS_95} 代收敛 —— 在受控设定下,直接印证了论文「数代即收敛」「打败最强单模型」的说法。`,
            })}
          </p>
        </section>

        {/* Honest scope */}
        <section className="mt-14">
          <SectionLabel>{t({ en: '04 · Honest scope', zh: '04 · 诚实的边界' })}</SectionLabel>
          <h2 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">{t({ en: 'What this is — and isn’t', zh: '这是什么、不是什么' })}</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-accent/20 bg-accent/[0.04] p-5">
              <div className="font-mono text-[11px] uppercase tracking-wider text-accent">{t({ en: 'Reproduced', zh: '已复现' })}</div>
              <ul className="mt-3 space-y-2 text-sm leading-relaxed text-ink/70">
                <li>{t({ en: 'The orchestration control flow, against the real Coordinator code', zh: '编排控制流 —— 针对真实 Coordinator 代码' })}</li>
                <li>{t({ en: 'The “ES learns a router that beats the best single model” mechanism', zh: '「ES 学出打败最强单模型的路由器」这一机制' })}</li>
                <li>{t({ en: 'The few-generations convergence behaviour', zh: '数代即收敛的行为' })}</li>
              </ul>
            </div>
            <div className="rounded-2xl border border-ember/25 bg-ember/[0.05] p-5">
              <div className="font-mono text-[11px] uppercase tracking-wider text-ember">{t({ en: 'Not done here', zh: '尚未做' })}</div>
              <ul className="mt-3 space-y-2 text-sm leading-relaxed text-ink/70">
                <li>{t({ en: 'Running the real Qwen3-0.6B + model_iter_60.npy checkpoint (needs GPU + the released weights)', zh: '跑真实的 Qwen3-0.6B + model_iter_60.npy 检查点(需要 GPU 与已发布权重)' })}</li>
                <li>{t({ en: 'SWE-Bench / TerminalBench numbers — those need a live frontier-model pool (API keys)', zh: 'SWE-Bench / TerminalBench 跑分 —— 需要真实的前沿模型池(API Key)' })}</li>
                <li>{t({ en: 'The 7B Conductor / Fugu-Ultra DAG variant', zh: '7B Conductor / Fugu-Ultra 的 DAG 变体' })}</li>
              </ul>
            </div>
          </div>
          <p className="mt-4 text-xs leading-relaxed text-ink/50">
            {t({
              en: 'The synthetic pool is a deliberate simplification — it isolates the routing mechanism from the noise of real model quality. It shows the mechanism is sound; it does not claim the production +107% number. No API keys, weights, or private data are used or committed.',
              zh: '合成模型池是有意的简化 —— 把「路由机制」从「真实模型质量的噪声」中剥离出来。它证明机制成立,但不主张生产环境那个 +107% 的具体数字。全程不使用、也不上传任何 API Key、权重或隐私数据。',
            })}
          </p>
        </section>

        {/* Reproduce */}
        <section className="mt-14">
          <SectionLabel>{t({ en: '05 · Reproduce it', zh: '05 · 自己复现' })}</SectionLabel>
          <h2 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">{t({ en: 'One file, numpy only', zh: '一个文件,只需 numpy' })}</h2>
          <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-ink/70">
            {t({ en: 'The full harness lives in the repo at research/fugu/. Runs in seconds on a laptop:', zh: '完整脚本在仓库 research/fugu/ 下,笔记本上几秒跑完:' })}
          </p>
          <pre className="mt-4 overflow-x-auto rounded-2xl border border-ink/12 bg-ink p-5 font-mono text-[13px] leading-relaxed text-paper/90">
{`pip install numpy
python research/fugu/validate.py

# [PART B] learned router (ES) : 0.874
#          => lift over best single worker: +78.8%
#          => 99.9% of oracle
# [multi-seed x8] lift +79.0% (range +55.8…+92.2%), ~2 gens to converge

# opt-in: also run the control-flow check against the real Coordinator
python research/fugu/validate.py --mini /path/to/openfugu/mini.py
# [PART A] control-flow validation … 6/6 checks passed`}
          </pre>
        </section>

        {/* References */}
        <section className="mt-14 border-t border-ink/10 pt-8">
          <SectionLabel>{t({ en: 'References', zh: '参考' })}</SectionLabel>
          <div className="flex flex-wrap gap-x-6 gap-y-2 font-mono text-[13px]">
            <a className="text-gold hover:underline" href="https://sakana.ai/fugu/" target="_blank" rel="noreferrer">Sakana Fugu ↗</a>
            <a className="text-gold hover:underline" href="https://github.com/trotsky1997/openfugu" target="_blank" rel="noreferrer">github.com/trotsky1997/openfugu ↗</a>
            <a className="text-gold hover:underline" href="https://arxiv.org/abs/2512.04695" target="_blank" rel="noreferrer">TRINITY (arXiv:2512.04695) ↗</a>
          </div>
          <p className="mt-6 text-xs leading-relaxed text-ink/45">
            {t({
              en: 'Independent reproduction by 大雷. Not affiliated with Sakana AI. openfugu is an independent open-source reimplementation (Apache-2.0); this page only reuses its mini.py Coordinator for the control-flow check and re-implements the optimizer from scratch.',
              zh: '由大雷独立复现,与 Sakana AI 无隶属关系。openfugu 是独立的开源复现(Apache-2.0);本页仅复用其 mini.py 的 Coordinator 做控制流检验,优化器为从零重写。',
            })}
          </p>
        </section>
      </main>
    </div>
  );
};

export default Fugu;
