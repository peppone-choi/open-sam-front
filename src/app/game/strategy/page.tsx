'use client';

import StarGrid from '@/components/logh/StarGrid';
import { useGameStore } from '@/stores/gameStore';

export default function StrategyPage() {
  const { selectedGrid } = useGameStore();

  return (
    <div className="w-full h-full flex flex-col relative bg-space-bg">
      {/* 지도 구역 */}
      <div className="flex-1 relative">
        <StarGrid />
      </div>
      
      {/* 컨텍스트 패널 (하단 오버레이) */}
      {selectedGrid && (
        <div className="absolute bottom-4 left-4 bg-space-panel/90 border border-alliance-red p-4 w-64 shadow-lg text-sm font-mono z-10 backdrop-blur-sm rounded-lg">
           <h3 className="text-empire-gold border-b border-white/10 mb-2 font-serif">격자 정보</h3>
           <p className="text-space-text">좌표: {selectedGrid.x}, {selectedGrid.y}</p>
           <p className="text-foreground-muted mt-1">공허 공간 (100Ly 구역)</p>
           <button className="mt-3 w-full bg-alliance-red/20 hover:bg-alliance-red/40 text-alliance-red border border-alliance-red py-1 text-xs rounded transition-colors">
             워프 개시
           </button>
        </div>
      )}
    </div>
  );
}
