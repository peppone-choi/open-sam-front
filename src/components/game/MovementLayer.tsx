'use client';

import React, { useState, useMemo } from 'react';
import { MovementLayerProps, TroopMovement, MovementFilterOptions } from '@/types/movement';
import TroopMovementMarker from './TroopMovementMarker';
import MovementDetailPanel from './MovementDetailPanel';
import styles from './MovementLayer.module.css';

/**
 * 군대 이동 레이어 컴포넌트
 * 지도 위에 여러 군대 이동을 관리하고 표시
 */
export default function MovementLayer({
  movements,
  currentTurn = 0,
  myNationId,
  myGeneralIds = [],
  filter = {
    showFriendly: true,
    showEnemy: true,
    showScheduled: true,
    showMarching: true,
  },
  isFullWidth = true,
  onMovementClick,
  onMovementHover,
  onCancelMovement,
  onGoToCommandScreen,
  onTrackOnMap,
}: MovementLayerProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detailMovement, setDetailMovement] = useState<TroopMovement | null>(null);

  // 필터링된 이동 목록
  const filteredMovements = useMemo(() => {
    return movements.filter((m) => {
      // 가시성 체크
      if (!m.isVisible && m.isEnemy) return false;
      
      // 아군/적군 필터
      if (m.nationId === myNationId) {
        if (!filter.showFriendly) return false;
      } else {
        if (!filter.showEnemy) return false;
      }
      
      // 상태 필터
      if (m.status === 'scheduled' && !filter.showScheduled) return false;
      if (m.status === 'marching' && !filter.showMarching) return false;
      
      // 타입 필터
      if (filter.types && filter.types.length > 0) {
        if (!filter.types.includes(m.type)) return false;
      }
      
      return true;
    });
  }, [movements, myNationId, filter]);

  // 이동 클릭 핸들러
  const handleMovementClick = (movement: TroopMovement) => {
    setSelectedId(selectedId === movement.id ? null : movement.id);
    setDetailMovement(movement); // 상세 패널 열기
    onMovementClick?.(movement);
  };

  // 상세 패널 닫기
  const handleCloseDetail = () => {
    setDetailMovement(null);
    setSelectedId(null);
  };

  // 내 장수인지 확인
  const isMyGeneral = (generalId: number): boolean => {
    return myGeneralIds.includes(generalId);
  };

  // 이동 호버 핸들러
  const handleMovementHover = (movement: TroopMovement | null) => {
    setHoveredId(movement?.id || null);
    onMovementHover?.(movement);
  };

  // 이동 통계
  const stats = useMemo(() => {
    const friendly = filteredMovements.filter(m => m.nationId === myNationId);
    const enemy = filteredMovements.filter(m => m.nationId !== myNationId);
    const totalTroops = filteredMovements.reduce((sum, m) => sum + m.troops, 0);
    
    return {
      total: filteredMovements.length,
      friendly: friendly.length,
      enemy: enemy.length,
      friendlyTroops: friendly.reduce((sum, m) => sum + m.troops, 0),
      enemyTroops: enemy.reduce((sum, m) => sum + m.troops, 0),
      totalTroops,
    };
  }, [filteredMovements, myNationId]);

  if (filteredMovements.length === 0) {
    return null;
  }

  return (
    <div className={styles.movementLayer}>
      {/* 이동 마커들 */}
      {filteredMovements.map((movement) => (
        <TroopMovementMarker
          key={movement.id}
          movement={{
            ...movement,
            isEnemy: movement.nationId !== myNationId,
          }}
          isFullWidth={isFullWidth}
          isHovered={hoveredId === movement.id}
          isSelected={selectedId === movement.id}
          onClick={() => handleMovementClick(movement)}
          onMouseEnter={() => handleMovementHover(movement)}
          onMouseLeave={() => handleMovementHover(null)}
        />
      ))}

      {/* 이동 요약 패널 */}
      <div className={styles.summaryPanel}>
        <div className={styles.summaryTitle}>🏃 군대 이동</div>
        <div className={styles.summaryStats}>
          <div className={styles.statItem}>
            <span className={styles.statLabel}>아군</span>
            <span className={styles.statValue}>{stats.friendly}부대</span>
            <span className={styles.statTroops}>({stats.friendlyTroops.toLocaleString()})</span>
          </div>
          {stats.enemy > 0 && (
            <div className={`${styles.statItem} ${styles.enemy}`}>
              <span className={styles.statLabel}>적군</span>
              <span className={styles.statValue}>{stats.enemy}부대</span>
              <span className={styles.statTroops}>({stats.enemyTroops.toLocaleString()})</span>
            </div>
          )}
        </div>
      </div>

      {/* 범례 */}
      <div className={styles.legend}>
        <div className={styles.legendItem}>
          <span className={`${styles.legendIcon} ${styles.normal}`}>🚶</span>
          <span>이동</span>
        </div>
        <div className={styles.legendItem}>
          <span className={`${styles.legendIcon} ${styles.deploy}`}>⚔️</span>
          <span>출정</span>
        </div>
        <div className={styles.legendItem}>
          <span className={`${styles.legendIcon} ${styles.forceMarch}`}>🏃</span>
          <span>강행군</span>
        </div>
        <div className={styles.legendItem}>
          <span className={`${styles.legendIcon} ${styles.retreat}`}>🏳️</span>
          <span>퇴각</span>
        </div>
      </div>

      {/* 선택된 이동 상세 패널 */}
      {detailMovement && (
        <MovementDetailPanel
          movement={detailMovement}
          onClose={handleCloseDetail}
          onCancel={onCancelMovement}
          onGoToCommandScreen={onGoToCommandScreen}
          onTrackOnMap={onTrackOnMap}
          isEditable={isMyGeneral(detailMovement.generalId)}
        />
      )}
    </div>
  );
}

