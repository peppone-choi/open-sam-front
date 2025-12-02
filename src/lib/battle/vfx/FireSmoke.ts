/**
 * FireSmokeSystem - 화염 및 연기 시스템
 * 
 * 특징:
 * - 동적 조명 (PointLight)
 * - 확산 효과 (인접 유닛/건물 점화)
 * - 지속 화염 / 일회성 화염
 * - 연기 상승 물리
 */

import * as THREE from 'three';
import { VFXParticleSystem } from './ParticleSystem';

// ========================================
// 타입 정의
// ========================================

/** 화염 상태 */
type FireState = 'igniting' | 'burning' | 'dying' | 'dead';

/** 화염 인스턴스 */
interface FireInstance {
  id: string;
  position: THREE.Vector3;
  state: FireState;
  
  // 설정
  scale: number;
  intensity: number;
  
  // 시간
  time: number;
  duration: number; // -1 = 무한
  
  // 이미터
  fireEmitterId?: string;
  smokeEmitterId?: string;
  sparkEmitterId?: string;
  
  // 조명
  pointLight?: THREE.PointLight;
  
  // 메시
  glowMesh?: THREE.Mesh;
  
  // 플래그
  withSmoke: boolean;
  withLight: boolean;
  active: boolean;
}

/** 연기 인스턴스 */
interface SmokeInstance {
  id: string;
  position: THREE.Vector3;
  
  // 설정
  scale: number;
  intensity: number;
  color: number;
  
  // 시간
  time: number;
  duration: number;
  
  // 이미터
  emitterId?: string;
  
  active: boolean;
}

/** 화염 옵션 */
export interface FireOptions {
  scale?: number;
  intensity?: number;
  duration?: number;
  withSmoke?: boolean;
  withLight?: boolean;
  withSparks?: boolean;
}

/** 연기 옵션 */
export interface SmokeOptions {
  scale?: number;
  intensity?: number;
  duration?: number;
  color?: number;
}

// ========================================
// 설정
// ========================================

const FIRE_CONFIG = {
  baseIntensity: 1,
  lightIntensity: 2,
  lightDistance: 15,
  lightColor: 0xFF6600,
  flickerSpeed: 8,
  flickerAmount: 0.3,
  sparkRate: 10,
  smokeDelay: 0.5, // 연기 시작 지연
  igniteDuration: 0.5,
  dyingDuration: 1,
};

const SMOKE_CONFIG = {
  riseSpeed: 2,
  spreadRate: 0.5,
  defaultColor: 0x444444,
};

// ========================================
// FireSmokeSystem 클래스
// ========================================

export class FireSmokeSystem {
  private scene: THREE.Scene;
  private particleSystem: VFXParticleSystem;
  
  // 인스턴스 관리
  private fires: Map<string, FireInstance> = new Map();
  private smokes: Map<string, SmokeInstance> = new Map();
  private idCounter = 0;
  
  // 조명 풀
  private lightPool: THREE.PointLight[] = [];
  
  // 글로우 메시 풀
  private glowMeshPool: THREE.Mesh[] = [];
  private glowGeometry: THREE.SphereGeometry;
  private glowMaterial: THREE.MeshBasicMaterial;
  
  // 품질 설정
  private qualityMultiplier = 1;
  private enableLights = true;
  
  // 설정
  private readonly POOL_SIZE = 20;
  
