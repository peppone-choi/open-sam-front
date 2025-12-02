/**
 * AIController.ts
 * 복셀 전투 통합 AI 컨트롤러
 * 
 * 핵심 기능:
 * 1. AI 상태 머신 (idle/advancing/engaging/retreating/routing)
 * 2. 부대별 AI 인스턴스 관리
 * 3. 업데이트 루프 조율
 * 4. 하위 시스템 통합 (BehaviorTree, TargetSelector, FormationManager, MoraleSystem)
 */

import { BehaviorTree, BehaviorStatus, createSquadBehaviorTree } from './BehaviorTree';
import { TargetSelector, TargetInfo, TargetPriorityWeights } from './TargetSelector';
import { SpecialActionManager, SpecialActionType } from './SpecialActions';
import { FormationManager } from '../systems/FormationManager';
import { MoraleManager, getMoraleManager, MoraleContext } from '../systems/MoraleSystem';
import type { TWSquad, TWSoldier, Vector2 } from '../TotalWarEngine';

// ========================================
// AI 상태 타입
// ========================================

/** AI 상태 (부대 단위) */
export type AIState = 
  | 'idle'        // 대기 - 명령 대기
  | 'advancing'   // 전진 - 적을 향해 이동
  | 'engaging'    // 교전 - 적과 전투 중
  | 'flanking'    // 측면 공격 - 우회 기동 중
  | 'retreating'  // 후퇴 - 전략적 후퇴
  | 'routing'     // 패주 - 사기 붕괴로 도주
  | 'rallying';   // 재집결 - 패주 후 재정비

/** AI 상태별 행동 우선순위 */
export const AI_STATE_PRIORITIES: Record<AIState, number> = {
  routing: 100,    // 최우선 - 생존
  retreating: 80,
  rallying: 70,
  engaging: 60,
  flanking: 50,
  advancing: 40,
  idle: 10,
};

/** AI 상태 전환 조건 */
export interface AIStateTransition {
  from: AIState;
  to: AIState;
  condition: (ctx: AISquadContext) => boolean;
  priority: number;
}

// ========================================
// AI 컨텍스트
// ========================================

/** 부대 AI 컨텍스트 */
export interface AISquadContext {
  squad: TWSquad;
  currentTime: number;
  deltaTime: number;
  
  // 적 정보
  enemies: TWSquad[];
  nearestEnemy: TWSquad | null;
  nearestEnemyDistance: number;
  visibleEnemies: TWSquad[];
  
  // 아군 정보
  allies: TWSquad[];
  nearbyAllies: TWSquad[];
  allySupport: number; // 0~100
  
  // 타겟 정보
  currentTarget: TWSquad | null;
  targetPriorities: TargetInfo[];
  
  // 전투 상황
  isEngaged: boolean;
  isFlanked: boolean;
  isUnderFire: boolean;
  isSurrounded: boolean;
  
  // 부대 상태
  moraleLevel: number;
  fatigueLevel: number;
  healthRatio: number;
  
  // 지형/환경
  terrainAdvantage: number;
  weatherPenalty: number;
}

/** AI 설정 */
export interface AIControllerConfig {
  /** 업데이트 주기 (ms) - 부대별 AI 틱 간격 */
  updateInterval: number;
  /** 적 탐지 범위 */
  detectionRange: number;
  /** 시야 범위 */
  visionRange: number;
  /** 최대 동시 처리 부대 수 */
  maxConcurrentUpdates: number;
  /** 공간 분할 그리드 크기 */
  spatialGridSize: number;
  /** 타겟 우선순위 가중치 */
  targetWeights: TargetPriorityWeights;
}

/** 기본 AI 설정 */
export const DEFAULT_AI_CONFIG: AIControllerConfig = {
  updateInterval: 100,
  detectionRange: 80,
  visionRange: 60,
  maxConcurrentUpdates: 10,
  spatialGridSize: 10,
  targetWeights: {
    distance: 30,
    typeAdvantage: 25,
    healthRatio: 15,
    threatLevel: 15,
    isGeneral: 10,
    morale: 5,
  },
};

