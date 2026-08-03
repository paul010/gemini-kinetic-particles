import React, { useEffect, useMemo, useState } from 'react';
import { CAT_CATALOG_META, CAT_SKILLS, type CatSkillRecord } from './data/catalog';

interface Props {
  onHome: () => void;
}

type PlatformFilter = 'all' | 'Cowork' | 'Copilot Studio' | 'Scout';
type TypeFilter = 'all' | 'skill' | 'plugin' | 'automation';
type SortMode = 'newest' | 'name' | 'downloads';

const OFFICIAL_GALLERY = 'https://microsoft.github.io/cat-agent-skills/';
const OFFICIAL_REPO = 'https://github.com/microsoft/cat-agent-skills';
const PAGE_SIZE = 24;

const platformFilters: { value: PlatformFilter; label: string }[] = [
  { value: 'all', label: '全部平台' },
  { value: 'Cowork', label: 'Cowork' },
  { value: 'Copilot Studio', label: 'Copilot Studio' },
  { value: 'Scout', label: 'Scout' },
];

const typeFilters: { value: TypeFilter; label: string }[] = [
  { value: 'all', label: '全部类型' },
  { value: 'skill', label: 'Skill' },
  { value: 'automation', label: 'Automation' },
  { value: 'plugin', label: 'Plugin' },
];

const typeLabels: Record<string, string> = {
  skill: 'Skill',
  automation: 'Automation',
  plugin: 'Plugin',
};

const formatBytes = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(bytes > 10240 ? 0 : 1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
};

const formatDate = (value: string) => {
  if (!value) return '未标注';
  return value.slice(0, 10);
};

const visibleText = (value: string) => value.replace(/[\u2014\u2013]/g, '-');

const initialsFor = (name: string) => name
  .split(/\s+/)
  .filter(Boolean)
  .slice(0, 2)
  .map((word) => word[0])
  .join('')
  .toUpperCase();

