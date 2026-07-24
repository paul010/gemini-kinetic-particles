import React, { useEffect, useMemo, useState } from 'react';

/* ---------------------------------------------------------------------------
 * /text2image — "文生图提示词工坊" workshop column.
 *
 * Teaches text-to-image prompting for a business audience: the anatomy of a
 * good prompt, an interactive builder (assembles a copyable prompt live on
 * stage), ready-to-use teaching-scenario templates, how to lock style for
 * platform-level / batch content, and a click-to-copy modifier cheat-sheet.
 *
 * All copy, templates and swatches are original, built for the workshop.
 * ------------------------------------------------------------------------- */

type Lang = 'en' | 'zh' | 'zhHant';
interface T { en: string; zh: string }

const STORAGE_KEY = 'dalei-lang-v2';
const detectInitialLang = (): Lang => {
  if (typeof window === 'undefined') return 'en';
  const saved = window.localStorage.getItem(STORAGE_KEY);
  return saved === 'zh' || saved === 'zhHant' ? saved : 'en';
};

let _s2t: ((s: string) => string) | null = null;
const useS2T = (active: boolean) => {
  const [conv, setConv] = useState<((s: string) => string) | null>(() => _s2t);
  useEffect(() => {
    if (!active || _s2t) { if (_s2t && !conv) setConv(() => _s2t); return; }
    let alive = true;
    import('opencc-js').then((m) => { _s2t = (m as any).Converter({ from: 'cn', to: 'tw' }); if (alive) setConv(() => _s2t); }).catch(() => {});
    return () => { alive = false; };
  }, [active, conv]);
  return conv;
};

/* ===================== prompt anatomy (7 building blocks) ================= */

interface Block { key: string; color: string; label: T; hint: T; sampleZh: string; sampleEn: string }
const BLOCKS: Block[] = [
  { key: 'subject', color: '#2f6fb0', label: { en: 'Subject', zh: '主体' }, hint: { en: 'who / what — the one thing the image is about', zh: '画面是「谁 / 什么」，越具体越好' }, sampleZh: '一位年轻女咖啡师，围裙，专注地拉花', sampleEn: 'a young female barista in an apron, focused, pouring latte art' },
  { key: 'scene', color: '#5c8a3a', label: { en: 'Scene', zh: '场景 / 环境' }, hint: { en: 'where it happens, background, props', zh: '发生在哪里、背景、道具' }, sampleZh: '在温暖的精品咖啡馆吧台后，木质装潢，虚化的顾客', sampleEn: 'behind the counter of a warm specialty café, wooden interior, blurred customers' },
  { key: 'style', color: '#c2703c', label: { en: 'Style', zh: '风格' }, hint: { en: 'medium & aesthetic: photo, 3D, illustration…', zh: '媒介与美学：摄影 / 3D / 插画…' }, sampleZh: '写实摄影风格，柔和胶片质感', sampleEn: 'realistic photography, soft film grain' },
  { key: 'camera', color: '#7a5cab', label: { en: 'Composition / Camera', zh: '构图 / 镜头' }, hint: { en: 'shot size, angle, lens', zh: '景别、角度、镜头' }, sampleZh: '中景，35mm 镜头，浅景深，三分构图', sampleEn: 'medium shot, 35mm lens, shallow depth of field, rule of thirds' },
  { key: 'light', color: '#b8860b', label: { en: 'Light', zh: '光线' }, hint: { en: 'source, direction, mood of light', zh: '光源、方向、光的氛围' }, sampleZh: '清晨侧窗自然光，暖色调，柔和阴影', sampleEn: 'morning side window light, warm tones, soft shadows' },
  { key: 'quality', color: '#2b8a8a', label: { en: 'Quality', zh: '质感 / 画质' }, hint: { en: 'render quality & detail keywords', zh: '画质与细节关键词' }, sampleZh: '高细节，8K，锐利对焦', sampleEn: 'high detail, 8K, sharp focus' },
  { key: 'params', color: '#8a682c', label: { en: 'Params', zh: '参数' }, hint: { en: 'aspect ratio, seed, negative — platform specific', zh: '画幅、种子、负向 —— 平台相关' }, sampleZh: '--ar 3:2 --style raw', sampleEn: '--ar 3:2 --style raw' },
];

/* ===================== interactive builder options ======================= */

