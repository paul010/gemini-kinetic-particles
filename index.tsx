import React, { useEffect, useState, useCallback, Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import Home from './Home';

// Three.js + the particle engine only load when the experience is opened.
const App = React.lazy(() => import('./App'));

const ParticlesLoader: React.FC = () => (
  <div
    className="fixed inset-0 grid place-items-center bg-ink text-white/70"
    style={{ fontFamily: '"JetBrains Mono", monospace' }}
  >
    <div className="flex flex-col items-center gap-3">
      <span className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-accent" />
      <span className="text-xs tracking-widest">LOADING PARTICLES…</span>
    </div>
  </div>
);

const isParticlesPath = () => {
  const { pathname, hash } = window.location;
  return pathname.replace(/\/+$/, '').endsWith('/particles') || hash === '#/particles';
};

const Router: React.FC = () => {
  const [onParticles, setOnParticles] = useState<boolean>(isParticlesPath());

  const navigate = useCallback((path: string) => {
    if (window.location.pathname !== path) {
      window.history.pushState({}, '', path);
    }
    setOnParticles(path.replace(/\/+$/, '').endsWith('/particles'));
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const onPop = () => setOnParticles(isParticlesPath());
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  // The particle experience is a fixed full-screen canvas; the homepage scrolls.
  useEffect(() => {
    document.body.style.overflow = onParticles ? 'hidden' : 'auto';
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [onParticles]);

  if (onParticles) {
    return (
      <Suspense fallback={<ParticlesLoader />}>
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
