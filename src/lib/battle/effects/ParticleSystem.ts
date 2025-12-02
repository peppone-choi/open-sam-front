/**
 * ParticleSystem - 전투 VFX 파티클 시스템
 * 
 * 지원 파티클 타입:
 * - blood: 피 튀김 (근접 전투)
 * - dust: 먼지 (이동, 충돌)
 * - smoke: 연기 (화재, 폭발)
 * - fire: 불꽃 (화염 무기, 화재)
 * - sparks: 금속 불꽃 (검 충돌)
 * - arrow: 화살 궤적 (원거리 공격)
 * 
 * 최적화:
 * - 오브젝트 풀링으로 GC 압력 최소화
 * - InstancedMesh로 드로우콜 최소화
 * - 거리 기반 컬링
 */

import * as THREE from 'three';

// ========================================
// 타입 정의
// ========================================

/** 파티클 타입 */
export type ParticleType = 'blood' | 'dust' | 'smoke' | 'fire' | 'sparks' | 'arrow';

/** 단일 파티클 데이터 */
export interface Particle {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  acceleration: THREE.Vector3;
  color: THREE.Color;
  size: number;
  life: number;          // 남은 수명 (초)
  maxLife: number;       // 최대 수명 (초)
  rotation: number;
  rotationSpeed: number;
  alpha: number;
  type: ParticleType;
  active: boolean;
}

/** 파티클 이미터 설정 */
export interface ParticleEmitterConfig {
  type: ParticleType;
  position: THREE.Vector3;
  direction?: THREE.Vector3;   // 방출 방향 (기본: 위쪽)
  spread?: number;             // 방출 각도 (라디안, 기본: π/4)
  count: number;               // 파티클 수
  speed?: number;              // 초기 속도
  speedVariance?: number;      // 속도 변동
  size?: number;               // 파티클 크기
  sizeVariance?: number;       // 크기 변동
  life?: number;               // 수명 (초)
  lifeVariance?: number;       // 수명 변동
  gravity?: number;            // 중력 영향 (기본: -9.8)
  color?: THREE.Color;         // 기본 색상
  colorEnd?: THREE.Color;      // 페이드 아웃 색상
  continuous?: boolean;        // 지속 방출 여부
  emitRate?: number;           // 초당 방출 수 (continuous일 때)
}

/** 파티클 타입별 기본 설정 */
const PARTICLE_DEFAULTS: Record<ParticleType, Partial<ParticleEmitterConfig>> = {
  blood: {
    spread: Math.PI / 6,
    speed: 8,
    speedVariance: 3,
    size: 0.15,
    sizeVariance: 0.08,
    life: 0.8,
    lifeVariance: 0.3,
    gravity: -15,
    color: new THREE.Color(0x8B0000),
    colorEnd: new THREE.Color(0x4a0000),
  },
  dust: {
    spread: Math.PI / 3,
    speed: 2,
    speedVariance: 1,
    size: 0.4,
    sizeVariance: 0.2,
    life: 1.5,
    lifeVariance: 0.5,
    gravity: -0.5,
    color: new THREE.Color(0x8B7355),
    colorEnd: new THREE.Color(0x8B7355),
  },
  smoke: {
    spread: Math.PI / 4,
    speed: 3,
    speedVariance: 1.5,
    size: 0.8,
    sizeVariance: 0.4,
    life: 3,
    lifeVariance: 1,
    gravity: 1,  // 위로 상승
    color: new THREE.Color(0x555555),
    colorEnd: new THREE.Color(0x222222),
  },
  fire: {
    spread: Math.PI / 6,
    speed: 4,
    speedVariance: 2,
    size: 0.5,
    sizeVariance: 0.3,
    life: 0.6,
    lifeVariance: 0.2,
    gravity: 3,  // 위로 상승
    color: new THREE.Color(0xff4500),
    colorEnd: new THREE.Color(0xff8c00),
  },
  sparks: {
    spread: Math.PI / 2,
    speed: 12,
    speedVariance: 5,
    size: 0.08,
    sizeVariance: 0.04,
    life: 0.4,
    lifeVariance: 0.2,
    gravity: -10,
    color: new THREE.Color(0xffff00),
    colorEnd: new THREE.Color(0xff6600),
  },
  arrow: {
    spread: 0,
    speed: 0,  // 화살 궤적용 - 움직이지 않음
    speedVariance: 0,
    size: 0.05,
    sizeVariance: 0,
    life: 0.3,
    lifeVariance: 0.1,
    gravity: 0,
    color: new THREE.Color(0xffffff),
    colorEnd: new THREE.Color(0x888888),
  },
};

