'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { SammoAPI } from '@/lib/api/sammo';
import TopBackBar from '@/components/common/TopBackBar';
import { cn } from '@/lib/utils';

interface NationStat {
  nation: number;
  name: string;
  color: string;
  power: number;
  tech: number;
  strategic_cmd_limit: number;
  gold: number;
  rice: number;
  gennum: number;
  city_count: number;
  avg_gold: number;
  avg_rice: number;
  avg_leadership: number;
  avg_strength: number;
  avg_intel: number;
  avg_explevel: number;
  avg_dex1: number;
  avg_dex2: number;
  avg_dex3: number;
  avg_dex4: number;
  avg_dex5: number;
  total_crew: number;
  total_leadership: number;
  total_pop: number;
  total_pop_max: number;
  pop_rate: number;
  agri_rate: number;
  comm_rate: number;
  secu_rate: number;
  wall_rate: number;
  def_rate: number;
}

const SORT_OPTIONS = [
  { value: 0, label: '국력', key: 'power' },
  { value: 1, label: '장수', key: 'gennum' },
  { value: 2, label: '기술', key: 'tech' },
  { value: 3, label: '국고', key: 'gold' },
  { value: 4, label: '병량', key: 'rice' },
  { value: 5, label: '평금', key: 'avg_gold' },
  { value: 6, label: '평쌀', key: 'avg_rice' },
  { value: 7, label: '평통', key: 'avg_leadership' },
  { value: 8, label: '평무', key: 'avg_strength' },
  { value: 9, label: '평지', key: 'avg_intel' },
  { value: 10, label: '평Lv', key: 'avg_explevel' },
  { value: 13, label: '보숙', key: 'avg_dex1' },
  { value: 14, label: '궁숙', key: 'avg_dex2' },
  { value: 15, label: '기숙', key: 'avg_dex3' },
  { value: 16, label: '귀숙', key: 'avg_dex4' },
  { value: 17, label: '차숙', key: 'avg_dex5' },
];

function AdminInfoContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const serverID = params?.server as string;
  
  const sortType = searchParams?.get('sort') ? Number(searchParams.get('sort')) : 0;
  
  const [loading, setLoading] = useState(true);
  const [nationStats, setNationStats] = useState<NationStat[]>([]);
  const [selectedNation, setSelectedNation] = useState<number | null>(null);

  const loadData = useCallback(async () => {
    if (!serverID) return;
    
    try {
      setLoading(true);
      const result = await SammoAPI.AdminGetNationStats({ 
        session_id: serverID, 
        sortType 
      });
      
      if ((result as any).success && (result as any).stats) {
        setNationStats((result as any).stats);
      }
    } catch (error) {
      console.error('Nation stats load error:', error);
    } finally {
      setLoading(false);
    }
  }, [serverID, sortType]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleSortChange = (newSort: number) => {
    router.push(`/${serverID}/admin/info?sort=${newSort}`);
  };

  const getContrastColor = (hexColor: string): string => {
    if (!hexColor) return '#ffffff';
    const hex = hexColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5 ? '#000000' : '#ffffff';
  };

  const formatNumber = (num: number | undefined): string => {
    if (num === undefined || num === null) return '-';
    return num.toLocaleString();
  };

  const renderProgressBar = (value: number, max: number = 100, color: string = 'blue') => {
    const percentage = Math.min(100, Math.max(0, (value / max) * 100));
    const colorMap: Record<string, string> = {
      blue: 'bg-blue-500',
      green: 'bg-green-500',
      amber: 'bg-amber-500',
      red: 'bg-red-500',
      purple: 'bg-purple-500',
    };
    
    return (
      <div className="flex items-center gap-2">
        <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
          <div 
            className={cn("h-full rounded-full transition-all", colorMap[color] || 'bg-blue-500')}
            style={{ width: `${percentage}%` }}
          />
        </div>
        <span className="text-xs font-mono w-12 text-right">{value.toFixed(1)}%</span>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-gray-100">
      <TopBackBar title="일 제 정 보" reloadable onReload={loadData} />
      
      <div className="max-w-[1800px] mx-auto px-4 py-6 space-y-6">
        {/* 필터 섹션 */}
        <div className="bg-slate-800/50 backdrop-blur-sm border border-white/5 rounded-xl p-4 shadow-lg">
          <div className="flex flex-wrap items-center gap-4">
            <label className="text-sm font-medium text-gray-400">정렬 기준:</label>
            <div className="flex flex-wrap gap-2">
              {SORT_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleSortChange(option.value)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                    sortType === option.value
                      ? "bg-blue-600 text-white shadow-lg"
                      : "bg-slate-700/50 text-gray-400 hover:bg-slate-700 hover:text-white"
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 국가 통계 테이블 */}
        {loading ? (
          <div className="flex justify-center items-center h-[50vh]">
            <div className="flex flex-col items-center gap-4">
              <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-500 border-t-transparent"></div>
              <span className="text-gray-400">통계 로딩 중...</span>
            </div>
          </div>
        ) : nationStats.length === 0 ? (
          <div className="bg-slate-800/50 backdrop-blur-sm border border-white/5 rounded-xl p-12 text-center">
            <div className="text-4xl mb-4">📊</div>
            <p className="text-gray-400">표시할 국가 정보가 없습니다.</p>
          </div>
        ) : (
          <div className="bg-slate-800/50 backdrop-blur-sm border border-white/5 rounded-xl shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-900/50 text-gray-400 border-b border-white/5">
                    <th className="py-3 px-3 text-left sticky left-0 bg-slate-900/90 z-10">국가</th>
                    <th className="py-3 px-2 text-right">국력</th>
                    <th className="py-3 px-2 text-right">장수</th>
                    <th className="py-3 px-2 text-right">도시</th>
                    <th className="py-3 px-2 text-right">기술</th>
                    <th className="py-3 px-2 text-right">전략</th>
                    <th className="py-3 px-2 text-right">국고</th>
                    <th className="py-3 px-2 text-right">병량</th>
                    <th className="py-3 px-2 text-right">평금</th>
                    <th className="py-3 px-2 text-right">평쌀</th>
                    <th className="py-3 px-2 text-right">평통</th>
                    <th className="py-3 px-2 text-right">평무</th>
                    <th className="py-3 px-2 text-right">평지</th>
                    <th className="py-3 px-2 text-right">평Lv</th>
                    <th className="py-3 px-2 text-right">보숙</th>
                    <th className="py-3 px-2 text-right">궁숙</th>
                    <th className="py-3 px-2 text-right">기숙</th>
                    <th className="py-3 px-2 text-right">귀숙</th>
                    <th className="py-3 px-2 text-right">차숙</th>
                    <th className="py-3 px-2 text-right">총병</th>
                    <th className="py-3 px-2 text-center">인구</th>
                  </tr>
                </thead>
                <tbody>
                  {nationStats.map((nation, idx) => (
                    <tr 
                      key={nation.nation}
                      onClick={() => setSelectedNation(selectedNation === nation.nation ? null : nation.nation)}
                      className={cn(
                        "border-b border-white/5 cursor-pointer transition-colors",
                        selectedNation === nation.nation 
                          ? "bg-blue-900/30" 
                          : "hover:bg-white/5"
                      )}
                    >
                      <td className="py-3 px-3 sticky left-0 bg-slate-800/90 z-10">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500 font-mono w-5">{idx + 1}</span>
                          <div 
                            className="px-3 py-1 rounded-md font-medium text-xs shadow-inner"
                            style={{ 
                              backgroundColor: nation.color || '#666',
                              color: getContrastColor(nation.color)
                            }}
                          >
                            {nation.name}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-2 text-right font-mono text-yellow-400 font-bold">
                        {formatNumber(nation.power)}
                      </td>
                      <td className="py-3 px-2 text-right font-mono">{nation.gennum}</td>
                      <td className="py-3 px-2 text-right font-mono">{nation.city_count}</td>
                      <td className="py-3 px-2 text-right font-mono text-cyan-400">
                        {nation.tech?.toFixed(1)}
                      </td>
                      <td className="py-3 px-2 text-right font-mono">{nation.strategic_cmd_limit}</td>
                      <td className="py-3 px-2 text-right font-mono text-amber-400">
                        {formatNumber(nation.gold)}
                      </td>
                      <td className="py-3 px-2 text-right font-mono text-green-400">
                        {formatNumber(nation.rice)}
                      </td>
                      <td className="py-3 px-2 text-right font-mono text-amber-300">
                        {formatNumber(nation.avg_gold)}
                      </td>
                      <td className="py-3 px-2 text-right font-mono text-green-300">
                        {formatNumber(nation.avg_rice)}
                      </td>
                      <td className="py-3 px-2 text-right font-mono">{nation.avg_leadership}</td>
                      <td className="py-3 px-2 text-right font-mono">{nation.avg_strength}</td>
                      <td className="py-3 px-2 text-right font-mono">{nation.avg_intel}</td>
                      <td className="py-3 px-2 text-right font-mono">{nation.avg_explevel}</td>
                      <td className="py-3 px-2 text-right font-mono text-blue-300">
                        {formatNumber(nation.avg_dex1)}
                      </td>
                      <td className="py-3 px-2 text-right font-mono text-red-300">
                        {formatNumber(nation.avg_dex2)}
                      </td>
                      <td className="py-3 px-2 text-right font-mono text-orange-300">
                        {formatNumber(nation.avg_dex3)}
                      </td>
                      <td className="py-3 px-2 text-right font-mono text-purple-300">
                        {formatNumber(nation.avg_dex4)}
                      </td>
                      <td className="py-3 px-2 text-right font-mono text-teal-300">
                        {formatNumber(nation.avg_dex5)}
                      </td>
                      <td className="py-3 px-2 text-right font-mono text-pink-400">
                        {formatNumber(nation.total_crew)}/{nation.total_leadership}00
                      </td>
                      <td className="py-3 px-2 text-center">
                        <div className="text-xs">
                          <span className="font-mono">{formatNumber(nation.total_pop)}</span>
                          <span className="text-gray-500">/</span>
                          <span className="font-mono text-gray-400">{formatNumber(nation.total_pop_max)}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 선택된 국가 상세 정보 */}
        {selectedNation !== null && (
          <div className="bg-slate-800/50 backdrop-blur-sm border border-white/5 rounded-xl p-6 shadow-lg">
            {(() => {
              const nation = nationStats.find(n => n.nation === selectedNation);
              if (!nation) return null;
              
              return (
                <>
                  <div className="flex items-center gap-3 mb-6">
                    <div 
                      className="px-4 py-2 rounded-lg font-bold shadow-lg"
                      style={{ 
                        backgroundColor: nation.color || '#666',
                        color: getContrastColor(nation.color)
                      }}
                    >
                      {nation.name}
                    </div>
                    <span className="text-gray-400">상세 정보</span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* 도시 시설 현황 */}
                    <div className="space-y-3">
                      <h4 className="text-sm font-bold text-gray-400 mb-3">🏙️ 도시 시설 현황</h4>
                      <div className="space-y-2">
                        <div>
                          <div className="flex justify-between text-xs text-gray-400 mb-1">
                            <span>인구</span>
                            <span>{nation.pop_rate}%</span>
                          </div>
                          {renderProgressBar(nation.pop_rate, 100, 'blue')}
                        </div>
                        <div>
                          <div className="flex justify-between text-xs text-gray-400 mb-1">
                            <span>농업</span>
                            <span>{nation.agri_rate}%</span>
                          </div>
                          {renderProgressBar(nation.agri_rate, 100, 'green')}
                        </div>
                        <div>
                          <div className="flex justify-between text-xs text-gray-400 mb-1">
                            <span>상업</span>
                            <span>{nation.comm_rate}%</span>
                          </div>
                          {renderProgressBar(nation.comm_rate, 100, 'amber')}
                        </div>
                        <div>
                          <div className="flex justify-between text-xs text-gray-400 mb-1">
                            <span>치안</span>
                            <span>{nation.secu_rate}%</span>
                          </div>
                          {renderProgressBar(nation.secu_rate, 100, 'purple')}
                        </div>
                        <div>
                          <div className="flex justify-between text-xs text-gray-400 mb-1">
                            <span>성벽</span>
                            <span>{nation.wall_rate}%</span>
                          </div>
                          {renderProgressBar(nation.wall_rate, 100, 'red')}
                        </div>
                        <div>
                          <div className="flex justify-between text-xs text-gray-400 mb-1">
                            <span>수비</span>
                            <span>{nation.def_rate}%</span>
                          </div>
                          {renderProgressBar(nation.def_rate, 100, 'blue')}
                        </div>
                      </div>
                    </div>

                    {/* 자원 현황 */}
                    <div className="space-y-3">
                      <h4 className="text-sm font-bold text-gray-400 mb-3">💰 자원 현황</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-700/30 rounded-lg p-3 text-center">
                          <div className="text-xs text-gray-500 mb-1">국고</div>
                          <div className="text-lg font-mono text-amber-400">{formatNumber(nation.gold)}</div>
                        </div>
                        <div className="bg-slate-700/30 rounded-lg p-3 text-center">
                          <div className="text-xs text-gray-500 mb-1">병량</div>
                          <div className="text-lg font-mono text-green-400">{formatNumber(nation.rice)}</div>
                        </div>
                        <div className="bg-slate-700/30 rounded-lg p-3 text-center">
                          <div className="text-xs text-gray-500 mb-1">평균 금</div>
                          <div className="text-lg font-mono text-amber-300">{formatNumber(nation.avg_gold)}</div>
                        </div>
                        <div className="bg-slate-700/30 rounded-lg p-3 text-center">
                          <div className="text-xs text-gray-500 mb-1">평균 쌀</div>
                          <div className="text-lg font-mono text-green-300">{formatNumber(nation.avg_rice)}</div>
                        </div>
                      </div>
                    </div>

                    {/* 평균 능력치 */}
                    <div className="space-y-3">
                      <h4 className="text-sm font-bold text-gray-400 mb-3">📊 평균 능력치</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-700/30 rounded-lg p-3 text-center">
                          <div className="text-xs text-gray-500 mb-1">통솔</div>
                          <div className="text-lg font-mono text-red-400">{nation.avg_leadership}</div>
                        </div>
                        <div className="bg-slate-700/30 rounded-lg p-3 text-center">
                          <div className="text-xs text-gray-500 mb-1">무력</div>
                          <div className="text-lg font-mono text-orange-400">{nation.avg_strength}</div>
                        </div>
                        <div className="bg-slate-700/30 rounded-lg p-3 text-center">
                          <div className="text-xs text-gray-500 mb-1">지력</div>
                          <div className="text-lg font-mono text-blue-400">{nation.avg_intel}</div>
                        </div>
                        <div className="bg-slate-700/30 rounded-lg p-3 text-center">
                          <div className="text-xs text-gray-500 mb-1">경험</div>
                          <div className="text-lg font-mono text-purple-400">{nation.avg_explevel}</div>
                        </div>
                      </div>
                    </div>

                    {/* 병종 숙련도 */}
                    <div className="space-y-3">
                      <h4 className="text-sm font-bold text-gray-400 mb-3">⚔️ 평균 숙련도</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center bg-slate-700/30 rounded-lg px-3 py-2">
                          <span className="text-xs text-gray-400">보병</span>
                          <span className="font-mono text-blue-300">{formatNumber(nation.avg_dex1)}</span>
                        </div>
                        <div className="flex justify-between items-center bg-slate-700/30 rounded-lg px-3 py-2">
                          <span className="text-xs text-gray-400">궁병</span>
                          <span className="font-mono text-red-300">{formatNumber(nation.avg_dex2)}</span>
                        </div>
                        <div className="flex justify-between items-center bg-slate-700/30 rounded-lg px-3 py-2">
                          <span className="text-xs text-gray-400">기병</span>
                          <span className="font-mono text-orange-300">{formatNumber(nation.avg_dex3)}</span>
                        </div>
                        <div className="flex justify-between items-center bg-slate-700/30 rounded-lg px-3 py-2">
                          <span className="text-xs text-gray-400">귀병</span>
                          <span className="font-mono text-purple-300">{formatNumber(nation.avg_dex4)}</span>
                        </div>
                        <div className="flex justify-between items-center bg-slate-700/30 rounded-lg px-3 py-2">
                          <span className="text-xs text-gray-400">차병</span>
                          <span className="font-mono text-teal-300">{formatNumber(nation.avg_dex5)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminInfoPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex justify-center items-center">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-500 border-t-transparent"></div>
      </div>
    }>
      <AdminInfoContent />
    </Suspense>
  );
}
