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
  /** Signature project — gets a highlighted eyebrow and sorts to the top. */
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

// Email is split into parts so the full address never appears as a literal in
// the source/bundle — assembled at runtime, and the mailto: is only built on
// click, so simple scrapers/crawlers can't harvest it.
const EMAIL_PARTS = ['panlei318', 'gmail.com'];
export const getEmail = () => EMAIL_PARTS.join('@');
export const openEmail = () => {
  if (typeof window !== 'undefined') window.location.href = 'mailto:' + getEmail();
};

/** Shared image assets, served from the dalei-youtube repo via jsDelivr CDN. */
export const ASSETS = {
  avatar: 'https://cdn.jsdelivr.net/gh/paul010/dalei-youtube@master/avatar.jpg',
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
 * runtime (via jsDelivr's CORS-enabled CDN) and parse the latest episodes, so
 * the homepage stays current without code changes. Falls back to VIDEOS below.
 */
export const VIDEOS_README_URL = 'https://cdn.jsdelivr.net/gh/paul010/dalei-youtube@master/README.md';

/** Latest episodes — sourced from github.com/paul010/dalei-youtube. */
export const VIDEOS: VideoItem[] = [
  {
    id: 'Zv4hXUhzwbU',
    date: '2026-06-11',
    duration: '7:49',
    title: {
      en: 'Fable 5 is INSANE! Create a game in one sentence',
      zh: 'Fable 5 强到离谱！一句话生成游戏，最强 AI 王座易主？',
    },
  },
  {
    id: 'XjYrACWk-98',
    date: '2026-06-10',
    duration: '17:47',
    title: {
      en: 'Billion-dollar valuation, yet calling for an AI pause?',
      zh: '估值千亿却叫停 AI？Anthropic 内部揭秘：RSI 的真相！',
    },
  },
  {
    id: 'DYoum8FiOzI',
    date: '2026-06-07',
    duration: '9:35',
    title: {
      en: "AI world quake! Anthropic's new ace halted by an insider leak",
      zh: 'AI 圈大地震！Anthropic 新王牌因内鬼泄密，紧急叫停',
    },
  },
  {
    id: 'i0fgwuxG4p0',
    date: '2026-06-06',
    duration: '9:57',
    title: {
      en: 'AI gods at war! GPT-5.6 next week? Microsoft & Alibaba go all in',
      zh: 'AI 圈神仙打架！GPT 5.6 下周发布？微软阿里连放大招',
    },
  },
  {
    id: 'q4X4cD-Phyk',
    date: '2026-06-03',
    duration: '7:26',
    title: {
      en: "Microsoft's AI bombshell! New Windows features nobody told you about",
      zh: '微软 AI 王炸！没人告诉你的 Windows 新功能，开发者狂喜！',
    },
  },
  {
    id: 'kxQpKt17qnM',
    date: '2026-06-03',
    duration: '11:27',
    title: {
      en: 'MiniMax M3 shocks! Performance surpasses GPT-5.5',
      zh: 'MiniMax M3 震撼发布！性能反超 GPT-5.5，最强开源 AI 来了？',
    },
  },
];

/**
 * Adding a future project = append one object here.
 * `status`: live | wip | soon · `featured` makes it the large hero card.
 */
export const PROJECTS: Project[] = [
  {
    id: 'kinetic-particles',
    title: { en: 'Kinetic Particles', zh: 'Kinetic Particles' },
    year: '2025',
    status: 'live',
    featured: true,
    cover: '/image-1764988597247.png',
    tagline: {
      en: 'A 3D particle universe you control with your hands — no API key, runs in the browser.',
      zh: '用双手控制的 3D 粒子宇宙 —— 无需 API Key，浏览器即开即用。',
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
    title: { en: 'AI Coding Arsenal', zh: 'AI Coding Arsenal' },
    year: '2026',
    status: 'wip',
    featured: true,
    cover: '/arsenal-cover.png',
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
    id: 'ai-benchmark',
    title: { en: 'Da Lei AI Benchmark', zh: '大雷 AI 评测台' },
    year: '2026',
    status: 'live',
    featured: true,
    signature: true,
    cover: '/bench-cover.png',
    tagline: {
      en: 'A fixed personal benchmark — the same prompts, every model, side by side.',
      zh: '固定题目 + 统一规范,把各家模型的真实输出横向摆在一起对照。',
    },
    description: {
      en: 'My own scarce, repeatable AI evaluation: a fixed set of prompts (SVG pelican-on-a-bike, gradient butterfly, landing pages…) with each model’s real output — SVG/HTML/screenshots — rendered side by side. Open it on camera and the comparison is right there.',
      zh: '我自己的稀缺、可复用的 AI 横评:一套固定 Prompt(鹈鹕骑车 SVG、渐变蝴蝶、落地页…),把 Claude / Gemini / ChatGPT 等各家的真实输出(SVG/HTML/截图)并排渲染。录视频时打开页面,对照一目了然 —— 个人唯一的对照价值。',
    },
    tags: ['Benchmark', 'LLM Eval', 'SVG', 'React'],
    links: [
      { label: { en: 'Launch', zh: '立即体验' }, href: '/bench', kind: 'internal' },
      { label: { en: 'Watch demo', zh: '观看演示' }, href: SOCIALS.youtube, kind: 'youtube' },
    ],
  },
  {
    id: 'fugu-research',
    title: { en: 'Fugu / TRINITY — Reproduced', zh: 'Fugu / TRINITY 复现验证' },
    year: '2026',
    status: 'live',
    featured: true,
    cover: '/fugu-cover.svg',
    tagline: {
      en: 'Can a tiny linear router orchestrate a pool of LLMs to beat the best single model? I reproduced the claim on CPU.',
      zh: '一个极小的线性路由器，真能编排一池大模型、打败最强单模型吗？我在 CPU 上把这个论文结论复现了一遍。',
    },
    description: {
      en: 'A hands-on validation of Sakana AI’s Fugu (the TRINITY coordinator, arXiv:2512.04695), using the open-source openfugu reimplementation. Two independent checks run on CPU with only numpy: (1) I drive the real Coordinator loop with a scripted router — 6/6 control-flow behaviours match the paper; (2) I reproduce the central claim with a from-scratch sep-CMA-ES, training a linear router over a synthetic specialist pool. Across 8 seeds it lifts +79% over the best single worker and recovers 99.9% of the oracle, converging in ~2 generations. Full report + runnable script on the page.',
      zh: '对 Sakana AI 的 Fugu(TRINITY 协调器,arXiv:2512.04695)做的动手验证,参考开源复现 openfugu。两项独立检验都在 CPU、仅用 numpy 完成:(1) 用脚本化路由器驱动真实的 Coordinator 循环 —— 6/6 条控制流行为与论文一致;(2) 自己实现 sep-CMA-ES,在合成的专家模型池上训练线性路由器复现核心结论。8 个随机种子下,平均比最强单模型高 +79%,达到 oracle 上限的 99.9%,约 2 代收敛。完整报告 + 可运行脚本都在页面里。',
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
      en: 'A single-prompt personal infographic: Microsoft Copilot turns a headshot and my LinkedIn / Work IQ profile into a photoreal cartoon whiteboard — what I do, who I work with, my role, my values, my tools, and a day in my life. A fun, repeatable way to render your professional identity. Prompt below, result on the left.',
      zh: '一段提示词生成的个人信息图:用 Microsoft Copilot,把一张头像加上我的 LinkedIn / Work IQ 资料,变成一整张照片级卡通白板 —— 我做什么、和谁协作、我的角色、价值观、工具栈,还有「一天的生活」。一种好玩又可复用的「职业身份可视化」方式。提示词见下,结果在左侧。',
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
    title: { en: 'Free AI Solutions Library', zh: '大雷免费 AI 方案库' },
    year: '2026',
    status: 'live',
    featured: true,
    cover: '/ai-library-cover.svg',
    tagline: {
      en: 'A curated, structured Notion library of the latest open-source, landing-ready AI solutions.',
      zh: '一个结构化、持续更新的 Notion 库 —— 收录最新可落地的开源 AI 方案。',
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
    id: 'copilot-matrix',
    title: { en: 'Microsoft Copilot / Agent Matrix', zh: 'Microsoft Copilot / Agent 产品矩阵' },
    year: '2026',
    status: 'live',
    featured: true,
    cover: '/copilot-cover.svg',
    tagline: {
      en: 'The whole Copilot & Agent stack in three tiers — Use → No-code → Develop. My field note, as of June 2026.',
      zh: '用三层架构看懂 Copilot 与 Agent 全家桶 —— 使用 → 无代码 → 开发。我的阶段性总结，截至 2026 年 6 月。',
    },
    description: {
      en: 'A native, bilingual rebuild of my Microsoft Copilot / Agent product matrix: each product’s license, credit cost (with a usage meter), what it does, and who it’s for — across the Use (Copilot/Cowork), No-code (Agent Builder/Copilot Studio) and Develop (Foundry/dev stack) tiers, plus the employee→developer path. Rebuilt as real web content (not a screenshot), so it’s searchable and stays current.',
      zh: '把我那张「Microsoft Copilot / Agent 产品矩阵」做成了原生、双语的网页内容:每个产品的许可证、Credit 消耗(带消耗等级条)、能做什么、给谁用 —— 覆盖使用(Copilot/Cowork)、无代码(Agent Builder/Copilot Studio)、开发(Foundry/开发栈)三层,外加员工→开发者的选型路径。用真正的网页重建(不是截图),可检索、好更新。',
    },
    tags: ['Microsoft Copilot', 'AI Agent', 'Field Note', 'React'],
    links: [
      { label: { en: 'Read the matrix', zh: '查看产品矩阵' }, href: '/copilot', kind: 'internal' },
      { label: { en: 'Watch on YouTube', zh: 'YouTube 频道' }, href: SOCIALS.youtube, kind: 'youtube' },
    ],
  },
  {
    id: 'markdown-studio',
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
    title: { en: 'Image Studio', zh: '图片工具箱' },
    year: '2026',
    status: 'live',
    tagline: {
      en: 'Compress, resize & convert images — 100% in your browser, no upload.',
      zh: '压缩、缩放、转格式 —— 全程浏览器本地处理,图片不上传。',
    },
    description: {
      en: 'A zero-dependency, Canvas-based image tool: drop an image, resize to a max width, convert between JPG / WebP / PNG and tune quality, with a YouTube-thumbnail preset and live size-savings readout. Everything runs locally — nothing leaves your device.',
      zh: '零依赖、基于 Canvas 的图片工具:拖入图片,按最大宽度缩放,在 JPG / WebP / PNG 间转换并调质量,内置 YouTube 封面预设与实时体积压缩比。全部本地运行,图片不离开你的设备。',
    },
    tags: ['React', 'Canvas', 'Image', 'Privacy'],
    links: [
      { label: { en: 'Launch', zh: '立即体验' }, href: '/img', kind: 'internal' },
    ],
  },
  {
    id: 'screenshot-to-code',
    title: { en: 'Screenshot → Code', zh: '截图转代码' },
    year: '2026',
    status: 'wip',
    tagline: {
      en: 'Drop a UI screenshot, get a self-contained HTML page (bring your own Gemini key).',
      zh: '上传界面截图,生成自包含 HTML 页面(自带 Gemini Key,实验性)。',
    },
    description: {
      en: 'Upload a screenshot and Gemini reproduces it as a single Tailwind HTML file, with live preview and copy/download. Experimental & bring-your-own-key: your Gemini API key stays in your browser and calls Google directly — nothing is proxied or stored server-side.',
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
    title: { en: 'Fluid Playground', zh: '流体 Fluid' },
    year: '2026',
    status: 'live',
    tagline: {
      en: 'A full-screen WebGL fluid you paint with your cursor.',
      zh: '用鼠标/手指绘制的全屏 WebGL 流体。',
    },
    description: {
      en: 'An interactive, full-screen fluid simulation — move your cursor (or touch) to paint glowing, swirling color. Built on Pavel Dobryakov’s WebGL-Fluid-Simulation (MIT); the homepage hero also carries a warm, toned-down version of it.',
      zh: '全屏交互式流体模拟 —— 移动鼠标或触摸,绘制流动发光的色彩。基于 Pavel Dobryakov 的 WebGL-Fluid-Simulation(MIT);首页 hero 背景也用了它的暖色克制版。',
    },
    tags: ['WebGL', 'Fluid', 'Shaders', 'Interactive'],
    links: [
      { label: { en: 'Launch', zh: '立即体验' }, href: '/fluid', kind: 'internal' },
      { label: { en: 'Original', zh: '原库' }, href: 'https://github.com/PavelDoGreat/WebGL-Fluid-Simulation', kind: 'github' },
    ],
  },
  {
    id: 'three-orb',
    title: { en: 'React Three Fiber 3D', zh: '3D 起手式' },
    year: '2026',
    status: 'live',
    tagline: {
      en: 'Drag to orbit a sculpted, distorting 3D orb.',
      zh: '拖拽环绕一个会形变的雕塑感 3D 物体。',
    },
    description: {
      en: 'A minimal interactive 3D scene built with React Three Fiber and drei — a metallic, gently distorting orb with floating sparks you can orbit by dragging. A clean starting point for declarative 3D on the web.',
      zh: '用 React Three Fiber 与 drei 搭的最小交互 3D 场景 —— 一个金属质感、缓缓形变的物体,配漂浮碎片,可拖拽环绕。声明式 Web 3D 的干净起手式。',
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
    greeting: { en: "Hey, I'm Da Lei", zh: '嘿，我是大雷' },
    titleLine1: { en: 'I build with AI, automation', zh: '我用 AI、自动化' },
    titleLine2: { en: '& a little creative code.', zh: '和一点点创意代码构建。' },
    intro: {
      en: "I'm an AI-automation practitioner and creative coder. On YouTube I share hands-on AI automation and AI coding workflows — tools like Antigravity, OpenCode, Claude and Gemini — and I build open-source experiments like Kinetic Particles along the way. Also a runner. Let's learn and run together. 🏃",
      zh: '我是大雷，AI 自动化实践者，也是创意开发者。我在 YouTube 分享 AI 自动化与 AI 编程实战 —— Antigravity、OpenCode、Claude、Gemini 这些工具 —— 也顺手做像下面 Kinetic Particles 这样的开源实验。还是个跑步爱好者。一起学习，一起跑步。🏃',
    },
    ctaWork: { en: 'See the work', zh: '查看作品' },
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
  },
  videos: {
    label: { en: 'From YouTube', zh: '来自 YouTube' },
    heading: { en: 'Latest videos', zh: '最新视频' },
    sub: {
      en: 'Hands-on AI automation, tools, and AI news — new most weeks on 大雷早上好.',
      zh: '每周更新的 AI 自动化实战、工具与 AI 资讯 ——「大雷早上好」。',
    },
    all: { en: 'View all on YouTube', zh: '在 YouTube 查看全部' },
    new: { en: 'New', zh: '最新' },
  },
  membership: {
    label: { en: 'Membership', zh: '频道会员' },
    heading: { en: 'Join the channel membership', zh: '加入频道会员' },
    sub: {
      en: 'Support the work and unlock member-only perks — and help keep it all open source.',
      zh: '支持创作、解锁会员专属福利，也让这一切持续开源。',
    },
    cta: { en: 'Become a member', zh: '成为会员' },
  },
  about: {
    label: { en: 'About', zh: '关于' },
    heading: { en: 'An AI tinkerer who builds — and shares — in the open.', zh: '一个在公开构建、也公开分享的 AI 实践者。' },
    body: {
      en: "By day I dig into AI automation and AI-assisted coding — the practical workflows and tools that save real, everyday time — and break them down on YouTube as 大雷 (4K+ subscribers, 400+ videos). By night I make playful, open-source web experiments that blend 3D graphics, real-time interaction, and AI, like Kinetic Particles. I also run, a lot. Everything I build is open source — take it apart, learn from it, make your own.",
      zh: '白天我钻研 AI 自动化与 AI 辅助编程 —— 那些能实打实省时间的工作流与工具 —— 并以「大雷」的身份在 YouTube 拆解它们（4000+ 订阅、400+ 视频）。晚上我做好玩的开源网页实验，融合 3D 图形、实时交互与 AI，比如 Kinetic Particles。我也很爱跑步。我做的一切都是开源的 —— 拆开它、从中学习、做出你自己的版本。',
    },
    pillars: [
      {
        title: { en: 'AI automation', zh: 'AI 自动化' },
        text: { en: 'Hands-on workflows and automations that save real, everyday time.', zh: '实打实省时间的实战工作流与自动化。' },
      },
      {
        title: { en: 'AI-assisted coding', zh: 'AI 辅助编程' },
        text: { en: 'Building with agents & tools — Antigravity, OpenCode, Claude, Gemini.', zh: '用 AI 智能体与工具构建 —— Antigravity、OpenCode、Claude、Gemini。' },
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
    updated: { en: 'Updated Jun 2026', zh: '更新于 2026 年 6 月' },
    items: [
      {
        en: 'Reproducing one AI-coding project a day and shipping it live here — Markdown Studio, Screenshot→Code and a 3D starter are already up.',
        zh: '每天复现一个 AI Coding 项目并上线到这个站 —— Markdown 工具箱、截图转代码、3D 起手式已上线。',
      },
      {
        en: 'Growing AI Coding Arsenal — an idea radar + skill armory that turns "saw a cool repo" into "shipped a demo".',
        zh: '持续打磨 AI Coding Arsenal —— 把「看到一个好项目」变成「跑出一个 Demo」的灵感库 + 装备库。',
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
      en: 'Find me across the web — videos, code, AI tools, and the occasional run. Open to collaborations.',
      zh: '在这些地方找到我 —— 视频、代码、AI 工具，偶尔还有跑步。开放合作。',
    },
  },
  footer: {
    tagline: { en: 'Built with code & particles.', zh: '用代码与粒子构建。' },
    backHome: { en: 'Back to home', zh: '返回首页' },
  },
};
