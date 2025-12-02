/**
 * VFXParticleSystem - 고성능 파티클 시스템
 * 
 * 특징:
 * - InstancedMesh 기반 배치 렌더링
 * - 오브젝트 풀링으로 GC 압력 최소화
 * - 색상 그라디언트 지원
 * - 다양한 이미터 프리셋
 */

import * as THREE from 'three';

// ========================================
// 타입 정의
// ========================================

/** 파티클 타입 */
export type VFXParticleType = 
  | 'spark'       // 금속 불꽃
  | 'dust'        // 먼지
  | 'smoke'       // 연기
  | 'fire'        // 불꽃
  | 'blood'       // 피
  | 'magic'       // 마법 입자
  | 'rain'        // 빗방울
  | 'snow'        // 눈송이
  | 'sand'        // 모래
  | 'debris'      // 파편
  | 'glow'        // 발광
  | 'water';      // 물

/** 단일 파티클 */
export interface VFXParticle {
  // 위치/운동
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  acceleration: THREE.Vector3;
  
  // 외형
  color: THREE.Color;
  colorEnd: THREE.Color;
  size: number;
  sizeEnd: number;
  
  // 수명
  life: number;
  maxLife: number;
  
  // 회전
  rotation: number;
  rotationSpeed: number;
  
  // 알파
  alpha: number;
  alphaEnd: number;
  
  // 타입
  type: VFXParticleType;
  
  // 상태
  active: boolean;
  index: number; // InstancedMesh 인덱스
}

/** 이미터 설정 */
export interface ParticleEmitterConfig {
  type: VFXParticleType;
  
  // 발생 위치
  position: THREE.Vector3;
  positionVariance?: THREE.Vector3;
  
  // 발생 방향
  direction?: THREE.Vector3;
  spread?: number; // 라디안
  
  // 속도
  speed: number;
  speedVariance?: number;
  
  // 크기
  size: number;
  sizeVariance?: number;
  sizeEnd?: number;
  
  // 수명
  life: number;
  lifeVariance?: number;
  
  // 색상
  color: number;
  colorVariance?: number;
  colorEnd?: number;
  
  // 알파
  alpha?: number;
  alphaEnd?: number;
  
  // 물리
  gravity?: number;
  drag?: number;
  
  // 회전
  rotationSpeed?: number;
  
  // 발생 설정
  count: number;
  continuous?: boolean;
  emitRate?: number; // continuous일 때 초당 발생 수
}

