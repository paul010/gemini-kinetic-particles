import React, { useEffect, useRef, useState } from 'react';
import { FluidBackground } from './components/FluidBackground';
import {
  COPY,
  PROJECTS,
  SOCIALS,
  ASSETS,
  CHANNEL,
  VIDEOS,
  fetchLatestVideos,
  youtubeWatch,
  youtubeThumb,
  VideoItem,
  Lang,
  LocalizedText,
  Project,
} from './data/site';

interface HomeProps {
  onNavigate: (path: string) => void;
}

// v2 key: ignores any auto-detected 'zh' stored by the earlier version so the
// site always defaults to English unless the visitor explicitly picks 中文.
const STORAGE_KEY = 'dalei-lang-v2';

/** Always default to English; only switch if the visitor explicitly chose 简/繁. */
const detectInitialLang = (): Lang => {
  if (typeof window === 'undefined') return 'en';
  const saved = window.localStorage.getItem(STORAGE_KEY);
  return saved === 'zh' || saved === 'zhHant' ? saved : 'en';
};

/**
 * Simplified → Traditional via OpenCC, lazy-loaded only when 繁體 is chosen
 * (keeps it out of the default bundle). Returns the converter once ready.
 */
let _s2t: ((s: string) => string) | null = null;
const useS2T = (active: boolean) => {
  const [conv, setConv] = useState<((s: string) => string) | null>(() => _s2t);
  useEffect(() => {
    if (!active || _s2t) {
      if (_s2t && !conv) setConv(() => _s2t);
      return;
    }
    let alive = true;
    import('opencc-js')
      .then((m) => {
        _s2t = m.Converter({ from: 'cn', to: 'tw' });
        if (alive) setConv(() => _s2t);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [active, conv]);
  return conv;
};

const prefersReduced = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- Icons ---------- */

const GitHubIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
    <path d="M12 .5C5.73.5.5 5.74.5 12.02c0 5.1 3.29 9.41 7.86 10.94.58.11.79-.25.79-.56 0-.28-.01-1.02-.02-2-3.2.7-3.88-1.54-3.88-1.54-.53-1.34-1.29-1.7-1.29-1.7-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.2 1.77 1.2 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.23-1.28-5.23-5.7 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11.1 11.1 0 0 1 2.9-.39c.98 0 1.97.13 2.9.39 2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.84 1.19 3.1 0 4.43-2.69 5.41-5.25 5.69.41.36.78 1.07.78 2.16 0 1.56-.01 2.82-.01 3.2 0 .31.21.68.8.56A11.53 11.53 0 0 0 23.5 12.02C23.5 5.74 18.27.5 12 .5Z" />
  </svg>
);

const YouTubeIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
    <path d="M23.5 6.2a3.02 3.02 0 0 0-2.12-2.14C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.38.56A3.02 3.02 0 0 0 .5 6.2C0 8.07 0 12 0 12s0 3.93.5 5.8a3.02 3.02 0 0 0 2.12 2.14c1.88.56 9.38.56 9.38.56s7.5 0 9.38-.56a3.02 3.02 0 0 0 2.12-2.14C24 15.93 24 12 24 12s0-3.93-.5-5.8ZM9.6 15.5v-7l6.2 3.5-6.2 3.5Z" />
  </svg>
);

const XIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
    <path d="M18.24 2.25h3.31l-7.23 8.26 8.5 11.24h-6.65l-5.21-6.82-5.97 6.82H1.68l7.73-8.83L1.25 2.25h6.82l4.71 6.23 5.46-6.23Zm-1.16 17.52h1.83L7.01 4.12H5.04l12.04 15.65Z" />
  </svg>
);

const MailIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="m3 7 9 6 9-6" />
  </svg>
);

const PlayIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
    <path d="M8 5v14l11-7z" />
  </svg>
);

const StarIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
    <path d="M12 2.5l2.6 6.3 6.8.5-5.2 4.4 1.6 6.6L12 17.3 6.2 20.8l1.6-6.6L2.6 9.8l6.8-.5L12 2.5Z" />
  </svg>
);

const ArrowIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

const ArrowUpRight = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
    <path d="M7 17 17 7M8 7h9v9" />
  </svg>
);

/* ---------- Reveal on scroll ---------- */

