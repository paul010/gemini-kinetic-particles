import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import {
  ArrowLeft,
  CloudSun,
  Compass,
  List,
  MapPin,
  MoonStars,
  Pause,
  Play,
  Sun,
  X,
} from '@phosphor-icons/react';
import './LvshunMap.css';

interface Props { onHome: () => void }

type SceneMode = 'day' | 'sunset' | 'night';

type Landmark = {
  id: string;
  name: string;
  short: string;
  kind: string;
  lon: number;
  lat: number;
  cameraHeight?: number;
  labelOffset?: [number, number, number];
};

const LANDMARKS: Landmark[] = [
  { id: 'baiyushan', name: '白玉山', short: '俯瞰军港与旅顺城区', kind: '城市制高点', lon: 121.2517021, lat: 38.8106252, cameraHeight: 34, labelOffset: [10, 34, -8] },
  { id: 'museum', name: '旅顺博物馆', short: '太阳沟里的百年建筑', kind: '人文建筑', lon: 121.2295795, lat: 38.8075223, cameraHeight: 24, labelOffset: [-18, 19, -7] },
  { id: 'taiyanggou', name: '太阳沟', short: '老街、银杏与近代建筑群', kind: '历史街区', lon: 121.2281123, lat: 38.809973, cameraHeight: 25, labelOffset: [-20, 30, 11] },
  { id: 'port', name: '旅顺军港', short: '天然良港与城市海岸线', kind: '港湾', lon: 121.2537816, lat: 38.8033643, cameraHeight: 28, labelOffset: [13, 17, 14] },
  { id: 'tigertail', name: '老虎尾沙嘴', short: '守住旅顺口的天然弯钩', kind: '天然港屏障', lon: 121.2194, lat: 38.796, cameraHeight: 23, labelOffset: [-15, 18, 6] },
  { id: 'hill203', name: '203高地', short: '西部丘陵上的历史遗址', kind: '山地遗址', lon: 121.1934938, lat: 38.8285858, cameraHeight: 31, labelOffset: [-13, 24, -9] },
  { id: 'dongjiguan', name: '东鸡冠山', short: '山地堡垒遗址', kind: '山地遗址', lon: 121.2793614, lat: 38.8318434, cameraHeight: 30, labelOffset: [18, 22, -12] },
  { id: 'submarine', name: '潜艇博物馆', short: '可进入参观的潜艇展区', kind: '工业遗产', lon: 121.2675075, lat: 38.7938793, cameraHeight: 24, labelOffset: [19, 31, 13] },
  { id: 'station', name: '旅顺站', short: '保存完整的木构火车站', kind: '交通建筑', lon: 121.247433, lat: 38.8066858, cameraHeight: 22, labelOffset: [17, 25, -12] },
  { id: 'laotieshan', name: '老铁山', short: '灯塔与黄渤海分界线', kind: '半岛尽头', lon: 121.1757586, lat: 38.7384228, cameraHeight: 38 },
];

// Simplified from the OpenStreetMap boundary of Lushunkou District.
const COASTLINE: [number, number][] = [
  [121.0855685, 38.9091147], [121.0889455, 38.8949962], [121.0946961, 38.8937052],
  [121.1182501, 38.8906199], [121.126586, 38.8798144], [121.1162753, 38.868297],
  [121.1098572, 38.8612378], [121.1031897, 38.8626737], [121.1060868, 38.8515025],
  [121.1134034, 38.8357569], [121.1118144, 38.8199865], [121.1240376, 38.8063793],
  [121.1363592, 38.8121112], [121.1431367, 38.7945339], [121.1274797, 38.7796434],
  [121.1101201, 38.77557], [121.12122, 38.7649601], [121.1287299, 38.75391],
  [121.13167, 38.7416301], [121.1332002, 38.7311507], [121.16135, 38.72259],
  [121.19945, 38.72588], [121.21435, 38.7463901], [121.2307899, 38.76449],
  [121.2490616, 38.7888963], [121.2471158, 38.7926138], [121.223402, 38.7820947],
  [121.2203735, 38.7894954], [121.2256346, 38.7983283], [121.235, 38.8046122],
  [121.252489, 38.8026316], [121.2623534, 38.8006843], [121.2578511, 38.792775],
  [121.2722783, 38.7914], [121.2782236, 38.7874266], [121.2839538, 38.7914296],
  [121.291323, 38.7900247], [121.2904481, 38.7956515], [121.3047046, 38.7934616],
  [121.3182956, 38.8029131], [121.3218135, 38.8159289], [121.351688, 38.8248009],
  [121.3809694, 38.8186224], [121.3992476, 38.8145996], [121.42151, 38.8176899],
  [121.4694585, 38.8191782], [121.4659877, 38.8457177], [121.4517284, 38.8696513],
  [121.4382378, 38.8786934], [121.4167618, 38.8994945], [121.3876725, 38.8995197],
  [121.3710627, 38.9140487], [121.3562781, 38.9302901], [121.3381825, 38.9406468],
  [121.3263454, 38.9459842], [121.3060392, 38.9512466], [121.2758777, 38.9488239],
  [121.27186, 38.96503], [121.25239, 38.95434], [121.2412437, 38.9535461],
  [121.23292, 38.9503199], [121.2215514, 38.9346052], [121.1966301, 38.9355101],
  [121.1938671, 38.9442993], [121.1818356, 38.9523146], [121.1673943, 38.9512058],
  [121.13766, 38.9523001], [121.1125482, 38.9481417], [121.1100101, 38.93478],
  [121.0931004, 38.9252654], [121.0860366, 38.9116463], [121.0855685, 38.9091147],
];

