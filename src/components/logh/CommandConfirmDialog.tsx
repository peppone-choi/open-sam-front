'use client';
 
import { useEffect, useRef } from 'react';
import { Gin7CommandMeta } from '@/types/gin7';
import { Target } from './TargetSelectionModal';


interface CommandConfirmDialogProps {
  isOpen: boolean;
  cardTitle: string;
  command: Gin7CommandMeta;
  target: Target;
  executionTime?: string;
  cpWarning?: { pcp?: number; mcp?: number };
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
  cpWarning,
  onConfirm,
  onCancel,
  faction,
 }: CommandConfirmDialogProps) {
  const dialogRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    if (dialogRef.current) {
      dialogRef.current.focus();
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onCancel();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onCancel]);

  if (!isOpen) return null;
 
  const theme = faction === 'empire'

    ? 'bg-gradient-to-b from-[#1a1a1a] to-[#2a2a2a] border-[#FFD700] text-[#FFD700]'
    : 'bg-gradient-to-b from-[#2F3525] to-[#3a4625] border-[#1E90FF] text-[#E0E0E0]';

  const targetSummary =
    target.type === 'coordinates' && typeof target.gridX === 'number' && typeof target.gridY === 'number'
      ? `Grid (${target.gridX}, ${target.gridY})`
      : target.type === 'fleet' && target.fleetId
      ? `Fleet ${target.fleetId}`
      : target.type === 'system' && target.systemId
      ? `System ${target.systemId}`
      : target.label || 'None';
 
  return (
 
    <div
      className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center pointer-events-auto"
      onClick={onCancel}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="command-confirm-title"
        aria-describedby="command-confirm-description"
        tabIndex={-1}
        className={`w-[400px] border-2 rounded-lg shadow-2xl ${theme} ${
          faction === 'empire' ? 'font-serif' : 'font-mono'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 space-y-4">
          <h3
            id="command-confirm-title"
            className="text-xl font-bold text-center"
          >
            Confirm Command
          </h3>


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
              <span className="font-bold">{targetSummary}</span>
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

          {cpWarning && (cpWarning.pcp || cpWarning.mcp) && (
             <div className="mt-3 p-3 bg-red-900/30 border border-red-500 rounded text-red-300 text-xs">
              ⚠️ CP Substitution Warning
               {cpWarning.pcp && <div>• PCP shortage: {cpWarning.pcp} will be substituted</div>}
               {cpWarning.mcp && <div>• MCP shortage: {cpWarning.mcp} will be substituted</div>}
             </div>
           )}
 
          <div
            id="command-confirm-description"
            className="text-center text-xs opacity-60 pt-3 border-t border-white/20"
          >
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
