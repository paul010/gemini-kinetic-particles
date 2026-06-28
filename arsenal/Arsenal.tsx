import React, { useEffect, useMemo, useState } from 'react';
import projectsData from './data/projects.json';
import skillsData from './data/skills.json';
import recipesData from './data/recipes.json';
import sourcesData from './data/sources.json';
import contentData from './data/content_outputs.json';
import type { Project, Skill, Recipe, Source, ContentOutput } from './types';
import { recommendSkills, recommendRecipes, projectsForSkill } from './lib/recommend';
import { buildPrompt } from './lib/prompt';
import { getCheckup, verdictLabel } from './lib/checkup';

const PROJECTS = projectsData as unknown as Project[];
const SKILLS = skillsData as unknown as Skill[];
const RECIPES = recipesData as unknown as Recipe[];
const SOURCES = sourcesData as unknown as Source[];
const CONTENT = contentData as unknown as ContentOutput[];

interface ArsenalProps {
  onHome: () => void;
  onNavigate: (path: string) => void;
}

/* ---------- helpers ---------- */

const STATUS_LABEL: Record<Project['status'], string> = {
  unverified: '未验证',
  readme_checked: '已读 README',
  reproduced: '已跑通',
  deployed: '已部署',
  video_ready: '可录视频',
  tutorial_ready: '可写教程',
};

const CATEGORIES: { key: string; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'play', label: '好玩' },
  { key: 'use', label: '好用' },
  { key: 'content', label: '内容素材' },
  { key: 'engineering', label: '工程工具' },
  { key: 'agent', label: 'Agent' },
];

type SortKey = 'recommended' | 'difficulty' | 'value';

const SORTS: { key: SortKey; label: string }[] = [
  { key: 'recommended', label: '推荐（已上线优先）' },
  { key: 'difficulty', label: '难度低→高' },
  { key: 'value', label: '内容价值高→低' },
];

const SKILL_CAT_LABEL: Record<string, string> = {
  core: '基础增强',
  'code-repo': '代码与仓库',
  frontend: '前端 UI',
  'browser-qa': '浏览器验收',
  deploy: '部署上线',
  docs: '文档处理',
  content: '内容创作',
  scraping: '数据抓取',
  automation: '自动化调度',
  data: '数据与存储',
  ai: '模型与编排',
};

const skillById = new Map(SKILLS.map((s) => [s.id, s]));
const contentByProject = new Map(CONTENT.map((c) => [c.projectId, c]));

const Dots: React.FC<{ n: number; max?: number }> = ({ n, max = 5 }) => (
  <span className="inline-flex items-center gap-0.5" aria-label={`难度 ${n}/${max}`}>
    {Array.from({ length: max }).map((_, i) => (
      <span key={i} className={`h-1.5 w-1.5 rounded-full ${i < n ? 'bg-gold' : 'bg-ink/15'}`} />
    ))}
  </span>
);

const CopyButton: React.FC<{ text: string; label?: string; className?: string }> = ({
  text,
  label = '复制 Prompt',
  className = '',
}) => {
  const [done, setDone] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setDone(true);
      setTimeout(() => setDone(false), 1800);
    } catch {
      /* clipboard unavailable */
    }
  };
  return (
    <button
      onClick={copy}
      className={`inline-flex items-center gap-1.5 rounded-full border border-ink/15 bg-ink/[0.03] px-3 py-1.5 font-mono text-xs text-ink/80 transition-colors hover:border-gold/50 hover:text-ink ${className}`}
    >
      {done ? '✓ 已复制' : label}
    </button>
  );
};

const verdictTone = (v: Project['verdict']) =>
  v === 'worth'
    ? 'text-gold border-gold/40 bg-gold/10'
    : v === 'cautious'
    ? 'text-ember border-ember/40 bg-ember/10'
    : 'text-ink/50 border-ink/20 bg-ink/5';

/* ---------- Project card ---------- */

