import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, MeshDistortMaterial, Float } from '@react-three/drei';

interface Props {
  onHome: () => void;
}

const Orb: React.FC = () => (
  <Float speed={1.6} rotationIntensity={0.8} floatIntensity={1.1}>
    <mesh castShadow>
      <icosahedronGeometry args={[1.45, 12]} />
      <MeshDistortMaterial color="#caa45a" metalness={0.65} roughness={0.18} distort={0.38} speed={2.2} />
    </mesh>
  </Float>
);

const Spark: React.FC<{ position: [number, number, number]; scale: number }> = ({ position, scale }) => (
  <Float speed={2.4} floatIntensity={2.2} rotationIntensity={1.5}>
    <mesh position={position} scale={scale}>
      <icosahedronGeometry args={[0.18, 0]} />
      <meshStandardMaterial color="#ece6da" metalness={0.4} roughness={0.4} />
    </mesh>
  </Float>
);

/** A small interactive React Three Fiber scene — drag to orbit a sculpted orb. */
const ThreeOrb: React.FC<Props> = ({ onHome }) => {
  return (
    <div className="relative h-screen w-screen overflow-hidden bg-black">
      <Canvas camera={{ position: [0, 0, 5], fov: 45 }} dpr={[1, 2]} shadows>
        <color attach="background" args={['#0c0b0a']} />
        <fog attach="fog" args={['#0c0b0a', 6, 14]} />
        <ambientLight intensity={0.35} />
        <directionalLight position={[5, 6, 5]} intensity={1.3} castShadow />
        <pointLight position={[-6, -3, 2]} color="#8a682c" intensity={2.4} />
        <pointLight position={[4, -4, -3]} color="#ffffff" intensity={0.8} />
        <Suspense fallback={null}>
          <Orb />
          <Spark position={[2.4, 1.2, -1]} scale={1} />
          <Spark position={[-2.6, -1, -0.5]} scale={0.8} />
          <Spark position={[1.8, -1.8, 0.5]} scale={0.6} />
        </Suspense>
        <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.7} />
      </Canvas>

      <button
        onClick={onHome}
        className="absolute left-4 top-4 z-10 inline-flex items-center gap-2 rounded-full border border-white/20 bg-black/40 px-4 py-2 text-xs font-semibold text-white/85 backdrop-blur-md transition-colors hover:border-white/40 hover:text-white"
        style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
      >
        <span aria-hidden="true">←</span> Da Lei · 大雷
      </button>

      <div className="pointer-events-none absolute bottom-5 left-1/2 z-10 -translate-x-1/2 text-center" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
        <p className="text-xs uppercase tracking-[0.3em] text-white/70">拖拽旋转 · 自动环绕</p>
        <p className="mt-1 text-[10px] text-white/35">React Three Fiber · drei — 3D 起手式</p>
      </div>
    </div>
  );
};

export default ThreeOrb;
