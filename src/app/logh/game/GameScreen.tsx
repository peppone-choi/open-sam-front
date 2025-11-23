'use client';

import { useState, useEffect } from 'react';
import { useSocket } from '@/hooks/useSocket';
import StrategicMap from '@/components/logh/StrategicMap';
import TacticalMap from '@/components/logh/TacticalMap';
import { cn } from '@/lib/utils';

/**
 * LOGH Game Screen
 * 은하영웅전설 게임 화면 - 전략/전술 맵, 함대 관리
 */

interface Commander {
  no: number;
  name: string;
  faction: 'empire' | 'alliance';
  rank: string;
  stats: {
    command: number;
    tactics: number;
    strategy: number;
    politics: number;
  };
  commandPoints: number;
  supplies: number;
  fleetId: string | null;
  position: { x: number; y: number; z: number };
}

interface Fleet {
  id: string;
  name: string;
  totalShips: number;
  supplies: number;
  position: { x: number; y: number; z: number };
  formation: string;
}

const FORMATION_NAME_MAP: Record<string, string> = {
  standard: '표준 진형',
  assault: '돌격 진형',
  defense: '방어 진형',
  encircle: '포위 진형',
};

const formatNumber = (value: number | undefined | null) => (typeof value === 'number' ? value.toLocaleString() : '0');

