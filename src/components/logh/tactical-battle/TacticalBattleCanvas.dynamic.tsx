'use client';

/**
 * TacticalBattleCanvas 동적 로딩 래퍼
 * Canvas 컴포넌트를 지연 로딩하여 초기 번들 크기 최적화
 */

import dynamic from 'next/dynamic';
import { ComponentProps } from 'react';

// 로딩 스켈레톤
function LoadingFallback() {
  return (
    <div className="fixed inset-0 bg-[#050510] z-50 flex items-center justify-center">
      <div className="text-center">
        {/* 로딩 애니메이션 */}
        <div className="relative w-24 h-24 mx-auto mb-6">
          {/* 외부 링 */}
          <div className="absolute inset-0 border-4 border-cyan-500/30 rounded-full" />
          {/* 회전 링 */}
          <div className="absolute inset-0 border-4 border-transparent border-t-cyan-500 rounded-full animate-spin" />
          {/* 내부 링 */}
          <div className="absolute inset-4 border-2 border-cyan-500/20 rounded-full" />
          {/* 중앙 점 */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-3 h-3 bg-cyan-500 rounded-full animate-pulse" />
          </div>
        </div>
        
        {/* 텍스트 */}
        <div className="text-cyan-400 font-mono text-lg tracking-widest animate-pulse">
          INITIALIZING
        </div>
        <div className="text-gray-500 font-mono text-sm mt-2">
          Tactical Battle System
        </div>
        
        {/* 진행 바 */}
        <div className="w-48 h-1 bg-gray-800 rounded-full mx-auto mt-6 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full animate-loading-bar"
            style={{
              animation: 'loading-bar 1.5s ease-in-out infinite',
            }}
          />
        </div>
        
        <style jsx>{`
          @keyframes loading-bar {
            0% {
              width: 0%;
              margin-left: 0%;
            }
            50% {
              width: 60%;
              margin-left: 20%;
            }
            100% {
              width: 0%;
              margin-left: 100%;
            }
          }
        `}</style>
      </div>
    </div>
  );
}

// 동적 임포트
const DynamicTacticalBattleCanvas = dynamic(
  () => import('./TacticalBattleCanvas'),
  {
    loading: () => <LoadingFallback />,
    ssr: false, // Canvas는 서버 사이드 렌더링 불필요
  }
);

// Props 타입
type TacticalBattleCanvasProps = ComponentProps<typeof DynamicTacticalBattleCanvas>;

// 래퍼 컴포넌트
export default function TacticalBattleCanvasLazy(props: TacticalBattleCanvasProps) {
  return <DynamicTacticalBattleCanvas {...props} />;
}




