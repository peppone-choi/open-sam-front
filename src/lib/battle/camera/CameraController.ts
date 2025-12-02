/**
 * CameraController.ts
 * 복셀 전투 카메라 시스템 - 메인 컨트롤러
 *
 * 기능:
 * - Three.js 카메라 래핑
 * - 다중 카메라 모드 지원 (Free/Follow/Overview/Cinematic)
 * - 부드러운 전환 및 보간
 * - 경계 제한
 */

import * as THREE from 'three';
import { CameraInput, InputState } from './CameraInput';
import { CameraMode, FreeCameraMode, FollowCameraMode, OverviewCameraMode, CinematicCameraMode } from './CameraModes';
import { CameraPresets, CameraPreset } from './CameraPresets';

// ========================================
// 타입 정의
// ========================================

export interface Vector3Like {
  x: number;
  y: number;
  z: number;
}

export interface CameraConfig {
  // 초기 위치
  position: Vector3Like;
  target: Vector3Like;

  // 줌 제한
  minZoom: number;     // 최소 거리 (가까이)
  maxZoom: number;     // 최대 거리 (멀리)

  // 피치 제한 (라디안)
  minPitch: number;    // 최소 피치 (수평에 가까움)
  maxPitch: number;    // 최대 피치 (위에서 내려봄)

  // 팬 경계
  bounds: {
    minX: number;
    maxX: number;
    minZ: number;
    maxZ: number;
  };

  // 속도 설정
  panSpeed: number;
  zoomSpeed: number;
  rotateSpeed: number;

  // 부드러움 (0-1, 높을수록 부드러움)
  smoothing: number;

  // 포커스
  fov: number;
  near: number;
  far: number;
}

export interface FollowTarget {
  type: 'unit' | 'squad' | 'general';
  id: string;
  position: Vector3Like;
  velocity?: Vector3Like;
  offset: Vector3Like;
  lookAhead: boolean;
}

export type CameraModeType = 'free' | 'follow' | 'overview' | 'cinematic';

// ========================================
// 기본 설정
// ========================================

export const DEFAULT_CAMERA_CONFIG: CameraConfig = {
  position: { x: 0, y: 100, z: 120 },
  target: { x: 0, y: 0, z: 0 },
  minZoom: 30,
  maxZoom: 250,
  minPitch: 0.2,          // 약 11도
  maxPitch: Math.PI / 2.2, // 약 82도
  bounds: {
    minX: -150,
    maxX: 150,
    minZ: -150,
    maxZ: 150,
  },
  panSpeed: 1.0,
  zoomSpeed: 1.0,
  rotateSpeed: 1.0,
  smoothing: 0.92,
  fov: 45,
  near: 0.1,
  far: 1000,
};

