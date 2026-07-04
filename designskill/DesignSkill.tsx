import React, { useEffect, useState } from 'react';

/* ---------------------------------------------------------------------------
 * /designskill — a curated field note on 乔木 (Qiaomu, @vista8)'s "Design Skill
 * Comparison Lab" (designskill.qiaomu.ai): install 5 frontend-design Claude
 * Skills + a no-skill control, give all six the same 7 tasks under the same
 * constraints, and read the 42 generated pages side by side. This is my
 * bilingual summary of his results — full experiment & the 42 live pages are
 * on his site; go read the original. Native + bilingual (繁 on the fly).
 * ------------------------------------------------------------------------- */

type Lang = 'en' | 'zh' | 'zhHant';
interface LocalizedText { en: string; zh: string }

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
    if (!active || _s2t) { if (_s2t && !conv) setConv(() => _s2t); return; }
    let alive = true;
    import('opencc-js').then((m) => { _s2t = (m as any).Converter({ from: 'cn', to: 'tw' }); if (alive) setConv(() => _s2t); }).catch(() => {});
    return () => { alive = false; };
  }, [active, conv]);
  return conv;
};

interface Variant {
  key: string;
  accent: string;
  verdict: LocalizedText;
  strength: LocalizedText;
  weakness: LocalizedText;
  bestFor: LocalizedText;
  crown?: boolean; // overall visual leader
}

const VARIANTS: Variant[] = [
  {
    key: 'baseline', accent: '#8a8175',
    verdict: { en: 'No skill · competent but predictable', zh: '无 Skill · 能打,但可预测' },
    strength: { en: 'Solid fundamentals, clean execution.', zh: '基本功扎实,执行干净。' },
    weakness: { en: 'Falls back to the "AI aesthetic": purple, Inter, centered.', zh: '默认回落到「AI 味」:紫色、Inter、居中。' },
    bestFor: { en: 'The control group — the baseline everything else is measured against.', zh: '对照组 —— 所有对比的基准线。' },
  },
  {
    key: 'frontend-design', accent: '#8a682c', crown: true,
    verdict: { en: 'Visual leader · 断层领先', zh: '视觉王者 · 断层领先' },
    strength: { en: 'Dominates creativity & diversity; bold art direction — its landing page came out in an ebony-gold editorial style.', zh: '创意与多样性断层领先;敢下手的美术方向 —— 落地页做成了「墨黑金编辑风」。' },
    weakness: { en: 'Styling can drift between pages.', zh: '跨页面风格有时会飘。' },
    bestFor: { en: 'Maximum visual impact and open, creative briefs.', zh: '追求最大视觉冲击、开放创意命题。' },
  },
  {
    key: 'web-design-guidelines', accent: '#3a7a7a',
    verdict: { en: 'Production gold standard', zh: '生产级黄金标准' },
    strength: { en: 'Accessibility, focus management, ARIA semantics; verification-ready code (skip-links, tabular-nums, reduced-motion).', zh: '无障碍、焦点管理、aria 语义;经得起审查的代码(skip-link、tabular-nums、reduced-motion)。' },
    weakness: { en: 'Less visual punch than frontend-design.', zh: '视觉冲击不如 frontend-design。' },
    bestFor: { en: 'Anything shipping to production — a mandatory baseline.', zh: '一切要上生产的东西 —— 必备底座。' },
  },
  {
    key: 'ui-ux-pro-max', accent: '#4285f4',
    verdict: { en: 'Stable scaling', zh: '稳定可扩展' },
    strength: { en: 'Traceable UX principles; 161 color combos & 57 font pairings you can search.', zh: '可追溯的 UX 原则;161 组配色、57 组字体搭配可检索。' },
    weakness: { en: 'Lower ceiling than the freeform approaches.', zh: '上限低于自由发挥流。' },
    bestFor: { en: 'Team scaling — consistency across many hands.', zh: '团队规模化 —— 多人协作的一致性。' },
  },
  {
    key: 'taste-skill', accent: '#7a5cab',
    verdict: { en: 'Disciplined boldness · 纪律性最强', zh: '有纪律的大胆 · 纪律性最强' },
    strength: { en: 'Adaptive risk calibration; avoids template patterns while staying tasteful.', zh: '自适应地拿捏冒险尺度;避开模板套路,又不失分寸。' },
    weakness: { en: 'Visual distinctiveness only moderate.', zh: '视觉辨识度中等。' },
    bestFor: { en: 'Bold-but-safe work; a close second on visual impact.', zh: '要大胆又不翻车;视觉冲击紧随其后。' },
  },
  {
    key: 'emil-design-eng', accent: '#c1614e',
    verdict: { en: 'Interaction specialist', zh: '交互专家' },
    strength: { en: 'Motion craft: consistent cubic-bezier, 50–70ms stagger, tactile :active feedback.', zh: '动效手艺:统一的 cubic-bezier、50–70ms 错峰、有触感的 :active 反馈。' },
    weakness: { en: 'Static layouts look unremarkable — its value hides in interaction.', zh: '静态截图平平无奇 —— 价值藏在交互里。' },
    bestFor: { en: 'Interaction quality; combine it with a visual skill.', zh: '交互质感;与视觉类 Skill 组合使用。' },
  },
];