const ProjectCard: React.FC<{ project: Project; onOpen: () => void; onNavigate: (path: string) => void; onTag: (tag: string) => void }> = ({ project: p, onOpen, onNavigate, onTag }) => {
  const skills = recommendSkills(p, SKILLS).slice(0, 3);
  const prompt = buildPrompt(p, recommendSkills(p, SKILLS), recommendRecipes(p, RECIPES));
  return (
    <article className={`flex flex-col rounded-2xl border bg-surface/50 p-5 transition-all hover:-translate-y-0.5 ${p.liveUrl ? 'border-gold/40 hover:border-gold/60' : 'border-ink/10 hover:border-gold/40'}`}>
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-mono text-[11px] ${verdictTone(p.verdict)}`}>
          {verdictLabel(p.verdict)}
        </span>
        {p.liveUrl ? (
          <span className="rounded-full border border-gold/40 bg-gold/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-gold">大雷版已上线</span>
        ) : (
          <span className="rounded-full border border-ink/15 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-ink/45">
            {STATUS_LABEL[p.status]}
          </span>
        )}
      </div>

      <h3 className="font-display text-xl font-semibold tracking-tight">{p.title}</h3>
      <p className="mt-1.5 flex-1 text-sm leading-relaxed text-ink/65">{p.summary}</p>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-ink/50">
        <span className="inline-flex items-center gap-1.5">难度 <Dots n={p.difficulty} /></span>
        <span>⏱ {p.estimatedTime}</span>
        <span>内容价值 <span className="text-gold">{'★'.repeat(p.contentValueScore)}</span></span>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {skills.map((s) => (
          <span key={s.id} className="rounded-md border border-ink/10 bg-ink/[0.03] px-2 py-0.5 font-mono text-[10px] text-ink/55">
            {s.name}
          </span>
        ))}
      </div>

      {p.tags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-x-2 gap-y-1">
          {p.tags.slice(0, 4).map((t) => (
            <button
              key={t}
              onClick={() => onTag(t)}
              className="font-mono text-[10px] text-ink/40 underline-offset-2 transition-colors hover:text-gold hover:underline"
              aria-label={`按标签 ${t} 筛选`}
            >
              #{t}
            </button>
          ))}
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {p.liveUrl ? (
          <button
            onClick={() => onNavigate(p.liveUrl!)}
            className="inline-flex items-center gap-1.5 rounded-full bg-gold px-3.5 py-1.5 text-xs font-semibold text-paper transition-transform hover:scale-[1.03]"
          >
            ▶ 大雷版
          </button>
        ) : null}
        <button
          onClick={onOpen}
          className="inline-flex items-center gap-1.5 rounded-full bg-accent px-3.5 py-1.5 text-xs font-semibold text-paper transition-transform hover:scale-[1.03]"
        >
          项目体检
        </button>
        <CopyButton text={prompt} />
        <a
          href={p.sourceUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 font-mono text-xs text-ink/55 underline-offset-2 hover:text-ink hover:underline"
        >
          看来源 ↗
        </a>
      </div>
    </article>
  );
};

/* ---------- Detail / checkup modal ---------- */

const DetailModal: React.FC<{ project: Project; onClose: () => void; onNavigate: (path: string) => void }> = ({
  project: p,
  onClose,
  onNavigate,
}) => {
  const checkup = getCheckup(p);
  const skills = recommendSkills(p, SKILLS);
  const recipes = recommendRecipes(p, RECIPES);
  const prompt = buildPrompt(p, skills, recipes);
  const content = contentByProject.get(p.id);
  const source = SOURCES.find((s) => p.sourceIds.includes(s.id));

  // Close on Escape and lock background scroll while the modal is open.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[120] grid place-items-end overflow-y-auto bg-ink/40 backdrop-blur-sm sm:place-items-center"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl rounded-t-3xl border border-ink/10 bg-paper p-6 shadow-2xl sm:rounded-3xl sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-full border border-ink/15 text-ink/60 hover:text-ink"
          aria-label="关闭"
        >
          ×
        </button>

        <div className="flex flex-wrap items-center gap-2">
          <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 font-mono text-[11px] ${verdictTone(p.verdict)}`}>
            {checkup.verdictLabel}
          </span>
          <span className="font-mono text-[11px] uppercase tracking-wider text-ink/45">{STATUS_LABEL[p.status]}</span>
        </div>
        <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight">{p.title}</h2>
        {p.liveUrl && (
          <button
            onClick={() => { onNavigate(p.liveUrl!); onClose(); }}
            className="mt-3 inline-flex items-center gap-2 rounded-full bg-gold px-4 py-2 text-sm font-semibold text-paper transition-transform hover:scale-[1.03]"
          >
            ▶ 体验大雷复现的版本
          </button>
        )}
        <p className="mt-3 text-sm leading-relaxed text-ink/65">{p.whyItMatters}</p>
        <p className="mt-2 text-sm leading-relaxed text-ink/70">
          <span className="text-gold">体检结论：</span>
          {checkup.reason}
        </p>

        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="难度"><Dots n={checkup.difficulty} /></Stat>
          <Stat label="预计耗时">{checkup.estimatedTime}</Stat>
          <Stat label="内容价值"><span className="text-gold">{'★'.repeat(p.contentValueScore)}</span></Stat>
          <Stat label="分类">{p.category.join(' / ')}</Stat>
        </div>

        <Section title="最小可用版本 (MVP)">
          <p className="text-sm text-ink/70">{checkup.mvp}</p>
        </Section>
        <Section title="先准备什么">
          <ul className="list-inside list-disc text-sm text-ink/70">
            {checkup.prepItems.map((x) => <li key={x}>{x}</li>)}
          </ul>
        </Section>
        <Section title="可能卡在哪里">
          <ul className="list-inside list-disc text-sm text-ink/70">
            {checkup.risks.map((x) => <li key={x}>{x}</li>)}
          </ul>
        </Section>
        <Section title="第一步">
          <p className="text-sm text-ink/70">{checkup.nextStep}</p>
        </Section>

        <Section title="推荐 Skill 组合">
          <div className="flex flex-wrap gap-2">
            {skills.map((s) => (
              <a
                key={s.id}
                href={s.officialUrl}
                target="_blank"
                rel="noreferrer"
                className="rounded-md border border-ink/10 bg-ink/[0.03] px-2.5 py-1 font-mono text-[11px] text-ink/65 hover:border-gold/40 hover:text-ink"
              >
                {s.name} ↗
              </a>
            ))}
          </div>
          {recipes.length > 0 && (
            <p className="mt-2 text-xs text-ink/50">推荐组合：{recipes.map((r) => r.name).join('、')}</p>
          )}
        </Section>

        <Section title="开工 Prompt">
          <pre className="max-h-48 overflow-y-auto whitespace-pre-wrap rounded-xl border border-ink/10 bg-ink/[0.03] p-3 font-mono text-[11px] leading-relaxed text-ink/70">
            {prompt}
          </pre>
          <div className="mt-2">
            <CopyButton text={prompt} label="复制开工 Prompt" />
          </div>
        </Section>

        {content && (
          <Section title="内容转化建议">
            <div className="grid gap-2 text-sm">
              <ContentRow k="短视频标题" v={content.shortVideoTitle} />
              <ContentRow k="X 长帖角度" v={content.xThreadAngle} />
              <ContentRow k="LinkedIn" v={content.linkedinAngle} />
              <ContentRow k="知识星球" v={content.zsxqPostTitle} />
              <ContentRow k="公众号角度" v={content.wechatAngle} />
              <ContentRow k="Demo 镜头" v={content.demoShots.join(' · ')} />
            </div>
          </Section>
        )}

        {source && (
          <p className="mt-5 font-mono text-[11px] text-ink/40">
            来源：
            <a href={source.url} target="_blank" rel="noreferrer" className="underline-offset-2 hover:text-ink hover:underline">
              {source.title} · {source.author}
            </a>{' '}
            · 可信度 {source.credibility}
          </p>
        )}
      </div>
    </div>
  );
};

