'use client';

import { useState } from 'react';
import { useGameStore } from '@/stores/gameStore';
import { useGin7Store } from '@/stores/gin7Store';
import JobCard from './JobCard';
import TargetSelectionModal, { Target } from './TargetSelectionModal';
import CommandConfirmDialog from './CommandConfirmDialog';
import { CommandType } from '@/types/logh';
import { useCommandExecution } from '@/hooks/useCommandExecution';
import { Gin7CommandMeta } from '@/types/gin7';
import type { JobCard as JobCardType } from '@/types/logh';

const MAX_CARDS_PER_CHARACTER = 16; // gin7manual.txt P.26

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

interface PendingCommand {
  card: JobCardType;
  command: CommandType;
  commandMeta: Gin7CommandMeta;
}

export default function JobCardDeck() {
  const { userProfile } = useGameStore();
  const sessionId = useGin7Store((state) => state.sessionId);
  const [activeCardId, setActiveCardId] = useState<string | null>(null);
  const [pendingCommand, setPendingCommand] = useState<PendingCommand | null>(null);
  const [selectedTarget, setSelectedTarget] = useState<Target | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const { execute, isExecuting } = useCommandExecution();

  if (!userProfile) return null;

  // Check max card limit (gin7manual.txt P.26)
  if (userProfile.jobCards.length > MAX_CARDS_PER_CHARACTER) {
    console.warn(
      `[JobCardDeck] Character has ${userProfile.jobCards.length} cards, exceeding max of ${MAX_CARDS_PER_CHARACTER}`
    );
  }

  const handleCommandClick = (card: JobCardType, cmd: CommandType) => {
    const commandMeta = resolveCommandMeta(card, cmd);
    setPendingCommand({ card, command: cmd, commandMeta });
  };

  const handleTargetConfirm = (target: Target) => {
    setSelectedTarget(target);
    setPendingCommand(null);
    setShowConfirmDialog(true);
  };

  const handleTargetCancel = () => {
    setPendingCommand(null);
  };

  const handleFinalConfirm = async () => {
    if (!pendingCommand && !selectedTarget) return;

    // Use selected target or fall back to stored pending command
    const command = pendingCommand?.commandMeta;
    const target = selectedTarget;
    const card = pendingCommand?.card;

    if (!command || !card) return;

    setShowConfirmDialog(false);

    // Calculate CP substitution warning
    const cpCost = typeof command.cpCost === 'number' ? command.cpCost : parseInt(String(command.cpCost || '0'), 10);
    let cpWarning: { pcp?: number; mcp?: number } | undefined;

    if (command.cpType === 'PCP' && userProfile.pcp < cpCost) {
      cpWarning = { pcp: cpCost - userProfile.pcp };
    } else if (command.cpType === 'MCP' && userProfile.mcp < cpCost) {
      cpWarning = { mcp: cpCost - userProfile.mcp };
    }

    // Prepare args based on target type
    const args: Record<string, unknown> = {};
    if (target?.type === 'coordinates') {
      args.gridX = target.gridX;
      args.gridY = target.gridY;
    } else if (target?.type === 'fleet') {
      args.fleetId = target.fleetId;
    } else if (target?.type === 'system') {
      args.systemId = target.systemId;
    }

    try {
      await execute({
        cardId: card.id,
        templateId: card.id,
        command,
        args,
      });

      // Log for QA
      console.log('[JobCardDeck] Command executed:', {
        cardId: card.id,
        command: command.code,
        target,
        cpWarning,
      });
    } catch (error) {
      console.error('[JobCardDeck] Command execution failed:', error);
    }

    setSelectedTarget(null);
  };

  const handleFinalCancel = () => {
    setShowConfirmDialog(false);
    setSelectedTarget(null);
  };

  // Calculate CP warning for modal
  const cpWarning = pendingCommand
    ? (() => {
        const cpCost =
          typeof pendingCommand.commandMeta.cpCost === 'number'
            ? pendingCommand.commandMeta.cpCost
            : parseInt(String(pendingCommand.commandMeta.cpCost || '0'), 10);
        
        if (pendingCommand.commandMeta.cpType === 'PCP' && userProfile.pcp < cpCost) {
          return { pcp: cpCost - userProfile.pcp };
        } else if (pendingCommand.commandMeta.cpType === 'MCP' && userProfile.mcp < cpCost) {
          return { mcp: cpCost - userProfile.mcp };
        }
        return undefined;
      })()
    : undefined;

  return (
    <>
      <div className="flex flex-col items-end gap-1 pointer-events-auto pb-0">
        {userProfile.jobCards.length > MAX_CARDS_PER_CHARACTER && (
          <div className="bg-red-900/50 border border-red-500 text-red-200 text-xs px-3 py-1 rounded mb-2">
            ⚠️ Max {MAX_CARDS_PER_CHARACTER} cards (gin7manual.txt P.26)
          </div>
        )}

        {userProfile.jobCards.map((card) => (
          <div key={card.id} className="relative">
            <JobCard
              card={card}
              faction={userProfile.faction as any}
              isActive={activeCardId === card.id}
              onSelect={() => setActiveCardId(card.id)}
              onCommand={(cmd) => handleCommandClick(card, cmd)}
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

      {/* Target Selection Modal */}
      {pendingCommand && (
        <TargetSelectionModal
          isOpen={true}
          command={pendingCommand.command}
          commandMeta={pendingCommand.commandMeta}
          cardTitle={pendingCommand.card.title}
          onConfirm={handleTargetConfirm}
          onCancel={handleTargetCancel}
          cpWarning={cpWarning}
          faction={userProfile.faction as any}
        />
      )}

      {/* Confirmation Dialog */}
      {showConfirmDialog && selectedTarget && pendingCommand && (
        <CommandConfirmDialog
          isOpen={true}
          cardTitle={pendingCommand.card.title}
          command={pendingCommand.commandMeta}
          target={selectedTarget}
          executionTime="Immediate"
          onConfirm={handleFinalConfirm}
          onCancel={handleFinalCancel}
          faction={userProfile.faction as any}
        />
      )}
    </>
  );
}