/** 파티클 타입별 기본 설정 */
const PARTICLE_PRESETS: Record<VFXParticleType, Partial<ParticleEmitterConfig>> = {
  spark: {
    spread: Math.PI / 2,
    speed: 15,
    speedVariance: 5,
    size: 0.06,
    sizeVariance: 0.03,
    sizeEnd: 0.02,
    life: 0.4,
    lifeVariance: 0.2,
    color: 0xFFFF00,
    colorEnd: 0xFF6600,
    alpha: 1,
    alphaEnd: 0,
    gravity: -12,
    drag: 0.95,
  },
  dust: {
    spread: Math.PI / 3,
    speed: 3,
    speedVariance: 1.5,
    size: 0.25,
    sizeVariance: 0.15,
    sizeEnd: 0.5,
    life: 1.5,
    lifeVariance: 0.5,
    color: 0x8B7355,
    colorEnd: 0x8B7355,
    alpha: 0.6,
    alphaEnd: 0,
    gravity: -0.5,
    drag: 0.98,
  },
  smoke: {
    spread: Math.PI / 4,
    speed: 2.5,
    speedVariance: 1,
    size: 0.5,
    sizeVariance: 0.3,
    sizeEnd: 1.5,
    life: 3,
    lifeVariance: 1,
    color: 0x444444,
    colorEnd: 0x222222,
    alpha: 0.5,
    alphaEnd: 0,
    gravity: 1.5, // 위로 상승
    drag: 0.97,
  },
  fire: {
    spread: Math.PI / 6,
    speed: 4,
    speedVariance: 2,
    size: 0.3,
    sizeVariance: 0.15,
    sizeEnd: 0.1,
    life: 0.5,
    lifeVariance: 0.2,
    color: 0xFF4500,
    colorEnd: 0xFF8C00,
    alpha: 0.9,
    alphaEnd: 0,
    gravity: 4, // 위로 상승
    drag: 0.96,
  },
  blood: {
    spread: Math.PI / 4,
    speed: 8,
    speedVariance: 3,
    size: 0.1,
    sizeVariance: 0.05,
    sizeEnd: 0.05,
    life: 0.8,
    lifeVariance: 0.3,
    color: 0x8B0000,
    colorEnd: 0x4A0000,
    alpha: 0.9,
    alphaEnd: 0.3,
    gravity: -15,
    drag: 0.98,
  },
  magic: {
    spread: Math.PI,
    speed: 2,
    speedVariance: 1,
    size: 0.12,
    sizeVariance: 0.08,
    sizeEnd: 0.04,
    life: 1.2,
    lifeVariance: 0.4,
    color: 0x9966FF,
    colorEnd: 0x4422AA,
    alpha: 0.8,
    alphaEnd: 0,
    gravity: 0.5,
    drag: 0.99,
  },
  rain: {
    spread: 0.1,
    speed: 25,
    speedVariance: 5,
    size: 0.03,
    sizeVariance: 0.01,
    sizeEnd: 0.03,
    life: 1,
    lifeVariance: 0.3,
    color: 0x6699CC,
    colorEnd: 0x6699CC,
    alpha: 0.5,
    alphaEnd: 0.3,
    gravity: -30,
    drag: 1,
  },
  snow: {
    spread: Math.PI / 6,
    speed: 2,
    speedVariance: 1,
    size: 0.08,
    sizeVariance: 0.04,
    sizeEnd: 0.06,
    life: 4,
    lifeVariance: 1.5,
    color: 0xFFFFFF,
    colorEnd: 0xDDDDFF,
    alpha: 0.8,
    alphaEnd: 0.2,
    gravity: -2,
    drag: 0.99,
    rotationSpeed: 2,
  },
  sand: {
    spread: Math.PI / 2,
    speed: 8,
    speedVariance: 4,
    size: 0.04,
    sizeVariance: 0.02,
    sizeEnd: 0.03,
    life: 2,
    lifeVariance: 0.8,
    color: 0xC2B280,
    colorEnd: 0xC2B280,
    alpha: 0.6,
    alphaEnd: 0.1,
    gravity: -8,
    drag: 0.97,
  },
  debris: {
    spread: Math.PI,
    speed: 12,
    speedVariance: 6,
    size: 0.15,
    sizeVariance: 0.1,
    sizeEnd: 0.1,
    life: 1.2,
    lifeVariance: 0.5,
    color: 0x666666,
    colorEnd: 0x444444,
    alpha: 1,
    alphaEnd: 0.5,
    gravity: -18,
    drag: 0.96,
    rotationSpeed: 8,
  },
  glow: {
    spread: 0,
    speed: 0,
    speedVariance: 0.5,
    size: 0.3,
    sizeVariance: 0.1,
    sizeEnd: 0.6,
    life: 0.8,
    lifeVariance: 0.2,
    color: 0xFFFFFF,
    colorEnd: 0xFFFFFF,
    alpha: 0.6,
    alphaEnd: 0,
    gravity: 0,
    drag: 1,
  },
  water: {
    spread: Math.PI / 3,
    speed: 6,
    speedVariance: 2,
    size: 0.08,
    sizeVariance: 0.04,
    sizeEnd: 0.04,
    life: 0.6,
    lifeVariance: 0.2,
    color: 0x4488CC,
    colorEnd: 0x2266AA,
    alpha: 0.7,
    alphaEnd: 0,
    gravity: -15,
    drag: 0.98,
  },
};

// ========================================
// VFXParticleSystem 클래스
// ========================================

export class VFXParticleSystem {
  private scene: THREE.Scene;
  
  // 파티클 풀 (타입별)
  private pools: Map<VFXParticleType, VFXParticle[]> = new Map();
  private activeParticles: VFXParticle[] = [];
  
  // 렌더링용 InstancedMesh (타입별)
  private instancedMeshes: Map<VFXParticleType, THREE.InstancedMesh> = new Map();
  
  // 이미터
  private emitters: Map<string, {
    config: ParticleEmitterConfig;
    accumulator: number;
    id: string;
  }> = new Map();
  private emitterIdCounter = 0;
  
