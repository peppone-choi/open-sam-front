'use client';
 
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { SammoAPI } from '@/lib/api/sammo';
import TopBackBar from '@/components/common/TopBackBar';
import { cn } from '@/lib/utils';
import { formatOfficerLevelText } from '@/utils/formatOfficerLevelText';
import { useToast } from '@/contexts/ToastContext';

interface GeneralItem {
  no: number;
  name: string;
  nation?: number;
  city?: number;
  cityName?: string;
  officerLevel?: number;
  officerLevelText?: string;
  leadership?: number;
  strength?: number;
  intel?: number;
  troop?: number;
  troopName?: string;
  crew?: number;
  train?: number;
  atmos?: number;
  killturn?: number;
  turntime?: string;
  permission?: number;
  st0?: boolean; // 기본 정보 표시
  st1?: boolean; // 상세 정보 표시
  st2?: boolean; // 부대 정보 표시
  [key: string]: any;
}

interface TroopInfo {
  id: number;
  name: string;
}

export default function NationGeneralsPage() {
  const params = useParams();
  const router = useRouter();
  const serverID = params?.server as string;

  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [generals, setGenerals] = useState<GeneralItem[]>([]);
  const [troopList, setTroopList] = useState<Record<number, string>>({});
  const [permission, setPermission] = useState(0);
  const [env, setEnv] = useState<{ year?: number; month?: number; turnterm?: number; killturn?: number }>({});

  const loadGenerals = useCallback(async () => {
    try {
      setLoading(true);
      // NationGeneralList API 사용 (permission, troops 포함)
      const result = await SammoAPI.NationGeneralList({ serverID });
      
      if (result.result) {
        const rawGenerals = result.list ?? [];
        const perm = result.permission ?? 0;
        setPermission(perm);
        setEnv(result.env ?? {});
        
        // 권한 기반 정보 표시 설정 (Vue와 동일한 로직)
        const mappedGenerals = rawGenerals.map((gen: any) => {
          const genItem: GeneralItem = {
            ...gen,
            officerLevelText: gen.officerLevelText ?? formatOfficerLevelText(gen.officerLevel ?? gen.officer_level ?? 0),
            st0: true,
            st1: perm >= 1,
            st2: perm >= 2,
          };
          return genItem;
        });
        
        setGenerals(mappedGenerals);
        
        // 부대 목록 설정
        if (perm >= 2 && result.troops) {
          const troopMap: Record<number, string> = {};
          for (const troop of result.troops as TroopInfo[]) {
            troopMap[troop.id] = troop.name;
          }
          setTroopList(troopMap);
        }
      } else {
        showToast(result.message || '세력 장수 목록을 불러오는데 실패했습니다.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('세력 장수 목록을 불러오는데 실패했습니다.', 'error');
    } finally {
      setLoading(false);
    }
  }, [serverID, showToast]);

  useEffect(() => {
    loadGenerals();
  }, [loadGenerals]);

  // 장수 클릭 시 배틀센터 열기
  const openBattleCenter = useCallback((generalID: number) => {
    window.open(`/${serverID}/battle-center?gen=${generalID}`, '_blank');
  }, [serverID]);

  // 부대 이름 가져오기
  const getTroopName = (troopId?: number): string | null => {
    if (!troopId || troopId <= 0) return null;
    return troopList[troopId] ?? null;
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-4 md:p-6 lg:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        <TopBackBar title="세력 장수" reloadable onReload={loadGenerals} />
        
        {/* 환경 정보 */}
        {env.year && (
          <div className="bg-gray-900/50 border border-white/5 rounded-xl px-4 py-2 flex flex-wrap gap-4 text-sm">
            <span className="text-gray-400">
              현재: <span className="text-white font-bold">{env.year}년 {env.month ?? 1}월</span>
            </span>
            {env.turnterm && (
              <span className="text-gray-400">
                턴 주기: <span className="text-white">{env.turnterm}분</span>
              </span>
            )}
            {env.killturn && (
              <span className="text-gray-400">
                삭턴: <span className="text-red-400">{env.killturn}턴</span>
              </span>
            )}
            <span className="text-gray-500">
              권한: <span className={cn(
                "font-medium",
                permission >= 2 ? "text-yellow-400" : permission >= 1 ? "text-blue-400" : "text-gray-400"
              )}>
                {permission >= 2 ? '수뇌부' : permission >= 1 ? '관리자' : '일반'}
              </span>
            </span>
          </div>
        )}

        {loading ? (
          <div className="min-h-[50vh] flex items-center justify-center">
             <div className="animate-pulse text-gray-400 font-bold">로딩 중...</div>
          </div>
        ) : generals.length === 0 ? (
          <div className="min-h-[30vh] flex items-center justify-center text-gray-500">
            세력에 소속된 장수가 없습니다.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {generals.map((general) => (
              <div 
                key={general.no} 
                className={cn(
                  "bg-gray-900/50 backdrop-blur-sm border border-white/5 rounded-xl p-4",
                  "hover:border-white/20 hover:bg-white/[0.02] transition-all group shadow-sm",
                  "cursor-pointer"
                )}
                onClick={() => openBattleCenter(general.no)}
              >
                {/* 헤더: 이름 + 직위 */}
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-white/5">
                   <div className="font-bold text-white group-hover:text-blue-400 transition-colors truncate text-lg">
                      {general.name}
                   </div>
                   <span className={cn(
                     "text-xs font-medium px-2 py-0.5 rounded",
                     general.officerLevel && general.officerLevel >= 5 
                       ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30" 
                       : "bg-gray-800 text-gray-400 border border-white/10"
                   )}>
                     {general.officerLevelText || '일반'}
                   </span>
                </div>

                <div className="space-y-2 text-xs">
                  {/* 기본 정보 (st0: 항상 표시) */}
                  <div className="flex justify-between items-center">
                     <span className="text-gray-500">소속 도시</span>
                     <span className="text-gray-300">{general.cityName || '-'}</span>
                  </div>

                  {/* 상세 정보 (st1: permission >= 1) */}
                  {general.st1 && (
                    <>
                      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/5">
                        <div className="text-center">
                          <div className="text-gray-500 text-[10px]">통솔</div>
                          <div className="text-blue-400 font-bold">{general.leadership ?? '-'}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-gray-500 text-[10px]">무력</div>
                          <div className="text-red-400 font-bold">{general.strength ?? '-'}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-gray-500 text-[10px]">지력</div>
                          <div className="text-green-400 font-bold">{general.intel ?? '-'}</div>
                        </div>
                      </div>
                    </>
                  )}

                  {/* 부대 정보 (st2: permission >= 2) */}
                  {general.st2 && (
                    <>
                      <div className="pt-2 border-t border-white/5 space-y-1">
                        {getTroopName(general.troop) && (
                          <div className="flex justify-between items-center">
                            <span className="text-gray-500">부대</span>
                            <span className="text-cyan-400 font-medium">{getTroopName(general.troop)}</span>
                          </div>
                        )}
                        <div className="flex justify-between items-center">
                          <span className="text-gray-500">병력</span>
                          <span className="text-white">{general.crew?.toLocaleString() ?? 0}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-500">훈련</span>
                            <span className={cn(
                              (general.train ?? 0) >= 80 ? "text-green-400" : 
                              (general.train ?? 0) >= 50 ? "text-yellow-400" : "text-red-400"
                            )}>
                              {general.train ?? 0}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-500">사기</span>
                            <span className={cn(
                              (general.atmos ?? 0) >= 80 ? "text-green-400" : 
                              (general.atmos ?? 0) >= 50 ? "text-yellow-400" : "text-red-400"
                            )}>
                              {general.atmos ?? 0}
                            </span>
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  {/* 삭턴 경고 */}
                  {general.killturn !== undefined && general.killturn <= 10 && (
                    <div className="pt-2 border-t border-red-500/20">
                      <span className="text-red-400 text-[10px] font-bold animate-pulse">
                        ⚠️ 삭턴까지 {general.killturn}턴 남음
                      </span>
                    </div>
                  )}
                </div>

                {/* 클릭 힌트 */}
                <div className="mt-3 pt-2 border-t border-white/5 text-center">
                  <span className="text-[10px] text-gray-600 group-hover:text-gray-400 transition-colors">
                    클릭하여 배틀센터 열기
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}




