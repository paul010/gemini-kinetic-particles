import React, { useEffect, useRef, useState } from 'react';

/* ---------------------------------------------------------------------------
 * /town — a tiny "Smallville". A lightweight visual homage to Stanford's
 * "Generative Agents: Interactive Simulacra of Human Behavior" (Park et al.):
 * named townsfolk follow daily routines — sleep, coffee, work, socialize —
 * moving between buildings on a simulated clock, with status bubbles and a
 * live activity log. Honest scope: routines are scripted, not LLM-driven.
 * Pure canvas + rAF, no deps.
 * ------------------------------------------------------------------------- */

interface Props { onHome: () => void }

type PlaceKey = 'cafe' | 'library' | 'office' | 'park' | 'plaza' | 'home';
interface Place { key: PlaceKey; label: string; emoji: string; x: number; y: number; w: number; h: number; ax: number; ay: number; color: string }

const W = 960, H = 600;

// Buildings + their "anchor" (where agents stand to use them), in logical px.
const PLACES: Place[] = [
  { key: 'cafe',    label: 'Café',    emoji: '☕', x: 110, y: 250, w: 150, h: 110, ax: 230, ay: 330, color: '#c2703c' },
  { key: 'library', label: 'Library', emoji: '📚', x: 405, y: 70,  w: 160, h: 110, ax: 485, ay: 205, color: '#7a5cab' },
  { key: 'office',  label: 'Office',  emoji: '🏢', x: 705, y: 250, w: 150, h: 120, ax: 705, ay: 330, color: '#3a7a7a' },
  { key: 'park',    label: 'Park',    emoji: '🌳', x: 380, y: 430, w: 210, h: 130, ax: 485, ay: 415, color: '#5c8a3a' },
  { key: 'plaza',   label: 'Plaza',   emoji: '⛲', x: 430, y: 250, w: 110, h: 110, ax: 485, ay: 305, color: '#8a682c' },
];
const placeOf = (k: PlaceKey) => PLACES.find((p) => p.key === k)!;

interface Routine { from: number; place: PlaceKey; act: string }
interface Agent {
  name: string; color: string; hx: number; hy: number; // home spot
  routine: Routine[];
  x: number; y: number; tx: number; ty: number;
  place: PlaceKey; act: string; speak: number; phase: number;
}

// Home spots around the edges.
const HOMES: [number, number][] = [
  [70, 90], [70, 470], [890, 90], [890, 470], [180, 540], [780, 540], [180, 70], [780, 70],
];

// A shared day shape; each agent gets a workplace so they diverge.
const makeRoutine = (work: PlaceKey, social: PlaceKey): Routine[] => [
  { from: 0, place: 'home', act: 'sleeping' },
  { from: 7, place: 'cafe', act: 'getting coffee' },
  { from: 9, place: work, act: work === 'park' ? 'tending the garden' : work === 'library' ? 'reading & writing' : work === 'office' ? 'working' : 'serving customers' },
  { from: 12, place: 'cafe', act: 'having lunch' },
  { from: 14, place: work, act: work === 'park' ? 'sketching outdoors' : work === 'library' ? 'researching' : work === 'office' ? 'in deep work' : 'tidying up' },
  { from: 18, place: social, act: social === 'park' ? 'an evening stroll' : 'chatting in the plaza' },
  { from: 21, place: 'home', act: 'winding down' },
  { from: 23, place: 'home', act: 'sleeping' },
];

const AGENTS_SEED: { name: string; color: string; work: PlaceKey; social: PlaceKey }[] = [
  { name: 'Isabella', color: '#d97757', work: 'cafe', social: 'plaza' },
  { name: 'Klaus', color: '#7a5cab', work: 'library', social: 'plaza' },
  { name: 'Maria', color: '#4285f4', work: 'library', social: 'park' },
  { name: 'Tom', color: '#5c8a3a', work: 'park', social: 'park' },
  { name: 'Ayesha', color: '#3a9a9a', work: 'office', social: 'plaza' },
  { name: 'Sam', color: '#8a682c', work: 'office', social: 'plaza' },
  { name: 'Wolfgang', color: '#c0413a', work: 'park', social: 'plaza' },
  { name: 'Yuriko', color: '#c45c9a', work: 'library', social: 'park' },
];

const rand = (() => { let s = 1234567; return () => { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; }; })();

const currentRoutine = (r: Routine[], hour: number): Routine => {
  let cur = r[0];
  for (const seg of r) if (hour >= seg.from) cur = seg;
  return cur;
};

