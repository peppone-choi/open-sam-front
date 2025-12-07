/**
 * Gin7 VFX System
 * 
 * 시각 효과 시스템 (파티클, 화면 효과)
 * 
 * @module lib/gin7/vfx
 * 
 * @example
 * ```typescript
 * import { 
 *   initGin7VFX, 
 *   getGin7VFX,
 * } from '@/lib/gin7/vfx';
 * 
 * // 초기화
 * const vfx = initGin7VFX({ quality: 'high' });
 * 
 * // 폭발 효과
 * vfx.unitDestroyed({ x: 100, y: 50, z: 0 }, 'capital');
 * 
 * // 빔 충격 효과
 * vfx.beamImpact(
 *   { x: 100, y: 50, z: 0 },
 *   { x: 0, y: 1, z: 0 }
 * );
 * 
 * // 화면 흔들림
 * vfx.shake(15, 0.5);
 * 
 * // 업데이트 루프에서
 * function render(deltaTime: number) {
 *   vfx.update(deltaTime);
 * }
 * ```
 */

// ========================================
// VFXManager (메인)
// ========================================

export {
  Gin7VFXManager,
  initGin7VFX,
  getGin7VFX,
  disposeGin7VFX,
  type Gin7VFXConfig,
  type Gin7VFXState,
  type VFXQuality,
  type Position3D,
} from './Gin7VFXManager';

// ========================================
// ParticleSystem (파티클)
// ========================================

export {
  Gin7ParticleSystem,
  PARTICLE_PRESETS,
  type Particle,
  type ParticleColor,
  type EmitterConfig,
  type Emitter,
  type ParticlePreset,
} from './Gin7ParticleSystem';

// ========================================
// ScreenEffects (화면 효과)
// ========================================

export {
  Gin7ScreenEffects,
  type ScreenEffectType,
  type ShakeConfig,
  type FlashConfig,
  type VignetteConfig,
  type FadeConfig,
  type TintConfig,
  type ScreenTransform,
  type ScreenOverlay,
} from './Gin7ScreenEffects';

// ========================================
// 기본 export
// ========================================

export { Gin7VFXManager as default } from './Gin7VFXManager';








