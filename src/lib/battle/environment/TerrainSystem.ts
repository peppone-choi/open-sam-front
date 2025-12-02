/**
 * TerrainSystem.ts
 * 토탈워 스타일 전장 지형 및 환경 효과 시스템
 * 
 * 주요 기능:
 * 1. 지형 맵 생성 (절차적 생성 + 프리셋)
 * 2. 지형 효과 적용 (이동, 전투, 사기)
 * 3. 시야 시스템 (LOS - Line of Sight)
 * 4. 날씨 효과 (비, 안개, 눈, 바람)
 */

import { Vector2 } from '../TotalWarEngine';

// ========================================
// 지형 타입 정의
// ========================================

/** 지형 타입 */
export type TerrainType = 
  | 'plains'   // 평지 - 기본
  | 'forest'   // 숲 - 이동↓, 원거리↓, 은폐
  | 'hill'     // 언덕 - 이동↓, 고지 이점
  | 'river'    // 강 - 이동↓↓, 기병↓
  | 'swamp'    // 습지 - 이동↓↓↓, 기병 진입불가
  | 'road'     // 도로 - 이동↑
  | 'bridge'   // 다리 - 좁은 통로
  | 'mountain' // 산 - 진입 불가
  | 'camp';    // 진영 - 사기 보너스

/** 지형 효과 설정 */
export interface TerrainEffect {
  /** 이동 속도 배율 (1.0 = 기본) */
  movementModifier: number;
  /** 기병 추가 이동 페널티 (기본 movementModifier에 곱함) */
  cavalryModifier: number;
  /** 원거리 공격 명중률 배율 */
  rangedAccuracyModifier: number;
  /** 근접 공격 배율 */
  meleeModifier: number;
  /** 방어 보너스 */
  defenseBonus: number;
  /** 돌격 보너스 배율 */
  chargeModifier: number;
  /** 은폐 여부 (숲 등) */
  providesConcealment: boolean;
  /** 고지 여부 (언덕 등) */
  isElevated: boolean;
  /** 진입 가능 여부 */
  isPassable: boolean;
  /** 기병 진입 가능 여부 */
  cavalryPassable: boolean;
  /** 시야 차단 여부 */
  blocksLineOfSight: boolean;
  /** 시야 거리 배율 */
  visionModifier: number;
  /** 높이 (렌더링용) */
  height: number;
  /** 피로도 증가 배율 */
  fatigueModifier: number;
  /** 사기 보너스 */
  moraleBonus: number;
  /** 색상 (렌더링용) */
  color: number;
  /** 설명 */
  description: string;
}

