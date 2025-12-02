/**
 * HeroSystem.ts
 * 토탈워 스타일 장수(Hero) 시스템
 * 
 * 핵심 기능:
 * 1. 장수 스탯 및 유형 (commander, champion, sentinel, vanguard, strategist)
 * 2. 장수 전투 AI
 * 3. 결투(Duel) 시스템
 * 4. 특수 능력(Ability) 시스템
 * 
 * 장수는 일반 병사의 10~20배 스탯을 가지며, 부대에 버프를 제공합니다.
 */

import { Vector2 } from '../TotalWarEngine';
import {
  Buff,
  BuffType,
  CombatCalculator,
  CombatContext,
  DamageResult,
} from '../combat/CombatCalculator';

// ========================================
// 타입 정의
// ========================================

/** 장수 유형 */
export type HeroType = 
  | 'commander'    // 지휘관: 부대 버프 특화, 균형 스탯
  | 'champion'     // 무장: 전투력 특화, 높은 공격력
  | 'sentinel'     // 수비수: 방어 특화, 높은 방어력
  | 'vanguard'     // 선봉: 돌격 특화, 높은 속도/돌격 보너스
  | 'strategist';  // 책사: 디버프 특화, 지력 높음

/** 장수 상태 */
export type HeroState = 
  | 'idle'           // 대기
  | 'moving'         // 이동
  | 'fighting'       // 전투
  | 'dueling'        // 결투 중
  | 'casting'        // 능력 시전 중
  | 'rallying'       // 격려 중
  | 'routing'        // 패주 중
  | 'dead';          // 사망

/** 장수 인터페이스 */
export interface TWHero {
  id: string;
  name: string;
  squadId: string;           // 소속 부대 ID
  
  // 전투 스탯 (일반 병사의 10~20배)
  hp: number;
  maxHp: number;
  meleeAttack: number;       // 근접 공격 (명중률)
  meleeDefense: number;      // 근접 방어 (회피율)
  weaponDamage: number;      // 무기 데미지
  armorPiercing: number;     // 방어구 관통
  armor: number;             // 방어구
  chargeBonus: number;       // 돌격 보너스
  speed: number;             // 이동 속도
  mass: number;              // 질량 (밀침)
  
  // 장수 유형
  type: HeroType;
  
  // 3대 능력치
  leadership: number;        // 통솔: 부대 사기 +, 지휘 범위 +
  strength: number;          // 무력: 전투력 +, 크리티컬 +
  intelligence: number;      // 지력: 능력 쿨다운 -, 디버프 효과 +
  
  // 특수 능력
  abilities: HeroAbility[];
  
  // 상태
  state: HeroState;
  position: Vector2;
  targetPosition?: Vector2;
  facing: number;            // 라디안
  
  // 전투 상태
  currentTargetId?: string;  // 현재 공격 대상 (장수 또는 병사)
  lastAttackTime: number;
  attackCooldown: number;
  isCharging: boolean;
  chargeStartTime?: number;
  
  // 결투 상태
  duelId?: string;           // 현재 결투 ID
  
  // 버프 목록
  buffs: Buff[];
  
  // 통계
  kills: number;
  damageDealt: number;
  damageTaken: number;
}

// ========================================
// 능력(Ability) 시스템
// ========================================

/** 능력 대상 유형 */
export type AbilityTargetType = 
  | 'self'           // 자신
  | 'ally_squad'     // 아군 부대
  | 'ally_hero'      // 아군 장수
  | 'ally_area'      // 아군 범위
  | 'enemy_squad'    // 적 부대
  | 'enemy_hero'     // 적 장수
  | 'enemy_area'     // 적 범위
  | 'ground';        // 지면 (범위)

/** 능력 효과 유형 */
export type AbilityEffectType = 
  | 'buff'           // 버프 부여
  | 'debuff'         // 디버프 부여
  | 'damage'         // 직접 피해
  | 'heal'           // 회복
  | 'morale_boost'   // 사기 상승
  | 'morale_damage'  // 사기 피해
  | 'knockback'      // 밀침
  | 'stun'           // 기절
  | 'taunt'          // 도발
  | 'summon';        // 소환

/** 장수 능력 */
export interface HeroAbility {
  id: string;
  name: string;
  nameKo: string;            // 한글 이름
  description: string;
  icon?: string;
  
  // 능력 유형
  targetType: AbilityTargetType;
  effectType: AbilityEffectType;
  
  // 수치
  range: number;             // 사거리 (m)
  radius: number;            // 범위 반경 (m)
  cooldown: number;          // 쿨다운 (ms)
  duration: number;          // 지속 시간 (ms)
  castTime: number;          // 시전 시간 (ms)
  
  // 효과 값
  effectValue: number;       // 효과 값 (피해량, 버프 배율 등)
  effectValuePercent: boolean; // 효과 값이 퍼센트인가
  
  // 버프 효과 (buff/debuff 유형일 때)
  buffType?: BuffType;
  
  // 상태
  lastUsedTime: number;
  isReady: boolean;
  
  // 조건
  requiredType?: HeroType;   // 특정 장수 유형만 사용 가능
  minLeadership?: number;    // 최소 통솔
  minStrength?: number;      // 최소 무력
  minIntelligence?: number;  // 최소 지력
}

// ========================================
// 결투(Duel) 시스템
// ========================================

/** 결투 상태 */
export type DuelState = 
  | 'challenging'    // 도전 중 (접근 중)
  | 'approaching'    // 접근 중
  | 'fighting'       // 결투 중
  | 'finished';      // 종료

/** 결투 결과 */
export type DuelOutcome = 
  | 'challenger_win' // 도전자 승리
  | 'defender_win'   // 수비자 승리
  | 'draw'           // 무승부 (타임아웃)
  | 'interrupted';   // 중단 (외부 개입)

/** 결투 */
export interface HeroDuel {
  id: string;
  challengerId: string;      // 도전자 장수 ID
  defenderId: string;        // 수비자 장수 ID
  
  state: DuelState;
  startTime: number;         // 시작 시간
  lastActionTime: number;    // 마지막 행동 시간
  
  // 결투 위치
  position: Vector2;
  
  // 결투 통계
  challengerDamageDealt: number;
  defenderDamageDealt: number;
  roundCount: number;
  
  // 결과
  outcome?: DuelOutcome;
  winnerId?: string;
  
  // 옵션
  maxDuration: number;       // 최대 지속 시간 (ms)
  interruptable: boolean;    // 중단 가능 여부
}

