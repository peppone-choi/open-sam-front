/**
 * 토탈워 스타일 부대(Squad) 시스템
 * 
 * 계층 구조:
 * - Squad (부대): 유저가 직접 명령
 * - Soldier (병사): AI가 자동 제어
 * 
 * 부대 명령:
 * - 이동 (위치 + 방향)
 * - 진형 변경
 * - 공격 대상 지정
 * - 자세 변경
 */

// ===== 타입 정의 =====

export interface Position2D {
  x: number;
  z: number;
}

export enum SquadFormation {
  LINE = 'line',           // 횡대 - 넓고 얇음
  COLUMN = 'column',       // 종대 - 좁고 깊음
  SQUARE = 'square',       // 방진 - 정사각형
  WEDGE = 'wedge',         // 쐐기 - 삼각형
  LOOSE = 'loose',         // 산개 - 넓게 퍼짐
  TESTUDO = 'testudo',     // 거북진 - 밀집 방어
}

export enum SquadStance {
  AGGRESSIVE = 'aggressive', // 공격적 - 적극 추격
  DEFENSIVE = 'defensive',   // 방어적 - 위치 고수
  HOLD = 'hold',             // 정지 - 이동 안함
  SKIRMISH = 'skirmish',     // 산개 - 원거리 교전
}

export enum UnitCategory {
  INFANTRY = 'infantry',
  ARCHER = 'archer',
  CAVALRY = 'cavalry',
  WIZARD = 'wizard',
  SIEGE = 'siege',
}

// 부대 (유저가 명령)
export interface Squad {
  id: string;
  name: string;
  generalName: string;
  
  // 소속
  teamId: 'attacker' | 'defender';
  nation: string;
  
  // 유닛 정보
  unitTypeId: number;        // 복셀 유닛 ID
  category: UnitCategory;
  
  // 부대 위치/방향
  position: Position2D;      // 부대 중심점
  facing: number;            // 바라보는 방향 (라디안, 0 = +X)
  
  // 부대 크기/배치
  formation: SquadFormation;
  width: number;             // 진형 너비 (병사 수)
  depth: number;             // 진형 깊이 (줄 수)
  spacing: number;           // 병사 간격
  
  // 병력
  soldiers: Soldier[];
  maxSoldiers: number;
  
  // 전투 스탯
  morale: number;            // 사기 (0-100)
  training: number;          // 훈련도 (0-100)
  fatigue: number;           // 피로도 (0-100)
  
  // 장수 능력치
  leadership: number;
  strength: number;
  intelligence: number;
  
  // 명령 상태
  stance: SquadStance;
  targetSquadId?: string;    // 공격 대상 부대
  moveTarget?: Position2D;   // 이동 목표
  moveTargetFacing?: number; // 이동 후 방향
  
  // 상태
  state: 'idle' | 'moving' | 'engaging' | 'retreating' | 'routed';
  isSelected: boolean;
}

// 무기 공격 타입 (VoxelUnitDefinitions와 동기화)
export type WeaponAttackType = 
  | 'slash'        // 베기 (도검류)
  | 'thrust'       // 찌르기 (창류)
  | 'swing'        // 휘두르기 (둔기류)
  | 'shoot_bow'    // 활 쏘기
  | 'shoot_xbow'   // 쇠뇌 쏘기
  | 'throw'        // 투척
  | 'cast'         // 시전 (책사)
  | 'charge'       // 돌격 (기병)
  | 'siege';       // 공성

// 무기별 전투 설정 (전투 템포 조절: 쿨다운 2배)
/**
 * ★ 무기별 전투 설정 (25명당 1인 전투 템포 적용)
 * 쿨다운 2.5배 증가로 전투 10분+ 지속
 */
