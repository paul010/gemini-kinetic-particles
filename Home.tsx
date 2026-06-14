import React, { useEffect, useRef, useState } from 'react';
import { StarfieldBackground } from './components/StarfieldBackground';
import { COPY, PROJECTS, SOCIALS, Lang, LocalizedText, Project } from './data/site';

interface HomeProps {
  onNavigate: (path: string) => void;
}

const STORAGE_KEY = 'dalei-lang';

const detectInitialLang = (): Lang => {
  if (typeof window === 'undefined') return 'en';
  const saved = window.localStorage.getItem(STORAGE_KEY);
  if (saved === 'en' || saved === 'zh') return saved;
  return navigator.language?.toLowerCase().startsWith('zh') ? 'zh' : 'en';
};

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

const ArrowIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
    <path d="M5 12h14M13 6l6 6-6 6" />
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
      { threshold: 0.15, rootMargin: '0px 0px -8% 0px' }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
};

/* ---------- Small pieces ---------- */

const statusBadge = (status: Project['status'], lang: Lang) => {
  const map = {
    live: { en: 'Live', zh: '已上线', cls: 'text-accent border-accent/40 bg-accent/10' },
    wip: { en: 'In progress', zh: '开发中', cls: 'text-ember border-ember/40 bg-ember/10' },
    soon: { en: 'Coming soon', zh: '敬请期待', cls: 'text-accent2 border-accent2/40 bg-accent2/10' },
  } as const;
  const s = map[status];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-mono text-[11px] uppercase tracking-wider ${s.cls}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {s[lang]}
    </span>
  );
};

/* ---------- Main ---------- */

