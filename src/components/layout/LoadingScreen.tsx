import React, { useState, useEffect } from 'react';

const StatusMessenger = () => {
  const [index, setIndex] = useState(0);
  const messages = [
    "Analyzing Property Records",
    "Checking Land Registry",
    "Detecting Suspicious Activity",
    "Syncing Official Data",
    "Securing Your Dashboard"
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % messages.length);
    }, 2000);
    return () => clearInterval(timer);
  }, []);

  return <span>{messages[index]}</span>;
};

const LoadingScreen: React.FC = () => {
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden bg-[#05070a] font-sans">
      {/* Dynamic Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Animated Gradient Orbs */}
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-primary-600/10 blur-[150px] animate-[pulse_8s_ease-in-out_infinite]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-primary-500/10 blur-[150px] animate-[pulse_10s_ease-in-out_infinite_reverse]" />
        
        {/* Animated Grid */}
        <div 
          className="absolute inset-0 opacity-[0.05] animate-[grid-move_20s_linear_infinite]" 
          style={{ 
            backgroundImage: `linear-gradient(rgba(249, 115, 22, 0.18) 1px, transparent 1px), linear-gradient(90deg, rgba(249, 115, 22, 0.18) 1px, transparent 1px)`,
            backgroundSize: '50px 50px'
          }} 
        />

        {/* Scan Line Effect */}
        <div className="absolute inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-primary-500/50 to-transparent shadow-[0_0_20px_rgba(249,115,22,0.38)] animate-[scan-line_4s_linear_infinite]" />
      </div>

      {/* Glassmorphic Container */}
      <div className="relative z-10 flex flex-col items-center px-12 py-16 rounded-3xl border border-white/5 bg-white/[0.02] backdrop-blur-xl shadow-2xl">
        {/* Animated Eye Logo */}
        <div className="relative w-40 h-40 mb-10">
          {/* Decorative Rings */}
          <div className="absolute inset-0 border-[3px] border-primary-500/20 rounded-full animate-[spin_12s_linear_infinite]" />
          <div className="absolute inset-3 border border-dashed border-primary-400/30 rounded-full animate-[spin_20s_linear_infinite_reverse]" />
          <div className="absolute inset-6 border-[2px] border-primary-600/10 rounded-full animate-[pulse_4s_ease-in-out_infinite]" />
          
          {/* Central Eye SVG */}
          <div className="absolute inset-0 flex items-center justify-center p-8">
            <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_0_20px_rgba(249,115,22,0.45)]">
              <defs>
                <linearGradient id="mainGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#fdba74" />
                  <stop offset="50%" stopColor="#f97316" />
                  <stop offset="100%" stopColor="#c2410c" />
                </linearGradient>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>
              
              {/* Eye Lid Shapes */}
              <path 
                d="M10 50Q50 15 90 50Q50 85 10 50" 
                fill="none" 
                stroke="url(#mainGradient)" 
                strokeWidth="4" 
                strokeLinecap="round"
                className="animate-[eye-lid_6s_ease-in-out_infinite]"
              />
              
              {/* Pupil & Iris */}
              <g className="animate-[pupil-track_8s_ease-in-out_infinite]">
                <circle cx="50" cy="50" r="16" fill="none" stroke="url(#mainGradient)" strokeWidth="1" strokeDasharray="4 2" className="animate-spin-slow" />
                <circle cx="50" cy="50" r="10" fill="url(#mainGradient)" filter="url(#glow)" />
                <circle cx="53" cy="47" r="3" fill="white" fillOpacity="0.4" />
              </g>

              {/* Scanning Ray */}
              <path 
                d="M20 50L80 50" 
                stroke="rgba(255,255,255,0.2)" 
                strokeWidth="0.5" 
                className="animate-[scan-sweep_3s_ease-in-out_infinite]"
              />
            </svg>
          </div>
        </div>

        {/* Text Presentation */}
        <div className="flex flex-col items-center gap-6">
          <div className="relative">
            <h1 className="text-4xl font-extrabold tracking-[0.3em] uppercase text-transparent bg-clip-text bg-gradient-to-r from-white via-primary-200 to-primary-500 bg-[length:200%_auto] animate-[text-shimmer_4s_linear_infinite]">
              Property Eye
            </h1>
            <div className="absolute -bottom-2 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary-500 to-transparent" />
          </div>
          
          <div className="flex flex-col items-center gap-3">
            <div className="flex items-center gap-3">
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <div 
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-primary-500 animate-bounce" 
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
              <span className="text-xs font-semibold tracking-[0.25em] text-primary-400 uppercase h-4 min-w-[200px] text-center">
                <StatusMessenger />
              </span>
            </div>

            {/* Progress Bar Container */}
            <div className="w-64 h-1 bg-white/5 rounded-full overflow-hidden border border-white/5">
              <div className="h-full bg-gradient-to-r from-primary-700 to-primary-400 animate-[progress_3s_ease-in-out_infinite]" />
            </div>
          </div>
        </div>
      </div>

      {/* Custom Styles */}
      <style>{`
        @keyframes progress {
          0% { width: 0%; transform: translateX(-100%); }
          50% { width: 100%; transform: translateX(0%); }
          100% { width: 0%; transform: translateX(100%); }
        }
        @keyframes grid-move {
          0% { background-position: 0 0; }
          100% { background-position: 50px 50px; }
        }
        @keyframes scan-line {
          0% { top: -10%; }
          100% { top: 110%; }
        }
        @keyframes eye-lid {
          0%, 85%, 100% { transform: scaleY(1); }
          92% { transform: scaleY(0.1); }
        }
        @keyframes pupil-track {
          0%, 100% { transform: translate(0, 0); }
          25% { transform: translate(3px, -2px); }
          50% { transform: translate(-3px, 2px); }
          75% { transform: translate(2px, 3px); }
        }
        @keyframes scan-sweep {
          0%, 100% { transform: scaleX(0); opacity: 0; }
          50% { transform: scaleX(1.2); opacity: 0.8; }
        }
        @keyframes text-shimmer {
          to { background-position: 200% center; }
        }
        .animate-spin-slow {
          animation: spin 8s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default LoadingScreen;
