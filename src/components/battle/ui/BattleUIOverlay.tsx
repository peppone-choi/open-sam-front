'use client';

/**
 * BattleUIOverlay - 복셀 전투 UI 오버레이 메인 컨테이너
 * 모든 UI 요소를 통합하고 레이아웃을 관리합니다.
 */

import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVoxelBattleStore } from '@/stores/voxelBattleStore';
import {
  selectPhase,
  selectResult,
} from '@/stores/voxelBattleSelectors';
import BattleHUD, { BattleHUDCompact } from './BattleHUD';
import Minimap from './Minimap';
import UnitInfoPanel from './UnitInfoPanel';
import SpeedControl from './SpeedControl';
import BattleLog, { BattleLogToast } from './BattleLog';
import styles from './styles/overlay.module.css';

// ============================================================================
// 타입 정의
// ============================================================================

export interface BattleUIOverlayProps {
  /** 맵 크기 (월드 좌표) */
  mapSize?: { width: number; height: number };
  /** 현재 카메라 뷰포트 */
  viewport?: { x: number; z: number; width: number; height: number };
  /** 선택된 유닛 ID */
  selectedUnitId?: string | null;
  /** 카메라 이동 콜백 */
  onCameraMove?: (x: number, z: number) => void;
  /** 유닛 선택 콜백 */
  onUnitSelect?: (unitId: string | null) => void;
  /** UI 요소 표시 옵션 */
  showOptions?: {
    hud?: boolean;
    minimap?: boolean;
    unitInfo?: boolean;
    speedControl?: boolean;
    battleLog?: boolean;
    extraControls?: boolean;
  };
  /** 모바일 모드 */
  mobileMode?: boolean;
  /** 추가 클래스명 */
  className?: string;
}

// ============================================================================
// 추가 컨트롤 버튼
// ============================================================================

interface ExtraControlsProps {
  onFullscreen?: () => void;
  onSettings?: () => void;
  onExit?: () => void;
}

function ExtraControls({ onFullscreen, onSettings, onExit }: ExtraControlsProps) {
  const handleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
    onFullscreen?.();
  }, [onFullscreen]);

  return (
    <div className={styles.extraControls}>
      <button
        className={styles.extraBtn}
        onClick={handleFullscreen}
        title="전체화면"
      >
        ⛶
      </button>
      <button
        className={styles.extraBtn}
        onClick={onSettings}
        title="설정"
      >
        ⚙️
      </button>
      <button
        className={styles.extraBtn}
        onClick={onExit}
        title="나가기"
      >
        ✕
      </button>
    </div>
  );
}

// ============================================================================
// 결과 오버레이
// ============================================================================

function ResultOverlay() {
  const result = useVoxelBattleStore(selectResult);

  if (!result) return null;

  const winnerText = 
    result.winner === 'attacker' ? '공격측 승리!' :
    result.winner === 'defender' ? '방어측 승리!' : '무승부';
  
  const icon = result.winner === 'draw' ? '🤝' : '🏆';

  return (
    <motion.div
      className={styles.resultOverlay}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div
        className={styles.resultBanner}
        initial={{ scale: 0.5, opacity: 0, y: 50 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ 
          type: 'spring',
          stiffness: 200,
          damping: 15,
          delay: 0.3 
        }}
      >
        <motion.span
          className={styles.resultIcon}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.5, type: 'spring' }}
        >
          {icon}
        </motion.span>
        <h2 className={styles.resultTitle}>{winnerText}</h2>
        <p className={styles.resultSubtitle}>
          경과 시간: {Math.floor(result.duration / 60000)}분 {Math.floor((result.duration % 60000) / 1000)}초
        </p>
        <div style={{ marginTop: 16, fontSize: 14, color: 'var(--overlay-text-muted)' }}>
          <span style={{ marginRight: 16 }}>
            공격측 손실: {result.attackerLosses.toLocaleString()}명
          </span>
          <span>
            방어측 손실: {result.defenderLosses.toLocaleString()}명
          </span>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ============================================================================
// 메인 컴포넌트
// ============================================================================

