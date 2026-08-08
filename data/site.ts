// 'zhHant' (繁體) is derived at runtime from the 'zh' (简体) strings via OpenCC,
// so LocalizedText only stores en + zh.
export type Lang = 'en' | 'zh' | 'zhHant';

export interface LocalizedText {
  en: string;
  zh: string;
}

export interface ProjectLink {
  label: LocalizedText;
  href: string;
  kind: 'live' | 'github' | 'youtube' | 'internal';
}

export interface Project {
  id: string;
  title: LocalizedText;
  year: string;
  status: 'live' | 'wip' | 'soon';
  tagline: LocalizedText;
  description: LocalizedText;
  tags: string[];
  links: ProjectLink[];
  featured?: boolean;
  cover?: string;
  /** Coarse grouping for the Work-section filter chips. */
  category?: 'ai' | 'creative' | 'tool';
  /** Signature project - gets a highlighted eyebrow and sorts to the top. */
  signature?: boolean;
  /** For prompt→result showcases: the verbatim prompt, shown in a copyable disclosure. */
  prompt?: string;
}

export const SOCIALS = {
  github: 'https://github.com/paul010',
  youtube: 'https://www.youtube.com/@dalei2025',
  twitter: 'https://x.com/paul010318',
  membership: 'https://www.youtube.com/channel/UCk9tu0mFtXj_rOEfIncxuJQ/join',
  notion: 'https://aiagentclub.notion.site/1e51f5ff8f8c80a4b849c9526278b791',
};

// Email is split into parts so the full address never appears as a source
// literal. The mailto value is assembled at runtime.
const EMAIL_PARTS = ['panlei318', 'gmail.com'];
export const getEmail = () => EMAIL_PARTS.join('@');

/** Shared image assets. */
export const ASSETS = {
  avatar: '/avatar-480.webp',
  heroClay: {
    small: '/hero-clay-480.webp',
    large: '/hero-clay-960.webp',
  },
};

export const CHANNEL = {
  name: { en: 'Da Lei · Good Morning', zh: '大雷早上好' } as LocalizedText,
  handle: '@dalei2025',
  subscribers: '4K+',
  videos: '400+',
};

export interface VideoItem {
  id: string; // YouTube video id (doubles as the resource filename in dalei-youtube)
  title: LocalizedText;
  date: string;
  duration: string;
}

