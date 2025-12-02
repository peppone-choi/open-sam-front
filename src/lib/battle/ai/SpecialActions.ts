/**
 * SpecialActions.ts
 * 특수 행동 시스템
 * 
 * 핵심 기능:
 * 1. 돌격 (Charge) - 가속 구간, 충돌 데미지
 * 2. 측면 공격 (Flank) - 우회 경로, 타이밍 조절
 * 3. 카이팅 (Kiting) - 사격 → 이동 반복
 * 4. 포위 (Surround) - 다방향 공격
 * 5. 방어 진형 (Defensive Formation) - 방진 전환
 */

import type { TWSquad, Vector2 } from '../TotalWarEngine';

// ========================================
// 특수 행동 타입
// ========================================

/** 특수 행동 타입 */
export type SpecialActionType = 
  | 'charge'              // 돌격
  | 'flank_left'          // 좌측면 우회
  | 'flank_right'         // 우측면 우회
  | 'rear_attack'         // 후방 공격
  | 'kite'                // 카이팅 (사격 후 후퇴)
  | 'surround'            // 포위
  | 'defensive_formation' // 방어 진형
  | 'skirmish'            // 산개/교란
  | 'regroup'             // 재집결
  | 'hold_position';      // 위치 고수

/** 특수 행동 실행 결과 */
export interface SpecialActionResult {
  /** 행동 완료 여부 */
  completed: boolean;
  /** 행동 실패 여부 */
  failed: boolean;
  /** 목표 위치 */
  targetPosition?: Vector2;
  /** 목표 방향 */
  targetFacing?: number;
  /** 권장 진형 */
  recommendedFormation?: string;
  /** 속도 배율 */
  speedMultiplier?: number;
  /** 공격력 배율 */
  attackMultiplier?: number;
  /** 메시지 */
  message?: string;
}

/** 특수 행동 상태 */
export interface SpecialActionState {
  type: SpecialActionType;
  phase: 'preparing' | 'executing' | 'completing' | 'done' | 'failed';
  startTime: number;
  progress: number;
  targetPosition?: Vector2;
  waypoints?: Vector2[];
  currentWaypoint?: number;
  metadata?: Record<string, unknown>;
}

// ========================================
// 행동별 설정
// ========================================

/** 돌격 설정 */
export const CHARGE_CONFIG = {
  /** 최소 돌격 거리 */
  minDistance: 8,
  /** 최대 돌격 거리 */
  maxDistance: 25,
  /** 가속 시간 (ms) */
  accelerationTime: 1500,
  /** 최대 속도 배율 */
  maxSpeedMultiplier: 1.8,
  /** 충돌 데미지 배율 */
  impactDamageMultiplier: 2.0,
  /** 충돌 사기 피해 */
  impactMoraleDamage: 15,
  /** 돌격 후 쿨다운 (ms) */
  cooldown: 5000,
  /** 최적 충돌 거리 */
  impactDistance: 3,
};

/** 측면 공격 설정 */
export const FLANK_CONFIG = {
  /** 우회 반경 */
  flanksRadius: 15,
  /** 우회 시간 (ms) */
  approachTime: 8000,
  /** 안전 거리 (적 전면에서) */
  safeDistance: 20,
  /** 측면 공격 데미지 배율 */
  flankDamageMultiplier: 1.3,
  /** 후방 공격 데미지 배율 */
  rearDamageMultiplier: 1.5,
  /** 사기 피해 배율 */
  moraleDamageMultiplier: 1.5,
};

/** 카이팅 설정 */
export const KITE_CONFIG = {
  /** 최적 사거리 비율 */
  optimalRangeRatio: 0.7,
  /** 사격 시간 (ms) */
  fireTime: 2000,
  /** 이동 시간 (ms) */
  moveTime: 1500,
  /** 최소 안전 거리 */
  minSafeDistance: 10,
  /** 후퇴 거리 */
  retreatDistance: 8,
};

