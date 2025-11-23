'use client';

import { useState } from 'react';
import { useGameStore } from '@/stores/gameStore';
import JobCard from './JobCard';
import { CommandType } from '@/types/logh';
import { useCommandExecution } from '@/hooks/useCommandExecution';
import { Gin7CommandMeta } from '@/types/gin7';
import type { JobCard as JobCardType } from '@/types/logh';

function resolveCommandMeta(card: JobCardType, commandCode: CommandType): Gin7CommandMeta {
  const normalizedCode = String(commandCode);
  const rawMeta = card.commandMeta?.find((meta) => meta.code === normalizedCode);
  if (rawMeta) {
    return {
      code: rawMeta.code,
      label: rawMeta.label ?? rawMeta.code,
      group: rawMeta.group ?? 'personal',
      cpType: rawMeta.cpType,
      cpCost: rawMeta.cpCost,
    };
  }
  return {
    code: normalizedCode,
    label: normalizedCode,
    group: 'personal',
  };
}

export default function JobCardDeck() {
  const { userProfile } = useGameStore();
  const [activeCardId, setActiveCardId] = useState<string | null>(null);
  const { execute, isExecuting } = useCommandExecution();

  if (!userProfile) return null;

  const handleCommand = (card: JobCardType, cmd: CommandType) => {
    const target = { gridX: 0, gridY: 0 };
    if (confirm(`Execute ${cmd} using card ${card.id}?`)) {
      const commandMeta = resolveCommandMeta(card, cmd);
      void execute({
        cardId: card.id,
        templateId: card.id,
        command: commandMeta,
        args: target,
      });
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
              onCommand={(cmd) => handleCommand(card, cmd)}
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
