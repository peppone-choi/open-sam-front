'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { SammoAPI, type GetMapResponse } from '@/lib/api/sammo';
import TopBackBar from '@/components/common/TopBackBar';
import MapViewer from '@/components/game/MapViewer';
import InfoSummaryCard from '@/components/info/InfoSummaryCard';
import { INFO_TEXT } from '@/constants/uiText';
import { cn } from '@/lib/utils';

interface Nation {
  nation: number;
  name: string;
  color: string;
  level: number;
  capital: number;
  gennum: number;
  power: number;
  cities?: string[];
}

interface DiplomacyData {
  nations: Nation[];
  conflict: [number, Record<number, number>][];
  diplomacyList: Record<number, Record<number, number>>;
  myNationID: number;
}

export default function WorldPage() {
  const params = useParams();
  const serverID = params?.server as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [diplomacyData, setDiplomacyData] = useState<DiplomacyData | null>(null);
  const [mapData, setMapData] = useState<GetMapResponse | null>(null);

  const cityNameMap = useMemo(() => {
    if (!mapData?.cityList) return new Map<number, string>();
    const map = new Map<number, string>();
    for (const city of mapData.cityList) {
      const id = city[0] as number;
      const name = String(city[6] ?? '') || `도시 ${id}`;
      map.set(id, name);
    }
    return map;
  }, [mapData]);

  const summaryStats = useMemo(() => {
    if (!diplomacyData) {
      return null;
    }

    const totalNations = diplomacyData.nations.length;
    const totalPower = diplomacyData.nations.reduce((sum, nation) => sum + (nation.power ?? 0), 0);
    const avgPower = totalNations ? Math.round(totalPower / totalNations) : 0;

    const processedPairs = new Set<string>();
    let warPairs = 0;
    let nonAggressionPairs = 0;

    Object.entries(diplomacyData.diplomacyList).forEach(([left, relations]) => {
      Object.entries(relations || {}).forEach(([right, state]) => {
        if (left === right) return;
        const pairKey = Number(left) < Number(right) ? `${left}-${right}` : `${right}-${left}`;
        if (processedPairs.has(pairKey)) return;
        if (state === 0) {
          warPairs += 1;
        }
        if (state === 7) {
          nonAggressionPairs += 1;
        }
        processedPairs.add(pairKey);
      });
    });

    const conflictCities = diplomacyData.conflict.length;
    const maxConflictParticipants = diplomacyData.conflict.reduce(
      (max, [, participants]) => Math.max(max, Object.keys(participants).length),
      0,
    );

    const myNationRelations = diplomacyData.myNationID
      ? diplomacyData.diplomacyList[diplomacyData.myNationID] || {}
      : {};
    const myHostiles = Object.values(myNationRelations).filter((state) => state === 0 || state === 1).length;
    const myTreaties = Object.values(myNationRelations).filter((state) => state === 7).length;

    return {
      totalNations,
      totalPower,
      avgPower,
      warPairs,
      nonAggressionPairs,
      conflictCities,
      maxConflictParticipants,
      myHostiles,
      myTreaties,
      hasPersonalPerspective: diplomacyData.myNationID > 0,
    };
  }, [diplomacyData]);

  useEffect(() => {
    loadData();
  }, [serverID]);

  async function loadData() {
    try {
      setLoading(true);
      setError(null);
      
      const [diplomacyResult, mapResult]: [any, GetMapResponse] = await Promise.all([
        SammoAPI.GlobalGetDiplomacy({ serverID }),
        SammoAPI.GlobalGetMap({ serverID, neutralView: 1 })
      ]);
      
      if (diplomacyResult?.result) {
        setDiplomacyData({
          nations: diplomacyResult.nations || [],
          conflict: diplomacyResult.conflict || [],
          diplomacyList: diplomacyResult.diplomacyList || {},
          myNationID: diplomacyResult.myNationID || 0
        });
      } else {
        // setError('중원 정보를 불러올 수 없습니다.');
      }

      if (mapResult.result) {
        setMapData(mapResult);
      }
    } catch (err: any) {
      console.error('GetDiplomacy error:', err);
      // setError(err.message || '중원 정보를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }

  const isBrightColor = (color: string): boolean => {
    if (!color) return false;
    const hex = color.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 150;
  };

  const getNationTextColor = (color: string): string => (isBrightColor(color) ? '#000000' : '#ffffff');

  const getDiplomacySymbol = (state: number, isInvolved: boolean): React.ReactElement => {
    if (isInvolved) {
      switch (state) {
        case 0:
          return <span className="text-red-500 font-bold">★</span>; // 교전
        case 1:
          return <span className="text-pink-500 font-bold">▲</span>; // 선전포고
        case 2:
          return <span className="text-gray-400">ㆍ</span>; // 통상
        case 7:
          return <span className="text-green-500 font-bold">@</span>; // 불가침
        default:
          return <span className="text-gray-500">?</span>;
      }
    } else {
      switch (state) {
        case 0:
          return <span className="text-red-500 font-bold">★</span>; // 교전 (visible)
        case 1:
          return <span className="text-pink-500 font-bold">▲</span>; // 선전포고 (visible)
        default:
          return <span></span>; // 숨김
      }
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-gray-950 p-4 font-sans text-gray-100 md:p-6 lg:p-8">
      <div className="pointer-events-none absolute inset-0 bg-hero-pattern opacity-20" />
      <div className="pointer-events-none absolute -top-32 right-10 h-96 w-96 rounded-full bg-emerald-500/15 blur-[180px]" />

      <div className="relative z-10">
        <TopBackBar title="중원 정보" reloadable onReload={loadData} />
        
        {loading ? (
          <div className="flex h-[50vh] items-center justify-center">
             <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-white" />
          </div>
        ) : error ? (
          <div className="flex h-[50vh] items-center justify-center text-rose-300">{error}</div>
        ) : diplomacyData ? (
          <div className="mx-auto mt-6 flex max-w-7xl flex-col space-y-8">
            {summaryStats && (
              <div className="grid gap-4 md:grid-cols-3">
                <InfoSummaryCard
                  label={INFO_TEXT.world.summaryTitle}
                  value={`${summaryStats.totalNations}국`}
                  description={INFO_TEXT.world.summaryDescription}
                  meta={[
                    { label: '국력 합계', value: summaryStats.totalPower.toLocaleString() },
                    { label: '국력 평균', value: summaryStats.avgPower.toLocaleString() },
                  ]}
                  accent="blue"
                />
                <InfoSummaryCard
                  label={summaryStats.hasPersonalPerspective ? INFO_TEXT.world.personalConflictLabel : INFO_TEXT.world.globalConflictLabel}
                  value={summaryStats.hasPersonalPerspective ? `${summaryStats.myHostiles}국` : `${summaryStats.warPairs}쌍`}
                  description={summaryStats.hasPersonalPerspective ? INFO_TEXT.world.personalConflictDescription : INFO_TEXT.world.globalConflictDescription}
                  meta={summaryStats.hasPersonalPerspective ? [
                    { label: '내 교전', value: `${summaryStats.myHostiles}국` },
                    { label: '내 불가침', value: `${summaryStats.myTreaties}국` },
                  ] : [
                    { label: '교전 쌍', value: `${summaryStats.warPairs}쌍` },
                    { label: '불가침 쌍', value: `${summaryStats.nonAggressionPairs}쌍` },
                  ]}
                  accent="amber"
                />
                <InfoSummaryCard
                  label={INFO_TEXT.world.conflictLabel}
                  value={summaryStats.conflictCities ? `${summaryStats.conflictCities}곳` : INFO_TEXT.world.conflictNone}
                  description={INFO_TEXT.world.conflictDescription}
                  meta={[
                    { label: '최대 참전', value: `${summaryStats.maxConflictParticipants}국` },
                    { label: '불가침 쌍', value: `${summaryStats.nonAggressionPairs}쌍` },
                  ]}
                  accent="violet"
                />
              </div>
            )}

            {/* 천하도 지도 */}
            {mapData && (
              <div className="overflow-hidden rounded-2xl border border-white/5 bg-gray-900/70 shadow-lg">
                <div className="border-b border-white/10 bg-blue-500/10 px-6 py-3 text-lg font-bold text-blue-200">천하도</div>
                <div className="relative h-[600px] bg-gray-800/30">
                  <MapViewer serverID={serverID} mapData={mapData} isFullWidth />
                </div>
              </div>
            )}

            {/* 외교 현황 */}
            <div className="overflow-hidden rounded-2xl border border-white/5 bg-gray-900/70 shadow-lg">
              <div className="border-b border-white/10 bg-indigo-500/10 px-6 py-3 text-lg font-bold text-indigo-200">외교 현황</div>
              <div className="overflow-x-auto p-4">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr>
                      <th className="p-2"></th>
                      {diplomacyData.nations.map((nation) => (
                        <th
                          key={nation.nation}
                          className="min-w-[60px] border border-white/5 p-2 text-center font-bold"
                          style={{ color: getNationTextColor(nation.color), backgroundColor: nation.color }}
                        >
                          {nation.name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {diplomacyData.nations.map((meNation) => (
                      <tr key={meNation.nation}>
                        <th
                          className="border border-white/5 p-2 text-center font-bold"
                          style={{ color: getNationTextColor(meNation.color), backgroundColor: meNation.color }}
                        >
                          {meNation.name}
                        </th>
                        {diplomacyData.nations.map((youNation) => {
                          if (meNation.nation === youNation.nation) {
                            return (
                              <td key={youNation.nation} className="border border-white/5 bg-black/20 p-2 text-center text-gray-400">
                                ＼
                              </td>
                            );
                          }
                          
                          const isInvolved = meNation.nation === diplomacyData.myNationID || youNation.nation === diplomacyData.myNationID;
                          const state = diplomacyData.diplomacyList[meNation.nation]?.[youNation.nation] ?? 2;
                          
                          return (
                            <td
                              key={youNation.nation}
                              className={cn('border border-white/5 p-2 text-center transition-colors', isInvolved && 'bg-rose-500/10')}
                            >
                              {getDiplomacySymbol(state, isInvolved)}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="mt-4 flex justify-center gap-4 text-center text-xs text-gray-400">
                   <span><span className="font-bold text-green-400">@</span> 불가침</span>
                   <span>ㆍ 통상</span>
                   <span><span className="font-bold text-pink-400">▲</span> 선전포고</span>
                   <span><span className="font-bold text-rose-400">★</span> 교전</span>
                </div>
              </div>
            </div>

            {/* 국가 목록 */}
            <div className="overflow-hidden rounded-2xl border border-white/5 bg-gray-900/70 shadow-lg">
              <div className="border-b border-white/10 bg-emerald-500/10 px-6 py-3 text-lg font-bold text-emerald-200">국가 목록</div>
              <div className="overflow-x-auto">
                 <table className="w-full text-left text-sm">
                   <thead>
                     <tr className="border-b border-white/5 bg-white/5 text-gray-100">
                       <th className="px-4 py-3">국가</th>
                       <th className="px-4 py-3 text-center">레벨</th>
                       <th className="px-4 py-3 text-right">세력</th>
                       <th className="px-4 py-3 text-right">장수</th>
                       <th className="px-4 py-3 text-right">도시</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-white/5">
                     {diplomacyData.nations.map((nation) => (
                       <tr key={nation.nation} className="transition-colors hover:bg-white/5">
                         <td
                           className="px-4 py-3 font-bold"
                           style={{ color: getNationTextColor(nation.color), backgroundColor: nation.color }}
                         >
                           {nation.name}
                         </td>
                         <td className="px-4 py-3 text-center">{nation.level}</td>
                         <td className="px-4 py-3 text-right font-mono text-amber-300">{nation.power?.toLocaleString() ?? 0}</td>
                         <td className="px-4 py-3 text-right font-mono text-blue-200">{nation.gennum ?? 0}</td>
                         <td className="px-4 py-3 text-right font-mono text-gray-400">{nation.cities?.length ?? 0}</td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
              </div>
            </div>

            {/* 분쟁 현황 */}
            {diplomacyData.conflict.length > 0 && (
              <div className="overflow-hidden rounded-2xl border border-white/5 bg-gray-900/70 shadow-lg">
                <div className="border-b border-white/10 bg-rose-500/10 px-6 py-3 text-lg font-bold text-rose-200">분쟁 현황</div>
                <div className="grid grid-cols-1 gap-4 p-6 md:grid-cols-2 lg:grid-cols-3">
                   {diplomacyData.conflict.map(([cityID, conflictNations]) => {
                     const name = cityNameMap.get(cityID) ?? '이름 미확인 도시';
                     return (
                       <div key={cityID} className="rounded-lg border border-white/5 bg-black/20 p-4">
                         <div className="mb-3 border-b border-white/5 pb-2 text-sm font-bold text-gray-100">{name}</div>
                         <div className="space-y-3">
                           {Object.entries(conflictNations).map(([nationID, percent]) => {
                             const nation = diplomacyData.nations.find((n) => n.nation === parseInt(nationID, 10));
                             if (!nation) return null;
                             
                             return (
                               <div key={nationID} className="space-y-1">
                                 <div className="flex justify-between text-xs">
                                   <span
                                     className="rounded px-1.5 py-0.5 font-bold"
                                     style={{ color: getNationTextColor(nation.color), backgroundColor: nation.color }}
                                   >
                                     {nation.name}
                                   </span>
                                   <span className="text-gray-400">{percent.toFixed(1)}%</span>
                                 </div>
                                 <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                                   <div
                                     className="h-full rounded-full"
                                     style={{ width: `${percent}%`, backgroundColor: nation.color }}
                                   />
                                 </div>
                               </div>
                             );
                           })}
                         </div>
                       </div>
                     );
                   })}

                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex h-[50vh] items-center justify-center text-gray-400">
            데이터가 없습니다.
          </div>
        )}
      </div>
    </div>
  );
}
