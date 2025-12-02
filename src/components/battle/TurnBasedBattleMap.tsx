'use client';

import React, { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import Image from 'next/image';
import { getUnitName } from './UnitSprite';
import styles from './TurnBasedBattleMap.module.css';

// ===== 타입 정의 =====
export interface Position {
  x: number;
  y: number;
}

export interface BattleUnit {
  id: string;
  generalId: number;
  generalName: string;
  position: Position;
  crew: number;
  maxCrew: number;
  crewType: number;
  hp: number;
  maxHp: number;
  morale: number;
  maxMorale: number;
  attack: number;
  defense: number;
  moveRange: number;
  attackRange: number;
  isEnemy: boolean;
  portraitUrl?: string;
  hasActed?: boolean;
  hasMoved?: boolean;
}

export interface BattleLogEntry {
  id: string;
  type: 'phase' | 'move' | 'attack' | 'damage' | 'critical' | 'evade' | 'death' | 'info';
  text: string;
  timestamp: number;
}

export interface BattleState {
  id: string;
  turn: number;
  phase: 'player' | 'enemy' | 'animation';
  activeUnitId: string | null;
  units: BattleUnit[];
  logs: BattleLogEntry[];
  winner: 'player' | 'enemy' | null;
}

export interface CombatResult {
  attackerId: string;
  defenderId: string;
  damage: number;
  isCritical: boolean;
  isEvaded: boolean;
  defenderDied: boolean;
}

// ===== 애니메이션 타입 =====
interface AnimationState {
  type: 'move' | 'attack' | 'critical' | 'evade' | 'damage' | 'death' | null;
  unitId: string | null;
  targetId?: string;
  fromPos?: Position;
  toPos?: Position;
  damage?: number;
}

// ===== 상수 =====
const GRID_SIZE = 40;
const DEFAULT_CELL_SIZE = 32; // 픽셀
const TERRAIN_COLORS: Record<string, string> = {
  plain: '#3a5a40',
  forest: '#2d4a2d',
  mountain: '#6b5b4f',
  water: '#3d5a80',
  castle: '#8b7355',
};

// ===== Props =====
interface TurnBasedBattleMapProps {
  battleState: BattleState;
  onUnitSelect?: (unit: BattleUnit | null) => void;
  onCellClick?: (position: Position) => void;
  onMove?: (unitId: string, to: Position) => void;
  onAttack?: (attackerId: string, defenderId: string) => void;
  onEndTurn?: () => void;
  terrain?: string[][]; // 지형 타입 배열
  cellSize?: number;
}

// ===== 유틸 함수 =====
function calculateMoveRange(unit: BattleUnit, units: BattleUnit[]): Position[] {
  const range: Position[] = [];
  const { x, y } = unit.position;
  const moveRange = unit.moveRange;

  for (let dx = -moveRange; dx <= moveRange; dx++) {
    for (let dy = -moveRange; dy <= moveRange; dy++) {
      const distance = Math.abs(dx) + Math.abs(dy); // 맨해튼 거리
      if (distance > 0 && distance <= moveRange) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx >= 0 && nx < GRID_SIZE && ny >= 0 && ny < GRID_SIZE) {
          // 해당 위치에 유닛이 없으면 이동 가능
          const occupied = units.some(u => u.position.x === nx && u.position.y === ny);
          if (!occupied) {
            range.push({ x: nx, y: ny });
          }
        }
      }
    }
  }
  return range;
}

function calculateAttackRange(unit: BattleUnit, units: BattleUnit[]): Position[] {
  const range: Position[] = [];
  const { x, y } = unit.position;
  const attackRange = unit.attackRange;

  for (let dx = -attackRange; dx <= attackRange; dx++) {
    for (let dy = -attackRange; dy <= attackRange; dy++) {
      const distance = Math.abs(dx) + Math.abs(dy);
      if (distance > 0 && distance <= attackRange) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx >= 0 && nx < GRID_SIZE && ny >= 0 && ny < GRID_SIZE) {
          // 적 유닛이 있으면 공격 가능
          const enemy = units.find(u => 
            u.position.x === nx && 
            u.position.y === ny && 
            u.isEnemy !== unit.isEnemy
          );
          if (enemy) {
            range.push({ x: nx, y: ny });
          }
        }
      }
    }
  }
  return range;
}