/** 지형별 효과 설정 테이블 */
export const TERRAIN_EFFECTS: Record<TerrainType, TerrainEffect> = {
  plains: {
    movementModifier: 1.0,
    cavalryModifier: 1.0,
    rangedAccuracyModifier: 1.0,
    meleeModifier: 1.0,
    defenseBonus: 0,
    chargeModifier: 1.0,
    providesConcealment: false,
    isElevated: false,
    isPassable: true,
    cavalryPassable: true,
    blocksLineOfSight: false,
    visionModifier: 1.0,
    height: 0,
    fatigueModifier: 1.0,
    moraleBonus: 0,
    color: 0x4a7c3f,
    description: '평지 - 기본 지형',
  },
  forest: {
    movementModifier: 0.7,    // -30%
    cavalryModifier: 0.8,     // 기병 추가 -20%
    rangedAccuracyModifier: 0.5, // -50%
    meleeModifier: 1.0,
    defenseBonus: 10,
    chargeModifier: 0.5,      // 돌격 -50%
    providesConcealment: true,
    isElevated: false,
    isPassable: true,
    cavalryPassable: true,
    blocksLineOfSight: true,
    visionModifier: 0.5,
    height: 0.3,
    fatigueModifier: 1.2,
    moraleBonus: 0,
    color: 0x2d5a27,
    description: '숲 - 은폐, 원거리 불리',
  },
  hill: {
    movementModifier: 0.8,    // -20%
    cavalryModifier: 0.9,
    rangedAccuracyModifier: 1.2, // 고지 이점 +20%
    meleeModifier: 1.1,       // 고지 이점 +10%
    defenseBonus: 15,
    chargeModifier: 0.7,      // 오르막 돌격 불리
    providesConcealment: false,
    isElevated: true,
    isPassable: true,
    cavalryPassable: true,
    blocksLineOfSight: false,
    visionModifier: 1.5,      // 시야 +50%
    height: 2.0,
    fatigueModifier: 1.3,
    moraleBonus: 5,
    color: 0x6b8e23,
    description: '언덕 - 고지 이점, 시야 증가',
  },
  river: {
    movementModifier: 0.5,    // -50%
    cavalryModifier: 0.7,     // 기병 추가 -30%
    rangedAccuracyModifier: 0.8,
    meleeModifier: 0.8,
    defenseBonus: -10,        // 방어 불리
    chargeModifier: 0.3,      // 돌격 매우 불리
    providesConcealment: false,
    isElevated: false,
    isPassable: true,
    cavalryPassable: true,
    blocksLineOfSight: false,
    visionModifier: 1.0,
    height: -0.5,
    fatigueModifier: 1.5,
    moraleBonus: -5,
    color: 0x4169e1,
    description: '강 - 이동 매우 느림, 기병 불리',
  },
  swamp: {
    movementModifier: 0.4,    // -60%
    cavalryModifier: 0.0,     // 기병 진입 불가
    rangedAccuracyModifier: 0.9,
    meleeModifier: 0.9,
    defenseBonus: -5,
    chargeModifier: 0.2,      // 돌격 거의 불가
    providesConcealment: false,
    isElevated: false,
    isPassable: true,
    cavalryPassable: false,   // 기병 진입 불가
    blocksLineOfSight: false,
    visionModifier: 0.9,
    height: -0.3,
    fatigueModifier: 2.0,     // 피로도 2배
    moraleBonus: -10,
    color: 0x556b2f,
    description: '습지 - 매우 느림, 기병 진입 불가',
  },
  road: {
    movementModifier: 1.2,    // +20%
    cavalryModifier: 1.1,
    rangedAccuracyModifier: 1.0,
    meleeModifier: 1.0,
    defenseBonus: 0,
    chargeModifier: 1.2,      // 돌격 +20%
    providesConcealment: false,
    isElevated: false,
    isPassable: true,
    cavalryPassable: true,
    blocksLineOfSight: false,
    visionModifier: 1.0,
    height: 0.1,
    fatigueModifier: 0.8,     // 피로도 -20%
    moraleBonus: 0,
    color: 0xa0522d,
    description: '도로 - 빠른 이동',
  },
  bridge: {
    movementModifier: 1.0,
    cavalryModifier: 0.8,
    rangedAccuracyModifier: 1.0,
    meleeModifier: 1.1,       // 좁은 공간 방어 유리
    defenseBonus: 20,
    chargeModifier: 0.6,      // 좁은 공간 돌격 불리
    providesConcealment: false,
    isElevated: false,
    isPassable: true,
    cavalryPassable: true,
    blocksLineOfSight: false,
    visionModifier: 1.0,
    height: 0.5,
    fatigueModifier: 1.0,
    moraleBonus: 0,
    color: 0x8b4513,
    description: '다리 - 좁은 통로, 방어 유리',
  },
  mountain: {
    movementModifier: 0.0,
    cavalryModifier: 0.0,
    rangedAccuracyModifier: 0.0,
    meleeModifier: 0.0,
    defenseBonus: 0,
    chargeModifier: 0.0,
    providesConcealment: false,
    isElevated: true,
    isPassable: false,        // 진입 불가
    cavalryPassable: false,
    blocksLineOfSight: true,
    visionModifier: 0,
    height: 5.0,
    fatigueModifier: 1.0,
    moraleBonus: 0,
    color: 0x696969,
    description: '산 - 진입 불가',
  },
  camp: {
    movementModifier: 1.0,
    cavalryModifier: 1.0,
    rangedAccuracyModifier: 1.0,
    meleeModifier: 1.1,
    defenseBonus: 25,
    chargeModifier: 0.8,
    providesConcealment: false,
    isElevated: false,
    isPassable: true,
    cavalryPassable: true,
    blocksLineOfSight: false,
    visionModifier: 1.0,
    height: 0.2,
    fatigueModifier: 0.7,     // 피로 회복 빠름
    moraleBonus: 15,
    color: 0xdaa520,
    description: '진영 - 방어/사기 보너스',
  },
};

// ========================================
// 날씨 시스템
// ========================================

/** 날씨 타입 */
export type WeatherType = 
  | 'clear'  // 맑음
  | 'rain'   // 비 - 화살 -20%, 화공 무효
  | 'fog'    // 안개 - 시야 -50%
  | 'snow'   // 눈 - 이동 -20%, 피로 +50%
  | 'wind';  // 바람 - 화살 편향

/** 바람 방향 (라디안) */
export type WindDirection = number;

/** 날씨 효과 설정 */
export interface WeatherEffect {
  /** 이동 속도 배율 */
  movementModifier: number;
  /** 원거리 명중률 배율 */
  rangedAccuracyModifier: number;
  /** 화살 편향 각도 (라디안) */
  projectileDeviation: number;
  /** 시야 거리 배율 */
  visionModifier: number;
  /** 피로도 증가 배율 */
  fatigueModifier: number;
  /** 화공 유효 여부 */
  fireEffective: boolean;
  /** 안개 농도 (0~1) */
  fogDensity: number;
  /** 하늘 색상 */
  skyColor: number;
  /** 안개 색상 */
  fogColor: number;
  /** 설명 */
  description: string;
}

