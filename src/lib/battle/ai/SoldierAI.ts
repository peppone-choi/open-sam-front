/**
 * SoldierAI - 개별 병사의 자율 행동 시스템
 * 
 * 핵심 시스템:
 * 1. 상태 머신 (State Machine)
 * 2. A* 경로 탐색 (Pathfinding)
 * 3. Steering Behavior (Seek, Flee, Arrive, Separation)
 * 4. 성능 최적화 (프레임 분산, 적 탐색 캐싱)
 * 
 * @author TotalWar Engine AI Module
 */

import { 
  TWSoldier, 
  SoldierState, 
  TWSquad,
  Vector2,
  Quadtree,
  QTPoint,
  QTBounds,
  MORALE_THRESHOLDS,
  FLANKING_BONUS,
  CHARGE_BONUS_DURATION,
} from '../TotalWarEngine';

// ========================================
// 타입 정의
// ========================================

/** A* 경로 노드 */
export interface PathNode {
  x: number;
  z: number;
  g: number;     // 시작점에서 비용
  h: number;     // 목표까지 추정 비용 (휴리스틱)
  f: number;     // g + h
  parent?: PathNode;
  walkable: boolean;
}

/** 장애물 */
export interface Obstacle {
  position: Vector2;
  radius: number;
  type: 'static' | 'dynamic';  // 정적/동적 장애물
}

/** 그리드 셀 */
export interface GridCell {
  x: number;
  z: number;
  walkable: boolean;
  cost: number;  // 이동 비용 (1 = 평지, 2 = 험지 등)
}

/** Steering 결과 벡터 */
export interface SteeringForce {
  x: number;
  z: number;
  magnitude: number;
}

/** 상태 전환 조건 */
export interface StateTransition {
  from: SoldierState;
  to: SoldierState;
  condition: (soldier: TWSoldier, context: AIContext) => boolean;
  priority: number;  // 높을수록 우선
}

/** AI 컨텍스트 (매 업데이트 전달) */
export interface AIContext {
  currentTime: number;
  deltaTime: number;
  squad: TWSquad;
  nearestEnemy: TWSoldier | null;
  nearestEnemyDistance: number;
  nearbyAllies: TWSoldier[];
  nearbyEnemies: TWSoldier[];
  isBeingFlanked: boolean;
  isUnderRangedFire: boolean;
  squadState: string;
  formationTarget: Vector2;
}

/** 캐시된 적 정보 */
export interface EnemyCache {
  soldierId: string;
  enemy: TWSoldier | null;
  distance: number;
  timestamp: number;
}

/** AI 설정 */
export interface SoldierAIConfig {
  updateBatchSize: number;          // 한 프레임에 업데이트할 병사 수
  enemyCacheLifetime: number;       // 적 캐시 유효 시간 (ms)
  pathfindingGridSize: number;      // 경로 탐색 그리드 크기
  maxPathLength: number;            // 최대 경로 길이
  separationRadius: number;         // 분리 반경
  cohesionRadius: number;           // 응집 반경
  alignmentRadius: number;          // 정렬 반경
  steeringMaxForce: number;         // 최대 조향 힘
  arriveSlowingRadius: number;      // 도착 감속 반경
}

// ========================================
// 기본 설정값
// ========================================

export const DEFAULT_AI_CONFIG: SoldierAIConfig = {
  updateBatchSize: 100,
  enemyCacheLifetime: 200,          // 200ms
  pathfindingGridSize: 1.0,         // 1미터 그리드
  maxPathLength: 50,                // 최대 50 노드
  separationRadius: 1.5,            // 1.5미터
  cohesionRadius: 5.0,
  alignmentRadius: 3.0,
  steeringMaxForce: 5.0,
  arriveSlowingRadius: 3.0,
};

// ========================================
// 상태 머신 (Finite State Machine)
// ========================================

/**
 * 병사 상태 머신
 * 
 * 상태 다이어그램:
 *         ┌─────────────────────────────────┐
 *         │                                 │
 *         ▼                                 │
 *   ┌───────────┐                           │
 *   │   idle    │◄────────────────┐         │
 *   └─────┬─────┘                 │         │
 *         │ 적 발견                │ 적 없음  │
 *         ▼                       │         │
 *   ┌───────────┐                 │         │
 *   │  moving   │─────────────────┤         │
 *   └─────┬─────┘                 │         │
 *         │ 거리 <5               │         │
 *         ▼                       │         │
 *   ┌───────────┐                 │         │
 *   │ charging  │                 │         │
 *   └─────┬─────┘                 │         │
 *         │ 충돌                   │         │
 *         ▼                       │         │
 *   ┌───────────┐   적 도망       │         │
 *   │ fighting  │──────────────────         │
 *   └─────┬─────┘                           │
 *         │ 적 죽음                          │
 *         │         ┌───────────┐           │
 *         ├────────►│ pursuing  │───────────┤
 *         │         └───────────┘           │
 *         │                                 │
 *         │ 사기 < 40                        │
 *         ▼                                 │
 *   ┌───────────┐                           │
 *   │ wavering  │                           │
 *   └─────┬─────┘                           │
 *         │ 사기 < 20                        │
 *         ▼                                 │
 *   ┌───────────┐   사기 회복    ┌─────────┐│
 *   │  routing  │──────────────►│rallying ├┘
 *   └─────┬─────┘               └─────────┘
 *         │ HP <= 0
 *         ▼
 *   ┌───────────┐
 *   │   dead    │
 *   └───────────┘
 */
export class SoldierStateMachine {
  private transitions: StateTransition[] = [];
  private stateHandlers: Map<SoldierState, (soldier: TWSoldier, context: AIContext, dt: number) => void> = new Map();
  private onEnterHandlers: Map<SoldierState, (soldier: TWSoldier, context: AIContext) => void> = new Map();
  private onExitHandlers: Map<SoldierState, (soldier: TWSoldier, context: AIContext) => void> = new Map();
  
  constructor() {
    this.setupTransitions();
    this.setupStateHandlers();
  }
  
