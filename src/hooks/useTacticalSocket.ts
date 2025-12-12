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
  TacticalUnitState,
} from '@/types/gin7-tactical';

// ============================================================
// Types
// ============================================================

interface UseTacticalSocketOptions {
  sessionId: string;
  factionId: string;
  commanderId: string;
  token?: string;
  autoConnect?: boolean;
  serverUrl?: string;
}

interface UseTacticalSocketReturn {
  isConnected: boolean;
  battleId: string | null;
  latency: number;
  socket: Socket | null;
  
  // Actions
  connect: () => void;
  disconnect: () => void;
  createBattle: (fleetIds: string[], options?: CreateBattleOptions) => void;
  joinBattle: (battleId: string, fleetId: string) => void;
  leaveBattle: (battleId: string) => void;
  setReady: (battleId: string, fleetId: string, ready: boolean) => void;
  startBattle: (battleId: string) => void;
  sendCommand: (battleId: string, fleetId: string, command: RTBattleCommand) => void;
  requestSnapshot: (battleId: string) => void;
}

interface CreateBattleOptions {
  name?: string;
  battleAreaSize?: 'SMALL' | 'MEDIUM' | 'LARGE' | 'EPIC';
  tickRate?: number;
  rules?: {
    allowRetreat?: boolean;
    retreatDelay?: number;
    friendlyFire?: boolean;
  };
}

interface RTBattleCommand {
  type: 'MOVE' | 'ATTACK' | 'FORMATION' | 'RETREAT' | 'STOP' | 'ROTATE';
  targetPosition?: { x: number; y: number; z: number };
  targetFleetId?: string;
  formationType?: string;
  direction?: { x: number; y: number; z: number };
  heading?: number;
}

// Backend state snapshot format
// Note: ships/maxShips are UNIT counts (1 unit = 300 ships)
interface FleetSnapshot {
  fleetId: string;
  factionId: string;  // Backend uses factionId
  name: string;
  position: { x: number; y: number; z: number };
  velocity: { x: number; y: number; z: number };
  heading: number;
  speed: number;
  hp: number;
  maxHp: number;
  ships: number;        // Unit count
  maxShips: number;     // Max unit count
  totalShips?: number;  // Actual ships (ships * 300)
  maxTotalShips?: number;
  morale: number;
  formation: string;
  isDefeated: boolean;
  isRetreating: boolean;
  currentTarget?: string;
}

interface BattleStateSnapshot {
  battleId: string;
  tick: number;
  timestamp: Date;
  status: string;
  fleets: FleetSnapshot[];
  events: any[];
}

// ============================================================
// Constants
// ============================================================

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

// ============================================================
// Convert backend fleet to frontend unit format
// Note: 1 unit = 300 ships
// ============================================================

const SHIPS_PER_UNIT = 300;

function fleetToUnit(fleet: FleetSnapshot, myFactionId: string | null): TacticalUnitState {
  return {
    id: fleet.fleetId,
    name: fleet.name,
    factionId: fleet.factionId,
    shipClass: 'BATTLESHIP', // TODO: Get from fleet data
    
    // Ships - unit count from backend
    shipCount: fleet.ships,
    maxShipCount: fleet.maxShips,
    totalShips: fleet.totalShips ?? fleet.ships * SHIPS_PER_UNIT,
    maxTotalShips: fleet.maxTotalShips ?? fleet.maxShips * SHIPS_PER_UNIT,
    
    position: fleet.position,
    velocity: fleet.velocity,
    rotation: { x: 0, y: 0, z: 0, w: 1 },
    heading: fleet.heading,
    speed: fleet.speed,
    
    hp: fleet.hp,
    maxHp: fleet.maxHp,
    
    // Shields based on HP
    shieldFront: fleet.maxHp * 0.2,
    shieldRear: fleet.maxHp * 0.15,
    shieldLeft: fleet.maxHp * 0.15,
    shieldRight: fleet.maxHp * 0.15,
    maxShield: fleet.maxHp * 0.2,
    
    morale: fleet.morale,
    
    isDestroyed: fleet.isDefeated,
    isRetreating: fleet.isRetreating,
    
    targetId: fleet.currentTarget || null,
    formationType: (fleet.formation as any) || 'LINE',
    
    commanderId: '',
    commanderName: fleet.name,
  };
}

