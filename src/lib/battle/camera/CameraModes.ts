/**
 * CameraModes.ts
 * 복셀 전투 카메라 시스템 - 모드별 로직
 *
 * 모드:
 * - Free: 자유 이동 (기본)
 * - Follow: 유닛/부대 추적
 * - Overview: 전장 전체 조감도
 * - Cinematic: 자동 시네마틱 카메라
 */

import type { CameraController, Vector3Like, FollowTarget, CameraConfig } from './CameraController';
import type { InputState } from './CameraInput';

// ========================================
// 기본 모드 인터페이스
// ========================================

export interface CameraMode {
  name: string;

  /** 모드 활성화 */
  activate(): void;

  /** 모드 비활성화 */
  deactivate(): void;

  /** 매 프레임 업데이트 */
  update(deltaTime: number, inputState: InputState): void;

  /** 초기 카메라 위치 반환 */
  getInitialPosition(): Vector3Like;

  /** 초기 타겟 위치 반환 */
  getInitialTarget(): Vector3Like;

  /** 리소스 정리 */
  dispose?(): void;
}

// ========================================
// 유틸리티 함수
// ========================================

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

// ========================================
// Free 모드 (자유 이동)
// ========================================

export class FreeCameraMode implements CameraMode {
  name = 'free';
  private controller: CameraController;
  private isActive: boolean = false;

  constructor(controller: CameraController) {
    this.controller = controller;
  }

  activate(): void {
    this.isActive = true;
  }

  deactivate(): void {
    this.isActive = false;
  }

  update(deltaTime: number, inputState: InputState): void {
    // Free 모드에서는 입력이 CameraController에서 직접 처리됨
    // 추가적인 자동 동작이 없음
  }

  getInitialPosition(): Vector3Like {
    const config = this.controller.getConfig();
    return config.position;
  }

  getInitialTarget(): Vector3Like {
    const config = this.controller.getConfig();
    return config.target;
  }
}

// ========================================
// Follow 모드 (유닛 추적)
// ========================================

export interface FollowModeConfig {
  /** 기본 추적 오프셋 */
  defaultOffset: Vector3Like;

  /** 추적 부드러움 (0-1) */
  followSmoothness: number;

  /** look ahead 강도 */
  lookAheadStrength: number;

  /** 전투 중 줌 인 거리 */
  combatZoomDistance: number;

  /** 기본 줌 거리 */
  defaultZoomDistance: number;
}

const DEFAULT_FOLLOW_CONFIG: FollowModeConfig = {
  defaultOffset: { x: 0, y: 30, z: 40 },
  followSmoothness: 0.95,
  lookAheadStrength: 2.0,
  combatZoomDistance: 25,
  defaultZoomDistance: 50,
};

export class FollowCameraMode implements CameraMode {
  name = 'follow';
  private controller: CameraController;
  private config: FollowModeConfig;
  private isActive: boolean = false;

  private target: FollowTarget | null = null;
  private lastTargetPosition: Vector3Like = { x: 0, y: 0, z: 0 };
  private smoothedPosition: Vector3Like = { x: 0, y: 0, z: 0 };
  private smoothedVelocity: Vector3Like = { x: 0, y: 0, z: 0 };

  constructor(controller: CameraController, config: Partial<FollowModeConfig> = {}) {
    this.controller = controller;
    this.config = { ...DEFAULT_FOLLOW_CONFIG, ...config };
  }

  activate(): void {
    this.isActive = true;

    if (this.target) {
      this.smoothedPosition = { ...this.target.position };
      this.lastTargetPosition = { ...this.target.position };
    }
  }

  deactivate(): void {
    this.isActive = false;
  }

  setTarget(target: FollowTarget | null): void {
    this.target = target;

    if (target) {
      this.smoothedPosition = { ...target.position };
      this.lastTargetPosition = { ...target.position };
      this.smoothedVelocity = { x: 0, y: 0, z: 0 };
    }
  }

