'use client';

import { Suspense, useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useSearchParams } from 'next/navigation';
import { useTacticalSocket } from '@/hooks/useTacticalSocket';
import { useGin7TacticalStore } from '@/stores/gin7TacticalStore';

// Dynamic import to avoid SSR issues with Three.js
const TacticalCanvas = dynamic(
  () => import('@/components/gin7/tactical/TacticalCanvas'),
  {
    ssr: false,
    loading: () => <div className="w-full h-full bg-[#030810] flex items-center justify-center"><span className="text-white/60 animate-pulse">3D 로딩...</span></div>,
  }
);

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

// ============================================================
// Loading Screen
// ============================================================

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-[#020408] flex flex-col items-center justify-center">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <h1 className="text-xl font-bold text-white">전술 전투 로딩 중...</h1>
        <p className="text-sm text-white/60">3D 전투 환경을 준비하고 있습니다</p>
      </div>
    </div>
  );
}

// ============================================================
// Demo Battle Page
// ============================================================

interface DemoFleet {
  fleetId: string;
  name: string;
  faction: string;
  ships: number;
}

function DemoBattlePage() {
  const [token, setToken] = useState('');
  const [sessionId] = useState('demo-session');
  const [empireShips, setEmpireShips] = useState(3000);
  const [allianceShips, setAllianceShips] = useState(3000);
  const [demoFleets, setDemoFleets] = useState<DemoFleet[]>([]);
  const [currentBattleId, setCurrentBattleId] = useState<string | null>(null);
  const [myFleetId, setMyFleetId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'config' | 'battle'>('config');

  // Store state
  const units = useGin7TacticalStore((s) => s.units);
  const status = useGin7TacticalStore((s) => s.status);
  const tick = useGin7TacticalStore((s) => s.tick);
  const isConnected = useGin7TacticalStore((s) => s.isConnected);
  const battleId = useGin7TacticalStore((s) => s.battleId);
  const selectedUnitIds = useGin7TacticalStore((s) => s.selectedUnitIds);

  // Socket connection
  const {
    connect,
    disconnect,
    createBattle,
    joinBattle,
    setReady,
    startBattle,
    sendCommand,
    socket,
  } = useTacticalSocket({
    sessionId,
    factionId: 'empire',
    commanderId: 'demo-user',
    token,
    autoConnect: false,
  });

  // Step 1: Create demo fleets via REST API
  const createDemoFleets = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${BACKEND_URL}/api/gin7/tactical/demo/create`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          sessionId,
          empireShips,
          allianceShips,
        }),
      });

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error?.message || 'Failed to create demo fleets');
      }

      setDemoFleets(data.data.fleets);
      setMyFleetId(data.data.fleets[0]?.fleetId || null);

      // Now connect to WebSocket
      connect();

    } catch (err: any) {
      setError(err.message || 'Failed to create demo fleets');
    } finally {
      setIsLoading(false);
    }
  }, [sessionId, empireShips, allianceShips, connect]);

  // Step 2: Create battle via WebSocket (after socket connected)
  useEffect(() => {
    if (isConnected && demoFleets.length >= 2 && !currentBattleId && socket) {
      const fleetIds = demoFleets.map(f => f.fleetId);
      
      // Listen for battle created event
      const handleCreated = (data: { battleId: string }) => {
        console.log('[Demo] Battle created:', data.battleId);
        setCurrentBattleId(data.battleId);
      };
      
      socket.on('rtbattle:created', handleCreated);
      
      // Create battle
      createBattle(fleetIds, {
        name: 'Demo Battle - 은하제국 vs 자유행성동맹',
        battleAreaSize: 'MEDIUM',
        tickRate: 10,
      });
      
      return () => {
        socket.off('rtbattle:created', handleCreated);
      };
    }
  }, [isConnected, demoFleets, currentBattleId, socket, createBattle]);

  // Step 3: Join battle once created
  useEffect(() => {
    if (currentBattleId && myFleetId && socket) {
      joinBattle(currentBattleId, myFleetId);
      
      // Set ready for both fleets (simulate both players ready)
      setTimeout(() => {
        demoFleets.forEach(fleet => {
          setReady(currentBattleId, fleet.fleetId, true);
        });
      }, 500);
    }
  }, [currentBattleId, myFleetId, demoFleets, socket, joinBattle, setReady]);

  // Step 4: Start battle when joined
  useEffect(() => {
    if (battleId && socket) {
      // Small delay to ensure both are ready
      const timer = setTimeout(() => {
        startBattle(battleId);
        setStep('battle');
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [battleId, socket, startBattle]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  // Send move command
  const handleMoveCommand = useCallback((targetX: number, targetZ: number) => {
    if (!battleId || !myFleetId || selectedUnitIds.size === 0) return;
    
    sendCommand(battleId, myFleetId, {
      type: 'MOVE',
      targetPosition: { x: targetX, y: 0, z: targetZ },
    });
  }, [battleId, myFleetId, selectedUnitIds, sendCommand]);

  // Send attack command
  const handleAttackCommand = useCallback((targetFleetId: string) => {
    if (!battleId || !myFleetId) return;
    
    sendCommand(battleId, myFleetId, {
      type: 'ATTACK',
      targetFleetId,
    });
  }, [battleId, myFleetId, sendCommand]);

  // ============================================================
  // Config Screen
  // ============================================================
  if (step === 'config') {
    return (
      <div className="min-h-screen bg-[#020408] flex items-center justify-center p-4">
        <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 w-full max-w-lg space-y-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white">GIN7 준실시간 함대전</h1>
            <p className="text-sm text-white/60 mt-2">데모 배틀 설정</p>
          </div>

          {error && (
            <div className="bg-red-900/50 border border-red-700 text-red-200 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-xs text-white/70 mb-1">JWT 토큰 (인증용)</label>
              <input
                type="text"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-500"
                placeholder="서버에서 발급받은 JWT 토큰"
              />
              <p className="text-xs text-white/40 mt-1">
                테스트용: 백엔드 JWT_SECRET으로 생성된 토큰 필요
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-white/70 mb-1">은하제국 함선 수</label>
                <input
                  type="number"
                  value={empireShips}
                  onChange={(e) => setEmpireShips(Math.max(100, parseInt(e.target.value) || 100))}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-yellow-500"
                />
              </div>
              <div>
                <label className="block text-xs text-white/70 mb-1">자유행성동맹 함선 수</label>
                <input
                  type="number"
                  value={allianceShips}
                  onChange={(e) => setAllianceShips(Math.max(100, parseInt(e.target.value) || 100))}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          <button
            onClick={createDemoFleets}
            disabled={isLoading || !token}
            className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-bold rounded-lg transition-colors"
          >
            {isLoading ? '생성 중...' : '데모 배틀 시작'}
          </button>

          {demoFleets.length > 0 && (
            <div className="bg-slate-800 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-white mb-2">생성된 함대:</h3>
              {demoFleets.map((fleet) => (
                <div key={fleet.fleetId} className="flex justify-between text-xs text-white/70 py-1">
                  <span>{fleet.name}</span>
                  <span>{fleet.ships.toLocaleString()} 척</span>
                </div>
              ))}
              <div className="mt-2 pt-2 border-t border-slate-700 text-xs">
                <span className={isConnected ? 'text-green-400' : 'text-yellow-400'}>
                  {isConnected ? '● WebSocket 연결됨' : '○ 연결 중...'}
                </span>
              </div>
            </div>
          )}

          <div className="text-center">
            <p className="text-xs text-white/40">
              백엔드 서버가 localhost:8080에서 실행 중이어야 합니다
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================
  // Battle Screen
  // ============================================================
  return (
    <div className="h-screen flex flex-col bg-[#020408]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-900/95 border-b border-slate-700">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${
              status === 'RUNNING' ? 'bg-red-500 animate-pulse' :
              status === 'COUNTDOWN' ? 'bg-yellow-500' :
              'bg-blue-500'
            }`} />
            <span className="text-sm font-bold text-white uppercase">{status}</span>
          </div>
          <div className="text-sm font-mono text-white/70">TICK: {tick}</div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-sm">
            <span className="text-yellow-400">제국</span>
            <span className="text-white/40 mx-2">vs</span>
            <span className="text-blue-400">동맹</span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-white/50">
          <span className={isConnected ? 'text-green-400' : 'text-red-400'}>
            {isConnected ? '● CONNECTED' : '○ DISCONNECTED'}
          </span>
          <span>유닛: {units.length}</span>
        </div>
      </div>

      {/* Main Battle View */}
      <div className="flex-1 relative">
        <TacticalCanvas className="absolute inset-0" />

        {/* Unit List Panel */}
        <div className="absolute top-4 left-4 w-64 bg-slate-900/90 backdrop-blur border border-slate-700 rounded-lg p-3 max-h-96 overflow-y-auto">
          <h3 className="text-sm font-bold text-white mb-2">함대 목록</h3>
          {units.length === 0 ? (
            <p className="text-xs text-white/50">유닛 대기 중...</p>
          ) : (
            <div className="space-y-2">
              {units.map((unit) => (
                <div
                  key={unit.id}
                  className={`p-2 rounded ${
                    unit.factionId === 'empire' 
                      ? 'bg-yellow-900/30 border border-yellow-700/50' 
                      : 'bg-blue-900/30 border border-blue-700/50'
                  } ${selectedUnitIds.has(unit.id) ? 'ring-2 ring-green-500' : ''}`}
                >
                <div className="flex justify-between text-xs">
                                    <span className={unit.factionId === 'empire' ? 'text-yellow-400' : 'text-blue-400'}>
                                      {unit.name || unit.id.slice(-8)}
                                    </span>
                                    <span className="text-white/60">
                                      {unit.shipCount} 유닛 ({(unit.shipCount * 300).toLocaleString()} 척)
                                    </span>
                                  </div>
                  <div className="mt-1 flex gap-2">
                    <div className="flex-1">
                      <div className="text-[10px] text-white/40">HP</div>
                      <div className="h-1 bg-slate-700 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-green-500 transition-all" 
                          style={{ width: `${(unit.hp / unit.maxHp) * 100}%` }}
                        />
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="text-[10px] text-white/40">사기</div>
                      <div className="h-1 bg-slate-700 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-yellow-500 transition-all" 
                          style={{ width: `${unit.morale}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Command Panel */}
        <div className="absolute bottom-4 left-4 bg-slate-900/90 backdrop-blur border border-slate-700 rounded-lg p-3 min-w-64">
          <h3 className="text-xs font-bold text-white/70 mb-2">명령 패널</h3>
          
          {/* Selected fleet info */}
          {selectedUnitIds.size > 0 && (
            <div className="mb-3 p-2 bg-slate-800/50 rounded text-xs text-white/70">
              선택: {selectedUnitIds.size}개 함대
            </div>
          )}
          
          <div className="space-y-2">
            {/* Move commands */}
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => handleMoveCommand(0, 0)}
                disabled={!myFleetId || !battleId}
                className="px-3 py-1.5 bg-cyan-700 hover:bg-cyan-600 disabled:bg-slate-700 text-white text-xs rounded transition-colors"
              >
                중앙 이동
              </button>
              <button
                onClick={() => handleMoveCommand(-500, 0)}
                disabled={!myFleetId || !battleId}
                className="px-3 py-1.5 bg-cyan-700 hover:bg-cyan-600 disabled:bg-slate-700 text-white text-xs rounded transition-colors"
              >
                좌측
              </button>
              <button
                onClick={() => handleMoveCommand(500, 0)}
                disabled={!myFleetId || !battleId}
                className="px-3 py-1.5 bg-cyan-700 hover:bg-cyan-600 disabled:bg-slate-700 text-white text-xs rounded transition-colors"
              >
                우측
              </button>
            </div>
            
            {/* Attack commands */}
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => {
                  const enemyUnit = units.find(u => u.factionId === 'alliance' && !u.isDestroyed);
                  if (enemyUnit) handleAttackCommand(enemyUnit.id);
                }}
                disabled={!myFleetId || !battleId}
                className="px-3 py-1.5 bg-red-700 hover:bg-red-600 disabled:bg-slate-700 text-white text-xs rounded transition-colors"
              >
                적 공격
              </button>
              <button
                onClick={() => {
                  if (battleId && myFleetId) {
                    sendCommand(battleId, myFleetId, { type: 'STOP' });
                  }
                }}
                disabled={!myFleetId || !battleId}
                className="px-3 py-1.5 bg-slate-600 hover:bg-slate-500 disabled:bg-slate-700 text-white text-xs rounded transition-colors"
              >
                정지
              </button>
              <button
                onClick={() => {
                  if (battleId && myFleetId) {
                    sendCommand(battleId, myFleetId, { type: 'RETREAT' });
                  }
                }}
                disabled={!myFleetId || !battleId}
                className="px-3 py-1.5 bg-orange-700 hover:bg-orange-600 disabled:bg-slate-700 text-white text-xs rounded transition-colors"
              >
                퇴각
              </button>
            </div>
            
            {/* Formation commands */}
            <div className="pt-2 border-t border-slate-700">
              <div className="text-xs text-white/50 mb-1">진형</div>
              <div className="flex gap-1 flex-wrap">
                {['LINE', 'WEDGE', 'CIRCLE', 'DEFENSIVE'].map(formation => (
                  <button
                    key={formation}
                    onClick={() => {
                      if (battleId && myFleetId) {
                        sendCommand(battleId, myFleetId, { 
                          type: 'FORMATION', 
                          formationType: formation 
                        });
                      }
                    }}
                    disabled={!myFleetId || !battleId}
                    className="px-2 py-1 bg-purple-800 hover:bg-purple-700 disabled:bg-slate-700 text-white text-[10px] rounded transition-colors"
                  >
                    {formation}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Controls Help */}
        <div className="absolute bottom-4 right-4 bg-slate-900/80 border border-slate-700 rounded-lg p-2 text-xs text-white/50">
          <div>마우스 드래그: 카메라 회전</div>
          <div>휠: 줌</div>
          <div>클릭: 유닛 선택</div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Main Page Component
// ============================================================

function TacticalPageContent() {
  const searchParams = useSearchParams();
  const battleId = searchParams.get('battleId');

  // If no battle ID, show demo page
  if (!battleId) {
    return <DemoBattlePage />;
  }

  // Otherwise, could implement a join existing battle flow
  return <DemoBattlePage />;
}

export default function TacticalPage() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <TacticalPageContent />
    </Suspense>
  );
}