interface Task { id: string; name: LocalizedText; dim: LocalizedText; winner: LocalizedText; note: LocalizedText }
const TASKS: Task[] = [
  { id: 'A', name: { en: 'Landing page', zh: '落地页' }, dim: { en: 'Visual', zh: '视觉' }, winner: { en: 'frontend-design', zh: 'frontend-design' }, note: { en: 'Ebony-gold editorial look', zh: '墨黑金编辑风' } },
  { id: 'B', name: { en: 'Dashboard', zh: '仪表盘' }, dim: { en: 'Visual', zh: '视觉' }, winner: { en: 'taste-skill / web-design-guidelines', zh: 'taste-skill / web-design-guidelines' }, note: { en: 'High-density vs. data typography (tie)', zh: '高密度 vs 数据排版(并列)' } },
  { id: 'C', name: { en: 'Portfolio', zh: '作品集' }, dim: { en: 'Visual', zh: '视觉' }, winner: { en: 'frontend-design / taste-skill', zh: 'frontend-design / taste-skill' }, note: { en: 'Constructivism & asymmetric grids (tie)', zh: '构成主义 & 非对称网格(并列)' } },
  { id: 'D', name: { en: 'Interactive wizard', zh: '交互向导' }, dim: { en: 'Interaction', zh: '交互' }, winner: { en: 'web-design-guidelines / ui-ux-pro-max / emil-design-eng', zh: 'web-design-guidelines / ui-ux-pro-max / emil-design-eng' }, note: { en: 'Semantics · flow · tactile feedback (triple tie)', zh: '语义 · 流程 · 触感反馈(三方并列)' } },
  { id: 'E', name: { en: 'Component panel', zh: '组件面板' }, dim: { en: 'Components', zh: '组件' }, winner: { en: 'web-design-guidelines', zh: 'web-design-guidelines' }, note: { en: 'Complete accessibility semantics', zh: '完整的无障碍语义' } },
  { id: 'F', name: { en: '404 page', zh: '404 页' }, dim: { en: 'Creativity', zh: '创意' }, winner: { en: 'frontend-design', zh: 'frontend-design' }, note: { en: 'Only one considering user recovery paths', zh: '唯一考虑「用户如何找回路径」的方案' } },
  { id: 'G', name: { en: 'Multi-variant challenge', zh: '多变体挑战' }, dim: { en: 'Diversity', zh: '多样性' }, winner: { en: 'frontend-design / taste-skill', zh: 'frontend-design / taste-skill' }, note: { en: 'Orthogonal font/color/control systems (tie)', zh: '正交的字体/配色/控件系统(并列)' } },
];

