import React, { useEffect, useMemo, useState } from 'react';
import courseData from './course-data-v4.json';

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
      const savedChecks = window.localStorage.getItem('copilot-demo-checks-v4');
      if (savedChecks) setChecks(JSON.parse(savedChecks));
    } catch {
      // The page remains fully usable when local storage is unavailable.
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = 'zh-CN';
    document.title = '让 Copilot 真正上岗｜CN Print 随课实践页';

    const description = 'CN Print Copilot 两小时分享随课实践页：任务说清、事实查准、方法复用。支持有权限跟练与无权限观察。';
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
        window.localStorage.setItem('copilot-demo-checks-v4', JSON.stringify(next));
      } catch {
        // Local progress is optional.
      }
      return next;
    });
  };

  const resetChecks = () => {
    setChecks({});
    try {
      window.localStorage.removeItem('copilot-demo-checks-v4');
    } catch {
      // Nothing else to do.
    }
  };

  const totalChecks = useMemo(() => data.demos.reduce((sum, demo) => sum + demo.checks.length, 0), []);
  const completedChecks = Object.values(checks).filter(Boolean).length;

  return (
    <div className="min-h-screen bg-paper font-sans text-ink selection:bg-gold/30">
      <div className="bg-vignette pointer-events-none fixed inset-0" aria-hidden="true" />
      <div className="bg-aurora pointer-events-none fixed inset-0 opacity-80" aria-hidden="true" />
      <div className="bg-grain pointer-events-none fixed inset-0 opacity-30" aria-hidden="true" />

      <header className="sticky top-0 z-40 border-b border-ink/10 bg-paper/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-8">
          <button onClick={onHome} className="group inline-flex min-h-11 items-center gap-3 text-sm font-semibold text-ink/70 transition hover:text-ink">
            <span className="grid h-9 w-9 place-items-center rounded-xl border border-ink/15 bg-surface/60 font-display text-lg font-bold text-gold transition group-hover:border-gold/50">大</span>
            <span className="hidden sm:inline">Da Lei · 大雷</span>
          </button>
          <nav className="hidden items-center gap-5 text-xs font-bold text-ink/55 lg:flex" aria-label="三段练习导航">
            <a className="hover:text-gold" href="#demo-1">任务说清</a>
            <a className="hover:text-gold" href="#demo-2">事实查准</a>
            <a className="hover:text-gold" href="#demo-3">方法复用</a>
          </nav>
          <a href={data.downloads.all} download className="inline-flex min-h-11 items-center rounded-full bg-ink px-4 py-2 text-xs font-bold text-paper transition hover:bg-gold">
            下载 V4 完整包
          </a>
        </div>
      </header>

      <main className="relative mx-auto max-w-6xl px-5 pb-24 pt-10 sm:px-8 sm:pt-16">
        <section className="grid gap-10 border-b border-ink/10 pb-14 lg:grid-cols-[1.08fr_.92fr] lg:items-center">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/10 px-3 py-1.5 text-xs font-semibold text-gold">
              2026-08-11 · 120 分钟 · 100+ 人 · 学员版 {data.meta.version}
            </div>
            <h1 className="max-w-3xl font-display text-5xl font-semibold leading-[0.98] tracking-[-0.035em] text-ink sm:text-6xl lg:text-7xl">
              让 Copilot
              <span className="block text-gold">真正上岗</span>
            </h1>
            <p className="mt-5 max-w-2xl font-display text-2xl font-semibold leading-8 text-ink/80">任务说清、事实查准、方法复用</p>
            <p className="mt-4 max-w-2xl text-base leading-7 text-ink/65 sm:text-lg sm:leading-8">同一个 Project Lighthouse 故事贯穿三段练习。有权限就跟练；暂时没有入口也能用观察卡、参考变化和自检继续学习。</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href="#choose-path" className="inline-flex min-h-11 items-center rounded-full bg-ink px-6 py-3 text-sm font-bold text-paper transition hover:bg-gold">先选择我的学习路径</a>
              <a href={data.downloads.handout} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center rounded-full border border-ink/15 bg-surface/50 px-6 py-3 text-sm font-bold text-ink transition hover:border-gold/50 hover:text-gold">打开可打印速查课件</a>
            </div>
          </div>
          <figure className="overflow-hidden rounded-[2rem] border border-ink/10 bg-surface/55 p-3 shadow-[0_24px_70px_rgb(var(--rgb-ink)/0.10)]">
            <img src="/copilot-demo-cover.svg" alt="Copilot 三段案例路径：任务、事实、方法" className="aspect-[16/9] w-full rounded-[1.4rem] object-cover" />
            <figcaption className="flex items-center justify-between gap-4 px-3 pb-2 pt-4 text-xs text-ink/50">
              <span>Project Lighthouse 课程虚构案例</span>
              <span>任务 → 事实 → 方法</span>
            </figcaption>
          </figure>
        </section>

        <section id="choose-path" className="scroll-mt-24 py-14">
          <div className="grid gap-6 rounded-[2rem] border border-gold/25 bg-gold/8 p-6 sm:p-8 lg:grid-cols-[.78fr_1.22fr]">
            <div>
              <p className="text-sm font-bold text-gold">先选路径，不用等全员同步</p>
              <h2 className="mt-3 font-display text-4xl font-semibold tracking-tight">你今天更适合跟练，还是观察？</h2>
              <p className="mt-4 text-sm leading-7 text-ink/65">电脑更适合下载、上传和创建 Agent；手机建议使用观察模式。两条路径都能完成课程。</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <button onClick={() => chooseMode('practice')} aria-pressed={mode === 'practice'} className={`min-h-28 rounded-3xl border p-5 text-left transition ${mode === 'practice' ? 'border-ink bg-ink text-paper' : 'border-ink/10 bg-paper/60 hover:border-gold/50'}`}>
                <span className="text-xs font-bold text-gold">我有对应权限</span>
                <strong className="mt-3 block font-display text-2xl">开始跟练</strong>
                <span className={`mt-2 block text-sm leading-6 ${mode === 'practice' ? 'text-paper/65' : 'text-ink/60'}`}>下载材料、复制提示词、完成本地自检。</span>
              </button>
              <button onClick={() => chooseMode('observe')} aria-pressed={mode === 'observe'} className={`min-h-28 rounded-3xl border p-5 text-left transition ${mode === 'observe' ? 'border-ink bg-ink text-paper' : 'border-ink/10 bg-paper/60 hover:border-gold/50'}`}>
                <span className="text-xs font-bold text-gold">我暂时没有入口</span>
                <strong className="mt-3 block font-display text-2xl">进入观察模式</strong>
                <span className={`mt-2 block text-sm leading-6 ${mode === 'observe' ? 'text-paper/65' : 'text-ink/60'}`}>看输入、前后变化、参考结构与停止点。</span>
              </button>
            </div>
          </div>
          <div className="mt-4 flex gap-3 rounded-2xl border border-ink/10 bg-surface/45 p-5 text-sm leading-6 text-ink/70">
            <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-gold" />
            <p><strong className="text-ink">隐私与权限提醒：</strong>{data.meta.privacy}</p>
          </div>
        </section>

        <section className="pb-14">
          <div className="max-w-3xl">
            <p className="text-sm font-bold text-gold">一场分享，三个完整故事</p>
            <h2 className="mt-3 font-display text-4xl font-semibold tracking-tight sm:text-5xl">不追求把所有功能都试一遍，只完成三次关键升级</h2>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {data.demos.map((demo) => (
              <a key={demo.id} href={`#${demo.id}`} className="group rounded-3xl border border-ink/10 bg-surface/45 p-6 transition hover:-translate-y-1 hover:border-gold/45 hover:bg-surface/70">
                <div className="flex items-center justify-between gap-4 text-xs font-semibold text-ink/45"><span>{demo.product}</span><span>{demo.slide}</span></div>
                <h3 className="mt-6 font-display text-2xl font-semibold leading-tight group-hover:text-gold">{demo.title}</h3>
                <p className="mt-3 text-xs font-bold text-gold">{demo.status} · {demo.duration}</p>
                <p className="mt-4 text-sm leading-6 text-ink/60">{demo.question}</p>
                <div className="mt-6 text-sm font-bold text-gold">打开案例 →</div>
              </a>
            ))}
          </div>
        </section>

        <div className="space-y-14">
          {data.demos.map((demo, demoIndex) => {
            const done = demo.checks.filter((_, index) => checks[`${demo.id}-${index}`]).length;
            return (
              <section id={demo.id} key={demo.id} className="scroll-mt-24 overflow-hidden rounded-[2rem] border border-ink/10 bg-surface/52 shadow-[0_24px_80px_rgb(var(--rgb-ink)/0.08)]">
                <div className="border-b border-ink/10 bg-paper/50 px-6 py-4 sm:px-9">
                  <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-semibold">
                    <div className="flex flex-wrap gap-2 text-ink/55">
                      <span className="rounded-full border border-ink/10 px-3 py-1">{demo.product}</span>
                      <span className="rounded-full border border-ink/10 px-3 py-1">{demo.slide}</span>
                      <span className="rounded-full border border-ink/10 px-3 py-1">{demo.duration}</span>
                    </div>
                    <span className="rounded-full border border-gold/30 bg-gold/10 px-3 py-1 text-gold">{demo.status}</span>
                  </div>
                </div>

                <div className="grid lg:grid-cols-[.88fr_1.12fr]">
                  <div className="border-b border-ink/10 p-7 sm:p-9 lg:border-b-0 lg:border-r">
                    <div className="text-xs font-bold text-gold">Demo {demoIndex + 1}｜你收到的任务</div>
                    <h2 className="mt-4 font-display text-4xl font-semibold tracking-tight sm:text-5xl">{demo.title}</h2>
                    <p className="mt-6 text-base leading-7 text-ink/70">{demo.story}</p>
                    <div className="mt-6 rounded-2xl border border-ink/10 bg-paper/55 p-5">
                      <div className="text-xs font-bold text-ink/45">开始前先想一想</div>
                      <p className="mt-2 font-display text-xl font-semibold leading-7">{demo.question}</p>
                    </div>
                    <div className="mt-6 rounded-2xl border border-gold/25 bg-gold/8 p-5 text-sm leading-6 text-ink/70">
                      <strong className="block text-gold">权限前提</strong>
                      <span className="mt-2 block">{demo.access}</span>
                    </div>
                    <div className="mt-7 text-xs font-bold text-ink/45">你会用到</div>
                    <div className="mt-3 space-y-2">
                      {demo.inputs.map((input) => (
                        <a key={input.name} href={input.href} target="_blank" rel="noreferrer" className="flex min-h-14 items-center justify-between gap-4 rounded-2xl border border-ink/10 bg-paper/45 p-4 transition hover:border-gold/45">
                          <span><strong className="block text-sm">{input.name}</strong><span className="mt-1 block text-xs text-ink/50">{input.detail}</span></span>
                          <span className="shrink-0 text-xs font-bold text-gold">打开 / 下载</span>
                        </a>
                      ))}
                    </div>
                  </div>

                  <div className="p-7 sm:p-9">
                    <div className="flex items-center justify-between gap-4">
                      <div className="text-xs font-bold text-gold">{mode === 'practice' ? '跟着完成' : '观察讲师完成'}</div>
                      <span className="rounded-full bg-ink px-3 py-1.5 text-xs font-bold text-paper">{mode === 'practice' ? '跟练模式' : '观察模式'}</span>
                    </div>
                    <ol className="mt-5 space-y-4">
                      {demo.steps.map((step, index) => (
                        <li key={step} className="flex gap-4 text-sm leading-6 text-ink/75">
                          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-gold/10 text-xs font-bold text-gold">{index + 1}</span>
                          <span>{step}</span>
                        </li>
                      ))}
                    </ol>

                    <div className="mt-8 space-y-4">
                      {demo.prompts.map((prompt) => {
                        const state = copied?.id === prompt.id ? copied : null;
                        const rows = Math.min(12, Math.max(2, prompt.text.split('\n').length + Math.ceil(prompt.text.length / 90)));
                        return (
                          <div key={prompt.id} className="rounded-2xl border border-ink/10 bg-paper/65 p-5">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                              <div className="text-xs font-bold text-ink/55">{prompt.label}</div>
                              <button onClick={() => copy(prompt.id, prompt.text)} className={`min-h-11 rounded-full border px-3 py-1.5 text-xs font-bold transition ${state && !state.ok ? 'border-red-400/50 bg-red-50 text-red-700' : 'border-gold/30 bg-gold/10 text-gold hover:bg-gold hover:text-paper'}`}>
                                {state ? (state.ok ? '已复制 ✓' : '复制失败，请手动选择') : '复制提示词'}
                              </button>
                            </div>
                            <textarea readOnly value={prompt.text} rows={rows} onFocus={(event) => event.currentTarget.select()} className="mt-4 w-full resize-y rounded-xl border border-ink/10 bg-surface/30 p-4 font-mono text-sm leading-6 text-ink/75 outline-none focus:border-gold/50" aria-label={`${prompt.label}提示词`} />
                          </div>
                        );
                      })}
                    </div>

                    <div className="mt-6 rounded-2xl border border-gold/25 bg-gold/8 p-5">
                      <div className="text-xs font-bold text-gold">{mode === 'observe' ? '观察路径｜重点看什么' : '跟练路径｜完成后对比'}</div>
                      <ul className="mt-3 space-y-2 text-sm leading-6 text-ink/70">
                        {demo.observe.map((item) => <li key={item} className="flex gap-3"><span className="text-gold">—</span><span>{item}</span></li>)}
                      </ul>
                      <p className="mt-4 border-t border-gold/20 pt-4 text-sm leading-6 text-ink/65">{demo.reference}</p>
                    </div>

                    <div className="mt-6 rounded-2xl border border-ink/10 p-5">
                      <div className="flex items-center justify-between gap-4">
                        <div className="text-xs font-bold text-gold">完成后自检</div>
                        <span className="text-xs font-bold text-ink/45">本机记录 {done}/{demo.checks.length}</span>
                      </div>
                      <div className="mt-3 space-y-2">
                        {demo.checks.map((check, index) => {
                          const id = `${demo.id}-${index}`;
                          return (
                            <label key={check} className="flex min-h-11 cursor-pointer items-start gap-3 rounded-xl px-2 py-2 text-sm leading-6 text-ink/70 transition hover:bg-paper/60">
                              <input type="checkbox" checked={Boolean(checks[id])} onChange={() => toggleCheck(id)} className="mt-1 h-5 w-5 shrink-0 accent-[#9a6c21]" />
                              <span>{check}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>

                    <details className="mt-6 rounded-2xl border border-ink/10 bg-paper/35 p-5">
                      <summary className="cursor-pointer text-sm font-bold text-ink">遇到问题怎么办？</summary>
                      <ul className="mt-4 space-y-2 text-sm leading-6 text-ink/65">
                        {demo.fallbacks.map((item) => <li key={item} className="flex gap-3"><span className="text-gold">•</span><span>{item}</span></li>)}
                      </ul>
                      <p className="mt-4 border-t border-ink/10 pt-4 text-sm leading-6 text-ink/65"><strong className="text-ink">容易踩坑：</strong>{demo.mistake}</p>
                    </details>

                    <div className="mt-6 flex flex-col gap-4 rounded-2xl bg-ink p-5 text-paper sm:flex-row sm:items-center sm:justify-between">
                      <p className="font-display text-xl font-semibold leading-7">{demo.takeaway}</p>
                      <a href={demo.download} download className="inline-flex min-h-11 shrink-0 items-center rounded-full bg-paper px-4 py-2.5 text-xs font-bold text-ink transition hover:bg-gold hover:text-paper">下载本段 V4 材料</a>
                    </div>
                  </div>
                </div>
              </section>
            );
          })}
        </div>

        <section className="mt-20 border-y border-ink/10 py-16">
          <div className="grid gap-10 lg:grid-cols-[.72fr_1.28fr]">
            <div>
              <p className="text-sm font-bold text-gold">你的 120 分钟学习路线</p>
              <h2 className="mt-3 font-display text-4xl font-semibold tracking-tight sm:text-5xl">三次升级，最后落到七天小任务</h2>
              <p className="mt-5 leading-7 text-ink/65">Demo 约占 45 分钟，其余时间用来理解原因、判断边界、回看来源和带走方法。</p>
            </div>
            <div className="divide-y divide-ink/10 border-y border-ink/10">
              {data.schedule.map(([time, title, detail]) => (
                <div key={time} className="grid gap-2 py-4 sm:grid-cols-[72px_170px_1fr] sm:items-start">
                  <span className="font-mono text-xs font-bold text-gold">{time}</span>
                  <strong className="text-sm">{title}</strong>
                  <span className="text-sm leading-6 text-ink/60">{detail}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-20 rounded-[2rem] border border-ink/10 bg-surface/45 p-7 sm:p-9">
          <div className="grid gap-10 lg:grid-cols-[.72fr_1.28fr]">
            <div>
              <p className="text-sm font-bold text-gold">我为什么看不到同样的按钮？</p>
              <h2 className="mt-3 font-display text-4xl font-semibold tracking-tight">先检查授权、策略、权限与产品状态</h2>
              <p className="mt-5 leading-7 text-ink/65">看不到入口很常见，不代表操作失败。按顺序检查，仍不可用就走观察路径。</p>
            </div>
            <ol className="grid gap-3 sm:grid-cols-2">
              {data.accessChecks.map((item, index) => (
                <li key={item} className="flex gap-3 rounded-2xl border border-ink/10 bg-paper/50 p-4 text-sm leading-6 text-ink/70">
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-gold/10 text-xs font-bold text-gold">{index + 1}</span>
                  <span>{item}</span>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="mt-20 rounded-[2rem] border border-ink/10 bg-ink p-8 text-paper sm:p-10">
          <div className="grid gap-10 lg:grid-cols-[.68fr_1.32fr]">
            <div>
              <p className="text-sm font-bold text-gold">三个新信号，三种不同状态</p>
              <h2 className="mt-3 font-display text-4xl font-semibold tracking-tight">先看状态与边界，再看新闻标题</h2>
              <p className="mt-5 leading-7 text-paper/65">这一段只做趋势科普，不新增第四个 Demo。状态核对日期：{data.meta.updated}。</p>
            </div>
            <div className="divide-y divide-paper/15 border-y border-paper/15">
              {data.trends.map((trend) => (
                <article key={trend.title} className="py-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h3 className="font-display text-2xl font-semibold text-gold">{trend.title}</h3>
                    <span className="rounded-full border border-paper/20 px-3 py-1 text-xs font-bold text-paper/70">{trend.status}</span>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-paper/75">{trend.text}</p>
                  <p className="mt-2 text-sm leading-6 text-paper/55">边界：{trend.caution}</p>
                  <a href={trend.link} target="_blank" rel="noreferrer" className="mt-3 inline-block text-xs font-bold text-paper/60 transition hover:text-gold">查看官方来源 ↗</a>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-20 rounded-[2rem] border border-gold/25 bg-gold/8 p-7 sm:p-9">
          <div className="grid gap-10 lg:grid-cols-[.72fr_1.28fr]">
            <div>
              <p className="text-sm font-bold text-gold">Leader 落地卡</p>
              <h2 className="mt-3 font-display text-4xl font-semibold tracking-tight">不先数 Agent，先把五件事定清楚</h2>
            </div>
            <ol className="space-y-3">
              {data.leaderChecks.map((item, index) => (
                <li key={item} className="flex min-h-12 items-center gap-4 rounded-2xl border border-ink/10 bg-paper/55 px-4 py-3 text-sm font-semibold text-ink/75">
                  <span className="font-mono text-xs font-bold text-gold">0{index + 1}</span>
                  <span>{item}</span>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="mt-20 rounded-[2rem] border border-gold/25 bg-gold/10 p-8 text-center sm:p-12">
          <p className="text-sm font-bold text-gold">把练习带回去</p>
          <h2 className="mx-auto mt-3 max-w-3xl font-display text-4xl font-semibold tracking-tight sm:text-5xl">页面、V4 素材、速查课件和七天行动卡都在这里</h2>
          <p className="mx-auto mt-5 max-w-2xl leading-7 text-ink/65">不用把三段全部重做。选最贴近自己的一段，完整跑一遍，留下输入、结果、人工修改和一个仍待解决的问题。</p>
          <div className="mt-5 text-sm font-bold text-ink/55" aria-live="polite">本机自检记录：{completedChecks}/{totalChecks}</div>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <a href={data.downloads.all} download className="inline-flex min-h-11 items-center rounded-full bg-ink px-6 py-3 text-sm font-bold text-paper transition hover:bg-gold">下载 Learner Kit V4</a>
            <a href={data.downloads.handout} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center rounded-full border border-ink/15 bg-paper/55 px-6 py-3 text-sm font-bold text-ink transition hover:border-gold/50 hover:text-gold">打开可打印课件</a>
            <a href={data.downloads.prompts} download className="inline-flex min-h-11 items-center rounded-full border border-ink/15 bg-paper/55 px-6 py-3 text-sm font-bold text-ink transition hover:border-gold/50 hover:text-gold">下载提示词全集</a>
            <button onClick={resetChecks} className="inline-flex min-h-11 items-center rounded-full border border-ink/15 bg-paper/55 px-6 py-3 text-sm font-bold text-ink transition hover:border-gold/50 hover:text-gold">重置本机自检</button>
          </div>
          <p className="mt-6 text-xs leading-5 text-ink/45">课程资料版本 {data.meta.version} · 更新 {data.meta.updated} · 所有角色、日期与业务内容均为培训虚构数据</p>
        </section>
      </main>
    </div>
  );
};

export default CopilotDemo;
