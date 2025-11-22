'use client';

import { JobCard as JobCardType, CommandType } from '@/types/logh';
import { useState } from 'react';

interface JobCardProps {
  card: JobCardType;
  faction: 'empire' | 'alliance';
  isActive: boolean;
  onSelect: () => void;
  onCommand: (cmd: CommandType) => void;
}

function WarpRiskBadge() {
  return (
    <div className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full border border-white shadow-lg animate-pulse">
      ⚠️ WARP RISK
    </div>
  );
}

export default function JobCard({ card, faction, isActive, onSelect, onCommand }: JobCardProps) {
  // Empire: Gold/Silver, Serif. Alliance: Olive/Blue, Sans.
  const theme = faction === 'empire' 
    ? 'bg-gradient-to-b from-[#1a1a1a] to-[#333] border-[#FFD700] font-serif text-[#FFD700]' 
    : 'bg-gradient-to-b from-[#2F3525] to-[#4A5D23] border-[#1E90FF] font-mono text-[#E0E0E0]';

  const hasWarp = card.commands.includes('warp');

  return (
    <div 
      onClick={!isActive ? onSelect : undefined}
      className={`
        relative w-64 transition-all duration-300 border-2 rounded-t-lg shadow-xl cursor-pointer
        ${theme}
        ${isActive ? 'h-96 translate-y-0' : 'h-12 translate-y-2 hover:translate-y-0'}
      `}
    >
      {hasWarp && isActive && <WarpRiskBadge />}
      
      {/* Header */}
      <div className="flex items-center justify-between p-2 border-b border-white/20">
        <span className="font-bold truncate text-sm">{card.title}</span>
        <span className="text-xs opacity-70">{card.rankReq}</span>
      </div>

      {/* Body (Commands) - Only visible when active */}
      {isActive && (
        <div className="p-4 grid grid-cols-2 gap-3 overflow-y-auto max-h-[calc(100%-3rem)]">
          {card.commands.map((cmd) => (
            <button
              key={cmd}
              onClick={(e) => { e.stopPropagation(); onCommand(cmd); }}
              className="p-2 border border-white/30 rounded hover:bg-white/10 text-xs uppercase tracking-wider flex flex-col items-center gap-1 transition-colors"
            >
              <span className="text-xl">
                {cmd === 'warp' && '🚀'}
                {cmd === 'move' && '➡'}
                {cmd === 'attack' && '⚔️'}
                {cmd === 'supply' && '📦'}
              </span>
              {cmd}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
