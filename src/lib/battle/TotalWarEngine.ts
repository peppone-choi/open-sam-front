/**
 * Total War Style Battle Engine
 * 
 * 핵심 개념:
 * 1. Matched Combat: 병사들이 1:1로 붙어서 싸움
 * 2. Battle Line: 두 부대 충돌 시 일자 전선 형성
 * 3. Collision: 병사 간 물리적 충돌
 * 4. Flanking: 측면/후방 공격 보너스
 * 5. Morale: 사기 시스템 (동요, 탈주, 재집결)
 */

import { 
  WeaponAttackType, 
  WEAPON_ATTACK_TYPE_MAP, 
  WEAPON_COMBAT_CONFIG 
} from './SquadSystem';

import { 
  SquadTacticsAI, 
  createSquadTacticsAI, 
  TacticAction, 
  TacticActionType,
  TACTICS_CONFIG,
} from './ai/SquadTactics';

import {
  CombatCalculator,
  CombatContext,
  DamageResult,
  HitResult,
  CriticalResult,
  Buff,
  calculateAttackAngle,
  getDistance as combatGetDistance,
} from './combat/CombatCalculator';

// ========================================
// 타입 정의
// ========================================

export interface Vector2 {
  x: number;
  z: number;
}

// ========================================
// Quadtree 공간 분할 시스템
// O(n²) → O(n log n) 최적화
// ========================================

/** Quadtree 경계 영역 */
export interface QTBounds {
  x: number;      // 중심 x
  z: number;      // 중심 z
  halfWidth: number;
  halfHeight: number;
}

/** Quadtree 포인트 (병사 위치 + ID) */
export interface QTPoint {
  x: number;
  z: number;
  id: string;
  data?: TWSoldier;
}

/**
 * Quadtree 클래스
 * 공간 분할로 충돌/탐색 최적화
 * 
 * 성능: 1000 병사 기준
 * - 삽입: O(log n) ≈ 10 operations
 * - 범위 쿼리: O(k + log n), k = 결과 수
 * - 전체 빌드: O(n log n)
 */
export class Quadtree {
  private readonly capacity: number;
  private points: QTPoint[] = [];
  private divided = false;
  
  // 자식 노드
  private northeast?: Quadtree;
  private northwest?: Quadtree;
  private southeast?: Quadtree;
  private southwest?: Quadtree;
  
  // 성능 측정용
  static queryCount = 0;
  static insertCount = 0;
  
  constructor(
    public bounds: QTBounds,
    capacity = 8  // 노드당 최대 포인트 수
  ) {
    this.capacity = capacity;
  }
  
  /**
   * 포인트 삽입
   * @returns 삽입 성공 여부
   */
  insert(point: QTPoint): boolean {
    Quadtree.insertCount++;
    
    // 경계 밖이면 무시
    if (!this.contains(point)) {
      return false;
    }
    
    // 용량 여유가 있으면 현재 노드에 추가
    if (this.points.length < this.capacity) {
      this.points.push(point);
      return true;
    }
    
    // 분할 필요
    if (!this.divided) {
      this.subdivide();
    }
    
    // 자식 노드에 삽입 시도
    return (
      this.northeast!.insert(point) ||
      this.northwest!.insert(point) ||
      this.southeast!.insert(point) ||
      this.southwest!.insert(point)
    );
  }
  
  /**
   * 영역 분할 (4분할)
   */
  private subdivide(): void {
    const { x, z, halfWidth, halfHeight } = this.bounds;
    const qw = halfWidth / 2;
    const qh = halfHeight / 2;
    
    this.northeast = new Quadtree({ x: x + qw, z: z - qh, halfWidth: qw, halfHeight: qh }, this.capacity);
    this.northwest = new Quadtree({ x: x - qw, z: z - qh, halfWidth: qw, halfHeight: qh }, this.capacity);
    this.southeast = new Quadtree({ x: x + qw, z: z + qh, halfWidth: qw, halfHeight: qh }, this.capacity);
    this.southwest = new Quadtree({ x: x - qw, z: z + qh, halfWidth: qw, halfHeight: qh }, this.capacity);
    
    this.divided = true;
  }
  
  /**
   * 포인트가 경계 안에 있는지 확인
   */
  private contains(point: QTPoint): boolean {
    const { x, z, halfWidth, halfHeight } = this.bounds;
    return (
      point.x >= x - halfWidth &&
      point.x < x + halfWidth &&
      point.z >= z - halfHeight &&
      point.z < z + halfHeight
    );
  }
  
  /**
   * 범위 쿼리: 주어진 영역 내 모든 포인트 반환
   * @param range 검색 영역
   * @param found 결과 배열 (재사용)
   */
  query(range: QTBounds, found: QTPoint[] = []): QTPoint[] {
    Quadtree.queryCount++;
    
    // 영역이 겹치지 않으면 스킵
    if (!this.intersects(range)) {
      return found;
    }
    
    // 현재 노드의 포인트 검사
    for (const p of this.points) {
      if (this.pointInRange(p, range)) {
        found.push(p);
      }
    }
    
    // 분할된 경우 자식 노드도 검색
    if (this.divided) {
      this.northeast!.query(range, found);
      this.northwest!.query(range, found);
      this.southeast!.query(range, found);
      this.southwest!.query(range, found);
    }
    
    return found;
  }
  
  /**
   * 원형 범위 쿼리: 반경 내 모든 포인트 반환
   * @param cx 중심 x
   * @param cz 중심 z
   * @param radius 반경
   * @param found 결과 배열 (재사용)
   */
  queryRadius(cx: number, cz: number, radius: number, found: QTPoint[] = []): QTPoint[] {
    // 원을 포함하는 사각형으로 먼저 필터링
    const range: QTBounds = {
      x: cx,
      z: cz,
      halfWidth: radius,
      halfHeight: radius,
    };
    
    const candidates = this.query(range, []);
    
    // 실제 원 내부인지 확인
    const radiusSq = radius * radius;
    for (const p of candidates) {
      const dx = p.x - cx;
      const dz = p.z - cz;
      if (dx * dx + dz * dz <= radiusSq) {
        found.push(p);
      }
    }
    
    return found;
  }
  
  /**
   * 영역이 겹치는지 확인
   */
  private intersects(range: QTBounds): boolean {
    const { x, z, halfWidth, halfHeight } = this.bounds;
    return !(
      range.x - range.halfWidth > x + halfWidth ||
      range.x + range.halfWidth < x - halfWidth ||
      range.z - range.halfHeight > z + halfHeight ||
      range.z + range.halfHeight < z - halfHeight
    );
  }
  
  /**
   * 포인트가 범위 안에 있는지 확인
   */
  private pointInRange(point: QTPoint, range: QTBounds): boolean {
    return (
      point.x >= range.x - range.halfWidth &&
      point.x < range.x + range.halfWidth &&
      point.z >= range.z - range.halfHeight &&
      point.z < range.z + range.halfHeight
    );
  }
  
  /**
   * 트리 초기화 (매 프레임 재구축용)
   */
  clear(): void {
    this.points = [];
    this.divided = false;
    this.northeast = undefined;
    this.northwest = undefined;
    this.southeast = undefined;
    this.southwest = undefined;
  }
  
  /**
   * 통계 초기화
   */
  static resetStats(): void {
    Quadtree.queryCount = 0;
    Quadtree.insertCount = 0;
  }
  
  /**
   * 현재 통계 반환
   */
  static getStats(): { queryCount: number; insertCount: number } {
    return {
      queryCount: Quadtree.queryCount,
      insertCount: Quadtree.insertCount,
    };
  }
}

// ========================================
// 엔티티 풀링 시스템
// 메모리 할당 최소화, GC 압력 감소
// ========================================

/**
 * 제네릭 오브젝트 풀
 * - 죽은 병사를 즉시 삭제하지 않고 풀에 반환
 * - 새 병사 생성 시 풀에서 재활용
 */
export class ObjectPool<T> {
  private pool: T[] = [];
  private activeCount = 0;
  private totalCreated = 0;
  private totalRecycled = 0;
  
  constructor(
    private factory: () => T,
    private reset: (obj: T) => void,
    private initialSize = 0
  ) {
    // 초기 풀 채우기
    for (let i = 0; i < initialSize; i++) {
      this.pool.push(factory());
      this.totalCreated++;
    }
  }
  
  /**
   * 풀에서 객체 획득
   * - 풀에 있으면 재활용
   * - 없으면 새로 생성
   */
  acquire(): T {
    this.activeCount++;
    
    if (this.pool.length > 0) {
      this.totalRecycled++;
      return this.pool.pop()!;
    }
    
    this.totalCreated++;
    return this.factory();
  }
  
  /**
   * 객체를 풀에 반환
   */
  release(obj: T): void {
    this.reset(obj);
    this.pool.push(obj);
    this.activeCount--;
  }
  
  /**
   * 풀 상태 조회
   */
  getStats(): {
    poolSize: number;
    activeCount: number;
    totalCreated: number;
    totalRecycled: number;
    recycleRate: number;
  } {
    return {
      poolSize: this.pool.length,
      activeCount: this.activeCount,
      totalCreated: this.totalCreated,
      totalRecycled: this.totalRecycled,
      recycleRate: this.totalCreated > 0 
        ? this.totalRecycled / this.totalCreated 
        : 0,
    };
  }
  
  /**
   * 풀 사전 확장 (대규모 전투 전)
   */
  prewarm(count: number): void {
    for (let i = 0; i < count; i++) {
      this.pool.push(this.factory());
      this.totalCreated++;
    }
  }
  
  /**
   * 풀 축소 (메모리 해제)
   */
  shrink(targetSize: number): void {
    while (this.pool.length > targetSize) {
      this.pool.pop();
    }
  }
  
  /**
   * 풀 완전 초기화
   */
  clear(): void {
    this.pool = [];
    this.activeCount = 0;
  }
}

/**
 * 병사(Soldier) 전용 오브젝트 풀
 * TWSoldier 특화 최적화
 */
export class SoldierPool {
  private pool: TWSoldier[] = [];
  private idCounter = 0;
  
  // 통계
  stats = {
    created: 0,
    recycled: 0,
    active: 0,
    poolSize: 0,
  };
  
  /**
   * 풀에서 병사 획득 또는 새로 생성
   */
  acquire(squadId: string, teamId: 'attacker' | 'defender'): TWSoldier {
    let soldier: TWSoldier;
    
    if (this.pool.length > 0) {
      soldier = this.pool.pop()!;
      this.stats.recycled++;
    } else {
      soldier = this.createEmptySoldier();
      this.stats.created++;
    }
    
    // 필수 필드 초기화
    soldier.id = `soldier-${this.idCounter++}`;
    soldier.squadId = squadId;
    soldier.teamId = teamId;
    soldier.state = 'idle';
    soldier.lastStateChangeTime = 0;
    
    this.stats.active++;
    this.stats.poolSize = this.pool.length;
    
    return soldier;
  }
  
  /**
   * 죽은 병사를 풀에 반환
   */
  release(soldier: TWSoldier): void {
    // 상태 초기화
    this.resetSoldier(soldier);
    this.pool.push(soldier);
    
    this.stats.active--;
    this.stats.poolSize = this.pool.length;
  }
  
  /**
   * 빈 병사 객체 생성 (최소 속성)
   */
  private createEmptySoldier(): TWSoldier {
    return {
      id: '',
      squadId: '',
      teamId: 'attacker',
      position: { x: 0, z: 0 },
      targetPosition: { x: 0, z: 0 },
      facing: 0,
      hp: 0,
      maxHp: 0,
      meleeAttack: 0,
      meleeDefense: 0,
      weaponDamage: 0,
      armorPiercing: 0,
      armor: 0,
      chargeBonus: 0,
      mass: 0,
      speed: 0,
      weaponType: 'slash',
      attackRange: 0,
      attackCooldown: 0,
      minAttackRange: 0,
      isRanged: false,
      state: 'idle',
      morale: 100,
      fatigue: 0,
      lastAttackTime: 0,
      isCharging: false,
      formationSlot: { row: 0, col: 0 },
      formationOffset: { x: 0, z: 0 },
      // 시야/인식 시스템
      visionRange: 30,         // 기본 시야 30m
      visionAngle: Math.PI * 2 / 3, // 120도
      awarenessRange: 10,      // 청각 인식 10m
      knownEnemies: new Set(),
      lastKnownEnemyPositions: new Map(),
      // 탄약 시스템
      ammo: 0,
      maxAmmo: 0,
      isOutOfAmmo: false,
      // 개성/행동 (랜덤 생성됨)
      personality: 'disciplined',
      combatStyle: 'direct',
      reactionTime: 200,
      aggressionLevel: 0.5,
      disciplineLevel: 0.5,
      survivalInstinct: 0.5,
      // 상태 변경 타임스탬프
      lastStateChangeTime: 0,
    };
  }
  
  /**
   * 병사 상태 초기화 (재사용 준비)
   */
  private resetSoldier(soldier: TWSoldier): void {
    soldier.id = '';
    soldier.squadId = '';
    soldier.state = 'idle';
    soldier.engagedWith = undefined;
    soldier.chargeStartTime = undefined;
    soldier.isCharging = false;
    soldier.hp = 0;
    soldier.morale = 100;
    soldier.fatigue = 0;
    soldier.lastAttackTime = 0;
    soldier.position.x = 0;
    soldier.position.z = 0;
    soldier.targetPosition.x = 0;
    soldier.targetPosition.z = 0;
    // 시야/인식 초기화
    soldier.knownEnemies.clear();
    soldier.lastKnownEnemyPositions.clear();
  }
  
  /**
   * 풀 사전 확장
   */
  prewarm(count: number): void {
    for (let i = 0; i < count; i++) {
      this.pool.push(this.createEmptySoldier());
      this.stats.created++;
    }
    this.stats.poolSize = this.pool.length;
  }
  
  /**
   * 통계 조회
   */
  getStats(): typeof this.stats & { recycleRate: number } {
    return {
      ...this.stats,
      recycleRate: this.stats.created > 0 
        ? this.stats.recycled / this.stats.created 
        : 0,
    };
  }
  
  /**
   * ID 카운터 값 가져오기
   */
  getIdCounter(): number {
    return this.idCounter;
  }
  
  /**
   * ID 카운터 설정
   */
  setIdCounter(value: number): void {
    this.idCounter = value;
  }
}

/**
 * 투사체 풀
 */
export class ProjectilePool {
  private pool: TWProjectile[] = [];
  private idCounter = 0;
  
  acquire(): TWProjectile {
    if (this.pool.length > 0) {
      return this.pool.pop()!;
    }
    return this.createEmpty();
  }
  
  release(proj: TWProjectile): void {
    this.resetProjectile(proj);
    this.pool.push(proj);
  }
  
  private createEmpty(): TWProjectile {
    return {
      id: '',
      from: { x: 0, y: 0, z: 0 },
      to: { x: 0, y: 0, z: 0 },
      current: { x: 0, y: 0, z: 0 },
      type: 'arrow',
      damage: 0,
      sourceId: '',
      targetId: undefined,
      startTime: 0,
      duration: 0,
      hit: false,
    };
  }
  
  private resetProjectile(proj: TWProjectile): void {
    proj.id = '';
    proj.sourceId = '';
    proj.targetId = undefined;
    proj.damage = 0;
    proj.hit = false;
  }
  
  generateId(): string {
    return `proj-${this.idCounter++}`;
  }
  
  prewarm(count: number): void {
    for (let i = 0; i < count; i++) {
      this.pool.push(this.createEmpty());
    }
  }
}

export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

/** 개별 병사 */
export interface TWSoldier {
  id: string;
  squadId: string;
  teamId: 'attacker' | 'defender';
  
  // 위치/회전
  position: Vector2;
  targetPosition: Vector2;
  facing: number;  // 라디안
  
  // 전투 스탯
  hp: number;
  maxHp: number;
  meleeAttack: number;      // 근접 공격 (명중률)
  meleeDefense: number;     // 근접 방어 (회피율)
  weaponDamage: number;     // 무기 데미지
  armorPiercing: number;    // 방어구 관통
  armor: number;            // 방어구
  chargeBonus: number;      // 돌격 보너스
  mass: number;             // 질량 (충돌 시 밀림)
  speed: number;            // 이동 속도
  
  // 무기 정보
  weaponType: WeaponAttackType;
  attackRange: number;
  attackCooldown: number;
  minAttackRange: number;   // 원거리 무기 최소 사거리
  isRanged: boolean;
  
  // 상태
  state: SoldierState;
  lastStateChangeTime: number;  // ★ 마지막 상태 변경 시간 (깜빡임 방지)
  morale: number;           // 0~100
  fatigue: number;          // 피로도 0~100 (높을수록 능력 저하)
  
  // 전투 상태
  engagedWith?: string;     // 현재 교전 중인 적 병사 ID
  lastAttackTime: number;
  chargeStartTime?: number; // 돌격 시작 시간
  isCharging: boolean;
  
  // ★ 추격 시스템
  pursuitTarget?: string;     // 추격 중인 적 병사 ID
  pursuitStartTime?: number;  // 추격 시작 시간
  pursuitStartPosition?: Vector2; // 추격 시작 위치 (거리 제한용)
  
  // 진형 내 위치
  formationSlot: { row: number; col: number };
  formationOffset: Vector2; // 부대 중심으로부터의 오프셋
  
  // ★ 시야/인식 시스템
  visionRange: number;         // 시야 거리 (전방)
  visionAngle: number;         // 시야각 (라디안, 기본 120도)
  awarenessRange: number;      // 청각/기타 인식 범위 (360도)
  knownEnemies: Set<string>;   // 인식한 적 병사 ID들
  lastKnownEnemyPositions: Map<string, Vector2>; // 마지막으로 본 적 위치
  
  // ★ 탄약 시스템 (원거리 유닛용)
  ammo: number;                // 현재 탄약
  maxAmmo: number;             // 최대 탄약
  isOutOfAmmo: boolean;        // 탄약 소진 여부
  
  // ★ 개성/행동 다양성
  personality: SoldierPersonality;
  combatStyle: CombatStyle;
  reactionTime: number;        // 반응 시간 (ms) - 낮을수록 빠름
  aggressionLevel: number;     // 공격 성향 0~1
  disciplineLevel: number;     // 규율 수준 0~1 (높으면 진형 유지)
  survivalInstinct: number;    // 생존 본능 0~1 (높으면 위험 회피)
}

/** 병사 성격 유형 */
export type SoldierPersonality = 
  | 'brave'        // 용감 - 사기 저하 느림, 먼저 돌진
  | 'cautious'     // 신중 - 측면/약점 공략, 위험 회피
  | 'aggressive'   // 공격적 - 높은 공격성, 방어 무시
  | 'defensive'    // 방어적 - 위치 고수, 반격 위주
  | 'disciplined'  // 규율적 - 진형 유지, 명령 충실
  | 'independent'  // 독립적 - 자유 판단, 기회주의
  | 'berserker'    // 광전사 - 피해 무시, 무모한 돌진
  | 'coward';      // 겁쟁이 - 쉽게 도주, 후방 선호

/** 전투 스타일 */
export type CombatStyle =
  | 'direct'       // 정면 돌파
  | 'flanker'      // 측면 공격
  | 'duelist'      // 1:1 결투 선호
  | 'support'      // 아군 지원
  | 'skirmisher'   // 치고 빠지기
  | 'holdLine';    // 전선 유지

export type SoldierState = 
  | 'idle'           // 대기
  | 'moving'         // 이동
  | 'charging'       // 돌격
  | 'fighting'       // 교전
  | 'pursuing'       // 추격
  | 'wavering'       // 동요 (사기 저하)
  | 'routing'        // 탈주
  | 'rallying'       // 재집결
  | 'dead';

/** 부대 (Squad) */
export interface TWSquad {
  id: string;
  teamId: 'attacker' | 'defender';
  name: string;
  unitTypeId: number;
  
  // 위치/방향
  position: Vector2;
  targetPosition?: Vector2;
  facing: number;
  targetFacing?: number;
  
  // 진형
  formation: TWFormation;
  width: number;          // 진형 가로 병사 수
  depth: number;          // 진형 세로 병사 수
  spacing: number;        // 병사 간격
  
  // ★ 진형 결속 시스템
  formationState: FormationState;   // 진형 상태
  formationCohesion: number;        // 결속도 0~100 (높을수록 정돈됨)
  isFormationLocked: boolean;       // 진형 고정 (이동 시 진형 유지)
  lastFormationCheck: number;       // 마지막 진형 체크 시간
  
  // ★ 이동 모드
  movementMode: MovementMode;       // 걷기/달리기/돌격
  
  // 부대원
  soldiers: TWSoldier[];
  aliveSoldiers: number;
  
  // 부대 스탯 (기본값, 장수 보정)
  baseMeleeAttack: number;
  baseMeleeDefense: number;
  baseWeaponDamage: number;
  baseArmor: number;
  baseChargeBonus: number;
  baseMorale: number;
  baseSpeed: number;
  
  // 장수 보정
  leadership: number;     // 통솔
  strength: number;       // 무력
  intelligence: number;   // 지력
  
  // 부대 상태
  state: SquadState;
  morale: number;         // 평균 사기
  fatigue: number;        // 평균 피로도
  
  // 명령
  command: SquadCommand;
  stance: TWStance;
  
  // 전투 기록
  kills: number;
  losses: number;
  
  // 유닛 분류
  category: TWUnitCategory;
  isRanged: boolean;          // 원거리 유닛 여부
  
  // ★ 탄약 정보 (원거리 유닛)
  totalAmmo: number;          // 총 탄약 (부대 전체)
  currentAmmo: number;        // 현재 남은 탄약 (부대 전체)
  
  // ★ 전술 역할
  tacticalRole: TacticalRole;
  tacticalTarget?: string;    // 현재 전술 타겟 부대 ID
  tacticalPriority: number;   // 전술 우선순위 (높을수록 중요)
  
  // ★ AI 전투 스타일
  aiStyle: BattleAIStyle;
  advanceLine: number;        // 전진 제한선 (이 x 좌표 이상 전진 안 함)
  commanderPersonality: CommanderPersonality;  // 사령관 성격
  
  // 재집결 관련
  rallyPoint?: Vector2;       // 재집결 지점
  rallyStartTime?: number;    // 재집결 시작 시간
  hasRouted: boolean;         // 한 번이라도 패주했는지 (패주 시 true, 복귀 불가)
}

/** 진형 결속 상태 */
export type FormationState =
  | 'formed'      // 정돈됨 - 전투 보너스
  | 'forming'     // 정렬 중 - 보너스/페널티 없음
  | 'loose'       // 느슨함 - 약간의 페널티
  | 'disordered'  // 무질서 - 큰 페널티
  | 'broken';     // 붕괴 - 최대 페널티, 재정렬 필요

/** ★ 이동 모드 */
export type MovementMode =
  | 'walk'        // 걷기 - 느리지만 피로도 안 오름, 진형 유지
  | 'run'         // 달리기 - 빠르지만 피로도 증가, 보병은 진형 약간 흐트러짐
  | 'charge';     // 돌격 - 최고 속도, 피로도 많이 증가, 진형 깨짐

/** 이동 모드별 설정 */
export const MOVEMENT_MODE_CONFIG: Record<MovementMode, {
  speedMultiplier: number;      // 속도 배율
  fatigueRate: number;          // 피로도 증가율 (/초)
  formationDisorder: number;    // 진형 흐트러짐 (보병만, 0~1)
  canMaintainFormation: boolean; // 진형 유지 가능 여부
}> = {
  walk: {
    speedMultiplier: 1.0,
    fatigueRate: 0,              // 피로도 증가 없음
    formationDisorder: 0,        // 진형 유지
    canMaintainFormation: true,
  },
  run: {
    speedMultiplier: 1.6,        // 60% 빠름
    fatigueRate: 0.5,            // 초당 0.5 피로도 증가
    formationDisorder: 0.15,     // 보병: 15% 진형 흐트러짐
    canMaintainFormation: true,  // 어느 정도 유지 가능
  },
  charge: {
    speedMultiplier: 2.0,        // 100% 빠름
    fatigueRate: 1.5,            // 초당 1.5 피로도 증가
    formationDisorder: 0.4,      // 보병: 40% 진형 흐트러짐
    canMaintainFormation: false, // 진형 유지 불가
  },
};

/** 진형 상태별 전투 수정치 */
export const FORMATION_STATE_MODIFIERS: Record<FormationState, {
  meleeAttackMod: number;
  meleeDefenseMod: number;
  moraleMod: number;
  speedMod: number;
  chargeBonusMod: number;
}> = {
  formed: { meleeAttackMod: 1.1, meleeDefenseMod: 1.2, moraleMod: 1.1, speedMod: 0.9, chargeBonusMod: 1.3 },
  forming: { meleeAttackMod: 1.0, meleeDefenseMod: 1.0, moraleMod: 1.0, speedMod: 0.7, chargeBonusMod: 0.8 },
  loose: { meleeAttackMod: 0.95, meleeDefenseMod: 0.9, moraleMod: 0.95, speedMod: 1.0, chargeBonusMod: 0.9 },
  disordered: { meleeAttackMod: 0.8, meleeDefenseMod: 0.7, moraleMod: 0.8, speedMod: 1.1, chargeBonusMod: 0.5 },
  broken: { meleeAttackMod: 0.6, meleeDefenseMod: 0.5, moraleMod: 0.6, speedMod: 1.2, chargeBonusMod: 0.2 },
};

export type SquadState = 
  | 'idle'
  | 'moving'
  | 'engaging'    // 교전 중
  | 'reforming'   // 진형 재집결 중
  | 'wavering'    // 동요
  | 'routing'     // 탈주 (흩어짐)
  | 'rallying'    // 재집결 중
  | 'routed'      // 패주 (전투 이탈, 복귀 불가)
  | 'destroyed';  // 전멸

export type SquadCommand = 
  | { type: 'hold' }                    // 위치 고수
  | { type: 'move'; target: Vector2 }   // 이동
  | { type: 'attack'; targetId: string } // 공격
  | { type: 'retreat' };                 // 후퇴

export type TWFormation = 
  | 'line'        // 횡대 - 넓게 펼침
  | 'column'      // 종대 - 좁고 깊게
  | 'square'      // 방진 - 전방위 방어
  | 'wedge'       // 쐐기 - 돌파용
  | 'loose'       // 산개 - 원거리 회피
  | 'testudo'     // 거북이 - 화살 방어
  | 'shield_wall'; // 방패벽 - 정면 방어

export type TWStance = 
  | 'aggressive'  // 공격적 - 자동 추격
  | 'defensive'   // 방어적 - 위치 고수
  | 'skirmish'    // 산개 - 원거리 전투, 근접 회피
  | 'guard';      // 호위 - 지정 위치 사수

/** 
 * 토탈워 삼국 병종 분류
 * - 지창병(Ji Infantry): 극/창 사용, 대기병 특화
 * - 도검병(Sword Infantry): 도검 사용, 범용 근접
 * - 극병(Halberd Infantry): 극 사용, 공격적 창병
 * - 궁병(Archer): 활 사용, 원거리
 * - 노병(Crossbow): 쇠뇌 사용, 관통력 높음
 * - 기병(Cavalry): 기마 근접, 기동성
 * - 충격기병(Shock Cavalry): 돌격 특화, 높은 충격력
 * - 궁기병(Horse Archer): 기마 궁수
 * - 전차병(Chariot): 전차, 높은 충격력
 * - 책사(Strategist): 버프/디버프
 * - 공성병기(Siege): 공성무기
 */
export type TWUnitCategory = 
  | 'ji_infantry'     // 지창병 (대기병)
  | 'sword_infantry'  // 도검병
  | 'halberd_infantry'// 극병
  | 'spear_guard'     // 창방패병 (방어 특화)
  | 'archer'          // 궁병
  | 'crossbow'        // 노병
  | 'cavalry'         // 기병
  | 'shock_cavalry'   // 충격기병
  | 'horse_archer'    // 궁기병
  | 'chariot'         // 전차병
  | 'strategist'      // 책사
  | 'siege';          // 공성

/** 전술적 역할 */
export type TacticalRole =
  | 'line_holder'      // 전선 유지 (보병)
  | 'flanker'          // 측면 공격 (기병)
  | 'breakthrough'     // 돌파 (충격 기병, 전차)
  | 'archer_hunter'    // 궁병 사냥 (기병)
  | 'cavalry_screen'   // 기병 저지 (창병)
  | 'fire_support'     // 화력 지원 (궁병, 노병)
  | 'skirmisher'       // 산개 전투 (궁기병)
  | 'reserve';         // 예비대

/** AI 전투 스타일 - 어떻게 싸울지 */
export type BattleAIStyle =
  | 'aggressive'       // 개돌 - 무조건 돌격
  | 'cautious'         // 신중 - 단계적 전진, 전선 유지
  | 'kiting'           // 니가와 - 거리 유지하며 치고 빠지기
  | 'hold_line'        // 전선 고수 - 특정 선까지만 전진
  | 'support'          // 지원 - 아군 따라다니며 지원
  | 'ambush';          // 매복 - 대기하다가 기습

/** 유닛 카테고리별 기본 AI 스타일 */
export const CATEGORY_DEFAULT_AI_STYLE: Record<TWUnitCategory, BattleAIStyle> = {
  ji_infantry: 'hold_line',       // 지창병 = 전선 고수
  sword_infantry: 'cautious',     // 도검병 = 신중 전진
  halberd_infantry: 'aggressive', // 극병 = 공격적
  spear_guard: 'hold_line',       // 창방패 = 전선 고수
  archer: 'support',              // 궁병 = 지원
  crossbow: 'support',            // 노병 = 지원
  cavalry: 'aggressive',          // 기병 = 개돌
  shock_cavalry: 'aggressive',    // 충격기병 = 개돌
  horse_archer: 'kiting',         // 궁기병 = 니가와
  chariot: 'aggressive',          // 전차 = 개돌
  strategist: 'support',          // 책사 = 지원
  siege: 'hold_line',             // 공성 = 전선 고수
};

/** 사령관(장수) 성격 유형 */
export type CommanderPersonality =
  | 'reckless'       // 무모 - 여포, 장비 (개돌, 높은 리스크)
  | 'aggressive'     // 공격적 - 관우, 장료 (적극 공격)
  | 'balanced'       // 균형 - 조조, 유비 (상황 판단)
  | 'cautious'       // 신중 - 사마의, 육손 (방어적, 기회 대기)
  | 'strategist'     // 지략가 - 제갈량, 주유 (복잡한 전술)
  | 'defensive';     // 수비형 - 조인, 학소 (전선 고수)

/** 사령관 성격별 AI 스타일 수정치 */
export const COMMANDER_STYLE_MODIFIER: Record<CommanderPersonality, {
  preferredStyles: BattleAIStyle[];           // 선호 스타일
  advanceRateMultiplier: number;              // 전진 속도 배율
  engageDistanceMultiplier: number;           // 교전 거리 배율
  retreatThresholdMultiplier: number;         // 후퇴 임계값 배율
  waitForAlliesOverride?: boolean;            // 아군 대기 강제 설정
}> = {
  reckless: {
    preferredStyles: ['aggressive'],
    advanceRateMultiplier: 1.5,
    engageDistanceMultiplier: 1.5,
    retreatThresholdMultiplier: 0.3,          // 거의 안 후퇴
    waitForAlliesOverride: false,
  },
  aggressive: {
    preferredStyles: ['aggressive', 'cautious'],
    advanceRateMultiplier: 1.2,
    engageDistanceMultiplier: 1.2,
    retreatThresholdMultiplier: 0.7,
  },
  balanced: {
    preferredStyles: ['cautious', 'hold_line', 'aggressive'],
    advanceRateMultiplier: 1.0,
    engageDistanceMultiplier: 1.0,
    retreatThresholdMultiplier: 1.0,
  },
  cautious: {
    preferredStyles: ['cautious', 'hold_line', 'support'],
    advanceRateMultiplier: 0.7,
    engageDistanceMultiplier: 0.8,
    retreatThresholdMultiplier: 1.3,
    waitForAlliesOverride: true,
  },
  strategist: {
    preferredStyles: ['kiting', 'ambush', 'support'],
    advanceRateMultiplier: 0.8,
    engageDistanceMultiplier: 1.0,
    retreatThresholdMultiplier: 1.2,
  },
  defensive: {
    preferredStyles: ['hold_line', 'support'],
    advanceRateMultiplier: 0.5,
    engageDistanceMultiplier: 0.6,
    retreatThresholdMultiplier: 1.5,
    waitForAlliesOverride: true,
  },
};