const CENTER = { lon: 121.28, lat: 38.845 };
const project = (lon: number, lat: number): [number, number] => [
  (lon - CENTER.lon) * 520,
  (CENTER.lat - lat) * 720,
];
const COAST_XZ = COASTLINE.map(([lon, lat]) => project(lon, lat));

// Key shoreline features sampled from OpenStreetMap coastline geometry.
const INNER_HARBOR: [number, number][] = [
  [121.2184, 38.796], [121.2221, 38.7953], [121.2246, 38.7972], [121.2264, 38.7991],
  [121.2252, 38.8004], [121.2295, 38.8035], [121.2354, 38.8045], [121.2441, 38.8063],
  [121.2486, 38.8047], [121.2525, 38.8026], [121.2559, 38.8022], [121.2553, 38.7987],
  [121.2548, 38.7945], [121.2574, 38.793], [121.2608, 38.7922], [121.252, 38.789],
  [121.238, 38.7882], [121.226, 38.7901],
];

const TIGER_TAIL: [number, number][] = [
  [121.2184, 38.796], [121.2221, 38.7953], [121.2246, 38.7972], [121.2264, 38.7991],
  [121.2252, 38.8004], [121.2295, 38.8035], [121.2354, 38.8045], [121.2432, 38.806],
];

const pointInPolygon = (x: number, z: number) => {
  let inside = false;
  for (let i = 0, j = COAST_XZ.length - 1; i < COAST_XZ.length; j = i++) {
    const [xi, zi] = COAST_XZ[i];
    const [xj, zj] = COAST_XZ[j];
    const intersects = ((zi > z) !== (zj > z)) && (x < ((xj - xi) * (z - zi)) / (zj - zi) + xi);
    if (intersects) inside = !inside;
  }
  return inside;
};

const seeded = (() => {
  let seed = 9173;
  return () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
})();

const makeLabelTexture = (title: string, detail: string) => {
  const canvas = document.createElement('canvas');
  canvas.width = 640;
  canvas.height = 168;
  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = 'rgba(248, 250, 246, .96)';
  ctx.strokeStyle = 'rgba(22, 54, 58, .22)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(10, 10, 620, 148, 28);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#12363a';
  ctx.font = '700 42px system-ui, sans-serif';
  ctx.fillText(title, 42, 72);
  ctx.fillStyle = '#527075';
  ctx.font = '500 23px system-ui, sans-serif';
  ctx.fillText(detail, 42, 116);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
};

const makeMapTextTexture = (text: string, color: string) => {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = color;
  ctx.font = '800 54px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 256, 64);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
};

