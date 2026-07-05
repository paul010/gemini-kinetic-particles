import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

/* ---------------------------------------------------------------------------
 * /zhangjiajie — prompt #30 of the 3D prompt workbench, executed.
 * "Pillars of Zhangjiajie — Glide Through the Mist" by petergpt: hundreds of
 * banded sandstone pillars crowned with pines, rivers of drifting mist, and
 * the gentlest possible flight — opening already airborne in the hero
 * corridor. Spec honored: crane-like glide (no stall, soft wall easing),
 * four view presets + auto-tour, altitude-only HUD, compact collapsible UI,
 * instanced everything, DPR ≤ 2, quality selector trimming far detail first.
 * ------------------------------------------------------------------------- */

interface Props { onBack: () => void }

const PILLARS = 230;

const Zhangjiajie: React.FC<Props> = ({ onBack }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [panelOpen, setPanelOpen] = useState(true);
  const [altitude, setAltitude] = useState(0);
  const [tour, setTour] = useState(false);
  const [quality, setQuality] = useState<'high' | 'low'>('high');
  const ctl = useRef({ tour: false, quality: 'high' as 'high' | 'low', preset: -1, reset: false });

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // spec: DPR <= 2
    renderer.setSize(window.innerWidth, window.innerHeight);
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xc5dde1);
    scene.fog = new THREE.Fog(0xc9dfe1, 180, 1500); // thin haze — mist planes carry the atmosphere; panoramas must survive

    const camera = new THREE.PerspectiveCamera(66, window.innerWidth / window.innerHeight, 0.1, 900);

    scene.add(new THREE.HemisphereLight(0xd8ecf2, 0x3c5a44, 0.85));
    const sun = new THREE.DirectionalLight(0xffe3b0, 1.6); // golden morning, raking east faces
    sun.position.set(220, 140, 60);
    scene.add(sun);

    const disposables: (THREE.BufferGeometry | THREE.Material | THREE.Texture)[] = [];
    const track = <T extends THREE.BufferGeometry | THREE.Material | THREE.Texture>(x: T): T => { disposables.push(x); return x; };

    /* ---------- banded sandstone texture (strata + white light scars) ---------- */
    const strataTex = (() => {
      const cv = document.createElement('canvas');
      cv.width = 64; cv.height = 256;
      const g = cv.getContext('2d')!;
      for (let y = 0; y < 256; y += 6 + Math.floor(Math.random() * 10)) {
        const v = 0.5 + Math.random() * 0.3;
        g.fillStyle = `rgb(${Math.round(168 * v + 40)},${Math.round(142 * v + 34)},${Math.round(112 * v + 28)})`;
        g.fillRect(0, y, 64, 16);
      }
      for (let i = 0; i < 26; i++) { // pale scars where light hits
        g.fillStyle = 'rgba(236,226,206,0.5)';
        g.fillRect(Math.random() * 64, Math.random() * 256, 3 + Math.random() * 9, 2 + Math.random() * 5);
      }
      const tx = new THREE.CanvasTexture(cv);
      tx.wrapS = tx.wrapT = THREE.RepeatWrapping;
      return track(tx);
    })();

    /* ---------- the stone forest: instanced pillars + pine crowns + ledge pines ---------- */
    const pillarGeo = track(new THREE.CylinderGeometry(0.62, 1, 1, 9, 1));
    const pillarMat = track(new THREE.MeshLambertMaterial({ map: strataTex }));
    const pillars = new THREE.InstancedMesh(pillarGeo, pillarMat, PILLARS);
    const pineGeo = track(new THREE.ConeGeometry(1, 2.6, 7));
    const pineMat = track(new THREE.MeshLambertMaterial({ color: 0x2e6b3a }));
    const pines = new THREE.InstancedMesh(pineGeo, pineMat, PILLARS * 4);

    interface PillarInfo { x: number; z: number; r: number; h: number }
    const pillarInfos: PillarInfo[] = [];
    {
      const m = new THREE.Matrix4();
      const q = new THREE.Quaternion();
      const col = new THREE.Color();
      let pi = 0, ni = 0;
      const rng = (a: number, b: number) => a + Math.random() * (b - a);
      while (pi < PILLARS) {
        const x = rng(-280, 280), z = rng(-280, 280);
        // carve two crossing flight corridors so canyonscapes form naturally
        if (Math.abs(x) < 18 && Math.abs(z) < 240) continue;
        if (Math.abs(z) < 15 && Math.abs(x) < 240) continue;
        const h = rng(34, 150), r = rng(3.2, 9);
        pillarInfos.push({ x, z, r, h });
        m.compose(new THREE.Vector3(x, h / 2, z), q, new THREE.Vector3(r, h, r));
        pillars.setMatrixAt(pi, m);
        pillars.setColorAt(pi, col.setHSL(0.07, 0.34, rng(0.34, 0.54))); // deep sandstone so pillars read against the pale sky
        // pine crowns on the summit + one on a ledge
        const crowns = 2 + Math.floor(Math.random() * 3);
        for (let c = 0; c < crowns && ni < PILLARS * 4; c++) {
          const pa = Math.random() * Math.PI * 2;
          const pr = Math.random() * r * 0.5;
          const s = rng(1.6, 3.4);
          m.compose(new THREE.Vector3(x + Math.cos(pa) * pr, h + s * 1.1, z + Math.sin(pa) * pr), q, new THREE.Vector3(s, s, s));
          pines.setMatrixAt(ni, m);
          pines.setColorAt(ni, col.setHSL(0.33, 0.45, rng(0.22, 0.34)));
          ni++;
        }
        if (ni < PILLARS * 4) { // gnarled ledge pine on the shaded side
          const la = rng(2.4, 4.2);
          const s = rng(1.2, 2);
          m.compose(new THREE.Vector3(x + Math.cos(la) * r * 0.62, h * rng(0.45, 0.8), z + Math.sin(la) * r * 0.62), q, new THREE.Vector3(s, s, s));
          pines.setMatrixAt(ni, m);
          pines.setColorAt(ni, col.setHSL(0.34, 0.4, 0.26));
          ni++;
        }
        pi++;
      }
      pines.count = ni;
    }
    // instanced meshes cull by the UNIT geometry bounding sphere by default;
    // with instances scattered ±280 the whole batch vanishes off-axis
    pillars.frustumCulled = false;
    pines.frustumCulled = false;
    scene.add(pillars, pines);

    // debug handle for automated verification
    (window as any).__zjj = {
      info: () => ({
        calls: renderer.info.render.calls,
        tris: renderer.info.render.triangles,
        cam: camera.position.toArray().map((v) => Math.round(v as number)),
        pillarCount: pillars.count,
      }),
    };

    /* valley floor far below, mostly hidden by mist */
    const floor = new THREE.Mesh(
      track(new THREE.PlaneGeometry(1200, 1200)),
      track(new THREE.MeshLambertMaterial({ color: 0x35553f }))
    );
    floor.rotation.x = -Math.PI / 2;
    scene.add(floor);

    /* ---------- living mist: layered drifting planes + billboard wisps ---------- */
    const mistTex = (() => {
      const cv = document.createElement('canvas');
      cv.width = 256; cv.height = 256;
      const g = cv.getContext('2d')!;
      for (let i = 0; i < 60; i++) {
        const x = Math.random() * 256, y = Math.random() * 256, r = 30 + Math.random() * 70;
        const gr = g.createRadialGradient(x, y, 0, x, y, r);
        gr.addColorStop(0, 'rgba(255,255,255,0.16)');
        gr.addColorStop(1, 'rgba(255,255,255,0)');
        g.fillStyle = gr;
        g.fillRect(0, 0, 256, 256);
      }
      const tx = new THREE.CanvasTexture(cv);
      tx.wrapS = THREE.RepeatWrapping; tx.wrapT = THREE.RepeatWrapping;
      return track(tx);
    })();
    const mistLayers: THREE.Mesh[] = [];
    for (let i = 0; i < 4; i++) {
      const mat = track(new THREE.MeshBasicMaterial({ map: mistTex, transparent: true, opacity: 0.5 - i * 0.07, depthWrite: false }));
      const layer = new THREE.Mesh(track(new THREE.PlaneGeometry(900, 900)), mat);
      layer.rotation.x = -Math.PI / 2;
      layer.position.y = 8 + i * 9;
      (layer.material as THREE.MeshBasicMaterial).map = mistTex.clone();
      track((layer.material as THREE.MeshBasicMaterial).map!);
      (layer.material as THREE.MeshBasicMaterial).map!.repeat.set(3 + i, 3 + i);
      scene.add(layer);
      mistLayers.push(layer);
    }

    /* ---------- famous human touches, small and far ---------- */
    // glass skywalk bridging two summits near the hero corridor
    const skywalk = new THREE.Mesh(
      track(new THREE.BoxGeometry(30, 0.7, 2.4)),
      track(new THREE.MeshLambertMaterial({ color: 0xd9e8ee, transparent: true, opacity: 0.75 }))
    );
    skywalk.position.set(38, 96, -60);
    scene.add(skywalk);
    // cable car sliding its line
    const cableFrom = new THREE.Vector3(-70, 88, 40), cableTo = new THREE.Vector3(60, 118, 130);
    const cableGeo = track(new THREE.BufferGeometry().setFromPoints([cableFrom, cableTo]));
    scene.add(new THREE.Line(cableGeo, track(new THREE.LineBasicMaterial({ color: 0x333333 }))));
    const cabin = new THREE.Mesh(track(new THREE.BoxGeometry(2.2, 2, 2.2)), track(new THREE.MeshLambertMaterial({ color: 0xc23b2e })));
    scene.add(cabin);
    // waterfall threading from a cleft into the mist
    const fallTex = (() => {
      const cv = document.createElement('canvas');
      cv.width = 32; cv.height = 128;
      const g = cv.getContext('2d')!;
      g.fillStyle = 'rgba(255,255,255,0)'; g.fillRect(0, 0, 32, 128);
      for (let i = 0; i < 20; i++) { g.fillStyle = `rgba(255,255,255,${0.25 + Math.random() * 0.4})`; g.fillRect(Math.random() * 30, 0, 2, 128); }
      const tx = new THREE.CanvasTexture(cv);
      tx.wrapS = tx.wrapT = THREE.RepeatWrapping;
      return track(tx);
    })();
    const fall = new THREE.Mesh(
      track(new THREE.PlaneGeometry(4, 70)),
      track(new THREE.MeshBasicMaterial({ map: fallTex, transparent: true, opacity: 0.8, side: THREE.DoubleSide, depthWrite: false }))
    );
    fall.position.set(-96, 70, -88);
    scene.add(fall);

    /* ---------- cranes crossing the void (simple flapping billboards) ---------- */
    const birdGeo = track(new THREE.BufferGeometry());
    birdGeo.setAttribute('position', new THREE.Float32BufferAttribute([-1.6, 0, 0, 0, 0.28, 0, 0, 0, 0.34, 1.6, 0, 0, 0, 0.28, 0, 0, 0, 0.34], 3));
    const birds = new THREE.InstancedMesh(birdGeo, track(new THREE.MeshBasicMaterial({ color: 0xf5f2ea, side: THREE.DoubleSide })), 10);
    birds.frustumCulled = false;
    scene.add(birds);
    const birdSeeds = Array.from({ length: 10 }, () => ({ a: Math.random() * Math.PI * 2, r: 60 + Math.random() * 140, y: 50 + Math.random() * 80, sp: 0.05 + Math.random() * 0.08, ph: Math.random() * 7 }));

    /* ---------- the glide ---------- */
    // yaw 0 faces -Z (camera default); the forest spans z∈[-280,280], so the
    // hero corridor enters from +Z looking in
    const HERO = { pos: new THREE.Vector3(0, 62, 200), yaw: 0, pitch: -0.04 };
    const flight = { pos: HERO.pos.clone(), yaw: HERO.yaw, pitch: HERO.pitch, roll: 0 };
    const pointer = { x: 0, y: 0 };
    const onPointer = (e: PointerEvent) => {
      pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener('pointermove', onPointer);

    const PRESETS = [
      { pos: new THREE.Vector3(0, 150, 170), yaw: 0, pitch: -0.12 },   // summit-skimming pass
      { pos: new THREE.Vector3(0, 22, 190), yaw: 0, pitch: 0.02 },     // deep-canyon mist run
      { pos: new THREE.Vector3(78, 98, 30), yaw: 0.25, pitch: -0.02 }, // skywalk flyby (aimed at the bridge)
      { pos: new THREE.Vector3(0, 235, 300), yaw: 0, pitch: -0.42 },   // high circling overview
    ];

    // hands-free tour: a slow loop through corridors and around the forest
    const tourCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 60, 210), new THREE.Vector3(0, 40, 60), new THREE.Vector3(30, 70, -40),
      new THREE.Vector3(120, 95, -120), new THREE.Vector3(200, 130, 0), new THREE.Vector3(120, 90, 150),
      new THREE.Vector3(0, 30, 120), new THREE.Vector3(-140, 70, 60), new THREE.Vector3(-200, 120, -80),
      new THREE.Vector3(-80, 90, -180), new THREE.Vector3(0, 130, -220), new THREE.Vector3(60, 80, -60),
    ], true, 'catmullrom', 0.35);
    let tourT = 0;

    let hudTimer = 0;
    const clock = new THREE.Clock();
    let raf = 0;

    const tick = () => {
      raf = requestAnimationFrame(tick);
      const dt = Math.min(clock.getDelta(), 0.05);
      const t = clock.elapsedTime;
      const c = ctl.current;

      if (c.reset) { c.reset = false; flight.pos.copy(HERO.pos); flight.yaw = HERO.yaw; flight.pitch = HERO.pitch; }
      if (c.preset >= 0) {
        const p = PRESETS[c.preset];
        c.preset = -1;
        flight.pos.copy(p.pos); flight.yaw = p.yaw; flight.pitch = p.pitch;
      }

      if (c.tour) {
        tourT = (tourT + dt * 0.008) % 1;
        const p = tourCurve.getPointAt(tourT);
        const ahead = tourCurve.getPointAt((tourT + 0.012) % 1);
        flight.pos.lerp(p, Math.min(1, dt * 3));
        camera.position.copy(flight.pos);
        camera.lookAt(ahead);
        flight.yaw = Math.atan2(-(ahead.x - p.x), -(ahead.z - p.z));
      } else {
        // crane-like glide: constant airspeed, mouse steers within soft limits.
        // Rate-based with a center dead-zone, and the outer screen edge is
        // inert — so clicking the corner UI can't hijack the flight, and
        // preset attitudes hold until you actually steer.
        const dead = (v: number) => (Math.abs(v) < 0.12 || Math.abs(v) > 0.86 ? 0 : v - Math.sign(v) * 0.12);
        const yawRate = -dead(pointer.x) * 1.1;
        flight.yaw += yawRate * dt;
        flight.pitch = THREE.MathUtils.clamp(flight.pitch - dead(pointer.y) * 0.55 * dt, -0.55, 0.55);
        flight.roll = THREE.MathUtils.lerp(flight.roll, yawRate * 0.5, dt * 3); // automatic banking
        const dir = new THREE.Vector3(
          -Math.sin(flight.yaw) * Math.cos(flight.pitch),
          Math.sin(flight.pitch),
          -Math.cos(flight.yaw) * Math.cos(flight.pitch)
        );
        flight.pos.addScaledVector(dir, 15 * dt);
        // no collision punishment: drifting near a pillar eases the camera away
        for (const p of pillarInfos) {
          const dx = flight.pos.x - p.x, dz = flight.pos.z - p.z;
          const d2 = dx * dx + dz * dz;
          const min = p.r + 7;
          if (d2 < min * min && flight.pos.y < p.h + 6) {
            const d = Math.sqrt(d2) || 0.001;
            const push = (min - d) * 2.4 * dt;
            flight.pos.x += (dx / d) * push * 10;
            flight.pos.z += (dz / d) * push * 10;
          }
        }
        // soft world bounds
        const rr = Math.hypot(flight.pos.x, flight.pos.z);
        if (rr > 300) { flight.pos.x *= 1 - dt * 0.5; flight.pos.z *= 1 - dt * 0.5; }
        flight.pos.y = THREE.MathUtils.clamp(flight.pos.y, 8, 250);
        camera.position.copy(flight.pos);
        camera.rotation.set(flight.pitch, flight.yaw, flight.roll, 'YXZ');
      }

      /* drifting mist rivers */
      for (let i = 0; i < mistLayers.length; i++) {
        const mp = (mistLayers[i].material as THREE.MeshBasicMaterial).map!;
        mp.offset.x += dt * 0.004 * (i + 1);
        mp.offset.y += dt * 0.0025 * (i % 2 ? 1 : -1);
        mistLayers[i].visible = c.quality === 'high' || i < 2;
      }
      pillars.count = c.quality === 'high' ? PILLARS : Math.floor(PILLARS * 0.6);
      fallTex.offset.y -= dt * 0.5;

      /* cable car + cranes */
      const ct = (Math.sin(t * 0.08) + 1) / 2;
      cabin.position.lerpVectors(cableFrom, cableTo, ct).y -= 2;
      const bm = new THREE.Matrix4();
      for (let i = 0; i < birdSeeds.length; i++) {
        const b = birdSeeds[i];
        b.a += b.sp * dt;
        const bx = Math.cos(b.a) * b.r, bz = Math.sin(b.a) * b.r;
        const flap = 1 + Math.sin(t * 7 + b.ph) * 0.5;
        bm.compose(
          new THREE.Vector3(bx, b.y + Math.sin(t * 0.5 + b.ph) * 3, bz),
          new THREE.Quaternion().setFromEuler(new THREE.Euler(0, -b.a, 0)),
          new THREE.Vector3(1.6, flap * 1.6, 1.6)
        );
        birds.setMatrixAt(i, bm);
      }
      birds.instanceMatrix.needsUpdate = true;

      hudTimer -= dt;
      if (hudTimer <= 0) { hudTimer = 0.25; setAltitude(Math.round(camera.position.y)); }

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
      window.removeEventListener('pointermove', onPointer);
      scene.traverse((obj) => {
        const mesh = obj as THREE.Mesh;
        if (mesh.geometry) mesh.geometry.dispose();
        const mat = mesh.material as THREE.Material | THREE.Material[] | undefined;
        if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
        else if (mat) mat.dispose();
      });
      disposables.forEach((d) => d.dispose());
      delete (window as any).__zjj;
      renderer.dispose();
      mount.removeChild(renderer.domElement);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const mono: React.CSSProperties = { fontFamily: '"JetBrains Mono", monospace' };
  const PRESET_LABELS = ['掠峰', '峡谷雾道', '天桥飞掠', '高空环视'];

  return (
    <div className="fixed inset-0 overflow-hidden bg-[#bfd9dd]">
      <div ref={mountRef} className="absolute inset-0" />

      <button onClick={onBack} className="absolute left-4 top-4 z-20 inline-flex items-center gap-2 rounded-full border border-black/20 bg-white/55 px-4 py-2 text-xs font-semibold text-black/75 backdrop-blur-md transition-colors hover:border-black/40" style={mono}>
        ← 3D Lab
      </button>

      {/* tiny HUD: altitude only (per spec) */}
      <p className="pointer-events-none absolute bottom-3 left-1/2 z-20 -translate-x-1/2 text-[11px] tabular-nums tracking-[0.2em] text-black/50" style={mono}>
        ALT {altitude} m
      </p>

      <div className="absolute right-4 top-4 z-20 flex flex-col items-end gap-2" style={mono}>
        <button onClick={() => setPanelOpen((v) => !v)} aria-expanded={panelOpen} aria-label="Controls"
          className="grid h-9 w-9 place-items-center rounded-full border border-black/20 bg-white/55 text-black/75 backdrop-blur-md">
          {panelOpen ? '×' : '≡'}
        </button>
        {panelOpen && (
          <div className="flex flex-col gap-2 rounded-2xl border border-black/15 bg-white/60 p-3 backdrop-blur-md">
            <div className="grid grid-cols-2 gap-1.5">
              {PRESET_LABELS.map((l, i) => (
                <button key={l} onClick={() => { ctl.current.preset = i; ctl.current.tour = false; setTour(false); }}
                  className="rounded-full border border-black/20 px-2.5 py-1 text-[11px] text-black/70 transition-colors hover:border-black/50">{l}</button>
              ))}
            </div>
            <div className="flex gap-1.5">
              <button onClick={() => { const n = !ctl.current.tour; ctl.current.tour = n; setTour(n); }}
                className={`flex-1 rounded-full border px-2.5 py-1 text-[11px] transition-colors ${tour ? 'border-emerald-700 bg-emerald-600/20 text-emerald-900' : 'border-black/20 text-black/70 hover:border-black/50'}`}>
                {tour ? '停止巡游' : '自动巡游'}
              </button>
              <button onClick={() => { ctl.current.reset = true; ctl.current.tour = false; setTour(false); }}
                className="rounded-full border border-black/20 px-2.5 py-1 text-[11px] text-black/70 hover:border-black/50">复位</button>
              <button onClick={() => { const n = quality === 'high' ? 'low' : 'high'; setQuality(n); ctl.current.quality = n; }}
                className="rounded-full border border-black/20 px-2.5 py-1 text-[11px] text-black/70 hover:border-black/50">画质:{quality === 'high' ? '高' : '低'}</button>
            </div>
          </div>
        )}
      </div>

      <p className="pointer-events-none absolute bottom-3 left-4 z-20 text-[10px] tracking-wide text-black/40" style={mono}>
        #30 PILLARS OF ZHANGJIAJIE · prompt by petergpt · executed by 大雷 · 鼠标控制滑翔
      </p>
    </div>
  );
};

export default Zhangjiajie;
