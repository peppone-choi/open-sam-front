'use client';

import React, { Suspense, useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import TopBackBar from '@/components/common/TopBackBar';
import MapViewer from '@/components/game/MapViewer';
import HistoryTimeline from '@/components/info/HistoryTimeline';
import InfoSummaryCard from '@/components/info/InfoSummaryCard';
import { INFO_TEXT } from '@/constants/uiText';
import { SammoAPI } from '@/lib/api/sammo';
import type { GetMapResponse } from '@/lib/api/sammo';
import type { HistoryNationSnapshot, HistoryRawEntry } from '@/types/logh';
import { getHistoryNationAggregate, normalizeHistoryEntries, sortHistoryEvents } from '@/lib/utils/game/historyFormatter';

interface HistoryPayload {
  server_id: string;
  year: number;
  month: number;
  global_history?: HistoryRawEntry[];
  global_action?: HistoryRawEntry[];
  nations?: HistoryNationSnapshot[];
  map?: Partial<GetMapResponse> | null;
}

const hasMapSnapshot = (snapshot?: HistoryPayload['map']): snapshot is GetMapResponse => {
  if (!snapshot) return false;
  return Array.isArray(snapshot.cityList) && Array.isArray(snapshot.nationList);
};

const getNationTextColor = (color?: string) => {
  if (!color) return '#fff';
  const hex = color.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 150 ? '#000' : '#fff';
};

function HistoryYearMonthContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const serverID = params?.server as string;
  const yearMonth = params?.yearMonth as string;
  const queryServerID = searchParams?.get('serverID') || serverID;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [historyData, setHistoryData] = useState<HistoryPayload | null>(null);

  useEffect(() => {
    loadHistory();
  }, [yearMonth, queryServerID]);

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

  const formattedYearMonth = historyData ? `${historyData.year}년 ${historyData.month}월` : yearMonth;

  async function loadHistory() {
    if (!yearMonth) {
      setError('연월 정보가 필요합니다.');
      setHistoryData(null);
      setLoading(false);
      return;
    }

    const match = yearMonth.match(/^(\d{4})(\d{2})$/);
    if (!match) {
      setError('연월 형식이 잘못되었습니다. 예) 202401');
      setHistoryData(null);
      setLoading(false);
      return;
    }

    const parsedYear = Number(match[1]);
    const parsedMonth = Number(match[2]);

    try {
      setLoading(true);
      setError(null);
      const result = await SammoAPI.GetHistory({ year: parsedYear, month: parsedMonth });
      if (result.result && result.history) {
        setHistoryData(result.history as HistoryPayload);
      } else {
        setHistoryData(null);
        setError('해당 연감 데이터를 찾을 수 없습니다.');
      }
    } catch (err) {
      console.error(err);
      setError('연감 데이터를 불러오지 못했습니다.');
      setHistoryData(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-gray-950 p-4 font-sans text-gray-100 md:p-6 lg:p-8">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(55,65,81,0.1)_1px,transparent_1px),linear-gradient(to_bottom,rgba(55,65,81,0.1)_1px,transparent_1px)] bg-[size:14px_24px] opacity-20" />
      <div className="pointer-events-none absolute -top-32 left-1/4 h-72 w-72 rounded-full bg-blue-500/20 blur-[140px]" />

      <div className="relative z-10">
        <TopBackBar title={`연감 · ${formattedYearMonth ?? ''}`} reloadable onReload={loadHistory} />

        {loading ? (
          <div className="flex h-[50vh] items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-white" />
          </div>
        ) : error ? (
          <div className="mt-20 flex flex-col items-center gap-3 text-center text-sm text-rose-300">
            <div className="text-4xl">⚠️</div>
            <p>{error}</p>
          </div>
        ) : historyData ? (
          <div className="mx-auto mt-6 flex max-w-6xl flex-col gap-6">
            <div className="grid gap-4 md:grid-cols-3">
              <InfoSummaryCard
                label="기록 월"
                value={formattedYearMonth}
                description={INFO_TEXT.history.snapshotLabel}
                meta={[{ label: '서버', value: queryServerID || '-' }]}
                accent="violet"
              />
              <InfoSummaryCard
                label="기록 수"
                value={`${events.length}건`}
                description="중원 정세 + 장수 동향"
                meta={[{ label: '중원 정세', value: `${globalCount}건` }, { label: '장수 동향', value: `${actionCount}건` }]}
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

            {hasMapSnapshot(historyData.map) && (
              <div className="overflow-hidden rounded-2xl border border-white/5 bg-gray-900/70 shadow-lg">
                <div className="border-b border-white/5 bg-blue-500/10 px-6 py-3 text-lg font-semibold text-blue-300">
                  천하도 스냅샷
                </div>
                <div className="min-h-[350px] sm:min-h-[500px] lg:min-h-[600px] bg-gray-800/40">
                  <MapViewer serverID={queryServerID} mapData={historyData.map} isFullWidth />
                </div>
              </div>
            )}

            {historyData.nations && historyData.nations.length > 0 && (
              <div className="overflow-hidden rounded-2xl border border-white/5 bg-gray-900/70 shadow-lg">
                <div className="border-b border-white/5 bg-emerald-500/10 px-6 py-3 text-lg font-semibold text-emerald-200">
                  {INFO_TEXT.history.nationTableTitle}
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-white/5 text-gray-100">
                      <tr>
                        <th className="px-4 py-3 text-left">국가</th>
                        <th className="px-4 py-3 text-right">국력</th>
                        <th className="px-4 py-3 text-right">장수</th>
                        <th className="px-4 py-3 text-right">속령</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {historyData.nations.map((nation) => (
                        <tr key={nation.nation || nation.name} className="hover:bg-white/5">
                          <td className="px-4 py-3 font-semibold">
                            <span
                              className="rounded px-2 py-1"
                              style={{
                                color: getNationTextColor(nation.color),
                                backgroundColor: nation.color ?? 'transparent',
                              }}
                            >
                              {nation.name}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right font-mono text-amber-300">
                            {(nation.power ?? 0).toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-right font-mono text-blue-200">{(nation.gennum ?? 0).toLocaleString()}</td>
                          <td className="px-4 py-3 text-right text-gray-400">{nation.cities?.length ?? 0}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <HistoryTimeline
              title={INFO_TEXT.history.timelineTitle}
              subtitle={`${historyData.year}년 ${historyData.month}월 기록`}
              events={events}
              emptyLabel={INFO_TEXT.history.timelineEmpty}
            />
          </div>
        ) : (
          <div className="mt-20 flex flex-col items-center gap-2 text-gray-400">
            <div className="text-4xl">🗒️</div>
            <p>연감 데이터를 찾을 수 없습니다.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function HistoryYearMonthPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-gray-950">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-white" />
        </div>
      }
    >
      <HistoryYearMonthContent />
    </Suspense>
  );
}
