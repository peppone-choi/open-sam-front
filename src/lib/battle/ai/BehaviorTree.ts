/**
 * BehaviorTree.ts
 * 행동 트리 시스템
 * 
 * 토탈워 스타일 AI를 위한 행동 트리 구현
 * 
 * 노드 타입:
 * 1. Selector - 자식 중 하나라도 성공하면 성공
 * 2. Sequence - 모든 자식이 성공해야 성공
 * 3. Action - 실제 행동 수행
 * 4. Condition - 조건 검사
 * 5. Decorator - 자식 노드 결과 수정
 */

import type { TWSquad, Vector2 } from '../TotalWarEngine';
import type { AIState } from './AIController';
import type { SpecialActionType } from './SpecialActions';

// ========================================
// 행동 상태
// ========================================

/** 행동 트리 노드 실행 결과 */
export enum BehaviorStatus {
  /** 성공 */
  SUCCESS = 'SUCCESS',
  /** 실패 */
  FAILURE = 'FAILURE',
  /** 실행 중 */
  RUNNING = 'RUNNING',
}

// ========================================
// 행동 트리 컨텍스트
// ========================================

/** 행동 트리 실행 컨텍스트 */
export interface BehaviorContext {
  squad: TWSquad;
  currentTime: number;
  deltaTime: number;
  
  // AI 상태
  aiState: AIState;
  
  // 타겟 정보
  target: TWSquad | null;
  nearestEnemy: TWSquad | null;
  nearestEnemyDistance: number;
  
  // 전투 상황
  isEngaged: boolean;
  isFlanked: boolean;
  moraleLevel: number;
  healthRatio: number;
  allySupport: number;
  
  // 액션 콜백
  setTarget: (target: TWSquad | null) => void;
  setTargetPosition: (pos: Vector2 | null) => void;
  triggerSpecialAction: (action: SpecialActionType) => void;
}

// ========================================
// 노드 기본 클래스
// ========================================

/** 행동 트리 노드 인터페이스 */
export interface BehaviorNode {
  name: string;
  tick(context: BehaviorContext): BehaviorStatus;
  reset(): void;
}

/** 기본 노드 추상 클래스 */
export abstract class BaseNode implements BehaviorNode {
  name: string;
  
  constructor(name: string) {
    this.name = name;
  }
  
  abstract tick(context: BehaviorContext): BehaviorStatus;
  
  reset(): void {
    // 기본 구현: 아무것도 안함
  }
}

// ========================================
// 복합 노드 (Composite)
// ========================================

/**
 * Selector 노드
 * 자식 노드를 순서대로 실행하여 하나라도 성공하면 성공
 * 모든 자식이 실패하면 실패
 */
export class SelectorNode extends BaseNode {
  private children: BehaviorNode[];
  private currentIndex: number = 0;
  
  constructor(name: string, children: BehaviorNode[]) {
    super(name);
    this.children = children;
  }
  
  tick(context: BehaviorContext): BehaviorStatus {
    while (this.currentIndex < this.children.length) {
      const child = this.children[this.currentIndex];
      const status = child.tick(context);
      
      if (status === BehaviorStatus.SUCCESS) {
        this.currentIndex = 0;
        return BehaviorStatus.SUCCESS;
      }
      
      if (status === BehaviorStatus.RUNNING) {
        return BehaviorStatus.RUNNING;
      }
      
      // FAILURE: 다음 자식으로
      this.currentIndex++;
    }
    
    // 모든 자식 실패
    this.currentIndex = 0;
    return BehaviorStatus.FAILURE;
  }
  
  reset(): void {
    this.currentIndex = 0;
    this.children.forEach(child => child.reset());
  }
}

/**
 * Sequence 노드
 * 자식 노드를 순서대로 실행하여 모두 성공해야 성공
 * 하나라도 실패하면 실패
 */
export class SequenceNode extends BaseNode {
  private children: BehaviorNode[];
  private currentIndex: number = 0;
  
  constructor(name: string, children: BehaviorNode[]) {
    super(name);
    this.children = children;
  }
  
