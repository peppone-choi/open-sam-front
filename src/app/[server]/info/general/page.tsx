'use client';

import React, { useState, useEffect, Suspense, useMemo, useCallback } from 'react';
import { useParams, useSearchParams, useRouter, usePathname } from 'next/navigation';
import { SammoAPI } from '@/lib/api/sammo';
import TopBackBar from '@/components/common/TopBackBar';
import { FilterPanel, FilterSelect, FilterInput, FilterButton } from '@/components/common/FilterPanel';
import { useToast } from '@/contexts/ToastContext';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface GeneralData {
  no: number;
  name: string;
  nationID?: number;
  nationName?: string;
  nationColor?: string;
  officerLevel?: number;
  officerLevelText?: string;
  leadership?: number;
  strength?: number;
  intel?: number;
  explevel?: number;
  npc?: number;
  picture?: string;
  imgsvr?: number;
  [key: string]: any;
}

const SORT_OPTIONS = [
  { value: 'name', label: '이름순' },
  { value: 'leadership', label: '통솔순' },
  { value: 'strength', label: '무력순' },
  { value: 'intel', label: '지력순' },
  { value: 'explevel', label: '레벨순' },
  { value: 'nation', label: '국가순' },
];

const TYPE_OPTIONS = [
  { value: '0', label: '전체' },
  { value: '1', label: '유저' },
  { value: '2', label: 'NPC' },
];

