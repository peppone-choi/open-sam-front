'use client';

import { Gin7CommandMeta } from '@/types/gin7';
import { Target } from './TargetSelectionModal';

interface CommandConfirmDialogProps {
  isOpen: boolean;
  cardTitle: string;
  command: Gin7CommandMeta;
  target: Target;
  executionTime?: string;
  onConfirm: () => void;
  onCancel: () => void;
  faction: 'empire' | 'alliance';
}

export default function CommandConfirmDialog({
  isOpen,
  cardTitle,
  command,
  target,
  executionTime,
  onConfirm,
  onCancel,
  faction,
}: CommandConfirmDialogProps) {
  if (!isOpen) return null;

  const theme = faction === 'empire'
    ? 'bg-gradient-to-b from-[#1a1a1a] to-[#2a2a2a] border-[#FFD700] text-[#FFD700]'
    : 'bg-gradient-to-b from-[#2F3525] to-[#3a4625] border-[#1E90FF] text-[#E0E0E0]';

  return (
    <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center pointer-events-auto">
      <div
        className={`w-[400px] border-2 rounded-lg shadow-2xl ${theme} ${
          faction === 'empire' ? 'font-serif' : 'font-mono'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 space-y-4">
          <h3 className="text-xl font-bold text-center">Confirm Command</h3>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="opacity-70">Card:</span>
              <span className="font-bold">{cardTitle}</span>
            </div>
            <div className="flex justify-between">
              <span className="opacity-70">Command:</span>
              <span className="font-bold">{command.label}</span>
            </div>
            <div className="flex justify-between">
              <span className="opacity-70">Target:</span>
              <span className="font-bold">{target.label || 'None'}</span>
            </div>
            {command.cpCost && (
              <div className="flex justify-between">
                <span className="opacity-70">Cost:</span>
                <span className="font-bold">
                  {command.cpCost} {command.cpType}
                </span>
              </div>
            )}
            {executionTime && (
              <div className="flex justify-between">
                <span className="opacity-70">Execution:</span>
                <span className="font-bold">{executionTime}</span>
              </div>
            )}
          </div>

          <div className="text-center text-xs opacity-60 pt-3 border-t border-white/20">
            This action cannot be undone
          </div>
        </div>

        <div className="flex gap-3 p-4 border-t border-white/20">
          <button
            onClick={onCancel}
            className="flex-1 py-2 px-4 border border-white/30 rounded hover:bg-white/10 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2 px-4 bg-white/20 border border-white/50 rounded hover:bg-white/30 transition-colors font-bold"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