function isInRange(positions: Position[], x: number, y: number): boolean {
  return positions.some(p => p.x === x && p.y === y);
}

// ===== 메인 컴포넌트 =====
export default function TurnBasedBattleMap({
  battleState,
  onUnitSelect,
  onCellClick,
  onMove,
  onAttack,
  onEndTurn,
  terrain,
  cellSize = DEFAULT_CELL_SIZE,
}: TurnBasedBattleMapProps) {
  // 상태
  const [selectedUnit, setSelectedUnit] = useState<BattleUnit | null>(null);
  const [mode, setMode] = useState<'select' | 'move' | 'attack'>('select');
  const [moveRange, setMoveRange] = useState<Position[]>([]);
  const [attackRange, setAttackRange] = useState<Position[]>([]);
  const [hoveredCell, setHoveredCell] = useState<Position | null>(null);
  const [animation, setAnimation] = useState<AnimationState>({ type: null, unitId: null });
  const [damagePopups, setDamagePopups] = useState<Array<{ id: string; x: number; y: number; damage: number; isCritical: boolean }>>([]);
  
  // 줌/팬 상태 (모바일용)
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  const mapRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // 유닛 선택 핸들러
  const handleUnitClick = useCallback((unit: BattleUnit) => {
    if (battleState.phase === 'animation') return;
    if (animation.type) return;

    // 적 유닛 클릭 - 공격 모드에서 공격 실행
    if (unit.isEnemy && mode === 'attack' && selectedUnit) {
      const inRange = isInRange(attackRange, unit.position.x, unit.position.y);
      if (inRange && onAttack) {
        onAttack(selectedUnit.id, unit.id);
        setMode('select');
        setSelectedUnit(null);
        setMoveRange([]);
        setAttackRange([]);
        return;
      }
    }

    // 아군 유닛 선택
    if (!unit.isEnemy && battleState.phase === 'player') {
      if (selectedUnit?.id === unit.id) {
        // 같은 유닛 다시 클릭 - 선택 해제
        setSelectedUnit(null);
        setMoveRange([]);
        setAttackRange([]);
        setMode('select');
        onUnitSelect?.(null);
      } else {
        // 새 유닛 선택
        setSelectedUnit(unit);
        setMoveRange(calculateMoveRange(unit, battleState.units));
        setAttackRange(calculateAttackRange(unit, battleState.units));
        setMode('select');
        onUnitSelect?.(unit);
      }
    }
  }, [battleState, selectedUnit, mode, attackRange, animation, onAttack, onUnitSelect]);

  // 셀 클릭 핸들러
  const handleCellClick = useCallback((x: number, y: number) => {
    if (battleState.phase === 'animation') return;
    if (animation.type) return;

    const clickedUnit = battleState.units.find(
      u => u.position.x === x && u.position.y === y
    );

    if (clickedUnit) {
      handleUnitClick(clickedUnit);
      return;
    }

    // 이동 모드에서 빈 셀 클릭
    if (mode === 'move' && selectedUnit && !selectedUnit.hasMoved) {
      const inRange = isInRange(moveRange, x, y);
      if (inRange && onMove) {
        onMove(selectedUnit.id, { x, y });
        setMode('select');
        setMoveRange([]);
      }
    }

    onCellClick?.({ x, y });
  }, [battleState, selectedUnit, mode, moveRange, animation, handleUnitClick, onMove, onCellClick]);

  // 이동 모드 토글
  const handleMoveMode = useCallback(() => {
    if (!selectedUnit || selectedUnit.hasMoved) return;
    setMode(mode === 'move' ? 'select' : 'move');
  }, [selectedUnit, mode]);

  // 공격 모드 토글
  const handleAttackMode = useCallback(() => {
    if (!selectedUnit || selectedUnit.hasActed) return;
    setMode(mode === 'attack' ? 'select' : 'attack');
  }, [selectedUnit, mode]);

  // 줌 핸들러
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setScale(s => Math.min(Math.max(s * delta, 0.3), 2));
  }, []);

  // 드래그 핸들러
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 1 || e.shiftKey) { // 미들 버튼 또는 Shift+클릭으로 팬
      setIsDragging(true);
      setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
    }
  }, [offset]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDragging) {
      setOffset({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  }, [isDragging, dragStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // 터치 제스처 (핀치 줌)
  const touchStartRef = useRef<{ distance: number; scale: number } | null>(null);
  
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      touchStartRef.current = { distance, scale };
    }
  }, [scale]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2 && touchStartRef.current) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const newScale = touchStartRef.current.scale * (distance / touchStartRef.current.distance);
      setScale(Math.min(Math.max(newScale, 0.3), 2));
    }
  }, []);

  // 데미지 팝업 추가
  const showDamagePopup = useCallback((unitId: string, damage: number, isCritical: boolean) => {
    const unit = battleState.units.find(u => u.id === unitId);
    if (!unit) return;
    
    const popupId = `${Date.now()}-${Math.random()}`;
    setDamagePopups(prev => [...prev, {
      id: popupId,
      x: unit.position.x,
      y: unit.position.y,
      damage,
      isCritical,
    }]);

    // 1.5초 후 제거
    setTimeout(() => {
      setDamagePopups(prev => prev.filter(p => p.id !== popupId));
    }, 1500);
  }, [battleState.units]);

  // 애니메이션 실행 (외부에서 호출)
  const playAttackAnimation = useCallback((
    attackerId: string, 
    defenderId: string, 
    result: CombatResult
  ) => {
    const attacker = battleState.units.find(u => u.id === attackerId);
    const defender = battleState.units.find(u => u.id === defenderId);
    if (!attacker || !defender) return;

    // 공격 애니메이션
    setAnimation({
      type: 'attack',
      unitId: attackerId,
      targetId: defenderId,
      fromPos: attacker.position,
      toPos: defender.position,
    });

    // 0.3초 후 피격 이펙트
    setTimeout(() => {
      if (result.isEvaded) {
        setAnimation({
          type: 'evade',
          unitId: defenderId,
        });
      } else if (result.isCritical) {
        setAnimation({
          type: 'critical',
          unitId: defenderId,
          damage: result.damage,
        });
        showDamagePopup(defenderId, result.damage, true);
      } else {
        setAnimation({
          type: 'damage',
          unitId: defenderId,
          damage: result.damage,
        });
        showDamagePopup(defenderId, result.damage, false);
      }
    }, 300);

    // 1초 후 애니메이션 종료
    setTimeout(() => {
      if (result.defenderDied) {
        setAnimation({
          type: 'death',
          unitId: defenderId,
        });
        setTimeout(() => {
          setAnimation({ type: null, unitId: null });
        }, 500);
      } else {
        setAnimation({ type: null, unitId: null });
      }
    }, 1000);
  }, [battleState.units, showDamagePopup]);

  // 그리드 셀 생성
  const cells = useMemo(() => {
    const result: Array<{ x: number; y: number; terrain: string }> = [];
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        result.push({
          x,
          y,
          terrain: terrain?.[y]?.[x] || 'plain',
        });
      }
    }
    return result;
  }, [terrain]);

  // 유닛 위치별 인덱스
  const unitByPosition = useMemo(() => {
    const map = new Map<string, BattleUnit>();
    for (const unit of battleState.units) {
      map.set(`${unit.position.x}-${unit.position.y}`, unit);
    }
    return map;
  }, [battleState.units]);

  // 맵 크기
  const mapWidth = GRID_SIZE * cellSize;
  const mapHeight = GRID_SIZE * cellSize;

  return (
    <div 
      ref={containerRef}
      className={styles.container}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
    >
      {/* 상단 정보 바 */}
      <div className={styles.topBar}>
        <div className={styles.turnInfo}>
          <span className={styles.turnLabel}>턴</span>
          <span className={styles.turnNumber}>{battleState.turn}</span>
        </div>
        <div className={styles.phaseInfo}>
          <span className={`${styles.phaseBadge} ${styles[battleState.phase]}`}>
            {battleState.phase === 'player' ? '아군 턴' : 
             battleState.phase === 'enemy' ? '적군 턴' : '진행 중...'}
          </span>
        </div>
        <div className={styles.zoomControl}>
          <button onClick={() => setScale(s => Math.min(s + 0.1, 2))}>+</button>
          <span>{Math.round(scale * 100)}%</span>
          <button onClick={() => setScale(s => Math.max(s - 0.1, 0.3))}>-</button>
        </div>
      </div>

      {/* 전투 맵 */}
      <div 
        ref={mapRef}
        className={styles.mapWrapper}
        style={{
          transform: `scale(${scale}) translate(${offset.x / scale}px, ${offset.y / scale}px)`,
        }}
      >
        <div 
          className={styles.battleMap}
          style={{
            width: mapWidth,
            height: mapHeight,
            gridTemplateColumns: `repeat(${GRID_SIZE}, ${cellSize}px)`,
            gridTemplateRows: `repeat(${GRID_SIZE}, ${cellSize}px)`,
          }}
        >
          {/* 그리드 셀 */}
          {cells.map(({ x, y, terrain: cellTerrain }) => {
            const unit = unitByPosition.get(`${x}-${y}`);
            const isMovable = mode === 'move' && isInRange(moveRange, x, y);
            const isAttackable = mode === 'attack' && isInRange(attackRange, x, y);
            const isSelected = selectedUnit?.position.x === x && selectedUnit?.position.y === y;
            const isHovered = hoveredCell?.x === x && hoveredCell?.y === y;

            return (
              <div
                key={`${x}-${y}`}
                className={`
                  ${styles.cell}
                  ${isMovable ? styles.movable : ''}
                  ${isAttackable ? styles.attackable : ''}
                  ${isSelected ? styles.selected : ''}
                  ${isHovered ? styles.hovered : ''}
                `}
                style={{
                  backgroundColor: TERRAIN_COLORS[cellTerrain] || TERRAIN_COLORS.plain,
                }}
                onClick={() => handleCellClick(x, y)}
                onMouseEnter={() => setHoveredCell({ x, y })}
                onMouseLeave={() => setHoveredCell(null)}
                title={`(${x}, ${y})`}
              >
                {/* 지형 패턴 */}
                <div className={`${styles.terrainPattern} ${styles[cellTerrain]}`} />
              </div>
            );
          })}

          {/* 유닛 렌더링 */}
          {battleState.units.map(unit => {
            const isSelected = selectedUnit?.id === unit.id;
            const isAnimating = animation.unitId === unit.id || animation.targetId === unit.id;
            const animClass = animation.unitId === unit.id ? animation.type : null;

            return (
              <div
                key={unit.id}
                className={`
                  ${styles.unit}
                  ${unit.isEnemy ? styles.enemy : styles.ally}
                  ${isSelected ? styles.unitSelected : ''}
                  ${unit.hasActed ? styles.acted : ''}
                  ${animClass ? styles[`anim_${animClass}`] : ''}
                `}
                style={{
                  left: unit.position.x * cellSize,
                  top: unit.position.y * cellSize,
                  width: cellSize,
                  height: cellSize,
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleUnitClick(unit);
                }}
              >
                {/* 유닛 스프라이트 */}
                <div className={styles.unitSprite}>
                  <UnitImage crewType={unit.crewType} size={cellSize - 4} />
                </div>

                {/* HP 바 */}
                <div className={styles.miniHpBar}>
                  <div 
                    className={styles.miniHpFill}
                    style={{ 
                      width: `${(unit.hp / unit.maxHp) * 100}%`,
                      backgroundColor: getHpColor(unit.hp / unit.maxHp),
                    }}
                  />
                </div>

                {/* 병사 수 */}
                <div className={styles.crewCount}>
                  {formatCrew(unit.crew)}
                </div>

                {/* 사기 표시 (낮을 때만) */}
                {unit.morale < 50 && (
                  <div className={styles.lowMorale}>⚠</div>
                )}

                {/* 선택 표시 */}
                {isSelected && <div className={styles.selectionRing} />}

                {/* 행동 완료 표시 */}
                {unit.hasActed && <div className={styles.actedOverlay}>✓</div>}
              </div>
            );
          })}

          {/* 데미지 팝업 */}
          {damagePopups.map(popup => (
            <DamagePopup
              key={popup.id}
              x={popup.x * cellSize + cellSize / 2}
              y={popup.y * cellSize}
              damage={popup.damage}
              isCritical={popup.isCritical}
            />
          ))}

          {/* 공격 애니메이션 효과 */}
          {animation.type === 'attack' && animation.fromPos && animation.toPos && (
            <AttackLine
              from={animation.fromPos}
              to={animation.toPos}
              cellSize={cellSize}
            />
          )}

          {/* 크리티컬 이펙트 */}
          {animation.type === 'critical' && animation.unitId && (
            <CriticalEffect
              x={battleState.units.find(u => u.id === animation.unitId)?.position.x ?? 0}
              y={battleState.units.find(u => u.id === animation.unitId)?.position.y ?? 0}
              cellSize={cellSize}
            />
          )}

          {/* 회피 이펙트 */}
          {animation.type === 'evade' && animation.unitId && (
            <EvadeEffect
              x={battleState.units.find(u => u.id === animation.unitId)?.position.x ?? 0}
              y={battleState.units.find(u => u.id === animation.unitId)?.position.y ?? 0}
              cellSize={cellSize}
            />
          )}
        </div>
      </div>

      {/* 액션 버튼 (모바일용) */}
      {selectedUnit && battleState.phase === 'player' && (
        <div className={styles.actionButtons}>
          <button
            className={`${styles.actionBtn} ${styles.moveBtn} ${mode === 'move' ? styles.active : ''}`}
            onClick={handleMoveMode}
            disabled={selectedUnit.hasMoved}
          >
            🚶 이동
          </button>
          <button
            className={`${styles.actionBtn} ${styles.attackBtn} ${mode === 'attack' ? styles.active : ''}`}
            onClick={handleAttackMode}
            disabled={selectedUnit.hasActed}
          >
            ⚔️ 공격
          </button>
          <button
            className={`${styles.actionBtn} ${styles.waitBtn}`}
            onClick={() => {
              setSelectedUnit(null);
              setMode('select');
              setMoveRange([]);
              setAttackRange([]);
            }}
          >
            ⏸️ 대기
          </button>
        </div>
      )}

      {/* 하단 컨트롤 */}
      <div className={styles.bottomBar}>
        <button
          className={styles.endTurnBtn}
          onClick={onEndTurn}
          disabled={battleState.phase !== 'player'}
        >
          턴 종료
        </button>
      </div>
    </div>
  );
}

