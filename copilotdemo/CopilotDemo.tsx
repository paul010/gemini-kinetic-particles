import React, { useEffect, useMemo, useState } from 'react';
import courseData from './course-data-v4.json';
import './copilot-demo-notebook.css';

interface CopilotDemoProps {
  onHome: () => void;
}

type Mode = 'practice' | 'observe';

type InputFile = {
  name: string;
  detail: string;
  href: string;
};

type PromptBlock = {
  id: string;
  label: string;
  text: string;
};

type Demo = {
  id: string;
  slide: string;
  duration: string;
  product: string;
  access: string;
  status: string;
  title: string;
  story: string;
  question: string;
  inputs: InputFile[];
  steps: string[];
  prompts: PromptBlock[];
  observe: string[];
  reference: string;
  checks: string[];
  mistake: string;
  takeaway: string;
  fallbacks: string[];
  download: string;
};

type Trend = {
  title: string;
  status: string;
  text: string;
  caution: string;
  link: string;
};

type CourseData = {
  meta: {
    version: string;
    updated: string;
    courseDate: string;
    title: string;
    subtitle: string;
    publicUrl: string;
    project: string;
    privacy: string;
  };
  downloads: Record<string, string>;
  demos: Demo[];
  schedule: string[][];
  trends: Trend[];
  accessChecks: string[];
  leaderChecks: string[];
};

const data = courseData as CourseData;

