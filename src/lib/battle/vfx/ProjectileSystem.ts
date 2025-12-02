/**
 * ProjectileSystem - 투사체 시스템
 * 
 * 지원 투사체 타입:
 * - arrow: 화살 (포물선)
 * - fire_arrow: 불화살 (포물선 + 트레일)
 * - bolt: 쇠뇌 볼트 (직선 + 빠름)
 * - stone: 투석 (높은 포물선)
 * - javelin: 투창 (중간 포물선)
 * - throwing_axe: 투척 도끼 (회전)
 * - oil_jar: 기름 단지 (높은 포물선 + 폭발)
 * - boulder: 투석기 바위 (매우 높은 포물선)
 * - fireball: 화염구 (직선 + 큰 트레일)
 * - lightning: 번개 (즉발)
 */

import * as THREE from 'three';
import { 
  PROJECTILE_DATABASE, 
  ProjectileType as ProjectileTypeEnum,
  ProjectileSpec 
} from '@/components/battle/units/db/VoxelUnitDefinitions';

// ========================================
// 타입 정의
// ========================================

/** 투사체 인스턴스 */
export interface Projectile {
  id: string;
  type: string;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  startPosition: THREE.Vector3;
  targetPosition: THREE.Vector3;
  
  // 물리
  gravity: number;
  speed: number;
  
  // 메시
  mesh: THREE.Object3D;
  trailMesh?: THREE.Line;
  
  // 트레일 데이터
  trailPositions?: THREE.Vector3[];
  trailMaxLength: number;
  
  // 상태
  life: number;
  maxLife: number;
  rotation: THREE.Euler;
  rotationSpeed: THREE.Vector3;
  
  // 콜백
  onHit?: (position: THREE.Vector3) => void;
  
  // 플래그
  active: boolean;
  completed: boolean;
}

/** 투사체 생성 옵션 */
export interface ProjectileSpawnOptions {
  speed?: number;
  gravity?: number;
  trailLength?: number;
  onHit?: (position: THREE.Vector3) => void;
}

// ========================================
// 상수
// ========================================

const PROJECTILE_GEOMETRIES: Record<string, THREE.BufferGeometry> = {};
const PROJECTILE_MATERIALS: Record<string, THREE.Material> = {};

// 투사체 타입별 메시 설정
const PROJECTILE_MESH_CONFIG: Record<string, {
  geometry: () => THREE.BufferGeometry;
  materialColor: number;
  scale: THREE.Vector3;
  rotates: boolean;
  hasTrail: boolean;
}> = {
  arrow: {
    geometry: () => new THREE.CylinderGeometry(0.015, 0.015, 0.8, 4),
    materialColor: 0x8B4513,
    scale: new THREE.Vector3(1, 1, 1),
    rotates: false,
    hasTrail: true,
  },
  fire_arrow: {
    geometry: () => new THREE.CylinderGeometry(0.015, 0.015, 0.8, 4),
    materialColor: 0x8B4513,
    scale: new THREE.Vector3(1, 1, 1),
    rotates: false,
    hasTrail: true,
  },
  bolt: {
    geometry: () => new THREE.CylinderGeometry(0.02, 0.02, 0.6, 4),
    materialColor: 0x4A4A4A,
    scale: new THREE.Vector3(1, 1, 1),
    rotates: false,
    hasTrail: true,
  },
  stone: {
    geometry: () => new THREE.SphereGeometry(0.08, 6, 6),
    materialColor: 0x696969,
    scale: new THREE.Vector3(1, 1, 1),
    rotates: false,
    hasTrail: false,
  },
  javelin: {
    geometry: () => new THREE.CylinderGeometry(0.012, 0.012, 1.2, 4),
    materialColor: 0x8B4513,
    scale: new THREE.Vector3(1, 1, 1),
    rotates: false,
    hasTrail: true,
  },
  throwing_axe: {
    geometry: () => createAxeGeometry(),
    materialColor: 0x4A4A4A,
    scale: new THREE.Vector3(0.3, 0.3, 0.08),
    rotates: true,
    hasTrail: true,
  },
  oil_jar: {
    geometry: () => new THREE.SphereGeometry(0.12, 8, 8),
    materialColor: 0x8B4513,
    scale: new THREE.Vector3(1, 1, 1.2),
    rotates: false,
    hasTrail: false,
  },
  boulder: {
    geometry: () => new THREE.IcosahedronGeometry(0.25, 0),
    materialColor: 0x696969,
    scale: new THREE.Vector3(1, 1, 1),
    rotates: true,
    hasTrail: false,
  },
  fire_boulder: {
    geometry: () => new THREE.IcosahedronGeometry(0.25, 0),
    materialColor: 0x8B0000,
    scale: new THREE.Vector3(1, 1, 1),
    rotates: true,
    hasTrail: true,
  },
  fireball: {
    geometry: () => new THREE.SphereGeometry(0.15, 8, 8),
    materialColor: 0xFF4500,
    scale: new THREE.Vector3(1, 1, 1),
    rotates: false,
    hasTrail: true,
  },
  lightning: {
    geometry: () => new THREE.CylinderGeometry(0.02, 0.02, 2, 4),
    materialColor: 0x00BFFF,
    scale: new THREE.Vector3(1, 1, 1),
    rotates: false,
    hasTrail: true,
  },
  poison_dart: {
    geometry: () => new THREE.CylinderGeometry(0.008, 0.008, 0.4, 4),
    materialColor: 0x228B22,
    scale: new THREE.Vector3(1, 1, 1),
    rotates: false,
    hasTrail: true,
  },
  curse: {
    geometry: () => new THREE.OctahedronGeometry(0.15),
    materialColor: 0x9932CC,
    scale: new THREE.Vector3(1, 1, 1),
    rotates: true,
    hasTrail: true,
  },
  heal_wave: {
    geometry: () => new THREE.SphereGeometry(0.2, 8, 8),
    materialColor: 0x00FF7F,
    scale: new THREE.Vector3(1, 1, 1),
    rotates: false,
    hasTrail: true,
  },
};

