import React, { useEffect, useMemo, useState } from 'react';

/* ---------------------------------------------------------------------------
 * /copilotcamp — a Khan-Academy-style, bilingual learning course rebuilt from
 * Microsoft's Copilot Camp lab "CWRK0 · Copilot Cowork setup and extensibility".
 *
 * Not a flat article: it's a course. Units → lessons, a progress sidebar with
 * persisted completion, copyable demo prompts, vendored screenshots, and a
 * knowledge check after every lesson so the content is actually learnable.
 *
 * Source (content + screenshots, © Microsoft, used for learning/demo):
 * https://microsoft.github.io/copilot-camp/pages/copilot-cowork/00-cowork-setup/
 * Screenshots are vendored into /public/copilot-cowork/ and served from this repo.
 * ------------------------------------------------------------------------- */

type Lang = 'en' | 'zh' | 'zhHant';
interface T { en: string; zh: string }

const LANG_KEY = 'dalei-lang-v2';
const PROGRESS_KEY = 'copilotcamp-progress-v1';

const detectInitialLang = (): Lang => {
  if (typeof window === 'undefined') return 'en';
  const saved = window.localStorage.getItem(LANG_KEY);
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

/* ---------- content model ------------------------------------------------ */

type Block =
  | { t: 'p'; x: T }
  | { t: 'h'; x: T }
  | { t: 'quote'; x: T }
  | { t: 'list'; x: T[] }
  | { t: 'prompt'; x: string }
  | { t: 'figure'; src: string; alt: T; cap: T }
  | { t: 'note'; kind: T; x: T; accent?: string }
  | { t: 'cards'; x: { title: string; body: T }[] }
  | { t: 'chips'; label: T; items: string[] };

interface Quiz { q: T; options: T[]; answer: number; why: T }

interface Lesson {
  id: string;
  title: T;
  minutes: number;
  blocks: Block[];
  quiz?: Quiz;
  takeaway: T;
}
interface Unit { n: string; title: T; sub: T; lessons: Lesson[] }

const IMG = '/copilot-cowork';

const COURSE: Unit[] = [
  {
    n: '1',
    title: { en: 'Understand Copilot Cowork', zh: '理解 Copilot Cowork' },
    sub: { en: 'What it is and the operating model', zh: '它是什么，以及运作模式' },
    lessons: [
      {
        id: 'u1l1',
        title: { en: 'What Copilot Cowork is', zh: '什么是 Copilot Cowork' },
        minutes: 4,
        takeaway: { en: 'Cowork executes goals, not just answers prompts — it plans, picks skills, and acts across Microsoft 365.', zh: 'Cowork 执行「目标」，而不只是回答提示词 —— 它会规划、选技能，并跨 Microsoft 365 采取行动。' },
        blocks: [
          { t: 'quote', x: {
            en: '“Copilot Cowork is built for execution, not only conversation. Instead of only answering prompts, Cowork interprets a goal, breaks it into tasks, selects the needed skills, and coordinates actions across Microsoft 365 workloads such as Outlook, Teams, Word, Excel, PowerPoint, and enterprise search.”',
            zh: '「Copilot Cowork 为『执行』而生，而不只是对话。它不只是回答提示词，而是理解一个目标、把它拆成任务、选出所需技能，并在 Outlook、Teams、Word、Excel、PowerPoint 以及企业搜索等 Microsoft 365 工作负载之间协调各项动作。」',
          } },
          { t: 'p', x: {
            en: 'The operating model emphasizes goal-driven orchestration: you provide intent, Cowork builds and runs a plan, and you inspect each step as it progresses.',
            zh: '它的运作模式强调「目标驱动的编排」：你给出意图，Cowork 构建并执行计划，你在过程中审视每一步。',
          } },
          { t: 'h', x: { en: 'Key advantages', zh: '核心优势' } },
          { t: 'list', x: [
            { en: 'Handles multi-step, cross-app workflows', zh: '处理多步骤、跨应用的工作流' },
            { en: 'Eliminates context switching and manual copy/paste', zh: '消除来回切换与手动复制粘贴' },
            { en: 'Keeps humans in control through approvals for sensitive actions', zh: '对敏感动作设审批，让人始终掌控' },
            { en: 'Operates within existing Microsoft 365 security, identity, and compliance boundaries', zh: '在既有的 Microsoft 365 安全、身份与合规边界内运行' },
          ] },
        ],
        quiz: {
          q: { en: 'What best captures how Cowork differs from a normal chat assistant?', zh: '下面哪一项最能概括 Cowork 与普通聊天助手的区别？' },
          options: [
            { en: 'It answers prompts faster', zh: '它回答提示词更快' },
            { en: 'It interprets a goal, plans tasks, and executes actions across apps', zh: '它理解目标、规划任务，并跨应用执行动作' },
            { en: 'It only works inside Word', zh: '它只能在 Word 里工作' },
            { en: 'It replaces the need for any approvals', zh: '它让所有审批都不再需要' },
          ],
          answer: 1,
          why: { en: 'Cowork is built for execution: it turns intent into a multi-step plan and coordinates actions across Microsoft 365 — while keeping approvals for sensitive steps.', zh: 'Cowork 为执行而生：它把意图变成多步骤计划并跨 Microsoft 365 协调动作 —— 同时对敏感步骤保留审批。' },
        },
      },
      {
        id: 'u1l2',
        title: { en: 'What Cowork can do', zh: 'Cowork 能做什么' },
        minutes: 4,
        takeaway: { en: 'Cowork runs sequences of real actions — drafting, creating files, scheduling — and pauses for approval on higher-impact steps.', zh: 'Cowork 执行的是一连串真实动作 —— 起草、创建文件、排期 —— 并在影响较大的步骤上暂停等待审批。' },
        blocks: [
          { t: 'p', x: { en: 'At the time of writing, key capabilities include:', zh: '截至撰写时，主要能力包括：' } },
          { t: 'list', x: [
            { en: 'Communication tasks (email and Teams messages)', zh: '沟通类任务（邮件与 Teams 消息）' },
            { en: 'Meeting and calendar tasks (scheduling, updates, conflict cleanup)', zh: '会议与日历任务（排期、更新、冲突清理）' },
            { en: 'Document and file tasks (Word, Excel, PowerPoint, PDF)', zh: '文档与文件任务（Word、Excel、PowerPoint、PDF）' },
            { en: 'Research and enterprise search across Microsoft 365 data', zh: '基于 Microsoft 365 数据的调研与企业搜索' },
            { en: 'Scheduled prompts for recurring automations', zh: '用于周期性自动化的定时提示词' },
            { en: 'And more …', zh: '以及更多…' },
          ] },
          { t: 'p', x: {
            en: 'The vision emphasizes “moving from intent to action.” Cowork runs sequences of actions rather than returning one-shot answers — drafting and sending communications, creating files, organizing meetings, and combining context from multiple sources into cohesive plans.',
            zh: '愿景强调「从意图到行动」。Cowork 执行的是一连串动作，而不是给出一次性答案 —— 起草并发送沟通内容、创建文件、组织会议，并把多个来源的上下文整合成连贯的计划。',
          } },
          { t: 'quote', x: {
            en: '“Instead of jumping between Outlook, Teams, OneDrive, SharePoint, and Office apps manually, users can delegate the end-to-end flow to Cowork and then supervise checkpoints.”',
            zh: '「用户不必再手动地在 Outlook、Teams、OneDrive、SharePoint 与 Office 各应用之间跳转，而是可以把端到端的流程委托给 Cowork，然后在关键节点上监督。」',
          } },
          { t: 'note', kind: { en: 'Why it matters', zh: '为什么重要' }, accent: '#5c8a3a', x: {
            en: 'For higher-impact operations, Cowork pauses for approval before execution — automation with accountability.',
            zh: '对影响较大的操作，Cowork 会在执行前暂停等待审批 —— 在自动化的同时保持可问责。',
          } },
        ],
        quiz: {
          q: { en: 'For a higher-impact action (like sending an email), what does Cowork do?', zh: '对于影响较大的动作（比如发送邮件），Cowork 会怎么做？' },
          options: [
            { en: 'Executes it silently in the background', zh: '在后台悄悄执行' },
            { en: 'Pauses and asks for explicit approval before executing', zh: '暂停并在执行前请求明确审批' },
            { en: 'Refuses to do it at all', zh: '完全拒绝执行' },
            { en: 'Emails your admin for permission', zh: '给管理员发邮件申请许可' },
          ],
          answer: 1,
          why: { en: 'Approval gates on sensitive steps are how Cowork keeps humans in control while still automating the flow.', zh: '在敏感步骤上设置审批关卡，正是 Cowork 在自动化的同时让人掌控的方式。' },
        },
      },
    ],
  },
  {
    n: '2',
    title: { en: 'Prepare your tenant', zh: '准备你的租户' },
    sub: { en: 'Prerequisites, billing, pilot users', zh: '前置条件、计费、试点用户' },
    lessons: [
      {
        id: 'u2l1',
        title: { en: 'Validate prerequisites', zh: '核对前置条件' },
        minutes: 5,
        takeaway: { en: 'You need a Copilot-licensed M365 tenant with Cowork available, usage-based billing on, and Anthropic enabled as a subprocessor.', zh: '你需要一个已授权 Copilot、且已提供 Cowork 的 M365 租户，开启按量计费，并启用 Anthropic 作为子处理方。' },
        blocks: [
          { t: 'p', x: { en: 'Review the prerequisites before you begin:', zh: '开始前，先检查以下前置条件：' } },
          { t: 'list', x: [
            { en: 'A valid Microsoft 365 tenant (a developer tenant via the M365 Developer Program is acceptable)', zh: '一个有效的 Microsoft 365 租户（通过 M365 开发者计划获得的开发者租户也可以）' },
            { en: 'A tenant admin account for managing settings', zh: '一个用于管理设置的租户管理员账号' },
            { en: 'Users have an active Microsoft 365 Copilot license', zh: '用户拥有有效的 Microsoft 365 Copilot 许可证' },
            { en: 'Cowork available in the tenant', zh: '租户中已提供 Cowork' },
            { en: 'Usage-based billing enabled for Cowork', zh: '已为 Cowork 启用按量计费' },
            { en: 'Anthropic enabled as a subprocessor (or a Frontier tenant for the GPT 5.5 option)', zh: '已启用 Anthropic 作为子处理方（或使用 Frontier 租户以选用 GPT 5.5）' },
            { en: 'Supported client/browser access (web, desktop app, mobile)', zh: '具备受支持的客户端/浏览器访问（网页、桌面应用、移动端）' },
          ] },
          { t: 'note', kind: { en: 'Note', zh: '注意' }, x: {
            en: 'Cowork uses Anthropic models as a subprocessor in Microsoft 365 Copilot. Make sure your compliance and legal review includes this before a broad rollout.',
            zh: 'Cowork 在 Microsoft 365 Copilot 中把 Anthropic 模型作为子处理方使用。在大规模推广前，请确保合规与法务审查已把这一点纳入考量。',
          } },
        ],
        quiz: {
          q: { en: 'Which compliance detail must legal/compliance review before broad rollout?', zh: '在大规模推广前，法务/合规必须审查哪一项？' },
          options: [
            { en: 'Cowork stores data on personal devices', zh: 'Cowork 把数据存在个人设备上' },
            { en: 'Cowork uses Anthropic models as a subprocessor', zh: 'Cowork 把 Anthropic 模型作为子处理方使用' },
            { en: 'Cowork disables all M365 security', zh: 'Cowork 会关闭所有 M365 安全' },
            { en: 'Cowork requires a new email server', zh: 'Cowork 需要新的邮件服务器' },
          ],
          answer: 1,
          why: { en: 'Anthropic is a subprocessor for Cowork in M365 Copilot — a prerequisite to clear with compliance and legal.', zh: 'Anthropic 是 Cowork 在 M365 Copilot 中的子处理方 —— 这是需要合规与法务确认的前置条件。' },
        },
      },
      {
        id: 'u2l2',
        title: { en: 'Configure Credits & billing', zh: '配置 Credits 与计费' },
        minutes: 5,
        takeaway: { en: 'In the M365 admin center, set billing mode, Azure connection, spending policies, and budget caps — start strict, expand gradually.', zh: '在 M365 管理中心设置计费模式、Azure 连接、支出策略与预算上限 —— 先从严，再逐步放开。' },
        blocks: [
          { t: 'p', x: { en: 'In the Microsoft 365 admin center, configure cost management for usage-based billing. Define:', zh: '在 Microsoft 365 管理中心，为按量计费配置成本管理。需要定义：' } },
          { t: 'list', x: [
            { en: 'Billing mode (prepaid credits, pay-as-you-go, or existing capacity)', zh: '计费模式（预付 Credits、按量付费，或已有容量）' },
            { en: 'Azure subscription connection for billing at scale', zh: '用于规模化计费的 Azure 订阅连接' },
            { en: 'Spending policies and limits', zh: '支出策略与上限' },
            { en: 'Budget protections (alerts and hard caps)', zh: '预算保护（告警与硬性上限）' },
          ] },
          { t: 'note', kind: { en: 'Recommendation', zh: '建议' }, accent: '#5c8a3a', x: {
            en: 'Start with a controlled pilot audience and strict spending policies, expanding gradually after reviewing consumption trends.',
            zh: '先从可控的试点人群和严格的支出策略起步，观察消耗趋势后再逐步扩大。',
          } },
        ],
        quiz: {
          q: { en: 'What is the recommended rollout posture for billing?', zh: '在计费上，推荐的推广姿态是什么？' },
          options: [
            { en: 'Open it to everyone with no caps on day one', zh: '第一天就对所有人开放、不设上限' },
            { en: 'Start with a controlled pilot and strict spending policies, then expand', zh: '先从可控试点与严格支出策略起步，再逐步扩大' },
            { en: 'Disable budgets so nothing blocks users', zh: '关闭预算，避免挡住用户' },
            { en: 'Only allow prepaid credits, never pay-as-you-go', zh: '只允许预付 Credits，绝不按量付费' },
          ],
          answer: 1,
          why: { en: 'A controlled pilot plus hard caps lets you watch real consumption before scaling — the safe, recommended path.', zh: '可控试点加硬性上限，让你在扩大规模前先观察真实消耗 —— 这是安全、被推荐的路径。' },
        },
      },
      {
        id: 'u2l3',
        title: { en: 'Assign pilot users & verify', zh: '分配试点用户并验证' },
        minutes: 3,
        takeaway: { en: 'Confirm pilot users can start conversations, run an approval task, and see task history. If not, recheck license, billing, and tenant enablement.', zh: '确认试点用户能发起对话、跑通一个审批任务、看到任务历史。若不行，回查许可证、计费与租户启用。' },
        blocks: [
          { t: 'p', x: { en: 'Assign a pilot group and validate they can:', zh: '分配一个试点小组，并验证他们能够：' } },
          { t: 'list', x: [
            { en: 'Start conversations', zh: '发起对话' },
            { en: 'Run at least one task requiring approval', zh: '运行至少一个需要审批的任务' },
            { en: 'See task history and scheduled tasks', zh: '查看任务历史与已计划的任务' },
          ] },
          { t: 'note', kind: { en: 'Troubleshooting', zh: '排障' }, accent: '#b4543a', x: {
            en: 'If access fails, recheck licensing, billing configuration, and tenant-level enablement.',
            zh: '如果访问失败，请重新检查许可证、计费配置以及租户级的启用状态。',
          } },
        ],
        quiz: {
          q: { en: 'A pilot user cannot access Cowork. What should you recheck first?', zh: '某试点用户无法访问 Cowork，你应先回查什么？' },
          options: [
            { en: 'Their monitor resolution', zh: '他的显示器分辨率' },
            { en: 'Licensing, billing configuration, and tenant-level enablement', zh: '许可证、计费配置与租户级启用' },
            { en: 'The color theme in Windows', zh: 'Windows 的颜色主题' },
            { en: 'Their keyboard layout', zh: '他的键盘布局' },
          ],
          answer: 1,
          why: { en: 'Access almost always comes down to license + billing + tenant enablement — the three things to verify first.', zh: '访问问题几乎都归结为「许可证 + 计费 + 租户启用」—— 这三项要先确认。' },
        },
      },
    ],
  },
  {
    n: '3',
    title: { en: 'Start using Cowork', zh: '开始使用 Cowork' },
    sub: { en: 'Open it, run a task, test approvals', zh: '打开它、跑一个任务、测审批' },
    lessons: [
      {
        id: 'u3l1',
        title: { en: 'Open Cowork', zh: '打开 Cowork' },
        minutes: 3,
        takeaway: { en: 'Open m365.cloud.microsoft and switch to the Cowork toggle. The left nav has New task, My tasks, Scheduled, and Customize.', zh: '打开 m365.cloud.microsoft 并切到 Cowork。左侧导航有 New task、My tasks、Scheduled、Customize。' },
        blocks: [
          { t: 'p', x: {
            en: 'Open Microsoft 365 Copilot at m365.cloud.microsoft and select the Cowork toggle at the top, next to Chat.',
            zh: '打开 Microsoft 365 Copilot（m365.cloud.microsoft），并在顶部 Chat 旁边的切换器中选择 Cowork。',
          } },
          { t: 'figure', src: 'cowork-start-01.png',
            alt: { en: 'Sidebar with Home, New task, Search, Scheduled and Customize; the Cowork tab highlighted at the top.', zh: '侧边栏含首页、新建任务、搜索、已计划与自定义；顶部的 Cowork 标签被高亮。' },
            cap: { en: 'The left navigation, with the Cowork toggle highlighted at the top (red arrow).', zh: '左侧导航栏，顶部的 Cowork 切换器被红色箭头高亮。' } },
          { t: 'quote', x: {
            en: '“Cowork is oriented around delegated execution: you describe an outcome and Cowork plans and performs tasks for you across Microsoft 365.”',
            zh: '「Cowork 以『委托执行』为核心：你描述一个想要的结果，Cowork 就会跨 Microsoft 365 为你规划并执行任务。」',
          } },
          { t: 'h', x: { en: 'Core navigation options', zh: '核心导航选项' } },
          { t: 'list', x: [
            { en: 'New task — start a fresh execution with a new prompt', zh: 'New task（新建任务）—— 用新提示词开始一次全新执行' },
            { en: 'My tasks — find previous tasks and reopen them quickly', zh: 'My tasks（我的任务）—— 找回之前的任务并快速重开' },
            { en: 'Scheduled — review and manage recurring/scheduled tasks', zh: 'Scheduled（已计划）—— 查看并管理周期性/已计划的任务' },
            { en: 'Customize — manage available plugins and skills', zh: 'Customize（自定义）—— 管理可用的插件与技能' },
          ] },
        ],
        quiz: {
          q: { en: 'Which left-nav option do you use to manage plugins and skills?', zh: '要管理插件与技能，用左侧导航的哪一项？' },
          options: [
            { en: 'New task', zh: 'New task' },
            { en: 'Scheduled', zh: 'Scheduled' },
            { en: 'Customize', zh: 'Customize' },
            { en: 'My tasks', zh: 'My tasks' },
          ],
          answer: 2,
          why: { en: 'Customize is where Plugins and Skills live — you shape Cowork’s capabilities there.', zh: 'Customize 是 Plugins 与 Skills 所在之处 —— 你在那里塑造 Cowork 的能力。' },
        },
      },
      {
        id: 'u3l2',
        title: { en: 'Observe the execution model', zh: '观察执行模式' },
        minutes: 6,
        takeaway: { en: 'One prompt → a multi-step plan that runs asynchronously (gather → draft → save PDF), with live progress and a completion recap.', zh: '一句提示词 → 一个异步执行的多步骤计划（收集 → 起草 → 存 PDF），带实时进度与完成回顾。' },
        blocks: [
          { t: 'p', x: { en: 'Start with a simple prompt and watch how Cowork turns it into a plan. Copy it and try it live:', zh: '从一个简单提示词开始，观察 Cowork 如何把它变成计划。复制它现场试试：' } },
          { t: 'prompt', x: "Draft a status update email for my team based on this week's meetings and save a PDF copy in OneDrive." },
          { t: 'figure', src: 'cowork-prompt-01.png',
            alt: { en: 'Copilot interface with “Where should we start today?” and the status-update example in the prompt box.', zh: 'Copilot 界面显示「Where should we start today?」，输入框中是状态更新示例。' },
            cap: { en: 'The prompt entered in the Cowork input box.', zh: '在 Cowork 输入框中输入的提示词。' } },
          { t: 'p', x: { en: 'Observe the step-by-step execution, the skills it loads, and the approval gates before sensitive actions like sending or posting.', zh: '观察它逐步的执行、加载的技能，以及在发送/发布等敏感动作前的审批关卡。' } },
          { t: 'figure', src: 'cowork-prompt-execution-01.png',
            alt: { en: 'Cowork gathering the week’s meetings, drafting a status email, preparing to save a PDF to OneDrive, with progress steps on the right.', zh: 'Cowork 收集本周会议、起草状态邮件、准备把 PDF 存入 OneDrive，右侧显示进度步骤。' },
            cap: { en: 'The plan runs: gather meetings → draft email → save PDF, with live progress in the workspace panel.', zh: '计划执行中：收集会议 → 起草邮件 → 保存 PDF，工作区面板显示实时进度。' } },
          { t: 'p', x: { en: 'On completion, Cowork shows a recap of every executed task and step. It runs multiple tasks asynchronously — drafting the email, generating the PDF, storing it in OneDrive — while you focus elsewhere.', zh: '完成后，Cowork 给出每个已执行任务与步骤的回顾。它异步执行多个任务 —— 起草邮件、生成 PDF、存入 OneDrive —— 你可同时做别的事。' } },
          { t: 'figure', src: 'cowork-prompt-execution-02.png',
            alt: { en: 'Completed task summary: a weekly status email grouped by activities, an attached PDF, and a Workspace panel listing completed steps and the output file.', zh: '完成的任务摘要：按活动分组的每周状态邮件、附带的 PDF，以及列出已完成步骤与产出文件的工作区面板。' },
            cap: { en: 'Completed recap — the email grouped by activity, the generated PDF, and the completed steps in the Workspace.', zh: '完成回顾 —— 按活动分组的邮件、生成的 PDF，以及工作区中已完成的步骤。' } },
        ],
        quiz: {
          q: { en: 'After the prompt runs, what does Cowork show at the end?', zh: '提示词执行完后，Cowork 在最后会展示什么？' },
          options: [
            { en: 'Nothing — you check each app manually', zh: '什么都没有 —— 你自己去各应用里查' },
            { en: 'A recap of every executed task and step, plus the output files', zh: '每个已执行任务与步骤的回顾，外加产出文件' },
            { en: 'Only an error log', zh: '只有一份错误日志' },
            { en: 'A bill for the whole month', zh: '整月的账单' },
          ],
          answer: 1,
          why: { en: 'Cowork closes the loop with a completion recap — the steps it ran and the artifacts it produced (draft email, PDF in OneDrive).', zh: 'Cowork 用完成回顾收尾 —— 它跑过的步骤与产出的成果（邮件草稿、OneDrive 里的 PDF）。' },
        },
      },
      {
        id: 'u3l3',
        title: { en: 'Test approval controls', zh: '测试审批控制' },
        minutes: 4,
        takeaway: { en: 'Ask for a sensitive action (schedule + Teams message) and confirm Cowork requests explicit approval before it sends or posts.', zh: '请求一个敏感动作（排期 + Teams 消息），确认 Cowork 在发送/发帖前请求明确审批。' },
        blocks: [
          { t: 'p', x: { en: 'Now ask Cowork to perform a sensitive action. Copy and try:', zh: '现在让 Cowork 执行一个敏感动作。复制试试：' } },
          { t: 'prompt', x: 'Schedule a 30-minute project sync with my team tomorrow and send a confirmation message in Teams.' },
          { t: 'figure', src: 'cowork-task-approval-01.png',
            alt: { en: 'A draft Outlook meeting titled “Project Sync” with attendees and a short agenda, ready to send.', zh: '一封标题为「Project Sync」的 Outlook 会议草稿，含参会者与简短议程，等待发送。' },
            cap: { en: 'Cowork requests explicit approval before it sends the invite or posts to Teams.', zh: 'Cowork 在发送邀请或向 Teams 发帖前，请求明确审批。' } },
          { t: 'p', x: { en: 'Verify that Cowork requests explicit approval before executing the sensitive action — this is the human-in-the-loop checkpoint.', zh: '确认 Cowork 在执行敏感动作前请求明确审批 —— 这就是「人在环中」的检查点。' } },
        ],
        quiz: {
          q: { en: 'Why does Cowork stop before sending the Teams confirmation?', zh: '为什么 Cowork 在发送 Teams 确认前会停下？' },
          options: [
            { en: 'Because Teams is offline', zh: '因为 Teams 离线了' },
            { en: 'It hit its credit limit', zh: '它用完了 Credit' },
            { en: 'Sending/posting is a sensitive action that needs explicit human approval', zh: '发送/发帖是敏感动作，需要人明确审批' },
            { en: 'It forgot the prompt', zh: '它忘了提示词' },
          ],
          answer: 2,
          why: { en: 'Approval gates fire on outbound/sensitive actions so a human confirms before anything is actually sent.', zh: '审批关卡会在对外/敏感动作上触发，让人在真正发送前确认。' },
        },
      },
    ],
  },
  {
    n: '4',
    title: { en: 'Extend Cowork', zh: '扩展 Cowork' },
    sub: { en: 'Skills vs Plugins, and what ships built-in', zh: 'Skills 与 Plugins，以及内置了什么' },
    lessons: [
      {
        id: 'u4l1',
        title: { en: 'Skills vs Plugins', zh: 'Skills 与 Plugins 的区别' },
        minutes: 4,
        takeaway: { en: 'Skills shape behavior and task logic; Plugins connect tools and external data. Pick Skills to change how it works, Plugins to add what it can reach.', zh: 'Skills 塑造行为与任务逻辑；Plugins 连接工具与外部数据。改「怎么做」选 Skills，加「能碰到什么」选 Plugins。' },
        blocks: [
          { t: 'p', x: { en: 'In the Customize experience, two key tabs appear — Plugins and Skills:', zh: '在 Customize（自定义）中会出现两个关键标签页 —— Plugins 与 Skills：' } },
          { t: 'cards', x: [
            { title: 'Skills', body: { en: 'Task instructions and behavior patterns that guide how Cowork executes specific types of work. Choose Skills when shaping behavior and task logic.', zh: '任务指令与行为模式，指导 Cowork 如何执行特定类型的工作。要塑造行为与任务逻辑时，选 Skills。' } },
            { title: 'Plugins', body: { en: 'Packaged integrations / connectors that add capabilities or external data sources Cowork can use. Choose Plugins when connecting tools, systems, or packaged functionality.', zh: '打包好的集成/连接器，为 Cowork 增加可调用的能力或外部数据源。要连接工具、系统或打包功能时，选 Plugins。' } },
          ] },
        ],
        quiz: {
          q: { en: 'You want to connect Cowork to an external CRM’s data. Skills or Plugins?', zh: '你想把 Cowork 接到某外部 CRM 的数据。选 Skills 还是 Plugins？' },
          options: [
            { en: 'Skills — they change task behavior', zh: 'Skills —— 它们改变任务行为' },
            { en: 'Plugins — they connect tools and external data sources', zh: 'Plugins —— 它们连接工具与外部数据源' },
            { en: 'Neither — Cowork can’t use external data', zh: '都不是 —— Cowork 用不了外部数据' },
            { en: 'Both are identical', zh: '两者完全一样' },
          ],
          answer: 1,
          why: { en: 'Plugins are integrations/connectors — they add external data and tools. Skills shape behavior, not connectivity.', zh: 'Plugins 是集成/连接器 —— 增加外部数据与工具。Skills 塑造行为，而非连通性。' },
        },
      },
      {
        id: 'u4l2',
        title: { en: 'Built-in skills & plugins', zh: '内置的技能与插件' },
        minutes: 3,
        takeaway: { en: 'Cowork ships with many auto-activating skills (Word, Excel, Email, Deep Research…) and Microsoft plugins (Dynamics 365, Fabric IQ), with a growing partner catalog.', zh: 'Cowork 自带大量会自动激活的技能（Word、Excel、Email、Deep Research…）与 Microsoft 插件（Dynamics 365、Fabric IQ），合作伙伴目录还在扩充。' },
        blocks: [
          { t: 'h', x: { en: 'Built-in skills (auto-activate by context)', zh: '内置技能（按上下文自动激活）' } },
          { t: 'chips', label: { en: 'Skills', zh: '技能' }, items: ['Word', 'Excel', 'PowerPoint', 'PDF', 'Email', 'Scheduling', 'Calendar Management', 'Meetings', 'Daily Briefing', 'Enterprise Search', 'Deep Research', 'Communications', 'Adaptive Cards'] },
          { t: 'h', x: { en: 'Current Microsoft plugins', zh: '当前的 Microsoft 插件' } },
          { t: 'chips', label: { en: 'Plugins', zh: '插件' }, items: ['Dynamics 365 Customer Service', 'Dynamics 365 ERP', 'Dynamics 365 Sales', 'Fabric IQ'] },
          { t: 'p', x: { en: 'A broad third-party partner plugin catalog exists in the Microsoft 365 App Store and continues to expand.', zh: 'Microsoft 365 应用商店中还有一个庞大的第三方合作伙伴插件目录，且在持续扩充。' } },
        ],
        quiz: {
          q: { en: 'How do Cowork’s built-in skills get used?', zh: 'Cowork 的内置技能是怎么被使用的？' },
          options: [
            { en: 'You install each one manually every time', zh: '每次都要手动逐个安装' },
            { en: 'They activate automatically based on conversation context', zh: '它们根据对话上下文自动激活' },
            { en: 'Only an admin can trigger them', zh: '只有管理员能触发它们' },
            { en: 'They require writing code', zh: '它们需要写代码' },
          ],
          answer: 1,
          why: { en: 'Built-in skills (Word, Excel, Email, Deep Research, …) activate automatically based on what the task needs.', zh: '内置技能（Word、Excel、Email、Deep Research…）会依据任务需要自动激活。' },
        },
      },
    ],
  },
];

const ALL_LESSONS = COURSE.flatMap((u) => u.lessons);

/* ---------- block renderer ----------------------------------------------- */

const Prompt: React.FC<{ text: string; label: string; copied: string }> = ({ text, label, copied }) => {
  const [done, setDone] = useState(false);
  const copy = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        setDone(true);
        setTimeout(() => setDone(false), 1600);
      }).catch(() => {});
    }
  };
  return (
    <div className="my-5 overflow-hidden rounded-2xl border border-gold/30 bg-gold/[0.06]">
      <div className="flex items-center justify-between gap-3 border-b border-gold/20 px-4 py-2">
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-gold">{label}</span>
        <button onClick={copy} className="rounded-md border border-gold/30 px-2.5 py-1 font-mono text-[11px] text-gold transition-colors hover:bg-gold/10">
          {done ? copied : 'Copy'}
        </button>
      </div>
      <p className="px-4 py-3.5 font-mono text-[13px] leading-relaxed text-ink/80">{text}</p>
    </div>
  );
};

