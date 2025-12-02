/**
 * RenderOptimizer.ts
 * 
 * 렌더링 최적화 시스템
 * - 프러스텀 컬링
 * - LOD 시스템 통합
 * - 인스턴싱 최적화
 * - 드로우콜 배칭
 * - 셰이더 최적화
 * - 공간 분할 (Spatial Hash)
 */

import * as THREE from 'three';
import { QualitySettings } from './QualityManager';

// ===== 타입 정의 =====

/** 공간 해시 셀 */
interface SpatialHashCell {
  objects: Set<string>;
  bounds: THREE.Box3;
}

/** 컬링 결과 */
export interface CullingResult {
  visible: string[];
  culled: string[];
  total: number;
  culledCount: number;
  visibleCount: number;
}

/** 배칭 그룹 */
interface BatchGroup {
  key: string;
  geometry: THREE.BufferGeometry;
  material: THREE.Material;
  instances: THREE.Matrix4[];
  colors?: THREE.Color[];
  mesh?: THREE.InstancedMesh;
}

/** 렌더 최적화 설정 */
export interface RenderOptimizerConfig {
  /** 프러스텀 컬링 활성화 */
  enableFrustumCulling: boolean;
  /** 오클루전 컬링 활성화 (실험적) */
  enableOcclusionCulling: boolean;
  /** 인스턴싱 활성화 */
  enableInstancing: boolean;
  /** 배칭 활성화 */
  enableBatching: boolean;
  /** 공간 분할 셀 크기 */
  spatialCellSize: number;
  /** 최대 배치 크기 */
  maxBatchSize: number;
  /** 거리 기반 업데이트 주기 */
  distanceUpdateThreshold: number;
  /** LOD 바이어스 */
  lodBias: number;
}

/** 렌더러 통계 */
export interface RenderOptimizerStats {
  culledObjects: number;
  visibleObjects: number;
  batchCount: number;
  drawCalls: number;
  triangles: number;
  spatialCells: number;
  lastCullingTime: number;
  lastBatchingTime: number;
}

// ===== 기본 설정 =====

const DEFAULT_CONFIG: RenderOptimizerConfig = {
  enableFrustumCulling: true,
  enableOcclusionCulling: false,
  enableInstancing: true,
  enableBatching: true,
  spatialCellSize: 50,
  maxBatchSize: 1000,
  distanceUpdateThreshold: 5,
  lodBias: 0,
};

// ===== 공간 해시 시스템 =====

class SpatialHash {
  private cellSize: number;
  private cells: Map<string, SpatialHashCell> = new Map();
  private objectCells: Map<string, string> = new Map(); // objectId → cellKey
  
  constructor(cellSize: number) {
    this.cellSize = cellSize;
  }
  
  /**
   * 위치로 셀 키 계산
   */
  private getCellKey(x: number, z: number): string {
    const cellX = Math.floor(x / this.cellSize);
    const cellZ = Math.floor(z / this.cellSize);
    return `${cellX},${cellZ}`;
  }
  
  /**
   * 오브젝트 추가/업데이트
   */
  updateObject(id: string, position: THREE.Vector3): void {
    const newCellKey = this.getCellKey(position.x, position.z);
    const oldCellKey = this.objectCells.get(id);
    
    // 같은 셀이면 스킵
    if (oldCellKey === newCellKey) return;
    
    // 이전 셀에서 제거
    if (oldCellKey) {
      const oldCell = this.cells.get(oldCellKey);
      if (oldCell) {
        oldCell.objects.delete(id);
        if (oldCell.objects.size === 0) {
          this.cells.delete(oldCellKey);
        }
      }
    }
    
    // 새 셀에 추가
    let cell = this.cells.get(newCellKey);
    if (!cell) {
      const [cx, cz] = newCellKey.split(',').map(Number);
      cell = {
        objects: new Set(),
        bounds: new THREE.Box3(
          new THREE.Vector3(cx * this.cellSize, -100, cz * this.cellSize),
          new THREE.Vector3((cx + 1) * this.cellSize, 100, (cz + 1) * this.cellSize)
        ),
      };
      this.cells.set(newCellKey, cell);
    }
    
    cell.objects.add(id);
    this.objectCells.set(id, newCellKey);
  }
  
  /**
   * 오브젝트 제거
   */
  removeObject(id: string): void {
    const cellKey = this.objectCells.get(id);
    if (cellKey) {
      const cell = this.cells.get(cellKey);
      if (cell) {
        cell.objects.delete(id);
        if (cell.objects.size === 0) {
          this.cells.delete(cellKey);
        }
      }
      this.objectCells.delete(id);
    }
  }
  