// ========================================
// 상수 정의
// ========================================

/** 장수 유형별 기본 스탯 배율 (병사 대비) */
export const HERO_TYPE_STATS: Record<HeroType, {
  hpMultiplier: number;
  attackMultiplier: number;
  defenseMultiplier: number;
  damageMultiplier: number;
  armorMultiplier: number;
  speedMultiplier: number;
  chargeMultiplier: number;
  description: string;
}> = {
  commander: {
    hpMultiplier: 15,
    attackMultiplier: 12,
    defenseMultiplier: 14,
    damageMultiplier: 12,
    armorMultiplier: 1.3,
    speedMultiplier: 1.2,
    chargeMultiplier: 1.0,
    description: '지휘관: 균형 잡힌 스탯, 부대 버프에 특화',
  },
  champion: {
    hpMultiplier: 18,
    attackMultiplier: 20,
    defenseMultiplier: 12,
    damageMultiplier: 18,
    armorMultiplier: 1.1,
    speedMultiplier: 1.3,
    chargeMultiplier: 1.2,
    description: '무장: 최고의 전투력, 적 장수 처치에 특화',
  },
  sentinel: {
    hpMultiplier: 20,
    attackMultiplier: 10,
    defenseMultiplier: 20,
    damageMultiplier: 10,
    armorMultiplier: 1.5,
    speedMultiplier: 0.9,
    chargeMultiplier: 0.8,
    description: '수비수: 최고의 방어력, 부대 보호에 특화',
  },
  vanguard: {
    hpMultiplier: 14,
    attackMultiplier: 15,
    defenseMultiplier: 10,
    damageMultiplier: 16,
    armorMultiplier: 1.0,
    speedMultiplier: 1.5,
    chargeMultiplier: 2.0,
    description: '선봉: 최고의 돌격력, 적진 돌파에 특화',
  },
  strategist: {
    hpMultiplier: 10,
    attackMultiplier: 8,
    defenseMultiplier: 8,
    damageMultiplier: 8,
    armorMultiplier: 0.8,
    speedMultiplier: 1.0,
    chargeMultiplier: 0.5,
    description: '책사: 낮은 전투력, 버프/디버프에 특화',
  },
};

/** 결투 설정 */
export const DUEL_CONFIG = {
  approachSpeed: 3.0,          // 접근 속도 배율
  attackCooldown: 1500,        // 공격 쿨다운 (ms)
  maxDuration: 60000,          // 최대 지속 시간 (60초)
  interruptRange: 5,           // 중단 범위 (m)
  victoryMoraleBoost: 30,      // 승리 시 사기 +
  defeatMoralePenalty: -40,    // 패배 시 사기 -
  spectatorMoraleEffect: 0.5,  // 관전 병사 사기 효과 배율
};

/** 기본 능력 템플릿 */
export const HERO_ABILITIES: Record<string, Omit<HeroAbility, 'id' | 'lastUsedTime' | 'isReady'>> = {
  // === 지휘관 전용 ===
  rally: {
    name: 'Rally',
    nameKo: '격려',
    description: '주변 아군의 사기를 30 회복합니다.',
    targetType: 'ally_area',
    effectType: 'morale_boost',
    range: 0,
    radius: 20,
    cooldown: 30000,
    duration: 0,
    castTime: 500,
    effectValue: 30,
    effectValuePercent: false,
    requiredType: 'commander',
    minLeadership: 60,
  },
  
  inspire: {
    name: 'Inspire',
    nameKo: '고무',
    description: '주변 아군의 공격력을 20% 증가시킵니다.',
    targetType: 'ally_area',
    effectType: 'buff',
    range: 0,
    radius: 25,
    cooldown: 45000,
    duration: 15000,
    castTime: 1000,
    effectValue: 1.2,
    effectValuePercent: true,
    buffType: 'attack_up',
    requiredType: 'commander',
    minLeadership: 70,
  },
  
  // === 무장 전용 ===
  duel_challenge: {
    name: 'Challenge',
    nameKo: '도전',
    description: '적 장수에게 결투를 신청합니다.',
    targetType: 'enemy_hero',
    effectType: 'taunt',
    range: 30,
    radius: 0,
    cooldown: 60000,
    duration: 0,
    castTime: 0,
    effectValue: 1,
    effectValuePercent: false,
    requiredType: 'champion',
    minStrength: 70,
  },
  
  mighty_strike: {
    name: 'Mighty Strike',
    nameKo: '강타',
    description: '강력한 일격으로 200% 피해를 입힙니다.',
    targetType: 'enemy_hero',
    effectType: 'damage',
    range: 3,
    radius: 0,
    cooldown: 20000,
    duration: 0,
    castTime: 500,
    effectValue: 2.0,
    effectValuePercent: true,
    requiredType: 'champion',
    minStrength: 60,
  },
  
  // === 수비수 전용 ===
  shield_wall: {
    name: 'Shield Wall',
    nameKo: '방패벽',
    description: '주변 아군의 방어력을 50% 증가시킵니다.',
    targetType: 'ally_area',
    effectType: 'buff',
    range: 0,
    radius: 15,
    cooldown: 40000,
    duration: 12000,
    castTime: 500,
    effectValue: 1.5,
    effectValuePercent: true,
    buffType: 'defense_up',
    requiredType: 'sentinel',
    minLeadership: 50,
  },
  
  taunt: {
    name: 'Taunt',
    nameKo: '도발',
    description: '주변 적들의 공격을 자신에게 집중시킵니다.',
    targetType: 'enemy_area',
    effectType: 'taunt',
    range: 0,
    radius: 10,
    cooldown: 25000,
    duration: 8000,
    castTime: 300,
    effectValue: 1,
    effectValuePercent: false,
    requiredType: 'sentinel',
  },
  
  // === 선봉 전용 ===
  charge_boost: {
    name: 'Charge',
    nameKo: '돌격',
    description: '돌격 보너스를 50% 증가시킵니다.',
    targetType: 'self',
    effectType: 'buff',
    range: 0,
    radius: 0,
    cooldown: 35000,
    duration: 10000,
    castTime: 0,
    effectValue: 1.5,
    effectValuePercent: true,
    buffType: 'charge_up',
    requiredType: 'vanguard',
    minStrength: 60,
  },
  
  battle_cry: {
    name: 'Battle Cry',
    nameKo: '함성',
    description: '적들에게 공포를 심어 사기를 20 감소시킵니다.',
    targetType: 'enemy_area',
    effectType: 'morale_damage',
    range: 0,
    radius: 20,
    cooldown: 30000,
    duration: 0,
    castTime: 500,
    effectValue: 20,
    effectValuePercent: false,
    requiredType: 'vanguard',
  },
  
  // === 책사 전용 ===
  weaken: {
    name: 'Weaken',
    nameKo: '약화',
    description: '적 부대의 방어력을 30% 감소시킵니다.',
    targetType: 'enemy_squad',
    effectType: 'debuff',
    range: 40,
    radius: 15,
    cooldown: 35000,
    duration: 12000,
    castTime: 1500,
    effectValue: 1.3,
    effectValuePercent: true,
    buffType: 'armor_down',
    requiredType: 'strategist',
    minIntelligence: 70,
  },
  
  confusion: {
    name: 'Confusion',
    nameKo: '혼란',
    description: '적 부대에 혼란을 일으켜 공격력을 25% 감소시킵니다.',
    targetType: 'enemy_squad',
    effectType: 'debuff',
    range: 35,
    radius: 12,
    cooldown: 40000,
    duration: 10000,
    castTime: 2000,
    effectValue: 1.25,
    effectValuePercent: true,
    buffType: 'attack_down',
    requiredType: 'strategist',
    minIntelligence: 65,
  },
  
  slow: {
    name: 'Slow',
    nameKo: '둔화',
    description: '적 부대의 이동 속도를 40% 감소시킵니다.',
    targetType: 'enemy_squad',
    effectType: 'debuff',
    range: 30,
    radius: 15,
    cooldown: 25000,
    duration: 8000,
    castTime: 1000,
    effectValue: 1.4,
    effectValuePercent: true,
    buffType: 'speed_down',
    requiredType: 'strategist',
    minIntelligence: 55,
  },
  
  // === 공용 능력 ===
  heal: {
    name: 'Heal',
    nameKo: '치유',
    description: '자신의 HP를 20% 회복합니다.',
    targetType: 'self',
    effectType: 'heal',
    range: 0,
    radius: 0,
    cooldown: 60000,
    duration: 0,
    castTime: 1500,
    effectValue: 0.2,
    effectValuePercent: true,
  },
  
  sprint: {
    name: 'Sprint',
    nameKo: '질주',
    description: '이동 속도를 50% 증가시킵니다.',
    targetType: 'self',
    effectType: 'buff',
    range: 0,
    radius: 0,
    cooldown: 30000,
    duration: 8000,
    castTime: 0,
    effectValue: 1.5,
    effectValuePercent: true,
    buffType: 'speed_up',
  },
};

