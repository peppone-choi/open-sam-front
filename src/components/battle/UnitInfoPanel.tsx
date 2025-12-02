'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import type { BattleUnit } from './TurnBasedBattleMap';
import styles from './UnitInfoPanel.module.css';

// ===== 타입 =====
interface UnitInfoPanelProps {
  unit: BattleUnit | null;
  showDetail?: boolean;
  onClose?: () => void;
}

interface SpecialSkill {
  id: string;
  name: string;
  description: string;
  icon: string;
  cooldown?: number;
  currentCooldown?: number;
}

interface Equipment {
  id: string;
  name: string;
  slot: 'weapon' | 'armor' | 'accessory';
  icon: string;
  stats: { [key: string]: number };
}

// ===== 상수 =====
const UNIT_TYPE_INFO: Record<string, { name: string; icon: string; color: string }> = {
  '1000': { name: '성벽', icon: '🏯', color: '#6b7280' },
  '1100': { name: '보병', icon: '🗡️', color: '#22c55e' },
  '1101': { name: '근위병', icon: '⚔️', color: '#22c55e' },
  '1200': { name: '궁병', icon: '🏹', color: '#3b82f6' },
  '1300': { name: '기병', icon: '🐴', color: '#f59e0b' },
  '1400': { name: '책사', icon: '🔮', color: '#a855f7' },
  '1500': { name: '공성', icon: '🎯', color: '#ef4444' },
};

