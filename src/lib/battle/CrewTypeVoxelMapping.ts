/**
 * 본게임 병종(units.json)과 복셀 유닛(VoxelUnitDefinitions) 매핑
 * 
 * ★ 중요: units.json의 ID와 VoxelUnitDefinitions.ts의 ID가 1:1로 일치합니다!
 * 
 * 유닛 ID 범위:
 * - 1000: 성벽 (CASTLE)
 * - 1100-1128: 보병 (FOOTMAN)
 * - 1200-1215: 궁병 (ARCHER)
 * - 1300-1322: 기병 (CAVALRY)
 * - 1400-1424: 귀병 (WIZARD)
 * - 1450-1472: 지역병/이민족 (FOOTMAN/ARCHER/CAVALRY)
 * - 1500-1511: 공성병기 (SIEGE)
 * 
 * units.json의 type 필드:
 * - CASTLE: 성벽
 * - FOOTMAN: 보병
 * - ARCHER: 궁병
 * - CAVALRY: 기병
 * - WIZARD: 귀병
 * - SIEGE: 공성
 */

import { VOXEL_UNIT_DATABASE, VoxelUnitSpec } from '@/components/battle/units/db/VoxelUnitDefinitions';

// units.json의 type 필드 -> 복셀 카테고리 매핑
export type UnitJsonType = 'CASTLE' | 'FOOTMAN' | 'ARCHER' | 'CAVALRY' | 'WIZARD' | 'SIEGE';
export type VoxelCategory = 'castle' | 'infantry' | 'ranged' | 'cavalry' | 'wizard' | 'siege' | 'regional';

export const UNIT_TYPE_TO_VOXEL_CATEGORY: Record<UnitJsonType, VoxelCategory> = {
  CASTLE: 'castle',
  FOOTMAN: 'infantry',
  ARCHER: 'ranged',
  CAVALRY: 'cavalry',
  WIZARD: 'wizard',
  SIEGE: 'siege',
};

// 복셀 카테고리 -> units.json type 역매핑
export const VOXEL_CATEGORY_TO_UNIT_TYPE: Record<VoxelCategory, UnitJsonType> = {
  castle: 'CASTLE',
  infantry: 'FOOTMAN',
  ranged: 'ARCHER',
  cavalry: 'CAVALRY',
  wizard: 'WIZARD',
  siege: 'SIEGE',
  regional: 'FOOTMAN', // 지역병은 기본적으로 FOOTMAN으로 취급
};

// 유닛 ID 범위 정의
export const UNIT_ID_RANGES = {
  castle: { min: 1000, max: 1000 },
  infantry: { min: 1100, max: 1128 },
  ranged: { min: 1200, max: 1215 },
  cavalry: { min: 1300, max: 1322 },
  wizard: { min: 1400, max: 1424 },
  regional: { min: 1450, max: 1472 },
  siege: { min: 1500, max: 1511 },
};

/**
 * 유닛 ID로 복셀 유닛 스펙 가져오기
 * units.json ID와 VoxelUnitDefinitions ID가 동일하므로 직접 조회
 */
export function getVoxelUnitSpec(unitId: number): VoxelUnitSpec | undefined {
  return VOXEL_UNIT_DATABASE[unitId];
}

/**
 * 유닛 ID가 유효한지 확인
 */
export function isValidUnitId(unitId: number): boolean {
  return unitId in VOXEL_UNIT_DATABASE;
}

/**
 * 유닛 ID로 카테고리 가져오기
 */
export function getUnitCategory(unitId: number): VoxelCategory | undefined {
  const spec = VOXEL_UNIT_DATABASE[unitId];
  return spec?.category as VoxelCategory | undefined;
}

/**
 * 유닛 타입(units.json type)으로 기본 유닛 ID 가져오기
 */