const BlockView: React.FC<{ b: Block; tr: (x: T) => string; promptLabel: string; copied: string }> = ({ b, tr, promptLabel, copied }) => {
  switch (b.t) {
    case 'p':
      return <p className="my-4 text-[15px] leading-relaxed text-ink/75">{tr(b.x)}</p>;
    case 'h':
      return <h4 className="mt-6 font-semibold text-ink">{tr(b.x)}</h4>;
    case 'quote':
      return <blockquote className="my-5 border-l-[3px] border-ink/20 pl-4 text-[15px] italic leading-relaxed text-ink/70">{tr(b.x)}</blockquote>;
    case 'list':
      return (
        <ul className="my-4 space-y-2">
          {b.x.map((it, i) => (
            <li key={i} className="flex items-start gap-2.5 text-[15px] leading-relaxed text-ink/75">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-gold" /><span>{tr(it)}</span>
            </li>
          ))}
        </ul>
      );
    case 'prompt':
      return <Prompt text={b.x} label={promptLabel} copied={copied} />;
    case 'figure':
      return (
        <figure className="my-6 overflow-hidden rounded-2xl border border-ink/10 bg-surface/40">
          <img src={`${IMG}/${b.src}`} alt={tr(b.alt)} loading="lazy" className="w-full" />
          <figcaption className="border-t border-ink/10 px-4 py-2.5 font-mono text-[11px] leading-relaxed text-ink/50">{tr(b.cap)}</figcaption>
        </figure>
      );
    case 'note':
      return (
        <div className="my-5 rounded-2xl border-l-[3px] bg-surface/40 px-4 py-3.5" style={{ borderLeftColor: b.accent || '#8a682c' }}>
          <span className="font-mono text-[10px] uppercase tracking-[0.2em]" style={{ color: b.accent || '#8a682c' }}>{tr(b.kind)}</span>
          <p className="mt-1.5 text-[14px] leading-relaxed text-ink/70">{tr(b.x)}</p>
        </div>
      );
    case 'cards':
      return (
        <div className="my-5 grid gap-4 sm:grid-cols-2">
          {b.x.map((c) => (
            <div key={c.title} className="rounded-2xl border border-ink/10 bg-paper/70 p-5">
              <h4 className="font-semibold text-ink">{c.title}</h4>
              <p className="mt-2 text-[14px] leading-relaxed text-ink/65">{tr(c.body)}</p>
            </div>
          ))}
        </div>
      );
    case 'chips':
      return (
        <div className="my-4 flex flex-wrap gap-1.5">
          {b.items.map((s) => (
            <span key={s} className="rounded-md border border-ink/10 bg-ink/[0.04] px-2.5 py-1 font-mono text-[11px] text-ink/60">{s}</span>
          ))}
        </div>
      );
  }
};

