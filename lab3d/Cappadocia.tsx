import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

/* ---------------------------------------------------------------------------
 * /cappadocia — prompt #26 of the 3D prompt workbench, executed.
 * "CAPPADOCIA HOT AIR BALLOONS" by petergpt (3d-prompt-collection): the
 * iconic dawn balloon flight over Turkish fairy chimneys. Spec highlights
 * honored: 80-100 instanced balloons at genuinely varied altitudes, colorful
 * envelopes distinct from brown wicker baskets, intermittent burner flames,
 * a pre-dawn→sunrise→morning time slider, wind direction/speed, balloon
 * count, ride-along basket camera, free orbit with a classic-viewpoint
 * reset, a compact collapsible UI, adaptive performance, DPR clamped ≤ 2.
 * ------------------------------------------------------------------------- */

interface Props { onBack: () => void }

const MAX_BALLOONS = 140;
const WORLD_R = 170;

/* time-of-day key stops: pre-dawn (0) → sunrise (0.5) → morning (1) */
const STOPS = {
  sky: [0x232438, 0xe8956c, 0x9fc7e8].map((c) => new THREE.Color(c)),
  fog: [0x1d1e30, 0xd98a63, 0xbcd8ea].map((c) => new THREE.Color(c)),
  sun: [0xff9a5c, 0xffb36b, 0xfff2d8].map((c) => new THREE.Color(c)),
  hemi: [0.22, 0.5, 0.85],
  sunI: [0.0, 1.5, 1.9],
  elev: [-6, 7, 38], // degrees
};
const lerp3 = (a: number, b: number, c: number, t: number) => (t < 0.5 ? a + (b - a) * (t / 0.5) : b + (c - b) * ((t - 0.5) / 0.5));