/** 포위 설정 */
export const SURROUND_CONFIG = {
  /** 포위 반경 */
  surroundRadius: 8,
  /** 포위에 필요한 최소 부대 수 */
  minSquads: 3,
  /** 포위 각도 간격 */
  angleSpacing: Math.PI / 3, // 60도
  /** 포위 완성 시간 (ms) */
  formationTime: 4000,
};

// ========================================
// 특수 행동 실행기
// ========================================

/**
 * 돌격 실행
 */
function executeCharge(
  squad: TWSquad,
  target: TWSquad | null,
  elapsedTime: number,
  state: SpecialActionState
): SpecialActionResult {
  if (!target) {
    return { completed: false, failed: true, message: '타겟 없음' };
  }
  
  const distance = getDistance(squad.position, target.position);
  
  // Phase 1: 준비 (방향 정렬)
  if (state.phase === 'preparing') {
    const targetFacing = Math.atan2(
      target.position.z - squad.position.z,
      target.position.x - squad.position.x
    );
    
    if (elapsedTime > 500) {
      state.phase = 'executing';
    }
    
    return {
      completed: false,
      failed: false,
      targetFacing,
      recommendedFormation: 'wedge',
      speedMultiplier: 0.5,
      message: '돌격 준비',
    };
  }
  
  // Phase 2: 가속 및 돌진
  if (state.phase === 'executing') {
    const accelerationProgress = Math.min(1, elapsedTime / CHARGE_CONFIG.accelerationTime);
    const speedMult = 1 + (CHARGE_CONFIG.maxSpeedMultiplier - 1) * accelerationProgress;
    
    // 충돌 체크
    if (distance <= CHARGE_CONFIG.impactDistance) {
      state.phase = 'completing';
      return {
        completed: false,
        failed: false,
        targetPosition: { ...target.position },
        speedMultiplier: speedMult,
        attackMultiplier: CHARGE_CONFIG.impactDamageMultiplier,
        message: '돌격 충돌!',
      };
    }
    
    // 거리가 너무 멀어졌으면 실패
    if (distance > CHARGE_CONFIG.maxDistance * 1.5) {
      return { completed: false, failed: true, message: '타겟 이탈' };
    }
    
    return {
      completed: false,
      failed: false,
      targetPosition: { ...target.position },
      speedMultiplier: speedMult,
      attackMultiplier: 1 + accelerationProgress * 0.5,
      message: `돌격 가속 ${Math.round(accelerationProgress * 100)}%`,
    };
  }
  
  // Phase 3: 완료
  if (state.phase === 'completing') {
    state.phase = 'done';
    return {
      completed: true,
      failed: false,
      attackMultiplier: CHARGE_CONFIG.impactDamageMultiplier,
      message: '돌격 완료',
    };
  }
  
  return { completed: true, failed: false };
}

/**
 * 측면 공격 실행
 */
function executeFlank(
  squad: TWSquad,
  target: TWSquad | null,
  elapsedTime: number,
  state: SpecialActionState,
  direction: 'left' | 'right'
): SpecialActionResult {
  if (!target) {
    return { completed: false, failed: true, message: '타겟 없음' };
  }
  
  // 웨이포인트 초기화
  if (!state.waypoints || state.waypoints.length === 0) {
    state.waypoints = calculateFlankWaypoints(squad.position, target, direction);
    state.currentWaypoint = 0;
  }
  
  const currentWp = state.currentWaypoint || 0;
  const waypoints = state.waypoints;
  
  if (currentWp >= waypoints.length) {
    return { completed: true, failed: false, message: '측면 공격 완료' };
  }
  
  const targetPos = waypoints[currentWp];
  const distToWp = getDistance(squad.position, targetPos);
  
  // 웨이포인트 도달 체크
  if (distToWp < 2) {
    state.currentWaypoint = currentWp + 1;
    
    // 마지막 웨이포인트 = 공격 개시
    if (state.currentWaypoint >= waypoints.length) {
      return {
        completed: true,
        failed: false,
        targetPosition: { ...target.position },
        attackMultiplier: direction === 'left' || direction === 'right' 
          ? FLANK_CONFIG.flankDamageMultiplier 
          : FLANK_CONFIG.rearDamageMultiplier,
        message: '측면 공격 개시!',
      };
    }
  }
  
  // 진행률
  const progress = elapsedTime / FLANK_CONFIG.approachTime;
  
  return {
    completed: false,
    failed: false,
    targetPosition: targetPos,
    speedMultiplier: 1.1,
    message: `측면 우회 ${Math.round(progress * 100)}%`,
  };
}