// ========================================
// 장수 시스템 클래스
// ========================================

export class HeroSystem {
  /** 모든 장수 */
  private heroes: Map<string, TWHero> = new Map();
  
  /** 진행 중인 결투 */
  private duels: Map<string, HeroDuel> = new Map();
  
  /** ID 카운터 */
  private idCounter = 0;
  
  /** 현재 시간 (외부에서 업데이트) */
  private currentTime = 0;
  
  // ========================================
  // 장수 생성
  // ========================================
  
  /**
   * 장수 생성
   * @param config 장수 설정
   * @returns 생성된 장수
   */
  createHero(config: {
    name: string;
    squadId: string;
    type: HeroType;
    leadership: number;
    strength: number;
    intelligence: number;
    position: Vector2;
    facing?: number;
    abilities?: string[];    // 능력 ID 목록
  }): TWHero {
    const typeStats = HERO_TYPE_STATS[config.type];
    
    // 기본 스탯 계산 (병사 기준 × 배율)
    const BASE_HP = 300;
    const BASE_ATTACK = 35;
    const BASE_DEFENSE = 30;
    const BASE_DAMAGE = 12;
    const BASE_ARMOR = 50;
    const BASE_SPEED = 2.5;
    const BASE_CHARGE = 15;
    
    // 능력치에 따른 추가 배율
    const strengthMult = 1 + config.strength / 200;
    const leadershipMult = 1 + config.leadership / 200;
    const intelligenceMult = 1 + config.intelligence / 200;
    
    const hero: TWHero = {
      id: `hero-${++this.idCounter}-${Date.now()}`,
      name: config.name,
      squadId: config.squadId,
      
      // 전투 스탯
      hp: Math.round(BASE_HP * typeStats.hpMultiplier * strengthMult),
      maxHp: Math.round(BASE_HP * typeStats.hpMultiplier * strengthMult),
      meleeAttack: Math.round(BASE_ATTACK * typeStats.attackMultiplier * strengthMult),
      meleeDefense: Math.round(BASE_DEFENSE * typeStats.defenseMultiplier * leadershipMult),
      weaponDamage: Math.round(BASE_DAMAGE * typeStats.damageMultiplier * strengthMult),
      armorPiercing: Math.round(BASE_DAMAGE * 0.3 * typeStats.damageMultiplier),
      armor: Math.round(BASE_ARMOR * typeStats.armorMultiplier),
      chargeBonus: Math.round(BASE_CHARGE * typeStats.chargeMultiplier * strengthMult),
      speed: BASE_SPEED * typeStats.speedMultiplier,
      mass: 5.0, // 장수는 일반 병사보다 무거움
      
      // 장수 유형
      type: config.type,
      
      // 능력치
      leadership: config.leadership,
      strength: config.strength,
      intelligence: config.intelligence,
      
      // 능력 초기화
      abilities: this.initializeAbilities(config.type, config.abilities),
      
      // 상태
      state: 'idle',
      position: { ...config.position },
      facing: config.facing ?? 0,
      
      // 전투 상태
      lastAttackTime: 0,
      attackCooldown: 1500, // 기본 공격 쿨다운
      isCharging: false,
      
      // 버프
      buffs: [],
      
      // 통계
      kills: 0,
      damageDealt: 0,
      damageTaken: 0,
    };
    
    this.heroes.set(hero.id, hero);
    return hero;
  }
  
  /**
   * 능력 초기화
   */
  private initializeAbilities(heroType: HeroType, abilityIds?: string[]): HeroAbility[] {
    const abilities: HeroAbility[] = [];
    
    // 기본 능력 추가
    const defaultAbilities: Record<HeroType, string[]> = {
      commander: ['rally', 'inspire'],
      champion: ['duel_challenge', 'mighty_strike'],
      sentinel: ['shield_wall', 'taunt'],
      vanguard: ['charge_boost', 'battle_cry'],
      strategist: ['weaken', 'confusion', 'slow'],
    };
    
    const idsToAdd = abilityIds ?? defaultAbilities[heroType] ?? [];
    
    for (const abilityId of idsToAdd) {
      const template = HERO_ABILITIES[abilityId];
      if (template) {
        abilities.push({
          id: abilityId,
          ...template,
          lastUsedTime: 0,
          isReady: true,
        });
      }
    }
    
    // 공용 능력 추가
    abilities.push({
      id: 'heal',
      ...HERO_ABILITIES.heal,
      lastUsedTime: 0,
      isReady: true,
    });
    
    return abilities;
  }
  
