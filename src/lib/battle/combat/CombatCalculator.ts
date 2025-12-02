/**
 * CombatCalculator.ts
 * 토탈워 스타일 전투 데미지 계산 시스템
 * 
 * 핵심 기능:
 * 1. 데미지 계산 (기본 피해 + 방어구 관통)
 * 2. 명중률/회피율 계산
 * 3. 크리티컬 시스템
 * 4. 버프/디버프 시스템
 * 5. 측면/후방 공격 보너스
 * 6. 유닛 상성 시스템
 */

import {
  TWSoldier,
  TWSquad,
  TWFormation,
  TWUnitCategory,
  FORMATION_CONFIG,
  CATEGORY_BASE_STATS,
  UNIT_COUNTER,
  UNIT_WEAKNESS,
  FLANKING_BONUS,
  CHARGE_BONUS_DURATION,
  COMBAT_TEMPO,
} from '../TotalWarEngine';

// ========================================
// 타입 정의
// ========================================

/** 전투 컨텍스트: 데미지 계산에 필요한 모든 정보 */
export interface CombatContext {
  // 공격자 정보
  attacker: TWSoldier;
  attackerSquad: TWSquad;
  
  // 방어자 정보
  defender: TWSoldier;
  defenderSquad: TWSquad;
  
  // 전투 상황
  currentTime: number;           // 현재 시간 (ms)
  attackAngle: number;           // 공격 각도 (라디안)
  isCharging: boolean;           // 돌격 중인가
  chargeStartTime?: number;      // 돌격 시작 시간
  distance: number;              // 공격자-방어자 거리
  
  // 버프/디버프
  attackerBuffs: Buff[];
  defenderBuffs: Buff[];
}

/** 데미지 결과 */
export interface DamageResult {
  damage: number;                // 최종 데미지
  rawDamage: number;             // 방어구 적용 전 데미지
  armorReduction: number;        // 방어구로 감소된 양
  isCritical: boolean;           // 크리티컬 여부
  criticalMultiplier: number;    // 크리티컬 배율
  damageType: DamageType;        // 피해 유형
  bonusDamage: BonusDamageBreakdown; // 보너스 피해 내역
  
  // 디버그/UI용 상세 내역
  breakdown: DamageBreakdown;
}

/** 피해 유형 */
export type DamageType = 
  | 'physical'      // 물리 (대부분)
  | 'piercing'      // 관통 (노병, 극병)
  | 'blunt'         // 타격 (메이스, 전차)
  | 'fire'          // 화염 (화계)
  | 'morale'        // 사기 피해 (책사)
  | 'siege';        // 공성 피해

/** 보너스 피해 내역 */
export interface BonusDamageBreakdown {
  counterBonus: number;          // 상성 보너스
  chargeBonus: number;           // 돌격 보너스
  flankBonus: number;            // 측면/후방 보너스
  formationBonus: number;        // 진형 보너스
  buffBonus: number;             // 버프 보너스
}

/** 피해 계산 상세 내역 (디버그/UI용) */
export interface DamageBreakdown {
  baseDamage: number;            // 기본 무기 피해
  apDamage: number;              // 방어구 관통 피해
  formationMult: number;         // 진형 배율
  chargeMult: number;            // 돌격 배율
  flankMult: number;             // 측면/후방 배율
  fatigueMult: number;           // 피로도 배율
  randomMult: number;            // 랜덤 배율
  critMult: number;              // 크리티컬 배율
  buffMult: number;              // 버프 배율
  tempoMult: number;             // 전투 템포 배율
}

/** 명중 결과 */
export interface HitResult {
  isHit: boolean;                // 명중 여부
  hitChance: number;             // 최종 명중 확률 (0~1)
  rollValue: number;             // 판정 굴림 값 (디버그용)
  
  // 명중률 내역
  breakdown: HitBreakdown;
}

/** 명중률 계산 내역 */
export interface HitBreakdown {
  baseHitChance: number;         // 기본 명중률
  attackValue: number;           // 공격 수치
  defenseValue: number;          // 방어 수치
  formationMod: number;          // 진형 보정
  fatigueMod: number;            // 피로도 보정
  chargeMod: number;             // 돌격 보정
  buffMod: number;               // 버프 보정
  distanceMod: number;           // 거리 보정 (원거리)
}

/** 크리티컬 결과 */
export interface CriticalResult {
  isCritical: boolean;           // 크리티컬 여부
  critChance: number;            // 크리티컬 확률
  critMultiplier: number;        // 크리티컬 배율
  critType: CriticalType;        // 크리티컬 유형
}

