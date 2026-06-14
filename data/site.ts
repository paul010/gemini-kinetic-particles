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
};

export const PROJECTS: Project[] = [
  {
    id: 'kinetic-particles',
    title: 'Kinetic Particles',
    year: '2025',
    status: 'live',
    featured: true,
    cover: '/image-1764988597247.png',
    tagline: {
      en: 'Hand-gesture-controlled 3D particle universe — no API key, runs in the browser.',
      zh: '用手势控制的沉浸式 3D 粒子宇宙 —— 无需 API Key，浏览器即开即用。',
    },
    description: {
      en: 'Open your palm and 12,000+ particles explode outward; close your fist and the universe contracts. Built with React Three Fiber and MediaPipe hand tracking running fully on-device, with a sci-fi HUD interface and a dozen morphing shapes.',
      zh: '张开手掌，12000+ 粒子向外爆发；握紧拳头，整个宇宙随之收缩。基于 React Three Fiber 与本地运行的 MediaPipe 手势识别打造，配以科幻 HUD 界面与十余种可变形粒子造型。',
    },
    tags: ['React Three Fiber', 'Three.js', 'MediaPipe', 'TypeScript', 'WebGL'],
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
      en: 'More interactive, AI-flavored web experiments are on the way. Follow along on YouTube and X to see them as they ship.',
      zh: '更多融入 AI 的互动网页实验正在路上。关注 YouTube 与 X，第一时间见证它们的诞生。',
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
    eyebrow: { en: 'Creative developer · Open source', zh: '创意开发者 · 开源' },
    titleLine1: { en: 'I build interactive worlds', zh: '我用代码、粒子' },
    titleLine2: { en: 'out of code, particles & a little AI.', zh: '和一点点 AI，构建可以互动的世界。' },
    intro: {
      en: "I'm Da Lei (大雷). I make playful, open-source web experiences that blend 3D graphics, real-time interaction, and AI — then share how they're built on YouTube.",
      zh: '我是大雷。我打造好玩的开源网页体验，融合 3D 图形、实时交互与 AI，并在 YouTube 上分享它们的制作过程。',
    },
    ctaWork: { en: 'See the work', zh: '查看作品' },
    ctaLaunch: { en: 'Launch Kinetic Particles', zh: '体验 Kinetic Particles' },
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
    heading: { en: 'A developer who likes to make the web feel alive.', zh: '一个喜欢让网页“活”起来的开发者。' },
    body: {
      en: "I'm drawn to the intersection of graphics, interaction, and AI — interfaces you can touch, wave at, and play with rather than just click. Everything I make is open source, so you can take it apart, learn from it, and build your own. I document the journey on YouTube as 大雷.",
      zh: '我着迷于图形、交互与 AI 的交叉地带 —— 那些可以触摸、可以挥手、可以玩起来的界面，而不只是点击。我做的一切都是开源的，你可以拆开它、从中学习、做出自己的版本。我以「大雷」的身份在 YouTube 上记录这段旅程。',
    },
    pillars: [
      {
        title: { en: 'Interactive 3D', zh: '互动 3D' },
        text: { en: 'WebGL, Three.js & shaders that respond to you in real time.', zh: '实时响应的 WebGL、Three.js 与着色器。' },
      },
      {
        title: { en: 'Human input', zh: '人体交互' },
        text: { en: 'Hands, gestures, voice — on-device, private, no API key.', zh: '手势、语音 —— 本地运行，隐私优先，无需 API Key。' },
      },
      {
        title: { en: 'Open source', zh: '开源共享' },
        text: { en: 'Built in the open and free to fork, study and remix.', zh: '公开构建，可自由 fork、学习与二次创作。' },
      },
    ],
  },
  connect: {
    label: { en: 'Connect', zh: '联系' },
    heading: { en: "Let's build something.", zh: '一起做点东西吧。' },
    sub: {
      en: 'Find me across the web — code, videos, and the occasional thought.',
      zh: '在这些地方找到我 —— 代码、视频，以及偶尔的碎碎念。',
    },
  },
  footer: {
    tagline: { en: 'Built with code & particles.', zh: '用代码与粒子构建。' },
    backHome: { en: 'Back to home', zh: '返回首页' },
  },
};
