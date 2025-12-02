'use client';

import React from 'react';
import { TroopMovementMarkerProps, MovementType, MovementStatus } from '@/types/movement';
import styles from './TroopMovementMarker.module.css';

/**
 * 군대 이동 마커 컴포넌트
 * 지도 위에 이동 중인 군대를 표시
 */
export default function TroopMovementMarker({
  movement,
  isFullWidth = true,
  isHovered = false,
  isSelected = false,
  onClick,
  onMouseEnter,
  onMouseLeave,
}: TroopMovementMarkerProps) {
  const { 
    fromX, fromY, toX, toY, 
    nationColor, 
    status, type, progress = 50,
    generalName, troops, crewTypeName,
    isEnemy
  } = movement;

  // 현재 위치 계산 (progress에 따라 보간)
  const currentX = fromX + (toX - fromX) * (progress / 100);
  const currentY = fromY + (toY - fromY) * (progress / 100);

  // 백분율 좌표로 변환
  const LEFT_OFFSET = 14;
  const TOP_OFFSET = 20;
  
  const fromXPercent = ((fromX - LEFT_OFFSET) / 1000) * 100;
  const fromYPercent = ((fromY - TOP_OFFSET) / 675) * 100;
  const toXPercent = ((toX - LEFT_OFFSET) / 1000) * 100;
  const toYPercent = ((toY - TOP_OFFSET) / 675) * 100;
  const currentXPercent = ((currentX - LEFT_OFFSET) / 1000) * 100;
  const currentYPercent = ((currentY - TOP_OFFSET) / 675) * 100;

  // 이동 방향 각도 계산
  const angle = Math.atan2(toY - fromY, toX - fromX) * (180 / Math.PI);

  // 상태별 스타일
  const getStatusClass = (status: MovementStatus): string => {
    switch (status) {
      case 'scheduled': return styles.scheduled;
      case 'marching': return styles.marching;
      case 'arriving': return styles.arriving;
      case 'completed': return styles.completed;
      default: return '';
    }
  };

  // 타입별 아이콘
  const getTypeIcon = (type: MovementType): string => {
    switch (type) {
      case 'deploy': return '⚔️';
      case 'forceMarch': return '🏃';
      case 'retreat': return '🏳️';
      case 'supply': return '📦';
      default: return '🚶';
    }
  };

  // 병력 포맷
  const formatTroops = (troops: number): string => {
    if (troops >= 10000) {
      return `${(troops / 10000).toFixed(1)}만`;
    }
    if (troops >= 1000) {
      return `${(troops / 1000).toFixed(1)}천`;
    }
    return troops.toString();
  };

  return (
    <div className={styles.movementContainer}>
      {/* 이동 경로선 */}
      <svg 
        className={styles.pathSvg}
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        {/* 배경 경로 (점선) */}
        <line
          x1={`${fromXPercent}%`}
          y1={`${fromYPercent}%`}
          x2={`${toXPercent}%`}
          y2={`${toYPercent}%`}
          className={`${styles.pathLine} ${styles.pathBackground}`}
          stroke={nationColor}
        />
        
        {/* 진행된 경로 (실선) */}
        <line
          x1={`${fromXPercent}%`}
          y1={`${fromYPercent}%`}
          x2={`${currentXPercent}%`}
          y2={`${currentYPercent}%`}
          className={`${styles.pathLine} ${styles.pathProgress}`}
          stroke={nationColor}
        />
        
        {/* 화살표 마커 */}
        <defs>
          <marker
            id={`arrow-${movement.id}`}
            markerWidth="10"
            markerHeight="10"
            refX="9"
            refY="3"
            orient="auto"
            markerUnits="strokeWidth"
          >
            <path d="M0,0 L0,6 L9,3 z" fill={nationColor} />
          </marker>
        </defs>
        
        {/* 목적지 방향 화살표 */}
        <line
          x1={`${currentXPercent}%`}
          y1={`${currentYPercent}%`}
          x2={`${toXPercent}%`}
          y2={`${toYPercent}%`}
          className={styles.arrowLine}
          stroke={nationColor}
          markerEnd={`url(#arrow-${movement.id})`}
        />
      </svg>

      {/* 군대 마커 (현재 위치) */}
      <div
        className={`
          ${styles.troopMarker} 
          ${getStatusClass(status)}
          ${isEnemy ? styles.enemy : styles.friendly}
          ${isHovered ? styles.hovered : ''}
          ${isSelected ? styles.selected : ''}
        `}
        style={{
          left: `${currentXPercent}%`,
          top: `${currentYPercent}%`,
          '--nation-color': nationColor,
          '--angle': `${angle}deg`,
        } as React.CSSProperties}
        onClick={onClick}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      >
        {/* 방향 표시 화살표 */}
        <div 
          className={styles.directionIndicator}
          style={{ transform: `rotate(${angle}deg)` }}
        >
          →
        </div>
        
        {/* 타입 아이콘 */}
        <div className={styles.typeIcon}>
          {getTypeIcon(type)}
        </div>
        
        {/* 병력 수 */}
        <div className={styles.troopCount}>
          {formatTroops(troops)}
        </div>

        {/* 호버 시 상세 정보 */}
        {(isHovered || isSelected) && (
          <div className={styles.tooltip}>
            <div className={styles.tooltipHeader} style={{ backgroundColor: nationColor }}>
              {generalName}
            </div>
            <div className={styles.tooltipBody}>
              <div>병력: {troops.toLocaleString()}</div>
              {crewTypeName && <div>병종: {crewTypeName}</div>}
              <div>
                {movement.fromCityName} → {movement.toCityName}
              </div>
              <div className={styles.progressBar}>
                <div 
                  className={styles.progressFill}
                  style={{ width: `${progress}%`, backgroundColor: nationColor }}
                />
              </div>
              <div className={styles.progressText}>진행: {progress}%</div>
            </div>
          </div>
        )}
      </div>

      {/* 출발지 표시 */}
      <div
        className={styles.cityMarker}
        style={{
          left: `${fromXPercent}%`,
          top: `${fromYPercent}%`,
          borderColor: nationColor,
        }}
      />

      {/* 목적지 표시 */}
      <div
        className={`${styles.cityMarker} ${styles.destination}`}
        style={{
          left: `${toXPercent}%`,
          top: `${toYPercent}%`,
          backgroundColor: nationColor,
        }}
      />
    </div>
  );
}