/** 크리티컬 유형 */
export type CriticalType = 
  | 'none'           // 미발동
  | 'normal'         // 일반 크리티컬 (x1.5)
  | 'devastating'    // 강력 크리티컬 (x2.0)
  | 'execution';     // 처형 (즉사, 사기 -20)

// ========================================
// 버프/디버프 시스템
// ========================================

/** 버프 유형 */
export type BuffType = 
  | 'attack_up'        // 공격력 상승
  | 'attack_down'      // 공격력 하락
  | 'defense_up'       // 방어력 상승
  | 'defense_down'     // 방어력 하락
  | 'damage_up'        // 피해량 상승
  | 'damage_down'      // 피해량 하락
  | 'crit_up'          // 크리티컬 확률 상승
  | 'crit_down'        // 크리티컬 확률 하락
  | 'speed_up'         // 속도 상승
  | 'speed_down'       // 속도 하락 (둔화)
  | 'morale_up'        // 사기 상승
  | 'morale_down'      // 사기 하락 (공포)
  | 'armor_up'         // 방어구 상승
  | 'armor_down'       // 방어구 하락 (쇄갑)
  | 'charge_up'        // 돌격 보너스 상승
  | 'charge_down'      // 돌격 보너스 하락
  | 'regen'            // HP 재생
  | 'dot'              // 지속 피해 (독, 화상)
  | 'stun'             // 기절
  | 'root'             // 이동 불가
  | 'invulnerable';    // 무적

/** 버프/디버프 */
export interface Buff {
  id: string;
  type: BuffType;
  value: number;              // 배율 (1.2 = +20%) 또는 절대값
  isPercent: boolean;         // true면 배율, false면 절대값
  duration: number;           // 지속 시간 (ms), -1이면 영구
  startTime: number;          // 시작 시간
  source: string;             // 버프 출처 (장수 ID, 스킬명 등)
  stackable: boolean;         // 중첩 가능 여부
  maxStacks: number;          // 최대 중첩
  currentStacks: number;      // 현재 중첩
  
  // 시각 효과
  icon?: string;
  name: string;
  description: string;
}

// ========================================
// 유틸리티 함수
// ========================================

/**
 * 두 점 사이 거리 계산
 */
export function getDistance(a: { x: number; z: number }, b: { x: number; z: number }): number {
  const dx = b.x - a.x;
  const dz = b.z - a.z;
  return Math.sqrt(dx * dx + dz * dz);
}

/**
 * 공격 각도 계산 (공격자 → 방어자)
 * @returns 방어자 정면 기준 각도 차이 (0 = 정면, π = 후방)
 */
export function calculateAttackAngle(attacker: TWSoldier, defender: TWSoldier): number {
  const attackDirection = Math.atan2(
    defender.position.x - attacker.position.x,
    defender.position.z - attacker.position.z
  );
  
  let angleDiff = Math.abs(attackDirection - defender.facing);
  if (angleDiff > Math.PI) {
    angleDiff = 2 * Math.PI - angleDiff;
  }
  
  return angleDiff;
}

// ========================================
// 메인 계산기 클래스
// ========================================

export class CombatCalculator {
  
  // ========================================
  // 데미지 계산
  // ========================================
  
