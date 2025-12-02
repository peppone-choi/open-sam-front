'use client';

/**
 * CommandPanel.tsx
 * 명령 패널 컴포넌트
 * 
 * 기능:
 * - 이동, 공격, 진형 변경, 후퇴 명령
 * - 키보드 단축키 표시
 * - 진형 선택 UI
 * - 명령 모드 표시
 */

import React, { useState, useCallback } from 'react';
import {
  Fleet,
  CommandType,
  Formation,
  COMMAND_INFO,
  FORMATION_NAMES,
  FORMATION_DESCRIPTIONS,
  FACTION_COLORS,
} from './types';

interface CommandPanelProps {
  selectedFleets: Fleet[];
  commandMode: CommandType | null;
  onCommand: (command: CommandType, data?: any) => void;
  onCancelCommand: () => void;
}

// ===== 명령 버튼 =====
function CommandButton({
  command,
  isActive,
  isDisabled,
  onClick,
}: {
  command: CommandType;
  isActive: boolean;
  isDisabled: boolean;
  onClick: () => void;
}) {
  const info = COMMAND_INFO[command];
  
  const getIcon = () => {
    switch (command) {
      case 'move':
        return '🎯';
      case 'parallelMove':
        return '↔️';
      case 'turn':
        return '🔄';
      case 'stop':
        return '⏹️';
      case 'attack':
        return '⚔️';
      case 'volleyAttack':
        return '💥';
      case 'continuousAttack':
        return '🔥';
      case 'stopAttack':
        return '🛑';
      case 'changeFormation':
        return '📐';
      case 'retreat':
        return '🏃';
      default:
        return '⚡';
    }
  };
  
  const getColor = () => {
    if (isDisabled) return 'text-gray-600 border-gray-700 bg-gray-900/50';
    if (isActive) return 'text-cyan-400 border-cyan-500 bg-cyan-500/20 shadow-lg shadow-cyan-500/30';
    
    switch (command) {
      case 'attack':
      case 'volleyAttack':
      case 'continuousAttack':
        return 'text-red-400 border-red-500/50 hover:bg-red-500/20 hover:border-red-500';
      case 'retreat':
        return 'text-yellow-400 border-yellow-500/50 hover:bg-yellow-500/20 hover:border-yellow-500';
      case 'stopAttack':
      case 'stop':
        return 'text-orange-400 border-orange-500/50 hover:bg-orange-500/20 hover:border-orange-500';
      default:
        return 'text-cyan-400 border-cyan-500/50 hover:bg-cyan-500/20 hover:border-cyan-500';
    }
  };
  
  return (
    <button
      onClick={onClick}
      disabled={isDisabled}
      className={`
        w-full p-2 rounded-lg border transition-all
        flex items-center gap-3
        ${getColor()}
        ${isDisabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
      `}
    >
      <span className="text-xl">{getIcon()}</span>
      <div className="flex-1 text-left">
        <div className="text-sm font-medium">{info.name}</div>
        <div className="text-xs opacity-60">{info.description}</div>
      </div>
      <kbd className="px-2 py-0.5 bg-gray-800 text-gray-400 text-xs rounded font-mono border border-gray-700">
        {info.shortcut}
      </kbd>
    </button>
  );
}

