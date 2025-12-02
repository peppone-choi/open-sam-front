'use client';

/**
 * BattleHUD - 전투 상단 HUD 컴포넌트
 * 양측 장수 이름, 병력 바, 사기 바, 경과 시간 표시
 */

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useVoxelBattleStore } from '@/stores/voxelBattleStore';
import {
  selectPhase,
  selectElapsedTimeFormatted,
  selectAttackerForce,
  selectDefenderForce,
  selectBattleStats,
} from '@/stores/voxelBattleSelectors';
import styles from './styles/overlay.module.css';

// ============================================================================
// 타입 정의
// ============================================================================

export interface BattleHUDProps {
  /** 추가 클래스명 */
  className?: string;
  /** 전황 점수 표시 여부 */
  showBattleScore?: boolean;
}

// ============================================================================
// 서브 컴포넌트
// ============================================================================

interface TeamInfoProps {
  name: string;
  remaining: number;
  total: number;
  morale: number;
  kills: number;
  side: 'attacker' | 'defender';
}

function TeamInfo({ name, remaining, total, morale, kills, side }: TeamInfoProps) {
  const healthRatio = total > 0 ? (remaining / total) * 100 : 0;
  const moraleRatio = morale;
  
  const isAttacker = side === 'attacker';
  
  // 체력 바 색상 결정
  const getHealthBarClass = () => {
    if (healthRatio > 50) return styles.healthBarFill;
    if (healthRatio > 25) return styles.healthBarFillMid;
    return styles.healthBarFillLow;
  };

  return (
    <div className={`${styles.teamInfo} ${isAttacker ? styles.teamInfoAttacker : styles.teamInfoDefender}`}>
      <span className={styles.teamName}>{name}</span>
      
      <div className={styles.teamStats}>
        <span className={`${styles.troopCount} ${isAttacker ? styles.troopCountAttacker : styles.troopCountDefender}`}>
          {remaining.toLocaleString()}
        </span>
        <span>/ {total.toLocaleString()}</span>
        <span title="처치 수">⚔ {kills}</span>
      </div>
      
      {/* 병력 게이지 */}
      <div className={styles.gaugeBar}>
        <motion.div
          className={`${styles.gaugeFill} ${getHealthBarClass()}`}
          initial={{ width: 0 }}
          animate={{ width: `${healthRatio}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>
      
      {/* 사기 게이지 */}
      <div className={styles.gaugeBar} style={{ marginTop: 4 }}>
        <motion.div
          className={`${styles.gaugeFill} ${styles.gaugeFillMorale}`}
          initial={{ width: 0 }}
          animate={{ width: `${moraleRatio}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}

// ============================================================================
// 메인 컴포넌트
// ============================================================================

export default function BattleHUD({ className, showBattleScore = true }: BattleHUDProps) {
  const phase = useVoxelBattleStore(selectPhase);
  const elapsedTime = useVoxelBattleStore(selectElapsedTimeFormatted);
  const attackerForce = useVoxelBattleStore(selectAttackerForce);
  const defenderForce = useVoxelBattleStore(selectDefenderForce);
  const stats = useVoxelBattleStore(selectBattleStats);

  // 페이즈 텍스트 및 스타일
  const phaseInfo = useMemo(() => {
    switch (phase) {
      case 'loading':
        return { text: '로딩 중', className: styles.phaseReady };
      case 'ready':
        return { text: '준비 완료', className: styles.phaseReady };
      case 'running':
        return { text: '전투 중', className: styles.phaseRunning };
      case 'paused':
        return { text: '일시정지', className: styles.phasePaused };
      case 'ended':
        return { text: '전투 종료', className: styles.phaseEnded };
      default:
        return { text: '', className: '' };
    }
  }, [phase]);

  // 전황 점수 계산 (양측 병력 비율 기반)
  const battleScore = useMemo(() => {
    const attackerTotal = attackerForce?.totalUnits ?? 0;
    const defenderTotal = defenderForce?.totalUnits ?? 0;
    const attackerRemaining = attackerForce?.remainingUnits ?? 0;
    const defenderRemaining = defenderForce?.remainingUnits ?? 0;

    if (attackerTotal === 0 && defenderTotal === 0) {
      return { attacker: 50, defender: 50 };
    }

    const attackerRatio = attackerTotal > 0 ? attackerRemaining / attackerTotal : 0;
    const defenderRatio = defenderTotal > 0 ? defenderRemaining / defenderTotal : 0;
    
    const total = attackerRatio + defenderRatio;
    if (total === 0) return { attacker: 50, defender: 50 };
    
    const attackerScore = (attackerRatio / total) * 100;
    const defenderScore = (defenderRatio / total) * 100;

    return { attacker: attackerScore, defender: defenderScore };
  }, [attackerForce, defenderForce]);

  if (!attackerForce || !defenderForce) {
    return null;
  }

  return (
    <div className={`${styles.topHud} ${className ?? ''}`}>
      <div className={styles.hudPanel}>
        {/* 공격자 정보 (좌측) */}
        <TeamInfo
          name={attackerForce.generalName}
          remaining={attackerForce.remainingUnits}
          total={attackerForce.totalUnits}
          morale={stats.attackerMorale}
          kills={stats.attackerKills}
          side="attacker"
        />

        {/* 중앙 - 타이머 및 전황 */}
        <div className={styles.centerInfo}>
          <div className={styles.battleTimer}>
            <span className={styles.timerIcon}>⏱</span>
            <span>{elapsedTime}</span>
          </div>
          
          <span className={`${styles.battlePhase} ${phaseInfo.className}`}>
            {phaseInfo.text}
          </span>

          {/* 전황 점수 바 */}
          {showBattleScore && (
            <div className={styles.battleScore}>
              <div className={styles.scoreBar}>
                <motion.div
                  className={styles.scoreBarAttacker}
                  animate={{ width: `${battleScore.attacker}%` }}
                  transition={{ duration: 0.3 }}
                />
                <motion.div
                  className={styles.scoreBarDefender}
                  animate={{ width: `${battleScore.defender}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>
          )}
        </div>

        {/* 방어자 정보 (우측) */}
        <TeamInfo
          name={defenderForce.generalName}
          remaining={defenderForce.remainingUnits}
          total={defenderForce.totalUnits}
          morale={stats.defenderMorale}
          kills={stats.defenderKills}
          side="defender"
        />
      </div>
    </div>
  );
}

// ============================================================================
// 간소화 버전 (모바일/데모용)
// ============================================================================

export function BattleHUDCompact({ className }: { className?: string }) {
  const elapsedTime = useVoxelBattleStore(selectElapsedTimeFormatted);
  const attackerForce = useVoxelBattleStore(selectAttackerForce);
  const defenderForce = useVoxelBattleStore(selectDefenderForce);

  if (!attackerForce || !defenderForce) {
    return null;
  }

  return (
    <div className={`${styles.topHud} ${className ?? ''}`} style={{ padding: '8px' }}>
      <div className={styles.hudPanel} style={{ padding: '8px 12px', gap: '12px' }}>
        <span style={{ color: 'var(--team-attacker)', fontWeight: 600 }}>
          {attackerForce.remainingUnits.toLocaleString()}
        </span>
        <span style={{ color: 'var(--overlay-accent)', fontSize: '16px', fontWeight: 700 }}>
          {elapsedTime}
        </span>
        <span style={{ color: 'var(--team-defender)', fontWeight: 600 }}>
          {defenderForce.remainingUnits.toLocaleString()}
        </span>
      </div>
    </div>
  );
}





