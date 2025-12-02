/**
 * CityTerrainMapping.ts
 * 실제 도시 데이터 기반 지형 매핑
 * 
 * cities.json의 도시 정보를 기반으로 전투 지형을 결정합니다.
 */

import type { TerrainType } from '../types/BattleTypes';

// ========================================
// 지역 기반 기본 지형 매핑
// ========================================

/** 지역 ID별 기본 지형 */
export const REGION_TERRAIN_MAP: Record<number, TerrainType> = {
  1: 'plains',    // 병주 - 평원 (화북)
  2: 'plains',    // 중원 - 평원 (예주, 연주)
  3: 'mountain',  // 서북 - 산악 (옹주, 양주, 관중)
  4: 'mountain',  // 익주 - 산악 (파촉)
  5: 'forest',    // 남중 - 숲/늪지 (남만)
  6: 'river',     // 형주 - 강 (장강 유역)
  7: 'river',     // 강동 - 강 (오월, 수향)
  8: 'plains',    // 동이 - 평원 (한반도)
  9: 'snow',      // 북방 - 설원 (이민족)
};

// ========================================
// 특수 도시 지형 오버라이드
// ========================================

/** 특수 지형이 있는 도시들 */
export const CITY_TERRAIN_OVERRIDE: Record<number, TerrainType> = {
  // 관문/요새 (levelId 4 - 요충지)
  70: 'fortress',  // 호관 - 요새
  71: 'fortress',  // 호로 - 요새
  72: 'fortress',  // 사곡 - 요새
  73: 'fortress',  // 함곡 - 요새
  74: 'fortress',  // 사수 - 요새
  75: 'fortress',  // 양평 - 요새
  76: 'fortress',  // 가맹 - 요새
  87: 'fortress',  // 면죽 - 요새
  
  // 강/수전 지역
  91: 'river',     // 적벽 - 강 (적벽대전)
  92: 'river',     // 파양 - 강
  52: 'river',     // 강하 - 강
  56: 'river',     // 여강 - 강
  82: 'river',     // 합비 - 강 (비수 근처)
  
  // 북방 설원/이민족
  65: 'snow',      // 흉노 - 설원
  68: 'snow',      // 오환 - 설원
  96: 'snow',      // 선비 - 설원
  97: 'snow',      // 부여 - 설원
  98: 'snow',      // 읍루 - 설원
  99: 'snow',      // 옥저 - 설원
  
  // 남만 밀림/늪지
  66: 'swamp',     // 남만 - 늪지
  48: 'forest',    // 운남 - 숲
  28: 'forest',    // 건녕 - 숲
  50: 'forest',    // 교지 - 숲
  
  // 사막 지역 (서량)
  22: 'desert',    // 서량 - 사막
  63: 'desert',    // 강 - 사막
  64: 'desert',    // 저 - 사막
  
  // 산악 특수
  43: 'mountain',  // 하변 - 산악
  44: 'mountain',  // 자동 - 산악
  86: 'mountain',  // 기산 - 산악 (제갈량 북벌)
  24: 'mountain',  // 한중 - 산악
  
  // 산월 (산악민)
  67: 'hills',     // 산월 - 구릉
};

// ========================================
// 도시 레벨별 성벽 규모
// ========================================

/** 도시 레벨별 성벽 설정 */
export interface CityWallConfig {
  hasWall: boolean;        // 성벽 유무
  wallHeight: number;      // 성벽 높이 (미터)
  wallThickness: number;   // 성벽 두께
  towerCount: number;      // 망루 수
  hasGate: boolean;        // 성문 유무
  hasMoat: boolean;        // 해자 유무
}

