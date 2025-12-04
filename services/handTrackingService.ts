import { Hands, Results, NormalizedLandmark } from '@mediapipe/hands';
import { Camera } from '@mediapipe/camera_utils';
import { GestureType } from '../types';

export interface HandState {
  tension: number; // 0 (open palm) to 1 (closed fist)
  detected: boolean;
  leftHand: boolean;
  rightHand: boolean;
  gesture: GestureType;
}

export class HandTrackingService {
  private hands: Hands | null = null;
  private camera: Camera | null = null;
  private onUpdate: (state: HandState) => void;
  private isRunning: boolean = false;

  constructor(onUpdate: (state: HandState) => void) {
    this.onUpdate = onUpdate;
  }

  async start(videoElement: HTMLVideoElement) {
    if (this.isRunning) return;

    // Initialize MediaPipe Hands
    this.hands = new Hands({
      locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
      },
    });

    this.hands.setOptions({
      maxNumHands: 2,
      modelComplexity: 1,
      minDetectionConfidence: 0.7,
      minTrackingConfidence: 0.5,
    });

    this.hands.onResults((results) => this.processResults(results));

    // Initialize Camera
    this.camera = new Camera(videoElement, {
      onFrame: async () => {
        if (this.hands && this.isRunning) {
          await this.hands.send({ image: videoElement });
        }
      },
      width: 640,
      height: 480,
    });

    await this.camera.start();
    this.isRunning = true;
    console.log('Hand tracking started');
  }

  stop() {
    this.isRunning = false;
    if (this.camera) {
      this.camera.stop();
      this.camera = null;
    }
    if (this.hands) {
      this.hands.close();
      this.hands = null;
    }
    console.log('Hand tracking stopped');
  }

  private processResults(results: Results) {
    const { multiHandLandmarks, multiHandedness } = results;

    if (!multiHandLandmarks || multiHandLandmarks.length === 0) {
      this.onUpdate({
        tension: 0,
        detected: false,
        leftHand: false,
        rightHand: false,
        gesture: 'none',
      });
      return;
    }

    let totalTension = 0;
    let leftHand = false;
    let rightHand = false;
    let detectedGesture: GestureType = 'none';

    for (let i = 0; i < multiHandLandmarks.length; i++) {
      const landmarks = multiHandLandmarks[i];
      const handedness = multiHandedness?.[i]?.label;

      if (handedness === 'Left') {
        rightHand = true; // Mirror image, so Left is actually Right
      } else {
        leftHand = true;
      }

      const tension = this.calculateTension(landmarks);
      totalTension += tension;
      
      // Check for victory gesture (✌️)
      const gesture = this.detectGesture(landmarks);
      if (gesture === 'victory') {
        detectedGesture = 'victory';
      }
    }

    // Average tension across all detected hands
    const avgTension = totalTension / multiHandLandmarks.length;
    
    // Determine overall gesture
    if (detectedGesture !== 'victory') {
      if (avgTension > 0.7) {
        detectedGesture = 'fist';
      } else if (avgTension < 0.3) {
        detectedGesture = 'open';
      }
    }

    this.onUpdate({
      tension: avgTension,
      detected: true,
      leftHand,
      rightHand,
      gesture: detectedGesture,
    });
  }

  private detectGesture(landmarks: NormalizedLandmark[]): GestureType {
    // Victory gesture (✌️): Index and Middle fingers extended, others curled
    // Finger tip indices: Thumb=4, Index=8, Middle=12, Ring=16, Pinky=20
    // Finger PIP indices: Thumb=3, Index=6, Middle=10, Ring=14, Pinky=18
    
    const wrist = landmarks[0];
    const palmBase = landmarks[9]; // Middle finger MCP
    const palmSize = this.distance(wrist, palmBase);
    
    // Check if index finger is extended (tip far from palm)
    const indexTip = landmarks[8];
    const indexPIP = landmarks[6];
    const indexExtended = this.distance(indexTip, wrist) > this.distance(indexPIP, wrist) * 1.2;
    
    // Check if middle finger is extended
    const middleTip = landmarks[12];
    const middlePIP = landmarks[10];
    const middleExtended = this.distance(middleTip, wrist) > this.distance(middlePIP, wrist) * 1.2;
    
    // Check if ring finger is curled (tip close to palm)
    const ringTip = landmarks[16];
    const ringCurled = this.distance(ringTip, palmBase) < palmSize * 1.2;
    
    // Check if pinky is curled
    const pinkyTip = landmarks[20];
    const pinkyCurled = this.distance(pinkyTip, palmBase) < palmSize * 1.2;
    
    // Check if thumb is not blocking (either curled or to the side)
    const thumbTip = landmarks[4];
    const thumbOK = this.distance(thumbTip, indexTip) > palmSize * 0.5;
    
    // Victory: Index + Middle extended, Ring + Pinky curled
    if (indexExtended && middleExtended && ringCurled && pinkyCurled && thumbOK) {
      return 'victory';
    }
    
    return 'none';
  }

  private calculateTension(landmarks: NormalizedLandmark[]): number {
    // Hand landmark indices:
    // 0: Wrist
    // 1-4: Thumb (1=CMC, 2=MCP, 3=IP, 4=TIP)
    // 5-8: Index finger (5=MCP, 6=PIP, 7=DIP, 8=TIP)
    // 9-12: Middle finger
    // 13-16: Ring finger
    // 17-20: Pinky

    const wrist = landmarks[0];
    const palmBase = landmarks[9]; // Middle finger MCP as palm reference

    // Calculate palm size for normalization
    const palmSize = this.distance(wrist, palmBase);

    // Calculate how curled each finger is
    const fingerTips = [4, 8, 12, 16, 20]; // Tip indices
    const fingerBases = [2, 5, 9, 13, 17]; // Base indices (MCP or CMC for thumb)

    let totalCurl = 0;

    for (let i = 0; i < fingerTips.length; i++) {
      const tip = landmarks[fingerTips[i]];
      const base = landmarks[fingerBases[i]];

      // Distance from fingertip to palm center
      const tipToPalm = this.distance(tip, palmBase);
      
      // Distance from finger base to palm center
      const baseToPalm = this.distance(base, palmBase);

      // When finger is extended, tip is far from palm
      // When finger is curled, tip is close to palm
      // Normalize by palm size
      const extension = tipToPalm / palmSize;

      // Map extension to curl (inverted)
      // Extended finger: extension ~1.5-2.0 -> curl = 0
      // Curled finger: extension ~0.3-0.5 -> curl = 1
      const curl = Math.max(0, Math.min(1, (1.5 - extension) / 1.0));
      totalCurl += curl;
    }

    // Average curl across all 5 fingers
    const avgCurl = totalCurl / 5;

    // Smooth the value
    return Math.max(0, Math.min(1, avgCurl));
  }

  private distance(a: NormalizedLandmark, b: NormalizedLandmark): number {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    const dz = (a.z || 0) - (b.z || 0);
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }
}