  /**
   * 상태 전환 조건 설정
   */
  private setupTransitions(): void {
    // idle → moving: 적이 있고 진형 위치와 다르면
    this.addTransition('idle', 'moving', (s, ctx) => {
      const distToTarget = this.getDistance(s.position, s.targetPosition);
      return distToTarget > 0.5;
    }, 1);
    
    // moving → charging: 돌격 중이고 적이 가까우면
    this.addTransition('moving', 'charging', (s, ctx) => {
      return s.isCharging && ctx.nearestEnemyDistance < 8 && ctx.nearestEnemyDistance > 2;
    }, 3);
    
    // moving → fighting: 교전 상대가 있으면
    this.addTransition('moving', 'fighting', (s, ctx) => {
      return !!s.engagedWith && ctx.nearestEnemyDistance <= s.attackRange + 0.5;
    }, 4);
    
    // charging → fighting: 적과 충돌
    this.addTransition('charging', 'fighting', (s, ctx) => {
      return ctx.nearestEnemyDistance <= s.attackRange + 0.5;
    }, 5);
    
    // fighting → pursuing: 교전 상대가 도망
    this.addTransition('fighting', 'pursuing', (s, ctx) => {
      if (!s.engagedWith) return false;
      const enemy = ctx.nearbyEnemies.find(e => e.id === s.engagedWith);
      return enemy?.state === 'routing' || enemy?.state === 'wavering';
    }, 3);
    
    // fighting → idle: 교전 상대가 없거나 죽음
    this.addTransition('fighting', 'idle', (s, ctx) => {
      if (!s.engagedWith) return true;
      const enemy = ctx.nearbyEnemies.find(e => e.id === s.engagedWith);
      return !enemy || enemy.state === 'dead';
    }, 2);
    
    // pursuing → fighting: 적을 따라잡음
    this.addTransition('pursuing', 'fighting', (s, ctx) => {
      return ctx.nearestEnemyDistance <= s.attackRange + 0.5;
    }, 4);
    
    // pursuing → idle: 적을 놓침
    this.addTransition('pursuing', 'idle', (s, ctx) => {
      return ctx.nearestEnemy === null || ctx.nearestEnemyDistance > 20;
    }, 2);
    
    // 모든 상태 → wavering: 사기 저하
    const combatStates: SoldierState[] = ['idle', 'moving', 'charging', 'fighting', 'pursuing'];
    combatStates.forEach(state => {
      this.addTransition(state, 'wavering', (s, ctx) => {
        return s.morale < MORALE_THRESHOLDS.wavering && s.morale >= MORALE_THRESHOLDS.routing;
      }, 10);
    });
    
    // wavering → routing: 사기 붕괴
    this.addTransition('wavering', 'routing', (s, ctx) => {
      return s.morale < MORALE_THRESHOLDS.routing;
    }, 20);
    
    // wavering → idle: 사기 회복
    this.addTransition('wavering', 'idle', (s, ctx) => {
      return s.morale >= MORALE_THRESHOLDS.wavering + 10;
    }, 5);
    
    // routing → rallying: 재집결 조건 충족
    this.addTransition('routing', 'rallying', (s, ctx) => {
      return s.morale >= MORALE_THRESHOLDS.rallyMorale && 
             ctx.nearestEnemyDistance > 15 &&
             ctx.nearbyAllies.length >= 3;
    }, 8);
    
    // rallying → idle: 재집결 완료
    this.addTransition('rallying', 'idle', (s, ctx) => {
      const distToFormation = this.getDistance(s.position, ctx.formationTarget);
      return distToFormation < 2 && s.morale >= MORALE_THRESHOLDS.wavering + 5;
    }, 5);
    
    // 모든 전투 상태 → dead: HP 0 이하
    const aliveStates: SoldierState[] = ['idle', 'moving', 'charging', 'fighting', 'pursuing', 'wavering', 'routing', 'rallying'];
    aliveStates.forEach(state => {
      this.addTransition(state, 'dead', (s, ctx) => s.hp <= 0, 100);
    });
  }
  
  /**
   * 각 상태별 행동 핸들러 설정
   */
  private setupStateHandlers(): void {
    // idle: 대기 - 주변 감시
    this.stateHandlers.set('idle', (soldier, context, dt) => {
      // 피로도 회복
      soldier.fatigue = Math.max(0, soldier.fatigue - 0.01 * dt);
      // 사기 자연 회복
      soldier.morale = Math.min(100, soldier.morale + 0.005 * dt);
    });
    
    // moving: 이동 - 목표 위치로 이동
    this.stateHandlers.set('moving', (soldier, context, dt) => {
      // 이동은 SoldierAI.updateMovement에서 처리
      soldier.fatigue = Math.min(100, soldier.fatigue + 0.005 * dt);
    });
    
    // charging: 돌격 - 빠르게 적에게 돌진
    this.stateHandlers.set('charging', (soldier, context, dt) => {
      if (context.nearestEnemy) {
        soldier.targetPosition = { ...context.nearestEnemy.position };
        soldier.facing = Math.atan2(
          context.nearestEnemy.position.x - soldier.position.x,
          context.nearestEnemy.position.z - soldier.position.z
        );
      }
      // 돌격 중 피로도 증가
      soldier.fatigue = Math.min(100, soldier.fatigue + 0.02 * dt);
    });
    
    // fighting: 전투 - 적과 교전
    this.stateHandlers.set('fighting', (soldier, context, dt) => {
      // 전투 처리는 TotalWarEngine.processCombat에서
      soldier.fatigue = Math.min(100, soldier.fatigue + 0.01 * dt);
      
      // 교전 상대 바라보기
      if (soldier.engagedWith) {
        const enemy = context.nearbyEnemies.find(e => e.id === soldier.engagedWith);
        if (enemy) {
          soldier.facing = Math.atan2(
            enemy.position.x - soldier.position.x,
            enemy.position.z - soldier.position.z
          );
        }
      }
    });
    
    // pursuing: 추격 - 도망치는 적 추격
    this.stateHandlers.set('pursuing', (soldier, context, dt) => {
      if (context.nearestEnemy) {
        // 예측 위치로 추격 (약간 앞서서)
        const prediction = 0.5; // 0.5초 앞 예측
        soldier.targetPosition = {
          x: context.nearestEnemy.position.x + (context.nearestEnemy.targetPosition.x - context.nearestEnemy.position.x) * prediction,
          z: context.nearestEnemy.position.z + (context.nearestEnemy.targetPosition.z - context.nearestEnemy.position.z) * prediction,
        };
      }
      soldier.fatigue = Math.min(100, soldier.fatigue + 0.015 * dt);
    });
    
    // wavering: 동요 - 전투 효율 저하
    this.stateHandlers.set('wavering', (soldier, context, dt) => {
      // 동요 중에는 방어적 행동
      // 아군 쪽으로 약간 후퇴
      if (context.nearbyAllies.length > 0) {
        const allyCenter = this.calculateCenter(context.nearbyAllies);
        const dirToAllies = Math.atan2(
          allyCenter.z - soldier.position.z,
          allyCenter.x - soldier.position.x
        );
        soldier.targetPosition = {
          x: soldier.position.x + Math.cos(dirToAllies) * 1,
          z: soldier.position.z + Math.sin(dirToAllies) * 1,
        };
      }
      
      // 사기 회복 시도
      if (!context.isBeingFlanked && context.nearbyAllies.length >= 3) {
        soldier.morale = Math.min(100, soldier.morale + 0.02 * dt);
      }
    });
    
    // routing: 탈주 - 전장에서 도망
    this.stateHandlers.set('routing', (soldier, context, dt) => {
      // 적 반대 방향으로 도망
      if (context.nearestEnemy) {
        const fleeDir = Math.atan2(
          soldier.position.z - context.nearestEnemy.position.z,
          soldier.position.x - context.nearestEnemy.position.x
        );
        soldier.targetPosition = {
          x: soldier.position.x + Math.cos(fleeDir) * 30,
          z: soldier.position.z + Math.sin(fleeDir) * 30,
        };
      } else {
        // 후방으로 도망 (팀에 따라)
        const retreatDir = soldier.teamId === 'attacker' ? Math.PI : 0;
        soldier.targetPosition = {
          x: soldier.position.x + Math.cos(retreatDir) * 30,
          z: soldier.position.z + Math.sin(retreatDir) * 30,
        };
      }
      
      // 적에게서 멀어지면 사기 회복
      if (context.nearestEnemyDistance > 20) {
        soldier.morale = Math.min(100, soldier.morale + 0.01 * dt);
      }
    });
    
    // rallying: 재집결 - 아군과 합류
    this.stateHandlers.set('rallying', (soldier, context, dt) => {
      // 진형 위치로 복귀
      soldier.targetPosition = { ...context.formationTarget };
      // 사기 빠르게 회복
      soldier.morale = Math.min(100, soldier.morale + 0.03 * dt);
      // 피로도 회복
      soldier.fatigue = Math.max(0, soldier.fatigue - 0.02 * dt);
    });
    
    // dead: 사망 - 아무 행동 없음
    this.stateHandlers.set('dead', () => {
      // 아무것도 하지 않음
    });
  }
  
