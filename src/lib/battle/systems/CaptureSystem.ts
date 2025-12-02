/**
 * CaptureSystem.ts
 * 공성전 점령 시스템
 * 
 * 공격측이 성의 광장(중앙)을 점령하면 승리
 * 방어측이 시간까지 사수하면 승리
 */

import type { ControlPoint, VictoryCondition, VictoryConditionType } from '../adapters/CityTerrainMapping';

// ========================================
// 타입 정의
// ========================================

export type TeamId = 'attacker' | 'defender';

export interface CaptureUnit {
  id: string;
  teamId: TeamId;
  position: { x: number; y: number };
  isAlive: boolean;
}

export interface CaptureState {
  pointId: string;
  controlTeam: TeamId | 'neutral';
  progress: number;  // -100 (defender) ~ 0 (neutral) ~ 100 (attacker)
  unitsInZone: {
    attacker: number;
    defender: number;
  };
  captureStartTime?: number;
  isContested: boolean;
}

export interface VictoryState {
  winner: TeamId | null;
  condition: VictoryConditionType | null;
  throneHoldTime: number;  // 광장 점령 유지 시간
  elapsedTime: number;     // 전투 경과 시간
}

export interface CaptureSystemConfig {
  controlPoints: ControlPoint[];
  victoryConditions: VictoryCondition[];
  captureSpeed: number;     // 점령 속도 배율
  decaySpeed: number;       // 점령 해제 속도
}

// ========================================
// 점령 시스템 클래스
// ========================================

export class CaptureSystem {
  private controlPoints: Map<string, ControlPoint> = new Map();
  private captureStates: Map<string, CaptureState> = new Map();
  private victoryConditions: VictoryCondition[] = [];
  private victoryState: VictoryState;
  
  private captureSpeed: number;
  private decaySpeed: number;
  
  // 콜백
  public onPointCaptured?: (pointId: string, team: TeamId) => void;
  public onPointContested?: (pointId: string) => void;
  public onVictory?: (winner: TeamId, condition: VictoryConditionType) => void;
  
  constructor(config: CaptureSystemConfig) {
    this.captureSpeed = config.captureSpeed || 1.0;
    this.decaySpeed = config.decaySpeed || 0.5;
    this.victoryConditions = config.victoryConditions;
    
    // 점령 포인트 초기화
    for (const point of config.controlPoints) {
      this.controlPoints.set(point.id, { ...point });
      this.captureStates.set(point.id, {
        pointId: point.id,
        controlTeam: point.controlTeam,
        progress: point.controlTeam === 'defender' ? -100 : 
                  point.controlTeam === 'attacker' ? 100 : 0,
        unitsInZone: { attacker: 0, defender: 0 },
        isContested: false,
      });
    }
    
    // 승리 상태 초기화
    this.victoryState = {
      winner: null,
      condition: null,
      throneHoldTime: 0,
      elapsedTime: 0,
    };
  }
  
  // ========================================
  // 업데이트
  // ========================================
  
  /**
   * 매 프레임 업데이트
   * @param deltaTime 델타 타임 (초)
   * @param units 현재 유닛 목록
   */
  update(deltaTime: number, units: CaptureUnit[]): VictoryState {
    this.victoryState.elapsedTime += deltaTime;
    
    // 각 점령 포인트 업데이트
    for (const [pointId, state] of this.captureStates) {
      const point = this.controlPoints.get(pointId)!;
      
      // 영역 내 유닛 계산
      const unitsInZone = this.countUnitsInZone(point, units);
      state.unitsInZone = unitsInZone;
      
      // 점령 진행도 업데이트
      this.updateCaptureProgress(state, point, unitsInZone, deltaTime);
      
      // 점령 완료 체크
      this.checkCaptureComplete(state, point);
    }
    
    // 승리 조건 체크
    this.checkVictoryConditions(units);
    
    return this.victoryState;
  }
  
  /**
   * 영역 내 유닛 수 계산
   */
  private countUnitsInZone(
    point: ControlPoint, 
    units: CaptureUnit[]
  ): { attacker: number; defender: number } {
    const result = { attacker: 0, defender: 0 };
    
    for (const unit of units) {
      if (!unit.isAlive) continue;
      
      const dist = this.distance(unit.position, point.position);
      if (dist <= point.radius) {
        result[unit.teamId]++;
      }
    }
    
    return result;
  }
  
