'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './TotalWarUnitCard.module.css';

// ===== 타입 정의 =====
export type TWFormationType = 'line' | 'column' | 'square' | 'wedge' | 'loose' | 'shield_wall' | 'testudo';
export type TWStanceType = 'aggressive' | 'defensive' | 'skirmish' | 'hold';

export interface SpecialAbility {
  id: string;
  name: string;
  icon: string;
  description: string;
  cooldown: number; // 초
  currentCooldown?: number;
  isActive?: boolean;
  cost?: number; // 사기 소모량
}

export interface TotalWarSquad {
  id: string;
  name: string;
  generalName?: string;
  category: string;
  teamId: 'attacker' | 'defender';
  
  // 병력 정보
  aliveSoldiers: number;
  totalSoldiers: number;
  
  // 스탯
  morale: number; // 0-100
  fatigue: number; // 0-100 (높을수록 피로)
  experience: number; // 0-100
  
  // 전투 능력
  attack: number;
  defense: number;
  chargeBonus: number;
  speed: number;
  
  // ★ 탄약 (원거리 유닛만)
  ammo?: number;        // 현재 탄약
  maxAmmo?: number;     // 최대 탄약
  isRanged?: boolean;   // 원거리 유닛 여부
  
  // 현재 상태
  formation: TWFormationType;
  stance: TWStanceType;
  state: 'idle' | 'moving' | 'engaging' | 'routing' | 'wavering' | 'destroyed';
  
  // 특수 능력
  abilities?: SpecialAbility[];
  
  // 추가 정보
  kills?: number;
  isSelected?: boolean;
}

export interface TotalWarUnitCardProps {
  squad: TotalWarSquad | null;
  onFormationChange?: (formation: TWFormationType) => void;
  onStanceChange?: (stance: TWStanceType) => void;
  onAbilityUse?: (abilityId: string) => void;
  compact?: boolean;
  showAbilities?: boolean;
}

// ===== 상수 =====
const FORMATION_INFO: Record<TWFormationType, { icon: string; name: string; desc: string }> = {
  line: { icon: '═══', name: '횡대', desc: '넓은 전선, 균형잡힌 진형' },
  column: { icon: '║', name: '종대', desc: '빠른 이동, 좁은 전선' },
  square: { icon: '□', name: '방진', desc: '전방위 방어, 기병 대응' },
  wedge: { icon: '▲', name: '쐐기', desc: '돌파력 강화, 돌격용' },
  loose: { icon: '···', name: '산개', desc: '원거리 공격 회피, 궁병용' },
  shield_wall: { icon: '▬▬▬', name: '방패진', desc: '최대 방어력, 느린 이동' },
  testudo: { icon: '■■■', name: '거북진', desc: '화살 방어, 공성용' },
};

const STANCE_INFO: Record<TWStanceType, { icon: string; name: string; desc: string; color: string }> = {
  aggressive: { icon: '⚔️', name: '공격', desc: '공격력↑ 방어력↓', color: '#ff4a4a' },
  defensive: { icon: '🛡️', name: '방어', desc: '방어력↑ 공격력↓', color: '#4a9eff' },
  skirmish: { icon: '🏹', name: '산개', desc: '자동 후퇴, 원거리 유리', color: '#4aff9e' },
  hold: { icon: '⚓', name: '고수', desc: '후퇴 금지, 사기 보너스', color: '#ffd700' },
};

const STATE_INFO: Record<string, { label: string; color: string }> = {
  idle: { label: '대기', color: '#4CAF50' },
  moving: { label: '이동중', color: '#2196F3' },
  engaging: { label: '교전중', color: '#FF9800' },
  wavering: { label: '동요', color: '#FFC107' },
  routing: { label: '탈주중', color: '#F44336' },
  destroyed: { label: '괴멸', color: '#9E9E9E' },
};

const CATEGORY_ICONS: Record<string, string> = {
  sword_infantry: '🗡️',
  ji_infantry: '⛏️',
  spear_guard: '🛡️',
  halberd_infantry: '🪓',
  archer: '🏹',
  crossbow: '🎯',
  cavalry: '🐴',
  shock_cavalry: '⚔️🐴',
  horse_archer: '🏹🐴',
  chariot: '🛞',
};