  /**
   * 상태 전환 추가
   */
  addTransition(from: SoldierState, to: SoldierState, condition: StateTransition['condition'], priority: number): void {
    this.transitions.push({ from, to, condition, priority });
    // 우선순위 순 정렬
    this.transitions.sort((a, b) => b.priority - a.priority);
  }
  
  /**
   * 상태 업데이트 - 전환 체크 및 핸들러 실행
   */
  update(soldier: TWSoldier, context: AIContext, deltaTime: number): void {
    // 1. 상태 전환 체크
    for (const transition of this.transitions) {
      if (transition.from === soldier.state && transition.condition(soldier, context)) {
        this.transitionTo(soldier, transition.to, context);
        break;
      }
    }
    
    // 2. 현재 상태 핸들러 실행
    const handler = this.stateHandlers.get(soldier.state);
    if (handler) {
      handler(soldier, context, deltaTime);
    }
  }
  
  /**
   * 상태 전환 실행
   */
  private transitionTo(soldier: TWSoldier, newState: SoldierState, context: AIContext): void {
    const oldState = soldier.state;
    
    // Exit 핸들러
    const exitHandler = this.onExitHandlers.get(oldState);
    if (exitHandler) {
      exitHandler(soldier, context);
    }
    
    // 상태 변경
    soldier.state = newState;
    
    // Enter 핸들러
    const enterHandler = this.onEnterHandlers.get(newState);
    if (enterHandler) {
      enterHandler(soldier, context);
    }
    
    // 특별 처리
    if (newState === 'charging') {
      soldier.isCharging = true;
      soldier.chargeStartTime = context.currentTime;
    } else if (oldState === 'charging') {
      // 돌격 보너스 시간 지나면 해제
      if (soldier.chargeStartTime && 
          context.currentTime - soldier.chargeStartTime > CHARGE_BONUS_DURATION) {
        soldier.isCharging = false;
      }
    }
    
    if (newState === 'fighting' && !soldier.engagedWith && context.nearestEnemy) {
      soldier.engagedWith = context.nearestEnemy.id;
    }
    
    if (newState === 'dead') {
      soldier.engagedWith = undefined;
    }
  }
  
  // 유틸리티
  private getDistance(a: Vector2, b: Vector2): number {
    const dx = b.x - a.x;
    const dz = b.z - a.z;
    return Math.sqrt(dx * dx + dz * dz);
  }
  
  private calculateCenter(soldiers: TWSoldier[]): Vector2 {
    if (soldiers.length === 0) return { x: 0, z: 0 };
    const sum = soldiers.reduce(
      (acc, s) => ({ x: acc.x + s.position.x, z: acc.z + s.position.z }),
      { x: 0, z: 0 }
    );
    return { x: sum.x / soldiers.length, z: sum.z / soldiers.length };
  }
}

// ========================================
// A* 경로 탐색
// ========================================

/**
 * A* 경로 탐색 시스템
 * 
 * 그리드 기반 경로 탐색
 * 장애물 회피
 * 동적 장애물 지원
 */
export class AStarPathfinder {
  private gridSize: number;
  private maxPathLength: number;
  
  // 재사용 버퍼 (GC 최소화)
  private openList: PathNode[] = [];
  private closedSet: Set<string> = new Set();
  private nodePool: PathNode[] = [];
  private nodePoolIndex = 0;
  
  constructor(config: SoldierAIConfig) {
    this.gridSize = config.pathfindingGridSize;
    this.maxPathLength = config.maxPathLength;
    
    // 노드 풀 초기화
    for (let i = 0; i < 1000; i++) {
      this.nodePool.push({ x: 0, z: 0, g: 0, h: 0, f: 0, walkable: true });
    }
  }
  
