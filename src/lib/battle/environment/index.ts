/**
 * 환경 시스템 모듈
 * 지형, 날씨, 시야 시스템을 제공합니다.
 */

export {
  // 메인 클래스
  TerrainSystem,
  createTerrainSystem,
  getTerrainSystem,
  
  // 타입
  type TerrainType,
  type TerrainEffect,
  type TerrainCell,
  type TerrainMap,
  type WeatherType,
  type WeatherEffect,
  type WindDirection,
  type LineOfSightResult,
  type VisibilityMap,
  type MapGenerationOptions,
  type CombinedTerrainEffect,
  
  // 상수
  TERRAIN_EFFECTS,
  WEATHER_EFFECTS,
  MAP_PRESETS,
  
  // 유틸리티 함수
  calculateElevationBonus,
  getMovementModifier,
  canEnterTerrain,
} from './TerrainSystem';

export {
  // 렌더러
  TerrainRenderer,
  createTerrainRenderer,
  type TerrainRendererOptions,
  type TerrainRenderMode,
} from './TerrainRenderer';