export default function BattleUIOverlay({
  mapSize = { width: 200, height: 200 },
  viewport = { x: 0, z: 0, width: 100, height: 100 },
  selectedUnitId = null,
  onCameraMove,
  onUnitSelect,
  showOptions = {},
  mobileMode = false,
  className,
}: BattleUIOverlayProps) {
  const phase = useVoxelBattleStore(selectPhase);
  
  // UI 표시 옵션 (기본값: 모두 표시)
  const {
    hud = true,
    minimap = true,
    unitInfo = true,
    speedControl = true,
    battleLog = true,
    extraControls = true,
  } = showOptions;

  // 모바일에서는 일부 UI 숨김 처리
  const [minimapCollapsed, setMinimapCollapsed] = useState(mobileMode);
  const [logCollapsed, setLogCollapsed] = useState(mobileMode);

  // 반응형 감지
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // 유닛 클릭 핸들러
  const handleUnitClick = useCallback((unitId: string) => {
    onUnitSelect?.(unitId);
  }, [onUnitSelect]);

  // 설정 / 나가기 핸들러 (상위 컴포넌트에서 구현)
  const handleSettings = useCallback(() => {
    // TODO: 설정 모달 열기
    console.log('Settings clicked');
  }, []);

  const handleExit = useCallback(() => {
    // TODO: 전투 종료 확인 모달
    console.log('Exit clicked');
  }, []);

  const isEnded = phase === 'ended';
  const effectiveMobile = mobileMode || isMobile;

  return (
    <div className={`${styles.overlayContainer} ${className ?? ''}`}>
      {/* 상단 HUD */}
      {hud && (
        effectiveMobile ? (
          <BattleHUDCompact />
        ) : (
          <BattleHUD showBattleScore={true} />
        )
      )}

      {/* 좌측 전투 로그 */}
      {battleLog && !effectiveMobile && (
        <BattleLog
          maxVisible={30}
          defaultCollapsed={logCollapsed}
        />
      )}

      {/* 좌하단 유닛 정보 패널 */}
      {unitInfo && (
        <UnitInfoPanel selectedUnitId={selectedUnitId} />
      )}

      {/* 우하단 미니맵 */}
      {minimap && (
        <Minimap
          mapSize={mapSize}
          viewport={viewport}
          size={effectiveMobile ? 120 : 180}
          selectedUnitId={selectedUnitId}
          onCameraMove={onCameraMove}
          onUnitClick={handleUnitClick}
          collapsed={minimapCollapsed}
          onToggleCollapse={() => setMinimapCollapsed(!minimapCollapsed)}
        />
      )}

      {/* 하단 중앙 속도 컨트롤 */}
      {speedControl && (
        <SpeedControl enableKeyboardShortcuts={true} />
      )}

      {/* 우상단 추가 컨트롤 */}
      {extraControls && !effectiveMobile && (
        <ExtraControls
          onSettings={handleSettings}
          onExit={handleExit}
        />
      )}

      {/* 전투 종료 결과 오버레이 */}
      <AnimatePresence>
        {isEnded && <ResultOverlay />}
      </AnimatePresence>

      {/* 단축키 안내 (데스크톱) */}
      {!effectiveMobile && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          style={{
            position: 'absolute',
            bottom: 70,
            left: '50%',
            transform: 'translateX(-50%)',
            fontSize: 11,
            color: 'var(--overlay-text-muted)',
            pointerEvents: 'none',
            textAlign: 'center',
          }}
        >
          Space: 재생/정지 | +/-: 속도 조절 | 1-4: 속도 선택
        </motion.div>
      )}
    </div>
  );
}

// ============================================================================
// 간소화 버전 (데모/프리뷰용)
// ============================================================================

export function BattleUIOverlaySimple({
  selectedUnitId,
  onUnitSelect,
}: {
  selectedUnitId?: string | null;
  onUnitSelect?: (unitId: string | null) => void;
}) {
  return (
    <div className={styles.overlayContainer}>
      <BattleHUDCompact />
      <SpeedControl enableKeyboardShortcuts={true} />
      <UnitInfoPanel selectedUnitId={selectedUnitId ?? null} />
    </div>
  );
}