// 도끼 지오메트리 생성
function createAxeGeometry(): THREE.BufferGeometry {
  const shape = new THREE.Shape();
  shape.moveTo(0, -0.15);
  shape.lineTo(0.1, -0.15);
  shape.lineTo(0.15, 0);
  shape.lineTo(0.1, 0.15);
  shape.lineTo(0, 0.15);
  shape.lineTo(-0.1, 0.05);
  shape.lineTo(-0.1, -0.05);
  shape.closePath();
  
  const extrudeSettings = { depth: 0.05, bevelEnabled: false };
  return new THREE.ExtrudeGeometry(shape, extrudeSettings);
}

// ========================================
// ProjectileSystem 클래스
// ========================================

export class ProjectileSystem {
  private scene: THREE.Scene;
  
  // 오브젝트 풀
  private pool: Projectile[] = [];
  private activeProjectiles: Projectile[] = [];
  private completedProjectiles: Projectile[] = [];
  
  // 공유 리소스
  private geometries: Map<string, THREE.BufferGeometry> = new Map();
  private materials: Map<string, THREE.Material> = new Map();
  private trailMaterial: THREE.LineBasicMaterial;
  
  // 설정
  private maxProjectiles: number;
  private idCounter = 0;
  
  // 임시 벡터 (GC 최소화)
  private tempVec3 = new THREE.Vector3();
  private tempMatrix = new THREE.Matrix4();
  
  constructor(scene: THREE.Scene, maxProjectiles: number = 500) {
    this.scene = scene;
    this.maxProjectiles = maxProjectiles;
    
    // 공유 리소스 초기화
    this.initSharedResources();
    
    // 트레일 머티리얼
    this.trailMaterial = new THREE.LineBasicMaterial({
      color: 0xD2B48C,
      transparent: true,
      opacity: 0.6,
    });
    
    // 풀 초기화
    this.initPool();
  }
  
  private initSharedResources(): void {
    // 각 타입별 지오메트리와 머티리얼 생성
    for (const [type, config] of Object.entries(PROJECTILE_MESH_CONFIG)) {
      this.geometries.set(type, config.geometry());
      
      const material = new THREE.MeshStandardMaterial({
        color: config.materialColor,
        roughness: 0.7,
        metalness: type.includes('bolt') || type.includes('axe') ? 0.8 : 0.2,
      });
      
      // 화염/마법 이펙트용 Additive 블렌딩
      if (type.includes('fire') || type === 'lightning' || type === 'heal_wave') {
        material.emissive.setHex(config.materialColor);
        material.emissiveIntensity = 0.5;
      }
      
      this.materials.set(type, material);
    }
  }
  
  private initPool(): void {
    // 미리 풀 할당 (메모리 최적화)
    for (let i = 0; i < this.maxProjectiles; i++) {
      this.pool.push(this.createEmptyProjectile());
    }
  }
  
