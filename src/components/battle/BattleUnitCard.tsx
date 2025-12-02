'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { getUnitName, getUnitType } from './UnitSprite';
import type { BattleUnit } from './TurnBasedBattleMap';
import styles from './BattleUnitCard.module.css';

// ===== Props =====
interface BattleUnitCardProps {
  unit: BattleUnit | null;
  showDetail?: boolean;
  compact?: boolean;
  onClose?: () => void;
}

// ===== 병종 아이콘 매핑 =====
const UNIT_TYPE_ICONS: Record<string, string> = {
  CASTLE: '🏯',
  FOOTMAN: '🗡️',
  ARCHER: '🏹',
  CAVALRY: '🐴',
  WIZARD: '🔮',
  SIEGE: '🎯',
};

const UNIT_TYPE_NAMES: Record<string, string> = {
  CASTLE: '성벽',
  FOOTMAN: '보병',
  ARCHER: '궁병',
  CAVALRY: '기병',
  WIZARD: '책사',
  SIEGE: '공성',
};

// ===== 유닛 이미지 컴포넌트 =====
function UnitPortrait({ 
  crewType, 
  portraitUrl, 
  size = 64 
}: { 
  crewType: number; 
  portraitUrl?: string;
  size?: number;
}) {
  const [error, setError] = useState(false);

  const getUnitImageIndex = (crewType: number): number => {
    if (crewType === 1000) return 0;
    if (crewType >= 1100 && crewType <= 1116) return crewType - 1099;
    if (crewType >= 1200 && crewType <= 1207) return crewType - 1182;
    if (crewType >= 1300 && crewType <= 1309) return crewType - 1274;
    if (crewType >= 1400 && crewType <= 1403) return crewType - 1364;
    if (crewType >= 1500 && crewType <= 1503) return crewType - 1460;
    return 1;
  };

  const imageIndex = getUnitImageIndex(crewType);
  const imagePath = portraitUrl || `/assets/units/unit_${String(imageIndex).padStart(3, '0')}.png`;

  if (error) {
    return (
      <div className={styles.portraitFallback} style={{ width: size, height: size }}>
        {UNIT_TYPE_ICONS[getUnitType(crewType)] || '⚔️'}
      </div>
    );
  }

  return (
    <div className={styles.portraitWrapper} style={{ width: size, height: size }}>
      <Image
        src={imagePath}
        alt={getUnitName(crewType)}
        fill
        style={{ objectFit: 'contain' }}
        onError={() => setError(true)}
        draggable={false}
      />
    </div>
  );
}

// ===== 애니메이션 바 컴포넌트 =====
function AnimatedBar({
  current,
  max,
  color,
  showText = true,
  label,
  animate = false,
}: {
  current: number;
  max: number;
  color: string;
  showText?: boolean;
  label?: string;
  animate?: boolean;
}) {
  const [displayValue, setDisplayValue] = useState(current);

  useEffect(() => {
    if (!animate) {
      setDisplayValue(current);
      return;
    }

    const duration = 500;
    const startTime = Date.now();
    const startValue = displayValue;

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const value = startValue + (current - startValue) * progress;
      setDisplayValue(Math.floor(value));

      if (progress >= 1) {
        clearInterval(interval);
      }
    }, 16);

    return () => clearInterval(interval);
  }, [current, animate, displayValue]);

  const percentage = max > 0 ? (displayValue / max) * 100 : 0;

  return (
    <div className={styles.barContainer}>
      {label && <span className={styles.barLabel}>{label}</span>}
      <div className={styles.barTrack}>
        <div
          className={styles.barFill}
          style={{
            width: `${percentage}%`,
            backgroundColor: color,
          }}
        />
        {showText && (
          <span className={styles.barText}>
            {displayValue.toLocaleString()} / {max.toLocaleString()}
          </span>
        )}
      </div>
    </div>
  );
}

