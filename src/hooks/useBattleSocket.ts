/**
 * 실시간 전투 전용 Socket.IO 훅
 * Phase 3 - WebSocket 통신
 */

'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useSocket } from './useSocket';

export interface BattleUnit {
  generalId: number;
  generalName: string;
  position: { x: number; y: number };
  velocity?: { x: number; y: number };
  facing?: number;
  troops: number;
  maxTroops: number;
  morale: number;
  targetPosition?: { x: number; y: number };
  isCharging?: boolean;
  lastAttackTime?: number;
  unitType: string;
  collisionRadius: number;
  attackRange: number;
}

export interface BattleState {
  battleId: string;
  currentTurn: number;
  attackerUnits: BattleUnit[];
  defenderUnits: BattleUnit[];
  map: {
    width: number;
    height: number;
    castle?: {
      center: { x: number; y: number };
      radius: number;
      gates: Array<{
        id: string;
        position: { x: number; y: number };
        width: number;
        height: number;
        hp: number;
        maxHp: number;
      }>;
    };
  };
}

export interface BattleCommand {
  generalId: number;
  command: 'move' | 'attack' | 'hold' | 'retreat' | 'volley';
  targetPosition?: { x: number; y: number };
  targetGeneralId?: number;
}

interface UseBattleSocketOptions {
  battleId: string;
  generalId?: number;
  token?: string | null;
}

const BATTLE_LOG_LIMIT = 60;

/**
 * Linear interpolation helper
 */