interface Opt { zh: string; en: string }
interface Dim { key: string; label: T; color: string; opts: Opt[] }
const DIMS: Dim[] = [
  { key: 'scene', label: { en: 'Scene', zh: '场景' }, color: '#5c8a3a', opts: [
    { zh: '精品咖啡馆吧台后', en: 'behind a specialty café counter' },
    { zh: '现代办公室落地窗前', en: 'by the floor-to-ceiling window of a modern office' },
    { zh: '黄昏的城市街道', en: 'on a city street at dusk' },
    { zh: '极简纯色摄影棚', en: 'in a minimal solid-color studio' },
    { zh: '雾气缭绕的山间', en: 'in misty mountains' },
  ] },
  { key: 'style', label: { en: 'Style', zh: '风格' }, color: '#c2703c', opts: [
    { zh: '写实摄影，柔和胶片质感', en: 'realistic photography, soft film grain' },
    { zh: '电影感，2.39:1 冷暖对比布光', en: 'cinematic, 2.39:1 warm-cool contrast lighting' },
    { zh: '3D 渲染，柔和材质，Octane', en: '3D render, soft materials, Octane' },
    { zh: '扁平矢量插画，粗描边', en: 'flat vector illustration, bold outlines' },
    { zh: '水彩手绘，晕染留白', en: 'hand-painted watercolor, bleeding washes' },
    { zh: '国潮工笔，金线勾勒', en: 'Chinese gongbi style, gold line accents' },
  ] },
  { key: 'light', label: { en: 'Light', zh: '光线' }, color: '#b8860b', opts: [
    { zh: '清晨柔和自然光', en: 'soft morning natural light' },
    { zh: '黄金时刻逆光', en: 'golden-hour backlight' },
    { zh: '霓虹赛博光', en: 'neon cyberpunk glow' },
    { zh: '影棚三点布光', en: 'studio three-point lighting' },
    { zh: '低调暗光剪影', en: 'low-key silhouette' },
  ] },
  { key: 'camera', label: { en: 'Camera', zh: '镜头' }, color: '#7a5cab', opts: [
    { zh: '特写，85mm，浅景深', en: 'close-up, 85mm, shallow depth of field' },
    { zh: '中景，35mm，三分构图', en: 'medium shot, 35mm, rule of thirds' },
    { zh: '广角，24mm，环境交代', en: 'wide angle, 24mm, establishing shot' },
    { zh: '俯拍平铺，正上方视角', en: 'top-down flat-lay, overhead view' },
    { zh: '微距，极致细节', en: 'macro, extreme detail' },
  ] },
  { key: 'aspect', label: { en: 'Aspect', zh: '画幅' }, color: '#2b8a8a', opts: [
    { zh: '1:1 方图', en: '1:1 square' },
    { zh: '16:9 横图', en: '16:9 landscape' },
    { zh: '9:16 竖图', en: '9:16 vertical' },
    { zh: '3:2 相机比例', en: '3:2 photo' },
  ] },
];
const ASPECT_FLAG = ['1:1', '16:9', '9:16', '3:2'];
const QUALITY = { zh: '高细节，锐利对焦，8K', en: 'high detail, sharp focus, 8K' };

/* ===================== teaching scenario templates ======================= */