export const WEAPON_COMBAT_CONFIG: Record<WeaponAttackType, {
  range: number;          // 최대 공격 사거리
  minRange: number;       // 최소 공격 사거리 (원거리 무기)
  cooldown: number;       // 공격 쿨다운 (ms)
  damageMultiplier: number; // 데미지 배율
  isRanged: boolean;      // 원거리 여부
  projectileType?: string; // 투사체 타입
  aoeRadius?: number;     // 범위 공격 반경
  canMoveWhileAttacking: boolean; // 이동 중 공격 가능
}> = {
  slash: {
    range: 1.5,
    minRange: 0,
    cooldown: 6000,       // 2400 * 2.5 = 6000 (6초)
    damageMultiplier: 1.0,
    isRanged: false,
    canMoveWhileAttacking: false,
  },
  thrust: {
    range: 2.5,  // 창은 좀 더 긺
    minRange: 0,
    cooldown: 7000,       // 2800 * 2.5 = 7000 (7초)
    damageMultiplier: 1.1,
    isRanged: false,
    canMoveWhileAttacking: false,
  },
  swing: {
    range: 2.0,
    minRange: 0,
    cooldown: 8000,       // 3200 * 2.5 = 8000 (8초)
    damageMultiplier: 1.3,  // 둔기는 강력
    isRanged: false,
    canMoveWhileAttacking: false,
  },
  shoot_bow: {
    range: 12,
    minRange: 3,          // 최소 3거리 이상
    cooldown: 10000,      // 4000 * 2.5 = 10000 (10초)
    damageMultiplier: 0.8,
    isRanged: true,
    projectileType: 'arrow',
    canMoveWhileAttacking: true,  // 궁기병
  },
  shoot_xbow: {
    range: 15,
    minRange: 4,          // 쇠뇌는 더 멀어야 함
    cooldown: 15000,      // 6000 * 2.5 = 15000 (15초)
    damageMultiplier: 1.2,  // 쇠뇌는 강력하지만 느림
    isRanged: true,
    projectileType: 'bolt',
    canMoveWhileAttacking: false,
  },
  throw: {
    range: 8,
    minRange: 2,          // 투척은 좀 더 가까이서도 가능
    cooldown: 5000,       // 2500 -> 5000
    damageMultiplier: 0.9,
    isRanged: true,
    projectileType: 'javelin',
    canMoveWhileAttacking: false,
  },
  cast: {
    range: 10,
    minRange: 3,
    cooldown: 7000,       // 3500 -> 7000
    damageMultiplier: 1.5,
    isRanged: true,
    projectileType: 'magic',
    aoeRadius: 2,  // 범위 공격
    canMoveWhileAttacking: false,
  },
  charge: {
    range: 2,
    minRange: 0,
    cooldown: 2000,       // 1000 -> 2000
    damageMultiplier: 1.8,  // 돌격은 매우 강력
    isRanged: false,
    canMoveWhileAttacking: true,  // 돌격 중 공격
  },
  siege: {
    range: 20,
    minRange: 8,          // 공성무기는 가까이서 못 씀
    cooldown: 10000,      // 5000 -> 10000
    damageMultiplier: 3.0,  // 공성은 매우 강력
    isRanged: true,
    projectileType: 'boulder',
    aoeRadius: 3,  // 넓은 범위
    canMoveWhileAttacking: false,
  },
};

// 무기 타입 → 공격 타입 매핑
export const WEAPON_ATTACK_TYPE_MAP: Record<string, WeaponAttackType> = {
  // 도검류
  'sword': 'slash',
  'dao': 'slash',
  'jian': 'slash',
  'katana': 'slash',
  'scimitar': 'slash',
  'falchion': 'slash',
  'saber': 'slash',
  
  // 창류
  'spear': 'thrust',
  'pike': 'thrust',
  'halberd': 'thrust',
  'glaive': 'thrust',
  'naginata': 'thrust',
  'trident': 'thrust',
  'lance': 'thrust',
  'ji': 'thrust',
  
  // 둔기류
  'mace': 'swing',
  'hammer': 'swing',
  'club': 'swing',
  'staff': 'swing',
  'flail': 'swing',
  'axe': 'swing',
  
  // 원거리
  'bow': 'shoot_bow',
  'shortbow': 'shoot_bow',
  'longbow': 'shoot_bow',
  'composite_bow': 'shoot_bow',
  'crossbow': 'shoot_xbow',
  'heavy_crossbow': 'shoot_xbow',
  'repeating_crossbow': 'shoot_xbow',
  
  // 투척
  'javelin': 'throw',
  'throwing_knife': 'throw',
  'throwing_axe': 'throw',
  'shuriken': 'throw',
  
  // 마법
  'book': 'cast',
  'scroll': 'cast',
  'wand': 'cast',
  'staff_magic': 'cast',
  'fan': 'cast',
  'feather_fan': 'cast',
  
  // 기병 돌격
  'cavalry_sword': 'charge',
  'cavalry_lance': 'charge',
  'cavalry_spear': 'charge',
  
  // 공성
  'catapult': 'siege',
  'ballista': 'siege',
  'trebuchet': 'siege',
  
  // 기본값 (맨손)
  'fist': 'swing',
  'none': 'swing',
};

// 병사 (AI가 제어)
export interface Soldier {
  id: string;
  squadId: string;
  
  // 위치
  position: Position2D;      // 현재 월드 위치
  targetPosition: Position2D; // 목표 위치 (진형 내 슬롯)
  facing: number;
  
  // 상태
  hp: number;
  maxHp: number;
  isAlive: boolean;
  state: 'idle' | 'moving' | 'attacking' | 'defending' | 'dead';
  
  // 전투
  weaponType: WeaponAttackType;  // 무기 공격 타입
  targetSoldierId?: string;
  lastAttackTime: number;
  
  // 진형 내 위치
  formationSlot: { row: number; col: number };
}

// 진형 배치 패턴
export interface FormationPattern {
  name: string;
  getSlotPosition: (row: number, col: number, width: number, depth: number, spacing: number) => Position2D;
  getWidthDepth: (soldierCount: number) => { width: number; depth: number };
  attackBonus: number;
  defenseBonus: number;
  speedBonus: number;
  chargeBonus: number;
}

// ===== 진형 패턴 정의 =====

