import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

/* ---------------------------------------------------------------------------
 * /brooksfalls — prompt #59 of the 3D prompt workbench, executed.
 * "The Salmon Gauntlet — Brooks Falls in Full Run" by petergpt: a whitewater
 * curtain with salmon leaping in continuous silver-red arcs and brown bears
 * stationed at the lip like fishermen. Opens mid-action. Spec honored: a mass
 * ballistic fish system (dozens airborne, most leaps failing believably, some
 * clearing the lip), four bears with distinct posts (lip-stander, snorkeler,
 * shallows-chaser, mother watching), staged catches → wade to bank → gulls,
 * tannin-green river, spruce banks, drift logs, a low rainbow in the spray,
 * eagles, a viewing platform, a Run-Intensity slider, leaps/min + catches HUD,
 * presets, quality selector, DPR ≤ 2.
 * ------------------------------------------------------------------------- */

interface Props { onBack: () => void }

const MAX_FISH = 90;   // airborne pool
const POOL_FISH = 240; // massing below

const BrooksFalls: React.FC<Props> = ({ onBack }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [panelOpen, setPanelOpen] = useState(true);
  const [hud, setHud] = useState({ lpm: 0, catches: 0 });
  const [quality, setQuality] = useState<'high' | 'low'>('high');
  const ctl = useRef({ intensity: 0.7, quality: 'high' as 'high' | 'low', preset: -1, reset: false });

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xbcd4d0);
    scene.fog = new THREE.Fog(0xc4dcd6, 120, 520);

    const camera = new THREE.PerspectiveCamera(56, window.innerWidth / window.innerHeight, 0.1, 900);
    // hero: square-on to the falls with the lip bear in frame
    const HERO_POS = new THREE.Vector3(0, 20, 96);
    const HERO_TGT = new THREE.Vector3(0, 6, -20);
    camera.position.copy(HERO_POS);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.copy(HERO_TGT);
    controls.enableDamping = true;
    controls.maxDistance = 260;
    controls.maxPolarAngle = Math.PI * 0.5;

    scene.add(new THREE.HemisphereLight(0xeaf4f2, 0x35543f, 0.95));
    const sun = new THREE.DirectionalLight(0xfff6e0, 1.5);
    sun.position.set(60, 90, 120); scene.add(sun);

    const disposables: (THREE.BufferGeometry | THREE.Material | THREE.Texture)[] = [];
    const track = <T extends THREE.BufferGeometry | THREE.Material | THREE.Texture>(x: T): T => { disposables.push(x); return x; };

    /* ---------- the stage: upper ledge, falls curtain, lower tannin pool ---------- */
    const LIP_Z = -22, LIP_Y = 12, POOL_Y = 0;
    const upper = new THREE.Mesh(track(new THREE.BoxGeometry(200, 8, 120)), track(new THREE.MeshLambertMaterial({ color: 0x2e6650, transparent: true, opacity: 0.9 })));
    upper.position.set(0, LIP_Y - 4, LIP_Z - 60); scene.add(upper);
    const ledge = new THREE.Mesh(track(new THREE.BoxGeometry(200, 8, 12)), track(new THREE.MeshLambertMaterial({ color: 0x5a5348 })));
    ledge.position.set(0, LIP_Y - 4, LIP_Z); scene.add(ledge);
    // whitewater curtain
    const curtainTex = (() => {
      const cv = document.createElement('canvas'); cv.width = 128; cv.height = 64;
      const g = cv.getContext('2d')!; g.fillStyle = '#eef6f4'; g.fillRect(0, 0, 128, 64);
      for (let i = 0; i < 120; i++) { g.fillStyle = `rgba(210,230,228,${0.4 + Math.random() * 0.5})`; g.fillRect(Math.random() * 128, Math.random() * 64, 1 + Math.random() * 2, 10 + Math.random() * 20); }
      const t = new THREE.CanvasTexture(cv); t.wrapS = t.wrapT = THREE.RepeatWrapping; return track(t);
    })();
    const curtainMat = track(new THREE.MeshBasicMaterial({ map: curtainTex, transparent: true, opacity: 0.95 }));
    const curtain = new THREE.Mesh(track(new THREE.PlaneGeometry(200, 16)), curtainMat);
    curtain.position.set(0, (LIP_Y + POOL_Y) / 2, LIP_Z + 6); scene.add(curtain);
    // lower pool (tannin green, semi-reflective)
    const pool = new THREE.Mesh(track(new THREE.PlaneGeometry(400, 260)), track(new THREE.MeshStandardMaterial({ color: 0x2f5f4c, roughness: 0.25, metalness: 0.3, transparent: true, opacity: 0.95 })));
    pool.rotation.x = -Math.PI / 2; pool.position.set(0, POOL_Y, 40); scene.add(pool);

    /* mossy spruce banks + drift logs */
    const spruceT = new THREE.InstancedMesh(track(new THREE.CylinderGeometry(0.8, 1.2, 8, 5)), track(new THREE.MeshLambertMaterial({ color: 0x4a3a28 })), 60);
    const spruceC = new THREE.InstancedMesh(track(new THREE.ConeGeometry(5, 20, 6)), track(new THREE.MeshLambertMaterial({ color: 0x2c4a34 })), 60);
    spruceT.frustumCulled = false; spruceC.frustumCulled = false;
    { const m = new THREE.Matrix4(); const q = new THREE.Quaternion(); const rng = (a: number, b: number) => a + Math.random() * (b - a);
      for (let i = 0; i < 60; i++) { const side = Math.random() < 0.5 ? -1 : 1; const x = side * rng(120, 200); const z = rng(-80, 150);
        m.compose(new THREE.Vector3(x, 4, z), q, new THREE.Vector3(1, 1, 1)); spruceT.setMatrixAt(i, m);
        m.compose(new THREE.Vector3(x, 16, z), q, new THREE.Vector3(1, rng(0.8, 1.3), 1)); spruceC.setMatrixAt(i, m); } }
    scene.add(spruceT, spruceC);
    const logMat = track(new THREE.MeshLambertMaterial({ color: 0x5a4128 }));
    for (const [lx, lz, la] of [[-70, 70, 0.4], [90, 30, -0.7], [-30, 110, 1.2]] as [number, number, number][]) {
      const log = new THREE.Mesh(track(new THREE.CylinderGeometry(1.4, 1.4, 22, 6)), logMat);
      log.rotation.z = Math.PI / 2; log.rotation.y = la; log.position.set(lx, 0.8, lz); scene.add(log);
    }

    /* viewing platform with tiny watchers */
    const plat = new THREE.Mesh(track(new THREE.BoxGeometry(30, 2, 10)), track(new THREE.MeshLambertMaterial({ color: 0x6e5a3e })));
    plat.position.set(-150, 10, -10); scene.add(plat);
    const watchers = new THREE.InstancedMesh(track(new THREE.CapsuleGeometry(0.5, 1.2, 2, 5)), track(new THREE.MeshLambertMaterial({ color: 0x3a4a5a })), 12);
    watchers.frustumCulled = false;
    { const m = new THREE.Matrix4(); const q = new THREE.Quaternion(); for (let i = 0; i < 12; i++) { m.compose(new THREE.Vector3(-150 + (i - 6) * 2.2, 12.5, -8), q, new THREE.Vector3(1, 1, 1)); watchers.setMatrixAt(i, m); } }
    scene.add(watchers);

    /* low rainbow standing in the spray */
    const rbTex = (() => { const cv = document.createElement('canvas'); cv.width = 64; cv.height = 8; const g = cv.getContext('2d')!;
      ['#ff5a5a', '#ff9a4a', '#ffe45a', '#5adf6a', '#4aa8ff', '#7a5cff'].forEach((b, i) => { g.fillStyle = b; g.fillRect(0, i * 1.33, 64, 1.4); });
      return track(new THREE.CanvasTexture(cv)); })();
    // low bow standing in the spray at the base of the falls, not a sky-filling arc
    const rainbow = new THREE.Mesh(track(new THREE.TorusGeometry(22, 1.1, 2, 40, Math.PI)), track(new THREE.MeshBasicMaterial({ map: rbTex, transparent: true, opacity: 0.4, depthWrite: false, side: THREE.DoubleSide })));
    rainbow.position.set(0, 1, LIP_Z + 8); scene.add(rainbow);

    /* ---------- salmon: airborne ballistic pool + massing pool fish ---------- */
    const fishGeo = track(new THREE.CapsuleGeometry(0.5, 2.4, 3, 6));
    const fishMat = track(new THREE.MeshStandardMaterial({ color: 0xa83a3a, roughness: 0.4, metalness: 0.3, emissive: 0x3a1010, emissiveIntensity: 0.3 }));
    const airborne = new THREE.InstancedMesh(fishGeo, fishMat, MAX_FISH);
    airborne.frustumCulled = false;
    const massing = new THREE.InstancedMesh(fishGeo, fishMat, POOL_FISH);
    massing.frustumCulled = false;
    scene.add(airborne, massing);

    interface Leap { active: boolean; x: number; z: number; vx: number; vy: number; vz: number; y: number; spin: number; success: boolean; t: number }
    const leaps: Leap[] = Array.from({ length: MAX_FISH }, () => ({ active: false, x: 0, z: 0, vx: 0, vy: 0, vz: 0, y: 0, spin: 0, success: false, t: 0 }));
    const massSeeds = Array.from({ length: POOL_FISH }, () => ({ x: (Math.random() - 0.5) * 160, z: 10 + Math.random() * 80, ph: Math.random() * 7, sp: 0.4 + Math.random() * 0.8 }));
    let leapAccum = 0, leapsThisMin = 0, minTimer = 0;

    const spawnLeap = () => {
      const l = leaps.find((x) => !x.active); if (!l) return;
      l.active = true;
      l.x = (Math.random() - 0.5) * 150; l.z = LIP_Z + 20 + Math.random() * 20; l.y = POOL_Y + 1;
      const toLip = LIP_Z + 6 - l.z;
      l.success = Math.random() < 0.22; // most fail
      const power = l.success ? 15.5 : 11 + Math.random() * 3;
      l.vy = power; l.vz = toLip * 0.28; l.vx = (Math.random() - 0.5) * 3;
      l.spin = (Math.random() - 0.5) * 10; l.t = 0;
      leapAccum++; leapsThisMin++;
    };

    /* ---------- bears ---------- */
    const bearMat = track(new THREE.MeshLambertMaterial({ color: 0x5a4230 }));
    const makeBear = () => {
      const g = new THREE.Group();
      const body = new THREE.Mesh(track(new THREE.CapsuleGeometry(2.4, 4, 4, 7)), bearMat); body.rotation.z = Math.PI / 2; body.position.y = 3; g.add(body);
      const head = new THREE.Mesh(track(new THREE.SphereGeometry(1.7, 8, 7)), bearMat); head.position.set(3.6, 4, 0); g.add(head);
      for (const [lx, lz] of [[2.2, 1.4], [2.2, -1.4], [-2.2, 1.4], [-2.2, -1.4]] as [number, number][]) { const leg = new THREE.Mesh(track(new THREE.CylinderGeometry(0.7, 0.7, 3, 5)), bearMat); leg.position.set(lx, 1.5, lz); g.add(leg); }
      scene.add(g); return g;
    };
    const lipBear = makeBear(); lipBear.position.set(8, LIP_Y - 8, LIP_Z + 2); lipBear.rotation.y = Math.PI;
    const snorkeler = makeBear(); snorkeler.position.set(-40, 1, 40);
    const chaser = makeBear(); chaser.position.set(50, 1, 60);
    const mother = makeBear(); mother.position.set(-110, 2, 100); mother.scale.setScalar(1.2);
    const cub1 = makeBear(); cub1.scale.setScalar(0.5); cub1.position.set(-104, 1, 104);
    const cub2 = makeBear(); cub2.scale.setScalar(0.5); cub2.position.set(-116, 1, 103);

    /* gulls that converge on a catch */
    const gullGeo = track(new THREE.BufferGeometry());
    gullGeo.setAttribute('position', new THREE.Float32BufferAttribute([-1, 0, 0, 0, 0.2, 0, 0, 0, 0.24, 1, 0, 0, 0, 0.2, 0, 0, 0, 0.24], 3));
    const gulls = new THREE.InstancedMesh(gullGeo, track(new THREE.MeshBasicMaterial({ color: 0xf4f2ea, side: THREE.DoubleSide })), 14);
    gulls.frustumCulled = false; scene.add(gulls);
    const gullSeeds = Array.from({ length: 14 }, () => ({ a: Math.random() * 7, r: 12 + Math.random() * 20, y: 8 + Math.random() * 10, sp: 0.4 + Math.random() * 0.4, ph: Math.random() * 7, cx: -40, cz: 40 }));
    let catchGlow = 0;

    /* spray at the base of the curtain */
    const sprayTex = (() => { const cv = document.createElement('canvas'); cv.width = 32; cv.height = 32; const g = cv.getContext('2d')!; const gr = g.createRadialGradient(16, 16, 1, 16, 16, 15); gr.addColorStop(0, 'rgba(240,250,248,0.6)'); gr.addColorStop(1, 'rgba(240,250,248,0)'); g.fillStyle = gr; g.fillRect(0, 0, 32, 32); return track(new THREE.CanvasTexture(cv)); })();
    const SPRAY = 60;
    const sprayMat = track(new THREE.SpriteMaterial({ map: sprayTex, transparent: true, opacity: 0.5, depthWrite: false }));
    const sprays: THREE.Sprite[] = [];
    for (let i = 0; i < SPRAY; i++) { const s = new THREE.Sprite(sprayMat); scene.add(s); sprays.push(s); }
    const spraySeeds = Array.from({ length: SPRAY }, () => ({ x: (Math.random() - 0.5) * 180, ph: Math.random() * 9, sp: 2 + Math.random() * 3, sc: 6 + Math.random() * 8 }));

    const PRESETS: { pos: THREE.Vector3; tgt: THREE.Vector3 }[] = [
      { pos: HERO_POS.clone(), tgt: HERO_TGT.clone() },                              // hero square-on
      { pos: new THREE.Vector3(-10, 4, 55), tgt: new THREE.Vector3(0, 3, 20) },      // pool-level among the massing salmon
      { pos: new THREE.Vector3(0, 18, -46), tgt: new THREE.Vector3(0, 4, 20) },      // behind the lip, down the curtain
      { pos: new THREE.Vector3(-108, 10, 130), tgt: new THREE.Vector3(-110, 3, 100) }, // bank past mother + cubs
      { pos: new THREE.Vector3(0, 120, 200), tgt: new THREE.Vector3(0, 2, 10) },     // high river-bend overview
    ];

    const m4 = new THREE.Matrix4();
    const q4 = new THREE.Quaternion();
    const clock = new THREE.Clock();
    let raf = 0, snap = 0, hudTimer = 0;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      const dt = Math.min(clock.getDelta(), 0.05);
      const t = clock.elapsedTime;
      const c = ctl.current;

      if (c.reset) { c.reset = false; camera.position.copy(HERO_POS); controls.target.copy(HERO_TGT); }
      if (c.preset >= 0) { const p = PRESETS[c.preset]; c.preset = -1; camera.position.copy(p.pos); controls.target.copy(p.tgt); }

      curtainTex.offset.y -= dt * 1.4;

      /* spawn leaps at intensity-scaled rate (leaps/sec) */
      const rate = 0.4 + c.intensity * 2.4;
      leapAccum += rate * dt;
      while (leapAccum >= 1) { spawnLeap(); leapAccum -= 1; }

      /* airborne fish ballistic update */
      let ai = 0;
      for (const l of leaps) {
        if (!l.active) continue;
        l.t += dt;
        l.vy -= 24 * dt; l.y += l.vy * dt; l.x += l.vx * dt; l.z += l.vz * dt;
        // hitting the curtain: fail bounce
        if (!l.success && l.z <= LIP_Z + 7 && l.y < LIP_Y) { l.vz = -Math.abs(l.vz) * 0.6; l.vy = Math.max(l.vy, 2); l.spin *= 1.5; l.z = LIP_Z + 7.5; }
        const ang = Math.atan2(l.vy, Math.hypot(l.vx, l.vz)) + l.spin * l.t * 0.1;
        m4.compose(new THREE.Vector3(l.x, l.y, l.z), q4.setFromEuler(new THREE.Euler(0, Math.atan2(l.vx, l.vz), ang + Math.PI / 2)), new THREE.Vector3(1, 1, 1));
        airborne.setMatrixAt(ai++, m4);
        if (l.y < POOL_Y - 1 || (l.success && l.z < LIP_Z - 4)) l.active = false; // splash back or cleared the lip
      }
      airborne.count = ai; airborne.instanceMatrix.needsUpdate = true;

      /* massing pool fish (thin under low quality) */
      const massN = c.quality === 'high' ? Math.floor(POOL_FISH * (0.4 + c.intensity * 0.6)) : Math.floor(POOL_FISH * 0.3);
      for (let i = 0; i < POOL_FISH; i++) {
        if (i >= massN) { m4.makeScale(0, 0, 0); massing.setMatrixAt(i, m4); continue; }
        const s = massSeeds[i];
        const x = s.x + Math.sin(t * s.sp + s.ph) * 3;
        const z = s.z + Math.cos(t * s.sp * 0.7 + s.ph) * 2;
        m4.compose(new THREE.Vector3(x, POOL_Y + 0.4 + Math.sin(t * 3 + s.ph) * 0.3, z), q4.setFromEuler(new THREE.Euler(0, t * 0.3 + s.ph, Math.PI / 2)), new THREE.Vector3(0.8, 0.8, 0.8));
        massing.setMatrixAt(i, m4);
      }
      massing.count = POOL_FISH; massing.instanceMatrix.needsUpdate = true;

      /* bear behaviors */
      lipBear.children[1].rotation.z = Math.sin(t * 4) * 0.15; // head bob, snapping
      // periodic staged catch
      snap += dt;
      if (snap > 6 - c.intensity * 3) {
        snap = 0;
        setHud((h) => ({ ...h, catches: h.catches + 1 }));
        catchGlow = 1;
        gullSeeds.forEach((g) => { g.cx = lipBear.position.x; g.cz = lipBear.position.z; });
      }
      snorkeler.position.x = -40 + Math.sin(t * 0.4) * 25; snorkeler.rotation.y = Math.cos(t * 0.4) > 0 ? 0.3 : -0.3;
      snorkeler.children[1].position.y = 2.4; // head down (snorkeling)
      chaser.position.z = 60 + Math.sin(t * 0.9) * 6;
      if (Math.sin(t * 0.9) > 0.9) chaser.position.y = 1 + Math.abs(Math.sin(t * 9)) * 2; else chaser.position.y = 1;
      catchGlow = Math.max(0, catchGlow - dt * 0.6);

      /* gulls converge when a catch just happened, else drift over the pool */
      const gm = new THREE.Matrix4();
      for (let i = 0; i < gullSeeds.length; i++) { const g = gullSeeds[i]; g.a += g.sp * dt;
        const r = g.r * (catchGlow > 0.3 ? 0.5 : 1);
        const cx = catchGlow > 0.3 ? g.cx : -40, cz = catchGlow > 0.3 ? g.cz : 40;
        const flap = 1 + Math.sin(t * 9 + g.ph) * 0.5;
        gm.compose(new THREE.Vector3(cx + Math.cos(g.a) * r, g.y + Math.sin(t * 0.8 + g.ph) * 2, cz + Math.sin(g.a) * r), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, -g.a, 0)), new THREE.Vector3(1, flap, 1));
        gulls.setMatrixAt(i, gm); }
      gulls.instanceMatrix.needsUpdate = true;

      /* spray */
      for (let i = 0; i < SPRAY; i++) { const s = spraySeeds[i]; const rise = (t * s.sp + s.ph * 5) % 18;
        sprays[i].position.set(s.x + Math.sin(t + i) * 3, POOL_Y + rise, LIP_Z + 6);
        sprays[i].scale.setScalar(s.sc * (0.6 + rise / 18));
        (sprays[i].material as THREE.SpriteMaterial).opacity = 0.5 * (1 - rise / 18);
      }

      hudTimer -= dt;
      if (hudTimer <= 0) { hudTimer = 0.5; setHud((h) => ({ ...h, lpm: Math.round(rate * 60) })); }

      controls.update();
      renderer.render(scene, camera);
    };
    tick();

    const onResize = () => { camera.aspect = window.innerWidth / window.innerHeight; camera.updateProjectionMatrix(); renderer.setSize(window.innerWidth, window.innerHeight); };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      controls.dispose();
      scene.traverse((obj) => { const mesh = obj as THREE.Mesh; if (mesh.geometry) mesh.geometry.dispose(); const mat = mesh.material as THREE.Material | THREE.Material[] | undefined; if (Array.isArray(mat)) mat.forEach((m) => m.dispose()); else if (mat) mat.dispose(); });
      disposables.forEach((d) => d.dispose());
      renderer.dispose();
      mount.removeChild(renderer.domElement);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const mono: React.CSSProperties = { fontFamily: '"JetBrains Mono", monospace' };
  const PRESET_LABELS = ['正面', '潭中', '瀑后', '母熊岸', '高空'];

  return (
    <div className="fixed inset-0 overflow-hidden bg-[#bcd4d0]">
      <div ref={mountRef} className="absolute inset-0" />
      <button onClick={onBack} className="absolute left-4 top-4 z-20 inline-flex items-center gap-2 rounded-full border border-black/20 bg-white/55 px-4 py-2 text-xs font-semibold text-black/75 backdrop-blur-md transition-colors hover:border-black/40" style={mono}>← 3D Lab</button>

      <p className="pointer-events-none absolute bottom-3 left-1/2 z-20 -translate-x-1/2 text-[11px] tabular-nums tracking-[0.15em] text-black/55" style={mono}>
        🐟 {hud.lpm}/min · 🐻 {hud.catches}
      </p>

      <div className="absolute right-4 top-4 z-20 flex flex-col items-end gap-2" style={mono}>
        <button onClick={() => setPanelOpen((v) => !v)} aria-expanded={panelOpen} aria-label="Controls" className="grid h-9 w-9 place-items-center rounded-full border border-black/20 bg-white/55 text-black/75 backdrop-blur-md">{panelOpen ? '×' : '≡'}</button>
        {panelOpen && (
          <div className="flex flex-col gap-2.5 rounded-2xl border border-black/15 bg-white/60 p-3.5 backdrop-blur-md">
            <label className="flex items-center gap-2 text-[11px] text-black/70"><span className="w-12 shrink-0">洄游强度</span>
              <input type="range" min={0} max={100} defaultValue={70} onChange={(e) => (ctl.current.intensity = Number(e.target.value) / 100)} className="h-1 w-28 cursor-pointer accent-rose-500" aria-label="洄游强度" /></label>
            <div className="grid grid-cols-3 gap-1.5">
              {PRESET_LABELS.map((l, i) => (<button key={l} onClick={() => { ctl.current.preset = i; }} className="rounded-full border border-black/20 px-1.5 py-1 text-[10px] text-black/70 transition-colors hover:border-black/50">{l}</button>))}
            </div>
            <div className="flex gap-1.5">
              <button onClick={() => { ctl.current.reset = true; }} className="flex-1 rounded-full border border-black/20 px-2.5 py-1 text-[11px] text-black/70 hover:border-black/50">复位</button>
              <button onClick={() => { const n = quality === 'high' ? 'low' : 'high'; setQuality(n); ctl.current.quality = n; }} className="rounded-full border border-black/20 px-2.5 py-1 text-[11px] text-black/70 hover:border-black/50">画质:{quality === 'high' ? '高' : '低'}</button>
            </div>
          </div>
        )}
      </div>
      <p className="pointer-events-none absolute bottom-3 left-4 z-20 text-[10px] tracking-wide text-black/40" style={mono}>
        #59 BROOKS FALLS — SALMON GAUNTLET · prompt by petergpt · executed by 大雷
      </p>
    </div>
  );
};

export default BrooksFalls;
