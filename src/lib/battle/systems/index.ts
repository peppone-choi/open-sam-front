/**
 * Battle Systems Index
 * 
 * 전투 시스템 모듈 export
 */

// Formation System
export {
  FormationManager,
  formationManager,
  createFormationManager,
  Easing,
  FORMATION_DETAILS,
} from './FormationManager';

export type {
  FormationTransition,
  SoldierTransition,
  FormationEffect,
  FormationEffectType,
  FormationLayoutOptions,
  FormationLayout,
  FormationSlot,
  EasingFunction,
} from './FormationManager';
