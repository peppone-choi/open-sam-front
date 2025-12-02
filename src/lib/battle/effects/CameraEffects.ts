/**
 * CameraEffects - 카메라 효과 시스템
 * 
 * 지원 효과:
 * - shake: 화면 흔들림 (폭발, 충격 시)
 * - slowMotion: 슬로우모션 (결정적 순간)
 * - zoomTo: 특정 대상으로 줌
 * - fadeToBlack: 페이드 아웃/인
 * - flashWhite: 화이트 플래시 (강한 충격)
 * - focus: 피사계 심도 블러 (미구현, 향후 추가)
 * 
 * Three.js 카메라 + CSS 오버레이 조합
 */

import * as THREE from 'three';

// ========================================
// 타입 정의
// ========================================

/** 이징 함수 타입 */
export type EasingFunction = (t: number) => number;

/** 카메라 효과 상태 */
export interface CameraEffectState {
  shaking: boolean;
  slowMotion: boolean;
  zooming: boolean;
  fading: boolean;
  flashing: boolean;
}

/** 흔들림 설정 */
export interface ShakeConfig {
  intensity: number;      // 흔들림 강도 (0-1)
  duration: number;       // 지속 시간 (초)
  frequency?: number;     // 흔들림 빈도
  decay?: boolean;        // 점점 감소 여부
  direction?: THREE.Vector3; // 흔들림 방향 (없으면 전방향)
}

/** 슬로우모션 설정 */
export interface SlowMotionConfig {
  scale: number;          // 시간 스케일 (0.1 = 10배 느림)
  duration: number;       // 실제 경과 시간 (초)
  easeIn?: number;        // 진입 시간 (초)
  easeOut?: number;       // 종료 시간 (초)
}

/** 줌 설정 */
export interface ZoomConfig {
  target: THREE.Vector3;  // 줌 타겟 위치
  zoom: number;           // 목표 줌 레벨 (FOV 또는 거리)
  duration: number;       // 지속 시간 (초)
  easing?: EasingFunction;
  holdTime?: number;      // 유지 시간 (초)
  returnToOriginal?: boolean; // 원래 위치로 복귀
}

/** 페이드 설정 */
export interface FadeConfig {
  duration: number;       // 지속 시간 (초)
  color?: string;         // 페이드 색상 (기본: black)
  hold?: number;          // 유지 시간 (초)
  fadeOut?: boolean;      // true: 페이드 아웃, false: 페이드 인
}

/** 플래시 설정 */
export interface FlashConfig {
  duration: number;       // 지속 시간 (초)
  color?: string;         // 플래시 색상 (기본: white)
  intensity?: number;     // 강도 (0-1)
}

// ========================================
// 이징 함수
// ========================================

export const Easing = {
  linear: (t: number) => t,
  
  easeInQuad: (t: number) => t * t,
  easeOutQuad: (t: number) => t * (2 - t),
  easeInOutQuad: (t: number) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
  
  easeInCubic: (t: number) => t * t * t,
  easeOutCubic: (t: number) => (--t) * t * t + 1,
  easeInOutCubic: (t: number) => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,
  
  easeInExpo: (t: number) => t === 0 ? 0 : Math.pow(2, 10 * (t - 1)),
  easeOutExpo: (t: number) => t === 1 ? 1 : 1 - Math.pow(2, -10 * t),
  easeInOutExpo: (t: number) => {
    if (t === 0) return 0;
    if (t === 1) return 1;
    if (t < 0.5) return Math.pow(2, 20 * t - 10) / 2;
    return (2 - Math.pow(2, -20 * t + 10)) / 2;
  },
  
  easeOutElastic: (t: number) => {
    const c4 = (2 * Math.PI) / 3;
    return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
  },
  
  easeOutBounce: (t: number) => {
    const n1 = 7.5625;
    const d1 = 2.75;
    if (t < 1 / d1) return n1 * t * t;
    if (t < 2 / d1) return n1 * (t -= 1.5 / d1) * t + 0.75;
    if (t < 2.5 / d1) return n1 * (t -= 2.25 / d1) * t + 0.9375;
    return n1 * (t -= 2.625 / d1) * t + 0.984375;
  },
};

// ========================================
// CameraEffects 클래스
// ========================================

