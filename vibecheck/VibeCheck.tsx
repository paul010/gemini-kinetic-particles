import React, { useMemo, useState } from 'react';

interface Props { onHome: () => void }
type Scores = [number, number, number, number];

const questions = [
  { title: '周末突然空出半天，你更想？', eyebrow: '生活频道', options: [
    ['临时起意，去没逛过的街区', [3, 0, 1, 1]], ['窝在喜欢的角落看电影', [0, 3, 1, 0]],
    ['约朋友吃饭，顺手拍一百张', [1, 0, 3, 1]], ['收拾房间，再做一个新计划', [0, 1, 0, 3]],
  ]},
  { title: '朋友最常因为什么来找你？', eyebrow: '社交雷达', options: [
    ['需要一个大胆又好玩的主意', [3, 0, 1, 0]], ['想安静地说点心里话', [0, 3, 0, 1]],
    ['需要有人把气氛点燃', [1, 0, 3, 0]], ['事情乱了，想让我帮忙理顺', [0, 1, 0, 3]],
  ]},
  { title: '进入一家陌生咖啡馆，你先注意？', eyebrow: '感官采样', options: [
    ['角落里奇怪但有趣的小物件', [3, 0, 1, 0]], ['光线、音乐和整体气氛', [0, 3, 1, 0]],
    ['哪一桌的人看起来最好聊', [0, 0, 3, 1]], ['菜单、动线和最划算的选择', [0, 0, 0, 3]],
  ]},
  { title: '计划被临时打乱时，你通常？', eyebrow: '临场反应', options: [
    ['太好了，换条路也许更精彩', [3, 0, 1, 0]], ['先缓一缓，重新感受一下', [0, 3, 0, 1]],
    ['拉上大家，现场投票决定', [1, 0, 3, 0]], ['迅速列出 B 方案并执行', [0, 0, 0, 3]],
  ]},
  { title: '如果你是一种天气，会是？', eyebrow: '隐藏气质', options: [
    ['刚停雨、到处反光的城市夜晚', [3, 1, 0, 0]], ['柔软安静的初雪', [0, 3, 0, 1]],
    ['突然出现的彩虹阵雨', [1, 0, 3, 0]], ['清晨六点准时升起的太阳', [0, 1, 0, 3]],
  ]},
  { title: '你希望别人记住你的哪一面？', eyebrow: '最终选择', options: [
    ['永远保有好奇和想象力', [3, 0, 1, 0]], ['温柔、细腻，懂得共鸣', [0, 3, 0, 1]],
    ['有趣、松弛，和我在一起很快乐', [1, 0, 3, 0]], ['靠谱、清醒，总能把事做好', [0, 1, 0, 3]],
  ]},
] as const;

const results = [
  { icon: '✦', name: '星际漫游者', short: '好奇心是你的导航系统', copy: '你总能在寻常生活里发现隐藏入口。新鲜感、想象力和一点点不按常理出牌，是你最自然的吸引力。', tags: ['探索欲', '脑洞派', '自由感'], color: '#7758e8' },
  { icon: '☾', name: '月光共鸣者', short: '温柔，但从不单薄', copy: '你对气氛和情绪有很细的接收天线。你不急着成为人群中心，却常常是别人愿意卸下防备的那个人。', tags: ['高感受力', '浪漫派', '共鸣感'], color: '#bc4da0' },
  { icon: '☀', name: '快乐放大器', short: '你走到哪里，哪里就亮一点', copy: '你擅长把普通时刻变得有意思。你的松弛、幽默和连接人的能力，让你天然拥有让气氛升温的超能力。', tags: ['感染力', '社交力', '乐天派'], color: '#e85191' },
  { icon: '◆', name: '清醒掌舵者', short: '浪漫有边界，行动有方向', copy: '你习惯在混乱中找到结构，也愿意为重要的人和事负责。你给人的安全感，来自清醒判断和稳定行动。', tags: ['执行力', '秩序感', '可靠派'], color: '#6655bf' },
] as const;

