import React, { Suspense, useEffect, useRef, useState } from 'react';

// The ⌘K palette ships as its own chunk, fetched on first open - it never
// blocks the homepage's first paint.
const SearchPalette = React.lazy(() => import('./components/SearchPalette'));
// The ambient WebGL fluid is decorative. Keep it out of the initial bundle and
// only load it after a desktop visitor starts interacting with the page.
const FluidBackground = React.lazy(() =>
  import('./components/FluidBackground').then((module) => ({ default: module.FluidBackground }))
);
import {
  COPY,
  PROJECTS,
  SOCIALS,
  getEmail,
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

const NotionIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
    <path d="M4.6 3.4 14.8 2.6c1.3-.1 1.6 0 2.4.6l2.7 1.9c.5.4.7.5.7 1v13c0 .9-.3 1.4-1.5 1.5l-11.8.7c-.8 0-1.2-.1-1.6-.6l-2-2.6c-.4-.6-.6-1-.6-1.6V4.8c0-.7.3-1.3 1.1-1.4Zm.5 1.5c-.2.2-.1.4.2.6l1.9 1.4c.4.3.5.3 1 .3l11-.7c.2 0 .4-.1.2-.4L19 4.9c-.3-.2-.5-.3-1-.3l-11.7.7c-.3 0-.4.1-.2.6Zm9.4 3.6-7.7.5c-.3 0-.4.2-.4.5v9.2c0 .3.2.4.5.4l1.3-.1v-7l.4.5 4 5.7 1.7-.1V9.2l-1.6.1.1 5.1-3.9-5.5 1.6-.1V8.5Z" />
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

const SearchIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </svg>
);

/* ---------- Reveal on scroll ---------- */