export const CITY_LEVEL_WALL_CONFIG: Record<number, CityWallConfig> = {
  // Level 10: 수도급 (낙양, 장안)
  10: {
    hasWall: true,
    wallHeight: 15,
    wallThickness: 8,
    towerCount: 8,
    hasGate: true,
    hasMoat: true,
  },
  // Level 9: 대도시 (업, 허창, 성도, 건업 등)
  9: {
    hasWall: true,
    wallHeight: 12,
    wallThickness: 6,
    towerCount: 6,
    hasGate: true,
    hasMoat: true,
  },
  // Level 8: 중도시
  8: {
    hasWall: true,
    wallHeight: 10,
    wallThickness: 5,
    towerCount: 4,
    hasGate: true,
    hasMoat: false,
  },
  // Level 7: 소도시
  7: {
    hasWall: true,
    wallHeight: 8,
    wallThickness: 4,
    towerCount: 4,
    hasGate: true,
    hasMoat: false,
  },
  // Level 6: 읍
  6: {
    hasWall: true,
    wallHeight: 6,
    wallThickness: 3,
    towerCount: 2,
    hasGate: true,
    hasMoat: false,
  },
  // Level 5: 이민족/소읍
  5: {
    hasWall: true,
    wallHeight: 4,
    wallThickness: 2,
    towerCount: 2,
    hasGate: true,
    hasMoat: false,
  },
  // Level 4: 관문/요새
  4: {
    hasWall: true,
    wallHeight: 14,
    wallThickness: 7,
    towerCount: 4,
    hasGate: true,
    hasMoat: true,
  },
  // Level 3: 소규모 거점
  3: {
    hasWall: true,
    wallHeight: 5,
    wallThickness: 2,
    towerCount: 2,
    hasGate: true,
    hasMoat: false,
  },
  // Level 2: 마을
  2: {
    hasWall: false,
    wallHeight: 0,
    wallThickness: 0,
    towerCount: 0,
    hasGate: false,
    hasMoat: false,
  },
  // Level 1: 촌락
  1: {
    hasWall: false,
    wallHeight: 0,
    wallThickness: 0,
    towerCount: 0,
    hasGate: false,
    hasMoat: false,
  },
};

// ========================================
// 도시 구조물 타입
// ========================================

export type CityStructureType = 
  | 'wall'           // 성벽
  | 'gate'           // 성문
  | 'tower'          // 망루
  | 'moat'           // 해자
  | 'barracks'       // 병영
  | 'granary'        // 곡창
  | 'palace'         // 궁전/관아
  | 'market'         // 시장
  | 'residence'      // 민가
  | 'shrine'         // 사당
  | 'fortress_tower' // 요새 망루
  | 'siege_platform' // 공성 발판
  | 'arrow_tower';   // 화살탑

/** 도시 구조물 */
export interface CityStructure {
  type: CityStructureType;
  position: { x: number; y: number; z?: number };
  rotation?: number;
  size: { width: number; height: number; depth?: number };
  hp?: number;           // 내구도
  defense?: number;      // 방어력
  destructible?: boolean; // 파괴 가능 여부
}

// ========================================
// 도시 전투 맵 생성
// ========================================

export interface CityBattleMapConfig {
  cityId: number;
  cityName: string;
  levelId: number;
  regionId: number;
  terrain: TerrainType;
  wallConfig: CityWallConfig;
  structures: CityStructure[];
  mapSize: { width: number; height: number };
  defenderSpawn: { x: number; y: number };  // 방어측 배치 위치 (성 중앙)
  attackerSpawn: { x: number; y: number };  // 공격측 배치 위치 (계산된 방향)
  allSpawnPoints?: Record<Direction, { x: number; y: number }>;  // 8방향 스폰 포인트
  attackDirection?: Direction;  // 공격 진입 방향
  // 승리 조건
  victoryConditions: VictoryCondition[];
  controlPoints: ControlPoint[];
  thronePosition: { x: number; y: number };  // 광장 위치
}

/**
 * 도시 ID로 전투 지형 타입 결정
 */
export function getCityTerrain(cityId: number, regionId: number): TerrainType {
  // 1. 특수 도시 오버라이드 확인
  if (CITY_TERRAIN_OVERRIDE[cityId]) {
    return CITY_TERRAIN_OVERRIDE[cityId];
  }
  
  // 2. 지역 기반 기본 지형
  if (REGION_TERRAIN_MAP[regionId]) {
    return REGION_TERRAIN_MAP[regionId];
  }
  
  // 3. 기본값
  return 'plains';
}

/**
 * 도시 레벨로 성벽 설정 가져오기
 */