const Smallville: React.FC<Props> = ({ onHome }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [clock, setClock] = useState('06:00');
  const [phaseLabel, setPhaseLabel] = useState('Dawn');
  const [log, setLog] = useState<string[]>([]);
  const [paused, setPaused] = useState(false);
  const pausedRef = useRef(false);
  pausedRef.current = paused;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = W * dpr; canvas.height = H * dpr;
    ctx.scale(dpr, dpr);

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const agents: Agent[] = AGENTS_SEED.map((a, i) => {
      const [hx, hy] = HOMES[i];
      return { name: a.name, color: a.color, hx, hy, routine: makeRoutine(a.work, a.social),
        x: hx, y: hy, tx: hx, ty: hy, place: 'home', act: 'sleeping', speak: 0, phase: rand() * 6.28 };
    });

    let simMin = 6 * 60;             // start at 06:00
    const SIM_MIN_PER_SEC = 60;      // 1 sim-hour per minute of real time → 60 min/sec? we tune below
    let lastHour = -1;
    let lastLogKey = '';
    let raf = 0; let prev = performance.now();

    const anchorFor = (a: Agent, place: PlaceKey): [number, number] => {
      if (place === 'home') return [a.hx, a.hy];
      const p = placeOf(place);
      // spread agents around the anchor so they don't stack
      const ang = a.phase, r = place === 'plaza' || place === 'park' ? 42 : 26;
      return [p.ax + Math.cos(ang) * r, p.ay + Math.sin(ang) * r];
    };

    const phaseOf = (h: number) => h < 6 ? { k: 'Night', t: 'rgba(20,24,60,0.34)' }
      : h < 9 ? { k: 'Dawn', t: 'rgba(190,120,60,0.12)' }
      : h < 17 ? { k: 'Day', t: 'rgba(255,250,235,0.0)' }
      : h < 20 ? { k: 'Dusk', t: 'rgba(200,110,50,0.16)' }
      : { k: 'Night', t: 'rgba(20,24,60,0.34)' };

    const draw = (hour: number) => {
      // ground
      ctx.fillStyle = '#e9e2d2'; ctx.fillRect(0, 0, W, H);
      // soft paths (plaza cross)
      ctx.strokeStyle = 'rgba(28,26,23,0.06)'; ctx.lineWidth = 46; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(120, 305); ctx.lineTo(840, 305); ctx.moveTo(485, 120); ctx.lineTo(485, 500); ctx.stroke();
      // buildings
      for (const p of PLACES) {
        ctx.fillStyle = '#fffdf8'; ctx.strokeStyle = 'rgba(28,26,23,0.14)'; ctx.lineWidth = 1.5;
        roundRect(ctx, p.x, p.y, p.w, p.h, 12); ctx.fill(); ctx.stroke();
        ctx.fillStyle = p.color; roundRect(ctx, p.x, p.y, p.w, 8, 4); ctx.fill();
        ctx.font = '24px serif'; ctx.textAlign = 'center'; ctx.fillText(p.emoji, p.x + p.w / 2, p.y + p.h / 2 + 2);
        ctx.font = "600 13px 'JetBrains Mono', monospace"; ctx.fillStyle = 'rgba(28,26,23,0.55)';
        ctx.fillText(p.label, p.x + p.w / 2, p.y + p.h - 12);
        // lit windows at night
        if (hour < 6 || hour >= 20) { ctx.fillStyle = 'rgba(220,180,90,0.85)'; ctx.fillRect(p.x + 16, p.y + 22, 10, 10); ctx.fillRect(p.x + p.w - 26, p.y + 22, 10, 10); }
      }
      // agents
      for (const a of agents) {
        // body
        ctx.beginPath(); ctx.arc(a.x, a.y, 8, 0, 6.2832); ctx.fillStyle = a.color; ctx.fill();
        ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.stroke();
        // name
        ctx.font = "600 11px 'JetBrains Mono', monospace"; ctx.textAlign = 'center';
        ctx.fillStyle = 'rgba(28,26,23,0.7)'; ctx.fillText(a.name, a.x, a.y - 14);
        // speech bubble when socializing & near someone
        if (a.speak > 0) { ctx.font = '14px serif'; ctx.fillText('💬', a.x + 12, a.y - 10); }
      }
      // day/night tint
      const ph = phaseOf(hour);
      if (ph.t !== 'rgba(255,250,235,0.0)') { ctx.fillStyle = ph.t; ctx.fillRect(0, 0, W, H); }
    };

    const step = (now: number) => {
      const dt = Math.min((now - prev) / 1000, 0.05); prev = now;
      if (!pausedRef.current) {
        simMin += dt * SIM_MIN_PER_SEC;       // advance sim clock
        if (simMin >= 1440) simMin -= 1440;
      }
      const hour = Math.floor(simMin / 60);

      // routine transitions on hour change
      if (hour !== lastHour) {
        lastHour = hour;
        for (const a of agents) {
          const seg = currentRoutine(a.routine, hour);
          a.place = seg.place; a.act = seg.act;
          const [tx, ty] = anchorFor(a, seg.place); a.tx = tx; a.ty = ty;
        }
      }

      // move + social
      for (const a of agents) {
        const dx = a.tx - a.x, dy = a.ty - a.y, d = Math.hypot(dx, dy);
        const speed = reduce ? 0 : 46; // px/sec
        if (d > 1.5 && speed) { const m = Math.min(speed * dt, d); a.x += (dx / d) * m; a.y += (dy / d) * m; }
        a.speak = 0;
      }
      // chat bubbles when two agents are close in social spots
      for (let i = 0; i < agents.length; i++) for (let j = i + 1; j < agents.length; j++) {
        const a = agents[i], b = agents[j];
        if ((a.place === 'plaza' || a.place === 'cafe' || a.place === 'park') && a.place === b.place) {
          if (Math.hypot(a.x - b.x, a.y - b.y) < 34) { a.speak = b.speak = 1; }
        }
      }

      draw(hour);

      // throttle React updates (clock + log) ~ every change of minute-ish
      const hh = String(hour).padStart(2, '0'); const mm = String(Math.floor(simMin % 60)).padStart(2, '0');
      const ph = phaseOf(hour);
      const logKey = `${hh}:${agents[0].act}`;
      if (logKey !== lastLogKey) {
        lastLogKey = logKey;
        setClock(`${hh}:${mm}`); setPhaseLabel(ph.k);
        const lines = agents.slice(0, 6).map((a) => `${hh}:00 · ${a.name} — ${a.act} @ ${placeName(a.place)}`);
        setLog(lines);
      } else {
        // still update the clock minutes cheaply, but not too often
        if (Math.floor(simMin) % 5 === 0) setClock(`${hh}:${mm}`);
      }

      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-paper font-sans text-ink">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-ink/10 px-5 py-3 sm:px-8">
        <div className="flex items-center gap-3">
          <button onClick={onHome} className="font-mono text-xs text-ink/55 hover:text-ink">← Da Lei · 大雷</button>
          <span className="font-display text-lg font-semibold tracking-tight">Smallville · 小镇</span>
        </div>
        <div className="flex items-center gap-3 font-mono text-xs text-ink/60">
          <span className="tabular-nums">🕑 {clock}</span>
          <span className="rounded-full border border-ink/15 bg-ink/5 px-2 py-0.5">{phaseLabel}</span>
          <button onClick={() => setPaused((p) => !p)} className="rounded-full border border-ink/15 bg-ink/[0.03] px-3 py-1 text-ink/70 hover:border-gold/40 hover:text-gold">
            {paused ? '▶ 继续' : '⏸ 暂停'}
          </button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-8 sm:px-8">
        <p className="font-mono text-xs uppercase tracking-[0.22em] text-ink/45">Generative agents · 生成式智能体</p>
        <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl">A tiny Smallville</h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink/65">
          八个小镇居民按各自的日程生活 —— 睡觉、喝咖啡、上班、傍晚在广场闲聊。灵感来自斯坦福「Generative Agents:
          Interactive Simulacra of Human Behavior」(Park et al., 2023)。诚实说明:这里的日程是<b>脚本化</b>的演示,不是真的大模型在驱动。
        </p>

        <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_280px]">
          <div className="overflow-hidden rounded-2xl border border-ink/10 bg-surface/40 shadow-sm">
            <canvas ref={canvasRef} className="block w-full" style={{ aspectRatio: '8 / 5' }} aria-label="Smallville simulation" />
          </div>
          <aside className="flex flex-col gap-3">
            <div className="rounded-2xl border border-ink/10 bg-surface/40 p-4">
              <div className="font-mono text-[11px] uppercase tracking-wider text-gold">Live activity</div>
              <ul className="mt-2 space-y-1.5 font-mono text-[11.5px] leading-relaxed text-ink/60">
                {log.length === 0 ? <li className="text-ink/35">starting the day…</li> : log.map((l, i) => <li key={i}>{l}</li>)}
              </ul>
            </div>
            <div className="rounded-2xl border border-ink/10 bg-surface/40 p-4">
              <div className="font-mono text-[11px] uppercase tracking-wider text-gold">Townsfolk</div>
              <ul className="mt-2 grid grid-cols-2 gap-1.5 text-[12px] text-ink/65">
                {AGENTS_SEED.map((a) => (
                  <li key={a.name} className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: a.color }} /> {a.name}
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>

        <p className="mt-6 max-w-2xl text-xs leading-relaxed text-ink/45">
          The real research had 25 LLM-driven agents form memories, make plans, and even organize a Valentine’s party.
          This is a lightweight visual tribute — same idea, scripted routines — built on canvas in the browser.
        </p>
      </main>
    </div>
  );
};

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
const placeName = (k: PlaceKey) => k === 'home' ? 'Home' : placeOf(k).label;

export default Smallville;