// ===== 서브 컴포넌트 =====

// 유닛 이미지
function UnitImage({ crewType, size }: { crewType: number; size: number }) {
  const [error, setError] = useState(false);
  
  // crewType을 유닛 이미지 인덱스로 매핑
  const getUnitImageIndex = (crewType: number): number => {
    // 1000번대 -> 0-44 인덱스로 매핑
    if (crewType === 1000) return 0; // 성벽
    if (crewType >= 1100 && crewType <= 1116) return crewType - 1099; // 보병 1-17
    if (crewType >= 1200 && crewType <= 1207) return crewType - 1182; // 궁병 18-25
    if (crewType >= 1300 && crewType <= 1309) return crewType - 1274; // 기병 26-35
    if (crewType >= 1400 && crewType <= 1403) return crewType - 1364; // 특수병 36-39
    if (crewType >= 1500 && crewType <= 1503) return crewType - 1460; // 공성병기 40-43
    return 1; // 기본
  };

  const imageIndex = getUnitImageIndex(crewType);
  const imagePath = `/assets/units/unit_${String(imageIndex).padStart(3, '0')}.png`;

  if (error) {
    return (
      <div 
        className={styles.unitFallback}
        style={{ width: size, height: size }}
        title={getUnitName(crewType)}
      >
        {getUnitName(crewType).substring(0, 2)}
      </div>
    );
  }

  return (
    <Image
      src={imagePath}
      alt={getUnitName(crewType)}
      width={size}
      height={size}
      style={{ objectFit: 'contain' }}
      onError={() => setError(true)}
      draggable={false}
    />
  );
}

