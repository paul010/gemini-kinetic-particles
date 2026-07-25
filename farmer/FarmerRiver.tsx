import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

/* ---------------------------------------------------------------------------
 * /farmer — "农夫过河" 3D logic game (an extended wolf-goat-cabbage puzzle).
 *
 * Ferry apple / chicken / sheep / snake / tiger across the river. The boat
 * carries the farmer + one item. Whenever the farmer is away from a bank the
 * chained rules bite:
 *   tiger eats sheep  — unless a chicken is also there
 *   snake eats chicken — unless a tiger is also there
 *   sheep eats apple  — unless a snake is also there
 * Get all five across. Optimal solution is 9 crossings; a built-in BFS solver
 * powers Hint and Auto-solve. Built with Three.js (low-poly, from primitives).
 * ------------------------------------------------------------------------- */

type Lang = 'en' | 'zh' | 'zhHant';
interface T { en: string; zh: string }

const STORAGE_KEY = 'dalei-lang-v2';
const detectInitialLang = (): Lang => {
  if (typeof window === 'undefined') return 'en';
  const saved = window.localStorage.getItem(STORAGE_KEY);
  return saved === 'zh' || saved === 'zhHant' ? saved : 'en';
};
let _s2t: ((s: string) => string) | null = null;
const useS2T = (active: boolean) => {
  const [conv, setConv] = useState<((s: string) => string) | null>(() => _s2t);
  useEffect(() => {
    if (!active || _s2t) { if (_s2t && !conv) setConv(() => _s2t); return; }
    let alive = true;
    import('opencc-js').then((m) => { _s2t = (m as any).Converter({ from: 'cn', to: 'tw' }); if (alive) setConv(() => _s2t); }).catch(() => {});
    return () => { alive = false; };
  }, [active, conv]);
  return conv;
};

/* ============================ game model =============================== */

type Id = 'apple' | 'chicken' | 'sheep' | 'snake' | 'tiger';
type Side = 'L' | 'R';
const other = (s: Side): Side => (s === 'L' ? 'R' : 'L');

interface EntMeta { id: Id; slot: number; emoji: string; label: T }
const ENTS: EntMeta[] = [
  { id: 'apple', slot: 0, emoji: '🍎', label: { en: 'apple', zh: '苹果' } },
  { id: 'chicken', slot: 1, emoji: '🐔', label: { en: 'chicken', zh: '鸡' } },
  { id: 'sheep', slot: 2, emoji: '🐑', label: { en: 'sheep', zh: '羊' } },
  { id: 'snake', slot: 3, emoji: '🐍', label: { en: 'snake', zh: '蛇' } },
  { id: 'tiger', slot: 4, emoji: '🐯', label: { en: 'tiger', zh: '老虎' } },
];
const ID_LIST = ENTS.map((e) => e.id);

const REASONS: Record<string, T> = {
  'tiger-sheep': { en: 'The tiger ate the sheep — no chicken was there to stop it.', zh: '老虎吃了羊 —— 没有鸡在场阻止。' },
  'snake-chicken': { en: 'The snake ate the chicken — no tiger was there to stop it.', zh: '蛇吃了鸡 —— 没有老虎在场阻止。' },
  'sheep-apple': { en: 'The sheep ate the apple — no snake was there to stop it.', zh: '羊吃了苹果 —— 没有蛇在场阻止。' },
};

const danger = (items: Id[]): string | null => {
  const s = new Set(items);
  if (s.has('tiger') && s.has('sheep') && !s.has('chicken')) return 'tiger-sheep';
  if (s.has('snake') && s.has('chicken') && !s.has('tiger')) return 'snake-chicken';
  if (s.has('sheep') && s.has('apple') && !s.has('snake')) return 'sheep-apple';
  return null;
};