  tick(context: BehaviorContext): BehaviorStatus {
    while (this.currentIndex < this.children.length) {
      const child = this.children[this.currentIndex];
      const status = child.tick(context);
      
      if (status === BehaviorStatus.FAILURE) {
        this.currentIndex = 0;
        return BehaviorStatus.FAILURE;
      }
      
      if (status === BehaviorStatus.RUNNING) {
        return BehaviorStatus.RUNNING;
      }
      
      // SUCCESS: 다음 자식으로
      this.currentIndex++;
    }
    
    // 모든 자식 성공
    this.currentIndex = 0;
    return BehaviorStatus.SUCCESS;
  }
  
  reset(): void {
    this.currentIndex = 0;
    this.children.forEach(child => child.reset());
  }
}

/**
 * Parallel 노드
 * 모든 자식을 동시에 실행
 * 정책에 따라 성공/실패 결정
 */
export class ParallelNode extends BaseNode {
  private children: BehaviorNode[];
  private successPolicy: 'all' | 'any';
  private failurePolicy: 'all' | 'any';
  
  constructor(
    name: string,
    children: BehaviorNode[],
    successPolicy: 'all' | 'any' = 'all',
    failurePolicy: 'all' | 'any' = 'any'
  ) {
    super(name);
    this.children = children;
    this.successPolicy = successPolicy;
    this.failurePolicy = failurePolicy;
  }
  
  tick(context: BehaviorContext): BehaviorStatus {
    let successCount = 0;
    let failureCount = 0;
    let runningCount = 0;
    
    for (const child of this.children) {
      const status = child.tick(context);
      
      switch (status) {
        case BehaviorStatus.SUCCESS:
          successCount++;
          break;
        case BehaviorStatus.FAILURE:
          failureCount++;
          break;
        case BehaviorStatus.RUNNING:
          runningCount++;
          break;
      }
    }
    
    // 실패 정책 체크
    if (this.failurePolicy === 'any' && failureCount > 0) {
      return BehaviorStatus.FAILURE;
    }
    if (this.failurePolicy === 'all' && failureCount === this.children.length) {
      return BehaviorStatus.FAILURE;
    }
    
    // 성공 정책 체크
    if (this.successPolicy === 'any' && successCount > 0) {
      return BehaviorStatus.SUCCESS;
    }
    if (this.successPolicy === 'all' && successCount === this.children.length) {
      return BehaviorStatus.SUCCESS;
    }
    
    // 아직 실행 중인 자식이 있으면 RUNNING
    if (runningCount > 0) {
      return BehaviorStatus.RUNNING;
    }
    
    return BehaviorStatus.FAILURE;
  }
  
  reset(): void {
    this.children.forEach(child => child.reset());
  }
}

// ========================================
// 데코레이터 노드
// ========================================

/**
 * Inverter 데코레이터
 * 자식 결과를 반전 (SUCCESS ↔ FAILURE)
 */
export class InverterNode extends BaseNode {
  private child: BehaviorNode;
  
  constructor(name: string, child: BehaviorNode) {
    super(name);
    this.child = child;
  }
  
  tick(context: BehaviorContext): BehaviorStatus {
    const status = this.child.tick(context);
    
    switch (status) {
      case BehaviorStatus.SUCCESS:
        return BehaviorStatus.FAILURE;
      case BehaviorStatus.FAILURE:
        return BehaviorStatus.SUCCESS;
      default:
        return status;
    }
  }
  
  reset(): void {
    this.child.reset();
  }
}

/**
 * Repeater 데코레이터
 * 자식을 지정된 횟수만큼 반복
 */
export class RepeaterNode extends BaseNode {
  private child: BehaviorNode;
  private maxCount: number;
  private currentCount: number = 0;
  
  constructor(name: string, child: BehaviorNode, count: number = Infinity) {
    super(name);
    this.child = child;
    this.maxCount = count;
  }
  
  tick(context: BehaviorContext): BehaviorStatus {
    if (this.currentCount >= this.maxCount) {
      return BehaviorStatus.SUCCESS;
    }
    
    const status = this.child.tick(context);
    
    if (status === BehaviorStatus.SUCCESS || status === BehaviorStatus.FAILURE) {
      this.currentCount++;
      this.child.reset();
      
      if (this.currentCount >= this.maxCount) {
        this.currentCount = 0;
        return BehaviorStatus.SUCCESS;
      }
      
      return BehaviorStatus.RUNNING;
    }
    
    return status;
  }
  
  reset(): void {
    this.currentCount = 0;
    this.child.reset();
  }
}