  // 설정
  private maxParticles: number;
  private poolSize: number;
  private qualityMultiplier = 1;
  
  // 임시 객체 (GC 최소화)
  private tempMatrix = new THREE.Matrix4();
  private tempPosition = new THREE.Vector3();
  private tempQuaternion = new THREE.Quaternion();
  private tempScale = new THREE.Vector3();
  private tempColor = new THREE.Color();
  private tempVec3 = new THREE.Vector3();
  
  constructor(scene: THREE.Scene, maxParticles: number = 5000) {
    this.scene = scene;
    this.maxParticles = maxParticles;
    this.poolSize = Math.floor(maxParticles / 12); // 타입별 풀 크기
    
    this.initialize();
  }
  
  // ========================================
  // 초기화
  // ========================================
  
  private initialize(): void {
    const types: VFXParticleType[] = [
      'spark', 'dust', 'smoke', 'fire', 'blood', 'magic',
      'rain', 'snow', 'sand', 'debris', 'glow', 'water'
    ];
    
    for (const type of types) {
      // 풀 초기화
      const pool: VFXParticle[] = [];
      for (let i = 0; i < this.poolSize; i++) {
        pool.push(this.createEmptyParticle(type, i));
      }
      this.pools.set(type, pool);
      
      // InstancedMesh 생성
      const mesh = this.createInstancedMesh(type);
      this.instancedMeshes.set(type, mesh);
      this.scene.add(mesh);
    }
  }
  
  private createEmptyParticle(type: VFXParticleType, index: number): VFXParticle {
    return {
      position: new THREE.Vector3(),
      velocity: new THREE.Vector3(),
      acceleration: new THREE.Vector3(),
      color: new THREE.Color(),
      colorEnd: new THREE.Color(),
      size: 1,
      sizeEnd: 1,
      life: 0,
      maxLife: 1,
      rotation: 0,
      rotationSpeed: 0,
      alpha: 1,
      alphaEnd: 0,
      type,
      active: false,
      index,
    };
  }
  