// ========================================
// 부대 AI 인스턴스
// ========================================

/** 개별 부대 AI 상태 */
export interface SquadAIInstance {
  squadId: string;
  state: AIState;
  previousState: AIState;
  stateStartTime: number;
  
  // 행동 트리
  behaviorTree: BehaviorTree;
  
  // 현재 목표
  currentTarget: TWSquad | null;
  targetPosition: Vector2 | null;
  
  // 특수 행동
  activeSpecialAction: SpecialActionType | null;
  specialActionStartTime: number;
  
  // 쿨다운
  lastDecisionTime: number;
  lastAttackTime: number;
  lastFormationChange: number;
  
  // 플래그
  hasBeenEngaged: boolean;
  hasRouted: boolean;
  isPlayerControlled: boolean;
}

// ========================================
// AI 컨트롤러 메인 클래스
// ========================================

export class AIController {
  // 설정
  private config: AIControllerConfig;
  
  // 하위 시스템
  private targetSelector: TargetSelector;
  private specialActionManager: SpecialActionManager;
  private formationManager: FormationManager;
  private moraleManager: MoraleManager;
  
  // 부대 AI 인스턴스
  private squadAIs: Map<string, SquadAIInstance> = new Map();
  
  // 상태 전환 규칙
  private stateTransitions: AIStateTransition[] = [];
  
  // 공간 분할 (성능 최적화)
  private spatialGrid: Map<string, Set<string>> = new Map();
  
  // 업데이트 스케줄링
  private updateQueue: string[] = [];
  private lastUpdateTime: number = 0;
  
  // 성능 측정
  private metrics = {
    updateCount: 0,
    avgUpdateTime: 0,
    stateChanges: 0,
    targetChanges: 0,
  };

  constructor(config: Partial<AIControllerConfig> = {}) {
    this.config = { ...DEFAULT_AI_CONFIG, ...config };
    
    // 하위 시스템 초기화
    this.targetSelector = new TargetSelector(this.config.targetWeights);
    this.specialActionManager = new SpecialActionManager();
    this.formationManager = new FormationManager();
    this.moraleManager = getMoraleManager();
    
    // 상태 전환 규칙 설정
    this.setupStateTransitions();
  }

  // ========================================
  // 초기화 및 설정
  // ========================================

  /**
   * 부대 AI 등록
   */
  registerSquad(squad: TWSquad, isPlayerControlled: boolean = false): SquadAIInstance {
    const instance: SquadAIInstance = {
      squadId: squad.id,
      state: 'idle',
      previousState: 'idle',
      stateStartTime: 0,
      behaviorTree: createSquadBehaviorTree(squad.category),
      currentTarget: null,
      targetPosition: null,
      activeSpecialAction: null,
      specialActionStartTime: 0,
      lastDecisionTime: 0,
      lastAttackTime: 0,
      lastFormationChange: 0,
      hasBeenEngaged: false,
      hasRouted: false,
      isPlayerControlled,
    };
    
    this.squadAIs.set(squad.id, instance);
    this.updateQueue.push(squad.id);
    
    return instance;
  }

  /**
   * 부대 AI 해제
   */
  unregisterSquad(squadId: string): void {
    this.squadAIs.delete(squadId);
    this.updateQueue = this.updateQueue.filter(id => id !== squadId);
  }

