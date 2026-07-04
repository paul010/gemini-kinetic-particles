import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

/* ---------------------------------------------------------------------------
 * /dino — Dino Blaster. A Minecraft-flavored arcade FPS, generated with
 * Claude (Fable 5): blocky voxel terrain, wandering box-built dinosaurs, a
 * six-barrel gatling in your hands (hold to spin up and shred), and grenades
 * you lob in an arc to blow the dinos sky-high. Pure three.js, no assets —
 * every model is boxes, every sound is synthesized WebAudio. Desktop:
 * pointer-lock WASD+mouse. Mobile: virtual joystick + fire/grenade buttons.
 * ------------------------------------------------------------------------- */

interface Props { onHome: () => void }

const WORLD = 30;          // half-size of the playfield in blocks
const DINO_TARGET = 8;     // dinos kept alive
const EYE = 1.7;

/* Blocky terrain height — integer steps like Minecraft. Shared by rendering,
 * player, dinos and grenades so everything walks the same ground. */
const cellH = (x: number, z: number) => {
  const cx = Math.floor(x), cz = Math.floor(z);
  const h = Math.round(
    1.6 * Math.sin(cx * 0.12) + 1.4 * Math.cos(cz * 0.1) + 0.9 * Math.sin((cx + cz) * 0.07)
  );
  return Math.max(0, h);
};