/** 날씨별 효과 설정 테이블 */
export const WEATHER_EFFECTS: Record<WeatherType, WeatherEffect> = {
  clear: {
    movementModifier: 1.0,
    rangedAccuracyModifier: 1.0,
    projectileDeviation: 0,
    visionModifier: 1.0,
    fatigueModifier: 1.0,
    fireEffective: true,
    fogDensity: 0,
    skyColor: 0x87ceeb,
    fogColor: 0x87ceeb,
    description: '맑음 - 기본 날씨',
  },
  rain: {
    movementModifier: 0.95,
    rangedAccuracyModifier: 0.8,   // -20%
    projectileDeviation: 0.1,
    visionModifier: 0.8,
    fatigueModifier: 1.1,
    fireEffective: false,          // 화공 무효
    fogDensity: 0.1,
    skyColor: 0x708090,
    fogColor: 0x708090,
    description: '비 - 화살 -20%, 화공 무효',
  },
  fog: {
    movementModifier: 0.95,
    rangedAccuracyModifier: 0.7,
    projectileDeviation: 0.05,
    visionModifier: 0.5,           // -50%
    fatigueModifier: 1.0,
    fireEffective: true,
    fogDensity: 0.5,
    skyColor: 0xc0c0c0,
    fogColor: 0xd3d3d3,
    description: '안개 - 시야 -50%',
  },
  snow: {
    movementModifier: 0.8,         // -20%
    rangedAccuracyModifier: 0.85,
    projectileDeviation: 0.08,
    visionModifier: 0.7,
    fatigueModifier: 1.5,          // +50%
    fireEffective: true,
    fogDensity: 0.2,
    skyColor: 0xdcdcdc,
    fogColor: 0xf0f0f0,
    description: '눈 - 이동 -20%, 피로 +50%',
  },
  wind: {
    movementModifier: 0.95,
    rangedAccuracyModifier: 0.9,
    projectileDeviation: 0.25,     // 큰 편향
    visionModifier: 1.0,
    fatigueModifier: 1.1,
    fireEffective: true,           // 화공은 바람 방향으로 확산
    fogDensity: 0,
    skyColor: 0x87ceeb,
    fogColor: 0x87ceeb,
    description: '바람 - 화살 편향',
  },
};

// ========================================
// 지형 셀 데이터
// ========================================

/** 단일 지형 셀 */
export interface TerrainCell {
  x: number;
  z: number;
  type: TerrainType;
  height: number;
  /** 추가 효과 (특수 지형) */
  additionalEffects?: Partial<TerrainEffect>;
  /** 소속 영역 ID (점령 시스템용) */
  zoneId?: string;
}

/** 지형 맵 */
export interface TerrainMap {
  width: number;
  height: number;
  cellSize: number;  // 셀 하나의 월드 크기
  cells: TerrainCell[][];
  /** 맵 메타데이터 */
  metadata: {
    name: string;
    description: string;
    weather: WeatherType;
    windDirection: WindDirection;
    timeOfDay: 'dawn' | 'day' | 'dusk' | 'night';
  };
}

// ========================================
// 시야 시스템
// ========================================

/** 시야 쿼리 결과 */
export interface LineOfSightResult {
  /** 시야가 확보되는지 */
  visible: boolean;
  /** 가로막는 지형 위치 (없으면 undefined) */
  blockedAt?: Vector2;
  /** 가로막는 지형 타입 */
  blockedBy?: TerrainType;
  /** 시야 거리 */
  distance: number;
  /** 고도 차이 */
  elevationDiff: number;
}

/** 가시성 맵 (유닛별 시야 캐시) */
export interface VisibilityMap {
  unitId: string;
  timestamp: number;
  visibleCells: Set<string>;  // "x,z" 형식의 셀 키
  visibleUnits: Set<string>;
}

// ========================================
// 지형 시스템 메인 클래스
// ========================================

export class TerrainSystem {
  private map: TerrainMap | null = null;
  private currentWeather: WeatherType = 'clear';
  private windDirection: WindDirection = 0;
  private visibilityCache: Map<string, VisibilityMap> = new Map();
  
  // 성능 최적화: 지형 쿼리 캐시
  private terrainCache: Map<string, TerrainCell> = new Map();
  
  constructor() {
    // 기본 초기화
  }
  
  // ========================================
  // 맵 생성 및 로드
  // ========================================
  