export function getCityWallConfig(levelId: number): CityWallConfig {
  return CITY_LEVEL_WALL_CONFIG[levelId] || CITY_LEVEL_WALL_CONFIG[6];
}

// ========================================
// 8방향 진입 시스템
// ========================================

/** 8방향 정의 */
export type Direction = 'N' | 'NE' | 'E' | 'SE' | 'S' | 'SW' | 'W' | 'NW';

/** 방향별 각도 (도) */
export const DIRECTION_ANGLES: Record<Direction, number> = {
  N: 0,
  NE: 45,
  E: 90,
  SE: 135,
  S: 180,
  SW: 225,
  W: 270,
  NW: 315,
};

/** 8방향 스폰 포인트 (맵 중앙 기준 상대 위치) */
export function get8DirectionSpawnPoints(mapSize: { width: number; height: number }): Record<Direction, { x: number; y: number }> {
  const cx = mapSize.width / 2;
  const cy = mapSize.height / 2;
  const edgeMargin = 50; // 맵 가장자리 여백
  
  return {
    N:  { x: cx, y: edgeMargin },
    NE: { x: mapSize.width - edgeMargin, y: edgeMargin },
    E:  { x: mapSize.width - edgeMargin, y: cy },
    SE: { x: mapSize.width - edgeMargin, y: mapSize.height - edgeMargin },
    S:  { x: cx, y: mapSize.height - edgeMargin },
    SW: { x: edgeMargin, y: mapSize.height - edgeMargin },
    W:  { x: edgeMargin, y: cy },
    NW: { x: edgeMargin, y: edgeMargin },
  };
}

/**
 * 두 도시 좌표를 비교해서 진입 방향 계산
 * @param fromCity 출발 도시 좌표
 * @param toCity 목표 도시 좌표
 * @returns 8방향 중 하나
 */
export function calculateAttackDirection(
  fromCity: { x: number; y: number },
  toCity: { x: number; y: number }
): Direction {
  const dx = fromCity.x - toCity.x;  // 양수면 출발지가 동쪽
  const dy = fromCity.y - toCity.y;  // 양수면 출발지가 남쪽 (y가 아래로 증가)
  
  // 각도 계산 (라디안 → 도)
  const angle = Math.atan2(dy, dx) * (180 / Math.PI);
  
  // 각도를 8방향으로 매핑 (-180 ~ 180 → 8방향)
  // 동쪽(E)이 0도, 반시계 방향으로 증가
  const normalizedAngle = ((angle + 180) % 360 + 360) % 360;
  
  if (normalizedAngle >= 337.5 || normalizedAngle < 22.5) return 'W';
  if (normalizedAngle >= 22.5 && normalizedAngle < 67.5) return 'NW';
  if (normalizedAngle >= 67.5 && normalizedAngle < 112.5) return 'N';
  if (normalizedAngle >= 112.5 && normalizedAngle < 157.5) return 'NE';
  if (normalizedAngle >= 157.5 && normalizedAngle < 202.5) return 'E';
  if (normalizedAngle >= 202.5 && normalizedAngle < 247.5) return 'SE';
  if (normalizedAngle >= 247.5 && normalizedAngle < 292.5) return 'S';
  return 'SW';
}

/**
 * 공성전 맵 구조물 생성 (성이 중앙에 위치)
 */