  update(deltaTime: number, inputState: InputState): void {
    if (!this.isActive || !this.target) return;

    const factor = 1 - Math.pow(this.config.followSmoothness, deltaTime * 60);

    // 타겟 위치 부드럽게 추적
    this.smoothedPosition.x = lerp(this.smoothedPosition.x, this.target.position.x, factor);
    this.smoothedPosition.y = lerp(this.smoothedPosition.y, this.target.position.y, factor);
    this.smoothedPosition.z = lerp(this.smoothedPosition.z, this.target.position.z, factor);

    // 속도 계산 (look ahead용)
    if (this.target.velocity) {
      this.smoothedVelocity.x = lerp(this.smoothedVelocity.x, this.target.velocity.x, factor);
      this.smoothedVelocity.y = lerp(this.smoothedVelocity.y, this.target.velocity.y, factor);
      this.smoothedVelocity.z = lerp(this.smoothedVelocity.z, this.target.velocity.z, factor);
    } else {
      // 속도를 위치 변화에서 유추
      const dx = this.target.position.x - this.lastTargetPosition.x;
      const dy = this.target.position.y - this.lastTargetPosition.y;
      const dz = this.target.position.z - this.lastTargetPosition.z;

      if (deltaTime > 0) {
        this.smoothedVelocity.x = lerp(this.smoothedVelocity.x, dx / deltaTime, factor);
        this.smoothedVelocity.y = lerp(this.smoothedVelocity.y, dy / deltaTime, factor);
        this.smoothedVelocity.z = lerp(this.smoothedVelocity.z, dz / deltaTime, factor);
      }
    }

    this.lastTargetPosition = { ...this.target.position };

    // Look ahead 적용
    let targetX = this.smoothedPosition.x;
    let targetZ = this.smoothedPosition.z;

    if (this.target.lookAhead) {
      targetX += this.smoothedVelocity.x * this.config.lookAheadStrength;
      targetZ += this.smoothedVelocity.z * this.config.lookAheadStrength;
    }

    // 오프셋 적용
    const offset = this.target.offset || this.config.defaultOffset;

    // 카메라 타겟 설정
    this.controller._setTargetTarget(targetX, 0, targetZ);

    // 전투 중이면 줌 인
    const speed = Math.sqrt(
      this.smoothedVelocity.x ** 2 +
      this.smoothedVelocity.z ** 2
    );

    const isInCombat = speed < 1; // 거의 정지 = 전투 중으로 가정
    const targetZoom = isInCombat
      ? this.config.combatZoomDistance
      : this.config.defaultZoomDistance;

    const currentSpherical = this.controller._getSpherical();
    const newRadius = lerp(currentSpherical.radius, targetZoom, factor * 0.5);

    this.controller._setTargetSpherical(
      newRadius,
      currentSpherical.theta,
      currentSpherical.phi
    );
  }

  getInitialPosition(): Vector3Like {
    if (this.target) {
      const offset = this.target.offset || this.config.defaultOffset;
      return {
        x: this.target.position.x + offset.x,
        y: offset.y,
        z: this.target.position.z + offset.z,
      };
    }
    return this.controller.getConfig().position;
  }

  getInitialTarget(): Vector3Like {
    if (this.target) {
      return { ...this.target.position };
    }
    return this.controller.getConfig().target;
  }
}

// ========================================
// Overview 모드 (전장 전체 보기)
// ========================================

export interface OverviewModeConfig {
  /** 조감도 높이 */
  height: number;

  /** 조감도 거리 */
  distance: number;

  /** 카메라 피치 (라디안) */
  pitch: number;

  /** 천천히 회전 */
  autoRotate: boolean;

  /** 자동 회전 속도 */
  autoRotateSpeed: number;
}

const DEFAULT_OVERVIEW_CONFIG: OverviewModeConfig = {
  height: 150,
  distance: 180,
  pitch: Math.PI / 3, // 60도
  autoRotate: false,
  autoRotateSpeed: 0.1,
};

export class OverviewCameraMode implements CameraMode {
  name = 'overview';
  private controller: CameraController;
  private config: OverviewModeConfig;
  private isActive: boolean = false;