// ========================================
// ParticleSystem 클래스
// ========================================

export class ParticleSystem {
  private scene: THREE.Scene;
  
  // 파티클 풀 (타입별)
  private particlePools: Map<ParticleType, Particle[]> = new Map();
  private activeParticles: Particle[] = [];
  
  // 렌더링용 InstancedMesh (타입별)
  private instancedMeshes: Map<ParticleType, THREE.InstancedMesh> = new Map();
  
  // 재사용 임시 객체
  private tempMatrix = new THREE.Matrix4();
  private tempPosition = new THREE.Vector3();
  private tempQuaternion = new THREE.Quaternion();
  private tempScale = new THREE.Vector3();
  private tempColor = new THREE.Color();
  
  // 설정
  private readonly MAX_PARTICLES_PER_TYPE = 1000;
  private readonly POOL_SIZE = 500;
  
  // 메트릭
  private metrics = {
    activeCount: 0,
    pooledCount: 0,
    emittersActive: 0,
    lastUpdateTime: 0,
  };
  
  // 활성 이미터
  private activeEmitters: Map<string, {
    config: ParticleEmitterConfig;
    accumulatedTime: number;
    id: string;
  }> = new Map();
  
  private emitterIdCounter = 0;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.initialize();
  }

  // ========================================
  // 초기화
  // ========================================
  
  private initialize(): void {
    // 각 파티클 타입별로 풀과 InstancedMesh 생성
    const types: ParticleType[] = ['blood', 'dust', 'smoke', 'fire', 'sparks', 'arrow'];
    
    for (const type of types) {
      // 파티클 풀 초기화
      const pool: Particle[] = [];
      for (let i = 0; i < this.POOL_SIZE; i++) {
        pool.push(this.createEmptyParticle(type));
      }
      this.particlePools.set(type, pool);
      
      // InstancedMesh 생성
      const mesh = this.createInstancedMesh(type);
      this.instancedMeshes.set(type, mesh);
      this.scene.add(mesh);
    }
  }
  
  private createEmptyParticle(type: ParticleType): Particle {
    return {
      position: new THREE.Vector3(),
      velocity: new THREE.Vector3(),
      acceleration: new THREE.Vector3(),
      color: new THREE.Color(),
      size: 1,
      life: 0,
      maxLife: 1,
      rotation: 0,
      rotationSpeed: 0,
      alpha: 1,
      type,
      active: false,
    };
  }
  
  private createInstancedMesh(type: ParticleType): THREE.InstancedMesh {
    // 파티클 타입별 지오메트리
    let geometry: THREE.BufferGeometry;
    
    switch (type) {
      case 'blood':
      case 'sparks':
        // 작은 구
        geometry = new THREE.SphereGeometry(0.5, 4, 4);
        break;
      case 'dust':
      case 'smoke':
      case 'fire':
        // 빌보드용 평면
        geometry = new THREE.PlaneGeometry(1, 1);
        break;
      case 'arrow':
        // 긴 선분 형태
        geometry = new THREE.CylinderGeometry(0.02, 0.02, 1, 4);
        break;
      default:
        geometry = new THREE.SphereGeometry(0.5, 4, 4);
    }
    
    // 머티리얼 (알파 블렌딩 지원)
    const defaults = PARTICLE_DEFAULTS[type];
    const material = new THREE.MeshBasicMaterial({
      color: defaults.color || 0xffffff,
      transparent: true,
      opacity: 0.8,
      blending: type === 'fire' ? THREE.AdditiveBlending : THREE.NormalBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    
    const mesh = new THREE.InstancedMesh(geometry, material, this.MAX_PARTICLES_PER_TYPE);
    mesh.frustumCulled = true;
    mesh.count = 0;
    mesh.name = `particles_${type}`;
    
    return mesh;
  }

  // ========================================
  // 파티클 방출
  // ========================================
  
  /**
   * 일회성 파티클 방출
   */
  emit(config: ParticleEmitterConfig): void {
    const defaults = PARTICLE_DEFAULTS[config.type];
    const pool = this.particlePools.get(config.type);
    if (!pool) return;
    
    const direction = config.direction?.clone().normalize() || new THREE.Vector3(0, 1, 0);
    const spread = config.spread ?? defaults.spread ?? Math.PI / 4;
    const speed = config.speed ?? defaults.speed ?? 5;
    const speedVariance = config.speedVariance ?? defaults.speedVariance ?? 2;
    const size = config.size ?? defaults.size ?? 0.3;
    const sizeVariance = config.sizeVariance ?? defaults.sizeVariance ?? 0.1;
    const life = config.life ?? defaults.life ?? 1;
    const lifeVariance = config.lifeVariance ?? defaults.lifeVariance ?? 0.3;
    const gravity = config.gravity ?? defaults.gravity ?? -9.8;
    const color = config.color ?? defaults.color ?? new THREE.Color(0xffffff);
    
    for (let i = 0; i < config.count; i++) {
      const particle = this.acquireParticle(pool, config.type);
      if (!particle) break;
      
      // 위치 설정
      particle.position.copy(config.position);
      particle.position.x += (Math.random() - 0.5) * 0.5;
      particle.position.y += (Math.random() - 0.5) * 0.5;
      particle.position.z += (Math.random() - 0.5) * 0.5;
      
      // 속도 설정 (방향 + 랜덤 스프레드)
      const theta = (Math.random() - 0.5) * spread * 2;
      const phi = Math.random() * Math.PI * 2;
      
      const spreadDir = direction.clone();
      spreadDir.applyAxisAngle(new THREE.Vector3(1, 0, 0), theta);
      spreadDir.applyAxisAngle(new THREE.Vector3(0, 1, 0), phi);
      
      const particleSpeed = speed + (Math.random() - 0.5) * speedVariance * 2;
      particle.velocity.copy(spreadDir).multiplyScalar(particleSpeed);
      
      // 가속도 (중력)
      particle.acceleration.set(0, gravity, 0);
      
      // 크기, 수명, 색상
      particle.size = size + (Math.random() - 0.5) * sizeVariance * 2;
      particle.maxLife = life + (Math.random() - 0.5) * lifeVariance * 2;
      particle.life = particle.maxLife;
      particle.color.copy(color);
      particle.alpha = 1;
      
      // 회전 (빌보드 파티클용)
      particle.rotation = Math.random() * Math.PI * 2;
      particle.rotationSpeed = (Math.random() - 0.5) * 4;
      
      particle.active = true;
      this.activeParticles.push(particle);
    }
  }
  
  /**
   * 지속 이미터 생성
   */
  createEmitter(config: ParticleEmitterConfig): string {
    if (!config.continuous) {
      this.emit(config);
      return '';
    }
    
    const id = `emitter_${this.emitterIdCounter++}`;
    this.activeEmitters.set(id, {
      config,
      accumulatedTime: 0,
      id,
    });
    
    return id;
  }
  
  /**
   * 이미터 제거
   */
  removeEmitter(id: string): void {
    this.activeEmitters.delete(id);
  }
  
  /**
   * 이미터 위치 업데이트
   */
  updateEmitterPosition(id: string, position: THREE.Vector3): void {
    const emitter = this.activeEmitters.get(id);
    if (emitter) {
      emitter.config.position.copy(position);
    }
  }
  
  private acquireParticle(pool: Particle[], type: ParticleType): Particle | null {
    // 풀에서 비활성 파티클 찾기
    for (const particle of pool) {
      if (!particle.active) {
        return particle;
      }
    }
    
    // 풀이 꽉 찼으면 null
    return null;
  }

  // ========================================
  // 프리셋 이펙트
  // ========================================
  
  /**
   * 피 튀김 이펙트 (근접 전투 시)
   */
  emitBlood(position: THREE.Vector3, direction?: THREE.Vector3, intensity: number = 1): void {
    this.emit({
      type: 'blood',
      position: position.clone(),
      direction: direction || new THREE.Vector3(0, 1, 0),
      count: Math.floor(8 * intensity),
      spread: Math.PI / 4,
    });
  }
  
  /**
   * 먼지 이펙트 (이동, 충돌 시)
   */
  emitDust(position: THREE.Vector3, intensity: number = 1): void {
    this.emit({
      type: 'dust',
      position: position.clone(),
      count: Math.floor(12 * intensity),
      direction: new THREE.Vector3(0, 0.5, 0),
      spread: Math.PI / 2,
    });
  }
  
  /**
   * 연기 이펙트
   */
  emitSmoke(position: THREE.Vector3, duration: number = 3): string {
    return this.createEmitter({
      type: 'smoke',
      position: position.clone(),
      count: 5,
      continuous: true,
      emitRate: 10,
    });
  }
  
  /**
   * 화염 이펙트
   */
  emitFire(position: THREE.Vector3, duration: number = 2): string {
    return this.createEmitter({
      type: 'fire',
      position: position.clone(),
      count: 8,
      continuous: true,
      emitRate: 20,
    });
  }
  
  /**
   * 금속 불꽃 이펙트 (검 충돌 시)
   */
  emitSparks(position: THREE.Vector3, direction?: THREE.Vector3): void {
    this.emit({
      type: 'sparks',
      position: position.clone(),
      direction: direction || new THREE.Vector3(0, 1, 0),
      count: 15,
      spread: Math.PI / 2,
    });
  }
  
  /**
   * 화살 궤적 이펙트
   */
  emitArrowTrail(from: THREE.Vector3, to: THREE.Vector3, segments: number = 10): void {
    const direction = to.clone().sub(from);
    const length = direction.length();
    direction.normalize();
    
    for (let i = 0; i < segments; i++) {
      const t = i / segments;
      const pos = from.clone().add(direction.clone().multiplyScalar(length * t));
      
      // 포물선 궤적
      const arcHeight = Math.sin(t * Math.PI) * length * 0.1;
      pos.y += arcHeight;
      
      this.emit({
        type: 'arrow',
        position: pos,
        count: 1,
        life: 0.2 + t * 0.2,  // 끝으로 갈수록 오래 유지
        size: 0.03 + (1 - t) * 0.02,  // 앞쪽이 더 큼
      });
    }
  }
  
  /**
   * 돌격 먼지 이펙트 (기병 돌격 시)
   */
  emitChargeDust(position: THREE.Vector3, direction: THREE.Vector3): string {
    const backDir = direction.clone().negate();
    backDir.y = 0.3;
    backDir.normalize();
    
    return this.createEmitter({
      type: 'dust',
      position: position.clone(),
      direction: backDir,
      count: 3,
      continuous: true,
      emitRate: 15,
      speed: 5,
      spread: Math.PI / 6,
    });
  }
  
  /**
   * 폭발 이펙트 (공성 무기 등)
   */
  emitExplosion(position: THREE.Vector3, size: number = 1): void {
    // 연기
    this.emit({
      type: 'smoke',
      position: position.clone(),
      count: Math.floor(20 * size),
      spread: Math.PI,
      speed: 8 * size,
      size: 1.5 * size,
    });
    
    // 불꽃
    this.emit({
      type: 'fire',
      position: position.clone(),
      count: Math.floor(30 * size),
      spread: Math.PI,
      speed: 12 * size,
    });
    
    // 불꽃 조각
    this.emit({
      type: 'sparks',
      position: position.clone(),
      count: Math.floor(40 * size),
      spread: Math.PI,
      speed: 15 * size,
    });
    
    // 먼지
    this.emit({
      type: 'dust',
      position: position.clone(),
      count: Math.floor(15 * size),
      spread: Math.PI / 2,
      direction: new THREE.Vector3(0, 0.3, 0),
    });
  }
  
  /**
   * 죽음 이펙트
   */
  emitDeath(position: THREE.Vector3): void {
    // 피
    this.emit({
      type: 'blood',
      position: position.clone().add(new THREE.Vector3(0, 0.5, 0)),
      count: 12,
      spread: Math.PI / 2,
      speed: 3,
    });
    
    // 먼지 (쓰러짐)
    this.emit({
      type: 'dust',
      position: position.clone(),
      count: 6,
      spread: Math.PI / 3,
      speed: 1.5,
    });
  }

  // ========================================
  // 업데이트
  // ========================================
  
  update(deltaTime: number): void {
    const startTime = performance.now();
    
    // 지속 이미터 업데이트
    this.updateEmitters(deltaTime);
    
    // 활성 파티클 업데이트
    this.updateParticles(deltaTime);
    
    // 렌더링 업데이트
    this.updateRendering();
    
    // 메트릭 업데이트
    this.metrics.activeCount = this.activeParticles.length;
    this.metrics.emittersActive = this.activeEmitters.size;
    this.metrics.lastUpdateTime = performance.now() - startTime;
  }
  
  private updateEmitters(deltaTime: number): void {
    for (const [id, emitter] of this.activeEmitters) {
      emitter.accumulatedTime += deltaTime;
      
      const emitRate = emitter.config.emitRate || 10;
      const interval = 1 / emitRate;
      
      while (emitter.accumulatedTime >= interval) {
        emitter.accumulatedTime -= interval;
        
        // 파티클 방출 (continuous가 아닌 설정으로)
        const singleConfig = { ...emitter.config, continuous: false };
        this.emit(singleConfig);
      }
    }
  }
  
  private updateParticles(deltaTime: number): void {
    // 역순으로 순회하여 안전하게 제거
    for (let i = this.activeParticles.length - 1; i >= 0; i--) {
      const particle = this.activeParticles[i];
      
      // 수명 감소
      particle.life -= deltaTime;
      
      if (particle.life <= 0) {
        // 비활성화
        particle.active = false;
        this.activeParticles.splice(i, 1);
        continue;
      }
      
      // 물리 업데이트
      particle.velocity.add(
        particle.acceleration.clone().multiplyScalar(deltaTime)
      );
      particle.position.add(
        particle.velocity.clone().multiplyScalar(deltaTime)
      );
      
      // 회전 업데이트
      particle.rotation += particle.rotationSpeed * deltaTime;
      
      // 알파 페이드
      particle.alpha = particle.life / particle.maxLife;
      
      // 바닥 충돌 (blood, sparks)
      if ((particle.type === 'blood' || particle.type === 'sparks') && particle.position.y < 0) {
        particle.position.y = 0;
        particle.velocity.y = 0;
        particle.velocity.x *= 0.5;
        particle.velocity.z *= 0.5;
      }
    }
  }
  
  private updateRendering(): void {
    // 타입별로 활성 파티클 그룹화
    const particlesByType = new Map<ParticleType, Particle[]>();
    
    for (const particle of this.activeParticles) {
      if (!particlesByType.has(particle.type)) {
        particlesByType.set(particle.type, []);
      }
      particlesByType.get(particle.type)!.push(particle);
    }
    
    // 각 타입의 InstancedMesh 업데이트
    for (const [type, mesh] of this.instancedMeshes) {
      const particles = particlesByType.get(type) || [];
      mesh.count = particles.length;
      
      if (particles.length === 0) {
        mesh.visible = false;
        continue;
      }
      
      mesh.visible = true;
      
      // 머티리얼 업데이트 (전체 알파)
      // 개별 파티클 알파는 인스턴스 색상으로 처리
      
      for (let i = 0; i < particles.length; i++) {
        const particle = particles[i];
        
        // 매트릭스 설정
        this.tempPosition.copy(particle.position);
        this.tempScale.setScalar(particle.size);
        
        // 빌보드 회전 (평면 파티클용)
        if (type === 'dust' || type === 'smoke' || type === 'fire') {
          this.tempQuaternion.setFromAxisAngle(
            new THREE.Vector3(0, 0, 1),
            particle.rotation
          );
        } else {
          this.tempQuaternion.identity();
        }
        
        this.tempMatrix.compose(this.tempPosition, this.tempQuaternion, this.tempScale);
        mesh.setMatrixAt(i, this.tempMatrix);
        
        // 색상 및 알파 설정
        this.tempColor.copy(particle.color);
        // InstancedMesh는 개별 알파를 지원하지 않으므로 색상 밝기로 대체
        this.tempColor.multiplyScalar(particle.alpha);
        mesh.setColorAt(i, this.tempColor);
      }
      
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) {
        mesh.instanceColor.needsUpdate = true;
      }
    }
  }

  // ========================================
  // 유틸리티
  // ========================================
  
  /**
   * 모든 파티클 제거
   */
  clear(): void {
    // 활성 파티클 비활성화
    for (const particle of this.activeParticles) {
      particle.active = false;
    }
    this.activeParticles = [];
    
    // 이미터 제거
    this.activeEmitters.clear();
    
    // InstancedMesh 카운트 리셋
    for (const mesh of this.instancedMeshes.values()) {
      mesh.count = 0;
      mesh.visible = false;
    }
  }
  
  /**
   * 메트릭 조회
   */
  getMetrics(): typeof this.metrics {
    return { ...this.metrics };
  }
  
  /**
   * 풀 상태 조회
   */
  getPoolStats(): Map<ParticleType, { total: number; active: number }> {
    const stats = new Map<ParticleType, { total: number; active: number }>();
    
    for (const [type, pool] of this.particlePools) {
      const active = pool.filter(p => p.active).length;
      stats.set(type, { total: pool.length, active });
    }
    
    return stats;
  }
  
  /**
   * 리소스 정리
   */
  dispose(): void {
    this.clear();
    
    // InstancedMesh 정리
    for (const mesh of this.instancedMeshes.values()) {
      this.scene.remove(mesh);
      mesh.geometry.dispose();
      if (mesh.material instanceof THREE.Material) {
        mesh.material.dispose();
      }
    }
    
    this.instancedMeshes.clear();
    this.particlePools.clear();
  }
}

// ========================================
// 싱글톤 헬퍼
// ========================================

let particleSystemInstance: ParticleSystem | null = null;

export function initParticleSystem(scene: THREE.Scene): ParticleSystem {
  if (particleSystemInstance) {
    particleSystemInstance.dispose();
  }
  particleSystemInstance = new ParticleSystem(scene);
  return particleSystemInstance;
}

export function getParticleSystem(): ParticleSystem | null {
  return particleSystemInstance;
}





