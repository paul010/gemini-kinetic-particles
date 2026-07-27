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
  dataFile?: DataFile;   // downloadable sample .csv so attendees can try immediately
  teach?: T;        // 讲解要点 — the one line 大雷 says out loud while demoing
  approx?: boolean; // demo is a canvas approximation of a library-based output
}

/** A ready-to-download sample dataset. Attendees click once and get a real .csv
 *  on disk — no copy-pasting into Notepad, no "save as .txt" mistakes.
 *
 *  `name` is deliberately ASCII: a non-ASCII <a download> filename makes Chromium
 *  drop the name AND the extension, handing the attendee a file called "download".
 *  The Chinese context lives in `desc` instead, right above the filename. */
interface DataFile { name: string; desc: T; csv: string }

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
    dataFile: { name: 'roster-staff-list.csv', desc: { en: '6 staff · role + which shifts they can work', zh: '6 位员工 · 岗位与可上的班次' }, csv: '姓名,岗位,可上班次,备注\n王芳,店长,早班/中班,每周三固定休\n李明,收银,早班/中班/晚班,\n张伟,理货,中班/晚班,不排早班\n赵丽,收银,早班/中班,周末必须在岗\n陈杰,理货,早班/晚班,\n周敏,收银,中班/晚班,新员工需与老员工同班' },
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
    dataFile: { name: 'expense-claims.csv', desc: { en: '8 claim rows — 3 of them break a rule', zh: '报销明细 8 条 · 其中 3 条会被判违规' }, csv: '类别,报销人,金额,是否有发票,日期\n交通,张伟,86,有,2026-07-03\n餐费,李明,260,有,2026-07-05\n办公用品,王芳,45,有,2026-07-08\n餐费,赵丽,180,无,2026-07-11\n差旅,陈杰,1200,有,2026-07-14\n交通,周敏,42,无,2026-07-16\n餐费,吴强,320,有,2026-07-19\n办公用品,郑洁,88,有,2026-07-22' },
    demo: `<!doctype html><meta charset=utf-8><style>html,body{margin:0;font-family:system-ui;background:#fbfaf6;color:#26231f;padding:10px;box-sizing:border-box;font-size:13px}h3{margin:2px 0 8px;font-size:15px}table{border-collapse:collapse;width:100%;font-size:12px}th,td{border:1px solid #e2ddd0;padding:6px 8px;text-align:left}th{background:#efe9dd}tr.bad{background:#fdecea}.tag{color:#c0392b;font-weight:600}.ok{color:#5c8a3a}</style><h3>🧾 报销单核对器 · 自动标出异常</h3><table id=t></table><div style="margin-top:8px;font-size:11px;color:#6b655c">规则：单笔餐费 ＞￥200 或 缺发票 → 标红提示</div><script>var rows=[['交通','张伟',86,true],['餐费','李明',260,true],['办公用品','王芳',45,true],['餐费','赵丽',180,false],['差旅','陈杰',1200,true]];var h='<tr><th>类别</th><th>报销人</th><th>金额</th><th>发票</th><th>核对</th></tr>';for(var i=0;i<rows.length;i++){var r=rows[i],bad=(r[0]=='餐费'&&r[2]>200)||!r[3],msg=!r[3]?'缺发票':(r[0]=='餐费'&&r[2]>200?'餐费超标':'');h+='<tr class="'+(bad?'bad':'')+'"><td>'+r[0]+'</td><td>'+r[1]+'</td><td>￥'+r[2]+'</td><td>'+(r[3]?'✓':'✗')+'</td><td class="'+(bad?'tag':'ok')+'">'+(bad?'⚠ '+msg:'✓ 通过')+'</td></tr>'}document.getElementById('t').innerHTML=h;</script>`,
  },
  {
    id: 'skills-heatmap', cat: 'chart', level: 'expert', badge: 'Canvas',
    title: { en: 'Team skills heatmap', zh: '团队技能矩阵热力图' },
    scene: { en: 'For L&D: a people × skills grid where color depth = proficiency. The whole team’s capability gaps jump out in one glance — teaches gradient/heatmap coloring.', zh: '给培训/团队负责人：员工 × 技能的方格，颜色越深越熟练。一眼看出整队的能力缺口 —— 顺带学会热力图渐变上色。' },
    prompt: '用【单个 HTML 文件】做一个「团队技能矩阵热力图」：行是员工、列是技能，每格是 1–5 的熟练度，用颜色深浅表示（越熟练颜色越深），格子里显示数值。下方一句说明「深=熟练、浅=需培训」。纯前端、不引入外部库，代码存成 .html 双击即用。用我提供的示例数据。',
    dataFile: { name: 'team-skills-matrix.csv', desc: { en: '6 people × 5 skills, scored 1–5', zh: '6 人 × 5 项技能 · 1–5 分' }, csv: '姓名,Excel,Copilot,数据分析,PPT,自动化\n王芳,5,4,3,5,2\n李明,3,5,4,3,4\n张伟,4,2,5,4,5\n赵丽,2,3,2,5,1\n陈杰,3,4,4,2,3\n周敏,4,1,2,4,2' },
    demo: `<!doctype html><meta charset=utf-8><style>html,body{margin:0;font-family:system-ui;background:#fbfaf6;color:#26231f;padding:10px;box-sizing:border-box;font-size:12px}h3{margin:2px 0 10px;font-size:15px}table{border-collapse:collapse}td,th{padding:0}th{color:#6b655c;font-weight:600;padding:4px 6px;font-size:11px}th.rot{writing-mode:vertical-rl;transform:rotate(180deg);text-align:left;height:56px}td.nm{background:#f7f2e8;text-align:left;padding:6px 8px;white-space:nowrap;font-weight:600;border:1px solid #e2ddd0}td.cell{width:38px;height:32px;text-align:center;color:#fff;font-weight:700;border:1px solid #fff}</style><h3>🔥 团队技能矩阵热力图（1–5 熟练度）</h3><table id=t></table><div style="margin-top:8px;font-size:11px;color:#6b655c">深 = 熟练 · 浅 = 需培训 —— 一眼看出团队能力缺口</div><script>var people=['王芳','李明','张伟','赵丽'],skills=['Excel','Copilot','数据分析','PPT','自动化'],data=[[5,4,3,5,2],[3,5,4,3,4],[4,2,5,4,5],[2,3,2,5,1]];function col(v){var a=(v-1)/4,r=Math.round(224-a*(224-31)),g=Math.round(232-a*(232-111)),b=Math.round(214-a*(214-176));return'rgb('+r+','+g+','+b+')'}var h='<tr><th></th>';for(var s=0;s<skills.length;s++)h+='<th class=rot>'+skills[s]+'</th>';h+='</tr>';for(var i=0;i<people.length;i++){h+='<tr><td class=nm>'+people[i]+'</td>';for(var s=0;s<skills.length;s++){var v=data[i][s];h+='<td class=cell style="background:'+col(v)+'">'+v+'</td>'}h+='</tr>'}document.getElementById('t').innerHTML=h;</script>`,
  },

  /* ---- HP 办公实战 · 第二批：可以直接拿去讲的真实场景 ---- */
  {
    id: 'todo-local', cat: 'tool', level: 'basic', badge: 'localStorage',
    title: { en: 'To-do that survives a refresh', zh: '关掉还在的待办清单' },
    scene: { en: 'The best second build: add / tick / delete items — and they are still there after you close the page. One sentence in the prompt ("keep it in localStorage") is what turns a toy into a tool.', zh: '最适合第二个练手：加一条、点一下打勾、点 × 删掉 —— 关掉网页再打开，清单还在。提示词里多一句「用 localStorage 存」，玩具就变成了工具。' },
    teach: { en: 'Demo it live: add an item, hit F5 — it survives. Then say "this is the whole difference between a demo and a tool."', zh: '现场演示：加一条 → 按 F5 刷新 → 还在。然后说一句「这就是玩具和工具的分界线」。' },
    prompt: '用【单个 HTML 文件】做一个「待办清单」小工具：输入框回车即可添加一条；点条目文字切换「已完成」（显示删除线）；每条右边有个 × 可删除；\n关键要求：所有数据用浏览器的 localStorage 保存，关掉网页再打开清单依然在。\n纯前端、不引入外部库、不连任何服务器，代码存成 .html 双击即用，配色简洁。',
    demo: `<!doctype html><meta charset=utf-8><style>html,body{margin:0;font-family:system-ui;background:#fbfaf6;color:#26231f;padding:12px;box-sizing:border-box;font-size:13px}h3{margin:0 0 8px;font-size:15px}.r{display:flex;gap:6px}input{flex:1;padding:8px;border:1px solid #ccc;border-radius:8px;font-size:13px}button{padding:8px 14px;border:0;border-radius:8px;background:#26231f;color:#fff;cursor:pointer;font-size:13px}ul{list-style:none;padding:0;margin:10px 0 0}li{display:flex;align-items:center;gap:8px;background:#fff;border:1px solid #e2ddd0;border-radius:8px;padding:7px 10px;margin:5px 0}li.done span{text-decoration:line-through;color:#9a948a}li span{flex:1;cursor:pointer}.x{color:#c0392b;cursor:pointer;font-size:15px;line-height:1}.t{margin-top:9px;font-size:11px;color:#6b655c}</style><h3>✅ 我的待办 · 关掉网页再打开也还在</h3><div class=r><input id=i placeholder="输入一条待办，回车添加"><button id=b>添加</button></div><ul id=l></ul><div class=t>数据存在浏览器本地（localStorage），不上传任何服务器</div><script>var KEY='dalei-todo-demo',mem=null;function load(){if(mem)return mem;try{mem=JSON.parse(localStorage.getItem(KEY))}catch(e){}if(!mem||!mem.length)mem=[{t:'整理周会纪要',d:true},{t:'核对本月报销单',d:false},{t:'准备 7·28 workshop',d:false}];return mem}function save(){try{localStorage.setItem(KEY,JSON.stringify(mem))}catch(e){}}function render(){var a=load(),l=document.getElementById('l');l.innerHTML='';a.forEach(function(it,k){var li=document.createElement('li');if(it.d)li.className='done';var s=document.createElement('span');s.textContent=(it.d?'☑ ':'☐ ')+it.t;s.onclick=function(){it.d=!it.d;save();render()};var x=document.createElement('b');x.className='x';x.textContent='×';x.onclick=function(){a.splice(k,1);save();render()};li.appendChild(s);li.appendChild(x);l.appendChild(li)})}function add(){var i=document.getElementById('i');if(!i.value.replace(/\\s/g,''))return;load().push({t:i.value,d:false});i.value='';save();render()}document.getElementById('b').onclick=add;document.getElementById('i').onkeydown=function(e){if(e.key=='Enter')add()};render();</script>`,
  },
  {
    id: 'wordcount', cat: 'tool', level: 'basic', badge: 'JS',
    title: { en: 'Copy length & read-aloud timer', zh: '文案字数 / 口播时长' },
    scene: { en: 'Paste an announcement or a script: character count, Chinese-character count, and how many minutes it takes to read aloud. Anyone who writes internal comms gets it instantly.', zh: '把公告、口播稿贴进去：总字符、中文字数、念出来大概几分钟。任何写内部通稿、录视频的人一秒就懂它有什么用。' },
    teach: { en: 'Paste your own slide notes on stage — the "minutes to read aloud" number is what makes the room laugh and lean in.', zh: '现场把自己的讲稿贴进去 —— 「口播约 X 分钟」这个数字最容易让全场笑出来并且记住。' },
    prompt: '用【单个 HTML 文件】做一个「文案字数统计器」：上方一个大文本框，下方实时显示四个数字卡片 —— 总字符数、不含空格字符数、中文字数、按每分钟 240 字估算的「口播时长（分钟）」。\n输入时数字实时变化，数字要大、标签要小。纯前端、不引入外部库，存成 .html 双击即用。',
    demo: `<!doctype html><meta charset=utf-8><style>html,body{margin:0;font-family:system-ui;background:#fbfaf6;color:#26231f;padding:12px;box-sizing:border-box;font-size:13px}h3{margin:0 0 8px;font-size:15px}textarea{width:100%;box-sizing:border-box;height:88px;padding:8px;border:1px solid #ccc;border-radius:8px;font-size:13px;font-family:inherit;resize:vertical;line-height:1.6}.g{display:grid;grid-template-columns:repeat(4,1fr);gap:7px;margin-top:10px}.k{background:#fff;border:1px solid #e2ddd0;border-radius:10px;padding:7px 4px;text-align:center}.k b{display:block;font-size:19px;color:#2f6fb0;font-variant-numeric:tabular-nums}.k span{font-size:10px;color:#6b655c}</style><h3>✍️ 文案字数统计 · 顺带算口播时长</h3><textarea id=a>把你的口播稿或部门公告贴进来，下面的数字会实时变化。写内部通稿、录视频前先过一遍，长度心里就有数了。</textarea><div class=g id=g></div><script>var a=document.getElementById('a');function upd(){var s=a.value,cn=(s.match(/[\\u4e00-\\u9fa5]/g)||[]).length,en=(s.match(/[a-zA-Z]+/g)||[]).length,all=s.length,ns=s.replace(/\\s/g,'').length,talk=Math.round((cn+en)/240*10)/10;document.getElementById('g').innerHTML='<div class=k><b>'+all+'</b><span>总字符</span></div><div class=k><b>'+ns+'</b><span>不含空格</span></div><div class=k><b>'+cn+'</b><span>中文字数</span></div><div class=k><b>'+talk+'</b><span>口播约 分钟</span></div>'}a.oninput=upd;upd();</script>`,
  },
  {
    id: 'group-draw', cat: 'tool', level: 'basic', badge: 'JS',
    title: { en: 'Random team splitter', zh: '培训随机分组器' },
    scene: { en: 'Paste the attendee list, pick how many groups, click — everyone is shuffled into balanced teams on screen. Beats reading names off a spreadsheet.', zh: '把参训名单贴进去、选几组、点一下 —— 大屏上直接分好队。比对着 Excel 念名字快得多，现场气氛也不一样。' },
    teach: { en: 'Use the actual room roster. Click twice so they see it reshuffles — that is what proves it is code, not a picture.', zh: '就用现场真实名单。连点两次让大家看到结果会变 —— 这一下就证明了「这是代码，不是一张图」。' },
    prompt: '用【单个 HTML 文件】做一个「随机分组器」：上方一个文本框粘贴人员名单（换行、逗号、顿号分隔都能识别），一个数字框填「分几组」，点按钮后把所有人随机打乱并尽量平均分配到各组，用卡片展示每组的组名和成员。\n再点一次按钮要能重新洗牌得到不同结果。纯前端、不引入外部库，存成 .html 双击即用，适合投屏。',
    dataFile: { name: 'training-attendees.csv', desc: { en: '12 attendees with departments', zh: '12 位参训学员 · 姓名与部门' }, csv: '姓名,部门\n王芳,市场\n李明,研发\n张伟,销售\n赵丽,人力\n陈杰,研发\n周敏,市场\n吴强,销售\n郑洁,财务\n孙浩,研发\n刘燕,人力\n黄涛,市场\n林静,财务' },
    demo: `<!doctype html><meta charset=utf-8><style>html,body{margin:0;font-family:system-ui;background:#fbfaf6;color:#26231f;padding:12px;box-sizing:border-box;font-size:13px}h3{margin:0 0 8px;font-size:15px}.r{display:flex;gap:6px;align-items:center}textarea{flex:1;box-sizing:border-box;height:46px;padding:7px;border:1px solid #ccc;border-radius:8px;font-size:12px;font-family:inherit;resize:vertical}input{width:44px;padding:7px;border:1px solid #ccc;border-radius:8px;font-size:13px;text-align:center}button{padding:8px 14px;border:0;border-radius:8px;background:#26231f;color:#fff;cursor:pointer;font-size:13px;white-space:nowrap}.g{display:grid;grid-template-columns:repeat(3,1fr);gap:7px;margin-top:10px}.c{background:#fff;border:1px solid #e2ddd0;border-radius:10px;padding:8px}.c h4{margin:0 0 5px;font-size:12px;color:#c2703c}.c div{font-size:12px;line-height:1.7}</style><h3>🎲 培训随机分组器</h3><div class=r><textarea id=n>王芳, 李明, 张伟, 赵丽, 陈杰, 周敏, 吴强, 郑洁, 孙浩</textarea><input id=k type=number value=3 min=1><button id=b>分组</button></div><div class=g id=g></div><script>function go(){var raw=document.getElementById('n').value.split(/[\\s,，、；;]+/),p=[];for(var i=0;i<raw.length;i++)if(raw[i])p.push(raw[i]);for(var i=p.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1)),t=p[i];p[i]=p[j];p[j]=t}var k=Math.max(1,Math.min(9,+document.getElementById('k').value||1)),gs=[];for(var i=0;i<k;i++)gs.push([]);for(var i=0;i<p.length;i++)gs[i%k].push(p[i]);document.getElementById('g').innerHTML=gs.map(function(g,i){return'<div class=c><h4>第 '+(i+1)+' 组 · '+g.length+' 人</h4><div>'+g.join('<br>')+'</div></div>'}).join('')}document.getElementById('b').onclick=go;go();</script>`,
  },
  {
    id: 'signature', cat: 'tool', level: 'basic', badge: 'JS',
    title: { en: 'Email signature builder', zh: '邮件签名生成器' },
    scene: { en: 'Fill in name / title / dept / phone — get a tidy signature block, live. A whole team can standardise their signature from one .html file.', zh: '填姓名、职位、部门、电话，右边实时生成一段排版整齐的签名。一个 .html 发给全组，整个团队的签名就统一了。' },
    teach: { en: 'Point out the split: inputs on the left, template on the right. "You are not writing code — you are describing a form and a template."', zh: '点出这个结构：左边是表单、右边是模板。「你不是在写代码，你是在描述一个表单和一个模板。」' },
    prompt: '用【单个 HTML 文件】做一个「邮件签名生成器」：左边是姓名、职位、部门、手机、邮箱五个输入框，右边实时预览一段排版整齐的邮件签名（姓名加粗大一号、职位和部门一行、下方一条细分隔线、再下面是电话和邮箱），下方一个「全选并复制」按钮。\n改任意输入框，右边立刻更新。纯前端、不引入外部库，存成 .html 双击即用。',
    demo: `<!doctype html><meta charset=utf-8><style>html,body{margin:0;font-family:system-ui;background:#fbfaf6;color:#26231f;padding:12px;box-sizing:border-box;font-size:13px}h3{margin:0 0 8px;font-size:15px}.w{display:grid;grid-template-columns:1fr 1.15fr;gap:10px}label{display:block;font-size:10.5px;color:#6b655c;margin:5px 0 2px}input{width:100%;box-sizing:border-box;padding:5px 7px;border:1px solid #ccc;border-radius:6px;font-size:12px}.p{background:#fff;border:1px solid #e2ddd0;border-radius:10px;padding:12px}.nm{font-size:17px;font-weight:700}.ti{font-size:12px;color:#6b655c;margin-top:2px}.hr{height:2px;background:#2f6fb0;width:44px;margin:8px 0}.ct{font-size:11.5px;color:#26231f;line-height:1.8}</style><h3>✉️ 邮件签名生成器</h3><div class=w><div><label>姓名</label><input id=f0 value="王芳"><label>职位</label><input id=f1 value="高级项目经理"><label>部门</label><input id=f2 value="数字化转型部"><label>手机</label><input id=f3 value="138 0000 0000"><label>邮箱</label><input id=f4 value="fang.wang@example.com"></div><div class=p id=p></div></div><script>function upd(){var v=[];for(var i=0;i<5;i++)v.push(document.getElementById('f'+i).value);document.getElementById('p').innerHTML='<div class=nm>'+v[0]+'</div><div class=ti>'+v[1]+' · '+v[2]+'</div><div class=hr></div><div class=ct>📱 '+v[3]+'<br>✉️ '+v[4]+'</div>'}for(var i=0;i<5;i++)document.getElementById('f'+i).oninput=upd;upd();</script>`,
  },

  {
    id: 'weekly-report', cat: 'tool', level: 'pro', badge: 'JS',
    title: { en: 'Weekly report formatter', zh: '周报生成器' },
    scene: { en: 'Type rough bullets into three boxes; the page assembles a numbered, properly headed weekly report you can paste straight into mail or Teams.', zh: '在三个框里随手写要点，页面自动拼成带小标题、带序号、排版整齐的周报，直接粘进邮件或 Teams。' },
    teach: { en: 'The point is not the code — it is that you moved the format out of your head and into a file. Everyone hand-formats this every Friday.', zh: '重点不在代码，而在于「把格式从脑子里搬进了文件」。每周五全公司都在手动排这个版。' },
    prompt: '用【单个 HTML 文件】做一个「周报生成器」：左边是姓名、周次，以及「本周完成 / 下周计划 / 风险与需要的支持」三个多行文本框（每行写一条）；右边实时生成一份排版整齐的周报文本 —— 带标题行、三个小标题、每条自动编号，空的板块不出现。\n右下角一个「全选并复制」按钮，点了就能直接粘进邮件。纯前端、不引入外部库，存成 .html 双击即用。',
    demo: `<!doctype html><meta charset=utf-8><style>html,body{margin:0;font-family:system-ui;background:#fbfaf6;color:#26231f;padding:12px;box-sizing:border-box;font-size:13px}h3{margin:0 0 8px;font-size:15px}.w{display:grid;grid-template-columns:1fr 1.1fr;gap:10px}label{display:block;font-size:10.5px;color:#6b655c;margin:4px 0 2px}textarea,input{width:100%;box-sizing:border-box;padding:5px 7px;border:1px solid #ccc;border-radius:6px;font-size:11.5px;font-family:inherit;resize:vertical}textarea{height:38px;line-height:1.5}#o{height:158px;background:#fff;font-size:11px;line-height:1.65}button{margin-top:5px;padding:5px 12px;border:0;border-radius:7px;background:#26231f;color:#fff;cursor:pointer;font-size:11.5px}</style><h3>📋 周报生成器 · 左边随手写，右边直接粘</h3><div class=w><div><label>姓名 / 周次</label><input id=nm value="王芳 · 第 30 周"><label>本周完成（每行一条）</label><textarea id=a>完成排班工具上线\n核对 5 月报销单</textarea><label>下周计划</label><textarea id=b>推广到华东三个门店\n整理培训材料</textarea><label>风险 / 需要支持</label><textarea id=c>需要 IT 开一个共享盘权限</textarea></div><div><label>生成结果</label><textarea id=o readonly></textarea><button id=cp>全选并复制</button></div></div><script>function lines(id){return document.getElementById(id).value.split('\\n').filter(function(s){return s.replace(/\\s/g,'')})}function sec(t,a){if(!a.length)return'';return'【'+t+'】\\n'+a.map(function(s,i){return(i+1)+'. '+s}).join('\\n')+'\\n\\n'}function upd(){var o='周报 · '+document.getElementById('nm').value+'\\n'+'------------------------\\n\\n'+sec('本周完成',lines('a'))+sec('下周计划',lines('b'))+sec('风险与需要的支持',lines('c'));document.getElementById('o').value=o.replace(/\\n+$/,'')}['nm','a','b','c'].forEach(function(id){document.getElementById(id).oninput=upd});document.getElementById('cp').onclick=function(){var o=document.getElementById('o');o.readOnly=false;o.select();try{document.execCommand('copy')}catch(e){}o.readOnly=true;this.textContent='已全选 ✓';var b=this;setTimeout(function(){b.textContent='全选并复制'},1500)};upd();</script>`,
  },
  {
    id: 'timezone', cat: 'tool', level: 'pro', badge: 'JS',
    title: { en: 'Global meeting time board', zh: '跨时区会议时间板' },
    scene: { en: 'Drag the Beijing-time slider and watch every site light up green (in office hours), amber (edge) or red (asleep). The single most useful page for anyone in a global team.', zh: '拖动「北京时间」滑块，各个站点实时变绿（正常上班）/ 黄（勉强）/ 红（在睡觉）。对跨时区协作的人来说，这一页最实用。' },
    teach: { en: 'Slide it to 09:00 Beijing and let the room see Houston go red. Nobody argues about meeting times after that.', zh: '把滑块拖到北京时间 09:00，让大家看着休斯顿变红。之后再没人为约会议时间争论了。' },
    prompt: '用【单个 HTML 文件】做一个「跨时区会议时间板」：顶部一个滑块选择北京时间（0–23 点），下面列出几个站点（上海 UTC+8、班加罗尔 UTC+5:30、伦敦 UTC+1、休斯顿 UTC−5、帕洛阿尔托 UTC−7），每行显示该站点对应的当地时间，并用底色标注 —— 09:00–18:00 绿色（正常上班）、07:00–09:00 与 18:00–21:00 黄色（勉强可以）、其余红色（在睡觉），跨天的要标「+1 天 / −1 天」。\n纯前端、不引入外部库，存成 .html 双击即用，字号要大方便投屏。',
    dataFile: { name: 'site-timezones.csv', desc: { en: '5 sites · UTC offset and office hours', zh: '5 个站点 · UTC 偏移与上班时段' }, csv: '站点,UTC偏移(分钟),上班开始,上班结束\n上海 / 北京,480,9,18\n班加罗尔,330,9,18\n伦敦,60,9,17\n休斯顿,-300,8,17\n帕洛阿尔托,-420,9,18' },
    demo: `<!doctype html><meta charset=utf-8><style>html,body{margin:0;font-family:system-ui;background:#fbfaf6;color:#26231f;padding:12px;box-sizing:border-box;font-size:13px}h3{margin:0 0 6px;font-size:15px}.sl{display:flex;align-items:center;gap:8px;margin-bottom:9px}input[type=range]{flex:1}.bj{font-variant-numeric:tabular-nums;font-weight:700;color:#2f6fb0;font-size:16px;white-space:nowrap}.row{display:flex;align-items:center;justify-content:space-between;border-radius:8px;padding:6px 10px;margin:4px 0;font-size:12.5px}.row b{font-variant-numeric:tabular-nums;font-size:14px}.tag{font-size:10.5px;opacity:.75}</style><h3>🌍 跨时区会议时间板</h3><div class=sl><span style="font-size:11px;color:#6b655c">北京</span><input id=h type=range min=0 max=23 value=9><span class=bj id=bj>09:00</span></div><div id=o></div><script>var C=[['上海 / 北京',480],['班加罗尔',330],['伦敦',60],['休斯顿',-300],['帕洛阿尔托',-420]];function pad(n){return(n<10?'0':'')+n}function upd(){var h=+document.getElementById('h').value;document.getElementById('bj').textContent=pad(h)+':00';var utc=h*60-480,o='';for(var i=0;i<C.length;i++){var m=utc+C[i][1],day=Math.floor(m/1440);m=((m%1440)+1440)%1440;var hh=Math.floor(m/60),mm=m%60,st,bg,fg;if(hh>=9&&hh<18){st='上班中';bg='#e8f3e2';fg='#3f6b25'}else if((hh>=7&&hh<9)||(hh>=18&&hh<21)){st='勉强可以';bg='#fdf3d8';fg='#8a682c'}else{st='在睡觉';bg='#fdecea';fg='#b03a2b'}var dt=day>0?' +'+day+'天':(day<0?' '+day+'天':'');o+='<div class=row style="background:'+bg+';color:'+fg+'"><span>'+C[i][0]+'</span><span><b>'+pad(hh)+':'+pad(mm)+'</b><span class=tag>'+dt+' · '+st+'</span></span></div>'}document.getElementById('o').innerHTML=o}document.getElementById('h').oninput=upd;upd();</script>`,
  },
  {
    id: 'gantt', cat: 'chart', level: 'pro', badge: 'CSS Grid',
    title: { en: 'Project Gantt chart', zh: '项目甘特图' },
    scene: { en: 'Task name, start day, duration — bars laid out on a two-week scale with a red "today" line. Replaces the Gantt slide everyone rebuilds by hand in PowerPoint.', zh: '任务名、第几天开始、做几天 —— 两周刻度上的横条，外加一条红色「今天」线。就是每个人都在 PPT 里手动画的那张图。' },
    teach: { en: 'Ask the room who has hand-drawn Gantt rectangles in PowerPoint. Then show that the whole chart is five lines of data.', zh: '先问一句「谁在 PPT 里手动拉过甘特图的方块」。然后指着代码说：整张图的数据只有五行。' },
    prompt: '用【单个 HTML 文件】做一个「项目甘特图」：左边一列任务名，右边是两周（14 天）的时间刻度，每个任务用一根带颜色的圆角横条表示，横条的位置和长度由「第几天开始、持续几天」决定；\n再画一条红色竖线表示「今天」，并在条上显示天数。数据写成一个数组，改数组就能改图。纯前端、不引入外部库、不用图表库，存成 .html 双击即用。',
    dataFile: { name: 'project-schedule.csv', desc: { en: '5 tasks · start day, duration, owner', zh: '5 项任务 · 第几天开始 / 做几天 / 负责人' }, csv: '任务,开始第几天,持续天数,负责人\n需求调研,0,3,王芳\n方案设计,2,4,李明\n开发实现,5,6,张伟\n测试验收,10,3,赵丽\n上线复盘,12,2,陈杰' },
    demo: `<!doctype html><meta charset=utf-8><style>html,body{margin:0;font-family:system-ui;background:#fbfaf6;color:#26231f;padding:12px;box-sizing:border-box;font-size:12px}h3{margin:0 0 10px;font-size:15px}.row{display:flex;align-items:center;margin:5px 0}.nm{width:66px;flex:none;color:#6b655c;font-size:11px}.tr{position:relative;flex:1;height:19px;background:#efe9dd;border-radius:5px}.bar{position:absolute;top:0;height:19px;border-radius:5px;color:#fff;font-size:10px;line-height:19px;text-align:center;white-space:nowrap}.now{position:absolute;top:-4px;bottom:-4px;width:2px;background:#c0392b}.ax{display:flex;margin-top:6px}.ax .nm{width:66px;flex:none}.ax .t{flex:1;display:flex;justify-content:space-between;color:#9a948a;font-size:10px}</style><h3>📊 项目甘特图 · 两周排期</h3><div id=o></div><div class=ax><div class=nm></div><div class=t><span>D1</span><span>D4</span><span>D7</span><span>D10</span><span>D14</span></div></div><div style="margin-top:7px;font-size:10.5px;color:#6b655c"><span style="color:#c0392b">▌</span> 红线 = 今天（第 7 天）</div><script>var T=[['需求调研',0,3,'#2f6fb0'],['方案设计',2,4,'#7a5cab'],['开发实现',5,6,'#5c8a3a'],['测试验收',10,3,'#c2703c'],['上线复盘',12,2,'#8a682c']],TOT=14,NOW=7;document.getElementById('o').innerHTML=T.map(function(t){return'<div class=row><div class=nm>'+t[0]+'</div><div class=tr><div class=bar style="left:'+(t[1]/TOT*100)+'%;width:'+(t[2]/TOT*100)+'%;background:'+t[3]+'">'+t[2]+'d</div><div class=now style="left:'+(NOW/TOT*100)+'%"></div></div></div>'}).join('');</script>`,
  },
  {
    id: 'survey', cat: 'chart', level: 'pro', badge: 'JS',
    title: { en: 'Live satisfaction poll', zh: '现场满意度投票' },
    scene: { en: 'Five star buttons; every click updates the distribution bars and the average — right on the projector. Run it at the end of your own session.', zh: '五颗星按钮，点一下柱状分布和平均分立刻变 —— 就在投影上。你自己这堂课结束时就能拿它收反馈。' },
    teach: { en: 'Open it on the projector and let people call out a score while you click. The bars moving live is the whole demo.', zh: '投屏打开，让大家喊分数你来点。柱子当场跳动 —— 这就是整个演示的高光。' },
    prompt: '用【单个 HTML 文件】做一个「现场满意度投票」：上方五个按钮（★1 到 ★5），点击即投一票；下方实时显示每个分数的票数柱状条（横向、按比例）、总票数和平均分（保留一位小数）。\n再加一个「清零」按钮。纯前端、不引入外部库、不连服务器，存成 .html 双击即用，字号要大适合投屏。',
    demo: `<!doctype html><meta charset=utf-8><style>html,body{margin:0;font-family:system-ui;background:#fbfaf6;color:#26231f;padding:12px;box-sizing:border-box;font-size:13px}h3{margin:0 0 8px;font-size:15px}.bs{display:flex;gap:5px;margin-bottom:9px}.bs button{flex:1;padding:7px 0;border:1px solid #e2ddd0;border-radius:8px;background:#fff;cursor:pointer;font-size:12px;color:#c2703c}.bs button:hover{background:#fdf3d8}.row{display:flex;align-items:center;gap:7px;margin:4px 0;font-size:11.5px}.row .lb{width:34px;flex:none;color:#c2703c}.tr{flex:1;height:15px;background:#efe9dd;border-radius:4px;overflow:hidden}.fill{height:15px;background:#2f6fb0;border-radius:4px;transition:width .3s}.n{width:26px;flex:none;text-align:right;color:#6b655c;font-variant-numeric:tabular-nums}.sum{margin-top:9px;font-size:12px;color:#6b655c}.sum b{font-size:20px;color:#2f6fb0;font-variant-numeric:tabular-nums}.rs{margin-left:8px;border:1px solid #e2ddd0;background:#fff;border-radius:6px;padding:2px 8px;font-size:11px;cursor:pointer;color:#6b655c}</style><h3>⭐ 现场满意度投票</h3><div class=bs id=bs></div><div id=o></div><div class=sum id=s></div><script>var v=[1,2,5,9,14];function upd(){var tot=0,sc=0;for(var i=0;i<5;i++){tot+=v[i];sc+=v[i]*(i+1)}var mx=Math.max.apply(null,v)||1,o='';for(var i=4;i>=0;i--)o+='<div class=row><span class=lb>★'+(i+1)+'</span><div class=tr><div class=fill style="width:'+(v[i]/mx*100)+'%"></div></div><span class=n>'+v[i]+'</span></div>';document.getElementById('o').innerHTML=o;document.getElementById('s').innerHTML='共 '+tot+' 票 · 平均 <b>'+(tot?Math.round(sc/tot*10)/10:0)+'</b> 分<button class=rs id=rs>清零</button>';document.getElementById('rs').onclick=function(){v=[0,0,0,0,0];upd()}}document.getElementById('bs').innerHTML=[1,2,3,4,5].map(function(n){return'<button data-n='+n+'>★'+n+'</button>'}).join('');document.getElementById('bs').onclick=function(e){var n=e.target.getAttribute('data-n');if(n){v[+n-1]++;upd()}};upd();</script>`,
  },

  {
    id: 'radar', cat: 'chart', level: 'expert', badge: 'SVG',
    title: { en: 'Competency radar', zh: '能力雷达图' },
    scene: { en: 'Six axes, two overlaid shapes — one person against the team average. The standard chart for a performance or training conversation, drawn in raw SVG.', zh: '六个维度、两层叠加 —— 个人 vs 团队均值。绩效谈话、培训需求分析都在用这张图，这里用纯 SVG 画出来。' },
    teach: { en: 'The teachable bit is the trig: six points on a circle, one polygon each. Say "the AI knows the maths so you do not have to."', zh: '可讲的点是三角函数：圆周上取六个点，各连成一个多边形。一句话带过——「数学 AI 会，你不用会」。' },
    prompt: '用【单个 HTML 文件】+ 纯 SVG（不引入任何图表库）做一个「能力雷达图」：六个维度（沟通、执行、数据、创新、协作、专业），画出同心六边形网格和六条轴线；\n叠加两组数据 —— 「本人」用实心半透明蓝、「团队均值」用虚线灰，右下角一个小图例。数据写成两个数组，改数组就换图。存成 .html 双击即用。',
    dataFile: { name: 'competency-scores.csv', desc: { en: '6 dimensions · self vs team average', zh: '6 个维度 · 本人 vs 团队均值' }, csv: '维度,本人,团队均值\n沟通,4,3\n执行,5,3.5\n数据,3,3\n创新,4,3\n协作,3,4\n专业,5,3.5' },
    demo: `<!doctype html><meta charset=utf-8><style>html,body{margin:0;height:100%;background:#fbfaf6;font-family:system-ui;color:#26231f}svg{display:block;width:100%;height:100%}.lg{position:fixed;right:10px;bottom:8px;font-size:10.5px;color:#6b655c;line-height:1.6}.sw{display:inline-block;width:10px;height:10px;border-radius:2px;vertical-align:-1px;margin-right:4px}</style><svg id=s viewBox="0 0 260 234" preserveAspectRatio="xMidYMid meet"></svg><div class=lg><div><span class=sw style="background:rgba(47,111,176,.55)"></span>本人</div><div><span class=sw style="background:#b9b1a4"></span>团队均值</div></div><script>var AX=['沟通','执行','数据','创新','协作','专业'],me=[4,5,3,4,3,5],avg=[3,3.5,3,3,4,3.5],cx=130,cy=105,R=72,N=6,s=document.getElementById('s'),o='';function pt(i,v){var a=-Math.PI/2+i*2*Math.PI/N,r=R*v/5;return[cx+Math.cos(a)*r,cy+Math.sin(a)*r]}function poly(d){return d.map(function(v,i){var p=pt(i,v);return p[0].toFixed(1)+','+p[1].toFixed(1)}).join(' ')}for(var g=1;g<=5;g++)o+='<polygon points="'+poly([g,g,g,g,g,g])+'" fill=none stroke="#e2ddd0" stroke-width=1 />';for(var i=0;i<N;i++){var p=pt(i,5);o+='<line x1='+cx+' y1='+cy+' x2='+p[0].toFixed(1)+' y2='+p[1].toFixed(1)+' stroke="#e2ddd0" />';var l=pt(i,6.05);o+='<text x='+l[0].toFixed(1)+' y='+(l[1]+3).toFixed(1)+' text-anchor=middle font-size=10 fill="#6b655c">'+AX[i]+'</text>'}o+='<polygon points="'+poly(avg)+'" fill=none stroke="#b9b1a4" stroke-width=1.5 stroke-dasharray="4 3" />';o+='<polygon points="'+poly(me)+'" fill="rgba(47,111,176,.35)" stroke="#2f6fb0" stroke-width=2 />';s.innerHTML=o;</script>`,
  },
  {
    id: 'funnel', cat: 'chart', level: 'expert', badge: 'Canvas',
    title: { en: 'Conversion funnel', zh: '转化漏斗图' },
    scene: { en: 'Stacked trapezoids with the drop-off percentage printed between each pair — recruiting pipeline, sales pipeline, ticket triage. Drawn on a bare canvas.', zh: '一层层梯形，中间标出每一步的流失率 —— 招聘流程、销售管线、工单分级都能用。用一张空白 canvas 画出来。' },
    teach: { en: 'The number to point at is between the layers, not on them. A funnel is about where people fall out.', zh: '要指的数字在两层之间，不在层上。漏斗图看的是「人从哪一步掉下去的」。' },
    prompt: '用【单个 HTML 文件】+ Canvas（不引入任何图表库）做一个「转化漏斗图」：给我一组阶段名和人数（如 投递 1200 / 初筛 480 / 面试 160 / offer 42 / 入职 31），\n从上到下画成逐层收窄的梯形，每层里写阶段名和人数，每两层之间标出转化率百分比。配色用同一色系由深到浅。数据写成数组，改数组就换图。存成 .html 双击即用。',
    dataFile: { name: 'hiring-funnel.csv', desc: { en: '5 stages, 1200 applied → 31 joined', zh: '招聘 5 个阶段 · 1200 投递 → 31 入职' }, csv: '阶段,人数\n投递,1200\n初筛,480\n面试,160\noffer,42\n入职,31' },
    demo: `<!doctype html><meta charset=utf-8><style>html,body{margin:0;height:100%;background:#fbfaf6;overflow:hidden}canvas{display:block}</style><canvas id=c></canvas><script>var cv=document.getElementById('c'),x=cv.getContext('2d'),W,H,D=[['投递',1200],['初筛',480],['面试',160],['offer',42],['入职',31]],t=1;function fit(){W=cv.width=innerWidth||document.documentElement.clientWidth||320;H=cv.height=innerHeight||document.documentElement.clientHeight||220}function draw(){x.clearRect(0,0,W,H);var n=D.length,pad=14,gap=5,hh=(H-pad*2-gap*(n-1))/n,mx=D[0][1],maxW=W*0.62,cx=W*0.44;function wd(v){return maxW*(0.3+0.7*Math.sqrt(v/mx))}for(var i=0;i<n;i++){var w0=wd(D[i][1]),w1=wd(i<n-1?D[i+1][1]:D[i][1]*0.82),y=pad+i*(hh+gap);x.fillStyle='rgb('+(47-i*6)+','+(111-i*17)+','+(176-i*21)+')';x.beginPath();x.moveTo(cx-w0/2,y);x.lineTo(cx+w0/2,y);x.lineTo(cx+w1/2,y+hh);x.lineTo(cx-w1/2,y+hh);x.closePath();x.fill();x.fillStyle='#fff';x.font='600 11px system-ui';x.textAlign='center';x.fillText(D[i][0]+'  '+D[i][1],cx,y+hh/2+4);if(i<n-1){x.fillStyle='#8a682c';x.font='10px system-ui';x.textAlign='left';x.fillText('↓ '+Math.round(D[i+1][1]/D[i][1]*100)+'%',cx+maxW/2+8,y+hh+4)}}}function boot(){fit();draw()}boot();onload=boot;onresize=boot;</script>`,
  },
  {
    id: 'orgchart', cat: 'chart', level: 'expert', badge: 'SVG',
    title: { en: 'Org chart from a list', zh: '组织架构图' },
    scene: { en: 'Give it a nested list of people; it computes positions and draws the boxes and connectors itself. Re-org day becomes a two-minute edit instead of an afternoon in PowerPoint.', zh: '给它一份嵌套的人员名单，它自己算坐标、画方框和连线。调架构那天，从「在 PPT 里挪一下午」变成「改两行数据」。' },
    teach: { en: 'Show the data array first, then the picture. The whole lesson is: describe the structure, let the code do the layout.', zh: '先给他们看数据数组，再看图。整节课的道理就一句：你描述结构，布局交给代码。' },
    prompt: '用【单个 HTML 文件】+ 纯 SVG（不引入任何库）做一个「组织架构图」：数据是一个嵌套数组（一位总监下面 3 位经理，每位经理下面 2 位成员，每人有姓名和岗位）；\n代码要自己计算每个节点的坐标 —— 叶子节点均匀铺开，父节点居中在其子节点上方 —— 然后画出圆角方框和连接线。改数据就能改图，不要写死坐标。存成 .html 双击即用。',
    dataFile: { name: 'org-structure.csv', desc: { en: '10 people, 3 levels, reports-to column', zh: '10 人 · 三层结构 · 带「汇报给」列' }, csv: '姓名,岗位,汇报给\n李总,部门总监,\n王芳,项目组,李总\n李明,技术组,李总\n吴强,运营组,李总\n张伟,PM,王芳\n赵丽,BA,王芳\n陈杰,前端,李明\n周敏,后端,李明\n郑洁,数据,吴强\n孙浩,支持,吴强' },
    demo: `<!doctype html><meta charset=utf-8><style>html,body{margin:0;height:100%;background:#fbfaf6;overflow:hidden}svg{display:block}text{font-family:system-ui}</style><svg id=s width=100% height=100%></svg><script>var T={n:'李总',r:'部门总监',c:[{n:'王芳',r:'项目组',c:[{n:'张伟',r:'PM'},{n:'赵丽',r:'BA'}]},{n:'李明',r:'技术组',c:[{n:'陈杰',r:'前端'},{n:'周敏',r:'后端'}]},{n:'吴强',r:'运营组',c:[{n:'郑洁',r:'数据'},{n:'孙浩',r:'支持'}]}]},s=document.getElementById('s'),W,H,leaf,BW,BH=26,o='',LY=[];function depth(n){return n.c?1+Math.max.apply(null,n.c.map(depth)):0}var D=depth(T);function place(n,d){if(!n.c){n.x=(leaf+0.5)*(W/6);leaf++}else{n.c.forEach(function(k){place(k,d+1)});n.x=(n.c[0].x+n.c[n.c.length-1].x)/2}n.y=LY[d]}function draw(n){if(n.c)n.c.forEach(function(k){o+='<path d="M'+n.x+' '+(n.y+BH)+' V'+(n.y+BH+((k.y-n.y-BH)/2))+' H'+k.x+' V'+k.y+'" fill=none stroke="#c9c2b4" stroke-width=1.2 />';draw(k)});o+='<rect x='+(n.x-BW/2)+' y='+n.y+' width='+BW+' height='+BH+' rx=6 fill="'+(n.c?'#2f6fb0':'#fff')+'" stroke="'+(n.c?'#2f6fb0':'#e2ddd0')+'" /><text x='+n.x+' y='+(n.y+12)+' text-anchor=middle font-size=10 font-weight=600 fill="'+(n.c?'#fff':'#26231f')+'">'+n.n+'</text><text x='+n.x+' y='+(n.y+21)+' text-anchor=middle font-size=8 fill="'+(n.c?'rgba(255,255,255,.8)':'#9a948a')+'">'+n.r+'</text>'}function render(){W=innerWidth||document.documentElement.clientWidth||320;H=innerHeight||document.documentElement.clientHeight||220;BW=Math.min(62,W/8);LY=[];for(var i=0;i<=D;i++)LY.push(14+i*((H-40)/D));leaf=0;o='';place(T,0);draw(T);s.innerHTML=o}render();onload=render;onresize=render;</script>`,
  },
  {
    id: 'wordcloud', cat: 'effect', level: 'expert', badge: 'Canvas',
    title: { en: 'Feedback word cloud', zh: '反馈词云' },
    scene: { en: 'Paste the free-text answers from a survey, get a word cloud sized by frequency — placed on a spiral with real collision checking, no library.', zh: '把问卷里的开放式回答粘进去，按词频生成词云 —— 螺旋布局 + 真实碰撞检测，不用任何库。' },
    teach: { en: 'Worth saying out loud: the hard part is not the drawing, it is "do not let two words overlap". That is the bit to ask Copilot for explicitly.', zh: '值得说出口的一句：难的不是画字，是「两个词不能压在一起」。这一点要在提示词里明确要求 Copilot 处理。' },
    prompt: '用【单个 HTML 文件】+ Canvas（不引入任何词云库）做一个「反馈词云」：给一组「词 + 权重」的数据，权重越高字号越大、颜色越深；\n布局要求：从中心开始沿螺旋线寻找位置，每放一个词都要检查它的外接矩形是否和已放置的词重叠，重叠就继续沿螺旋向外找，放不下就跳过。\n数据写成数组，改数组就换图。存成 .html 双击即用。',
    dataFile: { name: 'feedback-terms.csv', desc: { en: '12 feedback terms with weights', zh: '12 个反馈词 · 带权重' }, csv: '词,权重\n效率提升,30\n上手快,24\n案例实用,22\n想要模板,18\n时间太短,16\n多讲提示词,15\n现场演示,13\n数据安全,12\n希望回放,10\n进阶班,9\n同事推荐,8\n再来一次,7' },
    demo: `<!doctype html><meta charset=utf-8><style>html,body{margin:0;height:100%;background:#fbfaf6;overflow:hidden}canvas{display:block}</style><canvas id=c></canvas><script>var cv=document.getElementById('c'),x=cv.getContext('2d'),W,H,D=[['效率提升',30],['上手快',24],['案例实用',22],['想要模板',18],['时间太短',16],['多讲提示词',15],['现场演示',13],['数据安全',12],['希望回放',10],['进阶班',9],['同事推荐',8],['再来一次',7]],box=[];function fit(){W=cv.width=innerWidth||document.documentElement.clientWidth||320;H=cv.height=innerHeight||document.documentElement.clientHeight||220}function slot(w,h){for(var a=0;a<900;a+=0.28){var r=a*1.7,px=W/2+Math.cos(a)*r*1.5,py=H/2+Math.sin(a)*r*0.7;if(px-w/2<2||px+w/2>W-2||py-h<2||py>H-2)continue;var ok=1;for(var i=0;i<box.length;i++){var b=box[i];if(px-w/2<b[2]&&px+w/2>b[0]&&py-h<b[3]&&py>b[1]){ok=0;break}}if(ok){box.push([px-w/2,py-h,px+w/2,py]);return[px,py]}}return null}function draw(){box=[];x.clearRect(0,0,W,H);var mx=D[0][1];D.forEach(function(d){var fs=Math.max(9,Math.round(d[1]/mx*30));x.font='700 '+fs+'px system-ui';var w=x.measureText(d[0]).width,p=slot(w+6,fs+4);if(!p)return;var a=d[1]/mx;x.fillStyle='rgba('+Math.round(160-a*113)+','+Math.round(160-a*49)+','+Math.round(160+a*16)+',1)';x.textAlign='center';x.fillText(d[0],p[0],p[1]-3)})}function boot(){fit();draw()}boot();onload=boot;onresize=boot;</script>`,
  },

  {
    id: 'dashboard', cat: 'chart', level: 'pro', badge: 'ECharts', approx: true,
    title: { en: 'Sales dashboard', zh: '销售仪表盘' },
    scene: { en: 'Turn a column of numbers into an interactive dashboard for your boss — no BI tool, no deploy.', zh: '把 Excel 里的一列数字，变成给老板看的交互式仪表盘 —— 不用 BI 工具、不用部署。' },
    prompt: '你是资深前端。用单个 HTML 文件 + ECharts（CDN 引入）做一个「销售仪表盘」：顶部三张数字卡片（本月销售额 / 环比 / 完成率），下面左边一个环形图显示各产品线占比、右边一个柱状图显示近 6 个月趋势。用我提供的示例数据，蓝色系、简洁风格，代码保存成 .html 双击即可打开。',
    dataFile: { name: 'sales-dashboard.csv', desc: { en: 'Long format: monthly + product lines + 3 KPIs', zh: '长表格式 · 月度 + 产品线 + 三项指标' }, csv: '类型,名称,数值\n月度,2月,42\n月度,3月,67\n月度,4月,55\n月度,5月,80\n月度,6月,73\n月度,7月,90\n产品线,打印机,38\n产品线,笔记本,29\n产品线,耗材配件,20\n产品线,服务,13\n指标,本月销售额,407\n指标,环比,23.3\n指标,完成率,91' },
    demo: `<!doctype html><meta charset=utf-8><style>html,body{margin:0;height:100%;background:#fbfaf6;font-family:system-ui}canvas{display:block}</style><canvas id=c></canvas><script>var cv=document.getElementById('c'),x=cv.getContext('2d'),W,H,d=[42,67,55,80,73,90],t=0,rid;function fit(){W=cv.width=innerWidth||document.documentElement.clientWidth||320;H=cv.height=innerHeight||document.documentElement.clientHeight||220}function loop(){x.clearRect(0,0,W,H);var n=d.length,bw=W/(n*2),gap=bw;t=Math.min(1,t+0.02);for(var i=0;i<n;i++){var h=(d[i]/100)*(H-60)*t,bx=gap+i*(bw+gap);x.fillStyle='#2f6fb0';x.fillRect(bx,H-30-h,bw,h);x.fillStyle='#33475b';x.font='12px system-ui';x.fillText(d[i],bx+bw/2-8,H-38-h)}if(t<1)rid=requestAnimationFrame(loop)}function boot(){fit();t=0;cancelAnimationFrame(rid);loop()}boot();onload=boot;onresize=boot;</script>`,
  },
  {
    id: 'sheet-clean', cat: 'sheet', level: 'pro', badge: 'SheetJS',
    title: { en: 'Web spreadsheet cleaner', zh: '网页版表格清洗' },
    scene: { en: 'The everyday "filter some rows then export" task — as a double-click webpage, data never leaves the machine.', zh: 'HR/运营常见的「筛一批数据再导出」，做成一个双击打开的网页，数据不出本机。' },
    prompt: '用单个 HTML 文件 + SheetJS(xlsx) 做一个「网页版表格清洗工具」：支持拖入 Excel/CSV，自动展示成表格，顶部一个搜索框做实时筛选，勾选行后可一键导出成新的 Excel。纯前端、不上传服务器，代码可直接保存成 .html 使用。',
    dataFile: { name: 'staff-directory.csv', desc: { en: '8 employees — drag this file into the tool', zh: '员工名册 8 行 · 直接把这个文件拖进工具里' }, csv: '姓名,部门,城市,入职年份,职级\n张三,市场,上海,2019,P5\n李四,研发,北京,2021,P6\n王五,销售,广州,2018,P7\n赵六,研发,深圳,2022,P4\n孙七,市场,杭州,2020,P5\n周八,销售,成都,2023,P4\n吴九,研发,北京,2017,P8\n郑十,人力,上海,2020,P6' },
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
    demo: `<!doctype html><meta charset=utf-8><style>html,body{margin:0;height:100%;background:#0b1020;overflow:hidden}canvas{display:block}</style><canvas id=c></canvas><script>var cv=document.getElementById('c'),x=cv.getContext('2d'),W,H,P=[];function fit(){W=cv.width=innerWidth||document.documentElement.clientWidth||320;H=cv.height=innerHeight||document.documentElement.clientHeight||220}function seed(){P=[];for(var i=0;i<60;i++)P.push({x:Math.random()*W,y:Math.random()*H,vx:(Math.random()-.5)*.8,vy:(Math.random()-.5)*.8})}function boot(){fit();seed()}boot();onload=boot;onresize=boot;function loop(){x.clearRect(0,0,W,H);for(var i=0;i<P.length;i++){var p=P[i];p.x+=p.vx;p.y+=p.vy;if(p.x<0||p.x>W)p.vx*=-1;if(p.y<0||p.y>H)p.vy*=-1;x.fillStyle='#5ad1ff';x.beginPath();x.arc(p.x,p.y,2,0,7);x.fill();for(var j=i+1;j<P.length;j++){var q=P[j],dx=p.x-q.x,dy=p.y-q.y,d=Math.sqrt(dx*dx+dy*dy);if(d<120){x.strokeStyle='rgba(90,209,255,'+(1-d/120)*.5+')';x.beginPath();x.moveTo(p.x,p.y);x.lineTo(q.x,q.y);x.stroke()}}}requestAnimationFrame(loop)}loop();</script>`,
  },
  {
    id: 'cube', cat: '3d', level: 'expert', badge: 'Three.js', approx: true,
    title: { en: 'Spinning 3D cube', zh: '旋转 3D 立方体' },
    scene: { en: 'Show the team "the web can run 3D too" — start from a spinning cube.', zh: '给团队直观演示「网页里也能跑 3D」—— 从一个会转的立方体开始。' },
    prompt: '用单个 HTML + Three.js（CDN 引入）做一个自转的 3D 立方体，六个面用不同颜色，加一点环境光和方向光让它有立体感，鼠标可拖动旋转（OrbitControls）。代码保存成 .html 双击打开就能看。',
    demo: `<!doctype html><meta charset=utf-8><style>html,body{margin:0;height:100%;background:#0b1020;overflow:hidden}canvas{display:block}</style><canvas id=c></canvas><script>var cv=document.getElementById('c'),x=cv.getContext('2d'),W,H,v=[[-1,-1,-1],[1,-1,-1],[1,1,-1],[-1,1,-1],[-1,-1,1],[1,-1,1],[1,1,1],[-1,1,1]],e=[[0,1],[1,2],[2,3],[3,0],[4,5],[5,6],[6,7],[7,4],[0,4],[1,5],[2,6],[3,7]],a=0;function fit(){W=cv.width=innerWidth||document.documentElement.clientWidth||320;H=cv.height=innerHeight||document.documentElement.clientHeight||220}fit();onload=fit;onresize=fit;function loop(){x.clearRect(0,0,W,H);a+=.01;var cx=W/2,cy=H/2,s=Math.min(W,H)/5,pr=[];for(var i=0;i<8;i++){var p=v[i],X=p[0]*Math.cos(a)-p[2]*Math.sin(a),Z=p[0]*Math.sin(a)+p[2]*Math.cos(a),Y=p[1]*Math.cos(a*.7)-Z*Math.sin(a*.7);Z=p[1]*Math.sin(a*.7)+Z*Math.cos(a*.7);var f=3/(3+Z);pr.push([cx+X*s*f,cy+Y*s*f])}x.strokeStyle='#5ad1ff';x.lineWidth=1.5;for(var i=0;i<e.length;i++){x.beginPath();x.moveTo(pr[e[i][0]][0],pr[e[i][0]][1]);x.lineTo(pr[e[i][1]][0],pr[e[i][1]][1]);x.stroke()}requestAnimationFrame(loop)}loop();</script>`,
  },
  {
    id: 'starfield', cat: '3d', level: 'expert', badge: 'Canvas',
    title: { en: 'Warp-speed starfield', zh: '穿越星空' },
    scene: { en: 'An intro / transition animation — cinematic in a few dozen lines.', zh: '开场动画 / 过场画面，几十行代码就有电影感。' },
    prompt: '用单个 HTML + Canvas 做一个「穿越星空」(warp speed) 效果：星点从屏幕中心向外加速飞出、带一点拖影，深空黑底，全屏自适应，纯 JS 不依赖库。',
    demo: `<!doctype html><meta charset=utf-8><style>html,body{margin:0;height:100%;background:#000;overflow:hidden}canvas{display:block}</style><canvas id=c></canvas><script>var cv=document.getElementById('c'),x=cv.getContext('2d'),W,H,S=[];function fit(){W=cv.width=innerWidth||document.documentElement.clientWidth||320;H=cv.height=innerHeight||document.documentElement.clientHeight||220}function seed(){S=[];for(var i=0;i<220;i++)S.push({x:(Math.random()-.5)*W,y:(Math.random()-.5)*H,z:Math.random()*W})}function boot(){fit();seed()}boot();onload=boot;onresize=boot;function loop(){x.fillStyle='rgba(0,0,0,.35)';x.fillRect(0,0,W,H);for(var i=0;i<S.length;i++){var s=S[i];s.z-=6;if(s.z<1){s.z=W;s.x=(Math.random()-.5)*W;s.y=(Math.random()-.5)*H}var k=128/s.z,px=s.x*k+W/2,py=s.y*k+H/2,r=(1-s.z/W)*2.5;x.fillStyle='#fff';x.beginPath();x.arc(px,py,r,0,7);x.fill()}requestAnimationFrame(loop)}loop();</script>`,
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
    dataFile: { name: 'monthly-sales.csv', desc: { en: '7 months of sales — drag it in to get the chart', zh: '近 7 个月销售额 · 拖进去就出图' }, csv: '月份,销售额(万元)\n1月,20\n2月,45\n3月,38\n4月,60\n5月,72\n6月,55\n7月,88' },
    demo: `<!doctype html><meta charset=utf-8><style>html,body{margin:0;height:100%;background:#fbfaf6;font-family:system-ui}canvas{display:block}</style><canvas id=c></canvas><script>var cv=document.getElementById('c'),x=cv.getContext('2d'),W,H,d=[20,45,38,60,72,55,88],t=0,pad=28,rid;function fit(){W=cv.width=innerWidth||document.documentElement.clientWidth||320;H=cv.height=innerHeight||document.documentElement.clientHeight||220}function loop(){x.clearRect(0,0,W,H);t=Math.min(1,t+0.02);var n=d.length,pw=(W-pad*2)/(n-1);x.strokeStyle='#e2ddd0';for(var g=0;g<=4;g++){var gy=pad+(H-pad*2)*g/4;x.beginPath();x.moveTo(pad,gy);x.lineTo(W-pad,gy);x.stroke()}x.beginPath();x.lineWidth=2.5;x.strokeStyle='#2f6fb0';for(var i=0;i<n;i++){var px=pad+i*pw,py=H-pad-(d[i]/100)*(H-pad*2)*t;if(i)x.lineTo(px,py);else x.moveTo(px,py)}x.stroke();for(var i=0;i<n;i++){var px=pad+i*pw,py=H-pad-(d[i]/100)*(H-pad*2)*t;x.fillStyle='#2f6fb0';x.beginPath();x.arc(px,py,3.5,0,7);x.fill()}if(t<1)rid=requestAnimationFrame(loop)}function boot(){fit();t=0;cancelAnimationFrame(rid);loop()}boot();onload=boot;onresize=boot;</script>`,
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
    demo: `<!doctype html><meta charset=utf-8><style>html,body{margin:0;height:100%;background:#070a16;overflow:hidden}canvas{display:block}</style><canvas id=c></canvas><script>var cv=document.getElementById('c'),x=cv.getContext('2d'),W,H,R,pts=[],N=420,a=0;function fit(){W=cv.width=innerWidth||document.documentElement.clientWidth||320;H=cv.height=innerHeight||document.documentElement.clientHeight||220;R=Math.min(W,H)*0.32}fit();onload=fit;onresize=fit;for(var i=0;i<N;i++){var th=Math.acos(2*Math.random()-1),ph=2*Math.PI*Math.random();pts.push([Math.sin(th)*Math.cos(ph),Math.sin(th)*Math.sin(ph),Math.cos(th)])}function loop(){x.clearRect(0,0,W,H);a+=0.006;for(var i=0;i<N;i++){var p=pts[i],X=p[0]*Math.cos(a)-p[2]*Math.sin(a),Z=p[0]*Math.sin(a)+p[2]*Math.cos(a),Y=p[1],f=(Z+1.6)/2.6;x.fillStyle='rgba(90,209,255,'+(0.25+0.75*(Z+1)/2)+')';x.beginPath();x.arc(W/2+X*R,H/2+Y*R,f*1.7,0,7);x.fill()}requestAnimationFrame(loop)}loop();</script>`,
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

/** Download a sample dataset as a real .csv file.
 *  The leading ﻿ is a UTF-8 BOM — without it Excel on Windows opens the
 *  Chinese columns as mojibake, which derails a live workshop instantly. */
const downloadCsv = (f: DataFile) => {
  try {
    const blob = new Blob([`﻿${f.csv}\n`], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = f.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.setTimeout(() => URL.revokeObjectURL(url), 2000);
  } catch { /* ignore */ }
};

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

  /* The one line 大雷 says out loud while the demo is on screen. */
  const TeachNote: React.FC<{ r: Recipe }> = ({ r }) => r.teach ? (
    <p className="mt-2.5 rounded-lg border-l-2 border-accent/50 bg-accent/[0.05] px-3 py-2 text-[12px] leading-relaxed text-ink/65">
      <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-accent">{t({ en: 'Say this', zh: '讲解要点' })}</span>
      <span className="mt-1 block">{t(r.teach)}</span>
    </p>
  ) : null;

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

  /* One click → a real .csv on the attendee's disk. No "save as", no .txt trap. */
  const FileBlock: React.FC<{ r: Recipe }> = ({ r }) => r.dataFile ? (
    <button
      onClick={() => downloadCsv(r.dataFile!)}
      className="mt-2 flex w-full items-center justify-between gap-2 rounded-xl border border-gold/35 bg-gold/[0.06] px-3 py-2 text-left transition-colors hover:border-gold/70 hover:bg-gold/[0.12]"
    >
      <span className="min-w-0">
        <span className="block font-mono text-[10px] uppercase tracking-[0.18em] text-gold">{t({ en: 'Sample data · download & go', zh: '示例数据 · 下载即可试' })}</span>
        <span className="mt-0.5 block text-[12px] leading-snug text-ink/70">{t(r.dataFile.desc)}</span>
        <span className="mt-0.5 block truncate font-mono text-[10.5px] text-ink/45">{r.dataFile.name}</span>
      </span>
      <span className="shrink-0 rounded-md border border-gold/40 bg-paper px-2 py-1 font-mono text-[10.5px] text-gold">⬇ CSV</span>
    </button>
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
            en: 'For HP colleagues getting into AI — organised by stage (Beginner / Proficient / Advanced) so everyone finds something they can build today. One thing you can see and click beats an hour on how models work. Each card is a scenario + a line to say while demoing + a copyable prompt + a live, self-contained demo — and where data is involved, a ⬇ CSV button that puts the sample file straight on your disk, so attendees can try it in the next minute. The flagship walkthrough is the staff roster: hand Copilot Chat the data + prompt, save the reply as .html, double-click — a real tool.',
            zh: '为对 AI 感兴趣的惠普同事准备 —— 按阶段分（初学者 / 精通 / 高阶），每个人都能找到今天就能上手的例子。一个能看能点的东西，胜过讲一小时模型原理。每张卡 = 业务场景 + 一句讲解要点 + 可复制提示词 + 实时自包含效果；凡是要用到数据的，卡片上都有 ⬇ CSV 按钮，点一下示例文件就在本地，学员下一分钟就能开始试。旗舰演示是「排班系统」：把数据 + 提示词交给 Copilot Chat，回复存成 .html，双击打开 —— 就是一个真能用的工具。',
          })}
        </p>

        {/* Copilot Chat workflow — the 4 steps 大雷 demoes live */}
        <div className="mt-7 overflow-hidden rounded-3xl border border-ink/10 bg-surface/40">
          <div className="border-b border-ink/10 px-5 py-3 sm:px-6">
            <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-gold">{t({ en: 'From prompt to a working webpage · 4 steps in Copilot Chat', zh: '从提示词到一个能用的网页 · Copilot Chat 四步走' })}</span>
          </div>
          <ol className="grid gap-px bg-ink/10 sm:grid-cols-4">
            {[
              { n: '1', t: { en: 'Copy prompt · download the data', zh: '复制提示词 · 下载数据' }, d: { en: 'Copy a recipe’s prompt into Copilot Chat. Where a card shows a ⬇ CSV button, click it — you get the sample file straight on disk, nothing to retype.', zh: '把卡片的提示词粘进 Copilot Chat。卡片上有 ⬇ CSV 按钮的，点一下就把示例数据存到本地，不用自己再敲一遍。' } },
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
                <TeachNote r={spot} />
                <PromptBlock r={spot} />
                <DataBlock r={spot} />
                <FileBlock r={spot} />
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
                <TeachNote r={r} />
                <PromptBlock r={r} />
                <DataBlock r={r} />
                <FileBlock r={r} />
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
