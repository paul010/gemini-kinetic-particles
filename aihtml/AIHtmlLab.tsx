import React, { useEffect, useMemo, useState } from 'react';

/* ---------------------------------------------------------------------------
 * /aihtml — "AI 做看得见的小工具" workshop column (for the 2026-07-28 session).
 *
 * Each recipe = a business scenario + a copyable Chinese prompt + a live,
 * self-contained inline demo (rendered in a sandboxed iframe via srcDoc, no
 * external CDN so it works anywhere). A 🎲 button spotlights a random recipe
 * for live demoing.
 *
 * All scenarios, prompts and demos here are original, built for this workshop.
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

type Cat = 'chart' | 'sheet' | 'drag' | 'effect' | '3d' | 'tool';
type Level = 'basic' | 'pro' | 'expert';

interface Recipe {
  id: string;
  cat: Cat;
  level: Level;
  badge: string;
  title: T;
  scene: T;   // 业务场景 / 方法
  prompt: string;   // the copyable prompt (Chinese — the workshop deliverable)
  demo: string;     // self-contained HTML for the inline preview
  dataTemplate?: string; // sample data to paste into Copilot Chat alongside the prompt
  approx?: boolean; // demo is a canvas approximation of a library-based output
}

const CATS: { key: Cat | 'all'; label: T }[] = [
  { key: 'all', label: { en: 'All', zh: '全部' } },
  { key: 'chart', label: { en: 'Charts · ECharts/Chart.js', zh: '图表 · ECharts/Chart.js' } },
  { key: 'sheet', label: { en: 'Sheets · SheetJS', zh: '表格 · SheetJS' } },
  { key: 'drag', label: { en: 'Drag & drop', zh: '交互拖拽' } },
  { key: 'effect', label: { en: 'CSS / Canvas FX', zh: 'CSS / 特效' } },
  { key: '3d', label: { en: '3D · Three.js', zh: '3D · Three.js' } },
  { key: 'tool', label: { en: 'Mini tools', zh: '小工具' } },
];

const LEVELS: { key: Level | 'all'; label: T; hint: T }[] = [
  { key: 'all', label: { en: 'All levels', zh: '全部阶段' }, hint: { en: '', zh: '' } },
  { key: 'basic', label: { en: 'Beginner', zh: '初学者' }, hint: { en: 'pure HTML/CSS, copy-run-see', zh: '纯 HTML/CSS，复制即出效果' } },
  { key: 'pro', label: { en: 'Proficient', zh: '精通' }, hint: { en: 'data + interaction, real office tools', zh: '数据 + 交互，能上手的办公工具' } },
  { key: 'expert', label: { en: 'Advanced', zh: '高阶' }, hint: { en: 'canvas / 3D / heatmaps', zh: 'Canvas / 3D / 热力图' } },
];

const LEVEL_META: Record<Level, { label: T; color: string }> = {
  basic: { label: { en: 'Beginner', zh: '初学者' }, color: '#5c8a3a' },
  pro: { label: { en: 'Proficient', zh: '精通' }, color: '#2f6fb0' },
  expert: { label: { en: 'Advanced', zh: '高阶' }, color: '#7a5cab' },
};

const RECIPES: Recipe[] = [
  /* ---- HP 办公实战：不同阶段的可用案例 ---- */
  {
    id: 'roster', cat: 'sheet', level: 'pro', badge: '排班 · 旗舰案例',
    title: { en: 'Weekly staff roster', zh: '周排班系统' },
    scene: { en: 'The flagship walkthrough: give Copilot Chat a data template + a prompt, it writes one HTML page — save it, double-click, and you have a real rota tool. Click any cell to switch shift; days with <2 people on duty auto-flag red.', zh: '旗舰演示：把「数据模板 + 提示词」丢给 Copilot Chat，它生成一页 HTML —— 存成 .html 双击打开，就是一个真能用的排班工具。点格子切换班次，当天在岗＜2 人自动标红预警。' },
    prompt: '你是资深前端工程师。请用【单个 HTML 文件】做一个「周排班表」小工具，我会把你给的代码保存成 .html 双击打开使用：\n1. 表格：行是员工、列是周一到周日，第一列表头是员工姓名；\n2. 每个格子点击可在【早班 / 中班 / 晚班 / 休】之间循环切换，四种班次用不同底色区分，一眼可辨；\n3. 最后一行自动统计每天「在岗人数」，当某天在岗人数＜2 时把该格子标红预警；\n4. 用我下面提供的员工名单与班次定义作为初始排班。\n要求：纯前端、不依赖任何服务器、不引入外部库；配色简洁专业。数据如下：\n【把下面的“数据模板”一起粘贴进来】',
    dataTemplate: '员工名单：王芳、李明、张伟、赵丽、陈杰\n班次定义：早班(09–13)、中班(13–18)、晚班(18–22)、休\n排班规则：\n- 每人每周至少休 1 天，最多上 6 天\n- 每天在岗人数不少于 2 人\n- 尽量避免「晚班接早班」的连轴转\n排班周期：周一 至 周日',
    demo: `<!doctype html><meta charset=utf-8><style>html,body{margin:0;font-family:system-ui;background:#fbfaf6;color:#26231f;padding:10px;box-sizing:border-box}h3{margin:2px 0 8px;font-size:15px}table{border-collapse:collapse;width:100%;font-size:12px}th,td{border:1px solid #e2ddd0;text-align:center}th{background:#efe9dd;padding:5px}td.nm{background:#f7f2e8;font-weight:600;text-align:left;padding:5px 8px;white-space:nowrap}.c{cursor:pointer;padding:8px 2px;user-select:none;font-weight:600}.cov{padding:5px;font-weight:700}.lg{margin-top:8px;font-size:11px;color:#6b655c}.lg b{display:inline-block;margin-right:12px;font-weight:400}.sw{display:inline-block;width:11px;height:11px;border-radius:2px;vertical-align:-1px;margin-right:3px;border:1px solid #ddd}</style><h3>🗓️ 周排班表 · 点格子切换班次（早/中/晚/休）</h3><table id=t></table><div class=lg id=lg></div><script>var staff=['王芳','李明','张伟','赵丽','陈杰'],days=['一','二','三','四','五','六','日'],sh=[{t:'休',c:'#fff',f:'#bbb'},{t:'早',c:'#d6ebff',f:'#1c6fb0'},{t:'中',c:'#fff2cc',f:'#a6791c'},{t:'晚',c:'#e6d9f2',f:'#6b3fa0'}],seed=[[1,1,2,0,3,1,0],[2,2,1,3,0,0,1],[3,0,0,1,2,2,1],[0,3,3,2,1,0,0],[1,2,1,0,3,3,2]],g=seed.map(function(r){return r.slice()});function render(){var h='<tr><th>员工</th>';for(var d=0;d<days.length;d++)h+='<th>周'+days[d]+'</th>';h+='</tr>';for(var i=0;i<staff.length;i++){h+='<tr><td class=nm>'+staff[i]+'</td>';for(var d=0;d<days.length;d++){var s=sh[g[i][d]];h+='<td class=c data-i='+i+' data-d='+d+' style="background:'+s.c+';color:'+s.f+'">'+s.t+'</td>'}h+='</tr>'}h+='<tr><td class=nm>在岗</td>';for(var d=0;d<days.length;d++){var n=0;for(var i=0;i<staff.length;i++)if(g[i][d]>0)n++;h+='<td class=cov style="color:'+(n<2?'#c0392b':'#5c8a3a')+'">'+n+(n<2?' ⚠':'')+'</td>'}h+='</tr>';var t=document.getElementById('t');t.innerHTML=h;var cs=t.querySelectorAll('.c');for(var k=0;k<cs.length;k++)cs[k].onclick=function(){var i=+this.getAttribute('data-i'),d=+this.getAttribute('data-d');g[i][d]=(g[i][d]+1)%4;render()}}document.getElementById('lg').innerHTML=sh.map(function(s){return'<b><span class=sw style="background:'+s.c+'"></span>'+s.t+'</b>'}).join('')+'<b style="color:#c0392b">⚠ 当日在岗＜2 自动预警</b>';render();</script>`,
  },
  {
    id: 'meeting-cost', cat: 'tool', level: 'basic', badge: 'JS',
    title: { en: 'Meeting cost calculator', zh: '会议成本计算器' },
    scene: { en: 'The perfect first build: type headcount, hourly rate and minutes — watch the live cost of a meeting. One prompt, instantly relatable to any manager.', zh: '最适合第一次上手：填参会人数、人均时薪、时长，实时算出这场会花了多少钱。一句提示词，任何管理者都秒懂。' },
    prompt: '用【单个 HTML 文件】做一个「会议成本计算器」：三个输入框 —— 参会人数、人均时薪（元）、会议时长（分钟），下方实时显示这场会议的总成本（￥），并换算成「相当于 1 位员工工作多少小时」。数值一改就实时更新。风格简洁、字号大，代码存成 .html 双击即用，不引入任何外部库。',
    demo: `<!doctype html><meta charset=utf-8><style>html,body{margin:0;height:100%;display:grid;place-items:center;background:#fbfaf6;font-family:system-ui;color:#26231f}.box{width:280px}label{display:block;font-size:12px;color:#6b655c;margin:8px 0 2px}input{width:100%;box-sizing:border-box;padding:8px;border:1px solid #ccc;border-radius:8px}.cost{font-size:42px;font-weight:700;color:#c2703c;margin-top:16px;text-align:center;font-variant-numeric:tabular-nums}.sub{font-size:12px;color:#6b655c;text-align:center}.h{font-weight:600;text-align:center;margin-bottom:4px}</style><div class=box><div class=h>💰 会议成本计算器</div><label>参会人数</label><input id=n type=number value=8><label>人均时薪（元）</label><input id=w type=number value=120><label>会议时长（分钟）</label><input id=m type=number value=60><div class=cost id=c>￥960</div><div class=sub id=s></div></div><script>function calc(){var n=+document.getElementById('n').value||0,w=+document.getElementById('w').value||0,m=+document.getElementById('m').value||0,cost=n*w*(m/60);document.getElementById('c').textContent='￥'+Math.round(cost).toLocaleString();document.getElementById('s').textContent='相当于 1 位员工工作 '+(w?Math.round(cost/w*10)/10:0)+' 小时';}['n','w','m'].forEach(function(id){document.getElementById(id).oninput=calc});calc();</script>`,
  },
  {
    id: 'expense-check', cat: 'sheet', level: 'pro', badge: 'SheetJS',
    title: { en: 'Expense claim checker', zh: '报销单核对器' },
    scene: { en: 'Paste a table of expense rows + your rules; the page flags every row that breaks a rule (over-limit meal, missing invoice). Same template→prompt→.html flow as the roster.', zh: '把报销明细和规则丢给 Copilot，页面自动标出所有违规行（餐费超标、缺发票）。和排班一样的「模板 → 提示词 → .html」流程。' },
    prompt: '用【单个 HTML 文件】做一个「报销单核对器」：把我下面的报销明细渲染成表格，并按我给的规则自动核对 —— 命中规则的行整行标红、末列写明原因（如「餐费超标」「缺发票」），通过的行标绿写「✓ 通过」。纯前端、不上传服务器、不引入外部库，代码存成 .html 双击即用。数据与规则如下：\n【把下面的“数据模板”一起粘贴进来】',
    dataTemplate: '报销明细（类别 / 报销人 / 金额 / 是否有发票）：\n交通, 张伟, 86, 有\n餐费, 李明, 260, 有\n办公用品, 王芳, 45, 有\n餐费, 赵丽, 180, 无\n差旅, 陈杰, 1200, 有\n核对规则：单笔餐费＞200 元、或缺发票 → 标红提示原因',
    demo: `<!doctype html><meta charset=utf-8><style>html,body{margin:0;font-family:system-ui;background:#fbfaf6;color:#26231f;padding:10px;box-sizing:border-box;font-size:13px}h3{margin:2px 0 8px;font-size:15px}table{border-collapse:collapse;width:100%;font-size:12px}th,td{border:1px solid #e2ddd0;padding:6px 8px;text-align:left}th{background:#efe9dd}tr.bad{background:#fdecea}.tag{color:#c0392b;font-weight:600}.ok{color:#5c8a3a}</style><h3>🧾 报销单核对器 · 自动标出异常</h3><table id=t></table><div style="margin-top:8px;font-size:11px;color:#6b655c">规则：单笔餐费 ＞￥200 或 缺发票 → 标红提示</div><script>var rows=[['交通','张伟',86,true],['餐费','李明',260,true],['办公用品','王芳',45,true],['餐费','赵丽',180,false],['差旅','陈杰',1200,true]];var h='<tr><th>类别</th><th>报销人</th><th>金额</th><th>发票</th><th>核对</th></tr>';for(var i=0;i<rows.length;i++){var r=rows[i],bad=(r[0]=='餐费'&&r[2]>200)||!r[3],msg=!r[3]?'缺发票':(r[0]=='餐费'&&r[2]>200?'餐费超标':'');h+='<tr class="'+(bad?'bad':'')+'"><td>'+r[0]+'</td><td>'+r[1]+'</td><td>￥'+r[2]+'</td><td>'+(r[3]?'✓':'✗')+'</td><td class="'+(bad?'tag':'ok')+'">'+(bad?'⚠ '+msg:'✓ 通过')+'</td></tr>'}document.getElementById('t').innerHTML=h;</script>`,
  },
  {
    id: 'skills-heatmap', cat: 'chart', level: 'expert', badge: 'Canvas',
    title: { en: 'Team skills heatmap', zh: '团队技能矩阵热力图' },
    scene: { en: 'For L&D: a people × skills grid where color depth = proficiency. The whole team’s capability gaps jump out in one glance — teaches gradient/heatmap coloring.', zh: '给培训/团队负责人：员工 × 技能的方格，颜色越深越熟练。一眼看出整队的能力缺口 —— 顺带学会热力图渐变上色。' },
    prompt: '用【单个 HTML 文件】做一个「团队技能矩阵热力图」：行是员工、列是技能，每格是 1–5 的熟练度，用颜色深浅表示（越熟练颜色越深），格子里显示数值。下方一句说明「深=熟练、浅=需培训」。纯前端、不引入外部库，代码存成 .html 双击即用。用示例数据（员工：王芳/李明/张伟/赵丽；技能：Excel/Copilot/数据分析/PPT/自动化）。',
    demo: `<!doctype html><meta charset=utf-8><style>html,body{margin:0;font-family:system-ui;background:#fbfaf6;color:#26231f;padding:10px;box-sizing:border-box;font-size:12px}h3{margin:2px 0 10px;font-size:15px}table{border-collapse:collapse}td,th{padding:0}th{color:#6b655c;font-weight:600;padding:4px 6px;font-size:11px}th.rot{writing-mode:vertical-rl;transform:rotate(180deg);text-align:left;height:56px}td.nm{background:#f7f2e8;text-align:left;padding:6px 8px;white-space:nowrap;font-weight:600;border:1px solid #e2ddd0}td.cell{width:38px;height:32px;text-align:center;color:#fff;font-weight:700;border:1px solid #fff}</style><h3>🔥 团队技能矩阵热力图（1–5 熟练度）</h3><table id=t></table><div style="margin-top:8px;font-size:11px;color:#6b655c">深 = 熟练 · 浅 = 需培训 —— 一眼看出团队能力缺口</div><script>var people=['王芳','李明','张伟','赵丽'],skills=['Excel','Copilot','数据分析','PPT','自动化'],data=[[5,4,3,5,2],[3,5,4,3,4],[4,2,5,4,5],[2,3,2,5,1]];function col(v){var a=(v-1)/4,r=Math.round(224-a*(224-31)),g=Math.round(232-a*(232-111)),b=Math.round(214-a*(214-176));return'rgb('+r+','+g+','+b+')'}var h='<tr><th></th>';for(var s=0;s<skills.length;s++)h+='<th class=rot>'+skills[s]+'</th>';h+='</tr>';for(var i=0;i<people.length;i++){h+='<tr><td class=nm>'+people[i]+'</td>';for(var s=0;s<skills.length;s++){var v=data[i][s];h+='<td class=cell style="background:'+col(v)+'">'+v+'</td>'}h+='</tr>'}document.getElementById('t').innerHTML=h;</script>`,
  },

  {
    id: 'dashboard', cat: 'chart', level: 'pro', badge: 'ECharts', approx: true,
    title: { en: 'Sales dashboard', zh: '销售仪表盘' },
    scene: { en: 'Turn a column of numbers into an interactive dashboard for your boss — no BI tool, no deploy.', zh: '把 Excel 里的一列数字，变成给老板看的交互式仪表盘 —— 不用 BI 工具、不用部署。' },
    prompt: '你是资深前端。用单个 HTML 文件 + ECharts（CDN 引入）做一个「销售仪表盘」：顶部三张数字卡片（本月销售额 / 环比 / 完成率），下面左边一个环形图显示各产品线占比、右边一个柱状图显示近 6 个月趋势。用示例数据，蓝色系、简洁风格，代码保存成 .html 双击即可打开。',
    demo: `<!doctype html><meta charset=utf-8><style>html,body{margin:0;height:100%;background:#fbfaf6;font-family:system-ui}canvas{display:block}</style><canvas id=c></canvas><script>var cv=document.getElementById('c'),x=cv.getContext('2d'),W=cv.width=innerWidth,H=cv.height=innerHeight,d=[42,67,55,80,73,90],t=0;function loop(){x.clearRect(0,0,W,H);var n=d.length,bw=W/(n*2),gap=bw;t=Math.min(1,t+0.02);for(var i=0;i<n;i++){var h=(d[i]/100)*(H-60)*t,bx=gap+i*(bw+gap);x.fillStyle='#2f6fb0';x.fillRect(bx,H-30-h,bw,h);x.fillStyle='#33475b';x.font='12px system-ui';x.fillText(d[i],bx+bw/2-8,H-38-h)}if(t<1)requestAnimationFrame(loop)}loop();</script>`,
  },
  {
    id: 'sheet-clean', cat: 'sheet', level: 'pro', badge: 'SheetJS',
    title: { en: 'Web spreadsheet cleaner', zh: '网页版表格清洗' },
    scene: { en: 'The everyday "filter some rows then export" task — as a double-click webpage, data never leaves the machine.', zh: 'HR/运营常见的「筛一批数据再导出」，做成一个双击打开的网页，数据不出本机。' },
    prompt: '用单个 HTML 文件 + SheetJS(xlsx) 做一个「网页版表格清洗工具」：支持拖入 Excel/CSV，自动展示成表格，顶部一个搜索框做实时筛选，勾选行后可一键导出成新的 Excel。纯前端、不上传服务器，代码可直接保存成 .html 使用。',
    demo: `<!doctype html><meta charset=utf-8><style>html,body{margin:0;font-family:system-ui;background:#fbfaf6;color:#26231f;padding:12px}input{width:100%;box-sizing:border-box;padding:8px;border:1px solid #ccc;border-radius:8px;margin-bottom:8px}table{border-collapse:collapse;width:100%;font-size:13px}th,td{border:1px solid #e2ddd0;padding:6px 8px;text-align:left}th{background:#efe9dd}</style><input id=q placeholder="筛选：输入关键词（试试 研发）..."><table id=t></table><script>var rows=[['姓名','部门','城市'],['张三','市场','上海'],['李四','研发','北京'],['王五','销售','广州'],['赵六','研发','深圳'],['孙七','市场','杭州']];function render(f){var t=document.getElementById('t');t.innerHTML='';for(var i=0;i<rows.length;i++){if(i>0&&f&&rows[i].join('').indexOf(f)<0)continue;var tr=document.createElement('tr');for(var j=0;j<rows[i].length;j++){var c=document.createElement(i?'td':'th');c.textContent=rows[i][j];tr.appendChild(c)}t.appendChild(tr)}}document.getElementById('q').oninput=function(){render(this.value)};render('');</script>`,
  },
  {
    id: 'glass', cat: 'effect', level: 'basic', badge: 'CSS',
    title: { en: 'Glassmorphism card', zh: '玻璃拟态卡片' },
    scene: { en: 'Want a "premium" feel on a login page or dashboard card — one block of CSS does it.', zh: '登录页、仪表盘卡片想要「高级感」，一段 CSS 就能出效果。' },
    prompt: '用纯 HTML+CSS 做一个 Glassmorphism（玻璃拟态）信息卡组件：半透明磨砂背景（backdrop-filter）、细边框、柔和阴影，放在一张渐变背景上。给我可直接复用的单文件代码，并注释每个关键属性。',
    demo: `<!doctype html><meta charset=utf-8><style>html,body{margin:0;height:100%;display:grid;place-items:center;background:linear-gradient(135deg,#6a82fb,#fc5c7d);font-family:system-ui}.card{width:250px;padding:24px;border-radius:18px;background:rgba(255,255,255,.15);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);border:1px solid rgba(255,255,255,.35);box-shadow:0 8px 32px rgba(0,0,0,.2);color:#fff}.card h3{margin:0 0 6px}.card p{margin:0;opacity:.85;font-size:13px}.b{display:inline-block;margin-top:14px;padding:4px 10px;border-radius:999px;background:rgba(255,255,255,.25);font-size:12px}</style><div class=card><h3>玻璃拟态卡片</h3><p>半透明磨砂 + 柔和阴影，仪表盘/登录页利器。</p><span class=b>CSS backdrop-filter</span></div>`,
  },
  {
    id: 'gradient', cat: 'effect', level: 'basic', badge: 'CSS',
    title: { en: 'Flowing gradient hero', zh: '流动渐变 Hero' },
    scene: { en: 'A moving background for a landing / launch page — zero images, zero JS.', zh: '活动页 / 发布会页面的动态背景，零图片、零 JS。' },
    prompt: '用纯 CSS 做一个会缓慢流动的多色渐变全屏背景（background-size:400% + @keyframes 移动 background-position），中间放一句标题。要平滑不刺眼，适合做落地页 / 活动页 Hero，单文件带注释。',
    demo: `<!doctype html><meta charset=utf-8><style>html,body{margin:0;height:100%}.h{height:100%;display:grid;place-items:center;color:#fff;font-family:system-ui;background:linear-gradient(-45deg,#ee7752,#e73c7e,#23a6d5,#23d5ab);background-size:400% 400%;animation:g 12s ease infinite}@keyframes g{0%{background-position:0 50%}50%{background-position:100% 50%}100%{background-position:0 50%}}h2{font-size:26px;text-shadow:0 2px 12px rgba(0,0,0,.25)}</style><div class=h><h2>流动渐变背景</h2></div>`,
  },
  {
    id: 'flip', cat: 'effect', level: 'basic', badge: 'CSS 3D',
    title: { en: 'Hover flip card', zh: '悬停翻转卡片' },
    scene: { en: 'Product features, business cards, FAQ — a flip is more memorable than an expand.', zh: '产品特性、名片、FAQ —— 悬停翻转比展开更有记忆点。' },
    prompt: '用纯 CSS 3D（perspective + rotateY + backface-visibility:hidden）做一个鼠标悬停翻转的卡片，正面是标题、背面是详情。单文件、带注释，尺寸自适应。',
    demo: `<!doctype html><meta charset=utf-8><style>html,body{margin:0;height:100%;display:grid;place-items:center;background:#eee;font-family:system-ui}.s{perspective:900px}.c{width:220px;height:140px;transition:transform .7s;transform-style:preserve-3d;position:relative}.s:hover .c{transform:rotateY(180deg)}.f,.b{position:absolute;inset:0;backface-visibility:hidden;-webkit-backface-visibility:hidden;border-radius:14px;display:grid;place-items:center;color:#fff;font-size:18px}.f{background:linear-gradient(135deg,#2f6fb0,#5ad1ff)}.b{background:linear-gradient(135deg,#e8863c,#e73c7e);transform:rotateY(180deg)}</style><div class=s><div class=c><div class=f>悬停翻转 →</div><div class=b>背面内容 ✦</div></div></div>`,
  },
  {
    id: 'particles', cat: 'effect', level: 'expert', badge: 'Canvas',
    title: { en: 'Particle network bg', zh: '粒子连线背景' },
    scene: { en: 'A techy site / big-screen background — one <canvas>, no Three.js needed.', zh: '科技感官网 / 大屏背景，一个 <canvas> 搞定，不用 Three.js。' },
    prompt: '用单个 HTML + Canvas（不依赖任何库）做一个「粒子连线」动态背景：粒子随机漂浮，靠近的两点之间连线，深色底、青色粒子。全屏自适应、性能友好，代码保存成 .html 即可。',
    demo: `<!doctype html><meta charset=utf-8><style>html,body{margin:0;height:100%;background:#0b1020;overflow:hidden}canvas{display:block}</style><canvas id=c></canvas><script>var cv=document.getElementById('c'),x=cv.getContext('2d'),W,H,P=[];function rs(){W=cv.width=innerWidth;H=cv.height=innerHeight}rs();onresize=rs;for(var i=0;i<60;i++)P.push({x:Math.random()*W,y:Math.random()*H,vx:(Math.random()-.5)*.8,vy:(Math.random()-.5)*.8});function loop(){x.clearRect(0,0,W,H);for(var i=0;i<P.length;i++){var p=P[i];p.x+=p.vx;p.y+=p.vy;if(p.x<0||p.x>W)p.vx*=-1;if(p.y<0||p.y>H)p.vy*=-1;x.fillStyle='#5ad1ff';x.beginPath();x.arc(p.x,p.y,2,0,7);x.fill();for(var j=i+1;j<P.length;j++){var q=P[j],dx=p.x-q.x,dy=p.y-q.y,d=Math.sqrt(dx*dx+dy*dy);if(d<120){x.strokeStyle='rgba(90,209,255,'+(1-d/120)*.5+')';x.beginPath();x.moveTo(p.x,p.y);x.lineTo(q.x,q.y);x.stroke()}}}requestAnimationFrame(loop)}loop();</script>`,
  },
  {
    id: 'cube', cat: '3d', level: 'expert', badge: 'Three.js', approx: true,
    title: { en: 'Spinning 3D cube', zh: '旋转 3D 立方体' },
    scene: { en: 'Show the team "the web can run 3D too" — start from a spinning cube.', zh: '给团队直观演示「网页里也能跑 3D」—— 从一个会转的立方体开始。' },
    prompt: '用单个 HTML + Three.js（CDN 引入）做一个自转的 3D 立方体，六个面用不同颜色，加一点环境光和方向光让它有立体感，鼠标可拖动旋转（OrbitControls）。代码保存成 .html 双击打开就能看。',
    demo: `<!doctype html><meta charset=utf-8><style>html,body{margin:0;height:100%;background:#0b1020;overflow:hidden}canvas{display:block}</style><canvas id=c></canvas><script>var cv=document.getElementById('c'),x=cv.getContext('2d'),W=cv.width=innerWidth,H=cv.height=innerHeight,v=[[-1,-1,-1],[1,-1,-1],[1,1,-1],[-1,1,-1],[-1,-1,1],[1,-1,1],[1,1,1],[-1,1,1]],e=[[0,1],[1,2],[2,3],[3,0],[4,5],[5,6],[6,7],[7,4],[0,4],[1,5],[2,6],[3,7]],a=0;function loop(){x.clearRect(0,0,W,H);a+=.01;var cx=W/2,cy=H/2,s=Math.min(W,H)/5,pr=[];for(var i=0;i<8;i++){var p=v[i],X=p[0]*Math.cos(a)-p[2]*Math.sin(a),Z=p[0]*Math.sin(a)+p[2]*Math.cos(a),Y=p[1]*Math.cos(a*.7)-Z*Math.sin(a*.7);Z=p[1]*Math.sin(a*.7)+Z*Math.cos(a*.7);var f=3/(3+Z);pr.push([cx+X*s*f,cy+Y*s*f])}x.strokeStyle='#5ad1ff';x.lineWidth=1.5;for(var i=0;i<e.length;i++){x.beginPath();x.moveTo(pr[e[i][0]][0],pr[e[i][0]][1]);x.lineTo(pr[e[i][1]][0],pr[e[i][1]][1]);x.stroke()}requestAnimationFrame(loop)}loop();</script>`,
  },
  {
    id: 'starfield', cat: '3d', level: 'expert', badge: 'Canvas',
    title: { en: 'Warp-speed starfield', zh: '穿越星空' },
    scene: { en: 'An intro / transition animation — cinematic in a few dozen lines.', zh: '开场动画 / 过场画面，几十行代码就有电影感。' },
    prompt: '用单个 HTML + Canvas 做一个「穿越星空」(warp speed) 效果：星点从屏幕中心向外加速飞出、带一点拖影，深空黑底，全屏自适应，纯 JS 不依赖库。',
    demo: `<!doctype html><meta charset=utf-8><style>html,body{margin:0;height:100%;background:#000;overflow:hidden}canvas{display:block}</style><canvas id=c></canvas><script>var cv=document.getElementById('c'),x=cv.getContext('2d'),W=cv.width=innerWidth,H=cv.height=innerHeight,S=[];for(var i=0;i<220;i++)S.push({x:(Math.random()-.5)*W,y:(Math.random()-.5)*H,z:Math.random()*W});function loop(){x.fillStyle='rgba(0,0,0,.35)';x.fillRect(0,0,W,H);for(var i=0;i<S.length;i++){var s=S[i];s.z-=6;if(s.z<1){s.z=W;s.x=(Math.random()-.5)*W;s.y=(Math.random()-.5)*H}var k=128/s.z,px=s.x*k+W/2,py=s.y*k+H/2,r=(1-s.z/W)*2.5;x.fillStyle='#fff';x.beginPath();x.arc(px,py,r,0,7);x.fill()}requestAnimationFrame(loop)}loop();</script>`,
  },
  {
    id: 'pomodoro', cat: 'tool', level: 'basic', badge: 'JS',
    title: { en: 'Pomodoro timer', zh: '番茄钟' },
    scene: { en: 'Hand the team a "double-click and use" tool — lighter than installing an app.', zh: '给团队发一个「双击就能用」的小工具，比装 App 更轻。' },
    prompt: '用单个 HTML 文件做一个极简番茄钟：25 分钟倒计时，开始 / 暂停 / 重置按钮，结束时标题栏文字闪烁提醒。深色墨金配色、大字号，双击打开即用。',
    demo: `<!doctype html><meta charset=utf-8><style>html,body{margin:0;height:100%;display:grid;place-items:center;background:#1c1a17;color:#f6f3ec;font-family:system-ui}.t{font-size:52px;font-variant-numeric:tabular-nums}button{margin:4px;padding:8px 16px;border:1px solid #8a682c;background:transparent;color:#c9a35c;border-radius:999px;cursor:pointer}</style><div style="text-align:center"><div class=t id=d>25:00</div><div><button onclick=st()>开始</button><button onclick=rs()>重置</button></div></div><script>var s=1500,r=null;function fmt(){var m=Math.floor(s/60),c=s%60;document.getElementById('d').textContent=(m<10?'0':'')+m+':'+(c<10?'0':'')+c}function st(){if(r)return;r=setInterval(function(){if(s>0){s--;fmt()}else{clearInterval(r);r=null}},1000)}function rs(){clearInterval(r);r=null;s=1500;fmt()}fmt();</script>`,
  },
  {
    id: 'palette', cat: 'tool', level: 'basic', badge: 'JS',
    title: { en: 'Palette generator', zh: '配色生成器' },
    scene: { en: 'Spin up a few palettes for the room to vote on — one webpage is enough.', zh: '开会时快速给几组配色让大家投票 —— 一个网页就够。' },
    prompt: '用单个 HTML 文件做一个「配色生成器」：整屏五个色块，按空格键换一组随机配色，点击色块复制其十六进制色值。适合设计 / 前端快速取色，双击打开即用。',
    demo: `<!doctype html><meta charset=utf-8><style>html,body{margin:0;height:100%;font-family:system-ui}#w{display:flex;height:100%}.c{flex:1;display:flex;align-items:flex-end;justify-content:center;color:#fff;cursor:pointer;padding-bottom:24px;font-size:13px;text-shadow:0 1px 4px rgba(0,0,0,.4)}button{position:fixed;top:12px;left:50%;transform:translateX(-50%);padding:8px 16px;border:0;border-radius:999px;background:#1c1a17;color:#fff;cursor:pointer;z-index:2}</style><button onclick=gen()>换一组 →</button><div id=w></div><script>function rc(){var s=Math.floor(Math.random()*16777215).toString(16);while(s.length<6)s='0'+s;return'#'+s}function gen(){var w=document.getElementById('w');w.innerHTML='';for(var i=0;i<5;i++){var c=rc(),dv=document.createElement('div');dv.className='c';dv.style.background=c;dv.textContent=c;dv.onclick=function(){try{navigator.clipboard.writeText(this.textContent)}catch(e){}};w.appendChild(dv)}}onkeydown=function(e){if(e.code=='Space'){e.preventDefault();gen()}};gen();</script>`,
  },

  /* ---- flywheel ① 数据会说话 (SheetJS + Chart.js) ---- */
  {
    id: 'excel-chart', cat: 'chart', level: 'pro', badge: 'Chart.js', approx: true,
    title: { en: 'Excel → interactive chart', zh: 'Excel 转交互图表' },
    scene: { en: 'Data speaks: SheetJS parses, Chart.js renders — a static report becomes a live chart in seconds.', zh: '数据会说话：SheetJS 负责解析、Chart.js 负责渲染 —— 静态报表秒变动态交互图。' },
    prompt: '用单个 HTML + SheetJS + Chart.js 做一个「Excel 转图表」工具：拖入一个 Excel/CSV，自动读取第一列做 X 轴、第二列做数值，渲染成一张交互折线图（可切换柱状）。纯前端、双击 .html 即用，数据不上传服务器。',
    demo: `<!doctype html><meta charset=utf-8><style>html,body{margin:0;height:100%;background:#fbfaf6;font-family:system-ui}canvas{display:block}</style><canvas id=c></canvas><script>var cv=document.getElementById('c'),x=cv.getContext('2d'),W=cv.width=innerWidth,H=cv.height=innerHeight,d=[20,45,38,60,72,55,88],t=0,pad=28;function loop(){x.clearRect(0,0,W,H);t=Math.min(1,t+0.02);var n=d.length,pw=(W-pad*2)/(n-1);x.strokeStyle='#e2ddd0';for(var g=0;g<=4;g++){var gy=pad+(H-pad*2)*g/4;x.beginPath();x.moveTo(pad,gy);x.lineTo(W-pad,gy);x.stroke()}x.beginPath();x.lineWidth=2.5;x.strokeStyle='#2f6fb0';for(var i=0;i<n;i++){var px=pad+i*pw,py=H-pad-(d[i]/100)*(H-pad*2)*t;if(i)x.lineTo(px,py);else x.moveTo(px,py)}x.stroke();for(var i=0;i<n;i++){var px=pad+i*pw,py=H-pad-(d[i]/100)*(H-pad*2)*t;x.fillStyle='#2f6fb0';x.beginPath();x.arc(px,py,3.5,0,7);x.fill()}if(t<1)requestAnimationFrame(loop)}loop();</script>`,
  },
  {
    id: 'gauge', cat: 'chart', level: 'basic', badge: 'SVG',
    title: { en: 'KPI progress ring', zh: 'KPI 环形进度' },
    scene: { en: 'A completion rate that animates in beats a bare "73%".', zh: 'OKR / 目标完成率，一个会动的环形图比一句「73%」更有说服力。' },
    prompt: '用单个 HTML + Chart.js（或纯 SVG）做一个 KPI 环形进度仪表：中间显示百分比，环随数值动画填充，蓝色系。给我改一个变量就能换数值的单文件代码。',
    demo: `<!doctype html><meta charset=utf-8><style>html,body{margin:0;height:100%;display:grid;place-items:center;background:#fbfaf6;font-family:system-ui}text{font:700 34px system-ui;fill:#2f6fb0}circle{fill:none;stroke-width:18}</style><svg width=200 height=200 viewBox="0 0 200 200"><circle cx=100 cy=100 r=80 stroke="#e2ddd0"/><circle id=p cx=100 cy=100 r=80 stroke="#2f6fb0" stroke-linecap=round transform="rotate(-90 100 100)"/><text x=100 y=112 text-anchor=middle>73%</text></svg><script>var p=document.getElementById('p'),L=2*Math.PI*80;p.style.strokeDasharray=L;p.style.strokeDashoffset=L;requestAnimationFrame(function(){p.style.transition='stroke-dashoffset 1.2s ease';p.style.strokeDashoffset=L*(1-0.73)});</script>`,
  },

  /* ---- flywheel ② 交互直觉化 (原生拖拽) ---- */
  {
    id: 'kanban', cat: 'drag', level: 'pro', badge: '原生拖拽',
    title: { en: 'Drag-and-drop Kanban', zh: '拖拽看板' },
    scene: { en: 'Interaction back to intuition — a working Kanban in a few dozen lines, zero libraries.', zh: '交互回归直觉 —— 零依赖的原生拖拽，几十行就能做一个能拖的看板。' },
    prompt: '用单个 HTML + 原生 HTML5 拖拽（draggable + dragstart/drop，不用任何库）做一个三列看板：待办 / 进行中 / 完成，卡片可在列间拖动。风格简洁、圆角卡片，双击 .html 即用。',
    demo: `<!doctype html><meta charset=utf-8><style>html,body{margin:0;height:100%;background:#fbfaf6;font-family:system-ui;padding:12px;box-sizing:border-box}.b{display:flex;gap:10px;height:100%}.col{flex:1;background:#efe9dd;border-radius:10px;padding:8px}.col h4{margin:4px 6px;font-size:13px;color:#8a682c}.card{background:#fff;border:1px solid #e2ddd0;border-radius:8px;padding:8px;margin:6px 0;font-size:13px;cursor:grab}.card.drag{opacity:.4}.col.over{outline:2px dashed #2b8a8a}</style><div class=b id=b></div><script>var data={'待办':['整理需求','联系客户'],'进行中':['做原型'],'完成':['立项']},b=document.getElementById('b'),dragEl=null;function render(){b.innerHTML='';for(var k in data){var col=document.createElement('div');col.className='col';col.innerHTML='<h4>'+k+'</h4>';data[k].forEach(function(txt){var c=document.createElement('div');c.className='card';c.draggable=true;c.textContent=txt;c.ondragstart=function(){dragEl=this;this.classList.add('drag')};c.ondragend=function(){this.classList.remove('drag')};col.appendChild(c)});col.ondragover=function(e){e.preventDefault();this.classList.add('over')};col.ondragleave=function(){this.classList.remove('over')};col.ondrop=function(e){e.preventDefault();this.classList.remove('over');if(dragEl)this.appendChild(dragEl)};b.appendChild(col)}}render();</script>`,
  },
  {
    id: 'sortlist', cat: 'drag', level: 'pro', badge: '原生拖拽',
    title: { en: 'Drag to reorder', zh: '拖拽排序清单' },
    scene: { en: 'Prioritize / reorder steps — dragging beats up-down arrows.', zh: '排优先级、调流程步骤 —— 拖着排比点上下箭头快得多。' },
    prompt: '用单个 HTML + 原生拖拽做一个可拖拽排序的清单：条目上下拖动即可重新排序，拖动时半透明。纯前端、带注释，双击 .html 即用。',
    demo: `<!doctype html><meta charset=utf-8><style>html,body{margin:0;height:100%;background:#fbfaf6;font-family:system-ui;display:grid;place-items:center}ul{list-style:none;padding:0;width:240px}li{background:#fff;border:1px solid #e2ddd0;border-radius:8px;padding:10px 12px;margin:6px 0;cursor:grab;font-size:14px}li.drag{opacity:.4}</style><ul id=l></ul><script>var items=['① 需求','② 设计','③ 开发','④ 测试','⑤ 上线'],l=document.getElementById('l'),dr=null;items.forEach(function(txt){var li=document.createElement('li');li.textContent=txt;li.draggable=true;li.ondragstart=function(){dr=this;this.classList.add('drag')};li.ondragend=function(){this.classList.remove('drag')};li.ondragover=function(e){e.preventDefault();var rc=this.getBoundingClientRect();if(e.clientY<rc.top+rc.height/2)l.insertBefore(dr,this);else l.insertBefore(dr,this.nextSibling)};l.appendChild(li)});</script>`,
  },
  {
    id: 'dropzone', cat: 'drag', level: 'pro', badge: '原生拖拽',
    title: { en: 'Drag-drop upload zone', zh: '拖拽上传区' },
    scene: { en: 'The first step of any batch-file tool — a draggable dashed box lifts the whole experience.', zh: '批量处理文件的第一步，一个能拖的虚线框，体验立刻上一个台阶。' },
    prompt: '用单个 HTML + 原生拖拽做一个文件拖拽上传区：把文件拖进虚线框，列出文件名（用 FileReader，可扩展成读取内容），拖入时高亮。纯前端不上传，双击 .html 即用。',
    demo: `<!doctype html><meta charset=utf-8><style>html,body{margin:0;height:100%;display:grid;place-items:center;background:#fbfaf6;font-family:system-ui}.z{width:70%;max-width:340px;padding:34px;border:2px dashed #c9a35c;border-radius:14px;text-align:center;color:#8a682c;background:#fffdf8;transition:.2s}.z.over{background:#eef4fb;border-color:#2b8a8a;color:#2b8a8a}ul{text-align:left;font-size:13px;color:#26231f;margin-top:12px}</style><div class=z id=z>把文件拖到这里 ⬇<ul id=o></ul></div><script>var z=document.getElementById('z'),o=document.getElementById('o');z.ondragover=function(e){e.preventDefault();z.classList.add('over')};z.ondragleave=function(){z.classList.remove('over')};z.ondrop=function(e){e.preventDefault();z.classList.remove('over');o.innerHTML='';var f=e.dataTransfer.files;for(var i=0;i<f.length;i++){var li=document.createElement('li');li.textContent='✓ '+f[i].name;o.appendChild(li)}};</script>`,
  },

  /* ---- flywheel ③ 空间新叙事 (Three.js) ---- */
  {
    id: 'globe', cat: '3d', level: 'expert', badge: 'Three.js', approx: true,
    title: { en: 'Spinning particle globe', zh: '旋转粒子地球' },
    scene: { en: 'A new spatial narrative — the opening shot of a data big-screen, a 3D globe built in code.', zh: '空间新叙事 —— 数字沙盘 / 大屏的开场，用代码搭一个会转的 3D 球。' },
    prompt: '用单个 HTML + Three.js 做一个自转的「粒子地球」：几百个点均匀分布在球面上缓慢旋转，深空背景、青色点，鼠标可拖动旋转。双击 .html 即看。',
    demo: `<!doctype html><meta charset=utf-8><style>html,body{margin:0;height:100%;background:#070a16;overflow:hidden}canvas{display:block}</style><canvas id=c></canvas><script>var cv=document.getElementById('c'),x=cv.getContext('2d'),W=cv.width=innerWidth,H=cv.height=innerHeight,pts=[],N=420,R=Math.min(W,H)*0.32,a=0;for(var i=0;i<N;i++){var th=Math.acos(2*Math.random()-1),ph=2*Math.PI*Math.random();pts.push([Math.sin(th)*Math.cos(ph),Math.sin(th)*Math.sin(ph),Math.cos(th)])}function loop(){x.clearRect(0,0,W,H);a+=0.006;for(var i=0;i<N;i++){var p=pts[i],X=p[0]*Math.cos(a)-p[2]*Math.sin(a),Z=p[0]*Math.sin(a)+p[2]*Math.cos(a),Y=p[1],f=(Z+1.6)/2.6;x.fillStyle='rgba(90,209,255,'+(0.25+0.75*(Z+1)/2)+')';x.beginPath();x.arc(W/2+X*R,H/2+Y*R,f*1.7,0,7);x.fill()}requestAnimationFrame(loop)}loop();</script>`,
  },

  /* ---- workshop crowd-pleasers ---- */
  {
    id: 'typewriter', cat: 'effect', level: 'basic', badge: 'JS',
    title: { en: 'Typewriter headline', zh: '打字机标题' },
    scene: { en: 'An opening / big-screen title — typed out grabs attention more than static text.', zh: '开场 / 大屏标题，逐字打出比直接显示更抓注意力。' },
    prompt: '用单个 HTML + JS 做一个打字机文字效果：一句话逐字打出、光标闪烁，打完停顿再换下一句循环。深色背景、等宽字体，适合做开场标题，双击 .html 即用。',
    demo: `<!doctype html><meta charset=utf-8><style>html,body{margin:0;height:100%;display:grid;place-items:center;background:#1c1a17;color:#f6f3ec;font-family:'JetBrains Mono',monospace}.t{font-size:24px}.cur{color:#c9a35c}</style><div class=t><span id=o></span><span class=cur>▌</span></div><script>var txt=['用 AI 做看得见的东西 ✦','一句提示词，一个小工具','双击打开，即刻演示'],li=0,ci=0,o=document.getElementById('o');function tick(){var s=txt[li];if(ci<=s.length){o.textContent=s.slice(0,ci++);setTimeout(tick,90)}else{ci=0;li=(li+1)%txt.length;setTimeout(tick,1200)}}tick();</script>`,
  },
  {
    id: 'countdown', cat: 'tool', level: 'basic', badge: 'JS',
    title: { en: 'Event countdown', zh: '活动倒计时' },
    scene: { en: 'A launch / kickoff ambiance widget — put it on the big screen for a sense of occasion.', zh: '发布会 / 开营前的氛围组件，挂在大屏上就很有仪式感。' },
    prompt: '用单个 HTML 做一个活动倒计时：大字号显示距某个日期还有几天几时几分几秒，深色墨金配色。日期可在代码里改，双击即用。',
    demo: `<!doctype html><meta charset=utf-8><style>html,body{margin:0;height:100%;display:grid;place-items:center;background:#1c1a17;color:#f6f3ec;font-family:system-ui}.w{text-align:center}.u{display:inline-block;margin:0 8px}.u b{font-size:40px;color:#c9a35c;font-variant-numeric:tabular-nums}.u span{display:block;font-size:12px;opacity:.6}</style><div class=w><div style="margin-bottom:12px;opacity:.7">距 Workshop 还有</div><div id=d></div></div><script>var target=new Date('2026-07-28T09:00:00').getTime();function upd(){var t=Math.max(0,target-Date.now()),dd=Math.floor(t/864e5),h=Math.floor(t/36e5)%24,m=Math.floor(t/6e4)%60,s=Math.floor(t/1e3)%60;document.getElementById('d').innerHTML='<div class=u><b>'+dd+'</b><span>天</span></div><div class=u><b>'+h+'</b><span>时</span></div><div class=u><b>'+m+'</b><span>分</span></div><div class=u><b>'+s+'</b><span>秒</span></div>'}upd();setInterval(upd,1000);</script>`,
  },
  {
    id: 'wheel', cat: 'tool', level: 'pro', badge: 'Canvas',
    title: { en: 'Lucky-draw wheel', zh: '抽奖转盘' },
    scene: { en: 'Annual party / livestream draws — a web wheel is easier to edit and cast than a mini-app.', zh: '年会 / 直播 / 团建抽奖，一个网页转盘比小程序更好改、更好投屏。' },
    prompt: '用单个 HTML + Canvas 做一个抽奖转盘：几个奖项扇形，点「转」按钮转盘加速再减速停下。纯前端、可改奖项文字，双击 .html 即用。',
    demo: `<!doctype html><meta charset=utf-8><style>html,body{margin:0;height:100%;display:grid;place-items:center;background:#fbfaf6;font-family:system-ui}button{position:fixed;bottom:18px;left:50%;transform:translateX(-50%);padding:8px 22px;border:0;border-radius:999px;background:#1c1a17;color:#fff;cursor:pointer}</style><canvas id=c width=250 height=250></canvas><button onclick=spin()>转！</button><script>var cv=document.getElementById('c'),x=cv.getContext('2d'),items=['一等奖','谢谢','二等奖','再来一次','三等奖','鼓励奖'],cols=['#2f6fb0','#e2ddd0','#c2703c','#e2ddd0','#5c8a3a','#e2ddd0'],ang=0,va=0,sp=0;function draw(){x.clearRect(0,0,250,250);var n=items.length,st=2*Math.PI/n;for(var i=0;i<n;i++){x.beginPath();x.moveTo(125,125);x.arc(125,125,115,ang+i*st,ang+(i+1)*st);x.fillStyle=cols[i];x.fill();x.save();x.translate(125,125);x.rotate(ang+i*st+st/2);x.fillStyle=cols[i]=='#e2ddd0'?'#26231f':'#fff';x.font='12px system-ui';x.textAlign='right';x.fillText(items[i],105,4);x.restore()}x.beginPath();x.moveTo(125,2);x.lineTo(117,18);x.lineTo(133,18);x.fillStyle='#1c1a17';x.fill()}function spin(){if(sp)return;sp=1;va=0.3+Math.random()*0.2}function loop(){if(sp){ang+=va;va*=0.985;if(va<0.002)sp=0}draw();requestAnimationFrame(loop)}loop();</script>`,
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
  const [level, setLevel] = useState<Level | 'all'>('all');
  const [openId, setOpenId] = useState<string | null>(null);   // which card's demo is expanded
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [spotId, setSpotId] = useState<string | null>(null);   // 🎲 spotlight

  const shown = useMemo(
    () => RECIPES.filter((r) => (cat === 'all' || r.cat === cat) && (level === 'all' || r.level === level)),
    [cat, level],
  );
  const spot = spotId ? RECIPES.find((r) => r.id === spotId) : null;

  const rollDice = () => {
    const pool = shown.length ? shown : RECIPES;
    const pick = pool[Math.floor(Math.random() * pool.length)];
    setSpotId(pick.id);
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const copyText = (key: string, text: string) => {
    navigator.clipboard?.writeText(text).then(() => {
      setCopiedKey(key);
      window.setTimeout(() => setCopiedKey((c) => (c === key ? null : c)), 1600);
    }).catch(() => {});
  };

  const LANGS: { code: Lang; label: string }[] = [{ code: 'en', label: 'EN' }, { code: 'zh', label: '简' }, { code: 'zhHant', label: '繁' }];

  const badgeColor: Record<Cat, string> = {
    chart: '#2f6fb0', sheet: '#5c8a3a', drag: '#2b8a8a', effect: '#c2703c', '3d': '#7a5cab', tool: '#8a682c',
  };

  const LevelTag: React.FC<{ lv: Level }> = ({ lv }) => (
    <span className="rounded-full border px-1.5 py-0.5 font-mono text-[9.5px] uppercase tracking-wider" style={{ color: LEVEL_META[lv].color, borderColor: `${LEVEL_META[lv].color}55` }}>
      {t(LEVEL_META[lv].label)}
    </span>
  );

  const PromptBlock: React.FC<{ r: Recipe }> = ({ r }) => (
    <div className="mt-3 overflow-hidden rounded-xl border border-ink/12 bg-ink/[0.03]">
      <div className="flex items-center justify-between gap-2 border-b border-ink/10 px-3 py-1.5">
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-gold">{t({ en: 'Prompt (paste to Copilot Chat)', zh: '提示词（粘进 Copilot Chat）' })}</span>
        <button onClick={() => copyText(`${r.id}:prompt`, r.prompt)} className="rounded-md border border-ink/15 bg-paper px-2 py-0.5 font-mono text-[10.5px] text-ink/60 transition-colors hover:border-gold/50 hover:text-gold">
          {copiedKey === `${r.id}:prompt` ? t({ en: 'Copied ✓', zh: '已复制 ✓' }) : t({ en: 'Copy', zh: '复制' })}
        </button>
      </div>
      <p className="whitespace-pre-line px-3 py-2.5 text-[12.5px] leading-relaxed text-ink/70">{r.prompt}</p>
    </div>
  );

  const DataBlock: React.FC<{ r: Recipe }> = ({ r }) => r.dataTemplate ? (
    <div className="mt-2 overflow-hidden rounded-xl border border-accent/25 bg-accent/[0.04]">
      <div className="flex items-center justify-between gap-2 border-b border-accent/20 px-3 py-1.5">
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-accent">{t({ en: 'Data template (paste with prompt)', zh: '数据模板（连同提示词一起粘）' })}</span>
        <button onClick={() => copyText(`${r.id}:data`, r.dataTemplate!)} className="rounded-md border border-ink/15 bg-paper px-2 py-0.5 font-mono text-[10.5px] text-ink/60 transition-colors hover:border-accent/50 hover:text-accent">
          {copiedKey === `${r.id}:data` ? t({ en: 'Copied ✓', zh: '已复制 ✓' }) : t({ en: 'Copy', zh: '复制' })}
        </button>
      </div>
      <pre className="overflow-x-auto whitespace-pre-wrap px-3 py-2.5 font-mono text-[11.5px] leading-relaxed text-ink/70">{r.dataTemplate}</pre>
    </div>
  ) : null;

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
            en: 'For HP colleagues getting into AI — organised by stage (Beginner / Proficient / Advanced) so everyone finds something they can build today. One thing you can see and click beats an hour on how models work. Each recipe is a scenario + a copyable prompt (some with a data template) + a live, self-contained demo. The flagship walkthrough is the staff roster: hand Copilot Chat a template + prompt, save the reply as .html, double-click — a real tool.',
            zh: '为对 AI 感兴趣的惠普同事准备 —— 按阶段分（初学者 / 精通 / 高阶），每个人都能找到今天就能上手的例子。一个能看能点的东西，胜过讲一小时模型原理。每张卡 = 业务场景 + 可复制提示词（部分带数据模板）+ 实时自包含效果。旗舰演示是「排班系统」：把数据模板 + 提示词交给 Copilot Chat，回复存成 .html，双击打开 —— 就是一个真能用的工具。',
          })}
        </p>

        {/* Copilot Chat workflow — the 4 steps 大雷 demoes live */}
        <div className="mt-7 overflow-hidden rounded-3xl border border-ink/10 bg-surface/40">
          <div className="border-b border-ink/10 px-5 py-3 sm:px-6">
            <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-gold">{t({ en: 'From prompt to a working webpage · 4 steps in Copilot Chat', zh: '从提示词到一个能用的网页 · Copilot Chat 四步走' })}</span>
          </div>
          <ol className="grid gap-px bg-ink/10 sm:grid-cols-4">
            {[
              { n: '1', t: { en: 'Copy template + prompt', zh: '复制数据模板 + 提示词' }, d: { en: 'Grab a recipe’s prompt (and its data template, if any) and paste both into Copilot Chat.', zh: '拿一张卡的提示词（有数据模板就一并拿上），一起粘进 Copilot Chat。' } },
              { n: '2', t: { en: 'Copilot writes the code', zh: 'Copilot 生成代码' }, d: { en: 'It replies with one self-contained HTML file. Ask it to “put everything in one .html”.', zh: '它回一段自包含的 HTML 代码。可补一句「所有代码放进一个 .html」。' } },
              { n: '3', t: { en: 'Save as a .html file', zh: '另存为 .html 文件' }, d: { en: 'Copy the code into Notepad / VS Code, save as e.g. paiban.html (not .txt).', zh: '把代码贴进记事本 / VS Code，另存为 例如 paiban.html（别存成 .txt）。' } },
              { n: '4', t: { en: 'Double-click to open', zh: '双击打开即用' }, d: { en: 'Open the file in your browser — your tool runs locally, data never leaves the machine.', zh: '用浏览器打开文件 —— 工具跑在本地，数据不出本机。' } },
            ].map((s) => (
              <li key={s.n} className="bg-surface/40 px-5 py-4">
                <span className="grid h-6 w-6 place-items-center rounded-full bg-ink font-mono text-xs font-semibold text-paper">{s.n}</span>
                <h3 className="mt-2.5 text-sm font-semibold text-ink">{t(s.t)}</h3>
                <p className="mt-1 text-[12px] leading-relaxed text-ink/55">{t(s.d)}</p>
              </li>
            ))}
          </ol>
        </div>

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
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-white" style={{ backgroundColor: badgeColor[spot.cat] }}>{spot.badge}</span>
                  <LevelTag lv={spot.level} />
                  <h2 className="font-display text-2xl font-semibold tracking-tight">{t(spot.title)}</h2>
                </div>
                <p className="mt-2 text-[14px] leading-relaxed text-ink/70">{t(spot.scene)}</p>
                <PromptBlock r={spot} />
                <DataBlock r={spot} />
                <button onClick={rollDice} className="mt-4 inline-flex items-center gap-2 rounded-full border border-ink/15 px-4 py-2 font-mono text-[11px] text-ink/65 transition-colors hover:border-gold/50 hover:text-gold">🎲 {t({ en: 'Another one', zh: '再来一个' })}</button>
              </div>
            </div>
          </section>
        )}

        {/* level filter — by stage: Beginner / Proficient / Advanced */}
        <div className="mt-8">
          <span className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-ink/40">{t({ en: 'By stage', zh: '按阶段' })}</span>
          <div className="mt-2 flex flex-wrap gap-2">
            {LEVELS.map((l) => (
              <button key={l.key} onClick={() => setLevel(l.key)} title={t(l.hint)} className={`rounded-full border px-3.5 py-1.5 font-mono text-[11px] transition-colors ${level === l.key ? 'border-ink bg-ink text-paper' : 'border-ink/15 text-ink/60 hover:border-ink/40 hover:text-ink'}`}>
                {t(l.label)}
              </button>
            ))}
          </div>
        </div>

        {/* category filter */}
        <div className="mt-4">
          <span className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-ink/40">{t({ en: 'By tech', zh: '按技术' })}</span>
          <div className="mt-2 flex flex-wrap gap-2">
            {CATS.map((c) => (
              <button key={c.key} onClick={() => setCat(c.key)} className={`rounded-full border px-3.5 py-1.5 font-mono text-[11px] transition-colors ${cat === c.key ? 'border-ink bg-ink text-paper' : 'border-ink/15 text-ink/60 hover:border-ink/40 hover:text-ink'}`}>
                {t(c.label)}
              </button>
            ))}
          </div>
        </div>

        {shown.length === 0 && (
          <p className="mt-6 font-mono text-xs text-ink/45">{t({ en: 'No recipe matches this combination — try relaxing a filter.', zh: '这个组合下暂时没有案例 —— 放宽一个筛选试试。' })}</p>
        )}

        {/* grid */}
        <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {shown.map((r) => (
            <article key={r.id} className="flex flex-col overflow-hidden rounded-2xl border border-ink/10 bg-surface/40">
              <div className="flex items-start justify-between gap-2 p-4 pb-0">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="rounded-full px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-white" style={{ backgroundColor: badgeColor[r.cat] }}>{r.badge}</span>
                  <LevelTag lv={r.level} />
                  <h3 className="w-full font-display text-lg font-semibold tracking-tight">{t(r.title)}</h3>
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
                <DataBlock r={r} />
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
          {t({ en: 'Curated by 大雷 for the 2026-07-28 workshop. Every scenario, prompt and demo here is original. Demos run fully in your browser (sandboxed, no external calls).', zh: '大雷为 2026-07-28 workshop 整理。此处场景、提示词与效果均为原创。所有效果全程在你浏览器本地运行（沙箱隔离、无外部调用）。' })}
        </p>
      </main>
    </div>
  );
};

export default AIHtmlLab;
