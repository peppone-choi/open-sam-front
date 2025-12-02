/**
 * TerrainGenerator.ts
 * 복셀 전투용 3D 지형 메시 생성기
 * 
 * 주요 기능:
 * 1. 지형 타입별 메시 생성 (평원, 숲, 산악, 강 등)
 * 2. 높이맵 기반 지형 생성
 * 3. 텍스처 및 머티리얼 적용
 * 4. 청크 기반 최적화
 */

import * as THREE from 'three';
import { HeightMap, type HeightMapConfig } from './HeightMap';
import { TerrainFeatures, type TerrainFeatureConfig } from './TerrainFeatures';
import { WaterRenderer, type WaterConfig } from './WaterRenderer';

// ========================================
// 타입 정의
// ========================================

/** 지형 타입 */
export type TerrainType = 
  | 'plains'      // 평원
  | 'forest'      // 숲
  | 'mountain'    // 산악
  | 'river'       // 강
  | 'city'        // 도시
  | 'desert'      // 사막
  | 'snow'        // 설원
  | 'swamp';      // 늪지

/** 지형 설정 */
export interface TerrainConfig {
  /** 지형 타입 */
  type: TerrainType;
  /** 지형 너비 (월드 단위) */
  width: number;
  /** 지형 깊이 (월드 단위) */
  depth: number;
  /** 높이맵 (선택적) */
  heightMap?: number[][];
  /** 지형 요소 */
  features: TerrainFeatureConfig[];
  /** 텍스처 설정 */
  textures?: TerrainTextureConfig;
  /** 청크 크기 (최적화용) */
  chunkSize?: number;
  /** 해상도 (세그먼트 수) */
  resolution?: number;
  /** 랜덤 시드 */
  seed?: number;
}

/** 텍스처 설정 */
export interface TerrainTextureConfig {
  /** 기본 텍스처 경로 */
  base?: string;
  /** 노멀 맵 경로 */
  normal?: string;
  /** 러프니스 맵 경로 */
  roughness?: string;
  /** 텍스처 스케일 */
  scale?: number;
}

/** 지형별 이동 속도 보정 */
export const TERRAIN_SPEED_MODIFIER: Record<TerrainType, number> = {
  plains: 1.0,
  forest: 0.7,
  mountain: 0.5,
  river: 0.3,
  city: 0.9,
  desert: 0.8,
  snow: 0.6,
  swamp: 0.4,
};

/** 지형별 방어 보정 */
export const TERRAIN_DEFENSE_MODIFIER: Record<TerrainType, number> = {
  plains: 1.0,
  forest: 1.3,
  mountain: 1.5,
  river: 0.8,
  city: 1.4,
  desert: 0.9,
  snow: 1.0,
  swamp: 0.7,
};

/** 지형별 기본 색상 */
export const TERRAIN_COLORS: Record<TerrainType, number> = {
  plains: 0x4a7c3f,    // 초록색
  forest: 0x2d5a27,    // 진한 초록
  mountain: 0x6b6b6b,  // 회색
  river: 0x4169e1,     // 파란색
  city: 0xa0522d,      // 갈색
  desert: 0xd4a574,    // 모래색
  snow: 0xf0f0f0,      // 흰색
  swamp: 0x556b2f,     // 올리브
};

/** 지형별 높이 스케일 */
export const TERRAIN_HEIGHT_SCALE: Record<TerrainType, number> = {
  plains: 0.5,
  forest: 1.0,
  mountain: 5.0,
  river: -0.5,
  city: 0.2,
  desert: 0.3,
  snow: 2.0,
  swamp: -0.3,
};

// ========================================
// 청크 시스템
// ========================================

/** 지형 청크 */
export interface TerrainChunk {
  /** 청크 ID */
  id: string;
  /** X 인덱스 */
  chunkX: number;
  /** Z 인덱스 */
  chunkZ: number;
  /** 메시 */
  mesh: THREE.Mesh;
  /** 바운딩 박스 */
  bounds: THREE.Box3;
  /** LOD 레벨 */
  lodLevel: number;
  /** 가시성 */
  visible: boolean;
}

