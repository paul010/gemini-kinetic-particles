import React, { useEffect, useMemo, useState } from 'react';
import { marked } from 'marked';
import { CAT_CATALOG_META, CAT_SKILLS, type CatSkillRecord } from './data/catalog';

interface Props {
  onHome: () => void;
}

type PlatformFilter = 'all' | 'Cowork' | 'Copilot Studio' | 'Scout';
type TypeFilter = 'all' | 'skill' | 'plugin' | 'automation';
type SortMode = 'newest' | 'name' | 'downloads';
type ViewMode = 'training' | 'catalog';
type PreviewState =
  | { status: 'idle' | 'loading'; text: '' }
  | { status: 'ready'; text: string }
  | { status: 'error'; text: '' };

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

const TRAINING_EXAMPLES = [
  {
    slug: 'accessibility-pass',
    title: '检查一份文档',
    summary: '找出 PPT、Word、网页或 Markdown 中影响阅读的问题。',
    outcome: '得到问题清单和具体修改建议',
    prompt: '请检查我提供的文件是否存在无障碍问题。先按严重程度列出问题，再说明位置和修改方法。可以直接修复的内容，请先告诉我你准备怎样修改。',
  },
  {
    slug: 'work-brief',
    title: '整理今日工作',
    summary: '从邮件、日历和聊天记录中提取真正需要处理的事情。',
    outcome: '生成一份清晰、可执行的工作简报',
    prompt: '请根据我今天的邮件、日历和聊天内容整理一份工作简报。只保留需要我行动、等待他人回复或存在风险的事项，并给出建议优先级。',
  },
  {
    slug: 'generating-podcast-script',
    title: '把资料变成播客',
    summary: '把文章或一组资料整理成自然的双人播客脚本。',
    outcome: '得到带角色、节奏和结构的完整脚本',
    prompt: '请把我提供的资料改写成一段双人播客脚本。保留关键事实，使用自然对话，不要添加资料中没有的信息，并标出开场、讨论和结尾。',
  },
  {
    slug: 'agent-evaluation-designer',
    title: '测试一个 AI Agent',
    summary: '先定义什么叫做得好，再准备测试题和判断标准。',
    outcome: '得到可执行的评测方案和上线判断依据',
    prompt: '请为这个 AI Agent 设计一套评测方案。先确认使用场景和风险，再定义通过标准、测试题、评分方法以及上线或暂缓上线的判断规则。',
  },
] as const;

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

const stripFrontmatter = (value: string) => value.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, '');

const renderSafeMarkdown = (value: string) => {
  const raw = marked.parse(visibleText(stripFrontmatter(value)), { async: false, gfm: true }) as string;
  const template = document.createElement('template');
  template.innerHTML = raw;
  template.content.querySelectorAll('script, style, iframe, object, embed, form, input, button, meta, link').forEach((node) => node.remove());
  template.content.querySelectorAll<HTMLElement>('*').forEach((node) => {
    [...node.attributes].forEach((attribute) => {
      const name = attribute.name.toLowerCase();
      const content = attribute.value.trim().toLowerCase();
      if (name.startsWith('on') || name === 'style') node.removeAttribute(attribute.name);
      if ((name === 'href' || name === 'src') && (content.startsWith('javascript:') || content.startsWith('data:'))) {
        node.removeAttribute(attribute.name);
      }
    });
    if (node.tagName === 'A') {
      node.setAttribute('target', '_blank');
      node.setAttribute('rel', 'noreferrer');
    }
  });
  return template.innerHTML;
};

const initialsFor = (name: string) => name
  .split(/\s+/)
  .filter(Boolean)
  .slice(0, 2)
  .map((word) => word[0])
  .join('')
  .toUpperCase();