export function getDefaultUnitIdByType(type: UnitJsonType): number {
  switch (type) {
    case 'CASTLE': return 1000;
    case 'FOOTMAN': return 1102; // 정규보병
    case 'ARCHER': return 1201; // 장궁병
    case 'CAVALRY': return 1300; // 경기병
    case 'WIZARD': return 1400; // 귀병
    case 'SIEGE': return 1500; // 충차
    default: return 1102;
  }
}

/**
 * 카테고리별 모든 유닛 ID 가져오기
 */
export function getUnitIdsByCategory(category: VoxelCategory): number[] {
  return Object.entries(VOXEL_UNIT_DATABASE)
    .filter(([, spec]) => spec.category === category)
    .map(([id]) => Number(id))
    .sort((a, b) => a - b);
}

/**
 * 복셀 엔진용 카테고리 문자열 가져오기 (PhaserVoxelEngine 호환)
 * 기존 데모에서 사용하던 카테고리 문자열과 호환
 */
export function getVoxelEngineCategory(unitId: number): string {
  const spec = VOXEL_UNIT_DATABASE[unitId];
  if (!spec) return 'ji_infantry';
  
  // 복셀 엔진에서 사용하는 카테고리 문자열로 변환
  switch (spec.category) {
    case 'infantry':
      // 무기 타입에 따라 세분화
      if (spec.weapon?.type?.includes('spear') || spec.weapon?.type?.includes('pike')) {
        return 'ji_infantry';
      }
      if (spec.weapon?.type?.includes('halberd') || spec.weapon?.type === 'ji') {
        return 'halberd_infantry';
      }
      return 'sword_infantry';
    case 'ranged':
      if (spec.weapon?.type?.includes('crossbow')) {
        return 'crossbow';
      }
      return 'archer';
    case 'cavalry':
      if (spec.weapon?.type?.includes('bow')) {
        return 'horse_archer';
      }
      if (spec.weapon?.type?.includes('lance')) {
        return 'shock_cavalry';
      }
      return 'cavalry';
    case 'wizard':
      return 'wizard';
    case 'siege':
      return 'siege';
    case 'castle':
      return 'castle';
    case 'regional':
      // 지역병은 무기/탈것에 따라 분류
      if (spec.mount) {
        return 'cavalry';
      }
      if (spec.weapon?.type?.includes('bow') || spec.weapon?.type?.includes('crossbow')) {
        return 'archer';
      }
      return 'sword_infantry';
    default:
      return 'sword_infantry';
  }
}

/**
 * 유닛 스탯 기반 공격 타입 결정
 */
export type AttackType = 'melee' | 'ranged' | 'magic';

export function getAttackType(unitId: number): AttackType {
  const spec = VOXEL_UNIT_DATABASE[unitId];
  if (!spec) return 'melee';
  
  switch (spec.category) {
    case 'ranged':
      return 'ranged';
    case 'wizard':
      return 'magic';
    case 'siege':
      // 공성병기는 대부분 원거리
      return 'ranged';
    default:
      // 기병 궁수 등 특수 케이스
      if (spec.weapon?.type?.includes('bow') || spec.weapon?.type?.includes('crossbow')) {
        return 'ranged';
      }
      return 'melee';
  }
}

/**
 * 유닛이 기병인지 확인 (탈것 여부)
 */
export function isMountedUnit(unitId: number): boolean {
  const spec = VOXEL_UNIT_DATABASE[unitId];
  return spec?.mount !== undefined && spec.mount.type !== 'none';
}

/**
 * 유닛 이름 가져오기
 */
export function getUnitName(unitId: number): string {
  const spec = VOXEL_UNIT_DATABASE[unitId];
  return spec?.name || `유닛 ${unitId}`;
}

/**
 * 유닛 영문 이름 가져오기
 */
export function getUnitNameEn(unitId: number): string {
  const spec = VOXEL_UNIT_DATABASE[unitId];
  return spec?.nameEn || `Unit ${unitId}`;
}

