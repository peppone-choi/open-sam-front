'use client';

/**
 * UnitInfoPanel - 선택된 유닛 정보 패널
 * 유닛 이름, 병력, 사기, 상태, 장수 정보 표시
 */

import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVoxelBattleStore } from '@/stores/voxelBattleStore';
import {
  selectAttackerForce,
  selectDefenderForce,
} from '@/stores/voxelBattleSelectors';
import type { SquadState, SquadStateType } from '@/stores/voxelBattleTypes';
import styles from './styles/overlay.module.css';

// ============================================================================
// 타입 정의
// ============================================================================

export interface UnitInfoPanelProps {
  /** 선택된 유닛 ID */
  selectedUnitId: string | null;
  /** 추가 클래스명 */
  className?: string;
}

// ============================================================================
// 유틸리티
// ============================================================================

const UNIT_ICONS: Record<string, string> = {
  footman: '🗡️',
  archer: '🏹',
  cavalry: '🐎',
  wizard: '✨',
  siege: '⚙️',
  castle: '🏰',
  default: '⚔️',
};

const STATE_INFO: Record<SquadStateType, { text: string; className: string }> = {
  idle: { text: '대기', className: styles.stateIdle },
  moving: { text: '이동', className: styles.stateMoving },
  fighting: { text: '전투', className: styles.stateFighting },
  routing: { text: '후퇴', className: styles.stateRouting },
  dead: { text: '전멸', className: styles.stateDead },
};

function getUnitCategory(unitId: number): string {
  if (unitId === 1000) return 'castle';
  if (unitId >= 1100 && unitId < 1200) return 'footman';
  if (unitId >= 1200 && unitId < 1300) return 'archer';
  if (unitId >= 1300 && unitId < 1400) return 'cavalry';
  if (unitId >= 1400 && unitId < 1450) return 'wizard';
  if (unitId >= 1450 && unitId < 1500) return 'regional';
  if (unitId >= 1500) return 'siege';
  return 'default';
}

// ============================================================================
// 메인 컴포넌트
// ============================================================================

