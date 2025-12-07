'use client';

import React, { useState, useEffect, useCallback, useMemo, Suspense } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { SammoAPI } from '@/lib/api/sammo';
import { cn } from '@/lib/utils';
import { FilterPanel, FilterSelect } from '@/components/common/FilterPanel';
import { UnificationTimeline } from '@/components/ranking/UnificationTimeline';
import { Pagination } from '@/components/ranking/RankingTable';
import type { UnificationRecord } from '@/types/ranking';

const PAGE_SIZE_OPTIONS = [
  { value: '10', label: '10개' },
  { value: '20', label: '20개' },
  { value: '50', label: '50개' },
];

// 통계 카드 컴포넌트
function StatCard({ 
  icon, 
  label, 
  value, 
  subValue,
  accent = 'blue' 
}: { 
  icon: string; 
  label: string; 
  value: string | number; 
  subValue?: string;
  accent?: 'blue' | 'yellow' | 'green' | 'purple';
}) {
  const accentMap = {
    blue: 'from-blue-500/20 to-blue-600/5 border-blue-500/30',
    yellow: 'from-yellow-500/20 to-yellow-600/5 border-yellow-500/30',
    green: 'from-green-500/20 to-green-600/5 border-green-500/30',
    purple: 'from-purple-500/20 to-purple-600/5 border-purple-500/30',
  };

  return (
    <div 
      className={cn(
        'p-5 rounded-xl border backdrop-blur-sm',
        'bg-gradient-to-br',
        accentMap[accent]
      )}
    >
      <div className="flex items-start gap-3">
        <span className="text-2xl">{icon}</span>
        <div>
          <p className="text-xs text-gray-400 mb-1">{label}</p>
          <p className="text-2xl font-black text-white">{value}</p>
          {subValue && <p className="text-xs text-gray-500 mt-1">{subValue}</p>}
        </div>
      </div>
    </div>
  );
}

function HistoryPageContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // URL 파라미터 읽기
  const page = Number(searchParams?.get('page')) || 1;
  const limit = Number(searchParams?.get('limit')) || 10;

  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState<UnificationRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // 통계
  const defaultStats = useMemo(
    () => ({
      totalUnifications: 0,
      topNation: '-',
      topRuler: '-',
      avgDuration: 0,
    }),
    []
  );
  const [stats, setStats] = useState(defaultStats);

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
    const safeLimit = [10, 20, 50].includes(limit) ? limit : 10;
    try {
      setLoading(true);
      setError(null);
      setStats(defaultStats);

      const result = await SammoAPI.GetUnificationHistory({ page, limit: safeLimit });
      if (result.result && Array.isArray(result.data)) {
        const data = result.data as UnificationRecord[];
        setRecords(data);
        setTotal(result.total || data.length);

        if (data.length > 0) {
          const nationCounts: Record<string, number> = {};
          const rulerCounts: Record<string, number> = {};
          let totalDuration = 0;

          data.forEach((record: UnificationRecord) => {
            if (record.nationName) {
              nationCounts[record.nationName] = (nationCounts[record.nationName] || 0) + 1;
            }
            if (record.rulerName) {
              rulerCounts[record.rulerName] = (rulerCounts[record.rulerName] || 0) + 1;
            }
            totalDuration += record.duration || 0;
          });

          const topNation = Object.entries(nationCounts).sort((a, b) => b[1] - a[1])[0];
          const topRuler = Object.entries(rulerCounts).sort((a, b) => b[1] - a[1])[0];

          setStats({
            totalUnifications: result.total || data.length,
            topNation: topNation ? `${topNation[0]} (${topNation[1]}회)` : '-',
            topRuler: topRuler ? `${topRuler[0]} (${topRuler[1]}회)` : '-',
            avgDuration: Math.round(totalDuration / data.length),
          });
        }
      } else {
        setRecords([]);
        setTotal(0);
        setStats(defaultStats);
        setError(result.message || '통일 기록을 불러오지 못했습니다.');
      }
    } catch (err) {
      console.error('통일 기록 로드 실패:', err);
      setRecords([]);
      setTotal(0);
      setStats(defaultStats);
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }, [page, limit, defaultStats]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // 페이지 변경
  const handlePageChange = (newPage: number) => {
    updateParams({ page: newPage === 1 ? undefined : String(newPage) });
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      {/* 헤더 배경 */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-yellow-900/20 via-orange-900/10 to-transparent" />
        <div className="absolute top-0 left-1/3 w-[500px] h-[500px] bg-yellow-500/10 rounded-full blur-[150px]" />
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-[120px]" />
        
        <div className="relative z-10 max-w-6xl mx-auto px-4 pt-12 pb-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-black text-white mb-2 tracking-tight">
              👑 역대 통일 기록
            </h1>
            <p className="text-gray-400">천하를 호령한 역대 군주들의 발자취</p>
          </div>

          {/* 통계 카드 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <StatCard
              icon="🏆"
              label="총 통일 횟수"
              value={stats.totalUnifications}
              accent="yellow"
            />
            <StatCard
              icon="🏛️"
              label="최다 통일 국가"
              value={stats.topNation || '-'}
              accent="blue"
            />
            <StatCard
              icon="👑"
              label="최다 통일 군주"
              value={stats.topRuler || '-'}
              accent="purple"
            />
            <StatCard
              icon="⏱️"
              label="평균 소요 턴"
              value={stats.avgDuration || '-'}
              subValue="턴"
              accent="green"
            />
          </div>

          {/* 필터 */}
          <FilterPanel className="justify-between bg-gray-900/70 backdrop-blur-md">
            <span className="text-sm text-gray-400">
              총 <span className="text-white font-bold">{total}</span>개의 기록
            </span>
            <div className="flex items-center gap-3">
              {error && (
                <div className="rounded-lg border border-rose-500/50 bg-rose-900/30 px-3 py-2 text-xs text-rose-200">
                  {error}
                </div>
              )}
              <FilterSelect
                label="표시"
                value={String(limit)}
                options={PAGE_SIZE_OPTIONS}
                onChange={(v) => updateParams({ limit: v === '10' ? undefined : v, page: undefined })}
              />
            </div>
          </FilterPanel>
        </div>
      </div>

      {/* 메인 컨텐츠 */}
      <div className="max-w-4xl mx-auto px-4 pb-12">
        <UnificationTimeline
          records={records}
          loading={loading}
          emptyMessage="아직 통일 기록이 없습니다."
        />

        {/* 페이지네이션 */}
        <Pagination
          page={page}
          total={total}
          limit={limit}
          onPageChange={handlePageChange}
        />

        {/* 연관 링크 */}
        <div className="mt-12 pt-8 border-t border-white/10">
          <p className="text-center text-gray-500 mb-4">더 많은 기록 보기</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/ranking"
              className={cn(
                'px-6 py-3 rounded-xl border border-white/10 bg-white/5',
                'hover:bg-white/10 hover:border-white/20 transition-all',
                'flex items-center gap-2'
              )}
            >
              <span>🏆</span>
              <span>랭킹 보기</span>
            </Link>
            <Link
              href="/ranking?tab=nations"
              className={cn(
                'px-6 py-3 rounded-xl border border-white/10 bg-white/5',
                'hover:bg-white/10 hover:border-white/20 transition-all',
                'flex items-center gap-2'
              )}
            >
              <span>🏛️</span>
              <span>국가 랭킹</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function HistoryPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-950 flex justify-center items-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-yellow-500" />
        </div>
      }
    >
      <HistoryPageContent />
    </Suspense>
  );
}

