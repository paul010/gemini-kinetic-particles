import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

/* ---------------------------------------------------------------------------
 * /fireflies — prompt #56 of the 3D prompt workbench, executed.
 * "The Synchrony — Fireflies of the Smoky Mountains" by petergpt: thousands
 * of instanced lantern glows in a blue-hour Appalachian forest, falling into
 * one shared heartbeat. The synchronization is real Kuramoto dynamics — each
 * firefly's phase clock nudges toward the swarm's mean field, so unison
 * emerges (and travels as waves) rather than being scripted. Spec honored:
 * synchrony + density sliders only, sync-percentage HUD, four presets,
 * orbit/reset, periwinkle sky with apricot horizon, cabin lights and a red
 * lantern trail, creek glint, moths, rebels, DPR ≤ 2, quality selector
 * thinning far fireflies first.
 * ------------------------------------------------------------------------- */

interface Props { onBack: () => void }

const MAX_FLIES = 2600;

const Fireflies: React.FC<Props> = ({ onBack }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [panelOpen, setPanelOpen] = useState(true);
  const [syncPct, setSyncPct] = useState(0);
  const [quality, setQuality] = useState<'high' | 'low'>('high');
  const [ui, setUi] = useState({ sync: 55, density: 80 });
  const ctl = useRef({ K: 1.8, density: 0.8, quality: 'high' as 'high' | 'low', preset: -1, reset: false });
  const set = (k: 'sync' | 'density', v: number) => {
    setUi((u) => ({ ...u, [k]: v }));
    if (k === 'sync') ctl.current.K = (v / 100) * 3.2;
    if (k === 'density') ctl.current.density = v / 100;
  };

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // spec: DPR <= 2
    renderer.setSize(window.innerWidth, window.innerHeight);
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x2a3050, 0.0055); // low mist threading the hollows

    const camera = new THREE.PerspectiveCamera(62, window.innerWidth / window.innerHeight, 0.1, 900);
    const HERO_POS = new THREE.Vector3(70, 26, 120);
    const HERO_TGT = new THREE.Vector3(-10, 14, -20);
    camera.position.copy(HERO_POS);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.copy(HERO_TGT);
    controls.enableDamping = true;
    controls.maxDistance = 320;
    controls.maxPolarAngle = Math.PI * 0.52;

    // never pitch black: the sky carries the brightness budget
    scene.add(new THREE.HemisphereLight(0x8a94c8, 0x1c2418, 0.62));
    const moon = new THREE.DirectionalLight(0xa8b4e8, 0.28);
    moon.position.set(-80, 120, -60);
    scene.add(moon);

    const disposables: (THREE.BufferGeometry | THREE.Material | THREE.Texture)[] = [];
    const track = <T extends THREE.BufferGeometry | THREE.Material | THREE.Texture>(x: T): T => { disposables.push(x); return x; };

    /* ---------- blue-hour sky dome: periwinkle → apricot horizon + stars ---------- */
    const skyTex = (() => {
      const cv = document.createElement('canvas');
      cv.width = 16; cv.height = 256;
      const g = cv.getContext('2d')!;
      const gr = g.createLinearGradient(0, 0, 0, 256);
      gr.addColorStop(0, '#20264a');    // deep periwinkle zenith
      gr.addColorStop(0.55, '#3a4380');
      gr.addColorStop(0.82, '#7a6a9a');
      gr.addColorStop(1, '#d9906a');    // fading apricot horizon
      g.fillStyle = gr; g.fillRect(0, 0, 16, 256);
      return track(new THREE.CanvasTexture(cv));
    })();
    const sky = new THREE.Mesh(
      track(new THREE.SphereGeometry(600, 24, 16)),
      track(new THREE.MeshBasicMaterial({ map: skyTex, side: THREE.BackSide, fog: false }))
    );
    scene.add(sky);
    const starGeo = track(new THREE.BufferGeometry());
    {
      const pts: number[] = [];
      for (let i = 0; i < 320; i++) {
        const a = Math.random() * Math.PI * 2, e = Math.random() * Math.PI * 0.42 + 0.12;
        pts.push(Math.cos(a) * Math.cos(e) * 560, Math.sin(e) * 560, Math.sin(a) * Math.cos(e) * 560);
      }
      starGeo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    }
    const stars = new THREE.Points(starGeo, track(new THREE.PointsMaterial({ color: 0xdfe4ff, size: 1.6, sizeAttenuation: false, transparent: true, opacity: 0.8, fog: false })));
    scene.add(stars);

    /* ---------- the hillside: slope, creek glint, ferns, trunks, canopy ---------- */
    const slopeY = (x: number, z: number) => -z * 0.12 + 3 * Math.sin(x * 0.02) + 2 * Math.cos(z * 0.03);
    const groundGeo = track(new THREE.PlaneGeometry(480, 420, 60, 60));
    groundGeo.rotateX(-Math.PI / 2);
    {
      const pos = groundGeo.attributes.position;
      for (let i = 0; i < pos.count; i++) pos.setY(i, slopeY(pos.getX(i), pos.getZ(i)));
      groundGeo.computeVertexNormals();
    }
    const ground = new THREE.Mesh(groundGeo, track(new THREE.MeshLambertMaterial({ color: 0x18241a })));
    scene.add(ground);

    // a creek glinting where the water stills (pale emissive ribbon down the slope)
    const creek = new THREE.Mesh(
      track(new THREE.PlaneGeometry(7, 300, 1, 24)),
      track(new THREE.MeshBasicMaterial({ color: 0x5a6a9a, transparent: true, opacity: 0.55 }))
    );
    {
      const p = creek.geometry.attributes.position;
      for (let i = 0; i < p.count; i++) {
        const z = p.getY(i); // pre-rotation
        p.setX(i, p.getX(i) + Math.sin(z * 0.03) * 9);
      }
    }
    creek.rotation.x = -Math.PI / 2;
    creek.position.set(24, 0, -30);
    {
      // drape the creek onto the slope
      const p = creek.geometry.attributes.position;
      creek.updateMatrixWorld();
      for (let i = 0; i < p.count; i++) {
        const v = new THREE.Vector3(p.getX(i), p.getY(i), p.getZ(i)).applyMatrix4(creek.matrixWorld);
        p.setZ(i, p.getZ(i) + 0); // keep planar; position the whole ribbon just above ground midline
      }
      creek.position.y = slopeY(24, -30) + 0.15;
      creek.rotation.z = 0.02;
    }
    scene.add(creek);

    // tulip poplars + hemlocks as soft silhouettes
    const trunks = new THREE.InstancedMesh(
      track(new THREE.CylinderGeometry(0.45, 0.75, 1, 6)),
      track(new THREE.MeshLambertMaterial({ color: 0x121a14 })),
      110
    );
    const canopy = new THREE.InstancedMesh(
      track(new THREE.ConeGeometry(4.4, 10, 7)),
      track(new THREE.MeshLambertMaterial({ color: 0x14201a })),
      110
    );
    const ferns = new THREE.InstancedMesh(
      track(new THREE.ConeGeometry(1.5, 1.6, 5)),
      track(new THREE.MeshLambertMaterial({ color: 0x1d3020 })),
      260
    );
    {
      const m = new THREE.Matrix4();
      const q = new THREE.Quaternion();
      const rng = (a: number, b: number) => a + Math.random() * (b - a);
      for (let i = 0; i < 110; i++) {
        const x = rng(-220, 220), z = rng(-190, 150);
        if (Math.abs(x - 24 - Math.sin(z * 0.03) * 9) < 8) continue; // keep the creek clear
        const gy = slopeY(x, z);
        const h = rng(26, 48);
        m.compose(new THREE.Vector3(x, gy + h / 2, z), q, new THREE.Vector3(rng(0.8, 1.6), h, rng(0.8, 1.6)));
        trunks.setMatrixAt(i, m);
        m.compose(new THREE.Vector3(x, gy + h * rng(0.75, 0.95), z), q, new THREE.Vector3(rng(0.9, 1.7), rng(0.9, 1.7), rng(0.9, 1.7)));
        canopy.setMatrixAt(i, m);
      }
      for (let i = 0; i < 260; i++) {
        const x = rng(-200, 200), z = rng(-180, 140);
        const gy = slopeY(x, z);
        m.compose(new THREE.Vector3(x, gy + 0.7, z), q, new THREE.Vector3(rng(0.7, 1.6), rng(0.7, 1.4), rng(0.7, 1.6)));
        ferns.setMatrixAt(i, m);
      }
    }
    trunks.frustumCulled = false; canopy.frustumCulled = false; ferns.frustumCulled = false;
    scene.add(trunks, canopy, ferns);

    /* cabin lights far below + the red lantern trail of quiet watchers */
    const warmTex = (() => {
      const cv = document.createElement('canvas');
      cv.width = 32; cv.height = 32;
      const g = cv.getContext('2d')!;
      const gr = g.createRadialGradient(16, 16, 1, 16, 16, 15);
      gr.addColorStop(0, 'rgba(255,220,150,0.95)');
      gr.addColorStop(0.4, 'rgba(255,180,90,0.4)');
      gr.addColorStop(1, 'rgba(255,180,90,0)');
      g.fillStyle = gr; g.fillRect(0, 0, 32, 32);
      return track(new THREE.CanvasTexture(cv));
    })();
    const cabinMat = track(new THREE.SpriteMaterial({ map: warmTex, transparent: true, depthWrite: false }));
    for (let i = 0; i < 9; i++) {
      const s = new THREE.Sprite(cabinMat);
      const x = -160 + Math.random() * 320, z = 120 + Math.random() * 60;
      s.position.set(x, slopeY(x, z) + 2.5, z);
      s.scale.setScalar(4 + Math.random() * 3);
      scene.add(s);
    }
    const lanternMat = track(new THREE.SpriteMaterial({ map: warmTex, color: 0xff4a3a, transparent: true, depthWrite: false }));
    for (let i = 0; i < 16; i++) {
      const s = new THREE.Sprite(lanternMat);
      const z = 40 + i * 6;
      const x = -60 + Math.sin(i * 0.7) * 20;
      s.position.set(x, slopeY(x, z) + 1.2, z);
      s.scale.setScalar(1.6);
      scene.add(s);
    }

    /* ---------- the living constellation: Kuramoto-synchronized fireflies ---------- */
    const glowTex = (() => {
      const cv = document.createElement('canvas');
      cv.width = 64; cv.height = 64;
      const g = cv.getContext('2d')!;
      const gr = g.createRadialGradient(32, 32, 1, 32, 32, 30);
      gr.addColorStop(0, 'rgba(255,255,235,1)');
      gr.addColorStop(0.25, 'rgba(230,255,150,0.75)');
      gr.addColorStop(1, 'rgba(200,255,120,0)');
      g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
      return track(new THREE.CanvasTexture(cv));
    })();
    const flyGeo = track(new THREE.PlaneGeometry(1, 1));
    const flyMat = track(new THREE.MeshBasicMaterial({
      map: glowTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    }));
    const flies = new THREE.InstancedMesh(flyGeo, flyMat, MAX_FLIES);
    flies.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    flies.frustumCulled = false;
    scene.add(flies);

    interface Fly {
      x: number; y: number; z: number;
      theta: number; omega: number; rebel: boolean;
      wanderPh: number; glow: number; distRank: number;
    }
    const rng = (a: number, b: number) => a + Math.random() * (b - a);
    const fliesData: Fly[] = [];
    for (let i = 0; i < MAX_FLIES; i++) {
      const x = rng(-200, 200), z = rng(-180, 130);
      fliesData.push({
        x, z, y: slopeY(x, z) + rng(0.6, 7.5),
        theta: Math.random() * Math.PI * 2,
        omega: rng(1.9, 2.7),           // natural flash clocks, slightly different
        rebel: Math.random() < 0.035,   // a few out-of-step rebels
        wanderPh: Math.random() * 100,
        glow: 0,
        distRank: Math.hypot(x - 40, z - 60), // used to thin FAR fireflies first
      });
    }
    // quality thins far fireflies before near ones (spec)
    fliesData.sort((a, b) => a.distRank - b.distRank);

    /* moths crossing the lights */
    const mothMat = track(new THREE.SpriteMaterial({ map: glowTex, color: 0xcfc9e8, transparent: true, opacity: 0.5, depthWrite: false }));
    const moths: { s: THREE.Sprite; ph: number }[] = [];
    for (let i = 0; i < 6; i++) {
      const s = new THREE.Sprite(mothMat);
      s.scale.setScalar(1.4);
      scene.add(s);
      moths.push({ s, ph: Math.random() * 40 });
    }

    const PRESETS: { pos: THREE.Vector3; tgt: THREE.Vector3 }[] = [
      { pos: new THREE.Vector3(-40, slopeY(-40, 70) + 2.2, 70), tgt: new THREE.Vector3(-20, 8, -40) },   // trail-level among the lights
      { pos: new THREE.Vector3(38, slopeY(38, 20) + 2.5, 20), tgt: new THREE.Vector3(24, 0, -60) },      // creek reflection view
      { pos: new THREE.Vector3(0, 16, -20), tgt: new THREE.Vector3(10, 90, -120) },                       // canopy-gap view with stars
      { pos: new THREE.Vector3(150, 60, 200), tgt: new THREE.Vector3(-20, 10, -30) },                     // far ridge: the whole blinking hillside
    ];

    const m4 = new THREE.Matrix4();
    const q4 = new THREE.Quaternion();
    const s3 = new THREE.Vector3();
    const col = new THREE.Color();
    let hudTimer = 0;
    const clock = new THREE.Clock();
    let raf = 0;

    const tick = () => {
      raf = requestAnimationFrame(tick);
      const dt = Math.min(clock.getDelta(), 0.05);
      const t = clock.elapsedTime;
      const c = ctl.current;

      if (c.reset) { c.reset = false; camera.position.copy(HERO_POS); controls.target.copy(HERO_TGT); }
      if (c.preset >= 0) { const p = PRESETS[c.preset]; c.preset = -1; camera.position.copy(p.pos); controls.target.copy(p.tgt); }

      const budget = c.quality === 'high' ? 1 : 0.55;
      const visible = Math.floor(MAX_FLIES * c.density * budget);

      /* Kuramoto mean field over the visible swarm */
      let sx = 0, sy = 0;
      for (let i = 0; i < visible; i++) { sx += Math.cos(fliesData[i].theta); sy += Math.sin(fliesData[i].theta); }
      const R = Math.hypot(sx, sy) / Math.max(1, visible);   // order parameter: the HUD's synchrony %
      const psi = Math.atan2(sy, sx);

      q4.copy(camera.quaternion); // billboard all glows toward the camera
      for (let i = 0; i < visible; i++) {
        const f = fliesData[i];
        // phase clock nudged toward the mean field (rebels ignore the field)
        f.theta += (f.omega + (f.rebel ? 0 : c.K * R * Math.sin(psi - f.theta))) * dt;
        // lantern glow blooms and fades, with afterglow rather than hard blink
        const pulse = Math.pow(Math.max(0, Math.sin(f.theta)), 6);
        f.glow = Math.max(pulse, f.glow * (1 - dt * 2.2));
        // gentle wandering paths through ferns and trunks
        f.wanderPh += dt;
        f.x += Math.sin(f.wanderPh * 0.5 + f.distRank) * dt * 1.1;
        f.z += Math.cos(f.wanderPh * 0.42 + f.distRank * 0.7) * dt * 1.1;
        f.y += Math.sin(f.wanderPh * 0.8) * dt * 0.5;
        const gy = slopeY(f.x, f.z);
        f.y = THREE.MathUtils.clamp(f.y, gy + 0.5, gy + 8.5);
        const sc = 0.35 + f.glow * 1.5;
        s3.setScalar(sc);
        m4.compose(new THREE.Vector3(f.x, f.y, f.z), q4, s3);
        flies.setMatrixAt(i, m4);
        // golden-green lantern light with a faint always-on ember
        col.setRGB(0.28 + f.glow * 0.9, 0.32 + f.glow * 1.0, 0.1 + f.glow * 0.35);
        flies.setColorAt(i, col);
      }
      flies.count = visible;
      flies.instanceMatrix.needsUpdate = true;
      if (flies.instanceColor) flies.instanceColor.needsUpdate = true;

      /* moths + twinkle */
      for (const mo of moths) {
        mo.ph += dt;
        mo.s.position.set(Math.sin(mo.ph * 0.23) * 90, 8 + Math.sin(mo.ph * 0.5) * 4 + slopeY(0, 0), Math.cos(mo.ph * 0.19) * 80);
      }
      (stars.material as THREE.PointsMaterial).opacity = 0.65 + Math.sin(t * 0.8) * 0.15;

      hudTimer -= dt;
      if (hudTimer <= 0) { hudTimer = 0.3; setSyncPct(Math.round(R * 100)); }

      controls.update();
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
      scene.traverse((obj) => {
        const mesh = obj as THREE.Mesh;
        if (mesh.geometry) mesh.geometry.dispose();
        const mat = mesh.material as THREE.Material | THREE.Material[] | undefined;
        if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
        else if (mat) mat.dispose();
      });
      disposables.forEach((d) => d.dispose());
      renderer.dispose();
      mount.removeChild(renderer.domElement);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const mono: React.CSSProperties = { fontFamily: '"JetBrains Mono", monospace' };
  const PRESET_LABELS = ['小径灯间', '溪畔倒影', '林隙星空', '远岭全景'];

  return (
    <div className="fixed inset-0 overflow-hidden bg-[#20264a]">
      <div ref={mountRef} className="absolute inset-0" />

      <button onClick={onBack} className="absolute left-4 top-4 z-20 inline-flex items-center gap-2 rounded-full border border-white/25 bg-black/40 px-4 py-2 text-xs font-semibold text-white/90 backdrop-blur-md transition-colors hover:border-white/50" style={mono}>
        ← 3D Lab
      </button>

      {/* tiny HUD: synchrony percentage (per spec) */}
      <p className="pointer-events-none absolute bottom-3 left-1/2 z-20 -translate-x-1/2 text-[11px] tabular-nums tracking-[0.2em] text-white/60" style={mono}>
        SYNC {syncPct}%
      </p>

      <div className="absolute right-4 top-4 z-20 flex flex-col items-end gap-2" style={mono}>
        <button onClick={() => setPanelOpen((v) => !v)} aria-expanded={panelOpen} aria-label="Controls"
          className="grid h-9 w-9 place-items-center rounded-full border border-white/25 bg-black/40 text-white/85 backdrop-blur-md">
          {panelOpen ? '×' : '≡'}
        </button>
        {panelOpen && (
          <div className="flex flex-col gap-2.5 rounded-2xl border border-white/20 bg-black/45 p-3.5 backdrop-blur-md">
            <label className="flex items-center gap-2 text-[11px] text-white/80">
              <span className="w-10 shrink-0">同步度</span>
              <input type="range" min={0} max={100} value={ui.sync} onChange={(e) => set('sync', Number(e.target.value))} className="h-1 w-28 cursor-pointer accent-lime-300" aria-label="同步度" />
            </label>
            <label className="flex items-center gap-2 text-[11px] text-white/80">
              <span className="w-10 shrink-0">密度</span>
              <input type="range" min={15} max={100} value={ui.density} onChange={(e) => set('density', Number(e.target.value))} className="h-1 w-28 cursor-pointer accent-lime-300" aria-label="密度" />
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {PRESET_LABELS.map((l, i) => (
                <button key={l} onClick={() => { ctl.current.preset = i; }}
                  className="rounded-full border border-white/25 px-2.5 py-1 text-[11px] text-white/80 transition-colors hover:border-white/50">{l}</button>
              ))}
            </div>
            <div className="flex gap-1.5">
              <button onClick={() => { ctl.current.reset = true; }}
                className="flex-1 rounded-full border border-white/25 px-2.5 py-1 text-[11px] text-white/80 hover:border-white/50">复位</button>
              <button onClick={() => { const n = quality === 'high' ? 'low' : 'high'; setQuality(n); ctl.current.quality = n; }}
                className="rounded-full border border-white/25 px-2.5 py-1 text-[11px] text-white/80 hover:border-white/50">画质:{quality === 'high' ? '高' : '低'}</button>
            </div>
          </div>
        )}
      </div>

      <p className="pointer-events-none absolute bottom-3 left-4 z-20 text-[10px] tracking-wide text-white/40" style={mono}>
        #56 THE SYNCHRONY · prompt by petergpt · executed by 大雷 · Kuramoto model
      </p>
    </div>
  );
};

export default Fireflies;