  // ========================================
  // 장수 AI
  // ========================================
  
  /**
   * 장수 AI 업데이트
   * @param hero 장수
   * @param enemyHeroes 적 장수 목록
   * @param allySoldiers 아군 병사 위치 (사기 버프용)
   * @param enemySoldiers 적 병사 위치 (공격 대상)
   */
  updateHeroAI(
    hero: TWHero,
    enemyHeroes: TWHero[],
    allySoldiers: Array<{ id: string; position: Vector2; morale: number }>,
    enemySoldiers: Array<{ id: string; position: Vector2; hp: number }>
  ): HeroAIAction {
    // 결투 중이면 결투 AI
    if (hero.state === 'dueling' && hero.duelId) {
      return this.getDuelAIAction(hero);
    }
    
    // 장수 유형별 AI
    switch (hero.type) {
      case 'commander':
        return this.getCommanderAI(hero, allySoldiers, enemyHeroes);
      case 'champion':
        return this.getChampionAI(hero, enemyHeroes, enemySoldiers);
      case 'sentinel':
        return this.getSentinelAI(hero, allySoldiers, enemyHeroes);
      case 'vanguard':
        return this.getVanguardAI(hero, enemyHeroes, enemySoldiers);
      case 'strategist':
        return this.getStrategistAI(hero, enemyHeroes, enemySoldiers);
      default:
        return { type: 'idle' };
    }
  }
  
  /**
   * 지휘관 AI: 부대 지원, 사기 관리
   */
  private getCommanderAI(
    hero: TWHero,
    allySoldiers: Array<{ id: string; position: Vector2; morale: number }>,
    enemyHeroes: TWHero[]
  ): HeroAIAction {
    // 낮은 사기 아군이 있으면 격려
    const lowMoraleAllies = allySoldiers.filter(s => s.morale < 50);
    if (lowMoraleAllies.length > 3) {
      const rallyAbility = hero.abilities.find(a => a.id === 'rally');
      if (rallyAbility && this.canUseAbility(hero, rallyAbility)) {
        return {
          type: 'use_ability',
          abilityId: 'rally',
          targetPosition: this.getAveragePosition(lowMoraleAllies),
        };
      }
    }
    
    // 아군 근처에서 전투
    const nearbyAllies = allySoldiers.filter(s => 
      this.getDistance(hero.position, s.position) < 15
    );
    
    if (nearbyAllies.length < 5) {
      // 아군과 떨어져 있으면 이동
      const center = this.getAveragePosition(allySoldiers);
      return {
        type: 'move',
        targetPosition: center,
      };
    }
    
    // 적 장수가 가까이 있으면 전투
    const nearbyEnemy = this.findClosestHero(hero.position, enemyHeroes, 20);
    if (nearbyEnemy) {
      return {
        type: 'attack',
        targetId: nearbyEnemy.id,
      };
    }
    
    return { type: 'idle' };
  }
  
  /**
   * 무장 AI: 적 장수 사냥, 결투
   */
  private getChampionAI(
    hero: TWHero,
    enemyHeroes: TWHero[],
    enemySoldiers: Array<{ id: string; position: Vector2; hp: number }>
  ): HeroAIAction {
    // 적 장수 찾기
    const targetHero = this.findClosestHero(hero.position, enemyHeroes, 50);
    
    if (targetHero) {
      const distance = this.getDistance(hero.position, targetHero.position);
      
      // 결투 도전
      if (distance < 30) {
        const challengeAbility = hero.abilities.find(a => a.id === 'duel_challenge');
        if (challengeAbility && this.canUseAbility(hero, challengeAbility)) {
          return {
            type: 'use_ability',
            abilityId: 'duel_challenge',
            targetId: targetHero.id,
          };
        }
      }
      
      // 적 장수에게 접근
      if (distance > 5) {
        return {
          type: 'move',
          targetPosition: targetHero.position,
        };
      }
      
      // 강타 사용
      const mightyStrike = hero.abilities.find(a => a.id === 'mighty_strike');
      if (mightyStrike && this.canUseAbility(hero, mightyStrike)) {
        return {
          type: 'use_ability',
          abilityId: 'mighty_strike',
          targetId: targetHero.id,
        };
      }
      
      // 일반 공격
      return {
        type: 'attack',
        targetId: targetHero.id,
      };
    }
    
    // 적 장수가 없으면 적 병사 공격
    const targetSoldier = this.findClosestTarget(hero.position, enemySoldiers, 30);
    if (targetSoldier) {
      return {
        type: 'attack',
        targetId: targetSoldier.id,
      };
    }
    
    return { type: 'idle' };
  }
  
  /**
   * 수비수 AI: 부대 보호, 적 유인
   */
  private getSentinelAI(
    hero: TWHero,
    allySoldiers: Array<{ id: string; position: Vector2; morale: number }>,
    enemyHeroes: TWHero[]
  ): HeroAIAction {
    // 아군 근처 유지
    const allyCenter = this.getAveragePosition(allySoldiers);
    const distanceToAllies = this.getDistance(hero.position, allyCenter);
    
    if (distanceToAllies > 10) {
      return {
        type: 'move',
        targetPosition: allyCenter,
      };
    }
    
    // 적이 접근하면 도발
    const nearbyEnemy = this.findClosestHero(hero.position, enemyHeroes, 15);
    if (nearbyEnemy) {
      const tauntAbility = hero.abilities.find(a => a.id === 'taunt');
      if (tauntAbility && this.canUseAbility(hero, tauntAbility)) {
        return {
          type: 'use_ability',
          abilityId: 'taunt',
          targetPosition: hero.position,
        };
      }
      
      // 방패벽 활성화
      const shieldWall = hero.abilities.find(a => a.id === 'shield_wall');
      if (shieldWall && this.canUseAbility(hero, shieldWall)) {
        return {
          type: 'use_ability',
          abilityId: 'shield_wall',
          targetPosition: hero.position,
        };
      }
      
      return {
        type: 'attack',
        targetId: nearbyEnemy.id,
      };
    }
    
    return { type: 'idle' };
  }
  
