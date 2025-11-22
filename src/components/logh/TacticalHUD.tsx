'use client';

import { useEffect, useState } from 'react';
import { useGameStore } from '@/stores/gameStore';
import { loghApi } from '@/lib/api/logh';
import { LOGH_TEXT } from '@/constants/uiText';

export default function TacticalHUD({ battleId }: { battleId: string }) {
  const { selectUnit, selectedUnitId } = useGameStore();
  const [isAuto, setIsAuto] = useState(false);

  const handleAutoResolve = async () => {
    if (!confirm(LOGH_TEXT.autoResolveConfirm)) return;
    try {
        setIsAuto(true);
        const result = await loghApi.autoResolveBattle(battleId);
        alert(LOGH_TEXT.autoResolveSuccess(result.winner));
    } catch (e) {
        alert(LOGH_TEXT.autoResolveError);
        setIsAuto(false);
    }
  };

  // P.25 Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch(e.key.toLowerCase()) {
        case 'f': console.log('명령: 이동'); break;
        case 'r': console.log('명령: 공격'); break;
        case 'z': console.log('진형: 척추'); break;
        case 'x': console.log('진형: 오목'); break;
        case 'escape': selectUnit(null); break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectUnit]);

  return (
    <>
      {/* Radar (Top Right) */}
      <div data-testid="tactical-hud" className="absolute top-4 right-4 w-48 h-48 bg-[#050510]/80 border border-[#1E90FF] rounded-full overflow-hidden pointer-events-auto shadow-lg backdrop-blur">
        <div className="w-full h-full relative">
           {/* Radar Sweep Animation */}
           <div className="absolute inset-0 border-r border-[#1E90FF]/50 w-1/2 h-full origin-right animate-spin-slow" 
                style={{ animationDuration: '4s' }}></div>
           {/* Center (Flagship) */}
           <div className="absolute top-1/2 left-1/2 w-2 h-2 bg-[#00FF00] -translate-x-1/2 -translate-y-1/2 rounded-full"></div>
           {/* Grid */}
           <div className="absolute inset-0 border border-[#1E90FF]/20 rounded-full scale-50"></div>
           <div className="absolute inset-0 border border-[#1E90FF]/20 rounded-full scale-75"></div>
        </div>
        <div className="absolute bottom-1 right-2 text-[10px] text-[#1E90FF] font-mono">{LOGH_TEXT.radarActive}</div>
      </div>

      {/* Shortcuts Help (Bottom Center) */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 pointer-events-auto">
         <button 
           onClick={handleAutoResolve}
           disabled={isAuto}
           className={`px-3 py-1 border rounded text-xs font-bold ${isAuto ? 'bg-yellow-500/20 border-yellow-500 text-yellow-500' : 'bg-black/60 border-white/30 text-white hover:bg-white/10'}`}
         >
           {isAuto ? LOGH_TEXT.autoResolveActiveLabel : LOGH_TEXT.autoResolveIdleLabel}
         </button>
         {LOGH_TEXT.shortcuts.map(cmd => (
           <div key={cmd} className="bg-black/60 text-[#9CA3AF] text-xs px-2 py-1 border border-[#333] rounded">
             {cmd}
           </div>
         ))}
      </div>
    </>
  );
}
