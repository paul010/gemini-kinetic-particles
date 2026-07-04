import React, { useEffect, useMemo, useState } from 'react';
import { CICI_DATASETS, CICI_METHOD, HALO_META, LocalizedText } from './data';
import type { City, Dataset } from './data';

/* ---------------------------------------------------------------------------
 * /cici — the Comparatively-Insignificant City Index. A for-fun ranking of
 * cities that are FAR LESS famous than their population would suggest.
 * Produced by running the `cici-index` skill; method popularized by
 * @pretentiouswhat on X. Layout (v2, baoyu-design pass): podium for the top 3
 * (visual weight follows information value), sticky country/legend bar
 * (controls never scroll away from the data), one shared DetailPanel for
 * podium cards and list rows alike. Bilingual (繁 on the fly), paper/ink/gold.
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

type T = (txt: LocalizedText) => string;

/* ---------- stacked score bar: population extent → fame subtracted → CICI ---------- */

const ScoreBar: React.FC<{ c: City; className?: string }> = ({ c, className }) => (
  <div className={`relative h-2.5 rounded-full bg-ink/[0.06] ${className ?? ''}`} aria-hidden="true">
    <div className="absolute inset-y-0 left-0 rounded-full border border-dashed border-ink/20" style={{ width: `${c.popScore}%` }} />
    <div className="absolute inset-y-0 left-0 rounded-full bg-ink/20" style={{ width: `${c.popScore}%` }} />
    <div className="absolute inset-y-0 left-0 rounded-full bg-gold" style={{ width: `${c.cici}%` }} />
  </div>
);

/* ---------- shared expanded detail — same panel for podium and rows ---------- */

const DetailPanel: React.FC<{ c: City; ds: Dataset; t: T }> = ({ c, ds, t }) => (
  <div className="border-t border-ink/10 bg-paper/50 px-4 py-4 sm:px-6">
    <p className="text-sm leading-relaxed text-ink/70">
      <span className="font-mono text-[11px] uppercase tracking-wider text-gold">{t({ en: 'Known for', zh: '它出名的是' })} · </span>
      {t(c.knownFor)}
    </p>
    <dl className="mt-3.5 grid gap-x-6 gap-y-2.5 sm:grid-cols-2">
      {c.halo.map((h, hi) => (
        <div key={`${h.factor}-${hi}`} className="flex gap-2.5 text-[13px]">
          <span className="shrink-0" aria-hidden="true">{HALO_META[h.factor].icon}</span>
          <div>
            <span className="font-medium text-ink/75">{t(HALO_META[h.factor].label)}</span>
            <span className="ml-1.5 font-mono text-[11px] text-ink/40">−{h.weight}</span>
            <p className="mt-0.5 leading-relaxed text-ink/55">{t(h.note)}</p>
          </div>
        </div>
      ))}
    </dl>
    <div className="mt-3.5 flex flex-wrap gap-x-5 gap-y-1 border-t border-ink/10 pt-3 font-mono text-[11px] tabular-nums text-ink/45">
      <span>
        {t(ds.regLabel)} {(c.huji / 100).toFixed(2)}M
        {ds.showResident && <> · {t(ds.residentLabel)} {(c.changzhu / 100).toFixed(2)}M</>}
      </span>
      <span>{t({ en: 'pop-score', zh: '人口分' })} {c.popScore} − {t({ en: 'fame', zh: '名气' })} {c.famePenalty} = <span className="font-semibold text-gold">{c.cici}</span></span>
    </div>
  </div>
);

/* ---------- podium card (top 3) ---------- */

const PODIUM_LABEL: LocalizedText[] = [
  { en: 'CICI leader', zh: 'CICI 领导者' },
  { en: 'Runner-up', zh: '第二名' },
  { en: 'Third', zh: '第三名' },
];

