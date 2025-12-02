/**
 * 유닛 어댑터
 * 
 * 병종 ID (units.json)와 복셀 유닛 스펙 간의 변환을 담당합니다.
 * 
 * @module UnitAdapter
 */

import {
  VOXEL_UNIT_DATABASE,
  VoxelUnitSpec,
} from '@/components/battle/units/db/VoxelUnitDefinitions';
import {
  getVoxelUnitSpec,
  getUnitCategory,
  getAttackType,
  isValidUnitId,
  getDefaultUnitIdByType,
  UNIT_ID_RANGES,
  type VoxelCategory,
  type AttackType,
  type UnitJsonType,
} from '../CrewTypeVoxelMapping';
import type { UnitStats, VoxelSquad } from '../types/BattleTypes';

// ========================================
// 상수 정의
// ========================================

/** 병력 → 유닛 수 변환 비율 (25명당 1유닛) */
const CREW_TO_UNIT_RATIO = 25;

/** 최소 유닛 수 */
const MIN_UNIT_COUNT = 1;

/** 최대 유닛 수 (성능 고려) */
const MAX_UNIT_COUNT = 100;

/** 카테고리별 기본 스탯 */
const CATEGORY_BASE_STATS: Record<VoxelCategory, UnitStats> = {
  castle: {
    attack: 0,
    defense: 100,
    speed: 0,
    range: 1,
    chargeBonus: 0,
    antiCavalryBonus: 0,
  },
  infantry: {
    attack: 30,
    defense: 40,
    speed: 25,
    range: 1,
    chargeBonus: 5,
    antiCavalryBonus: 0,
  },
  ranged: {
    attack: 25,
    defense: 20,
    speed: 22,
    range: 80,
    chargeBonus: 0,
    antiCavalryBonus: 0,
  },
  cavalry: {
    attack: 35,
    defense: 30,
    speed: 45,
    range: 1,
    chargeBonus: 25,
    antiCavalryBonus: -10,
  },
  wizard: {
    attack: 20,
    defense: 15,
    speed: 20,
    range: 60,
    chargeBonus: 0,
    antiCavalryBonus: 0,
  },
  siege: {
    attack: 60,
    defense: 10,
    speed: 8,
    range: 120,
    chargeBonus: 0,
    antiCavalryBonus: 0,
  },
  regional: {
    attack: 28,
    defense: 35,
    speed: 25,
    range: 1,
    chargeBonus: 5,
    antiCavalryBonus: 0,
  },
};

/** 특수 유닛별 스탯 보정 */
const UNIT_STAT_MODIFIERS: Partial<Record<number, Partial<UnitStats>>> = {
  // 보병
  1106: { defense: 20, antiCavalryBonus: 10 },   // 대방패병: 방어력+, 대기병+
  1107: { attack: 15, defense: -10 },             // 양손도끼병: 공격+, 방어-
  1108: { antiCavalryBonus: 30 },                 // 장창병: 대기병 특화
  1109: { speed: 10, attack: 5 },                 // 쌍검병: 속도+
  1117: { attack: 10, defense: 15 },              // 함진영: 정예 보병
  1120: { attack: 10, defense: 10 },              // 금군: 황실 근위대
  1121: { attack: 20, antiCavalryBonus: 20 },     // 참마도수: 대기병 특화
  
  // 궁병
  1203: { attack: -5, range: -20 },               // 연노병: 연사, 사거리 짧음
  1204: { attack: 15, speed: -5 },                // 강노병: 강력하지만 느림
  1205: { attack: 10, range: 10 },                // 흑룡대: 정예 궁병
  1211: { attack: 10 },                           // 화염궁병: 추가 피해
  
  // 기병
  1301: { attack: 10, defense: 10, chargeBonus: 10 },  // 중기병: 전체 강화
  1304: { attack: 15, chargeBonus: 15 },               // 호표기: 돌격 특화
  1305: { defense: 25, chargeBonus: 20, speed: -10 },  // 서량철기: 중장 카타프랙트
  1306: { range: 50, attack: 5 },                      // 백마의종: 궁기병
  
  // 귀병
  1403: { attack: 10 },                           // 흑귀병: 저주 공격
  1407: { attack: 15, range: 20 },                // 천귀병: 번개 마법
  1420: { attack: 20, range: 10 },                // 화공대: 화염 공격
  
  // 공성
  1501: { attack: 30, range: 30 },                // 벽력거: 투석기
  1503: { attack: 20, range: 20 },                // 연노거: 발리스타
  1507: { attack: 35, range: 30 },                // 화염투석기: 화염 투석
};