const Stat: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="rounded-xl border border-ink/10 bg-ink/[0.02] p-3">
    <div className="font-mono text-[10px] uppercase tracking-wider text-ink/45">{label}</div>
    <div className="mt-1 text-sm font-medium text-ink/80">{children}</div>
  </div>
);

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="mt-5">
    <h3 className="font-mono text-xs uppercase tracking-[0.18em] text-gold">{title}</h3>
    <div className="mt-2">{children}</div>
  </div>
);

const ContentRow: React.FC<{ k: string; v: string }> = ({ k, v }) => (
  <div className="flex gap-3 rounded-lg border border-ink/8 bg-ink/[0.02] px-3 py-2">
    <span className="shrink-0 font-mono text-[11px] text-ink/45">{k}</span>
    <span className="text-ink/75">{v}</span>
  </div>
);

/* ---------- Skill card ---------- */

const SkillCard: React.FC<{ skill: Skill }> = ({ skill: s }) => {
  const pairs = projectsForSkill(s.id, PROJECTS, SKILLS).slice(0, 2);
  return (
    <article className="flex flex-col rounded-2xl border border-ink/10 bg-surface/50 p-5">
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-display text-lg font-semibold">{s.name}</h3>
        {s.beginnerFriendly && (
          <span className="rounded-full border border-gold/40 bg-gold/10 px-2 py-0.5 font-mono text-[10px] text-gold">新手友好</span>
        )}
      </div>
      <p className="mt-1.5 text-sm text-ink/65">{s.summary}</p>
      <p className="mt-2 text-xs leading-relaxed text-ink/55">{s.whatItDoes}</p>
      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[11px] text-ink/45">
        <span>安装：{s.setupLevel}</span>
        {s.risk && <span className="text-ember/80">注意：{s.risk}</span>}
      </div>
      {pairs.length > 0 && (
        <p className="mt-3 text-xs text-ink/50">适合搭配：{pairs.map((p) => p.title).join('、')}</p>
      )}
      <a
        href={s.officialUrl}
        target="_blank"
        rel="noreferrer"
        className="mt-3 inline-flex w-fit items-center gap-1 font-mono text-xs text-ink/55 underline-offset-2 hover:text-ink hover:underline"
      >
        官方链接 ↗
      </a>
    </article>
  );
};