const DinoBlaster: React.FC<Props> = ({ onHome }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [started, setStarted] = useState(false);
  const [paused, setPaused] = useState(false);
  const [score, setScore] = useState(0);
  const [kills, setKills] = useState(0);
  const [sound, setSound] = useState(true);
  const [isTouch] = useState(() => typeof window !== 'undefined' && 'ontouchstart' in window);
  const startedRef = useRef(false);
  const soundRef = useRef(true);
  soundRef.current = sound;

  // Imperative bridges: overlay buttons drive the game loop via these refs.
  const fireRef = useRef(false);
  const grenadeRef = useRef(false);
  const joyRef = useRef({ x: 0, y: 0 });
  const startFnRef = useRef<() => void>(() => {});

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    /* ---------- renderer / scene ---------- */
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87c5eb);
    scene.fog = new THREE.Fog(0x87c5eb, 45, 110);

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 200);

    scene.add(new THREE.HemisphereLight(0xdfeeff, 0x6a8f4f, 0.9));
    const sun = new THREE.DirectionalLight(0xfff3d6, 1.4);
    sun.position.set(30, 50, 18);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    const sc = 40;
    sun.shadow.camera.left = -sc; sun.shadow.camera.right = sc;
    sun.shadow.camera.top = sc; sun.shadow.camera.bottom = -sc;
    scene.add(sun);

    /* ---------- voxel terrain (two instanced meshes: grass caps + dirt columns) ---------- */
    const size = WORLD * 2;
    const count = size * size;
    const box = new THREE.BoxGeometry(1, 1, 1);
    const grassMat = new THREE.MeshLambertMaterial();
    const dirtMat = new THREE.MeshLambertMaterial();
    const grass = new THREE.InstancedMesh(box, grassMat, count);
    const dirt = new THREE.InstancedMesh(box, dirtMat, count);
    grass.receiveShadow = true; dirt.receiveShadow = true;
    const m4 = new THREE.Matrix4();
    const col = new THREE.Color();
    let i = 0;
    for (let x = -WORLD; x < WORLD; x++) {
      for (let z = -WORLD; z < WORLD; z++) {
        const h = cellH(x, z);
        m4.makeTranslation(x + 0.5, h - 0.5, z + 0.5);
        grass.setMatrixAt(i, m4);
        // subtle per-block green variation sells the Minecraft look
        const v = ((x * 73 + z * 31) % 7) / 7;
        grass.setColorAt(i, col.setHSL(0.29 + v * 0.02, 0.55, 0.38 + v * 0.06));
        m4.makeScale(1, h + 2, 1);
        m4.setPosition(x + 0.5, (h - 4) / 2, z + 0.5); // column spans y=-3 … h-1, flush under the grass cap
        dirt.setMatrixAt(i, m4);
        dirt.setColorAt(i, col.setHSL(0.07, 0.45, 0.32 + v * 0.05));
        i++;
      }
    }
    scene.add(grass, dirt);

    /* trees + clouds — a handful of real meshes for flavor */
    const deco = new THREE.Group();
    const rng = (a: number, b: number) => a + Math.random() * (b - a);
    for (let t = 0; t < 16; t++) {
      const tx = Math.floor(rng(-WORLD + 3, WORLD - 3)), tz = Math.floor(rng(-WORLD + 3, WORLD - 3));
      if (Math.hypot(tx, tz - 6) < 7) continue; // keep the spawn clearing open
      const h = cellH(tx, tz);
      const trunkH = 2 + Math.floor(Math.random() * 2);
      const trunk = new THREE.Mesh(new THREE.BoxGeometry(0.6, trunkH, 0.6), new THREE.MeshLambertMaterial({ color: 0x6b4a2b }));
      trunk.position.set(tx + 0.5, h + trunkH / 2, tz + 0.5);
      trunk.castShadow = true;
      const leaves = new THREE.Mesh(new THREE.BoxGeometry(2.6, 2, 2.6), new THREE.MeshLambertMaterial({ color: 0x2e7d32 }));
      leaves.position.set(tx + 0.5, h + trunkH + 0.9, tz + 0.5);
      leaves.castShadow = true;
      deco.add(trunk, leaves);
    }
    for (let c = 0; c < 8; c++) {
      const cloud = new THREE.Mesh(
        new THREE.BoxGeometry(rng(5, 10), 0.8, rng(3, 6)),
        new THREE.MeshLambertMaterial({ color: 0xffffff, transparent: true, opacity: 0.85 })
      );
      cloud.position.set(rng(-70, 70), rng(22, 30), rng(-70, 70));
      deco.add(cloud);
    }
    scene.add(deco);

    /* ---------- gatling viewmodel (six spinning barrels, attached to camera) ---------- */
    const gun = new THREE.Group();
    const barrels = new THREE.Group();
    const barrelGeo = new THREE.CylinderGeometry(0.028, 0.028, 0.62, 8);
    const barrelMat = new THREE.MeshStandardMaterial({ color: 0x3b3f45, metalness: 0.8, roughness: 0.35 });
    for (let b = 0; b < 6; b++) {
      const bar = new THREE.Mesh(barrelGeo, barrelMat);
      const a = (b / 6) * Math.PI * 2;
      bar.position.set(Math.cos(a) * 0.075, Math.sin(a) * 0.075, -0.28);
      bar.rotation.x = Math.PI / 2;
      barrels.add(bar);
    }
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.16, 12), barrelMat);
    hub.rotation.x = Math.PI / 2; hub.position.z = -0.02;
    barrels.add(hub);
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.24, 0.42), new THREE.MeshStandardMaterial({ color: 0x23262b, metalness: 0.6, roughness: 0.5 }));
    body.position.set(0, -0.04, 0.28);
    const grip = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.2, 0.09), new THREE.MeshStandardMaterial({ color: 0x151719 }));
    grip.position.set(0, -0.22, 0.34);
    gun.add(barrels, body, grip);
    gun.scale.setScalar(0.55);
    gun.position.set(0.36, -0.32, -0.6);
    camera.add(gun);
    const flash = new THREE.PointLight(0xffc26e, 0, 6);
    flash.position.set(0.34, -0.24, -1.1);
    camera.add(flash);
    const flashSprite = new THREE.Mesh(
      new THREE.PlaneGeometry(0.22, 0.22),
      new THREE.MeshBasicMaterial({ color: 0xffd27a, transparent: true, opacity: 0, depthTest: false })
    );
    flashSprite.position.set(0.34, -0.28, -0.95);
    camera.add(flashSprite);
    scene.add(camera);

    /* ---------- synthesized audio (no assets) ---------- */
    let actx: AudioContext | null = null;
    const audio = () => {
      if (!actx) actx = new (window.AudioContext || (window as any).webkitAudioContext)();
      return actx;
    };
    const noiseBuf = (() => {
      let buf: AudioBuffer | null = null;
      return (ctx: AudioContext) => {
        if (buf) return buf;
        buf = ctx.createBuffer(1, ctx.sampleRate * 0.5, ctx.sampleRate);
        const d = buf.getChannelData(0);
        for (let n = 0; n < d.length; n++) d[n] = Math.random() * 2 - 1;
        return buf;
      };
    })();
    const playShot = () => {
      if (!soundRef.current) return;
      const ctx = audio();
      const src = ctx.createBufferSource(); src.buffer = noiseBuf(ctx);
      const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 2600;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.16, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.07);
      src.connect(f).connect(g).connect(ctx.destination);
      src.start(); src.stop(ctx.currentTime + 0.08);
    };
    const playBoom = () => {
      if (!soundRef.current) return;
      const ctx = audio();
      const src = ctx.createBufferSource(); src.buffer = noiseBuf(ctx);
      const f = ctx.createBiquadFilter(); f.type = 'lowpass';
      f.frequency.setValueAtTime(900, ctx.currentTime);
      f.frequency.exponentialRampToValueAtTime(60, ctx.currentTime + 0.5);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.7, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
      const osc = ctx.createOscillator(); osc.type = 'sine';
      osc.frequency.setValueAtTime(70, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(28, ctx.currentTime + 0.5);
      const og = ctx.createGain();
      og.gain.setValueAtTime(0.5, ctx.currentTime);
      og.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.55);
      src.connect(f).connect(g).connect(ctx.destination);
      osc.connect(og).connect(ctx.destination);
      src.start(); osc.start();
      src.stop(ctx.currentTime + 0.65); osc.stop(ctx.currentTime + 0.6);
    };
    const playRoar = () => {
      if (!soundRef.current) return;
      const ctx = audio();
      const osc = ctx.createOscillator(); osc.type = 'square';
      osc.frequency.setValueAtTime(180, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.35);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.12, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      osc.connect(g).connect(ctx.destination);
      osc.start(); osc.stop(ctx.currentTime + 0.45);
    };

    /* ---------- dinos: box-built t-rexes with wander/chase AI ---------- */
    interface Dino {
      grp: THREE.Group;
      hp: number;
      dir: number;
      speed: number;
      retarget: number;
      dying: number; // >0 while playing the death fall
      flash: number;
      mats: THREE.MeshLambertMaterial[];
      legs: THREE.Mesh[];
      scale: number;
    }
    const dinos: Dino[] = [];
    const dinoPalettes = [0x5a8f3c, 0x4c8f7a, 0xb0713a, 0x7a5cab, 0x8f4c4c];
    const buildDino = (scatter = false): Dino => {
      const grp = new THREE.Group();
      const tone = dinoPalettes[Math.floor(Math.random() * dinoPalettes.length)];
      const mats: THREE.MeshLambertMaterial[] = [];
      const mat = () => { const m = new THREE.MeshLambertMaterial({ color: tone }); mats.push(m); return m; };
      const add = (w: number, h: number, d: number, x: number, y: number, z: number, m?: THREE.Material) => {
        const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m ?? mat());
        mesh.position.set(x, y, z);
        mesh.castShadow = true;
        grp.add(mesh);
        return mesh;
      };
      add(0.9, 1.0, 1.7, 0, 1.5, 0);                 // body
      add(0.7, 0.7, 0.9, 0, 2.2, -1.15);             // head
      add(0.55, 0.28, 0.6, 0, 1.9, -1.55);           // jaw
      const eyeM = new THREE.MeshLambertMaterial({ color: 0x151515 });
      add(0.12, 0.12, 0.12, 0.26, 2.35, -1.5, eyeM); // eyes
      add(0.12, 0.12, 0.12, -0.26, 2.35, -1.5, eyeM);
      add(0.5, 0.5, 1.1, 0, 1.45, 1.35);             // tail root
      add(0.3, 0.3, 0.9, 0, 1.35, 2.2);              // tail tip
      add(0.22, 0.4, 0.3, 0.5, 1.5, -0.8);           // arms
      add(0.22, 0.4, 0.3, -0.5, 1.5, -0.8);
      const legL = add(0.34, 1.0, 0.5, 0.34, 0.5, 0.2);
      const legR = add(0.34, 1.0, 0.5, -0.34, 0.5, 0.2);
      const scale = rng(0.8, 1.45);
      grp.scale.setScalar(scale);
      // initial population scatters across the map (but not on top of the
      // player); respawns march in from the world edge
      let px = 0, pz = 0;
      if (scatter) {
        do { px = rng(-WORLD + 4, WORLD - 4); pz = rng(-WORLD + 4, WORLD - 4); }
        while (Math.hypot(px, pz - 6) < 8);
      } else {
        const edge = Math.floor(Math.random() * 4);
        const p = rng(-WORLD + 3, WORLD - 3);
        px = edge === 0 ? -WORLD + 3 : edge === 1 ? WORLD - 3 : p;
        pz = edge === 2 ? -WORLD + 3 : edge === 3 ? WORLD - 3 : p;
      }
      grp.position.set(px, cellH(px, pz), pz);
      scene.add(grp);
      return { grp, hp: 6, dir: Math.random() * Math.PI * 2, speed: rng(1.2, 2.4), retarget: rng(2, 5), dying: 0, flash: 0, mats, legs: [legL, legR], scale };
    };
    for (let d = 0; d < DINO_TARGET; d++) dinos.push(buildDino(true));
    let respawnQueue = 0;

    /* ---------- shared particle pool (blood, debris, explosion voxels) ---------- */
    interface Particle { mesh: THREE.Mesh; vel: THREE.Vector3; life: number; spin: THREE.Vector3 }
    const particles: Particle[] = [];
    const partGeo = new THREE.BoxGeometry(0.16, 0.16, 0.16);
    const burst = (at: THREE.Vector3, color: number, n: number, power: number) => {
      for (let p = 0; p < n; p++) {
        const mesh = new THREE.Mesh(partGeo, new THREE.MeshLambertMaterial({ color }));
        mesh.position.copy(at);
        scene.add(mesh);
        particles.push({
          mesh,
          vel: new THREE.Vector3(rng(-1, 1), rng(0.4, 1.6), rng(-1, 1)).multiplyScalar(power),
          life: rng(0.5, 1.1),
          spin: new THREE.Vector3(rng(-8, 8), rng(-8, 8), rng(-8, 8)),
        });
      }
    };

    /* ---------- tracers ---------- */
    interface Tracer { mesh: THREE.Mesh; life: number }
    const tracers: Tracer[] = [];
    const tracerMat = new THREE.MeshBasicMaterial({ color: 0xffd27a, transparent: true, opacity: 0.9 });

    /* ---------- grenades ---------- */
    interface Grenade { mesh: THREE.Group; vel: THREE.Vector3; fuse: number }
    const grenades: Grenade[] = [];
    const throwGrenade = () => {
      if (grenades.length >= 3) return;
      const g = new THREE.Group();
      const shell = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.26, 0.22), new THREE.MeshStandardMaterial({ color: 0x2f4f2f, roughness: 0.6 }));
      const pin = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.06, 0.06), new THREE.MeshStandardMaterial({ color: 0xc9a34a }));
      pin.position.y = 0.16;
      g.add(shell, pin);
      const fwd = new THREE.Vector3();
      camera.getWorldDirection(fwd);
      g.position.copy(camera.position).addScaledVector(fwd, 0.6);
      scene.add(g);
      grenades.push({ mesh: g, vel: fwd.multiplyScalar(13).add(new THREE.Vector3(0, 4.5, 0)), fuse: 1.7 });
    };
    let shake = 0;
    const explode = (at: THREE.Vector3) => {
      playBoom();
      shake = Math.min(0.6, shake + 0.45);
      burst(at, 0xffa94d, 26, 7);
      burst(at, 0x6b4a2b, 18, 5);
      const ring = new THREE.Mesh(
        new THREE.SphereGeometry(1, 12, 10),
        new THREE.MeshBasicMaterial({ color: 0xffc26e, transparent: true, opacity: 0.85 })
      );
      ring.position.copy(at);
      scene.add(ring);
      rings.push({ mesh: ring, life: 0.35 });
      const bl = new THREE.PointLight(0xffa94d, 30, 18);
      bl.position.copy(at);
      scene.add(bl);
      blastLights.push({ light: bl, life: 0.3 });
      // radius damage with falloff
      for (const d of dinos) {
        if (d.dying > 0) continue;
        const dist = d.grp.position.distanceTo(at);
        if (dist < 7) {
          const dmg = dist < 3 ? 6 : dist < 5 ? 4 : 2;
          hurtDino(d, dmg, at);
        }
      }
    };
    const rings: { mesh: THREE.Mesh; life: number }[] = [];
    const blastLights: { light: THREE.PointLight; life: number }[] = [];

    /* ---------- damage / scoring ---------- */
    let scoreAcc = 0, killAcc = 0;
    const hurtDino = (d: Dino, dmg: number, from?: THREE.Vector3) => {
      d.hp -= dmg;
      d.flash = 0.12;
      burst(d.grp.position.clone().add(new THREE.Vector3(0, 1.6 * d.scale, 0)), 0xb03a3a, 5, 3);
      if (d.hp <= 0 && d.dying === 0) {
        d.dying = 0.6;
        playRoar();
        scoreAcc += Math.round(100 * d.scale);
        killAcc += 1;
        if (from) {
          const away = d.grp.position.clone().sub(from).setY(0).normalize();
          d.grp.position.addScaledVector(away, 0.6);
        }
      }
    };

    /* ---------- input ---------- */
    const keys = new Set<string>();
    let yaw = Math.PI, pitch = -0.05;
    const player = new THREE.Vector3(0, cellH(0, 6) + EYE, 6);
    let vy = 0, grounded = true;
    let firing = false, spin = 0, fireCooldown = 0, spinAngle = 0;

    const isLocked = () => document.pointerLockElement === renderer.domElement;
    const onKey = (e: KeyboardEvent, down: boolean) => {
      if (down && e.code === 'KeyG' && startedRef.current) throwGrenade();
      if (down && e.code === 'KeyM') setSound((s) => !s);
      down ? keys.add(e.code) : keys.delete(e.code);
    };
    const kd = (e: KeyboardEvent) => onKey(e, true);
    const ku = (e: KeyboardEvent) => onKey(e, false);
    const onMouseMove = (e: MouseEvent) => {
      if (!isLocked()) return;
      yaw -= e.movementX * 0.0023;
      pitch = Math.max(-1.35, Math.min(1.35, pitch - e.movementY * 0.0023));
    };
    const onMouseDown = (e: MouseEvent) => {
      if (!isLocked()) return;
      if (e.button === 0) firing = true;
      if (e.button === 2) throwGrenade();
    };
    const onMouseUp = (e: MouseEvent) => { if (e.button === 0) firing = false; };
    const onContext = (e: Event) => e.preventDefault();
    const onLockChange = () => {
      if (!isLocked() && startedRef.current && !isTouchLocal) setPaused(true);
    };
    const isTouchLocal = 'ontouchstart' in window;

    // touch look: drag on the canvas rotates the view
    let lastTouch: { id: number; x: number; y: number } | null = null;
    const onTouchStart = (e: TouchEvent) => {
      const t = e.changedTouches[0];
      if (t.clientX > window.innerWidth * 0.35) lastTouch = { id: t.identifier, x: t.clientX, y: t.clientY };
    };
    const onTouchMove = (e: TouchEvent) => {
      if (!lastTouch) return;
      for (const t of Array.from(e.changedTouches)) {
        if (t.identifier === lastTouch.id) {
          yaw -= (t.clientX - lastTouch.x) * 0.005;
          pitch = Math.max(-1.35, Math.min(1.35, pitch - (t.clientY - lastTouch.y) * 0.005));
          lastTouch = { id: t.identifier, x: t.clientX, y: t.clientY };
        }
      }
    };
    const onTouchEnd = (e: TouchEvent) => {
      if (lastTouch && Array.from(e.changedTouches).some((t) => t.identifier === lastTouch!.id)) lastTouch = null;
    };

    const start = () => {
      startedRef.current = true;
      setStarted(true); setPaused(false);
      audio().resume?.();
      if (!isTouchLocal) renderer.domElement.requestPointerLock();
    };
    startFnRef.current = start;

    window.addEventListener('keydown', kd);
    window.addEventListener('keyup', ku);
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('mouseup', onMouseUp);
    document.addEventListener('pointerlockchange', onLockChange);
    renderer.domElement.addEventListener('contextmenu', onContext);
    renderer.domElement.addEventListener('touchstart', onTouchStart, { passive: true });
    renderer.domElement.addEventListener('touchmove', onTouchMove, { passive: true });
    renderer.domElement.addEventListener('touchend', onTouchEnd, { passive: true });

    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', onResize);

    // tiny debug handle for automated testing (harmless in production)
    (window as any).__dino = {
      state: () => ({
        player: player.toArray(),
        yaw, pitch,
        dinos: dinos.map((d) => ({ pos: d.grp.position.toArray(), hp: d.hp, dying: d.dying, scale: d.scale })),
      }),
      aimAt: (x: number, y: number, z: number) => {
        const dx = x - player.x, dy = y - player.y, dz = z - player.z;
        yaw = Math.atan2(-dx, -dz);
        pitch = Math.atan2(dy, Math.hypot(dx, dz));
      },
    };

    /* ---------- firing (raycast + tracer) ---------- */
    const raycaster = new THREE.Raycaster();
    const fireOnce = () => {
      playShot();
      flash.intensity = 3.2;
      (flashSprite.material as THREE.MeshBasicMaterial).opacity = 0.9;
      flashSprite.rotation.z = Math.random() * Math.PI;
      gun.position.z = -0.51; // recoil kick, eased back in the loop
      // slight spread cone
      const dir = new THREE.Vector3();
      camera.getWorldDirection(dir);
      dir.x += rng(-0.012, 0.012); dir.y += rng(-0.012, 0.012); dir.z += rng(-0.012, 0.012);
      dir.normalize();
      raycaster.set(camera.position, dir);
      raycaster.far = 90;
      const targets: THREE.Object3D[] = [];
      for (const d of dinos) if (d.dying === 0) targets.push(d.grp);
      const hits = raycaster.intersectObjects(targets, true);
      let end = camera.position.clone().addScaledVector(dir, 60);
      if (hits.length > 0) {
        end = hits[0].point;
        let obj: THREE.Object3D | null = hits[0].object;
        while (obj && !dinos.some((d) => d.grp === obj)) obj = obj.parent;
        const d = dinos.find((dd) => dd.grp === obj);
        if (d) hurtDino(d, 1, camera.position);
      }
      // tracer: stretched thin box from muzzle to impact
      const muzzle = new THREE.Vector3(0.34, -0.28, -1.0).applyMatrix4(camera.matrixWorld);
      const len = muzzle.distanceTo(end);
      const tr = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.03, len), tracerMat.clone());
      tr.position.copy(muzzle).lerp(end, 0.5);
      tr.lookAt(end);
      scene.add(tr);
      tracers.push({ mesh: tr, life: 0.06 });
    };

    /* ---------- main loop ---------- */
    const clock = new THREE.Clock();
    let raf = 0;
    let hudTimer = 0;
    const fwdV = new THREE.Vector3(), rightV = new THREE.Vector3();

    const tick = () => {
      raf = requestAnimationFrame(tick);
      const dt = Math.min(clock.getDelta(), 0.05);
      const active = startedRef.current && (isTouchLocal || isLocked());

      if (active) {
        /* movement */
        let mx = joyRef.current.x, mz = joyRef.current.y;
        if (keys.has('KeyW') || keys.has('ArrowUp')) mz -= 1;
        if (keys.has('KeyS') || keys.has('ArrowDown')) mz += 1;
        if (keys.has('KeyA') || keys.has('ArrowLeft')) mx -= 1;
        if (keys.has('KeyD') || keys.has('ArrowRight')) mx += 1;
        const ml = Math.hypot(mx, mz);
        if (ml > 1) { mx /= ml; mz /= ml; }
        const speed = keys.has('ShiftLeft') ? 9 : 6;
        // view-space movement: mz=-1 is forward, mx=+1 is strafe right
        fwdV.set(-Math.sin(yaw), 0, -Math.cos(yaw));
        rightV.set(Math.cos(yaw), 0, -Math.sin(yaw));
        player.addScaledVector(fwdV, -mz * speed * dt);
        player.addScaledVector(rightV, mx * speed * dt);
        player.x = Math.max(-WORLD + 1, Math.min(WORLD - 1, player.x));
        player.z = Math.max(-WORLD + 1, Math.min(WORLD - 1, player.z));
        const groundY = cellH(player.x, player.z) + EYE;
        if (keys.has('Space') && grounded) { vy = 7.5; grounded = false; }
        vy -= 22 * dt;
        player.y += vy * dt;
        if (player.y <= groundY) { player.y = groundY; vy = 0; grounded = true; }

        /* gatling: spin up, then fire at rate */
        const wantFire = firing || fireRef.current;
        spin = THREE.MathUtils.clamp(spin + (wantFire ? dt * 3.2 : -dt * 2.2), 0, 1);
        spinAngle += spin * dt * 30;
        barrels.rotation.z = spinAngle;
        fireCooldown -= dt;
        if (wantFire && spin > 0.55 && fireCooldown <= 0) {
          fireOnce();
          fireCooldown = 1 / 11;
        }
        if (grenadeRef.current) { grenadeRef.current = false; throwGrenade(); }
      }

      /* view + shake */
      camera.position.copy(player);
      if (shake > 0) {
        shake = Math.max(0, shake - dt * 1.4);
        camera.position.x += rng(-1, 1) * shake * 0.12;
        camera.position.y += rng(-1, 1) * shake * 0.12;
      }
      camera.rotation.set(pitch, yaw, 0, 'YXZ');
      gun.position.z = THREE.MathUtils.lerp(gun.position.z, -0.55, dt * 14);
      gun.position.y = -0.3 + Math.sin(clock.elapsedTime * 6) * 0.006 * (spin + 0.3);
      flash.intensity = Math.max(0, flash.intensity - dt * 40);
      const fm = flashSprite.material as THREE.MeshBasicMaterial;
      fm.opacity = Math.max(0, fm.opacity - dt * 14);

      /* dinos */
      for (let di = dinos.length - 1; di >= 0; di--) {
        const d = dinos[di];
        if (d.dying > 0) {
          d.dying -= dt;
          d.grp.rotation.z = THREE.MathUtils.lerp(d.grp.rotation.z, Math.PI / 2, dt * 6);
          d.grp.position.y = THREE.MathUtils.lerp(d.grp.position.y, cellH(d.grp.position.x, d.grp.position.z) + 0.4 * d.scale, dt * 6);
          if (d.dying <= 0) {
            burst(d.grp.position.clone().add(new THREE.Vector3(0, 0.8, 0)), (d.mats[0].color.getHex()), 22, 5);
            scene.remove(d.grp);
            dinos.splice(di, 1);
            respawnQueue += 1;
          }
          continue;
        }
        if (d.flash > 0) {
          d.flash -= dt;
          const on = d.flash > 0 && Math.floor(d.flash * 40) % 2 === 0;
          for (const m of d.mats) m.emissive.setHex(on ? 0x991111 : 0x000000);
        }
        d.retarget -= dt;
        const toPlayer = player.clone().sub(d.grp.position).setY(0);
        const distP = toPlayer.length();
        let sp = d.speed;
        if (distP < 14) {
          // chase — but stop just short of the player so it stays visible
          // and hittable (a dino overlapping the camera can't be raycast).
          d.dir = Math.atan2(toPlayer.x, toPlayer.z);
          sp = distP < 2.3 ? 0 : d.speed * 1.8;
        }
        else if (d.retarget <= 0) { d.dir = Math.random() * Math.PI * 2; d.retarget = rng(2, 5); }
        d.grp.position.x += Math.sin(d.dir) * sp * dt;
        d.grp.position.z += Math.cos(d.dir) * sp * dt;
        d.grp.position.x = Math.max(-WORLD + 2, Math.min(WORLD - 2, d.grp.position.x));
        d.grp.position.z = Math.max(-WORLD + 2, Math.min(WORLD - 2, d.grp.position.z));
        d.grp.position.y = THREE.MathUtils.lerp(d.grp.position.y, cellH(d.grp.position.x, d.grp.position.z), dt * 8);
        // the model is built head-toward−z, movement is (+sin,+cos) — offset by π so it walks head-first
        d.grp.rotation.y = d.dir + Math.PI;
        const gait = Math.sin(clock.elapsedTime * 7 * (sp / d.speed) + di) * 0.5;
        d.legs[0].rotation.x = gait;
        d.legs[1].rotation.x = -gait;
      }
      if (respawnQueue > 0 && dinos.length < DINO_TARGET) {
        respawnQueue -= 1;
        dinos.push(buildDino());
      }

      /* grenades */
      for (let gi = grenades.length - 1; gi >= 0; gi--) {
        const g = grenades[gi];
        g.vel.y -= 20 * dt;
        g.mesh.position.addScaledVector(g.vel, dt);
        g.mesh.rotation.x += dt * 9; g.mesh.rotation.z += dt * 7;
        const gy = cellH(g.mesh.position.x, g.mesh.position.z) + 0.15;
        if (g.mesh.position.y < gy) {
          g.mesh.position.y = gy;
          g.vel.y = Math.abs(g.vel.y) * 0.42;
          g.vel.x *= 0.7; g.vel.z *= 0.7;
        }
        g.fuse -= dt;
        if (g.fuse <= 0) {
          explode(g.mesh.position.clone());
          scene.remove(g.mesh);
          grenades.splice(gi, 1);
        }
      }

      /* particles / tracers / rings / lights */
      for (let pi = particles.length - 1; pi >= 0; pi--) {
        const p = particles[pi];
        p.life -= dt;
        p.vel.y -= 14 * dt;
        p.mesh.position.addScaledVector(p.vel, dt);
        p.mesh.rotation.x += p.spin.x * dt; p.mesh.rotation.y += p.spin.y * dt;
        const gy = cellH(p.mesh.position.x, p.mesh.position.z) + 0.08;
        if (p.mesh.position.y < gy) { p.mesh.position.y = gy; p.vel.multiplyScalar(0.4); p.vel.y = 0; }
        if (p.life <= 0) { scene.remove(p.mesh); (p.mesh.material as THREE.Material).dispose(); particles.splice(pi, 1); }
      }
      for (let ti = tracers.length - 1; ti >= 0; ti--) {
        const t = tracers[ti];
        t.life -= dt;
        if (t.life <= 0) { scene.remove(t.mesh); t.mesh.geometry.dispose(); (t.mesh.material as THREE.Material).dispose(); tracers.splice(ti, 1); }
      }
      for (let ri = rings.length - 1; ri >= 0; ri--) {
        const r = rings[ri];
        r.life -= dt;
        r.mesh.scale.addScalar(dt * 26);
        (r.mesh.material as THREE.MeshBasicMaterial).opacity = Math.max(0, r.life / 0.35) * 0.85;
        if (r.life <= 0) { scene.remove(r.mesh); rings.splice(ri, 1); }
      }
      for (let bi = blastLights.length - 1; bi >= 0; bi--) {
        const b = blastLights[bi];
        b.life -= dt;
        b.light.intensity = Math.max(0, (b.life / 0.3)) * 30;
        if (b.life <= 0) { scene.remove(b.light); blastLights.splice(bi, 1); }
      }

      /* throttle HUD state sync to ~5 Hz so React work stays off the hot path */
      hudTimer -= dt;
      if (hudTimer <= 0) {
        hudTimer = 0.2;
        if (scoreAcc || killAcc) {
          // snapshot before queueing: React runs the updaters later, after
          // these accumulators have been reset
          const ds = scoreAcc, dk = killAcc;
          scoreAcc = 0; killAcc = 0;
          setScore((s) => s + ds);
          setKills((k) => k + dk);
        }
      }

      renderer.render(scene, camera);
    };
    tick();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('keydown', kd);
      window.removeEventListener('keyup', ku);
      window.removeEventListener('resize', onResize);
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('mouseup', onMouseUp);
      document.removeEventListener('pointerlockchange', onLockChange);
      renderer.domElement.removeEventListener('contextmenu', onContext);
      renderer.domElement.removeEventListener('touchstart', onTouchStart);
      renderer.domElement.removeEventListener('touchmove', onTouchMove);
      renderer.domElement.removeEventListener('touchend', onTouchEnd);
      if (document.pointerLockElement === renderer.domElement) document.exitPointerLock();
      delete (window as any).__dino;
      actx?.close().catch(() => {});
      renderer.dispose();
      mount.removeChild(renderer.domElement);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---------- virtual joystick (mobile) ---------- */
  const joyBase = useRef<HTMLDivElement>(null);
  const joyStick = useRef<HTMLDivElement>(null);
  const joyTouch = (e: React.TouchEvent) => {
    const base = joyBase.current, stick = joyStick.current;
    if (!base || !stick) return;
    const r = base.getBoundingClientRect();
    const t = e.touches[0];
    if (!t) { joyRef.current = { x: 0, y: 0 }; stick.style.transform = 'translate(0,0)'; return; }
    let dx = t.clientX - (r.left + r.width / 2);
    let dy = t.clientY - (r.top + r.height / 2);
    const max = r.width / 2;
    const l = Math.hypot(dx, dy);
    if (l > max) { dx = (dx / l) * max; dy = (dy / l) * max; }
    joyRef.current = { x: dx / max, y: dy / max };
    stick.style.transform = `translate(${dx}px,${dy}px)`;
  };
  const joyEnd = () => {
    joyRef.current = { x: 0, y: 0 };
    if (joyStick.current) joyStick.current.style.transform = 'translate(0,0)';
  };

  const mono: React.CSSProperties = { fontFamily: '"JetBrains Mono", monospace' };

  return (
    <div className="fixed inset-0 overflow-hidden bg-[#87c5eb]">
      <div ref={mountRef} className="absolute inset-0" />

      {/* crosshair */}
      {started && !paused && (
        <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white/90" style={mono}>
          <span className="text-xl leading-none drop-shadow">+</span>
        </div>
      )}

      {/* top bar */}
      <div className="absolute inset-x-0 top-0 z-20 flex items-center justify-between p-4">
        <button
          onClick={onHome}
          className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-black/40 px-4 py-2 text-xs font-semibold text-white/90 backdrop-blur-md transition-colors hover:border-white/50"
          style={mono}
        >
          ← Da Lei · 大雷
        </button>
        <div className="flex items-center gap-2" style={mono}>
          <span className="rounded-full border border-white/25 bg-black/40 px-3.5 py-2 text-xs text-white/90 backdrop-blur-md">
            🦖 ×{DINO_TARGET} · ☠️ {kills} · <span className="text-amber-300">{score}</span>
          </span>
          <button
            onClick={() => setSound((s) => !s)}
            className="rounded-full border border-white/25 bg-black/40 px-3 py-2 text-xs text-white/90 backdrop-blur-md"
            aria-label="Sound"
          >
            {sound ? '🔊' : '🔇'}
          </button>
        </div>
      </div>

      {/* start / pause overlay */}
      {(!started || paused) && (
        <div className="absolute inset-0 z-30 grid place-items-center bg-black/55 p-6 backdrop-blur-sm">
          <div className="max-w-md rounded-3xl border border-white/15 bg-black/60 p-8 text-center text-white shadow-2xl">
            <p className="text-xs uppercase tracking-[0.3em] text-amber-300" style={mono}>Dino Blaster</p>
            <h1 className="mt-3 text-3xl font-bold">🦖 加特林 vs 恐龙</h1>
            <p className="mt-3 text-sm leading-relaxed text-white/70">
              Minecraft 风格方块世界。恐龙会游荡、也会扑向你 —— 按住开火让加特林转起来,扔手雷炸一窝。
            </p>
            <div className="mt-5 grid gap-1.5 text-left text-[13px] text-white/75" style={mono}>
              {isTouch ? (
                <>
                  <span>🕹️ 左下摇杆移动 · 右侧拖动视角</span>
                  <span>🔥 按住 FIRE 扫射 · 💣 点手雷键投掷</span>
                </>
              ) : (
                <>
                  <span>WASD 移动 · 鼠标视角 · Space 跳</span>
                  <span>按住左键 扫射 · 右键 / G 扔手雷</span>
                  <span>Shift 跑 · M 声音 · Esc 暂停</span>
                </>
              )}
            </div>
            <button
              onClick={() => startFnRef.current()}
              className="mt-6 w-full rounded-full bg-amber-400 px-6 py-3 text-sm font-bold text-black transition-transform hover:scale-[1.02]"
              style={mono}
            >
              {paused ? '▶ 继续游戏' : '▶ 点击开始'}
            </button>
            <p className="mt-4 text-[11px] text-white/40" style={mono}>
              Generated with Claude Fable 5 · three.js · zero assets
            </p>
          </div>
        </div>
      )}

      {/* mobile controls */}
      {isTouch && started && !paused && (
        <>
          <div
            ref={joyBase}
            onTouchStart={joyTouch}
            onTouchMove={joyTouch}
            onTouchEnd={joyEnd}
            className="absolute bottom-8 left-6 z-20 h-28 w-28 rounded-full border border-white/30 bg-black/25 backdrop-blur-sm"
          >
            <div ref={joyStick} className="absolute left-1/2 top-1/2 -ml-6 -mt-6 h-12 w-12 rounded-full bg-white/45" />
          </div>
          <div className="absolute bottom-8 right-6 z-20 flex flex-col items-end gap-3">
            <button
              onTouchStart={(e) => { e.preventDefault(); grenadeRef.current = true; }}
              className="grid h-14 w-14 place-items-center rounded-full border border-white/30 bg-black/35 text-2xl backdrop-blur-sm"
              aria-label="Grenade"
            >
              💣
            </button>
            <button
              onTouchStart={(e) => { e.preventDefault(); fireRef.current = true; }}
              onTouchEnd={() => { fireRef.current = false; }}
              className="grid h-20 w-20 place-items-center rounded-full border-2 border-amber-300/70 bg-amber-400/30 text-sm font-bold text-white backdrop-blur-sm"
              style={mono}
            >
              FIRE
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default DinoBlaster;
