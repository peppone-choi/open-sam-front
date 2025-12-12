'use client';

import { useCallback, useState } from 'react';
import { useGin7TacticalStore } from '@/stores/gin7TacticalStore';
import type { FormationType } from '@/types/gin7-tactical';

// ============================================================
// Command Button Config
// ============================================================

interface CommandButton {
  id: string;
  label: string;
  shortcut: string;
  icon: string;
  type: 'action' | 'formation' | 'special';
  action?: string;
  formation?: FormationType;
  description: string;
}

const COMMAND_BUTTONS: CommandButton[] = [
  // Actions
  {
    id: 'move',
    label: '이동',
    shortcut: 'F',
    icon: '➡️',
    type: 'action',
    action: 'MOVE',
    description: '우클릭 위치로 이동',
  },
  {
    id: 'attack',
    label: '공격',
    shortcut: 'A',
    icon: '⚔️',
    type: 'action',
    action: 'ATTACK',
    description: '적 유닛 공격',
  },
  {
    id: 'stop',
    label: '정지',
    shortcut: 'S',
    icon: '⏹️',
    type: 'action',
    action: 'STOP',
    description: '현재 위치에서 정지',
  },
  {
    id: 'hold',
    label: '진지 사수',
    shortcut: 'H',
    icon: '🏰',
    type: 'action',
    action: 'HOLD',
    description: '위치 고수하며 방어',
  },
];

const FORMATION_BUTTONS: CommandButton[] = [
  {
    id: 'line',
    label: '종대',
    shortcut: '1',
    icon: '▬',
    type: 'formation',
    formation: 'LINE',
    description: '일렬 종대 진형',
  },
  {
    id: 'wedge',
    label: '쐐기',
    shortcut: '2',
    icon: '▲',
    type: 'formation',
    formation: 'WEDGE',
    description: '쐐기 돌격 진형',
  },
  {
    id: 'circle',
    label: '원형',
    shortcut: '3',
    icon: '●',
    type: 'formation',
    formation: 'CIRCLE',
    description: '원형 방어 진형',
  },
  {
    id: 'spread',
    label: '산개',
    shortcut: '4',
    icon: '⋯',
    type: 'formation',
    formation: 'SPREAD',
    description: '넓게 산개 진형',
  },
  {
    id: 'defensive',
    label: '방어',
    shortcut: '5',
    icon: '🛡️',
    type: 'formation',
    formation: 'DEFENSIVE',
    description: '방어 집중 진형',
  },
  {
    id: 'assault',
    label: '돌격',
    shortcut: '6',
    icon: '⚡',
    type: 'formation',
    formation: 'ASSAULT',
    description: '공격 집중 진형',
  },
];

const SPECIAL_BUTTONS: CommandButton[] = [
  {
    id: 'retreat',
    label: '철수',
    shortcut: 'R',
    icon: '🏃',
    type: 'special',
    action: 'RETREAT',
    description: '전장에서 철수',
  },
  {
    id: 'surrender',
    label: '항복',
    shortcut: 'U',
    icon: '🏳️',
    type: 'special',
    action: 'SURRENDER',
    description: '전투 포기',
  },
];

// ============================================================
// Command Button Component
// ============================================================

interface CommandButtonProps {
  button: CommandButton;
  isActive: boolean;
  disabled: boolean;
  onClick: () => void;
}

function CommandButtonComponent({ button, isActive, disabled, onClick }: CommandButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={`${button.label} (${button.shortcut})\n${button.description}`}
      className={`
        relative flex flex-col items-center justify-center
        w-14 h-14 rounded-lg transition-all duration-150
        border ${isActive ? 'border-cyan-400' : 'border-slate-600'}
        ${
          disabled
            ? 'bg-slate-800/50 text-slate-600 cursor-not-allowed'
            : isActive
            ? 'bg-cyan-900/50 text-cyan-300 shadow-lg shadow-cyan-500/20'
            : 'bg-slate-800 hover:bg-slate-700 text-white/80 hover:text-white'
        }
      `}
    >
      <span className="text-lg">{button.icon}</span>
      <span className="text-[10px] font-medium mt-0.5">{button.label}</span>
      <span
        className={`
          absolute top-0.5 right-0.5 text-[8px] font-mono font-bold
          px-1 rounded ${isActive ? 'bg-cyan-500 text-white' : 'bg-slate-700 text-white/60'}
        `}
      >
        {button.shortcut}
      </span>
    </button>
  );
}