/** AI 스타일별 행동 파라미터 */
export const AI_STYLE_PARAMS: Record<BattleAIStyle, {
  advanceRate: number;         // 전진 속도 (1.0 = 즉시, 0.5 = 천천히)
  engageDistance: number;      // 교전 시작 거리
  retreatThreshold: number;    // 후퇴 임계값 (HP% 또는 사기)
  holdLineDistance?: number;   // 전선 고수 거리 (선 넘으면 멈춤)
  kitingDistance?: number;     // 니가와 유지 거리
  waitForAllies: boolean;      // 아군 기다림
}> = {
  aggressive: {
    advanceRate: 1.0,
    engageDistance: 50,
    retreatThreshold: 0.1,    // 거의 안 후퇴
    waitForAllies: false,     // 혼자서도 돌격
  },
  cautious: {
    advanceRate: 0.6,
    engageDistance: 20,
    retreatThreshold: 0.4,
    waitForAllies: true,      // 아군과 보조 맞춤
  },
  kiting: {
    advanceRate: 0.8,
    engageDistance: 80,       // 멀리서 시작
    retreatThreshold: 0.3,
    kitingDistance: 40,       // 40m 거리 유지
    waitForAllies: false,
  },
  hold_line: {
    advanceRate: 0.4,
    engageDistance: 15,
    retreatThreshold: 0.5,
    holdLineDistance: 100,    // 100m 선에서 멈춤
    waitForAllies: true,
  },
  support: {
    advanceRate: 0.5,
    engageDistance: 100,      // 원거리 유닛용
    retreatThreshold: 0.6,
    waitForAllies: true,
  },
  ambush: {
    advanceRate: 0,           // 전진 안 함
    engageDistance: 30,       // 가까이 오면 기습
    retreatThreshold: 0.5,
    waitForAllies: false,
  },
};

/** 카테고리별 기본 전술 역할 */
export const CATEGORY_DEFAULT_ROLE: Record<TWUnitCategory, TacticalRole> = {
  ji_infantry: 'cavalry_screen',      // 지창병 = 기병 저지
  sword_infantry: 'line_holder',      // 도검병 = 전선 유지
  halberd_infantry: 'line_holder',    // 극병 = 전선 유지
  spear_guard: 'cavalry_screen',      // 창방패 = 기병 저지
  archer: 'fire_support',             // 궁병 = 화력 지원
  crossbow: 'fire_support',           // 노병 = 화력 지원
  cavalry: 'archer_hunter',           // 기병 = 궁병 사냥
  shock_cavalry: 'breakthrough',      // 충격기병 = 돌파
  horse_archer: 'skirmisher',         // 궁기병 = 산개
  chariot: 'breakthrough',            // 전차 = 돌파
  strategist: 'reserve',              // 책사 = 예비
  siege: 'fire_support',              // 공성 = 화력
};

/** 
 * 역할별 타겟 선호도 설정
 * - sizePreference: 'small' | 'large' | 'any' - 부대 크기 선호
 * - healthPreference: 'weak' | 'strong' | 'any' - 체력 상태 선호  
 * - distanceWeight: 거리 가중치 (높을수록 가까운 적 선호)
 * - categoryPreference: 특정 유닛 카테고리 선호
 */
export const TACTICAL_TARGET_PREFERENCE: Record<TacticalRole, {
  sizePreference: 'small' | 'large' | 'any';
  healthPreference: 'weak' | 'strong' | 'any';
  distanceWeight: number;
  categoryBonus: Partial<Record<TWUnitCategory, number>>; // 카테고리별 타겟 점수 보너스
}> = {
  breakthrough: {
    sizePreference: 'small',     // 작은 부대 뚫기 쉬움
    healthPreference: 'weak',    // 약한 부대 우선
    distanceWeight: 0.5,         // 거리보다 약점 우선
    categoryBonus: { archer: 30, crossbow: 30, strategist: 50 }, // 후방 타겟 선호
  },
  archer_hunter: {
    sizePreference: 'small',     // 작은 궁병대 먼저 제거
    healthPreference: 'weak',
    distanceWeight: 0.7,
    categoryBonus: { archer: 50, crossbow: 40, horse_archer: 30, siege: 20 }, // 원거리 우선
  },
  flanker: {
    sizePreference: 'any',
    healthPreference: 'any',
    distanceWeight: 0.6,
    categoryBonus: { archer: 20, crossbow: 20 }, // 측면 노출된 원거리 선호
  },
  cavalry_screen: {
    sizePreference: 'large',     // 큰 기병대가 더 위협적
    healthPreference: 'strong',  // 강한 기병 저지
    distanceWeight: 0.8,
    categoryBonus: { cavalry: 40, shock_cavalry: 50, chariot: 30, horse_archer: 20 }, // 기병류 우선
  },
  fire_support: {
    sizePreference: 'large',     // 큰 부대에 화살 효과적
    healthPreference: 'any',
    distanceWeight: 0.3,         // 사거리 내면 OK
    categoryBonus: { sword_infantry: 10, halberd_infantry: 10 }, // 밀집 보병 선호
  },
  skirmisher: {
    sizePreference: 'small',     // 작은 부대 괴롭히기
    healthPreference: 'weak',
    distanceWeight: 0.4,
    categoryBonus: { archer: 20, strategist: 30 }, // 약한 타겟
  },
  line_holder: {
    sizePreference: 'any',       // 가장 가까운 적
    healthPreference: 'any',
    distanceWeight: 1.0,         // 거리 최우선
    categoryBonus: {},
  },
  reserve: {
    sizePreference: 'any',
    healthPreference: 'weak',
    distanceWeight: 0.5,
    categoryBonus: {},
  },
};

// ========================================
// 상수
// ========================================

/** 진형별 설정 (더 밀집된 간격) */
export const FORMATION_CONFIG: Record<TWFormation, {
  spacingMultiplier: number;  // 간격 배율
  widthToDepthRatio: number;  // 가로:세로 비율
  meleeAttackBonus: number;
  meleeDefenseBonus: number;
  chargeDefenseBonus: number; // 돌격 방어 보너스
  rangedDefenseBonus: number; // 원거리 방어 보너스
  speedMultiplier: number;
  description: string;
}> = {
  line: {
    spacingMultiplier: 0.8,   // 1.0 → 0.8 (더 밀집)
    widthToDepthRatio: 4,
    meleeAttackBonus: 1.1,
    meleeDefenseBonus: 1.0,
    chargeDefenseBonus: 0.8,
    rangedDefenseBonus: 1.0,
    speedMultiplier: 1.0,
    description: '넓은 전선, 많은 병사가 전투 참여',
  },
  column: {
    spacingMultiplier: 0.6,   // 0.8 → 0.6 (더 밀집)
    widthToDepthRatio: 0.5,
    meleeAttackBonus: 0.9,
    meleeDefenseBonus: 1.1,
    chargeDefenseBonus: 1.2,
    rangedDefenseBonus: 0.9,
    speedMultiplier: 1.1,
    description: '좁은 전선, 돌파력',
  },
  square: {
    spacingMultiplier: 0.7,   // 0.9 → 0.7 (더 밀집)
    widthToDepthRatio: 1,
    meleeAttackBonus: 0.9,
    meleeDefenseBonus: 1.2,
    chargeDefenseBonus: 1.3,
    rangedDefenseBonus: 1.0,
    speedMultiplier: 0.8,
    description: '전방위 방어, 기병 돌격에 강함',
  },
  wedge: {
    spacingMultiplier: 0.9,   // 1.2 → 0.9 (더 밀집된 돌격)
    widthToDepthRatio: 1,
    meleeAttackBonus: 1.3,
    meleeDefenseBonus: 0.8,
    chargeDefenseBonus: 0.7,
    rangedDefenseBonus: 0.9,
    speedMultiplier: 1.2,
    description: '돌격 특화, 적진 돌파',
  },
  loose: {
    spacingMultiplier: 1.5,   // 2.0 → 1.5 (원거리는 적당히 산개)
    widthToDepthRatio: 2,
    meleeAttackBonus: 0.8,
    meleeDefenseBonus: 0.7,
    chargeDefenseBonus: 0.6,
    rangedDefenseBonus: 1.5,
    speedMultiplier: 1.3,
    description: '산개, 원거리 피해 감소',
  },
  testudo: {
    spacingMultiplier: 0.4,   // 0.6 → 0.4 (매우 밀집)
    widthToDepthRatio: 1.5,
    meleeAttackBonus: 0.5,
    meleeDefenseBonus: 1.5,
    chargeDefenseBonus: 1.5,
    rangedDefenseBonus: 2.0,
    speedMultiplier: 0.4,
    description: '거북이 진형, 화살에 매우 강함',
  },
  shield_wall: {
    spacingMultiplier: 0.5,   // 0.7 → 0.5 (방패벽 밀집)
    widthToDepthRatio: 3,
    meleeAttackBonus: 0.7,
    meleeDefenseBonus: 1.4,
    chargeDefenseBonus: 1.4,
    rangedDefenseBonus: 1.3,
    speedMultiplier: 0.5,
    description: '방패벽, 정면 방어에 강함',
  },
};

/**
 * 병사 개성 랜덤 생성
 * 유닛 카테고리에 따라 확률 분포가 다름
 */
export function generateSoldierPersonality(category: TWUnitCategory): {
  personality: SoldierPersonality;
  combatStyle: CombatStyle;
  reactionTime: number;
  aggressionLevel: number;
  disciplineLevel: number;
  survivalInstinct: number;
} {
  const rand = Math.random();
  
  // 카테고리별 성격 확률 분포
  const personalityWeights: Record<TWUnitCategory, Record<SoldierPersonality, number>> = {
    // 보병류
    ji_infantry: { brave: 0.15, cautious: 0.2, aggressive: 0.1, defensive: 0.25, disciplined: 0.2, independent: 0.05, berserker: 0.02, coward: 0.03 },
    sword_infantry: { brave: 0.2, cautious: 0.15, aggressive: 0.15, defensive: 0.15, disciplined: 0.2, independent: 0.1, berserker: 0.03, coward: 0.02 },
    halberd_infantry: { brave: 0.25, cautious: 0.1, aggressive: 0.2, defensive: 0.1, disciplined: 0.2, independent: 0.1, berserker: 0.04, coward: 0.01 },
    spear_guard: { brave: 0.2, cautious: 0.15, aggressive: 0.05, defensive: 0.35, disciplined: 0.2, independent: 0.02, berserker: 0.01, coward: 0.02 },
    // 원거리
    archer: { brave: 0.1, cautious: 0.3, aggressive: 0.1, defensive: 0.15, disciplined: 0.2, independent: 0.1, berserker: 0.01, coward: 0.04 },
    crossbow: { brave: 0.1, cautious: 0.25, aggressive: 0.1, defensive: 0.2, disciplined: 0.25, independent: 0.05, berserker: 0.01, coward: 0.04 },
    // 기병류
    cavalry: { brave: 0.3, cautious: 0.1, aggressive: 0.25, defensive: 0.05, disciplined: 0.15, independent: 0.1, berserker: 0.04, coward: 0.01 },
    shock_cavalry: { brave: 0.35, cautious: 0.05, aggressive: 0.3, defensive: 0.05, disciplined: 0.1, independent: 0.1, berserker: 0.04, coward: 0.01 },
    horse_archer: { brave: 0.2, cautious: 0.2, aggressive: 0.15, defensive: 0.1, disciplined: 0.15, independent: 0.15, berserker: 0.02, coward: 0.03 },
    // 특수
    chariot: { brave: 0.3, cautious: 0.1, aggressive: 0.25, defensive: 0.1, disciplined: 0.15, independent: 0.05, berserker: 0.04, coward: 0.01 },
    strategist: { brave: 0.1, cautious: 0.35, aggressive: 0.05, defensive: 0.2, disciplined: 0.2, independent: 0.05, berserker: 0, coward: 0.05 },
    siege: { brave: 0.1, cautious: 0.3, aggressive: 0.05, defensive: 0.3, disciplined: 0.2, independent: 0.03, berserker: 0, coward: 0.02 },
  };
  
  // 가중치 기반 랜덤 선택
  const weights = personalityWeights[category];
  let cumulative = 0;
  let personality: SoldierPersonality = 'disciplined';
  for (const [p, weight] of Object.entries(weights)) {
    cumulative += weight;
    if (rand < cumulative) {
      personality = p as SoldierPersonality;
      break;
    }
  }
  
  // 성격에 따른 전투 스타일
  const styleByPersonality: Record<SoldierPersonality, CombatStyle[]> = {
    brave: ['direct', 'duelist'],
    cautious: ['flanker', 'support', 'holdLine'],
    aggressive: ['direct', 'duelist'],
    defensive: ['holdLine', 'support'],
    disciplined: ['holdLine', 'direct'],
    independent: ['flanker', 'skirmisher'],
    berserker: ['direct'],
    coward: ['skirmisher', 'support'],
  };
  const styles = styleByPersonality[personality];
  const combatStyle = styles[Math.floor(Math.random() * styles.length)];
  
  // 성격에 따른 수치 변동
  const baseStats: Record<SoldierPersonality, { reaction: number; aggression: number; discipline: number; survival: number }> = {
    brave: { reaction: 150, aggression: 0.7, discipline: 0.5, survival: 0.3 },
    cautious: { reaction: 250, aggression: 0.3, discipline: 0.6, survival: 0.7 },
    aggressive: { reaction: 120, aggression: 0.9, discipline: 0.3, survival: 0.2 },
    defensive: { reaction: 200, aggression: 0.3, discipline: 0.7, survival: 0.6 },
    disciplined: { reaction: 180, aggression: 0.5, discipline: 0.9, survival: 0.5 },
    independent: { reaction: 160, aggression: 0.6, discipline: 0.2, survival: 0.5 },
    berserker: { reaction: 80, aggression: 1.0, discipline: 0.1, survival: 0.1 },
    coward: { reaction: 300, aggression: 0.1, discipline: 0.3, survival: 0.9 },
  };
  
  const base = baseStats[personality];
  // 개인 편차 추가 (±20%)
  const variance = () => 0.8 + Math.random() * 0.4;
  
  return {
    personality,
    combatStyle,
    reactionTime: Math.round(base.reaction * variance()),
    aggressionLevel: Math.min(1, Math.max(0, base.aggression * variance())),
    disciplineLevel: Math.min(1, Math.max(0, base.discipline * variance())),
    survivalInstinct: Math.min(1, Math.max(0, base.survival * variance())),
  };
}

/** 
 * 전투 템포 조절 상수
 * 100명당 1유닛, 적당한 속도감
 */
export const COMBAT_TEMPO = {
  hpMultiplier: 1.5,          // HP 1.5배
  damageMultiplier: 0.8,      // 데미지 80%
  attackCooldownMultiplier: 1.0, // 공격 쿨다운 기본
  speedMultiplier: 1.5,       // 이동속도 150% (빠른 접근)
  moraleRecoveryRate: 0.1,    // 사기 회복률
  fatigueRate: 0.01,          // 피로도 증가율 (감소)
};

/** 
 * ★ 전투 템포 스케일 (25명당 1인 기준)
 * HP를 높여 전투를 10분 이상 지속되도록 조정
 */
const BATTLE_TEMPO_SCALE = {
  hpMultiplier: 5,           // HP 5배 (25명 대표 = 더 오래 버팀)
  cooldownMultiplier: 2.5,   // 쿨다운 2.5배 (공격 속도 느리게)
  damageMultiplier: 0.8,     // 데미지 80% (약간 감소)
};

/** 
 * 유닛 카테고리별 기본 스탯
 * 토탈워 삼국 기준 (25명당 1인 전투 템포 적용)
 */
export const CATEGORY_BASE_STATS: Record<TWUnitCategory, {
  hp: number;
  meleeAttack: number;
  meleeDefense: number;
  weaponDamage: number;       // 일반 피해
  armorPiercing: number;      // 방어구 관통 피해
  bonusVsCavalry: number;     // 대기병 보너스
  bonusVsInfantry: number;    // 대보병 보너스
  armor: number;
  chargeBonus: number;
  chargeDefense: number;      // 돌격 방어 (창병 특화)
  mass: number;
  speed: number;
  lanchesterResistance: number; // ★ 란체스터 저항 (0~1, 높을수록 수적 열세에 강함)
  // ★ 방패 방어 시스템
  shieldBlock: number;        // 방패 차단율 (0~1, 전방 화살 차단 확률)
  missileResist: number;      // 원거리 피해 감소 (0~1)
  ammunition?: number;        // 탄약 (원거리용)
  range?: number;             // 사거리 (원거리용)
  reloadTime?: number;        // 재장전 시간 (원거리용)
}> = {
  // 지창병: 대기병 특화, 돌격 방어 높음 - 밀집 진형으로 약간의 저항
  // HP: 255 * 5 = 1275
  ji_infantry: { 
    hp: 1275, meleeAttack: 28, meleeDefense: 38, 
    weaponDamage: 7, armorPiercing: 2, 
    bonusVsCavalry: 10, bonusVsInfantry: 0,
    armor: 45, chargeBonus: 2, chargeDefense: 20,
    mass: 1.0, speed: 2.0, lanchesterResistance: 0.2,
    shieldBlock: 0.3, missileResist: 0.2  // 작은 방패
  },
  // 도검병: 범용 근접, 균형잡힌 스탯 - 방패 있음
  // HP: 285 * 5 = 1425
  sword_infantry: { 
    hp: 1425, meleeAttack: 32, meleeDefense: 32, 
    weaponDamage: 9, armorPiercing: 2,
    bonusVsCavalry: 0, bonusVsInfantry: 0,
    armor: 55, chargeBonus: 3, chargeDefense: 8,
    mass: 1.0, speed: 2.1, lanchesterResistance: 0.1,
    shieldBlock: 0.5, missileResist: 0.3  // 중형 방패
  },
  // 극병: 공격적 장창병, 높은 피해 - 방패 없음
  // HP: 270 * 5 = 1350
  halberd_infantry: { 
    hp: 1350, meleeAttack: 35, meleeDefense: 28, 
    weaponDamage: 10, armorPiercing: 4,
    bonusVsCavalry: 6, bonusVsInfantry: 3,
    armor: 40, chargeBonus: 4, chargeDefense: 12,
    mass: 1.0, speed: 2.0, lanchesterResistance: 0.15,
    shieldBlock: 0, missileResist: 0  // 양손 무기, 방패 없음
  },
  // 창방패병: 방어 특화 - ★불굴! 높은 란체스터 저항, 대형 방패
  // HP: 300 * 5 = 1500
  spear_guard: { 
    hp: 1500, meleeAttack: 24, meleeDefense: 45, 
    weaponDamage: 6, armorPiercing: 2,
    bonusVsCavalry: 8, bonusVsInfantry: 0,
    armor: 70, chargeBonus: 1, chargeDefense: 25,
    mass: 1.2, speed: 1.8, lanchesterResistance: 0.5,
    shieldBlock: 0.7, missileResist: 0.5  // ★ 대형 방패! 화살 70% 차단
  },
  // 궁병: 원거리, 근접 약함 - 수적 열세에 취약
  // HP: 195 * 5 = 975
  // ★ 사거리 증가: 150 → 250 (니가와 전략)
  archer: { 
    hp: 975, meleeAttack: 14, meleeDefense: 12, 
    weaponDamage: 2, armorPiercing: 1,
    bonusVsCavalry: 0, bonusVsInfantry: 0,
    armor: 20, chargeBonus: 0, chargeDefense: 0,
    mass: 0.8, speed: 2.2, lanchesterResistance: 0,
    shieldBlock: 0, missileResist: 0,  // 방패 없음
    ammunition: 40, range: 250, reloadTime: 7500  // ★ 사거리 250
  },
  // 노병: 원거리, 관통력 높음 - ★노병 볼트는 방패 관통!
  // HP: 210 * 5 = 1050
  // ★ 사거리 증가: 180 → 300 (니가와 전략)
  crossbow: { 
    hp: 1050, meleeAttack: 16, meleeDefense: 14, 
    weaponDamage: 2, armorPiercing: 9,  // 높은 관통력
    bonusVsCavalry: 0, bonusVsInfantry: 0,
    armor: 35, chargeBonus: 0, chargeDefense: 0,
    mass: 0.9, speed: 2.0, lanchesterResistance: 0.1,
    shieldBlock: 0.2, missileResist: 0.1,  // 약간의 방패
    ammunition: 30, range: 300, reloadTime: 12500  // ★ 사거리 300
  },
  // 기병: 기동성 - 빠른 이탈로 회피
  // HP: 345 * 5 = 1725
  cavalry: { 
    hp: 1725, meleeAttack: 34, meleeDefense: 28, 
    weaponDamage: 10, armorPiercing: 2,
    bonusVsCavalry: 0, bonusVsInfantry: 2,
    armor: 50, chargeBonus: 14, chargeDefense: 0,
    mass: 3.0, speed: 5.0, lanchesterResistance: 0.3,
    shieldBlock: 0.4, missileResist: 0.2  // 기마방패
  },
  // 충격기병: 돌격 특화 - ★정예! 높은 저항
  // HP: 375 * 5 = 1875
  shock_cavalry: { 
    hp: 1875, meleeAttack: 38, meleeDefense: 22, 
    weaponDamage: 12, armorPiercing: 5,
    bonusVsCavalry: 0, bonusVsInfantry: 5,
    armor: 60, chargeBonus: 22, chargeDefense: 0,
    mass: 4.0, speed: 5.5, lanchesterResistance: 0.4,
    shieldBlock: 0.3, missileResist: 0.25  // 중갑
  },
  // 궁기병: 기동 사격 - 기동력으로 회피
  // HP: 270 * 5 = 1350
  // ★ 사거리 증가: 120 → 180 (기동하면서 사격)
  horse_archer: { 
    hp: 1350, meleeAttack: 20, meleeDefense: 18, 
    weaponDamage: 2, armorPiercing: 1,
    bonusVsCavalry: 0, bonusVsInfantry: 0,
    armor: 30, chargeBonus: 6, chargeDefense: 0,
    mass: 2.5, speed: 5.5, lanchesterResistance: 0.35,
    shieldBlock: 0.2, missileResist: 0.1,  // 경장
    ammunition: 35, range: 180, reloadTime: 6250  // ★ 사거리 180
  },
  // 전차병: 높은 충격력 - 돌파력으로 저항
  // HP: 540 * 5 = 2700
  chariot: { 
    hp: 2700, meleeAttack: 30, meleeDefense: 20, 
    weaponDamage: 14, armorPiercing: 6,
    bonusVsCavalry: 0, bonusVsInfantry: 7,
    armor: 65, chargeBonus: 28, chargeDefense: 0,
    mass: 6.0, speed: 4.5, lanchesterResistance: 0.45,
    shieldBlock: 0.5, missileResist: 0.3  // 전차 방패
  },
  // 책사: 전투력 낮음 - 수적 열세에 매우 취약
  // HP: 165 * 5 = 825
  strategist: { 
    hp: 825, meleeAttack: 10, meleeDefense: 8, 
    weaponDamage: 2, armorPiercing: 1,
    bonusVsCavalry: 0, bonusVsInfantry: 0,
    armor: 15, chargeBonus: 0, chargeDefense: 0,
    mass: 0.7, speed: 1.8, lanchesterResistance: 0,
    shieldBlock: 0, missileResist: 0
  },
  // 공성병기: 높은 피해, 느림 - 수적 열세에 매우 취약
  // HP: 750 * 5 = 3750
  siege: { 
    hp: 3750, meleeAttack: 5, meleeDefense: 5, 
    weaponDamage: 25, armorPiercing: 20,
    bonusVsCavalry: 0, bonusVsInfantry: 0,
    armor: 60, chargeBonus: 0, chargeDefense: 0,
    mass: 12.0, speed: 0.7, lanchesterResistance: 0,
    shieldBlock: 0, missileResist: 0.4,  // 나무 구조물
    ammunition: 15, range: 350, reloadTime: 25000  // ★ 25초 쿨다운 (10초 * 2.5)
  },
};

/** 측면/후방 공격 보너스 */
export const FLANKING_BONUS = {
  front: 1.0,       // 정면
  flank: 1.5,       // 측면 (+50%)
  rear: 2.0,        // 후방 (+100%)
};

/** 돌격 보너스 지속 시간 (ms) */
export const CHARGE_BONUS_DURATION = 5000;

/** 사기 임계값 */
export const MORALE_THRESHOLDS = {
  wavering: 40,     // 동요 시작
  routing: 20,      // 탈주 시작
  shattered: 5,     // 완전 붕괴 (패주, 재집결 불가)
  rallyMorale: 30,  // 재집결 시 복귀 사기
};

/** 재집결 관련 상수 */
export const RALLY_CONFIG = {
  safeDistance: 50,           // 적과의 최소 안전 거리
  rallyTime: 5000,            // 재집결에 필요한 시간 (ms)
  rallyRadius: 8,             // 재집결 반경
  minSoldiersToRally: 3,      // 재집결에 필요한 최소 병사 수
};

/** ★ 추격 관련 상수 */
export const PURSUIT_CONFIG = {
  maxDistance: 80,            // 최대 추격 거리
  maxDuration: 15000,         // 최대 추격 시간 (ms)
  triggerRange: 15,           // 패주 적 감지 시 추격 전환 범위
  pursuitSpeedBonus: 1.4,     // 추격 중 속도 보너스
  rearAttackDamageMultiplier: 2.5, // 후방 공격 피해 배율
  pursuitChance: 0.6,         // 추격 전환 확률 (60%)
  cavalryPursuitChance: 0.9,  // 기병 추격 확률 (90%)
  lineHolderPursuitChance: 0.2, // 방진 병사 추격 확률 (20% - 진형 유지)
};

/** 
 * 유닛 타입 상성 (카운터 관계)
 * 토탈워 삼국 기준:
 * - 창병 → 기병 (대기병 보너스)
 * - 기병 → 궁병/노병 (빠른 접근)
 * - 궁병 → 보병 (원거리 피해)
 * - 도검병 → 창병 (방패로 창 막음)
 */
export const UNIT_COUNTER: Record<TWUnitCategory, TWUnitCategory[]> = {
  ji_infantry: ['cavalry', 'shock_cavalry', 'chariot'],      // 창병 → 기병
  sword_infantry: ['ji_infantry', 'halberd_infantry'],       // 도검병 → 창병
  halberd_infantry: ['cavalry', 'shock_cavalry'],            // 극병 → 기병
  spear_guard: ['cavalry', 'shock_cavalry', 'chariot'],      // 창방패 → 기병
  archer: ['sword_infantry', 'halberd_infantry', 'siege'],   // 궁병 → 보병
  crossbow: ['cavalry', 'shock_cavalry', 'chariot'],         // 노병 → 기병 (관통)
  cavalry: ['archer', 'crossbow', 'strategist', 'siege'],    // 기병 → 원거리
  shock_cavalry: ['archer', 'crossbow', 'strategist'],       // 충격기병 → 원거리
  horse_archer: ['sword_infantry', 'halberd_infantry'],      // 궁기병 → 보병
  chariot: ['archer', 'crossbow', 'sword_infantry'],         // 전차 → 원거리/보병
  strategist: [],                                             // 책사 → 없음
  siege: [],                                                  // 공성 → 없음
};

/** 유닛별 취약점 (약한 상대) */
export const UNIT_WEAKNESS: Record<TWUnitCategory, TWUnitCategory[]> = {
  ji_infantry: ['sword_infantry', 'archer'],                 // 창병 ← 도검병
  sword_infantry: ['archer', 'crossbow'],                    // 도검병 ← 원거리
  halberd_infantry: ['sword_infantry', 'archer'],            // 극병 ← 도검병
  spear_guard: ['archer', 'crossbow'],                       // 창방패 ← 원거리
  archer: ['cavalry', 'shock_cavalry', 'horse_archer'],      // 궁병 ← 기병
  crossbow: ['cavalry', 'shock_cavalry'],                    // 노병 ← 기병
  cavalry: ['ji_infantry', 'spear_guard', 'halberd_infantry'], // 기병 ← 창병
  shock_cavalry: ['ji_infantry', 'spear_guard'],             // 충격기병 ← 창병
  horse_archer: ['cavalry', 'shock_cavalry'],                // 궁기병 ← 기병
  chariot: ['ji_infantry', 'spear_guard'],                   // 전차 ← 창병
  strategist: ['cavalry', 'shock_cavalry'],                  // 책사 ← 기병
  siege: ['cavalry', 'shock_cavalry'],                       // 공성 ← 기병
};

// ========================================
// 전투 엔진
// ========================================

export interface TWBattleState {
  squads: Map<string, TWSquad>;
  soldiers: Map<string, TWSoldier>;
  currentTime: number;
  deltaTime: number;
  battleStartTime: number;
  isActive: boolean;
  winner?: 'attacker' | 'defender' | 'draw';
  
  // ★ 전황 점수 (줄다리기)
  battleScore: {
    attackerScore: number;    // 공격팀 점수 (0~100)
    defenderScore: number;    // 방어팀 점수 (0~100)
    momentum: number;         // 기세 (-100~100, 양수=공격팀 우세)
    victoryThreshold: number; // 승리 임계값 (기본 100)
    initialTotalHp: number;   // ★ 초기 전장 총 HP (점수 계산용)
  };
  
  // 전선 정보
  battleLines: BattleLine[];
  
  // 투사체
  projectiles: TWProjectile[];
  
  // 이벤트 로그
  events: BattleEvent[];
  
  // ★ 전장의 안개 (Fog of War)
  fogOfWar: FogOfWarState;
  
  // ★ 팀 진영 정보 (실제 배치 기반)
  teamPositions: {
    attackerCenter: Vector2;    // 공격팀 중심 위치
    defenderCenter: Vector2;    // 방어팀 중심 위치
    battlefieldCenter: Vector2; // 전장 중심
    attackerFacing: number;     // 공격팀이 바라보는 방향 (라디안)
    defenderFacing: number;     // 방어팀이 바라보는 방향
  };
}

/** 전장의 안개 상태 */
export interface FogOfWarState {
  enabled: boolean;
  gridSize: number;          // 안개 그리드 셀 크기
  attackerVisibility: Set<string>;  // 공격팀 시야 셀 (현재 보임)
  defenderVisibility: Set<string>;  // 방어팀 시야 셀
  attackerExplored: Set<string>;    // 공격팀 탐색한 셀 (한번이라도 봄)
  defenderExplored: Set<string>;    // 방어팀 탐색한 셀
}

/** 시야 상태 */
export type VisibilityState = 'hidden' | 'fogged' | 'visible';

/** 유닛 카테고리별 시야 범위 */
export const UNIT_VISION_RANGE: Record<TWUnitCategory, number> = {
  ji_infantry: 40,
  sword_infantry: 40,
  halberd_infantry: 40,
  spear_guard: 35,
  archer: 60,        // 원거리 = 넓은 시야
  crossbow: 55,
  cavalry: 50,       // 기병 = 빠른 정찰
  shock_cavalry: 45,
  horse_archer: 65,  // 궁기병 = 최대 시야
  chariot: 45,
  strategist: 50,
  siege: 30,         // 공성 = 좁은 시야
};