/* ---------- Recipe card ---------- */

const RecipeCard: React.FC<{ recipe: Recipe }> = ({ recipe: r }) => (
  <article className="flex flex-col rounded-2xl border border-ink/10 bg-surface/50 p-5">
    <div className="flex items-center justify-between gap-2">
      <h3 className="font-display text-lg font-semibold">{r.name}</h3>
      <span className="font-mono text-[10px] uppercase tracking-wider text-ink/45">{r.difficulty}</span>
    </div>
    <p className="mt-1.5 text-sm text-ink/65">{r.goal}</p>
    <div className="mt-3 flex flex-wrap gap-1.5">
      {r.skillIds.map((id) => (
        <span key={id} className="rounded-md border border-ink/10 bg-ink/[0.03] px-2 py-0.5 font-mono text-[10px] text-ink/55">
          {skillById.get(id)?.name ?? id}
        </span>
      ))}
    </div>
    <ol className="mt-3 list-inside list-decimal space-y-0.5 text-xs text-ink/60">
      {r.steps.map((s) => <li key={s}>{s}</li>)}
    </ol>
    <div className="mt-3 rounded-lg border border-ink/8 bg-ink/[0.02] p-2.5">
      <div className="font-mono text-[10px] uppercase tracking-wider text-gold">验收标准</div>
      <ul className="mt-1 list-inside list-disc text-xs text-ink/60">
        {r.acceptanceCriteria.map((c) => <li key={c}>{c}</li>)}
      </ul>
    </div>
    <div className="mt-3">
      <CopyButton text={r.promptTemplate} label="复制 Recipe Prompt" />
    </div>
  </article>
);

/* ---------- Main ---------- */

type Tab = 'radar' | 'skills' | 'recipes';

const CAT_KEYS = new Set(CATEGORIES.map((c) => c.key));
const STATUS_KEYS = new Set<string>(['all', ...Object.keys(STATUS_LABEL)]);
const SORT_KEYS = new Set<string>(SORTS.map((s) => s.key));

/** Read filter state from the URL query string so filters survive refresh / sharing. */
function readFiltersFromUrl() {
  const sp = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams();
  const cat = sp.get('cat') ?? 'all';
  const status = sp.get('status') ?? 'all';
  const sort = sp.get('sort') ?? 'recommended';
  const diff = Number(sp.get('diff'));
  return {
    q: sp.get('q') ?? '',
    cat: CAT_KEYS.has(cat) ? cat : 'all',
    status: STATUS_KEYS.has(status) ? status : 'all',
    sort: (SORT_KEYS.has(sort) ? sort : 'recommended') as SortKey,
    maxDiff: diff >= 1 && diff <= 5 ? diff : 5,
  };
}

