/**
 * 복셀 전투 상태 관리 타입 정의
 * @module voxelBattleTypes
 */

// ============================================================================
// 전투 페이즈
// ============================================================================

export type BattlePhase = 'loading' | 'ready' | 'running' | 'paused' | 'ended';

export type BattleSpeed = 0.5 | 1 | 2 | 4;

// ============================================================================
// 지형 및 날씨
// ============================================================================

export type TerrainType = 
  | 'plains' 
  | 'forest' 
  | 'mountain' 
  | 'river' 
  | 'city' 
  | 'castle';

export type WeatherType = 
  | 'clear' 
  | 'rain' 
  | 'snow' 
  | 'fog' 
  | 'storm';

// ============================================================================
// 부대 상태
// ============================================================================

export type SquadStateType = 'idle' | 'moving' | 'fighting' | 'routing' | 'dead';

export type FormationType = 
  | 'line' 
  | 'column' 
  | 'wedge' 
  | 'square' 
  | 'circle' 
  | 'scatter';

export interface Position3D {
  x: number;
  y: number;
  z: number;
}

export interface SoldierState {
  id: string;
  position: Position3D;
  health: number;
  maxHealth: number;
  isAlive: boolean;
  animation: string;
}

export interface SquadState {
  id: string;
  unitId: number;           // units.json ID (= VoxelUnitDefinitions ID)
  unitName: string;
  soldiers: SoldierState[];
  totalSoldiers: number;
  aliveSoldiers: number;
  formation: FormationType;
  facing: number;           // 0-360 degrees
  state: SquadStateType;
  position: Position3D;     // 부대 중심 위치
  targetSquadId: string | null;
  morale: number;           // 0-100
  experience: number;
}

export interface ForceState {
  generalId: number;
  generalName: string;
  nationId: number;
  squads: SquadState[];
  totalUnits: number;
  remainingUnits: number;
  morale: number;           // 전체 부대 평균 사기
}

// ============================================================================
// 전투 통계
// ============================================================================

export interface BattleStats {
  elapsedTime: number;      // 경과 시간 (ms)
  attackerKills: number;
  defenderKills: number;
  attackerMorale: number;
  defenderMorale: number;
  attackerRemaining: number;
  defenderRemaining: number;
}

// ============================================================================
// 전투 이벤트
// ============================================================================

export type BattleEventType = 
  | 'battle_start'
  | 'battle_end'
  | 'unit_killed'
  | 'squad_routing'
  | 'squad_rallied'
  | 'squad_destroyed'
  | 'general_skill'
  | 'morale_change'
  | 'formation_change';

export interface BattleEventBase {
  id: string;
  timestamp: number;
}

export interface BattleStartEvent extends BattleEventBase {
  type: 'battle_start';
}

export interface BattleEndEvent extends BattleEventBase {
  type: 'battle_end';
  winner: 'attacker' | 'defender' | 'draw';
}

export interface UnitKilledEvent extends BattleEventBase {
  type: 'unit_killed';
  victimId: string;
  victimSquadId: string;
  killerId: string | null;
  killerSquadId: string | null;
}

export interface SquadRoutingEvent extends BattleEventBase {
  type: 'squad_routing';
  squadId: string;
  side: 'attacker' | 'defender';
}

export interface SquadRalliedEvent extends BattleEventBase {
  type: 'squad_rallied';
  squadId: string;
  side: 'attacker' | 'defender';
}

export interface SquadDestroyedEvent extends BattleEventBase {
  type: 'squad_destroyed';
  squadId: string;
  side: 'attacker' | 'defender';
}

export interface GeneralSkillEvent extends BattleEventBase {
  type: 'general_skill';
  generalId: number;
  generalName: string;
  skill: string;
  side: 'attacker' | 'defender';
}

export interface MoraleChangeEvent extends BattleEventBase {
  type: 'morale_change';
  squadId: string;
  oldMorale: number;
  newMorale: number;
  reason: string;
}

export interface FormationChangeEvent extends BattleEventBase {
  type: 'formation_change';
  squadId: string;
  oldFormation: FormationType;
  newFormation: FormationType;
}

export type BattleEvent =
  | BattleStartEvent
  | BattleEndEvent
  | UnitKilledEvent
  | SquadRoutingEvent
  | SquadRalliedEvent
  | SquadDestroyedEvent
  | GeneralSkillEvent
  | MoraleChangeEvent
  | FormationChangeEvent;

// ============================================================================
// 전투 초기화 / 결과
// ============================================================================

export interface BattleUnitInit {
  unitId: number;           // units.json ID
  count: number;            // 병력 수
  morale: number;           // 사기
  experience: number;       // 경험치
}

export interface BattleForceInit {
  generalId: number;
  generalName: string;
  nationId: number;
  units: BattleUnitInit[];
}

export interface VoxelBattleInit {
  battleId: string;
  attacker: BattleForceInit;
  defender: BattleForceInit;
  terrain: TerrainType;
  weather: WeatherType;
}

export interface BattleResult {
  winner: 'attacker' | 'defender' | 'draw';
  attackerLosses: number;
  defenderLosses: number;
  attackerSurvivors: number;
  defenderSurvivors: number;
  duration: number;
  events: BattleEvent[];
  experienceGained: {
    attacker: number;
    defender: number;
  };
}

// ============================================================================
// 스토어 인터페이스
// ============================================================================

export interface VoxelBattleState {
  // 전투 메타데이터
  battleId: string | null;
  phase: BattlePhase;
  speed: BattleSpeed;
  terrain: TerrainType | null;
  weather: WeatherType | null;

  // 부대 상태
  attackerForce: ForceState | null;
  defenderForce: ForceState | null;

  // 실시간 통계
  stats: BattleStats;

  // 이벤트 로그
  events: BattleEvent[];
  maxEvents: number;

  // 전투 결과
  result: BattleResult | null;
}

export interface VoxelBattleActions {
  // 전투 라이프사이클
  initBattle: (data: VoxelBattleInit) => void;
  startBattle: () => void;
  pauseBattle: () => void;
  resumeBattle: () => void;
  setSpeed: (speed: BattleSpeed) => void;
  endBattle: (result: BattleResult) => void;
  resetBattle: () => void;

  // 부대 상태 업데이트
  updateSquadState: (
    side: 'attacker' | 'defender',
    squadId: string,
    updates: Partial<SquadState>
  ) => void;
  updateSoldierState: (
    side: 'attacker' | 'defender',
    squadId: string,
    soldierId: string,
    updates: Partial<SoldierState>
  ) => void;
  updateMorale: (
    side: 'attacker' | 'defender',
    squadId: string,
    morale: number
  ) => void;
  removeUnit: (
    side: 'attacker' | 'defender',
    squadId: string,
    soldierId: string
  ) => void;
  destroySquad: (side: 'attacker' | 'defender', squadId: string) => void;

  // 이벤트 관리
  addEvent: (event: Omit<BattleEvent, 'id' | 'timestamp'> & { type: BattleEvent['type'] }) => void;
  clearEvents: () => void;

  // 통계 업데이트
  updateStats: (updates: Partial<BattleStats>) => void;
  incrementKills: (side: 'attacker' | 'defender', count?: number) => void;
  tick: (deltaTime: number) => void;
}

export type VoxelBattleStore = VoxelBattleState & VoxelBattleActions;





