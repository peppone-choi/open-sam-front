/**
 * 전투 리플레이 타입 정의
 * 
 * 턴제 전투의 리플레이 데이터 구조를 정의합니다.
 */

// ========================================
// 기본 타입
// ========================================

export interface Position {
  x: number;
  y: number;
}

// ========================================
// 유닛 타입
// ========================================

export interface ReplayUnit {
  /** 유닛 고유 ID */
  id: string;
  /** 장수 ID */
  generalId: number;
  /** 장수 이름 */
  generalName: string;
  /** 현재 위치 */
  position: Position;
  /** 현재 병력 */
  crew: number;
  /** 최대 병력 */
  maxCrew: number;
  /** 병종 타입 */
  crewType: number;
  /** 현재 HP */
  hp: number;
  /** 최대 HP */
  maxHp: number;
  /** 적/아군 여부 */
  isEnemy: boolean;
  /** 사기 */
  morale: number;
  /** 공격력 */
  attack: number;
  /** 방어력 */
  defense: number;
}

// ========================================
// 액션 타입
// ========================================

export type ActionType = 
  | 'move'       // 이동
  | 'attack'     // 공격
  | 'skill'      // 특수 스킬
  | 'wait'       // 대기
  | 'death';     // 사망

export interface BaseAction {
  /** 액션 타입 */
  type: ActionType;
  /** 액션 수행 유닛 ID */
  unitId: string;
  /** 타임스탬프 (ms) */
  timestamp: number;
}

export interface MoveAction extends BaseAction {
  type: 'move';
  /** 시작 위치 */
  from: Position;
  /** 목표 위치 */
  to: Position;
}

export interface AttackAction extends BaseAction {
  type: 'attack';
  /** 공격 대상 ID */
  targetId: string;
  /** 데미지 */
  damage: number;
  /** 크리티컬 여부 */
  isCritical: boolean;
  /** 회피 여부 */
  isEvaded: boolean;
  /** 대상 남은 HP */
  targetHpAfter: number;
  /** 대상 남은 병력 */
  targetCrewAfter: number;
  /** 대상 사망 여부 */
  targetDied: boolean;
}

export interface SkillAction extends BaseAction {
  type: 'skill';
  /** 스킬 이름 */
  skillName: string;
  /** 대상 ID (선택적) */
  targetId?: string;
  /** 스킬 효과 */
  effect: string;
  /** 효과 값 */
  value?: number;
}

export interface WaitAction extends BaseAction {
  type: 'wait';
}

export interface DeathAction extends BaseAction {
  type: 'death';
}

export type TurnAction = MoveAction | AttackAction | SkillAction | WaitAction | DeathAction;

// ========================================
// 턴 로그
// ========================================

export interface TurnLog {
  /** 턴 번호 */
  turnNumber: number;
  /** 페이즈 (아군/적군) */
  phase: 'player' | 'enemy';
  /** 해당 턴의 액션들 */
  actions: TurnAction[];
  /** 턴 시작 시 유닛 상태 스냅샷 */
  unitSnapshot: ReplayUnit[];
}

// ========================================
// 리플레이 데이터
// ========================================

export interface ReplayData {
  /** 리플레이 ID */
  id: string;
  /** 버전 */
  version: string;
  /** 생성 시간 */
  createdAt: number;
  /** 전투 메타데이터 */
  metadata: ReplayMetadata;
  /** 초기 유닛 상태 */
  initialUnits: ReplayUnit[];
  /** 턴별 로그 */
  turns: TurnLog[];
  /** 최종 결과 */
  result: ReplayResult;
}

export interface ReplayMetadata {
  /** 전투 이름/설명 */
  title: string;
  /** 맵 크기 */
  mapSize: { width: number; height: number };
  /** 지형 타입 */
  terrainType: string;
  /** 공격측 세력 이름 */
  attackerFaction: string;
  /** 방어측 세력 이름 */
  defenderFaction: string;
  /** 총 시간 (ms) */
  duration: number;
}

export interface ReplayResult {
  /** 승자 */
  winner: 'player' | 'enemy' | 'draw';
  /** 아군 생존 유닛 수 */
  allyRemaining: number;
  /** 적군 생존 유닛 수 */
  enemyRemaining: number;
  /** 아군 총 처치 수 */
  allyKills: number;
  /** 적군 총 처치 수 */
  enemyKills: number;
}

// ========================================
// 재생 상태
// ========================================

export interface PlaybackState {
  /** 재생 중 여부 */
  isPlaying: boolean;
  /** 현재 턴 인덱스 */
  currentTurnIndex: number;
  /** 현재 액션 인덱스 */
  currentActionIndex: number;
  /** 재생 속도 (1x, 2x, 4x 등) */
  speed: number;
  /** 총 턴 수 */
  totalTurns: number;
}

// ========================================
// 데미지 팝업
// ========================================

export interface DamagePopup {
  id: string;
  position: Position;
  damage: number;
  isCritical: boolean;
  isEvaded: boolean;
}

// ========================================
// 애니메이션 상태
// ========================================

export interface AnimationState {
  /** 현재 애니메이션 중인 유닛 ID */
  unitId: string | null;
  /** 애니메이션 타입 */
  type: 'idle' | 'moving' | 'attacking' | 'hit' | 'death';
  /** 대상 위치 (이동/공격용) */
  targetPosition?: Position;
  /** 대상 유닛 ID (공격용) */
  targetUnitId?: string;
}