const PodiumCard: React.FC<{
  c: City; ds: Dataset; t: T; open: boolean; onToggle: () => void;
}> = ({ c, ds, t, open, onToggle }) => {
  const first = c.rank === 1;
  return (
    <button
      onClick={onToggle}
      aria-expanded={open}
      className={`flex w-full flex-col rounded-2xl border text-left transition-all hover:-translate-y-0.5 ${
        first
          ? 'border-gold/50 bg-gold/[0.07] sm:order-2 sm:-mt-4 sm:pb-2'
          : c.rank === 2
            ? 'border-ink/15 bg-surface/50 sm:order-1'
            : 'border-ink/15 bg-surface/50 sm:order-3'
      } ${open ? 'ring-1 ring-gold/40' : ''}`}
    >
      <div className={`flex flex-1 flex-col p-5 ${first ? 'sm:p-6' : ''}`}>
        <div className="flex items-baseline justify-between gap-2">
          <span className={`font-display font-bold leading-none tabular-nums ${first ? 'text-4xl text-gold' : 'text-3xl text-ink/30'}`}>{c.rank}</span>
          <span className={`font-mono text-[10px] uppercase tracking-[0.18em] ${first ? 'text-gold' : 'text-ink/40'}`}>{t(PODIUM_LABEL[c.rank - 1])}</span>
        </div>
        <h3 className={`mt-3 font-display font-semibold tracking-tight ${first ? 'text-2xl sm:text-3xl' : 'text-xl sm:text-2xl'}`}>{t(c.name)}</h3>
        <p className="mt-1 font-mono text-[11px] tabular-nums text-ink/45">
          {t(c.region)} · {t(ds.regTag)} {(c.huji / 100).toFixed(1)}M
        </p>
        <div className="mt-4 flex items-center gap-3">
          <ScoreBar c={c} className="flex-1" />
          <span className={`shrink-0 font-mono font-semibold tabular-nums text-gold ${first ? 'text-xl' : 'text-base'}`}>{c.cici}</span>
        </div>
        <p className="mt-3 line-clamp-2 text-[13px] leading-relaxed text-ink/55">{t(c.knownFor)}</p>
        <span className="mt-auto inline-flex items-center gap-1.5 pt-3 font-mono text-[11px] text-ink/40">
          {t({ en: 'Fame breakdown', zh: '名气拆解' })}
          <span className="transition-transform" style={{ transform: open ? 'rotate(180deg)' : 'none' }}>▾</span>
        </span>
      </div>
    </button>
  );
};

/* ---------- main ---------- */

interface Props { onHome: () => void }

