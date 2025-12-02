/**
 * VFXManager - 복셀 전투 시각 효과 통합 매니저
 * 
 * 모든 VFX 시스템의 중앙 관리:
 * - ProjectileSystem: 투사체
 * - ParticleSystem: 파티클
 * - ImpactEffects: 충돌 이펙트
 * - MagicEffects: 마법 이펙트
 * - WeatherEffects: 날씨 효과
 * - FireSmoke: 화염/연기
 */

import * as THREE from 'three';
import { ProjectileSystem, Projectile } from './ProjectileSystem';
import { VFXParticleSystem } from './ParticleSystem';
import { ImpactEffects, ImpactType } from './ImpactEffects';
import { MagicEffects, MagicEffectType } from './MagicEffects';
import { WeatherEffects, WeatherType } from './WeatherEffects';
import { FireSmokeSystem } from './FireSmoke';

// ========================================
// 타입 정의
// ========================================

/** VFX 설정 */
export interface VFXConfig {
  // 품질 설정
  quality: 'low' | 'medium' | 'high' | 'ultra';
  
  // 거리 컬링
  cullDistance: number;
  
  // 최대 파티클 수
  maxParticles: number;
  maxProjectiles: number;
  
  // 성능 모드
  enableLOD: boolean;
  enableBatching: boolean;
  enableFrustumCulling: boolean;
}

/** VFX 메트릭 */
export interface VFXMetrics {
  activeProjectiles: number;
  activeParticles: number;
  activeEffects: number;
  updateTime: number;
  renderTime: number;
  memoryUsage: number;
}

/** VFX 이벤트 */
export type VFXEventType = 
  | 'projectile_hit'
  | 'explosion'
  | 'unit_hit'
  | 'unit_death'
  | 'ability_cast';

export interface VFXEvent {
  type: VFXEventType;
  position: THREE.Vector3;
  data?: Record<string, unknown>;
}

// 기본 설정
const DEFAULT_CONFIG: VFXConfig = {
  quality: 'high',
  cullDistance: 200,
  maxParticles: 5000,
  maxProjectiles: 500,
  enableLOD: true,
  enableBatching: true,
  enableFrustumCulling: true,
};

// 품질별 설정 계수
const QUALITY_MULTIPLIERS: Record<VFXConfig['quality'], {
  particles: number;
  projectiles: number;
  detail: number;
}> = {
  low: { particles: 0.25, projectiles: 0.5, detail: 0.5 },
  medium: { particles: 0.5, projectiles: 0.75, detail: 0.75 },
  high: { particles: 1, projectiles: 1, detail: 1 },
  ultra: { particles: 1.5, projectiles: 1.25, detail: 1.25 },
};

// ========================================
// VFXManager 클래스
// ========================================

export class VFXManager {
  private scene: THREE.Scene;
  private camera: THREE.Camera;
  private config: VFXConfig;
  
  // 서브시스템
  private projectileSystem: ProjectileSystem;
  private particleSystem: VFXParticleSystem;
  private impactEffects: ImpactEffects;
  private magicEffects: MagicEffects;
  private weatherEffects: WeatherEffects;
  private fireSmokeSystem: FireSmokeSystem;
  
  // 이벤트 큐
  private eventQueue: VFXEvent[] = [];
  
  // 메트릭
  private metrics: VFXMetrics = {
    activeProjectiles: 0,
    activeParticles: 0,
    activeEffects: 0,
    updateTime: 0,
    renderTime: 0,
    memoryUsage: 0,
  };
  
  // 상태
  private isPaused = false;
  private timeScale = 1;
  
  // LOD 관리
  private cameraPosition = new THREE.Vector3();
  
