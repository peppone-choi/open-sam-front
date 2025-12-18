'use client';

/**
 * 전술전투 맵 컴포넌트
 * 20x20 격자 기반 전술 전투 화면
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import styles from './TacticalBattleMap.module.css';

// ============================================================
// 타입 정의
// ============================================================

type TerrainType = 'plain' | 'forest' | 'mountain' | 'water' | 'wall' | 'gate' | 'castle' | 'headquarters';
type UnitType = 'infantry' | 'cavalry' | 'archer' | 'crossbow' | 'siege' | 'wall' | 'gate';
type UnitStatus = 'active' | 'retreated' | 'dead' | 'captured';

interface Position {
  x: number;
  y: number;
}

interface TerrainCell {
  type: TerrainType;
  hp?: number;
  maxHp?: number;
  destroyed?: boolean;
}

interface TacticalUnit {
  id: string;
  generalId: number;
  name: string;
  side: 'attacker' | 'defender';
  nationId: number;
  position: Position;
  hp: number;
  maxHp: number;
  morale: number;
  status: UnitStatus;
  unitType: UnitType;
  attack: number;
  defense: number;
  speed: number;
  hasMoved: boolean;
  hasActed: boolean;
}

interface BattleParticipant {
  nationId: number;
  nationName: string;
  nationColor: string;
  isUserControlled: boolean;
}

interface ActionLog {
  turn: number;
  actorName: string;
  action: string;
  targetName?: string;
  damage?: number;
  timestamp: string;
}

interface TacticalBattleData {
  battleId: string;
  cityName: string;
  status: 'waiting' | 'ready' | 'ongoing' | 'finished';
  mapWidth: number;
  mapHeight: number;
  terrain: TerrainCell[][];
  attacker: BattleParticipant;
  defender: BattleParticipant;
  units: TacticalUnit[];
  currentTurn: number;
  currentSide: 'attacker' | 'defender';
  winner?: string;
  result?: {
    attackerCasualties: number;
    defenderCasualties: number;
    cityOccupied: boolean;
  };
  actionLogs?: ActionLog[];
}

interface TacticalBattleMapProps {
  battleData: TacticalBattleData;
  onMove?: (unitId: string, position: Position) => void;
  onAttack?: (unitId: string, targetId: string) => void;
  onWait?: (unitId: string) => void;
  onEndTurn?: (side: 'attacker' | 'defender') => void;
  playerSide?: 'attacker' | 'defender';
  isMyTurn?: boolean;
}

// ============================================================
// 지형/유닛 이모지 매핑
// ============================================================

const TERRAIN_EMOJI: Record<TerrainType, string> = {
  plain: '',
  forest: '🌲',
  mountain: '🏔️',
  water: '💧',
  wall: '🧱',
  gate: '🚪',
  castle: '',
  headquarters: '🏯',
};

const UNIT_EMOJI: Record<UnitType, string> = {
  infantry: '🛡️',
  cavalry: '🐎',
  archer: '🏹',
  crossbow: '⚔️',
  siege: '🗡️',
  wall: '🧱',
  gate: '🚪',
};

// ============================================================
// 컴포넌트
// ============================================================

export function TacticalBattleMap({
  battleData,
  onMove,
  onAttack,
  onWait,
  onEndTurn,
  playerSide,
  isMyTurn = false,
}: TacticalBattleMapProps) {
  const [selectedUnit, setSelectedUnit] = useState<TacticalUnit | null>(null);
  const [highlightedCells, setHighlightedCells] = useState<Position[]>([]);
  const [attackableTargets, setAttackableTargets] = useState<string[]>([]);
  const [mode, setMode] = useState<'select' | 'move' | 'attack'>('select');
  
  const { terrain, units, currentTurn, currentSide, status, winner } = battleData;
  
  // 유닛 위치 맵
  const unitPositionMap = useMemo(() => {
    const map = new Map<string, TacticalUnit>();
    units.forEach(unit => {
      if (unit.status === 'active') {
        map.set(`${unit.position.x},${unit.position.y}`, unit);
      }
    });
    return map;
  }, [units]);
  
  // 유닛 선택
  const handleUnitClick = useCallback((unit: TacticalUnit) => {
    if (status !== 'ongoing') return;
    if (unit.side !== playerSide) return;
    if (!isMyTurn) return;
    
    setSelectedUnit(unit);
    setMode('select');
    setHighlightedCells([]);
    setAttackableTargets([]);
  }, [status, playerSide, isMyTurn]);
  
  // 이동 모드
  const handleMoveMode = useCallback(async () => {
    if (!selectedUnit) return;
    if (selectedUnit.hasMoved) return;
    
    setMode('move');
    
    // TODO: API 호출하여 이동 가능 위치 가져오기
    // 임시로 3칸 범위 표시
    const positions: Position[] = [];
    const { x, y } = selectedUnit.position;
    for (let dy = -3; dy <= 3; dy++) {
      for (let dx = -3; dx <= 3; dx++) {
        if (Math.abs(dx) + Math.abs(dy) <= 3) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx >= 0 && nx < 20 && ny >= 0 && ny < 20) {
            if (!unitPositionMap.has(`${nx},${ny}`)) {
              positions.push({ x: nx, y: ny });
            }
          }
        }
      }
    }
    setHighlightedCells(positions);
  }, [selectedUnit, unitPositionMap]);
  
  // 공격 모드
  const handleAttackMode = useCallback(() => {
    if (!selectedUnit) return;
    if (selectedUnit.hasActed) return;
    
    setMode('attack');
    
    // TODO: API 호출하여 공격 가능 대상 가져오기
    // 임시로 사정거리 내 적 유닛 표시
    const range = selectedUnit.unitType === 'archer' ? 3 : 1;
    const targets: string[] = [];
    units.forEach(unit => {
      if (unit.side !== selectedUnit.side && unit.status === 'active') {
        const dist = Math.abs(unit.position.x - selectedUnit.position.x) + 
                     Math.abs(unit.position.y - selectedUnit.position.y);
        if (dist <= range) {
          targets.push(unit.id);
        }
      }
    });
    setAttackableTargets(targets);
  }, [selectedUnit, units]);
  
  // 셀 클릭
  const handleCellClick = useCallback((x: number, y: number) => {
    if (status !== 'ongoing') return;
    
    // 이동 모드에서 이동 실행
    if (mode === 'move' && selectedUnit) {
      const isHighlighted = highlightedCells.some(p => p.x === x && p.y === y);
      if (isHighlighted) {
        onMove?.(selectedUnit.id, { x, y });
        setMode('select');
        setHighlightedCells([]);
        setSelectedUnit(null);
      }
    }
    
    // 유닛 클릭
    const unit = unitPositionMap.get(`${x},${y}`);
    if (unit) {
      if (mode === 'attack' && attackableTargets.includes(unit.id)) {
        // 공격 실행
        if (selectedUnit) {
          onAttack?.(selectedUnit.id, unit.id);
          setMode('select');
          setAttackableTargets([]);
          setSelectedUnit(null);
        }
      } else if (unit.side === playerSide) {
        handleUnitClick(unit);
      }
    }
  }, [mode, selectedUnit, highlightedCells, attackableTargets, unitPositionMap, status, playerSide, onMove, onAttack, handleUnitClick]);
  
  // 대기
  const handleWait = useCallback(() => {
    if (!selectedUnit) return;
    onWait?.(selectedUnit.id);
    setSelectedUnit(null);
    setMode('select');
  }, [selectedUnit, onWait]);
  
  // 턴 종료
  const handleEndTurn = useCallback(() => {
    if (!playerSide) return;
    onEndTurn?.(playerSide);
    setSelectedUnit(null);
    setMode('select');
    setHighlightedCells([]);
    setAttackableTargets([]);
  }, [playerSide, onEndTurn]);
  
  // 셀 렌더링
  const renderCell = useCallback((x: number, y: number) => {
    const cell = terrain[y]?.[x];
    if (!cell) return null;
    
    const unit = unitPositionMap.get(`${x},${y}`);
    const isSelected = selectedUnit?.position.x === x && selectedUnit?.position.y === y;
    const isHighlighted = highlightedCells.some(p => p.x === x && p.y === y);
    const isAttackable = unit && attackableTargets.includes(unit.id);
    
    // 셀 클래스
    let cellClass = styles.cell;
    if (cell.type === 'castle' || cell.type === 'headquarters') {
      cellClass += ` ${styles.castle}`;
    } else if (cell.type === 'wall') {
      cellClass += cell.destroyed ? ` ${styles.destroyed}` : ` ${styles.wall}`;
    } else if (cell.type === 'gate') {
      cellClass += cell.destroyed ? ` ${styles.destroyed}` : ` ${styles.gate}`;
    } else if (cell.type === 'forest') {
      cellClass += ` ${styles.forest}`;
    } else if (cell.type === 'mountain') {
      cellClass += ` ${styles.mountain}`;
    } else if (cell.type === 'water') {
      cellClass += ` ${styles.water}`;
    }
    
    if (isSelected) cellClass += ` ${styles.selected}`;
    if (isHighlighted) cellClass += ` ${styles.highlighted}`;
    if (isAttackable) cellClass += ` ${styles.attackable}`;
    
    return (
      <div
        key={`${x},${y}`}
        className={cellClass}
        onClick={() => handleCellClick(x, y)}
        title={`(${x}, ${y}) ${cell.type}${unit ? ` - ${unit.name}` : ''}`}
      >
        {/* 지형 이모지 */}
        {TERRAIN_EMOJI[cell.type] && (
          <span className={styles.terrain}>{TERRAIN_EMOJI[cell.type]}</span>
        )}
        
        {/* 유닛 */}
        {unit && (
          <div 
            className={`${styles.unit} ${unit.side === 'attacker' ? styles.attacker : styles.defender}`}
            title={`${unit.name} (HP: ${unit.hp}/${unit.maxHp})`}
          >
            <span className={styles.unitEmoji}>{UNIT_EMOJI[unit.unitType] || '👤'}</span>
            <div 
              className={styles.unitHpBar}
              style={{ width: `${(unit.hp / unit.maxHp) * 100}%` }}
            />
          </div>
        )}
        
        {/* 성벽/성문 HP 표시 */}
        {(cell.type === 'wall' || cell.type === 'gate') && cell.hp !== undefined && !cell.destroyed && (
          <div className={styles.structureHp}>
            <div 
              className={styles.structureHpBar}
              style={{ width: `${(cell.hp / (cell.maxHp || 10000)) * 100}%` }}
            />
          </div>
        )}
      </div>
    );
  }, [terrain, unitPositionMap, selectedUnit, highlightedCells, attackableTargets, handleCellClick]);
  
  return (
    <div className={styles.container}>
      {/* 헤더 */}
      <div className={styles.header}>
        <h2 className={styles.title}>
          🏰 {battleData.cityName} 공성전
        </h2>
        <div className={styles.turnInfo}>
          <span>턴: {currentTurn}</span>
          <span className={currentSide === 'attacker' ? styles.attackerTurn : styles.defenderTurn}>
            {currentSide === 'attacker' ? '공격측' : '방어측'} 차례
          </span>
          {status === 'finished' && winner && (
            <span className={styles.winner}>
              🏆 {winner === 'attacker' ? '공격측' : winner === 'defender' ? '방어측' : '무승부'} 승리!
            </span>
          )}
        </div>
      </div>
      
      {/* 참여자 정보 */}
      <div className={styles.participants}>
        <div className={styles.participant} style={{ borderColor: battleData.attacker.nationColor }}>
          <span className={styles.nationFlag} style={{ backgroundColor: battleData.attacker.nationColor }} />
          <span>{battleData.attacker.nationName}</span>
          <span className={styles.unitCount}>
            {units.filter(u => u.side === 'attacker' && u.status === 'active').length}명
          </span>
        </div>
        <span className={styles.vs}>VS</span>
        <div className={styles.participant} style={{ borderColor: battleData.defender.nationColor }}>
          <span className={styles.nationFlag} style={{ backgroundColor: battleData.defender.nationColor }} />
          <span>{battleData.defender.nationName}</span>
          <span className={styles.unitCount}>
            {units.filter(u => u.side === 'defender' && u.status === 'active' && u.unitType !== 'wall' && u.unitType !== 'gate').length}명
          </span>
        </div>
      </div>
      
      {/* 맵 */}
      <div className={styles.mapContainer}>
        <div 
          className={styles.map}
          style={{
            gridTemplateColumns: `repeat(${battleData.mapWidth}, 1fr)`,
            gridTemplateRows: `repeat(${battleData.mapHeight}, 1fr)`,
          }}
        >
          {Array.from({ length: battleData.mapHeight }, (_, y) =>
            Array.from({ length: battleData.mapWidth }, (_, x) => renderCell(x, y))
          )}
        </div>
      </div>
      
      {/* 컨트롤 패널 */}
      {status === 'ongoing' && isMyTurn && playerSide === currentSide && (
        <div className={styles.controls}>
          {selectedUnit ? (
            <>
              <div className={styles.selectedInfo}>
                <strong>{selectedUnit.name}</strong>
                <span>HP: {selectedUnit.hp}/{selectedUnit.maxHp}</span>
                <span>공격: {selectedUnit.attack}</span>
                <span>방어: {selectedUnit.defense}</span>
              </div>
              <div className={styles.buttons}>
                <button 
                  onClick={handleMoveMode} 
                  disabled={selectedUnit.hasMoved}
                  className={mode === 'move' ? styles.active : ''}
                >
                  🚶 이동
                </button>
                <button 
                  onClick={handleAttackMode} 
                  disabled={selectedUnit.hasActed}
                  className={mode === 'attack' ? styles.active : ''}
                >
                  ⚔️ 공격
                </button>
                <button onClick={handleWait}>
                  ⏳ 대기
                </button>
              </div>
            </>
          ) : (
            <div className={styles.noSelection}>
              유닛을 선택하세요
            </div>
          )}
          <button onClick={handleEndTurn} className={styles.endTurnBtn}>
            ➡️ 턴 종료
          </button>
        </div>
      )}
      
      {/* 로그 */}
      {battleData.actionLogs && battleData.actionLogs.length > 0 && (
        <div className={styles.logs}>
          <h4>전투 로그</h4>
          <div className={styles.logList}>
            {battleData.actionLogs.slice(-10).reverse().map((log, i) => (
              <div key={i} className={styles.logItem}>
                <span className={styles.logTurn}>[{log.turn}턴]</span>
                <span>{log.actorName}</span>
                <span className={styles.logAction}>{log.action}</span>
                {log.targetName && <span>→ {log.targetName}</span>}
                {log.damage && <span className={styles.logDamage}>-{log.damage}</span>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default TacticalBattleMap;


