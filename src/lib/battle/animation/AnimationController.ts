// @ts-nocheck
/**
 * AnimationController.ts
 * 복셀 유닛 애니메이션의 메인 컨트롤러
 * 
 * 역할:
 * - 유닛별 애니메이션 상태 관리
 * - 시간 기반 애니메이션 진행
 * - 키프레임 보간 및 변환 계산
 */

import type { Group, Object3D } from 'three';
import {
  VOXEL_ANIMATIONS,
  WEAPON_ATTACK_ANIMATIONS,
  WEAPON_ATTACK_TYPE_MAP,
  CATEGORY_ATTACK_ANIMATIONS,
  type VoxelUnitSpec,
  type VoxelAnimationState,
  type VoxelAnimationSequence,
  type VoxelAnimationKeyframe,
} from '@/components/battle/units/db/VoxelUnitDefinitions';

// ===== 타입 정의 =====

/** 파츠별 변환 값 */
export interface PartTransform {
  rotX?: number;
  rotY?: number;
  rotZ?: number;
  posX?: number;
  posY?: number;
  posZ?: number;
}

/** 전체 파츠 변환 맵 */
export type PartsTransformMap = Record<string, PartTransform>;

/** 애니메이션 이벤트 타입 */
export type AnimationEventType = 
  | 'start'      // 애니메이션 시작
  | 'loop'       // 루프 반복
  | 'complete'   // 완료 (비루프)
  | 'interrupt'; // 인터럽트

/** 애니메이션 이벤트 콜백 */
export type AnimationEventCallback = (
  event: AnimationEventType,
  state: VoxelAnimationState,
  progress: number
) => void;

/** 애니메이션 컨트롤러 설정 */
export interface AnimationControllerConfig {
  category: VoxelUnitSpec['category'];
  weaponType?: VoxelUnitSpec['weapon']['type'];
  unitId?: number;
  initialState?: VoxelAnimationState;
  timeScale?: number; // 애니메이션 속도 배율 (기본 1.0)
  randomOffset?: number; // 부대 동기화용 랜덤 오프셋 (0~1)
}

/** 애니메이션 컨트롤러 인터페이스 */
export interface IAnimationController {
  // 상태
  readonly currentState: VoxelAnimationState;
  readonly previousState: VoxelAnimationState | null;
  readonly progress: number;
  readonly isPlaying: boolean;
  readonly isBlending: boolean;
  
  // 설정
  timeScale: number;
  
  // 메서드
  play(state: VoxelAnimationState, options?: PlayOptions): void;
  stop(): void;
  pause(): void;
  resume(): void;
  update(deltaTime: number): void;
  
  // 변환 정보
  getTransforms(): PartsTransformMap;
  getColorOverlay(): string | undefined;
  getScale(): number;
  
  // 이벤트
  addEventListener(callback: AnimationEventCallback): void;
  removeEventListener(callback: AnimationEventCallback): void;
  
  // 유틸리티
  dispose(): void;
}

/** 재생 옵션 */
export interface PlayOptions {
  /** 즉시 전환 (블렌딩 없이) */
  immediate?: boolean;
  /** 블렌딩 시간 (ms) */
  blendTime?: number;
  /** 시작 진행률 (0~1) */
  startProgress?: number;
  /** 재생 속도 배율 */
  speed?: number;
}

// ===== 유틸리티 함수 =====

/** 두 변환 값 사이를 보간 */
function interpolateValue(a: number | undefined, b: number | undefined, t: number): number {
  const valA = a ?? 0;
  const valB = b ?? 0;
  return valA + (valB - valA) * t;
}

/** 두 파츠 변환 사이를 보간 */
function interpolatePartTransform(
  a: PartTransform | undefined,
  b: PartTransform | undefined,
  t: number
): PartTransform {
  if (!a && !b) return {};
  
  const partA = a ?? {};
  const partB = b ?? {};
  
  return {
    rotX: interpolateValue(partA.rotX, partB.rotX, t),
    rotY: interpolateValue(partA.rotY, partB.rotY, t),
    rotZ: interpolateValue(partA.rotZ, partB.rotZ, t),
    posX: interpolateValue(partA.posX, partB.posX, t),
    posY: interpolateValue(partA.posY, partB.posY, t),
    posZ: interpolateValue(partA.posZ, partB.posZ, t),
  };
}

