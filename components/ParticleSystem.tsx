import React, { useMemo, useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ParticleShape } from '../types';

interface ParticleSystemProps {
  shape: ParticleShape;
  color: string;
  tension: number; // 0 to 1
  count?: number;
  prevTension?: number; // For detecting rapid changes
  customText?: string; // Custom text to display
}

// Generate text points using canvas - OPTIMIZED VERSION
const generateTextPoints = (text: string, count: number): Float32Array => {
  const positions = new Float32Array(count * 3);
  
  // Create a canvas to render text
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  
  // Moderate canvas size for performance
  const width = 600;
  const height = 150;
  canvas.width = width;
  canvas.height = height;
  
  // Clear and draw text
  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = 'white';
  
  // Use clear font
  ctx.font = 'bold 100px "PingFang SC", "Microsoft YaHei", "Heiti SC", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, width / 2, height / 2);
  
  // Get pixel data
  const imageData = ctx.getImageData(0, 0, width, height);
  const pixels = imageData.data;
  
  // Collect text pixel positions - sample every few pixels for performance
  const textPixels: { x: number; y: number }[] = [];
  const step = 2; // Sample every 2 pixels for better performance
  for (let y = 0; y < height; y += step) {
    for (let x = 0; x < width; x += step) {
      const i = (y * width + x) * 4;
      if (pixels[i] > 100) {
        textPixels.push({ x, y });
      }
    }
  }
  
  console.log('Text pixels found:', textPixels.length);
  
  // Scale factor for 3D space - make text larger
  const scale = 0.035;
  const offsetX = width / 2;
  const offsetY = height / 2;
  
  for (let i = 0; i < count; i++) {
    const i3 = i * 3;
    
    if (textPixels.length > 0) {
      // Pick a text pixel
      const pixel = textPixels[i % textPixels.length];
      
      // Minimal depth for flat readable text
      const z = (Math.random() - 0.5) * 0.2;
      
      // Small jitter
      const jitterX = (Math.random() - 0.5) * 0.05;
      const jitterY = (Math.random() - 0.5) * 0.05;
      
      positions[i3] = (pixel.x - offsetX) * scale + jitterX;
      positions[i3 + 1] = -(pixel.y - offsetY) * scale + jitterY;
      positions[i3 + 2] = z;
    } else {
      // Fallback: create a simple "HI" pattern if text rendering fails
      const col = i % 20;
      const row = Math.floor(i / 20) % 10;
      positions[i3] = (col - 10) * 0.3;
      positions[i3 + 1] = (row - 5) * 0.3;
      positions[i3 + 2] = 0;
    }
  }
  
  return positions;
};