const useReveal = (dep?: unknown) => {
  useEffect(() => {
    // Only the not-yet-revealed elements - so a re-run (e.g. after filtering
    // mounts new cards) picks up the newcomers without re-animating the rest.
    const els = Array.from(document.querySelectorAll<HTMLElement>('.reveal:not(.is-visible)'));
    if (!els.length) return;
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
  }, [dep]);
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

const responsiveCoverProps = (cover: string, sizes: string) => {
  if (!cover.endsWith('-1200.webp')) return { src: cover, sizes };
  return {
    src: cover,
    srcSet: `${cover.replace('-1200.webp', '-640.webp')} 640w, ${cover} 1200w`,
    sizes,
  };
};

/* ---------- Featured project (large split card) ---------- */

const FeaturedCard: React.FC<{
  project: Project;
  lang: Lang;
  t: (txt: LocalizedText) => string;
  onInternal: (href: string) => void;
}> = ({ project: p, lang, t, onInternal }) => {
  const tilt = useTilt(5);
  const [copied, setCopied] = useState(false);
  const [imgError, setImgError] = useState(false);
  const launchLink = p.links.find((l) => l.kind === 'internal');
  const externalLink = p.links.find((l) => l.kind !== 'internal');
  const launchLabel = launchLink ? t(launchLink.label) : externalLink ? t(externalLink.label) : t(COPY.hero.ctaLaunch);
  // Cover click: open the internal route if any, else the external link, else no-op.
  const onCover = () => {
    if (launchLink) onInternal(launchLink.href);
    else if (externalLink) window.open(externalLink.href, '_blank', 'noopener');
  };
  const copyPrompt = () => {
    if (!p.prompt) return;
    navigator.clipboard?.writeText(p.prompt).then(() => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    }).catch(() => {});
  };
  return (
  <article
    ref={tilt.ref}
    onMouseMove={tilt.onMouseMove}
    onMouseLeave={tilt.onMouseLeave}
    className="project-card tilt reveal flex flex-col overflow-hidden rounded-3xl border border-ink/10 bg-surface/60 backdrop-blur-sm lg:flex-row"
  >
    {p.cover && (
      <button
        onClick={onCover}
        className="group relative block overflow-hidden lg:w-[55%]"
        aria-label={t(p.title)}
      >
        {imgError ? (
          // Cover not available yet (e.g. asset still being uploaded) - show a
          // tasteful placeholder instead of a broken image.
          <div className="grid h-64 w-full place-items-center bg-gradient-to-br from-surface to-paper sm:h-80 lg:h-full">
            <div className="flex flex-col items-center gap-2 text-ink/35">
              <span className="font-display text-5xl">❝</span>
              <span className="font-mono text-[11px] uppercase tracking-wider">{t(p.title)}</span>
            </div>
          </div>
        ) : (
          <img
            {...responsiveCoverProps(p.cover, '(min-width: 1024px) 510px, 100vw')}
            alt={t(p.title)}
            loading="lazy"
            decoding="async"
            onError={() => setImgError(true)}
            className="h-64 w-full object-cover transition-transform duration-700 group-hover:scale-[1.04] sm:h-80 lg:h-full"
          />
        )}
        <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-surface/85 via-transparent to-transparent lg:bg-gradient-to-r" />
        <span className="absolute bottom-4 left-4 inline-flex items-center gap-2 rounded-full border border-paper/25 bg-black/45 px-3.5 py-1.5 text-xs font-semibold text-paper/90 backdrop-blur-md transition-colors group-hover:border-paper/60 group-hover:text-paper">
          {launchLabel}
          <ArrowIcon className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
        </span>
      </button>
    )}

    <div className="flex flex-1 flex-col justify-center p-7 sm:p-9 lg:p-10">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {p.signature && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-gold/40 bg-gold/10 px-2.5 py-0.5 font-mono text-[11px] uppercase tracking-wider text-gold">
              <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-gold" /> {t(COPY.work.signature)}
            </span>
          )}
          {statusBadge(p.status, t)}
        </div>
        <span className="font-mono text-xs text-ink/40">{p.year}</span>
      </div>

      <h3 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">{t(p.title)}</h3>
      <p className="mt-3 text-sm font-medium text-accent/90">{t(p.tagline)}</p>
      <p className="mt-5 line-clamp-4 max-w-xl text-sm leading-relaxed text-ink/60 sm:line-clamp-none">{t(p.description)}</p>

      {p.prompt && (
        <details className="group/prompt mt-5 rounded-xl border border-ink/10 bg-ink/[0.03] px-4 py-3">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-mono text-[11px] uppercase tracking-wider text-ink/55 [&::-webkit-details-marker]:hidden">
            <span className="inline-flex items-center gap-2">
              <span className="text-gold">❝</span> {t({ en: 'The prompt', zh: '提示词' })}
            </span>
            <span className="transition-transform group-open/prompt:rotate-180">▾</span>
          </summary>
          <p className="mt-3 whitespace-pre-wrap font-mono text-[12.5px] leading-relaxed text-ink/65">{p.prompt}</p>
          <button
            onClick={copyPrompt}
            className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-ink/15 bg-paper px-3 py-1 font-mono text-[11px] text-ink/70 transition-colors hover:border-gold/40 hover:text-gold"
          >
            {copied ? t({ en: 'Copied ✓', zh: '已复制 ✓' }) : t({ en: 'Copy', zh: '复制' })}
          </button>
        </details>
      )}

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

/* ---------- Compact project tile (grid card with cover thumbnail) ---------- */

const ProjectCard: React.FC<{
  project: Project;
  lang: Lang;
  t: (txt: LocalizedText) => string;
  onInternal: (href: string) => void;
  /** 'lg' renders the editors-pick variant: wider cover, bigger type. */
  size?: 'md' | 'lg';
}> = ({ project: p, lang, t, onInternal, size = 'md' }) => {
  const [imgError, setImgError] = useState(false);
  const lg = size === 'lg';
  const launchLink = p.links.find((l) => l.kind === 'internal');
  const externalLink = p.links.find((l) => l.kind !== 'internal');
  const primary = launchLink ?? externalLink;
  const onCover = () => {
    if (launchLink) onInternal(launchLink.href);
    else if (externalLink) window.open(externalLink.href, '_blank', 'noopener');
  };
  return (
    <article className="project-card reveal group flex flex-col overflow-hidden rounded-2xl border border-ink/10 bg-surface/50 backdrop-blur-sm transition-all hover:-translate-y-1 hover:border-gold/40">
      <button onClick={onCover} className={`relative block w-full overflow-hidden ${lg ? 'aspect-[16/9]' : 'aspect-[16/10]'}`} aria-label={t(p.title)}>
        {p.cover && !imgError ? (
          <img
            {...responsiveCoverProps(
              p.cover,
              lg ? '(min-width: 640px) 50vw, 100vw' : '(min-width: 1024px) 33vw, 50vw'
            )}
            alt={t(p.title)}
            loading="lazy"
            decoding="async"
            onError={() => setImgError(true)}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.05]" />
        ) : (
          // Cover-less tiles (in-browser tools) get a consistent on-palette
          // header: a large, faded category word so the grid stays even.
          <div className="grid h-full w-full place-items-center bg-gradient-to-br from-surface to-paper">
            <span className="px-4 text-center font-mono text-xl font-semibold uppercase tracking-[0.18em] text-ink/[0.13] sm:text-2xl">{p.tags[0] ?? 'TOOL'}</span>
          </div>
        )}
        <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-surface/35 to-transparent" />
        {p.signature && (
          <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full border border-gold/40 bg-paper/85 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-gold backdrop-blur-sm">
            <span className="pulse-dot h-1 w-1 rounded-full bg-gold" /> {t(COPY.work.signature)}
          </span>
        )}
      </button>
      <div className={`flex flex-1 flex-col ${lg ? 'p-5 sm:p-7' : 'p-4 sm:p-5'}`}>
        <div className="flex items-center justify-between gap-2">
          {statusBadge(p.status, t)}
          <span className="font-mono text-[11px] text-ink/40">{p.year}</span>
        </div>
        <h3 className={`mt-2.5 font-display font-semibold tracking-tight ${lg ? 'text-xl sm:text-2xl' : 'text-lg sm:text-xl'}`}>{t(p.title)}</h3>
        <p className={`mt-1.5 flex-1 leading-relaxed text-ink/60 ${lg ? 'line-clamp-3 text-sm sm:text-[15px]' : 'line-clamp-2 text-[13px] sm:text-sm'}`}>{t(p.tagline)}</p>
        {p.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {p.tags.slice(0, lg ? 4 : 3).map((tag) => (
              <span key={tag} className="hidden rounded-md border border-ink/10 bg-ink/[0.03] px-2 py-0.5 font-mono text-[10.5px] text-ink/55 sm:inline">{tag}</span>
            ))}
          </div>
        )}
        {primary && (
          <div className="mt-4 pt-1">
            <a
              href={primary.href}
              onClick={(e) => { if (primary.kind === 'internal') { e.preventDefault(); onInternal(primary.href); } }}
              target={primary.kind === 'internal' ? undefined : '_blank'}
              rel={primary.kind === 'internal' ? undefined : 'noreferrer'}
              className={`link-underline inline-flex items-center gap-1.5 text-sm font-semibold ${projectLinkColor(primary.kind)}`}
            >
              {t(primary.label)}
              <ArrowUpRight className="h-3.5 w-3.5" />
            </a>
          </div>
        )}
      </div>
    </article>
  );
};

