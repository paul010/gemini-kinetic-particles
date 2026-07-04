import React, { useEffect, useMemo, useState } from 'react';
import { CICI_DATASETS, CICI_METHOD, HALO_META, LocalizedText } from './data';

/* ---------------------------------------------------------------------------
 * /cici — the Comparatively-Insignificant City Index. A for-fun ranking of
 * China's prefecture-level cities that are FAR LESS famous than their
 * household population would suggest. Produced by running the `cici-index`
 * skill (.claude/skills/cici-index/SKILL.md). Method popularized by
 * @pretentiouswhat on X. Bilingual (繁 converted on the fly), on-brand.
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

interface Props { onHome: () => void }

const CICI: React.FC<Props> = ({ onHome }) => {
  const [lang, setLang] = useState<Lang>(detectInitialLang);
  const s2t = useS2T(lang === 'zhHant');
  const t = (txt: LocalizedText) => (lang === 'en' ? txt.en : lang === 'zhHant' ? (s2t ? s2t(txt.zh) : txt.zh) : txt.zh);
  useEffect(() => { if (typeof window !== 'undefined') window.localStorage.setItem(STORAGE_KEY, lang); }, [lang]);

  const [country, setCountry] = useState<string>('cn');
  const ds = CICI_DATASETS.find((d) => d.key === country) ?? CICI_DATASETS[0];
  const cities = ds.cities;
  const [open, setOpen] = useState<number | null>(1); // #1 expanded by default
  const selectCountry = (key: string) => { setCountry(key); setOpen(1); };
  const maxCici = useMemo(() => Math.max(...cities.map((c) => c.cici)), [cities]);

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

        {/* country switcher — the same skill, run on different countries */}
        <div className="mt-12 inline-flex rounded-full border border-ink/15 bg-surface/50 p-1" role="group" aria-label={t({ en: 'Choose country', zh: '选择国家' })}>
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

        {/* leaderboard */}
        <div className="mt-6 flex items-baseline justify-between gap-3">
          <h2 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
            {t({ en: `The CICI top ${cities.length}`, zh: `CICI 前 ${cities.length} 名` })}
          </h2>
          <span className="font-mono text-[11px] text-ink/40">{t({ en: 'higher = more overlooked', zh: '越高 = 越被忽视' })}</span>
        </div>
        <p className="mt-2 max-w-2xl text-[13px] leading-relaxed text-ink/55">{t(ds.blurb)}</p>

        {/* bar legend */}
        <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 font-mono text-[11px] text-ink/50">
          <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-4 rounded-sm bg-gold" />{t({ en: 'CICI score', zh: 'CICI 得分' })}</span>
          <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-4 rounded-sm bg-ink/20" />{t({ en: 'fame subtracted', zh: '被减去的名气' })}</span>
          <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-4 rounded-sm border border-dashed border-ink/25" />{t({ en: 'population extent', zh: '人口规模' })}</span>
        </div>

        <ol className="mt-5 flex flex-col gap-3">
          {cities.map((c) => {
            const isOpen = open === c.rank;
            return (
              <li key={c.rank} className={`overflow-hidden rounded-2xl border bg-surface/40 transition-colors ${c.rank === 1 ? 'border-gold/40' : 'border-ink/10'}`}>
                <button
                  onClick={() => setOpen(isOpen ? null : c.rank)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center gap-4 px-4 py-4 text-left sm:gap-5 sm:px-6"
                >
                  {/* rank */}
                  <span className={`w-9 shrink-0 text-center font-display text-2xl font-bold tabular-nums sm:text-3xl ${c.rank === 1 ? 'text-gold' : c.rank <= 3 ? 'text-ink' : 'text-ink/35'}`}>
                    {c.rank}
                  </span>

                  {/* body */}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-0.5">
                      <h3 className="font-display text-lg font-semibold tracking-tight sm:text-xl">{t(c.name)}</h3>
                      <span className="font-mono text-[11px] text-ink/45">{t(c.region)}</span>
                      <span className="font-mono text-[11px] text-ink/40">· {t(ds.regTag)} {(c.huji / 100).toFixed(1)}M</span>
                    </div>

                    {/* population / fame / cici bar */}
                    <div className="mt-2.5 flex items-center gap-3">
                      <div className="relative h-2.5 flex-1 rounded-full bg-ink/[0.06]" aria-hidden="true">
                        {/* population extent (dashed outline reference) */}
                        <div className="absolute inset-y-0 left-0 rounded-full border border-dashed border-ink/20" style={{ width: `${c.popScore}%` }} />
                        {/* fame subtracted (solid grey up to population) */}
                        <div className="absolute inset-y-0 left-0 rounded-full bg-ink/20" style={{ width: `${c.popScore}%` }} />
                        {/* cici (gold) */}
                        <div className="absolute inset-y-0 left-0 rounded-full bg-gold" style={{ width: `${c.cici}%` }} />
                      </div>
                      <span className="shrink-0 font-mono text-sm font-semibold tabular-nums text-gold">{c.cici}</span>
                    </div>

                    {/* halo chips */}
                    <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                      {c.halo.map((h, hi) => (
                        <span key={`${h.factor}-${hi}`} className="inline-flex items-center gap-1 rounded-md border border-ink/10 bg-ink/[0.03] px-1.5 py-0.5 font-mono text-[10.5px] text-ink/55">
                          <span aria-hidden="true">{HALO_META[h.factor].icon}</span>
                          <span className="hidden sm:inline">{t(HALO_META[h.factor].label)}</span>
                          <span className="text-ink/35">−{h.weight}</span>
                        </span>
                      ))}
                      <span className="ml-auto font-mono text-[11px] text-ink/30 transition-transform" style={{ transform: isOpen ? 'rotate(180deg)' : 'none' }}>▾</span>
                    </div>
                  </div>
                </button>

                {/* expanded detail */}
                {isOpen && (
                  <div className="border-t border-ink/10 bg-paper/50 px-4 py-4 sm:px-6 sm:pl-[4.75rem]">
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
                    <div className="mt-3.5 flex flex-wrap gap-x-5 gap-y-1 border-t border-ink/10 pt-3 font-mono text-[11px] text-ink/45">
                      <span>
                        {t(ds.regLabel)} {(c.huji / 100).toFixed(2)}M
                        {ds.showResident && <> · {t(ds.residentLabel)} {(c.changzhu / 100).toFixed(2)}M</>}
                      </span>
                      <span>{t({ en: 'pop-score', zh: '人口分' })} {c.popScore} − {t({ en: 'fame', zh: '名气' })} {c.famePenalty} = <span className="font-semibold text-gold">{c.cici}</span></span>
                    </div>
                  </div>
                )}
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
