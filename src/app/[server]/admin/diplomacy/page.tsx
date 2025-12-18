'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { SammoAPI } from '@/lib/api/sammo';
import TopBackBar from '@/components/common/TopBackBar';
import { cn } from '@/lib/utils';

interface DiplomacyRelation {
  no: number;
  srcNationId: number;
  destNationId: number;
  state: number;
  term: number;
  srcNationName?: string;
  destNationName?: string;
  srcNationColor?: string;
  destNationColor?: string;
}

interface Nation {
  nation: number;
  name: string;
  color: string;
}

const DIPLOMACY_STATES: Record<number, { label: string; color: string; bg: string }> = {
  0: { label: '교전', color: 'text-red-400', bg: 'bg-red-500/20' },
  1: { label: '선포중', color: 'text-orange-400', bg: 'bg-orange-500/20' },
  2: { label: '통상', color: 'text-gray-400', bg: 'bg-gray-500/20' },
  7: { label: '불가침', color: 'text-green-400', bg: 'bg-green-500/20' },
};

export default function AdminDiplomacyPage() {
  const params = useParams();
  const serverID = params?.server as string;

  const [loading, setLoading] = useState(true);
  const [diplomacyList, setDiplomacyList] = useState<DiplomacyRelation[]>([]);
  const [nations, setNations] = useState<Nation[]>([]);
  const [filterState, setFilterState] = useState<number | ''>('');

  const loadData = useCallback(async () => {
    if (!serverID) return;

    try {
      setLoading(true);
      
      const [dipResult, nationResult] = await Promise.all([
        SammoAPI.AdminGetDiplomacy({ session_id: serverID }),
        SammoAPI.AdminGetNationStats({ session_id: serverID, sortType: 0 }).catch(() => ({ success: false })),
      ]);
      
      // 국가 정보 처리
      let nationMap: Record<number, Nation> = {};
      if ((nationResult as any).success) {
        const stats = (nationResult as any).stats || [];
        stats.forEach((n: any) => {
          nationMap[n.nation] = {
            nation: n.nation,
            name: n.name,
            color: n.color,
          };
        });
        setNations(stats);
      }
      
      // 외교 정보 처리
      if (dipResult.result && dipResult.diplomacyList) {
        const enrichedList = dipResult.diplomacyList.map((dip: any) => ({
          ...dip,
          srcNationName: nationMap[dip.srcNationId]?.name || '알 수 없음',
          destNationName: nationMap[dip.destNationId]?.name || '알 수 없음',
          srcNationColor: nationMap[dip.srcNationId]?.color || '#666666',
          destNationColor: nationMap[dip.destNationId]?.color || '#666666',
        }));
        setDiplomacyList(enrichedList);
      }
    } catch (error) {
      console.error('Diplomacy data load error:', error);
    } finally {
      setLoading(false);
    }
  }, [serverID]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const filteredDiplomacy = diplomacyList.filter(d => {
    if (filterState !== '' && d.state !== filterState) return false;
    // 통상 상태(2)는 기본적으로 숨김
    if (filterState === '' && d.state === 2) return false;
    return true;
  });

  const getContrastColor = (hexColor: string): string => {
    if (!hexColor) return '#ffffff';
    const hex = hexColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5 ? '#000000' : '#ffffff';
  };

  // 국가 간 관계 매트릭스 생성
  const buildRelationMatrix = () => {
    const matrix: Record<string, DiplomacyRelation | null> = {};
    
    diplomacyList.forEach(dip => {
      const key = `${dip.srcNationId}-${dip.destNationId}`;
      const reverseKey = `${dip.destNationId}-${dip.srcNationId}`;
      matrix[key] = dip;
      matrix[reverseKey] = dip;
    });
    
    return matrix;
  };

  const relationMatrix = buildRelationMatrix();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-gray-100">
      <TopBackBar title="외 교 관 리" reloadable onReload={loadData} />
      
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* 필터 */}
        <div className="bg-slate-800/50 backdrop-blur-sm border border-white/5 rounded-xl p-4 shadow-lg">
          <div className="flex flex-wrap items-center gap-4">
            <label className="text-sm font-medium text-gray-400">외교 상태:</label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setFilterState('')}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                  filterState === ''
                    ? "bg-blue-600 text-white"
                    : "bg-slate-700/50 text-gray-400 hover:bg-slate-700"
                )}
              >
                전체 (통상 제외)
              </button>
              {Object.entries(DIPLOMACY_STATES).map(([key, val]) => (
                <button
                  key={key}
                  onClick={() => setFilterState(Number(key))}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                    filterState === Number(key)
                      ? cn(val.bg, val.color, "ring-1 ring-white/20")
                      : "bg-slate-700/50 text-gray-400 hover:bg-slate-700"
                  )}
                >
                  {val.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 외교 요약 통계 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(DIPLOMACY_STATES).map(([key, val]) => {
            const count = diplomacyList.filter(d => d.state === Number(key)).length;
            return (
              <div 
                key={key}
                className={cn(
                  "bg-slate-800/50 backdrop-blur-sm border border-white/5 rounded-xl p-4 shadow-lg",
                  val.bg
                )}
              >
                <div className="text-2xl font-bold font-mono text-white">{count}</div>
                <div className={cn("text-sm font-medium", val.color)}>{val.label}</div>
              </div>
            );
          })}
        </div>

        {/* 외교 관계 목록 */}
        {loading ? (
          <div className="flex justify-center items-center h-[40vh]">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-500 border-t-transparent"></div>
          </div>
        ) : filteredDiplomacy.length === 0 ? (
          <div className="bg-slate-800/50 backdrop-blur-sm border border-white/5 rounded-xl p-12 text-center">
            <div className="text-4xl mb-4">🤝</div>
            <p className="text-gray-400">표시할 외교 관계가 없습니다.</p>
          </div>
        ) : (
          <div className="bg-slate-800/50 backdrop-blur-sm border border-white/5 rounded-xl shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-900/50 text-gray-400 border-b border-white/5">
                    <th className="py-3 px-4 text-left">국가 1</th>
                    <th className="py-3 px-4 text-center">관계</th>
                    <th className="py-3 px-4 text-left">국가 2</th>
                    <th className="py-3 px-4 text-center">기간</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDiplomacy.map((dip, idx) => {
                    const stateInfo = DIPLOMACY_STATES[dip.state] || DIPLOMACY_STATES[2];
                    
                    return (
                      <tr 
                        key={idx}
                        className="border-b border-white/5 hover:bg-white/5 transition-colors"
                      >
                        <td className="py-3 px-4">
                          <div 
                            className="inline-block px-3 py-1 rounded-md font-medium text-xs shadow-inner"
                            style={{ 
                              backgroundColor: dip.srcNationColor,
                              color: getContrastColor(dip.srcNationColor || '#666')
                            }}
                          >
                            {dip.srcNationName}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <span className="text-gray-500">↔</span>
                            <span className={cn(
                              "px-2 py-0.5 rounded text-xs font-medium",
                              stateInfo.bg,
                              stateInfo.color
                            )}>
                              {stateInfo.label}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div 
                            className="inline-block px-3 py-1 rounded-md font-medium text-xs shadow-inner"
                            style={{ 
                              backgroundColor: dip.destNationColor,
                              color: getContrastColor(dip.destNationColor || '#666')
                            }}
                          >
                            {dip.destNationName}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="font-mono text-gray-400">
                            {dip.term ? `${dip.term}개월` : '-'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 외교 관계 매트릭스 (국가가 있을 경우) */}
        {nations.length > 0 && nations.length <= 12 && (
          <div className="bg-slate-800/50 backdrop-blur-sm border border-white/5 rounded-xl p-6 shadow-lg">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <span className="text-2xl">🗺️</span>
              국가 간 외교 관계 매트릭스
            </h3>
            <div className="overflow-x-auto">
              <table className="text-xs">
                <thead>
                  <tr>
                    <th className="p-2"></th>
                    {nations.map(n => (
                      <th 
                        key={n.nation} 
                        className="p-2 text-center"
                        style={{ minWidth: '60px' }}
                      >
                        <div 
                          className="px-2 py-1 rounded text-[10px] font-medium"
                          style={{ 
                            backgroundColor: n.color,
                            color: getContrastColor(n.color)
                          }}
                        >
                          {n.name.slice(0, 3)}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {nations.map(row => (
                    <tr key={row.nation}>
                      <td className="p-2">
                        <div 
                          className="px-2 py-1 rounded text-[10px] font-medium text-center"
                          style={{ 
                            backgroundColor: row.color,
                            color: getContrastColor(row.color)
                          }}
                        >
                          {row.name.slice(0, 3)}
                        </div>
                      </td>
                      {nations.map(col => {
                        if (row.nation === col.nation) {
                          return (
                            <td key={col.nation} className="p-2 text-center">
                              <span className="text-gray-600">-</span>
                            </td>
                          );
                        }
                        
                        const relation = relationMatrix[`${row.nation}-${col.nation}`];
                        const stateInfo = relation 
                          ? DIPLOMACY_STATES[relation.state] || DIPLOMACY_STATES[2]
                          : DIPLOMACY_STATES[2];
                        
                        return (
                          <td key={col.nation} className="p-2 text-center">
                            <span 
                              className={cn(
                                "px-1.5 py-0.5 rounded text-[10px] font-medium",
                                stateInfo.bg,
                                stateInfo.color
                              )}
                              title={relation ? `${stateInfo.label} (${relation.term || 0}개월)` : '통상'}
                            >
                              {stateInfo.label.slice(0, 2)}
                            </span>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-gray-500 mt-3">
              * 매트릭스는 각 국가 간의 현재 외교 상태를 나타냅니다.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