  /**
   * 절차적 지형 맵 생성
   * @param width 맵 너비 (셀 수)
   * @param height 맵 높이 (셀 수)
   * @param cellSize 셀 하나의 월드 크기
   * @param options 생성 옵션
   */
  generateMap(
    width: number,
    height: number,
    cellSize: number = 10,
    options: MapGenerationOptions = {}
  ): TerrainMap {
    const {
      forestDensity = 0.15,
      hillDensity = 0.1,
      riverChance = 0.3,
      swampDensity = 0.05,
      roadPattern = 'cross',
      seed = Date.now(),
    } = options;
    
    // 간단한 시드 기반 난수 생성기
    const random = this.createSeededRandom(seed);
    
    // 기본 셀 초기화 (평지)
    const cells: TerrainCell[][] = [];
    for (let z = 0; z < height; z++) {
      cells[z] = [];
      for (let x = 0; x < width; x++) {
        cells[z][x] = {
          x,
          z,
          type: 'plains',
          height: 0,
        };
      }
    }
    
    // 노이즈 기반 고도 맵 생성
    const heightMap = this.generateHeightMap(width, height, random);
    
    // 언덕 배치 (고도 기반)
    for (let z = 0; z < height; z++) {
      for (let x = 0; x < width; x++) {
        if (heightMap[z][x] > 0.6) {
          cells[z][x].type = 'hill';
          cells[z][x].height = heightMap[z][x] * 3;
        } else if (heightMap[z][x] > 0.8) {
          cells[z][x].type = 'mountain';
          cells[z][x].height = heightMap[z][x] * 6;
        }
      }
    }
    
    // 숲 배치 (클러스터링)
    this.placeForests(cells, width, height, forestDensity, random);
    
    // 강 생성
    if (random() < riverChance) {
      this.generateRiver(cells, width, height, random);
    }
    
    // 습지 배치 (강 주변)
    this.placeSwamps(cells, width, height, swampDensity, random);
    
    // 도로 배치
    this.placeRoads(cells, width, height, roadPattern);
    
    // 다리 배치 (도로와 강 교차점)
    this.placeBridges(cells, width, height);
    
    // 캐시 초기화
    this.terrainCache.clear();
    
    this.map = {
      width,
      height,
      cellSize,
      cells,
      metadata: {
        name: `전장-${seed}`,
        description: '절차적으로 생성된 전장',
        weather: 'clear',
        windDirection: random() * Math.PI * 2,
        timeOfDay: 'day',
      },
    };
    
    return this.map;
  }
  
  /**
   * 프리셋 맵 로드
   */
  loadPresetMap(presetName: string): TerrainMap {
    const preset = MAP_PRESETS[presetName];
    if (!preset) {
      console.warn(`Unknown map preset: ${presetName}, using default`);
      return this.generateMap(40, 40);
    }
    
    this.map = preset;
    this.terrainCache.clear();
    return this.map;
  }
  
  /**
   * 현재 맵 반환
   */
  getMap(): TerrainMap | null {
    return this.map;
  }
  
  // ========================================
  // 지형 쿼리
  // ========================================
  
  /**
   * 월드 좌표에서 지형 셀 조회
   * @param worldX 월드 X 좌표
   * @param worldZ 월드 Z 좌표
   */
  getTerrainAt(worldX: number, worldZ: number): TerrainCell | null {
    if (!this.map) return null;
    
    // 캐시 키
    const cacheKey = `${Math.floor(worldX)},${Math.floor(worldZ)}`;
    if (this.terrainCache.has(cacheKey)) {
      return this.terrainCache.get(cacheKey)!;
    }
    
    // 월드 좌표 → 셀 인덱스
    const cellX = Math.floor((worldX + (this.map.width * this.map.cellSize) / 2) / this.map.cellSize);
    const cellZ = Math.floor((worldZ + (this.map.height * this.map.cellSize) / 2) / this.map.cellSize);
    
    // 범위 체크
    if (cellX < 0 || cellX >= this.map.width || cellZ < 0 || cellZ >= this.map.height) {
      return null;
    }
    
    const cell = this.map.cells[cellZ][cellX];
    this.terrainCache.set(cacheKey, cell);
    return cell;
  }
  
  /**
   * 지형 효과 조회
   * @param terrainType 지형 타입
   */
  getTerrainEffect(terrainType: TerrainType): TerrainEffect {
    return TERRAIN_EFFECTS[terrainType];
  }
  
  /**
   * 특정 위치의 복합 효과 계산 (지형 + 날씨)
   */
  getCombinedEffectsAt(worldX: number, worldZ: number): CombinedTerrainEffect {
    const cell = this.getTerrainAt(worldX, worldZ);
    const terrainEffect = cell 
      ? TERRAIN_EFFECTS[cell.type] 
      : TERRAIN_EFFECTS.plains;
    const weatherEffect = WEATHER_EFFECTS[this.currentWeather];
    
    return {
      movementModifier: terrainEffect.movementModifier * weatherEffect.movementModifier,
      cavalryModifier: terrainEffect.cavalryModifier,
      rangedAccuracyModifier: terrainEffect.rangedAccuracyModifier * weatherEffect.rangedAccuracyModifier,
      meleeModifier: terrainEffect.meleeModifier,
      defenseBonus: terrainEffect.defenseBonus,
      chargeModifier: terrainEffect.chargeModifier,
      providesConcealment: terrainEffect.providesConcealment,
      isElevated: terrainEffect.isElevated,
      isPassable: terrainEffect.isPassable,
      cavalryPassable: terrainEffect.cavalryPassable,
      visionModifier: terrainEffect.visionModifier * weatherEffect.visionModifier,
      fatigueModifier: terrainEffect.fatigueModifier * weatherEffect.fatigueModifier,
      moraleBonus: terrainEffect.moraleBonus,
      fireEffective: weatherEffect.fireEffective,
      projectileDeviation: weatherEffect.projectileDeviation,
      height: cell?.height ?? 0,
      terrainType: cell?.type ?? 'plains',
      weather: this.currentWeather,
    };
  }
  