  /**
   * 선봉 AI: 돌격, 적진 돌파
   */
  private getVanguardAI(
    hero: TWHero,
    enemyHeroes: TWHero[],
    enemySoldiers: Array<{ id: string; position: Vector2; hp: number }>
  ): HeroAIAction {
    // 돌격 버프 활성화
    if (!hero.isCharging) {
      const chargeAbility = hero.abilities.find(a => a.id === 'charge_boost');
      if (chargeAbility && this.canUseAbility(hero, chargeAbility)) {
        return {
          type: 'use_ability',
          abilityId: 'charge_boost',
        };
      }
    }
    
    // 함성 사용 (적이 많을 때)
    const nearbyEnemies = enemySoldiers.filter(s => 
      this.getDistance(hero.position, s.position) < 20
    );
    if (nearbyEnemies.length > 5) {
      const battleCry = hero.abilities.find(a => a.id === 'battle_cry');
      if (battleCry && this.canUseAbility(hero, battleCry)) {
        return {
          type: 'use_ability',
          abilityId: 'battle_cry',
          targetPosition: hero.position,
        };
      }
    }
    
    // 적 장수 돌격
    const targetHero = this.findClosestHero(hero.position, enemyHeroes, 40);
    if (targetHero) {
      const distance = this.getDistance(hero.position, targetHero.position);
      if (distance > 5) {
        hero.isCharging = true;
        hero.chargeStartTime = this.currentTime;
        return {
          type: 'charge',
          targetPosition: targetHero.position,
        };
      }
      return {
        type: 'attack',
        targetId: targetHero.id,
      };
    }
    
    // 적 병사 무리로 돌격
    if (nearbyEnemies.length > 0) {
      const targetPos = this.getAveragePosition(nearbyEnemies);
      return {
        type: 'charge',
        targetPosition: targetPos,
      };
    }
    
    return { type: 'idle' };
  }
  
  /**
   * 책사 AI: 디버프, 거리 유지
   */
  private getStrategistAI(
    hero: TWHero,
    enemyHeroes: TWHero[],
    enemySoldiers: Array<{ id: string; position: Vector2; hp: number }>
  ): HeroAIAction {
    // 적과 거리 유지
    const nearestEnemy = this.findClosestHero(hero.position, enemyHeroes, 50);
    if (nearestEnemy) {
      const distance = this.getDistance(hero.position, nearestEnemy.position);
      
      // 너무 가까우면 후퇴
      if (distance < 20) {
        const retreatDirection = Math.atan2(
          hero.position.z - nearestEnemy.position.z,
          hero.position.x - nearestEnemy.position.x
        );
        return {
          type: 'move',
          targetPosition: {
            x: hero.position.x + Math.cos(retreatDirection) * 15,
            z: hero.position.z + Math.sin(retreatDirection) * 15,
          },
        };
      }
      
      // 적정 거리에서 디버프
      if (distance < 40) {
        // 약화
        const weakenAbility = hero.abilities.find(a => a.id === 'weaken');
        if (weakenAbility && this.canUseAbility(hero, weakenAbility)) {
          return {
            type: 'use_ability',
            abilityId: 'weaken',
            targetId: nearestEnemy.id,
          };
        }
        
        // 혼란
        const confusionAbility = hero.abilities.find(a => a.id === 'confusion');
        if (confusionAbility && this.canUseAbility(hero, confusionAbility)) {
          return {
            type: 'use_ability',
            abilityId: 'confusion',
            targetId: nearestEnemy.id,
          };
        }
        
        // 둔화
        const slowAbility = hero.abilities.find(a => a.id === 'slow');
        if (slowAbility && this.canUseAbility(hero, slowAbility)) {
          return {
            type: 'use_ability',
            abilityId: 'slow',
            targetId: nearestEnemy.id,
          };
        }
      }
    }
    
    // 적 병사 무리에 디버프
    const enemyCluster = this.findDenseCluster(enemySoldiers, 15);
    if (enemyCluster) {
      const weakenAbility = hero.abilities.find(a => a.id === 'weaken');
      if (weakenAbility && this.canUseAbility(hero, weakenAbility)) {
        return {
          type: 'use_ability',
          abilityId: 'weaken',
          targetPosition: enemyCluster.position,
        };
      }
    }
    
    return { type: 'idle' };
  }
  
  /**
   * 결투 AI
   */
  private getDuelAIAction(hero: TWHero): HeroAIAction {
    const duel = this.duels.get(hero.duelId!);
    if (!duel) {
      hero.state = 'idle';
      hero.duelId = undefined;
      return { type: 'idle' };
    }
    
    // 결투 상대 찾기
    const opponentId = duel.challengerId === hero.id ? duel.defenderId : duel.challengerId;
    const opponent = this.heroes.get(opponentId);
    
    if (!opponent || opponent.state === 'dead') {
      return { type: 'idle' };
    }
    
    // 강타 사용 (무장인 경우)
    if (hero.type === 'champion') {
      const mightyStrike = hero.abilities.find(a => a.id === 'mighty_strike');
      if (mightyStrike && this.canUseAbility(hero, mightyStrike)) {
        return {
          type: 'use_ability',
          abilityId: 'mighty_strike',
          targetId: opponent.id,
        };
      }
    }
    
    // 일반 공격
    return {
      type: 'attack',
      targetId: opponent.id,
    };
  }
  
  // ========================================
  // 결투 시스템
  // ========================================
  
  /**
   * 결투 시작
   */
  startDuel(challengerId: string, defenderId: string): HeroDuel | null {
    const challenger = this.heroes.get(challengerId);
    const defender = this.heroes.get(defenderId);
    
    if (!challenger || !defender) return null;
    if (challenger.state === 'dueling' || defender.state === 'dueling') return null;
    if (challenger.state === 'dead' || defender.state === 'dead') return null;
    
    const duel: HeroDuel = {
      id: `duel-${++this.idCounter}-${Date.now()}`,
      challengerId,
      defenderId,
      state: 'approaching',
      startTime: this.currentTime,
      lastActionTime: this.currentTime,
      position: {
        x: (challenger.position.x + defender.position.x) / 2,
        z: (challenger.position.z + defender.position.z) / 2,
      },
      challengerDamageDealt: 0,
      defenderDamageDealt: 0,
      roundCount: 0,
      maxDuration: DUEL_CONFIG.maxDuration,
      interruptable: true,
    };
    
    // 상태 업데이트
    challenger.state = 'dueling';
    challenger.duelId = duel.id;
    defender.state = 'dueling';
    defender.duelId = duel.id;
    
    this.duels.set(duel.id, duel);
    return duel;
  }
  