  /**
   * 프러스텀과 교차하는 셀의 오브젝트 반환
   */
  queryFrustum(frustum: THREE.Frustum): string[] {
    const result: string[] = [];
    
    for (const [, cell] of this.cells) {
      if (frustum.intersectsBox(cell.bounds)) {
        result.push(...cell.objects);
      }
    }
    
    return result;
  }
  
  /**
   * 범위 내 오브젝트 조회
   */
  queryRange(center: THREE.Vector3, radius: number): string[] {
    const result: string[] = [];
    const minX = Math.floor((center.x - radius) / this.cellSize);
    const maxX = Math.floor((center.x + radius) / this.cellSize);
    const minZ = Math.floor((center.z - radius) / this.cellSize);
    const maxZ = Math.floor((center.z + radius) / this.cellSize);
    
    for (let cx = minX; cx <= maxX; cx++) {
      for (let cz = minZ; cz <= maxZ; cz++) {
        const cell = this.cells.get(`${cx},${cz}`);
        if (cell) {
          result.push(...cell.objects);
        }
      }
    }
    
    return result;
  }
  
  /**
   * 통계
   */
  getStats(): { cellCount: number; objectCount: number } {
    return {
      cellCount: this.cells.size,
      objectCount: this.objectCells.size,
    };
  }
  
  /**
   * 정리
   */
  clear(): void {
    this.cells.clear();
    this.objectCells.clear();
  }
}

// ===== 메인 클래스 =====

export class RenderOptimizer {
  private config: RenderOptimizerConfig;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  
  // 공간 분할
  private spatialHash: SpatialHash;
  
  // 프러스텀 컬링
  private frustum: THREE.Frustum = new THREE.Frustum();
  private frustumMatrix: THREE.Matrix4 = new THREE.Matrix4();
  
  // 오브젝트 추적
  private objects: Map<string, THREE.Object3D> = new Map();
  private objectPositions: Map<string, THREE.Vector3> = new Map();
  private objectDistances: Map<string, number> = new Map();
  
  // 배칭
  private batchGroups: Map<string, BatchGroup> = new Map();
  private batchDirty: boolean = false;
  
  // 통계
  private stats: RenderOptimizerStats = {
    culledObjects: 0,
    visibleObjects: 0,
    batchCount: 0,
    drawCalls: 0,
    triangles: 0,
    spatialCells: 0,
    lastCullingTime: 0,
    lastBatchingTime: 0,
  };
  
  // 임시 객체 (GC 방지)
  private tempVector = new THREE.Vector3();
  private tempBox = new THREE.Box3();
  
  constructor(
    scene: THREE.Scene,
    camera: THREE.PerspectiveCamera,
    config?: Partial<RenderOptimizerConfig>
  ) {
    this.scene = scene;
    this.camera = camera;
    this.config = { ...DEFAULT_CONFIG, ...config };
    
    this.spatialHash = new SpatialHash(this.config.spatialCellSize);
    
    console.log('🎨 RenderOptimizer 초기화 완료');
  }
  
  // ===== 오브젝트 관리 =====
  
  /**
   * 오브젝트 등록
   */
  registerObject(id: string, object: THREE.Object3D): void {
    this.objects.set(id, object);
    
    const position = object.position.clone();
    this.objectPositions.set(id, position);
    this.spatialHash.updateObject(id, position);
    
    this.batchDirty = true;
  }
  
  /**
   * 오브젝트 위치 업데이트
   */
  updateObjectPosition(id: string, position: THREE.Vector3): void {
    const oldPosition = this.objectPositions.get(id);
    
    if (oldPosition) {
      // 위치 변화가 임계값 이상일 때만 업데이트
      const dist = oldPosition.distanceTo(position);
      if (dist > this.config.distanceUpdateThreshold) {
        oldPosition.copy(position);
        this.spatialHash.updateObject(id, position);
      }
    } else {
      this.objectPositions.set(id, position.clone());
      this.spatialHash.updateObject(id, position);
    }
  }
  
  /**
   * 오브젝트 제거
   */
  unregisterObject(id: string): void {
    this.objects.delete(id);
    this.objectPositions.delete(id);
    this.objectDistances.delete(id);
    this.spatialHash.removeObject(id);
    
    this.batchDirty = true;
  }
  
  // ===== 프러스텀 컬링 =====
  
  /**
   * 프러스텀 업데이트
   */
  updateFrustum(): void {
    this.frustumMatrix.multiplyMatrices(
      this.camera.projectionMatrix,
      this.camera.matrixWorldInverse
    );
    this.frustum.setFromProjectionMatrix(this.frustumMatrix);
  }
  