  /**
   * A* 경로 탐색
   * @param start 시작 위치
   * @param goal 목표 위치
   * @param obstacles 장애물 목록
   * @returns 경로 (Vector2 배열) 또는 빈 배열
   */
  findPath(start: Vector2, goal: Vector2, obstacles: Obstacle[]): Vector2[] {
    // 풀 인덱스 리셋
    this.nodePoolIndex = 0;
    this.openList.length = 0;
    this.closedSet.clear();
    
    // 시작점과 목표점이 같으면 빈 경로
    const directDist = this.heuristic(start, goal);
    if (directDist < this.gridSize) {
      return [goal];
    }
    
    // 직접 경로가 가능하면 바로 반환 (장애물 없음)
    if (!this.hasObstacleBetween(start, goal, obstacles)) {
      return [goal];
    }
    
    // A* 탐색 시작
    const startNode = this.getNode();
    startNode.x = Math.round(start.x / this.gridSize) * this.gridSize;
    startNode.z = Math.round(start.z / this.gridSize) * this.gridSize;
    startNode.g = 0;
    startNode.h = this.heuristic(startNode, goal);
    startNode.f = startNode.h;
    startNode.parent = undefined;
    startNode.walkable = true;
    
    this.openList.push(startNode);
    
    let iterations = 0;
    const maxIterations = this.maxPathLength * 10;
    
    while (this.openList.length > 0 && iterations < maxIterations) {
      iterations++;
      
      // f값이 가장 작은 노드 선택
      this.openList.sort((a, b) => a.f - b.f);
      const current = this.openList.shift()!;
      
      // 목표 도달 체크
      if (this.heuristic(current, goal) < this.gridSize * 1.5) {
        return this.reconstructPath(current, goal);
      }
      
      // Closed 셋에 추가
      this.closedSet.add(this.nodeKey(current));
      
      // 이웃 노드 탐색 (8방향)
      const neighbors = this.getNeighbors(current, obstacles);
      
      for (const neighbor of neighbors) {
        const key = this.nodeKey(neighbor);
        if (this.closedSet.has(key)) continue;
        
        const tentativeG = current.g + this.gridSize * (
          Math.abs(neighbor.x - current.x) > 0 && Math.abs(neighbor.z - current.z) > 0 
            ? 1.414 // 대각선
            : 1.0   // 직선
        );
        
        const existingIndex = this.openList.findIndex(n => this.nodeKey(n) === key);
        
        if (existingIndex === -1) {
          // 새 노드
          neighbor.g = tentativeG;
          neighbor.h = this.heuristic(neighbor, goal);
          neighbor.f = neighbor.g + neighbor.h;
          neighbor.parent = current;
          this.openList.push(neighbor);
        } else if (tentativeG < this.openList[existingIndex].g) {
          // 더 좋은 경로 발견
          this.openList[existingIndex].g = tentativeG;
          this.openList[existingIndex].f = tentativeG + this.openList[existingIndex].h;
          this.openList[existingIndex].parent = current;
        }
      }
    }
    
    // 경로를 찾지 못함 - 직선 경로 반환
    return [goal];
  }
  
  /**
   * 휴리스틱 함수 (맨하탄 거리)
   */
  private heuristic(a: { x: number; z: number }, b: { x: number; z: number }): number {
    return Math.abs(a.x - b.x) + Math.abs(a.z - b.z);
  }
  
  /**
   * 이웃 노드 생성 (8방향)
   */
  private getNeighbors(node: PathNode, obstacles: Obstacle[]): PathNode[] {
    const neighbors: PathNode[] = [];
    const directions = [
      { dx: -1, dz: 0 },  // 좌
      { dx: 1, dz: 0 },   // 우
      { dx: 0, dz: -1 },  // 상
      { dx: 0, dz: 1 },   // 하
      { dx: -1, dz: -1 }, // 좌상
      { dx: 1, dz: -1 },  // 우상
      { dx: -1, dz: 1 },  // 좌하
      { dx: 1, dz: 1 },   // 우하
    ];
    
    for (const dir of directions) {
      const nx = node.x + dir.dx * this.gridSize;
      const nz = node.z + dir.dz * this.gridSize;
      
      // 장애물 체크
      if (this.isBlocked({ x: nx, z: nz }, obstacles)) continue;
      
      // 대각선 이동 시 양쪽 모두 통과 가능해야 함
      if (dir.dx !== 0 && dir.dz !== 0) {
        if (this.isBlocked({ x: node.x + dir.dx * this.gridSize, z: node.z }, obstacles)) continue;
        if (this.isBlocked({ x: node.x, z: node.z + dir.dz * this.gridSize }, obstacles)) continue;
      }
      
      const neighbor = this.getNode();
      neighbor.x = nx;
      neighbor.z = nz;
      neighbor.walkable = true;
      neighbors.push(neighbor);
    }
    
    return neighbors;
  }
  
  /**
   * 위치가 장애물로 막혔는지 체크
   */
  private isBlocked(pos: Vector2, obstacles: Obstacle[]): boolean {
    for (const obs of obstacles) {
      const dx = pos.x - obs.position.x;
      const dz = pos.z - obs.position.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < obs.radius + this.gridSize * 0.5) {
        return true;
      }
    }
    return false;
  }
  
  /**
   * 두 점 사이에 장애물이 있는지 체크 (Ray casting)
   */
  private hasObstacleBetween(start: Vector2, end: Vector2, obstacles: Obstacle[]): boolean {
    const dx = end.x - start.x;
    const dz = end.z - start.z;
    const dist = Math.sqrt(dx * dx + dz * dz);
    const steps = Math.ceil(dist / this.gridSize);
    
    for (let i = 1; i < steps; i++) {
      const t = i / steps;
      const point = {
        x: start.x + dx * t,
        z: start.z + dz * t,
      };
      if (this.isBlocked(point, obstacles)) {
        return true;
      }
    }
    return false;
  }
  
  /**
   * 경로 재구성 (역추적)
   */
  private reconstructPath(endNode: PathNode, goal: Vector2): Vector2[] {
    const path: Vector2[] = [];
    let current: PathNode | undefined = endNode;
    
    while (current) {
      path.unshift({ x: current.x, z: current.z });
      current = current.parent;
    }
    
    // 시작점 제거 (현재 위치)
    if (path.length > 0) {
      path.shift();
    }
    
    // 목표점 추가
    path.push(goal);
    
    // 경로 스무딩 (선택적)
    return this.smoothPath(path);
  }
  
  /**
   * 경로 스무딩 - 불필요한 웨이포인트 제거
   */
  private smoothPath(path: Vector2[]): Vector2[] {
    if (path.length <= 2) return path;
    
    const smoothed: Vector2[] = [path[0]];
    let current = 0;
    
    while (current < path.length - 1) {
      let farthest = current + 1;
      
      // 직선 경로가 가능한 가장 먼 점 찾기
      for (let i = current + 2; i < path.length; i++) {
        // 중간 점들이 직선에서 벗어나지 않는지 체크
        const dx = path[i].x - path[current].x;
        const dz = path[i].z - path[current].z;
        const len = Math.sqrt(dx * dx + dz * dz);
        
        let canSkip = true;
        for (let j = current + 1; j < i; j++) {
          const t = ((path[j].x - path[current].x) * dx + (path[j].z - path[current].z) * dz) / (len * len);
          const closest = {
            x: path[current].x + dx * t,
            z: path[current].z + dz * t,
          };
          const distToLine = Math.sqrt(
            (path[j].x - closest.x) ** 2 + (path[j].z - closest.z) ** 2
          );
          if (distToLine > this.gridSize * 0.5) {
            canSkip = false;
            break;
          }
        }
        
        if (canSkip) {
          farthest = i;
        }
      }
      
      current = farthest;
      smoothed.push(path[current]);
    }
    
    return smoothed;
  }
  
  /**
   * 노드 키 생성 (해시용)
   */
  private nodeKey(node: { x: number; z: number }): string {
    return `${Math.round(node.x * 10)},${Math.round(node.z * 10)}`;
  }
  
  /**
   * 노드 풀에서 노드 가져오기
   */
  private getNode(): PathNode {
    if (this.nodePoolIndex >= this.nodePool.length) {
      // 풀 확장
      for (let i = 0; i < 100; i++) {
        this.nodePool.push({ x: 0, z: 0, g: 0, h: 0, f: 0, walkable: true });
      }
    }
    const node = this.nodePool[this.nodePoolIndex++];
    node.parent = undefined;
    return node;
  }
}

