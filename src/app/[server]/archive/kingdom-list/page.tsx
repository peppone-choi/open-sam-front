'use client';

import React, { useState, useEffect, Suspense, useCallback, useMemo } from 'react';
import { useParams, useSearchParams, useRouter, usePathname } from 'next/navigation';
import { SammoAPI } from '@/lib/api/sammo';
import TopBackBar from '@/components/common/TopBackBar';
import { FilterPanel, FilterSelect, FilterInput } from '@/components/common/FilterPanel';
import { useToast } from '@/contexts/ToastContext';
import { cn } from '@/lib/utils';

interface Kingdom {
  nation: number;
  name: string;
  color: string;
  power?: number;
  cities?: any[];
  generals?: any[];
  [key: string]: any;
}

const SORT_OPTIONS = [
  { value: 'power', label: '국력순' },
  { value: 'name', label: '이름순' },
  { value: 'cities', label: '도시 수' },
  { value: 'generals', label: '장수 수' },
];

// Helper to determine text color based on background brightness
function getContrastColor(hexColor: string) {
  if (!hexColor || !hexColor.startsWith('#')) return '#ffffff';

  const r = parseInt(hexColor.substr(1, 2), 16);
  const g = parseInt(hexColor.substr(3, 2), 16);
  const b = parseInt(hexColor.substr(5, 2), 16);
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;

  return yiq >= 128 ? '#000000' : '#ffffff';
}

function KingdomListContent() {
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const serverID = params?.server as string;
  const { showToast } = useToast();

  // URL에서 정렬 및 검색 파라미터 읽기
  const sortBy = searchParams?.get('sort') || 'power';
  const searchQuery = searchParams?.get('q') || '';

  const [loading, setLoading] = useState(true);
  const [kingdomList, setKingdomList] = useState<Kingdom[]>([]);
  const [localSearch, setLocalSearch] = useState(searchQuery);

  // URL 파라미터 업데이트 함수
  const updateParams = useCallback(
    (updates: Record<string, string | undefined>) => {
      const params = new URLSearchParams(searchParams?.toString() || '');
      Object.entries(updates).forEach(([key, value]) => {
        if (value === undefined || value === '' || (key === 'sort' && value === 'power')) {
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
    loadKingdomList();
  }, [serverID]);

  async function loadKingdomList() {
    try {
      setLoading(true);
      const result = await SammoAPI.GetKingdomList();
      if (result.result) {
        setKingdomList(result.kingdomList || []);
      }
    } catch (err) {
      console.error(err);
      showToast('세력 목록을 불러오는데 실패했습니다.', 'error');
    } finally {
      setLoading(false);
    }
  }

  // 필터링 및 정렬
  const filteredKingdoms = useMemo(() => {
    let filtered = [...kingdomList];

    // 검색 필터
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter((k) => k.name?.toLowerCase().includes(q));
    }

    // 정렬
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return (a.name || '').localeCompare(b.name || '');
        case 'cities':
          return (b.cities?.length || 0) - (a.cities?.length || 0);
        case 'generals':
          return (b.generals?.length || 0) - (a.generals?.length || 0);
        case 'power':
        default:
          return (b.power || 0) - (a.power || 0);
      }
    });

    return filtered;
  }, [kingdomList, sortBy, searchQuery]);

  function handleSearch() {
    updateParams({ q: localSearch || undefined });
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-4 md:p-6 lg:p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        <TopBackBar title="세력 일람" reloadable onReload={loadKingdomList} />

        {/* 필터 패널 */}
        <FilterPanel>
          <FilterSelect
            label="정렬"
            value={sortBy}
            options={SORT_OPTIONS}
            onChange={(v) => updateParams({ sort: v })}
          />
          <FilterInput
            placeholder="세력명 검색..."
            value={localSearch}
            onChange={setLocalSearch}
            onSubmit={handleSearch}
          />
        </FilterPanel>

        {/* 결과 요약 */}
        <div className="text-sm text-gray-400">
          총 <span className="text-white font-bold">{filteredKingdoms.length}</span>개 세력
          {searchQuery && (
            <span className="ml-2">
              &quot;<span className="text-blue-400">{searchQuery}</span>&quot; 검색 결과
            </span>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-[50vh]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredKingdoms.map((kingdom, idx) => {
              const textColor = getContrastColor(kingdom.color);
              const isTop3 = sortBy === 'power' && idx < 3;

              return (
                <div
                  key={kingdom.nation}
                  className={cn(
                    'bg-gray-900/50 backdrop-blur-sm border border-white/5 rounded-xl overflow-hidden shadow-lg',
                    'hover:scale-105 transition-transform duration-200',
                    isTop3 && 'ring-2 ring-yellow-500/50'
                  )}
                >
                  <div
                    className="py-4 px-6 text-center font-bold text-xl shadow-sm relative"
                    style={{
                      backgroundColor: kingdom.color,
                      color: textColor,
                    }}
                  >
                    {kingdom.name}
                    {isTop3 && (
                      <span className="absolute top-2 right-2 text-lg">
                        {idx === 0 && '🥇'}
                        {idx === 1 && '🥈'}
                        {idx === 2 && '🥉'}
                      </span>
                    )}
                  </div>
                  <div className="p-6 space-y-3">
                    <div className="flex justify-between items-center border-b border-white/5 pb-2">
                      <span className="text-gray-400 text-sm">국력</span>
                      <span className="font-mono font-bold text-yellow-500">
                        {kingdom.power?.toLocaleString() || 0}
                      </span>
                    </div>
                    <div className="flex justify-between items-center border-b border-white/5 pb-2">
                      <span className="text-gray-400 text-sm">도시</span>
                      <span className="font-mono text-white">{kingdom.cities?.length || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400 text-sm">장수</span>
                      <span className="font-mono text-white">{kingdom.generals?.length || 0}</span>
                    </div>
                  </div>
                </div>
              );
            })}

            {filteredKingdoms.length === 0 && (
              <div className="col-span-full text-center py-12 text-gray-500">
                <div className="text-4xl mb-2">🚩</div>
                {searchQuery ? '검색 결과가 없습니다.' : '활성화된 세력이 없습니다.'}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function KingdomListPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-950 flex justify-center items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white" />
        </div>
      }
    >
      <KingdomListContent />
    </Suspense>
  );
}
