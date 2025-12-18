// @ts-nocheck
'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import styles from './TotalWarBattleMap.module.css';

// 동적 임포트 타입
type PhaserVoxelEngineType = typeof import('@/lib/battle/PhaserVoxelEngine').PhaserVoxelEngine;

interface Stats {
  alive: number;
  total: number;
  kills: number;
}

const TROOPS_PER_SOLDIER = 25;

export default function PhaserVoxelBattleMap() {
  const threeContainerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<InstanceType<PhaserVoxelEngineType> | null>(null);
  
  const [isLoaded, setIsLoaded] = useState(false);
  const [battleState, setBattleState] = useState<'preparing' | 'running' | 'paused' | 'ended'>('preparing');
  const [battleSpeed, setBattleSpeed] = useState(1);
  const [attackerStats, setAttackerStats] = useState<Stats>({ alive: 0, total: 0, kills: 0 });
  const [defenderStats, setDefenderStats] = useState<Stats>({ alive: 0, total: 0, kills: 0 });
  const [winner, setWinner] = useState<'attacker' | 'defender' | null>(null);
  
  // 엔진 초기화
  useEffect(() => {
    let mounted = true;
    
    const init = async () => {
      if (!threeContainerRef.current) return;
      
      // 기존 캔버스 제거 (Strict Mode 대응)
      while (threeContainerRef.current.firstChild) {
        threeContainerRef.current.removeChild(threeContainerRef.current.firstChild);
      }
      
      // 동적 임포트
      const { PhaserVoxelEngine } = await import('@/lib/battle/PhaserVoxelEngine');
      
      if (!mounted) return;
      
      // 엔진 생성
      const engine = new PhaserVoxelEngine();
      await engine.initialize(threeContainerRef.current);
      
      if (!mounted) {
        engine.dispose();
        return;
      }
      
      engineRef.current = engine;
      
      // 부대 생성
      createInitialSquads(engine);
      
      // 복셀 렌더러 초기화
      engine.initializeRenderer();
      
      // 콜백 설정 (부대 생성 후)
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
        }
      });
      
      // 초기 통계 설정
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
  }, []);
  
  // 초기 부대 생성
  const createInitialSquads = useCallback((engine: InstanceType<PhaserVoxelEngineType>) => {
    const attackerFront = Math.PI / 2;   // 북 → 남 (z 증가 방향)
    const defenderFront = -Math.PI / 2;  // 남 → 북 (z 감소 방향)
    // ========================================
    // 조조군 (attacker) - 북쪽 (z < 0)
    // ========================================
    // 보병 1열
    engine.createSquad({
      name: '장료 도검대',
      teamId: 'attacker',
      category: 'sword_infantry',
      soldierCount: 50,
      x: -25,
      z: -30,
      facing: attackerFront,
    });
    
    engine.createSquad({
      name: '서황 극병대',
      teamId: 'attacker',
      category: 'halberd_infantry',
      soldierCount: 50,
      x: 0,
      z: -30,
      facing: attackerFront,
    });
    
    engine.createSquad({
      name: '이전 창병대',
      teamId: 'attacker',
      category: 'ji_infantry',
      soldierCount: 50,
      x: 25,
      z: -30,
      facing: attackerFront,
    });
    
    // 보병 2열 (예비대)
    engine.createSquad({
      name: '악진 근위대',
      teamId: 'attacker',
      category: 'spear_guard',
      soldierCount: 40,
      x: 0,
      z: -45,
      facing: attackerFront,
    });
    
    // 궁병 (후방)
    engine.createSquad({
      name: '위나라 궁병대',
      teamId: 'attacker',
      category: 'archer',
      soldierCount: 10,
      x: -20,
      z: -55,
      facing: attackerFront,
    });
    
    engine.createSquad({
      name: '위나라 노병대',
      teamId: 'attacker',
      category: 'crossbow',
      soldierCount: 10,
      x: 20,
      z: -55,
      facing: attackerFront,
    });
    
    // 보병 측면
    engine.createSquad({
      name: '우금 도검대',
      teamId: 'attacker',
      category: 'sword_infantry',
      soldierCount: 40,
      x: -50,
      z: -35,
      facing: attackerFront + Math.PI / 8,
    });
    
    engine.createSquad({
      name: '장합 도검대',
      teamId: 'attacker',
      category: 'sword_infantry',
      soldierCount: 40,
      x: 50,
      z: -35,
      facing: attackerFront - Math.PI / 8,
    });
    
    // 기병 (측면)
    engine.createSquad({
      name: '하후연 기병대',
      teamId: 'attacker',
      category: 'cavalry',
      soldierCount: 30,
      x: -65,
      z: -25,
      facing: attackerFront + Math.PI / 6,
    });
    
    engine.createSquad({
      name: '조창 돌격대',
      teamId: 'attacker',
      category: 'shock_cavalry',
      soldierCount: 30,
      x: 65,
      z: -25,
      facing: attackerFront - Math.PI / 6,
    });
    
    // 기병 예비대
    engine.createSquad({
      name: '조인 친위대',
      teamId: 'attacker',
      category: 'shock_cavalry',
      soldierCount: 20,
      x: 0,
      z: -65,
      facing: attackerFront,
    });
    
    // ========================================
    // 손오 연합군 - 남쪽 (z > 0)
    // ========================================
    // 보병 1열
    engine.createSquad({
      name: '감녕 도검대',
      teamId: 'defender',
      category: 'sword_infantry',
      soldierCount: 50,
      x: -25,
      z: 30,
      facing: defenderFront,
    });
    
    engine.createSquad({
      name: '능통 극병대',
      teamId: 'defender',
      category: 'halberd_infantry',
      soldierCount: 50,
      x: 0,
      z: 30,
      facing: defenderFront,
    });
    
    engine.createSquad({
      name: '정보 창병대',
      teamId: 'defender',
      category: 'ji_infantry',
      soldierCount: 50,
      x: 25,
      z: 30,
      facing: defenderFront,
    });
    
    // 보병 2열 (예비대)
    engine.createSquad({
      name: '주태 근위대',
      teamId: 'defender',
      category: 'spear_guard',
      soldierCount: 40,
      x: 0,
      z: 45,
      facing: defenderFront,
    });
    
    // 보병 측면
    engine.createSquad({
      name: '한당 도검대',
      teamId: 'defender',
      category: 'sword_infantry',
      soldierCount: 40,
      x: -50,
      z: 35,
      facing: defenderFront - Math.PI / 8,
    });
    
    engine.createSquad({
      name: '황개 도검대',
      teamId: 'defender',
      category: 'sword_infantry',
      soldierCount: 40,
      x: 50,
      z: 35,
      facing: defenderFront + Math.PI / 8,
    });
    
    // 궁병 (후방)
    engine.createSquad({
      name: '오나라 궁병대',
      teamId: 'defender',
      category: 'archer',
      soldierCount: 10,
      x: -20,
      z: 55,
      facing: defenderFront,
    });
    
    engine.createSquad({
      name: '오나라 노병대',
      teamId: 'defender',
      category: 'crossbow',
      soldierCount: 10,
      x: 20,
      z: 55,
      facing: defenderFront,
    });
    
    // 기병 (측면)
    engine.createSquad({
      name: '여몽 기병대',
      teamId: 'defender',
      category: 'cavalry',
      soldierCount: 30,
      x: -60,
      z: 25,
      facing: defenderFront - Math.PI / 6,
    });
    
    engine.createSquad({
      name: '태사자 돌격대',
      teamId: 'defender',
      category: 'shock_cavalry',
      soldierCount: 30,
      x: 60,
      z: 25,
      facing: defenderFront + Math.PI / 6,
    });
    
    // 기병 예비대
    engine.createSquad({
      name: '손책 친위대',
      teamId: 'defender',
      category: 'shock_cavalry',
      soldierCount: 20,
      x: 0,
      z: 65,
      facing: defenderFront,
    });
    
    console.log('✅ 초기 부대 생성 완료');
  }, []);
  
  // 전투 시작
  const handleStartBattle = useCallback(() => {
    engineRef.current?.startBattle();
    setBattleState('running');
  }, []);
  
  // 일시정지
  const handlePauseBattle = useCallback(() => {
    engineRef.current?.pauseBattle();
    setBattleState(prev => prev === 'running' ? 'paused' : 'running');
  }, []);
  
  // 속도 변경
  const handleSpeedChange = useCallback((speed: number) => {
    setBattleSpeed(speed);
    engineRef.current?.setSpeed(speed);
  }, []);
  
  return (
    <div className={styles.container}>
      {/* 로딩 오버레이 */}
      {!isLoaded && (
        <div style={{ 
          position: 'absolute', 
          zIndex: 100, 
          top: 0, 
          left: 0, 
          right: 0, 
          bottom: 0, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          backgroundColor: 'rgba(26,26,46,0.95)',
          color: '#eee',
          fontSize: '1.5rem'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div className={styles.spinner}></div>
            <p>🎮 Phaser + Three.js + 복셀 엔진 로딩 중...</p>
          </div>
        </div>
      )}
      
      {/* 상단 HUD */}
      <div className={styles.topHud} style={{ visibility: isLoaded ? 'visible' : 'hidden', zIndex: 10 }}>
        <div className={styles.statsPanel}>
          <div className={styles.attackerStats}>
            <span className={styles.teamName}>🏴 조조군 (위)</span>
            <span className={styles.soldiers}>
              {(attackerStats.alive * TROOPS_PER_SOLDIER).toLocaleString()} / {(attackerStats.total * TROOPS_PER_SOLDIER).toLocaleString()}
            </span>
            <span className={styles.kills}>💀 {(attackerStats.kills * TROOPS_PER_SOLDIER).toLocaleString()}</span>
          </div>
          
          <div className={styles.battleInfo}>
            <span className={styles.fps}>⚔️ Phaser + 복셀</span>
            <span className={styles.time}>하이브리드 엔진</span>
          </div>
          
          <div className={styles.defenderStats}>
            <span className={styles.teamName}>🚩 손오 연합</span>
            <span className={styles.soldiers}>
              {(defenderStats.alive * TROOPS_PER_SOLDIER).toLocaleString()} / {(defenderStats.total * TROOPS_PER_SOLDIER).toLocaleString()}
            </span>
            <span className={styles.kills}>💀 {(defenderStats.kills * TROOPS_PER_SOLDIER).toLocaleString()}</span>
          </div>
        </div>
      </div>
      
      {/* Three.js 캔버스 */}
      <div 
        ref={threeContainerRef} 
        style={{ 
          position: 'absolute', 
          top: 0, 
          left: 0, 
          width: '100%', 
          height: '100%',
          zIndex: 0 
        }} 
      />
      
      {/* 전투 컨트롤 */}
      <div className={styles.battleControls} style={{ zIndex: 10, visibility: isLoaded ? 'visible' : 'hidden' }}>
        {battleState === 'preparing' && (
          <button className={styles.startButton} onClick={handleStartBattle}>
            ⚔️ 전투 시작
          </button>
        )}
        {(battleState === 'running' || battleState === 'paused') && (
          <button className={styles.pauseButton} onClick={handlePauseBattle}>
            {battleState === 'running' ? '⏸️ 일시정지' : '▶️ 재개'}
          </button>
        )}
        {battleState === 'ended' && (
          <div className={styles.victoryBanner}>
            🏆 {winner === 'attacker' ? '조조군 승리!' : '손오 연합 승리!'}
          </div>
        )}
        
        <div className={styles.speedControl}>
          <span>속도:</span>
          {[0.5, 1, 2, 4].map(speed => (
            <button
              key={speed}
              onClick={() => handleSpeedChange(speed)}
              className={battleSpeed === speed ? styles.active : ''}
            >
              {speed}x
            </button>
          ))}
        </div>
      </div>
      
      {/* 조작 안내 */}
      <div className={styles.controls} style={{ visibility: isLoaded ? 'visible' : 'hidden' }}>
        <p>마우스 드래그: 회전 | 우클릭 드래그: 이동 | 휠: 줌</p>
      </div>
    </div>
  );
}