export function generateSiegeStructures(
  cityId: number,
  levelId: number,
  wallValue: number,  // 도시 성벽 수치 (0-200)
  mapSize: { width: number; height: number }
): CityStructure[] {
  const structures: CityStructure[] = [];
  const wallConfig = getCityWallConfig(levelId);
  
  if (!wallConfig.hasWall) {
    return structures;
  }
  
  const cx = mapSize.width / 2;
  const cy = mapSize.height / 2;
  
  // 성벽 상태 (손상도 반영)
  const wallCondition = Math.max(0.1, wallValue / 150);
  const effectiveWallHeight = wallConfig.wallHeight * wallCondition;
  
  // 성벽 크기 (레벨에 따라)
  const wallRadius = 80 + levelId * 15;  // 성 반경
  
  // 4면 성벽 (정사각형 형태로 중앙에 배치)
  const wallDirections = [
    { name: 'north', x: cx, y: cy - wallRadius, rotation: 0, hasGate: true },
    { name: 'east', x: cx + wallRadius, y: cy, rotation: 90, hasGate: true },
    { name: 'south', x: cx, y: cy + wallRadius, rotation: 0, hasGate: true },
    { name: 'west', x: cx - wallRadius, y: cy, rotation: 90, hasGate: true },
  ];
  
  for (const wall of wallDirections) {
    const wallLength = wallRadius * 1.8;
    
    // 성벽
    structures.push({
      type: 'wall',
      position: { x: wall.x, y: wall.y },
      rotation: wall.rotation,
      size: { 
        width: wall.rotation === 0 ? wallLength : wallConfig.wallThickness,
        height: wall.rotation === 0 ? wallConfig.wallThickness : wallLength,
        depth: effectiveWallHeight 
      },
      hp: wallValue * 100,
      defense: levelId * 10,
      destructible: true,
    });
    
    // 성문 (각 면에 하나씩)
    if (wallConfig.hasGate && wall.hasGate) {
      structures.push({
        type: 'gate',
        position: { x: wall.x, y: wall.y },
        rotation: wall.rotation,
        size: { width: 40, height: wallConfig.wallThickness + 5, depth: effectiveWallHeight },
        hp: wallValue * 50,
        defense: levelId * 15,
        destructible: true,
      });
    }
  }
  
  // 4개 모서리 망루
  const cornerOffsets = [
    { x: -wallRadius, y: -wallRadius },
    { x: wallRadius, y: -wallRadius },
    { x: wallRadius, y: wallRadius },
    { x: -wallRadius, y: wallRadius },
  ];
  
  for (const offset of cornerOffsets) {
    structures.push({
      type: 'tower',
      position: { x: cx + offset.x, y: cy + offset.y },
      size: { width: 15, height: 15, depth: effectiveWallHeight + 8 },
      hp: wallValue * 40,
      defense: levelId * 25,
      destructible: true,
    });
  }
  
  // 추가 망루 (레벨이 높을수록)
  if (wallConfig.towerCount > 4) {
    const extraTowers = wallConfig.towerCount - 4;
    for (let i = 0; i < extraTowers; i++) {
      const angle = (i / extraTowers) * Math.PI * 2;
      structures.push({
        type: 'tower',
        position: { 
          x: cx + Math.cos(angle) * wallRadius * 0.7, 
          y: cy + Math.sin(angle) * wallRadius * 0.7 
        },
        size: { width: 12, height: 12, depth: effectiveWallHeight + 5 },
        hp: wallValue * 30,
        defense: levelId * 20,
        destructible: true,
      });
    }
  }
  
  // 해자 (성벽 바깥쪽 원형)
  if (wallConfig.hasMoat) {
    structures.push({
      type: 'moat',
      position: { x: cx, y: cy },
      size: { width: wallRadius * 2 + 30, height: wallRadius * 2 + 30, depth: -3 },
      destructible: false,
    });
  }
  
  // 성 내부 건물들 (중앙에 배치)
  if (levelId >= 8) {
    // 궁전/관아 (정중앙)
    structures.push({
      type: 'palace',
      position: { x: cx, y: cy },
      size: { width: 60, height: 60, depth: 25 },
      hp: 8000,
      destructible: false,
    });
  }
  
  if (levelId >= 7) {
    // 병영 (북서쪽)
    structures.push({
      type: 'barracks',
      position: { x: cx - wallRadius * 0.4, y: cy - wallRadius * 0.4 },
      size: { width: 35, height: 45, depth: 12 },
      hp: 2500,
      destructible: true,
    });
    
    // 곡창 (남동쪽)
    structures.push({
      type: 'granary',
      position: { x: cx + wallRadius * 0.4, y: cy + wallRadius * 0.4 },
      size: { width: 35, height: 35, depth: 14 },
      hp: 2000,
      destructible: true,
    });
  }
  
  if (levelId >= 6) {
    // 시장 (동쪽)
    structures.push({
      type: 'market',
      position: { x: cx + wallRadius * 0.3, y: cy },
      size: { width: 40, height: 30, depth: 8 },
      hp: 1000,
      destructible: true,
    });
  }
  
  // 민가 배치 (성 내부 분산)
  const residenceCount = Math.min(levelId, 10);
  const residenceRadius = wallRadius * 0.6;
  for (let i = 0; i < residenceCount; i++) {
    const angle = (i / residenceCount) * Math.PI * 2 + Math.PI / 4;
    const dist = residenceRadius * (0.3 + (i % 3) * 0.2);
    structures.push({
      type: 'residence',
      position: { 
        x: cx + Math.cos(angle) * dist, 
        y: cy + Math.sin(angle) * dist 
      },
      size: { width: 15, height: 15, depth: 8 },
      destructible: false,
    });
  }
  
  return structures;
}