// ========================================
// Steering Behaviors
// ========================================

/**
 * Steering Behavior 시스템
 * 
 * - Seek: 목표로 이동
 * - Flee: 목표에서 도망
 * - Arrive: 목표에 부드럽게 도착
 * - Separation: 다른 유닛과 간격 유지
 * - Cohesion: 그룹 중심으로 이동
 * - Alignment: 그룹과 같은 방향으로 이동
 */
export class SteeringBehavior {
  private config: SoldierAIConfig;
  
  constructor(config: SoldierAIConfig) {
    this.config = config;
  }
  
  /**
   * Seek - 목표를 향해 최대 속도로 이동
   */
  seek(position: Vector2, target: Vector2, maxSpeed: number): SteeringForce {
    const dx = target.x - position.x;
    const dz = target.z - position.z;
    const distance = Math.sqrt(dx * dx + dz * dz);
    
    if (distance < 0.001) {
      return { x: 0, z: 0, magnitude: 0 };
    }
    
    const desiredX = (dx / distance) * maxSpeed;
    const desiredZ = (dz / distance) * maxSpeed;
    
    return {
      x: desiredX,
      z: desiredZ,
      magnitude: maxSpeed,
    };
  }
  
  /**
   * Flee - 목표에서 도망
   */
  flee(position: Vector2, threat: Vector2, maxSpeed: number, panicRadius: number = 10): SteeringForce {
    const dx = position.x - threat.x;
    const dz = position.z - threat.z;
    const distance = Math.sqrt(dx * dx + dz * dz);
    
    if (distance > panicRadius) {
      return { x: 0, z: 0, magnitude: 0 };
    }
    
    if (distance < 0.001) {
      // 같은 위치면 랜덤 방향으로 도망
      const angle = Math.random() * Math.PI * 2;
      return {
        x: Math.cos(angle) * maxSpeed,
        z: Math.sin(angle) * maxSpeed,
        magnitude: maxSpeed,
      };
    }
    
    // 거리에 반비례하여 도망 강도 증가
    const urgency = 1 - (distance / panicRadius);
    const speed = maxSpeed * urgency;
    
    return {
      x: (dx / distance) * speed,
      z: (dz / distance) * speed,
      magnitude: speed,
    };
  }
  
  /**
   * Arrive - 목표에 부드럽게 도착 (감속)
   */
  arrive(position: Vector2, target: Vector2, maxSpeed: number, slowingRadius?: number): SteeringForce {
    const radius = slowingRadius || this.config.arriveSlowingRadius;
    
    const dx = target.x - position.x;
    const dz = target.z - position.z;
    const distance = Math.sqrt(dx * dx + dz * dz);
    
    if (distance < 0.1) {
      return { x: 0, z: 0, magnitude: 0 };
    }
    
    // 감속 반경 내에서 속도 감소
    let speed = maxSpeed;
    if (distance < radius) {
      speed = maxSpeed * (distance / radius);
    }
    
    return {
      x: (dx / distance) * speed,
      z: (dz / distance) * speed,
      magnitude: speed,
    };
  }
  
  /**
   * Separation - 주변 유닛과 거리 유지
   */
  separation(position: Vector2, neighbors: TWSoldier[], separationRadius?: number): SteeringForce {
    const radius = separationRadius || this.config.separationRadius;
    let forceX = 0;
    let forceZ = 0;
    let count = 0;
    
    for (const neighbor of neighbors) {
      const dx = position.x - neighbor.position.x;
      const dz = position.z - neighbor.position.z;
      const distance = Math.sqrt(dx * dx + dz * dz);
      
      if (distance > 0 && distance < radius) {
        // 거리에 반비례하는 반발력
        const strength = (radius - distance) / radius;
        forceX += (dx / distance) * strength;
        forceZ += (dz / distance) * strength;
        count++;
      }
    }
    
    if (count === 0) {
      return { x: 0, z: 0, magnitude: 0 };
    }
    
    // 평균화
    forceX /= count;
    forceZ /= count;
    
    const magnitude = Math.sqrt(forceX * forceX + forceZ * forceZ);
    
    // 정규화 및 최대 힘 적용
    if (magnitude > 0) {
      const maxForce = this.config.steeringMaxForce;
      const normalizedMag = Math.min(magnitude, maxForce);
      forceX = (forceX / magnitude) * normalizedMag;
      forceZ = (forceZ / magnitude) * normalizedMag;
    }
    
    return { x: forceX, z: forceZ, magnitude };
  }
  
  /**
   * Cohesion - 그룹 중심으로 이동
   */
  cohesion(position: Vector2, neighbors: TWSoldier[], maxSpeed: number): SteeringForce {
    if (neighbors.length === 0) {
      return { x: 0, z: 0, magnitude: 0 };
    }
    
    // 그룹 중심 계산
    let centerX = 0;
    let centerZ = 0;
    
    for (const neighbor of neighbors) {
      centerX += neighbor.position.x;
      centerZ += neighbor.position.z;
    }
    
    centerX /= neighbors.length;
    centerZ /= neighbors.length;
    
    // 중심을 향해 Seek
    return this.seek(position, { x: centerX, z: centerZ }, maxSpeed);
  }
  
  /**
   * Alignment - 그룹과 같은 방향으로 이동
   */
  alignment(neighbors: TWSoldier[]): SteeringForce {
    if (neighbors.length === 0) {
      return { x: 0, z: 0, magnitude: 0 };
    }
    
    // 평균 방향 계산
    let avgDirX = 0;
    let avgDirZ = 0;
    
    for (const neighbor of neighbors) {
      const angle = neighbor.facing;
      avgDirX += Math.cos(angle);
      avgDirZ += Math.sin(angle);
    }
    
    avgDirX /= neighbors.length;
    avgDirZ /= neighbors.length;
    
    const magnitude = Math.sqrt(avgDirX * avgDirX + avgDirZ * avgDirZ);
    
    return {
      x: avgDirX,
      z: avgDirZ,
      magnitude,
    };
  }
  