  /**
   * 결투 업데이트
   */
  updateDuel(duelId: string, deltaTime: number): DuelUpdateResult {
    const duel = this.duels.get(duelId);
    if (!duel) return { finished: true, reason: 'not_found' };
    
    const challenger = this.heroes.get(duel.challengerId);
    const defender = this.heroes.get(duel.defenderId);
    
    if (!challenger || !defender) {
      this.endDuel(duelId, 'interrupted');
      return { finished: true, reason: 'missing_participant' };
    }
    
    // 타임아웃 체크
    if (this.currentTime - duel.startTime > duel.maxDuration) {
      this.endDuel(duelId, 'draw');
      return { finished: true, reason: 'timeout' };
    }
    
    // 사망 체크
    if (challenger.hp <= 0) {
      this.endDuel(duelId, 'defender_win', defender.id);
      return { finished: true, reason: 'challenger_dead', winnerId: defender.id };
    }
    if (defender.hp <= 0) {
      this.endDuel(duelId, 'challenger_win', challenger.id);
      return { finished: true, reason: 'defender_dead', winnerId: challenger.id };
    }
    
    // 상태별 처리
    switch (duel.state) {
      case 'approaching':
        this.updateDuelApproaching(duel, challenger, defender, deltaTime);
        break;
      case 'fighting':
        this.updateDuelFighting(duel, challenger, defender);
        break;
    }
    
    return { finished: false };
  }
  
  /**
   * 결투 접근 단계
   */
  private updateDuelApproaching(
    duel: HeroDuel,
    challenger: TWHero,
    defender: TWHero,
    deltaTime: number
  ): void {
    const distance = this.getDistance(challenger.position, defender.position);
    
    if (distance < 3) {
      // 결투 시작
      duel.state = 'fighting';
      duel.position = {
        x: (challenger.position.x + defender.position.x) / 2,
        z: (challenger.position.z + defender.position.z) / 2,
      };
      return;
    }
    
    // 서로 접근
    const speed = challenger.speed * DUEL_CONFIG.approachSpeed * (deltaTime / 1000);
    
    // 도전자 이동
    const angleToDefender = Math.atan2(
      defender.position.z - challenger.position.z,
      defender.position.x - challenger.position.x
    );
    challenger.position.x += Math.cos(angleToDefender) * speed;
    challenger.position.z += Math.sin(angleToDefender) * speed;
    challenger.facing = angleToDefender;
    
    // 수비자 이동
    const angleToChallenger = Math.atan2(
      challenger.position.z - defender.position.z,
      challenger.position.x - defender.position.x
    );
    defender.position.x += Math.cos(angleToChallenger) * speed * 0.8; // 수비자는 조금 느리게
    defender.position.z += Math.sin(angleToChallenger) * speed * 0.8;
    defender.facing = angleToChallenger;
  }
  
  /**
   * 결투 전투 단계
   */
  private updateDuelFighting(
    duel: HeroDuel,
    challenger: TWHero,
    defender: TWHero
  ): void {
    // 공격 쿨다운 체크
    if (this.currentTime - challenger.lastAttackTime >= DUEL_CONFIG.attackCooldown) {
      const damage = this.calculateHeroDamage(challenger, defender);
      defender.hp -= damage;
      defender.damageTaken += damage;
      challenger.damageDealt += damage;
      duel.challengerDamageDealt += damage;
      challenger.lastAttackTime = this.currentTime;
      duel.lastActionTime = this.currentTime;
      duel.roundCount++;
    }
    
    if (this.currentTime - defender.lastAttackTime >= DUEL_CONFIG.attackCooldown) {
      const damage = this.calculateHeroDamage(defender, challenger);
      challenger.hp -= damage;
      challenger.damageTaken += damage;
      defender.damageDealt += damage;
      duel.defenderDamageDealt += damage;
      defender.lastAttackTime = this.currentTime;
      duel.lastActionTime = this.currentTime;
    }
  }
  
  /**
   * 결투 종료
   */
  endDuel(duelId: string, outcome: DuelOutcome, winnerId?: string): void {
    const duel = this.duels.get(duelId);
    if (!duel) return;
    
    duel.state = 'finished';
    duel.outcome = outcome;
    duel.winnerId = winnerId;
    
    const challenger = this.heroes.get(duel.challengerId);
    const defender = this.heroes.get(duel.defenderId);
    
    // 상태 초기화
    if (challenger) {
      challenger.duelId = undefined;
      challenger.state = challenger.hp > 0 ? 'idle' : 'dead';
      
      if (winnerId === challenger.id) {
        challenger.kills++;
      }
    }
    
    if (defender) {
      defender.duelId = undefined;
      defender.state = defender.hp > 0 ? 'idle' : 'dead';
      
      if (winnerId === defender.id) {
        defender.kills++;
      }
    }
    
    // 결투 제거
    this.duels.delete(duelId);
  }
  
  // ========================================
  // 능력 시스템
  // ========================================
  
  /**
   * 능력 사용 가능 여부 확인
   */
  canUseAbility(hero: TWHero, ability: HeroAbility): boolean {
    // 쿨다운 체크
    if (this.currentTime - ability.lastUsedTime < ability.cooldown) {
      return false;
    }
    
    // 유형 제한 체크
    if (ability.requiredType && ability.requiredType !== hero.type) {
      return false;
    }
    
    // 능력치 제한 체크
    if (ability.minLeadership && hero.leadership < ability.minLeadership) {
      return false;
    }
    if (ability.minStrength && hero.strength < ability.minStrength) {
      return false;
    }
    if (ability.minIntelligence && hero.intelligence < ability.minIntelligence) {
      return false;
    }
    
    return true;
  }
  
  /**
   * 능력 사용
   */
  useAbility(
    hero: TWHero,
    abilityId: string,
    target?: { position?: Vector2; heroId?: string; squadId?: string }
  ): AbilityResult {
    const ability = hero.abilities.find(a => a.id === abilityId);
    if (!ability) {
      return { success: false, error: 'ability_not_found' };
    }
    
    if (!this.canUseAbility(hero, ability)) {
      return { success: false, error: 'ability_not_ready' };
    }
    
    // 지력에 따른 쿨다운 감소
    const intelligenceReduction = 1 - (hero.intelligence / 400); // 최대 25% 감소
    
    // 능력 시전
    ability.lastUsedTime = this.currentTime;
    ability.isReady = false;
    
    // 시전 시간 후 효과 적용 (간소화: 즉시 적용)
    const result = this.applyAbilityEffect(hero, ability, target);
    
    // 쿨다운 설정
    setTimeout(() => {
      ability.isReady = true;
    }, ability.cooldown * intelligenceReduction);
    
    return {
      success: true,
      effect: result,
    };
  }
  
