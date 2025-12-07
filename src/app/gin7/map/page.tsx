'use client';

import { GalaxyMapCanvas, GalaxyMapControls, MiniMap } from '@/components/gin7/map';
import { FleetPanel, PlanetPanel } from '@/components/gin7/panels';
import { MainContent } from '@/components/gin7/layout';
import { useGin7Store } from '@/stores/gin7Store';

export default function Gin7MapPage() {
  const loading = useGin7Store((state) => state.loading);
  const strategySnapshot = useGin7Store((state) => state.strategySnapshot);

  const mapMeta = strategySnapshot?.map?.meta;

  return (
    <MainContent
      title="은하 지도"
      subtitle={mapMeta ? `${mapMeta.systemCount}개 성계 · ${mapMeta.warpRouteCount}개 워프 경로` : '지도 로딩 중...'}
    >
      {loading ? (
        <div className="h-[600px] rounded-2xl border border-white/5 bg-space-panel/50 flex items-center justify-center">
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-foreground-muted">지도 데이터 로딩 중...</span>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
          {/* 메인 맵 영역 */}
          <div className="space-y-4">
            <div className="relative h-[500px] rounded-2xl overflow-hidden">
              <GalaxyMapCanvas />
              <GalaxyMapControls />
            </div>
            <MiniMap />
          </div>

          {/* 사이드 패널 */}
          <div className="space-y-4">
            <FleetPanel />
            <PlanetPanel />
          </div>
        </div>
      )}
    </MainContent>
  );
}

