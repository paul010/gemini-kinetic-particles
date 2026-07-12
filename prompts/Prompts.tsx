import React, { useEffect, useMemo, useState } from 'react';
import { PROMPTS } from './data';

/* ---------------------------------------------------------------------------
 * /prompts — 大雷's prompt arsenal. A searchable library of Chinese "act as …"
 * role prompts, sourced from PlexPt/awesome-chatgpt-prompts-zh (CC0). Search,
 * quick-filter by topic, expand to read, one-click copy. UI is tri-lingual;
 * the prompts themselves stay Chinese (converted to 繁 when 繁體 is selected).
 * ------------------------------------------------------------------------- */

type Lang = 'en' | 'zh' | 'zhHant';
interface LocalizedText { en: string; zh: string }

const STORAGE_KEY = 'dalei-lang-v2';
const detectInitialLang = (): Lang => {
  if (typeof window === 'undefined') return 'en';
  const saved = window.localStorage.getItem(STORAGE_KEY);
  return saved === 'zh' || saved === 'zhHant' ? saved : 'en';
};
let _s2t: ((s: string) => string) | null = null;
const useS2T = (active: boolean) => {
  const [conv, setConv] = useState<((s: string) => string) | null>(() => _s2t);
  useEffect(() => {
    if (!active || _s2t) { if (_s2t && !conv) setConv(() => _s2t); return; }
    let alive = true;
    import('opencc-js').then((m) => { _s2t = (m as any).Converter({ from: 'cn', to: 'tw' }); if (alive) setConv(() => _s2t); }).catch(() => {});
    return () => { alive = false; };
  }, [active, conv]);
  return conv;
};

const CATS: { key: string; label: LocalizedText; kw: string[] }[] = [
  { key: 'translate', label: { en: 'Language', zh: '翻译语言' }, kw: ['翻译', '英语', '语言', '词典', '发音', '英文', '母语', '同义'] },
  { key: 'writing', label: { en: 'Writing', zh: '写作文案' }, kw: ['写作', '文案', '标题', '润色', '小说', '诗', '作文', '简历', '故事', '编辑', '文章', '剧本'] },
  { key: 'coding', label: { en: 'Coding', zh: '编程技术' }, kw: ['终端', '控制台', '代码', '编程', 'Linux', 'SQL', '正则', 'JavaScript', 'Python', '开发', '工程师', '命令', '浏览器'] },
  { key: 'career', label: { en: 'Career', zh: '职场职业' }, kw: ['面试', '招聘', '经理', '顾问', '分析师', '律师', '会计', '广告', '投资', '产品', '销售', '演讲', '商业'] },
  { key: 'learn', label: { en: 'Learning', zh: '学习教育' }, kw: ['老师', '导师', '讲师', '教练', '学习', '数学', '历史', '哲学', '辅导', '解释', '教授'] },
  { key: 'life', label: { en: 'Life', zh: '生活健康' }, kw: ['医生', '营养', '健身', '心理', '旅游', '厨师', '美食', '菜单', '健康', '私人'] },
  { key: 'fun', label: { en: 'Creative', zh: '创意娱乐' }, kw: ['扮演', '游戏', '电影', '音乐', 'rapper', '说唱', '艺术', '梦', '占卜', '魔术', '相声', '脱口秀'] },
];

interface Props { onHome: () => void }

