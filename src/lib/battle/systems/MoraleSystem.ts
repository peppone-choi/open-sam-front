/**
 * MoraleSystem.ts
 * 토탈워 스타일 사기(Morale) 및 피로도(Fatigue) 시스템
 * 
 * 핵심 기능:
 * 1. 사기 증감 로직 (긍정적/부정적 이벤트)
 * 2. 탈주(Routing) 시스템
 * 3. 재집결(Rally) 시스템
 * 4. 피로도 관리 및 회복 메커니즘
 */

import {
  TWSoldier,
  TWSquad,
  Vector2,
  MORALE_THRESHOLDS,
  RALLY_CONFIG,
} from '../TotalWarEngine';

// ========================================
// 사기 변동 상수
// ========================================

/**
 * 사기 변동 테이블
 * 긍정적/부정적/회복 이벤트별 사기 변화량
 */
export const MORALE_CHANGES = {
  // ========== 긍정적 이벤트 ==========
  /** 적 처치 */
  enemyKilled: 2,
  /** 장수 버프 (한 번) */
  generalBuff: 15,
  /** 측면 공격 성공 */
  flankSuccess: 10,
  /** 수적 우세 (초당) - 아군이 적보다 많을 때 */
  numericalAdvantage: 0.5,
  /** 승리 직전 (적 사기 붕괴) */
  victoryNear: 20,
  /** 적 부대 패주 목격 */
  enemyRout: 8,
  /** 적 장수 처치 */
  enemyGeneralKilled: 25,
  /** 돌격 성공 (적 전열 돌파) */
  chargeSuccess: 12,
  /** 진형 유지 중 (방어 성공) */
  holdingLine: 3,
  
  // ========== 부정적 이벤트 ==========
  /** 근처 아군 사망 (5m 이내, 1인당) */
  allyDeath: -3,
  /** 측면 공격 당함 */
  flanked: -5,
  /** 후방 공격 당함 */
  rearAttacked: -10,
  /** 아군 장수 사망 */
  generalDeath: -30,
  /** 포위됨 (초당) */
  surrounded: -8,
  /** 수적 열세 (초당) */
  numericalDisadvantage: -0.3,
  /** 아군 부대 패주 목격 */
  allyRout: -12,
  /** 중상 (HP 30% 이하) */
  heavyWounded: -5,
  /** 지속적 피해 (화살 등) */
  underFire: -2,
  /** 돌격 실패 (창병에 막힘) */
  chargeFailed: -8,
  /** 피로 누적 (피로도 80% 이상) */
  exhausted: -4,
  
  // ========== 회복 ==========
  /** 대기 중 (초당) */
  idle: 0.1,
  /** 진형 재정비 중 (초당) */
  reforming: 0.3,
  /** 장수와 함께 재집결 (초당) */
  rallyingWithGeneral: 1.0,
  /** 장수 없이 재집결 (초당) */
  rallyingWithoutGeneral: 0.5,
  /** 전투 소강 상태 (초당) */
  combatLull: 0.2,
  /** 승리 확정 후 */
  victoryConfirmed: 30,
} as const;

/**
 * 사기 임계값 (확장)
 */
export const MORALE_THRESHOLDS_EXTENDED = {
  ...MORALE_THRESHOLDS,
  /** 동요 시작 */
  wavering: 40,
  /** 탈주 시작 */
  routing: 20,
  /** 완전 붕괴 (패주, 재집결 불가) */
  shattered: 5,
  /** 재집결 시 복귀 사기 */
  rallyMorale: 30,
  /** 고사기 (용맹) */
  inspired: 80,
  /** 최고 사기 (무적) */
  unbreakable: 95,
} as const;

/**
 * 재집결 설정 (확장)
 */
export const RALLY_CONFIG_EXTENDED = {
  ...RALLY_CONFIG,
  /** 적과의 최소 안전 거리 */
  safeDistance: 50,
  /** 재집결에 필요한 시간 (ms) */
  rallyTime: 5000,
  /** 재집결 반경 */
  rallyRadius: 8,
  /** 재집결에 필요한 최소 병사 수 */
  minSoldiersToRally: 3,
  /** 장수 있을 때 재집결 시간 감소 */
  generalRallyTimeMultiplier: 0.6,
  /** 재집결 실패 시 패주 확정 대기 시간 (ms) */
  rallyFailTimeout: 10000,
  /** 재집결 성공 후 사기 */
  postRallyMorale: 35,
} as const;