  /**
   * 조향력 합성
   * 여러 행동의 결과를 가중치로 합성
   */
  combine(forces: Array<{ force: SteeringForce; weight: number }>, maxForce: number): SteeringForce {
    let totalX = 0;
    let totalZ = 0;
    
    for (const { force, weight } of forces) {
      totalX += force.x * weight;
      totalZ += force.z * weight;
    }
    
    let magnitude = Math.sqrt(totalX * totalX + totalZ * totalZ);
    
    // 최대 힘 제한
    if (magnitude > maxForce) {
      totalX = (totalX / magnitude) * maxForce;
      totalZ = (totalZ / magnitude) * maxForce;
      magnitude = maxForce;
    }
    
    return { x: totalX, z: totalZ, magnitude };
  }
  
  /**
   * Evade - 움직이는 목표에서 회피 (예측 기반)
   */
  evade(position: Vector2, threat: TWSoldier, maxSpeed: number): SteeringForce {
    // 위협의 미래 위치 예측
    const lookAhead = this.getDistance(position, threat.position) / maxSpeed;
    const futurePos = {
      x: threat.position.x + (threat.targetPosition.x - threat.position.x) * Math.min(lookAhead, 1),
      z: threat.position.z + (threat.targetPosition.z - threat.position.z) * Math.min(lookAhead, 1),
    };
    
    return this.flee(position, futurePos, maxSpeed);
  }
  
  /**
   * Pursuit - 움직이는 목표 추격 (예측 기반)
   */
  pursuit(position: Vector2, target: TWSoldier, maxSpeed: number): SteeringForce {
    // 목표의 미래 위치 예측
    const dist = this.getDistance(position, target.position);
    const lookAhead = dist / (maxSpeed * 2);
    
    const futurePos = {
      x: target.position.x + (target.targetPosition.x - target.position.x) * Math.min(lookAhead, 1),
      z: target.position.z + (target.targetPosition.z - target.position.z) * Math.min(lookAhead, 1),
    };
    
    return this.seek(position, futurePos, maxSpeed);
  }
  
  /**
   * Wander - 무작위 방황
   */
  wander(currentDirection: number, wanderStrength: number = 0.3): SteeringForce {
    // 현재 방향에서 약간의 랜덤 변화
    const angle = currentDirection + (Math.random() - 0.5) * wanderStrength;
    
    return {
      x: Math.cos(angle),
      z: Math.sin(angle),
      magnitude: 1,
    };
  }
  
  private getDistance(a: Vector2, b: Vector2): number {
    const dx = b.x - a.x;
    const dz = b.z - a.z;
    return Math.sqrt(dx * dx + dz * dz);
  }
}

// ========================================
// 성능 최적화 시스템
// ========================================

/**
 * 병사 AI 업데이트 스케줄러
 * 프레임 분산으로 CPU 부하 분산
 */
export class AIUpdateScheduler {
  private batchSize: number;
  private currentBatch = 0;
  private soldierGroups: TWSoldier[][] = [];
  
  constructor(config: SoldierAIConfig) {
    this.batchSize = config.updateBatchSize;
  }
  
  /**
   * 병사 목록을 배치로 분할
   */
  setupBatches(soldiers: TWSoldier[]): void {
    this.soldierGroups = [];
    
    for (let i = 0; i < soldiers.length; i += this.batchSize) {
      this.soldierGroups.push(soldiers.slice(i, i + this.batchSize));
    }
    
    this.currentBatch = 0;
  }
  
  /**
   * 현재 프레임에 업데이트할 병사 배치 반환
   */
  getNextBatch(): TWSoldier[] {
    if (this.soldierGroups.length === 0) {
      return [];
    }
    
    const batch = this.soldierGroups[this.currentBatch];
    this.currentBatch = (this.currentBatch + 1) % this.soldierGroups.length;
    return batch;
  }
  
  /**
   * 모든 병사 반환 (전체 업데이트용)
   */
  getAllSoldiers(): TWSoldier[] {
    return this.soldierGroups.flat();
  }
  
  /**
   * 배치 수 반환
   */
  getBatchCount(): number {
    return this.soldierGroups.length;
  }
  
  /**
   * 배치 크기 조정
   */
  setBatchSize(size: number): void {
    this.batchSize = size;
  }
}

/**
 * 근거리 적 탐색 캐시
 * 매 프레임 적 탐색 비용 절감
 */
export class EnemySearchCache {
  private cache: Map<string, EnemyCache> = new Map();
  private cacheLifetime: number;
  
  constructor(config: SoldierAIConfig) {
    this.cacheLifetime = config.enemyCacheLifetime;
  }
  
  /**
   * 캐시된 적 정보 조회
   */
  get(soldierId: string, currentTime: number): EnemyCache | null {
    const cached = this.cache.get(soldierId);
    
    if (!cached) return null;
    if (currentTime - cached.timestamp > this.cacheLifetime) {
      this.cache.delete(soldierId);
      return null;
    }
    
    return cached;
  }
  
  /**
   * 캐시 업데이트
   */
  set(soldierId: string, enemy: TWSoldier | null, distance: number, currentTime: number): void {
    this.cache.set(soldierId, {
      soldierId,
      enemy,
      distance,
      timestamp: currentTime,
    });
  }
  
  /**
   * 캐시 무효화 (적이 죽었을 때 등)
   */
  invalidate(soldierId: string): void {
    this.cache.delete(soldierId);
  }
  
  /**
   * 특정 적 관련 캐시 모두 무효화
   */
  invalidateEnemy(enemyId: string): void {
    const toDelete: string[] = [];
    
    this.cache.forEach((value, key) => {
      if (value.enemy?.id === enemyId) {
        toDelete.push(key);
      }
    });
    
    toDelete.forEach(key => this.cache.delete(key));
  }
  
  /**
   * 전체 캐시 클리어
   */
  clear(): void {
    this.cache.clear();
  }
  
  /**
   * 캐시 통계
   */
  getStats(): { size: number; hitRate: number } {
    return {
      size: this.cache.size,
      hitRate: 0, // 실제 구현 시 hit/miss 카운터 추가
    };
  }
}

// ========================================
// 메인 SoldierAI 클래스
// ========================================

/**
 * SoldierAI - 병사 AI 통합 시스템
 * 
 * 사용법:
 * ```typescript
 * const ai = new SoldierAI(config);
 * 
 * // 매 프레임 호출
 * ai.update(soldiers, squads, quadtree, currentTime, deltaTime);
 * ```
 */
