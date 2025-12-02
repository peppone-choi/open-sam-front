/**
 * 전투 시스템 - 게임 연동 API 인터페이스
 * 
 * 메인 게임과 전투 시스템 간의 데이터 교환을 정의합니다.
 */

import { TWUnitCategory, TWFormation, Vector2 } from '../TotalWarEngine';

// ========================================
// 전투 시작 요청/응답
// ========================================

/** 전투 시작 요청 */
export interface StartBattleRequest {
  /** 공격측 정보 */
  attacker: BattleParticipant;
  /** 방어측 정보 */
  defender: BattleParticipant;
  /** 전투 위치 ID (지형 결정) */
  locationId: string;
  /** 전투 유형 */
  battleType: 'field' | 'siege' | 'ambush' | 'naval';
  /** 환경 설정 */
  environment?: EnvironmentConfig;
}

/** 전투 참여자 정보 */
export interface BattleParticipant {
  /** 세력 ID */
  factionId: string;
  /** 세력 이름 */
  factionName: string;
  /** 세력 색상 */
  colors: {
    primary: string;   // hex
    secondary: string; // hex
  };
  /** 장수 목록 */
  generals: GeneralConfig[];
  /** 부대 목록 */
  troops: TroopConfig[];
  /** 배치 위치 */
  deploymentZone: {
    center: Vector2;
    width: number;
    depth: number;
  };
}

/** 장수 설정 */
export interface GeneralConfig {
  /** 장수 ID (DB 참조) */
  generalId: string;
  /** 장수 이름 */
  name: string;
  /** 장수 유형 */
  type: 'commander' | 'champion' | 'sentinel' | 'vanguard' | 'strategist';
  /** 스탯 */
  stats: {
    leadership: number;   // 통솔 (1~100)
    strength: number;     // 무력 (1~100)
    intelligence: number; // 지력 (1~100)
  };
  /** 특수 능력 ID 목록 */
  abilities: string[];
  /** 무기 ID */
  weaponId: string;
  /** 방어구 ID */
  armorId: string;
  /** 기마 여부 */
  isMounted: boolean;
  /** 소속 부대 인덱스 (troops 배열 내) */
  assignedTroopIndex?: number;
}

/** 부대 설정 */
export interface TroopConfig {
  /** 유닛 타입 ID (VoxelUnitDefinitions 참조) */
  unitTypeId: number;
  /** 부대 이름 */
  name: string;
  /** 병종 카테고리 */
  category: TWUnitCategory;
  /** 병사 수 (실제 병사 수, 50명당 1유닛으로 변환됨) */
  soldierCount: number;
  /** 초기 진형 */
  formation?: TWFormation;
  /** 경험치 레벨 (0: 신병, 1~5: 경험병, 6~9: 정예) */
  experienceLevel: number;
  /** 장비 보정 */
  equipment?: {
    weaponQuality: number;  // 0~1
    armorQuality: number;   // 0~1
  };
  /** 배치 우선순위 (높을수록 전방) */
  deploymentPriority?: number;
}

/** 환경 설정 */
export interface EnvironmentConfig {
  /** 날씨 */
  weather: 'clear' | 'rain' | 'fog' | 'snow' | 'wind';
  /** 시간대 */
  timeOfDay: 'morning' | 'noon' | 'evening' | 'night';
  /** 지형 시드 (맵 생성용) */
  terrainSeed?: number;
}

/** 전투 시작 응답 */
export interface StartBattleResponse {
  /** 전투 ID */
  battleId: string;
  /** 전투 설정 (엔진에 전달) */
  battleConfig: BattleConfig;
  /** WebSocket URL (실시간 관전용) */
  websocketUrl?: string;
  /** 예상 전투 시간 (ms) */
  estimatedDuration: number;
}

/** 전투 엔진 설정 */
export interface BattleConfig {
  /** 맵 크기 */
  mapSize: { width: number; height: number };
  /** 지형 데이터 */
  terrain?: TerrainData;
  /** 환경 효과 */
  environment: EnvironmentConfig;
}

/** 지형 데이터 */
export interface TerrainData {
  /** 지형 셀 그리드 */
  cells: TerrainCell[][];
  /** 특수 지형 (강, 다리 등) */
  features: TerrainFeature[];
}

export interface TerrainCell {
  type: 'plains' | 'forest' | 'hill' | 'river' | 'swamp' | 'road' | 'sand';
  height: number;
  movementCost: number;
}

export interface TerrainFeature {
  type: string;
  position: Vector2;
  size: { width: number; height: number };
  rotation?: number;
}