const VibeCheck: React.FC<Props> = ({ onHome }) => {
  const [started, setStarted] = useState(false);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [copied, setCopied] = useState(false);
  const finished = answers.length === questions.length;
  const scores = useMemo(() => answers.reduce<Scores>((sum, answer, index) => {
    const points = questions[index].options[answer][1];
    return sum.map((value, scoreIndex) => value + points[scoreIndex]) as Scores;
  }, [0, 0, 0, 0]), [answers]);
  const resultIndex = scores.indexOf(Math.max(...scores));
  const result = results[resultIndex];
  const match = 72 + Math.min(23, Math.round((Math.max(...scores) / 18) * 23));

  const choose = (answer: number) => {
    const next = [...answers.slice(0, step), answer];
    setAnswers(next);
    if (step < questions.length - 1) window.setTimeout(() => setStep(step + 1), 180);
  };
  const reset = () => { setStarted(false); setStep(0); setAnswers([]); setCopied(false); };
  const share = async () => {
    const value = `我的娱乐人格是「${result.name}」：${result.short}。来测测你的隐藏气质吧！`;
    try { await navigator.clipboard.writeText(value); setCopied(true); window.setTimeout(() => setCopied(false), 1600); } catch { setCopied(false); }
  };

  return <main className="vc-page">
    <style>{`
      .vc-page{--ink:#191526;--pink:#e64b9a;--violet:#7457df;min-height:100dvh;overflow:hidden;color:var(--ink);font-family:"PingFang SC","Microsoft YaHei",ui-sans-serif,system-ui,sans-serif;background:#f8f5ff;position:relative}
      .vc-page *{box-sizing:border-box}.vc-bg{position:fixed;inset:0;pointer-events:none;background:radial-gradient(circle at 8% 12%,rgba(255,255,255,.95) 0 11%,transparent 35%),radial-gradient(circle at 92% 8%,rgba(194,170,255,.34),transparent 32%),radial-gradient(circle at 42% 94%,rgba(239,117,190,.20),transparent 38%),linear-gradient(135deg,#fff 0%,#f7efff 46%,#f2edff 100%)}
      .vc-orb{position:fixed;border-radius:40%;filter:blur(1px);opacity:.45;pointer-events:none;animation:vc-float 9s ease-in-out infinite}.vc-orb-a{width:190px;height:190px;right:-55px;top:20%;background:linear-gradient(135deg,#fff,#a98aff);transform:rotate(28deg)}.vc-orb-b{width:130px;height:130px;left:-36px;bottom:9%;background:linear-gradient(135deg,#ff8fc8,#fff);animation-delay:-3s}
      .vc-nav{height:72px;width:min(1180px,calc(100% - 36px));margin:auto;display:flex;align-items:center;justify-content:space-between;position:relative;z-index:5}.vc-home,.vc-quiet{border:0;background:transparent;color:#655c75;font:700 13px/1 inherit;cursor:pointer}.vc-brand{font-size:14px;font-weight:900;letter-spacing:.08em}.vc-brand i{color:var(--pink);font-style:normal}.vc-stage{width:min(1120px,calc(100% - 36px));min-height:calc(100dvh - 72px);margin:auto;display:grid;align-items:center;position:relative;z-index:2;padding:38px 0 70px}
      .vc-landing{display:grid;grid-template-columns:1.08fr .92fr;gap:8vw;align-items:center}.vc-kicker{display:inline-flex;align-items:center;gap:8px;margin:0 0 18px;padding:8px 13px;border:1px solid rgba(116,87,223,.16);border-radius:999px;background:rgba(255,255,255,.58);color:#7258ba;font-size:12px;font-weight:800;letter-spacing:.08em}.vc-title{margin:0;font-size:clamp(52px,7vw,90px);line-height:.98;letter-spacing:-.075em;font-weight:950}.vc-title span{display:block;background:linear-gradient(100deg,var(--pink),var(--violet));background-clip:text;-webkit-background-clip:text;color:transparent}.vc-lead{max-width:520px;margin:25px 0 0;color:#6e657b;font-size:17px;line-height:1.8}.vc-cta{margin-top:30px;display:flex;align-items:center;gap:16px}.vc-primary,.vc-secondary{min-height:50px;border-radius:999px;padding:0 24px;font:850 14px/1 inherit;cursor:pointer;transition:transform .18s ease,box-shadow .18s ease}.vc-primary{border:0;color:#fff;background:linear-gradient(110deg,var(--pink),var(--violet));box-shadow:0 15px 38px rgba(169,65,166,.25)}.vc-secondary{border:1px solid rgba(65,46,89,.12);background:rgba(255,255,255,.55);color:#51475e}.vc-primary:hover{transform:translateY(-2px);box-shadow:0 19px 44px rgba(169,65,166,.31)}.vc-primary:active,.vc-secondary:active{transform:scale(.98)}.vc-meta{font-size:12px;color:#877e91}
      .vc-preview{position:relative;min-height:520px;display:grid;place-items:center}.vc-card{width:min(430px,100%);padding:28px;border:1px solid rgba(255,255,255,.9);border-radius:32px;background:rgba(255,255,255,.58);box-shadow:inset 0 1px 0 #fff,0 35px 80px rgba(96,60,145,.15);backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px)}.vc-preview .vc-card{transform:rotate(2.5deg)}.vc-chip{display:inline-flex;padding:7px 11px;border-radius:999px;background:#f8eafb;color:#b44b9e;font-size:11px;font-weight:800}.vc-faux{margin-top:25px;display:grid;grid-template-columns:1fr 106px;gap:20px;align-items:center}.vc-faux h3{margin:6px 0;font-size:30px}.vc-faux p{margin:0;color:#8b8195;font-size:12px}.vc-ring{width:104px;aspect-ratio:1;border-radius:50%;display:grid;place-items:center;background:conic-gradient(var(--pink) 0 78%,#eadff2 78%);position:relative}.vc-ring:after{content:"";position:absolute;inset:10px;border-radius:50%;background:#fff}.vc-ring strong{position:relative;z-index:1;color:var(--pink);font-size:25px}.vc-tags{display:flex;gap:8px;flex-wrap:wrap;margin-top:24px;padding-top:20px;border-top:1px solid #e9dff0}.vc-tags span{padding:7px 10px;border-radius:10px;background:#fff;color:#a34c91;font-size:11px}.vc-sticker{position:absolute;width:92px;height:92px;display:grid;place-items:center;border-radius:26px;background:linear-gradient(145deg,#fff,#aa7af1);box-shadow:0 18px 40px rgba(98,64,151,.25);color:#fff;font-size:42px;font-weight:950;transform:rotate(-13deg);left:0;top:46px}
      .vc-quiz{width:min(760px,100%);margin:auto}.vc-progress-top{display:flex;justify-content:space-between;align-items:center;color:#756a83;font-size:12px;font-weight:800}.vc-progress{height:8px;margin:13px 0 38px;border-radius:99px;background:rgba(115,83,151,.10);overflow:hidden}.vc-progress span{display:block;height:100%;border-radius:inherit;background:linear-gradient(90deg,var(--pink),var(--violet));transition:width .35s ease}.vc-question{animation:vc-in .35s ease both}.vc-question small{color:#b14c9b;font-weight:850;letter-spacing:.14em}.vc-question h1{margin:13px 0 30px;font-size:clamp(34px,5vw,58px);line-height:1.08;letter-spacing:-.05em}.vc-options{display:grid;grid-template-columns:1fr 1fr;gap:14px}.vc-option{min-height:92px;padding:19px 21px;text-align:left;border:1px solid rgba(96,66,121,.12);border-radius:18px;background:rgba(255,255,255,.66);color:#342b3e;font:750 15px/1.5 inherit;cursor:pointer;box-shadow:inset 0 1px 0 #fff;transition:transform .18s,border-color .18s,background .18s}.vc-option:hover{transform:translateY(-2px);border-color:rgba(230,75,154,.45);background:#fff}.vc-back{margin-top:24px;border:0;background:transparent;color:#83778f;font:700 13px/1 inherit;cursor:pointer}
      .vc-result{width:min(900px,100%);margin:auto;display:grid;grid-template-columns:.68fr 1.32fr;gap:18px;animation:vc-in .5s ease both}.vc-result-side{padding:30px;border-radius:30px;background:linear-gradient(160deg,#21172e,#604597);color:#fff;display:flex;flex-direction:column;justify-content:space-between;min-height:480px;box-shadow:0 32px 70px rgba(70,43,103,.24)}.vc-result-icon{font-size:72px}.vc-result-side small{color:#d9cbea;letter-spacing:.12em;font-weight:800}.vc-result-side h2{font-size:36px;line-height:1.06;margin:14px 0}.vc-result-side p{color:#e3d9ec;line-height:1.7}.vc-score{display:flex;align-items:end;gap:8px;border-top:1px solid rgba(255,255,255,.18);padding-top:18px}.vc-score strong{font-size:54px;line-height:1}.vc-result-main{padding:38px;border-radius:30px;background:rgba(255,255,255,.72);border:1px solid #fff;backdrop-filter:blur(20px);box-shadow:0 28px 70px rgba(104,61,141,.13)}.vc-result-main .vc-kicker{margin-bottom:22px}.vc-result-main h1{font-size:clamp(38px,5vw,60px);line-height:1.03;letter-spacing:-.055em;margin:0}.vc-result-copy{font-size:17px;line-height:1.85;color:#685e73;margin:24px 0}.vc-traits{display:flex;gap:9px;flex-wrap:wrap}.vc-traits span{padding:9px 13px;border-radius:999px;background:#f7edf9;color:#9e438e;font-size:12px;font-weight:800}.vc-actions{display:flex;gap:10px;margin-top:35px;flex-wrap:wrap}.vc-disclaimer{margin:20px 0 0;color:#998fa1;font-size:11px;line-height:1.6}
      @keyframes vc-float{50%{transform:translateY(-18px) rotate(34deg)}}@keyframes vc-in{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
      @media(max-width:800px){.vc-nav{height:62px}.vc-stage{padding:22px 0 55px;min-height:calc(100dvh - 62px)}.vc-landing{grid-template-columns:1fr;gap:28px}.vc-title{font-size:clamp(48px,16vw,72px)}.vc-preview{min-height:400px}.vc-sticker{left:-5px;top:18px;width:68px;height:68px;font-size:31px}.vc-options{grid-template-columns:1fr}.vc-result{grid-template-columns:1fr}.vc-result-side{min-height:330px}.vc-card{border-radius:24px}.vc-result-main{padding:26px}.vc-quiet{display:none}}
      @media(prefers-reduced-motion:reduce){.vc-orb,.vc-question,.vc-result{animation:none}.vc-primary,.vc-option{transition:none}}
      @media(prefers-reduced-transparency:reduce){.vc-card,.vc-result-main,.vc-option{backdrop-filter:none;background:#fff}}
    `}</style>
    <div className="vc-bg"/><div className="vc-orb vc-orb-a"/><div className="vc-orb vc-orb-b"/>
    <nav className="vc-nav"><button className="vc-home" onClick={onHome}>← 大雷实验室</button><div className="vc-brand">VIBE<i>!</i> CHECK</div><button className="vc-quiet" onClick={reset}>重新开始</button></nav>
    <section className="vc-stage">
      {!started && <div className="vc-landing">
        <div><p className="vc-kicker">✦ 纯娱乐 · 无需登录</p><h1 className="vc-title">你的隐藏<span>气质是什么？</span></h1><p className="vc-lead">六道没有标准答案的小题，生成一份专属于你的娱乐人格卡。别想太久，第一感觉通常更有趣。</p><div className="vc-cta"><button className="vc-primary" onClick={() => setStarted(true)}>开始测一测 →</button><span className="vc-meta">约 60 秒</span></div></div>
        <div className="vc-preview"><div className="vc-sticker">AI</div><div className="vc-card"><span className="vc-chip">娱乐人格预览</span><div className="vc-faux"><div><p>你的隐藏气质</p><h3>等待揭晓</h3><p>答案没有对错，只看此刻的你</p></div><div className="vc-ring"><strong>?</strong></div></div><div className="vc-tags"><span>直觉派</span><span>氛围感</span><span>有点特别</span></div></div></div>
      </div>}
      {started && !finished && <div className="vc-quiz"><div className="vc-progress-top"><span>隐藏气质采样中</span><span>{step + 1} / {questions.length}</span></div><div className="vc-progress"><span style={{width:`${((step + 1) / questions.length) * 100}%`}}/></div><div className="vc-question" key={step}><small>✦ {questions[step].eyebrow}</small><h1>{questions[step].title}</h1><div className="vc-options">{questions[step].options.map((option,index)=><button className="vc-option" key={option[0]} onClick={()=>choose(index)}>{option[0]}</button>)}</div>{step>0&&<button className="vc-back" onClick={()=>{setStep(step-1);setAnswers(answers.slice(0,-1))}}>← 返回上一题</button>}</div></div>}
      {finished && <div className="vc-result"><aside className="vc-result-side" style={{background:`linear-gradient(155deg,#21172e,${result.color})`}}><div><div className="vc-result-icon">{result.icon}</div><small>YOUR VIBE TYPE</small><h2>{result.name}</h2><p>{result.short}</p></div><div className="vc-score"><strong>{match}%</strong><span>气质浓度</span></div></aside><article className="vc-result-main"><p className="vc-kicker">✦ 娱乐人格报告</p><h1>原来你是<br/>{result.name}</h1><p className="vc-result-copy">{result.copy}</p><div className="vc-traits">{result.tags.map(tag=><span key={tag}>{tag}</span>)}</div><div className="vc-actions"><button className="vc-primary" onClick={share}>{copied?'已复制结果':'复制结果去分享'}</button><button className="vc-secondary" onClick={reset}>再测一次</button></div><p className="vc-disclaimer">本测试仅供娱乐，不构成心理评估、人格诊断或现实决策建议。结果由当前选择即时计算，不收集或上传答案。</p></article></div>}
    </section>
  </main>;
};

export default VibeCheck;

