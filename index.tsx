import React, { useEffect, useState, useCallback, Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import Home from './Home';

// Heavier routes load on demand so the homepage bundle stays small.
const App = React.lazy(() => import('./App'));
const Arsenal = React.lazy(() => import('./arsenal/Arsenal'));
const MarkdownStudio = React.lazy(() => import('./tools/MarkdownStudio'));
const ImageStudio = React.lazy(() => import('./tools/ImageStudio'));
const ScreenshotToCode = React.lazy(() => import('./tools/ScreenshotToCode'));
const FluidPlayground = React.lazy(() => import('./tools/FluidPlayground'));
const ThreeOrb = React.lazy(() => import('./tools/ThreeOrb'));
const TTTHourOfCode = React.lazy(() => import('./workshop/TTTHourOfCode'));
const HearTheUniverse = React.lazy(() => import('./universe/HearTheUniverse'));
const Bench = React.lazy(() => import('./bench/Bench'));
const Fugu = React.lazy(() => import('./fugu/Fugu'));
const Copilot = React.lazy(() => import('./copilot/Copilot'));
const CopilotCamp = React.lazy(() => import('./copilotcamp/CopilotCamp'));
const PromptForge = React.lazy(() => import('./promptforge/PromptForge'));
const NotebookLM = React.lazy(() => import('./notebooklm/NotebookLM'));
const AIHtmlLab = React.lazy(() => import('./aihtml/AIHtmlLab'));
const Text2Image = React.lazy(() => import('./text2image/Text2Image'));
const FarmerRiver = React.lazy(() => import('./farmer/FarmerRiver'));
const QuyouBus = React.lazy(() => import('./quyoubus/QuyouBus'));
const HPWorkshop = React.lazy(() => import('./hpworkshop/HPWorkshop'));
const Agents = React.lazy(() => import('./agents/Agents'));
const Skills = React.lazy(() => import('./skills/Skills'));
const PlantUML = React.lazy(() => import('./tools/PlantUML'));
const Smallville = React.lazy(() => import('./town/Smallville'));
const Patterns = React.lazy(() => import('./patterns/Patterns'));
const Prompts = React.lazy(() => import('./prompts/Prompts'));
const CICI = React.lazy(() => import('./cici/CICI'));
const DesignSkill = React.lazy(() => import('./designskill/DesignSkill'));
const VideoGen = React.lazy(() => import('./videogen/VideoGen'));
const DinoBlaster = React.lazy(() => import('./dino/DinoBlaster'));
const Chengdu = React.lazy(() => import('./chengdu/Chengdu'));
const Lab3D = React.lazy(() => import('./lab3d/Lab3D'));
const Cappadocia = React.lazy(() => import('./lab3d/Cappadocia'));
const Zhangjiajie = React.lazy(() => import('./lab3d/Zhangjiajie'));
const Niagara = React.lazy(() => import('./lab3d/Niagara'));
const Fireflies = React.lazy(() => import('./lab3d/Fireflies'));
const Harbin = React.lazy(() => import('./lab3d/Harbin'));
const ForbiddenCity = React.lazy(() => import('./lab3d/ForbiddenCity'));
const BrooksFalls = React.lazy(() => import('./lab3d/BrooksFalls'));

const Loader: React.FC<{ label: string }> = ({ label }) => (
  <div
    className="fixed inset-0 grid place-items-center bg-ink text-paper/70"
    style={{ fontFamily: '"JetBrains Mono", monospace' }}
  >
    <div className="flex flex-col items-center gap-3">
      <span className="h-8 w-8 animate-spin rounded-full border-2 border-paper/20 border-t-gold" />
      <span className="text-xs tracking-widest">{label}</span>
    </div>
  </div>
);

type Route = 'home' | 'particles' | 'arsenal' | 'md' | 'img' | 's2c' | 'fluid' | 'r3f' | 'ttt-hour-of-code' | 'hear-the-universe' | 'bench' | 'fugu' | 'copilot' | 'copilotcamp' | 'promptforge' | 'notebooklm' | 'aihtml' | 'text2image' | 'farmer' | 'quyoubus' | 'hpworkshop' | 'agents' | 'skills' | 'uml' | 'town' | 'patterns' | 'prompts' | 'cici' | 'designskill' | 'videogen' | 'dino' | 'chengdu' | 'lab3d' | 'cappadocia' | 'zhangjiajie' | 'niagara' | 'fireflies' | 'harbin' | 'forbiddencity' | 'brooksfalls';

const routeFromLocation = (): Route => {
  const { pathname, hash } = window.location;
  const p = pathname.replace(/\/+$/, '');
  if (p.endsWith('/particles') || hash === '#/particles') return 'particles';
  if (p.endsWith('/arsenal') || hash === '#/arsenal') return 'arsenal';
  if (p.endsWith('/md') || hash === '#/md') return 'md';
  if (p.endsWith('/img') || hash === '#/img') return 'img';
  if (p.endsWith('/s2c') || hash === '#/s2c') return 's2c';
  if (p.endsWith('/fluid') || hash === '#/fluid') return 'fluid';
  if (p.endsWith('/r3f') || hash === '#/r3f') return 'r3f';
  if (p.endsWith('/ttt-hour-of-code') || hash === '#/ttt-hour-of-code') return 'ttt-hour-of-code';
  if (p.endsWith('/hear-the-universe') || hash === '#/hear-the-universe') return 'hear-the-universe';
  if (p.endsWith('/bench') || hash === '#/bench') return 'bench';
  if (p.endsWith('/fugu') || hash === '#/fugu') return 'fugu';
  if (p.endsWith('/copilotcamp') || hash === '#/copilotcamp') return 'copilotcamp';
  if (p.endsWith('/promptforge') || hash === '#/promptforge') return 'promptforge';
  if (p.endsWith('/notebooklm') || hash === '#/notebooklm') return 'notebooklm';
  if (p.endsWith('/aihtml') || hash === '#/aihtml') return 'aihtml';
  if (p.endsWith('/text2image') || hash === '#/text2image') return 'text2image';
  if (p.endsWith('/farmer') || hash === '#/farmer') return 'farmer';
  if (p.endsWith('/quyoubus') || hash === '#/quyoubus') return 'quyoubus';
  if (p.endsWith('/hpworkshop') || hash === '#/hpworkshop') return 'hpworkshop';
  if (p.endsWith('/copilot') || hash === '#/copilot') return 'copilot';
  if (p.endsWith('/agents') || hash === '#/agents') return 'agents';
  if (p.endsWith('/skills') || hash === '#/skills') return 'skills';
  if (p.endsWith('/uml') || hash === '#/uml') return 'uml';
  if (p.endsWith('/town') || hash === '#/town') return 'town';
  if (p.endsWith('/patterns') || hash === '#/patterns') return 'patterns';
  if (p.endsWith('/prompts') || hash === '#/prompts') return 'prompts';
  if (p.endsWith('/cici') || hash === '#/cici') return 'cici';
  if (p.endsWith('/designskill') || hash === '#/designskill') return 'designskill';
  if (p.endsWith('/videogen') || hash === '#/videogen') return 'videogen';
  if (p.endsWith('/dino') || hash === '#/dino') return 'dino';
  if (p.endsWith('/chengdu') || hash === '#/chengdu') return 'chengdu';
  if (p.endsWith('/lab3d') || hash === '#/lab3d') return 'lab3d';
  if (p.endsWith('/cappadocia') || hash === '#/cappadocia') return 'cappadocia';
  if (p.endsWith('/zhangjiajie') || hash === '#/zhangjiajie') return 'zhangjiajie';
  if (p.endsWith('/niagara') || hash === '#/niagara') return 'niagara';
  if (p.endsWith('/fireflies') || hash === '#/fireflies') return 'fireflies';
  if (p.endsWith('/harbin') || hash === '#/harbin') return 'harbin';
  if (p.endsWith('/forbiddencity') || hash === '#/forbiddencity') return 'forbiddencity';
  if (p.endsWith('/brooksfalls') || hash === '#/brooksfalls') return 'brooksfalls';
  return 'home';
};

const Router: React.FC = () => {
  const [route, setRoute] = useState<Route>(routeFromLocation());

  const navigate = useCallback((path: string) => {
    if (window.location.pathname !== path) {
      window.history.pushState({}, '', path);
    }
    setRoute(routeFromLocation());
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const onPop = () => setRoute(routeFromLocation());
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  // The particle experience is a fixed full-screen canvas; other routes scroll.
  useEffect(() => {
    const fullScreen = ['particles', 'md', 's2c', 'fluid', 'r3f', 'uml', 'dino', 'farmer', 'quyoubus', 'hpworkshop', 'cappadocia', 'zhangjiajie', 'niagara', 'fireflies', 'harbin', 'forbiddencity', 'brooksfalls'];
    document.body.style.overflow = fullScreen.includes(route) ? 'hidden' : 'auto';
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [route]);

  // Per-route document title for SEO / sharing / browser history.
  useEffect(() => {
    const titles: Record<Route, string> = {
      home: '大雷 Da Lei — AI 自动化 · 创意编程 · 开源工具',
      particles: 'Kinetic Particles · 大雷',
      arsenal: 'AI Coding Arsenal · 大雷 AI 编程装备库',
      md: 'Markdown 工具箱 · 大雷',
      img: '图片工具箱 · 大雷',
      s2c: '截图转代码 · 大雷',
      fluid: 'Fluid 流体 · 大雷',
      r3f: '3D 起手式 · 大雷',
      'ttt-hour-of-code': '从 TTT 到代码一小时 · 大雷 Workshop',
      'hear-the-universe': '听见宇宙 · 中文无障碍代码一小时 · 大雷',
      bench: '大雷 AI 评测台 · Da Lei AI Benchmark',
      fugu: 'Fugu / TRINITY 复现验证 · Da Lei Research',
      copilot: 'Microsoft Copilot / Agent 产品矩阵 · 大雷',
      copilotcamp: 'Copilot Camp · Cowork 设置与扩展学习课 · 大雷',
      promptforge: '提示词锻造台 · PromptForge · 大雷',
      notebooklm: 'NotebookLM 线画幻灯片提示词 · 大雷',
      aihtml: 'AI 做看得见的 HTML 小工具 · Workshop · 大雷',
      text2image: '文生图提示词工坊 · Text-to-Image · Workshop · 大雷',
      farmer: '农夫过河 3D · Farmer Crosses the River · 大雷',
      quyoubus: '趣游巴士 · AI 夜游 · Quyou Bus 3D · 大雷',
      hpworkshop: 'AI 实战工作坊演示面板 · 9 个 Copilot 案例 · 大雷',
      agents: 'Agent 模板库 · Agent Templates · 大雷',
      skills: 'Skill 技能库 · Skill Library · 大雷',
      uml: 'PlantUML 渲染器 · 大雷',
      town: 'Smallville 小镇 · 生成式智能体 · 大雷',
      patterns: 'Agent 设计模式 · Agent Design Patterns · 大雷',
      prompts: '提示词库 · Prompt Library · 大雷',
      cici: 'CICI 指数 · 被人口辜负的城市（中国 · 日本）· 大雷',
      designskill: '设计 Skill 实测 · Design Skill Lab · 大雷',
      videogen: 'AI 视频生成流程 · 3 模型 1 Key · 大雷',
      dino: 'Dino Blaster · 加特林 vs 恐龙 · 大雷',
      chengdu: '成都指南 · 以太古里为原点 · 大雷',
      lab3d: '3D 提示词工作台 · 3D Prompt Lab · 大雷',
      cappadocia: '卡帕多奇亚热气球 · #26 已生成 · 大雷',
      zhangjiajie: '张家界雾中滑翔 · #30 已生成 · 大雷',
      niagara: '尼亚加拉活瀑布 · #53 已生成 · 大雷',
      fireflies: '萤火虫同步之光 · #56 已生成 · 大雷',
      harbin: '哈尔滨冰雪大世界 · #8 已生成 · 大雷',
      forbiddencity: '紫禁城初雪 · #9 已生成 · 大雷',
      brooksfalls: '布鲁克斯瀑布鲑鱼洄游 · #59 已生成 · 大雷',
    };
    document.title = titles[route];
  }, [route]);

  if (route === 'particles') {
    return (
      <Suspense fallback={<Loader label="LOADING PARTICLES…" />}>
        <App />
        <button
          onClick={() => navigate('/')}
          className="fixed left-4 top-4 z-[100] inline-flex items-center gap-2 rounded-full border border-white/20 bg-black/40 px-4 py-2 text-xs font-semibold text-white/85 backdrop-blur-md transition-colors hover:border-white/40 hover:text-white"
          style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
        >
          <span aria-hidden="true">←</span>
          Da Lei · 大雷
        </button>
      </Suspense>
    );
  }

  if (route === 'arsenal') {
    return (
      <Suspense fallback={<Loader label="LOADING ARSENAL…" />}>
        <Arsenal onHome={() => navigate('/')} onNavigate={navigate} />
      </Suspense>
    );
  }

  if (route === 'md') {
    return (
      <Suspense fallback={<Loader label="LOADING EDITOR…" />}>
        <MarkdownStudio onHome={() => navigate('/')} />
      </Suspense>
    );
  }

  if (route === 'img') {
    return (
      <Suspense fallback={<Loader label="LOADING IMAGE STUDIO…" />}>
        <ImageStudio onHome={() => navigate('/')} />
      </Suspense>
    );
  }

  if (route === 's2c') {
    return (
      <Suspense fallback={<Loader label="LOADING…" />}>
        <ScreenshotToCode onHome={() => navigate('/')} />
      </Suspense>
    );
  }

  if (route === 'fluid') {
    return (
      <Suspense fallback={<Loader label="LOADING FLUID…" />}>
        <FluidPlayground onHome={() => navigate('/')} />
      </Suspense>
    );
  }

  if (route === 'r3f') {
    return (
      <Suspense fallback={<Loader label="LOADING 3D…" />}>
        <ThreeOrb onHome={() => navigate('/')} />
      </Suspense>
    );
  }

  if (route === 'ttt-hour-of-code') {
    return (
      <Suspense fallback={<Loader label="LOADING WORKSHOP…" />}>
        <TTTHourOfCode onHome={() => navigate('/')} />
      </Suspense>
    );
  }

  if (route === 'hear-the-universe') {
    return (
      <Suspense fallback={<Loader label="正在连接宇宙通讯…" />}>
        <HearTheUniverse onHome={() => navigate('/')} />
      </Suspense>
    );
  }

  if (route === 'bench') {
    return (
      <Suspense fallback={<Loader label="LOADING BENCHMARK…" />}>
        <Bench onHome={() => navigate('/')} />
      </Suspense>
    );
  }

  if (route === 'fugu') {
    return (
      <Suspense fallback={<Loader label="LOADING RESEARCH…" />}>
        <Fugu onHome={() => navigate('/')} />
      </Suspense>
    );
  }

  if (route === 'copilot') {
    return (
      <Suspense fallback={<Loader label="LOADING…" />}>
        <Copilot onHome={() => navigate('/')} />
      </Suspense>
    );
  }

  if (route === 'copilotcamp') {
    return (
      <Suspense fallback={<Loader label="LOADING COURSE…" />}>
        <CopilotCamp onHome={() => navigate('/')} />
      </Suspense>
    );
  }

  if (route === 'promptforge') {
    return (
      <Suspense fallback={<Loader label="FORGING…" />}>
        <PromptForge onHome={() => navigate('/')} />
      </Suspense>
    );
  }

  if (route === 'notebooklm') {
    return (
      <Suspense fallback={<Loader label="LOADING…" />}>
        <NotebookLM onHome={() => navigate('/')} />
      </Suspense>
    );
  }

  if (route === 'aihtml') {
    return (
      <Suspense fallback={<Loader label="LOADING…" />}>
        <AIHtmlLab onHome={() => navigate('/')} />
      </Suspense>
    );
  }

  if (route === 'text2image') {
    return (
      <Suspense fallback={<Loader label="LOADING STUDIO…" />}>
        <Text2Image onHome={() => navigate('/')} />
      </Suspense>
    );
  }

  if (route === 'farmer') {
    return (
      <Suspense fallback={<Loader label="LAUNCHING THE BOAT…" />}>
        <FarmerRiver onHome={() => navigate('/')} />
      </Suspense>
    );
  }

  if (route === 'quyoubus') {
    return (
      <Suspense fallback={<Loader label="BOARDING THE BUS…" />}>
        <QuyouBus onHome={() => navigate('/')} />
      </Suspense>
    );
  }

  if (route === 'hpworkshop') {
    return (
      <Suspense fallback={<Loader label="LOADING WORKSHOP…" />}>
        <HPWorkshop onHome={() => navigate('/')} />
      </Suspense>
    );
  }

  if (route === 'agents') {
    return (
      <Suspense fallback={<Loader label="LOADING AGENTS…" />}>
        <Agents onHome={() => navigate('/')} />
      </Suspense>
    );
  }

  if (route === 'skills') {
    return (
      <Suspense fallback={<Loader label="LOADING SKILLS…" />}>
        <Skills onHome={() => navigate('/')} />
      </Suspense>
    );
  }

  if (route === 'uml') {
    return (
      <Suspense fallback={<Loader label="LOADING PLANTUML…" />}>
        <PlantUML onHome={() => navigate('/')} />
      </Suspense>
    );
  }

  if (route === 'town') {
    return (
      <Suspense fallback={<Loader label="LOADING SMALLVILLE…" />}>
        <Smallville onHome={() => navigate('/')} />
      </Suspense>
    );
  }

  if (route === 'patterns') {
    return (
      <Suspense fallback={<Loader label="LOADING…" />}>
        <Patterns onHome={() => navigate('/')} />
      </Suspense>
    );
  }

  if (route === 'prompts') {
    return (
      <Suspense fallback={<Loader label="LOADING PROMPTS…" />}>
        <Prompts onHome={() => navigate('/')} />
      </Suspense>
    );
  }

  if (route === 'cici') {
    return (
      <Suspense fallback={<Loader label="LOADING CICI…" />}>
        <CICI onHome={() => navigate('/')} />
      </Suspense>
    );
  }

  if (route === 'designskill') {
    return (
      <Suspense fallback={<Loader label="LOADING…" />}>
        <DesignSkill onHome={() => navigate('/')} />
      </Suspense>
    );
  }

  if (route === 'videogen') {
    return (
      <Suspense fallback={<Loader label="LOADING…" />}>
        <VideoGen onHome={() => navigate('/')} />
      </Suspense>
    );
  }

  if (route === 'dino') {
    return (
      <Suspense fallback={<Loader label="LOADING DINOS…" />}>
        <DinoBlaster onHome={() => navigate('/')} />
      </Suspense>
    );
  }

  if (route === 'chengdu') {
    return (
      <Suspense fallback={<Loader label="LOADING…" />}>
        <Chengdu onHome={() => navigate('/')} />
      </Suspense>
    );
  }

  if (route === 'lab3d') {
    return (
      <Suspense fallback={<Loader label="LOADING 3D LAB…" />}>
        <Lab3D onHome={() => navigate('/')} onNavigate={navigate} />
      </Suspense>
    );
  }

  if (route === 'cappadocia') {
    return (
      <Suspense fallback={<Loader label="INFLATING BALLOONS…" />}>
        <Cappadocia onBack={() => navigate('/lab3d')} />
      </Suspense>
    );
  }

  if (route === 'zhangjiajie') {
    return (
      <Suspense fallback={<Loader label="RAISING THE PILLARS…" />}>
        <Zhangjiajie onBack={() => navigate('/lab3d')} />
      </Suspense>
    );
  }

  if (route === 'niagara') {
    return (
      <Suspense fallback={<Loader label="OPENING THE FALLS…" />}>
        <Niagara onBack={() => navigate('/lab3d')} />
      </Suspense>
    );
  }

  if (route === 'fireflies') {
    return (
      <Suspense fallback={<Loader label="WAKING THE FIREFLIES…" />}>
        <Fireflies onBack={() => navigate('/lab3d')} />
      </Suspense>
    );
  }

  if (route === 'harbin') {
    return (
      <Suspense fallback={<Loader label="CARVING THE ICE CITY…" />}>
        <Harbin onBack={() => navigate('/lab3d')} />
      </Suspense>
    );
  }

  if (route === 'forbiddencity') {
    return (
      <Suspense fallback={<Loader label="SNOW ON THE PALACE…" />}>
        <ForbiddenCity onBack={() => navigate('/lab3d')} />
      </Suspense>
    );
  }

  if (route === 'brooksfalls') {
    return (
      <Suspense fallback={<Loader label="THE RUN BEGINS…" />}>
        <BrooksFalls onBack={() => navigate('/lab3d')} />
      </Suspense>
    );
  }

  return <Home onNavigate={navigate} />;
};

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Could not find root element to mount to');
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <Router />
  </React.StrictMode>
);
