import React, { useEffect, useMemo, useState } from 'react';

/* ---------------------------------------------------------------------------
 * /aihtml — "AI 做看得见的小工具" workshop column (for the 2026-07-28 session).
 *
 * Each recipe = a business scenario + a copyable Chinese prompt + a live,
 * self-contained inline demo (rendered in a sandboxed iframe via srcDoc, no
 * external CDN so it works anywhere). A 🎲 button spotlights a random recipe
 * for live demoing.
 *
 * Prompt-library format inspired by 归藏的提示词库 (op7418/guizang-s-prompt);
 * the scenarios, prompts and demos here are original, built for this workshop.
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

/* ============================ recipes =================================== */

type Cat = 'chart' | 'sheet' | 'effect' | '3d' | 'tool';

interface Recipe {
  id: string;
  cat: Cat;
  badge: string;
  title: T;
  scene: T;   // 业务场景 / 方法
  prompt: string;   // the copyable prompt (Chinese — the workshop deliverable)
  demo: string;     // self-contained HTML for the inline preview
  approx?: boolean; // demo is a canvas approximation of a library-based output
}

const CATS: { key: Cat | 'all'; label: T }[] = [
  { key: 'all', label: { en: 'All', zh: '全部' } },
  { key: 'chart', label: { en: 'Charts · ECharts', zh: '图表 · ECharts' } },
  { key: 'sheet', label: { en: 'Sheets · SheetJS', zh: '表格 · SheetJS' } },
  { key: 'effect', label: { en: 'CSS / Canvas FX', zh: 'CSS / 特效' } },
  { key: '3d', label: { en: '3D · WebGL', zh: '3D · WebGL' } },
  { key: 'tool', label: { en: 'Mini tools', zh: '小工具' } },
];