/** BFS optimal solution: list of cargo (Id | null) moves from the given state. */
const solve = (pos: Record<Id, Side>, farmer: Side): (Id | null)[] | null => {
  const key = (p: Record<Id, Side>, f: Side) => f + ID_LIST.map((i) => p[i]).join('');
  const goal = 'R' + ID_LIST.map(() => 'R').join('');
  const seen = new Set([key(pos, farmer)]);
  const q: { p: Record<Id, Side>; f: Side; path: (Id | null)[] }[] = [{ p: { ...pos }, f: farmer, path: [] }];
  while (q.length) {
    const cur = q.shift()!;
    if (key(cur.p, cur.f) === goal) return cur.path;
    const cargos: (Id | null)[] = [null, ...ID_LIST.filter((i) => cur.p[i] === cur.f)];
    for (const c of cargos) {
      const nf = other(cur.f);
      const np = { ...cur.p }; if (c) np[c] = nf;
      const there = ID_LIST.filter((i) => np[i] === cur.f);
      if (danger(there)) continue;
      const k = key(np, nf);
      if (seen.has(k)) continue;
      seen.add(k);
      q.push({ p: np, f: nf, path: [...cur.path, c] });
    }
  }
  return null;
};

/* ============================ 3D helpers =============================== */

const LEFT_X = -11.5, RIGHT_X = 11.5;
const bankX = (s: Side) => (s === 'L' ? LEFT_X : RIGHT_X);
const dockX = (s: Side) => (s === 'L' ? -6.4 : 6.4);
const slotZ = (slot: number) => -6 + slot * 3;

const mat = (color: number, opts: Partial<THREE.MeshStandardMaterialParameters> = {}) =>
  new THREE.MeshStandardMaterial({ color, roughness: 0.8, metalness: 0.05, ...opts });

const cyl = (rt: number, rb: number, h: number, c: number, seg = 12) => new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat(c));
const sph = (r: number, c: number, seg = 16) => new THREE.Mesh(new THREE.SphereGeometry(r, seg, seg), mat(c));
const box = (w: number, h: number, d: number, c: number) => new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(c));
const cone = (r: number, h: number, c: number, seg = 12) => new THREE.Mesh(new THREE.ConeGeometry(r, h, seg), mat(c));

