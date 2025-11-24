'use client';

import { useEffect, useState } from 'react';
import { useGameStore } from '@/stores/gameStore';
import { loghApi } from '@/lib/api/logh';
import { LOGH_TEXT } from '@/constants/uiText';
import { useShortcut } from '@/hooks/useShortcut';


interface TacticalHUDProps {
  battleId: string;
  sessionId?: string;
  offlineStatus?: {
    hasOfflineCommanders: boolean;
    offlineCommanderIds: string[];
  };
}

interface CasualtyReport {
  faction: string;
  shipsLost: number;
  troopsLost: number;
}

export default function TacticalHUD({ 
  battleId, 
  sessionId = 'test_session',
  offlineStatus 
}: TacticalHUDProps) {
  const { selectUnit, selectedUnitId, userProfile } = useGameStore();
  const [isAuto, setIsAuto] = useState(false);

  const [casualtyReport, setCasualtyReport] = useState<CasualtyReport[]>([]);
  const [showCasualties, setShowCasualties] = useState(false);

  // Auto-enable AI if offline commanders detected
  useEffect(() => {
    if (offlineStatus?.hasOfflineCommanders && !isAuto) {
      console.log('오프라인 지휘관 감지됨, AI 자동 조종 추천');
    }
  }, [offlineStatus, isAuto]);

  const handleAutoResolve = async () => {
    const confirmMessage = offlineStatus?.hasOfflineCommanders 
      ? `오프라인 지휘관 ${offlineStatus.offlineCommanderIds.length}명 감지됨.\n` + LOGH_TEXT.autoResolveConfirm
      : LOGH_TEXT.autoResolveConfirm;
    
    if (!confirm(confirmMessage)) return;
    
    try {
        setIsAuto(true);
        const resolverId = userProfile?.id || 'temp-resolver-id';
        const result = await loghApi.autoResolveBattle(battleId, resolverId);

        
        // Extract casualty report from result
        if (result.data?.casualtyReport) {
          setCasualtyReport(result.data.casualtyReport);
          setShowCasualties(true);
        }
        
        alert(LOGH_TEXT.autoResolveSuccess(result.data?.factions?.[0]?.code || null));
    } catch (e) {
        alert(LOGH_TEXT.autoResolveError);
        setIsAuto(false);
    }
  };

  // P.25 Shortcuts - 전술 화면 전용 단축키 등록
  useShortcut('f', () => console.log('명령: 이동'), { scope: 'logh-tactical' });
  useShortcut('r', () => console.log('명령: 공격'), { scope: 'logh-tactical' });
  useShortcut('z', () => console.log('진형: 척추'), { scope: 'logh-tactical' });
  useShortcut('x', () => console.log('진형: 오목'), { scope: 'logh-tactical' });
  useShortcut('Escape', () => selectUnit(null), { scope: 'logh-tactical' });


  return (
    <div data-testid="logh-tactical-hud">
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

      {/* Offline Commander Alert */}
      {offlineStatus?.hasOfflineCommanders && !isAuto && (
        <div className="absolute top-4 left-4 bg-orange-900/90 border border-orange-500 rounded-lg p-3 pointer-events-auto shadow-lg max-w-xs">
          <div className="text-orange-300 font-bold text-sm mb-1">
            ⚠️ 오프라인 지휘관 감지
          </div>
          <div className="text-orange-200 text-xs">
            {offlineStatus.offlineCommanderIds.length}명의 지휘관이 오프라인 상태입니다.
            AI 자동 조종을 권장합니다.
          </div>
        </div>
      )}

      {/* Casualty Report Modal */}
      {showCasualties && casualtyReport.length > 0 && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/95 border-2 border-red-500 rounded-lg p-6 pointer-events-auto shadow-2xl min-w-[400px]">
          <div className="text-red-400 font-bold text-lg mb-4 text-center">
            📊 전투 손실 보고서
          </div>
          <div className="space-y-3">
            {casualtyReport.map((report, idx) => (
              <div key={idx} className="bg-red-900/20 border border-red-700 rounded p-3">
                <div className="text-white font-bold mb-2">{report.faction}</div>
                <div className="text-sm text-gray-300 space-y-1">
                  <div>함선 손실: <span className="text-red-400 font-mono">{report.shipsLost.toLocaleString()}</span></div>
                  <div>병력 손실: <span className="text-red-400 font-mono">{report.troopsLost.toLocaleString()}</span></div>
                </div>
              </div>
            ))}
          </div>
          <button 
            onClick={() => setShowCasualties(false)}
            className="mt-4 w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 rounded"
          >
            확인
          </button>
        </div>
      )}

      {/* Shortcuts Help (Bottom Center) */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 pointer-events-auto">
         <button 
           onClick={handleAutoResolve}
           disabled={isAuto}
           className={`px-3 py-1 border rounded text-xs font-bold transition-all ${
             offlineStatus?.hasOfflineCommanders && !isAuto
               ? 'bg-orange-500/30 border-orange-500 text-orange-300 animate-pulse hover:bg-orange-500/50'
               : isAuto 
                 ? 'bg-yellow-500/20 border-yellow-500 text-yellow-500' 
                 : 'bg-black/60 border-white/30 text-white hover:bg-white/10'
           }`}
         >
           {isAuto ? LOGH_TEXT.autoResolveActiveLabel : LOGH_TEXT.autoResolveIdleLabel}
         </button>
         {LOGH_TEXT.shortcuts.map(cmd => (
           <div key={cmd} className="bg-black/60 text-[#9CA3AF] text-xs px-2 py-1 border border-[#333] rounded">
             {cmd}
           </div>
         ))}
      </div>
    </div>
  );
}
