import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

/* ---------------------------------------------------------------------------
 * /niagara — prompt #53 of the 3D prompt workbench, executed.
 * "Niagara — The Complete Living Falls" by petergpt: Horseshoe + American
 * Falls together, rapids above, mist plume, geometry-coupled rainbow, and
 * the little blue boat pushing into the spray. Spec honored: opens on the
 * roaring panorama, Ride-the-Boat on a fixed looping rail, season selector
 * (summer noon / golden evening / winter ice-rim), four view presets, free
 * orbit + reset, compact collapsible UI, scrolling-texture water + budgeted
 * spray sprites, DPR ≤ 2, quality selector thinning spray before the falls.
 * ------------------------------------------------------------------------- */

interface Props { onBack: () => void }

type Season = 'summer' | 'evening' | 'winter';
const SEASONS: Record<Season, { sky: number; fog: number; water: number; pool: number; sun: number; sunI: number; land: number; label: string }> = {
  summer:  { sky: 0x9fc7e8, fog: 0xbcd8ea, water: 0x2e8f7a, pool: 0x1f7a68, sun: 0xfff2d8, sunI: 1.9, land: 0x4c7a3f, label: '夏日正午' },
  evening: { sky: 0xe8a06c, fog: 0xd98a63, water: 0x3f7a68, pool: 0x2e5f52, sun: 0xffb36b, sunI: 1.4, land: 0x5a6b38, label: '黄金黄昏' },
  winter:  { sky: 0xc9d6e2, fog: 0xdde6ee, water: 0x4a7a8a, pool: 0x3f6a78, sun: 0xeef2f8, sunI: 1.1, land: 0xdfe8ee, label: '冬日冰缘' },
};

