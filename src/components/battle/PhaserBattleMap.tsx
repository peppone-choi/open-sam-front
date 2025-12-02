'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import styles from './TotalWarBattleMap.module.css';

// Phaser는 클라이언트에서만 임포트
type PhaserType = typeof import('phaser');
let Phaser: PhaserType | null = null;
let BattleScene: typeof import('@/lib/battle/PhaserBattleEngine').BattleScene | null = null;
let createBattleGame: typeof import('@/lib/battle/PhaserBattleEngine').createBattleGame | null = null;

interface Stats {
  alive: number;
  total: number;
  kills: number;
}

const TROOPS_PER_SOLDIER = 25; // 1 유닛 = 25명

export default function PhaserBattleMap() {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);
  const sceneRef = useRef<any>(null);
  
  const [isLoaded, setIsLoaded] = useState(false);
  const [battleState, setBattleState] = useState<'preparing' | 'running' | 'paused' | 'ended'>('preparing');
  const [battleSpeed, setBattleSpeed] = useState(1);
  const [attackerStats, setAttackerStats] = useState<Stats>({ alive: 0, total: 0, kills: 0 });
  const [defenderStats, setDefenderStats] = useState<Stats>({ alive: 0, total: 0, kills: 0 });
  const [winner, setWinner] = useState<'attacker' | 'defender' | null>(null);
  const [fps, setFps] = useState(0);
  
  // Phaser 로드 및 초기화
  useEffect(() => {
    const initPhaser = async () => {
      // 동적 임포트 (클라이언트 전용)
      const phaserModule = await import('phaser');
      Phaser = phaserModule;
      
      const engineModule = await import('@/lib/battle/PhaserBattleEngine');
      BattleScene = engineModule.BattleScene;
      createBattleGame = engineModule.createBattleGame;
      
      setIsLoaded(true);
    };
    
    initPhaser();
    
    return () => {
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
    };
  }, []);
  
  // 게임 생성
  useEffect(() => {
    if (!isLoaded || !containerRef.current || gameRef.current) return;
    
    if (!createBattleGame) return;
    
    // Phaser 게임 생성
    const game = createBattleGame(containerRef.current);
    gameRef.current = game;
    
    // 씬 준비 대기
    game.events.once('ready', () => {
      const scene = game.scene.getScene('BattleScene') as any;
      sceneRef.current = scene;
      
      // 콜백 설정
      scene.onStatsUpdate = (attacker: Stats, defender: Stats) => {
        setAttackerStats({ ...attacker });
        setDefenderStats({ ...defender });
      };
      
      scene.onBattleEnd = (winner: 'attacker' | 'defender') => {
        setWinner(winner);
        setBattleState('ended');
      };
      
      // 초기 부대 생성
      createInitialSquads(scene);
    });
    
    // FPS 표시
    const fpsInterval = setInterval(() => {
      if (game.loop) {
        setFps(Math.round(game.loop.actualFps));
      }
    }, 500);
    
    return () => {
      clearInterval(fpsInterval);
    };
  }, [isLoaded]);
  
  // 초기 부대 생성
  const createInitialSquads = useCallback((scene: any) => {
    // ========================================
    // 조조군 (위) - 북쪽
    // ========================================
    scene.createSquad({
      name: '장료 도검대',
      teamId: 'attacker',
      category: 'sword_infantry',
      soldierCount: 40,
      x: 300,
      y: 150,
      facing: Math.PI / 2,
    });
    
    scene.createSquad({
      name: '서황 극병대',
      teamId: 'attacker',
      category: 'halberd_infantry',
      soldierCount: 40,
      x: 500,
      y: 150,
      facing: Math.PI / 2,
    });
    
    scene.createSquad({
      name: '이전 창병대',
      teamId: 'attacker',
      category: 'ji_infantry',
      soldierCount: 40,
      x: 700,
      y: 150,
      facing: Math.PI / 2,
    });
    
    scene.createSquad({
      name: '위나라 궁병대',
      teamId: 'attacker',
      category: 'archer',
      soldierCount: 30,
      x: 400,
      y: 80,
      facing: Math.PI / 2,
    });
    
    scene.createSquad({
      name: '위나라 노병대',
      teamId: 'attacker',
      category: 'crossbow',
      soldierCount: 30,
      x: 600,
      y: 80,
      facing: Math.PI / 2,
    });
    
    scene.createSquad({
      name: '하후연 기병대',
      teamId: 'attacker',
      category: 'cavalry',
      soldierCount: 20,
      x: 150,
      y: 120,
      facing: Math.PI / 2,
    });
    
    scene.createSquad({
      name: '조창 돌격대',
      teamId: 'attacker',
      category: 'shock_cavalry',
      soldierCount: 20,
      x: 850,
      y: 120,
      facing: Math.PI / 2,
    });
    
    // ========================================
    // 손오 연합군 - 남쪽
    // ========================================
    scene.createSquad({
      name: '감녕 도검대',
      teamId: 'defender',
      category: 'sword_infantry',
      soldierCount: 40,
      x: 300,
      y: 650,
      facing: -Math.PI / 2,
    });
    
    scene.createSquad({
      name: '능통 극병대',
      teamId: 'defender',
      category: 'halberd_infantry',
      soldierCount: 40,
      x: 500,
      y: 650,
      facing: -Math.PI / 2,
    });
    
    scene.createSquad({
      name: '정보 창병대',
      teamId: 'defender',
      category: 'ji_infantry',
      soldierCount: 40,
      x: 700,
      y: 650,
      facing: -Math.PI / 2,
    });
    
    scene.createSquad({
      name: '오나라 궁병대',
      teamId: 'defender',
      category: 'archer',
      soldierCount: 30,
      x: 400,
      y: 720,
      facing: -Math.PI / 2,
    });
    
    scene.createSquad({
      name: '오나라 노병대',
      teamId: 'defender',
      category: 'crossbow',
      soldierCount: 30,
      x: 600,
      y: 720,
      facing: -Math.PI / 2,
    });
    
    scene.createSquad({
      name: '여몽 기병대',
      teamId: 'defender',
      category: 'cavalry',
      soldierCount: 20,
      x: 150,
      y: 680,
      facing: -Math.PI / 2,
    });
    
    scene.createSquad({
      name: '태사자 돌격대',
      teamId: 'defender',
      category: 'shock_cavalry',
      soldierCount: 20,
      x: 850,
      y: 680,
      facing: -Math.PI / 2,
    });
    
    console.log('✅ 초기 부대 생성 완료');
  }, []);
  
  // 전투 시작
  const handleStartBattle = useCallback(() => {
    if (sceneRef.current) {
      sceneRef.current.startBattle();
      setBattleState('running');
    }
  }, []);
  
  // 일시정지
  const handlePauseBattle = useCallback(() => {
    if (sceneRef.current) {
      sceneRef.current.pauseBattle();
      setBattleState(prev => prev === 'running' ? 'paused' : 'running');
    }
  }, []);
  
  // 속도 변경
  const handleSpeedChange = useCallback((speed: number) => {
    setBattleSpeed(speed);
    if (sceneRef.current) {
      sceneRef.current.setSpeed(speed);
    }
  }, []);
  
  if (!isLoaded) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Phaser 엔진 로딩 중...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className={styles.container}>
      {/* 상단 HUD */}
      <div className={styles.topHud}>
        <div className={styles.statsPanel}>
          <div className={styles.attackerStats}>
            <span className={styles.teamName}>🏴 조조군 (위)</span>
            <span className={styles.soldiers}>
              {(attackerStats.alive * TROOPS_PER_SOLDIER).toLocaleString()} / {(attackerStats.total * TROOPS_PER_SOLDIER).toLocaleString()}
            </span>
            <span className={styles.kills}>💀 {(attackerStats.kills * TROOPS_PER_SOLDIER).toLocaleString()}</span>
          </div>
          
          <div className={styles.battleInfo}>
            <span className={styles.fps}>{fps} FPS</span>
            <span className={styles.time}>⚔️ 2.5D 전투</span>
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
      
      {/* 게임 캔버스 */}
      <div ref={containerRef} className={styles.gameCanvas} />
      
      {/* 전투 컨트롤 */}
      <div className={styles.battleControls}>
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
      <div className={styles.controls}>
        <p>우클릭 드래그: 카메라 이동 | 마우스 휠: 줌</p>
      </div>
    </div>
  );
}