  /**
   * 토탈워 스타일 데미지 계산
   * 
   * 공식:
   * 1. 기본 피해 = 무기 피해
   * 2. 방어구 관통 = AP 피해 (방어구 무시)
   * 3. 진형 배율 적용
   * 4. 돌격 보너스 적용 (시간 감소)
   * 5. 측면/후방 배율 적용
   * 6. 상성 보너스 적용
   * 7. 방어구 적용 (일반 피해만)
   * 8. 피로도 페널티 적용
   * 9. 크리티컬 적용
   * 10. 랜덤 변동 (±15%)
   * 11. 전투 템포 조절
   */
  static calculateDamage(ctx: CombatContext): DamageResult {
    // 1. 기본 무기 피해
    let baseDamage = ctx.attacker.weaponDamage;
    
    // 2. 방어구 관통 피해 (방어구 무시)
    let apDamage = ctx.attacker.armorPiercing;
    
    // 3. 진형 배율
    const formationConfig = FORMATION_CONFIG[ctx.attackerSquad.formation];
    const formationMult = formationConfig.meleeAttackBonus;
    
    // 4. 돌격 보너스 (시간에 따라 감소)
    const chargeResult = this.calculateChargeMultiplier(ctx);
    const chargeMult = chargeResult.multiplier;
    const chargeBonusDamage = chargeResult.bonusDamage;
    
    // 5. 측면/후방 배율
    const flankMult = this.getFlankingMultiplier(ctx.attackAngle);
    
    // 6. 상성 보너스 및 배율
    const counterBonus = this.calculateCounterBonus(
      ctx.attackerSquad.category,
      ctx.defenderSquad.category,
      ctx.attacker
    );
    const counterMult = this.getCounterMultiplier(
      ctx.attackerSquad.category,
      ctx.defenderSquad.category
    );
    
    // 7. 버프/디버프 배율
    const buffMult = this.calculateBuffMultiplier(ctx.attackerBuffs, 'damage_up', 'damage_down');
    const defenseDebuff = this.calculateBuffMultiplier(ctx.defenderBuffs, 'armor_down', 'armor_up');
    
    // 8. 방어구 적용 (일반 피해에만)
    const effectiveArmor = ctx.defender.armor * defenseDebuff;
    const armorReduction = effectiveArmor * 0.3; // 방어구의 30%만큼 감소
    const effectiveBaseDamage = Math.max(0, baseDamage - armorReduction);
    
    // 9. 피로도 페널티
    const fatigueMult = 1 - ctx.attacker.fatigue / 200;
    
    // 10. 크리티컬 계산
    const critResult = this.calculateCritical(ctx);
    const critMult = critResult.isCritical ? critResult.critMultiplier : 1;
    
    // 11. 랜덤 변동 (±15%)
    const randomMult = 0.85 + Math.random() * 0.3;
    
    // 12. 전투 템포 조절
    const tempoMult = COMBAT_TEMPO.damageMultiplier;
    
    // === 최종 계산 ===
    
    // 기본 피해 (방어구 적용된 일반 피해 + AP 피해 + 상성 보너스 + 돌격 보너스)
    let rawDamage = (effectiveBaseDamage + apDamage + counterBonus + chargeBonusDamage);
    
    // 배율 적용 (상성 배율 포함)
    let totalDamage = rawDamage * formationMult * chargeMult * flankMult * counterMult * fatigueMult * critMult * buffMult * randomMult * tempoMult;
    
    // 최소 피해 보장
    const finalDamage = Math.max(1, Math.round(totalDamage));
    
    // 결과 반환
    return {
      damage: finalDamage,
      rawDamage: Math.round(rawDamage),
      armorReduction: Math.round(armorReduction),
      isCritical: critResult.isCritical,
      criticalMultiplier: critMult,
      damageType: this.getDamageType(ctx.attackerSquad.category),
      bonusDamage: {
        counterBonus: Math.round(counterBonus),
        chargeBonus: Math.round(chargeBonusDamage),
        flankBonus: Math.round(rawDamage * (flankMult - 1)),
        formationBonus: Math.round(rawDamage * (formationMult - 1)),
        buffBonus: Math.round(rawDamage * (buffMult - 1)),
      },
      breakdown: {
        baseDamage,
        apDamage,
        formationMult,
        chargeMult,
        flankMult,
        fatigueMult,
        randomMult,
        critMult,
        buffMult,
        tempoMult,
      },
    };
  }
  
  /**
   * 원거리 데미지 계산
   * 근접과 유사하나 거리에 따른 피해 감소 적용
   */
  static calculateRangedDamage(ctx: CombatContext): DamageResult {
    const baseResult = this.calculateDamage(ctx);
    
    // 거리에 따른 피해 감소 (최대 사거리의 50% 이후부터 감소 시작)
    const maxRange = ctx.attacker.attackRange;
    const falloffStart = maxRange * 0.5;
    
    let distanceMult = 1;
    if (ctx.distance > falloffStart) {
      const falloffProgress = (ctx.distance - falloffStart) / (maxRange - falloffStart);
      distanceMult = Math.max(0.5, 1 - falloffProgress * 0.5); // 최소 50%
    }
    
    // 진형 원거리 방어 보너스 적용
    const defenderFormation = FORMATION_CONFIG[ctx.defenderSquad.formation];
    const rangedDefenseMult = 1 / defenderFormation.rangedDefenseBonus;
    
    const finalDamage = Math.max(1, Math.round(baseResult.damage * distanceMult * rangedDefenseMult));
    
    return {
      ...baseResult,
      damage: finalDamage,
      breakdown: {
        ...baseResult.breakdown,
        // 추가 정보
      },
    };
  }
  
