import React, { useEffect, useRef } from 'react';

/**
 * Subtle, warm-tinted interactive fluid behind the homepage. Wraps Pavel
 * Dobryakov's WebGL-Fluid-Simulation (MIT) via webgl-fluid, then desaturates
 * and warms it with CSS so it reads as a soft moving texture on the cream
 * paper without hurting text contrast. Disabled for reduced-motion.
 */
export const FluidBackground: React.FC = () => {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const canvas = ref.current;
    if (!canvas) return;

    let cleanup = () => {};
    let cancelled = false;
    import('webgl-fluid').then(({ default: WebGLFluid }) => {
      if (cancelled || !canvas.isConnected) return;
      WebGLFluid(canvas, {
        SIM_RESOLUTION: 96,
        DYE_RESOLUTION: 512,
        DENSITY_DISSIPATION: 3.2,
        VELOCITY_DISSIPATION: 2.2,
        PRESSURE: 0.8,
        CURL: 3,
        SPLAT_RADIUS: 0.2,
        SPLAT_FORCE: 5200,
        SHADING: true,
        COLORFUL: true,
        COLOR_UPDATE_SPEED: 6,
        BLOOM: false,
        SUNRAYS: false,
        TRANSPARENT: true,
      });

      // The lib binds pointer handlers to the canvas, but the canvas sits
      // behind the page content (pointer-events:none), so forward global
      // movement to it as synthetic events. Keep the pointer "down" so it
      // paints a trailing wash that follows the cursor.
      let armed = false;
      const press = (x: number, y: number) => {
        canvas.dispatchEvent(new MouseEvent('mousedown', { clientX: x, clientY: y, bubbles: true }));
        armed = true;
      };
      const onMove = (e: PointerEvent) => {
        if (!armed) press(e.clientX, e.clientY);
        canvas.dispatchEvent(new MouseEvent('mousemove', { clientX: e.clientX, clientY: e.clientY, bubbles: true }));
      };
      const onUp = () => {
        armed = false;
      };
      window.addEventListener('pointermove', onMove, { passive: true });
      window.addEventListener('mouseup', onUp);

      cleanup = () => {
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('mouseup', onUp);
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

  return <canvas ref={ref} className="fluid-bg" aria-hidden="true" />;
};
