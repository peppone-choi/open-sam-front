/**
 * ImpactEffects - 충돌 이펙트 시스템
 * 
 * 지원 타입:
 * - spark: 금속 충돌 불꽃
 * - dust: 먼지 구름
 * - blood: 피 튀김
 * - explosion: 폭발
 * - splash: 물 튀김
 * - magic: 마법 충돌
 * - debris: 파편
 */

import * as THREE from 'three';
import { VFXParticleSystem } from './ParticleSystem';

// ========================================
// 타입 정의
// ========================================

export type ImpactType = 
  | 'spark'
  | 'dust'
  | 'blood'
  | 'explosion'
  | 'splash'
  | 'magic'
  | 'debris';

/** 충돌 이펙트 인스턴스 */
interface ImpactInstance {
  id: string;
  type: ImpactType;
  position: THREE.Vector3;
  time: number;
  duration: number;
  mesh?: THREE.Object3D;
  active: boolean;
}

/** 충돌 옵션 */
export interface ImpactOptions {
  scale?: number;
  direction?: THREE.Vector3;
  color?: number;
  intensity?: number;
}

/** 폭발 옵션 */
export interface ExplosionOptions {
  intensity?: number;
  color?: number;
  shockwave?: boolean;
  debris?: boolean;
  smoke?: boolean;
  fire?: boolean;
}

// ========================================
// 충돌 이펙트 설정
// ========================================

const IMPACT_CONFIGS: Record<ImpactType, {
  particleType: string;
  particleCount: number;
  duration: number;
  hasMesh: boolean;
  meshColor?: number;
}> = {
  spark: {
    particleType: 'spark',
    particleCount: 15,
    duration: 0.5,
    hasMesh: false,
  },
  dust: {
    particleType: 'dust',
    particleCount: 12,
    duration: 1.5,
    hasMesh: false,
  },
  blood: {
    particleType: 'blood',
    particleCount: 10,
    duration: 0.8,
    hasMesh: false,
  },
  explosion: {
    particleType: 'fire',
    particleCount: 30,
    duration: 1.2,
    hasMesh: true,
    meshColor: 0xFF4500,
  },
  splash: {
    particleType: 'water',
    particleCount: 20,
    duration: 0.6,
    hasMesh: false,
  },
  magic: {
    particleType: 'magic',
    particleCount: 25,
    duration: 1.0,
    hasMesh: true,
    meshColor: 0x9966FF,
  },
  debris: {
    particleType: 'debris',
    particleCount: 15,
    duration: 1.5,
    hasMesh: false,
  },
};

// ========================================
// ImpactEffects 클래스
// ========================================

export class ImpactEffects {
  private scene: THREE.Scene;
  private particleSystem: VFXParticleSystem;
  
  // 활성 이펙트
  private activeEffects: Map<string, ImpactInstance> = new Map();
  private idCounter = 0;
  
  // 메시 풀 (폭발 등)
  private explosionMeshPool: THREE.Mesh[] = [];
  private shockwaveMeshPool: THREE.Mesh[] = [];
  private magicMeshPool: THREE.Mesh[] = [];
  
  // 공유 리소스
  private explosionGeometry: THREE.SphereGeometry;
  private shockwaveGeometry: THREE.RingGeometry;
  private magicGeometry: THREE.SphereGeometry;
  
  private explosionMaterial: THREE.MeshBasicMaterial;
  private shockwaveMaterial: THREE.MeshBasicMaterial;
  private magicMaterial: THREE.MeshBasicMaterial;
  
  // 설정
  private readonly POOL_SIZE = 20;
  
  constructor(scene: THREE.Scene, particleSystem: VFXParticleSystem) {
    this.scene = scene;
    this.particleSystem = particleSystem;
    
    this.initSharedResources();
    this.initMeshPools();
  }
  
  // ========================================
  // 초기화
  // ========================================
  
