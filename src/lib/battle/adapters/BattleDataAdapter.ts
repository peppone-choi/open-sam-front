/**
 * 전투 데이터 어댑터 (메인)
 * 
 * API 전투 데이터를 복셀 엔진 데이터로 변환하는 메인 어댑터입니다.
 * GeneralAdapter와 UnitAdapter를 조합하여 완전한 전투 데이터를 생성합니다.
 * 
 * @module BattleDataAdapter
 */

import type {
  ApiBattleData,
  ApiSide,
  VoxelBattleInit,
  VoxelForce,
  TerrainConfig,
  TerrainType,
  WeatherType,
  TimeOfDay,
  ColorPair,
} from '../types/BattleTypes';
import {
  convertGeneralStats,
  applySpecialSkill,
  applyItemEffects,
  applyAllGeneralBonuses,
  calculateMoraleBonus,
} from './GeneralAdapter';
import {
  createVoxelSquad,
  getUnitCategoryById,
} from './UnitAdapter';
import {
  getCityTerrain,
  getCityWallConfig,
  generateSiegeStructures,
  createCityBattleMap,
  loadMapTemplate,
  type CityStructure,
  type BattleMapTemplate,
  CITY_TERRAIN_OVERRIDE,
} from './CityTerrainMapping';

// ========================================
// 상수 정의
// ========================================

/** 기본 맵 크기 */
const DEFAULT_MAP_SIZE = { width: 800, height: 600 };

/** 계절별 기본 날씨 */
const SEASON_WEATHER: Record<number, WeatherType> = {
  1: 'clear',       // 봄 - 맑음
  2: 'clear',       // 여름 - 맑음
  3: 'cloudy',      // 가을 - 흐림
  4: 'snow',        // 겨울 - 눈
};

/** 계절별 시간대 */
const SEASON_TIME: Record<number, TimeOfDay> = {
  1: 'morning',     // 봄 - 아침
  2: 'noon',        // 여름 - 정오
  3: 'evening',     // 가을 - 저녁
  4: 'morning',     // 겨울 - 아침
};

// 도시 지형 매핑은 CityTerrainMapping.ts로 이동됨
// getCityTerrain(), createCityBattleMap() 사용

/** 국가별 기본 색상 */
const NATION_COLORS: Record<number, ColorPair> = {
  1: { primary: '#DC143C', secondary: '#FFD700' },  // 위 - 빨강/금색
  2: { primary: '#228B22', secondary: '#FFD700' },  // 촉 - 초록/금색
  3: { primary: '#4169E1', secondary: '#FFFFFF' },  // 오 - 파랑/흰색
  4: { primary: '#8B4513', secondary: '#DEB887' },  // 기타 - 갈색
  5: { primary: '#FFD700', secondary: '#000000' },  // 황건 - 노랑/검정
  0: { primary: '#808080', secondary: '#FFFFFF' },  // 중립 - 회색
};

// ========================================
// 메인 변환 함수
// ========================================

/**
 * API 전투 데이터를 복셀 엔진 초기화 데이터로 변환
 */
export function convertApiBattleToVoxel(data: ApiBattleData): VoxelBattleInit {
  // 지형 설정 결정
  const terrain = determineTerrain(data.cityId, data.battleType);
  
  // 날씨 결정
  const weather = determineWeather(data.season);
  
  // 시간대 결정
  const timeOfDay = determineTimeOfDay(data.season);
  
  // 공격측 군대 생성
  const attacker = createVoxelForce(data.attacker, 'attacker');
  
  // 방어측 군대 생성
  const defender = createVoxelForce(data.defender, 'defender');
  
  return {
    battleId: data.battleId,
    attacker,
    defender,
    terrain,
    weather,
    timeOfDay,
  };
}

// ========================================
// 군대 생성
// ========================================

/**
 * API 측면 데이터에서 VoxelForce 생성
 */