/**
 * 피로도 설정
 */
export const FATIGUE_CONFIG = {
  /** 최대 피로도 */
  maxFatigue: 100,
  /** 이동 중 피로 증가율 (초당) */
  movingFatigueRate: 0.5,
  /** 전투 중 피로 증가율 (초당) */
  combatFatigueRate: 1.0,
  /** 돌격 중 피로 증가율 (초당) */
  chargeFatigueRate: 1.5,
  /** 대기 시 피로 회복율 (초당) */
  idleRecoveryRate: 0.3,
  /** 진형 재정비 시 피로 회복율 (초당) */
  reformingRecoveryRate: 0.5,
  /** 피로도에 따른 전투력 감소 (피로도 1%당 감소율) */
  combatPenaltyPerFatigue: 0.005,
  /** 피로도에 따른 속도 감소 (피로도 1%당 감소율) */
  speedPenaltyPerFatigue: 0.003,
  /** 피로 경고 임계값 */
  tiredThreshold: 50,
  /** 피로 위험 임계값 */
  exhaustedThreshold: 80,
} as const;

// ========================================
// 타입 정의
// ========================================

/** 사기 이벤트 유형 */
export type MoraleEventType = keyof typeof MORALE_CHANGES;

/** 사기 이벤트 */
export interface MoraleEvent {
  type: MoraleEventType;
  value: number;
  timestamp: number;
  sourceId?: string;
  targetId: string;
  description: string;
}

/** 병사 사기 상태 */
export type MoraleState = 
  | 'unbreakable'   // 무적 (95+)
  | 'inspired'      // 용맹 (80+)
  | 'steady'        // 안정 (40+)
  | 'wavering'      // 동요 (20~40)
  | 'routing'       // 탈주 중 (5~20)
  | 'shattered';    // 완전 붕괴 (<5)

/** 부대 사기 상태 */
export interface SquadMoraleStatus {
  averageMorale: number;
  state: MoraleState;
  waveringSoldiers: number;
  routingSoldiers: number;
  steadySoldiers: number;
  canRally: boolean;
  rallyProgress: number;
}

/** 재집결 상태 */
export interface RallyState {
  isRallying: boolean;
  startTime: number;
  rallyPoint: Vector2;
  soldiersRallied: number;
  requiredSoldiers: number;
  hasGeneral: boolean;
  progress: number;
  canSucceed: boolean;
}

/** 피로도 상태 */
export type FatigueState = 
  | 'fresh'       // 신선 (<30)
  | 'normal'      // 보통 (30~50)
  | 'tired'       // 피로 (50~80)
  | 'exhausted';  // 탈진 (80+)

/** 부대 피로도 상태 */
export interface SquadFatigueStatus {
  averageFatigue: number;
  state: FatigueState;
  combatEfficiency: number;
  speedEfficiency: number;
}

/** 사기 컨텍스트 (계산에 필요한 정보) */
export interface MoraleContext {
  soldier: TWSoldier;
  squad: TWSquad;
  currentTime: number;
  deltaTime: number;
  
  // 주변 상황
  nearbyAllies: TWSoldier[];
  nearbyEnemies: TWSoldier[];
  nearbyDeadAllies: number;
  
  // 전투 상황
  isEngaged: boolean;
  isFlanked: boolean;
  isRearAttacked: boolean;
  isSurrounded: boolean;
  isUnderFire: boolean;
  
  // 부대 상황
  squadNumericalAdvantage: number; // 양수면 우세, 음수면 열세
  enemyRouting: boolean;
  allyRouting: boolean;
  generalAlive: boolean;
  generalNearby: boolean;
}

// ========================================
// 사기 시스템 유틸리티 함수
// ========================================

/**
 * 사기 상태 판정
 */
export function getMoraleState(morale: number): MoraleState {
  if (morale >= MORALE_THRESHOLDS_EXTENDED.unbreakable) return 'unbreakable';
  if (morale >= MORALE_THRESHOLDS_EXTENDED.inspired) return 'inspired';
  if (morale >= MORALE_THRESHOLDS_EXTENDED.wavering) return 'steady';
  if (morale >= MORALE_THRESHOLDS_EXTENDED.routing) return 'wavering';
  if (morale >= MORALE_THRESHOLDS_EXTENDED.shattered) return 'routing';
  return 'shattered';
}

/**
 * 피로도 상태 판정
 */
