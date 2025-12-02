'use client';

/**
 * Minimap - 전장 미니맵 컴포넌트
 * 전장 축소 표시, 유닛 위치, 뷰포트 영역, 클릭/드래그 카메라 이동
 */

import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { useVoxelBattleStore } from '@/stores/voxelBattleStore';
import {
  selectAttackerSquads,
  selectDefenderSquads,
} from '@/stores/voxelBattleSelectors';
import styles from './styles/overlay.module.css';

// ============================================================================
// 타입 정의
// ============================================================================

export interface MinimapUnit {
  id: string;
  x: number;
  z: number;
  side: 'attacker' | 'defender';
  isSelected?: boolean;
  aliveSoldiers: number;
  totalSoldiers: number;
}

export interface MinimapProps {
  /** 맵 전체 크기 (월드 좌표) */
  mapSize: { width: number; height: number };
  /** 현재 카메라 뷰 영역 (월드 좌표) */
  viewport: { x: number; z: number; width: number; height: number };
  /** 미니맵 크기 (px) */
  size?: number;
  /** 선택된 유닛 ID */
  selectedUnitId?: string | null;
  /** 카메라 이동 콜백 */
  onCameraMove?: (x: number, z: number) => void;
  /** 유닛 클릭 콜백 */
  onUnitClick?: (unitId: string) => void;
  /** 접힌 상태 */
  collapsed?: boolean;
  /** 접기/펼치기 토글 */
  onToggleCollapse?: () => void;
}

// ============================================================================
// 상수
// ============================================================================

const TEAM_COLORS = {
  attacker: { main: '#4a9eff', glow: 'rgba(74, 158, 255, 0.6)' },
  defender: { main: '#ff4a4a', glow: 'rgba(255, 74, 74, 0.6)' },
};

// ============================================================================
// 메인 컴포넌트
// ============================================================================