  /**
   * 프러스텀 컬링 수행
   */
  performFrustumCulling(): CullingResult {
    if (!this.config.enableFrustumCulling) {
      const allIds = Array.from(this.objects.keys());
      return {
        visible: allIds,
        culled: [],
        total: allIds.length,
        culledCount: 0,
        visibleCount: allIds.length,
      };
    }
    
    const startTime = performance.now();
    
    this.updateFrustum();
    
    // 공간 해시를 이용한 빠른 컬링
    const potentialVisible = this.spatialHash.queryFrustum(this.frustum);
    
    const visible: string[] = [];
    const culled: string[] = [];
    
    // 세부 컬링 (바운딩 박스)
    for (const id of potentialVisible) {
      const object = this.objects.get(id);
      if (!object) continue;
      
      // 바운딩 박스 체크
      this.tempBox.setFromObject(object);
      
      if (this.frustum.intersectsBox(this.tempBox)) {
        visible.push(id);
        
        // 거리 계산
        const distance = this.camera.position.distanceTo(object.position);
        this.objectDistances.set(id, distance);
      } else {
        culled.push(id);
      }
    }
    
    // 공간 해시에 없는 오브젝트는 컬링됨
    const potentialSet = new Set(potentialVisible);
    for (const id of this.objects.keys()) {
      if (!potentialSet.has(id)) {
        culled.push(id);
      }
    }
    
    // 통계 업데이트
    this.stats.visibleObjects = visible.length;
    this.stats.culledObjects = culled.length;
    this.stats.lastCullingTime = performance.now() - startTime;
    
    return {
      visible,
      culled,
      total: this.objects.size,
      culledCount: culled.length,
      visibleCount: visible.length,
    };
  }
  
  /**
   * 오브젝트 가시성 적용
   */
  applyVisibility(result: CullingResult): void {
    for (const id of result.visible) {
      const object = this.objects.get(id);
      if (object) object.visible = true;
    }
    
    for (const id of result.culled) {
      const object = this.objects.get(id);
      if (object) object.visible = false;
    }
  }
  
  // ===== LOD 최적화 =====
  
  /**
   * LOD 레벨 계산
   */
  calculateLODLevel(distance: number, lodLevels: number[]): number {
    const biasedDistance = distance * (1 + this.config.lodBias * 0.5);
    
    for (let i = lodLevels.length - 1; i >= 0; i--) {
      if (biasedDistance >= lodLevels[i]) {
        return i;
      }
    }
    
    return 0;
  }
  
  /**
   * 거리별 LOD 분포 계산
   */
  getLODDistribution(lodLevels: number[]): Record<number, number> {
    const distribution: Record<number, number> = {};
    
    for (let i = 0; i < lodLevels.length; i++) {
      distribution[i] = 0;
    }
    
    for (const [, distance] of this.objectDistances) {
      const level = this.calculateLODLevel(distance, lodLevels);
      distribution[level] = (distribution[level] || 0) + 1;
    }
    
    return distribution;
  }
  
  // ===== 배칭 =====
  
  /**
   * 배치 그룹 등록
   */
  registerBatchGroup(
    key: string,
    geometry: THREE.BufferGeometry,
    material: THREE.Material,
    maxInstances: number
  ): void {
    if (this.batchGroups.has(key)) {
      console.warn(`[RenderOptimizer] 배치 그룹 '${key}' 이미 존재`);
      return;
    }
    
    this.batchGroups.set(key, {
      key,
      geometry,
      material,
      instances: [],
      colors: [],
    });
  }
  
  /**
   * 배치 인스턴스 추가
   */
  addBatchInstance(key: string, matrix: THREE.Matrix4, color?: THREE.Color): void {
    const group = this.batchGroups.get(key);
    if (!group) return;
    
    group.instances.push(matrix.clone());
    if (color) {
      group.colors?.push(color.clone());
    }
    
    this.batchDirty = true;
  }
  
  /**
   * 배치 메시 생성/업데이트
   */
  updateBatches(): void {
    if (!this.config.enableBatching || !this.batchDirty) return;
    
    const startTime = performance.now();
    
    for (const [key, group] of this.batchGroups) {
      if (group.instances.length === 0) {
        // 기존 메시 제거
        if (group.mesh) {
          this.scene.remove(group.mesh);
          group.mesh = undefined;
        }
        continue;
      }
      
      // 인스턴스 메시 생성/업데이트
      if (!group.mesh) {
        group.mesh = new THREE.InstancedMesh(
          group.geometry,
          group.material,
          Math.min(group.instances.length, this.config.maxBatchSize)
        );
        group.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
        this.scene.add(group.mesh);
      }
      
      // 매트릭스 업데이트
      const count = Math.min(group.instances.length, this.config.maxBatchSize);
      group.mesh.count = count;
      
      for (let i = 0; i < count; i++) {
        group.mesh.setMatrixAt(i, group.instances[i]);
        
        if (group.colors && group.colors[i]) {
          group.mesh.setColorAt(i, group.colors[i]);
        }
      }
      
      group.mesh.instanceMatrix.needsUpdate = true;
      if (group.mesh.instanceColor) {
        group.mesh.instanceColor.needsUpdate = true;
      }
    }
    
    this.stats.batchCount = this.batchGroups.size;
    this.stats.lastBatchingTime = performance.now() - startTime;
    this.batchDirty = false;
  }
  