const GenerateParticles = (count: number, shape: ParticleShape, customText?: string): Float32Array => {
  // Handle text shape specially
  if (shape === ParticleShape.TEXT) {
    return generateTextPoints(customText || '大雷早上好', count);
  }
  
  const positions = new Float32Array(count * 3);
  
  for (let i = 0; i < count; i++) {
    let x = 0, y = 0, z = 0;
    const i3 = i * 3;

    switch (shape) {
      case ParticleShape.SPHERE: {
        const r = 4 * Math.cbrt(Math.random());
        const theta = Math.random() * 2 * Math.PI;
        const phi = Math.acos(2 * Math.random() - 1);
        x = r * Math.sin(phi) * Math.cos(theta);
        y = r * Math.sin(phi) * Math.sin(theta);
        z = r * Math.cos(phi);
        break;
      }
      
      case ParticleShape.HEART: {
        const t = Math.random() * Math.PI * 2;
        const r = Math.random();
        let hx = 16 * Math.pow(Math.sin(t), 3);
        let hy = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
        hx *= 0.25;
        hy *= 0.25;
        const hz = (Math.random() - 0.5) * 2;
        x = hx * r;
        y = hy * r;
        z = hz * r;
        break;
      }
      
      case ParticleShape.FLOWER: {
        const petals = 6;
        const theta = Math.random() * 2 * Math.PI;
        const rMax = Math.cos(petals * theta) + 2;
        const r = Math.random() * rMax * 1.5;
        x = r * Math.cos(theta);
        y = r * Math.sin(theta);
        z = (Math.random() - 0.5) * 1.5;
        if (Math.random() < 0.2) {
          const cr = Math.random() * 1;
          const ctheta = Math.random() * 2 * Math.PI;
          const cphi = Math.acos(2 * Math.random() - 1);
          x = cr * Math.sin(cphi) * Math.cos(ctheta);
          y = cr * Math.sin(cphi) * Math.sin(ctheta);
          z = cr * Math.cos(cphi);
        }
        break;
      }
      
      case ParticleShape.SATURN: {
        if (Math.random() < 0.6) {
          const r = 2 * Math.cbrt(Math.random());
          const theta = Math.random() * 2 * Math.PI;
          const phi = Math.acos(2 * Math.random() - 1);
          x = r * Math.sin(phi) * Math.cos(theta);
          y = r * Math.sin(phi) * Math.sin(theta) * 0.9;
          z = r * Math.cos(phi);
        } else {
          const ringRadius = 3 + Math.random() * 1.5;
          const ringTheta = Math.random() * 2 * Math.PI;
          const ringHeight = (Math.random() - 0.5) * 0.15;
          x = ringRadius * Math.cos(ringTheta);
          y = ringHeight;
          z = ringRadius * Math.sin(ringTheta);
        }
        break;
      }
      
      case ParticleShape.BUDDHA: {
        const section = Math.random();
        if (section < 0.25) {
          const r = 1 * Math.cbrt(Math.random());
          const theta = Math.random() * 2 * Math.PI;
          const phi = Math.acos(2 * Math.random() - 1);
          x = r * Math.sin(phi) * Math.cos(theta) * 0.8;
          y = r * Math.sin(phi) * Math.sin(theta) * 1 + 3;
          z = r * Math.cos(phi) * 0.8;
        } else if (section < 0.5) {
          const r = 1.5 * Math.cbrt(Math.random());
          const theta = Math.random() * 2 * Math.PI;
          const phi = Math.acos(2 * Math.random() - 1);
          x = r * Math.sin(phi) * Math.cos(theta);
          y = r * Math.sin(phi) * Math.sin(theta) * 1.5 + 0.5;
          z = r * Math.cos(phi) * 0.8;
        } else if (section < 0.7) {
          const r = 2 * Math.cbrt(Math.random());
          const theta = Math.random() * 2 * Math.PI;
          x = r * Math.cos(theta);
          y = -1.5 + Math.random() * 0.5;
          z = r * Math.sin(theta) * 0.4;
        } else {
          const ringRadius = 1.5 + Math.random() * 0.3;
          const ringTheta = Math.random() * 2 * Math.PI;
          x = ringRadius * Math.cos(ringTheta);
          y = 3 + ringRadius * Math.sin(ringTheta) * 0.3;
          z = (Math.random() - 0.5) * 0.2;
        }
        break;
      }
      
      case ParticleShape.FIREWORKS: {
        const burstPoint = Math.floor(Math.random() * 5);
        const burstCenters = [
          { x: 0, y: 2, z: 0 },
          { x: -2, y: 1, z: 1 },
          { x: 2, y: 0.5, z: -1 },
          { x: -1, y: -0.5, z: -1.5 },
          { x: 1.5, y: -1, z: 1 },
        ];
        const center = burstCenters[burstPoint];
        const r = Math.random() * 2;
        const theta = Math.random() * 2 * Math.PI;
        const phi = Math.acos(2 * Math.random() - 1);
        x = center.x + r * Math.sin(phi) * Math.cos(theta);
        y = center.y + r * Math.sin(phi) * Math.sin(theta);
        z = center.z + r * Math.cos(phi);
        if (Math.random() < 0.3) {
          y -= Math.random() * 1.5;
        }
        break;
      }
      
      case ParticleShape.GALAXY: {
        const branches = 4;
        const radius = Math.random() * 5;
        const spinAngle = radius * 2;
        const branchAngle = ((i % branches) / branches) * Math.PI * 2;
        const randomX = Math.pow(Math.random(), 3) * (Math.random() < 0.5 ? 1 : -1) * 0.5;
        const randomY = Math.pow(Math.random(), 3) * (Math.random() < 0.5 ? 1 : -1) * 0.3;
        const randomZ = Math.pow(Math.random(), 3) * (Math.random() < 0.5 ? 1 : -1) * 0.5;
        x = Math.cos(branchAngle + spinAngle) * radius + randomX;
        y = randomY;
        z = Math.sin(branchAngle + spinAngle) * radius + randomZ;
        if (Math.random() < 0.15) {
          const bulgeR = Math.random() * 1;
          const bulgeTheta = Math.random() * 2 * Math.PI;
          const bulgePhi = Math.acos(2 * Math.random() - 1);
          x = bulgeR * Math.sin(bulgePhi) * Math.cos(bulgeTheta);
          y = bulgeR * Math.sin(bulgePhi) * Math.sin(bulgeTheta) * 0.3;
          z = bulgeR * Math.cos(bulgePhi);
        }
        break;
      }
      
      case ParticleShape.DNA: {
        const t = (i / count) * Math.PI * 8;
        const helixRadius = 1.5;
        if (i % 2 === 0) {
          x = helixRadius * Math.cos(t);
          z = helixRadius * Math.sin(t);
        } else {
          x = helixRadius * Math.cos(t + Math.PI);
          z = helixRadius * Math.sin(t + Math.PI);
        }
        y = (i / count - 0.5) * 10;
        if (Math.random() < 0.1) {
          const barT = Math.random() * Math.PI;
          x = helixRadius * Math.cos(t) * (1 - barT / Math.PI) + helixRadius * Math.cos(t + Math.PI) * (barT / Math.PI);
          z = helixRadius * Math.sin(t) * (1 - barT / Math.PI) + helixRadius * Math.sin(t + Math.PI) * (barT / Math.PI);
        }
        x += (Math.random() - 0.5) * 0.2;
        y += (Math.random() - 0.5) * 0.2;
        z += (Math.random() - 0.5) * 0.2;
        break;
      }
    }

    positions[i3] = x;
    positions[i3 + 1] = y;
    positions[i3 + 2] = z;
  }
  return positions;
};