  private initSharedResources(): void {
    // 폭발 지오메트리/머티리얼
    this.explosionGeometry = new THREE.SphereGeometry(1, 16, 16);
    this.explosionMaterial = new THREE.MeshBasicMaterial({
      color: 0xFF4500,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    
    // 충격파 지오메트리/머티리얼
    this.shockwaveGeometry = new THREE.RingGeometry(0.1, 1, 32);
    this.shockwaveMaterial = new THREE.MeshBasicMaterial({
      color: 0xFFFF00,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    
    // 마법 충돌 지오메트리/머티리얼
    this.magicGeometry = new THREE.SphereGeometry(1, 12, 12);
    this.magicMaterial = new THREE.MeshBasicMaterial({
      color: 0x9966FF,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
  }
  
  private initMeshPools(): void {
    // 폭발 메시 풀
    for (let i = 0; i < this.POOL_SIZE; i++) {
      const mesh = new THREE.Mesh(this.explosionGeometry, this.explosionMaterial.clone());
      mesh.visible = false;
      this.scene.add(mesh);
      this.explosionMeshPool.push(mesh);
    }
    
    // 충격파 메시 풀
    for (let i = 0; i < this.POOL_SIZE; i++) {
      const mesh = new THREE.Mesh(this.shockwaveGeometry, this.shockwaveMaterial.clone());
      mesh.rotation.x = -Math.PI / 2;
      mesh.visible = false;
      this.scene.add(mesh);
      this.shockwaveMeshPool.push(mesh);
    }
    
    // 마법 메시 풀
    for (let i = 0; i < this.POOL_SIZE; i++) {
      const mesh = new THREE.Mesh(this.magicGeometry, this.magicMaterial.clone());
      mesh.visible = false;
      this.scene.add(mesh);
      this.magicMeshPool.push(mesh);
    }
  }
  
  // ========================================
  // 충돌 이펙트 생성
  // ========================================
  
  /**
   * 기본 충돌 이펙트
   */
  spawn(type: ImpactType, position: THREE.Vector3, options?: ImpactOptions): string {
    const config = IMPACT_CONFIGS[type];
    const scale = options?.scale ?? 1;
    const direction = options?.direction ?? new THREE.Vector3(0, 1, 0);
    const color = options?.color;
    const intensity = options?.intensity ?? 1;
    
    const id = `impact_${this.idCounter++}`;
    
    // 파티클 방출
    const particleCount = Math.floor(config.particleCount * scale * intensity);
    this.particleSystem.emit(
      config.particleType,
      position,
      particleCount,
      {
        direction,
        color: color ?? IMPACT_CONFIGS[type].meshColor,
      }
    );
    
    // 메시 이펙트 (폭발, 마법)
    let mesh: THREE.Object3D | undefined;
    if (config.hasMesh) {
      if (type === 'explosion') {
        mesh = this.acquireExplosionMesh();
      } else if (type === 'magic') {
        mesh = this.acquireMagicMesh();
      }
      
      if (mesh) {
        mesh.position.copy(position);
        mesh.scale.setScalar(0.1);
        mesh.visible = true;
        
        if (color) {
          (mesh.material as THREE.MeshBasicMaterial).color.setHex(color);
        }
      }
    }
    
    // 인스턴스 등록
    this.activeEffects.set(id, {
      id,
      type,
      position: position.clone(),
      time: 0,
      duration: config.duration,
      mesh,
      active: true,
    });
    
    return id;
  }
  
  /**
   * 폭발 이펙트 (확장)
   */
  spawnExplosion(
    position: THREE.Vector3,
    radius: number = 1,
    options?: ExplosionOptions
  ): string {
    const intensity = options?.intensity ?? 1;
    const color = options?.color ?? 0xFF4500;
    const hasShockwave = options?.shockwave ?? true;
    const hasDebris = options?.debris ?? true;
    const hasSmoke = options?.smoke ?? true;
    const hasFire = options?.fire ?? true;
    
    const id = `explosion_${this.idCounter++}`;
    
    // 메인 폭발 메시
    const explosionMesh = this.acquireExplosionMesh();
    if (explosionMesh) {
      explosionMesh.position.copy(position);
      explosionMesh.scale.setScalar(0.1);
      explosionMesh.visible = true;
      (explosionMesh.material as THREE.MeshBasicMaterial).color.setHex(color);
    }
    
    // 충격파
    let shockwaveMesh: THREE.Mesh | undefined;
    if (hasShockwave) {
      shockwaveMesh = this.acquireShockwaveMesh();
      if (shockwaveMesh) {
        shockwaveMesh.position.copy(position);
        shockwaveMesh.position.y = 0.1;
        shockwaveMesh.scale.setScalar(0.1);
        shockwaveMesh.visible = true;
      }
    }
    
    // 불꽃 파티클
    if (hasFire) {
      this.particleSystem.emit('fire', position, Math.floor(30 * radius * intensity), {
        speed: 12 * radius,
        size: 0.4 * radius,
        color: 0xFF4500,
      });
    }
    
    // 연기 파티클
    if (hasSmoke) {
      this.particleSystem.emit('smoke', position, Math.floor(20 * radius * intensity), {
        speed: 5 * radius,
        size: 0.8 * radius,
        direction: new THREE.Vector3(0, 1, 0),
      });
    }
    
    // 파편 파티클
    if (hasDebris) {
      this.particleSystem.emit('debris', position, Math.floor(15 * radius * intensity), {
        speed: 15 * radius,
        size: 0.15 * radius,
      });
    }
    
    // 불꽃 스파크
    this.particleSystem.emit('spark', position, Math.floor(40 * radius * intensity), {
      speed: 20 * radius,
    });
    
    // 먼지
    const dustPos = position.clone();
    dustPos.y = 0.1;
    this.particleSystem.emit('dust', dustPos, Math.floor(15 * radius * intensity), {
      speed: 4 * radius,
      direction: new THREE.Vector3(0, 0.3, 0),
    });
    
    // 인스턴스 등록
    this.activeEffects.set(id, {
      id,
      type: 'explosion',
      position: position.clone(),
      time: 0,
      duration: 1.5,
      mesh: explosionMesh,
      active: true,
    });
    
    // 충격파 별도 등록
    if (shockwaveMesh) {
      const swId = `${id}_shockwave`;
      this.activeEffects.set(swId, {
        id: swId,
        type: 'explosion',
        position: position.clone(),
        time: 0,
        duration: 0.8,
        mesh: shockwaveMesh,
        active: true,
      });
    }
    
    return id;
  }
  
  // ========================================
  // 메시 풀 관리
  // ========================================
  
  private acquireExplosionMesh(): THREE.Mesh | undefined {
    for (const mesh of this.explosionMeshPool) {
      if (!mesh.visible) {
        return mesh;
      }
    }
    return undefined;
  }
  
  private acquireShockwaveMesh(): THREE.Mesh | undefined {
    for (const mesh of this.shockwaveMeshPool) {
      if (!mesh.visible) {
        return mesh;
      }
    }
    return undefined;
  }
  
  private acquireMagicMesh(): THREE.Mesh | undefined {
    for (const mesh of this.magicMeshPool) {
      if (!mesh.visible) {
        return mesh;
      }
    }
    return undefined;
  }
  
  private releaseMesh(mesh: THREE.Object3D): void {
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
    const toRemove: string[] = [];
    
    for (const [id, effect] of this.activeEffects) {
      effect.time += deltaTime;
      const t = effect.time / effect.duration;
      
      if (t >= 1) {
        toRemove.push(id);
        continue;
      }
      
      // 메시 애니메이션
      if (effect.mesh) {
        this.animateMesh(effect, t);
      }
    }
    
    // 완료된 이펙트 제거
    for (const id of toRemove) {
      const effect = this.activeEffects.get(id);
      if (effect?.mesh) {
        this.releaseMesh(effect.mesh);
      }
      this.activeEffects.delete(id);
    }
  }
  
  private animateMesh(effect: ImpactInstance, t: number): void {
    const mesh = effect.mesh!;
    
    if (effect.type === 'explosion') {
      if (effect.id.includes('shockwave')) {
        // 충격파: 확장하며 페이드아웃
        const scale = THREE.MathUtils.lerp(0.1, 3, t);
        mesh.scale.setScalar(scale);
        
        const material = mesh.material as THREE.MeshBasicMaterial;
        material.opacity = THREE.MathUtils.lerp(0.6, 0, t);
      } else {
        // 폭발: 빠르게 확장 후 수축
        let scale: number;
        if (t < 0.3) {
          scale = THREE.MathUtils.lerp(0.1, 1.5, t / 0.3);
        } else {
          scale = THREE.MathUtils.lerp(1.5, 0.1, (t - 0.3) / 0.7);
        }
        mesh.scale.setScalar(scale);
        
        const material = mesh.material as THREE.MeshBasicMaterial;
        material.opacity = THREE.MathUtils.lerp(0.8, 0, Math.pow(t, 0.5));
      }
    } else if (effect.type === 'magic') {
      // 마법 충돌: 펄스 후 페이드
      const pulse = Math.sin(t * Math.PI * 4) * 0.3 + 1;
      const baseScale = THREE.MathUtils.lerp(0.1, 0.8, Math.min(t * 3, 1));
      mesh.scale.setScalar(baseScale * pulse);
      
      const material = mesh.material as THREE.MeshBasicMaterial;
      material.opacity = THREE.MathUtils.lerp(0.7, 0, Math.pow(t, 2));
    }
  }
  
  // ========================================
  // 유틸리티
  // ========================================
  
  /**
   * 모든 이펙트 제거
   */
  clear(): void {
    for (const effect of this.activeEffects.values()) {
      if (effect.mesh) {
        this.releaseMesh(effect.mesh);
      }
    }
    this.activeEffects.clear();
  }
  
  /**
   * 리소스 정리
   */
  dispose(): void {
    this.clear();
    
    // 메시 풀 정리
    for (const mesh of this.explosionMeshPool) {
      this.scene.remove(mesh);
      (mesh.material as THREE.Material).dispose();
    }
    for (const mesh of this.shockwaveMeshPool) {
      this.scene.remove(mesh);
      (mesh.material as THREE.Material).dispose();
    }
    for (const mesh of this.magicMeshPool) {
      this.scene.remove(mesh);
      (mesh.material as THREE.Material).dispose();
    }
    
    // 공유 리소스 정리
    this.explosionGeometry.dispose();
    this.shockwaveGeometry.dispose();
    this.magicGeometry.dispose();
    this.explosionMaterial.dispose();
    this.shockwaveMaterial.dispose();
    this.magicMaterial.dispose();
    
    console.log('🧹 ImpactEffects disposed');
  }
}

export default ImpactEffects;





