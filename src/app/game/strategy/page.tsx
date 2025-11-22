'use client';

import StarGrid from '@/components/logh/StarGrid';
import { useGameStore } from '@/stores/gameStore';

export default function StrategyPage() {
  const { selectedGrid } = useGameStore();

  return (
    <div className="w-full h-full flex flex-col relative">
      {/* 지도 구역 */}
      <div className="flex-1 relative">
        <StarGrid />
      </div>
      
      {/* 컨텍스트 패널 (하단 오버레이) */}
      {selectedGrid && (
        <div className="absolute bottom-4 left-4 bg-[#101520] border border-[#1E90FF] p-4 w-64 shadow-lg text-sm font-mono z-10">
           <h3 className="text-[#FFD700] border-b border-[#333] mb-2">격자 정보</h3>
           <p>좌표: {selectedGrid.x}, {selectedGrid.y}</p>
           <p className="text-[#9CA3AF] mt-1">공허 공간 (100Ly 구역)</p>
           <button className="mt-3 w-full bg-[#1E90FF]/20 hover:bg-[#1E90FF]/40 text-[#1E90FF] border border-[#1E90FF] py-1 text-xs">
             워프 개시
           </button>
        </div>
      )}
    </div>
  );
}
