/**
 * Gin7 Tactical Combat Types (Frontend)
 * Backend tactical.types.ts와 동기화
 */

// ============================================================
// Vector & Math Types
// ============================================================

export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

export interface Quaternion {
  x: number;
  y: number;
  z: number;
  w: number;
}

// ============================================================
// Energy Distribution System
// ============================================================

export interface EnergyDistribution {
  beam: number;      // 빔 무기 출력
  gun: number;       // 실탄 무기 출력
  shield: number;    // 쉴드 재생
  engine: number;    // 추진력/기동성
  warp: number;      // 워프 충전 (전투 중 탈출용)
  sensor: number;    // 센서/조준 보정
}

export const DEFAULT_ENERGY_DISTRIBUTION: EnergyDistribution = {
  beam: 20,
  gun: 20,
  shield: 20,
  engine: 20,
  warp: 0,
  sensor: 20,
};

// ============================================================
// Ship Classes
// ============================================================

export type ShipClass = 
  | 'FLAGSHIP'
  | 'BATTLESHIP'
  | 'CRUISER'
  | 'DESTROYER'
  | 'FRIGATE'
  | 'CARRIER'
  | 'TRANSPORT'
  | 'FORTRESS';

// ============================================================
// Unit State
// ============================================================

export interface TacticalUnitState {
  id: string;
  position: Vector3;
  rotation: Quaternion;
  velocity: Vector3;
  angularVelocity: Vector3;
  
  // HP & Shields
  hp: number;
  maxHp: number;
  shieldFront: number;
  shieldRear: number;
  shieldLeft: number;
  shieldRight: number;
  maxShield: number;
  
  // Combat
  armor: number;
  morale: number;
  
  // Resources
  fuel: number;
  maxFuel: number;
  ammo: number;
  maxAmmo: number;
  
  // Ship info
  shipClass: ShipClass;
  shipCount: number;
  
  // Ownership
  factionId: string;
  commanderId: string;
  fleetId: string;
  
  // Status
  isDestroyed: boolean;
  isChaos: boolean;
  
  // Energy Distribution
  energyDistribution: EnergyDistribution;
  
  // Targeting
  targetId?: string;
  targetPosition?: Vector3;
}

// ============================================================
// Battle Types
// ============================================================

export type BattleStatus = 'WAITING' | 'COUNTDOWN' | 'RUNNING' | 'PAUSED' | 'ENDED';

export interface BattleParticipant {
  factionId: string;
  fleetIds: string[];
  commanderIds: string[];
  ready: boolean;
  retreated: boolean;
  surrendered: boolean;
}

export interface CasualtyReport {
  shipsLost: number;
  shipsDestroyed: number;
  damageDealt: number;
  damageTaken: number;
  creditsLost: number;
}

export interface BattleResult {
  winnerId: string | null;
  reason: 'ANNIHILATION' | 'RETREAT' | 'SURRENDER' | 'TIMEOUT' | 'DRAW';
  casualties: Record<string, CasualtyReport>;
  duration: number;
  endTime: Date;
}

// ============================================================
// Projectile & Effect States
// ============================================================

export interface ProjectileState {
  id: string;
  type: 'BEAM' | 'BULLET' | 'MISSILE';
  position: Vector3;
  velocity: Vector3;
  sourceId: string;
  targetId?: string;
  damage: number;
  lifetime: number;
}

export interface EffectState {
  id: string;
  type: 'EXPLOSION' | 'SHIELD_HIT' | 'BEAM_FIRE' | 'ENGINE_FLARE';
  position: Vector3;
  scale: number;
  duration: number;
  startTick: number;
}

// ============================================================
// Commands (Client -> Server)
// ============================================================

export type TacticalCommandType = 
  | 'MOVE'
  | 'ATTACK'
  | 'STOP'
  | 'FORMATION'
  | 'ENERGY_DISTRIBUTION'
  | 'RETREAT'
  | 'SURRENDER';

export type FormationType = 
  | 'LINE'
  | 'WEDGE'
  | 'CIRCLE'
  | 'SPREAD'
  | 'DEFENSIVE'
  | 'ASSAULT';

