import React, { useState, useEffect } from 'react';
import PropertyEyeMark from './PropertyEyeMark';

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
      <div className="relative z-10 flex flex-col items-center rounded-3xl border border-white/5 bg-white/[0.02] px-12 py-16 shadow-2xl backdrop-blur-xl">
        <div className="relative mb-10 flex size-40 items-center justify-center">
          <div className="absolute inset-0 rounded-full border border-primary-500/20" />
          <div className="absolute inset-3 rounded-full border border-dashed border-primary-400/35 animate-[spin_18s_linear_infinite]" />
          <div className="absolute inset-8 rounded-full border border-primary-600/15" />
          <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle,_rgba(249,115,22,0.14),_transparent_62%)]" />
          <PropertyEyeMark size="xl" className="relative drop-shadow-[0_0_18px_rgba(249,115,22,0.28)]" animate />
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
        @keyframes text-shimmer {
          to { background-position: 200% center; }
        }
      `}</style>
    </div>
  );
};

export default LoadingScreen;
