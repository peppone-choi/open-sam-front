/**
 * 전투 테스트용 목 데이터
 */

import type {
  ApiBattleData,
  ApiSide,
  ApiGeneral,
  VoxelBattleInit,
  VoxelBattleResult,
  SquadResult,
  BattleStats,
} from '@/lib/battle/types/BattleTypes';

// ========================================
// 장수 목 데이터
// ========================================

export const mockGeneralZhaoYun: ApiGeneral = {
  no: 1,
  name: '조운',
  leadership: 95,
  strength: 97,
  intel: 76,
  specialId: 1,
  specialName: '창룡출해',
  level: 10,
  experience: 5000,
  weapon: { id: 1, name: '용담창', grade: 5, bonus: 20 },
  armor: { id: 2, name: '백은갑', grade: 4, bonus: 15 },
  horse: { id: 3, name: '야조비전', grade: 5, bonus: 25 },
};

export const mockGeneralZhangFei: ApiGeneral = {
  no: 2,
  name: '장비',
  leadership: 78,
  strength: 99,
  intel: 35,
  specialId: 2,
  specialName: '만부부당',
  level: 9,
  experience: 4500,
  weapon: { id: 4, name: '장팔사모', grade: 5, bonus: 22 },
};

export const mockGeneralZhugeLiang: ApiGeneral = {
  no: 3,
  name: '제갈량',
  leadership: 92,
  strength: 35,
  intel: 100,
  specialId: 3,
  specialName: '팔진도',
  level: 10,
  experience: 6000,
};

export const mockGeneralLuBu: ApiGeneral = {
  no: 4,
  name: '여포',
  leadership: 88,
  strength: 100,
  intel: 28,
  specialId: 4,
  specialName: '무쌍난무',
  horse: { id: 5, name: '적토마', grade: 5, bonus: 30 },
};

export const mockGeneralSunCe: ApiGeneral = {
  no: 5,
  name: '손책',
  leadership: 90,
  strength: 96,
  intel: 72,
  specialId: 5,
  specialName: '소패왕',
};

// ========================================
// 전투 측면 목 데이터
// ========================================

export const mockAttackerInfantry: ApiSide = {
  general: mockGeneralZhaoYun,
  crewType: 1102, // 정규보병
  crew: 5000,
  morale: 95,
  train: 80,
  nationId: 2, // 촉
};

export const mockDefenderArcher: ApiSide = {
  general: mockGeneralZhugeLiang,
  crewType: 1201, // 정규궁병
  crew: 4000,
  morale: 90,
  train: 75,
  nationId: 2,
};

export const mockAttackerCavalry: ApiSide = {
  general: mockGeneralLuBu,
  crewType: 1301, // 중기병
  crew: 2000,
  morale: 100,
  train: 90,
  nationId: 4,
};

export const mockDefenderSpearman: ApiSide = {
  general: mockGeneralSunCe,
  crewType: 1108, // 장창병
  crew: 3500,
  morale: 85,
  train: 70,
  nationId: 3,
};

export const mockAttackerSiege: ApiSide = {
  general: mockGeneralZhangFei,
  crewType: 1501, // 벽력거
  crew: 500,
  morale: 80,
  train: 60,
  nationId: 2,
};

// ========================================
// 전투 데이터 목 데이터
// ========================================

export const mockBattleInfantryVsInfantry: ApiBattleData = {
  battleId: 'test-battle-001',
  attacker: mockAttackerInfantry,
  defender: {
    ...mockAttackerInfantry,
    general: { ...mockGeneralZhangFei, name: '방어군 장수' },
    nationId: 1,
  },
  cityId: 1,
  season: 2,
  battleType: 'field',
};

export const mockBattleCavalryCharge: ApiBattleData = {
  battleId: 'test-battle-002',
  attacker: mockAttackerCavalry,
  defender: mockDefenderArcher,
  cityId: 10,
  season: 1,
  battleType: 'field',
};

export const mockBattleArcherKiting: ApiBattleData = {
  battleId: 'test-battle-003',
  attacker: mockDefenderArcher,
  defender: mockAttackerInfantry,
  cityId: 30,
  season: 3,
  battleType: 'field',
};

export const mockBattleSiege: ApiBattleData = {
  battleId: 'test-battle-004',
  attacker: mockAttackerSiege,
  defender: mockDefenderSpearman,
  cityId: 5,
  season: 4,
  battleType: 'siege',
};

export const mockBattleMixedForces: ApiBattleData = {
  battleId: 'test-battle-005',
  attacker: mockAttackerCavalry,
  defender: mockDefenderSpearman,
  cityId: 20,
  season: 2,
  battleType: 'field',
};

// ========================================
// 전투 결과 목 데이터
// ========================================

export const mockBattleResultAttackerWins: VoxelBattleResult = {
  battleId: 'test-battle-001',
  winner: 'attacker',
  duration: 180000, // 3분
  attackerRemaining: 3500,
  defenderRemaining: 0,
  attackerSquads: [
    {
      squadId: 'attacker_main_1102',
      unitTypeId: 1102,
      survivingUnits: 140,
      originalUnits: 200,
      kills: 200,
      finalMorale: 85,
      status: 'active',
    },
  ],
  defenderSquads: [
    {
      squadId: 'defender_main_1102',
      unitTypeId: 1102,
      survivingUnits: 0,
      originalUnits: 200,
      kills: 60,
      finalMorale: 0,
      status: 'destroyed',
    },
  ],
  events: [
    { type: 'battle_started', timestamp: 0, data: {} },
    { type: 'charge_started', timestamp: 30000, data: { squadName: '정규보병' } },
    { type: 'unit_killed', timestamp: 60000, data: { squadName: '정규보병', count: 50 } },
    { type: 'morale_broken', timestamp: 150000, data: { squadName: '방어군' } },
    { type: 'battle_ended', timestamp: 180000, data: { winner: 'attacker' } },
  ],
  stats: {
    totalKills: { attacker: 200, defender: 60 },
    totalDamage: { attacker: 15000, defender: 4500 },
    chargeCount: { attacker: 2, defender: 0 },
    routCount: { attacker: 0, defender: 1 },
  },
};

