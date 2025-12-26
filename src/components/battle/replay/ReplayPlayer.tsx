'use client';

import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type {
  ReplayData,
  ReplayUnit,
  TurnAction,
  MoveAction,
  AttackAction,
  Position,
  PlaybackState,
  DamagePopup,
} from './types';
import styles from './ReplayPlayer.module.css';

// ========================================
// 상수
// ========================================

const CELL_SIZE = 64;
const SPEED_OPTIONS = [0.5, 1, 2, 4];
const ACTION_DURATION = 800; // ms per action at 1x speed

// ========================================
// Props
// ========================================

interface ReplayPlayerProps {
  /** 리플레이 데이터 */
  data: ReplayData;
  /** 자동 재생 시작 여부 */
  autoPlay?: boolean;
  /** 재생 완료 콜백 */
  onComplete?: () => void;
  /** 컴팩트 모드 */
  compact?: boolean;
}

// ========================================
// 메인 컴포넌트
// ========================================

export default function ReplayPlayer({
  data,
  autoPlay = false,
  onComplete,
  compact = false,
}: ReplayPlayerProps) {
  // 유닛 상태 (애니메이션을 위해 관리)
  const [units, setUnits] = useState<ReplayUnit[]>(() => 
    data.initialUnits.map(u => ({ ...u }))
  );

  // 재생 상태
  const [playback, setPlayback] = useState<PlaybackState>({
    isPlaying: autoPlay,
    currentTurnIndex: 0,
    currentActionIndex: 0,
    speed: 1,
    totalTurns: data.turns.length,
  });

  // 데미지 팝업 상태
  const [damagePopups, setDamagePopups] = useState<DamagePopup[]>([]);

  // 현재 애니메이션 중인 유닛 ID
  const [animatingUnitId, setAnimatingUnitId] = useState<string | null>(null);

  // 타이머 레퍼런스
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // 전체 액션 리스트 (플랫하게)
  const allActions = useMemo(() => {
    return data.turns.flatMap((turn, turnIdx) =>
      turn.actions.map((action, actionIdx) => ({
        ...action,
        turnIndex: turnIdx,
        actionIndex: actionIdx,
        turnNumber: turn.turnNumber,
        phase: turn.phase,
      }))
    );
  }, [data.turns]);

  // 현재 진행 인덱스 (전체 액션 기준)
  const currentGlobalIndex = useMemo(() => {
    let idx = 0;
    for (let i = 0; i < playback.currentTurnIndex; i++) {
      idx += data.turns[i]?.actions.length || 0;
    }
    return idx + playback.currentActionIndex;
  }, [playback.currentTurnIndex, playback.currentActionIndex, data.turns]);

  // 현재 턴 정보
  const currentTurn = data.turns[playback.currentTurnIndex];

  // 액션 실행
  const executeAction = useCallback((action: TurnAction) => {
    switch (action.type) {
      case 'move': {
        const moveAction = action as MoveAction;
        setAnimatingUnitId(moveAction.unitId);
        setUnits(prev =>
          prev.map(u =>
            u.id === moveAction.unitId
              ? { ...u, position: moveAction.to }
              : u
          )
        );
        setTimeout(() => setAnimatingUnitId(null), 500);
        break;
      }

      case 'attack': {
        const attackAction = action as AttackAction;
        setAnimatingUnitId(attackAction.unitId);
        
        // 데미지 팝업 추가
        const targetUnit = units.find(u => u.id === attackAction.targetId);
        if (targetUnit) {
          const popupId = `popup-${Date.now()}`;
          const newPopup: DamagePopup = {
            id: popupId,
            position: targetUnit.position,
            damage: attackAction.damage,
            isCritical: attackAction.isCritical,
            isEvaded: attackAction.isEvaded,
          };
          setDamagePopups(prev => [...prev, newPopup]);
          
          // 2초 후 팝업 제거
          setTimeout(() => {
            setDamagePopups(prev => prev.filter(p => p.id !== popupId));
          }, 2000);
        }

        // 대상 유닛 상태 업데이트
        setUnits(prev =>
          prev.map(u =>
            u.id === attackAction.targetId
              ? {
                  ...u,
                  hp: attackAction.targetHpAfter,
                  crew: attackAction.targetCrewAfter,
                }
              : u
          )
        );

        setTimeout(() => setAnimatingUnitId(null), 600);
        break;
      }

      case 'death': {
        setUnits(prev => prev.filter(u => u.id !== action.unitId));
        break;
      }

      case 'skill':
      case 'wait':
      default:
        break;
    }
  }, [units]);

  // 다음 액션으로 진행
  const nextAction = useCallback(() => {
    const currentTurnData = data.turns[playback.currentTurnIndex];
    if (!currentTurnData) {
      // 모든 턴 완료
      setPlayback(prev => ({ ...prev, isPlaying: false }));
      onComplete?.();
      return;
    }

    const currentAction = currentTurnData.actions[playback.currentActionIndex];
    if (currentAction) {
      executeAction(currentAction);
    }

    // 다음 인덱스 계산
    if (playback.currentActionIndex < currentTurnData.actions.length - 1) {
      setPlayback(prev => ({
        ...prev,
        currentActionIndex: prev.currentActionIndex + 1,
      }));
    } else if (playback.currentTurnIndex < data.turns.length - 1) {
      // 다음 턴으로
      setPlayback(prev => ({
        ...prev,
        currentTurnIndex: prev.currentTurnIndex + 1,
        currentActionIndex: 0,
      }));
    } else {
      // 재생 완료
      setPlayback(prev => ({ ...prev, isPlaying: false }));
      onComplete?.();
    }
  }, [playback, data.turns, executeAction, onComplete]);

  // 재생 타이머
  useEffect(() => {
    if (playback.isPlaying) {
      timerRef.current = setTimeout(
        nextAction,
        ACTION_DURATION / playback.speed
      );
    }
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [playback.isPlaying, playback.currentTurnIndex, playback.currentActionIndex, playback.speed, nextAction]);

  // 재생/일시정지 토글
  const togglePlay = useCallback(() => {
    setPlayback(prev => ({ ...prev, isPlaying: !prev.isPlaying }));
  }, []);

  // 처음으로
  const resetToStart = useCallback(() => {
    setPlayback(prev => ({
      ...prev,
      isPlaying: false,
      currentTurnIndex: 0,
      currentActionIndex: 0,
    }));
    setUnits(data.initialUnits.map(u => ({ ...u })));
    setDamagePopups([]);
    setAnimatingUnitId(null);
  }, [data.initialUnits]);

  // 속도 변경
  const changeSpeed = useCallback((newSpeed: number) => {
    setPlayback(prev => ({ ...prev, speed: newSpeed }));
  }, []);

  // 슬라이더로 탐색
  const seekTo = useCallback((globalIndex: number) => {
    // 인덱스 유효성 검사
    if (globalIndex < 0) globalIndex = 0;
    if (globalIndex >= allActions.length) globalIndex = allActions.length - 1;

    // 턴/액션 인덱스 계산
    let turnIndex = 0;
    let actionIndex = 0;
    let count = 0;

    for (let i = 0; i < data.turns.length; i++) {
      const turnActions = data.turns[i].actions.length;
      if (count + turnActions > globalIndex) {
        turnIndex = i;
        actionIndex = globalIndex - count;
        break;
      }
      count += turnActions;
    }

    // 상태 리셋 후 해당 인덱스까지 재실행
    const newUnits = data.initialUnits.map(u => ({ ...u }));
    
    for (let i = 0; i <= globalIndex; i++) {
      const action = allActions[i];
      if (!action) continue;

      switch (action.type) {
        case 'move': {
          const moveAction = action as MoveAction;
          const unitIdx = newUnits.findIndex(u => u.id === moveAction.unitId);
          if (unitIdx !== -1) {
            newUnits[unitIdx] = { ...newUnits[unitIdx], position: moveAction.to };
          }
          break;
        }
        case 'attack': {
          const attackAction = action as AttackAction;
          const targetIdx = newUnits.findIndex(u => u.id === attackAction.targetId);
          if (targetIdx !== -1) {
            newUnits[targetIdx] = {
              ...newUnits[targetIdx],
              hp: attackAction.targetHpAfter,
              crew: attackAction.targetCrewAfter,
            };
          }
          break;
        }
        case 'death': {
          const deathIdx = newUnits.findIndex(u => u.id === action.unitId);
          if (deathIdx !== -1) {
            newUnits.splice(deathIdx, 1);
          }
          break;
        }
      }
    }

    setUnits(newUnits);
    setPlayback(prev => ({
      ...prev,
      isPlaying: false,
      currentTurnIndex: turnIndex,
      currentActionIndex: actionIndex,
    }));
    setDamagePopups([]);
  }, [allActions, data.turns, data.initialUnits]);

  // 맵 크기
  const mapWidth = data.metadata.mapSize.width * CELL_SIZE;
  const mapHeight = data.metadata.mapSize.height * CELL_SIZE;

  return (
    <div className={`${styles.container} ${compact ? styles.compact : ''}`}>
      {/* 헤더: 전투 정보 */}
      <header className={styles.header}>
        <div className={styles.factionInfo}>
          <span className={styles.allyFaction}>{data.metadata.attackerFaction}</span>
          <span className={styles.vs}>VS</span>
          <span className={styles.enemyFaction}>{data.metadata.defenderFaction}</span>
        </div>
        <div className={styles.turnInfo}>
          <span className={styles.turnLabel}>턴</span>
          <span className={styles.turnNumber}>{currentTurn?.turnNumber || '-'}</span>
          <span className={`${styles.phaseBadge} ${styles[currentTurn?.phase || 'player']}`}>
            {currentTurn?.phase === 'player' ? '아군' : '적군'}
          </span>
        </div>
      </header>

      {/* 전장 맵 */}
      <div className={styles.mapContainer}>
        <div
          className={styles.battleMap}
          style={{
            width: mapWidth,
            height: mapHeight,
            gridTemplateColumns: `repeat(${data.metadata.mapSize.width}, ${CELL_SIZE}px)`,
            gridTemplateRows: `repeat(${data.metadata.mapSize.height}, ${CELL_SIZE}px)`,
          }}
        >
          {/* 그리드 셀 */}
          {Array.from({ length: data.metadata.mapSize.width * data.metadata.mapSize.height }).map(
            (_, idx) => (
              <div key={idx} className={styles.cell} />
            )
          )}

          {/* 유닛 렌더링 */}
          <AnimatePresence>
            {units.map(unit => (
              <motion.div
                key={unit.id}
                className={`${styles.unit} ${unit.isEnemy ? styles.enemy : styles.ally}`}
                initial={false}
                animate={{
                  x: unit.position.x * CELL_SIZE,
                  y: unit.position.y * CELL_SIZE,
                  scale: animatingUnitId === unit.id ? 1.15 : 1,
                }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{
                  type: 'spring',
                  stiffness: 300,
                  damping: 25,
                }}
              >
                <UnitSprite
                  unit={unit}
                  isAnimating={animatingUnitId === unit.id}
                />
              </motion.div>
            ))}
          </AnimatePresence>

          {/* 데미지 팝업 */}
          <AnimatePresence>
            {damagePopups.map(popup => (
              <DamagePopupComponent key={popup.id} popup={popup} />
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* 컨트롤 바 */}
      <div className={styles.controlBar}>
        {/* 재생 컨트롤 */}
        <div className={styles.playControls}>
          <button
            className={styles.controlBtn}
            onClick={resetToStart}
            title="처음으로"
          >
            ⏮
          </button>
          <button
            className={`${styles.controlBtn} ${styles.playBtn}`}
            onClick={togglePlay}
            title={playback.isPlaying ? '일시정지' : '재생'}
          >
            {playback.isPlaying ? '⏸' : '▶'}
          </button>
        </div>

        {/* 진행 슬라이더 */}
        <div className={styles.progressSection}>
          <div className={styles.sliderWrapper}>
            <input
              type="range"
              className={styles.progressSlider}
              min={0}
              max={allActions.length - 1}
              value={currentGlobalIndex}
              onChange={(e) => seekTo(parseInt(e.target.value, 10))}
            />
            {/* Turn Markers */}
            <div className={styles.turnMarkers}>
              {data.turns.map((turn, idx) => {
                let actionOffset = 0;
                for (let i = 0; i < idx; i++) actionOffset += data.turns[i].actions.length;
                const left = (actionOffset / allActions.length) * 100;
                return (
                  <div 
                    key={idx} 
                    className={styles.turnMarker} 
                    style={{ left: `${left}%` }}
                    title={`Turn ${turn.turnNumber}`}
                  />
                );
              })}
            </div>
          </div>
          <span className={styles.progressText}>
            {currentGlobalIndex + 1} / {allActions.length}
          </span>
        </div>

        {/* 속도 컨트롤 */}
        <div className={styles.speedControls}>
          <span className={styles.speedLabel}>속도</span>
          {SPEED_OPTIONS.map(speed => (
            <button
              key={speed}
              className={`${styles.speedBtn} ${playback.speed === speed ? styles.active : ''}`}
              onClick={() => changeSpeed(speed)}
            >
              {speed}x
            </button>
          ))}
        </div>
      </div>

      {/* 결과 오버레이 (재생 완료 시) */}
      {!playback.isPlaying &&
        playback.currentTurnIndex === data.turns.length - 1 &&
        playback.currentActionIndex >= (currentTurn?.actions.length || 1) - 1 && (
          <div className={styles.resultOverlay}>
            <div className={styles.resultCard}>
              <h2 className={`${styles.resultTitle} ${styles[data.result.winner]}`}>
                {data.result.winner === 'player' ? '🏆 승리!' : 
                 data.result.winner === 'enemy' ? '💔 패배...' : '🤝 무승부'}
              </h2>
              <div className={styles.resultStats}>
                <div className={styles.statItem}>
                  <span className={styles.statLabel}>아군 생존</span>
                  <span className={styles.statValue}>{data.result.allyRemaining}</span>
                </div>
                <div className={styles.statItem}>
                  <span className={styles.statLabel}>적 처치</span>
                  <span className={styles.statValue}>{data.result.allyKills}</span>
                </div>
              </div>
              <button className={styles.replayBtn} onClick={resetToStart}>
                🔄 다시 보기
              </button>
            </div>
          </div>
        )}
    </div>
  );
}

// ========================================
// 서브 컴포넌트: 유닛 스프라이트
// ========================================

interface UnitSpriteProps {
  unit: ReplayUnit;
  isAnimating: boolean;
}

function UnitSprite({ unit, isAnimating }: UnitSpriteProps) {
  const hpPercent = (unit.hp / unit.maxHp) * 100;
  const hpColor = hpPercent > 60 ? '#4caf50' : hpPercent > 30 ? '#ffc107' : '#f44336';

  // 병종 아이콘 (간단한 이모지 기반)
  const getUnitIcon = (crewType: number): string => {
    if (crewType >= 1300 && crewType < 1400) return '🐎'; // 기병
    if (crewType >= 1200 && crewType < 1300) return '🏹'; // 궁병
    if (crewType >= 1100 && crewType < 1200) return '⚔️'; // 보병
    if (crewType >= 1400 && crewType < 1500) return '📜'; // 책사
    return '👤';
  };

  return (
    <div className={`${styles.unitSprite} ${isAnimating ? styles.animating : ''}`}>
      {/* 유닛 아이콘 */}
      <div className={styles.unitIcon}>
        {getUnitIcon(unit.crewType)}
      </div>

      {/* 장수 이름 */}
      <div className={styles.unitName}>{unit.generalName}</div>

      {/* HP 바 */}
      <div className={styles.hpBar}>
        <motion.div
          className={styles.hpFill}
          style={{ backgroundColor: hpColor }}
          animate={{ width: `${hpPercent}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {/* 병력 수 */}
      <div className={styles.crewCount}>
        {formatCrew(unit.crew)}
      </div>
    </div>
  );
}

// ========================================
// 서브 컴포넌트: 데미지 팝업
// ========================================

interface DamagePopupProps {
  popup: DamagePopup;
}

function DamagePopupComponent({ popup }: DamagePopupProps) {
  return (
    <motion.div
      className={`${styles.damagePopup} ${popup.isCritical ? styles.critical : ''} ${popup.isEvaded ? styles.evaded : ''}`}
      style={{
        left: popup.position.x * CELL_SIZE + CELL_SIZE / 2,
        top: popup.position.y * CELL_SIZE,
      }}
      initial={{ y: 0, opacity: 1, scale: popup.isCritical ? 1.5 : 1 }}
      animate={{ y: -60, opacity: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1.5, ease: 'easeOut' }}
    >
      {popup.isEvaded ? (
        <span className={styles.missText}>MISS!</span>
      ) : (
        <>
          {popup.isCritical && <span className={styles.criticalLabel}>크리티컬!</span>}
          <span className={styles.damageNumber}>-{popup.damage}</span>
        </>
      )}
    </motion.div>
  );
}

// ========================================
// 유틸리티 함수
// ========================================

function formatCrew(crew: number): string {
  if (crew >= 10000) return `${(crew / 10000).toFixed(1)}만`;
  if (crew >= 1000) return `${(crew / 1000).toFixed(1)}천`;
  return String(crew);
}