/**
 * 샘플 이동 데이터 생성 (테스트/데모용)
 */
export function generateSampleMovements(
  cityPositions: Record<number, { name: string; x: number; y: number }>,
  myNationId: number = 1
): TroopMovement[] {
  const cities = Object.entries(cityPositions);
  if (cities.length < 2) return [];

  const sampleMovements: TroopMovement[] = [];
  const movementTypes: Array<'normal' | 'deploy' | 'forceMarch' | 'retreat'> = [
    'normal', 'deploy', 'forceMarch', 'retreat'
  ];
  const statuses: Array<'scheduled' | 'marching' | 'arriving'> = [
    'scheduled', 'marching', 'arriving'
  ];

  // 랜덤 이동 3-5개 생성
  const count = Math.floor(Math.random() * 3) + 3;
  
  for (let i = 0; i < count; i++) {
    const fromIdx = Math.floor(Math.random() * cities.length);
    let toIdx = Math.floor(Math.random() * cities.length);
    while (toIdx === fromIdx) {
      toIdx = Math.floor(Math.random() * cities.length);
    }

    const [fromCityIdStr, fromCity] = cities[fromIdx];
    const [toCityIdStr, toCity] = cities[toIdx];
    const fromCityId = parseInt(fromCityIdStr);
    const toCityId = parseInt(toCityIdStr);

    const isEnemy = Math.random() > 0.6;
    const nationId = isEnemy ? 2 : myNationId;
    const nationColor = isEnemy ? '#ff4444' : '#4488ff';

    sampleMovements.push({
      id: `movement-${i}`,
      generalId: 100 + i,
      generalName: isEnemy ? `적장 ${i + 1}` : `장수 ${i + 1}`,
      nationId,
      nationName: isEnemy ? '적국' : '내 국가',
      nationColor,
      troops: Math.floor(Math.random() * 8000) + 2000,
      crewType: 1100 + Math.floor(Math.random() * 10),
      crewTypeName: ['보병', '궁병', '기병', '창병'][Math.floor(Math.random() * 4)],
      fromCityId,
      fromCityName: fromCity.name,
      fromX: fromCity.x,
      fromY: fromCity.y,
      toCityId,
      toCityName: toCity.name,
      toX: toCity.x,
      toY: toCity.y,
      status: statuses[Math.floor(Math.random() * statuses.length)],
      type: movementTypes[Math.floor(Math.random() * movementTypes.length)],
      progress: Math.floor(Math.random() * 80) + 10,
      isEnemy,
      isVisible: true,
    });
  }

  return sampleMovements;
}

