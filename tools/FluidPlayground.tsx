import React, { useEffect, useRef } from 'react';

interface Props {
  onHome: () => void;
}

/**
 * Full-screen interactive fluid playground. Wraps Pavel Dobryakov's
 * WebGL-Fluid-Simulation (MIT) via the webgl-fluid package.
 */
const FluidPlayground: React.FC<Props> = ({ onHome }) => {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    let cleanup = () => {};
    let cancelled = false;
    import('webgl-fluid').then(({ default: WebGLFluid }) => {
      if (cancelled || !canvas.isConnected) return;
      WebGLFluid(canvas, {
        SIM_RESOLUTION: 128,
        DYE_RESOLUTION: 1024,
        DENSITY_DISSIPATION: 1.2,
        VELOCITY_DISSIPATION: 0.3,
        PRESSURE: 0.8,
        CURL: 28,
        SPLAT_RADIUS: 0.25,
        SPLAT_FORCE: 6500,
        SHADING: true,
        COLORFUL: true,
        COLOR_UPDATE_SPEED: 10,
        BLOOM: true,
        SUNRAYS: true,
        BACK_COLOR: { r: 8, g: 8, b: 11 },
        TRANSPARENT: false,
      });
      cleanup = () => {
        try {
          const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
          (gl as any)?.getExtension('WEBGL_lose_context')?.loseContext();
        } catch {
          /* noop */
        }
      };
    });
    return () => {
      cancelled = true;
      cleanup();
    };
  }, []);

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-black">
      <canvas ref={ref} className="absolute inset-0 h-full w-full" />

      <button
        onClick={onHome}
        className="absolute left-4 top-4 z-10 inline-flex items-center gap-2 rounded-full border border-white/20 bg-black/40 px-4 py-2 text-xs font-semibold text-white/85 backdrop-blur-md transition-colors hover:border-white/40 hover:text-white"
        style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
      >
        <span aria-hidden="true">←</span> Da Lei · 大雷
      </button>

      <div className="pointer-events-none absolute bottom-5 left-1/2 z-10 -translate-x-1/2 text-center" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
        <p className="text-xs uppercase tracking-[0.3em] text-white/70">移动鼠标 / 触摸屏幕</p>
        <p className="mt-1 text-[10px] text-white/35">
          Based on{' '}
          <a href="https://github.com/PavelDoGreat/WebGL-Fluid-Simulation" target="_blank" rel="noreferrer" className="pointer-events-auto underline-offset-2 hover:text-white/60 hover:underline">
            WebGL-Fluid-Simulation
          </a>{' '}
          by Pavel Dobryakov · MIT
        </p>
      </div>
    </div>
  );
};

export default FluidPlayground;