const CICI: React.FC<Props> = ({ onHome }) => {
  const [lang, setLang] = useState<Lang>(detectInitialLang);
  const s2t = useS2T(lang === 'zhHant');
  const t: T = (txt) => (lang === 'en' ? txt.en : lang === 'zhHant' ? (s2t ? s2t(txt.zh) : txt.zh) : txt.zh);
  useEffect(() => { if (typeof window !== 'undefined') window.localStorage.setItem(STORAGE_KEY, lang); }, [lang]);

  const [country, setCountry] = useState<string>('cn');
  const ds = CICI_DATASETS.find((d) => d.key === country) ?? CICI_DATASETS[0];
  const cities = ds.cities;
  const [open, setOpen] = useState<number | null>(1); // #1 expanded by default
  const selectCountry = (key: string) => { setCountry(key); setOpen(1); };
  const podium = useMemo(() => cities.slice(0, 3), [cities]);
  const rest = useMemo(() => cities.slice(3), [cities]);
  const openPodium = podium.find((c) => c.rank === open);

  const LANGS: { code: Lang; label: string }[] = [{ code: 'en', label: 'EN' }, { code: 'zh', label: '简' }, { code: 'zhHant', label: '繁' }];

  return (
    <div className="min-h-screen bg-paper font-sans text-ink">
      <header className="sticky top-0 z-40 border-b border-ink/10 bg-paper/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-5 py-4 sm:px-8">
          <button onClick={onHome} className="font-mono text-xs text-ink/55 transition-colors hover:text-ink">← Da Lei · 大雷</button>
          <div className="flex items-center gap-3">
            <span className="hidden font-mono text-[11px] uppercase tracking-[0.2em] text-gold sm:inline">CICI Index</span>
            <div className="flex overflow-hidden rounded-full border border-ink/15">
              {LANGS.map((l) => (
                <button key={l.code} onClick={() => setLang(l.code)}
                  className={`px-2.5 py-1 font-mono text-[11px] transition-colors ${lang === l.code ? 'bg-ink text-paper' : 'text-ink/55 hover:text-ink'}`}>{l.label}</button>
              ))}
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-5 py-10 sm:px-8 sm:py-14">
        <p className="font-mono text-xs uppercase tracking-[0.22em] text-ink/45">{t({ en: 'CICI · a for-fun index', zh: 'CICI · 一个好玩的指数' })}</p>
        <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight sm:text-5xl">
          {t({ en: 'The cities we forgot to notice', zh: '被人口规模辜负的城市' })}
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-ink/65">
          {t({
            en: 'CICI — the Comparatively-Insignificant City Index — hunts for the places that are far less famous than their population would suggest. Not small towns (those are obviously obscure), but the big cities almost nobody outside the region can place on a map. Formula: standardized registered population, minus every source of fame. I encoded it as a skill and ran it — first on China, now on Japan.',
            zh: 'CICI —— Comparatively-Insignificant City Index(「相对无名城市指数」)—— 专门寻找那些远不如其人口规模所暗示的那样出名的城市。不是小县城(那本来就无名),而是那些人口庞大、外地人却几乎定位不了的大城市。公式:标准化的登记人口,减去一切名气来源。我把它做成了一个 skill,跑了一遍 —— 先是中国,现在是日本。',
          })}
        </p>

        {/* the formula */}
        <div className="mt-7 flex flex-wrap items-center gap-2.5 rounded-2xl border border-gold/25 bg-gold/[0.05] px-5 py-4 font-mono text-sm">
          <span className="rounded-lg bg-ink/5 px-3 py-1.5 text-ink/80">{t({ en: 'registered population', zh: '登记人口' })}</span>
          <span className="text-gold">−</span>
          <span className="rounded-lg bg-ink/5 px-3 py-1.5 text-ink/80">{t({ en: 'all the fame', zh: '一切名气' })}</span>
          <span className="text-gold">=</span>
          <span className="rounded-lg bg-gold/15 px-3 py-1.5 font-semibold text-gold">CICI</span>
        </div>

        {/* method */}
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {CICI_METHOD.map((m) => (
            <div key={m.step} className="rounded-2xl border border-ink/10 bg-surface/50 p-5">
              <span className="font-mono text-xs text-gold">{m.step}</span>
              <h3 className="mt-2 font-display text-lg font-semibold tracking-tight">{t(m.title)}</h3>
              <p className="mt-2 text-[13px] leading-relaxed text-ink/60">{t(m.body)}</p>
            </div>
          ))}
        </div>

        {/* sticky control bar — country switch + legend stay with the data they control */}
        <div className="sticky top-[57px] z-30 -mx-5 mt-12 border-b border-ink/10 bg-paper/90 px-5 py-3 backdrop-blur-xl sm:-mx-8 sm:px-8">
          <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
            <div className="inline-flex rounded-full border border-ink/15 bg-surface/50 p-1" role="group" aria-label={t({ en: 'Choose country', zh: '选择国家' })}>
              {CICI_DATASETS.map((d) => (
                <button
                  key={d.key}
                  onClick={() => selectCountry(d.key)}
                  aria-pressed={country === d.key}
                  className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 font-mono text-xs transition-colors ${country === d.key ? 'bg-ink text-paper' : 'text-ink/60 hover:text-ink'}`}
                >
                  <span aria-hidden="true">{d.flag}</span>{t(d.country)}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[11px] text-ink/50">
              <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-4 rounded-sm bg-gold" />{t({ en: 'CICI', zh: 'CICI 得分' })}</span>
              <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-4 rounded-sm bg-ink/20" />{t({ en: 'fame subtracted', zh: '被减名气' })}</span>
              <span className="hidden items-center gap-1.5 sm:inline-flex"><span className="h-2.5 w-4 rounded-sm border border-dashed border-ink/25" />{t({ en: 'population', zh: '人口规模' })}</span>
            </div>
          </div>
        </div>

        {/* leaderboard heading */}
        <div className="mt-8 flex items-baseline justify-between gap-3">
          <h2 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
            {t({ en: `The CICI top ${cities.length}`, zh: `CICI 前 ${cities.length} 名` })}
          </h2>
          <span className="font-mono text-[11px] text-ink/40">{t({ en: 'higher = more overlooked', zh: '越高 = 越被忽视' })}</span>
        </div>
        <p className="mt-2 max-w-2xl text-[13px] leading-relaxed text-ink/55">{t(ds.blurb)}</p>

        {/* podium — the top 3 get the visual weight the ranking is about */}
        <div className="mt-6 grid items-stretch gap-3 sm:grid-cols-3 sm:gap-4 sm:pt-4">
          {podium.map((c) => (
            <PodiumCard key={`${ds.key}-${c.rank}`} c={c} ds={ds} t={t} open={open === c.rank} onToggle={() => setOpen(open === c.rank ? null : c.rank)} />
          ))}
        </div>
        {openPodium && (
          <div className="mt-3 overflow-hidden rounded-2xl border border-gold/30 bg-surface/40">
            <div className="flex items-baseline gap-2.5 px-4 pt-3.5 sm:px-6">
              <span className="font-display text-xl font-bold tabular-nums text-gold">{openPodium.rank}</span>
              <h3 className="font-display text-lg font-semibold tracking-tight">{t(openPodium.name)}</h3>
              <span className="font-mono text-[11px] text-ink/45">{t(openPodium.region)}</span>
            </div>
            <div className="mt-2.5">
              <DetailPanel c={openPodium} ds={ds} t={t} />
            </div>
          </div>
        )}

        {/* the rest — compact rows, same expansion pattern */}
        <ol className="mt-6 flex flex-col gap-2.5">
          {rest.map((c) => {
            const isOpen = open === c.rank;
            return (
              <li key={`${ds.key}-${c.rank}`} className="overflow-hidden rounded-2xl border border-ink/10 bg-surface/40 transition-colors">
                <button
                  onClick={() => setOpen(isOpen ? null : c.rank)}
                  aria-expanded={isOpen}
                  className="grid w-full grid-cols-[2.25rem_1fr_auto] items-center gap-x-3 px-4 py-3.5 text-left sm:gap-x-5 sm:px-6"
                >
                  <span className="text-center font-display text-xl font-bold tabular-nums text-ink/35 sm:text-2xl">{c.rank}</span>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-0.5">
                      <h3 className="font-display text-lg font-semibold tracking-tight">{t(c.name)}</h3>
                      <span className="font-mono text-[11px] text-ink/45">{t(c.region)}</span>
                      <span className="font-mono text-[11px] tabular-nums text-ink/40">· {t(ds.regTag)} {(c.huji / 100).toFixed(1)}M</span>
                    </div>
                    <div className="mt-2 flex items-center gap-3">
                      <ScoreBar c={c} className="flex-1" />
                      <span className="w-8 shrink-0 text-right font-mono text-sm font-semibold tabular-nums text-gold">{c.cici}</span>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      {c.halo.map((h, hi) => (
                        <span key={`${h.factor}-${hi}`} className="inline-flex items-center gap-1 rounded-md border border-ink/10 bg-ink/[0.03] px-1.5 py-0.5 font-mono text-[10.5px] text-ink/55">
                          <span aria-hidden="true">{HALO_META[h.factor].icon}</span>
                          <span className="hidden sm:inline">{t(HALO_META[h.factor].label)}</span>
                          <span className="tabular-nums text-ink/35">−{h.weight}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                  <span className="self-start pt-1 font-mono text-[11px] text-ink/30 transition-transform" style={{ transform: isOpen ? 'rotate(180deg)' : 'none' }} aria-hidden="true">▾</span>
                </button>
                {isOpen && <DetailPanel c={c} ds={ds} t={t} />}
              </li>
            );
          })}
        </ol>

        {/* honest disclaimer */}
        <div className="mt-10 rounded-2xl border border-ink/10 bg-surface/40 p-6">
          <h3 className="font-display text-lg font-semibold tracking-tight">{t({ en: 'Read this before you get mad 🙂', zh: '生气之前先看这个 🙂' })}</h3>
          <p className="mt-3 text-sm leading-relaxed text-ink/65">
            {t({
              en: 'Every city has something — otherwise it wouldn’t be a city. This is relative, subjective, and purely for fun. The population figures are approximate and AI-assisted; the fame scores are one person’s read of national name-recognition, not objective fact. A high CICI just means "under-known relative to its size" — never an insult to a place or its people. If you want to disagree with the list, please do so kindly.',
              zh: '每座城市都有点什么 —— 否则它根本不会成为一座城市。这是相对的、主观的、纯为好玩。人口数据是近似值、AI 辅助整理;名气分只是一个人对「全国知名度」的判断,不是客观事实。CICI 高只代表「相对于体量而言不够出名」—— 绝不是对任何地方或它的人的贬低。想不同意这份榜单,请友好地表达。',
            })}
          </p>
          <p className="mt-3 text-sm leading-relaxed text-ink/65">
            {t({
              en: 'Funny thing: I haven’t been to most of these places — I tend to travel to cities with obvious economic or tourist pull, which by definition score low on CICI. 🤔',
              zh: '有意思的是:这份榜单上绝大多数地方我都没去过 —— 我通常只去那些有明显经济或旅游吸引力的城市,而它们按定义在 CICI 上得分都很低。🤔',
            })}
          </p>
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-ink/10 pt-8 font-mono text-[13px]">
          <a className="text-gold hover:underline" href="https://x.com/pretentiouswhat/status/2072979695855870285" target="_blank" rel="noreferrer">
            {t({ en: 'Method popularized by @pretentiouswhat ↗', zh: '方法由 @pretentiouswhat 提出 ↗' })}
          </a>
        </div>
        <p className="mt-5 text-xs leading-relaxed text-ink/45">
          {t({
            en: 'Built by running my cici-index skill — first over China’s prefecture-level cities, then over Japan’s municipalities. The skill (a reusable procedure encoding the method) lives in the repo; point it at any country and it’ll rank the same way. Next up on request.',
            zh: '用我的 cici-index skill 跑出来的 —— 先是中国地级市,再是日本市町村。这个 skill(把方法固化成可复用流程)就在仓库里;换成任何国家,它都会用同样的方式排名。想跑哪个国家,说一声。',
          })}
        </p>
      </main>
    </div>
  );
};

export default CICI;
