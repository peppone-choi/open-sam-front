/**
 * Gin7 VFXManager - 시각 효과 통합 매니저
 * 
 * 기능:
 * - ParticleSystem 관리
 * - ScreenEffects 관리
 * - 전투 이벤트 연동
 * - 품질 설정
 */

import { Gin7ParticleSystem, type Particle, type ParticlePreset } from './Gin7ParticleSystem';
import { 
  Gin7ScreenEffects, 
  type ScreenTransform, 
  type ScreenOverlay 
} from './Gin7ScreenEffects';

// ========================================
// 타입 정의
// ========================================

/** VFX 품질 레벨 */
export type VFXQuality = 'low' | 'medium' | 'high';

/** VFX 매니저 설정 */
export interface Gin7VFXConfig {
  quality?: VFXQuality;
  maxParticles?: number;
  screenEffectsEnabled?: boolean;
  particlesEnabled?: boolean;
}

/** VFX 매니저 상태 */
export interface Gin7VFXState {
  quality: VFXQuality;
  particlesEnabled: boolean;
  screenEffectsEnabled: boolean;
  activeParticles: number;
  activeScreenEffects: number;
  activeEmitters: number;
}

/** 3D 위치 */
export interface Position3D {
  x: number;
  y: number;
  z: number;
}

// ========================================
// 품질 설정
// ========================================

const QUALITY_SETTINGS: Record<VFXQuality, {
  maxParticles: number;
  particleMultiplier: number;
  screenEffectsEnabled: boolean;
}> = {
  low: {
    maxParticles: 500,
    particleMultiplier: 0.3,
    screenEffectsEnabled: true,
  },
  medium: {
    maxParticles: 1000,
    particleMultiplier: 0.6,
    screenEffectsEnabled: true,
  },
  high: {
    maxParticles: 2000,
    particleMultiplier: 1.0,
    screenEffectsEnabled: true,
  },
};

// ========================================
// Gin7VFXManager 클래스
// ========================================

export class Gin7VFXManager {
  // 서브 시스템
  private particleSystem: Gin7ParticleSystem;
  private screenEffects: Gin7ScreenEffects;
  
  // 설정
  private quality: VFXQuality;
  private config: Required<Gin7VFXConfig>;
  
  // 상태
  private initialized = false;
  private paused = false;
  private lastUpdateTime = 0;
  
  // 콜백
  private particleRenderCallback: ((particles: readonly Particle[]) => void) | null = null;
  private transformCallback: ((transform: ScreenTransform) => void) | null = null;
  private overlayCallback: ((overlay: ScreenOverlay) => void) | null = null;

  constructor(config: Gin7VFXConfig = {}) {
    this.quality = config.quality ?? 'medium';
    const qualitySettings = QUALITY_SETTINGS[this.quality];
    
    this.config = {
      quality: this.quality,
      maxParticles: config.maxParticles ?? qualitySettings.maxParticles,
      screenEffectsEnabled: config.screenEffectsEnabled ?? true,
      particlesEnabled: config.particlesEnabled ?? true,
    };
    
    // 시스템 초기화
    this.particleSystem = new Gin7ParticleSystem(this.config.maxParticles);
    this.screenEffects = new Gin7ScreenEffects();
    
    // 콜백 연결
    this.screenEffects.setTransformCallback((transform) => {
      if (this.transformCallback) {
        this.transformCallback(transform);
      }
    });
    
    this.screenEffects.setOverlayCallback((overlay) => {
      if (this.overlayCallback) {
        this.overlayCallback(overlay);
      }
    });
    
    this.particleSystem.setRenderCallback((particles) => {
      if (this.particleRenderCallback) {
        this.particleRenderCallback(particles);
      }
    });
    
    this.initialized = true;
    console.log(`✨ [Gin7VFX] Initialized (quality: ${this.quality})`);
  }

  // ========================================
  // 업데이트
  // ========================================

