'use client';

import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useGin7TacticalStore } from '@/stores/gin7TacticalStore';
import type {
  TacticalCommand,
  BattleStartEvent,
  BattleUpdateEvent,
  BattleEndEvent,
  DamageEvent,
  UnitDestroyedEvent,
} from '@/types/gin7-tactical';

// ============================================================
// Types
// ============================================================

interface UseTacticalSocketOptions {
  sessionId: string;
  factionId: string;
  commanderId: string;
  autoConnect?: boolean;
  serverUrl?: string;
}

interface UseTacticalSocketReturn {
  isConnected: boolean;
  battleId: string | null;
  latency: number;
  
  // Actions
  connect: () => void;
  disconnect: () => void;
  joinBattle: (battleId: string) => void;
  leaveBattle: (battleId: string) => void;
  setReady: (battleId: string, ready: boolean) => void;
  sendCommand: (battleId: string, command: TacticalCommand) => void;
  requestSnapshot: (battleId: string) => void;
  ping: (battleId: string) => void;
}

// ============================================================
// Constants
// ============================================================

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
const PING_INTERVAL = 5000;

// ============================================================
// Hook Implementation
// ============================================================

export function useTacticalSocket(options: UseTacticalSocketOptions): UseTacticalSocketReturn {
  const {
    sessionId,
    factionId,
    commanderId,
    autoConnect = true,
    serverUrl = BACKEND_URL,
  } = options;

  const socketRef = useRef<Socket | null>(null);
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const pingStartRef = useRef<number>(0);

  const {
    isConnected,
    battleId,
    latency,
    setConnected,
    setSessionInfo,
    handleBattleStart,
    handleBattleUpdate,
    handleBattleEnd,
    handleDamage,
    handleUnitDestroyed,
    setLatency,
    reset,
  } = useGin7TacticalStore();

  // ============================================================
  // Socket Connection
  // ============================================================

  const connect = useCallback(() => {
    if (socketRef.current?.connected) {
      console.warn('[TacticalSocket] Already connected');
      return;
    }

    const socket = io(`${serverUrl}/tactical`, {
      query: {
        sessionId,
        factionId,
        commanderId,
      },
      auth: {
        userId: commanderId,
      },
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 10,
    });

    // Connection events
    socket.on('connect', () => {
      console.log('[TacticalSocket] Connected');
      setConnected(true);
      setSessionInfo(sessionId, factionId, commanderId);
    });

    socket.on('disconnect', (reason) => {
      console.log('[TacticalSocket] Disconnected:', reason);
      setConnected(false);
      
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
        pingIntervalRef.current = null;
      }
    });

    socket.on('connect_error', (error) => {
      console.error('[TacticalSocket] Connection error:', error);
      setConnected(false);
    });

    // GIN7 Events
    socket.on('GIN7:BATTLE_START', (data: BattleStartEvent) => {
      console.log('[TacticalSocket] Battle started:', data.battleId);
      handleBattleStart(data);
    });

    socket.on('GIN7:BATTLE_UPDATE', (data: BattleUpdateEvent) => {
      handleBattleUpdate(data);
    });

    socket.on('GIN7:BATTLE_END', (data: BattleEndEvent) => {
      console.log('[TacticalSocket] Battle ended:', data.battleId);
      handleBattleEnd(data);
    });

    // Additional events
    socket.on('tactical:damage', (data: DamageEvent) => {
      handleDamage(data);
    });

    socket.on('tactical:unit_destroyed', (data: UnitDestroyedEvent) => {
      console.log('[TacticalSocket] Unit destroyed:', data.unitId);
      handleUnitDestroyed(data);
    });

    socket.on('tactical:pong', (data: { timestamp: number; serverTime: number }) => {
      const rtt = Date.now() - pingStartRef.current;
      setLatency(Math.round(rtt / 2));
    });

    socket.on('tactical:error', (data: { code: string; message: string }) => {
      console.error('[TacticalSocket] Error:', data.code, data.message);
    });

    socket.on('tactical:joined', (data: { battleId: string; snapshot: BattleUpdateEvent | null }) => {
      console.log('[TacticalSocket] Joined battle:', data.battleId);
      if (data.snapshot) {
        handleBattleUpdate(data.snapshot);
      }
    });

    socketRef.current = socket;
  }, [
    serverUrl,
    sessionId,
    factionId,
    commanderId,
    setConnected,
    setSessionInfo,
    handleBattleStart,
    handleBattleUpdate,
    handleBattleEnd,
    handleDamage,
    handleUnitDestroyed,
    setLatency,
  ]);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }
    
    reset();
  }, [reset]);

  // ============================================================
  // Battle Actions
  // ============================================================

  const joinBattle = useCallback((battleId: string) => {
    socketRef.current?.emit('tactical:join', { battleId });
  }, []);

  const leaveBattle = useCallback((battleId: string) => {
    socketRef.current?.emit('tactical:leave', { battleId });
  }, []);

  const setReady = useCallback((battleId: string, ready: boolean) => {
    socketRef.current?.emit('tactical:ready', { battleId, ready });
  }, []);

  const sendCommand = useCallback((battleId: string, command: TacticalCommand) => {
    socketRef.current?.emit('tactical:command', { battleId, command });
  }, []);

  const requestSnapshot = useCallback((battleId: string) => {
    socketRef.current?.emit('tactical:request_snapshot', { battleId });
  }, []);

  const ping = useCallback((battleId: string) => {
    pingStartRef.current = Date.now();
    socketRef.current?.emit('tactical:ping', { battleId, timestamp: pingStartRef.current });
  }, []);

  // ============================================================
  // Auto-connect on mount
  // ============================================================

  useEffect(() => {
    if (autoConnect && sessionId && factionId && commanderId) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [autoConnect, sessionId, factionId, commanderId, connect, disconnect]);

  // ============================================================
  // Ping interval
  // ============================================================

  useEffect(() => {
    if (isConnected && battleId) {
      pingIntervalRef.current = setInterval(() => {
        ping(battleId);
      }, PING_INTERVAL);

      return () => {
        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current);
          pingIntervalRef.current = null;
        }
      };
    }
  }, [isConnected, battleId, ping]);

  return {
    isConnected,
    battleId,
    latency,
    connect,
    disconnect,
    joinBattle,
    leaveBattle,
    setReady,
    sendCommand,
    requestSnapshot,
    ping,
  };
}

