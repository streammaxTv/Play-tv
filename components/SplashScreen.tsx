
import React, { useEffect, useState } from 'react';

interface SplashScreenProps {
  onFinish: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      handleFinish();
    }, 4000); // 4 seconds duration

    return () => clearTimeout(timer);
  }, []);

  const handleFinish = () => {
    setIsVisible(false);
    setTimeout(onFinish, 500); // Allow exit animation to finish
  };

  return (
    <div className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-slate-950 transition-opacity duration-700 ${isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
      {/* Background Glow Effect */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-blue-600/20 blur-[100px] rounded-full animate-pulse"></div>
      
      <div className="relative flex flex-col items-center animate-in fade-in zoom-in duration-1000">
        <div className="text-6xl md:text-8xl font-black italic tracking-tighter mb-4 flex items-center gap-2">
          <span className="text-blue-500 drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]">STREAM</span>
          <span className="text-white">TV</span>
        </div>
        
        <div className="h-1 w-48 bg-slate-800 rounded-full overflow-hidden mt-4">
          <div className="h-full bg-blue-500 animate-[loading_4s_ease-in-out_forwards]"></div>
        </div>
        
        <p className="mt-6 text-slate-500 text-xs font-bold tracking-[0.3em] uppercase opacity-70">
          Premium Entertainment
        </p>
      </div>

      <button 
        onClick={handleFinish}
        className="absolute bottom-12 px-6 py-2 text-[10px] font-black tracking-widest text-slate-500 border border-slate-800 rounded-full hover:bg-white/5 hover:text-slate-300 transition-all uppercase"
      >
        Skip Intro
      </button>

      <style>{`
        @keyframes loading {
          0% { width: 0%; }
          100% { width: 100%; }
        }
      `}</style>
    </div>
  );
};

export default SplashScreen;
