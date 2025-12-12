'use client';

/**
 * CommandQueuePanel.tsx
 * 명령 대기열 패널 컴포넌트
 * 
 * 기능:
 * - 대기 중인 명령 목록 표시
 * - 각 명령의 진행률 바 표시
 * - 명령 취소 기능
 * - 전자전 상태 표시
 * 
 * @module gin7-command-delay
 */

import React, { useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// 타입 정의
interface DelayBreakdown {
  baseDelay: number;
  distancePenalty: number;
  jammingPenalty: number;
  commanderSkillBonus: number;
  totalDelay: number;
}

interface QueuedCommand {
  id: string;
  commandType: string;
  unitIds: string[];
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'EMERGENCY';
  status: 'QUEUED' | 'EXECUTING' | 'COMPLETED' | 'CANCELLED' | 'FAILED';
  issueTime: number;
  executeTime: number;
  remainingTicks: number;
  remainingSeconds: number;
  progress: number;
  delayBreakdown: DelayBreakdown;
  cancellable: boolean;
}

type JammingLevel = 'CLEAR' | 'INTERFERENCE' | 'HEAVY' | 'BLACKOUT';

interface CommandQueuePanelProps {
  commands: QueuedCommand[];
  jammingLevel: JammingLevel;
  minovskyDensity?: number;
  onCancelCommand?: (commandId: string) => void;
  isLoading?: boolean;
}

// 명령 타입별 아이콘
const COMMAND_ICONS: Record<string, string> = {
  MOVE: '🎯',
  ATTACK: '⚔️',
  STOP: '⏹️',
  FORMATION: '📐',
  ENERGY_DISTRIBUTION: '⚡',
  RETREAT: '🏃',
  SURRENDER: '🏳️',
  REPAIR: '🔧',
  CHANGE_FORMATION: '📐',
  PARALLEL_MOVE: '↔️',
  TURN_180: '🔄',
};

// 명령 타입별 한글명
const COMMAND_NAMES: Record<string, string> = {
  MOVE: '이동',
  ATTACK: '공격',
  STOP: '정지',
  FORMATION: '진형 변경',
  ENERGY_DISTRIBUTION: '에너지 분배',
  RETREAT: '후퇴',
  SURRENDER: '항복',
  REPAIR: '수리',
  CHANGE_FORMATION: '진형 변경',
  PARALLEL_MOVE: '측면 이동',
  TURN_180: '180도 회전',
};

// 우선순위별 색상
const PRIORITY_COLORS: Record<string, string> = {
  LOW: 'text-gray-400 border-gray-500',
  NORMAL: 'text-cyan-400 border-cyan-500',
  HIGH: 'text-yellow-400 border-yellow-500',
  EMERGENCY: 'text-red-400 border-red-500',
};

// 재밍 레벨별 스타일
const JAMMING_STYLES: Record<JammingLevel, { color: string; bg: string; label: string; icon: string }> = {
  CLEAR: {
    color: 'text-green-400',
    bg: 'bg-green-500/20 border-green-500/50',
    label: '통신 정상',
    icon: '📡',
  },
  INTERFERENCE: {
    color: 'text-yellow-400',
    bg: 'bg-yellow-500/20 border-yellow-500/50',
    label: '통신 간섭',
    icon: '📶',
  },
  HEAVY: {
    color: 'text-orange-400',
    bg: 'bg-orange-500/20 border-orange-500/50',
    label: '심한 방해',
    icon: '⚠️',
  },
  BLACKOUT: {
    color: 'text-red-400',
    bg: 'bg-red-500/20 border-red-500/50',
    label: '통신 두절',
    icon: '🚫',
  },
};

// ===== 진행률 바 컴포넌트 =====
function ProgressBar({
  progress,
  remainingSeconds,
  priority,
}: {
  progress: number;
  remainingSeconds: number;
  priority: string;
}) {
  const getBarColor = () => {
    switch (priority) {
      case 'EMERGENCY':
        return 'bg-red-500';
      case 'HIGH':
        return 'bg-yellow-500';
      case 'LOW':
        return 'bg-gray-500';
      default:
        return 'bg-cyan-500';
    }
  };

  return (
    <div className="mt-2">
      <div className="flex justify-between text-xs mb-1">
        <span className="text-gray-500">준비 중...</span>
        <span className="text-cyan-400 font-mono">{remainingSeconds}초</span>
      </div>
      <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
        <motion.div
          className={`h-full ${getBarColor()} rounded-full`}
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>
    </div>
  );
}

// ===== 개별 명령 카드 =====
function CommandCard({
  command,
  onCancel,
}: {
  command: QueuedCommand;
  onCancel?: () => void;
}) {
  const icon = COMMAND_ICONS[command.commandType] || '⚡';
  const name = COMMAND_NAMES[command.commandType] || command.commandType;
  const priorityStyle = PRIORITY_COLORS[command.priority] || PRIORITY_COLORS.NORMAL;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className={`
        p-3 rounded-lg border transition-all
        bg-[#0a0a2a]/80 hover:bg-[#0a0a2a]
        ${priorityStyle.split(' ')[1]}/30
      `}
    >
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">{icon}</span>
          <div>
            <div className={`font-medium ${priorityStyle.split(' ')[0]}`}>
              {name}
            </div>
            <div className="text-xs text-gray-500">
              {command.unitIds.length}개 유닛
            </div>
          </div>
        </div>

        {/* 우선순위 뱃지 */}
        <div className="flex items-center gap-2">
          <span
            className={`
              text-xs px-2 py-0.5 rounded border
              ${priorityStyle}
            `}
          >
            {command.priority}
          </span>
          
          {/* 취소 버튼 */}
          {command.cancellable && onCancel && (
            <button
              onClick={onCancel}
              className="text-gray-500 hover:text-red-400 transition-colors p-1"
              title="명령 취소"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* 진행률 바 */}
      {command.status === 'QUEUED' && (
        <ProgressBar
          progress={command.progress}
          remainingSeconds={command.remainingSeconds}
          priority={command.priority}
        />
      )}

      {/* 지연 상세 (접기/펼치기 가능) */}
      {command.delayBreakdown && (
        <details className="mt-2">
          <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-400">
            지연 상세 보기
          </summary>
          <div className="mt-1 text-xs text-gray-500 space-y-1 pl-2 border-l border-gray-700">
            <div>기본 지연: {Math.ceil(command.delayBreakdown.baseDelay / 16)}초</div>
            {command.delayBreakdown.distancePenalty > 0 && (
              <div className="text-orange-400">
                +거리 패널티: {Math.ceil(command.delayBreakdown.distancePenalty / 16)}초
              </div>
            )}
            {command.delayBreakdown.jammingPenalty > 0 && (
              <div className="text-red-400">
                +전자전 방해: {Math.ceil(command.delayBreakdown.jammingPenalty / 16)}초
              </div>
            )}
            {command.delayBreakdown.commanderSkillBonus > 0 && (
              <div className="text-green-400">
                -지휘관 보너스: {Math.ceil(command.delayBreakdown.commanderSkillBonus / 16)}초
              </div>
            )}
          </div>
        </details>
      )}
    </motion.div>
  );
}

// ===== 전자전 상태 표시 =====
function JammingStatus({
  level,
  density,
}: {
  level: JammingLevel;
  density?: number;
}) {
  const style = JAMMING_STYLES[level];

  return (
    <div className={`p-3 rounded-lg border ${style.bg}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">{style.icon}</span>
          <div>
            <div className={`font-medium ${style.color}`}>{style.label}</div>
            <div className="text-xs text-gray-500">전자전 상태</div>
          </div>
        </div>
        
        {density !== undefined && (
          <div className="text-right">
            <div className="text-sm font-mono text-gray-400">
              {Math.round(density)}%
            </div>
            <div className="text-xs text-gray-600">미노프스키 농도</div>
          </div>
        )}
      </div>

      {/* 미노프스키 농도 바 */}
      {density !== undefined && (
        <div className="mt-2">
          <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
            <motion.div
              className={`h-full ${
                density >= 75
                  ? 'bg-red-500'
                  : density >= 50
                  ? 'bg-orange-500'
                  : density >= 25
                  ? 'bg-yellow-500'
                  : 'bg-green-500'
              }`}
              style={{ width: `${density}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>
      )}

      {/* 경고 메시지 */}
      {level === 'BLACKOUT' && (
        <motion.div
          className="mt-2 text-xs text-red-400 flex items-center gap-1"
          animate={{ opacity: [1, 0.5, 1] }}
          transition={{ repeat: Infinity, duration: 1 }}
        >
          ⚠️ 명령 전송 불가
        </motion.div>
      )}
    </div>
  );
}