export function createVoxelForce(
  side: ApiSide,
  teamId: 'attacker' | 'defender'
): VoxelForce {
  // 장수 스탯 변환
  const generalStats = convertGeneralStats(side.general);
  
  // 국가 색상 결정
  const colors = getNationColors(side.nationId);
  
  // 부대 생성
  const squad = createVoxelSquad(
    side.crewType,
    side.crew,
    side.morale ?? 100,
    side.train ?? 50,
    `${teamId}_main_${side.crewType}`
  );
  
  if (!squad) {
    throw new Error(`유닛 생성 실패: crewType=${side.crewType}`);
  }
  
  // 장수 스탯 보정 적용
  const category = getUnitCategoryById(side.crewType);
  squad.baseStats = applyAllGeneralBonuses(squad.baseStats, generalStats, category);
  
  // 통솔력에 따른 사기 보정
  const moraleBonus = calculateMoraleBonus(generalStats.leadershipModifier);
  squad.morale = Math.max(0, Math.min(100, squad.morale + moraleBonus));
  
  // 군대 객체 생성
  const force: VoxelForce = {
    teamId,
    factionName: side.general.name,
    colors,
    generalStats,
    squads: [squad],
  };
  
  // 특기 효과 적용
  applySpecialSkill(force, generalStats.specialSkillId);
  
  // 아이템 효과 적용
  applyItemEffects(force, generalStats.itemBonuses);
  
  return force;
}

/**
 * 국가 ID로 색상 가져오기
 */
export function getNationColors(nationId?: number): ColorPair {
  if (nationId !== undefined && NATION_COLORS[nationId]) {
    return NATION_COLORS[nationId];
  }
  return NATION_COLORS[0]; // 기본 회색
}

/**
 * 커스텀 색상 설정
 */
export function setNationColors(nationId: number, colors: ColorPair): void {
  NATION_COLORS[nationId] = colors;
}

// ========================================
// 지형 결정
// ========================================

/**
 * 도시 ID와 전투 타입으로 지형 설정 결정
 */
export function determineTerrain(
  cityId?: number,
  battleType?: 'field' | 'siege' | 'ambush' | 'naval'
): TerrainConfig {
  let terrainType: TerrainType = 'plains';
  
  // 전투 타입에 따른 기본 지형
  if (battleType === 'siege') {
    terrainType = 'city';
  } else if (battleType === 'naval') {
    terrainType = 'naval';
  } else if (cityId !== undefined && CITY_TERRAIN_OVERRIDE[cityId]) {
    terrainType = CITY_TERRAIN_OVERRIDE[cityId];
  }
  
  // 맵 크기 결정
  const mapSize = getMapSizeForTerrain(terrainType);
  
  // 지형 시드 생성 (재현 가능한 맵 생성용)
  const seed = cityId ? cityId * 1000 + Math.floor(Math.random() * 1000) : Date.now();
  
  return {
    type: terrainType,
    mapSize,
    seed,
    features: generateTerrainFeatures(terrainType, mapSize, seed),
  };
}

/**
 * 지형 타입에 따른 맵 크기 결정
 */
function getMapSizeForTerrain(terrainType: TerrainType): { width: number; height: number } {
  switch (terrainType) {
    case 'city':
      return { width: 600, height: 500 };  // 공성전은 더 작은 맵
    case 'naval':
      return { width: 900, height: 600 };  // 해전은 더 넓은 맵
    case 'mountain':
      return { width: 700, height: 550 };  // 산악은 중간 크기
    default:
      return DEFAULT_MAP_SIZE;
  }
}

/**
 * 지형 특징 요소 생성
 */
