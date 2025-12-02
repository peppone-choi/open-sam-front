'use client';

/**
 * GameBattleAdapter - 본게임 전투 데이터를 복셀 엔진에 연결하는 어댑터
 * 
 * API에서 받은 전투 데이터를 PhaserVoxelEngine 형식으로 변환하고
 * 실시간 전투 시뮬레이션을 실행합니다.
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import type { TeamId, SoldierRole } from '@/lib/battle/PhaserVoxelEngine';

// 본게임 API 유닛 타입
export interface GameBattleUnit {
  id: string | number;
  no?: number;
  name: string;
  type: 'attacker' | 'defender';
  crew: number;
  x?: number;
  y?: number;
  // 장수 정보
  generalName?: string;
  generalNo?: number;
  // 병종 정보
  crewType?: number;  // 0: 보병, 1: 궁병, 2: 기병 등
  crewTypeName?: string;
  // 스탯
  leadership?: number;
  strength?: number;
  intel?: number;
  // 아이템/장비
  weapon?: number;
  armor?: number;
  horse?: number;
}

export interface GameBattleData {
  battleId: number | string;
  name?: string;
  attackerNation?: string;
  defenderNation?: string;
  attackerColor?: string;
  defenderColor?: string;
  units: GameBattleUnit[];
  terrain?: string;
  weather?: string;
}

// 병종 매핑 (본게임 crewType -> 복셀 엔진 category)
const CREW_TYPE_MAP: Record<number, string> = {
  0: 'ji_infantry',      // 창병
  1: 'sword_infantry',   // 도검병
  2: 'halberd_infantry', // 극병
  3: 'spear_guard',      // 수비병
  4: 'archer',           // 궁병
  5: 'crossbow',         // 노병
  6: 'cavalry',          // 기병
  7: 'shock_cavalry',    // 돌격기병
  8: 'horse_archer',     // 궁기병
};

// 병종별 기본 병력 스케일 (시각화용)
const CREW_SCALE: Record<string, number> = {
  ji_infantry: 1,
  sword_infantry: 1,
  halberd_infantry: 1,
  spear_guard: 1,
  archer: 0.8,
  crossbow: 0.8,
  cavalry: 0.6,
  shock_cavalry: 0.6,
  horse_archer: 0.5,
};

interface GameBattleAdapterProps {
  battleData: GameBattleData;
  onBattleEnd?: (winner: TeamId, stats: { attacker: any; defender: any }) => void;
  autoStart?: boolean;
  speedMultiplier?: number;
}

// 동적 임포트를 위한 타입
type PhaserVoxelEngineType = typeof import('@/lib/battle/PhaserVoxelEngine').PhaserVoxelEngine;

export default function GameBattleAdapter({
  battleData,
  onBattleEnd,
  autoStart = false,
  speedMultiplier = 1,
}: GameBattleAdapterProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<InstanceType<PhaserVoxelEngineType> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [battleState, setBattleState] = useState<'preparing' | 'running' | 'paused' | 'ended'>('preparing');
  const [stats, setStats] = useState({
    attacker: { alive: 0, total: 0, kills: 0 },
    defender: { alive: 0, total: 0, kills: 0 },
  });

  // 본게임 유닛을 복셀 엔진 부대로 변환
  const convertToSquads = useCallback((units: GameBattleUnit[]) => {
    const squads: Array<{
      name: string;
      teamId: TeamId;
      category: string;
      soldierCount: number;
      x: number;
      z: number;
      facing: number;
      generalName?: string;
    }> = [];

    // 공격자/수비자 분리
    const attackers = units.filter(u => u.type === 'attacker');
    const defenders = units.filter(u => u.type === 'defender');

    // 공격자 배치 (북쪽, z < 0)
    const attackerFacing = Math.PI / 2; // 남쪽을 향함
    attackers.forEach((unit, index) => {
      const category = CREW_TYPE_MAP[unit.crewType ?? 0] || 'ji_infantry';
      const scale = CREW_SCALE[category] || 1;
      // 병력을 시각화 가능한 수준으로 스케일링 (최대 60명)
      const soldierCount = Math.min(60, Math.max(10, Math.ceil(unit.crew / 100 * scale)));
      
      // 배치 위치 계산 (가로로 펼침)
      const cols = Math.ceil(Math.sqrt(attackers.length));
      const row = Math.floor(index / cols);
      const col = index % cols;
      const spacing = 25;
      const x = (col - cols / 2) * spacing;
      const z = -30 - row * 15;

      squads.push({
        name: unit.name || `${unit.generalName || '부대'} ${index + 1}`,
        teamId: 'attacker',
        category,
        soldierCount,
        x,
        z,
        facing: attackerFacing,
        generalName: unit.generalName,
      });
    });

    // 수비자 배치 (남쪽, z > 0)
    const defenderFacing = -Math.PI / 2; // 북쪽을 향함
    defenders.forEach((unit, index) => {
      const category = CREW_TYPE_MAP[unit.crewType ?? 0] || 'ji_infantry';
      const scale = CREW_SCALE[category] || 1;
      const soldierCount = Math.min(60, Math.max(10, Math.ceil(unit.crew / 100 * scale)));
      
      const cols = Math.ceil(Math.sqrt(defenders.length));
      const row = Math.floor(index / cols);
      const col = index % cols;
      const spacing = 25;
      const x = (col - cols / 2) * spacing;
      const z = 30 + row * 15;

      squads.push({
        name: unit.name || `${unit.generalName || '부대'} ${index + 1}`,
        teamId: 'defender',
        category,
        soldierCount,
        x,
        z,
        facing: defenderFacing,
        generalName: unit.generalName,
      });
    });

    return squads;
  }, []);

  // 엔진 초기화
  useEffect(() => {
    if (!containerRef.current) return;

    let mounted = true;

    async function initEngine() {
      try {
        const { PhaserVoxelEngine } = await import('@/lib/battle/PhaserVoxelEngine');
        
        if (!mounted || !containerRef.current) return;

        const engine = await PhaserVoxelEngine.initialize(containerRef.current);
        engineRef.current = engine;

        // 통계 콜백 설정
        engine.onStatsUpdate((attacker, defender) => {
          setStats({ attacker, defender });
        });

        // 전투 종료 콜백
        engine.onBattleEnd((winner) => {
          setBattleState('ended');
          onBattleEnd?.(winner, stats);
        });

        // 부대 생성
        const squads = convertToSquads(battleData.units);
        squads.forEach(squad => {
          engine.createSquad(squad);
        });

        setIsLoading(false);

        // 자동 시작
        if (autoStart) {
          setTimeout(() => {
            engine.startBattle();
            setBattleState('running');
          }, 1000);
        }
      } catch (error) {
        console.error('Failed to initialize battle engine:', error);
      }
    }

    initEngine();

    return () => {
      mounted = false;
      engineRef.current?.dispose();
    };
  }, [battleData, convertToSquads, autoStart, onBattleEnd]);

  // 전투 컨트롤
  const handleStart = useCallback(() => {
    engineRef.current?.startBattle();
    setBattleState('running');
  }, []);

  const handlePause = useCallback(() => {
    engineRef.current?.pauseBattle();
    setBattleState('paused');
  }, []);

  const handleResume = useCallback(() => {
    engineRef.current?.resumeBattle();
    setBattleState('running');
  }, []);

  const handleSpeedChange = useCallback((speed: number) => {
    engineRef.current?.setSpeed(speed);
  }, []);

  return (
    <div className="w-full h-full flex flex-col bg-gray-950">
      {/* 상단 정보 바 */}
      <div className="flex-none bg-gradient-to-b from-gray-900 to-transparent p-4">
        <div className="flex justify-between items-center max-w-6xl mx-auto">
          {/* 공격측 */}
          <div className="flex-1 text-left">
            <div className="text-red-400 font-bold text-sm">
              🏴 {battleData.attackerNation || '공격군'}
            </div>
            <div className="text-white text-2xl font-bold">
              {stats.attacker.alive.toLocaleString()} / {stats.attacker.total.toLocaleString()}
            </div>
            <div className="text-gray-400 text-xs">
              💀 {stats.attacker.kills.toLocaleString()}
            </div>
          </div>

          {/* 중앙 - 전투 정보 */}
          <div className="flex-none text-center px-8">
            <div className="text-yellow-400 font-bold">
              ⚔️ {battleData.name || `전투 #${battleData.battleId}`}
            </div>
            <div className="text-gray-500 text-xs mt-1">
              복셀 전투 시뮬레이션
            </div>
          </div>

          {/* 수비측 */}
          <div className="flex-1 text-right">
            <div className="text-blue-400 font-bold text-sm">
              🚩 {battleData.defenderNation || '수비군'}
            </div>
            <div className="text-white text-2xl font-bold">
              {stats.defender.alive.toLocaleString()} / {stats.defender.total.toLocaleString()}
            </div>
            <div className="text-gray-400 text-xs">
              💀 {stats.defender.kills.toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      {/* 전투 캔버스 */}
      <div ref={containerRef} className="flex-1 relative">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-950">
            <div className="text-center">
              <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
              <div className="text-gray-400">전투 준비 중...</div>
            </div>
          </div>
        )}
      </div>

      {/* 하단 컨트롤 */}
      <div className="flex-none bg-gradient-to-t from-gray-900 to-transparent p-4">
        <div className="flex justify-center items-center gap-4">
          {battleState === 'preparing' && (
            <button
              onClick={handleStart}
              className="px-6 py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg transition-colors"
            >
              ⚔️ 전투 시작
            </button>
          )}
          
          {battleState === 'running' && (
            <button
              onClick={handlePause}
              className="px-6 py-2 bg-gray-600 hover:bg-gray-500 text-white font-bold rounded-lg transition-colors"
            >
              ⏸️ 일시정지
            </button>
          )}
          
          {battleState === 'paused' && (
            <button
              onClick={handleResume}
              className="px-6 py-2 bg-green-600 hover:bg-green-500 text-white font-bold rounded-lg transition-colors"
            >
              ▶️ 재개
            </button>
          )}

          {battleState === 'ended' && (
            <div className="text-yellow-400 font-bold text-xl">
              🏆 전투 종료
            </div>
          )}

          {/* 속도 조절 */}
          <div className="flex items-center gap-2 ml-4">
            <span className="text-gray-400 text-sm">속도:</span>
            {[0.5, 1, 2, 4].map(speed => (
              <button
                key={speed}
                onClick={() => handleSpeedChange(speed)}
                className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded transition-colors"
              >
                {speed}x
              </button>
            ))}
          </div>
        </div>

        <p className="text-center text-gray-500 text-xs mt-2">
          마우스 드래그: 회전 | 우클릭 드래그: 이동 | 휠: 줌
        </p>
      </div>
    </div>
  );
}