const buildFarmer = (): THREE.Group => {
  const g = new THREE.Group();
  const lL = cyl(0.17, 0.17, 0.9, 0x3a5a8c); lL.position.set(-0.22, 0.45, 0);
  const lR = cyl(0.17, 0.17, 0.9, 0x3a5a8c); lR.position.set(0.22, 0.45, 0);
  const body = cyl(0.42, 0.5, 1.0, 0x4d78b8); body.position.y = 1.4;
  const head = sph(0.36, 0xf0c9a0); head.position.y = 2.15;
  const brim = cyl(0.62, 0.62, 0.08, 0xcaa15c, 16); brim.position.y = 2.42;
  const top = cone(0.34, 0.42, 0xd8b06a); top.position.y = 2.66;
  g.add(lL, lR, body, head, brim, top);
  return g;
};
const buildBoat = (): THREE.Group => {
  const g = new THREE.Group();
  const hull = box(3.6, 0.5, 1.7, 0x8a5a2b); hull.position.y = 0.25;
  const inner = box(3.0, 0.4, 1.1, 0x5f3d1c); inner.position.y = 0.42;
  const bowGeo = new THREE.CylinderGeometry(0.85, 0.85, 1.7, 16, 1, false, 0, Math.PI);
  const bow = new THREE.Mesh(bowGeo, mat(0x8a5a2b)); bow.rotation.z = Math.PI / 2; bow.rotation.y = Math.PI / 2;
  bow.position.set(1.8, 0.25, 0);
  const stern = bow.clone(); stern.position.x = -1.8; stern.rotation.y = -Math.PI / 2;
  g.add(hull, inner, bow, stern);
  return g;
};
const buildApple = (): THREE.Group => {
  const g = new THREE.Group();
  const basket = cyl(0.62, 0.5, 0.7, 0xb07a3c, 16); basket.position.y = 0.35;
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.6, 0.08, 8, 20), mat(0x8a5a2b)); rim.rotation.x = Math.PI / 2; rim.position.y = 0.7;
  g.add(basket, rim);
  const spots = [[-0.22, 0.85, 0.1], [0.24, 0.86, -0.05], [0, 0.95, 0.25], [0.05, 1.05, -0.15]];
  spots.forEach((p) => { const a = sph(0.27, 0xd8483f); a.position.set(p[0], p[1], p[2]); g.add(a); const leaf = cone(0.07, 0.16, 0x4f8a3a); leaf.position.set(p[0], p[1] + 0.28, p[2]); g.add(leaf); });
  return g;
};
const buildChicken = (): THREE.Group => {
  const g = new THREE.Group();
  const body = sph(0.5, 0xfbf6ec); body.scale.set(1, 0.9, 1.15); body.position.y = 0.7;
  const head = sph(0.3, 0xfbf6ec); head.position.set(0, 1.25, 0.28);
  const comb = box(0.08, 0.18, 0.28, 0xd8483f); comb.position.set(0, 1.52, 0.28);
  const beak = cone(0.1, 0.26, 0xe8912c); beak.rotation.x = Math.PI / 2; beak.position.set(0, 1.22, 0.62);
  const tail = cone(0.28, 0.6, 0xfbf6ec); tail.rotation.x = -Math.PI / 2.4; tail.position.set(0, 0.95, -0.5);
  const eL = sph(0.05, 0x241f1a, 8); eL.position.set(-0.12, 1.3, 0.5);
  const eR = sph(0.05, 0x241f1a, 8); eR.position.set(0.12, 1.3, 0.5);
  const legL = cyl(0.05, 0.05, 0.5, 0xe8912c, 6); legL.position.set(-0.16, 0.2, 0);
  const legR = cyl(0.05, 0.05, 0.5, 0xe8912c, 6); legR.position.set(0.16, 0.2, 0);
  g.add(body, head, comb, beak, tail, eL, eR, legL, legR);
  return g;
};
const buildSheep = (): THREE.Group => {
  const g = new THREE.Group();
  const body = sph(0.62, 0xf3f0ea); body.scale.set(1.25, 1, 1.05); body.position.y = 0.85;
  // wool bumps
  for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; const w = sph(0.28, 0xfbfaf6, 10); w.position.set(Math.cos(a) * 0.7, 0.85 + Math.sin(a) * 0.2, Math.sin(a) * 0.5); g.add(w); }
  const head = sph(0.32, 0x4a4038); head.position.set(0.85, 1.05, 0);
  const eL = sph(0.05, 0x110f0d, 8); eL.position.set(1.05, 1.12, 0.14);
  const eR = sph(0.05, 0x110f0d, 8); eR.position.set(1.05, 1.12, -0.14);
  const earL = sph(0.12, 0x4a4038, 8); earL.scale.set(0.5, 1, 1.4); earL.position.set(0.7, 1.25, 0.28);
  const earR = earL.clone(); earR.position.z = -0.28;
  [[-0.4, 0.35], [0.4, 0.35], [0.4, -0.35], [-0.4, -0.35]].forEach((p) => { const l = cyl(0.09, 0.09, 0.7, 0x4a4038, 6); l.position.set(p[0], 0.3, p[1]); g.add(l); });
  g.add(body, head, eL, eR, earL, earR);
  return g;
};
const buildSnake = (): THREE.Group => {
  const g = new THREE.Group();
  const coil = new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.22, 12, 28), mat(0x4f9a4a)); coil.rotation.x = Math.PI / 2; coil.position.y = 0.24;
  const coil2 = new THREE.Mesh(new THREE.TorusGeometry(0.4, 0.2, 12, 24), mat(0x5fad55)); coil2.rotation.x = Math.PI / 2; coil2.position.y = 0.5;
  const neck = cyl(0.19, 0.2, 0.7, 0x5fad55, 10); neck.position.set(0.15, 0.9, 0.3); neck.rotation.x = 0.5;
  const head = sph(0.28, 0x6ab85f); head.position.set(0.25, 1.2, 0.55); head.scale.set(1, 0.8, 1.2);
  const eL = sph(0.05, 0x1a1410, 8); eL.position.set(0.12, 1.28, 0.72);
  const eR = sph(0.05, 0x1a1410, 8); eR.position.set(0.4, 1.28, 0.72);
  const tongue = cone(0.04, 0.22, 0xd8483f); tongue.rotation.x = Math.PI / 2; tongue.position.set(0.25, 1.18, 0.85);
  g.add(coil, coil2, neck, head, eL, eR, tongue);
  return g;
};
const buildTiger = (): THREE.Group => {
  const g = new THREE.Group();
  const body = box(1.5, 0.85, 0.95, 0xe6862f); body.position.y = 0.95;
  const head = sph(0.5, 0xe6862f); head.position.set(0.95, 1.25, 0);
  const muzzle = sph(0.3, 0xfbf0e0); muzzle.scale.set(1, 0.7, 1); muzzle.position.set(1.3, 1.1, 0);
  const earL = cone(0.16, 0.24, 0xe6862f); earL.position.set(0.8, 1.7, 0.28);
  const earR = cone(0.16, 0.24, 0xe6862f); earR.position.set(0.8, 1.7, -0.28);
  const eL = sph(0.06, 0x201810, 8); eL.position.set(1.2, 1.35, 0.2);
  const eR = sph(0.06, 0x201810, 8); eR.position.set(1.2, 1.35, -0.2);
  // stripes
  for (let i = 0; i < 4; i++) { const st = box(0.09, 0.5, 0.98, 0x2a2018); st.position.set(-0.5 + i * 0.4, 1.15, 0); g.add(st); }
  [[-0.55, 0.35], [0.55, 0.35], [0.55, -0.35], [-0.55, -0.35]].forEach((p) => { const l = cyl(0.14, 0.14, 0.6, 0xe6862f, 8); l.position.set(p[0], 0.3, p[1]); g.add(l); });
  const tail = cyl(0.1, 0.1, 1.0, 0xe6862f, 8); tail.rotation.z = 0.7; tail.position.set(-1.05, 1.05, 0);
  g.add(body, head, muzzle, earL, earR, eL, eR, tail);
  return g;
};
const BUILDERS: Record<Id, () => THREE.Group> = { apple: buildApple, chicken: buildChicken, sheep: buildSheep, snake: buildSnake, tiger: buildTiger };

