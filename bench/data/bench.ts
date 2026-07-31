// 大雷 AI 评测台 — data model.
// Add a result: append to a test's `results` with one of the kinds below.
//   kind 'svg'  → paste the raw <svg>…</svg> the model produced (renders inline)
//   kind 'html' → paste a full HTML doc (renders in a sandboxed iframe)
//   kind 'image'→ a screenshot path (put files in public/bench/…) or URL
//   kind 'link' → an external URL (opens out)
//   kind 'pending' → a reserved slot you'll fill later

import type { LocalizedText } from '../../data/site';
export type { LocalizedText };

export interface Model {
  id: string;
  name: string;
  vendor: string;
  color: string; // brand-ish accent
  mark: string; // 1-char lettermark
}

export type ResultKind = 'svg' | 'html' | 'image' | 'link' | 'pending';

export interface Result {
  modelId: string;
  date?: string;
  kind: ResultKind;
  svg?: string;
  html?: string;
  image?: string;
  url?: string;
  note?: LocalizedText;
  verdict?: 'win' | 'ok' | 'fail';
}

export interface BenchTest {
  id: string;
  title: LocalizedText;
  category: 'svg' | 'webpage' | 'landing' | 'logic' | 'design' | '3d';
  prompt: string; // the fixed test prompt — kept verbatim across languages
  whatItTests: LocalizedText;
  results: Result[];
}

export const MODELS: Model[] = [
  { id: 'claude', name: 'Claude', vendor: 'Anthropic', color: '#d97757', mark: 'C' },
  { id: 'gpt', name: 'ChatGPT', vendor: 'OpenAI', color: '#10a37f', mark: 'O' },
  { id: 'gemini', name: 'Gemini', vendor: 'Google', color: '#4285f4', mark: 'G' },
  { id: 'grok', name: 'Grok', vendor: 'xAI', color: '#1c1a17', mark: 'X' },
  { id: 'deepseek', name: 'DeepSeek', vendor: 'DeepSeek', color: '#4d6bfe', mark: 'D' },
  { id: 'qwen', name: 'Qwen', vendor: 'Alibaba', color: '#615ced', mark: 'Q' },
];

// A hand-authored reference answer (大雷基准) so the SVG rendering is visible
// out of the box. Real model captures go in alongside it.
const REF_BUTTERFLY = `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="w" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#caa45a"/><stop offset="1" stop-color="#d97757"/>
    </linearGradient>
  </defs>
  <g fill="url(#w)" stroke="#1c1a17" stroke-width="2">
    <path d="M100 100 C60 40, 20 50, 30 95 C20 140, 70 150, 100 100 Z"/>
    <path d="M100 100 C140 40, 180 50, 170 95 C180 140, 130 150, 100 100 Z"/>
    <path d="M100 100 C72 120, 45 130, 48 160 C70 170, 95 140, 100 110 Z"/>
    <path d="M100 100 C128 120, 155 130, 152 160 C130 170, 105 140, 100 110 Z"/>
  </g>
  <rect x="98" y="55" width="4" height="90" rx="2" fill="#1c1a17"/>
  <circle cx="100" cy="52" r="6" fill="#1c1a17"/>
  <path d="M100 50 C92 38, 86 34, 84 28" stroke="#1c1a17" stroke-width="2" fill="none"/>
  <path d="M100 50 C108 38, 114 34, 116 28" stroke="#1c1a17" stroke-width="2" fill="none"/>
</svg>`;

