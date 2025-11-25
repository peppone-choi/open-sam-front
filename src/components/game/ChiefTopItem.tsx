'use client';
 
import React from 'react';


interface ChiefTopItemProps {
  officer: {
    name: string;
    officerLevelText: string;
    npcType: number;
    turn: any[];
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
  
  const turns = [] as { index: number; timeStr: string; brief: string }[];
  let currentTime = new Date(officer.turnTime);

  const pad2 = (n: number) => (n < 10 ? `0${n}` : String(n));

  const addMinutesLocal = (date: Date, minutes: number) =>
    new Date(date.getTime() + minutes * 60_000);

  for (let i = 0; i < maxTurn; i += 1) {
    const t = (officer.turn && (officer.turn as any)[i]) || { brief: '' };
    const hours = currentTime.getHours();
    const minutes = currentTime.getMinutes();

    const timeStr = turnTerm >= 5
      ? `${pad2(hours)}:${pad2(minutes)}`
      : `${pad2(minutes)}:00`;

    turns.push({
      index: i,
      timeStr,
      brief: t.brief || '',
    });

    currentTime = addMinutesLocal(currentTime, turnTerm);
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
        <div className="grid grid-cols-[64px_1fr] auto-rows-[30px]">
            {turns.map(t => (
                <React.Fragment key={t.index}>
                    <div className="border-b border-gray-800 flex flex-col items-center justify-center text-[10px] text-gray-400">
                        <span className="font-mono text-gray-300">{t.index + 1}</span>
                        <span className="font-mono">{t.timeStr}</span>
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


