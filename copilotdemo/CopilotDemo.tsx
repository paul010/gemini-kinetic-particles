import React, { useState } from 'react';

interface CopilotDemoProps {
  onHome: () => void;
}

type Demo = {
  id: string;
  slide: string;
  product: string;
  title: string;
  story: string;
  question: string;
  inputs: string;
  steps: string[];
  prompt: string;
  copyLabel: string;
  expected: string;
  mistake: string;
  takeaway: string;
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
    product: 'Copilot Chat',
    title: '一句话，三轮升级',
    story: '周一早上，领导只发来一句：“帮我写一个项目更新。”我们很容易立刻让 Copilot 写，但问题不是它会不会写，而是任务根本还没有被说清楚。',
    question: '同一句话，为什么有人得到套话，有人却能得到可直接使用的结果？',
    inputs: '项目背景说明 + 三轮提示词模板',
    steps: [
      '先输入那句故意模糊的要求，观察结果为什么“正确但无用”。',
      '不急着重写，让 Copilot 反过来诊断任务还缺什么。',
      '补全目标、背景、输出标准和信息来源，再生成第三版。',
      '对比第一版和第三版，圈出事实、归纳与待确认项。',
    ],
    prompt: '先不要写。请告诉我：要把这个请求变成一项可执行任务，我还需要补充哪些信息？请按目标、背景、输出标准、信息来源四类提问。',
    copyLabel: '复制诊断提示词',
    expected: '你的第二轮输出应该主动追问目标、背景、输出标准和信息来源；第三轮要把未确认信息与事实分开。',
    mistake: '堆了一连串要求，却没有给来源；把 Copilot 的补全当成已确认事实。',
    takeaway: '提示词不是咒语，是你写给智能同事的任务说明书。',
    download: downloads.demo1,
  },
  {
    id: 'demo-2',
    slide: 'PPT 15-17',
    product: 'Microsoft 365 Copilot',
    title: '四份材料，一页接手简报',
    story: '你刚从休假中回来，Project Lighthouse 已经累积了邮件、会议纪要、Teams 聊天和 Excel 状态表。每份材料都只有一部分真相，而且两个关键数字还互相冲突。',
    question: '面对大量上下文，我们应该先让 Copilot “写总结”，还是先让它“查事实”？',
    inputs: '邮件 + 会议纪要 + Teams 聊天 + Excel 状态表',
    steps: [
      '只附加四份输入材料，先说明不要直接写结论。',
      '让 Copilot 把信息分成已确认、有冲突、仍缺失和待行动四类。',
      '点开至少两个引用，回看 8 月 18 日和保修期限的原始材料。',
      '确认事实底稿后，再生成一页接手简报，并改写为三个对象版本。',
      '最后不要复述完整答案，只保留 Leader 真正需要决定的那一项。',
    ],
    prompt: '只依据这 4 份 Project Lighthouse 材料，整理一份事实核对表。分为：已确认事实、材料冲突、缺失信息、行动项。每一条必须标出来源文件；无法确认的内容写“未确认”。先不要写管理层总结，也不要自行选择冲突中的一方。',
    copyLabel: '复制事实核对提示词',
    expected: '每一条都能点回来源；8/16 与 8/18 没有被合并；保修期冲突没有被自行判断；China Social 仍然保留 Draft。',
    mistake: '一上来就要管理层摘要；看到流畅的结论就直接接受；没有点回引用核对原文。',
    takeaway: '不是让 Copilot 帮我们更快地下结论，而是先帮我们更快地把事实理清楚。',
    download: downloads.demo2,
  },
  {
    id: 'demo-3',
    slide: 'PPT 24-26',
    product: 'Agent Builder',
    title: '创建跨团队资料导航员',
    story: '项目进入跨团队协作后，新同事每天都在问相同问题：时间表在哪里？这个日期确定了吗？冲突应该找谁？这时我们需要的不只是一次问答，而是一个稳定、可追溯的入口。',
    question: '什么时候应该继续用 Chat，什么时候值得把方法做成 Agent？',
    inputs: '四份已批准知识文件 + Agent 创建模板',
    steps: [
      '打开 Agent Builder，用一段自然语言说清它服务谁、解决什么问题。',
      '只连接四份已批准资料，写明回答格式、来源和适用范围。',
      '加入停止条件：遇到未知、冲突、未批准或需要最终判断时，不再继续推断。',
      '选择 2 到 4 个问题，观察它知道什么，也观察它什么时候会停下。',
      '用“人仍然负责最终判断”总结，第一次练习不必扩展到复杂流程编排。',
    ],
    prompt: '创建一个名为“跨团队资料导航员”的 Agent，服务 Project Lighthouse 的新加入同事和跨团队伙伴。它只依据我提供的批准资料回答问题，必须给出来源和适用范围。遇到未知、冲突、未批准或需要最终判断的内容时停止推断，并告诉用户应联系哪个角色。它不能替团队批准政策、承诺日期、发送消息或修改系统状态。',
    copyLabel: '复制 Agent 创建描述',
    expected: '已知题能给来源；未知题能说未确认；冲突题能停止判断并找正确角色；越界请求不代替人执行。',
    mistake: '把所有文件都接进去；只测一个正常问题；为了显得“聪明”，让 Agent 在未知时继续猜。',
    takeaway: '真正好用的 Agent，不是什么都敢答，而是知道什么时候应该停下来找人。',
    download: downloads.demo3,
  },
];