  /**
   * 상태 전환 규칙 설정
   */
  private setupStateTransitions(): void {
    // 패주 전환 (최우선)
    this.addStateTransition('*', 'routing', (ctx) => {
      return ctx.moraleLevel < 20 && ctx.squad.state !== 'routed';
    }, 100);
    
    // 후퇴 전환
    this.addStateTransition('*', 'retreating', (ctx) => {
      return (ctx.moraleLevel < 40 && ctx.healthRatio < 0.5) ||
             (ctx.isSurrounded && ctx.healthRatio < 0.3);
    }, 90);
    
    // 재집결 전환
    this.addStateTransition('routing', 'rallying', (ctx) => {
      return ctx.moraleLevel >= 30 && 
             ctx.nearestEnemyDistance > 50 &&
             ctx.nearbyAllies.length >= 2;
    }, 80);
    
    // 교전 전환
    this.addStateTransition('*', 'engaging', (ctx) => {
      return ctx.isEngaged || 
             (ctx.nearestEnemyDistance < 5 && ctx.currentTarget !== null);
    }, 70);
    
    // 측면 공격 전환
    this.addStateTransition('advancing', 'flanking', (ctx) => {
      const ai = this.squadAIs.get(ctx.squad.id);
      return ai?.activeSpecialAction === 'flank_left' || 
             ai?.activeSpecialAction === 'flank_right';
    }, 60);
    
    // 전진 전환
    this.addStateTransition('idle', 'advancing', (ctx) => {
      return ctx.currentTarget !== null && ctx.nearestEnemyDistance > 5;
    }, 50);
    
    // 대기 복귀
    this.addStateTransition('*', 'idle', (ctx) => {
      return ctx.enemies.length === 0 && !ctx.isEngaged;
    }, 10);
    
    // 재집결 완료
    this.addStateTransition('rallying', 'idle', (ctx) => {
      return ctx.moraleLevel >= 50 && ctx.healthRatio > 0.3;
    }, 40);
    
    // 전환 규칙 우선순위 정렬
    this.stateTransitions.sort((a, b) => b.priority - a.priority);
  }

  /**
   * 상태 전환 규칙 추가
   */
  private addStateTransition(
    from: AIState | '*',
    to: AIState,
    condition: AIStateTransition['condition'],
    priority: number
  ): void {
    if (from === '*') {
      // 모든 상태에서 전환 가능
      const allStates: AIState[] = ['idle', 'advancing', 'engaging', 'flanking', 'retreating', 'routing', 'rallying'];
      allStates.forEach(state => {
        if (state !== to) {
          this.stateTransitions.push({ from: state, to, condition, priority });
        }
      });
    } else {
      this.stateTransitions.push({ from, to, condition, priority });
    }
  }

  // ========================================
  // 메인 업데이트 루프
  // ========================================

  /**
   * AI 업데이트 (매 프레임 호출)
   */
  update(
    squads: Map<string, TWSquad>,
    soldiers: Map<string, TWSoldier>,
    currentTime: number,
    deltaTime: number
  ): void {
    // 공간 그리드 재구축
    this.rebuildSpatialGrid(squads);
    
    // 업데이트할 부대 선택
    const squadsToUpdate = this.selectSquadsForUpdate(currentTime);
    
    // 각 부대 업데이트
    for (const squadId of squadsToUpdate) {
      const squad = squads.get(squadId);
      const ai = this.squadAIs.get(squadId);
      
      if (!squad || !ai) continue;
      if (squad.state === 'destroyed' || squad.state === 'routed') continue;
      if (ai.isPlayerControlled) continue;
      
      // AI 컨텍스트 구축
      const context = this.buildContext(squad, squads, currentTime, deltaTime);
      
      // 상태 전환 체크
      this.checkStateTransitions(ai, context, currentTime);
      
      // 행동 트리 실행
      this.executeBehaviorTree(ai, context, currentTime);
      
      // 특수 행동 업데이트
      this.updateSpecialActions(ai, context, currentTime);
      
      // 사기 업데이트
      this.updateMorale(squad, soldiers, context, currentTime, deltaTime);
      
      ai.lastDecisionTime = currentTime;
    }
    
    this.lastUpdateTime = currentTime;
    this.metrics.updateCount++;
  }

  /**
   * 업데이트할 부대 선택 (배치 처리)
   */
  private selectSquadsForUpdate(currentTime: number): string[] {
    const result: string[] = [];
    const maxUpdates = this.config.maxConcurrentUpdates;
    
    // 라운드 로빈 방식으로 부대 선택
    while (result.length < maxUpdates && this.updateQueue.length > 0) {
      const squadId = this.updateQueue.shift()!;
      const ai = this.squadAIs.get(squadId);
      
      if (ai && currentTime - ai.lastDecisionTime >= this.config.updateInterval) {
        result.push(squadId);
      }
      
      // 큐 뒤에 다시 추가
      this.updateQueue.push(squadId);
    }
    
    return result;
  }

