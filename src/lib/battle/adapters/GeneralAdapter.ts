/**
 * 장수 어댑터
 * 
 * 장수 데이터의 변환과 스탯 보정 계산을 담당합니다.
 * 통솔/무력/지력 → 부대 스탯 보정
 * 특기 → 특수 효과 적용
 * 아이템 → 시각적 변형 및 스탯 보정
 * 
 * @module GeneralAdapter
 */

import type {
  ApiGeneral,
  ApiItem,
  VoxelGeneralStats,
  VoxelForce,
  ItemBonuses,
  UnitStats,
  SpecialSkillEffect,
  SkillEffectType,
  SkillTarget,
  VoxelCategory,
} from '../types/BattleTypes';

// ========================================
// 상수 정의
// ========================================

/** 기본 스탯 기준점 (50이 평균) */
const BASE_STAT = 50;

/** 스탯 보정 계수 */
const STAT_MODIFIER_SCALE = 0.01; // 1포인트당 1% 보정

/** 최대/최소 보정 범위 */
const MAX_MODIFIER = 2.0;  // +100%
const MIN_MODIFIER = 0.5;  // -50%

/** 아이템 등급별 보너스 배율 */
const ITEM_GRADE_MULTIPLIER: Record<number, number> = {
  0: 0,     // 일반
  1: 0.05,  // 5%
  2: 0.10,  // 10%
  3: 0.15,  // 15%
  4: 0.20,  // 20%
  5: 0.30,  // 30% (전설)
};

// ========================================
// 장수 스탯 변환
// ========================================

/**
 * API 장수 데이터를 복셀 장수 스탯으로 변환
 */
export function convertGeneralStats(general: ApiGeneral): VoxelGeneralStats {
  const itemBonuses = calculateItemBonuses(general.weapon, general.armor, general.horse);
  
  return {
    generalId: general.no,
    name: general.name,
    leadershipModifier: calculateModifier(general.leadership),
    strengthModifier: calculateModifier(general.strength),
    intelligenceModifier: calculateModifier(general.intel),
    specialSkillId: general.specialId,
    specialSkillName: general.specialName,
    itemBonuses,
  };
}

/**
 * 능력치를 보정 배율로 변환
 * 능력치 50 → 1.0 (기준)
 * 능력치 100 → 1.5 (최대)
 * 능력치 1 → 0.51 (최소)
 */
export function calculateModifier(stat: number): number {
  const difference = stat - BASE_STAT;
  const modifier = 1 + (difference * STAT_MODIFIER_SCALE);
  return Math.max(MIN_MODIFIER, Math.min(MAX_MODIFIER, modifier));
}

/**
 * 보정 배율을 퍼센트 문자열로 변환 (UI용)
 */
export function modifierToPercentString(modifier: number): string {
  const percent = Math.round((modifier - 1) * 100);
  return percent >= 0 ? `+${percent}%` : `${percent}%`;
}

// ========================================
// 아이템 보정 계산
// ========================================

/**
 * 아이템 보정치 계산
 */
export function calculateItemBonuses(
  weapon?: ApiItem,
  armor?: ApiItem,
  horse?: ApiItem
): ItemBonuses {
  let attackBonus = 0;
  let defenseBonus = 0;
  let speedBonus = 0;
  let isMounted = false;
  let mountGrade = 0;
  
  // 무기 보정 (공격력 영향)
  if (weapon) {
    const weaponGrade = weapon.grade ?? 0;
    attackBonus += ITEM_GRADE_MULTIPLIER[weaponGrade] || 0;
    if (weapon.bonus) {
      attackBonus += weapon.bonus * 0.01;
    }
  }
  
  // 방어구 보정 (방어력 영향)
  if (armor) {
    const armorGrade = armor.grade ?? 0;
    defenseBonus += ITEM_GRADE_MULTIPLIER[armorGrade] || 0;
    if (armor.bonus) {
      defenseBonus += armor.bonus * 0.01;
    }
  }
  
  // 기마 보정 (속도 및 기마 여부)
  if (horse) {
    isMounted = true;
    const horseGrade = horse.grade ?? 0;
    mountGrade = horseGrade;
    speedBonus += ITEM_GRADE_MULTIPLIER[horseGrade] || 0;
    if (horse.bonus) {
      speedBonus += horse.bonus * 0.01;
    }
  }
  
  return {
    attackBonus: Math.round(attackBonus * 100) / 100,
    defenseBonus: Math.round(defenseBonus * 100) / 100,
    speedBonus: Math.round(speedBonus * 100) / 100,
    isMounted,
    mountGrade,
  };
}

// ========================================
// 통솔력 보정 적용
// ========================================

/**
 * 통솔력 보정을 유닛 스탯에 적용
 * 통솔력은 사기, 이동속도, 진형 유지에 영향
 */
export function applyLeadershipBonus(
  stats: UnitStats,
  leadershipModifier: number
): UnitStats {
  return {
    ...stats,
    // 통솔력은 속도에 영향 (진군 속도)
    speed: Math.round(stats.speed * (0.8 + leadershipModifier * 0.2)),
  };
}

/**
 * 통솔력에 따른 사기 보정 계산
 */