/* ---------- Hero portrait (editorial avatar plate) ---------- */

const HeroFigure: React.FC<{
  t: (txt: LocalizedText) => string;
  onOpen: () => void;
}> = ({ t, onOpen }) => {
  const plateRef = useRef<HTMLButtonElement>(null);

  const onMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (e.pointerType === 'touch' || prefersReduced()) return;
    const el = plateRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    el.style.setProperty('--hero-rx', `${-y * 7}deg`);
    el.style.setProperty('--hero-ry', `${x * 9}deg`);
    el.style.setProperty('--hero-light-x', `${(x + 0.5) * 100}%`);
    el.style.setProperty('--hero-light-y', `${(y + 0.5) * 100}%`);
  };

  const reset = () => {
    const el = plateRef.current;
    if (!el) return;
    el.style.removeProperty('--hero-rx');
    el.style.removeProperty('--hero-ry');
    el.style.removeProperty('--hero-light-x');
    el.style.removeProperty('--hero-light-y');
  };

  return (
    <figure className="hero-figure mx-auto w-full max-w-[12rem] sm:max-w-[18rem] lg:ml-auto lg:max-w-sm">
      <button
        type="button"
        ref={plateRef}
        onPointerMove={onMove}
        onPointerLeave={reset}
        onClick={onOpen}
        aria-label={t({
          en: `Open ${CHANNEL.name.en} on YouTube`,
          zh: `在 YouTube 打开${CHANNEL.name.zh}`,
        })}
        className="clay-portrait group relative block aspect-[4/5] w-full cursor-pointer border-0 bg-transparent p-0 text-left"
      >
        <span className="clay-portrait__backing" aria-hidden="true" />
        <span className="clay-portrait__frame">
          <img
            src={ASSETS.heroClay.large}
            srcSet={`${ASSETS.heroClay.small} 480w, ${ASSETS.heroClay.large} 960w`}
            sizes="(min-width: 1024px) 384px, (min-width: 640px) 288px, 168px"
            alt={t({
              en: 'Handmade clay portrait of Da Lei on a brick-red background with yellow stars',
              zh: '砖红背景与黄色星星前的大雷手工粘土肖像',
            })}
            width="960"
            height="1200"
            decoding="async"
            fetchPriority="high"
          />
          <span className="clay-portrait__light" aria-hidden="true" />
        </span>
        <span className="clay-portrait__thumbprint" aria-hidden="true" />
      </button>

      <figcaption className="hero-figure__caption mt-4 flex items-center justify-between gap-3">
        <span className="whitespace-nowrap font-display text-base italic text-ink/80 sm:text-lg">大雷 · Da Lei</span>
        <span className="inline-flex whitespace-nowrap items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.12em] text-ink/55">
          <YouTubeIcon className="h-3.5 w-3.5 text-gold" />
          {CHANNEL.handle}
        </span>
      </figcaption>
    </figure>
  );
};

/* ---------- About spatial portrait ---------- */