export default function UnitInfoPanel({ selectedUnitId, className }: UnitInfoPanelProps) {
  const attackerForce = useVoxelBattleStore(selectAttackerForce);
  const defenderForce = useVoxelBattleStore(selectDefenderForce);

  // 선택된 유닛 찾기
  const selectedUnit = useMemo((): { squad: SquadState; side: 'attacker' | 'defender'; generalName: string } | null => {
    if (!selectedUnitId) return null;

    const attackerSquad = attackerForce?.squads.find(s => s.id === selectedUnitId);
    if (attackerSquad) {
      return { squad: attackerSquad, side: 'attacker', generalName: attackerForce.generalName };
    }

    const defenderSquad = defenderForce?.squads.find(s => s.id === selectedUnitId);
    if (defenderSquad) {
      return { squad: defenderSquad, side: 'defender', generalName: defenderForce.generalName };
    }

    return null;
  }, [selectedUnitId, attackerForce, defenderForce]);

  // 체력 비율에 따른 바 색상
  const getHealthBarClass = (ratio: number) => {
    if (ratio > 50) return styles.healthBarFill;
    if (ratio > 25) return styles.healthBarFillMid;
    return styles.healthBarFillLow;
  };

  return (
    <div className={`${styles.unitPanelContainer} ${className ?? ''}`}>
      <AnimatePresence mode="wait">
        {selectedUnit ? (
          <motion.div
            key={selectedUnit.squad.id}
            className={styles.unitPanel}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {/* 헤더 */}
            <div className={styles.unitPanelHeader}>
              <div
                className={`${styles.unitIcon} ${
                  selectedUnit.side === 'attacker' ? styles.unitIconAttacker : styles.unitIconDefender
                }`}
              >
                {UNIT_ICONS[getUnitCategory(selectedUnit.squad.unitId)] ?? UNIT_ICONS.default}
              </div>

              <div className={styles.unitTitle}>
                <div className={styles.unitName}>{selectedUnit.squad.unitName}</div>
                <div className={styles.unitType}>
                  {selectedUnit.side === 'attacker' ? '아군' : '적군'} · #{selectedUnit.squad.unitId}
                </div>
              </div>

              <span className={`${styles.unitState} ${STATE_INFO[selectedUnit.squad.state].className}`}>
                {STATE_INFO[selectedUnit.squad.state].text}
              </span>
            </div>

            {/* 바디 */}
            <div className={styles.unitPanelBody}>
              {/* 병력 */}
              <div className={styles.statRow}>
                <span className={styles.statLabel}>
                  <span>👥</span> 병력
                </span>
                <div className={styles.statBarContainer}>
                  <div className={styles.statBar}>
                    <motion.div
                      className={getHealthBarClass(
                        (selectedUnit.squad.aliveSoldiers / selectedUnit.squad.totalSoldiers) * 100
                      )}
                      initial={{ width: 0 }}
                      animate={{
                        width: `${(selectedUnit.squad.aliveSoldiers / selectedUnit.squad.totalSoldiers) * 100}%`,
                      }}
                      transition={{ duration: 0.4 }}
                    />
                  </div>
                  <span className={styles.statValue}>
                    {selectedUnit.squad.aliveSoldiers}/{selectedUnit.squad.totalSoldiers}
                  </span>
                </div>
              </div>

              {/* 사기 */}
              <div className={styles.statRow}>
                <span className={styles.statLabel}>
                  <span>🔥</span> 사기
                </span>
                <div className={styles.statBarContainer}>
                  <div className={styles.statBar}>
                    <motion.div
                      className={styles.moraleBarFill}
                      initial={{ width: 0 }}
                      animate={{ width: `${selectedUnit.squad.morale}%` }}
                      transition={{ duration: 0.4 }}
                    />
                  </div>
                  <span className={styles.statValue}>{Math.round(selectedUnit.squad.morale)}%</span>
                </div>
              </div>

              {/* 경험치 */}
              <div className={styles.statRow}>
                <span className={styles.statLabel}>
                  <span>⭐</span> 경험
                </span>
                <span className={styles.statValue}>{selectedUnit.squad.experience}</span>
              </div>

              {/* 진형 */}
              <div className={styles.statRow}>
                <span className={styles.statLabel}>
                  <span>📐</span> 진형
                </span>
                <span className={styles.statValue} style={{ textTransform: 'capitalize' }}>
                  {selectedUnit.squad.formation}
                </span>
              </div>

              {/* 장수 정보 */}
              <div className={styles.generalInfo}>
                <div className={styles.generalName}>
                  👤 {selectedUnit.generalName}
                </div>
                <div className={styles.generalBonus}>
                  소속 부대장
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="empty"
            className={styles.unitPanel}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className={styles.unitPanelEmpty}>
              유닛을 선택하세요
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================================================
// 간소화 버전
// ============================================================================

export function UnitInfoPanelCompact({
  squad,
  side,
}: {
  squad: SquadState | null;
  side?: 'attacker' | 'defender';
}) {
  if (!squad) {
    return (
      <div className={styles.unitPanel} style={{ padding: 12 }}>
        <span style={{ color: 'var(--overlay-text-muted)', fontSize: 12 }}>
          유닛 선택 없음
        </span>
      </div>
    );
  }

  const healthRatio = (squad.aliveSoldiers / squad.totalSoldiers) * 100;

  return (
    <div className={styles.unitPanel} style={{ padding: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <span style={{ fontSize: 20 }}>
          {UNIT_ICONS[getUnitCategory(squad.unitId)] ?? UNIT_ICONS.default}
        </span>
        <span style={{ fontWeight: 600, color: 'var(--overlay-text)' }}>
          {squad.unitName}
        </span>
        <span className={`${styles.unitState} ${STATE_INFO[squad.state].className}`}>
          {STATE_INFO[squad.state].text}
        </span>
      </div>

      <div style={{ display: 'flex', gap: 16, fontSize: 12 }}>
        <span>
          병력: {squad.aliveSoldiers}/{squad.totalSoldiers}
        </span>
        <span>
          사기: {Math.round(squad.morale)}%
        </span>
      </div>
    </div>
  );
}





