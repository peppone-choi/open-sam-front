/**
 * VFX 시스템 - 복셀 전투 시각 효과
 * 
 * 사용법:
 * ```typescript
 * import { initVFXManager, getVFXManager } from '@/lib/battle/vfx';
 * 
 * // 초기화
 * const vfxManager = initVFXManager(scene, camera, { quality: 'high' });
 * 
 * // 투사체 발사
 * vfxManager.spawnProjectile('arrow', from, to, { onHit: handleHit });
 * 
 * // 마법 이펙트
 * vfxManager.spawnFireball(caster, target);
 * vfxManager.spawnLightning(from, to);
 * 
 * // 날씨 설정
 * vfxManager.setWeather('rain', 0.8);
 * 
 * // 화염/연기
 * vfxManager.spawnFire(position, { scale: 2, duration: 5 });
 * 
 * // 업데이트 루프
 * function animate() {
 *   vfxManager.update(deltaTime);
 * }
 * ```
 */

// 메인 매니저
export { 
  VFXManager,
  initVFXManager,
  getVFXManager,
  type VFXConfig,
  type VFXMetrics,
  type VFXEvent,
  type VFXEventType,
} from './VFXManager';

// 투사체 시스템
export { 
  ProjectileSystem,
  type Projectile,
  type ProjectileSpawnOptions,
} from './ProjectileSystem';

// 파티클 시스템
export {
  VFXParticleSystem,
  type VFXParticle,
  type VFXParticleType,
  type ParticleEmitterConfig,
} from './ParticleSystem';

// 충돌 이펙트
export {
  ImpactEffects,
  type ImpactType,
  type ImpactOptions,
  type ExplosionOptions,
} from './ImpactEffects';

// 마법 이펙트
export {
  MagicEffects,
  type MagicEffectType,
  type MagicEffectOptions,
} from './MagicEffects';

// 날씨 이펙트
export {
  WeatherEffects,
  type WeatherType,
} from './WeatherEffects';

// 화염/연기
export {
  FireSmokeSystem,
  type FireOptions,
  type SmokeOptions,
} from './FireSmoke';





