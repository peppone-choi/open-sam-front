// @ts-nocheck
/**
 * SquadSync.ts
 * 부대 애니메이션 동기화 시스템
 * 
 * 역할:
 * - 부대 내 유닛들의 애니메이션 동기화
 * - 랜덤 오프셋으로 자연스러운 움직임
 * - 행진 동기화
 * - 공격 타이밍 분산
 * - 부대 전체 상태 관리
 */

import type { VoxelAnimationState } from '@/components/battle/units/db/VoxelUnitDefinitions';
import { AnimationController, type AnimationControllerConfig } from './AnimationController';

// ===== 타입 정의 =====

/** 유닛 동기화 정보 */
export interface UnitSyncInfo {
  unitId: string;
  controller: AnimationController;
  phaseOffset: number;       // 위상 오프셋 (0~1)
  speedVariation: number;    // 속도 변형 (0.9~1.1)
  rowIndex: number;          // 대열 행 위치
  columnIndex: number;       // 대열 열 위치
  syncGroup?: string;        // 동기화 그룹 (공격 등)
}

/** 부대 동기화 설정 */
export interface SquadSyncConfig {
  /** 위상 오프셋 범위 (기본 0.15 = ±15%) */
  phaseOffsetRange: number;
  /** 속도 변형 범위 (기본 0.05 = ±5%) */
  speedVariationRange: number;
  /** 행진 동기화 사용 여부 */
  marchSync: boolean;
  /** 공격 타이밍 분산 (ms) */
  attackSpreadTime: number;
  /** 대열 기반 오프셋 사용 */
  formationOffset: boolean;
  /** 대열당 오프셋 (기본 0.05) */
  rowOffsetAmount: number;
}

/** 부대 상태 */
export interface SquadState {
  currentState: VoxelAnimationState;
  isMoving: boolean;
  isCombat: boolean;
  isRetreating: boolean;
  formation: 'line' | 'column' | 'wedge' | 'square' | 'scattered';
  morale: number;  // 0~100
}

/** 부대 동기화 이벤트 */
export type SquadEventType = 
  | 'stateChange'      // 부대 상태 변경
  | 'attackSync'       // 공격 동기화
  | 'chargeStart'      // 돌격 시작
  | 'chargeEnd'        // 돌격 종료
  | 'retreatStart'     // 후퇴 시작
  | 'moraleChange';    // 사기 변화

export type SquadEventCallback = (event: SquadEventType, data?: unknown) => void;

// ===== 기본 설정 =====

const DEFAULT_SYNC_CONFIG: SquadSyncConfig = {
  phaseOffsetRange: 0.15,
  speedVariationRange: 0.05,
  marchSync: true,
  attackSpreadTime: 300,
  formationOffset: true,
  rowOffsetAmount: 0.05,
};

// ===== 유틸리티 함수 =====

/** 시드 기반 랜덤 생성 (결정론적) */
function seededRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 1103515245 + 12345) & 0x7fffffff;
    return state / 0x7fffffff;
  };
}

/** 범위 내 랜덤 값 */
function randomInRange(random: () => number, min: number, max: number): number {
  return min + random() * (max - min);
}

/** 해시 함수 (문자열 -> 숫자) */
function stringHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

// ===== 메인 부대 동기화 클래스 =====

export class SquadAnimationSync {
  private squadId: string;
  private config: SquadSyncConfig;
  private units: Map<string, UnitSyncInfo> = new Map();
  private state: SquadState;
  private eventListeners: Set<SquadEventCallback> = new Set();
  
  // 동기화 관련
  private syncTimer: number = 0;
  private attackQueue: string[] = [];
  private isProcessingAttacks: boolean = false;
  
  // 랜덤 생성기
  private random: () => number;
  
  constructor(squadId: string, config: Partial<SquadSyncConfig> = {}) {
    this.squadId = squadId;
    this.config = { ...DEFAULT_SYNC_CONFIG, ...config };
    
    // 부대 ID 기반 결정론적 랜덤
    this.random = seededRandom(stringHash(squadId));
    
    this.state = {
      currentState: 'idle',
      isMoving: false,
      isCombat: false,
      isRetreating: false,
      formation: 'line',
      morale: 100,
    };
  }
  
  // ===== 유닛 관리 =====
  
