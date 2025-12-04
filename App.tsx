import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { ParticleSystem } from './components/ParticleSystem';
import { ParticleShape, HandData, GestureType } from './types';
import { HandTrackingService } from './services/handTrackingService';

const App: React.FC = () => {
  // State
  const [activeShape, setActiveShape] = useState<ParticleShape>(ParticleShape.SPHERE);
  const [particleColor, setParticleColor] = useState<string>('#4ade80');
  const [isTracking, setIsTracking] = useState(false);
  const [handData, setHandData] = useState<HandData>({ tension: 0, detected: false, gesture: 'none' });
  const [smoothTension, setSmoothTension] = useState(0);
  const [currentGesture, setCurrentGesture] = useState<GestureType>('none');
  const [previousShape, setPreviousShape] = useState<ParticleShape>(ParticleShape.SPHERE);
  const [isPanelOpen, setIsPanelOpen] = useState(false); // Control panel visibility
  
  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const handTrackingRef = useRef<HandTrackingService | null>(null);
  const gestureTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Smooth tension for better visual effect - SUPER FAST response!
  useEffect(() => {
    const targetTension = handData.detected ? handData.tension : smoothTension;
    const smoothingFactor = 0.5; // Much faster response for dramatic effect!
    
    const interval = setInterval(() => {
      setSmoothTension(prev => {
        const diff = targetTension - prev;
        if (Math.abs(diff) < 0.003) return targetTension;
        return prev + diff * smoothingFactor;
      });
    }, 12); // Faster update rate
    
    return () => clearInterval(interval);
  }, [handData.tension, handData.detected]);

  // Handle victory gesture - switch to text shape
  useEffect(() => {
    if (handData.gesture === 'victory' && currentGesture !== 'victory') {
      // Victory gesture detected! Switch to text
      if (gestureTimerRef.current) {
        clearTimeout(gestureTimerRef.current);
      }
      
      // Wait a moment to confirm the gesture
      gestureTimerRef.current = setTimeout(() => {
        if (activeShape !== ParticleShape.TEXT) {
          setPreviousShape(activeShape);
        }
        setActiveShape(ParticleShape.TEXT);
        setParticleColor('#ffd700'); // Golden color for the greeting!
        setCurrentGesture('victory');
      }, 300);
    } else if (handData.gesture !== 'victory' && currentGesture === 'victory') {
      // Victory gesture ended, wait a moment then restore
      if (gestureTimerRef.current) {
        clearTimeout(gestureTimerRef.current);
      }
      
      gestureTimerRef.current = setTimeout(() => {
        setActiveShape(previousShape);
        setCurrentGesture('none');
      }, 1000); // Keep text visible for 1 second after gesture ends
    }
    
    return () => {
      if (gestureTimerRef.current) {
        clearTimeout(gestureTimerRef.current);
      }
    };
  }, [handData.gesture, currentGesture, activeShape, previousShape]);

  // Handle tracking start/stop
  const handleStartTracking = async () => {
    if (!videoRef.current) return;

    handTrackingRef.current = new HandTrackingService((state) => {
      setHandData({
        tension: state.tension,
        detected: state.detected,
        leftHand: state.leftHand,
        rightHand: state.rightHand,
        gesture: state.gesture,
      });
    });

    try {
      await handTrackingRef.current.start(videoRef.current);
      setIsTracking(true);
    } catch (err) {
      console.error('Failed to start hand tracking:', err);
      alert('Failed to start camera. Please allow camera permissions.');
    }
  };

  const handleStopTracking = () => {
    handTrackingRef.current?.stop();
    setIsTracking(false);
    setHandData({ tension: 0, detected: false, gesture: 'none' });
    setCurrentGesture('none');
  };

  // Cleanup
  useEffect(() => {
    return () => {
      handTrackingRef.current?.stop();
    };
  }, []);

  // Shape icons
  const shapeIcons: Record<ParticleShape, string> = {
    [ParticleShape.SPHERE]: '🔮',
    [ParticleShape.HEART]: '❤️',
    [ParticleShape.FLOWER]: '🌸',
    [ParticleShape.SATURN]: '🪐',
    [ParticleShape.BUDDHA]: '🧘',
    [ParticleShape.FIREWORKS]: '🎆',
    [ParticleShape.GALAXY]: '🌌',
    [ParticleShape.DNA]: '🧬',
    [ParticleShape.TEXT]: '✌️',
  };

  // Color presets
  const colorPresets = [
    { color: '#ef4444', name: 'Red' },
    { color: '#f97316', name: 'Orange' },
    { color: '#eab308', name: 'Yellow' },
    { color: '#4ade80', name: 'Green' },
    { color: '#06b6d4', name: 'Cyan' },
    { color: '#3b82f6', name: 'Blue' },
    { color: '#a855f7', name: 'Purple' },
    { color: '#ec4899', name: 'Pink' },
    { color: '#ffffff', name: 'White' },
  ];

  return (
    <div className="relative w-full h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black overflow-hidden">
      {/* 3D Scene */}
      <div className="absolute inset-0 z-0">
        <Canvas camera={{ position: [0, 0, 12], fov: 60 }}>
          <ambientLight intensity={0.3} />
          <pointLight position={[10, 10, 10]} intensity={0.5} />
          <ParticleSystem 
            shape={activeShape} 
            color={particleColor} 
            tension={smoothTension}
          />
          <OrbitControls 
            enableZoom={true} 
            autoRotate={!handData.detected} 
            autoRotateSpeed={0.3}
            minDistance={5}
            maxDistance={25}
          />
        </Canvas>
      </div>

      {/* Video element for camera (hidden but needed for MediaPipe) */}
      <video 
        ref={videoRef} 
        className="hidden"
        playsInline 
        muted
      />

      {/* UI Overlay */}
      <div className="absolute inset-0 z-10 pointer-events-none flex flex-col justify-between p-4 md:p-6">
        
        {/* Header */}
        <div className="flex justify-between items-start pointer-events-auto">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500">
              Kinetic Particles
            </h1>
            <p className="text-gray-400 text-xs md:text-sm mt-1 max-w-xs">
              {isTracking 
                ? currentGesture === 'victory'
                  ? "✌️ 大雷早上好！"
                  : "Open palms to expand • Fists to contract • ✌️ for surprise" 
                : "Start tracking to control with hand gestures"}
            </p>
          </div>

          <div className="flex flex-col items-end gap-2">
            {!isTracking ? (
              <button 
                onClick={handleStartTracking}
                className="group relative px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-semibold rounded-full 
                         hover:from-cyan-400 hover:to-purple-500 transition-all shadow-lg shadow-purple-500/30
                         flex items-center gap-2"
              >
                <span className="text-lg">👋</span>
                <span>Start Tracking</span>
              </button>
            ) : (
              <div className="flex items-center gap-3">
                <div className={`px-3 py-1.5 rounded-full text-xs font-mono backdrop-blur-md border
                              ${currentGesture === 'victory'
                                ? 'border-yellow-500/50 text-yellow-400 bg-yellow-500/10'
                                : handData.detected 
                                  ? smoothTension > 0.7 
                                    ? 'border-orange-500/50 text-orange-400 bg-orange-500/10' 
                                    : smoothTension < 0.3
                                      ? 'border-cyan-500/50 text-cyan-400 bg-cyan-500/10'
                                      : 'border-green-500/50 text-green-400 bg-green-500/10'
                                  : 'border-gray-500/50 text-gray-400 bg-gray-500/10'}`}>
                  {currentGesture === 'victory'
                    ? '✌️ Victory! 大雷早上好'
                    : handData.detected 
                      ? smoothTension > 0.7 
                        ? `✊ ${(smoothTension * 100).toFixed(0)}% Tension`
                        : smoothTension < 0.3
                          ? `🖐️ ${(smoothTension * 100).toFixed(0)}% Relaxed`
                          : `✋ ${(smoothTension * 100).toFixed(0)}% Tension`
                      : '🔍 Searching...'}
                </div>
                <button 
                  onClick={handleStopTracking}
                  className="px-4 py-1.5 bg-red-500/10 border border-red-500/50 text-red-400 rounded-full 
                           hover:bg-red-500/20 transition-all text-sm font-medium"
                >
                  Stop
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Controls - Collapsible */}
        <div className="pointer-events-auto">
          {/* Toggle Button */}
          <div className="flex justify-center mb-2">
            <button
              onClick={() => setIsPanelOpen(!isPanelOpen)}
              className={`px-4 py-2 rounded-full backdrop-blur-md border transition-all duration-300 flex items-center gap-2
                        ${isPanelOpen 
                          ? 'bg-white/10 border-white/20 text-white' 
                          : 'bg-black/40 border-white/10 text-gray-400 hover:text-white hover:border-white/20'}`}
            >
              <span className="text-sm">{isPanelOpen ? '收起菜单' : '展开菜单'}</span>
              <span className={`transition-transform duration-300 ${isPanelOpen ? 'rotate-180' : ''}`}>
                ▲
              </span>
            </button>
          </div>

          {/* Collapsible Panel */}
          <div className={`transition-all duration-500 ease-in-out overflow-hidden ${isPanelOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
            <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-4 md:p-5 
                          w-full max-w-xl mx-auto shadow-2xl shadow-black/50">
              
              {/* Shape Selector */}
              <div className="mb-4">
                <label className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-3 block">
                  Shape Template
                </label>
                <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
                  {Object.values(ParticleShape).map((shape) => (
                    <button
                      key={shape}
                      onClick={() => setActiveShape(shape)}
                      className={`
                        flex flex-col items-center justify-center py-2 px-1 rounded-xl text-xs font-medium transition-all
                        ${activeShape === shape 
                          ? 'bg-gradient-to-br from-cyan-500/30 to-purple-500/30 border border-white/20 text-white shadow-lg' 
                          : 'bg-white/5 text-gray-400 hover:bg-white/10 border border-transparent'}
                      `}
                      title={shape}
                    >
                      <span className="text-xl mb-1">{shapeIcons[shape]}</span>
                      <span className="text-[10px] opacity-80">{shape}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Color Picker */}
              <div>
                <label className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-3 block">
                  Particle Color
                </label>
                <div className="flex items-center gap-2 flex-wrap">
                  {colorPresets.map(({ color, name }) => (
                    <button
                      key={color}
                      onClick={() => setParticleColor(color)}
                      className={`w-8 h-8 rounded-full transition-all duration-200 hover:scale-110
                                ${particleColor === color 
                                  ? 'ring-2 ring-white ring-offset-2 ring-offset-gray-900 scale-110' 
                                  : 'ring-1 ring-white/20'}`}
                      style={{ backgroundColor: color }}
                      title={name}
                    />
                  ))}
                  <div className="relative ml-1">
                    <input 
                      type="color" 
                      value={particleColor} 
                      onChange={(e) => setParticleColor(e.target.value)}
                      className="w-8 h-8 rounded-full bg-transparent cursor-pointer opacity-0 absolute inset-0"
                      title="Custom color"
                    />
                    <div 
                      className="w-8 h-8 rounded-full bg-gradient-to-br from-red-500 via-green-500 to-blue-500 
                               ring-1 ring-white/20 flex items-center justify-center"
                    >
                      <span className="text-xs">+</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Manual Control (when not tracking) */}
              {!isTracking && (
                <div className="mt-4 pt-4 border-t border-white/10">
                  <label className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-2 flex justify-between">
                    <span>Manual Control</span>
                    <span className="text-cyan-400">{(smoothTension * 100).toFixed(0)}%</span>
                  </label>
                  <input 
                    type="range" 
                    min="0" 
                    max="1" 
                    step="0.01" 
                    value={smoothTension}
                    onChange={(e) => setSmoothTension(parseFloat(e.target.value))}
                    className="w-full h-2 bg-gray-700/50 rounded-full appearance-none cursor-pointer
                             [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 
                             [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-gradient-to-r 
                             [&::-webkit-slider-thumb]:from-cyan-400 [&::-webkit-slider-thumb]:to-purple-500
                             [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:shadow-cyan-500/50"
                    title="Tension control"
                  />
                  <div className="flex justify-between text-[10px] text-gray-500 mt-1">
                    <span>Open Palm</span>
                    <span>Closed Fist</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Instructions hint */}
          <p className="text-center text-gray-600 text-xs mt-3">
            Drag to rotate • Scroll to zoom • {isTracking ? 'Move hands in view' : 'Click Start to begin'}
          </p>
        </div>
      </div>

      {/* Tension indicator bar at the edges - MORE DRAMATIC */}
      {isTracking && handData.detected && (
        <>
          {/* Left edge glow */}
          <div 
            className="absolute left-0 top-0 bottom-0 transition-all duration-100"
            style={{ 
              width: `${4 + (1 - smoothTension) * 12}px`,
              background: `linear-gradient(to right, ${
                smoothTension < 0.3 ? 'rgba(34, 211, 238, 0.8)' : 
                smoothTension > 0.7 ? 'rgba(251, 146, 60, 0.8)' : 
                'rgba(167, 139, 250, 0.8)'
              }, transparent)`,
              boxShadow: smoothTension < 0.3 
                ? '0 0 30px rgba(34, 211, 238, 0.5)' 
                : smoothTension > 0.7 
                  ? '0 0 30px rgba(251, 146, 60, 0.5)' 
                  : '0 0 20px rgba(167, 139, 250, 0.4)'
            }}
          />
          {/* Right edge glow */}
          <div 
            className="absolute right-0 top-0 bottom-0 transition-all duration-100"
            style={{ 
              width: `${4 + (1 - smoothTension) * 12}px`,
              background: `linear-gradient(to left, ${
                smoothTension < 0.3 ? 'rgba(34, 211, 238, 0.8)' : 
                smoothTension > 0.7 ? 'rgba(251, 146, 60, 0.8)' : 
                'rgba(167, 139, 250, 0.8)'
              }, transparent)`,
              boxShadow: smoothTension < 0.3 
                ? '0 0 30px rgba(34, 211, 238, 0.5)' 
                : smoothTension > 0.7 
                  ? '0 0 30px rgba(251, 146, 60, 0.5)' 
                  : '0 0 20px rgba(167, 139, 250, 0.4)'
            }}
          />
          {/* Top/bottom pulse when opening */}
          {smoothTension < 0.3 && (
            <>
              <div 
                className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-b from-cyan-400/50 to-transparent animate-pulse"
              />
              <div 
                className="absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-t from-cyan-400/50 to-transparent animate-pulse"
              />
            </>
          )}
        </>
      )}
    </div>
  );
};

export default App;