export const FORMATION_PATTERNS: Record<SquadFormation, FormationPattern> = {
  [SquadFormation.LINE]: {
    name: '횡대',
    getSlotPosition: (row, col, width, depth, spacing) => ({
      x: (col - (width - 1) / 2) * spacing,
      z: row * spacing,
    }),
    getWidthDepth: (count) => {
      const width = Math.min(count, Math.ceil(Math.sqrt(count) * 2));
      const depth = Math.ceil(count / width);
      return { width, depth };
    },
    attackBonus: 1.1,
    defenseBonus: 0.9,
    speedBonus: 1.0,
    chargeBonus: 0.8,
  },
  
  [SquadFormation.COLUMN]: {
    name: '종대',
    getSlotPosition: (row, col, width, depth, spacing) => ({
      x: (col - (width - 1) / 2) * spacing,
      z: row * spacing,
    }),
    getWidthDepth: (count) => {
      const width = Math.min(count, Math.ceil(Math.sqrt(count) / 2));
      const depth = Math.ceil(count / width);
      return { width: Math.max(2, width), depth };
    },
    attackBonus: 1.0,
    defenseBonus: 0.8,
    speedBonus: 1.2,
    chargeBonus: 1.3,
  },
  
  [SquadFormation.SQUARE]: {
    name: '방진',
    getSlotPosition: (row, col, width, depth, spacing) => ({
      x: (col - (width - 1) / 2) * spacing,
      z: (row - (depth - 1) / 2) * spacing,
    }),
    getWidthDepth: (count) => {
      const side = Math.ceil(Math.sqrt(count));
      return { width: side, depth: side };
    },
    attackBonus: 0.9,
    defenseBonus: 1.3,
    speedBonus: 0.8,
    chargeBonus: 0.7,
  },
  
  [SquadFormation.WEDGE]: {
    name: '쐐기',
    getSlotPosition: (row, col, width, depth, spacing) => {
      // 삼각형 배치
      const rowWidth = row + 1;
      const offsetX = (col - (rowWidth - 1) / 2) * spacing;
      return {
        x: offsetX,
        z: row * spacing * 0.8,
      };
    },
    getWidthDepth: (count) => {
      // 1 + 2 + 3 + ... + n = count
      let depth = 1;
      let total = 0;
      while (total < count) {
        total += depth;
        depth++;
      }
      return { width: depth - 1, depth: depth - 1 };
    },
    attackBonus: 1.3,
    defenseBonus: 0.7,
    speedBonus: 1.1,
    chargeBonus: 1.5,
  },
  
  [SquadFormation.LOOSE]: {
    name: '산개',
    getSlotPosition: (row, col, width, depth, spacing) => ({
      x: (col - (width - 1) / 2) * spacing * 1.5,
      z: row * spacing * 1.5,
    }),
    getWidthDepth: (count) => {
      const side = Math.ceil(Math.sqrt(count));
      return { width: side, depth: Math.ceil(count / side) };
    },
    attackBonus: 0.8,
    defenseBonus: 0.7,
    speedBonus: 1.3,
    chargeBonus: 0.6,
  },
  
  [SquadFormation.TESTUDO]: {
    name: '거북진',
    getSlotPosition: (row, col, width, depth, spacing) => ({
      x: (col - (width - 1) / 2) * spacing * 0.7,
      z: row * spacing * 0.7,
    }),
    getWidthDepth: (count) => {
      const side = Math.ceil(Math.sqrt(count));
      return { width: side, depth: Math.ceil(count / side) };
    },
    attackBonus: 0.5,
    defenseBonus: 1.8,
    speedBonus: 0.4,
    chargeBonus: 0.3,
  },
};

// ===== 부대 시스템 클래스 =====

// 투사체 인터페이스
export interface PendingProjectile {
  from: Position2D;
  to: Position2D;
  type: string;
  damage: number;
}

export class SquadSystem {
  private squads: Map<string, Squad> = new Map();
  private soldiers: Map<string, Soldier> = new Map();
  
  // 투사체 큐 (렌더링용)
  public pendingProjectiles: PendingProjectile[] = [];
  
  // 상수
  private readonly SOLDIER_SPEED = 3;          // 병사 이동 속도
  private readonly TROOPS_PER_SOLDIER = 25;    // 병사 1명 = 병력 25명 (더 세밀한 전투)
  
  // 병종별 설정
  private readonly UNIT_CONFIG: Record<UnitCategory, {
    attackRange: number;
    optimalRange: number;    // 최적 교전 거리
    attackCooldown: number;
    speed: number;
    behavior: 'melee' | 'ranged' | 'charge' | 'support';
  }> = {
    [UnitCategory.INFANTRY]: {
      attackRange: 1.5,
      optimalRange: 1.5,
      attackCooldown: 1500,
      speed: 1.0,
      behavior: 'melee',
    },
    [UnitCategory.ARCHER]: {
      attackRange: 12,        // 멀리서 공격
      optimalRange: 8,        // 8거리 유지하며 사격
      attackCooldown: 2000,
      speed: 1.1,
      behavior: 'ranged',
    },
    [UnitCategory.CAVALRY]: {
      attackRange: 2,
      optimalRange: 0,        // 돌격해서 붙음
      attackCooldown: 1200,
      speed: 2.0,             // 빠름
      behavior: 'charge',
    },
    [UnitCategory.WIZARD]: {
      attackRange: 10,
      optimalRange: 7,
      attackCooldown: 2500,
      speed: 0.8,
      behavior: 'support',
    },
    [UnitCategory.SIEGE]: {
      attackRange: 15,
      optimalRange: 12,
      attackCooldown: 4000,
      speed: 0.4,
      behavior: 'ranged',
    },
  };

  // ===== 부대 생성 =====
  