  // ========================================
  // 컨텍스트 구축
  // ========================================

  /**
   * AI 컨텍스트 구축
   */
  private buildContext(
    squad: TWSquad,
    allSquads: Map<string, TWSquad>,
    currentTime: number,
    deltaTime: number
  ): AISquadContext {
    const enemies: TWSquad[] = [];
    const allies: TWSquad[] = [];
    
    // 적/아군 분류
    allSquads.forEach(other => {
      if (other.id === squad.id) return;
      if (other.state === 'destroyed') return;
      
      if (other.teamId === squad.teamId) {
        allies.push(other);
      } else {
        enemies.push(other);
      }
    });
    
    // 가장 가까운 적 찾기
    let nearestEnemy: TWSquad | null = null;
    let nearestEnemyDistance = Infinity;
    
    for (const enemy of enemies) {
      if (enemy.state === 'routed') continue;
      const dist = this.getDistance(squad.position, enemy.position);
      if (dist < nearestEnemyDistance) {
        nearestEnemyDistance = dist;
        nearestEnemy = enemy;
      }
    }
    
    // 시야 내 적
    const visibleEnemies = enemies.filter(e => {
      const dist = this.getDistance(squad.position, e.position);
      return dist <= this.config.visionRange;
    });
    
    // 근처 아군
    const nearbyAllies = allies.filter(a => {
      const dist = this.getDistance(squad.position, a.position);
      return dist <= 30;
    });
    
    // 타겟 우선순위 계산
    const targetPriorities = this.targetSelector.evaluateTargets(
      squad,
      enemies,
      currentTime
    );
    
    // 현재 타겟 결정
    const ai = this.squadAIs.get(squad.id);
    let currentTarget = ai?.currentTarget || null;
    
    // 타겟이 없거나 죽었으면 새 타겟 선택
    if (!currentTarget || currentTarget.state === 'destroyed' || currentTarget.state === 'routed') {
      if (targetPriorities.length > 0) {
        const bestTarget = allSquads.get(targetPriorities[0].squadId);
        currentTarget = bestTarget || null;
      } else {
        currentTarget = nearestEnemy;
      }
    }
    
    // 전투 상황 판정
    const isEngaged = squad.state === 'engaging' || 
                     squad.soldiers.some(s => s.state === 'fighting');
    
    const isFlanked = this.checkIfFlanked(squad, enemies);
    const isUnderFire = this.checkIfUnderFire(squad, enemies);
    const isSurrounded = this.checkIfSurrounded(squad, enemies);
    
    // 부대 상태
    const aliveSoldiers = squad.soldiers.filter(s => s.state !== 'dead');
    const healthRatio = aliveSoldiers.length / Math.max(1, squad.soldiers.length);
    const avgMorale = aliveSoldiers.reduce((sum, s) => sum + s.morale, 0) / Math.max(1, aliveSoldiers.length);
    const avgFatigue = aliveSoldiers.reduce((sum, s) => sum + s.fatigue, 0) / Math.max(1, aliveSoldiers.length);
    
    // 아군 지원 수준
    const allySupport = this.calculateAllySupport(squad, nearbyAllies);
    
    return {
      squad,
      currentTime,
      deltaTime,
      enemies,
      nearestEnemy,
      nearestEnemyDistance,
      visibleEnemies,
      allies,
      nearbyAllies,
      allySupport,
      currentTarget,
      targetPriorities,
      isEngaged,
      isFlanked,
      isUnderFire,
      isSurrounded,
      moraleLevel: avgMorale,
      fatigueLevel: avgFatigue,
      healthRatio,
      terrainAdvantage: 0, // TODO: 지형 시스템 연동
      weatherPenalty: 0,   // TODO: 날씨 시스템 연동
    };
  }

  // ========================================
  // 상태 전환
  // ========================================

  /**
   * 상태 전환 체크
   */
  private checkStateTransitions(
    ai: SquadAIInstance,
    context: AISquadContext,
    currentTime: number
  ): void {
    for (const transition of this.stateTransitions) {
      if (transition.from !== ai.state) continue;
      
      if (transition.condition(context)) {
        this.transitionState(ai, transition.to, currentTime);
        break;
      }
    }
  }