  constructor(
    scene: THREE.Scene,
    camera: THREE.Camera,
    config: Partial<VFXConfig> = {}
  ) {
    this.scene = scene;
    this.camera = camera;
    this.config = { ...DEFAULT_CONFIG, ...config };
    
    // 품질 설정 적용
    const quality = QUALITY_MULTIPLIERS[this.config.quality];
    this.config.maxParticles = Math.floor(this.config.maxParticles * quality.particles);
    this.config.maxProjectiles = Math.floor(this.config.maxProjectiles * quality.projectiles);
    
    // 서브시스템 초기화
    this.projectileSystem = new ProjectileSystem(scene, this.config.maxProjectiles);
    this.particleSystem = new VFXParticleSystem(scene, this.config.maxParticles);
    this.impactEffects = new ImpactEffects(scene, this.particleSystem);
    this.magicEffects = new MagicEffects(scene, this.particleSystem);
    this.weatherEffects = new WeatherEffects(scene, this.particleSystem);
    this.fireSmokeSystem = new FireSmokeSystem(scene, this.particleSystem);
    
    console.log('🎆 VFXManager initialized:', {
      quality: this.config.quality,
      maxParticles: this.config.maxParticles,
      maxProjectiles: this.config.maxProjectiles,
    });
  }

  // ========================================
  // 투사체 API
  // ========================================
  
  /**
   * 투사체 발사
   */
  spawnProjectile(
    type: string,
    from: THREE.Vector3,
    to: THREE.Vector3,
    options?: {
      speed?: number;
      gravity?: number;
      onHit?: (position: THREE.Vector3) => void;
    }
  ): string {
    const projectile = this.projectileSystem.spawn(type, from, to, options);
    return projectile?.id || '';
  }
  
  /**
   * 투사체 일괄 발사 (궁병 볼리)
   */
  spawnProjectileVolley(
    type: string,
    positions: { from: THREE.Vector3; to: THREE.Vector3 }[],
    options?: {
      speed?: number;
      gravity?: number;
      stagger?: number; // 발사 간격 (ms)
      onHit?: (position: THREE.Vector3) => void;
    }
  ): string[] {
    return this.projectileSystem.spawnVolley(type, positions, options);
  }
  
  // ========================================
  // 충돌 이펙트 API
  // ========================================
  
  /**
   * 충돌 이펙트 생성
   */
  spawnImpact(
    type: ImpactType,
    position: THREE.Vector3,
    options?: {
      scale?: number;
      direction?: THREE.Vector3;
      color?: number;
    }
  ): void {
    this.impactEffects.spawn(type, position, options);
  }
  
  /**
   * 폭발 이펙트
   */
  spawnExplosion(
    position: THREE.Vector3,
    radius: number = 1,
    options?: {
      intensity?: number;
      color?: number;
      shockwave?: boolean;
    }
  ): void {
    this.impactEffects.spawnExplosion(position, radius, options);
  }
  
  // ========================================
  // 마법 이펙트 API
  // ========================================
  
  /**
   * 마법 이펙트 생성
   */
  spawnMagicEffect(
    type: MagicEffectType,
    caster: THREE.Vector3,
    target: THREE.Vector3,
    options?: {
      color?: number;
      scale?: number;
      duration?: number;
    }
  ): string {
    return this.magicEffects.spawn(type, caster, target, options);
  }
  
  /**
   * 화염구
   */
  spawnFireball(
    from: THREE.Vector3,
    to: THREE.Vector3,
    options?: { scale?: number; onHit?: (pos: THREE.Vector3) => void }
  ): string {
    return this.magicEffects.spawnFireball(from, to, options);
  }
  
  /**
   * 번개
   */
  spawnLightning(
    from: THREE.Vector3,
    to: THREE.Vector3,
    options?: { branches?: number; duration?: number }
  ): string {
    return this.magicEffects.spawnLightning(from, to, options);
  }
  
  /**
   * 치유 파동
   */
  spawnHealWave(
    center: THREE.Vector3,
    radius: number,
    options?: { duration?: number }
  ): string {
    return this.magicEffects.spawnHealWave(center, radius, options);
  }
  
  /**
   * 저주 오라
   */
  spawnCurseAura(
    target: THREE.Vector3,
    options?: { duration?: number; radius?: number }
  ): string {
    return this.magicEffects.spawnCurseAura(target, options);
  }
  
  /**
   * 보호막
   */
  spawnShield(
    target: THREE.Vector3,
    radius: number,
    options?: { duration?: number; color?: number }
  ): string {
    return this.magicEffects.spawnShield(target, radius, options);
  }
  
  // ========================================
  // 날씨 이펙트 API
  // ========================================
  
  /**
   * 날씨 설정
   */
  setWeather(type: WeatherType, intensity: number = 1): void {
    this.weatherEffects.setWeather(type, intensity);
  }
  
