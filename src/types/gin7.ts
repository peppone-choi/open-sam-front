import { CommandType, Coordinates, UserProfile } from '@/types/logh';

export type Gin7Faction = 'empire' | 'alliance' | 'phezzan' | 'neutral';

export interface Gin7StrategicCell {
  x: number;
  y: number;
  type: 'space' | 'star_system' | 'impassable';
  label?: string;
  navigable: boolean;
  density?: number;
}

export interface Gin7FleetMarker {
  id: string;
  name: string;
  faction: Gin7Faction;
  x: number;
  y: number;
  status: 'idle' | 'moving' | 'engaging' | 'retreating';
  cpLoad: { pcp: number; mcp: number };
  isFlagship: boolean;
}

export interface Gin7CommandShortcut {
  key: string;
  label: string;
  description: string;
  type: CommandType;
}

export interface Gin7AuthorityCard {
  id: string;
  title: string;
  rank: string;
  faction: Gin7Faction;
  commands: CommandType[];
  shortcuts: Gin7CommandShortcut[];
}

export interface Gin7CommandPlan {
  id: string;
  objective: 'occupy' | 'defend' | 'sweep';
  target: string;
  plannedStart: string;
  participants: string[];
  status: 'draft' | 'issued' | 'active' | 'completed';
  notes?: string;
}

export interface Gin7EnergyProfile {
  beam: number;
  gun: number;
  shield: number;
  engine: number;
  warp: number;
  sensor: number;
}

export interface Gin7TacticalUnit {
  id: string;
  name: string;
  type: 'flagship' | 'capital' | 'escort' | 'fortress';
  hp: number;
  maxHp: number;
  energy: number;
  maxEnergy: number;
  position: { row: number; col: number };
  heading: number;
  faction: Gin7Faction;
}

export interface Gin7ChatMessage {
  id: string;
  channel: 'global' | 'fleet' | 'faction';
  author: string;
  text: string;
  timestamp: string;
}

export interface Gin7StrategicState {
  gridWidth: number;
  gridHeight: number;
  cells: Gin7StrategicCell[];
  fleets: Gin7FleetMarker[];
  viewport: Coordinates;
}

export interface Gin7TacticalState {
  units: Gin7TacticalUnit[];
  energy: Gin7EnergyProfile;
  radarHeat: number;
}

export interface Gin7SessionOverview {
  profile: UserProfile;
  cpRegenSeconds: number;
  cards: Gin7AuthorityCard[];
}

export interface Gin7ApiBundle {
  session: Gin7SessionOverview;
  strategic: Gin7StrategicState;
  plans: Gin7CommandPlan[];
  tactical: Gin7TacticalState;
  chat: Gin7ChatMessage[];
}

export interface Gin7TelemetrySample {
  scene: 'strategy' | 'tactical' | string;
  avgFps: number;
  cpuPct: number;
  memoryMb: number;
  sampleCount: number;
  durationMs: number;
  collectedAt: string;
}

export interface Gin7LoopStats {
  lastTickDurationMs: number;
  avgTickDurationMs: number;
  maxTickDurationMs: number;
  sampleCount: number;
  consecutiveFailures: number;
  lastTickCompletedAt?: string;
  lastAlertAt?: string;
  lastAlertReason?: string;
}

export interface Gin7SessionSnapshot {
  schemaVersion: string;
  session: {
    sessionId: string;
    title: string;
    status: string;
    logisticWindowHours: number;
    factions: Array<{
      name: string;
      slots: number;
      activePlayers: number;
      status: string;
    }>;
    notifications: Array<{
      message: string;
      createdAt: string | Date;
      manualRef?: string;
    }>;
  };
  clock: {
    gameTime?: string;
    lastRealTickAt?: string;
    phase: string;
    manuallyPaused: boolean;
    loopStats?: Gin7LoopStats;
  };
  cards: {
    total: number;
    byStatus: Record<string, number>;
    byCategory: Record<string, number>;
    recentAssignments: Array<{
      cardId: string;
      title: string;
      holderCharacterId?: string;
      lastIssuedAt?: string;
    }>;
  };
  commandPoints: {
    rosterSize: number;
    totals: { pcp: number; mcp: number };
    average: { pcp: number; mcp: number };
    lowCapacity: number;
    substitutionDebt: number;
    lastRecoverySample: Array<{
      characterId: string;
      displayName: string;
      faction: string;
      rank: string;
      pcp: number;
      mcp: number;
      lastRecoveredAt?: string;
    }>;
  };
  shortcuts: Array<{
    cardId: string;
    title: string;
    category?: string;
    status: string;
    commandGroups: string[];
    commandCodes: string[];
    holderCharacterId?: string;
    lastIssuedAt?: string;
  }>;
}

export interface Gin7OperationHotspot {
  operationId: string;
  code: string;
  objectiveType: string;
  status: string;
  targetGrid: { x: number; y: number };
  waitHours?: number;
  executionHours?: number;
  issuedAt?: string;
  logistics?: {
    fuelCrates?: number;
    supplyHours?: number;
    unitBatchLimit?: number;
    planetsTouched?: string[];
  };
  authorCharacterId?: string;
  participants: Array<{ characterId: string; role: string; status: string }>;
}

export interface Gin7StrategySnapshot {
  schemaVersion: string;
  session: {
    sessionId: string;
    title: string;
    status: string;
  };
  clock?: {
    phase: string;
    gameTime?: string;
    loopStats?: Gin7LoopStats;
  };
  map: {
    meta: {
      width: number;
      height: number;
      systemCount: number;
      warpRouteCount: number;
    };
    starSystems: Array<{
      systemId: string;
      systemNumber: number;
      name: string;
      faction: string;
      grid: { x: number; y: number };
      strategicValue?: string;
      territoryType?: string;
      warpRoutes?: string[];
    }>;
  };
  fleets: Array<{
    fleetId: string;
    name: string;
    faction: Gin7Faction | string;
    status: string;
    commanderName?: string;
    position: { x: number; y: number };
    destination?: { x: number; y: number };
    isMoving: boolean;
    movementSpeed: number;
    movementRange?: number;
    totalShips: number;
    morale: number;
    supplies: number;
    fuel: number;
    formation: string;
    inCombat: boolean;
    tacticalMapId?: string;
    updatedAt?: string;
  }>;
  operationHotspots: Gin7OperationHotspot[];
}