const CatAgentSkills: React.FC<Props> = ({ onHome }) => {
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    if (typeof window === 'undefined') return 'training';
    return new URLSearchParams(window.location.search).get('view') === 'catalog' ? 'catalog' : 'training';
  });
  const [query, setQuery] = useState('');
  const [platform, setPlatform] = useState<PlatformFilter>('all');
  const [type, setType] = useState<TypeFilter>('all');
  const [tag, setTag] = useState('');
  const [sort, setSort] = useState<SortMode>('newest');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [selected, setSelected] = useState<CatSkillRecord | null>(null);
  const [preview, setPreview] = useState<PreviewState>({ status: 'idle', text: '' });
  const [copiedPrompt, setCopiedPrompt] = useState('');
  const [theme, setTheme] = useState<'light' | 'dark'>(() =>
    typeof document !== 'undefined' && document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light'
  );

  const stats = useMemo(() => ({
    skills: CAT_SKILLS.filter((item) => item.type === 'skill').length,
    automations: CAT_SKILLS.filter((item) => item.type === 'automation').length,
    plugins: CAT_SKILLS.filter((item) => item.type === 'plugin').length,
    bundles: CAT_SKILLS.filter((item) => item.downloadName !== 'SKILL.md').length,
  }), []);

  const trainingItems = useMemo(() => TRAINING_EXAMPLES.map((example) => ({
    example,
    item: CAT_SKILLS.find((item) => item.slug === example.slug),
  })).filter((entry): entry is { example: typeof TRAINING_EXAMPLES[number]; item: CatSkillRecord } => Boolean(entry.item)), []);

  const selectedTrainingExample = viewMode === 'training' && selected
    ? TRAINING_EXAMPLES.find((example) => example.slug === selected.slug)
    : undefined;

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
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSelected(null);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [selected]);

  useEffect(() => {
    if (!selected) {
      setPreview({ status: 'idle', text: '' });
      return undefined;
    }
    const controller = new AbortController();
    setPreview({ status: 'loading', text: '' });
    fetch(selected.markdownUrl, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error(`Preview request failed: ${response.status}`);
        return response.text();
      })
      .then((text) => setPreview({ status: 'ready', text }))
      .catch((error) => {
        if (error instanceof DOMException && error.name === 'AbortError') return;
        setPreview({ status: 'error', text: '' });
      });
    return () => controller.abort();
  }, [selected]);

  const previewHtml = useMemo(
    () => preview.status === 'ready' ? renderSafeMarkdown(preview.text) : '',
    [preview]
  );

  const toggleTheme = () => {
    setTheme((current) => {
      const next = current === 'light' ? 'dark' : 'light';
      document.documentElement.dataset.theme = next;
      try { window.localStorage.setItem('dalei-theme', next); } catch { /* private mode */ }
      return next;
    });
  };

  const clearFilters = () => {
    setQuery('');
    setPlatform('all');
    setType('all');
    setTag('');
    setSort('newest');
  };

  const changeViewMode = (next: ViewMode) => {
    setViewMode(next);
    const url = new URL(window.location.href);
    if (next === 'catalog') url.searchParams.set('view', 'catalog');
    else url.searchParams.delete('view');
    window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
    window.requestAnimationFrame(() => document.getElementById(next === 'training' ? 'training-cases' : 'catalog')?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  };

  const copyTrainingPrompt = (slug: string, prompt: string) => {
    navigator.clipboard?.writeText(prompt).then(() => {
      setCopiedPrompt(slug);
      window.setTimeout(() => setCopiedPrompt((current) => current === slug ? '' : current), 1600);
    }).catch(() => {});
  };

  return (
    <div className="catalog-page">
      <style>{`
        .catalog-page {
          --catalog-bg: var(--paper);
          --catalog-panel: color-mix(in srgb, var(--surface) 66%, var(--paper));
          --catalog-soft: rgb(var(--rgb-ink) / .035);
          --catalog-soft-strong: rgb(var(--rgb-ink) / .075);
          --catalog-text: var(--ink);
          --catalog-muted: rgb(var(--rgb-ink) / .7);
          --catalog-line: var(--line);
          --catalog-accent: var(--gold);
          --catalog-accent-ink: var(--paper);
          --catalog-accent-strong: color-mix(in srgb, var(--gold) 70%, var(--ink));
          min-height: 100dvh;
          background: var(--catalog-bg);
          color: var(--catalog-text);
          font-family: inherit;
          isolation: isolate;
        }
        .catalog-page > :not(.catalog-backdrop):not(.catalog-overlay) { position: relative; z-index: 1; }
        .catalog-backdrop { position: fixed; inset: 0; z-index: 0; pointer-events: none; background: radial-gradient(60% 45% at 82% 8%, rgb(var(--rgb-gold) / .065), transparent 72%), radial-gradient(55% 50% at 18% 92%, rgb(var(--rgb-ink) / .04), transparent 74%); }
        .catalog-shell { width: min(1152px, calc(100% - 40px)); margin: 0 auto; }
        .catalog-nav { position: sticky; top: 0; z-index: 30; border-bottom: 1px solid var(--catalog-line); background: color-mix(in srgb, var(--catalog-bg) 90%, transparent); backdrop-filter: blur(18px); }
        .catalog-nav-inner { min-height: 68px; display: flex; align-items: center; justify-content: space-between; gap: 20px; }
        .catalog-brand { display: flex; align-items: center; gap: 14px; min-width: 0; }
        .catalog-home { border: 0; padding: 0; background: transparent; color: var(--catalog-muted); cursor: pointer; font: 650 13px/1.2 ui-monospace, SFMono-Regular, Menlo, monospace; }
        .catalog-home:hover, .catalog-home:focus-visible { color: var(--catalog-text); }
        .catalog-brand-name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-weight: 760; letter-spacing: -.02em; }
        .catalog-nav-links { display: flex; align-items: center; gap: 18px; font-size: 13px; white-space: nowrap; }
        .catalog-view-switch { display: inline-flex; align-items: center; gap: 2px; padding: 3px; border: 1px solid var(--catalog-line); border-radius: 999px; background: var(--catalog-soft); }
        .catalog-view-option { min-height: 30px; padding: 0 12px; border: 0; border-radius: 999px; background: transparent; color: var(--catalog-muted); cursor: pointer; font-size: 12px; font-weight: 700; }
        .catalog-view-option-active { background: var(--ink); color: var(--paper); }
        .catalog-link { color: var(--catalog-muted); text-decoration: none; }
        .catalog-link:hover, .catalog-link:focus-visible { color: var(--catalog-accent); }
        .catalog-hero { padding: 70px 0 54px; display: grid; grid-template-columns: minmax(0, 1.2fr) minmax(360px, .8fr); gap: 70px; align-items: end; }
        .catalog-kicker { margin: 0 0 17px; color: var(--catalog-accent); font: 750 12px/1.3 ui-monospace, SFMono-Regular, Menlo, monospace; letter-spacing: .13em; text-transform: uppercase; }
        .catalog-title { max-width: 760px; margin: 0; font-size: clamp(46px, 6vw, 76px); line-height: 1; letter-spacing: -.055em; font-weight: 740; }
        .catalog-lead { max-width: 620px; margin: 24px 0 0; color: var(--catalog-muted); font-size: 18px; line-height: 1.65; }
        .catalog-actions { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 28px; }
        .catalog-button { min-height: 42px; display: inline-flex; align-items: center; justify-content: center; gap: 8px; padding: 0 17px; border: 1px solid var(--catalog-line); border-radius: 999px; background: var(--catalog-panel); color: var(--catalog-text); text-decoration: none; font: 700 13px/1.2 inherit; white-space: nowrap; cursor: pointer; transition: transform .18s ease, border-color .18s ease, background .18s ease; }
        .catalog-button:hover, .catalog-button:focus-visible { border-color: var(--catalog-accent); }
        .catalog-button:active { transform: translateY(1px); }
        .catalog-button-primary { border-color: var(--catalog-accent); background: var(--catalog-accent); color: var(--catalog-accent-ink); }
        .catalog-manifest { display: grid; grid-template-columns: 1.15fr .85fr; gap: 10px; }
        .catalog-classroom { padding: 22px; border: 1px solid var(--catalog-line); border-radius: 20px; background: color-mix(in srgb, var(--catalog-panel) 84%, transparent); }
        .catalog-classroom h2 { margin: 0 0 18px; font-size: 20px; letter-spacing: -.025em; }
        .catalog-classroom-list { display: grid; gap: 0; margin: 0; padding: 0; list-style: none; }
        .catalog-classroom-list li { display: grid; grid-template-columns: 72px 1fr; gap: 16px; padding: 14px 0; border-bottom: 1px solid var(--catalog-line); }
        .catalog-classroom-list li:last-child { border-bottom: 0; }
        .catalog-classroom-list strong { font-size: 13px; }
        .catalog-classroom-list span { color: var(--catalog-muted); font-size: 13px; line-height: 1.5; }
        .catalog-stat { min-height: 112px; padding: 18px; border: 1px solid var(--catalog-line); border-radius: 18px; background: var(--catalog-panel); }
        .catalog-stat:first-child { grid-row: span 2; display: flex; flex-direction: column; justify-content: space-between; background: var(--ink); color: var(--paper); }
        .catalog-stat-value { display: block; font: 760 clamp(34px, 4vw, 60px)/1 ui-monospace, SFMono-Regular, Menlo, monospace; letter-spacing: -.06em; }
        .catalog-stat-label { display: block; margin-top: 13px; font-size: 12px; line-height: 1.45; opacity: .72; }
        .catalog-notice { border-top: 1px solid var(--catalog-line); border-bottom: 1px solid var(--catalog-line); }
        .catalog-notice-inner { display: grid; grid-template-columns: 1fr auto; gap: 30px; align-items: center; padding: 19px 0; }
        .catalog-notice p { margin: 0; color: var(--catalog-muted); font-size: 13px; line-height: 1.6; }
        .catalog-notice strong { color: var(--catalog-text); }
        .catalog-source-meta { text-align: right; color: var(--catalog-muted); font: 11px/1.55 ui-monospace, SFMono-Regular, Menlo, monospace; }
        .catalog-main { padding: 52px 0 90px; }
        .catalog-training { padding: 52px 0 90px; }
        .catalog-training-head { max-width: 680px; }
        .catalog-training-head h2 { margin: 0; font-size: clamp(34px, 5vw, 52px); line-height: 1.05; letter-spacing: -.045em; }
        .catalog-training-head p { margin: 16px 0 0; color: var(--catalog-muted); font-size: 16px; line-height: 1.65; }
        .catalog-training-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; margin-top: 30px; }
        .catalog-training-card { min-height: 300px; display: flex; flex-direction: column; padding: 26px; border: 1px solid var(--catalog-line); border-radius: 18px; background: color-mix(in srgb, var(--catalog-panel) 84%, transparent); }
        .catalog-training-card:nth-child(1), .catalog-training-card:nth-child(4) { background: var(--catalog-soft); border-color: color-mix(in srgb, var(--catalog-accent) 44%, var(--catalog-line)); }
        .catalog-training-card h3 { margin: 0; font-size: 28px; letter-spacing: -.035em; }
        .catalog-training-official { margin-top: 8px; color: var(--catalog-muted); font: 11px/1.4 ui-monospace, SFMono-Regular, Menlo, monospace; }
        .catalog-training-summary { margin: 24px 0 0; color: var(--catalog-text); font-size: 16px; line-height: 1.65; }
        .catalog-training-outcome { margin-top: 18px; color: var(--catalog-muted); font-size: 13px; line-height: 1.55; }
        .catalog-training-outcome strong { display: block; margin-bottom: 4px; color: var(--catalog-text); }
        .catalog-training-card .catalog-button { align-self: flex-start; margin-top: auto; }
        .catalog-training-more { margin-top: 32px; display: flex; align-items: center; justify-content: space-between; gap: 24px; padding: 26px 0; border-top: 1px solid var(--catalog-line); }
        .catalog-training-more h3 { margin: 0; font-size: 22px; }
        .catalog-training-more p { margin: 7px 0 0; color: var(--catalog-muted); font-size: 13px; }
        .catalog-tools { display: grid; gap: 18px; }
        .catalog-search-row { display: grid; grid-template-columns: minmax(0, 1fr) 180px; gap: 12px; }
        .catalog-input, .catalog-select { width: 100%; min-height: 50px; border: 1px solid var(--catalog-line); border-radius: 14px; background: var(--catalog-panel); color: var(--catalog-text); outline: none; }
        .catalog-input { padding: 0 17px; font-size: 16px; }
        .catalog-select { padding: 0 14px; font-size: 14px; cursor: pointer; }
        .catalog-input::placeholder { color: var(--catalog-muted); }
        .catalog-input:focus, .catalog-select:focus { border-color: var(--catalog-accent); box-shadow: 0 0 0 3px color-mix(in srgb, var(--catalog-accent) 18%, transparent); }
        .catalog-filter-group { display: flex; flex-wrap: wrap; gap: 8px; }
        .catalog-filter { min-height: 36px; padding: 0 13px; border: 1px solid var(--catalog-line); border-radius: 999px; background: transparent; color: var(--catalog-muted); cursor: pointer; font-size: 12px; font-weight: 680; }
        .catalog-filter:hover, .catalog-filter:focus-visible { color: var(--catalog-text); border-color: var(--catalog-accent); }
        .catalog-filter-active { background: var(--catalog-soft-strong); border-color: var(--catalog-accent); color: var(--catalog-text); }
        .catalog-tags { display: flex; gap: 8px; overflow-x: auto; padding-bottom: 5px; scrollbar-width: thin; }
        .catalog-tag { flex: 0 0 auto; min-height: 32px; padding: 0 11px; border: 1px solid var(--catalog-line); border-radius: 999px; background: var(--catalog-panel); color: var(--catalog-muted); cursor: pointer; font: 600 11px/1 ui-monospace, SFMono-Regular, Menlo, monospace; }
        .catalog-tag-active { border-color: var(--catalog-accent); background: var(--catalog-accent); color: var(--catalog-accent-ink); }
        .catalog-results-head { margin: 36px 0 16px; display: flex; align-items: baseline; justify-content: space-between; gap: 20px; }
        .catalog-results-head h2 { margin: 0; font-size: 24px; letter-spacing: -.03em; }
        .catalog-results-head p { margin: 0; color: var(--catalog-muted); font: 12px/1.4 ui-monospace, SFMono-Regular, Menlo, monospace; }
        .catalog-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
        .catalog-card { min-height: 290px; display: flex; flex-direction: column; padding: 22px; border: 1px solid var(--catalog-line); border-radius: 18px; background: color-mix(in srgb, var(--catalog-panel) 82%, transparent); backdrop-filter: blur(10px); transition: transform .18s ease, border-color .18s ease, background .18s ease; }
        .catalog-card:nth-child(5n + 1) { background: var(--catalog-soft); }
        .catalog-card:hover { transform: translateY(-2px); border-color: color-mix(in srgb, var(--catalog-accent) 58%, var(--catalog-line)); }
        .catalog-card-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 18px; }
        .catalog-mark { display: grid; width: 46px; height: 46px; flex: 0 0 auto; place-items: center; border-radius: 12px; border: 1px solid var(--catalog-line); background: var(--catalog-soft-strong); color: var(--catalog-accent-strong); font: 780 15px/1 ui-monospace, SFMono-Regular, Menlo, monospace; }
        .catalog-kind { color: var(--catalog-muted); font: 650 10px/1.3 ui-monospace, SFMono-Regular, Menlo, monospace; text-transform: uppercase; letter-spacing: .08em; }
        .catalog-card h3 { margin: 19px 0 0; font-size: 21px; line-height: 1.2; letter-spacing: -.025em; }
        .catalog-description { margin: 10px 0 0; color: var(--catalog-muted); font-size: 14px; line-height: 1.58; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
        .catalog-platforms { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 17px; }
        .catalog-platform { padding: 5px 8px; border-radius: 8px; background: var(--catalog-soft); color: var(--catalog-muted); font: 650 10px/1 ui-monospace, SFMono-Regular, Menlo, monospace; }
        .catalog-card-bottom { margin-top: auto; padding-top: 20px; display: flex; align-items: center; justify-content: space-between; gap: 14px; }
        .catalog-author { min-width: 0; color: var(--catalog-muted); font-size: 12px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .catalog-card-actions { display: flex; gap: 7px; }
        .catalog-card-button { min-height: 34px; padding: 0 13px; border: 1px solid var(--catalog-line); border-radius: 999px; background: transparent; color: var(--catalog-text); font-size: 11px; font-weight: 720; text-decoration: none; cursor: pointer; display: inline-flex; align-items: center; white-space: nowrap; }
        .catalog-card-button:hover, .catalog-card-button:focus-visible { border-color: var(--catalog-accent); color: var(--catalog-accent); }
        .catalog-more { display: flex; justify-content: center; margin-top: 24px; }
        .catalog-empty { padding: 70px 24px; border: 1px solid var(--catalog-line); border-radius: 18px; text-align: center; background: var(--catalog-panel); }
        .catalog-empty h3 { margin: 0; font-size: 24px; }
        .catalog-empty p { margin: 10px auto 22px; max-width: 480px; color: var(--catalog-muted); line-height: 1.6; }
        .catalog-footer { padding: 34px 0 50px; border-top: 1px solid var(--catalog-line); }
        .catalog-footer-inner { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 28px; color: var(--catalog-muted); font-size: 12px; line-height: 1.65; }
        .catalog-footer p { margin: 0; max-width: 760px; }
        .catalog-overlay { position: fixed; inset: 0; z-index: 50; display: grid; place-items: center; padding: 22px; background: rgb(var(--rgb-ink) / .62); backdrop-filter: blur(8px); }
        .catalog-dialog { width: min(1080px, 100%); height: min(860px, calc(100dvh - 44px)); display: grid; grid-template-rows: auto minmax(0, 1fr); overflow: hidden; border: 1px solid var(--catalog-line); border-radius: 24px; background: var(--paper); color: var(--catalog-text); box-shadow: 0 26px 80px rgb(var(--rgb-ink) / .22); }
        .catalog-dialog-head { display: flex; align-items: center; justify-content: space-between; gap: 18px; padding: 16px 20px; border-bottom: 1px solid var(--catalog-line); background: color-mix(in srgb, var(--paper) 88%, transparent); backdrop-filter: blur(16px); }
        .catalog-dialog-head strong { font-size: 14px; }
        .catalog-close, .catalog-theme { min-height: 34px; padding: 0 13px; border: 1px solid var(--catalog-line); border-radius: 999px; background: var(--catalog-soft); color: var(--catalog-text); cursor: pointer; }
        .catalog-dialog-scroll { overflow: auto; }
        .catalog-dialog-body { display: grid; grid-template-columns: minmax(280px, .4fr) minmax(0, 1fr); gap: 42px; padding: 32px; }
        .catalog-dialog-summary { align-self: start; position: sticky; top: 0; }
        .catalog-dialog-title { margin: 18px 0 0; font-size: clamp(28px, 3vw, 36px); line-height: 1.06; letter-spacing: -.04em; }
        .catalog-dialog-official { margin-top: 9px; color: var(--catalog-muted); font: 11px/1.45 ui-monospace, SFMono-Regular, Menlo, monospace; }
        .catalog-dialog-description { margin: 16px 0 0; color: var(--catalog-muted); font-size: 14px; line-height: 1.65; }
        .catalog-detail-grid { margin-top: 24px; display: grid; gap: 1px; overflow: hidden; border: 1px solid var(--catalog-line); border-radius: 14px; background: var(--catalog-line); }
        .catalog-detail { padding: 13px 14px; background: var(--paper); }
        .catalog-detail-label { display: block; color: var(--catalog-muted); font: 10px/1.3 ui-monospace, SFMono-Regular, Menlo, monospace; text-transform: uppercase; letter-spacing: .08em; }
        .catalog-detail-value { display: block; margin-top: 7px; font-size: 13px; line-height: 1.45; overflow-wrap: anywhere; }
        .catalog-detail-value a { color: inherit; text-decoration-color: var(--catalog-line); text-underline-offset: 3px; }
        .catalog-detail-value a:hover, .catalog-detail-value a:focus-visible { color: var(--catalog-accent); }
        .catalog-dialog-tags { display: flex; flex-wrap: wrap; gap: 7px; margin-top: 18px; }
        .catalog-dialog-tag { padding: 6px 8px; border: 1px solid var(--catalog-line); border-radius: 8px; color: var(--catalog-muted); font: 11px/1 ui-monospace, SFMono-Regular, Menlo, monospace; }
        .catalog-preview { min-width: 0; }
        .catalog-preview-head { padding-bottom: 18px; border-bottom: 1px solid var(--catalog-line); }
        .catalog-preview-head h3 { margin: 0; font-size: 22px; letter-spacing: -.025em; }
        .catalog-preview-head p { margin: 7px 0 0; color: var(--catalog-muted); font-size: 12px; line-height: 1.55; }
        .catalog-class-guide { margin-top: 22px; padding: 20px; border: 1px solid color-mix(in srgb, var(--catalog-accent) 44%, var(--catalog-line)); border-radius: 16px; background: var(--catalog-soft); }
        .catalog-class-guide h4 { margin: 0; font-size: 18px; }
        .catalog-class-guide p { margin: 9px 0 0; color: var(--catalog-muted); font-size: 14px; line-height: 1.6; }
        .catalog-class-result { margin-top: 16px; color: var(--catalog-text); font-size: 13px; }
        .catalog-class-prompt { margin-top: 18px; padding: 15px; border-radius: 12px; background: var(--paper); font-size: 13px; line-height: 1.65; }
        .catalog-class-prompt strong { display: block; margin-bottom: 7px; font-size: 12px; }
        .catalog-copy-prompt { display: block; margin-top: 12px; min-height: 34px; padding: 0 13px; border: 1px solid var(--catalog-line); border-radius: 999px; background: transparent; color: var(--catalog-text); cursor: pointer; font-size: 12px; font-weight: 700; }
        .catalog-official-guide { margin: 30px 0 0; padding-top: 24px; border-top: 1px solid var(--catalog-line); }
        .catalog-official-guide h4 { margin: 0; font-size: 18px; }
        .catalog-official-guide p { margin: 7px 0 0; color: var(--catalog-muted); font-size: 12px; line-height: 1.55; }
        .catalog-preview-state { min-height: 260px; display: grid; place-items: center; padding: 32px; color: var(--catalog-muted); text-align: center; border-radius: 16px; background: var(--catalog-soft); }
        .catalog-preview-state strong { display: block; color: var(--catalog-text); margin-bottom: 8px; }
        .catalog-preview-skeleton { width: 100%; display: grid; gap: 12px; }
        .catalog-preview-skeleton span { display: block; height: 12px; border-radius: 999px; background: var(--catalog-soft-strong); }
        .catalog-preview-skeleton span:nth-child(2) { width: 88%; }
        .catalog-preview-skeleton span:nth-child(3) { width: 66%; }
        .catalog-doc { padding: 24px 2px 8px; color: color-mix(in srgb, var(--catalog-text) 82%, transparent); font-size: 14px; line-height: 1.75; overflow-wrap: anywhere; }
        .catalog-doc > :first-child { margin-top: 0; }
        .catalog-doc h1, .catalog-doc h2, .catalog-doc h3, .catalog-doc h4 { color: var(--catalog-text); line-height: 1.24; letter-spacing: -.02em; }
        .catalog-doc h1 { margin: 34px 0 14px; font-size: 28px; }
        .catalog-doc h2 { margin: 32px 0 12px; font-size: 22px; }
        .catalog-doc h3 { margin: 26px 0 10px; font-size: 18px; }
        .catalog-doc p, .catalog-doc ul, .catalog-doc ol, .catalog-doc blockquote, .catalog-doc pre, .catalog-doc table { margin: 0 0 16px; }
        .catalog-doc ul, .catalog-doc ol { padding-left: 22px; }
        .catalog-doc li + li { margin-top: 6px; }
        .catalog-doc a { color: var(--catalog-accent); text-underline-offset: 3px; }
        .catalog-doc code { padding: 2px 5px; border-radius: 6px; background: var(--catalog-soft-strong); font: .9em/1.5 ui-monospace, SFMono-Regular, Menlo, monospace; }
        .catalog-doc pre { overflow-x: auto; padding: 17px; border: 1px solid var(--catalog-line); border-radius: 14px; background: var(--catalog-soft); }
        .catalog-doc pre code { padding: 0; background: transparent; }
        .catalog-doc blockquote { padding: 12px 16px; border-left: 3px solid var(--catalog-accent); background: var(--catalog-soft); color: var(--catalog-muted); }
        .catalog-doc table { width: 100%; border-collapse: collapse; font-size: 12px; }
        .catalog-doc th, .catalog-doc td { padding: 10px; border-bottom: 1px solid var(--catalog-line); text-align: left; vertical-align: top; }
        .catalog-doc img { max-width: 100%; height: auto; border-radius: 14px; }
        .catalog-dialog-actions { display: flex; flex-wrap: wrap; gap: 9px; margin-top: 24px; padding-top: 22px; border-top: 1px solid var(--catalog-line); }
        .catalog-dialog-note { margin: 14px 0 0; color: var(--catalog-muted); font-size: 12px; line-height: 1.6; }
        @media (max-width: 820px) {
          .catalog-shell { width: min(100% - 30px, 680px); }
          .catalog-nav-source { display: none; }
          .catalog-nav-links { gap: 8px; }
          .catalog-view-option { padding: 0 9px; }
          .catalog-brand-name { font-size: 14px; }
          .catalog-hero { grid-template-columns: 1fr; gap: 40px; padding: 48px 0; }
          .catalog-title { font-size: clamp(42px, 13vw, 62px); }
          .catalog-lead { font-size: 16px; }
          .catalog-manifest { grid-template-columns: 1fr 1fr; }
          .catalog-stat:first-child { grid-row: auto; }
          .catalog-notice-inner, .catalog-footer-inner { grid-template-columns: 1fr; }
          .catalog-source-meta { text-align: left; }
          .catalog-main { padding: 38px 0 64px; }
          .catalog-search-row, .catalog-grid, .catalog-training-grid { grid-template-columns: 1fr; }
          .catalog-training { padding: 38px 0 64px; }
          .catalog-training-card { min-height: 270px; }
          .catalog-training-more { align-items: flex-start; flex-direction: column; }
          .catalog-results-head { align-items: flex-start; flex-direction: column; gap: 6px; }
          .catalog-card { min-height: 270px; }
          .catalog-overlay { padding: 8px; align-items: end; }
          .catalog-dialog { height: calc(100dvh - 16px); border-radius: 20px; }
          .catalog-dialog-body { grid-template-columns: 1fr; gap: 34px; padding: 22px 18px 32px; }
          .catalog-dialog-summary { position: static; }
          .catalog-detail-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .catalog-detail-grid-training { grid-template-columns: 1fr; }
        }
        @media (prefers-reduced-motion: reduce) {
          .catalog-button, .catalog-card { transition: none; }
          .catalog-card:hover, .catalog-button:active { transform: none; }
        }
      `}</style>

      <div className="catalog-backdrop" aria-hidden="true" />

      <nav className="catalog-nav" aria-label="CAT Skill 分发站导航">
        <div className="catalog-shell catalog-nav-inner">
          <div className="catalog-brand">
            <button className="catalog-home" onClick={onHome}>← 大雷</button>
            <span className="catalog-brand-name">CAT Agent Skills 中文分发</span>
          </div>
          <div className="catalog-nav-links">
            <div className="catalog-view-switch" role="group" aria-label="页面模式">
              <button className={`catalog-view-option ${viewMode === 'training' ? 'catalog-view-option-active' : ''}`} onClick={() => changeViewMode('training')} aria-pressed={viewMode === 'training'}>培训版</button>
              <button className={`catalog-view-option ${viewMode === 'catalog' ? 'catalog-view-option-active' : ''}`} onClick={() => changeViewMode('catalog')} aria-pressed={viewMode === 'catalog'}>完整版</button>
            </div>
            <button className="catalog-theme" onClick={toggleTheme} aria-label={theme === 'light' ? '切换到深色模式' : '切换到浅色模式'}>
              {theme === 'light' ? '深色' : '浅色'}
            </button>
            <a className="catalog-link catalog-nav-source" href="/cat-skills-data/catalog.json" target="_blank" rel="noreferrer">数据清单</a>
            <a className="catalog-link catalog-nav-source" href={OFFICIAL_REPO} target="_blank" rel="noreferrer">官方源码 ↗</a>
          </div>
        </div>
      </nav>

      <header className="catalog-shell catalog-hero">
        <div>
          <p className="catalog-kicker">{viewMode === 'training' ? 'Agent Skill Training' : 'Agent Skill Distribution'}</p>
          <h1 className="catalog-title">{viewMode === 'training' ? '先看懂，再动手。' : '找到，检查，下载。'}</h1>
          <p className="catalog-lead">{viewMode === 'training' ? '从熟悉的工作案例开始，先理解用途，再阅读说明，最后按需下载。' : '微软 CAT 社区 Skill 的中文分发目录。数据和安装文件已同步到本站，可直接用于培训与实践。'}</p>
          <div className="catalog-actions">
            {viewMode === 'training' ? (
              <>
                <a className="catalog-button catalog-button-primary" href="#training-cases">开始看案例</a>
                <button className="catalog-button" onClick={() => changeViewMode('catalog')}>查看完整目录</button>
              </>
            ) : (
              <>
                <a className="catalog-button catalog-button-primary" href="#catalog">浏览全部 {CAT_CATALOG_META.total} 项</a>
                <button className="catalog-button" onClick={() => changeViewMode('training')}>返回培训版</button>
              </>
            )}
          </div>
        </div>
        {viewMode === 'training' ? (
          <div className="catalog-classroom" aria-label="课堂演示顺序">
            <h2>课堂上只讲三件事</h2>
            <ol className="catalog-classroom-list">
              <li><strong>选案例</strong><span>从学员熟悉的工作任务开始</span></li>
              <li><strong>看说明</strong><span>先理解它会做什么和需要什么</span></li>
              <li><strong>再下载</strong><span>确认合适后再安装和试用</span></li>
            </ol>
          </div>
        ) : (
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
        )}
      </header>

      <section className="catalog-notice">
        <div className="catalog-shell catalog-notice-inner">
          <p><strong>安装前先审查。</strong> Skill 会继承 Agent 的权限。请检查说明、脚本、连接器和外部依赖，再加入培训或生产环境。</p>
          {viewMode === 'catalog' && <div className="catalog-source-meta">
              SOURCE {CAT_CATALOG_META.sourceCommit.slice(0, 8)}<br />
              SYNC {formatDate(CAT_CATALOG_META.sourceCommitDate)} / MIT
            </div>}
        </div>
      </section>

      {viewMode === 'training' ? (
        <main className="catalog-shell catalog-training" id="training-cases">
          <div className="catalog-training-head">
            <h2>先从 4 个熟悉的工作开始</h2>
            <p>每个案例只回答三个问题：什么时候用、能得到什么、如何开始。点击案例后会先看到中文导读，不需要立即下载。</p>
          </div>
          <div className="catalog-training-grid">
            {trainingItems.map(({ example, item }) => (
              <article className="catalog-training-card" key={item.slug}>
                <h3>{example.title}</h3>
                <div className="catalog-training-official">官方名称：{visibleText(item.name)}</div>
                <p className="catalog-training-summary">{example.summary}</p>
                <div className="catalog-training-outcome"><strong>你会得到</strong>{example.outcome}</div>
                <button className="catalog-button" onClick={() => setSelected(item)}>打开案例</button>
              </article>
            ))}
          </div>
          <div className="catalog-training-more">
            <div>
              <h3>需要更多案例？</h3>
              <p>完整目录包含 {CAT_CATALOG_META.total} 个 Skill、Automation 和 Plugin。</p>
            </div>
            <button className="catalog-button catalog-button-primary" onClick={() => changeViewMode('catalog')}>打开完整目录</button>
          </div>
        </main>
      ) : (
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
                      <button className="catalog-card-button" onClick={() => setSelected(item)}>查看详情</button>
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
      )}

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
              <strong>Skill 详情与内容预览</strong>
              <button className="catalog-close" onClick={() => setSelected(null)} aria-label="关闭详情">关闭</button>
            </div>
            <div className="catalog-dialog-scroll">
              <div className="catalog-dialog-body">
                <aside className="catalog-dialog-summary">
                  <span className="catalog-mark">{initialsFor(visibleText(selected.name))}</span>
                  <h2 className="catalog-dialog-title" id="catalog-dialog-title">{selectedTrainingExample?.title || visibleText(selected.name)}</h2>
                  {selectedTrainingExample && <div className="catalog-dialog-official">官方名称：{visibleText(selected.name)}</div>}
                  <p className="catalog-dialog-description">{selectedTrainingExample?.summary || visibleText(selected.description)}</p>
                  <div className={`catalog-detail-grid ${selectedTrainingExample ? 'catalog-detail-grid-training' : ''}`}>
                    <div className="catalog-detail"><span className="catalog-detail-label">类型</span><span className="catalog-detail-value">{typeLabels[selected.type] || selected.type}</span></div>
                    <div className="catalog-detail"><span className="catalog-detail-label">适用平台</span><span className="catalog-detail-value">{visibleText(selected.platforms.join(' / '))}</span></div>
                    <div className="catalog-detail"><span className="catalog-detail-label">下载文件</span><span className="catalog-detail-value">{selected.downloadName}<br />{formatBytes(selected.downloadSize)}</span></div>
                    {!selectedTrainingExample && <>
                      <div className="catalog-detail"><span className="catalog-detail-label">作者</span><span className="catalog-detail-value"><a href={selected.authorUrl} target="_blank" rel="noreferrer">{visibleText(selected.author)}</a></span></div>
                      <div className="catalog-detail"><span className="catalog-detail-label">版本</span><span className="catalog-detail-value">{selected.version || '未标注'}</span></div>
                      <div className="catalog-detail"><span className="catalog-detail-label">条目 ID</span><span className="catalog-detail-value">{selected.slug}</span></div>
                      <div className="catalog-detail"><span className="catalog-detail-label">创建时间</span><span className="catalog-detail-value">{formatDate(selected.createdAt)}</span></div>
                      <div className="catalog-detail"><span className="catalog-detail-label">更新时间</span><span className="catalog-detail-value">{formatDate(selected.updatedAt)}</span></div>
                      <div className="catalog-detail"><span className="catalog-detail-label">官方历史下载记录</span><span className="catalog-detail-value">{selected.recordedDownloads.toLocaleString()}</span></div>
                      <div className="catalog-detail"><span className="catalog-detail-label">来源提交</span><span className="catalog-detail-value">{CAT_CATALOG_META.sourceCommit.slice(0, 12)}</span></div>
                    </>}
                  </div>
                  {!selectedTrainingExample && <div className="catalog-dialog-tags">
                      {selected.tags.map((itemTag) => <span className="catalog-dialog-tag" key={itemTag}>{visibleText(itemTag)}</span>)}
                    </div>}
                </aside>

                <div className="catalog-preview" aria-live="polite" aria-busy={preview.status === 'loading'}>
                  <div className="catalog-preview-head">
                    <h3>完整说明预览</h3>
                    <p>以下内容来自本站保存的官方 Markdown。无需下载即可先阅读和检查。</p>
                  </div>
                  {selectedTrainingExample && (
                    <section className="catalog-class-guide" aria-label="课堂导读">
                      <h4>课堂导读：{selectedTrainingExample.title}</h4>
                      <p>{selectedTrainingExample.summary}</p>
                      <div className="catalog-class-result"><strong>预期结果：</strong>{selectedTrainingExample.outcome}</div>
                      <div className="catalog-class-prompt">
                        <strong>可直接尝试的提示词</strong>
                        {selectedTrainingExample.prompt}
                        <button className="catalog-copy-prompt" onClick={() => copyTrainingPrompt(selectedTrainingExample.slug, selectedTrainingExample.prompt)}>
                          {copiedPrompt === selectedTrainingExample.slug ? '已复制' : '复制提示词'}
                        </button>
                      </div>
                    </section>
                  )}
                  <div className="catalog-official-guide">
                    <h4>官方完整说明</h4>
                    <p>内容保留原文，便于讲师检查功能、限制、脚本和依赖。</p>
                  </div>
                  {preview.status === 'loading' && (
                    <div className="catalog-preview-state" aria-label="正在加载说明">
                      <div className="catalog-preview-skeleton" aria-hidden="true"><span /><span /><span /></div>
                    </div>
                  )}
                  {preview.status === 'error' && (
                    <div className="catalog-preview-state">
                      <div><strong>说明暂时无法显示</strong>你仍然可以查看原始说明，或者稍后重试。</div>
                    </div>
                  )}
                  {preview.status === 'ready' && (
                    <article className="catalog-doc" dangerouslySetInnerHTML={{ __html: previewHtml }} />
                  )}
                  <div className="catalog-dialog-actions">
                    <a className="catalog-button catalog-button-primary" href={selected.downloadUrl} download={selected.downloadName}>下载 {selected.downloadName}</a>
                    <a className="catalog-button" href={selected.markdownUrl} target="_blank" rel="noreferrer">打开原始说明</a>
                    <a className="catalog-button" href={selected.officialUrl} target="_blank" rel="noreferrer">官方页面 ↗</a>
                    <a className="catalog-button" href={selected.sourceUrl} target="_blank" rel="noreferrer">固定版本源码 ↗</a>
                  </div>
                  <p className="catalog-dialog-note">文件来自页面标注的官方提交。下载前请审查说明中的脚本、权限、连接器和外部依赖。</p>
                </div>
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
};

export default CatAgentSkills;
