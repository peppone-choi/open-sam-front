'use client';

/**
 * 복셀 전투 뷰 컴포넌트
 * 
 * PhaserVoxelBattleMap을 래핑하고 전투 데이터를 전달합니다.
 */

import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import type { VoxelBattleInit, VoxelBattleResult } from '@/lib/battle/types/BattleTypes';
import styles from './VoxelBattleView.module.css';

// 동적 임포트 타입
type PhaserVoxelEngineType = typeof import('@/lib/battle/PhaserVoxelEngine').PhaserVoxelEngine;

// ============================================================================
// 타입 정의
// ============================================================================

interface VoxelBattleViewProps {
  battleData: VoxelBattleInit;
  onBattleEnd?: (result: VoxelBattleResult) => void;
}

interface Stats {
  alive: number;
  total: number;
  kills: number;
}

// ============================================================================
// 상수
// ============================================================================

const TROOPS_PER_SOLDIER = 25;

// ============================================================================
// 컴포넌트
// ============================================================================

export default function VoxelBattleView({ 
  battleData, 
  onBattleEnd 
}: VoxelBattleViewProps) {
  const threeContainerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<InstanceType<PhaserVoxelEngineType> | null>(null);
  
  const [isLoaded, setIsLoaded] = useState(false);
  const [battleState, setBattleState] = useState<'preparing' | 'running' | 'paused' | 'ended'>('preparing');
  const [battleSpeed, setBattleSpeed] = useState(1);
  const [attackerStats, setAttackerStats] = useState<Stats>({ alive: 0, total: 0, kills: 0 });
  const [defenderStats, setDefenderStats] = useState<Stats>({ alive: 0, total: 0, kills: 0 });
  const [winner, setWinner] = useState<'attacker' | 'defender' | null>(null);
  
  // ========================================
  // 부대 생성 헬퍼
  // ========================================
  
  const createSquadsFromBattleData = useCallback((engine: InstanceType<PhaserVoxelEngineType>) => {
    const attackerFront = Math.PI / 2;   // 북 → 남
    const defenderFront = -Math.PI / 2;  // 남 → 북
    
    // 공격측 부대 생성
    battleData.attacker.squads.forEach((squad, idx) => {
      const xOffset = (idx - (battleData.attacker.squads.length - 1) / 2) * 25;
      
      engine.createSquad({
        name: squad.name || `${battleData.attacker.factionName} 부대 ${idx + 1}`,
        teamId: 'attacker',
        category: mapCategoryToEngine(squad.category),
        soldierCount: Math.ceil(squad.unitCount),
        x: xOffset,
        z: -30,
        facing: attackerFront,
      });
    });
    
    // 방어측 부대 생성
    battleData.defender.squads.forEach((squad, idx) => {
      const xOffset = (idx - (battleData.defender.squads.length - 1) / 2) * 25;
      
      engine.createSquad({
        name: squad.name || `${battleData.defender.factionName} 부대 ${idx + 1}`,
        teamId: 'defender',
        category: mapCategoryToEngine(squad.category),
        soldierCount: Math.ceil(squad.unitCount),
        x: xOffset,
        z: 30,
        facing: defenderFront,
      });
    });
    
    console.log('✅ 전투 데이터 기반 부대 생성 완료');
  }, [battleData]);

  // ========================================
  // 엔진 초기화
  // ========================================
  
  useEffect(() => {
    let mounted = true;
    
    const init = async () => {
      if (!threeContainerRef.current) return;
      
      // 기존 캔버스 제거 (Strict Mode 대응)
      while (threeContainerRef.current.firstChild) {
        threeContainerRef.current.removeChild(threeContainerRef.current.firstChild);
      }
      
      try {
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
        
        // 전투 데이터로 부대 생성
        createSquadsFromBattleData(engine);
        
        // 복셀 렌더러 초기화
        engine.initializeRenderer();
        
        // 콜백 설정
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
            
            // 결과 콜백 호출
            if (onBattleEnd) {
              const result: VoxelBattleResult = {
                battleId: battleData.battleId,
                winner: w,
                duration: Date.now(), // 실제 시간 계산 필요
                attackerRemaining: attackerStats.alive * TROOPS_PER_SOLDIER,
                defenderRemaining: defenderStats.alive * TROOPS_PER_SOLDIER,
                attackerSquads: [],
                defenderSquads: [],
                events: [],
                stats: {
                  totalKills: {
                    attacker: attackerStats.kills,
                    defender: defenderStats.kills,
                  },
                  totalDamage: { attacker: 0, defender: 0 },
                  chargeCount: { attacker: 0, defender: 0 },
                  routCount: { attacker: 0, defender: 0 },
                },
              };
              onBattleEnd(result);
            }
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
      } catch (err) {
        console.error('복셀 엔진 초기화 실패:', err);
      }
    };
    
    init();
    
    return () => {
      mounted = false;
      engineRef.current?.dispose();
    };
  }, [battleData.battleId, createSquadsFromBattleData]);
  
  // ========================================
  // 컨트롤 핸들러
  // ========================================
  
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
  
  // ========================================
  // 렌더링
  // ========================================
  
  return (
    <div className={styles.container}>
      {/* 로딩 오버레이 */}
      {!isLoaded && (
        <div className={styles.loadingOverlay}>
          <div className={styles.loadingContent}>
            <div className={styles.spinner}></div>
            <p>🎮 전투 엔진 로딩 중...</p>
          </div>
        </div>
      )}
      
      {/* 상단 HUD */}
      <div 
        className={styles.topHud} 
        style={{ visibility: isLoaded ? 'visible' : 'hidden' }}
      >
        <div className={styles.statsPanel}>
          {/* 공격측 */}
          <div className={styles.attackerStats}>
            <span className={styles.teamName}>
              🏴 {battleData.attacker.factionName}
            </span>
            <span className={styles.soldiers}>
              {(attackerStats.alive * TROOPS_PER_SOLDIER).toLocaleString()} / {(attackerStats.total * TROOPS_PER_SOLDIER).toLocaleString()}
            </span>
            <span className={styles.kills}>
              💀 {(attackerStats.kills * TROOPS_PER_SOLDIER).toLocaleString()}
            </span>
          </div>
          
          {/* 전투 정보 */}
          <div className={styles.battleInfo}>
            <span className={styles.terrainInfo}>
              🗺️ {battleData.terrain.type}
            </span>
            <span className={styles.weatherInfo}>
              {getWeatherEmoji(battleData.weather)} {battleData.weather}
            </span>
          </div>
          
          {/* 방어측 */}
          <div className={styles.defenderStats}>
            <span className={styles.teamName}>
              🚩 {battleData.defender.factionName}
            </span>
            <span className={styles.soldiers}>
              {(defenderStats.alive * TROOPS_PER_SOLDIER).toLocaleString()} / {(defenderStats.total * TROOPS_PER_SOLDIER).toLocaleString()}
            </span>
            <span className={styles.kills}>
              💀 {(defenderStats.kills * TROOPS_PER_SOLDIER).toLocaleString()}
            </span>
          </div>
        </div>
      </div>
      
      {/* Three.js 캔버스 */}
      <div 
        ref={threeContainerRef} 
        className={styles.threeContainer}
      />
      
      {/* 전투 컨트롤 */}
      <div 
        className={styles.battleControls}
        style={{ visibility: isLoaded ? 'visible' : 'hidden' }}
      >
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
            🏆 {winner === 'attacker' 
              ? `${battleData.attacker.factionName} 승리!` 
              : `${battleData.defender.factionName} 승리!`}
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
      <div 
        className={styles.controls}
        style={{ visibility: isLoaded ? 'visible' : 'hidden' }}
      >
        <p>마우스 드래그: 회전 | 우클릭 드래그: 이동 | 휠: 줌</p>
      </div>
    </div>
  );
}

// ============================================================================
// 유틸리티 함수
// ============================================================================

/**
 * VoxelCategory를 엔진 카테고리로 매핑
 */
function mapCategoryToEngine(category: string): string {
  const mapping: Record<string, string> = {
    'footman': 'sword_infantry',
    'archer': 'archer',
    'cavalry': 'cavalry',
    'wizard': 'sword_infantry', // 귀병 → 보병으로 폴백
    'siege': 'sword_infantry',  // 공성 → 보병으로 폴백
    'castle': 'sword_infantry', // 성 → 보병으로 폴백
  };
  
  return mapping[category.toLowerCase()] || 'sword_infantry';
}

/**
 * 날씨 이모지 반환
 */
function getWeatherEmoji(weather: string): string {
  const emojis: Record<string, string> = {
    'clear': '☀️',
    'cloudy': '☁️',
    'rain': '🌧️',
    'heavy_rain': '⛈️',
    'fog': '🌫️',
    'snow': '❄️',
    'wind': '💨',
  };
  
  return emojis[weather] || '🌤️';
}
