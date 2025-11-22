'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import TopBackBar from '@/components/common/TopBackBar';
import HistoryTimeline from '@/components/info/HistoryTimeline';
import InfoSummaryCard from '@/components/info/InfoSummaryCard';
import { INFO_TEXT } from '@/constants/uiText';
import { SammoAPI } from '@/lib/api/sammo';
import type { HistoryNationSnapshot, HistoryRawEntry } from '@/types/logh';
import { getHistoryNationAggregate, normalizeHistoryEntries, sortHistoryEvents } from '@/lib/utils/game/historyFormatter';

interface HistoryPayload {
  server_id: string;
  year: number;
  month: number;
  global_history?: HistoryRawEntry[];
  global_action?: HistoryRawEntry[];
  nations?: HistoryNationSnapshot[];
}

export default function HistoryPage() {
  const params = useParams();
  const serverID = params?.server as string;

  const [loading, setLoading] = useState(true);
  const [historyData, setHistoryData] = useState<HistoryPayload | null>(null);
  const [yearMonth, setYearMonth] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadHistory();
  }, [yearMonth, serverID]);

  const isYearMonthValid = /^\d{6}$/.test(yearMonth);
  const parsedYear = isYearMonthValid ? Number(yearMonth.slice(0, 4)) : undefined;
  const parsedMonth = isYearMonthValid ? Number(yearMonth.slice(4)) : undefined;

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

  const nationAggregate = useMemo(() => getHistoryNationAggregate(historyData?.nations), [historyData]);

  async function loadHistory() {
    try {
      setLoading(true);
      setError(null);
      const result = await SammoAPI.GetHistory({ year: parsedYear, month: parsedMonth });
      if (result.result && result.history) {
        setHistoryData(result.history as HistoryPayload);
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

  const detailPath = isYearMonthValid ? `/${serverID}/history/${yearMonth}` : null;
  const formattedYearMonth = historyData ? `${historyData.year}년 ${historyData.month}월` : '최근 기록';

  return (
    <div className="relative min-h-screen overflow-hidden bg-background-main p-4 font-sans text-foreground md:p-6 lg:p-8">
      <div className="pointer-events-none absolute inset-0 bg-hero-pattern opacity-20" />
      <div className="pointer-events-none absolute -top-28 right-0 h-80 w-80 rounded-full bg-violet-500/20 blur-[160px]" />

      <div className="relative z-10 mx-auto flex max-w-5xl flex-col gap-6">
        <TopBackBar title="연감" reloadable onReload={loadHistory} />

        <div className="rounded-2xl border border-white/5 bg-background-secondary/70 p-5 shadow-lg">
          <label className="text-sm font-semibold text-foreground">{INFO_TEXT.history.filterLabel}</label>
          <div className="mt-3 flex flex-col gap-3 md:flex-row">
            <input
              type="text"
              value={yearMonth}
              onChange={(e) => setYearMonth(e.target.value)}
              placeholder={INFO_TEXT.history.filterPlaceholder}
              className="w-full rounded-lg border border-white/10 bg-background-tertiary/40 px-4 py-2.5 text-sm text-white placeholder-foreground-dim focus:border-primary/50 focus:outline-none"
            />
            <button
              type="button"
              onClick={loadHistory}
              className="rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-hover"
            >
              조회
            </button>
            {detailPath && (
              <Link
                href={detailPath}
                className="rounded-lg border border-white/10 px-6 py-2.5 text-sm font-semibold text-foreground transition hover:border-primary/40 hover:text-white"
              >
                상세 보기
              </Link>
            )}
          </div>
          {error && <p className="mt-2 text-sm text-rose-300">{error}</p>}
        </div>

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
          <div className="flex flex-col items-center gap-2 text-foreground-muted">
            <div className="text-4xl">🗒️</div>
            <p>연감 데이터를 찾을 수 없습니다.</p>
          </div>
        )}
      </div>
    </div>
  );
}