  private battleBounds: { minX: number; maxX: number; minZ: number; maxZ: number } | null = null;
  private currentRotation: number = 0;

  constructor(controller: CameraController, config: Partial<OverviewModeConfig> = {}) {
    this.controller = controller;
    this.config = { ...DEFAULT_OVERVIEW_CONFIG, ...config };
  }

  activate(): void {
    this.isActive = true;
    this.currentRotation = this.controller._getSpherical().theta;
  }

  deactivate(): void {
    this.isActive = false;
  }

  setBattleBounds(bounds: { minX: number; maxX: number; minZ: number; maxZ: number }): void {
    this.battleBounds = bounds;
  }

  update(deltaTime: number, inputState: InputState): void {
    if (!this.isActive) return;

    // 전장 중심 계산
    const center = this.getBattleCenter();

    // 타겟을 전장 중심으로 설정
    this.controller._setTargetTarget(center.x, 0, center.z);

    // 자동 회전
    if (this.config.autoRotate && !inputState.isPanning && !inputState.isRotating) {
      this.currentRotation += this.config.autoRotateSpeed * deltaTime;
    }

    // 구면 좌표 설정
    const currentSpherical = this.controller._getSpherical();
    const targetRadius = this.calculateOverviewDistance();

    this.controller._setTargetSpherical(
      targetRadius,
      this.currentRotation,
      this.config.pitch
    );
  }

  getInitialPosition(): Vector3Like {
    const center = this.getBattleCenter();
    const distance = this.calculateOverviewDistance();
    const height = distance * Math.cos(this.config.pitch);
    const horizontalDist = distance * Math.sin(this.config.pitch);

    return {
      x: center.x,
      y: height,
      z: center.z + horizontalDist,
    };
  }

  getInitialTarget(): Vector3Like {
    return this.getBattleCenter();
  }

  private getBattleCenter(): Vector3Like {
    if (this.battleBounds) {
      return {
        x: (this.battleBounds.minX + this.battleBounds.maxX) / 2,
        y: 0,
        z: (this.battleBounds.minZ + this.battleBounds.maxZ) / 2,
      };
    }
    return { x: 0, y: 0, z: 0 };
  }

  private calculateOverviewDistance(): number {
    if (this.battleBounds) {
      const width = this.battleBounds.maxX - this.battleBounds.minX;
      const depth = this.battleBounds.maxZ - this.battleBounds.minZ;
      const diagonal = Math.sqrt(width * width + depth * depth);
      return Math.max(this.config.distance, diagonal * 0.8);
    }
    return this.config.distance;
  }
}

// ========================================
// Cinematic 모드 (자동 시네마틱)
// ========================================

export interface CameraKeyframe {
  /** 시간 (초) */
  time: number;

  /** 카메라 위치 */
  position: Vector3Like;

  /** 카메라 타겟 */
  target: Vector3Like;

  /** 이징 함수 (기본: easeInOutCubic) */
  easing?: EasingType;
}

export type EasingType =
  | 'linear'
  | 'easeIn'
  | 'easeOut'
  | 'easeInOut'
  | 'easeInCubic'
  | 'easeOutCubic'
  | 'easeInOutCubic';

export interface CinematicSequence {
  id: string;
  name: string;
  keyframes: CameraKeyframe[];
  loop: boolean;
}