  /**
   * 배치 인스턴스 초기화
   */
  clearBatchInstances(key?: string): void {
    if (key) {
      const group = this.batchGroups.get(key);
      if (group) {
        group.instances = [];
        group.colors = [];
      }
    } else {
      for (const group of this.batchGroups.values()) {
        group.instances = [];
        group.colors = [];
      }
    }
    
    this.batchDirty = true;
  }
  
  // ===== 품질 설정 적용 =====
  
  /**
   * 품질 설정에 따른 최적화 조정
   */
  applyQualitySettings(settings: QualitySettings): void {
    this.config.enableInstancing = settings.enableInstancing;
    this.config.lodBias = settings.lodBias;
    
    // 최대 가시 유닛에 따른 배치 크기 조정
    this.config.maxBatchSize = settings.maxVisibleUnits;
    
    // 품질에 따른 공간 분할 셀 크기 조정
    if (settings.terrainDetail === 'minimal' || settings.terrainDetail === 'low') {
      this.config.spatialCellSize = 100;
    } else if (settings.terrainDetail === 'medium') {
      this.config.spatialCellSize = 50;
    } else {
      this.config.spatialCellSize = 25;
    }
    
    // 공간 해시 재생성
    this.spatialHash = new SpatialHash(this.config.spatialCellSize);
    
    // 기존 오브젝트 재등록
    for (const [id, position] of this.objectPositions) {
      this.spatialHash.updateObject(id, position);
    }
  }
  
  // ===== 통계 =====
  
  /**
   * 통계 반환
   */
  getStats(): RenderOptimizerStats {
    const spatialStats = this.spatialHash.getStats();
    this.stats.spatialCells = spatialStats.cellCount;
    
    return { ...this.stats };
  }
  
  /**
   * 오브젝트 거리 반환
   */
  getObjectDistance(id: string): number {
    return this.objectDistances.get(id) ?? Infinity;
  }
  
  /**
   * 가시 오브젝트 ID 반환
   */
  getVisibleObjectIds(): string[] {
    return Array.from(this.objects.keys()).filter(id => {
      const obj = this.objects.get(id);
      return obj?.visible ?? false;
    });
  }
  
  // ===== 매 프레임 업데이트 =====
  
  /**
   * 매 프레임 호출
   */
  update(): void {
    // 프러스텀 컬링
    const cullingResult = this.performFrustumCulling();
    this.applyVisibility(cullingResult);
    
    // 배칭 업데이트
    this.updateBatches();
  }
  
  // ===== 설정 =====
  
  /**
   * 설정 변경
   */
  setConfig(config: Partial<RenderOptimizerConfig>): void {
    Object.assign(this.config, config);
  }
  
  /**
   * 설정 반환
   */
  getConfig(): RenderOptimizerConfig {
    return { ...this.config };
  }
  
  // ===== 정리 =====
  
  /**
   * 정리
   */
  dispose(): void {
    // 배치 메시 정리
    for (const group of this.batchGroups.values()) {
      if (group.mesh) {
        this.scene.remove(group.mesh);
        group.mesh.geometry.dispose();
        if (Array.isArray(group.mesh.material)) {
          group.mesh.material.forEach(m => m.dispose());
        } else {
          (group.mesh.material as THREE.Material).dispose();
        }
      }
    }
    
    this.batchGroups.clear();
    this.objects.clear();
    this.objectPositions.clear();
    this.objectDistances.clear();
    this.spatialHash.clear();
    
    console.log('🧹 RenderOptimizer 정리 완료');
  }
}

// ===== 팩토리 함수 =====

/**
 * 렌더 최적화 인스턴스 생성
 */
export function createRenderOptimizer(
  scene: THREE.Scene,
  camera: THREE.PerspectiveCamera,
  config?: Partial<RenderOptimizerConfig>
): RenderOptimizer {
  return new RenderOptimizer(scene, camera, config);
}

export default RenderOptimizer;





