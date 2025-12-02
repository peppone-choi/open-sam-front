'use client';

import React, { useState, useEffect, Suspense, useCallback } from 'react';
import { useParams, useSearchParams, useRouter, usePathname } from 'next/navigation';
import { SammoAPI } from '@/lib/api/sammo';
import TopBackBar from '@/components/common/TopBackBar';
import { FilterPanel, FilterTabs } from '@/components/common/FilterPanel';
import { useToast } from '@/contexts/ToastContext';
import { cn } from '@/lib/utils';

interface BestGeneral {
  no: number;
  name: string;
  nationName?: string;
  npc?: number;
  value?: number;
  [key: string]: any;
}

const TAB_OPTIONS = [
  { value: 'user', label: '유저 보기' },
  { value: 'npc', label: 'NPC 보기' },
];

function BestGeneralContent() {
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const serverID = params?.server as string;
  
  // URL에서 탭 상태 읽기 (btn -> tab으로 변경하여 더 직관적으로)
  const tab = searchParams?.get('tab') || 'user';
  const btn = tab === 'npc' ? 'NPC 보기' : '유저 보기';
  
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [bestGeneralList, setBestGeneralList] = useState<BestGeneral[]>([]);

  // URL 파라미터 업데이트 함수
  const updateParams = useCallback(
    (updates: Record<string, string | undefined>) => {
      const params = new URLSearchParams(searchParams?.toString() || '');
      Object.entries(updates).forEach(([key, value]) => {
        if (value === undefined || value === '' || (key === 'tab' && value === 'user')) {
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
    loadBestGeneralList();
  }, [serverID, btn]);

  async function loadBestGeneralList() {
    try {
      setLoading(true);
      const result = await SammoAPI.GetBestGeneralList({ btn });
      if (result.result) {
        setBestGeneralList(result.generalList || []);
      }
    } catch (err) {
      console.error(err);
      showToast('명장 목록을 불러오는데 실패했습니다.', 'error');
    } finally {
      setLoading(false);
    }
  }

  function getRankStyle(rank: number) {
    if (rank === 1) return 'bg-yellow-500 text-black shadow-yellow-500/50 shadow-lg';
    if (rank === 2) return 'bg-gray-400 text-black shadow-gray-400/50 shadow-lg';
    if (rank === 3) return 'bg-orange-600 text-white shadow-orange-600/50 shadow-lg';
    return 'bg-gray-800 text-gray-400';
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-4 md:p-6 lg:p-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-6">
        <TopBackBar title="명장 일람" reloadable onReload={loadBestGeneralList} />

        {/* Filter Tabs */}
        <FilterPanel className="justify-center">
          <FilterTabs
            value={tab}
            options={TAB_OPTIONS}
            onChange={(v) => updateParams({ tab: v })}
          />
        </FilterPanel>

        {/* 결과 요약 */}
        <div className="text-sm text-gray-400 text-center">
          총 <span className="text-white font-bold">{bestGeneralList.length}</span>명의{' '}
          {tab === 'npc' ? 'NPC' : '유저'} 명장
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-[50vh]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {bestGeneralList.map((general, idx) => (
              <div
                key={general.no}
                className={cn(
                  'flex items-center gap-4 p-4 bg-gray-900/50 backdrop-blur-sm border border-white/5 rounded-xl shadow-lg',
                  'hover:border-white/20 transition-all duration-200 hover:-translate-y-0.5',
                  idx < 3 ? 'border-yellow-500/30 bg-yellow-900/10' : ''
                )}
              >
                <div
                  className={cn(
                    'flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold',
                    getRankStyle(idx + 1)
                  )}
                >
                  {idx + 1}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="text-lg font-bold text-white truncate flex items-center gap-2">
                    {general.name}
                    {general.npc === 1 && (
                      <span className="text-[10px] bg-gray-700 px-1.5 py-0.5 rounded text-gray-300">
                        NPC
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-400 flex items-center gap-2 truncate">
                    <span className="text-blue-400">{general.nationName || '재야'}</span>
                    <span className="w-1 h-1 rounded-full bg-gray-600" />
                    <span className="font-mono text-yellow-400">
                      {general.value?.toLocaleString()}점
                    </span>
                  </div>
                </div>

                {/* 순위 뱃지 */}
                {idx < 3 && (
                  <div className="text-2xl">
                    {idx === 0 && '🥇'}
                    {idx === 1 && '🥈'}
                    {idx === 2 && '🥉'}
                  </div>
                )}
              </div>
            ))}

            {bestGeneralList.length === 0 && (
              <div className="col-span-full text-center py-12 text-gray-500">
                <div className="text-4xl mb-2">🏅</div>
                데이터가 없습니다.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function BestGeneralPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-950 flex justify-center items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white" />
        </div>
      }
    >
      <BestGeneralContent />
    </Suspense>
  );
}
