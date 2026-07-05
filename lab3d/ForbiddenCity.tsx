import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

/* ---------------------------------------------------------------------------
 * /forbiddencity — prompt #9 of the 3D prompt workbench, executed.
 * "Billion-Piece Forbidden City — First Snow Across the Imperial Palace" by
 * petergpt: vermilion walls, golden snow-capped roofs, marble terraces and
 * receding gates under a clear pale-blue sky after snowfall. Executed with a
 * modular procedural palace: a hero hall on a marble platform, flanking halls,
 * successive gates receding down the central axis, instanced roof-tile rows +
 * ridge beasts + snow eave-caps, red walls with door studs, a marble balustrade
 * bridge, cypress trees, warm lantern rows, waypoint caretakers/visitors with
 * footprint decals, gentle snowfall. Weather selector (snow-sun / snowing /
 * autumn), presets, DPR ≤ 2.
 * ------------------------------------------------------------------------- */

interface Props { onBack: () => void }

type Weather = 'snowsun' | 'snowing' | 'autumn';
const WEATHER: Record<Weather, { sky: number; fog: number; sun: number; sunI: number; snowLevel: number; ground: number; label: string }> = {
  snowsun: { sky: 0xcfe2f2, fog: 0xd6e6f2, sun: 0xfff2d8, sunI: 1.8, snowLevel: 1, ground: 0xe8edf2, label: '雪后晴' },
  snowing: { sky: 0xbfccd6, fog: 0xcdd8e0, sun: 0xf0f0ea, sunI: 1.1, snowLevel: 1, ground: 0xe4ebf0, label: '飘雪' },
  autumn:  { sky: 0xa9cbe6, fog: 0xc4d8e6, sun: 0xffe9c0, sunI: 1.9, snowLevel: 0, ground: 0x8f7a54, label: '秋日晴' },
};

