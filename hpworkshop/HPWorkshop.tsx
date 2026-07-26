import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BLOCKS, SCENARIOS, FOUR_STEPS, PART_META, CLOSING, type T, type Scenario } from './data';

/* ---------------------------------------------------------------------------
 * /hpworkshop — live presenter panel for the 2026-07-28 full-day AI workshop.
 *
 * Built to be projected: a dark, high-contrast console that walks the room
 * through the day's agenda and the nine Copilot scenarios. Every prompt, data
 * sample and acceptance test is one big button away from the clipboard, so the
 * instructor can talk and paste without leaving the page. Keyboard-driven
 * (← → 1-9 F T), with a per-block countdown so the day stays on schedule.
 * Fully offline — nothing is fetched at runtime.
 * ------------------------------------------------------------------------- */

type Lang = 'en' | 'zh' | 'zhHant';
const STORAGE_KEY = 'dalei-lang-v2';
/** This panel is presented to a Chinese-speaking room, and every prompt,
 *  data sample and test in it is Chinese — so it opens in 简体 unless the
 *  visitor has explicitly chosen English site-wide. */
const detectInitialLang = (): Lang => {
  if (typeof window === 'undefined') return 'zh';
  const s = window.localStorage.getItem(STORAGE_KEY);
  return s === 'en' ? 'en' : s === 'zhHant' ? 'zhHant' : 'zh';
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

type TabKey = 'prompt' | 'data' | 'tests' | 'notes';
const TABS: { k: TabKey; label: T; icon: string }[] = [
  { k: 'prompt', label: { en: 'Prompt', zh: '提示词' }, icon: '📋' },
  { k: 'data', label: { en: 'Data', zh: '数据 / 知识' }, icon: '🗂️' },
  { k: 'tests', label: { en: 'Acceptance tests', zh: '验收测试' }, icon: '✅' },
  { k: 'notes', label: { en: 'Teaching notes', zh: '讲解要点' }, icon: '🎤' },
];

const fmt = (s: number) => {
  const neg = s < 0; const a = Math.abs(s);
  return `${neg ? '-' : ''}${String(Math.floor(a / 60)).padStart(2, '0')}:${String(a % 60).padStart(2, '0')}`;
};

interface Props { onHome: () => void }

const HPWorkshop: React.FC<Props> = ({ onHome }) => {
  const [lang, setLang] = useState<Lang>(detectInitialLang);
  const s2t = useS2T(lang === 'zhHant');
  const t = useCallback((x: T) => (lang === 'en' ? x.en : lang === 'zhHant' ? (s2t ? s2t(x.zh) : x.zh) : x.zh), [lang, s2t]);
  useEffect(() => { if (typeof window !== 'undefined') window.localStorage.setItem(STORAGE_KEY, lang); }, [lang]);

  /** view: an agenda block (overview) or one of the nine scenarios */
  const [view, setView] = useState<{ kind: 'block'; id: string } | { kind: 'scenario'; no: number }>({ kind: 'block', id: 'open' });
  const [tab, setTab] = useState<TabKey>('prompt');
  const [copied, setCopied] = useState<string | null>(null);
  const [showRail, setShowRail] = useState(true);

  // per-block countdown
  const [timerFor, setTimerFor] = useState<string | null>(null);
  const [left, setLeft] = useState(0);
  const [running, setRunning] = useState(false);
  useEffect(() => {
    if (!running) return;
    const h = window.setInterval(() => setLeft((v) => v - 1), 1000);
    return () => window.clearInterval(h);
  }, [running]);

  const scenario: Scenario | null = view.kind === 'scenario' ? SCENARIOS.find((s) => s.no === view.no)! : null;
  const isClosing = view.kind === 'block' && view.id === 'close';
  // the closing card has no agenda block of its own — fall back so nothing reads undefined
  const block = view.kind === 'block'
    ? (BLOCKS.find((b) => b.id === view.id) ?? BLOCKS[BLOCKS.length - 1])
    : BLOCKS.find((b) => b.part === scenario!.part)!;

  const copy = (key: string, text: string) => {
    navigator.clipboard?.writeText(text).then(() => {
      setCopied(key);
      window.setTimeout(() => setCopied((c) => (c === key ? null : c)), 1800);
    }).catch(() => {});
  };

  const startTimer = () => {
    const mins = view.kind === 'scenario' ? scenario!.minutes : block.minutes;
    const id = view.kind === 'scenario' ? `s${scenario!.no}` : block.id;
    setTimerFor(id); setLeft(mins * 60); setRunning(true);
  };

  const go = useCallback((delta: number) => {
    setTab('prompt');
    setView((v) => {
      if (v.kind === 'block') {
        // from a block, step into its first scenario (or the next block)
        const bi = BLOCKS.findIndex((b) => b.id === v.id);
        if (delta > 0) {
          const b = BLOCKS[bi];
          if (b.part) { const first = SCENARIOS.find((s) => s.part === b.part)!; return { kind: 'scenario', no: first.no }; }
          const nb = BLOCKS[Math.min(BLOCKS.length - 1, bi + 1)];
          return { kind: 'block', id: nb.id };
        }
        const pb = BLOCKS[Math.max(0, bi - 1)];
        return { kind: 'block', id: pb.id };
      }
      const no = v.no + delta;
      if (no < 1) return { kind: 'block', id: 'open' };
      if (no > SCENARIOS.length) return { kind: 'block', id: 'close' };
      return { kind: 'scenario', no };
    });
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (e.key === 'ArrowRight' || e.key === 'PageDown') { e.preventDefault(); go(1); }
      else if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); go(-1); }
      else if (e.key >= '1' && e.key <= '9') { setView({ kind: 'scenario', no: Number(e.key) }); setTab('prompt'); }
      else if (e.key.toLowerCase() === 'f') { const el = document.documentElement; if (!document.fullscreenElement) el.requestFullscreen?.().catch(() => {}); else document.exitFullscreen?.().catch(() => {}); }
      else if (e.key.toLowerCase() === 't') { if (running) setRunning(false); else startTimer(); }
      else if (e.key.toLowerCase() === 'h') setShowRail((s) => !s);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const LANGS: { code: Lang; label: string }[] = [{ code: 'zh', label: '简' }, { code: 'zhHant', label: '繁' }, { code: 'en', label: 'EN' }];
  const accent = view.kind === 'scenario' ? PART_META[scenario!.part].color : isClosing ? '#2fa8ff' : block.part ? PART_META[block.part].color : '#2fa8ff';
  const timerActive = timerFor === (view.kind === 'scenario' ? `s${scenario!.no}` : block.id);
  const timeColor = left < 0 ? '#ff5a5a' : left < 300 ? '#ff8a3c' : '#2fa8ff';

  const CopyBtn: React.FC<{ k: string; text: string; big?: boolean; label?: T }> = ({ k, text, big, label }) => (
    <button onClick={() => copy(k, text)}
      className={`inline-flex items-center gap-2 rounded-lg font-semibold transition-all ${big ? 'px-5 py-2.5 text-[15px]' : 'px-3 py-1.5 text-[13px]'}`}
      style={{ background: copied === k ? '#1f9d55' : `${accent}22`, color: copied === k ? '#fff' : accent, border: `1px solid ${copied === k ? '#1f9d55' : accent + '66'}` }}>
      {copied === k ? `✓ ${t({ en: 'Copied', zh: '已复制' })}` : `⧉ ${t(label || { en: 'Copy', zh: '复制' })}`}
    </button>
  );

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-[#04101f] font-sans text-white"
      style={{ backgroundImage: 'radial-gradient(1200px 600px at 20% -10%, rgba(47,168,255,0.16), transparent 60%), radial-gradient(900px 500px at 110% 20%, rgba(255,138,60,0.10), transparent 60%)' }}>

      {/* ============ top bar ============ */}
      <header className="flex shrink-0 items-center gap-3 border-b border-white/10 bg-[#04101f]/80 px-4 py-2.5 backdrop-blur-xl sm:px-6">
        <button onClick={onHome} className="rounded-full border border-white/15 px-3 py-1.5 font-mono text-[11px] text-white/60 transition-colors hover:text-white">← 大雷</button>
        <div className="min-w-0">
          <h1 className="truncate text-[15px] font-bold tracking-tight sm:text-[17px]">{t({ en: 'AI Hands-on Workshop — from tools to agents', zh: 'AI 实战工作坊：从工具到智能体' })}</h1>
          <p className="hidden font-mono text-[10.5px] tracking-wider text-white/40 sm:block">2026·07·28 · {t({ en: 'presenter panel · 9 scenarios', zh: '演示讲解面板 · 9 个案例' })}</p>
        </div>

        {/* agenda chips */}
        <nav className="ml-auto hidden items-center gap-1.5 lg:flex">
          {BLOCKS.map((b) => {
            const active = !isClosing && block.id === b.id;
            const c = b.part ? PART_META[b.part].color : b.kind === 'break' ? '#7a8a99' : '#2fa8ff';
            return (
              <button key={b.id} onClick={() => { setView({ kind: 'block', id: b.id }); setTab('prompt'); }}
                className="rounded-lg px-2.5 py-1.5 text-left transition-all"
                style={{ background: active ? `${c}22` : 'transparent', border: `1px solid ${active ? c + '88' : 'rgba(255,255,255,0.09)'}` }}>
                <span className="block font-mono text-[10px] leading-none" style={{ color: active ? c : 'rgba(255,255,255,0.45)' }}>{b.time}</span>
                <span className="mt-0.5 block text-[11.5px] font-semibold leading-none" style={{ color: active ? '#fff' : 'rgba(255,255,255,0.6)' }}>{t(b.label)}</span>
              </button>
            );
          })}
        </nav>

        {/* timer + controls */}
        <div className="ml-auto flex items-center gap-2 lg:ml-3">
          <button onClick={() => (running ? setRunning(false) : startTimer())}
            className="rounded-lg border px-3 py-1.5 font-mono text-[13px] font-bold tabular-nums transition-colors"
            style={{ borderColor: timerActive ? timeColor + '88' : 'rgba(255,255,255,0.15)', color: timerActive ? timeColor : 'rgba(255,255,255,0.55)', background: timerActive ? timeColor + '18' : 'transparent' }}
            title={t({ en: 'block timer (T)', zh: '环节计时器（T）' })}>
            {timerActive ? `${running ? '⏸' : '▶'} ${fmt(left)}` : `⏱ ${view.kind === 'scenario' ? scenario!.minutes : block.minutes}′`}
          </button>
          <div className="flex overflow-hidden rounded-lg border border-white/15">
            {LANGS.map((l) => (<button key={l.code} onClick={() => setLang(l.code)} className={`px-2 py-1.5 font-mono text-[11px] transition-colors ${lang === l.code ? 'bg-white text-[#04101f]' : 'text-white/50 hover:text-white'}`}>{l.label}</button>))}
          </div>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        {/* ============ left rail ============ */}
        {showRail && (
          <aside className="hidden w-[248px] shrink-0 overflow-y-auto border-r border-white/10 bg-black/25 py-3 md:block">
            {([1, 2, 3] as const).map((p) => (
              <div key={p} className="mb-3">
                <div className="flex items-center gap-2 px-4 pb-1.5">
                  <span className="h-2 w-2 rounded-sm" style={{ background: PART_META[p].color }} />
                  <span className="font-mono text-[10.5px] uppercase tracking-[0.15em]" style={{ color: PART_META[p].color }}>Part {p} · {t(PART_META[p].name)}</span>
                </div>
                {SCENARIOS.filter((s) => s.part === p).map((s) => {
                  const on = view.kind === 'scenario' && view.no === s.no;
                  return (
                    <button key={s.id} onClick={() => { setView({ kind: 'scenario', no: s.no }); setTab('prompt'); }}
                      className="flex w-full items-center gap-2.5 px-4 py-2 text-left transition-colors"
                      style={{ background: on ? `${PART_META[p].color}1f` : 'transparent', borderLeft: `3px solid ${on ? PART_META[p].color : 'transparent'}` }}>
                      <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md font-mono text-[11px] font-bold"
                        style={{ background: on ? PART_META[p].color : 'rgba(255,255,255,0.08)', color: on ? '#04101f' : 'rgba(255,255,255,0.6)' }}>{s.no}</span>
                      <span className={`truncate text-[13px] ${on ? 'font-semibold text-white' : 'text-white/60'}`}>{t(s.title)}</span>
                    </button>
                  );
                })}
              </div>
            ))}
            <div className="mt-2 border-t border-white/10 px-4 pt-3">
              <button onClick={() => { setView({ kind: 'block', id: 'close' }); }}
                className={`w-full rounded-lg border px-3 py-2 text-left text-[13px] transition-colors ${view.kind === 'block' && view.id === 'close' ? 'border-white/40 bg-white/10 text-white' : 'border-white/10 text-white/55 hover:text-white'}`}>
                🏁 {t(CLOSING.title)}
              </button>
              <p className="mt-3 font-mono text-[10px] leading-relaxed text-white/30">
                ← → {t({ en: 'move', zh: '翻页' })} · 1-9 {t({ en: 'jump', zh: '跳转' })}<br />F {t({ en: 'fullscreen', zh: '全屏' })} · T {t({ en: 'timer', zh: '计时' })} · H {t({ en: 'hide rail', zh: '收起侧栏' })}
              </p>
            </div>
          </aside>
        )}

        {/* ============ main ============ */}
        <main className="min-w-0 flex-1 overflow-y-auto px-5 py-5 sm:px-8 sm:py-7">
          {/* ---- block overview ---- */}
          {view.kind === 'block' && view.id !== 'close' && (
            <div className="mx-auto max-w-4xl">
              <p className="font-mono text-sm tracking-[0.2em]" style={{ color: accent }}>{block.time}</p>
              <h2 className="mt-2 text-4xl font-bold tracking-tight sm:text-5xl">{t(block.label)}</h2>
              {block.summary && <p className="mt-5 max-w-3xl text-lg leading-relaxed text-white/70 sm:text-xl">{t(block.summary)}</p>}

              {block.kind === 'break' ? (
                <p className="mt-8 text-lg text-white/40">🍱 {t({ en: 'Back at 13:30 — Part 2 starts with the safety infographic.', zh: '13:30 回来 —— Part 2 从安全检查图开始。' })}</p>
              ) : (
                <>
                  <div className="mt-8 grid gap-3 sm:grid-cols-4">
                    {FOUR_STEPS.map((s, i) => (
                      <div key={s.k} className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
                        <span className="font-mono text-xs font-bold" style={{ color: accent }}>0{i + 1} · {s.k}</span>
                        <h3 className="mt-1.5 text-[15px] font-semibold">{t(s.label)}</h3>
                        <p className="mt-1 text-[12.5px] leading-relaxed text-white/50">{t(s.desc)}</p>
                      </div>
                    ))}
                  </div>
                  {block.part && (
                    <div className="mt-8">
                      <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-white/40">{t({ en: 'scenarios in this block', zh: '本环节案例' })}</p>
                      <div className="mt-3 grid gap-3 sm:grid-cols-3">
                        {SCENARIOS.filter((s) => s.part === block.part).map((s) => (
                          <button key={s.id} onClick={() => { setView({ kind: 'scenario', no: s.no }); setTab('prompt'); }}
                            className="rounded-xl border border-white/10 bg-white/[0.04] p-4 text-left transition-all hover:-translate-y-0.5 hover:border-white/30">
                            <span className="font-mono text-xs" style={{ color: accent }}>{String(s.no).padStart(2, '0')} · {s.minutes}′</span>
                            <h3 className="mt-1.5 text-[16px] font-semibold">{t(s.title)}</h3>
                            <p className="mt-1.5 text-[12.5px] leading-relaxed text-white/50">{t(s.goal)}</p>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* ---- closing ---- */}
          {view.kind === 'block' && view.id === 'close' && (
            <div className="mx-auto max-w-3xl">
              <h2 className="text-4xl font-bold tracking-tight sm:text-5xl">{t(CLOSING.title)}</h2>
              <ul className="mt-8 space-y-4">
                {CLOSING.lines.map((l, i) => (
                  <li key={i} className="flex gap-4 rounded-xl border border-white/10 bg-white/[0.04] p-5">
                    <span className="font-mono text-lg font-bold" style={{ color: ['#2fa8ff', '#22c6b6', '#ff8a3c', '#2fa8ff', '#22c6b6'][i] }}>0{i + 1}</span>
                    <span className="text-lg leading-relaxed sm:text-xl">{t(l)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* ---- scenario ---- */}
          {scenario && (
            <div className="mx-auto max-w-5xl">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="rounded-md px-2 py-1 font-mono text-[11px] font-bold" style={{ background: `${accent}22`, color: accent }}>
                  PART {scenario.part} · {String(scenario.no).padStart(2, '0')}/09
                </span>
                <span className="rounded-md border border-white/15 px-2 py-1 font-mono text-[11px] text-white/60">{t(scenario.product)}</span>
                <span className="rounded-md border border-white/15 px-2 py-1 font-mono text-[11px] text-white/60">≈{scenario.minutes} {t({ en: 'min', zh: '分钟' })}</span>
              </div>
              <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">{t(scenario.title)}</h2>
              <p className="mt-2.5 max-w-3xl text-[16px] leading-relaxed text-white/65 sm:text-lg">{t(scenario.goal)}</p>

              {/* four steps strip */}
              <div className="mt-5 flex flex-wrap gap-2">
                {FOUR_STEPS.map((s, i) => (
                  <span key={s.k} className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 font-mono text-[11.5px] text-white/55">
                    <b style={{ color: accent }}>{i + 1}</b> {s.k} · {t(s.label)}
                  </span>
                ))}
              </div>

              {/* tabs */}
              <div className="mt-6 flex flex-wrap gap-1.5 border-b border-white/10 pb-2">
                {TABS.map((tb) => (
                  <button key={tb.k} onClick={() => setTab(tb.k)}
                    className="rounded-t-lg px-4 py-2 text-[14px] font-semibold transition-colors"
                    style={{ background: tab === tb.k ? `${accent}1f` : 'transparent', color: tab === tb.k ? '#fff' : 'rgba(255,255,255,0.5)', borderBottom: `2px solid ${tab === tb.k ? accent : 'transparent'}` }}>
                    {tb.icon} {t(tb.label)}
                  </button>
                ))}
              </div>

              {/* tab bodies */}
              <div className="mt-5">
                {tab === 'prompt' && (
                  <div className="overflow-hidden rounded-2xl border" style={{ borderColor: `${accent}55` }}>
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3" style={{ borderColor: `${accent}33`, background: `${accent}12` }}>
                      <span className="font-mono text-[12px] font-semibold tracking-wide" style={{ color: accent }}>{t(scenario.promptLabel)}</span>
                      <CopyBtn k={`p-${scenario.id}`} text={scenario.prompt} big label={{ en: 'Copy the prompt', zh: '复制提示词' }} />
                    </div>
                    <pre className="max-h-[52vh] overflow-auto whitespace-pre-wrap px-5 py-4 font-mono text-[13.5px] leading-[1.75] text-white/85">{scenario.prompt}</pre>
                  </div>
                )}

                {tab === 'data' && (
                  <div className="space-y-4">
                    {scenario.data.map((d, i) => (
                      <div key={i} className="overflow-hidden rounded-2xl border border-white/12">
                        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-white/[0.04] px-4 py-2.5">
                          <div>
                            <span className="font-mono text-[12px] font-semibold text-white/80">{t(d.label)}</span>
                            {d.note && <span className="ml-2 text-[11.5px] text-white/40">{t(d.note)}</span>}
                          </div>
                          <CopyBtn k={`d-${scenario.id}-${i}`} text={d.content} />
                        </div>
                        <pre className="max-h-[42vh] overflow-auto whitespace-pre-wrap px-5 py-3.5 font-mono text-[13px] leading-[1.7] text-white/75">{d.content}</pre>
                      </div>
                    ))}
                    <p className="text-[12.5px] leading-relaxed text-white/35">
                      {t({ en: 'Sample data is classroom fiction from the starter kit — never swap in real employee, customer or ticket data.', zh: '示例数据为 Starter Kit 的课堂虚构材料 —— 切勿替换成真实员工 / 客户 / 工单数据。' })}
                    </p>
                  </div>
                )}

                {tab === 'tests' && (
                  <div className="overflow-hidden rounded-2xl border border-white/12">
                    <div className="flex items-center justify-between gap-3 border-b border-white/10 bg-white/[0.04] px-4 py-2.5">
                      <span className="font-mono text-[12px] font-semibold text-white/80">{t({ en: 'Run these before calling it done', zh: '做完之前，先跑这张表' })}</span>
                      <CopyBtn k={`t-${scenario.id}`} text={[scenario.tests.cols.map((c) => t(c)).join(','), ...scenario.tests.rows.map((r) => r.join(','))].join('\n')} label={{ en: 'Copy as CSV', zh: '复制为 CSV' }} />
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-[13.5px]">
                        <thead>
                          <tr className="border-b border-white/10 bg-white/[0.03]">
                            {scenario.tests.cols.map((c, i) => (<th key={i} className="whitespace-nowrap px-4 py-2.5 font-mono text-[11px] uppercase tracking-wider text-white/45">{t(c)}</th>))}
                          </tr>
                        </thead>
                        <tbody>
                          {scenario.tests.rows.map((r, i) => (
                            <tr key={i} className="border-b border-white/[0.06] last:border-0 hover:bg-white/[0.03]">
                              {r.map((cell, j) => (
                                <td key={j} className={`px-4 py-2.5 align-top ${j === 0 ? 'whitespace-nowrap font-mono text-[12.5px]' : 'text-white/80'}`}
                                  style={j === 0 ? { color: accent } : undefined}>
                                  {j === r.length - 1 && /^(9\d|100|8\d)$/.test(cell)
                                    ? <span className="rounded px-1.5 py-0.5 font-mono text-[12px] font-bold" style={{ background: Number(cell) >= 90 ? '#ff5a5a22' : '#2fa8ff22', color: Number(cell) >= 90 ? '#ff8a8a' : '#7ac8ff' }}>{cell}</span>
                                    : cell}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {tab === 'notes' && (
                  <div className="space-y-3">
                    {scenario.notes.map((n, i) => (
                      <div key={i} className="flex gap-3.5 rounded-xl border border-white/10 bg-white/[0.04] p-4">
                        <span className="font-mono text-[13px] font-bold" style={{ color: accent }}>{String(i + 1).padStart(2, '0')}</span>
                        <p className="text-[15px] leading-relaxed text-white/85">{t(n)}</p>
                      </div>
                    ))}
                    <div className="rounded-xl border p-4" style={{ borderColor: '#ff8a3c55', background: '#ff8a3c12' }}>
                      <p className="font-mono text-[11px] font-bold uppercase tracking-[0.15em]" style={{ color: '#ff8a3c' }}>⚡ {t({ en: 'Failure to stage on purpose', zh: '故意演一次的失败' })}</p>
                      <p className="mt-2 text-[15px] leading-relaxed text-white/85">{t(scenario.pitfall)}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* prev / next */}
              <div className="mt-8 flex items-center justify-between border-t border-white/10 pt-4">
                <button onClick={() => go(-1)} className="rounded-lg border border-white/15 px-4 py-2 text-[13px] text-white/60 transition-colors hover:text-white">← {t({ en: 'Prev', zh: '上一个' })}</button>
                <span className="font-mono text-[11px] text-white/30">{t({ en: 'arrow keys to move · 1-9 to jump', zh: '方向键翻页 · 数字键 1-9 跳转' })}</span>
                <button onClick={() => go(1)} className="rounded-lg px-4 py-2 text-[13px] font-semibold transition-colors" style={{ background: `${accent}22`, color: accent, border: `1px solid ${accent}66` }}>{t({ en: 'Next', zh: '下一个' })} →</button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default HPWorkshop;
