'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { SammoAPI } from '@/lib/api/sammo';
import TopBackBar from '@/components/common/TopBackBar';
import { cn } from '@/lib/utils';
import GamePageLayout from '@/components/layout/GamePageLayout';
import { useToast } from '@/contexts/ToastContext';

interface Troop {
  troopID: number;
  troopName: string;
  troopLeader: {
    city: number;
    name: string;
    imgsvr: number;
    picture: number;
  };
  members: Array<{
    no: number;
    name: string;
    city: number;
  }>;
  reservedCommandBrief: string[];
  turnTime: string;
}

export default function TroopPage() {
  const params = useParams();
  const serverID = params?.server as string;
  const { showToast } = useToast();

  const [troopList, setTroopList] = useState<Troop[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTroopName, setNewTroopName] = useState('');

  useEffect(() => {
    loadTroops();
  }, [serverID]);

  async function loadTroops() {
    try {
      setLoading(true);
      // NationGeneralList API를 사용하여 부대 목록 가져오기
      const result = await SammoAPI.NationGeneralList({ serverID });
      if (result.success && result.troops && result.list) {
        // GeneralListService의 troops 형식을 Troop 형식으로 변환
        const troopListData: Troop[] = result.troops.map((troop: any) => {
          // 부대장 정보 찾기 (troop.id는 부대장 ID)
          const leader = result.list?.find((gen: any) => gen.no === troop.id);

          // 부대원 목록 찾기 (같은 부대에 속한 장수들)
          // troop.id는 부대장 ID이므로, 부대원 목록은 부대장을 포함한 모든 장수
          const members = result.list?.filter((gen: any) => {
            // 부대장이거나, 부대장의 troop 필드가 같은 경우
            return gen.no === troop.id || (gen.troop && gen.troop === troop.id);
          }) || [];

          // 예약된 커맨드는 부대장의 reservedCommand에서 가져와야 하지만
          // GeneralListService에서는 제공하지 않으므로 일단 빈 배열
          const reservedCommandBrief: string[] = [];

          return {
            troopID: troop.id,
            troopName: troop.name || '무명부대',
            troopLeader: {
              city: leader?.city || 0,
              name: leader?.name || '무명',
              imgsvr: leader?.imgsvr || 0,
              picture: leader?.picture || 0,
            },
            members: members.map((gen: any) => ({
              no: gen.no,
              name: gen.name,
              city: gen.city || 0,
            })),
            reservedCommandBrief,
            turnTime: troop.turntime || new Date().toISOString(),
          };
        });

        setTroopList(troopListData);
      } else {
        setTroopList([]);
      }
    } catch (err) {
      console.error(err);
      showToast('부대 정보를 불러오는데 실패했습니다.', 'error');
      setTroopList([]);
    } finally {
      setLoading(false);
    }
  }

  async function makeTroop() {
    if (!newTroopName.trim()) {
      showToast('부대명을 입력해주세요.', 'warning');
      return;
    }

    try {
      const result = await SammoAPI.TroopNewTroop({
        name: newTroopName,
        session_id: serverID,
      });

      if (result.result) {
        setNewTroopName('');
        showToast('부대가 창설되었습니다.', 'success');
        await loadTroops();
      } else {
        showToast(result.reason || '부대 창설에 실패했습니다.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('부대 창설 중 오류가 발생했습니다.', 'error');
    }
  }

  async function joinTroop(troopID: number) {
    try {
      const result = await SammoAPI.TroopJoinTroop({
        troopID: troopID,
      });

      if (result.result) {
        showToast('부대에 탑승했습니다.', 'success');
        await loadTroops();
      } else {
        showToast(result.reason || '부대 탑승에 실패했습니다.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('부대 탑승 중 오류가 발생했습니다.', 'error');
    }
  }

  async function exitTroop() {
    if (!confirm('정말로 부대를 탈퇴하시겠습니까?')) {
      return;
    }

    try {
      const result = await SammoAPI.TroopExitTroop();
      if (result.result) {
        showToast('부대에서 탈퇴했습니다.', 'success');
        await loadTroops();
      } else {
        showToast(result.reason || '부대 탈퇴에 실패했습니다.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('부대 탈퇴 중 오류가 발생했습니다.', 'error');
    }
  }

  return (
    <GamePageLayout>
      <div className="font-sans h-full">
        <div className="max-w-7xl mx-auto space-y-6">
          <TopBackBar title="부대 편성" reloadable onReload={loadTroops} />

          {loading ? (
            <div className="min-h-[50vh] flex items-center justify-center">
              <div className="animate-pulse text-gray-400 font-bold">로딩 중...</div>
            </div>
          ) : (
            <>
              {/* Create Troop Section */}
              <div className="bg-gray-900/50 backdrop-blur-sm border border-white/5 rounded-xl p-6 shadow-lg">
                <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <span className="w-1 h-5 bg-green-500 rounded-full"></span>
                  부대 창설
                </h2>
                <div className="flex gap-2 max-w-md">
                  <input
                    type="text"
                    value={newTroopName}
                    onChange={(e) => setNewTroopName(e.target.value)}
                    placeholder="창설할 부대명 입력"
                    className="flex-1 bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-green-500/50 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={makeTroop}
                    className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white font-bold rounded-lg text-sm transition-colors shadow-lg shadow-green-900/20"
                  >
                    창설
                  </button>
                </div>
              </div>

              {/* Troop List Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {troopList.map((troop) => (
                  <div key={troop.troopID} className="bg-gray-900/50 backdrop-blur-sm border border-white/5 rounded-xl overflow-hidden shadow-lg hover:border-white/20 transition-all duration-200 group">
                    {/* Header */}
                    <div className="bg-white/5 px-4 py-3 border-b border-white/5 flex justify-between items-center">
                      <h3 className="font-bold text-blue-400 group-hover:text-blue-300 transition-colors">{troop.troopName}</h3>
                      <div className="text-xs text-gray-500">
                        턴: <span className="text-gray-300 font-mono">{troop.turnTime.slice(14, 19)}</span>
                      </div>
                    </div>

                    <div className="p-4 space-y-4">
                      {/* Leader Info */}
                      <div className="flex items-center gap-4 bg-black/20 p-3 rounded-lg border border-white/5">
                        <div className="w-12 h-12 bg-gray-800 rounded border border-white/10 overflow-hidden shrink-0">
                          <img
                            width="48"
                            height="48"
                            src={`/api/general/icon/${troop.troopLeader.imgsvr}/${troop.troopLeader.picture}`}
                            alt={troop.troopLeader.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '/default_portrait.png'; // Fallback
                            }}
                          />
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 uppercase">부대장</div>
                          <div className="font-bold text-white">{troop.troopLeader.name}</div>
                          <div className="text-xs text-gray-400">도시: {troop.troopLeader.city}</div>
                        </div>
                      </div>

                      {/* Reserved Commands (if any) */}
                      {troop.reservedCommandBrief.length > 0 && (
                        <div className="text-xs text-gray-400 bg-black/20 p-2 rounded border border-white/5">
                          {troop.reservedCommandBrief.map((brief, idx) => (
                            <div key={idx} className="truncate">{idx + 1}: {brief}</div>
                          ))}
                        </div>
                      )}

                      {/* Members */}
                      <div>
                        <div className="text-xs font-bold text-gray-500 mb-2 flex justify-between">
                          <span>부대원 목록</span>
                          <span>({troop.members.length}명)</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {troop.members.map((member) => (
                            <span
                              key={member.no}
                              className={cn(
                                "text-xs px-2 py-1 rounded border",
                                member.no === troop.troopID
                                  ? "bg-blue-900/30 border-blue-500/30 text-blue-300"
                                  : "bg-gray-800 border-gray-700 text-gray-300"
                              )}
                            >
                              {member.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="bg-white/5 px-4 py-3 border-t border-white/5 flex gap-2">
                      <button
                        onClick={() => joinTroop(troop.troopID)}
                        className="flex-1 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 rounded text-xs font-bold transition-colors"
                      >
                        부대 탑승
                      </button>
                      <button
                        onClick={exitTroop}
                        className="flex-1 py-1.5 bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/30 rounded text-xs font-bold transition-colors"
                      >
                        부대 탈퇴
                      </button>
                    </div>
                  </div>
                ))}

                {troopList.length === 0 && (
                  <div className="col-span-full text-center py-12 text-gray-500 border border-dashed border-white/10 rounded-xl">
                    개설된 부대가 없습니다.
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </GamePageLayout>
  );
}