// ========================================
// 유닛 ID 변환
// ========================================

/**
 * 병종 ID를 복셀 유닛 스펙으로 변환
 * units.json ID와 VoxelUnitDefinitions ID가 1:1 매핑
 */
export function convertUnitId(crewType: number): VoxelUnitSpec | null {
  // 직접 조회 (1:1 매핑)
  const spec = getVoxelUnitSpec(crewType);
  
  if (spec) {
    return spec;
  }
  
  // 유효하지 않은 ID인 경우 기본 보병 반환
  console.warn(`[UnitAdapter] 알 수 없는 병종 ID: ${crewType}, 기본 보병으로 대체`);
  return getVoxelUnitSpec(1102) || null;  // 정규보병
}

/**
 * 유닛 ID가 유효한 범위인지 확인
 */
export function isValidUnit(unitId: number): boolean {
  return isValidUnitId(unitId);
}

/**
 * 유닛 타입 문자열로 기본 ID 가져오기
 */
export function getDefaultUnitId(type: UnitJsonType): number {
  return getDefaultUnitIdByType(type);
}

// ========================================
// 유닛 카테고리 및 공격 타입
// ========================================

/**
 * 유닛 ID로 카테고리 가져오기
 */
export function getUnitCategoryById(unitId: number): VoxelCategory {
  const category = getUnitCategory(unitId);
  return category || 'infantry';
}

/**
 * 유닛 ID로 공격 타입 가져오기
 */
export function getUnitAttackType(unitId: number): AttackType {
  return getAttackType(unitId);
}

/**
 * ID 범위로 카테고리 추론
 */
export function inferCategoryFromId(unitId: number): VoxelCategory {
  if (unitId === 1000) return 'castle';
  if (unitId >= 1100 && unitId <= 1128) return 'infantry';
  if (unitId >= 1200 && unitId <= 1215) return 'ranged';
  if (unitId >= 1300 && unitId <= 1322) return 'cavalry';
  if (unitId >= 1400 && unitId <= 1424) return 'wizard';
  if (unitId >= 1450 && unitId <= 1472) return 'regional';
  if (unitId >= 1500 && unitId <= 1511) return 'siege';
  return 'infantry';
}

// ========================================
// 부대 크기 계산
// ========================================

/**
 * 병력 수를 복셀 유닛 수로 변환
 */
export function calculateSquadSize(
  crew: number,
  unitType?: VoxelCategory
): number {
  // 기본 변환
  let unitCount = Math.ceil(crew / CREW_TO_UNIT_RATIO);
  
  // 카테고리별 조정
  if (unitType) {
    switch (unitType) {
      case 'cavalry':
        // 기병은 더 적은 수
        unitCount = Math.ceil(crew / (CREW_TO_UNIT_RATIO * 1.5));
        break;
      case 'siege':
        // 공성병기는 더욱 적은 수
        unitCount = Math.ceil(crew / (CREW_TO_UNIT_RATIO * 3));
        break;
      case 'wizard':
        // 귀병도 적은 수
        unitCount = Math.ceil(crew / (CREW_TO_UNIT_RATIO * 2));
        break;
      case 'castle':
        // 성벽은 1개
        unitCount = 1;
        break;
    }
  }
  
  // 범위 제한
  return Math.max(MIN_UNIT_COUNT, Math.min(MAX_UNIT_COUNT, unitCount));
}