const FINDINGS: { n: string; title: LocalizedText; body: LocalizedText }[] = [
  {
    n: '01',
    title: { en: 'Prohibition beats prescription', zh: '禁令胜过示范' },
    body: {
      en: 'The headline finding: a Skill’s primary function is prohibition, not teaching. “Negative rules break the model’s statistical inertia better than positive examples” — the best skills work by disabling AI defaults (purple gradients, centered layouts, “revolutionary” rhetoric), not by adding new tricks.',
      zh: '核心结论:Skill 的主要作用是「禁止」,而不是「教」。「禁令比正面示范更能打破模型的统计惯性」—— 最好的 Skill 靠的是关掉 AI 默认套路(紫色渐变、居中布局、「革命性」话术),而不是教新花招。',
    },
  },
  {
    n: '02',
    title: { en: 'Screenshot wins vs. audit wins', zh: '截图赢 vs 审查赢' },
    body: {
      en: 'frontend-design wins the screenshot; web-design-guidelines wins the code inspection (skip-links, tabular-nums, reduced-motion). Judging by picture alone systematically undervalues the production-grade skill.',
      zh: 'frontend-design 赢在截图;web-design-guidelines 赢在看代码(skip-link、tabular-nums、reduced-motion)。只看图,会系统性低估「生产级」那一档。',
    },
  },
  {
    n: '03',
    title: { en: 'Motion lives beyond the screenshot', zh: '动效活在截图之外' },
    body: {
      en: 'emil-design-eng’s value (0.95 scale-in entries, :active press feedback) only shows up when you actually interact — a static grid comparison can’t see it. Some quality is invisible to a picture.',
      zh: 'emil-design-eng 的价值(0.95 缩放入场、:active 按压反馈)只有真正上手交互才看得到 —— 静态截图对比根本看不见。有些质感,图片是拍不出来的。',
    },
  },
  {
    n: '04',
    title: { en: 'Open briefs expose the boldness gap', zh: '开放命题暴露「大胆」的差距' },
    body: {
      en: 'The 404 task (Task F) is where the gap opened widest: frontend-design reached for a real idea while the baseline retreated to a comfortable “dark & cool” default. The more open the brief, the more a skill’s ceiling shows.',
      zh: '404 这道题(Task F)把差距拉到最大:frontend-design 敢往一个真正的点子上走,而 baseline 退回到舒适的「暗黑高级感」默认。命题越开放,越能看出 Skill 的上限。',
    },
  },
];

const GUIDE: { need: LocalizedText; pick: LocalizedText }[] = [
  { need: { en: 'Maximum visual impact', zh: '要最大视觉冲击' }, pick: { en: 'frontend-design or taste-skill', zh: 'frontend-design 或 taste-skill' } },
  { need: { en: 'Shipping to production', zh: '要上生产' }, pick: { en: 'web-design-guidelines (mandatory baseline)', zh: 'web-design-guidelines(必备底座)' } },
  { need: { en: 'Scaling across a team', zh: '团队规模化' }, pick: { en: 'ui-ux-pro-max', zh: 'ui-ux-pro-max' } },
  { need: { en: 'Interaction quality', zh: '要交互质感' }, pick: { en: 'emil-design-eng (combine with a visual skill)', zh: 'emil-design-eng(与视觉 Skill 组合)' } },
];

interface Props { onHome: () => void }