const CopilotDemo: React.FC<CopilotDemoProps> = ({ onHome }) => {
  const [mode, setMode] = useState<Mode>('observe');
  const [copied, setCopied] = useState<{ id: string; ok: boolean } | null>(null);
  const [checks, setChecks] = useState<Record<string, boolean>>({});

  useEffect(() => {
    try {
      const savedMode = window.localStorage.getItem('copilot-demo-mode');
      if (savedMode === 'practice' || savedMode === 'observe') setMode(savedMode);
      const savedChecks = window.localStorage.getItem('copilot-demo-checks-v6');
      if (savedChecks) setChecks(JSON.parse(savedChecks));
    } catch {
      // The page remains fully usable when local storage is unavailable.
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = 'zh-CN';
    document.title = '让 Copilot 真正上岗｜CN Print 随课实践页';

    const description = 'CN Print Copilot 两小时分享随课实践页：从 Copilot Chat、Microsoft 365 Copilot 到 Agent Builder 与 Copilot Studio。';
    const setMeta = (selector: string, attribute: string, value: string) => {
      const element = document.querySelector<HTMLMetaElement>(selector);
      if (element) element.setAttribute(attribute, value);
    };
    setMeta('meta[name="description"]', 'content', description);
    setMeta('meta[property="og:title"]', 'content', document.title);
    setMeta('meta[property="og:description"]', 'content', description);
    setMeta('meta[property="og:url"]', 'content', data.meta.publicUrl);
    setMeta('meta[property="og:image"]', 'content', 'https://dailycosmos.net/copilot-demo-cover.svg');
    setMeta('meta[name="twitter:title"]', 'content', document.title);
    setMeta('meta[name="twitter:description"]', 'content', description);
    setMeta('meta[name="twitter:image"]', 'content', 'https://dailycosmos.net/copilot-demo-cover.svg');
    const canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (canonical) canonical.href = data.meta.publicUrl;
  }, []);

  useEffect(() => {
    const elements = Array.from(document.querySelectorAll<HTMLElement>('.notebook-reveal'));
    if (!('IntersectionObserver' in window)) {
      elements.forEach((element) => element.classList.add('is-seen'));
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-seen');
            observer.unobserve(entry.target);
          }
        });
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.08 },
    );
    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const scrollToHash = () => {
      const id = decodeURIComponent(window.location.hash.slice(1));
      if (!id) return;
      window.requestAnimationFrame(() => {
        document.getElementById(id)?.scrollIntoView({ block: 'start' });
      });
    };

    const timer = window.setTimeout(scrollToHash, 0);
    window.addEventListener('hashchange', scrollToHash);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('hashchange', scrollToHash);
    };
  }, []);

  const chooseMode = (next: Mode) => {
    setMode(next);
    try {
      window.localStorage.setItem('copilot-demo-mode', next);
    } catch {
      // No persistence is required to use the page.
    }
  };

  const copy = async (id: string, value: string) => {
    let ok = false;
    try {
      await Promise.race([
        navigator.clipboard.writeText(value),
        new Promise<never>((_, reject) => window.setTimeout(() => reject(new Error('Clipboard timeout')), 800)),
      ]);
      ok = true;
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = value;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      ok = document.execCommand('copy');
      textarea.remove();
    }
    setCopied({ id, ok });
    window.setTimeout(() => setCopied(null), 2200);
  };

  const toggleCheck = (id: string) => {
    setChecks((current) => {
      const next = { ...current, [id]: !current[id] };
      try {
        window.localStorage.setItem('copilot-demo-checks-v6', JSON.stringify(next));
      } catch {
        // Local progress is optional.
      }
      return next;
    });
  };

  const resetChecks = () => {
    setChecks({});
    try {
      window.localStorage.removeItem('copilot-demo-checks-v6');
    } catch {
      // Nothing else to do.
    }
  };

  const totalChecks = useMemo(() => data.demos.reduce((sum, demo) => sum + demo.checks.length, 0), []);
  const completedChecks = Object.values(checks).filter(Boolean).length;

  return (
    <div className="copilot-notebook min-h-[100dvh]">
      <div className="notebook-canvas" aria-hidden="true" />

      <header className="notebook-nav">
        <div className="notebook-nav-inner">
          <button onClick={onHome} className="notebook-brand">
            <span className="notebook-brand-mark">大</span>
            <span className="notebook-brand-name">Da Lei / 大雷</span>
          </button>
          <nav className="notebook-links" aria-label="三段练习导航">
            <a href="#demo-1">任务说清</a>
            <a href="#demo-2">事实查准</a>
            <a href="#demo-3">Agent 上岗</a>
          </nav>
          <a href={data.downloads.all} download className="ink-button ink-button-small">下载精简演示包</a>
        </div>
      </header>

      <main className="notebook-shell">
        <section className="notebook-hero notebook-reveal is-seen">
          <div className="notebook-hero-copy">
            <p className="course-kicker">CN PRINT COPILOT</p>
            <h1>让 Copilot <span className="marker-word">真正上岗</span></h1>
            <p className="hero-summary">任务说清。事实查准。方法留下。三段练习都能跟着做，也能看着学。</p>
            <div className="hero-actions">
              <a href="#choose-path" className="ink-button">选择学习路径</a>
              <a href={data.downloads.all} download className="paper-button">下载精简演示包</a>
            </div>
          </div>

          <figure className="notebook-hero-art">
            <img src="/copilot-demo-hero-notebook.webp" alt="手绘纸张上的三段学习路径：对话、四份材料和团队方法" />
            <figcaption>
              <span>Project Lighthouse 虚构案例</span>
              <strong>任务 → 事实 → 方法</strong>
            </figcaption>
          </figure>
        </section>

        <section id="choose-path" className="path-section notebook-reveal">
          <div className="section-heading">
            <p className="hand-note">先选路径，不必等全员同步</p>
            <h2>你今天更适合跟练，还是观察？</h2>
            <p>电脑更适合下载、上传和创建 Agent。手机建议使用观察模式，两条路径都能完成课程。</p>
          </div>

          <div className="path-choices">
            <button onClick={() => chooseMode('practice')} aria-pressed={mode === 'practice'} className={`path-card ${mode === 'practice' ? 'is-active' : ''}`}>
              <span className="path-tag">我有对应权限</span>
              <strong>开始跟练</strong>
              <span>下载材料，复制提示词，完成本地自检。</span>
            </button>
            <button onClick={() => chooseMode('observe')} aria-pressed={mode === 'observe'} className={`path-card path-card-observe ${mode === 'observe' ? 'is-active' : ''}`}>
              <span className="path-tag">我暂时没有入口</span>
              <strong>进入观察模式</strong>
              <span>看输入、前后变化、参考结构与停止点。</span>
            </button>
          </div>

          <aside className="privacy-note">
            <strong>先看这一条</strong>
            <p>{data.meta.privacy}</p>
          </aside>
        </section>

        <section className="story-section notebook-reveal">
          <div className="section-heading">
            <p className="hand-note">同一个故事，三次升级</p>
            <h2>不逛功能菜单，只完成三个真实任务</h2>
          </div>
          <div className="story-map">
            {data.demos.map((demo, index) => (
              <a key={demo.id} href={`#${demo.id}`} className={`story-stop story-stop-${index + 1}`}>
                <span className="story-verb">{index === 0 ? '任务' : index === 1 ? '事实' : '方法'}</span>
                <h3>{demo.title}</h3>
                <p>{demo.question}</p>
                <span className="story-meta"><b>{demo.product}</b><i>{demo.duration}</i></span>
              </a>
            ))}
          </div>
        </section>

        <div className="demo-stack">
          {data.demos.map((demo, demoIndex) => {
            const done = demo.checks.filter((_, index) => checks[`${demo.id}-${index}`]).length;
            return (
              <section id={demo.id} key={demo.id} className={`demo-spread demo-spread-${demoIndex + 1} notebook-reveal`}>
                <header className="demo-masthead">
                  <div>
                    <span>{demo.product}</span>
                    <span>{demo.slide}</span>
                    <span>{demo.duration}</span>
                  </div>
                  <strong>{demo.status}</strong>
                </header>

                <div className="demo-layout">
                  <aside className="task-page">
                    <p className="hand-note">Demo {demoIndex + 1} / 你收到的任务</p>
                    <h2>{demo.title}</h2>
                    <p className="task-story">{demo.story}</p>

                    <div className="question-scrap">
                      <span>开始前先想一想</span>
                      <strong>{demo.question}</strong>
                    </div>

                    <div className="access-scrap">
                      <strong>权限前提</strong>
                      <p>{demo.access}</p>
                    </div>

                    <h3 className="mini-heading">你会用到</h3>
                    <div className="file-list">
                      {demo.inputs.map((input) => (
                        <a key={input.name} href={input.href} target="_blank" rel="noreferrer" className="file-slip">
                          <span><strong>{input.name}</strong><small>{input.detail}</small></span>
                          <b>打开</b>
                        </a>
                      ))}
                    </div>
                  </aside>

                  <div className="work-page">
                    <div className="mode-line">
                      <p className="hand-note">{mode === 'practice' ? '跟着完成' : '观察讲师完成'}</p>
                      <span>{mode === 'practice' ? '跟练模式' : '观察模式'}</span>
                    </div>

                    <ol className="step-path">
                      {demo.steps.map((step, index) => (
                        <li key={step}><b>{index + 1}</b><span>{step}</span></li>
                      ))}
                    </ol>

                    <div className="prompt-stack">
                      {demo.prompts.map((prompt) => {
                        const state = copied?.id === prompt.id ? copied : null;
                        const rows = Math.min(12, Math.max(2, prompt.text.split('\n').length + Math.ceil(prompt.text.length / 90)));
                        return (
                          <article key={prompt.id} className="prompt-sheet">
                            <div className="prompt-head">
                              <strong>{prompt.label}</strong>
                              <button onClick={() => copy(prompt.id, prompt.text)} className={state && !state.ok ? 'copy-failed' : ''}>
                                {state ? (state.ok ? '已复制 ✓' : '复制失败，请手动选择') : '复制提示词'}
                              </button>
                            </div>
                            <textarea readOnly value={prompt.text} rows={rows} onFocus={(event) => event.currentTarget.select()} aria-label={`${prompt.label}提示词`} />
                          </article>
                        );
                      })}
                    </div>

                    <div className="observe-sheet">
                      <h3>{mode === 'observe' ? '观察路径：重点看什么' : '跟练路径：完成后对比'}</h3>
                      <ul>{demo.observe.map((item) => <li key={item}><span>↳</span><p>{item}</p></li>)}</ul>
                      <p className="reference-note">{demo.reference}</p>
                    </div>

                    <div className="check-sheet">
                      <div className="check-head"><h3>完成后自检</h3><span>本机记录 {done}/{demo.checks.length}</span></div>
                      <div className="check-list">
                        {demo.checks.map((check, index) => {
                          const id = `${demo.id}-${index}`;
                          return (
                            <label key={check}>
                              <input type="checkbox" checked={Boolean(checks[id])} onChange={() => toggleCheck(id)} />
                              <span>{check}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>

                    <details className="fallback-fold">
                      <summary>遇到问题怎么办？</summary>
                      <ul>{demo.fallbacks.map((item) => <li key={item}>{item}</li>)}</ul>
                      <p><strong>容易踩坑：</strong>{demo.mistake}</p>
                    </details>

                    <footer className="demo-takeaway">
                      <p>{demo.takeaway}</p>
                      <a href={demo.download} download className="paper-button">下载本段材料</a>
                    </footer>
                  </div>
                </div>
              </section>
            );
          })}
        </div>

        <section className="schedule-section notebook-reveal">
          <div className="section-heading">
            <p className="hand-note">你的 120 分钟学习路线</p>
            <h2>三次升级，最后落到七天小任务</h2>
            <p>Demo 约占 45 分钟，其余时间用来理解原因、判断边界、回看来源和带走方法。</p>
          </div>
          <div className="schedule-strip" aria-label="课程时间安排">
            {data.schedule.map(([time, title, detail], index) => (
              <article key={time} className={`schedule-note schedule-note-${(index % 3) + 1}`}>
                <time>{time}</time>
                <strong>{title}</strong>
                <p>{detail}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="access-section notebook-reveal">
          <div className="section-heading">
            <p className="hand-note">我为什么看不到同样的按钮？</p>
            <h2>先检查授权、策略、权限与产品状态</h2>
            <p>看不到入口很常见，不代表操作失败。按顺序检查，仍不可用就走观察路径。</p>
          </div>
          <ol className="access-grid">
            {data.accessChecks.map((item, index) => <li key={item}><b>{index + 1}</b><span>{item}</span></li>)}
          </ol>
        </section>

        <section className="trend-section notebook-reveal">
          <div className="section-heading">
            <p className="hand-note">对应 PPT 37-42</p>
            <h2>从 Agent Builder 到 Copilot Studio</h2>
            <p>先把知识角色创建、配置和测试跑稳。只有需要动作、系统、渠道与治理时，才升级到 Copilot Studio。口径核对日期：{data.meta.updated}。</p>
          </div>
          <div className="trend-grid">
            {data.trends.map((trend, index) => (
              <article key={trend.title} className={`trend-note trend-note-${index + 1}`}>
                <div><h3>{trend.title}</h3><span>{trend.status}</span></div>
                <p>{trend.text}</p>
                <p className="trend-caution"><strong>边界：</strong>{trend.caution}</p>
                <a href={trend.link} target="_blank" rel="noreferrer">查看官方来源 ↗</a>
              </article>
            ))}
          </div>
        </section>

        <section className="leader-section notebook-reveal">
          <div className="section-heading">
            <p className="hand-note">Leader 落地卡</p>
            <h2>不先数 Agent，先把五件事定清楚</h2>
          </div>
          <ol className="leader-list">
            {data.leaderChecks.map((item, index) => <li key={item}><b>0{index + 1}</b><span>{item}</span></li>)}
          </ol>
        </section>

        <section className="take-home-section notebook-reveal">
          <p className="hand-note">把练习带回去</p>
          <h2>六个入口，现场和课后都找得到</h2>
          <p>完整包只保留三段演示真正会用到的文件。也可以单独下载某一段、全部提示词或速查 PDF。</p>
          <div className="progress-copy" aria-live="polite">本机自检记录：{completedChecks}/{totalChecks}</div>
          <div className="take-home-actions">
            <a href={data.downloads.all} download className="ink-button">下载精简演示包</a>
            <a href={data.downloads.demo1} download className="paper-button">Demo 1</a>
            <a href={data.downloads.demo2} download className="paper-button">Demo 2</a>
            <a href={data.downloads.demo3} download className="paper-button">Demo 3</a>
            <a href={data.downloads.prompts} download className="paper-button">下载提示词</a>
            <a href={data.downloads.handout} download className="paper-button">速查 PDF</a>
            <button onClick={resetChecks} className="paper-button">重置自检</button>
          </div>
        </section>

        <footer className="notebook-footer">
          <span>课程资料 {data.meta.version}</span>
          <span>更新 {data.meta.updated}</span>
          <span>所有角色、日期与业务内容均为培训虚构数据</span>
        </footer>
      </main>
    </div>
  );
};

export default CopilotDemo;