const RECIPES: Recipe[] = [
  {
    id: 'dashboard', cat: 'chart', badge: 'ECharts', approx: true,
    title: { en: 'Sales dashboard', zh: '销售仪表盘' },
    scene: { en: 'Turn a column of numbers into an interactive dashboard for your boss — no BI tool, no deploy.', zh: '把 Excel 里的一列数字，变成给老板看的交互式仪表盘 —— 不用 BI 工具、不用部署。' },
    prompt: '你是资深前端。用单个 HTML 文件 + ECharts（CDN 引入）做一个「销售仪表盘」：顶部三张数字卡片（本月销售额 / 环比 / 完成率），下面左边一个环形图显示各产品线占比、右边一个柱状图显示近 6 个月趋势。用示例数据，蓝色系、简洁风格，代码保存成 .html 双击即可打开。',
    demo: `<!doctype html><meta charset=utf-8><style>html,body{margin:0;height:100%;background:#fbfaf6;font-family:system-ui}canvas{display:block}</style><canvas id=c></canvas><script>var cv=document.getElementById('c'),x=cv.getContext('2d'),W=cv.width=innerWidth,H=cv.height=innerHeight,d=[42,67,55,80,73,90],t=0;function loop(){x.clearRect(0,0,W,H);var n=d.length,bw=W/(n*2),gap=bw;t=Math.min(1,t+0.02);for(var i=0;i<n;i++){var h=(d[i]/100)*(H-60)*t,bx=gap+i*(bw+gap);x.fillStyle='#2f6fb0';x.fillRect(bx,H-30-h,bw,h);x.fillStyle='#33475b';x.font='12px system-ui';x.fillText(d[i],bx+bw/2-8,H-38-h)}if(t<1)requestAnimationFrame(loop)}loop();</script>`,
  },
  {
    id: 'sheet-clean', cat: 'sheet', badge: 'SheetJS',
    title: { en: 'Web spreadsheet cleaner', zh: '网页版表格清洗' },
    scene: { en: 'The everyday "filter some rows then export" task — as a double-click webpage, data never leaves the machine.', zh: 'HR/运营常见的「筛一批数据再导出」，做成一个双击打开的网页，数据不出本机。' },
    prompt: '用单个 HTML 文件 + SheetJS(xlsx) 做一个「网页版表格清洗工具」：支持拖入 Excel/CSV，自动展示成表格，顶部一个搜索框做实时筛选，勾选行后可一键导出成新的 Excel。纯前端、不上传服务器，代码可直接保存成 .html 使用。',
    demo: `<!doctype html><meta charset=utf-8><style>html,body{margin:0;font-family:system-ui;background:#fbfaf6;color:#26231f;padding:12px}input{width:100%;box-sizing:border-box;padding:8px;border:1px solid #ccc;border-radius:8px;margin-bottom:8px}table{border-collapse:collapse;width:100%;font-size:13px}th,td{border:1px solid #e2ddd0;padding:6px 8px;text-align:left}th{background:#efe9dd}</style><input id=q placeholder="筛选：输入关键词（试试 研发）..."><table id=t></table><script>var rows=[['姓名','部门','城市'],['张三','市场','上海'],['李四','研发','北京'],['王五','销售','广州'],['赵六','研发','深圳'],['孙七','市场','杭州']];function render(f){var t=document.getElementById('t');t.innerHTML='';for(var i=0;i<rows.length;i++){if(i>0&&f&&rows[i].join('').indexOf(f)<0)continue;var tr=document.createElement('tr');for(var j=0;j<rows[i].length;j++){var c=document.createElement(i?'td':'th');c.textContent=rows[i][j];tr.appendChild(c)}t.appendChild(tr)}}document.getElementById('q').oninput=function(){render(this.value)};render('');</script>`,
  },
  {
    id: 'glass', cat: 'effect', badge: 'CSS',
    title: { en: 'Glassmorphism card', zh: '玻璃拟态卡片' },
    scene: { en: 'Want a "premium" feel on a login page or dashboard card — one block of CSS does it.', zh: '登录页、仪表盘卡片想要「高级感」，一段 CSS 就能出效果。' },
    prompt: '用纯 HTML+CSS 做一个 Glassmorphism（玻璃拟态）信息卡组件：半透明磨砂背景（backdrop-filter）、细边框、柔和阴影，放在一张渐变背景上。给我可直接复用的单文件代码，并注释每个关键属性。',
    demo: `<!doctype html><meta charset=utf-8><style>html,body{margin:0;height:100%;display:grid;place-items:center;background:linear-gradient(135deg,#6a82fb,#fc5c7d);font-family:system-ui}.card{width:250px;padding:24px;border-radius:18px;background:rgba(255,255,255,.15);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);border:1px solid rgba(255,255,255,.35);box-shadow:0 8px 32px rgba(0,0,0,.2);color:#fff}.card h3{margin:0 0 6px}.card p{margin:0;opacity:.85;font-size:13px}.b{display:inline-block;margin-top:14px;padding:4px 10px;border-radius:999px;background:rgba(255,255,255,.25);font-size:12px}</style><div class=card><h3>玻璃拟态卡片</h3><p>半透明磨砂 + 柔和阴影，仪表盘/登录页利器。</p><span class=b>CSS backdrop-filter</span></div>`,
  },
  {
    id: 'gradient', cat: 'effect', badge: 'CSS',
    title: { en: 'Flowing gradient hero', zh: '流动渐变 Hero' },
    scene: { en: 'A moving background for a landing / launch page — zero images, zero JS.', zh: '活动页 / 发布会页面的动态背景，零图片、零 JS。' },
    prompt: '用纯 CSS 做一个会缓慢流动的多色渐变全屏背景（background-size:400% + @keyframes 移动 background-position），中间放一句标题。要平滑不刺眼，适合做落地页 / 活动页 Hero，单文件带注释。',
    demo: `<!doctype html><meta charset=utf-8><style>html,body{margin:0;height:100%}.h{height:100%;display:grid;place-items:center;color:#fff;font-family:system-ui;background:linear-gradient(-45deg,#ee7752,#e73c7e,#23a6d5,#23d5ab);background-size:400% 400%;animation:g 12s ease infinite}@keyframes g{0%{background-position:0 50%}50%{background-position:100% 50%}100%{background-position:0 50%}}h2{font-size:26px;text-shadow:0 2px 12px rgba(0,0,0,.25)}</style><div class=h><h2>流动渐变背景</h2></div>`,
  },
  {
    id: 'flip', cat: 'effect', badge: 'CSS 3D',
    title: { en: 'Hover flip card', zh: '悬停翻转卡片' },
    scene: { en: 'Product features, business cards, FAQ — a flip is more memorable than an expand.', zh: '产品特性、名片、FAQ —— 悬停翻转比展开更有记忆点。' },
    prompt: '用纯 CSS 3D（perspective + rotateY + backface-visibility:hidden）做一个鼠标悬停翻转的卡片，正面是标题、背面是详情。单文件、带注释，尺寸自适应。',
    demo: `<!doctype html><meta charset=utf-8><style>html,body{margin:0;height:100%;display:grid;place-items:center;background:#eee;font-family:system-ui}.s{perspective:900px}.c{width:220px;height:140px;transition:transform .7s;transform-style:preserve-3d;position:relative}.s:hover .c{transform:rotateY(180deg)}.f,.b{position:absolute;inset:0;backface-visibility:hidden;-webkit-backface-visibility:hidden;border-radius:14px;display:grid;place-items:center;color:#fff;font-size:18px}.f{background:linear-gradient(135deg,#2f6fb0,#5ad1ff)}.b{background:linear-gradient(135deg,#e8863c,#e73c7e);transform:rotateY(180deg)}</style><div class=s><div class=c><div class=f>悬停翻转 →</div><div class=b>背面内容 ✦</div></div></div>`,
  },
  {
    id: 'particles', cat: 'effect', badge: 'Canvas',
    title: { en: 'Particle network bg', zh: '粒子连线背景' },
    scene: { en: 'A techy site / big-screen background — one <canvas>, no Three.js needed.', zh: '科技感官网 / 大屏背景，一个 <canvas> 搞定，不用 Three.js。' },
    prompt: '用单个 HTML + Canvas（不依赖任何库）做一个「粒子连线」动态背景：粒子随机漂浮，靠近的两点之间连线，深色底、青色粒子。全屏自适应、性能友好，代码保存成 .html 即可。',
    demo: `<!doctype html><meta charset=utf-8><style>html,body{margin:0;height:100%;background:#0b1020;overflow:hidden}canvas{display:block}</style><canvas id=c></canvas><script>var cv=document.getElementById('c'),x=cv.getContext('2d'),W,H,P=[];function rs(){W=cv.width=innerWidth;H=cv.height=innerHeight}rs();onresize=rs;for(var i=0;i<60;i++)P.push({x:Math.random()*W,y:Math.random()*H,vx:(Math.random()-.5)*.8,vy:(Math.random()-.5)*.8});function loop(){x.clearRect(0,0,W,H);for(var i=0;i<P.length;i++){var p=P[i];p.x+=p.vx;p.y+=p.vy;if(p.x<0||p.x>W)p.vx*=-1;if(p.y<0||p.y>H)p.vy*=-1;x.fillStyle='#5ad1ff';x.beginPath();x.arc(p.x,p.y,2,0,7);x.fill();for(var j=i+1;j<P.length;j++){var q=P[j],dx=p.x-q.x,dy=p.y-q.y,d=Math.sqrt(dx*dx+dy*dy);if(d<120){x.strokeStyle='rgba(90,209,255,'+(1-d/120)*.5+')';x.beginPath();x.moveTo(p.x,p.y);x.lineTo(q.x,q.y);x.stroke()}}}requestAnimationFrame(loop)}loop();</script>`,
  },
  {
    id: 'cube', cat: '3d', badge: 'Three.js', approx: true,
    title: { en: 'Spinning 3D cube', zh: '旋转 3D 立方体' },
    scene: { en: 'Show the team "the web can run 3D too" — start from a spinning cube.', zh: '给团队直观演示「网页里也能跑 3D」—— 从一个会转的立方体开始。' },
    prompt: '用单个 HTML + Three.js（CDN 引入）做一个自转的 3D 立方体，六个面用不同颜色，加一点环境光和方向光让它有立体感，鼠标可拖动旋转（OrbitControls）。代码保存成 .html 双击打开就能看。',
    demo: `<!doctype html><meta charset=utf-8><style>html,body{margin:0;height:100%;background:#0b1020;overflow:hidden}canvas{display:block}</style><canvas id=c></canvas><script>var cv=document.getElementById('c'),x=cv.getContext('2d'),W=cv.width=innerWidth,H=cv.height=innerHeight,v=[[-1,-1,-1],[1,-1,-1],[1,1,-1],[-1,1,-1],[-1,-1,1],[1,-1,1],[1,1,1],[-1,1,1]],e=[[0,1],[1,2],[2,3],[3,0],[4,5],[5,6],[6,7],[7,4],[0,4],[1,5],[2,6],[3,7]],a=0;function loop(){x.clearRect(0,0,W,H);a+=.01;var cx=W/2,cy=H/2,s=Math.min(W,H)/5,pr=[];for(var i=0;i<8;i++){var p=v[i],X=p[0]*Math.cos(a)-p[2]*Math.sin(a),Z=p[0]*Math.sin(a)+p[2]*Math.cos(a),Y=p[1]*Math.cos(a*.7)-Z*Math.sin(a*.7);Z=p[1]*Math.sin(a*.7)+Z*Math.cos(a*.7);var f=3/(3+Z);pr.push([cx+X*s*f,cy+Y*s*f])}x.strokeStyle='#5ad1ff';x.lineWidth=1.5;for(var i=0;i<e.length;i++){x.beginPath();x.moveTo(pr[e[i][0]][0],pr[e[i][0]][1]);x.lineTo(pr[e[i][1]][0],pr[e[i][1]][1]);x.stroke()}requestAnimationFrame(loop)}loop();</script>`,
  },
  {
    id: 'starfield', cat: '3d', badge: 'Canvas',
    title: { en: 'Warp-speed starfield', zh: '穿越星空' },
    scene: { en: 'An intro / transition animation — cinematic in a few dozen lines.', zh: '开场动画 / 过场画面，几十行代码就有电影感。' },
    prompt: '用单个 HTML + Canvas 做一个「穿越星空」(warp speed) 效果：星点从屏幕中心向外加速飞出、带一点拖影，深空黑底，全屏自适应，纯 JS 不依赖库。',
    demo: `<!doctype html><meta charset=utf-8><style>html,body{margin:0;height:100%;background:#000;overflow:hidden}canvas{display:block}</style><canvas id=c></canvas><script>var cv=document.getElementById('c'),x=cv.getContext('2d'),W=cv.width=innerWidth,H=cv.height=innerHeight,S=[];for(var i=0;i<220;i++)S.push({x:(Math.random()-.5)*W,y:(Math.random()-.5)*H,z:Math.random()*W});function loop(){x.fillStyle='rgba(0,0,0,.35)';x.fillRect(0,0,W,H);for(var i=0;i<S.length;i++){var s=S[i];s.z-=6;if(s.z<1){s.z=W;s.x=(Math.random()-.5)*W;s.y=(Math.random()-.5)*H}var k=128/s.z,px=s.x*k+W/2,py=s.y*k+H/2,r=(1-s.z/W)*2.5;x.fillStyle='#fff';x.beginPath();x.arc(px,py,r,0,7);x.fill()}requestAnimationFrame(loop)}loop();</script>`,
  },
  {
    id: 'pomodoro', cat: 'tool', badge: 'JS',
    title: { en: 'Pomodoro timer', zh: '番茄钟' },
    scene: { en: 'Hand the team a "double-click and use" tool — lighter than installing an app.', zh: '给团队发一个「双击就能用」的小工具，比装 App 更轻。' },
    prompt: '用单个 HTML 文件做一个极简番茄钟：25 分钟倒计时，开始 / 暂停 / 重置按钮，结束时标题栏文字闪烁提醒。深色墨金配色、大字号，双击打开即用。',
    demo: `<!doctype html><meta charset=utf-8><style>html,body{margin:0;height:100%;display:grid;place-items:center;background:#1c1a17;color:#f6f3ec;font-family:system-ui}.t{font-size:52px;font-variant-numeric:tabular-nums}button{margin:4px;padding:8px 16px;border:1px solid #8a682c;background:transparent;color:#c9a35c;border-radius:999px;cursor:pointer}</style><div style="text-align:center"><div class=t id=d>25:00</div><div><button onclick=st()>开始</button><button onclick=rs()>重置</button></div></div><script>var s=1500,r=null;function fmt(){var m=Math.floor(s/60),c=s%60;document.getElementById('d').textContent=(m<10?'0':'')+m+':'+(c<10?'0':'')+c}function st(){if(r)return;r=setInterval(function(){if(s>0){s--;fmt()}else{clearInterval(r);r=null}},1000)}function rs(){clearInterval(r);r=null;s=1500;fmt()}fmt();</script>`,
  },
  {
    id: 'palette', cat: 'tool', badge: 'JS',
    title: { en: 'Palette generator', zh: '配色生成器' },
    scene: { en: 'Spin up a few palettes for the room to vote on — one webpage is enough.', zh: '开会时快速给几组配色让大家投票 —— 一个网页就够。' },
    prompt: '用单个 HTML 文件做一个「配色生成器」：整屏五个色块，按空格键换一组随机配色，点击色块复制其十六进制色值。适合设计 / 前端快速取色，双击打开即用。',
    demo: `<!doctype html><meta charset=utf-8><style>html,body{margin:0;height:100%;font-family:system-ui}#w{display:flex;height:100%}.c{flex:1;display:flex;align-items:flex-end;justify-content:center;color:#fff;cursor:pointer;padding-bottom:24px;font-size:13px;text-shadow:0 1px 4px rgba(0,0,0,.4)}button{position:fixed;top:12px;left:50%;transform:translateX(-50%);padding:8px 16px;border:0;border-radius:999px;background:#1c1a17;color:#fff;cursor:pointer;z-index:2}</style><button onclick=gen()>换一组 →</button><div id=w></div><script>function rc(){var s=Math.floor(Math.random()*16777215).toString(16);while(s.length<6)s='0'+s;return'#'+s}function gen(){var w=document.getElementById('w');w.innerHTML='';for(var i=0;i<5;i++){var c=rc(),dv=document.createElement('div');dv.className='c';dv.style.background=c;dv.textContent=c;dv.onclick=function(){try{navigator.clipboard.writeText(this.textContent)}catch(e){}};w.appendChild(dv)}}onkeydown=function(e){if(e.code=='Space'){e.preventDefault();gen()}};gen();</script>`,
  },
];

