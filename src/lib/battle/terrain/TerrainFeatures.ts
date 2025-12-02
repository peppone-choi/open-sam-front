/**
 * TerrainFeatures.ts
 * 지형 요소 생성 및 배치 시스템
 * 
 * 주요 기능:
 * 1. 나무, 바위, 풀 등 자연물 생성
 * 2. 건물, 성벽 등 인공물 생성
 * 3. 인스턴스드 메시 최적화
 * 4. 랜덤 배치 알고리즘
 */

import * as THREE from 'three';
import type { HeightMap } from './HeightMap';

// ========================================
// 타입 정의
// ========================================

/** 지형 요소 타입 */
export type FeatureType = 
  | 'tree'      // 나무
  | 'rock'      // 바위
  | 'grass'     // 풀/덤불
  | 'building'  // 건물
  | 'wall';     // 성벽

/** 지형 요소 설정 */
export interface TerrainFeatureConfig {
  /** 요소 타입 */
  type: FeatureType;
  /** 밀도 (0~1) */
  density?: number;
  /** 최소 스케일 */
  minScale?: number;
  /** 최대 스케일 */
  maxScale?: number;
  /** 배치 영역 (없으면 전체) */
  area?: {
    x: number;
    z: number;
    width: number;
    depth: number;
  };
  /** 최소 높이 (이보다 낮은 곳에 배치 안함) */
  minHeight?: number;
  /** 최대 높이 (이보다 높은 곳에 배치 안함) */
  maxHeight?: number;
  /** 최대 경사 (이보다 급한 곳에 배치 안함) */
  maxSlope?: number;
  /** 커스텀 색상 */
  color?: number;
}

/** 장애물 데이터 */
export interface Obstacle {
  /** 고유 ID */
  id: string;
  /** 요소 타입 */
  type: FeatureType;
  /** 위치 */
  position: THREE.Vector3;
  /** 바운딩 박스 */
  bounds: THREE.Box3;
  /** 통과 불가 여부 */
  blocking: boolean;
  /** 엄폐 가능 여부 */
  cover: boolean;
  /** 파괴 가능 여부 */
  destructible: boolean;
  /** 시야 차단 여부 */
  blocksLineOfSight: boolean;
}

/** 지형 요소 그룹 */
interface FeatureGroup {
  type: FeatureType;
  group: THREE.Group;
  instancedMesh?: THREE.InstancedMesh;
  obstacles: Obstacle[];
}

// ========================================
// 지오메트리 팩토리
// ========================================

/** 나무 지오메트리 생성 */
function createTreeGeometry(): THREE.Group {
  const tree = new THREE.Group();
  
  // 기둥
  const trunkGeometry = new THREE.CylinderGeometry(0.15, 0.25, 2, 8);
  const trunkMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x8b4513,
    roughness: 0.9,
  });
  const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
  trunk.position.y = 1;
  trunk.castShadow = true;
  trunk.receiveShadow = true;
  tree.add(trunk);
  
  // 잎사귀 (원뿔형)
  const foliageGeometry = new THREE.ConeGeometry(1.2, 2.5, 8);
  const foliageMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x228b22,
    roughness: 0.8,
  });
  const foliage = new THREE.Mesh(foliageGeometry, foliageMaterial);
  foliage.position.y = 3;
  foliage.castShadow = true;
  foliage.receiveShadow = true;
  tree.add(foliage);
  
  // 추가 잎사귀 레이어
  const foliage2Geometry = new THREE.ConeGeometry(0.9, 2, 8);
  const foliage2 = new THREE.Mesh(foliage2Geometry, foliageMaterial);
  foliage2.position.y = 4.2;
  foliage2.castShadow = true;
  tree.add(foliage2);
  
  return tree;
}

/** 바위 지오메트리 생성 */
function createRockGeometry(variant: number = 0): THREE.Mesh {
  let geometry: THREE.BufferGeometry;
  
  switch (variant % 3) {
    case 0:
      geometry = new THREE.DodecahedronGeometry(0.5, 0);
      break;
    case 1:
      geometry = new THREE.IcosahedronGeometry(0.5, 0);
      break;
    default:
      geometry = new THREE.OctahedronGeometry(0.5, 0);
      break;
  }
  
  // 정점 변형으로 불규칙한 모양 생성
  const positions = geometry.attributes.position;
  for (let i = 0; i < positions.count; i++) {
    const x = positions.getX(i);
    const y = positions.getY(i);
    const z = positions.getZ(i);
    
    // 랜덤 오프셋
    const noise = (Math.sin(x * 10 + y * 7 + z * 5 + variant) * 0.5 + 0.5) * 0.2;
    positions.setXYZ(i, x * (1 + noise), y * (1 + noise * 0.5), z * (1 + noise));
  }
  
  geometry.computeVertexNormals();
  
  const material = new THREE.MeshStandardMaterial({
    color: 0x808080,
    roughness: 0.95,
    metalness: 0.05,
  });
  
  const rock = new THREE.Mesh(geometry, material);
  rock.castShadow = true;
  rock.receiveShadow = true;
  
  return rock;
}