function generateTerrainFeatures(
  terrainType: TerrainType,
  mapSize: { width: number; height: number },
  seed: number
): TerrainConfig['features'] {
  const features: TerrainConfig['features'] = [];
  
  // 시드 기반 랜덤 (단순화)
  const random = (min: number, max: number) => {
    const x = Math.sin(seed++) * 10000;
    return min + (x - Math.floor(x)) * (max - min);
  };
  
  switch (terrainType) {
    case 'forest':
      // 숲에는 나무 그룹 추가
      for (let i = 0; i < 5; i++) {
        features.push({
          type: 'tree_cluster',
          position: {
            x: random(50, mapSize.width - 50),
            y: random(50, mapSize.height - 50),
          },
          size: { width: random(30, 60), height: random(30, 60) },
        });
      }
      break;
      
    case 'hills':
      // 구릉에는 언덕 추가
      for (let i = 0; i < 3; i++) {
        features.push({
          type: 'hill',
          position: {
            x: random(100, mapSize.width - 100),
            y: random(100, mapSize.height - 100),
          },
          size: { width: random(80, 150), height: random(60, 100) },
        });
      }
      break;
      
    case 'river':
      // 강 지형에는 강과 다리 추가
      features.push({
        type: 'river',
        position: { x: mapSize.width / 2, y: 0 },
        size: { width: 40, height: mapSize.height },
        rotation: random(-15, 15),
      });
      features.push({
        type: 'bridge',
        position: { x: mapSize.width / 2, y: mapSize.height / 2 },
        size: { width: 60, height: 20 },
      });
      break;
      
    case 'city':
      // 도시에는 성벽 추가
      features.push({
        type: 'wall',
        position: { x: mapSize.width * 0.7, y: mapSize.height / 2 },
        size: { width: 30, height: mapSize.height * 0.6 },
      });
      features.push({
        type: 'gate',
        position: { x: mapSize.width * 0.7, y: mapSize.height / 2 },
        size: { width: 40, height: 40 },
      });
      break;
  }
  
  return features;
}

// ========================================
// 날씨 및 시간 결정
// ========================================

/**
 * 계절에 따른 날씨 결정
 */
export function determineWeather(season?: number): WeatherType {
  if (season !== undefined && SEASON_WEATHER[season]) {
    return SEASON_WEATHER[season];
  }
  
  // 랜덤 날씨 (선택적)
  const weatherOptions: WeatherType[] = ['clear', 'cloudy', 'rain', 'fog'];
  return weatherOptions[Math.floor(Math.random() * weatherOptions.length)];
}

/**
 * 계절에 따른 시간대 결정
 */
export function determineTimeOfDay(season?: number): TimeOfDay {
  if (season !== undefined && SEASON_TIME[season]) {
    return SEASON_TIME[season];
  }
  
  // 랜덤 시간대
  const timeOptions: TimeOfDay[] = ['dawn', 'morning', 'noon', 'evening'];
  return timeOptions[Math.floor(Math.random() * timeOptions.length)];
}

// ========================================
// 멀티스택 지원 (여러 장수)
// ========================================

/**
 * 여러 측면(장수)을 포함한 군대 생성
 */
export function createMultiStackForce(
  sides: ApiSide[],
  teamId: 'attacker' | 'defender'
): VoxelForce {
  if (sides.length === 0) {
    throw new Error('최소 1개의 측면이 필요합니다');
  }
  
  // 첫 번째 장수를 주장으로 설정
  const mainSide = sides[0];
  const mainGeneralStats = convertGeneralStats(mainSide.general);
  const colors = getNationColors(mainSide.nationId);
  
  // 모든 부대 생성
  const squads = sides.map((side, index) => {
    const squad = createVoxelSquad(
      side.crewType,
      side.crew,
      side.morale ?? 100,
      side.train ?? 50,
      `${teamId}_squad_${index}_${side.crewType}`
    );
    
    if (!squad) {
      throw new Error(`유닛 생성 실패: crewType=${side.crewType}`);
    }
    
    // 해당 장수의 스탯 보정 적용
    const generalStats = convertGeneralStats(side.general);
    const category = getUnitCategoryById(side.crewType);
    squad.baseStats = applyAllGeneralBonuses(squad.baseStats, generalStats, category);
    
    // 사기 보정
    const moraleBonus = calculateMoraleBonus(generalStats.leadershipModifier);
    squad.morale = Math.max(0, Math.min(100, squad.morale + moraleBonus));
    
    // 부대 이름에 장수 이름 포함
    squad.name = `${side.general.name}의 ${squad.name}`;
    
    return squad;
  });
  
  const force: VoxelForce = {
    teamId,
    factionName: mainSide.general.name,
    colors,
    generalStats: mainGeneralStats,
    squads,
  };
  
  // 주장의 특기 효과 전체 적용
  applySpecialSkill(force, mainGeneralStats.specialSkillId);
  
  return force;
}