// ========================================
// 유틸리티 함수
// ========================================

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function lerpVector3(out: THREE.Vector3, target: Vector3Like, t: number): void {
  out.x = lerp(out.x, target.x, t);
  out.y = lerp(out.y, target.y, t);
  out.z = lerp(out.z, target.z, t);
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function distanceXZ(a: Vector3Like, b: Vector3Like): number {
  const dx = a.x - b.x;
  const dz = a.z - b.z;
  return Math.sqrt(dx * dx + dz * dz);
}

// ========================================
// CameraController 클래스
// ========================================

export class CameraController {
  // Three.js 객체
  public camera: THREE.PerspectiveCamera;
  private domElement: HTMLElement;

  // 설정
  private config: CameraConfig;

  // 카메라 상태
  private currentPosition: THREE.Vector3;
  private targetPosition: THREE.Vector3;
  private currentTarget: THREE.Vector3;
  private targetTarget: THREE.Vector3;

  // 구면 좌표 (카메라 위치를 타겟 기준으로 표현)
  private spherical: {
    radius: number;
    theta: number;  // 수평 각도 (yaw)
    phi: number;    // 수직 각도 (pitch)
  };

  private targetSpherical: {
    radius: number;
    theta: number;
    phi: number;
  };

  // 모드
  private currentModeType: CameraModeType = 'free';
  private modes: Map<CameraModeType, CameraMode>;
  private freeMode: FreeCameraMode;
  private followMode: FollowCameraMode;
  private overviewMode: OverviewCameraMode;
  private cinematicMode: CinematicCameraMode;

  // 입력 처리
  private input: CameraInput;

  // 프리셋
  private presets: CameraPresets;

  // 추적 대상
  private followTarget: FollowTarget | null = null;

  // 전환 상태
  private isTransitioning: boolean = false;
  private transitionProgress: number = 0;
  private transitionDuration: number = 0.5;
  private transitionStartPosition: THREE.Vector3 = new THREE.Vector3();
  private transitionStartTarget: THREE.Vector3 = new THREE.Vector3();
  private transitionEndPosition: THREE.Vector3 = new THREE.Vector3();
  private transitionEndTarget: THREE.Vector3 = new THREE.Vector3();

  // 업데이트 상태
  private enabled: boolean = true;
  private needsUpdate: boolean = true;
  private lastUpdateTime: number = 0;

  // 이벤트 콜백
  public onModeChange?: (mode: CameraModeType) => void;
  public onTargetChange?: (target: FollowTarget | null) => void;

  constructor(
    camera: THREE.PerspectiveCamera,
    domElement: HTMLElement,
    config: Partial<CameraConfig> = {}
  ) {
    this.camera = camera;
    this.domElement = domElement;
    this.config = { ...DEFAULT_CAMERA_CONFIG, ...config };

    // 초기 위치 설정
    this.currentPosition = new THREE.Vector3(
      this.config.position.x,
      this.config.position.y,
      this.config.position.z
    );
    this.targetPosition = this.currentPosition.clone();

    this.currentTarget = new THREE.Vector3(
      this.config.target.x,
      this.config.target.y,
      this.config.target.z
    );
    this.targetTarget = this.currentTarget.clone();

    // 구면 좌표 초기화
    this.spherical = this.positionToSpherical(this.currentPosition, this.currentTarget);
    this.targetSpherical = { ...this.spherical };

    // 카메라 적용
    this.camera.position.copy(this.currentPosition);
    this.camera.lookAt(this.currentTarget);

    // 입력 핸들러 초기화
    this.input = new CameraInput(domElement, {
      onPan: this.handlePan.bind(this),
      onZoom: this.handleZoom.bind(this),
      onRotate: this.handleRotate.bind(this),
      onReset: this.handleReset.bind(this),
      onPreset: this.handlePreset.bind(this),
      onFollowCancel: this.handleFollowCancel.bind(this),
    });

    // 모드 초기화
    this.freeMode = new FreeCameraMode(this);
    this.followMode = new FollowCameraMode(this);
    this.overviewMode = new OverviewCameraMode(this);
    this.cinematicMode = new CinematicCameraMode(this);

    this.modes = new Map([
      ['free', this.freeMode],
      ['follow', this.followMode],
      ['overview', this.overviewMode],
      ['cinematic', this.cinematicMode],
    ]);

    // 프리셋 초기화
    this.presets = new CameraPresets(this.config.bounds);
  }

  // ========================================
  // 공개 API
  // ========================================

  /**
   * 업데이트 루프 (매 프레임 호출)
   */
  update(deltaTime: number): void {
    if (!this.enabled) return;

    const now = performance.now();
    const dt = deltaTime > 0 ? deltaTime : (now - this.lastUpdateTime) / 1000;
    this.lastUpdateTime = now;

    // 전환 중 처리
    if (this.isTransitioning) {
      this.updateTransition(dt);
    } else {
      // 현재 모드 업데이트
      const currentMode = this.modes.get(this.currentModeType);
      if (currentMode) {
        currentMode.update(dt, this.input.getState());
      }

      // 부드러운 보간
      this.applySmoothingToSpherical(dt);
    }

    // 경계 제한 적용
    this.applyBounds();

    // 카메라 위치 및 방향 업데이트
    this.updateCameraFromSpherical();

    // Three.js 카메라에 적용
    lerpVector3(this.camera.position, this.currentPosition, 1 - Math.pow(this.config.smoothing, dt * 60));
    this.camera.lookAt(this.currentTarget);

    this.needsUpdate = false;
  }

  /**
   * 카메라 모드 변경
   */
  setMode(mode: CameraModeType, transition: boolean = true): void {
    if (this.currentModeType === mode) return;

    const prevMode = this.modes.get(this.currentModeType);
    const nextMode = this.modes.get(mode);

    if (!nextMode) return;

    // 이전 모드 비활성화
    prevMode?.deactivate();

    // 전환 시작
    if (transition) {
      this.startTransition(nextMode.getInitialPosition(), nextMode.getInitialTarget());
    }

    // 다음 모드 활성화
    nextMode.activate();

    this.currentModeType = mode;
    this.onModeChange?.(mode);

    console.log(`📷 카메라 모드 변경: ${mode}`);
  }

  /**
   * 현재 모드 가져오기
   */
  getMode(): CameraModeType {
    return this.currentModeType;
  }

  /**
   * 유닛 추적 시작
   */
  followUnit(target: FollowTarget): void {
    this.followTarget = target;
    this.followMode.setTarget(target);
    this.setMode('follow');
    this.onTargetChange?.(target);
  }

  /**
   * 추적 중지
   */
  stopFollowing(): void {
    this.followTarget = null;
    this.followMode.setTarget(null);
    this.setMode('free');
    this.onTargetChange?.(null);
  }

  /**
   * 추적 대상 위치 업데이트
   */
  updateFollowTargetPosition(position: Vector3Like, velocity?: Vector3Like): void {
    if (this.followTarget) {
      this.followTarget.position = position;
      this.followTarget.velocity = velocity;
    }
  }

  /**
   * 전장 전체 보기
   */
  showOverview(bounds?: { minX: number; maxX: number; minZ: number; maxZ: number }): void {
    if (bounds) {
      this.overviewMode.setBattleBounds(bounds);
    }
    this.setMode('overview');
  }

  /**
   * 시네마틱 재생
   */
  playCinematic(sequenceId: string): void {
    this.cinematicMode.setSequence(sequenceId);
    this.setMode('cinematic');
  }

  /**
   * 시네마틱 중지
   */
  stopCinematic(): void {
    this.cinematicMode.stop();
    this.setMode('free');
  }

  /**
   * 프리셋 뷰로 이동
   */
  goToPreset(presetKey: string): void {
    const preset = this.presets.getPreset(presetKey);
    if (preset) {
      this.transitionTo(preset.position, preset.target);
    }
  }

  /**
   * 특정 위치로 부드럽게 이동
   */
  transitionTo(position: Vector3Like, target: Vector3Like, duration: number = 0.5): void {
    this.startTransition(position, target, duration);
  }

  /**
   * 즉시 위치 설정 (전환 없음)
   */
  setPosition(position: Vector3Like, target: Vector3Like): void {
    this.currentPosition.set(position.x, position.y, position.z);
    this.targetPosition.copy(this.currentPosition);
    this.currentTarget.set(target.x, target.y, target.z);
    this.targetTarget.copy(this.currentTarget);

    this.spherical = this.positionToSpherical(this.currentPosition, this.currentTarget);
    this.targetSpherical = { ...this.spherical };

    this.camera.position.copy(this.currentPosition);
    this.camera.lookAt(this.currentTarget);
  }

  /**
   * 타겟 위치 설정
   */
  setTarget(target: Vector3Like): void {
    this.targetTarget.set(target.x, target.y, target.z);
    this.needsUpdate = true;
  }

  /**
   * 줌 설정
   */
  setZoom(distance: number): void {
    this.targetSpherical.radius = clamp(distance, this.config.minZoom, this.config.maxZoom);
    this.needsUpdate = true;
  }

  /**
   * 활성화/비활성화
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    this.input.setEnabled(enabled);
  }

  /**
   * 설정 업데이트
   */
  updateConfig(config: Partial<CameraConfig>): void {
    this.config = { ...this.config, ...config };
    this.presets.updateBounds(this.config.bounds);
  }

  /**
   * 현재 상태 가져오기
   */
  getState(): {
    position: Vector3Like;
    target: Vector3Like;
    mode: CameraModeType;
    zoom: number;
    followTarget: FollowTarget | null;
  } {
    return {
      position: { x: this.currentPosition.x, y: this.currentPosition.y, z: this.currentPosition.z },
      target: { x: this.currentTarget.x, y: this.currentTarget.y, z: this.currentTarget.z },
      mode: this.currentModeType,
      zoom: this.spherical.radius,
      followTarget: this.followTarget,
    };
  }

  /**
   * 설정 가져오기
   */
  getConfig(): CameraConfig {
    return { ...this.config };
  }

  /**
   * 시네마틱 모드 가져오기
   */
  getCinematicMode(): CinematicCameraMode {
    return this.cinematicMode;
  }

  /**
   * 리소스 정리
   */
  dispose(): void {
    this.input.dispose();
    this.modes.forEach(mode => mode.dispose?.());
  }

  // ========================================
  // 내부 메서드 - 구면 좌표 변환
  // ========================================

  private positionToSpherical(
    position: THREE.Vector3,
    target: THREE.Vector3
  ): { radius: number; theta: number; phi: number } {
    const offset = new THREE.Vector3().subVectors(position, target);
    const radius = offset.length();
    const theta = Math.atan2(offset.x, offset.z);
    const phi = Math.acos(clamp(offset.y / radius, -1, 1));

    return { radius, theta, phi };
  }

  private sphericalToPosition(
    spherical: { radius: number; theta: number; phi: number },
    target: THREE.Vector3
  ): THREE.Vector3 {
    const sinPhi = Math.sin(spherical.phi);
    const cosPhi = Math.cos(spherical.phi);
    const sinTheta = Math.sin(spherical.theta);
    const cosTheta = Math.cos(spherical.theta);

    return new THREE.Vector3(
      target.x + spherical.radius * sinPhi * sinTheta,
      target.y + spherical.radius * cosPhi,
      target.z + spherical.radius * sinPhi * cosTheta
    );
  }

  private updateCameraFromSpherical(): void {
    this.currentPosition = this.sphericalToPosition(this.spherical, this.currentTarget);
    this.targetPosition = this.sphericalToPosition(this.targetSpherical, this.targetTarget);
  }

  private applySmoothingToSpherical(dt: number): void {
    const factor = 1 - Math.pow(this.config.smoothing, dt * 60);

    this.spherical.radius = lerp(this.spherical.radius, this.targetSpherical.radius, factor);
    this.spherical.theta = lerp(this.spherical.theta, this.targetSpherical.theta, factor);
    this.spherical.phi = lerp(this.spherical.phi, this.targetSpherical.phi, factor);

    lerpVector3(this.currentTarget, this.targetTarget, factor);
  }

  // ========================================
  // 내부 메서드 - 입력 핸들러
  // ========================================

  private handlePan(dx: number, dy: number): void {
    if (this.currentModeType !== 'free') return;

    const panSpeed = this.config.panSpeed * this.spherical.radius * 0.002;

    // 카메라 방향 기준으로 팬
    const forward = new THREE.Vector3(
      -Math.sin(this.spherical.theta),
      0,
      -Math.cos(this.spherical.theta)
    );
    const right = new THREE.Vector3(
      Math.cos(this.spherical.theta),
      0,
      -Math.sin(this.spherical.theta)
    );

    this.targetTarget.x += right.x * dx * panSpeed + forward.x * dy * panSpeed;
    this.targetTarget.z += right.z * dx * panSpeed + forward.z * dy * panSpeed;

    this.needsUpdate = true;
  }

  private handleZoom(delta: number): void {
    const zoomSpeed = this.config.zoomSpeed * 0.1;
    const newRadius = this.targetSpherical.radius * (1 + delta * zoomSpeed);

    this.targetSpherical.radius = clamp(newRadius, this.config.minZoom, this.config.maxZoom);
    this.needsUpdate = true;
  }

  private handleRotate(dx: number, dy: number): void {
    if (this.currentModeType !== 'free') return;

    const rotateSpeed = this.config.rotateSpeed * 0.005;

    this.targetSpherical.theta -= dx * rotateSpeed;
    this.targetSpherical.phi += dy * rotateSpeed;

    // 피치 제한
    this.targetSpherical.phi = clamp(
      this.targetSpherical.phi,
      this.config.minPitch,
      this.config.maxPitch
    );

    this.needsUpdate = true;
  }

  private handleReset(): void {
    this.transitionTo(this.config.position, this.config.target);
  }

  private handlePreset(key: number): void {
    const presetKey = `preset_${key}`;
    this.goToPreset(presetKey);
  }

  private handleFollowCancel(): void {
    if (this.currentModeType === 'follow') {
      this.stopFollowing();
    } else if (this.currentModeType === 'cinematic') {
      this.stopCinematic();
    }
  }

  // ========================================
  // 내부 메서드 - 경계 제한
  // ========================================

  private applyBounds(): void {
    const { bounds } = this.config;

    // 타겟 위치 경계 적용 (부드러운 반발)
    const margin = 10;
    const softness = 0.1;

    if (this.targetTarget.x < bounds.minX + margin) {
      this.targetTarget.x = lerp(this.targetTarget.x, bounds.minX + margin, softness);
    } else if (this.targetTarget.x > bounds.maxX - margin) {
      this.targetTarget.x = lerp(this.targetTarget.x, bounds.maxX - margin, softness);
    }

    if (this.targetTarget.z < bounds.minZ + margin) {
      this.targetTarget.z = lerp(this.targetTarget.z, bounds.minZ + margin, softness);
    } else if (this.targetTarget.z > bounds.maxZ - margin) {
      this.targetTarget.z = lerp(this.targetTarget.z, bounds.maxZ - margin, softness);
    }

    // 줌 제한
    this.targetSpherical.radius = clamp(
      this.targetSpherical.radius,
      this.config.minZoom,
      this.config.maxZoom
    );

    // 피치 제한
    this.targetSpherical.phi = clamp(
      this.targetSpherical.phi,
      this.config.minPitch,
      this.config.maxPitch
    );
  }

  // ========================================
  // 내부 메서드 - 전환
  // ========================================

  private startTransition(
    endPosition: Vector3Like,
    endTarget: Vector3Like,
    duration: number = 0.5
  ): void {
    this.isTransitioning = true;
    this.transitionProgress = 0;
    this.transitionDuration = duration;

    this.transitionStartPosition.copy(this.currentPosition);
    this.transitionStartTarget.copy(this.currentTarget);

    this.transitionEndPosition.set(endPosition.x, endPosition.y, endPosition.z);
    this.transitionEndTarget.set(endTarget.x, endTarget.y, endTarget.z);
  }

  private updateTransition(dt: number): void {
    this.transitionProgress += dt / this.transitionDuration;

    if (this.transitionProgress >= 1) {
      this.transitionProgress = 1;
      this.isTransitioning = false;
    }

    // 이징 함수 (smoothstep)
    const t = this.easeInOutCubic(this.transitionProgress);

    // 위치 보간
    this.currentPosition.lerpVectors(
      this.transitionStartPosition,
      this.transitionEndPosition,
      t
    );

    // 타겟 보간
    this.currentTarget.lerpVectors(
      this.transitionStartTarget,
      this.transitionEndTarget,
      t
    );

    // 구면 좌표 업데이트
    if (!this.isTransitioning) {
      this.spherical = this.positionToSpherical(this.currentPosition, this.currentTarget);
      this.targetSpherical = { ...this.spherical };
      this.targetTarget.copy(this.currentTarget);
      this.targetPosition.copy(this.currentPosition);
    }
  }

  private easeInOutCubic(t: number): number {
    return t < 0.5
      ? 4 * t * t * t
      : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  // ========================================
  // 내부 메서드 - 모드 접근용
  // ========================================

  /** @internal */
  _setTargetSpherical(radius: number, theta: number, phi: number): void {
    this.targetSpherical.radius = radius;
    this.targetSpherical.theta = theta;
    this.targetSpherical.phi = phi;
  }

  /** @internal */
  _setTargetTarget(x: number, y: number, z: number): void {
    this.targetTarget.set(x, y, z);
  }

  /** @internal */
  _getSpherical(): { radius: number; theta: number; phi: number } {
    return { ...this.spherical };
  }

  /** @internal */
  _getTargetTarget(): THREE.Vector3 {
    return this.targetTarget.clone();
  }
}

export default CameraController;