/** 풀/덤불 지오메트리 생성 */
function createGrassGeometry(): THREE.Group {
  const grass = new THREE.Group();
  
  // 여러 개의 빌보드 풀잎
  const bladeGeometry = new THREE.PlaneGeometry(0.3, 0.6);
  const bladeMaterial = new THREE.MeshStandardMaterial({
    color: 0x3cb371,
    side: THREE.DoubleSide,
    alphaTest: 0.5,
    roughness: 0.8,
  });
  
  for (let i = 0; i < 5; i++) {
    const blade = new THREE.Mesh(bladeGeometry, bladeMaterial);
    blade.position.set(
      (Math.random() - 0.5) * 0.4,
      0.3,
      (Math.random() - 0.5) * 0.4
    );
    blade.rotation.y = Math.random() * Math.PI;
    blade.rotation.x = (Math.random() - 0.5) * 0.3;
    blade.castShadow = false;
    blade.receiveShadow = true;
    grass.add(blade);
  }
  
  return grass;
}

/** 건물 지오메트리 생성 */
function createBuildingGeometry(variant: number = 0): THREE.Group {
  const building = new THREE.Group();
  
  // 건물 크기 변형
  const width = 3 + (variant % 3);
  const depth = 3 + ((variant + 1) % 3);
  const height = 3 + (variant % 4);
  
  // 본체
  const bodyGeometry = new THREE.BoxGeometry(width, height, depth);
  const bodyMaterial = new THREE.MeshStandardMaterial({
    color: 0xd2b48c,
    roughness: 0.85,
  });
  const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
  body.position.y = height / 2;
  body.castShadow = true;
  body.receiveShadow = true;
  building.add(body);
  
  // 지붕
  const roofGeometry = new THREE.ConeGeometry(
    Math.max(width, depth) * 0.7,
    2,
    4
  );
  const roofMaterial = new THREE.MeshStandardMaterial({
    color: 0x8b4513,
    roughness: 0.8,
  });
  const roof = new THREE.Mesh(roofGeometry, roofMaterial);
  roof.position.y = height + 1;
  roof.rotation.y = Math.PI / 4;
  roof.castShadow = true;
  building.add(roof);
  
  return building;
}

/** 성벽 지오메트리 생성 */
function createWallGeometry(): THREE.Group {
  const wall = new THREE.Group();
  
  // 벽 본체
  const wallGeometry = new THREE.BoxGeometry(1, 4, 6);
  const wallMaterial = new THREE.MeshStandardMaterial({
    color: 0x696969,
    roughness: 0.95,
  });
  const wallMesh = new THREE.Mesh(wallGeometry, wallMaterial);
  wallMesh.position.y = 2;
  wallMesh.castShadow = true;
  wallMesh.receiveShadow = true;
  wall.add(wallMesh);
  
  // 흉벽 (톱니 모양)
  const crenelGeometry = new THREE.BoxGeometry(1, 1, 1);
  for (let i = 0; i < 3; i++) {
    const crenel = new THREE.Mesh(crenelGeometry, wallMaterial);
    crenel.position.set(0, 4.5, -2 + i * 2);
    crenel.castShadow = true;
    wall.add(crenel);
  }
  
  return wall;
}

// ========================================
// 메인 클래스
// ========================================

export class TerrainFeatures {
  private parentGroup: THREE.Group;
  private featureGroups: Map<FeatureType, FeatureGroup> = new Map();
  private allObstacles: Map<string, Obstacle> = new Map();
  
  // 설정
  private seed: number = Date.now();
  
  // 지오메트리 캐시
  private geometryCache: Map<string, THREE.BufferGeometry> = new Map();
  private materialCache: Map<string, THREE.Material> = new Map();
  
  constructor(parentGroup: THREE.Group) {
    this.parentGroup = parentGroup;
  }
  
  // ========================================
  // 요소 생성
  // ========================================
  