  private createEmptyProjectile(): Projectile {
    // 기본 화살 메시 생성 (나중에 타입에 따라 교체)
    const geometry = this.geometries.get('arrow')!;
    const material = this.materials.get('arrow')!;
    const mesh = new THREE.Mesh(geometry, material);
    mesh.visible = false;
    mesh.castShadow = true;
    mesh.rotation.x = Math.PI / 2; // 화살이 앞을 향하도록
    this.scene.add(mesh);
    
    return {
      id: '',
      type: 'arrow',
      position: new THREE.Vector3(),
      velocity: new THREE.Vector3(),
      startPosition: new THREE.Vector3(),
      targetPosition: new THREE.Vector3(),
      gravity: 0,
      speed: 0,
      mesh,
      trailMaxLength: 10,
      trailPositions: [],
      life: 0,
      maxLife: 0,
      rotation: new THREE.Euler(),
      rotationSpeed: new THREE.Vector3(),
      active: false,
      completed: false,
    };
  }
  
  // ========================================
  // 투사체 생성
  // ========================================
  
  /**
   * 투사체 생성
   */
  spawn(
    type: string,
    from: THREE.Vector3,
    to: THREE.Vector3,
    options?: ProjectileSpawnOptions
  ): Projectile | null {
    // 풀에서 비활성 투사체 획득
    const projectile = this.acquireProjectile();
    if (!projectile) return null;
    
    // DB에서 스펙 가져오기
    const spec = PROJECTILE_DATABASE[type as ProjectileTypeEnum];
    const meshConfig = PROJECTILE_MESH_CONFIG[type];
    
    if (!meshConfig) {
      console.warn(`Unknown projectile type: ${type}, defaulting to arrow`);
      return this.spawn('arrow', from, to, options);
    }
    
    // 기본값 설정
    const speed = options?.speed ?? spec?.speed ?? 15;
    const gravity = options?.gravity ?? spec?.gravity ?? 0.3;
    const trailLength = options?.trailLength ?? spec?.trail?.length ?? 5;
    
    // ID 할당
    projectile.id = `proj_${this.idCounter++}`;
    projectile.type = type;
    
    // 위치 설정
    projectile.position.copy(from);
    projectile.startPosition.copy(from);
    projectile.targetPosition.copy(to);
    
    // 속도 계산 (포물선 궤적)
    this.calculateVelocity(projectile, from, to, speed, gravity);
    
    // 물리 설정
    projectile.gravity = gravity * 10; // 유닛 스케일 보정
    projectile.speed = speed;
    
    // 메시 업데이트
    this.updateMesh(projectile, type, meshConfig);
    
    // 트레일 설정
    projectile.trailMaxLength = trailLength;
    projectile.trailPositions = [];
    if (meshConfig.hasTrail) {
      this.createTrail(projectile, spec?.trail?.color ?? '#D2B48C');
    }
    
    // 수명 계산
    const distance = from.distanceTo(to);
    projectile.maxLife = (distance / speed) * 1.5; // 여유분
    projectile.life = projectile.maxLife;
    
    // 회전 설정
    if (meshConfig.rotates) {
      projectile.rotationSpeed.set(
        Math.random() * 10 - 5,
        Math.random() * 10 - 5,
        Math.random() * 10 - 5
      );
    } else {
      projectile.rotationSpeed.set(0, 0, 0);
    }
    
    // 콜백
    projectile.onHit = options?.onHit;
    
    // 활성화
    projectile.active = true;
    projectile.completed = false;
    projectile.mesh.visible = true;
    
    this.activeProjectiles.push(projectile);
    
    return projectile;
  }
  
  /**
   * 투사체 일괄 생성 (볼리)
   */
  spawnVolley(
    type: string,
    positions: { from: THREE.Vector3; to: THREE.Vector3 }[],
    options?: ProjectileSpawnOptions & { stagger?: number }
  ): string[] {
    const ids: string[] = [];
    const stagger = options?.stagger ?? 0;
    
    positions.forEach((pos, index) => {
      // 시차 발사 (선택적)
      if (stagger > 0) {
        setTimeout(() => {
          const p = this.spawn(type, pos.from, pos.to, options);
          if (p) ids.push(p.id);
        }, index * stagger);
      } else {
        const p = this.spawn(type, pos.from, pos.to, options);
        if (p) ids.push(p.id);
      }
    });
    
    return ids;
  }
  
  // ========================================
  // 물리 계산
  // ========================================
  