// ============================================================
// Hook Implementation
// ============================================================

export function useTacticalSocket(options: UseTacticalSocketOptions): UseTacticalSocketReturn {
  const {
    sessionId,
    factionId,
    commanderId,
    token,
    autoConnect = true,
    serverUrl = BACKEND_URL,
  } = options;

  const socketRef = useRef<Socket | null>(null);

  const {
    isConnected,
    battleId,
    latency,
    setConnected,
    setSessionInfo,
    setBattleId,
    handleBattleStart,
    handleBattleUpdate,
    handleBattleEnd,
    handleDamage,
    handleUnitDestroyed,
    setLatency,
    reset,
  } = useGin7TacticalStore();

  // ============================================================
  // Socket Connection - Using /rtbattle namespace
  // ============================================================

  const connect = useCallback(() => {
    if (socketRef.current?.connected) {
      console.warn('[RTBattle] Already connected');
      return;
    }

    // Use /rtbattle namespace to match backend
    const socket = io(`${serverUrl}/rtbattle`, {
      auth: {
        token: token || '',
      },
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 10,
    });

    // Connection events
    socket.on('connect', () => {
      console.log('[RTBattle] Connected to /rtbattle namespace');
      setConnected(true);
      setSessionInfo(sessionId, factionId, commanderId);
    });

    socket.on('disconnect', (reason) => {
      console.log('[RTBattle] Disconnected:', reason);
      setConnected(false);
    });

    socket.on('connect_error', (error) => {
      console.error('[RTBattle] Connection error:', error.message);
      setConnected(false);
    });

    // RTBattle Events (matching backend handler)
    socket.on('rtbattle:created', (data: { battleId: string; battle: any }) => {
      console.log('[RTBattle] Battle created:', data.battleId);
      setBattleId(data.battleId);
    });

    socket.on('rtbattle:joined', (data: { battleId: string; fleetId: string; battle: any; currentState?: BattleStateSnapshot }) => {
      console.log('[RTBattle] Joined battle:', data.battleId);
      setBattleId(data.battleId);
      
      if (data.currentState) {
        const units = data.currentState.fleets.map(f => fleetToUnit(f, factionId));
        handleBattleUpdate({
          battleId: data.battleId,
          tick: data.currentState.tick,
          timestamp: data.currentState.timestamp,
          units,
          projectiles: [],
          effects: [],
        });
      }
    });

    socket.on('rtbattle:started', (data: { battleId: string; tick: number }) => {
      console.log('[RTBattle] Battle started:', data.battleId);
      handleBattleStart({
        battleId: data.battleId,
        mapSize: { width: 5000, height: 5000, depth: 2000 },
        participants: [],
        countdown: 3,
      });
    });

    socket.on('rtbattle:state', (snapshot: BattleStateSnapshot) => {
      // Convert backend fleet format to frontend unit format
      const units = snapshot.fleets.map(f => fleetToUnit(f, factionId));
      
      handleBattleUpdate({
        battleId: snapshot.battleId,
        tick: snapshot.tick,
        timestamp: snapshot.timestamp,
        units,
        projectiles: [],
        effects: [],
      });
    });

    socket.on('rtbattle:state_delta', (data: { battleId: string; tick: number; timestamp: Date; delta: { fleets: FleetSnapshot[] } }) => {
      // Handle delta updates - merge with existing state
      const currentUnits = useGin7TacticalStore.getState().units;
      const updatedFleetIds = new Set(data.delta.fleets.map(f => f.fleetId));
      
      const unchangedUnits = currentUnits.filter(u => !updatedFleetIds.has(u.id));
      const updatedUnits = data.delta.fleets.map(f => fleetToUnit(f, factionId));
      
      handleBattleUpdate({
        battleId: data.battleId,
        tick: data.tick,
        timestamp: data.timestamp,
        units: [...unchangedUnits, ...updatedUnits],
        projectiles: [],
        effects: [],
      });
    });

    socket.on('rtbattle:ended', (data: { battleId: string; tick: number; reason: string; winner?: string }) => {
      console.log('[RTBattle] Battle ended:', data.battleId, 'Winner:', data.winner);
      handleBattleEnd({
        battleId: data.battleId,
        winner: data.winner || null,
        reason: data.reason,
        stats: {
          duration: data.tick * 100,
          totalDamage: {},
          unitsDestroyed: {},
        },
      });
    });

    socket.on('rtbattle:ready_status', (data: any) => {
      console.log('[RTBattle] Ready status:', data);
    });

    socket.on('rtbattle:command_ack', (data: any) => {
      console.log('[RTBattle] Command acknowledged:', data);
    });

    socket.on('rtbattle:error', (data: { message: string }) => {
      console.error('[RTBattle] Error:', data.message);
    });

    socket.on('rtbattle:player_joined', (data: any) => {
      console.log('[RTBattle] Player joined:', data);
    });

    socket.on('rtbattle:player_left', (data: any) => {
      console.log('[RTBattle] Player left:', data);
    });

    socket.on('rtbattle:player_disconnected', (data: any) => {
      console.log('[RTBattle] Player disconnected:', data);
    });

    socketRef.current = socket;
  }, [
    serverUrl,
    sessionId,
    factionId,
    commanderId,
    token,
    setConnected,
    setSessionInfo,
    setBattleId,
    handleBattleStart,
    handleBattleUpdate,
    handleBattleEnd,
    setLatency,
  ]);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    reset();
  }, [reset]);

  // ============================================================
  // Battle Actions (matching backend handler events)
  // ============================================================

  const createBattle = useCallback((fleetIds: string[], options?: CreateBattleOptions) => {
    socketRef.current?.emit('rtbattle:create', {
      sessionId,
      fleetIds,
      name: options?.name,
      battleAreaSize: options?.battleAreaSize || 'MEDIUM',
      tickRate: options?.tickRate || 10,
      rules: options?.rules,
    });
  }, [sessionId]);

  const joinBattle = useCallback((battleId: string, fleetId: string) => {
    socketRef.current?.emit('rtbattle:join', { battleId, fleetId });
  }, []);

  const leaveBattle = useCallback((battleId: string) => {
    socketRef.current?.emit('rtbattle:leave', { battleId });
  }, []);

  const setReady = useCallback((battleId: string, fleetId: string, ready: boolean) => {
    socketRef.current?.emit('rtbattle:ready', { battleId, fleetId, ready });
  }, []);

  const startBattle = useCallback((battleId: string) => {
    socketRef.current?.emit('rtbattle:start', { battleId });
  }, []);

  const sendCommand = useCallback((battleId: string, fleetId: string, command: RTBattleCommand) => {
    socketRef.current?.emit('rtbattle:command', { battleId, fleetId, command });
  }, []);

  const requestSnapshot = useCallback((battleId: string) => {
    socketRef.current?.emit('rtbattle:get_state', { battleId });
  }, []);

  // ============================================================
  // Auto-connect on mount
  // ============================================================

  useEffect(() => {
    if (autoConnect) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [autoConnect, connect, disconnect]);

  return {
    isConnected,
    battleId,
    latency,
    socket: socketRef.current,
    connect,
    disconnect,
    createBattle,
    joinBattle,
    leaveBattle,
    setReady,
    startBattle,
    sendCommand,
    requestSnapshot,
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