  createSquad(config: {
    id: string;
    name: string;
    generalName: string;
    teamId: 'attacker' | 'defender';
    nation: string;
    unitTypeId: number;
    category: UnitCategory;
    position: Position2D;
    facing: number;
    troops: number;
    leadership: number;
    strength: number;
    intelligence: number;
    morale?: number;
    training?: number;
  }): Squad {
    const soldierCount = Math.ceil(config.troops / this.TROOPS_PER_SOLDIER);
    const formation = SquadFormation.LINE;
    const pattern = FORMATION_PATTERNS[formation];
    const { width, depth } = pattern.getWidthDepth(soldierCount);
    
    const squad: Squad = {
      id: config.id,
      name: config.name,
      generalName: config.generalName,
      teamId: config.teamId,
      nation: config.nation,
      unitTypeId: config.unitTypeId,
      category: config.category,
      position: config.position,
      facing: config.facing,
      formation,
      width,
      depth,
      spacing: 1.2,
      soldiers: [],
      maxSoldiers: soldierCount,
      morale: config.morale ?? 100,
      training: config.training ?? 80,
      fatigue: 0,
      leadership: config.leadership,
      strength: config.strength,
      intelligence: config.intelligence,
      stance: SquadStance.AGGRESSIVE,
      state: 'idle',
      isSelected: false,
    };

    // 병사 생성
    this.createSoldiersForSquad(squad);
    
    this.squads.set(squad.id, squad);
    return squad;
  }

  private createSoldiersForSquad(squad: Squad): void {
    const pattern = FORMATION_PATTERNS[squad.formation];
    const weaponType = this.getWeaponTypeForUnit(squad.unitTypeId, squad.category);
    let soldierIndex = 0;

    for (let row = 0; row < squad.depth && soldierIndex < squad.maxSoldiers; row++) {
      const rowWidth = squad.formation === SquadFormation.WEDGE ? row + 1 : squad.width;
      
      for (let col = 0; col < rowWidth && soldierIndex < squad.maxSoldiers; col++) {
        const localPos = pattern.getSlotPosition(row, col, squad.width, squad.depth, squad.spacing);
        const worldPos = this.localToWorld(localPos, squad.position, squad.facing);
        
        const soldier: Soldier = {
          id: `${squad.id}-soldier-${soldierIndex}`,
          squadId: squad.id,
          position: { ...worldPos },
          targetPosition: { ...worldPos },
          facing: squad.facing,
          hp: 100,
          maxHp: 100,
          isAlive: true,
          state: 'idle',
          weaponType,
          lastAttackTime: 0,
          formationSlot: { row, col },
        };
        
        squad.soldiers.push(soldier);
        this.soldiers.set(soldier.id, soldier);
        soldierIndex++;
      }
    }
  }

  /** 유닛 ID에서 무기 공격 타입 결정 */
  private getWeaponTypeForUnit(unitTypeId: number, category: UnitCategory): WeaponAttackType {
    // 공성 유닛
    if (unitTypeId >= 1500 && unitTypeId <= 1511) {
      return 'siege';
    }
    
    // 기병 (창기병 = charge, 궁기병 = shoot_bow)
    if (category === UnitCategory.CAVALRY) {
      if (unitTypeId === 1303 || unitTypeId === 1306 || unitTypeId === 1308 || 
          unitTypeId === 1309 || unitTypeId === 1316) {
        return 'shoot_bow'; // 궁기병
      }
      return 'charge';
    }
    
    // 궁병
    if (category === UnitCategory.ARCHER) {
      // 쇠뇌
      if ([1202, 1203, 1204, 1206, 1207, 1215].includes(unitTypeId)) {
        return 'shoot_xbow';
      }
      // 투척
      if ([1208, 1209, 1210, 1213].includes(unitTypeId)) {
        return 'throw';
      }
      // 기본 활
      return 'shoot_bow';
    }
    
    // 책사
    if (category === UnitCategory.WIZARD) {
      return 'cast';
    }
    
    // 보병 무기별 분류
    // 창류 (찌르기)
    if ([1101, 1103, 1104, 1106, 1108, 1118, 1122, 1127].includes(unitTypeId)) {
      return 'thrust';
    }
    // 둔기류 (휘두르기)
    if ([1107, 1110, 1114, 1117, 1121, 1123].includes(unitTypeId)) {
      return 'swing';
    }
    // 기본 도검류 (베기)
    return 'slash';
  }

  // ===== 좌표 변환 =====

  private localToWorld(local: Position2D, origin: Position2D, facing: number): Position2D {
    const cos = Math.cos(facing);
    const sin = Math.sin(facing);
    return {
      x: origin.x + local.x * cos - local.z * sin,
      z: origin.z + local.x * sin + local.z * cos,
    };
  }

  private worldToLocal(world: Position2D, origin: Position2D, facing: number): Position2D {
    const dx = world.x - origin.x;
    const dz = world.z - origin.z;
    const cos = Math.cos(-facing);
    const sin = Math.sin(-facing);
    return {
      x: dx * cos - dz * sin,
      z: dx * sin + dz * cos,
    };
  }

  // ===== 부대 명령 (유저 인터페이스) =====

  /** 부대 이동 명령 */
  moveSquad(squadId: string, target: Position2D, targetFacing?: number): void {
    const squad = this.squads.get(squadId);
    if (!squad) return;

    squad.moveTarget = target;
    squad.moveTargetFacing = targetFacing ?? squad.facing;
    squad.state = 'moving';
  }