const Home: React.FC<HomeProps> = ({ onNavigate }) => {
  const [lang, setLang] = useState<Lang>(detectInitialLang);
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const t = (txt: LocalizedText) => txt[lang];

  useReveal();

  useEffect(() => {
    document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';
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
    { id: 'about', label: COPY.nav.about },
    { id: 'connect', label: COPY.nav.connect },
  ];

  const goTo = (id: string) => {
    setMenuOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleProjectLink = (href: string, kind: string, e: React.MouseEvent) => {
    if (kind === 'internal') {
      e.preventDefault();
      onNavigate(href);
    }
  };

  return (
    <div className="home-root font-sans">
      <StarfieldBackground />
      <div className="bg-vignette" />

      {/* Nav */}
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
          scrolled ? 'border-b border-white/10 bg-ink/70 backdrop-blur-xl' : 'border-b border-transparent'
        }`}
      >
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-8">
          <button
            onClick={() => goTo('home')}
            className="group flex items-center gap-2.5 font-display text-base font-semibold tracking-tight"
          >
            <span className="grid h-7 w-7 place-items-center rounded-md border border-white/15 bg-white/5 font-mono text-xs text-accent transition-colors group-hover:border-accent/50">
              大
            </span>
            <span>Da&nbsp;Lei</span>
          </button>

          <div className="hidden items-center gap-7 md:flex">
            {navItems.map((item, i) => (
              <button
                key={item.id}
                onClick={() => goTo(item.id)}
                className="link-underline text-sm text-white/70 transition-colors hover:text-white"
              >
                <span className="mr-1.5 font-mono text-[11px] text-accent/70">0{i + 1}</span>
                {t(item.label)}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setLang(lang === 'en' ? 'zh' : 'en')}
              className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5 font-mono text-xs text-white/80 transition-colors hover:border-accent/50 hover:text-white"
              aria-label="Toggle language"
            >
              {lang === 'en' ? '中文' : 'EN'}
            </button>
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="grid h-9 w-9 place-items-center rounded-full border border-white/15 bg-white/5 text-white/80 md:hidden"
              aria-label="Menu"
            >
              <span className="text-lg leading-none">{menuOpen ? '×' : '≡'}</span>
            </button>
          </div>
        </nav>

        {menuOpen && (
          <div className="border-t border-white/10 bg-ink/95 px-5 py-4 backdrop-blur-xl md:hidden">
            {navItems.map((item, i) => (
              <button
                key={item.id}
                onClick={() => goTo(item.id)}
                className="flex w-full items-center gap-3 py-2.5 text-left text-white/80"
              >
                <span className="font-mono text-xs text-accent/70">0{i + 1}</span>
                {t(item.label)}
              </button>
            ))}
          </div>
        )}
      </header>

      <main className="mx-auto max-w-6xl px-5 sm:px-8">
        {/* Hero */}
        <section id="home" className="flex min-h-screen flex-col justify-center pt-28 pb-20">
          <p className="reveal mb-6 inline-flex w-fit items-center gap-2 rounded-full border border-white/12 bg-white/5 px-3.5 py-1.5 font-mono text-xs uppercase tracking-[0.18em] text-white/65">
            <span className="h-1.5 w-1.5 rounded-full bg-accent shadow-[0_0_10px_2px_rgba(34,211,238,0.6)]" />
            {t(COPY.hero.eyebrow)}
          </p>

          <h1 className="reveal max-w-4xl font-display text-4xl font-bold leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">
            <span className="block">{t(COPY.hero.titleLine1)}</span>
            <span className="block text-gradient">{t(COPY.hero.titleLine2)}</span>
          </h1>

          <p className="reveal mt-7 max-w-2xl text-base leading-relaxed text-white/65 sm:text-lg">
            {t(COPY.hero.intro)}
          </p>

          <div className="reveal mt-9 flex flex-wrap items-center gap-3">
            <button
              onClick={() => onNavigate('/particles')}
              className="group inline-flex items-center gap-2 rounded-full bg-accent px-5 py-3 text-sm font-semibold text-ink transition-transform hover:scale-[1.03]"
            >
              {t(COPY.hero.ctaLaunch)}
              <ArrowIcon className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </button>
            <button
              onClick={() => goTo('work')}
              className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white/85 transition-colors hover:border-white/30 hover:text-white"
            >
              {t(COPY.hero.ctaWork)}
            </button>
          </div>

          <div className="reveal mt-14 flex items-center gap-5 text-white/55">
            <a href={SOCIALS.github} target="_blank" rel="noreferrer" className="transition-colors hover:text-white" aria-label="GitHub">
              <GitHubIcon className="h-5 w-5" />
            </a>
            <a href={SOCIALS.youtube} target="_blank" rel="noreferrer" className="transition-colors hover:text-[#ff0000]" aria-label="YouTube">
              <YouTubeIcon className="h-5 w-5" />
            </a>
            <a href={SOCIALS.twitter} target="_blank" rel="noreferrer" className="transition-colors hover:text-white" aria-label="X">
              <XIcon className="h-[18px] w-[18px]" />
            </a>
            <span className="font-mono text-xs tracking-wide text-white/35">@dalei2025 · @paul010318</span>
          </div>
        </section>

        {/* Work */}
        <section id="work" className="scroll-mt-24 py-20">
          <div className="reveal mb-12 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent/80">{t(COPY.work.label)}</p>
              <h2 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">{t(COPY.work.heading)}</h2>
            </div>
            <p className="max-w-sm text-sm text-white/55 sm:text-right">{t(COPY.work.sub)}</p>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {PROJECTS.map((p) => (
              <article
                key={p.id}
                className={`project-card reveal flex flex-col rounded-2xl border border-white/10 bg-surface/60 backdrop-blur-sm ${
                  p.featured ? 'lg:col-span-2 lg:flex-row' : ''
                }`}
              >
                {p.cover && (
                  <div className={`relative overflow-hidden rounded-t-2xl ${p.featured ? 'lg:w-1/2 lg:rounded-l-2xl lg:rounded-tr-none' : ''}`}>
                    <img
                      src={p.cover}
                      alt={p.title}
                      loading="lazy"
                      className="h-56 w-full object-cover opacity-90 transition-transform duration-700 hover:scale-105 lg:h-full"
                    />
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-surface/80 via-transparent to-transparent lg:bg-gradient-to-r" />
                  </div>
                )}

                <div className={`flex flex-1 flex-col p-6 sm:p-8 ${p.featured && p.cover ? 'lg:w-1/2' : ''}`}>
                  <div className="mb-4 flex items-center justify-between gap-3">
                    {statusBadge(p.status, lang)}
                    <span className="font-mono text-xs text-white/40">{p.year}</span>
                  </div>

                  <h3 className="font-display text-2xl font-semibold tracking-tight">{p.title}</h3>
                  <p className="mt-2 text-sm font-medium text-accent/90">{t(p.tagline)}</p>
                  <p className="mt-4 text-sm leading-relaxed text-white/60">{t(p.description)}</p>

                  <div className="mt-5 flex flex-wrap gap-2">
                    {p.tags.map((tag) => (
                      <span key={tag} className="rounded-md border border-white/10 bg-white/5 px-2.5 py-1 font-mono text-[11px] text-white/55">
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className="mt-7 flex flex-wrap gap-4 pt-1">
                    {p.links.map((l) => (
                      <a
                        key={l.href + l.kind}
                        href={l.href}
                        onClick={(e) => handleProjectLink(l.href, l.kind, e)}
                        target={l.kind === 'internal' ? undefined : '_blank'}
                        rel={l.kind === 'internal' ? undefined : 'noreferrer'}
                        className={`link-underline inline-flex items-center gap-1.5 text-sm font-semibold ${
                          l.kind === 'internal' || l.kind === 'live' ? 'text-accent' : 'text-white/75'
                        }`}
                      >
                        {t(l.label)}
                        <ArrowIcon className="h-3.5 w-3.5" />
                      </a>
                    ))}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* About */}
        <section id="about" className="scroll-mt-24 py-20">
          <div className="grid gap-12 lg:grid-cols-[1fr_1.1fr] lg:gap-16">
            <div className="reveal">
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent/80">{t(COPY.about.label)}</p>
              <h2 className="mt-3 font-display text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
                {t(COPY.about.heading)}
              </h2>
              <p className="mt-6 text-base leading-relaxed text-white/65">{t(COPY.about.body)}</p>
            </div>

            <div className="reveal grid gap-4 self-center">
              {COPY.about.pillars.map((pillar, i) => (
                <div
                  key={i}
                  className="flex items-start gap-4 rounded-xl border border-white/10 bg-surface/50 p-5 backdrop-blur-sm transition-colors hover:border-accent/30"
                >
                  <span className="mt-0.5 font-mono text-sm text-accent/70">0{i + 1}</span>
                  <div>
                    <h3 className="font-display text-lg font-semibold">{t(pillar.title)}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-white/55">{t(pillar.text)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Connect */}
        <section id="connect" className="scroll-mt-24 py-20">
          <div className="reveal relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-surface/80 to-ink/40 p-8 backdrop-blur-sm sm:p-14">
            <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-accent/10 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-accent2/10 blur-3xl" />

            <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent/80">{t(COPY.connect.label)}</p>
            <h2 className="mt-3 max-w-xl font-display text-3xl font-bold tracking-tight sm:text-5xl">
              {t(COPY.connect.heading)}
            </h2>
            <p className="mt-5 max-w-md text-sm leading-relaxed text-white/60 sm:text-base">{t(COPY.connect.sub)}</p>

            <div className="mt-9 grid gap-3 sm:grid-cols-3">
              {[
                { icon: <GitHubIcon className="h-5 w-5" />, label: 'GitHub', handle: 'paul010', href: SOCIALS.github },
                { icon: <YouTubeIcon className="h-5 w-5" />, label: 'YouTube', handle: '@dalei2025', href: SOCIALS.youtube },
                { icon: <XIcon className="h-[18px] w-[18px]" />, label: 'X / Twitter', handle: '@paul010318', href: SOCIALS.twitter },
              ].map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noreferrer"
                  className="group flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-4 transition-all hover:-translate-y-0.5 hover:border-accent/40 hover:bg-white/[0.08]"
                >
                  <span className="grid h-10 w-10 place-items-center rounded-lg bg-white/5 text-white/80 transition-colors group-hover:text-accent">
                    {s.icon}
                  </span>
                  <span className="flex flex-col">
                    <span className="text-sm font-semibold">{s.label}</span>
                    <span className="font-mono text-xs text-white/45">{s.handle}</span>
                  </span>
                  <ArrowIcon className="ml-auto h-4 w-4 text-white/30 transition-all group-hover:translate-x-0.5 group-hover:text-accent" />
                </a>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-5 py-8 sm:flex-row sm:px-8">
          <div className="flex items-center gap-2.5 font-display text-sm font-semibold">
            <span className="grid h-6 w-6 place-items-center rounded border border-white/15 bg-white/5 font-mono text-[10px] text-accent">大</span>
            Da Lei · 大雷
          </div>
          <p className="font-mono text-xs text-white/40">
            © {new Date().getFullYear()} · {t(COPY.footer.tagline)}
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Home;