/* ============================ demo frame =============================== */

const DemoFrame: React.FC<{ html: string; title: string; tall?: boolean }> = ({ html, title, tall }) => (
  <iframe
    title={title}
    srcDoc={html}
    sandbox="allow-scripts allow-popups"
    loading="lazy"
    className={`w-full rounded-xl border border-ink/10 bg-white ${tall ? 'h-80' : 'h-56'}`}
  />
);

const openFullscreen = (html: string) => {
  try {
    const blob = new Blob([html], { type: 'text/html' });
    window.open(URL.createObjectURL(blob), '_blank', 'noopener');
  } catch { /* ignore */ }
};

/* ============================ page ==================================== */

interface Props { onHome: () => void }

const AIHtmlLab: React.FC<Props> = ({ onHome }) => {
  const [lang, setLang] = useState<Lang>(detectInitialLang);
  const s2t = useS2T(lang === 'zhHant');
  const t = (txt: T) => (lang === 'en' ? txt.en : lang === 'zhHant' ? (s2t ? s2t(txt.zh) : txt.zh) : txt.zh);
  useEffect(() => { if (typeof window !== 'undefined') window.localStorage.setItem(STORAGE_KEY, lang); }, [lang]);

  const [cat, setCat] = useState<Cat | 'all'>('all');
  const [openId, setOpenId] = useState<string | null>(null);   // which card's demo is expanded
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [spotId, setSpotId] = useState<string | null>(null);   // 🎲 spotlight

  const shown = useMemo(() => (cat === 'all' ? RECIPES : RECIPES.filter((r) => r.cat === cat)), [cat]);
  const spot = spotId ? RECIPES.find((r) => r.id === spotId) : null;

  const rollDice = () => {
    const pool = shown.length ? shown : RECIPES;
    const pick = pool[Math.floor(Math.random() * pool.length)];
    setSpotId(pick.id);
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const copyPrompt = (r: Recipe) => {
    navigator.clipboard?.writeText(r.prompt).then(() => {
      setCopiedId(r.id);
      window.setTimeout(() => setCopiedId((c) => (c === r.id ? null : c)), 1600);
    }).catch(() => {});
  };

  const LANGS: { code: Lang; label: string }[] = [{ code: 'en', label: 'EN' }, { code: 'zh', label: '简' }, { code: 'zhHant', label: '繁' }];

  const badgeColor: Record<Cat, string> = {
    chart: '#2f6fb0', sheet: '#5c8a3a', effect: '#c2703c', '3d': '#7a5cab', tool: '#8a682c',
  };

  const PromptBlock: React.FC<{ r: Recipe }> = ({ r }) => (
    <div className="mt-3 overflow-hidden rounded-xl border border-ink/12 bg-ink/[0.03]">
      <div className="flex items-center justify-between gap-2 border-b border-ink/10 px-3 py-1.5">
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-gold">{t({ en: 'Prompt (paste to AI)', zh: '提示词（丢给 AI）' })}</span>
        <button onClick={() => copyPrompt(r)} className="rounded-md border border-ink/15 bg-paper px-2 py-0.5 font-mono text-[10.5px] text-ink/60 transition-colors hover:border-gold/50 hover:text-gold">
          {copiedId === r.id ? t({ en: 'Copied ✓', zh: '已复制 ✓' }) : t({ en: 'Copy', zh: '复制' })}
        </button>
      </div>
      <p className="px-3 py-2.5 text-[12.5px] leading-relaxed text-ink/70">{r.prompt}</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-paper font-sans text-ink">
      <header className="sticky top-0 z-40 border-b border-ink/10 bg-paper/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-5 py-4 sm:px-8">
          <button onClick={onHome} className="font-mono text-xs text-ink/55 transition-colors hover:text-ink">← Da Lei · 大雷</button>
          <div className="flex items-center gap-3">
            <span className="hidden font-mono text-[11px] uppercase tracking-[0.2em] text-gold sm:inline">Workshop · 07·28</span>
            <div className="flex overflow-hidden rounded-full border border-ink/15">
              {LANGS.map((l) => (
                <button key={l.code} onClick={() => setLang(l.code)} className={`px-2.5 py-1 font-mono text-[11px] transition-colors ${lang === l.code ? 'bg-ink text-paper' : 'text-ink/55 hover:text-ink'}`}>{l.label}</button>
              ))}
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-14">
        <p className="font-mono text-xs uppercase tracking-[0.22em] text-ink/45">{t({ en: 'Workshop column · make AI output something you can SEE', zh: 'Workshop 专栏 · 用 AI 做「看得见」的东西' })}</p>
        <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight sm:text-5xl">
          {t({ en: 'AI → visible little HTML tools', zh: 'AI 做看得见的 HTML 小工具' })}
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-relaxed text-ink/65">
          {t({
            en: 'For a business audience, one thing they can see and click beats an hour on how models work. Each recipe below is a scenario + a copyable prompt + a live, self-contained demo (ECharts, SheetJS, CSS/Canvas FX, Three.js). Hit the dice to spotlight a random one on stage.',
            zh: '面向业务团队，一个能看能点的东西，胜过讲一小时模型原理。下面每张卡 = 业务场景 + 可复制提示词 + 实时自包含效果（ECharts、SheetJS、CSS/Canvas 特效、Three.js）。演示时点骰子，随机弹一个上台。',
          })}
        </p>

        {/* dice + credit */}
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button onClick={rollDice} className="btn-sheen inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 font-mono text-xs font-semibold text-paper transition-transform hover:scale-[1.03]">
            🎲 {t({ en: 'Random demo', zh: '随机演示' })}
          </button>
          <span className="font-mono text-[11px] text-ink/45">{t({ en: 'picks one from the current filter', zh: '从当前筛选里随机抽一个' })}</span>
        </div>

        {/* spotlight */}
        {spot && (
          <section className="menu-in mt-6 overflow-hidden rounded-3xl border border-gold/40 bg-gold/[0.05]">
            <div className="flex items-center justify-between gap-3 border-b border-gold/25 px-5 py-3">
              <span className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-gold">
                <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-gold" /> {t({ en: 'On stage', zh: '正在演示' })}
              </span>
              <button onClick={() => setSpotId(null)} className="rounded-md border border-ink/15 px-2 py-0.5 font-mono text-[10.5px] text-ink/55 hover:text-ink">✕</button>
            </div>
            <div className="grid gap-5 p-5 sm:p-6 lg:grid-cols-[1.2fr_1fr]">
              <div>
                <DemoFrame html={spot.demo} title={t(spot.title)} tall />
                <div className="mt-2 flex items-center gap-3">
                  <button onClick={() => openFullscreen(spot.demo)} className="font-mono text-[11px] text-gold underline underline-offset-2 hover:opacity-80">⛶ {t({ en: 'Open fullscreen', zh: '全屏看效果' })}</button>
                  {spot.approx && <span className="font-mono text-[10px] text-ink/40">{t({ en: 'preview is a canvas approximation', zh: '预览为 Canvas 示意' })}</span>}
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-white" style={{ backgroundColor: badgeColor[spot.cat] }}>{spot.badge}</span>
                  <h2 className="font-display text-2xl font-semibold tracking-tight">{t(spot.title)}</h2>
                </div>
                <p className="mt-2 text-[14px] leading-relaxed text-ink/70">{t(spot.scene)}</p>
                <PromptBlock r={spot} />
                <button onClick={rollDice} className="mt-4 inline-flex items-center gap-2 rounded-full border border-ink/15 px-4 py-2 font-mono text-[11px] text-ink/65 transition-colors hover:border-gold/50 hover:text-gold">🎲 {t({ en: 'Another one', zh: '再来一个' })}</button>
              </div>
            </div>
          </section>
        )}

        {/* category filter */}
        <div className="mt-8 flex flex-wrap gap-2">
          {CATS.map((c) => (
            <button key={c.key} onClick={() => setCat(c.key)} className={`rounded-full border px-3.5 py-1.5 font-mono text-[11px] transition-colors ${cat === c.key ? 'border-ink bg-ink text-paper' : 'border-ink/15 text-ink/60 hover:border-ink/40 hover:text-ink'}`}>
              {t(c.label)}
            </button>
          ))}
        </div>

        {/* grid */}
        <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {shown.map((r) => (
            <article key={r.id} className="flex flex-col overflow-hidden rounded-2xl border border-ink/10 bg-surface/40">
              <div className="flex items-center justify-between gap-2 p-4 pb-0">
                <div className="flex items-center gap-2">
                  <span className="rounded-full px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-white" style={{ backgroundColor: badgeColor[r.cat] }}>{r.badge}</span>
                  <h3 className="font-display text-lg font-semibold tracking-tight">{t(r.title)}</h3>
                </div>
              </div>
              <p className="px-4 pt-2 text-[13px] leading-relaxed text-ink/60">{t(r.scene)}</p>

              <div className="px-4 pt-3">
                {openId === r.id
                  ? <DemoFrame html={r.demo} title={t(r.title)} />
                  : (
                    <button onClick={() => setOpenId(r.id)} className="grid h-56 w-full place-items-center rounded-xl border border-dashed border-ink/20 bg-ink/[0.03] text-ink/45 transition-colors hover:border-gold/50 hover:text-gold">
                      <span className="font-mono text-xs">▶ {t({ en: 'Run the demo', zh: '看效果' })}</span>
                    </button>
                  )}
                {openId === r.id && (
                  <div className="mt-2 flex items-center gap-3">
                    <button onClick={() => openFullscreen(r.demo)} className="font-mono text-[11px] text-gold underline underline-offset-2 hover:opacity-80">⛶ {t({ en: 'Fullscreen', zh: '全屏' })}</button>
                    <button onClick={() => setOpenId(null)} className="font-mono text-[11px] text-ink/45 hover:text-ink">{t({ en: 'Close', zh: '收起' })}</button>
                    {r.approx && <span className="font-mono text-[10px] text-ink/40">{t({ en: 'canvas approximation', zh: 'Canvas 示意' })}</span>}
                  </div>
                )}
              </div>

              <div className="px-4 pb-4">
                <PromptBlock r={r} />
              </div>
            </article>
          ))}
        </div>

        {/* method / philosophy */}
        <section className="mt-12 rounded-3xl border border-ink/10 bg-surface/40 p-6 sm:p-8">
          <h2 className="font-display text-2xl font-semibold tracking-tight">{t({ en: 'The workshop method', zh: 'Workshop 的方法论' })}</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            {[
              { t: { en: 'Show, don’t lecture', zh: '给「看得见」，不讲原理' }, d: { en: 'A clickable result lands with a business team far better than an explanation of how models work.', zh: '一个能点的结果，对业务团队的说服力远胜「讲清楚模型怎么工作」。' } },
              { t: { en: 'Single-file & local', zh: '单文件、跑在本地' }, d: { en: 'Every prompt asks for one .html you double-click — no install, no deploy, data stays on the machine.', zh: '每个提示词都要求产出一个双击即用的 .html —— 不装环境、不用部署、数据不出本机。' } },
              { t: { en: 'One knob at a time', zh: '一次只改一个点' }, d: { en: 'Generate, then tweak one thing (color, data, layout) and regenerate — the audience sees cause and effect.', zh: '先生成，再每次只改一个点（配色 / 数据 / 布局）重新生成 —— 让大家看到因果。' } },
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
          {t({ en: 'Curated by 大雷 for the 2026-07-28 workshop. Prompt-library format inspired by ', zh: '大雷为 2026-07-28 workshop 整理。提示词库形式参考 ' })}
          <a href="https://github.com/op7418/guizang-s-prompt" target="_blank" rel="noopener noreferrer" className="text-gold underline underline-offset-2 hover:opacity-80">归藏的提示词库 (op7418/guizang-s-prompt) ↗</a>
          {t({ en: '; the scenarios, prompts and demos here are original. Demos run fully in your browser (sandboxed, no external calls).', zh: '；此处场景、提示词与效果均为原创。所有效果全程在你浏览器本地运行（沙箱隔离、无外部调用）。' })}
        </p>
      </main>
    </div>
  );
};

export default AIHtmlLab;