/**
 * Succeeder 데코레이터
 * 자식 결과와 관계없이 항상 성공
 */
export class SucceederNode extends BaseNode {
  private child: BehaviorNode;
  
  constructor(name: string, child: BehaviorNode) {
    super(name);
    this.child = child;
  }
  
  tick(context: BehaviorContext): BehaviorStatus {
    const status = this.child.tick(context);
    
    if (status === BehaviorStatus.RUNNING) {
      return BehaviorStatus.RUNNING;
    }
    
    return BehaviorStatus.SUCCESS;
  }
  
  reset(): void {
    this.child.reset();
  }
}

/**
 * UntilFail 데코레이터
 * 자식이 실패할 때까지 반복
 */
export class UntilFailNode extends BaseNode {
  private child: BehaviorNode;
  
  constructor(name: string, child: BehaviorNode) {
    super(name);
    this.child = child;
  }
  
  tick(context: BehaviorContext): BehaviorStatus {
    const status = this.child.tick(context);
    
    if (status === BehaviorStatus.FAILURE) {
      return BehaviorStatus.SUCCESS;
    }
    
    if (status === BehaviorStatus.SUCCESS) {
      this.child.reset();
    }
    
    return BehaviorStatus.RUNNING;
  }
  
  reset(): void {
    this.child.reset();
  }
}

// ========================================
// 조건 노드
// ========================================

/**
 * 조건 노드 - 조건 함수 기반
 */
export class ConditionNode extends BaseNode {
  private condition: (context: BehaviorContext) => boolean;
  
  constructor(name: string, condition: (context: BehaviorContext) => boolean) {
    super(name);
    this.condition = condition;
  }
  
  tick(context: BehaviorContext): BehaviorStatus {
    return this.condition(context) ? BehaviorStatus.SUCCESS : BehaviorStatus.FAILURE;
  }
}

// 자주 사용하는 조건들

export const Conditions = {
  /** 사기가 특정 수치 이하 */
  moraleLessThan: (threshold: number) => new ConditionNode(
    `MoraleLessThan(${threshold})`,
    (ctx) => ctx.moraleLevel < threshold
  ),
  
  /** 사기가 특정 수치 이상 */
  moraleGreaterThan: (threshold: number) => new ConditionNode(
    `MoraleGreaterThan(${threshold})`,
    (ctx) => ctx.moraleLevel >= threshold
  ),
  
  /** 적이 사거리 내 */
  enemyInRange: (range: number) => new ConditionNode(
    `EnemyInRange(${range})`,
    (ctx) => ctx.nearestEnemyDistance <= range
  ),
  
  /** 적이 사거리 밖 */
  enemyOutOfRange: (range: number) => new ConditionNode(
    `EnemyOutOfRange(${range})`,
    (ctx) => ctx.nearestEnemyDistance > range
  ),
  
  /** 타겟이 있음 */
  hasTarget: () => new ConditionNode(
    'HasTarget',
    (ctx) => ctx.target !== null
  ),
  
  /** 타겟이 없음 */
  noTarget: () => new ConditionNode(
    'NoTarget',
    (ctx) => ctx.target === null
  ),
  
  /** 교전 중 */
  isEngaged: () => new ConditionNode(
    'IsEngaged',
    (ctx) => ctx.isEngaged
  ),
  
  /** 측면 공격 당함 */
  isFlanked: () => new ConditionNode(
    'IsFlanked',
    (ctx) => ctx.isFlanked
  ),
  
  /** 체력 비율 이하 */
  healthBelow: (ratio: number) => new ConditionNode(
    `HealthBelow(${ratio})`,
    (ctx) => ctx.healthRatio < ratio
  ),
  
  /** 아군 지원 충분 */
  hasAllySupport: (minSupport: number) => new ConditionNode(
    `HasAllySupport(${minSupport})`,
    (ctx) => ctx.allySupport >= minSupport
  ),
  
  /** 적이 보임 */
  enemyVisible: () => new ConditionNode(
    'EnemyVisible',
    (ctx) => ctx.nearestEnemy !== null
  ),
  
  /** 원거리 유닛인지 */
  isRangedUnit: () => new ConditionNode(
    'IsRangedUnit',
    (ctx) => ctx.squad.isRanged
  ),
  
  /** AI 상태 체크 */
  aiStateIs: (state: AIState) => new ConditionNode(
    `AIStateIs(${state})`,
    (ctx) => ctx.aiState === state
  ),
};