// 데미지 팝업
function DamagePopup({ 
  x, y, damage, isCritical 
}: { 
  x: number; 
  y: number; 
  damage: number; 
  isCritical: boolean;
}) {
  return (
    <div
      className={`${styles.damagePopup} ${isCritical ? styles.critical : ''}`}
      style={{ left: x, top: y }}
    >
      {isCritical && <span className={styles.criticalText}>크리티컬!</span>}
      <span className={styles.damageNumber}>-{damage}</span>
    </div>
  );
}

// 공격 라인
function AttackLine({ 
  from, to, cellSize 
}: { 
  from: Position; 
  to: Position; 
  cellSize: number;
}) {
  const fromX = from.x * cellSize + cellSize / 2;
  const fromY = from.y * cellSize + cellSize / 2;
  const toX = to.x * cellSize + cellSize / 2;
  const toY = to.y * cellSize + cellSize / 2;

  return (
    <svg className={styles.attackLine}>
      <line
        x1={fromX}
        y1={fromY}
        x2={toX}
        y2={toY}
        stroke="#ff4444"
        strokeWidth="3"
        strokeDasharray="8,4"
        className={styles.attackLineAnim}
      />
      <circle
        cx={toX}
        cy={toY}
        r="8"
        fill="#ff4444"
        className={styles.attackImpact}
      />
    </svg>
  );
}