export function calculateMoraleBonus(leadershipModifier: number): number {
  // 통솔력 보정 → 사기 보너스 (최대 ±20)
  return Math.round((leadershipModifier - 1) * 40);
}

/**
 * 통솔력에 따른 부대 회복 속도 계산
 */
export function calculateRallySpeed(leadershipModifier: number): number {
  // 통솔력이 높으면 붕괴 후 재집결이 빠름
  return Math.round(leadershipModifier * 100);
}

// ========================================
// 무력 보정 적용
// ========================================

/**
 * 무력 보정을 유닛 스탯에 적용
 * 무력은 공격력, 방어력에 영향
 */
export function applyStrengthBonus(
  stats: UnitStats,
  strengthModifier: number
): UnitStats {
  return {
    ...stats,
    attack: Math.round(stats.attack * strengthModifier),
    defense: Math.round(stats.defense * (0.5 + strengthModifier * 0.5)),
    chargeBonus: Math.round(stats.chargeBonus * strengthModifier),
  };
}

// ========================================
// 지력 보정 적용
// ========================================

/**
 * 지력 보정을 유닛 스탯에 적용
 * 지력은 원거리/마법 공격력, 특수능력에 영향
 */
export function applyIntelligenceBonus(
  stats: UnitStats,
  intelligenceModifier: number,
  isRangedOrMagic: boolean
): UnitStats {
  if (isRangedOrMagic) {
    return {
      ...stats,
      attack: Math.round(stats.attack * intelligenceModifier),
      range: Math.round(stats.range * (0.8 + intelligenceModifier * 0.2)),
    };
  }
  return stats;
}

/**
 * 지력에 따른 특수능력 쿨다운 보정 계산
 */
export function calculateAbilityCooldownReduction(intelligenceModifier: number): number {
  // 지력이 높으면 쿨다운 감소 (최대 30% 감소)
  return Math.min(0.3, (intelligenceModifier - 1) * 0.6);
}

// ========================================
// 특기 시스템
// ========================================

/** 특기 데이터베이스 */
const SPECIAL_SKILLS: Record<number, SpecialSkillEffect> = {
  // 공격 특기
  1: { skillId: 1, skillName: '맹공', effectType: 'attack_bonus', value: 15, target: 'squad' },
  2: { skillId: 2, skillName: '돌격', effectType: 'charge_bonus', value: 25, target: 'squad' },
  3: { skillId: 3, skillName: '궁신', effectType: 'attack_bonus', value: 20, target: 'squad', condition: { type: 'enemy_type', value: 'ranged' } },
  
  // 방어 특기
  10: { skillId: 10, skillName: '철벽', effectType: 'defense_bonus', value: 20, target: 'squad' },
  11: { skillId: 11, skillName: '방진', effectType: 'anti_cavalry', value: 30, target: 'squad' },
  12: { skillId: 12, skillName: '불굴', effectType: 'morale_bonus', value: 15, target: 'squad' },
  
  // 이동 특기
  20: { skillId: 20, skillName: '신속', effectType: 'speed_bonus', value: 20, target: 'squad' },
  21: { skillId: 21, skillName: '기습', effectType: 'attack_bonus', value: 30, target: 'squad', condition: { type: 'morale', value: 100 } },
  
  // 지형 특기
  30: { skillId: 30, skillName: '산전', effectType: 'terrain_bonus', value: 20, target: 'squad', condition: { type: 'terrain', value: 'hills' } },
  31: { skillId: 31, skillName: '숲전', effectType: 'terrain_bonus', value: 20, target: 'squad', condition: { type: 'terrain', value: 'forest' } },
  32: { skillId: 32, skillName: '수전', effectType: 'terrain_bonus', value: 25, target: 'squad', condition: { type: 'terrain', value: 'naval' } },
  
  // 날씨 특기
  40: { skillId: 40, skillName: '청천', effectType: 'weather_immunity', value: 100, target: 'squad', condition: { type: 'weather', value: 'rain' } },
  41: { skillId: 41, skillName: '설중', effectType: 'weather_immunity', value: 100, target: 'squad', condition: { type: 'weather', value: 'snow' } },
  
  // 특수 특기
  50: { skillId: 50, skillName: '화공', effectType: 'damage_aura', value: 10, target: 'enemy' },
  51: { skillId: 51, skillName: '치료', effectType: 'heal', value: 5, target: 'all_allies' },
  52: { skillId: 52, skillName: '고무', effectType: 'morale_bonus', value: 10, target: 'all_allies' },
};

/**
 * 특기 효과 가져오기
 */
export function getSpecialSkillEffect(skillId: number): SpecialSkillEffect | null {
  return SPECIAL_SKILLS[skillId] || null;
}

/**
 * 특기를 군대에 적용
 */
export function applySpecialSkill(
  force: VoxelForce,
  skillId?: number
): void {
  if (!skillId) return;
  
  const skill = getSpecialSkillEffect(skillId);
  if (!skill) return;
  
  // 부대별로 특기 효과 적용
  force.squads.forEach(squad => {
    applySkillToSquad(squad, skill);
  });
}

