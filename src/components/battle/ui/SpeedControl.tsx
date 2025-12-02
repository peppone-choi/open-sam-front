'use client';

/**
 * SpeedControl - 전투 속도 컨트롤 컴포넌트
 * 재생/일시정지, 속도 선택 (0.5x, 1x, 2x, 4x), 키보드 단축키
 */

import React, { useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useVoxelBattleStore } from '@/stores/voxelBattleStore';
import {
  selectPhase,
  selectSpeed,
  useBattleControls,
} from '@/stores/voxelBattleSelectors';
import type { BattleSpeed } from '@/stores/voxelBattleTypes';
import styles from './styles/overlay.module.css';

// ============================================================================
// 타입 정의
// ============================================================================

export interface SpeedControlProps {
  /** 추가 클래스명 */
  className?: string;
  /** 키보드 단축키 활성화 */
  enableKeyboardShortcuts?: boolean;
}

// ============================================================================
// 상수
// ============================================================================

const SPEED_OPTIONS: BattleSpeed[] = [0.5, 1, 2, 4];

// ============================================================================
// 메인 컴포넌트
// ============================================================================

export default function SpeedControl({
  className,
  enableKeyboardShortcuts = true,
}: SpeedControlProps) {
  const phase = useVoxelBattleStore(selectPhase);
  const currentSpeed = useVoxelBattleStore(selectSpeed);
  const { startBattle, pauseBattle, resumeBattle, setSpeed } = useBattleControls();

  const isRunning = phase === 'running';
  const isPaused = phase === 'paused';
  const isReady = phase === 'ready';
  const isEnded = phase === 'ended';
  const isActive = isRunning || isPaused;

  // 재생/일시정지 토글
  const handlePlayPause = useCallback(() => {
    if (isReady) {
      startBattle();
    } else if (isRunning) {
      pauseBattle();
    } else if (isPaused) {
      resumeBattle();
    }
  }, [isReady, isRunning, isPaused, startBattle, pauseBattle, resumeBattle]);

  // 속도 변경
  const handleSpeedChange = useCallback(
    (speed: BattleSpeed) => {
      setSpeed(speed);
    },
    [setSpeed]
  );

  // 속도 증가/감소
  const adjustSpeed = useCallback(
    (direction: 'up' | 'down') => {
      const currentIndex = SPEED_OPTIONS.indexOf(currentSpeed);
      if (direction === 'up' && currentIndex < SPEED_OPTIONS.length - 1) {
        setSpeed(SPEED_OPTIONS[currentIndex + 1]);
      } else if (direction === 'down' && currentIndex > 0) {
        setSpeed(SPEED_OPTIONS[currentIndex - 1]);
      }
    },
    [currentSpeed, setSpeed]
  );

  // 키보드 단축키
  useEffect(() => {
    if (!enableKeyboardShortcuts) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // 입력 필드에서는 무시
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      switch (e.key) {
        case ' ': // Space: 재생/일시정지
          e.preventDefault();
          handlePlayPause();
          break;
        case '+':
        case '=': // +: 속도 증가
          e.preventDefault();
          adjustSpeed('up');
          break;
        case '-': // -: 속도 감소
          e.preventDefault();
          adjustSpeed('down');
          break;
        case '1':
          e.preventDefault();
          setSpeed(0.5);
          break;
        case '2':
          e.preventDefault();
          setSpeed(1);
          break;
        case '3':
          e.preventDefault();
          setSpeed(2);
          break;
        case '4':
          e.preventDefault();
          setSpeed(4);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enableKeyboardShortcuts, handlePlayPause, adjustSpeed, setSpeed]);

  // 버튼 아이콘 결정
  const getPlayPauseIcon = () => {
    if (isReady) return '▶️';
    if (isRunning) return '⏸️';
    if (isPaused) return '▶️';
    if (isEnded) return '🔄';
    return '▶️';
  };

  return (
    <div className={`${styles.speedControlContainer} ${className ?? ''}`}>
      <motion.div
        className={styles.speedControlPanel}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        {/* 재생/일시정지 버튼 */}
        <motion.button
          className={styles.playPauseBtn}
          onClick={handlePlayPause}
          disabled={isEnded}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          title={
            isReady
              ? '전투 시작 (Space)'
              : isRunning
              ? '일시정지 (Space)'
              : '재개 (Space)'
          }
        >
          {getPlayPauseIcon()}
        </motion.button>

        {/* 속도 버튼 */}
        {isActive && (
          <div className={styles.speedButtons}>
            {SPEED_OPTIONS.map((speed, index) => (
              <motion.button
                key={speed}
                className={`${styles.speedBtn} ${
                  currentSpeed === speed ? styles.speedBtnActive : ''
                }`}
                onClick={() => handleSpeedChange(speed)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                title={`${speed}x 속도 (${index + 1}키)`}
              >
                {speed}x
              </motion.button>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}

// ============================================================================
// 간소화 버전 (인라인용)
// ============================================================================

export function SpeedControlInline({
  currentSpeed,
  isPaused,
  onPlayPause,
  onSpeedChange,
}: {
  currentSpeed: BattleSpeed;
  isPaused: boolean;
  onPlayPause: () => void;
  onSpeedChange: (speed: BattleSpeed) => void;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <button
        onClick={onPlayPause}
        style={{
          background: 'var(--overlay-accent)',
          border: 'none',
          borderRadius: '50%',
          width: 32,
          height: 32,
          cursor: 'pointer',
          color: '#1a1a2e',
          fontSize: 14,
        }}
      >
        {isPaused ? '▶' : '⏸'}
      </button>

      <div style={{ display: 'flex', gap: 4 }}>
        {SPEED_OPTIONS.map(speed => (
          <button
            key={speed}
            onClick={() => onSpeedChange(speed)}
            style={{
              background: currentSpeed === speed ? 'var(--overlay-accent)' : 'transparent',
              border: '1px solid var(--overlay-border)',
              borderRadius: 4,
              padding: '4px 8px',
              cursor: 'pointer',
              color: currentSpeed === speed ? '#1a1a2e' : 'var(--overlay-text-muted)',
              fontSize: 11,
              fontWeight: 600,
            }}
          >
            {speed}x
          </button>
        ))}
      </div>
    </div>
  );
}





