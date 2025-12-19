
import React, { useState } from 'react';

interface PinLockProps {
  correctPin: string;
  onUnlock: () => void;
}

const PinLock: React.FC<PinLockProps> = ({ correctPin, onUnlock }) => {
  const [input, setInput] = useState('');
  const [error, setError] = useState(false);

  const handleKey = (num: string) => {
    setError(false);
    if (input.length < 4) {
      const newInput = input + num;
      setInput(newInput);
      if (newInput.length === 4) {
        if (newInput === correctPin) onUnlock();
        else {
          setError(true);
          setTimeout(() => setInput(''), 500);
        }
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[200] bg-slate-950 flex flex-col items-center justify-center p-10">
      <div className="text-center mb-12 space-y-4">
        <h2 className="text-4xl font-black italic tracking-tighter text-blue-500">STREAM<span className="text-white">TV</span></h2>
        <p className="text-slate-500 font-black uppercase tracking-[0.3em] text-[10px]">Acesso Protegido</p>
      </div>

      <div className={`flex gap-4 mb-16 ${error ? 'animate-shake' : ''}`}>
        {[0,1,2,3].map(i => (
          <div key={i} className={`w-16 h-20 rounded-3xl border-2 flex items-center justify-center text-3xl transition-all ${input[i] ? 'border-blue-500 bg-blue-500/10 text-white' : 'border-white/10 bg-white/5'}`}>
            {input[i] ? '●' : ''}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-6 max-w-xs w-full">
        {['1','2','3','4','5','6','7','8','9','CLR','0','⌫'].map(k => (
          <button 
            key={k}
            onClick={() => {
              if (k === 'CLR') setInput('');
              else if (k === '⌫') setInput(input.slice(0, -1));
              else handleKey(k);
            }}
            className="h-20 bg-white/5 hover:bg-white/10 border border-white/5 rounded-3xl text-xl font-black text-white transition-all active:scale-90"
          >
            {k}
          </button>
        ))}
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-10px); }
          75% { transform: translateX(10px); }
        }
        .animate-shake { animation: shake 0.2s ease-in-out 0s 2; }
      `}</style>
    </div>
  );
};

export default PinLock;
