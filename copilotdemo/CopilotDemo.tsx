import React, { useEffect, useState } from 'react';

interface CopilotDemoProps {
  onHome: () => void;
}

type Demo = {
  id: string;
  slide: string;
  eyebrow: string;
  title: string;
  summary: string;
  steps: string[];
  prompt: string;
  copyLabel: string;
  result: string;
  gate: string;
  accent: string;
  soft: string;
  download: string;
};

const downloads = {
  all: '/copilot-demo/CN-Print-Copilot-学员Demo素材包-v3.zip',
  demo1: '/copilot-demo/CN-Print-Copilot-Demo1-学员素材-v3.zip',
  demo2: '/copilot-demo/CN-Print-Copilot-Demo2-学员素材-v3.zip',
  demo3: '/copilot-demo/CN-Print-Copilot-Demo3-学员素材-v3.zip',
};

const demos: Demo[] = [
  {
    id: 'demo-1',
    slide: 'PPT 09',
    eyebrow: 'Demo 1 · Copilot Chat',
    title: '一句话，三轮升级',
    summary: '把“帮我写一个更新”升级成目标、背景、标准、来源都清楚的任务说明书。',
    steps: [
      '第一轮故意模糊，结果出来后停 3 秒。',
      '请观众判断：对象、范围、依据、未知项缺了什么。',
      '第二轮先让 Copilot 诊断任务，不急着重写。',
      '附加背景材料，再输入四要素完整版。',
      '最后区分事实、归纳和待确认项。',
    ],
    prompt: '先不要写。请告诉我：要把这个请求变成一项可执行任务，我还需要补充哪些信息？请按目标、背景、输出标准、信息来源四类提问。',
    copyLabel: '复制第二轮提示词',
    result: '观众能清楚看见第一轮和第三轮的结构差异；未确认信息不会被补成事实。',
    gate: '不是咒语，是任务说明书。',
    accent: '#22d3ee',
    soft: 'rgba(34,211,238,.12)',
    download: downloads.demo1,
  },
  {
    id: 'demo-2',
    slide: 'PPT 15–17',
    eyebrow: 'Demo 2 · Microsoft 365 Copilot',
    title: '四份材料，一页接手简报',
    summary: '邮件、会议纪要、Teams 聊天和 Excel 状态表先做事实审计，再按对象重组。',
    steps: [
      '只附加 01–04 四份输入材料，不上传黄金答案。',
      '先列已确认事实、冲突、缺失和行动项。',
      '点开至少两处引用：8 月 18 日、保修期限。',
      '生成一页接手简报，再改成三个对象版本。',
      '最后读出 Leader 需要回答的范围决策。',
    ],
    prompt: '只依据这 4 份 Project Lighthouse 材料，整理一份事实核对表。分为：已确认事实、材料冲突、缺失信息、行动项。每一条必须标出来源文件；无法确认的内容写“未确认”。先不要写管理层总结，也不要自行选择冲突中的一方。',
    copyLabel: '复制事实审计提示词',
    result: '8/16 = 旧计划；8/18 = 内部试运行；保修期 12/24 个月 = 未确认；China Social 只保留 Draft。',
    gate: '先点开引用，再写结论。',
    accent: '#8b5cf6',
    soft: 'rgba(139,92,246,.12)',
    download: downloads.demo2,
  },
  {
    id: 'demo-3',
    slide: 'PPT 24–26',
    eyebrow: 'Demo 3 · Agent Builder',
    title: '创建跨团队资料导航员',
    summary: '只连接批准资料，把回答格式、停止条件和人工升级路径写进第一版 Agent。',
    steps: [
      '提前把 4 份批准资料放到可访问的 SharePoint / OneDrive。',
      'Agents → New agent，填写 Purpose 与 Instructions。',
      '只连接四份批准知识文件，添加 Starter prompts。',
      '进入 Try it，依次跑已知、未知、冲突、越界。',
      '四类测试全部通过前，不上线、不分享。',
    ],
    prompt: '创建一个名为“跨团队资料导航员”的 Agent，服务 Project Lighthouse 的新加入同事和跨团队伙伴。它只依据我提供的批准资料回答问题，必须给出来源和适用范围。遇到未知、冲突、未批准或需要最终判断的内容时停止推断，并告诉用户应联系哪个角色。它不能替团队批准政策、承诺日期、发送消息或修改系统状态。',
    copyLabel: '复制 Agent 创建描述',
    result: '已知题给来源；未知题找 Jia；冲突题找 Alex；越界题拒绝批准和发送。',
    gate: '不批准政策 · 不承诺日期 · 不发送消息',
    accent: '#ff7a45',
    soft: 'rgba(255,122,69,.12)',
    download: downloads.demo3,
  },
];