const LvshunMap: React.FC<Props> = ({ onHome }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const actionsRef = useRef<{
    focus: (id: string) => void;
    reset: () => void;
    setMode: (mode: SceneMode) => void;
    setAuto: (enabled: boolean) => void;
  }>({ focus: () => {}, reset: () => {}, setMode: () => {}, setAuto: () => {} });
  const [mode, setMode] = useState<SceneMode>('day');
  const [panelOpen, setPanelOpen] = useState(() => typeof window === 'undefined' || window.innerWidth >= 760);
  const [activeId, setActiveId] = useState('baiyushan');
  const [autoTour, setAutoTour] = useState(false);
  const [ready, setReady] = useState(false);
  const [sceneError, setSceneError] = useState(false);
  const activeRef = useRef('baiyushan');

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    } catch {
      setSceneError(true);
      return;
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.8));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1;
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xb7d7d4);
    scene.fog = new THREE.Fog(0xb7d7d4, 280, 680);
    const camera = new THREE.PerspectiveCamera(48, mount.clientWidth / mount.clientHeight, 0.1, 1600);
    const HERO_POS = new THREE.Vector3(145, 116, 166);
    const HERO_TARGET = new THREE.Vector3(-8, 0, 28);
    camera.position.copy(HERO_POS);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.copy(HERO_TARGET);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.minDistance = 42;
    controls.maxDistance = 430;
    controls.maxPolarAngle = Math.PI * 0.47;
    controls.enablePan = true;
    controls.screenSpacePanning = true;

    const disposables: (THREE.BufferGeometry | THREE.Material | THREE.Texture)[] = [];
    const track = <T extends THREE.BufferGeometry | THREE.Material | THREE.Texture>(value: T): T => {
      disposables.push(value);
      return value;
    };

    const hemi = new THREE.HemisphereLight(0xeaf8f4, 0x6a7d60, 1.75);
    scene.add(hemi);
    const sun = new THREE.DirectionalLight(0xfff2cf, 3.5);
    sun.position.set(-130, 240, 100);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.left = -190;
    sun.shadow.camera.right = 190;
    sun.shadow.camera.top = 190;
    sun.shadow.camera.bottom = -190;
    sun.shadow.camera.near = 20;
    sun.shadow.camera.far = 520;
    scene.add(sun);

    const seaMaterial = track(new THREE.MeshPhysicalMaterial({
      color: 0x5faaa8,
      roughness: 0.28,
      metalness: 0.08,
      transparent: true,
      opacity: 0.96,
    }));
    const sea = new THREE.Mesh(track(new THREE.PlaneGeometry(1200, 900, 1, 1)), seaMaterial);
    sea.rotation.x = -Math.PI / 2;
    sea.position.y = -4.5;
    sea.receiveShadow = true;
    scene.add(sea);

    const addWaterPatch = (points: [number, number][], material: THREE.Material, y: number) => {
      const shape = new THREE.Shape();
      points.forEach(([x, z], index) => index === 0 ? shape.moveTo(x, z) : shape.lineTo(x, z));
      shape.closePath();
      const mesh = new THREE.Mesh(track(new THREE.ShapeGeometry(shape)), material);
      mesh.rotation.x = Math.PI / 2;
      mesh.position.y = y;
      mesh.receiveShadow = true;
      scene.add(mesh);
      return mesh;
    };

    // The western Bohai water is warmer and more sediment-rich than the Yellow Sea side.
    const westSeaMaterial = track(new THREE.MeshPhysicalMaterial({
      color: 0x829c86,
      roughness: 0.42,
      transparent: true,
      opacity: 0.72,
    }));
    addWaterPatch([
      [-600, -450], [-62, -450], [-34, 26], [-47, 73], [-92, 124], [-600, 200],
    ], westSeaMaterial, -4.32);

    const harborMaterial = track(new THREE.MeshPhysicalMaterial({
      color: 0x3f8587,
      roughness: 0.2,
      metalness: 0.12,
      transparent: true,
      opacity: 0.92,
    }));
    addWaterPatch(INNER_HARBOR.map(([lon, lat]) => project(lon, lat)), harborMaterial, -4.18);

    const landShape = new THREE.Shape();
    COAST_XZ.forEach(([x, z], i) => i === 0 ? landShape.moveTo(x, z) : landShape.lineTo(x, z));
    landShape.closePath();
    const terrainGeometry = track(new THREE.ExtrudeGeometry(landShape, {
      depth: 8,
      bevelEnabled: true,
      bevelSegments: 2,
      bevelSize: 1.2,
      bevelThickness: 1,
    }));
    terrainGeometry.rotateX(Math.PI / 2);
    const terrainMaterial = track(new THREE.MeshStandardMaterial({ color: 0x8dad74, roughness: 0.96, metalness: 0 }));
    const terrain = new THREE.Mesh(terrainGeometry, terrainMaterial);
    terrain.position.y = 2;
    terrain.receiveShadow = true;
    terrain.castShadow = true;
    scene.add(terrain);

    const coastLineGeometry = track(new THREE.BufferGeometry().setFromPoints(
      COAST_XZ.map(([x, z]) => new THREE.Vector3(x, 3.25, z)),
    ));
    const coastLineMaterial = track(new THREE.LineBasicMaterial({ color: 0xe9f3d8, transparent: true, opacity: 0.8 }));
    scene.add(new THREE.LineLoop(coastLineGeometry, coastLineMaterial));

    // Hill fields establish the recognizable hilly character of the peninsula.
    const hillMaterial = track(new THREE.MeshStandardMaterial({ color: 0x64865c, roughness: 1, flatShading: true }));
    const hillGeometry = track(new THREE.DodecahedronGeometry(7, 1));
    const hills = new THREE.InstancedMesh(hillGeometry, hillMaterial, 190);
    hills.castShadow = true;
    hills.receiveShadow = true;
    hills.frustumCulled = false;
    const matrix = new THREE.Matrix4();
    const quat = new THREE.Quaternion();
    let hillCount = 0;
    for (let attempt = 0; attempt < 1500 && hillCount < 190; attempt++) {
      const x = -100 + seeded() * 205;
      const z = -86 + seeded() * 174;
      const urban = Math.hypot(x + 14, z - 24) < 38;
      if (!urban && pointInPolygon(x, z)) {
        const scale = 0.5 + seeded() * 1.08;
        const width = scale * (0.9 + seeded() * 0.65);
        const depth = scale * (0.85 + seeded() * 0.52);
        matrix.compose(
          new THREE.Vector3(x, 5.3 * scale + 2, z),
          quat.setFromEuler(new THREE.Euler(0, seeded() * Math.PI, 0)),
          new THREE.Vector3(width, scale * 0.78, depth),
        );
        hills.setMatrixAt(hillCount++, matrix);
      }
    }
    hills.count = hillCount;
    scene.add(hills);

    const sandMaterial = track(new THREE.MeshStandardMaterial({ color: 0xc4b885, roughness: 0.94 }));
    const tigerTailPoints = TIGER_TAIL.map(([lon, lat]) => {
      const [x, z] = project(lon, lat);
      return new THREE.Vector3(x, 3.7, z);
    });
    const tigerTailCurve = new THREE.CatmullRomCurve3(tigerTailPoints);
    const tigerTailSand = new THREE.Mesh(track(new THREE.TubeGeometry(tigerTailCurve, 80, 2.8, 8, false)), sandMaterial);
    const tigerTailGreen = new THREE.Mesh(track(new THREE.TubeGeometry(tigerTailCurve, 80, 1.75, 8, false)), hillMaterial);
    tigerTailGreen.position.y = 0.65;
    scene.add(tigerTailSand, tigerTailGreen);

    const treeTrunkMat = track(new THREE.MeshStandardMaterial({ color: 0x6b5540, roughness: 1 }));
    const treeCrownMat = track(new THREE.MeshStandardMaterial({ color: 0x3f7557, roughness: 1 }));
    const trunks = new THREE.InstancedMesh(track(new THREE.CylinderGeometry(0.22, 0.35, 2.2, 5)), treeTrunkMat, 620);
    const crowns = new THREE.InstancedMesh(track(new THREE.ConeGeometry(1.25, 3.8, 6)), treeCrownMat, 620);
    trunks.castShadow = true;
    crowns.castShadow = true;
    trunks.frustumCulled = false;
    crowns.frustumCulled = false;
    let treeCount = 0;
    for (let attempt = 0; attempt < 3000 && treeCount < 620; attempt++) {
      const x = -100 + seeded() * 205;
      const z = -87 + seeded() * 176;
      const urban = Math.hypot(x + 14, z - 24) < 33;
      if (!urban && pointInPolygon(x, z)) {
        const s = 0.7 + seeded() * 0.65;
        matrix.compose(new THREE.Vector3(x, 3.1, z), quat, new THREE.Vector3(s, s, s));
        trunks.setMatrixAt(treeCount, matrix);
        matrix.compose(new THREE.Vector3(x, 6.1, z), quat, new THREE.Vector3(s, s, s));
        crowns.setMatrixAt(treeCount, matrix);
        treeCount++;
      }
    }
    trunks.count = treeCount;
    crowns.count = treeCount;
    scene.add(trunks, crowns);

    // Low-rise city fabric around the old town and harbor.
    const buildingMaterial = track(new THREE.MeshStandardMaterial({ color: 0xdccfb8, roughness: 0.8, emissive: 0x2c251d, emissiveIntensity: 0.08 }));
    const buildingGeometry = track(new THREE.BoxGeometry(1, 1, 1));
    const buildings = new THREE.InstancedMesh(buildingGeometry, buildingMaterial, 360);
    buildings.castShadow = true;
    buildings.receiveShadow = true;
    buildings.frustumCulled = false;
    let buildingCount = 0;
    const clusters = [
      { x: -15, z: 24, rx: 34, rz: 28 },
      { x: 25, z: 8, rx: 28, rz: 22 },
      { x: 58, z: 0, rx: 25, rz: 17 },
    ];
    for (let attempt = 0; attempt < 1500 && buildingCount < 360; attempt++) {
      const cluster = clusters[Math.floor(seeded() * clusters.length)];
      const x = cluster.x + (seeded() - 0.5) * cluster.rx * 2;
      const z = cluster.z + (seeded() - 0.5) * cluster.rz * 2;
      if (!pointInPolygon(x, z)) continue;
      const w = 1.8 + seeded() * 3.8;
      const d = 1.8 + seeded() * 3.5;
      const h = 2.5 + seeded() * (cluster.x < 0 ? 7 : 11);
      matrix.compose(new THREE.Vector3(x, 3 + h / 2, z), quat.setFromEuler(new THREE.Euler(0, (seeded() - 0.5) * 0.5, 0)), new THREE.Vector3(w, h, d));
      buildings.setMatrixAt(buildingCount, matrix);
      buildingCount++;
    }
    buildings.count = buildingCount;
    scene.add(buildings);

    const roadMaterial = track(new THREE.MeshStandardMaterial({ color: 0xe7dfc8, roughness: 0.85 }));
    const addRoad = (coords: [number, number][], width = 0.85) => {
      const points = coords.map(([lon, lat]) => {
        const [x, z] = project(lon, lat);
        return new THREE.Vector3(x, 3.6, z);
      });
      const curve = new THREE.CatmullRomCurve3(points);
      const road = new THREE.Mesh(track(new THREE.TubeGeometry(curve, 80, width, 6, false)), roadMaterial);
      road.castShadow = true;
      scene.add(road);
    };
    addRoad([[121.19, 38.75], [121.22, 38.785], [121.246, 38.806], [121.279, 38.825], [121.33, 38.83], [121.4, 38.835]]);
    addRoad([[121.22, 38.808], [121.25, 38.81], [121.278, 38.792], [121.315, 38.802]], 0.65);
    addRoad([[121.135, 38.86], [121.18, 38.84], [121.225, 38.81], [121.255, 38.804]], 0.55);

    const landmarkRoot = new THREE.Group();
    scene.add(landmarkRoot);
    const ochreMat = track(new THREE.MeshStandardMaterial({ color: 0xb86f3e, roughness: 0.7 }));
    const paleMat = track(new THREE.MeshStandardMaterial({ color: 0xeee8d7, roughness: 0.7 }));
    const roofMat = track(new THREE.MeshStandardMaterial({ color: 0x365c58, roughness: 0.78 }));
    const darkMat = track(new THREE.MeshStandardMaterial({ color: 0x283c3d, roughness: 0.72 }));
    const beaconMat = track(new THREE.MeshBasicMaterial({ color: 0xe8b65d, transparent: true, opacity: 0.82, side: THREE.DoubleSide }));

    const at = (id: string) => {
      const lm = LANDMARKS.find((item) => item.id === id)!;
      const [x, z] = project(lm.lon, lm.lat);
      const group = new THREE.Group();
      group.position.set(x, 3.4, z);
      landmarkRoot.add(group);
      return group;
    };
    const box = (g: THREE.Group, w: number, h: number, d: number, mat: THREE.Material, x = 0, y = h / 2, z = 0) => {
      const mesh = new THREE.Mesh(track(new THREE.BoxGeometry(w, h, d)), mat);
      mesh.position.set(x, y, z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      g.add(mesh);
      return mesh;
    };

    const baiyu = at('baiyushan');
    const baiyuHill = new THREE.Mesh(track(new THREE.ConeGeometry(11, 9, 14)), hillMaterial);
    baiyuHill.position.y = 4.5;
    baiyu.add(baiyuHill);
    const tower = new THREE.Mesh(track(new THREE.CylinderGeometry(2.8, 3.8, 15, 14)), paleMat);
    tower.position.y = 15.5;
    tower.castShadow = true;
    baiyu.add(tower);
    const towerCap = new THREE.Mesh(track(new THREE.ConeGeometry(4, 3.5, 14)), roofMat);
    towerCap.position.y = 24.5;
    baiyu.add(towerCap);

    const museum = at('museum');
    box(museum, 15, 5, 9, paleMat);
    box(museum, 13, 2, 11, roofMat, 0, 6, 0);
    for (let i = -5; i <= 5; i += 2) {
      const column = new THREE.Mesh(track(new THREE.CylinderGeometry(0.35, 0.45, 4.2, 8)), paleMat);
      column.position.set(i, 3.1, 4.9);
      column.castShadow = true;
      museum.add(column);
    }

    const sunStreet = at('taiyanggou');
    for (let i = 0; i < 7; i++) {
      const home = box(sunStreet, 3.2, 3 + (i % 2), 4, i % 2 ? paleMat : ochreMat, (i - 3) * 4.2, 1.7 + (i % 2) * 0.5, (i % 2) * 4 - 2);
      home.rotation.y = (i - 3) * 0.04;
      const roof = new THREE.Mesh(track(new THREE.ConeGeometry(2.8, 1.8, 4)), roofMat);
      roof.rotation.y = Math.PI / 4;
      roof.position.set((i - 3) * 4.2, 4.1 + (i % 2), (i % 2) * 4 - 2);
      sunStreet.add(roof);
    }

    const port = at('port');
    box(port, 26, 0.9, 5, darkMat, 0, 0.45, 0);
    for (const z of [-7, 7]) {
      const ship = new THREE.Group();
      const hull = new THREE.Mesh(track(new THREE.CapsuleGeometry(1.3, 8, 4, 10)), darkMat);
      hull.rotation.z = Math.PI / 2;
      hull.position.y = 1.2;
      ship.add(hull);
      box(ship, 4.5, 1.7, 2.6, paleMat, -0.5, 2.4, 0);
      ship.position.set(3, 0, z);
      port.add(ship);
    }

    const tigerTail = at('tigertail');
    const tigerTailLookout = box(tigerTail, 4.5, 1.2, 4.5, paleMat, 0, 0.8, 0);
    tigerTailLookout.rotation.y = Math.PI / 7;
    const tigerTailRoof = new THREE.Mesh(track(new THREE.ConeGeometry(3.5, 2.2, 6)), roofMat);
    tigerTailRoof.position.y = 2.8;
    tigerTail.add(tigerTailRoof);

    const hill203 = at('hill203');
    const hill203Mound = new THREE.Mesh(track(new THREE.DodecahedronGeometry(10, 1)), hillMaterial);
    hill203Mound.scale.set(1.25, 0.68, 1);
    hill203Mound.position.y = 6.5;
    hill203Mound.castShadow = true;
    hill203.add(hill203Mound);
    const hill203Monument = new THREE.Mesh(track(new THREE.CylinderGeometry(1.1, 1.8, 10, 8)), paleMat);
    hill203Monument.position.y = 16;
    hill203Monument.castShadow = true;
    hill203.add(hill203Monument);

    const fort = at('dongjiguan');
    const fortHill = new THREE.Mesh(track(new THREE.ConeGeometry(10, 7, 10)), hillMaterial);
    fortHill.position.y = 3.5;
    fort.add(fortHill);
    for (let i = 0; i < 5; i++) {
      const angle = (i / 5) * Math.PI * 2;
      box(fort, 3.5, 3, 3.5, darkMat, Math.cos(angle) * 5, 8, Math.sin(angle) * 5);
    }

    const submarine = at('submarine');
    const subHull = new THREE.Mesh(track(new THREE.CapsuleGeometry(2.1, 13, 6, 14)), darkMat);
    subHull.rotation.z = Math.PI / 2;
    subHull.position.y = 3.4;
    subHull.castShadow = true;
    submarine.add(subHull);
    box(submarine, 3.2, 2.2, 2.4, darkMat, 0, 6, 0);

    const station = at('station');
    box(station, 12, 4.5, 6, ochreMat);
    const stationRoof = new THREE.Mesh(track(new THREE.ConeGeometry(7.4, 2.6, 4)), roofMat);
    stationRoof.rotation.y = Math.PI / 4;
    stationRoof.position.y = 6;
    station.add(stationRoof);
    const railMat = track(new THREE.LineBasicMaterial({ color: 0x4b5656 }));
    for (const x of [-2, 2]) {
      const rail = new THREE.Line(track(new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(x, 0.4, -18), new THREE.Vector3(x, 0.4, 18),
      ])), railMat);
      station.add(rail);
    }

    const laotie = at('laotieshan');
    const laotieHill = new THREE.Mesh(track(new THREE.ConeGeometry(12, 10, 12)), hillMaterial);
    laotieHill.position.y = 5;
    laotie.add(laotieHill);
    const lighthouse = new THREE.Mesh(track(new THREE.CylinderGeometry(1.3, 2.2, 13, 14)), paleMat);
    lighthouse.position.y = 15;
    lighthouse.castShadow = true;
    laotie.add(lighthouse);
    const lightCap = new THREE.Mesh(track(new THREE.CylinderGeometry(2.2, 2.2, 2, 14)), ochreMat);
    lightCap.position.y = 22.5;
    laotie.add(lightCap);
    const lighthouseGlow = new THREE.PointLight(0xffd27c, 6, 55);
    lighthouseGlow.position.y = 23;
    laotie.add(lighthouseGlow);

    // The yellow line marks the familiar tourist viewpoint of the Bohai and Yellow Sea boundary.
    const boundaryPoints = [
      new THREE.Vector3(-72, -1.2, 92),
      new THREE.Vector3(-59, -1.2, 82),
      new THREE.Vector3(-45, -1.2, 72),
    ];
    const boundaryCurve = new THREE.CatmullRomCurve3(boundaryPoints);
    const boundaryTube = new THREE.Mesh(
      track(new THREE.TubeGeometry(boundaryCurve, 40, 0.55, 8, false)),
      beaconMat,
    );
    scene.add(boundaryTube);

    const addMapText = (text: string, x: number, z: number, width: number, color: string) => {
      const texture = track(makeMapTextTexture(text, color));
      const material = track(new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false, opacity: 0.72 }));
      const sprite = new THREE.Sprite(material);
      sprite.position.set(x, 1.2, z);
      sprite.scale.set(width, width * 0.25, 1);
      sprite.renderOrder = 4;
      scene.add(sprite);
      return material;
    };
    const bohaiLabel = addMapText('渤 海', -142, 54, 31, '#335f61');
    const yellowSeaLabel = addMapText('黄 海', 134, 70, 31, '#335f61');
    const harborLabel = addMapText('旅 顺 口', -12, 42, 23, '#e7f0df');

    const markerSprites: THREE.Sprite[] = [];
    const markerRings: THREE.Mesh[] = [];
    const markerLeaders: (THREE.Line | null)[] = [];
    const overviewLabels = new Set(['baiyushan', 'port', 'tigertail', 'hill203', 'dongjiguan', 'laotieshan']);
    const leaderMaterial = track(new THREE.LineBasicMaterial({ color: 0xe9f3d8, transparent: true, opacity: 0.55 }));
    LANDMARKS.forEach((lm) => {
      const [x, z] = project(lm.lon, lm.lat);
      const [dx, dy, dz] = lm.labelOffset ?? [0, lm.id === 'laotieshan' ? 31 : 17, 0];
      const texture = track(makeLabelTexture(lm.name, lm.kind));
      const spriteMaterial = track(new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false }));
      const sprite = new THREE.Sprite(spriteMaterial);
      sprite.scale.set(24, 6.3, 1);
      sprite.position.set(x + dx, dy, z + dz);
      sprite.userData.landmarkId = lm.id;
      sprite.renderOrder = 20;
      scene.add(sprite);
      markerSprites.push(sprite);

      if (dx !== 0 || dz !== 0) {
        const leader = new THREE.Line(track(new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(x, 4.2, z),
          new THREE.Vector3(x + dx, Math.max(8, dy - 4), z + dz),
        ])), leaderMaterial);
        scene.add(leader);
        markerLeaders.push(leader);
      } else {
        markerLeaders.push(null);
      }

      const ringMaterial = track(new THREE.MeshBasicMaterial({ color: 0xe8b65d, transparent: true, opacity: 0.62, side: THREE.DoubleSide }));
      const ring = new THREE.Mesh(track(new THREE.RingGeometry(2.2, 3.2, 32)), ringMaterial);
      ring.rotation.x = -Math.PI / 2;
      ring.position.set(x, 4.1, z);
      ring.userData.landmarkId = lm.id;
      scene.add(ring);
      markerRings.push(ring);
    });

    // Small moving boats keep the harbor alive and communicate that the water is navigable.
    const [harborCenterX, harborCenterZ] = project(121.243, 38.796);
    const boats: { group: THREE.Group; phase: number; radiusX: number; radiusZ: number }[] = [];
    for (let i = 0; i < 8; i++) {
      const boat = new THREE.Group();
      const hull = new THREE.Mesh(track(new THREE.CapsuleGeometry(0.7, 3.2, 4, 8)), i % 2 ? paleMat : ochreMat);
      hull.rotation.z = Math.PI / 2;
      boat.add(hull);
      const cabin = box(boat, 1.6, 1.1, 1.2, paleMat, 0, 1.1, 0);
      cabin.castShadow = false;
      boat.position.y = -3;
      scene.add(boat);
      boats.push({
        group: boat,
        phase: seeded() * Math.PI * 2,
        radiusX: 8 + seeded() * 18,
        radiusZ: 4 + seeded() * 8,
      });
    }

    const starsGeo = track(new THREE.BufferGeometry());
    const starPositions = new Float32Array(520 * 3);
    for (let i = 0; i < 520; i++) {
      starPositions[i * 3] = (seeded() - 0.5) * 800;
      starPositions[i * 3 + 1] = 100 + seeded() * 300;
      starPositions[i * 3 + 2] = (seeded() - 0.5) * 700;
    }
    starsGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    const starsMaterial = track(new THREE.PointsMaterial({ color: 0xeaf6f1, size: 1.3, transparent: true, opacity: 0 }));
    const stars = new THREE.Points(starsGeo, starsMaterial);
    scene.add(stars);

    const modeColors: Record<SceneMode, {
      bg: number; fog: number; sea: number; land: number; hill: number; crown: number;
      hemiSky: number; hemiGround: number; hemi: number; sun: number; sunI: number; exposure: number;
    }> = {
      day: { bg: 0xb7d7d4, fog: 0xb7d7d4, sea: 0x5faaa8, land: 0x8dad74, hill: 0x64865c, crown: 0x3f7557, hemiSky: 0xeaf8f4, hemiGround: 0x6a7d60, hemi: 1.75, sun: 0xfff2cf, sunI: 3.5, exposure: 1 },
      sunset: { bg: 0xe0a886, fog: 0xd5a58b, sea: 0x567f86, land: 0x9b8e67, hill: 0x6c7259, crown: 0x4d684f, hemiSky: 0xffd4aa, hemiGround: 0x5a574a, hemi: 1.25, sun: 0xff9b59, sunI: 4.2, exposure: 0.92 },
      night: { bg: 0x10262f, fog: 0x17323a, sea: 0x214f5a, land: 0x536f58, hill: 0x405b4b, crown: 0x2e5044, hemiSky: 0x7da5b4, hemiGround: 0x29443a, hemi: 1.05, sun: 0xb3d5df, sunI: 1.8, exposure: 0.92 },
    };
    let currentMode: SceneMode = 'day';
    const applyMode = (next: SceneMode) => {
      currentMode = next;
      const palette = modeColors[next];
      (scene.background as THREE.Color).setHex(palette.bg);
      (scene.fog as THREE.Fog).color.setHex(palette.fog);
      seaMaterial.color.setHex(palette.sea);
      westSeaMaterial.color.setHex(next === 'night' ? 0x3e5b56 : next === 'sunset' ? 0x8a7664 : 0x829c86);
      harborMaterial.color.setHex(next === 'night' ? 0x183e4b : next === 'sunset' ? 0x4f6a70 : 0x3f8587);
      terrainMaterial.color.setHex(palette.land);
      hillMaterial.color.setHex(palette.hill);
      treeCrownMat.color.setHex(palette.crown);
      hemi.color.setHex(palette.hemiSky);
      hemi.groundColor.setHex(palette.hemiGround);
      hemi.intensity = palette.hemi;
      sun.color.setHex(palette.sun);
      sun.intensity = palette.sunI;
      renderer.toneMappingExposure = palette.exposure;
      starsMaterial.opacity = next === 'night' ? 0.82 : 0;
      lighthouseGlow.intensity = next === 'night' ? 11 : 4;
      bohaiLabel.opacity = next === 'night' ? 0.5 : 0.72;
      yellowSeaLabel.opacity = next === 'night' ? 0.5 : 0.72;
      harborLabel.opacity = next === 'night' ? 0.76 : 0.68;
    };

    type CameraTween = {
      start: number;
      fromPosition: THREE.Vector3;
      toPosition: THREE.Vector3;
      fromTarget: THREE.Vector3;
      toTarget: THREE.Vector3;
    };
    let cameraTween: CameraTween | null = null;
    let autoEnabled = false;
    let autoIndex = 0;
    let lastAuto = performance.now();
    const startTween = (position: THREE.Vector3, target: THREE.Vector3) => {
      cameraTween = {
        start: performance.now(),
        fromPosition: camera.position.clone(),
        toPosition: position,
        fromTarget: controls.target.clone(),
        toTarget: target,
      };
    };
    const focus = (id: string) => {
      const landmark = LANDMARKS.find((item) => item.id === id);
      if (!landmark) return;
      const [x, z] = project(landmark.lon, landmark.lat);
      const target = new THREE.Vector3(x, 7, z);
      const cameraHeight = landmark.cameraHeight ?? 28;
      startTween(new THREE.Vector3(x + 38, cameraHeight, z + 46), target);
      activeRef.current = id;
      setActiveId(id);
      lastAuto = performance.now();
    };
    const reset = () => {
      startTween(HERO_POS.clone(), HERO_TARGET.clone());
      activeRef.current = 'baiyushan';
      setActiveId('baiyushan');
      lastAuto = performance.now();
    };
    actionsRef.current = {
      focus,
      reset,
      setMode: applyMode,
      setAuto: (enabled) => {
        autoEnabled = enabled;
        lastAuto = performance.now();
        if (enabled) focus(LANDMARKS[autoIndex].id);
      },
    };

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const onPointerDown = (event: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const hit = raycaster.intersectObjects([...markerSprites, ...markerRings], false)[0];
      const id = hit?.object.userData.landmarkId as string | undefined;
      if (id) focus(id);
    };
    const onPointerMove = (event: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      renderer.domElement.style.cursor = raycaster.intersectObjects(markerSprites, false).length ? 'pointer' : 'grab';
    };
    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    renderer.domElement.addEventListener('pointermove', onPointerMove);
    controls.addEventListener('start', () => { cameraTween = null; lastAuto = performance.now(); });

    let frame = 0;
    let didSignalReady = false;
    const clock = new THREE.Clock();
    const tick = () => {
      frame = requestAnimationFrame(tick);
      const elapsed = clock.getElapsedTime();
      const now = performance.now();
      if (cameraTween) {
        const raw = Math.min(1, (now - cameraTween.start) / 1350);
        const ease = 1 - Math.pow(1 - raw, 3);
        camera.position.lerpVectors(cameraTween.fromPosition, cameraTween.toPosition, ease);
        controls.target.lerpVectors(cameraTween.fromTarget, cameraTween.toTarget, ease);
        if (raw >= 1) cameraTween = null;
      }
      if (autoEnabled && now - lastAuto > 7200) {
        autoIndex = (autoIndex + 1) % LANDMARKS.length;
        focus(LANDMARKS[autoIndex].id);
      }
      const cameraDistance = camera.position.distanceTo(controls.target);
      markerRings.forEach((ring, i) => {
        const pulse = 1 + Math.sin(elapsed * 2.2 + i * 0.7) * 0.16;
        ring.scale.setScalar(pulse);
        (ring.material as THREE.MeshBasicMaterial).opacity = LANDMARKS[i].id === activeRef.current ? 1 : 0.62;
        const showLabel = LANDMARKS[i].id === activeRef.current
          || (cameraDistance >= 145 && overviewLabels.has(LANDMARKS[i].id));
        const labelWidth = THREE.MathUtils.clamp(cameraDistance * 0.115, 9, 24);
        markerSprites[i].scale.set(labelWidth, labelWidth * 0.2625, 1);
        markerSprites[i].visible = showLabel;
        if (markerLeaders[i]) markerLeaders[i]!.visible = showLabel;
      });
      boats.forEach((boat, i) => {
        const angle = elapsed * (0.05 + i * 0.004) + boat.phase;
        boat.group.position.x = harborCenterX + Math.cos(angle) * boat.radiusX;
        boat.group.position.z = harborCenterZ + Math.sin(angle) * boat.radiusZ;
        boat.group.rotation.y = -angle;
      });
      if (currentMode === 'night') stars.rotation.y = elapsed * 0.006;
      controls.update();
      renderer.render(scene, camera);
      if (!didSignalReady) {
        didSignalReady = true;
        setReady(true);
      }
    };
    tick();

    const onResize = () => {
      const width = mount.clientWidth;
      const height = mount.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', onResize);
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      renderer.domElement.removeEventListener('pointermove', onPointerMove);
      controls.dispose();
      disposables.forEach((item) => item.dispose());
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  const chooseMode = (next: SceneMode) => {
    setMode(next);
    actionsRef.current.setMode(next);
  };
  const toggleAuto = () => {
    const next = !autoTour;
    setAutoTour(next);
    actionsRef.current.setAuto(next);
  };
  const active = LANDMARKS.find((item) => item.id === activeId) ?? LANDMARKS[0];

  return (
    <main className={`lvshun-root ${mode === 'night' ? 'is-night' : ''}`}>
      <div ref={mountRef} className="lvshun-canvas" aria-label="旅顺口三维互动地图" />

      {!ready && !sceneError && (
        <div className="lvshun-loading" role="status">
          <div className="lvshun-loading-mark" />
          <p>正在展开旅顺半岛</p>
          <span>构建海岸、山地与城市地标</span>
        </div>
      )}

      {sceneError && (
        <div className="lvshun-error" role="alert">
          <Compass size={32} weight="duotone" />
          <h1>三维地图暂时无法启动</h1>
          <p>浏览器没有开启 WebGL。请换用最新版 Chrome 或 Safari。</p>
          <button onClick={onHome}>返回主页</button>
        </div>
      )}

      <header className="lvshun-header">
        <button className="lvshun-icon-button" onClick={onHome} aria-label="返回主页">
          <ArrowLeft size={19} weight="bold" />
        </button>
        <div className="lvshun-brand">
          <p>辽东半岛南端</p>
          <h1>山海旅顺</h1>
        </div>
        <div className="lvshun-mode-switch" aria-label="光线模式">
          <button className={mode === 'day' ? 'is-active' : ''} onClick={() => chooseMode('day')} aria-label="昼景">
            <Sun size={17} weight="fill" />
            <span>昼景</span>
          </button>
          <button className={mode === 'sunset' ? 'is-active' : ''} onClick={() => chooseMode('sunset')} aria-label="日落">
            <CloudSun size={17} weight="fill" />
            <span>日落</span>
          </button>
          <button className={mode === 'night' ? 'is-active' : ''} onClick={() => chooseMode('night')} aria-label="夜景">
            <MoonStars size={17} weight="fill" />
            <span>夜景</span>
          </button>
        </div>
      </header>

      <aside className={`lvshun-panel ${panelOpen ? 'is-open' : ''}`}>
        <div className="lvshun-panel-head">
          <div>
            <p>选择地标</p>
            <h2>从一座山，看见一座城</h2>
          </div>
          <button onClick={() => setPanelOpen(false)} aria-label="收起地标列表"><X size={17} weight="bold" /></button>
        </div>
        <div className="lvshun-landmarks">
          {LANDMARKS.map((landmark) => (
            <button
              key={landmark.id}
              className={landmark.id === activeId ? 'is-active' : ''}
              onClick={() => {
                actionsRef.current.focus(landmark.id);
                if (window.innerWidth < 760) setPanelOpen(false);
              }}
            >
              <span className="lvshun-landmark-icon"><MapPin size={17} weight={landmark.id === activeId ? 'fill' : 'regular'} /></span>
              <span>
                <strong>{landmark.name}</strong>
                <small>{landmark.short}</small>
              </span>
            </button>
          ))}
        </div>
      </aside>

      {!panelOpen && (
        <button className="lvshun-open-panel" onClick={() => setPanelOpen(true)}>
          <List size={18} weight="bold" />
          <span>地标</span>
        </button>
      )}

      <section className="lvshun-active-card" aria-live="polite">
        <span>{active.kind}</span>
        <strong>{active.name}</strong>
        <p>{active.short}</p>
      </section>

      <footer className="lvshun-controls">
        <button onClick={toggleAuto} className={autoTour ? 'is-active' : ''}>
          {autoTour ? <Pause size={17} weight="fill" /> : <Play size={17} weight="fill" />}
          <span>{autoTour ? '暂停巡游' : '自动巡游'}</span>
        </button>
        <div className="lvshun-hint">
          <span>拖动旋转</span>
          <span>滚轮缩放</span>
          <span>点击地标飞行</span>
        </div>
        <button onClick={() => actionsRef.current.reset()}>
          <Compass size={18} weight="bold" />
          <span>全景</span>
        </button>
      </footer>
    </main>
  );
};

export default LvshunMap;