interface Scene { id: string; icon: string; grad: [string, string]; title: T; use: T; templateZh: string; templateEn: string; tip: T }
const SCENES: Scene[] = [
  {
    id: 'ecom', icon: '🛍️', grad: ['#c2703c', '#e8a93c'],
    title: { en: 'E-commerce hero shot', zh: '电商主图 / 产品图' },
    use: { en: 'Clean product image for a listing or landing page.', zh: '给商品详情页 / 落地页用的干净产品图。' },
    templateZh: '一张{产品名称}的电商主图，居中放置在{背景，如纯色台面 / 大理石}上，{风格，如写实摄影}，柔和影棚布光，轻微反光，浅阴影，高细节，锐利对焦，负向：文字、水印、杂乱背景 --ar 1:1',
    templateEn: 'an e-commerce hero shot of {product}, centered on {surface, e.g. solid-color tabletop / marble}, {style, e.g. realistic photography}, soft studio lighting, subtle reflection, light shadow, high detail, sharp focus, negative: text, watermark, clutter --ar 1:1',
    tip: { en: 'Fix the surface + lighting words across a whole catalog so every product matches.', zh: '把「台面 + 布光」词整套产品固定下来，全目录风格才统一。' },
  },
  {
    id: 'headshot', icon: '👤', grad: ['#2f6fb0', '#5ad1ff'],
    title: { en: 'Professional headshot', zh: '职业头像 / 形象照' },
    use: { en: 'LinkedIn / team-page portrait, consistent across a team.', zh: '领英 / 团队页头像，全队风格一致。' },
    templateZh: '一位{角色，如 30 岁亚洲男性产品经理}的职业形象照，{着装，如深色西装}，自信微笑，纯灰背景，影棚柔光，85mm 镜头浅景深，中景偏上半身，高细节 --ar 3:2',
    templateEn: 'a professional headshot of {person, e.g. 30-year-old Asian male product manager}, {outfit, e.g. dark suit}, confident smile, plain grey background, soft studio light, 85mm shallow depth of field, upper-body medium shot, high detail --ar 3:2',
    tip: { en: 'Lock background + lens + light; only change the person description per teammate.', zh: '锁定背景 + 镜头 + 光线，每个同事只改「人物描述」这一处。' },
  },
  {
    id: 'slide', icon: '🖥️', grad: ['#5c8a3a', '#a3c76d'],
    title: { en: 'Slide cover / section art', zh: 'PPT 封面 / 章节页配图' },
    use: { en: 'A cover image or section divider that matches your deck.', zh: '和你 PPT 整体风格统一的封面 / 章节配图。' },
    templateZh: '一张{主题，如“AI 赋能”}的 PPT 封面插画，{风格，如扁平矢量插画}，左侧大量留白给标题，右侧主视觉，品牌色{颜色}为主，简洁现代，无文字 --ar 16:9',
    templateEn: 'a slide cover illustration for {topic, e.g. "AI empowerment"}, {style, e.g. flat vector illustration}, generous white space on the left for the title, main visual on the right, brand color {color} dominant, clean and modern, no text --ar 16:9',
    tip: { en: 'Ask for "no text" and empty space where your title goes — add real text in PPT.', zh: '要求「无文字」并留出标题空位 —— 文字回 PPT 里排，更清晰可控。' },
  },
  {
    id: 'poster', icon: '📣', grad: ['#7a5cab', '#c18cff'],
    title: { en: 'Event poster / key visual', zh: '活动海报 / 主视觉 KV' },
    use: { en: 'A campaign key visual for a launch, workshop, or event.', zh: '发布会 / workshop / 活动的主视觉。' },
    templateZh: '一张{活动主题}的活动主视觉海报，{风格，如国潮插画}，中心构图，视觉焦点突出，{色调，如暖橙金}色调，留出上方标题区与下方信息区，高质感，无文字 --ar 9:16',
    templateEn: 'an event key-visual poster for {theme}, {style, e.g. Chinese-trend illustration}, centered composition, strong focal point, {palette, e.g. warm orange-gold} tones, leave a title zone on top and an info zone at the bottom, premium quality, no text --ar 9:16',
    tip: { en: 'Reserve title/info zones in the prompt so the layout survives when you add copy.', zh: '在提示词里预留标题区 / 信息区，后期加文案时版式不会被挤乱。' },
  },
  {
    id: 'icon', icon: '🎨', grad: ['#2b8a8a', '#6fd0c8'],
    title: { en: 'Icon set / spot illustration', zh: '图标组 / 信息图插画' },
    use: { en: 'A consistent set of icons or spot art for docs and decks.', zh: '文档 / PPT 里成套一致的图标或点缀插画。' },
    templateZh: '一组{数量，如 4 个}扁平线性图标，主题{主题，如“数据、流程、协作、安全”}，统一{线宽 2px}线宽，单一强调色{颜色}，白底，居中，成套风格一致，无文字 --ar 1:1',
    templateEn: 'a set of {count, e.g. 4} flat line icons, theme {theme, e.g. "data, workflow, collaboration, security"}, uniform {2px} line weight, single accent color {color}, white background, centered, consistent as a set, no text --ar 1:1',
    tip: { en: 'Generate icons in ONE prompt (as a set) so line weight & style truly match.', zh: '一次提示词里生成「一组」，线宽和风格才会真的一致，别一个个单独出。' },
  },
  {
    id: 'concept', icon: '🌆', grad: ['#3a4a6b', '#8aa0c8'],
    title: { en: 'Concept scene / editorial', zh: '概念场景 / 编辑配图' },
    use: { en: 'An atmospheric scene for an article, cover, or mood board.', zh: '文章 / 封面 / 情绪板用的氛围场景图。' },
    templateZh: '一个{场景描述，如“未来城市清晨”}的概念场景，{风格，如电影感写实}，广角环境交代，{光线，如黄金时刻逆光}，体积光，大气透视，电影级调色，高细节 --ar 16:9',
    templateEn: 'a concept scene of {description, e.g. "a future city at dawn"}, {style, e.g. cinematic realism}, wide-angle establishing shot, {light, e.g. golden-hour backlight}, volumetric light, atmospheric perspective, cinematic color grade, high detail --ar 16:9',
    tip: { en: 'Atmosphere words (volumetric light, haze, depth) do more than more nouns.', zh: '氛围词（体积光、雾气、纵深）比堆名词更能拉高质感。' },
  },
];