export const ParticleSystem: React.FC<ParticleSystemProps> = ({ 
  shape, 
  color, 
  tension, 
  count = 12000,  // Reduced for better performance
  customText = '大雷早上好'
}) => {
  // Same particle count for all modes for stability
  const actualCount = count;
  
  const pointsRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.PointsMaterial>(null);
  const groupRef = useRef<THREE.Group>(null);
  
  // Track previous tension for velocity-based effects
  const tensionVelocity = useRef(0);
  const prevTensionRef = useRef(tension);
  const burstEnergy = useRef(0);
  const shockwaveRadius = useRef(0);
  const explosionPhase = useRef(0);
  const cumulativeExplosion = useRef(0);
  
  // Buffers
  const currentPositions = useMemo(() => new Float32Array(actualCount * 3), [actualCount]);
  const velocities = useMemo(() => new Float32Array(actualCount * 3), [actualCount]);
  const explosionVelocities = useMemo(() => new Float32Array(actualCount * 3), [actualCount]); // Explosion direction
  const targetPositions = useMemo(() => GenerateParticles(actualCount, shape, customText), [shape, actualCount, customText]);
  
  // Initialize current positions to target on first load if all zero
  useEffect(() => {
    if (currentPositions[0] === 0 && currentPositions[1] === 0) {
      currentPositions.set(targetPositions);
    }
  }, [targetPositions, currentPositions]);

  // Animation Loop
  useFrame((state, delta) => {
    if (!pointsRef.current) return;

    const positions = pointsRef.current.geometry.attributes.position.array as Float32Array;
    const time = state.clock.elapsedTime;
    
    // Check if we're in TEXT mode - simplified animation for performance
    const isTextMode = shape === ParticleShape.TEXT;
    
    // TEXT MODE: Simple, fast animation
    if (isTextMode) {
      // Just gentle floating effect, no complex calculations
      for (let i = 0; i < actualCount; i++) {
        const i3 = i * 3;
        
        const tx = targetPositions[i3];
        const ty = targetPositions[i3 + 1];
        const tz = targetPositions[i3 + 2];
        
        // Simple gentle wave
        const wave = Math.sin(time * 1.5 + i * 0.001) * 0.02;
        
        // Fast interpolation to target
        positions[i3] += (tx - positions[i3]) * 0.15;
        positions[i3 + 1] += (ty + wave - positions[i3 + 1]) * 0.15;
        positions[i3 + 2] += (tz - positions[i3 + 2]) * 0.15;
      }
      
      pointsRef.current.geometry.attributes.position.needsUpdate = true;
      
      // Very slow rotation
      pointsRef.current.rotation.y += delta * 0.03;
      pointsRef.current.rotation.x = 0;
      pointsRef.current.rotation.z = 0;
      
      // Bright, clear particles
      if (materialRef.current) {
        materialRef.current.opacity = 1.0;
        materialRef.current.size = 0.07;
      }
      return;
    }
    
    // NORMAL MODE: Full effects
    // Calculate tension velocity (how fast the hand is opening/closing)
    const tensionDelta = tension - prevTensionRef.current;
    tensionVelocity.current = tensionVelocity.current * 0.85 + tensionDelta * 15;
    prevTensionRef.current = tension;
    
    // ========================================
    // EXPLOSIVE BURST DETECTION
    // ========================================
    // Detect rapid opening (tension dropping quickly)
    const isOpening = tensionDelta < -0.015;
    const openingSpeed = Math.abs(Math.min(tensionDelta, 0));
    
    // Accumulate burst energy when opening rapidly
    if (isOpening) {
      burstEnergy.current = Math.min(burstEnergy.current + openingSpeed * 25, 5);
      explosionPhase.current = Math.min(explosionPhase.current + openingSpeed * 30, 1);
      cumulativeExplosion.current = Math.min(cumulativeExplosion.current + openingSpeed * 10, 2);
    }
    
    // Shockwave expands outward
    if (burstEnergy.current > 0.5) {
      shockwaveRadius.current += delta * 15 * burstEnergy.current;
    }
    
    // Decay effects
    burstEnergy.current *= 0.92;
    explosionPhase.current *= 0.95;
    cumulativeExplosion.current *= 0.98;
    shockwaveRadius.current *= 0.96;
    
    // Dynamic morph speed - FASTER RESPONSE
    const baseMorphSpeed = 8.0; // Increased from 5.0
    const morphSpeed = (baseMorphSpeed + Math.abs(tensionVelocity.current) * 6) * delta; // Increased multiplier
    
    for (let i = 0; i < actualCount; i++) {
      const i3 = i * 3;
      
      let tx = targetPositions[i3];
      let ty = targetPositions[i3 + 1];
      let tz = targetPositions[i3 + 2];

      // Calculate distance from center
      const dist = Math.sqrt(tx * tx + ty * ty + tz * tz);
      const normalizedDist = dist / 5;
      
      // Direction from center (for explosion)
      const dirX = dist > 0.01 ? tx / dist : Math.random() - 0.5;
      const dirY = dist > 0.01 ? ty / dist : Math.random() - 0.5;
      const dirZ = dist > 0.01 ? tz / dist : Math.random() - 0.5;
      
      // ===========================================
      // ULTRA DRAMATIC EFFECTS
      // ===========================================
      
      // 1. MASSIVE SCALE - More extreme difference
      const openScale = 3.5;   // HUGE when fully open
      const closedScale = 0.15; // Tiny when closed
      const scaleEase = 1 - Math.pow(tension, 0.7);
      const scaleFactor = closedScale + (openScale - closedScale) * scaleEase;
      
      // 2. EXPLOSION BURST - Particles fly outward
      const explosionStrength = burstEnergy.current * (0.8 + normalizedDist * 0.5);
      const particlePhase = (i / actualCount) * Math.PI * 2;
      const explosionWave = Math.sin(particlePhase + time * 10) * 0.3 + 1;
      
      // Store explosion velocity for this particle
      if (burstEnergy.current > 1) {
        explosionVelocities[i3] += dirX * explosionStrength * 0.3;
        explosionVelocities[i3 + 1] += dirY * explosionStrength * 0.3;
        explosionVelocities[i3 + 2] += dirZ * explosionStrength * 0.3;
      }
      // Decay explosion velocities
      explosionVelocities[i3] *= 0.95;
      explosionVelocities[i3 + 1] *= 0.95;
      explosionVelocities[i3 + 2] *= 0.95;
      
      // 3. SHOCKWAVE - Ring of energy expanding outward
      const shockwaveDist = Math.abs(dist - shockwaveRadius.current);
      const shockwaveEffect = shockwaveDist < 1.5 ? (1.5 - shockwaveDist) / 1.5 * burstEnergy.current * 0.8 : 0;
      
      // 4. BREATHING - Organic pulsing when relaxed
      const breatheFreq = 1.5 + tension * 3;
      const breatheAmp = (1 - tension) * 0.5;
      const breathePhase = Math.sin(time * breatheFreq + dist * 0.8 + i * 0.0005);
      const breathe = 1 + breathePhase * breatheAmp;
      
      // 5. CHAOS MODE when fist is closed
      const chaosIntensity = Math.pow(tension, 2) * 1.2;
      const chaosFreq = 15 + tension * 25;
      const chaosX = Math.sin(time * chaosFreq + i * 0.37) * chaosIntensity;
      const chaosY = Math.cos(time * chaosFreq * 1.17 + i * 0.53) * chaosIntensity;
      const chaosZ = Math.sin(time * chaosFreq * 0.83 + i * 0.71) * chaosIntensity;
      
      // 6. VORTEX SPIRAL during transitions
      const vortexStrength = Math.abs(tensionVelocity.current) * 1.5;
      const vortexAngle = time * 5 + normalizedDist * 3 + i * 0.003;
      const vortexX = Math.cos(vortexAngle) * vortexStrength * normalizedDist;
      const vortexZ = Math.sin(vortexAngle) * vortexStrength * normalizedDist;
      const vortexY = Math.sin(time * 3 + dist) * vortexStrength * 0.5;
      
      // 7. RIPPLE WAVES - Concentric rings
      const rippleSpeed = 6;
      const rippleCount = 3;
      let rippleEffect = 0;
      for (let r = 0; r < rippleCount; r++) {
        const ripplePhase = (time * rippleSpeed + r * 2) % 10;
        const rippleDist = Math.abs(dist - ripplePhase);
        if (rippleDist < 0.8) {
          rippleEffect += (0.8 - rippleDist) / 0.8 * 0.15 * (1 - tension);
        }
      }
      
      // 8. FIREWORK SCATTER on open
      const scatterAngle = i * 2.39996; // Golden angle
      const scatterRadius = explosionPhase.current * (1 + Math.sin(i * 0.1) * 0.5);
      const scatterX = Math.cos(scatterAngle) * Math.sin(i * 0.5) * scatterRadius;
      const scatterY = Math.sin(scatterAngle) * Math.cos(i * 0.3) * scatterRadius;
      const scatterZ = Math.cos(i * 0.7) * scatterRadius;
      
      // 9. COMPRESSION PULSE when closing
      const compressionPulse = tension > 0.8 ? Math.sin(time * 20) * 0.1 * tension : 0;
      
      // Combine all effects
      tx = tx * scaleFactor * breathe * (1 + compressionPulse);
      ty = ty * scaleFactor * breathe * (1 + compressionPulse);
      tz = tz * scaleFactor * breathe * (1 + compressionPulse);
      
      // Add directional effects
      tx += dirX * (explosionStrength * explosionWave + shockwaveEffect) + chaosX + vortexX + scatterX;
      ty += dirY * (explosionStrength * explosionWave + shockwaveEffect) + chaosY + vortexY + scatterY + rippleEffect;
      tz += dirZ * (explosionStrength * explosionWave + shockwaveEffect) + chaosZ + vortexZ + scatterZ;
      
      // Add persistent explosion velocities
      tx += explosionVelocities[i3];
      ty += explosionVelocities[i3 + 1];
      tz += explosionVelocities[i3 + 2];

      // Smooth interpolation with velocity - SNAPPY RESPONSE
      const currentX = positions[i3];
      const currentY = positions[i3 + 1];
      const currentZ = positions[i3 + 2];
      
      // Add some randomness to morph speed for organic feel
      const particleMorphSpeed = morphSpeed * (0.8 + Math.sin(i * 0.1) * 0.4);
      
      // Lower damping (0.75) for faster reaction, less floaty
      velocities[i3] = velocities[i3] * 0.75 + (tx - currentX) * particleMorphSpeed;
      velocities[i3 + 1] = velocities[i3 + 1] * 0.75 + (ty - currentY) * particleMorphSpeed;
      velocities[i3 + 2] = velocities[i3 + 2] * 0.75 + (tz - currentZ) * particleMorphSpeed;
      
      positions[i3] = currentX + velocities[i3];
      positions[i3 + 1] = currentY + velocities[i3 + 1];
      positions[i3 + 2] = currentZ + velocities[i3 + 2];
    }

    pointsRef.current.geometry.attributes.position.needsUpdate = true;
    
    // Dynamic rotation - explosive spin when opening
    const baseRotation = 0.15;
    const burstRotation = burstEnergy.current * 0.8;
    const velocityRotation = Math.abs(tensionVelocity.current) * 0.6;
    const rotationSpeed = (baseRotation + velocityRotation + burstRotation) * (1 - tension * 0.5);
    pointsRef.current.rotation.y += delta * rotationSpeed;
    
    // Tilt and wobble
    pointsRef.current.rotation.x = Math.sin(time * 0.5) * 0.15 * (1 - tension) + burstEnergy.current * 0.1;
    pointsRef.current.rotation.z = Math.cos(time * 0.3) * 0.05 * burstEnergy.current;
    
    // Update material for GLOW effect
    if (materialRef.current) {
      // Intense glow during burst
      const baseOpacity = 0.75;
      const burstGlow = burstEnergy.current * 0.25;
      const openGlow = (1 - tension) * 0.25;
      materialRef.current.opacity = Math.min(baseOpacity + burstGlow + openGlow, 1);
      
      // Particle size changes dramatically
      const baseSize = 0.035;
      const openSize = (1 - tension) * 0.04;
      const burstSize = burstEnergy.current * 0.03;
      const pulseSize = Math.sin(time * 8) * 0.005 * burstEnergy.current;
      materialRef.current.size = baseSize + openSize + burstSize + pulseSize;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={actualCount}
          array={currentPositions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        ref={materialRef}
        size={0.05}
        color={color}
        sizeAttenuation={true}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        transparent={true}
        opacity={0.9}
      />
    </points>
  );
};
