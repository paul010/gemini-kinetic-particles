import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';

/* ---------------------------------------------------------------------------
 * /quyoubus — 趣游巴士 · AI 夜游.
 *
 * A browser remake of Chengdu's real-world immersive "Quyou Bus" night tour:
 * a first-person three.js cabin that drives past a procedural night city,
 * an AI host「阿绿」who announces stations, narrates city culture and runs
 * games (Sichuan-dialect guessing / old-song trivia / open mic), ending with
 * a tear-off night-tour ticket. Runs FULLY offline from built-in content —
 * no backend required. All 3D, copy and question banks are original.
 *
 * (An optional AI_ENDPOINT proxy could swap the offline banks for live
 * generation; left blank here so the page always completes on its own.)
 * ------------------------------------------------------------------------- */

type Lang = 'en' | 'zh' | 'zhHant';
interface T { en: string; zh: string }
const STORAGE_KEY = 'dalei-lang-v2';
const detectInitialLang = (): Lang => {
  if (typeof window === 'undefined') return 'en';
  const s = window.localStorage.getItem(STORAGE_KEY);
  return s === 'zh' || s === 'zhHant' ? s : 'en';
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

/* ============================ content ================================= */

type Game = 'dialect' | 'song' | 'openmic';
interface Station { name: T; icon: string; blurb: T; game: Game }
const STATIONS: Station[] = [
  { name: { en: 'Chunxi Road', zh: '春熙路' }, icon: '🛍️', game: 'dialect',
    blurb: { en: 'Chengdu’s century-old shopping heart — neon, crowds, street performers. Our party bus pulls out from here.', zh: '成都百年商业中心，霓虹、人潮、街头艺人。我们的派对巴士从这里出发。' } },
  { name: { en: 'Taikoo Li', zh: '太古里' }, icon: '🏮', game: 'song',
    blurb: { en: 'Low-rise lanes wrapped around the 1000-year-old Daci Temple — old bricks meet luxury flagships.', zh: '环绕千年大慈寺的低层街区，青砖古刹与奢侈品旗舰混搭。' } },
  { name: { en: 'Hejiang Pavilion', zh: '合江亭' }, icon: '🌉', game: 'dialect',
    blurb: { en: 'Where the Fu and Nan rivers meet — the romantic riverside spot lit up along the Jinjiang.', zh: '府河与南河交汇处，锦江畔最浪漫的灯影之地。' } },
  { name: { en: '339 TV Tower', zh: '339 电视塔' }, icon: '🗼', game: 'openmic',
    blurb: { en: '339 metres over the Jinjiang — the tower’s light show is the finale of tonight’s ride.', zh: '锦江边 339 米高塔，塔身灯光秀是今晚这趟车的压轴。' } },
];

interface QA { q: T; opts: T[]; ans: number }
const DIALECT: QA[] = [
  { q: { en: 'What does 「巴适」 mean?', zh: '「巴适」是什么意思？' }, opts: [{ en: 'comfy / great', zh: '舒服、安逸' }, { en: 'terrible', zh: '糟糕透了' }, { en: 'hurry up', zh: '快点走' }, { en: 'weird', zh: '奇奇怪怪' }], ans: 0 },
  { q: { en: 'What does 「摆龙门阵」 mean?', zh: '「摆龙门阵」是什么意思？' }, opts: [{ en: 'chit-chat', zh: '闲聊摆谈' }, { en: 'line up a battle', zh: '摆阵打仗' }, { en: 'set the table', zh: '摆桌子' }, { en: 'play mahjong', zh: '打麻将' }], ans: 0 },
  { q: { en: 'What does 「打牙祭」 mean?', zh: '「打牙祭」是什么意思？' }, opts: [{ en: 'treat yourself to a good meal', zh: '难得吃顿好的' }, { en: 'see the dentist', zh: '去看牙医' }, { en: 'brush teeth', zh: '刷牙' }, { en: 'a festival', zh: '过节' }], ans: 0 },
  { q: { en: 'What does 「归一」 mean (Sichuan)?', zh: '四川话「归一」是什么意思？' }, opts: [{ en: 'done / sorted', zh: '搞定、弄完' }, { en: 'go home', zh: '回家' }, { en: 'number one', zh: '第一名' }, { en: 'unite', zh: '统一' }], ans: 0 },
  { q: { en: 'What does 「安逸」 mean?', zh: '「安逸」是什么意思？' }, opts: [{ en: 'blissfully comfy', zh: '舒坦惬意' }, { en: 'anxious', zh: '焦虑' }, { en: 'boring', zh: '无聊' }, { en: 'expensive', zh: '很贵' }], ans: 0 },
  { q: { en: 'What does 「瓜娃子」 mean (teasing)?', zh: '「瓜娃子」（戏称）是什么意思？' }, opts: [{ en: 'silly kid (affectionate)', zh: '傻孩子（爱称）' }, { en: 'melon seller', zh: '卖瓜的' }, { en: 'genius', zh: '天才' }, { en: 'stranger', zh: '陌生人' }], ans: 0 },
  { q: { en: 'What does 「造孽」 mean (Sichuan)?', zh: '四川话「造孽」多用来表达？' }, opts: [{ en: 'poor thing / pitiful', zh: '可怜、造孽' }, { en: 'commit a crime', zh: '犯罪' }, { en: 'delicious', zh: '好吃' }, { en: 'lucky', zh: '幸运' }], ans: 0 },
];
const SONG: QA[] = [
  { q: { en: 'Who sings 《成都》?', zh: '《成都》是谁唱的？' }, opts: [{ en: '赵雷 Zhao Lei', zh: '赵雷' }, { en: '李荣浩', zh: '李荣浩' }, { en: '毛不易', zh: '毛不易' }, { en: '陈粒', zh: '陈粒' }], ans: 0 },
  { q: { en: 'Who sings 《山丘》?', zh: '《山丘》是谁唱的？' }, opts: [{ en: '李宗盛 Jonathan Lee', zh: '李宗盛' }, { en: '罗大佑', zh: '罗大佑' }, { en: '周华健', zh: '周华健' }, { en: '张学友', zh: '张学友' }], ans: 0 },
  { q: { en: 'Which era is 《我们不一样》from?', zh: '《我们不一样》大致是哪个年代的？' }, opts: [{ en: '2010s', zh: '2010 年代' }, { en: '1980s', zh: '1980 年代' }, { en: '1990s', zh: '1990 年代' }, { en: '2000s', zh: '2000 年代' }], ans: 0 },
  { q: { en: 'Who sings 《晴天》?', zh: '《晴天》是谁唱的？' }, opts: [{ en: '周杰伦 Jay Chou', zh: '周杰伦' }, { en: '林俊杰', zh: '林俊杰' }, { en: '王力宏', zh: '王力宏' }, { en: '潘玮柏', zh: '潘玮柏' }], ans: 0 },
  { q: { en: '《月亮代表我的心》is most tied to which singer?', zh: '《月亮代表我的心》最常与哪位歌手联系在一起？' }, opts: [{ en: '邓丽君 Teresa Teng', zh: '邓丽君' }, { en: '梅艳芳', zh: '梅艳芳' }, { en: '王菲', zh: '王菲' }, { en: '蔡琴', zh: '蔡琴' }], ans: 0 },
  { q: { en: 'Who sings 《平凡之路》?', zh: '《平凡之路》是谁唱的？' }, opts: [{ en: '朴树 Pu Shu', zh: '朴树' }, { en: '许巍', zh: '许巍' }, { en: '汪峰', zh: '汪峰' }, { en: '朴信惠', zh: '朴信惠' }], ans: 0 },
];

const HOST = {
  welcome: { en: 'Yo! I’m Green, your host tonight. Grab a handle — the Quyou Bus is rolling out from Chunxi Road! 🎤', zh: '哟！我是今晚的主理人阿绿，抓稳拉环 —— 趣游巴士从春熙路发车咯！🎤' },
  arrive: (s: T): T => ({ en: `Next stop: ${s.en}. Look out the window! 🌃`, zh: `下一站到咯：${s.zh}。往窗外看！🌃` }),
  toGame: { dialect: { en: 'Time for 「方言猜猜猜」— can you talk like a local? 🀄', zh: '来盘「方言猜猜猜」—— 看你巴不巴适！🀄' }, song: { en: 'Old-song archaeology! Four choices, no peeking. 🎶', zh: '老歌考古四选一，不许偷看！🎶' }, openmic: { en: 'Open mic! The floor — and the tower lights — are yours. 🎙️', zh: '开放麦时间！这束光和塔灯都归你。🎙️' } } as Record<Game, T>,
  right: [{ en: 'Baaashi! Local through and through. 🔥', zh: '巴适得板！地道成都人。🔥' }, { en: 'Nailed it — the bus roars for you! 🎉', zh: '答对咯 —— 全车为你欢呼！🎉' }],
  wrong: [{ en: 'Aiya, close! The bus forgives you. 😆', zh: '哎呀差点点，全车原谅你。😆' }, { en: 'Not quite — but the vibe’s still bashi. 🫶', zh: '没对上，不过气氛还是巴适。🫶' }],
};
const OPENMIC_HYPE: T[] = [
  { en: 'The whole bus is clapping — that was pure gold! 👏', zh: '全车都在拍手 —— 你这段太顶了！👏' },
  { en: 'Green tips his afro to you. Encore! 🎤', zh: '阿绿对你脱帽致敬，返场！🎤' },
  { en: 'Chengdu nights just got 10% more fun because of you. 🌟', zh: '就因为你，成都的夜又好玩了 10%。🌟' },
];
const TITLES: { min: number; title: T }[] = [
  { min: 5, title: { en: 'Honorary Chengdu Local 🐼', zh: '荣誉成都土著 🐼' } },
  { min: 3, title: { en: 'Night-Bus Regular 🌃', zh: '夜巴常客 🌃' } },
  { min: 0, title: { en: 'First-time Rider 🎫', zh: '初次上车乘客 🎫' } },
];
const BLESSINGS: T[] = [
  { en: 'May every ride you take be this bashi. 🚌', zh: '愿你往后每一趟车，都这么巴适。🚌' },
  { en: 'Keep the party moving, wherever you go. ✨', zh: '把这份热闹，带去你要去的每个地方。✨' },
];

/* ============================ page ==================================== */

interface Props { onHome: () => void }
type Phase = 'boarding' | 'riding' | 'narrate' | 'game' | 'result' | 'ended';

const QuyouBus: React.FC<Props> = ({ onHome }) => {
  const [lang, setLang] = useState<Lang>(detectInitialLang);
  const s2t = useS2T(lang === 'zhHant');
  const t = (x: T) => (lang === 'en' ? x.en : lang === 'zhHant' ? (s2t ? s2t(x.zh) : x.zh) : x.zh);
  useEffect(() => { if (typeof window !== 'undefined') window.localStorage.setItem(STORAGE_KEY, lang); }, [lang]);

  const [phase, setPhase] = useState<Phase>('boarding');
  const [sIdx, setSIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [q, setQ] = useState<QA | null>(null);
  const [picked, setPicked] = useState<number | null>(null);
  const [mic, setMic] = useState('');
  const [micDone, setMicDone] = useState<T | null>(null);
  const bankIdx = useRef({ dialect: 0, song: 0 });

  const phaseRef = useRef(phase); phaseRef.current = phase;
  const sIdxRef = useRef(sIdx); sIdxRef.current = sIdx;
  const station = STATIONS[sIdx];

  const startGame = () => {
    const g = station.game;
    if (g === 'openmic') { setPhase('game'); return; }
    const bank = g === 'dialect' ? DIALECT : SONG;
    const i = bankIdx.current[g] % bank.length; bankIdx.current[g] += 1;
    setQ(bank[i]); setPicked(null); setPhase('game');
  };
  const answer = (i: number) => {
    if (picked !== null || !q) return;
    setPicked(i);
    if (i === q.ans) setScore((s) => s + 1);
    window.setTimeout(() => setPhase('result'), 900);
  };
  const submitMic = () => {
    if (!mic.trim()) return;
    const hype = OPENMIC_HYPE[Math.min(OPENMIC_HYPE.length - 1, Math.floor(mic.trim().length / 12))];
    setScore((s) => s + 1); setMicDone(hype); setPhase('result');
  };
  const next = () => {
    if (sIdx < STATIONS.length - 1) { setSIdx((n) => n + 1); setQ(null); setPicked(null); setMic(''); setMicDone(null); setPhase('riding'); }
    else setPhase('ended');
  };
  const restart = () => { setSIdx(0); setScore(0); setQ(null); setPicked(null); setMic(''); setMicDone(null); bankIdx.current = { dialect: 0, song: 0 }; setPhase('boarding'); };

  /* ---------------- three.js cabin (vivid party-bus remake) ---------------- */
  const mountRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const mount = mountRef.current; if (!mount) return;
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.15;
    const W = mount.clientWidth, H = mount.clientHeight || 500;
    renderer.setSize(W, H); mount.appendChild(renderer.domElement);

    // per-station lighting theme (green / magenta / teal / gold)
    const THEMES = [0x39d353, 0xe83f9e, 0x21c7b8, 0xffcf33].map((c) => new THREE.Color(c));

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0e0c22);
    scene.fog = new THREE.Fog(0x0e0c22, 26, 68);
    const camera = new THREE.PerspectiveCamera(72, W / H, 0.1, 220);
    camera.position.set(0, 2.5, 7.6); camera.lookAt(0, 1.9, -8);

    scene.add(new THREE.HemisphereLight(0x9fb0ff, 0x2a1840, 1.15));
    const warm = new THREE.PointLight(0xffcf88, 1.8, 34); warm.position.set(0, 4.4, 0); scene.add(warm);
    const warm2 = new THREE.PointLight(0xffb060, 1.2, 26); warm2.position.set(0, 4, -8); scene.add(warm2);
    // three orbiting disco lights
    const disco1 = new THREE.PointLight(0x39d353, 1.1, 20); scene.add(disco1);
    const disco2 = new THREE.PointLight(0xe83f9e, 1.1, 20); scene.add(disco2);
    const disco3 = new THREE.PointLight(0x21c7b8, 1.1, 20); scene.add(disco3);

    const mat = (c: number, o: Partial<THREE.MeshStandardMaterialParameters> = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.6, ...o });

    // cabin shell
    const floor = new THREE.Mesh(new THREE.BoxGeometry(4.6, 0.2, 44), mat(0x241f3e, { metalness: 0.3, roughness: 0.4 })); floor.position.set(0, 0.4, -9); scene.add(floor);
    const ceil = new THREE.Mesh(new THREE.BoxGeometry(4.6, 0.2, 44), mat(0x1b1836)); ceil.position.set(0, 5.3, -9); scene.add(ceil);
    // glowing aisle strips
    [-0.55, 0.55].forEach((x, i) => { const strip = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.04, 44), new THREE.MeshStandardMaterial({ color: i ? 0x21c7b8 : 0xe83f9e, emissive: i ? 0x21c7b8 : 0xe83f9e, emissiveIntensity: 1.3 })); strip.position.set(x, 0.52, -9); scene.add(strip); });
    [-2.3, 2.3].forEach((x) => { const wall = new THREE.Mesh(new THREE.BoxGeometry(0.2, 1.7, 44), mat(0x2a2350)); wall.position.set(x, 1.4, -9); scene.add(wall); const top = new THREE.Mesh(new THREE.BoxGeometry(0.2, 1.1, 44), mat(0x2a2350)); top.position.set(x, 4.6, -9); scene.add(top); });

    // seats (glowing yellow & teal)
    const seatCols = [{ x: -1.45, c: 0xffcf33 }, { x: 1.45, c: 0x2fd0c0 }];
    for (let r = 0; r < 9; r++) {
      const z = -1 - r * 2.4;
      seatCols.forEach((col) => {
        const seat = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.36, 0.95), mat(col.c, { emissive: col.c, emissiveIntensity: 0.28 })); seat.position.set(col.x, 1.08, z); scene.add(seat);
        const back = new THREE.Mesh(new THREE.BoxGeometry(1.15, 1.05, 0.24), mat(col.c, { emissive: col.c, emissiveIntensity: 0.28 })); back.position.set(col.x, 1.6, z - 0.36); scene.add(back);
      });
    }

    // poles + swinging grab handles (glowing)
    const handles: { grp: THREE.Group; ph: number }[] = [];
    for (let r = 0; r < 8; r++) {
      const z = -1.4 - r * 2.6;
      [-0.72, 0.72].forEach((x) => {
        const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 3.5, 10), mat(0xe83f9e, { emissive: 0xe83f9e, emissiveIntensity: 0.7, roughness: 0.3 })); pole.position.set(x, 3.05, z); scene.add(pole);
        const grp = new THREE.Group(); grp.position.set(x, 3.5, z);
        const strap = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.5, 6), mat(0xffcf33, { emissive: 0xffcf33, emissiveIntensity: 0.5 })); strap.position.y = -0.25; grp.add(strap);
        const ring = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.045, 8, 18), mat(0xffcf33, { emissive: 0xffcf33, emissiveIntensity: 0.6 })); ring.position.y = -0.52; grp.add(ring);
        scene.add(grp); handles.push({ grp, ph: r + x });
      });
    }

    // ceiling string-light bulbs (bright warm)
    const bulbs: THREE.Mesh[] = [];
    for (let r = 0; r < 24; r++) { const z = 2 - r * 2.0; const b = new THREE.Mesh(new THREE.SphereGeometry(0.11, 10, 10), new THREE.MeshBasicMaterial({ color: 0xffe0a0 })); b.position.set((r % 2 ? -0.85 : 0.85), 4.8, z); scene.add(b); bulbs.push(b); }
    // festive tinsel curtain
    const tinsel = new THREE.Group();
    for (let i = 0; i < 90; i++) { const s = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.55, 0.025), new THREE.MeshStandardMaterial({ color: [0x21c7b8, 0xe83f9e, 0xffcf33, 0x7ab8ff][i % 4], emissive: [0x21c7b8, 0xe83f9e, 0xffcf33, 0x7ab8ff][i % 4], emissiveIntensity: 0.6, metalness: 0.8, roughness: 0.3 })); s.position.set((Math.random() - 0.5) * 4.2, 5.05, 2 - Math.random() * 40); tinsel.add(s); }
    scene.add(tinsel);
    // disco ball with its own light
    const disco = new THREE.Mesh(new THREE.IcosahedronGeometry(0.42, 1), new THREE.MeshStandardMaterial({ color: 0xdfe6ff, metalness: 1, roughness: 0.15, emissive: 0x334, emissiveIntensity: 0.4, flatShading: true })); disco.position.set(0, 4.5, -3); scene.add(disco);
    const discoLight = new THREE.PointLight(0xffffff, 0.6, 14); discoLight.position.set(0, 4.2, -3); scene.add(discoLight);

    // host「阿绿」— brought closer, spotlit
    const host = new THREE.Group(); host.position.set(0, 0.5, -8.2); host.scale.setScalar(1.15);
    const legs = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.3, 1.2, 12), mat(0x2a3a58)); legs.position.y = 0.6; host.add(legs);
    const jacket = new THREE.Mesh(new THREE.CylinderGeometry(0.44, 0.38, 1.05, 14), mat(0xe23b30, { emissive: 0x3a0805, emissiveIntensity: 0.5 })); jacket.position.y = 1.62; host.add(jacket);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.32, 18, 18), mat(0xf0c9a0)); head.position.y = 2.38; host.add(head);
    const afro = new THREE.Mesh(new THREE.SphereGeometry(0.46, 18, 18), new THREE.MeshStandardMaterial({ color: 0x39d353, roughness: 1, emissive: 0x1e7a2e, emissiveIntensity: 0.7 })); afro.position.y = 2.54; afro.scale.set(1, 0.92, 1); host.add(afro);
    const shades = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.15, 0.06), mat(0x0a0a12, { metalness: 0.6 })); shades.position.set(0, 2.4, 0.3); host.add(shades);
    const boom = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.42, 0.26), mat(0xe8e8e8, { emissive: 0x222, emissiveIntensity: 0.3 })); boom.position.set(0, 1.5, 0.46); host.add(boom);
    scene.add(host);
    // spotlight cone on host
    const cone = new THREE.Mesh(new THREE.ConeGeometry(1.1, 3.2, 24, 1, true), new THREE.MeshBasicMaterial({ color: 0x39d353, transparent: true, opacity: 0.08, side: THREE.DoubleSide, depthWrite: false })); cone.position.set(0, 3.4, -8.2); scene.add(cone);
    const hostSpot = new THREE.SpotLight(0xffffff, 2.2, 12, Math.PI / 7, 0.5); hostSpot.position.set(0, 5, -7.2); hostSpot.target = host; scene.add(hostSpot); scene.add(hostSpot.target);

    // outside night city — brighter recycled buildings + neon billboards
    const winTexes: THREE.CanvasTexture[] = [];
    for (let k = 0; k < 6; k++) {
      const cv = document.createElement('canvas'); cv.width = 64; cv.height = 128; const cx = cv.getContext('2d')!;
      cx.fillStyle = '#100d24'; cx.fillRect(0, 0, 64, 128);
      const pal = ['#ffe0a0', '#2fd0c0', '#ff6ec7', '#ff9a3c', '#8ec8ff', '#c78bff'];
      for (let y = 5; y < 128; y += 10) for (let x = 5; x < 64; x += 10) { if (Math.random() < 0.62) { cx.fillStyle = pal[(k + x + y) % pal.length]; cx.globalAlpha = 0.6 + Math.random() * 0.4; cx.fillRect(x, y, 6, 6); } }
      cx.globalAlpha = 1; const tx = new THREE.CanvasTexture(cv); winTexes.push(tx);
    }
    const buildings: THREE.Mesh[] = [];
    const billboards: THREE.Mesh[] = [];
    const SPAN = 72;
    for (let i = 0; i < 38; i++) {
      const side = i % 2 ? 1 : -1; const h = 7 + Math.random() * 20; const w = 3 + Math.random() * 3.5;
      const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, 3.6), new THREE.MeshStandardMaterial({ map: winTexes[i % winTexes.length], emissive: 0x2a2a55, emissiveIntensity: 0.85, color: 0x342b62 }));
      b.position.set(side * (5.5 + Math.random() * 7), h / 2 - 0.5, -Math.random() * SPAN);
      scene.add(b); buildings.push(b);
      if (i % 4 === 0) { const bb = new THREE.Mesh(new THREE.PlaneGeometry(3, 2), new THREE.MeshBasicMaterial({ color: [0xff6ec7, 0x2fd0c0, 0xffcf33, 0xff9a3c][i % 4] })); bb.position.set(side * 4.6, 2 + Math.random() * 8, b.position.z); bb.rotation.y = side > 0 ? -Math.PI / 2 : Math.PI / 2; scene.add(bb); billboards.push(bb); }
    }
    // 339 tower ahead
    const tower = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 1.3, 34, 14), mat(0x342b62, { emissive: 0x223, emissiveIntensity: 0.7 })); tower.position.set(6, 16, -60); scene.add(tower);
    const towerRing = new THREE.Mesh(new THREE.TorusGeometry(1.5, 0.16, 10, 28), new THREE.MeshBasicMaterial({ color: 0x2fd0c0 })); towerRing.position.set(6, 25, -60); towerRing.rotation.x = Math.PI / 2; scene.add(towerRing);
    const moon = new THREE.Mesh(new THREE.CircleGeometry(2.4, 32), new THREE.MeshBasicMaterial({ color: 0xf4e8c0, fog: false })); moon.position.set(-16, 20, -64); scene.add(moon);

    // pointer-drag to look around
    let yaw = 0, pitch = 0, drag = false, px = 0, py = 0;
    const dom = renderer.domElement;
    const down = (e: PointerEvent) => { drag = true; px = e.clientX; py = e.clientY; };
    const move = (e: PointerEvent) => { if (!drag) return; yaw = THREE.MathUtils.clamp(yaw - (e.clientX - px) * 0.004, -0.75, 0.75); pitch = THREE.MathUtils.clamp(pitch - (e.clientY - py) * 0.003, -0.28, 0.4); px = e.clientX; py = e.clientY; };
    const up = () => { drag = false; };
    dom.addEventListener('pointerdown', down); window.addEventListener('pointermove', move); window.addEventListener('pointerup', up);

    const themeCol = new THREE.Color(0x39d353);
    const clock = new THREE.Clock(); let raf = 0; let speed = 0;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      const el = clock.getElapsedTime();
      const riding = phaseRef.current === 'riding' || phaseRef.current === 'boarding';
      speed += ((riding ? 0.5 : 0) - speed) * 0.03;
      buildings.forEach((b) => { b.position.z += speed; if (b.position.z > 12) b.position.z -= SPAN; });
      billboards.forEach((b) => { b.position.z += speed; if (b.position.z > 12) b.position.z -= SPAN; });
      // per-station theme tint on fog/background + accent
      themeCol.lerp(THEMES[sIdxRef.current] || THEMES[0], 0.02);
      (scene.background as THREE.Color).setRGB(0.055 + themeCol.r * 0.06, 0.048 + themeCol.g * 0.06, 0.13 + themeCol.b * 0.05);
      scene.fog!.color.copy(scene.background as THREE.Color);
      (cone.material as THREE.MeshBasicMaterial).color.copy(themeCol);
      hostSpot.color.copy(themeCol).lerp(new THREE.Color(0xffffff), 0.5);
      // orbiting disco lights
      disco1.position.set(Math.cos(el * 1.2) * 2, 3.6, -3 + Math.sin(el * 1.2) * 2);
      disco2.position.set(Math.cos(el * 1.2 + 2.1) * 2, 3.6, -3 + Math.sin(el * 1.2 + 2.1) * 2);
      disco3.position.set(Math.cos(el * 1.2 + 4.2) * 2, 3.6, -3 + Math.sin(el * 1.2 + 4.2) * 2);
      // bus bumps
      camera.position.y = 2.5 + Math.sin(el * 8) * 0.035 * (0.4 + speed);
      const bump = Math.sin(el * 6) * 0.012 * (0.4 + speed);
      camera.rotation.set(pitch + bump, yaw, Math.sin(el * 5) * 0.007 * (0.3 + speed));
      handles.forEach((h) => { h.grp.rotation.z = Math.sin(el * 2 + h.ph) * 0.2 * (0.4 + speed); });
      disco.rotation.y = el * 1.0; disco.rotation.x = el * 0.3;
      discoLight.color.setHSL((el * 0.2) % 1, 0.8, 0.6);
      const talking = phaseRef.current === 'narrate' || phaseRef.current === 'result' || phaseRef.current === 'boarding';
      host.position.y = 0.5 + (talking ? Math.abs(Math.sin(el * 6)) * 0.1 : Math.sin(el * 2) * 0.02);
      host.rotation.y = Math.sin(el * 1.1) * 0.12;
      towerRing.scale.setScalar(1 + Math.sin(el * 2) * 0.06);
      bulbs.forEach((b, i) => (b.material as THREE.MeshBasicMaterial).color.setHSL(0.11, 0.9, 0.62 + Math.sin(el * 3 + i) * 0.12));
      renderer.render(scene, camera);
    };
    loop();

    const onResize = () => { const w = mount.clientWidth, h = mount.clientHeight || 500; renderer.setSize(w, h); camera.aspect = w / h; camera.updateProjectionMatrix(); };
    const ro = new ResizeObserver(onResize); ro.observe(mount); window.addEventListener('resize', onResize);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); window.removeEventListener('resize', onResize); dom.removeEventListener('pointerdown', down); window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); renderer.dispose(); if (dom.parentNode === mount) mount.removeChild(dom); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const LANGS: { code: Lang; label: string }[] = [{ code: 'en', label: 'EN' }, { code: 'zh', label: '简' }, { code: 'zhHant', label: '繁' }];
  const title = TITLES.find((x) => score >= x.min)!.title;
  const hostLine: T = phase === 'boarding' ? HOST.welcome
    : phase === 'narrate' ? station.blurb
    : phase === 'game' ? HOST.toGame[station.game]
    : phase === 'result' ? (station.game === 'openmic' ? (micDone || HOST.right[0]) : (picked === q?.ans ? HOST.right[sIdx % 2] : HOST.wrong[sIdx % 2]))
    : HOST.arrive(station.name);

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[#0b0a1c] font-sans text-white">
      <div ref={mountRef} className="absolute inset-0" />
      {/* scrim for legibility */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[#0b0a1c] via-[#0b0a1c]/70 to-transparent" />

      {/* top LED destination bar */}
      <header className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <button onClick={onHome} className="pointer-events-auto rounded-full border border-white/20 bg-black/40 px-4 py-2 font-mono text-xs text-white/80 backdrop-blur-md transition-colors hover:text-white">← Da Lei · 大雷</button>
        <div className="pointer-events-auto flex items-center gap-2 rounded-full border-2 border-[#39d353]/60 bg-[#0b0a1c]/80 px-4 py-1.5" style={{ boxShadow: '0 0 18px rgba(57,211,83,0.35)' }}>
          <span className="pulse-dot h-2 w-2 rounded-full bg-[#39d353]" />
          <span className="font-mono text-[13px] font-bold tracking-wide text-[#39d353]" style={{ textShadow: '0 0 8px rgba(57,211,83,0.8)' }}>
            {phase === 'ended' ? t({ en: 'TERMINUS · thanks for riding', zh: '终点站 · 谢谢乘坐' }) : `${phase === 'riding' ? t({ en: 'NEXT', zh: '下一站' }) : t({ en: 'NOW', zh: '本站' })} ▸ ${t(station.name)} ${station.icon}`}
          </span>
        </div>
        <div className="pointer-events-auto flex overflow-hidden rounded-full border border-white/20 bg-black/40 backdrop-blur-md">
          {LANGS.map((l) => (<button key={l.code} onClick={() => setLang(l.code)} className={`px-2.5 py-1 font-mono text-[11px] transition-colors ${lang === l.code ? 'bg-white text-[#0b0a1c]' : 'text-white/60'}`}>{l.label}</button>))}
        </div>
      </header>

      {/* score chip */}
      <div className="pointer-events-none absolute right-4 top-16 z-20 sm:right-6">
        <span className="rounded-full bg-[#e83f9e]/85 px-3 py-1 font-mono text-[12px] font-bold text-white">🎉 {score}</span>
      </div>

      {/* host + interaction card */}
      <div className="absolute inset-x-0 bottom-0 z-20 px-4 pb-6 sm:px-6">
        <div className="mx-auto max-w-2xl">
          {/* host speech */}
          <div className="mb-3 flex items-start gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#39d353] text-xl shadow-lg">🕶️</span>
            <p className="rounded-2xl rounded-tl-sm border border-white/10 bg-black/55 px-4 py-2.5 text-[14px] leading-relaxed text-white backdrop-blur-md">
              <b className="mr-1 text-[#39d353]">{t({ en: 'Green', zh: '阿绿' })}:</b>{t(hostLine)}
            </p>
          </div>

          {/* dynamic panel */}
          <div className="rounded-3xl border border-white/10 bg-black/55 p-4 backdrop-blur-md sm:p-5">
            {phase === 'boarding' && (
              <div className="flex flex-col items-center gap-3 text-center">
                <p className="text-sm text-white/70">{t({ en: 'A 3D remake of Chengdu’s immersive night-tour party bus. Drag to look around the cabin.', zh: '成都沉浸式夜游派对巴士的 3D 复刻。拖动可环视车厢。' })}</p>
                <button onClick={() => setPhase('riding')} className="btn-sheen rounded-full bg-[#e83f9e] px-7 py-3 font-mono text-sm font-bold text-white shadow-lg transition-transform hover:scale-105">🚌 {t({ en: 'Board & roll out', zh: '上车发车' })}</button>
              </div>
            )}

            {phase === 'riding' && (
              <div className="flex flex-col items-center gap-3 text-center">
                <p className="font-mono text-xs uppercase tracking-widest text-white/50">{t({ en: 'cruising the Jinjiang…', zh: '锦江夜色行驶中…' })}</p>
                <button onClick={() => setPhase('narrate')} className="btn-sheen rounded-full bg-[#21c7b8] px-7 py-3 font-mono text-sm font-bold text-[#06231f] shadow-lg transition-transform hover:scale-105">📍 {t({ en: `Arrive at ${t(station.name)}`, zh: `到站 · ${t(station.name)}` })}</button>
              </div>
            )}

            {phase === 'narrate' && (
              <div className="flex flex-col items-center gap-3 text-center">
                <button onClick={startGame} className="btn-sheen rounded-full bg-[#ffcf33] px-7 py-3 font-mono text-sm font-bold text-[#2a2200] shadow-lg transition-transform hover:scale-105">▶ {t({ en: 'Start the game', zh: '开始游戏' })}</button>
              </div>
            )}

            {phase === 'game' && station.game !== 'openmic' && q && (
              <div>
                <p className="mb-3 text-center text-[15px] font-semibold">{t(q.q)}</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {q.opts.map((o, i) => (
                    <button key={i} onClick={() => answer(i)} disabled={picked !== null}
                      className={`rounded-xl border px-4 py-2.5 text-left text-sm transition-colors ${picked === null ? 'border-white/15 bg-white/5 hover:border-[#39d353]/60 hover:bg-white/10' : i === q.ans ? 'border-[#39d353] bg-[#39d353]/20' : i === picked ? 'border-[#e83f9e] bg-[#e83f9e]/20' : 'border-white/10 bg-white/5 opacity-60'}`}>
                      <span className="mr-1.5 font-mono text-white/40">{String.fromCharCode(65 + i)}</span>{t(o)}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {phase === 'game' && station.game === 'openmic' && (
              <div className="flex flex-col gap-3">
                <p className="text-center text-sm text-white/70">{t({ en: 'Say anything — a rhyme, a shout-out, a bad joke. Green will hype you.', zh: '随便说点 —— 一句打油诗、一声呐喊、一个冷笑话，阿绿给你捧场。' })}</p>
                <textarea value={mic} onChange={(e) => setMic(e.target.value)} rows={2} placeholder={t({ en: 'grab the mic…', zh: '接过话筒…' })} className="w-full resize-none rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-white outline-none placeholder:text-white/30 focus:border-[#39d353]/60" />
                <button onClick={submitMic} disabled={!mic.trim()} className="btn-sheen self-center rounded-full bg-[#e83f9e] px-7 py-2.5 font-mono text-sm font-bold text-white shadow-lg transition-transform hover:scale-105 disabled:opacity-40">🎙️ {t({ en: 'Drop it', zh: '来一段' })}</button>
              </div>
            )}

            {phase === 'result' && (
              <div className="flex flex-col items-center gap-3 text-center">
                <button onClick={next} className="btn-sheen rounded-full bg-[#21c7b8] px-7 py-3 font-mono text-sm font-bold text-[#06231f] shadow-lg transition-transform hover:scale-105">
                  {sIdx < STATIONS.length - 1 ? `🚌 ${t({ en: 'Roll to next stop', zh: '发车去下一站' })}` : `🎫 ${t({ en: 'Get off & collect ticket', zh: '下车 · 领联票' })}`}
                </button>
              </div>
            )}
          </div>

          {/* station progress handrail */}
          <div className="mt-3 flex items-center gap-1.5">
            {STATIONS.map((st, i) => (
              <div key={i} className="flex flex-1 items-center gap-1.5">
                <div className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-[13px] transition-colors ${i < sIdx || phase === 'ended' ? 'bg-[#39d353] text-[#06231f]' : i === sIdx ? 'bg-[#ffcf33] text-[#2a2200]' : 'bg-white/15 text-white/50'}`}>{st.icon}</div>
                {i < STATIONS.length - 1 && <div className={`h-1 flex-1 rounded-full ${i < sIdx || phase === 'ended' ? 'bg-[#39d353]' : 'bg-white/15'}`} />}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ticket overlay */}
      {phase === 'ended' && (
        <div className="absolute inset-0 z-30 grid place-items-center bg-black/60 px-4 backdrop-blur-sm">
          <div className="menu-in w-full max-w-sm overflow-hidden rounded-2xl bg-[#12102a] shadow-2xl" style={{ border: '2px dashed rgba(255,255,255,0.25)' }}>
            <div className="flex items-center justify-between bg-gradient-to-r from-[#e83f9e] to-[#ff7a1a] px-5 py-3">
              <span className="font-mono text-sm font-bold text-white">趣游巴士 · 夜游联票</span>
              <span className="font-mono text-xs text-white/80">QUYOU BUS</span>
            </div>
            <div className="px-6 py-5 text-center">
              <p className="font-mono text-[11px] uppercase tracking-widest text-white/40">{t({ en: 'your title tonight', zh: '今晚称号' })}</p>
              <p className="mt-1 font-display text-2xl font-semibold text-white">{t(title)}</p>
              <div className="my-4 border-t border-dashed border-white/15" />
              <div className="flex justify-around text-center">
                <div><p className="font-mono text-[10px] uppercase text-white/40">{t({ en: 'stops', zh: '到站' })}</p><p className="text-xl font-bold text-[#21c7b8]">{STATIONS.length}</p></div>
                <div><p className="font-mono text-[10px] uppercase text-white/40">{t({ en: 'points', zh: '得分' })}</p><p className="text-xl font-bold text-[#ffcf33]">{score}</p></div>
                <div><p className="font-mono text-[10px] uppercase text-white/40">{t({ en: 'route', zh: '线路' })}</p><p className="text-xl font-bold text-[#e83f9e]">🐼</p></div>
              </div>
              <div className="my-4 border-t border-dashed border-white/15" />
              <p className="text-[13px] italic leading-relaxed text-white/70">「{t(BLESSINGS[score % BLESSINGS.length])}」<br /><span className="not-italic text-[#39d353]">— {t({ en: 'Green, your host', zh: '主理人 阿绿' })}</span></p>
              <button onClick={restart} className="btn-sheen mt-5 rounded-full bg-[#e83f9e] px-6 py-2.5 font-mono text-sm font-bold text-white shadow-lg">↺ {t({ en: 'Ride again', zh: '再坐一趟' })}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuyouBus;
