'use client';

import { useState } from 'react';
import { useGameStore } from '@/stores/gameStore';
import JobCard from './JobCard';
import { CommandType } from '@/types/logh';
import { useCommandExecution } from '@/hooks/useCommandExecution';

export default function JobCardDeck() {
  const { userProfile } = useGameStore();
  const [activeCardId, setActiveCardId] = useState<string | null>(null);
  const { execute, isExecuting } = useCommandExecution();

  if (!userProfile) return null;

  const handleCommand = (cardId: string, cmd: CommandType) => {
    // For prototype, we mock the target selection as "Current Selection"
    // In P.27 "Command Flow", a target selection modal would appear here.
    const target = { gridX: 0, gridY: 0 }; 
    
    if (confirm(`Execute ${cmd} using card ${cardId}?`)) {
        execute(cardId, cmd, target);
    }
  };

  return (
    <div className="flex flex-col items-end gap-1 pointer-events-auto pb-0">
       {userProfile.jobCards.map((card) => (
         <div key={card.id} className="relative">
            <JobCard 
              card={card} 
              faction={userProfile.faction as any}
              isActive={activeCardId === card.id}
              onSelect={() => setActiveCardId(card.id)}
              onCommand={(cmd) => handleCommand(card.id, cmd)}
            />
         </div>
       ))}
       {isExecuting && (
         <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center pointer-events-none">
            <div className="text-[#1E90FF] font-mono animate-pulse bg-[#101520] p-4 border border-[#1E90FF]">
                TRANSMITTING ORDERS...
            </div>
         </div>
       )}
    </div>
  );
}