// ===== 메인 컴포넌트 =====
export default function UnitInfoPanel({
  unit,
  showDetail = true,
  onClose,
}: UnitInfoPanelProps) {
  const [activeTab, setActiveTab] = useState<'stats' | 'skills' | 'items'>('stats');

  // 유닛 타입 정보
  const unitType = useMemo(() => {
    if (!unit) return null;
    const typeKey = String(unit.crewType);
    const baseType = typeKey.substring(0, 4).padEnd(4, '0');
    return UNIT_TYPE_INFO[baseType] || UNIT_TYPE_INFO['1100'];
  }, [unit]);

  // HP/사기 퍼센트
  const hpPercent = unit ? (unit.hp / unit.maxHp) * 100 : 0;
  const moralePercent = unit ? (unit.morale / unit.maxMorale) * 100 : 0;
  const crewPercent = unit ? (unit.crew / unit.maxCrew) * 100 : 0;

  // HP 색상
  const hpColor = hpPercent > 60 ? '#22c55e' : hpPercent > 30 ? '#f59e0b' : '#ef4444';
  const moraleColor = moralePercent > 60 ? '#a855f7' : moralePercent > 30 ? '#f59e0b' : '#ef4444';

  if (!unit) {
    return (
      <motion.div
        className={styles.panelContainer + ' ' + styles.empty}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
      >
        <div className={styles.emptyState}>
          <span className={styles.emptyIcon}>👆</span>
          <span className={styles.emptyText}>유닛을 선택하세요</span>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className={styles.panelContainer}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      {/* 헤더 */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <span
            className={styles.teamBadge}
            style={{ backgroundColor: unit.isEnemy ? '#ef4444' : '#3b82f6' }}
          >
            {unit.isEnemy ? '적' : '아군'}
          </span>
          <span
            className={styles.typeBadge}
            style={{ backgroundColor: unitType?.color || '#6b7280' }}
          >
            {unitType?.icon} {unitType?.name}
          </span>
        </div>
        {onClose && (
          <button className={styles.closeBtn} onClick={onClose}>
            ✕
          </button>
        )}
      </div>

      {/* 프로필 섹션 */}
      <div className={styles.profileSection}>
        <div className={styles.portrait}>
          {unit.portraitUrl ? (
            <Image
              src={unit.portraitUrl}
              alt={unit.generalName}
              fill
              style={{ objectFit: 'cover' }}
            />
          ) : (
            <div className={styles.portraitFallback}>
              {unit.generalName.substring(0, 1)}
            </div>
          )}
          {/* 레벨 뱃지 (있다면) */}
        </div>
        <div className={styles.profileInfo}>
          <h3 className={styles.generalName}>{unit.generalName}</h3>
          <div className={styles.crewInfo}>
            <span className={styles.crewIcon}>⚔️</span>
            <span className={styles.crewCount}>{unit.crew.toLocaleString()}</span>
            <span className={styles.crewMax}>/ {unit.maxCrew.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* 게이지 섹션 */}
      <div className={styles.gaugeSection}>
        {/* HP */}
        <div className={styles.gaugeRow}>
          <span className={styles.gaugeLabel}>HP</span>
          <div className={styles.gaugeBar}>
            <motion.div
              className={styles.gaugeFill}
              style={{ backgroundColor: hpColor }}
              initial={{ width: 0 }}
              animate={{ width: `${hpPercent}%` }}
              transition={{ duration: 0.5 }}
            />
            <span className={styles.gaugeText}>
              {unit.hp} / {unit.maxHp}
            </span>
          </div>
        </div>

        {/* 사기 */}
        <div className={styles.gaugeRow}>
          <span className={styles.gaugeLabel}>사기</span>
          <div className={styles.gaugeBar}>
            <motion.div
              className={styles.gaugeFill}
              style={{ backgroundColor: moraleColor }}
              initial={{ width: 0 }}
              animate={{ width: `${moralePercent}%` }}
              transition={{ duration: 0.5 }}
            />
            <span className={styles.gaugeText}>
              {unit.morale} / {unit.maxMorale}
            </span>
          </div>
        </div>

        {/* 병력 */}
        <div className={styles.gaugeRow}>
          <span className={styles.gaugeLabel}>병력</span>
          <div className={styles.gaugeBar}>
            <motion.div
              className={styles.gaugeFill}
              style={{ backgroundColor: '#60a5fa' }}
              initial={{ width: 0 }}
              animate={{ width: `${crewPercent}%` }}
              transition={{ duration: 0.5 }}
            />
            <span className={styles.gaugeText}>
              {formatCrew(unit.crew)} / {formatCrew(unit.maxCrew)}
            </span>
          </div>
        </div>
      </div>

      {/* 상세 탭 */}
      {showDetail && (
        <>
          <div className={styles.tabNav}>
            <button
              className={`${styles.tabBtn} ${activeTab === 'stats' ? styles.active : ''}`}
              onClick={() => setActiveTab('stats')}
            >
              스탯
            </button>
            <button
              className={`${styles.tabBtn} ${activeTab === 'skills' ? styles.active : ''}`}
              onClick={() => setActiveTab('skills')}
            >
              특기
            </button>
            <button
              className={`${styles.tabBtn} ${activeTab === 'items' ? styles.active : ''}`}
              onClick={() => setActiveTab('items')}
            >
              장비
            </button>
          </div>

          <div className={styles.tabContent}>
            <AnimatePresence mode="wait">
              {/* 스탯 탭 */}
              {activeTab === 'stats' && (
                <motion.div
                  key="stats"
                  className={styles.statsTab}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <div className={styles.statsGrid}>
                    <StatItem icon="⚔️" label="공격력" value={unit.attack} color="#ef4444" />
                    <StatItem icon="🛡️" label="방어력" value={unit.defense} color="#3b82f6" />
                    <StatItem icon="🚶" label="이동력" value={unit.moveRange} color="#22c55e" />
                    <StatItem icon="🎯" label="사거리" value={unit.attackRange} color="#f59e0b" />
                  </div>
                </motion.div>
              )}

              {/* 특기 탭 */}
              {activeTab === 'skills' && (
                <motion.div
                  key="skills"
                  className={styles.skillsTab}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <div className={styles.noData}>
                    특기 정보가 없습니다
                  </div>
                </motion.div>
              )}

              {/* 장비 탭 */}
              {activeTab === 'items' && (
                <motion.div
                  key="items"
                  className={styles.itemsTab}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <div className={styles.noData}>
                    장착 장비가 없습니다
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </>
      )}

      {/* 상태 표시 */}
      <div className={styles.statusSection}>
        {unit.hasMoved && (
          <span className={styles.statusTag} style={{ backgroundColor: '#f59e0b' }}>
            이동완료
          </span>
        )}
        {unit.hasActed && (
          <span className={styles.statusTag} style={{ backgroundColor: '#6b7280' }}>
            행동완료
          </span>
        )}
        {unit.morale < 30 && (
          <span className={styles.statusTag} style={{ backgroundColor: '#ef4444' }}>
            사기저하
          </span>
        )}
        {unit.hp < unit.maxHp * 0.3 && (
          <span className={styles.statusTag} style={{ backgroundColor: '#dc2626' }}>
            부상
          </span>
        )}
      </div>
    </motion.div>
  );
}

// ===== 서브 컴포넌트 =====
function StatItem({
  icon,
  label,
  value,
  color,
}: {
  icon: string;
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className={styles.statItem}>
      <span className={styles.statIcon}>{icon}</span>
      <span className={styles.statLabel}>{label}</span>
      <span className={styles.statValue} style={{ color }}>
        {value}
      </span>
    </div>
  );
}

// ===== 유틸 =====
function formatCrew(crew: number): string {
  if (crew >= 10000) return `${(crew / 10000).toFixed(1)}만`;
  if (crew >= 1000) return `${(crew / 1000).toFixed(1)}천`;
  return String(crew);
}