// ===== 스탯 행 컴포넌트 =====
function StatRow({ 
  icon, 
  label, 
  value, 
  color 
}: { 
  icon: string; 
  label: string; 
  value: number | string;
  color?: string;
}) {
  return (
    <div className={styles.statRow}>
      <span className={styles.statIcon}>{icon}</span>
      <span className={styles.statLabel}>{label}</span>
      <span className={styles.statValue} style={{ color }}>
        {typeof value === 'number' ? value.toLocaleString() : value}
      </span>
    </div>
  );
}

// ===== 메인 컴포넌트 =====
export default function BattleUnitCard({
  unit,
  showDetail = true,
  compact = false,
  onClose,
}: BattleUnitCardProps) {
  if (!unit) {
    return (
      <div className={`${styles.card} ${styles.empty}`}>
        <div className={styles.emptyText}>
          유닛을 선택하세요
        </div>
      </div>
    );
  }

  const unitType = getUnitType(unit.crewType);
  const unitTypeName = UNIT_TYPE_NAMES[unitType] || '병사';
  const unitTypeIcon = UNIT_TYPE_ICONS[unitType] || '⚔️';

  // HP 색상 계산
  const hpRatio = unit.hp / unit.maxHp;
  const hpColor = hpRatio > 0.6 ? '#4caf50' : hpRatio > 0.3 ? '#ffc107' : '#f44336';

  // 사기 색상 계산
  const moraleRatio = unit.morale / unit.maxMorale;
  const moraleColor = moraleRatio > 0.6 ? '#9c27b0' : moraleRatio > 0.3 ? '#ff9800' : '#e91e63';

  if (compact) {
    // 컴팩트 모드 (미니 카드)
    return (
      <div className={`${styles.card} ${styles.compact} ${unit.isEnemy ? styles.enemy : styles.ally}`}>
        <UnitPortrait crewType={unit.crewType} portraitUrl={unit.portraitUrl} size={40} />
        <div className={styles.compactInfo}>
          <div className={styles.compactName}>{unit.generalName}</div>
          <div className={styles.compactBars}>
            <div className={styles.miniBar}>
              <div
                className={styles.miniBarFill}
                style={{ width: `${hpRatio * 100}%`, backgroundColor: hpColor }}
              />
            </div>
            <div className={styles.compactCrew}>{formatCrew(unit.crew)}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${styles.card} ${unit.isEnemy ? styles.enemy : styles.ally}`}>
      {/* 헤더 */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <span className={styles.teamBadge}>
            {unit.isEnemy ? '적' : '아군'}
          </span>
          <span className={styles.typeBadge}>
            {unitTypeIcon} {unitTypeName}
          </span>
        </div>
        {onClose && (
          <button className={styles.closeBtn} onClick={onClose}>
            ✕
          </button>
        )}
      </div>

      {/* 메인 정보 */}
      <div className={styles.mainInfo}>
        <UnitPortrait crewType={unit.crewType} portraitUrl={unit.portraitUrl} size={72} />
        <div className={styles.nameSection}>
          <h3 className={styles.generalName}>{unit.generalName}</h3>
          <div className={styles.unitTypeName}>{getUnitName(unit.crewType)}</div>
        </div>
      </div>

      {/* 바 섹션 */}
      <div className={styles.barsSection}>
        <AnimatedBar
          current={unit.hp}
          max={unit.maxHp}
          color={hpColor}
          label="HP"
          animate
        />
        <AnimatedBar
          current={unit.morale}
          max={unit.maxMorale}
          color={moraleColor}
          label="사기"
          animate
        />
      </div>

      {/* 병력 정보 */}
      <div className={styles.crewSection}>
        <div className={styles.crewMain}>
          <span className={styles.crewIcon}>⚔️</span>
          <span className={styles.crewLabel}>병사</span>
          <span className={styles.crewValue}>{unit.crew.toLocaleString()}명</span>
        </div>
        <div className={styles.crewBar}>
          <div
            className={styles.crewBarFill}
            style={{ width: `${(unit.crew / unit.maxCrew) * 100}%` }}
          />
        </div>
      </div>

      {/* 상세 스탯 */}
      {showDetail && (
        <div className={styles.statsSection}>
          <div className={styles.statsGrid}>
            <StatRow icon="⚔️" label="공격력" value={unit.attack} color="#f44336" />
            <StatRow icon="🛡️" label="방어력" value={unit.defense} color="#2196f3" />
            <StatRow icon="🚶" label="이동력" value={unit.moveRange} />
            <StatRow icon="🎯" label="사거리" value={unit.attackRange} />
          </div>
        </div>
      )}

      {/* 상태 표시 */}
      <div className={styles.statusSection}>
        {unit.hasMoved && (
          <span className={styles.statusTag} style={{ backgroundColor: '#ff9800' }}>
            이동완료
          </span>
        )}
        {unit.hasActed && (
          <span className={styles.statusTag} style={{ backgroundColor: '#9e9e9e' }}>
            행동완료
          </span>
        )}
        {unit.morale < 30 && (
          <span className={styles.statusTag} style={{ backgroundColor: '#e91e63' }}>
            사기저하
          </span>
        )}
        {unit.hp < unit.maxHp * 0.3 && (
          <span className={styles.statusTag} style={{ backgroundColor: '#f44336' }}>
            부상
          </span>
        )}
      </div>
    </div>
  );
}

// ===== 미니 유닛 카드 (목록용) =====
export function MiniUnitCard({ unit, onClick, isSelected }: { 
  unit: BattleUnit; 
  onClick?: () => void;
  isSelected?: boolean;
}) {
  const hpRatio = unit.hp / unit.maxHp;
  const hpColor = hpRatio > 0.6 ? '#4caf50' : hpRatio > 0.3 ? '#ffc107' : '#f44336';

  return (
    <div 
      className={`${styles.miniCard} ${unit.isEnemy ? styles.enemy : styles.ally} ${isSelected ? styles.selected : ''}`}
      onClick={onClick}
    >
      <div className={styles.miniPortrait}>
        <UnitPortrait crewType={unit.crewType} size={32} />
      </div>
      <div className={styles.miniInfo}>
        <div className={styles.miniName}>{unit.generalName}</div>
        <div className={styles.miniHpBar}>
          <div
            className={styles.miniHpFill}
            style={{ width: `${hpRatio * 100}%`, backgroundColor: hpColor }}
          />
        </div>
        <div className={styles.miniCrew}>{formatCrew(unit.crew)}</div>
      </div>
      {unit.hasActed && <div className={styles.miniActed}>✓</div>}
    </div>
  );
}

// ===== 유닛 목록 패널 =====
export function UnitListPanel({ 
  units, 
  title,
  onUnitClick,
  selectedUnitId,
}: { 
  units: BattleUnit[];
  title: string;
  onUnitClick?: (unit: BattleUnit) => void;
  selectedUnitId?: string | null;
}) {
  const aliveUnits = units.filter(u => u.hp > 0);
  const deadCount = units.length - aliveUnits.length;

  return (
    <div className={styles.unitListPanel}>
      <div className={styles.listHeader}>
        <span className={styles.listTitle}>{title}</span>
        <span className={styles.listCount}>
          {aliveUnits.length}/{units.length}
          {deadCount > 0 && <span className={styles.deadCount}> (-{deadCount})</span>}
        </span>
      </div>
      <div className={styles.listBody}>
        {aliveUnits.map(unit => (
          <MiniUnitCard
            key={unit.id}
            unit={unit}
            onClick={() => onUnitClick?.(unit)}
            isSelected={selectedUnitId === unit.id}
          />
        ))}
      </div>
    </div>
  );
}

// ===== 유틸 함수 =====
function formatCrew(crew: number): string {
  if (crew >= 10000) return `${(crew / 10000).toFixed(1)}만`;
  if (crew >= 1000) return `${(crew / 1000).toFixed(1)}천`;
  return String(crew);
}