// 내장 시네마틱 시퀀스
const BUILT_IN_SEQUENCES: Map<string, CinematicSequence> = new Map([
  [
    'battle_start',
    {
      id: 'battle_start',
      name: '전투 시작',
      loop: false,
      keyframes: [
        { time: 0, position: { x: 0, y: 200, z: 200 }, target: { x: 0, y: 0, z: 0 }, easing: 'easeOutCubic' },
        { time: 2, position: { x: -100, y: 80, z: 100 }, target: { x: -50, y: 0, z: 0 }, easing: 'easeInOutCubic' },
        { time: 4, position: { x: 100, y: 80, z: 100 }, target: { x: 50, y: 0, z: 0 }, easing: 'easeInOutCubic' },
        { time: 6, position: { x: 0, y: 100, z: 120 }, target: { x: 0, y: 0, z: 0 }, easing: 'easeOutCubic' },
      ],
    },
  ],
  [
    'charge',
    {
      id: 'charge',
      name: '돌격',
      loop: false,
      keyframes: [
        { time: 0, position: { x: 0, y: 20, z: -50 }, target: { x: 0, y: 5, z: 0 }, easing: 'linear' },
        { time: 1, position: { x: 0, y: 15, z: -30 }, target: { x: 0, y: 3, z: 10 }, easing: 'easeIn' },
        { time: 2, position: { x: 0, y: 10, z: -10 }, target: { x: 0, y: 2, z: 20 }, easing: 'easeOut' },
      ],
    },
  ],
  [
    'general_skill',
    {
      id: 'general_skill',
      name: '장수 특기',
      loop: false,
      keyframes: [
        { time: 0, position: { x: 0, y: 5, z: 10 }, target: { x: 0, y: 3, z: 0 }, easing: 'easeOutCubic' },
        { time: 1.5, position: { x: 5, y: 4, z: 8 }, target: { x: 0, y: 3, z: 0 }, easing: 'easeInOutCubic' },
        { time: 3, position: { x: -5, y: 4, z: 8 }, target: { x: 0, y: 3, z: 0 }, easing: 'easeInOutCubic' },
        { time: 4.5, position: { x: 0, y: 5, z: 10 }, target: { x: 0, y: 3, z: 0 }, easing: 'easeOutCubic' },
      ],
    },
  ],
  [
    'victory',
    {
      id: 'victory',
      name: '승리',
      loop: false,
      keyframes: [
        { time: 0, position: { x: 0, y: 50, z: 80 }, target: { x: 0, y: 0, z: 0 }, easing: 'easeOutCubic' },
        { time: 2, position: { x: 50, y: 30, z: 50 }, target: { x: 0, y: 10, z: 0 }, easing: 'easeInOutCubic' },
        { time: 4, position: { x: -50, y: 30, z: 50 }, target: { x: 0, y: 10, z: 0 }, easing: 'easeInOutCubic' },
        { time: 6, position: { x: 0, y: 100, z: 0 }, target: { x: 0, y: 0, z: 0 }, easing: 'easeOutCubic' },
      ],
    },
  ],
]);

export class CinematicCameraMode implements CameraMode {
  name = 'cinematic';
  private controller: CameraController;
  private isActive: boolean = false;

  private currentSequence: CinematicSequence | null = null;
  private currentTime: number = 0;
  private isPlaying: boolean = false;

  // 이벤트 콜백
  public onSequenceEnd?: (sequenceId: string) => void;
  public onKeyframeReached?: (keyframeIndex: number) => void;

  // 추가 시퀀스
  private customSequences: Map<string, CinematicSequence> = new Map();

  // 오프셋 (타겟 유닛 위치 기준)
  private targetOffset: Vector3Like = { x: 0, y: 0, z: 0 };

  constructor(controller: CameraController) {
    this.controller = controller;
  }

  activate(): void {
    this.isActive = true;
    this.isPlaying = true;
    this.currentTime = 0;
  }

  deactivate(): void {
    this.isActive = false;
    this.isPlaying = false;
  }

  setSequence(sequenceId: string): void {
    const sequence = this.customSequences.get(sequenceId) || BUILT_IN_SEQUENCES.get(sequenceId);

    if (sequence) {
      this.currentSequence = sequence;
      this.currentTime = 0;
      this.isPlaying = true;
      console.log(`🎬 시네마틱 시작: ${sequence.name}`);
    } else {
      console.warn(`시네마틱 시퀀스를 찾을 수 없습니다: ${sequenceId}`);
    }
  }

  /** 타겟 오프셋 설정 (유닛 추적 시네마틱용) */
  setTargetOffset(offset: Vector3Like): void {
    this.targetOffset = offset;
  }