const useReveal = () => {
  useEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>('.reveal'));
    if (!('IntersectionObserver' in window)) {
      els.forEach((el) => el.classList.add('is-visible'));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('is-visible');
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
};

/* ---------- Scroll progress bar ---------- */

const useScrollProgress = (ref: React.RefObject<HTMLDivElement>) => {
  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const el = ref.current;
      if (!el) return;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const p = max > 0 ? Math.min(1, window.scrollY / max) : 0;
      el.style.transform = `scaleX(${p})`;
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      cancelAnimationFrame(raf);
    };
  }, [ref]);
};

/* ---------- Magnetic wrapper (subtle pull toward cursor) ---------- */

const Magnetic: React.FC<{ children: React.ReactNode; strength?: number; className?: string }> = ({
  children,
  strength = 0.3,
  className,
}) => {
  const ref = useRef<HTMLSpanElement>(null);

  const onMove = (e: React.MouseEvent) => {
    if (prefersReduced()) return;
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - (r.left + r.width / 2)) * strength;
    const y = (e.clientY - (r.top + r.height / 2)) * strength;
    el.style.transform = `translate(${x}px, ${y}px)`;
  };
  const reset = () => {
    if (ref.current) ref.current.style.transform = '';
  };

  return (
    <span ref={ref} className={`magnetic ${className ?? ''}`} onMouseMove={onMove} onMouseLeave={reset}>
      {children}
    </span>
  );
};

/* ---------- Pointer-driven 3D tilt ---------- */

const useTilt = (max = 6) => {
  const ref = useRef<HTMLDivElement>(null);
  const onMove = (e: React.MouseEvent) => {
    if (prefersReduced()) return;
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    el.style.transform = `perspective(1100px) rotateX(${-py * max}deg) rotateY(${px * max}deg)`;
  };
  const reset = () => {
    if (ref.current) ref.current.style.transform = '';
  };
  return { ref, onMouseMove: onMove, onMouseLeave: reset };
};

/* ---------- Typewriter ---------- */

const Typewriter: React.FC<{ text: string; className?: string; speed?: number }> = ({
  text,
  className,
  speed = 24,
}) => {
  const chars = React.useMemo(() => Array.from(text), [text]);
  const [count, setCount] = useState(() => (prefersReduced() ? chars.length : 0));

  useEffect(() => {
    if (prefersReduced()) {
      setCount(chars.length);
      return;
    }
    setCount(0);
    let i = 0;
    const id = window.setInterval(() => {
      i += 1;
      setCount(i);
      if (i >= chars.length) window.clearInterval(id);
    }, speed);
    return () => window.clearInterval(id);
  }, [chars, speed]);

  const done = count >= chars.length;

  // An invisible full-text copy reserves the final height so nothing reflows
  // while typing; the visible text is layered on top.
  return (
    <span className={`relative block ${className ?? ''}`} aria-label={text}>
      <span className="invisible" aria-hidden="true">
        {text}
      </span>
      <span className="absolute inset-0" aria-hidden="true">
        {chars.slice(0, count).join('')}
        <span className={`type-cursor ${done ? 'type-cursor--done' : ''}`}>▌</span>
      </span>
    </span>
  );
};

/* ---------- Small pieces ---------- */

const statusBadge = (status: Project['status'], t: (txt: LocalizedText) => string) => {
  const map = {
    live: { en: 'Live', zh: '已上线', cls: 'text-accent border-accent/40 bg-accent/10' },
    wip: { en: 'In progress', zh: '开发中', cls: 'text-ember border-ember/40 bg-ember/10' },
    soon: { en: 'Coming soon', zh: '敬请期待', cls: 'text-accent2 border-accent2/40 bg-accent2/10' },
  } as const;
  const s = map[status];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-mono text-[11px] uppercase tracking-wider ${s.cls}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {t({ en: s.en, zh: s.zh })}
    </span>
  );
};

const projectLinkColor = (kind: string) =>
  kind === 'internal' || kind === 'live' ? 'text-accent' : 'text-ink/75';

/* ---------- Featured project (large split card) ---------- */

