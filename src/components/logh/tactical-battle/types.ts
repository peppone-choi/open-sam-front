/**
 * LOGH Tactical Battle Types
 * 은하영웅전설 스타일 전술 전투 타입 정의
 */

// ===== 기본 타입 =====
export interface Position {
  x: number;
  y: number;
}

export interface TacticalPosition extends Position {
  heading: number; // 0-360도
}

// ===== 카메라 =====
export interface Camera {
  x: number;
  y: number;
  zoom: number;
}

// ===== 진형 타입 =====
export type Formation =
  | 'fishScale'    // 어린 - 돌파용
  | 'craneWing'    // 학익 - 포위용
  | 'circular'     // 방원 - 방어용
  | 'arrowhead'    // 봉시 - 기동용
  | 'longSnake';   // 장사 - 회피용

// 진형 한글명
export const FORMATION_NAMES: Record<Formation, string> = {
  fishScale: '어린(魚鱗)',
  craneWing: '학익(鶴翼)',
  circular: '방원(方圓)',
  arrowhead: '봉시(鋒矢)',
  longSnake: '장사(長蛇)',
};

// 진형 설명
export const FORMATION_DESCRIPTIONS: Record<Formation, string> = {
  fishScale: '공격력 +15%, 돌파력 증가',
  craneWing: '포위 공격, 측면 공격력 +20%',
  circular: '방어력 +20%, 전방위 대응',
  arrowhead: '기동력 +30%, 돌격 보너스',
  longSnake: '회피력 +25%, 후퇴 용이',
};

// ===== 진영 =====
export type Faction = 'empire' | 'alliance' | 'phezzan' | 'neutral';

export const FACTION_COLORS: Record<Faction, string> = {
  empire: '#4488ff',    // 은하제국 - 파랑
  alliance: '#ff4444',  // 자유행성동맹 - 빨강
  phezzan: '#ffcc00',   // 페잔 - 노랑
  neutral: '#888888',   // 중립 - 회색
};

// 함선 색상 (진한 톤)
export const FACTION_SHIP_COLORS: Record<Faction, string> = {
  empire: '#1a3366',    // 은하제국 - 검파랑
  alliance: '#228b22',  // 자유행성동맹 - 녹색
  phezzan: '#b8860b',   // 페잔 - 진한 노랑
  neutral: '#555555',   // 중립 - 진한 회색
};

export const FACTION_NAMES: Record<Faction, string> = {
  empire: '은하제국',
  alliance: '자유행성동맹',
  phezzan: '페잔',
  neutral: '중립',
};

// ===== 제독 =====
export interface Admiral {
  id: string;
  name: string;
  portrait?: string;
  command: number;      // 통솔 (0-100)
  combat: number;       // 전투 (0-100)
  intelligence: number; // 지략 (0-100)
  politics: number;     // 정치 (0-100)
  charisma: number;     // 매력 (0-100)
  skills: string[];
}

// ===== 함대 =====
export interface Fleet {
  id: string;
  name: string;
  faction: Faction;
  commander: Admiral;
  
  // 위치 및 상태
  tacticalPosition: TacticalPosition;
  targetPosition?: Position;
  
  // 함선 정보
  totalShips: number;
  maxShips: number;
  shipTypes: {
    battleship: number;
    cruiser: number;
    destroyer: number;
    carrier: number;
    engineering: number;
  };
  
  // 전투 상태
  hp: number;
  maxHp: number;
  morale: number;       // 사기 (0-100)
  supply: number;       // 보급 (0-100)
  
  // 진형 및 속도
  formation: Formation;
  speed: number;
  attackRange: number;  // 사정거리
  
  // 플래그
  isFlagship: boolean;
  isSelected: boolean;
  isMoving: boolean;
  isAttacking: boolean;
  
  // 전투 정보
  targetFleetId?: string;
  lastAttackTime?: number;
}

// ===== 전투 명령 =====
export type CommandType =
  | 'move'
  | 'parallelMove'
  | 'turn'
  | 'stop'
  | 'attack'
  | 'volleyAttack'
  | 'continuousAttack'
  | 'stopAttack'
  | 'changeFormation'
  | 'retreat';

export interface BattleCommand {
  type: CommandType;
  fleetIds: string[];
  targetPosition?: Position;
  targetFleetId?: string;
  formation?: Formation;
}

// 명령 정보
export const COMMAND_INFO: Record<CommandType, { name: string; shortcut: string; description: string }> = {
  move: { name: '이동', shortcut: 'F', description: '지정 위치로 이동' },
  parallelMove: { name: '평행이동', shortcut: 'D', description: '진행 방향 유지하며 이동' },
  turn: { name: '선회', shortcut: 'S', description: '방향 전환' },
  stop: { name: '정지', shortcut: 'A', description: '현재 위치에서 정지' },
  attack: { name: '공격', shortcut: 'R', description: '적 함대 공격' },
  volleyAttack: { name: '일제 사격', shortcut: 'E', description: '모든 화기 동시 발사' },
  continuousAttack: { name: '연속 공격', shortcut: 'W', description: '지속적으로 공격' },
  stopAttack: { name: '공격 중지', shortcut: 'Q', description: '공격 중단' },
  changeFormation: { name: '진형 변경', shortcut: 'Z', description: '함대 진형 변경' },
  retreat: { name: '후퇴', shortcut: 'T', description: '전투에서 이탈' },
};

// ===== 전투 이펙트 =====
export interface BattleEffect {
  id: string;
  type: 'laser' | 'missile' | 'explosion' | 'shield';
  startPosition: Position;
  endPosition?: Position;
  startTime: number;
  duration: number;
  color: string;
}

// ===== 전투 상태 =====
export interface BattleState {
  battleId: string;
  tacticalMapId: string;
  fleets: Fleet[];
  effects: BattleEffect[];
  currentTime: number;
  isPaused: boolean;
  winner?: Faction;
}

// ===== 맵 상수 =====
export const MAP_SIZE = 10000;
export const MIN_ZOOM = 0.02;
export const MAX_ZOOM = 2.0;
export const DEFAULT_ZOOM = 0.1;
export const GRID_SIZE = 1000;

// ===== 색상 상수 =====
export const COLORS = {
  // 배경
  spaceBg: '#0a0a1a',
  nebula: 'rgba(100, 50, 150, 0.3)',
  
  // 네온
  neonBlue: '#00d4ff',
  neonGreen: '#00ff88',
  neonRed: '#ff3366',
  neonYellow: '#ffcc00',
  neonPurple: '#cc66ff',
  
  // HUD
  hudBg: 'rgba(10, 10, 26, 0.9)',
  hudBorder: 'rgba(0, 212, 255, 0.3)',
  hudText: '#e0e0e0',
  
  // 상태
  hpHigh: '#00ff88',
  hpMid: '#ffcc00',
  hpLow: '#ff3366',
  
  // 선택
  selection: '#ffd700',
  attackRange: 'rgba(255, 51, 102, 0.2)',
  moveTarget: '#00ff88',
};

