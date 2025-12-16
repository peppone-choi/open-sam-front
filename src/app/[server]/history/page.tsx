'use client';

import React, { useEffect, useMemo, useState, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams, useRouter, usePathname } from 'next/navigation';
import TopBackBar from '@/components/common/TopBackBar';
import HistoryTimeline from '@/components/info/HistoryTimeline';
import InfoSummaryCard from '@/components/info/InfoSummaryCard';
import { FilterPanel, FilterSelect, FilterButton } from '@/components/common/FilterPanel';
import { INFO_TEXT } from '@/constants/uiText';
import { SammoAPI } from '@/lib/api/sammo';
import type { HistoryNationSnapshot, HistoryRawEntry } from '@/types/logh';
import {
  getHistoryNationAggregate,
  normalizeHistoryEntries,
  sortHistoryEvents,
} from '@/lib/utils/game/historyFormatter';

interface HistoryPayload {
  server_id: string;
  year: number;
  month: number;
  global_history?: HistoryRawEntry[];
  global_action?: HistoryRawEntry[];
  nations?: HistoryNationSnapshot[];
}

// 연도/월 옵션 생성 (시작 연도부터 현재까지)
function generateYearOptions(startYear = 1, endYear = 100) {
  const options = [{ value: '', label: '최신' }];
  for (let year = endYear; year >= startYear; year--) {
    options.push({ value: String(year), label: `${year}년` });
  }
  return options;
}

function generateMonthOptions() {
  const options = [{ value: '', label: '전체' }];
  for (let month = 1; month <= 12; month++) {
    options.push({ value: String(month), label: `${month}월` });
  }
  return options;
}

function HistoryPageContent() {
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const serverID = params?.server as string;

  // URL에서 연도/월 파라미터 읽기
  const yearParam = searchParams?.get('year') || '';
  const monthParam = searchParams?.get('month') || '';

  const [loading, setLoading] = useState(true);
  const [historyData, setHistoryData] = useState<HistoryPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [maxYear, setMaxYear] = useState(100);

  // 파싱된 연도/월
  const parsedYear = yearParam ? Number(yearParam) : undefined;
  const parsedMonth = monthParam ? Number(monthParam) : undefined;

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
    loadHistory();
  }, [parsedYear, parsedMonth, serverID]);

  const { events, globalCount, actionCount } = useMemo(() => {
    if (!historyData) {
      return { events: [], globalCount: 0, actionCount: 0 };
    }
    const globalEvents = normalizeHistoryEntries(historyData.global_history, 'global');
    const actionEvents = normalizeHistoryEntries(historyData.global_action, 'action');
    return {
      events: sortHistoryEvents([...globalEvents, ...actionEvents]),
      globalCount: globalEvents.length,
      actionCount: actionEvents.length,
    };
  }, [historyData]);

  const nationAggregate = useMemo(
    () => getHistoryNationAggregate(historyData?.nations),
    [historyData]
  );

  async function loadHistory() {
    try {
      setLoading(true);
      setError(null);
      const result = await SammoAPI.GetHistory({ 
        year: parsedYear, 
        month: parsedMonth,
        serverID: serverID,
        session_id: serverID,
      });
      if (result.result && result.history) {
        const history = result.history as HistoryPayload;
        setHistoryData(history);
        // 최대 연도 업데이트
        if (history.year && history.year > maxYear) {
          setMaxYear(history.year + 10);
        }
      } else {
        setHistoryData(null);
        setError('연감 정보를 찾을 수 없습니다.');
      }
    } catch (err) {
      console.error(err);
      setError('연감 정보를 불러오지 못했습니다.');
      setHistoryData(null);
    } finally {
      setLoading(false);
    }
  }

  // 연도/월 선택 옵션
  const yearOptions = useMemo(() => generateYearOptions(1, maxYear), [maxYear]);
  const monthOptions = useMemo(() => generateMonthOptions(), []);

  const detailPath =
    parsedYear && parsedMonth ? `/${serverID}/history/${parsedYear}${String(parsedMonth).padStart(2, '0')}` : null;
  const formattedYearMonth = historyData
    ? `${historyData.year}년 ${historyData.month}월`
    : '최근 기록';

  return (
    <div className="relative min-h-screen overflow-hidden bg-gray-950 p-4 font-sans text-gray-100 md:p-6 lg:p-8">
      <div className="pointer-events-none absolute inset-0 bg-hero-pattern opacity-20" />
      <div className="pointer-events-none absolute -top-28 right-0 h-80 w-80 rounded-full bg-violet-500/20 blur-[160px]" />

      <div className="relative z-10 mx-auto flex max-w-5xl flex-col gap-6">
        <TopBackBar title="연감" reloadable onReload={loadHistory} />

        {/* 필터 패널 */}
        <FilterPanel>
          <FilterSelect
            label="연도"
            value={yearParam}
            options={yearOptions}
            onChange={(v) => updateParams({ year: v || undefined })}
          />
          <FilterSelect
            label="월"
            value={monthParam}
            options={monthOptions}
            onChange={(v) => updateParams({ month: v || undefined })}
          />
          <FilterButton onClick={loadHistory}>조회</FilterButton>
          {detailPath && (
            <Link
              href={detailPath}
              className="rounded-lg border border-white/10 px-6 py-2 text-sm font-semibold text-gray-100 transition hover:border-blue-500/40 hover:text-white"
            >
              상세 보기
            </Link>
          )}
        </FilterPanel>

        {error && (
          <div className="rounded-lg border border-rose-500/30 bg-rose-900/20 p-3 text-sm text-rose-300">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex h-[40vh] items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-white" />
          </div>
        ) : historyData ? (
          <>
            <div className="grid gap-4 md:grid-cols-3">
              <InfoSummaryCard
                label="기록 월"
                value={formattedYearMonth}
                description={INFO_TEXT.history.snapshotLabel}
                meta={[{ label: '서버', value: serverID || '-' }]}
                accent="violet"
              />
              <InfoSummaryCard
                label="기록 수"
                value={`${events.length}건`}
                description="중원 정세 + 장수 동향"
                meta={[
                  { label: '중원 정세', value: `${globalCount}건` },
                  { label: '장수 동향', value: `${actionCount}건` },
                ]}
                accent="blue"
              />
              <InfoSummaryCard
                label="세력"
                value={`${nationAggregate.totalNations}국`}
                description="국력 및 장수 현황"
                meta={[
                  { label: '국력 합계', value: nationAggregate.totalPower.toLocaleString() },
                  { label: '장수', value: nationAggregate.totalGenerals.toLocaleString() },
                ]}
                accent="green"
              />
            </div>

            <HistoryTimeline
              title={INFO_TEXT.history.timelineTitle}
              subtitle={formattedYearMonth}
              events={events}
              emptyLabel={INFO_TEXT.history.timelineEmpty}
            />
          </>
        ) : (
          <div className="flex flex-col items-center gap-2 text-gray-400">
            <div className="text-4xl">🗒️</div>
            <p>연감 데이터를 찾을 수 없습니다.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function HistoryPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-950 flex justify-center items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white" />
        </div>
      }
    >
      <HistoryPageContent />
    </Suspense>
  );
}
