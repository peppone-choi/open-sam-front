'use client';

import React, { useState, useCallback, useRef } from 'react';
import styles from './BattleMap.module.css';

export interface BattleUnit {
  id: string;
  x: number;
  y: number;
  name: string;
  type: 'attacker' | 'defender';
  crew?: number;
  generalNo?: number;
}

interface BattleMapProps {
  width?: number;
  height?: number;
  units?: BattleUnit[];
  onUnitClick?: (unit: BattleUnit) => void;
  onUnitMove?: (unitId: string, x: number, y: number) => void;
  onCellClick?: (x: number, y: number) => void;
  selectedUnitId?: string | null;
  editable?: boolean;
}

const GRID_SIZE = 40; // 40x40 그리드

export default function BattleMap({
  width = GRID_SIZE,
  height = GRID_SIZE,
  units = [],
  onUnitClick,
  onUnitMove,
  onCellClick,
  selectedUnitId,
  editable = true,
}: BattleMapProps) {
  const [draggedUnit, setDraggedUnit] = useState<BattleUnit | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const mapRef = useRef<HTMLDivElement>(null);

  const CELL_SIZE = 15; // 각 셀의 픽셀 크기

  const getCellPosition = useCallback((x: number, y: number) => {
    return {
      left: x * CELL_SIZE,
      top: y * CELL_SIZE,
    };
  }, [CELL_SIZE]);

  const getGridPosition = useCallback((clientX: number, clientY: number) => {
    if (!mapRef.current) return null;
    const rect = mapRef.current.getBoundingClientRect();
    const x = Math.floor((clientX - rect.left) / CELL_SIZE);
    const y = Math.floor((clientY - rect.top) / CELL_SIZE);
    if (x >= 0 && x < width && y >= 0 && y < height) {
      return { x, y };
    }
    return null;
  }, [width, height, CELL_SIZE]);

  const handleCellClick = useCallback((e: React.MouseEvent, x: number, y: number) => {
    e.stopPropagation();
    if (onCellClick) {
      onCellClick(x, y);
    }
  }, [onCellClick]);

  const handleUnitMouseDown = useCallback((e: React.MouseEvent, unit: BattleUnit) => {
    if (!editable) return;
    e.stopPropagation();
    setDraggedUnit(unit);
    const pos = getGridPosition(e.clientX, e.clientY);
    if (pos) {
      setDragOffset({
        x: e.clientX - pos.x * CELL_SIZE,
        y: e.clientY - pos.y * CELL_SIZE,
      });
    }
    if (onUnitClick) {
      onUnitClick(unit);
    }
  }, [editable, getGridPosition, CELL_SIZE, onUnitClick]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!draggedUnit || !editable) return;
    e.preventDefault();
    const pos = getGridPosition(e.clientX, e.clientY);
    if (pos && draggedUnit.x !== pos.x || draggedUnit.y !== pos.y) {
      if (onUnitMove) {
        onUnitMove(draggedUnit.id, pos.x, pos.y);
      }
    }
  }, [draggedUnit, editable, getGridPosition, onUnitMove]);

  const handleMouseUp = useCallback(() => {
    setDraggedUnit(null);
    setDragOffset({ x: 0, y: 0 });
  }, []);

  return (
    <div
      ref={mapRef}
      className={styles.battleMap}
      style={{
        width: width * CELL_SIZE,
        height: height * CELL_SIZE,
        gridTemplateColumns: `repeat(${width}, ${CELL_SIZE}px)`,
        gridTemplateRows: `repeat(${height}, ${CELL_SIZE}px)`,
      }}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* 그리드 셀들 */}
      {Array.from({ length: width * height }).map((_, idx) => {
        const x = idx % width;
        const y = Math.floor(idx / width);
        return (
          <div
            key={`cell-${x}-${y}`}
            className={styles.gridCell}
            style={{
              gridColumn: x + 1,
              gridRow: y + 1,
            }}
            onClick={(e) => handleCellClick(e, x, y)}
            title={`${x}, ${y}`}
          />
        );
      })}

      {/* 유닛들 */}
      {units.map((unit) => {
        const pos = getCellPosition(unit.x, unit.y);
        const isSelected = selectedUnitId === unit.id;
        return (
          <div
            key={unit.id}
            className={`${styles.battleUnit} ${styles[unit.type]} ${isSelected ? styles.selected : ''}`}
            style={{
              left: pos.left,
              top: pos.top,
              width: CELL_SIZE - 2,
              height: CELL_SIZE - 2,
            }}
            onMouseDown={(e) => handleUnitMouseDown(e, unit)}
            title={unit.name}
          >
            <div className={styles.unitIcon}>{unit.type === 'attacker' ? '⚔' : '🛡'}</div>
            {unit.crew !== undefined && (
              <div className={styles.unitCrew}>{Math.floor(unit.crew / 100)}K</div>
            )}
          </div>
        );
      })}

      {/* 그리드 라벨 */}
      <div className={styles.gridLabels}>
        {Array.from({ length: width }).map((_, x) => (
          <div key={`label-x-${x}`} className={styles.gridLabelX} style={{ left: x * CELL_SIZE }}>
            {x}
          </div>
        ))}
        {Array.from({ length: height }).map((_, y) => (
          <div key={`label-y-${y}`} className={styles.gridLabelY} style={{ top: y * CELL_SIZE }}>
            {y}
          </div>
        ))}
      </div>
    </div>
  );
}