  /**
   * VFX 시스템 업데이트
   */
  update(deltaTime: number): void {
    if (this.paused) return;
    
    if (this.config.particlesEnabled) {
      this.particleSystem.update(deltaTime);
    }
    
    if (this.config.screenEffectsEnabled) {
      this.screenEffects.update(deltaTime);
    }
    
    this.lastUpdateTime = performance.now();
  }

  // ========================================
  // 전투 이벤트 핸들링
  // ========================================

  /**
   * 전투 이벤트에 따른 VFX 재생
   */
  onBattleEvent(event: { type: string; data?: Record<string, unknown> }): void {
    if (!this.initialized) return;

    const position = event.data?.position as Position3D | undefined;
    const direction = event.data?.direction as Position3D | undefined;

    switch (event.type) {
      case 'BEAM_FIRE':
        if (position && direction) {
          this.beamFire(position, direction);
        }
        break;
        
      case 'BEAM_HIT':
        if (position && direction) {
          this.beamImpact(position, direction);
        }
        break;
        
      case 'MISSILE_LAUNCH':
        if (position && direction) {
          this.missileLaunch(position, direction);
        }
        break;
        
      case 'MISSILE_HIT':
        if (position) {
          this.missileImpact(position);
        }
        break;
        
      case 'SHIELD_HIT':
        if (position && direction) {
          this.shieldHit(position, direction);
        }
        break;
        
      case 'SHIELD_BREAK':
        if (position) {
          this.shieldBreak(position);
        }
        break;
        
      case 'ARMOR_HIT':
        if (position && direction) {
          this.armorHit(position, direction);
        }
        break;
        
      case 'HULL_BREACH':
        if (position) {
          this.hullBreach(position);
        }
        break;
        
      case 'UNIT_DESTROYED':
        if (position) {
          const size = event.data?.size as string;
          this.unitDestroyed(position, size);
        }
        break;
        
      case 'WARP_IN':
        if (position && direction) {
          this.warpIn(position, direction);
        }
        break;
        
      case 'WARP_OUT':
        if (position && direction) {
          this.warpOut(position, direction);
        }
        break;
        
      case 'ENGINE_BOOST':
        if (position && direction) {
          this.engineBoost(position, direction);
        }
        break;
    }
  }

  // ========================================
  // 파티클 효과
  // ========================================

  /**
   * 빔 발사 효과
   */
  beamFire(position: Position3D, direction: Position3D): string | null {
    if (!this.config.particlesEnabled) return null;
    return this.particleSystem.spark(position, direction);
  }

  /**
   * 빔 충격 효과
   */
  beamImpact(position: Position3D, direction: Position3D): string | null {
    if (!this.config.particlesEnabled) return null;
    this.screenEffects.smallExplosion();
    return this.particleSystem.beamImpact(position, direction);
  }

  /**
   * 미사일 발사 효과
   */
  missileLaunch(position: Position3D, direction: Position3D): string | null {
    if (!this.config.particlesEnabled) return null;
    return this.particleSystem.createEmitter('engine_trail', position, direction, 2);
  }

  /**
   * 미사일 충격 효과
   */
  missileImpact(position: Position3D): string | null {
    if (!this.config.particlesEnabled) return null;
    this.screenEffects.smallExplosion();
    return this.particleSystem.explode(position, 'small');
  }

  /**
   * 쉴드 피격 효과
   */
  shieldHit(position: Position3D, normal: Position3D): string | null {
    if (!this.config.particlesEnabled) return null;
    return this.particleSystem.shieldHit(position, normal);
  }

  /**
   * 쉴드 붕괴 효과
   */
  shieldBreak(position: Position3D): string | null {
    if (!this.config.particlesEnabled) return null;
    this.screenEffects.shake(8, 0.3);
    this.screenEffects.flash({ r: 100, g: 150, b: 255 }, 0.2, 0.5);
    return this.particleSystem.shieldBreak(position);
  }

  /**
   * 장갑 피격 효과
   */
  armorHit(position: Position3D, direction: Position3D): string | null {
    if (!this.config.particlesEnabled) return null;
    return this.particleSystem.spark(position, direction);
  }