const Prompts: React.FC<Props> = ({ onHome }) => {
  const [lang, setLang] = useState<Lang>(detectInitialLang);
  const s2t = useS2T(lang === 'zhHant');
  const t = (txt: LocalizedText) => (lang === 'en' ? txt.en : lang === 'zhHant' ? (s2t ? s2t(txt.zh) : txt.zh) : txt.zh);
  const zh = (s: string) => (lang === 'zhHant' && s2t ? s2t(s) : s); // prompt text stays Chinese
  useEffect(() => { if (typeof window !== 'undefined') window.localStorage.setItem(STORAGE_KEY, lang); }, [lang]);

  const [q, setQ] = useState('');
  const [cat, setCat] = useState('all');
  const [copied, setCopied] = useState<number | null>(null);

  const list = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const kws = cat === 'all' ? null : CATS.find((c) => c.key === cat)!.kw;
    return PROMPTS.filter((p) => {
      if (needle && !(`${p.act}\n${p.prompt}`.toLowerCase().includes(needle))) return false;
      if (kws && !kws.some((k) => p.act.includes(k) || p.prompt.includes(k))) return false;
      return true;
    });
  }, [q, cat]);

  const copy = (i: number, text: string) => {
    navigator.clipboard?.writeText(text).then(() => {
      setCopied(i); window.setTimeout(() => setCopied((c) => (c === i ? null : c)), 1500);
    }).catch(() => {});
  };

  const LANGS: { code: Lang; label: string }[] = [{ code: 'en', label: 'EN' }, { code: 'zh', label: '简' }, { code: 'zhHant', label: '繁' }];

  return (
    <div className="min-h-screen bg-paper font-sans text-ink">
      <header className="sticky top-0 z-40 border-b border-ink/10 bg-paper/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-5 py-4 sm:px-8">
          <button onClick={onHome} className="font-mono text-xs text-ink/55 transition-colors hover:text-ink">← Da Lei · 大雷</button>
          <div className="flex items-center gap-3">
            <span className="hidden font-mono text-[11px] uppercase tracking-[0.2em] text-gold sm:inline">Prompt Library</span>
            <div className="flex overflow-hidden rounded-full border border-ink/15">
              {LANGS.map((l) => (
                <button key={l.code} onClick={() => setLang(l.code)}
                  className={`px-2.5 py-1 font-mono text-[11px] transition-colors ${lang === l.code ? 'bg-ink text-paper' : 'text-ink/55 hover:text-ink'}`}>{l.label}</button>
              ))}
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-14">
        <p className="font-mono text-xs uppercase tracking-[0.22em] text-ink/45">{t({ en: 'Prompt library', zh: '提示词库' })}</p>
        <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight sm:text-5xl">
          {t({ en: 'The prompt arsenal', zh: '提示词弹药库' })}
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-ink/65">
          {t({
            en: `${PROMPTS.length} ready-to-use Chinese "act as …" role prompts — search, filter by topic, and copy. A base camp of ammo for any model. Sourced from PlexPt/awesome-chatgpt-prompts-zh (CC0).`,
            zh: `${PROMPTS.length} 条开箱即用的「我希望你充当…」角色提示词 —— 搜索、按主题筛选、一键复制。任何模型都能用的弹药根据地。来源:PlexPt/awesome-chatgpt-prompts-zh（CC0）。`,
          })}
        </p>

        {/* search + filters */}
        <div className="mt-7 flex flex-col gap-3">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t({ en: 'Search prompts…  e.g. 翻译 / 面试 / 终端', zh: '搜索提示词…  例如 翻译 / 面试 / 终端' })}
            className="w-full rounded-full border border-ink/15 bg-surface/50 px-5 py-2.5 text-sm text-ink outline-none transition-colors focus:border-gold/50"
          />
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setCat('all')}
              className={`rounded-full border px-3.5 py-1.5 font-mono text-xs transition-colors ${cat === 'all' ? 'border-ink bg-ink text-paper' : 'border-ink/15 text-ink/60 hover:border-ink/40'}`}>
              {t({ en: 'All', zh: '全部' })}
            </button>
            {CATS.map((c) => (
              <button key={c.key} onClick={() => setCat(c.key)}
                className={`rounded-full border px-3.5 py-1.5 font-mono text-xs transition-colors ${cat === c.key ? 'border-ink bg-ink text-paper' : 'border-ink/15 text-ink/60 hover:border-ink/40'}`}>
                {t(c.label)}
              </button>
            ))}
          </div>
          <div className="font-mono text-[11px] text-ink/40">{list.length} {t({ en: 'prompts', zh: '条' })}</div>
        </div>

        {/* grid */}
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((p) => {
            const idx = PROMPTS.indexOf(p);
            const promptText = zh(p.prompt);
            return (
              <article key={idx} className="flex flex-col rounded-2xl border border-ink/10 bg-surface/50 p-5 transition-colors hover:border-gold/40">
                <h3 className="font-display text-lg font-semibold leading-snug tracking-tight">{zh(p.act)}</h3>
                <details className="group/p mt-3 flex-1 rounded-xl border border-ink/10 bg-ink/[0.03] px-3.5 py-2.5">
                  <summary className="flex cursor-pointer list-none items-center justify-between font-mono text-[11px] uppercase tracking-wider text-ink/55 [&::-webkit-details-marker]:hidden">
                    <span>{t({ en: 'Prompt', zh: '提示词' })}</span>
                    <span className="transition-transform group-open/p:rotate-180">▾</span>
                  </summary>
                  <p className="mt-2.5 max-h-56 overflow-auto whitespace-pre-wrap text-[12.5px] leading-relaxed text-ink/70">{promptText}</p>
                </details>
                <button onClick={() => copy(idx, promptText)}
                  className="mt-3 inline-flex items-center justify-center gap-1.5 rounded-full border border-ink/15 bg-paper px-3.5 py-1.5 font-mono text-xs text-ink/75 transition-colors hover:border-gold/50 hover:text-gold">
                  {copied === idx ? t({ en: 'Copied ✓', zh: '已复制 ✓' }) : t({ en: 'Copy', zh: '复制' })}
                </button>
              </article>
            );
          })}
        </div>
        {list.length === 0 && (
          <div className="mt-12 text-center font-mono text-sm text-ink/40">{t({ en: 'No prompts match.', zh: '没有匹配的提示词。' })}</div>
        )}

        <p className="mt-10 border-t border-ink/10 pt-8 text-xs leading-relaxed text-ink/45">
          {t({
            en: 'Prompts from PlexPt/awesome-chatgpt-prompts-zh (CC0). Curated here as a quick base; see the repo for the full, updated list and English/繁體 variants.',
            zh: '提示词来自 PlexPt/awesome-chatgpt-prompts-zh（CC0）。这里作为一个顺手的弹药根据地;完整、持续更新的列表与英文/繁體版本请看原仓库。',
          })}
          {' '}
          <a className="text-gold hover:underline" href="https://github.com/PlexPt/awesome-chatgpt-prompts-zh" target="_blank" rel="noreferrer">repo ↗</a>
        </p>
      </main>
    </div>
  );
};

export default Prompts;