/**
 * 측면 공격 웨이포인트 계산
 */
function calculateFlankWaypoints(
  start: Vector2,
  target: TWSquad,
  direction: 'left' | 'right'
): Vector2[] {
  const waypoints: Vector2[] = [];
  
  // 적의 facing 기준으로 측면 위치 계산
  const sideAngle = target.facing + (direction === 'left' ? Math.PI / 2 : -Math.PI / 2);
  const rearAngle = target.facing + Math.PI;
  
  // 중간 지점 (측면으로 우회)
  const midPoint: Vector2 = {
    x: target.position.x + Math.cos(sideAngle) * FLANK_CONFIG.flanksRadius,
    z: target.position.z + Math.sin(sideAngle) * FLANK_CONFIG.flanksRadius,
  };
  waypoints.push(midPoint);
  
  // 최종 공격 위치 (측면-후방 사이)
  const attackAngle = sideAngle + (direction === 'left' ? Math.PI / 4 : -Math.PI / 4);
  const attackPoint: Vector2 = {
    x: target.position.x + Math.cos(attackAngle) * 5,
    z: target.position.z + Math.sin(attackAngle) * 5,
  };
  waypoints.push(attackPoint);
  
  return waypoints;
}

/**
 * 카이팅 실행
 */
function executeKite(
  squad: TWSquad,
  target: TWSquad | null,
  elapsedTime: number,
  state: SpecialActionState
): SpecialActionResult {
  if (!target) {
    return { completed: false, failed: true, message: '타겟 없음' };
  }
  
  if (!squad.isRanged) {
    return { completed: false, failed: true, message: '원거리 유닛만 가능' };
  }
  
  const distance = getDistance(squad.position, target.position);
  const cycleTime = KITE_CONFIG.fireTime + KITE_CONFIG.moveTime;
  const cycleProgress = (elapsedTime % cycleTime) / cycleTime;
  
  // 사격 페이즈
  if (cycleProgress < KITE_CONFIG.fireTime / cycleTime) {
    // 적이 너무 가까우면 무조건 후퇴
    if (distance < KITE_CONFIG.minSafeDistance) {
      const retreatAngle = Math.atan2(
        squad.position.z - target.position.z,
        squad.position.x - target.position.x
      );
      return {
        completed: false,
        failed: false,
        targetPosition: {
          x: squad.position.x + Math.cos(retreatAngle) * KITE_CONFIG.retreatDistance,
          z: squad.position.z + Math.sin(retreatAngle) * KITE_CONFIG.retreatDistance,
        },
        speedMultiplier: 1.2,
        message: '긴급 후퇴',
      };
    }
    
    // 제자리에서 사격
    return {
      completed: false,
      failed: false,
      targetPosition: { ...squad.position },
      speedMultiplier: 0,
      message: '사격 중',
    };
  }
  
  // 이동 페이즈 - 적정 거리 유지하며 후퇴
  const optimalRange = 35 * KITE_CONFIG.optimalRangeRatio; // TODO: 실제 사거리 사용
  
  let targetPos: Vector2;
  if (distance < optimalRange * 0.8) {
    // 후퇴
    const retreatAngle = Math.atan2(
      squad.position.z - target.position.z,
      squad.position.x - target.position.x
    );
    targetPos = {
      x: squad.position.x + Math.cos(retreatAngle) * KITE_CONFIG.retreatDistance,
      z: squad.position.z + Math.sin(retreatAngle) * KITE_CONFIG.retreatDistance,
    };
  } else {
    // 현재 위치 유지
    targetPos = { ...squad.position };
  }
  
  return {
    completed: false,
    failed: false,
    targetPosition: targetPos,
    speedMultiplier: 1.0,
    message: '재배치 중',
  };
}

