// 삼국지 5 스타일 그리드 전투 UI 컴포넌트
export { default as TurnBasedBattleMap } from './TurnBasedBattleMap';
export type { 
  BattleState, 
  BattleUnit, 
  BattleLogEntry, 
  Position,
  CombatResult,
} from './TurnBasedBattleMap';
export { 
  calculateMoveRange, 
  calculateAttackRange, 
  isInRange,
} from './TurnBasedBattleMap';

export { default as BattleUnitCard, MiniUnitCard, UnitListPanel } from './BattleUnitCard';

export { 
  default as BattleControls, 
  BattleLogPanel, 
  QuickActionBar, 
  BattleResultModal,
} from './BattleControls';

export { default as TurnBasedBattleDemo } from './TurnBasedBattleDemo';

// 기존 컴포넌트들
export { default as BattleMap } from './BattleMap';
export { default as UnitSprite, getUnitName, getUnitType } from './UnitSprite';
export { default as HPBar } from './HPBar';
export { default as AttackAnimation } from './AttackAnimation';
export { default as DefendAnimation } from './DefendAnimation';
export { default as CriticalEffect } from './CriticalEffect';
export { default as EvadeEffect } from './EvadeEffect';
export { default as BattleResultLog } from './BattleResultLog';
export { default as BattleCutsceneModal } from './BattleCutsceneModal';

// 새로운 전투 UI 컴포넌트 (Phase 3)
export { default as BattleScene } from './BattleScene';
export type { BattleSceneProps, ArmyInfo } from './BattleScene';

export { default as BattleCutscene } from './BattleCutscene';

export { default as TacticalMap } from './TacticalMap';

export { 
  default as DamageNumber, 
  DamageNumberGroup, 
  ComboDamageNumber, 
  StatusEffectText 
} from './DamageNumber';

export { default as BattleResult } from './BattleResult';

export { default as UnitInfoPanel } from './UnitInfoPanel';

// 모듈러 유닛 시스템 (Three.js 기반)
export { 
  buildUnit, 
  getUnitConfigFromCrewType,
  UNIT_PRESETS,
  NATION_PALETTES,
} from './units';
export type { UnitConfig } from './units';
export { UnitPreview } from './units';

// 토탈워 스타일 전투 UI (Phase 4)
export {
  BattleMinimap,
  MinimapSimple,
  TotalWarUnitCard,
  UnitCardDeck,
  TotalWarBattleLog,
  BattleLogToast,
  BattleLogSummary,
  TotalWarBattleHUD,
  TotalWarBattleHUDCompact,
} from './ui';
export type {
  BattleMinimapProps,
  MinimapUnit,
  MinimapTerrain,
  TotalWarUnitCardProps,
  TotalWarSquad,
  TWFormationType,
  TWStanceType,
  SpecialAbility,
  TotalWarBattleLogProps,
  BattleLogEntry as TotalWarBattleLogEntry,
  BattleLogType,
  TotalWarBattleHUDProps,
  TeamStats,
  BattleState as TotalWarBattleState,
} from './ui';