function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function useBattleSocket(options: UseBattleSocketOptions) {
  const { battleId, generalId, token } = options;
  const { socket, isConnected, onBattleEvent } = useSocket({ token, autoConnect: true });
  
  const [battleState, setBattleState] = useState<BattleState | null>(null);
  const [interpolatedState, setInterpolatedState] = useState<BattleState | null>(null);
  const [isJoined, setIsJoined] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  
  const joinedRef = useRef(false);
  const lastStateRef = useRef<BattleState | null>(null);
  const nextStateRef = useRef<BattleState | null>(null);
  const lastUpdateTimeRef = useRef<number>(Date.now());
  const animationFrameRef = useRef<number | null>(null);
  const commandSeqRef = useRef<number>(0);

  // TICK_RATE (ticks per second) - Server usually runs at 20 ticks
  const TICK_RATE = 20;
  const TICK_TIME = 1000 / TICK_RATE;

  const pushLog = useCallback((message: string) => {
    setLogs((prev) => {
      const next = [...prev, message];
      if (next.length > BATTLE_LOG_LIMIT) {
        return next.slice(next.length - BATTLE_LOG_LIMIT);
      }
      return next;
    });
  }, []);

  /**
   * Interpolation Loop
   */
  const startInterpolation = useCallback(() => {
    const update = () => {
      const now = Date.now();
      const elapsed = now - lastUpdateTimeRef.current;
      const t = Math.min(1, elapsed / TICK_TIME);

      if (lastStateRef.current && nextStateRef.current) {
        // Interpolate positions for all units
        const interpolateUnits = (unitsA: BattleUnit[], unitsB: BattleUnit[]) => {
          return unitsA.map(unitA => {
            const unitB = unitsB.find(u => u.generalId === unitA.generalId);
            if (!unitB) return unitA;

            return {
              ...unitB,
              position: {
                x: lerp(unitA.position.x, unitB.position.x, t),
                y: lerp(unitA.position.y, unitB.position.y, t)
              }
            };
          });
        };

        const nextState: BattleState = {
          ...nextStateRef.current,
          attackerUnits: interpolateUnits(lastStateRef.current.attackerUnits, nextStateRef.current.attackerUnits),
          defenderUnits: interpolateUnits(lastStateRef.current.defenderUnits, nextStateRef.current.defenderUnits),
        };

        setInterpolatedState(nextState);
      }

      animationFrameRef.current = requestAnimationFrame(update);
    };

    animationFrameRef.current = requestAnimationFrame(update);
  }, [TICK_TIME]);

  const stopInterpolation = useCallback(() => {
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  }, []);

  /**
   * 전투 참가
   */
  const joinBattle = useCallback(() => {
    if (!socket || !isConnected || !generalId || joinedRef.current) {
      return;
    }

    console.log('[BattleSocket] 전투 참가:', { battleId, generalId });
    
    socket.emit('battle:join', {
      battleId,
      generalId
    });
    
    joinedRef.current = true;
  }, [socket, isConnected, battleId, generalId]);

  /**
   * 전투 관전
   */
  const spectateBattle = useCallback(() => {
    if (!socket || !isConnected || joinedRef.current) {
      return;
    }

    console.log('[BattleSocket] 전투 관전 시작:', { battleId });
    
    socket.emit('battle:spectate', {
      battleId
    });
    
    joinedRef.current = true;
  }, [socket, isConnected, battleId]);

  /**
   * 전투 명령 전송
   */
  const sendCommand = useCallback((command: BattleCommand) => {
    if (!socket || !isConnected || !isJoined) {
      console.warn('[BattleSocket] 명령 전송 실패: 연결 안 됨');
      return;
    }

    commandSeqRef.current += 1;
    const seq = commandSeqRef.current;

    console.log('[BattleSocket] 명령 전송:', { ...command, seq });
    
    socket.emit('battle:command', {
      battleId,
      ...command,
      seq
    });
  }, [socket, isConnected, isJoined, battleId]);

  /**
   * 전투 나가기
   */
  const leaveBattle = useCallback(() => {
    if (!socket || !generalId) {
      return;
    }

    console.log('[BattleSocket] 전투 나가기:', { battleId, generalId });
    
    socket.emit('battle:leave', {
      battleId,
      generalId
    });
    
    setIsJoined(false);
    joinedRef.current = false;
  }, [socket, battleId, generalId]);

  /**
   * 이동 명령
   */
  const moveUnit = useCallback((unitGeneralId: number, targetPosition: { x: number; y: number }) => {
    sendCommand({
      generalId: unitGeneralId,
      command: 'move',
      targetPosition
    });
  }, [sendCommand]);

  /**
   * 공격 명령
   */
  const attackUnit = useCallback((unitGeneralId: number, targetGeneralId: number) => {
    sendCommand({
      generalId: unitGeneralId,
      command: 'attack',
      targetGeneralId
    });
  }, [sendCommand]);

  /**
   * 대기 명령
   */
  const holdPosition = useCallback((unitGeneralId: number) => {
    sendCommand({
      generalId: unitGeneralId,
      command: 'hold'
    });
  }, [sendCommand]);

  /**
   * 후퇴 명령
   */
  const retreat = useCallback((unitGeneralId: number) => {
    sendCommand({
      generalId: unitGeneralId,
      command: 'retreat'
    });
  }, [sendCommand]);

  /**
   * 일제 사격 명령 (Volley)
   */
  const fireVolley = useCallback((unitGeneralId: number, targetGeneralId?: number) => {
    sendCommand({
      generalId: unitGeneralId,
      command: 'volley',
      targetGeneralId,
    });
  }, [sendCommand]);

  // 이벤트 리스너 등록
  useEffect(() => {
    if (!socket || !isConnected) {
      return;
    }

    // 전투 참가 성공
    const unsubJoined = onBattleEvent('joined', (data: any) => {
      console.log('[BattleSocket] 전투 참가 성공:', data);
      setIsJoined(true);
      setBattleState(data);
      pushLog(`전투에 참가했습니다: ${data.battleId}`);
    });

    // 전투 관전 성공
    const unsubSpectating = onBattleEvent('spectating', (data: any) => {
      console.log('[BattleSocket] 전투 관전 성공:', data);
      setIsJoined(false); // 관전자는 참가 상태가 아님
      setBattleState(data);
      pushLog(`전투 관전을 시작했습니다: ${data.battleId}`);
    });

    // 실시간 상태 업데이트 (20 tick/s)
    const unsubState = onBattleEvent('state', (state: BattleState) => {
      lastStateRef.current = nextStateRef.current || state;
      nextStateRef.current = state;
      lastUpdateTimeRef.current = Date.now();
      
      setBattleState(state);
      
      if (animationFrameRef.current === null) {
        startInterpolation();
      }
    });

    // 명령 확인
    const unsubCommandAck = onBattleEvent('command_acknowledged', (data: any) => {
      console.log('[BattleSocket] 명령 확인:', data);
      pushLog(`명령 확인: ${data.command}`);
    });

    // 전투 종료
    const unsubEnded = onBattleEvent('ended', (data: any) => {
      console.log('[BattleSocket] 전투 종료:', data);
      pushLog(`전투 종료! 승자: ${data.winner}`);
      setIsJoined(false);
      joinedRef.current = false;
    });

    // 에러
    const unsubError = onBattleEvent('error', (data: any) => {
      console.error('[BattleSocket] 에러:', data);
      setError(data.message);
      pushLog(`오류: ${data.message}`);
    });

    // 플레이어 참가/나가기
    const unsubPlayerJoined = onBattleEvent('player_joined', () => {
      pushLog('새 장수가 전투에 참가했습니다.');
    });
 
    const unsubPlayerLeft = onBattleEvent('player_left', () => {
      pushLog('장수가 전투에서 퇴장했습니다.');
    });

    return () => {
      unsubJoined();
      unsubSpectating();
      unsubState();
      unsubCommandAck();
      unsubEnded();
      unsubError();
      unsubPlayerJoined();
      unsubPlayerLeft();
      stopInterpolation();
      lastStateRef.current = null;
      nextStateRef.current = null;
    };
  }, [socket, isConnected, onBattleEvent, pushLog, startInterpolation, stopInterpolation]);

  // 자동 참가 또는 관전
  useEffect(() => {
    if (isConnected && !joinedRef.current) {
      if (generalId) {
        // 참가
        const timer = setTimeout(() => {
          joinBattle();
        }, 500);
        return () => clearTimeout(timer);
      } else {
        // 관전
        const timer = setTimeout(() => {
          spectateBattle();
        }, 500);
        return () => clearTimeout(timer);
      }
    }
  }, [isConnected, generalId, joinBattle, spectateBattle]);

  // cleanup
  useEffect(() => {
    return () => {
      if (isJoined) {
        leaveBattle();
      }
    };
  }, [isJoined, leaveBattle]);

  return {
    socket,
    isConnected,
    isJoined,
    battleState,
    interpolatedState,
    error,
    logs,
    
    // 명령 함수
    moveUnit,
    attackUnit,
    holdPosition,
    retreat,
    fireVolley,
    
    // 저수준 함수
    joinBattle,
    leaveBattle,
    sendCommand
  };
}
