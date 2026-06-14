export type Lang = 'en' | 'zh';

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
};

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
    id: 'next-experiment',
    title: 'Something new',
    year: '2026',
    status: 'soon',
    tagline: {
      en: 'The next open-source experiment is taking shape.',
      zh: '下一个开源实验正在成形。',
    },
    description: {
      en: 'More interactive, AI-flavored web toys are on the way. Follow along on YouTube and X to catch them as they ship.',
      zh: '更多融入 AI 的互动网页小玩意正在路上。关注 YouTube 与 X，第一时间见证它们诞生。',
    },
    tags: ['Creative coding', 'WebGL', 'AI'],
    links: [
      { label: { en: 'Follow on YouTube', zh: '关注 YouTube' }, href: SOCIALS.youtube, kind: 'youtube' },
    ],
  },
];

export const COPY = {
  nav: {
    home: { en: 'Home', zh: '首页' },
    work: { en: 'Work', zh: '作品' },
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