export default function LoghGamePage() {
  const [commander, setCommander] = useState<Commander | null>(null);
  const [fleet, setFleet] = useState<Fleet | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTacticalMap, setActiveTacticalMap] = useState<string | null>(null);
  const [selectedFleet, setSelectedFleet] = useState<any>(null);
  const sessionId = 'test_session'; // TODO: 실제 세션 ID로 교체

  // Socket.IO 연결
  const { socket, isConnected } = useSocket({ sessionId, autoConnect: true });

  useEffect(() => {
    loadGameData();
  }, []);

  async function loadGameData() {
    try {
      setLoading(true);

      // Load commander data from API
      const response = await fetch('/api/logh/my-commander');
      const commanderData = await response.json();
      setCommander(commanderData);

      // Load fleet data if commander has a fleet
      if (commanderData.fleetId) {
        const fleetResponse = await fetch(`/api/logh/fleet/${commanderData.fleetId}`);
        const fleetData = await fleetResponse.json();
        setFleet(fleetData);
      }
    } catch (error) {
      console.error('게임 데이터를 불러오지 못했습니다:', error);
    } finally {
      setLoading(false);
    }
  }

  async function executeCommand(commandName: string, params: any = {}) {
    try {
      await fetch('/api/logh/command/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: commandName, params }),
      });

      alert(`커맨드 "${commandName}" 실행 완료!`);
      await loadGameData();
    } catch (error: any) {
      alert(`커맨드 실행 실패: ${error.message}`);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    );
  }

  if (!commander) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-red-500 text-xl">커맨더 정보를 불러올 수 없습니다</div>
      </div>
    );
  }

  const factionColor = commander.faction === 'empire' ? 'yellow' : 'cyan';
  const factionName = commander.faction === 'empire' ? '은하제국' : '자유혹성동맹';
  const commanderPosition = commander.position ?? { x: 0, y: 0, z: 0 };
  const fleetPosition = fleet?.position ?? { x: 0, y: 0, z: 0 };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 font-sans p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">은하영웅전설 OpenSAM</h1>
          <p className="text-gray-400">은하영웅전설 전략 사령부</p>
        </div>

        {/* Commander Info Panel */}
        <div className={cn(
          "bg-gray-900/50 backdrop-blur-sm rounded-xl p-6 shadow-lg border-2",
          commander.faction === 'empire' ? "border-yellow-700" : "border-cyan-700"
        )}>
          <h2 className={cn(
            "text-2xl font-bold mb-4",
            commander.faction === 'empire' ? "text-yellow-400" : "text-cyan-400"
          )}>커맨더 정보</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <div className="text-gray-400 text-xs mb-1">이름</div>
              <div className="text-xl font-bold text-white">{commander.name}</div>
            </div>
            <div>
              <div className="text-gray-400 text-xs mb-1">소속</div>
              <div className={cn(
                "text-xl font-bold",
                commander.faction === 'empire' ? "text-yellow-400" : "text-cyan-400"
              )}>{factionName}</div>
            </div>
            <div>
              <div className="text-gray-400 text-xs mb-1">계급</div>
              <div className="text-xl font-bold text-white">{commander.rank}</div>
            </div>
            <div>
              <div className="text-gray-400 text-xs mb-1">명령 포인트</div>
              <div className="text-xl font-bold text-purple-400">{commander.commandPoints}</div>
            </div>
            <div>
              <div className="text-gray-400 text-xs mb-1">지휘</div>
              <div className="text-xl font-bold text-blue-400">{commander.stats.command}</div>
            </div>
            <div>
              <div className="text-gray-400 text-xs mb-1">전술</div>
              <div className="text-xl font-bold text-red-400">{commander.stats.tactics}</div>
            </div>
            <div>
              <div className="text-gray-400 text-xs mb-1">전략</div>
              <div className="text-xl font-bold text-purple-400">{commander.stats.strategy}</div>
            </div>
            <div>
              <div className="text-gray-400 text-xs mb-1">정치</div>
              <div className="text-xl font-bold text-green-400">{commander.stats.politics}</div>
            </div>
            <div>
              <div className="text-gray-400 text-xs mb-1">보급품</div>
              <div className="text-xl font-bold text-yellow-400">{formatNumber(commander.supplies)}</div>
            </div>
            <div className="md:col-span-3">
              <div className="text-gray-400 text-xs mb-1">좌표</div>
              <div className="text-xl font-bold text-cyan-400 font-mono">
                ({commanderPosition.x}, {commanderPosition.y}, {commanderPosition.z})
              </div>
            </div>
          </div>
        </div>

        {/* Fleet Info Panel */}
        {fleet && (
          <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-6 shadow-lg border-2 border-cyan-700">
            <h2 className="text-2xl font-bold mb-4 text-cyan-400">함대 정보</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              <div>
                <div className="text-gray-400 text-xs mb-1">함대명</div>
                <div className="text-xl font-bold text-white">{fleet.name}</div>
              </div>
              <div>
                <div className="text-gray-400 text-xs mb-1">총 함선</div>
                <div className="text-xl font-bold text-blue-400">{formatNumber(fleet.totalShips)}</div>
              </div>
              <div>
                <div className="text-gray-400 text-xs mb-1">보급품</div>
                <div className="text-xl font-bold text-yellow-400">{formatNumber(fleet.supplies)}</div>
              </div>
              <div>
                <div className="text-gray-400 text-xs mb-1">진형</div>
                <div className="text-xl font-bold text-red-400">{FORMATION_NAME_MAP[fleet.formation] ?? fleet.formation}</div>
              </div>
              <div className="md:col-span-2">
                <div className="text-gray-400 text-xs mb-1">함대 좌표</div>
                <div className="text-xl font-bold text-cyan-400 font-mono">
                  ({fleetPosition.x}, {fleetPosition.y}, {fleetPosition.z})
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Command Panel */}
        <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-6 shadow-lg border-2 border-purple-700">
          <h2 className="text-2xl font-bold mb-4 text-purple-400">작전 커맨드</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { name: '함대 이동', command: 'move_fleet', color: 'cyan', cp: 2 },
              { name: '작전 발령', command: 'issue_operation', color: 'purple', cp: 5 },
              { name: '함선 생산', command: 'produce_ships', color: 'blue', cp: 3 },
              { name: '행성 관리', command: 'manage_planet', color: 'green', cp: 2 },
              { name: '정찰', command: 'scout', color: 'yellow', cp: 1 },
              { name: '외교', command: 'diplomacy', color: 'pink', cp: 4 },
              { name: '진형 변경', command: 'change_formation', color: 'red', cp: 1 },
              { name: '턴 종료', command: 'turn_end', color: 'gray', cp: 0 },
            ].map((cmd) => (
              <button
                key={cmd.command}
                onClick={() => executeCommand(cmd.command)}
                className={cn(
                  "relative px-4 py-3 rounded-lg font-bold transition-all transform hover:scale-105 shadow-lg border-2",
                  `bg-${cmd.color}-900/50 hover:bg-${cmd.color}-800/50 border-${cmd.color}-500 text-white`
                )}
                disabled={commander.commandPoints < cmd.cp}
                style={{
                   backgroundColor: `var(--tw-bg-opacity, 1) ${cmd.color === 'gray' ? '#374151' : ''}`,
                   borderColor: cmd.color === 'cyan' ? '#06b6d4' : 
                               cmd.color === 'purple' ? '#a855f7' :
                               cmd.color === 'blue' ? '#3b82f6' :
                               cmd.color === 'green' ? '#22c55e' :
                               cmd.color === 'yellow' ? '#eab308' :
                               cmd.color === 'pink' ? '#ec4899' :
                               cmd.color === 'red' ? '#ef4444' : '#6b7280'
                }}
              >
                <div className="text-lg">{cmd.name}</div>
                {cmd.cp > 0 && (
                  <div className="text-xs opacity-70 mt-1">필요 포인트: {cmd.cp}</div>
                )}
              </button>
            ))}
          </div>

          <div className="mt-6 text-sm text-gray-400 text-center border-t border-white/10 pt-4">
            보유 명령 포인트: <span className="text-purple-400 font-bold text-lg ml-2">{commander.commandPoints}</span>
          </div>
        </div>

        {/* Strategic Map */}
        <div className="mt-6 bg-gray-900/50 backdrop-blur-sm rounded-xl p-6 shadow-lg border-2 border-blue-700">
          <h2 className="text-2xl font-bold mb-4 text-blue-400">전략 지도 (100x50 격자)</h2>
          <div className="bg-black/40 rounded-lg overflow-hidden h-[600px] relative">
             <StrategicMap
                sessionId={sessionId}
                onFleetClick={(fleet: any) => {
                  console.log('선택한 함대 정보:', fleet);
                  setSelectedFleet(fleet);
                }}
                onCellClick={(x: number, y: number) => {
                  console.log('선택한 좌표:', x, y);
                  // 선택된 함대가 있으면 이동 명령
                  if (selectedFleet && socket) {

                   socket.emit('fleet:move', {
                     fleetId: selectedFleet.fleetId,
                     x,
                     y,
                   });
                 }
               }}
             />
          </div>
        </div>
      </div>

      {/* Tactical Map (Modal) */}
      {activeTacticalMap && (
        <TacticalMap
          sessionId={sessionId}
          tacticalMapId={activeTacticalMap}
          onClose={() => setActiveTacticalMap(null)}
        />
      )}
    </div>
  );
}