export function getFatigueState(fatigue: number): FatigueState {
  if (fatigue < 30) return 'fresh';
  if (fatigue < FATIGUE_CONFIG.tiredThreshold) return 'normal';
  if (fatigue < FATIGUE_CONFIG.exhaustedThreshold) return 'tired';
  return 'exhausted';
}

/**
 * 두 점 사이 거리 계산
 */
function getDistance(a: Vector2, b: Vector2): number {
  const dx = b.x - a.x;
  const dz = b.z - a.z;
  return Math.sqrt(dx * dx + dz * dz);
}

/**
 * 수적 우세/열세 계산
 */
function calculateNumericalAdvantage(allyCount: number, enemyCount: number): number {
  if (enemyCount === 0) return 1;
  if (allyCount === 0) return -1;
  return (allyCount - enemyCount) / Math.max(allyCount, enemyCount);
}

// ========================================
// 사기 매니저 클래스
// ========================================

export class MoraleManager {
  private events: MoraleEvent[] = [];
  private rallyStates: Map<string, RallyState> = new Map();
  
  constructor() {}
  
  // ========================================
  // 메인 업데이트
  // ========================================
  
  /**
   * 병사 사기 업데이트
   * @param ctx 사기 컨텍스트
   * @returns 사기 변화량
   */
  updateSoldierMorale(ctx: MoraleContext): number {
    const { soldier, deltaTime } = ctx;
    const deltaSeconds = deltaTime / 1000;
    
    let moraleChange = 0;
    
    // 상태별 처리
    const currentState = getMoraleState(soldier.morale);
    
    switch (currentState) {
      case 'shattered':
        // 완전 붕괴 - 회복 불가, 계속 도주
        return 0;
        
      case 'routing':
        // 탈주 중 - 재집결 시도 가능
        moraleChange = this.handleRoutingMorale(ctx, deltaSeconds);
        break;
        
      case 'wavering':
        // 동요 - 탈주 위험
        moraleChange = this.handleWaveringMorale(ctx, deltaSeconds);
        break;
        
      default:
        // 안정 이상 - 일반 사기 계산
        moraleChange = this.calculateMoraleChange(ctx, deltaSeconds);
    }
    
    // 사기 범위 제한 (0~100)
    const newMorale = Math.max(0, Math.min(100, soldier.morale + moraleChange));
    const actualChange = newMorale - soldier.morale;
    
    return actualChange;
  }
  
  /**
   * 부대 사기 상태 계산
   */
  getSquadMoraleStatus(squad: TWSquad): SquadMoraleStatus {
    const aliveSoldiers = squad.soldiers.filter(s => s.state !== 'dead');
    
    if (aliveSoldiers.length === 0) {
      return {
        averageMorale: 0,
        state: 'shattered',
        waveringSoldiers: 0,
        routingSoldiers: 0,
        steadySoldiers: 0,
        canRally: false,
        rallyProgress: 0,
      };
    }
    
    const totalMorale = aliveSoldiers.reduce((sum, s) => sum + s.morale, 0);
    const averageMorale = totalMorale / aliveSoldiers.length;
    
    const waveringSoldiers = aliveSoldiers.filter(
      s => getMoraleState(s.morale) === 'wavering'
    ).length;
    
    const routingSoldiers = aliveSoldiers.filter(
      s => getMoraleState(s.morale) === 'routing' || getMoraleState(s.morale) === 'shattered'
    ).length;
    
    const steadySoldiers = aliveSoldiers.length - waveringSoldiers - routingSoldiers;
    
    // 재집결 가능 여부
    const rallyState = this.rallyStates.get(squad.id);
    const canRally = this.canSquadRally(squad);
    
    return {
      averageMorale,
      state: getMoraleState(averageMorale),
      waveringSoldiers,
      routingSoldiers,
      steadySoldiers,
      canRally,
      rallyProgress: rallyState?.progress ?? 0,
    };
  }
  
  // ========================================
  // 사기 변동 계산
  // ========================================
  
