/**
 * Gin7 ScreenEffects - 화면 효과 시스템
 * 
 * 기능:
 * - 화면 흔들림 (대폭발)
 * - 플래시 효과 (피격)
 * - 비네트 효과 (위험)
 * - 페이드 인/아웃
 * - 색조 효과
 */

// ========================================
// 타입 정의
// ========================================

/** 화면 효과 타입 */
export type ScreenEffectType = 
  | 'shake'     // 화면 흔들림
  | 'flash'     // 플래시
  | 'vignette'  // 비네트
  | 'fade'      // 페이드
  | 'tint'      // 색조
  | 'blur';     // 블러

/** 화면 흔들림 설정 */
export interface ShakeConfig {
  intensity: number;
  duration: number;
  frequency: number;
  decay: boolean;
}

/** 플래시 설정 */
export interface FlashConfig {
  color: { r: number; g: number; b: number; a: number };
  duration: number;
  intensity: number;
}

/** 비네트 설정 */
export interface VignetteConfig {
  intensity: number;
  color: { r: number; g: number; b: number };
  duration: number;
  pulse?: boolean;
  pulseSpeed?: number;
}

/** 페이드 설정 */
export interface FadeConfig {
  color: { r: number; g: number; b: number };
  duration: number;
  direction: 'in' | 'out';
}

/** 색조 설정 */
export interface TintConfig {
  color: { r: number; g: number; b: number };
  intensity: number;
  duration: number;
}

/** 활성 효과 */
interface ActiveEffect {
  id: string;
  type: ScreenEffectType;
  config: ShakeConfig | FlashConfig | VignetteConfig | FadeConfig | TintConfig;
  elapsed: number;
  active: boolean;
}

/** 화면 변환 상태 */
export interface ScreenTransform {
  offsetX: number;
  offsetY: number;
  rotation: number;
  scale: number;
}

/** 화면 오버레이 상태 */
export interface ScreenOverlay {
  flash: { r: number; g: number; b: number; a: number };
  vignette: { intensity: number; color: { r: number; g: number; b: number } };
  fade: { r: number; g: number; b: number; a: number };
  tint: { r: number; g: number; b: number; intensity: number };
}

// ========================================
// Gin7ScreenEffects 클래스
// ========================================

export class Gin7ScreenEffects {
  // 활성 효과
  private effects: Map<string, ActiveEffect> = new Map();
  private effectIdCounter = 0;

  // 현재 상태
  private transform: ScreenTransform = {
    offsetX: 0,
    offsetY: 0,
    rotation: 0,
    scale: 1,
  };

  private overlay: ScreenOverlay = {
    flash: { r: 255, g: 255, b: 255, a: 0 },
    vignette: { intensity: 0, color: { r: 0, g: 0, b: 0 } },
    fade: { r: 0, g: 0, b: 0, a: 0 },
    tint: { r: 255, g: 255, b: 255, intensity: 0 },
  };

  // 콜백
  private transformCallback: ((transform: ScreenTransform) => void) | null = null;
  private overlayCallback: ((overlay: ScreenOverlay) => void) | null = null;

  constructor() {
    // 초기화
  }

  // ========================================
  // 효과 생성
  // ========================================

  /**
   * 화면 흔들림
   */
  shake(
    intensity = 10,
    duration = 0.3,
    options?: { frequency?: number; decay?: boolean }
  ): string {
    const id = this.generateId('shake');
    
    const effect: ActiveEffect = {
      id,
      type: 'shake',
      config: {
        intensity,
        duration,
        frequency: options?.frequency ?? 30,
        decay: options?.decay ?? true,
      } as ShakeConfig,
      elapsed: 0,
      active: true,
    };

    this.effects.set(id, effect);
    return id;
  }

  /**
   * 플래시 효과
   */
  flash(
    color = { r: 255, g: 255, b: 255 },
    duration = 0.1,
    intensity = 1
  ): string {
    const id = this.generateId('flash');
    
    const effect: ActiveEffect = {
      id,
      type: 'flash',
      config: {
        color: { ...color, a: intensity },
        duration,
        intensity,
      } as FlashConfig,
      elapsed: 0,
      active: true,
    };

    this.effects.set(id, effect);
    return id;
  }

  /**
   * 비네트 효과 (화면 가장자리 어둡게)
   */
  vignette(
    intensity = 0.5,
    duration = 1,
    options?: { color?: { r: number; g: number; b: number }; pulse?: boolean; pulseSpeed?: number }
  ): string {
    const id = this.generateId('vignette');
    
    const effect: ActiveEffect = {
      id,
      type: 'vignette',
      config: {
        intensity,
        color: options?.color ?? { r: 255, g: 0, b: 0 },
        duration,
        pulse: options?.pulse ?? false,
        pulseSpeed: options?.pulseSpeed ?? 2,
      } as VignetteConfig,
      elapsed: 0,
      active: true,
    };

    this.effects.set(id, effect);
    return id;
  }