  // ========================================
  // 명중률/회피율 계산
  // ========================================
  
  /**
   * 명중 판정
   * 
   * 공식:
   * 기본 명중률 = 공격자 근접공격 / (공격자 근접공격 + 방어자 근접방어)
   * 수정치: 진형, 피로도, 돌격, 버프, 거리
   */
  static calculateHit(ctx: CombatContext, isRanged: boolean = false): HitResult {
    const attackerFormation = FORMATION_CONFIG[ctx.attackerSquad.formation];
    const defenderFormation = FORMATION_CONFIG[ctx.defenderSquad.formation];
    
    // 유효 공격/방어력
    const attackValue = ctx.attacker.meleeAttack * attackerFormation.meleeAttackBonus;
    const defenseValue = ctx.defender.meleeDefense * defenderFormation.meleeDefenseBonus;
    
    // 기본 명중률 - ★ 방어 가중치 2배로 미스율 증가
    // 공격=방어면 33% 명중 (기존 50%)
    let baseHitChance = attackValue / (attackValue + defenseValue * 2);
    
    // 피로도 보정 (공격자 피로 → 명중 감소)
    const fatigueMod = 1 - ctx.attacker.fatigue / 200;
    
    // 돌격 보정 (+20% 명중)
    let chargeMod = 1;
    if (ctx.isCharging && ctx.chargeStartTime) {
      const chargeTime = ctx.currentTime - ctx.chargeStartTime;
      if (chargeTime < CHARGE_BONUS_DURATION) {
        chargeMod = 1.2;
      }
    }
    
    // 버프 보정
    const attackBuff = this.calculateBuffMultiplier(ctx.attackerBuffs, 'attack_up', 'attack_down');
    const defenseBuff = this.calculateBuffMultiplier(ctx.defenderBuffs, 'defense_up', 'defense_down');
    const buffMod = attackBuff / defenseBuff;
    
    // 거리 보정 (원거리만)
    let distanceMod = 1;
    if (isRanged) {
      const optimalRange = ctx.attacker.attackRange * 0.6;
      if (ctx.distance > optimalRange) {
        // 최적 거리 이후 명중률 감소
        const falloff = (ctx.distance - optimalRange) / (ctx.attacker.attackRange - optimalRange);
        distanceMod = Math.max(0.3, 1 - falloff * 0.7); // 최소 30%
      }
    }
    
    // 진형 보정
    const formationMod = attackerFormation.meleeAttackBonus / defenderFormation.meleeDefenseBonus;
    
    // 최종 명중률 계산
    let hitChance = baseHitChance * fatigueMod * chargeMod * buffMod * distanceMod * formationMod;
    
    // 범위 제한 (10% ~ 95%)
    hitChance = Math.max(0.1, Math.min(0.95, hitChance));
    
    // 판정 굴림
    const rollValue = Math.random();
    const isHit = rollValue <= hitChance;
    
    return {
      isHit,
      hitChance,
      rollValue,
      breakdown: {
        baseHitChance,
        attackValue,
        defenseValue,
        formationMod,
        fatigueMod,
        chargeMod,
        buffMod,
        distanceMod,
      },
    };
  }
  
  // ========================================
  // 크리티컬 시스템
  // ========================================
  
  /**
   * 크리티컬 계산
   * 
   * 기본 확률: 5%
   * 무력 보너스: +0.1% per 무력
   * 버프 보너스: crit_up/crit_down
   * 후방 공격: +10%
   * 
   * 크리티컬 유형:
   * - 일반 (85%): x1.5 피해
   * - 강력 (14%): x2.0 피해
   * - 처형 (1%): 즉사 (HP 20% 이하일 때만)
   */
  static calculateCritical(ctx: CombatContext): CriticalResult {
    const BASE_CRIT_CHANCE = 0.05; // 5%
    
    // 무력 보너스 (+0.1% per 무력)
    const strengthBonus = (ctx.attackerSquad.strength || 50) * 0.001;
    
    // 버프 보너스
    const buffMult = this.calculateBuffMultiplier(ctx.attackerBuffs, 'crit_up', 'crit_down');
    
    // 후방 공격 보너스
    const isRear = ctx.attackAngle > (2 * Math.PI / 3);
    const rearBonus = isRear ? 0.1 : 0;
    
    // 최종 크리티컬 확률
    let critChance = (BASE_CRIT_CHANCE + strengthBonus + rearBonus) * buffMult;
    critChance = Math.max(0, Math.min(0.5, critChance)); // 최대 50%
    
    // 크리티컬 판정
    const roll = Math.random();
    const isCritical = roll <= critChance;
    
    if (!isCritical) {
      return {
        isCritical: false,
        critChance,
        critMultiplier: 1,
        critType: 'none',
      };
    }
    
    // 크리티컬 유형 결정
    const typeRoll = Math.random();
    let critType: CriticalType;
    let critMultiplier: number;
    
    // HP가 20% 이하일 때만 처형 가능
    const canExecute = ctx.defender.hp / ctx.defender.maxHp <= 0.2;
    
    if (typeRoll <= 0.01 && canExecute) {
      // 처형 (1% + HP 20% 이하)
      critType = 'execution';
      critMultiplier = 999; // 즉사
    } else if (typeRoll <= 0.15) {
      // 강력 (14%)
      critType = 'devastating';
      critMultiplier = 2.0;
    } else {
      // 일반 (85%)
      critType = 'normal';
      critMultiplier = 1.5;
    }
    
    return {
      isCritical,
      critChance,
      critMultiplier,
      critType,
    };
  }
  
