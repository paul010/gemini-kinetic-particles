import React, { useEffect, useState } from 'react';

/* ---------------------------------------------------------------------------
 * /patterns — Agent Design Patterns, organized by the agent loop. Architecture
 * referenced from 黄佳's "Agent 设计模式之美" (github.com/huangjia2019/
 * agent-design-patterns): patterns aren't a flat checklist, they sit at
 * coordinates in a design space. Here we present them along the 7 layers of the
 * loop (Perception → Memory → Reasoning → Action → Reflection → Collaboration →
 * Governance), plus Composition. Native + bilingual.
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

interface Pattern { name: LocalizedText; desc: LocalizedText }
interface Layer { n: string; icon: string; accent: string; name: LocalizedText; role: LocalizedText; patterns: Pattern[] }

const LAYERS: Layer[] = [
  {
    n: '01', icon: '👁️', accent: '#3a7a7a',
    name: { en: 'Perception', zh: '感知' },
    role: { en: 'Turn raw input into exactly what the model needs', zh: '把原始输入,变成模型真正需要的东西' },
    patterns: [
      { name: { en: 'Context Triage', zh: '上下文分诊' }, desc: { en: 'Budget attention — decide what enters the context window and what gets dropped.', zh: '给注意力做预算 —— 决定什么进上下文窗口、什么被丢掉。' } },
      { name: { en: 'Semantic Compaction', zh: '语义压缩' }, desc: { en: 'Compress long context down to its meaning, not just its tokens.', zh: '把长上下文压成「含义」,而不是单纯砍 token。' } },
      { name: { en: 'Progressive Discovery', zh: '渐进发现' }, desc: { en: 'Reveal information just-in-time instead of front-loading everything.', zh: '信息按需揭示,而不是一开始全塞进去。' } },
      { name: { en: 'Multimodal Fusion', zh: '多模态融合' }, desc: { en: 'Combine text, image and audio into one coherent signal.', zh: '把文本、图像、音频融成一个连贯的信号。' } },
    ],
  },
  {
    n: '02', icon: '🧠', accent: '#7a5cab',
    name: { en: 'Memory', zh: '记忆' },
    role: { en: 'What persists across turns and runs', zh: '在多轮、多次运行之间留存下来的东西' },
    patterns: [
      { name: { en: 'Hierarchical Retention', zh: '分层保留' }, desc: { en: 'Tiered memory — working / session / long-term (à la MemGPT, Claude Code’s layers).', zh: '分层记忆 —— 工作区 / 会话 / 长期(参考 MemGPT、Claude Code 四层记忆)。' } },
      { name: { en: 'RAG', zh: 'RAG 检索增强' }, desc: { en: 'Retrieve relevant chunks from a store to ground the answer.', zh: '从知识库检索相关片段,给答案提供依据。' } },
      { name: { en: 'Progress Tracking', zh: '进度追踪' }, desc: { en: 'Keep an explicit task/todo state across a long run.', zh: '在长任务里维护一份明确的任务 / todo 状态。' } },
      { name: { en: 'Failure Journals', zh: '失败日记' }, desc: { en: 'Log what went wrong so the agent doesn’t repeat it.', zh: '把踩过的坑记下来,别再犯第二遍。' } },
    ],
  },
  {
    n: '03', icon: '💭', accent: '#4285f4',
    name: { en: 'Reasoning', zh: '推理' },
    role: { en: 'How it thinks before it acts', zh: '行动之前,它怎么思考' },
    patterns: [
      { name: { en: 'Chain of Thought', zh: '思维链' }, desc: { en: 'Think step-by-step before answering.', zh: '先一步步想清楚,再回答。' } },
      { name: { en: 'Complexity Routing', zh: '复杂度路由' }, desc: { en: 'Send easy tasks to a cheap path, hard ones to a deep path.', zh: '简单任务走便宜的路,难任务走深思的路。' } },
      { name: { en: 'Parallel Exploration', zh: '并行探索' }, desc: { en: 'Explore several approaches at once, then pick the best.', zh: '同时探索几条路,再挑最好的。' } },
      { name: { en: 'Iterative Hypothesis', zh: '迭代假设' }, desc: { en: 'Form a hypothesis, test it, revise — like a scientist.', zh: '提出假设、验证、修正 —— 像科学家一样。' } },
    ],
  },
  {
    n: '04', icon: '⚡', accent: '#c2703c',
    name: { en: 'Action', zh: '行动' },
    role: { en: 'How it does things in the world', zh: '它怎么在真实世界里做事' },
    patterns: [
      { name: { en: 'Prompt Chaining', zh: '提示链' }, desc: { en: 'Chain small, reliable prompts into a workflow.', zh: '把一串小而可靠的提示词,串成一条工作流。' } },
      { name: { en: 'Tool Dispatch', zh: '工具调度' }, desc: { en: 'Route a request to the right tool and call it.', zh: '把请求路由到对的工具并调用。' } },
      { name: { en: 'Plan-and-Execute', zh: '规划执行' }, desc: { en: 'Make a plan first, then execute the steps.', zh: '先做计划,再逐步执行。' } },
      { name: { en: 'Guardrail Sandwich', zh: '护栏三明治' }, desc: { en: 'Validate input → act → validate output.', zh: '校验输入 → 执行 → 校验输出,两头夹住。' } },
    ],
  },
  {
    n: '05', icon: '🔁', accent: '#5c8a3a',
    name: { en: 'Reflection', zh: '反思' },
    role: { en: 'How it improves itself', zh: '它怎么自我改进' },
    patterns: [
      { name: { en: 'Generator–Critic', zh: '生成-批评' }, desc: { en: 'One role drafts, another critiques — loop until it’s good.', zh: '一个角色起草、另一个挑刺,循环到满意为止。' } },
      { name: { en: 'Self-Heal Loop', zh: '自愈循环' }, desc: { en: 'Detect a failure and retry with a fix automatically.', zh: '发现出错,自动带着修复重试。' } },
      { name: { en: 'Skill Package', zh: '技能包' }, desc: { en: 'Distill a repeated solution into a reusable skill.', zh: '把反复用到的解法,沉淀成可复用的技能。' } },
      { name: { en: 'Experience Replay', zh: '经验回放' }, desc: { en: 'Learn from past runs by replaying them.', zh: '回放过去的运行记录,从中学习。' } },
    ],
  },
  {
    n: '06', icon: '🤝', accent: '#8a682c',
    name: { en: 'Collaboration', zh: '协作' },
    role: { en: 'How multiple agents work together', zh: '多个 agent 怎么协同' },
    patterns: [
      { name: { en: 'Handoff Chain', zh: '交接链' }, desc: { en: 'Pass the task down a chain of specialists.', zh: '把任务沿着一条专家链往下交接。' } },
      { name: { en: 'Fan-out / Gather', zh: '扇出聚合' }, desc: { en: 'Split work across agents in parallel, then merge.', zh: '把活并行扇给多个 agent,再聚合结果。' } },
      { name: { en: 'Adversarial Review', zh: '对抗评审' }, desc: { en: 'An independent agent tries to refute the result.', zh: '一个独立 agent 专门来反驳、挑错。' } },
      { name: { en: 'Hierarchical Delegation', zh: '层级委派' }, desc: { en: 'A lead agent delegates to sub-agents.', zh: '一个主管 agent 把任务委派给子 agent。' } },
    ],
  },
  {
    n: '07', icon: '🛡️', accent: '#c0413a',
    name: { en: 'Governance', zh: '治理' },
    role: { en: 'How to keep it safe and accountable', zh: '怎么让它安全、可问责' },
    patterns: [
      { name: { en: 'Approval Gate', zh: '审批门' }, desc: { en: 'Pause for human approval before risky actions.', zh: '高风险动作前,停下来等人工批准。' } },
      { name: { en: 'Blast Radius', zh: '爆炸半径' }, desc: { en: 'Bound how much damage a single mistake can do.', zh: '限制一次失误最多能造成多大破坏。' } },
      { name: { en: 'Progressive Commitment', zh: '渐进承诺' }, desc: { en: 'Commit in small, reversible steps — not all at once.', zh: '小步、可回滚地提交,而不是一把梭。' } },
      { name: { en: 'Observability Harness', zh: '可观测性' }, desc: { en: 'Trace, log and monitor every decision.', zh: '把每一步决策都追踪、记录、监控起来。' } },
    ],
  },
];

const COMPOSITION: Pattern[] = [
  { name: { en: 'Pattern Selection Card', zh: '模式选择卡' }, desc: { en: 'Pick the pattern by where your problem sits in the design space.', zh: '按你的问题落在设计空间的哪个坐标,选出该用的模式。' } },
  { name: { en: 'Six-Step Methodology', zh: '六步方法论' }, desc: { en: 'A process to assemble patterns into a real architecture.', zh: '一套把模式组装成真实架构的流程。' } },
  { name: { en: 'Full Worked Case', zh: '完整案例' }, desc: { en: 'An end-to-end example wiring many patterns together.', zh: '一个端到端、把多种模式接到一起的完整案例。' } },
  { name: { en: 'Checklist Benchmark', zh: '清单基准' }, desc: { en: 'A checklist to audit an agent design before you ship.', zh: '上线前,用来体检一个 agent 设计的清单。' } },
];

interface Props { onHome: () => void }

const Patterns: React.FC<Props> = ({ onHome }) => {
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
            <span className="hidden font-mono text-[11px] uppercase tracking-[0.2em] text-gold sm:inline">Agent Patterns</span>
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
        <p className="font-mono text-xs uppercase tracking-[0.22em] text-ink/45">{t({ en: 'Agent design patterns', zh: 'Agent 设计模式' })}</p>
        <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight sm:text-5xl">
          {t({ en: 'Patterns along the agent loop', zh: '沿着 Agent 回路看设计模式' })}
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-ink/65">
          {t({
            en: 'Most “agent architecture” guides hand you a flat checklist — Reflection, ReAct, Multi-Agent… It tells you which patterns exist, but not which one your problem needs. This view organizes them along the seven layers of the agent loop, so you choose by where your problem sits — a coordinate system, not a checklist.',
            zh: '大多数「agent 架构」指南给你一张平铺清单 —— Reflection、ReAct、Multi-Agent…… 它告诉你「有哪些模式」,却答不出「我该用哪一个」。这里把它们沿 Agent 回路的七个层级排开,让你按问题所在的坐标来选 —— 是坐标系,不是清单。',
          })}
        </p>
        <div className="mt-4 rounded-xl border border-gold/25 bg-gold/[0.05] px-4 py-3 text-sm leading-relaxed text-ink/65">
          {t({
            en: 'Architecture referenced from 黄佳’s “Agent 设计模式之美” (agent-design-patterns). A great read if you build agents.',
            zh: '架构参考自黄佳的《Agent 设计模式之美》(agent-design-patterns)。做 agent 的话,很值得一读。',
          })}
        </div>

        {/* layers */}
        <div className="mt-10 space-y-6">
          {LAYERS.map((layer) => (
            <section key={layer.n} className="overflow-hidden rounded-3xl border border-ink/10 bg-surface/40">
              <div className="flex items-center gap-3 border-b border-ink/10 p-5" style={{ borderLeft: `4px solid ${layer.accent}` }}>
                <span className="text-2xl">{layer.icon}</span>
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="font-mono text-[11px] text-ink/35">{layer.n}</span>
                    <h2 className="font-display text-2xl font-semibold tracking-tight">{t(layer.name)}</h2>
                  </div>
                  <p className="mt-0.5 text-xs leading-relaxed text-ink/55">{t(layer.role)}</p>
                </div>
              </div>
              <div className="grid gap-px bg-ink/10 sm:grid-cols-2">
                {layer.patterns.map((p) => (
                  <div key={p.name.en} className="bg-paper p-5">
                    <h3 className="flex items-center gap-2 font-semibold">
                      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: layer.accent }} />
                      {t(p.name)}
                    </h3>
                    <p className="mt-1.5 text-[13px] leading-relaxed text-ink/60">{t(p.desc)}</p>
                  </div>
                ))}
              </div>
            </section>
          ))}

          {/* composition */}
          <section className="overflow-hidden rounded-3xl border border-ink/15 bg-ink/[0.03]">
            <div className="flex items-center gap-3 border-b border-ink/10 p-5">
              <span className="text-2xl">🧩</span>
              <div>
                <h2 className="font-display text-2xl font-semibold tracking-tight">{t({ en: 'Composition', zh: '组合' })}</h2>
                <p className="mt-0.5 text-xs leading-relaxed text-ink/55">{t({ en: 'Assembling the patterns above into one working system', zh: '把上面这些模式,组装成一个真正能跑的系统' })}</p>
              </div>
            </div>
            <div className="grid gap-px bg-ink/10 sm:grid-cols-2">
              {COMPOSITION.map((p) => (
                <div key={p.name.en} className="bg-paper p-5">
                  <h3 className="flex items-center gap-2 font-semibold"><span className="h-1.5 w-1.5 rounded-full bg-gold" />{t(p.name)}</h3>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-ink/60">{t(p.desc)}</p>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-ink/10 pt-8 font-mono text-[13px]">
          <a className="text-gold hover:underline" href="https://github.com/huangjia2019/agent-design-patterns" target="_blank" rel="noreferrer">huangjia2019/agent-design-patterns ↗</a>
          <a className="text-gold hover:underline" href="/agents">{t({ en: 'Agent templates →', zh: 'Agent 模板 →' })}</a>
        </div>
        <p className="mt-6 text-xs leading-relaxed text-ink/45">
          {t({
            en: 'A study map by 大雷, structured after 黄佳’s framework — short summaries, not a substitute for the book or the code. Read the repo for the runnable reference implementations.',
            zh: '大雷按黄佳的框架整理的学习地图 —— 是精简概览,替代不了原书和代码。可运行的参考实现请看仓库。',
          })}
        </p>
      </main>
    </div>
  );
};

export default Patterns;
