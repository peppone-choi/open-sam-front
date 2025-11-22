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

export function useBattleSocket(options: UseBattleSocketOptions) {
  const { battleId, generalId, token } = options;
  const { socket, isConnected, onBattleEvent } = useSocket({ token, autoConnect: true });
  
  const [battleState, setBattleState] = useState<BattleState | null>(null);
  const [isJoined, setIsJoined] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  
  const joinedRef = useRef(false);
  const pendingStateRef = useRef<BattleState | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const pushLog = useCallback((message: string) => {
    setLogs((prev) => {
      const next = [...prev, message];
      if (next.length > BATTLE_LOG_LIMIT) {
        return next.slice(next.length - BATTLE_LOG_LIMIT);
      }
      return next;
    });
  }, []);

  const scheduleBattleStateUpdate = useCallback(() => {
    if (animationFrameRef.current !== null) {
      return;
    }

    animationFrameRef.current = requestAnimationFrame(() => {
      animationFrameRef.current = null;
      if (pendingStateRef.current) {
        setBattleState(pendingStateRef.current);
        pendingStateRef.current = null;
      }
    });
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
   * 전투 명령 전송
   */
  const sendCommand = useCallback((command: BattleCommand) => {
    if (!socket || !isConnected || !isJoined) {
      console.warn('[BattleSocket] 명령 전송 실패: 연결 안 됨');
      return;
    }

    console.log('[BattleSocket] 명령 전송:', command);
    
    socket.emit('battle:command', {
      battleId,
      ...command
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

    // 실시간 상태 업데이트 (20 tick/s)
    const unsubState = onBattleEvent('state', (state: BattleState) => {
      pendingStateRef.current = state;
      scheduleBattleStateUpdate();
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
    const unsubPlayerJoined = onBattleEvent('player_joined', (data: any) => {
      pushLog(`장수 ${data.generalId} 참가`);
    });

    const unsubPlayerLeft = onBattleEvent('player_left', (data: any) => {
      pushLog(`장수 ${data.generalId} 퇴장`);
    });

    return () => {
      unsubJoined();
      unsubState();
      unsubCommandAck();
      unsubEnded();
      unsubError();
      unsubPlayerJoined();
      unsubPlayerLeft();
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      pendingStateRef.current = null;
    };
  }, [socket, isConnected, onBattleEvent, pushLog, scheduleBattleStateUpdate]);

  // 자동 참가
  useEffect(() => {
    if (isConnected && generalId && !joinedRef.current) {
      // 약간의 딜레이 후 참가 (연결 안정화)
      const timer = setTimeout(() => {
        joinBattle();
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [isConnected, generalId, joinBattle]);

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