/**
 * 개별 부대에 특기 효과 적용
 */
function applySkillToSquad(
  squad: { baseStats: UnitStats; morale: number },
  skill: SpecialSkillEffect
): void {
  const { effectType, value, target } = skill;
  
  if (target !== 'squad' && target !== 'all_allies' && target !== 'self') {
    return;
  }
  
  switch (effectType) {
    case 'attack_bonus':
      squad.baseStats.attack = Math.round(squad.baseStats.attack * (1 + value / 100));
      break;
    case 'defense_bonus':
      squad.baseStats.defense = Math.round(squad.baseStats.defense * (1 + value / 100));
      break;
    case 'speed_bonus':
      squad.baseStats.speed = Math.round(squad.baseStats.speed * (1 + value / 100));
      break;
    case 'morale_bonus':
      squad.morale = Math.min(100, squad.morale + value);
      break;
    case 'charge_bonus':
      squad.baseStats.chargeBonus = Math.round(squad.baseStats.chargeBonus + value);
      break;
    case 'anti_cavalry':
      squad.baseStats.antiCavalryBonus = Math.round(squad.baseStats.antiCavalryBonus + value);
      break;
  }
}

// ========================================
// 아이템 효과 적용
// ========================================

/**
 * 아이템 효과를 군대에 적용
 */
export function applyItemEffects(
  force: VoxelForce,
  itemBonuses: ItemBonuses
): void {
  force.squads.forEach(squad => {
    // 공격력 보정
    if (itemBonuses.attackBonus > 0) {
      squad.baseStats.attack = Math.round(
        squad.baseStats.attack * (1 + itemBonuses.attackBonus)
      );
    }
    
    // 방어력 보정
    if (itemBonuses.defenseBonus > 0) {
      squad.baseStats.defense = Math.round(
        squad.baseStats.defense * (1 + itemBonuses.defenseBonus)
      );
    }
    
    // 속도 보정 (기마가 있는 경우)
    if (itemBonuses.speedBonus > 0) {
      squad.baseStats.speed = Math.round(
        squad.baseStats.speed * (1 + itemBonuses.speedBonus)
      );
    }
  });
}

// ========================================
// 종합 스탯 보정
// ========================================

/**
 * 모든 장수 보정을 유닛 스탯에 적용
 */
export function applyAllGeneralBonuses(
  stats: UnitStats,
  generalStats: VoxelGeneralStats,
  category: VoxelCategory
): UnitStats {
  let modifiedStats = { ...stats };
  
  // 통솔력 보정
  modifiedStats = applyLeadershipBonus(modifiedStats, generalStats.leadershipModifier);
  
  // 무력 보정
  modifiedStats = applyStrengthBonus(modifiedStats, generalStats.strengthModifier);
  
  // 지력 보정 (원거리/마법 유닛만)
  const isRangedOrMagic = category === 'ranged' || category === 'wizard';
  modifiedStats = applyIntelligenceBonus(
    modifiedStats,
    generalStats.intelligenceModifier,
    isRangedOrMagic
  );
  
  // 아이템 보정
  const { itemBonuses } = generalStats;
  if (itemBonuses.attackBonus > 0) {
    modifiedStats.attack = Math.round(modifiedStats.attack * (1 + itemBonuses.attackBonus));
  }
  if (itemBonuses.defenseBonus > 0) {
    modifiedStats.defense = Math.round(modifiedStats.defense * (1 + itemBonuses.defenseBonus));
  }
  if (itemBonuses.speedBonus > 0) {
    modifiedStats.speed = Math.round(modifiedStats.speed * (1 + itemBonuses.speedBonus));
  }
  
  return modifiedStats;
}

// ========================================
// 유틸리티 함수
// ========================================

/**
 * 장수 전투력 점수 계산
 */
export function calculateGeneralPowerScore(general: ApiGeneral): number {
  const leadershipScore = general.leadership * 1.2;
  const strengthScore = general.strength * 1.5;
  const intelScore = general.intel * 1.0;
  
  let itemScore = 0;
  if (general.weapon) {
    itemScore += (general.weapon.grade ?? 0) * 10;
  }
  if (general.armor) {
    itemScore += (general.armor.grade ?? 0) * 8;
  }
  if (general.horse) {
    itemScore += (general.horse.grade ?? 0) * 6;
  }
  
  // 특기 보너스
  const specialBonus = general.specialId ? 20 : 0;
  
  return Math.round(leadershipScore + strengthScore + intelScore + itemScore + specialBonus);
}

/**
 * 장수 스탯 요약 문자열 생성 (UI용)
 */
export function getGeneralStatsSummary(general: ApiGeneral): string {
  return `통:${general.leadership} 무:${general.strength} 지:${general.intel}`;
}

/**
 * 장수 아이템 요약 문자열 생성 (UI용)
 */
export function getGeneralItemsSummary(general: ApiGeneral): string {
  const items: string[] = [];
  if (general.weapon) items.push(`무:${general.weapon.name}`);
  if (general.armor) items.push(`갑:${general.armor.name}`);
  if (general.horse) items.push(`마:${general.horse.name}`);
  return items.join(' ');
}





