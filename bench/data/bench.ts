// 大雷 AI 评测台 — data model.
// Add a result: append to a test's `results` with one of the kinds below.
//   kind 'svg'  → paste the raw <svg>…</svg> the model produced (renders inline)
//   kind 'html' → paste a full HTML doc (renders in a sandboxed iframe)
//   kind 'image'→ a screenshot path (put files in public/bench/…) or URL
//   kind 'link' → an external URL (opens out)
//   kind 'pending' → a reserved slot you'll fill later

import type { LocalizedText } from '../../data/site';
import { SIMULATED_SVGS } from './simulatedSvg';
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
  simulated?: boolean;
  featured?: boolean;
  score?: number;
}

export interface BenchTest {
  id: string;
  title: LocalizedText;
  category: 'svg' | 'webpage' | 'landing' | 'logic' | 'design' | '3d' | 'image';
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
const REF_BUTTERFLY = `<svg viewBox="0 0 600 600" xmlns="http://www.w3.org/2000/svg" role="img" aria-labelledby="butterfly-title butterfly-desc">
  <title id="butterfly-title">Symmetric gradient butterfly</title>
  <desc id="butterfly-desc">A mirrored indigo, teal, and coral butterfly with clipped wing patterns.</desc>
  <defs>
    <linearGradient id="upper-wing-gradient" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#312e81"/>
      <stop offset="0.52" stop-color="#0f766e"/>
      <stop offset="1" stop-color="#fb7185"/>
    </linearGradient>
    <radialGradient id="lower-wing-gradient" cx="58%" cy="35%" r="72%">
      <stop offset="0" stop-color="#5eead4" stop-opacity="0.94"/>
      <stop offset="0.58" stop-color="#0f766e" stop-opacity="0.96"/>
      <stop offset="1" stop-color="#312e81"/>
    </radialGradient>
    <radialGradient id="eye-spot-gradient">
      <stop offset="0" stop-color="#fff7ed"/>
      <stop offset="0.38" stop-color="#fb7185"/>
      <stop offset="0.68" stop-color="#312e81"/>
      <stop offset="1" stop-color="#172033"/>
    </radialGradient>
    <filter id="wing-shadow" x="-20%" y="-20%" width="140%" height="150%">
      <feDropShadow dx="0" dy="9" stdDeviation="7" flood-color="#172033" flood-opacity="0.22"/>
    </filter>
    <clipPath id="left-wing-clip">
      <path d="M286 300 C246 160 152 80 76 116 C21 142 42 228 108 278 C151 311 218 319 286 300 Z"/>
      <path d="M286 310 C224 314 137 345 112 419 C93 474 150 505 204 471 C253 440 278 375 286 310 Z"/>
    </clipPath>
    <g id="left-wing">
      <g filter="url(#wing-shadow)" stroke="#172033" stroke-width="8" stroke-linejoin="round">
        <path d="M286 300 C246 160 152 80 76 116 C21 142 42 228 108 278 C151 311 218 319 286 300 Z" fill="url(#upper-wing-gradient)"/>
        <path d="M286 310 C224 314 137 345 112 419 C93 474 150 505 204 471 C253 440 278 375 286 310 Z" fill="url(#lower-wing-gradient)"/>
      </g>
      <g clip-path="url(#left-wing-clip)" fill="none" stroke-linecap="round">
        <path d="M276 287 C221 245 163 207 91 184" stroke="#ccfbf1" stroke-width="9" stroke-opacity="0.66"/>
        <path d="M267 311 C211 330 168 363 130 416" stroke="#fda4af" stroke-width="10" stroke-opacity="0.72"/>
        <path d="M250 228 C211 198 170 174 121 161" stroke="#fff7ed" stroke-width="5" stroke-opacity="0.72"/>
        <circle cx="119" cy="221" r="39" fill="url(#eye-spot-gradient)" stroke="#fff7ed" stroke-width="6"/>
        <circle cx="185" cy="385" r="24" fill="#fb7185" fill-opacity="0.82" stroke="#fff7ed" stroke-width="5"/>
        <circle cx="223" cy="284" r="12" fill="#fff7ed" fill-opacity="0.86"/>
      </g>
    </g>
  </defs>
  <use href="#left-wing"/>
  <use href="#left-wing" transform="translate(600 0) scale(-1 1)"/>
  <g stroke="#172033" stroke-linecap="round" stroke-linejoin="round">
    <path d="M292 171 C260 125 224 107 197 95" fill="none" stroke-width="8"/>
    <path d="M308 171 C340 125 376 107 403 95" fill="none" stroke-width="8"/>
    <circle cx="194" cy="93" r="9" fill="#fb7185" stroke-width="5"/>
    <circle cx="406" cy="93" r="9" fill="#fb7185" stroke-width="5"/>
    <ellipse cx="300" cy="203" rx="34" ry="37" fill="#172033" stroke-width="6"/>
    <circle cx="288" cy="194" r="5" fill="#fff7ed" stroke="none"/>
    <circle cx="312" cy="194" r="5" fill="#fff7ed" stroke="none"/>
    <path d="M300 232 C272 259 273 401 300 456 C327 401 328 259 300 232 Z" fill="#26344d" stroke-width="7"/>
    <path d="M278 282 H322 M277 326 H323 M282 373 H318 M289 416 H311" fill="none" stroke="#5eead4" stroke-width="6" stroke-opacity="0.76"/>
  </g>
</svg>`;

export const TESTS: BenchTest[] = [
  {
    id: 'macos-dayline-image',
    title: { en: 'macOS native task app image', zh: 'macOS 原生任务应用图片' },
    category: 'image',
    prompt: `你是一名资深产品视觉设计师。请生成一张「macOS 原生任务管理应用 Dayline」的高保真产品截图，用于评测图像模型的界面结构、文字准确性、对齐和细节稳定性。

画面要求：
1. 输出一张 16:10 横图，画面是一张平视、无透视变形的应用截图，不要出现电脑、键盘、手、桌面摄影场景或设备外框。
2. 应用窗口使用克制、现代的 macOS 原生视觉语言。包含半透明标题栏、左上角红黄绿三个窗口控制点、左侧边栏、主内容区和右侧详情面板。不要出现 Apple 标志或其他品牌标志。
3. 左侧边栏从上到下准确显示以下中文：收集箱、今天、计划、已完成。每项配一个简洁单色图标，其中「今天」为选中状态。
4. 主内容区标题准确显示「今天」，副标题准确显示「8 月 11 日，星期二」。下面显示 4 条任务：
   - 完成客户方案初稿
   - 整理图片生成评测
   - 预订周四会议室
   - 晚上跑步 5 公里
5. 每条任务都必须有圆形勾选框、任务标题、时间或分类标签。第一条任务处于选中状态，其他任务保持未完成。
6. 右侧详情面板准确显示选中任务标题「完成客户方案初稿」，并包含「备注」「截止时间」「标签」三个字段。字段结构清楚，文字不能重叠、乱码或缺字。
7. 顶部工具栏包含搜索、添加任务、视图切换三个图标按钮。图标风格一致，对齐准确，不要添加多余按钮。
8. 采用深色模式，背景为石墨灰，文本为柔和浅灰，唯一强调色为低饱和琥珀色。禁止紫色渐变、霓虹外发光和大面积高亮。
9. 所有面板边界、8px 间距节奏、圆角、阴影和分隔线必须统一。窗口内容完整落在画面内，不得裁切。
10. 重点保证中文文字可读、拼写准确、层级合理。不要添加题目中未指定的品牌名、评分、营销文案、水印或伪造通知。

验收标准：一眼能识别为完整的 macOS 桌面任务应用；三栏结构正确；指定中文逐字可读；4 条任务数量正确；选中状态、字段、工具栏和深色视觉系统一致；没有乱码、重叠、重复控件或设备外框。只生成图片，不要解释。`,
    whatItTests: {
      en: 'Chinese text accuracy, native desktop hierarchy, exact object counts, alignment, dark-mode consistency, and artifact control.',
      zh: '中文准确性、原生桌面层级、对象数量、对齐、深色系统一致性和瑕疵控制。',
    },
    results: MODELS.map((model) => ({ modelId: model.id, kind: 'pending' })),
  },
  {
    id: 'pelican-bike',
    title: { en: 'Pelican riding a bicycle (SVG)', zh: '鹈鹕骑自行车 SVG' },
    category: 'svg',
    prompt: `你是一名擅长矢量插画的 SVG 工程师。请绘制一幅「鹈鹕骑自行车」的完整 SVG，用于评测 AI 的空间关系、对象完整性和一次成型能力。

交付要求：
1. 只输出可直接保存为 .svg 并打开的原始 SVG 代码，不要输出 Markdown、解释、HTML、JavaScript 或额外文字。
2. 使用 viewBox="0 0 800 600"。画面必须完整落在 viewBox 内，四周保留合理留白，在浅色和深色页面背景上都能看清主体。
3. 鹈鹕必须一眼可辨：长而宽的喙、喉囊、眼睛、头颈、身体、翅膀、双腿和脚都要存在。姿态要明确表现正在骑车，而不是站在车旁或漂浮在车上。
4. 自行车必须结构完整：两个大小一致且对齐的车轮、轮胎、轮毂与辐条、车架、前叉、车把、车座、曲柄、两个脚踏和链条。前后轮不能重叠或断开，车架连接关系要合理。
5. 空间关系必须可信：鹈鹕坐在车座上，一只翅膀或两只翅膀接触车把，两只脚分别接触左右脚踏；身体、车架和车轮之间不能出现明显穿插。
6. 使用清晰的扁平矢量插画风格，最多 7 种主色。线条粗细统一，主体与背景对比明确。可以增加地面投影和少量速度线，但不得喧宾夺主。
7. 所有图形必须由 path、circle、ellipse、rect、line、polyline、polygon、g、defs 等 SVG 元素绘制。禁止使用 base64、外部图片、外部字体、foreignObject、canvas 或网络资源。
8. 为 SVG 添加简短的 title 和 desc。所有 id 必须唯一，defs 引用有效，不得出现未闭合标签或无效属性。

验收标准：浏览器直接打开即可完整渲染；不看标题也能同时识别出鹈鹕、自行车和正在骑行的动作；双轮、车架、骑乘接触点与遮挡关系合理；控制台无解析错误。只输出 SVG。`,
    whatItTests: {
      en: 'Object completeness, anatomy, mechanical structure, contact points, occlusion, and valid one-shot SVG output.',
      zh: '对象完整性、生物形态、机械结构、接触点、遮挡关系和 SVG 一次成型能力。',
    },
    results: [
      { modelId: 'claude', kind: 'svg', svg: SIMULATED_SVGS.pelicanClaude, simulated: true, score: 91, note: { en: 'Simulated editorial illustration with warm, hand-drawn restraint.', zh: '模拟结果：温暖、克制的编辑插画方向。' } },
      { modelId: 'gpt', kind: 'svg', svg: SIMULATED_SVGS.pelicanGpt, simulated: true, score: 94, note: { en: 'Simulated clean technical illustration emphasizing bicycle geometry.', zh: '模拟结果：强调自行车几何结构的清爽技术插画。' } },
      { modelId: 'gemini', kind: 'svg', svg: SIMULATED_SVGS.pelicanGemini, simulated: true, score: 89, note: { en: 'Simulated colorful character-led interpretation with stronger motion.', zh: '模拟结果：色彩更活泼、动作感更强的角色化方向。' } },
      { modelId: 'grok', kind: 'svg', svg: SIMULATED_SVGS.pelicanGrok, simulated: true, score: 86, note: { en: 'Simulated monochrome poster treatment with a signal-red accent.', zh: '模拟结果：黑白海报构图搭配信号红点缀。' } },
    ],
  },
  {
    id: 'butterfly',
    title: { en: 'Symmetric gradient butterfly (SVG)', zh: '对称渐变蝴蝶 SVG' },
    category: 'svg',
    prompt: `你是一名资深 SVG 图形工程师。请绘制一只「严格左右对称的渐变蝴蝶」，用于评测 AI 的路径控制、复用结构、渐变与细节组织能力。

交付要求：
1. 只输出可直接保存为 .svg 的原始 SVG 代码，不要输出 Markdown、解释、HTML、JavaScript 或额外文字。
2. 使用 viewBox="0 0 600 600"，蝴蝶正面居中，完整占据画面约 75%，触角和翅尖不能被裁切。
3. 先绘制左侧翅膀，再使用 symbol 或 g 配合 use 和 transform 镜像得到右侧。左右翅膀的外轮廓与内部纹样必须几何对称，不能靠手工绘制两个近似版本。
4. 蝴蝶需要包含上翅、下翅、分节身体、头部、两只眼睛和两根弯曲触角。翅膀轮廓要自然流畅，身体位于精确中轴线上。
5. 翅膀至少使用 2 个 linearGradient 或 radialGradient，包含 3 个以上色标，并通过 opacity 营造层次。色彩采用靛蓝、青绿与珊瑚橙，避免彩虹渐变和过度荧光。
6. 每侧翅膀至少包含 3 组内部纹样，例如眼斑、脉络、斑点或边缘饰带。纹样必须被 clipPath 或 mask 限制在翅膀内部，不得溢出轮廓。
7. 使用统一的深色描边、圆角连接和克制的阴影。阴影只能辅助分层，不得造成模糊外发光。
8. 禁止使用 base64、外部图片、外部字体、foreignObject、canvas 或网络资源。所有 defs 的 id 唯一且引用有效。
9. 添加 title 和 desc，确保 SVG 标签闭合、属性合法，缩放到 200×200 时仍能清楚识别轮廓与主要纹样。

验收标准：左右轮廓与纹样严格镜像；渐变、裁切和复用结构真实生效；触角、身体、四片翅膀与内部纹样完整；浏览器直接打开无解析错误。只输出 SVG。`,
    whatItTests: {
      en: 'True mirrored construction, reusable SVG structure, gradients, clipping, path quality, and visual restraint.',
      zh: '真实镜像结构、SVG 复用、渐变、裁切、路径质量和视觉克制。',
    },
    results: [
      { modelId: 'dalei-ref', kind: 'svg', svg: REF_BUTTERFLY, note: { en: 'Da Lei reference (hand-drawn sample)', zh: '大雷参考基准（手绘示例）' }, verdict: 'ok' },
      { modelId: 'claude', kind: 'svg', svg: SIMULATED_SVGS.butterflyClaude, simulated: true, score: 92, note: { en: 'Simulated warm naturalist palette with true mirrored reuse.', zh: '模拟结果：暖色自然主义配色与真实镜像复用。' } },
      { modelId: 'gpt', kind: 'svg', svg: SIMULATED_SVGS.butterflyGpt, simulated: true, score: 95, note: { en: 'Simulated crisp blue geometric version with clipped internal marks.', zh: '模拟结果：清晰的蓝色几何版本，内部纹样经过裁切。' } },
      { modelId: 'gemini', kind: 'svg', svg: SIMULATED_SVGS.butterflyGemini, simulated: true, score: 93, note: { en: 'Simulated expressive violet, coral, and teal interpretation.', zh: '模拟结果：紫、珊瑚与青绿色的表现性方向。' } },
    ],
  },
  {
    id: 'saas-landing',
    title: { en: 'AI notes app landing page', zh: 'AI 笔记 App 落地页' },
    category: 'landing',
    prompt: `你是一名资深品牌设计师与前端工程师。请为 AI 笔记产品「Foldnote」制作一个可直接运行的高完成度落地页，用于评测 AI 的视觉审美、信息架构、交互细节和单文件交付能力。

产品信息：
- 品牌名：Foldnote
- 中文主标题：把零散记录，折成可用知识
- 英文副标题：Capture quickly. Connect ideas. Find the answer when it matters.
- 核心能力：快速记录、自动关联、带来源回答、离线优先
- 示例价格：Free ¥0、Pro ¥48/月。价格明确标注为示例方案

交付要求：
1. 只输出一个完整 HTML 文件，使用原生 HTML、Tailwind CSS CDN 和少量原生 JavaScript。不使用 React、构建工具、后端或需要密钥的 API。
2. 页面采用冷灰与钴蓝的单一视觉系统，避免 AI 紫色渐变、霓虹外发光、纯黑纯白和大面积玻璃拟态。卡片统一使用 14px-16px 圆角，按钮为圆角矩形，不混用多套形状。
3. 顶部导航在桌面端保持单行，包含品牌、功能、工作方式、价格、FAQ 和一个「免费开始」按钮；移动端折叠为可键盘操作的菜单。
4. 首屏使用非对称双栏布局，必须在 1440×900 的首屏内完整看到导航、标题、副标题、主按钮和主要视觉。标题不超过两行，主按钮文字不得换行。
5. Hero 右侧不是静态假截图，而是一个真实可操作的迷你笔记演示：用户可输入一段文字，点击「整理这条笔记」后，本地生成摘要、3 个标签与 2 条相关笔记。提供加载、成功、空输入错误和重置状态，不调用任何网络接口。
6. Hero 下方依次包含：核心能力的不对称内容区、三步工作方式、隐私与离线说明、Free 与 Pro 两档价格、4 个 FAQ 折叠项、结尾 CTA 和简洁页脚。不要使用三张完全相同的横排功能卡。
7. 使用具体、有意义的示例内容，不使用 Lorem Ipsum、John Doe、Acme、虚构媒体 Logo、伪造用户数量、星级评分或无法证实的百分比。
8. 所有按钮、导航、主题切换、演示区和 FAQ 都必须真实工作。页面支持浅色与深色主题，默认跟随系统，并允许手动切换且保存到 localStorage。
9. 动画只用于状态反馈与内容进入，主要动画 transform 和 opacity。必须支持 prefers-reduced-motion，减少动效后功能仍完整。
10. 满足基本无障碍：语义化标签、清晰 heading 层级、可见 focus、表单 label、aria-expanded、足够色彩对比、键盘可操作。禁止自定义鼠标指针。
11. 页面在 390×844、768×1024 和 1440×900 下无横向滚动，无重叠、裁切或按钮文字换行。代码结构清晰，包含必要注释与异常兜底。

验收标准：保存为 HTML 后可直接打开；首屏完整、视觉系统统一；迷你笔记演示包含完整状态循环；导航、主题、FAQ 与 CTA 可用；移动端布局正确；控制台无报错。只输出 HTML，不要解释。`,
    whatItTests: {
      en: 'Brand consistency, responsive composition, a real interactive demo, complete UI states, accessibility, and single-file reliability.',
      zh: '品牌一致性、响应式构图、真实交互演示、完整状态、无障碍和单文件可靠性。',
    },
    results: [
      { modelId: 'claude', kind: 'image', image: '/bench/foldnote-claude-sim.webp', simulated: true, score: 93, note: { en: 'Simulated editorial landing page with warm restraint and asymmetric hierarchy.', zh: '模拟结果：温暖克制、层级不对称的编辑式落地页。' } },
      { modelId: 'gpt', kind: 'image', image: '/bench/foldnote-gpt-sim.webp', simulated: true, score: 95, note: { en: 'Simulated cobalt product system with a complete note-to-knowledge flow.', zh: '模拟结果：钴蓝产品系统与完整的笔记转知识流程。' } },
      { modelId: 'gemini', kind: 'image', image: '/bench/foldnote-gemini-sim.webp', simulated: true, score: 91, note: { en: 'Simulated spatial note canvas with a lighter, more expressive composition.', zh: '模拟结果：更轻盈、更具表现力的空间笔记画布。' } },
      { modelId: 'deepseek', kind: 'image', image: '/bench/foldnote-deepseek-sim.webp', simulated: true, score: 90, note: { en: 'Simulated dark technical workspace focused on privacy and source-linked answers.', zh: '模拟结果：突出隐私和来源回答的深色技术工作区。' } },
    ],
  },
  {
    id: 'solar-system',
    title: { en: 'Solar-system animation (SVG)', zh: '太阳系动画 SVG' },
    category: 'svg',
    prompt: `你是一名擅长动画几何的 SVG 工程师。请制作一幅可直接运行的「太阳系轨道动画」SVG，用于评测 AI 的坐标计算、动画组织、视觉层级与纯 SVG 实现能力。

交付要求：
1. 只输出可直接保存为 .svg 并在浏览器打开的原始 SVG 代码，不要输出 Markdown、解释、HTML、JavaScript 或额外文字。
2. 使用 viewBox="0 0 1000 1000"。太阳位于精确中心，八颗行星按水星、金星、地球、火星、木星、土星、天王星、海王星从内到外排列。
3. 八条轨道必须是不同尺寸的同心椭圆，轨道清晰但不能抢过行星。每颗行星的初始位置必须准确落在自己的轨道线上。
4. 每颗行星放在独立 g 组中，通过 CSS transform 围绕太阳公转。八颗行星使用不同周期，内侧更快、外侧更慢；为避免画面机械同步，设置不同的负 animation-delay。
5. 地球包含一个沿地球公转的小月球；土星包含明显的倾斜环；木星表现出体积最大和横向条纹；其他行星通过大小与颜色保持可辨识。
6. 太阳使用 radialGradient 和克制的柔和光晕，画面背景为深蓝黑色星空。星点使用可复用的 symbol 或 pattern，不得随机遮挡行星与轨道。
7. 右下角提供一个纯 SVG 图例，列出八颗行星名称并用对应色点标识。文字必须可读，不能跟随轨道旋转。
8. 动画只能使用 SVG 内嵌 CSS，不使用 JavaScript、SMIL、foreignObject、canvas、base64、外部图片、外部字体或网络资源。
9. 使用 transform-box 和 transform-origin 正确设置旋转中心。不得通过让轨道本身旋转来伪装行星公转，也不得为每帧生成新节点。
10. 在内嵌 style 中实现 prefers-reduced-motion: reduce。启用后所有行星停止在各自轨道上的不同位置，画面仍完整可读。
11. 添加 title 和 desc，所有 id 唯一且引用有效，SVG 缩放后仍保持清晰。

验收标准：八颗行星顺序正确且都沿自己的轨道绕太阳运动；不同周期与延迟明显；月球、土星环、木星条纹、图例和减少动效模式真实存在；浏览器直接打开无解析错误。只输出 SVG。`,
    whatItTests: {
      en: 'Coordinate systems, transform origins, multi-speed orbital animation, reusable SVG assets, reduced-motion support, and semantic completeness.',
      zh: '坐标系统、旋转中心、多速度轨道动画、SVG 复用、减少动效和语义完整性。',
    },
    results: [
      { modelId: 'claude', kind: 'svg', svg: SIMULATED_SVGS.solarClaude, simulated: true, score: 92, note: { en: 'Simulated warm astronomical chart with restrained orbital animation.', zh: '模拟结果：暖色天文图谱与克制的轨道动画。' } },
      { modelId: 'gemini', kind: 'svg', svg: SIMULATED_SVGS.solarGemini, simulated: true, score: 94, note: { en: 'Simulated luminous blue system with faster, more expressive orbital pacing.', zh: '模拟结果：明亮蓝色体系与更有表现力的轨道节奏。' } },
      { modelId: 'qwen', kind: 'svg', svg: SIMULATED_SVGS.solarQwen, simulated: true, score: 90, note: { en: 'Simulated violet observatory interpretation with a compact legend.', zh: '模拟结果：紫色观测台方向并配有紧凑图例。' } },
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
      {
        modelId: 'claude',
        kind: 'image',
        image: '/bench/headphone-cyan-sim.webp',
        simulated: true,
        featured: true,
        score: 94,
        verdict: 'win',
        note: {
          en: 'Simulated showcase, not a recorded model run. Demonstrates a complete studio layout, product materials, hotspots, and restrained controls.',
          zh: '模拟展示，并非真实模型跑分。用于预览完整工作室布局、产品材质、热点与克制的控制系统。',
        },
      },
      {
        modelId: 'gpt',
        kind: 'image',
        image: '/bench/headphone-amber-sim.webp',
        simulated: true,
        featured: true,
        score: 91,
        verdict: 'ok',
        note: {
          en: 'Simulated showcase, not a recorded model run. A more technical exploded-view interpretation of the same fixed prompt.',
          zh: '模拟展示，并非真实模型跑分。同一固定提示词的技术拆解视图方向。',
        },
      },
      { modelId: 'gemini', kind: 'image', image: '/bench/headphone-gemini-sim.webp', simulated: true, score: 92, note: { en: 'Simulated pearl-white studio with expressive material and lighting variants.', zh: '模拟结果：珍珠白工作室，强调材质与灯光变化。' } },
      { modelId: 'grok', kind: 'image', image: '/bench/headphone-grok-sim.webp', simulated: true, score: 88, note: { en: 'Simulated black-and-red industrial configurator with mechanical emphasis.', zh: '模拟结果：突出机械感的黑红工业配置器。' } },
      { modelId: 'qwen', kind: 'image', image: '/bench/headphone-qwen-sim.webp', simulated: true, score: 93, note: { en: 'Simulated ivory-and-jade luxury product gallery.', zh: '模拟结果：象牙与翡翠配色的奢华产品展厅。' } },
      { modelId: 'deepseek', kind: 'image', image: '/bench/headphone-deepseek-sim.webp', simulated: true, score: 91, note: { en: 'Simulated engineering view pairing PBR rendering with mesh inspection.', zh: '模拟结果：结合 PBR 渲染与网格检查的工程视图。' } },
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
      {
        modelId: 'claude',
        kind: 'image',
        image: '/bench/voxel-night-sim.webp',
        simulated: true,
        featured: true,
        score: 90,
        verdict: 'ok',
        note: {
          en: 'Simulated showcase, not a recorded model run. Night exploration variant with a readable objective path and restrained HUD.',
          zh: '模拟展示，并非真实模型跑分。夜间探索方向，目标路径清楚，HUD 保持克制。',
        },
      },
      { modelId: 'gpt', kind: 'image', image: '/bench/voxel-gpt-sim.webp', simulated: true, score: 93, note: { en: 'Simulated bright coastal sandbox with a clean objective loop.', zh: '模拟结果：明亮海岛沙盒与清晰的目标循环。' } },
      {
        modelId: 'gemini',
        kind: 'image',
        image: '/bench/voxel-sunset-sim.webp',
        simulated: true,
        featured: true,
        score: 95,
        verdict: 'win',
        note: {
          en: 'Simulated showcase, not a recorded model run. Daylight world-generation variant emphasizing depth, terrain variety, and objective clarity.',
          zh: '模拟展示，并非真实模型跑分。日落世界生成方向，突出景深、地形丰富度和目标可读性。',
        },
      },
      { modelId: 'grok', kind: 'image', image: '/bench/voxel-grok-sim.webp', simulated: true, score: 87, note: { en: 'Simulated volcanic survival biome with stark risk readability.', zh: '模拟结果：风险辨识鲜明的火山生存群系。' } },
      { modelId: 'qwen', kind: 'image', image: '/bench/voxel-qwen-sim.webp', simulated: true, score: 92, note: { en: 'Simulated misty bamboo mountain world with a poetic route to the shrine.', zh: '模拟结果：雾中竹山世界与通往神殿的诗意路线。' } },
      { modelId: 'deepseek', kind: 'image', image: '/bench/voxel-deepseek-sim.webp', simulated: true, score: 90, note: { en: 'Simulated performance-oriented crystal cave with technical HUD cues.', zh: '模拟结果：性能导向的晶矿洞穴与技术 HUD。' } },
    ],
  },
];

// 大雷参考基准 shown as a pseudo-model so its reference answers render.
export const REF_MODEL: Model = { id: 'dalei-ref', name: '大雷基准', vendor: '大雷', color: '#8a682c', mark: '大' };