  /**
   * 페이드 인/아웃
   */
  fade(
    direction: 'in' | 'out',
    duration = 1,
    color = { r: 0, g: 0, b: 0 }
  ): string {
    const id = this.generateId('fade');
    
    const effect: ActiveEffect = {
      id,
      type: 'fade',
      config: {
        color,
        duration,
        direction,
      } as FadeConfig,
      elapsed: 0,
      active: true,
    };

    this.effects.set(id, effect);
    return id;
  }

  /**
   * 색조 효과
   */
  tint(
    color = { r: 255, g: 0, b: 0 },
    intensity = 0.3,
    duration = 0.5
  ): string {
    const id = this.generateId('tint');
    
    const effect: ActiveEffect = {
      id,
      type: 'tint',
      config: {
        color,
        intensity,
        duration,
      } as TintConfig,
      elapsed: 0,
      active: true,
    };

    this.effects.set(id, effect);
    return id;
  }

  /**
   * ID 생성
   */
  private generateId(prefix: string): string {
    return `${prefix}_${++this.effectIdCounter}`;
  }

  // ========================================
  // 프리셋 효과
  // ========================================

  /**
   * 대폭발 효과 (흔들림 + 플래시)
   */
  bigExplosion(): void {
    this.shake(20, 0.5, { frequency: 40, decay: true });
    this.flash({ r: 255, g: 200, b: 100 }, 0.15, 0.8);
  }

  /**
   * 소형 폭발 효과
   */
  smallExplosion(): void {
    this.shake(5, 0.2, { frequency: 30, decay: true });
  }

  /**
   * 피격 효과 (빨간 플래시 + 흔들림)
   */
  hit(): void {
    this.flash({ r: 255, g: 100, b: 100 }, 0.1, 0.4);
    this.shake(3, 0.1, { decay: true });
  }

  /**
   * 위험 경고 (비네트 펄스)
   */
  danger(duration = 2): string {
    return this.vignette(0.6, duration, {
      color: { r: 200, g: 0, b: 0 },
      pulse: true,
      pulseSpeed: 3,
    });
  }

  /**
   * 함선 파괴 효과
   */
  shipDestroyed(isCapital = false): void {
    if (isCapital) {
      this.shake(30, 0.8, { frequency: 50, decay: true });
      this.flash({ r: 255, g: 255, b: 255 }, 0.3, 1);
      this.tint({ r: 255, g: 200, b: 100 }, 0.3, 0.5);
    } else {
      this.shake(10, 0.3, { frequency: 35, decay: true });
      this.flash({ r: 255, g: 200, b: 100 }, 0.1, 0.5);
    }
  }

  /**
   * 와프 진입 효과
   */
  warpIn(): void {
    this.flash({ r: 100, g: 150, b: 255 }, 0.5, 0.6);
    this.tint({ r: 100, g: 150, b: 255 }, 0.4, 0.8);
  }

  /**
   * 와프 이탈 효과
   */
  warpOut(): void {
    this.flash({ r: 255, g: 255, b: 255 }, 0.3, 0.8);
  }

  /**
   * 승리 효과
   */
  victory(): void {
    this.flash({ r: 255, g: 220, b: 100 }, 0.5, 0.6);
  }

  /**
   * 패배 효과
   */
  defeat(): void {
    this.tint({ r: 50, g: 50, b: 80 }, 0.5, 2);
    this.vignette(0.7, 3, { color: { r: 0, g: 0, b: 0 } });
  }

  // ========================================
  // 업데이트
  // ========================================

  /**
   * 효과 업데이트
   */
  update(deltaTime: number): void {
    // 변환 초기화
    this.transform = {
      offsetX: 0,
      offsetY: 0,
      rotation: 0,
      scale: 1,
    };

    // 오버레이 초기화
    this.overlay = {
      flash: { r: 255, g: 255, b: 255, a: 0 },
      vignette: { intensity: 0, color: { r: 0, g: 0, b: 0 } },
      fade: { r: 0, g: 0, b: 0, a: 0 },
      tint: { r: 255, g: 255, b: 255, intensity: 0 },
    };

    // 효과 처리
    for (const [id, effect] of this.effects) {
      if (!effect.active) {
        this.effects.delete(id);
        continue;
      }

      effect.elapsed += deltaTime;

      switch (effect.type) {
        case 'shake':
          this.updateShake(effect);
          break;
        case 'flash':
          this.updateFlash(effect);
          break;
        case 'vignette':
          this.updateVignette(effect);
          break;
        case 'fade':
          this.updateFade(effect);
          break;
        case 'tint':
          this.updateTint(effect);
          break;
      }
    }

    // 콜백 호출
    if (this.transformCallback) {
      this.transformCallback(this.transform);
    }
    if (this.overlayCallback) {
      this.overlayCallback(this.overlay);
    }
  }