export const youtubeWatch = (id: string) => `https://www.youtube.com/watch?v=${id}`;
export const youtubeThumb = (id: string) => `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;

/**
 * The video index is kept in the dalei-youtube repo's README. We fetch it at
 * runtime and parse the latest episodes, so the homepage stays current without
 * code changes. Falls back to VIDEOS below.
 *
 * Source note: we fetch from raw.githubusercontent.com (CORS-enabled, ~5-min
 * edge cache) rather than jsDelivr. jsDelivr caches branch files for ~12h and
 * serves the stale copy with a 200, which would silently overwrite the list
 * with old episodes for hours after a README update.
 */
export const VIDEOS_README_URL = 'https://raw.githubusercontent.com/paul010/dalei-youtube/master/README.md';

/** Latest episodes - sourced from github.com/paul010/dalei-youtube.
 * This is the fallback/first-paint list; the homepage fetches the live README
 * at runtime and overrides it. Kept in sync with the newest episodes so the
 * curated bilingual titles are used even when the live parse succeeds. */
export const VIDEOS: VideoItem[] = [
  {
    id: 'bzEinn6u7ag',
    date: '2026-07-05',
    duration: '7:09',
    title: {
      en: "Fable 5's inner monologue leaked - does AI secretly think in 'Claudenese'?",
      zh: 'Fable 5 内心独白泄露！AI 竟用「克劳德语」秘密思考？',
    },
  },
  {
    id: 'VuYTg4ghlwI',
    date: '2026-07-05',
    duration: '8:11',
    title: {
      en: "The biggest secret of GPT-5.6: why it will 'dance in shackles'",
      zh: 'GPT-5.6 最大秘密：为何它将「戴着镣铐跳舞」？',
    },
  },
  {
    id: 'DY585co5C2k',
    date: '2026-07-04',
    duration: '8:47',
    title: {
      en: "Claude Sonnet 5: Opus-level performance? But there's a huge pricing trap",
      zh: 'Claude Sonnet 5：性能直逼 Opus？价格竟有大陷阱！',
    },
  },
  {
    id: 'GRfMMr9MvoM',
    date: '2026-06-29',
    duration: '9:30',
    title: {
      en: 'AI world explodes! Fable 5 appears, then vanishes? GPT-5 secrets leaked',
      zh: 'AI 圈炸锅！Fable 5 现身又消失？GPT-5 秘密泄露',
    },
  },
  {
    id: 'YTVzy2fa3eg',
    date: '2026-06-28',
    duration: '9:05',
    title: {
      en: "99% of people are fooled! The truth about Sakana Fugu - it isn't even a model",
      zh: '99% 的人都被骗了！深度揭秘 Sakana Fugu，它根本不是一个模型！',
    },
  },
  {
    id: 'od-h3z3IBvI',
    date: '2026-06-23',
    duration: '10:24',
    title: {
      en: 'AI model war! GPT-5, Sonnet 5 secrets exposed',
      zh: 'AI 大模型巨头混战！GPT-5、Sonnet 5 秘密曝光',
    },
  },
];

/**
 * Adding a future project = append one object here.
 * `status`: live | wip | soon · `featured` makes it the large hero card.
 */
export const PROJECTS: Project[] = [
  {
    id: 'vibe-check',
    category: 'creative',
    title: { en: 'Vibe Check', zh: '隐藏气质测试' },
    year: '2026',
    status: 'live',
    tagline: {
      en: 'Six playful questions. One delightfully unserious personality card.',
      zh: '六道没有标准答案的小题，生成一张纯娱乐的隐藏气质卡。',
    },
    description: {
      en: 'A privacy-friendly, just-for-fun personality quiz with four original archetypes. Answers stay in the browser and the result is ready to copy and share.',
      zh: '一个不登录、不上传答案的纯娱乐人格测试。四种原创气质类型，完成后可一键复制结果分享。',
    },
    tags: ['React', 'Interactive', 'Quiz', 'Privacy'],
    links: [
      { label: { en: 'Take the quiz', zh: '开始测试' }, href: '/vibe-check', kind: 'internal' },
    ],
    cover: '/vibe-check-cover.svg',
  },
  {
    id: 'kinetic-particles',
    category: 'creative',
    title: { en: 'Kinetic Particles', zh: 'Kinetic Particles' },
    year: '2025',
    status: 'live',
    featured: true,
    cover: '/kinetic-cover-1200.webp',
    tagline: {
      en: 'A 3D particle universe you control with your hands - no API key, runs in the browser.',
      zh: '用双手控制的 3D 粒子宇宙 -- 无需 API Key，浏览器即开即用。',
    },
    description: {
      en: 'Open your palm and 12,000+ particles bloom outward; close your fist and the universe contracts. Built with React Three Fiber and on-device MediaPipe hand tracking, with a sci-fi HUD and a dozen morphing shapes.',
      zh: '张开手掌，12000+ 粒子向外绽放；握紧拳头，整个宇宙随之收缩。基于 React Three Fiber 与本地运行的 MediaPipe 手势识别，配以科幻 HUD 与十余种可变形造型。',
    },
    tags: ['React Three Fiber', 'Three.js', 'MediaPipe', 'WebGL'],
    links: [
      { label: { en: 'Launch experience', zh: '立即体验' }, href: '/particles', kind: 'internal' },
      { label: { en: 'Watch demo', zh: '观看演示' }, href: 'https://www.youtube.com/watch?v=dYTeo_qNX6E', kind: 'youtube' },
      { label: { en: 'Source', zh: '源码' }, href: 'https://github.com/paul010/gemini-kinetic-particles', kind: 'github' },
    ],
  },
  {
    id: 'ai-coding-arsenal',
    category: 'ai',
    title: { en: 'AI Coding Arsenal', zh: 'AI Coding Arsenal' },
    year: '2026',
    status: 'wip',
    featured: true,
    cover: '/arsenal-cover-1200.webp',
    tagline: {
      en: 'An open-source launchpad from an AI-coding idea to a running demo.',
      zh: '从 AI Coding 灵感到可运行 Demo 的开源开工库。',
    },
    description: {
      en: 'A project radar + skill armory + recipe recommender + content workbench: see a project, judge if it’s worth doing, get the right Skills, copy a kick-off prompt for Codex / Claude Code, then turn it into content.',
      zh: '项目灵感库 + Skill 装备库 + 复现路径推荐器 + 内容转化工作台：看到项目、判断值不值得做、配好 Skill、复制给 Codex / Claude Code 的开工 Prompt，再转化成短视频与图文内容。',
    },
    tags: ['React', 'TypeScript', 'AI Coding', 'Skills'],
    links: [
      { label: { en: 'Launch', zh: '立即体验' }, href: '/arsenal', kind: 'internal' },
      { label: { en: 'Watch demo', zh: '观看演示' }, href: SOCIALS.youtube, kind: 'youtube' },
    ],
  },
  {
    id: 'ttt-hour-of-code',
    category: 'ai',
    title: { en: 'TTT × Hour of Code', zh: 'TTT × 代码一小时' },
    year: '2026',
    status: 'live',
    tagline: {
      en: 'From training notes to a classroom that 60 children can actually join.',
      zh: '从 TTT 学习笔记，到 60 个孩子真正参与的代码课堂。',
    },
    description: {
      en: 'A presentation-ready workshop page about redesigning an Hour of Code class: learning goals, classroom rhythm, participation design, AI time compression, and the reusable dalei-hour-of-code skill.',
      zh: '一页可直接用于分享的 Workshop：课程目标怎么改、60 分钟怎么拆、60 人怎么参与、AI 如何买回准备时间，以及如何封装成可复用的 dalei-hour-of-code Skill。',
    },
    tags: ['TTT', 'Hour of Code', 'Workshop', 'AI Workflow'],
    links: [
      { label: { en: 'Open workshop', zh: '打开 Workshop' }, href: '/ttt-hour-of-code', kind: 'internal' },
    ],
  },
  {
    id: 'hear-the-universe',
    category: 'creative',
    title: { en: 'Hear the Universe', zh: '听见宇宙' },
    year: '2026',
    status: 'live',
    featured: true,
    cover: '/hear-the-universe-world.webp',
    tagline: {
      en: 'A Chinese, keyboard-first Hour of Code experience designed for blind learners.',
      zh: '为视障学习者设计的中文、键盘优先“代码一小时”。',
    },
    description: {
      en: 'A scrollable 60-minute classroom world and five guided missions combine output, variables, input, arithmetic and conditional debugging with screen-reader announcements, a Where am I command, instructor cues, a printable run card and an anonymous completion certificate.',
      zh: '七站滚动课堂世界对齐 60 分钟活动流程，五个任务依次练习输出、变量、输入、运算和条件调试；内置读屏播报、“我在哪里”、讲师提示、可打印执行卡与无姓名完成证明。',
    },
    tags: ['Accessibility', 'Hour of Code', 'Scroll World', 'Keyboard First'],
    links: [
      { label: { en: 'Start the missions', zh: '开始任务' }, href: '/hear-the-universe', kind: 'internal' },
      { label: { en: 'Learning reference', zh: '学习逻辑参考' }, href: 'https://quorumlanguage.com/hourofcode/astro1.html', kind: 'live' },
    ],
  },
  {
    id: 'ai-benchmark',
    category: 'ai',
    title: { en: 'Da Lei AI Benchmark', zh: '大雷 AI 评测台' },
    year: '2026',
    status: 'live',
    featured: true,
    signature: true,
    cover: '/bench-cover-1200.webp',
    tagline: {
      en: 'A fixed personal benchmark - the same prompts, every model, side by side.',
      zh: '固定题目 + 统一规范,把各家模型的真实输出横向摆在一起对照。',
    },
    description: {
      en: 'My own scarce, repeatable AI evaluation: a fixed set of prompts (SVG pelican-on-a-bike, gradient butterfly, landing pages…) with each model’s real output - SVG/HTML/screenshots - rendered side by side. Open it on camera and the comparison is right there.',
      zh: '我自己的稀缺、可复用的 AI 横评:一套固定 Prompt(鹈鹕骑车 SVG、渐变蝴蝶、落地页…),把 Claude / Gemini / ChatGPT 等各家的真实输出(SVG/HTML/截图)并排渲染。录视频时打开页面,对照一目了然 -- 个人唯一的对照价值。',
    },
    tags: ['Benchmark', 'LLM Eval', 'SVG', 'React'],
    links: [
      { label: { en: 'Launch', zh: '立即体验' }, href: '/bench', kind: 'internal' },
      { label: { en: 'Watch demo', zh: '观看演示' }, href: SOCIALS.youtube, kind: 'youtube' },
    ],
  },
  {
    id: 'fugu-research',
    category: 'ai',
    title: { en: 'Fugu / TRINITY - Reproduced', zh: 'Fugu / TRINITY 复现验证' },
    year: '2026',
    status: 'live',
    featured: true,
    cover: '/fugu-cover.svg',
    tagline: {
      en: 'Can a tiny linear router orchestrate a pool of LLMs to beat the best single model? I reproduced the claim on CPU.',
      zh: '一个极小的线性路由器，真能编排一池大模型、打败最强单模型吗？我在 CPU 上把这个论文结论复现了一遍。',
    },
    description: {
      en: 'A hands-on validation of Sakana AI’s Fugu (the TRINITY coordinator, arXiv:2512.04695), using the open-source openfugu reimplementation. Two independent checks run on CPU with only numpy: (1) I drive the real Coordinator loop with a scripted router - 6/6 control-flow behaviours match the paper; (2) I reproduce the central claim with a from-scratch sep-CMA-ES, training a linear router over a synthetic specialist pool. Across 8 seeds it lifts +79% over the best single worker and recovers 99.9% of the oracle, converging in ~2 generations. Full report + runnable script on the page.',
      zh: '对 Sakana AI 的 Fugu(TRINITY 协调器,arXiv:2512.04695)做的动手验证,参考开源复现 openfugu。两项独立检验都在 CPU、仅用 numpy 完成:(1) 用脚本化路由器驱动真实的 Coordinator 循环 -- 6/6 条控制流行为与论文一致;(2) 自己实现 sep-CMA-ES,在合成的专家模型池上训练线性路由器复现核心结论。8 个随机种子下,平均比最强单模型高 +79%,达到 oracle 上限的 99.9%,约 2 代收敛。完整报告 + 可运行脚本都在页面里。',
    },
    tags: ['Research', 'LLM Orchestration', 'CMA-ES', 'Reproduction'],
    links: [
      { label: { en: 'Read the report', zh: '阅读报告' }, href: '/fugu', kind: 'internal' },
      { label: { en: 'openfugu', zh: 'openfugu' }, href: 'https://github.com/trotsky1997/openfugu', kind: 'github' },
      { label: { en: 'Sakana Fugu', zh: 'Sakana Fugu' }, href: 'https://sakana.ai/fugu/', kind: 'live' },
    ],
  },
  {
    id: 'whiteboard-portrait',
    category: 'creative',
    title: { en: 'AI Whiteboard Self-Portrait', zh: 'AI 白板自画像' },
    year: '2026',
    status: 'live',
    featured: true,
    cover: 'https://cdn.jsdelivr.net/gh/paul010/dalei-youtube@master/whiteboard-dalei.png',
    tagline: {
      en: 'One prompt, one photo → a whole hand-drawn whiteboard of who I am and how I work.',
      zh: '一段提示词 + 一张照片 → 一整张手绘白板,讲清我是谁、我怎么工作。',
    },
    description: {
      en: 'A single-prompt personal infographic: Microsoft Copilot turns a headshot and my LinkedIn / Work IQ profile into a photoreal cartoon whiteboard - what I do, who I work with, my role, my values, my tools, and a day in my life. A fun, repeatable way to render your professional identity. Prompt below, result on the left.',
      zh: '一段提示词生成的个人信息图:用 Microsoft Copilot,把一张头像加上我的 LinkedIn / Work IQ 资料,变成一整张照片级卡通白板 -- 我做什么、和谁协作、我的角色、价值观、工具栈,还有「一天的生活」。一种好玩又可复用的「职业身份可视化」方式。提示词见下,结果在左侧。',
    },
    tags: ['Microsoft Copilot', 'AI Image', 'Infographic', 'Personal Brand'],
    prompt:
      "Create a photorealistic image in a clean cartoon whiteboard sketch style that visualises my work life. Include what I do, who I work with, my role, my values and what's important to me. I've attached a headshot so you can guide the sketch of me at the center. Ground your research in Work IQ and the public profile for me on LinkedIn. The graphic should be rich in information. For the avatars of the people I work with, avoid guessing and put a generic icon in place or find their actual profile pictures.",
    links: [
      { label: { en: 'See the LinkedIn post', zh: '查看 LinkedIn 帖子' }, href: 'https://www.linkedin.com/feed/update/urn:li:activity:7476873555243323392/', kind: 'live' },
    ],
  },
  {
    id: 'ai-solutions-library',
    category: 'ai',
    title: { en: 'Free AI Solutions Library', zh: '大雷免费 AI 方案库' },
    year: '2026',
    status: 'live',
    featured: true,
    cover: '/ai-library-cover.svg',
    tagline: {
      en: 'A curated, structured Notion library of the latest open-source, landing-ready AI solutions.',
      zh: '一个结构化、持续更新的 Notion 库 -- 收录最新可落地的开源 AI 方案。',
    },
    description: {
      en: 'The structured backbone of my AI content: a Notion database cataloging open-source / free AI solutions, each scored and tagged by use case (AI Agent, MCP, RAG, Deep Research…), category, maturity, cost, business value, target role, and a “personally tested” flag. Browse it as a gallery, table, board (by industry), or calendar (the AI daily). Free to use.',
      zh: '我做 AI 内容的结构化底座:一个 Notion 数据库,收录开源/免费的 AI 方案,每条都按应用场景(AI Agent、MCP、RAG、Deep Research…)、分类、成熟度、成本、商业价值、适合人群打分标注,还有「是否亲测」标记。可按画廊、表格、看板(按行业)或日历(AI 日报)浏览。免费取用。',
    },
    tags: ['Notion', 'AI Agent', 'Open Source', 'Knowledge Base'],
    links: [
      { label: { en: 'Open the library', zh: '打开方案库' }, href: SOCIALS.notion, kind: 'live' },
      { label: { en: 'Watch on YouTube', zh: 'YouTube 频道' }, href: SOCIALS.youtube, kind: 'youtube' },
    ],
  },
  {
    id: 'cn-print-copilot-demo',
    category: 'ai',
    title: { en: 'Copilot Learner Demo Kit', zh: 'Copilot 三段学员实践包' },
    year: '2026',
    status: 'live',
    featured: true,
    cover: '/copilot-demo-cover.svg',
    tagline: {
      en: 'One fictional project, three live upgrades: clarify the task, verify the facts, then build a bounded Agent.',
      zh: '同一个虚构项目，三次现场升级：把任务说清楚、把事实找准确、再创建有边界的 Agent。',
    },
    description: {
      en: 'A learner-facing practice companion for a two-hour, 100+ person Microsoft Copilot sharing session. It maps directly to the slide deck and turns three demos into clear tasks: clarify a request, verify facts across four fictional files, then create a bounded Agent. Colleagues with the right access can copy the same prompts and follow along; everyone else can observe the input, output, and change, then keep the kits for later practice.',
      zh: '为两小时、100+ 人 Microsoft Copilot 线上分享准备的学员实践页，与 PPT 第 9、15-17、24-26 页对应。三段 Demo 全部按学员视角组织：把任务说清、在四份虚构材料中核对事实、再创建一个会守边界的 Agent。有相应权限的同事可以复制同一条提示词同步跟练；其他同事可以观察输入、输出和变化，并在课后继续使用学员素材。',
    },
    tags: ['Microsoft Copilot', 'Agent Builder', 'Workshop', 'Learner Kit'],
    links: [
      { label: { en: 'Open demo console', zh: '打开演示控制台' }, href: '/copilot-demo', kind: 'internal' },
      { label: { en: 'Download learner kit', zh: '下载学员素材包' }, href: '/copilot-demo/CN-Print-Copilot-学员Demo素材包-v3.zip', kind: 'live' },
    ],
  },
  {
    id: 'copilot-matrix',
    category: 'ai',
    title: { en: 'Microsoft Copilot / Agent Matrix', zh: 'Microsoft Copilot / Agent 产品矩阵' },
    year: '2026',
    status: 'live',
    featured: true,
    cover: '/copilot-cover.svg',
    tagline: {
      en: 'The whole Copilot & Agent stack in three tiers - Use → No-code → Develop. My field note, as of June 2026.',
      zh: '用三层架构看懂 Copilot 与 Agent 全家桶 -- 使用 → 无代码 → 开发。我的阶段性总结，截至 2026 年 6 月。',
    },
    description: {
      en: 'A native, bilingual rebuild of my Microsoft Copilot / Agent product matrix: each product’s license, credit cost (with a usage meter), what it does, and who it’s for - across the Use (Copilot/Cowork), No-code (Agent Builder/Copilot Studio) and Develop (Foundry/dev stack) tiers, plus the employee→developer path. Rebuilt as real web content (not a screenshot), so it’s searchable and stays current.',
      zh: '把我那张「Microsoft Copilot / Agent 产品矩阵」做成了原生、双语的网页内容:每个产品的许可证、Credit 消耗(带消耗等级条)、能做什么、给谁用 -- 覆盖使用(Copilot/Cowork)、无代码(Agent Builder/Copilot Studio)、开发(Foundry/开发栈)三层,外加员工→开发者的选型路径。用真正的网页重建(不是截图),可检索、好更新。',
    },
    tags: ['Microsoft Copilot', 'AI Agent', 'Field Note', 'React'],
    links: [
      { label: { en: 'Read the matrix', zh: '查看产品矩阵' }, href: '/copilot', kind: 'internal' },
      { label: { en: 'Watch on YouTube', zh: 'YouTube 频道' }, href: SOCIALS.youtube, kind: 'youtube' },
    ],
  },
  {
    id: 'ai-video-lab',
    category: 'ai',
    title: { en: 'AI Video Generation Lab', zh: 'AI 视频生成实验室' },
    year: '2026',
    status: 'live',
    featured: true,
    cover: '/videolab-cover.svg',
    tagline: {
      en: 'Type a theme → a 6-shot script → keyframes → a cinematic short. My live experiment in end-to-end AI filmmaking.',
      zh: '输入一个主题 → 6 镜脚本 → 关键帧 → 一部电影感短片。我做的端到端 AI 影片生成现场试验。',
    },
    description: {
      en: 'A hands-on lab that turns a theme into a cinematic short. An LLM breaks it into 6 shots (framing, action, timing); storyboards become photoreal keyframes; then image-to-video synthesizes and composites the segments with transitions and audio. Aspect ratios from 16:9 to 2.39:1, tunable duration and visual style (Kodak 2383, neon noir, Ghibli). Wires together Jimeng 3.0 / Doubao Seedream (image), Seedance 2.0 (video) and Claude Opus 4.7 / GPT-5 / DeepSeek (script) - built to show how far end-to-end AI filmmaking has come, and the cost gap vs a traditional shoot.',
      zh: '一个把主题变成电影感短片的动手实验。LLM 把主题拆成 6 个镜头（构图、动作、时长），分镜生成照片级关键帧，再由图生视频合成片段并加转场与配乐。画幅从 16:9 到 2.39:1，时长与视觉风格（Kodak 2383、霓虹黑色电影、吉卜力）可调。串起即梦 3.0 / 豆包 Seedream（图像）、Seedance 2.0（视频）与 Claude Opus 4.7 / GPT-5 / DeepSeek（脚本）-- 用来直观展示端到端 AI 影片生成到了什么程度，以及和传统拍摄的成本差。',
    },
    tags: ['AI Video', 'Seedance', 'Filmmaking', 'LLM'],
    links: [
      { label: { en: 'Open the lab', zh: '打开实验室' }, href: 'https://movepreviewlt.vercel.app/', kind: 'live' },
      { label: { en: 'Watch on YouTube', zh: 'YouTube 频道' }, href: SOCIALS.youtube, kind: 'youtube' },
    ],
  },
  {
    id: 'perler-beads',
    category: 'creative',
    title: { en: 'Perler Beads Workshop · 3D', zh: '拼豆工坊 · 3D' },
    year: '2026',
    status: 'live',
    featured: true,
    cover: '/perler-cover.svg',
    tagline: {
      en: 'A free 3D perler-beads web game - place beads, iron, and snap a photo with your pixel art. AI designers can compose it for you.',
      zh: '免费的 3D 拼豆网页游戏 -- 一颗颗拼、烫、和作品合影。还能让 AI 设计师替你构图配色。',
    },
    description: {
      en: 'Arrange colorful beads on a virtual pegboard (square 14-40, circle, heart) with brush / bucket / line / eraser and a color picker, in a rotatable, zoomable 3D scene - then iron, export and photograph the result. Start from templates (Mario, Space Invaders, Pac-Man…), turn an image into a bead pattern, or free-create; an “AI 设计” mode has four AI designers compose and color it for you (bring your own key - Claude / OpenAI / DeepSeek / Kimi / 通义 / OpenRouter / local). One-click share to X / LinkedIn.',
      zh: '在可旋转缩放的 3D 场景里，用画笔 / 油漆桶 / 直线 / 橡皮和取色器，在方形（14-40）、圆形、爱心拼盘上一颗颗摆珠，拼完可烫、导出、和作品合影。可以照模板拼（马里奥、太空入侵者、吃豆人…）、把图片转成像素图，或自由创作；「AI 设计」模式有四位 AI 设计师替你构图配色（自带 Key：Claude / OpenAI / DeepSeek / Kimi / 通义 / OpenRouter / 本地）。一键分享到 X / LinkedIn。',
    },
    tags: ['3D', 'Game', 'Pixel Art', 'AI'],
    links: [
      { label: { en: 'Play now', zh: '立即开玩' }, href: 'https://videoscriptharness.vercel.app/', kind: 'live' },
    ],
  },
  {
    id: 'hp-prompt-library',
    category: 'ai',
    title: { en: 'HP FY26 · AI Prompt Library', zh: 'HP FY26 数字学院 · AI 提示词库' },
    year: '2026',
    status: 'live',
    featured: true,
    cover: '/hpprompt-cover.svg',
    tagline: {
      en: 'A prompt library for HP’s FY26 Digital Academy - “safe, practical, purposeful”, built around the Microsoft Copilot ecosystem.',
      zh: 'HP FY26 数字学院的 AI 提示词库 --「安全、实用、有目的」，围绕 Microsoft Copilot 工具生态。',
    },
    description: {
      en: 'A prompt library I built for HP’s FY26 Digital Academy: organized, ready-to-use prompts under a “safe, practical, purposeful” principle, centered on the Microsoft Copilot ecosystem, to help employees pick up frontier productivity tools. A real internal-enablement asset - prompts by scenario, mapped to Copilot workflows across Word / Excel / Teams and beyond.',
      zh: '我为 HP FY26 数字学院做的 AI 提示词库：以「安全、实用、有目的」为理念，围绕 Microsoft Copilot 工具生态整理的即用型提示词，帮助员工掌握前沿生产力工具。一个真实落地的内部赋能资产 -- 提示词按场景组织，对应到 Word / Excel / Teams 等 Copilot 工作流。',
    },
    tags: ['Prompts', 'Microsoft Copilot', 'Enablement', 'HP'],
    links: [
      { label: { en: 'Open the library', zh: '打开提示词库' }, href: 'https://hp-prompt-tool.vercel.app/', kind: 'live' },
    ],
  },
  {
    id: 'hp-workshop-panel',
    category: 'ai',
    title: { en: 'Workshop Presenter Panel · 9 Copilot scenarios', zh: 'AI 工作坊演示讲解面板 · 9 个 Copilot 案例' },
    year: '2026',
    status: 'live',
    featured: true,
    cover: '/hpworkshop-cover.svg',
    tagline: {
      en: 'A projector-first console for teaching a full-day AI workshop: the day’s agenda, nine Copilot scenarios, every prompt one click from the clipboard, acceptance tests, and the teaching notes - all offline.',
      zh: '为全天 AI 工作坊而做的投屏讲解台：全天环节 + 9 个 Copilot 案例，提示词一键复制、验收测试成表、讲师要点随讲随翻 -- 全程离线可用。',
    },
    description: {
      en: 'Built to be projected while teaching, not read afterwards. The top bar carries the full-day agenda (opening → HTML mini-tools → lunch → AI imagery → agents + wrap-up) with a per-block countdown so the day stays on schedule; the rail holds nine scenarios grouped by part, each colour-coded. Every scenario opens on its prompt with one oversized Copy button - the instructor pastes straight into Copilot Web, Microsoft Designer or Copilot Studio without leaving the page - and carries three more tabs: the sample data / knowledge file (also copyable), the acceptance-test table (agent boundary tests at 90+ are flagged red), and teaching notes ending in a “failure to stage on purpose”. Driven entirely from the keyboard: ← → to move, 1-9 to jump, F fullscreen, T timer, H to hide the rail. Everything is inlined, so it works with no network in a training room. The nine scenarios follow the Microsoft Copilot starter-kit structure - a shift scheduler with real constraint rules, an expense splitter, a feedback classifier, a safety infographic, an event poster, a 30-second storyboard, and IT / HR / facilities agents. All sample data is classroom fiction; no real employee, customer or ticket data.',
      zh: '为「边讲边投屏」而做，不是为课后阅读而做。顶栏是全天环节（开场 → HTML 小工具 → 午餐 → AI 图片 → Agent + 总结）并带每环节倒计时，帮你把节奏卡住；侧栏是按 Part 分组、各自配色的 9 个案例。每个案例默认停在提示词页，配一个超大「复制提示词」按钮 -- 讲师不用离开页面就能直接粘进 Copilot Web / Microsoft Designer / Copilot Studio；另外三个页签分别是示例数据与知识文件（同样可复制）、验收测试表（Agent 的 90 分以上边界测试标红）、以及以「故意演一次的失败」收尾的讲解要点。全键盘驱动：← → 翻页、1-9 跳转、F 全屏、T 计时、H 收侧栏。所有内容内联，培训教室断网也能用。9 个案例沿用 Microsoft Copilot Starter Kit 的结构 -- 带真实约束规则的智能排班表、差旅费用分摊器、客户反馈分类、安全检查信息图、活动海报、30 秒分镜，以及 IT / HR / 设施三个 Agent。示例数据均为课堂虚构材料，不含任何真实员工、客户或工单数据。',
    },
    tags: ['Workshop', 'Copilot', 'Teaching', 'Presenter Tool'],
    links: [
      { label: { en: 'Open the panel', zh: '打开演示面板' }, href: '/hpworkshop', kind: 'internal' },
      { label: { en: 'HTML tools column', zh: 'HTML 小工具专栏' }, href: '/aihtml', kind: 'internal' },
    ],
  },
  {
    id: 'quyou-bus',
    category: 'creative',
    title: { en: 'Quyou Bus · AI Night Tour', zh: '趣游巴士 · AI 夜游' },
    year: '2026',
    status: 'live',
    featured: true,
    signature: true,
    cover: '/quyou-bus-cover.svg',
    tagline: {
      en: 'A 3D browser remake of Chengdu’s real immersive party-bus night tour - a first-person three.js cabin that dances to a live-synthesised funk groove, an AI host「Green」, station games including beat-matching, and a tear-off ticket. Fully offline, right here on the site.',
      zh: '把成都那辆沉浸式派对夜游巴士，在浏览器里 3D 复刻成站内一站：实时合成 funk 律动带着整个车厢跟拍起舞、AI 主理人「阿绿」、到站小游戏（含节奏拍点）、下车出联票。纯前端，无需后端跑完全程。',
    },
    description: {
      en: 'Chengdu’s Quyou Bus wraps a graffiti city bus into a moving playground: a costumed host narrates the city while the bus rolls Chunxi Road → Taikoo Li → Hejiang Pavilion → 339 Tower, mixing culture talk with dialect games and open mic. This is that experience decomposed into a playable skeleton and rebuilt as an internal sub-project. The whole cabin runs on a live-synthesised funk/disco groove - kick, snare, hat, filtered bass and chord stabs sequenced in Web Audio with zero audio files, a different tempo and key at every station - and everything on board dances to it: the disco lights punch on the kick, seats and poles pulse, the passengers bob, the camera bounces, confetti bursts on a win. A first-person three.js cabin (seats, graffiti poles with swinging grab-handles, tinsel ceiling, string lights, disco ball, a hand-modeled host「Green」) drives past a procedurally generated night city - recycled buildings whose window grids are drawn on CanvasTexture, each lit differently, with low-frequency bus bumps so the still scene feels alive. A state-machine UI dressed as the bus itself (LED destination sign up top, a station-progress handrail below, a tear-off ticket at the end) runs the loop: the host announces each stop, narrates its culture, then throws a game - Sichuan-dialect guessing, old-song trivia (singer/era/where-featured, never lyrics), a beat-matching rhythm game scored against the live groove (perfect / good / off-beat), or an open mic that hypes and scores your input. All narration, questions and blessings ship as built-in offline banks so the ride always completes; an optional AI proxy could swap them for live generation. All 3D, copy and question banks are original - no affiliation with, or assets from, the real operator.',
      zh: '成都的趣游巴士把一辆涂鸦公交变成移动游乐场：主理人一路从春熙路开到 339 电视塔，边讲城市文化边穿插方言游戏和开放麦。本项目把这套体验拆成玩法骨架，重建成站内的一个专项目。整个车厢跑在一段实时合成的 funk/disco 律动上 -- 底鼓、军鼓、踩镲、滤波贝斯与和弦切分全部由 Web Audio 现场排序生成、零音频文件，每一站换速度与调性 -- 车上的一切都跟着拍子跳：迪斯科灯随底鼓打点、座椅立柱随拍脉动、乘客点头晃动、镜头随鼓点起伏、答对时彩带炸开。第一人称 three.js 车厢（座椅、涂鸦立柱与摆动拉环、串灯、迪斯科球、手工建模的主理人「阿绿」）驶过程序化生成的夜城 -- 循环推进的楼体、用 CanvasTexture 逐栋生成且各不相同的亮窗，加上低频颠簸，让静止场景「活着」。界面本身长成一辆车（顶栏 LED 报站屏、底栏站点进度扶手带、结算是一张可撕联票），由状态机驱动整个流程：主理人报站、解说城市文化、再抛出游戏 -- 方言猜猜猜、老歌考古（只考歌手/年代/影视出处，不涉及歌词）、跟着现场律动打拍子的节奏小游戏（完美/不错/跑拍判定）、或即兴开放麦（捧场并按创意打分）。解说、题目、寄语全部内置离线备稿，页面永远跑得完；可选接入 AI 代理换成实时生成。3D、文案与题库均为原创，与「趣游巴士」运营方无任何关联、未使用其任何素材。',
    },
    tags: ['Three.js', 'Web Audio', '3D', 'Rhythm Game', 'Chengdu'],
    links: [
      { label: { en: 'Board the bus', zh: '上车体验' }, href: '/quyoubus', kind: 'internal' },
      { label: { en: 'Farmer 3D game', zh: '农夫过河 3D' }, href: '/farmer', kind: 'internal' },
    ],
  },
  {
    id: 'farmer-river',
    category: 'creative',
    title: { en: 'Farmer Crosses the River (3D)', zh: '农夫过河 3D' },
    year: '2026',
    status: 'live',
    featured: true,
    cover: '/farmer-cover.svg',
    tagline: {
      en: 'A 3D river-crossing logic game - an extended wolf-goat-cabbage puzzle with chained rules. Ferry apple/chicken/sheep/snake/tiger across; a built-in BFS solver powers Hint & Auto-solve. Optimal is 9 crossings.',
      zh: '3D 过河逻辑小游戏 -- 狼羊菜的加强版，带连锁规则。把苹果/鸡/羊/蛇/老虎渡到对岸；内置 BFS 求解器提供「提示」与「自动演示最优解」。最优 9 次渡河。',
    },
    description: {
      en: 'A playable Three.js game built from primitives (no external models). The boat carries the farmer plus one item; whenever the farmer is away from a bank the chained rules bite - tiger eats sheep unless a chicken is there, snake eats chicken unless a tiger is there, sheep eats apple unless a snake is there. Click an animal on the farmer’s bank to load it, then row across; get all five over to win. Orbit the low-poly scene (animated water, banks, boat, hand-modeled farmer/apple/chicken/sheep/snake/tiger), track crossings vs. the optimal 9, and lean on a real BFS solver for a next-move Hint or a full Auto-solve walkthrough. Bilingual, in the site’s warm-paper look. Inspired by a 农夫过河 animation seen in a course.',
      zh: '一个用 Three.js 基础几何体手搭的可玩游戏（不依赖外部模型）。船每次带农夫 + 1 个；农夫一离开某岸，连锁规则就生效 -- 老虎吃羊（除非有鸡）、蛇吃鸡（除非有老虎）、羊吃苹果（除非有蛇）。点农夫所在岸的动物上船，再渡河；把五个都送到对岸即胜。可自由旋转这个低多边形场景（动态水面、河岸、小船，以及手工建模的农夫/苹果/鸡/羊/蛇/老虎），对照最优 9 次渡河记录步数，还能用内置的 BFS 求解器给「下一步提示」或「自动演示完整最优解」。双语，沿用站点「暖纸墨」风格。灵感来自课程里看到的一个农夫过河动画。',
    },
    tags: ['Three.js', '3D Game', 'Puzzle', 'BFS'],
    links: [
      { label: { en: 'Play the game', zh: '开始玩' }, href: '/farmer', kind: 'internal' },
      { label: { en: '3D prompt lab', zh: '3D 提示词工作台' }, href: '/lab3d', kind: 'internal' },
    ],
  },
  {
    id: 'text2image-studio',
    category: 'ai',
    title: { en: 'Text-to-Image Prompt Studio', zh: '文生图提示词工坊' },
    year: '2026',
    status: 'live',
    featured: true,
    cover: '/text2image-cover.svg',
    tagline: {
      en: 'A workshop column for making good images with words: the 7-block prompt anatomy, an interactive builder, ready-to-use scenario templates, and how to lock a style for platform-level batches.',
      zh: 'Workshop 专栏 · 用文字做好图：提示词七模块结构 + 交互搭建器 + 即用场景模板 + 平台级批量的「风格锁」。',
    },
    description: {
      en: 'A hands-on teaching column for text-to-image prompting. It breaks a prompt into seven ordered blocks (subject, scene, style, composition/camera, light, quality, params) with a color-coded example; an interactive builder assembles a complete Chinese + English prompt live as you type a subject and tap chips; six ready-to-use scenario templates cover e-commerce hero shots, professional headshots, slide covers, event key visuals, icon sets and concept scenes - each with highlighted {slots} to fill and a practical tip. A platform-level section teaches how to lock a look for a whole batch (style prefix, negative prompt, reference image + seed, naming) with a reusable copyable "style-lock" template, plus a click-to-copy modifier cheat-sheet (style / light / camera / quality / mood). Prompts are model-agnostic - Midjourney, 即梦, 豆包, Nano Banana, DALL·E. All copy and templates are original.',
      zh: '面向教学的文生图提示词专栏。把一条提示词拆成有序的七个模块（主体 / 场景 / 风格 / 构图镜头 / 光线 / 画质 / 参数）并给出彩色标注的范例；交互搭建器让你输入主体、点选标签，实时拼出完整的中英双语提示词；六个即用场景模板覆盖电商主图、职业头像、PPT 封面、活动主视觉、图标组、概念场景 -- 每个都带高亮 {占位槽} 和实操贴士。平台级章节讲怎么把风格锁给整批内容（风格前缀、负向提示词、参考图 + 种子、命名），配一段可复制的「风格锁」模板，外加点按即复制的修饰词速查库（风格 / 光线 / 镜头 / 画质 / 氛围）。提示词与模型无关 -- Midjourney、即梦、豆包、Nano Banana、DALL·E 通用。文案与模板均为原创。',
    },
    tags: ['Workshop', 'Text-to-Image', 'Prompt', 'Teaching'],
    links: [
      { label: { en: 'Open the studio', zh: '打开工坊' }, href: '/text2image', kind: 'internal' },
      { label: { en: 'HTML tools column', zh: 'HTML 小工具专栏' }, href: '/aihtml', kind: 'internal' },
    ],
  },
  {
    id: 'aihtml-workshop',
    category: 'ai',
    title: { en: 'AI → Visible HTML Tools', zh: 'AI 做看得见的 HTML 小工具' },
    year: '2026',
    status: 'live',
    featured: true,
    cover: '/aihtml-cover.svg',
    tagline: {
      en: 'A workshop column: scenario + copyable prompt + a live self-contained demo (ECharts / SheetJS / CSS / Three.js). Hit 🎲 to spotlight a random effect.',
      zh: 'Workshop 专栏：业务场景 + 可复制提示词 + 实时自包含效果（ECharts / SheetJS / CSS / Three.js）。点 🎲 随机弹一个上台演示。',
    },
    description: {
      en: 'For a business audience, one clickable result beats an hour on how models work. This column collects prompt recipes that make AI produce something you can SEE - a sales dashboard (ECharts), a web spreadsheet cleaner (SheetJS), glassmorphism / flowing-gradient / flip-card CSS effects, a particle network and warp-speed starfield (Canvas), a spinning 3D cube (Three.js), plus mini tools (pomodoro, palette generator). Each card carries the business scenario, a copyable Chinese prompt, and a live demo that runs fully sandboxed in your browser - no external calls. A 🎲 “random demo” button spotlights one on stage, built for the 2026-07-28 workshop. Prompt-library format inspired by 归藏的提示词库; scenarios, prompts and demos are original.',
      zh: '面向业务团队，一个能点的结果胜过讲一小时模型原理。本专栏收录「让 AI 做出看得见的东西」的提示词配方 -- 销售仪表盘（ECharts）、网页版表格清洗（SheetJS）、玻璃拟态/流动渐变/翻转卡片等 CSS 特效、粒子连线与穿越星空（Canvas）、旋转 3D 立方体（Three.js），外加番茄钟、配色生成器等小工具。每张卡都有业务场景、可复制的中文提示词，以及一个在浏览器沙箱里实时运行的效果（无外部调用）。顶部「🎲 随机演示」按钮可随机抽一个上台，为 2026-07-28 workshop 而做。提示词库形式参考归藏的提示词库，场景/提示词/效果均为原创。',
    },
    tags: ['Workshop', 'AI Coding', 'ECharts', 'Three.js'],
    links: [
      { label: { en: 'Open the column', zh: '打开专栏' }, href: '/aihtml', kind: 'internal' },
      { label: { en: 'Guizang prompts', zh: '归藏提示词库' }, href: 'https://github.com/op7418/guizang-s-prompt', kind: 'github' },
    ],
  },
  {
    id: 'notebooklm-slides',
    category: 'ai',
    title: { en: 'NotebookLM Slide YAML', zh: 'NotebookLM 线画幻灯片' },
    year: '2026',
    status: 'live',
    featured: true,
    cover: '/notebooklm-cover.svg',
    tagline: {
      en: 'Feed NotebookLM a short YAML style spec and it renders any topic as a consistent hand-drawn / line-art slide deck. Pick a look, copy, paste.',
      zh: '给 NotebookLM 一段简短的 YAML 风格规格，它就把任意主题生成成风格统一的手绘线画幻灯片。选风格、复制、粘贴。',
    },
    description: {
      en: 'A bilingual showcase of the “YAML style spec → hand-drawn slides in NotebookLM” technique (credited to しらき@パワポ図解). Four looks - minimal line art, crayon doodle, warm line, flat infographic - each with an original, copyable YAML template you tune (deck language, slide count, palette) and a live style thumbnail. Includes a three-step how-to and the rules that keep a deck visually consistent (one message per slide, one accent color, uniform line weight, generous white space). The YAML is an original template and the thumbnails are original renderings - the source post is credited and linked.',
      zh: '对「YAML 风格规格 → NotebookLM 手绘幻灯片」技法的双语展示（署名 しらき@パワポ図解）。四种风格 -- 简约线画、蜡笔涂鸦、暖橙线画、扁平信息图 -- 每种都配一段可一键复制的原创 YAML 模板（可调幻灯片语言、页数、配色）和实时风格缩略图。附三步上手指引，以及让整套视觉统一的规则（每页一件事、单一点缀色、统一线条粗细、大量留白）。YAML 为原创模板、缩略图为原创绘制，已注明并链回原推来源。',
    },
    tags: ['NotebookLM', 'Slides', 'YAML', 'Design'],
    links: [
      { label: { en: 'Open the showcase', zh: '打开展示页' }, href: '/notebooklm', kind: 'internal' },
      { label: { en: 'Original by しらき', zh: 'しらき 原推' }, href: 'https://x.com/kumiko_shiraki/status/2076230080750137560', kind: 'live' },
    ],
  },
  {
    id: 'promptforge',
    category: 'ai',
    title: { en: 'PromptForge', zh: '提示词锻造台' },
    year: '2026',
    status: 'live',
    featured: true,
    cover: '/promptforge-cover.svg',
    tagline: {
      en: 'Paste a rough ask → a rule engine decomposes it into CO-STAR / CRISPE / BROKE slots → a complete prompt, with verification clauses. No LLM call.',
      zh: '贴一段大白话 → 规则引擎按 CO-STAR / CRISPE / BROKE 框架拆槽位 → 组装完整提示词，可注入验证条款。不调大模型。',
    },
    description: {
      en: 'A teaching tool for the workplace loop: write the prompt, verify the output, challenge the conclusion. Fully client-side and rule-based (transparent regex heuristics - no LLM): it detects role, audience, format, tone, constraints and examples from your rough description, slots them into six popular frameworks (a 2026 best-practice composite, CO-STAR, CRISPE, ICIO, BROKE, RTF), lets you refine each slot, and assembles the prompt in XML-tag or Markdown structure. One click adds verification clauses - reason first, admit uncertainty, evidence per claim, self-critique, clarify before assuming. Ends with a six-habit 2026 best-practice cheat sheet.',
      zh: '为职场闭环而做的教学工具：会写 prompt、验证 AI 输出、挑战 AI 结论。纯前端规则引擎（透明的正则启发式 -- 不调大模型）：从你的大白话里识别角色、受众、格式、语气、约束与示例，装进六个流行框架（2026 最佳实践合成版、CO-STAR、CRISPE、ICIO、BROKE、RTF）的槽位，逐项修订后按 XML 标签或 Markdown 结构组装成完整提示词。一键注入验证条款 -- 先推理、不确定就明说、结论给依据、自我挑战、先澄清再动手。文末附 2026 最佳实践六习惯速查。',
    },
    tags: ['Prompt Engineering', 'Frameworks', 'Rule Engine', 'Teaching'],
    links: [
      { label: { en: 'Open the forge', zh: '打开锻造台' }, href: '/promptforge', kind: 'internal' },
      { label: { en: 'Prompt library', zh: '提示词库' }, href: '/prompts', kind: 'internal' },
    ],
  },
  {
    id: 'copilot-camp-cowork',
    category: 'ai',
    title: { en: 'Copilot Camp - Cowork Course', zh: 'Copilot Camp - Cowork 学习课' },
    year: '2026',
    status: 'live',
    featured: true,
    cover: '/copilotcamp-cover.svg',
    tagline: {
      en: 'Microsoft’s Copilot Cowork lab, rebuilt as a Khan-Academy-style course - units, progress, and a quiz per lesson.',
      zh: '把微软的 Copilot Cowork 实验重建成可汗学院式课程 -- 单元、进度、每节随堂检测。',
    },
    description: {
      en: 'A bilingual learning rebuild of Microsoft Copilot Camp’s lab "CWRK0 · Copilot Cowork setup and extensibility". Not a flat article - a real course: four units (understand Cowork → prepare your tenant → run your first delegated tasks → extend it with Skills & Plugins), a progress sidebar with persisted completion, copyable demo prompts, every official screenshot vendored into this repo, and a knowledge check after every lesson. Content & screenshots © Microsoft, used for study.',
      zh: '把微软 Copilot Camp 的实验「CWRK0 · Copilot Cowork setup and extensibility」做成双语学习课程。不是平铺文章 -- 是一门真正的课：四个单元（理解 Cowork → 准备租户 → 跑通第一批委托任务 → 用 Skill 与 Plugin 扩展），带进度侧栏与本地保存的完成状态、可一键复制的示例提示词、把官方所有截图收录进本仓库直接调用，且每节课后都有随堂检测。内容与截图版权归 Microsoft，仅供学习。',
    },
    tags: ['Microsoft Copilot', 'Cowork', 'Course', 'Learning'],
    links: [
      { label: { en: 'Start the course', zh: '开始学习' }, href: '/copilotcamp', kind: 'internal' },
      { label: { en: 'Original lab', zh: '实验原文' }, href: 'https://microsoft.github.io/copilot-camp/pages/copilot-cowork/00-cowork-setup/', kind: 'live' },
    ],
  },
  {
    id: 'agent-templates',
    category: 'ai',
    title: { en: 'Agent Templates', zh: 'Agent 模板库' },
    year: '2026',
    status: 'live',
    featured: true,
    cover: '/agents-cover.svg',
    tagline: {
      en: 'Ready-to-use agent templates by scenario - copy the system prompt, ship an agent.',
      zh: '按场景分好的开箱即用 Agent 模板 -- 复制系统提示词,直接上手建 Agent。',
    },
    description: {
      en: 'A gallery of agent templates across scenarios - Creator, Engineering, Marketing, Productivity, Product, Research. Each card carries a battle-tested, copyable system prompt plus suggested tool integrations and example tasks. Drop the prompt into Copilot Studio or any agent platform and go. Prompts are in English so they’re portable anywhere.',
      zh: '一组覆盖多场景的 Agent 模板 -- 内容创作、工程开发、营销增长、效率办公、产品、研究。每张卡都配了打磨过、可一键复制的系统提示词,外加建议的工具集成与示例任务。把提示词丢进 Copilot Studio 或任意 Agent 平台即可上手。提示词用英文,便于跨平台通用。',
    },
    tags: ['AI Agent', 'Prompts', 'Templates', 'React'],
    links: [
      { label: { en: 'Browse templates', zh: '浏览模板' }, href: '/agents', kind: 'internal' },
      { label: { en: 'Skill library', zh: 'Skill 技能库' }, href: '/skills', kind: 'internal' },
    ],
  },
  {
    id: 'skill-library',
    category: 'ai',
    title: { en: 'Skill Library', zh: 'Skill 技能库' },
    year: '2026',
    status: 'live',
    featured: true,
    cover: '/skills-cover.svg',
    tagline: {
      en: 'Modular agent capabilities - search, render, fetch, compute, transact - by provider.',
      zh: '可插拔的 Agent 能力 -- 搜索、生成、抓取、计算、交易 -- 按服务接入。',
    },
    description: {
      en: 'If agents are the persona, skills are the powers. A library of ~27 modular capabilities, each backed by a provider/API (Tavily, ElevenLabs, Whisper, pgvector, Playwright, GitHub…), grouped by domain - Media, Research, Data, Commerce, Dev. Copy the skill brief into your agent’s tool definition; keys stay in your own environment. Companion to the Agent Templates.',
      zh: '如果 Agent 是「人设」，Skill 就是「能力」。约 27 个可插拔能力,每个背后接一个服务/API(Tavily、ElevenLabs、Whisper、pgvector、Playwright、GitHub…),按领域分好 -- 媒体、研究、数据、电商、开发。把技能简介复制进 Agent 的工具定义即可;密钥放你自己的环境。与 Agent 模板库配套。',
    },
    tags: ['AI Agent', 'Skills', 'MCP', 'Integrations'],
    links: [
      { label: { en: 'Browse skills', zh: '浏览技能' }, href: '/skills', kind: 'internal' },
      { label: { en: 'Agent templates', zh: 'Agent 模板' }, href: '/agents', kind: 'internal' },
    ],
  },
  {
    id: 'microsoft-cat-agent-skills',
    category: 'ai',
    title: { en: 'CAT Agent Skills Distribution', zh: 'CAT Agent Skills 中文分发站' },
    year: '2026',
    status: 'live',
    featured: true,
    cover: '/cat-skills-cover.webp',
    tagline: {
      en: 'A locally distributed catalog of Microsoft CAT community Skills for training and hands-on use.',
      zh: '为培训与实战准备的 Microsoft CAT 社区 Skill 本地分发目录。',
    },
    description: {
      en: 'A full local distribution mirror of the Microsoft CAT Agent Skills gallery. The catalog vendors 76 published entries, their metadata, readable Markdown, and every available ZIP, JSON, or SKILL.md download. Search by name, author, platform, type, or tag; inspect provenance and fixed-commit source links before installing. A repeatable sync script keeps the mirror refreshable while preserving contributor attribution and the upstream MIT license.',
      zh: 'Microsoft CAT Agent Skills 图库的完整本地分发镜像。仓库内实际收录 76 个已发布条目的元数据、可阅读 Markdown，以及全部可用 ZIP、JSON 或 SKILL.md 下载文件。支持按名称、作者、平台、类型与标签检索，安装前可核对来源与固定提交源码。项目同时提供可重复同步脚本，并保留作者署名和上游 MIT 许可证。',
    },
    tags: ['Microsoft', 'Agent Skills', 'Copilot Studio', 'Training'],
    links: [
      { label: { en: 'Open distribution catalog', zh: '打开分发目录' }, href: '/cat-skills', kind: 'internal' },
      { label: { en: 'Official gallery', zh: '微软官方图库' }, href: 'https://microsoft.github.io/cat-agent-skills/', kind: 'live' },
    ],
  },
  {
    id: 'smallville',
    category: 'creative',
    title: { en: 'Smallville - Generative Agents', zh: 'Smallville 小镇 · 生成式智能体' },
    year: '2026',
    status: 'live',
    featured: true,
    cover: '/town-cover.svg',
    tagline: {
      en: 'A tiny town where AI townsfolk live their day - coffee, work, an evening chat.',
      zh: '一个小镇,AI 居民按日程过日子 -- 喝咖啡、上班、傍晚在广场闲聊。',
    },
    description: {
      en: 'An interactive canvas homage to Stanford’s “Generative Agents: Interactive Simulacra of Human Behavior” (Park et al., 2023): eight townsfolk move between café, library, office, park and home on a simulated day-night clock, with status bubbles and a live activity log. Honest scope - the routines are scripted, not LLM-driven - a lightweight visual tribute that runs entirely in your browser.',
      zh: '一个 canvas 互动作品,致敬斯坦福「Generative Agents: Interactive Simulacra of Human Behavior」(Park et al., 2023):八个居民在咖啡馆、图书馆、办公室、公园和家之间移动,跟着昼夜时钟,带状态气泡和实时活动日志。诚实说明 -- 日程是脚本化的,不是大模型驱动 -- 一个纯浏览器运行的轻量视觉致敬。',
    },
    tags: ['Generative Agents', 'Canvas', 'Simulation', 'React'],
    links: [
      { label: { en: 'Enter the town', zh: '进入小镇' }, href: '/town', kind: 'internal' },
      { label: { en: 'The paper', zh: '论文原文' }, href: 'https://arxiv.org/abs/2304.03442', kind: 'live' },
    ],
  },
  {
    id: 'agent-patterns',
    category: 'ai',
    title: { en: 'Agent Design Patterns', zh: 'Agent 设计模式' },
    year: '2026',
    status: 'live',
    featured: true,
    cover: '/patterns-cover.svg',
    tagline: {
      en: 'The agent design patterns, organized along the agent loop - a coordinate system, not a checklist.',
      zh: '把 Agent 设计模式沿「Agent 回路」排开 -- 是坐标系,不是平铺清单。',
    },
    description: {
      en: 'A study map of how to architect an agent, structured after 黄佳’s “Agent 设计模式之美”. Instead of a flat list, the patterns sit on the seven layers of the agent loop - Perception, Memory, Reasoning, Action, Reflection, Collaboration, Governance - plus Composition, so you choose by where your problem actually sits. Bilingual, with a one-line summary for each of ~32 patterns.',
      zh: '一张「怎么架构一个 agent」的学习地图,按黄佳《Agent 设计模式之美》的框架整理。不是平铺清单,而是把模式落在 Agent 回路的七个层级上 -- 感知、记忆、推理、行动、反思、协作、治理 -- 外加组合,让你按问题真正所在的坐标来选。双语,约 32 个模式各配一句话概览。',
    },
    tags: ['AI Agent', 'Architecture', 'Patterns', 'Study Map'],
    links: [
      { label: { en: 'Read the map', zh: '查看模式地图' }, href: '/patterns', kind: 'internal' },
      { label: { en: 'Source repo', zh: '原始仓库' }, href: 'https://github.com/huangjia2019/agent-design-patterns', kind: 'github' },
    ],
  },
  {
    id: 'prompt-library',
    category: 'ai',
    title: { en: 'Prompt Library', zh: '提示词弹药库' },
    year: '2026',
    status: 'live',
    featured: true,
    cover: '/prompts-cover.svg',
    tagline: {
      en: '124 ready-to-use “act as …” role prompts - search, filter, copy.',
      zh: '124 条「我希望你充当…」角色提示词 -- 搜索、筛选、一键复制。',
    },
    description: {
      en: 'A base camp of prompt ammo for any model: 124 Chinese role prompts (translator, Linux terminal, interviewer, writing coach, and more) with full-text search and topic quick-filters, each one-click copyable. Sourced from PlexPt/awesome-chatgpt-prompts-zh (CC0); rebuilt as a searchable in-browser library, tri-lingual UI (繁體 converted on the fly).',
      zh: '任何模型都能用的提示词弹药根据地:124 条中文角色提示词(英语翻译、Linux 终端、面试官、写作教练……),带全文搜索与主题快筛,每条一键复制。来源 PlexPt/awesome-chatgpt-prompts-zh(CC0);重建为可搜索的浏览器内库,UI 三语(繁體实时转换)。',
    },
    tags: ['Prompts', 'Library', 'Search', 'React'],
    links: [
      { label: { en: 'Open the library', zh: '打开提示词库' }, href: '/prompts', kind: 'internal' },
      { label: { en: 'Source repo', zh: '原始仓库' }, href: 'https://github.com/PlexPt/awesome-chatgpt-prompts-zh', kind: 'github' },
    ],
  },
  {
    id: 'lab3d',
    category: 'creative',
    title: { en: '3D Prompt Workbench', zh: '3D 提示词工作台' },
    year: '2026',
    status: 'live',
    featured: true,
    cover: '/lab3d-cover.svg',
    tagline: {
      en: '63 Three.js scene prompts from petergpt - browse, copy, and watch them become live pages. Seven executed: balloons, misty pillars, the falls, fireflies, the ice city, the palace, the salmon run.',
      zh: '63 条来自 petergpt 的 Three.js 场景提示词 -- 浏览、复制、看它们变成真实页面。已生成 7 个:热气球、雾中石林、大瀑布、萤火虫、冰城、紫禁城、鲑鱼洄游。',
    },
    description: {
      en: 'A workbench that turns a prompt collection into living results. All 63 prompts from petergpt/3d-prompt-collection are vendored verbatim with credit - searchable by section (big worlds, playable scenes, natural spectacles…), each copyable in one click. The twist: prompts I actually execute become full-screen Three.js pages launched right from their card. Prompt #26 is live - 90 instanced hot-air balloons drifting over fairy chimneys at dawn, with a time-of-day slider, wind controls, and a ride-along basket camera. More prompts get executed on request; the workbench is the results index.',
      zh: '一个把提示词合集变成活结果的工作台。petergpt/3d-prompt-collection 的 63 条提示词原样收录并注明出处 -- 按分类(宏大世界、可玩场景、自然奇观…)可搜可筛,每条一键复制。特别之处:被我真正执行的提示词会变成全屏 Three.js 页面,直接从卡片上打开。#26 已生成 -- 90 只 instanced 热气球在黎明的精灵烟囱上空漂移,带时间滑杆、风向风速控制和乘篮视角。想执行哪条报编号;工作台就是结果索引。',
    },
    tags: ['Three.js', 'Prompts', 'Workbench', '3D'],
    links: [
      { label: { en: 'Open the workbench', zh: '打开工作台' }, href: '/lab3d', kind: 'internal' },
      { label: { en: 'Fly Cappadocia', zh: '直飞卡帕多奇亚' }, href: '/cappadocia', kind: 'internal' },
      { label: { en: 'Prompts by petergpt', zh: '提示词来源' }, href: 'https://github.com/petergpt/3d-prompt-collection', kind: 'github' },
    ],
  },
  {
    id: 'chengdu-guide',
    category: 'creative',
    title: { en: 'Chengdu, from Taikoo Li', zh: '成都指南 · 以太古里为原点' },
    year: '2026',
    status: 'live',
    featured: true,
    cover: '/chengdu-cover.svg',
    tagline: {
      en: 'A July business-trip field guide - interactive prep checklist, the Chengdu flavor cheat sheet, four evenings and one stolen morning.',
      zh: '七月出差版实用指南 -- 可勾选的行前清单、成都特色速查、四个晚上加偷来的一个上午。',
    },
    description: {
      en: 'A bilingual field guide to Chengdu built around one anchor: Chunxi Road station and Taikoo Li. An interactive prepare-ahead checklist with D-day offsets (the panda base opens booking 14 days out - the one you must not miss), ticks persisted in your browser; a Chengdu-flavor cheat sheet across eat / sip / watch / say (鸳鸯锅 etiquette, gaiwan tea, ear cleaning, face-changing, and how to use 巴适 correctly); and a business-trip itinerary that fits four evenings plus one stolen 7:30am panda morning. Deliberately free of personal itinerary details.',
      zh: '一份以「春熙路站 + 太古里」为原点的双语成都指南。可交互的行前准备清单,按 D-日倒推(熊猫基地提前 14 天开约 -- 全场最不能错过的一项),勾选状态存在浏览器里;成都特色速查表覆盖吃/喝/看/说(鸳鸯锅的体面、盖碗茶、采耳、变脸,以及「巴适」的正确用法);再加一份适配出差节奏的行程 -- 四个晚上,加偷出来的一个 7:30 熊猫上午。页面刻意不含个人具体行程。',
    },
    tags: ['Travel', 'Chengdu', 'Checklist', 'Guide'],
    links: [
      { label: { en: 'Open the guide', zh: '打开指南' }, href: '/chengdu', kind: 'internal' },
      { label: { en: 'Panda Base tickets', zh: '熊猫基地票务' }, href: 'https://www.panda.org.cn/cn/pandavalley/tickets/', kind: 'live' },
    ],
  },
  {
    id: 'dino-blaster',
    category: 'creative',
    title: { en: 'Dino Blaster', zh: 'Dino Blaster · 加特林 vs 恐龙' },
    year: '2026',
    status: 'live',
    featured: true,
    cover: '/dino-cover.svg',
    tagline: {
      en: 'A Minecraft-flavored FPS built with Fable 5 - gatling gun, grenades, wandering blocky dinosaurs.',
      zh: '用 Fable 5 开发的 Minecraft 风格 FPS -- 手持加特林扫射游荡的恐龙,还能扔手雷炸它们。',
    },
    description: {
      en: 'An arcade first-person shooter generated with Claude (Fable 5), zero assets: a voxel world built from instanced blocks, box-built T-rexes that wander the map and charge when you get close, a six-barrel gatling that has to spin up before it shreds, and grenades that arc, bounce and blow dinos into voxel confetti. Every sound is synthesized WebAudio; every model is boxes. Pointer-lock WASD+mouse on desktop, virtual joystick + fire/grenade buttons on mobile. Pure three.js in one file.',
      zh: '用 Claude(Fable 5)生成的街机第一人称射击,零素材:instanced 方块搭出的体素世界、方块拼装的霸王龙(平时游荡,靠近会扑上来)、需要先转起来才喷弹的六管加特林,以及会划抛物线、落地弹跳、把恐龙炸成方块碎屑的手雷。所有音效由 WebAudio 现场合成,所有模型都是方块。桌面端指针锁定 WASD+鼠标,移动端虚拟摇杆 + 开火/手雷按钮。纯 three.js,单文件。',
    },
    tags: ['Game', 'three.js', 'FPS', 'Fable 5'],
    links: [
      { label: { en: 'Play now', zh: '立即开玩' }, href: '/dino', kind: 'internal' },
      { label: { en: 'Source', zh: '源码' }, href: 'https://github.com/paul010/gemini-kinetic-particles', kind: 'github' },
    ],
  },
  {
    id: 'videogen-workflow',
    category: 'ai',
    title: { en: 'AI Video Workflow - 3 Models, 1 Key', zh: 'AI 视频生成流程 · 3 模型 1 Key' },
    year: '2026',
    status: 'live',
    featured: true,
    cover: '/videogen-cover.svg',
    tagline: {
      en: 'How Kiana Liang faked a World Cup: GPT Image 2 → Seedance 2.0, two API calls.',
      zh: 'Kiana Liang 怎么「伪造」了一场世界杯:GPT Image 2 → Seedance 2.0,两次 API 调用。',
    },
    description: {
      en: 'A bilingual walkthrough of Kiana Liang (@Kiana_Liang0609)’s AI-video workflow - the one behind her “France vs Norway, 2026 World Cup” reel for a match that never happened. The trick is a nine-panel storyboard: GPT Image 2 draws all nine shots on one canvas (so the character can’t drift), then Seedance 2.0 animates it into a 15-second clip - with Nano Banana 2 for 4K keyframes, all through one Atlas Cloud key, and packaged as a Claude Code “drama-director” skill (two messages: the script and “confirm”). ~3-5 min, ~$1.5-2 a clip. Credit and links to the original video, write-up and code are hers.',
      zh: '对 Kiana Liang(@Kiana_Liang0609)AI 视频流程的双语拆解 -- 就是她那段「法国 vs 挪威,2026 世界杯」、而比赛从未发生的集锦背后的流程。诀窍是九宫格分镜:GPT Image 2 把九个镜头画在一张画布上(人物就不会跑样),Seedance 2.0 再把它动画成 15 秒视频 -- Nano Banana 2 负责 4K 关键帧,全走一个 Atlas Cloud key,并打包成 Claude Code 的「drama-director」skill(只发两条消息:剧本和「确认」)。约 3-5 分钟、每段约 $1.5-2。视频、教程与代码均出自她本人,页面已注明并链回。',
    },
    tags: ['AI Video', 'Seedance', 'GPT Image', 'Workflow'],
    links: [
      { label: { en: 'See the workflow', zh: '查看流程' }, href: '/videogen', kind: 'internal' },
      { label: { en: 'Original by Kiana', zh: 'Kiana 原推文' }, href: 'https://x.com/Kiana_Liang0609/status/2072695324242796617', kind: 'live' },
    ],
  },
  {
    id: 'designskill-lab',
    category: 'ai',
    title: { en: 'Design Skill Lab - Field Note', zh: '设计 Skill 实测 · 笔记' },
    year: '2026',
    status: 'live',
    featured: true,
    cover: '/designskill-cover.svg',
    tagline: {
      en: 'Does adding a design Skill actually help? A bilingual read of 乔木’s 6-way comparison.',
      zh: '装一个设计 Skill 到底有没有用?对乔木「六方横评」的双语解读。',
    },
    description: {
      en: '乔木 (Qiaomu, @vista8) ran a clean experiment: five frontend-design Claude Skills plus a no-skill control, the same 7 tasks under identical constraints, 42 generated pages read side by side. My bilingual field note distills it: the six variants (baseline, frontend-design, web-design-guidelines, ui-ux-pro-max, taste-skill, emil-design-eng) with strengths/weaknesses, a winner-by-task table, and the headline insight - a Skill’s job is prohibition, not teaching (ban purple gradients & centered layouts, don’t add tricks). All credit to 乔木; the full experiment and 42 live pages are on his site.',
      zh: '乔木(@vista8)做了个干净的实验:五个前端设计类 Claude Skill 加一个「不装 Skill」的对照组,在完全相同的约束下做同样的 7 道题,42 个生成页面并排看。我做了双语笔记浓缩它:六个变体(baseline、frontend-design、web-design-guidelines、ui-ux-pro-max、taste-skill、emil-design-eng)的优劣、每道题谁赢的表格,以及那句核心结论 -- Skill 的作用是「禁止」而非「教」(禁掉紫色渐变与居中布局,而不是加花招)。功劳都归乔木;完整实验与 42 个真实页面在他的站上。',
    },
    tags: ['Claude Skills', 'Design', 'Field Note', 'Benchmark'],
    links: [
      { label: { en: 'Read the field note', zh: '查看实测笔记' }, href: '/designskill', kind: 'internal' },
      { label: { en: 'Original by 乔木', zh: '乔木原版' }, href: 'https://designskill.qiaomu.ai/', kind: 'live' },
    ],
  },
  {
    id: 'cici-index',
    category: 'ai',
    title: { en: 'CICI - Underrated Cities Index', zh: 'CICI · 被人口辜负的城市' },
    year: '2026',
    status: 'live',
    featured: true,
    cover: '/cici-cover.svg',
    tagline: {
      en: 'Which cities are far less famous than their population implies? I built a skill and ran it - China and Japan.',
      zh: '哪些城市远不如其人口规模所暗示的那样出名?我做了个 skill,跑了一遍 -- 中国和日本。',
    },
    description: {
      en: 'A for-fun data project: the CICI (Comparatively-Insignificant City) method takes a city’s standardized household population and subtracts every source of fame - provincial-capital status, 5A scenery, brand HQs, history, cuisine, memes, even disasters (negative fame is still fame). The highest score wins: big by population, yet barely known. I encoded the method as a reusable Skill and ran it - first over China’s prefecture-level cities, then over Japan’s municipalities - with a country switcher and an itemized fame breakdown for each city. Subjective, AI-assisted, disagree kindly. Method popularized by @pretentiouswhat.',
      zh: '一个好玩的数据项目:CICI(相对无名城市指数)方法,把一座城市标准化后的户籍人口,减去一切名气来源 -- 省会身份、5A 景点、品牌总部、历史、美食、网络梗,甚至灾难(负面声誉也是声誉)。得分最高者胜出:人口很大,却几乎无人知晓。我把方法固化成一个可复用的 Skill,拿它跑了中国的地级市,并把前 15 名做成榜单,每座城市都有名气拆解。主观、AI 辅助,欢迎友好反对。方法由 @pretentiouswhat 提出。',
    },
    tags: ['Skill', 'Data', 'China', 'For Fun'],
    links: [
      { label: { en: 'See the leaderboard', zh: '查看榜单' }, href: '/cici', kind: 'internal' },
      { label: { en: 'The original method', zh: '方法原帖' }, href: 'https://x.com/pretentiouswhat/status/2072979695855870285', kind: 'live' },
    ],
  },
  {
    id: 'plantuml-studio',
    category: 'tool',
    title: { en: 'PlantUML Renderer', zh: 'PlantUML 渲染器' },
    year: '2026',
    status: 'live',
    tagline: {
      en: 'Write UML, render it live, and copy the actual diagram.',
      zh: '写 UML 语法，实时渲染，并一键复制生成的实际图。',
    },
    description: {
      en: 'A live PlantUML editor: type UML (sequence, class, activity, mindmap, gantt, use-case…), see it render instantly, then copy the real image (PNG to clipboard), copy the SVG, copy the URL, or download. Encoding is done in-browser (raw-DEFLATE) - no build step; the diagram is rendered by the public PlantUML server.',
      zh: '实时 PlantUML 编辑器:输入 UML 语法(时序图、类图、活动图、思维导图、甘特图、用例图…),即时渲染,然后一键复制生成的实际图片(PNG 进剪贴板)、复制 SVG、复制链接或下载。编码在浏览器本地完成(raw-DEFLATE),图由 PlantUML 公共服务器渲染。',
    },
    tags: ['PlantUML', 'UML', 'Diagram', 'React'],
    links: [
      { label: { en: 'Launch', zh: '立即体验' }, href: '/uml', kind: 'internal' },
      { label: { en: 'PlantUML', zh: 'PlantUML' }, href: 'https://plantuml.com', kind: 'live' },
    ],
  },
  {
    id: 'markdown-studio',
    category: 'tool',
    title: { en: 'Markdown Studio', zh: 'Markdown 工具箱' },
    year: '2026',
    status: 'live',
    tagline: {
      en: 'Markdown → WeChat article & YouTube description, in one place.',
      zh: 'Markdown 一键转公众号排版 & YouTube 视频简介。',
    },
    description: {
      en: 'A lightweight, in-browser Markdown toolbox with five converters: WeChat-article preview (one-click rich-text copy), YouTube description, X/Twitter thread splitter (≤280 chars, numbered), table-of-contents generator, and plain-text strip. All client-side; more get added over time.',
      zh: '浏览器端的轻量 Markdown 工具箱，五个转换器：公众号排版预览（一键复制富文本）、YouTube 视频简介、X 推文拆条（≤280 字、自动编号）、目录 TOC 生成、纯文本去格式。全部纯前端，持续累加更多。',
    },
    tags: ['React', 'marked', 'WeChat', 'YouTube', 'X'],
    links: [
      { label: { en: 'Launch', zh: '立即体验' }, href: '/md', kind: 'internal' },
      { label: { en: 'Inspiration', zh: '灵感来源' }, href: 'https://github.com/doocs/md', kind: 'github' },
    ],
  },
  {
    id: 'image-studio',
    category: 'tool',
    title: { en: 'Image Studio', zh: '图片工具箱' },
    year: '2026',
    status: 'live',
    tagline: {
      en: 'Compress, resize & convert images - 100% in your browser, no upload.',
      zh: '压缩、缩放、转格式 -- 全程浏览器本地处理,图片不上传。',
    },
    description: {
      en: 'A zero-dependency, Canvas-based image tool: drop an image, resize to a max width, convert between JPG / WebP / PNG and tune quality, with a YouTube-thumbnail preset and live size-savings readout. Everything runs locally - nothing leaves your device.',
      zh: '零依赖、基于 Canvas 的图片工具:拖入图片,按最大宽度缩放,在 JPG / WebP / PNG 间转换并调质量,内置 YouTube 封面预设与实时体积压缩比。全部本地运行,图片不离开你的设备。',
    },
    tags: ['React', 'Canvas', 'Image', 'Privacy'],
    links: [
      { label: { en: 'Launch', zh: '立即体验' }, href: '/img', kind: 'internal' },
    ],
  },
  {
    id: 'screenshot-to-code',
    category: 'tool',
    title: { en: 'Screenshot → Code', zh: '截图转代码' },
    year: '2026',
    status: 'wip',
    tagline: {
      en: 'Drop a UI screenshot, get a self-contained HTML page (bring your own Gemini key).',
      zh: '上传界面截图,生成自包含 HTML 页面(自带 Gemini Key,实验性)。',
    },
    description: {
      en: 'Upload a screenshot and Gemini reproduces it as a single Tailwind HTML file, with live preview and copy/download. Experimental & bring-your-own-key: your Gemini API key stays in your browser and calls Google directly - nothing is proxied or stored server-side.',
      zh: '上传一张界面截图,Gemini 把它还原成单文件 Tailwind HTML,带实时预览与复制/下载。实验性、自带 Key:你的 Gemini API Key 只存在浏览器本地、直连 Google,不经任何服务器中转或存储。',
    },
    tags: ['Gemini', 'Vision', 'React', 'BYO-Key'],
    links: [
      { label: { en: 'Launch', zh: '立即体验' }, href: '/s2c', kind: 'internal' },
      { label: { en: 'Inspiration', zh: '灵感来源' }, href: 'https://github.com/abi/screenshot-to-code', kind: 'github' },
    ],
  },
  {
    id: 'fluid-playground',
    category: 'creative',
    title: { en: 'Fluid Playground', zh: '流体 Fluid' },
    year: '2026',
    status: 'live',
    tagline: {
      en: 'A full-screen WebGL fluid you paint with your cursor.',
      zh: '用鼠标/手指绘制的全屏 WebGL 流体。',
    },
    description: {
      en: 'An interactive, full-screen fluid simulation - move your cursor (or touch) to paint glowing, swirling color. Built on Pavel Dobryakov’s WebGL-Fluid-Simulation (MIT); the homepage hero also carries a warm, toned-down version of it.',
      zh: '全屏交互式流体模拟 -- 移动鼠标或触摸,绘制流动发光的色彩。基于 Pavel Dobryakov 的 WebGL-Fluid-Simulation(MIT);首页 hero 背景也用了它的暖色克制版。',
    },
    tags: ['WebGL', 'Fluid', 'Shaders', 'Interactive'],
    links: [
      { label: { en: 'Launch', zh: '立即体验' }, href: '/fluid', kind: 'internal' },
      { label: { en: 'Original', zh: '原库' }, href: 'https://github.com/PavelDoGreat/WebGL-Fluid-Simulation', kind: 'github' },
    ],
  },
  {
    id: 'three-orb',
    category: 'creative',
    title: { en: 'React Three Fiber 3D', zh: '3D 起手式' },
    year: '2026',
    status: 'live',
    tagline: {
      en: 'Drag to orbit a sculpted, distorting 3D orb.',
      zh: '拖拽环绕一个会形变的雕塑感 3D 物体。',
    },
    description: {
      en: 'A minimal interactive 3D scene built with React Three Fiber and drei - a metallic, gently distorting orb with floating sparks you can orbit by dragging. A clean starting point for declarative 3D on the web.',
      zh: '用 React Three Fiber 与 drei 搭的最小交互 3D 场景 -- 一个金属质感、缓缓形变的物体,配漂浮碎片,可拖拽环绕。声明式 Web 3D 的干净起手式。',
    },
    tags: ['React Three Fiber', 'Three.js', 'drei', 'WebGL'],
    links: [
      { label: { en: 'Launch', zh: '立即体验' }, href: '/r3f', kind: 'internal' },
      { label: { en: 'Template', zh: '模板' }, href: 'https://github.com/pmndrs/react-three-next', kind: 'github' },
    ],
  },
];

/** Bilingual title overrides for episodes we've curated; others fall back to
 * the (Chinese) title parsed from the README. */
const CURATED_TITLES: Record<string, LocalizedText> = Object.fromEntries(
  VIDEOS.map((v) => [v.id, v.title])
);

/** Parse the README's "视频索引" table rows into VideoItems (newest first). */
export function parseVideosFromReadme(markdown: string, limit = 6): VideoItem[] {
  const re =
    /\|\s*(\d{2}-\d{2})\s*\|\s*\[([^\]]+)\]\(episodes\/(\d{4})-\d{2}\/([A-Za-z0-9_-]+)\.md\)\s*\|\s*([\d:]+)\s*\|/g;
  const out: VideoItem[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(markdown)) !== null && out.length < limit) {
    const [, mmdd, title, year, id, duration] = m;
    out.push({
      id,
      date: `${year}-${mmdd}`,
      duration,
      title: CURATED_TITLES[id] ?? { en: title.trim(), zh: title.trim() },
    });
  }
  return out;
}

/** Fetch the latest episodes from the dalei-youtube README. Throws on failure
 * so callers can fall back to the bundled VIDEOS list. */
export async function fetchLatestVideos(limit = 6): Promise<VideoItem[]> {
  const res = await fetch(VIDEOS_README_URL, { cache: 'no-store' });
  if (!res.ok) throw new Error(`README fetch failed: ${res.status}`);
  const parsed = parseVideosFromReadme(await res.text(), limit);
  if (!parsed.length) throw new Error('No videos parsed from README');
  return parsed;
}

export const COPY = {
  nav: {
    home: { en: 'Home', zh: '首页' },
    work: { en: 'Work', zh: '作品' },
    videos: { en: 'Videos', zh: '视频' },
    about: { en: 'About', zh: '关于' },
    now: { en: 'Now', zh: '近况' },
    connect: { en: 'Connect', zh: '联系' },
  },
  hero: {
    eyebrow: { en: 'AI automation · Creative coding · Running', zh: 'AI 自动化 · 创意编程 · 跑步' },
    greeting: { en: "Hey, I'm Da Lei.", zh: '嘿，我是大雷。' },
    titleLine1: { en: 'I build useful AI tools.', zh: '用 AI，把想法做出来。' },
    titleLine2: { en: 'Then share what works.', zh: '把管用的方法公开分享。' },
    intro: {
      en: 'I share hands-on AI workflows on YouTube and keep shipping open-source tools and creative coding experiments.',
      zh: '我在 YouTube 分享 AI 实战，也持续发布开源工具和创意编程实验。',
    },
    ctaWork: { en: 'Browse selected work', zh: '浏览精选作品' },
    ctaVideo: { en: 'Watch latest videos', zh: '观看最新视频' },
    ctaLaunch: { en: 'Launch Kinetic Particles', zh: '体验 Kinetic Particles' },
    availability: { en: 'Open to collaborations', zh: '开放合作' },
  },
  work: {
    label: { en: 'Selected work', zh: '精选作品' },
    heading: { en: 'Projects & experiments', zh: '项目与实验' },
    sub: {
      en: 'Open-source things I build in the open. More on the way.',
      zh: '我在公开构建的开源作品，更多正在路上。',
    },
    tools: { en: 'Tools', zh: '小工具' },
    toolsSub: {
      en: 'Small, free, in-browser tools from my creator workflow.',
      zh: '来自我创作流程的免费、纯浏览器小工具。',
    },
    signature: { en: 'Signature', zh: '招牌' },
    filterAll: { en: 'All', zh: '全部' },
    filterAi: { en: 'AI & Agents', zh: 'AI & 智能体' },
    filterCreative: { en: 'Creative', zh: '创意互动' },
    filterTool: { en: 'Tools', zh: '小工具' },
  },
  videos: {
    label: { en: 'From YouTube', zh: '来自 YouTube' },
    heading: { en: 'Latest videos', zh: '最新视频' },
    sub: {
      en: 'Hands-on AI automation, tools, and AI news - new most weeks on 大雷早上好.',
      zh: '每周更新的 AI 自动化实战、工具与 AI 资讯 --「大雷早上好」。',
    },
    all: { en: 'View all on YouTube', zh: '在 YouTube 查看全部' },
    new: { en: 'New', zh: '最新' },
  },
  membership: {
    label: { en: 'Membership', zh: '频道会员' },
    heading: { en: 'Join the channel membership', zh: '加入频道会员' },
    sub: {
      en: 'Support the work and unlock member-only perks - and help keep it all open source.',
      zh: '支持创作、解锁会员专属福利，也让这一切持续开源。',
    },
    cta: { en: 'Become a member', zh: '成为会员' },
  },
  about: {
    label: { en: 'About', zh: '关于' },
    heading: { en: 'An AI tinkerer who builds - and shares - in the open.', zh: '一个在公开构建、也公开分享的 AI 实践者。' },
    // A confident two-line statement (line B carries the accent).
    statementA: { en: 'I build with AI in the open -', zh: '我在公开处用 AI 构建 --' },
    statementB: { en: 'and share what actually works.', zh: '并且分享真正管用的东西。' },
    body: {
      en: "By day I dig into AI automation and AI-assisted coding - the practical workflows and tools that save real, everyday time - and break them down on YouTube as 大雷 (4K+ subscribers, 400+ videos). By night I make playful, open-source web experiments that blend 3D graphics, real-time interaction, and AI, like Kinetic Particles. I also run, a lot. Everything I build is open source - take it apart, learn from it, make your own.",
      zh: '白天我钻研 AI 自动化与 AI 辅助编程 -- 那些能实打实省时间的工作流与工具 -- 并以「大雷」的身份在 YouTube 拆解它们（4000+ 订阅、400+ 视频）。晚上我做好玩的开源网页实验，融合 3D 图形、实时交互与 AI，比如 Kinetic Particles。我也很爱跑步。我做的一切都是开源的 -- 拆开它、从中学习、做出你自己的版本。',
    },
    sceneModes: [
      {
        id: 'all',
        label: { en: 'Whole scene', zh: '完整场景' },
        heading: { en: 'One studio, three practices.', zh: '一个工作室，三种实践。' },
        text: {
          en: 'I build useful AI tools, explain the methods openly, and use running to keep the work grounded.',
          zh: '我用 AI 做实用工具，公开讲清方法，也用跑步让自己保持清醒和持续行动。',
        },
      },
      {
        id: 'build',
        label: { en: 'Build with AI', zh: '用 AI 构建' },
        heading: { en: 'Turn workflows into tools.', zh: '把工作流做成真正能用的工具。' },
        text: {
          en: 'I test agents and automation against real work, then ship the useful parts as open source.',
          zh: '我把智能体和自动化放进真实工作里验证，再把真正有用的部分开源出来。',
        },
      },
      {
        id: 'share',
        label: { en: 'Share openly', zh: '公开分享' },
        heading: { en: 'Explain what survives testing.', zh: '只分享经得起验证的方法。' },
        text: {
          en: 'On YouTube, I break working methods into practical steps that other people can reuse.',
          zh: '我在 YouTube 把跑通的方法拆成清晰步骤，让更多人可以直接复用。',
        },
      },
      {
        id: 'move',
        label: { en: 'Keep moving', zh: '持续行动' },
        heading: { en: 'Running brings better questions back.', zh: '跑步，让我带着更好的问题回来。' },
        text: {
          en: 'Time away from the screen creates space to think, reset, and return to the work with sharper questions.',
          zh: '离开屏幕去跑一段，能让我重新思考、恢复节奏，再带着更清晰的问题回到创作。',
        },
      },
    ],
    pillars: [
      {
        title: { en: 'AI automation', zh: 'AI 自动化' },
        text: { en: 'Hands-on workflows and automations that save real, everyday time.', zh: '实打实省时间的实战工作流与自动化。' },
      },
      {
        title: { en: 'AI-assisted coding', zh: 'AI 辅助编程' },
        text: { en: 'Building with agents & tools - Antigravity, OpenCode, Claude, Gemini.', zh: '用 AI 智能体与工具构建 -- Antigravity、OpenCode、Claude、Gemini。' },
      },
      {
        title: { en: 'Open source', zh: '开源共享' },
        text: { en: 'Interactive web experiments, built in the open and free to fork.', zh: '互动网页实验，公开构建，可自由 fork 与二次创作。' },
      },
    ],
  },
  now: {
    label: { en: 'Now', zh: '近况' },
    heading: { en: "What I'm up to right now", zh: '我最近在忙什么' },
    updated: { en: 'Updated Jul 2026', zh: '更新于 2026 年 7 月' },
    items: [
      {
        en: 'Turned Microsoft’s Copilot Camp lab into a Khan-Academy-style bilingual course - units, progress tracking, and a quiz after every lesson (/copilotcamp).',
        zh: '把微软 Copilot Camp 实验做成了可汗学院式的双语学习课 -- 单元、进度追踪、每节随堂检测（/copilotcamp）。',
      },
      {
        en: 'Executing the 3D Prompt Workbench one scene at a time - 7 live Three.js pages so far, from Cappadocia balloons to the Brooks Falls salmon run.',
        zh: '3D 提示词工作台逐条执行中 -- 已上线 7 个全屏 Three.js 场景，从卡帕多奇亚热气球到布鲁克斯瀑布鲑鱼洄游。',
      },
      {
        en: 'Shipping hands-on AI-automation videos on YouTube as 大雷, and keeping up the running streak. 🏃',
        zh: '在 YouTube 以「大雷」更新 AI 自动化实战，也在坚持跑步。🏃',
      },
    ],
  },
  connect: {
    label: { en: 'Connect', zh: '联系' },
    heading: { en: "Let's learn and run together.", zh: '一起学习，一起跑步。' },
    sub: {
      en: 'Find me across the web - videos, code, AI tools, and the occasional run. Open to collaborations.',
      zh: '在这些地方找到我 -- 视频、代码、AI 工具，偶尔还有跑步。开放合作。',
    },
  },
  footer: {
    tagline: { en: 'Built with code & particles.', zh: '用代码与粒子构建。' },
    backHome: { en: 'Back to home', zh: '返回首页' },
  },
};
