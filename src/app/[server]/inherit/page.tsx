'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { SammoAPI } from '@/lib/api/sammo';
import TopBackBar from '@/components/common/TopBackBar';
import InfoSummaryCard from '@/components/info/InfoSummaryCard';
import HistoryTimeline from '@/components/info/HistoryTimeline';
import { buildInheritSummaryCards, buildTimelineFromSources } from '@/lib/utils/game/entryFormatter';

export default function InheritPage() {
  const params = useParams();
  const serverID = params?.server as string;

  const [loading, setLoading] = useState(true);
  const [inheritData, setInheritData] = useState<any>(null);

  const inheritSummaryCards = useMemo(
    () =>
      buildInheritSummaryCards({
        totalPoint: inheritData?.totalPoint ?? 0,
        inheritListLength: inheritData?.inheritList?.length ?? 0,
      }),
    [inheritData?.totalPoint, inheritData?.inheritList],
  );

  const inheritTimelineEvents = useMemo(() => {
    const items = Array.isArray(inheritData?.inheritList) ? inheritData.inheritList : [];
    if (!items.length) {
      return buildTimelineFromSources([
        {
          id: 'empty',
          order: 1,
          category: 'system',
          title: '적립 기록이 없습니다',
          description: '전투, 공헌, 이벤트로 유산 포인트를 적립하세요.',
        },
      ]);
    }
    return buildTimelineFromSources(
      items.slice(0, 5).map((entry: Record<string, any>, index: number) => ({
        id: String(entry.id ?? `inherit-${index}`),
        order: index + 1,
        category: 'system',
        title: entry.reason || entry.type || '포인트 적립',
        description: `${entry.amount ?? entry.point ?? 0}P · ${entry.date ?? entry.createdAt ?? '최근 기록'}`,
      })),
    );
  }, [inheritData?.inheritList]);

  useEffect(() => {
    loadInheritData();
  }, [serverID]);

  async function loadInheritData() {
    try {
      setLoading(true);
      const result: any = await SammoAPI['request']('/api/game/get-inherit-point', { method: 'POST' });
      if (result.result) {
        setInheritData({
          totalPoint: result.totalPoint,
          inheritList: result.inheritList,
        });
      }
    } catch (err) {
      console.error(err);
      // alert('유산 정보를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-gray-950 p-4 font-sans text-gray-100 md:p-6 lg:p-8">
      <div className="pointer-events-none absolute inset-0 opacity-20" />
      <div className="pointer-events-none absolute -top-32 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-amber-500/15 blur-[150px]" />

      <div className="relative z-10 mx-auto max-w-2xl space-y-6">
        <TopBackBar title="유산 관리" reloadable onReload={loadInheritData} />
        
        {loading ? (
          <div className="flex h-[50vh] items-center justify-center">
             <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-white"></div>
          </div>
        ) : (
          <>
            <div className="grid gap-4">
              {inheritSummaryCards.map((card) => (
                <InfoSummaryCard key={card.label} {...card} />
              ))}
            </div>

            <div className="rounded-2xl border border-white/5 bg-gray-900/50 p-8 text-center shadow-lg">
               <h2 className="mb-4 text-xl font-bold text-white">보유 유산 포인트</h2>
               <div className="text-6xl font-extrabold text-amber-300">
                  {inheritData?.totalPoint?.toLocaleString() || 0} <span className="text-2xl text-amber-500">P</span>
               </div>
               <p className="mt-6 text-sm text-gray-400">
                  유산 포인트는 다음 회차 플레이 시 특수 능력을 구매하거나 초기 자원을 늘리는 데 사용할 수 있습니다.
               </p>
            </div>

            <HistoryTimeline
              title="적립 기록"
              subtitle="최근 5건"
              events={inheritTimelineEvents}
              variant="compact"
            />
          </>
        )}
      </div>
    </div>
  );
}
