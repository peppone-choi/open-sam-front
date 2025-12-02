'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useSocket } from '@/hooks/useSocket';
import { Skeleton } from '@/components/ui/skeleton';
import styles from './VoxelTacticalMapPanel.module.css';

// 동적 임포트 (SSR 방지)
const PhaserVoxelEngine = dynamic(
  () => import('@/lib/battle/PhaserVoxelEngine').then(mod => mod.PhaserVoxelEngine as any),
  { ssr: false }
);

type PhaserVoxelEngineType = typeof import('@/lib/battle/PhaserVoxelEngine').PhaserVoxelEngine;

// ===== 타입 정의 =====
interface Stats {
  alive: number;
  total: number;
  kills: number;
}

interface BattleUnit {
  generalId: number;
  generalName: string;
  troops: number;
  maxTroops: number;
  position?: { x: number; y: number };
  velocity?: { x: number; y: number };
  facing?: number;
  unitType?: string;
  morale?: number;
  hp: number;
  maxHp: number;
  side: 'attacker' | 'defender';
}

interface BattleState {
  battleId: string;
  status: 'deploying' | 'in_progress' | 'completed';
  attackerUnits: BattleUnit[];
  defenderUnits: BattleUnit[];
  currentTurn: number;
  terrain: string;
  map?: { width: number; height: number };
}

interface LogEntry {
  id: number;
  text: string;
  type: 'action' | 'damage' | 'status' | 'result' | 'general' | 'history';
  timestamp: Date;
}

interface GarrisonUnit {
  generalId: number;
  generalName: string;
  troops: number;
  unitType: string;
  nationId: number;
}

interface Props {
  serverID: string;
  generalId?: number;
  cityId?: number;
  cityName?: string;
  garrisonUnits?: GarrisonUnit[];
}

const TROOPS_PER_SOLDIER = 25;

// 병종 → PhaserVoxelEngine 카테고리 매핑
const UNIT_TYPE_MAP: Record<string, string> = {
  'INFANTRY': 'sword_infantry',
  'SPEAR': 'ji_infantry',
  'HALBERD': 'halberd_infantry',
  'CAVALRY': 'cavalry',
  'ARCHER': 'archer',
  'CROSSBOW': 'crossbow',
  'GUARD': 'spear_guard',
  'SHOCK': 'shock_cavalry',
  'HORSE_ARCHER': 'horse_archer',
};

/**
 * Voxel 기반 전술맵 패널
 * - 평화 시: Three.js로 성 + 주둔 부대 표시
 * - 전투 시: Phaser + Three.js 하이브리드 엔진으로 실시간 전투
 */