const CatAgentSkills: React.FC<Props> = ({ onHome }) => {
  const [query, setQuery] = useState('');
  const [platform, setPlatform] = useState<PlatformFilter>('all');
  const [type, setType] = useState<TypeFilter>('all');
  const [tag, setTag] = useState('');
  const [sort, setSort] = useState<SortMode>('newest');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [selected, setSelected] = useState<CatSkillRecord | null>(null);

  const stats = useMemo(() => ({
    skills: CAT_SKILLS.filter((item) => item.type === 'skill').length,
    automations: CAT_SKILLS.filter((item) => item.type === 'automation').length,
    plugins: CAT_SKILLS.filter((item) => item.type === 'plugin').length,
    bundles: CAT_SKILLS.filter((item) => item.downloadName !== 'SKILL.md').length,
  }), []);

  const topTags = useMemo(() => {
    const counts = new Map<string, number>();
    CAT_SKILLS.forEach((item) => item.tags.forEach((itemTag) => counts.set(itemTag, (counts.get(itemTag) || 0) + 1)));
    return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, 10);
  }, []);

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const result = CAT_SKILLS.filter((item) => {
      if (platform !== 'all' && !item.platforms.includes(platform as never)) return false;
      if (type !== 'all' && item.type !== type) return false;
      if (tag && !item.tags.includes(tag as never)) return false;
      if (!normalizedQuery) return true;
      return [item.name, item.description, item.author, item.slug, ...item.tags, ...item.platforms]
        .join(' ')
        .toLowerCase()
        .includes(normalizedQuery);
    });

    return [...result].sort((a, b) => {
      if (sort === 'name') return a.name.localeCompare(b.name, 'en');
      if (sort === 'downloads') return b.recordedDownloads - a.recordedDownloads || a.name.localeCompare(b.name, 'en');
      return b.updatedAt.localeCompare(a.updatedAt) || a.name.localeCompare(b.name, 'en');
    });
  }, [platform, query, sort, tag, type]);

  useEffect(() => setVisibleCount(PAGE_SIZE), [platform, query, sort, tag, type]);

  useEffect(() => {
    if (!selected) return undefined;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSelected(null);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [selected]);

  const clearFilters = () => {
    setQuery('');
    setPlatform('all');
    setType('all');
    setTag('');
    setSort('newest');
  };

  return (
    <div className="catalog-page">
      <style>{`
        .catalog-page {
          --catalog-bg: #f4f7fb;
          --catalog-panel: #ffffff;
          --catalog-soft: #e9eff7;
          --catalog-soft-strong: #dbe7f5;
          --catalog-text: #132033;
          --catalog-muted: #56687f;
          --catalog-line: rgba(19, 32, 51, .14);
          --catalog-accent: #1769aa;
          --catalog-accent-ink: #f7fbff;
          min-height: 100dvh;
          background: var(--catalog-bg);
          color: var(--catalog-text);
          font-family: "Aptos", "Segoe UI", system-ui, sans-serif;
        }
        @media (prefers-color-scheme: dark) {
          .catalog-page {
            --catalog-bg: #0d131d;
            --catalog-panel: #111a26;
            --catalog-soft: #162131;
            --catalog-soft-strong: #1c2c40;
            --catalog-text: #edf4fc;
            --catalog-muted: #9eafc3;
            --catalog-line: rgba(220, 234, 249, .14);
            --catalog-accent: #67b7ef;
            --catalog-accent-ink: #07111d;
          }
        }
        .catalog-shell { width: min(1240px, calc(100% - 40px)); margin: 0 auto; }
        .catalog-nav { position: sticky; top: 0; z-index: 30; border-bottom: 1px solid var(--catalog-line); background: color-mix(in srgb, var(--catalog-bg) 90%, transparent); backdrop-filter: blur(18px); }
        .catalog-nav-inner { min-height: 68px; display: flex; align-items: center; justify-content: space-between; gap: 20px; }
        .catalog-brand { display: flex; align-items: center; gap: 14px; min-width: 0; }
        .catalog-home { border: 0; padding: 0; background: transparent; color: var(--catalog-muted); cursor: pointer; font: 650 13px/1.2 ui-monospace, SFMono-Regular, Menlo, monospace; }
        .catalog-home:hover, .catalog-home:focus-visible { color: var(--catalog-text); }
        .catalog-brand-name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-weight: 760; letter-spacing: -.02em; }
        .catalog-nav-links { display: flex; align-items: center; gap: 18px; font-size: 13px; white-space: nowrap; }
        .catalog-link { color: var(--catalog-muted); text-decoration: none; }
        .catalog-link:hover, .catalog-link:focus-visible { color: var(--catalog-accent); }
        .catalog-hero { padding: 70px 0 54px; display: grid; grid-template-columns: minmax(0, 1.2fr) minmax(360px, .8fr); gap: 70px; align-items: end; }
        .catalog-kicker { margin: 0 0 17px; color: var(--catalog-accent); font: 750 12px/1.3 ui-monospace, SFMono-Regular, Menlo, monospace; letter-spacing: .13em; text-transform: uppercase; }
        .catalog-title { max-width: 760px; margin: 0; font-size: clamp(46px, 6vw, 76px); line-height: 1; letter-spacing: -.055em; font-weight: 740; }
        .catalog-lead { max-width: 620px; margin: 24px 0 0; color: var(--catalog-muted); font-size: 18px; line-height: 1.65; }
        .catalog-actions { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 28px; }
        .catalog-button { min-height: 42px; display: inline-flex; align-items: center; justify-content: center; gap: 8px; padding: 0 16px; border: 1px solid var(--catalog-line); border-radius: 10px; background: var(--catalog-panel); color: var(--catalog-text); text-decoration: none; font: 700 13px/1.2 inherit; white-space: nowrap; cursor: pointer; transition: transform .18s ease, border-color .18s ease, background .18s ease; }
        .catalog-button:hover, .catalog-button:focus-visible { border-color: var(--catalog-accent); }
        .catalog-button:active { transform: translateY(1px); }
        .catalog-button-primary { border-color: var(--catalog-accent); background: var(--catalog-accent); color: var(--catalog-accent-ink); }
        .catalog-manifest { display: grid; grid-template-columns: 1.15fr .85fr; gap: 10px; }
        .catalog-stat { min-height: 112px; padding: 18px; border: 1px solid var(--catalog-line); border-radius: 10px; background: var(--catalog-panel); }
        .catalog-stat:first-child { grid-row: span 2; display: flex; flex-direction: column; justify-content: space-between; background: var(--catalog-accent); color: var(--catalog-accent-ink); }
        .catalog-stat-value { display: block; font: 760 clamp(34px, 4vw, 60px)/1 ui-monospace, SFMono-Regular, Menlo, monospace; letter-spacing: -.06em; }
        .catalog-stat-label { display: block; margin-top: 13px; font-size: 12px; line-height: 1.45; opacity: .72; }
        .catalog-notice { border-top: 1px solid var(--catalog-line); border-bottom: 1px solid var(--catalog-line); }
        .catalog-notice-inner { display: grid; grid-template-columns: 1fr auto; gap: 30px; align-items: center; padding: 19px 0; }
        .catalog-notice p { margin: 0; color: var(--catalog-muted); font-size: 13px; line-height: 1.6; }
        .catalog-notice strong { color: var(--catalog-text); }
        .catalog-source-meta { text-align: right; color: var(--catalog-muted); font: 11px/1.55 ui-monospace, SFMono-Regular, Menlo, monospace; }
        .catalog-main { padding: 52px 0 90px; }
        .catalog-tools { display: grid; gap: 18px; }
        .catalog-search-row { display: grid; grid-template-columns: minmax(0, 1fr) 180px; gap: 12px; }
        .catalog-input, .catalog-select { width: 100%; min-height: 50px; border: 1px solid var(--catalog-line); border-radius: 10px; background: var(--catalog-panel); color: var(--catalog-text); outline: none; }
        .catalog-input { padding: 0 17px; font-size: 16px; }
        .catalog-select { padding: 0 14px; font-size: 14px; cursor: pointer; }
        .catalog-input::placeholder { color: var(--catalog-muted); }
        .catalog-input:focus, .catalog-select:focus { border-color: var(--catalog-accent); box-shadow: 0 0 0 3px color-mix(in srgb, var(--catalog-accent) 18%, transparent); }
        .catalog-filter-group { display: flex; flex-wrap: wrap; gap: 8px; }
        .catalog-filter { min-height: 36px; padding: 0 12px; border: 1px solid var(--catalog-line); border-radius: 10px; background: transparent; color: var(--catalog-muted); cursor: pointer; font-size: 12px; font-weight: 680; }
        .catalog-filter:hover, .catalog-filter:focus-visible { color: var(--catalog-text); border-color: var(--catalog-accent); }
        .catalog-filter-active { background: var(--catalog-soft-strong); border-color: var(--catalog-accent); color: var(--catalog-text); }
        .catalog-tags { display: flex; gap: 8px; overflow-x: auto; padding-bottom: 5px; scrollbar-width: thin; }
        .catalog-tag { flex: 0 0 auto; min-height: 32px; padding: 0 10px; border: 1px solid var(--catalog-line); border-radius: 10px; background: var(--catalog-panel); color: var(--catalog-muted); cursor: pointer; font: 600 11px/1 ui-monospace, SFMono-Regular, Menlo, monospace; }
        .catalog-tag-active { border-color: var(--catalog-accent); background: var(--catalog-accent); color: var(--catalog-accent-ink); }
        .catalog-results-head { margin: 36px 0 16px; display: flex; align-items: baseline; justify-content: space-between; gap: 20px; }
        .catalog-results-head h2 { margin: 0; font-size: 24px; letter-spacing: -.03em; }
        .catalog-results-head p { margin: 0; color: var(--catalog-muted); font: 12px/1.4 ui-monospace, SFMono-Regular, Menlo, monospace; }
        .catalog-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
        .catalog-card { min-height: 290px; display: flex; flex-direction: column; padding: 22px; border: 1px solid var(--catalog-line); border-radius: 10px; background: var(--catalog-panel); transition: transform .18s ease, border-color .18s ease, background .18s ease; }
        .catalog-card:nth-child(5n + 1) { background: var(--catalog-soft); }
        .catalog-card:hover { transform: translateY(-2px); border-color: color-mix(in srgb, var(--catalog-accent) 58%, var(--catalog-line)); }
        .catalog-card-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 18px; }
        .catalog-mark { display: grid; width: 46px; height: 46px; flex: 0 0 auto; place-items: center; border-radius: 10px; background: var(--catalog-soft-strong); color: var(--catalog-accent); font: 780 15px/1 ui-monospace, SFMono-Regular, Menlo, monospace; }
        .catalog-kind { color: var(--catalog-muted); font: 650 10px/1.3 ui-monospace, SFMono-Regular, Menlo, monospace; text-transform: uppercase; letter-spacing: .08em; }
        .catalog-card h3 { margin: 19px 0 0; font-size: 21px; line-height: 1.2; letter-spacing: -.025em; }
        .catalog-description { margin: 10px 0 0; color: var(--catalog-muted); font-size: 14px; line-height: 1.58; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
        .catalog-platforms { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 17px; }
        .catalog-platform { padding: 5px 7px; border-radius: 10px; background: var(--catalog-soft); color: var(--catalog-muted); font: 650 10px/1 ui-monospace, SFMono-Regular, Menlo, monospace; }
        .catalog-card-bottom { margin-top: auto; padding-top: 20px; display: flex; align-items: center; justify-content: space-between; gap: 14px; }
        .catalog-author { min-width: 0; color: var(--catalog-muted); font-size: 12px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .catalog-card-actions { display: flex; gap: 7px; }
        .catalog-card-button { min-height: 34px; padding: 0 11px; border: 1px solid var(--catalog-line); border-radius: 10px; background: transparent; color: var(--catalog-text); font-size: 11px; font-weight: 720; text-decoration: none; cursor: pointer; display: inline-flex; align-items: center; white-space: nowrap; }
        .catalog-card-button:hover, .catalog-card-button:focus-visible { border-color: var(--catalog-accent); color: var(--catalog-accent); }
        .catalog-card-download { border-color: var(--catalog-accent); background: var(--catalog-accent); color: var(--catalog-accent-ink); }
        .catalog-card-download:hover, .catalog-card-download:focus-visible { color: var(--catalog-accent-ink); }
        .catalog-more { display: flex; justify-content: center; margin-top: 24px; }
        .catalog-empty { padding: 70px 24px; border: 1px solid var(--catalog-line); border-radius: 10px; text-align: center; background: var(--catalog-panel); }
        .catalog-empty h3 { margin: 0; font-size: 24px; }
        .catalog-empty p { margin: 10px auto 22px; max-width: 480px; color: var(--catalog-muted); line-height: 1.6; }
        .catalog-footer { padding: 34px 0 50px; border-top: 1px solid var(--catalog-line); }
        .catalog-footer-inner { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 28px; color: var(--catalog-muted); font-size: 12px; line-height: 1.65; }
        .catalog-footer p { margin: 0; max-width: 760px; }
        .catalog-overlay { position: fixed; inset: 0; z-index: 50; display: grid; place-items: center; padding: 22px; background: rgba(4, 9, 16, .72); }
        .catalog-dialog { width: min(720px, 100%); max-height: min(780px, calc(100dvh - 44px)); overflow: auto; border: 1px solid var(--catalog-line); border-radius: 10px; background: var(--catalog-panel); color: var(--catalog-text); box-shadow: 0 26px 80px rgba(3, 11, 22, .32); }
        .catalog-dialog-head { position: sticky; top: 0; display: flex; align-items: center; justify-content: space-between; gap: 18px; padding: 18px 22px; border-bottom: 1px solid var(--catalog-line); background: color-mix(in srgb, var(--catalog-panel) 92%, transparent); backdrop-filter: blur(16px); }
        .catalog-dialog-head strong { font-size: 14px; }
        .catalog-close { min-height: 34px; padding: 0 11px; border: 1px solid var(--catalog-line); border-radius: 10px; background: transparent; color: var(--catalog-text); cursor: pointer; }
        .catalog-dialog-body { padding: 28px; }
        .catalog-dialog-title { margin: 20px 0 0; font-size: clamp(31px, 5vw, 48px); line-height: 1.04; letter-spacing: -.045em; }
        .catalog-dialog-description { margin: 18px 0 0; color: var(--catalog-muted); font-size: 16px; line-height: 1.72; }
        .catalog-detail-grid { margin-top: 28px; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
        .catalog-detail { padding: 15px; border-radius: 10px; background: var(--catalog-soft); }
        .catalog-detail-label { display: block; color: var(--catalog-muted); font: 10px/1.3 ui-monospace, SFMono-Regular, Menlo, monospace; text-transform: uppercase; letter-spacing: .08em; }
        .catalog-detail-value { display: block; margin-top: 7px; font-size: 13px; line-height: 1.45; overflow-wrap: anywhere; }
        .catalog-dialog-tags { display: flex; flex-wrap: wrap; gap: 7px; margin-top: 22px; }
        .catalog-dialog-tag { padding: 6px 8px; border: 1px solid var(--catalog-line); border-radius: 10px; color: var(--catalog-muted); font: 11px/1 ui-monospace, SFMono-Regular, Menlo, monospace; }
        .catalog-dialog-actions { display: flex; flex-wrap: wrap; gap: 9px; margin-top: 28px; }
        .catalog-dialog-note { margin: 18px 0 0; color: var(--catalog-muted); font-size: 12px; line-height: 1.6; }
        @media (max-width: 820px) {
          .catalog-shell { width: min(100% - 30px, 680px); }
          .catalog-nav-source { display: none; }
          .catalog-brand-name { font-size: 14px; }
          .catalog-hero { grid-template-columns: 1fr; gap: 40px; padding: 48px 0; }
          .catalog-title { font-size: clamp(42px, 13vw, 62px); }
          .catalog-lead { font-size: 16px; }
          .catalog-manifest { grid-template-columns: 1fr 1fr; }
          .catalog-stat:first-child { grid-row: auto; }
          .catalog-notice-inner, .catalog-footer-inner { grid-template-columns: 1fr; }
          .catalog-source-meta { text-align: left; }
          .catalog-main { padding: 38px 0 64px; }
          .catalog-search-row, .catalog-grid { grid-template-columns: 1fr; }
          .catalog-results-head { align-items: flex-start; flex-direction: column; gap: 6px; }
          .catalog-card { min-height: 270px; }
          .catalog-overlay { padding: 10px; align-items: end; }
          .catalog-dialog { max-height: calc(100dvh - 20px); }
          .catalog-detail-grid { grid-template-columns: 1fr; }
        }
        @media (prefers-reduced-motion: reduce) {
          .catalog-button, .catalog-card { transition: none; }
          .catalog-card:hover, .catalog-button:active { transform: none; }
        }
      `}</style>

      <nav className="catalog-nav" aria-label="CAT Skill 分发站导航">
        <div className="catalog-shell catalog-nav-inner">
          <div className="catalog-brand">
            <button className="catalog-home" onClick={onHome}>← 大雷</button>
            <span className="catalog-brand-name">CAT Agent Skills 中文分发</span>
          </div>
          <div className="catalog-nav-links">
            <a className="catalog-link catalog-nav-source" href="/cat-skills-data/catalog.json" target="_blank" rel="noreferrer">数据清单</a>
            <a className="catalog-link" href={OFFICIAL_REPO} target="_blank" rel="noreferrer">官方源码 ↗</a>
          </div>
        </div>
      </nav>

      <header className="catalog-shell catalog-hero">
        <div>
          <p className="catalog-kicker">Agent Skill Distribution</p>
          <h1 className="catalog-title">找到，检查，下载。</h1>
          <p className="catalog-lead">微软 CAT 社区 Skill 的中文分发目录。数据和安装文件已同步到本站，可直接用于培训与实践。</p>
          <div className="catalog-actions">
            <a className="catalog-button catalog-button-primary" href="#catalog">浏览全部 {CAT_CATALOG_META.total} 项</a>
            <a className="catalog-button" href={OFFICIAL_GALLERY} target="_blank" rel="noreferrer">查看官方图库 ↗</a>
          </div>
        </div>
        <div className="catalog-manifest" aria-label="目录统计">
          <div className="catalog-stat">
            <span className="catalog-stat-value">{CAT_CATALOG_META.total}</span>
            <span className="catalog-stat-label">已同步条目<br />全部可在本站下载</span>
          </div>
          <div className="catalog-stat">
            <span className="catalog-stat-value">{stats.skills}</span>
            <span className="catalog-stat-label">Skills</span>
          </div>
          <div className="catalog-stat">
            <span className="catalog-stat-value">{stats.automations + stats.plugins}</span>
            <span className="catalog-stat-label">Automations + Plugins</span>
          </div>
        </div>
      </header>

      <section className="catalog-notice">
        <div className="catalog-shell catalog-notice-inner">
          <p><strong>安装前先审查。</strong> Skill 会继承 Agent 的权限。请检查说明、脚本、连接器和外部依赖，再加入培训或生产环境。</p>
          <div className="catalog-source-meta">
            SOURCE {CAT_CATALOG_META.sourceCommit.slice(0, 8)}<br />
            SYNC {formatDate(CAT_CATALOG_META.sourceCommitDate)} / MIT
          </div>
        </div>
      </section>

      <main className="catalog-shell catalog-main" id="catalog">
        <div className="catalog-tools" aria-label="筛选 Skill">
          <div className="catalog-search-row">
            <input
              className="catalog-input"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="搜索名称、描述、作者或标签"
              aria-label="搜索 Skill"
            />
            <select className="catalog-select" value={sort} onChange={(event) => setSort(event.target.value as SortMode)} aria-label="排序">
              <option value="newest">最近更新</option>
              <option value="name">名称排序</option>
              <option value="downloads">官方下载记录</option>
            </select>
          </div>

          <div className="catalog-filter-group" aria-label="平台筛选">
            {platformFilters.map((item) => (
              <button
                key={item.value}
                className={`catalog-filter ${platform === item.value ? 'catalog-filter-active' : ''}`}
                onClick={() => setPlatform(item.value)}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="catalog-filter-group" aria-label="类型筛选">
            {typeFilters.map((item) => (
              <button
                key={item.value}
                className={`catalog-filter ${type === item.value ? 'catalog-filter-active' : ''}`}
                onClick={() => setType(item.value)}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="catalog-tags" aria-label="热门标签">
            {topTags.map(([itemTag, count]) => (
              <button
                key={itemTag}
                className={`catalog-tag ${tag === itemTag ? 'catalog-tag-active' : ''}`}
                onClick={() => setTag((current) => current === itemTag ? '' : itemTag)}
              >
                {itemTag} {count}
              </button>
            ))}
          </div>
        </div>

        <div className="catalog-results-head">
          <h2>{filtered.length} 个结果</h2>
          <p>本地数据 / 本地下载 / 官方署名</p>
        </div>

        {filtered.length ? (
          <>
            <div className="catalog-grid">
              {filtered.slice(0, visibleCount).map((item) => (
                <article className="catalog-card" key={item.slug}>
                  <div className="catalog-card-top">
                    <span className="catalog-mark">{initialsFor(visibleText(item.name))}</span>
                    <span className="catalog-kind">{typeLabels[item.type] || item.type}</span>
                  </div>
                  <h3>{visibleText(item.name)}</h3>
                  <p className="catalog-description">{visibleText(item.description)}</p>
                  <div className="catalog-platforms">
                    {item.platforms.map((itemPlatform) => <span className="catalog-platform" key={itemPlatform}>{visibleText(itemPlatform)}</span>)}
                  </div>
                  <div className="catalog-card-bottom">
                    <span className="catalog-author">{visibleText(item.author)}</span>
                    <div className="catalog-card-actions">
                      <button className="catalog-card-button" onClick={() => setSelected(item)}>详情</button>
                      <a className="catalog-card-button catalog-card-download" href={item.downloadUrl} download={item.downloadName}>下载</a>
                    </div>
                  </div>
                </article>
              ))}
            </div>
            {visibleCount < filtered.length && (
              <div className="catalog-more">
                <button className="catalog-button" onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}>
                  加载更多 ({filtered.length - visibleCount})
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="catalog-empty">
            <h3>没有匹配的 Skill</h3>
            <p>换一个关键词，或者清除平台、类型和标签筛选。</p>
            <button className="catalog-button catalog-button-primary" onClick={clearFilters}>清除筛选</button>
          </div>
        )}
      </main>

      <footer className="catalog-footer">
        <div className="catalog-shell catalog-footer-inner">
          <p>这是大雷维护的非官方中文分发镜像。数据来自 Microsoft CAT Agent Skills，依据 MIT License 再分发。作者、原始页面、源码提交和许可证均保留。最新内容与支持状态以官方项目为准。</p>
          <div className="catalog-nav-links">
            <a className="catalog-link" href="/cat-skills-data/LICENSE" target="_blank" rel="noreferrer">许可证</a>
            <a className="catalog-link" href="/cat-skills-data/NOTICE.md" target="_blank" rel="noreferrer">第三方声明</a>
          </div>
        </div>
      </footer>

      {selected && (
        <div className="catalog-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelected(null); }}>
          <section className="catalog-dialog" role="dialog" aria-modal="true" aria-labelledby="catalog-dialog-title">
            <div className="catalog-dialog-head">
              <strong>分发详情</strong>
              <button className="catalog-close" onClick={() => setSelected(null)} aria-label="关闭详情">关闭</button>
            </div>
            <div className="catalog-dialog-body">
              <span className="catalog-mark">{initialsFor(visibleText(selected.name))}</span>
              <h2 className="catalog-dialog-title" id="catalog-dialog-title">{visibleText(selected.name)}</h2>
              <p className="catalog-dialog-description">{visibleText(selected.description)}</p>
              <div className="catalog-detail-grid">
                <div className="catalog-detail"><span className="catalog-detail-label">类型</span><span className="catalog-detail-value">{typeLabels[selected.type] || selected.type}</span></div>
                <div className="catalog-detail"><span className="catalog-detail-label">适用平台</span><span className="catalog-detail-value">{visibleText(selected.platforms.join(' / '))}</span></div>
                <div className="catalog-detail"><span className="catalog-detail-label">作者</span><span className="catalog-detail-value">{visibleText(selected.author)}</span></div>
                <div className="catalog-detail"><span className="catalog-detail-label">版本</span><span className="catalog-detail-value">{selected.version || '未标注'}</span></div>
                <div className="catalog-detail"><span className="catalog-detail-label">更新时间</span><span className="catalog-detail-value">{formatDate(selected.updatedAt)}</span></div>
                <div className="catalog-detail"><span className="catalog-detail-label">下载文件</span><span className="catalog-detail-value">{selected.downloadName} / {formatBytes(selected.downloadSize)}</span></div>
              </div>
              <div className="catalog-dialog-tags">
                {selected.tags.map((itemTag) => <span className="catalog-dialog-tag" key={itemTag}>{visibleText(itemTag)}</span>)}
              </div>
              <div className="catalog-dialog-actions">
                <a className="catalog-button catalog-button-primary" href={selected.downloadUrl} download={selected.downloadName}>本站下载</a>
                <a className="catalog-button" href={selected.markdownUrl} target="_blank" rel="noreferrer">查看本地说明</a>
                <a className="catalog-button" href={selected.officialUrl} target="_blank" rel="noreferrer">官方页面 ↗</a>
                <a className="catalog-button" href={selected.sourceUrl} target="_blank" rel="noreferrer">固定版本源码 ↗</a>
              </div>
              <p className="catalog-dialog-note">下载文件已从上方标注的官方提交同步到本站。安装前请阅读本地说明并审查其中的脚本、权限和外部依赖。</p>
            </div>
          </section>
        </div>
      )}
    </div>
  );
};

export default CatAgentSkills;
