'use client';

import { useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useGin7TacticalStore } from '@/stores/gin7TacticalStore';
import { useTacticalSocket } from '@/hooks/useTacticalSocket';
import { useTacticalKeyboard } from '@/hooks/useTacticalKeyboard';
import EnergyPanel from './EnergyPanel';
import CommandPanel from './CommandPanel';
import TacticalRadar from './TacticalRadar';

// Dynamic import for Three.js canvas to avoid SSR issues
const TacticalCanvas = dynamic(() => import('./TacticalCanvas'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[400px] bg-[#030810] rounded-lg flex items-center justify-center">
      <div className="text-white/60 font-mono text-sm animate-pulse">
        전술 뷰 로딩 중...
      </div>
    </div>
  ),
});

// ============================================================
// Battle Status Bar
// ============================================================

function BattleStatusBar() {
  const status = useGin7TacticalStore((s) => s.status);
  const tick = useGin7TacticalStore((s) => s.tick);
  const latency = useGin7TacticalStore((s) => s.latency);
  const participants = useGin7TacticalStore((s) => s.participants);
  const units = useGin7TacticalStore((s) => s.units);
  const myFactionId = useGin7TacticalStore((s) => s.myFactionId);
  
  // Calculate time from ticks (60ms per tick)
  const seconds = Math.floor((tick * 60) / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  const timeString = `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  
  // Unit counts
  const myUnits = units.filter((u) => u.factionId === myFactionId && !u.isDestroyed).length;
  const totalMyShips = units
    .filter((u) => u.factionId === myFactionId && !u.isDestroyed)
    .reduce((sum, u) => sum + u.shipCount, 0);
  
  const enemyUnits = units.filter((u) => u.factionId !== myFactionId && !u.isDestroyed).length;
  const totalEnemyShips = units
    .filter((u) => u.factionId !== myFactionId && !u.isDestroyed)
    .reduce((sum, u) => sum + u.shipCount, 0);
  
  return (
    <div className="flex items-center justify-between px-4 py-2 bg-slate-900/95 backdrop-blur border-b border-slate-700">
      {/* Left: Status and time */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div
            className={`w-3 h-3 rounded-full ${
              status === 'RUNNING'
                ? 'bg-red-500 animate-pulse'
                : status === 'COUNTDOWN'
                ? 'bg-yellow-500 animate-pulse'
                : status === 'ENDED'
                ? 'bg-slate-500'
                : 'bg-blue-500'
            }`}
          />
          <span className="text-sm font-bold text-white uppercase">{status}</span>
        </div>
        <div className="text-lg font-mono font-bold text-white">
          {timeString}
        </div>
        <div className="text-xs text-white/50">
          TICK {tick.toLocaleString()}
        </div>
      </div>
      
      {/* Center: Force comparison */}
      <div className="flex items-center gap-6">
        <div className="text-right">
          <div className="text-xs text-cyan-400/70">아군</div>
          <div className="text-sm font-bold text-cyan-400">
            {myUnits} 함대 / {totalMyShips.toLocaleString()} 척
          </div>
        </div>
        <div className="text-xl font-bold text-white/30">VS</div>
        <div className="text-left">
          <div className="text-xs text-red-400/70">적군</div>
          <div className="text-sm font-bold text-red-400">
            {enemyUnits} 함대 / {totalEnemyShips.toLocaleString()} 척
          </div>
        </div>
      </div>
      
      {/* Right: Network stats */}
      <div className="flex items-center gap-3 text-xs text-white/50">
        <div>지연: <span className={latency > 100 ? 'text-red-400' : 'text-green-400'}>{latency}ms</span></div>
        <div>참가자: {participants.length}</div>
      </div>
    </div>
  );
}

// ============================================================
// Selection Info Panel
// ============================================================

function SelectionInfoPanel() {
  const selectedUnitIds = useGin7TacticalStore((s) => s.selectedUnitIds);
  const getSelectedUnits = useGin7TacticalStore((s) => s.getSelectedUnits);
  
  if (selectedUnitIds.size === 0) return null;
  
  const selectedUnits = getSelectedUnits();
  const totalShips = selectedUnits.reduce((sum, u) => sum + u.shipCount, 0);
  const avgHp = selectedUnits.reduce((sum, u) => sum + u.hp / u.maxHp, 0) / selectedUnits.length;
  const avgMorale = selectedUnits.reduce((sum, u) => sum + u.morale, 0) / selectedUnits.length;
  
  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-slate-900/95 backdrop-blur border border-slate-700 rounded-lg px-4 py-2">
      <div className="flex items-center gap-6 text-sm">
        <div className="text-white/80">
          선택: <span className="font-bold text-white">{selectedUnitIds.size}</span> 함대
        </div>
        <div className="text-white/80">
          총 <span className="font-bold text-cyan-400">{totalShips.toLocaleString()}</span> 척
        </div>
        <div className="flex items-center gap-1">
          <span className="text-white/60">HP</span>
          <div className="w-16 h-2 bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-red-500 to-green-500"
              style={{ width: `${avgHp * 100}%` }}
            />
          </div>
          <span className="text-white/80 text-xs">{Math.round(avgHp * 100)}%</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-white/60">사기</span>
          <div className="w-16 h-2 bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-yellow-500"
              style={{ width: `${avgMorale}%` }}
            />
          </div>
          <span className="text-white/80 text-xs">{Math.round(avgMorale)}%</span>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Shortcut Help Panel
// ============================================================

function ShortcutHelp() {
  const { shortcuts } = useTacticalKeyboard();
  
  return (
    <div className="absolute bottom-4 right-4 bg-slate-900/80 backdrop-blur border border-slate-700 rounded-lg p-3 text-xs">
      <div className="text-white/50 mb-2 font-semibold">단축키</div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1">
        {shortcuts.slice(0, 8).map((s) => (
          <div key={s.key} className="flex items-center gap-2">
            <kbd className="px-1.5 py-0.5 bg-slate-700 rounded text-white/80 font-mono text-[10px]">
              {s.key}
            </kbd>
            <span className="text-white/60">{s.description}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// Main Component
// ============================================================

export interface TacticalBattleViewProps {
  sessionId: string;
  factionId: string;
  commanderId: string;
  battleId?: string;
  className?: string;
}

export default function TacticalBattleView({
  sessionId,
  factionId,
  commanderId,
  battleId,
  className = '',
}: TacticalBattleViewProps) {
  const showEnergyPanel = useGin7TacticalStore((s) => s.showEnergyPanel);
  const showCommandPanel = useGin7TacticalStore((s) => s.showCommandPanel);
  const showRadar = useGin7TacticalStore((s) => s.showRadar);
  const pendingCommands = useGin7TacticalStore((s) => s.pendingCommands);
  const clearPendingCommands = useGin7TacticalStore((s) => s.clearPendingCommands);
  
  // Initialize socket connection
  const { isConnected, joinBattle, sendCommand } = useTacticalSocket({
    sessionId,
    factionId,
    commanderId,
  });
  
  // Initialize keyboard shortcuts
  useTacticalKeyboard();
  
  // Join battle when connected and battleId is provided
  useEffect(() => {
    if (isConnected && battleId) {
      joinBattle(battleId);
    }
  }, [isConnected, battleId, joinBattle]);
  
  // Send pending commands to server
  useEffect(() => {
    if (isConnected && battleId && pendingCommands.length > 0) {
      pendingCommands.forEach((cmd) => {
        sendCommand(battleId, cmd);
      });
      clearPendingCommands();
    }
  }, [isConnected, battleId, pendingCommands, sendCommand, clearPendingCommands]);
  
  return (
    <div className={`flex flex-col h-full bg-[#020408] ${className}`}>
      {/* Top: Status bar */}
      <BattleStatusBar />
      
      {/* Main: Canvas + Panels */}
      <div className="flex-1 relative flex overflow-hidden">
        {/* Left panel */}
        <div className="w-64 flex-shrink-0 p-3 space-y-3 overflow-y-auto border-r border-slate-800">
          {showEnergyPanel && <EnergyPanel />}
          {showCommandPanel && <CommandPanel />}
        </div>
        
        {/* Center: 3D Canvas */}
        <div className="flex-1 relative">
          <TacticalCanvas className="absolute inset-0" />
          <SelectionInfoPanel />
          <ShortcutHelp />
        </div>
        
        {/* Right panel */}
        <div className="w-56 flex-shrink-0 p-3 border-l border-slate-800">
          {showRadar && <TacticalRadar />}
          
          {/* Mini stats */}
          <div className="mt-3 bg-slate-900/50 border border-slate-700 rounded-lg p-2 text-xs text-white/60 space-y-1">
            <div className="flex justify-between">
              <span>연결 상태</span>
              <span className={isConnected ? 'text-green-400' : 'text-red-400'}>
                {isConnected ? '연결됨' : '연결 끊김'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>대기 명령</span>
              <span>{pendingCommands.length}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}