/* ===================== platform-level consistency ======================== */

const STYLE_LOCK_ZH = `【风格锁 · 系统前缀】以下风格用于本批全部图片，保持一致：
- 媒介风格：扁平矢量插画，粗描边，圆角几何
- 配色：主色 #C2703C，辅色 #2F6FB0，背景 米白 #F6F3EC
- 光线：柔和均匀，无强阴影
- 构图：居中，四周留白
- 统一负向：写实照片、3D、渐变噪点、文字、水印

【每张只改这一行】画面主体：{在这里写这张图的具体内容}`;
const STYLE_LOCK_EN = `[STYLE LOCK · system prefix] Apply this style to every image in this batch, keep it consistent:
- Medium: flat vector illustration, bold outlines, rounded geometry
- Palette: primary #C2703C, secondary #2F6FB0, background off-white #F6F3EC
- Light: soft and even, no hard shadows
- Composition: centered, white space around
- Shared negative: photoreal, 3D, gradient noise, text, watermark

[Change only this line per image] Subject: {write this image's specific content here}`;

interface Lever { icon: string; title: T; body: T }
const LEVERS: Lever[] = [
  { icon: '🔒', title: { en: 'Style prefix (system)', zh: '风格前缀（系统级）' }, body: { en: 'Put medium + palette + light + composition in a fixed block; reuse it verbatim for every image. Only the subject line changes.', zh: '把「媒介 + 配色 + 光线 + 构图」写成固定块，每张原样复用，只改主体那一行。' } },
  { icon: '🚫', title: { en: 'Negative prompt', zh: '负向提示词' }, body: { en: 'A shared "do-not" list (text, watermark, extra fingers, clutter) kills the most common failures across the whole batch.', zh: '一份共用的「不要」清单（文字、水印、多余手指、杂乱）能一次性挡掉整批最常见的翻车。' } },
  { icon: '🖼️', title: { en: 'Reference image + seed', zh: '参考图 + 种子' }, body: { en: 'Feed a reference (垫图) for layout/character, and reuse the same seed to hold identity/composition across variations.', zh: '用垫图锁版式 / 角色，复用同一 seed 让多张之间的身份、构图保持稳定。' } },
  { icon: '🏷️', title: { en: 'Naming + batch', zh: '命名 + 批量' }, body: { en: 'Name files by scene_variant (hero_01, hero_02). Generate sets in one go so review and swap-in stay painless.', zh: '按 场景_序号 命名（hero_01、hero_02），成套一次生成，方便评审和替换。' } },
];

/* ===================== modifier cheat-sheet ============================== */

interface ChipGroup { label: T; color: string; chips: Opt[] }
const CHIPS: ChipGroup[] = [
  { label: { en: 'Style', zh: '风格' }, color: '#c2703c', chips: [
    { zh: '写实摄影', en: 'realistic photography' }, { zh: '电影感', en: 'cinematic' }, { zh: '3D 渲染', en: '3D render' },
    { zh: '扁平插画', en: 'flat illustration' }, { zh: '水彩', en: 'watercolor' }, { zh: '赛博朋克', en: 'cyberpunk' },
    { zh: '极简主义', en: 'minimalism' }, { zh: '国潮工笔', en: 'Chinese gongbi' }, { zh: '等距 3D', en: 'isometric 3D' },
  ] },
  { label: { en: 'Light', zh: '光线' }, color: '#b8860b', chips: [
    { zh: '柔和自然光', en: 'soft natural light' }, { zh: '黄金时刻', en: 'golden hour' }, { zh: '逆光剪影', en: 'backlit silhouette' },
    { zh: '霓虹光', en: 'neon glow' }, { zh: '影棚布光', en: 'studio lighting' }, { zh: '体积光', en: 'volumetric light' },
  ] },
  { label: { en: 'Camera', zh: '镜头' }, color: '#7a5cab', chips: [
    { zh: '特写', en: 'close-up' }, { zh: '中景', en: 'medium shot' }, { zh: '广角 24mm', en: 'wide angle 24mm' },
    { zh: '微距', en: 'macro' }, { zh: '俯拍平铺', en: 'top-down flat-lay' }, { zh: '浅景深', en: 'shallow depth of field' },
  ] },
  { label: { en: 'Quality', zh: '画质' }, color: '#2b8a8a', chips: [
    { zh: '高细节', en: 'high detail' }, { zh: '8K', en: '8K' }, { zh: '锐利对焦', en: 'sharp focus' },
    { zh: '胶片质感', en: 'film grain' }, { zh: '超写实', en: 'hyperrealistic' },
  ] },
  { label: { en: 'Mood', zh: '氛围' }, color: '#5c8a3a', chips: [
    { zh: '温暖治愈', en: 'warm and cozy' }, { zh: '高级冷静', en: 'sleek and calm' }, { zh: '未来科技', en: 'futuristic tech' },
    { zh: '梦幻', en: 'dreamy' }, { zh: '戏剧张力', en: 'dramatic' },
  ] },
];