// ============================================================
// Main Component
// ============================================================

export interface CommandPanelProps {
  className?: string;
}

export default function CommandPanel({ className = '' }: CommandPanelProps) {
  const [activeCommand, setActiveCommand] = useState<string | null>(null);
  const [activeFormation, setActiveFormation] = useState<FormationType>('LINE');
  
  const selectedUnitIds = useGin7TacticalStore((s) => s.selectedUnitIds);
  const queueCommand = useGin7TacticalStore((s) => s.queueCommand);
  const status = useGin7TacticalStore((s) => s.status);
  
  const hasSelection = selectedUnitIds.size > 0;
  const isInBattle = status === 'RUNNING';
  
  const handleCommand = useCallback(
    (button: CommandButton) => {
      if (!hasSelection) return;
      
      if (button.type === 'formation' && button.formation) {
        setActiveFormation(button.formation);
        queueCommand({
          type: 'FORMATION',
          unitIds: Array.from(selectedUnitIds),
          timestamp: Date.now(),
          data: {
            formation: button.formation,
          },
        });
      } else if (button.action === 'STOP') {
        queueCommand({
          type: 'STOP',
          unitIds: Array.from(selectedUnitIds),
          timestamp: Date.now(),
          data: {
            holdPosition: button.id === 'hold',
          },
        });
      } else if (button.action === 'RETREAT') {
        queueCommand({
          type: 'RETREAT',
          unitIds: Array.from(selectedUnitIds),
          timestamp: Date.now(),
          data: {},
        });
      } else if (button.action === 'SURRENDER') {
        if (window.confirm('정말 항복하시겠습니까?')) {
          queueCommand({
            type: 'SURRENDER',
            unitIds: Array.from(selectedUnitIds),
            timestamp: Date.now(),
            data: {},
          });
        }
      } else {
        // MOVE / ATTACK - set active command mode
        setActiveCommand(activeCommand === button.id ? null : button.id);
      }
    },
    [hasSelection, selectedUnitIds, queueCommand, activeCommand]
  );
  
  return (
    <div className={`bg-slate-900/95 backdrop-blur border border-slate-700 rounded-xl p-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isInBattle ? 'bg-red-500 animate-pulse' : 'bg-slate-500'}`} />
          <h3 className="text-sm font-bold text-white">명령 패널</h3>
        </div>
        <div className="text-xs text-white/50">
          선택: {selectedUnitIds.size} 유닛
        </div>
      </div>
      
      {/* Action Commands */}
      <div className="mb-4">
        <div className="text-[10px] text-white/50 mb-2 uppercase tracking-wide">기본 명령</div>
        <div className="flex gap-2 flex-wrap">
          {COMMAND_BUTTONS.map((btn) => (
            <CommandButtonComponent
              key={btn.id}
              button={btn}
              isActive={activeCommand === btn.id}
              disabled={!hasSelection}
              onClick={() => handleCommand(btn)}
            />
          ))}
        </div>
      </div>
      
      {/* Formation Commands */}
      <div className="mb-4">
        <div className="text-[10px] text-white/50 mb-2 uppercase tracking-wide">진형</div>
        <div className="flex gap-2 flex-wrap">
          {FORMATION_BUTTONS.map((btn) => (
            <CommandButtonComponent
              key={btn.id}
              button={btn}
              isActive={btn.formation === activeFormation}
              disabled={!hasSelection}
              onClick={() => handleCommand(btn)}
            />
          ))}
        </div>
      </div>
      
      {/* Special Commands */}
      <div>
        <div className="text-[10px] text-white/50 mb-2 uppercase tracking-wide">특수 명령</div>
        <div className="flex gap-2">
          {SPECIAL_BUTTONS.map((btn) => (
            <CommandButtonComponent
              key={btn.id}
              button={btn}
              isActive={false}
              disabled={!hasSelection || !isInBattle}
              onClick={() => handleCommand(btn)}
            />
          ))}
        </div>
      </div>
      
      {/* Active command hint */}
      {activeCommand && (
        <div className="mt-3 p-2 bg-cyan-900/30 border border-cyan-700 rounded-lg text-xs text-cyan-300">
          <span className="font-bold">{activeCommand.toUpperCase()}</span> 모드 - 
          {activeCommand === 'move' && ' 지도에서 이동할 위치를 우클릭하세요'}
          {activeCommand === 'attack' && ' 공격할 적 유닛을 클릭하세요'}
        </div>
      )}
    </div>
  );
}