export interface TacticalCommand {
  type: TacticalCommandType;
  unitIds: string[];
  timestamp: number;
  data: TacticalCommandData;
}

export type TacticalCommandData = 
  | MoveCommandData
  | AttackCommandData
  | StopCommandData
  | FormationCommandData
  | EnergyDistributionCommandData
  | RetreatCommandData
  | SurrenderCommandData;

export interface MoveCommandData {
  targetPosition: Vector3;
  formation?: FormationType;
}

export interface AttackCommandData {
  targetId: string;
  attackType?: 'ALL' | 'BEAM' | 'GUN' | 'MISSILE';
}

export interface StopCommandData {
  holdPosition: boolean;
}

export interface FormationCommandData {
  formation: FormationType;
}

export interface EnergyDistributionCommandData {
  distribution: EnergyDistribution;
}

export interface RetreatCommandData {
  direction?: Vector3;
}

export interface SurrenderCommandData {
  // No additional data
}

// ============================================================
// Events (Server -> Client)
// ============================================================

export interface BattleStartEvent {
  battleId: string;
  gridId: string;
  participants: BattleParticipant[];
  mapSize: { width: number; height: number; depth: number };
  startTime: number;
}

export interface BattleUpdateEvent {
  battleId: string;
  tick: number;
  timestamp: number;
  units: TacticalUnitState[];
  projectiles: ProjectileState[];
  effects: EffectState[];
}

export interface BattleEndEvent {
  battleId: string;
  result: BattleResult;
}

export interface UnitDestroyedEvent {
  battleId: string;
  unitId: string;
  destroyedBy: string;
  position: Vector3;
  timestamp: number;
}

export interface DamageEvent {
  battleId: string;
  sourceId: string;
  targetId: string;
  damage: number;
  damageType: 'BEAM' | 'GUN' | 'MISSILE' | 'COLLISION';
  shieldAbsorbed: number;
  armorReduced: number;
  hpDamage: number;
  position: Vector3;
}

// ============================================================
// UI State
// ============================================================

export interface TacticalUIState {
  // Connection
  isConnected: boolean;
  battleId: string | null;
  
  // Battle state
  status: BattleStatus;
  tick: number;
  
  // Units
  units: TacticalUnitState[];
  projectiles: ProjectileState[];
  effects: EffectState[];
  
  // Selection
  selectedUnitIds: Set<string>;
  hoveredUnitId: string | null;
  
  // Camera
  cameraPosition: Vector3;
  cameraZoom: number;
  
  // UI panels
  showEnergyPanel: boolean;
  showCommandPanel: boolean;
  showRadar: boolean;
  
  // Participants
  myFactionId: string | null;
  participants: BattleParticipant[];
}

// ============================================================
// Constants
// ============================================================

export const TACTICAL_CONSTANTS = {
  TICK_INTERVAL_MS: 60,
  TICKS_PER_SECOND: 16,
  MAP_SIZE: { width: 10000, height: 10000, depth: 5000 },
  MAX_VELOCITY: 100,
  BEAM_SPEED: 500,
  BULLET_SPEED: 200,
  MISSILE_SPEED: 80,
};

// ============================================================
// Color Schemes
// ============================================================

export const FACTION_COLORS = {
  empire: {
    primary: '#FFD700', // Gold
    secondary: '#4A4A4A', // Dark gray
    highlight: '#FFF8DC', // Cornsilk
  },
  alliance: {
    primary: '#1E90FF', // Dodger blue
    secondary: '#2F4F4F', // Dark slate gray
    highlight: '#87CEEB', // Sky blue
  },
  phezzan: {
    primary: '#32CD32', // Lime green
    secondary: '#3A3A3A',
    highlight: '#98FB98', // Pale green
  },
  neutral: {
    primary: '#808080',
    secondary: '#2A2A2A',
    highlight: '#C0C0C0',
  },
} as const;

export type FactionId = keyof typeof FACTION_COLORS;