// ===== 진형 선택 모달 =====
function FormationSelector({
  currentFormation,
  onSelect,
  onClose,
}: {
  currentFormation?: Formation;
  onSelect: (formation: Formation) => void;
  onClose: () => void;
}) {
  const formations: Formation[] = [
    'fishScale',
    'craneWing',
    'circular',
    'arrowhead',
    'longSnake',
  ];
  
  const getIcon = (formation: Formation) => {
    switch (formation) {
      case 'fishScale':
        return '▲';
      case 'craneWing':
        return '◁▷';
      case 'circular':
        return '●';
      case 'arrowhead':
        return '➤';
      case 'longSnake':
        return '═══';
      default:
        return '◆';
    }
  };
  
  return (
    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-10">
      <div className="bg-[#0a0a2a] border border-cyan-500/50 rounded-lg p-4 w-full max-w-xs shadow-xl shadow-cyan-500/20">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-cyan-400 font-bold">진형 선택</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>
        
        <div className="space-y-2">
          {formations.map((formation) => (
            <button
              key={formation}
              onClick={() => {
                onSelect(formation);
                onClose();
              }}
              className={`
                w-full p-3 rounded-lg border transition-all
                flex items-center gap-3
                ${
                  currentFormation === formation
                    ? 'border-cyan-500 bg-cyan-500/20 text-cyan-400'
                    : 'border-gray-700 hover:border-cyan-500/50 hover:bg-cyan-500/10 text-gray-300'
                }
              `}
            >
              <span className="text-2xl font-bold w-12 text-center">
                {getIcon(formation)}
              </span>
              <div className="flex-1 text-left">
                <div className="font-medium">{FORMATION_NAMES[formation]}</div>
                <div className="text-xs text-gray-500">
                  {FORMATION_DESCRIPTIONS[formation]}
                </div>
              </div>
              {currentFormation === formation && (
                <span className="text-cyan-400">✓</span>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ===== 명령 모드 표시 =====
function CommandModeIndicator({
  mode,
  onCancel,
}: {
  mode: CommandType;
  onCancel: () => void;
}) {
  const info = COMMAND_INFO[mode];
  
  return (
    <div className="bg-cyan-500/20 border border-cyan-500 rounded-lg p-3 mb-4 animate-pulse">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-cyan-400 font-bold text-sm">명령 모드 활성화</div>
          <div className="text-cyan-300 text-xs mt-1">
            {mode === 'move' && '맵에서 이동할 위치를 클릭하세요'}
            {mode === 'attack' && '공격할 적 함대를 클릭하세요'}
          </div>
        </div>
        <button
          onClick={onCancel}
          className="text-gray-400 hover:text-white text-xs px-2 py-1 border border-gray-600 rounded"
        >
          취소 (ESC)
        </button>
      </div>
    </div>
  );
}

// ===== 선택된 함대 요약 =====
function SelectedFleetsSummary({ fleets }: { fleets: Fleet[] }) {
  if (fleets.length === 0) return null;
  
  const totalShips = fleets.reduce((sum, f) => sum + f.totalShips, 0);
  const avgMorale = Math.round(
    fleets.reduce((sum, f) => sum + f.morale, 0) / fleets.length
  );
  
  return (
    <div className="bg-[#0a0a2a] border border-gray-700 rounded-lg p-3 mb-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-cyan-400 text-sm font-mono">SELECTED</span>
        <span className="text-gray-400 text-xs">{fleets.length} 함대</span>
      </div>
      
      <div className="flex flex-wrap gap-1 mb-2">
        {fleets.slice(0, 5).map((fleet) => (
          <div
            key={fleet.id}
            className="flex items-center gap-1 px-2 py-0.5 bg-gray-800 rounded text-xs"
          >
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: FACTION_COLORS[fleet.faction] }}
            />
            <span className="text-gray-300">{fleet.name.substring(0, 6)}</span>
          </div>
        ))}
        {fleets.length > 5 && (
          <span className="text-gray-500 text-xs px-2 py-0.5">
            +{fleets.length - 5}
          </span>
        )}
      </div>
      
      <div className="flex justify-between text-xs">
        <span className="text-gray-500">
          함선: <span className="text-cyan-400">{totalShips.toLocaleString()}</span>
        </span>
        <span className="text-gray-500">
          평균 사기: <span className="text-yellow-400">{avgMorale}%</span>
        </span>
      </div>
    </div>
  );
}

// ===== 메인 컴포넌트 =====
export function CommandPanel({
  selectedFleets,
  commandMode,
  onCommand,
  onCancelCommand,
}: CommandPanelProps) {
  const [showFormationSelector, setShowFormationSelector] = useState(false);
  
  const isDisabled = selectedFleets.length === 0;
  const currentFormation =
    selectedFleets.length > 0 ? selectedFleets[0].formation : undefined;
  
  const handleFormationChange = useCallback(
    (formation: Formation) => {
      onCommand('changeFormation', { formation });
    },
    [onCommand]
  );
  
  // 명령 그룹
  const movementCommands: CommandType[] = ['move', 'parallelMove', 'turn', 'stop'];
  const attackCommands: CommandType[] = [
    'attack',
    'volleyAttack',
    'continuousAttack',
    'stopAttack',
  ];
  const otherCommands: CommandType[] = ['changeFormation', 'retreat'];
  
  return (
    <div className="h-full flex flex-col relative">
      {/* 헤더 */}
      <div className="p-3 border-b border-cyan-500/20">
        <div className="text-cyan-400 font-mono text-sm tracking-wider">
          COMMAND PANEL
        </div>
      </div>
      
      {/* 컨텐츠 */}
      <div className="flex-1 overflow-y-auto p-3">
        {/* 명령 모드 표시 */}
        {commandMode && (
          <CommandModeIndicator mode={commandMode} onCancel={onCancelCommand} />
        )}
        
        {/* 선택된 함대 요약 */}
        <SelectedFleetsSummary fleets={selectedFleets} />
        
        {/* 이동 명령 */}
        <div className="mb-4">
          <div className="text-gray-500 text-xs mb-2 font-mono">MOVEMENT</div>
          <div className="space-y-2">
            {movementCommands.map((cmd) => (
              <CommandButton
                key={cmd}
                command={cmd}
                isActive={commandMode === cmd}
                isDisabled={isDisabled}
                onClick={() => onCommand(cmd)}
              />
            ))}
          </div>
        </div>
        
        {/* 공격 명령 */}
        <div className="mb-4">
          <div className="text-gray-500 text-xs mb-2 font-mono">ATTACK</div>
          <div className="space-y-2">
            {attackCommands.map((cmd) => (
              <CommandButton
                key={cmd}
                command={cmd}
                isActive={commandMode === cmd}
                isDisabled={isDisabled}
                onClick={() => onCommand(cmd)}
              />
            ))}
          </div>
        </div>
        
        {/* 기타 명령 */}
        <div className="mb-4">
          <div className="text-gray-500 text-xs mb-2 font-mono">TACTICAL</div>
          <div className="space-y-2">
            <CommandButton
              command="changeFormation"
              isActive={showFormationSelector}
              isDisabled={isDisabled}
              onClick={() => setShowFormationSelector(true)}
            />
            <CommandButton
              command="retreat"
              isActive={false}
              isDisabled={isDisabled}
              onClick={() => onCommand('retreat')}
            />
          </div>
        </div>
        
        {/* 빠른 진형 변경 */}
        {!isDisabled && currentFormation && (
          <div className="mt-4 p-3 bg-[#0a0a2a] border border-gray-700 rounded-lg">
            <div className="text-gray-500 text-xs mb-2 font-mono">
              CURRENT FORMATION
            </div>
            <div className="text-yellow-400 font-medium">
              {FORMATION_NAMES[currentFormation]}
            </div>
            <div className="text-gray-500 text-xs mt-1">
              {FORMATION_DESCRIPTIONS[currentFormation]}
            </div>
          </div>
        )}
      </div>
      
      {/* 하단 힌트 */}
      <div className="p-3 border-t border-gray-700 bg-[#0a0a1a]">
        <div className="text-gray-600 text-xs">
          <div>💡 우클릭으로 빠른 이동</div>
          <div className="mt-1">💡 더블클릭으로 기함 부대 전체 선택</div>
        </div>
      </div>
      
      {/* 진형 선택 모달 */}
      {showFormationSelector && (
        <FormationSelector
          currentFormation={currentFormation}
          onSelect={handleFormationChange}
          onClose={() => setShowFormationSelector(false)}
        />
      )}
    </div>
  );
}




