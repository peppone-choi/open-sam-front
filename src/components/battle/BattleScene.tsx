'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import BattleCutscene from './BattleCutscene';
import TacticalMap from './TacticalMap';
import DamageNumber from './DamageNumber';
import BattleResult from './BattleResult';
import UnitInfoPanel from './UnitInfoPanel';
import { BattleLogPanel } from './BattleControls';
import type { BattleUnit, BattleState, BattleLogEntry, CombatResult, Position } from './TurnBasedBattleMap';
import styles from './BattleScene.module.css';

// ===== 타입 정의 =====
export interface BattleSceneProps {
  battleId: string;
  initialState?: BattleState;
  attackerInfo?: ArmyInfo;
  defenderInfo?: ArmyInfo;
  onBattleEnd?: (winner: 'player' | 'enemy') => void;
  onExit?: () => void;
  autoPlay?: boolean;
  showCutscene?: boolean;
}

export interface ArmyInfo {
  commanderName: string;
  commanderPortrait?: string;
  nationName: string;
  nationColor: string;
  totalUnits: number;
  totalCrew: number;
}

interface DamagePopup {
  id: string;
  position: { x: number; y: number };
  damage: number;
  isCritical: boolean;
  isHeal?: boolean;
}

type BattlePhase = 'cutscene' | 'battle' | 'result';

