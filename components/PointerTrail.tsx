'use client';

import { useEffect, useRef } from 'react';

type Point = { x: number; y: number; z: number; born: number; phase: number };
type Spark = Point & { vx: number; vy: number; radius: number };

const LIFETIME = 1100;
const MAX_POINTS = 100;
const MAX_SPARKS = 64;
const FOCAL_LENGTH = 800;

/** Perspective-projected 3D points, rendered on a lightweight 2D canvas.
 * Pointer values stay outside React; the frame loop sleeps after the tail fades.
 */
export default function PointerTrail() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const root = canvas?.closest<HTMLElement>('.home-root');
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx || !root) return;

    const media = window.matchMedia('(min-width: 768px) and (any-pointer: fine) and (prefers-reduced-motion: no-preference)');
    let width = 0;
    let height = 0;
    let frame = 0;
    let lastFrame = 0;
    let lastMove = 0;
    let lastX = 0;
    let lastY = 0;
    let phase = 0;
    let connected = false;
    let cameraX = 0;
    let cameraY = 0;
    let targetX = 0;
    let targetY = 0;
    let points: Point[] = [];
    let sparks: Spark[] = [];
    let dark = document.documentElement.dataset.theme === 'dark';

    const resetView = () => {
      root.style.removeProperty('--pointer-x');
      root.style.removeProperty('--pointer-y');
    };
    const clear = () => {
      cancelAnimationFrame(frame);
      frame = 0;
      connected = false;
      points = [];
      sparks = [];
      cameraX = cameraY = targetX = targetY = 0;
      ctx.clearRect(0, 0, width, height);
      resetView();
    };
    const resize = () => {
      clear();
      width = document.documentElement.clientWidth;
      height = window.innerHeight;
      const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    };

    // Store screen input in world space, then project depth back to the viewport.
    const project = (x: number, y: number, z: number) => {
      const scale = FOCAL_LENGTH / (FOCAL_LENGTH + z);
      return {
        x: width / 2 + (x + cameraX * z * 0.12) * scale,
        y: height / 2 + (y + cameraY * z * 0.12) * scale,
        scale,
      };
    };

    const draw = (now: number) => {
      frame = 0;
      if (!media.matches || document.hidden) { clear(); return; }
      const delta = Math.min(now - lastFrame || 16, 40);
      lastFrame = now;
      if (now - lastMove > 180) targetX = targetY = 0;
      const ease = 1 - Math.exp(-delta / 130);
      cameraX += (targetX - cameraX) * ease;
      cameraY += (targetY - cameraY) * ease;
      root.style.setProperty('--pointer-x', cameraX.toFixed(4));
      root.style.setProperty('--pointer-y', cameraY.toFixed(4));
      points = points.filter((p) => now - p.born < LIFETIME);
      sparks = sparks.filter((p) => now - p.born < LIFETIME);
      ctx.clearRect(0, 0, width, height);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      const color = dark ? '108,220,231' : '6,111,124';
      const core = dark ? '226,249,246' : '36,139,151';

      // Two helical strands exchange foreground/background as the route bends.
      for (const strand of [-1, 1]) {
        let previous: ReturnType<typeof project> | null = null;
        for (let i = 0; i < points.length; i++) {
          const p = points[i];
          const age = (now - p.born) / LIFETIME;
          const opacity = (1 - age) ** 1.6;
          const neighbor = points[Math.max(0, i - 1)];
          const angle = Math.atan2(p.y - neighbor.y, p.x - neighbor.x);
          const wave = p.phase + age * 1.2;
          const offset = Math.sin(wave) * (9 + age * 7) * strand;
          const z = p.z + Math.cos(wave) * 42 * strand + age * 90;
          const v = project(p.x - Math.sin(angle) * offset, p.y + Math.cos(angle) * offset, z);
          if (previous && Math.hypot(v.x - previous.x, v.y - previous.y) < 150) {
            ctx.beginPath();
            ctx.moveTo(previous.x, previous.y);
            ctx.lineTo(v.x, v.y);
            ctx.strokeStyle = `rgba(${color},${opacity * (dark ? 0.08 : 0.045)})`;
            ctx.lineWidth = 9 * v.scale;
            ctx.stroke();
            ctx.strokeStyle = `rgba(${strand === 1 ? color : core},${opacity * (strand === 1 ? 0.7 : 0.45)})`;
            ctx.lineWidth = (strand === 1 ? 1.7 : 1) * v.scale;
            ctx.stroke();
          }
          previous = v;
        }
      }

      for (const spark of sparks) {
        const age = (now - spark.born) / LIFETIME;
        const v = project(spark.x + spark.vx * age, spark.y + spark.vy * age, spark.z + age * 180);
        ctx.beginPath();
        ctx.arc(v.x, v.y, Math.max(0.2, spark.radius * v.scale * (1 - age * 0.5)), 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${color},${(1 - age) ** 2 * 0.7})`;
        ctx.fill();
      }

      if (points.length || sparks.length || Math.abs(cameraX) + Math.abs(cameraY) > 0.002) {
        frame = requestAnimationFrame(draw);
      } else {
        resetView();
      }
    };

    const onMove = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse' || !media.matches || document.hidden) return;
      const now = performance.now();
      const x = event.clientX;
      const y = event.clientY;
      targetX = (x / width - 0.5) * 2;
      targetY = (y / height - 0.5) * 2;
      if (!connected || now - lastMove > 180) {
        points = [];
        lastX = x;
        lastY = y;
        connected = true;
      }
      const distance = Math.hypot(x - lastX, y - lastY);
      if (distance < 2 && points.length) return;
      // Resample long moves, with a fixed cap for high-rate gaming mice.
      const steps = Math.min(8, Math.max(1, Math.ceil(distance / 7)));
      for (let step = 1; step <= steps; step++) {
        phase += 0.17;
        const z = Math.sin(phase * 0.4) * 45;
        const scale = FOCAL_LENGTH / (FOCAL_LENGTH + z);
        const point = {
          x: (lastX + (x - lastX) * step / steps - width / 2) / scale,
          y: (lastY + (y - lastY) * step / steps - height / 2) / scale,
          z, born: now, phase,
        };
        points.push(point);
        if (step === steps && distance > 5) {
          sparks.push({ ...point, vx: (Math.random() - 0.5) * 80, vy: (Math.random() - 0.5) * 80 - 15, radius: 0.7 + Math.random() * 1.5 });
        }
      }
      points = points.slice(-MAX_POINTS);
      sparks = sparks.slice(-MAX_SPARKS);
      lastX = x;
      lastY = y;
      lastMove = now;
      if (!frame) {
        lastFrame = now;
        frame = requestAnimationFrame(draw);
      }
    };

    const onLeave = () => { connected = false; targetX = targetY = 0; };
    const onVisibility = () => { if (document.hidden) clear(); };
    const onPreference = () => { if (!media.matches) clear(); };
    const themeObserver = new MutationObserver(() => {
      dark = document.documentElement.dataset.theme === 'dark';
    });
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    resize();
    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('resize', resize, { passive: true });
    window.addEventListener('blur', clear);
    document.documentElement.addEventListener('pointerleave', onLeave);
    document.addEventListener('visibilitychange', onVisibility);
    media.addEventListener('change', onPreference);
    return () => {
      clear();
      themeObserver.disconnect();
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('resize', resize);
      window.removeEventListener('blur', clear);
      document.documentElement.removeEventListener('pointerleave', onLeave);
      document.removeEventListener('visibilitychange', onVisibility);
      media.removeEventListener('change', onPreference);
    };
  }, []);

  return <canvas ref={ref} className="pointer-trail" aria-hidden="true" />;
}