  /**
   * 포물선 궤적 속도 계산
   */
  private calculateVelocity(
    projectile: Projectile,
    from: THREE.Vector3,
    to: THREE.Vector3,
    speed: number,
    gravityFactor: number
  ): void {
    const direction = to.clone().sub(from);
    const distance = direction.length();
    const horizontalDist = Math.sqrt(direction.x ** 2 + direction.z ** 2);
    
    // 비행 시간 계산
    const time = distance / speed;
    
    // 중력이 있으면 포물선 궤적
    if (gravityFactor > 0) {
      const gravity = gravityFactor * 10;
      
      // 수평 속도
      const vx = direction.x / time;
      const vz = direction.z / time;
      
      // 수직 속도 (포물선 공식: h = v0*t - 0.5*g*t^2)
      // 목표점에 도달하려면: v0 = (dy + 0.5*g*t^2) / t
      const vy = (direction.y + 0.5 * gravity * time * time) / time;
      
      projectile.velocity.set(vx, vy, vz);
    } else {
      // 직선 궤적
      projectile.velocity.copy(direction.normalize().multiplyScalar(speed));
    }
  }
  
  // ========================================
  // 메시 관리
  // ========================================
  
  private updateMesh(
    projectile: Projectile,
    type: string,
    config: typeof PROJECTILE_MESH_CONFIG[string]
  ): void {
    const mesh = projectile.mesh as THREE.Mesh;
    
    // 지오메트리 교체
    const geometry = this.geometries.get(type);
    if (geometry && mesh.geometry !== geometry) {
      mesh.geometry = geometry;
    }
    
    // 머티리얼 교체
    const material = this.materials.get(type);
    if (material && mesh.material !== material) {
      mesh.material = material;
    }
    
    // 스케일 적용
    mesh.scale.copy(config.scale);
    
    // 위치 설정
    mesh.position.copy(projectile.position);
    
    // 초기 회전 (진행 방향으로)
    this.updateMeshRotation(projectile);
  }
  
  private updateMeshRotation(projectile: Projectile): void {
    const mesh = projectile.mesh;
    
    // 속도 방향으로 회전
    if (projectile.velocity.lengthSq() > 0.01) {
      const dir = projectile.velocity.clone().normalize();
      
      // Y-up 기준 회전
      const quaternion = new THREE.Quaternion();
      quaternion.setFromUnitVectors(
        new THREE.Vector3(0, 1, 0), // 메시의 기본 방향 (Y축)
        dir
      );
      mesh.quaternion.copy(quaternion);
    }
    
    // 추가 회전 (도끼 등)
    const config = PROJECTILE_MESH_CONFIG[projectile.type];
    if (config?.rotates) {
      mesh.rotation.x += projectile.rotationSpeed.x * 0.016;
      mesh.rotation.y += projectile.rotationSpeed.y * 0.016;
      mesh.rotation.z += projectile.rotationSpeed.z * 0.016;
    }
  }
  
  private createTrail(projectile: Projectile, color: string): void {
    // 기존 트레일 제거
    if (projectile.trailMesh) {
      this.scene.remove(projectile.trailMesh);
      projectile.trailMesh.geometry.dispose();
    }
    
    // 새 트레일 생성
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(projectile.trailMaxLength * 3);
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setDrawRange(0, 0);
    
    const material = this.trailMaterial.clone();
    material.color.set(color);
    
    // 특수 투사체 트레일 색상
    if (projectile.type.includes('fire')) {
      material.color.set(0xFF4500);
    } else if (projectile.type === 'lightning') {
      material.color.set(0x00BFFF);
    } else if (projectile.type === 'poison_dart') {
      material.color.set(0x9932CC);
    }
    
    projectile.trailMesh = new THREE.Line(geometry, material);
    this.scene.add(projectile.trailMesh);
  }
  
  private updateTrail(projectile: Projectile): void {
    if (!projectile.trailMesh || !projectile.trailPositions) return;
    
    // 현재 위치 추가
    projectile.trailPositions.unshift(projectile.position.clone());
    
    // 최대 길이 유지
    if (projectile.trailPositions.length > projectile.trailMaxLength) {
      projectile.trailPositions.pop();
    }
    
    // 지오메트리 업데이트
    const geometry = projectile.trailMesh.geometry;
    const positions = geometry.attributes.position as THREE.BufferAttribute;
    
    for (let i = 0; i < projectile.trailPositions.length; i++) {
      const pos = projectile.trailPositions[i];
      positions.setXYZ(i, pos.x, pos.y, pos.z);
    }
    
    positions.needsUpdate = true;
    geometry.setDrawRange(0, projectile.trailPositions.length);
  }
  
  // ========================================
  // 풀 관리
  // ========================================
  