  /**
   * 일반 사기 변화 계산 (안정 상태 이상)
   */
  private calculateMoraleChange(ctx: MoraleContext, deltaSeconds: number): number {
    let change = 0;
    
    // === 긍정적 요인 ===
    
    // 수적 우세
    if (ctx.squadNumericalAdvantage > 0.1) {
      change += MORALE_CHANGES.numericalAdvantage * deltaSeconds * ctx.squadNumericalAdvantage;
    }
    
    // 적 패주 목격
    if (ctx.enemyRouting) {
      change += MORALE_CHANGES.enemyRout * deltaSeconds * 0.1; // 지속 효과
    }
    
    // 장수 근처
    if (ctx.generalNearby && ctx.generalAlive) {
      change += 0.2 * deltaSeconds; // 장수 버프 지속 효과
    }
    
    // === 부정적 요인 ===
    
    // 수적 열세
    if (ctx.squadNumericalAdvantage < -0.1) {
      change += MORALE_CHANGES.numericalDisadvantage * deltaSeconds * Math.abs(ctx.squadNumericalAdvantage);
    }
    
    // 포위됨
    if (ctx.isSurrounded) {
      change += MORALE_CHANGES.surrounded * deltaSeconds;
    }
    
    // 측면 공격 당함 (지속)
    if (ctx.isFlanked && ctx.isEngaged) {
      change += MORALE_CHANGES.flanked * deltaSeconds * 0.2;
    }
    
    // 후방 공격 당함 (지속)
    if (ctx.isRearAttacked && ctx.isEngaged) {
      change += MORALE_CHANGES.rearAttacked * deltaSeconds * 0.2;
    }
    
    // 아군 패주 목격
    if (ctx.allyRouting) {
      change += MORALE_CHANGES.allyRout * deltaSeconds * 0.05;
    }
    
    // 화살 세례
    if (ctx.isUnderFire) {
      change += MORALE_CHANGES.underFire * deltaSeconds;
    }
    
    // 주변 아군 사망
    if (ctx.nearbyDeadAllies > 0) {
      // 이미 한 번 적용된 사망은 제외해야 하지만, 단순화를 위해 지속 효과로 처리
      change += MORALE_CHANGES.allyDeath * ctx.nearbyDeadAllies * deltaSeconds * 0.1;
    }
    
    // 중상
    const hpRatio = ctx.soldier.hp / ctx.soldier.maxHp;
    if (hpRatio < 0.3) {
      change += MORALE_CHANGES.heavyWounded * deltaSeconds * 0.1;
    }
    
    // 피로 누적
    if (ctx.soldier.fatigue >= FATIGUE_CONFIG.exhaustedThreshold) {
      change += MORALE_CHANGES.exhausted * deltaSeconds * 0.1;
    }
    
    // === 회복 ===
    
    // 대기 중
    if (!ctx.isEngaged && ctx.nearbyEnemies.length === 0) {
      change += MORALE_CHANGES.idle * deltaSeconds;
      
      // 진형 재정비 중
      if (ctx.squad.state === 'reforming') {
        change += MORALE_CHANGES.reforming * deltaSeconds;
      }
    }
    
    // 전투 소강 상태
    if (!ctx.isEngaged && ctx.nearbyEnemies.length > 0) {
      change += MORALE_CHANGES.combatLull * deltaSeconds;
    }
    
    return change;
  }
  
  /**
   * 동요 상태 사기 처리
   */
  private handleWaveringMorale(ctx: MoraleContext, deltaSeconds: number): number {
    let change = 0;
    
    // 부정적 요인은 더 크게 적용
    if (ctx.isSurrounded) {
      change += MORALE_CHANGES.surrounded * deltaSeconds * 1.5;
    }
    
    if (ctx.squadNumericalAdvantage < -0.2) {
      change += MORALE_CHANGES.numericalDisadvantage * deltaSeconds * 2;
    }
    
    // 긍정적 요인 (회복)
    if (ctx.generalNearby && ctx.generalAlive) {
      change += MORALE_CHANGES.rallyingWithGeneral * deltaSeconds * 0.5;
    }
    
    if (ctx.squadNumericalAdvantage > 0.2) {
      change += MORALE_CHANGES.numericalAdvantage * deltaSeconds * 2;
    }
    
    if (!ctx.isEngaged) {
      change += MORALE_CHANGES.idle * deltaSeconds;
    }
    
    return change;
  }
  