  /** 유닛 등록 */
  registerUnit(
    unitId: string, 
    controllerConfig: AnimationControllerConfig,
    position?: { row: number; column: number }
  ): AnimationController {
    // 결정론적 오프셋 계산
    const unitSeed = stringHash(unitId);
    const unitRandom = seededRandom(unitSeed);
    
    // 위상 오프셋
    let phaseOffset = randomInRange(
      unitRandom, 
      -this.config.phaseOffsetRange, 
      this.config.phaseOffsetRange
    );
    
    // 대열 기반 오프셋 추가
    if (this.config.formationOffset && position) {
      phaseOffset += position.row * this.config.rowOffsetAmount;
    }
    
    // 정규화
    phaseOffset = ((phaseOffset % 1) + 1) % 1;
    
    // 속도 변형
    const speedVariation = randomInRange(
      unitRandom,
      1 - this.config.speedVariationRange,
      1 + this.config.speedVariationRange
    );
    
    // 컨트롤러 생성 (오프셋 적용)
    const controller = new AnimationController({
      ...controllerConfig,
      randomOffset: phaseOffset,
      timeScale: speedVariation,
    });
    
    const syncInfo: UnitSyncInfo = {
      unitId,
      controller,
      phaseOffset,
      speedVariation,
      rowIndex: position?.row ?? 0,
      columnIndex: position?.column ?? 0,
    };
    
    this.units.set(unitId, syncInfo);
    
    // 현재 부대 상태 적용
    controller.play(this.state.currentState);
    
    return controller;
  }
  
  /** 유닛 제거 */
  unregisterUnit(unitId: string): void {
    const info = this.units.get(unitId);
    if (info) {
      info.controller.dispose();
      this.units.delete(unitId);
    }
  }
  
  /** 유닛 컨트롤러 가져오기 */
  getUnitController(unitId: string): AnimationController | undefined {
    return this.units.get(unitId)?.controller;
  }
  
  /** 모든 유닛 ID */
  getUnitIds(): string[] {
    return Array.from(this.units.keys());
  }
  
  /** 유닛 수 */
  get unitCount(): number {
    return this.units.size;
  }
  
  // ===== 부대 상태 관리 =====
  
  /** 부대 전체 애니메이션 상태 설정 */
  setSquadAnimation(state: VoxelAnimationState): void {
    if (this.state.currentState === state) return;
    
    const prevState = this.state.currentState;
    this.state.currentState = state;
    
    // 상태별 처리
    this.state.isMoving = state === 'walk' || state === 'run' || state === 'charge';
    this.state.isCombat = state === 'attack' || state === 'defend' || state === 'hit';
    this.state.isRetreating = false;
    
    // 모든 유닛에 적용 (행진 동기화 고려)
    if (this.config.marchSync && this.state.isMoving) {
      this.applyMarchSync(state);
    } else {
      for (const info of this.units.values()) {
        info.controller.play(state);
      }
    }
    
    // 이벤트 발생
    this.emitEvent('stateChange', { from: prevState, to: state });
  }
  
  /** 개별 유닛 상태 설정 */
  setUnitAnimation(unitId: string, state: VoxelAnimationState): void {
    const info = this.units.get(unitId);
    if (info) {
      info.controller.play(state);
    }
  }
  
  /** 행진 동기화 적용 */
  private applyMarchSync(state: VoxelAnimationState): void {
    const sortedUnits = this.getSortedByFormation();
    
    for (let i = 0; i < sortedUnits.length; i++) {
      const info = sortedUnits[i];
      
      // 대열 기반 시작 지연
      const delay = i * 50; // 50ms 간격
      
      setTimeout(() => {
        if (this.state.currentState === state) {
          info.controller.play(state);
        }
      }, delay);
    }
  }
  
  /** 공격 동기화 (분산) */
  queueAttack(unitId: string): void {
    if (!this.units.has(unitId)) return;
    
    this.attackQueue.push(unitId);
    
    if (!this.isProcessingAttacks) {
      this.processAttackQueue();
    }
  }
  
  /** 일제 공격 */
  triggerMassAttack(): void {
    const units = Array.from(this.units.keys());
    const spreadTime = this.config.attackSpreadTime;
    
    // 랜덤 순서로 분산
    const shuffled = this.shuffleArray([...units]);
    const delayPerUnit = spreadTime / (units.length || 1);
    
    shuffled.forEach((unitId, index) => {
      const delay = index * delayPerUnit + this.random() * delayPerUnit * 0.5;
      
      setTimeout(() => {
        this.setUnitAnimation(unitId, 'attack');
      }, delay);
    });
    
    this.emitEvent('attackSync');
  }
  
