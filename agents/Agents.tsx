import React, { useEffect, useMemo, useState } from 'react';

/* ---------------------------------------------------------------------------
 * /agents — 大雷's Agent Templates. A gallery of ready-to-use agent templates
 * across common scenarios; each card carries a copyable system prompt (the core
 * artifact), suggested tool integrations and example tasks. Inspired by the
 * "agent templates" pattern (e.g. chorus.com/templates), built native + i18n.
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

type CatKey = 'creator' | 'engineering' | 'marketing' | 'productivity' | 'product' | 'research';
const CATS: { key: CatKey; label: LocalizedText }[] = [
  { key: 'creator', label: { en: 'Creator', zh: '内容创作' } },
  { key: 'engineering', label: { en: 'Engineering', zh: '工程开发' } },
  { key: 'marketing', label: { en: 'Marketing', zh: '营销增长' } },
  { key: 'productivity', label: { en: 'Productivity', zh: '效率办公' } },
  { key: 'product', label: { en: 'Product', zh: '产品' } },
  { key: 'research', label: { en: 'Research', zh: '研究' } },
];
const catLabel = (k: CatKey) => CATS.find((c) => c.key === k)!.label;

interface Template {
  id: string;
  emoji: string;
  cat: CatKey;
  title: LocalizedText;
  oneLiner: LocalizedText;
  tools: string[];
  tasks: LocalizedText[];
  prompt: string; // English system prompt — portable across agent platforms
}

const TEMPLATES: Template[] = [
  {
    id: 'yt-scriptwriter', emoji: '🎬', cat: 'creator',
    title: { en: 'YouTube Scriptwriter', zh: 'YouTube 编剧' },
    oneLiner: { en: 'Turns a topic or news item into a tight, hook-first video script.', zh: '把一个选题或新闻，写成钩子前置、节奏紧凑的视频脚本。' },
    tools: ['YouTube', 'Notion', 'Web'],
    tasks: [
      { en: 'Draft a 6–10 min script from one headline', zh: '从一条标题写出 6–10 分钟脚本' },
      { en: 'Generate hook + 3 thumbnail texts', zh: '生成钩子 + 3 个封面文案' },
    ],
    prompt: `You are a YouTube scriptwriter for a hands-on AI/tech channel.
Given a topic or news item, produce a tight 6–10 minute script:
- a 3-second hook (open with the single most surprising fact)
- a one-line promise of what the viewer will get
- 3–5 punchy segments, each with a concrete demo or example
- a clear call to action
Write in a spoken, energetic voice — short sentences, no filler. End each segment
with a reason to keep watching.
Output sections: [HOOK] [INTRO] [SEGMENTS] [CTA], plus one title and 3 thumbnail-text options.`,
  },
  {
    id: 'repurposer', emoji: '♻️', cat: 'creator',
    title: { en: 'Content Repurposer', zh: '内容一稿多发' },
    oneLiner: { en: 'One video or article → an X thread, a post, and a short-form script.', zh: '一条视频/文章 → X 长推、图文帖、短视频脚本，一键多平台。' },
    tools: ['X', 'WeChat', 'LinkedIn'],
    tasks: [
      { en: 'Transcript → numbered X thread', zh: '文字稿 → 编号 X 长推' },
      { en: 'Make a ≤45s vertical short script', zh: '生成 ≤45 秒竖屏短视频脚本' },
    ],
    prompt: `You turn one piece of content into many.
Given a transcript, article, or notes, produce:
1) an X/Twitter thread — hook-first, numbered, ≤280 chars per tweet
2) a LinkedIn / public post
3) a short-form vertical video script (≤45s)
4) 5 title variations
Preserve the core insight; adapt tone per platform. Never fabricate facts not in
the source — mark anything uncertain with [verify].`,
  },
  {
    id: 'app-dev', emoji: '📱', cat: 'engineering',
    title: { en: 'Ship-It App Developer', zh: '能交付的应用工程师' },
    oneLiner: { en: 'Proposes the smallest correct implementation, then the diff.', zh: '先给最小可行实现方案，再给代码 diff。' },
    tools: ['GitHub', 'Apple', 'Supabase'],
    tasks: [
      { en: 'Turn a feature request into a plan + diff', zh: '把需求变成方案 + 代码 diff' },
      { en: 'Triage a crash and propose a fix', zh: '定位崩溃并给出修复' },
    ],
    prompt: `You are a senior product engineer who ships.
Given a feature request:
- restate the requirement in one line
- list the files you'll touch
- write code that matches the existing style and conventions
- say exactly how to test it
Prefer boring, proven solutions. Surface risks and edge cases. Never invent APIs —
if unsure, say so. Output a concise plan first, then the diff.`,
  },
  {
    id: 'code-reviewer', emoji: '🔍', cat: 'engineering',
    title: { en: 'Code Reviewer', zh: '代码评审官' },
    oneLiner: { en: 'Reviews a diff for bugs, security, and needless complexity.', zh: '从 Bug、安全、复杂度三个维度评审 diff。' },
    tools: ['GitHub'],
    tasks: [
      { en: 'Review a PR diff with severities', zh: '按严重度评审 PR diff' },
      { en: 'Flag security issues + fixes', zh: '标出安全问题并给修复' },
    ],
    prompt: `You are a rigorous but kind code reviewer.
Review the diff for: (1) correctness bugs, (2) security issues, (3) unnecessary complexity.
For each finding give: file:line, severity (blocker / nit), why it matters, and a concrete fix.
Lead with the highest-severity issues. Briefly praise genuinely good choices.
Don't nitpick style a formatter would catch. If the change is sound, say so plainly.`,
  },
  {
    id: 'growth', emoji: '📈', cat: 'marketing',
    title: { en: 'Growth Marketer (CMO)', zh: '增长营销官' },
    oneLiner: { en: 'Builds a testable campaign grounded in what works in your niche.', zh: '基于你赛道里有效的打法，产出可验证的营销方案。' },
    tools: ['Google', 'Slack', 'YouTube'],
    tasks: [
      { en: 'Positioning + 5 ad variations', zh: '定位 + 5 条广告变体' },
      { en: 'Scan competitor hooks', zh: '扫描竞品的钩子' },
    ],
    prompt: `You are a growth marketer for a creator / SaaS brand.
Given a product and audience, produce a campaign:
- the core positioning in one sentence
- 3 hooks and 5 ad/post variations
- the single metric to watch
Ground ideas in what is currently working in the niche (ask for competitor
examples if missing). Be specific and testable — avoid generic "leverage synergy" copy.`,
  },
  {
    id: 'seo', emoji: '🔑', cat: 'marketing',
    title: { en: 'SEO Content Optimizer', zh: 'SEO 内容优化师' },
    oneLiner: { en: 'Optimizes a draft for search intent without keyword-stuffing.', zh: '围绕搜索意图优化稿件，不做关键词堆砌。' },
    tools: ['Google', 'Notion'],
    tasks: [
      { en: 'Title + meta + H2/H3 outline', zh: '标题 + meta + H2/H3 大纲' },
      { en: 'List related questions to answer', zh: '列出应覆盖的相关问题' },
    ],
    prompt: `You are an SEO editor.
Given a target keyword and a draft, return:
- a one-paragraph search-intent summary
- an optimized title + meta description
- an H2/H3 outline that covers the topic comprehensively
- internal-link suggestions
- related questions the piece should answer
Keep it readable for humans first; never keyword-stuff. Flag any claim that needs a source.`,
  },
  {
    id: 'chief-of-staff', emoji: '🗂️', cat: 'productivity',
    title: { en: 'Chief of Staff', zh: '智能助理（参谋长）' },
    oneLiner: { en: 'Triages inbox + calendar to the 3 things that actually need you.', zh: '把邮箱和日历筛成「今天真正需要你」的 3 件事。' },
    tools: ['Gmail', 'Calendar', 'Slack'],
    tasks: [
      { en: 'Morning inbox + calendar triage', zh: '每日早间邮箱/日历梳理' },
      { en: 'Draft routine replies for approval', zh: '为常规消息起草待批回复' },
    ],
    prompt: `You are my chief of staff.
Each morning, triage my inbox and calendar:
- surface the 3 things that actually need me today
- draft replies for routine messages (for my approval)
- flag scheduling conflicts
- give one line of context before each meeting
Be terse. Protect my focus time. Never send anything without my explicit confirmation.`,
  },
  {
    id: 'pm-prd', emoji: '📝', cat: 'product',
    title: { en: 'PM / PRD Writer', zh: '产品经理 / PRD 写手' },
    oneLiner: { en: 'Turns an idea into a crisp, one-page PRD with a clear recommendation.', zh: '把想法写成一页纸、有明确建议的 PRD。' },
    tools: ['Notion', 'Linear'],
    tasks: [
      { en: 'Idea → one-page PRD', zh: '想法 → 一页纸 PRD' },
      { en: 'Pressure-test assumptions', zh: '对假设做压力测试' },
    ],
    prompt: `You are a product manager.
Given a problem or idea, write a crisp PRD:
- the user and the problem
- goals and non-goals
- 1–2 proposed solutions with tradeoffs
- scope (must / should / won't)
- success metrics and open questions
Be decisive — recommend one path. Keep it to one page. Challenge weak assumptions
instead of rubber-stamping them.`,
  },
  {
    id: 'deep-research', emoji: '🔬', cat: 'research',
    title: { en: 'Deep Research Analyst', zh: '深度研究分析师' },
    oneLiner: { en: 'Plans sub-questions, reads many sources, returns a cited synthesis.', zh: '拆解子问题、读多方信源，给出带引用的综合结论。' },
    tools: ['Web', 'Notion'],
    tasks: [
      { en: 'Cited answer with confidence level', zh: '带置信度的引用式答案' },
      { en: 'Surface where sources disagree', zh: '指出信源分歧之处' },
    ],
    prompt: `You are a research analyst.
Given a question:
- plan the sub-questions
- gather from multiple independent sources
- synthesize a cited answer: a 3-line executive summary, key findings with sources,
  where sources disagree, and your confidence level
Distinguish fact from inference. Never present a single source as consensus.
End with: "what would change my conclusion".`,
  },
];

interface Props { onHome: () => void }

const Agents: React.FC<Props> = ({ onHome }) => {
  const [lang, setLang] = useState<Lang>(detectInitialLang);
  const s2t = useS2T(lang === 'zhHant');
  const t = (txt: LocalizedText) => (lang === 'en' ? txt.en : lang === 'zhHant' ? (s2t ? s2t(txt.zh) : txt.zh) : txt.zh);
  useEffect(() => { if (typeof window !== 'undefined') window.localStorage.setItem(STORAGE_KEY, lang); }, [lang]);

  const [cat, setCat] = useState<'all' | CatKey>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const list = useMemo(() => (cat === 'all' ? TEMPLATES : TEMPLATES.filter((x) => x.cat === cat)), [cat]);

  const copy = (tpl: Template) => {
    navigator.clipboard?.writeText(tpl.prompt).then(() => {
      setCopiedId(tpl.id);
      window.setTimeout(() => setCopiedId((c) => (c === tpl.id ? null : c)), 1600);
    }).catch(() => {});
  };

  const LANGS: { code: Lang; label: string }[] = [
    { code: 'en', label: 'EN' }, { code: 'zh', label: '简' }, { code: 'zhHant', label: '繁' },
  ];

  return (
    <div className="min-h-screen bg-paper font-sans text-ink">
      <header className="sticky top-0 z-40 border-b border-ink/10 bg-paper/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-5 py-4 sm:px-8">
          <div className="flex items-center justify-between gap-3">
            <button onClick={onHome} className="font-mono text-xs text-ink/55 transition-colors hover:text-ink">← Da Lei · 大雷</button>
            <div className="flex items-center gap-3">
              <span className="hidden font-mono text-[11px] uppercase tracking-[0.2em] text-gold sm:inline">Agent Templates</span>
              <div className="flex overflow-hidden rounded-full border border-ink/15">
                {LANGS.map((l) => (
                  <button key={l.code} onClick={() => setLang(l.code)}
                    className={`px-2.5 py-1 font-mono text-[11px] transition-colors ${lang === l.code ? 'bg-ink text-paper' : 'text-ink/55 hover:text-ink'}`}>{l.label}</button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-14">
        <p className="font-mono text-xs uppercase tracking-[0.22em] text-ink/45">{t({ en: 'Agent templates', zh: 'Agent 模板库' })}</p>
        <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight sm:text-5xl">
          {t({ en: 'Build an agent for any scenario', zh: '为每个场景，建一个 Agent' })}
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-ink/65">
          {t({
            en: 'Ready-to-use agent templates by scenario — copy the system prompt, drop it into Copilot Studio / your favorite agent platform, wire up the suggested tools, and go. Prompts are in English so they’re portable anywhere.',
            zh: '按场景分好的开箱即用 Agent 模板 —— 复制系统提示词，丢进 Copilot Studio 或你常用的 Agent 平台，接上建议的工具即可上手。提示词用英文，便于在任何平台通用。',
          })}
        </p>

        {/* category filter */}
        <div className="mt-7 flex flex-wrap gap-2">
          <button onClick={() => setCat('all')}
            className={`rounded-full border px-3.5 py-1.5 font-mono text-xs transition-colors ${cat === 'all' ? 'border-ink bg-ink text-paper' : 'border-ink/15 text-ink/60 hover:border-ink/40'}`}>
            {t({ en: 'All', zh: '全部' })}
          </button>
          {CATS.map((c) => (
            <button key={c.key} onClick={() => setCat(c.key)}
              className={`rounded-full border px-3.5 py-1.5 font-mono text-xs transition-colors ${cat === c.key ? 'border-ink bg-ink text-paper' : 'border-ink/15 text-ink/60 hover:border-ink/40'}`}>
              {t(c.label)}
            </button>
          ))}
        </div>

        {/* template grid */}
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((tpl) => (
            <article key={tpl.id} className="flex flex-col rounded-2xl border border-ink/10 bg-surface/50 p-5 transition-colors hover:border-gold/40">
              <div className="flex items-center justify-between gap-2">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-ink/[0.04] text-xl">{tpl.emoji}</span>
                <span className="rounded-full border border-ink/10 bg-ink/5 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-ink/50">{t(catLabel(tpl.cat))}</span>
              </div>
              <h3 className="mt-3 font-display text-xl font-semibold tracking-tight">{t(tpl.title)}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-ink/60">{t(tpl.oneLiner)}</p>

              <div className="mt-3 flex flex-wrap gap-1.5">
                {tpl.tools.map((tool) => (
                  <span key={tool} className="rounded-md border border-ink/10 bg-ink/[0.03] px-2 py-0.5 font-mono text-[11px] text-ink/55">{tool}</span>
                ))}
              </div>

              <ul className="mt-3 space-y-1 text-[13px] text-ink/55">
                {tpl.tasks.map((task, i) => (
                  <li key={i} className="flex items-start gap-2"><span className="mt-0.5 text-gold">·</span> {t(task)}</li>
                ))}
              </ul>

              <details className="group/p mt-4 rounded-xl border border-ink/10 bg-ink/[0.03] px-3.5 py-2.5">
                <summary className="flex cursor-pointer list-none items-center justify-between font-mono text-[11px] uppercase tracking-wider text-ink/55 [&::-webkit-details-marker]:hidden">
                  <span>{t({ en: 'System prompt', zh: '系统提示词' })}</span>
                  <span className="transition-transform group-open/p:rotate-180">▾</span>
                </summary>
                <pre className="mt-2.5 max-h-64 overflow-auto whitespace-pre-wrap font-mono text-[11.5px] leading-relaxed text-ink/70">{tpl.prompt}</pre>
              </details>

              <button onClick={() => copy(tpl)}
                className="mt-3 inline-flex items-center justify-center gap-1.5 rounded-full border border-ink/15 bg-paper px-3.5 py-1.5 font-mono text-xs text-ink/75 transition-colors hover:border-gold/50 hover:text-gold">
                {copiedId === tpl.id ? t({ en: 'Copied ✓', zh: '已复制 ✓' }) : t({ en: 'Copy prompt', zh: '复制提示词' })}
              </button>
            </article>
          ))}
        </div>

        <p className="mt-10 text-xs leading-relaxed text-ink/45">
          {t({
            en: 'Templates by 大雷 — starting points, not gospel. Tune the prompt to your context, and always keep a human in the loop for anything that sends, ships, or spends.',
            zh: '模板由大雷整理 —— 是起点而非定论。按你的场景调整提示词；凡是会「发送 / 上线 / 花钱」的动作，务必保留人工确认。',
          })}
        </p>
      </main>
    </div>
  );
};

export default Agents;
