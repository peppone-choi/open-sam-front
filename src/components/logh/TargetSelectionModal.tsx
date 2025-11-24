'use client';

import { useState, useEffect } from 'react';
import { CommandType } from '@/types/logh';
import { Gin7CommandMeta } from '@/types/gin7';

export interface Target {
  type: 'coordinates' | 'fleet' | 'system' | 'none';
  gridX?: number;
  gridY?: number;
  fleetId?: string;
  systemId?: string;
  label?: string;
}

interface TargetSelectionModalProps {
  isOpen: boolean;
  command: CommandType;
  commandMeta: Gin7CommandMeta;
  cardTitle: string;
  onConfirm: (target: Target) => void;
  onCancel: () => void;
  cpWarning?: { pcp?: number; mcp?: number };
  faction: 'empire' | 'alliance';
}

export default function TargetSelectionModal({
  isOpen,
  command,
  commandMeta,
  cardTitle,
  onConfirm,
  onCancel,
  cpWarning,
  faction,
}: TargetSelectionModalProps) {
  const [targetType, setTargetType] = useState<'coordinates' | 'fleet' | 'system'>('coordinates');
  const [gridX, setGridX] = useState<string>('0');
  const [gridY, setGridY] = useState<string>('0');
  const [fleetId, setFleetId] = useState<string>('');
  const [systemId, setSystemId] = useState<string>('');

  useEffect(() => {
    if (!isOpen) {
      setGridX('0');
      setGridY('0');
      setFleetId('');
      setSystemId('');
      setTargetType('coordinates');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const theme = faction === 'empire'
    ? 'bg-gradient-to-b from-[#1a1a1a] to-[#2a2a2a] border-[#FFD700] text-[#FFD700]'
    : 'bg-gradient-to-b from-[#2F3525] to-[#3a4625] border-[#1E90FF] text-[#E0E0E0]';

  const handleConfirm = () => {
    let target: Target;

    if (targetType === 'coordinates') {
      const x = parseInt(gridX, 10);
      const y = parseInt(gridY, 10);
      if (isNaN(x) || isNaN(y)) {
        alert('Invalid coordinates');
        return;
      }
      target = { type: 'coordinates', gridX: x, gridY: y, label: `Grid (${x}, ${y})` };
    } else if (targetType === 'fleet') {
      if (!fleetId.trim()) {
        alert('Fleet ID required');
        return;
      }
      target = { type: 'fleet', fleetId: fleetId.trim(), label: `Fleet ${fleetId}` };
    } else if (targetType === 'system') {
      if (!systemId.trim()) {
        alert('System ID required');
        return;
      }
      target = { type: 'system', systemId: systemId.trim(), label: `System ${systemId}` };
    } else {
      target = { type: 'none' };
    }

    onConfirm(target);
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center pointer-events-auto">
      <div
        className={`w-[500px] border-2 rounded-lg shadow-2xl ${theme} ${
          faction === 'empire' ? 'font-serif' : 'font-mono'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/20">
          <h3 className="text-lg font-bold">Target Selection</h3>
          <button onClick={onCancel} className="text-2xl leading-none hover:opacity-70">
            ×
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {/* Command Info */}
          <div className="p-3 bg-black/30 rounded border border-white/10">
            <div className="text-sm opacity-70">Card: {cardTitle}</div>
            <div className="font-bold text-base mt-1">
              Command: {commandMeta.label || command}
            </div>
            {commandMeta.cpCost && (
              <div className="text-xs opacity-70 mt-1">
                Cost: {commandMeta.cpCost} {commandMeta.cpType}
              </div>
            )}
          </div>

          {/* CP Warning */}
          {cpWarning && (cpWarning.pcp || cpWarning.mcp) && (
            <div className="p-3 bg-red-900/30 border border-red-500 rounded text-red-300 text-sm">
              ⚠️ CP Substitution Warning
              {cpWarning.pcp && <div>• PCP shortage: {cpWarning.pcp} will be substituted</div>}
              {cpWarning.mcp && <div>• MCP shortage: {cpWarning.mcp} will be substituted</div>}
            </div>
          )}

          {/* Target Type Selection */}
          <div>
            <label className="block text-sm font-bold mb-2">Target Type</label>
            <div className="flex gap-2">
              <button
                onClick={() => setTargetType('coordinates')}
                className={`flex-1 py-2 px-3 border rounded text-sm transition-colors ${
                  targetType === 'coordinates'
                    ? 'bg-white/20 border-white/50'
                    : 'bg-white/5 border-white/20 hover:bg-white/10'
                }`}
              >
                Coordinates
              </button>
              <button
                onClick={() => setTargetType('fleet')}
                className={`flex-1 py-2 px-3 border rounded text-sm transition-colors ${
                  targetType === 'fleet'
                    ? 'bg-white/20 border-white/50'
                    : 'bg-white/5 border-white/20 hover:bg-white/10'
                }`}
              >
                Fleet
              </button>
              <button
                onClick={() => setTargetType('system')}
                className={`flex-1 py-2 px-3 border rounded text-sm transition-colors ${
                  targetType === 'system'
                    ? 'bg-white/20 border-white/50'
                    : 'bg-white/5 border-white/20 hover:bg-white/10'
                }`}
              >
                System
              </button>
            </div>
          </div>

          {/* Target Input */}
          {targetType === 'coordinates' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold mb-1">Grid X</label>
                <input
                  type="number"
                  value={gridX}
                  onChange={(e) => setGridX(e.target.value)}
                  className="w-full px-3 py-2 bg-black/30 border border-white/30 rounded text-white focus:outline-none focus:border-white/50"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1">Grid Y</label>
                <input
                  type="number"
                  value={gridY}
                  onChange={(e) => setGridY(e.target.value)}
                  className="w-full px-3 py-2 bg-black/30 border border-white/30 rounded text-white focus:outline-none focus:border-white/50"
                  placeholder="0"
                />
              </div>
            </div>
          )}

          {targetType === 'fleet' && (
            <div>
              <label className="block text-xs font-bold mb-1">Fleet ID</label>
              <input
                type="text"
                value={fleetId}
                onChange={(e) => setFleetId(e.target.value)}
                className="w-full px-3 py-2 bg-black/30 border border-white/30 rounded text-white focus:outline-none focus:border-white/50"
                placeholder="Enter fleet ID"
              />
            </div>
          )}

          {targetType === 'system' && (
            <div>
              <label className="block text-xs font-bold mb-1">System ID</label>
              <input
                type="text"
                value={systemId}
                onChange={(e) => setSystemId(e.target.value)}
                className="w-full px-3 py-2 bg-black/30 border border-white/30 rounded text-white focus:outline-none focus:border-white/50"
                placeholder="Enter system ID"
              />
            </div>
          )}

          {/* Manual Reference */}
          <div className="text-xs opacity-50 pt-2 border-t border-white/10">
            gin7manual.txt P.26: Max 16 cards per character
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-4 border-t border-white/20">
          <button
            onClick={onCancel}
            className="flex-1 py-2 px-4 border border-white/30 rounded hover:bg-white/10 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 py-2 px-4 bg-white/20 border border-white/50 rounded hover:bg-white/30 transition-colors font-bold"
          >
            Execute Command
          </button>
        </div>
      </div>
    </div>
  );
}