  private createInstancedMesh(type: VFXParticleType): THREE.InstancedMesh {
    let geometry: THREE.BufferGeometry;
    
    // 타입별 지오메트리
    switch (type) {
      case 'spark':
      case 'blood':
      case 'water':
        geometry = new THREE.SphereGeometry(0.5, 4, 4);
        break;
      case 'rain':
        geometry = new THREE.CylinderGeometry(0.02, 0.02, 0.5, 4);
        break;
      case 'debris':
        geometry = new THREE.BoxGeometry(1, 1, 1);
        break;
      default:
        // 빌보드 평면
        geometry = new THREE.PlaneGeometry(1, 1);
        break;
    }
    
    // 타입별 머티리얼
    const preset = PARTICLE_PRESETS[type];
    const material = new THREE.MeshBasicMaterial({
      color: preset.color || 0xFFFFFF,
      transparent: true,
      opacity: 0.8,
      blending: type === 'fire' || type === 'spark' || type === 'glow' || type === 'magic'
        ? THREE.AdditiveBlending
        : THREE.NormalBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    
    const mesh = new THREE.InstancedMesh(geometry, material, this.poolSize);
    mesh.frustumCulled = true;
    mesh.count = 0;
    mesh.name = `vfx_particles_${type}`;
    
    return mesh;
  }
  
  // ========================================
  // 파티클 방출
  // ========================================
  
  /**
   * 파티클 방출
   */
  emit(
    type: VFXParticleType | string,
    position: THREE.Vector3,
    count: number,
    options?: Partial<ParticleEmitterConfig>
  ): void {
    const particleType = type as VFXParticleType;
    const pool = this.pools.get(particleType);
    if (!pool) {
      console.warn(`Unknown particle type: ${type}`);
      return;
    }
    
    const preset = PARTICLE_PRESETS[particleType];
    const config = { ...preset, ...options } as ParticleEmitterConfig;
    
    const direction = config.direction?.clone().normalize() || new THREE.Vector3(0, 1, 0);
    const spread = config.spread ?? Math.PI / 4;
    
    const actualCount = Math.floor(count * this.qualityMultiplier);
    
    for (let i = 0; i < actualCount; i++) {
      const particle = this.acquireParticle(pool);
      if (!particle) break;
      
      // 위치 설정
      particle.position.copy(position);
      if (config.positionVariance) {
        particle.position.x += (Math.random() - 0.5) * config.positionVariance.x;
        particle.position.y += (Math.random() - 0.5) * config.positionVariance.y;
        particle.position.z += (Math.random() - 0.5) * config.positionVariance.z;
      } else {
        particle.position.x += (Math.random() - 0.5) * 0.3;
        particle.position.y += (Math.random() - 0.5) * 0.3;
        particle.position.z += (Math.random() - 0.5) * 0.3;
      }
      
      // 속도 설정
      const theta = (Math.random() - 0.5) * spread * 2;
      const phi = Math.random() * Math.PI * 2;
      
      const spreadDir = direction.clone();
      spreadDir.applyAxisAngle(new THREE.Vector3(1, 0, 0), theta);
      spreadDir.applyAxisAngle(new THREE.Vector3(0, 1, 0), phi);
      
      const speed = config.speed + (Math.random() - 0.5) * (config.speedVariance ?? 0) * 2;
      particle.velocity.copy(spreadDir).multiplyScalar(speed);
      
      // 가속도 (중력)
      const gravity = config.gravity ?? -9.8;
      particle.acceleration.set(0, gravity, 0);
      
      // 크기
      particle.size = config.size + (Math.random() - 0.5) * (config.sizeVariance ?? 0) * 2;
      particle.sizeEnd = config.sizeEnd ?? particle.size * 0.5;
      
      // 수명
      particle.maxLife = config.life + (Math.random() - 0.5) * (config.lifeVariance ?? 0) * 2;
      particle.life = particle.maxLife;
      
      // 색상
      particle.color.setHex(config.color);
      if (config.colorVariance) {
        particle.color.r += (Math.random() - 0.5) * config.colorVariance;
        particle.color.g += (Math.random() - 0.5) * config.colorVariance;
        particle.color.b += (Math.random() - 0.5) * config.colorVariance;
      }
      particle.colorEnd.setHex(config.colorEnd ?? config.color);
      
      // 알파
      particle.alpha = config.alpha ?? 1;
      particle.alphaEnd = config.alphaEnd ?? 0;
      
      // 회전
      particle.rotation = Math.random() * Math.PI * 2;
      particle.rotationSpeed = config.rotationSpeed ?? 0;
      if (particle.rotationSpeed) {
        particle.rotationSpeed += (Math.random() - 0.5) * particle.rotationSpeed;
      }
      
      particle.active = true;
      this.activeParticles.push(particle);
    }
  }
  
  /**
   * 지속 이미터 생성
   */
  createEmitter(config: ParticleEmitterConfig): string {
    const id = `emitter_${this.emitterIdCounter++}`;
    
    this.emitters.set(id, {
      config: {
        ...PARTICLE_PRESETS[config.type],
        ...config,
      } as ParticleEmitterConfig,
      accumulator: 0,
      id,
    });
    
    return id;
  }
  
  /**
   * 이미터 제거
   */
  removeEmitter(id: string): void {
    this.emitters.delete(id);
  }
  
  /**
   * 이미터 위치 업데이트
   */
  updateEmitterPosition(id: string, position: THREE.Vector3): void {
    const emitter = this.emitters.get(id);
    if (emitter) {
      emitter.config.position.copy(position);
    }
  }
  
  // ========================================
  // 풀 관리
  // ========================================
  
  private acquireParticle(pool: VFXParticle[]): VFXParticle | null {
    for (const particle of pool) {
      if (!particle.active) {
        return particle;
      }
    }
    return null;
  }
  
  // ========================================
  // 업데이트
  // ========================================
  
  /**
   * 프레임 업데이트
   */
  update(deltaTime: number): void {
    // 이미터 업데이트
    this.updateEmitters(deltaTime);
    
    // 파티클 업데이트
    this.updateParticles(deltaTime);
    
    // 렌더링 업데이트
    this.updateRendering();
  }
  
  private updateEmitters(deltaTime: number): void {
    for (const [id, emitter] of this.emitters) {
      if (!emitter.config.continuous) continue;
      
      emitter.accumulator += deltaTime;
      const interval = 1 / (emitter.config.emitRate || 10);
      
      while (emitter.accumulator >= interval) {
        emitter.accumulator -= interval;
        this.emit(
          emitter.config.type,
          emitter.config.position,
          emitter.config.count || 1,
          emitter.config
        );
      }
    }
  }
  
  private updateParticles(deltaTime: number): void {
    // 역순으로 순회 (안전한 제거)
    for (let i = this.activeParticles.length - 1; i >= 0; i--) {
      const particle = this.activeParticles[i];
      
      // 수명 감소
      particle.life -= deltaTime;
      
      if (particle.life <= 0) {
        particle.active = false;
        this.activeParticles.splice(i, 1);
        continue;
      }
      
      // 드래그 적용
      const preset = PARTICLE_PRESETS[particle.type];
      const drag = preset.drag ?? 1;
      particle.velocity.multiplyScalar(Math.pow(drag, deltaTime * 60));
      
      // 가속도 적용
      this.tempVec3.copy(particle.acceleration).multiplyScalar(deltaTime);
      particle.velocity.add(this.tempVec3);
      
      // 위치 업데이트
      this.tempVec3.copy(particle.velocity).multiplyScalar(deltaTime);
      particle.position.add(this.tempVec3);
      
      // 회전 업데이트
      particle.rotation += particle.rotationSpeed * deltaTime;
      
      // 바닥 충돌
      if ((particle.type === 'blood' || particle.type === 'debris' || particle.type === 'water') 
          && particle.position.y < 0) {
        particle.position.y = 0;
        particle.velocity.y = 0;
        particle.velocity.x *= 0.5;
        particle.velocity.z *= 0.5;
      }
    }
  }
  
  private updateRendering(): void {
    // 타입별로 활성 파티클 그룹화
    const particlesByType = new Map<VFXParticleType, VFXParticle[]>();
    
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
      
      for (let i = 0; i < particles.length; i++) {
        const particle = particles[i];
        const t = 1 - (particle.life / particle.maxLife);
        
        // 위치
        this.tempPosition.copy(particle.position);
        
        // 크기 보간
        const size = THREE.MathUtils.lerp(particle.size, particle.sizeEnd, t);
        this.tempScale.setScalar(size);
        
        // 회전 (빌보드 파티클)
        if (type === 'dust' || type === 'smoke' || type === 'fire' || type === 'snow' || type === 'glow' || type === 'magic') {
          this.tempQuaternion.setFromAxisAngle(
            new THREE.Vector3(0, 0, 1),
            particle.rotation
          );
        } else {
          this.tempQuaternion.identity();
        }
        
        // 매트릭스 조합
        this.tempMatrix.compose(this.tempPosition, this.tempQuaternion, this.tempScale);
        mesh.setMatrixAt(i, this.tempMatrix);
        
        // 색상 보간
        this.tempColor.copy(particle.color);
        this.tempColor.lerp(particle.colorEnd, t);
        
        // 알파 보간 (색상 밝기로 시뮬레이션)
        const alpha = THREE.MathUtils.lerp(particle.alpha, particle.alphaEnd, t);
        this.tempColor.multiplyScalar(alpha);
        
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
   * 품질 설정
   */
  setQuality(multiplier: number): void {
    this.qualityMultiplier = Math.max(0.25, Math.min(2, multiplier));
  }
  
  /**
   * 활성 파티클 수
   */
  getActiveCount(): number {
    return this.activeParticles.length;
  }
  
  /**
   * 모든 파티클 제거
   */
  clear(): void {
    for (const particle of this.activeParticles) {
      particle.active = false;
    }
    this.activeParticles = [];
    this.emitters.clear();
    
    for (const mesh of this.instancedMeshes.values()) {
      mesh.count = 0;
      mesh.visible = false;
    }
  }
  
  /**
   * 리소스 정리
   */
  dispose(): void {
    this.clear();
    
    for (const mesh of this.instancedMeshes.values()) {
      this.scene.remove(mesh);
      mesh.geometry.dispose();
      if (mesh.material instanceof THREE.Material) {
        mesh.material.dispose();
      }
    }
    
    this.instancedMeshes.clear();
    this.pools.clear();
    
    console.log('🧹 VFXParticleSystem disposed');
  }
}

export default VFXParticleSystem;