  // ========================================
  // 측면/후방 보너스
  // ========================================
  
  /**
   * 측면/후방 공격 배율
   * 정면: 0~60도 → x1.0
   * 측면: 60~120도 → x1.5
   * 후방: 120~180도 → x2.0
   */
  static getFlankingMultiplier(attackAngle: number): number {
    if (attackAngle < Math.PI / 3) {
      return FLANKING_BONUS.front;     // 1.0
    } else if (attackAngle < 2 * Math.PI / 3) {
      return FLANKING_BONUS.flank;     // 1.5
    } else {
      return FLANKING_BONUS.rear;      // 2.0
    }
  }
  
  /**
   * 측면 공격 유형 반환
   */
  static getFlankingType(attackAngle: number): 'front' | 'flank' | 'rear' {
    if (attackAngle < Math.PI / 3) {
      return 'front';
    } else if (attackAngle < 2 * Math.PI / 3) {
      return 'flank';
    } else {
      return 'rear';
    }
  }
  
  // ========================================
  // 돌격 보너스
  // ========================================
  
  /**
   * 돌격 배율 및 보너스 피해 계산
   * 시간에 따라 감소 (5초 후 완전 소멸)
   */
  static calculateChargeMultiplier(ctx: CombatContext): {
    multiplier: number;
    bonusDamage: number;
    remainingTime: number;
  } {
    if (!ctx.isCharging || !ctx.chargeStartTime) {
      return { multiplier: 1, bonusDamage: 0, remainingTime: 0 };
    }
    
    const chargeTime = ctx.currentTime - ctx.chargeStartTime;
    
    if (chargeTime >= CHARGE_BONUS_DURATION) {
      return { multiplier: 1, bonusDamage: 0, remainingTime: 0 };
    }
    
    // 시간에 따른 감소 (선형)
    const decayRate = 1 - (chargeTime / CHARGE_BONUS_DURATION);
    
    // 돌격 방어 적용
    const defenderStats = CATEGORY_BASE_STATS[ctx.defenderSquad.category];
    const chargeDefense = defenderStats.chargeDefense || 0;
    const effectiveChargeBonus = Math.max(0, ctx.attacker.chargeBonus - chargeDefense);
    
    // 배율 계산 (돌격 보너스 10 = +10%)
    const multiplier = 1 + (effectiveChargeBonus * decayRate) / 100;
    
    // 보너스 피해 (돌격 보너스의 70%는 일반 피해, 30%는 AP 피해)
    const bonusDamage = effectiveChargeBonus * decayRate;
    
    return {
      multiplier,
      bonusDamage,
      remainingTime: CHARGE_BONUS_DURATION - chargeTime,
    };
  }
  
  // ========================================
  // 유닛 상성 시스템
  // ========================================
  