export const mockBattleResultDraw: VoxelBattleResult = {
  battleId: 'test-battle-006',
  winner: 'draw',
  duration: 600000, // 10분 (시간초과)
  attackerRemaining: 1500,
  defenderRemaining: 1400,
  attackerSquads: [
    {
      squadId: 'attacker_main_1301',
      unitTypeId: 1301,
      survivingUnits: 40,
      originalUnits: 53,
      kills: 35,
      finalMorale: 50,
      status: 'active',
    },
  ],
  defenderSquads: [
    {
      squadId: 'defender_main_1108',
      unitTypeId: 1108,
      survivingUnits: 56,
      originalUnits: 140,
      kills: 13,
      finalMorale: 45,
      status: 'active',
    },
  ],
  events: [
    { type: 'battle_started', timestamp: 0, data: {} },
    { type: 'battle_ended', timestamp: 600000, data: { winner: 'draw' } },
  ],
  stats: {
    totalKills: { attacker: 84, defender: 13 },
    totalDamage: { attacker: 6300, defender: 975 },
    chargeCount: { attacker: 5, defender: 0 },
    routCount: { attacker: 0, defender: 0 },
  },
};

export const mockBattleResultMoralCollapse: VoxelBattleResult = {
  battleId: 'test-battle-007',
  winner: 'attacker',
  duration: 120000, // 2분
  attackerRemaining: 1800,
  defenderRemaining: 2500, // 병력은 남았지만 사기 붕괴
  attackerSquads: [
    {
      squadId: 'attacker_main_1301',
      unitTypeId: 1301,
      survivingUnits: 48,
      originalUnits: 53,
      kills: 30,
      finalMorale: 75,
      status: 'active',
    },
  ],
  defenderSquads: [
    {
      squadId: 'defender_main_1201',
      unitTypeId: 1201,
      survivingUnits: 100,
      originalUnits: 160,
      kills: 5,
      finalMorale: 5, // 사기 붕괴
      status: 'routed',
    },
  ],
  events: [
    { type: 'battle_started', timestamp: 0, data: {} },
    { type: 'charge_impact', timestamp: 15000, data: { damage: 500, bonus: 50 } },
    { type: 'morale_broken', timestamp: 100000, data: { squadName: '정규궁병' } },
    { type: 'squad_routed', timestamp: 110000, data: { squadName: '정규궁병' } },
    { type: 'battle_ended', timestamp: 120000, data: { winner: 'attacker' } },
  ],
  stats: {
    totalKills: { attacker: 60, defender: 5 },
    totalDamage: { attacker: 4500, defender: 375 },
    chargeCount: { attacker: 3, defender: 0 },
    routCount: { attacker: 0, defender: 1 },
  },
};

// ========================================
// 유닛 타입별 테스트 데이터
// ========================================

export const ALL_UNIT_TYPES = {
  infantry: [1100, 1101, 1102, 1103, 1104, 1105, 1106, 1107, 1108],
  archer: [1200, 1201, 1202, 1203, 1204, 1205],
  cavalry: [1300, 1301, 1302, 1303, 1304, 1305, 1306],
  wizard: [1400, 1401, 1402, 1403, 1407, 1420],
  siege: [1500, 1501, 1503, 1507],
  regional: [1450, 1451, 1452, 1460, 1470],
};

export const BENCHMARK_SCENARIOS = [
  { name: 'small_battle', attackerUnits: 100, defenderUnits: 100 },
  { name: 'medium_battle', attackerUnits: 500, defenderUnits: 500 },
  { name: 'large_battle', attackerUnits: 1000, defenderUnits: 1000 },
];

// ========================================
// 팩토리 함수
// ========================================

export function createMockBattleData(
  overrides: Partial<ApiBattleData> = {}
): ApiBattleData {
  return {
    ...mockBattleInfantryVsInfantry,
    ...overrides,
    battleId: overrides.battleId || `test-battle-${Date.now()}`,
  };
}

export function createMockGeneral(
  overrides: Partial<ApiGeneral> = {}
): ApiGeneral {
  return {
    ...mockGeneralZhaoYun,
    ...overrides,
  };
}

export function createMockSide(
  overrides: Partial<ApiSide> = {}
): ApiSide {
  return {
    general: createMockGeneral(overrides.general),
    crewType: overrides.crewType || 1102,
    crew: overrides.crew || 5000,
    morale: overrides.morale ?? 100,
    train: overrides.train ?? 50,
    nationId: overrides.nationId ?? 1,
  };
}

export function createMockBattleResult(
  overrides: Partial<VoxelBattleResult> = {}
): VoxelBattleResult {
  return {
    ...mockBattleResultAttackerWins,
    ...overrides,
    battleId: overrides.battleId || `test-result-${Date.now()}`,
  };
}

export function createMockSquadResult(
  overrides: Partial<SquadResult> = {}
): SquadResult {
  return {
    squadId: overrides.squadId || `squad_${Date.now()}`,
    unitTypeId: overrides.unitTypeId || 1102,
    survivingUnits: overrides.survivingUnits ?? 100,
    originalUnits: overrides.originalUnits ?? 200,
    kills: overrides.kills ?? 50,
    finalMorale: overrides.finalMorale ?? 80,
    status: overrides.status || 'active',
  };
}