  /**
   * 상태 전환 실행
   */
  private transitionState(
    ai: SquadAIInstance,
    newState: AIState,
    currentTime: number
  ): void {
    if (ai.state === newState) return;
    
    // 이전 상태 기록
    ai.previousState = ai.state;
    ai.state = newState;
    ai.stateStartTime = currentTime;
    
    // 상태별 초기화
    switch (newState) {
      case 'routing':
        ai.hasRouted = true;
        ai.currentTarget = null;
        ai.activeSpecialAction = null;
        break;
        
      case 'rallying':
        ai.activeSpecialAction = null;
        break;
        
      case 'engaging':
        ai.hasBeenEngaged = true;
        break;
        
      case 'idle':
        ai.activeSpecialAction = null;
        break;
    }
    
    this.metrics.stateChanges++;
  }

  // ========================================
  // 행동 트리 실행
  // ========================================

  /**
   * 행동 트리 실행
   */
  private executeBehaviorTree(
    ai: SquadAIInstance,
    context: AISquadContext,
    currentTime: number
  ): void {
    // 행동 트리 컨텍스트
    const btContext = {
      squad: context.squad,
      currentTime,
      deltaTime: context.deltaTime,
      aiState: ai.state,
      target: context.currentTarget,
      nearestEnemy: context.nearestEnemy,
      nearestEnemyDistance: context.nearestEnemyDistance,
      isEngaged: context.isEngaged,
      isFlanked: context.isFlanked,
      moraleLevel: context.moraleLevel,
      healthRatio: context.healthRatio,
      allySupport: context.allySupport,
      
      // 액션 콜백
      setTarget: (target: TWSquad | null) => {
        if (ai.currentTarget !== target) {
          ai.currentTarget = target;
          this.metrics.targetChanges++;
        }
      },
      setTargetPosition: (pos: Vector2 | null) => {
        ai.targetPosition = pos;
      },
      triggerSpecialAction: (action: SpecialActionType) => {
        ai.activeSpecialAction = action;
        ai.specialActionStartTime = currentTime;
      },
    };
    
    // 행동 트리 틱
    const result = ai.behaviorTree.tick(btContext);
    
    // 결과에 따른 처리
    if (result === BehaviorStatus.FAILURE) {
      // 실패 시 기본 행동으로 폴백
      if (context.currentTarget) {
        ai.targetPosition = { ...context.currentTarget.position };
      }
    }
  }

  // ========================================
  // 특수 행동
  // ========================================

  /**
   * 특수 행동 업데이트
   */
  private updateSpecialActions(
    ai: SquadAIInstance,
    context: AISquadContext,
    currentTime: number
  ): void {
    if (!ai.activeSpecialAction) return;
    
    // 특수 행동 실행
    const result = this.specialActionManager.executeAction(
      ai.activeSpecialAction,
      context.squad,
      context.currentTarget,
      currentTime - ai.specialActionStartTime
    );
    
    // 행동 완료 또는 실패 시 해제
    if (result.completed || result.failed) {
      ai.activeSpecialAction = null;
    }
    
    // 결과 적용
    if (result.targetPosition) {
      ai.targetPosition = result.targetPosition;
    }
  }

  // ========================================
  // 사기 시스템 연동
  // ========================================