  /**
   * 상성 보너스 계산 (심화 버전)
   * 
   * 카운터 관계: +50% 보너스 데미지
   * 취약 관계: -30% 데미지 (별도 적용)
   * 
   * 특수 상성:
   * - 창병 vs 기병: +80% 보너스 (돌격 저지)
   * - 기병 vs 궁병: +60% 보너스 (빠른 접근)
   * - 도검병 vs 창병: +40% 보너스 (방패로 창 막음)
   */
  static calculateCounterBonus(
    attackerCategory: TWUnitCategory,
    defenderCategory: TWUnitCategory,
    attacker: TWSoldier
  ): number {
    let bonus = 0;
    
    // 특수 상성 관계 (더 높은 보너스)
    const specialCounters: Record<string, { targets: TWUnitCategory[], bonus: number }> = {
      // 창병류 → 기병 (돌격 저지, +80%)
      'ji_infantry': { targets: ['cavalry', 'shock_cavalry', 'chariot'], bonus: 0.8 },
      'spear_guard': { targets: ['cavalry', 'shock_cavalry', 'chariot'], bonus: 0.8 },
      'halberd_infantry': { targets: ['cavalry', 'shock_cavalry', 'chariot'], bonus: 0.7 },
      
      // 기병 → 원거리 (빠른 접근, +60%)
      'cavalry': { targets: ['archer', 'crossbow', 'strategist'], bonus: 0.6 },
      'shock_cavalry': { targets: ['archer', 'crossbow', 'strategist'], bonus: 0.7 },
      
      // 도검병 → 창병 (방패로 창 막음, +40%)
      'sword_infantry': { targets: ['ji_infantry', 'halberd_infantry'], bonus: 0.4 },
      
      // 노병 → 기병 (관통력, +50%)
      'crossbow': { targets: ['cavalry', 'shock_cavalry'], bonus: 0.5 },
    };
    
    // 특수 상성 체크
    const specialCounter = specialCounters[attackerCategory];
    if (specialCounter?.targets.includes(defenderCategory)) {
      bonus += attacker.weaponDamage * specialCounter.bonus;
    }
    // 일반 카운터 관계 (+50% 피해)
    else if (UNIT_COUNTER[attackerCategory]?.includes(defenderCategory)) {
      bonus += attacker.weaponDamage * 0.5;
    }
    
    // 대기병 보너스 (기병/충격기병/궁기병/전차 상대)
    const cavalryTypes: TWUnitCategory[] = ['cavalry', 'shock_cavalry', 'horse_archer', 'chariot'];
    if (cavalryTypes.includes(defenderCategory)) {
      const attackerStats = CATEGORY_BASE_STATS[attackerCategory];
      bonus += (attackerStats.bonusVsCavalry || 0) * 1.5; // 대기병 보너스 50% 증가
    }
    
    // 대보병 보너스 (보병 상대)
    const infantryTypes: TWUnitCategory[] = ['ji_infantry', 'sword_infantry', 'halberd_infantry', 'spear_guard'];
    if (infantryTypes.includes(defenderCategory)) {
      const attackerStats = CATEGORY_BASE_STATS[attackerCategory];
      bonus += (attackerStats.bonusVsInfantry || 0) * 1.5; // 대보병 보너스 50% 증가
    }
    
    return bonus;
  }
  
  /**
   * 취약 관계인지 확인 (피해 감소 적용)
   */
  static isWeakAgainst(attackerCategory: TWUnitCategory, defenderCategory: TWUnitCategory): boolean {
    return UNIT_WEAKNESS[attackerCategory]?.includes(defenderCategory) ?? false;
  }
  
  /**
   * 상성 배율 계산 (취약 관계 시 데미지 감소)
   * 
   * 취약 관계: 0.7 (30% 데미지 감소)
   * 일반: 1.0
   * 유리: 1.0 (보너스 데미지는 별도 적용)
   */
  static getCounterMultiplier(
    attackerCategory: TWUnitCategory,
    defenderCategory: TWUnitCategory
  ): number {
    // 취약 관계면 데미지 30% 감소
    if (this.isWeakAgainst(attackerCategory, defenderCategory)) {
      return 0.7;
    }
    return 1.0;
  }
  
  /**
   * 상성에 따른 명중률 보너스
   * 유리한 상성: +15% 명중
   * 불리한 상성: -10% 명중
   */
  static getCounterHitBonus(
    attackerCategory: TWUnitCategory,
    defenderCategory: TWUnitCategory
  ): number {
    if (UNIT_COUNTER[attackerCategory]?.includes(defenderCategory)) {
      return 0.15; // +15% 명중
    }
    if (this.isWeakAgainst(attackerCategory, defenderCategory)) {
      return -0.10; // -10% 명중
    }
    return 0;
  }
  
