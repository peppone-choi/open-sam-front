'use client';

/**
 * 전투 로딩 화면 컴포넌트
 * 
 * 전투 데이터 로딩 중 표시되는 화면입니다.
 */

import React, { useState, useEffect } from 'react';

// ============================================================================
// 타입 정의
// ============================================================================

interface BattleLoadingScreenProps {
  battleId: string;
  attackerName?: string;
  defenderName?: string;
}

// ============================================================================
// 상수
// ============================================================================

const LOADING_TIPS = [
  '💡 기병은 보병에게 강하지만, 창병에게 약합니다.',
  '💡 궁병은 후방에 배치하면 효과적입니다.',
  '💡 사기가 낮으면 부대가 붕괴될 수 있습니다.',
  '💡 장수의 통솔력은 부대 사기에 영향을 줍니다.',
  '💡 지형에 따라 유닛의 능력치가 달라집니다.',
  '💡 측면이나 후방 공격은 추가 피해를 줍니다.',
  '💡 휠을 돌려 확대/축소할 수 있습니다.',
  '💡 마우스 드래그로 카메라를 회전할 수 있습니다.',
  '💡 우클릭 드래그로 카메라를 이동할 수 있습니다.',
  '💡 속도 조절로 전투를 빠르게 볼 수 있습니다.',
];

// ============================================================================
// 컴포넌트
// ============================================================================

export default function BattleLoadingScreen({
  battleId,
  attackerName,
  defenderName,
}: BattleLoadingScreenProps) {
  const [currentTip, setCurrentTip] = useState(0);
  const [progress, setProgress] = useState(0);

  // 팁 순환
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTip((prev) => (prev + 1) % LOADING_TIPS.length);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  // 가짜 진행률 (UX용)
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) return prev;
        return prev + Math.random() * 10;
      });
    }, 300);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-gray-950 via-indigo-950/30 to-gray-950">
      {/* 배경 효과 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-80 h-80 bg-red-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -right-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      {/* 메인 컨텐츠 */}
      <div className="relative z-10 text-center px-6 max-w-lg">
        {/* 전투 정보 */}
        <div className="mb-8">
          <p className="text-sm text-gray-500 mb-2">전투 #{battleId}</p>
          {attackerName && defenderName ? (
            <div className="flex items-center justify-center gap-4">
              <span className="text-lg font-bold text-red-400">{attackerName}</span>
              <span className="text-2xl text-gray-600">⚔️</span>
              <span className="text-lg font-bold text-blue-400">{defenderName}</span>
            </div>
          ) : (
            <p className="text-xl font-bold text-gray-300">전투 준비 중...</p>
          )}
        </div>

        {/* 로딩 스피너 */}
        <div className="relative w-24 h-24 mx-auto mb-8">
          {/* 외부 링 */}
          <div className="absolute inset-0 border-4 border-gray-800 rounded-full" />
          <div 
            className="absolute inset-0 border-4 border-transparent border-t-indigo-500 border-r-indigo-500 rounded-full animate-spin"
            style={{ animationDuration: '1.5s' }}
          />
          {/* 내부 링 */}
          <div className="absolute inset-3 border-2 border-gray-800 rounded-full" />
          <div 
            className="absolute inset-3 border-2 border-transparent border-t-purple-500 rounded-full animate-spin"
            style={{ animationDuration: '1s', animationDirection: 'reverse' }}
          />
          {/* 중앙 아이콘 */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-2xl animate-bounce" style={{ animationDuration: '2s' }}>⚔️</span>
          </div>
        </div>

        {/* 진행 바 */}
        <div className="w-full max-w-xs mx-auto mb-6">
          <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-indigo-600 to-purple-500 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
          <p className="text-xs text-gray-600 mt-2 font-mono">
            {Math.floor(progress)}% 로딩 중...
          </p>
        </div>

        {/* 로딩 팁 */}
        <div className="min-h-[3rem] flex items-center justify-center">
          <p className="text-sm text-gray-400 animate-fade-in" key={currentTip}>
            {LOADING_TIPS[currentTip]}
          </p>
        </div>
      </div>

      {/* 하단 장식 */}
      <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-2">
        {LOADING_TIPS.map((_, idx) => (
          <div 
            key={idx}
            className={`w-1.5 h-1.5 rounded-full transition-colors duration-300 ${
              idx === currentTip ? 'bg-indigo-500' : 'bg-gray-700'
            }`}
          />
        ))}
      </div>

      {/* CSS 애니메이션 */}
      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }
      `}</style>
    </div>
  );
}
