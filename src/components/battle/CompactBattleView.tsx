// @ts-nocheck
'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import styles from './CompactBattleView.module.css';

// 동적 임포트 타입
type PhaserVoxelEngineType = typeof import('@/lib/battle/PhaserVoxelEngine').PhaserVoxelEngine;

interface Stats {
  alive: number;
  total: number;
  kills: number;
}

interface Props {
  /** 전투 ID */
  battleId?: string;
  /** 공격측 이름 */
  attackerName?: string;
  /** 수비측 이름 */
  defenderName?: string;
  /** 전투 종료 콜백 */
  onBattleEnd?: (winner: 'attacker' | 'defender') => void;
  /** 전투 닫기 콜백 */
  onClose?: () => void;
}

const TROOPS_PER_SOLDIER = 25;

/**
 * 컴팩트 전투 뷰
 * 전략맵 영역(600px)에 맞춘 토탈워 스타일 전투 UI
 */
export default function CompactBattleView({
  battleId,
  attackerName = '공격군',
  defenderName = '수비군',
  onBattleEnd,
  onClose,
}: Props) {
  const threeContainerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<InstanceType<PhaserVoxelEngineType> | null>(null);
  
  const [isLoaded, setIsLoaded] = useState(false);
  const [battleState, setBattleState] = useState<'preparing' | 'running' | 'paused' | 'ended'>('preparing');
  const [battleSpeed, setBattleSpeed] = useState(1);
  const [battleTime, setBattleTime] = useState(0);
  const [attackerStats, setAttackerStats] = useState<Stats>({ alive: 0, total: 0, kills: 0 });
  const [defenderStats, setDefenderStats] = useState<Stats>({ alive: 0, total: 0, kills: 0 });
  const [winner, setWinner] = useState<'attacker' | 'defender' | null>(null);
  
  // 전투 시간 타이머
  useEffect(() => {
    if (battleState !== 'running') return;
    const timer = setInterval(() => {
      setBattleTime(t => t + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [battleState]);
  
  // 엔진 초기화
  useEffect(() => {
    let mounted = true;
    
    const init = async () => {
      if (!threeContainerRef.current) return;
      
      while (threeContainerRef.current.firstChild) {
        threeContainerRef.current.removeChild(threeContainerRef.current.firstChild);
      }
      
      const { PhaserVoxelEngine } = await import('@/lib/battle/PhaserVoxelEngine');
      
      if (!mounted) return;
      
      const engine = new PhaserVoxelEngine();
      await engine.initialize(threeContainerRef.current);
      
      if (!mounted) {
        engine.dispose();
        return;
      }
      
      engineRef.current = engine;
      createDemoSquads(engine);
      engine.initializeRenderer();
      
      engine.setOnStatsUpdate((attacker, defender) => {
        if (mounted) {
          setAttackerStats({ ...attacker });
          setDefenderStats({ ...defender });
        }
      });
      
      engine.setOnBattleEnd((w) => {
        if (mounted) {
          setWinner(w);
          setBattleState('ended');
          onBattleEnd?.(w);
        }
      });
      
      const logicScene = engine.logicScene;
      if (logicScene) {
        let attackerTotal = 0, defenderTotal = 0;
        logicScene.getSquads().forEach(squad => {
          if (squad.teamId === 'attacker') attackerTotal += squad.soldiers.length;
          else defenderTotal += squad.soldiers.length;
        });
        setAttackerStats({ alive: attackerTotal, total: attackerTotal, kills: 0 });
        setDefenderStats({ alive: defenderTotal, total: defenderTotal, kills: 0 });
      }
      
      setIsLoaded(true);
    };
    
    init();
    
    return () => {
      mounted = false;
      engineRef.current?.dispose();
    };
  }, [onBattleEnd]);
  
  // 데모용 부대 생성
  const createDemoSquads = useCallback((engine: InstanceType<PhaserVoxelEngineType>) => {
    const attackerFront = Math.PI / 2;
    const defenderFront = -Math.PI / 2;
    
    // 공격군
    engine.createSquad({ name: '선봉대', teamId: 'attacker', category: 'sword_infantry', soldierCount: 40, x: -15, z: -25, facing: attackerFront });
    engine.createSquad({ name: '중앙군', teamId: 'attacker', category: 'halberd_infantry', soldierCount: 40, x: 0, z: -25, facing: attackerFront });
    engine.createSquad({ name: '후위대', teamId: 'attacker', category: 'spear_guard', soldierCount: 40, x: 15, z: -25, facing: attackerFront });
    engine.createSquad({ name: '궁병대', teamId: 'attacker', category: 'archer', soldierCount: 20, x: 0, z: -40, facing: attackerFront });
    engine.createSquad({ name: '기병대', teamId: 'attacker', category: 'cavalry', soldierCount: 20, x: -35, z: -20, facing: attackerFront + 0.3 });
    engine.createSquad({ name: '돌격대', teamId: 'attacker', category: 'shock_cavalry', soldierCount: 20, x: 35, z: -20, facing: attackerFront - 0.3 });
    
    // 수비군
    engine.createSquad({ name: '수비 선봉', teamId: 'defender', category: 'sword_infantry', soldierCount: 40, x: -15, z: 25, facing: defenderFront });
    engine.createSquad({ name: '수비 중앙', teamId: 'defender', category: 'halberd_infantry', soldierCount: 40, x: 0, z: 25, facing: defenderFront });
    engine.createSquad({ name: '수비 후위', teamId: 'defender', category: 'spear_guard', soldierCount: 40, x: 15, z: 25, facing: defenderFront });
    engine.createSquad({ name: '수비 궁병', teamId: 'defender', category: 'archer', soldierCount: 20, x: 0, z: 40, facing: defenderFront });
    engine.createSquad({ name: '수비 기병', teamId: 'defender', category: 'cavalry', soldierCount: 20, x: -35, z: 20, facing: defenderFront - 0.3 });
    engine.createSquad({ name: '돌격 기병', teamId: 'defender', category: 'shock_cavalry', soldierCount: 20, x: 35, z: 20, facing: defenderFront + 0.3 });
  }, []);
  
  const handleStartBattle = useCallback(() => {
    engineRef.current?.startBattle();
    setBattleState('running');
  }, []);
  
  const handlePauseBattle = useCallback(() => {
    engineRef.current?.pauseBattle();
    setBattleState(prev => prev === 'running' ? 'paused' : 'running');
  }, []);
  
  const handleSpeedChange = useCallback((speed: number) => {
    setBattleSpeed(speed);
    engineRef.current?.setSpeed(speed);
  }, []);
  
  // 체력 퍼센트 계산
  const attackerHealthPercent = attackerStats.total > 0 
    ? (attackerStats.alive / attackerStats.total) * 100 : 100;
  const defenderHealthPercent = defenderStats.total > 0 
    ? (defenderStats.alive / defenderStats.total) * 100 : 100;
  
  // 시간 포맷
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };
  
  return (
    <div className={styles.container}>
      {/* 로딩 */}
      {!isLoaded && (
        <div className={styles.loading}>
          <div className={styles.loadingSpinner} />
          <span>전투 로딩 중...</span>
        </div>
      )}
      
      {/* 상단 HUD */}
      <div className={styles.topHud}>
        {/* 닫기 버튼 */}
        {onClose && (
          <button className={styles.closeBtn} onClick={onClose} title="전략맵으로">
            ✕
          </button>
        )}
        
        {/* 공격군 정보 */}
        <div className={styles.teamInfo}>
          <div className={styles.teamName} data-team="attacker">⚔️ {attackerName}</div>
          <div className={styles.troopCount}>
            {(attackerStats.alive * TROOPS_PER_SOLDIER).toLocaleString()}
            <span className={styles.troopMax}>/ {(attackerStats.total * TROOPS_PER_SOLDIER).toLocaleString()}</span>
          </div>
        </div>
        
        {/* 중앙 체력바 */}
        <div className={styles.centerPanel}>
          <div className={styles.healthBar}>
            <div 
              className={styles.attackerHealth} 
              style={{ width: `${attackerHealthPercent / 2}%` }} 
            />
            <div className={styles.centerMark}>⚔</div>
            <div 
              className={styles.defenderHealth} 
              style={{ width: `${defenderHealthPercent / 2}%` }} 
            />
          </div>
          <div className={styles.battleTime}>{formatTime(battleTime)}</div>
        </div>
        
        {/* 수비군 정보 */}
        <div className={`${styles.teamInfo} ${styles.teamRight}`}>
          <div className={styles.teamName} data-team="defender">🛡️ {defenderName}</div>
          <div className={styles.troopCount}>
            {(defenderStats.alive * TROOPS_PER_SOLDIER).toLocaleString()}
            <span className={styles.troopMax}>/ {(defenderStats.total * TROOPS_PER_SOLDIER).toLocaleString()}</span>
          </div>
        </div>
      </div>
      
      {/* 3D 캔버스 */}
      <div ref={threeContainerRef} className={styles.canvas} />
      
      {/* 하단 컨트롤 */}
      <div className={styles.bottomHud}>
        {/* 전투 컨트롤 */}
        <div className={styles.battleControl}>
          {battleState === 'preparing' && (
            <button className={styles.startBtn} onClick={handleStartBattle}>
              ⚔️ 전투 개시
            </button>
          )}
          {(battleState === 'running' || battleState === 'paused') && (
            <button className={styles.pauseBtn} onClick={handlePauseBattle}>
              {battleState === 'running' ? '⏸' : '▶'}
            </button>
          )}
          {battleState === 'ended' && (
            <div className={styles.resultBadge} data-winner={winner}>
              🏆 {winner === 'attacker' ? attackerName : defenderName} 승리
            </div>
          )}
        </div>
        
        {/* 속도 조절 */}
        <div className={styles.speedControl}>
          {[0.5, 1, 2, 4].map(speed => (
            <button
              key={speed}
              className={`${styles.speedBtn} ${battleSpeed === speed ? styles.active : ''}`}
              onClick={() => handleSpeedChange(speed)}
            >
              {speed}×
            </button>
          ))}
        </div>
        
        {/* 조작 힌트 */}
        <div className={styles.hint}>
          드래그: 회전 | 우클릭: 이동 | 휠: 줌
        </div>
      </div>
      
      {/* 승리 오버레이 */}
      {battleState === 'ended' && (
        <div className={styles.victoryOverlay}>
          <div className={styles.victoryContent}>
            <div className={styles.victoryTitle}>전투 종료</div>
            <div className={styles.victoryWinner} data-winner={winner}>
              {winner === 'attacker' ? attackerName : defenderName}
            </div>
            <div className={styles.victorySubtitle}>승리!</div>
            <div className={styles.victoryStats}>
              <div className={styles.victoryStat}>
                <span className={styles.statLabel}>전투 시간</span>
                <span className={styles.statValue}>{formatTime(battleTime)}</span>
              </div>
              <div className={styles.victoryStat}>
                <span className={styles.statLabel}>공격군 피해</span>
                <span className={styles.statValue}>
                  {((attackerStats.total - attackerStats.alive) * TROOPS_PER_SOLDIER).toLocaleString()}
                </span>
              </div>
              <div className={styles.victoryStat}>
                <span className={styles.statLabel}>수비군 피해</span>
                <span className={styles.statValue}>
                  {((defenderStats.total - defenderStats.alive) * TROOPS_PER_SOLDIER).toLocaleString()}
                </span>
              </div>
            </div>
            {onClose && (
              <button className={styles.closeResultBtn} onClick={onClose}>
                전략맵으로 돌아가기
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}