// ========================================
// 메인 클래스
// ========================================

export class TerrainGenerator {
  private config: Required<TerrainConfig>;
  private scene: THREE.Scene;
  
  // 컴포넌트
  private heightMap: HeightMap;
  private features: TerrainFeatures;
  private waterRenderer: WaterRenderer;
  
  // 렌더링 오브젝트
  private terrainGroup: THREE.Group;
  private chunks: Map<string, TerrainChunk> = new Map();
  private terrainMesh: THREE.Mesh | null = null;
  
  // 텍스처 캐시
  private textureLoader: THREE.TextureLoader;
  private textures: Map<string, THREE.Texture> = new Map();
  
  // 머티리얼 캐시
  private materials: Map<TerrainType, THREE.Material> = new Map();
  
  constructor(scene: THREE.Scene, config: TerrainConfig) {
    this.scene = scene;
    
    // 기본값 설정
    this.config = {
      type: config.type,
      width: config.width,
      depth: config.depth,
      heightMap: config.heightMap || [],
      features: config.features || [],
      textures: config.textures || {},
      chunkSize: config.chunkSize ?? 50,
      resolution: config.resolution ?? 64,
      seed: config.seed ?? Date.now(),
    };
    
    // 텍스처 로더
    this.textureLoader = new THREE.TextureLoader();
    
    // 지형 그룹 생성
    this.terrainGroup = new THREE.Group();
    this.terrainGroup.name = 'terrain-generator';
    this.scene.add(this.terrainGroup);
    
    // 컴포넌트 초기화
    this.heightMap = new HeightMap({
      width: this.config.width,
      depth: this.config.depth,
      resolution: this.config.resolution,
      seed: this.config.seed,
      heightScale: TERRAIN_HEIGHT_SCALE[this.config.type],
    });
    
    this.features = new TerrainFeatures(this.terrainGroup);
    this.waterRenderer = new WaterRenderer(this.terrainGroup);
  }
  
  // ========================================
  // 지형 생성
  // ========================================
  
  /**
   * 전체 지형 생성
   */
  async generate(): Promise<THREE.Group> {
    console.log(`🏔️ 지형 생성 시작: ${this.config.type} (${this.config.width}x${this.config.depth})`);
    
    // 1. 높이맵 생성 또는 로드
    if (this.config.heightMap.length > 0) {
      this.heightMap.loadFromArray(this.config.heightMap);
    } else {
      this.heightMap.generateProcedural(this.config.type);
    }
    
    // 2. 지형 메시 생성
    await this.createTerrainMesh();
    
    // 3. 물/강 렌더링 (river, swamp 타입)
    if (this.config.type === 'river' || this.config.type === 'swamp') {
      this.createWater();
    }
    
    // 4. 지형 요소 배치
    this.features.generateFeatures(this.config.features, this.heightMap);
    
    console.log('✅ 지형 생성 완료');
    return this.terrainGroup;
  }
  
  /**
   * 지형 메시 생성
   */
  private async createTerrainMesh(): Promise<void> {
    const { width, depth, resolution, type } = this.config;
    
    // 지오메트리 생성
    const geometry = new THREE.PlaneGeometry(
      width,
      depth,
      resolution - 1,
      resolution - 1
    );
    
    // 정점 높이 적용
    const positions = geometry.attributes.position;
    const vertexColors = new Float32Array(positions.count * 3);
    
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const z = positions.getY(i); // PlaneGeometry는 XY 평면
      
      // 높이맵에서 높이 조회
      const worldX = x + width / 2;
      const worldZ = z + depth / 2;
      const height = this.heightMap.getHeightAt(worldX, worldZ);
      
      // Z 위치를 높이로 설정 (나중에 회전)
      positions.setZ(i, height);
      
      // 높이 기반 색상 설정
      const color = this.getVertexColor(height, type);
      vertexColors[i * 3] = color.r;
      vertexColors[i * 3 + 1] = color.g;
      vertexColors[i * 3 + 2] = color.b;
    }
    