/** 공격 방향 정보 */
export interface AttackDirectionInfo {
  direction: Direction;
  spawnPoint: { x: number; y: number };
  angle: number;
}

/**
 * 완전한 도시 전투 맵 설정 생성
 * @param cityId 목표 도시 ID
 * @param cityName 도시 이름
 * @param levelId 도시 레벨
 * @param regionId 지역 ID
 * @param wallValue 성벽 수치
 * @param attackerCityPosition 공격측 출발 도시 좌표 (옵션)
 * @param targetCityPosition 목표 도시 좌표 (옵션)
 */
export function createCityBattleMap(
  cityId: number,
  cityName: string,
  levelId: number,
  regionId: number,
  wallValue: number = 100,
  attackerCityPosition?: { x: number; y: number },
  targetCityPosition?: { x: number; y: number }
): CityBattleMapConfig {
  // 맵 크기 결정 (레벨에 따라) - 정사각형으로 변경
  const baseSize = 500 + levelId * 40;
  const mapSize = {
    width: baseSize,
    height: baseSize,
  };
  
  const terrain = getCityTerrain(cityId, regionId);
  const wallConfig = getCityWallConfig(levelId);
  const structures = generateSiegeStructures(cityId, levelId, wallValue, mapSize);
  
  // 8방향 스폰 포인트
  const spawnPoints = get8DirectionSpawnPoints(mapSize);
  
  // 공격 방향 계산
  let attackDirection: Direction = 'W';  // 기본값: 서쪽에서 공격
  if (attackerCityPosition && targetCityPosition) {
    attackDirection = calculateAttackDirection(attackerCityPosition, targetCityPosition);
  }
  
  const attackerSpawn = spawnPoints[attackDirection];
  
  // 방어측은 성 중앙에 배치
  const defenderSpawn = { x: mapSize.width / 2, y: mapSize.height / 2 };
  
  // 승리 조건 및 점령 포인트
  const victoryConditions = generateSiegeVictoryConditions(mapSize);
  const controlPoints = generateSiegeControlPoints(mapSize, levelId);
  const thronePosition = { x: mapSize.width / 2, y: mapSize.height / 2 };
  
  return {
    cityId,
    cityName,
    levelId,
    regionId,
    terrain,
    wallConfig,
    structures,
    mapSize,
    defenderSpawn,
    attackerSpawn,
    // 추가 정보
    allSpawnPoints: spawnPoints,
    attackDirection,
    // 승리 조건
    victoryConditions,
    controlPoints,
    thronePosition,
  };
}

/**
 * 지원군 스폰 포인트 계산
 * @param mapSize 맵 크기
 * @param supportCityPosition 지원군 출발 도시 좌표
 * @param targetCityPosition 목표 도시 좌표
 */
export function getSupportSpawnPoint(
  mapSize: { width: number; height: number },
  supportCityPosition: { x: number; y: number },
  targetCityPosition: { x: number; y: number }
): AttackDirectionInfo {
  const direction = calculateAttackDirection(supportCityPosition, targetCityPosition);
  const spawnPoints = get8DirectionSpawnPoints(mapSize);
  
  return {
    direction,
    spawnPoint: spawnPoints[direction],
    angle: DIRECTION_ANGLES[direction],
  };
}

/**
 * 여러 군대의 스폰 위치 계산 (다중 공격/지원)
 */