  /**
   * 사기 업데이트
   */
  private updateMorale(
    squad: TWSquad,
    soldiers: Map<string, TWSoldier>,
    context: AISquadContext,
    currentTime: number,
    deltaTime: number
  ): void {
    const aliveSoldiers = squad.soldiers.filter(s => s.state !== 'dead');
    
    for (const soldierRef of aliveSoldiers) {
      const soldier = soldiers.get(soldierRef.id);
      if (!soldier) continue;
      
      // 사기 컨텍스트 구축
      const moraleCtx: MoraleContext = {
        soldier,
        squad,
        currentTime,
        deltaTime,
        nearbyAllies: [],
        nearbyEnemies: [],
        nearbyDeadAllies: 0,
        isEngaged: soldier.state === 'fighting',
        isFlanked: context.isFlanked,
        isRearAttacked: false,
        isSurrounded: context.isSurrounded,
        isUnderFire: context.isUnderFire,
        squadNumericalAdvantage: this.calculateNumericalAdvantage(context),
        enemyRouting: context.enemies.some(e => e.state === 'routing'),
        allyRouting: context.allies.some(a => a.state === 'routing'),
        generalAlive: true, // TODO: 장수 시스템 연동
        generalNearby: false,
      };
      
      // 사기 변화 적용
      const moraleChange = this.moraleManager.updateSoldierMorale(moraleCtx);
      soldier.morale = Math.max(0, Math.min(100, soldier.morale + moraleChange));
    }
  }

  // ========================================
  // 유틸리티 메서드
  // ========================================

  /**
   * 공간 그리드 재구축
   */
  private rebuildSpatialGrid(squads: Map<string, TWSquad>): void {
    this.spatialGrid.clear();
    
    squads.forEach(squad => {
      if (squad.state === 'destroyed') return;
      
      const cellX = Math.floor(squad.position.x / this.config.spatialGridSize);
      const cellZ = Math.floor(squad.position.z / this.config.spatialGridSize);
      const key = `${cellX},${cellZ}`;
      
      if (!this.spatialGrid.has(key)) {
        this.spatialGrid.set(key, new Set());
      }
      this.spatialGrid.get(key)!.add(squad.id);
    });
  }

  /**
   * 거리 계산
   */
  private getDistance(a: Vector2, b: Vector2): number {
    const dx = b.x - a.x;
    const dz = b.z - a.z;
    return Math.sqrt(dx * dx + dz * dz);
  }

  /**
   * 측면 공격 여부 체크
   */
  private checkIfFlanked(squad: TWSquad, enemies: TWSquad[]): boolean {
    let frontCount = 0;
    let flankCount = 0;
    
    for (const enemy of enemies) {
      if (enemy.state === 'destroyed' || enemy.state === 'routed') continue;
      
      const dist = this.getDistance(squad.position, enemy.position);
      if (dist > 15) continue;
      
      // 적의 공격 방향
      const attackAngle = Math.atan2(
        squad.position.z - enemy.position.z,
        squad.position.x - enemy.position.x
      );
      
      // 내 facing과의 각도 차이
      let angleDiff = Math.abs(attackAngle - squad.facing);
      if (angleDiff > Math.PI) angleDiff = 2 * Math.PI - angleDiff;
      
      if (angleDiff < Math.PI / 3) {
        frontCount++;
      } else {
        flankCount++;
      }
    }
    
    return flankCount > 0 && flankCount >= frontCount * 0.5;
  }

  /**
   * 원거리 공격 받는지 체크
   */
  private checkIfUnderFire(squad: TWSquad, enemies: TWSquad[]): boolean {
    return enemies.some(enemy => {
      if (enemy.state === 'destroyed') return false;
      if (!enemy.isRanged) return false;
      
      const dist = this.getDistance(squad.position, enemy.position);
      const enemyRange = 50; // TODO: 실제 사거리 사용
      
      return dist <= enemyRange;
    });
  }

  /**
   * 포위 여부 체크
   */
  private checkIfSurrounded(squad: TWSquad, enemies: TWSquad[]): boolean {
    // 8방향에서 적이 있는지 체크
    const directions = [0, Math.PI / 4, Math.PI / 2, 3 * Math.PI / 4, Math.PI, -3 * Math.PI / 4, -Math.PI / 2, -Math.PI / 4];
    let coveredDirections = 0;
    
    for (const dir of directions) {
      for (const enemy of enemies) {
        if (enemy.state === 'destroyed' || enemy.state === 'routed') continue;
        
        const dist = this.getDistance(squad.position, enemy.position);
        if (dist > 20) continue;
        
        const enemyAngle = Math.atan2(
          enemy.position.z - squad.position.z,
          enemy.position.x - squad.position.x
        );
        
        let angleDiff = Math.abs(enemyAngle - dir);
        if (angleDiff > Math.PI) angleDiff = 2 * Math.PI - angleDiff;
        
        if (angleDiff < Math.PI / 4) {
          coveredDirections++;
          break;
        }
      }
    }
    
    // 6방향 이상 막히면 포위
    return coveredDirections >= 6;
  }