  /**
   * 상성에 따른 사기 피해 배율
   * 유리한 상성으로 공격 시: 1.5배 사기 피해
   * 불리한 상성에게 피격 시: 1.3배 사기 피해 (방어측)
   */
  static getCounterMoraleMultiplier(
    attackerCategory: TWUnitCategory,
    defenderCategory: TWUnitCategory
  ): number {
    if (UNIT_COUNTER[attackerCategory]?.includes(defenderCategory)) {
      return 1.5; // 유리한 상성으로 공격 시 사기 피해 50% 증가
    }
    return 1.0;
  }
  
  // ========================================
  // 버프/디버프 시스템
  // ========================================
  
  /**
   * 버프 배율 계산
   * 같은 종류의 버프/디버프를 합산하여 최종 배율 반환
   */
  static calculateBuffMultiplier(buffs: Buff[], upType: BuffType, downType: BuffType): number {
    let multiplier = 1;
    
    for (const buff of buffs) {
      if (buff.type === upType) {
        if (buff.isPercent) {
          multiplier *= buff.value * buff.currentStacks;
        } else {
          multiplier += (buff.value * buff.currentStacks) / 100;
        }
      } else if (buff.type === downType) {
        if (buff.isPercent) {
          multiplier /= buff.value * buff.currentStacks;
        } else {
          multiplier -= (buff.value * buff.currentStacks) / 100;
        }
      }
    }
    
    // 최소/최대 범위 제한
    return Math.max(0.1, Math.min(3.0, multiplier));
  }
  
  /**
   * 특정 버프가 있는지 확인
   */
  static hasBuff(buffs: Buff[], type: BuffType): boolean {
    return buffs.some(b => b.type === type);
  }
  
  /**
   * 버프 값 합계 (절대값)
   */
  static getBuffValueSum(buffs: Buff[], type: BuffType): number {
    return buffs
      .filter(b => b.type === type && !b.isPercent)
      .reduce((sum, b) => sum + b.value * b.currentStacks, 0);
  }
  
  /**
   * 만료된 버프 필터링
   */
  static filterExpiredBuffs(buffs: Buff[], currentTime: number): Buff[] {
    return buffs.filter(buff => {
      if (buff.duration === -1) return true; // 영구 버프
      return currentTime - buff.startTime < buff.duration;
    });
  }
  