/**
 * 포위 실행
 */
function executeSurround(
  squad: TWSquad,
  target: TWSquad | null,
  elapsedTime: number,
  state: SpecialActionState
): SpecialActionResult {
  if (!target) {
    return { completed: false, failed: true, message: '타겟 없음' };
  }
  
  // 포위 위치 계산 (간단히 랜덤 각도 배치)
  if (!state.metadata?.surroundAngle) {
    state.metadata = { surroundAngle: Math.random() * Math.PI * 2 };
  }
  
  const angle = state.metadata.surroundAngle as number;
  const targetPos: Vector2 = {
    x: target.position.x + Math.cos(angle) * SURROUND_CONFIG.surroundRadius,
    z: target.position.z + Math.sin(angle) * SURROUND_CONFIG.surroundRadius,
  };
  
  const distToPos = getDistance(squad.position, targetPos);
  
  // 포위 위치 도달
  if (distToPos < 3) {
    return {
      completed: true,
      failed: false,
      targetPosition: { ...target.position },
      attackMultiplier: 1.2,
      message: '포위 완료, 공격 개시',
    };
  }
  
  const progress = elapsedTime / SURROUND_CONFIG.formationTime;
  
  return {
    completed: false,
    failed: false,
    targetPosition: targetPos,
    speedMultiplier: 1.0,
    message: `포위 진행 ${Math.round(progress * 100)}%`,
  };
}

/**
 * 방어 진형 전환
 */
function executeDefensiveFormation(
  squad: TWSquad,
  elapsedTime: number,
  state: SpecialActionState
): SpecialActionResult {
  // 즉시 방어 진형으로 전환
  if (elapsedTime > 500) {
    return {
      completed: true,
      failed: false,
      targetPosition: { ...squad.position },
      recommendedFormation: 'square',
      speedMultiplier: 0.7,
      message: '방진 완료',
    };
  }
  
  return {
    completed: false,
    failed: false,
    targetPosition: { ...squad.position },
    recommendedFormation: 'square',
    speedMultiplier: 0.5,
    message: '방진 전환 중',
  };
}

// ========================================
// 유틸리티
// ========================================

function getDistance(a: Vector2, b: Vector2): number {
  const dx = b.x - a.x;
  const dz = b.z - a.z;
  return Math.sqrt(dx * dx + dz * dz);
}

// ========================================
// 특수 행동 매니저
// ========================================

export class SpecialActionManager {
  private activeActions: Map<string, SpecialActionState> = new Map();
  private cooldowns: Map<string, Map<SpecialActionType, number>> = new Map();
  
  constructor() {}
  