    geometry.setAttribute('color', new THREE.BufferAttribute(vertexColors, 3));
    geometry.computeVertexNormals();
    
    // 머티리얼 생성
    const material = await this.createTerrainMaterial(type);
    
    // 메시 생성
    this.terrainMesh = new THREE.Mesh(geometry, material);
    this.terrainMesh.rotation.x = -Math.PI / 2;
    this.terrainMesh.receiveShadow = true;
    this.terrainMesh.castShadow = false;
    this.terrainMesh.name = 'terrain-ground';
    
    this.terrainGroup.add(this.terrainMesh);
  }
  
  /**
   * 높이 기반 정점 색상 계산
   */
  private getVertexColor(height: number, type: TerrainType): THREE.Color {
    const baseColor = new THREE.Color(TERRAIN_COLORS[type]);
    
    // 높이에 따른 색상 변조
    const heightFactor = Math.max(0, Math.min(1, (height + 5) / 15));
    
    if (type === 'mountain') {
      // 산: 낮은 곳은 초록, 높은 곳은 회색/흰색
      if (heightFactor < 0.3) {
        return baseColor.clone().lerp(new THREE.Color(0x4a7c3f), 1 - heightFactor * 3);
      } else if (heightFactor > 0.8) {
        return baseColor.clone().lerp(new THREE.Color(0xffffff), (heightFactor - 0.8) * 5);
      }
    } else if (type === 'plains' || type === 'forest') {
      // 평원/숲: 높이에 따른 미세한 변화
      const variation = (Math.sin(height * 10) * 0.1 + 0.9);
      return baseColor.clone().multiplyScalar(variation);
    }
    
    return baseColor;
  }
  
  /**
   * 지형 머티리얼 생성
   */
  private async createTerrainMaterial(type: TerrainType): Promise<THREE.Material> {
    // 캐시 확인
    if (this.materials.has(type)) {
      return this.materials.get(type)!;
    }
    
    const baseColor = TERRAIN_COLORS[type];
    const textureConfig = this.config.textures;
    
    // 기본 머티리얼 설정
    const materialParams: THREE.MeshStandardMaterialParameters = {
      color: baseColor,
      vertexColors: true,
      roughness: 0.85,
      metalness: 0.0,
      flatShading: false,
    };
    
    // 텍스처 로드 (선택적)
    if (textureConfig?.base) {
      try {
        const baseTexture = await this.loadTexture(textureConfig.base);
        baseTexture.wrapS = THREE.RepeatWrapping;
        baseTexture.wrapT = THREE.RepeatWrapping;
        baseTexture.repeat.set(
          this.config.width / (textureConfig.scale || 10),
          this.config.depth / (textureConfig.scale || 10)
        );
        materialParams.map = baseTexture;
      } catch (e) {
        console.warn('텍스처 로드 실패:', textureConfig.base);
      }
    }
    
    if (textureConfig?.normal) {
      try {
        const normalTexture = await this.loadTexture(textureConfig.normal);
        normalTexture.wrapS = THREE.RepeatWrapping;
        normalTexture.wrapT = THREE.RepeatWrapping;
        normalTexture.repeat.set(
          this.config.width / (textureConfig.scale || 10),
          this.config.depth / (textureConfig.scale || 10)
        );
        materialParams.normalMap = normalTexture;
        materialParams.normalScale = new THREE.Vector2(0.5, 0.5);
      } catch (e) {
        console.warn('노멀맵 로드 실패:', textureConfig.normal);
      }
    }
    
    const material = new THREE.MeshStandardMaterial(materialParams);
    this.materials.set(type, material);
    
    return material;
  }
  
  /**
   * 텍스처 로드
   */
  private loadTexture(path: string): Promise<THREE.Texture> {
    // 캐시 확인
    if (this.textures.has(path)) {
      return Promise.resolve(this.textures.get(path)!);
    }
    
    return new Promise((resolve, reject) => {
      this.textureLoader.load(
        path,
        (texture) => {
          this.textures.set(path, texture);
          resolve(texture);
        },
        undefined,
        reject
      );
    });
  }
  
  /**
   * 물 생성
   */
  private createWater(): void {
    const waterConfig: WaterConfig = {
      width: this.config.width,
      depth: this.config.depth,
      level: this.config.type === 'river' ? 0.2 : -0.1,
      color: this.config.type === 'river' ? '#4169e1' : '#556b2f',
      opacity: this.config.type === 'river' ? 0.7 : 0.5,
      flow: { x: 0.1, y: 0 },
      ripples: this.config.type === 'river',
    };
    
    this.waterRenderer.create(waterConfig);
  }
  
  // ========================================
  // 청크 시스템 (대규모 지형 최적화)
  // ========================================
  
  /**
   * 청크 기반 지형 생성
   */
  generateChunked(): void {
    const { width, depth, chunkSize } = this.config;
    const chunksX = Math.ceil(width / chunkSize);
    const chunksZ = Math.ceil(depth / chunkSize);
    
    for (let cz = 0; cz < chunksZ; cz++) {
      for (let cx = 0; cx < chunksX; cx++) {
        this.createChunk(cx, cz);
      }
    }
    
    console.log(`📦 ${this.chunks.size}개 청크 생성 완료`);
  }
  
  /**
   * 단일 청크 생성
   */
  private createChunk(chunkX: number, chunkZ: number): TerrainChunk {
    const { width, depth, chunkSize, resolution, type } = this.config;
    const chunkResolution = Math.ceil(resolution * chunkSize / width);
    
    // 청크 위치 계산
    const offsetX = chunkX * chunkSize - width / 2;
    const offsetZ = chunkZ * chunkSize - depth / 2;
    
    // 청크 지오메트리
    const geometry = new THREE.PlaneGeometry(
      chunkSize,
      chunkSize,
      chunkResolution,
      chunkResolution
    );
    
    // 정점 높이 적용
    const positions = geometry.attributes.position;
    const colors = new Float32Array(positions.count * 3);
    
    for (let i = 0; i < positions.count; i++) {
      const localX = positions.getX(i);
      const localZ = positions.getY(i);
      
      const worldX = offsetX + localX + chunkSize / 2;
      const worldZ = offsetZ + localZ + chunkSize / 2;
      
      const height = this.heightMap.getHeightAt(worldX + width / 2, worldZ + depth / 2);
      positions.setZ(i, height);
      
      const color = this.getVertexColor(height, type);
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }
    
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.computeVertexNormals();
    
    // 머티리얼 (캐시된 것 사용)
    const material = this.materials.get(type) || new THREE.MeshStandardMaterial({
      color: TERRAIN_COLORS[type],
      vertexColors: true,
      roughness: 0.85,
    });
    
    // 메시 생성
    const mesh = new THREE.Mesh(geometry, material);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(offsetX + chunkSize / 2, 0, offsetZ + chunkSize / 2);
    mesh.receiveShadow = true;
    mesh.name = `chunk_${chunkX}_${chunkZ}`;
    
    this.terrainGroup.add(mesh);
    
    // 바운딩 박스 계산
    const bounds = new THREE.Box3().setFromObject(mesh);
    
    // 청크 데이터 저장
    const chunk: TerrainChunk = {
      id: `${chunkX}_${chunkZ}`,
      chunkX,
      chunkZ,
      mesh,
      bounds,
      lodLevel: 0,
      visible: true,
    };
    
    this.chunks.set(chunk.id, chunk);
    return chunk;
  }
  
  /**
   * 청크 가시성 업데이트 (프러스텀 컬링)
   */
  updateChunkVisibility(camera: THREE.Camera): void {
    const frustum = new THREE.Frustum();
    const projectionMatrix = new THREE.Matrix4();
    
    projectionMatrix.multiplyMatrices(
      camera.projectionMatrix,
      camera.matrixWorldInverse
    );
    frustum.setFromProjectionMatrix(projectionMatrix);
    
    this.chunks.forEach(chunk => {
      const isVisible = frustum.intersectsBox(chunk.bounds);
      chunk.visible = isVisible;
      chunk.mesh.visible = isVisible;
    });
  }
  
  // ========================================
  // 쿼리 API
  // ========================================
  
  /**
   * 특정 위치의 높이 조회
   */
  getHeightAt(x: number, z: number): number {
    return this.heightMap.getHeightAt(x + this.config.width / 2, z + this.config.depth / 2);
  }
  
  /**
   * 특정 위치의 경사면 조회
   */
  getSlopeAt(x: number, z: number): number {
    return this.heightMap.getSlopeAt(x + this.config.width / 2, z + this.config.depth / 2);
  }
  
  /**
   * 특정 위치의 지형 타입 조회
   */
  getTerrainTypeAt(x: number, z: number): TerrainType {
    const height = this.getHeightAt(x, z);
    
    // 높이 기반 지형 타입 결정
    if (height < -0.5) return 'river';
    if (height < 0) return 'swamp';
    if (height > 8) return 'mountain';
    if (height > 3) return 'forest';
    
    return this.config.type;
  }
  
  /**
   * 이동 속도 보정치 조회
   */
  getSpeedModifierAt(x: number, z: number): number {
    const terrainType = this.getTerrainTypeAt(x, z);
    const slope = this.getSlopeAt(x, z);
    
    // 기본 지형 보정
    let modifier = TERRAIN_SPEED_MODIFIER[terrainType];
    
    // 경사면 보정 (경사가 급할수록 느려짐)
    modifier *= Math.max(0.3, 1 - slope * 0.5);
    
    return modifier;
  }
  
  /**
   * 방어 보정치 조회
   */
  getDefenseModifierAt(x: number, z: number): number {
    const terrainType = this.getTerrainTypeAt(x, z);
    const height = this.getHeightAt(x, z);
    
    // 기본 지형 보정
    let modifier = TERRAIN_DEFENSE_MODIFIER[terrainType];
    
    // 고지 보너스
    if (height > 2) {
      modifier *= 1 + (height - 2) * 0.05;
    }
    
    return modifier;
  }
  
  /**
   * 레이캐스팅으로 지형 높이 조회 (정확한 메시 기반)
   */
  raycastHeight(x: number, z: number): number {
    if (!this.terrainMesh) return 0;
    
    const raycaster = new THREE.Raycaster(
      new THREE.Vector3(x, 100, z),
      new THREE.Vector3(0, -1, 0)
    );
    
    const intersects = raycaster.intersectObject(this.terrainMesh);
    if (intersects.length > 0) {
      return intersects[0].point.y;
    }
    
    return this.getHeightAt(x, z);
  }
  
  // ========================================
  // 유틸리티
  // ========================================
  
  /**
   * 지형 그룹 반환
   */
  getTerrainGroup(): THREE.Group {
    return this.terrainGroup;
  }
  
  /**
   * 높이맵 인스턴스 반환
   */
  getHeightMap(): HeightMap {
    return this.heightMap;
  }
  
  /**
   * 지형 요소 인스턴스 반환
   */
  getFeatures(): TerrainFeatures {
    return this.features;
  }
  
  /**
   * 물 렌더러 인스턴스 반환
   */
  getWaterRenderer(): WaterRenderer {
    return this.waterRenderer;
  }
  
  /**
   * 설정 반환
   */
  getConfig(): Required<TerrainConfig> {
    return this.config;
  }
  
  /**
   * 지형 업데이트 (애니메이션)
   */
  update(deltaTime: number): void {
    this.waterRenderer.update(deltaTime);
    this.features.update(deltaTime);
  }
  
  /**
   * 리소스 해제
   */
  dispose(): void {
    // 청크 정리
    this.chunks.forEach(chunk => {
      chunk.mesh.geometry.dispose();
      this.terrainGroup.remove(chunk.mesh);
    });
    this.chunks.clear();
    
    // 메인 메시 정리
    if (this.terrainMesh) {
      this.terrainMesh.geometry.dispose();
      this.terrainGroup.remove(this.terrainMesh);
      this.terrainMesh = null;
    }
    
    // 머티리얼 정리
    this.materials.forEach(material => material.dispose());
    this.materials.clear();
    
    // 텍스처 정리
    this.textures.forEach(texture => texture.dispose());
    this.textures.clear();
    
    // 컴포넌트 정리
    this.heightMap.dispose();
    this.features.dispose();
    this.waterRenderer.dispose();
    
    // 씬에서 제거
    this.scene.remove(this.terrainGroup);
    
    console.log('🧹 TerrainGenerator 정리 완료');
  }
}