/**
 * 복셀 유닛 수를 원래 병력 수로 역산
 */
export function calculateCrewFromUnits(
  unitCount: number,
  unitType?: VoxelCategory
): number {
  let ratio = CREW_TO_UNIT_RATIO;
  
  if (unitType) {
    switch (unitType) {
      case 'cavalry':
        ratio = CREW_TO_UNIT_RATIO * 1.5;
        break;
      case 'siege':
        ratio = CREW_TO_UNIT_RATIO * 3;
        break;
      case 'wizard':
        ratio = CREW_TO_UNIT_RATIO * 2;
        break;
      case 'castle':
        return 0;
    }
  }
  
  return Math.round(unitCount * ratio);
}

// ========================================
// 유닛 스탯 계산
// ========================================

/**
 * 유닛 기본 스탯 가져오기
 */
export function getUnitBaseStats(unitId: number): UnitStats {
  const category = getUnitCategoryById(unitId);
  const baseStats = { ...CATEGORY_BASE_STATS[category] };
  
  // 특수 유닛 보정 적용
  const modifiers = UNIT_STAT_MODIFIERS[unitId];
  if (modifiers) {
    if (modifiers.attack) baseStats.attack += modifiers.attack;
    if (modifiers.defense) baseStats.defense += modifiers.defense;
    if (modifiers.speed) baseStats.speed += modifiers.speed;
    if (modifiers.range) baseStats.range += modifiers.range;
    if (modifiers.chargeBonus) baseStats.chargeBonus += modifiers.chargeBonus;
    if (modifiers.antiCavalryBonus) baseStats.antiCavalryBonus += modifiers.antiCavalryBonus;
  }
  
  return baseStats;
}

/**
 * 훈련도에 따른 스탯 보정
 */
export function applyTrainingModifier(stats: UnitStats, trainLevel: number): UnitStats {
  // 훈련도 0~100 → 0.8~1.2 배율
  const modifier = 0.8 + (trainLevel / 100) * 0.4;
  
  return {
    attack: Math.round(stats.attack * modifier),
    defense: Math.round(stats.defense * modifier),
    speed: Math.round(stats.speed * (0.9 + (trainLevel / 100) * 0.2)), // 속도는 변동 적음
    range: stats.range, // 사거리는 고정
    chargeBonus: Math.round(stats.chargeBonus * modifier),
    antiCavalryBonus: Math.round(stats.antiCavalryBonus * modifier),
  };
}

/**
 * 경험치 레벨 계산 (훈련도 기반)
 */
export function calculateExperienceLevel(trainLevel: number): number {
  // 훈련도 0~100 → 경험치 레벨 0~9
  return Math.min(9, Math.floor(trainLevel / 11));
}

// ========================================
// 복셀 부대 생성
// ========================================

/**
 * API 데이터에서 VoxelSquad 생성
 */
export function createVoxelSquad(
  crewType: number,
  crewCount: number,
  morale: number = 100,
  trainLevel: number = 50,
  squadId?: string
): VoxelSquad | null {
  const unitSpec = convertUnitId(crewType);
  if (!unitSpec) {
    return null;
  }
  
  const category = getUnitCategoryById(crewType);
  const attackType = getUnitAttackType(crewType);
  const unitCount = calculateSquadSize(crewCount, category);
  const baseStats = getUnitBaseStats(crewType);
  const trainedStats = applyTrainingModifier(baseStats, trainLevel);
  const expLevel = calculateExperienceLevel(trainLevel);
  
  return {
    squadId: squadId || `squad_${crewType}_${Date.now()}`,
    name: unitSpec.name,
    unitTypeId: crewType,
    unitSpec,
    category,
    attackType,
    unitCount,
    originalCrewCount: crewCount,
    baseStats: trainedStats,
    morale,
    experienceLevel: expLevel,
  };
}

// ========================================
// 유닛 정보 조회
// ========================================

/**
 * 유닛 이름 가져오기
 */