// ============================================================
// Command Builder Helpers
// ============================================================

export function createMoveCommand(
  unitIds: string[],
  targetPosition: { x: number; y: number; z: number },
  formation?: string
): TacticalCommand {
  return {
    type: 'MOVE',
    unitIds,
    timestamp: Date.now(),
    data: {
      targetPosition,
      formation: formation as 'LINE' | 'WEDGE' | 'CIRCLE' | 'SPREAD' | 'DEFENSIVE' | 'ASSAULT',
    },
  };
}

export function createAttackCommand(
  unitIds: string[],
  targetId: string,
  attackType: 'ALL' | 'BEAM' | 'GUN' | 'MISSILE' = 'ALL'
): TacticalCommand {
  return {
    type: 'ATTACK',
    unitIds,
    timestamp: Date.now(),
    data: {
      targetId,
      attackType,
    },
  };
}

export function createStopCommand(unitIds: string[], holdPosition = true): TacticalCommand {
  return {
    type: 'STOP',
    unitIds,
    timestamp: Date.now(),
    data: {
      holdPosition,
    },
  };
}

export function createFormationCommand(unitIds: string[], formation: string): TacticalCommand {
  return {
    type: 'FORMATION',
    unitIds,
    timestamp: Date.now(),
    data: {
      formation: formation as 'LINE' | 'WEDGE' | 'CIRCLE' | 'SPREAD' | 'DEFENSIVE' | 'ASSAULT',
    },
  };
}

export function createEnergyCommand(
  unitIds: string[],
  distribution: { beam: number; gun: number; shield: number; engine: number; warp: number; sensor: number }
): TacticalCommand {
  return {
    type: 'ENERGY_DISTRIBUTION',
    unitIds,
    timestamp: Date.now(),
    data: {
      distribution,
    },
  };
}

export function createRetreatCommand(unitIds: string[], direction?: { x: number; y: number; z: number }): TacticalCommand {
  return {
    type: 'RETREAT',
    unitIds,
    timestamp: Date.now(),
    data: {
      direction,
    },
  };
}