const FeaturedCard: React.FC<{
  project: Project;
  lang: Lang;
  t: (txt: LocalizedText) => string;
  onInternal: (href: string) => void;
}> = ({ project: p, lang, t, onInternal }) => {
  const tilt = useTilt(5);
  const launchLink = p.links.find((l) => l.kind === 'internal');
  const launchHref = launchLink?.href ?? '/particles';
  const launchLabel = launchLink ? t(launchLink.label) : t(COPY.hero.ctaLaunch);
  return (
  <article
    ref={tilt.ref}
    onMouseMove={tilt.onMouseMove}
    onMouseLeave={tilt.onMouseLeave}
    className="project-card tilt reveal flex flex-col overflow-hidden rounded-3xl border border-ink/10 bg-surface/60 backdrop-blur-sm lg:flex-row"
  >
    {p.cover && (
      <button
        onClick={() => onInternal(launchHref)}
        className="group relative block overflow-hidden lg:w-[55%]"
        aria-label={p.title}
      >
        <img
          src={p.cover}
          alt={p.title}
          loading="lazy"
          className="h-64 w-full object-cover transition-transform duration-700 group-hover:scale-[1.04] sm:h-80 lg:h-full"
        />
        <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-surface/85 via-transparent to-transparent lg:bg-gradient-to-r" />
        <span className="absolute bottom-4 left-4 inline-flex items-center gap-2 rounded-full border border-paper/25 bg-black/45 px-3.5 py-1.5 text-xs font-semibold text-paper/90 backdrop-blur-md transition-colors group-hover:border-paper/60 group-hover:text-paper">
          {launchLabel}
          <ArrowIcon className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
        </span>
      </button>
    )}

    <div className="flex flex-1 flex-col justify-center p-7 sm:p-9 lg:p-10">
      <div className="mb-5 flex items-center justify-between gap-3">
        {statusBadge(p.status, t)}
        <span className="font-mono text-xs text-ink/40">{p.year}</span>
      </div>

      <h3 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">{p.title}</h3>
      <p className="mt-3 text-sm font-medium text-accent/90">{t(p.tagline)}</p>
      <p className="mt-5 max-w-xl text-sm leading-relaxed text-ink/60">{t(p.description)}</p>

      <div className="mt-6 flex flex-wrap gap-2">
        {p.tags.map((tag) => (
          <span key={tag} className="rounded-md border border-ink/10 bg-ink/5 px-2.5 py-1 font-mono text-[11px] text-ink/55">
            {tag}
          </span>
        ))}
      </div>

      <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3">
        {p.links.map((l) => (
          <a
            key={l.href + l.kind}
            href={l.href}
            onClick={(e) => {
              if (l.kind === 'internal') {
                e.preventDefault();
                onInternal(l.href);
              }
            }}
            target={l.kind === 'internal' ? undefined : '_blank'}
            rel={l.kind === 'internal' ? undefined : 'noreferrer'}
            className={`link-underline inline-flex items-center gap-1.5 text-sm font-semibold ${projectLinkColor(l.kind)}`}
          >
            {t(l.label)}
            <ArrowUpRight className="h-3.5 w-3.5" />
          </a>
        ))}
      </div>
    </div>
  </article>
  );
};

/* ---------- Non-featured project (card in the grid) ---------- */

const ProjectCard: React.FC<{
  project: Project;
  index: number;
  lang: Lang;
  t: (txt: LocalizedText) => string;
  onInternal: (href: string) => void;
}> = ({ project: p, index, lang, t, onInternal }) => (
  <article className="reveal group flex flex-col rounded-2xl border border-ink/10 bg-surface/50 p-6 backdrop-blur-sm transition-all hover:-translate-y-1 hover:border-gold/40 sm:p-7">
    <div className="mb-4 flex items-center justify-between gap-3">
      <span className="font-mono text-xs text-gold">0{index}</span>
      <span className="font-mono text-xs text-ink/40">{p.year}</span>
    </div>

    <div className="flex flex-wrap items-center gap-3">
      <h3 className="font-display text-2xl font-semibold tracking-tight">{p.title}</h3>
      {statusBadge(p.status, t)}
    </div>
    <p className="mt-2 flex-1 text-sm leading-relaxed text-ink/60">{t(p.tagline)}</p>

    {p.tags.length > 0 && (
      <div className="mt-4 flex flex-wrap gap-2">
        {p.tags.map((tag) => (
          <span key={tag} className="rounded-md border border-ink/10 bg-ink/[0.03] px-2.5 py-1 font-mono text-[11px] text-ink/55">
            {tag}
          </span>
        ))}
      </div>
    )}

    <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 pt-1">
      {p.links.map((l) => (
        <a
          key={l.href + l.kind}
          href={l.href}
          onClick={(e) => {
            if (l.kind === 'internal') {
              e.preventDefault();
              onInternal(l.href);
            }
          }}
          target={l.kind === 'internal' ? undefined : '_blank'}
          rel={l.kind === 'internal' ? undefined : 'noreferrer'}
          className={`link-underline inline-flex items-center gap-1.5 text-sm font-semibold ${projectLinkColor(l.kind)}`}
        >
          {t(l.label)}
          <ArrowUpRight className="h-3.5 w-3.5" />
        </a>
      ))}
    </div>
  </article>
);

