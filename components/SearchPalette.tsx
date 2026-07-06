import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  PROJECTS,
  COPY,
  SOCIALS,
  openEmail,
  youtubeWatch,
  type LocalizedText,
  type VideoItem,
} from '../data/site';

/* ---------------------------------------------------------------------------
 * SearchPalette — the site-wide ⌘K command palette, in 大雷's ink-on-paper
 * editorial language: hairline borders, mono microcopy, serif titles, a 大
 * monogram, and the gold accent for the selected row.
 *
 * Searches projects, videos, page sections and quick actions. Matching runs
 * against BOTH the English and Chinese strings (plus tags), so a query hits
 * regardless of the current UI language.
 * ------------------------------------------------------------------------- */

interface PaletteItem {
  key: string;
  group: 'project' | 'video' | 'page' | 'action';
  title: LocalizedText;
  meta: string;
  /** lowercase haystack of every searchable string, both languages */
  haystack: string;
  chip: string;
  run: () => void;
}

interface Props {
  open: boolean;
  onClose: () => void;
  t: (txt: LocalizedText) => string;
  videos: VideoItem[];
  onNavigate: (path: string) => void;
  goToSection: (id: string) => void;
  toggleTheme: () => void;
}

const GROUP_LABEL: Record<PaletteItem['group'], LocalizedText> = {
  project: { en: 'Projects', zh: '项目' },
  video: { en: 'Videos', zh: '视频' },
  page: { en: 'Pages', zh: '页面' },
  action: { en: 'Quick actions', zh: '快捷操作' },
};

const GROUP_ORDER: PaletteItem['group'][] = ['project', 'video', 'page', 'action'];

const SUGGESTIONS = ['copilot', 'skill', '3d', 'prompt', 'benchmark'];