const Arsenal: React.FC<ArsenalProps> = ({ onHome, onNavigate }) => {
  const initial = useMemo(readFiltersFromUrl, []);
  const [tab, setTab] = useState<Tab>('radar');
  const [q, setQ] = useState(initial.q);
  const [cat, setCat] = useState(initial.cat);
  const [status, setStatus] = useState(initial.status);
  const [maxDiff, setMaxDiff] = useState(initial.maxDiff);
  const [sort, setSort] = useState<SortKey>(initial.sort);
  const [openId, setOpenId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    const list = PROJECTS.filter((p) => {
      if (cat !== 'all' && !p.category.includes(cat)) return false;
      if (status !== 'all' && p.status !== status) return false;
      if (p.difficulty > maxDiff) return false;
      if (query) {
        const hay = `${p.title} ${p.summary} ${p.tags.join(' ')}`.toLowerCase();
        if (!hay.includes(query)) return false;
      }
      return true;
    });
    // "推荐"：已上线优先 → 内容价值高 → 难度低；其它排序在并列时回退到推荐序。
    const byRecommended = (a: Project, b: Project) =>
      Number(Boolean(b.liveUrl)) - Number(Boolean(a.liveUrl)) ||
      b.contentValueScore - a.contentValueScore ||
      a.difficulty - b.difficulty;
    const cmp: Record<SortKey, (a: Project, b: Project) => number> = {
      recommended: byRecommended,
      difficulty: (a, b) => a.difficulty - b.difficulty || byRecommended(a, b),
      value: (a, b) => b.contentValueScore - a.contentValueScore || byRecommended(a, b),
    };
    return [...list].sort(cmp[sort]);
  }, [q, cat, status, maxDiff, sort]);

  const hasFilters = q.trim() !== '' || cat !== 'all' || status !== 'all' || maxDiff !== 5;
  const resetFilters = () => {
    setQ('');
    setCat('all');
    setStatus('all');
    setMaxDiff(5);
  };

  // Mirror filters into the URL (non-default values only) so refresh/sharing keeps state.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const sp = new URLSearchParams();
    if (q.trim()) sp.set('q', q.trim());
    if (cat !== 'all') sp.set('cat', cat);
    if (status !== 'all') sp.set('status', status);
    if (maxDiff !== 5) sp.set('diff', String(maxDiff));
    if (sort !== 'recommended') sp.set('sort', sort);
    const qs = sp.toString();
    window.history.replaceState(null, '', window.location.pathname + (qs ? `?${qs}` : '') + window.location.hash);
  }, [q, cat, status, maxDiff, sort]);

  // Per-category counts under the *other* active filters, so each chip shows what you'd get.
  const catCounts = useMemo(() => {
    const query = q.trim().toLowerCase();
    const base = PROJECTS.filter((p) => {
      if (status !== 'all' && p.status !== status) return false;
      if (p.difficulty > maxDiff) return false;
      if (query) {
        const hay = `${p.title} ${p.summary} ${p.tags.join(' ')}`.toLowerCase();
        if (!hay.includes(query)) return false;
      }
      return true;
    });
    const counts: Record<string, number> = { all: base.length };
    CATEGORIES.forEach((c) => {
      if (c.key !== 'all') counts[c.key] = base.filter((p) => p.category.includes(c.key)).length;
    });
    return counts;
  }, [q, status, maxDiff]);

  const handleTag = (tag: string) => {
    setQ(tag);
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openProject = openId ? PROJECTS.find((p) => p.id === openId) ?? null : null;

  const skillsByCat = useMemo(() => {
    const groups: Record<string, Skill[]> = {};
    SKILLS.forEach((s) => {
      (groups[s.category] ||= []).push(s);
    });
    return groups;
  }, []);

  return (
    <div className="min-h-screen bg-paper font-sans text-ink">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-ink/10 bg-paper/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-5 py-4 sm:px-8">
          <div className="flex items-center justify-between gap-3">
            <button onClick={onHome} className="group inline-flex items-center gap-2 font-mono text-xs text-ink/55 hover:text-ink">
              <span aria-hidden>←</span> Da Lei · 大雷
            </button>
            <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-gold">AI Coding Arsenal</span>
          </div>
          <div>
            <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">大雷 AI 编程装备库</h1>
            <p className="mt-1 text-sm text-ink/60">从项目灵感到可运行 Demo 的开工库 —— 看到项目、判断能不能做、配好 Skill、复制开工 Prompt。</p>
          </div>
          {/* Tabs */}
          <nav className="flex gap-1">
            {([['radar', '项目雷达'], ['skills', '装备库'], ['recipes', '推荐组合']] as [Tab, string][]).map(([k, label]) => (
              <button
                key={k}
                onClick={() => setTab(k)}
                aria-pressed={tab === k}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                  tab === k ? 'bg-accent text-paper' : 'border border-ink/15 text-ink/65 hover:text-ink'
                }`}
              >
                {label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-8 sm:px-8">
        {tab === 'radar' && (
          <>
            {/* Controls */}
            <div className="mb-6 flex flex-col gap-3">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="搜索项目、标签…"
                className="w-full rounded-full border border-ink/15 bg-ink/[0.02] px-4 py-2.5 text-sm outline-none focus:border-gold/50"
              />
              <div className="flex flex-wrap items-center gap-2">
                {CATEGORIES.map((c) => (
                  <button
                    key={c.key}
                    onClick={() => setCat(c.key)}
                    aria-pressed={cat === c.key}
                    className={`rounded-full px-3 py-1 text-xs transition-colors ${
                      cat === c.key ? 'bg-accent text-paper' : 'border border-ink/15 text-ink/60 hover:text-ink'
                    }`}
                  >
                    {c.label}
                    <span className="ml-1.5 opacity-60">{catCounts[c.key] ?? 0}</span>
                  </button>
                ))}
                <div className="ml-auto inline-flex flex-wrap items-center gap-x-4 gap-y-2">
                  <label className="inline-flex items-center gap-1.5 font-mono text-xs text-ink/50">
                    排序
                    <select
                      value={sort}
                      onChange={(e) => setSort(e.target.value as SortKey)}
                      className="rounded-full border border-ink/15 bg-ink/[0.02] px-2.5 py-1 text-xs text-ink/70 outline-none focus:border-gold/50"
                    >
                      {SORTS.map((s) => (
                        <option key={s.key} value={s.key}>{s.label}</option>
                      ))}
                    </select>
                  </label>
                  <span className="inline-flex items-center gap-2 font-mono text-xs text-ink/50">
                    难度 ≤ {maxDiff}
                    <input type="range" min={1} max={5} value={maxDiff} onChange={(e) => setMaxDiff(Number(e.target.value))} className="accent-[#8a682c]" />
                  </span>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-[11px] uppercase tracking-wider text-ink/40">复现状态</span>
                {([['all', '全部'], ...(Object.entries(STATUS_LABEL) as [Project['status'], string][])] as [string, string][]).map(
                  ([key, label]) => (
                    <button
                      key={key}
                      onClick={() => setStatus(key)}
                      aria-pressed={status === key}
                      className={`rounded-full px-3 py-1 font-mono text-[11px] transition-colors ${
                        status === key ? 'border border-gold/50 bg-gold/10 text-gold' : 'border border-ink/15 text-ink/55 hover:text-ink'
                      }`}
                    >
                      {label}
                    </button>
                  )
                )}
              </div>
            </div>

            <div className="mb-4 flex items-center gap-3">
              <p className="font-mono text-xs text-ink/45">{filtered.length} 个项目</p>
              {hasFilters && (
                <button
                  onClick={resetFilters}
                  className="font-mono text-xs text-ink/45 underline-offset-2 hover:text-ink hover:underline"
                >
                  清除筛选 ×
                </button>
              )}
            </div>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((p) => (
                <ProjectCard key={p.id} project={p} onOpen={() => setOpenId(p.id)} onNavigate={onNavigate} onTag={handleTag} />
              ))}
            </div>
            {filtered.length === 0 && (
              <div className="py-16 text-center">
                <p className="text-sm text-ink/45">没有匹配的项目，试试放宽筛选。</p>
                {hasFilters && (
                  <button
                    onClick={resetFilters}
                    className="mt-3 rounded-full border border-ink/15 px-4 py-1.5 text-xs text-ink/65 transition-colors hover:border-gold/50 hover:text-ink"
                  >
                    清除全部筛选
                  </button>
                )}
              </div>
            )}
          </>
        )}

        {tab === 'skills' && (
          <div className="space-y-10">
            {Object.entries(skillsByCat).map(([category, list]) => (
              <section key={category}>
                <h2 className="mb-4 font-display text-2xl font-semibold tracking-tight">
                  {SKILL_CAT_LABEL[category] ?? category}
                  <span className="ml-2 font-mono text-xs text-ink/40">{list.length}</span>
                </h2>
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {list.map((s) => <SkillCard key={s.id} skill={s} />)}
                </div>
              </section>
            ))}
          </div>
        )}

        {tab === 'recipes' && (
          <div className="grid gap-5 sm:grid-cols-2">
            {RECIPES.map((r) => <RecipeCard key={r.id} recipe={r} />)}
          </div>
        )}
      </main>

      <footer className="border-t border-ink/10">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-6 font-mono text-[11px] text-ink/40 sm:px-8">
          <span>大雷 AI 编程装备库 · 缩短从灵感到开工的路径</span>
          <span>未验证项目均已标注 · 不承诺零基础暴富</span>
        </div>
      </footer>

      {openProject && <DetailModal project={openProject} onClose={() => setOpenId(null)} onNavigate={onNavigate} />}
    </div>
  );
};

export default Arsenal;
