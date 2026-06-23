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

const Loader: React.FC<{ label: string }> = ({ label }) => (
  <div
    className="fixed inset-0 grid place-items-center bg-ink text-white/70"
    style={{ fontFamily: '"JetBrains Mono", monospace' }}
  >
    <div className="flex flex-col items-center gap-3">
      <span className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-accent" />
      <span className="text-xs tracking-widest">{label}</span>
    </div>
  </div>
);

type Route = 'home' | 'particles' | 'arsenal' | 'md' | 'img' | 's2c' | 'fluid' | 'r3f';

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
    document.body.style.overflow = route === 'particles' || route === 'md' || route === 's2c' || route === 'fluid' || route === 'r3f' ? 'hidden' : 'auto';
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