/** 두 전체 변환 맵 사이를 보간 */
export function interpolateTransforms(
  from: PartsTransformMap,
  to: PartsTransformMap,
  t: number
): PartsTransformMap {
  const result: PartsTransformMap = {};
  const allParts = new Set([...Object.keys(from), ...Object.keys(to)]);
  
  for (const part of allParts) {
    result[part] = interpolatePartTransform(from[part], to[part], t);
  }
  
  return result;
}

/** 이징 함수 - ease-in-out */
function easeInOutQuad(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

/** 이징 함수 - ease-out */
function easeOutQuad(t: number): number {
  return 1 - (1 - t) * (1 - t);
}

// ===== 메인 애니메이션 컨트롤러 클래스 =====

export class AnimationController implements IAnimationController {
  // 설정
  private config: AnimationControllerConfig;
  private _timeScale: number = 1;
  
  // 상태
  private _currentState: VoxelAnimationState = 'idle';
  private _previousState: VoxelAnimationState | null = null;
  private _progress: number = 0;
  private _isPlaying: boolean = true;
  private _isPaused: boolean = false;
  
  // 블렌딩
  private _isBlending: boolean = false;
  private blendProgress: number = 0;
  private blendDuration: number = 200; // ms
  private blendStartTime: number = 0;
  private previousTransforms: PartsTransformMap = {};
  
  // 시퀀스
  private currentSequence: VoxelAnimationSequence;
  private startTime: number = 0;
  private accumulatedTime: number = 0;
  
  // 이벤트
  private eventListeners: Set<AnimationEventCallback> = new Set();
  
  // 캐시
  private cachedAttackAnimation: VoxelAnimationSequence | null = null;
  
  constructor(config: AnimationControllerConfig) {
    this.config = config;
    this._timeScale = config.timeScale ?? 1;
    this._currentState = config.initialState ?? 'idle';
    this.currentSequence = VOXEL_ANIMATIONS[this._currentState];
    this.startTime = performance.now();
    
    // 랜덤 오프셋 적용 (부대 동기화용)
    if (config.randomOffset) {
      this.accumulatedTime = config.randomOffset * this.currentSequence.duration;
    }
  }
  
  // ===== Getters =====
  
  get currentState(): VoxelAnimationState {
    return this._currentState;
  }
  
  get previousState(): VoxelAnimationState | null {
    return this._previousState;
  }
  
  get progress(): number {
    return this._progress;
  }
  
  get isPlaying(): boolean {
    return this._isPlaying && !this._isPaused;
  }
  
  get isBlending(): boolean {
    return this._isBlending;
  }
  
  get timeScale(): number {
    return this._timeScale;
  }
  
  set timeScale(value: number) {
    this._timeScale = Math.max(0.1, Math.min(3, value));
  }
  
  // ===== 애니메이션 제어 =====
  
  play(state: VoxelAnimationState, options: PlayOptions = {}): void {
    // 같은 상태로의 전환은 무시 (이미 재생 중인 경우)
    if (this._currentState === state && this._isPlaying && !options.immediate) {
      return;
    }
    
    // 이전 상태 저장
    this._previousState = this._currentState;
    
    // 블렌딩 설정
    if (!options.immediate && this._isPlaying) {
      this._isBlending = true;
      this.blendProgress = 0;
      this.blendDuration = options.blendTime ?? this.getDefaultBlendTime(state);
      this.blendStartTime = performance.now();
      this.previousTransforms = this.getTransforms(); // 현재 변환 저장
    } else {
      this._isBlending = false;
    }
    
    // 새 상태 설정
    this._currentState = state;
    this._progress = options.startProgress ?? 0;
    this._isPlaying = true;
    this._isPaused = false;
    
    // 시퀀스 선택
    if (state === 'attack') {
      this.currentSequence = this.getAttackAnimation();
    } else {
      this.currentSequence = VOXEL_ANIMATIONS[state];
    }
    
    // 시간 초기화
    this.startTime = performance.now();
    this.accumulatedTime = this._progress * this.currentSequence.duration;
    
    // 속도 조정
    if (options.speed) {
      this._timeScale = options.speed;
    }
    
    // 이벤트 발생
    this.emitEvent('start', state, 0);
  }
  
  stop(): void {
    this._isPlaying = false;
    this._isPaused = false;
    this._progress = 0;
    this.accumulatedTime = 0;
    this._isBlending = false;
  }
  
  pause(): void {
    this._isPaused = true;
  }
  
  resume(): void {
    if (this._isPaused) {
      this._isPaused = false;
      this.startTime = performance.now() - this.accumulatedTime;
    }
  }
  
  update(deltaTime: number): void {
    if (!this._isPlaying || this._isPaused) return;
    
    const scaledDelta = deltaTime * this._timeScale;
    this.accumulatedTime += scaledDelta;
    
    // 블렌딩 업데이트
    if (this._isBlending) {
      const blendElapsed = performance.now() - this.blendStartTime;
      this.blendProgress = Math.min(blendElapsed / this.blendDuration, 1);
      
      if (this.blendProgress >= 1) {
        this._isBlending = false;
        this.blendProgress = 1;
      }
    }
    
    // 진행률 계산
    const duration = this.currentSequence.duration;
    
    if (this.currentSequence.loop) {
      // 루프 체크
      if (this.accumulatedTime >= duration) {
        const loops = Math.floor(this.accumulatedTime / duration);
        this.accumulatedTime = this.accumulatedTime % duration;
        
        // 루프 이벤트 발생
        for (let i = 0; i < loops; i++) {
          this.emitEvent('loop', this._currentState, 0);
        }
      }
      
      this._progress = this.accumulatedTime / duration;
    } else {
      // 비루프
      if (this.accumulatedTime >= duration) {
        this._progress = 1;
        
        // 완료 처리
        if (this._currentState === 'death') {
          // 사망은 마지막 프레임 유지
          this._isPlaying = false;
        } else {
          // 다른 애니메이션은 idle로 복귀
          this.emitEvent('complete', this._currentState, 1);
          this.play('idle', { blendTime: 150 });
        }
        return;
      }
      
      this._progress = this.accumulatedTime / duration;
    }
  }
  
  // ===== 변환 정보 =====
  
  getTransforms(): PartsTransformMap {
    const transforms = this.calculateKeyframeTransforms();
    
    // 블렌딩 중이면 이전 변환과 보간
    if (this._isBlending && this.blendProgress < 1) {
      const easedProgress = easeOutQuad(this.blendProgress);
      return interpolateTransforms(this.previousTransforms, transforms, easedProgress);
    }
    
    return transforms;
  }
  
  getColorOverlay(): string | undefined {
    const keyframes = this.currentSequence.keyframes;
    
    // 현재 진행률에 해당하는 색상 오버레이 찾기
    for (let i = keyframes.length - 1; i >= 0; i--) {
      if (this._progress >= keyframes[i].time && keyframes[i].colorOverlay) {
        // 블렌딩 중이면 투명도 조절
        if (this._isBlending) {
          return keyframes[i].colorOverlay;
        }
        return keyframes[i].colorOverlay;
      }
    }
    
    return undefined;
  }
  
  getScale(): number {
    const keyframes = this.currentSequence.keyframes;
    
    // 키프레임 사이 스케일 보간
    for (let i = 0; i < keyframes.length - 1; i++) {
      if (this._progress >= keyframes[i].time && this._progress <= keyframes[i + 1].time) {
        const prevScale = keyframes[i].scale ?? 1;
        const nextScale = keyframes[i + 1].scale ?? 1;
        const localT = (this._progress - keyframes[i].time) / 
                       (keyframes[i + 1].time - keyframes[i].time || 1);
        return prevScale + (nextScale - prevScale) * easeInOutQuad(localT);
      }
    }
    
    // 마지막 키프레임의 스케일
    const lastFrame = keyframes[keyframes.length - 1];
    return lastFrame.scale ?? 1;
  }
  
  // ===== 이벤트 =====
  
  addEventListener(callback: AnimationEventCallback): void {
    this.eventListeners.add(callback);
  }
  
  removeEventListener(callback: AnimationEventCallback): void {
    this.eventListeners.delete(callback);
  }
  
  private emitEvent(event: AnimationEventType, state: VoxelAnimationState, progress: number): void {
    for (const listener of this.eventListeners) {
      try {
        listener(event, state, progress);
      } catch (e) {
        console.warn('[AnimationController] Event listener error:', e);
      }
    }
  }
  
  // ===== 정리 =====
  
  dispose(): void {
    this.eventListeners.clear();
    this.stop();
  }
  
  // ===== Private 메서드 =====
  
  /** 무기 타입에 따른 공격 애니메이션 결정 */
  private getAttackAnimation(): VoxelAnimationSequence {
    // 캐시된 공격 애니메이션이 있으면 반환
    if (this.cachedAttackAnimation) {
      return this.cachedAttackAnimation;
    }
    
    const { weaponType, category } = this.config;
    
    // 무기 타입에 따른 공격 애니메이션
    if (weaponType && WEAPON_ATTACK_TYPE_MAP[weaponType]) {
      const attackType = WEAPON_ATTACK_TYPE_MAP[weaponType];
      this.cachedAttackAnimation = WEAPON_ATTACK_ANIMATIONS[attackType];
      return this.cachedAttackAnimation;
    }
    
    // 카테고리 기본 폴백
    this.cachedAttackAnimation = CATEGORY_ATTACK_ANIMATIONS[category] || WEAPON_ATTACK_ANIMATIONS.slash;
    return this.cachedAttackAnimation;
  }
  
  /** 키프레임 변환 계산 */
  private calculateKeyframeTransforms(): PartsTransformMap {
    const keyframes = this.currentSequence.keyframes;
    
    if (keyframes.length === 0) {
      return {};
    }
    
    if (keyframes.length === 1) {
      return keyframes[0].transforms as PartsTransformMap;
    }
    
    // 현재 진행률에 해당하는 키프레임 쌍 찾기
    let prevFrame = keyframes[0];
    let nextFrame = keyframes[keyframes.length - 1];
    
    for (let i = 0; i < keyframes.length - 1; i++) {
      if (this._progress >= keyframes[i].time && this._progress <= keyframes[i + 1].time) {
        prevFrame = keyframes[i];
        nextFrame = keyframes[i + 1];
        break;
      }
    }
    
    // 로컬 진행률 계산
    const timeDiff = nextFrame.time - prevFrame.time;
    const localT = timeDiff > 0 
      ? (this._progress - prevFrame.time) / timeDiff 
      : 0;
    
    // 이징 적용
    const easedT = easeInOutQuad(localT);
    
    // 변환 보간
    return interpolateTransforms(
      prevFrame.transforms as PartsTransformMap,
      nextFrame.transforms as PartsTransformMap,
      easedT
    );
  }
  
  /** 상태별 기본 블렌딩 시간 */
  private getDefaultBlendTime(state: VoxelAnimationState): number {
    switch (state) {
      case 'attack':
        return 100; // 공격은 빠르게
      case 'hit':
        return 50;  // 피격은 즉시
      case 'death':
        return 150; // 사망은 약간 부드럽게
      case 'run':
        return 150; // 달리기 전환
      case 'walk':
        return 200; // 걷기 전환
      case 'idle':
        return 200; // idle 복귀
      case 'charge':
        return 100; // 돌격
      case 'defend':
        return 100; // 방어
      default:
        return 150;
    }
  }
}

// ===== 팩토리 함수 =====

/** 유닛 스펙에서 애니메이션 컨트롤러 생성 */
export function createAnimationControllerFromSpec(
  spec: VoxelUnitSpec,
  options?: Partial<AnimationControllerConfig>
): AnimationController {
  return new AnimationController({
    category: spec.category,
    weaponType: spec.weapon?.type,
    unitId: spec.id,
    ...options,
  });
}

/** 간단한 설정으로 애니메이션 컨트롤러 생성 */
export function createSimpleAnimationController(
  category: VoxelUnitSpec['category'],
  weaponType?: VoxelUnitSpec['weapon']['type']
): AnimationController {
  return new AnimationController({ category, weaponType });
}

// ===== 애니메이션 유틸리티 =====

/** 애니메이션 상태가 이동 관련인지 확인 */
export function isMovementState(state: VoxelAnimationState): boolean {
  return state === 'walk' || state === 'run' || state === 'charge';
}

/** 애니메이션 상태가 전투 관련인지 확인 */
export function isCombatState(state: VoxelAnimationState): boolean {
  return state === 'attack' || state === 'defend' || state === 'hit';
}

/** 애니메이션 상태가 인터럽트 가능한지 확인 */
export function isInterruptible(state: VoxelAnimationState): boolean {
  return state !== 'death'; // 사망만 인터럽트 불가
}

export default AnimationController;