export interface BattleLine {
  id: string;
  attackerSquadId: string;
  defenderSquadId: string;
  position: Vector2;
  direction: number;      // 전선 방향 (라디안)
  width: number;
  engagedPairs: Array<{ attacker: string; defender: string }>;
}

export interface TWProjectile {
  id: string;
  from: Vector3;
  to: Vector3;
  current: Vector3;
  type: string;
  damage: number;
  sourceId: string;
  targetId?: string;
  startTime: number;
  duration: number;
  hit: boolean;
}

export interface BattleEvent {
  time: number;
  type: 'kill' | 'rout' | 'rally' | 'charge' | 'flank' | 'victory';
  data: Record<string, unknown>;
}

// ========================================
// 성능 측정 시스템
// ========================================

export interface PerformanceMetrics {
  frameTime: number;          // 프레임 처리 시간 (ms)
  updateTime: number;         // 업데이트 시간 (ms)
  collisionTime: number;      // 충돌 처리 시간 (ms)
  aiTime: number;             // AI 처리 시간 (ms)
  quadtreeRebuildTime: number;// Quadtree 재구축 시간 (ms)
  soldierCount: number;       // 현재 병사 수
  activeSoldierCount: number; // 활성 병사 수 (alive)
  fps: number;                // 현재 FPS
  avgFps: number;             // 평균 FPS
  quadtreeStats: {
    queryCount: number;
    insertCount: number;
  };
  poolStats: {
    soldiers: { active: number; poolSize: number; recycleRate: number };
    projectiles: { active: number; poolSize: number };
  };
}

export class TotalWarEngine {
  private state: TWBattleState;
  
  // ========================================
  // 최적화 시스템
  // ========================================
  
  /** 공간 분할 Quadtree */
  private quadtree: Quadtree;
  private WORLD_SIZE = 500;  // 전장 크기 (-250 ~ +250), setWorldSize로 변경 가능
  
  /** 오브젝트 풀 */
  private soldierPool: SoldierPool;
  private projectilePool: ProjectilePool;
  
  /** 재사용 버퍼 (배열 재생성 방지) */
  private queryBuffer: QTPoint[] = [];
  private nearbyEnemiesBuffer: TWSoldier[] = [];
  private collisionCandidatesBuffer: QTPoint[] = [];
  
  /** 성능 측정 */
  private metrics: PerformanceMetrics = {
    frameTime: 0,
    updateTime: 0,
    collisionTime: 0,
    aiTime: 0,
    quadtreeRebuildTime: 0,
    soldierCount: 0,
    activeSoldierCount: 0,
    fps: 60,
    avgFps: 60,
    quadtreeStats: { queryCount: 0, insertCount: 0 },
    poolStats: {
      soldiers: { active: 0, poolSize: 0, recycleRate: 0 },
      projectiles: { active: 0, poolSize: 0 },
    },
  };
  
  /** FPS 계산용 */
  private fpsHistory: number[] = [];
  private lastFrameTime = 0;
  
  /** 죽은 병사 정리 주기 (프레임 수) */
  private deadSoldierCleanupInterval = 60;  // 60프레임마다
  private frameCounter = 0;
  
  // ========================================
  // 전술 AI 시스템
  // ========================================
  
  /** 전술 AI */
  private tacticsAI: SquadTacticsAI;
  
  /** 전술 AI 사용 여부 */
  private useTacticsAI = true;
  
  /** 전술 AI 업데이트 주기 (프레임 수) */
  private tacticsUpdateInterval = 30;  // 30프레임마다 (약 0.5초)
  
  constructor() {
    this.state = {
      squads: new Map(),
      soldiers: new Map(),
      currentTime: 0,
      deltaTime: 0,
      battleStartTime: 0,
      isActive: false,
      // ★ 전황 점수 초기화
      battleScore: {
        attackerScore: 50,      // 시작은 50:50
        defenderScore: 50,
        momentum: 0,
        victoryThreshold: 100,
        initialTotalHp: 0,      // 첫 부대 생성 후 계산됨
      },
      battleLines: [],
      projectiles: [],
      events: [],
      // ★ 전장의 안개 초기화
      fogOfWar: {
        enabled: true,
        gridSize: 10,  // 10m 단위 그리드
        attackerVisibility: new Set(),
        defenderVisibility: new Set(),
        attackerExplored: new Set(),
        defenderExplored: new Set(),
      },
      // ★ 팀 진영 정보 초기화 (부대 배치 후 계산됨)
      teamPositions: {
        attackerCenter: { x: 0, z: 0 },
        defenderCenter: { x: 0, z: 0 },
        battlefieldCenter: { x: 0, z: 0 },
        attackerFacing: 0,
        defenderFacing: Math.PI,
      },
    };
    
    // Quadtree 초기화 (전장 중심 0,0 기준)
    this.quadtree = new Quadtree({
      x: 0,
      z: 0,
      halfWidth: this.WORLD_SIZE / 2,
      halfHeight: this.WORLD_SIZE / 2,
    }, 8);
    
    // 풀 초기화
    this.soldierPool = new SoldierPool();
    this.projectilePool = new ProjectilePool();
    
    // 대규모 전투용 풀 사전 확장
    this.soldierPool.prewarm(500);
    this.projectilePool.prewarm(200);
    
    // 전술 AI 초기화
    this.tacticsAI = createSquadTacticsAI(this);
  }
  
  // ========================================
  // 부대 생성
  // ========================================
  