// ===== 메인 컴포넌트 =====
export default function BattleScene({
  battleId,
  initialState,
  attackerInfo,
  defenderInfo,
  onBattleEnd,
  onExit,
  autoPlay = false,
  showCutscene: initialShowCutscene = true,
}: BattleSceneProps) {
  // ===== 상태 =====
  const [phase, setPhase] = useState<BattlePhase>(initialShowCutscene ? 'cutscene' : 'battle');
  const [battleState, setBattleState] = useState<BattleState>(
    initialState || createInitialBattleState(battleId)
  );
  const [selectedUnit, setSelectedUnit] = useState<BattleUnit | null>(null);
  const [isAutoPlaying, setIsAutoPlaying] = useState(autoPlay);
  const [speed, setSpeed] = useState(1);
  const [damagePopups, setDamagePopups] = useState<DamagePopup[]>([]);
  const [showUnitPanel, setShowUnitPanel] = useState(true);

  // ===== 유닛 통계 =====
  const allyUnits = useMemo(
    () => battleState.units.filter(u => !u.isEnemy),
    [battleState.units]
  );
  const enemyUnits = useMemo(
    () => battleState.units.filter(u => u.isEnemy),
    [battleState.units]
  );
  const allyAlive = useMemo(
    () => allyUnits.filter(u => u.hp > 0).length,
    [allyUnits]
  );
  const enemyAlive = useMemo(
    () => enemyUnits.filter(u => u.hp > 0).length,
    [enemyUnits]
  );

  // ===== 컷신 완료 핸들러 =====
  const handleCutsceneComplete = useCallback(() => {
    setPhase('battle');
    addLog('phase', `⚔️ 전투 시작! 턴 ${battleState.turn}`);
  }, [battleState.turn]);

  // ===== 로그 추가 =====
  const addLog = useCallback((type: BattleLogEntry['type'], text: string) => {
    const newLog: BattleLogEntry = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      text,
      timestamp: Date.now(),
    };
    setBattleState(prev => ({
      ...prev,
      logs: [...prev.logs, newLog],
    }));
  }, []);

  // ===== 데미지 팝업 표시 =====
  const showDamagePopup = useCallback((
    unitId: string,
    damage: number,
    isCritical: boolean,
    isHeal = false
  ) => {
    const unit = battleState.units.find(u => u.id === unitId);
    if (!unit) return;

    const popup: DamagePopup = {
      id: `popup-${Date.now()}-${Math.random()}`,
      position: { x: unit.position.x, y: unit.position.y },
      damage,
      isCritical,
      isHeal,
    };

    setDamagePopups(prev => [...prev, popup]);

    // 1.5초 후 제거
    setTimeout(() => {
      setDamagePopups(prev => prev.filter(p => p.id !== popup.id));
    }, 1500);
  }, [battleState.units]);

  // ===== 유닛 선택 핸들러 =====
  const handleUnitSelect = useCallback((unit: BattleUnit | null) => {
    setSelectedUnit(unit);
  }, []);

  // ===== 이동 핸들러 =====
  const handleMove = useCallback((unitId: string, to: Position) => {
    const unit = battleState.units.find(u => u.id === unitId);
    if (!unit) return;

    addLog('move', `${unit.generalName}이(가) (${unit.position.x},${unit.position.y})에서 (${to.x},${to.y})로 이동`);

    setBattleState(prev => ({
      ...prev,
      units: prev.units.map(u =>
        u.id === unitId
          ? { ...u, position: to, hasMoved: true }
          : u
      ),
    }));
  }, [battleState.units, addLog]);

  // ===== 공격 핸들러 =====
  const handleAttack = useCallback((attackerId: string, defenderId: string) => {
    const attacker = battleState.units.find(u => u.id === attackerId);
    const defender = battleState.units.find(u => u.id === defenderId);
    if (!attacker || !defender) return;

    // 전투 계산
    const damage = Math.max(1, attacker.attack - Math.floor(defender.defense / 2));
    const isCritical = Math.random() < 0.15;
    const isEvaded = Math.random() < 0.1;
    const finalDamage = isEvaded ? 0 : (isCritical ? Math.floor(damage * 1.5) : damage);
    const newHp = Math.max(0, defender.hp - finalDamage);
    const defenderDied = newHp === 0;

    // 로그 추가
    if (isEvaded) {
      addLog('evade', `${defender.generalName}이(가) ${attacker.generalName}의 공격을 회피!`);
    } else if (isCritical) {
      addLog('critical', `⭐ 크리티컬! ${attacker.generalName}이(가) ${defender.generalName}에게 ${finalDamage} 피해!`);
    } else {
      addLog('attack', `${attacker.generalName}이(가) ${defender.generalName}에게 ${finalDamage} 피해`);
    }

    if (defenderDied) {
      addLog('death', `💀 ${defender.generalName}이(가) 전멸!`);
    }

    // 데미지 팝업
    showDamagePopup(defenderId, finalDamage, isCritical);

    // 상태 업데이트
    setBattleState(prev => ({
      ...prev,
      units: prev.units.map(u => {
        if (u.id === attackerId) {
          return { ...u, hasActed: true };
        }
        if (u.id === defenderId) {
          return { ...u, hp: newHp };
        }
        return u;
      }),
    }));

    // 승패 판정
    setTimeout(() => {
      checkWinCondition();
    }, 500);
  }, [battleState.units, addLog, showDamagePopup]);

  // ===== 턴 종료 =====
  const handleEndTurn = useCallback(() => {
    addLog('phase', `턴 ${battleState.turn} 종료`);
    
    // 모든 유닛 행동 리셋
    setBattleState(prev => ({
      ...prev,
      turn: prev.turn + 1,
      phase: prev.phase === 'player' ? 'enemy' : 'player',
      units: prev.units.map(u => ({
        ...u,
        hasMoved: false,
        hasActed: false,
      })),
    }));

    addLog('phase', `턴 ${battleState.turn + 1} 시작 - ${battleState.phase === 'player' ? '적군' : '아군'} 턴`);
  }, [battleState.turn, battleState.phase, addLog]);

  // ===== 승패 판정 =====
  const checkWinCondition = useCallback(() => {
    const allyAliveCount = battleState.units.filter(u => !u.isEnemy && u.hp > 0).length;
    const enemyAliveCount = battleState.units.filter(u => u.isEnemy && u.hp > 0).length;

    if (enemyAliveCount === 0) {
      setBattleState(prev => ({ ...prev, winner: 'player' }));
      setPhase('result');
      onBattleEnd?.('player');
    } else if (allyAliveCount === 0) {
      setBattleState(prev => ({ ...prev, winner: 'enemy' }));
      setPhase('result');
      onBattleEnd?.('enemy');
    }
  }, [battleState.units, onBattleEnd]);

  // ===== 자동 전투 =====
  useEffect(() => {
    if (!isAutoPlaying || phase !== 'battle' || battleState.winner) return;

    const interval = setInterval(() => {
      // 자동 전투 로직 (간단 구현)
      const activeUnits = battleState.units.filter(
        u => u.hp > 0 && 
        !u.hasActed && 
        ((battleState.phase === 'player' && !u.isEnemy) || 
         (battleState.phase === 'enemy' && u.isEnemy))
      );

      if (activeUnits.length === 0) {
        handleEndTurn();
        return;
      }

      const attacker = activeUnits[0];
      const targets = battleState.units.filter(
        u => u.hp > 0 && u.isEnemy !== attacker.isEnemy
      );

      if (targets.length > 0) {
        // 가장 가까운 적 공격
        const target = targets.reduce((closest, current) => {
          const distToCurrent = Math.abs(current.position.x - attacker.position.x) +
                               Math.abs(current.position.y - attacker.position.y);
          const distToClosest = Math.abs(closest.position.x - attacker.position.x) +
                               Math.abs(closest.position.y - attacker.position.y);
          return distToCurrent < distToClosest ? current : closest;
        });

        // 범위 내면 공격, 아니면 이동
        const distance = Math.abs(target.position.x - attacker.position.x) +
                        Math.abs(target.position.y - attacker.position.y);
        
        if (distance <= attacker.attackRange) {
          handleAttack(attacker.id, target.id);
        } else {
          // 적 방향으로 이동
          const dx = Math.sign(target.position.x - attacker.position.x);
          const dy = Math.sign(target.position.y - attacker.position.y);
          const newPos = {
            x: attacker.position.x + dx * Math.min(attacker.moveRange, Math.abs(target.position.x - attacker.position.x)),
            y: attacker.position.y + dy * Math.min(attacker.moveRange, Math.abs(target.position.y - attacker.position.y)),
          };
          handleMove(attacker.id, newPos);
        }
      }
    }, 1000 / speed);

    return () => clearInterval(interval);
  }, [isAutoPlaying, phase, battleState, speed, handleAttack, handleMove, handleEndTurn]);

  // ===== 렌더링 =====
  return (
    <div className={styles.battleScene}>
      {/* 배경 */}
      <div className={styles.backgroundLayer}>
        <div className={styles.gradientOverlay} />
        <div className={styles.particleEffect} />
      </div>

      {/* 컷신 */}
      <AnimatePresence>
        {phase === 'cutscene' && attackerInfo && defenderInfo && (
          <BattleCutscene
            attacker={attackerInfo}
            defender={defenderInfo}
            onComplete={handleCutsceneComplete}
          />
        )}
      </AnimatePresence>

      {/* 전투 화면 */}
      {phase === 'battle' && (
        <motion.div
          className={styles.battleContent}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          {/* 상단 바 */}
          <div className={styles.topBar}>
            <div className={styles.armyInfo + ' ' + styles.attacker}>
              <div className={styles.nationBadge} style={{ backgroundColor: attackerInfo?.nationColor || '#ef4444' }}>
                {attackerInfo?.nationName || '공격측'}
              </div>
              <div className={styles.unitCount}>
                <span className={styles.alive}>{allyAlive}</span>
                <span className={styles.divider}>/</span>
                <span className={styles.total}>{allyUnits.length}</span>
              </div>
            </div>

            <div className={styles.turnIndicator}>
              <div className={styles.turnNumber}>턴 {battleState.turn}</div>
              <div className={`${styles.phaseBadge} ${styles[battleState.phase]}`}>
                {battleState.phase === 'player' ? '아군 턴' : '적군 턴'}
              </div>
            </div>

            <div className={styles.armyInfo + ' ' + styles.defender}>
              <div className={styles.nationBadge} style={{ backgroundColor: defenderInfo?.nationColor || '#3b82f6' }}>
                {defenderInfo?.nationName || '방어측'}
              </div>
              <div className={styles.unitCount}>
                <span className={styles.alive}>{enemyAlive}</span>
                <span className={styles.divider}>/</span>
                <span className={styles.total}>{enemyUnits.length}</span>
              </div>
            </div>
          </div>

          {/* 메인 전투 영역 */}
          <div className={styles.mainBattleArea}>
            {/* 전술 맵 */}
            <div className={styles.mapContainer}>
              <TacticalMap
                battleState={battleState}
                onUnitSelect={handleUnitSelect}
                onMove={handleMove}
                onAttack={handleAttack}
              />

              {/* 데미지 팝업 */}
              <AnimatePresence>
                {damagePopups.map(popup => (
                  <DamageNumber
                    key={popup.id}
                    damage={popup.damage}
                    position={popup.position}
                    isCritical={popup.isCritical}
                    isHeal={popup.isHeal}
                  />
                ))}
              </AnimatePresence>
            </div>

            {/* 우측 패널 */}
            <div className={styles.sidePanel}>
              {/* 유닛 정보 패널 */}
              {showUnitPanel && (
                <UnitInfoPanel
                  unit={selectedUnit}
                  onClose={() => setShowUnitPanel(false)}
                />
              )}

              {/* 전투 로그 */}
              <BattleLogPanel logs={battleState.logs} maxHeight={200} />
            </div>
          </div>

          {/* 하단 컨트롤 */}
          <div className={styles.bottomControls}>
            <div className={styles.leftControls}>
              <button
                className={styles.controlBtn}
                onClick={() => setIsAutoPlaying(!isAutoPlaying)}
              >
                {isAutoPlaying ? '⏸️ 수동' : '▶️ 자동'}
              </button>
              <div className={styles.speedControl}>
                {[0.5, 1, 2, 4].map(s => (
                  <button
                    key={s}
                    className={`${styles.speedBtn} ${speed === s ? styles.active : ''}`}
                    onClick={() => setSpeed(s)}
                  >
                    {s}x
                  </button>
                ))}
              </div>
            </div>

            <button
              className={styles.endTurnBtn}
              onClick={handleEndTurn}
              disabled={battleState.phase !== 'player' || isAutoPlaying}
            >
              ⏭️ 턴 종료
            </button>

            <div className={styles.rightControls}>
              <button
                className={styles.controlBtn}
                onClick={() => setShowUnitPanel(!showUnitPanel)}
              >
                {showUnitPanel ? '📋' : '📋'}
              </button>
              {onExit && (
                <button className={styles.exitBtn} onClick={onExit}>
                  ✕ 나가기
                </button>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* 전투 결과 */}
      <AnimatePresence>
        {phase === 'result' && (
          <BattleResult
            winner={battleState.winner || 'player'}
            attackerInfo={attackerInfo}
            defenderInfo={defenderInfo}
            allyStats={{
              total: allyUnits.length,
              alive: allyAlive,
              killed: enemyUnits.length - enemyAlive,
            }}
            enemyStats={{
              total: enemyUnits.length,
              alive: enemyAlive,
              killed: allyUnits.length - allyAlive,
            }}
            battleLogs={battleState.logs}
            onClose={onExit}
            onReplay={() => {
              setBattleState(createInitialBattleState(battleId));
              setPhase('cutscene');
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ===== 초기 상태 생성 =====
function createInitialBattleState(battleId: string): BattleState {
  // 테스트용 더미 데이터
  const allyUnits: BattleUnit[] = [
    createUnit('ally-1', '관우', false, { x: 2, y: 5 }, 1100),
    createUnit('ally-2', '장비', false, { x: 3, y: 6 }, 1101),
    createUnit('ally-3', '조운', false, { x: 2, y: 7 }, 1300),
  ];

  const enemyUnits: BattleUnit[] = [
    createUnit('enemy-1', '여포', true, { x: 8, y: 5 }, 1300),
    createUnit('enemy-2', '장료', true, { x: 7, y: 6 }, 1100),
    createUnit('enemy-3', '화웅', true, { x: 8, y: 7 }, 1101),
  ];

  return {
    id: battleId,
    turn: 1,
    phase: 'player',
    activeUnitId: null,
    units: [...allyUnits, ...enemyUnits],
    logs: [],
    winner: null,
  };
}

function createUnit(
  id: string,
  name: string,
  isEnemy: boolean,
  position: Position,
  crewType: number
): BattleUnit {
  return {
    id,
    generalId: parseInt(id.split('-')[1]),
    generalName: name,
    position,
    crew: 5000,
    maxCrew: 5000,
    crewType,
    hp: 100,
    maxHp: 100,
    morale: 100,
    maxMorale: 100,
    attack: 50 + Math.floor(Math.random() * 30),
    defense: 30 + Math.floor(Math.random() * 20),
    moveRange: 3,
    attackRange: 1,
    isEnemy,
    hasMoved: false,
    hasActed: false,
  };
}