/* ============================ page ==================================== */

interface Props { onHome: () => void }

const FarmerRiver: React.FC<Props> = ({ onHome }) => {
  const [lang, setLang] = useState<Lang>(detectInitialLang);
  const s2t = useS2T(lang === 'zhHant');
  const t = (txt: T) => (lang === 'en' ? txt.en : lang === 'zhHant' ? (s2t ? s2t(txt.zh) : txt.zh) : txt.zh);
  useEffect(() => { if (typeof window !== 'undefined') window.localStorage.setItem(STORAGE_KEY, lang); }, [lang]);

  const START: Record<Id, Side> = { apple: 'L', chicken: 'L', sheep: 'L', snake: 'L', tiger: 'L' };
  const [pos, setPos] = useState<Record<Id, Side>>({ ...START });
  const [farmer, setFarmer] = useState<Side>('L');
  const [cargo, setCargo] = useState<Id | null>(null);
  const [moves, setMoves] = useState(0);
  const [status, setStatus] = useState<'playing' | 'won' | 'lost'>('playing');
  const [reason, setReason] = useState<string | null>(null);
  const [auto, setAuto] = useState(false);
  const [hintId, setHintId] = useState<Id | null>(null);
  const [showRules, setShowRules] = useState(true);

  // mirror latest state for the render loop + interaction handlers
  const g = useRef({ pos, farmer, cargo, status, auto });
  g.current = { pos, farmer, cargo, status, auto };

  const objs = useRef<{ boat: THREE.Group; farmer: THREE.Group; ents: Record<Id, THREE.Group>; rings: Record<Id, THREE.Mesh> } | null>(null);
  const mountRef = useRef<HTMLDivElement>(null);
  const autoTimer = useRef<number[]>([]);

  const reset = () => {
    autoTimer.current.forEach((h) => window.clearTimeout(h)); autoTimer.current = [];
    setAuto(false); setPos({ ...START }); setFarmer('L'); setCargo(null); setMoves(0); setStatus('playing'); setReason(null); setHintId(null);
  };

  const doCross = () => {
    if (g.current.status !== 'playing') return;
    const from = g.current.farmer; const to = other(from); const c = g.current.cargo;
    const np = { ...g.current.pos }; if (c) np[c] = to;
    const left = ID_LIST.filter((i) => np[i] === from);
    const d = danger(left);
    setPos(np); setFarmer(to); setCargo(null); setMoves((m) => m + 1); setHintId(null);
    if (d) { setStatus('lost'); setReason(d); }
    else if (ID_LIST.every((i) => np[i] === 'R')) setStatus('won');
  };

  const toggleLoad = (id: Id) => {
    if (g.current.status !== 'playing' || g.current.auto) return;
    if (g.current.pos[id] !== g.current.farmer) return;
    setHintId(null);
    setCargo((c) => (c === id ? null : id));
  };

  const hint = () => {
    if (status !== 'playing') return;
    const seq = solve(pos, farmer);
    if (seq && seq.length) { setHintId(seq[0]); setCargo(seq[0]); }
  };

  const autoSolve = () => {
    if (status !== 'playing' || auto) return;
    const seq = solve(pos, farmer); if (!seq) return;
    setAuto(true); setHintId(null);
    let cur = { p: { ...pos }, f: farmer };
    seq.forEach((c, i) => {
      const tLoad = window.setTimeout(() => setCargo(c), i * 1500);
      const tMove = window.setTimeout(() => {
        const from = cur.f; const to = other(from);
        const np = { ...cur.p }; if (c) np[c] = to; cur = { p: np, f: to };
        setPos(np); setFarmer(to); setCargo(null); setMoves((m) => m + 1);
        if (i === seq.length - 1) { setStatus('won'); setAuto(false); }
      }, i * 1500 + 750);
      autoTimer.current.push(tLoad, tMove);
    });
  };

  /* ---- three.js scene ---- */
  useEffect(() => {
    const mount = mountRef.current; if (!mount) return;
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    const w0 = mount.clientWidth, h0 = mount.clientHeight || 480;
    renderer.setSize(w0, h0);
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xbfe3f2);
    scene.fog = new THREE.Fog(0xbfe3f2, 55, 110);

    const camera = new THREE.PerspectiveCamera(52, w0 / h0, 0.1, 400);
    camera.position.set(0, 15, 27);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 1.5, 0);
    controls.enableDamping = true; controls.maxPolarAngle = Math.PI * 0.49;
    controls.minDistance = 14; controls.maxDistance = 60;

    scene.add(new THREE.HemisphereLight(0xffffff, 0x6b8a4a, 0.85));
    const sun = new THREE.DirectionalLight(0xfff2d8, 1.15); sun.position.set(-14, 22, 14); scene.add(sun);
    const sunDisc = new THREE.Mesh(new THREE.CircleGeometry(3.2, 32), new THREE.MeshBasicMaterial({ color: 0xfff3c8, fog: false }));
    sunDisc.position.set(20, 20, -40); scene.add(sunDisc);

    // banks
    const bankGeo = new THREE.BoxGeometry(9, 1, 26);
    const gmat = mat(0x6fa84a);
    const bankL = new THREE.Mesh(bankGeo, gmat); bankL.position.set(LEFT_X, -0.5, 0); scene.add(bankL);
    const bankR = new THREE.Mesh(bankGeo, gmat.clone()); bankR.position.set(RIGHT_X, -0.5, 0); scene.add(bankR);
    // shoreline sand
    const sandMat = mat(0xd9c48a);
    [LEFT_X + 4.5, RIGHT_X - 4.5].forEach((x) => { const s = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.02, 26), sandMat); s.position.set(x, -0.5, 0); scene.add(s); });

    // water
    const waterGeo = new THREE.PlaneGeometry(14, 26, 40, 40); waterGeo.rotateX(-Math.PI / 2);
    const water = new THREE.Mesh(waterGeo, new THREE.MeshStandardMaterial({ color: 0x2f7fb8, transparent: true, opacity: 0.92, roughness: 0.35, metalness: 0.2 }));
    water.position.y = -0.15; scene.add(water);
    const baseY = Float32Array.from(waterGeo.attributes.position.array as Float32Array);

    // decorative trees
    const tree = (x: number, z: number) => { const tg = new THREE.Group(); const trunk = cyl(0.18, 0.24, 1.0, 0x7a5230, 8); trunk.position.y = 0.5; const top = sph(0.9, 0x4f8a3a); top.position.y = 1.5; top.scale.set(1, 1.15, 1); tg.add(trunk, top); tg.position.set(x, 0, z); scene.add(tg); };
    tree(LEFT_X - 1.5, -9); tree(LEFT_X + 1, 9.5); tree(RIGHT_X + 1.5, -9.2); tree(RIGHT_X - 1, 9);

    // entities
    const ents = {} as Record<Id, THREE.Group>;
    const rings = {} as Record<Id, THREE.Mesh>;
    ENTS.forEach((e) => {
      const grp = BUILDERS[e.id]();
      grp.userData.id = e.id; grp.traverse((o) => (o.userData.id = e.id));
      scene.add(grp); ents[e.id] = grp;
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.95, 0.1, 10, 28), new THREE.MeshBasicMaterial({ color: 0xf0b429 }));
      ring.rotation.x = Math.PI / 2; ring.position.y = 0.06; ring.visible = false; scene.add(ring); rings[e.id] = ring;
    });
    const farmerObj = buildFarmer(); scene.add(farmerObj);
    const boatObj = buildBoat(); scene.add(boatObj);
    objs.current = { boat: boatObj, farmer: farmerObj, ents, rings };

    // targets
    const tmp = new THREE.Vector3();
    const target = (id: Id): THREE.Vector3 => {
      const st = g.current;
      if (st.cargo === id) return tmp.set(boatObj.position.x, 0.55, boatObj.position.z + 0.9);
      return tmp.set(bankX(st.pos[id]), 0, slotZ(ENTS.find((e) => e.id === id)!.slot));
    };

    // raycasting
    const ray = new THREE.Raycaster(); const ptr = new THREE.Vector2();
    const pickList = ENTS.map((e) => ents[e.id]);
    const onClick = (ev: PointerEvent) => {
      const r = renderer.domElement.getBoundingClientRect();
      ptr.x = ((ev.clientX - r.left) / r.width) * 2 - 1;
      ptr.y = -((ev.clientY - r.top) / r.height) * 2 + 1;
      ray.setFromCamera(ptr, camera);
      const hit = ray.intersectObjects(pickList, true)[0];
      if (hit) { let o: THREE.Object3D | null = hit.object; while (o && !o.userData.id) o = o.parent; if (o) toggleLoad(o.userData.id as Id); }
    };
    renderer.domElement.addEventListener('pointerdown', onClick);

    const clock = new THREE.Clock();
    let raf = 0;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      const el = clock.getElapsedTime();
      // water ripple
      const pa = waterGeo.attributes.position;
      for (let i = 0; i < pa.count; i++) { const x = baseY[i * 3], z = baseY[i * 3 + 2]; pa.setY(i, Math.sin(x * 0.6 + el * 1.5) * 0.12 + Math.cos(z * 0.5 + el) * 0.1); }
      pa.needsUpdate = true;
      // boat target = farmer dock
      const st = g.current;
      boatObj.position.lerp(tmp.set(dockX(st.farmer), 0.15 + Math.sin(el * 2) * 0.04, 0), 0.09);
      boatObj.rotation.z = Math.sin(el * 2) * 0.02;
      farmerObj.position.lerp(tmp.set(boatObj.position.x, 0.55, boatObj.position.z - 0.15), 0.15);
      // entities
      ENTS.forEach((e) => {
        ents[e.id].position.lerp(target(e.id), 0.12);
        const selectable = st.status === 'playing' && !st.auto && st.pos[e.id] === st.farmer && st.cargo !== e.id;
        const ring = rings[e.id]; ring.visible = selectable || (st.cargo === e.id);
        ring.material.color.setHex(st.cargo === e.id ? 0x4f9a4a : 0xf0b429);
        ring.position.set(ents[e.id].position.x, 0.06, ents[e.id].position.z);
        (ring.material as THREE.MeshBasicMaterial).opacity = 0.5 + Math.sin(el * 4) * 0.25;
        (ring.material as THREE.MeshBasicMaterial).transparent = true;
      });
      controls.update();
      renderer.render(scene, camera);
    };
    loop();

    const onResize = () => { const w = mount.clientWidth, h = mount.clientHeight || 480; renderer.setSize(w, h); camera.aspect = w / h; camera.updateProjectionMatrix(); };
    const ro = new ResizeObserver(onResize); ro.observe(mount);
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(raf); ro.disconnect(); window.removeEventListener('resize', onResize);
      renderer.domElement.removeEventListener('pointerdown', onClick);
      controls.dispose(); renderer.dispose();
      if (renderer.domElement.parentNode === mount) mount.removeChild(renderer.domElement);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => () => { autoTimer.current.forEach((h) => window.clearTimeout(h)); }, []);

  const LANGS: { code: Lang; label: string }[] = [{ code: 'en', label: 'EN' }, { code: 'zh', label: '简' }, { code: 'zhHant', label: '繁' }];
  const onSide = (s: Side) => ENTS.filter((e) => pos[e.id] === s);
  const RULES: { a: T; unless: T }[] = [
    { a: { en: 'Tiger eats sheep', zh: '老虎吃羊' }, unless: { en: 'unless a chicken is there', zh: '鸡在场可阻止' } },
    { a: { en: 'Snake eats chicken', zh: '蛇吃鸡' }, unless: { en: 'unless a tiger is there', zh: '老虎在场可阻止' } },
    { a: { en: 'Sheep eats apple', zh: '羊吃苹果' }, unless: { en: 'unless a snake is there', zh: '蛇在场可阻止' } },
  ];

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[#bfe3f2] font-sans text-ink">
      {/* 3D canvas */}
      <div ref={mountRef} className="absolute inset-0" />

      {/* top bar */}
      <header className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <button onClick={onHome} className="pointer-events-auto rounded-full border border-ink/15 bg-paper/85 px-4 py-2 font-mono text-xs text-ink/70 backdrop-blur-md transition-colors hover:text-ink">← Da Lei · 大雷</button>
        <div className="pointer-events-auto flex items-center gap-2">
          <span className="hidden rounded-full bg-ink/80 px-3 py-1.5 font-mono text-[11px] text-paper sm:inline">{t({ en: 'Crossings', zh: '渡河' })}: {moves} · {t({ en: 'optimal 9', zh: '最优 9' })}</span>
          <div className="flex overflow-hidden rounded-full border border-ink/15 bg-paper/85 backdrop-blur-md">
            {LANGS.map((l) => (<button key={l.code} onClick={() => setLang(l.code)} className={`px-2.5 py-1 font-mono text-[11px] transition-colors ${lang === l.code ? 'bg-ink text-paper' : 'text-ink/60'}`}>{l.label}</button>))}
          </div>
        </div>
      </header>

      {/* title + rules (collapsible) */}
      <div className="pointer-events-none absolute left-4 top-16 z-20 max-w-[19rem] sm:left-6">
        <h1 className="font-display text-2xl font-semibold tracking-tight text-ink drop-shadow-sm sm:text-3xl">{t({ en: 'Farmer Crosses the River', zh: '农夫过河' })}</h1>
        <button onClick={() => setShowRules((v) => !v)} className="pointer-events-auto mt-1 font-mono text-[11px] text-ink/60 underline underline-offset-2">{showRules ? t({ en: 'hide rules', zh: '收起规则' }) : t({ en: 'show rules', zh: '展开规则' })}</button>
        {showRules && (
          <div className="pointer-events-auto mt-2 rounded-2xl border border-ink/10 bg-paper/85 p-3.5 backdrop-blur-md">
            <p className="font-mono text-[10px] uppercase tracking-wider text-gold">{t({ en: 'When the farmer is away', zh: '农夫不在时' })}</p>
            <ul className="mt-1.5 space-y-1">
              {RULES.map((r, i) => (<li key={i} className="text-[12.5px] leading-snug text-ink/75"><b className="text-ink">{t(r.a)}</b> <span className="text-ink/45">— {t(r.unless)}</span></li>))}
            </ul>
            <p className="mt-2 border-t border-ink/10 pt-2 text-[11.5px] leading-relaxed text-ink/55">{t({ en: 'Boat carries the farmer + 1. Click an animal on the farmer’s bank to load it, then cross. Get all 5 across.', zh: '船每次带农夫 + 1 个。点农夫所在岸的动物上船，再渡河。把 5 个都送到对岸。' })}</p>
          </div>
        )}
      </div>

      {/* bank rosters */}
      <div className="pointer-events-none absolute inset-x-0 top-28 z-10 flex justify-between px-4 sm:px-10">
        {(['L', 'R'] as Side[]).map((s) => (
          <div key={s} className="rounded-xl bg-paper/70 px-2.5 py-1.5 backdrop-blur-sm">
            <p className="font-mono text-[10px] uppercase tracking-wider text-ink/45">{s === 'L' ? t({ en: 'left bank', zh: '左岸' }) : t({ en: 'far bank', zh: '对岸' })}{farmer === s ? ' 👨‍🌾' : ''}</p>
            <p className="text-lg leading-tight">{onSide(s).map((e) => e.emoji).join(' ') || '—'}</p>
          </div>
        ))}
      </div>

      {/* controls */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex flex-col items-center gap-2 px-4 pb-5">
        {cargo && status === 'playing' && (
          <span className="pointer-events-auto rounded-full bg-ink/80 px-3 py-1 font-mono text-[11px] text-paper">{t({ en: 'On board', zh: '船上' })}: {t(ENTS.find((e) => e.id === cargo)!.label)} {ENTS.find((e) => e.id === cargo)!.emoji}</span>
        )}
        <div className="pointer-events-auto flex flex-wrap items-center justify-center gap-2">
          <button onClick={doCross} disabled={status !== 'playing' || auto} className="btn-sheen rounded-full bg-gold px-6 py-2.5 font-mono text-sm font-semibold text-ink shadow-lg transition-transform hover:scale-[1.03] disabled:opacity-40">
            {farmer === 'L' ? t({ en: 'Row across →', zh: '渡河 →' }) : t({ en: '← Row across', zh: '← 渡河' })}
          </button>
          <button onClick={hint} disabled={status !== 'playing' || auto} className="rounded-full border border-ink/20 bg-paper/85 px-4 py-2.5 font-mono text-xs text-ink/70 backdrop-blur-md transition-colors hover:text-ink disabled:opacity-40">💡 {t({ en: 'Hint', zh: '提示' })}</button>
          <button onClick={autoSolve} disabled={status !== 'playing' || auto} className="rounded-full border border-ink/20 bg-paper/85 px-4 py-2.5 font-mono text-xs text-ink/70 backdrop-blur-md transition-colors hover:text-ink disabled:opacity-40">▶ {t({ en: 'Auto-solve', zh: '自动演示' })}</button>
          <button onClick={reset} className="rounded-full border border-ink/20 bg-paper/85 px-4 py-2.5 font-mono text-xs text-ink/70 backdrop-blur-md transition-colors hover:text-ink">↺ {t({ en: 'Reset', zh: '重来' })}</button>
        </div>
        {hintId && status === 'playing' && (
          <span className="pointer-events-auto font-mono text-[11px] text-ink/70">{t({ en: 'Hint: take', zh: '提示：带' })} {t(ENTS.find((e) => e.id === hintId)!.label)} {t({ en: 'across next', zh: '过河' })}</span>
        )}
      </div>

      {/* win / lose overlay */}
      {status !== 'playing' && (
        <div className="absolute inset-0 z-30 grid place-items-center bg-ink/45 backdrop-blur-sm">
          <div className="menu-in mx-4 max-w-sm rounded-3xl border border-ink/10 bg-paper p-7 text-center shadow-2xl">
            <div className="text-5xl">{status === 'won' ? '🎉' : '😵'}</div>
            <h2 className="mt-3 font-display text-2xl font-semibold tracking-tight">{status === 'won' ? t({ en: 'All across — you win!', zh: '全部过河 —— 你赢了！' }) : t({ en: 'Oops, a rule bit you', zh: '哎呀，触发了连锁' })}</h2>
            <p className="mt-2 text-sm leading-relaxed text-ink/65">
              {status === 'won' ? t({ en: `Solved in ${moves} crossings. Optimal is 9.`, zh: `用了 ${moves} 次渡河。最优是 9 次。` }) : (reason ? t(REASONS[reason]) : '')}
            </p>
            <div className="mt-5 flex justify-center gap-2">
              <button onClick={reset} className="btn-sheen rounded-full bg-ink px-5 py-2.5 font-mono text-sm font-semibold text-paper">↺ {t({ en: 'Play again', zh: '再来一局' })}</button>
              {status === 'lost' && <button onClick={() => { reset(); window.setTimeout(autoSolve, 300); }} className="rounded-full border border-ink/20 px-5 py-2.5 font-mono text-sm text-ink/70 hover:text-ink">▶ {t({ en: 'Show solution', zh: '看解法' })}</button>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FarmerRiver;