const SearchPalette: React.FC<Props> = ({ open, onClose, t, videos, onNavigate, goToSection, toggleTheme }) => {
  const [query, setQuery] = useState('');
  const [sel, setSel] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  /* ---------- build the searchable index ---------- */
  const items = useMemo<PaletteItem[]>(() => {
    const out: PaletteItem[] = [];

    for (const p of PROJECTS) {
      const internal = p.links.find((l) => l.kind === 'internal');
      const external = p.links.find((l) => l.kind !== 'internal');
      out.push({
        key: `p-${p.id}`,
        group: 'project',
        title: p.title,
        meta: p.year,
        chip: (p.category ?? 'ai').toUpperCase(),
        haystack: [p.title.en, p.title.zh, p.tagline.en, p.tagline.zh, p.tags.join(' '), p.id]
          .join(' ')
          .toLowerCase(),
        run: () => {
          if (internal) onNavigate(internal.href);
          else if (external) window.open(external.href, '_blank', 'noopener');
        },
      });
    }

    for (const v of videos) {
      out.push({
        key: `v-${v.id}`,
        group: 'video',
        title: v.title,
        meta: `${v.date} · ${v.duration}`,
        chip: 'YT',
        haystack: [v.title.en, v.title.zh, v.date].join(' ').toLowerCase(),
        run: () => window.open(youtubeWatch(v.id), '_blank', 'noopener'),
      });
    }

    const pages: { id: string; label: LocalizedText }[] = [
      { id: 'home', label: COPY.nav.home },
      { id: 'work', label: COPY.nav.work },
      { id: 'videos', label: COPY.nav.videos },
      { id: 'about', label: COPY.nav.about },
      { id: 'now', label: COPY.nav.now },
      { id: 'connect', label: COPY.nav.connect },
    ];
    pages.forEach((pg, i) => {
      out.push({
        key: `s-${pg.id}`,
        group: 'page',
        title: pg.label,
        meta: `0${i + 1}`,
        chip: '§',
        haystack: [pg.label.en, pg.label.zh, pg.id].join(' ').toLowerCase(),
        run: () => goToSection(pg.id),
      });
    });

    const actions: { key: string; title: LocalizedText; hay: string; run: () => void }[] = [
      { key: 'theme', title: { en: 'Toggle light / dark theme', zh: '切换深色 / 浅色主题' }, hay: 'theme dark light 主题 深色 浅色', run: toggleTheme },
      { key: 'email', title: { en: 'Email Da Lei', zh: '给大雷发邮件' }, hay: 'email mail contact 邮件 联系', run: openEmail },
      { key: 'github', title: { en: 'Open GitHub profile', zh: '打开 GitHub 主页' }, hay: 'github code 源码 代码', run: () => window.open(SOCIALS.github, '_blank', 'noopener') },
      { key: 'youtube', title: { en: 'Open YouTube channel', zh: '打开 YouTube 频道' }, hay: 'youtube channel 频道 视频 大雷早上好', run: () => window.open(SOCIALS.youtube, '_blank', 'noopener') },
    ];
    for (const a of actions) {
      out.push({
        key: `a-${a.key}`,
        group: 'action',
        title: a.title,
        meta: '',
        chip: '⌘',
        haystack: (a.title.en + ' ' + a.title.zh + ' ' + a.hay).toLowerCase(),
        run: a.run,
      });
    }

    return out;
  }, [videos, onNavigate, goToSection, toggleTheme]);

  /* ---------- filter ---------- */
  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      // Default view: featured projects, latest videos, all pages & actions.
      return [
        ...items.filter((i) => i.group === 'project').slice(0, 5),
        ...items.filter((i) => i.group === 'video').slice(0, 3),
        ...items.filter((i) => i.group === 'page'),
        ...items.filter((i) => i.group === 'action'),
      ];
    }
    const words = q.split(/\s+/).filter(Boolean);
    return items.filter((i) => words.every((w) => i.haystack.includes(w)));
  }, [items, query]);

  // Stable render order: group by GROUP_ORDER, keep a flat index for keyboard nav.
  const grouped = useMemo(() => {
    const flat: PaletteItem[] = [];
    const sections: { group: PaletteItem['group']; items: { item: PaletteItem; idx: number }[] }[] = [];
    for (const g of GROUP_ORDER) {
      const inGroup = results.filter((i) => i.group === g);
      if (!inGroup.length) continue;
      sections.push({ group: g, items: inGroup.map((item) => ({ item, idx: flat.push(item) - 1 })) });
    }
    return { flat, sections };
  }, [results]);

  /* ---------- open/close housekeeping ---------- */
  useEffect(() => {
    if (!open) return;
    setQuery('');
    setSel(0);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    // Focus after paint so the menu-in animation doesn't swallow it.
    const id = window.setTimeout(() => inputRef.current?.focus(), 30);
    return () => {
      document.body.style.overflow = prev;
      window.clearTimeout(id);
    };
  }, [open]);

  useEffect(() => setSel(0), [query]);

  // Keep the selected row in view while arrowing through the list.
  useEffect(() => {
    listRef.current
      ?.querySelector<HTMLElement>(`[data-idx="${sel}"]`)
      ?.scrollIntoView({ block: 'nearest' });
  }, [sel]);

  if (!open) return null;

  const runItem = (item: PaletteItem) => {
    onClose();
    item.run();
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSel((s) => Math.min(s + 1, grouped.flat.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSel((s) => Math.max(s - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const item = grouped.flat[sel];
      if (item) runItem(item);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[90] overflow-y-auto bg-ink/25 px-4 pb-10 pt-[10vh] backdrop-blur-sm sm:pt-[14vh]"
      onMouseDown={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t({ en: 'Site search', zh: '站内搜索' })}
        onMouseDown={(e) => e.stopPropagation()}
        onKeyDown={onKeyDown}
        className="menu-in mx-auto flex max-h-[70vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-ink/15 bg-paper shadow-[0_40px_80px_-24px_rgba(28,26,23,0.45)]"
      >
        {/* input row */}
        <div className="flex items-center gap-3 border-b border-ink/10 px-4 py-3.5 sm:px-5">
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md border border-ink/15 bg-ink/5 font-mono text-xs text-gold">大</span>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t({ en: 'Search projects, videos, pages…', zh: '搜索项目、视频、页面…' })}
            aria-label={t({ en: 'Search', zh: '搜索' })}
            className="min-w-0 flex-1 bg-transparent text-[15px] text-ink outline-none placeholder:text-ink/35"
          />
          <button
            onClick={onClose}
            className="rounded-md border border-ink/15 bg-ink/5 px-1.5 py-0.5 font-mono text-[10px] uppercase text-ink/50 transition-colors hover:text-ink"
          >
            esc
          </button>
        </div>

        {/* results */}
        <div ref={listRef} className="min-h-0 flex-1 overflow-y-auto py-2" role="listbox" aria-label={t({ en: 'Results', zh: '搜索结果' })}>
          {grouped.flat.length === 0 ? (
            <div className="flex flex-col items-center gap-4 px-6 py-10 text-center">
              <span className="font-display text-4xl text-ink/25">❝</span>
              <p className="text-sm text-ink/55">
                {t({ en: 'Nothing found. Try one of these:', zh: '没有找到，试试这些：' })}
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => setQuery(s)}
                    className="rounded-full border border-ink/15 bg-ink/[0.04] px-3 py-1 font-mono text-[11px] text-ink/60 transition-colors hover:border-gold/50 hover:text-gold"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            grouped.sections.map((sec) => (
              <div key={sec.group} className="px-2 pb-1.5">
                <p className="px-3 pb-1 pt-2.5 font-mono text-[10px] uppercase tracking-[0.2em] text-gold">
                  {t(GROUP_LABEL[sec.group])}
                </p>
                {sec.items.map(({ item, idx }) => {
                  const selected = idx === sel;
                  return (
                    <button
                      key={item.key}
                      data-idx={idx}
                      role="option"
                      aria-selected={selected}
                      onMouseEnter={() => setSel(idx)}
                      onClick={() => runItem(item)}
                      className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${
                        selected ? 'bg-ink/[0.06]' : 'hover:bg-ink/[0.04]'
                      }`}
                    >
                      <span className={`h-4 w-0.5 shrink-0 rounded-full ${selected ? 'bg-gold' : 'bg-transparent'}`} />
                      <span className="grid h-7 w-11 shrink-0 place-items-center rounded-md border border-ink/10 bg-ink/[0.04] font-mono text-[9.5px] uppercase tracking-wide text-ink/50">
                        {item.chip}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-sm text-ink/85">{t(item.title)}</span>
                      {item.meta && <span className="shrink-0 font-mono text-[10.5px] text-ink/40">{item.meta}</span>}
                      <span className={`font-mono text-[10px] transition-opacity ${selected ? 'text-gold opacity-100' : 'opacity-0'}`}>↵</span>
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* footer — key hints + a personal sign-off */}
        <div className="flex items-center justify-between gap-3 border-t border-ink/10 px-4 py-2.5 sm:px-5">
          <div className="flex items-center gap-3 font-mono text-[10px] text-ink/40">
            <span><kbd className="rounded border border-ink/15 bg-ink/5 px-1 py-0.5">↑↓</kbd> {t({ en: 'select', zh: '选择' })}</span>
            <span><kbd className="rounded border border-ink/15 bg-ink/5 px-1 py-0.5">↵</kbd> {t({ en: 'open', zh: '打开' })}</span>
          </div>
          <span className="hidden font-mono text-[10px] text-ink/35 sm:inline">{t({ en: 'Learn & run together 🏃', zh: '一起学习，一起跑步 🏃' })}</span>
        </div>
      </div>
    </div>
  );
};

export default SearchPalette;
