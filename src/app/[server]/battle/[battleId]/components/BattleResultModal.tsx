'use client';

/**
 * 전투 결과 모달 컴포넌트
 * 
 * 전투가 끝났을 때 결과를 표시합니다.
 */

import React, { useEffect, useState } from 'react';
import type { VoxelBattleResult } from '@/lib/battle/types/BattleTypes';

// ============================================================================
// 타입 정의
// ============================================================================

interface BattleResultModalProps {
  result: VoxelBattleResult;
  attackerName: string;
  defenderName: string;
  onClose: () => void;
  onReplay?: () => void;
  onGoBack?: () => void;
}

// ============================================================================
// 컴포넌트
// ============================================================================

export default function BattleResultModal({
  result,
  attackerName,
  defenderName,
  onClose,
  onReplay,
  onGoBack,
}: BattleResultModalProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  // 애니메이션 시작
  useEffect(() => {
    requestAnimationFrame(() => setIsVisible(true));
    const timer = setTimeout(() => setShowDetails(true), 500);
    return () => clearTimeout(timer);
  }, []);

  // 결과 계산
  const isAttackerWin = result.winner === 'attacker';
  const isDraw = result.winner === 'draw';
  const winnerName = isDraw ? '무승부' : (isAttackerWin ? attackerName : defenderName);
  
  // 피해 계산
  const attackerLosses = result.stats.totalKills.defender;
  const defenderLosses = result.stats.totalKills.attacker;
  
  // 생존율 계산 (임시)
  const attackerSurvivalRate = result.attackerRemaining > 0 ? 
    Math.round((result.attackerRemaining / (result.attackerRemaining + attackerLosses)) * 100) : 0;
  const defenderSurvivalRate = result.defenderRemaining > 0 ?
    Math.round((result.defenderRemaining / (result.defenderRemaining + defenderLosses)) * 100) : 0;

  // 닫기 핸들러
  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  return (
    <div 
      className={`
        fixed inset-0 z-[100] flex items-center justify-center p-4
        bg-black/80 backdrop-blur-sm
        transition-opacity duration-300
        ${isVisible ? 'opacity-100' : 'opacity-0'}
      `}
      onClick={handleClose}
    >
      <div 
        className={`
          relative max-w-lg w-full
          bg-gradient-to-b from-gray-900 to-gray-950
          border border-white/10 rounded-2xl
          shadow-2xl shadow-black/50
          overflow-hidden
          transform transition-all duration-500
          ${isVisible ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'}
        `}
        onClick={e => e.stopPropagation()}
      >
        {/* 상단 배너 */}
        <div className={`
          relative py-8 px-6 text-center overflow-hidden
          ${isDraw 
            ? 'bg-gradient-to-r from-gray-800 to-gray-700' 
            : isAttackerWin 
              ? 'bg-gradient-to-r from-red-900/80 to-orange-900/80'
              : 'bg-gradient-to-r from-blue-900/80 to-cyan-900/80'
          }
        `}>
          {/* 배경 효과 */}
          <div className="absolute inset-0 opacity-30">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.2),transparent_70%)]" />
          </div>
          
          {/* 승리 아이콘 */}
          <div className={`
            text-6xl mb-3
            ${isVisible ? 'animate-bounce' : ''}
          `}
            style={{ animationDuration: '1s', animationIterationCount: 3 }}
          >
            {isDraw ? '🤝' : '🏆'}
          </div>
          
          {/* 결과 텍스트 */}
          <h2 className="text-3xl font-black text-white mb-2">
            {isDraw ? '무승부!' : `${winnerName} 승리!`}
          </h2>
          <p className="text-sm text-white/70">
            전투가 종료되었습니다
          </p>
        </div>

        {/* 상세 정보 */}
        <div className={`
          px-6 py-6 space-y-6
          transition-all duration-500 delay-300
          ${showDetails ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
        `}>
          {/* 피아 비교 */}
          <div className="grid grid-cols-2 gap-4">
            {/* 공격측 */}
            <div className={`
              p-4 rounded-xl text-center
              ${isAttackerWin ? 'bg-red-500/10 border border-red-500/30' : 'bg-gray-800/50 border border-white/5'}
            `}>
              <p className="text-xs text-gray-400 mb-1">공격측</p>
              <p className={`font-bold mb-2 ${isAttackerWin ? 'text-red-400' : 'text-gray-300'}`}>
                {attackerName}
              </p>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">생존</span>
                  <span className="text-white font-mono">
                    {result.attackerRemaining.toLocaleString()}명
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">피해</span>
                  <span className="text-red-400 font-mono">
                    -{attackerLosses.toLocaleString()}명
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">처치</span>
                  <span className="text-green-400 font-mono">
                    {defenderLosses.toLocaleString()}명
                  </span>
                </div>
              </div>
              {/* 생존율 바 */}
              <div className="mt-3">
                <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-red-500 to-orange-500 transition-all duration-1000"
                    style={{ width: `${attackerSurvivalRate}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">생존율 {attackerSurvivalRate}%</p>
              </div>
            </div>

            {/* 방어측 */}
            <div className={`
              p-4 rounded-xl text-center
              ${!isAttackerWin && !isDraw ? 'bg-blue-500/10 border border-blue-500/30' : 'bg-gray-800/50 border border-white/5'}
            `}>
              <p className="text-xs text-gray-400 mb-1">방어측</p>
              <p className={`font-bold mb-2 ${!isAttackerWin && !isDraw ? 'text-blue-400' : 'text-gray-300'}`}>
                {defenderName}
              </p>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">생존</span>
                  <span className="text-white font-mono">
                    {result.defenderRemaining.toLocaleString()}명
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">피해</span>
                  <span className="text-red-400 font-mono">
                    -{defenderLosses.toLocaleString()}명
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">처치</span>
                  <span className="text-green-400 font-mono">
                    {attackerLosses.toLocaleString()}명
                  </span>
                </div>
              </div>
              {/* 생존율 바 */}
              <div className="mt-3">
                <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all duration-1000"
                    style={{ width: `${defenderSurvivalRate}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">생존율 {defenderSurvivalRate}%</p>
              </div>
            </div>
          </div>

          {/* 전투 시간 */}
          <div className="text-center text-sm text-gray-500">
            전투 시간: {formatDuration(result.duration)}
          </div>
        </div>

        {/* 버튼 영역 */}
        <div className="px-6 pb-6 flex gap-3">
          {onReplay && (
            <button
              onClick={onReplay}
              className="flex-1 px-4 py-3 bg-gray-800 hover:bg-gray-700 text-white font-medium rounded-xl border border-white/10 transition-colors flex items-center justify-center gap-2"
            >
              🔄 다시 보기
            </button>
          )}
          {onGoBack && (
            <button
              onClick={onGoBack}
              className="flex-1 px-4 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              📋 목록으로
            </button>
          )}
        </div>

        {/* 닫기 버튼 */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          aria-label="닫기"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// 유틸리티 함수
// ============================================================================

/**
 * 밀리초를 읽기 좋은 형식으로 변환
 */
function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  
  if (minutes > 0) {
    return `${minutes}분 ${remainingSeconds}초`;
  }
  return `${seconds}초`;
}