  /**
   * 탈주 상태 사기 처리 (재집결 시도)
   */
  private handleRoutingMorale(ctx: MoraleContext, deltaSeconds: number): number {
    const { soldier, squad, currentTime } = ctx;
    
    // 완전 붕괴면 회복 불가
    if (soldier.morale < MORALE_THRESHOLDS_EXTENDED.shattered) {
      return 0;
    }
    
    // 재집결 조건 체크
    if (!this.canSoldierRally(soldier, squad, ctx)) {
      return -0.1 * deltaSeconds; // 계속 감소
    }
    
    // 재집결 중
    let recoveryRate = ctx.generalNearby && ctx.generalAlive
      ? MORALE_CHANGES.rallyingWithGeneral
      : MORALE_CHANGES.rallyingWithoutGeneral;
    
    return recoveryRate * deltaSeconds;
  }
  
  // ========================================
  // 탈주/재집결 시스템
  // ========================================
  
  /**
   * 부대 탈주 시작
   */
  startSquadRouting(squad: TWSquad, currentTime: number): void {
    if (squad.state === 'routing' || squad.state === 'routed') return;
    
    squad.state = 'routing';
    squad.hasRouted = true; // 한 번이라도 패주하면 표시
    
    // 모든 병사 탈주 상태로
    squad.soldiers.forEach(soldier => {
      if (soldier.state !== 'dead') {
        soldier.state = 'routing';
        soldier.engagedWith = undefined;
      }
    });
    
    this.addEvent({
      type: 'allyRout',
      value: MORALE_CHANGES.allyRout,
      timestamp: currentTime,
      targetId: squad.id,
      description: `${squad.name} 부대 패주 시작`,
    });
  }
  
  /**
   * 부대 재집결 시작
   */
  startSquadRally(squad: TWSquad, rallyPoint: Vector2, hasGeneral: boolean, currentTime: number): boolean {
    if (!this.canSquadRally(squad)) {
      return false;
    }
    
    const aliveSoldiers = squad.soldiers.filter(s => s.state !== 'dead').length;
    
    const rallyState: RallyState = {
      isRallying: true,
      startTime: currentTime,
      rallyPoint,
      soldiersRallied: 0,
      requiredSoldiers: Math.max(RALLY_CONFIG_EXTENDED.minSoldiersToRally, Math.floor(aliveSoldiers * 0.3)),
      hasGeneral,
      progress: 0,
      canSucceed: true,
    };
    
    this.rallyStates.set(squad.id, rallyState);
    squad.state = 'rallying';
    squad.rallyPoint = rallyPoint;
    squad.rallyStartTime = currentTime;
    
    return true;
  }
  
  /**
   * 재집결 진행 업데이트
   */
  updateRally(squad: TWSquad, currentTime: number, nearestEnemyDistance: number): boolean {
    const rallyState = this.rallyStates.get(squad.id);
    if (!rallyState || !rallyState.isRallying) return false;
    
    // 적이 너무 가까우면 실패
    if (nearestEnemyDistance < RALLY_CONFIG_EXTENDED.safeDistance) {
      rallyState.canSucceed = false;
      return false;
    }
    
    // 재집결 지점 근처 병사 카운트
    const soldiersNearRallyPoint = squad.soldiers.filter(soldier => {
      if (soldier.state === 'dead') return false;
      return getDistance(soldier.position, rallyState.rallyPoint) < RALLY_CONFIG_EXTENDED.rallyRadius;
    }).length;
    
    rallyState.soldiersRallied = soldiersNearRallyPoint;
    
    // 진행률 계산
    const rallyTime = rallyState.hasGeneral
      ? RALLY_CONFIG_EXTENDED.rallyTime * RALLY_CONFIG_EXTENDED.generalRallyTimeMultiplier
      : RALLY_CONFIG_EXTENDED.rallyTime;
    
    const elapsedTime = currentTime - rallyState.startTime;
    const timeProgress = Math.min(1, elapsedTime / rallyTime);
    const soldierProgress = Math.min(1, soldiersNearRallyPoint / rallyState.requiredSoldiers);
    
    // 두 조건 모두 충족해야 완료
    rallyState.progress = Math.min(timeProgress, soldierProgress);
    
    // 재집결 성공
    if (timeProgress >= 1 && soldierProgress >= 1) {
      this.completeRally(squad, currentTime);
      return true;
    }
    
    // 타임아웃 체크
    if (elapsedTime > RALLY_CONFIG_EXTENDED.rallyFailTimeout) {
      this.failRally(squad, currentTime);
      return false;
    }
    
    return true;
  }
  