function GeneralInfoContent() {
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const serverID = params?.server as string;
  const { showToast } = useToast();

  // URL 쿼리 파라미터에서 값 읽기
  const sortBy = searchParams?.get('sort') || 'name';
  const filterType = searchParams?.get('type') || '0';
  const searchQuery = searchParams?.get('q') || '';

  const [loading, setLoading] = useState(true);
  const [generalList, setGeneralList] = useState<GeneralData[]>([]);
  const [localSearch, setLocalSearch] = useState(searchQuery);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 24;

  // URL 파라미터 업데이트 함수
  const updateParams = useCallback(
    (updates: Record<string, string | undefined>) => {
      const params = new URLSearchParams(searchParams?.toString() || '');
      Object.entries(updates).forEach(([key, value]) => {
        if (value === undefined || value === '' || value === '0' || (key === 'sort' && value === 'name')) {
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
    loadGeneralList();
  }, [serverID]);

  useEffect(() => {
    setPage(1);
  }, [sortBy, filterType, searchQuery]);

  async function loadGeneralList() {
    try {
      setLoading(true);
      // 전체 장수 목록을 가져오는 API 호출
      const result = await SammoAPI.GlobalGeneralList({ token: serverID });
      if (result.result && result.generalList) {
        setGeneralList(result.generalList);
      }
    } catch (err) {
      console.error(err);
      showToast('장수 목록을 불러오는데 실패했습니다.', 'error');
    } finally {
      setLoading(false);
    }
  }

  // 필터링 및 정렬
  const filteredGenerals = useMemo(() => {
    let filtered = [...generalList];

    // 타입 필터
    if (filterType === '1') {
      filtered = filtered.filter((g) => !g.npc || g.npc === 0);
    } else if (filterType === '2') {
      filtered = filtered.filter((g) => g.npc === 1);
    }

    // 검색 필터
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (g) =>
          g.name?.toLowerCase().includes(q) ||
          g.nationName?.toLowerCase().includes(q)
      );
    }

    // 정렬
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'leadership':
          return (b.leadership || 0) - (a.leadership || 0);
        case 'strength':
          return (b.strength || 0) - (a.strength || 0);
        case 'intel':
          return (b.intel || 0) - (a.intel || 0);
        case 'explevel':
          return (b.explevel || 0) - (a.explevel || 0);
        case 'nation':
          return (a.nationName || '').localeCompare(b.nationName || '');
        case 'name':
        default:
          return (a.name || '').localeCompare(b.name || '');
      }
    });

    return filtered;
  }, [generalList, filterType, searchQuery, sortBy]);

  const paginatedGenerals = useMemo(() => {
    return filteredGenerals.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  }, [filteredGenerals, page]);

  const totalPages = Math.ceil(filteredGenerals.length / PAGE_SIZE);

  function handleSearch() {
    updateParams({ q: localSearch || undefined });
  }

  function getIconPath(imgsvr: number | undefined, picture: string | undefined): string {
    if (!picture) return '/default_portrait.png';
    if (imgsvr && imgsvr > 0) {
      return `/api/general/icon/${imgsvr}/${picture}`;
    }
    return `/image/general/${picture}.png`;
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-4 md:p-6 lg:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        <TopBackBar title="장수 목록" reloadable onReload={loadGeneralList} />

        {/* 필터 패널 */}
        <FilterPanel>
          <FilterSelect
            label="정렬"
            value={sortBy}
            options={SORT_OPTIONS}
            onChange={(v) => updateParams({ sort: v })}
          />
          <FilterSelect
            label="구분"
            value={filterType}
            options={TYPE_OPTIONS}
            onChange={(v) => updateParams({ type: v })}
          />
          <FilterInput
            placeholder="장수명 또는 국가명 검색..."
            value={localSearch}
            onChange={setLocalSearch}
            onSubmit={handleSearch}
          />
          <FilterButton onClick={handleSearch}>검색</FilterButton>
        </FilterPanel>

        {/* 결과 요약 */}
        <div className="text-sm text-gray-400">
          총 <span className="text-white font-bold">{filteredGenerals.length}</span>명의 장수
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
          <>
            {/* 장수 그리드 */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {paginatedGenerals.map((general) => (
                <Link
                  key={general.no}
                  href={`/${serverID}/info/general?generalID=${general.no}`}
                  className={cn(
                    'group flex flex-col bg-gray-900/50 backdrop-blur-sm border border-white/5 rounded-xl overflow-hidden shadow-lg',
                    'hover:border-blue-500/30 hover:-translate-y-1 transition-all duration-200'
                  )}
                >
                  {/* 초상화 */}
                  <div className="relative aspect-[3/4] overflow-hidden bg-black/20">
                    <img
                      src={getIconPath(general.imgsvr, general.picture)}
                      alt={general.name}
                      className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/default_portrait.png';
                      }}
                    />
                    {general.npc === 1 && (
                      <div className="absolute top-2 right-2 px-1.5 py-0.5 bg-gray-800/80 text-[10px] text-gray-300 rounded">
                        NPC
                      </div>
                    )}
                    {general.nationColor && (
                      <div
                        className="absolute bottom-0 left-0 right-0 h-1"
                        style={{ backgroundColor: general.nationColor }}
                      />
                    )}
                  </div>

                  {/* 정보 */}
                  <div className="p-3 flex-1">
                    <div className="font-bold text-white truncate">{general.name}</div>
                    <div className="text-xs text-gray-400 truncate">
                      {general.nationName || '재야'}
                      {general.officerLevelText && (
                        <span className="ml-1 text-gray-500">· {general.officerLevelText}</span>
                      )}
                    </div>
                    <div className="mt-2 grid grid-cols-3 gap-1 text-[10px] text-center">
                      <div className="bg-black/30 rounded p-1">
                        <div className="text-gray-500">통솔</div>
                        <div className="text-white font-bold">{general.leadership || 0}</div>
                      </div>
                      <div className="bg-black/30 rounded p-1">
                        <div className="text-gray-500">무력</div>
                        <div className="text-white font-bold">{general.strength || 0}</div>
                      </div>
                      <div className="bg-black/30 rounded p-1">
                        <div className="text-gray-500">지력</div>
                        <div className="text-white font-bold">{general.intel || 0}</div>
                      </div>
                    </div>
                    {general.explevel !== undefined && (
                      <div className="mt-2 text-xs text-center">
                        <span className="text-gray-500">Lv.</span>
                        <span className="text-green-400 font-bold">{general.explevel}</span>
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>

            {filteredGenerals.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                검색 결과가 없습니다.
              </div>
            )}

            {/* 페이지네이션 */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 py-4">
                <button
                  type="button"
                  onClick={() => setPage(1)}
                  disabled={page === 1}
                  className={cn(
                    'px-3 py-1.5 rounded border text-sm',
                    page === 1
                      ? 'border-gray-700 text-gray-600 cursor-not-allowed'
                      : 'border-gray-500 text-gray-200 hover:bg-white/10'
                  )}
                >
                  ««
                </button>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className={cn(
                    'px-3 py-1.5 rounded border text-sm',
                    page === 1
                      ? 'border-gray-700 text-gray-600 cursor-not-allowed'
                      : 'border-gray-500 text-gray-200 hover:bg-white/10'
                  )}
                >
                  «
                </button>
                <span className="px-4 py-1.5 text-sm text-gray-300">
                  {page} / {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className={cn(
                    'px-3 py-1.5 rounded border text-sm',
                    page === totalPages
                      ? 'border-gray-700 text-gray-600 cursor-not-allowed'
                      : 'border-gray-500 text-gray-200 hover:bg-white/10'
                  )}
                >
                  »
                </button>
                <button
                  type="button"
                  onClick={() => setPage(totalPages)}
                  disabled={page === totalPages}
                  className={cn(
                    'px-3 py-1.5 rounded border text-sm',
                    page === totalPages
                      ? 'border-gray-700 text-gray-600 cursor-not-allowed'
                      : 'border-gray-500 text-gray-200 hover:bg-white/10'
                  )}
                >
                  »»
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function GeneralInfoPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-950 flex justify-center items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white" />
        </div>
      }
    >
      <GeneralInfoContent />
    </Suspense>
  );
}