  /** 부대 공격 명령 */
  attackSquad(squadId: string, targetSquadId: string): void {
    const squad = this.squads.get(squadId);
    if (!squad) return;

    squad.targetSquadId = targetSquadId;
    squad.state = 'engaging';
  }

  /** 진형 변경 */
  setFormation(squadId: string, formation: SquadFormation): void {
    const squad = this.squads.get(squadId);
    if (!squad) return;

    squad.formation = formation;
    const pattern = FORMATION_PATTERNS[formation];
    const { width, depth } = pattern.getWidthDepth(squad.soldiers.filter(s => s.isAlive).length);
    squad.width = width;
    squad.depth = depth;
    
    // 병사 위치 재계산
    this.recalculateSoldierPositions(squad);
  }

  /** 자세 변경 */
  setStance(squadId: string, stance: SquadStance): void {
    const squad = this.squads.get(squadId);
    if (!squad) return;
    squad.stance = stance;
  }

  /** 부대 방향 회전 */
  rotateSquad(squadId: string, facing: number): void {
    const squad = this.squads.get(squadId);
    if (!squad) return;
    squad.facing = facing;
    this.recalculateSoldierPositions(squad);
  }

  /** 진형 너비 조절 */
  setSquadWidth(squadId: string, width: number): void {
    const squad = this.squads.get(squadId);
    if (!squad) return;
    
    const aliveCount = squad.soldiers.filter(s => s.isAlive).length;
    squad.width = Math.max(1, Math.min(width, aliveCount));
    squad.depth = Math.ceil(aliveCount / squad.width);
    this.recalculateSoldierPositions(squad);
  }

  // ===== 병사 위치 재계산 =====

  private recalculateSoldierPositions(squad: Squad): void {
    const pattern = FORMATION_PATTERNS[squad.formation];
    const aliveSoldiers = squad.soldiers.filter(s => s.isAlive);
    
    let index = 0;
    for (let row = 0; row < squad.depth && index < aliveSoldiers.length; row++) {
      const rowWidth = squad.formation === SquadFormation.WEDGE 
        ? Math.min(row + 1, aliveSoldiers.length - index)
        : Math.min(squad.width, aliveSoldiers.length - index);
      
      for (let col = 0; col < rowWidth && index < aliveSoldiers.length; col++) {
        const soldier = aliveSoldiers[index];
        const localPos = pattern.getSlotPosition(row, col, squad.width, squad.depth, squad.spacing);
        const worldPos = this.localToWorld(localPos, squad.position, squad.facing);
        
        soldier.formationSlot = { row, col };
        soldier.targetPosition = worldPos;
        soldier.facing = squad.facing;
        index++;
      }
    }
  }

  // ===== 업데이트 (매 프레임) =====

  update(deltaTime: number, currentTime: number): void {
    // 1. 부대 이동
    this.squads.forEach(squad => {
      if (squad.state === 'routed') return;
      this.updateSquadMovement(squad, deltaTime);
    });

    // 2. 부대 AI (공격 대상 자동 선택)
    this.squads.forEach(squad => {
      if (squad.stance === SquadStance.HOLD) return;
      this.updateSquadAI(squad);
    });

    // 3. 병사 이동 (진형 위치로)
    this.soldiers.forEach(soldier => {
      if (!soldier.isAlive) return;
      this.updateSoldierMovement(soldier, deltaTime);
    });

    // 4. 병사 전투 AI
    this.soldiers.forEach(soldier => {
      if (!soldier.isAlive) return;
      this.updateSoldierCombat(soldier, currentTime);
    });

    // 5. 사기 체크
    this.squads.forEach(squad => {
      this.updateSquadMorale(squad);
    });
  }

  private updateSquadMovement(squad: Squad, deltaTime: number): void {
    if (!squad.moveTarget) return;

    const dx = squad.moveTarget.x - squad.position.x;
    const dz = squad.moveTarget.z - squad.position.z;
    const distance = Math.sqrt(dx * dx + dz * dz);

    if (distance < 0.5) {
      // 도착
      squad.position = { ...squad.moveTarget };
      if (squad.moveTargetFacing !== undefined) {
        squad.facing = squad.moveTargetFacing;
      }
      squad.moveTarget = undefined;
      squad.moveTargetFacing = undefined;
      if (squad.state === 'moving') {
        squad.state = 'idle';
      }
      this.recalculateSoldierPositions(squad);
      return;
    }

    // 병종별 속도 적용
    const config = this.UNIT_CONFIG[squad.category];
    const pattern = FORMATION_PATTERNS[squad.formation];
    const speed = this.SOLDIER_SPEED * config.speed * pattern.speedBonus * (deltaTime / 1000);
    const ratio = Math.min(speed / distance, 1);
    
    squad.position.x += dx * ratio;
    squad.position.z += dz * ratio;
    
    // 이동 중 방향 업데이트
    squad.facing = Math.atan2(dx, dz);
    
    this.recalculateSoldierPositions(squad);
  }

