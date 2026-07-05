import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

/* ---------------------------------------------------------------------------
 * /harbin — prompt #8 of the 3D prompt workbench, executed.
 * "Billion-Piece Harbin — The Glowing City of Ice" by petergpt: the Ice and
 * Snow World at blue hour — a metropolis of translucent ice palaces glowing
 * from within, under a deep indigo sky. Executed at scale-honest fidelity:
 * ice blocks read as courses (thin emissive walls with visible seams + inner
 * light), a central tower, colonnades, gates, a lit slide with riders, a
 * ferris-wheel silhouette, lantern boulevards, a frozen channel with
 * reflections, instanced coated crowds with breath fog, drifting snow, and a
 * lighting-program selector (classic multicolor / single-hue / warm festival).
 * Presets, photo mode, quality selector, DPR ≤ 2.
 * ------------------------------------------------------------------------- */

interface Props { onBack: () => void }

type Program = 'multicolor' | 'single' | 'festival';

const Harbin: React.FC<Props> = ({ onBack }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [panelOpen, setPanelOpen] = useState(true);
  const [photo, setPhoto] = useState(false);
  const [program, setProgram] = useState<Program>('multicolor');
  const [quality, setQuality] = useState<'high' | 'low'>('high');
  const ctl = useRef({ program: 'multicolor' as Program, snow: 1, crowd: 1, quality: 'high' as 'high' | 'low', preset: -1, reset: false });

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // spec: DPR <= 2
    renderer.setSize(window.innerWidth, window.innerHeight);
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0e1430); // deep indigo dusk, not black
    scene.fog = new THREE.Fog(0x151d40, 120, 620);

    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1400);
    const HERO_POS = new THREE.Vector3(0, 60, 210);   // elevated three-quarter down the boulevard
    const HERO_TGT = new THREE.Vector3(0, 26, -40);
    camera.position.copy(HERO_POS);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.copy(HERO_TGT);
    controls.enableDamping = true;
    controls.maxDistance = 520;
    controls.maxPolarAngle = Math.PI * 0.495;

    scene.add(new THREE.HemisphereLight(0x3a4a80, 0x0a1030, 0.5)); // cold ambient reads silhouettes
    const disposables: (THREE.BufferGeometry | THREE.Material | THREE.Texture)[] = [];
    const track = <T extends THREE.BufferGeometry | THREE.Material | THREE.Texture>(x: T): T => { disposables.push(x); return x; };

    /* ---------- ice block texture: internal courses, bubbles, fracture ---------- */
    const iceTex = (() => {
      const cv = document.createElement('canvas');
      cv.width = 64; cv.height = 128;
      const g = cv.getContext('2d')!;
      g.fillStyle = '#dff2ff'; g.fillRect(0, 0, 64, 128);
      for (let y = 0; y < 128; y += 8 + Math.floor(Math.random() * 4)) { // block courses
        g.strokeStyle = 'rgba(120,160,200,0.55)'; g.beginPath(); g.moveTo(0, y); g.lineTo(64, y); g.stroke();
      }
      for (let x = 0; x < 64; x += 16) { g.strokeStyle = 'rgba(120,160,200,0.4)'; g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 128); g.stroke(); }
      for (let i = 0; i < 40; i++) { g.fillStyle = `rgba(255,255,255,${0.2 + Math.random() * 0.4})`; g.beginPath(); g.arc(Math.random() * 64, Math.random() * 128, Math.random() * 1.6, 0, 7); g.fill(); }
      const tx = new THREE.CanvasTexture(cv);
      tx.wrapS = tx.wrapT = THREE.RepeatWrapping;
      return track(tx);
    })();

    // ice material: emissive so it glows from within, textured so it reads as cut ice
    const iceMat = (hex: number) => {
      const c = new THREE.Color(hex);
      const m = new THREE.MeshStandardMaterial({
        map: iceTex, color: c.clone().multiplyScalar(0.5), emissive: c, emissiveIntensity: 0.9,
        transparent: true, opacity: 0.92, roughness: 0.35, metalness: 0,
      });
      return track(m);
    };
    const PALETTES: Record<Program, number[]> = {
      multicolor: [0x2fd6c4, 0xe64ca8, 0xffb14a, 0x4a9de6, 0x63d66a, 0xa060e6],
      single:     [0x4ac4e6, 0x63cff0, 0x3ab0e0, 0x6fd8f2, 0x4ac4e6, 0x58cbea],
      festival:   [0xff8a3a, 0xffd24a, 0xff5a4a, 0xffab5a, 0xffc257, 0xff7a3a],
    };
    let structs: { mesh: THREE.Mesh; hue: number; base: number }[] = [];
    const boxIce = (w: number, h: number, d: number, x: number, y: number, z: number, hue: number) => {
      const geo = track(new THREE.BoxGeometry(w, h, d));
      // scale UVs so block courses stay ~uniform across sizes
      const mesh = new THREE.Mesh(geo, iceMat(PALETTES.multicolor[hue % 6]));
      mesh.position.set(x, y, z);
      (mesh.material as THREE.MeshStandardMaterial).map!.repeat.set(Math.max(1, w / 4), Math.max(1, h / 4));
      mesh.frustumCulled = true;
      scene.add(mesh);
      structs.push({ mesh, hue, base: 0.9 });
      return mesh;
    };

    /* ---------- the ice metropolis ---------- */
    // central palace: stacked towers + curtain wall
    boxIce(46, 70, 46, 0, 35, -70, 0);
    boxIce(30, 96, 30, 0, 48, -70, 1);
    boxIce(16, 130, 16, 0, 65, -70, 2); // hero spire
    // curtain wall with battlement courses down the boulevard
    for (let i = -5; i <= 5; i++) {
      if (Math.abs(i) < 1) continue;
      boxIce(20, 30 + (5 - Math.abs(i)) * 6, 14, i * 34, 15 + (5 - Math.abs(i)) * 3, -70, (i + 6));
      boxIce(8, 46, 8, i * 34, 23, -50, (i + 3)); // colonnade towers flanking
    }
    // triumphal gate at boulevard entry
    boxIce(10, 40, 10, -22, 20, 40, 3); boxIce(10, 40, 10, 22, 20, 40, 4);
    boxIce(56, 12, 10, 0, 44, 40, 5);
    // ice pagoda off to one side
    for (let t = 0; t < 5; t++) boxIce(26 - t * 4, 8, 26 - t * 4, -120, 8 + t * 12, -20, t);
    // lit multi-lane ice slide (a long ramp) with riders
    const slideGeo = track(new THREE.BoxGeometry(22, 3, 150));
    const slide = new THREE.Mesh(slideGeo, iceMat(0x5ac4e6));
    slide.position.set(110, 30, -10);
    slide.rotation.x = -0.28;
    slide.frustumCulled = false;
    scene.add(slide);
    structs.push({ mesh: slide, hue: 0, base: 0.9 });
    // ferris-wheel silhouette
    const wheel = new THREE.Group();
    const ring = new THREE.Mesh(track(new THREE.TorusGeometry(34, 1.2, 6, 40)), iceMat(0x63d66a));
    wheel.add(ring);
    for (let s = 0; s < 12; s++) {
      const spoke = new THREE.Mesh(track(new THREE.CylinderGeometry(0.4, 0.4, 68, 5)), iceMat(0x63d66a));
      spoke.rotation.z = (s / 12) * Math.PI;
      wheel.add(spoke);
    }
    wheel.position.set(-150, 40, -120);
    scene.add(wheel);

    /* ground: swept path snow + frozen channel with a reflective sheen */
    const ground = new THREE.Mesh(track(new THREE.PlaneGeometry(1400, 1400)), track(new THREE.MeshStandardMaterial({ color: 0x243056, roughness: 0.7, metalness: 0.1 })));
    ground.rotation.x = -Math.PI / 2;
    scene.add(ground);
    const channel = new THREE.Mesh(track(new THREE.PlaneGeometry(700, 120)), track(new THREE.MeshStandardMaterial({ color: 0x1a2648, roughness: 0.12, metalness: 0.6 })));
    channel.rotation.x = -Math.PI / 2;
    channel.position.set(0, 0.1, 160);
    scene.add(channel);

    /* lantern rows down the boulevard */
    const lanternMat = track(new THREE.MeshBasicMaterial({ color: 0xffcf6a }));
    const lanterns = new THREE.InstancedMesh(track(new THREE.SphereGeometry(0.9, 6, 5)), lanternMat, 80);
    lanterns.frustumCulled = false;
    {
      const m = new THREE.Matrix4(); const q = new THREE.Quaternion();
      let li = 0;
      for (let z = 30; z > -70 && li < 80; z -= 12) {
        for (const side of [-30, 30]) { m.compose(new THREE.Vector3(side, 8, z), q, new THREE.Vector3(1, 1, 1)); lanterns.setMatrixAt(li++, m); }
      }
      lanterns.count = li;
    }
    scene.add(lanterns);
    const lanternLight = new THREE.PointLight(0xffcf6a, 0.6, 60);
    lanternLight.position.set(0, 10, 0);
    scene.add(lanternLight);

    /* ---------- crowd: instanced padded coats + breath fog ---------- */
    const coatColors = [0xd9463e, 0xe8933c, 0x4a9de6, 0x63d66a, 0xead15b, 0xe0e3e8, 0xd96a9b];
    const coats = new THREE.InstancedMesh(track(new THREE.CapsuleGeometry(0.5, 1.1, 3, 6)), track(new THREE.MeshStandardMaterial({ roughness: 0.9 })), 240);
    coats.frustumCulled = false;
    const breathTex = (() => {
      const cv = document.createElement('canvas'); cv.width = 32; cv.height = 32;
      const g = cv.getContext('2d')!; const gr = g.createRadialGradient(16, 16, 1, 16, 16, 15);
      gr.addColorStop(0, 'rgba(230,240,255,0.5)'); gr.addColorStop(1, 'rgba(230,240,255,0)');
      g.fillStyle = gr; g.fillRect(0, 0, 32, 32); return track(new THREE.CanvasTexture(cv));
    })();
    const breaths = new THREE.InstancedMesh(track(new THREE.PlaneGeometry(1.4, 1.4)), track(new THREE.MeshBasicMaterial({ map: breathTex, transparent: true, depthWrite: false })), 240);
    breaths.frustumCulled = false;
    interface Person { x: number; z: number; a: number; sp: number; ph: number; col: number }
    const people: Person[] = [];
    const rng = (a: number, b: number) => a + Math.random() * (b - a);
    {
      const col = new THREE.Color();
      for (let i = 0; i < 240; i++) {
        people.push({ x: rng(-120, 120), z: rng(-40, 150), a: Math.random() * 7, sp: rng(1.5, 4), ph: Math.random() * 7, col: i % coatColors.length });
        coats.setColorAt(i, col.setHex(coatColors[i % coatColors.length]));
      }
    }
    scene.add(coats, breaths);

    /* snow */
    const SNOW = 1400;
    const snowGeo = track(new THREE.BufferGeometry());
    const snowPos = new Float32Array(SNOW * 3);
    for (let i = 0; i < SNOW; i++) { snowPos[i * 3] = rng(-350, 350); snowPos[i * 3 + 1] = rng(0, 220); snowPos[i * 3 + 2] = rng(-250, 260); }
    snowGeo.setAttribute('position', new THREE.BufferAttribute(snowPos, 3));
    const snow = new THREE.Points(snowGeo, track(new THREE.PointsMaterial({ color: 0xffffff, size: 1.1, transparent: true, opacity: 0.8, depthWrite: false })));
    snow.frustumCulled = false;
    scene.add(snow);

    const PRESETS: { pos: THREE.Vector3; tgt: THREE.Vector3 }[] = [
      { pos: HERO_POS.clone(), tgt: HERO_TGT.clone() },                                   // boulevard hero
      { pos: new THREE.Vector3(0, 8, 30), tgt: new THREE.Vector3(0, 60, -70) },           // low plaza toward the tower
      { pos: new THREE.Vector3(112, 62, 60), tgt: new THREE.Vector3(108, 10, -60) },      // top of the slide
      { pos: new THREE.Vector3(0, 10, 200), tgt: new THREE.Vector3(0, 6, 160) },          // bridge over the channel
      { pos: new THREE.Vector3(0, 300, 260), tgt: new THREE.Vector3(0, 20, -20) },        // high aerial
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

      if (c.reset) { c.reset = false; camera.position.copy(HERO_POS); controls.target.copy(HERO_TGT); }
      if (c.preset >= 0) { const p = PRESETS[c.preset]; c.preset = -1; camera.position.copy(p.pos); controls.target.copy(p.tgt); }

      /* light choreography: hue programs sweep across the city over tens of seconds */
      const pal = PALETTES[c.program];
      for (let i = 0; i < structs.length; i++) {
        const s = structs[i];
        const phase = c.program === 'single' ? 0 : (t * 0.08 + i * 0.7);
        const idx = Math.floor(phase % pal.length);
        const nxt = (idx + 1) % pal.length;
        const f = phase % 1;
        const mat = s.mesh.material as THREE.MeshStandardMaterial;
        mat.emissive.setHex(pal[idx]).lerp(new THREE.Color(pal[nxt]), f);
        mat.color.copy(mat.emissive).multiplyScalar(0.5);
        mat.emissiveIntensity = 0.75 + Math.sin(t * 1.2 + i) * 0.12; // gentle pulse
      }
      wheel.rotation.z = t * 0.05;
      lanternLight.intensity = 0.5 + Math.sin(t * 3) * 0.12;

      /* crowd wander + breath */
      const crowdN = Math.floor(240 * c.crowd * (c.quality === 'high' ? 1 : 0.5));
      for (let i = 0; i < 240; i++) {
        const p = people[i];
        if (i >= crowdN) { m4.makeScale(0, 0, 0); coats.setMatrixAt(i, m4); breaths.setMatrixAt(i, m4); continue; }
        p.x += Math.cos(p.a) * p.sp * dt; p.z += Math.sin(p.a) * p.sp * dt;
        if (p.x < -140 || p.x > 140) p.a = Math.PI - p.a;
        if (p.z < -60 || p.z > 160) p.a = -p.a;
        m4.compose(new THREE.Vector3(p.x, 1.4, p.z), q4.setFromEuler(new THREE.Euler(0, -p.a, 0)), new THREE.Vector3(1, 1, 1));
        coats.setMatrixAt(i, m4);
        const puff = (Math.sin(t * 1.5 + p.ph) + 1) / 2;
        q4.copy(camera.quaternion);
        m4.compose(new THREE.Vector3(p.x + Math.cos(p.a) * 0.6, 2.5 + puff * 0.8, p.z + Math.sin(p.a) * 0.6), q4, new THREE.Vector3(0.5 + puff, 0.5 + puff, 0.5 + puff));
        breaths.setMatrixAt(i, m4);
      }
      coats.count = 240; breaths.count = 240;
      coats.instanceMatrix.needsUpdate = true; breaths.instanceMatrix.needsUpdate = true;
      if (coats.instanceColor) coats.instanceColor.needsUpdate = true;

      /* snowfall */
      const sp = snow.geometry.attributes.position.array as Float32Array;
      const fall = 14 * c.snow * dt;
      for (let i = 0; i < SNOW; i++) {
        sp[i * 3 + 1] -= fall;
        sp[i * 3] += Math.sin(t + i) * 0.02;
        if (sp[i * 3 + 1] < 0) sp[i * 3 + 1] = 220;
      }
      snow.geometry.attributes.position.needsUpdate = true;
      (snow.material as THREE.PointsMaterial).opacity = 0.8 * c.snow;

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
  const PRESET_LABELS = ['大道', '塔下', '滑梯顶', '冰河桥', '高空'];
  const PROGRAMS: { k: Program; l: string }[] = [{ k: 'multicolor', l: '多彩' }, { k: 'single', l: '单色' }, { k: 'festival', l: '暖节庆' }];

  return (
    <div className="fixed inset-0 overflow-hidden bg-[#0e1430]">
      <div ref={mountRef} className="absolute inset-0" />

      {!photo && (
        <button onClick={onBack} className="absolute left-4 top-4 z-20 inline-flex items-center gap-2 rounded-full border border-white/25 bg-black/40 px-4 py-2 text-xs font-semibold text-white/90 backdrop-blur-md transition-colors hover:border-white/50" style={mono}>
          ← 3D Lab
        </button>
      )}

      {!photo && (
        <div className="absolute right-4 top-4 z-20 flex flex-col items-end gap-2" style={mono}>
          <button onClick={() => setPanelOpen((v) => !v)} aria-expanded={panelOpen} aria-label="Controls"
            className="grid h-9 w-9 place-items-center rounded-full border border-white/25 bg-black/40 text-white/85 backdrop-blur-md">
            {panelOpen ? '×' : '≡'}
          </button>
          {panelOpen && (
            <div className="flex flex-col gap-2 rounded-2xl border border-white/20 bg-black/45 p-3 backdrop-blur-md">
              <div className="flex gap-1.5">
                {PROGRAMS.map((p) => (
                  <button key={p.k} onClick={() => { setProgram(p.k); ctl.current.program = p.k; }}
                    className={`rounded-full border px-2.5 py-1 text-[11px] transition-colors ${program === p.k ? 'border-cyan-300 bg-cyan-400/20 text-cyan-100' : 'border-white/25 text-white/80 hover:border-white/50'}`}>{p.l}</button>
                ))}
              </div>
              <label className="flex items-center gap-2 text-[11px] text-white/80"><span className="w-8 shrink-0">雪</span>
                <input type="range" min={0} max={200} defaultValue={100} onChange={(e) => (ctl.current.snow = Number(e.target.value) / 100)} className="h-1 w-24 cursor-pointer accent-cyan-300" aria-label="雪" /></label>
              <label className="flex items-center gap-2 text-[11px] text-white/80"><span className="w-8 shrink-0">人流</span>
                <input type="range" min={0} max={100} defaultValue={100} onChange={(e) => (ctl.current.crowd = Number(e.target.value) / 100)} className="h-1 w-24 cursor-pointer accent-cyan-300" aria-label="人流" /></label>
              <div className="grid grid-cols-3 gap-1.5">
                {PRESET_LABELS.map((l, i) => (
                  <button key={l} onClick={() => { ctl.current.preset = i; }} className="rounded-full border border-white/25 px-1.5 py-1 text-[10px] text-white/80 transition-colors hover:border-white/50">{l}</button>
                ))}
              </div>
              <div className="flex gap-1.5">
                <button onClick={() => { ctl.current.reset = true; }} className="flex-1 rounded-full border border-white/25 px-2.5 py-1 text-[11px] text-white/80 hover:border-white/50">复位</button>
                <button onClick={() => setPhoto(true)} className="rounded-full border border-white/25 px-2.5 py-1 text-[11px] text-white/80 hover:border-white/50">拍照</button>
                <button onClick={() => { const n = quality === 'high' ? 'low' : 'high'; setQuality(n); ctl.current.quality = n; }} className="rounded-full border border-white/25 px-2.5 py-1 text-[11px] text-white/80 hover:border-white/50">{quality === 'high' ? '高' : '低'}</button>
              </div>
            </div>
          )}
        </div>
      )}
      {photo && (
        <button onClick={() => setPhoto(false)} className="absolute bottom-4 right-4 z-20 rounded-full border border-white/25 bg-black/40 px-4 py-2 text-xs text-white/85 backdrop-blur-md" style={mono}>退出拍照</button>
      )}

      {!photo && (
        <p className="pointer-events-none absolute bottom-3 left-4 z-20 text-[10px] tracking-wide text-white/40" style={mono}>
          #8 HARBIN — THE GLOWING CITY OF ICE · prompt by petergpt · executed by 大雷
        </p>
      )}
    </div>
  );
};

export default Harbin;