const DesignSkill: React.FC<Props> = ({ onHome }) => {
  const [lang, setLang] = useState<Lang>(detectInitialLang);
  const s2t = useS2T(lang === 'zhHant');
  const t = (txt: LocalizedText) => (lang === 'en' ? txt.en : lang === 'zhHant' ? (s2t ? s2t(txt.zh) : txt.zh) : txt.zh);
  useEffect(() => { if (typeof window !== 'undefined') window.localStorage.setItem(STORAGE_KEY, lang); }, [lang]);

  const LANGS: { code: Lang; label: string }[] = [{ code: 'en', label: 'EN' }, { code: 'zh', label: '简' }, { code: 'zhHant', label: '繁' }];

  return (
    <div className="min-h-screen bg-paper font-sans text-ink">
      <header className="sticky top-0 z-40 border-b border-ink/10 bg-paper/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-5 py-4 sm:px-8">
          <button onClick={onHome} className="font-mono text-xs text-ink/55 transition-colors hover:text-ink">← Da Lei · 大雷</button>
          <div className="flex items-center gap-3">
            <span className="hidden font-mono text-[11px] uppercase tracking-[0.2em] text-gold sm:inline">Design Skill Lab</span>
            <div className="flex overflow-hidden rounded-full border border-ink/15">
              {LANGS.map((l) => (
                <button key={l.code} onClick={() => setLang(l.code)}
                  className={`px-2.5 py-1 font-mono text-[11px] transition-colors ${lang === l.code ? 'bg-ink text-paper' : 'text-ink/55 hover:text-ink'}`}>{l.label}</button>
              ))}
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-5 py-10 sm:px-8 sm:py-14">
        <p className="font-mono text-xs uppercase tracking-[0.22em] text-ink/45">{t({ en: 'Field note · design skills', zh: '实测笔记 · 设计 Skill' })}</p>
        <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight sm:text-5xl">
          {t({ en: 'Does a design Skill actually help?', zh: '一个设计 Skill,到底有没有用?' })}
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-ink/65">
          {t({
            en: '乔木 (Qiaomu) ran a clean experiment: install five frontend-design Claude Skills plus a no-skill control, give all six the same 7 tasks under identical constraints (one HTML file, Google Fonts only, no external images), and read the 42 generated pages side by side — real products, unretouched. This is my summary of what came out.',
            zh: '乔木做了个干净的实验:装上五个前端设计类 Claude Skill,再加一个「不装 Skill」的对照组,让六方在完全相同的约束下(单个 HTML、只用 Google Fonts、不用外部图片)做同样的 7 道题,再把 42 个生成页面并排看 —— 都是未修的真实产物。这是我对结果的梳理。',
          })}
        </p>

        {/* attribution — prominent, up top */}
        <div className="mt-6 rounded-2xl border border-gold/25 bg-gold/[0.05] px-5 py-4">
          <p className="text-sm leading-relaxed text-ink/70">
            {t({
              en: 'This is a curated summary of someone else’s experiment. Full write-up, the 42 live interactive pages, and the scoring are on 乔木’s site — go see the real thing.',
              zh: '这是对别人实验的二次梳理。完整报告、42 个可交互的真实页面、评分细节都在乔木的站上 —— 一定去看原版。',
            })}
          </p>
          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 font-mono text-[13px]">
            <a className="text-gold hover:underline" href="https://designskill.qiaomu.ai/" target="_blank" rel="noreferrer">designskill.qiaomu.ai ↗</a>
            <a className="text-gold hover:underline" href="https://x.com/vista8" target="_blank" rel="noreferrer">@vista8 ↗</a>
            <a className="text-gold hover:underline" href="https://github.com/joeseesun/" target="_blank" rel="noreferrer">github/joeseesun ↗</a>
          </div>
        </div>

        {/* setup stat strip */}
        <dl className="mt-8 grid grid-cols-3 gap-px overflow-hidden rounded-2xl border border-ink/10 bg-ink/10">
          {[
            { v: '6', l: { en: 'variants (5 skills + control)', zh: '个变体(5 Skill + 对照)' } as LocalizedText },
            { v: '7', l: { en: 'identical tasks', zh: '道相同任务' } as LocalizedText },
            { v: '42', l: { en: 'pages generated', zh: '个生成页面' } as LocalizedText },
          ].map((s, i) => (
            <div key={i} className="bg-surface/60 px-4 py-5 backdrop-blur-sm sm:px-6">
              <dt className="font-display text-3xl font-semibold leading-none tracking-tight sm:text-4xl">{s.v}</dt>
              <dd className="mt-2 font-mono text-[10.5px] uppercase leading-tight tracking-wider text-ink/45">{t(s.l)}</dd>
            </div>
          ))}
        </dl>

        {/* headline finding */}
        <section className="mt-10 overflow-hidden rounded-3xl border border-ink/15 bg-ink text-paper">
          <div className="p-7 sm:p-9">
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-gold">{t({ en: 'The one takeaway', zh: '一句话结论' })}</p>
            <h2 className="mt-3 font-display text-2xl font-semibold leading-snug tracking-tight sm:text-3xl">
              {t({ en: 'A Skill’s job is prohibition, not teaching.', zh: 'Skill 的作用是「禁止」,不是「教」。' })}
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-paper/70">
              {t({
                en: '“Negative rules break the model’s statistical inertia better than positive examples.” The skills that won did it by banning AI defaults — purple gradients, centered compositions, “revolutionary” copy — not by adding cleverness.',
                zh: '「禁令比正面示范更能打破模型的统计惯性。」赢的那些 Skill,靠的是禁掉 AI 默认套路 —— 紫色渐变、居中构图、「革命性」文案 —— 而不是加花招。',
              })}
            </p>
          </div>
        </section>

        {/* the six variants */}
        <h2 className="mt-12 font-display text-2xl font-semibold tracking-tight sm:text-3xl">{t({ en: 'The six variants', zh: '六个变体' })}</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {VARIANTS.map((v) => (
            <div key={v.key} className="flex flex-col rounded-2xl border border-ink/10 bg-surface/40 p-5" style={{ borderTop: `3px solid ${v.accent}` }}>
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-mono text-sm font-semibold text-ink">{v.key}</h3>
                {v.crown && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-gold/40 bg-gold/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-gold">★ {t({ en: 'top visual', zh: '视觉第一' })}</span>
                )}
              </div>
              <p className="mt-1.5 text-sm font-medium" style={{ color: v.accent }}>{t(v.verdict)}</p>
              <div className="mt-3 space-y-2 text-[13px] leading-relaxed">
                <p className="text-ink/70"><span className="font-mono text-[11px] text-emerald-700/70">+ </span>{t(v.strength)}</p>
                <p className="text-ink/55"><span className="font-mono text-[11px] text-ink/40">− </span>{t(v.weakness)}</p>
              </div>
              <p className="mt-3 border-t border-ink/10 pt-2.5 text-[12px] leading-relaxed text-ink/50">
                <span className="font-mono text-[10px] uppercase tracking-wider text-gold">{t({ en: 'best for', zh: '适合' })} · </span>{t(v.bestFor)}
              </p>
            </div>
          ))}
        </div>

        {/* winner by task */}
        <h2 className="mt-12 font-display text-2xl font-semibold tracking-tight sm:text-3xl">{t({ en: 'Winner by task', zh: '每道题谁赢' })}</h2>
        <div className="mt-5 overflow-hidden rounded-2xl border border-ink/10">
          <div className="hidden bg-ink/[0.04] px-5 py-2.5 font-mono text-[11px] uppercase tracking-wider text-ink/45 sm:grid sm:grid-cols-[auto_1.4fr_2fr] sm:gap-4">
            <span>#</span><span>{t({ en: 'Task', zh: '任务' })}</span><span>{t({ en: 'Winner', zh: '赢家' })}</span>
          </div>
          {TASKS.map((task) => (
            <div key={task.id} className="grid gap-1 border-t border-ink/10 bg-surface/30 px-5 py-3.5 first:border-t-0 sm:grid-cols-[auto_1.4fr_2fr] sm:items-baseline sm:gap-4">
              <span className="font-display text-lg font-bold text-gold sm:text-base">{task.id}</span>
              <span className="font-medium text-ink/80">{t(task.name)} <span className="font-mono text-[10px] uppercase tracking-wider text-ink/40">{t(task.dim)}</span></span>
              <span className="text-[13px] text-ink/65">
                <span className="font-mono text-[12px] text-ink/80">{t(task.winner)}</span>
                <span className="mt-0.5 block text-ink/45">{t(task.note)}</span>
              </span>
            </div>
          ))}
        </div>

        {/* deeper findings */}
        <h2 className="mt-12 font-display text-2xl font-semibold tracking-tight sm:text-3xl">{t({ en: 'Four findings worth keeping', zh: '四条值得记住的发现' })}</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {FINDINGS.map((f) => (
            <div key={f.n} className="rounded-2xl border border-ink/10 bg-surface/40 p-5">
              <span className="font-mono text-xs text-gold">{f.n}</span>
              <h3 className="mt-2 font-display text-lg font-semibold tracking-tight">{t(f.title)}</h3>
              <p className="mt-2 text-[13px] leading-relaxed text-ink/60">{t(f.body)}</p>
            </div>
          ))}
        </div>

        {/* selection guide */}
        <h2 className="mt-12 font-display text-2xl font-semibold tracking-tight sm:text-3xl">{t({ en: 'Which one should you install?', zh: '你该装哪个?' })}</h2>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {GUIDE.map((g, i) => (
            <div key={i} className="flex flex-col gap-1 rounded-xl border border-ink/10 bg-surface/40 p-4">
              <span className="text-sm font-medium text-ink/80">{t(g.need)}</span>
              <span className="font-mono text-[13px] text-gold">→ {t(g.pick)}</span>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-ink/10 pt-8 font-mono text-[13px]">
          <a className="text-gold hover:underline" href="https://designskill.qiaomu.ai/" target="_blank" rel="noreferrer">{t({ en: 'Read the full experiment (42 live pages) ↗', zh: '看完整实验(42 个真实页面)↗' })}</a>
          <a className="text-gold hover:underline" href="https://skills.sh" target="_blank" rel="noreferrer">skills.sh ↗</a>
          <a className="text-gold hover:underline" href="https://skillsmp.com/zh" target="_blank" rel="noreferrer">skillsmp.com ↗</a>
        </div>
        <p className="mt-5 text-xs leading-relaxed text-ink/45">
          {t({
            en: 'Experiment, scoring and the 42 generated pages by 乔木 (Qiaomu, @vista8). This page is my condensed, bilingual read of his results — not a substitute for the original, and all credit is his. Numbers and verdicts summarized as of July 2026.',
            zh: '实验、评分与 42 个生成页面均出自乔木(@vista8)。本页是我对他结果的浓缩双语解读 —— 替代不了原文,功劳都是他的。结论与数据截至 2026 年 7 月。',
          })}
        </p>
      </main>
    </div>
  );
};

export default DesignSkill;
