'use client';

/**
 * 복셀 전투 페이지
 * 
 * 3D 복셀 기반 전투 뷰어 페이지입니다.
 * API 데이터를 로드하여 복셀 엔진에 전달합니다.
 */

import React, { useState, useCallback, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useToast } from '@/contexts/ToastContext';
import { useBattleData } from '../hooks/useBattleData';
import VoxelBattleView from '../components/VoxelBattleView';
import BattleLoadingScreen from '../components/BattleLoadingScreen';
import BattleResultModal from '../components/BattleResultModal';
import { BattleModeSwitchToggle } from '../components/BattleModeSwitch';
import BattleErrorBoundary from '../components/BattleErrorBoundary';
import type { VoxelBattleResult } from '@/lib/battle/types/BattleTypes';

export default function VoxelBattlePage() {
  const params = useParams();
  const router = useRouter();
  const { showToast } = useToast();
  
  const serverID = params?.server as string;
  const battleId = params?.battleId as string;
  
  // 전투 데이터 로드 (커스텀 훅)
  const { 
    battleData, 
    voxelData, 
    isLoading, 
    error, 
    refetch 
  } = useBattleData(battleId);
  
  // 전투 결과 상태
  const [battleResult, setBattleResult] = useState<VoxelBattleResult | null>(null);
  const [showResultModal, setShowResultModal] = useState(false);
  
  // 전체화면 상태
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // 모드 전환 핸들러
  const handleModeChange = useCallback((mode: '2d' | 'voxel') => {
    if (mode === '2d') {
      router.push(`/${serverID}/battle/${battleId}`);
    }
  }, [router, serverID, battleId]);
  
  // 전투 종료 핸들러
  const handleBattleEnd = useCallback((result: VoxelBattleResult) => {
    setBattleResult(result);
    setShowResultModal(true);
  }, []);
  
  // 결과 모달 닫기
  const handleCloseResult = useCallback(() => {
    setShowResultModal(false);
  }, []);
  
  // 전투 목록으로 돌아가기
  const handleGoBack = useCallback(() => {
    router.push(`/${serverID}/battle`);
  }, [router, serverID]);
  
  // 전체화면 토글
  const handleToggleFullscreen = useCallback(async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (err) {
      console.warn('전체화면 전환 실패:', err);
    }
  }, []);
  
  // 에러 처리
  if (error) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
        <div className="bg-gray-900/80 border border-red-500/30 rounded-xl p-8 max-w-md text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-red-400 mb-2">전투 데이터 로드 실패</h2>
          <p className="text-gray-400 mb-6">{error}</p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => refetch()}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg transition-colors"
            >
              다시 시도
            </button>
            <button
              onClick={handleGoBack}
              className="px-6 py-2 bg-gray-800 hover:bg-gray-700 text-white font-medium rounded-lg border border-white/10 transition-colors"
            >
              목록으로
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <BattleErrorBoundary onError={() => showToast('전투 렌더링 오류가 발생했습니다.', 'error')}>
      <div className="relative w-full h-screen bg-gray-950 overflow-hidden">
        {/* 상단 헤더 바 */}
        <header className={`
          absolute top-0 left-0 right-0 z-50 
          bg-gradient-to-b from-black/80 to-transparent
          px-4 py-3 flex items-center justify-between
          transition-opacity duration-300
          ${isFullscreen ? 'opacity-0 hover:opacity-100' : ''}
        `}>
          {/* 좌측: 뒤로가기 & 제목 */}
          <div className="flex items-center gap-4">
            <button
              onClick={handleGoBack}
              className="p-2 rounded-lg bg-gray-800/60 hover:bg-gray-700/80 text-white transition-colors"
              aria-label="뒤로가기"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="text-lg font-bold text-white">
                전투 #{battleId}
              </h1>
              {battleData && (
                <p className="text-xs text-gray-400">
                  {battleData.attacker?.general?.name || '공격측'} vs {battleData.defender?.general?.name || '방어측'}
                </p>
              )}
            </div>
          </div>
          
          {/* 우측: 컨트롤 버튼들 */}
          <div className="flex items-center gap-3">
            {/* 모드 전환 */}
            <BattleModeSwitchToggle
              currentMode="voxel"
              onModeChange={handleModeChange}
            />
            
            {/* 전체화면 버튼 */}
            <button
              onClick={handleToggleFullscreen}
              className="p-2 rounded-lg bg-gray-800/60 hover:bg-gray-700/80 text-white transition-colors"
              aria-label={isFullscreen ? '전체화면 종료' : '전체화면'}
            >
              {isFullscreen ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 9V4.5M9 9H4.5M15 9h4.5M15 9V4.5M9 15H4.5M9 15v4.5M15 15h4.5M15 15v4.5" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                </svg>
              )}
            </button>
          </div>
        </header>

        {/* 메인 컨텐츠 영역 */}
        <main className="w-full h-full">
          {isLoading ? (
            <BattleLoadingScreen 
              battleId={battleId}
              attackerName={battleData?.attacker?.general?.name}
              defenderName={battleData?.defender?.general?.name}
            />
          ) : voxelData ? (
            <Suspense fallback={<BattleLoadingScreen battleId={battleId} />}>
              <VoxelBattleView
                battleData={voxelData}
                onBattleEnd={handleBattleEnd}
              />
            </Suspense>
          ) : (
            <BattleLoadingScreen battleId={battleId} />
          )}
        </main>

        {/* 결과 모달 */}
        {showResultModal && battleResult && (
          <BattleResultModal
            result={battleResult}
            attackerName={battleData?.attacker?.general?.name || '공격측'}
            defenderName={battleData?.defender?.general?.name || '방어측'}
            onClose={handleCloseResult}
            onReplay={() => {
              setShowResultModal(false);
              setBattleResult(null);
              refetch();
            }}
            onGoBack={handleGoBack}
          />
        )}
      </div>
    </BattleErrorBoundary>
  );
}