// ========================================
// 전투 결과
// ========================================

/** 전투 결과 요청 (전투 종료 시 서버로 전송) */
export interface BattleResultRequest {
  /** 전투 ID */
  battleId: string;
  /** 승자 */
  winner: 'attacker' | 'defender' | 'draw';
  /** 전투 시간 (ms) */
  duration: number;
  /** 공격측 결과 */
  attackerResult: ParticipantResult;
  /** 방어측 결과 */
  defenderResult: ParticipantResult;
  /** 보상 정보 */
  rewards?: BattleRewards;
  /** 리플레이 데이터 (압축) */
  replayData?: string;
}

/** 참여자 결과 */
export interface ParticipantResult {
  /** 총 사상자 수 */
  totalCasualties: number;
  /** 생존 부대 목록 */
  survivingTroops: TroopResult[];
  /** 장수 상태 */
  generalResults: GeneralResult[];
  /** 통계 */
  stats: {
    kills: number;
    damageDealt: number;
    damageReceived: number;
    chargesLed: number;
    routsCaused: number;
  };
}

/** 부대 결과 */
export interface TroopResult {
  /** 유닛 타입 ID */
  unitTypeId: number;
  /** 생존 병사 수 */
  survivors: number;
  /** 원래 병사 수 */
  originalCount: number;
  /** 사기 상태 */
  moraleState: 'healthy' | 'shaken' | 'broken';
  /** 경험치 획득량 */
  experienceGained: number;
}

/** 장수 결과 */
export interface GeneralResult {
  /** 장수 ID */
  generalId: string;
  /** 상태 */
  status: 'alive' | 'wounded' | 'captured' | 'killed';
  /** 처치 수 */
  kills: number;
  /** 결투 승리 수 */
  duelWins: number;
  /** 경험치 획득량 */
  experienceGained: number;
  /** 부상 정도 (0~100, 100이면 사망) */
  woundSeverity?: number;
}

/** 전투 보상 */
export interface BattleRewards {
  /** 승리측 경험치 */
  winnerExperience: number;
  /** 패배측 경험치 */
  loserExperience: number;
  /** 노획물 */
  loot: LootItem[];
  /** 포로 장수 ID 목록 */
  prisoners: string[];
  /** 영토 점령 (있는 경우) */
  territoryCaptured?: string;
}

export interface LootItem {
  itemId: string;
  quantity: number;
  type: 'gold' | 'equipment' | 'supply' | 'special';
}

// ========================================
// 실시간 통신 (WebSocket)
// ========================================

/** 클라이언트 → 서버 명령 */
export interface BattleCommand {
  type: BattleCommandType;
  timestamp: number;
  squadId: string;
  data: BattleCommandData;
}

export type BattleCommandType = 
  | 'move'
  | 'attack'
  | 'retreat'
  | 'hold'
  | 'formation'
  | 'stance'
  | 'ability'
  | 'duel';

export type BattleCommandData = 
  | { targetPosition: Vector2 }                    // move
  | { targetSquadId: string }                      // attack
  | { retreatDirection?: number }                  // retreat
  | {}                                              // hold
  | { formation: TWFormation }                     // formation
  | { stance: 'aggressive' | 'defensive' | 'skirmish' } // stance
  | { abilityId: string; targetPosition?: Vector2; targetId?: string } // ability
  | { targetHeroId: string };                      // duel

/** 서버 → 클라이언트 업데이트 */
export interface BattleUpdate {
  type: 'snapshot' | 'event' | 'chat';
  timestamp: number;
  data: BattleUpdateData;
}

export type BattleUpdateData = 
  | BattleSnapshot
  | BattleEvent
  | ChatMessage;

/** 전투 스냅샷 (상태 동기화) */
export interface BattleSnapshot {
  currentTime: number;
  squads: SquadSnapshot[];
  projectiles: ProjectileSnapshot[];
  events: BattleEvent[];
}

export interface SquadSnapshot {
  id: string;
  teamId: 'attacker' | 'defender';
  position: Vector2;
  facing: number;
  state: string;
  aliveSoldiers: number;
  morale: number;
  formation: TWFormation;
  // 병사 위치는 대역폭 절약을 위해 생략 (클라이언트에서 계산)
}

export interface ProjectileSnapshot {
  id: string;
  position: { x: number; y: number; z: number };
  type: string;
}

/** 전투 이벤트 */
export interface BattleEvent {
  type: BattleEventType;
  timestamp: number;
  data: Record<string, unknown>;
}