  /**
   * 날씨 전환
   */
  transitionWeather(
    type: WeatherType,
    intensity: number,
    duration: number = 2000
  ): void {
    this.weatherEffects.transition(type, intensity, duration);
  }
  
  /**
   * 날씨 제거
   */
  clearWeather(): void {
    this.weatherEffects.clear();
  }
  
  // ========================================
  // 화염/연기 API
  // ========================================
  
  /**
   * 화염 생성
   */
  spawnFire(
    position: THREE.Vector3,
    options?: {
      scale?: number;
      intensity?: number;
      duration?: number;
      withSmoke?: boolean;
    }
  ): string {
    return this.fireSmokeSystem.spawnFire(position, options);
  }
  
  /**
   * 연기 생성
   */
  spawnSmoke(
    position: THREE.Vector3,
    options?: {
      scale?: number;
      intensity?: number;
      duration?: number;
      color?: number;
    }
  ): string {
    return this.fireSmokeSystem.spawnSmoke(position, options);
  }
  
  /**
   * 화염 제거
   */
  removeFire(id: string): void {
    this.fireSmokeSystem.remove(id);
  }
  
  // ========================================
  // 파티클 API (직접 접근)
  // ========================================
  
  /**
   * 파티클 방출
   */
  emitParticles(
    type: string,
    position: THREE.Vector3,
    count: number,
    options?: {
      direction?: THREE.Vector3;
      spread?: number;
      speed?: number;
      color?: number;
      life?: number;
    }
  ): void {
    this.particleSystem.emit(type, position, count, options);
  }
  
  // ========================================
  // 이벤트 시스템
  // ========================================
  
  /**
   * VFX 이벤트 큐에 추가
   */
  queueEvent(event: VFXEvent): void {
    this.eventQueue.push(event);
  }
  
  /**
   * 이벤트 처리
   */
  private processEvents(): void {
    while (this.eventQueue.length > 0) {
      const event = this.eventQueue.shift()!;
      
      switch (event.type) {
        case 'projectile_hit':
          this.handleProjectileHit(event);
          break;
        case 'explosion':
          this.handleExplosion(event);
          break;
        case 'unit_hit':
          this.handleUnitHit(event);
          break;
        case 'unit_death':
          this.handleUnitDeath(event);
          break;
        case 'ability_cast':
          this.handleAbilityCast(event);
          break;
      }
    }
  }
  
  private handleProjectileHit(event: VFXEvent): void {
    const impactType = (event.data?.impactType as ImpactType) || 'spark';
    this.spawnImpact(impactType, event.position);
  }
  
  private handleExplosion(event: VFXEvent): void {
    const radius = (event.data?.radius as number) || 1;
    this.spawnExplosion(event.position, radius);
  }
  
  private handleUnitHit(event: VFXEvent): void {
    // 피 튀김 또는 스파크
    const isArmored = event.data?.armored as boolean;
    this.spawnImpact(
      isArmored ? 'spark' : 'blood',
      event.position,
      { scale: 0.8 }
    );
  }
  
  private handleUnitDeath(event: VFXEvent): void {
    // 피 + 먼지
    this.spawnImpact('blood', event.position, { scale: 1.2 });
    this.spawnImpact('dust', event.position.clone().setY(0.1), { scale: 0.8 });
  }
  
  private handleAbilityCast(event: VFXEvent): void {
    const abilityType = event.data?.abilityType as MagicEffectType;
    const target = event.data?.target as THREE.Vector3 || event.position;
    
    if (abilityType) {
      this.spawnMagicEffect(abilityType, event.position, target);
    }
  }
  
  // ========================================
  // 업데이트 루프
  // ========================================
  
