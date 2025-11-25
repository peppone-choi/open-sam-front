'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { SammoAPI, type BattleCenterEntry } from '@/lib/api/sammo';
import TopBackBar from '@/components/common/TopBackBar';
import { cn } from '@/lib/utils';
import { useToast } from '@/contexts/ToastContext';

export default function BattleCenterPage() {
  const params = useParams();
  const router = useRouter();
  const serverID = params?.server as string;

  const [loading, setLoading] = useState(true);
  const [battleData, setBattleData] = useState<{ battles: BattleCenterEntry[] } | null>(null);
  const { showToast } = useToast();

  useEffect(() => {
    loadBattleData();
  }, [serverID]);

  async function loadBattleData() {
    try {
      setLoading(true);
      const result = await SammoAPI.GetBattleCenter({ serverID });
      if (result.success && result.battles) {
        setBattleData({ battles: result.battles });
      } else {
        setBattleData({ battles: [] });
      }
    } catch (err) {
      console.error(err);
      showToast('전투 정보를 불러오는데 실패했습니다.', 'error');
      setBattleData({ battles: [] });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-4 md:p-6 lg:p-8 font-sans">
      <div className="max-w-5xl mx-auto space-y-6">
        <TopBackBar title="감 찰 부" reloadable onReload={loadBattleData} />
        
        {loading ? (
          <div className="min-h-[50vh] flex items-center justify-center">
             <div className="animate-pulse text-gray-400 font-bold">로딩 중...</div>
          </div>
        ) : (
          <div className="space-y-4">
            {battleData && battleData.battles && Array.isArray(battleData.battles) && battleData.battles.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {battleData.battles.map((battle: BattleCenterEntry) => (
                  <div key={battle.battleId ?? battle.id} className="bg-gray-900/50 backdrop-blur-sm border border-white/5 rounded-xl p-5 shadow-lg hover:border-white/20 transition-all duration-200 flex flex-col gap-4">
                    <div className="flex justify-between items-start border-b border-white/5 pb-3">
                      <div className="flex items-center gap-2">
                         <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-900/50 text-red-400 border border-red-500/20">
                            전투 #{battle.battleId ?? battle.id}
                         </span>
                         <span className="text-xs text-gray-500">
                            {new Date(battle.date).toLocaleString('ko-KR')}
                         </span>
                      </div>
                      <div className="text-sm font-bold text-yellow-500">{battle.status}</div>
                    </div>
                    
                    <div className="text-sm text-gray-300 space-y-1 flex-1">
                      {battle.type === 'general' && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">유형</span>
                          <span>장수 전투 기록</span>
                        </div>
                      )}
                      {battle.type === 'world' && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">유형</span>
                          <span>세계 전투 기록</span>
                        </div>
                      )}
                      <div className="mt-2 p-3 bg-black/20 rounded-lg text-gray-400 text-xs leading-relaxed break-words">
                         {battle.text}
                      </div>
                    </div>
                    
                    <div className="flex gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          router.push(`/${serverID}/battle/${battle.battleId || battle.id}`);
                        }}
                        className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded transition-colors shadow-lg shadow-blue-900/20"
                      >
                        상세보기
                      </button>
                      {battle.type === 'active' && (
                        <button
                          type="button"
                          onClick={() => {
                            router.push(`/${serverID}/battle-simulator?battleId=${battle.battleId}`);
                          }}
                          className="flex-1 py-2 bg-purple-600 hover:bg-purple-500 text-white text-sm font-bold rounded transition-colors shadow-lg shadow-purple-900/20"
                        >
                          시뮬레이터
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500 bg-gray-900/30 rounded-xl border border-white/5 border-dashed">
                진행 중인 전투가 없습니다.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}




