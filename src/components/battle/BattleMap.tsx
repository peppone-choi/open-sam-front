'use client';

import React, { useState, useCallback, useRef } from 'react';
import BattleCutsceneModal from './BattleCutsceneModal';
import { BattleCutscene } from '@/types/battle';
import styles from './BattleMap.module.css';

export interface BattleUnit {
  id: string;
  x: number;
  y: number;
  name: string;
  type: 'attacker' | 'defender';
  crew?: number;
  crewtype?: number;
  generalNo?: number;
  leadership?: number;
  force?: number;
  intellect?: number;
  unitType?: string;
  portraitUrl?: string;
}

interface BattleMapProps {
  width?: number;
  height?: number;
  units?: BattleUnit[];
  onUnitClick?: (unit: BattleUnit) => void;
  onUnitMove?: (unitId: string, x: number, y: number) => void;
  onCellClick?: (x: number, y: number) => void;
  onCombat?: (attackerId: string, defenderId: string) => void;
  selectedUnitId?: string | null;
  editable?: boolean;
  showCutscenes?: boolean;
}

const GRID_SIZE = 40; // 40x40 그리드

export default function BattleMap({
  width = GRID_SIZE,
  height = GRID_SIZE,
  units = [],
  onUnitClick,
  onUnitMove,
  onCellClick,
  onCombat,
  selectedUnitId,
  editable = true,
  showCutscenes = true,
}: BattleMapProps) {
  const [draggedUnit, setDraggedUnit] = useState<BattleUnit | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [cutscene, setCutscene] = useState<BattleCutscene | null>(null);
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
    
    // 선택된 유닛이 있고, 클릭한 위치에 적 유닛이 있으면 전투 발생
    if (selectedUnitId && showCutscenes) {
      const selectedUnit = units.find(u => u.id === selectedUnitId);
      const targetUnit = units.find(u => u.x === x && u.y === y);
      
      if (selectedUnit && targetUnit && selectedUnit.type !== targetUnit.type) {
        // 전투 연출 표시
        triggerCombat(selectedUnit, targetUnit);
        return;
      }
    }
    
    if (onCellClick) {
      onCellClick(x, y);
    }
  }, [onCellClick, selectedUnitId, showCutscenes, units]);

  const triggerCombat = useCallback((attacker: BattleUnit, defender: BattleUnit) => {
    const { calculateCombat, getAttackTypeByUnitType, getAttackTypeByCrewtype } = require('@/utils/battleUtils');
    const { getUnitTypeName, getUnitTypeInfo } = require('@/utils/unitTypeMapping');
    
    const result = calculateCombat(attacker, defender);
    
    // 거리 계산
    const dx = attacker.x - defender.x;
    const dy = attacker.y - defender.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // 복합병은 거리에 따라 공격 타입 결정
    let attackType: 'melee' | 'ranged' | 'magic';
    if (attacker.crewtype) {
      const unitInfo = getUnitTypeInfo(attacker.crewtype);
      // 복합병이고 인접(거리 1.5 이하)하면 근접
      if ((attacker.crewtype >= 1501 && attacker.crewtype <= 1504) && distance <= 1.5) {
        attackType = 'melee';
      } else {
        attackType = getAttackTypeByCrewtype(attacker.crewtype);
      }
    } else {
      attackType = getAttackTypeByUnitType(attacker.unitType || '보병');
    }
    
    const attackerUnitName = attacker.crewtype ? getUnitTypeName(attacker.crewtype) : (attacker.unitType || '보병');
    const defenderUnitName = defender.crewtype ? getUnitTypeName(defender.crewtype) : (defender.unitType || '보병');
    
    const cutsceneData: BattleCutscene = {
      attacker: {
        generalId: attacker.generalNo || 0,
        generalName: attacker.name,
        portraitUrl: attacker.portraitUrl,
        unitType: attackerUnitName,
        crewBefore: attacker.crew || 0,
        crewAfter: Math.max(0, (attacker.crew || 0) - result.attackerDamage),
        leadership: attacker.leadership || 50,
        force: attacker.force || 50,
        intellect: attacker.intellect,
      },
      defender: {
        generalId: defender.generalNo || 0,
        generalName: defender.name,
        portraitUrl: defender.portraitUrl,
        unitType: defenderUnitName,
        crewBefore: defender.crew || 0,
        crewAfter: result.defenderDied ? 0 : Math.max(0, (defender.crew || 0) - result.damage),
        leadership: defender.leadership || 50,
        force: defender.force || 50,
        intellect: defender.intellect,
      },
      attackType,
      damage: result.damage,
      defenderDied: result.defenderDied,
      isCritical: result.isCritical,
      isEvaded: result.isEvaded,
    };
    
    setCutscene(cutsceneData);
    
    if (onCombat) {
      onCombat(attacker.id, defender.id);
    }
  }, [onCombat]);

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
    <>
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
    
    {/* 전투 연출 모달 */}
    {cutscene && showCutscenes && (
      <BattleCutsceneModal
        cutscene={cutscene}
        onComplete={() => setCutscene(null)}
      />
    )}
    </>
  );
}