/* ---------- knowledge check ---------------------------------------------- */

const KnowledgeCheck: React.FC<{ quiz: Quiz; tr: (x: T) => string; labels: Record<string, string> }> = ({ quiz, tr, labels }) => {
  const [picked, setPicked] = useState<number | null>(null);
  const correct = picked === quiz.answer;
  return (
    <div className="mt-8 rounded-3xl border border-ink/12 bg-surface/40 p-5 sm:p-6">
      <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-gold">{labels.check}</p>
      <p className="mt-2 text-[15px] font-semibold leading-relaxed text-ink">{tr(quiz.q)}</p>
      <div className="mt-4 space-y-2">
        {quiz.options.map((o, i) => {
          const isPicked = picked === i;
          const isAnswer = i === quiz.answer;
          let cls = 'border-ink/12 bg-paper/70 hover:border-gold/40';
          if (picked !== null) {
            if (isAnswer) cls = 'border-emerald-500/50 bg-emerald-500/10';
            else if (isPicked) cls = 'border-rose-500/50 bg-rose-500/10';
            else cls = 'border-ink/10 bg-paper/50 opacity-60';
          }
          return (
            <button key={i} disabled={correct} onClick={() => setPicked(i)}
              className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-[14px] leading-relaxed text-ink/80 transition-colors ${cls}`}>
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full border border-ink/15 font-mono text-[11px] text-ink/50">{String.fromCharCode(65 + i)}</span>
              {tr(o)}
              {picked !== null && isAnswer && <span className="ml-auto text-emerald-600">✓</span>}
              {isPicked && !isAnswer && <span className="ml-auto text-rose-500">✕</span>}
            </button>
          );
        })}
      </div>
      {picked !== null && (
        <div className={`mt-4 rounded-xl px-4 py-3 text-[14px] leading-relaxed ${correct ? 'bg-emerald-500/10 text-emerald-800' : 'bg-rose-500/10 text-ink/75'}`}>
          <strong className="mr-1">{correct ? labels.correct : labels.tryAgain}</strong>{tr(quiz.why)}
        </div>
      )}
    </div>
  );
};

/* ---------- page --------------------------------------------------------- */

interface Props { onHome: () => void }

const CopilotCamp: React.FC<Props> = ({ onHome }) => {
  const [lang, setLang] = useState<Lang>(detectInitialLang);
  const s2t = useS2T(lang === 'zhHant');
  const tr = (txt: T) => (lang === 'en' ? txt.en : lang === 'zhHant' ? (s2t ? s2t(txt.zh) : txt.zh) : txt.zh);
  useEffect(() => { if (typeof window !== 'undefined') window.localStorage.setItem(LANG_KEY, lang); }, [lang]);

  const [current, setCurrent] = useState(0); // index into ALL_LESSONS; 0 reserved handling below
  const [done, setDone] = useState<Set<string>>(() => {
    if (typeof window === 'undefined') return new Set();
    try { return new Set(JSON.parse(window.localStorage.getItem(PROGRESS_KEY) || '[]')); } catch { return new Set(); }
  });
  const [showOutline, setShowOutline] = useState(false);
  useEffect(() => {
    if (typeof window !== 'undefined') window.localStorage.setItem(PROGRESS_KEY, JSON.stringify([...done]));
  }, [done]);

  const lesson = ALL_LESSONS[current];
  const pct = Math.round((done.size / ALL_LESSONS.length) * 100);

  const labels = {
    check: tr({ en: 'Knowledge check', zh: '随堂检测' }),
    correct: tr({ en: 'Correct!', zh: '答对了!' }),
    tryAgain: tr({ en: 'Not quite —', zh: '还差一点 ——' }),
    prompt: tr({ en: 'Try prompt', zh: '示例提示词' }),
    copied: tr({ en: 'Copied!', zh: '已复制!' }),
    takeaway: tr({ en: 'Key takeaway', zh: '本节要点' }),
    complete: tr({ en: 'Mark complete & continue', zh: '标记完成，继续' }),
    completed: tr({ en: 'Completed', zh: '已完成' }),
    prev: tr({ en: 'Previous', zh: '上一节' }),
    finish: tr({ en: 'Finish course', zh: '完成课程' }),
    min: tr({ en: 'min', zh: '分钟' }),
    contents: tr({ en: 'Course contents', zh: '课程目录' }),
    lessons: tr({ en: 'lessons', zh: '节' }),
  };

  const LANGS: { code: Lang; label: string }[] = [{ code: 'en', label: 'EN' }, { code: 'zh', label: '简' }, { code: 'zhHant', label: '繁' }];

  const goto = (i: number) => { setCurrent(i); setShowOutline(false); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const markComplete = () => {
    setDone((d) => new Set(d).add(lesson.id));
    if (current < ALL_LESSONS.length - 1) goto(current + 1);
    else window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // locate unit+lesson numbering for the current lesson
  const locate = (id: string) => {
    for (const u of COURSE) {
      const li = u.lessons.findIndex((l) => l.id === id);
      if (li >= 0) return { unit: u.n, lesson: li + 1, unitTitle: u.title };
    }
    return { unit: '1', lesson: 1, unitTitle: COURSE[0].title };
  };
  const loc = locate(lesson.id);
  const allDone = done.size === ALL_LESSONS.length;

  const Outline = (
    <nav className="space-y-6">
      {COURSE.map((u) => (
        <div key={u.n}>
          <div className="flex items-center gap-2">
            <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-gold/15 font-mono text-[11px] font-semibold text-gold">{u.n}</span>
            <div>
              <p className="text-[13px] font-semibold leading-tight text-ink">{tr(u.title)}</p>
              <p className="font-mono text-[10px] text-ink/45">{u.lessons.length} {labels.lessons}</p>
            </div>
          </div>
          <ul className="ml-3 mt-2 space-y-0.5 border-l border-ink/10 pl-3">
            {u.lessons.map((l) => {
              const idx = ALL_LESSONS.findIndex((x) => x.id === l.id);
              const isCur = idx === current;
              const isDone = done.has(l.id);
              return (
                <li key={l.id}>
                  <button onClick={() => goto(idx)}
                    className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[13px] leading-snug transition-colors ${isCur ? 'bg-ink/[0.06] font-medium text-ink' : 'text-ink/60 hover:text-ink'}`}>
                    <span className={`grid h-4 w-4 shrink-0 place-items-center rounded-full border text-[9px] ${isDone ? 'border-emerald-500 bg-emerald-500 text-white' : isCur ? 'border-gold text-gold' : 'border-ink/25 text-transparent'}`}>{isDone ? '✓' : '•'}</span>
                    {tr(l.title)}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );

  return (
    <div className="min-h-screen bg-paper font-sans text-ink">
      <header className="sticky top-0 z-40 border-b border-ink/10 bg-paper/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-5 py-3.5 sm:px-8">
          <button onClick={onHome} className="font-mono text-xs text-ink/55 transition-colors hover:text-ink">← Da Lei · 大雷</button>
          <div className="flex items-center gap-3">
            <span className="hidden font-mono text-[11px] text-ink/50 sm:inline">{pct}% · {done.size}/{ALL_LESSONS.length}</span>
            <div className="hidden h-1.5 w-28 overflow-hidden rounded-full bg-ink/10 sm:block">
              <div className="h-full rounded-full bg-gold transition-all duration-500" style={{ width: `${pct}%` }} />
            </div>
            <div className="flex overflow-hidden rounded-full border border-ink/15">
              {LANGS.map((l) => (
                <button key={l.code} onClick={() => setLang(l.code)}
                  className={`px-2.5 py-1 font-mono text-[11px] transition-colors ${lang === l.code ? 'bg-ink text-paper' : 'text-ink/55 hover:text-ink'}`}>{l.label}</button>
              ))}
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-0 lg:grid-cols-[280px_1fr]">
        {/* sidebar */}
        <aside className="hidden border-r border-ink/10 lg:block">
          <div className="sticky top-[57px] max-h-[calc(100vh-57px)] overflow-y-auto px-6 py-8">
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-gold">Copilot Camp · CWRK0</p>
            <h2 className="mt-1 font-display text-xl font-semibold leading-tight">{tr({ en: 'Copilot Cowork — setup & extensibility', zh: 'Copilot Cowork — 设置与扩展' })}</h2>
            <div className="mt-4 mb-6">
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-ink/10">
                <div className="h-full rounded-full bg-gold transition-all duration-500" style={{ width: `${pct}%` }} />
              </div>
              <p className="mt-1.5 font-mono text-[10px] text-ink/50">{pct}% {tr({ en: 'complete', zh: '完成' })}</p>
            </div>
            {Outline}
          </div>
        </aside>

        {/* main */}
        <main className="min-w-0 px-5 py-8 sm:px-8 lg:px-12 lg:py-12">
          {/* mobile outline toggle */}
          <div className="lg:hidden">
            <button onClick={() => setShowOutline((v) => !v)}
              className="flex w-full items-center justify-between rounded-xl border border-ink/12 bg-surface/40 px-4 py-3 text-[13px] font-medium text-ink/70">
              <span>{labels.contents} · {pct}%</span>
              <span className={`transition-transform ${showOutline ? 'rotate-180' : ''}`}>▾</span>
            </button>
            {showOutline && <div className="mt-3 rounded-2xl border border-ink/10 bg-surface/30 p-5">{Outline}</div>}
          </div>

          {/* completion banner */}
          {allDone && (
            <div className="mb-8 mt-4 rounded-3xl border border-emerald-500/30 bg-emerald-500/[0.08] p-6 sm:p-8 lg:mt-0">
              <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-emerald-600">{tr({ en: 'Course complete', zh: '课程完成' })} · 100%</p>
              <h2 className="mt-2 font-display text-2xl font-semibold tracking-tight">{tr({ en: 'You finished Lab CWRK0 — Copilot Cowork setup & extensibility!', zh: '你已完成 Lab CWRK0 —— Copilot Cowork 设置与扩展!' })}</h2>
              <p className="mt-3 text-[15px] leading-relaxed text-ink/70">{tr({ en: 'Next up in the CWRK path: build your first Skill (CWRK1), then your first Plugin (CWRK2).', zh: '下一步（CWRK 路径）：构建你的第一个 Skill（CWRK1），再构建第一个 Plugin（CWRK2）。' })}</p>
            </div>
          )}

          {/* lesson header */}
          <div className="mt-4 lg:mt-0">
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-gold">
              {tr({ en: 'Unit', zh: '单元' })} {loc.unit} · {tr(loc.unitTitle)} — {tr({ en: 'Lesson', zh: '第' })} {loc.lesson} {lang === 'en' ? '' : tr({ en: '', zh: '节' })}
            </p>
            <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl">{tr(lesson.title)}</h1>
            <p className="mt-2 font-mono text-[11px] text-ink/45">~{lesson.minutes} {labels.min} · {done.has(lesson.id) ? `✓ ${labels.completed}` : `${tr({ en: 'Lesson', zh: '第' })} ${current + 1}/${ALL_LESSONS.length}`}</p>
          </div>

          {/* blocks */}
          <article className="mt-6">
            {lesson.blocks.map((b, i) => <BlockView key={i} b={b} tr={tr} promptLabel={labels.prompt} copied={labels.copied} />)}
          </article>

          {/* takeaway */}
          <div className="mt-8 rounded-2xl border border-gold/25 bg-gold/[0.06] px-5 py-4">
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-gold">★ {labels.takeaway}</span>
            <p className="mt-1.5 text-[15px] font-medium leading-relaxed text-ink/80">{tr(lesson.takeaway)}</p>
          </div>

          {/* knowledge check — keyed by lesson id so React remounts it per lesson
              and its selection/feedback state never bleeds across lessons. */}
          {lesson.quiz && <KnowledgeCheck key={lesson.id} quiz={lesson.quiz} tr={tr} labels={labels} />}

          {/* nav footer */}
          <div className="mt-10 flex items-center justify-between gap-3 border-t border-ink/10 pt-6">
            <button onClick={() => current > 0 && goto(current - 1)} disabled={current === 0}
              className="rounded-full border border-ink/15 px-4 py-2 font-mono text-xs text-ink/60 transition-colors enabled:hover:border-ink/40 enabled:hover:text-ink disabled:opacity-30">
              ← {labels.prev}
            </button>
            <button onClick={markComplete}
              className="rounded-full bg-ink px-5 py-2.5 font-mono text-xs font-semibold text-paper transition-opacity hover:opacity-90">
              {current === ALL_LESSONS.length - 1 ? `${labels.finish} ✓` : `${labels.complete} →`}
            </button>
          </div>

          {/* source footer */}
          <p className="mt-10 text-xs leading-relaxed text-ink/45">
            {tr({ en: 'Learning rebuild by 大雷. Content and screenshots © Microsoft, from the Copilot Camp lab ', zh: '大雷的学习复现。内容与截图版权归 Microsoft，取自 Copilot Camp 实验 ' })}
            <a href="https://microsoft.github.io/copilot-camp/pages/copilot-cowork/00-cowork-setup/" target="_blank" rel="noopener noreferrer" className="text-gold underline underline-offset-2 hover:opacity-80">CWRK0 · Copilot Cowork setup and extensibility ↗</a>
            {tr({ en: '. Features and pricing change over time — verify against the source.', zh: '。功能与价格会随时间变化 —— 请以原文核对。' })}
          </p>
        </main>
      </div>
    </div>
  );
};

export default CopilotCamp;
