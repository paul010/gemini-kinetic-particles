import React, { useEffect, useState } from 'react';

/* ---------------------------------------------------------------------------
 * /copilot — a native, bilingual rebuild of 大雷's "Microsoft Copilot / Agent
 * product matrix" (as of 2026-06). Three tiers: Use → No-code → Develop.
 * Rebuilt as real web content (not a screenshot) so it's searchable, responsive
 * and translatable. Source: 大雷's own summary infographic.
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

interface Product {
  name: string;
  badge: LocalizedText;
  license: LocalizedText;
  credit: 1 | 2 | 3 | 4 | 5; // 1 very low … 5 very high
  creditNote: LocalizedText;
  can: LocalizedText;
  use: LocalizedText;
}
interface Tier {
  n: string;
  accent: string;
  title: LocalizedText;
  sub: LocalizedText;
  products: Product[];
}

const TIERS: Tier[] = [
  {
    n: '1',
    accent: '#5c8a3a',
    title: { en: 'Use · Copilot / Cowork', zh: '使用 · Copilot / Cowork' },
    sub: { en: 'AI for everyday work and task execution', zh: 'AI 助力日常办公与任务执行' },
    products: [
      {
        name: 'Microsoft 365 Copilot',
        badge: { en: 'Everyday work assistant', zh: '日常办公助手' },
        license: { en: 'M365 E3 / E5 / Business Premium + a Copilot license (≈ $30/user/mo)', zh: 'M365 E3 / E5 / Business Premium 等 + Copilot 许可证（约 $30/用户/月）' },
        credit: 1,
        creditNote: { en: 'Included in the Copilot license', zh: '已包含在 Copilot 许可证中' },
        can: { en: 'Chat, summarize, draft and analyze across Word / Excel / PowerPoint / Outlook / Teams, grounded in Microsoft Graph.', zh: '在 Word / Excel / PowerPoint / Outlook / Teams 中，基于 Microsoft Graph 数据进行聊天、总结、草稿生成、数据分析等。' },
        use: { en: 'Boost personal day-to-day productivity (summaries, meeting notes, data analysis).', zh: '提升个人日常办公效率（摘要、会议纪要、数据分析等）。' },
      },
      {
        name: 'Copilot Cowork',
        badge: { en: 'Autonomous task agent', zh: 'AI 自动执行助手' },
        license: { en: 'M365 Copilot license + Cowork enabled (PayGo / P3)', zh: 'M365 Copilot 许可证 + 开启 Cowork（按量付费 PayGo / P3）' },
        credit: 5,
        creditNote: { en: 'Copilot Credits, metered (≈ $0.01 / credit)', zh: 'Copilot Credits 按量收费（约 $0.01 / Credit）' },
        can: { en: 'A self-running AI agent: long, multi-step, cross-app tasks run in the background and return a result.', zh: '自主运行的 AI Agent，跨多应用、长时间、多步骤任务可在后台执行，最后返回成果。' },
        use: { en: 'Delegate whole tasks (prep meetings, research reports, bulk file comparisons).', zh: '任务委托（准备会议、调研报告、大量文件批量比较等）。' },
      },
    ],
  },
  {
    n: '2',
    accent: '#c2703c',
    title: { en: 'No-code · Agent Builder / Copilot Studio', zh: '无代码创建 · Agent Builder / Copilot Studio' },
    sub: { en: 'Business users build their own AI agents, fast', zh: '业务人员快速构建专属 AI Agent' },
    products: [
      {
        name: 'M365 Copilot Agent Builder',
        badge: { en: 'Quick personal agent', zh: '快速创建个人 Agent' },
        license: { en: 'Included in Microsoft 365 Copilot (no extra license)', zh: '已包含在 Microsoft 365 Copilot 中（无需额外许可证）' },
        credit: 1,
        creditNote: { en: 'No credits for internal/basic use; metered on public publish or PayGo config', zh: '企业内部使用、基础功能不消耗 Credit；公开发布或 PAYG 配置时按量收费' },
        can: { en: 'Create agents no-code inside M365 Copilot; wire up a prompt + a knowledge base (e.g. SharePoint) for a lightweight Q&A agent.', zh: '在 M365 Copilot 内部通过无代码方式创建 Agent；配置提示词 + 知识库（SharePoint 等）即可构建轻量级问答 Agent。' },
        use: { en: 'Individuals / small teams spin up FAQ agents (company policy, SharePoint doc lookup).', zh: '个人、小团队快速创建 FAQ Agent（企业制度、SharePoint 文档查询等）。' },
      },
      {
        name: 'Microsoft Copilot Studio',
        badge: { en: 'Enterprise agent platform', zh: '企业级 Agent 平台' },
        license: { en: '① bundled in M365 Copilot, or ② standalone (≈ ¥25,000/mo ≈ ¥300,000/yr) + ③ metered (≈ $0.01/credit)', zh: '① 包含于 M365 Copilot ② 独立许可证（约 ¥25,000/月 ≈ ¥300,000/年）③ 按量收费（约 $0.01/Credit）' },
        credit: 3,
        creditNote: { en: '1–100 credits per action; internal-only use can run within the license quota', zh: '每次操作消耗 1~100 Credit；如仅供企业内部员工使用，可在许可额度范围内运行' },
        can: { en: 'No-code enterprise agents; supports Topics, Tools, Power Automate, multi-agent, and external publishing.', zh: '无代码开发企业级 Agent；支持 Topic、Tool、Power Automate、多 Agent、对外发布等。' },
        use: { en: 'Department / enterprise / customer-facing agents (IT, HR, support…).', zh: '部门级 / 企业级 / 对外业务 Agent（IT、HR、客服等）。' },
      },
    ],
  },
  {
    n: '3',
    accent: '#7a5cab',
    title: { en: 'Develop · Foundry / the dev stack', zh: '开发 · Foundry / 开发栈' },
    sub: { en: 'For developers building production-grade AI agents', zh: '面向开发者，构建生产级 AI Agent' },
    products: [
      {
        name: 'Microsoft Foundry',
        badge: { en: 'Managed dev platform', zh: '托管式开发平台' },
        license: { en: 'Azure subscription (PAYG); no Copilot-family license needed', zh: 'Azure 订阅（PAYG），无需 Copilot 系列许可证' },
        credit: 4,
        creditNote: { en: 'Azure metered (model tokens, tool calls, compute…)', zh: 'Azure 按量收费（模型 Token、工具调用、计算资源等）' },
        can: { en: 'Build in Foundry Portal / Agent Service; construct, host and monitor enterprise agents via GUI + SDK, with Agent 365 integration.', zh: '在 Foundry Portal / Agent Service 中完成开发；通过 GUI + SDK 构建、托管、监控企业级 Agent，可与 Agent 365 集成。' },
        use: { en: 'For AI engineers owning deploy / ops / monitoring of hosted agents, shipping to Teams and other channels.', zh: '适合 AI 工程师负责部署、运营、监控，需要托管 Agent 并发布到 Teams 等渠道。' },
      },
      {
        name: 'Foundry + Agent Framework + Agents Toolkit',
        badge: { en: 'Code-first development', zh: '代码优先开发' },
        license: { en: 'Azure (PAYG); Framework / Toolkit free; a Copilot license is needed to publish into M365 Copilot', zh: 'Azure（PAYG）；Framework / Toolkit 免费；若发布到 M365 Copilot 则需 Copilot 许可证' },
        credit: 5,
        creditNote: { en: 'Azure metered (Foundry execution cost)', zh: 'Azure 按量收费（Foundry 执行成本）' },
        can: { en: 'Fully code-driven; Agent Framework handles multi-agent orchestration; Toolkit publishes to Teams / Copilot / Outlook.', zh: '完全代码开发；Agent Framework 支持多 Agent 复杂编排；Toolkit 支持发布到 Teams / Copilot / Outlook。' },
        use: { en: 'For developers building production-grade AI agents / apps for an org or clients.', zh: '面向开发人员，为企业或客户构建生产级 AI Agent / AI 应用。' },
      },
    ],
  },
];

const CREDIT_LEGEND: { level: number; label: LocalizedText }[] = [
  { level: 1, label: { en: 'Very low — near-zero extra cost', zh: '很低 — 几乎无额外成本' } },
  { level: 2, label: { en: 'Low — a few credits', zh: '低 — 少量 Credit' } },
  { level: 3, label: { en: 'Medium — moderate usage', zh: '中等 — 适中消耗' } },
  { level: 4, label: { en: 'High — heavier usage', zh: '高 — 较高消耗' } },
  { level: 5, label: { en: 'Very high — heavy usage', zh: '很高 — 大量消耗' } },
];

const PATH: { role: LocalizedText; note: LocalizedText; tools: string[] }[] = [
  { role: { en: 'Employee (user)', zh: '员工（使用者）' }, note: { en: 'Use Copilot to lift daily efficiency; let Cowork do tasks for you.', zh: '使用 Copilot 提升日常效率，用 Cowork 让 AI 帮你完成任务。' }, tools: ['M365 Copilot', 'Copilot Cowork'] },
  { role: { en: 'Business user (no-code)', zh: '业务人员（无代码）' }, note: { en: 'Build a personal agent with Agent Builder; build enterprise agents with Copilot Studio.', zh: '用 Agent Builder 快速创建个人 Agent，用 Copilot Studio 构建企业级 Agent。' }, tools: ['Agent Builder', 'Copilot Studio'] },
  { role: { en: 'Developer (pro build)', zh: '开发者（专业构建）' }, note: { en: 'Host and run agents with Foundry; build complex production apps with the dev stack.', zh: '用 Foundry 托管与运营 Agent，用开发栈构建复杂的生产级应用。' }, tools: ['Foundry', 'Dev stack'] },
];

const FOOTER: LocalizedText[] = [
  { en: 'Security & compliance: enterprise data stays inside the Microsoft trust boundary', zh: '安全合规：企业数据在 Microsoft 安全边界内' },
  { en: 'Deep M365 integration: Graph, Teams, Outlook, SharePoint…', zh: '与 Microsoft 365 深度集成：Graph、Teams、Outlook、SharePoint 等' },
  { en: 'Open ecosystem: SDK, API, MCP, third-party tools', zh: '开放生态：支持 SDK、API、MCP、第三方工具' },
  { en: 'Full spectrum: personal efficiency → team collaboration → enterprise process → ecosystem', zh: '全场景覆盖：从个人效率 → 团队协作 → 企业流程 → 生态扩展' },
];

const creditColor = (i: number, level: number) => {
  if (i >= level) return 'rgba(28,26,23,0.14)';
  if (level <= 2) return '#5c8a3a';
  if (level === 3) return '#8a682c';
  return '#b4543a';
};

const CreditDots: React.FC<{ level: number }> = ({ level }) => (
  <span className="inline-flex items-center gap-1">
    {[0, 1, 2, 3, 4].map((i) => (
      <span key={i} className="h-2 w-2 rounded-full" style={{ backgroundColor: creditColor(i, level) }} />
    ))}
  </span>
);

interface Props { onHome: () => void }

const Copilot: React.FC<Props> = ({ onHome }) => {
  const [lang, setLang] = useState<Lang>(detectInitialLang);
  const s2t = useS2T(lang === 'zhHant');
  const t = (txt: LocalizedText) => (lang === 'en' ? txt.en : lang === 'zhHant' ? (s2t ? s2t(txt.zh) : txt.zh) : txt.zh);
  useEffect(() => {
    if (typeof window !== 'undefined') window.localStorage.setItem(STORAGE_KEY, lang);
  }, [lang]);

  const LANGS: { code: Lang; label: string }[] = [
    { code: 'en', label: 'EN' }, { code: 'zh', label: '简' }, { code: 'zhHant', label: '繁' },
  ];
  const ATTR = {
    license: { en: 'License', zh: '许可证' },
    credit: { en: 'Credit usage', zh: 'Credit 消耗' },
    can: { en: 'What it does', zh: '可以做什么' },
    use: { en: 'Best for', zh: '主要用途' },
  };

  return (
    <div className="min-h-screen bg-paper font-sans text-ink">
      <header className="sticky top-0 z-40 border-b border-ink/10 bg-paper/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-5 py-4 sm:px-8">
          <button onClick={onHome} className="font-mono text-xs text-ink/55 transition-colors hover:text-ink">← Da Lei · 大雷</button>
          <div className="flex items-center gap-3">
            <span className="hidden font-mono text-[11px] uppercase tracking-[0.2em] text-gold sm:inline">Field note · 2026-06</span>
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
        <p className="font-mono text-xs uppercase tracking-[0.22em] text-ink/45">{t({ en: 'Field note · as of June 2026', zh: '阶段性总结 · 截至 2026 年 6 月' })}</p>
        <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight sm:text-5xl">
          {t({ en: 'Microsoft Copilot / Agent — the product matrix', zh: 'Microsoft Copilot / Agent 相关产品矩阵' })}
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-relaxed text-ink/65">
          {t({
            en: 'A three-tier way to read Microsoft’s Copilot & Agent stack — Use → No-code → Develop — with the license, credit cost, capabilities and best-fit use for each product. My own summary, kept current.',
            zh: '用三层架构看懂微软的 Copilot 与 Agent 全家桶 —— 使用 → 无代码创建 → 开发 —— 每个产品的许可证、Credit 消耗、能做什么、主要用途一目了然。我自己的总结，持续更新。',
          })}
        </p>

        {/* three tiers */}
        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          {TIERS.map((tier) => (
            <section key={tier.n} className="flex flex-col overflow-hidden rounded-3xl border border-ink/10 bg-surface/40">
              <div className="flex items-start gap-3 border-b border-ink/10 p-5" style={{ borderTop: `3px solid ${tier.accent}` }}>
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full font-mono text-sm font-bold text-white" style={{ backgroundColor: tier.accent }}>{tier.n}</span>
                <div>
                  <h2 className="font-display text-xl font-semibold leading-tight">{t(tier.title)}</h2>
                  <p className="mt-1 text-xs leading-relaxed text-ink/55">{t(tier.sub)}</p>
                </div>
              </div>
              <div className="flex flex-1 flex-col gap-4 p-5">
                {tier.products.map((p) => (
                  <article key={p.name} className="rounded-2xl border border-ink/10 bg-paper/70 p-4">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-semibold leading-tight">{p.name}</h3>
                    </div>
                    <span className="mt-1.5 inline-block rounded-full px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider" style={{ backgroundColor: `${tier.accent}1a`, color: tier.accent }}>{t(p.badge)}</span>
                    <dl className="mt-3 space-y-2.5 text-[13px] leading-relaxed">
                      <div>
                        <dt className="font-mono text-[10px] uppercase tracking-wider text-ink/45">{t(ATTR.license)}</dt>
                        <dd className="mt-0.5 text-ink/70">{t(p.license)}</dd>
                      </div>
                      <div>
                        <dt className="font-mono text-[10px] uppercase tracking-wider text-ink/45">{t(ATTR.credit)}</dt>
                        <dd className="mt-1 flex items-center gap-2"><CreditDots level={p.credit} /><span className="text-ink/60">{t(p.creditNote)}</span></dd>
                      </div>
                      <div>
                        <dt className="font-mono text-[10px] uppercase tracking-wider text-ink/45">{t(ATTR.can)}</dt>
                        <dd className="mt-0.5 text-ink/70">{t(p.can)}</dd>
                      </div>
                      <div>
                        <dt className="font-mono text-[10px] uppercase tracking-wider text-ink/45">{t(ATTR.use)}</dt>
                        <dd className="mt-0.5 text-ink/70">{t(p.use)}</dd>
                      </div>
                    </dl>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>

        {/* path from employee to developer */}
        <section className="mt-10 rounded-3xl border border-ink/10 bg-surface/40 p-6 sm:p-8">
          <h2 className="font-display text-2xl font-semibold tracking-tight">{t({ en: 'From employee to developer — pick your AI-agent path', zh: '从员工到开发者：选择你的 AI Agent 路径' })}</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {PATH.map((step, i) => (
              <div key={i} className="relative rounded-2xl border border-ink/10 bg-paper/70 p-5">
                <span className="font-mono text-xs text-gold">0{i + 1}</span>
                <h3 className="mt-1 font-semibold">{t(step.role)}</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-ink/65">{t(step.note)}</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {step.tools.map((tool) => (
                    <span key={tool} className="rounded-md border border-ink/10 bg-ink/[0.04] px-2 py-0.5 font-mono text-[11px] text-ink/55">{tool}</span>
                  ))}
                </div>
                {i < PATH.length - 1 && <span aria-hidden className="pointer-events-none absolute -right-3 top-1/2 hidden -translate-y-1/2 text-ink/25 md:block">→</span>}
              </div>
            ))}
          </div>
        </section>

        {/* credit legend */}
        <section className="mt-8 rounded-2xl border border-ink/10 bg-surface/30 p-5 sm:p-6">
          <h3 className="font-mono text-[11px] uppercase tracking-[0.2em] text-gold">{t({ en: 'Credit usage — typical scenarios', zh: 'Credit 消耗等级（典型场景）' })}</h3>
          <ul className="mt-4 flex flex-wrap gap-x-8 gap-y-3">
            {CREDIT_LEGEND.map((c) => (
              <li key={c.level} className="flex items-center gap-2 text-[13px] text-ink/65"><CreditDots level={c.level} /> {t(c.label)}</li>
            ))}
          </ul>
        </section>

        {/* footer pillars */}
        <section className="mt-8 grid gap-3 sm:grid-cols-2">
          {FOOTER.map((f, i) => (
            <div key={i} className="flex items-start gap-2.5 rounded-xl border border-ink/10 bg-surface/30 px-4 py-3 text-[13px] leading-relaxed text-ink/65">
              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-gold" /> {t(f)}
            </div>
          ))}
        </section>

        <p className="mt-8 text-xs leading-relaxed text-ink/45">
          {t({
            en: 'A personal summary by 大雷 for learning — product names, prices and licensing follow Microsoft’s official terms and change over time; verify before you buy.',
            zh: '大雷个人学习总结 —— 产品名称、价格与授权以微软官方为准，且会随时间变化，决策前请以官方信息核对。',
          })}
        </p>
      </main>
    </div>
  );
};

export default Copilot;