// ===== 서브 컴포넌트 =====
function StatBar({
  value,
  maxValue,
  label,
  color,
  showValue = true,
  animate = true,
}: {
  value: number;
  maxValue: number;
  label: string;
  color: string;
  showValue?: boolean;
  animate?: boolean;
}) {
  const percentage = Math.min(100, Math.max(0, (value / maxValue) * 100));
  
  // 색상 변화 (낮을수록 경고색)
  const dynamicColor = useMemo(() => {
    if (percentage > 60) return color;
    if (percentage > 30) return '#FFC107';
    return '#F44336';
  }, [percentage, color]);

  return (
    <div className={styles.statBar}>
      <span className={styles.statLabel}>{label}</span>
      <div className={styles.barTrack}>
        <motion.div
          className={styles.barFill}
          style={{ backgroundColor: dynamicColor }}
          initial={animate ? { width: 0 } : false}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
        {showValue && (
          <span className={styles.barValue}>
            {Math.round(value)}{maxValue !== 100 && ` / ${maxValue}`}
          </span>
        )}
      </div>
    </div>
  );
}

function FormationButton({
  formation,
  isActive,
  onClick,
  disabled,
}: {
  formation: TWFormationType;
  isActive: boolean;
  onClick: () => void;
  disabled?: boolean;
}) {
  const info = FORMATION_INFO[formation];
  
  return (
    <button
      className={`${styles.formationBtn} ${isActive ? styles.active : ''}`}
      onClick={onClick}
      disabled={disabled}
      title={`${info.name}: ${info.desc}`}
    >
      <span className={styles.formationIcon}>{info.icon}</span>
    </button>
  );
}

function StanceButton({
  stance,
  isActive,
  onClick,
  disabled,
}: {
  stance: TWStanceType;
  isActive: boolean;
  onClick: () => void;
  disabled?: boolean;
}) {
  const info = STANCE_INFO[stance];
  
  return (
    <button
      className={`${styles.stanceBtn} ${isActive ? styles.active : ''}`}
      onClick={onClick}
      disabled={disabled}
      title={`${info.name}: ${info.desc}`}
      style={{
        borderColor: isActive ? info.color : undefined,
        boxShadow: isActive ? `0 0 8px ${info.color}` : undefined,
      }}
    >
      <span className={styles.stanceIcon}>{info.icon}</span>
      <span className={styles.stanceName}>{info.name}</span>
    </button>
  );
}

function AbilityButton({
  ability,
  onClick,
  disabled,
}: {
  ability: SpecialAbility;
  onClick: () => void;
  disabled?: boolean;
}) {
  const isOnCooldown = (ability.currentCooldown ?? 0) > 0;
  const cooldownPercent = isOnCooldown
    ? ((ability.currentCooldown ?? 0) / ability.cooldown) * 100
    : 0;

  return (
    <button
      className={`${styles.abilityBtn} ${ability.isActive ? styles.active : ''} ${isOnCooldown ? styles.cooldown : ''}`}
      onClick={onClick}
      disabled={disabled || isOnCooldown}
      title={`${ability.name}: ${ability.description}${ability.cost ? ` (사기 ${ability.cost} 소모)` : ''}`}
    >
      <span className={styles.abilityIcon}>{ability.icon}</span>
      {isOnCooldown && (
        <div
          className={styles.cooldownOverlay}
          style={{ height: `${cooldownPercent}%` }}
        />
      )}
      {isOnCooldown && (
        <span className={styles.cooldownText}>
          {Math.ceil(ability.currentCooldown ?? 0)}
        </span>
      )}
    </button>
  );
}

