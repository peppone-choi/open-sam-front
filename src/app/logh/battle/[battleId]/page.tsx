'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import TacticalMap from '@/components/logh/TacticalMap';
import TacticalHUD from '@/components/logh/TacticalHUD';
import { loghApi } from '@/lib/api/logh';

export default function LoghBattlePage() {
  const params = useParams();
  const router = useRouter();
  const battleId = params?.battleId as string;
  const sessionId = 'test_session'; // 임시 세션
  
  const [battleState, setBattleState] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [offlineStatus, setOfflineStatus] = useState<{
    hasOfflineCommanders: boolean;
    offlineCommanderIds: string[];
  }>({ hasOfflineCommanders: false, offlineCommanderIds: [] });

  useEffect(() => {
    if (battleId) {
      loadBattle();
      checkOfflineCommanders();
    }
  }, [battleId]);

  const loadBattle = async () => {
    try {
      const data = await loghApi.getBattleState(battleId);
      setBattleState(data);
    } catch (e) {
      console.error('전투 정보를 불러오지 못했습니다.', e);
    } finally {
      setLoading(false);
    }
  };

  const checkOfflineCommanders = async () => {
    try {
      const status = await loghApi.checkOfflineCommanders(battleId, sessionId);
      setOfflineStatus(status);
    } catch (e) {
      console.warn('오프라인 지휘관 확인 실패:', e);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-blue-500 animate-pulse">전투 데이터 로딩 중...</div>
      </div>
    );
  }

  if (!battleState) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-red-500">
        전투 정보를 찾을 수 없습니다.
      </div>
    );
  }

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden">
      {/* Tactical Map (Fullscreen) */}
      <div className="absolute inset-0 z-0">
        <TacticalMap 
          sessionId={sessionId} 
          tacticalMapId={battleId}
          onClose={() => router.push('/logh/game')}
        />
      </div>

      {/* HUD Overlay */}
      <div className="absolute inset-0 z-10 pointer-events-none">
        {/* Top Bar: Battle Info */}
        <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/80 to-transparent pointer-events-auto flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-wider flex items-center gap-3">
              <span className="text-red-500 animate-pulse">●</span> 
              전투 #{battleId.substring(0, 6)}
            </h1>
            <div className="text-xs text-gray-400 mt-1 font-mono">
              턴: {battleState.turn} | 단계: {battleState.phase}
            </div>
          </div>
          
          <div className="flex gap-4">
            <div className="text-right">
              <div className="text-cyan-400 font-bold">자유행성동맹</div>
              <div className="text-2xl font-mono text-white">5,000</div>
            </div>
            <div className="text-white font-bold pt-2">VS</div>
            <div className="text-left">
              <div className="text-yellow-400 font-bold">은하제국</div>
              <div className="text-2xl font-mono text-white">8,000</div>
            </div>
          </div>
        </div>

        {/* Tactical HUD Controls */}
        <TacticalHUD 
          battleId={battleId} 
          sessionId={sessionId}
          offlineStatus={offlineStatus}
        />
      </div>
    </div>
  );
}
