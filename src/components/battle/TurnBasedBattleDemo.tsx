'use client';

import React, { useState, useCallback, useMemo } from 'react';
import TurnBasedBattleMap, { 
  type BattleState, 
  type BattleUnit, 
  type BattleLogEntry,
  type Position,
  calculateMoveRange,
  calculateAttackRange,
  isInRange,
} from './TurnBasedBattleMap';
import BattleUnitCard, { UnitListPanel } from './BattleUnitCard';
import BattleControls, { BattleResultModal } from './BattleControls';
import styles from './TurnBasedBattleDemo.module.css';

// ===== 초기 유닛 데이터 생성 =====
function createInitialUnits(): BattleUnit[] {
  const allyUnits: BattleUnit[] = [
    {
      id: 'ally-1',
      generalId: 1,
      generalName: '관우',
      position: { x: 5, y: 10 },
      crew: 5000,
      maxCrew: 5000,
      crewType: 1300, // 기병
      hp: 100,
      maxHp: 100,
      morale: 90,
      maxMorale: 100,
      attack: 95,
      defense: 85,
      moveRange: 4,
      attackRange: 1,
      isEnemy: false,
    },
    {
      id: 'ally-2',
      generalId: 2,
      generalName: '장비',
      position: { x: 6, y: 12 },
      crew: 4500,
      maxCrew: 5000,
      crewType: 1100, // 보병
      hp: 100,
      maxHp: 100,
      morale: 85,
      maxMorale: 100,
      attack: 90,
      defense: 80,
      moveRange: 3,
      attackRange: 1,
      isEnemy: false,
    },
    {
      id: 'ally-3',
      generalId: 3,
      generalName: '조운',
      position: { x: 4, y: 11 },
      crew: 4000,
      maxCrew: 4000,
      crewType: 1301, // 호표기
      hp: 100,
      maxHp: 100,
      morale: 95,
      maxMorale: 100,
      attack: 92,
      defense: 88,
      moveRange: 5,
      attackRange: 1,
      isEnemy: false,
    },
    {
      id: 'ally-4',
      generalId: 4,
      generalName: '제갈량',
      position: { x: 7, y: 13 },
      crew: 3000,
      maxCrew: 3000,
      crewType: 1400, // 책사
      hp: 80,
      maxHp: 80,
      morale: 100,
      maxMorale: 100,
      attack: 70,
      defense: 60,
      moveRange: 3,
      attackRange: 3,
      isEnemy: false,
    },
    {
      id: 'ally-5',
      generalId: 5,
      generalName: '황충',
      position: { x: 3, y: 10 },
      crew: 3500,
      maxCrew: 4000,
      crewType: 1200, // 궁병
      hp: 90,
      maxHp: 100,
      morale: 80,
      maxMorale: 100,
      attack: 85,
      defense: 65,
      moveRange: 3,
      attackRange: 4,
      isEnemy: false,
    },
  ];

  const enemyUnits: BattleUnit[] = [
    {
      id: 'enemy-1',
      generalId: 101,
      generalName: '조조',
      position: { x: 35, y: 10 },
      crew: 6000,
      maxCrew: 6000,
      crewType: 1302, // 오환돌기
      hp: 100,
      maxHp: 100,
      morale: 95,
      maxMorale: 100,
      attack: 90,
      defense: 90,
      moveRange: 4,
      attackRange: 1,
      isEnemy: true,
    },
    {
      id: 'enemy-2',
      generalId: 102,
      generalName: '하후돈',
      position: { x: 34, y: 12 },
      crew: 5000,
      maxCrew: 5000,
      crewType: 1100, // 보병
      hp: 100,
      maxHp: 100,
      morale: 90,
      maxMorale: 100,
      attack: 88,
      defense: 82,
      moveRange: 3,
      attackRange: 1,
      isEnemy: true,
    },
    {
      id: 'enemy-3',
      generalId: 103,
      generalName: '허저',
      position: { x: 36, y: 11 },
      crew: 4500,
      maxCrew: 5000,
      crewType: 1112, // 등갑병
      hp: 100,
      maxHp: 100,
      morale: 85,
      maxMorale: 100,
      attack: 95,
      defense: 75,
      moveRange: 3,
      attackRange: 1,
      isEnemy: true,
    },
    {
      id: 'enemy-4',
      generalId: 104,
      generalName: '순욱',
      position: { x: 33, y: 13 },
      crew: 2500,
      maxCrew: 3000,
      crewType: 1400, // 책사
      hp: 70,
      maxHp: 80,
      morale: 90,
      maxMorale: 100,
      attack: 65,
      defense: 55,
      moveRange: 3,
      attackRange: 3,
      isEnemy: true,
    },
    {
      id: 'enemy-5',
      generalId: 105,
      generalName: '전위',
      position: { x: 37, y: 10 },
      crew: 4000,
      maxCrew: 4000,
      crewType: 1201, // 노병
      hp: 95,
      maxHp: 100,
      morale: 88,
      maxMorale: 100,
      attack: 80,
      defense: 70,
      moveRange: 3,
      attackRange: 3,
      isEnemy: true,
    },
  ];

  return [...allyUnits, ...enemyUnits];
}