  /** 공격 큐 처리 */
  private processAttackQueue(): void {
    if (this.attackQueue.length === 0) {
      this.isProcessingAttacks = false;
      return;
    }
    
    this.isProcessingAttacks = true;
    
    const unitId = this.attackQueue.shift()!;
    const info = this.units.get(unitId);
    
    if (info) {
      info.controller.play('attack');
    }
    
    // 다음 공격 처리 (분산)
    const delay = 50 + this.random() * 100;
    setTimeout(() => this.processAttackQueue(), delay);
  }
  
  // ===== 돌격 =====
  
  /** 돌격 시작 */
  startCharge(): void {
    this.state.currentState = 'charge';
    this.state.isMoving = true;
    
    const sortedUnits = this.getSortedByFormation();
    
    // 앞열부터 돌격 시작
    for (let i = 0; i < sortedUnits.length; i++) {
      const info = sortedUnits[i];
      const delay = info.rowIndex * 100; // 열당 100ms 지연
      
      setTimeout(() => {
        if (this.state.currentState === 'charge') {
          info.controller.play('charge');
        }
      }, delay);
    }
    
    this.emitEvent('chargeStart');
  }
  
  /** 돌격 종료 */
  endCharge(): void {
    if (this.state.currentState !== 'charge') return;
    
    this.setSquadAnimation('idle');
    this.emitEvent('chargeEnd');
  }
  
  // ===== 후퇴 =====
  
  /** 후퇴 시작 */
  startRetreat(): void {
    this.state.isRetreating = true;
    
    const sortedUnits = this.getSortedByFormation().reverse(); // 뒤열부터
    
    for (let i = 0; i < sortedUnits.length; i++) {
      const info = sortedUnits[i];
      const delay = i * 80;
      
      setTimeout(() => {
        if (this.state.isRetreating) {
          // 후퇴 애니메이션 (뒤로 걷기)
          info.controller.play('walk');
          // 실제로는 방향을 바꿔야 하지만, 애니메이션만 처리
        }
      }, delay);
    }
    
    this.emitEvent('retreatStart');
  }
  
  // ===== 사기 =====
  
  /** 사기 설정 */
  setMorale(morale: number): void {
    const prev = this.state.morale;
    this.state.morale = Math.max(0, Math.min(100, morale));
    
    // 사기 저하 시 애니메이션 속도 조절
    if (this.state.morale < 30) {
      for (const info of this.units.values()) {
        info.controller.timeScale = info.speedVariation * 0.8;
      }
    } else if (this.state.morale > 70) {
      for (const info of this.units.values()) {
        info.controller.timeScale = info.speedVariation * 1.1;
      }
    } else {
      for (const info of this.units.values()) {
        info.controller.timeScale = info.speedVariation;
      }
    }
    
    if (prev !== this.state.morale) {
      this.emitEvent('moraleChange', { from: prev, to: this.state.morale });
    }
  }
  
  // ===== 대형 =====
  
  /** 대형 설정 */
  setFormation(formation: SquadState['formation']): void {
    this.state.formation = formation;
    
    // 대형에 따른 오프셋 재계산
    if (this.config.formationOffset) {
      this.recalculateOffsets();
    }
  }
  
  /** 오프셋 재계산 */
  private recalculateOffsets(): void {
    for (const info of this.units.values()) {
      let newOffset = info.phaseOffset;
      
      switch (this.state.formation) {
        case 'line':
          // 열 기반 오프셋
          newOffset = info.rowIndex * this.config.rowOffsetAmount;
          break;
        case 'column':
          // 행 기반 오프셋
          newOffset = info.columnIndex * this.config.rowOffsetAmount;
          break;
        case 'wedge':
          // 중앙에서 멀어질수록 지연
          newOffset = Math.abs(info.columnIndex) * this.config.rowOffsetAmount * 0.5;
          break;
        case 'square':
        case 'scattered':
          // 기본 랜덤 오프셋 유지
          break;
      }
      
      // 약간의 랜덤 추가
      newOffset += (this.random() - 0.5) * this.config.phaseOffsetRange * 0.5;
      newOffset = ((newOffset % 1) + 1) % 1;
    }
  }
  
  // ===== 업데이트 =====
  
  /** 전체 업데이트 */
  update(deltaTime: number): void {
    this.syncTimer += deltaTime;
    
    // 모든 유닛 컨트롤러 업데이트
    for (const info of this.units.values()) {
      info.controller.update(deltaTime);
    }
    
    // 주기적 동기화 체크 (1초마다)
    if (this.syncTimer >= 1000) {
      this.checkSync();
      this.syncTimer = 0;
    }
  }
  
