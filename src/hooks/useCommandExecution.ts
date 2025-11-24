import { useCallback, useState } from 'react';
import { gin7Api } from '@/lib/api/gin7';
import { useGameStore } from '@/stores/gameStore';
import { useGin7Store } from '@/stores/gin7Store';
import { useToast } from '@/contexts/ToastContext';
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
  const { showToast } = useToast();
 
  const execute = useCallback(
    async ({ cardId, command, args }: ExecuteCommandPayload) => {
      if (!userProfile) {
        showToast('캐릭터 정보가 로드되지 않아 명령을 실행할 수 없습니다.', 'error');
        return;
      }
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
          const message = result.message || '커맨드 실행에 실패했습니다.';
          console.warn('[gin7] Command execution warning', message);
          showToast(message, 'error');
        } else {
          showToast('명령을 전송했습니다.', 'success');
        }
      } catch (error: any) {
        const message = error?.message || '커맨드 실행 중 오류가 발생했습니다.';
        console.error('[gin7] Command execution failed', error);
        showToast(message, 'error');
      } finally {
        setIsExecuting(false);
      }
    },
    [sessionId, updateCP, userProfile, showToast]
  );


  return { execute, isExecuting };
}
