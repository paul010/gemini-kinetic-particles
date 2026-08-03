import React, { useState } from 'react';

interface Props {
  onHome: () => void;
}

interface FeaturedSkill {
  initials: string;
  name: string;
  summary: string;
  platforms: string;
  useFor: string;
  href: string;
}

const OFFICIAL_GALLERY = 'https://microsoft.github.io/cat-agent-skills/';
const OFFICIAL_REPO = 'https://github.com/microsoft/cat-agent-skills';

const FEATURED_SKILLS: FeaturedSkill[] = [
  {
    initials: 'SA',
    name: 'Skill Authoring Coach',
    summary: '把一段零散经验整理成触发清晰、可复用、可检查的 Agent Skill。',
    platforms: 'Cowork / Copilot Studio / Scout',
    useFor: '培训第一站：学会写和审查 SKILL.md',
    href: `${OFFICIAL_GALLERY}skills/skill-authoring-coach/`,
  },
  {
    initials: 'AE',
    name: 'Agent Evaluation Designer',
    summary: '先定义什么叫好，再设计测试集、评分方式和上线判断。',
    platforms: 'Copilot Studio',
    useFor: 'Agent 评测、回归测试、Go / No-Go',
    href: `${OFFICIAL_GALLERY}skills/agent-evaluation-designer/`,
  },
  {
    initials: 'AU',
    name: 'AI Use Case Assessment',
    summary: '把业务想法变成有证据、有评分、有风险说明的用例评估。',
    platforms: 'Cowork / Copilot Studio / Scout',
    useFor: '场景筛选、优先级排序、立项沟通',
    href: `${OFFICIAL_GALLERY}skills/ai-usecase-assessment/`,
  },
  {
    initials: 'MA',
    name: 'Microsoft AI Platform Advisor',
    summary: '通过结构化访谈选择合适的微软 AI 平台，并判断复杂度与风险。',
    platforms: 'Copilot Studio',
    useFor: 'M365 Copilot、Copilot Studio、Foundry 选型',
    href: `${OFFICIAL_GALLERY}skills/microsoft-ai-platform-advisor/`,
  },
  {
    initials: 'CS',
    name: 'Copilot Studio Topic Blueprint',
    summary: '把一句话需求变成可实施的 Copilot Studio Agent 蓝图。',
    platforms: 'Copilot Studio',
    useFor: 'Topic、工具、知识、变量与首轮测试规划',
    href: `${OFFICIAL_GALLERY}skills/copilot-studio-topic-blueprint/`,
  },
  {
    initials: 'AP',
    name: 'Accessibility Pass',
    summary: '检查文档、演示文稿、HTML 和 Markdown 的常见无障碍问题。',
    platforms: 'Cowork / Copilot Studio',
    useFor: '培训材料和客户交付前检查',
    href: `${OFFICIAL_GALLERY}skills/accessibility-pass/`,
  },
  {
    initials: 'PD',
    name: 'PowerPoint Deck Designer',
    summary: '从结构化规格生成可编辑 PowerPoint，并支持常见图表。',
    platforms: 'Copilot Studio',
    useFor: '课程、汇报和客户演示',
    href: `${OFFICIAL_GALLERY}skills/powerpoint-deck-designer/`,
  },
];

const WORKSHOP_PROMPT = `我正在参加 Agent Skill 实战培训。请先阅读我提供的 Skill 页面或 SKILL.md，然后完成以下任务：

1. 用一句话说明它在什么情况下应该被触发。
2. 列出使用前需要确认的输入、权限和风险。
3. 给出一个真实业务场景，并写出可直接测试的用户请求。
4. 执行一次模拟测试，分别记录预期结果、实际结果和差异。
5. 判断它适合直接使用、需要修改，还是暂不采用，并说明依据。

不要假设未提供的组织信息、账号权限或数据已经可用。`;

