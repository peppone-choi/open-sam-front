'use client';

import React from 'react';
import { TurnObj } from '@/lib/api/sammo';
import { format, addMinutes } from 'date-fns';

interface ChiefTopItemProps {
  officer: {
    name: string;
    officerLevelText: string;
    npcType: number;
    turn: TurnObj[];
    turnTime: string;
  };
  maxTurn: number;
  turnTerm: number;
  onSelect: () => void;
  style?: React.CSSProperties;
}

export default function ChiefTopItem({ officer, maxTurn, turnTerm, onSelect, style }: ChiefTopItemProps) {
  // Simple read-only view
  // Render simplified grid
  
  const turns = [];
  let currentTime = new Date(officer.turnTime);
  for(let i=0; i<maxTurn; i++){
      const t = officer.turn[i] || { brief: '' };
      turns.push({
          index: i,
          timeStr: format(currentTime, turnTerm >= 5 ? 'HH:mm' : 'mm:ss'),
          brief: t.brief
      });
      currentTime = addMinutes(currentTime, turnTerm);
  }

  return (
    <div className="border border-gray-800 bg-gray-900 text-xs" style={style}>
        <div 
            className="p-1 bg-gray-800 font-bold flex justify-between cursor-pointer hover:bg-gray-700"
            onClick={onSelect}
        >
            <span>{officer.officerLevelText}</span>
            <span style={{ color: '#aaffff' }}>{officer.name}</span>
        </div>
        <div className="grid grid-cols-[40px_1fr] auto-rows-[30px]">
            {turns.map(t => (
                <React.Fragment key={t.index}>
                    <div className="border-b border-gray-800 flex items-center justify-center text-gray-500">
                        {t.timeStr}
                    </div>
                    <div className="border-b border-gray-800 flex items-center pl-2 truncate text-gray-400">
                        <span dangerouslySetInnerHTML={{ __html: t.brief }} />
                    </div>
                </React.Fragment>
            ))}
        </div>
    </div>
  );
}