  /**
   * 모든 지형 요소 생성
   */
  generateFeatures(configs: TerrainFeatureConfig[], heightMap: HeightMap): void {
    console.log(`🌳 지형 요소 생성 시작: ${configs.length}개 타입`);
    
    for (const config of configs) {
      this.generateFeatureType(config, heightMap);
    }
    
    console.log(`✅ 지형 요소 생성 완료: 총 ${this.allObstacles.size}개`);
  }
  
  /**
   * 특정 타입 요소 생성
   */
  private generateFeatureType(config: TerrainFeatureConfig, heightMap: HeightMap): void {
    const {
      type,
      density = 0.1,
      minScale = 0.8,
      maxScale = 1.2,
      area,
      minHeight = -Infinity,
      maxHeight = Infinity,
      maxSlope = 0.5,
    } = config;
    
    // 그룹 생성
    const group = new THREE.Group();
    group.name = `features-${type}`;
    
    // 배치 영역 설정
    const heightConfig = heightMap.getConfig();
    const areaX = area?.x ?? -heightConfig.width / 2;
    const areaZ = area?.z ?? -heightConfig.depth / 2;
    const areaWidth = area?.width ?? heightConfig.width;
    const areaDepth = area?.depth ?? heightConfig.depth;
    
    // 배치 그리드 계산
    const gridSize = this.getGridSizeForType(type);
    const cellsX = Math.floor(areaWidth / gridSize);
    const cellsZ = Math.floor(areaDepth / gridSize);
    
    const obstacles: Obstacle[] = [];
    let featureId = 0;
    
    // 시드 기반 랜덤
    const random = this.createSeededRandom(this.seed + type.charCodeAt(0));
    
    for (let cz = 0; cz < cellsZ; cz++) {
      for (let cx = 0; cx < cellsX; cx++) {
        // 밀도 체크
        if (random() > density) continue;
        
        // 위치 계산 (셀 내 랜덤)
        const worldX = areaX + (cx + random()) * gridSize;
        const worldZ = areaZ + (cz + random()) * gridSize;
        
        // 높이맵에서 위치 데이터 조회
        const height = heightMap.getHeightAt(
          worldX + heightConfig.width / 2,
          worldZ + heightConfig.depth / 2
        );
        const slope = heightMap.getSlopeAt(
          worldX + heightConfig.width / 2,
          worldZ + heightConfig.depth / 2
        );
        
        // 배치 조건 체크
        if (height < minHeight || height > maxHeight) continue;
        if (slope > maxSlope) continue;
        
        // 요소 생성
        const mesh = this.createFeatureMesh(type, featureId);
        
        // 스케일 및 회전
        const scale = minScale + random() * (maxScale - minScale);
        mesh.scale.setScalar(scale);
        mesh.rotation.y = random() * Math.PI * 2;
        
        // 위치 설정
        mesh.position.set(worldX, height, worldZ);
        
        // 색상 변형
        if (config.color !== undefined) {
          this.applyColor(mesh, config.color);
        }
        
        group.add(mesh);
        
        // 장애물 데이터 생성
        const obstacle = this.createObstacle(
          `${type}_${featureId}`,
          type,
          mesh,
          scale
        );
        obstacles.push(obstacle);
        this.allObstacles.set(obstacle.id, obstacle);
        
        featureId++;
      }
    }
    
    this.parentGroup.add(group);
    
    // 그룹 저장
    this.featureGroups.set(type, {
      type,
      group,
      obstacles,
    });
    
    console.log(`  📍 ${type}: ${featureId}개 배치`);
  }
  
  /**
   * 요소 메시 생성
   */
  private createFeatureMesh(type: FeatureType, variant: number): THREE.Object3D {
    switch (type) {
      case 'tree':
        return createTreeGeometry();
      case 'rock':
        return createRockGeometry(variant);
      case 'grass':
        return createGrassGeometry();
      case 'building':
        return createBuildingGeometry(variant);
      case 'wall':
        return createWallGeometry();
      default:
        return new THREE.Group();
    }
  }
  
  /**
   * 타입별 그리드 크기
   */
  private getGridSizeForType(type: FeatureType): number {
    switch (type) {
      case 'tree': return 5;
      case 'rock': return 8;
      case 'grass': return 2;
      case 'building': return 15;
      case 'wall': return 8;
      default: return 5;
    }
  }
  
