// 백엔드 간단 매핑 (0-4)
const SIMPLE_UNIT_TYPE_MAP: Record<number, { name: string; attackType: 'melee' | 'ranged' | 'magic' }> = {
  0: { name: '보병', attackType: 'melee' },
  1: { name: '궁병', attackType: 'ranged' },
  2: { name: '기병', attackType: 'melee' },
  3: { name: '귀병', attackType: 'magic' },
  4: { name: '차병', attackType: 'ranged' },
};

// units.json 정확한 타입 매핑
const UNIT_TYPE_MAPPING: Record<number, 'FOOTMAN' | 'SPEARMAN' | 'ARCHER' | 'CAVALRY' | 'SIEGE' | 'WIZARD' | 'MIXED' | 'CASTLE'> = {
  1000: 'CASTLE',
  1100: 'FOOTMAN', 1101: 'FOOTMAN', 1102: 'FOOTMAN', 1103: 'FOOTMAN', 1104: 'FOOTMAN',
  1105: 'FOOTMAN', 1106: 'FOOTMAN', 1107: 'FOOTMAN', 1108: 'FOOTMAN', 1109: 'FOOTMAN',
  1110: 'FOOTMAN', 1111: 'FOOTMAN', 1112: 'FOOTMAN', 1113: 'FOOTMAN', 1114: 'FOOTMAN',
  1115: 'FOOTMAN', 1116: 'FOOTMAN', 1117: 'FOOTMAN',
  1200: 'ARCHER',
  1201: 'SPEARMAN', 1202: 'SPEARMAN', 1203: 'SPEARMAN', 1204: 'SPEARMAN', 1205: 'SPEARMAN',
  1206: 'SPEARMAN', 1207: 'SPEARMAN', 1208: 'SPEARMAN', 1209: 'SPEARMAN', 1210: 'SPEARMAN',
  1211: 'SPEARMAN',
  1300: 'CAVALRY',
  1301: 'ARCHER', 1302: 'ARCHER', 1303: 'ARCHER', 1304: 'ARCHER', 1305: 'ARCHER',
  1306: 'ARCHER', 1307: 'ARCHER', 1308: 'ARCHER', 1309: 'ARCHER', 1310: 'ARCHER',
  1401: 'CAVALRY', 1402: 'CAVALRY', 1403: 'CAVALRY', 1404: 'CAVALRY', 1405: 'CAVALRY',
  1406: 'CAVALRY', 1407: 'CAVALRY', 1408: 'CAVALRY',
  1500: 'SIEGE',
  1501: 'MIXED', 1502: 'MIXED', 1503: 'MIXED', 1504: 'MIXED',
  1601: 'SIEGE', 1602: 'SIEGE',
  1701: 'WIZARD', 1702: 'WIZARD', 1703: 'WIZARD',
};

function getAttackTypeFromUnitType(type: string, crewtype?: number): 'melee' | 'ranged' | 'magic' {
  switch (type) {
    case 'ARCHER':
    case 'SIEGE':
      return 'ranged';
    case 'WIZARD':
      return 'magic';
    case 'MIXED':
      // 복합병종 개별 처리
      // 1501: 표창병 - 투창 (원거리)
      // 1502: 월도병 - 활과 도 (원거리 주력)
      // 1503: 투석병 - 투석기 (원거리)
      // 1504: 취사병 - 독침 (원거리)
      return 'ranged'; // 모두 원거리 주력
    default:
      return 'melee';
  }
}

function getNameFromUnitType(type: string): string {
  const nameMap: Record<string, string> = {
    'FOOTMAN': '보병',
    'SPEARMAN': '창병',
    'ARCHER': '궁병',
    'CAVALRY': '기병',
    'SIEGE': '공성',
    'WIZARD': '귀병',
    'MIXED': '복합병',
    'CASTLE': '성벽',
  };
  return nameMap[type] || '보병';
}

export function getUnitTypeInfo(crewtype: number) {
  // 0-9 범위: 간단 매핑
  if (crewtype >= 0 && crewtype <= 9) {
    return SIMPLE_UNIT_TYPE_MAP[crewtype] || { name: '보병', attackType: 'melee' as const };
  }
  
  // 정확한 매핑
  const unitType = UNIT_TYPE_MAPPING[crewtype];
  if (unitType) {
    return {
      name: getNameFromUnitType(unitType),
      attackType: getAttackTypeFromUnitType(unitType, crewtype),
    };
  }
  
  // 기본값
  return { name: '보병', attackType: 'melee' as const };
}

export function getAttackTypeByCrewtype(crewtype: number): 'melee' | 'ranged' | 'magic' {
  const info = getUnitTypeInfo(crewtype);
  return info.attackType;
}

export function getUnitTypeName(crewtype: number): string {
  const info = getUnitTypeInfo(crewtype);
  return info.name;
}