export type BattleEventType = 
  | 'unit_killed'
  | 'squad_routed'
  | 'squad_rallied'
  | 'charge_started'
  | 'flank_attack'
  | 'duel_started'
  | 'duel_ended'
  | 'ability_used'
  | 'general_killed'
  | 'battle_ended';

/** 채팅 메시지 */
export interface ChatMessage {
  senderId: string;
  senderName: string;
  message: string;
}

// ========================================
// API 클라이언트
// ========================================

/** 전투 API 클라이언트 인터페이스 */
export interface BattleAPIClient {
  /** 전투 시작 */
  startBattle(request: StartBattleRequest): Promise<StartBattleResponse>;
  
  /** 전투 결과 제출 */
  submitResult(request: BattleResultRequest): Promise<void>;
  
  /** 전투 상태 조회 */
  getBattleStatus(battleId: string): Promise<BattleStatus>;
  
  /** WebSocket 연결 */
  connectWebSocket(battleId: string): WebSocket;
}

export interface BattleStatus {
  battleId: string;
  status: 'preparing' | 'active' | 'finished' | 'cancelled';
  currentTime?: number;
  winner?: 'attacker' | 'defender' | 'draw';
}

// ========================================
// 유틸리티 함수
// ========================================

/**
 * TroopConfig를 TotalWarEngine에서 사용하는 형식으로 변환
 */
export function convertTroopToSquadConfig(
  troop: TroopConfig,
  teamId: 'attacker' | 'defender',
  position: Vector2,
  facing: number,
  general?: GeneralConfig
): {
  teamId: 'attacker' | 'defender';
  name: string;
  unitTypeId: number;
  category: TWUnitCategory;
  position: Vector2;
  facing: number;
  soldierCount: number;
  formation: TWFormation;
  leadership: number;
  strength: number;
  intelligence: number;
} {
  // 병사 수를 25명당 1유닛으로 변환 (더 세밀한 전투)
  const unitCount = Math.max(1, Math.ceil(troop.soldierCount / 25));
  
  // 장수 스탯 적용 (없으면 기본값 50)
  const leadership = general?.stats.leadership ?? 50;
  const strength = general?.stats.strength ?? 50;
  const intelligence = general?.stats.intelligence ?? 50;
  
  // 경험치 레벨에 따른 보정 (0~9 레벨, 레벨당 +5%)
  const expMultiplier = 1 + (troop.experienceLevel * 0.05);
  
  return {
    teamId,
    name: troop.name,
    unitTypeId: troop.unitTypeId,
    category: troop.category,
    position,
    facing,
    soldierCount: unitCount,
    formation: troop.formation || 'line',
    leadership: Math.round(leadership * expMultiplier),
    strength: Math.round(strength * expMultiplier),
    intelligence: Math.round(intelligence * expMultiplier),
  };
}

/**
 * 전투 결과에서 DB 업데이트용 데이터 추출
 */
export function extractDBUpdates(result: BattleResultRequest): {
  factionUpdates: Map<string, FactionUpdate>;
  generalUpdates: Map<string, GeneralUpdate>;
  troopUpdates: TroopUpdate[];
} {
  const factionUpdates = new Map<string, FactionUpdate>();
  const generalUpdates = new Map<string, GeneralUpdate>();
  const troopUpdates: TroopUpdate[] = [];
  
  // 공격측/방어측 결과 처리
  [result.attackerResult, result.defenderResult].forEach((participantResult, index) => {
    const isAttacker = index === 0;
    
    // 부대 업데이트
    participantResult.survivingTroops.forEach(troop => {
      troopUpdates.push({
        unitTypeId: troop.unitTypeId,
        casualtyCount: troop.originalCount - troop.survivors,
        experienceGained: troop.experienceGained,
        moraleState: troop.moraleState,
      });
    });
    
    // 장수 업데이트
    participantResult.generalResults.forEach(general => {
      generalUpdates.set(general.generalId, {
        generalId: general.generalId,
        status: general.status,
        experienceGained: general.experienceGained,
        kills: general.kills,
        woundSeverity: general.woundSeverity,
      });
    });
  });
  
  return { factionUpdates, generalUpdates, troopUpdates };
}

interface FactionUpdate {
  factionId: string;
  casualtyCount: number;
  experienceGained: number;
  territoryChange?: string;
}

interface GeneralUpdate {
  generalId: string;
  status: 'alive' | 'wounded' | 'captured' | 'killed';
  experienceGained: number;
  kills: number;
  woundSeverity?: number;
}

interface TroopUpdate {
  unitTypeId: number;
  casualtyCount: number;
  experienceGained: number;
  moraleState: 'healthy' | 'shaken' | 'broken';
}