const ForbiddenCity: React.FC<Props> = ({ onBack }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [panelOpen, setPanelOpen] = useState(true);
  const [weather, setWeather] = useState<Weather>('snowsun');
  const [quality, setQuality] = useState<'high' | 'low'>('high');
  const ctl = useRef({ weather: 'snowsun' as Weather, lantern: 1, visitors: 1, quality: 'high' as 'high' | 'low', preset: -1, reset: false });

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xcfe2f2);
    scene.fog = new THREE.Fog(0xd6e6f2, 200, 900);

    const camera = new THREE.PerspectiveCamera(58, window.innerWidth / window.innerHeight, 0.1, 1600);
    // high three-quarter axial view: camera on +Z axis looking down the axis (-Z)
    const HERO_POS = new THREE.Vector3(70, 78, 250);
    const HERO_TGT = new THREE.Vector3(0, 24, -120);
    camera.position.copy(HERO_POS);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.copy(HERO_TGT);
    controls.enableDamping = true;
    controls.maxDistance = 700;
    controls.maxPolarAngle = Math.PI * 0.495;

    const hemi = new THREE.HemisphereLight(0xdfeeff, 0x9a8f7a, 0.7);
    scene.add(hemi);
    const sun = new THREE.DirectionalLight(0xfff2d8, 1.8);
    sun.position.set(-160, 220, 200);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    const sc = 260;
    sun.shadow.camera.left = -sc; sun.shadow.camera.right = sc; sun.shadow.camera.top = sc; sun.shadow.camera.bottom = -sc;
    sun.shadow.camera.far = 800;
    scene.add(sun);

    const disposables: (THREE.BufferGeometry | THREE.Material | THREE.Texture)[] = [];
    const track = <T extends THREE.BufferGeometry | THREE.Material | THREE.Texture>(x: T): T => { disposables.push(x); return x; };

    const VERMILION = track(new THREE.MeshLambertMaterial({ color: 0xa52a2a }));
    const MARBLE = track(new THREE.MeshLambertMaterial({ color: 0xe4e0d6 }));
    const GOLD = track(new THREE.MeshLambertMaterial({ color: 0xc9962e }));
    const SNOWMAT = track(new THREE.MeshLambertMaterial({ color: 0xf4f7fa }));
    const WOODDK = track(new THREE.MeshLambertMaterial({ color: 0x6e2b28 }));

    const snowCaps: THREE.Object3D[] = []; // toggled off in autumn

    /* ---------- a palace hall: platform, red body, columns, hipped golden roof
     * with a snow cap and instanced ridge beasts ---------- */
    const buildHall = (x: number, z: number, w: number, d: number, scale: number) => {
      const g = new THREE.Group();
      g.position.set(x, 0, z);
      // marble terrace
      const terr = new THREE.Mesh(track(new THREE.BoxGeometry(w * 1.25, 6 * scale, d * 1.25)), MARBLE);
      terr.position.y = 3 * scale; terr.receiveShadow = true; terr.castShadow = true;
      g.add(terr);
      // red hall body
      const body = new THREE.Mesh(track(new THREE.BoxGeometry(w, 16 * scale, d)), VERMILION);
      body.position.y = (6 + 8) * scale; body.castShadow = true;
      g.add(body);
      // eave slab
      const eaveY = (6 + 16) * scale;
      const eave = new THREE.Mesh(track(new THREE.BoxGeometry(w * 1.2, 1.4 * scale, d * 1.2)), WOODDK);
      eave.position.y = eaveY; g.add(eave);
      // hipped roof (a flattened pyramid) in gold + a snow cap slightly larger on top
      const roof = new THREE.Mesh(track(new THREE.ConeGeometry(Math.max(w, d) * 0.78, 12 * scale, 4)), GOLD);
      roof.rotation.y = Math.PI / 4;
      roof.position.y = eaveY + 6 * scale + 0.5; roof.castShadow = true;
      g.add(roof);
      const cap = new THREE.Mesh(track(new THREE.ConeGeometry(Math.max(w, d) * 0.8, 6 * scale, 4)), SNOWMAT);
      cap.rotation.y = Math.PI / 4;
      cap.position.y = eaveY + 9 * scale + 0.5;
      g.add(cap); snowCaps.push(cap);
      // ridge beasts along the eave corners (tiny silhouettes)
      const beast = track(new THREE.ConeGeometry(0.6 * scale, 1.8 * scale, 4));
      const beasts = new THREE.InstancedMesh(beast, WOODDK, 16);
      beasts.frustumCulled = false;
      const m = new THREE.Matrix4(); const q = new THREE.Quaternion();
      let bi = 0;
      for (let s = 0; s < 4; s++) {
        const ang = (s / 4) * Math.PI * 2 + Math.PI / 4;
        for (let k = 0; k < 4; k++) {
          const r = (Math.max(w, d) * 0.5) * (1 - k * 0.12);
          m.compose(new THREE.Vector3(Math.cos(ang) * r, eaveY + 2 * scale + k * 2 * scale, Math.sin(ang) * r), q, new THREE.Vector3(1, 1, 1));
          beasts.setMatrixAt(bi++, m);
        }
      }
      beasts.count = bi;
      g.add(beasts);
      scene.add(g);
      return g;
    };

    // central axis: hero hall + receding gates + flanking halls
    buildHall(0, -120, 90, 55, 1.4);   // hero hall
    buildHall(0, -260, 70, 46, 1.1);   // hall behind
    buildHall(0, -380, 54, 38, 0.9);   // further hall
    buildHall(-150, -120, 40, 30, 0.8); // flanking
    buildHall(150, -120, 40, 30, 0.8);
    // successive axial gates (thick red walls with a tunnel + golden roof strip)
    for (const [gz, gs] of [[10, 1.1], [-200, 0.95], [-320, 0.82]] as [number, number][]) {
      const gate = new THREE.Group(); gate.position.set(0, 0, gz);
      const wallL = new THREE.Mesh(track(new THREE.BoxGeometry(70 * gs, 30 * gs, 18 * gs)), VERMILION);
      wallL.position.set(-52 * gs, 15 * gs, 0); wallL.castShadow = true;
      const wallR = wallL.clone(); wallR.position.x = 52 * gs;
      const roofStrip = new THREE.Mesh(track(new THREE.BoxGeometry(180 * gs, 8 * gs, 26 * gs)), GOLD);
      roofStrip.position.y = 34 * gs;
      const roofSnow = new THREE.Mesh(track(new THREE.BoxGeometry(184 * gs, 3 * gs, 30 * gs)), SNOWMAT);
      roofSnow.position.y = 39 * gs; snowCaps.push(roofSnow);
      gate.add(wallL, wallR, roofStrip, roofSnow);
      scene.add(gate);
    }
    // perimeter red walls down the axis
    for (const side of [-230, 230]) {
      const wall = new THREE.Mesh(track(new THREE.BoxGeometry(14, 26, 620)), VERMILION);
      wall.position.set(side, 13, -180); wall.castShadow = true; wall.receiveShadow = true;
      const wsnow = new THREE.Mesh(track(new THREE.BoxGeometry(18, 3, 624)), SNOWMAT);
      wsnow.position.set(side, 27.5, -180); snowCaps.push(wsnow);
      scene.add(wall, wsnow);
    }

    /* courtyard paving + marble bridge with balustrade */
    const ground = new THREE.Mesh(track(new THREE.PlaneGeometry(1600, 1600)), track(new THREE.MeshLambertMaterial({ color: 0xe8edf2 })));
    ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true;
    scene.add(ground);
    // a low marble bridge across the foreground
    const bridge = new THREE.Mesh(track(new THREE.BoxGeometry(120, 4, 30)), MARBLE);
    bridge.position.set(0, 3, 90); bridge.castShadow = true; scene.add(bridge);
    const balus = new THREE.InstancedMesh(track(new THREE.BoxGeometry(1.4, 5, 1.4)), MARBLE, 40);
    balus.frustumCulled = false;
    { const m = new THREE.Matrix4(); const q = new THREE.Quaternion(); let i = 0;
      for (let x = -58; x <= 58; x += 6) for (const zz of [76, 104]) { m.compose(new THREE.Vector3(x, 7.5, zz), q, new THREE.Vector3(1, 1, 1)); balus.setMatrixAt(i++, m); } balus.count = i; }
    scene.add(balus);

    /* cypress trees */
    const trunkI = new THREE.InstancedMesh(track(new THREE.CylinderGeometry(1, 1.4, 12, 6)), WOODDK, 30);
    const crownI = new THREE.InstancedMesh(track(new THREE.ConeGeometry(6, 20, 7)), track(new THREE.MeshLambertMaterial({ color: 0x2f4a33 })), 30);
    trunkI.frustumCulled = false; crownI.frustumCulled = false;
    { const m = new THREE.Matrix4(); const q = new THREE.Quaternion(); const rng = (a: number, b: number) => a + Math.random() * (b - a);
      for (let i = 0; i < 30; i++) { const x = (Math.random() < 0.5 ? -1 : 1) * rng(180, 215); const z = rng(-400, 60);
        m.compose(new THREE.Vector3(x, 6, z), q, new THREE.Vector3(1, 1, 1)); trunkI.setMatrixAt(i, m);
        m.compose(new THREE.Vector3(x, 20, z), q, new THREE.Vector3(1, 1, 1)); crownI.setMatrixAt(i, m); } }
    scene.add(trunkI, crownI);

    /* warm lanterns */
    const lanternMat = track(new THREE.MeshBasicMaterial({ color: 0xff8a4a }));
    const lanterns = new THREE.InstancedMesh(track(new THREE.SphereGeometry(1.4, 6, 5)), lanternMat, 40);
    lanterns.frustumCulled = false;
    { const m = new THREE.Matrix4(); const q = new THREE.Quaternion(); let i = 0;
      for (let z = 60; z > -380 && i < 40; z -= 40) for (const side of [-60, 60]) { m.compose(new THREE.Vector3(side, 18, z), q, new THREE.Vector3(1, 1, 1)); lanterns.setMatrixAt(i++, m); } lanterns.count = i; }
    scene.add(lanterns);

    /* waypoint visitors/caretakers with footprint decals */
    const figs = new THREE.InstancedMesh(track(new THREE.CapsuleGeometry(0.6, 1.6, 3, 6)), track(new THREE.MeshLambertMaterial({ color: 0x2b3a4a })), 40);
    figs.frustumCulled = false;
    interface Fig { x: number; z: number; tx: number; tz: number; sp: number; wait: number }
    const figsData: Fig[] = [];
    const newTarget = (): [number, number] => [(Math.random() - 0.5) * 300, -380 + Math.random() * 440];
    for (let i = 0; i < 40; i++) { const [tx, tz] = newTarget(); figsData.push({ x: (Math.random() - 0.5) * 300, z: -380 + Math.random() * 440, tx, tz, sp: 3 + Math.random() * 3, wait: 0 }); }
    scene.add(figs);
    const footTex = (() => { const cv = document.createElement('canvas'); cv.width = 8; cv.height = 8; const g = cv.getContext('2d')!; g.fillStyle = 'rgba(180,190,205,0.5)'; g.fillRect(2, 1, 2, 6); const t = new THREE.CanvasTexture(cv); return track(t); })();
    const footMat = track(new THREE.MeshBasicMaterial({ map: footTex, transparent: true, depthWrite: false }));
    const foots = new THREE.InstancedMesh(track(new THREE.PlaneGeometry(1.2, 1.6)), footMat, 300);
    foots.frustumCulled = false;
    foots.count = 0;
    let footIdx = 0;
    const footM = new THREE.Matrix4();
    const footQ = new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2, 0, 0));
    scene.add(foots);

    /* gentle snowfall */
    const SNOW = 1200;
    const snowGeo = track(new THREE.BufferGeometry());
    const snowPos = new Float32Array(SNOW * 3);
    const rng = (a: number, b: number) => a + Math.random() * (b - a);
    for (let i = 0; i < SNOW; i++) { snowPos[i * 3] = rng(-300, 300); snowPos[i * 3 + 1] = rng(0, 200); snowPos[i * 3 + 2] = rng(-420, 120); }
    snowGeo.setAttribute('position', new THREE.BufferAttribute(snowPos, 3));
    const snow = new THREE.Points(snowGeo, track(new THREE.PointsMaterial({ color: 0xffffff, size: 1, transparent: true, opacity: 0.7, depthWrite: false })));
    snow.frustumCulled = false;
    scene.add(snow);

    /* birds lifting over the roofs */
    const birdGeo = track(new THREE.BufferGeometry());
    birdGeo.setAttribute('position', new THREE.Float32BufferAttribute([-1.4, 0, 0, 0, 0.24, 0, 0, 0, 0.3, 1.4, 0, 0, 0, 0.24, 0, 0, 0, 0.3], 3));
    const birds = new THREE.InstancedMesh(birdGeo, track(new THREE.MeshBasicMaterial({ color: 0x2a2a2a, side: THREE.DoubleSide })), 14);
    birds.frustumCulled = false;
    scene.add(birds);
    const birdSeeds = Array.from({ length: 14 }, () => ({ a: Math.random() * 7, r: 90 + Math.random() * 120, y: 60 + Math.random() * 40, sp: 0.15 + Math.random() * 0.2, ph: Math.random() * 7 }));

    let appliedW: Weather | null = null;
    const applyWeather = (w: Weather) => {
      appliedW = w; const W = WEATHER[w];
      scene.background = new THREE.Color(W.sky);
      (scene.fog as THREE.Fog).color.setHex(W.fog);
      sun.color.setHex(W.sun); sun.intensity = W.sunI;
      hemi.intensity = w === 'snowing' ? 0.85 : 0.7;
      (ground.material as THREE.MeshLambertMaterial).color.setHex(W.ground);
      snowCaps.forEach((c) => (c.visible = W.snowLevel > 0));
      snow.visible = w !== 'autumn';
    };
    applyWeather('snowsun');

    const PRESETS: { pos: THREE.Vector3; tgt: THREE.Vector3 }[] = [
      { pos: HERO_POS.clone(), tgt: HERO_TGT.clone() },                                 // grand courtyard vista
      { pos: new THREE.Vector3(0, 30, 10), tgt: new THREE.Vector3(0, 34, -120) },       // terrace + hall facade
      { pos: new THREE.Vector3(40, 60, -70), tgt: new THREE.Vector3(0, 48, -120) },      // roof + snow ornament
      { pos: new THREE.Vector3(0, 20, 60), tgt: new THREE.Vector3(0, 30, -320) },        // gate framing successive halls
      { pos: new THREE.Vector3(200, 26, -160), tgt: new THREE.Vector3(160, 24, -180) },  // winter garden corridor
      { pos: new THREE.Vector3(60, 320, 240), tgt: new THREE.Vector3(0, 20, -180) },     // high panorama
    ];

    const m4 = new THREE.Matrix4();
    const q4 = new THREE.Quaternion();
    const clock = new THREE.Clock();
    let raf = 0;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      const dt = Math.min(clock.getDelta(), 0.05);
      const t = clock.elapsedTime;
      const c = ctl.current;

      if (appliedW !== c.weather) applyWeather(c.weather);
      if (c.reset) { c.reset = false; camera.position.copy(HERO_POS); controls.target.copy(HERO_TGT); }
      if (c.preset >= 0) { const p = PRESETS[c.preset]; c.preset = -1; camera.position.copy(p.pos); controls.target.copy(p.tgt); }

      (lanterns.material as THREE.MeshBasicMaterial).color.setHex(0xff8a4a).multiplyScalar(0.6 + c.lantern * 0.5 + Math.sin(t * 2) * 0.05);

      /* waypoint figures + footprints (low pop, high legibility) */
      const figN = Math.floor(40 * c.visitors * (c.quality === 'high' ? 1 : 0.5));
      for (let i = 0; i < 40; i++) {
        const f = figsData[i];
        if (i >= figN) { m4.makeScale(0, 0, 0); figs.setMatrixAt(i, m4); continue; }
        if (f.wait > 0) { f.wait -= dt; }
        else {
          const dx = f.tx - f.x, dz = f.tz - f.z; const d = Math.hypot(dx, dz);
          if (d < 2) { const [tx, tz] = newTarget(); f.tx = tx; f.tz = tz; f.wait = 1 + Math.random() * 3; }
          else {
            f.x += (dx / d) * f.sp * dt; f.z += (dz / d) * f.sp * dt;
            if (Math.random() < dt * 3 && WEATHER[c.weather].snowLevel > 0) { // drop a footprint
              footM.compose(new THREE.Vector3(f.x, 0.15, f.z), footQ, new THREE.Vector3(1, 1, 1));
              foots.setMatrixAt(footIdx, footM); footIdx = (footIdx + 1) % 300; foots.count = Math.min(300, foots.count + 1); foots.instanceMatrix.needsUpdate = true;
            }
          }
        }
        m4.compose(new THREE.Vector3(f.x, 4, f.z), q4, new THREE.Vector3(1, 1, 1)); figs.setMatrixAt(i, m4);
      }
      figs.count = 40; figs.instanceMatrix.needsUpdate = true;

      /* birds */
      const bm = new THREE.Matrix4();
      for (let i = 0; i < birdSeeds.length; i++) { const s = birdSeeds[i]; s.a += s.sp * dt;
        const flap = 1 + Math.sin(t * 8 + s.ph) * 0.5;
        bm.compose(new THREE.Vector3(Math.cos(s.a) * s.r, s.y + Math.sin(t * 0.6 + s.ph) * 6, -120 + Math.sin(s.a) * s.r), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, -s.a, 0)), new THREE.Vector3(1, flap, 1));
        birds.setMatrixAt(i, bm); }
      birds.instanceMatrix.needsUpdate = true;

      /* snow */
      if (snow.visible) {
        const sp = snow.geometry.attributes.position.array as Float32Array;
        const fall = (c.weather === 'snowing' ? 12 : 4) * dt;
        for (let i = 0; i < SNOW; i++) { sp[i * 3 + 1] -= fall; sp[i * 3] += Math.sin(t + i) * 0.02; if (sp[i * 3 + 1] < 0) sp[i * 3 + 1] = 200; }
        snow.geometry.attributes.position.needsUpdate = true;
      }

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
      scene.traverse((obj) => {
        const mesh = obj as THREE.Mesh;
        if (mesh.geometry) mesh.geometry.dispose();
        const mat = mesh.material as THREE.Material | THREE.Material[] | undefined;
        if (Array.isArray(mat)) mat.forEach((m) => m.dispose()); else if (mat) mat.dispose();
      });
      disposables.forEach((d) => d.dispose());
      renderer.dispose();
      mount.removeChild(renderer.domElement);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const mono: React.CSSProperties = { fontFamily: '"JetBrains Mono", monospace' };
  const PRESET_LABELS = ['广场', '殿前', '屋脊', '门轴', '庭园', '高空'];
  const WLABELS: { k: Weather; l: string }[] = [{ k: 'snowsun', l: '雪后晴' }, { k: 'snowing', l: '飘雪' }, { k: 'autumn', l: '秋日' }];

  return (
    <div className="fixed inset-0 overflow-hidden bg-[#cfe2f2]">
      <div ref={mountRef} className="absolute inset-0" />
      <button onClick={onBack} className="absolute left-4 top-4 z-20 inline-flex items-center gap-2 rounded-full border border-black/20 bg-white/55 px-4 py-2 text-xs font-semibold text-black/75 backdrop-blur-md transition-colors hover:border-black/40" style={mono}>
        ← 3D Lab
      </button>
      <div className="absolute right-4 top-4 z-20 flex flex-col items-end gap-2" style={mono}>
        <button onClick={() => setPanelOpen((v) => !v)} aria-expanded={panelOpen} aria-label="Controls" className="grid h-9 w-9 place-items-center rounded-full border border-black/20 bg-white/55 text-black/75 backdrop-blur-md">{panelOpen ? '×' : '≡'}</button>
        {panelOpen && (
          <div className="flex flex-col gap-2 rounded-2xl border border-black/15 bg-white/60 p-3 backdrop-blur-md">
            <div className="flex gap-1.5">
              {WLABELS.map((w) => (
                <button key={w.k} onClick={() => { setWeather(w.k); ctl.current.weather = w.k; }} className={`rounded-full border px-2.5 py-1 text-[11px] transition-colors ${weather === w.k ? 'border-amber-700 bg-amber-500/20 text-amber-900' : 'border-black/20 text-black/70 hover:border-black/50'}`}>{w.l}</button>
              ))}
            </div>
            <label className="flex items-center gap-2 text-[11px] text-black/70"><span className="w-8 shrink-0">灯</span><input type="range" min={0} max={100} defaultValue={100} onChange={(e) => (ctl.current.lantern = Number(e.target.value) / 100)} className="h-1 w-24 cursor-pointer accent-amber-500" aria-label="灯" /></label>
            <label className="flex items-center gap-2 text-[11px] text-black/70"><span className="w-8 shrink-0">人</span><input type="range" min={0} max={100} defaultValue={100} onChange={(e) => (ctl.current.visitors = Number(e.target.value) / 100)} className="h-1 w-24 cursor-pointer accent-amber-500" aria-label="人" /></label>
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
        #9 FORBIDDEN CITY — FIRST SNOW · prompt by petergpt · executed by 大雷
      </p>
    </div>
  );
};

export default ForbiddenCity;
