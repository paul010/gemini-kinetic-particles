import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { BusAudio } from './busAudio';

/* ---------------------------------------------------------------------------
 * /quyoubus — 趣游巴士 · AI 夜游.
 *
 * A browser remake of Chengdu's real-world immersive "Quyou Bus" night tour:
 * a first-person three.js cabin that DANCES to a live-synthesised funk/disco
 * groove (Web Audio, zero audio files), an AI host「阿绿」who announces
 * stations and runs games — dialect guessing, old-song trivia, a beat-matching
 * rhythm game and an open mic — ending with a tear-off night-tour ticket.
 * Runs fully offline from built-in content; no backend required.
 * All 3D, music, copy and question banks are original.
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

type Game = 'dialect' | 'song' | 'rhythm' | 'openmic';
interface Station { name: T; icon: string; blurb: T; game: Game }
const STATIONS: Station[] = [
  { name: { en: 'Chunxi Road', zh: '春熙路' }, icon: '🛍️', game: 'dialect',
    blurb: { en: 'Chengdu’s century-old shopping heart — neon, crowds, street performers. Our party bus pulls out from here.', zh: '成都百年商业中心，霓虹、人潮、街头艺人。我们的派对巴士从这里出发。' } },
  { name: { en: 'Taikoo Li', zh: '太古里' }, icon: '🏮', game: 'song',
    blurb: { en: 'Low-rise lanes wrapped around the 1000-year-old Daci Temple — old bricks meet luxury flagships.', zh: '环绕千年大慈寺的低层街区，青砖古刹与奢侈品旗舰混搭。' } },
  { name: { en: 'Hejiang Pavilion', zh: '合江亭' }, icon: '🌉', game: 'rhythm',
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
  { q: { en: 'What does 「瓜娃子」 mean (teasing)?', zh: '「瓜娃子」（戏称）是什么意思？' }, opts: [{ en: 'silly kid (affectionate)', zh: '傻孩子（爱称）' }, { en: 'melon seller', zh: '卖瓜的' }, { en: 'genius', zh: '天才' }, { en: 'stranger', zh: '陌生人' }], ans: 0 },
];
const SONG: QA[] = [
  { q: { en: 'Who sings 《成都》?', zh: '《成都》是谁唱的？' }, opts: [{ en: '赵雷 Zhao Lei', zh: '赵雷' }, { en: '李荣浩', zh: '李荣浩' }, { en: '毛不易', zh: '毛不易' }, { en: '陈粒', zh: '陈粒' }], ans: 0 },
  { q: { en: 'Who sings 《山丘》?', zh: '《山丘》是谁唱的？' }, opts: [{ en: '李宗盛 Jonathan Lee', zh: '李宗盛' }, { en: '罗大佑', zh: '罗大佑' }, { en: '周华健', zh: '周华健' }, { en: '张学友', zh: '张学友' }], ans: 0 },
  { q: { en: 'Who sings 《晴天》?', zh: '《晴天》是谁唱的？' }, opts: [{ en: '周杰伦 Jay Chou', zh: '周杰伦' }, { en: '林俊杰', zh: '林俊杰' }, { en: '王力宏', zh: '王力宏' }, { en: '潘玮柏', zh: '潘玮柏' }], ans: 0 },
  { q: { en: '《月亮代表我的心》is most tied to which singer?', zh: '《月亮代表我的心》最常与哪位歌手联系在一起？' }, opts: [{ en: '邓丽君 Teresa Teng', zh: '邓丽君' }, { en: '梅艳芳', zh: '梅艳芳' }, { en: '王菲', zh: '王菲' }, { en: '蔡琴', zh: '蔡琴' }], ans: 0 },
  { q: { en: 'Who sings 《平凡之路》?', zh: '《平凡之路》是谁唱的？' }, opts: [{ en: '朴树 Pu Shu', zh: '朴树' }, { en: '许巍', zh: '许巍' }, { en: '汪峰', zh: '汪峰' }, { en: '陈奕迅', zh: '陈奕迅' }], ans: 0 },
];

const HOST = {
  welcome: { en: 'Yo! I’m Green, your host tonight. Turn it up — the Quyou Bus is rolling out from Chunxi Road! 🎤', zh: '哟！我是今晚的主理人阿绿，音乐走起 —— 趣游巴士从春熙路发车咯！🎤' },
  arrive: (s: T): T => ({ en: `Next stop: ${s.en}. Look out the window! 🌃`, zh: `下一站到咯：${s.zh}。往窗外看！🌃` }),
  toGame: {
    dialect: { en: 'Time for 「dialect guessing」— can you talk like a local? 🀄', zh: '来盘「方言猜猜猜」—— 看你巴不巴适！🀄' },
    song: { en: 'Old-song archaeology! Four choices, no peeking. 🎶', zh: '老歌考古四选一，不许偷看！🎶' },
    rhythm: { en: 'Clap on the beat with me — eight beats, don’t rush it! 👏', zh: '跟着节拍拍手 —— 八拍，别抢拍！👏' },
    openmic: { en: 'Open mic! The floor — and the tower lights — are yours. 🎙️', zh: '开放麦时间！这束光和塔灯都归你。🎙️' },
  } as Record<Game, T>,
  right: [{ en: 'Baaashi! Local through and through. 🔥', zh: '巴适得板！地道成都人。🔥' }, { en: 'Nailed it — the bus roars for you! 🎉', zh: '答对咯 —— 全车为你欢呼！🎉' }],
  wrong: [{ en: 'Aiya, close! The bus forgives you. 😆', zh: '哎呀差点点，全车原谅你。😆' }, { en: 'Not quite — but the vibe’s still bashi. 🫶', zh: '没对上，不过气氛还是巴适。🫶' }],
};
const OPENMIC_HYPE: T[] = [
  { en: 'The whole bus is clapping — that was pure gold! 👏', zh: '全车都在拍手 —— 你这段太顶了！👏' },
  { en: 'Green tips his afro to you. Encore! 🎤', zh: '阿绿对你脱帽致敬，返场！🎤' },
  { en: 'Chengdu nights just got 10% more fun because of you. 🌟', zh: '就因为你，成都的夜又好玩了 10%。🌟' },
];
const TITLES: { min: number; title: T }[] = [
  { min: 4, title: { en: 'Honorary Chengdu Local 🐼', zh: '荣誉成都土著 🐼' } },
  { min: 2, title: { en: 'Night-Bus Regular 🌃', zh: '夜巴常客 🌃' } },
  { min: 0, title: { en: 'First-time Rider 🎫', zh: '初次上车乘客 🎫' } },
];
const BLESSINGS: T[] = [
  { en: 'May every ride you take be this bashi. 🚌', zh: '愿你往后每一趟车，都这么巴适。🚌' },
  { en: 'Keep the party moving, wherever you go. ✨', zh: '把这份热闹，带去你要去的每个地方。✨' },
];

const RHYTHM_TAPS = 8;
type Judge = 'perfect' | 'good' | 'miss';
const JUDGE_TEXT: Record<Judge, T> = {
  perfect: { en: 'PERFECT', zh: '完美' }, good: { en: 'GOOD', zh: '不错' }, miss: { en: 'OFF-BEAT', zh: '跑拍了' },
};
const JUDGE_COLOR: Record<Judge, string> = { perfect: '#39d353', good: '#ffcf33', miss: '#e83f9e' };

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
  const [muted, setMuted] = useState(false);
  const [beatTick, setBeatTick] = useState(0);
  const [taps, setTaps] = useState<Judge[]>([]);
  const [lastJudge, setLastJudge] = useState<Judge | null>(null);
  const bankIdx = useRef({ dialect: 0, song: 0 });

  const phaseRef = useRef(phase); phaseRef.current = phase;
  const sIdxRef = useRef(sIdx); sIdxRef.current = sIdx;
  const station = STATIONS[sIdx];

  /* ---- audio engine ---- */
  const audio = useRef<BusAudio | null>(null);
  if (!audio.current && typeof window !== 'undefined') audio.current = new BusAudio();
  /** beat-reactive values read by the render loop */
  const vis = useRef({ kick: 0, snare: 0, stab: 0, playing: false, burst: 0 });

  useEffect(() => {
    const a = audio.current; if (!a) return;
    let alive = true;
    a.onStep = (step, time) => {
      if (!alive) return;
      const delay = Math.max(0, (time - a.now()) * 1000);
      window.setTimeout(() => {
        if (!alive) return;
        if (step === 0 || step === 6 || step === 8 || step === 14) vis.current.kick = 1;
        if (step === 4 || step === 12) vis.current.snare = 1;
        if (step === 2 || step === 10) vis.current.stab = 1;
        if (step % 4 === 0) setBeatTick((n) => n + 1);
      }, delay);
    };
    return () => { alive = false; a.dispose(); };
  }, []);

  useEffect(() => { audio.current?.setStation(sIdx); }, [sIdx]);

  const startMusic = () => { audio.current?.start().then(() => { vis.current.playing = true; }); };
  const toggleMute = () => { const m = !muted; setMuted(m); audio.current?.setMuted(m); };

  /* ---- game flow ---- */
  const startGame = () => {
    const g = station.game;
    if (g === 'openmic') { setPhase('game'); return; }
    if (g === 'rhythm') { setTaps([]); setLastJudge(null); startMusic(); setPhase('game'); return; }
    const bank = g === 'dialect' ? DIALECT : SONG;
    const i = bankIdx.current[g] % bank.length; bankIdx.current[g] += 1;
    setQ(bank[i]); setPicked(null); setPhase('game');
  };
  const answer = (i: number) => {
    if (picked !== null || !q) return;
    setPicked(i);
    if (i === q.ans) { setScore((s) => s + 1); vis.current.burst = 1; }
    window.setTimeout(() => setPhase('result'), 900);
  };
  const tapBeat = () => {
    if (phaseRef.current !== 'game' || station.game !== 'rhythm' || taps.length >= RHYTHM_TAPS) return;
    const off = audio.current?.tapOffset();
    const a = off === null || off === undefined ? 1 : Math.abs(off);
    const j: Judge = a < 0.11 ? 'perfect' : a < 0.22 ? 'good' : 'miss';
    if (j === 'perfect') vis.current.burst = 1;
    vis.current.kick = Math.max(vis.current.kick, 0.8);
    setLastJudge(j);
    setTaps((prev) => {
      const nx = [...prev, j];
      if (nx.length >= RHYTHM_TAPS) {
        const hits = nx.filter((x) => x !== 'miss').length;
        if (hits >= 5) { setScore((s) => s + 1); vis.current.burst = 1; }
        window.setTimeout(() => setPhase('result'), 800);
      }
      return nx;
    });
  };
  useEffect(() => {
    if (phase !== 'game' || station.game !== 'rhythm') return;
    const onKey = (e: KeyboardEvent) => { if (e.code === 'Space') { e.preventDefault(); tapBeat(); } };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }); // re-bound each render so tapBeat sees fresh state
  const submitMic = () => {
    if (!mic.trim()) return;
    const hype = OPENMIC_HYPE[Math.min(OPENMIC_HYPE.length - 1, Math.floor(mic.trim().length / 12))];
    setScore((s) => s + 1); setMicDone(hype); vis.current.burst = 1; setPhase('result');
  };
  const next = () => {
    if (sIdx < STATIONS.length - 1) { setSIdx((n) => n + 1); setQ(null); setPicked(null); setMic(''); setMicDone(null); setTaps([]); setLastJudge(null); setPhase('riding'); }
    else { setPhase('ended'); vis.current.burst = 1; }
  };
  const restart = () => { setSIdx(0); setScore(0); setQ(null); setPicked(null); setMic(''); setMicDone(null); setTaps([]); setLastJudge(null); bankIdx.current = { dialect: 0, song: 0 }; setPhase('boarding'); };
  const board = () => { startMusic(); setPhase('riding'); };

  /* ---------------- three.js cabin (beat-reactive) ---------------- */
  const mountRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const mount = mountRef.current; if (!mount) return;
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.15;
    const W = mount.clientWidth, H = mount.clientHeight || 500;
    renderer.setSize(W, H); mount.appendChild(renderer.domElement);

    const THEMES = [0x39d353, 0xe83f9e, 0x21c7b8, 0xffcf33].map((c) => new THREE.Color(c));
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0e0c22);
    scene.fog = new THREE.Fog(0x0e0c22, 26, 68);
    const camera = new THREE.PerspectiveCamera(72, W / H, 0.1, 220);
    camera.position.set(0, 2.5, 7.6); camera.lookAt(0, 1.9, -8);

    scene.add(new THREE.HemisphereLight(0x9fb0ff, 0x2a1840, 1.05));
    const warm = new THREE.PointLight(0xffcf88, 1.7, 34); warm.position.set(0, 4.4, 0); scene.add(warm);
    const warm2 = new THREE.PointLight(0xffb060, 1.1, 26); warm2.position.set(0, 4, -8); scene.add(warm2);
    const disco1 = new THREE.PointLight(0x39d353, 1.1, 20); scene.add(disco1);
    const disco2 = new THREE.PointLight(0xe83f9e, 1.1, 20); scene.add(disco2);
    const disco3 = new THREE.PointLight(0x21c7b8, 1.1, 20); scene.add(disco3);

    const mat = (c: number, o: Partial<THREE.MeshStandardMaterialParameters> = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.6, ...o });

    // shell
    const floor = new THREE.Mesh(new THREE.BoxGeometry(4.6, 0.2, 44), mat(0x241f3e, { metalness: 0.3, roughness: 0.4 })); floor.position.set(0, 0.4, -9); scene.add(floor);
    const ceil = new THREE.Mesh(new THREE.BoxGeometry(4.6, 0.2, 44), mat(0x1b1836)); ceil.position.set(0, 5.3, -9); scene.add(ceil);
    const strips: THREE.MeshStandardMaterial[] = [];
    [-0.55, 0.55].forEach((x, i) => {
      const m = new THREE.MeshStandardMaterial({ color: i ? 0x21c7b8 : 0xe83f9e, emissive: i ? 0x21c7b8 : 0xe83f9e, emissiveIntensity: 1.3 });
      const strip = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.04, 44), m); strip.position.set(x, 0.52, -9); scene.add(strip); strips.push(m);
    });
    [-2.3, 2.3].forEach((x) => { const wall = new THREE.Mesh(new THREE.BoxGeometry(0.2, 1.7, 44), mat(0x2a2350)); wall.position.set(x, 1.4, -9); scene.add(wall); const top = new THREE.Mesh(new THREE.BoxGeometry(0.2, 1.1, 44), mat(0x2a2350)); top.position.set(x, 4.6, -9); scene.add(top); });

    // seats + dancing passengers
    const seatMats: THREE.MeshStandardMaterial[] = [];
    const dancers: { grp: THREE.Group; ph: number; y0: number }[] = [];
    const seatCols = [{ x: -1.45, c: 0xffcf33 }, { x: 1.45, c: 0x2fd0c0 }];
    const skin = [0xf0c9a0, 0xe8b98c, 0xd9a878];
    const hair = [0x2a2018, 0x39d353, 0xe86a2f, 0x5a3a22, 0x7a5cab];
    for (let r = 0; r < 9; r++) {
      const z = -1 - r * 2.4;
      seatCols.forEach((col, ci) => {
        const sm = mat(col.c, { emissive: col.c, emissiveIntensity: 0.28 }); seatMats.push(sm);
        const seat = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.36, 0.95), sm); seat.position.set(col.x, 1.08, z); scene.add(seat);
        const back = new THREE.Mesh(new THREE.BoxGeometry(1.15, 1.05, 0.24), sm); back.position.set(col.x, 1.6, z - 0.36); scene.add(back);
        // a passenger in most seats, bobbing on the beat
        if (r < 7 && (r + ci) % 3 !== 2) {
          const g = new THREE.Group(); g.position.set(col.x, 1.26, z + 0.05);
          const k = (r * 2 + ci);
          const body = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.28, 0.7, 10), mat([0x3a4a8c, 0x8c3a5a, 0x2f6a4a, 0x8c6a2f][k % 4])); body.position.y = 0.35; g.add(body);
          const hd = new THREE.Mesh(new THREE.SphereGeometry(0.2, 14, 14), mat(skin[k % skin.length])); hd.position.y = 0.86; g.add(hd);
          const hr = new THREE.Mesh(new THREE.SphereGeometry(0.235, 14, 14), mat(hair[k % hair.length], { roughness: 1 })); hr.position.y = 0.92; hr.scale.set(1, 0.85, 1); g.add(hr);
          scene.add(g); dancers.push({ grp: g, ph: k * 0.7, y0: 1.26 });
        }
      });
    }

    // poles + handles
    const handles: { grp: THREE.Group; ph: number }[] = [];
    const poleMats: THREE.MeshStandardMaterial[] = [];
    for (let r = 0; r < 8; r++) {
      const z = -1.4 - r * 2.6;
      [-0.72, 0.72].forEach((x) => {
        const pm = mat(0xe83f9e, { emissive: 0xe83f9e, emissiveIntensity: 0.7, roughness: 0.3 }); poleMats.push(pm);
        const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 3.5, 10), pm); pole.position.set(x, 3.05, z); scene.add(pole);
        const grp = new THREE.Group(); grp.position.set(x, 3.5, z);
        const strap = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.5, 6), mat(0xffcf33, { emissive: 0xffcf33, emissiveIntensity: 0.5 })); strap.position.y = -0.25; grp.add(strap);
        const ring = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.045, 8, 18), mat(0xffcf33, { emissive: 0xffcf33, emissiveIntensity: 0.6 })); ring.position.y = -0.52; grp.add(ring);
        scene.add(grp); handles.push({ grp, ph: r + x });
      });
    }

    // ceiling bulbs + tinsel + disco ball
    const bulbs: THREE.Mesh[] = [];
    for (let r = 0; r < 24; r++) { const z = 2 - r * 2.0; const b = new THREE.Mesh(new THREE.SphereGeometry(0.11, 10, 10), new THREE.MeshBasicMaterial({ color: 0xffe0a0 })); b.position.set((r % 2 ? -0.85 : 0.85), 4.8, z); scene.add(b); bulbs.push(b); }
    const tinsel = new THREE.Group();
    for (let i = 0; i < 90; i++) { const c = [0x21c7b8, 0xe83f9e, 0xffcf33, 0x7ab8ff][i % 4]; const s = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.55, 0.025), new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: 0.6, metalness: 0.8, roughness: 0.3 })); s.position.set((Math.random() - 0.5) * 4.2, 5.05, 2 - Math.random() * 40); tinsel.add(s); }
    scene.add(tinsel);
    const disco = new THREE.Mesh(new THREE.IcosahedronGeometry(0.42, 1), new THREE.MeshStandardMaterial({ color: 0xdfe6ff, metalness: 1, roughness: 0.15, emissive: 0x334, emissiveIntensity: 0.4, flatShading: true })); disco.position.set(0, 4.5, -3); scene.add(disco);
    const discoLight = new THREE.PointLight(0xffffff, 0.6, 14); discoLight.position.set(0, 4.2, -3); scene.add(discoLight);

    // host「阿绿」+ spotlight
    const host = new THREE.Group(); host.position.set(0, 0.5, -8.2); host.scale.setScalar(1.15);
    const legs = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.3, 1.2, 12), mat(0x2a3a58)); legs.position.y = 0.6; host.add(legs);
    const jacket = new THREE.Mesh(new THREE.CylinderGeometry(0.44, 0.38, 1.05, 14), mat(0xe23b30, { emissive: 0x3a0805, emissiveIntensity: 0.5 })); jacket.position.y = 1.62; host.add(jacket);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.32, 18, 18), mat(0xf0c9a0)); head.position.y = 2.38; host.add(head);
    const afroMat = new THREE.MeshStandardMaterial({ color: 0x39d353, roughness: 1, emissive: 0x1e7a2e, emissiveIntensity: 0.7 });
    const afro = new THREE.Mesh(new THREE.SphereGeometry(0.46, 18, 18), afroMat); afro.position.y = 2.54; afro.scale.set(1, 0.92, 1); host.add(afro);
    const shades = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.15, 0.06), mat(0x0a0a12, { metalness: 0.6 })); shades.position.set(0, 2.4, 0.3); host.add(shades);
    const armL = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.8, 8), mat(0xe23b30)); armL.position.set(-0.5, 1.8, 0.1); host.add(armL);
    const armR = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.8, 8), mat(0xe23b30)); armR.position.set(0.5, 1.8, 0.1); host.add(armR);
    const boom = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.42, 0.26), mat(0xe8e8e8, { emissive: 0x222, emissiveIntensity: 0.3 })); boom.position.set(0, 1.5, 0.46); host.add(boom);
    scene.add(host);
    const coneMat = new THREE.MeshBasicMaterial({ color: 0x39d353, transparent: true, opacity: 0.08, side: THREE.DoubleSide, depthWrite: false });
    const cone = new THREE.Mesh(new THREE.ConeGeometry(1.1, 3.2, 24, 1, true), coneMat); cone.position.set(0, 3.4, -8.2); scene.add(cone);
    const hostSpot = new THREE.SpotLight(0xffffff, 2.2, 12, Math.PI / 7, 0.5); hostSpot.position.set(0, 5, -7.2); hostSpot.target = host; scene.add(hostSpot); scene.add(hostSpot.target);

    // night city outside
    const winTexes: THREE.CanvasTexture[] = [];
    for (let k = 0; k < 6; k++) {
      const cv = document.createElement('canvas'); cv.width = 64; cv.height = 128; const cx = cv.getContext('2d')!;
      cx.fillStyle = '#100d24'; cx.fillRect(0, 0, 64, 128);
      const pal = ['#ffe0a0', '#2fd0c0', '#ff6ec7', '#ff9a3c', '#8ec8ff', '#c78bff'];
      for (let y = 5; y < 128; y += 10) for (let x = 5; x < 64; x += 10) { if (Math.random() < 0.62) { cx.fillStyle = pal[(k + x + y) % pal.length]; cx.globalAlpha = 0.6 + Math.random() * 0.4; cx.fillRect(x, y, 6, 6); } }
      cx.globalAlpha = 1; winTexes.push(new THREE.CanvasTexture(cv));
    }
    const buildings: THREE.Mesh[] = []; const billboards: THREE.Mesh[] = []; const SPAN = 72;
    for (let i = 0; i < 38; i++) {
      const side = i % 2 ? 1 : -1; const h = 7 + Math.random() * 20; const w = 3 + Math.random() * 3.5;
      const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, 3.6), new THREE.MeshStandardMaterial({ map: winTexes[i % winTexes.length], emissive: 0x2a2a55, emissiveIntensity: 0.85, color: 0x342b62 }));
      b.position.set(side * (5.5 + Math.random() * 7), h / 2 - 0.5, -Math.random() * SPAN); scene.add(b); buildings.push(b);
      if (i % 4 === 0) { const bb = new THREE.Mesh(new THREE.PlaneGeometry(3, 2), new THREE.MeshBasicMaterial({ color: [0xff6ec7, 0x2fd0c0, 0xffcf33, 0xff9a3c][i % 4] })); bb.position.set(side * 4.6, 2 + Math.random() * 8, b.position.z); bb.rotation.y = side > 0 ? -Math.PI / 2 : Math.PI / 2; scene.add(bb); billboards.push(bb); }
    }
    const tower = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 1.3, 34, 14), mat(0x342b62, { emissive: 0x223, emissiveIntensity: 0.7 })); tower.position.set(6, 16, -60); scene.add(tower);
    const towerRing = new THREE.Mesh(new THREE.TorusGeometry(1.5, 0.16, 10, 28), new THREE.MeshBasicMaterial({ color: 0x2fd0c0 })); towerRing.position.set(6, 25, -60); towerRing.rotation.x = Math.PI / 2; scene.add(towerRing);
    const moon = new THREE.Mesh(new THREE.CircleGeometry(2.4, 32), new THREE.MeshBasicMaterial({ color: 0xf4e8c0, fog: false })); moon.position.set(-16, 20, -64); scene.add(moon);

    // confetti burst system
    const CONF = 160;
    const cGeo = new THREE.BufferGeometry();
    const cPos = new Float32Array(CONF * 3); const cCol = new Float32Array(CONF * 3);
    const cVel = new Float32Array(CONF * 3); const cLife = new Float32Array(CONF);
    cGeo.setAttribute('position', new THREE.BufferAttribute(cPos, 3));
    cGeo.setAttribute('color', new THREE.BufferAttribute(cCol, 3));
    const confetti = new THREE.Points(cGeo, new THREE.PointsMaterial({ size: 0.14, vertexColors: true, transparent: true, opacity: 0.95 }));
    scene.add(confetti);
    const cPalette = [new THREE.Color(0x39d353), new THREE.Color(0xe83f9e), new THREE.Color(0xffcf33), new THREE.Color(0x2fd0c0)];
    const burst = () => {
      for (let i = 0; i < CONF; i++) {
        cPos[i * 3] = (Math.random() - 0.5) * 3; cPos[i * 3 + 1] = 4.6; cPos[i * 3 + 2] = -2 - Math.random() * 6;
        cVel[i * 3] = (Math.random() - 0.5) * 0.06; cVel[i * 3 + 1] = -0.02 - Math.random() * 0.03; cVel[i * 3 + 2] = (Math.random() - 0.5) * 0.04;
        const c = cPalette[i % cPalette.length]; cCol[i * 3] = c.r; cCol[i * 3 + 1] = c.g; cCol[i * 3 + 2] = c.b;
        cLife[i] = 1;
      }
      cGeo.attributes.position.needsUpdate = true; cGeo.attributes.color.needsUpdate = true;
    };

    // drag to look
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
      const v = vis.current;
      // decay beat envelopes; fall back to a gentle sine when music is off
      v.kick *= 0.88; v.snare *= 0.86; v.stab *= 0.9;
      const idle = v.playing ? 0 : 0.35 + Math.sin(el * 3) * 0.25;
      const K = Math.max(v.kick, idle), S = Math.max(v.snare, idle * 0.6), ST = Math.max(v.stab, idle * 0.5);
      if (v.burst > 0) { burst(); v.burst = 0; }

      const riding = phaseRef.current === 'riding' || phaseRef.current === 'boarding';
      speed += ((riding ? 0.5 : 0.06) - speed) * 0.03;
      buildings.forEach((b) => { b.position.z += speed; if (b.position.z > 12) b.position.z -= SPAN; });
      billboards.forEach((b) => { b.position.z += speed; if (b.position.z > 12) b.position.z -= SPAN; });

      themeCol.lerp(THEMES[sIdxRef.current] || THEMES[0], 0.02);
      (scene.background as THREE.Color).setRGB(0.055 + themeCol.r * 0.06, 0.048 + themeCol.g * 0.06, 0.13 + themeCol.b * 0.05);
      scene.fog!.color.copy(scene.background as THREE.Color);
      coneMat.color.copy(themeCol);
      hostSpot.color.copy(themeCol).lerp(new THREE.Color(0xffffff), 0.5);
      hostSpot.intensity = 2.0 + K * 1.8;

      // orbiting disco lights — speed & punch follow the groove
      const orbit = el * 1.3;
      disco1.position.set(Math.cos(orbit) * 2, 3.6, -3 + Math.sin(orbit) * 2);
      disco2.position.set(Math.cos(orbit + 2.1) * 2, 3.6, -3 + Math.sin(orbit + 2.1) * 2);
      disco3.position.set(Math.cos(orbit + 4.2) * 2, 3.6, -3 + Math.sin(orbit + 4.2) * 2);
      disco1.intensity = 0.7 + K * 1.6; disco2.intensity = 0.7 + S * 1.6; disco3.intensity = 0.7 + ST * 1.6;

      // camera bounces on the kick
      camera.position.y = 2.5 + Math.sin(el * 8) * 0.03 * (0.4 + speed) + K * 0.06;
      const bump = Math.sin(el * 6) * 0.012 * (0.4 + speed);
      camera.rotation.set(pitch + bump - K * 0.012, yaw, Math.sin(el * 5) * 0.007 * (0.3 + speed));

      // everything dances
      handles.forEach((h) => { h.grp.rotation.z = Math.sin(el * 2 + h.ph) * (0.18 + K * 0.25) * (0.4 + speed); });
      dancers.forEach((d) => {
        d.grp.position.y = d.y0 + Math.abs(Math.sin(el * 3 + d.ph)) * 0.05 + K * 0.13;
        d.grp.rotation.z = Math.sin(el * 3 + d.ph) * 0.09;
        d.grp.rotation.y = Math.sin(el * 1.5 + d.ph) * 0.3;
      });
      seatMats.forEach((m, i) => { m.emissiveIntensity = 0.25 + (i % 2 ? K : S) * 0.5; });
      poleMats.forEach((m, i) => { m.emissiveIntensity = 0.55 + (i % 2 ? ST : K) * 0.8; });
      strips.forEach((m, i) => { m.emissiveIntensity = 1.0 + (i ? K : S) * 1.6; });
      afroMat.emissiveIntensity = 0.6 + K * 0.9;
      disco.rotation.y = el * (1.0 + K * 1.5); disco.rotation.x = el * 0.3;
      disco.scale.setScalar(1 + K * 0.12);
      discoLight.color.setHSL((el * 0.25) % 1, 0.85, 0.55 + K * 0.2);
      discoLight.intensity = 0.5 + K * 1.2;
      const talking = phaseRef.current === 'narrate' || phaseRef.current === 'result' || phaseRef.current === 'boarding';
      host.position.y = 0.5 + (talking ? Math.abs(Math.sin(el * 6)) * 0.08 : 0) + K * 0.14;
      host.rotation.y = Math.sin(el * 1.1) * 0.12;
      armL.rotation.z = 0.4 + Math.sin(el * 4) * 0.5 + K * 0.5;
      armR.rotation.z = -0.4 - Math.sin(el * 4 + 1) * 0.5 - K * 0.5;
      towerRing.scale.setScalar(1 + Math.sin(el * 2) * 0.06 + K * 0.1);
      bulbs.forEach((b, i) => (b.material as THREE.MeshBasicMaterial).color.setHSL(0.11, 0.9, 0.55 + Math.sin(el * 3 + i) * 0.1 + S * 0.25));
      tinsel.children.forEach((c, i) => { c.rotation.z = Math.sin(el * 2 + i) * 0.25 * (0.5 + K); });

      // confetti physics
      let anyAlive = false;
      for (let i = 0; i < CONF; i++) {
        if (cLife[i] <= 0) continue;
        anyAlive = true;
        cLife[i] -= 0.012;
        cPos[i * 3] += cVel[i * 3]; cPos[i * 3 + 1] += cVel[i * 3 + 1]; cPos[i * 3 + 2] += cVel[i * 3 + 2];
        cVel[i * 3 + 1] -= 0.0016;
        if (cPos[i * 3 + 1] < 0.5) cLife[i] = 0;
      }
      confetti.visible = anyAlive;
      if (anyAlive) cGeo.attributes.position.needsUpdate = true;

      renderer.render(scene, camera);
    };
    loop();

    const onResize = () => { const w = mount.clientWidth, h = mount.clientHeight || 500; renderer.setSize(w, h); camera.aspect = w / h; camera.updateProjectionMatrix(); };
    const ro = new ResizeObserver(onResize); ro.observe(mount); window.addEventListener('resize', onResize);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); window.removeEventListener('resize', onResize); dom.removeEventListener('pointerdown', down); window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); renderer.dispose(); if (dom.parentNode === mount) mount.removeChild(dom); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* ---------------- UI ---------------- */
  const LANGS: { code: Lang; label: string }[] = [{ code: 'en', label: 'EN' }, { code: 'zh', label: '简' }, { code: 'zhHant', label: '繁' }];
  const title = TITLES.find((x) => score >= x.min)!.title;
  const hostLine: T = phase === 'boarding' ? HOST.welcome
    : phase === 'narrate' ? station.blurb
    : phase === 'game' ? HOST.toGame[station.game]
    : phase === 'result' ? (station.game === 'openmic' ? (micDone || HOST.right[0])
      : station.game === 'rhythm' ? (taps.filter((x) => x !== 'miss').length >= 5 ? HOST.right[0] : HOST.wrong[0])
      : (picked === q?.ans ? HOST.right[sIdx % 2] : HOST.wrong[sIdx % 2]))
    : HOST.arrive(station.name);
  const beatPhase = beatTick % 2 === 0;

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[#0e0c22] font-sans text-white">
      <div ref={mountRef} className="absolute inset-0" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[#0e0c22] via-[#0e0c22]/70 to-transparent" />

      {/* top bar */}
      <header className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <button onClick={onHome} className="pointer-events-auto rounded-full border border-white/20 bg-black/40 px-4 py-2 font-mono text-xs text-white/80 backdrop-blur-md transition-colors hover:text-white">← Da Lei · 大雷</button>
        <div className="pointer-events-auto flex items-center gap-2 rounded-full border-2 border-[#39d353]/60 bg-[#0b0a1c]/80 px-4 py-1.5" style={{ boxShadow: '0 0 18px rgba(57,211,83,0.35)' }}>
          <span className="h-2 w-2 rounded-full bg-[#39d353] transition-transform duration-100" style={{ transform: `scale(${beatPhase ? 1.5 : 1})` }} />
          <span className="font-mono text-[13px] font-bold tracking-wide text-[#39d353]" style={{ textShadow: '0 0 8px rgba(57,211,83,0.8)' }}>
            {phase === 'ended' ? t({ en: 'TERMINUS · thanks for riding', zh: '终点站 · 谢谢乘坐' }) : `${phase === 'riding' ? t({ en: 'NEXT', zh: '下一站' }) : t({ en: 'NOW', zh: '本站' })} ▸ ${t(station.name)} ${station.icon}`}
          </span>
        </div>
        <div className="pointer-events-auto flex items-center gap-2">
          <button onClick={toggleMute} title={t({ en: 'music', zh: '音乐' })} className="rounded-full border border-white/20 bg-black/40 px-3 py-1.5 font-mono text-[13px] backdrop-blur-md transition-colors hover:text-white">{muted ? '🔇' : '🔊'}</button>
          <div className="flex overflow-hidden rounded-full border border-white/20 bg-black/40 backdrop-blur-md">
            {LANGS.map((l) => (<button key={l.code} onClick={() => setLang(l.code)} className={`px-2.5 py-1 font-mono text-[11px] transition-colors ${lang === l.code ? 'bg-white text-[#0b0a1c]' : 'text-white/60'}`}>{l.label}</button>))}
          </div>
        </div>
      </header>

      {/* score + equalizer */}
      <div className="pointer-events-none absolute right-4 top-16 z-20 flex items-center gap-2 sm:right-6">
        <div className="flex items-end gap-0.5">
          {[0, 1, 2, 3].map((i) => (
            <span key={i} className="w-1 rounded-sm bg-[#2fd0c0] transition-all duration-150"
              style={{ height: `${(muted ? 4 : 6) + ((beatTick + i) % 4) * 4}px`, opacity: muted ? 0.3 : 0.9 }} />
          ))}
        </div>
        <span className="rounded-full bg-[#e83f9e]/85 px-3 py-1 font-mono text-[12px] font-bold text-white">🎉 {score}</span>
      </div>

      {/* host + panel */}
      <div className="absolute inset-x-0 bottom-0 z-20 px-4 pb-6 sm:px-6">
        <div className="mx-auto max-w-2xl">
          <div className="mb-3 flex items-start gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#39d353] text-xl shadow-lg transition-transform duration-100" style={{ transform: `scale(${beatPhase ? 1.08 : 1})` }}>🕶️</span>
            <p className="rounded-2xl rounded-tl-sm border border-white/10 bg-black/55 px-4 py-2.5 text-[14px] leading-relaxed text-white backdrop-blur-md">
              <b className="mr-1 text-[#39d353]">{t({ en: 'Green', zh: '阿绿' })}:</b>{t(hostLine)}
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-black/55 p-4 backdrop-blur-md sm:p-5">
            {phase === 'boarding' && (
              <div className="flex flex-col items-center gap-3 text-center">
                <p className="text-sm text-white/70">{t({ en: 'A 3D remake of Chengdu’s immersive night-tour party bus — with a live-synthesised funk groove. Drag to look around; turn your sound on. 🔊', zh: '成都沉浸式夜游派对巴士的 3D 复刻 —— 配实时合成的 funk 律动。拖动可环视车厢，记得开声音 🔊' })}</p>
                <button onClick={board} className="btn-sheen rounded-full bg-[#e83f9e] px-7 py-3 font-mono text-sm font-bold text-white shadow-lg transition-transform hover:scale-105">🚌 {t({ en: 'Board & start the music', zh: '上车 · 音乐走起' })}</button>
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

            {phase === 'game' && (station.game === 'dialect' || station.game === 'song') && q && (
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

            {phase === 'game' && station.game === 'rhythm' && (
              <div className="flex flex-col items-center gap-3">
                <p className="text-center text-sm text-white/70">{t({ en: 'Tap on the beat — 8 times. Click the pad or hit Space.', zh: '跟着节拍点 8 下 —— 点圆盘或按空格。' })}</p>
                <button onClick={tapBeat} className="grid h-24 w-24 place-items-center rounded-full border-4 font-mono text-sm font-bold transition-all duration-100"
                  style={{ borderColor: beatPhase ? '#39d353' : 'rgba(255,255,255,0.25)', background: beatPhase ? 'rgba(57,211,83,0.22)' : 'rgba(255,255,255,0.06)', transform: `scale(${beatPhase ? 1.1 : 1})`, boxShadow: beatPhase ? '0 0 26px rgba(57,211,83,0.5)' : 'none' }}>
                  👏 {taps.length}/{RHYTHM_TAPS}
                </button>
                {lastJudge && <span className="font-mono text-sm font-bold" style={{ color: JUDGE_COLOR[lastJudge] }}>{t(JUDGE_TEXT[lastJudge])}</span>}
                <div className="flex gap-1">
                  {Array.from({ length: RHYTHM_TAPS }).map((_, i) => (
                    <span key={i} className="h-1.5 w-5 rounded-full" style={{ background: taps[i] ? JUDGE_COLOR[taps[i]] : 'rgba(255,255,255,0.18)' }} />
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
                {station.game === 'rhythm' && (
                  <p className="font-mono text-xs text-white/60">{t({ en: 'on beat', zh: '踩准' })}: {taps.filter((x) => x !== 'miss').length}/{RHYTHM_TAPS} · {t({ en: 'perfect', zh: '完美' })}: {taps.filter((x) => x === 'perfect').length}</p>
                )}
                <button onClick={next} className="btn-sheen rounded-full bg-[#21c7b8] px-7 py-3 font-mono text-sm font-bold text-[#06231f] shadow-lg transition-transform hover:scale-105">
                  {sIdx < STATIONS.length - 1 ? `🚌 ${t({ en: 'Roll to next stop', zh: '发车去下一站' })}` : `🎫 ${t({ en: 'Get off & collect ticket', zh: '下车 · 领联票' })}`}
                </button>
              </div>
            )}
          </div>

          {/* station handrail */}
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

      {/* ticket */}
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