  /**
   * 아군 지원 수준 계산
   */
  private calculateAllySupport(squad: TWSquad, nearbyAllies: TWSquad[]): number {
    let support = 0;
    
    for (const ally of nearbyAllies) {
      const dist = this.getDistance(squad.position, ally.position);
      if (dist < 30) {
        support += (1 - dist / 30) * 20;
        support += ally.aliveSoldiers * 0.3;
      }
    }
    
    return Math.min(100, support);
  }

  /**
   * 수적 우세/열세 계산
   */
  private calculateNumericalAdvantage(context: AISquadContext): number {
    const allyCount = context.allies.reduce((sum, a) => sum + a.aliveSoldiers, 0) + context.squad.aliveSoldiers;
    const enemyCount = context.enemies.reduce((sum, e) => sum + e.aliveSoldiers, 0);
    
    if (enemyCount === 0) return 1;
    if (allyCount === 0) return -1;
    
    return (allyCount - enemyCount) / Math.max(allyCount, enemyCount);
  }

  // ========================================
  // 외부 API
  // ========================================

  /**
   * 부대 AI 상태 조회
   */
  getSquadAIState(squadId: string): AIState | null {
    return this.squadAIs.get(squadId)?.state || null;
  }

  /**
   * 부대 현재 타겟 조회
   */
  getSquadTarget(squadId: string): TWSquad | null {
    return this.squadAIs.get(squadId)?.currentTarget || null;
  }

  /**
   * 부대 목표 위치 조회
   */
  getSquadTargetPosition(squadId: string): Vector2 | null {
    return this.squadAIs.get(squadId)?.targetPosition || null;
  }

  /**
   * 수동 타겟 설정 (플레이어 명령)
   */
  setManualTarget(squadId: string, target: TWSquad | null): void {
    const ai = this.squadAIs.get(squadId);
    if (ai) {
      ai.currentTarget = target;
      ai.isPlayerControlled = true;
    }
  }

  /**
   * 수동 이동 명령
   */
  setManualMove(squadId: string, position: Vector2): void {
    const ai = this.squadAIs.get(squadId);
    if (ai) {
      ai.targetPosition = position;
      ai.isPlayerControlled = true;
    }
  }

  /**
   * AI 제어 해제
   */
  releaseManualControl(squadId: string): void {
    const ai = this.squadAIs.get(squadId);
    if (ai) {
      ai.isPlayerControlled = false;
    }
  }

  /**
   * 설정 업데이트
   */
  updateConfig(config: Partial<AIControllerConfig>): void {
    this.config = { ...this.config, ...config };
    
    if (config.targetWeights) {
      this.targetSelector.updateWeights(config.targetWeights);
    }
  }

  /**
   * 성능 메트릭 조회
   */
  getMetrics(): typeof this.metrics {
    return { ...this.metrics };
  }

  /**
   * 전체 초기화
   */
  reset(): void {
    this.squadAIs.clear();
    this.spatialGrid.clear();
    this.updateQueue = [];
    this.metrics = {
      updateCount: 0,
      avgUpdateTime: 0,
      stateChanges: 0,
      targetChanges: 0,
    };
  }
}

// ========================================
// 팩토리 함수
// ========================================

let aiControllerInstance: AIController | null = null;

/**
 * AI 컨트롤러 인스턴스 획득
 */
export function getAIController(config?: Partial<AIControllerConfig>): AIController {
  if (!aiControllerInstance) {
    aiControllerInstance = new AIController(config);
  }
  return aiControllerInstance;
}

/**
 * AI 컨트롤러 리셋
 */
export function resetAIController(): void {
  if (aiControllerInstance) {
    aiControllerInstance.reset();
  }
  aiControllerInstance = null;
}

export default AIController;