const Cappadocia: React.FC<Props> = ({ onBack }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [panelOpen, setPanelOpen] = useState(true);
  const [riding, setRiding] = useState(false);
  // control values live in a ref so the render loop reads them without re-renders
  const ctl = useRef({ time: 0.5, windDir: 40, windSpeed: 1.0, count: 90, riding: false, resetView: false });
  const [ui, setUi] = useState({ time: 50, windDir: 40, windSpeed: 10, count: 90 });
  const set = (k: 'time' | 'windDir' | 'windSpeed' | 'count', v: number) => {
    setUi((u) => ({ ...u, [k]: v }));
    if (k === 'time') ctl.current.time = v / 100;
    if (k === 'windDir') ctl.current.windDir = v;
    if (k === 'windSpeed') ctl.current.windSpeed = v / 10;
    if (k === 'count') ctl.current.count = v;
  };

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // spec: clamp DPR <= 2
    renderer.setSize(window.innerWidth, window.innerHeight);
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0xd98a63, 120, 420);

    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 900);
    const CLASSIC_POS = new THREE.Vector3(70, 38, 118);
    const CLASSIC_TARGET = new THREE.Vector3(0, 28, 0);
    camera.position.copy(CLASSIC_POS);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.copy(CLASSIC_TARGET);
    controls.maxDistance = 380;
    controls.minDistance = 8;
    controls.maxPolarAngle = Math.PI * 0.52;
    controls.enableDamping = true;

    const hemi = new THREE.HemisphereLight(0xcfd8ff, 0x8a6a4a, 0.5);
    scene.add(hemi);
    const sun = new THREE.DirectionalLight(0xffb36b, 1.2);
    scene.add(sun);
    const sunDisc = new THREE.Mesh(
      new THREE.CircleGeometry(22, 32),
      new THREE.MeshBasicMaterial({ color: 0xffd9a0, transparent: true, opacity: 0.95, fog: false })
    );
    scene.add(sunDisc);

    /* ---------- valley terrain (displaced plane, warm sandstone gradient) ---------- */
    const groundGeo = new THREE.PlaneGeometry(760, 760, 110, 110);
    groundGeo.rotateX(-Math.PI / 2);
    {
      const pos = groundGeo.attributes.position;
      const col: number[] = [];
      const c = new THREE.Color();
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i), z = pos.getZ(i);
        const h = 2.4 * Math.sin(x * 0.02) + 2.1 * Math.cos(z * 0.024) + 1.2 * Math.sin((x + z) * 0.011);
        pos.setY(i, h);
        const v = (h + 5.7) / 11;
        c.setHSL(0.055 + v * 0.02, 0.42, 0.34 + v * 0.16); // terracotta → sandstone
        col.push(c.r, c.g, c.b);
      }
      groundGeo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
      groundGeo.computeVertexNormals();
    }
    const ground = new THREE.Mesh(groundGeo, new THREE.MeshLambertMaterial({ vertexColors: true }));
    scene.add(ground);

    /* ---------- fairy chimneys: tapered bodies + darker caps + cave windows ---------- */
    const CHIMNEYS = 150;
    const bodyGeo = new THREE.CylinderGeometry(0.45, 1, 1, 9);
    const capGeo = new THREE.ConeGeometry(0.75, 0.34, 9);
    const bodyMesh = new THREE.InstancedMesh(bodyGeo, new THREE.MeshLambertMaterial(), CHIMNEYS);
    const capMesh = new THREE.InstancedMesh(capGeo, new THREE.MeshLambertMaterial(), CHIMNEYS);
    const winGeo = new THREE.BoxGeometry(0.9, 1.2, 0.5);
    const winMesh = new THREE.InstancedMesh(winGeo, new THREE.MeshLambertMaterial({ color: 0x241a12 }), 130);
    {
      const m = new THREE.Matrix4();
      const q = new THREE.Quaternion();
      const col = new THREE.Color();
      let wi = 0;
      const rng = (a: number, b: number) => a + Math.random() * (b - a);
      for (let i = 0; i < CHIMNEYS; i++) {
        const a = Math.random() * Math.PI * 2;
        const r = 24 + Math.pow(Math.random(), 0.65) * 190;
        const x = Math.cos(a) * r, z = Math.sin(a) * r;
        const h = rng(7, 26), rad = rng(1.8, 4.2);
        const gy = 2.4 * Math.sin(x * 0.02) + 2.1 * Math.cos(z * 0.024) + 1.2 * Math.sin((x + z) * 0.011);
        m.compose(new THREE.Vector3(x, gy + h / 2 - 0.5, z), q, new THREE.Vector3(rad, h, rad));
        bodyMesh.setMatrixAt(i, m);
        const v = Math.random();
        bodyMesh.setColorAt(i, col.setHSL(0.06 + v * 0.025, 0.4, 0.46 + v * 0.14));
        m.compose(new THREE.Vector3(x, gy + h - 0.4 + (0.34 * rad * 1.5) / 2, z), q, new THREE.Vector3(rad * 1.5, rad * 1.5, rad * 1.5));
        capMesh.setMatrixAt(i, m);
        capMesh.setColorAt(i, col.setHSL(0.05, 0.28, 0.3 + Math.random() * 0.08));
        // carved cave windows on some flanks
        if (wi < 130 && Math.random() < 0.55) {
          const openings = 1 + Math.floor(Math.random() * 2);
          for (let o = 0; o < openings && wi < 130; o++) {
            const wa = Math.random() * Math.PI * 2;
            const wh = rng(0.25, 0.7) * h;
            const wr = rad * (1 - (wh / h) * 0.5) * 0.92;
            const wq = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, -wa, 0));
            m.compose(new THREE.Vector3(x + Math.cos(wa) * wr, gy + wh, z + Math.sin(wa) * wr), wq, new THREE.Vector3(rng(0.7, 1.2), rng(0.8, 1.4), 1));
            winMesh.setMatrixAt(wi++, m);
          }
        }
      }
      winMesh.count = wi;
    }
    scene.add(bodyMesh, capMesh, winMesh);

    /* ---------- balloons: lathe envelopes (plain + striped), wicker baskets,
     * skirts, intermittent burner flames — all instanced ---------- */
    const profile: THREE.Vector2[] = [];
    for (let i = 0; i <= 20; i++) {
      const v = i / 20;
      // classic envelope: bulbous top, tapering to the throat
      const rr = Math.sin(v * Math.PI * 0.62 + 0.34) * (1 - v * 0.16);
      profile.push(new THREE.Vector2(Math.max(0.06, rr) * 3.4, v * 4.6));
    }
    const envGeo = new THREE.LatheGeometry(profile, 18); // base at y=0: throat meets the skirt top

    const stripeTex = (() => {
      const cv = document.createElement('canvas');
      cv.width = 64; cv.height = 64;
      const g = cv.getContext('2d')!;
      g.fillStyle = '#ffffff'; g.fillRect(0, 0, 64, 64);
      g.fillStyle = 'rgba(35,25,20,0.82)';
      for (let s = 0; s < 4; s++) g.fillRect(s * 16, 0, 8, 64);
      const tx = new THREE.CanvasTexture(cv);
      tx.wrapS = tx.wrapT = THREE.RepeatWrapping;
      return tx;
    })();
    const envPlain = new THREE.InstancedMesh(envGeo, new THREE.MeshLambertMaterial(), MAX_BALLOONS);
    const envStriped = new THREE.InstancedMesh(envGeo, new THREE.MeshLambertMaterial({ map: stripeTex }), MAX_BALLOONS);
    const basketGeo = new THREE.BoxGeometry(1.05, 0.85, 1.05);
    const baskets = new THREE.InstancedMesh(basketGeo, new THREE.MeshLambertMaterial(), MAX_BALLOONS);
    const skirtGeo = new THREE.CylinderGeometry(0.72, 0.34, 1.5, 8, 1, true);
    const skirts = new THREE.InstancedMesh(skirtGeo, new THREE.MeshLambertMaterial({ color: 0x4a3524, side: THREE.DoubleSide }), MAX_BALLOONS);
    const flameGeo = new THREE.ConeGeometry(0.3, 1.1, 7);
    const flames = new THREE.InstancedMesh(
      flameGeo,
      new THREE.MeshBasicMaterial({ color: 0xffa93d, transparent: true, opacity: 0.92, blending: THREE.AdditiveBlending, fog: false }),
      MAX_BALLOONS
    );
    envPlain.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    envStriped.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    baskets.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    skirts.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    flames.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    scene.add(envPlain, envStriped, baskets, skirts, flames);

    interface Balloon {
      x: number; y: number; z: number;
      rise: number; scale: number; striped: boolean;
      phase: number; flick: number;
    }
    const palette = [0xd9463e, 0xe8933c, 0xead15b, 0x4f9d69, 0x3f7fb5, 0x8a5cab, 0xd96a9b, 0xe0e3e8, 0x2f4f7a, 0xc9a34a];
    const balloons: Balloon[] = [];
    const rng = (a: number, b: number) => a + Math.random() * (b - a);
    for (let i = 0; i < MAX_BALLOONS; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = Math.pow(Math.random(), 0.6) * WORLD_R;
      balloons.push({
        x: Math.cos(a) * r, z: Math.sin(a) * r,
        y: rng(6, 118), // genuinely varied: some just lifted, some very high
        rise: rng(0.25, 1.15),
        scale: rng(0.85, 1.35),
        striped: Math.random() < 0.45,
        phase: Math.random() * Math.PI * 2,
        flick: rng(0.35, 0.9),
      });
      baskets.setColorAt(i, new THREE.Color().setHSL(0.075, 0.45, rng(0.26, 0.34))); // wicker brown, distinct from every envelope
    }
    // per-balloon envelope colors; written per-frame at the compacted index,
    // because plain/striped instances are re-packed as the count slider moves
    const envColors = balloons.map((_, i) => {
      const c = new THREE.Color(palette[i % palette.length]);
      c.offsetHSL(rng(-0.02, 0.02), 0, rng(-0.06, 0.06));
      return c;
    });

    /* ---------- adaptive performance (silent, per spec) ---------- */
    let perfCap = MAX_BALLOONS;
    let fpsAcc = 0, fpsN = 0, fpsT = 0;

    /* ---------- loop ---------- */
    const m4 = new THREE.Matrix4();
    const q0 = new THREE.Quaternion();
    const clock = new THREE.Clock();
    let raf = 0;
    const rideOffset = new THREE.Vector3();

    const tick = () => {
      raf = requestAnimationFrame(tick);
      const dt = Math.min(clock.getDelta(), 0.05);
      const t = clock.elapsedTime;
      const c = ctl.current;

      // adaptive count: if we dip under the 55fps target, quietly trim balloons
      fpsAcc += dt; fpsN += 1; fpsT += dt;
      if (fpsT > 2.5) {
        const fps = fpsN / fpsAcc;
        if (fps < 55 && perfCap > 40) perfCap = Math.max(40, Math.floor(perfCap * 0.85));
        fpsAcc = 0; fpsN = 0; fpsT = 0;
      }
      const visible = Math.min(c.count, perfCap);

      /* time of day */
      const tt = c.time;
      scene.background = STOPS.sky[0].clone().lerp(STOPS.sky[1], Math.min(1, tt / 0.5)).lerp(STOPS.sky[2], Math.max(0, (tt - 0.5) / 0.5));
      (scene.fog as THREE.Fog).color.copy(STOPS.fog[0].clone().lerp(STOPS.fog[1], Math.min(1, tt / 0.5)).lerp(STOPS.fog[2], Math.max(0, (tt - 0.5) / 0.5)));
      const elev = THREE.MathUtils.degToRad(lerp3(STOPS.elev[0], STOPS.elev[1], STOPS.elev[2], tt));
      const sunDir = new THREE.Vector3(Math.cos(elev) * 0.9, Math.sin(elev), -Math.cos(elev) * 0.44).normalize();
      sun.position.copy(sunDir.clone().multiplyScalar(300));
      sun.intensity = lerp3(STOPS.sunI[0], STOPS.sunI[1], STOPS.sunI[2], tt);
      sun.color.copy(STOPS.sun[0].clone().lerp(STOPS.sun[1], Math.min(1, tt / 0.5)).lerp(STOPS.sun[2], Math.max(0, (tt - 0.5) / 0.5)));
      hemi.intensity = lerp3(STOPS.hemi[0], STOPS.hemi[1], STOPS.hemi[2], tt);
      sunDisc.position.copy(sunDir.clone().multiplyScalar(620));
      sunDisc.lookAt(camera.position);
      (sunDisc.material as THREE.MeshBasicMaterial).opacity = THREE.MathUtils.clamp((elev + 0.06) * 6, 0, 0.95);

      /* wind */
      const wa = THREE.MathUtils.degToRad(c.windDir);
      const wx = Math.cos(wa) * c.windSpeed, wz = Math.sin(wa) * c.windSpeed;

      /* balloons */
      let pi = 0, si = 0;
      for (let i = 0; i < visible; i++) {
        const b = balloons[i];
        b.y += b.rise * dt;
        b.x += wx * dt * (2.2 + b.y * 0.012);
        b.z += wz * dt * (2.2 + b.y * 0.012);
        if (b.y > 125) b.y = rng(4, 9); // relaunch low: "some just lifted off"
        const rr = Math.hypot(b.x, b.z);
        if (rr > WORLD_R + 40) { b.x = -b.x * 0.96; b.z = -b.z * 0.96; }
        const sway = Math.sin(t * 0.6 + b.phase) * 0.04;
        const s = b.scale;
        const bob = Math.sin(t * 0.9 + b.phase) * 0.3;
        const y = b.y + bob;
        // envelope
        m4.compose(new THREE.Vector3(b.x, y + 2.6 * s, b.z), q0.setFromEuler(new THREE.Euler(sway, b.phase, sway * 0.7)), new THREE.Vector3(s, s, s));
        if (b.striped) { envStriped.setMatrixAt(si, m4); envStriped.setColorAt(si, envColors[i]); }
        else { envPlain.setMatrixAt(pi, m4); envPlain.setColorAt(pi, envColors[i]); }
        // skirt + basket + flame hang below the envelope throat
        m4.compose(new THREE.Vector3(b.x, y + 1.9 * s, b.z), q0, new THREE.Vector3(s, s, s));
        skirts.setMatrixAt(i, m4);
        m4.compose(new THREE.Vector3(b.x, y + 0.9 * s, b.z), q0, new THREE.Vector3(s, s, s));
        baskets.setMatrixAt(i, m4);
        // intermittent burner: bursts of flame with a glow-orange cone
        const burning = Math.sin(t * b.flick * 3 + b.phase * 7) > 0.62;
        const fl = burning ? 0.7 + Math.random() * 0.5 : 0.001;
        m4.compose(new THREE.Vector3(b.x, y + 1.55 * s, b.z), q0, new THREE.Vector3(fl * s, fl * s, fl * s));
        flames.setMatrixAt(i, m4);
        if (b.striped) si++; else pi++;
      }
      envPlain.count = pi;
      envStriped.count = si;
      baskets.count = visible;
      skirts.count = visible;
      flames.count = visible;
      envPlain.instanceMatrix.needsUpdate = true;
      envStriped.instanceMatrix.needsUpdate = true;
      baskets.instanceMatrix.needsUpdate = true;
      skirts.instanceMatrix.needsUpdate = true;
      flames.instanceMatrix.needsUpdate = true;
      if (envPlain.instanceColor) envPlain.instanceColor.needsUpdate = true;
      if (envStriped.instanceColor) envStriped.instanceColor.needsUpdate = true;

      /* cameras */
      if (c.resetView) {
        c.resetView = false;
        c.riding = false;
        setRiding(false);
        camera.position.copy(CLASSIC_POS);
        controls.target.copy(CLASSIC_TARGET);
      }
      if (c.riding) {
        const b = balloons[0];
        const y = b.y + Math.sin(t * 0.9 + b.phase) * 0.3;
        // lean over the basket rim: camera sits just outside the skirt cone,
        // below the envelope, slowly panning across the valley
        const la = t * 0.08;
        rideOffset.set(Math.cos(la) * 1.7, 0, Math.sin(la) * 1.7);
        camera.position.set(b.x + rideOffset.x, y + 1.9 * b.scale, b.z + rideOffset.z);
        camera.lookAt(b.x + Math.cos(la) * 70, y - 6, b.z + Math.sin(la) * 70);
        controls.enabled = false;
      } else {
        controls.enabled = true;
        controls.update();
      }

      renderer.render(scene, camera);
    };
    tick();

    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      controls.dispose();
      // free GPU resources on route teardown — repeated SPA visits must not
      // accumulate geometries/materials/textures (Codex review, PR #62)
      scene.traverse((obj) => {
        const mesh = obj as THREE.Mesh;
        if (mesh.geometry) mesh.geometry.dispose();
        const mat = mesh.material as THREE.Material | THREE.Material[] | undefined;
        if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
        else if (mat) mat.dispose();
      });
      stripeTex.dispose();
      renderer.dispose();
      mount.removeChild(renderer.domElement);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const mono: React.CSSProperties = { fontFamily: '"JetBrains Mono", monospace' };
  const slider = (label: string, k: 'time' | 'windDir' | 'windSpeed' | 'count', min: number, max: number, val: number) => (
    <label className="flex items-center gap-2 text-[11px] text-white/80">
      <span className="w-8 shrink-0">{label}</span>
      <input
        type="range" min={min} max={max} value={val}
        onChange={(e) => set(k, Number(e.target.value))}
        className="h-1 w-28 cursor-pointer accent-amber-400"
        aria-label={label}
      />
    </label>
  );

  return (
    <div className="fixed inset-0 overflow-hidden bg-[#232438]">
      <div ref={mountRef} className="absolute inset-0" />

      {/* back */}
      <button
        onClick={onBack}
        className="absolute left-4 top-4 z-20 inline-flex items-center gap-2 rounded-full border border-white/25 bg-black/40 px-4 py-2 text-xs font-semibold text-white/90 backdrop-blur-md transition-colors hover:border-white/50"
        style={mono}
      >
        ← 3D Lab
      </button>

      {/* compact collapsible control panel (per spec: minimal, no help text) */}
      <div className="absolute right-4 top-4 z-20 flex flex-col items-end gap-2" style={mono}>
        <button
          onClick={() => setPanelOpen((v) => !v)}
          aria-expanded={panelOpen}
          aria-label="Controls"
          className="grid h-9 w-9 place-items-center rounded-full border border-white/25 bg-black/40 text-white/85 backdrop-blur-md"
        >
          {panelOpen ? '×' : '≡'}
        </button>
        {panelOpen && (
          <div className="flex flex-col gap-2.5 rounded-2xl border border-white/20 bg-black/45 p-3.5 backdrop-blur-md">
            {slider('时间', 'time', 0, 100, ui.time)}
            {slider('风向', 'windDir', 0, 359, ui.windDir)}
            {slider('风速', 'windSpeed', 0, 30, ui.windSpeed)}
            {slider('气球', 'count', 20, MAX_BALLOONS, ui.count)}
            <div className="flex gap-2 pt-0.5">
              <button
                onClick={() => { const next = !ctl.current.riding; ctl.current.riding = next; setRiding(next); }}
                className={`rounded-full border px-3 py-1 text-[11px] transition-colors ${riding ? 'border-amber-300 bg-amber-400/25 text-amber-200' : 'border-white/25 text-white/80 hover:border-white/50'}`}
              >
                {riding ? '退出乘篮' : '乘篮视角'}
              </button>
              <button
                onClick={() => { ctl.current.resetView = true; }}
                className="rounded-full border border-white/25 px-3 py-1 text-[11px] text-white/80 transition-colors hover:border-white/50"
              >
                经典机位
              </button>
            </div>
          </div>
        )}
      </div>

      {/* provenance stamp */}
      <p className="pointer-events-none absolute bottom-3 left-4 z-20 text-[10px] tracking-wide text-white/45" style={mono}>
        #26 CAPPADOCIA HOT AIR BALLOONS · prompt by petergpt · executed by 大雷
      </p>
    </div>
  );
};

export default Cappadocia;
