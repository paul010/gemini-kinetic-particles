export enum ParticleShape {
  SPHERE = 'Sphere',
  HEART = 'Heart',
  FLOWER = 'Flower',
  SATURN = 'Saturn',
  BUDDHA = 'Buddha',
  FIREWORKS = 'Fireworks',
  GALAXY = 'Galaxy',
  DNA = 'DNA',
  TEXT = 'Text'
}

export interface ParticleState {
  expansion: number; // 0.0 to 1.0 (controlled by hand tension)
  color: string;
  shape: ParticleShape;
  isConnected: boolean;
  isStreaming: boolean;
}

export type GestureType = 'none' | 'open' | 'fist' | 'victory';

export interface HandData {
  tension: number; // 0 (open) to 1 (closed)
  detected: boolean;
  leftHand?: boolean;
  rightHand?: boolean;
  gesture?: GestureType;
}
