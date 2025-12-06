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
  const [previousColor, setPreviousColor] = useState<string>('#4ade80');
  const [isPanelOpen, setIsPanelOpen] = useState(false); // Control panel visibility
  const [customText, setCustomText] = useState('大雷早上好');
  const [inputText, setInputText] = useState('大雷早上好');
  
  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const handTrackingRef = useRef<HandTrackingService | null>(null);
  const gestureTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Smooth tension for better visual effect - INSTANT response!
  useEffect(() => {
    const targetTension = handData.detected ? handData.tension : smoothTension;
    const smoothingFactor = 0.8; // Almost instant response
    
    const interval = setInterval(() => {
      setSmoothTension(prev => {
        const diff = targetTension - prev;
        if (Math.abs(diff) < 0.003) return targetTension;
        return prev + diff * smoothingFactor;
      });
    }, 10); // Ultra fast update rate
    
    return () => clearInterval(interval);
  }, [handData.tension, handData.detected]);

  // Handle gestures - switch shapes dynamically
  useEffect(() => {
    const gesture = handData.gesture;
    const specialGestures = ['victory', 'love', 'thumbs_up', 'point'];
    
    // If gesture changed
    if (gesture !== currentGesture) {
      if (gestureTimerRef.current) {
        clearTimeout(gestureTimerRef.current);
      }

      // If it's a "special" gesture
      if (specialGestures.includes(gesture || '')) {
        gestureTimerRef.current = setTimeout(() => {
          // Save previous state if we are entering a special gesture from a non-special one
          if (!specialGestures.includes(currentGesture)) {
             setPreviousShape(activeShape);
             setPreviousColor(particleColor);
          }

          setCurrentGesture(gesture as GestureType);

          // Apply effects based on gesture
          switch (gesture) {
            case 'victory':
              setActiveShape(ParticleShape.TEXT);
              setParticleColor('#ffd700'); // Gold
              break;
            case 'love':
              setActiveShape(ParticleShape.HEART);
              setParticleColor('#ec4899'); // Pink
              break;
            case 'thumbs_up':
              setActiveShape(ParticleShape.FIREWORKS);
              setParticleColor('#ef4444'); // Red
              break;
            case 'point':
              setActiveShape(ParticleShape.SATURN);
              setParticleColor('#06b6d4'); // Cyan
              break;
          }
        }, 300); // 300ms debounce
      } else if (specialGestures.includes(currentGesture)) {
        // If we were in a special gesture and now we are not (none/open/fist)
        // Wait a bit longer before reverting, to avoid flickering
        gestureTimerRef.current = setTimeout(() => {
          setCurrentGesture('none');
          // Revert to previous shape and color
          setActiveShape(previousShape);
          setParticleColor(previousColor);
        }, 1000);
      } else {
        // Just normal state change (open <-> fist), update immediately or ignore
        setCurrentGesture(gesture as GestureType);
      }
    }
    
    return () => {
      if (gestureTimerRef.current) {
        clearTimeout(gestureTimerRef.current);
      }
    };
  }, [handData.gesture, currentGesture, activeShape, particleColor, previousShape, previousColor]);

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
            customText={customText}
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
      <div className="absolute inset-0 z-10 pointer-events-none flex flex-col justify-between p-6">
        
        {/* Header - Sci-Fi HUD Style */}
        <div className="flex justify-between items-start pointer-events-auto w-full">
          
          {/* Left: Branding & Socials */}
          <div className="bg-gray-900/80 backdrop-blur-md border border-white/10 rounded-br-2xl p-4 pt-2 pl-2 shadow-[0_0_30px_rgba(0,0,0,0.5)] relative overflow-hidden group">
            {/* Decorative Corner */}
            <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-cyan-500"></div>
            
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <div className="w-1 h-4 bg-cyan-500"></div>
                <div>
                  <p className="text-[8px] font-mono text-cyan-500/80 tracking-[0.3em] uppercase mb-0.5">
                    SYSTEM: DAILYCOSMOS.NET
                  </p>
                  <h1 className="text-2xl font-bold tracking-tighter text-white flex items-center gap-2">
                    KINETIC<span className="font-light text-cyan-100">PARTICLES</span>
                    <span className="text-[8px] px-1 py-0.5 rounded bg-cyan-900/50 text-cyan-400 border border-cyan-500/30">BETA</span>
                  </h1>
                </div>
              </div>
              
              {/* Social Links - Tech Style */}
              <div className="flex items-center gap-2 mt-2 ml-3">
                <div className="h-px w-4 bg-white/10"></div>
                <div className="flex gap-3 opacity-60 hover:opacity-100 transition-opacity">
                  <a href="https://github.com/paul010/gemini-kinetic-particles" target="_blank" rel="noopener noreferrer" className="text-white hover:text-cyan-400 transition-colors" aria-label="GitHub">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                  </a>
                  <a href="https://www.youtube.com/@dalei2025" target="_blank" rel="noopener noreferrer" className="text-white hover:text-red-500 transition-colors" aria-label="YouTube">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                  </a>
                  <a href="https://aiagentclub.notion.site?v=1e51f5ff8f8c810b8fb9000cdac404a8&pvs=74" target="_blank" rel="noopener noreferrer" className="text-white hover:text-white/80 transition-colors" aria-label="Notion">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M4.459 4.208c.746.606 1.026.56 2.428.466l13.215-.793c.28 0 .047-.28.047-.606 0-.606-.607-.653-1.167-.606-.933.047-3.733.28-4.853.373L4.692 4.021c-.56-.046-1.12-.093-1.68.514v13.62c0 .84.654 1.166 1.447 1.166h9.893c.84 0 1.4-.326 1.4-1.12V6.587c0-1.12.607-1.12 1.12-1.12.467 0 1.12.187 1.12 1.12v11.94c0 1.493-1.12 2.426-2.613 2.426h-10.5c-1.494 0-2.427-.933-2.427-2.426V4.208zm3.734 3.78c0 .373-.234.56-.56.56-.327 0-.56-.187-.56-.56V6.587c0-.373.233-.56.56-.56.326 0 .56.187.56.56v1.4zm0 7.466c0 .373-.234.56-.56.56-.327 0-.56-.186-.56-.56v-5.6c0-.373.233-.56.56-.56.326 0 .56.187.56.56v5.6zm3.733-3.733c0 .373-.233.56-.56.56-.326 0-.56-.187-.56-.56v-3.733c0-.373.234-.56.56-.56.327 0 .56.187.56.56v3.733z"/></svg>
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Status Module */}
          <div className="flex flex-col items-end gap-3">
            {!isTracking ? (
              <button 
                onClick={handleStartTracking}
                className="px-6 py-2.5 bg-white text-black font-medium rounded-full hover:bg-gray-200 transition-all shadow-lg shadow-white/10 flex items-center gap-2"
              >
                <span>Start Experience</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </button>
            ) : (
              <button 
                onClick={handleStopTracking}
                className="px-6 py-2.5 bg-red-500/10 border border-red-500/20 text-red-400 font-medium rounded-full hover:bg-red-500/20 transition-all"
              >
                Stop Camera
              </button>
            )}
            
            {/* Status Indicators (Moved to Right) */}
            <div className="flex items-center gap-4">
              <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium transition-colors duration-300
                ${handData.detected ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-white/5 text-gray-500 border border-white/10'}`}>
                <span className={`w-2 h-2 rounded-full ${handData.detected ? 'bg-green-400 animate-pulse' : 'bg-gray-500'}`}></span>
                {handData.detected ? 'Camera Active' : 'Camera Standby'}
              </div>
              
              {/* Hand Indicators */}
              <div className="flex gap-1">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold border transition-all duration-300
                  ${handData.leftHand ? 'bg-white/20 border-white/40 text-white' : 'bg-black/20 border-white/5 text-gray-600'}`}>
                  L
                </div>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold border transition-all duration-300
                  ${handData.rightHand ? 'bg-white/20 border-white/40 text-white' : 'bg-black/20 border-white/5 text-gray-600'}`}>
                  R
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Controls - Sci-Fi HUD Style */}
        <div className="pointer-events-auto fixed bottom-8 left-1/2 -translate-x-1/2 w-full max-w-xl flex flex-col items-center gap-2 z-50">
          
          {/* Main Control Unit */}
          <div className="w-full bg-gray-900/90 backdrop-blur-2xl border border-white/10 rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] ring-1 ring-white/5">
            
            {/* Header: Input Terminal */}
            <div className="relative bg-black/40 border-b border-white/5 p-3 flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse shadow-[0_0_10px_rgba(6,182,212,0.5)]"></div>
              <span className="text-[10px] font-mono text-cyan-500/50 tracking-widest">CMD:</span>
              <input 
                type="text" 
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setCustomText(inputText);
                    setActiveShape(ParticleShape.TEXT);
                  }
                }}
                className="flex-1 bg-transparent border-none focus:ring-0 text-cyan-100 text-sm font-mono placeholder-cyan-900/50 focus:outline-none uppercase"
                placeholder="ENTER_TEXT_DATA..."
              />
              <button 
                onClick={() => {
                  setCustomText(inputText);
                  setActiveShape(ParticleShape.TEXT);
                }}
                className="px-3 py-1 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 text-[10px] font-bold tracking-wider rounded border border-cyan-500/20 hover:border-cyan-500/50 transition-all"
              >
                EXECUTE
              </button>
            </div>

            {/* Body: Core Controls */}
            <div className="p-4 flex flex-col gap-4">
              
              {/* Mode Selectors (Shapes) */}
              <div className="grid grid-cols-4 gap-2">
                {[ParticleShape.HEART, ParticleShape.FLOWER, ParticleShape.SATURN, ParticleShape.FIREWORKS].map((shape, idx) => (
                  <button
                    key={shape}
                    onClick={() => setActiveShape(shape)}
                    className={`
                      relative h-14 rounded-lg flex flex-col items-center justify-center gap-1 transition-all duration-200 group overflow-hidden
                      ${activeShape === shape 
                        ? 'bg-white/10 border border-white/20 shadow-[inset_0_0_20px_rgba(255,255,255,0.1)]' 
                        : 'bg-black/20 border border-white/5 hover:bg-white/5 hover:border-white/10'}
                    `}
                  >
                    {/* Active Indicator Line */}
                    {activeShape === shape && (
                      <div className="absolute top-0 left-0 right-0 h-0.5 bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,1)]"></div>
                    )}
                    
                    <span className={`text-xl transition-transform duration-200 ${activeShape === shape ? 'scale-110 text-white' : 'text-white/40 group-hover:text-white/80'}`}>
                      {shapeIcons[shape]}
                    </span>
                    <span className="text-[8px] font-mono uppercase tracking-widest text-white/30 group-hover:text-white/50">
                      MOD_{idx + 1}
                    </span>
                  </button>
                ))}
              </div>

              {/* Secondary Controls Row */}
              <div className="flex items-center justify-between gap-4">
                
                {/* Color Strip */}
                <div className="flex-1 h-8 bg-black/40 rounded-lg border border-white/5 flex items-center px-2 gap-1">
                  {colorPresets.slice(0, 5).map(({ color }) => (
                    <button
                      key={color}
                      onClick={() => setParticleColor(color)}
                      className={`flex-1 h-4 rounded-sm transition-all duration-200 ${particleColor === color ? 'ring-1 ring-white scale-110 z-10' : 'opacity-40 hover:opacity-80'}`}
                      style={{ backgroundColor: color }}
                      aria-label={`Select color ${color}`}
                    />
                  ))}
                  <div className="w-px h-4 bg-white/10 mx-1"></div>
                  <div className="relative w-6 h-4 rounded-sm bg-gradient-to-r from-blue-500 to-purple-500 opacity-60 hover:opacity-100 cursor-pointer">
                     <input 
                      type="color" 
                      value={particleColor} 
                      onChange={(e) => setParticleColor(e.target.value)}
                      className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                      aria-label="Custom color picker"
                    />
                  </div>
                </div>

                {/* Expand Button */}
                <button
                  onClick={() => setIsPanelOpen(!isPanelOpen)}
                  className={`h-8 px-3 rounded-lg border flex items-center gap-2 transition-all ${isPanelOpen ? 'bg-white/10 border-white/20 text-white' : 'bg-black/40 border-white/5 text-white/40 hover:text-white hover:border-white/10'}`}
                >
                  <span className="text-[9px] font-mono uppercase tracking-wider">EXTRAS</span>
                  <span className={`text-[10px] transition-transform duration-300 ${isPanelOpen ? 'rotate-180' : ''}`}>▼</span>
                </button>
              </div>

              {/* Expandable Area */}
               <div className={`transition-all duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] overflow-hidden ${isPanelOpen ? 'max-h-20 opacity-100 mt-2' : 'max-h-0 opacity-0'}`}>
                  <div className="grid grid-cols-4 gap-2 pt-2 border-t border-white/5">
                    {[ParticleShape.SPHERE, ParticleShape.GALAXY, ParticleShape.DNA, ParticleShape.BUDDHA].map((shape, idx) => (
                      <button
                        key={shape}
                        onClick={() => setActiveShape(shape)}
                        className={`
                          h-8 rounded flex items-center justify-center gap-2 border transition-all
                          ${activeShape === shape 
                            ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400' 
                            : 'bg-white/5 border-transparent text-white/30 hover:text-white hover:bg-white/10'}
                        `}
                      >
                        <span className="text-xs">{shapeIcons[shape]}</span>
                        <span className="text-[8px] font-mono uppercase">{shape}</span>
                      </button>
                    ))}
                  </div>
               </div>

            </div>
          </div>
          
          {/* System Status Footer */}
          <div className="flex items-center gap-2 text-[9px] font-mono text-white/20 uppercase tracking-widest">
            <div className={`w-1.5 h-1.5 rounded-full ${isTracking ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
            {isTracking ? 'SYSTEM_ONLINE' : 'SYSTEM_STANDBY'}
            <span className="mx-1">|</span>
            <span className={currentGesture !== 'none' && currentGesture !== 'open' && currentGesture !== 'fist' ? 'text-cyan-400 animate-pulse font-bold' : ''}>
              GESTURE: {currentGesture.toUpperCase()}
            </span>
            <span className="mx-1">|</span>
            <span>V.1.0.5</span>
          </div>

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