// 크리티컬 이펙트
function CriticalEffect({ 
  x, y, cellSize 
}: { 
  x: number; 
  y: number; 
  cellSize: number;
}) {
  return (
    <div
      className={styles.criticalEffect}
      style={{
        left: x * cellSize,
        top: y * cellSize,
        width: cellSize,
        height: cellSize,
      }}
    >
      <div className={styles.criticalFlash} />
      <div className={styles.criticalStar}>★</div>
    </div>
  );
}

// 회피 이펙트
function EvadeEffect({ 
  x, y, cellSize 
}: { 
  x: number; 
  y: number; 
  cellSize: number;
}) {
  return (
    <div
      className={styles.evadeEffect}
      style={{
        left: x * cellSize,
        top: y * cellSize,
        width: cellSize,
        height: cellSize,
      }}
    >
      <div className={styles.evadeText}>MISS!</div>
      <div className={styles.evadeTrail} />
    </div>
  );
}

// ===== 유틸 함수 =====
function getHpColor(ratio: number): string {
  if (ratio > 0.6) return '#4caf50';
  if (ratio > 0.3) return '#ffc107';
  return '#f44336';
}

function formatCrew(crew: number): string {
  if (crew >= 10000) return `${(crew / 10000).toFixed(1)}만`;
  if (crew >= 1000) return `${(crew / 1000).toFixed(1)}천`;
  return String(crew);
}

// Export utility functions for external use
export { calculateMoveRange, calculateAttackRange, isInRange };