const AboutScene: React.FC<{
  t: (txt: LocalizedText) => string;
}> = ({ t }) => {
  const stageRef = useRef<HTMLDivElement>(null);
  const [focus, setFocus] = useState<'all' | 'build' | 'share' | 'move'>('all');
  const modes = COPY.about.sceneModes;
  const activeMode = modes.find((mode) => mode.id === focus) ?? modes[0];

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'touch' || prefersReduced()) return;
    const stage = stageRef.current;
    if (!stage) return;
    const rect = stage.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    stage.style.setProperty('--about-rx', `${-y * 8}deg`);
    stage.style.setProperty('--about-ry', `${x * 10}deg`);
    stage.style.setProperty('--about-light-x', `${(x + 0.5) * 100}%`);
    stage.style.setProperty('--about-light-y', `${(y + 0.5) * 100}%`);
  };

  const reset = () => {
    const stage = stageRef.current;
    if (!stage) return;
    stage.style.removeProperty('--about-rx');
    stage.style.removeProperty('--about-ry');
    stage.style.removeProperty('--about-light-x');
    stage.style.removeProperty('--about-light-y');
  };

  return (
    <div
      ref={stageRef}
      className="about-stage reveal"
      data-focus={focus}
      onPointerMove={onPointerMove}
      onPointerLeave={reset}
      role="group"
      aria-label={t({
        en: 'A clay diorama of Da Lei building with AI, sharing videos, and running',
        zh: '大雷使用 AI 构建、分享视频和跑步的粘土微缩场景',
      })}
    >
      <div className="about-stage__scene">
        <figure className="about-stage__diorama">
          <div className="about-stage__image">
            <img
              src="/about-clay-1200.webp"
              srcSet="/about-clay-640.webp 640w, /about-clay-1200.webp 1200w"
              sizes="(min-width: 1024px) 390px, (min-width: 768px) 70vw, 88vw"
              alt={t({
                en: 'Handmade clay studio scene with Da Lei at a laptop, AI particles, a camera, a microphone, and running shoes',
                zh: '大雷坐在电脑前的手工粘土工作室，周围有 AI 粒子、摄像机、麦克风和跑鞋',
              })}
              loading="lazy"
              decoding="async"
            />
          </div>
        </figure>
      </div>

      <div className="about-story">
        <div
          className="about-story__controls"
          role="group"
          aria-label={t({ en: 'Explore Da Lei’s creative practice', zh: '探索大雷的创作方式' })}
        >
          {modes.map((mode) => (
            <button
              key={mode.id}
              type="button"
              aria-pressed={focus === mode.id}
              onClick={() => setFocus(mode.id as typeof focus)}
              className="about-story__button"
            >
              {t(mode.label)}
            </button>
          ))}
        </div>
        <div className="about-story__panel" aria-live="polite">
          <h3 className="font-display text-xl font-semibold tracking-tight">
            {t(activeMode.heading)}
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-ink/65">{t(activeMode.text)}</p>
        </div>
      </div>
    </div>
  );
};

/* ---------- Main ---------- */

