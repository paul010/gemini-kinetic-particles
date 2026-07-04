import React, { useEffect, useMemo, useState } from 'react';
import { LAB_PROMPTS, SECTIONS, EXECUTED_COUNT, SOURCE_REPO, LocalizedText } from './data';

/* ---------------------------------------------------------------------------
 * /lab3d — the 3D prompt workbench. 63 Three.js scene prompts vendored from
 * petergpt/3d-prompt-collection: browse by section, expand to read, copy with
 * one click — and, over time, watch prompts turn into live pages. Executed
 * prompts carry a gold badge that launches the real generated scene, so the
 * workbench doubles as a results index for video recording. Bilingual UI;
 * prompts stay in their original English.
 * ------------------------------------------------------------------------- */

type Lang = 'en' | 'zh' | 'zhHant';

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

interface Props { onHome: () => void; onNavigate: (path: string) => void }

const Lab3D: React.FC<Props> = ({ onHome, onNavigate }) => {
  const [lang, setLang] = useState<Lang>(detectInitialLang);
  const s2t = useS2T(lang === 'zhHant');
  const t = (txt: LocalizedText) => (lang === 'en' ? txt.en : lang === 'zhHant' ? (s2t ? s2t(txt.zh) : txt.zh) : txt.zh);
  useEffect(() => { if (typeof window !== 'undefined') window.localStorage.setItem(STORAGE_KEY, lang); }, [lang]);

  const [q, setQ] = useState('');
  const [sec, setSec] = useState('all');
  const [copied, setCopied] = useState<number | null>(null);

  const list = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return LAB_PROMPTS.filter((p) => {
      if (sec === 'done' && !p.route) return false;
      if (sec !== 'all' && sec !== 'done' && p.section.key !== sec) return false;
      if (needle && !(`${p.n} ${p.title}`.toLowerCase().includes(needle))) return false;
      return true;
    });
  }, [q, sec]);

  const copy = (n: number, text: string) => {
    navigator.clipboard?.writeText(text).then(() => {
      setCopied(n); window.setTimeout(() => setCopied((c) => (c === n ? null : c)), 1500);
    }).catch(() => {});
  };

  const LANGS: { code: Lang; label: string }[] = [{ code: 'en', label: 'EN' }, { code: 'zh', label: '简' }, { code: 'zhHant', label: '繁' }];

  return (
    <div className="min-h-screen bg-paper font-sans text-ink">
      <header className="sticky top-0 z-40 border-b border-ink/10 bg-paper/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-5 py-4 sm:px-8">
          <button onClick={onHome} className="font-mono text-xs text-ink/55 transition-colors hover:text-ink">← Da Lei · 大雷</button>
          <div className="flex items-center gap-3">
            <span className="hidden font-mono text-[11px] uppercase tracking-[0.2em] text-gold sm:inline">3D Prompt Lab</span>
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
        <p className="font-mono text-xs uppercase tracking-[0.22em] text-ink/45">{t({ en: 'Workbench · prompt → live scene', zh: '工作台 · 提示词 → 真实场景' })}</p>
        <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight sm:text-5xl">
          {t({ en: 'The 3D prompt workbench', zh: '3D 提示词工作台' })}
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-ink/65">
          {t({
            en: `${LAB_PROMPTS.length} Three.js scene prompts from petergpt's collection — big living worlds, playable scenes, natural spectacles. Browse and copy any of them; the ones I've actually executed become live pages you can launch right here. ${EXECUTED_COUNT} down, ${LAB_PROMPTS.length - EXECUTED_COUNT} to go.`,
            zh: `${LAB_PROMPTS.length} 条来自 petergpt 合集的 Three.js 场景提示词 —— 宏大世界、可玩场景、自然奇观。随便浏览复制;被我真正执行过的会变成可以直接打开的真实页面。已生成 ${EXECUTED_COUNT} 个,还剩 ${LAB_PROMPTS.length - EXECUTED_COUNT} 个。`,
          })}
        </p>

        {/* attribution */}
        <div className="mt-6 rounded-2xl border border-gold/25 bg-gold/[0.05] px-5 py-4">
          <p className="text-sm leading-relaxed text-ink/70">
            {t({
              en: 'All prompt texts are by petergpt, vendored verbatim from the collection below with full credit — this page adds browsing, copying, and the executed-results index.',
              zh: '全部提示词原文出自 petergpt,从下方合集原样收录并注明出处 —— 本页只是加上浏览、复制和「已生成结果」索引。',
            })}
          </p>
          <a className="mt-2 inline-block font-mono text-[13px] text-gold hover:underline" href={SOURCE_REPO} target="_blank" rel="noreferrer">petergpt/3d-prompt-collection ↗</a>
        </div>

        {/* search + section filters */}
        <div className="mt-8 flex flex-col gap-3">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t({ en: 'Search by number or title… e.g. 26 / balloon / Rome', zh: '按编号或标题搜索… 例如 26 / balloon / Rome' })}
            className="w-full rounded-full border border-ink/15 bg-surface/50 px-5 py-2.5 text-sm text-ink outline-none transition-colors focus:border-gold/50"
          />
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setSec('all')}
              className={`rounded-full border px-3.5 py-1.5 font-mono text-xs transition-colors ${sec === 'all' ? 'border-ink bg-ink text-paper' : 'border-ink/15 text-ink/60 hover:border-ink/40'}`}>
              {t({ en: 'All', zh: '全部' })} {LAB_PROMPTS.length}
            </button>
            <button onClick={() => setSec('done')}
              className={`rounded-full border px-3.5 py-1.5 font-mono text-xs transition-colors ${sec === 'done' ? 'border-gold bg-gold/10 text-gold' : 'border-gold/40 text-gold/80 hover:border-gold'}`}>
              ★ {t({ en: 'Executed', zh: '已生成' })} {EXECUTED_COUNT}
            </button>
            {SECTIONS.map((s) => (
              <button key={s.key} onClick={() => setSec(s.key)}
                className={`rounded-full border px-3.5 py-1.5 font-mono text-xs transition-colors ${sec === s.key ? 'border-ink bg-ink text-paper' : 'border-ink/15 text-ink/60 hover:border-ink/40'}`}>
                {t(s.label)} {s.to - s.from + 1}
              </button>
            ))}
          </div>
        </div>

        {/* prompt cards */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {list.map((p) => (
            <article key={p.n} className={`flex flex-col rounded-2xl border p-5 transition-colors ${p.route ? 'border-gold/40 bg-gold/[0.05]' : 'border-ink/10 bg-surface/50 hover:border-ink/25'}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-mono text-[11px] tabular-nums text-ink/40">#{String(p.n).padStart(2, '0')} · {t(p.section.label)} · {(p.text.length / 1000).toFixed(1)}k</p>
                  <h3 className="mt-1 font-display text-lg font-semibold leading-snug tracking-tight">{p.title}</h3>
                </div>
                {p.route && (
                  <span className="shrink-0 rounded-full border border-gold/40 bg-gold/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-gold">★ {t({ en: 'live', zh: '已生成' })}</span>
                )}
              </div>

              <details className="group/p mt-3 flex-1 rounded-xl border border-ink/10 bg-ink/[0.03] px-3.5 py-2.5">
                <summary className="flex cursor-pointer list-none items-center justify-between font-mono text-[11px] uppercase tracking-wider text-ink/55 [&::-webkit-details-marker]:hidden">
                  <span>{t({ en: 'Prompt', zh: '提示词原文' })}</span>
                  <span className="transition-transform group-open/p:rotate-180">▾</span>
                </summary>
                <pre className="mt-2.5 max-h-64 overflow-auto whitespace-pre-wrap font-sans text-[12.5px] leading-relaxed text-ink/70">{p.text}</pre>
              </details>

              <div className="mt-3 flex flex-wrap gap-2">
                <button onClick={() => copy(p.n, p.text)}
                  className="inline-flex items-center justify-center gap-1.5 rounded-full border border-ink/15 bg-paper px-3.5 py-1.5 font-mono text-xs text-ink/75 transition-colors hover:border-gold/50 hover:text-gold">
                  {copied === p.n ? t({ en: 'Copied ✓', zh: '已复制 ✓' }) : t({ en: 'Copy prompt', zh: '复制提示词' })}
                </button>
                {p.route && (
                  <a
                    href={p.route}
                    onClick={(e) => { e.preventDefault(); onNavigate(p.route!); }}
                    className="inline-flex items-center gap-1.5 rounded-full bg-gold px-3.5 py-1.5 font-mono text-xs font-semibold text-paper transition-transform hover:scale-[1.03]"
                  >
                    ▶ {t(p.resultLabel!)}
                  </a>
                )}
              </div>
            </article>
          ))}
        </div>
        {list.length === 0 && (
          <div className="mt-12 text-center font-mono text-sm text-ink/40">{t({ en: 'No prompts match.', zh: '没有匹配的提示词。' })}</div>
        )}

        <p className="mt-10 border-t border-ink/10 pt-8 text-xs leading-relaxed text-ink/45">
          {t({
            en: 'Prompt texts © petergpt (3d-prompt-collection), reproduced with attribution for study and execution; the generated pages are my own implementations of those briefs. Want a specific prompt executed next? Say the number.',
            zh: '提示词原文版权归 petergpt(3d-prompt-collection),此处注明出处收录,供学习与执行;生成的页面是我对这些提示词的实现。想先执行哪一条?报编号即可。',
          })}
        </p>
      </main>
    </div>
  );
};

export default Lab3D;