  /**
   * 선체 관통 효과
   */
  hullBreach(position: Position3D): string | null {
    if (!this.config.particlesEnabled) return null;
    this.screenEffects.hit();
    const debrisId = this.particleSystem.debris(position);
    this.particleSystem.spark(position, { x: 0, y: 1, z: 0 });
    return debrisId;
  }

  /**
   * 유닛 파괴 효과
   */
  unitDestroyed(position: Position3D, size?: string): void {
    if (!this.config.particlesEnabled) return;
    
    const isCapital = size === 'capital' || size === 'battleship';
    const isLarge = size === 'large' || size === 'cruiser';
    
    if (isCapital) {
      this.particleSystem.explode(position, 'large');
      this.particleSystem.debris(position);
      this.particleSystem.createEmitter('explosion_large', position, { x: 0, y: 1, z: 0 });
      this.screenEffects.shipDestroyed(true);
    } else if (isLarge) {
      this.particleSystem.explode(position, 'large');
      this.particleSystem.debris(position);
      this.screenEffects.shipDestroyed(false);
    } else {
      this.particleSystem.explode(position, 'small');
      this.screenEffects.smallExplosion();
    }
  }

  /**
   * 와프 진입 효과
   */
  warpIn(position: Position3D, direction: Position3D): string | null {
    if (!this.config.particlesEnabled) return null;
    this.screenEffects.warpIn();
    return this.particleSystem.warpEffect(position, direction);
  }

  /**
   * 와프 이탈 효과
   */
  warpOut(position: Position3D, direction: Position3D): string | null {
    if (!this.config.particlesEnabled) return null;
    this.screenEffects.warpOut();
    return this.particleSystem.warpEffect(position, direction);
  }

  /**
   * 엔진 부스트 효과
   */
  engineBoost(position: Position3D, direction: Position3D): string | null {
    if (!this.config.particlesEnabled) return null;
    return this.particleSystem.createEngineTrail(position, direction);
  }

  /**
   * 커스텀 파티클 이미터 생성
   */
  createParticleEmitter(
    preset: ParticlePreset,
    position: Position3D,
    direction: Position3D = { x: 0, y: 1, z: 0 },
    duration = 0
  ): string | null {
    if (!this.config.particlesEnabled) return null;
    return this.particleSystem.createEmitter(preset, position, direction, duration);
  }

  /**
   * 이미터 제거
   */
  removeEmitter(id: string): void {
    this.particleSystem.removeEmitter(id);
  }

  // ========================================
  // 화면 효과
  // ========================================

  /**
   * 화면 흔들림
   */
  shake(intensity?: number, duration?: number): string | null {
    if (!this.config.screenEffectsEnabled) return null;
    return this.screenEffects.shake(intensity, duration);
  }

  /**
   * 플래시 효과
   */
  flash(color?: { r: number; g: number; b: number }, duration?: number, intensity?: number): string | null {
    if (!this.config.screenEffectsEnabled) return null;
    return this.screenEffects.flash(color, duration, intensity);
  }

  /**
   * 비네트 효과
   */
  vignette(intensity?: number, duration?: number): string | null {
    if (!this.config.screenEffectsEnabled) return null;
    return this.screenEffects.vignette(intensity, duration);
  }

  /**
   * 위험 경고 효과
   */
  danger(duration?: number): string | null {
    if (!this.config.screenEffectsEnabled) return null;
    return this.screenEffects.danger(duration);
  }

  /**
   * 승리 효과
   */
  victory(): void {
    if (this.config.screenEffectsEnabled) {
      this.screenEffects.victory();
    }
  }

  /**
   * 패배 효과
   */
  defeat(): void {
    if (this.config.screenEffectsEnabled) {
      this.screenEffects.defeat();
    }
  }

  /**
   * 페이드 효과
   */
  fade(direction: 'in' | 'out', duration?: number): string | null {
    if (!this.config.screenEffectsEnabled) return null;
    return this.screenEffects.fade(direction, duration);
  }

  // ========================================
  // 설정
  // ========================================

