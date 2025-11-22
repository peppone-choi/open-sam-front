/**
 * LOGH (Gin7 Mode) Type Definitions
 * Based on gin7manual.txt
 */

export type FactionType = 'empire' | 'alliance' | 'phezzan' | 'none';

export interface Coordinates {
  x: number;
  y: number;
}

// Strategy Grid Element (P.30)
export interface GridElement {
  x: number;
  y: number;
  type: 'space' | 'star_system' | 'impassable';
  id: string;
}

// Star System (P.30)
export interface StarSystem {
  id: string;
  name: string;
  gridX: number;
  gridY: number;
  faction: FactionType;
  planets: Planet[];
}

export interface Planet {
  id: string;
  name: string;
  type: 'planet' | 'fortress';
  population: number;
}

// Fleet (Strategy View)
export interface Fleet {
  id: string;
  commanderName: string;
  faction: FactionType;
  gridX: number;
  gridY: number;
  size: number;
  status: 'idle' | 'moving' | 'battle';
}

// Job Authority Card (P.26)
export interface JobCard {
  id: string;
  title: string; // e.g., "Fleet Commander"
  rankReq: string;
  commands: CommandType[]; // e.g., ['warp', 'attack']
}

export type CommandType = 'warp' | 'move' | 'attack' | 'supply' | 'personnel' | 'tactics';

// User Profile (P.13)
export interface UserProfile {
  id: string;
  name: string;
  rank: string; // e.g., "Commodore"
  faction: FactionType;
  pcp: number; // Political Command Points (P.26)
  mcp: number; // Military Command Points
  maxPcp: number;
  maxMcp: number;
  jobCards: JobCard[];
  sessionId?: string;
  characterId?: string;
}

export interface GameState {
  year: number;
  month: number;
  day: number;
  hour: number;
}

// Fleet Management
export interface Ship {
  id: string;
  name: string;
  type: 'battleship' | 'cruiser' | 'destroyer' | 'carrier' | 'shuttle';
  durability: number;
  maxDurability: number;
  crew: number;
  maxCrew: number;
  energy: number;
  maxEnergy: number;
  status: 'active' | 'damaged' | 'destroyed';
}

export interface FleetDetail extends Fleet {
  formation: string;
  ships: Ship[];
  morale: number;
  supplies: number;
  ammo: number;
}

export interface HistoryNationSnapshot {
  nation?: number;
  name: string;
  color?: string;
  power?: number;
  gennum?: number;
  cities?: string[];
}

export type HistoryRawEntry =
  | [number | string, string]
  | {
      id?: number | string;
      text?: string;
      title?: string;
      timestamp?: string;
      summary?: string;
    };

export interface HistoryTimelineEvent {
  id: string;
  order: number;
  category: 'global' | 'action' | 'nation' | 'system';
  title: string;
  description?: string;
  timestampLabel?: string;
  html?: string;
}

export interface EntryTraitMeta {
  name: string;
  description: string;
  details: string;
  penalty: string;
  color: string;
  totalMin: number;
  totalMax: number;
  max: number;
}

export interface EntryTimelineHint {
  id: string;
  title: string;
  description: string;
  category?: HistoryTimelineEvent['category'];
}

export const FORMATIONS = [
  { id: 'standard', name: '표준 진형', effect: '밸런스' },
  { id: 'spindle', name: '방추 진형', effect: '돌파력↑ 방어력↓' },
  { id: 'box', name: '방형 진형', effect: '방어력↑ 기동력↓' },
  { id: 'ring', name: '원형 진형', effect: '생존력↑ 공격력↓' },
];