  /**
   * 능력 효과 적용
   */
  private applyAbilityEffect(
    hero: TWHero,
    ability: HeroAbility,
    target?: { position?: Vector2; heroId?: string; squadId?: string }
  ): AbilityEffectResult {
    switch (ability.effectType) {
      case 'buff':
        return this.applyBuffEffect(hero, ability, target);
      case 'debuff':
        return this.applyDebuffEffect(hero, ability, target);
      case 'damage':
        return this.applyDamageEffect(hero, ability, target);
      case 'heal':
        return this.applyHealEffect(hero, ability);
      case 'morale_boost':
        return { type: 'morale_boost', value: ability.effectValue };
      case 'morale_damage':
        return { type: 'morale_damage', value: ability.effectValue };
      case 'taunt':
        return this.applyTauntEffect(hero, ability);
      default:
        return { type: 'unknown' };
    }
  }
  
  /**
   * 버프 효과 적용
   */
  private applyBuffEffect(
    hero: TWHero,
    ability: HeroAbility,
    target?: { position?: Vector2; heroId?: string; squadId?: string }
  ): AbilityEffectResult {
    if (!ability.buffType) {
      return { type: 'error', error: 'no_buff_type' };
    }
    
    const buff = CombatCalculator.createBuff({
      type: ability.buffType,
      value: ability.effectValue,
      isPercent: ability.effectValuePercent,
      duration: ability.duration,
      currentTime: this.currentTime,
      source: `${hero.name}:${ability.name}`,
      name: ability.nameKo,
      description: ability.description,
    });
    
    // 자신에게 버프
    if (ability.targetType === 'self') {
      hero.buffs.push(buff);
      return { type: 'buff', buff, targets: [hero.id] };
    }
    
    // 범위 버프 (외부에서 처리 필요)
    return {
      type: 'buff',
      buff,
      radius: ability.radius,
      position: target?.position ?? hero.position,
    };
  }
  
  /**
   * 디버프 효과 적용
   */
  private applyDebuffEffect(
    hero: TWHero,
    ability: HeroAbility,
    target?: { position?: Vector2; heroId?: string; squadId?: string }
  ): AbilityEffectResult {
    if (!ability.buffType) {
      return { type: 'error', error: 'no_buff_type' };
    }
    
    const debuff = CombatCalculator.createBuff({
      type: ability.buffType,
      value: ability.effectValue,
      isPercent: ability.effectValuePercent,
      duration: ability.duration,
      currentTime: this.currentTime,
      source: `${hero.name}:${ability.name}`,
      name: ability.nameKo,
      description: ability.description,
    });
    
    // 특정 장수에게 디버프
    if (target?.heroId) {
      const targetHero = this.heroes.get(target.heroId);
      if (targetHero) {
        targetHero.buffs.push(debuff);
        return { type: 'debuff', buff: debuff, targets: [target.heroId] };
      }
    }
    
    // 범위 디버프
    return {
      type: 'debuff',
      buff: debuff,
      radius: ability.radius,
      position: target?.position ?? hero.position,
      range: ability.range,
    };
  }
  
  /**
   * 피해 효과 적용
   */
  private applyDamageEffect(
    hero: TWHero,
    ability: HeroAbility,
    target?: { position?: Vector2; heroId?: string; squadId?: string }
  ): AbilityEffectResult {
    if (!target?.heroId) {
      return { type: 'error', error: 'no_target' };
    }
    
    const targetHero = this.heroes.get(target.heroId);
    if (!targetHero) {
      return { type: 'error', error: 'target_not_found' };
    }
    
    // 피해 계산
    let damage: number;
    if (ability.effectValuePercent) {
      damage = Math.round(hero.weaponDamage * ability.effectValue);
    } else {
      damage = ability.effectValue;
    }
    
    // 방어력 적용
    const armorReduction = targetHero.armor * 0.3;
    const finalDamage = Math.max(1, Math.round(damage - armorReduction));
    
    targetHero.hp -= finalDamage;
    targetHero.damageTaken += finalDamage;
    hero.damageDealt += finalDamage;
    
    if (targetHero.hp <= 0) {
      targetHero.state = 'dead';
      hero.kills++;
    }
    
    return {
      type: 'damage',
      damage: finalDamage,
      targetId: target.heroId,
    };
  }
  
  /**
   * 회복 효과 적용
   */
  private applyHealEffect(hero: TWHero, ability: HeroAbility): AbilityEffectResult {
    let healAmount: number;
    if (ability.effectValuePercent) {
      healAmount = Math.round(hero.maxHp * ability.effectValue);
    } else {
      healAmount = ability.effectValue;
    }
    
    const oldHp = hero.hp;
    hero.hp = Math.min(hero.maxHp, hero.hp + healAmount);
    const actualHeal = hero.hp - oldHp;
    
    return {
      type: 'heal',
      healAmount: actualHeal,
      targetId: hero.id,
    };
  }
  
  /**
   * 도발 효과 적용
   */
  private applyTauntEffect(hero: TWHero, ability: HeroAbility): AbilityEffectResult {
    // 도발은 외부에서 처리 (적 AI가 이 장수를 우선 공격)
    return {
      type: 'taunt',
      heroId: hero.id,
      radius: ability.radius,
      duration: ability.duration,
    };
  }
  
  // ========================================
  // 전투 계산
  // ========================================
  
  /**
   * 장수 간 데미지 계산
   */
  calculateHeroDamage(attacker: TWHero, defender: TWHero): number {
    // 기본 피해
    let damage = attacker.weaponDamage;
    
    // 방어구 관통
    const apDamage = attacker.armorPiercing;
    
    // 돌격 보너스
    if (attacker.isCharging && attacker.chargeStartTime) {
      const chargeTime = this.currentTime - attacker.chargeStartTime;
      if (chargeTime < 5000) {
        const chargeFade = 1 - chargeTime / 5000;
        damage += attacker.chargeBonus * chargeFade;
      }
    }
    
    // 버프 적용
    const attackBuff = this.getBuffMultiplier(attacker.buffs, 'damage_up', 'damage_down');
    const defenseBuff = this.getBuffMultiplier(defender.buffs, 'armor_up', 'armor_down');
    
    // 방어구 적용
    const effectiveArmor = defender.armor * defenseBuff;
    const armorReduction = effectiveArmor * 0.3;
    const effectiveDamage = Math.max(0, damage - armorReduction) + apDamage;
    
    // 최종 피해
    const finalDamage = effectiveDamage * attackBuff;
    
    // 랜덤 변동 (±15%)
    const randomMult = 0.85 + Math.random() * 0.3;
    
    return Math.max(1, Math.round(finalDamage * randomMult));
  }
  