// ========================================
// 액션 노드
// ========================================

/**
 * 액션 노드 - 액션 함수 기반
 */
export class ActionNode extends BaseNode {
  private action: (context: BehaviorContext) => BehaviorStatus;
  
  constructor(name: string, action: (context: BehaviorContext) => BehaviorStatus) {
    super(name);
    this.action = action;
  }
  
  tick(context: BehaviorContext): BehaviorStatus {
    return this.action(context);
  }
}

// 자주 사용하는 액션들

export const Actions = {
  /** 대기 */
  idle: () => new ActionNode('Idle', (ctx) => {
    ctx.setTargetPosition(null);
    return BehaviorStatus.SUCCESS;
  }),
  
  /** 적 방향으로 전진 */
  advance: () => new ActionNode('Advance', (ctx) => {
    if (ctx.target) {
      ctx.setTargetPosition({ ...ctx.target.position });
      return BehaviorStatus.SUCCESS;
    }
    if (ctx.nearestEnemy) {
      ctx.setTargetPosition({ ...ctx.nearestEnemy.position });
      return BehaviorStatus.SUCCESS;
    }
    return BehaviorStatus.FAILURE;
  }),
  
  /** 가장 가까운 적 타겟팅 */
  targetNearest: () => new ActionNode('TargetNearest', (ctx) => {
    if (ctx.nearestEnemy) {
      ctx.setTarget(ctx.nearestEnemy);
      return BehaviorStatus.SUCCESS;
    }
    return BehaviorStatus.FAILURE;
  }),
  
  /** 타겟 해제 */
  clearTarget: () => new ActionNode('ClearTarget', (ctx) => {
    ctx.setTarget(null);
    return BehaviorStatus.SUCCESS;
  }),
  
  /** 후퇴 */
  retreat: () => new ActionNode('Retreat', (ctx) => {
    const retreatDir = ctx.squad.teamId === 'attacker' ? -1 : 1;
    const retreatPos = {
      x: ctx.squad.position.x + retreatDir * 30,
      z: ctx.squad.position.z,
    };
    ctx.setTargetPosition(retreatPos);
    return BehaviorStatus.SUCCESS;
  }),
  
  /** 도주 */
  flee: () => new ActionNode('Flee', (ctx) => {
    if (ctx.nearestEnemy) {
      const fleeDir = Math.atan2(
        ctx.squad.position.z - ctx.nearestEnemy.position.z,
        ctx.squad.position.x - ctx.nearestEnemy.position.x
      );
      const fleePos = {
        x: ctx.squad.position.x + Math.cos(fleeDir) * 50,
        z: ctx.squad.position.z + Math.sin(fleeDir) * 50,
      };
      ctx.setTargetPosition(fleePos);
    } else {
      const retreatDir = ctx.squad.teamId === 'attacker' ? -1 : 1;
      ctx.setTargetPosition({
        x: ctx.squad.position.x + retreatDir * 50,
        z: ctx.squad.position.z,
      });
    }
    return BehaviorStatus.SUCCESS;
  }),
  
  /** 돌격 */
  charge: () => new ActionNode('Charge', (ctx) => {
    if (ctx.target || ctx.nearestEnemy) {
      ctx.triggerSpecialAction('charge');
      return BehaviorStatus.SUCCESS;
    }
    return BehaviorStatus.FAILURE;
  }),
  
  /** 측면 공격 (좌측) */
  flankLeft: () => new ActionNode('FlankLeft', (ctx) => {
    if (ctx.target) {
      ctx.triggerSpecialAction('flank_left');
      return BehaviorStatus.SUCCESS;
    }
    return BehaviorStatus.FAILURE;
  }),
  
  /** 측면 공격 (우측) */
  flankRight: () => new ActionNode('FlankRight', (ctx) => {
    if (ctx.target) {
      ctx.triggerSpecialAction('flank_right');
      return BehaviorStatus.SUCCESS;
    }
    return BehaviorStatus.FAILURE;
  }),
  
  /** 카이팅 (사격 후 후퇴) */
  kite: () => new ActionNode('Kite', (ctx) => {
    if (ctx.nearestEnemy) {
      ctx.triggerSpecialAction('kite');
      return BehaviorStatus.SUCCESS;
    }
    return BehaviorStatus.FAILURE;
  }),
  
  /** 진형 유지 */
  holdFormation: () => new ActionNode('HoldFormation', (ctx) => {
    // 현재 위치 유지
    ctx.setTargetPosition({ ...ctx.squad.position });
    return BehaviorStatus.SUCCESS;
  }),
  
  /** 사거리 유지 */
  maintainRange: (optimalRange: number) => new ActionNode(
    `MaintainRange(${optimalRange})`,
    (ctx) => {
      if (!ctx.nearestEnemy) {
        return BehaviorStatus.FAILURE;
      }
      
      const currentDist = ctx.nearestEnemyDistance;
      
      if (currentDist < optimalRange * 0.8) {
        // 너무 가까움 - 후퇴
        const retreatDir = Math.atan2(
          ctx.squad.position.z - ctx.nearestEnemy.position.z,
          ctx.squad.position.x - ctx.nearestEnemy.position.x
        );
        ctx.setTargetPosition({
          x: ctx.squad.position.x + Math.cos(retreatDir) * 8,
          z: ctx.squad.position.z + Math.sin(retreatDir) * 8,
        });
      } else if (currentDist > optimalRange * 1.2) {
        // 너무 멈 - 접근
        ctx.setTargetPosition({ ...ctx.nearestEnemy.position });
      } else {
        // 적정 거리 - 현재 위치 유지
        ctx.setTargetPosition({ ...ctx.squad.position });
      }
      
      return BehaviorStatus.SUCCESS;
    }
  ),
  
  /** 포위 */
  surround: () => new ActionNode('Surround', (ctx) => {
    if (ctx.target) {
      ctx.triggerSpecialAction('surround');
      return BehaviorStatus.SUCCESS;
    }
    return BehaviorStatus.FAILURE;
  }),
  
  /** 방어 진형 */
  defensiveFormation: () => new ActionNode('DefensiveFormation', (ctx) => {
    ctx.triggerSpecialAction('defensive_formation');
    return BehaviorStatus.SUCCESS;
  }),
};