export const TESTS: BenchTest[] = [
  {
    id: 'pelican-bike',
    title: { en: 'Pelican riding a bicycle (SVG)', zh: '鹈鹕骑自行车 SVG' },
    category: 'svg',
    prompt: 'Generate an SVG of a pelican riding a bicycle.',
    whatItTests: {
      en: 'Spatial composition, proportion, and one-shot complex structure. The industry’s classic hard SVG test.',
      zh: '空间组合、比例、复杂结构的「一次成型」能力，这是业界经典硬核题。',
    },
    results: [
      { modelId: 'claude', kind: 'pending' },
      { modelId: 'gpt', kind: 'pending' },
      { modelId: 'gemini', kind: 'pending' },
      { modelId: 'grok', kind: 'pending' },
    ],
  },
  {
    id: 'butterfly',
    title: { en: 'Symmetric gradient butterfly (SVG)', zh: '对称渐变蝴蝶 SVG' },
    category: 'svg',
    prompt: '用 SVG 画一只左右对称的蝴蝶，翅膀要有渐变色彩、带触角与身体。只输出 SVG。',
    whatItTests: { en: 'Symmetry, gradients, path control, and taste.', zh: '对称性、渐变、路径控制与审美。' },
    results: [
      { modelId: 'dalei-ref', kind: 'svg', svg: REF_BUTTERFLY, note: { en: 'Da Lei reference (hand-drawn sample)', zh: '大雷参考基准（手绘示例）' }, verdict: 'ok' },
      { modelId: 'claude', kind: 'pending' },
      { modelId: 'gpt', kind: 'pending' },
      { modelId: 'gemini', kind: 'pending' },
    ],
  },
  {
    id: 'saas-landing',
    title: { en: 'AI notes app landing page', zh: 'AI 笔记 App 落地页' },
    category: 'landing',
    prompt:
      '做一个 AI 笔记应用的落地页：单文件 HTML + Tailwind(CDN)，含 hero 标题、3 个特性、定价、CTA，配色现代克制，自适应。只输出 HTML。',
    whatItTests: {
      en: 'Layout taste, information hierarchy, and a complete runnable single-file output.',
      zh: '排版审美、信息层级、可运行的完整单文件输出。',
    },
    results: [
      { modelId: 'claude', kind: 'pending' },
      { modelId: 'gpt', kind: 'pending' },
      { modelId: 'gemini', kind: 'pending' },
      { modelId: 'deepseek', kind: 'pending' },
    ],
  },
  {
    id: 'solar-system',
    title: { en: 'Solar-system animation (SVG)', zh: '太阳系动画 SVG' },
    category: 'svg',
    prompt: '用纯 SVG + CSS 动画做一个太阳系：太阳居中，几颗行星沿轨道公转。只输出单文件。',
    whatItTests: { en: 'Animation, orbital geometry, pure front-end implementation.', zh: '动画、轨道几何、纯前端实现。' },
    results: [
      { modelId: 'claude', kind: 'pending' },
      { modelId: 'gemini', kind: 'pending' },
      { modelId: 'qwen', kind: 'pending' },
    ],
  },
  {
    id: 'threejs-headphone-studio',
    title: { en: 'Interactive 3D headphone studio', zh: 'Three.js 3D 耳机产品工作室' },
    category: '3d',
    prompt: `你是一名资深创意前端与 Three.js 工程师。请制作一个可直接运行的「3D 耳机产品工作室」，用于评测 AI 编写复杂 3D 网页的能力。

交付要求：
1. 只输出一个完整的 HTML 文件，使用原生 HTML、CSS、JavaScript 和 Three.js。Three.js 与 OrbitControls 可通过 CDN 引入，不使用 React、构建工具或后端。
2. 耳机必须由 Three.js 几何体程序化建模，不使用 GLB/GLTF、外部图片、外部纹理或现成 3D 模型。用 TubeGeometry + CatmullRomCurve3 制作弧形头梁，并组合耳罩、软垫、金属连接环、伸缩臂和左右支架。造型要像可售卖的高端包耳式耳机，而不是简单圆环。
3. 页面采用深海军蓝的专业产品配置器布局：顶部品牌与价格栏，中间为占主要空间的 3D 舞台，右侧为控制面板。移动端将控制面板折叠到舞台下方，不出现横向滚动。
4. 3D 舞台支持鼠标拖拽旋转、滚轮缩放、阻尼、自动旋转开关、重置视角，并限制镜头距离，避免穿模或丢失模型。模型始终正确居中。
5. 提供至少 4 套颜色方案。切换时同步改变耳罩外壳、金属环和装饰灯带的材质颜色，不重新创建场景。
6. 提供 Studio、Neon、Contrast 三种灯光模式。每种模式使用不同的环境光、主光、轮廓光与背景色，并通过平滑过渡切换。
7. 提供 0%-100% 的 Exploded View 滑杆，左右耳罩、软垫、连接环和支架沿合理方向分离，滑回 0% 时精准复位。动画只能更新变换，不重复创建几何体。
8. 在模型周围设置 5 个可点击热点。热点使用 3D 坐标投影到屏幕，镜头旋转时要跟随对应部件；点击后显示功能说明，并高亮对应部件。
9. 右侧面板还要包含产品规格、空间音频频谱的轻量动画和一个明确的主按钮。频谱可使用 Canvas 或 CSS，但要尊重 prefers-reduced-motion。
10. 使用高质量 PBR 材质、柔和阴影、轮廓高光和地面接触阴影营造产品摄影感。设置正确的色彩空间与 tone mapping；控制阴影分辨率和像素比，兼顾观感与性能。
11. 代码必须结构清晰，包含 resize 处理、动画循环、资源复用和必要注释。页面加载失败时显示可读的错误提示。所有按钮均可键盘操作并有清晰的 focus 状态。

验收标准：打开 HTML 后无需额外文件即可看到完整耳机；拖拽、缩放、自动旋转、颜色、灯光、爆炸视图、热点、响应式布局都能真实工作；控制台无报错。不要只做静态 UI 或用二维图片冒充 3D。只输出 HTML，不要解释。`,
    whatItTests: {
      en: 'Procedural product modeling, Three.js materials and lighting, 3D-to-DOM hotspots, stateful controls, responsive UI, and runtime reliability.',
      zh: '程序化产品建模、Three.js 材质与灯光、3D 热点投影、复杂交互状态、响应式布局和运行可靠性。',
    },
    results: [
      { modelId: 'claude', kind: 'pending' },
      { modelId: 'gpt', kind: 'pending' },
      { modelId: 'gemini', kind: 'pending' },
      { modelId: 'grok', kind: 'pending' },
      { modelId: 'qwen', kind: 'pending' },
      { modelId: 'deepseek', kind: 'pending' },
    ],
  },
  {
    id: 'threejs-voxel-sandbox',
    title: { en: 'Playable voxel sandbox game', zh: 'Minecraft 风格 3D 方块沙盒游戏' },
    category: '3d',
    prompt: `你是一名资深 Three.js 游戏工程师。请制作一个可直接游玩的 Minecraft 风格 3D 方块沙盒，用于评测 AI 从零实现网页 3D 游戏的能力。

交付要求：
1. 只输出一个完整 HTML 文件，使用原生 HTML、CSS、JavaScript 和 Three.js。Three.js 可通过 CDN 引入，不使用 React、构建工具、后端、外部图片、外部纹理、GLB/GLTF 或现成游戏素材。
2. 首次打开显示开始界面、玩法说明和「开始游戏」按钮。点击后启用 Pointer Lock；按 Esc 可释放鼠标并显示暂停菜单，能够继续游戏或重置世界。
3. 使用第一人称视角：WASD 移动、鼠标环视、Space 跳跃、Shift 冲刺。实现重力、落地判断、玩家与方块的 AABB 碰撞，不能穿墙、掉进地面或在空中无限跳。
4. 用固定 seed 程序化生成至少 40×40 的体素世界，包含起伏地形、草地、泥土、石头、沙地、水面、树木和少量发光矿石。相同 seed 刷新后应生成相同地图。
5. 世界要有天空渐变、距离雾、太阳方向光、环境光、阴影和缓慢的昼夜变化。所有方块材质必须用纯色、CanvasTexture 或程序化纹理创建，不请求外部资源。
6. 屏幕中央显示准星。用 Raycaster 对准 6 格以内的方块，显示半透明选中框；鼠标左键挖掘方块，右键在相邻面放置方块。不能挖除世界底层，也不能把方块放进玩家身体。
7. 底部提供 5 格快捷栏，包含草、泥土、石头、木头和发光方块。数字键 1-5 或鼠标滚轮切换，当前格明显高亮，并显示方块名称与剩余数量。
8. 加入一个明确的小游戏目标：收集 8 个发光矿石后，返回出生点附近的传送门即可获胜。HUD 要显示已收集数量、当前坐标、FPS，以及胜利提示与重新开始按钮。
9. 优先保证性能：使用 InstancedMesh 或按材质合批渲染方块，不要为每个方块创建独立动画循环；复用几何体和材质，限制像素比，窗口变化时正确更新相机与渲染器。
10. 移动端至少提供可点击的开始与暂停界面，并显示「建议使用桌面键鼠游玩」提示；桌面端在 1280×720 下布局完整，不出现横向滚动。
11. 代码要结构清晰，关键系统分成世界生成、输入、物理、射线交互、方块增删、HUD 和渲染循环。页面加载失败时显示可读错误；控制台无持续报错。

验收标准：无需额外文件即可进入游戏；移动、环视、跳跃、冲刺、碰撞、挖掘、放置、快捷栏、昼夜变化、收集目标和胜利流程都能真实工作。不要只生成静态场景或不可玩的展示页。只输出 HTML，不要解释。`,
    whatItTests: {
      en: 'Voxel generation, first-person controls, physics and collisions, raycast editing, game state, performance strategy, and complete playability.',
      zh: '体素世界生成、第一人称控制、物理碰撞、射线增删方块、游戏状态、性能策略和完整可玩性。',
    },
    results: [
      { modelId: 'claude', kind: 'pending' },
      { modelId: 'gpt', kind: 'pending' },
      { modelId: 'gemini', kind: 'pending' },
      { modelId: 'grok', kind: 'pending' },
      { modelId: 'qwen', kind: 'pending' },
      { modelId: 'deepseek', kind: 'pending' },
    ],
  },
];

// 大雷参考基准 shown as a pseudo-model so its reference answers render.
export const REF_MODEL: Model = { id: 'dalei-ref', name: '大雷基准', vendor: '大雷', color: '#8a682c', mark: '大' };