const Home: React.FC<HomeProps> = ({ onNavigate }) => {
  const [lang, setLang] = useState<Lang>(detectInitialLang);
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState('home');
  const [searchOpen, setSearchOpen] = useState(false);
  const [workFilter, setWorkFilter] = useState<'all' | 'ai' | 'creative' | 'tool'>('all');
  const [showAllProjects, setShowAllProjects] = useState(false);
  const [fluidReady, setFluidReady] = useState(false);
  // Theme is resolved pre-paint by the index.html boot script; this just mirrors it.
  const [theme, setTheme] = useState<'light' | 'dark'>(() =>
    typeof document !== 'undefined' && document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light'
  );
  const toggleTheme = () => {
    setTheme((prev) => {
      const next = prev === 'light' ? 'dark' : 'light';
      document.documentElement.dataset.theme = next;
      try { window.localStorage.setItem('dalei-theme', next); } catch { /* private mode */ }
      return next;
    });
  };
  const s2t = useS2T(lang === 'zhHant');
  const t = (txt: LocalizedText) =>
    lang === 'en' ? txt.en : lang === 'zhHant' ? (s2t ? s2t(txt.zh) : txt.zh) : txt.zh;
  const navSentinelRef = useRef<HTMLDivElement>(null);
  const [videos, setVideos] = useState<VideoItem[]>(VIDEOS);

  useReveal(`${workFilter}-${showAllProjects}`);

  // The WebGL background is an optional enhancement. It is not requested on
  // mobile and only downloads after a desktop pointer interaction.
  useEffect(() => {
    if (
      window.matchMedia('(max-width: 767px)').matches ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      return;
    }
    const revealFluid = () => setFluidReady(true);
    window.addEventListener('pointermove', revealFluid, { once: true, passive: true });
    return () => {
      window.removeEventListener('pointermove', revealFluid);
    };
  }, []);

  // Scroll-spy without a per-frame scroll handler.
  useEffect(() => {
    const sections = ['home', 'work', 'videos', 'about', 'now', 'connect']
      .map((id) => document.getElementById(id))
      .filter((section): section is HTMLElement => Boolean(section));
    if (!sections.length || !('IntersectionObserver' in window)) return;
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible?.target.id) setActive(visible.target.id);
      },
      { rootMargin: '-24% 0px -62% 0px', threshold: [0, 0.1, 0.5] }
    );
    sections.forEach((section) => io.observe(section));
    return () => io.disconnect();
  }, []);

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
    const sentinel = navSentinelRef.current;
    if (!sentinel || !('IntersectionObserver' in window)) return;
    const io = new IntersectionObserver(([entry]) => setScrolled(!entry.isIntersecting));
    io.observe(sentinel);
    return () => io.disconnect();
  }, []);

  // Global search hotkeys: ⌘K / Ctrl+K anywhere, or `/` outside form fields.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen((v) => !v);
        return;
      }
      if (e.key === '/' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        const el = e.target as HTMLElement | null;
        const typing = el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable);
        if (!typing) {
          e.preventDefault();
          setSearchOpen(true);
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
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

  // One signature project is the big hero; everything else goes into a compact
  // tile grid so the page stays short and scannable.
  const signature = PROJECTS.find((p) => p.signature);
  const allTiles = PROJECTS.filter((p) => p.id !== signature?.id)
    .sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
  const tiles = workFilter === 'all' ? allTiles : allTiles.filter((p) => p.category === workFilter);
  const visibleTiles = showAllProjects ? tiles : tiles.slice(0, 7);

  // Filter chips for the Work grid - counts come from the unfiltered set.
  const workFilters: { key: typeof workFilter; label: LocalizedText; count: number }[] = [
    { key: 'all', label: COPY.work.filterAll, count: allTiles.length },
    { key: 'ai', label: COPY.work.filterAi, count: allTiles.filter((p) => p.category === 'ai').length },
    { key: 'creative', label: COPY.work.filterCreative, count: allTiles.filter((p) => p.category === 'creative').length },
    { key: 'tool', label: COPY.work.filterTool, count: allTiles.filter((p) => p.category === 'tool').length },
  ];

  return (
    <div className="home-root font-sans">
      {/* Skip link - keyboard/screen-reader users jump straight to content (a11y) */}
      <a
        href="#main-content"
        className="sr-only z-[80] rounded-full border border-ink/15 bg-paper px-4 py-2 font-mono text-xs text-ink shadow-lg focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        {t({ en: 'Skip to content', zh: '跳到主要内容' })}
      </a>
      <div ref={navSentinelRef} className="pointer-events-none absolute left-0 top-6 h-px w-px" aria-hidden="true" />
      {searchOpen && (
        <Suspense fallback={null}>
          <SearchPalette
            open={searchOpen}
            onClose={() => setSearchOpen(false)}
            t={t}
            videos={videos}
            onNavigate={onNavigate}
            goToSection={goTo}
            toggleTheme={toggleTheme}
          />
        </Suspense>
      )}
      {fluidReady && (
        <Suspense fallback={null}>
          <FluidBackground />
        </Suspense>
      )}
      <div className="bg-aurora" />
      <div className="bg-vignette" />
      <div className="bg-grain" />

      {/* Nav */}
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
          scrolled ? 'border-b border-ink/10 bg-paper/80 backdrop-blur-xl' : 'border-b border-transparent'
        }`}
      >
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-8">
          <button
            onClick={() => goTo('home')}
            className="group flex items-center gap-2.5 font-display text-base font-semibold tracking-tight"
          >
            <span className="grid h-7 w-7 place-items-center rounded-md border border-ink/15 bg-ink/5 font-mono text-xs text-gold transition-colors group-hover:border-gold/50">
              大
            </span>
            <span className="hidden sm:inline">Da&nbsp;Lei</span>
          </button>

          <div className="hidden items-center gap-8 md:flex">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => goTo(item.id)}
                aria-current={active === item.id ? 'page' : undefined}
                className={`link-underline text-sm transition-colors hover:text-ink ${active === item.id ? 'text-ink' : 'text-ink/55'}`}
              >
                {t(item.label)}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSearchOpen(true)}
              aria-label={t({ en: 'Search (Ctrl+K)', zh: '搜索（Ctrl+K）' })}
              className="group hidden h-8 items-center gap-2 rounded-full border border-ink/15 bg-ink/5 px-2.5 text-ink/60 transition-colors hover:border-gold/50 hover:text-ink sm:flex"
            >
              <SearchIcon className="h-[15px] w-[15px]" />
              <kbd aria-hidden="true" className="hidden rounded border border-ink/15 bg-paper/60 px-1 font-mono text-[10px] text-ink/45 transition-colors group-hover:text-gold lg:inline">⌘K</kbd>
            </button>
            <button
              onClick={toggleTheme}
              aria-label={theme === 'light' ? '切换到深色模式 / Switch to dark mode' : '切换到浅色模式 / Switch to light mode'}
              className="hidden h-8 w-8 place-items-center rounded-full border border-ink/15 bg-ink/5 text-sm text-ink/70 transition-colors hover:border-gold/50 hover:text-ink sm:grid"
            >
              <span aria-hidden="true">{theme === 'light' ? '☾' : '☀'}</span>
            </button>
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
            <a
              href={SOCIALS.youtube}
              target="_blank"
              rel="noreferrer"
              className="btn-sheen hidden h-8 items-center gap-1.5 rounded-full bg-gold px-3.5 text-xs font-semibold text-paper transition-transform hover:scale-[1.03] xl:inline-flex"
            >
              <YouTubeIcon className="h-3.5 w-3.5" />
              {t({ en: 'Subscribe', zh: '订阅' })}
            </a>
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="grid h-9 w-9 place-items-center rounded-full border border-ink/15 bg-ink/5 text-ink/80 md:hidden"
              aria-label="Menu"
              aria-expanded={menuOpen}
              aria-controls="mobile-nav"
            >
              <span className="text-lg leading-none">{menuOpen ? '×' : '≡'}</span>
            </button>
          </div>
        </nav>

        {menuOpen && (
          <div
            id="mobile-nav"
            className="menu-in border-t border-ink/10 bg-paper px-5 pb-5 pt-2 shadow-[0_26px_44px_-26px_rgba(28,26,23,0.55)] md:hidden"
          >
            <div className="flex gap-2 border-b border-ink/10 py-3 sm:hidden">
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  setSearchOpen(true);
                }}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-ink/15 bg-ink/5 px-4 py-2 text-sm text-ink/75"
              >
                <SearchIcon className="h-4 w-4" />
                {t({ en: 'Search', zh: '搜索' })}
              </button>
              <button
                type="button"
                onClick={toggleTheme}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-ink/15 bg-ink/5 px-4 py-2 text-sm text-ink/75"
              >
                <span aria-hidden="true">{theme === 'light' ? '☾' : '☀'}</span>
                {t({ en: 'Theme', zh: '主题' })}
              </button>
            </div>
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => goTo(item.id)}
                aria-current={active === item.id ? 'page' : undefined}
                className={`flex w-full items-center gap-3 border-b border-ink/5 py-3 text-left transition-colors last:border-b-0 ${
                  active === item.id ? 'text-ink' : 'text-ink/70 hover:text-ink'
                }`}
              >
                {t(item.label)}
              </button>
            ))}
          </div>
        )}
      </header>

      <main id="main-content" className="mx-auto max-w-5xl px-5 sm:px-8">
        {/* Hero */}
        <section id="home" className="relative grid min-h-[100dvh] items-center gap-3 pb-10 pt-20 sm:gap-10 sm:pb-16 sm:pt-24 lg:grid-cols-[1.15fr_0.85fr] lg:gap-14">
          <div className="flex flex-col">
            <p className="hero-in font-mono text-sm text-gold" style={{ animationDelay: '0.1s' }}>{t(COPY.hero.greeting)}</p>

            <h1 className="hero-in mt-4 font-display text-[2.65rem] font-semibold leading-[1.06] tracking-[-0.01em] sm:text-6xl lg:text-[3.25rem]" style={{ animationDelay: '0.2s' }}>
              <span className="block">{t(COPY.hero.titleLine1)}</span>
              <span className="block pb-1 italic leading-[1.1] text-gradient">{t(COPY.hero.titleLine2)}</span>
            </h1>

            <p className="hero-in mt-6 max-w-lg text-base leading-relaxed text-ink/70 sm:text-lg" style={{ animationDelay: '0.35s' }}>
              {t(COPY.hero.intro)}
            </p>

            <div className="hero-in mt-8 flex flex-wrap items-center gap-3" style={{ animationDelay: '0.5s' }}>
              <Magnetic strength={0.4}>
                <button
                  onClick={() => goTo('work')}
                  className="btn-sheen group inline-flex items-center gap-2 rounded-full bg-accent px-5 py-3 text-sm font-semibold text-paper transition-transform hover:scale-[1.03]"
                >
                  {t(COPY.hero.ctaWork)}
                  <ArrowIcon className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </button>
              </Magnetic>
              <Magnetic strength={0.4}>
                <a
                  href={SOCIALS.youtube}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border border-ink/15 bg-ink/5 px-5 py-3 text-sm font-semibold text-ink/85 transition-colors hover:border-ink/30 hover:text-ink"
                >
                  <YouTubeIcon className="h-4 w-4" />
                  {t(COPY.hero.ctaVideo)}
                </a>
              </Magnetic>
            </div>
          </div>

          <div>
            <HeroFigure t={t} onOpen={() => window.open(SOCIALS.youtube, '_blank', 'noopener')} />
          </div>

        </section>

        {/* Work */}
        <section id="work" className="relative scroll-mt-24 py-20">
          <div className="reveal mb-12 max-w-xl">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-gold">{t(COPY.work.label)}</p>
              <h2 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">{t(COPY.work.heading)}</h2>
              <p className="mt-3 max-w-md text-sm leading-relaxed text-ink/55">{t(COPY.work.sub)}</p>
            </div>
          </div>

          <div className="flex flex-col gap-8">
            {signature && (
              <FeaturedCard key={signature.id} project={signature} lang={lang} t={t} onInternal={onNavigate} />
            )}

            <div className="reveal flex flex-col gap-4 border-t border-ink/10 pt-8 sm:flex-row sm:items-center sm:justify-between">
              <h3 className="font-mono text-xs uppercase tracking-[0.2em] text-gold">{t({ en: 'All projects & tools', zh: '全部项目 & 工具' })}</h3>
              {/* Category filter - scan by interest instead of one long scroll */}
              <div className="flex flex-wrap gap-2" role="group" aria-label={t({ en: 'Filter projects', zh: '筛选项目' })}>
                {workFilters.map((f) => (
                  <button
                    key={f.key}
                    onClick={() => {
                      setWorkFilter(f.key);
                      setShowAllProjects(false);
                    }}
                    aria-pressed={workFilter === f.key}
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 font-mono text-[11px] transition-colors ${
                      workFilter === f.key
                        ? 'border-ink bg-ink text-paper'
                        : 'border-ink/15 text-ink/60 hover:border-ink/40 hover:text-ink'
                    }`}
                  >
                    {t(f.label)}
                    <span className={workFilter === f.key ? 'text-paper/55' : 'text-ink/35'}>{f.count}</span>
                  </button>
                ))}
              </div>
            </div>
            {/* Editors' picks - the first two of the (filtered) list get a wider,
                larger card so the wall of tiles reads as headline → picks → index. */}
            {visibleTiles.length > 0 && (
              <div className="grid gap-3 sm:grid-cols-2 sm:gap-5">
                {visibleTiles.slice(0, 2).map((p) => (
                  <ProjectCard key={p.id} project={p} lang={lang} t={t} onInternal={onNavigate} size="lg" />
                ))}
              </div>
            )}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
              {visibleTiles.slice(2).map((p) => (
                <ProjectCard key={p.id} project={p} lang={lang} t={t} onInternal={onNavigate} />
              ))}
            </div>
            {tiles.length > 7 && (
              <div className="reveal flex justify-center border-t border-ink/10 pt-7">
                <button
                  type="button"
                  onClick={() => setShowAllProjects((value) => !value)}
                  aria-expanded={showAllProjects}
                  className="inline-flex items-center gap-2 rounded-full border border-ink/20 bg-ink/5 px-5 py-2.5 text-sm font-semibold text-ink/75 transition-colors hover:border-gold/50 hover:text-ink"
                >
                  {showAllProjects
                    ? t({ en: 'Show fewer projects', zh: '收起项目' })
                    : t({ en: `Show all ${tiles.length + (signature ? 1 : 0)} projects`, zh: `查看全部 ${tiles.length + (signature ? 1 : 0)} 个项目` })}
                  <span aria-hidden="true">{showAllProjects ? '↑' : '↓'}</span>
                </button>
              </div>
            )}
          </div>
        </section>

        {/* Videos */}
        <section id="videos" className="relative scroll-mt-24 py-20">
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

          {/* Latest episode - a full-width split feature, magazine-style; the
              rest stay in the compact grid below. */}
          {videos[0] && (
            <a
              href={youtubeWatch(videos[0].id)}
              target="_blank"
              rel="noreferrer"
              className="video-card reveal group mb-6 flex flex-col overflow-hidden rounded-2xl border border-ink/10 bg-surface/50 backdrop-blur-sm transition-all hover:-translate-y-1 hover:border-gold/40 lg:flex-row"
            >
              <div className="relative aspect-video overflow-hidden bg-surface lg:aspect-auto lg:w-[58%]">
                <img
                  src={youtubeThumb(videos[0].id)}
                  alt={t(videos[0].title)}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                />
                <span className="absolute bottom-3 right-3 rounded bg-black/75 px-2 py-0.5 font-mono text-xs text-white">
                  {videos[0].duration}
                </span>
                <span className="absolute inset-0 grid place-items-center">
                  <span className="grid h-14 w-14 scale-90 place-items-center rounded-full bg-paper/90 text-ink opacity-0 shadow-lg transition-all duration-300 group-hover:scale-100 group-hover:opacity-100">
                    <PlayIcon className="ml-0.5 h-6 w-6" />
                  </span>
                </span>
              </div>
              <div className="flex flex-1 flex-col justify-center p-6 sm:p-8 lg:p-9">
                <p className="flex items-center gap-2.5 font-mono text-[11px] uppercase tracking-[0.18em] text-ink/45">
                  <span className="rounded-full bg-gold px-2 py-0.5 font-semibold text-paper">{t(COPY.videos.new)}</span>
                  {videos[0].date}
                </p>
                <h3 className="mt-3.5 font-display text-2xl font-semibold leading-snug tracking-tight text-ink/90 transition-colors group-hover:text-ink sm:text-3xl">
                  {t(videos[0].title)}
                </h3>
                <span className="link-underline mt-6 inline-flex w-fit items-center gap-1.5 text-sm font-semibold text-accent">
                  {t({ en: 'Watch on YouTube', zh: '在 YouTube 观看' })}
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </span>
              </div>
            </a>
          )}

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {videos.slice(1).map((v, i) => (
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

        {/* About - editorial copy paired with a lightweight CSS 3D portrait. */}
        <section id="about" className="relative scroll-mt-24 py-24 sm:py-28">
          <div className="grid items-center gap-14 lg:grid-cols-12 lg:gap-10">
            <div className="reveal lg:col-span-7">
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-gold">{t(COPY.about.label)}</p>
              <h2 className="mt-5 font-display text-[2.6rem] font-semibold leading-[1.06] tracking-[-0.01em] sm:text-6xl lg:text-[3.75rem]">
                <span className="block">{t(COPY.about.statementA)}</span>
                <span className="block pb-1 italic leading-[1.1] text-gradient">{t(COPY.about.statementB)}</span>
              </h2>
              <p className="mt-8 max-w-2xl text-base leading-relaxed text-ink/70 sm:text-lg">
                {t(COPY.about.body)}
              </p>
            </div>

            <div className="lg:col-span-5">
              <AboutScene t={t} />
            </div>
          </div>

          <dl className="about-stats reveal mt-16">
            {[
              { value: CHANNEL.subscribers, label: { en: 'YouTube subscribers', zh: 'YouTube 订阅' } as LocalizedText },
              { value: CHANNEL.videos, label: { en: 'videos shipped', zh: '视频' } as LocalizedText },
              { value: `${PROJECTS.length}`, label: { en: 'open-source projects', zh: '开源项目' } as LocalizedText },
            ].map((s) => (
              <div key={s.label.en} className="about-stat">
                <dt className="font-display text-4xl font-semibold leading-none tracking-tight sm:text-5xl">
                  {s.value}
                </dt>
                <dd className="mt-2.5 font-mono text-[10.5px] uppercase leading-tight tracking-wider text-ink/60">
                  {t(s.label)}
                </dd>
              </div>
            ))}
          </dl>
        </section>

        {/* Now */}
        <section id="now" className="relative scroll-mt-24 py-20">
          <div className="reveal rounded-3xl border border-ink/10 bg-surface/40 p-8 backdrop-blur-sm sm:p-12">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.2em] text-gold">
                <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-gold" />
                {t(COPY.now.label)}
              </p>
              <span className="font-mono text-[11px] text-ink/40">{t(COPY.now.updated)}</span>
            </div>
            <h2 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">{t(COPY.now.heading)}</h2>
            {/* Timeline rail - the top item is "live" (pulsing); older ones quiet */}
            <ul className="mt-8 flex flex-col">
              {COPY.now.items.map((item, i) => (
                <li key={i} className="relative flex gap-5 pb-7 last:pb-0">
                  {i < COPY.now.items.length - 1 && (
                    <span className="absolute left-[6px] top-5 h-full w-px bg-gradient-to-b from-ink/15 to-ink/5" aria-hidden="true" />
                  )}
                  <span className="relative mt-1.5 grid h-3.5 w-3.5 shrink-0 place-items-center" aria-hidden="true">
                    <span className={`h-3.5 w-3.5 rounded-full border ${i === 0 ? 'border-gold/50 bg-gold/15' : 'border-ink/20 bg-ink/5'}`} />
                    {i === 0 && <span className="pulse-dot absolute h-1.5 w-1.5 rounded-full bg-gold" />}
                  </span>
                  <p className="text-base leading-relaxed text-ink/70">{t(item)}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Connect */}
        <section id="connect" className="relative scroll-mt-24 py-20">
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
                { icon: <GitHubIcon className="h-5 w-5" />, label: 'GitHub', handle: 'paul010', href: SOCIALS.github, external: true, mail: false },
                { icon: <YouTubeIcon className="h-5 w-5" />, label: 'YouTube', handle: '@dalei2025', href: SOCIALS.youtube, external: true, mail: false },
                { icon: <XIcon className="h-[18px] w-[18px]" />, label: 'X / Twitter', handle: '@paul010318', href: SOCIALS.twitter, external: true, mail: false },
                { icon: <NotionIcon className="h-5 w-5" />, label: 'Notion', handle: 'AI Agent Club', href: SOCIALS.notion, external: true, mail: false },
                { icon: <MailIcon className="h-5 w-5" />, label: 'Email', handle: getEmail(), href: `mailto:${getEmail()}`, external: false },
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

      {/* Footer - a small editorial colophon: brand, numbered site index, socials. */}
      <footer className="border-t border-ink/10">
        <div className="mx-auto max-w-5xl px-5 py-12 sm:px-8">
          <div className="flex flex-col gap-10 sm:flex-row sm:items-start sm:justify-between">
            <div className="max-w-xs">
              <div className="flex items-center gap-2.5 font-display text-base font-semibold">
                <span className="grid h-7 w-7 place-items-center rounded-md border border-ink/15 bg-ink/5 font-mono text-xs text-gold">大</span>
                Da Lei · 大雷
              </div>
              <p className="mt-3 text-sm leading-relaxed text-ink/70">
                {t({
                  en: 'AI automation, creative coding, and the occasional run - everything here is open source.',
                  zh: 'AI 自动化、创意编程，偶尔跑步 -- 这里的一切都是开源的。',
                })}
              </p>
            </div>

            <nav className="grid grid-cols-2 gap-x-10 gap-y-2.5" aria-label={t({ en: 'Site index', zh: '站点索引' })}>
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => goTo(item.id)}
                  className="flex items-center gap-2 text-left text-sm text-ink/70 transition-colors hover:text-ink"
                >
                  {t(item.label)}
                </button>
              ))}
            </nav>

            <div className="flex items-center gap-4 text-ink/50">
              <a href={SOCIALS.github} target="_blank" rel="noreferrer" className="transition-colors hover:text-ink" aria-label="GitHub">
                <GitHubIcon className="h-5 w-5" />
              </a>
              <a href={SOCIALS.youtube} target="_blank" rel="noreferrer" className="transition-colors hover:text-ink" aria-label="YouTube">
                <YouTubeIcon className="h-5 w-5" />
              </a>
              <a href={SOCIALS.twitter} target="_blank" rel="noreferrer" className="transition-colors hover:text-ink" aria-label="X">
                <XIcon className="h-[18px] w-[18px]" />
              </a>
              <a href={`mailto:${getEmail()}`} className="transition-colors hover:text-ink" aria-label="Email">
                <MailIcon className="h-5 w-5" />
              </a>
            </div>
          </div>

          <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-ink/10 pt-5 sm:flex-row">
            <p className="font-mono text-xs text-ink/70">
              © {new Date().getFullYear()} Da Lei · {t(COPY.footer.tagline)}
            </p>
            <button
              onClick={() => goTo('home')}
              className="inline-flex items-center gap-1 rounded-full border border-ink/15 bg-ink/5 px-3 py-1.5 font-mono text-[11px] text-ink/70 transition-colors hover:border-gold/50 hover:text-ink"
              aria-label={t({ en: 'Back to top', zh: '回到顶部' })}
            >
              ↑ {t({ en: 'Back to top', zh: '回到顶部' })}
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
