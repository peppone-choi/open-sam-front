/**
 * Battle AI Module
 * 전투 AI 시스템 통합 모듈
 * 
 * 핵심 컴포넌트:
 * 1. AIController - 통합 AI 컨트롤러
 * 2. BehaviorTree - 행동 트리 시스템
 * 3. TargetSelector - 타겟 우선순위 시스템
 * 4. SpecialActions - 특수 행동 시스템
 * 5. SoldierAI - 개별 병사 AI (기존)
 * 6. SquadTactics - 부대 전술 AI (기존)
 */

// ========================================
// AI 컨트롤러 (통합 관리)
// ========================================

export {
  AIController,
  getAIController,
  resetAIController,
  // Types
  type AIState,
  type AISquadContext,
  type AIControllerConfig,
  type SquadAIInstance,
  type AIStateTransition,
  // Constants
  AI_STATE_PRIORITIES,
  DEFAULT_AI_CONFIG,
} from './AIController';

// ========================================
// 행동 트리 시스템
// ========================================

export {
  BehaviorTree,
  BehaviorStatus,
  // Nodes
  BaseNode,
  SelectorNode,
  SequenceNode,
  ParallelNode,
  InverterNode,
  RepeaterNode,
  SucceederNode,
  UntilFailNode,
  ConditionNode,
  ActionNode,
  // Helpers
  selector,
  sequence,
  ifThen,
  // Predefined Conditions
  Conditions,
  // Predefined Actions
  Actions,
  // Factory Functions
  createSquadBehaviorTree,
  createMeleeInfantryBehaviorTree,
  createArcherBehaviorTree,
  createCavalryBehaviorTree,
  createSiegeBehaviorTree,
  // Types
  type BehaviorNode,
  type BehaviorContext,
} from './BehaviorTree';

// ========================================
// 타겟 선택 시스템
// ========================================

export {
  TargetSelector,
  createTargetSelectorForCategory,
  // Constants
  UNIT_COUNTER,
  UNIT_WEAKNESS,
  DEFAULT_WEIGHTS,
  DEFAULT_OPTIONS,
  // Types
  type TargetInfo,
  type TargetPriority,
  type TargetPriorityWeights,
  type TargetSelectorOptions,
  type UnitCategory,
} from './TargetSelector';

// ========================================
// 특수 행동 시스템
// ========================================

export {
  SpecialActionManager,
  // Constants
  CHARGE_CONFIG,
  FLANK_CONFIG,
  KITE_CONFIG,
  SURROUND_CONFIG,
  // Types
  type SpecialActionType,
  type SpecialActionResult,
  type SpecialActionState,
} from './SpecialActions';

// ========================================
// 기존 AI 시스템 (호환성 유지)
// ========================================

export * from './SquadTactics';
export { default as SquadTacticsAI, createSquadTacticsAI } from './SquadTactics';

export {
  SoldierAI,
  SoldierStateMachine,
  AStarPathfinder,
  SteeringBehavior,
  AIUpdateScheduler,
  EnemySearchCache,
  // Helpers
  soldiersToObstacles,
  calculateFormationPositions,
  normalizeAngle,
  angleDifference,
  // Types
  type AIContext,
  type SoldierAIConfig,
  type PathNode,
  type Obstacle,
  type GridCell,
  type SteeringForce,
  type StateTransition,
  type EnemyCache,
  // Constants
  DEFAULT_AI_CONFIG as SOLDIER_AI_CONFIG,
} from './SoldierAI';

// ========================================
// 통합 초기화 함수
// ========================================

import { AIController, AIControllerConfig, getAIController, resetAIController } from './AIController';
import { TargetSelector, TargetPriorityWeights } from './TargetSelector';
import { SpecialActionManager } from './SpecialActions';

/**
 * AI 시스템 전체 초기화
 */
export function initializeAISystem(config?: Partial<AIControllerConfig>): {
  controller: AIController;
  targetSelector: TargetSelector;
  specialActions: SpecialActionManager;
} {
  resetAIController();
  
  const controller = getAIController(config);
  const targetSelector = new TargetSelector(config?.targetWeights);
  const specialActions = new SpecialActionManager();
  
  return {
    controller,
    targetSelector,
    specialActions,
  };
}

/**
 * AI 시스템 전체 리셋
 */
export function resetAISystem(): void {
  resetAIController();
}

// ========================================
// 시스템 모듈 Re-export (편의성)
// ========================================

export { 
  FormationManager,
  formationManager,
  createFormationManager,
  FORMATION_DETAILS,
  Easing,
  type FormationTransition,
  type FormationLayout,
  type FormationSlot,
  type FormationEffect,
} from '../systems/FormationManager';

export {
  MoraleManager,
  getMoraleManager,
  resetMoraleManager,
  getMoraleState,
  getFatigueState,
  MORALE_CHANGES,
  MORALE_THRESHOLDS_EXTENDED,
  RALLY_CONFIG_EXTENDED,
  FATIGUE_CONFIG,
  type MoraleEvent,
  type MoraleState,
  type FatigueState,
  type MoraleContext,
  type SquadMoraleStatus,
  type SquadFatigueStatus,
  type RallyState,
} from '../systems/MoraleSystem';

// ========================================
// 기본 내보내기
// ========================================

export { AIController as default };
