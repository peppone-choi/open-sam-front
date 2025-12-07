'use client';

import { useGin7MapStore } from '@/stores/gin7MapStore';
import {
  PlusIcon,
  MinusIcon,
  ArrowsPointingOutIcon,
  MapIcon,
  EyeIcon,
  EyeSlashIcon,
} from '@heroicons/react/24/outline';

export default function GalaxyMapControls() {
  const viewport = useGin7MapStore((state) => state.viewport);
  const zoomIn = useGin7MapStore((state) => state.zoomIn);
  const zoomOut = useGin7MapStore((state) => state.zoomOut);
  const resetViewport = useGin7MapStore((state) => state.resetViewport);
  const layers = useGin7MapStore((state) => state.layers);
  const toggleLayer = useGin7MapStore((state) => state.toggleLayer);

  const zoomPercent = Math.round(viewport.zoom * 100);

  return (
    <div className="absolute right-4 top-4 flex flex-col gap-2">
      {/* 줌 컨트롤 */}
      <div className="flex flex-col rounded-xl bg-space-panel/90 backdrop-blur-sm border border-white/10 overflow-hidden">
        <button
          onClick={zoomIn}
          disabled={viewport.zoom >= 4}
          className="p-2 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          title="확대 (Ctrl+휠 위로)"
        >
          <PlusIcon className="w-5 h-5 text-foreground" />
        </button>
        <div className="px-2 py-1 text-center text-xs font-mono text-foreground-muted border-y border-white/5">
          {zoomPercent}%
        </div>
        <button
          onClick={zoomOut}
          disabled={viewport.zoom <= 0.25}
          className="p-2 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          title="축소 (Ctrl+휠 아래로)"
        >
          <MinusIcon className="w-5 h-5 text-foreground" />
        </button>
      </div>

      {/* 뷰 리셋 */}
      <button
        onClick={resetViewport}
        className="p-2 rounded-xl bg-space-panel/90 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-colors"
        title="뷰 초기화"
      >
        <ArrowsPointingOutIcon className="w-5 h-5 text-foreground" />
      </button>

      {/* 레이어 토글 */}
      <div className="flex flex-col rounded-xl bg-space-panel/90 backdrop-blur-sm border border-white/10 overflow-hidden">
        <button
          onClick={() => toggleLayer('grid')}
          className={`p-2 hover:bg-white/10 transition-colors ${layers.grid ? '' : 'opacity-50'}`}
          title="그리드 표시"
        >
          <MapIcon className="w-5 h-5 text-foreground" />
        </button>
        <button
          onClick={() => toggleLayer('fleets')}
          className={`p-2 hover:bg-white/10 transition-colors border-t border-white/5 ${layers.fleets ? '' : 'opacity-50'}`}
          title="함대 표시"
        >
          {layers.fleets ? (
            <EyeIcon className="w-5 h-5 text-foreground" />
          ) : (
            <EyeSlashIcon className="w-5 h-5 text-foreground" />
          )}
        </button>
        <button
          onClick={() => toggleLayer('labels')}
          className={`p-2 hover:bg-white/10 transition-colors border-t border-white/5 ${layers.labels ? '' : 'opacity-50'}`}
          title="라벨 표시"
        >
          <span className="text-xs font-bold text-foreground">Aa</span>
        </button>
      </div>
    </div>
  );
}