const schedule = [
  ['00-10', '先回答“与我何干”', 'License 不等于生产力，先找一个真实小任务。'],
  ['10-23', '从 Chat 到任务说明书', '理解四要素，用简单对比建立直觉。'],
  ['23-38', 'Demo 1', '完成三轮升级；有权限的同事可选同步跟练。'],
  ['38-50', '从 Chat 到工作上下文', '用一条接手工作链理解邮件、会议、文件与权限。'],
  ['50-72', 'Demo 2', '先核对事实，再形成简报，并点回引用。'],
  ['72-77', '中场停一下', '记下前两段中你最意外的一个发现。'],
  ['77-89', '从一次回答到稳定角色', '理解什么任务值得 Agent 化，以及知识和边界。'],
  ['89-105', 'Demo 3', '完成第一版 Agent，选 2 到 4 个问题观察能力与停止点。'],
  ['105-112', '新信号与三句话收口', '用 Rules、Skill 和 Vision 看变化，再收回任务、事实和方法。'],
  ['112-120', 'QA 与 Thank you', '围绕入口、任务、权限和 Agent 带走答案。'],
];

const boundaryQuestions = [
  ['已知', '8 月 18 日是什么日期？', '应该给出“内部试运行目标”和来源。'],
  ['未知', '对外推广是哪一天？', '应该明确说未确认，并建议联系 Jia。'],
  ['冲突', '保修期是 12 个月还是 24 个月？', '应该停止判断，告诉用户联系 Alex。'],
  ['越界', '直接批准 FAQ 并发给 China Social。', '应该拒绝批准和发送，但给出正确升级路径。'],
];

const trends = [
  {
    title: 'Excel .Rules',
    text: '把格式、图表、函数与布局要求写进工作簿，让一次提示词开始变成团队共享的文件规则。',
    link: 'https://support.microsoft.com/zh-CN/excel/copilot/copilot-in-excel-rules',
    label: '查看 Microsoft Support',
  },
  {
    title: 'Skill Recorder',
    text: '把一次真实操作和口头说明整理成可复用的技能，展示从“我会做”到“团队可复用”的可能路径。',
    link: 'https://github.com/microsoft/skill-recorder',
    label: '查看官方仓库',
  },
  {
    title: 'Copilot Vision',
    text: '当用户主动分享屏幕时，屏幕内容也能成为上下文。它适合解释和引导，不等于获得系统操作权。',
    link: 'https://support.microsoft.com/en-us/microsoft-365-copilot/use-vision-microsoft-365-copilot',
    label: '查看 Microsoft Support',
  },
];

const learnerChecks = [
  '有 Copilot Chat 权限：可以完成 Demo 1，跟着体验三轮提示词的变化。',
  '有 Microsoft 365 Copilot 与文件上传权限：可以完成 Demo 2，使用四份虚构材料做事实核对。',
  '当前账号能看到 Agent Builder：可以完成 Demo 3，使用已批准知识文件创建第一版 Agent。',
  '暂时没有对应权限：不影响学习，请重点观察每段的输入、输出和前后变化。',
  '所有练习材料都是课程虚构数据；请不要在公开练习中上传真实客户、员工或项目数据。',
  '跟不上时不需要着急：页面、提示词和三个 ZIP 都可以留到课后再完成。',
];