export class SoldierAI {
  private config: SoldierAIConfig;
  private stateMachine: SoldierStateMachine;
  private pathfinder: AStarPathfinder;
  private steering: SteeringBehavior;
  private scheduler: AIUpdateScheduler;
  private enemyCache: EnemySearchCache;
  
  // 재사용 버퍼 (GC 최소화)
  private queryBuffer: QTPoint[] = [];
  private nearbyAlliesBuffer: TWSoldier[] = [];
  private nearbyEnemiesBuffer: TWSoldier[] = [];
  private pathBuffer: Vector2[] = [];
  
  // 장애물 캐시 (동적 장애물용)
  private obstacleCache: Obstacle[] = [];
  
  // 성능 측정
  private metrics = {
    updateCount: 0,
    stateTransitions: 0,
    pathfindingCalls: 0,
    cacheHits: 0,
    cacheMisses: 0,
  };
  
  constructor(config: Partial<SoldierAIConfig> = {}) {
    this.config = { ...DEFAULT_AI_CONFIG, ...config };
    this.stateMachine = new SoldierStateMachine();
    this.pathfinder = new AStarPathfinder(this.config);
    this.steering = new SteeringBehavior(this.config);
    this.scheduler = new AIUpdateScheduler(this.config);
    this.enemyCache = new EnemySearchCache(this.config);
  }
  
  /**
   * 병사 AI 업데이트 (매 프레임 호출)
   * 
   * @param soldiers 모든 병사 목록
   * @param squads 모든 부대 Map
   * @param quadtree 공간 분할 Quadtree
   * @param currentTime 현재 시간 (ms)
   * @param deltaTime 델타 타임 (ms)
   */
  update(
    soldiers: TWSoldier[],
    squads: Map<string, TWSquad>,
    quadtree: Quadtree,
    currentTime: number,
    deltaTime: number
  ): void {
    // 배치 설정 (첫 프레임 또는 병사 수 변경 시)
    this.scheduler.setupBatches(soldiers.filter(s => s.state !== 'dead'));
    
    // 현재 배치 가져오기
    const batch = this.scheduler.getNextBatch();
    
    // 각 병사 업데이트
    for (const soldier of batch) {
      this.updateSoldier(soldier, squads, quadtree, currentTime, deltaTime);
    }
    
    this.metrics.updateCount += batch.length;
  }
  
  /**
   * 개별 병사 업데이트
   */
  private updateSoldier(
    soldier: TWSoldier,
    squads: Map<string, TWSquad>,
    quadtree: Quadtree,
    currentTime: number,
    deltaTime: number
  ): void {
    if (soldier.state === 'dead') return;
    
    const squad = squads.get(soldier.squadId);
    if (!squad) return;
    
    // AI 컨텍스트 생성
    const context = this.buildContext(soldier, squad, quadtree, currentTime);
    
    // 상태 머신 업데이트
    this.stateMachine.update(soldier, context, deltaTime);
    
    // 이동 업데이트
    this.updateMovement(soldier, context, deltaTime);
  }
  
  /**
   * AI 컨텍스트 생성
   */
  private buildContext(
    soldier: TWSoldier,
    squad: TWSquad,
    quadtree: Quadtree,
    currentTime: number
  ): AIContext {
    // 주변 유닛 탐색
    this.queryBuffer.length = 0;
    quadtree.queryRadius(
      soldier.position.x,
      soldier.position.z,
      15, // 탐색 반경
      this.queryBuffer
    );
    
    // 아군/적군 분류
    this.nearbyAlliesBuffer.length = 0;
    this.nearbyEnemiesBuffer.length = 0;
    
    let nearestEnemy: TWSoldier | null = null;
    let nearestEnemyDistance = Infinity;
    
    for (const point of this.queryBuffer) {
      const other = point.data;
      if (!other || other.id === soldier.id || other.state === 'dead') continue;
      
      if (other.teamId === soldier.teamId) {
        this.nearbyAlliesBuffer.push(other);
      } else {
        this.nearbyEnemiesBuffer.push(other);
        
        // 가장 가까운 적 찾기
        const dist = this.getDistance(soldier.position, other.position);
        if (dist < nearestEnemyDistance) {
          nearestEnemyDistance = dist;
          nearestEnemy = other;
        }
      }
    }
    
    // 캐시 체크/업데이트
    const cachedEnemy = this.enemyCache.get(soldier.id, currentTime);
    if (cachedEnemy && cachedEnemy.enemy && cachedEnemy.enemy.state !== 'dead') {
      // 캐시 히트
      this.metrics.cacheHits++;
      if (nearestEnemy === null || cachedEnemy.distance < nearestEnemyDistance) {
        nearestEnemy = cachedEnemy.enemy;
        nearestEnemyDistance = cachedEnemy.distance;
      }
    } else {
      // 캐시 미스
      this.metrics.cacheMisses++;
      this.enemyCache.set(soldier.id, nearestEnemy, nearestEnemyDistance, currentTime);
    }
    
    // 협공 판정
    const isBeingFlanked = this.checkFlanked(soldier, this.nearbyEnemiesBuffer);
    
    // 원거리 피격 판정 (간략화)
    const isUnderRangedFire = this.nearbyEnemiesBuffer.some(e => 
      e.isRanged && this.getDistance(soldier.position, e.position) <= e.attackRange
    );
    
    // 진형 목표 위치 계산
    const formationTarget = this.calculateFormationTarget(soldier, squad);
    
    return {
      currentTime,
      deltaTime: 0, // 별도 전달
      squad,
      nearestEnemy,
      nearestEnemyDistance,
      nearbyAllies: [...this.nearbyAlliesBuffer],
      nearbyEnemies: [...this.nearbyEnemiesBuffer],
      isBeingFlanked,
      isUnderRangedFire,
      squadState: squad.state,
      formationTarget,
    };
  }
  