  // ========================================
  // 날씨 시스템
  // ========================================
  
  /**
   * 날씨 변경
   */
  setWeather(weather: WeatherType, windDirection?: WindDirection): void {
    this.currentWeather = weather;
    if (windDirection !== undefined) {
      this.windDirection = windDirection;
    }
    
    // 맵 메타데이터 업데이트
    if (this.map) {
      this.map.metadata.weather = weather;
      if (windDirection !== undefined) {
        this.map.metadata.windDirection = windDirection;
      }
    }
    
    // 시야 캐시 무효화
    this.visibilityCache.clear();
  }
  
  /**
   * 현재 날씨 조회
   */
  getWeather(): WeatherType {
    return this.currentWeather;
  }
  
  /**
   * 날씨 효과 조회
   */
  getWeatherEffect(): WeatherEffect {
    return WEATHER_EFFECTS[this.currentWeather];
  }
  
  /**
   * 바람 방향 조회
   */
  getWindDirection(): WindDirection {
    return this.windDirection;
  }
  
  /**
   * 투사체 편향 계산 (바람 영향)
   * @param from 발사 위치
   * @param to 목표 위치
   * @returns 편향된 목표 위치
   */
  calculateProjectileDeviation(from: Vector2, to: Vector2): Vector2 {
    const weatherEffect = WEATHER_EFFECTS[this.currentWeather];
    if (weatherEffect.projectileDeviation === 0) {
      return to;
    }
    
    // 거리 계산
    const dx = to.x - from.x;
    const dz = to.z - from.z;
    const distance = Math.sqrt(dx * dx + dz * dz);
    
    // 바람 방향으로 편향
    const deviation = weatherEffect.projectileDeviation * (distance / 50); // 거리 비례 편향
    const windOffsetX = Math.cos(this.windDirection) * deviation * (Math.random() - 0.5) * 2;
    const windOffsetZ = Math.sin(this.windDirection) * deviation * (Math.random() - 0.5) * 2;
    
    return {
      x: to.x + windOffsetX * 10,
      z: to.z + windOffsetZ * 10,
    };
  }
  
  // ========================================
  // 시야 시스템 (Line of Sight)
  // ========================================
  
  /**
   * 두 위치 사이의 시야 확인
   * @param from 관찰자 위치
   * @param to 목표 위치
   * @param observerElevated 관찰자가 고지에 있는지
   */
  checkLineOfSight(
    from: Vector2,
    to: Vector2,
    observerElevated: boolean = false
  ): LineOfSightResult {
    if (!this.map) {
      return { visible: true, distance: 0, elevationDiff: 0 };
    }
    
    const dx = to.x - from.x;
    const dz = to.z - from.z;
    const distance = Math.sqrt(dx * dx + dz * dz);
    
    // 기본 시야 범위 (날씨 적용)
    const weatherEffect = WEATHER_EFFECTS[this.currentWeather];
    const baseVision = 100 * weatherEffect.visionModifier;
    const effectiveVision = observerElevated ? baseVision * 1.5 : baseVision;
    
    // 시야 범위 초과
    if (distance > effectiveVision) {
      return {
        visible: false,
        distance,
        elevationDiff: 0,
      };
    }
    
    // 레이캐스팅으로 시야 차단 체크
    const steps = Math.ceil(distance / this.map.cellSize);
    const stepX = dx / steps;
    const stepZ = dz / steps;
    
    let fromHeight = this.getTerrainAt(from.x, from.z)?.height ?? 0;
    const toHeight = this.getTerrainAt(to.x, to.z)?.height ?? 0;
    
    // 관찰자 높이 보정
    if (observerElevated) {
      fromHeight += 2;
    }
    
    for (let i = 1; i < steps; i++) {
      const checkX = from.x + stepX * i;
      const checkZ = from.z + stepZ * i;
      const cell = this.getTerrainAt(checkX, checkZ);
      
      if (cell) {
        const terrainEffect = TERRAIN_EFFECTS[cell.type];
        
        // 시야 차단 지형 체크
        if (terrainEffect.blocksLineOfSight) {
          // 높이 비교 (더 높은 곳에서 보면 일부 지형 너머 볼 수 있음)
          const progressRatio = i / steps;
          const expectedHeight = fromHeight + (toHeight - fromHeight) * progressRatio;
          
          if (cell.height > expectedHeight + 1) {
            return {
              visible: false,
              blockedAt: { x: checkX, z: checkZ },
              blockedBy: cell.type,
              distance,
              elevationDiff: toHeight - fromHeight,
            };
          }
        }
      }
    }
    
    return {
      visible: true,
      distance,
      elevationDiff: toHeight - fromHeight,
    };
  }
  