  /**
   * 버프 배율 계산
   */
  private getBuffMultiplier(buffs: Buff[], upType: BuffType, downType: BuffType): number {
    return CombatCalculator.calculateBuffMultiplier(buffs, upType, downType);
  }
  
  // ========================================
  // 유틸리티
  // ========================================
  
  /**
   * 거리 계산
   */
  private getDistance(a: Vector2, b: Vector2): number {
    const dx = b.x - a.x;
    const dz = b.z - a.z;
    return Math.sqrt(dx * dx + dz * dz);
  }
  
  /**
   * 가장 가까운 장수 찾기
   */
  private findClosestHero(
    position: Vector2,
    heroes: TWHero[],
    maxRange: number
  ): TWHero | null {
    let closest: TWHero | null = null;
    let minDist = maxRange;
    
    for (const hero of heroes) {
      if (hero.state === 'dead') continue;
      const dist = this.getDistance(position, hero.position);
      if (dist < minDist) {
        minDist = dist;
        closest = hero;
      }
    }
    
    return closest;
  }
  
  /**
   * 가장 가까운 대상 찾기
   */
  private findClosestTarget(
    position: Vector2,
    targets: Array<{ id: string; position: Vector2 }>,
    maxRange: number
  ): { id: string; position: Vector2 } | null {
    let closest: { id: string; position: Vector2 } | null = null;
    let minDist = maxRange;
    
    for (const target of targets) {
      const dist = this.getDistance(position, target.position);
      if (dist < minDist) {
        minDist = dist;
        closest = target;
      }
    }
    
    return closest;
  }
  
  /**
   * 평균 위치 계산
   */
  private getAveragePosition(items: Array<{ position: Vector2 }>): Vector2 {
    if (items.length === 0) return { x: 0, z: 0 };
    
    let sumX = 0, sumZ = 0;
    for (const item of items) {
      sumX += item.position.x;
      sumZ += item.position.z;
    }
    
    return {
      x: sumX / items.length,
      z: sumZ / items.length,
    };
  }
  
  /**
   * 밀집 클러스터 찾기
   */
  private findDenseCluster(
    items: Array<{ position: Vector2 }>,
    radius: number
  ): { position: Vector2; count: number } | null {
    if (items.length === 0) return null;
    
    let bestPos: Vector2 | null = null;
    let maxCount = 0;
    
    for (const item of items) {
      let count = 0;
      for (const other of items) {
        if (this.getDistance(item.position, other.position) <= radius) {
          count++;
        }
      }
      if (count > maxCount) {
        maxCount = count;
        bestPos = item.position;
      }
    }
    
    if (bestPos && maxCount >= 3) {
      return { position: bestPos, count: maxCount };
    }
    
    return null;
  }
  
  // ========================================
  // 시간 관리
  // ========================================
  
  /**
   * 현재 시간 업데이트
   */
  setCurrentTime(time: number): void {
    this.currentTime = time;
  }
  
  /**
   * 버프 만료 처리
   */
  updateBuffs(): void {
    this.heroes.forEach(hero => {
      hero.buffs = CombatCalculator.filterExpiredBuffs(hero.buffs, this.currentTime);
    });
  }
  
  // ========================================
  // 공개 API
  // ========================================
  
  getHero(id: string): TWHero | undefined {
    return this.heroes.get(id);
  }
  
  getAllHeroes(): TWHero[] {
    return Array.from(this.heroes.values());
  }
  
  getHeroesByTeam(teamId: string): TWHero[] {
    return Array.from(this.heroes.values()).filter(h => 
      h.squadId.includes(teamId) // 간소화된 팀 매칭
    );
  }
  
  getDuel(id: string): HeroDuel | undefined {
    return this.duels.get(id);
  }
  
  getAllDuels(): HeroDuel[] {
    return Array.from(this.duels.values());
  }
  
  removeHero(id: string): boolean {
    return this.heroes.delete(id);
  }
  
  /**
   * 장수 부대 버프 효과 계산
   * 부대에 적용할 통솔/무력/지력 보너스 반환
   */
  getSquadBuffFromHero(hero: TWHero): {
    moraleBonus: number;      // 사기 보너스 (절대값)
    attackBonus: number;      // 공격력 배율
    defenseBonus: number;     // 방어력 배율
    damageBonus: number;      // 피해량 배율
  } {
    // 통솔: 사기 보너스 (통솔 100 = +20 사기)
    const moraleBonus = hero.leadership * 0.2;
    
    // 무력: 공격/피해 보너스 (무력 100 = +15%)
    const strengthMult = 1 + hero.strength * 0.0015;
    
    // 통솔: 방어 보너스 (통솔 100 = +10%)
    const leaderMult = 1 + hero.leadership * 0.001;
    
    return {
      moraleBonus,
      attackBonus: strengthMult,
      defenseBonus: leaderMult,
      damageBonus: strengthMult,
    };
  }
}

// ========================================
// AI 액션 타입
// ========================================

export interface HeroAIAction {
  type: 'idle' | 'move' | 'attack' | 'charge' | 'use_ability' | 'retreat';
  targetPosition?: Vector2;
  targetId?: string;
  abilityId?: string;
}

export interface DuelUpdateResult {
  finished: boolean;
  reason?: string;
  winnerId?: string;
}

export interface AbilityResult {
  success: boolean;
  error?: string;
  effect?: AbilityEffectResult;
}

export interface AbilityEffectResult {
  type: string;
  buff?: Buff;
  damage?: number;
  healAmount?: number;
  targets?: string[];
  targetId?: string;
  heroId?: string;
  radius?: number;
  position?: Vector2;
  range?: number;
  duration?: number;
  value?: number;
  error?: string;
}

// ========================================
// 기본 인스턴스 생성 헬퍼
// ========================================

export function createHeroSystem(): HeroSystem {
  return new HeroSystem();
}

export default HeroSystem;