  createSquad(config: {
    teamId: 'attacker' | 'defender';
    name: string;
    unitTypeId: number;
    category: TWUnitCategory;
    position: Vector2;
    facing: number;
    soldierCount: number;
    formation?: TWFormation;
    // 장수 스탯
    leadership?: number;
    strength?: number;
    intelligence?: number;
    // ★ 사령관 성격 (AI 스타일 결정)
    commanderPersonality?: CommanderPersonality;
  }): TWSquad {
    const category = config.category;
    const baseStats = CATEGORY_BASE_STATS[category];
    const formation = config.formation || 'line';
    const formationConfig = FORMATION_CONFIG[formation];
    
    // ★ 원거리 유닛 여부 판단
    const isRangedUnit = ['archer', 'crossbow', 'horse_archer', 'siege'].includes(category);
    
    // 진형에 따른 가로/세로 계산
    const totalSoldiers = config.soldierCount;
    const ratio = formationConfig.widthToDepthRatio;
    let width = Math.ceil(Math.sqrt(totalSoldiers * ratio));
    let depth = Math.ceil(totalSoldiers / width);
    
    const squad: TWSquad = {
      id: `squad-${config.teamId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      teamId: config.teamId,
      name: config.name,
      unitTypeId: config.unitTypeId,
      position: { ...config.position },
      facing: config.facing,
      formation,
      width,
      depth,
      spacing: 1.0 * formationConfig.spacingMultiplier, // 더 밀집된 진형
      // ★ 진형 결속 초기화
      formationState: 'formed',
      formationCohesion: 100,
      isFormationLocked: true,  // 기본값: 진형 유지
      lastFormationCheck: 0,
      movementMode: 'walk',     // ★ 기본 이동 모드: 걷기
      soldiers: [],
      aliveSoldiers: totalSoldiers,
      baseMeleeAttack: baseStats.meleeAttack,
      baseMeleeDefense: baseStats.meleeDefense,
      baseWeaponDamage: baseStats.weaponDamage,
      baseArmor: baseStats.armor,
      baseChargeBonus: baseStats.chargeBonus,
      baseMorale: 70,
      baseSpeed: baseStats.speed,
      leadership: config.leadership || 50,
      strength: config.strength || 50,
      intelligence: config.intelligence || 50,
      state: 'idle',
      morale: 100,
      fatigue: 0,
      command: { type: 'hold' },
      stance: 'defensive',
      kills: 0,
      losses: 0,
      category,
      isRanged: isRangedUnit,
      // ★ 탄약 초기화 (원거리 유닛)
      totalAmmo: isRangedUnit && baseStats.ammunition ? baseStats.ammunition * config.soldierCount : 0,
      currentAmmo: isRangedUnit && baseStats.ammunition ? baseStats.ammunition * config.soldierCount : 0,
      // ★ 전술 역할 초기화
      tacticalRole: CATEGORY_DEFAULT_ROLE[category],
      tacticalTarget: undefined,
      tacticalPriority: this.calculateTacticalPriority(category),
      // ★ AI 스타일 초기화 (장수 성격 기반)
      aiStyle: CATEGORY_DEFAULT_AI_STYLE[category],
      advanceLine: config.teamId === 'attacker' ? 200 : -200, // 기본 전진선
      commanderPersonality: config.commanderPersonality || 'balanced',
      hasRouted: false,
    };
    
    // 병사 생성
    this.createSoldiersForSquad(squad, baseStats);
    
    this.state.squads.set(squad.id, squad);
    return squad;
  }
  
  /**
   * 부대 병사 생성 (오브젝트 풀 사용)
   * 풀에서 병사 획득 후 스탯 설정
   */
  private createSoldiersForSquad(
    squad: TWSquad, 
    baseStats: typeof CATEGORY_BASE_STATS[TWUnitCategory]
  ): void {
    const weaponType = this.getWeaponTypeForCategory(squad.category);
    const weaponConfig = WEAPON_COMBAT_CONFIG[weaponType];
    
    // 원거리 유닛 여부
    const isRangedUnit = baseStats.range !== undefined && baseStats.range > 0;
    
    // 장수 보정 적용 (한 번만 계산)
    const leaderBonus = 1 + (squad.leadership / 200);     // 통솔: 방어력, 사기
    const strengthBonus = 1 + (squad.strength / 200);     // 무력: 공격력, 피해량
    // const intelligenceBonus = 1 + (squad.intelligence / 200); // 지력: 책사 능력 (추후)
    
    let soldierIndex = 0;
    
    for (let row = 0; row < squad.depth; row++) {
      for (let col = 0; col < squad.width && soldierIndex < squad.aliveSoldiers; col++) {
        const offset = this.calculateFormationOffset(squad, row, col);
        const worldPos = this.localToWorld(offset, squad.position, squad.facing);
        
        // 풀에서 병사 획득
        const soldier = this.soldierPool.acquire(squad.id, squad.teamId);
        
        // 스탯 설정
        soldier.position.x = worldPos.x;
        soldier.position.z = worldPos.z;
        soldier.targetPosition.x = worldPos.x;
        soldier.targetPosition.z = worldPos.z;
        soldier.facing = squad.facing;
        
        soldier.hp = baseStats.hp;
        soldier.maxHp = baseStats.hp;
        soldier.meleeAttack = Math.round(baseStats.meleeAttack * strengthBonus);
        soldier.meleeDefense = Math.round(baseStats.meleeDefense * leaderBonus);
        soldier.weaponDamage = Math.round(baseStats.weaponDamage * strengthBonus);
        soldier.armorPiercing = Math.round(baseStats.armorPiercing * strengthBonus);
        soldier.armor = baseStats.armor;
        soldier.chargeBonus = baseStats.chargeBonus;
        soldier.mass = baseStats.mass;
        soldier.speed = baseStats.speed;
        
        soldier.weaponType = weaponType;
        soldier.attackRange = isRangedUnit ? baseStats.range! : weaponConfig.range;
        soldier.attackCooldown = isRangedUnit ? baseStats.reloadTime! : weaponConfig.cooldown;
        soldier.minAttackRange = isRangedUnit ? 10 : weaponConfig.minRange;
        soldier.isRanged = isRangedUnit;
        
        soldier.morale = 100;
        soldier.fatigue = 0;
        soldier.lastAttackTime = 0;
        soldier.isCharging = false;
        
        // ★ 개성 부여
        const personalityData = generateSoldierPersonality(squad.category);
        soldier.personality = personalityData.personality;
        soldier.combatStyle = personalityData.combatStyle;
        soldier.reactionTime = personalityData.reactionTime;
        soldier.aggressionLevel = personalityData.aggressionLevel;
        soldier.disciplineLevel = personalityData.disciplineLevel;
        soldier.survivalInstinct = personalityData.survivalInstinct;
        
        // 시야/인식 초기화 (★ 넓은 전장에서도 적을 볼 수 있도록)
        soldier.visionRange = isRangedUnit ? 80 : 60; // ★ 시야 범위 확대
        soldier.visionAngle = Math.PI * 2 / 3; // 120도
        soldier.awarenessRange = 15; // ★ 청각 범위 확대
        soldier.knownEnemies = new Set();
        soldier.lastKnownEnemyPositions = new Map();
        
        // ★ 탄약 설정 (원거리 유닛만)
        if (isRangedUnit && baseStats.ammunition) {
          soldier.maxAmmo = baseStats.ammunition;
          soldier.ammo = baseStats.ammunition;
          soldier.isOutOfAmmo = false;
        } else {
          soldier.maxAmmo = 0;
          soldier.ammo = 0;
          soldier.isOutOfAmmo = false;
        }
        
        soldier.formationSlot.row = row;
        soldier.formationSlot.col = col;
        soldier.formationOffset.x = offset.x;
        soldier.formationOffset.z = offset.z;
        
        squad.soldiers.push(soldier);
        this.state.soldiers.set(soldier.id, soldier);
        soldierIndex++;
      }
    }
  }
  
  private getWeaponTypeForCategory(category: TWUnitCategory): WeaponAttackType {
    switch (category) {
      case 'ji_infantry': return 'thrust';      // 지창병: 찌르기
      case 'sword_infantry': return 'slash';    // 도검병: 베기
      case 'halberd_infantry': return 'swing';  // 극병: 휘두르기
      case 'spear_guard': return 'thrust';      // 창방패병: 찌르기
      case 'archer': return 'shoot_bow';        // 궁병: 활
      case 'crossbow': return 'shoot_xbow';     // 노병: 쇠뇌
      case 'cavalry': return 'charge';          // 기병: 돌격
      case 'shock_cavalry': return 'charge';    // 충격기병: 돌격
      case 'horse_archer': return 'shoot_bow';  // 궁기병: 활
      case 'chariot': return 'charge';          // 전차: 돌격
      case 'strategist': return 'cast';         // 책사: 시전
      case 'siege': return 'siege';             // 공성: 공성
      default: return 'slash';
    }
  }
  
  private calculateFormationOffset(squad: TWSquad, row: number, col: number): Vector2 {
    const formation = squad.formation;
    const spacing = squad.spacing;
    const halfWidth = (squad.width - 1) / 2;
    
    let x = 0;
    let z = 0;
    
    switch (formation) {
      case 'wedge':
        // 쐐기형: 앞이 뾰족
        const rowWidth = row + 1;
        const rowHalfWidth = (rowWidth - 1) / 2;
        x = (col - rowHalfWidth) * spacing;
        z = -row * spacing;
        break;
        
      case 'square':
      case 'testudo':
      case 'shield_wall':
        // 정사각/거북이/방패벽
        x = (col - halfWidth) * spacing;
        z = -row * spacing;
        break;
        
      case 'loose':
        // 산개: 랜덤 오프셋 추가
        x = (col - halfWidth) * spacing + (Math.random() - 0.5) * spacing * 0.5;
        z = -row * spacing + (Math.random() - 0.5) * spacing * 0.5;
        break;
        
      default: // line, column
        x = (col - halfWidth) * spacing;
        z = -row * spacing;
    }
    
    return { x, z };
  }
  
  private localToWorld(local: Vector2, origin: Vector2, facing: number): Vector2 {
    const cos = Math.cos(facing);
    const sin = Math.sin(facing);
    return {
      x: origin.x + local.x * cos - local.z * sin,
      z: origin.z + local.x * sin + local.z * cos,
    };
  }
  
  // ========================================
  // 메인 업데이트 루프 (최적화됨)
  // ========================================
  
  /**
   * 메인 업데이트 루프
   * deltaTime 기반 프레임 독립적 시뮬레이션
   * 
   * 최적화:
   * - Quadtree 기반 공간 분할 (O(n²) → O(n log n))
   * - 오브젝트 풀링으로 메모리 할당 최소화
   * - 버퍼 재사용으로 GC 압력 감소
   */
  update(deltaTime: number): void {
    if (!this.state.isActive) return;
    
    const frameStart = performance.now();
    
    this.state.deltaTime = deltaTime;
    this.state.currentTime += deltaTime;
    this.frameCounter++;
    
    // ========================================
    // Phase 0: Quadtree 재구축
    // 매 프레임 병사 위치로 Quadtree 갱신
    // ========================================
    const qtStart = performance.now();
    this.rebuildQuadtree();
    this.metrics.quadtreeRebuildTime = performance.now() - qtStart;
    
    // ========================================
    // Phase 0.5: 전장의 안개 업데이트
    // ========================================
    this.updateFogOfWar();
    
    // ========================================
    // Phase 1: AI 업데이트
    // ========================================
    const aiStart = performance.now();
    
    // 1-1. 부대 AI 업데이트
    this.updateSquadAI();
    
    // 1-2. 전선 탐지 및 업데이트
    this.updateBattleLines();
    
    // 1-3. 병사 AI 업데이트 (Quadtree 기반 적 탐색)
    this.updateSoldierAI();
    
    this.metrics.aiTime = performance.now() - aiStart;
    
    // ========================================
    // Phase 2: 전투 처리
    // ========================================
    this.processCombat();
    
    // ========================================
    // Phase 3: 물리/충돌 처리 (Quadtree 최적화)
    // ========================================
    const collisionStart = performance.now();
    this.processCollisionsOptimized();
    this.metrics.collisionTime = performance.now() - collisionStart;
    
    // ========================================
    // Phase 4: 상태 업데이트
    // ========================================
    this.updateMorale();
    this.updateProjectilesOptimized();
    
    // ========================================
    // Phase 5: 정리 및 판정
    // ========================================
    
    // 주기적 죽은 병사 풀 반환
    if (this.frameCounter % this.deadSoldierCleanupInterval === 0) {
      this.cleanupDeadSoldiers();
    }
    
    this.checkVictory();
    
    // ========================================
    // 성능 측정 갱신
    // ========================================
    this.metrics.frameTime = performance.now() - frameStart;
    this.metrics.updateTime = this.metrics.frameTime;
    this.updateFpsMetrics();
    this.updatePoolMetrics();
  }
  
  /**
   * Quadtree 재구축
   * 매 프레임 살아있는 병사 위치로 갱신
   */
  private rebuildQuadtree(): void {
    // 통계 초기화
    Quadtree.resetStats();
    
    // 트리 초기화
    this.quadtree.clear();
    
    // 살아있는 병사만 삽입
    let activeCount = 0;
    this.state.soldiers.forEach(soldier => {
      if (soldier.state !== 'dead') {
        this.quadtree.insert({
          x: soldier.position.x,
          z: soldier.position.z,
          id: soldier.id,
          data: soldier,
        });
        activeCount++;
      }
    });
    
    this.metrics.soldierCount = this.state.soldiers.size;
    this.metrics.activeSoldierCount = activeCount;
    this.metrics.quadtreeStats = Quadtree.getStats();
  }
  
  /**
   * 죽은 병사를 풀에 반환
   * 주기적으로 호출하여 메모리 관리
   * 
   * 중요: squad.soldiers 배열에서도 제거해야 함!
   * 그렇지 않으면 풀에서 재사용될 때 state가 리셋되어 살아난 것처럼 보임
   */
  private cleanupDeadSoldiers(): void {
    const deadSoldiers: TWSoldier[] = [];
    
    this.state.soldiers.forEach((soldier, id) => {
      if (soldier.state === 'dead') {
        deadSoldiers.push(soldier);
      }
    });
    
    // 풀에 반환 및 squad.soldiers에서 제거
    for (const soldier of deadSoldiers) {
      // squad.soldiers 배열에서 제거
      const squad = this.state.squads.get(soldier.squadId);
      if (squad) {
        const index = squad.soldiers.indexOf(soldier);
        if (index !== -1) {
          squad.soldiers.splice(index, 1);
        }
      }
      
      // state.soldiers에서 삭제
      this.state.soldiers.delete(soldier.id);
      
      // 풀에 반환
      this.soldierPool.release(soldier);
    }
  }
  
  /**
   * FPS 메트릭 갱신
   */
  private updateFpsMetrics(): void {
    const now = performance.now();
    if (this.lastFrameTime > 0) {
      const frameMs = now - this.lastFrameTime;
      const fps = 1000 / frameMs;
      
      this.fpsHistory.push(fps);
      if (this.fpsHistory.length > 60) {
        this.fpsHistory.shift();
      }
      
      this.metrics.fps = fps;
      this.metrics.avgFps = this.fpsHistory.reduce((a, b) => a + b, 0) / this.fpsHistory.length;
    }
    this.lastFrameTime = now;
  }
  
  /**
   * 풀 메트릭 갱신
   */
  private updatePoolMetrics(): void {
    const soldierStats = this.soldierPool.getStats();
    this.metrics.poolStats.soldiers = {
      active: soldierStats.active,
      poolSize: soldierStats.poolSize,
      recycleRate: soldierStats.recycleRate,
    };
    
    this.metrics.poolStats.projectiles = {
      active: this.state.projectiles.length,
      poolSize: 0,  // ProjectilePool은 간단 버전
    };
  }
  
  // ========================================
  // 전술 AI 시스템
  // ========================================
  
  /** 유닛 카테고리별 전술 우선순위 */
  private calculateTacticalPriority(category: TWUnitCategory): number {
    const priorities: Record<TWUnitCategory, number> = {
      shock_cavalry: 10,   // 충격기병 = 최우선 돌파
      chariot: 9,          // 전차 = 돌파
      cavalry: 8,          // 기병 = 궁병 사냥
      horse_archer: 7,     // 궁기병 = 산개
      ji_infantry: 6,      // 지창병 = 기병 저지
      spear_guard: 6,      // 창방패 = 기병 저지
      halberd_infantry: 5, // 극병 = 전선
      sword_infantry: 4,   // 도검병 = 전선
      archer: 3,           // 궁병 = 화력
      crossbow: 3,         // 노병 = 화력
      siege: 2,            // 공성 = 화력
      strategist: 1,       // 책사 = 후방
    };
    return priorities[category] || 5;
  }
  
  /** 전술 AI 업데이트 - 역할별 타겟 찾기 및 명령 */
  private updateTacticalAI(): void {
    // 아군/적군 분리
    const attackerSquads: TWSquad[] = [];
    const defenderSquads: TWSquad[] = [];
    
    this.state.squads.forEach(squad => {
      if (squad.state === 'destroyed' || squad.state === 'routed' || squad.aliveSoldiers === 0) return;
      if (squad.teamId === 'attacker') {
        attackerSquads.push(squad);
      } else {
        defenderSquads.push(squad);
      }
    });
    
    // 각 팀별 전술 AI 실행
    this.executeTacticalAIForTeam(attackerSquads, defenderSquads);
    this.executeTacticalAIForTeam(defenderSquads, attackerSquads);
  }
  
  /** 팀별 전술 AI 실행 */
  private executeTacticalAIForTeam(friendlySquads: TWSquad[], enemySquads: TWSquad[]): void {
    if (friendlySquads.length === 0) return;
    
    const teamId = friendlySquads[0].teamId;
    
    // ★ FoW: 보이는 적만 필터링
    const visibleEnemies = this.state.fogOfWar.enabled
      ? enemySquads.filter(e => this.isEnemyVisible(e, teamId))
      : enemySquads;
    
    // 전술 우선순위 순으로 정렬
    const sortedSquads = [...friendlySquads].sort((a, b) => b.tacticalPriority - a.tacticalPriority);
    
    for (const squad of sortedSquads) {
      if (visibleEnemies.length > 0) {
        // 적이 보이면 전술 타겟 찾기
        const target = this.findTacticalTarget(squad, visibleEnemies, friendlySquads);
        
        if (target) {
          squad.tacticalTarget = target.id;
          this.executeTacticalAction(squad, target, friendlySquads);
        } else {
          squad.tacticalTarget = undefined;
        }
      } else {
        // ★ 적이 안 보이면 신중하게 전진 (정찰 모드)
        squad.tacticalTarget = undefined;
        this.executeScoutingAdvance(squad, friendlySquads, enemySquads);
      }
    }
  }
  
  /** 정찰 전진: 적이 안 보일 때 신중하게 전진 */
  private executeScoutingAdvance(squad: TWSquad, allies: TWSquad[], allEnemies: TWSquad[]): void {
    // 진형 유지
    squad.isFormationLocked = true;
    
    // 기병/궁기병은 정찰대로 앞서 나감
    const isScout = ['cavalry', 'horse_archer', 'shock_cavalry'].includes(squad.category);
    
    // ★ 실제 진영 기반 적 방향
    const enemyDir = this.getEnemyDirection(squad.teamId);
    
    // 아군 평균 위치
    const allyCenter = allies.length > 0 ? allies.reduce(
      (acc, a) => ({ x: acc.x + a.position.x / allies.length, z: acc.z + a.position.z / allies.length }),
      { x: 0, z: 0 }
    ) : squad.position;
    
    // 전진 거리 계산
    const advanceSpeed = isScout ? 15 : 8; // 정찰대는 더 빨리
    const advanceDistance = squad.formationState === 'formed' ? advanceSpeed : advanceSpeed * 0.5;
    
    // 전진 목표 계산 (적 방향으로)
    const targetPos = {
      x: squad.position.x + enemyDir.x * advanceDistance,
      z: squad.position.z + enemyDir.z * advanceDistance,
    };
    
    // 전선 유지: 다른 아군과 보조 맞추기 (적 방향 축 기준)
    const myAdvance = squad.position.x * enemyDir.x + squad.position.z * enemyDir.z;
    const shouldAdvance = isScout || allies.every(a => {
      const allyAdvance = a.position.x * enemyDir.x + a.position.z * enemyDir.z;
      return Math.abs(allyAdvance - myAdvance) < 30;
    });
    
    if (shouldAdvance && squad.formationState !== 'broken') {
      squad.targetPosition = targetPos;
      squad.state = 'moving';
      
      // 부대 방향을 적 방향으로
      squad.facing = Math.atan2(enemyDir.z, enemyDir.x);
      
      // 진형 유지하며 이동
      this.moveInFormation(squad, squad.targetPosition);
    } else {
      // 진형 재정렬 또는 대기
      if (squad.formationState === 'broken') {
        this.orderReform(squad);
      } else {
        squad.state = 'idle';
      }
    }
  }
  
  /** 역할별 최적 타겟 찾기 */
  private findTacticalTarget(squad: TWSquad, enemies: TWSquad[], allies: TWSquad[]): TWSquad | undefined {
    if (enemies.length === 0) return undefined;
    
    // ★ 선호도 기반 점수 시스템으로 최적 타겟 선택
    const preference = TACTICAL_TARGET_PREFERENCE[squad.tacticalRole];
    
    let bestTarget: TWSquad | undefined;
    let bestScore = -Infinity;
    
    // 적 부대 평균 크기 계산 (상대적 크기 비교용)
    const avgSize = enemies.reduce((sum, e) => sum + e.aliveSoldiers, 0) / enemies.length;
    
    for (const enemy of enemies) {
      let score = 0;
      
      // 1. 거리 점수 (가까울수록 높음)
      const distance = this.getDistance(squad.position, enemy.position);
      const maxDist = 200;
      const distScore = (1 - distance / maxDist) * 100 * preference.distanceWeight;
      score += distScore;
      
      // 2. 크기 선호도 점수
      if (preference.sizePreference === 'small') {
        // 작은 부대 선호: 평균보다 작으면 보너스
        score += (avgSize - enemy.aliveSoldiers) * 2;
      } else if (preference.sizePreference === 'large') {
        // 큰 부대 선호: 평균보다 크면 보너스
        score += (enemy.aliveSoldiers - avgSize) * 2;
      }
      
      // 3. 체력/사기 상태 선호도
      if (preference.healthPreference === 'weak') {
        // 약한 부대 선호: 사기 낮거나 병력 적으면 보너스
        score += (100 - enemy.morale) * 0.5;
        score += Math.max(0, 20 - enemy.aliveSoldiers) * 3;
      } else if (preference.healthPreference === 'strong') {
        // 강한 부대 선호: 사기 높고 병력 많으면 보너스
        score += enemy.morale * 0.3;
        score += enemy.aliveSoldiers * 0.5;
      }
      
      // 4. 카테고리 보너스
      const categoryBonus = preference.categoryBonus[enemy.category] || 0;
      score += categoryBonus;
      
      // 5. 추가 역할별 보너스
      score += this.getRoleSpecificBonus(squad, enemy, allies);
      
      if (score > bestScore) {
        bestScore = score;
        bestTarget = enemy;
      }
    }
    
    return bestTarget;
  }
  
  /** 역할별 추가 점수 보너스 */
  private getRoleSpecificBonus(squad: TWSquad, enemy: TWSquad, allies: TWSquad[]): number {
    let bonus = 0;
    
    switch (squad.tacticalRole) {
      case 'breakthrough':
        // 아군이 교전 중인 적의 후방이면 보너스
        const engagedAllies = allies.filter(a => a.state === 'engaging');
        for (const ally of engagedAllies) {
          if (this.getDistance(ally.position, enemy.position) < 30) {
            bonus += 20; // 아군이 붙잡고 있는 적
          }
        }
        break;
        
      case 'cavalry_screen':
        // 아군 궁병에게 접근 중인 적에게 보너스
        const allyArchers = allies.filter(a => ['archer', 'crossbow'].includes(a.category));
        for (const archer of allyArchers) {
          const distToArcher = this.getDistance(enemy.position, archer.position);
          if (distToArcher < 50) {
            bonus += (50 - distToArcher); // 가까울수록 위협적
          }
        }
        break;
        
      case 'fire_support':
        // 아군과 교전 중인 적에게 보너스
        if (enemy.state === 'engaging') {
          bonus += 30;
        }
        // 밀집된 적에게 보너스
        if (enemy.formationState === 'formed') {
          bonus += 20;
        }
        break;
        
      case 'flanker':
        // 측면/후방이 노출된 적에게 보너스
        const angleToUs = Math.atan2(
          squad.position.x - enemy.position.x,
          squad.position.z - enemy.position.z
        );
        let angleDiff = Math.abs(enemy.facing - angleToUs);
        if (angleDiff > Math.PI) angleDiff = 2 * Math.PI - angleDiff;
        if (angleDiff > Math.PI / 3) {
          bonus += angleDiff * 20; // 측면/후방 노출
        }
        break;
    }
    
    return bonus;
  }
  
  /** 돌파 타겟 찾기 - 적 전선의 약한 곳 */
  private findBreakthroughTarget(squad: TWSquad, enemies: TWSquad[], allies: TWSquad[]): TWSquad | undefined {
    // 1. 궁병 우선 (방어 취약)
    const archers = enemies.filter(e => 
      ['archer', 'crossbow', 'horse_archer'].includes(e.category)
    );
    if (archers.length > 0) {
      return this.findNearestFromList(squad, archers);
    }
    
    // 2. 약한 적 부대 (병력 적음, 사기 낮음)
    const weakEnemies = enemies.filter(e => 
      e.aliveSoldiers < 10 || e.morale < 50
    );
    if (weakEnemies.length > 0) {
      return this.findNearestFromList(squad, weakEnemies);
    }
    
    // 3. 전선에 빈 곳 찾기 - 아군이 교전 중인 곳의 측면
    const engagedAllies = allies.filter(a => a.state === 'engaging');
    if (engagedAllies.length > 0) {
      // 교전 중인 아군의 적 찾기
      for (const ally of engagedAllies) {
        const nearbyEnemies = enemies.filter(e => 
          this.getDistance(ally.position, e.position) < 30
        );
        // 그 적의 측면으로 돌격
        if (nearbyEnemies.length > 0) {
          return nearbyEnemies[0];
        }
      }
    }
    
    // 4. 기본: 가장 가까운 적
    return this.findNearestEnemy(squad, enemies);
  }
  
  /** 궁병 타겟 찾기 */
  private findArcherTarget(squad: TWSquad, enemies: TWSquad[]): TWSquad | undefined {
    // 원거리 유닛 우선
    const rangedEnemies = enemies.filter(e => 
      ['archer', 'crossbow', 'horse_archer', 'siege'].includes(e.category)
    );
    
    if (rangedEnemies.length > 0) {
      // 가장 가깝고 방어력 낮은 원거리 유닛
      return rangedEnemies.sort((a, b) => {
        const distA = this.getDistance(squad.position, a.position);
        const distB = this.getDistance(squad.position, b.position);
        const scoreA = distA - (100 - a.morale); // 거리 - 약함 점수
        const scoreB = distB - (100 - b.morale);
        return scoreA - scoreB;
      })[0];
    }
    
    // 원거리 없으면 가장 약한 적
    return enemies.sort((a, b) => a.aliveSoldiers - b.aliveSoldiers)[0];
  }
  
  /** 측면 공격 타겟 찾기 */
  private findFlankTarget(squad: TWSquad, enemies: TWSquad[], allies: TWSquad[]): TWSquad | undefined {
    // 아군과 교전 중인 적의 측면/후방 노출 찾기
    const engagedEnemies = enemies.filter(e => e.state === 'engaging');
    
    for (const enemy of engagedEnemies) {
      // 적의 측면이 우리 쪽을 향하고 있는지 체크
      const angleToUs = Math.atan2(
        squad.position.x - enemy.position.x,
        squad.position.z - enemy.position.z
      );
      let angleDiff = Math.abs(enemy.facing - angleToUs);
      if (angleDiff > Math.PI) angleDiff = 2 * Math.PI - angleDiff;
      
      // 측면(60도 이상) 또는 후방(120도 이상) 노출
      if (angleDiff > Math.PI / 3) {
        return enemy;
      }
    }
    
    return this.findNearestEnemy(squad, enemies);
  }
  
  /** 기병 위협 찾기 */
  private findCavalryThreat(squad: TWSquad, enemies: TWSquad[], allies: TWSquad[]): TWSquad | undefined {
    // 아군 궁병을 위협하는 적 기병 찾기
    const allyArchers = allies.filter(a => 
      ['archer', 'crossbow'].includes(a.category)
    );
    
    const enemyCavalry = enemies.filter(e => 
      ['cavalry', 'shock_cavalry', 'chariot'].includes(e.category)
    );
    
    if (enemyCavalry.length === 0) {
      return this.findNearestEnemy(squad, enemies);
    }
    
    // 아군 궁병에게 접근 중인 적 기병
    for (const archer of allyArchers) {
      for (const cav of enemyCavalry) {
        const distance = this.getDistance(archer.position, cav.position);
        if (distance < 50) { // 위협 거리
          return cav;
        }
      }
    }
    
    // 가장 가까운 적 기병
    return this.findNearestFromList(squad, enemyCavalry) || this.findNearestEnemy(squad, enemies);
  }
  
  /** 화력 지원 타겟 찾기 */
  private findFireSupportTarget(squad: TWSquad, enemies: TWSquad[], allies: TWSquad[]): TWSquad | undefined {
    // 아군이 교전 중인 적 우선
    const engagedAllies = allies.filter(a => a.state === 'engaging');
    
    for (const ally of engagedAllies) {
      const nearbyEnemies = enemies.filter(e => 
        this.getDistance(ally.position, e.position) < 20 &&
        this.getDistance(squad.position, e.position) <= squad.soldiers[0]?.attackRange || 100
      );
      if (nearbyEnemies.length > 0) {
        // 가장 밀집된 적
        return nearbyEnemies.sort((a, b) => b.aliveSoldiers - a.aliveSoldiers)[0];
      }
    }
    
    // 사거리 내 적
    const inRangeEnemies = enemies.filter(e => {
      const range = squad.soldiers[0]?.attackRange || 100;
      return this.getDistance(squad.position, e.position) <= range;
    });
    
    if (inRangeEnemies.length > 0) {
      return inRangeEnemies.sort((a, b) => b.aliveSoldiers - a.aliveSoldiers)[0];
    }
    
    return this.findNearestEnemy(squad, enemies);
  }
  
  /** 산개 타겟 찾기 (궁기병) */
  private findSkirmishTarget(squad: TWSquad, enemies: TWSquad[]): TWSquad | undefined {
    // 느리고 약한 적 우선
    return enemies.sort((a, b) => {
      const speedA = CATEGORY_BASE_STATS[a.category].speed;
      const speedB = CATEGORY_BASE_STATS[b.category].speed;
      const scoreA = speedA + a.morale / 10;
      const scoreB = speedB + b.morale / 10;
      return scoreA - scoreB;
    })[0];
  }
  
  /** 가장 가까운 적 찾기 */
  private findNearestEnemy(squad: TWSquad, enemies: TWSquad[]): TWSquad | undefined {
    return this.findNearestFromList(squad, enemies);
  }
  
  /** 리스트에서 가장 가까운 부대 찾기 */
  private findNearestFromList(squad: TWSquad, list: TWSquad[]): TWSquad | undefined {
    if (list.length === 0) return undefined;
    
    let nearest = list[0];
    let minDist = this.getDistance(squad.position, nearest.position);
    
    for (const target of list) {
      const dist = this.getDistance(squad.position, target.position);
      if (dist < minDist) {
        minDist = dist;
        nearest = target;
      }
    }
    
    return nearest;
  }
  
  /** 전술 행동 실행 */
  private executeTacticalAction(squad: TWSquad, target: TWSquad, allies: TWSquad[]): void {
    const distance = this.getDistance(squad.position, target.position);
    const aiParams = this.getEffectiveAIParams(squad);
    
    // ★ AI 스타일에 따른 전진 제한 체크
    if (this.shouldHoldPosition(squad, target, aiParams)) {
      squad.state = 'idle';
      return;
    }
    
    // ★ 아군 대기 체크
    if (aiParams.waitForAllies && !this.areAlliesReady(squad, allies)) {
      // 아군 기다리며 천천히 전진
      this.executeSlowAdvance(squad, target, aiParams.advanceRate);
      return;
    }
    
    // ★ 니가와 스타일 (치고 빠지기)
    if (squad.aiStyle === 'kiting' && aiParams.kitingDistance) {
      this.executeKiting(squad, target, aiParams.kitingDistance);
      return;
    }
    
    switch (squad.tacticalRole) {
      case 'breakthrough':
        // ★ 돌파: 외곽으로 돌아서 적 측면/후방 돌격
        const flankPosition = this.calculateFlankPosition(squad, target);
        const distToFlank = this.getDistance(squad.position, flankPosition);
        
        if (distance > 25 || distToFlank > 15) {
          // 1단계: 외곽 우회 경로로 이동
          const waypoint = this.calculateOuterWaypoint(squad, target);
          this.moveInFormation(squad, waypoint);
          squad.state = 'moving';
        } else if (distance > 8) {
          // 2단계: 측면에서 진형 유지 돌격
          this.executeCharge(squad, target);
        } else {
          // 3단계: 난전 돌입 (진형 해제)
          squad.isFormationLocked = false;
          squad.state = 'engaging';
          squad.targetPosition = { ...target.position };
        }
        break;
        
      case 'archer_hunter':
        // ★ 궁병 사냥: 진형 유지하며 빠르게 접근 후 돌격
        if (distance > 15) {
          // 진형 유지하며 접근
          this.moveInFormation(squad, target.position);
          squad.state = 'moving';
        } else if (distance > 5) {
          // 돌격 (진형 유지)
          this.executeCharge(squad, target);
        } else {
          // 난전 돌입 (진형 해제)
          squad.isFormationLocked = false;
          squad.state = 'engaging';
        }
        break;
        
      case 'flanker':
        // ★ 측면 공격: 외곽으로 돌아서 적 측면 돌격
        const flankerFlankPos = this.calculateFlankPosition(squad, target);
        const flankerDistToFlank = this.getDistance(squad.position, flankerFlankPos);
        
        if (distance > 20 || flankerDistToFlank > 12) {
          // 외곽 우회 경로로 이동
          const flankerWaypoint = this.calculateOuterWaypoint(squad, target);
          this.moveInFormation(squad, flankerWaypoint);
          squad.state = 'moving';
        } else if (distance > 5) {
          // 측면에서 진형 유지 돌격
          this.executeCharge(squad, target);
        } else {
          // 난전 돌입 (진형 해제)
          squad.isFormationLocked = false;
          squad.state = 'engaging';
        }
        break;
        
      case 'cavalry_screen':
        // ★ 기병 저지: 적 기병과 아군 사이에 위치
        const screenPos = this.calculateScreenPosition(squad, target, allies);
        squad.targetPosition = screenPos;
        if (distance < 10) {
          squad.state = 'engaging';
        } else {
          squad.state = 'moving';
        }
        break;
        
      case 'fire_support':
        // ★ 화력 지원: 니가와 전략 - 제자리에서 사격, 적이 올 때까지 대기
        const range = squad.soldiers[0]?.attackRange || 100;
        // 항상 적 방향을 바라봄
        squad.facing = Math.atan2(
          target.position.x - squad.position.x,
          target.position.z - squad.position.z
        );
        
        if (distance > range) {
          // ★ 니가와: 사거리 밖이어도 이동하지 않고 대기!
          // 적이 다가올 때까지 현재 위치 유지
          squad.state = 'idle';
          squad.targetPosition = undefined; // 이동 안 함
        } else {
          // 사거리 내 - 제자리 사격
          squad.state = 'engaging';
        }
        break;
        
      case 'skirmisher':
        // ★ 산개: 치고 빠지기
        const skirmishRange = squad.soldiers[0]?.attackRange || 80;
        if (distance < skirmishRange * 0.5) {
          // 너무 가까우면 후퇴
          const retreatAngle = Math.atan2(
            squad.position.x - target.position.x,
            squad.position.z - target.position.z
          );
          squad.targetPosition = {
            x: squad.position.x + Math.sin(retreatAngle) * 20,
            z: squad.position.z + Math.cos(retreatAngle) * 20,
          };
          squad.state = 'moving';
        } else if (distance <= skirmishRange) {
          squad.state = 'engaging';
        } else {
          // 접근
          const approachAngle = Math.atan2(
            target.position.x - squad.position.x,
            target.position.z - squad.position.z
          );
          squad.targetPosition = {
            x: target.position.x - Math.sin(approachAngle) * skirmishRange * 0.7,
            z: target.position.z - Math.cos(approachAngle) * skirmishRange * 0.7,
          };
          squad.state = 'moving';
        }
        break;
        
      case 'line_holder':
      default:
        // ★ 고대 전선 전투: 진형 유지하며 전선 밀기
        // 보병은 흩어지지 않고 일렬로 전진
        if (distance > 25) {
          // 멀면 걷기로 진형 유지 접근
          squad.movementMode = 'walk';
          this.moveInFormation(squad, target.position);
          squad.state = 'moving';
        } else if (distance > 10) {
          // 중거리: 달리기로 전진 (진형 약간 흐트러짐)
          squad.movementMode = 'run';
          // 적 부대 "앞"까지만 전진 (적 중심이 아님)
          const pushTarget = {
            x: target.position.x - Math.sin(squad.facing) * 3,
            z: target.position.z - Math.cos(squad.facing) * 3,
          };
          this.moveInFormation(squad, pushTarget);
          squad.state = 'moving';
        } else if (distance > 3) {
          // 근접: 걷기로 전선 밀기 (진형 유지!)
          squad.movementMode = 'walk';
          squad.isFormationLocked = true; // 진형 유지 강제
          // 조금씩 전진 (전선 밀기)
          const pushTarget = {
            x: squad.position.x + Math.sin(squad.facing) * 2,
            z: squad.position.z + Math.cos(squad.facing) * 2,
          };
          this.moveInFormation(squad, pushTarget);
          squad.state = 'engaging';
        } else {
          // 백병전: 제자리에서 싸움 (진형 유지!)
          squad.movementMode = 'walk';
          squad.isFormationLocked = true;
          squad.state = 'engaging';
          // 타겟은 현재 위치 (추격 X, 제자리 전투)
          squad.targetPosition = undefined;
        }
        break;
    }
  }
  
  /** 측면 접근 각도 계산 */
  private calculateFlankApproach(squad: TWSquad, target: TWSquad, allies: TWSquad[]): number {
    // 적이 바라보는 방향의 측면으로 접근
    const leftFlank = target.facing + Math.PI / 2;
    const rightFlank = target.facing - Math.PI / 2;
    
    // 우리 위치에서 어느 쪽이 가까운지
    const toLeft = Math.atan2(
      squad.position.x - (target.position.x + Math.sin(leftFlank) * 20),
      squad.position.z - (target.position.z + Math.cos(leftFlank) * 20)
    );
    const toRight = Math.atan2(
      squad.position.x - (target.position.x + Math.sin(rightFlank) * 20),
      squad.position.z - (target.position.z + Math.cos(rightFlank) * 20)
    );
    
    // 더 가까운 측면으로
    const distLeft = this.getDistance(squad.position, {
      x: target.position.x + Math.sin(leftFlank) * 20,
      z: target.position.z + Math.cos(leftFlank) * 20,
    });
    const distRight = this.getDistance(squad.position, {
      x: target.position.x + Math.sin(rightFlank) * 20,
      z: target.position.z + Math.cos(rightFlank) * 20,
    });
    
    return distLeft < distRight ? leftFlank : rightFlank;
  }
  
  /** 측면 위치 계산 - 적의 측면/후방으로 우회 */
  /** 외곽 우회 경로 계산 - 아군 진영을 피해 맵 가장자리로 돌아감 */
  private calculateOuterWaypoint(squad: TWSquad, target: TWSquad): Vector2 {
    // ★ 실제 진영 정보 기반 계산
    const enemyDir = this.getEnemyDirection(squad.teamId);
    const myBaseDir = this.getMyBaseDirection(squad.teamId);
    
    // 전선 방향에 수직인 방향 (좌/우 외곽)
    // 전선 방향이 enemyDir이면, 외곽 방향은 (-enemyDir.z, enemyDir.x) 또는 (enemyDir.z, -enemyDir.x)
    const leftFlankDir = { x: -enemyDir.z, z: enemyDir.x };
    const rightFlankDir = { x: enemyDir.z, z: -enemyDir.x };
    
    // 내 위치에서 어느 쪽 외곽이 가까운지 (전장 중심 기준)
    const center = this.state.teamPositions.battlefieldCenter;
    const toLeft = squad.position.x * leftFlankDir.x + squad.position.z * leftFlankDir.z;
    const toRight = squad.position.x * rightFlankDir.x + squad.position.z * rightFlankDir.z;
    
    // 이미 있는 쪽 외곽으로 더 돌아감
    const flankDir = toLeft > toRight ? leftFlankDir : rightFlankDir;
    
    // 외곽 경유점: 현재 위치에서 외곽 방향으로 + 적 방향으로 조금
    const outerDist = 40; // 외곽으로 얼마나 돌아갈지
    const forwardDist = 20; // 적 방향으로 얼마나 전진할지
    
    return {
      x: squad.position.x + flankDir.x * outerDist + enemyDir.x * forwardDist,
      z: squad.position.z + flankDir.z * outerDist + enemyDir.z * forwardDist,
    };
  }
  
  private calculateFlankPosition(squad: TWSquad, target: TWSquad): Vector2 {
    // ★ 실제 진영 정보 기반으로 외곽 측면 선택
    const enemyDir = this.getEnemyDirection(squad.teamId);
    
    // 적이 바라보는 방향의 측면
    const leftFlankAngle = target.facing + Math.PI / 2;
    const rightFlankAngle = target.facing - Math.PI / 2;
    const rearAngle = target.facing + Math.PI; // 후방
    
    const flankDist = 25;
    
    // 좌측면, 우측면, 후방 위치 계산
    const leftPos = {
      x: target.position.x + Math.sin(leftFlankAngle) * flankDist,
      z: target.position.z + Math.cos(leftFlankAngle) * flankDist,
    };
    const rightPos = {
      x: target.position.x + Math.sin(rightFlankAngle) * flankDist,
      z: target.position.z + Math.cos(rightFlankAngle) * flankDist,
    };
    const rearPos = {
      x: target.position.x + Math.sin(rearAngle) * flankDist,
      z: target.position.z + Math.cos(rearAngle) * flankDist,
    };
    
    // ★ 내 진영에서 먼 쪽의 측면 선택 (외곽으로 돌아가기)
    const myBase = squad.teamId === 'attacker' 
      ? this.state.teamPositions.attackerCenter 
      : this.state.teamPositions.defenderCenter;
    
    // 각 측면까지 내 진영에서의 거리
    const distLeftFromBase = this.getDistance(myBase, leftPos);
    const distRightFromBase = this.getDistance(myBase, rightPos);
    const distRearFromBase = this.getDistance(myBase, rearPos);
    
    // 내 진영에서 가장 먼 쪽 선택 (외곽)
    if (distRearFromBase > distLeftFromBase && distRearFromBase > distRightFromBase) {
      return rearPos; // 후방이 가장 멀면 후방
    }
    return distLeftFromBase > distRightFromBase ? leftPos : rightPos;
  }
  
  /** 저지 위치 계산 (아군과 적 사이) */
  private calculateScreenPosition(squad: TWSquad, threat: TWSquad, allies: TWSquad[]): Vector2 {
    // 보호할 아군 찾기 (궁병)
    const protectTarget = allies.find(a => ['archer', 'crossbow'].includes(a.category));
    
    if (protectTarget) {
      // 위협과 아군 사이에 위치
      return {
        x: (threat.position.x + protectTarget.position.x) / 2,
        z: (threat.position.z + protectTarget.position.z) / 2,
      };
    }
    
    // 보호할 대상 없으면 위협에게 직접
    return { ...threat.position };
  }
  
  // ========================================
  // 팀 진영 계산
  // ========================================
  
  /** 사령관 성격이 반영된 효과적인 AI 파라미터 가져오기 */
  getEffectiveAIParams(squad: TWSquad): typeof AI_STYLE_PARAMS[BattleAIStyle] {
    const baseParams = AI_STYLE_PARAMS[squad.aiStyle];
    const modifier = COMMANDER_STYLE_MODIFIER[squad.commanderPersonality];
    
    return {
      advanceRate: baseParams.advanceRate * modifier.advanceRateMultiplier,
      engageDistance: baseParams.engageDistance * modifier.engageDistanceMultiplier,
      retreatThreshold: baseParams.retreatThreshold * modifier.retreatThresholdMultiplier,
      holdLineDistance: baseParams.holdLineDistance,
      kitingDistance: baseParams.kitingDistance,
      waitForAllies: modifier.waitForAlliesOverride ?? baseParams.waitForAllies,
    };
  }
  
  /** 사령관 성격에 따른 AI 스타일 조정 */
  adjustAIStyleByCommander(squad: TWSquad): void {
    const modifier = COMMANDER_STYLE_MODIFIER[squad.commanderPersonality];
    const defaultStyle = CATEGORY_DEFAULT_AI_STYLE[squad.category];
    
    // 사령관 선호 스타일에 기본 스타일이 있으면 유지, 없으면 첫번째 선호 스타일로
    if (!modifier.preferredStyles.includes(defaultStyle)) {
      squad.aiStyle = modifier.preferredStyles[0];
    }
  }
  
  /** 전진선 설정 (전선 고수 스타일용) */
  setAdvanceLine(squad: TWSquad, line: number): void {
    squad.advanceLine = line;
  }
  
  /** 위치 고수 여부 체크 (전진선 초과 방지) */
  private shouldHoldPosition(squad: TWSquad, target: TWSquad, aiParams: ReturnType<typeof this.getEffectiveAIParams>): boolean {
    // hold_line 스타일이고 전진선에 도달했으면 멈춤
    if (squad.aiStyle === 'hold_line' && aiParams.holdLineDistance) {
      const enemyDir = this.getEnemyDirection(squad.teamId);
      const myAdvance = squad.position.x * enemyDir.x + squad.position.z * enemyDir.z;
      
      // 전진선 초과 체크
      if (myAdvance > aiParams.holdLineDistance) {
        return true;
      }
    }
    
    // ambush 스타일이면 적이 가까이 올 때까지 대기
    if (squad.aiStyle === 'ambush') {
      const distance = this.getDistance(squad.position, target.position);
      if (distance > aiParams.engageDistance) {
        return true;
      }
    }
    
    return false;
  }
  
  /** 아군이 준비되었는지 체크 */
  private areAlliesReady(squad: TWSquad, allies: TWSquad[]): boolean {
    const myPos = squad.position;
    const enemyDir = this.getEnemyDirection(squad.teamId);
    const myAdvance = myPos.x * enemyDir.x + myPos.z * enemyDir.z;
    
    // 같은 전선에 있는 아군 중 50% 이상이 비슷한 위치에 있어야 함
    let readyCount = 0;
    let totalCount = 0;
    
    for (const ally of allies) {
      if (ally.id === squad.id) continue;
      if (ally.state === 'destroyed' || ally.state === 'routed') continue;
      
      totalCount++;
      const allyAdvance = ally.position.x * enemyDir.x + ally.position.z * enemyDir.z;
      
      // 내 위치에서 20m 이내면 준비된 것으로 간주
      if (Math.abs(allyAdvance - myAdvance) < 20) {
        readyCount++;
      }
    }
    
    return totalCount === 0 || (readyCount / totalCount) >= 0.5;
  }
  
  /** 천천히 전진 (아군 기다리며) */
  private executeSlowAdvance(squad: TWSquad, target: TWSquad, advanceRate: number): void {
    const enemyDir = this.getEnemyDirection(squad.teamId);
    const advanceDistance = 5 * advanceRate; // 천천히
    
    const targetPos = {
      x: squad.position.x + enemyDir.x * advanceDistance,
      z: squad.position.z + enemyDir.z * advanceDistance,
    };
    
    this.moveInFormation(squad, targetPos);
    squad.state = 'moving';
  }
  
  /** 니가와 (치고 빠지기) 실행 */
  private executeKiting(squad: TWSquad, target: TWSquad, kitingDistance: number): void {
    const distance = this.getDistance(squad.position, target.position);
    
    if (distance < kitingDistance * 0.7) {
      // 너무 가까움 - 후퇴하며 사격
      const retreatAngle = Math.atan2(
        squad.position.z - target.position.z,
        squad.position.x - target.position.x
      );
      const retreatDist = kitingDistance - distance + 10;
      
      squad.targetPosition = {
        x: squad.position.x + Math.cos(retreatAngle) * retreatDist,
        z: squad.position.z + Math.sin(retreatAngle) * retreatDist,
      };
      squad.state = 'moving';
      
      // 후퇴하면서도 적을 바라봄
      squad.facing = Math.atan2(
        target.position.z - squad.position.z,
        target.position.x - squad.position.x
      );
    } else if (distance > kitingDistance * 1.3) {
      // 너무 멀음 - 접근
      const approachAngle = Math.atan2(
        target.position.z - squad.position.z,
        target.position.x - squad.position.x
      );
      
      squad.targetPosition = {
        x: target.position.x - Math.cos(approachAngle) * kitingDistance,
        z: target.position.z - Math.sin(approachAngle) * kitingDistance,
      };
      squad.state = 'moving';
    } else {
      // 적정 거리 - 제자리 사격
      squad.state = 'engaging';
      squad.facing = Math.atan2(
        target.position.z - squad.position.z,
        target.position.x - squad.position.x
      );
    }
  }
  
  /** 팀 진영 위치 계산 (실제 부대 배치 기반) */
  calculateTeamPositions(): void {
    const attackerSquads: TWSquad[] = [];
    const defenderSquads: TWSquad[] = [];
    
    this.state.squads.forEach(squad => {
      if (squad.state === 'destroyed' || squad.aliveSoldiers === 0) return;
      if (squad.teamId === 'attacker') {
        attackerSquads.push(squad);
      } else {
        defenderSquads.push(squad);
      }
    });
    
    // 공격팀 중심 계산
    if (attackerSquads.length > 0) {
      const sum = attackerSquads.reduce(
        (acc, s) => ({ x: acc.x + s.position.x, z: acc.z + s.position.z }),
        { x: 0, z: 0 }
      );
      this.state.teamPositions.attackerCenter = {
        x: sum.x / attackerSquads.length,
        z: sum.z / attackerSquads.length,
      };
    }
    
    // 방어팀 중심 계산
    if (defenderSquads.length > 0) {
      const sum = defenderSquads.reduce(
        (acc, s) => ({ x: acc.x + s.position.x, z: acc.z + s.position.z }),
        { x: 0, z: 0 }
      );
      this.state.teamPositions.defenderCenter = {
        x: sum.x / defenderSquads.length,
        z: sum.z / defenderSquads.length,
      };
    }
    
    // 전장 중심 계산
    this.state.teamPositions.battlefieldCenter = {
      x: (this.state.teamPositions.attackerCenter.x + this.state.teamPositions.defenderCenter.x) / 2,
      z: (this.state.teamPositions.attackerCenter.z + this.state.teamPositions.defenderCenter.z) / 2,
    };
    
    // 공격팀이 바라보는 방향 (방어팀 쪽)
    const dx = this.state.teamPositions.defenderCenter.x - this.state.teamPositions.attackerCenter.x;
    const dz = this.state.teamPositions.defenderCenter.z - this.state.teamPositions.attackerCenter.z;
    this.state.teamPositions.attackerFacing = Math.atan2(dz, dx);
    this.state.teamPositions.defenderFacing = this.state.teamPositions.attackerFacing + Math.PI;
  }
  
  /** 적 진영 방향 가져오기 */
  getEnemyDirection(teamId: 'attacker' | 'defender'): Vector2 {
    const myCenter = teamId === 'attacker' 
      ? this.state.teamPositions.attackerCenter 
      : this.state.teamPositions.defenderCenter;
    const enemyCenter = teamId === 'attacker' 
      ? this.state.teamPositions.defenderCenter 
      : this.state.teamPositions.attackerCenter;
    
    const dx = enemyCenter.x - myCenter.x;
    const dz = enemyCenter.z - myCenter.z;
    const dist = Math.sqrt(dx * dx + dz * dz);
    
    return dist > 0 ? { x: dx / dist, z: dz / dist } : { x: 1, z: 0 };
  }
  
  /** 내 진영 방향 가져오기 (후퇴 방향) */
  getMyBaseDirection(teamId: 'attacker' | 'defender'): Vector2 {
    const dir = this.getEnemyDirection(teamId);
    return { x: -dir.x, z: -dir.z };
  }
  
  // ========================================
  // 전장의 안개 (Fog of War) 시스템
  // ========================================
  
  /** FoW 활성화/비활성화 */
  setFogOfWarEnabled(enabled: boolean): void {
    this.state.fogOfWar.enabled = enabled;
  }
  
  /** 매 프레임 FoW 업데이트 */
  private updateFogOfWar(): void {
    const fow = this.state.fogOfWar;
    if (!fow.enabled) return;
    
    // 현재 시야 초기화 (매 프레임 재계산)
    fow.attackerVisibility.clear();
    fow.defenderVisibility.clear();
    
    // 각 부대의 시야 계산
    this.state.squads.forEach(squad => {
      if (squad.state === 'destroyed' || squad.aliveSoldiers === 0) return;
      
      const visionRange = UNIT_VISION_RANGE[squad.category];
      const visibility = squad.teamId === 'attacker' ? fow.attackerVisibility : fow.defenderVisibility;
      const explored = squad.teamId === 'attacker' ? fow.attackerExplored : fow.defenderExplored;
      
      // 부대 위치 주변 셀들을 시야에 추가
      this.addVisionCells(squad.position, visionRange, visibility, explored);
    });
  }
  
  /** 위치 주변 셀들을 시야에 추가 */
  private addVisionCells(
    position: Vector2, 
    range: number, 
    visibility: Set<string>, 
    explored: Set<string>
  ): void {
    const gridSize = this.state.fogOfWar.gridSize;
    const cellRange = Math.ceil(range / gridSize);
    
    const centerCellX = Math.floor(position.x / gridSize);
    const centerCellZ = Math.floor(position.z / gridSize);
    
    for (let dx = -cellRange; dx <= cellRange; dx++) {
      for (let dz = -cellRange; dz <= cellRange; dz++) {
        const cellX = centerCellX + dx;
        const cellZ = centerCellZ + dz;
        
        // 원형 시야
        const dist = Math.sqrt(dx * dx + dz * dz) * gridSize;
        if (dist <= range) {
          const cellKey = `${cellX},${cellZ}`;
          visibility.add(cellKey);
          explored.add(cellKey);
        }
      }
    }
  }
  
  /** 특정 위치의 시야 상태 확인 */
  getVisibilityAt(position: Vector2, teamId: 'attacker' | 'defender'): VisibilityState {
    const fow = this.state.fogOfWar;
    if (!fow.enabled) return 'visible';
    
    const gridSize = fow.gridSize;
    const cellX = Math.floor(position.x / gridSize);
    const cellZ = Math.floor(position.z / gridSize);
    const cellKey = `${cellX},${cellZ}`;
    
    const visibility = teamId === 'attacker' ? fow.attackerVisibility : fow.defenderVisibility;
    const explored = teamId === 'attacker' ? fow.attackerExplored : fow.defenderExplored;
    
    if (visibility.has(cellKey)) return 'visible';
    if (explored.has(cellKey)) return 'fogged';
    return 'hidden';
  }
  
  /** 적 부대가 보이는지 확인 */
  isEnemyVisible(enemySquad: TWSquad, viewerTeamId: 'attacker' | 'defender'): boolean {
    if (!this.state.fogOfWar.enabled) return true;
    return this.getVisibilityAt(enemySquad.position, viewerTeamId) === 'visible';
  }
  
  /** 적 병사가 보이는지 확인 */
  isEnemySoldierVisible(enemySoldier: TWSoldier, viewerTeamId: 'attacker' | 'defender'): boolean {
    if (!this.state.fogOfWar.enabled) return true;
    return this.getVisibilityAt(enemySoldier.position, viewerTeamId) === 'visible';
  }
  
  /** 팀에게 보이는 적 부대만 반환 */
  getVisibleEnemySquads(teamId: 'attacker' | 'defender'): TWSquad[] {
    const enemyTeam = teamId === 'attacker' ? 'defender' : 'attacker';
    const visibleEnemies: TWSquad[] = [];
    
    this.state.squads.forEach(squad => {
      if (squad.teamId === enemyTeam && 
          squad.state !== 'destroyed' && 
          squad.aliveSoldiers > 0 &&
          this.isEnemyVisible(squad, teamId)) {
        visibleEnemies.push(squad);
      }
    });
    
    return visibleEnemies;
  }
  
  /** 탐색되지 않은 영역이 있는지 확인 */
  hasUnexploredArea(teamId: 'attacker' | 'defender'): boolean {
    const explored = teamId === 'attacker' 
      ? this.state.fogOfWar.attackerExplored 
      : this.state.fogOfWar.defenderExplored;
    
    // 전장의 대략적인 크기 기준으로 탐색률 계산
    const totalCells = Math.pow(this.WORLD_SIZE / this.state.fogOfWar.gridSize, 2);
    return explored.size < totalCells * 0.3; // 30% 미만 탐색
  }
  
  /** FoW 상태 가져오기 (렌더링용) */
  getFogOfWarState(): FogOfWarState {
    return this.state.fogOfWar;
  }
  
  // ========================================
  // 진형 결속 시스템
  // ========================================
  
  /** 부대 진형 결속도 업데이트 */
  private updateFormationCohesion(squad: TWSquad): void {
    if (squad.state === 'destroyed' || squad.state === 'routed') return;
    
    const aliveSoldiers = squad.soldiers.filter(s => s.state !== 'dead');
    if (aliveSoldiers.length === 0) return;
    
    // 결속도 계산: 병사들이 진형 위치에 얼마나 가까운지
    let totalDeviation = 0;
    const targetPos = squad.targetPosition || squad.position;
    
    for (const soldier of aliveSoldiers) {
      const expectedPos = this.localToWorld(
        this.calculateFormationOffset(squad, soldier.formationSlot.row, soldier.formationSlot.col),
        targetPos,
        squad.facing
      );
      const deviation = this.getDistance(soldier.position, expectedPos);
      totalDeviation += deviation;
    }
    
    // 평균 이탈 거리
    const avgDeviation = totalDeviation / aliveSoldiers.length;
    
    // 결속도 계산 (이탈 거리가 클수록 낮음)
    // 0 이탈 = 100%, 5m 이탈 = 50%, 10m 이상 = 0%
    const cohesion = Math.max(0, Math.min(100, 100 - avgDeviation * 10));
    
    // 부드러운 전환 (급격한 변화 방지)
    squad.formationCohesion = squad.formationCohesion * 0.9 + cohesion * 0.1;
    
    // 결속도에 따른 진형 상태 결정
    if (squad.formationCohesion >= 80) {
      squad.formationState = 'formed';
    } else if (squad.formationCohesion >= 60) {
      squad.formationState = 'loose';
    } else if (squad.formationCohesion >= 40) {
      squad.formationState = 'disordered';
    } else {
      squad.formationState = 'broken';
    }
    
    // 근접 난전 중이면 자동으로 무질서 및 진형 잠금 해제
    const fightingSoldiers = aliveSoldiers.filter(s => s.state === 'fighting').length;
    const fightingRatio = fightingSoldiers / aliveSoldiers.length;
    if (fightingRatio > 0.5) {
      // 50% 이상 근접전 중이면 진형 자동 해제
      squad.formationState = fightingRatio > 0.8 ? 'broken' : 'disordered';
      squad.isFormationLocked = false; // ★ 난전 시 진형 잠금 해제
    } else if (fightingRatio < 0.2 && squad.state !== 'engaging') {
      // 전투 종료 후 진형 잠금 복원
      squad.isFormationLocked = true;
    }
    
    // 재정렬 중이면 forming 상태
    if (squad.state === 'reforming') {
      squad.formationState = 'forming';
    }
  }
  
  /** 진형 유지하며 이동 (병사들이 진형 위치를 따라감) */
  private moveInFormation(squad: TWSquad, targetPos: Vector2): void {
    if (!squad.isFormationLocked) {
      // 진형 잠금 해제 시 자유 이동
      squad.targetPosition = targetPos;
      return;
    }
    
    squad.targetPosition = targetPos;
    
    // 진형이 정돈된 상태에서만 이동
    if (squad.formationState === 'formed' || squad.formationState === 'forming') {
      // 병사들에게 진형 위치로 이동 명령
      for (const soldier of squad.soldiers) {
        if (soldier.state === 'dead' || soldier.state === 'fighting') continue;
        
        const formationPos = this.localToWorld(
          this.calculateFormationOffset(squad, soldier.formationSlot.row, soldier.formationSlot.col),
          targetPos,
          squad.facing
        );
        soldier.targetPosition = formationPos;
      }
    }
  }
  
  /** 진형 상태에 따른 전투 수정치 가져오기 */
  getFormationModifiers(squad: TWSquad): typeof FORMATION_STATE_MODIFIERS[FormationState] {
    return FORMATION_STATE_MODIFIERS[squad.formationState];
  }
  
  /** 진형 재정렬 명령 */
  orderReform(squad: TWSquad): void {
    if (squad.state === 'routing' || squad.state === 'destroyed') return;
    
    squad.state = 'reforming';
    squad.formationState = 'forming';
    
    // 병사들에게 진형 위치로 이동 명령
    const targetPos = squad.targetPosition || squad.position;
    for (const soldier of squad.soldiers) {
      if (soldier.state === 'dead') continue;
      
      const formationPos = this.localToWorld(
        this.calculateFormationOffset(squad, soldier.formationSlot.row, soldier.formationSlot.col),
        targetPos,
        squad.facing
      );
      soldier.targetPosition = formationPos;
      soldier.engagedWith = undefined; // 교전 해제
      if (soldier.state !== 'routing') {
        soldier.state = 'moving';
      }
    }
  }
  
  // ========================================
  // 부대 AI
  // ========================================
  
  private updateSquadAI(): void {
    // ★ 전술 AI 먼저 실행
    this.updateTacticalAI();
    
    // ★ 진형 결속도 업데이트
    this.state.squads.forEach(squad => {
      this.updateFormationCohesion(squad);
    });
    this.state.squads.forEach(squad => {
      if (squad.state === 'destroyed' || squad.state === 'routed') return;
      
      // 생존 병사 수 업데이트
      const aliveSoldiers = squad.soldiers.filter(s => s.state !== 'dead');
      squad.aliveSoldiers = aliveSoldiers.length;
      
      // 전멸 체크
      if (squad.aliveSoldiers === 0) {
        squad.state = 'destroyed';
        this.state.events.push({
          time: this.state.currentTime,
          type: 'rout',
          data: { squadId: squad.id, reason: 'destroyed' },
        });
        return;
      }
      
      // 패주 중인 부대 처리
      if (squad.state === 'routing') {
        // 적과의 거리 확인
        const enemies = Array.from(this.state.squads.values()).filter(enemy =>
          enemy.teamId !== squad.teamId &&
          enemy.state !== 'destroyed' && 
          enemy.state !== 'routed' &&
          enemy.aliveSoldiers > 0
        );
        
        let closestEnemyDistance = Infinity;
        for (const enemy of enemies) {
          const dist = this.getDistance(squad.position, enemy.position);
          if (dist < closestEnemyDistance) {
            closestEnemyDistance = dist;
          }
        }
        
        // 적이 없거나 멀리 있으면 사기 회복 (안전 거리: 50)
        if (enemies.length === 0 || closestEnemyDistance > RALLY_CONFIG.safeDistance) {
          // 병사들 사기 빠른 회복
          squad.soldiers.forEach(soldier => {
            if (soldier.state !== 'dead') {
              soldier.morale = Math.min(100, soldier.morale + 2); // 빠른 회복
            }
          });
          
          // 부대 평균 사기 계산
          const aliveSoldiers = squad.soldiers.filter(s => s.state !== 'dead');
          if (aliveSoldiers.length > 0) {
            const avgMorale = aliveSoldiers.reduce((acc, s) => acc + s.morale, 0) / aliveSoldiers.length;
            
            // 사기가 충분히 회복되면 재집결 (hasRouted가 아닐 때만)
            if (avgMorale > MORALE_THRESHOLDS.rallyMorale && !squad.hasRouted) {
          squad.state = 'rallying';
              squad.rallyStartTime = this.state.currentTime;
              
              // 병사들 패주 상태 해제
              aliveSoldiers.forEach(soldier => {
                if (soldier.state === 'routing') {
                  soldier.state = 'moving';
                }
              });
              
              // 재집결 진행
              this.reformFormation(squad);
            }
          }
        }
        return;
      }
      
      // 재집결 중인 부대 처리
      if (squad.state === 'rallying') {
        // 재집결 완료 체크
        const elapsed = this.state.currentTime - (squad.rallyStartTime || 0);
        if (elapsed > RALLY_CONFIG.rallyTime / 1000) {
          squad.state = 'idle';
          squad.rallyStartTime = undefined;
        }
        return;
      }
      
      // 명령에 따른 행동
      switch (squad.command.type) {
        case 'move':
          this.executeMove(squad, squad.command.target);
          break;
        case 'attack':
          this.executeAttackCommand(squad, squad.command.targetId);
          break;
        case 'retreat':
          this.executeRetreat(squad);
          break;
        case 'hold':
        default:
          // 자동 전투: 가장 가까운 적 찾아서 공격
          this.autoEngageEnemy(squad);
          break;
      }
      
      // 부대 평균 위치 계산
      this.updateSquadPosition(squad);
    });
  }
  
  /** 자동으로 가장 가까운 적 부대를 찾아 공격 */
  private autoEngageEnemy(squad: TWSquad): void {
    // 전술 AI 사용 시 (주기적으로만)
    if (this.useTacticsAI && this.frameCounter % this.tacticsUpdateInterval === 0) {
      const tactic = this.tacticsAI.decideTactic(squad.id);
      if (tactic.priority > 0) {
        this.executeTacticAction(squad, tactic);
        return;
      }
    }
    
    // 기존 로직 (폴백 또는 전술 AI 미사용 시)
    this.autoEngageEnemyLegacy(squad);
  }
  
  /**
   * 전술 AI 결정 실행
   */
  private executeTacticAction(squad: TWSquad, tactic: TacticAction): void {
    // 진형 변경이 필요하면 먼저 변경
    if (tactic.formation) {
      this.setFormation(squad.id, tactic.formation);
    }
    
    switch (tactic.type) {
      case 'hold':
        // 위치 고수 - 재집결
        this.reformFormation(squad);
        squad.state = 'idle';
        break;
        
      case 'advance':
        // 전진
        if (tactic.targetPosition) {
          this.executeMove(squad, tactic.targetPosition);
        } else if (tactic.targetSquadId) {
          const target = this.state.squads.get(tactic.targetSquadId);
          if (target) {
            this.executeMove(squad, target.position);
          }
        }
        break;
        
      case 'charge':
        // 돌격
        if (tactic.targetSquadId) {
          const target = this.state.squads.get(tactic.targetSquadId);
          if (target) {
            this.executeCharge(squad, target);
          }
        }
        break;
        
      case 'flank_left':
      case 'flank_right':
      case 'rear_attack':
        // 측면/후방 공격
        if (tactic.targetPosition) {
          this.executeMove(squad, tactic.targetPosition);
          squad.state = 'moving';
        }
        if (tactic.targetSquadId) {
          const target = this.state.squads.get(tactic.targetSquadId);
          if (target) {
            squad.targetPosition = tactic.targetPosition;
            // 도착 후 돌격
            const distance = this.getDistance(squad.position, tactic.targetPosition || squad.position);
            if (distance < 5) {
              this.executeCharge(squad, target);
            }
          }
        }
        break;
        
      case 'retreat':
        // 후퇴
        if (tactic.targetPosition) {
          this.executeRetreat(squad);
          squad.state = 'moving';
        }
        break;
        
      case 'regroup':
        // 재집결
        this.reformFormation(squad);
        break;
        
      case 'support':
        // 아군 지원 - 지원 대상 근처로 이동
        if (tactic.targetPosition) {
          this.executeMove(squad, tactic.targetPosition);
        }
        break;
        
      case 'intercept':
        // 요격
        if (tactic.targetSquadId) {
          const target = this.state.squads.get(tactic.targetSquadId);
          if (target?.targetPosition) {
            // 적의 예상 경로 차단
            this.executeMove(squad, target.targetPosition);
          }
        }
        break;
        
      case 'kite':
        // 카이팅 (원거리 유닛)
        if (tactic.targetPosition) {
          this.executeMove(squad, tactic.targetPosition);
        }
        if (tactic.targetSquadId) {
          squad.facing = this.calculateFacingTo(squad.position, 
            this.state.squads.get(tactic.targetSquadId)?.position);
        }
        squad.state = 'engaging';
        break;
        
      case 'maintain_range':
        // 최적 사거리 유지
        if (tactic.targetSquadId) {
          const target = this.state.squads.get(tactic.targetSquadId);
          if (target) {
            squad.facing = this.calculateFacingTo(squad.position, target.position);
            squad.state = 'engaging';
          }
        }
        break;
        
      case 'encircle':
        // 포위
        if (tactic.targetPosition) {
          this.executeMove(squad, tactic.targetPosition);
        }
        break;
        
      case 'feint':
        // 양동 - 접근했다가 후퇴
        if (tactic.targetSquadId) {
          const target = this.state.squads.get(tactic.targetSquadId);
          if (target) {
            const distance = this.getDistance(squad.position, target.position);
            if (distance > 10) {
              // 접근
              this.executeMove(squad, target.position);
            } else {
              // 후퇴
              this.executeRetreat(squad);
            }
          }
        }
        break;
        
      default:
        // 기본: 재집결
        this.reformFormation(squad);
        break;
    }
  }
  
  /**
   * 두 위치 사이의 방향 계산
   */
  private calculateFacingTo(from: Vector2, to?: Vector2): number {
    if (!to) return 0;
    return Math.atan2(to.z - from.z, to.x - from.x);
  }
  
  /** 자동 교전 레거시 로직 (전술 AI 미사용 시) */
  private autoEngageEnemyLegacy(squad: TWSquad): void {
    // 가장 가까운 살아있는 적 부대 찾기
    const enemies = Array.from(this.state.squads.values()).filter(enemy =>
      enemy.teamId !== squad.teamId &&
      enemy.state !== 'destroyed' && 
      enemy.state !== 'routed' &&
      enemy.aliveSoldiers > 0
    );
    
    let closestEnemy: TWSquad | undefined;
    let closestDistance = Infinity;
    
    for (const enemy of enemies) {
      const dist = this.getDistance(squad.position, enemy.position);
      if (dist < closestDistance) {
        closestDistance = dist;
        closestEnemy = enemy;
      }
    }
    
    if (!closestEnemy) {
      // 적이 없으면 진형 재집결 (전투 종료 후)
      this.reformFormation(squad);
      squad.state = 'idle';
      return;
    }
    
    // 교전 중인 병사 비율 확인
    const engagedCount = squad.soldiers.filter(s => 
      s.state === 'fighting' || s.engagedWith
    ).length;
    const aliveSoldiers = squad.soldiers.filter(s => s.state !== 'dead').length;
    const engagementRatio = engagedCount / Math.max(1, aliveSoldiers);
    
    // 전투가 완전히 끝났을 때만 재집결 (80% 이상 교전 완료 + 적이 아주 멀리)
    if (engagementRatio < 0.05 && closestDistance > 50) {
      this.reformFormation(squad);
      squad.state = 'idle';
      return;
    }
    
    const isRangedSquad = ['archer', 'crossbow', 'horse_archer'].includes(squad.category);
    
    if (isRangedSquad) {
      // 원거리 유닛
      const weaponConfig = WEAPON_COMBAT_CONFIG[this.getWeaponTypeForCategory(squad.category)];
      const optimalRange = weaponConfig.range * 0.7;
      
      if (closestDistance < weaponConfig.minRange) {
        // 너무 가까우면 후퇴
        const retreatDir = Math.atan2(
          squad.position.z - closestEnemy.position.z,
          squad.position.x - closestEnemy.position.x
        );
        const retreatTarget = {
          x: squad.position.x + Math.cos(retreatDir) * 20,
          z: squad.position.z + Math.sin(retreatDir) * 20,
        };
        this.executeMove(squad, retreatTarget);
      } else if (closestDistance > weaponConfig.range) {
        // 사거리 밖이면 접근
        const approachDir = Math.atan2(
          closestEnemy.position.z - squad.position.z,
          closestEnemy.position.x - squad.position.x
        );
        const approachTarget = {
          x: closestEnemy.position.x - Math.cos(approachDir) * optimalRange,
          z: closestEnemy.position.z - Math.sin(approachDir) * optimalRange,
        };
        this.executeMove(squad, approachTarget);
      } else {
        // 사거리 내: 사격 위치 유지
        squad.state = 'engaging';
        squad.facing = Math.atan2(
          closestEnemy.position.z - squad.position.z,
          closestEnemy.position.x - squad.position.x
        );
      }
    } else {
      // 근접 유닛 - 항상 적극적으로 접근
      if (closestDistance > 15) {
        // 멀면 돌격!
        this.executeCharge(squad, closestEnemy);
      } else if (closestDistance > 5) {
        // 중거리: 적 부대 중심으로 이동
        this.executeMove(squad, closestEnemy.position);
        squad.state = 'engaging';
      } else {
        // 근거리: 교전 중, 계속 밀착
        squad.state = 'engaging';
        squad.facing = Math.atan2(
          closestEnemy.position.z - squad.position.z,
          closestEnemy.position.x - squad.position.x
        );
        // 계속 적 위치로 이동 (병사들이 적에게 붙도록)
        squad.targetPosition = { ...closestEnemy.position };
      }
    }
  }
  
  private executeMove(squad: TWSquad, target: Vector2): void {
    // ★ 진형이 붕괴되었으면 먼저 재정렬 (난전 제외)
    const fightingSoldiers = squad.soldiers.filter(s => s.state === 'fighting').length;
    const inMelee = fightingSoldiers > squad.aliveSoldiers * 0.3;
    
    if (squad.formationState === 'broken' && !inMelee && squad.isFormationLocked) {
      // 진형 재정렬 후 이동
      this.orderReform(squad);
      squad.targetPosition = { ...target }; // 목표는 저장
      return;
    }
    
    squad.targetPosition = { ...target };
    squad.state = 'moving';
    
    // 부대 방향을 목표를 향해 설정
    const dx = target.x - squad.position.x;
    const dz = target.z - squad.position.z;
    if (Math.abs(dx) > 0.1 || Math.abs(dz) > 0.1) {
      squad.facing = Math.atan2(dz, dx);
    }
    
    // ★ 진형 유지 모드면 진형 위치로, 아니면 직접 이동
    if (squad.isFormationLocked && !inMelee) {
      // 진형 유지: 각 병사가 진형 위치로 이동
    squad.soldiers.forEach(soldier => {
        if (soldier.state === 'dead' || soldier.state === 'fighting') return;
      const offset = this.calculateFormationOffset(squad, soldier.formationSlot.row, soldier.formationSlot.col);
      soldier.targetPosition = this.localToWorld(offset, target, squad.facing);
        soldier.state = 'moving';
      });
    } else {
      // 자유 이동 (난전 중 또는 진형 해제)
      squad.soldiers.forEach(soldier => {
        if (soldier.state === 'dead') return;
        // 난전 중이 아닌 병사만 이동
      if (soldier.state !== 'fighting') {
          const offset = this.calculateFormationOffset(squad, soldier.formationSlot.row, soldier.formationSlot.col);
          soldier.targetPosition = this.localToWorld(offset, target, squad.facing);
        soldier.state = 'moving';
      }
    });
    }
  }
  
  /** 진형 재집결: 흩어진 병사들이 다시 진형으로 모임 */
  private reformFormation(squad: TWSquad): void {
    // 살아있는 병사만 필터
    const aliveSoldiers = squad.soldiers.filter(s => s.state !== 'dead');
    if (aliveSoldiers.length === 0) return;
    
    // 부대 상태를 재집결로 변경
    squad.state = 'reforming';
    
    // 부대 중심 위치 계산 (살아있는 병사들의 평균 위치)
    let sumX = 0, sumZ = 0;
    aliveSoldiers.forEach(soldier => {
      sumX += soldier.position.x;
      sumZ += soldier.position.z;
    });
    
    const centerX = sumX / aliveSoldiers.length;
    const centerZ = sumZ / aliveSoldiers.length;
    
    // 부대 위치를 현재 병사들의 중심으로 업데이트
    squad.position = { x: centerX, z: centerZ };
    
    // 진형 슬롯 재배치 (죽은 병사의 슬롯 메우기)
    this.reassignFormationSlots(squad);
    
    // 각 병사에게 진형 위치로 이동 명령
    aliveSoldiers.forEach(soldier => {
      // 교전 중이면 교전 해제 (재집결 우선)
      if (soldier.engagedWith) {
        const enemy = this.state.soldiers.get(soldier.engagedWith);
        if (enemy) {
          enemy.engagedWith = undefined;
        }
        soldier.engagedWith = undefined;
      }
      
      // 진형 내 위치 계산
      const offset = this.calculateFormationOffset(squad, soldier.formationSlot.row, soldier.formationSlot.col);
      soldier.targetPosition = this.localToWorld(offset, squad.position, squad.facing);
      
      // 상태 변경 (전투/도주 상태가 아니면)
      if (soldier.state !== 'fighting' && soldier.state !== 'routing' && soldier.state !== 'dead') {
        soldier.state = 'moving';
      }
      
      // 사기 회복 (재집결 중)
      soldier.morale = Math.min(100, soldier.morale + COMBAT_TEMPO.moraleRecoveryRate * 3);
      
      // 피로도 회복 (재집결 중)
      soldier.fatigue = Math.max(0, soldier.fatigue - COMBAT_TEMPO.fatigueRate * 0.5);
    });
    
    // 일정 비율의 병사가 진형 위치에 도달하면 idle로 전환
    const inFormationCount = aliveSoldiers.filter(s => {
      const offset = this.calculateFormationOffset(squad, s.formationSlot.row, s.formationSlot.col);
      const targetPos = this.localToWorld(offset, squad.position, squad.facing);
      return this.getDistance(s.position, targetPos) < 1.5;
    }).length;
    
    if (inFormationCount >= aliveSoldiers.length * 0.7) {
      // 70% 이상이 진형에 도달하면 대기 상태로
      squad.state = 'idle';
      aliveSoldiers.forEach(soldier => {
        if (soldier.state === 'moving') {
          soldier.state = 'idle';
        }
      });
    }
  }
  
  /** 죽은 병사의 슬롯을 살아있는 병사로 채움 */
  private reassignFormationSlots(squad: TWSquad): void {
    const aliveSoldiers = squad.soldiers.filter(s => s.state !== 'dead');
    const formationConfig = FORMATION_CONFIG[squad.formation];
    
    // 새 진형 크기 계산
    const totalSoldiers = aliveSoldiers.length;
    const ratio = formationConfig.widthToDepthRatio;
    squad.width = Math.max(1, Math.ceil(Math.sqrt(totalSoldiers * ratio)));
    squad.depth = Math.max(1, Math.ceil(totalSoldiers / squad.width));
    
    // 살아있는 병사들에게 새 슬롯 할당
    let index = 0;
    aliveSoldiers.forEach(soldier => {
      const row = Math.floor(index / squad.width);
      const col = index % squad.width;
      soldier.formationSlot = { row, col };
      soldier.formationOffset = this.calculateFormationOffset(squad, row, col);
      index++;
    });
  }
  
  private executeAttackCommand(squad: TWSquad, targetId: string): void {
    const target = this.state.squads.get(targetId);
    if (!target || target.state === 'destroyed') {
      squad.command = { type: 'hold' };
      return;
    }
    
    const distance = this.getDistance(squad.position, target.position);
    const isRangedSquad = squad.category === 'archer' || squad.category === 'siege';
    
    if (isRangedSquad) {
      // 원거리 유닛: 최적 사거리 유지
      const weaponConfig = WEAPON_COMBAT_CONFIG[this.getWeaponTypeForCategory(squad.category)];
      const optimalRange = weaponConfig.range * 0.8;
      
      if (distance < weaponConfig.minRange) {
        // 너무 가까우면 후퇴
        this.executeRetreat(squad);
      } else if (distance > weaponConfig.range) {
        // 사거리 밖이면 접근
        this.executeMove(squad, target.position);
      } else {
        // 사거리 내: 사격
        squad.state = 'engaging';
        squad.targetPosition = undefined;
      }
    } else {
      // 근접 유닛: 돌격
      if (distance > 5) {
        // 돌격!
        this.executeCharge(squad, target);
      } else {
        // 교전 중
        squad.state = 'engaging';
      }
    }
  }
  
  private executeCharge(squad: TWSquad, target: TWSquad): void {
    squad.state = 'engaging';
    squad.targetPosition = { ...target.position };
    
    // ★ 돌격 시 이동 모드 변경
    squad.movementMode = 'charge';
    
    // 부대 방향을 목표를 향해 설정
    const dx = target.position.x - squad.position.x;
    const dz = target.position.z - squad.position.z;
    if (Math.abs(dx) > 0.1 || Math.abs(dz) > 0.1) {
      squad.facing = Math.atan2(dz, dx);
    }
    
    // 돌격 시작 - 각 병사에게 돌격 보너스 적용 및 목표 위치 설정
    squad.soldiers.forEach(soldier => {
      if (soldier.state === 'dead') return;
      soldier.isCharging = true;
      soldier.chargeStartTime = this.state.currentTime;
      soldier.state = 'charging';
      
      // 병사별 목표 위치 설정 (진형 유지하면서 적 부대 위치로)
      const offset = this.calculateFormationOffset(squad, soldier.formationSlot.row, soldier.formationSlot.col);
      soldier.targetPosition = this.localToWorld(offset, target.position, squad.facing);
    });
  }
  
  private executeRetreat(squad: TWSquad): void {
    // 후퇴 방향 계산 (가장 가까운 적 반대 방향)
    const closestEnemy = this.findClosestEnemySquad(squad);
    if (!closestEnemy) return;
    
    const angle = Math.atan2(
      squad.position.x - closestEnemy.position.x,
      squad.position.z - closestEnemy.position.z
    );
    
    const retreatDistance = 20;
    const retreatTarget: Vector2 = {
      x: squad.position.x + Math.sin(angle) * retreatDistance,
      z: squad.position.z + Math.cos(angle) * retreatDistance,
    };
    
    this.executeMove(squad, retreatTarget);
    squad.state = 'moving';
  }
  
  private updateSquadPosition(squad: TWSquad): void {
    const aliveSoldiers = squad.soldiers.filter(s => s.state !== 'dead');
    if (aliveSoldiers.length === 0) return;
    
    // 평균 위치
    const sumPos = aliveSoldiers.reduce(
      (acc, s) => ({ x: acc.x + s.position.x, z: acc.z + s.position.z }),
      { x: 0, z: 0 }
    );
    squad.position = {
      x: sumPos.x / aliveSoldiers.length,
      z: sumPos.z / aliveSoldiers.length,
    };
    
    // 평균 사기
    squad.morale = aliveSoldiers.reduce((acc, s) => acc + s.morale, 0) / aliveSoldiers.length;
    
    // 평균 피로도
    squad.fatigue = aliveSoldiers.reduce((acc, s) => acc + s.fatigue, 0) / aliveSoldiers.length;
  }
  
  // ========================================
  // 전선 시스템
  // ========================================
  
  private updateBattleLines(): void {
    this.state.battleLines = [];
    
    // 교전 중인 부대 쌍 찾기
    const attackerSquads = Array.from(this.state.squads.values()).filter(s => s.teamId === 'attacker' && s.state !== 'destroyed');
    const defenderSquads = Array.from(this.state.squads.values()).filter(s => s.teamId === 'defender' && s.state !== 'destroyed');
    
    attackerSquads.forEach(attacker => {
      defenderSquads.forEach(defender => {
        const distance = this.getDistance(attacker.position, defender.position);
        
        // 교전 거리 (부대 크기 고려)
        const engagementRange = Math.max(attacker.width, defender.width) * attacker.spacing + 3;
        
        if (distance < engagementRange) {
          this.createBattleLine(attacker, defender);
        }
      });
    });
  }
  
  private createBattleLine(attacker: TWSquad, defender: TWSquad): void {
    // 전선 방향: 두 부대를 잇는 직선에 수직
    const dx = defender.position.x - attacker.position.x;
    const dz = defender.position.z - attacker.position.z;
    const lineDirection = Math.atan2(dx, dz) + Math.PI / 2;
    
    // 전선 위치: 중간 지점
    const linePosition: Vector2 = {
      x: (attacker.position.x + defender.position.x) / 2,
      z: (attacker.position.z + defender.position.z) / 2,
    };
    
    // 전선 너비
    const lineWidth = Math.max(attacker.width, defender.width) * attacker.spacing;
    
    const battleLine: BattleLine = {
      id: `line-${attacker.id}-${defender.id}`,
      attackerSquadId: attacker.id,
      defenderSquadId: defender.id,
      position: linePosition,
      direction: lineDirection,
      width: lineWidth,
      engagedPairs: [],
    };
    
    this.state.battleLines.push(battleLine);
  }
  
  // ========================================
  // 병사 AI
  // ========================================
  
  private updateSoldierAI(): void {
    this.state.soldiers.forEach(soldier => {
      if (soldier.state === 'dead') return;
      
      const squad = this.state.squads.get(soldier.squadId)!;
      if (!squad) return;
      
      // 탈주 중인 부대면 도망
      if (squad.state === 'routing' || soldier.state === 'routing') {
        this.handleRouting(soldier, squad);
        return;
      }
      
      // ★ 추격 중인 병사
      if (soldier.state === 'pursuing') {
        this.handlePursuit(soldier, squad);
        return;
      }
      
      // 동요 상태
      if (soldier.morale < MORALE_THRESHOLDS.wavering && soldier.state !== 'wavering') {
        soldier.state = 'wavering';
      }
      
      // 원거리 유닛
      if (soldier.isRanged) {
        this.handleRangedSoldierAI(soldier, squad);
      } else {
        this.handleMeleeSoldierAI(soldier, squad);
      }
      
      // 이동 처리
      this.moveSoldier(soldier);
    });
  }
  
  private handleMeleeSoldierAI(soldier: TWSoldier, squad: TWSquad): void {
    // ★ 개성 기반 AI
    const { personality, combatStyle, aggressionLevel, disciplineLevel, survivalInstinct } = soldier;
    
    // 반응 시간 체크 (낮은 반응 시간 = 빠른 반응)
    const timeSinceLastAction = this.state.currentTime - soldier.lastAttackTime;
    if (timeSinceLastAction < soldier.reactionTime && soldier.state !== 'fighting') {
      return; // 아직 반응 시간 안됨
    }
    
    // ★ 측면/후방 보호 (최우선!) - 적이 측면/후방에서 접근하면 대응
    if (this.protectFlankAndRear(soldier, squad)) {
      return; // 측면/후방 대응 중이므로 다른 행동 스킵
    }
    
    // ★ 겁쟁이: HP/사기 낮으면 후퇴 시도
    if (personality === 'coward' && (soldier.hp < soldier.maxHp * 0.5 || soldier.morale < 50)) {
      this.handleCowardBehavior(soldier, squad);
      return;
    }
    
    // ★ 광전사: 적이 보이면 무조건 돌진
    if (personality === 'berserker' && soldier.morale > 20) {
      this.handleBerserkerBehavior(soldier, squad);
      return;
    }
    
    // ★ 고대 전선 전투: 보병은 개별 추격 없이 전선 유지
    const isInfantry = ['ji_infantry', 'sword_infantry', 'halberd_infantry', 'spear_guard'].includes(squad.category);
    
    // 이미 교전 중이면 계속 싸움
    if (soldier.engagedWith) {
      const enemy = this.state.soldiers.get(soldier.engagedWith);
      if (!enemy || enemy.state === 'dead') {
        soldier.engagedWith = undefined;
        soldier.state = 'idle';
      } else {
        soldier.state = 'fighting';
        // 적을 바라봄
        soldier.facing = Math.atan2(
          enemy.position.x - soldier.position.x,
          enemy.position.z - soldier.position.z
        );
        
        const distance = this.getDistance(soldier.position, enemy.position);
        
        // ★ 보병 전선 전투: 제자리에서 싸움, 적을 쫓아가지 않음!
        if (isInfantry) {
          if (distance > soldier.attackRange * 1.5) {
            // 적이 너무 멀어지면 → 진형 위치로 복귀 (추격 X)
            const targetPos = squad.targetPosition || squad.position;
            const offset = this.calculateFormationOffset(squad, soldier.formationSlot.row, soldier.formationSlot.col);
            soldier.targetPosition = this.localToWorld(offset, targetPos, squad.facing);
            soldier.engagedWith = undefined; // 교전 해제
          } else if (distance > soldier.attackRange) {
            // 약간 멀면 → 앞으로만 조금 전진 (전선 밀기)
            const pushDir = squad.facing;
          soldier.targetPosition = {
              x: soldier.position.x + Math.sin(pushDir) * 0.3,
              z: soldier.position.z + Math.cos(pushDir) * 0.3,
            };
          }
          // 공격 범위 내면 제자리 (targetPosition 없음)
        } else {
          // 기병 등은 기존 로직 (추격 가능)
          if (distance > soldier.attackRange * 1.2) {
            soldier.targetPosition = { ...enemy.position };
          }
        }
        return;
      }
    }
    
    // ★ 시야/인식 기반 적 탐지
    const visibleEnemies = this.findVisibleEnemies(soldier);
    soldier.knownEnemies = new Set(visibleEnemies.map(e => e.id));
    
    // 부대원이 발견한 적도 인식 (규율 높을수록 공유 잘 됨)
    if (disciplineLevel > 0.5) {
      this.shareSquadAwareness(soldier, squad);
    }
    
    // ★ 보병은 가장 가까운 전방 적만 타겟 (측면 적 추격 X)
    let targetEnemy: TWSoldier | undefined;
    if (isInfantry) {
      targetEnemy = this.findFrontEnemy(soldier, squad, visibleEnemies);
    } else {
      targetEnemy = this.selectTargetByPersonality(soldier, visibleEnemies);
    }
    
    if (targetEnemy) {
      const distance = this.getDistance(soldier.position, targetEnemy.position);
      
      // ★ 교전 거리 (보병은 짧게)
      const engageDistance = isInfantry ? 3 : (3 + aggressionLevel * 4);
      
      if (distance < engageDistance) {
        // 교전 시작
        soldier.engagedWith = targetEnemy.id;
        targetEnemy.engagedWith = soldier.id;
        soldier.state = 'fighting';
        targetEnemy.state = 'fighting';
        
        // ★ 보병: 전선 위치 유지, 적을 쫓아가지 않음
        if (isInfantry) {
          // 진형 위치에서 싸움
          const targetPos = squad.targetPosition || squad.position;
          const offset = this.calculateFormationOffset(squad, soldier.formationSlot.row, soldier.formationSlot.col);
          soldier.targetPosition = this.localToWorld(offset, targetPos, squad.facing);
        }
      } else {
        // ★ 보병: 진형 유지하며 전진 (개별 돌진 X)
        if (isInfantry) {
          const targetPos = squad.targetPosition || squad.position;
          const offset = this.calculateFormationOffset(squad, soldier.formationSlot.row, soldier.formationSlot.col);
          soldier.targetPosition = this.localToWorld(offset, targetPos, squad.facing);
        } else {
          // 기병: 규율에 따라
          if (disciplineLevel > 0.7) {
            const targetPos = squad.targetPosition || squad.position;
            const offset = this.calculateFormationOffset(squad, soldier.formationSlot.row, soldier.formationSlot.col);
            soldier.targetPosition = this.localToWorld(offset, targetPos, squad.facing);
          } else {
            soldier.targetPosition = { ...targetEnemy.position };
          }
        }
        soldier.state = soldier.isCharging ? 'charging' : 'moving';
      }
    } else {
      // 적이 없을 때
      if ((squad.state === 'engaging' || squad.state === 'moving') && squad.targetPosition) {
        // ★ 독립적 성향: 혼자서 적 찾아다님
        if (personality === 'independent' && Math.random() < 0.3) {
          this.searchForEnemies(soldier);
        } else {
          soldier.targetPosition = { ...squad.targetPosition };
          soldier.state = 'moving';
        }
      } else {
        // 진형 위치로
      const targetPos = squad.targetPosition || squad.position;
      const offset = this.calculateFormationOffset(squad, soldier.formationSlot.row, soldier.formationSlot.col);
      soldier.targetPosition = this.localToWorld(offset, targetPos, squad.facing);
      
      const distToTarget = this.getDistance(soldier.position, soldier.targetPosition);
      if (distToTarget > 0.5 && soldier.state !== 'fighting') {
        soldier.state = 'moving';
        }
      }
    }
  }
  
  /** 겁쟁이 행동: 위험하면 후퇴 */
  private handleCowardBehavior(soldier: TWSoldier, squad: TWSquad): void {
    const nearbyEnemies = this.findVisibleEnemies(soldier);
    if (nearbyEnemies.length > 0) {
      // 적 반대 방향으로 도망
      const avgEnemyPos = nearbyEnemies.reduce(
        (acc, e) => ({ x: acc.x + e.position.x, z: acc.z + e.position.z }),
        { x: 0, z: 0 }
      );
      avgEnemyPos.x /= nearbyEnemies.length;
      avgEnemyPos.z /= nearbyEnemies.length;
      
      const fleeAngle = Math.atan2(
        soldier.position.z - avgEnemyPos.z,
        soldier.position.x - avgEnemyPos.x
      );
      soldier.targetPosition = {
        x: soldier.position.x + Math.cos(fleeAngle) * 10,
        z: soldier.position.z + Math.sin(fleeAngle) * 10,
      };
      soldier.state = 'moving';
    } else {
      // 부대 뒤쪽으로 이동 (후열)
      const offset = this.calculateFormationOffset(squad, squad.soldiers.length - 1, soldier.formationSlot.col);
      soldier.targetPosition = this.localToWorld(offset, squad.position, squad.facing);
      soldier.state = 'moving';
    }
  }
  
  /** 광전사 행동: 가장 가까운 적에게 무조건 돌진 */
  private handleBerserkerBehavior(soldier: TWSoldier, squad: TWSquad): void {
    const allEnemies: TWSoldier[] = [];
    this.state.soldiers.forEach(s => {
      if (s.teamId !== soldier.teamId && s.state !== 'dead') {
        allEnemies.push(s);
      }
    });
    
    if (allEnemies.length === 0) return;
    
    // 가장 가까운 적
    let closest = allEnemies[0];
    let minDist = this.getDistance(soldier.position, closest.position);
    for (const enemy of allEnemies) {
      const dist = this.getDistance(soldier.position, enemy.position);
      if (dist < minDist) {
        minDist = dist;
        closest = enemy;
      }
    }
    
    if (minDist < 3 && closest) {
      // ★ 양방향 교전 설정
      soldier.engagedWith = closest.id;
      closest.engagedWith = soldier.id;
      soldier.state = 'fighting';
      closest.state = 'fighting';
    } else if (closest) {
      soldier.targetPosition = { ...closest.position };
      soldier.state = 'charging';
      soldier.isCharging = true;
    }
  }
  
  /** 시야 내 적 찾기 */
  private findVisibleEnemies(soldier: TWSoldier): TWSoldier[] {
    // ★ 패주 중인 병사는 적을 인식하지 않음 (도망만)
    if (soldier.state === 'routing') return [];
    
    const visible: TWSoldier[] = [];
    
    this.state.soldiers.forEach(other => {
      if (other.teamId === soldier.teamId || other.state === 'dead') return;
      
      // ★ 패주 중인 적은 무시 (쫓아가지 않음, 추격 상태면 예외)
      if (other.state === 'routing' && soldier.state !== 'pursuing') return;
      
      const distance = this.getDistance(soldier.position, other.position);
      
      // 1. 청각 범위 내 (360도)
      if (distance <= soldier.awarenessRange) {
        visible.push(other);
        soldier.lastKnownEnemyPositions.set(other.id, { ...other.position });
        return;
      }
      
      // 2. 시야 범위 내 + 시야각 체크
      if (distance <= soldier.visionRange) {
        const angleToEnemy = Math.atan2(
          other.position.x - soldier.position.x,
          other.position.z - soldier.position.z
        );
        let angleDiff = Math.abs(soldier.facing - angleToEnemy);
        if (angleDiff > Math.PI) angleDiff = 2 * Math.PI - angleDiff;
        
        if (angleDiff <= soldier.visionAngle / 2) {
          visible.push(other);
          soldier.lastKnownEnemyPositions.set(other.id, { ...other.position });
        }
      }
    });
    
    return visible;
  }
  
  /** 부대원 간 적 정보 공유 */
  private shareSquadAwareness(soldier: TWSoldier, squad: TWSquad): void {
    for (const ally of squad.soldiers) {
      if (ally.id === soldier.id || ally.state === 'dead') continue;
      
      // 규율 높은 아군의 정보만 공유
      if (ally.disciplineLevel < 0.3) continue;
      
      ally.knownEnemies.forEach(enemyId => {
        const pos = ally.lastKnownEnemyPositions.get(enemyId);
        if (pos && !soldier.lastKnownEnemyPositions.has(enemyId)) {
          soldier.lastKnownEnemyPositions.set(enemyId, pos);
        }
      });
    }
  }
  
  /** 개성에 따른 타겟 선택 */
  private selectTargetByPersonality(soldier: TWSoldier, enemies: TWSoldier[]): TWSoldier | undefined {
    if (enemies.length === 0) return undefined;
    
    const { personality, combatStyle, aggressionLevel } = soldier;
    
    // 거리 기준 정렬
    const sorted = [...enemies].sort((a, b) => 
      this.getDistance(soldier.position, a.position) - this.getDistance(soldier.position, b.position)
    );
    
    switch (personality) {
      case 'aggressive':
      case 'berserker':
        // 가장 가까운 적
        return sorted[0];
        
      case 'cautious':
        // 가장 약한 적 (HP 낮은)
        return [...enemies].sort((a, b) => a.hp - b.hp)[0];
        
      case 'brave':
        // 가장 위험한 적 (HP 높은)
        return [...enemies].sort((a, b) => b.hp - a.hp)[0];
        
      case 'disciplined':
      case 'defensive':
        // 교전 범위 내 가장 가까운 적
        const inRange = sorted.filter(e => 
          this.getDistance(soldier.position, e.position) < 8
        );
        return inRange[0] || sorted[0];
        
      case 'independent':
        // 랜덤 선택
        return sorted[Math.floor(Math.random() * Math.min(3, sorted.length))];
        
      case 'coward':
        // 가장 멀고 약한 적
        return [...enemies].sort((a, b) => {
          const distA = this.getDistance(soldier.position, a.position);
          const distB = this.getDistance(soldier.position, b.position);
          return (a.hp - distA * 10) - (b.hp - distB * 10);
        })[0];
        
      default:
        return sorted[0];
    }
  }
  
  /** 측면 공격 시도 */
  private attemptFlank(soldier: TWSoldier, enemy: TWSoldier): void {
    const flankSide = Math.random() > 0.5 ? 1 : -1;
    const flankAngle = enemy.facing + (Math.PI / 2) * flankSide;
    
    soldier.targetPosition = {
      x: enemy.position.x + Math.sin(flankAngle) * 2,
      z: enemy.position.z + Math.cos(flankAngle) * 2,
    };
  }
  
  /**
   * ★ 전방 적 찾기 (보병 전선 전투용)
   * 병사의 전방 60도 범위 내 가장 가까운 적만 타겟
   */
  private findFrontEnemy(soldier: TWSoldier, squad: TWSquad, enemies: TWSoldier[]): TWSoldier | undefined {
    const frontAngle = Math.PI / 3; // 전방 60도 (좌우 30도씩)
    
    let closestEnemy: TWSoldier | undefined;
    let closestDist = Infinity;
    
    for (const enemy of enemies) {
      // 적 방향 각도 계산
      const angleToEnemy = Math.atan2(
        enemy.position.x - soldier.position.x,
        enemy.position.z - soldier.position.z
      );
      
      // 부대 facing과의 차이 (전방 체크)
      let angleDiff = Math.abs(angleToEnemy - squad.facing);
      if (angleDiff > Math.PI) angleDiff = 2 * Math.PI - angleDiff;
      
      // 전방 범위 내 적만
      if (angleDiff < frontAngle) {
        const dist = this.getDistance(soldier.position, enemy.position);
        if (dist < closestDist) {
          closestDist = dist;
          closestEnemy = enemy;
        }
      }
    }
    
    // 전방에 적이 없으면 가장 가까운 적
    if (!closestEnemy && enemies.length > 0) {
      closestEnemy = enemies.reduce((closest, e) => {
        const distA = this.getDistance(soldier.position, closest.position);
        const distB = this.getDistance(soldier.position, e.position);
        return distB < distA ? e : closest;
      });
    }
    
    return closestEnemy;
  }
  
  /**
   * ★ 측면/후방 보호 AI
   * 적이 측면이나 후방에서 접근하면 대응
   * @returns true면 대응 중이므로 다른 행동 스킵
   */
  private protectFlankAndRear(soldier: TWSoldier, squad: TWSquad): boolean {
    // 규율이 낮으면 측면 보호 안함
    if (soldier.disciplineLevel < 0.3) return false;
    
    // 이미 교전 중이면 현재 적에 집중
    if (soldier.engagedWith) return false;
    
    // 주변 적 탐색 (측면/후방 체크 반경)
    const checkRadius = 8;
    const nearbyEnemies: TWSoldier[] = [];
    
    this.state.soldiers.forEach(s => {
      if (s.teamId !== soldier.teamId && s.state !== 'dead' && s.state !== 'routing') {
        const dist = this.getDistance(soldier.position, s.position);
        if (dist < checkRadius) {
          nearbyEnemies.push(s);
        }
      }
    });
    
    if (nearbyEnemies.length === 0) return false;
    
    // 각 적의 접근 각도 계산
    let mostDangerousEnemy: TWSoldier | null = null;
    let worstAngle = 0;  // 0 = 정면, PI = 후방
    
    for (const enemy of nearbyEnemies) {
      // 적이 나를 향해 접근하는 각도 계산
      const angleToEnemy = Math.atan2(
        enemy.position.x - soldier.position.x,
        enemy.position.z - soldier.position.z
      );
      
      // 내 facing과 적 방향의 차이
      let angleDiff = Math.abs(angleToEnemy - soldier.facing);
      if (angleDiff > Math.PI) angleDiff = 2 * Math.PI - angleDiff;
      
      // 측면(90도 이상) 또는 후방(120도 이상)에서 접근하는 적
      if (angleDiff > Math.PI / 2 && angleDiff > worstAngle) {
        worstAngle = angleDiff;
        mostDangerousEnemy = enemy;
      }
    }
    
    if (!mostDangerousEnemy) return false;
    
    // ★ 위협적인 측면/후방 적 발견!
    const distance = this.getDistance(soldier.position, mostDangerousEnemy.position);
    
    // 적을 향해 facing 전환 (가장 중요!)
    const turnToEnemy = Math.atan2(
      mostDangerousEnemy.position.x - soldier.position.x,
      mostDangerousEnemy.position.z - soldier.position.z
    );
    
    // 서서히 회전 (급격한 회전은 부자연스러움)
    const turnSpeed = 0.15 + soldier.disciplineLevel * 0.1; // 규율 높으면 빠른 대응
    let facingDiff = turnToEnemy - soldier.facing;
    if (facingDiff > Math.PI) facingDiff -= 2 * Math.PI;
    if (facingDiff < -Math.PI) facingDiff += 2 * Math.PI;
    
    soldier.facing += facingDiff * turnSpeed;
    
    // 후방 공격이면 (120도 이상) 더 적극적으로 대응
    if (worstAngle > 2 * Math.PI / 3) {
      // 후방 적에게 즉시 교전
      if (distance < soldier.attackRange * 2) {
        // ★ 양방향 교전 설정
        soldier.engagedWith = mostDangerousEnemy.id;
        mostDangerousEnemy.engagedWith = soldier.id;
        soldier.state = 'fighting';
        mostDangerousEnemy.state = 'fighting';
        return true;
      }
    }
    
    // ★ 아군 방향으로 물러나면서 대응 (고립 방지)
    const squadCenter = squad.position;
    const dirToSquad = Math.atan2(
      squadCenter.x - soldier.position.x,
      squadCenter.z - soldier.position.z
    );
    
    // 적이 가까우면 (교전 거리) 싸우고, 멀면 아군 쪽으로 후퇴하며 대응
    if (distance < soldier.attackRange * 1.5) {
      // ★ 양방향 교전 설정
      soldier.engagedWith = mostDangerousEnemy.id;
      mostDangerousEnemy.engagedWith = soldier.id;
      soldier.state = 'fighting';
      mostDangerousEnemy.state = 'fighting';
    } else if (soldier.survivalInstinct > 0.5) {
      // 생존 본능 높으면 아군 방향으로 후퇴
      soldier.targetPosition = {
        x: soldier.position.x + Math.sin(dirToSquad) * 2,
        z: soldier.position.z + Math.cos(dirToSquad) * 2,
      };
      soldier.state = 'moving';
    }
    
    return true;
  }
  
  /**
   * ★ 진형 내 위치 유지 (측면 노출 최소화)
   * 아군과 어깨를 맞대어 측면을 보호
   */
  private maintainFormationCohesion(soldier: TWSoldier, squad: TWSquad): void {
    // 같은 부대 아군 찾기
    const allies = squad.soldiers.filter(s => 
      s.id !== soldier.id && 
      s.state !== 'dead' && 
      s.state !== 'routing'
    );
    
    if (allies.length === 0) return;
    
    // 가장 가까운 아군 찾기
    let closestAlly: TWSoldier | null = null;
    let closestDist = Infinity;
    
    for (const ally of allies) {
      const dist = this.getDistance(soldier.position, ally.position);
      if (dist < closestDist) {
        closestDist = dist;
        closestAlly = ally;
      }
    }
    
    // 아군과 너무 멀면 가까이 이동 (2~4 거리 유지)
    if (closestAlly && closestDist > 4 && soldier.disciplineLevel > 0.4) {
      const dirToAlly = Math.atan2(
        closestAlly.position.x - soldier.position.x,
        closestAlly.position.z - soldier.position.z
      );
      
      // 아군 방향으로 약간 이동 (급격히 움직이지 않음)
      soldier.targetPosition = {
        x: soldier.position.x + Math.sin(dirToAlly) * 1,
        z: soldier.position.z + Math.cos(dirToAlly) * 1,
      };
    }
  }
  
  /** 적 탐색 (독립적 성향) */
  private searchForEnemies(soldier: TWSoldier): void {
    // 마지막으로 알려진 적 위치로 이동
    if (soldier.lastKnownEnemyPositions.size > 0) {
      const [firstPos] = soldier.lastKnownEnemyPositions.values();
      soldier.targetPosition = { ...firstPos };
      soldier.state = 'moving';
    } else {
      // 랜덤 방향으로 탐색
      const searchAngle = Math.random() * Math.PI * 2;
      soldier.targetPosition = {
        x: soldier.position.x + Math.cos(searchAngle) * 15,
        z: soldier.position.z + Math.sin(searchAngle) * 15,
      };
      soldier.state = 'moving';
    }
  }
  
  /** 전선 형성: 적과 마주보며 일자로 늘어섬 */
  private formBattleLine(soldier: TWSoldier, enemy: TWSoldier): void {
    // 적을 향한 방향 계산
    const angle = Math.atan2(
      enemy.position.x - soldier.position.x,
      enemy.position.z - soldier.position.z
    );
    
    // 전선 방향 (적과 수직)
    const lineAngle = angle + Math.PI / 2;
    
    // 진형 슬롯에 따라 전선에서의 위치 결정
    const lineOffset = (soldier.formationSlot.col - 2) * 1.2; // 병사 간격 1.2
    
    // 적과의 적정 거리
    const combatDistance = soldier.attackRange * 0.9;
    
    // 목표 위치 계산 (적 앞에서 전선 형성)
    soldier.targetPosition = {
      x: enemy.position.x - Math.sin(angle) * combatDistance + Math.sin(lineAngle) * lineOffset,
      z: enemy.position.z - Math.cos(angle) * combatDistance + Math.cos(lineAngle) * lineOffset,
    };
  }
  
  private handleRangedSoldierAI(soldier: TWSoldier, squad: TWSquad): void {
    // ★ 탄약 소진 체크 - 근접전 모드로 전환
    if (soldier.isOutOfAmmo || soldier.ammo <= 0) {
      soldier.isOutOfAmmo = true;
      // 탄약 없으면 근접전으로 전환 (너프된 상태)
      this.handleMeleeSoldierAI(soldier, squad);
      return;
    }
    
    // ★ 측면/후방 보호 (원거리 유닛은 근접당하면 취약!)
    if (this.protectFlankAndRear(soldier, squad)) {
      return; // 측면/후방 대응 중
    }
    
      const targetPos = squad.targetPosition || squad.position;
      const offset = this.calculateFormationOffset(squad, soldier.formationSlot.row, soldier.formationSlot.col);
    const formationPosition = this.localToWorld(offset, targetPos, squad.facing);
    
    // ★ 진형 고수 (orbit 하지 않음!)
    const distToFormation = this.getDistance(soldier.position, formationPosition);
    
    // 사거리 내 적 찾기
    const closestEnemy = this.findClosestEnemySoldier(soldier);
    
    if (!closestEnemy) {
      // 적이 없으면 진형 위치로 이동/대기
      if (distToFormation > 0.5) {
        soldier.targetPosition = formationPosition;
        soldier.state = 'moving';
      } else {
        soldier.state = 'idle';
      }
      return;
    }
    
    const distance = this.getDistance(soldier.position, closestEnemy.position);
    
    // ★ 적이 너무 가까우면 (근접전 강제)
    if (distance < 3) {
      // 근접 교전 돌입 - 탄약 있어도 근접전
      // ★ 양방향 교전 설정
      soldier.engagedWith = closestEnemy.id;
      closestEnemy.engagedWith = soldier.id;
      soldier.state = 'fighting';
      closestEnemy.state = 'fighting';
      soldier.facing = Math.atan2(
        closestEnemy.position.x - soldier.position.x,
        closestEnemy.position.z - soldier.position.z
      );
      return;
    }
    
    // ★ 최소 사거리보다 가까우면 약간 후퇴 (orbit 아님, 직선 후퇴)
    if (distance < soldier.minAttackRange) {
      const retreatAngle = Math.atan2(
        soldier.position.z - closestEnemy.position.z,
        soldier.position.x - closestEnemy.position.x
      );
      // 최대 5m만 후퇴 (과도한 이동 방지)
      const retreatDist = Math.min(5, soldier.minAttackRange - distance + 2);
      soldier.targetPosition = {
        x: soldier.position.x + Math.cos(retreatAngle) * retreatDist,
        z: soldier.position.z + Math.sin(retreatAngle) * retreatDist,
      };
      soldier.state = 'moving';
      return;
    }
    
    // ★ 사거리 내면 진형 위치에서 사격 (이동 안 함!)
    if (distance <= soldier.attackRange) {
      soldier.state = 'fighting';
      // 적을 바라봄
      soldier.facing = Math.atan2(
        closestEnemy.position.x - soldier.position.x,
        closestEnemy.position.z - soldier.position.z
      );
      // 진형 위치 유지 (이동하지 않음 - orbit 방지)
      soldier.targetPosition = formationPosition;
    } else {
      // 사거리 밖이면 진형 위치에서 대기 (적 추격 안 함!)
      soldier.targetPosition = formationPosition;
      if (distToFormation <= 0.5) {
        soldier.state = 'idle';
        // 적 방향을 바라봄
        soldier.facing = Math.atan2(
          closestEnemy.position.x - soldier.position.x,
          closestEnemy.position.z - soldier.position.z
        );
      } else {
      soldier.state = 'moving';
      }
    }
  }
  
  /** 원거리 공격 시 탄약 소비 */
  consumeAmmo(soldier: TWSoldier): boolean {
    if (!soldier.isRanged || soldier.isOutOfAmmo) return false;
    
    if (soldier.ammo > 0) {
      soldier.ammo--;
      if (soldier.ammo <= 0) {
        soldier.isOutOfAmmo = true;
      }
      return true;
    }
    return false;
  }
  
  /** 탄약 잔량 비율 */
  getAmmoRatio(soldier: TWSoldier): number {
    if (!soldier.isRanged || soldier.maxAmmo === 0) return 1;
    return soldier.ammo / soldier.maxAmmo;
  }
  
  /** 부대 전체 탄약 잔량 */
  getSquadAmmoStatus(squad: TWSquad): { current: number; max: number; ratio: number } {
    let current = 0;
    let max = 0;
    
    for (const soldier of squad.soldiers) {
      if (soldier.state !== 'dead' && soldier.isRanged) {
        current += soldier.ammo;
        max += soldier.maxAmmo;
      }
    }
    
    return {
      current,
      max,
      ratio: max > 0 ? current / max : 1,
    };
  }
  
  private handleRouting(soldier: TWSoldier, squad: TWSquad): void {
    soldier.state = 'routing';
    soldier.engagedWith = undefined; // 교전 해제
    
    // 가장 가까운 적 찾기
    const closestEnemy = this.findClosestEnemySoldier(soldier);
    
    let retreatAngle: number;
    if (closestEnemy) {
      // 적 반대 방향으로 도망
      retreatAngle = Math.atan2(
        soldier.position.z - closestEnemy.position.z,
        soldier.position.x - closestEnemy.position.x
      );
    } else {
      // 적이 없으면 팀 기준 후퇴 방향
      retreatAngle = squad.teamId === 'attacker' ? Math.PI : 0;
    }
    
    // 도망 거리 (랜덤하게 흩어짐)
    const retreatDistance = 30 + Math.random() * 20;
    const spreadAngle = retreatAngle + (Math.random() - 0.5) * Math.PI / 3; // ±30도 산개
    
    soldier.targetPosition = {
      x: soldier.position.x + Math.cos(spreadAngle) * retreatDistance,
      z: soldier.position.z + Math.sin(spreadAngle) * retreatDistance,
    };
    
    // 도망 중에도 계속 목표 업데이트 (적이 따라오면 계속 도망)
    const distToTarget = this.getDistance(soldier.position, soldier.targetPosition);
    if (distToTarget < 5) {
      // 목표 지점 근처에 도달하면 새 도망 목표 설정
      soldier.targetPosition = {
        x: soldier.position.x + Math.cos(spreadAngle) * retreatDistance,
        z: soldier.position.z + Math.sin(spreadAngle) * retreatDistance,
      };
    }
    
    // 도망 방향으로 바라봄
    soldier.facing = spreadAngle;
  }
  
  /** 병사 상태 안전하게 변경 (깜빡임 방지) */
  private setSoldierState(soldier: TWSoldier, newState: SoldierState): void {
    const MIN_STATE_INTERVAL = 100; // 최소 100ms 간격
    
    // 같은 상태면 무시
    if (soldier.state === newState) return;
    
    // 죽음은 즉시 적용
    if (newState === 'dead') {
      soldier.state = newState;
      soldier.lastStateChangeTime = this.state.currentTime;
      return;
    }
    
    // 최소 간격 체크 (idle <-> moving 전환 시에만)
    if ((soldier.state === 'idle' && newState === 'moving') ||
        (soldier.state === 'moving' && newState === 'idle')) {
      if (this.state.currentTime - soldier.lastStateChangeTime < MIN_STATE_INTERVAL) {
        return; // 너무 빠른 전환 방지
      }
    }
    
    soldier.state = newState;
    soldier.lastStateChangeTime = this.state.currentTime;
  }
  
  private moveSoldier(soldier: TWSoldier): void {
    if (!soldier.targetPosition) return;
    
    const squad = this.state.squads.get(soldier.squadId);
    
    // ★ 이동 모드에 따른 설정
    const moveMode = squad?.movementMode || 'walk';
    const modeConfig = MOVEMENT_MODE_CONFIG[moveMode];
    const deltaSeconds = this.state.deltaTime / 1000;
    
    // ★ 피로도 증가 (이동 모드에 따라)
    if (squad && soldier.state === 'moving' && modeConfig.fatigueRate > 0) {
      soldier.fatigue = Math.min(100, soldier.fatigue + modeConfig.fatigueRate * deltaSeconds);
    }
    
    // ★ 진형 유지 행군: 부대가 이동 중이고 진형 유지 가능하면 열을 맞춰서 함께 이동
    const canMaintainFormation = squad && squad.isFormationLocked && modeConfig.canMaintainFormation;
    
    if (canMaintainFormation && squad.state === 'moving' && soldier.state !== 'fighting' && soldier.state !== 'routing') {
      if (squad.targetPosition) {
        const squadDx = squad.targetPosition.x - squad.position.x;
        const squadDz = squad.targetPosition.z - squad.position.z;
        const squadDist = Math.sqrt(squadDx * squadDx + squadDz * squadDz);
        
        if (squadDist > 0.5) {
          // ★ 행군 속도: 이동 모드에 따라 다름
          const marchSpeed = squad.baseSpeed * 2.5 * deltaSeconds * COMBAT_TEMPO.speedMultiplier * modeConfig.speedMultiplier;
          
          // ★ 현재 진형 위치 계산 (부대 현재 위치 기준)
          const currentFormationPos = this.localToWorld(
            this.calculateFormationOffset(squad, soldier.formationSlot.row, soldier.formationSlot.col),
            squad.position,
            squad.facing
          );
          
          // ★ 목표 진형 위치 (부대 목표 위치 기준)
          const targetFormationPos = this.localToWorld(
            this.calculateFormationOffset(squad, soldier.formationSlot.row, soldier.formationSlot.col),
            squad.targetPosition,
            squad.facing
          );
          
          // ★ 달리기/돌격 시 보병 진형 흐트러짐
          const isInfantry = !['cavalry', 'shock_cavalry', 'horse_archer', 'chariot'].includes(squad.category);
          let formationJitter = { x: 0, z: 0 };
          
          if (isInfantry && modeConfig.formationDisorder > 0) {
            // 달리기/돌격 시 진형 위치에서 약간 벗어남
            const jitterAmount = modeConfig.formationDisorder * squad.spacing;
            formationJitter = {
              x: (Math.random() - 0.5) * jitterAmount,
              z: (Math.random() - 0.5) * jitterAmount,
            };
            
            // 진형 결속도 감소
            squad.formationCohesion = Math.max(0, squad.formationCohesion - modeConfig.formationDisorder * 0.1);
          }
          
          // ★ 병사가 진형 위치에서 벗어났으면 진형 위치로 보정
          const deviationFromFormation = this.getDistance(soldier.position, currentFormationPos);
          
          if (deviationFromFormation > 2) {
            // 진형에서 많이 벗어남 → 진형 위치로 직접 이동
            const toDx = currentFormationPos.x - soldier.position.x;
            const toDz = currentFormationPos.z - soldier.position.z;
            const toDist = Math.sqrt(toDx * toDx + toDz * toDz);
            soldier.position.x += (toDx / toDist) * marchSpeed;
            soldier.position.z += (toDz / toDist) * marchSpeed;
          } else {
            // 진형 유지 중 → 목표 진형 위치로 이동 (+ 흐트러짐)
            const targetX = targetFormationPos.x + formationJitter.x;
            const targetZ = targetFormationPos.z + formationJitter.z;
            const toTargetDx = targetX - soldier.position.x;
            const toTargetDz = targetZ - soldier.position.z;
            const toTargetDist = Math.sqrt(toTargetDx * toTargetDx + toTargetDz * toTargetDz);
            
            if (toTargetDist > 0.5) {
              const moveAmount = Math.min(marchSpeed, toTargetDist);
              soldier.position.x += (toTargetDx / toTargetDist) * moveAmount;
              soldier.position.z += (toTargetDz / toTargetDist) * moveAmount;
            }
          }
          
          // 부대 방향 바라봄
          soldier.facing = squad.facing;
          soldier.state = 'moving';
          return;
        }
      }
    }
    
    // 기존 개별 이동 로직
    const dx = soldier.targetPosition.x - soldier.position.x;
    const dz = soldier.targetPosition.z - soldier.position.z;
    const distance = Math.sqrt(dx * dx + dz * dz);
    
    if (distance < 0.1) {
      soldier.state = soldier.state === 'moving' ? 'idle' : soldier.state;
      return;
    }
    
    // 피로도에 따른 속도 감소
    const fatigueMultiplier = 1 - (soldier.fatigue / 200);
    // (deltaSeconds는 함수 상단에서 이미 정의됨)
    
    // ★ 도망 중일 때 속도 보너스 (공포로 인한 아드레날린)
    const routingSpeedBonus = soldier.state === 'routing' ? 1.5 : 1.0;
    // ★ 돌격 중일 때 속도 보너스
    const chargingSpeedBonus = soldier.state === 'charging' ? 1.3 : 1.0;
    // ★ 추격 중일 때 속도 보너스 (사냥 본능)
    const pursuitSpeedBonus = soldier.state === 'pursuing' ? PURSUIT_CONFIG.pursuitSpeedBonus : 1.0;
    
    // 속도 스케일 조정 (기본 속도 * 3 * 템포 조절)
    const speed = soldier.speed * 3 * fatigueMultiplier * deltaSeconds * COMBAT_TEMPO.speedMultiplier * routingSpeedBonus * chargingSpeedBonus * pursuitSpeedBonus;
    
    const moveDistance = Math.min(speed, distance);
    soldier.position.x += (dx / distance) * moveDistance;
    soldier.position.z += (dz / distance) * moveDistance;
    
    // 이동 방향으로 회전
    soldier.facing = Math.atan2(dx, dz);
    
    // 이동 중 상태 설정
    if (soldier.state !== 'fighting' && soldier.state !== 'dead' && soldier.state !== 'routing') {
      soldier.state = 'moving';
    }
  }
  
  // ========================================
  // 전투 처리
  // ========================================
  
  private processCombat(): void {
    const currentTime = this.state.currentTime;
    
    // ★ 디버그: 10초마다 전투 상태 로그
    if (Math.floor(currentTime / 10000) !== Math.floor((currentTime - this.state.deltaTime) / 10000)) {
      let attackerFighting = 0, defenderFighting = 0;
      let attackerEngaged = 0, defenderEngaged = 0;
      this.state.soldiers.forEach(s => {
        if (s.state === 'dead') return;
        if (s.teamId === 'attacker') {
          if (s.state === 'fighting') attackerFighting++;
          if (s.engagedWith) attackerEngaged++;
        } else {
          if (s.state === 'fighting') defenderFighting++;
          if (s.engagedWith) defenderEngaged++;
        }
      });
      console.log(`⚔️ [${Math.floor(currentTime/1000)}초] 조조군: fighting=${attackerFighting}, engaged=${attackerEngaged} | 손오연합: fighting=${defenderFighting}, engaged=${defenderEngaged}`);
    }
    
    this.state.soldiers.forEach(soldier => {
      if (soldier.state !== 'fighting') return;
      if (currentTime - soldier.lastAttackTime < soldier.attackCooldown) return;
      
      if (soldier.isRanged) {
        this.processRangedAttack(soldier);
      } else {
        this.processMeleeAttack(soldier);
      }
    });
  }
  
  private processMeleeAttack(attacker: TWSoldier): void {
    if (!attacker.engagedWith) {
      // ★ engagedWith 없으면 fighting 상태 해제
      if (attacker.state === 'fighting') {
        attacker.state = 'idle';
      }
      return;
    }
    
    // ★ 패주 중인 병사는 공격하지 않음
    if (attacker.state === 'routing') {
      attacker.engagedWith = undefined;
      return;
    }
    
    const defender = this.state.soldiers.get(attacker.engagedWith);
    if (!defender || defender.state === 'dead') {
      attacker.engagedWith = undefined;
      return;
    }
    
    // ★ 패주 중인 적은 교전 해제 (추적은 나중에)
    if (defender.state === 'routing') {
      attacker.engagedWith = undefined;
      return;
    }
    
    attacker.lastAttackTime = this.state.currentTime;
    
    // 부대 정보
    const attackerSquad = this.state.squads.get(attacker.squadId)!;
    const defenderSquad = this.state.squads.get(defender.squadId)!;
    
    // CombatCalculator 사용하여 컨텍스트 생성
    const ctx = CombatCalculator.createContext({
      attacker,
      attackerSquad,
      defender,
      defenderSquad,
      currentTime: this.state.currentTime,
      attackerBuffs: this.getSoldierBuffs(attacker.id),
      defenderBuffs: this.getSoldierBuffs(defender.id),
    });
    
    // 명중 판정 (CombatCalculator 사용)
    const hitResult = CombatCalculator.calculateHit(ctx, false);
    if (!hitResult.isHit) return; // 빗나감
    
    // 데미지 계산 (CombatCalculator 사용)
    const damageResult = CombatCalculator.calculateDamage(ctx);
    
    // ★ 진형 수정치 적용
    const attackerFormationMod = this.getFormationModifiers(attackerSquad);
    const defenderFormationMod = this.getFormationModifiers(defenderSquad);
    
    // 공격자 진형 보너스 (정돈된 진형 = 더 강한 공격)
    let formationDamageMod = attackerFormationMod.meleeAttackMod;
    // 방어자 진형 보너스 (정돈된 진형 = 더 나은 방어)
    formationDamageMod /= defenderFormationMod.meleeDefenseMod;
    
    // ★ 란체스터 효과: 수적 우위 시 데미지 보너스
    const nearbyAttackerAllies = this.countNearbyAllies(attacker, 5) + 1; // 자신 포함
    const nearbyDefenderAllies = this.countNearbyAllies(defender, 5) + 1; // 자신 포함
    
    // 방어자의 란체스터 저항 적용
    const defenderStats = CATEGORY_BASE_STATS[defenderSquad.category];
    const defenderResistance = defenderStats.lanchesterResistance || 0;
    
    // 란체스터 제곱 법칙 근사: sqrt(아군/적군) 배율
    // 2:1 = 1.41배, 3:1 = 1.73배, 4:1 = 2배
    // 저항이 있으면 효과 감소 (0.5 저항 = 50% 감소)
    const rawLanchesterMult = Math.sqrt(nearbyAttackerAllies / Math.max(1, nearbyDefenderAllies));
    const lanchesterMultiplier = 1 + (rawLanchesterMult - 1) * (1 - defenderResistance);
    const lanchesterBonusDamage = damageResult.damage * (Math.min(lanchesterMultiplier, 2) - 1);
    
    // ★ 동요/패주 상태 피해 증가 (부대 상태 기준)
    let moraleStateDamageMod = 1.0;
    if (defenderSquad.state === 'wavering') {
      moraleStateDamageMod = 1.3; // 동요 시 30% 피해 증가
    } else if (defenderSquad.state === 'routing') {
      moraleStateDamageMod = 2.0; // 패주 시 100% 피해 증가 (등 보이면 쉽게 죽음)
    }
    
    // ★ 추격 중 후방 공격 피해 증가
    let pursuitDamageMod = 1.0;
    if (attacker.state === 'pursuing' || attacker.pursuitTarget === defender.id) {
      // 방어자가 공격자를 등지고 있는지 확인
      const attackerDir = Math.atan2(
        attacker.position.x - defender.position.x,
        attacker.position.z - defender.position.z
      );
      let angleDiff = Math.abs(defender.facing - attackerDir);
      if (angleDiff > Math.PI) angleDiff = 2 * Math.PI - angleDiff;
      
      // 후방 (120도 이상 = 2.09 라디안)
      if (angleDiff > Math.PI * 2 / 3) {
        pursuitDamageMod = PURSUIT_CONFIG.rearAttackDamageMultiplier; // 2.5배
      }
      // 측면 (60도~120도)
      else if (angleDiff > Math.PI / 3) {
        pursuitDamageMod = 1.5; // 1.5배
      }
    }
    
    // ★ 최종 데미지 = 기본 데미지 * 진형 수정치 * 사기 상태 * 추격 + 란체스터 보너스
    const finalDamage = Math.round((damageResult.damage * formationDamageMod * moraleStateDamageMod * pursuitDamageMod) + lanchesterBonusDamage);
    
    // 사기 피해 계산 (수적 열세 시 사기 피해 증가, 저항 적용)
    const moraleLanchesterMult = 1 + (rawLanchesterMult - 1) * (1 - defenderResistance * 0.5);
    const moraleDamage = CombatCalculator.calculateMoraleDamage(
      finalDamage,
      ctx,
      damageResult.isCritical
    ) * Math.min(moraleLanchesterMult, 1.5);
    
    // 데미지 적용
    this.applyDamageWithMorale(defender, finalDamage, moraleDamage, attacker);
    
    // 크리티컬 로그
    if (damageResult.isCritical) {
      this.state.events.push({
        time: this.state.currentTime,
        type: 'kill', // TODO: 'critical' 타입 추가 고려
        data: {
          attackerId: attacker.id,
          targetId: defender.id,
          damage: damageResult.damage,
          criticalMultiplier: damageResult.criticalMultiplier,
        },
      });
    }
    
    // 피로도 증가
    attacker.fatigue = Math.min(100, attacker.fatigue + 0.5);
    defender.fatigue = Math.min(100, defender.fatigue + 0.3);
  }
  
  /** 병사의 현재 버프 목록 반환 (TODO: 버프 시스템 구현 시 연동) */
  private getSoldierBuffs(soldierId: string): Buff[] {
    // 향후 버프 시스템 구현 시 여기에 버프 목록 반환
    return [];
  }
  
  /** 사기 피해와 함께 데미지 적용 */
  private applyDamageWithMorale(
    target: TWSoldier,
    damage: number,
    moraleDamage: number,
    attacker: TWSoldier
  ): void {
    target.hp -= damage;
    target.morale -= moraleDamage;
    
    if (target.hp <= 0) {
      target.hp = 0;
      target.state = 'dead';
      target.engagedWith = undefined;
      
      // 공격자 교전 해제
      attacker.engagedWith = undefined;
      
      // 부대 킬 카운트 업데이트
      const attackerSquad = this.state.squads.get(attacker.squadId);
      const targetSquad = this.state.squads.get(target.squadId);
      if (attackerSquad) attackerSquad.kills++;
      if (targetSquad) targetSquad.losses++;
      
      // ★ 전황 점수 업데이트 (죽은 유닛 HP에 비례)
      this.onKillScoreUpdate(attacker.teamId, target.maxHp);
      
      this.state.events.push({
        time: this.state.currentTime,
        type: 'kill',
        data: { attackerId: attacker.id, targetId: target.id },
      });
    }
  }
  
  /**
   * 원거리 공격 처리 (풀 사용 최적화)
   */
  private processRangedAttack(attacker: TWSoldier): void {
    // ★ 탄약 체크
    if (attacker.isOutOfAmmo || attacker.ammo <= 0) {
      attacker.isOutOfAmmo = true;
      return; // 탄약 없으면 사격 불가
    }
    
    const target = this.findClosestEnemySoldier(attacker);
    if (!target) return;
    
    const distance = this.getDistance(attacker.position, target.position);
    if (distance > attacker.attackRange || distance < attacker.minAttackRange) return;
    
    attacker.lastAttackTime = this.state.currentTime;
    
    // ★ 탄약 소비
    attacker.ammo--;
    if (attacker.ammo <= 0) {
      attacker.isOutOfAmmo = true;
    }
    
    // ★ 부대 탄약 업데이트
    const attackerSquad = this.state.squads.get(attacker.squadId);
    if (attackerSquad) {
      attackerSquad.currentAmmo = Math.max(0, attackerSquad.currentAmmo - 1);
    }
    
    // 풀에서 투사체 획득
    const projectile = this.projectilePool.acquire();
    
    // 투사체 설정
    projectile.id = this.projectilePool.generateId();
    projectile.from.x = attacker.position.x;
    projectile.from.y = 1.5;
    projectile.from.z = attacker.position.z;
    projectile.to.x = target.position.x;
    projectile.to.y = 1;
    projectile.to.z = target.position.z;
    projectile.current.x = attacker.position.x;
    projectile.current.y = 1.5;
    projectile.current.z = attacker.position.z;
    projectile.type = 'arrow';
    projectile.damage = attacker.weaponDamage;
    projectile.sourceId = attacker.id;
    projectile.targetId = target.id;
    projectile.startTime = this.state.currentTime;
    projectile.duration = distance * 50;  // 거리에 비례한 비행 시간
    
    // ★ 명중률 계산 (기본 35%, 거리/이동/방패 페널티)
    let baseAccuracy = 0.35 - (distance / attacker.attackRange) * 0.2;
    
    // 이동 중인 타겟은 맞추기 어려움 (-10%)
    if (target.state === 'moving' || target.state === 'charging') {
      baseAccuracy -= 0.1;
    }
    
    // 방패 든 유닛은 화살 회피 확률 증가
    const targetSquad = this.state.squads.get(target.squadId);
    if (targetSquad) {
      const targetStats = CATEGORY_BASE_STATS[targetSquad.category];
      if (targetStats.shieldBlock && targetStats.shieldBlock > 0) {
        baseAccuracy -= 0.1; // 방패 있으면 추가 회피
      }
    }
    
    projectile.hit = Math.random() < Math.max(0.1, baseAccuracy); // 최소 10%
    
    this.state.projectiles.push(projectile);
    
    // 피로도 증가
    attacker.fatigue = Math.min(100, attacker.fatigue + 0.2);
  }
  
  private calculateHitChance(
    attacker: TWSoldier, 
    defender: TWSoldier,
    attackerFormation: typeof FORMATION_CONFIG[TWFormation],
    defenderFormation: typeof FORMATION_CONFIG[TWFormation]
  ): number {
    // 기본 명중률 = (공격자 근접공격) / (공격자 근접공격 + 방어자 근접방어)
    const effectiveAttack = attacker.meleeAttack * attackerFormation.meleeAttackBonus;
    const effectiveDefense = defender.meleeDefense * defenderFormation.meleeDefenseBonus;
    
    let hitChance = effectiveAttack / (effectiveAttack + effectiveDefense);
    
    // 피로도 페널티
    hitChance *= (1 - attacker.fatigue / 200);
    
    // 돌격 보너스
    if (attacker.isCharging && attacker.chargeStartTime) {
      const chargeTime = this.state.currentTime - attacker.chargeStartTime;
      if (chargeTime < CHARGE_BONUS_DURATION) {
        hitChance *= 1.2;
      }
    }
    
    return Math.max(0.1, Math.min(0.95, hitChance));
  }
  
  /**
   * 토탈워 스타일 데미지 계산
   * 총 피해 = (일반 피해 - 방어구) + 방어구 관통 피해 + 보너스 피해
   * @deprecated CombatCalculator.calculateDamage() 사용 권장
   */
  private calculateMeleeDamage(
    attacker: TWSoldier, 
    defender: TWSoldier,
    attackerFormation: typeof FORMATION_CONFIG[TWFormation]
  ): number {
    const attackerSquad = this.state.squads.get(attacker.squadId)!;
    const defenderSquad = this.state.squads.get(defender.squadId)!;
    
    // 1. 기본 무기 피해 (일반)
    let normalDamage = attacker.weaponDamage;
    
    // 2. 방어구 관통 피해 (방어구 무시)
    let apDamage = attacker.armorPiercing;
    
    // 3. 진형 보너스
    normalDamage *= attackerFormation.meleeAttackBonus;
    apDamage *= attackerFormation.meleeAttackBonus;
    
    // 4. 돌격 보너스 (시간에 따라 감소)
    if (attacker.isCharging && attacker.chargeStartTime) {
      const chargeTime = this.state.currentTime - attacker.chargeStartTime;
      if (chargeTime < CHARGE_BONUS_DURATION) {
        const chargeFade = 1 - (chargeTime / CHARGE_BONUS_DURATION);
        const chargeBonus = attacker.chargeBonus * chargeFade;
        
        // 돌격 방어 적용
        const defenderStats = CATEGORY_BASE_STATS[defenderSquad.category];
        const chargeDefense = defenderStats.chargeDefense || 0;
        const effectiveChargeBonus = Math.max(0, chargeBonus - chargeDefense);
        
        normalDamage += effectiveChargeBonus * 0.7;
        apDamage += effectiveChargeBonus * 0.3;
      } else {
        attacker.isCharging = false;
      }
    }
    
    // 5. 유닛 상성 보너스
    const attackerStats = CATEGORY_BASE_STATS[attackerSquad.category];
    
    // 대기병 보너스
    if (['cavalry', 'shock_cavalry', 'horse_archer', 'chariot'].includes(defenderSquad.category)) {
      normalDamage += attackerStats.bonusVsCavalry || 0;
    }
    
    // 대보병 보너스
    if (['ji_infantry', 'sword_infantry', 'halberd_infantry', 'spear_guard'].includes(defenderSquad.category)) {
      normalDamage += attackerStats.bonusVsInfantry || 0;
    }
    
    // 6. 방어구 적용 (일반 피해에만)
    const armorReduction = Math.max(0, defender.armor * 0.3); // 방어구의 30%만큼 감소
    normalDamage = Math.max(0, normalDamage - armorReduction);
    
    // 7. 총 피해
    let totalDamage = normalDamage + apDamage;
    
    // 8. 피로도 페널티
    totalDamage *= (1 - attacker.fatigue / 200);
    
    // 9. 랜덤 변동 (±15%)
    totalDamage *= 0.85 + Math.random() * 0.3;
    
    // 10. 전투 템포 조절 (데미지 감소)
    totalDamage *= COMBAT_TEMPO.damageMultiplier;
    
    return Math.max(1, Math.round(totalDamage));
  }
  
  /**
   * @deprecated CombatCalculator.getFlankingMultiplier() 사용 권장
   */
  private calculateFlankingBonus(attacker: TWSoldier, defender: TWSoldier): number {
    // 공격자가 방어자를 바라보는 방향과 방어자가 바라보는 방향의 차이
    const attackAngle = Math.atan2(
      defender.position.x - attacker.position.x,
      defender.position.z - attacker.position.z
    );
    
    let angleDiff = Math.abs(attackAngle - defender.facing);
    if (angleDiff > Math.PI) angleDiff = 2 * Math.PI - angleDiff;
    
    // 정면: 0~60도, 측면: 60~120도, 후방: 120~180도
    if (angleDiff < Math.PI / 3) {
      return FLANKING_BONUS.front;
    } else if (angleDiff < 2 * Math.PI / 3) {
      return FLANKING_BONUS.flank;
    } else {
      return FLANKING_BONUS.rear;
    }
  }
  
  private applyDamage(target: TWSoldier, damage: number, attacker: TWSoldier): void {
    target.hp -= damage;
    
    // 사기 감소
    target.morale -= damage * 0.5;
    
    if (target.hp <= 0) {
      target.hp = 0;
      target.state = 'dead';
      target.engagedWith = undefined;
      
      // 공격자 교전 해제
      attacker.engagedWith = undefined;
      
      // 부대 킬 카운트 업데이트
      const attackerSquad = this.state.squads.get(attacker.squadId);
      const targetSquad = this.state.squads.get(target.squadId);
      if (attackerSquad) attackerSquad.kills++;
      if (targetSquad) targetSquad.losses++;
      
      // ★ 전황 점수 업데이트 (죽은 유닛 HP에 비례)
      this.onKillScoreUpdate(attacker.teamId, target.maxHp);
      
      this.state.events.push({
        time: this.state.currentTime,
        type: 'kill',
        data: { attackerId: attacker.id, targetId: target.id },
      });
    }
  }
  
  // ========================================
  // 충돌 처리 (Quadtree 최적화)
  // ========================================
  
  /** @deprecated 구버전 - O(n²) 충돌 검사 */
  private processCollisions(): void {
    // Quadtree 최적화 버전 사용
    this.processCollisionsOptimized();
  }
  
  /**
   * Quadtree 기반 충돌 처리
   * O(n²) → O(n log n) 최적화
   * 
   * 1000명 기준:
   * - 기존: ~500,000 비교
   * - 최적화: ~8,000 비교 (약 62배 개선)
   */
  private processCollisionsOptimized(): void {
    const COLLISION_RADIUS = 1.5;  // 충돌 검사 반경
    const MIN_DISTANCE = 0.8;      // 최소 간격
    
    // 처리된 쌍 추적 (중복 방지)
    const processedPairs = new Set<string>();
    
    this.state.soldiers.forEach(soldier => {
      if (soldier.state === 'dead') return;
      
      // 버퍼 초기화 및 재사용
      this.collisionCandidatesBuffer.length = 0;
      
      // Quadtree로 주변 병사 쿼리 (반경 내)
      this.quadtree.queryRadius(
        soldier.position.x,
        soldier.position.z,
        COLLISION_RADIUS,
        this.collisionCandidatesBuffer
      );
      
      // 각 후보와 충돌 검사
      for (const candidate of this.collisionCandidatesBuffer) {
        // 자기 자신 스킵
        if (candidate.id === soldier.id) continue;
        
        // 중복 쌍 스킵
        const pairKey = soldier.id < candidate.id 
          ? `${soldier.id}-${candidate.id}`
          : `${candidate.id}-${soldier.id}`;
        
        if (processedPairs.has(pairKey)) continue;
        processedPairs.add(pairKey);
        
        const other = candidate.data;
        if (!other || other.state === 'dead') continue;
        
        // 거리 계산
        const dx = other.position.x - soldier.position.x;
        const dz = other.position.z - soldier.position.z;
        const distSq = dx * dx + dz * dz;
        
        // 최소 거리 이내면 충돌
        if (distSq < MIN_DISTANCE * MIN_DISTANCE && distSq > 0.0001) {
          const distance = Math.sqrt(distSq);
          this.resolveCollision(soldier, other, dx, dz, distance, MIN_DISTANCE);
        }
      }
    });
  }
  
  /**
   * 충돌 해결: 두 병사 밀어내기
   * @param s1 첫 번째 병사
   * @param s2 두 번째 병사
   * @param dx x 방향 차이
   * @param dz z 방향 차이
   * @param distance 현재 거리
   * @param minDist 최소 거리
   */
  private resolveCollision(
    s1: TWSoldier,
    s2: TWSoldier,
    dx: number,
    dz: number,
    distance: number,
    minDist: number
  ): void {
    const overlap = minDist - distance;
    const nx = dx / distance;
    const nz = dz / distance;
    
    // 질량에 따른 밀림 비율
    const totalMass = s1.mass + s2.mass;
    const push1 = (s2.mass / totalMass) * overlap * 0.5;
    const push2 = (s1.mass / totalMass) * overlap * 0.5;
    
    s1.position.x -= nx * push1;
    s1.position.z -= nz * push1;
    s2.position.x += nx * push2;
    s2.position.z += nz * push2;
    
    // 기병 돌격 충돌: 밀린 쪽에 데미지
    if (s1.isCharging && s1.teamId !== s2.teamId) {
      const knockbackDamage = s1.mass * s1.chargeBonus * 0.5 * COMBAT_TEMPO.damageMultiplier;
      this.applyDamage(s2, knockbackDamage, s1);
      s2.morale -= 3;
    } else if (s2.isCharging && s2.teamId !== s1.teamId) {
      const knockbackDamage = s2.mass * s2.chargeBonus * 0.5 * COMBAT_TEMPO.damageMultiplier;
      this.applyDamage(s1, knockbackDamage, s2);
      s1.morale -= 3;
    }
  }
  
  // ========================================
  // 사기 시스템
  // ========================================
  
  private updateMorale(): void {
    this.state.squads.forEach(squad => {
      if (squad.state === 'destroyed') return;
      
      // ★ 손실률에 따른 사기 저하 (토탈워 스타일)
      // 초기 병사 수 (soldiers 배열 길이 + 죽은 병사 수 = 처음 생성된 병사 수)
      const initialCount = squad.soldiers.length + squad.losses;
      const casualtyRate = squad.losses / Math.max(1, initialCount);
      
      // 손실률별 사기 페널티 (매 프레임 적용)
      let casualtyMoralePenalty = 0;
      if (casualtyRate >= 0.9) {
        // 90% 이상 손실: 즉시 전멸 패닉 (-5/frame)
        casualtyMoralePenalty = 5;
      } else if (casualtyRate >= 0.75) {
        // 75% 이상 손실: 심각한 사기 저하 (-2/frame)
        casualtyMoralePenalty = 2;
      } else if (casualtyRate >= 0.5) {
        // 50% 이상 손실: 중간 사기 저하 (-1/frame)
        casualtyMoralePenalty = 1;
      } else if (casualtyRate >= 0.25) {
        // 25% 이상 손실: 약한 사기 저하 (-0.3/frame)
        casualtyMoralePenalty = 0.3;
      }
      
      squad.soldiers.forEach(soldier => {
        if (soldier.state === 'dead') return;
        
        // 손실률 사기 페널티 적용
        soldier.morale -= casualtyMoralePenalty;
        
        // 사기 자연 회복 (전투 중이 아닐 때, 손실률 낮을 때만)
        if ((soldier.state === 'idle' || soldier.state === 'moving') && casualtyRate < 0.25) {
          soldier.morale = Math.min(100, soldier.morale + 0.1);
        }
        
        // ★ 피로도 시스템
        switch (soldier.state) {
          case 'idle':
          case 'rallying':
            // 휴식 중 피로도 회복
            soldier.fatigue = Math.max(0, soldier.fatigue - 0.3);
            break;
          case 'moving':
            // 이동 중 피로도 약간 증가
            soldier.fatigue = Math.min(100, soldier.fatigue + 0.05);
            break;
          case 'charging':
            // 돌격 중 피로도 빠르게 증가
            soldier.fatigue = Math.min(100, soldier.fatigue + 0.2);
            break;
          case 'fighting':
            // 전투 중 피로도 증가 (processCombat에서도 증가)
            soldier.fatigue = Math.min(100, soldier.fatigue + 0.1);
            break;
          case 'routing':
            // 도주 중 피로도 빠르게 증가
            soldier.fatigue = Math.min(100, soldier.fatigue + 0.15);
            break;
        }
        
        // ★ 높은 피로도 시 추가 사기 저하
        if (soldier.fatigue > 80) {
          soldier.morale -= 0.3; // 극도의 피로 = 사기 저하
        } else if (soldier.fatigue > 60) {
          soldier.morale -= 0.1;
        }
        
        // 주변 아군 사망 시 사기 저하
        const nearbyDeadAllies = squad.soldiers.filter(s => 
          s.state === 'dead' && 
          this.getDistance(soldier.position, s.position) < 5
        ).length;
        soldier.morale -= nearbyDeadAllies * 0.1;
        
        // 협공당할 때 사기 저하
        if (this.isBeingFlanked(soldier)) {
          soldier.morale -= 0.5;
        }
        
        // ★ 란체스터 효과: 주변 수적 열세 시 사기 저하
        const nearbyAllies = this.countNearbyAllies(soldier, 8);
        const nearbyEnemies = this.countNearbyEnemies(soldier, 8);
        if (nearbyEnemies > nearbyAllies * 1.5) {
          // 적이 1.5배 이상 많으면 사기 저하 (수적 열세 패닉)
          const outnumberedRatio = nearbyEnemies / Math.max(1, nearbyAllies);
          soldier.morale -= outnumberedRatio * 0.3; // 2:1이면 -0.6/frame
        } else if (nearbyAllies > nearbyEnemies * 1.5 && soldier.state === 'fighting') {
          // 아군이 1.5배 이상 많으면 사기 보너스 (수적 우위 자신감)
          soldier.morale = Math.min(100, soldier.morale + 0.1);
        }
        
        // ★ 고립된 병사: 주변에 아군 없고 적만 있으면 즉시 패닉
        if (nearbyAllies === 0 && nearbyEnemies >= 2) {
          soldier.morale -= 3; // 고립 패닉
          if (soldier.morale < MORALE_THRESHOLDS.routing) {
            soldier.state = 'routing';
            soldier.engagedWith = undefined;
          }
        }
        
        // 사기 임계값 체크
        soldier.morale = Math.max(0, Math.min(100, soldier.morale));
        
        if (soldier.morale < MORALE_THRESHOLDS.routing) {
          if (soldier.state !== 'routing') {
            soldier.state = 'routing';
            soldier.engagedWith = undefined;
            this.state.events.push({
              time: this.state.currentTime,
              type: 'rout',
              data: { soldierId: soldier.id },
            });
            
            // ★ 근처 적 병사들에게 추격 기회 부여
            this.triggerPursuitForNearbyEnemies(soldier);
          }
        } else if (soldier.morale < MORALE_THRESHOLDS.wavering) {
          soldier.state = 'wavering';
        }
      });
      
      // 부대 전체 사기 체크
      const aliveSoldiers = squad.soldiers.filter(s => s.state !== 'dead');
      if (aliveSoldiers.length === 0) return;
      
      const avgMorale = aliveSoldiers.reduce((acc, s) => acc + s.morale, 0) / aliveSoldiers.length;
      
      // ★ 전투 참여율 계산
      const engagedSoldiers = aliveSoldiers.filter(s => 
        s.state === 'fighting' || s.engagedWith
      ).length;
      const engagementRate = engagedSoldiers / Math.max(1, aliveSoldiers.length);
      
      // 전투 참여율이 낮고 (20% 미만) 적이 많으면 사기 저하
      if (engagementRate < 0.2 && squad.state === 'engaging') {
        // 대부분이 교전에 참여하지 못함 = 포위당함
        aliveSoldiers.forEach(s => {
          if (s.state !== 'fighting') {
            s.morale -= 0.5; // 교전 못하는 병사는 사기 저하
          }
        });
      }
      
      // ★ 마지막 소수 병사 강제 패주 (3명 이하 + 90% 이상 손실)
      if (aliveSoldiers.length <= 3 && casualtyRate >= 0.9 && squad.state !== 'routing') {
        squad.state = 'routing';
        squad.hasRouted = true; // 소수 생존은 재집결 불가
        aliveSoldiers.forEach(s => {
          s.state = 'routing';
          s.morale = 0;
          s.engagedWith = undefined;
        });
        this.state.events.push({
          time: this.state.currentTime,
          type: 'rout',
          data: { squadId: squad.id, reason: 'annihilated' },
        });
      }
      // ★ 손실률 90% 이상이면 즉시 패주 (재집결 가능)
      else if (casualtyRate >= 0.9 && squad.state !== 'routing') {
        squad.state = 'routing';
        this.state.events.push({
          time: this.state.currentTime,
          type: 'rout',
          data: { squadId: squad.id, reason: 'heavy_casualties' },
        });
      } else if (avgMorale < MORALE_THRESHOLDS.shattered) {
        // ★ 완전 붕괴 (사기 5 이하) - 재집결 불가
        squad.state = 'routing';
        squad.hasRouted = true;
        this.state.events.push({
          time: this.state.currentTime,
          type: 'rout',
          data: { squadId: squad.id, reason: 'shattered' },
        });
      } else if (avgMorale < MORALE_THRESHOLDS.routing) {
        squad.state = 'routing';
        this.state.events.push({
          time: this.state.currentTime,
          type: 'rout',
          data: { squadId: squad.id },
        });
      } else if (avgMorale < MORALE_THRESHOLDS.wavering) {
        squad.state = 'wavering';
      }
      
      // ★ 동요/패주 시 추가 효과
      this.applyMoraleStateEffects(squad, aliveSoldiers);
    });
  }
  
  /**
   * ★ 동요/패주 시 효과 적용
   * - 동요: 뒤로 약간 밀림, 진형 느슨해짐
   * - 패주: 많이 밀림, 진형 붕괴
   */
  private applyMoraleStateEffects(squad: TWSquad, aliveSoldiers: TWSoldier[]): void {
    const deltaSeconds = this.state.deltaTime / 1000;
    
    if (squad.state === 'wavering') {
      // ★ 동요 상태: 뒤로 밀림 + 진형 느슨해짐
      squad.formationState = 'loose';
      squad.formationCohesion = Math.max(30, squad.formationCohesion - 0.5);
      squad.isFormationLocked = false; // 진형 유지 불가
      
      // 병사들이 뒤로 약간 밀림 (적 반대 방향)
      const retreatDir = squad.facing + Math.PI; // 후방
      const retreatSpeed = 0.3 * deltaSeconds;
      
      aliveSoldiers.forEach(soldier => {
        if (soldier.state !== 'dead') {
          soldier.position.x += Math.sin(retreatDir) * retreatSpeed;
          soldier.position.z += Math.cos(retreatDir) * retreatSpeed;
          // 진형에서 약간 흐트러짐
          soldier.position.x += (Math.random() - 0.5) * 0.1;
          soldier.position.z += (Math.random() - 0.5) * 0.1;
        }
      });
    } else if (squad.state === 'routing') {
      // ★ 패주 상태: 빠르게 밀림 + 진형 완전 붕괴
      squad.formationState = 'broken';
      squad.formationCohesion = 0;
      squad.isFormationLocked = false;
      
      // 병사들이 빠르게 도망
      const retreatDir = squad.facing + Math.PI;
      const retreatSpeed = 1.5 * deltaSeconds;
      
      aliveSoldiers.forEach(soldier => {
        if (soldier.state !== 'dead') {
          // 빠르게 후퇴 + 흩어짐
          const scatterAngle = retreatDir + (Math.random() - 0.5) * 0.8;
          soldier.position.x += Math.sin(scatterAngle) * retreatSpeed;
          soldier.position.z += Math.cos(scatterAngle) * retreatSpeed;
          soldier.facing = scatterAngle; // 도망 방향 바라봄
          soldier.state = 'routing';
          soldier.engagedWith = undefined;
        }
      });
    }
  }
  
  /**
   * ★ 패주 병사 근처의 적들에게 추격 기회 부여
   */
  private triggerPursuitForNearbyEnemies(routingEnemy: TWSoldier): void {
    // 버퍼 재사용
    this.queryBuffer.length = 0;
    this.quadtree.queryRadius(
      routingEnemy.position.x,
      routingEnemy.position.z,
      PURSUIT_CONFIG.triggerRange,
      this.queryBuffer
    );
    
    for (const point of this.queryBuffer) {
      const soldier = point.data;
      if (!soldier || soldier.teamId === routingEnemy.teamId) continue;
      if (soldier.state === 'dead' || soldier.state === 'routing' || soldier.state === 'wavering') continue;
      if (soldier.state === 'pursuing') continue; // 이미 추격 중
      
      // 추격 확률 계산
      const squad = this.state.squads.get(soldier.squadId);
      let pursuitChance = PURSUIT_CONFIG.pursuitChance;
      
      if (squad) {
        // 기병은 추격 확률 높음
        if (['cavalry', 'shock_cavalry', 'horse_archer'].includes(squad.category)) {
          pursuitChance = PURSUIT_CONFIG.cavalryPursuitChance;
        }
        // 방진 병사는 추격 확률 낮음 (진형 유지 우선)
        else if (squad.tacticalRole === 'line_holder') {
          pursuitChance = PURSUIT_CONFIG.lineHolderPursuitChance;
        }
      }
      
      // 공격성 높은 병사는 추격 확률 증가
      pursuitChance += soldier.aggressionLevel * 0.2;
      // 규율 높은 병사는 추격 자제 (진형 유지)
      pursuitChance -= soldier.disciplineLevel * 0.3;
      
      pursuitChance = Math.max(0.1, Math.min(0.95, pursuitChance));
      
      if (Math.random() < pursuitChance) {
        // 추격 시작!
        soldier.state = 'pursuing';
        soldier.pursuitTarget = routingEnemy.id;
        soldier.pursuitStartTime = this.state.currentTime;
        soldier.pursuitStartPosition = { ...soldier.position };
        soldier.engagedWith = undefined; // 기존 교전 해제
      }
    }
  }
  
  /**
   * ★ 추격 AI 처리
   */
  private handlePursuit(soldier: TWSoldier, squad: TWSquad): void {
    // 추격 중단 조건 체크
    if (!soldier.pursuitTarget || !soldier.pursuitStartTime || !soldier.pursuitStartPosition) {
      soldier.state = 'idle';
      return;
    }
    
    const target = this.state.soldiers.get(soldier.pursuitTarget);
    
    // 타겟이 없거나 죽었으면 추격 종료
    if (!target || target.state === 'dead') {
      this.endPursuit(soldier);
      return;
    }
    
    // 최대 추격 시간 초과
    const pursuitDuration = this.state.currentTime - soldier.pursuitStartTime;
    if (pursuitDuration > PURSUIT_CONFIG.maxDuration) {
      this.endPursuit(soldier);
      return;
    }
    
    // 최대 추격 거리 초과
    const distanceFromStart = this.getDistance(soldier.position, soldier.pursuitStartPosition);
    if (distanceFromStart > PURSUIT_CONFIG.maxDistance) {
      this.endPursuit(soldier);
      return;
    }
    
    // 타겟이 더 이상 패주 중이 아니면 (재집결 등)
    if (target.state !== 'routing') {
      // 근처에 있으면 교전, 아니면 추격 종료
      const distance = this.getDistance(soldier.position, target.position);
      if (distance < 3) {
        soldier.engagedWith = target.id;
        soldier.state = 'fighting';
      } else {
        this.endPursuit(soldier);
      }
      return;
    }
    
    // 타겟 추적
    const distance = this.getDistance(soldier.position, target.position);
    
    if (distance < 2) {
      // 근접 - 후방 공격!
      soldier.engagedWith = target.id;
      soldier.state = 'fighting';
      soldier.pursuitTarget = undefined; // 추격 종료, 전투 돌입
    } else {
      // 추격 이동
      soldier.targetPosition = { ...target.position };
      soldier.facing = Math.atan2(
        target.position.x - soldier.position.x,
        target.position.z - soldier.position.z
      );
    }
  }
  
  /**
   * ★ 추격 종료
   */
  private endPursuit(soldier: TWSoldier): void {
    soldier.state = 'idle';
    soldier.pursuitTarget = undefined;
    soldier.pursuitStartTime = undefined;
    soldier.pursuitStartPosition = undefined;
  }
  
  private isBeingFlanked(soldier: TWSoldier): boolean {
    // 적이 측면/후방에 있는지 체크
    const enemies = Array.from(this.state.soldiers.values()).filter(s => 
      s.teamId !== soldier.teamId && 
      s.state !== 'dead' &&
      this.getDistance(soldier.position, s.position) < 3
    );
    
    for (const enemy of enemies) {
      const attackAngle = Math.atan2(
        soldier.position.x - enemy.position.x,
        soldier.position.z - enemy.position.z
      );
      
      let angleDiff = Math.abs(attackAngle - soldier.facing);
      if (angleDiff > Math.PI) angleDiff = 2 * Math.PI - angleDiff;
      
      if (angleDiff > Math.PI / 3) return true; // 60도 이상 = 측면/후방
    }
    
    return false;
  }
  
  /**
   * 란체스터 효과: 주변 아군 수 계산
   */
  private countNearbyAllies(soldier: TWSoldier, radius: number): number {
    let count = 0;
    this.state.soldiers.forEach(s => {
      if (s.id !== soldier.id && 
          s.teamId === soldier.teamId && 
          s.state !== 'dead' &&
          this.getDistance(soldier.position, s.position) < radius) {
        count++;
      }
    });
    return count;
  }
  
  /**
   * 란체스터 효과: 주변 적군 수 계산
   */
  private countNearbyEnemies(soldier: TWSoldier, radius: number): number {
    let count = 0;
    this.state.soldiers.forEach(s => {
      if (s.teamId !== soldier.teamId && 
          s.state !== 'dead' &&
          this.getDistance(soldier.position, s.position) < radius) {
        count++;
      }
    });
    return count;
  }
  
  // ========================================
  // 투사체 처리 (최적화)
  // ========================================
  
  /** @deprecated 구버전 - 배열 재생성 */
  private updateProjectiles(): void {
    this.updateProjectilesOptimized();
  }
  
  /**
   * 투사체 업데이트 (최적화)
   * - 배열 재생성 제거 (in-place 삭제)
   * - includes() 대신 Set 사용
   */
  private updateProjectilesOptimized(): void {
    let writeIndex = 0;  // 유지할 투사체 쓰기 위치
    
    for (let readIndex = 0; readIndex < this.state.projectiles.length; readIndex++) {
      const proj = this.state.projectiles[readIndex];
      
      const elapsed = this.state.currentTime - proj.startTime;
      const progress = Math.min(1, elapsed / proj.duration);
      
      // 포물선 궤적 업데이트
      const arcHeight = Math.sin(progress * Math.PI) * 3;
      proj.current.x = proj.from.x + (proj.to.x - proj.from.x) * progress;
      proj.current.y = proj.from.y + (proj.to.y - proj.from.y) * progress + arcHeight;
      proj.current.z = proj.from.z + (proj.to.z - proj.from.z) * progress;
      
      if (progress >= 1) {
        // 투사체 종료 - 명중 처리
        if (proj.hit && proj.targetId) {
          const target = this.state.soldiers.get(proj.targetId);
          const source = this.state.soldiers.get(proj.sourceId);
          if (target && target.state !== 'dead' && source) {
            // ★ 방패 방어 체크
            const targetSquad = this.state.squads.get(target.squadId);
            const sourceSquad = this.state.squads.get(source.squadId);
            
            if (targetSquad && sourceSquad) {
              const stats = CATEGORY_BASE_STATS[targetSquad.category];
              const shieldBlock = stats.shieldBlock || 0;
              const missileResist = stats.missileResist || 0;
              
              // 전방에서 오는 화살만 방패로 차단 가능
              const angleToSource = Math.atan2(
                source.position.x - target.position.x,
                source.position.z - target.position.z
              );
              let angleDiff = Math.abs(target.facing - angleToSource);
              if (angleDiff > Math.PI) angleDiff = 2 * Math.PI - angleDiff;
              const isFrontal = angleDiff < Math.PI / 2; // 전방 90도 이내
              
              // ★ 진형별 원거리 방어 보너스
              const formationConfig = FORMATION_CONFIG[targetSquad.formation];
              const formationRangedDefense = formationConfig.rangedDefenseBonus || 1.0;
              
              // 진형 보너스가 적용된 방패 차단율
              const effectiveShieldBlock = Math.min(0.9, shieldBlock * formationRangedDefense);
              
              // ★ 방패 차단 확률 (전방에서만, 방패 있는 유닛만)
              if (isFrontal && effectiveShieldBlock > 0 && Math.random() < effectiveShieldBlock) {
                // 방패로 차단! 피해 없음
              } else {
                // 피해 적용 (★ 원거리 데미지 기본 60%로 너프)
                let damage = Math.max(1, (proj.damage - target.armor * 0.5) * COMBAT_TEMPO.damageMultiplier * 0.6);
                
                // ★ 진형 방어 보너스 적용 (피해 감소)
                damage /= formationRangedDefense;
                
                // ★ 원거리 피해 저항 적용 (방패 있는 유닛만)
                if (missileResist > 0) {
                  damage *= (1 - missileResist);
                }
                
                // ★ 근접 보병에 대한 추가 피해 감소 (갑옷+방패)
                const isHeavyInfantry = ['ji_infantry', 'sword_infantry', 'halberd_infantry', 'spear_guard'].includes(targetSquad.category);
                if (isHeavyInfantry) {
                  damage *= 0.7; // 중장보병 -30% 추가 감소
                }
                
                // ★ 노병(crossbow)은 관통력으로 방패/갑옷 무시
                if (sourceSquad.category === 'crossbow') {
                  damage = Math.max(1, (proj.damage - target.armor * 0.2) * COMBAT_TEMPO.damageMultiplier);
                  damage /= Math.sqrt(formationRangedDefense); // 진형 효과 절반
                }
                
                // ★ 동요/패주 상태 피해 증가
                if (targetSquad.state === 'wavering' || target.state === 'wavering') {
                  damage *= 1.3; // 동요 시 30% 증가
                } else if (targetSquad.state === 'routing' || target.state === 'routing') {
                  damage *= 2.0; // 패주 시 100% 증가
                }
                
                this.applyDamage(target, Math.round(damage), source);
              }
            } else {
              // 부대 정보 없으면 기본 피해
            const damage = Math.max(1, (proj.damage - target.armor * 0.5) * COMBAT_TEMPO.damageMultiplier);
            this.applyDamage(target, damage, source);
            }
          }
        }
        
        // 풀에 반환
        this.projectilePool.release(proj);
        // writeIndex 증가하지 않음 (삭제됨)
      } else {
        // 유지할 투사체 - 앞으로 이동
        if (readIndex !== writeIndex) {
          this.state.projectiles[writeIndex] = proj;
        }
        writeIndex++;
      }
    }
    
    // 배열 길이 조정 (배열 재생성 없이 in-place 삭제)
    this.state.projectiles.length = writeIndex;
  }
  
  // ========================================
  // 전황 점수 시스템
  // ========================================
  
  /** 전황 점수 업데이트 (줄다리기) */
  private updateBattleScore(): void {
    const attackerSquads = Array.from(this.state.squads.values()).filter(s => s.teamId === 'attacker');
    const defenderSquads = Array.from(this.state.squads.values()).filter(s => s.teamId === 'defender');
    
    // 각 팀의 전투력 계산
    let attackerPower = 0;
    let defenderPower = 0;
    let attackerMaxPower = 0;
    let defenderMaxPower = 0;
    
    for (const squad of attackerSquads) {
      const aliveSoldiers = squad.soldiers.filter(s => s.state !== 'dead').length;
      // ★ 병사 수 60% + 사기 40%
      const power = aliveSoldiers * (0.6 + (squad.morale / 100) * 0.4);
      attackerPower += power;
      attackerMaxPower += squad.soldiers.length;
    }
    
    for (const squad of defenderSquads) {
      const aliveSoldiers = squad.soldiers.filter(s => s.state !== 'dead').length;
      // ★ 병사 수 60% + 사기 40%
      const power = aliveSoldiers * (0.6 + (squad.morale / 100) * 0.4);
      defenderPower += power;
      defenderMaxPower += squad.soldiers.length;
    }
    
    // 전투력 비율로 기세 계산
    const totalPower = attackerPower + defenderPower;
    if (totalPower > 0) {
      const attackerRatio = attackerPower / totalPower;
      // 기세: -100(방어팀 압도) ~ +100(공격팀 압도)
      this.state.battleScore.momentum = (attackerRatio - 0.5) * 200;
    }
    
    // 점수 업데이트 (기세에 따라 변화) - ★ 10분+ 전투 템포에 맞게 조절
    // 0.001 → 0.0003 (3배 느리게)
    const scoreChange = this.state.battleScore.momentum * 0.0003 * (this.state.deltaTime / 16);
    
    // ★ 점수는 줄다리기: 한쪽이 올라가면 다른쪽이 내려감
    // 합계는 항상 100 유지
    if (scoreChange > 0) {
      // 공격팀 우세 → 공격팀 점수 증가
      const newAttackerScore = Math.min(100, this.state.battleScore.attackerScore + scoreChange);
      this.state.battleScore.attackerScore = newAttackerScore;
      this.state.battleScore.defenderScore = 100 - newAttackerScore;
    } else {
      // 방어팀 우세 → 방어팀 점수 증가
      const newDefenderScore = Math.min(100, this.state.battleScore.defenderScore - scoreChange);
      this.state.battleScore.defenderScore = newDefenderScore;
      this.state.battleScore.attackerScore = 100 - newDefenderScore;
    }
    
    // 킬/손실에 따른 추가 점수
    // (이벤트 기반으로 처리 - applyDamage에서 호출)
  }
  
  /** 초기 전장 총 HP 계산 (전투 시작 시 호출) */
  calculateInitialTotalHp(): void {
    let totalHp = 0;
    this.state.soldiers.forEach(soldier => {
      if (soldier.state !== 'dead') {
        totalHp += soldier.maxHp;
      }
    });
    this.state.battleScore.initialTotalHp = totalHp;
    console.log(`⚔️ 초기 전장 총 HP: ${totalHp.toLocaleString()}`);
  }
  
  /** 킬 발생 시 점수 변동 (유닛 HP에 비례) */
  onKillScoreUpdate(killerTeam: 'attacker' | 'defender', killedUnitMaxHp: number): void {
    // ★ 초기 총 HP가 없으면 계산
    if (this.state.battleScore.initialTotalHp === 0) {
      this.calculateInitialTotalHp();
    }
    
    // ★ 전체 전장 HP 대비 비율로 점수 계산
    // 전체의 1%가 죽으면 0.5점 변동 (50점 = 50% 손실)
    const initialHp = this.state.battleScore.initialTotalHp || 1;
    const hpRatio = killedUnitMaxHp / initialHp;
    const scoreGain = hpRatio * 50; // 전체 HP의 1% = 0.5점
    
    if (killerTeam === 'attacker') {
      const newScore = Math.min(100, this.state.battleScore.attackerScore + scoreGain);
      this.state.battleScore.attackerScore = newScore;
      this.state.battleScore.defenderScore = 100 - newScore;
    } else {
      const newScore = Math.min(100, this.state.battleScore.defenderScore + scoreGain);
      this.state.battleScore.defenderScore = newScore;
      this.state.battleScore.attackerScore = 100 - newScore;
    }
  }
  
  /** 전황 점수 가져오기 (UI용) */
  getBattleScore(): typeof this.state.battleScore {
    return this.state.battleScore;
  }
  
  // ========================================
  // 승패 판정
  // ========================================
  
  private checkVictory(): void {
    // ★ 전황 점수 업데이트
    this.updateBattleScore();
    
    const attackerSquads = Array.from(this.state.squads.values()).filter(s => s.teamId === 'attacker');
    const defenderSquads = Array.from(this.state.squads.values()).filter(s => s.teamId === 'defender');
    
    const attackerAlive = attackerSquads.some(s => s.state !== 'destroyed' && s.state !== 'routing');
    const defenderAlive = defenderSquads.some(s => s.state !== 'destroyed' && s.state !== 'routing');
    
    // ★ 전황 점수 기반 승리 체크
    if (this.state.battleScore.attackerScore >= this.state.battleScore.victoryThreshold) {
      this.state.winner = 'attacker';
      this.state.isActive = false;
    } else if (this.state.battleScore.defenderScore >= this.state.battleScore.victoryThreshold) {
      this.state.winner = 'defender';
      this.state.isActive = false;
    } else if (!attackerAlive && !defenderAlive) {
      this.state.winner = 'draw';
      this.state.isActive = false;
    } else if (!attackerAlive) {
      this.state.winner = 'defender';
      this.state.isActive = false;
    } else if (!defenderAlive) {
      this.state.winner = 'attacker';
      this.state.isActive = false;
    }
    
    if (this.state.winner) {
      this.state.events.push({
        time: this.state.currentTime,
        type: 'victory',
        data: { winner: this.state.winner },
      });
    }
  }
  
  // ========================================
  // 유틸리티 (Quadtree 최적화)
  // ========================================
  
  /**
   * 가장 가까운 적 병사 찾기 (Quadtree 최적화)
   * 
   * 전략:
   * 1. 작은 반경부터 시작하여 점진적 확장
   * 2. 찾으면 즉시 반환 (조기 종료)
   * 3. O(n) → O(k + log n), k = 탐색 반경 내 병사 수
   */
  private findClosestEnemySoldier(soldier: TWSoldier): TWSoldier | null {
    // ★ 패주 중인 병사는 적을 찾지 않음 (도망만)
    if (soldier.state === 'routing') return null;
    
    // 점진적 탐색 반경 (성능 최적화)
    const searchRadii = [5, 15, 30, 60, 120, this.WORLD_SIZE];
    
    for (const radius of searchRadii) {
      // 버퍼 재사용
      this.queryBuffer.length = 0;
      this.quadtree.queryRadius(
        soldier.position.x,
        soldier.position.z,
        radius,
        this.queryBuffer
      );
      
      let closest: TWSoldier | null = null;
      let minDistSq = Infinity;
      
      for (const point of this.queryBuffer) {
        // 자신 스킵
        if (point.id === soldier.id) continue;
        
        const other = point.data;
        if (!other || other.teamId === soldier.teamId || other.state === 'dead') continue;
        
        // ★ 패주 중인 적은 타겟에서 제외 (추격 상태가 아니면)
        if (other.state === 'routing' && soldier.state !== 'pursuing') continue;
        
        const dx = other.position.x - soldier.position.x;
        const dz = other.position.z - soldier.position.z;
        const distSq = dx * dx + dz * dz;
        
        if (distSq < minDistSq) {
          minDistSq = distSq;
          closest = other;
        }
      }
      
      // 적을 찾으면 반환
      if (closest) {
        return closest;
      }
    }
    
    return null;
  }
  
  /**
   * 특정 범위 내 적 병사 모두 찾기 (Quadtree 최적화)
   * @param soldier 기준 병사
   * @param radius 검색 반경
   * @param result 결과 배열 (재사용)
   */
  private findEnemySoldiersInRadius(
    soldier: TWSoldier,
    radius: number,
    result: TWSoldier[] = []
  ): TWSoldier[] {
    result.length = 0;
    this.queryBuffer.length = 0;
    
    this.quadtree.queryRadius(
      soldier.position.x,
      soldier.position.z,
      radius,
      this.queryBuffer
    );
    
    for (const point of this.queryBuffer) {
      if (point.id === soldier.id) continue;
      const other = point.data;
      if (!other || other.teamId === soldier.teamId || other.state === 'dead') continue;
      result.push(other);
    }
    
    return result;
  }
  
  /**
   * 가장 가까운 적 부대 찾기
   * 부대 수는 적으므로 단순 순회
   */
  private findClosestEnemySquad(squad: TWSquad): TWSquad | null {
    let closest: TWSquad | null = null;
    let minDistSq = Infinity;
    
    this.state.squads.forEach(other => {
      if (other.teamId === squad.teamId || other.state === 'destroyed') return;
      
      const dx = other.position.x - squad.position.x;
      const dz = other.position.z - squad.position.z;
      const distSq = dx * dx + dz * dz;
      
      if (distSq < minDistSq) {
        minDistSq = distSq;
        closest = other;
      }
    });
    
    return closest;
  }
  
  /**
   * 거리 계산
   */
  private getDistance(a: Vector2, b: Vector2): number {
    const dx = b.x - a.x;
    const dz = b.z - a.z;
    return Math.sqrt(dx * dx + dz * dz);
  }
  
  /**
   * 거리 제곱 계산 (sqrt 생략으로 성능 향상)
   */
  private getDistanceSq(a: Vector2, b: Vector2): number {
    const dx = b.x - a.x;
    const dz = b.z - a.z;
    return dx * dx + dz * dz;
  }
  
  // ========================================
  // 공개 API
  // ========================================
  
  startBattle(): void {
    this.state.isActive = true;
    this.state.battleStartTime = Date.now();
    
    // ★ 실제 부대 배치 기반으로 진영 위치 계산
    this.calculateTeamPositions();
  }
  
  pauseBattle(): void {
    this.state.isActive = false;
  }
  
  resumeBattle(): void {
    this.state.isActive = true;
  }
  
  issueCommand(squadId: string, command: SquadCommand): void {
    const squad = this.state.squads.get(squadId);
    if (!squad) return;
    squad.command = command;
  }
  
  setFormation(squadId: string, formation: TWFormation): void {
    const squad = this.state.squads.get(squadId);
    if (!squad) return;
    
    squad.formation = formation;
    const config = FORMATION_CONFIG[formation];
    squad.spacing = 1.0 * config.spacingMultiplier; // 더 밀집된 진형
    
    // 진형 크기 재계산
    const totalSoldiers = squad.aliveSoldiers;
    const ratio = config.widthToDepthRatio;
    squad.width = Math.ceil(Math.sqrt(totalSoldiers * ratio));
    squad.depth = Math.ceil(totalSoldiers / squad.width);
    
    // 병사 위치 재배치
    let index = 0;
    squad.soldiers.forEach(soldier => {
      if (soldier.state === 'dead') return;
      const row = Math.floor(index / squad.width);
      const col = index % squad.width;
      soldier.formationSlot = { row, col };
      soldier.formationOffset = this.calculateFormationOffset(squad, row, col);
      soldier.targetPosition = this.localToWorld(soldier.formationOffset, squad.position, squad.facing);
      index++;
    });
  }
  
  setStance(squadId: string, stance: TWStance): void {
    const squad = this.state.squads.get(squadId);
    if (!squad) return;
    squad.stance = stance;
  }
  
  rotateSquad(squadId: string, facing: number): void {
    const squad = this.state.squads.get(squadId);
    if (!squad) return;
    
    squad.facing = facing;
    squad.targetFacing = facing;
    
    // 병사 목표 위치 업데이트
    squad.soldiers.forEach(soldier => {
      if (soldier.state === 'dead') return;
      soldier.targetPosition = this.localToWorld(soldier.formationOffset, squad.position, facing);
    });
  }
  
  getState(): TWBattleState {
    return this.state;
  }
  
  getSquad(id: string): TWSquad | undefined {
    return this.state.squads.get(id);
  }
  
  getSoldier(id: string): TWSoldier | undefined {
    return this.state.soldiers.get(id);
  }
  
  getAllSquads(): TWSquad[] {
    return Array.from(this.state.squads.values());
  }
  
  getAllSoldiers(): TWSoldier[] {
    return Array.from(this.state.soldiers.values());
  }
  
  // ========================================
  // 성능 측정 API
  // ========================================
  
  /**
   * 현재 성능 메트릭 조회
   * 디버그/모니터링용
   */
  getPerformanceMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }
  
  /**
   * 상세 성능 리포트 생성
   */
  getPerformanceReport(): string {
    const m = this.metrics;
    return `
╔══════════════════════════════════════════════════════════════╗
║                    TotalWarEngine 성능 리포트                  ║
╠══════════════════════════════════════════════════════════════╣
║ FPS: ${m.fps.toFixed(1)} (avg: ${m.avgFps.toFixed(1)})
║ Frame Time: ${m.frameTime.toFixed(2)}ms
║   - AI: ${m.aiTime.toFixed(2)}ms
║   - Collision: ${m.collisionTime.toFixed(2)}ms
║   - Quadtree Rebuild: ${m.quadtreeRebuildTime.toFixed(2)}ms
╠══════════════════════════════════════════════════════════════╣
║ Soldiers: ${m.activeSoldierCount}/${m.soldierCount} active
║ Quadtree Queries: ${m.quadtreeStats.queryCount}
║ Quadtree Inserts: ${m.quadtreeStats.insertCount}
╠══════════════════════════════════════════════════════════════╣
║ Soldier Pool: ${m.poolStats.soldiers.active} active, ${m.poolStats.soldiers.poolSize} pooled
║ Recycle Rate: ${(m.poolStats.soldiers.recycleRate * 100).toFixed(1)}%
╚══════════════════════════════════════════════════════════════╝
    `.trim();
  }
  
  /**
   * 풀 통계 조회
   */
  getPoolStats(): {
    soldiers: ReturnType<SoldierPool['getStats']>;
    projectiles: { active: number };
  } {
    return {
      soldiers: this.soldierPool.getStats(),
      projectiles: { active: this.state.projectiles.length },
    };
  }
  
  /**
   * 풀 사전 확장 (대규모 전투 전)
   * @param soldierCount 예상 병사 수
   */
  prewarmPools(soldierCount: number): void {
    this.soldierPool.prewarm(soldierCount);
    this.projectilePool.prewarm(Math.ceil(soldierCount * 0.3)); // 30% 원거리 추정
  }
  
  /**
   * 전투 리셋 (풀 유지)
   */
  reset(): void {
    // 모든 병사 풀에 반환
    this.state.soldiers.forEach(soldier => {
      this.soldierPool.release(soldier);
    });
    
    // 모든 투사체 풀에 반환
    this.state.projectiles.forEach(proj => {
      this.projectilePool.release(proj);
    });
    
    // 상태 초기화
    this.state.squads.clear();
    this.state.soldiers.clear();
    this.state.projectiles = [];
    this.state.battleLines = [];
    this.state.events = [];
    this.state.currentTime = 0;
    this.state.deltaTime = 0;
    this.state.isActive = false;
    this.state.winner = undefined;
    
    // Quadtree 초기화
    this.quadtree.clear();
    
    // 프레임 카운터 초기화
    this.frameCounter = 0;
    this.fpsHistory = [];
  }
  
  /**
   * 월드 크기 설정 (전장 크기 변경 시)
   */
  setWorldSize(size: number): void {
    this.WORLD_SIZE = size;
    this.quadtree = new Quadtree({
      x: 0,
      z: 0,
      halfWidth: size / 2,
      halfHeight: size / 2,
    }, 8);
  }
  
  /**
   * 죽은 병사 정리 주기 설정
   */
  setCleanupInterval(frames: number): void {
    this.deadSoldierCleanupInterval = frames;
  }
  
  // ========================================
  // 전술 AI API
  // ========================================
  
  /**
   * 전술 AI 사용 여부 설정
   */
  setUseTacticsAI(enabled: boolean): void {
    this.useTacticsAI = enabled;
  }
  
  /**
   * 전술 AI 사용 여부 조회
   */
  isUsingTacticsAI(): boolean {
    return this.useTacticsAI;
  }
  
  /**
   * 전술 AI 업데이트 주기 설정
   */
  setTacticsUpdateInterval(frames: number): void {
    this.tacticsUpdateInterval = Math.max(1, frames);
  }
  
  /**
   * 특정 부대의 현재 전술 결정 조회
   */
  getSquadTactic(squadId: string): TacticAction | null {
    if (!this.useTacticsAI) return null;
    return this.tacticsAI.decideTactic(squadId);
  }
  
  /**
   * 특정 부대의 전술 상황 요약 조회
   */
  getTacticalSummary(squadId: string): string {
    if (!this.useTacticsAI) return '전술 AI 비활성화';
    return this.tacticsAI.getTacticalSummary(squadId);
  }
  
  /**
   * 협동 공격 계획 수립
   */
  planCoordinatedAttack(targetSquadId: string): ReturnType<SquadTacticsAI['planCoordinatedAttack']> {
    if (!this.useTacticsAI) return null;
    return this.tacticsAI.planCoordinatedAttack(targetSquadId);
  }
  
  /**
   * 협동 공격 실행
   */
  executeCoordinatedAttack(targetSquadId: string): boolean {
    if (!this.useTacticsAI) return false;
    
    const plan = this.tacticsAI.planCoordinatedAttack(targetSquadId);
    if (!plan || plan.successProbability < 40) return false;
    
    // 협동 공격 등록
    this.tacticsAI.registerCoordinatedAttack(plan);
    return true;
  }
  
  /**
   * 전술 AI 인스턴스 직접 접근 (고급 사용)
   */
  getTacticsAI(): SquadTacticsAI {
    return this.tacticsAI;
  }
  
  // ========================================
  // 벤치마크 유틸리티
  // ========================================
  
  /**
   * 벤치마크: 특정 병사 수로 성능 테스트
   * @param soldierCount 테스트 병사 수
   * @param frames 테스트 프레임 수
   */
  runBenchmark(soldierCount: number, frames: number = 100): {
    avgFrameTime: number;
    minFps: number;
    maxFps: number;
    avgFps: number;
    collisionTimeAvg: number;
    aiTimeAvg: number;
  } {
    // 테스트 부대 생성
    const halfCount = Math.floor(soldierCount / 2);
    
    this.createSquad({
      teamId: 'attacker',
      name: 'Test Attacker',
      unitTypeId: 1,
      category: 'sword_infantry',
      position: { x: -20, z: 0 },
      facing: 0,
      soldierCount: halfCount,
    });
    
    this.createSquad({
      teamId: 'defender',
      name: 'Test Defender',
      unitTypeId: 2,
      category: 'sword_infantry',
      position: { x: 20, z: 0 },
      facing: Math.PI,
      soldierCount: halfCount,
    });
    
    this.startBattle();
    
    // 벤치마크 실행
    const frameTimes: number[] = [];
    const collisionTimes: number[] = [];
    const aiTimes: number[] = [];
    
    for (let i = 0; i < frames; i++) {
      const start = performance.now();
      this.update(16.67); // 60fps 기준
      frameTimes.push(performance.now() - start);
      collisionTimes.push(this.metrics.collisionTime);
      aiTimes.push(this.metrics.aiTime);
    }
    
    // 결과 계산
    const avgFrameTime = frameTimes.reduce((a, b) => a + b, 0) / frames;
    const fpsList = frameTimes.map(t => 1000 / t);
    
    // 리셋
    this.reset();
    
    return {
      avgFrameTime,
      minFps: Math.min(...fpsList),
      maxFps: Math.max(...fpsList),
      avgFps: fpsList.reduce((a, b) => a + b, 0) / frames,
      collisionTimeAvg: collisionTimes.reduce((a, b) => a + b, 0) / frames,
      aiTimeAvg: aiTimes.reduce((a, b) => a + b, 0) / frames,
    };
  }
}