export class CameraEffects {
  private camera: THREE.PerspectiveCamera;
  private domElement: HTMLElement | null = null;
  
  // 원본 카메라 상태 저장
  private originalPosition = new THREE.Vector3();
  private originalRotation = new THREE.Euler();
  private originalFOV = 60;
  
  // 효과 상태
  private state: CameraEffectState = {
    shaking: false,
    slowMotion: false,
    zooming: false,
    fading: false,
    flashing: false,
  };
  
  // 시간 스케일 (슬로우모션)
  private timeScale = 1;
  private targetTimeScale = 1;
  private timeScaleTransitionSpeed = 0;
  
  // 흔들림 상태
  private shakeOffset = new THREE.Vector3();
  private shakeIntensity = 0;
  private shakeFrequency = 20;
  private shakeStartTime = 0;
  private shakeDuration = 0;
  private shakeDecay = true;
  private shakeDirection: THREE.Vector3 | null = null;
  
  // 줌 상태
  private zoomStartPosition = new THREE.Vector3();
  private zoomTargetPosition = new THREE.Vector3();
  private zoomStartFOV = 60;
  private zoomTargetFOV = 60;
  private zoomStartTime = 0;
  private zoomDuration = 0;
  private zoomEasing: EasingFunction = Easing.easeInOutQuad;
  private zoomHoldTime = 0;
  private zoomReturnToOriginal = true;
  private zoomPhase: 'zoom_in' | 'hold' | 'zoom_out' | 'idle' = 'idle';
  
  // CSS 오버레이 요소
  private overlayElement: HTMLDivElement | null = null;
  private fadeOverlay: HTMLDivElement | null = null;
  private flashOverlay: HTMLDivElement | null = null;
  
  // 메트릭
  private metrics = {
    activeEffects: 0,
    totalEffectsTriggered: 0,
  };

  constructor(camera: THREE.PerspectiveCamera, domElement?: HTMLElement) {
    this.camera = camera;
    this.domElement = domElement || null;
    
    // 원본 상태 저장
    this.saveOriginalState();
    
    // 오버레이 초기화
    if (this.domElement) {
      this.initializeOverlays();
    }
  }
  
  private saveOriginalState(): void {
    this.originalPosition.copy(this.camera.position);
    this.originalRotation.copy(this.camera.rotation);
    this.originalFOV = this.camera.fov;
  }
  