// ========================================
// 팩토리 함수
// ========================================

/**
 * 지형 생성기 생성
 */
export function createTerrainGenerator(
  scene: THREE.Scene,
  config: TerrainConfig
): TerrainGenerator {
  return new TerrainGenerator(scene, config);
}

/**
 * 기본 전장 지형 생성
 */
export function createBattlefieldTerrain(
  scene: THREE.Scene,
  type: TerrainType = 'plains',
  width: number = 300,
  depth: number = 300
): TerrainGenerator {
  const config: TerrainConfig = {
    type,
    width,
    depth,
    features: getDefaultFeatures(type),
    resolution: 128,
    seed: Date.now(),
  };
  
  return new TerrainGenerator(scene, config);
}

/**
 * 지형 타입별 기본 요소 설정
 */
function getDefaultFeatures(type: TerrainType): TerrainFeatureConfig[] {
  switch (type) {
    case 'forest':
      return [
        { type: 'tree', density: 0.3, minScale: 0.8, maxScale: 1.5 },
        { type: 'rock', density: 0.05, minScale: 0.5, maxScale: 1.2 },
        { type: 'grass', density: 0.4, minScale: 0.6, maxScale: 1.0 },
      ];
    case 'mountain':
      return [
        { type: 'rock', density: 0.2, minScale: 1.0, maxScale: 3.0 },
        { type: 'tree', density: 0.1, minScale: 0.5, maxScale: 1.0 },
      ];
    case 'plains':
      return [
        { type: 'grass', density: 0.3, minScale: 0.5, maxScale: 0.8 },
        { type: 'tree', density: 0.02, minScale: 0.8, maxScale: 1.3 },
        { type: 'rock', density: 0.01, minScale: 0.3, maxScale: 0.8 },
      ];
    case 'city':
      return [
        { type: 'building', density: 0.15, minScale: 0.8, maxScale: 1.5 },
        { type: 'wall', density: 0.05, minScale: 1.0, maxScale: 1.5 },
      ];
    case 'desert':
      return [
        { type: 'rock', density: 0.08, minScale: 0.5, maxScale: 2.0 },
      ];
    case 'snow':
      return [
        { type: 'tree', density: 0.05, minScale: 0.6, maxScale: 1.2 },
        { type: 'rock', density: 0.1, minScale: 0.5, maxScale: 1.5 },
      ];
    case 'swamp':
      return [
        { type: 'tree', density: 0.15, minScale: 0.5, maxScale: 1.0 },
        { type: 'grass', density: 0.2, minScale: 0.4, maxScale: 0.7 },
      ];
    default:
      return [];
  }
}