// ===== 빈 상태 표시 =====
function EmptyQueue() {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-gray-500">
      <span className="text-4xl mb-2">📋</span>
      <div className="text-sm">대기 중인 명령 없음</div>
      <div className="text-xs text-gray-600 mt-1">
        명령을 내리면 여기에 표시됩니다
      </div>
    </div>
  );
}

// ===== 메인 컴포넌트 =====
export function CommandQueuePanel({
  commands,
  jammingLevel,
  minovskyDensity,
  onCancelCommand,
  isLoading,
}: CommandQueuePanelProps) {
  const queuedCommands = useMemo(
    () => commands.filter((cmd) => cmd.status === 'QUEUED'),
    [commands]
  );

  const handleCancel = useCallback(
    (commandId: string) => {
      if (onCancelCommand) {
        onCancelCommand(commandId);
      }
    },
    [onCancelCommand]
  );

  return (
    <div className="h-full flex flex-col bg-[#050510]/95 backdrop-blur-sm">
      {/* 헤더 */}
      <div className="p-3 border-b border-cyan-500/20">
        <div className="flex items-center justify-between">
          <div className="text-cyan-400 font-mono text-sm tracking-wider">
            COMMAND QUEUE
          </div>
          <div className="text-gray-500 text-xs">
            {queuedCommands.length}개 대기 중
          </div>
        </div>
      </div>

      {/* 전자전 상태 */}
      <div className="p-3 border-b border-gray-700/50">
        <JammingStatus level={jammingLevel} density={minovskyDensity} />
      </div>

      {/* 명령 목록 */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <motion.div
              className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full"
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
            />
          </div>
        ) : queuedCommands.length === 0 ? (
          <EmptyQueue />
        ) : (
          <AnimatePresence>
            {queuedCommands.map((cmd) => (
              <CommandCard
                key={cmd.id}
                command={cmd}
                onCancel={
                  cmd.cancellable ? () => handleCancel(cmd.id) : undefined
                }
              />
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* 하단 힌트 */}
      <div className="p-3 border-t border-gray-700/50 bg-[#050510]">
        <div className="text-gray-600 text-xs space-y-1">
          <div>💡 높은 우선순위 명령은 더 빨리 실행됩니다</div>
          <div>💡 전자전 방해 시 지연이 증가합니다</div>
        </div>
      </div>
    </div>
  );
}

export default CommandQueuePanel;















