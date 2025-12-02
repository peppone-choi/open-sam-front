/**
 * 전투 데이터 어댑터 모듈
 * 
 * API 전투 데이터와 복셀 엔진 데이터 간의 변환을 담당합니다.
 * 
 * @module adapters
 */

// ========================================
// 메인 어댑터
// ========================================
export {
  convertApiBattleToVoxel,
  createVoxelForce,
  createMultiStackForce,
  getNationColors,
  setNationColors,
  determineTerrain,
  determineWeather,
  determineTimeOfDay,
  validateApiBattleData,
  getBattleDataSummary,
  getVoxelDataSummary,
} from './BattleDataAdapter';

// ========================================
// 장수 어댑터
// ========================================
export {
  convertGeneralStats,
  calculateModifier,
  modifierToPercentString,
  calculateItemBonuses,
  applyLeadershipBonus,
  calculateMoraleBonus,
  calculateRallySpeed,
  applyStrengthBonus,
  applyIntelligenceBonus,
  calculateAbilityCooldownReduction,
  getSpecialSkillEffect,
  applySpecialSkill,
  applyItemEffects,
  applyAllGeneralBonuses,
  calculateGeneralPowerScore,
  getGeneralStatsSummary,
  getGeneralItemsSummary,
} from './GeneralAdapter';

// ========================================
// 유닛 어댑터
// ========================================
export {
  convertUnitId,
  isValidUnit,
  getDefaultUnitId,
  getUnitCategoryById,
  getUnitAttackType,
  inferCategoryFromId,
  calculateSquadSize,
  calculateCrewFromUnits,
  getUnitBaseStats,
  applyTrainingModifier,
  calculateExperienceLevel,
  createVoxelSquad,
  getUnitName,
  getUnitNameEn,
  getUnitDescription,
  getUnitsByCategory,
  getAllValidUnitIds,
  calculateCounterBonus,
  calculateUnitPowerScore,
} from './UnitAdapter';

// ========================================
// 결과 어댑터
// ========================================
export {
  convertVoxelResultToApi,
  convertWinnerToApiResult,
  convertApiResultToWinner,
  calculateCasualties,
  calculateSquadCasualties,
  calculateCasualtyRate,
  calculateExperience,
  calculateLoserExperience,
  generateBattleLog,
  analyzeBattleResult,
  getBattleResultSummary,
  getBattleResultShort,
  validateBattleResult,
  type BattleAnalysis,
  type SideAnalysis,
} from './ResultAdapter';

// ========================================
// 타입 재익스포트
// ========================================
export type {
  // API 데이터 타입
  ApiBattleData,
  ApiSide,
  ApiGeneral,
  ApiItem,
  ApiBattleType,
  
  // 복셀 엔진 데이터 타입
  VoxelBattleInit,
  VoxelForce,
  VoxelGeneralStats,
  VoxelSquad,
  ItemBonuses,
  UnitStats,
  
  // 지형 및 환경 타입
  TerrainConfig,
  TerrainType,
  TerrainFeature,
  WeatherType,
  TimeOfDay,
  
  // 전투 결과 타입
  VoxelBattleResult,
  ApiBattleResult,
  SquadResult,
  BattleEvent,
  BattleEventType,
  BattleStats,
  
  // 특기 타입
  SpecialSkillEffect,
  SkillEffectType,
  SkillTarget,
  SkillCondition,
  
  // 유틸리티 타입
  Vector2,
  Vector3,
  ColorPair,
  Range,
} from '../types/BattleTypes';