  /**
   * 점령 진행도 업데이트
   */
  private updateCaptureProgress(
    state: CaptureState,
    point: ControlPoint,
    unitsInZone: { attacker: number; defender: number },
    deltaTime: number
  ): void {
    const { attacker, defender } = unitsInZone;
    
    // 양측 모두 있으면 분쟁 중
    if (attacker > 0 && defender > 0) {
      state.isContested = true;
      this.onPointContested?.(point.id);
      
      // 병력 차이에 따라 점령
      const diff = attacker - defender;
      const rate = Math.sign(diff) * Math.min(Math.abs(diff), 10) * this.captureSpeed;
      state.progress += rate * deltaTime;
    }
    // 공격측만 있음
    else if (attacker > 0) {
      state.isContested = false;
      const rate = Math.min(attacker, 10) * this.captureSpeed;
      state.progress += rate * deltaTime;
      
      // 점령 시작 시간 기록
      if (state.progress > 0 && !state.captureStartTime) {
        state.captureStartTime = Date.now();
      }
    }
    // 방어측만 있음
    else if (defender > 0) {
      state.isContested = false;
      const rate = Math.min(defender, 10) * this.captureSpeed;
      state.progress -= rate * deltaTime;
      state.captureStartTime = undefined;
    }
    // 아무도 없음 - 서서히 중립으로
    else {
      state.isContested = false;
      if (state.progress > 0) {
        state.progress -= this.decaySpeed * deltaTime;
        if (state.progress < 0) state.progress = 0;
      } else if (state.progress < 0) {
        state.progress += this.decaySpeed * deltaTime;
        if (state.progress > 0) state.progress = 0;
      }
      state.captureStartTime = undefined;
    }
    
    // 범위 제한
    state.progress = Math.max(-100, Math.min(100, state.progress));
  }
  
  /**
   * 점령 완료 체크
   */
  private checkCaptureComplete(state: CaptureState, point: ControlPoint): void {
    const prevTeam = state.controlTeam;
    
    // 점령 완료 판정
    if (state.progress >= 100) {
      state.controlTeam = 'attacker';
      state.progress = 100;
    } else if (state.progress <= -100) {
      state.controlTeam = 'defender';
      state.progress = -100;
    } else if (Math.abs(state.progress) < 10) {
      state.controlTeam = 'neutral';
    }
    
    // 점령 변경 이벤트
    if (prevTeam !== state.controlTeam && state.controlTeam !== 'neutral') {
      console.log(`🏴 ${point.name} 점령: ${state.controlTeam}`);
      this.onPointCaptured?.(point.id, state.controlTeam);
    }
  }
  
  // ========================================
  // 승리 조건 체크
  // ========================================
  
  /**
   * 승리 조건 체크
   */
  private checkVictoryConditions(units: CaptureUnit[]): void {
    if (this.victoryState.winner) return;
    
    for (const condition of this.victoryConditions) {
      const result = this.checkCondition(condition, units);
      if (result) {
        this.victoryState.winner = result;
        this.victoryState.condition = condition.type;
        console.log(`🏆 승리: ${result} (${condition.type})`);
        this.onVictory?.(result, condition.type);
        return;
      }
    }
  }
  
  /**
   * 개별 승리 조건 체크
   */
  private checkCondition(condition: VictoryCondition, units: CaptureUnit[]): TeamId | null {
    switch (condition.type) {
      case 'capture_throne':
        return this.checkThroneCapture(condition);
        
      case 'annihilation':
        return this.checkAnnihilation(units, condition.percentage || 90);
        
      case 'morale_collapse':
        // 사기 시스템 연동 필요
        return null;
        
      case 'time_limit':
        return this.checkTimeLimit(condition.duration || 600);
        
      case 'general_killed':
        // 장수 시스템 연동 필요
        return null;
        
      default:
        return null;
    }
  }
  
