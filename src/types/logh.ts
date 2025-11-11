/**
 * LOGH (은하영웅전설) 타입 정의
 * 백엔드 scenario.json 스키마 기반
 */

// 제독 (Admiral/Commander)
export interface Admiral {
  no: number;
  name: string;
  faction: 'empire' | 'alliance' | 'phezzan';
  star_system?: number;
  
  // 능력치
  leadership: number;      // 통솔 (인재활용, 함대사기)
  politics: number;        // 정치 (시민 지지율)
  operations: number;      // 운영 (행정 관리)
  intelligence: number;    // 정보 (정보수집, 스파이)
  command: number;         // 지휘 (함선 행동 속도)
  maneuver: number;        // 기동 (함대 이동)
  attack: number;          // 공격 (공격력)
  defense: number;         // 방어 (방어력)
  
  // 상태
  age: number;
  rank: number;            // 1=이등병, 12=원수
  merit: number;           // 공적 포인트
  evaluation: number;      // 평가 포인트
  fame: number;            // 명성 포인트
  
  // 함대
  fleet_id?: string;
  
  // 위치
  position?: {
    system: string;
    x: number;
    y: number;
    z: number;
  };
}

// 항성계 (Star System)
export interface StarSystem {
  id: number;
  name: string;
  faction: number;  // 1=제국, 2=동맹, 3=페잔, 0=중립
  
  // 속성
  population: number;
  defense: number;
  loyalty: number;
  industry: number;
  technology: number;
  resources: number;
  
  // 시설
  slots: {
    industry?: number;     // 조선소
    research?: number;     // 연구소
    resources?: number;    // 자원 채굴
    defense?: number;      // 요새
    garrison?: number;     // 주둔 함대
  };
  
  // 위치
  position?: {
    x: number;
    y: number;
    sector: string;
  };
}

// 세력 (Faction)
export interface Faction {
  id: number;
  name: string;
  nameEn: string;
  color: string;
  capital: string;
  leader: string;
  description: string;
  
  // 속성
  technology: number;
  prestige: number;
  legitimacy: number;
  public_support: number;
  
  // 자원
  military_budget?: number;
  resources?: number;
  manpower?: number;
}

// 함대 (Fleet)
export interface Fleet {
  id: string;
  name: string;
  admiral_id: number;
  faction: number;
  star_system?: number;
  
  // 전력
  ships: ShipGroup[];
  total_ships: number;
  total_firepower: number;
  
  // 상태
  supplies: number;
  morale: number;
  experience: number;
  
  // 위치
  position: {
    x: number;
    y: number;
    z: number;
  };
  
  // 진형
  formation?: string;
}

// 함선 그룹
export interface ShipGroup {
  class: string;           // 함급 (전함, 전투순양함 등)
  count: number;
  firepower: number;
  defense: number;
}

// 함급 (Ship Class)
export interface ShipClass {
  id: string;
  name: string;
  nameEn: string;
  type: 'battleship' | 'carrier' | 'cruiser' | 'destroyer';
  
  // 스펙
  firepower: number;
  defense: number;
  speed: number;
  cost: number;
  
  // 특성
  special_abilities?: string[];
}

// 우주 전투 (Space Battle)
export interface SpaceBattle {
  id: string;
  system_id: number;
  system_name: string;
  
  // 교전 세력
  attackers: BattleSide;
  defenders: BattleSide;
  
  // 상태
  status: 'preparing' | 'ongoing' | 'finished';
  turn: number;
  max_turns: number;
  
  // 결과
  winner?: 'attackers' | 'defenders' | 'draw';
}

export interface BattleSide {
  faction: number;
  fleets: Fleet[];
  total_ships: number;
  total_firepower: number;
  commander?: Admiral;
}

// API 응답 타입
export interface GetMyAdmiralResponse {
  success: boolean;
  admiral: Admiral;
  fleet?: Fleet;
  system?: StarSystem;
}

export interface GetGalaxyMapResponse {
  success: boolean;
  systems: StarSystem[];
  factions: Faction[];
  fleets: Fleet[];
}

export interface GetFactionInfoResponse {
  success: boolean;
  faction: Faction;
  systems: StarSystem[];
  admirals: Admiral[];
  total_military_power: number;
}

export interface ExecuteFleetCommandResponse {
  success: boolean;
  message: string;
  result?: any;
}

// 명령 타입
export interface FleetCommand {
  type: 'move' | 'attack' | 'defend' | 'supply' | 'patrol' | 'build';
  fleet_id: string;
  target?: number;  // 목표 항성계 ID
  parameters?: Record<string, any>;
}