  /**
   * 품질 설정
   */
  setQuality(quality: VFXQuality): void {
    this.quality = quality;
    this.config.quality = quality;
    
    const settings = QUALITY_SETTINGS[quality];
    // 파티클 시스템 재생성은 비용이 크므로 현재는 스킵
    // 실제 구현에서는 파티클 수 제한 등을 동적으로 조절
    
    console.log(`✨ [Gin7VFX] Quality changed to: ${quality}`);
  }

  /**
   * 파티클 활성화/비활성화
   */
  setParticlesEnabled(enabled: boolean): void {
    this.config.particlesEnabled = enabled;
    if (!enabled) {
      this.particleSystem.clear();
    }
  }

  /**
   * 화면 효과 활성화/비활성화
   */
  setScreenEffectsEnabled(enabled: boolean): void {
    this.config.screenEffectsEnabled = enabled;
    if (!enabled) {
      this.screenEffects.stopAll();
    }
  }

  // ========================================
  // 콜백 설정
  // ========================================

  /**
   * 파티클 렌더링 콜백 설정
   */
  setParticleRenderCallback(callback: (particles: readonly Particle[]) => void): void {
    this.particleRenderCallback = callback;
  }

  /**
   * 화면 변환 콜백 설정
   */
  setTransformCallback(callback: (transform: ScreenTransform) => void): void {
    this.transformCallback = callback;
  }

  /**
   * 화면 오버레이 콜백 설정
   */
  setOverlayCallback(callback: (overlay: ScreenOverlay) => void): void {
    this.overlayCallback = callback;
  }

  // ========================================
  // 제어
  // ========================================

  /**
   * 일시정지
   */
  pause(): void {
    this.paused = true;
    this.particleSystem.pause();
  }

  /**
   * 재개
   */
  resume(): void {
    this.paused = false;
    this.particleSystem.resume();
  }

  /**
   * 모든 효과 정지
   */
  stopAll(): void {
    this.particleSystem.clear();
    this.screenEffects.stopAll();
  }

  // ========================================
  // 상태 조회
  // ========================================

  /**
   * 현재 상태 조회
   */
  getState(): Gin7VFXState {
    return {
      quality: this.quality,
      particlesEnabled: this.config.particlesEnabled,
      screenEffectsEnabled: this.config.screenEffectsEnabled,
      activeParticles: this.particleSystem.getActiveParticleCount(),
      activeScreenEffects: this.screenEffects.getActiveEffectCount(),
      activeEmitters: this.particleSystem.getActiveEmitterCount(),
    };
  }

  /**
   * 활성 파티클 조회
   */
  getActiveParticles(): readonly Particle[] {
    return this.particleSystem.getActiveParticles();
  }

  /**
   * 현재 화면 변환 상태
   */
  getScreenTransform(): ScreenTransform {
    return this.screenEffects.getTransform();
  }

  /**
   * 현재 화면 오버레이 상태
   */
  getScreenOverlay(): ScreenOverlay {
    return this.screenEffects.getOverlay();
  }

  // ========================================
  // 정리
  // ========================================

  /**
   * 리소스 정리
   */
  dispose(): void {
    this.particleSystem.dispose();
    this.screenEffects.dispose();
    this.particleRenderCallback = null;
    this.transformCallback = null;
    this.overlayCallback = null;
    this.initialized = false;
    console.log('✨ [Gin7VFX] Disposed');
  }
}

// ========================================
// 싱글톤 인스턴스
// ========================================

let vfxManagerInstance: Gin7VFXManager | null = null;

/**
 * VFX 매니저 초기화 및 반환
 */
export function initGin7VFX(config?: Gin7VFXConfig): Gin7VFXManager {
  if (!vfxManagerInstance) {
    vfxManagerInstance = new Gin7VFXManager(config);
  }
  return vfxManagerInstance;
}

/**
 * VFX 매니저 인스턴스 반환
 */
export function getGin7VFX(): Gin7VFXManager | null {
  return vfxManagerInstance;
}

/**
 * VFX 매니저 정리
 */
export function disposeGin7VFX(): void {
  vfxManagerInstance?.dispose();
  vfxManagerInstance = null;
}

export default Gin7VFXManager;















