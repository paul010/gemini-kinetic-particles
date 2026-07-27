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

interface Scene {
  id: string; icon: string; grad: [string, string]; title: T; use: T;
  templateZh: string; templateEn: string; tip: T;
  /** Multi-line prompt — gets a full-width card and a scrollable, structured block. */
  long?: boolean;
  /** Set when the prompt is someone else's work, so the credit travels with it. */
  source?: { label: T; url: string };
}
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
    id: 'archive', icon: '🗺️', grad: ['#8a7a5c', '#cbbb98'], long: true,
    title: { en: 'Landscape archive model', zh: '地景档案模型' },
    use: {
      en: 'Turn a landmark, a city or an invented world into an archive-grade physical model shot: map baseboard + a 3D mass growing out of it + a professional annotation system. Demoed on the Great Wall, Everest, the Bund and Guangzhou’s Pearl River.',
      zh: '把地标、城市或虚构世界做成一块「能拿在手里」的档案级模型图：地图底板 + 从图里长出来的立体主体 + 一整套专业说明系统。原作跑过中国长城、珠穆朗玛峰、上海外滩、广州珠江。',
    },
    templateZh: `请根据【主题】创作一张高完成度、高质感、适合系列化发布的「地景档案模型 / Landscape Archive Model」视觉图。

这不是普通地图，也不是普通风景插画或城市效果图，而是一张结合"二维地图图纸 + 三维立体区域模型 + 专业说明系统 + 博物馆展陈感"的高端档案式视觉图。画面需要像一件被真实制作出来的地理研究模型、城市规划沙盘、建筑提案模型或世界观设定展品，具有专业、克制、精密、可触摸的高级质感。

【基础设定】
主题：{主题，例如火山口湖 / 广州 / 重庆山城 / 海岛城市 / 古城遗址 / 末日废墟 / 幻想大陆 / 游戏主城}
主题类型：{自然地貌 / 城市空间 / 混合景观}
核心主体：{核心主体，例如火山口、峡谷、山脉、湖泊、CBD、老城区、地标群、岛屿城市、遗址群、主城区域}
内容重点：{内容重点，例如地形高差 / 城市地标 / 路网结构 / 水系关系 / 自然与城市关系 / 设定集展示}
风格方向：{风格方向，例如地理测绘风、纸雕模型风、建筑提案风、博物馆档案风、城市规划风、游戏设定集风}
主色调：{主色调，例如米白、浅灰、羊皮纸白、沙色、雪白}
辅助色：{辅助色，例如土褐、岩灰、冷灰、淡蓝、苔绿}
点缀色：{点缀色，例如黑色细线、红色路线、蓝色水文线、黄色编号标记}
画幅比例：{画幅比例，例如 16:9 横版 / 3:4 竖版 / 4:5 竖版 / 1:1 方图}

【画面结构】
画面主体是一块放置在干净桌面或白色布面上的矩形地图模型板。底板具有真实厚度，边缘可见剖面结构，像一块精致的地图切片或模型底座。地图表面覆盖清晰但克制的信息层，包括等高线、道路网络、水文线、分区边界、地理纹理、坐标感、轻微标注和图纸边框。

在地图中央或偏中心区域，从二维地图中立体"生长"出一个三维主体模型，成为整张图的视觉核心。

如果【主题类型】为自然地貌：
主体可由山体、峡谷、火山口、湖泊、盆地、岛屿、冰川、断层、海岸线等构成，强调地形高差、层叠等高线结构、岩壁纹理和自然地貌起伏。

如果【主题类型】为城市空间：
主体可由核心城区、CBD、老城街区、地标建筑群、滨水区、路网节点、桥梁、水系、公园绿地等构成，强调建筑体块、城市识别度、空间层次与规划结构。

如果【主题类型】为混合景观：
需同时整合自然地形与人工建成环境，例如山城、海岛城市、古城遗址、末日废墟、幻想主城、科幻基地等，让自然地貌与城市结构共同构成核心视觉。

【细节要求】
- 模型表面保留地图图纸感与专业信息感
- 地形区域应有等高线、坡面层次、凹陷与起伏关系
- 建筑区域应有体块感、街区关系和清晰层次
- 水域使用低饱和淡蓝色表现
- 绿地、森林、公园、山体可用苔绿色或低饱和绿色表现
- 路网、路径、交通轴线或探索线路可用细线表现，但不要喧宾夺主
- 若有地标建筑或重点结构，应具备明确识别度
- 若有幻想、科幻或游戏设定元素，应保留档案模型和图纸展示感，而不是做成纯场景插画

【说明系统】
地图板边缘需要设计完整而克制的说明模块，包括：
- 外框线和内框线
- 比例尺
- 图例区
- 标题区
- 档案编号
- 索引标记
- 注释标签
- 简洁的符号说明
文字不必全部可读，但整体必须呈现真实、清晰、精密、有秩序的档案式排版结构。

【构图与镜头】
采用斜俯视等轴测或沙盘式构图，镜头从上方约 30 到 45 度观察整块模型板，让观众同时看到地图平面、立体主体高度、边缘厚度和说明区。视觉重心集中在中央主体模型，阅读路径为：先看核心主体，再看周边地形 / 路网 / 水系 / 街区信息，最后看图例、比例尺和说明区。

【材质与光影】
整体需要具有真实模型摄影质感：
- 纸张纹理
- 地图印刷质感
- 纸雕或沙盘模型感
- 建筑模型或地形切片质感
- 柔和自然光
- 细腻真实阴影
- 干净背景
- 低饱和、高级、克制
避免卡通化、廉价游戏 UI 感、过度杂乱、过度炫技，重点突出"地图底板 + 立体主体 + 专业说明系统"的统一视觉。

最终效果应像一张可以用于地理科普、城市研究、建筑提案、文旅视觉专题、世界观设定集或高端系列封面的地景档案模型图。`,
    templateEn: `Create a high-completion, high-craft visual titled "Landscape Archive Model" for {topic}, suitable for publishing as a series.

This is not an ordinary map, nor a landscape illustration or an architectural render. It is a premium archive-style visual combining "a 2D map drawing + a 3D regional model + a professional annotation system + museum-display feel". It must look like a real, physically built geographic research model, urban-planning sandbox, architectural proposal model or worldbuilding exhibit — professional, restrained, precise, touchable.

[BASE SETTINGS]
Topic: {topic, e.g. a crater lake / Guangzhou / a mountain city / an island city / an ancient ruin / a post-apocalyptic ruin / a fantasy continent / a game capital}
Topic type: {natural terrain / urban space / mixed landscape}
Core subject: {core subject, e.g. crater, canyon, mountain range, lake, CBD, old town, landmark cluster, island city, ruin complex, downtown district}
Content focus: {focus, e.g. elevation change / urban landmarks / road network / hydrology / nature-vs-city relationship / worldbuilding display}
Style direction: {style, e.g. cartographic survey, paper-cut model, architectural proposal, museum archive, urban planning, game art bible}
Primary palette: {primary, e.g. off-white, light grey, parchment white, sand, snow white}
Secondary palette: {secondary, e.g. earth brown, rock grey, cool grey, pale blue, moss green}
Accent colors: {accents, e.g. thin black lines, red routes, blue hydrology lines, yellow index markers}
Aspect ratio: {aspect, e.g. 16:9 landscape / 3:4 portrait / 4:5 portrait / 1:1 square}

[COMPOSITION OF THE SCENE]
The subject is a rectangular map-model board resting on a clean desktop or white cloth. The board has real thickness with a visible cross-section along the edge, like a precise slice of terrain on a model base. Its surface carries a clear but restrained information layer: contour lines, road network, hydrology, zone boundaries, geographic texture, a sense of coordinates, light annotations and a drawing frame.

At or near the centre, a three-dimensional model "grows" out of the flat map and becomes the visual core of the image.

If the topic type is natural terrain: build the subject from mountains, canyons, craters, lakes, basins, islands, glaciers, faults or coastlines — emphasise elevation change, stacked contour structure, rock-face texture and natural relief.

If the topic type is urban space: build it from the core district, CBD, old-town blocks, landmark clusters, waterfront, road nodes, bridges, water systems and parks — emphasise building masses, city recognisability, spatial layering and planning structure.

If the topic type is mixed landscape: integrate natural terrain and built environment together — mountain cities, island cities, ancient ruins, post-apocalyptic ruins, fantasy capitals, sci-fi bases — so both form the core visual.

[DETAIL REQUIREMENTS]
- Keep the drawing-sheet feel and professional information density on the model surface
- Terrain areas need contour lines, slope layering, depressions and relief
- Built areas need mass, block relationships and clear layering
- Render water in low-saturation pale blue
- Render green space, forest, parks and vegetated slopes in moss or low-saturation green
- Draw roads, paths, transit axes or exploration routes as thin lines that never overpower the subject
- Landmark buildings or key structures must be clearly recognisable
- Fantasy, sci-fi or game elements must keep the archive-model and drawing-display feel, not become a pure scene illustration

[ANNOTATION SYSTEM]
Design a complete but restrained annotation set around the board edge: outer and inner frame lines, scale bar, legend block, title block, archive number, index markers, annotation labels and a concise symbol key.
Not every character needs to be legible, but the whole must read as a real, clear, precise and orderly archival layout.

[FRAMING AND CAMERA]
Use an oblique top-down isometric / sandbox composition, camera roughly 30 to 45 degrees above the board, so the viewer sees the map plane, the height of the 3D subject, the edge thickness and the annotation zone at once. Visual weight sits on the central model; the reading path is core subject → surrounding terrain / roads / water / blocks → legend, scale bar and notes.

[MATERIAL AND LIGHT]
The whole image needs real model-photography quality: paper texture, map-print feel, paper-cut or sandbox model quality, architectural-model or terrain-slice materials, soft natural light, fine realistic shadows, clean background, low saturation, premium and restrained.
Avoid cartoon looks, cheap game-UI feel, clutter and showing off. Keep the unified visual of "map baseboard + 3D subject + professional annotation system".

The final result should look like a landscape archive model usable for geography outreach, urban research, an architectural proposal, a tourism visual feature, a worldbuilding art bible or a premium series cover.`,
    tip: {
      en: 'The magic is not "draw it realistically" — it is the three-part kit: map baseboard, a 3D mass growing out of it, and the restrained ring of annotations (scale bar / legend / archive number). Drop any one and it collapses into an ordinary illustration.',
      zh: '出彩的地方不是「画得像」，而是三件套齐全：地图底板、从图里长出来的立体主体、边缘那圈克制的说明系统（比例尺 / 图例 / 档案号）。少一件就退化成普通插画。',
    },
    source: {
      label: { en: 'Prompt by Larus Canus (@MrLarus)', zh: '提示词作者：Larus Canus（@MrLarus）' },
      url: 'https://x.com/MrLarus/status/2046627021674168640',
    },
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

  /* Multi-line prompts: keep the line breaks, and let a line that is nothing but
     a 【section】 / [SECTION] header read as a header instead of body copy. */
  const isHeaderLine = (l: string) => /^(【[^】]+】|\[[A-Z][A-Z\s/-]*\])$/.test(l.trim());
  const renderLongTemplate = (tpl: string) => tpl.split('\n').map((line, i) =>
    line.trim() === ''
      ? <span key={i} className="block h-2" />
      : isHeaderLine(line)
        ? <span key={i} className="mt-2 block font-semibold text-ink/85">{line}</span>
        : <span key={i} className="block">{renderTemplate(line)}</span>);

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
              <article key={sc.id} className={`flex flex-col overflow-hidden rounded-2xl border border-ink/10 bg-surface/40 ${sc.long ? 'md:col-span-2' : ''}`}>
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
                    <p className={`px-3 py-2.5 text-[12.5px] leading-relaxed text-ink/75 ${sc.long ? 'max-h-80 overflow-y-auto' : ''}`}>
                      {(() => {
                        const tpl = lang === 'en' ? sc.templateEn : (lang === 'zhHant' && s2t ? s2t(sc.templateZh) : sc.templateZh);
                        return sc.long ? renderLongTemplate(tpl) : renderTemplate(tpl);
                      })()}
                    </p>
                  </div>
                  <p className="mt-2.5 flex gap-1.5 text-[12px] leading-relaxed text-ink/55"><span className="text-gold">✦</span>{t(sc.tip)}</p>
                  {sc.source && (
                    <p className="mt-1.5 text-[11px] text-ink/40">
                      {t(sc.source.label)} ·{' '}
                      <a href={sc.source.url} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-gold">{t({ en: 'original post', zh: '原帖' })}</a>
                    </p>
                  )}
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
