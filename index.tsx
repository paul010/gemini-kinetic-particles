import React, { useEffect, useState, useCallback, Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import Home from './Home';

// Heavier routes load on demand so the homepage bundle stays small.
const App = React.lazy(() => import('./App'));
const Arsenal = React.lazy(() => import('./arsenal/Arsenal'));

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

type Route = 'home' | 'particles' | 'arsenal';

const routeFromLocation = (): Route => {
  const { pathname, hash } = window.location;
  const p = pathname.replace(/\/+$/, '');
  if (p.endsWith('/particles') || hash === '#/particles') return 'particles';
  if (p.endsWith('/arsenal') || hash === '#/arsenal') return 'arsenal';
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
    document.body.style.overflow = route === 'particles' ? 'hidden' : 'auto';
    return () => {
      document.body.style.overflow = 'auto';
    };
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
        <Arsenal onHome={() => navigate('/')} />
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
