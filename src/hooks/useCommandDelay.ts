/**
 * useCommandDelay Hook
 * 
 * 명령 지연 시스템 API와 상호작용하는 훅
 * 
 * @module gin7-command-delay
 */

import { useState, useCallback, useEffect, useRef } from 'react';

// 타입 정의
interface DelayBreakdown {
  baseDelay: number;
  distancePenalty: number;
  jammingPenalty: number;
  commanderSkillBonus: number;
  totalDelay: number;
}

interface QueuedCommand {
  id: string;
  commandType: string;
  unitIds: string[];
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'EMERGENCY';
  status: 'QUEUED' | 'EXECUTING' | 'COMPLETED' | 'CANCELLED' | 'FAILED';
  issueTime: number;
  executeTime: number;
  remainingTicks: number;
  remainingSeconds: number;
  progress: number;
  delayBreakdown: DelayBreakdown;
  cancellable: boolean;
}

type JammingLevel = 'CLEAR' | 'INTERFERENCE' | 'HEAVY' | 'BLACKOUT';

interface QueueSummary {
  battleId: string;
  factionId: string;
  totalQueued: number;
  executing: number;
  averageDelay: number;
  jammingLevel: JammingLevel;
}

interface EWState {
  battleId: string;
  factionId: string;
  minovskyDensity: number;
  jammingLevel: JammingLevel;
  isUnderEWAttack: boolean;
  attackSourceId?: string;
  duration: number;
  startTick: number;
}

interface QueueCommandParams {
  battleId: string;
  commanderId: string;
  factionId: string;
  command: {
    type: string;
    unitIds: string[];
    timestamp: number;
    data: any;
  };
  priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'EMERGENCY';
  commanderDistance?: number;
  commanderSkill?: number;
}

interface UseCommandDelayOptions {
  battleId: string;
  factionId: string;
  pollInterval?: number; // ms
  autoRefresh?: boolean;
}

const API_BASE = '/api/gin7/command-delay';

/**
 * 명령 지연 시스템 훅
 */
export function useCommandDelay({
  battleId,
  factionId,
  pollInterval = 1000,
  autoRefresh = true,
}: UseCommandDelayOptions) {
  const [commands, setCommands] = useState<QueuedCommand[]>([]);
  const [ewState, setEwState] = useState<EWState | null>(null);
  const [summary, setSummary] = useState<QueueSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // 명령 큐 조회
  const fetchQueue = useCallback(async () => {
    try {
      const response = await fetch(
        `${API_BASE}/queue/${battleId}?factionId=${factionId}`
      );
      const data = await response.json();
      
      if (data.success) {
        setCommands(data.data.commands);
      } else {
        setError(data.error?.message || '큐 조회 실패');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '네트워크 오류');
    }
  }, [battleId, factionId]);

  // 전자전 상태 조회
  const fetchEWState = useCallback(async () => {
    try {
      const response = await fetch(
        `${API_BASE}/ew/state/${battleId}?factionId=${factionId}`
      );
      const data = await response.json();
      
      if (data.success) {
        setEwState(data.data);
      }
    } catch (err) {
      console.warn('EW state fetch failed:', err);
    }
  }, [battleId, factionId]);

  // 요약 정보 조회
  const fetchSummary = useCallback(async () => {
    try {
      const response = await fetch(
        `${API_BASE}/queue/${battleId}/summary?factionId=${factionId}`
      );
      const data = await response.json();
      
      if (data.success) {
        setSummary(data.data);
      }
    } catch (err) {
      console.warn('Summary fetch failed:', err);
    }
  }, [battleId, factionId]);

  // 전체 새로고침
  const refresh = useCallback(async () => {
    setIsLoading(true);
    await Promise.all([fetchQueue(), fetchEWState(), fetchSummary()]);
    setIsLoading(false);
  }, [fetchQueue, fetchEWState, fetchSummary]);

  // 명령 큐에 추가
  const queueCommand = useCallback(
    async (params: Omit<QueueCommandParams, 'battleId' | 'factionId'>) => {
      setError(null);
      
      try {
        const response = await fetch(`${API_BASE}/queue`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            battleId,
            factionId,
            ...params,
          }),
        });
        
        const data = await response.json();
        
        if (data.success) {
          // 성공 시 즉시 새로고침
          await fetchQueue();
          return { success: true, data: data.data };
        } else {
          const errorMessage = data.error?.message || '명령 큐 추가 실패';
          setError(errorMessage);
          return { success: false, error: errorMessage };
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : '네트워크 오류';
        setError(errorMessage);
        return { success: false, error: errorMessage };
      }
    },
    [battleId, factionId, fetchQueue]
  );

  // 명령 취소
  const cancelCommand = useCallback(
    async (commandId: string) => {
      setError(null);
      
      try {
        const response = await fetch(`${API_BASE}/command/${commandId}/cancel`, {
          method: 'POST',
        });
        
        const data = await response.json();
        
        if (data.success) {
          await fetchQueue();
          return { 
            success: true, 
            chaosProbability: data.data.chaosProbability 
          };
        } else {
          setError(data.error?.message || '명령 취소 실패');
          return { success: false, error: data.error?.message };
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : '네트워크 오류';
        setError(errorMessage);
        return { success: false, error: errorMessage };
      }
    },
    [fetchQueue]
  );

  // 전자전 공격
  const executeEWAttack = useCallback(
    async (targetFactionId: string, intensity: number, duration?: number) => {
      try {
        const response = await fetch(`${API_BASE}/ew/attack`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            battleId,
            attackerFactionId: factionId,
            targetFactionId,
            intensity,
            duration: duration || 300,
          }),
        });
        
        const data = await response.json();
        return { success: data.success, data: data.data };
      } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : '네트워크 오류' };
      }
    },
    [battleId, factionId]
  );

  // 미노프스키 입자 산포
  const spreadMinovsky = useCallback(
    async (intensity: number, area: 'LOCAL' | 'GLOBAL' = 'LOCAL') => {
      try {
        const response = await fetch(`${API_BASE}/ew/minovsky`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            battleId,
            factionId,
            intensity,
            area,
          }),
        });
        
        const data = await response.json();
        
        if (data.success) {
          await fetchEWState();
        }
        
        return { success: data.success, data: data.data };
      } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : '네트워크 오류' };
      }
    },
    [battleId, factionId, fetchEWState]
  );

  // 재밍 해제
  const clearJamming = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/ew/clear`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ battleId, factionId }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        await fetchEWState();
      }
      
      return { success: data.success, data: data.data };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : '네트워크 오류' };
    }
  }, [battleId, factionId, fetchEWState]);

  // 자동 새로고침 설정
  useEffect(() => {
    if (autoRefresh && battleId && factionId) {
      refresh();
      
      intervalRef.current = setInterval(() => {
        fetchQueue();
        fetchEWState();
      }, pollInterval);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
  }, [battleId, factionId, autoRefresh, pollInterval, refresh, fetchQueue, fetchEWState]);

  // 통신 두절 여부
  const isBlackout = ewState?.jammingLevel === 'BLACKOUT';

  return {
    // 상태
    commands,
    ewState,
    summary,
    isLoading,
    error,
    isBlackout,
    jammingLevel: ewState?.jammingLevel || 'CLEAR',
    minovskyDensity: ewState?.minovskyDensity || 0,
    
    // 액션
    queueCommand,
    cancelCommand,
    executeEWAttack,
    spreadMinovsky,
    clearJamming,
    refresh,
  };
}

export default useCommandDelay;