  /**
   * 재집결 성공
   */
  private completeRally(squad: TWSquad, currentTime: number): void {
    const rallyState = this.rallyStates.get(squad.id);
    if (!rallyState) return;
    
    squad.state = 'reforming';
    squad.hasRouted = false; // 성공적으로 재집결하면 패주 플래그 해제
    
    // 병사들 사기 회복
    squad.soldiers.forEach(soldier => {
      if (soldier.state !== 'dead') {
        soldier.state = 'idle';
        soldier.morale = Math.max(soldier.morale, RALLY_CONFIG_EXTENDED.postRallyMorale);
      }
    });
    
    this.rallyStates.delete(squad.id);
    
    this.addEvent({
      type: 'generalBuff',
      value: MORALE_CHANGES.generalBuff,
      timestamp: currentTime,
      targetId: squad.id,
      description: `${squad.name} 부대 재집결 성공`,
    });
  }
  
  /**
   * 재집결 실패
   */
  private failRally(squad: TWSquad, currentTime: number): void {
    squad.state = 'routed';
    
    // 완전 패주 - 전장 이탈
    squad.soldiers.forEach(soldier => {
      if (soldier.state !== 'dead') {
        soldier.morale = 0;
        soldier.state = 'routing';
      }
    });
    
    this.rallyStates.delete(squad.id);
    
    this.addEvent({
      type: 'allyRout',
      value: MORALE_CHANGES.allyRout,
      timestamp: currentTime,
      targetId: squad.id,
      description: `${squad.name} 부대 재집결 실패, 완전 패주`,
    });
  }
  
  /**
   * 부대 재집결 가능 여부
   */
  canSquadRally(squad: TWSquad): boolean {
    // 이미 완전 패주했으면 불가
    if (squad.state === 'routed') return false;
    
    // 전멸했으면 불가
    const aliveSoldiers = squad.soldiers.filter(s => s.state !== 'dead');
    if (aliveSoldiers.length < RALLY_CONFIG_EXTENDED.minSoldiersToRally) return false;
    
    // 완전 붕괴 병사 비율 체크 (50% 이상이면 불가)
    const shatteredCount = aliveSoldiers.filter(
      s => s.morale < MORALE_THRESHOLDS_EXTENDED.shattered
    ).length;
    
    if (shatteredCount > aliveSoldiers.length * 0.5) return false;
    
    return true;
  }
  
  /**
   * 병사 재집결 가능 여부
   */
  private canSoldierRally(soldier: TWSoldier, squad: TWSquad, ctx: MoraleContext): boolean {
    // 완전 붕괴면 불가
    if (soldier.morale < MORALE_THRESHOLDS_EXTENDED.shattered) return false;
    
    // 적과 안전 거리 확보
    if (ctx.nearbyEnemies.length > 0) {
      const nearestEnemy = ctx.nearbyEnemies[0];
      const distance = getDistance(soldier.position, nearestEnemy.position);
      if (distance < RALLY_CONFIG_EXTENDED.safeDistance) return false;
    }
    
    // 부대가 재집결 가능 상태
    return this.canSquadRally(squad);
  }
  
  // ========================================
  // 피로도 시스템
  // ========================================
  
  /**
   * 병사 피로도 업데이트
   */
  updateSoldierFatigue(soldier: TWSoldier, deltaTime: number, isMoving: boolean, isEngaged: boolean, isCharging: boolean): number {
    const deltaSeconds = deltaTime / 1000;
    let fatigueChange = 0;
    
    if (isCharging) {
      fatigueChange = FATIGUE_CONFIG.chargeFatigueRate * deltaSeconds;
    } else if (isEngaged) {
      fatigueChange = FATIGUE_CONFIG.combatFatigueRate * deltaSeconds;
    } else if (isMoving) {
      fatigueChange = FATIGUE_CONFIG.movingFatigueRate * deltaSeconds;
    } else {
      // 대기 시 회복
      fatigueChange = -FATIGUE_CONFIG.idleRecoveryRate * deltaSeconds;
    }
    
    const newFatigue = Math.max(0, Math.min(FATIGUE_CONFIG.maxFatigue, soldier.fatigue + fatigueChange));
    return newFatigue - soldier.fatigue;
  }
  
