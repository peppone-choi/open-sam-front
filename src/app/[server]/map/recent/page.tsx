'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { SammoAPI } from '@/lib/api/sammo';
import TopBackBar from '@/components/common/TopBackBar';
import MapViewer from '@/components/game/MapViewer';
import { useToast } from '@/contexts/ToastContext';

interface MapSummaryCard {
  label: string;
  value: string;
  caption: string;
}

export default function RecentMapPage() {
  const params = useParams();
  const router = useRouter();
  const serverID = params?.server as string;
  const { showToast } = useToast();

  const [mapData, setMapData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadMapData = useCallback(async (options?: { silent?: boolean }) => {
    if (!serverID) {
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      if (options?.silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      const result = await SammoAPI.GlobalGetMap({
        serverID,
        neutralView: 0,
        showMe: 1,
      });
      if (result.result) {
        setMapData(result);
      }
    } catch (err) {
      console.error(err);
      showToast('지도 데이터를 불러오는데 실패했습니다.', 'error');
    } finally {
      if (options?.silent) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  }, [serverID]);

  useEffect(() => {
    void loadMapData();
  }, [loadMapData]);

  const overviewCards = useMemo<MapSummaryCard[]>(() => {
    if (!mapData) {
      return [];
    }

    const cityList = mapData.cityList || [];
    const cityCount = cityList.length;
    const supplyCount = cityList.filter((city: any[]) => city?.[5] !== 0).length;
    const nationCount = mapData.nationList?.length ?? 0;
    const scouted = mapData.shownByGeneralList?.length ?? 0;

    return [
      { label: '전체 도시', value: cityCount.toLocaleString(), caption: '표시 가능한 거점' },
      { label: '보급 유지', value: supplyCount.toLocaleString(), caption: '보급 중인 거점 수' },
      { label: '국가 수', value: nationCount.toLocaleString(), caption: '지도에 표시된 국가' },
      { label: '정찰 도시', value: scouted.toLocaleString(), caption: '아군이 확인한 도시' },
    ];
  }, [mapData]);

  const lastTickLabel = mapData ? `${mapData.year}년 ${mapData.month}월` : '-';

  const handleCityNavigate = useCallback((cityId: number) => {
    if (!serverID || !cityId) {
      return;
    }
    router.push(`/${serverID}/info/current-city?cityId=${cityId}`);
  }, [router, serverID]);

  const showSkeleton = loading && !mapData;
  const showMap = !loading && !!mapData;

  const touchGuides = [
    { title: '첫 터치', description: '현재 위치에서 도시 툴팁을 띄웁니다.' },
    { title: '손 떼기', description: '도시 상세 정보 페이지로 이동합니다.' },
    { title: '두 손가락 제스처', description: '브라우저 기본 조작으로 확대/축소.' },
  ];

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <TopBackBar
        title="실시간 지도"
        backUrl={`/${serverID || ''}/game`}
        reloadable
        onReload={() => loadMapData({ silent: true })}
      />
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 pb-10 pt-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {overviewCards.map((card) => (
            <div
              key={card.label}
              className="rounded-2xl border border-white/5 bg-gradient-to-br from-gray-900/70 to-gray-900/30 p-4 shadow-lg"
            >
              <p className="text-xs uppercase tracking-[0.2em] text-gray-400">{card.label}</p>
              <p className="mt-2 text-3xl font-bold text-white">{card.value}</p>
              <p className="text-sm text-gray-500">{card.caption}</p>
            </div>
          ))}
          {overviewCards.length === 0 && (
            <div className="rounded-2xl border border-white/10 bg-gray-900/40 p-4 text-sm text-gray-400">
              지도 정보가 로딩되는 동안 기다려 주세요.
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-white/5 bg-black/50 shadow-2xl">
          <div className="flex flex-col gap-3 border-b border-white/5 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-white">터치 인터랙션 안내</p>
              <p className="text-xs text-gray-400">현재 턴 기준: {lastTickLabel}</p>
            </div>
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-full border border-white/10 bg-blue-600/80 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-900/40 transition hover:bg-blue-500/80 disabled:cursor-not-allowed disabled:opacity-50"
              onClick={() => loadMapData({ silent: true })}
              disabled={refreshing}
            >
              {refreshing ? '새로고침 중...' : '지도 새로고침'}
            </button>
          </div>
          <div className="flex flex-wrap gap-3 px-4 py-3 text-sm text-gray-300">
            {touchGuides.map((guide) => (
              <span
                key={guide.title}
                className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-gray-200"
              >
                <strong className="text-white">{guide.title}</strong> · {guide.description}
              </span>
            ))}
          </div>
          <div className="w-full p-2 sm:p-4">
            {showSkeleton && (
              <div className="flex h-[420px] items-center justify-center text-gray-400">
                <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-white" />
              </div>
            )}
            {showMap && mapData && (
              <div className="h-full min-h-[420px] rounded-2xl border border-white/10 bg-black/60 p-2">
                <MapViewer
                  serverID={serverID}
                  mapData={mapData}
                  onCityClick={handleCityNavigate}
                  isFullWidth
                />
              </div>
            )}
            {!loading && !mapData && (
              <div className="flex h-[420px] items-center justify-center text-gray-500">
                지도 데이터를 불러올 수 없습니다.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