  private updateSquadAI(squad: Squad): void {
    const config = this.UNIT_CONFIG[squad.category];
    
    // 공격 대상 없으면 찾기
    if (!squad.targetSquadId) {
      if (squad.stance !== SquadStance.HOLD) {
        const nearestEnemy = this.findNearestEnemySquad(squad);
        if (nearestEnemy) {
          squad.targetSquadId = nearestEnemy.id;
        }
      }
      return;
    }

    const targetSquad = this.squads.get(squad.targetSquadId);
    if (!targetSquad || this.isSquadDefeated(targetSquad)) {
      squad.targetSquadId = undefined;
      squad.state = 'idle';
      return;
    }

    const distance = this.getDistance(squad.position, targetSquad.position);

    // 병종별 행동 패턴
    switch (config.behavior) {
      case 'ranged':
        // 궁병/공성: 최적 거리 유지하며 사격
        this.handleRangedBehavior(squad, targetSquad, distance, config);
        break;
        
      case 'charge':
        // 기병: 돌격
        this.handleChargeBehavior(squad, targetSquad, distance, config);
        break;
        
      case 'support':
        // 책사: 후방에서 지원
        this.handleSupportBehavior(squad, targetSquad, distance, config);
        break;
        
      case 'melee':
      default:
        // 보병: 진형 유지하며 전진
        this.handleMeleeBehavior(squad, targetSquad, distance, config);
        break;
    }
  }

  /** 원거리 유닛 행동 (궁병, 공성) */
  private handleRangedBehavior(
    squad: Squad, 
    target: Squad, 
    distance: number,
    config: typeof this.UNIT_CONFIG[UnitCategory]
  ): void {
    // 병사의 무기 타입에서 최소 사거리 가져오기
    const weaponType = this.getWeaponTypeForUnit(squad.unitTypeId, squad.category);
    const weaponConfig = WEAPON_COMBAT_CONFIG[weaponType];
    const minRange = weaponConfig.minRange;
    
    if (distance < minRange) {
      // 최소 사거리 미만 - 무조건 후퇴!
      const retreatDistance = minRange - distance + 2; // 여유있게 후퇴
      const angle = Math.atan2(
        squad.position.x - target.position.x,
        squad.position.z - target.position.z
      );
      squad.moveTarget = {
        x: squad.position.x + Math.sin(angle) * retreatDistance,
        z: squad.position.z + Math.cos(angle) * retreatDistance,
      };
      squad.state = 'moving';
    } else if (distance > config.attackRange) {
      // 사거리 밖 - 접근 (하지만 최적 거리까지만)
      const moveDistance = distance - config.optimalRange;
      const angle = Math.atan2(
        target.position.x - squad.position.x,
        target.position.z - squad.position.z
      );
      squad.moveTarget = {
        x: squad.position.x + Math.sin(angle) * moveDistance,
        z: squad.position.z + Math.cos(angle) * moveDistance,
      };
      squad.state = 'moving';
    } else if (distance < config.optimalRange * 0.8) {
      // 최적 거리보다 가까움 - 약간 후퇴
      const angle = Math.atan2(
        squad.position.x - target.position.x,
        squad.position.z - target.position.z
      );
      squad.moveTarget = {
        x: squad.position.x + Math.sin(angle) * 2,
        z: squad.position.z + Math.cos(angle) * 2,
      };
      squad.state = 'moving';
    } else {
      // 최적 거리 - 사격
      squad.state = 'engaging';
      // 적을 바라봄
      squad.facing = Math.atan2(
        target.position.x - squad.position.x,
        target.position.z - squad.position.z
      );
    }
  }

  /** 기병 행동 (돌격) */
  private handleChargeBehavior(
    squad: Squad, 
    target: Squad, 
    distance: number,
    config: typeof this.UNIT_CONFIG[UnitCategory]
  ): void {
    if (distance > config.attackRange) {
      // 돌격! 직선으로 적에게
      squad.moveTarget = { ...target.position };
      squad.moveTargetFacing = Math.atan2(
        target.position.x - squad.position.x,
        target.position.z - squad.position.z
      );
      squad.state = 'moving';
      
      // 쐐기진으로 자동 전환 (돌격 시)
      if (squad.formation !== SquadFormation.WEDGE && distance > 5) {
        this.setFormation(squad.id, SquadFormation.WEDGE);
      }
    } else {
      // 교전 중
      squad.state = 'engaging';
    }
  }

  /** 지원 유닛 행동 (책사) */
  private handleSupportBehavior(
    squad: Squad, 
    target: Squad, 
    distance: number,
    config: typeof this.UNIT_CONFIG[UnitCategory]
  ): void {
    // 아군 보병 뒤에서 지원
    const friendlyInfantry = this.findNearestFriendlySquad(squad, UnitCategory.INFANTRY);
    
    if (friendlyInfantry) {
      // 아군 보병 뒤에 위치
      const behindDistance = 4;
      const angle = friendlyInfantry.facing + Math.PI; // 반대 방향
      const supportPos = {
        x: friendlyInfantry.position.x + Math.sin(angle) * behindDistance,
        z: friendlyInfantry.position.z + Math.cos(angle) * behindDistance,
      };
      
      const distToSupport = this.getDistance(squad.position, supportPos);
      if (distToSupport > 2) {
        squad.moveTarget = supportPos;
        squad.state = 'moving';
      } else if (distance <= config.attackRange) {
        squad.state = 'engaging';
        squad.facing = Math.atan2(
          target.position.x - squad.position.x,
          target.position.z - squad.position.z
        );
      }
    } else {
      // 아군 없으면 원거리처럼 행동
      this.handleRangedBehavior(squad, target, distance, config);
    }
  }