  /**
   * 장애물 데이터 생성
   */
  private createObstacle(
    id: string,
    type: FeatureType,
    mesh: THREE.Object3D,
    scale: number
  ): Obstacle {
    // 바운딩 박스 계산
    const bounds = new THREE.Box3().setFromObject(mesh);
    
    // 타입별 속성 설정
    const getProperties = () => {
      switch (type) {
        case 'tree':
          return {
            blocking: true,
            cover: true,
            destructible: true,
            blocksLineOfSight: true,
          };
        case 'rock':
          return {
            blocking: true,
            cover: true,
            destructible: false,
            blocksLineOfSight: scale > 1.5,
          };
        case 'grass':
          return {
            blocking: false,
            cover: false,
            destructible: true,
            blocksLineOfSight: false,
          };
        case 'building':
          return {
            blocking: true,
            cover: true,
            destructible: true,
            blocksLineOfSight: true,
          };
        case 'wall':
          return {
            blocking: true,
            cover: true,
            destructible: false,
            blocksLineOfSight: true,
          };
        default:
          return {
            blocking: false,
            cover: false,
            destructible: false,
            blocksLineOfSight: false,
          };
      }
    };
    
    const props = getProperties();
    
    return {
      id,
      type,
      position: mesh.position.clone(),
      bounds,
      ...props,
    };
  }
  