// ===== 메인 컴포넌트 =====
export default function TotalWarUnitCard({
  squad,
  onFormationChange,
  onStanceChange,
  onAbilityUse,
  compact = false,
  showAbilities = true,
}: TotalWarUnitCardProps) {
  const [activeTab, setActiveTab] = useState<'formation' | 'stance'>('formation');

  // 병력 비율
  const soldierRatio = squad ? (squad.aliveSoldiers / squad.totalSoldiers) * 100 : 0;
  
  // 카테고리 아이콘
  const categoryIcon = squad ? CATEGORY_ICONS[squad.category] || '⚔️' : '⚔️';
  
  // 상태 정보
  const stateInfo = squad ? STATE_INFO[squad.state] : STATE_INFO.idle;

  if (!squad) {
    return (
      <motion.div
        className={`${styles.container} ${styles.empty}`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className={styles.emptyContent}>
          <span className={styles.emptyIcon}>👆</span>
          <span className={styles.emptyText}>부대를 선택하세요</span>
        </div>
      </motion.div>
    );
  }

  if (compact) {
    return (
      <motion.div
        className={`${styles.container} ${styles.compact}`}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
      >
        {/* 컴팩트 헤더 */}
        <div className={styles.compactHeader}>
          <span className={styles.categoryIcon}>{categoryIcon}</span>
          <span className={styles.squadName}>{squad.name}</span>
          <span className={styles.soldierCount}>
            {squad.aliveSoldiers}/{squad.totalSoldiers}
          </span>
        </div>
        
        {/* 컴팩트 바 */}
        <div className={styles.compactBars}>
          <div
            className={styles.compactBar}
            style={{
              width: `${soldierRatio}%`,
              backgroundColor: soldierRatio > 60 ? '#4CAF50' : soldierRatio > 30 ? '#FFC107' : '#F44336',
            }}
          />
        </div>
        
        {/* 컴팩트 상태 */}
        <div className={styles.compactStatus}>
          <span style={{ color: stateInfo.color }}>{stateInfo.label}</span>
          <span>{FORMATION_INFO[squad.formation].name}</span>
        </div>
      </motion.div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={squad.id}
        className={styles.container}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
      >
        {/* 헤더 */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <span className={styles.categoryIcon}>{categoryIcon}</span>
            <div className={styles.nameSection}>
              <h3 className={styles.squadName}>{squad.name}</h3>
              {squad.generalName && (
                <span className={styles.generalName}>지휘: {squad.generalName}</span>
              )}
            </div>
          </div>
          <div className={styles.headerRight}>
            <span
              className={styles.stateTag}
              style={{ backgroundColor: stateInfo.color }}
            >
              {stateInfo.label}
            </span>
            {squad.kills !== undefined && squad.kills > 0 && (
              <span className={styles.killCount}>💀 {squad.kills}</span>
            )}
          </div>
        </div>

        {/* 병력 표시 */}
        <div className={styles.soldierSection}>
          <div className={styles.soldierMain}>
            <span className={styles.soldierIcon}>⚔️</span>
            <span className={styles.soldierLabel}>병력</span>
            <span className={styles.soldierValue}>
              {squad.aliveSoldiers.toLocaleString()}
              <span className={styles.soldierMax}>/ {squad.totalSoldiers.toLocaleString()}</span>
            </span>
          </div>
          <div className={styles.soldierBarTrack}>
            <motion.div
              className={styles.soldierBarFill}
              initial={{ width: 0 }}
              animate={{ width: `${soldierRatio}%` }}
              style={{
                backgroundColor: soldierRatio > 60 ? '#ffd700' : soldierRatio > 30 ? '#FFC107' : '#F44336',
              }}
            />
          </div>
        </div>

        {/* 스탯 바 */}
        <div className={styles.statSection}>
          <StatBar value={squad.morale} maxValue={100} label="사기" color="#9c27b0" />
          <StatBar value={squad.fatigue} maxValue={100} label="피로" color="#ff9800" />
          {/* ★ 탄약 바 (원거리 유닛만) */}
          {squad.isRanged && squad.maxAmmo && squad.maxAmmo > 0 && (
            <StatBar 
              value={squad.ammo ?? 0} 
              maxValue={squad.maxAmmo} 
              label="🏹 탄약" 
              color="#00bcd4" 
            />
          )}
        </div>

        {/* 전투 능력 */}
        <div className={styles.combatStats}>
          <div className={styles.combatStat}>
            <span className={styles.combatIcon}>⚔️</span>
            <span className={styles.combatLabel}>공격</span>
            <span className={styles.combatValue}>{squad.attack}</span>
          </div>
          <div className={styles.combatStat}>
            <span className={styles.combatIcon}>🛡️</span>
            <span className={styles.combatLabel}>방어</span>
            <span className={styles.combatValue}>{squad.defense}</span>
          </div>
          <div className={styles.combatStat}>
            <span className={styles.combatIcon}>⚡</span>
            <span className={styles.combatLabel}>돌격</span>
            <span className={styles.combatValue}>{squad.chargeBonus}</span>
          </div>
          <div className={styles.combatStat}>
            <span className={styles.combatIcon}>🏃</span>
            <span className={styles.combatLabel}>속도</span>
            <span className={styles.combatValue}>{squad.speed}</span>
          </div>
        </div>

        {/* 진형/자세 탭 */}
        <div className={styles.tabSection}>
          <div className={styles.tabNav}>
            <button
              className={`${styles.tabBtn} ${activeTab === 'formation' ? styles.active : ''}`}
              onClick={() => setActiveTab('formation')}
            >
              진형
            </button>
            <button
              className={`${styles.tabBtn} ${activeTab === 'stance' ? styles.active : ''}`}
              onClick={() => setActiveTab('stance')}
            >
              자세
            </button>
          </div>

          <AnimatePresence mode="wait">
            {activeTab === 'formation' ? (
              <motion.div
                key="formation"
                className={styles.tabContent}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
              >
                <div className={styles.formationGrid}>
                  {(Object.keys(FORMATION_INFO) as TWFormationType[]).map(f => (
                    <FormationButton
                      key={f}
                      formation={f}
                      isActive={squad.formation === f}
                      onClick={() => onFormationChange?.(f)}
                      disabled={squad.state === 'routing' || squad.state === 'destroyed'}
                    />
                  ))}
                </div>
                <div className={styles.currentInfo}>
                  현재: {FORMATION_INFO[squad.formation].name} - {FORMATION_INFO[squad.formation].desc}
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="stance"
                className={styles.tabContent}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
              >
                <div className={styles.stanceGrid}>
                  {(Object.keys(STANCE_INFO) as TWStanceType[]).map(s => (
                    <StanceButton
                      key={s}
                      stance={s}
                      isActive={squad.stance === s}
                      onClick={() => onStanceChange?.(s)}
                      disabled={squad.state === 'routing' || squad.state === 'destroyed'}
                    />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 특수 능력 */}
        {showAbilities && squad.abilities && squad.abilities.length > 0 && (
          <div className={styles.abilitySection}>
            <h4 className={styles.sectionTitle}>특수 능력</h4>
            <div className={styles.abilityGrid}>
              {squad.abilities.map(ability => (
                <AbilityButton
                  key={ability.id}
                  ability={ability}
                  onClick={() => onAbilityUse?.(ability.id)}
                  disabled={
                    squad.state === 'routing' ||
                    squad.state === 'destroyed' ||
                    squad.morale < (ability.cost ?? 0)
                  }
                />
              ))}
            </div>
          </div>
        )}

        {/* 동양적 코너 장식 */}
        <div className={`${styles.cornerDecor} ${styles.topLeft}`} />
        <div className={`${styles.cornerDecor} ${styles.topRight}`} />
        <div className={`${styles.cornerDecor} ${styles.bottomLeft}`} />
        <div className={`${styles.cornerDecor} ${styles.bottomRight}`} />
      </motion.div>
    </AnimatePresence>
  );
}

// ===== 부대 카드 덱 (하단 여러 부대 표시) =====
export function UnitCardDeck({
  squads,
  selectedSquadId,
  onSquadSelect,
}: {
  squads: TotalWarSquad[];
  selectedSquadId: string | null;
  onSquadSelect: (squadId: string) => void;
}) {
  return (
    <div className={styles.cardDeck}>
      {squads.map(squad => (
        <motion.div
          key={squad.id}
          className={`${styles.deckCard} ${selectedSquadId === squad.id ? styles.selected : ''}`}
          onClick={() => onSquadSelect(squad.id)}
          whileHover={{ scale: 1.05, y: -4 }}
          whileTap={{ scale: 0.98 }}
        >
          <span className={styles.deckIcon}>
            {CATEGORY_ICONS[squad.category] || '⚔️'}
          </span>
          <div className={styles.deckInfo}>
            <span className={styles.deckName}>{squad.name}</span>
            <div className={styles.deckBarTrack}>
              <div
                className={styles.deckBarFill}
                style={{
                  width: `${(squad.aliveSoldiers / squad.totalSoldiers) * 100}%`,
                  backgroundColor:
                    squad.aliveSoldiers / squad.totalSoldiers > 0.6
                      ? '#4CAF50'
                      : squad.aliveSoldiers / squad.totalSoldiers > 0.3
                      ? '#FFC107'
                      : '#F44336',
                }}
              />
            </div>
            <span className={styles.deckCount}>
              {squad.aliveSoldiers}/{squad.totalSoldiers}
            </span>
          </div>
          {squad.state !== 'idle' && (
            <span
              className={styles.deckState}
              style={{ color: STATE_INFO[squad.state].color }}
            >
              {STATE_INFO[squad.state].label}
            </span>
          )}
        </motion.div>
      ))}
    </div>
  );
}