// ===== 데미지 계산 =====
function calculateDamage(attacker: BattleUnit, defender: BattleUnit): {
  damage: number;
  isCritical: boolean;
  isEvaded: boolean;
} {
  // 기본 데미지 = 공격력 - 방어력/2 + 랜덤
  const baseDamage = Math.max(10, attacker.attack - Math.floor(defender.defense / 2));
  const randomFactor = 0.8 + Math.random() * 0.4; // 0.8 ~ 1.2
  
  // 크리티컬 확률 (10%)
  const isCritical = Math.random() < 0.1;
  const critMultiplier = isCritical ? 1.5 : 1;
  
  // 회피 확률 (5%)
  const isEvaded = Math.random() < 0.05;
  
  if (isEvaded) {
    return { damage: 0, isCritical: false, isEvaded: true };
  }
  
  const finalDamage = Math.floor(baseDamage * randomFactor * critMultiplier);
  return { damage: finalDamage, isCritical, isEvaded: false };
}

// ===== 메인 데모 컴포넌트 =====
export default function TurnBasedBattleDemo() {
  // 전투 상태
  const [battleState, setBattleState] = useState<BattleState>(() => ({
    id: 'demo-battle',
    turn: 1,
    phase: 'player',
    activeUnitId: null,
    units: createInitialUnits(),
    logs: [
      { id: 'log-0', type: 'phase', text: '전투 시작! 1턴', timestamp: Date.now() },
    ],
    winner: null,
  }));

  // UI 상태
  const [selectedUnit, setSelectedUnit] = useState<BattleUnit | null>(null);
  const [mode, setMode] = useState<'select' | 'move' | 'attack'>('select');
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [showResult, setShowResult] = useState(false);

  // 로그 추가 헬퍼
  const addLog = useCallback((type: BattleLogEntry['type'], text: string) => {
    const newLog: BattleLogEntry = {
      id: `log-${Date.now()}-${Math.random()}`,
      type,
      text,
      timestamp: Date.now(),
    };
    setBattleState(prev => ({
      ...prev,
      logs: [...prev.logs, newLog],
    }));
  }, []);

  // 유닛 선택 핸들러
  const handleUnitSelect = useCallback((unit: BattleUnit | null) => {
    setSelectedUnit(unit);
    setMode('select');
  }, []);

  // 셀 클릭 핸들러
  const handleCellClick = useCallback((position: Position) => {
    // 이동 모드에서 빈 셀 클릭
    if (mode === 'move' && selectedUnit && !selectedUnit.hasMoved) {
      const moveRange = calculateMoveRange(selectedUnit, battleState.units);
      if (isInRange(moveRange, position.x, position.y)) {
        handleMove(selectedUnit.id, position);
      }
    }
  }, [mode, selectedUnit, battleState.units]);

  // 이동 처리
  const handleMove = useCallback((unitId: string, to: Position) => {
    setBattleState(prev => {
      const unit = prev.units.find(u => u.id === unitId);
      if (!unit) return prev;

      const updatedUnits = prev.units.map(u =>
        u.id === unitId
          ? { ...u, position: to, hasMoved: true }
          : u
      );

      return {
        ...prev,
        units: updatedUnits,
      };
    });

    addLog('move', `${selectedUnit?.generalName}이(가) (${to.x}, ${to.y})로 이동했습니다.`);
    setMode('select');
  }, [selectedUnit, addLog]);

  // 공격 처리
  const handleAttack = useCallback((attackerId: string, defenderId: string) => {
    const attacker = battleState.units.find(u => u.id === attackerId);
    const defender = battleState.units.find(u => u.id === defenderId);
    if (!attacker || !defender) return;

    const { damage, isCritical, isEvaded } = calculateDamage(attacker, defender);

    setBattleState(prev => {
      const updatedUnits = prev.units.map(u => {
        if (u.id === attackerId) {
          return { ...u, hasActed: true };
        }
        if (u.id === defenderId) {
          const newHp = Math.max(0, u.hp - damage);
          const newCrew = Math.max(0, u.crew - Math.floor(damage * 50));
          return { ...u, hp: newHp, crew: newCrew };
        }
        return u;
      });

      return {
        ...prev,
        units: updatedUnits,
      };
    });

    // 로그 추가
    if (isEvaded) {
      addLog('evade', `${defender.generalName}이(가) ${attacker.generalName}의 공격을 회피했습니다!`);
    } else if (isCritical) {
      addLog('critical', `<Y>크리티컬!</> ${attacker.generalName}이(가) ${defender.generalName}에게 <R>${damage}</> 데미지! (x1.5)`);
    } else {
      addLog('attack', `${attacker.generalName}이(가) ${defender.generalName}에게 <R>${damage}</> 데미지!`);
    }

    // 처치 확인
    const newDefenderHp = defender.hp - damage;
    if (newDefenderHp <= 0) {
      addLog('death', `💀 ${defender.generalName}이(가) 전사했습니다!`);
      checkWinner();
    }

    setMode('select');
    setSelectedUnit(null);
  }, [battleState.units, addLog]);

  // 승패 확인
  const checkWinner = useCallback(() => {
    setBattleState(prev => {
      const allyAlive = prev.units.filter(u => !u.isEnemy && u.hp > 0).length;
      const enemyAlive = prev.units.filter(u => u.isEnemy && u.hp > 0).length;

      if (allyAlive === 0) {
        return { ...prev, winner: 'enemy' };
      }
      if (enemyAlive === 0) {
        return { ...prev, winner: 'player' };
      }
      return prev;
    });
  }, []);

  // 턴 종료
  const handleEndTurn = useCallback(() => {
    setBattleState(prev => {
      // 모든 유닛의 행동 상태 초기화
      const resetUnits = prev.units.map(u => ({
        ...u,
        hasMoved: false,
        hasActed: false,
      }));

      const nextTurn = prev.phase === 'enemy' ? prev.turn + 1 : prev.turn;
      const nextPhase = prev.phase === 'player' ? 'enemy' : 'player';

      return {
        ...prev,
        turn: nextTurn,
        phase: nextPhase as 'player' | 'enemy',
        units: resetUnits,
      };
    });

    addLog('phase', `${battleState.phase === 'player' ? '적군' : `${battleState.turn + 1}턴 - 아군`} 페이즈 시작!`);
    setSelectedUnit(null);
    setMode('select');

    // 적군 턴 자동 진행 (간단한 AI)
    if (battleState.phase === 'player') {
      setTimeout(() => {
        // 적군 턴 자동 종료 (단순화)
        setBattleState(prev => ({
          ...prev,
          phase: 'player',
          turn: prev.turn + 1,
          units: prev.units.map(u => ({ ...u, hasMoved: false, hasActed: false })),
        }));
        addLog('phase', `${battleState.turn + 1}턴 - 아군 페이즈 시작!`);
      }, 1000 / speed);
    }
  }, [battleState, speed, addLog]);

  // 이동 모드 토글
  const handleMoveMode = useCallback(() => {
    if (mode === 'move') {
      setMode('select');
    } else {
      setMode('move');
    }
  }, [mode]);

  // 공격 모드 토글
  const handleAttackMode = useCallback(() => {
    if (mode === 'attack') {
      setMode('select');
    } else {
      setMode('attack');
    }
  }, [mode]);

  // 대기
  const handleWait = useCallback(() => {
    if (selectedUnit) {
      setBattleState(prev => ({
        ...prev,
        units: prev.units.map(u =>
          u.id === selectedUnit.id
            ? { ...u, hasMoved: true, hasActed: true }
            : u
        ),
      }));
      addLog('info', `${selectedUnit.generalName}이(가) 대기합니다.`);
      setSelectedUnit(null);
      setMode('select');
    }
  }, [selectedUnit, addLog]);

  // 자동 전투 토글
  const handleAutoPlay = useCallback(() => {
    setIsAutoPlaying(!isAutoPlaying);
  }, [isAutoPlaying]);

  // 통계 계산
  const stats = useMemo(() => {
    const allyUnits = battleState.units.filter(u => !u.isEnemy);
    const enemyUnits = battleState.units.filter(u => u.isEnemy);
    return {
      ally: {
        total: allyUnits.length,
        alive: allyUnits.filter(u => u.hp > 0).length,
        killed: enemyUnits.filter(u => u.hp <= 0).length,
      },
      enemy: {
        total: enemyUnits.length,
        alive: enemyUnits.filter(u => u.hp > 0).length,
        killed: allyUnits.filter(u => u.hp <= 0).length,
      },
    };
  }, [battleState.units]);

  return (
    <div className={styles.demoContainer}>
      {/* 좌측 패널: 아군 유닛 목록 */}
      <div className={styles.leftPanel}>
        <UnitListPanel
          units={battleState.units.filter(u => !u.isEnemy)}
          title="아군 부대"
          onUnitClick={handleUnitSelect}
          selectedUnitId={selectedUnit?.id}
        />
      </div>

      {/* 중앙: 전투 맵 */}
      <div className={styles.centerPanel}>
        <TurnBasedBattleMap
          battleState={battleState}
          onUnitSelect={handleUnitSelect}
          onCellClick={handleCellClick}
          onMove={handleMove}
          onAttack={handleAttack}
          onEndTurn={handleEndTurn}
        />
      </div>

      {/* 우측 패널: 유닛 정보 + 컨트롤 */}
      <div className={styles.rightPanel}>
        <BattleUnitCard unit={selectedUnit} showDetail />
        
        <BattleControls
          battleState={battleState}
          selectedUnit={selectedUnit}
          onMove={handleMoveMode}
          onAttack={handleAttackMode}
          onWait={handleWait}
          onEndTurn={handleEndTurn}
          onAutoPlay={handleAutoPlay}
          onSpeedChange={setSpeed}
          isAutoPlaying={isAutoPlaying}
          speed={speed}
        />

        <UnitListPanel
          units={battleState.units.filter(u => u.isEnemy)}
          title="적군 부대"
          onUnitClick={(unit) => {
            if (mode === 'attack' && selectedUnit) {
              const attackRange = calculateAttackRange(selectedUnit, battleState.units);
              if (isInRange(attackRange, unit.position.x, unit.position.y)) {
                handleAttack(selectedUnit.id, unit.id);
              }
            }
          }}
        />
      </div>

      {/* 승패 결과 모달 */}
      {battleState.winner && showResult && (
        <BattleResultModal
          winner={battleState.winner}
          allyStats={stats.ally}
          enemyStats={stats.enemy}
          onClose={() => setShowResult(false)}
          onReplay={() => {
            setBattleState({
              id: 'demo-battle',
              turn: 1,
              phase: 'player',
              activeUnitId: null,
              units: createInitialUnits(),
              logs: [{ id: 'log-0', type: 'phase', text: '전투 시작! 1턴', timestamp: Date.now() }],
              winner: null,
            });
            setShowResult(false);
            setSelectedUnit(null);
          }}
        />
      )}

      {/* 승패 알림 */}
      {battleState.winner && !showResult && (
        <div 
          className={`${styles.winnerBanner} ${styles[battleState.winner]}`}
          onClick={() => setShowResult(true)}
        >
          <span className={styles.winnerEmoji}>
            {battleState.winner === 'player' ? '🏆' : '💔'}
          </span>
          <span className={styles.winnerMessage}>
            {battleState.winner === 'player' ? '승리!' : '패배...'}
          </span>
          <span className={styles.winnerHint}>클릭하여 결과 보기</span>
        </div>
      )}
    </div>
  );
}