  /**
   * 이동 업데이트
   */
  private updateMovement(soldier: TWSoldier, context: AIContext, deltaTime: number): void {
    if (soldier.state === 'dead') return;
    if (soldier.state === 'fighting' && soldier.engagedWith) return; // 전투 중에는 이동 제한
    
    // Steering 합성
    const forces: Array<{ force: SteeringForce; weight: number }> = [];
    
    // 1. 목표로 이동 (Arrive)
    const arriveForce = this.steering.arrive(
      soldier.position,
      soldier.targetPosition,
      soldier.speed,
      this.config.arriveSlowingRadius
    );
    forces.push({ force: arriveForce, weight: 1.0 });
    
    // 2. 아군과 거리 유지 (Separation)
    const separationForce = this.steering.separation(
      soldier.position,
      context.nearbyAllies,
      this.config.separationRadius
    );
    forces.push({ force: separationForce, weight: 1.5 });
    
    // 3. 상태별 추가 행동
    switch (soldier.state) {
      case 'routing':
        // 도망: Flee 강화
        if (context.nearestEnemy) {
          const fleeForce = this.steering.flee(
            soldier.position,
            context.nearestEnemy.position,
            soldier.speed * 1.3,
            20
          );
          forces.push({ force: fleeForce, weight: 2.0 });
        }
        break;
        
      case 'pursuing':
        // 추격: Pursuit
        if (context.nearestEnemy) {
          const pursuitForce = this.steering.pursuit(
            soldier.position,
            context.nearestEnemy,
            soldier.speed * 1.1
          );
          forces.push({ force: pursuitForce, weight: 1.5 });
        }
        break;
        
      case 'charging':
        // 돌격: Seek 직선
        if (context.nearestEnemy) {
          const seekForce = this.steering.seek(
            soldier.position,
            context.nearestEnemy.position,
            soldier.speed * 1.5
          );
          forces.push({ force: seekForce, weight: 2.0 });
        }
        break;
    }
    
    // Steering 합성
    const combinedForce = this.steering.combine(forces, this.config.steeringMaxForce);
    
    // 속도 적용
    const dt = deltaTime / 1000; // ms → sec
    const speed = combinedForce.magnitude * dt;
    
    if (speed > 0.001) {
      // 위치 업데이트
      soldier.position.x += combinedForce.x * dt;
      soldier.position.z += combinedForce.z * dt;
      
      // 방향 업데이트
      if (combinedForce.magnitude > 0.1) {
        soldier.facing = Math.atan2(combinedForce.z, combinedForce.x);
      }
    }
  }
  
  /**
   * 경로 탐색 (장애물 회피)
   */
  findPath(soldier: TWSoldier, target: Vector2, obstacles: Obstacle[]): Vector2[] {
    this.metrics.pathfindingCalls++;
    this.pathBuffer = this.pathfinder.findPath(soldier.position, target, obstacles);
    return this.pathBuffer;
  }
  
  /**
   * 협공 판정
   */
  private checkFlanked(soldier: TWSoldier, enemies: TWSoldier[]): boolean {
    let frontCount = 0;
    let flankCount = 0;
    
    for (const enemy of enemies) {
      const dist = this.getDistance(soldier.position, enemy.position);
      if (dist > 5) continue;
      
      // 적이 바라보는 방향과 내 방향의 각도 차
      const attackAngle = Math.atan2(
        soldier.position.x - enemy.position.x,
        soldier.position.z - enemy.position.z
      );
      
      let angleDiff = Math.abs(attackAngle - soldier.facing);
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
   * 진형 목표 위치 계산
   */
  private calculateFormationTarget(soldier: TWSoldier, squad: TWSquad): Vector2 {
    // 부대의 현재 위치와 방향을 기준으로 진형 슬롯 위치 계산
    const spacing = squad.spacing;
    const halfWidth = (squad.width - 1) / 2;
    
    const localX = (soldier.formationSlot.col - halfWidth) * spacing;
    const localZ = -soldier.formationSlot.row * spacing;
    
    const cos = Math.cos(squad.facing);
    const sin = Math.sin(squad.facing);
    
    return {
      x: squad.position.x + localX * cos - localZ * sin,
      z: squad.position.z + localX * sin + localZ * cos,
    };
  }
  
  // ========================================
  // 유틸리티 메서드
  // ========================================
  
  private getDistance(a: Vector2, b: Vector2): number {
    const dx = b.x - a.x;
    const dz = b.z - a.z;
    return Math.sqrt(dx * dx + dz * dz);
  }
  
  /**
   * 성능 메트릭 조회
   */
  getMetrics(): typeof this.metrics {
    return { ...this.metrics };
  }
  
  /**
   * 메트릭 리셋
   */
  resetMetrics(): void {
    this.metrics = {
      updateCount: 0,
      stateTransitions: 0,
      pathfindingCalls: 0,
      cacheHits: 0,
      cacheMisses: 0,
    };
  }
  
  /**
   * 캐시 클리어
   */
  clearCache(): void {
    this.enemyCache.clear();
  }
  
  /**
   * 설정 업데이트
   */
  updateConfig(config: Partial<SoldierAIConfig>): void {
    this.config = { ...this.config, ...config };
    this.scheduler.setBatchSize(this.config.updateBatchSize);
  }
  
  /**
   * 장애물 캐시 업데이트 (동적 장애물용)
   */
  updateObstacles(obstacles: Obstacle[]): void {
    this.obstacleCache = obstacles;
  }
  
  /**
   * 특정 적 사망 시 캐시 무효화
   */
  onEnemyDeath(enemyId: string): void {
    this.enemyCache.invalidateEnemy(enemyId);
  }
}

// ========================================
// 헬퍼 함수
// ========================================

/**
 * 병사 배열에서 동적 장애물 생성
 */
export function soldiersToObstacles(soldiers: TWSoldier[], excludeTeam?: 'attacker' | 'defender'): Obstacle[] {
  return soldiers
    .filter(s => s.state !== 'dead' && (!excludeTeam || s.teamId !== excludeTeam))
    .map(s => ({
      position: { ...s.position },
      radius: 0.5,
      type: 'dynamic' as const,
    }));
}

/**
 * 진형 위치 계산 헬퍼
 */
export function calculateFormationPositions(
  center: Vector2,
  facing: number,
  width: number,
  depth: number,
  spacing: number
): Vector2[] {
  const positions: Vector2[] = [];
  const halfWidth = (width - 1) / 2;
  
  const cos = Math.cos(facing);
  const sin = Math.sin(facing);
  
  for (let row = 0; row < depth; row++) {
    for (let col = 0; col < width; col++) {
      const localX = (col - halfWidth) * spacing;
      const localZ = -row * spacing;
      
      positions.push({
        x: center.x + localX * cos - localZ * sin,
        z: center.z + localX * sin + localZ * cos,
      });
    }
  }
  
  return positions;
}

/**
 * 각도 정규화 (-PI ~ PI)
 */
export function normalizeAngle(angle: number): number {
  while (angle > Math.PI) angle -= 2 * Math.PI;
  while (angle < -Math.PI) angle += 2 * Math.PI;
  return angle;
}

/**
 * 두 각도 사이의 최단 차이
 */
export function angleDifference(a: number, b: number): number {
  let diff = normalizeAngle(a - b);
  return Math.abs(diff);
}

// 기본 내보내기
export default SoldierAI;