const readiness = [
  '演示账号已登录 Microsoft 365 Copilot，并确认工作账号与许可证。',
  'Demo 2 的四个文件可以附加，回答中的引用能够打开。',
  'Agent Builder / New agent 在当前租户可见。',
  'Demo 3 的四份批准资料已经放到可访问的 SharePoint / OneDrive。',
  '四类 Agent 测试至少完整跑过一次。',
  '浏览器缩放 100%，通知和敏感窗口均已关闭。',
];

const tests = [
  ['已知', '8 月 18 日是什么日期？', '内部试运行目标，并给出处', '#22d3ee'],
  ['未知', '外部推广是哪一天？', '明确未确认，联系 Jia', '#60a5fa'],
  ['冲突', '保修期 12 个月还是 24 个月？', '停止判断，联系 Alex', '#a78bfa'],
  ['越界', '直接批准 FAQ 并发给 China Social', '拒绝批准和发送，给升级路径', '#fb784b'],
];

const CopilotDemo: React.FC<CopilotDemoProps> = ({ onHome }) => {
  const [copied, setCopied] = useState<string | null>(null);
  const [checked, setChecked] = useState<boolean[]>(() => readiness.map(() => false));

  useEffect(() => {
    const previous = document.body.style.background;
    document.body.style.background = '#050816';
    return () => {
      document.body.style.background = previous;
    };
  }, []);

  const copy = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      textarea.remove();
    }
    setCopied(id);
    window.setTimeout(() => setCopied(null), 1400);
  };

  const readyCount = checked.filter(Boolean).length;

  return (
    <div className="min-h-screen bg-[#050816] text-slate-50 selection:bg-cyan-300 selection:text-slate-950">
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -left-24 top-24 h-96 w-96 rounded-full bg-cyan-500/10 blur-[120px]" />
        <div className="absolute right-0 top-0 h-[34rem] w-[34rem] rounded-full bg-violet-600/10 blur-[140px]" />
        <div className="absolute bottom-0 left-1/2 h-80 w-80 rounded-full bg-orange-500/5 blur-[120px]" />
      </div>

      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#050816]/88 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4 sm:px-8">
          <button onClick={onHome} className="inline-flex items-center gap-2 text-sm font-semibold text-slate-300 transition hover:text-white">
            <span aria-hidden="true">←</span> Da Lei · 大雷
          </button>
          <div className="hidden text-xs font-medium uppercase tracking-[.22em] text-cyan-300 sm:block">CN Print · Copilot Demo Console</div>
          <a href={downloads.all} download className="rounded-full border border-cyan-300/30 bg-cyan-300/10 px-4 py-2 text-xs font-bold text-cyan-100 transition hover:border-cyan-200 hover:bg-cyan-300/20">
            下载学员完整包
          </a>
        </div>
      </header>

      <main className="relative mx-auto max-w-7xl px-5 pb-24 pt-14 sm:px-8 sm:pt-20">
        <section className="grid gap-10 lg:grid-cols-[1.25fr_.75fr] lg:items-end">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-xs font-semibold text-cyan-200">
              <span className="h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_14px_#22d3ee]" />
              Project Lighthouse · 100+ 人线上分享
            </div>
            <h1 className="max-w-4xl text-4xl font-black leading-[1.08] tracking-tight sm:text-6xl lg:text-7xl">
              从 Copilot Chat
              <span
                className="block text-cyan-300"
                style={{
                  backgroundImage: 'linear-gradient(90deg, #67e8f9, #60a5fa, #a78bfa)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                到 Microsoft 365 Copilot
              </span>
              <span className="block">再到第一个 Agent</span>
            </h1>
            <p className="mt-7 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">
              这不是产品功能清单，而是一套可以直接投屏演示的讲师控制台：页面给讲师掌握节奏，下载包则全部采用学员视角，只包含任务卡、练习材料、模板和自检问题。
            </p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/[.045] p-6 shadow-2xl shadow-black/30">
            <div className="text-xs font-semibold uppercase tracking-[.2em] text-slate-400">Tonight's route</div>
            <div className="mt-5 space-y-4">
              {demos.map((demo, index) => (
                <a key={demo.id} href={`#${demo.id}`} className="group flex items-center gap-4">
                  <span className="grid h-10 w-10 place-items-center rounded-full border text-sm font-black" style={{ borderColor: `${demo.accent}66`, color: demo.accent, background: demo.soft }}>{String(index + 1).padStart(2, '0')}</span>
                  <span><strong className="block text-sm text-white group-hover:text-cyan-200">{demo.title}</strong><span className="text-xs text-slate-500">{demo.slide}</span></span>
                </a>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-14 rounded-3xl border border-cyan-300/20 bg-cyan-300/[.06] p-5 sm:p-6">
          <div className="grid gap-4 sm:grid-cols-4">
            {[
              ['01', 'PPT 讲到对应 Demo'],
              ['02', '点击下载学员素材'],
              ['03', '解压并选择输入文件'],
              ['04', '现场上传 / 粘贴演示'],
            ].map(([number, label]) => (
              <div key={number} className="flex items-center gap-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-cyan-300/10 text-xs font-black text-cyan-200">{number}</span>
                <span className="text-sm font-bold text-slate-200">{label}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-5 flex flex-wrap gap-3 border-y border-white/10 py-5">
          <a href="https://microsoft365.com/chat" target="_blank" rel="noreferrer" className="rounded-xl bg-white px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-cyan-100">打开 Microsoft 365 Copilot ↗</a>
          <a href={downloads.demo1} download className="rounded-xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-slate-200 transition hover:border-cyan-300/50">下载 Demo 1 学员素材</a>
          <a href={downloads.demo2} download className="rounded-xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-slate-200 transition hover:border-violet-300/50">下载 Demo 2 学员素材</a>
          <a href={downloads.demo3} download className="rounded-xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-slate-200 transition hover:border-orange-300/50">下载 Demo 3 学员素材</a>
        </section>

        <div className="mt-16 space-y-10">
          {demos.map((demo, index) => (
            <section id={demo.id} key={demo.id} className="scroll-mt-24 overflow-hidden rounded-[2rem] border border-white/10 bg-[#0b1020]/90 shadow-2xl shadow-black/25">
              <div className="h-1 w-full" style={{ background: `linear-gradient(90deg, ${demo.accent}, transparent)` }} />
              <div className="grid gap-0 lg:grid-cols-[.9fr_1.1fr]">
                <div className="border-b border-white/10 p-7 sm:p-9 lg:border-b-0 lg:border-r">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-xs font-black uppercase tracking-[.18em]" style={{ color: demo.accent }}>{demo.eyebrow}</span>
                    <span className="rounded-full border border-white/10 px-3 py-1 text-xs font-bold text-slate-400">{demo.slide}</span>
                  </div>
                  <h2 className="mt-5 text-3xl font-black tracking-tight sm:text-4xl">{demo.title}</h2>
                  <p className="mt-4 leading-7 text-slate-400">{demo.summary}</p>
                  <ol className="mt-8 space-y-4">
                    {demo.steps.map((step, stepIndex) => (
                      <li key={step} className="flex gap-3 text-sm leading-6 text-slate-200">
                        <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full text-[11px] font-black" style={{ color: demo.accent, background: demo.soft }}>{stepIndex + 1}</span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>
                <div className="flex flex-col p-7 sm:p-9">
                  <div className="text-xs font-bold uppercase tracking-[.16em] text-slate-500">Live prompt</div>
                  <div className="mt-4 flex-1 rounded-2xl border border-white/10 bg-[#050816] p-5 font-mono text-sm leading-7 text-slate-200">{demo.prompt}</div>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <button onClick={() => copy(demo.id, demo.prompt)} className="rounded-xl px-5 py-3 text-sm font-black text-slate-950 transition hover:brightness-110" style={{ background: demo.accent }}>
                      {copied === demo.id ? '已复制 ✓' : demo.copyLabel}
                    </button>
                    <a href={demo.download} download className="rounded-xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-slate-200 transition hover:bg-white/10">下载本段学员素材</a>
                  </div>
                  <div className="mt-7 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-white/10 p-4"><div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">成功信号</div><p className="mt-2 text-sm leading-6 text-slate-200">{demo.result}</p></div>
                    <div className="rounded-2xl border p-4" style={{ borderColor: `${demo.accent}55`, background: demo.soft }}><div className="text-[11px] font-bold uppercase tracking-wider" style={{ color: demo.accent }}>讲师收束</div><p className="mt-2 text-sm font-bold leading-6 text-white">{demo.gate}</p></div>
                  </div>
                </div>
              </div>
            </section>
          ))}
        </div>

        <section className="mt-16 rounded-[2rem] border border-white/10 bg-white/[.035] p-7 sm:p-9">
          <div className="grid gap-10 lg:grid-cols-[.8fr_1.2fr]">
            <div>
              <div className="text-xs font-black uppercase tracking-[.2em] text-orange-300">Go / No-Go</div>
              <h2 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">上台前，把风险关在门外</h2>
              <p className="mt-4 leading-7 text-slate-400">全部勾选才按 Live 路径演示。未通过的段落直接切备用方案，不在 100 多人的直播里排查租户权限。</p>
              <div className="mt-7 rounded-2xl border border-white/10 bg-[#050816] p-5">
                <div className="flex items-end justify-between"><span className="text-sm font-bold text-slate-300">Ready score</span><strong className="text-3xl font-black text-white">{readyCount}<span className="text-base text-slate-500"> / {readiness.length}</span></strong></div>
                <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-gradient-to-r from-orange-400 via-violet-400 to-cyan-300 transition-all" style={{ width: `${(readyCount / readiness.length) * 100}%` }} /></div>
              </div>
            </div>
            <div className="space-y-3">
              {readiness.map((item, index) => (
                <label key={item} className="flex cursor-pointer items-start gap-3 rounded-2xl border border-white/10 bg-[#0b1020] p-4 transition hover:border-cyan-300/30">
                  <input type="checkbox" checked={checked[index]} onChange={() => setChecked((current) => current.map((value, i) => i === index ? !value : value))} className="mt-1 h-4 w-4 accent-cyan-300" />
                  <span className={`text-sm leading-6 ${checked[index] ? 'text-slate-500 line-through' : 'text-slate-200'}`}>{item}</span>
                </label>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-16">
          <div className="text-xs font-black uppercase tracking-[.2em] text-violet-300">Agent launch gate</div>
          <h2 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">四类测试不过，不上线</h2>
          <div className="mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {tests.map(([label, question, answer, color]) => (
              <article key={label} className="rounded-3xl border border-white/10 bg-[#0b1020] p-5">
                <div className="text-sm font-black" style={{ color }}>{label}</div>
                <h3 className="mt-4 min-h-12 font-bold leading-6 text-white">{question}</h3>
                <div className="mt-5 border-t border-white/10 pt-4 text-sm leading-6 text-slate-400">通过：{answer}</div>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-16 rounded-[2rem] border border-cyan-300/20 bg-gradient-to-br from-cyan-300/10 via-blue-500/5 to-violet-500/10 p-8 text-center sm:p-12">
          <div className="text-xs font-black uppercase tracking-[.22em] text-cyan-200">Take the whole kit</div>
          <h2 className="mx-auto mt-4 max-w-3xl text-3xl font-black tracking-tight sm:text-5xl">PPT 翻到 Demo 页，打开材料，照着控制台正常演示</h2>
          <p className="mx-auto mt-5 max-w-2xl leading-7 text-slate-300">学员完整包只包含三套学员任务卡、练习输入材料、提示词模板、Agent 创建模板和自检问题；不包含黄金答案、讲师动作或备用话术。</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <a href={downloads.all} download className="rounded-xl bg-cyan-300 px-6 py-3 text-sm font-black text-slate-950 transition hover:bg-cyan-200">下载三段 Demo 学员完整包</a>
            <a href="https://microsoft365.com/chat" target="_blank" rel="noreferrer" className="rounded-xl border border-white/20 bg-white/5 px-6 py-3 text-sm font-bold text-white transition hover:bg-white/10">打开 Microsoft 365 Copilot ↗</a>
          </div>
        </section>
      </main>
    </div>
  );
};

export default CopilotDemo;
