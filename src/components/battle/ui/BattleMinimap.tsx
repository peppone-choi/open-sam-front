'use client';

import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import styles from './BattleMinimap.module.css';

// ===== 타입 정의 =====
export interface MinimapUnit {
  id: string;
  x: number;
  z: number;
  teamId: 'attacker' | 'defender';
  isSelected?: boolean;
  category?: string;
  aliveSoldiers: number;
  totalSoldiers: number;
}

export interface MinimapTerrain {
  type: 'forest' | 'mountain' | 'water' | 'village' | 'fort';
  x: number;
  z: number;
  width: number;
  height: number;
}

export interface BattleMinimapProps {
  /** 맵 전체 크기 (월드 좌표) */
  mapSize: { width: number; height: number };
  /** 현재 카메라 뷰 영역 (월드 좌표) */
  viewBox: { x: number; z: number; width: number; height: number };
  /** 유닛 목록 */
  units: MinimapUnit[];
  /** 지형 목록 (옵션) */
  terrain?: MinimapTerrain[];
  /** 미니맵 클릭 시 카메라 이동 */
  onCameraMove?: (x: number, z: number) => void;
  /** 미니맵 드래그 시 카메라 이동 */
  onCameraDrag?: (x: number, z: number) => void;
  /** 유닛 클릭 */
  onUnitClick?: (unitId: string) => void;
  /** 미니맵 크기 (px) */
  size?: number;
  /** 투명도 */
  opacity?: number;
  /** 선택된 유닛 ID */
  selectedUnitId?: string | null;
}

// ===== 상수 =====
const TEAM_COLORS = {
  attacker: { main: '#4a9eff', glow: 'rgba(74, 158, 255, 0.6)' },
  defender: { main: '#ff4a4a', glow: 'rgba(255, 74, 74, 0.6)' },
};

const TERRAIN_COLORS: Record<string, string> = {
  forest: '#2d5a27',
  mountain: '#6b5344',
  water: '#1a4a6b',
  village: '#8b7355',
  fort: '#555555',
};

const UNIT_ICONS: Record<string, string> = {
  cavalry: '●', // 큰 원
  archer: '◆', // 다이아몬드
  infantry: '■', // 사각형
  default: '●',
};