  /**
   * 광장 점령 승리 조건
   */
  private checkThroneCapture(condition: VictoryCondition): TeamId | null {
    const throneState = this.captureStates.get('throne');
    if (!throneState) return null;
    
    // 공격측이 완전 점령하고 유지 시간 경과
    if (throneState.controlTeam === 'attacker' && throneState.progress >= 100) {
      if (throneState.captureStartTime) {
        const holdTime = (Date.now() - throneState.captureStartTime) / 1000;
        this.victoryState.throneHoldTime = holdTime;
        
        if (holdTime >= (condition.duration || 60)) {
          return 'attacker';
        }
      }
    } else {
      this.victoryState.throneHoldTime = 0;
    }
    
    return null;
  }
  
  /**
   * 전멸 승리 조건
   */
  private checkAnnihilation(units: CaptureUnit[], percentage: number): TeamId | null {
    const alive = { attacker: 0, defender: 0 };
    const total = { attacker: 0, defender: 0 };
    
    for (const unit of units) {
      total[unit.teamId]++;
      if (unit.isAlive) {
        alive[unit.teamId]++;
      }
    }
    
    // 한쪽이 percentage% 이상 손실
    if (total.attacker > 0) {
      const attackerLoss = ((total.attacker - alive.attacker) / total.attacker) * 100;
      if (attackerLoss >= percentage) {
        return 'defender';
      }
    }
    
    if (total.defender > 0) {
      const defenderLoss = ((total.defender - alive.defender) / total.defender) * 100;
      if (defenderLoss >= percentage) {
        return 'attacker';
      }
    }
    
    return null;
  }
  
  /**
   * 시간 제한 승리 조건 (방어측 승리)
   */
  private checkTimeLimit(duration: number): TeamId | null {
    if (this.victoryState.elapsedTime >= duration) {
      // 광장이 아직 방어측 것이면 방어측 승리
      const throneState = this.captureStates.get('throne');
      if (throneState && throneState.controlTeam !== 'attacker') {
        return 'defender';
      }
    }
    return null;
  }
  
  // ========================================
  // 유틸리티
  // ========================================
  
  private distance(a: { x: number; y: number }, b: { x: number; y: number }): number {
    return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));
  }
  
  // ========================================
  // 쿼리 API
  // ========================================
  
  /**
   * 점령 포인트 상태 조회
   */
  getControlPointState(pointId: string): CaptureState | undefined {
    return this.captureStates.get(pointId);
  }
  
  /**
   * 모든 점령 포인트 상태 조회
   */
  getAllControlPointStates(): CaptureState[] {
    return Array.from(this.captureStates.values());
  }
  
  /**
   * 승리 상태 조회
   */
  getVictoryState(): VictoryState {
    return { ...this.victoryState };
  }
  
  /**
   * 특정 팀이 점령한 포인트 수
   */
  getControlledPointCount(team: TeamId): number {
    let count = 0;
    for (const state of this.captureStates.values()) {
      if (state.controlTeam === team) count++;
    }
    return count;
  }
  
  /**
   * 광장 점령 진행도 (UI용)
   */
  getThroneProgress(): { progress: number; holdTime: number; requiredTime: number } {
    const throneState = this.captureStates.get('throne');
    const throneCondition = this.victoryConditions.find(c => c.type === 'capture_throne');
    
    return {
      progress: throneState?.progress || 0,
      holdTime: this.victoryState.throneHoldTime,
      requiredTime: throneCondition?.duration || 60,
    };
  }
  
  /**
   * 리셋
   */
  reset(): void {
    for (const [pointId, point] of this.controlPoints) {
      this.captureStates.set(pointId, {
        pointId,
        controlTeam: point.controlTeam,
        progress: point.controlTeam === 'defender' ? -100 : 
                  point.controlTeam === 'attacker' ? 100 : 0,
        unitsInZone: { attacker: 0, defender: 0 },
        isContested: false,
      });
    }
    
    this.victoryState = {
      winner: null,
      condition: null,
      throneHoldTime: 0,
      elapsedTime: 0,
    };
  }
}

// ========================================
// 팩토리 함수
// ========================================

/**
 * 점령 시스템 생성
 */
export function createCaptureSystem(config: CaptureSystemConfig): CaptureSystem {
  return new CaptureSystem(config);
}

export default CaptureSystem;