  private initializeOverlays(): void {
    if (!this.domElement) return;
    
    // 컨테이너 오버레이
    this.overlayElement = document.createElement('div');
    this.overlayElement.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 1000;
    `;
    
    // 페이드 오버레이
    this.fadeOverlay = document.createElement('div');
    this.fadeOverlay.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: black;
      opacity: 0;
      transition: opacity 0s linear;
    `;
    
    // 플래시 오버레이
    this.flashOverlay = document.createElement('div');
    this.flashOverlay.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: white;
      opacity: 0;
      pointer-events: none;
    `;
    
    this.overlayElement.appendChild(this.fadeOverlay);
    this.overlayElement.appendChild(this.flashOverlay);
    this.domElement.appendChild(this.overlayElement);
  }

  // ========================================
  // 화면 흔들림
  // ========================================
  
  /**
   * 화면 흔들림 효과
   */
  shake(config: ShakeConfig): void {
    this.state.shaking = true;
    this.shakeIntensity = config.intensity;
    this.shakeDuration = config.duration;
    this.shakeFrequency = config.frequency ?? 20;
    this.shakeDecay = config.decay ?? true;
    this.shakeDirection = config.direction || null;
    this.shakeStartTime = performance.now() / 1000;
    
    this.metrics.totalEffectsTriggered++;
    this.updateActiveEffectsCount();
  }
  
  /**
   * 강한 흔들림 프리셋
   */
  shakeHeavy(duration: number = 0.5): void {
    this.shake({
      intensity: 0.8,
      duration,
      frequency: 25,
      decay: true,
    });
  }
  
  /**
   * 가벼운 흔들림 프리셋
   */
  shakeLight(duration: number = 0.3): void {
    this.shake({
      intensity: 0.3,
      duration,
      frequency: 30,
      decay: true,
    });
  }
  
  /**
   * 폭발 흔들림 프리셋
   */
  shakeExplosion(intensity: number = 1): void {
    this.shake({
      intensity: intensity * 1.0,
      duration: 0.8,
      frequency: 15,
      decay: true,
    });
  }
  
  /**
   * 충격 흔들림 프리셋
   */
  shakeImpact(direction?: THREE.Vector3): void {
    this.shake({
      intensity: 0.5,
      duration: 0.3,
      frequency: 35,
      decay: true,
      direction,
    });
  }
  
  private updateShake(time: number): void {
    if (!this.state.shaking) return;
    
    const elapsed = time - this.shakeStartTime;
    
    if (elapsed >= this.shakeDuration) {
      this.state.shaking = false;
      this.shakeOffset.set(0, 0, 0);
      this.updateActiveEffectsCount();
      return;
    }
    
    // 감쇠 계산
    let intensity = this.shakeIntensity;
    if (this.shakeDecay) {
      intensity *= 1 - (elapsed / this.shakeDuration);
    }
    
    // 노이즈 기반 흔들림
    const t = elapsed * this.shakeFrequency;
    
    if (this.shakeDirection) {
      // 방향성 흔들림
      const noise = Math.sin(t * Math.PI) * Math.sin(t * 2.3) * Math.sin(t * 0.7);
      this.shakeOffset.copy(this.shakeDirection).multiplyScalar(noise * intensity);
    } else {
      // 전방향 흔들림
      this.shakeOffset.set(
        Math.sin(t * Math.PI) * Math.sin(t * 2.3) * intensity,
        Math.cos(t * 1.7) * Math.sin(t * 3.1) * intensity * 0.5,
        Math.sin(t * 0.9) * Math.cos(t * 2.7) * intensity * 0.3
      );
    }
  }

  // ========================================
  // 슬로우모션
  // ========================================
  
  /**
   * 슬로우모션 효과
   */
  slowMotion(config: SlowMotionConfig): Promise<void> {
    return new Promise((resolve) => {
      this.state.slowMotion = true;
      this.targetTimeScale = config.scale;
      
      const easeInTime = config.easeIn ?? 0.2;
      const easeOutTime = config.easeOut ?? 0.2;
      const holdTime = config.duration - easeInTime - easeOutTime;
      
      this.metrics.totalEffectsTriggered++;
      this.updateActiveEffectsCount();
      
      // 진입 페이즈
      this.timeScaleTransitionSpeed = (config.scale - 1) / easeInTime;
      
      // 유지 페이즈 타이머
      const holdTimer = setTimeout(() => {
        // 종료 페이즈
        this.targetTimeScale = 1;
        this.timeScaleTransitionSpeed = (1 - config.scale) / easeOutTime;
        
        // 완료 타이머
        const endTimer = setTimeout(() => {
          this.state.slowMotion = false;
          this.timeScale = 1;
          this.targetTimeScale = 1;
          this.updateActiveEffectsCount();
          resolve();
        }, easeOutTime * 1000 / config.scale); // 실제 시간으로 계산
        
      }, (easeInTime + holdTime) * 1000 / config.scale);
    });
  }
  
  /**
   * 킬캠 슬로우모션
   */
  killcamSlowMotion(duration: number = 1.5): Promise<void> {
    return this.slowMotion({
      scale: 0.2,
      duration,
      easeIn: 0.1,
      easeOut: 0.3,
    });
  }
  
  /**
   * 드라마틱 슬로우모션
   */
  dramaticSlowMotion(duration: number = 2): Promise<void> {
    return this.slowMotion({
      scale: 0.1,
      duration,
      easeIn: 0.2,
      easeOut: 0.5,
    });
  }
  
  /**
   * 현재 시간 스케일 반환
   */
  getTimeScale(): number {
    return this.timeScale;
  }
  
  private updateSlowMotion(deltaTime: number): void {
    if (Math.abs(this.timeScale - this.targetTimeScale) > 0.001) {
      const diff = this.targetTimeScale - this.timeScale;
      const change = Math.sign(diff) * Math.abs(this.timeScaleTransitionSpeed) * deltaTime;
      
      if (Math.abs(change) >= Math.abs(diff)) {
        this.timeScale = this.targetTimeScale;
      } else {
        this.timeScale += change;
      }
    }
  }

  // ========================================
  // 줌 효과
  // ========================================
  
  /**
   * 특정 대상으로 줌
   */
  zoomTo(config: ZoomConfig): Promise<void> {
    return new Promise((resolve) => {
      this.state.zooming = true;
      this.zoomPhase = 'zoom_in';
      
      this.zoomStartPosition.copy(this.camera.position);
      this.zoomStartFOV = this.camera.fov;
      
      // 타겟 위치 계산 (타겟을 향해 접근)
      const direction = new THREE.Vector3().subVectors(config.target, this.camera.position).normalize();
      const distance = this.camera.position.distanceTo(config.target);
      const targetDistance = distance * (1 - config.zoom * 0.5); // zoom이 높을수록 가까이
      
      this.zoomTargetPosition.copy(config.target).sub(direction.multiplyScalar(targetDistance));
      this.zoomTargetFOV = this.originalFOV / config.zoom;
      
      this.zoomDuration = config.duration;
      this.zoomEasing = config.easing || Easing.easeInOutQuad;
      this.zoomHoldTime = config.holdTime ?? 0;
      this.zoomReturnToOriginal = config.returnToOriginal ?? true;
      this.zoomStartTime = performance.now() / 1000;
      
      this.metrics.totalEffectsTriggered++;
      this.updateActiveEffectsCount();
      
      // 완료 감지
      const checkComplete = () => {
        if (this.zoomPhase === 'idle') {
          resolve();
        } else {
          requestAnimationFrame(checkComplete);
        }
      };
      checkComplete();
    });
  }
  
  /**
   * 빠른 줌 프리셋
   */
  quickZoom(target: THREE.Vector3, zoomLevel: number = 2): Promise<void> {
    return this.zoomTo({
      target,
      zoom: zoomLevel,
      duration: 0.3,
      holdTime: 0.5,
      returnToOriginal: true,
    });
  }
  
  /**
   * 시네마틱 줌 프리셋
   */
  cinematicZoom(target: THREE.Vector3): Promise<void> {
    return this.zoomTo({
      target,
      zoom: 3,
      duration: 1,
      holdTime: 2,
      easing: Easing.easeInOutCubic,
      returnToOriginal: true,
    });
  }
  
  private updateZoom(time: number): void {
    if (!this.state.zooming) return;
    
    const elapsed = time - this.zoomStartTime;
    
    switch (this.zoomPhase) {
      case 'zoom_in': {
        const progress = Math.min(1, elapsed / this.zoomDuration);
        const eased = this.zoomEasing(progress);
        
        // 위치 보간
        this.camera.position.lerpVectors(this.zoomStartPosition, this.zoomTargetPosition, eased);
        
        // FOV 보간
        this.camera.fov = this.zoomStartFOV + (this.zoomTargetFOV - this.zoomStartFOV) * eased;
        this.camera.updateProjectionMatrix();
        
        if (progress >= 1) {
          this.zoomPhase = 'hold';
          this.zoomStartTime = time;
        }
        break;
      }
      
      case 'hold': {
        if (elapsed >= this.zoomHoldTime) {
          if (this.zoomReturnToOriginal) {
            this.zoomPhase = 'zoom_out';
            this.zoomStartTime = time;
            // 시작점과 끝점 교환
            this.zoomStartPosition.copy(this.camera.position);
            this.zoomTargetPosition.copy(this.originalPosition);
            this.zoomStartFOV = this.camera.fov;
            this.zoomTargetFOV = this.originalFOV;
          } else {
            this.zoomPhase = 'idle';
            this.state.zooming = false;
            this.updateActiveEffectsCount();
          }
        }
        break;
      }
      
      case 'zoom_out': {
        const progress = Math.min(1, elapsed / this.zoomDuration);
        const eased = this.zoomEasing(progress);
        
        // 위치 보간
        this.camera.position.lerpVectors(this.zoomStartPosition, this.zoomTargetPosition, eased);
        
        // FOV 보간
        this.camera.fov = this.zoomStartFOV + (this.zoomTargetFOV - this.zoomStartFOV) * eased;
        this.camera.updateProjectionMatrix();
        
        if (progress >= 1) {
          this.zoomPhase = 'idle';
          this.state.zooming = false;
          this.updateActiveEffectsCount();
        }
        break;
      }
    }
  }

  // ========================================
  // 페이드 효과
  // ========================================
  
  /**
   * 페이드 투 블랙
   */
  fadeToBlack(duration: number, hold: number = 0): Promise<void> {
    return this.fade({
      duration,
      color: 'black',
      hold,
      fadeOut: true,
    });
  }
  
  /**
   * 페이드 프롬 블랙
   */
  fadeFromBlack(duration: number): Promise<void> {
    if (!this.fadeOverlay) return Promise.resolve();
    
    // 먼저 검은 화면으로 설정
    this.fadeOverlay.style.opacity = '1';
    
    return this.fade({
      duration,
      color: 'black',
      fadeOut: false,
    });
  }
  
  /**
   * 일반 페이드 효과
   */
  fade(config: FadeConfig): Promise<void> {
    return new Promise((resolve) => {
      if (!this.fadeOverlay) {
        resolve();
        return;
      }
      
      this.state.fading = true;
      const color = config.color || 'black';
      const hold = config.hold ?? 0;
      
      this.fadeOverlay.style.backgroundColor = color;
      this.fadeOverlay.style.transition = `opacity ${config.duration}s linear`;
      
      this.metrics.totalEffectsTriggered++;
      this.updateActiveEffectsCount();
      
      if (config.fadeOut) {
        // 페이드 아웃 (투명 → 불투명)
        this.fadeOverlay.style.opacity = '0';
        requestAnimationFrame(() => {
          this.fadeOverlay!.style.opacity = '1';
        });
        
        setTimeout(() => {
          if (hold > 0) {
            setTimeout(() => {
              this.state.fading = false;
              this.updateActiveEffectsCount();
              resolve();
            }, hold * 1000);
          } else {
            this.state.fading = false;
            this.updateActiveEffectsCount();
            resolve();
          }
        }, config.duration * 1000);
      } else {
        // 페이드 인 (불투명 → 투명)
        this.fadeOverlay.style.opacity = '1';
        requestAnimationFrame(() => {
          this.fadeOverlay!.style.opacity = '0';
        });
        
        setTimeout(() => {
          this.state.fading = false;
          this.updateActiveEffectsCount();
          resolve();
        }, config.duration * 1000);
      }
    });
  }

  // ========================================
  // 플래시 효과
  // ========================================
  
  /**
   * 화이트 플래시
   */
  flashWhite(duration: number = 0.1, intensity: number = 1): Promise<void> {
    return this.flash({
      duration,
      color: 'white',
      intensity,
    });
  }
  
  /**
   * 레드 플래시 (데미지)
   */
  flashRed(duration: number = 0.15, intensity: number = 0.5): Promise<void> {
    return this.flash({
      duration,
      color: 'rgba(255, 0, 0, 0.8)',
      intensity,
    });
  }
  
  /**
   * 일반 플래시 효과
   */
  flash(config: FlashConfig): Promise<void> {
    return new Promise((resolve) => {
      if (!this.flashOverlay) {
        resolve();
        return;
      }
      
      this.state.flashing = true;
      const color = config.color || 'white';
      const intensity = config.intensity ?? 1;
      
      this.flashOverlay.style.backgroundColor = color;
      this.flashOverlay.style.opacity = String(intensity);
      
      this.metrics.totalEffectsTriggered++;
      this.updateActiveEffectsCount();
      
      // 페이드 아웃
      setTimeout(() => {
        if (this.flashOverlay) {
          this.flashOverlay.style.transition = `opacity ${config.duration}s ease-out`;
          this.flashOverlay.style.opacity = '0';
        }
        
        setTimeout(() => {
          if (this.flashOverlay) {
            this.flashOverlay.style.transition = '';
          }
          this.state.flashing = false;
          this.updateActiveEffectsCount();
          resolve();
        }, config.duration * 1000);
      }, 16); // 1프레임 대기
    });
  }

  // ========================================
  // 복합 효과
  // ========================================
  
  /**
   * 임팩트 효과 (흔들림 + 플래시)
   */
  impact(intensity: number = 0.5): void {
    this.shakeImpact();
    this.flashWhite(0.05, intensity * 0.3);
  }
  
  /**
   * 폭발 효과 (강한 흔들림 + 플래시)
   */
  explosion(intensity: number = 1): void {
    this.shakeExplosion(intensity);
    this.flashWhite(0.08, intensity * 0.5);
  }
  
  /**
   * 킬 이펙트 (슬로우모션 + 줌)
   */
  async killEffect(target: THREE.Vector3): Promise<void> {
    const slowMo = this.killcamSlowMotion(1.5);
    const zoom = this.quickZoom(target, 2);
    await Promise.all([slowMo, zoom]);
  }
  
  /**
   * 승리 효과 (줌 + 페이드)
   */
  async victoryEffect(target: THREE.Vector3): Promise<void> {
    await this.cinematicZoom(target);
    await this.fadeToBlack(1, 0.5);
  }

  // ========================================
  // 업데이트
  // ========================================
  
  /**
   * 프레임 업데이트 (게임 루프에서 호출)
   */
  update(deltaTime: number): void {
    const time = performance.now() / 1000;
    
    // 흔들림 업데이트
    this.updateShake(time);
    
    // 슬로우모션 업데이트
    this.updateSlowMotion(deltaTime);
    
    // 줌 업데이트
    this.updateZoom(time);
    
    // 흔들림 오프셋 적용
    if (this.state.shaking) {
      // 원본 위치에 오프셋 추가 (줌 중이 아닐 때만)
      if (!this.state.zooming) {
        this.camera.position.add(this.shakeOffset);
      }
    }
  }
  
  /**
   * 스케일된 델타 타임 반환 (슬로우모션 적용)
   */
  getScaledDeltaTime(deltaTime: number): number {
    return deltaTime * this.timeScale;
  }

  // ========================================
  // 유틸리티
  // ========================================
  
  /**
   * 모든 효과 중지
   */
  stopAllEffects(): void {
    this.state = {
      shaking: false,
      slowMotion: false,
      zooming: false,
      fading: false,
      flashing: false,
    };
    
    this.timeScale = 1;
    this.targetTimeScale = 1;
    this.shakeOffset.set(0, 0, 0);
    this.zoomPhase = 'idle';
    
    if (this.fadeOverlay) {
      this.fadeOverlay.style.opacity = '0';
      this.fadeOverlay.style.transition = '';
    }
    
    if (this.flashOverlay) {
      this.flashOverlay.style.opacity = '0';
    }
    
    // 카메라 원위치
    this.camera.position.copy(this.originalPosition);
    this.camera.rotation.copy(this.originalRotation);
    this.camera.fov = this.originalFOV;
    this.camera.updateProjectionMatrix();
    
    this.updateActiveEffectsCount();
  }
  
  /**
   * 원본 상태 업데이트 (카메라 이동 후 호출)
   */
  updateOriginalState(): void {
    this.saveOriginalState();
  }
  
  /**
   * 현재 상태 조회
   */
  getState(): CameraEffectState {
    return { ...this.state };
  }
  
  /**
   * 메트릭 조회
   */
  getMetrics(): typeof this.metrics {
    return { ...this.metrics };
  }
  
  private updateActiveEffectsCount(): void {
    this.metrics.activeEffects = Object.values(this.state).filter(v => v).length;
  }
  
  /**
   * DOM 요소 설정 (지연 초기화용)
   */
  setDomElement(element: HTMLElement): void {
    this.domElement = element;
    this.initializeOverlays();
  }
  
  /**
   * 정리
   */
  dispose(): void {
    this.stopAllEffects();
    
    if (this.overlayElement && this.overlayElement.parentNode) {
      this.overlayElement.parentNode.removeChild(this.overlayElement);
    }
    
    this.overlayElement = null;
    this.fadeOverlay = null;
    this.flashOverlay = null;
  }
}

// ========================================
// 싱글톤 헬퍼
// ========================================

let cameraEffectsInstance: CameraEffects | null = null;

export function initCameraEffects(
  camera: THREE.PerspectiveCamera,
  domElement?: HTMLElement
): CameraEffects {
  if (cameraEffectsInstance) {
    cameraEffectsInstance.dispose();
  }
  cameraEffectsInstance = new CameraEffects(camera, domElement);
  return cameraEffectsInstance;
}

export function getCameraEffects(): CameraEffects | null {
  return cameraEffectsInstance;
}