export function getUnitName(unitId: number): string {
  const spec = getVoxelUnitSpec(unitId);
  return spec?.name || `유닛 ${unitId}`;
}

/**
 * 유닛 영문 이름 가져오기
 */
export function getUnitNameEn(unitId: number): string {
  const spec = getVoxelUnitSpec(unitId);
  return spec?.nameEn || `Unit ${unitId}`;
}

/**
 * 유닛 설명 가져오기
 */
export function getUnitDescription(unitId: number): string {
  const spec = getVoxelUnitSpec(unitId);
  return spec?.description || '';
}

/**
 * 카테고리별 모든 유닛 가져오기
 */
export function getUnitsByCategory(category: VoxelCategory): VoxelUnitSpec[] {
  const range = UNIT_ID_RANGES[category];
  if (!range) return [];
  
  const units: VoxelUnitSpec[] = [];
  for (let id = range.min; id <= range.max; id++) {
    const spec = VOXEL_UNIT_DATABASE[id];
    if (spec) {
      units.push(spec);
    }
  }
  
  return units;
}

/**
 * 모든 유효한 유닛 ID 목록 가져오기
 */
export function getAllValidUnitIds(): number[] {
  return Object.keys(VOXEL_UNIT_DATABASE).map(Number).sort((a, b) => a - b);
}

// ========================================
// 유닛 비교 및 상성
// ========================================

/** 상성 보너스 매트릭스 */
const COUNTER_MATRIX: Record<VoxelCategory, Partial<Record<VoxelCategory, number>>> = {
  infantry: {
    ranged: 10,     // 보병 → 궁병 유리
    cavalry: -15,   // 보병 → 기병 불리
  },
  ranged: {
    cavalry: 10,    // 궁병 → 기병 유리
    infantry: -5,   // 궁병 → 보병 약간 불리
    siege: 5,       // 궁병 → 공성 유리
  },
  cavalry: {
    ranged: 15,     // 기병 → 궁병 매우 유리
    wizard: 10,     // 기병 → 귀병 유리
    siege: 20,      // 기병 → 공성 매우 유리
  },
  wizard: {
    infantry: 10,   // 귀병 → 보병 유리
    siege: -10,     // 귀병 → 공성 불리
  },
  siege: {
    castle: 30,     // 공성 → 성벽 매우 유리
    infantry: 5,    // 공성 → 보병 유리
  },
  castle: {
    ranged: 10,     // 성벽 → 궁병 유리 (방어)
    cavalry: 15,    // 성벽 → 기병 유리 (방어)
  },
  regional: {},     // 지역병은 특별한 상성 없음
};

/**
 * 상성 보너스 계산
 */
export function calculateCounterBonus(
  attackerCategory: VoxelCategory,
  defenderCategory: VoxelCategory
): number {
  return COUNTER_MATRIX[attackerCategory]?.[defenderCategory] || 0;
}

/**
 * 유닛 전투력 점수 계산 (AI용)
 */
export function calculateUnitPowerScore(
  unitId: number,
  crewCount: number,
  morale: number = 100,
  trainLevel: number = 50
): number {
  const category = getUnitCategoryById(unitId);
  const stats = getUnitBaseStats(unitId);
  const trainedStats = applyTrainingModifier(stats, trainLevel);
  
  // 기본 전투력 = 공격 + 방어 + 속도/2
  const basePower = trainedStats.attack + trainedStats.defense + trainedStats.speed / 2;
  
  // 병력 수 반영
  const crewMultiplier = Math.sqrt(crewCount / 100);
  
  // 사기 반영
  const moraleMultiplier = morale / 100;
  
  // 카테고리별 가중치
  const categoryWeight: Record<VoxelCategory, number> = {
    castle: 2.0,
    infantry: 1.0,
    ranged: 1.1,
    cavalry: 1.3,
    wizard: 1.2,
    siege: 0.8,
    regional: 1.0,
  };
  
  return Math.round(
    basePower * crewMultiplier * moraleMultiplier * categoryWeight[category]
  );
}