  /**
   * 유닛의 가시 영역 계산
   * @param unitId 유닛 ID
   * @param position 유닛 위치
   * @param visionRange 기본 시야 범위
   * @param isElevated 고지에 있는지
   */
  calculateVisibility(
    unitId: string,
    position: Vector2,
    visionRange: number,
    isElevated: boolean = false
  ): VisibilityMap {
    if (!this.map) {
      return {
        unitId,
        timestamp: Date.now(),
        visibleCells: new Set(),
        visibleUnits: new Set(),
      };
    }
    
    const visibleCells = new Set<string>();
    const weatherEffect = WEATHER_EFFECTS[this.currentWeather];
    const effectiveRange = visionRange * weatherEffect.visionModifier * (isElevated ? 1.5 : 1);
    
    // 시야 범위 내 셀 스캔
    const cellsToCheck = Math.ceil(effectiveRange / this.map.cellSize);
    const centerX = Math.floor((position.x + (this.map.width * this.map.cellSize) / 2) / this.map.cellSize);
    const centerZ = Math.floor((position.z + (this.map.height * this.map.cellSize) / 2) / this.map.cellSize);
    
    for (let dz = -cellsToCheck; dz <= cellsToCheck; dz++) {
      for (let dx = -cellsToCheck; dx <= cellsToCheck; dx++) {
        const cellX = centerX + dx;
        const cellZ = centerZ + dz;
        
        // 범위 체크
        if (cellX < 0 || cellX >= this.map.width || cellZ < 0 || cellZ >= this.map.height) {
          continue;
        }
        
        // 원형 범위 체크
        const worldX = (cellX - this.map.width / 2) * this.map.cellSize;
        const worldZ = (cellZ - this.map.height / 2) * this.map.cellSize;
        const dist = Math.sqrt(
          Math.pow(worldX - position.x, 2) + Math.pow(worldZ - position.z, 2)
        );
        
        if (dist > effectiveRange) continue;
        
        // 시야 확인
        const los = this.checkLineOfSight(position, { x: worldX, z: worldZ }, isElevated);
        if (los.visible) {
          visibleCells.add(`${cellX},${cellZ}`);
        }
      }
    }
    
    const visibilityMap: VisibilityMap = {
      unitId,
      timestamp: Date.now(),
      visibleCells,
      visibleUnits: new Set(),  // 유닛 가시성은 별도 처리
    };
    
    // 캐시 저장
    this.visibilityCache.set(unitId, visibilityMap);
    
    return visibilityMap;
  }
  
  /**
   * 목표가 은폐 상태인지 확인
   * @param targetPosition 목표 위치
   * @param observerPosition 관찰자 위치
   */
  isConcealed(targetPosition: Vector2, observerPosition: Vector2): boolean {
    const targetTerrain = this.getTerrainAt(targetPosition.x, targetPosition.z);
    if (!targetTerrain) return false;
    
    const terrainEffect = TERRAIN_EFFECTS[targetTerrain.type];
    
    // 숲 등 은폐 지형에 있으면 은폐 상태
    if (terrainEffect.providesConcealment) {
      // 시야 확인
      const los = this.checkLineOfSight(observerPosition, targetPosition);
      // 시야가 확보되지 않거나, 가까운 거리(10 이내)가 아니면 은폐 유효
      return !los.visible || los.distance > 10;
    }
    
    return false;
  }
  
  // ========================================
  // 맵 생성 헬퍼 함수
  // ========================================
  
  private createSeededRandom(seed: number): () => number {
    return () => {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      return seed / 0x7fffffff;
    };
  }
  
  private generateHeightMap(width: number, height: number, random: () => number): number[][] {
    const heightMap: number[][] = [];
    
    // 간단한 펄린 노이즈 근사
    const octaves = 4;
    const persistence = 0.5;
    
    for (let z = 0; z < height; z++) {
      heightMap[z] = [];
      for (let x = 0; x < width; x++) {
        let value = 0;
        let amplitude = 1;
        let frequency = 0.1;
        
        for (let o = 0; o < octaves; o++) {
          // 간단한 노이즈 함수
          const nx = x * frequency;
          const nz = z * frequency;
          const noise = (Math.sin(nx + random() * 10) * Math.cos(nz + random() * 10) + 1) / 2;
          value += noise * amplitude;
          amplitude *= persistence;
          frequency *= 2;
        }
        
        heightMap[z][x] = value / 2; // 0~1 범위로 정규화
      }
    }
    
    return heightMap;
  }
  
