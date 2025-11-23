import { useCallback, useState } from 'react';
import { gin7Api } from '@/lib/api/gin7';
import { useGameStore } from '@/stores/gameStore';
import { useGin7Store } from '@/stores/gin7Store';
import { Gin7CommandMeta } from '@/types/gin7';

interface ExecuteCommandPayload {
  cardId: string;
  templateId: string;
  command: Gin7CommandMeta;
  args?: Record<string, unknown>;
}

export function useCommandExecution() {
  const [isExecuting, setIsExecuting] = useState(false);
  const { userProfile, updateCP } = useGameStore();
  const sessionId = useGin7Store((state) => state.sessionId);

  const execute = useCallback(
    async ({ cardId, command, args }: ExecuteCommandPayload) => {
      if (!userProfile) return;
      setIsExecuting(true);
      try {
        const result = await gin7Api.executeCommand({
          sessionId,
          cardId,
          commandCode: command.code,
          characterId: userProfile.characterId || userProfile.id,
          args,
        });

        if (result.cpSpent) {
          updateCP(-(result.cpSpent.pcp ?? 0), -(result.cpSpent.mcp ?? 0));
        }

        if (!result.success) {
          console.warn('[gin7] Command execution warning', result.message);
        }
      } catch (error) {
        console.error('[gin7] Command execution failed', error);
      } finally {
        setIsExecuting(false);
      }
    },
    [sessionId, updateCP, userProfile]
  );

  return { execute, isExecuting };
}
