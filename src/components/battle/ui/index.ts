/**
 * 복셀 전투 UI 컴포넌트
 * 
 * 이 모듈은 복셀 기반 전투 인터페이스 컴포넌트를 제공합니다.
 * - 다크 테마 + 금색 악센트
 * - 반투명 배경 + backdrop-blur
 * - 모바일 반응형
 */

// ===== 메인 오버레이 (신규) =====
export {
  default as BattleUIOverlay,
  BattleUIOverlaySimple,
} from './BattleUIOverlay';
export type { BattleUIOverlayProps } from './BattleUIOverlay';

// ===== 상단 HUD (신규) =====
export { default as BattleHUD, BattleHUDCompact } from './BattleHUD';
export type { BattleHUDProps } from './BattleHUD';

// ===== 미니맵 (신규) =====
export { default as Minimap } from './Minimap';
export type { MinimapProps, MinimapUnit } from './Minimap';

// ===== 유닛 정보 패널 (신규) =====
export { default as UnitInfoPanel, UnitInfoPanelCompact } from './UnitInfoPanel';
export type { UnitInfoPanelProps } from './UnitInfoPanel';

// ===== 속도 컨트롤 (신규) =====
export { default as SpeedControl, SpeedControlInline } from './SpeedControl';
export type { SpeedControlProps } from './SpeedControl';

// ===== 전투 로그 (신규) =====
export {
  default as BattleLog,
  BattleLogToast as BattleEventToast,
  BattleLogSummary as BattleEventSummary,
} from './BattleLog';
export type { BattleLogProps } from './BattleLog';

// ============================================================================
// 기존 컴포넌트 (레거시 호환)
// ============================================================================

// ===== 레거시 미니맵 =====
export { default as BattleMinimap, MinimapSimple } from './BattleMinimap';
export type {
  BattleMinimapProps,
  MinimapUnit as LegacyMinimapUnit,
  MinimapTerrain,
} from './BattleMinimap';

// ===== 부대 카드 =====
export { default as TotalWarUnitCard, UnitCardDeck } from './TotalWarUnitCard';
export type {
  TotalWarUnitCardProps,
  TotalWarSquad,
  TWFormationType,
  TWStanceType,
  SpecialAbility,
} from './TotalWarUnitCard';

// ===== 레거시 전투 로그 =====
export {
  default as TotalWarBattleLog,
  BattleLogToast,
  BattleLogSummary,
} from './TotalWarBattleLog';
export type {
  TotalWarBattleLogProps,
  BattleLogEntry,
  BattleLogType,
} from './TotalWarBattleLog';

// ===== 레거시 통합 HUD =====
export {
  default as TotalWarBattleHUD,
  TotalWarBattleHUDCompact,
} from './TotalWarBattleHUD';
export type {
  TotalWarBattleHUDProps,
  TeamStats,
  BattleState,
} from './TotalWarBattleHUD';