  /**
   * 버프 생성 헬퍼
   */
  static createBuff(params: {
    type: BuffType;
    value: number;
    isPercent?: boolean;
    duration: number;
    currentTime: number;
    source: string;
    stackable?: boolean;
    maxStacks?: number;
    name: string;
    description: string;
  }): Buff {
    return {
      id: `buff-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: params.type,
      value: params.value,
      isPercent: params.isPercent ?? true,
      duration: params.duration,
      startTime: params.currentTime,
      source: params.source,
      stackable: params.stackable ?? false,
      maxStacks: params.maxStacks ?? 1,
      currentStacks: 1,
      name: params.name,
      description: params.description,
    };
  }
  
  // ========================================
  // 유틸리티
  // ========================================
  
  /**
   * 피해 유형 결정
   */
  static getDamageType(category: TWUnitCategory): DamageType {
    switch (category) {
      case 'crossbow':
        return 'piercing';
      case 'chariot':
        return 'blunt';
      case 'strategist':
        return 'morale';
      case 'siege':
        return 'siege';
      default:
        return 'physical';
    }
  }
  
  /**
   * 컨텍스트 생성 헬퍼
   */
  static createContext(params: {
    attacker: TWSoldier;
    attackerSquad: TWSquad;
    defender: TWSoldier;
    defenderSquad: TWSquad;
    currentTime: number;
    attackerBuffs?: Buff[];
    defenderBuffs?: Buff[];
  }): CombatContext {
    const attackAngle = calculateAttackAngle(params.attacker, params.defender);
    const distance = getDistance(params.attacker.position, params.defender.position);
    
    return {
      attacker: params.attacker,
      attackerSquad: params.attackerSquad,
      defender: params.defender,
      defenderSquad: params.defenderSquad,
      currentTime: params.currentTime,
      attackAngle,
      isCharging: params.attacker.isCharging,
      chargeStartTime: params.attacker.chargeStartTime,
      distance,
      attackerBuffs: params.attackerBuffs ?? [],
      defenderBuffs: params.defenderBuffs ?? [],
    };
  }
  
  // ========================================
  // 사기 피해 계산
  // ========================================
  
  /**
   * 사기 피해 계산
   * 물리 피해에 비례 + 상황 보너스
   * ★ 25명당 1인 전투 템포에 맞게 사기 피해 감소 (50% → 15%)
   */
  static calculateMoraleDamage(
    physicalDamage: number,
    ctx: CombatContext,
    isCritical: boolean
  ): number {
    // 기본 사기 피해 = 물리 피해의 15% (50% → 15%, 전투 템포 조절)
    let moraleDamage = physicalDamage * 0.15;
    
    // 크리티컬 시 추가 사기 피해
    if (isCritical) {
      moraleDamage *= 1.5;
    }
    
    // 후방 공격 시 추가 사기 피해
    if (ctx.attackAngle > 2 * Math.PI / 3) {
      moraleDamage *= 1.5;
    }
    
    // 기병 돌격 시 추가 사기 피해
    const cavalryTypes: TWUnitCategory[] = ['cavalry', 'shock_cavalry', 'chariot'];
    if (cavalryTypes.includes(ctx.attackerSquad.category) && ctx.isCharging) {
      moraleDamage *= 1.3;
    }
    
    // 사기 버프/디버프
    const moraleBuff = this.calculateBuffMultiplier(ctx.defenderBuffs, 'morale_down', 'morale_up');
    moraleDamage *= moraleBuff;
    
    return Math.round(moraleDamage);
  }
}

// ========================================
// 사전 정의된 버프 템플릿
// ========================================

export const BUFF_TEMPLATES = {
  // 공격 버프
  attackUp: (value: number, duration: number, source: string, currentTime: number) =>
    CombatCalculator.createBuff({
      type: 'attack_up',
      value,
      isPercent: true,
      duration,
      currentTime,
      source,
      name: '공격력 상승',
      description: `공격력 ${((value - 1) * 100).toFixed(0)}% 증가`,
    }),
  
  // 방어 버프
  defenseUp: (value: number, duration: number, source: string, currentTime: number) =>
    CombatCalculator.createBuff({
      type: 'defense_up',
      value,
      isPercent: true,
      duration,
      currentTime,
      source,
      name: '방어력 상승',
      description: `방어력 ${((value - 1) * 100).toFixed(0)}% 증가`,
    }),
  
  // 돌격 강화
  chargeUp: (value: number, duration: number, source: string, currentTime: number) =>
    CombatCalculator.createBuff({
      type: 'charge_up',
      value,
      isPercent: true,
      duration,
      currentTime,
      source,
      name: '돌격 강화',
      description: `돌격 보너스 ${((value - 1) * 100).toFixed(0)}% 증가`,
    }),
  
  // 둔화
  slow: (value: number, duration: number, source: string, currentTime: number) =>
    CombatCalculator.createBuff({
      type: 'speed_down',
      value,
      isPercent: true,
      duration,
      currentTime,
      source,
      name: '둔화',
      description: `이동속도 ${((1 - 1/value) * 100).toFixed(0)}% 감소`,
    }),
  
  // 공포 (사기 감소)
  fear: (value: number, duration: number, source: string, currentTime: number) =>
    CombatCalculator.createBuff({
      type: 'morale_down',
      value,
      isPercent: true,
      duration,
      currentTime,
      source,
      name: '공포',
      description: `사기 피해 ${((value - 1) * 100).toFixed(0)}% 증가`,
    }),
  
  // 쇄갑 (방어구 감소)
  sunder: (value: number, duration: number, source: string, currentTime: number) =>
    CombatCalculator.createBuff({
      type: 'armor_down',
      value,
      isPercent: true,
      duration,
      currentTime,
      source,
      name: '쇄갑',
      description: `방어구 효율 ${((1 - 1/value) * 100).toFixed(0)}% 감소`,
    }),
  
  // 분노 (피해 증가, 받는 피해도 증가)
  rage: (currentTime: number, source: string) =>
    CombatCalculator.createBuff({
      type: 'damage_up',
      value: 1.3,
      isPercent: true,
      duration: 10000,
      currentTime,
      source,
      stackable: true,
      maxStacks: 3,
      name: '분노',
      description: '피해량 30% 증가, 중첩 가능',
    }),
  
  // 재생
  regen: (value: number, duration: number, source: string, currentTime: number) =>
    CombatCalculator.createBuff({
      type: 'regen',
      value,
      isPercent: false,
      duration,
      currentTime,
      source,
      name: '재생',
      description: `초당 ${value} HP 회복`,
    }),
  
  // 기절
  stun: (duration: number, source: string, currentTime: number) =>
    CombatCalculator.createBuff({
      type: 'stun',
      value: 1,
      isPercent: false,
      duration,
      currentTime,
      source,
      name: '기절',
      description: '행동 불가',
    }),
};

export default CombatCalculator;