/* ---------- Hero portrait (editorial avatar plate) ---------- */

const HeroFigure: React.FC<{
  t: (txt: LocalizedText) => string;
  onOpen: () => void;
}> = ({ t, onOpen }) => {
  const plateRef = useRef<HTMLDivElement>(null);

  const onMove = (e: React.MouseEvent) => {
    if (prefersReduced()) return;
    const el = plateRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width - 0.5) * 14;
    const y = ((e.clientY - r.top) / r.height - 0.5) * 14;
    el.style.transform = `translate(${x}px, ${y}px)`;
  };
  const reset = () => {
    if (plateRef.current) plateRef.current.style.transform = '';
  };

  return (
    <figure className="hero-figure mx-auto w-full max-w-[20rem] lg:ml-auto lg:max-w-sm">
      <div
        ref={plateRef}
        onMouseMove={onMove}
        onMouseLeave={reset}
        onClick={onOpen}
        onKeyDown={(e) => (e.key === 'Enter' ? onOpen() : undefined)}
        role="button"
        tabIndex={0}
        aria-label="大雷 · Da Lei — YouTube"
        className="plate group relative aspect-[4/5] cursor-pointer transition-transform duration-300 ease-out"
      >
        <img src={ASSETS.avatar} alt="大雷 · Da Lei" />

        {/* readability scrim for the label */}
        <span className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/55 to-transparent" />

        {/* corner registration ticks */}
        <span className="pointer-events-none absolute left-3 top-3 h-4 w-4 border-l border-t border-paper/80" />
        <span className="pointer-events-none absolute right-3 top-3 h-4 w-4 border-r border-t border-paper/80" />
        <span className="pointer-events-none absolute bottom-3 left-3 h-4 w-4 border-b border-l border-paper/80" />
        <span className="pointer-events-none absolute bottom-3 right-3 h-4 w-4 border-b border-r border-paper/80" />

        <span className="pointer-events-none absolute bottom-5 left-5 font-mono text-[10px] uppercase tracking-[0.22em] text-paper/90">
          {t(CHANNEL.name)}
        </span>

        <span className="absolute right-5 top-5 inline-flex items-center gap-1.5 rounded-full border border-paper/30 bg-black/50 px-3 py-1.5 text-[11px] font-semibold text-paper opacity-0 backdrop-blur-md transition-all duration-300 group-hover:opacity-100">
          <YouTubeIcon className="h-3.5 w-3.5" />
          YouTube
        </span>
      </div>

      <figcaption className="mt-3 flex items-baseline justify-between gap-3">
        <span className="font-display text-lg italic text-ink/80">大雷 · Da Lei</span>
        <span className="font-mono text-[11px] uppercase tracking-[0.15em] text-ink/45">
          {CHANNEL.handle}
        </span>
      </figcaption>
    </figure>
  );
};

/* ---------- Main ---------- */