// ===== 컴포넌트 =====
export default function BattleMinimap({
  mapSize,
  viewBox,
  units,
  terrain = [],
  onCameraMove,
  onCameraDrag,
  onUnitClick,
  size = 200,
  opacity = 0.9,
  selectedUnitId,
}: BattleMinimapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [hoveredUnit, setHoveredUnit] = useState<MinimapUnit | null>(null);

  // 좌표 변환: 월드 -> 미니맵
  const worldToMinimap = useCallback(
    (worldX: number, worldZ: number) => {
      const x = ((worldX + mapSize.width / 2) / mapSize.width) * size;
      const y = ((worldZ + mapSize.height / 2) / mapSize.height) * size;
      return { x, y };
    },
    [mapSize, size]
  );

  // 좌표 변환: 미니맵 -> 월드
  const minimapToWorld = useCallback(
    (minimapX: number, minimapY: number) => {
      const x = (minimapX / size) * mapSize.width - mapSize.width / 2;
      const z = (minimapY / size) * mapSize.height - mapSize.height / 2;
      return { x, z };
    },
    [mapSize, size]
  );

  // 캔버스 렌더링
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    // 배경 (지형 텍스처 효과)
    const gradient = ctx.createRadialGradient(
      size / 2, size / 2, 0,
      size / 2, size / 2, size * 0.7
    );
    gradient.addColorStop(0, '#3a4a3a');
    gradient.addColorStop(1, '#1a2a1a');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);

    // 그리드 라인
    ctx.strokeStyle = 'rgba(255, 215, 0, 0.1)';
    ctx.lineWidth = 0.5;
    const gridSize = size / 8;
    for (let i = 1; i < 8; i++) {
      ctx.beginPath();
      ctx.moveTo(i * gridSize, 0);
      ctx.lineTo(i * gridSize, size);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i * gridSize);
      ctx.lineTo(size, i * gridSize);
      ctx.stroke();
    }

    // 지형 렌더링
    terrain.forEach(t => {
      const pos = worldToMinimap(t.x, t.z);
      const w = (t.width / mapSize.width) * size;
      const h = (t.height / mapSize.height) * size;
      
      ctx.fillStyle = TERRAIN_COLORS[t.type] || '#444';
      ctx.globalAlpha = 0.6;
      ctx.fillRect(pos.x - w / 2, pos.y - h / 2, w, h);
      ctx.globalAlpha = 1;
    });

    // 유닛 렌더링 (죽은 유닛 제외)
    const aliveUnits = units.filter(u => u.aliveSoldiers > 0);
    
    aliveUnits.forEach(unit => {
      const pos = worldToMinimap(unit.x, unit.z);
      const color = TEAM_COLORS[unit.teamId];
      const isSelected = unit.id === selectedUnitId;
      
      // 유닛 크기 (병력 비율 기반)
      const baseSize = 4;
      const unitSize = baseSize + (unit.aliveSoldiers / unit.totalSoldiers) * 2;
      
      // 선택된 유닛 글로우 효과
      if (isSelected) {
        ctx.shadowColor = '#ffd700';
        ctx.shadowBlur = 10;
        ctx.fillStyle = '#ffd700';
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, unitSize + 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }
      
      // 유닛 글로우
      ctx.shadowColor = color.glow;
      ctx.shadowBlur = 6;
      
      // 유닛 본체
      ctx.fillStyle = color.main;
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, unitSize, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.shadowBlur = 0;
      
      // 유닛 테두리
      ctx.strokeStyle = isSelected ? '#ffd700' : 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = isSelected ? 2 : 1;
      ctx.stroke();
    });

    // 뷰 박스 렌더링
    const viewPos = worldToMinimap(viewBox.x, viewBox.z);
    const viewW = (viewBox.width / mapSize.width) * size;
    const viewH = (viewBox.height / mapSize.height) * size;
    
    // 뷰 박스 배경
    ctx.fillStyle = 'rgba(255, 215, 0, 0.1)';
    ctx.fillRect(viewPos.x - viewW / 2, viewPos.y - viewH / 2, viewW, viewH);
    
    // 뷰 박스 테두리
    ctx.strokeStyle = 'rgba(255, 215, 0, 0.8)';
    ctx.lineWidth = 2;
    ctx.strokeRect(viewPos.x - viewW / 2, viewPos.y - viewH / 2, viewW, viewH);
    
    // 코너 장식
    const cornerSize = 6;
    ctx.fillStyle = '#ffd700';
    // 좌상단
    ctx.fillRect(viewPos.x - viewW / 2 - 1, viewPos.y - viewH / 2 - 1, cornerSize, 2);
    ctx.fillRect(viewPos.x - viewW / 2 - 1, viewPos.y - viewH / 2 - 1, 2, cornerSize);
    // 우상단
    ctx.fillRect(viewPos.x + viewW / 2 - cornerSize + 1, viewPos.y - viewH / 2 - 1, cornerSize, 2);
    ctx.fillRect(viewPos.x + viewW / 2 - 1, viewPos.y - viewH / 2 - 1, 2, cornerSize);
    // 좌하단
    ctx.fillRect(viewPos.x - viewW / 2 - 1, viewPos.y + viewH / 2 - 1, cornerSize, 2);
    ctx.fillRect(viewPos.x - viewW / 2 - 1, viewPos.y + viewH / 2 - cornerSize + 1, 2, cornerSize);
    // 우하단
    ctx.fillRect(viewPos.x + viewW / 2 - cornerSize + 1, viewPos.y + viewH / 2 - 1, cornerSize, 2);
    ctx.fillRect(viewPos.x + viewW / 2 - 1, viewPos.y + viewH / 2 - cornerSize + 1, 2, cornerSize);

  }, [units, viewBox, terrain, mapSize, size, selectedUnitId, worldToMinimap]);

  // 클릭 핸들러
  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!canvasRef.current) return;
      
      const rect = canvasRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      // 유닛 클릭 체크
      const clickedUnit = units.find(unit => {
        const pos = worldToMinimap(unit.x, unit.z);
        const dist = Math.sqrt(Math.pow(pos.x - x, 2) + Math.pow(pos.y - y, 2));
        return dist < 10;
      });
      
      if (clickedUnit && onUnitClick) {
        onUnitClick(clickedUnit.id);
      } else if (onCameraMove) {
        const worldPos = minimapToWorld(x, y);
        onCameraMove(worldPos.x, worldPos.z);
      }
    },
    [units, worldToMinimap, minimapToWorld, onCameraMove, onUnitClick]
  );

  // 드래그 핸들러
  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(true);
    handleClick(e);
  }, [handleClick]);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!canvasRef.current) return;
      
      const rect = canvasRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      // 호버된 유닛 찾기
      const hovered = units.find(unit => {
        const pos = worldToMinimap(unit.x, unit.z);
        const dist = Math.sqrt(Math.pow(pos.x - x, 2) + Math.pow(pos.y - y, 2));
        return dist < 10;
      });
      setHoveredUnit(hovered || null);
      
      // 드래그 중이면 카메라 이동
      if (isDragging && onCameraDrag) {
        const worldPos = minimapToWorld(x, y);
        onCameraDrag(worldPos.x, worldPos.z);
      }
    },
    [isDragging, units, worldToMinimap, minimapToWorld, onCameraDrag]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsDragging(false);
    setIsHovering(false);
    setHoveredUnit(null);
  }, []);

  // 유닛 카운트 계산
  const unitCounts = useMemo(() => {
    const attackers = units.filter(u => u.teamId === 'attacker' && u.aliveSoldiers > 0);
    const defenders = units.filter(u => u.teamId === 'defender' && u.aliveSoldiers > 0);
    return {
      attackers: attackers.reduce((acc, u) => acc + u.aliveSoldiers, 0),
      defenders: defenders.reduce((acc, u) => acc + u.aliveSoldiers, 0),
    };
  }, [units]);

  return (
    <div
      ref={containerRef}
      className={styles.container}
      style={{ width: size, height: size + 32, opacity }}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={handleMouseLeave}
    >
      {/* 헤더 */}
      <div className={styles.header}>
        <span className={styles.title}>전장 지도</span>
        <div className={styles.unitCount}>
          <span className={styles.attackerCount}>⚔ {unitCounts.attackers}</span>
          <span className={styles.divider}>|</span>
          <span className={styles.defenderCount}>⚔ {unitCounts.defenders}</span>
        </div>
      </div>

      {/* 캔버스 */}
      <div className={styles.canvasWrapper}>
        <canvas
          ref={canvasRef}
          className={styles.canvas}
          style={{ width: size, height: size }}
          onClick={handleClick}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
        />
        
        {/* 동양적 코너 장식 */}
        <div className={`${styles.corner} ${styles.topLeft}`} />
        <div className={`${styles.corner} ${styles.topRight}`} />
        <div className={`${styles.corner} ${styles.bottomLeft}`} />
        <div className={`${styles.corner} ${styles.bottomRight}`} />
      </div>

      {/* 호버 툴팁 */}
      {hoveredUnit && (
        <div className={styles.tooltip}>
          <span className={styles.tooltipName}>{hoveredUnit.id}</span>
          <span className={styles.tooltipInfo}>
            병력: {hoveredUnit.aliveSoldiers}/{hoveredUnit.totalSoldiers}
          </span>
        </div>
      )}

      {/* 범례 (호버 시 표시) */}
      {isHovering && (
        <div className={styles.legend}>
          <div className={styles.legendItem}>
            <span className={styles.legendDot} style={{ background: TEAM_COLORS.attacker.main }} />
            <span>아군</span>
          </div>
          <div className={styles.legendItem}>
            <span className={styles.legendDot} style={{ background: TEAM_COLORS.defender.main }} />
            <span>적군</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ===== 간소화 버전 (성능 최적화용) =====
export function MinimapSimple({
  mapSize,
  units,
  viewBox,
  size = 150,
  onCameraMove,
}: {
  mapSize: { width: number; height: number };
  units: Array<{ id: string; x: number; z: number; teamId: 'attacker' | 'defender' }>;
  viewBox: { x: number; z: number; width: number; height: number };
  size?: number;
  onCameraMove?: (x: number, z: number) => void;
}) {
  const worldToMinimap = (wx: number, wz: number) => ({
    x: ((wx + mapSize.width / 2) / mapSize.width) * 100,
    y: ((wz + mapSize.height / 2) / mapSize.height) * 100,
  });

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!onCameraMove) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / size) * mapSize.width - mapSize.width / 2;
    const z = ((e.clientY - rect.top) / size) * mapSize.height - mapSize.height / 2;
    onCameraMove(x, z);
  };

  const viewPos = worldToMinimap(viewBox.x, viewBox.z);

  return (
    <div
      className={styles.simpleContainer}
      style={{ width: size, height: size }}
      onClick={handleClick}
    >
      {/* 유닛 점 */}
      {units.map(unit => {
        const pos = worldToMinimap(unit.x, unit.z);
        return (
          <div
            key={unit.id}
            className={styles.simpleDot}
            style={{
              left: `${pos.x}%`,
              top: `${pos.y}%`,
              backgroundColor: unit.teamId === 'attacker' ? '#4a9eff' : '#ff4a4a',
            }}
          />
        );
      })}
      
      {/* 뷰 박스 */}
      <div
        className={styles.simpleViewBox}
        style={{
          left: `${viewPos.x - (viewBox.width / mapSize.width) * 50}%`,
          top: `${viewPos.y - (viewBox.height / mapSize.height) * 50}%`,
          width: `${(viewBox.width / mapSize.width) * 100}%`,
          height: `${(viewBox.height / mapSize.height) * 100}%`,
        }}
      />
    </div>
  );
}