export default function Minimap({
  mapSize,
  viewport,
  size = 180,
  selectedUnitId,
  onCameraMove,
  onUnitClick,
  collapsed = false,
  onToggleCollapse,
}: MinimapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isHovering, setIsHovering] = useState(false);

  // 스토어에서 부대 정보 가져오기
  const attackerSquads = useVoxelBattleStore(selectAttackerSquads);
  const defenderSquads = useVoxelBattleStore(selectDefenderSquads);

  // 유닛 데이터 변환
  const units: MinimapUnit[] = useMemo(() => {
    const attackerUnits = attackerSquads.map(squad => ({
      id: squad.id,
      x: squad.position.x,
      z: squad.position.z,
      side: 'attacker' as const,
      isSelected: squad.id === selectedUnitId,
      aliveSoldiers: squad.aliveSoldiers,
      totalSoldiers: squad.totalSoldiers,
    }));

    const defenderUnits = defenderSquads.map(squad => ({
      id: squad.id,
      x: squad.position.x,
      z: squad.position.z,
      side: 'defender' as const,
      isSelected: squad.id === selectedUnitId,
      aliveSoldiers: squad.aliveSoldiers,
      totalSoldiers: squad.totalSoldiers,
    }));

    return [...attackerUnits, ...defenderUnits].filter(u => u.aliveSoldiers > 0);
  }, [attackerSquads, defenderSquads, selectedUnitId]);

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
    if (collapsed) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    // 배경 그라데이션
    const gradient = ctx.createRadialGradient(
      size / 2, size / 2, 0,
      size / 2, size / 2, size * 0.7
    );
    gradient.addColorStop(0, '#2a3a2a');
    gradient.addColorStop(1, '#1a2a1a');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);

    // 그리드 라인
    ctx.strokeStyle = 'rgba(255, 215, 0, 0.08)';
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

    // 유닛 렌더링
    units.forEach(unit => {
      const pos = worldToMinimap(unit.x, unit.z);
      const color = TEAM_COLORS[unit.side];
      const isSelected = unit.id === selectedUnitId;

      // 유닛 크기 (병력 비율 기반)
      const baseSize = 3;
      const unitSize = baseSize + (unit.aliveSoldiers / Math.max(unit.totalSoldiers, 1)) * 2;

      // 선택된 유닛 글로우
      if (isSelected) {
        ctx.shadowColor = '#ffd700';
        ctx.shadowBlur = 8;
        ctx.fillStyle = '#ffd700';
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, unitSize + 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // 유닛 글로우
      ctx.shadowColor = color.glow;
      ctx.shadowBlur = 4;

      // 유닛 본체
      ctx.fillStyle = color.main;
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, unitSize, 0, Math.PI * 2);
      ctx.fill();

      ctx.shadowBlur = 0;

      // 테두리
      ctx.strokeStyle = isSelected ? '#ffd700' : 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = isSelected ? 1.5 : 0.5;
      ctx.stroke();
    });

    // 뷰포트 렌더링
    const viewPos = worldToMinimap(viewport.x, viewport.z);
    const viewW = (viewport.width / mapSize.width) * size;
    const viewH = (viewport.height / mapSize.height) * size;

    // 뷰포트 배경
    ctx.fillStyle = 'rgba(255, 215, 0, 0.08)';
    ctx.fillRect(viewPos.x - viewW / 2, viewPos.y - viewH / 2, viewW, viewH);

    // 뷰포트 테두리
    ctx.strokeStyle = 'rgba(255, 215, 0, 0.7)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(viewPos.x - viewW / 2, viewPos.y - viewH / 2, viewW, viewH);

    // 코너 장식
    const cornerSize = 4;
    ctx.fillStyle = '#ffd700';
    const corners = [
      [viewPos.x - viewW / 2, viewPos.y - viewH / 2],
      [viewPos.x + viewW / 2 - cornerSize, viewPos.y - viewH / 2],
      [viewPos.x - viewW / 2, viewPos.y + viewH / 2 - cornerSize],
      [viewPos.x + viewW / 2 - cornerSize, viewPos.y + viewH / 2 - cornerSize],
    ];
    corners.forEach(([cx, cy]) => {
      ctx.fillRect(cx, cy, cornerSize, 2);
      ctx.fillRect(cx, cy, 2, cornerSize);
    });

  }, [units, viewport, mapSize, size, selectedUnitId, worldToMinimap, collapsed]);

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
      if (!isDragging || !canvasRef.current || !onCameraMove) return;

      const rect = canvasRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const worldPos = minimapToWorld(x, y);
      onCameraMove(worldPos.x, worldPos.z);
    },
    [isDragging, minimapToWorld, onCameraMove]
  );

  const handleMouseUp = useCallback(() => setIsDragging(false), []);
  const handleMouseLeave = useCallback(() => {
    setIsDragging(false);
    setIsHovering(false);
  }, []);

  // 유닛 카운트 계산
  const unitCounts = useMemo(() => ({
    attackers: units.filter(u => u.side === 'attacker').reduce((sum, u) => sum + u.aliveSoldiers, 0),
    defenders: units.filter(u => u.side === 'defender').reduce((sum, u) => sum + u.aliveSoldiers, 0),
  }), [units]);

  if (collapsed) {
    return (
      <div className={styles.minimapContainer}>
        <button className={styles.minimapCollapseBtn} onClick={onToggleCollapse}>
          📍
        </button>
      </div>
    );
  }

  return (
    <div
      className={styles.minimapContainer}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={handleMouseLeave}
    >
      <div className={styles.minimapWrapper}>
        {/* 헤더 */}
        <div className={styles.minimapHeader}>
          <span className={styles.minimapTitle}>전장 지도</span>
          <div className={styles.minimapLegend}>
            <span>
              <span className={styles.legendDot} style={{ background: TEAM_COLORS.attacker.main }} />
              {unitCounts.attackers.toLocaleString()}
            </span>
            <span>
              <span className={styles.legendDot} style={{ background: TEAM_COLORS.defender.main }} />
              {unitCounts.defenders.toLocaleString()}
            </span>
          </div>
        </div>

        {/* 캔버스 */}
        <canvas
          ref={canvasRef}
          className={styles.minimapCanvas}
          style={{ width: size, height: size }}
          onClick={handleClick}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
        />

        {/* 접기 버튼 */}
        {onToggleCollapse && (
          <button className={styles.minimapCollapseBtn} onClick={onToggleCollapse}>
            ✕
          </button>
        )}
      </div>
    </div>
  );
}





