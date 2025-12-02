'use client';

import React, { useState, useEffect, Suspense, useCallback } from 'react';
import { useParams, useSearchParams, useRouter, usePathname } from 'next/navigation';
import { SammoAPI } from '@/lib/api/sammo';
import TopBackBar from '@/components/common/TopBackBar';
import { FilterPanel, FilterSelect } from '@/components/common/FilterPanel';
import { useToast } from '@/contexts/ToastContext';
import { cn } from '@/lib/utils';

interface HallOfFameEntry {
  rank?: number;
  name: string;
  nationName?: string;
  value?: number;
  valueName?: string;
  category?: string;
  [key: string]: any;
}

interface HallOfFameData {
  king?: HallOfFameEntry[];
  unifier?: HallOfFameEntry[];
  topGeneral?: HallOfFameEntry[];
  topNation?: HallOfFameEntry[];
  records?: HallOfFameEntry[];
  [key: string]: any;
}

interface ScenarioOption {
  season: number;
  scenario: number;
  name: string;
  cnt: number;
}

function HallOfFameContent() {
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const serverID = params?.server as string;
  
  const seasonIdx = searchParams?.get('seasonIdx') ? Number(searchParams.get('seasonIdx')) : undefined;
  const scenarioIdx = searchParams?.get('scenarioIdx') ? Number(searchParams.get('scenarioIdx')) : undefined;
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [scenarioList, setScenarioList] = useState<ScenarioOption[]>([]);
  const [hallOfFameData, setHallOfFameData] = useState<HallOfFameData | null>(null);

  // URL 파라미터 업데이트 함수
  const updateParams = useCallback(
    (updates: Record<string, string | undefined>) => {
      const params = new URLSearchParams(searchParams?.toString() || '');
      Object.entries(updates).forEach(([key, value]) => {
        if (value === undefined || value === '') {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      });
      const queryString = params.toString();
      const newUrl = queryString ? `${pathname}?${queryString}` : pathname;
      router.push(newUrl, { scroll: false });
    },
    [router, pathname, searchParams]
  );

  useEffect(() => {
    loadData();
  }, [seasonIdx, scenarioIdx]);

  async function loadData() {
    try {
      setLoading(true);
      const result = await SammoAPI.GetHallOfFame({
        seasonIdx: seasonIdx || undefined,
        scenarioIdx: scenarioIdx || undefined,
      });

      if (result.result) {
        setScenarioList(result.scenarioList || []);
        setHallOfFameData(result.hallOfFame || null);
      }
    } catch (err) {
      console.error(err);
      showToast('명예의 전당 정보를 불러오는데 실패했습니다.', 'error');
    } finally {
      setLoading(false);
    }
  }

  const scenarioOptions = scenarioList.map((s) => ({
    value: `${s.season}_${s.scenario}`,
    label: `${s.name} (${s.cnt}회)`,
  }));

  function handleScenarioChange(value: string) {
    const [s, sc] = value.split('_');
    updateParams({
      seasonIdx: s || undefined,
      scenarioIdx: sc || undefined,
    });
  }

  // 랭크별 스타일
  function getRankStyle(rank: number) {
    if (rank === 1) return 'bg-yellow-500 text-black shadow-yellow-500/50 shadow-lg';
    if (rank === 2) return 'bg-gray-400 text-black shadow-gray-400/50 shadow-lg';
    if (rank === 3) return 'bg-orange-600 text-white shadow-orange-600/50 shadow-lg';
    return 'bg-gray-800 text-gray-400';
  }

  // 데이터 렌더링 함수
  function renderRankList(title: string, icon: string, entries: HallOfFameEntry[] | undefined) {
    if (!entries || entries.length === 0) return null;

    return (
      <div className="bg-gray-900/50 backdrop-blur-sm border border-white/5 rounded-xl p-6 shadow-lg">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <span className="text-2xl">{icon}</span>
          {title}
        </h3>
        <div className="space-y-2">
          {entries.map((entry, idx) => {
            const rank = entry.rank ?? idx + 1;
            return (
              <div
                key={`${entry.name}-${idx}`}
                className={cn(
                  'flex items-center gap-4 p-3 rounded-lg border border-white/5 transition-colors',
                  rank <= 3 ? 'bg-white/5' : 'hover:bg-white/5'
                )}
              >
                <div
                  className={cn(
                    'flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold',
                    getRankStyle(rank)
                  )}
                >
                  {rank}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-white truncate">{entry.name}</div>
                  {entry.nationName && (
                    <div className="text-sm text-blue-400 truncate">{entry.nationName}</div>
                  )}
                </div>
                {entry.value !== undefined && (
                  <div className="text-right">
                    <div className="font-mono font-bold text-yellow-400">
                      {entry.value.toLocaleString()}
                    </div>
                    {entry.valueName && (
                      <div className="text-xs text-gray-500">{entry.valueName}</div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // 일반 기록 테이블 렌더링
  function renderRecordsTable(records: HallOfFameEntry[] | undefined) {
    if (!records || records.length === 0) return null;

    return (
      <div className="bg-gray-900/50 backdrop-blur-sm border border-white/5 rounded-xl overflow-hidden shadow-lg">
        <div className="p-4 border-b border-white/5">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <span className="text-2xl">📊</span>
            기록 현황
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-800/50 text-gray-300 border-b border-white/5">
                <th className="py-3 px-4 text-left">순위</th>
                <th className="py-3 px-4 text-left">이름</th>
                <th className="py-3 px-4 text-left">국가</th>
                <th className="py-3 px-4 text-left">분류</th>
                <th className="py-3 px-4 text-right">기록</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {records.map((entry, idx) => (
                <tr key={`${entry.name}-${idx}`} className="hover:bg-white/5 transition-colors">
                  <td className="py-3 px-4">
                    <span
                      className={cn(
                        'inline-flex w-8 h-8 items-center justify-center rounded-full text-sm font-bold',
                        getRankStyle(entry.rank ?? idx + 1)
                      )}
                    >
                      {entry.rank ?? idx + 1}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-bold text-white">{entry.name}</td>
                  <td className="py-3 px-4 text-blue-400">{entry.nationName || '-'}</td>
                  <td className="py-3 px-4 text-gray-400">{entry.category || '-'}</td>
                  <td className="py-3 px-4 text-right font-mono text-yellow-400">
                    {entry.value?.toLocaleString() ?? '-'}
                    {entry.valueName && (
                      <span className="text-gray-500 ml-1">{entry.valueName}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-4 md:p-6 lg:p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        <TopBackBar title="명예의 전당" reloadable onReload={loadData} />

        {loading ? (
          <div className="flex justify-center items-center h-[50vh]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white" />
          </div>
        ) : (
          <>
            {/* Filter Section */}
            {scenarioOptions.length > 0 && (
              <FilterPanel>
                <FilterSelect
                  label="시나리오"
                  value={`${seasonIdx ?? ''}_${scenarioIdx ?? ''}`}
                  options={scenarioOptions}
                  onChange={handleScenarioChange}
                  className="flex-1"
                />
              </FilterPanel>
            )}

            {/* Hall of Fame Content */}
            {hallOfFameData ? (
              <div className="space-y-6">
                {/* 그리드 레이아웃으로 주요 카테고리 표시 */}
                <div className="grid gap-6 md:grid-cols-2">
                  {renderRankList('천하통일자', '👑', hallOfFameData.unifier)}
                  {renderRankList('명군', '🏆', hallOfFameData.king)}
                  {renderRankList('최강 장수', '⚔️', hallOfFameData.topGeneral)}
                  {renderRankList('최강 국가', '🏛️', hallOfFameData.topNation)}
                </div>

                {/* 일반 기록 테이블 */}
                {renderRecordsTable(hallOfFameData.records)}

                {/* 알려지지 않은 추가 데이터가 있으면 표시 */}
                {Object.entries(hallOfFameData).map(([key, value]) => {
                  if (['unifier', 'king', 'topGeneral', 'topNation', 'records'].includes(key)) {
                    return null;
                  }
                  if (Array.isArray(value) && value.length > 0) {
                    return (
                      <div key={key}>
                        {renderRankList(key, '📋', value)}
                      </div>
                    );
                  }
                  return null;
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-[40vh] text-gray-500">
                <div className="text-6xl mb-4">🏛️</div>
                <p className="text-lg">선택된 시나리오의 기록이 없습니다.</p>
                <p className="text-sm mt-2">다른 시나리오를 선택해 보세요.</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function HallOfFamePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-950 flex justify-center items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white" />
        </div>
      }
    >
      <HallOfFameContent />
    </Suspense>
  );
}