// ========================================
// 유효성 검증
// ========================================

/**
 * API 전투 데이터 유효성 검증
 */
export function validateApiBattleData(data: ApiBattleData): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  // 전투 ID 확인
  if (!data.battleId) {
    errors.push('battleId가 필요합니다');
  }
  
  // 공격측 확인
  if (!data.attacker) {
    errors.push('공격측 정보가 필요합니다');
  } else {
    const attackerErrors = validateSide(data.attacker, '공격측');
    errors.push(...attackerErrors);
  }
  
  // 방어측 확인
  if (!data.defender) {
    errors.push('방어측 정보가 필요합니다');
  } else {
    const defenderErrors = validateSide(data.defender, '방어측');
    errors.push(...defenderErrors);
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * 측면 데이터 유효성 검증
 */
function validateSide(side: ApiSide, prefix: string): string[] {
  const errors: string[] = [];
  
  if (!side.general) {
    errors.push(`${prefix}: 장수 정보가 필요합니다`);
  } else {
    if (!side.general.name) errors.push(`${prefix}: 장수 이름이 필요합니다`);
    if (side.general.leadership === undefined) errors.push(`${prefix}: 통솔력이 필요합니다`);
    if (side.general.strength === undefined) errors.push(`${prefix}: 무력이 필요합니다`);
    if (side.general.intel === undefined) errors.push(`${prefix}: 지력이 필요합니다`);
  }
  
  if (!side.crewType) {
    errors.push(`${prefix}: 병종 ID가 필요합니다`);
  }
  
  if (!side.crew || side.crew <= 0) {
    errors.push(`${prefix}: 병력 수가 필요합니다`);
  }
  
  return errors;
}

// ========================================
// 디버그 및 유틸리티
// ========================================

/**
 * 전투 데이터 요약 문자열 생성 (디버그용)
 */
export function getBattleDataSummary(data: ApiBattleData): string {
  const attacker = data.attacker;
  const defender = data.defender;
  
  return [
    `전투 ID: ${data.battleId}`,
    `공격: ${attacker.general.name} (${attacker.crew}명, 병종:${attacker.crewType})`,
    `방어: ${defender.general.name} (${defender.crew}명, 병종:${defender.crewType})`,
    `지형: ${data.cityId || '필드'}, 계절: ${data.season || '?'}`,
  ].join('\n');
}

/**
 * 변환된 복셀 데이터 요약 문자열 생성 (디버그용)
 */
export function getVoxelDataSummary(init: VoxelBattleInit): string {
  const attacker = init.attacker;
  const defender = init.defender;
  
  return [
    `전투 ID: ${init.battleId}`,
    `공격: ${attacker.factionName}`,
    `  - 부대 수: ${attacker.squads.length}`,
    `  - 총 유닛: ${attacker.squads.reduce((sum, s) => sum + s.unitCount, 0)}`,
    `방어: ${defender.factionName}`,
    `  - 부대 수: ${defender.squads.length}`,
    `  - 총 유닛: ${defender.squads.reduce((sum, s) => sum + s.unitCount, 0)}`,
    `지형: ${init.terrain.type}, 날씨: ${init.weather}`,
  ].join('\n');
}