export function getMultipleArmySpawns(
  mapSize: { width: number; height: number },
  targetCityPosition: { x: number; y: number },
  armyCityPositions: Array<{ cityId: number; position: { x: number; y: number }; isAttacker: boolean }>
): Array<{ cityId: number; direction: Direction; spawnPoint: { x: number; y: number }; isAttacker: boolean }> {
  const spawnPoints = get8DirectionSpawnPoints(mapSize);
  const usedDirections = new Set<Direction>();
  
  return armyCityPositions.map(army => {
    let direction = calculateAttackDirection(army.position, targetCityPosition);
    
    // 이미 사용된 방향이면 인접 방향 사용
    const directions: Direction[] = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const dirIndex = directions.indexOf(direction);
    
    while (usedDirections.has(direction)) {
      // 시계방향으로 다음 방향 시도
      const nextIndex = (directions.indexOf(direction) + 1) % 8;
      direction = directions[nextIndex];
      
      // 모든 방향이 사용되면 원래 방향 사용
      if (directions.indexOf(direction) === dirIndex) break;
    }
    
    usedDirections.add(direction);
    
    return {
      cityId: army.cityId,
      direction,
      spawnPoint: spawnPoints[direction],
      isAttacker: army.isAttacker,
    };
  });
}

// ========================================
// 맵 에디터 연동
// ========================================

/** 맵 템플릿 타입 */
export interface BattleMapTemplate {
  id: string;
  cityId: number;
  name: string;
  terrain: TerrainType;
  mapSize: { width: number; height: number };
  heightMap?: number[][];
  structures: CityStructure[];
  features: TerrainFeature[];
  spawnPoints: {
    attacker: { x: number; y: number }[];
    defender: { x: number; y: number }[];
  };
  createdAt: Date;
  updatedAt: Date;
}

/** 지형 요소 */
export interface TerrainFeature {
  type: 'tree' | 'rock' | 'water' | 'hill' | 'building' | 'bridge';
  position: { x: number; y: number };
  size: { width: number; height: number };
  rotation?: number;
}

// ========================================
// 승리 조건 및 점령 시스템
// ========================================

/** 승리 조건 타입 */
export type VictoryConditionType = 
  | 'annihilation'       // 전멸
  | 'capture_throne'     // 광장/왕좌 점령
  | 'capture_gates'      // 모든 성문 점령
  | 'time_limit'         // 시간 제한
  | 'morale_collapse'    // 사기 붕괴
  | 'general_killed'     // 장수 사망
  | 'hold_position';     // 거점 사수

/** 승리 조건 */
export interface VictoryCondition {
  type: VictoryConditionType;
  target?: string;
  targetPosition?: { x: number; y: number };
  duration?: number;       // 점령 유지 시간 (초)
  percentage?: number;     // 퍼센트 조건
  description: string;
}

/** 점령 포인트 */
export interface ControlPoint {
  id: string;
  name: string;
  position: { x: number; y: number };
  radius: number;
  controlTeam: 'attacker' | 'defender' | 'neutral';
  controlProgress: number;  // 0-100
  isVictoryPoint: boolean;
  captureTime: number;      // 점령에 필요한 시간 (초)
  bonusEffect?: string;
}

/** 점령 상태 */
export interface CaptureState {
  pointId: string;
  controlTeam: 'attacker' | 'defender' | 'neutral';
  progress: number;
  unitsInZone: {
    attacker: number;
    defender: number;
  };
}

/**
 * 공성전 기본 승리 조건 생성
 */
export function generateSiegeVictoryConditions(
  mapSize: { width: number; height: number }
): VictoryCondition[] {
  const cx = mapSize.width / 2;
  const cy = mapSize.height / 2;
  
  return [
    {
      type: 'capture_throne',
      target: 'throne',
      targetPosition: { x: cx, y: cy },
      duration: 60,  // 60초 점령 유지
      description: '공격측: 성의 광장을 60초간 점령하면 승리',
    },
    {
      type: 'annihilation',
      percentage: 90,
      description: '적 병력의 90%를 제거하면 승리',
    },
    {
      type: 'morale_collapse',
      description: '적 전체 사기가 붕괴하면 승리',
    },
    {
      type: 'time_limit',
      duration: 600,  // 10분
      description: '방어측: 10분간 광장을 사수하면 승리',
    },
  ];
}