  private placeForests(
    cells: TerrainCell[][],
    width: number,
    height: number,
    density: number,
    random: () => number
  ): void {
    const forestCells = Math.floor(width * height * density);
    let placed = 0;
    
    while (placed < forestCells) {
      const x = Math.floor(random() * width);
      const z = Math.floor(random() * height);
      
      if (cells[z][x].type === 'plains') {
        cells[z][x].type = 'forest';
        cells[z][x].height = 0.3;
        placed++;
        
        // 클러스터링: 주변에도 숲 배치
        for (let dz = -1; dz <= 1; dz++) {
          for (let dx = -1; dx <= 1; dx++) {
            const nx = x + dx;
            const nz = z + dz;
            if (
              nx >= 0 && nx < width &&
              nz >= 0 && nz < height &&
              cells[nz][nx].type === 'plains' &&
              random() < 0.4 &&
              placed < forestCells
            ) {
              cells[nz][nx].type = 'forest';
              cells[nz][nx].height = 0.3;
              placed++;
            }
          }
        }
      }
    }
  }
  
  private generateRiver(
    cells: TerrainCell[][],
    width: number,
    height: number,
    random: () => number
  ): void {
    // 강 시작점 (맵 가장자리)
    const startSide = Math.floor(random() * 4); // 0: 상, 1: 우, 2: 하, 3: 좌
    let x: number, z: number;
    let dirX: number, dirZ: number;
    
    switch (startSide) {
      case 0: // 상단에서 시작
        x = Math.floor(width * 0.3 + random() * width * 0.4);
        z = 0;
        dirX = (random() - 0.5) * 0.5;
        dirZ = 1;
        break;
      case 1: // 우측에서 시작
        x = width - 1;
        z = Math.floor(height * 0.3 + random() * height * 0.4);
        dirX = -1;
        dirZ = (random() - 0.5) * 0.5;
        break;
      case 2: // 하단에서 시작
        x = Math.floor(width * 0.3 + random() * width * 0.4);
        z = height - 1;
        dirX = (random() - 0.5) * 0.5;
        dirZ = -1;
        break;
      default: // 좌측에서 시작
        x = 0;
        z = Math.floor(height * 0.3 + random() * height * 0.4);
        dirX = 1;
        dirZ = (random() - 0.5) * 0.5;
        break;
    }
    
    // 강 경로 생성
    const riverWidth = 1 + Math.floor(random() * 2);
    
    while (x >= 0 && x < width && z >= 0 && z < height) {
      for (let w = -riverWidth; w <= riverWidth; w++) {
        const rx = Math.floor(x) + w;
        if (rx >= 0 && rx < width && Math.floor(z) >= 0 && Math.floor(z) < height) {
          const cell = cells[Math.floor(z)][rx];
          if (cell.type !== 'mountain' && cell.type !== 'hill') {
            cell.type = 'river';
            cell.height = -0.5;
          }
        }
      }
      
      // 방향 약간 변경 (굴곡)
      dirX += (random() - 0.5) * 0.3;
      dirZ += (random() - 0.5) * 0.3;
      
      // 정규화
      const len = Math.sqrt(dirX * dirX + dirZ * dirZ);
      dirX /= len;
      dirZ /= len;
      
      x += dirX;
      z += dirZ;
    }
  }
  
  private placeSwamps(
    cells: TerrainCell[][],
    width: number,
    height: number,
    density: number,
    random: () => number
  ): void {
    // 강 주변에 습지 배치
    for (let z = 0; z < height; z++) {
      for (let x = 0; x < width; x++) {
        if (cells[z][x].type === 'river') {
          // 강 주변 체크
          for (let dz = -2; dz <= 2; dz++) {
            for (let dx = -2; dx <= 2; dx++) {
              const nx = x + dx;
              const nz = z + dz;
              if (
                nx >= 0 && nx < width &&
                nz >= 0 && nz < height &&
                cells[nz][nx].type === 'plains' &&
                random() < density * 2
              ) {
                cells[nz][nx].type = 'swamp';
                cells[nz][nx].height = -0.3;
              }
            }
          }
        }
      }
    }
  }
  
  private placeRoads(
    cells: TerrainCell[][],
    width: number,
    height: number,
    pattern: 'cross' | 'horizontal' | 'vertical' | 'diagonal' | 'none'
  ): void {
    if (pattern === 'none') return;
    
    const midX = Math.floor(width / 2);
    const midZ = Math.floor(height / 2);
    
    switch (pattern) {
      case 'cross':
        // 가로 도로
        for (let x = 0; x < width; x++) {
          this.setRoadCell(cells, x, midZ);
        }
        // 세로 도로
        for (let z = 0; z < height; z++) {
          this.setRoadCell(cells, midX, z);
        }
        break;
      case 'horizontal':
        for (let x = 0; x < width; x++) {
          this.setRoadCell(cells, x, midZ);
        }
        break;
      case 'vertical':
        for (let z = 0; z < height; z++) {
          this.setRoadCell(cells, midX, z);
        }
        break;
      case 'diagonal':
        for (let i = 0; i < Math.min(width, height); i++) {
          this.setRoadCell(cells, i, i);
        }
        break;
    }
  }
  
