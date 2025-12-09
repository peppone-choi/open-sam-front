import { getUnitDataFromStore, RawUnitDefinition, setUnitDataFromApi } from '@/stores/unitStore';
import { SammoAPI } from '@/lib/api/sammo';

export type UnitType = 'FOOTMAN' | 'SPEARMAN' | 'ARCHER' | 'CAVALRY' | 'SIEGE' | 'WIZARD' | 'MIXED' | 'CASTLE';

type AttackStyle = 'melee' | 'ranged' | 'magic';
type SimpleTypeInfo = { type: UnitType; name: string; attackType: AttackStyle };
type UnitDefinition = RawUnitDefinition;

// 백엔드 간단 매핑 (0-4)
const SIMPLE_UNIT_TYPE_MAP: Record<number, SimpleTypeInfo> = {
  0: { type: 'FOOTMAN', name: '보병', attackType: 'melee' },
  1: { type: 'ARCHER', name: '궁병', attackType: 'ranged' },
  2: { type: 'CAVALRY', name: '기병', attackType: 'melee' },
  3: { type: 'WIZARD', name: '귀병', attackType: 'magic' },
  4: { type: 'SIEGE', name: '차병', attackType: 'ranged' },
};

const UNIT_NAME_MAP: Record<UnitType, string> = {
  FOOTMAN: '보병',
  SPEARMAN: '창병',
  ARCHER: '궁병',
  CAVALRY: '기병',
  SIEGE: '공성',
  WIZARD: '귀병',
  MIXED: '복합병',
  CASTLE: '성벽',
};

function normalizeUnitType(type: string): UnitType {
  if (type in UNIT_NAME_MAP) {
    return type as UnitType;
  }
  return 'FOOTMAN';
}

function getAttackTypeFromUnitType(type: string, crewtype?: number): AttackStyle {
  switch (type) {
    case 'ARCHER':
    case 'SIEGE':
      return 'ranged';
    case 'WIZARD':
      return 'magic';
    case 'MIXED':
      // 복합병종 개별 처리
      return 'ranged'; // 모두 원거리 주력
    default:
      return 'melee';
  }
}

async function ensureUnitDataLoaded(): Promise<void> {
  if (typeof window === 'undefined') {
    return;
  }
  if (getUnitDataFromStore()) {
    return;
  }
  try {
    const constResult = await SammoAPI.GlobalGetConst();
    if (constResult?.result && constResult.data?.gameUnitConst) {
      setUnitDataFromApi(constResult.data.gameUnitConst);
    }
  } catch (error) {
    console.warn('[unitTypeMapping] Failed to load unit data from API:', error);
  }
}

export function getUnitDefinition(crewtype: number): UnitDefinition | undefined {
  if (crewtype >= 0 && crewtype <= 9) {
    return undefined;
  }
  const unitMap = getUnitDataFromStore();
  if (!unitMap) {
    void ensureUnitDataLoaded();
    return undefined;
  }
  return unitMap[String(crewtype)];
}

export function getUnitTypeInfo(crewtype: number): SimpleTypeInfo {
  if (crewtype >= 0 && crewtype <= 9) {
    return SIMPLE_UNIT_TYPE_MAP[crewtype] || { type: 'FOOTMAN', name: '보병', attackType: 'melee' };
  }

  const unitMap = getUnitDataFromStore();
  if (!unitMap) {
    void ensureUnitDataLoaded();
    return SIMPLE_UNIT_TYPE_MAP[crewtype] || { type: 'FOOTMAN', name: '보병', attackType: 'melee' };
  }

  const unit = unitMap[String(crewtype)];
  if (unit) {
    const resolvedType = normalizeUnitType(unit.type);
    return {
      type: resolvedType,
      name: UNIT_NAME_MAP[resolvedType],
      attackType: getAttackTypeFromUnitType(resolvedType, crewtype),
    };
  }

  return { type: 'FOOTMAN', name: '보병', attackType: 'melee' };
}

export function getAttackTypeByCrewtype(crewtype: number): AttackStyle {
  return getUnitTypeInfo(crewtype).attackType;
}

export function getUnitTypeName(crewtype: number): string {
  return getUnitTypeInfo(crewtype).name;
}

export function getCrewTypeDisplayName(
  crewtype?: number | null,
  fallbackName?: string | null
): string {
  if (fallbackName && fallbackName.trim().length > 0) {
    // "병종 NaN" 같은 잘못된 fallback 이름 필터링
    if (fallbackName.includes('NaN') || fallbackName === '병종 undefined') {
      return '미편성';
    }
    return fallbackName;
  }

  // NaN, null, undefined, 유효하지 않은 값 체크
  if (crewtype === null || crewtype === undefined || Number.isNaN(crewtype) || !Number.isFinite(crewtype)) {
    return '미편성';
  }

  const mappedName = getUnitTypeName(crewtype);
  if (mappedName) {
    return mappedName;
  }

  return `병종 ${crewtype}`;
}