// ========================================
// 헬퍼 함수
// ========================================

/**
 * Selector 노드 생성 헬퍼
 */
export function selector(name: string, children: BehaviorNode[]): SelectorNode {
  return new SelectorNode(name, children);
}

/**
 * Sequence 노드 생성 헬퍼
 */
export function sequence(name: string, children: BehaviorNode[]): SequenceNode {
  return new SequenceNode(name, children);
}

/**
 * 조건-액션 쌍 생성 헬퍼
 */
export function ifThen(condition: BehaviorNode, action: BehaviorNode): SequenceNode {
  return new SequenceNode(`If(${condition.name})Then(${action.name})`, [condition, action]);
}

// ========================================
// 행동 트리 클래스
// ========================================

/**
 * 행동 트리 메인 클래스
 */
export class BehaviorTree {
  private root: BehaviorNode;
  private lastStatus: BehaviorStatus = BehaviorStatus.FAILURE;
  
  constructor(root: BehaviorNode) {
    this.root = root;
  }
  
  /**
   * 행동 트리 틱
   */
  tick(context: BehaviorContext): BehaviorStatus {
    this.lastStatus = this.root.tick(context);
    return this.lastStatus;
  }
  
  /**
   * 행동 트리 리셋
   */
  reset(): void {
    this.root.reset();
    this.lastStatus = BehaviorStatus.FAILURE;
  }
  
  /**
   * 마지막 실행 상태
   */
  getLastStatus(): BehaviorStatus {
    return this.lastStatus;
  }
}

// ========================================
// 병종별 행동 트리 템플릿
// ========================================

/**
 * 근접 보병 AI 행동 트리
 */
