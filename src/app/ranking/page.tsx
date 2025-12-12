'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { SammoAPI } from '@/lib/api/sammo';
import { cn } from '@/lib/utils';
import { FilterPanel, FilterTabs, FilterSelect } from '@/components/common/FilterPanel';
import { RankingTable, RankBadge, StatBar, Pagination, Column } from '@/components/ranking/RankingTable';
import type { GeneralRankingEntry, NationRankingEntry } from '@/types/ranking';

const TAB_OPTIONS = [
  { value: 'generals', label: '장수 랭킹' },
  { value: 'nations', label: '국가 랭킹' },
];

const GENERAL_SORT_OPTIONS = [
  { value: 'score', label: '종합 점수' },
  { value: 'power', label: '무력' },
  { value: 'intellect', label: '지력' },
  { value: 'leadership', label: '통솔' },
  { value: 'experience', label: '경험치' },
  { value: 'kills', label: '처치 수' },
  { value: 'warWins', label: '전쟁 승리' },
];

const NATION_SORT_OPTIONS = [
  { value: 'score', label: '종합 점수' },
  { value: 'power', label: '국력' },
  { value: 'territory', label: '영토' },
  { value: 'generalCount', label: '장수 수' },
  { value: 'population', label: '인구' },
  { value: 'warWins', label: '전쟁 승리' },
];

const PAGE_SIZE_OPTIONS = [
  { value: '10', label: '10개' },
  { value: '20', label: '20개' },
  { value: '50', label: '50개' },
];

