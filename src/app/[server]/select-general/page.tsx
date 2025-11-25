'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { SammoAPI } from '@/lib/api/sammo';
import TopBackBar from '@/components/common/TopBackBar';
import InfoSummaryCard from '@/components/info/InfoSummaryCard';
import HistoryTimeline from '@/components/info/HistoryTimeline';
import { buildSelectPoolSummary, buildTimelineFromSources } from '@/lib/utils/game/entryFormatter';
import { cn } from '@/lib/utils';
import { useToast } from '@/contexts/ToastContext';

export default function SelectGeneralPage() {
  const params = useParams();
  const serverID = params?.server as string;
  const router = useRouter();

  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [generalList, setGeneralList] = useState<any[]>([]);
  const [selectedGeneral, setSelectedGeneral] = useState<number | null>(null);

  const highlightedGeneral = useMemo(
    () => generalList.find((general) => general.no === selectedGeneral),
    [generalList, selectedGeneral],
  );

  const statRange = useMemo(() => {
    if (!generalList.length) {
      return { minPower: undefined, maxPower: undefined };
    }
    const totals = generalList.map((general) =>
      (general.leadership ?? 0) +
      (general.strength ?? 0) +
      (general.intel ?? 0) +
      (general.politics ?? 0) +
      (general.charm ?? 0),
    );
    return {
      minPower: Math.min(...totals),
      maxPower: Math.max(...totals),
    };
  }, [generalList]);

  const poolSummaryCards = useMemo(
    () =>
      buildSelectPoolSummary({
        poolSize: generalList.length,
        highlightedName: highlightedGeneral?.name,
        minStat: statRange.minPower,
        maxStat: statRange.maxPower,
        nationName: highlightedGeneral
          ? String(highlightedGeneral.nationName ?? highlightedGeneral.nation ?? '재야')
          : undefined,
      }),
    [generalList.length, highlightedGeneral, statRange.minPower, statRange.maxPower],
  );

  const selectionTimeline = useMemo(
    () =>
      buildTimelineFromSources([
        {
          id: 'pool',
          order: 1,
          category: 'system',
          title: '선발 장수 풀 갱신',
          description: `${generalList.length}명 대기 중`,
        },
        {
          id: 'preview',
          order: 2,
          category: 'action',
          title: highlightedGeneral ? `${highlightedGeneral.name} 미리보기` : '장수를 선택하세요',
          description: highlightedGeneral
            ? `국가: ${highlightedGeneral.nationName || highlightedGeneral.nation || '재야'}`
            : '카드를 눌러 상세를 확인합니다.',
        },
        {
          id: 'confirm',
          order: 3,
          category: 'system',
          title: '선택 확정 및 입장',
          description: '확정 버튼을 눌러 게임에 합류하세요.',
        },
      ]),
    [generalList.length, highlightedGeneral],
  );

  useEffect(() => {
    loadGeneralList();
  }, [serverID]);

  async function loadGeneralList() {
    try {
      setLoading(true);
      const result = await SammoAPI.GetSelectPool();
      if (result.result) {
        setGeneralList(result.pool || []);
      }
    } catch (err) {
      console.error(err);
      showToast('장수 목록을 불러오는데 실패했습니다.', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleSelect() {
    if (!selectedGeneral) {
      showToast('장수를 선택해주세요.', 'warning');
      return;
    }
    
    try {
      const result = await SammoAPI.SelectPickedGeneral({
        generalID: selectedGeneral,
      });

      if (result.result) {
        showToast('장수 선택이 완료되었습니다.', 'success');
        router.push(`/${serverID}/game`);
      } else {
        showToast(result.reason || '장수 선택에 실패했습니다.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('장수 선택에 실패했습니다.', 'error');
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-gray-950 p-4 font-sans text-gray-100 md:p-6 lg:p-8">
      <div className="pointer-events-none absolute inset-0 opacity-20" />
      <div className="pointer-events-none absolute -top-32 left-1/3 h-72 w-72 rounded-full bg-blue-500/20 blur-[140px]" />

      <div className="relative z-10">
        <TopBackBar title="장수 선택" />
        
        {loading ? (
          <div className="flex h-[50vh] items-center justify-center">
             <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-white" />
          </div>
        ) : (
          <div className="mx-auto flex h-full max-w-6xl flex-col gap-6">
            {poolSummaryCards.length > 0 && (
              <div className="grid gap-4 md:grid-cols-3">
                {poolSummaryCards.map((card) => (
                  <InfoSummaryCard key={card.label} dense {...card} />
                ))}
              </div>
            )}

            <HistoryTimeline
              title="선발 절차"
              subtitle="풀 확인 → 장수 선택 → 확정"
              events={selectionTimeline}
              variant="compact"
              highlightCategory={selectedGeneral ? 'action' : 'system'}
            />

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {generalList.map((general) => (
                <div
                  key={general.no}
                  className={cn(
                    'group relative cursor-pointer overflow-hidden rounded-xl border bg-gray-900/50 shadow-lg backdrop-blur transition-all duration-200',
                    selectedGeneral === general.no
                      ? 'border-blue-500 ring-2 ring-blue-500/50 -translate-y-1 scale-[1.02]'
                      : 'border-white/10 hover:-translate-y-0.5 hover:border-white/30',
                  )}
                  onClick={() => setSelectedGeneral(general.no)}
                >
                  <div className="relative aspect-[26/35] w-full overflow-hidden bg-black/40">
                    <img
                      src={`/images/gen_icon/${general.imgsvr}/${general.picture}.jpg`}
                      alt={general.name}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://placehold.co/156x210/333/999?text=No+Image';
                      }}
                    />
                    {selectedGeneral === general.no && (
                      <div className="absolute inset-0 flex items-center justify-center bg-blue-600/30">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      </div>
                    )}
                  </div>
                  
                    <div className="space-y-2 p-3">
                    <div className="text-center text-lg font-bold text-white truncate">{general.name}</div>
                    <div className="flex items-center justify-between rounded-lg bg-black/30 p-2 text-xs text-gray-400">
                      <div className="flex flex-col items-center">
                        <span className="text-[10px]">통솔</span>
                        <span className="font-mono text-white">{general.leadership}</span>
                      </div>
                      <div className="h-6 w-px bg-white/10" />
                      <div className="flex flex-col items-center">
                        <span className="text-[10px]">무력</span>
                        <span className="font-mono text-white">{general.strength}</span>
                      </div>
                      <div className="h-6 w-px bg-white/10" />
                      <div className="flex flex-col items-center">
                        <span className="text-[10px]">지력</span>
                        <span className="font-mono text-white">{general.intel}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="sticky bottom-6 z-20 flex justify-center">
               <button
                type="button"
                onClick={handleSelect}
                disabled={!selectedGeneral}
                className={cn(
                  'rounded-full px-8 py-3 text-lg font-bold shadow-xl transition-all duration-300',
                  selectedGeneral
                    ? 'bg-blue-600 text-white hover:scale-105 hover:bg-blue-500 hover:shadow-blue-500/30'
                    : 'bg-white/10 text-gray-400',
                )}
              >
                {selectedGeneral ? '이 장수로 시작하기' : '장수를 선택해주세요'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