const Home: React.FC<HomeProps> = ({ onNavigate }) => {
  const [lang, setLang] = useState<Lang>(detectInitialLang);
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const s2t = useS2T(lang === 'zhHant');
  const t = (txt: LocalizedText) =>
    lang === 'en' ? txt.en : lang === 'zhHant' ? (s2t ? s2t(txt.zh) : txt.zh) : txt.zh;
  const progressRef = useRef<HTMLDivElement>(null);
  const [videos, setVideos] = useState<VideoItem[]>(VIDEOS);

  useReveal();
  useScrollProgress(progressRef);

  // Keep the videos list fresh from the dalei-youtube README; fall back silently
  // to the bundled list if the fetch/parse fails.
  useEffect(() => {
    let alive = true;
    fetchLatestVideos(6)
      .then((v) => {
        if (alive) setVideos(v);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang === 'zh' ? 'zh-CN' : lang === 'zhHant' ? 'zh-Hant' : 'en';
    window.localStorage.setItem(STORAGE_KEY, lang);
  }, [lang]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const navItems = [
    { id: 'home', label: COPY.nav.home },
    { id: 'work', label: COPY.nav.work },
    { id: 'videos', label: COPY.nav.videos },
    { id: 'about', label: COPY.nav.about },
    { id: 'now', label: COPY.nav.now },
    { id: 'connect', label: COPY.nav.connect },
  ];

  const goTo = (id: string) => {
    setMenuOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const featured = PROJECTS.filter((p) => p.featured);
  const rest = PROJECTS.filter((p) => !p.featured);

  return (
    <div className="home-root font-sans">
      <div ref={progressRef} className="scroll-progress" />
      <FluidBackground />
      <div className="bg-aurora" />
      <div className="bg-vignette" />
      <div className="bg-grain" />

      {/* Nav */}
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
          scrolled ? 'border-b border-ink/10 bg-paper/80 backdrop-blur-xl' : 'border-b border-transparent'
        }`}
      >
        <nav className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4 sm:px-8">
          <button
            onClick={() => goTo('home')}
            className="group flex items-center gap-2.5 font-display text-base font-semibold tracking-tight"
          >
            <span className="grid h-7 w-7 place-items-center rounded-md border border-ink/15 bg-ink/5 font-mono text-xs text-gold transition-colors group-hover:border-gold/50">
              大
            </span>
            <span>Da&nbsp;Lei</span>
          </button>

          <div className="hidden items-center gap-8 md:flex">
            {navItems.map((item, i) => (
              <button
                key={item.id}
                onClick={() => goTo(item.id)}
                className="link-underline text-sm text-ink/70 transition-colors hover:text-ink"
              >
                <span className="mr-1.5 font-mono text-[11px] text-gold">0{i + 1}</span>
                {t(item.label)}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <div className="inline-flex items-center rounded-full border border-ink/15 bg-ink/5 p-0.5 font-mono text-xs" role="group" aria-label="Language">
              {([['en', 'EN'], ['zh', '简'], ['zhHant', '繁']] as [Lang, string][]).map(([code, label]) => (
                <button
                  key={code}
                  onClick={() => setLang(code)}
                  aria-pressed={lang === code}
                  className={`rounded-full px-2.5 py-1 transition-colors ${
                    lang === code ? 'bg-accent text-paper' : 'text-ink/60 hover:text-ink'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="grid h-9 w-9 place-items-center rounded-full border border-ink/15 bg-ink/5 text-ink/80 md:hidden"
              aria-label="Menu"
            >
              <span className="text-lg leading-none">{menuOpen ? '×' : '≡'}</span>
            </button>
          </div>
        </nav>

        {menuOpen && (
          <div className="border-t border-ink/10 bg-paper/95 px-5 py-4 backdrop-blur-xl md:hidden">
            {navItems.map((item, i) => (
              <button
                key={item.id}
                onClick={() => goTo(item.id)}
                className="flex w-full items-center gap-3 py-2.5 text-left text-ink/80"
              >
                <span className="font-mono text-xs text-gold">0{i + 1}</span>
                {t(item.label)}
              </button>
            ))}
          </div>
        )}
      </header>

      <main className="mx-auto max-w-5xl px-5 sm:px-8">
        {/* Hero */}
        <section id="home" className="grid min-h-[92vh] items-center gap-12 pt-28 pb-20 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14">
          <div className="flex flex-col">
            <p className="hero-in mb-7 inline-flex w-fit items-center gap-2 rounded-full border border-ink/12 bg-ink/5 px-3.5 py-1.5 font-mono text-xs uppercase tracking-[0.18em] text-ink/65" style={{ animationDelay: '0.05s' }}>
              <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-gold" />
              {t(COPY.hero.eyebrow)}
            </p>

            <p className="hero-in font-mono text-sm text-gold" style={{ animationDelay: '0.15s' }}>{t(COPY.hero.greeting)} 大雷 👋</p>

            <h1 className="hero-in mt-3 font-display text-[2.9rem] font-semibold leading-[1.02] tracking-[-0.01em] sm:text-6xl lg:text-[4.4rem]" style={{ animationDelay: '0.25s' }}>
              <span className="block">{t(COPY.hero.titleLine1)}</span>
              <span className="block italic text-gradient">{t(COPY.hero.titleLine2)}</span>
            </h1>

            <div className="hero-in mt-7 max-w-xl text-base leading-relaxed text-ink/70 sm:text-lg" style={{ animationDelay: '0.4s' }}>
              <Typewriter key={lang} text={t(COPY.hero.intro)} />
            </div>

            <div className="hero-in mt-9 flex flex-wrap items-center gap-3" style={{ animationDelay: '0.55s' }}>
              <Magnetic strength={0.4}>
                <button
                  onClick={() => onNavigate('/particles')}
                  className="btn-sheen group inline-flex items-center gap-2 rounded-full bg-accent px-5 py-3 text-sm font-semibold text-paper transition-transform hover:scale-[1.03]"
                >
                  {t(COPY.hero.ctaLaunch)}
                  <ArrowIcon className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </button>
              </Magnetic>
              <Magnetic strength={0.4}>
                <button
                  onClick={() => goTo('work')}
                  className="inline-flex items-center gap-2 rounded-full border border-ink/15 bg-ink/5 px-5 py-3 text-sm font-semibold text-ink/85 transition-colors hover:border-ink/30 hover:text-ink"
                >
                  {t(COPY.hero.ctaWork)}
                </button>
              </Magnetic>
            </div>

            <div className="hero-in mt-12 flex flex-wrap items-center gap-5 text-ink/55" style={{ animationDelay: '0.7s' }}>
              <a href={SOCIALS.github} target="_blank" rel="noreferrer" className="transition-colors hover:text-ink" aria-label="GitHub">
                <GitHubIcon className="h-5 w-5" />
              </a>
              <a href={SOCIALS.youtube} target="_blank" rel="noreferrer" className="transition-colors hover:text-ink" aria-label="YouTube">
                <YouTubeIcon className="h-5 w-5" />
              </a>
              <a href={SOCIALS.twitter} target="_blank" rel="noreferrer" className="transition-colors hover:text-ink" aria-label="X">
                <XIcon className="h-[18px] w-[18px]" />
              </a>
              <a href={SOCIALS.email} className="transition-colors hover:text-accent" aria-label="Email">
                <MailIcon className="h-5 w-5" />
              </a>
              <span className="font-mono text-xs tracking-wide text-ink/35">@dalei2025 · @paul010318</span>
            </div>
          </div>

          <div className="hero-in" style={{ animationDelay: '0.5s' }}>
            <HeroFigure t={t} onOpen={() => window.open(SOCIALS.youtube, '_blank', 'noopener')} />
          </div>
        </section>

        {/* Work */}
        <section id="work" className="scroll-mt-24 py-20">
          <div className="reveal mb-12 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-gold">{t(COPY.work.label)}</p>
              <h2 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">{t(COPY.work.heading)}</h2>
            </div>
            <p className="max-w-sm text-sm text-ink/55 sm:text-right">{t(COPY.work.sub)}</p>
          </div>

          <div className="flex flex-col gap-6">
            {featured.map((p) => (
              <FeaturedCard key={p.id} project={p} lang={lang} t={t} onInternal={onNavigate} />
            ))}

            {rest.length > 0 && (
              <div className="reveal mt-6 flex items-baseline justify-between gap-3 border-t border-ink/10 pt-8">
                <h3 className="font-mono text-xs uppercase tracking-[0.2em] text-gold">{t(COPY.work.tools)}</h3>
                <p className="font-mono text-[11px] text-ink/45">{t(COPY.work.toolsSub)}</p>
              </div>
            )}
            {rest.length > 0 && (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-2">
                {rest.map((p, i) => (
                  <ProjectCard key={p.id} project={p} index={featured.length + i + 1} lang={lang} t={t} onInternal={onNavigate} />
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Videos */}
        <section id="videos" className="scroll-mt-24 py-20">
          <div className="reveal mb-12 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-gold">{t(COPY.videos.label)}</p>
              <h2 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">{t(COPY.videos.heading)}</h2>
              <p className="mt-3 max-w-md text-sm text-ink/55">{t(COPY.videos.sub)}</p>
            </div>
            <a
              href={SOCIALS.youtube}
              target="_blank"
              rel="noreferrer"
              className="link-underline inline-flex w-fit items-center gap-1.5 text-sm font-semibold text-accent"
            >
              {t(COPY.videos.all)}
              <ArrowUpRight className="h-3.5 w-3.5" />
            </a>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {videos.map((v, i) => (
              <a
                key={v.id}
                href={youtubeWatch(v.id)}
                target="_blank"
                rel="noreferrer"
                className="video-card reveal group flex flex-col"
                style={{ transitionDelay: `${(i % 3) * 80}ms` }}
              >
                <div className="relative aspect-video overflow-hidden rounded-xl border border-ink/10 bg-surface">
                  <img
                    src={youtubeThumb(v.id)}
                    alt={t(v.title)}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.05]"
                  />
                  <span className="absolute bottom-2 right-2 rounded bg-black/75 px-1.5 py-0.5 font-mono text-[11px] text-white">
                    {v.duration}
                  </span>
                  <span className="absolute inset-0 grid place-items-center">
                    <span className="grid h-12 w-12 scale-90 place-items-center rounded-full bg-paper/90 text-ink opacity-0 shadow-lg transition-all duration-300 group-hover:scale-100 group-hover:opacity-100">
                      <PlayIcon className="ml-0.5 h-5 w-5" />
                    </span>
                  </span>
                </div>
                <h3 className="mt-3 line-clamp-2 text-sm font-semibold leading-snug text-ink/90 transition-colors group-hover:text-ink">
                  {t(v.title)}
                </h3>
                <p className="mt-1.5 font-mono text-[11px] uppercase tracking-wider text-ink/40">
                  {v.date} · {v.duration}
                </p>
              </a>
            ))}
          </div>

          {/* Membership CTA */}
          <div className="reveal mt-10 flex flex-col items-start justify-between gap-5 overflow-hidden rounded-2xl border border-gold/30 bg-gold/[0.06] p-7 sm:flex-row sm:items-center sm:p-8">
            <div className="flex items-start gap-4">
              <span className="mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-full border border-gold/40 bg-gold/10 text-gold">
                <StarIcon className="h-5 w-5" />
              </span>
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.2em] text-gold">{t(COPY.membership.label)}</p>
                <h3 className="mt-1.5 font-display text-2xl font-semibold tracking-tight">{t(COPY.membership.heading)}</h3>
                <p className="mt-1 max-w-md text-sm leading-relaxed text-ink/60">{t(COPY.membership.sub)}</p>
              </div>
            </div>
            <Magnetic strength={0.35}>
              <a
                href={SOCIALS.membership}
                target="_blank"
                rel="noreferrer"
                className="btn-sheen inline-flex shrink-0 items-center gap-2 rounded-full bg-gold px-5 py-3 text-sm font-semibold text-paper transition-transform hover:scale-[1.03]"
              >
                <StarIcon className="h-4 w-4" />
                {t(COPY.membership.cta)}
              </a>
            </Magnetic>
          </div>
        </section>

        {/* About */}
        <section id="about" className="scroll-mt-24 py-20">
          <div className="grid gap-12 lg:grid-cols-[1fr_1.1fr] lg:gap-16">
            <div className="reveal">
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-gold">{t(COPY.about.label)}</p>
              <h2 className="mt-3 font-display text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
                {t(COPY.about.heading)}
              </h2>
              <p className="mt-6 text-base leading-relaxed text-ink/65">{t(COPY.about.body)}</p>
            </div>

            <div className="grid gap-4 self-center">
              {COPY.about.pillars.map((pillar, i) => (
                <div
                  key={i}
                  className="reveal flex items-start gap-4 rounded-xl border border-ink/10 bg-surface/50 p-5 backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:border-accent/30"
                  style={{ transitionDelay: `${i * 90}ms` }}
                >
                  <span className="mt-0.5 font-mono text-sm text-gold">0{i + 1}</span>
                  <div>
                    <h3 className="font-display text-lg font-semibold">{t(pillar.title)}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-ink/55">{t(pillar.text)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Now */}
        <section id="now" className="scroll-mt-24 py-20">
          <div className="reveal rounded-3xl border border-ink/10 bg-surface/40 p-8 backdrop-blur-sm sm:p-12">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.2em] text-gold">
                <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-gold" />
                {t(COPY.now.label)}
              </p>
              <span className="font-mono text-[11px] text-ink/40">{t(COPY.now.updated)}</span>
            </div>
            <h2 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">{t(COPY.now.heading)}</h2>
            <ul className="mt-6 flex flex-col gap-4">
              {COPY.now.items.map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-base leading-relaxed text-ink/70">
                  <span className="mt-1 font-mono text-sm text-gold">0{i + 1}</span>
                  <span>{t(item)}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Connect */}
        <section id="connect" className="scroll-mt-24 py-20">
          <div className="reveal relative overflow-hidden rounded-3xl border border-ink/10 bg-gradient-to-br from-surface/90 to-surface/40 p-8 backdrop-blur-sm sm:p-14">
            <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-accent/10 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-accent2/10 blur-3xl" />

            <p className="font-mono text-xs uppercase tracking-[0.2em] text-gold">{t(COPY.connect.label)}</p>
            <h2 className="mt-3 max-w-xl font-display text-3xl font-bold tracking-tight sm:text-5xl">
              {t(COPY.connect.heading)}
            </h2>
            <p className="mt-5 max-w-md text-sm leading-relaxed text-ink/60 sm:text-base">{t(COPY.connect.sub)}</p>

            <div className="mt-9 grid gap-3 sm:grid-cols-2">
              {[
                { icon: <GitHubIcon className="h-5 w-5" />, label: 'GitHub', handle: 'paul010', href: SOCIALS.github, external: true },
                { icon: <YouTubeIcon className="h-5 w-5" />, label: 'YouTube', handle: '@dalei2025', href: SOCIALS.youtube, external: true },
                { icon: <XIcon className="h-[18px] w-[18px]" />, label: 'X / Twitter', handle: '@paul010318', href: SOCIALS.twitter, external: true },
                { icon: <MailIcon className="h-5 w-5" />, label: 'Email', handle: 'panlei318@gmail.com', href: SOCIALS.email, external: false },
              ].map((s, i) => (
                <a
                  key={s.label}
                  href={s.href}
                  target={s.external ? '_blank' : undefined}
                  rel={s.external ? 'noreferrer' : undefined}
                  className="reveal group flex items-center gap-3 rounded-xl border border-ink/10 bg-ink/5 p-4 transition-all hover:-translate-y-0.5 hover:border-accent/40 hover:bg-ink/[0.08]"
                  style={{ transitionDelay: `${i * 80}ms` }}
                >
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-ink/5 text-ink/80 transition-colors group-hover:text-accent">
                    {s.icon}
                  </span>
                  <span className="flex min-w-0 flex-col">
                    <span className="text-sm font-semibold">{s.label}</span>
                    <span className="truncate font-mono text-xs text-ink/45">{s.handle}</span>
                  </span>
                  <ArrowUpRight className="ml-auto h-4 w-4 shrink-0 text-ink/30 transition-all group-hover:translate-x-0.5 group-hover:text-accent" />
                </a>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-ink/10">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 px-5 py-8 sm:flex-row sm:px-8">
          <div className="flex items-center gap-2.5 font-display text-sm font-semibold">
            <span className="grid h-6 w-6 place-items-center rounded border border-ink/15 bg-ink/5 font-mono text-[10px] text-gold">大</span>
            Da Lei · 大雷
          </div>
          <div className="flex items-center gap-4">
            <p className="font-mono text-xs text-ink/40">
              © {new Date().getFullYear()} · {t(COPY.footer.tagline)}
            </p>
            <button
              onClick={() => goTo('home')}
              className="inline-flex items-center gap-1 rounded-full border border-ink/15 bg-ink/5 px-3 py-1.5 font-mono text-[11px] text-ink/60 transition-colors hover:border-gold/50 hover:text-ink"
              aria-label="回到顶部"
            >
              ↑ Top
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