  /**
   * 특수 행동 실행
   */
  executeAction(
    actionType: SpecialActionType,
    squad: TWSquad,
    target: TWSquad | null,
    elapsedTime: number
  ): SpecialActionResult {
    // 상태 가져오기 또는 생성
    let state = this.activeActions.get(squad.id);
    if (!state || state.type !== actionType) {
      state = {
        type: actionType,
        phase: 'preparing',
        startTime: Date.now(),
        progress: 0,
      };
      this.activeActions.set(squad.id, state);
    }
    
    // 행동별 실행
    let result: SpecialActionResult;
    
    switch (actionType) {
      case 'charge':
        result = executeCharge(squad, target, elapsedTime, state);
        break;
        
      case 'flank_left':
        result = executeFlank(squad, target, elapsedTime, state, 'left');
        break;
        
      case 'flank_right':
        result = executeFlank(squad, target, elapsedTime, state, 'right');
        break;
        
      case 'rear_attack':
        result = executeFlank(squad, target, elapsedTime, state, 'right'); // 후방 = 우회 후 후방
        break;
        
      case 'kite':
        result = executeKite(squad, target, elapsedTime, state);
        break;
        
      case 'surround':
        result = executeSurround(squad, target, elapsedTime, state);
        break;
        
      case 'defensive_formation':
        result = executeDefensiveFormation(squad, elapsedTime, state);
        break;
        
      case 'hold_position':
        result = {
          completed: false,
          failed: false,
          targetPosition: { ...squad.position },
          speedMultiplier: 0,
          message: '위치 고수',
        };
        break;
        
      case 'regroup':
        result = {
          completed: elapsedTime > 3000,
          failed: false,
          recommendedFormation: 'line',
          message: '재집결 중',
        };
        break;
        
      case 'skirmish':
        result = {
          completed: false,
          failed: false,
          recommendedFormation: 'loose',
          speedMultiplier: 1.1,
          message: '산개 기동',
        };
        break;
        
      default:
        result = { completed: false, failed: true, message: '알 수 없는 행동' };
    }
    
    // 완료 또는 실패 시 상태 정리
    if (result.completed || result.failed) {
      this.activeActions.delete(squad.id);
      
      // 쿨다운 설정
      if (result.completed && actionType === 'charge') {
        this.setCooldown(squad.id, 'charge', CHARGE_CONFIG.cooldown);
      }
    }
    
    return result;
  }
  
  /**
   * 쿨다운 설정
   */
  private setCooldown(squadId: string, action: SpecialActionType, duration: number): void {
    if (!this.cooldowns.has(squadId)) {
      this.cooldowns.set(squadId, new Map());
    }
    this.cooldowns.get(squadId)!.set(action, Date.now() + duration);
  }
  
  /**
   * 쿨다운 체크
   */
  isOnCooldown(squadId: string, action: SpecialActionType): boolean {
    const squadCooldowns = this.cooldowns.get(squadId);
    if (!squadCooldowns) return false;
    
    const cooldownEnd = squadCooldowns.get(action);
    if (!cooldownEnd) return false;
    
    return Date.now() < cooldownEnd;
  }
  
  /**
   * 남은 쿨다운 시간
   */
  getRemainingCooldown(squadId: string, action: SpecialActionType): number {
    const squadCooldowns = this.cooldowns.get(squadId);
    if (!squadCooldowns) return 0;
    
    const cooldownEnd = squadCooldowns.get(action);
    if (!cooldownEnd) return 0;
    
    return Math.max(0, cooldownEnd - Date.now());
  }
  
  /**
   * 행동 취소
   */
  cancelAction(squadId: string): void {
    this.activeActions.delete(squadId);
  }
  
  /**
   * 현재 활성 행동 조회
   */
  getActiveAction(squadId: string): SpecialActionType | null {
    return this.activeActions.get(squadId)?.type || null;
  }
  
  /**
   * 행동 가능 여부 체크
   */
  canExecuteAction(squadId: string, action: SpecialActionType, squad: TWSquad): boolean {
    // 쿨다운 체크
    if (this.isOnCooldown(squadId, action)) return false;
    
    // 이미 다른 행동 중인지 체크
    const currentAction = this.activeActions.get(squadId);
    if (currentAction && currentAction.type !== action) return false;
    
    // 행동별 조건 체크
    switch (action) {
      case 'charge':
        // 기병만 돌격 가능
        return ['cavalry', 'shock_cavalry', 'chariot'].includes(squad.category);
        
      case 'kite':
        // 원거리만 카이팅 가능
        return squad.isRanged;
        
      case 'defensive_formation':
        // 보병만 방어 진형 가능
        return !squad.isRanged && !['cavalry', 'shock_cavalry', 'chariot'].includes(squad.category);
        
      default:
        return true;
    }
  }
  
  /**
   * 모든 행동 초기화
   */
  reset(): void {
    this.activeActions.clear();
    this.cooldowns.clear();
  }
}

// ========================================
// Export
// ========================================

export default SpecialActionManager;