  /**
   * 색상 적용
   */
  private applyColor(mesh: THREE.Object3D, color: number): void {
    mesh.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const meshChild = child as THREE.Mesh;
        const material = meshChild.material as THREE.MeshStandardMaterial;
        if (material.color) {
          material.color.setHex(color);
        }
      }
    });
  }
  
  // ========================================
  // 충돌 검사
  // ========================================
  
  /**
   * 위치에서 충돌 검사
   */
  checkCollision(position: THREE.Vector3, radius: number): Obstacle | null {
    const sphere = new THREE.Sphere(position, radius);
    
    for (const obstacle of this.allObstacles.values()) {
      if (!obstacle.blocking) continue;
      
      if (sphere.intersectsBox(obstacle.bounds)) {
        return obstacle;
      }
    }
    
    return null;
  }
  
  /**
   * 선분과의 충돌 검사 (시야 체크용)
   */
  raycastObstacles(
    origin: THREE.Vector3,
    direction: THREE.Vector3,
    maxDistance: number
  ): Obstacle | null {
    const ray = new THREE.Ray(origin, direction.normalize());
    
    let closest: Obstacle | null = null;
    let closestDistance = maxDistance;
    
    for (const obstacle of this.allObstacles.values()) {
      if (!obstacle.blocksLineOfSight) continue;
      
      const intersection = ray.intersectBox(obstacle.bounds, new THREE.Vector3());
      if (intersection) {
        const distance = origin.distanceTo(intersection);
        if (distance < closestDistance) {
          closestDistance = distance;
          closest = obstacle;
        }
      }
    }
    
    return closest;
  }
  
  /**
   * 영역 내 장애물 조회
   */
  getObstaclesInArea(bounds: THREE.Box3): Obstacle[] {
    const result: Obstacle[] = [];
    
    for (const obstacle of this.allObstacles.values()) {
      if (bounds.intersectsBox(obstacle.bounds)) {
        result.push(obstacle);
      }
    }
    
    return result;
  }
  
  /**
   * 가장 가까운 엄폐물 찾기
   */
  findNearestCover(position: THREE.Vector3, maxDistance: number = 20): Obstacle | null {
    let nearest: Obstacle | null = null;
    let nearestDistance = maxDistance;
    
    for (const obstacle of this.allObstacles.values()) {
      if (!obstacle.cover) continue;
      
      const distance = position.distanceTo(obstacle.position);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearest = obstacle;
      }
    }
    
    return nearest;
  }
  
  // ========================================
  // 동적 수정
  // ========================================
  
  /**
   * 장애물 추가
   */
  addObstacle(config: {
    type: FeatureType;
    position: THREE.Vector3;
    scale?: number;
    rotation?: number;
  }): Obstacle {
    const { type, position, scale = 1, rotation = 0 } = config;
    
    const id = `${type}_dynamic_${Date.now()}`;
    const mesh = this.createFeatureMesh(type, 0);
    
    mesh.position.copy(position);
    mesh.scale.setScalar(scale);
    mesh.rotation.y = rotation;
    
    // 그룹에 추가
    const featureGroup = this.featureGroups.get(type);
    if (featureGroup) {
      featureGroup.group.add(mesh);
    } else {
      const group = new THREE.Group();
      group.add(mesh);
      this.parentGroup.add(group);
      this.featureGroups.set(type, {
        type,
        group,
        obstacles: [],
      });
    }
    
    const obstacle = this.createObstacle(id, type, mesh, scale);
    this.allObstacles.set(id, obstacle);
    
    return obstacle;
  }
  
  /**
   * 장애물 제거
   */
  removeObstacle(id: string): boolean {
    const obstacle = this.allObstacles.get(id);
    if (!obstacle) return false;
    
    // 그룹에서 메시 제거
    const featureGroup = this.featureGroups.get(obstacle.type);
    if (featureGroup) {
      const mesh = featureGroup.group.children.find(
        (child) => child.position.equals(obstacle.position)
      );
      if (mesh) {
        featureGroup.group.remove(mesh);
      }
    }
    
    this.allObstacles.delete(id);
    return true;
  }
  
  /**
   * 파괴 가능한 장애물 파괴
   */
  destroyObstacle(id: string): boolean {
    const obstacle = this.allObstacles.get(id);
    if (!obstacle || !obstacle.destructible) return false;
    
    return this.removeObstacle(id);
  }
  
  // ========================================
  // 쿼리 API
  // ========================================
  
  /**
   * 모든 장애물 조회
   */
  getAllObstacles(): Obstacle[] {
    return Array.from(this.allObstacles.values());
  }
  
  /**
   * 차단 장애물만 조회
   */
  getBlockingObstacles(): Obstacle[] {
    return this.getAllObstacles().filter(o => o.blocking);
  }
  
  /**
   * 엄폐 가능 장애물만 조회
   */
  getCoverObstacles(): Obstacle[] {
    return this.getAllObstacles().filter(o => o.cover);
  }
  
  /**
   * 타입별 장애물 조회
   */
  getObstaclesByType(type: FeatureType): Obstacle[] {
    return this.getAllObstacles().filter(o => o.type === type);
  }
  
  /**
   * ID로 장애물 조회
   */
  getObstacleById(id: string): Obstacle | undefined {
    return this.allObstacles.get(id);
  }
  
  // ========================================
  // 유틸리티
  // ========================================
  
  /**
   * 시드 기반 랜덤 생성기
   */
  private createSeededRandom(seed: number): () => number {
    let s = seed;
    return () => {
      s = (s * 1103515245 + 12345) & 0x7fffffff;
      return s / 0x7fffffff;
    };
  }
  
  /**
   * 시드 설정
   */
  setSeed(seed: number): void {
    this.seed = seed;
  }
  
  /**
   * 업데이트 (애니메이션용)
   */
  update(deltaTime: number): void {
    // 풀 애니메이션 (바람 효과)
    const grassGroup = this.featureGroups.get('grass');
    if (grassGroup) {
      const time = Date.now() * 0.001;
      grassGroup.group.children.forEach((grass, index) => {
        grass.rotation.z = Math.sin(time + index * 0.5) * 0.1;
      });
    }
  }
  
  /**
   * 가시성 업데이트 (LOD)
   */
  updateVisibility(cameraPosition: THREE.Vector3, maxDistance: number = 200): void {
    const maxDistSq = maxDistance * maxDistance;
    
    this.featureGroups.forEach((fg) => {
      fg.group.children.forEach((child) => {
        const distSq = child.position.distanceToSquared(cameraPosition);
        child.visible = distSq < maxDistSq;
        
        // LOD: 먼 거리에서는 단순화된 렌더링
        if (distSq > maxDistSq * 0.5) {
          child.traverse((obj) => {
            if ((obj as THREE.Mesh).isMesh) {
              (obj as THREE.Mesh).castShadow = false;
            }
          });
        }
      });
    });
  }
  
  /**
   * 리소스 해제
   */
  dispose(): void {
    // 그룹 정리
    this.featureGroups.forEach((fg) => {
      fg.group.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;
          mesh.geometry.dispose();
          if (Array.isArray(mesh.material)) {
            mesh.material.forEach(m => m.dispose());
          } else {
            (mesh.material as THREE.Material).dispose();
          }
        }
      });
      this.parentGroup.remove(fg.group);
    });
    
    this.featureGroups.clear();
    this.allObstacles.clear();
    
    // 캐시 정리
    this.geometryCache.forEach(g => g.dispose());
    this.geometryCache.clear();
    this.materialCache.forEach(m => m.dispose());
    this.materialCache.clear();
  }
}

// ========================================
// 팩토리 함수
// ========================================

/**
 * 지형 요소 시스템 생성
 */
export function createTerrainFeatures(parentGroup: THREE.Group): TerrainFeatures {
  return new TerrainFeatures(parentGroup);
}