  private acquireProjectile(): Projectile | null {
    // 풀에서 비활성 투사체 찾기
    for (const projectile of this.pool) {
      if (!projectile.active) {
        return projectile;
      }
    }
    
    // 풀 확장 (최대치 미만일 때)
    if (this.pool.length < this.maxProjectiles) {
      const newProjectile = this.createEmptyProjectile();
      this.pool.push(newProjectile);
      return newProjectile;
    }
    
    // 가장 오래된 투사체 재활용
    if (this.activeProjectiles.length > 0) {
      const oldest = this.activeProjectiles.shift()!;
      this.releaseProjectile(oldest);
      return oldest;
    }
    
    return null;
  }
  
  private releaseProjectile(projectile: Projectile): void {
    projectile.active = false;
    projectile.completed = false;
    projectile.mesh.visible = false;
    
    if (projectile.trailMesh) {
      projectile.trailMesh.visible = false;
      projectile.trailPositions = [];
    }
  }
  
  // ========================================
  // 업데이트
  // ========================================
  
  /**
   * 프레임 업데이트
   */
  update(
    deltaTime: number,
    cameraPosition: THREE.Vector3,
    config: { cullDistance: number; enableFrustumCulling: boolean }
  ): void {
    this.completedProjectiles = [];
    
    // 역순으로 순회 (안전한 제거)
    for (let i = this.activeProjectiles.length - 1; i >= 0; i--) {
      const projectile = this.activeProjectiles[i];
      
      // 물리 업데이트
      this.updatePhysics(projectile, deltaTime);
      
      // 메시 업데이트
      projectile.mesh.position.copy(projectile.position);
      this.updateMeshRotation(projectile);
      
      // 트레일 업데이트
      this.updateTrail(projectile);
      
      // 수명 감소
      projectile.life -= deltaTime;
      
      // 완료 체크
      if (this.isProjectileComplete(projectile)) {
        this.completedProjectiles.push(projectile);
        this.activeProjectiles.splice(i, 1);
        this.releaseProjectile(projectile);
        continue;
      }
      
      // LOD/컬링
      if (config.enableFrustumCulling) {
        const distance = projectile.position.distanceTo(cameraPosition);
        projectile.mesh.visible = distance < config.cullDistance;
        if (projectile.trailMesh) {
          projectile.trailMesh.visible = projectile.mesh.visible;
        }
      }
    }
  }
  
  private updatePhysics(projectile: Projectile, deltaTime: number): void {
    // 중력 적용
    projectile.velocity.y -= projectile.gravity * deltaTime;
    
    // 위치 업데이트
    this.tempVec3.copy(projectile.velocity).multiplyScalar(deltaTime);
    projectile.position.add(this.tempVec3);
  }
  
  private isProjectileComplete(projectile: Projectile): boolean {
    // 수명 만료
    if (projectile.life <= 0) {
      return true;
    }
    
    // 목표점 근처 도달
    const distToTarget = projectile.position.distanceTo(projectile.targetPosition);
    if (distToTarget < 0.5) {
      return true;
    }
    
    // 지면 충돌
    if (projectile.position.y < 0) {
      projectile.position.y = 0;
      return true;
    }
    
    // 너무 멀리 벗어남
    const distFromStart = projectile.position.distanceTo(projectile.startPosition);
    const expectedDist = projectile.startPosition.distanceTo(projectile.targetPosition);
    if (distFromStart > expectedDist * 2) {
      return true;
    }
    
    return false;
  }
  
  // ========================================
  // 유틸리티
  // ========================================
  
  /**
   * 완료된 투사체 목록 (충돌 처리용)
   */
  getCompleted(): Projectile[] {
    return this.completedProjectiles;
  }
  
  /**
   * 활성 투사체 수
   */
  getActiveCount(): number {
    return this.activeProjectiles.length;
  }
  
  /**
   * 모든 투사체 제거
   */
  clear(): void {
    for (const projectile of this.activeProjectiles) {
      this.releaseProjectile(projectile);
    }
    this.activeProjectiles = [];
    this.completedProjectiles = [];
  }
  
  /**
   * 리소스 정리
   */
  dispose(): void {
    this.clear();
    
    // 풀 메시 제거
    for (const projectile of this.pool) {
      this.scene.remove(projectile.mesh);
      if (projectile.trailMesh) {
        this.scene.remove(projectile.trailMesh);
        projectile.trailMesh.geometry.dispose();
      }
    }
    this.pool = [];
    
    // 공유 리소스 정리
    for (const geometry of this.geometries.values()) {
      geometry.dispose();
    }
    this.geometries.clear();
    
    for (const material of this.materials.values()) {
      material.dispose();
    }
    this.materials.clear();
    
    this.trailMaterial.dispose();
    
    console.log('🧹 ProjectileSystem disposed');
  }
}

export default ProjectileSystem;