  /**
   * 부대 피로도 상태 계산
   */
  getSquadFatigueStatus(squad: TWSquad): SquadFatigueStatus {
    const aliveSoldiers = squad.soldiers.filter(s => s.state !== 'dead');
    
    if (aliveSoldiers.length === 0) {
      return {
        averageFatigue: 0,
        state: 'fresh',
        combatEfficiency: 1,
        speedEfficiency: 1,
      };
    }
    
    const totalFatigue = aliveSoldiers.reduce((sum, s) => sum + s.fatigue, 0);
    const averageFatigue = totalFatigue / aliveSoldiers.length;
    
    const combatEfficiency = 1 - (averageFatigue * FATIGUE_CONFIG.combatPenaltyPerFatigue);
    const speedEfficiency = 1 - (averageFatigue * FATIGUE_CONFIG.speedPenaltyPerFatigue);
    
    return {
      averageFatigue,
      state: getFatigueState(averageFatigue),
      combatEfficiency: Math.max(0.3, combatEfficiency),
      speedEfficiency: Math.max(0.3, speedEfficiency),
    };
  }
  
  /**
   * 피로도에 따른 전투력 배율 계산
   */
  getFatigueCombatMultiplier(fatigue: number): number {
    return Math.max(0.3, 1 - (fatigue * FATIGUE_CONFIG.combatPenaltyPerFatigue));
  }
  
  /**
   * 피로도에 따른 속도 배율 계산
   */
  getFatigueSpeedMultiplier(fatigue: number): number {
    return Math.max(0.3, 1 - (fatigue * FATIGUE_CONFIG.speedPenaltyPerFatigue));
  }
  
  // ========================================
  // 즉시 사기 이벤트 적용
  // ========================================
  
  /**
   * 적 처치 이벤트
   */
  onEnemyKilled(killer: TWSoldier, currentTime: number): number {
    const change = MORALE_CHANGES.enemyKilled;
    this.addEvent({
      type: 'enemyKilled',
      value: change,
      timestamp: currentTime,
      sourceId: killer.id,
      targetId: killer.id,
      description: '적 처치',
    });
    return change;
  }
  
  /**
   * 아군 사망 이벤트 (근처 병사들에게 영향)
   */
  onAllyDeath(deadSoldier: TWSoldier, nearbySoldiers: TWSoldier[], currentTime: number): Map<string, number> {
    const changes = new Map<string, number>();
    
    nearbySoldiers.forEach(soldier => {
      const distance = getDistance(soldier.position, deadSoldier.position);
      if (distance < 5) { // 5m 이내
        changes.set(soldier.id, MORALE_CHANGES.allyDeath);
      }
    });
    
    if (changes.size > 0) {
      this.addEvent({
        type: 'allyDeath',
        value: MORALE_CHANGES.allyDeath,
        timestamp: currentTime,
        sourceId: deadSoldier.id,
        targetId: deadSoldier.squadId,
        description: `${deadSoldier.id} 사망으로 인한 사기 저하`,
      });
    }
    
    return changes;
  }
  
  /**
   * 장수 사망 이벤트
   */
  onGeneralDeath(squad: TWSquad, currentTime: number): number {
    const change = MORALE_CHANGES.generalDeath;
    
    // 부대 전체에 영향
    squad.soldiers.forEach(soldier => {
      if (soldier.state !== 'dead') {
        soldier.morale = Math.max(0, soldier.morale + change);
      }
    });
    
    this.addEvent({
      type: 'generalDeath',
      value: change,
      timestamp: currentTime,
      targetId: squad.id,
      description: `${squad.name} 부대 장수 전사`,
    });
    
    return change;
  }
  
  /**
   * 장수 버프 이벤트
   */
  onGeneralBuff(squad: TWSquad, currentTime: number): number {
    const change = MORALE_CHANGES.generalBuff;
    
    squad.soldiers.forEach(soldier => {
      if (soldier.state !== 'dead') {
        soldier.morale = Math.min(100, soldier.morale + change);
      }
    });
    
    this.addEvent({
      type: 'generalBuff',
      value: change,
      timestamp: currentTime,
      targetId: squad.id,
      description: `${squad.name} 부대 장수 고무`,
    });
    
    return change;
  }
  
  /**
   * 측면 공격 성공 이벤트
   */
  onFlankSuccess(attacker: TWSoldier, currentTime: number): number {
    const change = MORALE_CHANGES.flankSuccess;
    this.addEvent({
      type: 'flankSuccess',
      value: change,
      timestamp: currentTime,
      sourceId: attacker.id,
      targetId: attacker.squadId,
      description: '측면 공격 성공',
    });
    return change;
  }
  