  /** 커스텀 시퀀스 등록 */
  registerSequence(sequence: CinematicSequence): void {
    this.customSequences.set(sequence.id, sequence);
  }

  /** 재생 중지 */
  stop(): void {
    this.isPlaying = false;
    this.currentTime = 0;
  }

  /** 일시정지/재개 */
  togglePause(): void {
    this.isPlaying = !this.isPlaying;
  }

  update(deltaTime: number, inputState: InputState): void {
    if (!this.isActive || !this.currentSequence || !this.isPlaying) return;

    this.currentTime += deltaTime;

    const { keyframes, loop } = this.currentSequence;
    const totalDuration = keyframes[keyframes.length - 1].time;

    // 시퀀스 종료 체크
    if (this.currentTime >= totalDuration) {
      if (loop) {
        this.currentTime = this.currentTime % totalDuration;
      } else {
        this.isPlaying = false;
        this.onSequenceEnd?.(this.currentSequence.id);
        return;
      }
    }

    // 현재 키프레임 구간 찾기
    let startIndex = 0;
    for (let i = 0; i < keyframes.length - 1; i++) {
      if (this.currentTime >= keyframes[i].time && this.currentTime < keyframes[i + 1].time) {
        startIndex = i;
        break;
      }
    }

    const startKeyframe = keyframes[startIndex];
    const endKeyframe = keyframes[startIndex + 1];

    // 구간 내 진행도 계산
    const segmentDuration = endKeyframe.time - startKeyframe.time;
    const segmentProgress = (this.currentTime - startKeyframe.time) / segmentDuration;

    // 이징 적용
    const easedProgress = this.applyEasing(segmentProgress, endKeyframe.easing || 'easeInOutCubic');

    // 위치 보간
    const position = this.lerpVector3(
      startKeyframe.position,
      endKeyframe.position,
      easedProgress
    );

    // 타겟 보간
    const target = this.lerpVector3(
      startKeyframe.target,
      endKeyframe.target,
      easedProgress
    );

    // 오프셋 적용
    position.x += this.targetOffset.x;
    position.z += this.targetOffset.z;
    target.x += this.targetOffset.x;
    target.z += this.targetOffset.z;

    // 카메라 설정
    this.controller.setPosition(position, target);
  }

  getInitialPosition(): Vector3Like {
    if (this.currentSequence && this.currentSequence.keyframes.length > 0) {
      const pos = this.currentSequence.keyframes[0].position;
      return {
        x: pos.x + this.targetOffset.x,
        y: pos.y,
        z: pos.z + this.targetOffset.z,
      };
    }
    return this.controller.getConfig().position;
  }

  getInitialTarget(): Vector3Like {
    if (this.currentSequence && this.currentSequence.keyframes.length > 0) {
      const target = this.currentSequence.keyframes[0].target;
      return {
        x: target.x + this.targetOffset.x,
        y: target.y,
        z: target.z + this.targetOffset.z,
      };
    }
    return this.controller.getConfig().target;
  }

  // ========================================
  // 유틸리티
  // ========================================

  private lerpVector3(a: Vector3Like, b: Vector3Like, t: number): Vector3Like {
    return {
      x: a.x + (b.x - a.x) * t,
      y: a.y + (b.y - a.y) * t,
      z: a.z + (b.z - a.z) * t,
    };
  }

  private applyEasing(t: number, easing: EasingType): number {
    switch (easing) {
      case 'linear':
        return t;

      case 'easeIn':
        return t * t;

      case 'easeOut':
        return 1 - (1 - t) * (1 - t);

      case 'easeInOut':
        return t < 0.5
          ? 2 * t * t
          : 1 - Math.pow(-2 * t + 2, 2) / 2;

      case 'easeInCubic':
        return t * t * t;

      case 'easeOutCubic':
        return 1 - Math.pow(1 - t, 3);

      case 'easeInOutCubic':
      default:
        return t < 0.5
          ? 4 * t * t * t
          : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }
  }
}

export default {
  FreeCameraMode,
  FollowCameraMode,
  OverviewCameraMode,
  CinematicCameraMode,
};