  constructor(scene: THREE.Scene, particleSystem: VFXParticleSystem) {
    this.scene = scene;
    this.particleSystem = particleSystem;
    
    // 글로우 메시 리소스
    this.glowGeometry = new THREE.SphereGeometry(0.5, 8, 8);
    this.glowMaterial = new THREE.MeshBasicMaterial({
      color: 0xFF4500,
      transparent: true,
      opacity: 0.5,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    
    this.initPools();
  }
  
  private initPools(): void {
    // 조명 풀
    for (let i = 0; i < this.POOL_SIZE; i++) {
      const light = new THREE.PointLight(
        FIRE_CONFIG.lightColor,
        0,
        FIRE_CONFIG.lightDistance
      );
      light.visible = false;
      this.scene.add(light);
      this.lightPool.push(light);
    }
    
    // 글로우 메시 풀
    for (let i = 0; i < this.POOL_SIZE; i++) {
      const mesh = new THREE.Mesh(this.glowGeometry, this.glowMaterial.clone());
      mesh.visible = false;
      this.scene.add(mesh);
      this.glowMeshPool.push(mesh);
    }
  }
  
  // ========================================
  // 화염 생성
  // ========================================
  
  /**
   * 화염 생성
   */
  spawnFire(position: THREE.Vector3, options?: FireOptions): string {
    const id = `fire_${this.idCounter++}`;
    const scale = options?.scale ?? 1;
    const intensity = options?.intensity ?? 1;
    const duration = options?.duration ?? -1; // 기본 무한
    const withSmoke = options?.withSmoke ?? true;
    const withLight = options?.withLight ?? this.enableLights;
    const withSparks = options?.withSparks ?? true;
    
    // 화염 파티클 이미터
    const fireEmitterId = this.particleSystem.createEmitter({
      type: 'fire',
      position: position.clone(),
      direction: new THREE.Vector3(0, 1, 0),
      spread: Math.PI / 6,
      speed: 3 * scale,
      size: 0.3 * scale,
      life: 0.5,
      color: 0xFF4500,
      count: Math.floor(8 * intensity * this.qualityMultiplier),
      continuous: true,
      emitRate: Math.floor(30 * intensity * this.qualityMultiplier),
    });
    
    // 연기 파티클 이미터 (지연 시작)
    let smokeEmitterId: string | undefined;
    if (withSmoke) {
      smokeEmitterId = this.particleSystem.createEmitter({
        type: 'smoke',
        position: position.clone().add(new THREE.Vector3(0, scale, 0)),
        direction: new THREE.Vector3(0, 1, 0),
        spread: Math.PI / 4,
        speed: 2 * scale,
        size: 0.5 * scale,
        life: 2.5,
        color: SMOKE_CONFIG.defaultColor,
        count: Math.floor(4 * intensity * this.qualityMultiplier),
        continuous: true,
        emitRate: Math.floor(12 * intensity * this.qualityMultiplier),
      });
    }
    
    // 스파크 이미터
    let sparkEmitterId: string | undefined;
    if (withSparks) {
      sparkEmitterId = this.particleSystem.createEmitter({
        type: 'spark',
        position: position.clone(),
        direction: new THREE.Vector3(0, 1, 0),
        spread: Math.PI / 3,
        speed: 5 * scale,
        size: 0.05 * scale,
        life: 0.5,
        color: 0xFFFF00,
        count: Math.floor(2 * intensity * this.qualityMultiplier),
        continuous: true,
        emitRate: Math.floor(FIRE_CONFIG.sparkRate * intensity * this.qualityMultiplier),
      });
    }
    
    // 조명
    let pointLight: THREE.PointLight | undefined;
    if (withLight && this.enableLights) {
      pointLight = this.acquireLight();
      if (pointLight) {
        pointLight.position.copy(position);
        pointLight.position.y += scale;
        pointLight.intensity = FIRE_CONFIG.lightIntensity * intensity;
        pointLight.visible = true;
      }
    }
    
    // 글로우 메시
    const glowMesh = this.acquireGlowMesh();
    if (glowMesh) {
      glowMesh.position.copy(position);
      glowMesh.position.y += scale * 0.3;
      glowMesh.scale.setScalar(scale);
      glowMesh.visible = true;
    }
    
    // 인스턴스 등록
    this.fires.set(id, {
      id,
      position: position.clone(),
      state: 'igniting',
      scale,
      intensity,
      time: 0,
      duration,
      fireEmitterId,
      smokeEmitterId,
      sparkEmitterId,
      pointLight,
      glowMesh,
      withSmoke,
      withLight,
      active: true,
    });
    
    return id;
  }
  
  /**
   * 연기 생성
   */
  spawnSmoke(position: THREE.Vector3, options?: SmokeOptions): string {
    const id = `smoke_${this.idCounter++}`;
    const scale = options?.scale ?? 1;
    const intensity = options?.intensity ?? 1;
    const duration = options?.duration ?? 3;
    const color = options?.color ?? SMOKE_CONFIG.defaultColor;
    
    // 연기 파티클 이미터
    const emitterId = this.particleSystem.createEmitter({
      type: 'smoke',
      position: position.clone(),
      direction: new THREE.Vector3(0, 1, 0),
      spread: Math.PI / 4,
      speed: SMOKE_CONFIG.riseSpeed * scale,
      size: 0.6 * scale,
      life: 3,
      color,
      count: Math.floor(5 * intensity * this.qualityMultiplier),
      continuous: true,
      emitRate: Math.floor(15 * intensity * this.qualityMultiplier),
    });
    
    // 인스턴스 등록
    this.smokes.set(id, {
      id,
      position: position.clone(),
      scale,
      intensity,
      color,
      time: 0,
      duration,
      emitterId,
      active: true,
    });
    
    return id;
  }
  
  // ========================================
  // 풀 관리
  // ========================================
  
  private acquireLight(): THREE.PointLight | undefined {
    for (const light of this.lightPool) {
      if (!light.visible) {
        return light;
      }
    }
    return undefined;
  }
  
  private releaseLight(light: THREE.PointLight): void {
    light.visible = false;
    light.intensity = 0;
  }
  
  private acquireGlowMesh(): THREE.Mesh | undefined {
    for (const mesh of this.glowMeshPool) {
      if (!mesh.visible) {
        return mesh;
      }
    }
    return undefined;
  }
  
  private releaseGlowMesh(mesh: THREE.Mesh): void {
    mesh.visible = false;
    mesh.scale.setScalar(1);
  }
  
  // ========================================
  // 업데이트
  // ========================================
  
  /**
   * 프레임 업데이트
   */
  update(deltaTime: number): void {
    // 화염 업데이트
    this.updateFires(deltaTime);
    
    // 연기 업데이트
    this.updateSmokes(deltaTime);
  }
  
  private updateFires(deltaTime: number): void {
    const toRemove: string[] = [];
    
    for (const [id, fire] of this.fires) {
      fire.time += deltaTime;
      
      // 상태 전환
      this.updateFireState(fire);
      
      // 완료 체크
      if (fire.state === 'dead') {
        toRemove.push(id);
        continue;
      }
      
      // 조명 깜빡임
      if (fire.pointLight && fire.state === 'burning') {
        const flicker = 1 + Math.sin(fire.time * FIRE_CONFIG.flickerSpeed) * FIRE_CONFIG.flickerAmount;
        const randomFlicker = 1 + (Math.random() - 0.5) * 0.2;
        fire.pointLight.intensity = FIRE_CONFIG.lightIntensity * fire.intensity * flicker * randomFlicker;
      }
      
      // 글로우 메시 애니메이션
      if (fire.glowMesh) {
        const pulse = 1 + Math.sin(fire.time * 5) * 0.15;
        fire.glowMesh.scale.setScalar(fire.scale * pulse);
        
        // 페이드 아웃 (dying 상태)
        if (fire.state === 'dying') {
          const dyingProgress = (fire.time - fire.duration) / FIRE_CONFIG.dyingDuration;
          const opacity = THREE.MathUtils.lerp(0.5, 0, dyingProgress);
          (fire.glowMesh.material as THREE.MeshBasicMaterial).opacity = opacity;
        }
      }
    }
    
    // 완료된 화염 제거
    for (const id of toRemove) {
      this.removeFire(id);
    }
  }
  
  private updateFireState(fire: FireInstance): void {
    switch (fire.state) {
      case 'igniting':
        if (fire.time >= FIRE_CONFIG.igniteDuration) {
          fire.state = 'burning';
        }
        break;
        
      case 'burning':
        // 지속 시간 체크 (-1은 무한)
        if (fire.duration > 0 && fire.time >= fire.duration) {
          fire.state = 'dying';
        }
        break;
        
      case 'dying':
        if (fire.time >= fire.duration + FIRE_CONFIG.dyingDuration) {
          fire.state = 'dead';
        }
        break;
    }
  }
  
  private updateSmokes(deltaTime: number): void {
    const toRemove: string[] = [];
    
    for (const [id, smoke] of this.smokes) {
      smoke.time += deltaTime;
      
      // 수명 체크
      if (smoke.time >= smoke.duration) {
        toRemove.push(id);
      }
    }
    
    // 완료된 연기 제거
    for (const id of toRemove) {
      this.removeSmoke(id);
    }
  }
  
  // ========================================
  // 제거
  // ========================================
  
  private removeFire(id: string): void {
    const fire = this.fires.get(id);
    if (!fire) return;
    
    // 이미터 제거
    if (fire.fireEmitterId) {
      this.particleSystem.removeEmitter(fire.fireEmitterId);
    }
    if (fire.smokeEmitterId) {
      this.particleSystem.removeEmitter(fire.smokeEmitterId);
    }
    if (fire.sparkEmitterId) {
      this.particleSystem.removeEmitter(fire.sparkEmitterId);
    }
    
    // 조명 반환
    if (fire.pointLight) {
      this.releaseLight(fire.pointLight);
    }
    
    // 글로우 메시 반환
    if (fire.glowMesh) {
      this.releaseGlowMesh(fire.glowMesh);
    }
    
    this.fires.delete(id);
  }
  
  private removeSmoke(id: string): void {
    const smoke = this.smokes.get(id);
    if (!smoke) return;
    
    // 이미터 제거
    if (smoke.emitterId) {
      this.particleSystem.removeEmitter(smoke.emitterId);
    }
    
    this.smokes.delete(id);
  }
  
  /**
   * ID로 이펙트 제거
   */
  remove(id: string): void {
    if (this.fires.has(id)) {
      // 즉시 제거 대신 dying 상태로 전환
      const fire = this.fires.get(id)!;
      if (fire.state !== 'dying' && fire.state !== 'dead') {
        fire.state = 'dying';
        fire.duration = fire.time; // 현재 시간을 지속시간으로 설정
      }
    } else if (this.smokes.has(id)) {
      this.removeSmoke(id);
    }
  }
  
  // ========================================
  // 특수 효과
  // ========================================
  
  /**
   * 화염 확산 (주변에 새 화염 생성)
   */
  spreadFire(sourceId: string, targets: THREE.Vector3[], delay: number = 0.5): string[] {
    const source = this.fires.get(sourceId);
    if (!source) return [];
    
    const newIds: string[] = [];
    
    targets.forEach((target, index) => {
      setTimeout(() => {
        const id = this.spawnFire(target, {
          scale: source.scale * 0.8,
          intensity: source.intensity * 0.9,
          withSmoke: source.withSmoke,
          withLight: source.withLight,
        });
        newIds.push(id);
      }, delay * 1000 * index);
    });
    
    return newIds;
  }
  
  /**
   * 화염 폭발 (일시적 대형 화염)
   */
  spawnFireBurst(position: THREE.Vector3, radius: number = 2): string {
    // 중심 화염
    const id = this.spawnFire(position, {
      scale: radius,
      intensity: 2,
      duration: 0.8,
      withSmoke: true,
      withLight: true,
      withSparks: true,
    });
    
    // 추가 파티클 폭발
    this.particleSystem.emit('fire', position, 50, {
      speed: 15 * radius,
      size: 0.5,
      direction: new THREE.Vector3(0, 1, 0),
      spread: Math.PI,
    });
    
    this.particleSystem.emit('spark', position, 80, {
      speed: 20 * radius,
    });
    
    return id;
  }
  
  /**
   * 연기 폭발 (대형 연기 구름)
   */
  spawnSmokeBurst(position: THREE.Vector3, radius: number = 2): string {
    const id = this.spawnSmoke(position, {
      scale: radius,
      intensity: 3,
      duration: 3,
      color: 0x333333,
    });
    
    // 추가 파티클 폭발
    this.particleSystem.emit('smoke', position, 40, {
      speed: 8 * radius,
      size: 0.8,
      direction: new THREE.Vector3(0, 1, 0),
      spread: Math.PI / 2,
    });
    
    return id;
  }
  
  // ========================================
  // 유틸리티
  // ========================================
  
  /**
   * 활성 이펙트 수
   */
  getActiveCount(): number {
    return this.fires.size + this.smokes.size;
  }
  
  /**
   * 품질 설정
   */
  setQuality(multiplier: number): void {
    this.qualityMultiplier = Math.max(0.25, Math.min(2, multiplier));
    this.enableLights = multiplier >= 0.5; // 저품질에서는 조명 비활성화
    
    // 기존 화염 조명 토글
    if (!this.enableLights) {
      for (const fire of this.fires.values()) {
        if (fire.pointLight) {
          this.releaseLight(fire.pointLight);
          fire.pointLight = undefined;
        }
      }
    }
  }
  
  /**
   * 모든 이펙트 제거
   */
  clear(): void {
    for (const id of this.fires.keys()) {
      this.removeFire(id);
    }
    for (const id of this.smokes.keys()) {
      this.removeSmoke(id);
    }
  }
  
  /**
   * 리소스 정리
   */
  dispose(): void {
    this.clear();
    
    // 조명 풀 정리
    for (const light of this.lightPool) {
      this.scene.remove(light);
      light.dispose();
    }
    this.lightPool = [];
    
    // 글로우 메시 풀 정리
    for (const mesh of this.glowMeshPool) {
      this.scene.remove(mesh);
      (mesh.material as THREE.Material).dispose();
    }
    this.glowMeshPool = [];
    
    // 공유 리소스 정리
    this.glowGeometry.dispose();
    this.glowMaterial.dispose();
    
    console.log('🧹 FireSmokeSystem disposed');
  }
}

export default FireSmokeSystem;