// 장수 테이블 컬럼 정의
function getGeneralColumns(): Column<GeneralRankingEntry>[] {
  return [
    {
      key: 'rank',
      label: '순위',
      width: '80px',
      render: (item) => <RankBadge rank={item.rank} />,
    },
    {
      key: 'name',
      label: '장수',
      render: (item) => (
        <div className="flex flex-col">
          <div className="font-bold text-white flex items-center gap-2">
            {item.name}
            {item.npc && (
              <span className="text-[10px] bg-gray-700 px-1.5 py-0.5 rounded text-gray-400">NPC</span>
            )}
          </div>
          {item.nationName && (
            <span 
              className="text-xs"
              style={{ color: item.nationColor || '#60a5fa' }}
            >
              {item.nationName}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'stats',
      label: '능력치',
      render: (item) => (
        <div className="w-32 space-y-1">
          <StatBar value={item.leadership} label="통" color="green" />
          <StatBar value={item.power} label="무" color="red" />
          <StatBar value={item.intellect} label="지" color="blue" />
        </div>
      ),
    },
    {
      key: 'experience',
      label: '경험치',
      align: 'right',
      sortable: true,
      render: (item) => (
        <span className="font-mono text-purple-400">{item.experience?.toLocaleString() || 0}</span>
      ),
    },
    {
      key: 'kills',
      label: '처치',
      align: 'right',
      sortable: true,
      render: (item) => (
        <span className="font-mono text-red-400">{item.kills?.toLocaleString() || 0}</span>
      ),
    },
    {
      key: 'warRecord',
      label: '전적',
      align: 'right',
      render: (item) => (
        <span className="text-sm">
          <span className="text-green-400">{item.warWins || 0}</span>
          <span className="text-gray-600"> / </span>
          <span className="text-red-400">{item.warLosses || 0}</span>
        </span>
      ),
    },
    {
      key: 'score',
      label: '점수',
      align: 'right',
      sortable: true,
      render: (item) => (
        <span className="font-mono font-bold text-yellow-400 text-lg">
          {item.score?.toLocaleString() || 0}
        </span>
      ),
    },
  ];
}

// 국가 테이블 컬럼 정의
function getNationColumns(): Column<NationRankingEntry>[] {
  return [
    {
      key: 'rank',
      label: '순위',
      width: '80px',
      render: (item) => <RankBadge rank={item.rank} />,
    },
    {
      key: 'name',
      label: '국가',
      render: (item) => (
        <div className="flex flex-col">
          <div 
            className="font-bold text-lg"
            style={{ color: item.color || '#ffffff' }}
          >
            {item.name}
          </div>
          {item.rulerName && (
            <span className="text-xs text-gray-400">
              군주: {item.rulerName}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'power',
      label: '국력',
      align: 'right',
      sortable: true,
      render: (item) => (
        <span className="font-mono text-orange-400">{item.power?.toLocaleString() || 0}</span>
      ),
    },
    {
      key: 'territory',
      label: '영토',
      align: 'right',
      sortable: true,
      render: (item) => (
        <span className="font-mono text-green-400">{item.territory || 0}</span>
      ),
    },
    {
      key: 'generalCount',
      label: '장수',
      align: 'right',
      sortable: true,
      render: (item) => (
        <span className="font-mono text-blue-400">{item.generalCount || 0}</span>
      ),
    },
    {
      key: 'population',
      label: '인구',
      align: 'right',
      sortable: true,
      render: (item) => (
        <span className="font-mono text-purple-400">{item.population?.toLocaleString() || 0}</span>
      ),
    },
    {
      key: 'resources',
      label: '금 / 병량',
      align: 'right',
      render: (item) => (
        <div className="text-sm">
          <span className="text-yellow-400">{(item.gold || 0).toLocaleString()}</span>
          <span className="text-gray-600"> / </span>
          <span className="text-amber-600">{(item.rice || 0).toLocaleString()}</span>
        </div>
      ),
    },
    {
      key: 'warRecord',
      label: '전적',
      align: 'right',
      render: (item) => (
        <span className="text-sm">
          <span className="text-green-400">{item.warWins || 0}</span>
          <span className="text-gray-600"> / </span>
          <span className="text-red-400">{item.warLosses || 0}</span>
        </span>
      ),
    },
    {
      key: 'score',
      label: '점수',
      align: 'right',
      sortable: true,
      render: (item) => (
        <span className="font-mono font-bold text-yellow-400 text-lg">
          {item.score?.toLocaleString() || 0}
        </span>
      ),
    },
  ];
}

function RankingPageContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // URL 파라미터 읽기
  const tab = (searchParams?.get('tab') as 'generals' | 'nations') || 'generals';
  const sort = searchParams?.get('sort') || 'score';
  const direction = (searchParams?.get('direction') as 'asc' | 'desc') || 'desc';
  const page = Number(searchParams?.get('page')) || 1;
  const limit = Number(searchParams?.get('limit')) || 20;

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<GeneralRankingEntry[] | NationRankingEntry[]>([]);
  const [total, setTotal] = useState(0);

  // URL 파라미터 업데이트
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

  // 데이터 로드
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      
      if (tab === 'generals') {
        const result = await SammoAPI.GetGeneralRanking({ page, limit, sort, direction });
        if (result.result) {
          setData(result.data || []);
          setTotal(result.total || 0);
        }
      } else {
        const result = await SammoAPI.GetNationRanking({ page, limit, sort, direction });
        if (result.result) {
          setData(result.data || []);
          setTotal(result.total || 0);
        }
      }
    } catch (err) {
      console.error('랭킹 데이터 로드 실패:', err);
      setData([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [tab, page, limit, sort, direction]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // 탭 변경 시 필터 초기화
  const handleTabChange = (newTab: string) => {
    updateParams({
      tab: newTab === 'generals' ? undefined : newTab,
      sort: undefined,
      direction: undefined,
      page: undefined,
    });
  };

  // 정렬 변경
  const handleSortChange = (field: string) => {
    const newDirection = sort === field && direction === 'desc' ? 'asc' : 'desc';
    updateParams({ sort: field, direction: newDirection, page: undefined });
  };

  // 페이지 변경
  const handlePageChange = (newPage: number) => {
    updateParams({ page: newPage === 1 ? undefined : String(newPage) });
  };

  const sortOptions = tab === 'generals' ? GENERAL_SORT_OPTIONS : NATION_SORT_OPTIONS;

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      {/* 헤더 배경 그라데이션 */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-900/20 via-purple-900/10 to-transparent" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px]" />
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[120px]" />
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 pt-12 pb-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-black text-white mb-2 tracking-tight">
              🏆 랭킹
            </h1>
            <p className="text-gray-400">역대 최고의 장수와 국가를 확인하세요</p>
          </div>

          {/* 탭 필터 */}
          <FilterPanel className="justify-center bg-gray-900/70 backdrop-blur-md">
            <FilterTabs
              value={tab}
              options={TAB_OPTIONS}
              onChange={handleTabChange}
            />
          </FilterPanel>
        </div>
      </div>

      {/* 메인 컨텐츠 */}
      <div className="max-w-7xl mx-auto px-4 pb-12">
        {/* 정렬 & 페이지 크기 */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <FilterSelect
              label="정렬"
              value={sort}
              options={sortOptions}
              onChange={(v) => updateParams({ sort: v, page: undefined })}
            />
            <button
              onClick={() => updateParams({ direction: direction === 'desc' ? 'asc' : 'desc' })}
              className={cn(
                'px-3 py-2 rounded-lg border border-white/10 text-sm transition-colors',
                'hover:bg-white/5 hover:border-white/20'
              )}
            >
              {direction === 'desc' ? '높은순 ↓' : '낮은순 ↑'}
            </button>
          </div>
          
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-400">
              총 <span className="text-white font-bold">{total.toLocaleString()}</span>개
            </span>
            <FilterSelect
              label="표시"
              value={String(limit)}
              options={PAGE_SIZE_OPTIONS}
              onChange={(v) => updateParams({ limit: v === '20' ? undefined : v, page: undefined })}
            />
          </div>
        </div>

        {/* 테이블 */}
        <div className="bg-gray-900/50 backdrop-blur-sm border border-white/5 rounded-2xl overflow-hidden shadow-xl">
          {tab === 'generals' ? (
            <RankingTable<GeneralRankingEntry>
              columns={getGeneralColumns()}
              data={data as GeneralRankingEntry[]}
              loading={loading}
              sortField={sort}
              sortDirection={direction}
              onSort={handleSortChange}
              keyExtractor={(item) => item.generalId}
              emptyMessage="장수 랭킹 데이터가 없습니다."
              rowClassName={(_, idx) => idx < 3 ? 'bg-yellow-500/5' : ''}
            />
          ) : (
            <RankingTable<NationRankingEntry>
              columns={getNationColumns()}
              data={data as NationRankingEntry[]}
              loading={loading}
              sortField={sort}
              sortDirection={direction}
              onSort={handleSortChange}
              keyExtractor={(item) => item.nationId}
              emptyMessage="국가 랭킹 데이터가 없습니다."
              rowClassName={(_, idx) => idx < 3 ? 'bg-yellow-500/5' : ''}
            />
          )}
        </div>

        {/* 페이지네이션 */}
        <Pagination
          page={page}
          total={total}
          limit={limit}
          onPageChange={handlePageChange}
        />
      </div>
    </div>
  );
}

export default function RankingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-950 flex justify-center items-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500" />
        </div>
      }
    >
      <RankingPageContent />
    </Suspense>
  );
}