const CatAgentSkills: React.FC<Props> = ({ onHome }) => {
  const [copied, setCopied] = useState(false);

  const copyWorkshopPrompt = async () => {
    try {
      await navigator.clipboard.writeText(WORKSHOP_PROMPT);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="cat-page">
      <style>{`
        .cat-page {
          --cat-bg: #f4f7fb;
          --cat-panel: #e9eff7;
          --cat-panel-strong: #dbe7f5;
          --cat-text: #132033;
          --cat-muted: #52647a;
          --cat-line: rgba(19, 32, 51, 0.14);
          --cat-accent: #1769aa;
          --cat-accent-ink: #f7fbff;
          min-height: 100dvh;
          background: var(--cat-bg);
          color: var(--cat-text);
          font-family: "Aptos", "Segoe UI", system-ui, sans-serif;
        }
        @media (prefers-color-scheme: dark) {
          .cat-page {
            --cat-bg: #0d131d;
            --cat-panel: #141e2b;
            --cat-panel-strong: #1a2a3d;
            --cat-text: #edf4fc;
            --cat-muted: #9aabc0;
            --cat-line: rgba(220, 234, 249, 0.14);
            --cat-accent: #67b7ef;
            --cat-accent-ink: #07111d;
          }
        }
        .cat-shell { width: min(1180px, calc(100% - 40px)); margin: 0 auto; }
        .cat-nav { position: sticky; top: 0; z-index: 20; border-bottom: 1px solid var(--cat-line); background: color-mix(in srgb, var(--cat-bg) 88%, transparent); backdrop-filter: blur(18px); }
        .cat-nav-inner { min-height: 68px; display: flex; align-items: center; justify-content: space-between; gap: 18px; }
        .cat-home { border: 0; background: transparent; color: var(--cat-muted); font: 600 13px/1.2 ui-monospace, SFMono-Regular, Menlo, monospace; cursor: pointer; }
        .cat-home:hover, .cat-home:focus-visible { color: var(--cat-text); }
        .cat-nav-links { display: flex; align-items: center; gap: 18px; font-size: 13px; }
        .cat-link { color: var(--cat-muted); text-decoration: none; }
        .cat-link:hover, .cat-link:focus-visible { color: var(--cat-accent); }
        .cat-hero { min-height: 610px; display: grid; grid-template-columns: minmax(0, 1.18fr) minmax(330px, .82fr); align-items: center; gap: 72px; padding: 72px 0; }
        .cat-kicker { margin: 0 0 18px; color: var(--cat-accent); font: 700 12px/1.3 ui-monospace, SFMono-Regular, Menlo, monospace; letter-spacing: .13em; text-transform: uppercase; }
        .cat-title { max-width: 760px; margin: 0; font-size: clamp(44px, 7vw, 84px); line-height: .98; letter-spacing: -.055em; font-weight: 720; }
        .cat-lead { max-width: 650px; margin: 28px 0 0; color: var(--cat-muted); font-size: clamp(17px, 2vw, 21px); line-height: 1.65; }
        .cat-actions { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 32px; }
        .cat-button { min-height: 46px; display: inline-flex; align-items: center; justify-content: center; padding: 0 19px; border: 1px solid var(--cat-line); border-radius: 8px; background: transparent; color: var(--cat-text); text-decoration: none; font-weight: 700; font-size: 14px; transition: transform .2s ease, border-color .2s ease, background .2s ease; }
        .cat-button:hover, .cat-button:focus-visible { transform: translateY(-2px); border-color: var(--cat-accent); }
        .cat-button-primary { border-color: var(--cat-accent); background: var(--cat-accent); color: var(--cat-accent-ink); }
        .cat-index { display: grid; grid-template-columns: repeat(5, 1fr); gap: 10px; align-items: end; }
        .cat-index-card { min-height: 118px; display: flex; flex-direction: column; justify-content: space-between; padding: 16px; border: 1px solid var(--cat-line); border-radius: 8px; background: var(--cat-panel); }
        .cat-index-card:nth-child(2), .cat-index-card:nth-child(5) { min-height: 178px; background: var(--cat-panel-strong); }
        .cat-index-card:nth-child(3) { min-height: 230px; background: var(--cat-accent); color: var(--cat-accent-ink); }
        .cat-index-initials { font: 800 27px/1 ui-monospace, SFMono-Regular, Menlo, monospace; letter-spacing: -.06em; }
        .cat-index-label { font-size: 11px; line-height: 1.35; opacity: .72; }
        .cat-section { padding: 88px 0; border-top: 1px solid var(--cat-line); }
        .cat-section-heading { max-width: 760px; margin: 0; font-size: clamp(32px, 4.6vw, 54px); line-height: 1.05; letter-spacing: -.04em; }
        .cat-section-copy { max-width: 680px; margin: 18px 0 0; color: var(--cat-muted); font-size: 17px; line-height: 1.7; }
        .cat-path { display: grid; grid-template-columns: 1.2fr .8fr 1.2fr; gap: 14px; margin-top: 42px; }
        .cat-path-item { min-height: 190px; padding: 24px; border-radius: 8px; background: var(--cat-panel); }
        .cat-path-item:nth-child(2) { background: var(--cat-panel-strong); transform: translateY(28px); }
        .cat-path h3 { margin: 0; font-size: 22px; }
        .cat-path p { margin: 13px 0 0; color: var(--cat-muted); line-height: 1.65; }
        .cat-skill-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1px; margin-top: 42px; overflow: hidden; border: 1px solid var(--cat-line); border-radius: 8px; background: var(--cat-line); }
        .cat-skill { min-height: 248px; padding: 26px; background: var(--cat-bg); text-decoration: none; color: inherit; transition: background .2s ease; }
        .cat-skill:hover, .cat-skill:focus-visible { background: var(--cat-panel); }
        .cat-skill-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 18px; }
        .cat-skill-mark { display: grid; width: 48px; height: 48px; place-items: center; border-radius: 8px; background: var(--cat-panel-strong); color: var(--cat-accent); font: 800 17px/1 ui-monospace, SFMono-Regular, Menlo, monospace; }
        .cat-skill-arrow { color: var(--cat-muted); font-size: 21px; }
        .cat-skill h3 { margin: 22px 0 0; font-size: 22px; letter-spacing: -.02em; }
        .cat-skill p { margin: 10px 0 0; color: var(--cat-muted); line-height: 1.6; }
        .cat-skill-meta { margin-top: 20px; color: var(--cat-accent); font: 600 11px/1.5 ui-monospace, SFMono-Regular, Menlo, monospace; }
        .cat-skill-use { margin-top: 7px; color: var(--cat-muted); font-size: 13px; }
        .cat-lab { display: grid; grid-template-columns: .78fr 1.22fr; gap: 18px; margin-top: 42px; }
        .cat-lab-copy, .cat-prompt { padding: 28px; border-radius: 8px; background: var(--cat-panel); }
        .cat-lab-copy h3 { margin: 0; font-size: 25px; }
        .cat-lab-copy p { color: var(--cat-muted); line-height: 1.7; }
        .cat-checks { margin: 24px 0 0; padding: 0; list-style: none; display: grid; gap: 13px; }
        .cat-checks li { padding-left: 23px; position: relative; line-height: 1.5; }
        .cat-checks li::before { content: "✓"; position: absolute; left: 0; color: var(--cat-accent); font-weight: 800; }
        .cat-prompt pre { margin: 0; white-space: pre-wrap; color: var(--cat-text); font: 13px/1.75 ui-monospace, SFMono-Regular, Menlo, monospace; }
        .cat-copy { margin-top: 22px; cursor: pointer; }
        .cat-note { margin-top: 18px; color: var(--cat-muted); font-size: 13px; line-height: 1.65; }
        .cat-footer { padding: 40px 0 58px; border-top: 1px solid var(--cat-line); color: var(--cat-muted); font-size: 13px; line-height: 1.7; }
        .cat-footer-inner { display: flex; justify-content: space-between; gap: 24px; }
        .cat-footer p { margin: 0; max-width: 720px; }
        @media (max-width: 800px) {
          .cat-shell { width: min(100% - 32px, 680px); }
          .cat-nav-links .cat-source { display: none; }
          .cat-hero { min-height: auto; grid-template-columns: 1fr; gap: 48px; padding: 54px 0 64px; }
          .cat-title { font-size: clamp(42px, 14vw, 64px); }
          .cat-index { grid-template-columns: repeat(5, minmax(52px, 1fr)); }
          .cat-index-card, .cat-index-card:nth-child(2), .cat-index-card:nth-child(5), .cat-index-card:nth-child(3) { min-height: 112px; padding: 12px; }
          .cat-index-label { display: none; }
          .cat-path, .cat-skill-grid, .cat-lab { grid-template-columns: 1fr; }
          .cat-path-item:nth-child(2) { transform: none; }
          .cat-section { padding: 64px 0; }
          .cat-footer-inner { display: grid; }
        }
        @media (prefers-reduced-motion: reduce) {
          .cat-button { transition: none; }
          .cat-button:hover, .cat-button:focus-visible { transform: none; }
        }
      `}</style>

      <nav className="cat-nav" aria-label="CAT Agent Skills 导航">
        <div className="cat-shell cat-nav-inner">
          <button className="cat-home" onClick={onHome}>← Da Lei 大雷</button>
          <div className="cat-nav-links">
            <a className="cat-link cat-source" href="#featured">培训精选</a>
            <a className="cat-link" href={OFFICIAL_REPO} target="_blank" rel="noreferrer">GitHub 源码</a>
          </div>
        </div>
      </nav>

      <main>
        <section className="cat-shell cat-hero">
          <div>
            <p className="cat-kicker">Microsoft CAT Agent Skills</p>
            <h1 className="cat-title">把好方法，装进你的 Agent。</h1>
            <p className="cat-lead">面向培训学员的中文入口。先理解 Skill，再选择、安装、测试，最后带回自己的真实工作场景。</p>
            <div className="cat-actions">
              <a className="cat-button cat-button-primary" href={OFFICIAL_GALLERY} target="_blank" rel="noreferrer">打开微软官方图库 ↗</a>
              <a className="cat-button" href="#workshop">复制培训练习</a>
            </div>
          </div>
          <div className="cat-index" aria-label="Agent Skill 能力示意">
            {[
              ['BR', 'Brief'], ['SK', 'Skill'], ['EV', 'Evaluate'], ['QA', 'Review'], ['GO', 'Apply'],
            ].map(([initials, label]) => (
              <div className="cat-index-card" key={initials}>
                <span className="cat-index-initials">{initials}</span>
                <span className="cat-index-label">{label}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="cat-section">
          <div className="cat-shell">
            <h2 className="cat-section-heading">Skill 不是一段很长的提示词。</h2>
            <p className="cat-section-copy">它是一套能被 Agent 在正确时机调用的工作方法，可以带说明、参考资料、模板和脚本。</p>
            <div className="cat-path">
              <article className="cat-path-item">
                <h3>找到合适的 Skill</h3>
                <p>按平台、任务和标签检索。先看触发条件，再看它需要什么权限和输入。</p>
              </article>
              <article className="cat-path-item">
                <h3>只安装可信内容</h3>
                <p>Skill 会使用 Agent 的权限。下载前阅读说明、脚本和外部依赖。</p>
              </article>
              <article className="cat-path-item">
                <h3>用真实场景测试</h3>
                <p>准备正常案例、边界案例和失败案例，记录差异，再决定是否投入工作。</p>
              </article>
            </div>
          </div>
        </section>

        <section className="cat-section" id="featured">
          <div className="cat-shell">
            <h2 className="cat-section-heading">培训优先体验这 7 个。</h2>
            <p className="cat-section-copy">从 Skill 编写、场景评估、平台选型，到 Agent 设计、评测和交付，组成一条完整练习路径。</p>
            <div className="cat-skill-grid">
              {FEATURED_SKILLS.map((skill) => (
                <a className="cat-skill" href={skill.href} target="_blank" rel="noreferrer" key={skill.name}>
                  <div className="cat-skill-top">
                    <span className="cat-skill-mark">{skill.initials}</span>
                    <span className="cat-skill-arrow" aria-hidden="true">↗</span>
                  </div>
                  <h3>{skill.name}</h3>
                  <p>{skill.summary}</p>
                  <div className="cat-skill-meta">{skill.platforms}</div>
                  <div className="cat-skill-use">适合：{skill.useFor}</div>
                </a>
              ))}
            </div>
            <div className="cat-actions">
              <a className="cat-button" href={OFFICIAL_GALLERY} target="_blank" rel="noreferrer">浏览完整官方目录 ↗</a>
            </div>
          </div>
        </section>

        <section className="cat-section" id="workshop">
          <div className="cat-shell">
            <h2 className="cat-section-heading">带走一套可重复的练习方法。</h2>
            <p className="cat-section-copy">选中任何一个 Skill，把下面这段发给你的 Agent，就能开始一次结构化评估。</p>
            <div className="cat-lab">
              <div className="cat-lab-copy">
                <h3>完成标准</h3>
                <p>培训结束时，不只要“安装成功”，还要能解释它为什么适合这个场景。</p>
                <ul className="cat-checks">
                  <li>说清触发条件与输入</li>
                  <li>检查权限、脚本和外部依赖</li>
                  <li>至少跑一个正常案例和一个失败案例</li>
                  <li>留下可复用的测试记录</li>
                </ul>
              </div>
              <div className="cat-prompt">
                <pre>{WORKSHOP_PROMPT}</pre>
                <button className="cat-button cat-button-primary cat-copy" onClick={copyWorkshopPrompt}>
                  {copied ? '已复制 ✓' : '复制培训评测提示词'}
                </button>
              </div>
            </div>
            <p className="cat-note">安全提醒：社区 Skill 以示例形式提供。只添加你信任的来源，并在授权访问邮件、文件、业务系统或执行脚本前完成审查。</p>
          </div>
        </section>
      </main>

      <footer className="cat-footer">
        <div className="cat-shell cat-footer-inner">
          <p>本页是大雷为培训学员整理的中文学习入口。Skill 内容、下载与最新版本以 Microsoft CAT Agent Skills 官方页面为准。</p>
          <a className="cat-link" href={OFFICIAL_REPO} target="_blank" rel="noreferrer">MIT License ↗</a>
        </div>
      </footer>
    </div>
  );
};

export default CatAgentSkills;