  /** 동기화 체크 */
  private checkSync(): void {
    if (!this.config.marchSync || !this.state.isMoving) return;
    
    // 평균 진행률 계산
    let totalProgress = 0;
    let count = 0;
    
    for (const info of this.units.values()) {
      totalProgress += info.controller.progress;
      count++;
    }
    
    if (count === 0) return;
    
    const avgProgress = totalProgress / count;
    
    // 편차가 큰 유닛 보정
    for (const info of this.units.values()) {
      const diff = info.controller.progress - avgProgress;
      
      if (Math.abs(diff) > 0.3) {
        // 속도 조절로 보정
        info.controller.timeScale = diff > 0 
          ? info.speedVariation * 0.95 
          : info.speedVariation * 1.05;
      } else {
        info.controller.timeScale = info.speedVariation;
      }
    }
  }
  
  // ===== 이벤트 =====
  
  addEventListener(callback: SquadEventCallback): void {
    this.eventListeners.add(callback);
  }
  
  removeEventListener(callback: SquadEventCallback): void {
    this.eventListeners.delete(callback);
  }
  
  private emitEvent(event: SquadEventType, data?: unknown): void {
    for (const listener of this.eventListeners) {
      try {
        listener(event, data);
      } catch (e) {
        console.warn('[SquadSync] Event listener error:', e);
      }
    }
  }
  
  // ===== 유틸리티 =====
  
  /** 대형순 정렬 */
  private getSortedByFormation(): UnitSyncInfo[] {
    return Array.from(this.units.values()).sort((a, b) => {
      if (a.rowIndex !== b.rowIndex) {
        return a.rowIndex - b.rowIndex;
      }
      return a.columnIndex - b.columnIndex;
    });
  }
  
  /** 배열 섞기 */
  private shuffleArray<T>(array: T[]): T[] {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(this.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }
  
  // ===== 정리 =====
  
  dispose(): void {
    for (const info of this.units.values()) {
      info.controller.dispose();
    }
    this.units.clear();
    this.eventListeners.clear();
    this.attackQueue = [];
  }
  
  // ===== Getters =====
  
  get currentState(): VoxelAnimationState {
    return this.state.currentState;
  }
  
  get isMoving(): boolean {
    return this.state.isMoving;
  }
  
  get isCombat(): boolean {
    return this.state.isCombat;
  }
  
  get isRetreating(): boolean {
    return this.state.isRetreating;
  }
  
  get morale(): number {
    return this.state.morale;
  }
  
  get formation(): SquadState['formation'] {
    return this.state.formation;
  }
}

// ===== 팩토리 함수 =====

/** 부대 동기화 매니저 생성 */
export function createSquadSync(
  squadId: string, 
  config?: Partial<SquadSyncConfig>
): SquadAnimationSync {
  return new SquadAnimationSync(squadId, config);
}

// ===== 글로벌 부대 관리자 =====

export class SquadSyncManager {
  private squads: Map<string, SquadAnimationSync> = new Map();
  
  /** 부대 생성 또는 가져오기 */
  getOrCreateSquad(squadId: string, config?: Partial<SquadSyncConfig>): SquadAnimationSync {
    let squad = this.squads.get(squadId);
    
    if (!squad) {
      squad = new SquadAnimationSync(squadId, config);
      this.squads.set(squadId, squad);
    }
    
    return squad;
  }
  
  /** 부대 가져오기 */
  getSquad(squadId: string): SquadAnimationSync | undefined {
    return this.squads.get(squadId);
  }
  
  /** 부대 제거 */
  removeSquad(squadId: string): void {
    const squad = this.squads.get(squadId);
    if (squad) {
      squad.dispose();
      this.squads.delete(squadId);
    }
  }
  
  /** 전체 업데이트 */
  update(deltaTime: number): void {
    for (const squad of this.squads.values()) {
      squad.update(deltaTime);
    }
  }
  
  /** 전체 정리 */
  dispose(): void {
    for (const squad of this.squads.values()) {
      squad.dispose();
    }
    this.squads.clear();
  }
  
  /** 부대 수 */
  get squadCount(): number {
    return this.squads.size;
  }
  
  /** 전체 유닛 수 */
  get totalUnitCount(): number {
    let count = 0;
    for (const squad of this.squads.values()) {
      count += squad.unitCount;
    }
    return count;
  }
}

/** 싱글톤 매니저 */
let globalManager: SquadSyncManager | null = null;

export function getSquadSyncManager(): SquadSyncManager {
  if (!globalManager) {
    globalManager = new SquadSyncManager();
  }
  return globalManager;
}

export default SquadAnimationSync;