  /**
   * 흔들림 업데이트
   */
  private updateShake(effect: ActiveEffect): void {
    const config = effect.config as ShakeConfig;
    const progress = effect.elapsed / config.duration;

    if (progress >= 1) {
      effect.active = false;
      return;
    }

    // 감쇠 계수
    const decay = config.decay ? 1 - progress : 1;

    // 랜덤 오프셋
    const time = effect.elapsed * config.frequency;
    const offsetX = Math.sin(time * 2.3) * config.intensity * decay;
    const offsetY = Math.cos(time * 1.7) * config.intensity * decay;

    this.transform.offsetX += offsetX;
    this.transform.offsetY += offsetY;
  }

  /**
   * 플래시 업데이트
   */
  private updateFlash(effect: ActiveEffect): void {
    const config = effect.config as FlashConfig;
    const progress = effect.elapsed / config.duration;

    if (progress >= 1) {
      effect.active = false;
      return;
    }

    // 페이드 아웃
    const alpha = (1 - progress) * config.intensity;

    this.overlay.flash = {
      r: config.color.r,
      g: config.color.g,
      b: config.color.b,
      a: alpha,
    };
  }

  /**
   * 비네트 업데이트
   */
  private updateVignette(effect: ActiveEffect): void {
    const config = effect.config as VignetteConfig;
    const progress = effect.elapsed / config.duration;

    if (progress >= 1) {
      effect.active = false;
      return;
    }

    let intensity = config.intensity;

    // 펄스 효과
    if (config.pulse) {
      const pulsePhase = Math.sin(effect.elapsed * (config.pulseSpeed ?? 2) * Math.PI * 2);
      intensity *= 0.5 + pulsePhase * 0.5;
    }

    // 페이드 아웃
    if (progress > 0.7) {
      intensity *= 1 - (progress - 0.7) / 0.3;
    }

    this.overlay.vignette = {
      intensity,
      color: config.color,
    };
  }

  /**
   * 페이드 업데이트
   */
  private updateFade(effect: ActiveEffect): void {
    const config = effect.config as FadeConfig;
    const progress = effect.elapsed / config.duration;

    if (progress >= 1) {
      effect.active = false;
      return;
    }

    const alpha = config.direction === 'out' ? progress : 1 - progress;

    this.overlay.fade = {
      r: config.color.r,
      g: config.color.g,
      b: config.color.b,
      a: alpha,
    };
  }

  /**
   * 색조 업데이트
   */
  private updateTint(effect: ActiveEffect): void {
    const config = effect.config as TintConfig;
    const progress = effect.elapsed / config.duration;

    if (progress >= 1) {
      effect.active = false;
      return;
    }

    // 페이드 인/아웃
    let intensity = config.intensity;
    if (progress < 0.2) {
      intensity *= progress / 0.2;
    } else if (progress > 0.8) {
      intensity *= 1 - (progress - 0.8) / 0.2;
    }

    this.overlay.tint = {
      r: config.color.r,
      g: config.color.g,
      b: config.color.b,
      intensity,
    };
  }

  // ========================================
  // 제어
  // ========================================

  /**
   * 특정 효과 정지
   */
  stop(id: string): void {
    this.effects.delete(id);
  }

  /**
   * 타입별 효과 정지
   */
  stopByType(type: ScreenEffectType): void {
    for (const [id, effect] of this.effects) {
      if (effect.type === type) {
        this.effects.delete(id);
      }
    }
  }

  /**
   * 모든 효과 정지
   */
  stopAll(): void {
    this.effects.clear();
  }

  /**
   * 변환 콜백 설정
   */
  setTransformCallback(callback: (transform: ScreenTransform) => void): void {
    this.transformCallback = callback;
  }

  /**
   * 오버레이 콜백 설정
   */
  setOverlayCallback(callback: (overlay: ScreenOverlay) => void): void {
    this.overlayCallback = callback;
  }

  // ========================================
  // 상태 조회
  // ========================================

  /**
   * 현재 변환 상태
   */
  getTransform(): ScreenTransform {
    return { ...this.transform };
  }

  /**
   * 현재 오버레이 상태
   */
  getOverlay(): ScreenOverlay {
    return {
      flash: { ...this.overlay.flash },
      vignette: {
        intensity: this.overlay.vignette.intensity,
        color: { ...this.overlay.vignette.color },
      },
      fade: { ...this.overlay.fade },
      tint: { ...this.overlay.tint },
    };
  }

  /**
   * 활성 효과 수
   */
  getActiveEffectCount(): number {
    return this.effects.size;
  }

  // ========================================
  // 정리
  // ========================================

  /**
   * 리소스 정리
   */
  dispose(): void {
    this.effects.clear();
    this.transformCallback = null;
    this.overlayCallback = null;
    console.log('🎬 [Gin7Screen] Disposed');
  }
}

export default Gin7ScreenEffects;