const Niagara: React.FC<Props> = ({ onBack }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [panelOpen, setPanelOpen] = useState(true);
  const [riding, setRiding] = useState(false);
  const [season, setSeason] = useState<Season>('summer');
  const [quality, setQuality] = useState<'high' | 'low'>('high');
  const ctl = useRef({ riding: false, season: 'summer' as Season, quality: 'high' as 'high' | 'low', preset: -1, reset: false });

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // spec: DPR <= 2
    renderer.setSize(window.innerWidth, window.innerHeight);
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0xbcd8ea, 120, 600);

    const camera = new THREE.PerspectiveCamera(58, window.innerWidth / window.innerHeight, 0.1, 1200);
    const HERO_POS = new THREE.Vector3(90, 55, 150);
    const HERO_TGT = new THREE.Vector3(-10, 10, -10);
    camera.position.copy(HERO_POS);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.copy(HERO_TGT);
    controls.enableDamping = true;
    controls.maxDistance = 500;
    controls.maxPolarAngle = Math.PI * 0.49;

    const hemi = new THREE.HemisphereLight(0xdfeeff, 0x4c6a5a, 0.8);
    scene.add(hemi);
    const sun = new THREE.DirectionalLight(0xfff2d8, 1.9);
    sun.position.set(160, 220, 120);
    scene.add(sun);

    const disposables: (THREE.BufferGeometry | THREE.Material | THREE.Texture)[] = [];
    const track = <T extends THREE.BufferGeometry | THREE.Material | THREE.Texture>(x: T): T => { disposables.push(x); return x; };

    /* ---------- water textures (streaks for curtains, ripples for river) ---------- */
    const streakTex = (() => {
      const cv = document.createElement('canvas');
      cv.width = 128; cv.height = 256;
      const g = cv.getContext('2d')!;
      g.fillStyle = 'rgba(255,255,255,0)'; g.fillRect(0, 0, 128, 256);
      for (let i = 0; i < 90; i++) {
        g.fillStyle = `rgba(255,255,255,${0.18 + Math.random() * 0.4})`;
        g.fillRect(Math.random() * 126, Math.random() * 256, 1.5 + Math.random() * 3, 24 + Math.random() * 80);
      }
      const tx = new THREE.CanvasTexture(cv);
      tx.wrapS = THREE.RepeatWrapping; tx.wrapT = THREE.RepeatWrapping;
      return track(tx);
    })();
    const rippleTex = (() => {
      const cv = document.createElement('canvas');
      cv.width = 128; cv.height = 128;
      const g = cv.getContext('2d')!;
      g.fillStyle = 'rgba(255,255,255,0)'; g.fillRect(0, 0, 128, 128);
      for (let i = 0; i < 70; i++) {
        g.strokeStyle = `rgba(255,255,255,${0.06 + Math.random() * 0.16})`;
        g.beginPath();
        const y = Math.random() * 128;
        g.moveTo(Math.random() * 40, y);
        g.lineTo(60 + Math.random() * 68, y + (Math.random() - 0.5) * 8);
        g.stroke();
      }
      const tx = new THREE.CanvasTexture(cv);
      tx.wrapS = THREE.RepeatWrapping; tx.wrapT = THREE.RepeatWrapping;
      return track(tx);
    })();

    /* ---------- the gorge: cliffs, banks, upper river, lower pool ---------- */
    const CLIFF_H = 52;
    const landMat = track(new THREE.MeshLambertMaterial({ color: 0x4c7a3f }));
    const rockMat = track(new THREE.MeshLambertMaterial({ color: 0x6a5c4c }));
    // horseshoe curtain path (a real arc) + american falls (straight)
    const horseshoe = new THREE.EllipseCurve(-40, -20, 46, 40, Math.PI * 0.05, Math.PI * 0.95, false, 0);
    const hsPts = horseshoe.getPoints(40).map((p) => new THREE.Vector3(p.x, 0, p.y));
    const amFrom = new THREE.Vector3(66, 0, -6), amTo = new THREE.Vector3(96, 0, 34);

    // cliff walls under both falls + gorge sides (simple extruded boxes along the paths)
    const cliffGeo = track(new THREE.BoxGeometry(1, 1, 1));
    const cliffs = new THREE.InstancedMesh(cliffGeo, rockMat, hsPts.length + 14);
    {
      const m = new THREE.Matrix4();
      const q = new THREE.Quaternion();
      let ci = 0;
      for (let i = 0; i < hsPts.length - 1; i++) {
        const a = hsPts[i], b = hsPts[i + 1];
        const mid = a.clone().add(b).multiplyScalar(0.5);
        const len = a.distanceTo(b) + 0.6;
        const ang = Math.atan2(b.x - a.x, b.z - a.z);
        m.compose(new THREE.Vector3(mid.x, -CLIFF_H / 2, mid.z), q.setFromEuler(new THREE.Euler(0, ang, 0)), new THREE.Vector3(3, CLIFF_H, len));
        cliffs.setMatrixAt(ci++, m);
      }
      for (let i = 0; i < 14; i++) { // american falls face + gorge banks
        const f = i / 13;
        const p = amFrom.clone().lerp(amTo, f);
        const ang = Math.atan2(amTo.x - amFrom.x, amTo.z - amFrom.z);
        m.compose(new THREE.Vector3(p.x, -CLIFF_H / 2, p.z), q.setFromEuler(new THREE.Euler(0, ang, 0)), new THREE.Vector3(3, CLIFF_H, 4.2));
        cliffs.setMatrixAt(ci++, m);
      }
      cliffs.count = ci;
    }
    cliffs.frustumCulled = false;
    scene.add(cliffs);

    // land masses: two banks + goat island between the falls
    const bankA = new THREE.Mesh(track(new THREE.BoxGeometry(220, 6, 160)), landMat);
    bankA.position.set(-90, -3, 90); // hmm — banks sit at brink level
    bankA.position.set(-130, -3, -60);
    const bankB = new THREE.Mesh(track(new THREE.BoxGeometry(200, 6, 140)), landMat);
    bankB.position.set(130, -3, -40);
    const goat = new THREE.Mesh(track(new THREE.BoxGeometry(46, 6, 44)), landMat);
    goat.position.set(38, -3, 4);
    scene.add(bankA, bankB, goat);

    // upper river with racing rapids (scrolling ripple texture), behind the brink
    const riverMat = track(new THREE.MeshLambertMaterial({ color: 0x2e8f7a, map: rippleTex, transparent: true, opacity: 0.96 }));
    riverMat.map!.repeat.set(6, 4);
    const river = new THREE.Mesh(track(new THREE.PlaneGeometry(220, 150)), riverMat);
    river.rotation.x = -Math.PI / 2;
    river.position.set(-20, 0.4, -95);
    scene.add(river);

    // emerald pool below
    const poolMat = track(new THREE.MeshLambertMaterial({ color: 0x1f7a68, map: rippleTex.clone(), transparent: true, opacity: 0.97 }));
    track(poolMat.map!);
    poolMat.map!.repeat.set(8, 8);
    const pool = new THREE.Mesh(track(new THREE.PlaneGeometry(420, 320)), poolMat);
    pool.rotation.x = -Math.PI / 2;
    pool.position.set(0, -CLIFF_H + 1, 110);
    scene.add(pool);

    /* ---------- the falls: layered scrolling curtains ---------- */
    const curtainMat = track(new THREE.MeshBasicMaterial({ map: streakTex, transparent: true, opacity: 0.92, side: THREE.DoubleSide, depthWrite: false, color: 0xffffff }));
    const curtains = new THREE.Group();
    const addCurtain = (a: THREE.Vector3, b: THREE.Vector3) => {
      const len = a.distanceTo(b);
      const geo = track(new THREE.PlaneGeometry(len, CLIFF_H + 4));
      const mesh = new THREE.Mesh(geo, curtainMat);
      const mid = a.clone().add(b).multiplyScalar(0.5);
      mesh.position.set(mid.x, -CLIFF_H / 2 + 1.5, mid.z);
      mesh.rotation.y = Math.atan2(b.x - a.x, b.z - a.z) + Math.PI / 2;
      curtains.add(mesh);
    };
    for (let i = 0; i < hsPts.length - 1; i += 2) addCurtain(hsPts[i].clone().setY(0).multiplyScalar(0.985), hsPts[Math.min(i + 2, hsPts.length - 1)].clone().setY(0).multiplyScalar(0.985));
    addCurtain(amFrom, amTo);
    scene.add(curtains);

    /* ---------- mist plume + base churn (budgeted sprites) ---------- */
    const puffTex = (() => {
      const cv = document.createElement('canvas');
      cv.width = 64; cv.height = 64;
      const g = cv.getContext('2d')!;
      const gr = g.createRadialGradient(32, 32, 2, 32, 32, 30);
      gr.addColorStop(0, 'rgba(255,255,255,0.55)');
      gr.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
      return track(new THREE.CanvasTexture(cv));
    })();
    const MIST_N = 90;
    const mistMat = track(new THREE.SpriteMaterial({ map: puffTex, transparent: true, opacity: 0.5, depthWrite: false }));
    const mists: THREE.Sprite[] = [];
    for (let i = 0; i < MIST_N; i++) {
      const s = new THREE.Sprite(mistMat);
      scene.add(s);
      mists.push(s);
    }
    const mistSeeds = Array.from({ length: MIST_N }, () => ({
      base: Math.random() < 0.7,
      a: Math.random() * Math.PI, r: Math.random(), ph: Math.random() * 9, sp: 2.5 + Math.random() * 4, sc: 10 + Math.random() * 22,
    }));

    /* ---------- rainbow coupled to the mist (arc standing where sun meets spray) ---------- */
    const rainbowTex = (() => {
      const cv = document.createElement('canvas');
      cv.width = 64; cv.height = 8;
      const g = cv.getContext('2d')!;
      const bands = ['#ff5a5a', '#ff9a4a', '#ffe45a', '#5adf6a', '#4aa8ff', '#7a5cff'];
      bands.forEach((b, i) => { g.fillStyle = b; g.fillRect(0, i * 1.33, 64, 1.4); });
      return track(new THREE.CanvasTexture(cv));
    })();
    const rainbow = new THREE.Mesh(
      track(new THREE.TorusGeometry(46, 2.4, 2, 60, Math.PI)),
      track(new THREE.MeshBasicMaterial({ map: rainbowTex, transparent: true, opacity: 0.4, depthWrite: false, side: THREE.DoubleSide }))
    );
    rainbow.position.set(-24, -CLIFF_H + 8, 52);
    scene.add(rainbow);

    /* ---------- the human shore: decks, tower, tiny poncho crowds, trees ---------- */
    const deckMat = track(new THREE.MeshLambertMaterial({ color: 0x8a8175 }));
    const deckA = new THREE.Mesh(track(new THREE.BoxGeometry(26, 1.6, 8)), deckMat);
    deckA.position.set(120, 0.9, 30);
    const tower = new THREE.Mesh(track(new THREE.CylinderGeometry(3, 3, 34, 10)), deckMat);
    tower.position.set(136, 17, 48);
    const towerTop = new THREE.Mesh(track(new THREE.CylinderGeometry(6, 6, 5, 10)), track(new THREE.MeshLambertMaterial({ color: 0xd9d2c4 })));
    towerTop.position.set(136, 36, 48);
    scene.add(deckA, tower, towerTop);
    const crowd = new THREE.InstancedMesh(track(new THREE.CapsuleGeometry(0.32, 0.9, 2, 6)), track(new THREE.MeshLambertMaterial()), 120);
    {
      const m = new THREE.Matrix4();
      const q = new THREE.Quaternion();
      const col = new THREE.Color();
      const spots = [ // rail points on both banks
        { x: 120, z: 30, r: 12 }, { x: 100, z: 60, r: 10 }, { x: -120, z: 40, r: 14 }, { x: -90, z: 80, r: 10 },
      ];
      for (let i = 0; i < 120; i++) {
        const s = spots[i % spots.length];
        m.compose(new THREE.Vector3(s.x + (Math.random() - 0.5) * s.r * 2, 2.3, s.z + (Math.random() - 0.5) * s.r), q, new THREE.Vector3(1, 1, 1));
        crowd.setMatrixAt(i, m);
        crowd.setColorAt(i, col.setHSL(Math.random() < 0.5 ? 0.6 : Math.random(), 0.6, 0.5)); // poncho blues + colors
      }
    }
    crowd.frustumCulled = false;
    scene.add(crowd);
    const trees = new THREE.InstancedMesh(track(new THREE.ConeGeometry(2.4, 7, 7)), track(new THREE.MeshLambertMaterial({ color: 0x35663a })), 90);
    {
      const m = new THREE.Matrix4();
      const q = new THREE.Quaternion();
      for (let i = 0; i < 90; i++) {
        const side = Math.random() < 0.5 ? -1 : 1;
        m.compose(new THREE.Vector3(side * (95 + Math.random() * 90), 4, -110 + Math.random() * 200), q, new THREE.Vector3(1 + Math.random(), 1 + Math.random() * 1.4, 1 + Math.random()));
        trees.setMatrixAt(i, m);
      }
    }
    trees.frustumCulled = false;
    scene.add(trees);

    /* gulls riding the updrafts */
    const gullGeo = track(new THREE.BufferGeometry());
    gullGeo.setAttribute('position', new THREE.Float32BufferAttribute([-1.2, 0, 0, 0, 0.22, 0, 0, 0, 0.26, 1.2, 0, 0, 0, 0.22, 0, 0, 0, 0.26], 3));
    const gulls = new THREE.InstancedMesh(gullGeo, track(new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide })), 12);
    gulls.frustumCulled = false;
    scene.add(gulls);
    const gullSeeds = Array.from({ length: 12 }, () => ({ a: Math.random() * 7, r: 30 + Math.random() * 60, y: -10 - Math.random() * 25, sp: 0.2 + Math.random() * 0.25, ph: Math.random() * 7 }));

    /* ---------- the Maid-style boat + its looping rail into the spray ---------- */
    const boat = new THREE.Group();
    const hull = new THREE.Mesh(track(new THREE.BoxGeometry(7, 2, 2.6)), track(new THREE.MeshLambertMaterial({ color: 0x2455a8 })));
    const deck = new THREE.Mesh(track(new THREE.BoxGeometry(5.4, 1.4, 2.2)), track(new THREE.MeshLambertMaterial({ color: 0xe8e4da })));
    deck.position.y = 1.6;
    const flecks = new THREE.InstancedMesh(track(new THREE.SphereGeometry(0.22, 5, 4)), track(new THREE.MeshLambertMaterial({ color: 0x4a90d9 })), 26);
    {
      const m = new THREE.Matrix4();
      const q = new THREE.Quaternion();
      for (let i = 0; i < 26; i++) {
        m.compose(new THREE.Vector3(-2.2 + Math.random() * 4.4, 2.6, -0.8 + Math.random() * 1.6), q, new THREE.Vector3(1, 1, 1));
        flecks.setMatrixAt(i, m);
      }
    }
    boat.add(hull, deck, flecks);
    scene.add(boat);
    // fixed looping rail: out from the dock, hold in the horseshoe spray, swing back
    const boatCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(110, 0, 120), new THREE.Vector3(60, 0, 90), new THREE.Vector3(-10, 0, 60),
      new THREE.Vector3(-38, 0, 26), new THREE.Vector3(-30, 0, 55), new THREE.Vector3(30, 0, 95), new THREE.Vector3(90, 0, 130),
    ], true, 'catmullrom', 0.4);
    let boatT = 0;

    /* logs occasionally sweeping over the edge */
    const log = new THREE.Mesh(track(new THREE.CylinderGeometry(0.5, 0.5, 5, 6)), track(new THREE.MeshLambertMaterial({ color: 0x5a4128 })));
    log.rotation.z = Math.PI / 2;
    scene.add(log);
    let logT = 0;

    /* ---------- season application ---------- */
    let appliedSeason: Season | null = null;
    const applySeason = (s: Season) => {
      appliedSeason = s;
      const S = SEASONS[s];
      scene.background = new THREE.Color(S.sky);
      (scene.fog as THREE.Fog).color.setHex(S.fog);
      riverMat.color.setHex(S.water);
      poolMat.color.setHex(S.pool);
      sun.color.setHex(S.sun);
      sun.intensity = S.sunI;
      landMat.color.setHex(S.land);
      (trees.material as THREE.MeshLambertMaterial).color.setHex(s === 'winter' ? 0xdfe8ee : 0x35663a); // frozen mist trees
      (rainbow.material as THREE.MeshBasicMaterial).opacity = s === 'winter' ? 0.15 : s === 'evening' ? 0.3 : 0.42;
    };
    applySeason('summer');

    const PRESETS: { pos: THREE.Vector3; tgt: THREE.Vector3 }[] = [
      { pos: new THREE.Vector3(-30, 6, -34), tgt: new THREE.Vector3(-40, -6, 0) },          // brink-edge looking over
      { pos: new THREE.Vector3(-6, -CLIFF_H + 8, 90), tgt: new THREE.Vector3(-40, -20, -10) }, // pool-level facing the horseshoe
      { pos: new THREE.Vector3(130, -20, 90), tgt: new THREE.Vector3(80, -22, 14) },        // American Falls portrait
      { pos: new THREE.Vector3(180, 150, 260), tgt: new THREE.Vector3(0, -20, 20) },        // high aerial of the gorge
    ];

    const clock = new THREE.Clock();
    let raf = 0;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      const dt = Math.min(clock.getDelta(), 0.05);
      const t = clock.elapsedTime;
      const c = ctl.current;

      if (appliedSeason !== c.season) applySeason(c.season);
      if (c.reset) { c.reset = false; c.riding = false; setRiding(false); camera.position.copy(HERO_POS); controls.target.copy(HERO_TGT); }
      if (c.preset >= 0) { const p = PRESETS[c.preset]; c.preset = -1; c.riding = false; setRiding(false); camera.position.copy(p.pos); controls.target.copy(p.tgt); }

      /* water in motion */
      streakTex.offset.y -= dt * 0.9;                 // curtains tearing downward
      riverMat.map!.offset.y -= dt * 0.35;            // racing rapids
      poolMat.map!.offset.x += dt * 0.03;

      /* mist plume + base churn */
      const mistBudget = c.quality === 'high' ? MIST_N : Math.floor(MIST_N * 0.45);
      for (let i = 0; i < MIST_N; i++) {
        const s = mistSeeds[i];
        const sp = mists[i];
        sp.visible = i < mistBudget;
        if (!sp.visible) continue;
        if (s.base) { // churn boiling at the base of the horseshoe
          const rise = ((t * s.sp + s.ph * 10) % 60);
          sp.position.set(-40 + Math.cos(s.a * 6.28) * 40 * s.r, -CLIFF_H + rise, -20 + Math.sin(s.a * 6.28) * 34 * s.r + 18);
          sp.scale.setScalar(s.sc * (0.6 + rise / 60));
          (sp.material as THREE.SpriteMaterial).opacity = 0.5 * (1 - rise / 60);
        } else { // the great column drifting with the wind
          const rise = ((t * s.sp * 0.7 + s.ph * 10) % 110);
          sp.position.set(-38 + Math.sin(s.ph) * 16 + rise * 0.16, -CLIFF_H + 10 + rise, 8 + Math.cos(s.ph) * 14);
          sp.scale.setScalar(s.sc * 1.4);
          (sp.material as THREE.SpriteMaterial).opacity = 0.4 * (1 - rise / 110);
        }
      }
      /* rainbow follows the viewer around the mist (sun ∠ spray coupling, cheaply) */
      const camA = Math.atan2(camera.position.x + 40, camera.position.z + 20);
      rainbow.rotation.y = camA;
      rainbow.visible = ctl.current.season !== 'winter';

      /* boat on its rail */
      boatT = (boatT + dt * 0.012) % 1;
      const bp = boatCurve.getPointAt(boatT);
      const bAhead = boatCurve.getPointAt((boatT + 0.01) % 1);
      boat.position.set(bp.x, -CLIFF_H + 1.6, bp.z);
      boat.lookAt(bAhead.x, -CLIFF_H + 1.6, bAhead.z);
      boat.rotation.z = Math.sin(t * 1.7) * 0.03; // riding the churn

      /* gulls + the occasional log over the edge */
      const gm = new THREE.Matrix4();
      for (let i = 0; i < gullSeeds.length; i++) {
        const g = gullSeeds[i];
        g.a += g.sp * dt;
        const flap = 1 + Math.sin(t * 8 + g.ph) * 0.5;
        gm.compose(
          new THREE.Vector3(-30 + Math.cos(g.a) * g.r, g.y + Math.sin(t * 0.7 + g.ph) * 4 + 30, 30 + Math.sin(g.a) * g.r),
          new THREE.Quaternion().setFromEuler(new THREE.Euler(0, -g.a, 0)),
          new THREE.Vector3(1, flap, 1)
        );
        gulls.setMatrixAt(i, gm);
      }
      gulls.instanceMatrix.needsUpdate = true;
      logT += dt * 0.06;
      const lt = logT % 1;
      if (lt < 0.55) { // drifting down the rapids
        log.visible = true;
        log.position.set(-20 + Math.sin(logT * 4) * 6, 0.6, -95 + lt * 170);
      } else if (lt < 0.62) { // over the edge
        log.visible = true;
        const f = (lt - 0.55) / 0.07;
        log.position.set(-24, 0.6 - f * f * CLIFF_H, -1 + f * 10);
      } else log.visible = false;

      /* ride the boat: camera mounts the bow, spray wash near the curtain */
      if (c.riding) {
        controls.enabled = false;
        camera.position.set(bp.x + (bAhead.x - bp.x) * 2, -CLIFF_H + 5, bp.z + (bAhead.z - bp.z) * 2);
        camera.lookAt(-40, -CLIFF_H + 16, -10);
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
  const PRESET_LABELS = ['崖边俯瞰', '潭底仰望', '美国瀑布', '峡谷高空'];

  return (
    <div className="fixed inset-0 overflow-hidden bg-[#9fc7e8]">
      <div ref={mountRef} className="absolute inset-0" />

      <button onClick={onBack} className="absolute left-4 top-4 z-20 inline-flex items-center gap-2 rounded-full border border-black/20 bg-white/55 px-4 py-2 text-xs font-semibold text-black/75 backdrop-blur-md transition-colors hover:border-black/40" style={mono}>
        ← 3D Lab
      </button>

      <div className="absolute right-4 top-4 z-20 flex flex-col items-end gap-2" style={mono}>
        <button onClick={() => setPanelOpen((v) => !v)} aria-expanded={panelOpen} aria-label="Controls"
          className="grid h-9 w-9 place-items-center rounded-full border border-black/20 bg-white/55 text-black/75 backdrop-blur-md">
          {panelOpen ? '×' : '≡'}
        </button>
        {panelOpen && (
          <div className="flex flex-col gap-2 rounded-2xl border border-black/15 bg-white/60 p-3 backdrop-blur-md">
            <div className="flex gap-1.5">
              {(Object.keys(SEASONS) as Season[]).map((s) => (
                <button key={s} onClick={() => { setSeason(s); ctl.current.season = s; }}
                  className={`rounded-full border px-2.5 py-1 text-[11px] transition-colors ${season === s ? 'border-sky-700 bg-sky-600/20 text-sky-900' : 'border-black/20 text-black/70 hover:border-black/50'}`}>
                  {SEASONS[s].label}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {PRESET_LABELS.map((l, i) => (
                <button key={l} onClick={() => { ctl.current.preset = i; }}
                  className="rounded-full border border-black/20 px-2.5 py-1 text-[11px] text-black/70 transition-colors hover:border-black/50">{l}</button>
              ))}
            </div>
            <div className="flex gap-1.5">
              <button onClick={() => { const n = !ctl.current.riding; ctl.current.riding = n; setRiding(n); }}
                className={`flex-1 rounded-full border px-2.5 py-1 text-[11px] transition-colors ${riding ? 'border-blue-700 bg-blue-600/20 text-blue-900' : 'border-black/20 text-black/70 hover:border-black/50'}`}>
                {riding ? '离船' : '登船入雾'}
              </button>
              <button onClick={() => { ctl.current.reset = true; }}
                className="rounded-full border border-black/20 px-2.5 py-1 text-[11px] text-black/70 hover:border-black/50">复位</button>
              <button onClick={() => { const n = quality === 'high' ? 'low' : 'high'; setQuality(n); ctl.current.quality = n; }}
                className="rounded-full border border-black/20 px-2.5 py-1 text-[11px] text-black/70 hover:border-black/50">画质:{quality === 'high' ? '高' : '低'}</button>
            </div>
          </div>
        )}
      </div>

      <p className="pointer-events-none absolute bottom-3 left-4 z-20 text-[10px] tracking-wide text-black/40" style={mono}>
        #53 NIAGARA — THE COMPLETE LIVING FALLS · prompt by petergpt · executed by 大雷
      </p>
    </div>
  );
};

export default Niagara;