const CopilotDemo: React.FC<CopilotDemoProps> = ({ onHome }) => {
  const [copied, setCopied] = useState<string | null>(null);

  const copy = async (id: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = value;
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

  return (
    <div className="min-h-screen bg-paper font-sans text-ink selection:bg-gold/30">
      <div className="bg-vignette pointer-events-none fixed inset-0" aria-hidden="true" />
      <div className="bg-aurora pointer-events-none fixed inset-0 opacity-80" aria-hidden="true" />
      <div className="bg-grain pointer-events-none fixed inset-0 opacity-30" aria-hidden="true" />

      <header className="sticky top-0 z-40 border-b border-ink/10 bg-paper/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4 sm:px-8">
          <button onClick={onHome} className="group inline-flex items-center gap-3 text-sm font-semibold text-ink/70 transition hover:text-ink">
            <span className="grid h-9 w-9 place-items-center rounded-xl border border-ink/15 bg-surface/60 font-display text-lg font-bold text-gold transition group-hover:border-gold/50">大</span>
            <span>Da Lei · 大雷</span>
          </button>
          <div className="hidden text-xs font-semibold tracking-[0.16em] text-ink/45 md:block">CN PRINT · COPILOT SHARE</div>
          <a href={downloads.all} download className="rounded-full bg-ink px-4 py-2.5 text-xs font-bold text-paper transition hover:bg-gold">
            下载三段 Demo 素材
          </a>
        </div>
      </header>

      <main className="relative mx-auto max-w-6xl px-5 pb-24 pt-12 sm:px-8 sm:pt-18">
        <section className="grid gap-10 border-b border-ink/10 pb-14 lg:grid-cols-[1.08fr_.92fr] lg:items-center">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/10 px-3 py-1.5 text-xs font-semibold text-gold">
              2 小时线上分享 · 100+ 人 · 可选同步跟练
            </div>
            <h1 className="max-w-3xl font-display text-5xl font-semibold leading-[0.98] tracking-[-0.035em] text-ink sm:text-6xl lg:text-7xl">
              把 Copilot
              <span className="block text-gold">变成你的工作搭档</span>
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-ink/65">从一句话到可信简报，再到第一个会守边界的 Agent。有相应权限，你可以下载学员素材，复制和讲师一样的提示词同步跟练；暂时没有权限，跟着观察每段的输入、输出和变化就可以。</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href="#demo-1" className="rounded-full bg-ink px-6 py-3 text-sm font-bold text-paper transition hover:bg-gold">从第一个案例开始</a>
              <a href="https://microsoft365.com/chat" target="_blank" rel="noreferrer" className="rounded-full border border-ink/15 bg-surface/50 px-6 py-3 text-sm font-bold text-ink transition hover:border-gold/50 hover:text-gold">打开 Microsoft 365 Copilot ↗</a>
            </div>
          </div>
          <figure className="overflow-hidden rounded-[2rem] border border-ink/10 bg-surface/55 p-3 shadow-[0_24px_70px_rgb(var(--rgb-ink)/0.10)]">
            <img src="/copilot-demo-cover.svg" alt="Copilot 三段案例的路径图" className="aspect-[16/9] w-full rounded-[1.4rem] object-cover" />
            <figcaption className="flex items-center justify-between gap-4 px-3 pb-2 pt-4 text-xs text-ink/50">
              <span>Project Lighthouse 贯穿三段案例</span>
              <span>任务 → 事实 → 方法</span>
            </figcaption>
          </figure>
        </section>

        <section className="py-14">
          <div className="max-w-3xl">
            <p className="text-sm font-bold text-gold">一场分享，三个完整故事</p>
            <h2 className="mt-3 font-display text-4xl font-semibold tracking-tight sm:text-5xl">不追求把所有功能都试一遍，只让你看懂三次关键升级</h2>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {demos.map((demo) => (
              <a key={demo.id} href={`#${demo.id}`} className="group rounded-3xl border border-ink/10 bg-surface/45 p-6 transition hover:-translate-y-1 hover:border-gold/45 hover:bg-surface/70">
                <div className="flex items-center justify-between gap-4 text-xs font-semibold text-ink/45"><span>{demo.product}</span><span>{demo.slide}</span></div>
                <h3 className="mt-7 font-display text-2xl font-semibold leading-tight group-hover:text-gold">{demo.title}</h3>
                <p className="mt-4 text-sm leading-6 text-ink/60">{demo.question}</p>
                <div className="mt-6 text-sm font-bold text-gold">打开案例 →</div>
              </a>
            ))}
          </div>
        </section>

        <div className="space-y-14">
          {demos.map((demo) => (
            <section id={demo.id} key={demo.id} className="scroll-mt-24 overflow-hidden rounded-[2rem] border border-ink/10 bg-surface/52 shadow-[0_24px_80px_rgb(var(--rgb-ink)/0.08)]">
              <div className="grid lg:grid-cols-[.92fr_1.08fr]">
                <div className="border-b border-ink/10 p-7 sm:p-9 lg:border-b-0 lg:border-r">
                  <div className="flex items-center justify-between gap-4 text-xs font-semibold text-ink/45"><span>{demo.product}</span><span className="rounded-full border border-ink/10 px-3 py-1">{demo.slide}</span></div>
                  <h2 className="mt-6 font-display text-4xl font-semibold tracking-tight sm:text-5xl">{demo.title}</h2>
                  <div className="mt-7 border-l-2 border-gold pl-5">
                    <div className="text-xs font-bold text-gold">你收到的任务</div>
                    <p className="mt-3 text-base leading-7 text-ink/70">{demo.story}</p>
                  </div>
                  <div className="mt-7 rounded-2xl border border-ink/10 bg-paper/55 p-5">
                    <div className="text-xs font-bold text-ink/45">开始前先想一想</div>
                    <p className="mt-2 font-display text-xl font-semibold leading-7">{demo.question}</p>
                  </div>
                  <div className="mt-7 text-xs font-bold text-ink/45">你会用到</div>
                  <p className="mt-2 text-sm leading-6 text-ink/65">{demo.inputs}</p>
                </div>

                <div className="p-7 sm:p-9">
                  <div className="text-xs font-bold text-gold">跟着完成</div>
                  <ol className="mt-5 space-y-4">
                    {demo.steps.map((step, index) => (
                      <li key={step} className="flex gap-4 text-sm leading-6 text-ink/75">
                        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-gold/12 text-xs font-bold text-gold">{index + 1}</span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ol>

                  <div className="mt-8 rounded-2xl border border-ink/10 bg-paper/65 p-5">
                    <div className="flex items-center justify-between gap-4">
                      <div className="text-xs font-bold text-ink/45">你要复制的提示词</div>
                      <button onClick={() => copy(demo.id, demo.prompt)} className="rounded-full border border-gold/30 bg-gold/10 px-3 py-1.5 text-xs font-bold text-gold transition hover:bg-gold hover:text-paper">
                        {copied === demo.id ? '已复制 ✓' : demo.copyLabel}
                      </button>
                    </div>
                    <p className="mt-4 font-mono text-sm leading-7 text-ink/75">{demo.prompt}</p>
                  </div>

                  <div className="mt-6 grid gap-4 sm:grid-cols-2">
                    <div className="rounded-2xl border border-ink/10 p-5">
                      <div className="text-xs font-bold text-gold">完成后自检</div>
                      <p className="mt-3 text-sm leading-6 text-ink/70">{demo.expected}</p>
                    </div>
                    <div className="rounded-2xl border border-ink/10 p-5">
                      <div className="text-xs font-bold text-ink/45">容易踩坑</div>
                      <p className="mt-3 text-sm leading-6 text-ink/70">{demo.mistake}</p>
                    </div>
                  </div>

                  <div className="mt-6 flex flex-col gap-4 rounded-2xl bg-ink p-5 text-paper sm:flex-row sm:items-center sm:justify-between">
                    <p className="font-display text-xl font-semibold leading-7">{demo.takeaway}</p>
                    <a href={demo.download} download className="shrink-0 rounded-full bg-paper px-4 py-2.5 text-xs font-bold text-ink transition hover:bg-gold hover:text-paper">下载本段材料</a>
                  </div>
                </div>
              </div>
            </section>
          ))}
        </div>

        <section className="mt-20 border-y border-ink/10 py-16">
          <div className="grid gap-10 lg:grid-cols-[.72fr_1.28fr]">
            <div>
              <p className="text-sm font-bold text-gold">你的 120 分钟学习路线</p>
              <h2 className="mt-3 font-display text-4xl font-semibold tracking-tight sm:text-5xl">三次升级，把一次回答变成可复用的工作方法</h2>
              <p className="mt-5 leading-7 text-ink/65">三段 Demo 约占 53 分钟，其余时间用来理解“为什么”、对比前后变化、回看来源，并把方法带回你的工作。有权限时可以同步跟练，暂时没有权限时先理解思路。</p>
            </div>
            <div className="divide-y divide-ink/10 border-y border-ink/10">
              {schedule.map(([time, title, detail]) => (
                <div key={time} className="grid gap-2 py-4 sm:grid-cols-[72px_180px_1fr] sm:items-start">
                  <span className="font-mono text-xs font-bold text-gold">{time}</span>
                  <strong className="text-sm">{title}</strong>
                  <span className="text-sm leading-6 text-ink/60">{detail}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-20">
          <div className="max-w-3xl">
            <p className="text-sm font-bold text-gold">检查你的第一个 Agent</p>
            <h2 className="mt-3 font-display text-4xl font-semibold tracking-tight sm:text-5xl">用四个问题，同时看见能力与边界</h2>
            <p className="mt-5 leading-7 text-ink/65">时间有限时可以选 2 到 4 个问题，但请至少保留一个未知或越界问题。只会回答已知问题还不够，知道什么时候应该停下同样重要。</p>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {boundaryQuestions.map(([label, question, answer]) => (
              <article key={label} className="rounded-3xl border border-ink/10 bg-surface/45 p-6">
                <div className="text-xs font-bold text-gold">{label}</div>
                <h3 className="mt-4 font-display text-2xl font-semibold leading-8">{question}</h3>
                <p className="mt-5 border-t border-ink/10 pt-4 text-sm leading-6 text-ink/60">你希望看到：{answer}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-20 rounded-[2rem] border border-ink/10 bg-ink p-8 text-paper sm:p-10">
          <div className="grid gap-10 lg:grid-cols-[.68fr_1.32fr]">
            <div>
              <p className="text-sm font-bold text-gold">案例之外的三个新信号</p>
              <h2 className="mt-3 font-display text-4xl font-semibold tracking-tight">从一次问答，走向可重复的工作方法</h2>
              <p className="mt-5 leading-7 text-paper/65">这一段只做趋势科普，不新增第四个 Demo。用三个变化说明：上下文、规则、步骤和边界正在逐步进入 Copilot 的日常工作方式。</p>
            </div>
            <div className="divide-y divide-paper/15 border-y border-paper/15">
              {trends.map((trend) => (
                <article key={trend.title} className="py-5">
                  <h3 className="font-display text-2xl font-semibold text-gold">{trend.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-paper/70">{trend.text}</p>
                  <a href={trend.link} target="_blank" rel="noreferrer" className="mt-3 inline-block text-xs font-bold text-paper/60 transition hover:text-gold">{trend.label} ↗</a>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-20 rounded-[2rem] border border-ink/10 bg-surface/45 p-7 sm:p-9">
          <div className="grid gap-10 lg:grid-cols-[.72fr_1.28fr]">
            <div>
              <p className="text-sm font-bold text-gold">开始前先看这里</p>
              <h2 className="mt-3 font-display text-4xl font-semibold tracking-tight">根据你的权限，选择跟练或观察</h2>
              <p className="mt-5 leading-7 text-ink/65">每段练习都有一个对应入口。可以打开就同步做，暂时打不开就先观察方法，页面和材料可以课后继续使用。</p>
            </div>
            <ul className="grid gap-3 sm:grid-cols-2">
              {learnerChecks.map((item) => (
                <li key={item} className="flex gap-3 rounded-2xl border border-ink/10 bg-paper/50 p-4 text-sm leading-6 text-ink/70">
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-gold" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="mt-20 rounded-[2rem] border border-gold/25 bg-gold/10 p-8 text-center sm:p-12">
          <p className="text-sm font-bold text-gold">把练习带回去</p>
          <h2 className="mx-auto mt-3 max-w-3xl font-display text-4xl font-semibold tracking-tight sm:text-5xl">下载三段素材，选一个案例在课后完整做一遍</h2>
          <p className="mx-auto mt-5 max-w-2xl leading-7 text-ink/65">完整包里只有三套学员任务卡、练习材料、提示词模板、Agent 创建模板和自检问题。有权限的同事可以在课上同步跟练，也可以在分享结束后再自己完成。</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <a href={downloads.all} download className="rounded-full bg-ink px-6 py-3 text-sm font-bold text-paper transition hover:bg-gold">下载三段 Demo 完整包</a>
            <a href="https://microsoft365.com/chat" target="_blank" rel="noreferrer" className="rounded-full border border-ink/15 bg-paper/55 px-6 py-3 text-sm font-bold text-ink transition hover:border-gold/50 hover:text-gold">打开 Microsoft 365 Copilot ↗</a>
          </div>
        </section>
      </main>
    </div>
  );
};

export default CopilotDemo;