  private setRoadCell(cells: TerrainCell[][], x: number, z: number): void {
    if (x < 0 || x >= cells[0].length || z < 0 || z >= cells.length) return;
    
    // 강이나 산은 도로로 바꾸지 않음
    if (cells[z][x].type !== 'river' && cells[z][x].type !== 'mountain') {
      cells[z][x].type = 'road';
      cells[z][x].height = 0.1;
    }
  }
  
  private placeBridges(
    cells: TerrainCell[][],
    width: number,
    height: number
  ): void {
    // 도로와 강이 만나는 지점에 다리 배치
    for (let z = 0; z < height; z++) {
      for (let x = 0; x < width; x++) {
        if (cells[z][x].type === 'river') {
          // 주변에 도로가 있는지 확인
          const hasRoadNearby = [
            [x - 1, z], [x + 1, z], [x, z - 1], [x, z + 1]
          ].some(([nx, nz]) => {
            if (nx >= 0 && nx < width && nz >= 0 && nz < height) {
              return cells[nz][nx].type === 'road';
            }
            return false;
          });
          
          if (hasRoadNearby) {
            cells[z][x].type = 'bridge';
            cells[z][x].height = 0.5;
          }
        }
      }
    }
  }
}

// ========================================
// 보조 타입 및 인터페이스
// ========================================

/** 맵 생성 옵션 */
export interface MapGenerationOptions {
  /** 숲 밀도 (0~1) */
  forestDensity?: number;
  /** 언덕 밀도 (0~1) */
  hillDensity?: number;
  /** 강 생성 확률 (0~1) */
  riverChance?: number;
  /** 습지 밀도 (0~1) */
  swampDensity?: number;
  /** 도로 패턴 */
  roadPattern?: 'cross' | 'horizontal' | 'vertical' | 'diagonal' | 'none';
  /** 랜덤 시드 */
  seed?: number;
}

/** 복합 지형 효과 (지형 + 날씨) */
export interface CombinedTerrainEffect {
  movementModifier: number;
  cavalryModifier: number;
  rangedAccuracyModifier: number;
  meleeModifier: number;
  defenseBonus: number;
  chargeModifier: number;
  providesConcealment: boolean;
  isElevated: boolean;
  isPassable: boolean;
  cavalryPassable: boolean;
  visionModifier: number;
  fatigueModifier: number;
  moraleBonus: number;
  fireEffective: boolean;
  projectileDeviation: number;
  height: number;
  terrainType: TerrainType;
  weather: WeatherType;
}

// ========================================
// 프리셋 맵
// ========================================

/** 프리셋 맵 정의 */
export const MAP_PRESETS: Record<string, TerrainMap> = {
  // 프리셋은 필요에 따라 추가
};

// ========================================
// 싱글톤 인스턴스 (선택적 사용)
// ========================================

let terrainSystemInstance: TerrainSystem | null = null;

export function getTerrainSystem(): TerrainSystem {
  if (!terrainSystemInstance) {
    terrainSystemInstance = new TerrainSystem();
  }
  return terrainSystemInstance;
}

export function createTerrainSystem(): TerrainSystem {
  return new TerrainSystem();
}

// ========================================
// 유틸리티 함수
// ========================================

/**
 * 고지 공격 보너스 계산
 * @param attackerElevation 공격자 고도
 * @param defenderElevation 방어자 고도
 */
export function calculateElevationBonus(
  attackerElevation: number,
  defenderElevation: number
): number {
  const diff = attackerElevation - defenderElevation;
  
  if (diff > 1.5) {
    return 1.3; // 고지 공격 +30%
  } else if (diff > 0.5) {
    return 1.15; // 약간 높은 위치 +15%
  } else if (diff < -1.5) {
    return 0.8; // 저지 공격 -20%
  } else if (diff < -0.5) {
    return 0.9; // 약간 낮은 위치 -10%
  }
  
  return 1.0;
}

/**
 * 유닛 카테고리별 지형 이동 배율 조회
 * @param terrainEffect 지형 효과
 * @param isCavalry 기병 여부
 */
export function getMovementModifier(
  terrainEffect: TerrainEffect,
  isCavalry: boolean
): number {
  if (isCavalry) {
    return terrainEffect.movementModifier * terrainEffect.cavalryModifier;
  }
  return terrainEffect.movementModifier;
}

/**
 * 지형이 진입 가능한지 확인
 * @param terrainType 지형 타입
 * @param isCavalry 기병 여부
 */
export function canEnterTerrain(
  terrainType: TerrainType,
  isCavalry: boolean
): boolean {
  const effect = TERRAIN_EFFECTS[terrainType];
  if (!effect.isPassable) return false;
  if (isCavalry && !effect.cavalryPassable) return false;
  return true;
}