/* ============================ page ==================================== */

interface Props { onHome: () => void }

const Text2Image: React.FC<Props> = ({ onHome }) => {
  const [lang, setLang] = useState<Lang>(detectInitialLang);
  const s2t = useS2T(lang === 'zhHant');
  const t = (txt: T) => (lang === 'en' ? txt.en : lang === 'zhHant' ? (s2t ? s2t(txt.zh) : txt.zh) : txt.zh);
  useEffect(() => { if (typeof window !== 'undefined') window.localStorage.setItem(STORAGE_KEY, lang); }, [lang]);

  const [copied, setCopied] = useState<string | null>(null);
  const copy = (key: string, text: string) => {
    navigator.clipboard?.writeText(text).then(() => {
      setCopied(key);
      window.setTimeout(() => setCopied((c) => (c === key ? null : c)), 1500);
    }).catch(() => {});
  };

  // builder state: selected option index per dimension + free-text subject
  const [subject, setSubject] = useState<T>({ zh: '一位年轻女咖啡师，围裙，专注拉花', en: 'a young female barista in an apron, focused on latte art' });
  const [sel, setSel] = useState<Record<string, number>>({ scene: 0, style: 0, light: 0, camera: 1, aspect: 3 });

  const built = useMemo(() => {
    const pick = (k: string) => DIMS.find((d) => d.key === k)!.opts[sel[k]];
    const flag = ASPECT_FLAG[sel.aspect];
    const zh = `${subject.zh}，${pick('scene').zh}，${pick('style').zh}，${pick('light').zh}，${pick('camera').zh}，${QUALITY.zh} --ar ${flag}`;
    const en = `${subject.en}, ${pick('scene').en}, ${pick('style').en}, ${pick('light').en}, ${pick('camera').en}, ${QUALITY.en} --ar ${flag}`;
    return { zh, en };
  }, [subject, sel]);

  const LANGS: { code: Lang; label: string }[] = [{ code: 'en', label: 'EN' }, { code: 'zh', label: '简' }, { code: 'zhHant', label: '繁' }];

  // render a template string, highlighting {slots}
  const renderTemplate = (tpl: string) => tpl.split(/(\{[^}]+\})/g).map((part, i) =>
    part.startsWith('{') && part.endsWith('}')
      ? <span key={i} className="rounded bg-gold/15 px-1 font-medium text-gold">{part}</span>
      : <span key={i}>{part}</span>);

  const CopyBtn: React.FC<{ k: string; text: string; className?: string }> = ({ k, text, className }) => (
    <button onClick={() => copy(k, text)} className={`rounded-md border border-ink/15 bg-paper px-2 py-0.5 font-mono text-[10.5px] text-ink/60 transition-colors hover:border-gold/50 hover:text-gold ${className || ''}`}>
      {copied === k ? t({ en: 'Copied ✓', zh: '已复制 ✓' }) : t({ en: 'Copy', zh: '复制' })}
    </button>
  );

  return (
    <div className="min-h-screen bg-paper font-sans text-ink">
      <header className="sticky top-0 z-40 border-b border-ink/10 bg-paper/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-5 py-4 sm:px-8">
          <button onClick={onHome} className="font-mono text-xs text-ink/55 transition-colors hover:text-ink">← Da Lei · 大雷</button>
          <div className="flex items-center gap-3">
            <span className="hidden font-mono text-[11px] uppercase tracking-[0.2em] text-gold sm:inline">Workshop · 文生图</span>
            <div className="flex overflow-hidden rounded-full border border-ink/15">
              {LANGS.map((l) => (
                <button key={l.code} onClick={() => setLang(l.code)} className={`px-2.5 py-1 font-mono text-[11px] transition-colors ${lang === l.code ? 'bg-ink text-paper' : 'text-ink/55 hover:text-ink'}`}>{l.label}</button>
              ))}
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-14">
        <p className="font-mono text-xs uppercase tracking-[0.22em] text-ink/45">{t({ en: 'Workshop column · text-to-image prompting', zh: 'Workshop 专栏 · 文生图提示词' })}</p>
        <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight sm:text-5xl">
          {t({ en: 'Text-to-Image Prompt Studio', zh: '文生图提示词工坊' })}
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-relaxed text-ink/65">
          {t({
            en: 'A hands-on guide for making good images with words. Learn the seven blocks of a prompt, build one live with the interactive builder, grab ready-to-use templates for real work scenarios, then learn how to lock a style so a whole batch or platform stays consistent. Prompts work across Midjourney, 即梦, 豆包, Nano Banana, DALL·E and more — the thinking is the same.',
            zh: '一套「用文字做好图」的实操指南。先拆清提示词的七个模块，用交互搭建器现场拼一条，再拿走真实工作场景的即用模板，最后学会怎么「锁风格」让整批 / 平台级内容保持一致。提示词通用于 Midjourney、即梦、豆包、Nano Banana、DALL·E 等 —— 底层思路是相通的。',
          })}
        </p>

        {/* ---------- 1. anatomy ---------- */}
        <section className="mt-12">
          <h2 className="font-display text-2xl font-semibold tracking-tight">{t({ en: '1 · Anatomy of a prompt', zh: '一 · 提示词的结构' })}</h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink/60">{t({ en: 'A strong image prompt is not a sentence — it is these seven blocks, in order. Miss one and the model guesses.', zh: '一条好的图像提示词不是一句话，而是这七个模块、按顺序排好。缺一块，模型就替你瞎猜。' })}</p>

          {/* color-coded example sentence */}
          <div className="mt-5 overflow-hidden rounded-2xl border border-ink/10 bg-surface/40 p-5 sm:p-6">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink/40">{t({ en: 'One example, colored by block', zh: '一个例子，按模块上色' })}</p>
            <p className="mt-3 text-[15px] leading-loose">
              {BLOCKS.map((b, i) => (
                <React.Fragment key={b.key}>
                  <span className="rounded px-1.5 py-0.5" style={{ backgroundColor: `${b.color}1f`, color: b.color }}>{lang === 'en' ? b.sampleEn : (lang === 'zhHant' && s2t ? s2t(b.sampleZh) : b.sampleZh)}</span>
                  {i < BLOCKS.length - 1 && <span className="text-ink/30">{lang === 'en' ? ', ' : '，'}</span>}
                </React.Fragment>
              ))}
            </p>
          </div>

          {/* block legend */}
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {BLOCKS.map((b) => (
              <div key={b.key} className="rounded-xl border border-ink/10 bg-paper/60 p-4">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: b.color }} />
                  <h3 className="font-display text-base font-semibold" style={{ color: b.color }}>{t(b.label)}</h3>
                </div>
                <p className="mt-1.5 text-[12.5px] leading-relaxed text-ink/55">{t(b.hint)}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ---------- 2. interactive builder ---------- */}
        <section className="mt-14">
          <h2 className="font-display text-2xl font-semibold tracking-tight">{t({ en: '2 · Build one live', zh: '二 · 现场拼一条' })}</h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink/60">{t({ en: 'Type a subject, tap the chips, and watch a complete prompt assemble — in both Chinese and English. Great for showing cause and effect on stage.', zh: '写个主体、点几下标签，一条完整提示词就拼好了 —— 中英双语。上台演示因果关系最好用。' })}</p>

          <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_1.1fr]">
            {/* controls */}
            <div className="rounded-2xl border border-ink/10 bg-surface/40 p-5">
              <label className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink/40">{t({ en: 'Subject (type freely)', zh: '主体（自由输入）' })}</label>
              <input
                value={lang === 'en' ? subject.en : subject.zh}
                onChange={(e) => setSubject((s) => (lang === 'en' ? { ...s, en: e.target.value } : { ...s, zh: e.target.value }))}
                className="mt-1.5 w-full rounded-lg border border-ink/15 bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-gold/50"
                placeholder={t({ en: 'e.g. a young barista pouring latte art', zh: '如：一位年轻咖啡师专注拉花' })}
              />
              {lang !== 'en' && <p className="mt-1 font-mono text-[10px] text-ink/35">{t({ en: '', zh: '英文版将沿用中文主体的对应描述' })}</p>}

              {DIMS.map((d) => (
                <div key={d.key} className="mt-4">
                  <span className="font-mono text-[10px] uppercase tracking-[0.18em]" style={{ color: d.color }}>{t(d.label)}</span>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {d.opts.map((o, i) => (
                      <button key={i} onClick={() => setSel((s) => ({ ...s, [d.key]: i }))}
                        className={`rounded-full border px-2.5 py-1 text-[12px] transition-colors ${sel[d.key] === i ? 'border-transparent text-white' : 'border-ink/15 text-ink/60 hover:border-ink/40'}`}
                        style={sel[d.key] === i ? { backgroundColor: d.color } : undefined}>
                        {t(o)}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* output */}
            <div className="flex flex-col gap-3">
              <div className="overflow-hidden rounded-2xl border border-gold/40 bg-gold/[0.05]">
                <div className="flex items-center justify-between gap-2 border-b border-gold/25 px-4 py-2">
                  <span className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-gold"><span className="pulse-dot h-1.5 w-1.5 rounded-full bg-gold" /> {t({ en: 'Assembled · 中文', zh: '拼好了 · 中文' })}</span>
                  <CopyBtn k="built-zh" text={built.zh} />
                </div>
                <p className="px-4 py-3 text-[13.5px] leading-relaxed text-ink/80">{built.zh}</p>
              </div>
              <div className="overflow-hidden rounded-2xl border border-ink/15 bg-ink/[0.03]">
                <div className="flex items-center justify-between gap-2 border-b border-ink/10 px-4 py-2">
                  <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink/45">{t({ en: 'Assembled · English (often works better)', zh: '拼好了 · English（很多平台更吃英文）' })}</span>
                  <CopyBtn k="built-en" text={built.en} />
                </div>
                <p className="px-4 py-3 font-mono text-[12.5px] leading-relaxed text-ink/70">{built.en}</p>
              </div>
              <p className="text-[11.5px] leading-relaxed text-ink/45">{t({ en: 'Tip: change ONE chip at a time and regenerate — that is how you learn what each word does.', zh: '小贴士：一次只改一个标签再生成 —— 这样才看得清每个词到底管什么。' })}</p>
            </div>
          </div>
        </section>

        {/* ---------- 3. scenario templates ---------- */}
        <section className="mt-14">
          <h2 className="font-display text-2xl font-semibold tracking-tight">{t({ en: '3 · Ready-to-use scenario templates', zh: '三 · 即用场景模板' })}</h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink/60">{t({ en: 'Copy a template, fill the highlighted {slots}, paste. Each is a real work scenario.', zh: '复制模板，填好高亮的 {占位槽}，粘贴即用。每个都是真实工作场景。' })}</p>

          <div className="mt-5 grid gap-5 md:grid-cols-2">
            {SCENES.map((sc) => (
              <article key={sc.id} className="flex flex-col overflow-hidden rounded-2xl border border-ink/10 bg-surface/40">
                <div className="flex items-center gap-3 px-5 py-4" style={{ background: `linear-gradient(120deg, ${sc.grad[0]}22, ${sc.grad[1]}22)` }}>
                  <span className="grid h-10 w-10 place-items-center rounded-xl text-xl" style={{ background: `linear-gradient(135deg, ${sc.grad[0]}, ${sc.grad[1]})` }}>{sc.icon}</span>
                  <div>
                    <h3 className="font-display text-lg font-semibold tracking-tight">{t(sc.title)}</h3>
                    <p className="text-[12px] leading-snug text-ink/55">{t(sc.use)}</p>
                  </div>
                </div>
                <div className="px-5 py-4">
                  <div className="overflow-hidden rounded-xl border border-ink/12 bg-ink/[0.03]">
                    <div className="flex items-center justify-between gap-2 border-b border-ink/10 px-3 py-1.5">
                      <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-gold">{t({ en: 'Template', zh: '模板' })}</span>
                      <CopyBtn k={`sc-${sc.id}`} text={lang === 'en' ? sc.templateEn : sc.templateZh} />
                    </div>
                    <p className="px-3 py-2.5 text-[12.5px] leading-relaxed text-ink/75">{renderTemplate(lang === 'en' ? sc.templateEn : (lang === 'zhHant' && s2t ? s2t(sc.templateZh) : sc.templateZh))}</p>
                  </div>
                  <p className="mt-2.5 flex gap-1.5 text-[12px] leading-relaxed text-ink/55"><span className="text-gold">✦</span>{t(sc.tip)}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* ---------- 4. platform-level consistency ---------- */}
        <section className="mt-14">
          <h2 className="font-display text-2xl font-semibold tracking-tight">{t({ en: '4 · Platform-level content: lock the style', zh: '四 · 平台级内容：把风格锁住' })}</h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink/60">{t({ en: 'One nice image is luck; fifty on-brand images is a system. Here is how to make a whole batch look like one hand made it.', zh: '出一张好看的是运气；出五十张风格统一的是系统。下面是让整批图「像一个人做的」的方法。' })}</p>

          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {LEVERS.map((lv, i) => (
              <div key={i} className="rounded-2xl border border-ink/10 bg-paper/60 p-5">
                <span className="text-2xl">{lv.icon}</span>
                <h3 className="mt-2 font-display text-base font-semibold tracking-tight">{t(lv.title)}</h3>
                <p className="mt-1.5 text-[12.5px] leading-relaxed text-ink/55">{t(lv.body)}</p>
              </div>
            ))}
          </div>

          {/* reusable style-lock template */}
          <div className="mt-5 overflow-hidden rounded-2xl border border-accent/25 bg-accent/[0.04]">
            <div className="flex items-center justify-between gap-2 border-b border-accent/20 px-4 py-2">
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-accent">{t({ en: 'Reusable "style lock" — paste before every image', zh: '可复用「风格锁」—— 每张图前先粘这段' })}</span>
              <CopyBtn k="lock" text={lang === 'en' ? STYLE_LOCK_EN : STYLE_LOCK_ZH} />
            </div>
            <pre className="overflow-x-auto whitespace-pre-wrap px-4 py-3 font-mono text-[11.5px] leading-relaxed text-ink/75">{lang === 'en' ? STYLE_LOCK_EN : (lang === 'zhHant' && s2t ? s2t(STYLE_LOCK_ZH) : STYLE_LOCK_ZH)}</pre>
          </div>
        </section>

        {/* ---------- 5. modifier cheat-sheet ---------- */}
        <section className="mt-14">
          <h2 className="font-display text-2xl font-semibold tracking-tight">{t({ en: '5 · Modifier cheat-sheet', zh: '五 · 修饰词速查库' })}</h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink/60">{t({ en: 'Click any chip to copy it. Stack a style + light + camera + quality word to steer the look fast.', zh: '点任意标签即可复制。叠加「风格 + 光线 + 镜头 + 画质」几个词，最快把画面调到你要的样子。' })}</p>

          <div className="mt-5 space-y-4">
            {CHIPS.map((g, gi) => (
              <div key={gi}>
                <span className="font-mono text-[10px] uppercase tracking-[0.18em]" style={{ color: g.color }}>{t(g.label)}</span>
                <div className="mt-2 flex flex-wrap gap-2">
                  {g.chips.map((c, ci) => {
                    const key = `chip-${gi}-${ci}`;
                    return (
                      <button key={ci} onClick={() => copy(key, t(c))}
                        className="rounded-full border px-3 py-1 font-mono text-[11.5px] transition-colors hover:text-white"
                        style={{ borderColor: `${g.color}55`, color: copied === key ? '#fff' : g.color, backgroundColor: copied === key ? g.color : 'transparent' }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = g.color; }}
                        onMouseLeave={(e) => { if (copied !== key) (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent'; }}>
                        {copied === key ? t({ en: 'Copied ✓', zh: '已复制 ✓' }) : t(c)}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ---------- method footer ---------- */}
        <section className="mt-14 rounded-3xl border border-ink/10 bg-surface/40 p-6 sm:p-8">
          <h2 className="font-display text-2xl font-semibold tracking-tight">{t({ en: 'How to teach it', zh: '怎么讲这一课' })}</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            {[
              { t: { en: 'Blocks before sentences', zh: '先讲模块，别讲句子' }, d: { en: 'Show the seven-block anatomy first; then every prompt reads like a checklist, not a guess.', zh: '先立起七模块结构，之后每条提示词都像清单，而不是靠猜。' } },
              { t: { en: 'One knob at a time', zh: '一次只拧一个旋钮' }, d: { en: 'Change one chip, regenerate, compare. The room sees exactly what each word buys.', zh: '改一个标签、重出、对比。全场清楚看到每个词换来了什么。' } },
              { t: { en: 'Lock, then scale', zh: '先锁风格，再上量' }, d: { en: 'Once a look works, freeze it as a style-lock prefix and only vary the subject line.', zh: '一个风格跑通后，冻结成「风格锁」前缀，之后只改主体那一行。' } },
            ].map((m, i) => (
              <div key={i} className="rounded-2xl border border-ink/10 bg-paper/60 p-5">
                <span className="font-mono text-xs text-gold">0{i + 1}</span>
                <h3 className="mt-1 font-semibold text-ink">{t(m.t)}</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-ink/60">{t(m.d)}</p>
              </div>
            ))}
          </div>
        </section>

        <p className="mt-8 text-xs leading-relaxed text-ink/45">
          {t({ en: 'Curated by 大雷 for the workshop. All copy, templates and swatches are original. Prompts are model-agnostic (Midjourney / 即梦 / 豆包 / Nano Banana / DALL·E …).', zh: '大雷为 workshop 整理。文案、模板与配色示意均为原创。提示词与具体模型无关（Midjourney / 即梦 / 豆包 / Nano Banana / DALL·E …通用）。' })}
        </p>
      </main>
    </div>
  );
};

export default Text2Image;