export default function VoxelTacticalMapPanel({ 
  serverID, 
  generalId, 
  cityId, 
  cityName,
  garrisonUnits = [] 
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<InstanceType<PhaserVoxelEngineType> | null>(null);
  
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInBattle, setIsInBattle] = useState(false);
  const [battleState, setBattleState] = useState<BattleState | null>(null);
  const [battleStatus, setBattleStatus] = useState<'preparing' | 'running' | 'paused' | 'ended'>('preparing');
  const [battleSpeed, setBattleSpeed] = useState(1);
  const [attackerStats, setAttackerStats] = useState<Stats>({ alive: 0, total: 0, kills: 0 });
  const [defenderStats, setDefenderStats] = useState<Stats>({ alive: 0, total: 0, kills: 0 });
  const [winner, setWinner] = useState<'attacker' | 'defender' | null>(null);
  const [recentLogs, setRecentLogs] = useState<LogEntry[]>([]);
  const [viewMode, setViewMode] = useState<'peace' | 'battle'>('peace');
  
  // Socket.IO
  const { socket, onBattleEvent, onLogUpdate } = useSocket({ sessionId: serverID, autoConnect: true });

  // 엔진 초기화
  const initEngine = useCallback(async () => {
    if (!containerRef.current) return;
    
    // 기존 내용 제거
    while (containerRef.current.firstChild) {
      containerRef.current.removeChild(containerRef.current.firstChild);
    }
    
    try {
      const { PhaserVoxelEngine } = await import('@/lib/battle/PhaserVoxelEngine');
      
      const engine = new PhaserVoxelEngine();
      await engine.initialize(containerRef.current);
      
      engineRef.current = engine;
      
      // 콜백 설정
      engine.setOnStatsUpdate((attacker, defender) => {
        setAttackerStats({ ...attacker });
        setDefenderStats({ ...defender });
      });
      
      engine.setOnBattleEnd((w) => {
        setWinner(w);
        setBattleStatus('ended');
      });
      
      // 복셀 렌더러 초기화
      engine.initializeRenderer();
      
      setIsLoaded(true);
    } catch (error) {
      console.error('[VoxelTacticalMap] 엔진 로딩 실패:', error);
    }
  }, []);

  // 평화 시: 주둔 부대 배치
  const deployGarrisonUnits = useCallback(() => {
    const engine = engineRef.current;
    if (!engine) return;
    
    // 기존 부대 제거
    const logicScene = engine.logicScene;
    if (!logicScene) return;
    
    // 주둔 부대를 3D로 배치
    garrisonUnits.forEach((unit, index) => {
      const category = UNIT_TYPE_MAP[unit.unitType] || 'sword_infantry';
      const soldierCount = Math.ceil(unit.troops / TROOPS_PER_SOLDIER);
      
      // 성 내부에 배치 (원형 배치)
      const angle = (index / garrisonUnits.length) * Math.PI * 2;
      const radius = 15 + (index % 3) * 10;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      
      engine.createSquad({
        name: unit.generalName,
        teamId: 'defender', // 주둔 부대는 방어군
        category,
        soldierCount: Math.min(soldierCount, 50),
        x,
        z,
        facing: -angle + Math.PI, // 바깥쪽을 향함
      });
    });
    
    // 초기 통계 설정
    let totalSoldiers = 0;
    logicScene.getSquads().forEach(squad => {
      totalSoldiers += squad.soldiers.length;
    });
    setDefenderStats({ alive: totalSoldiers, total: totalSoldiers, kills: 0 });
    
    console.log(`✅ 주둔 부대 ${garrisonUnits.length}개 배치 완료`);
  }, [garrisonUnits]);

  // 전투 시: 전투 유닛 배치
  const deployBattleUnits = useCallback((battle: BattleState) => {
    const engine = engineRef.current;
    if (!engine) return;
    
    const logicScene = engine.logicScene;
    if (!logicScene) return;
    
    // 기존 부대 제거 (새 전투용)
    // Note: 실제로는 logicScene.clearAllSquads() 같은 메서드가 필요
    
    // 공격군 배치 (북쪽)
    battle.attackerUnits.forEach((unit, index) => {
      const category = UNIT_TYPE_MAP[unit.unitType || 'INFANTRY'] || 'sword_infantry';
      const soldierCount = Math.ceil(unit.troops / TROOPS_PER_SOLDIER);
      
      const x = (index - battle.attackerUnits.length / 2) * 25;
      const z = -40;
      
      engine.createSquad({
        name: unit.generalName,
        teamId: 'attacker',
        category,
        soldierCount: Math.min(soldierCount, 50),
        x,
        z,
        facing: Math.PI / 2, // 남쪽을 향함
      });
    });
    
    // 수비군 배치 (남쪽)
    battle.defenderUnits.forEach((unit, index) => {
      const category = UNIT_TYPE_MAP[unit.unitType || 'INFANTRY'] || 'sword_infantry';
      const soldierCount = Math.ceil(unit.troops / TROOPS_PER_SOLDIER);
      
      const x = (index - battle.defenderUnits.length / 2) * 25;
      const z = 40;
      
      engine.createSquad({
        name: unit.generalName,
        teamId: 'defender',
        category,
        soldierCount: Math.min(soldierCount, 50),
        x,
        z,
        facing: -Math.PI / 2, // 북쪽을 향함
      });
    });
    
    // 초기 통계
    let attackerTotal = 0, defenderTotal = 0;
    logicScene.getSquads().forEach(squad => {
      if (squad.teamId === 'attacker') attackerTotal += squad.soldiers.length;
      else defenderTotal += squad.soldiers.length;
    });
    setAttackerStats({ alive: attackerTotal, total: attackerTotal, kills: 0 });
    setDefenderStats({ alive: defenderTotal, total: defenderTotal, kills: 0 });
    
    console.log(`✅ 전투 유닛 배치 완료: 공격군 ${battle.attackerUnits.length}, 수비군 ${battle.defenderUnits.length}`);
  }, []);

  // 컴포넌트 마운트 시 엔진 초기화
  useEffect(() => {
    initEngine();
    
    return () => {
      engineRef.current?.dispose();
    };
  }, [initEngine]);

  // 주둔 부대 변경 시 재배치 (평화 시)
  useEffect(() => {
    if (isLoaded && !isInBattle && garrisonUnits.length > 0) {
      deployGarrisonUnits();
    }
  }, [isLoaded, isInBattle, garrisonUnits, deployGarrisonUnits]);

  // 소켓 이벤트 리스너
  useEffect(() => {
    if (!socket) return;

    const handleBattleStarted = (data: any) => {
      console.log('[VoxelTacticalMap] 전투 시작:', data);
      setIsInBattle(true);
      setBattleState(data);
      setViewMode('battle');
      
      // 전투 유닛 배치
      if (engineRef.current) {
        deployBattleUnits(data);
      }
    };

    const handleBattleState = (data: any) => {
      console.log('[VoxelTacticalMap] 전투 상태 업데이트:', data);
      setBattleState(data);
      
      // 실시간 유닛 위치 업데이트 (나중에 구현)
    };

    const handleBattleEnded = (data: any) => {
      console.log('[VoxelTacticalMap] 전투 종료:', data);
      setIsInBattle(false);
      setBattleStatus('ended');
      
      setTimeout(() => {
        setBattleState(null);
        setViewMode('peace');
        // 주둔 부대로 복귀
        deployGarrisonUnits();
      }, 5000);
    };

    const handleBattleLog = (data: any) => {
      addLog({
        id: Date.now(),
        text: data.logText,
        type: data.logType || 'action',
        timestamp: new Date(data.timestamp)
      });
    };

    const cleanupStarted = onBattleEvent('started', handleBattleStarted);
    socket.on('battle:state', handleBattleState);
    const cleanupEnded = onBattleEvent('ended', handleBattleEnded);
    socket.on('battle:log', handleBattleLog);

    return () => {
      cleanupStarted();
      socket.off('battle:state', handleBattleState);
      cleanupEnded();
      socket.off('battle:log', handleBattleLog);
    };
  }, [socket, onBattleEvent, deployBattleUnits, deployGarrisonUnits]);

  // 로그 추가
  const addLog = (log: LogEntry) => {
    setRecentLogs(prev => [log, ...prev].slice(0, 5));
    setTimeout(() => {
      setRecentLogs(prev => prev.filter(l => l.id !== log.id));
    }, 5000);
  };

  // 전투 시작
  const handleStartBattle = useCallback(() => {
    engineRef.current?.startBattle();
    setBattleStatus('running');
  }, []);

  // 일시정지
  const handlePauseBattle = useCallback(() => {
    engineRef.current?.pauseBattle();
    setBattleStatus(prev => prev === 'running' ? 'paused' : 'running');
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
        <div className={styles.loadingOverlay}>
          <div className={styles.loadingContent}>
            <div className={styles.spinner}></div>
            <p>🎮 Phaser + Three.js + 복셀 엔진 로딩 중...</p>
          </div>
        </div>
      )}

      {/* 상단 HUD */}
      <div className={styles.topHud} style={{ visibility: isLoaded ? 'visible' : 'hidden' }}>
        <div className={styles.header}>
          <div className={styles.locationInfo}>
            <span className={styles.cityIcon}>🏯</span>
            <span className={styles.cityName}>{cityName || '전술맵'}</span>
            <span className={styles.viewMode}>
              {viewMode === 'peace' ? '평화' : '⚔️ 전투'}
            </span>
          </div>
          
          {isInBattle && (
            <div className={styles.battleStats}>
              <div className={styles.attackerStats}>
                <span className={styles.teamIcon}>🏴</span>
                <span className={styles.soldiers}>
                  {(attackerStats.alive * TROOPS_PER_SOLDIER).toLocaleString()}
                </span>
                <span className={styles.kills}>💀 {(attackerStats.kills * TROOPS_PER_SOLDIER).toLocaleString()}</span>
              </div>
              
              <div className={styles.vsText}>VS</div>
              
              <div className={styles.defenderStats}>
                <span className={styles.teamIcon}>🚩</span>
                <span className={styles.soldiers}>
                  {(defenderStats.alive * TROOPS_PER_SOLDIER).toLocaleString()}
                </span>
                <span className={styles.kills}>💀 {(defenderStats.kills * TROOPS_PER_SOLDIER).toLocaleString()}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Three.js 캔버스 컨테이너 */}
      <div 
        ref={containerRef} 
        className={styles.canvasContainer}
      />

      {/* 전투 컨트롤 (전투 시) */}
      {isInBattle && isLoaded && (
        <div className={styles.battleControls}>
          {battleStatus === 'preparing' && (
            <button className={styles.startButton} onClick={handleStartBattle}>
              ⚔️ 전투 시작
            </button>
          )}
          {(battleStatus === 'running' || battleStatus === 'paused') && (
            <button className={styles.pauseButton} onClick={handlePauseBattle}>
              {battleStatus === 'running' ? '⏸️ 일시정지' : '▶️ 재개'}
            </button>
          )}
          {battleStatus === 'ended' && (
            <div className={styles.victoryBanner}>
              🏆 {winner === 'attacker' ? '공격군 승리!' : '수비군 승리!'}
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
      )}

      {/* 주둔 부대 정보 (평화 시) */}
      {!isInBattle && isLoaded && garrisonUnits.length > 0 && (
        <div className={styles.garrisonInfo}>
          <div className={styles.garrisonHeader}>
            <span>🛡️ 주둔 부대</span>
            <span className={styles.garrisonCount}>{garrisonUnits.length}개 부대</span>
          </div>
          <div className={styles.garrisonList}>
            {garrisonUnits.slice(0, 5).map((unit, i) => (
              <div key={unit.generalId} className={styles.garrisonUnit}>
                <span className={styles.unitName}>{unit.generalName}</span>
                <span className={styles.unitTroops}>{unit.troops.toLocaleString()}</span>
              </div>
            ))}
            {garrisonUnits.length > 5 && (
              <div className={styles.moreUnits}>+{garrisonUnits.length - 5}개 더...</div>
            )}
          </div>
        </div>
      )}

      {/* 로그 오버레이 */}
      {recentLogs.length > 0 && (
        <div className={styles.logOverlay}>
          {recentLogs.map((log) => (
            <div key={log.id} className={styles.logEntry}>
              <span className={styles.logIcon}>{getLogIcon(log.type)}</span>
              <span 
                className={styles.logText}
                dangerouslySetInnerHTML={{ __html: formatLogText(log.text) }}
              />
            </div>
          ))}
        </div>
      )}

      {/* 조작 안내 */}
      <div className={styles.controls}>
        <p>마우스 드래그: 회전 | 우클릭 드래그: 이동 | 휠: 줌</p>
      </div>
    </div>
  );
}

// 로그 아이콘
const getLogIcon = (type: string): string => {
  switch (type) {
    case 'action': return '⚔️';
    case 'damage': return '💥';
    case 'status': return '📊';
    case 'result': return '🏆';
    case 'general': return '👤';
    case 'history': return '📜';
    default: return '📋';
  }
};

// 로그 텍스트 포맷팅
const formatLogText = (text: string): string => {
  return text
    .replace(/<R>(.*?)<\/>/g, '<span style="color: #E24A4A; font-weight: bold;">$1</span>')
    .replace(/<B>(.*?)<\/>/g, '<span style="color: #4A90E2; font-weight: bold;">$1</span>')
    .replace(/<G>(.*?)<\/>/g, '<span style="color: #7ED321; font-weight: bold;">$1</span>')
    .replace(/<Y>(.*?)<\/>/g, '<span style="color: #F5A623; font-weight: bold;">$1</span>')
    .replace(/<S>(.*?)<\/>/g, '<span style="color: #9013FE; font-weight: bold;">$1</span>')
    .replace(/<1>(.*?)<\/>/g, '<span style="color: #888; font-style: italic;">$1</span>');
};