  /** 근접 유닛 행동 (보병) */
  private handleMeleeBehavior(
    squad: Squad, 
    target: Squad, 
    distance: number,
    config: typeof this.UNIT_CONFIG[UnitCategory]
  ): void {
    if (distance > config.attackRange * 2) {
      // 진형 유지하며 전진
      squad.moveTarget = { ...target.position };
      squad.moveTargetFacing = Math.atan2(
        target.position.x - squad.position.x,
        target.position.z - squad.position.z
      );
      squad.state = 'moving';
    } else {
      // 교전
      squad.state = 'engaging';
    }
  }

  /** 가장 가까운 아군 부대 찾기 */
  private findNearestFriendlySquad(squad: Squad, category?: UnitCategory): Squad | null {
    let nearest: Squad | null = null;
    let nearestDist = Infinity;

    this.squads.forEach(other => {
      if (other.id === squad.id) return;
      if (other.teamId !== squad.teamId) return;
      if (category && other.category !== category) return;
      if (this.isSquadDefeated(other)) return;

      const dist = this.getDistance(squad.position, other.position);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearest = other;
      }
    });

    return nearest;
  }

  private updateSoldierMovement(soldier: Soldier, deltaTime: number): void {
    const dx = soldier.targetPosition.x - soldier.position.x;
    const dz = soldier.targetPosition.z - soldier.position.z;
    const distance = Math.sqrt(dx * dx + dz * dz);

    if (distance < 0.1) {
      soldier.position = { ...soldier.targetPosition };
      if (soldier.state === 'moving') {
        soldier.state = 'idle';
      }
      return;
    }

    const speed = this.SOLDIER_SPEED * (deltaTime / 1000);
    const ratio = Math.min(speed / distance, 1);
    
    soldier.position.x += dx * ratio;
    soldier.position.z += dz * ratio;
    soldier.state = 'moving';
  }

  private updateSoldierCombat(soldier: Soldier, currentTime: number): void {
    const squad = this.squads.get(soldier.squadId);
    if (!squad || !squad.targetSquadId) {
      soldier.targetSoldierId = undefined;
      soldier.state = 'idle';
      return;
    }

    const targetSquad = this.squads.get(squad.targetSquadId);
    if (!targetSquad) return;

    // 무기별 전투 설정 사용
    const weaponConfig = WEAPON_COMBAT_CONFIG[soldier.weaponType];

    // 타겟 병사 찾기/업데이트
    if (!soldier.targetSoldierId || !this.soldiers.get(soldier.targetSoldierId)?.isAlive) {
      soldier.targetSoldierId = this.findNearestEnemySoldier(soldier, targetSquad);
    }

    if (!soldier.targetSoldierId) return;

    const targetSoldier = this.soldiers.get(soldier.targetSoldierId);
    if (!targetSoldier || !targetSoldier.isAlive) {
      soldier.targetSoldierId = undefined;
      return;
    }

    // 거리 체크
    const distance = this.getDistance(soldier.position, targetSoldier.position);

    // 원거리 무기: 최소~최대 사거리 체크
    if (weaponConfig.isRanged) {
      // 너무 가까우면 공격 불가 (후퇴 필요)
      if (distance < weaponConfig.minRange) {
        soldier.state = 'defending';  // 근접당해서 방어 자세
        return;
      }
      
      // 사거리 안이면 공격
      if (distance <= weaponConfig.range) {
        // 쿨다운 체크
        if (currentTime - soldier.lastAttackTime < weaponConfig.cooldown) {
          soldier.state = 'idle';
          return;
        }

        // 원거리 공격!
        soldier.lastAttackTime = currentTime;
        soldier.state = 'attacking';
        soldier.facing = Math.atan2(
          targetSoldier.position.x - soldier.position.x,
          targetSoldier.position.z - soldier.position.z
        );
        
        // 무기별 데미지 계산
        let damage = this.calculateDamage(squad, targetSquad) * weaponConfig.damageMultiplier;
        
        // 범위 공격 (책사, 공성)
        if (weaponConfig.aoeRadius) {
          this.applyAoeDamage(targetSoldier.position, weaponConfig.aoeRadius, damage, squad.teamId);
        } else {
          targetSoldier.hp -= damage;
          if (targetSoldier.hp <= 0) {
            targetSoldier.hp = 0;
            targetSoldier.isAlive = false;
            targetSoldier.state = 'dead';
            soldier.targetSoldierId = undefined;
          }
        }
        
        // 투사체 생성 (렌더링용 이벤트)
        if (weaponConfig.projectileType) {
          this.pendingProjectiles.push({
            from: { ...soldier.position },
            to: { ...targetSoldier.position },
            type: weaponConfig.projectileType,
            damage,
          });
        }
      }
      return;
    }

    // 근접 무기: 가까이 가서 공격
    if (distance > weaponConfig.range) {
      // 진형 위치로 이동 (부대 이동에 맡김)
      return;
    }

    // 쿨다운 체크
    if (currentTime - soldier.lastAttackTime < weaponConfig.cooldown) {
      soldier.state = 'defending';
      return;
    }

    // 근접 공격!
    soldier.lastAttackTime = currentTime;
    soldier.state = 'attacking';
    
    // 무기별 데미지 계산
    let damage = this.calculateDamage(squad, targetSquad) * weaponConfig.damageMultiplier;
    
    // 돌격 보너스 (기병이 이동 중일 때)
    if (soldier.weaponType === 'charge' && squad.state === 'moving') {
      damage *= 1.5;
    }
    
    // 창 vs 기병 보너스
    if (soldier.weaponType === 'thrust' && targetSquad.category === UnitCategory.CAVALRY) {
      damage *= 1.5; // 대기병 보너스
    }
    
    targetSoldier.hp -= damage;
    
    if (targetSoldier.hp <= 0) {
      targetSoldier.hp = 0;
      targetSoldier.isAlive = false;
      targetSoldier.state = 'dead';
      soldier.targetSoldierId = undefined;
    }
  }

  /** 범위 공격 데미지 적용 */
  private applyAoeDamage(center: Position2D, radius: number, damage: number, attackerTeam: string): void {
    this.soldiers.forEach(soldier => {
      const squad = this.squads.get(soldier.squadId);
      if (!squad || squad.teamId === attackerTeam || !soldier.isAlive) return;
      
      const dist = this.getDistance(center, soldier.position);
      if (dist <= radius) {
        // 중심에서 멀수록 데미지 감소
        const falloff = 1 - (dist / radius) * 0.5;
        const aoeDamage = damage * falloff;
        
        soldier.hp -= aoeDamage;
        if (soldier.hp <= 0) {
          soldier.hp = 0;
          soldier.isAlive = false;
          soldier.state = 'dead';
        }
      }
    });
  }

  private updateSquadMorale(squad: Squad): void {
    const aliveSoldiers = squad.soldiers.filter(s => s.isAlive).length;
    const casualtyRate = 1 - (aliveSoldiers / squad.maxSoldiers);
    
    // 피해에 따른 사기 감소
    if (casualtyRate > 0.5) {
      squad.morale -= 0.1;
    }
    
    // 사기 붕괴
    if (squad.morale <= 20 && squad.state !== 'routed') {
      squad.state = 'routed';
      squad.stance = SquadStance.HOLD;
      // 후퇴 방향
      const retreatDir = squad.teamId === 'attacker' ? -1 : 1;
      squad.moveTarget = {
        x: squad.position.x + retreatDir * 20,
        z: squad.position.z,
      };
    }
  }

  // ===== 유틸리티 =====

  private getDistance(a: Position2D, b: Position2D): number {
    const dx = b.x - a.x;
    const dz = b.z - a.z;
    return Math.sqrt(dx * dx + dz * dz);
  }

  private findNearestEnemySquad(squad: Squad): Squad | null {
    let nearest: Squad | null = null;
    let nearestDist = Infinity;

    this.squads.forEach(other => {
      if (other.teamId === squad.teamId) return;
      if (this.isSquadDefeated(other)) return;

      const dist = this.getDistance(squad.position, other.position);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearest = other;
      }
    });

    return nearest;
  }

  private findNearestEnemySoldier(soldier: Soldier, targetSquad: Squad): string | undefined {
    let nearest: Soldier | undefined;
    let nearestDist = Infinity;

    for (const other of targetSquad.soldiers) {
      if (!other.isAlive) continue;

      const dist = this.getDistance(soldier.position, other.position);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearest = other;
      }
    }

    return nearest?.id;
  }

  private calculateDamage(attackerSquad: Squad, defenderSquad: Squad): number {
    const pattern = FORMATION_PATTERNS[attackerSquad.formation];
    const defPattern = FORMATION_PATTERNS[defenderSquad.formation];
    
    let baseDamage = 20;
    
    // 능력치 보너스
    baseDamage *= (1 + attackerSquad.strength / 200);
    
    // 진형 보너스
    baseDamage *= pattern.attackBonus;
    baseDamage /= defPattern.defenseBonus;
    
    // 사기/훈련도
    baseDamage *= (0.5 + attackerSquad.morale / 200);
    baseDamage *= (0.7 + attackerSquad.training / 300);
    
    // 랜덤
    baseDamage *= (0.8 + Math.random() * 0.4);
    
    return Math.floor(baseDamage);
  }

  private isSquadDefeated(squad: Squad): boolean {
    return squad.soldiers.filter(s => s.isAlive).length === 0;
  }

  // ===== 접근자 =====

  getSquad(id: string): Squad | undefined {
    return this.squads.get(id);
  }

  getSoldier(id: string): Soldier | undefined {
    return this.soldiers.get(id);
  }

  getAllSquads(): Squad[] {
    return Array.from(this.squads.values());
  }

  getSquadsByTeam(teamId: 'attacker' | 'defender'): Squad[] {
    return this.getAllSquads().filter(s => s.teamId === teamId);
  }

  getAliveSoldierCount(squadId: string): number {
    const squad = this.squads.get(squadId);
    if (!squad) return 0;
    return squad.soldiers.filter(s => s.isAlive).length;
  }

  getTotalTroops(squadId: string): number {
    return this.getAliveSoldierCount(squadId) * this.TROOPS_PER_SOLDIER;
  }

  isTeamDefeated(teamId: 'attacker' | 'defender'): boolean {
    return this.getSquadsByTeam(teamId).every(s => this.isSquadDefeated(s));
  }
}