  /**
   * 측면 공격 당함 이벤트
   */
  onFlanked(defender: TWSoldier, currentTime: number): number {
    const change = MORALE_CHANGES.flanked;
    this.addEvent({
      type: 'flanked',
      value: change,
      timestamp: currentTime,
      targetId: defender.id,
      description: '측면 공격 당함',
    });
    return change;
  }
  
  /**
   * 후방 공격 당함 이벤트
   */
  onRearAttacked(defender: TWSoldier, currentTime: number): number {
    const change = MORALE_CHANGES.rearAttacked;
    this.addEvent({
      type: 'rearAttacked',
      value: change,
      timestamp: currentTime,
      targetId: defender.id,
      description: '후방 공격 당함',
    });
    return change;
  }
  
  /**
   * 돌격 성공 이벤트
   */
  onChargeSuccess(charger: TWSoldier, currentTime: number): number {
    const change = MORALE_CHANGES.chargeSuccess;
    this.addEvent({
      type: 'chargeSuccess',
      value: change,
      timestamp: currentTime,
      sourceId: charger.id,
      targetId: charger.squadId,
      description: '돌격 성공',
    });
    return change;
  }
  
  /**
   * 돌격 실패 이벤트
   */
  onChargeFailed(charger: TWSoldier, currentTime: number): number {
    const change = MORALE_CHANGES.chargeFailed;
    this.addEvent({
      type: 'chargeFailed',
      value: change,
      timestamp: currentTime,
      sourceId: charger.id,
      targetId: charger.squadId,
      description: '돌격 실패 (창병에 막힘)',
    });
    return change;
  }
  
  /**
   * 승리 직전 이벤트
   */
  onVictoryNear(squad: TWSquad, currentTime: number): number {
    const change = MORALE_CHANGES.victoryNear;
    
    squad.soldiers.forEach(soldier => {
      if (soldier.state !== 'dead') {
        soldier.morale = Math.min(100, soldier.morale + change);
      }
    });
    
    this.addEvent({
      type: 'victoryNear',
      value: change,
      timestamp: currentTime,
      targetId: squad.id,
      description: '승리 직전!',
    });
    
    return change;
  }
  
  /**
   * 적 부대 패주 목격 이벤트
   */
  onEnemyRout(observingSquad: TWSquad, currentTime: number): number {
    const change = MORALE_CHANGES.enemyRout;
    
    observingSquad.soldiers.forEach(soldier => {
      if (soldier.state !== 'dead') {
        soldier.morale = Math.min(100, soldier.morale + change);
      }
    });
    
    this.addEvent({
      type: 'enemyRout',
      value: change,
      timestamp: currentTime,
      targetId: observingSquad.id,
      description: '적 패주 목격',
    });
    
    return change;
  }
  
  // ========================================
  // 이벤트 관리
  // ========================================
  
  /**
   * 이벤트 추가
   */
  private addEvent(event: MoraleEvent): void {
    this.events.push(event);
    
    // 최대 1000개 유지
    if (this.events.length > 1000) {
      this.events = this.events.slice(-500);
    }
  }
  
  /**
   * 최근 이벤트 조회
   */
  getRecentEvents(count: number = 10): MoraleEvent[] {
    return this.events.slice(-count);
  }
  
  /**
   * 특정 대상의 이벤트 조회
   */
  getEventsForTarget(targetId: string, count: number = 10): MoraleEvent[] {
    return this.events
      .filter(e => e.targetId === targetId)
      .slice(-count);
  }
  
  /**
   * 이벤트 초기화
   */
  clearEvents(): void {
    this.events = [];
  }
  
  /**
   * 재집결 상태 초기화
   */
  clearRallyStates(): void {
    this.rallyStates.clear();
  }
  
  /**
   * 전체 초기화
   */
  reset(): void {
    this.clearEvents();
    this.clearRallyStates();
  }
}

// ========================================
// 싱글톤 인스턴스
// ========================================

let moraleManagerInstance: MoraleManager | null = null;

/**
 * 사기 매니저 인스턴스 획득
 */
export function getMoraleManager(): MoraleManager {
  if (!moraleManagerInstance) {
    moraleManagerInstance = new MoraleManager();
  }
  return moraleManagerInstance;
}

/**
 * 사기 매니저 인스턴스 초기화
 */
export function resetMoraleManager(): void {
  if (moraleManagerInstance) {
    moraleManagerInstance.reset();
  }
  moraleManagerInstance = null;
}

// ========================================
// 내보내기
// ========================================

export default MoraleManager;