  /**
   * 프레임 업데이트
   */
  update(deltaTime: number): void {
    if (this.isPaused) return;
    
    const startTime = performance.now();
    const dt = deltaTime * this.timeScale;
    
    // 카메라 위치 캐시 (LOD/컬링용)
    this.camera.getWorldPosition(this.cameraPosition);
    
    // 이벤트 처리
    this.processEvents();
    
    // 서브시스템 업데이트
    this.projectileSystem.update(dt, this.cameraPosition, this.config);
    this.particleSystem.update(dt);
    this.impactEffects.update(dt);
    this.magicEffects.update(dt);
    this.weatherEffects.update(dt, this.cameraPosition);
    this.fireSmokeSystem.update(dt);
    
    // 투사체 충돌 체크 및 이펙트 생성
    this.handleProjectileCollisions();
    
    // 메트릭 업데이트
    this.metrics.updateTime = performance.now() - startTime;
    this.metrics.activeProjectiles = this.projectileSystem.getActiveCount();
    this.metrics.activeParticles = this.particleSystem.getActiveCount();
    this.metrics.activeEffects = 
      this.magicEffects.getActiveCount() + 
      this.fireSmokeSystem.getActiveCount();
  }
  
  /**
   * 투사체 충돌 처리
   */
  private handleProjectileCollisions(): void {
    const completedProjectiles = this.projectileSystem.getCompleted();
    
    for (const projectile of completedProjectiles) {
      // 충돌 이펙트 생성
      const impactType = this.getImpactTypeForProjectile(projectile.type);
      this.spawnImpact(impactType, projectile.position, {
        direction: projectile.velocity.clone().normalize(),
      });
      
      // 콜백 실행
      if (projectile.onHit) {
        projectile.onHit(projectile.position.clone());
      }
    }
  }
  
  private getImpactTypeForProjectile(projectileType: string): ImpactType {
    switch (projectileType) {
      case 'fire_arrow':
      case 'fireball':
      case 'fire_boulder':
      case 'oil_jar':
        return 'explosion';
      case 'stone':
      case 'boulder':
        return 'dust';
      case 'lightning':
        return 'spark';
      case 'poison_dart':
      case 'curse':
        return 'magic';
      default:
        return 'spark';
    }
  }
  
  // ========================================
  // 제어 메서드
  // ========================================
  
  /**
   * 일시정지
   */
  pause(): void {
    this.isPaused = true;
  }
  
  /**
   * 재개
   */
  resume(): void {
    this.isPaused = false;
  }
  
  /**
   * 시간 배율 설정
   */
  setTimeScale(scale: number): void {
    this.timeScale = Math.max(0, Math.min(4, scale));
  }
  
  /**
   * 품질 설정
   */
  setQuality(quality: VFXConfig['quality']): void {
    this.config.quality = quality;
    const multiplier = QUALITY_MULTIPLIERS[quality];
    
    // 파티클 시스템에 품질 전달
    this.particleSystem.setQuality(multiplier.detail);
    this.weatherEffects.setQuality(multiplier.detail);
    this.fireSmokeSystem.setQuality(multiplier.detail);
  }
  
  // ========================================
  // 유틸리티
  // ========================================
  
  /**
   * 모든 이펙트 제거
   */
  clear(): void {
    this.projectileSystem.clear();
    this.particleSystem.clear();
    this.impactEffects.clear();
    this.magicEffects.clear();
    this.weatherEffects.clear();
    this.fireSmokeSystem.clear();
    this.eventQueue = [];
  }
  
  /**
   * 메트릭 조회
   */
  getMetrics(): VFXMetrics {
    return { ...this.metrics };
  }
  
  /**
   * 현재 설정 조회
   */
  getConfig(): VFXConfig {
    return { ...this.config };
  }
  
  /**
   * 리소스 정리
   */
  dispose(): void {
    this.clear();
    
    this.projectileSystem.dispose();
    this.particleSystem.dispose();
    this.impactEffects.dispose();
    this.magicEffects.dispose();
    this.weatherEffects.dispose();
    this.fireSmokeSystem.dispose();
    
    console.log('🧹 VFXManager disposed');
  }
}

// ========================================
// 싱글톤 헬퍼
// ========================================

let vfxManagerInstance: VFXManager | null = null;

export function initVFXManager(
  scene: THREE.Scene,
  camera: THREE.Camera,
  config?: Partial<VFXConfig>
): VFXManager {
  if (vfxManagerInstance) {
    vfxManagerInstance.dispose();
  }
  vfxManagerInstance = new VFXManager(scene, camera, config);
  return vfxManagerInstance;
}

export function getVFXManager(): VFXManager | null {
  return vfxManagerInstance;
}

export default VFXManager;





