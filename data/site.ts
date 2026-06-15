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
  title: string;
  year: string;
  status: 'live' | 'wip' | 'soon';
  tagline: LocalizedText;
  description: LocalizedText;
  tags: string[];
  links: ProjectLink[];
  featured?: boolean;
  cover?: string;
}

export const SOCIALS = {
  github: 'https://github.com/paul010',
  youtube: 'https://www.youtube.com/@dalei2025',
  twitter: 'https://x.com/paul010318',
  email: 'mailto:panlei318@gmail.com',
  membership: 'https://www.youtube.com/channel/UCk9tu0mFtXj_rOEfIncxuJQ/join',
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
    title: 'Kinetic Particles',
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
    title: 'AI Coding Arsenal',
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
    id: 'markdown-studio',
    title: 'Markdown 工具箱',
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
  },
  videos: {
    label: { en: 'From YouTube', zh: '来自 YouTube' },
    heading: { en: 'Latest videos', zh: '最新视频' },
    sub: {
      en: 'Hands-on AI automation, tools, and AI news — new most weeks on 大雷早上好.',
      zh: '每周更新的 AI 自动化实战、工具与 AI 资讯 ——「大雷早上好」。',
    },
    all: { en: 'View all on YouTube', zh: '在 YouTube 查看全部' },
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