/**
 * 공성전 점령 포인트 생성
 */
export function generateSiegeControlPoints(
  mapSize: { width: number; height: number },
  levelId: number
): ControlPoint[] {
  const cx = mapSize.width / 2;
  const cy = mapSize.height / 2;
  const wallRadius = 80 + levelId * 15;
  
  const controlPoints: ControlPoint[] = [
    // 중앙 광장 (핵심 승리 조건)
    {
      id: 'throne',
      name: '중앙 광장',
      position: { x: cx, y: cy },
      radius: 40,
      controlTeam: 'defender',
      controlProgress: 100,
      isVictoryPoint: true,
      captureTime: 60,  // 60초 점령 필요
      bonusEffect: '점령 시 승리',
    },
  ];
  
  // 4개 성문 점령 포인트
  const gateDirections = [
    { id: 'gate_north', name: '북문', dx: 0, dy: -wallRadius },
    { id: 'gate_east', name: '동문', dx: wallRadius, dy: 0 },
    { id: 'gate_south', name: '남문', dx: 0, dy: wallRadius },
    { id: 'gate_west', name: '서문', dx: -wallRadius, dy: 0 },
  ];
  
  for (const gate of gateDirections) {
    controlPoints.push({
      id: gate.id,
      name: gate.name,
      position: { x: cx + gate.dx, y: cy + gate.dy },
      radius: 25,
      controlTeam: 'defender',
      controlProgress: 100,
      isVictoryPoint: false,
      captureTime: 30,  // 30초 점령
      bonusEffect: '점령 시 해당 방향 지원군 진입 차단',
    });
  }
  
  // 레벨이 높으면 추가 전략 포인트
  if (levelId >= 8) {
    controlPoints.push({
      id: 'palace',
      name: '궁전',
      position: { x: cx, y: cy },
      radius: 30,
      controlTeam: 'defender',
      controlProgress: 100,
      isVictoryPoint: false,
      captureTime: 45,
      bonusEffect: '점령 시 방어측 사기 -30',
    });
  }
  
  return controlPoints;
}

/**
 * API에서 맵 템플릿 로드
 */
export async function loadMapTemplate(cityId: number): Promise<BattleMapTemplate | null> {
  try {
    const response = await fetch(`/api/battlemap-editor/templates/${cityId}`);
    if (!response.ok) {
      console.warn(`[CityTerrainMapping] 맵 템플릿 없음: cityId=${cityId}`);
      return null;
    }
    const data = await response.json();
    return data.data as BattleMapTemplate;
  } catch (error) {
    console.error('[CityTerrainMapping] 맵 템플릿 로드 실패:', error);
    return null;
  }
}

/**
 * 맵 템플릿 저장 (에디터용)
 */
export async function saveMapTemplate(template: Partial<BattleMapTemplate>): Promise<boolean> {
  try {
    const response = await fetch('/api/battlemap-editor/templates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(template),
    });
    return response.ok;
  } catch (error) {
    console.error('[CityTerrainMapping] 맵 템플릿 저장 실패:', error);
    return false;
  }
}

/**
 * 맵 템플릿 업데이트 (에디터용)
 */
export async function updateMapTemplate(id: string, template: Partial<BattleMapTemplate>): Promise<boolean> {
  try {
    const response = await fetch(`/api/battlemap-editor/templates/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(template),
    });
    return response.ok;
  } catch (error) {
    console.error('[CityTerrainMapping] 맵 템플릿 업데이트 실패:', error);
    return false;
  }
}

export default {
  // 지형 관련
  getCityTerrain,
  getCityWallConfig,
  REGION_TERRAIN_MAP,
  CITY_TERRAIN_OVERRIDE,
  CITY_LEVEL_WALL_CONFIG,
  
  // 맵 생성
  generateSiegeStructures,
  createCityBattleMap,
  
  // 8방향 시스템
  get8DirectionSpawnPoints,
  calculateAttackDirection,
  getSupportSpawnPoint,
  getMultipleArmySpawns,
  DIRECTION_ANGLES,
  
  // 맵 에디터
  loadMapTemplate,
  saveMapTemplate,
  updateMapTemplate,
};