export function createMeleeInfantryBehaviorTree(): BehaviorTree {
  const root = selector('MeleeInfantryRoot', [
    // 1. 사기 붕괴 - 도주
    ifThen(Conditions.moraleLessThan(20), Actions.flee()),
    
    // 2. 사기 저하 + 체력 낮음 - 후퇴
    sequence('LowMoraleRetreat', [
      Conditions.moraleLessThan(40),
      Conditions.healthBelow(0.3),
      Actions.retreat(),
    ]),
    
    // 3. 측면 공격 당함 - 방어 진형
    ifThen(Conditions.isFlanked(), Actions.defensiveFormation()),
    
    // 4. 교전 중 - 전투 유지
    ifThen(Conditions.isEngaged(), Actions.holdFormation()),
    
    // 5. 적이 가까움 - 공격
    sequence('CloseEngagement', [
      Conditions.enemyInRange(5),
      Actions.targetNearest(),
      Actions.advance(),
    ]),
    
    // 6. 적이 보임 - 전진
    sequence('AdvanceToEnemy', [
      Conditions.enemyVisible(),
      Actions.targetNearest(),
      Actions.advance(),
    ]),
    
    // 7. 기본 - 대기
    Actions.idle(),
  ]);
  
  return new BehaviorTree(root);
}

/**
 * 궁병 AI 행동 트리
 */
export function createArcherBehaviorTree(): BehaviorTree {
  const OPTIMAL_RANGE = 35;
  
  const root = selector('ArcherRoot', [
    // 1. 사기 붕괴 - 도주
    ifThen(Conditions.moraleLessThan(20), Actions.flee()),
    
    // 2. 적이 너무 가까움 - 카이팅
    sequence('TooClose', [
      Conditions.enemyInRange(10),
      Actions.kite(),
    ]),
    
    // 3. 적이 보임 - 사거리 유지
    sequence('MaintainOptimalRange', [
      Conditions.enemyVisible(),
      Actions.targetNearest(),
      Actions.maintainRange(OPTIMAL_RANGE),
    ]),
    
    // 4. 기본 - 대기
    Actions.idle(),
  ]);
  
  return new BehaviorTree(root);
}

/**
 * 기병 AI 행동 트리
 */
export function createCavalryBehaviorTree(): BehaviorTree {
  const root = selector('CavalryRoot', [
    // 1. 사기 붕괴 - 도주
    ifThen(Conditions.moraleLessThan(20), Actions.flee()),
    
    // 2. 교전 중 - 이탈 후 재돌격 고려
    sequence('EngagedCavalry', [
      Conditions.isEngaged(),
      Conditions.healthBelow(0.5),
      Actions.retreat(),
    ]),
    
    // 3. 돌격 거리 - 돌격
    sequence('ChargeDistance', [
      Conditions.enemyInRange(20),
      Conditions.enemyOutOfRange(5),
      Actions.targetNearest(),
      Actions.charge(),
    ]),
    
    // 4. 측면 공격 기회 - 측면 우회
    sequence('FlankingOpportunity', [
      Conditions.hasAllySupport(30),
      Conditions.enemyVisible(),
      Actions.targetNearest(),
      Actions.flankLeft(), // TODO: 실제로는 방향 결정 로직 필요
    ]),
    
    // 5. 적 보임 - 접근
    sequence('ApproachEnemy', [
      Conditions.enemyVisible(),
      Actions.targetNearest(),
      Actions.advance(),
    ]),
    
    // 6. 기본 - 대기
    Actions.idle(),
  ]);
  
  return new BehaviorTree(root);
}

/**
 * 공성 유닛 AI 행동 트리
 */
export function createSiegeBehaviorTree(): BehaviorTree {
  const root = selector('SiegeRoot', [
    // 1. 적이 너무 가까움 - 후퇴
    sequence('EnemyTooClose', [
      Conditions.enemyInRange(10),
      Actions.retreat(),
    ]),
    
    // 2. 적이 보임 - 제자리에서 공격
    sequence('AttackFromPosition', [
      Conditions.enemyVisible(),
      Actions.targetNearest(),
      Actions.holdFormation(),
    ]),
    
    // 3. 기본 - 대기
    Actions.idle(),
  ]);
  
  return new BehaviorTree(root);
}

/**
 * 병종에 따른 행동 트리 생성
 */
export function createSquadBehaviorTree(category: string): BehaviorTree {
  // 원거리 유닛
  if (['archer', 'crossbow', 'horse_archer'].includes(category)) {
    return createArcherBehaviorTree();
  }
  
  // 기병
  if (['cavalry', 'shock_cavalry', 'chariot'].includes(category)) {
    return createCavalryBehaviorTree();
  }
  
  // 공성
  if (category === 'siege') {
    return createSiegeBehaviorTree();
  }
  
  // 기본: 근접 보병
  return createMeleeInfantryBehaviorTree();
}

// ========================================
// Export
// ========================================

export default BehaviorTree;





