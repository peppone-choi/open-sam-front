/**
 * InstancedUnitRenderer - 대규모 유닛 렌더링 최적화
 * 
 * 핵심 최적화:
 * 1. 하이브리드 LOD: 근거리는 상세 복셀, 중/원거리는 InstancedMesh
 * 2. LOD 시스템 (근/중/원거리 다른 디테일)
 * 3. 프러스텀 컬링 (화면 밖 유닛 스킵)
 * 
 * 목표: 500+ 유닛 60fps, VRAM 1GB 이하, 드로우콜 100 이하
 */

import * as THREE from 'three';
import { TWSoldier, TWSquad, Vector2 } from './TotalWarEngine';
import { buildVoxelUnitFromSpec } from '@/components/battle/units/VoxelUnitBuilder';
import { VOXEL_UNIT_DATABASE } from '@/components/battle/units/db/VoxelUnitDefinitions';

// ===== 타입 정의 =====

/** LOD 레벨 */
export type LODLevel = 'high' | 'medium' | 'low';

/** LOD 거리 설정 */
export const LOD_DISTANCES = {
  high: 50,      // 0-50: 풀 복셀 모델
  medium: 100,   // 50-100: 단순화 복셀
  low: Infinity, // 100+: 색상 박스
};

/** 유닛 타입별 인스턴스 데이터 */
interface UnitTypeInstanceData {
  unitTypeId: number;
  teamId: string;
  colors: UnitColors;
  
  // 근거리: 상세 복셀 모델 풀 (재사용)
  voxelModelPool: THREE.Group[];
  activeVoxelModels: Map<string, THREE.Group>; // soldierId -> model
  
  // 중/원거리: InstancedMesh
  mediumLOD: THREE.InstancedMesh | null;
  lowLOD: THREE.InstancedMesh | null;
  
  // 인스턴스 인덱스 매핑 (soldierId -> instanceIndex)
  instanceIndexMap: Map<string, number>;
  
  // 활성 인스턴스 수
  activeCount: number;
  
  // 최대 인스턴스 수
  maxInstances: number;
}

/** 유닛 색상 정보 */
interface UnitColors {
  primary: string;
  secondary: string;
}

// ===== 국가별 색상 =====
const NATION_COLORS: Record<string, UnitColors> = {
  wei: { primary: '#2F4F4F', secondary: '#4682B4' },
  wu: { primary: '#8B0000', secondary: '#CD5C5C' },
  shu: { primary: '#228B22', secondary: '#FFD700' },
  attacker: { primary: '#2F4F4F', secondary: '#4682B4' },
  defender: { primary: '#8B0000', secondary: '#CD5C5C' },
};

// ===== InstancedUnitRenderer 클래스 =====

export class InstancedUnitRenderer {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  
  // 유닛 타입별 인스턴스 데이터
  private unitTypeData: Map<string, UnitTypeInstanceData> = new Map();
  
  // 재사용 가능한 지오메트리/머티리얼 캐시
  private geometryCache: Map<string, THREE.BufferGeometry> = new Map();
  private materialCache: Map<string, THREE.MeshStandardMaterial> = new Map();
  
  // 프러스텀 컬링용
  private frustum: THREE.Frustum = new THREE.Frustum();
  private projScreenMatrix: THREE.Matrix4 = new THREE.Matrix4();
  
  // 재사용 가능한 매트릭스 (GC 방지)
  private tempMatrix: THREE.Matrix4 = new THREE.Matrix4();
  private tempPosition: THREE.Vector3 = new THREE.Vector3();
  private tempQuaternion: THREE.Quaternion = new THREE.Quaternion();
  private tempScale: THREE.Vector3 = new THREE.Vector3(1, 1, 1);
  private tempEuler: THREE.Euler = new THREE.Euler();
  
  // 성능 메트릭
  private metrics = {
    drawCalls: 0,
    instancesRendered: 0,
    instancesCulled: 0,
    lastUpdateTime: 0,
  };
  
  constructor(scene: THREE.Scene, camera: THREE.PerspectiveCamera) {
    this.scene = scene;
    this.camera = camera;
  }
  
  // ===== 초기화 =====
  
  /**
   * 부대 목록에서 유닛 인스턴스 초기화
   */
  initializeFromSquads(squads: TWSquad[], soldiers: TWSoldier[]): void {
    // 기존 데이터 정리
    this.dispose();
    
    // 유닛 타입별로 그룹화
    const typeGroups = this.groupSoldiersByType(squads, soldiers);
    
    // 각 타입별로 InstancedMesh 생성
    for (const [typeKey, soldierIds] of typeGroups) {
      const [unitTypeIdStr, teamId] = typeKey.split('-');
      const unitTypeId = parseInt(unitTypeIdStr);
      
      this.createUnitTypeInstances(unitTypeId, teamId, soldierIds.length);
    }
    
    // 초기 위치 설정
    this.updateAllPositions(soldiers, squads);
  }
  
  /**
   * 병사들을 유닛 타입별로 그룹화
   */
  private groupSoldiersByType(
    squads: TWSquad[],
    soldiers: TWSoldier[]
  ): Map<string, string[]> {
    const groups = new Map<string, string[]>();
    
    for (const soldier of soldiers) {
      const squad = squads.find(s => s.id === soldier.squadId);
      if (!squad) continue;
      
      const typeKey = `${squad.unitTypeId}-${squad.teamId}`;
      
      if (!groups.has(typeKey)) {
        groups.set(typeKey, []);
      }
      groups.get(typeKey)!.push(soldier.id);
    }
    
    return groups;
  }
  
  /**
   * 유닛 타입별 InstancedMesh 및 복셀 모델 풀 생성
   */
  private createUnitTypeInstances(
    unitTypeId: number,
    teamId: string,
    maxInstances: number
  ): void {
    const typeKey = `${unitTypeId}-${teamId}`;
    const colors = NATION_COLORS[teamId] || NATION_COLORS.attacker;
    
    // 중/원거리용 LOD 지오메트리 생성
    const mediumGeom = this.createMediumLODGeometry(colors);
    const lowGeom = this.createLowLODGeometry(colors);
    
    // 공유 머티리얼
    const material = this.getOrCreateMaterial(colors.primary);
    
    // InstancedMesh 생성 (중/원거리용)
    const mediumLOD = new THREE.InstancedMesh(mediumGeom, material, maxInstances);
    const lowLOD = new THREE.InstancedMesh(lowGeom, material, maxInstances);
    
    // 그림자 설정
    mediumLOD.castShadow = true;
    lowLOD.castShadow = false; // 원거리는 그림자 비활성화
    
    // 프러스텀 컬링 활성화
    mediumLOD.frustumCulled = true;
    lowLOD.frustumCulled = true;
    
    // 이름 설정 (디버깅용)
    mediumLOD.name = `unit_${typeKey}_medium`;
    lowLOD.name = `unit_${typeKey}_low`;
    
    // 초기 인스턴스 수 0으로 설정
    mediumLOD.count = 0;
    lowLOD.count = 0;
    
    // 씬에 추가
    this.scene.add(mediumLOD);
    this.scene.add(lowLOD);
    
    // 근거리용 상세 복셀 모델 풀 생성 (최대 30개 - 화면에 동시에 보일 최대 근거리 유닛 수)
    const voxelPoolSize = Math.min(maxInstances, 30);
    const voxelModelPool: THREE.Group[] = [];
    
    for (let i = 0; i < voxelPoolSize; i++) {
      const voxelModel = this.createDetailedVoxelModel(unitTypeId, colors);
      voxelModel.visible = false; // 초기에는 숨김
      this.scene.add(voxelModel);
      voxelModelPool.push(voxelModel);
    }
    
    // 데이터 저장
    this.unitTypeData.set(typeKey, {
      unitTypeId,
      teamId,
      colors,
      voxelModelPool,
      activeVoxelModels: new Map(),
      mediumLOD,
      lowLOD,
      instanceIndexMap: new Map(),
      activeCount: 0,
      maxInstances,
    });
  }
  
  /**
   * 상세 복셀 모델 생성 (기존 VoxelUnitBuilder 사용)
   */
  private createDetailedVoxelModel(unitTypeId: number, colors: UnitColors): THREE.Group {
    const unitSpec = VOXEL_UNIT_DATABASE[unitTypeId];
    
    if (unitSpec) {
      try {
        return buildVoxelUnitFromSpec({
          unitId: unitTypeId,
          primaryColor: colors.primary,
          secondaryColor: colors.secondary,
          scale: 1.5, // VOXEL_UNIT_SCALE
        });
      } catch (e) {
        console.warn(`Failed to build voxel for unit ${unitTypeId}:`, e);
      }
    }
    
    // 폴백: 단순 박스 모델
    return this.createFallbackVoxelModel(colors);
  }
  
  /**
   * 폴백 복셀 모델 생성
   */
  private createFallbackVoxelModel(colors: UnitColors): THREE.Group {
    const group = new THREE.Group();
    
    const bodyGeom = new THREE.BoxGeometry(0.6, 1.5, 0.4);
    const bodyMat = new THREE.MeshStandardMaterial({ color: colors.primary });
    const body = new THREE.Mesh(bodyGeom, bodyMat);
    body.position.y = 0.75;
    body.castShadow = true;
    group.add(body);
    
    const headGeom = new THREE.SphereGeometry(0.2, 8, 8);
    const headMat = new THREE.MeshStandardMaterial({ color: 0xDEB887 });
    const head = new THREE.Mesh(headGeom, headMat);
    head.position.y = 1.6;
    head.castShadow = true;
    group.add(head);
    
    return group;
  }
  
  // ===== LOD 지오메트리 생성 =====
  
  /**
   * 고품질 LOD 지오메트리 (근거리)
   * - 복셀 형태의 캐릭터
   */
  private createHighLODGeometry(unitTypeId: number, colors: UnitColors): THREE.BufferGeometry {
    // 캐시 키
    const cacheKey = `high_${unitTypeId}_${colors.primary}`;
    if (this.geometryCache.has(cacheKey)) {
      return this.geometryCache.get(cacheKey)!;
    }
    
    // 복셀 기반 병사 형태 생성
    const geometry = new THREE.BufferGeometry();
    
    // 간단한 복셀 병사 (16개 박스 조합)
    const voxelSize = 0.03;
    const positions: number[] = [];
    const normals: number[] = [];
    const indices: number[] = [];
    
    // 복셀 데이터: [x, y, z] 상대 위치
    const voxelData = this.getUnitVoxelData(unitTypeId);
    
    let vertexOffset = 0;
    
    for (const [vx, vy, vz] of voxelData) {
      const x = vx * voxelSize;
      const y = vy * voxelSize;
      const z = vz * voxelSize;
      const s = voxelSize * 0.45; // 약간 작게 해서 틈 생성
      
      // 박스의 8개 정점
      const boxPositions = [
        // Front face
        x - s, y - s, z + s,
        x + s, y - s, z + s,
        x + s, y + s, z + s,
        x - s, y + s, z + s,
        // Back face
        x - s, y - s, z - s,
        x - s, y + s, z - s,
        x + s, y + s, z - s,
        x + s, y - s, z - s,
        // Top face
        x - s, y + s, z - s,
        x - s, y + s, z + s,
        x + s, y + s, z + s,
        x + s, y + s, z - s,
        // Bottom face
        x - s, y - s, z - s,
        x + s, y - s, z - s,
        x + s, y - s, z + s,
        x - s, y - s, z + s,
        // Right face
        x + s, y - s, z - s,
        x + s, y + s, z - s,
        x + s, y + s, z + s,
        x + s, y - s, z + s,
        // Left face
        x - s, y - s, z - s,
        x - s, y - s, z + s,
        x - s, y + s, z + s,
        x - s, y + s, z - s,
      ];
      
      const boxNormals = [
        // Front
        0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1,
        // Back
        0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1,
        // Top
        0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0,
        // Bottom
        0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0,
        // Right
        1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0,
        // Left
        -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0,
      ];
      
      // 6개 면 × 2개 삼각형 × 3개 인덱스
      const boxIndices = [
        0, 1, 2, 0, 2, 3,       // Front
        4, 5, 6, 4, 6, 7,       // Back
        8, 9, 10, 8, 10, 11,    // Top
        12, 13, 14, 12, 14, 15, // Bottom
        16, 17, 18, 16, 18, 19, // Right
        20, 21, 22, 20, 22, 23, // Left
      ];
      
      positions.push(...boxPositions);
      normals.push(...boxNormals);
      
      for (const idx of boxIndices) {
        indices.push(idx + vertexOffset);
      }
      
      vertexOffset += 24; // 24 vertices per box
    }
    
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
    geometry.setIndex(indices);
    
    // 캐시에 저장
    this.geometryCache.set(cacheKey, geometry);
    
    return geometry;
  }
  
  /**
   * 중간 품질 LOD 지오메트리 (중거리)
   * - 단순화된 3박스 형태
   */
  private createMediumLODGeometry(colors: UnitColors): THREE.BufferGeometry {
    const cacheKey = `medium_${colors.primary}`;
    if (this.geometryCache.has(cacheKey)) {
      return this.geometryCache.get(cacheKey)!;
    }
    
    // 간단한 3박스 조합 (머리, 몸통, 다리)
    const geometry = new THREE.BufferGeometry();
    const positions: number[] = [];
    const normals: number[] = [];
    const indices: number[] = [];
    
    // 3개의 박스: 다리, 몸통, 머리
    const boxes = [
      { x: 0, y: 0.15, z: 0, w: 0.12, h: 0.3, d: 0.08 },  // 다리
      { x: 0, y: 0.45, z: 0, w: 0.15, h: 0.25, d: 0.1 },  // 몸통
      { x: 0, y: 0.7, z: 0, w: 0.1, h: 0.1, d: 0.08 },    // 머리
    ];
    
    let vertexOffset = 0;
    
    for (const box of boxes) {
      const hw = box.w / 2;
      const hh = box.h / 2;
      const hd = box.d / 2;
      const { x, y, z } = box;
      
      const boxPositions = [
        // 6개 면
        x - hw, y - hh, z + hd, x + hw, y - hh, z + hd, x + hw, y + hh, z + hd, x - hw, y + hh, z + hd, // Front
        x - hw, y - hh, z - hd, x - hw, y + hh, z - hd, x + hw, y + hh, z - hd, x + hw, y - hh, z - hd, // Back
        x - hw, y + hh, z - hd, x - hw, y + hh, z + hd, x + hw, y + hh, z + hd, x + hw, y + hh, z - hd, // Top
        x - hw, y - hh, z - hd, x + hw, y - hh, z - hd, x + hw, y - hh, z + hd, x - hw, y - hh, z + hd, // Bottom
        x + hw, y - hh, z - hd, x + hw, y + hh, z - hd, x + hw, y + hh, z + hd, x + hw, y - hh, z + hd, // Right
        x - hw, y - hh, z - hd, x - hw, y - hh, z + hd, x - hw, y + hh, z + hd, x - hw, y + hh, z - hd, // Left
      ];
      
      const boxNormals = [
        0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1,
        0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1,
        0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0,
        0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0,
        1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0,
        -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0,
      ];
      
      const boxIndices = [
        0, 1, 2, 0, 2, 3,
        4, 5, 6, 4, 6, 7,
        8, 9, 10, 8, 10, 11,
        12, 13, 14, 12, 14, 15,
        16, 17, 18, 16, 18, 19,
        20, 21, 22, 20, 22, 23,
      ];
      
      positions.push(...boxPositions);
      normals.push(...boxNormals);
      
      for (const idx of boxIndices) {
        indices.push(idx + vertexOffset);
      }
      
      vertexOffset += 24;
    }
    
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
    geometry.setIndex(indices);
    
    this.geometryCache.set(cacheKey, geometry);
    
    return geometry;
  }
  
  /**
   * 저품질 LOD 지오메트리 (원거리)
   * - 단일 색상 박스
   */
  private createLowLODGeometry(colors: UnitColors): THREE.BufferGeometry {
    const cacheKey = `low_${colors.primary}`;
    if (this.geometryCache.has(cacheKey)) {
      return this.geometryCache.get(cacheKey)!;
    }
    
    // 단순한 하나의 박스
    const geometry = new THREE.BoxGeometry(0.15, 0.8, 0.1);
    geometry.translate(0, 0.4, 0); // 바닥에서 올림
    
    this.geometryCache.set(cacheKey, geometry);
    
    return geometry;
  }
  
  /**
   * 유닛 타입별 복셀 데이터 반환
   */
  private getUnitVoxelData(unitTypeId: number): number[][] {
    // 기본 보병 복셀 데이터 (간략화된 형태)
    // [x, y, z] - y가 위쪽
    const infantry: number[][] = [
      // 다리 (y: 0-6)
      [0, 0, 0], [1, 0, 0], [0, 1, 0], [1, 1, 0],
      [0, 2, 0], [1, 2, 0], [0, 3, 0], [1, 3, 0],
      [0, 4, 0], [1, 4, 0], [0, 5, 0], [1, 5, 0],
      // 몸통 (y: 6-14)
      [-1, 6, 0], [0, 6, 0], [1, 6, 0], [2, 6, 0],
      [-1, 7, 0], [0, 7, 0], [1, 7, 0], [2, 7, 0],
      [-1, 8, 0], [0, 8, 0], [1, 8, 0], [2, 8, 0],
      [-1, 9, 0], [0, 9, 0], [1, 9, 0], [2, 9, 0],
      [0, 10, 0], [1, 10, 0],
      [0, 11, 0], [1, 11, 0],
      [0, 12, 0], [1, 12, 0],
      [0, 13, 0], [1, 13, 0],
      // 머리 (y: 14-18)
      [0, 14, 0], [1, 14, 0],
      [0, 15, 0], [1, 15, 0],
      [0, 16, 0], [1, 16, 0],
      [0, 17, 0], [1, 17, 0],
    ];
    
    const cavalry: number[][] = [
      // 말 (크게)
      [0, 2, 0], [1, 2, 0], [2, 2, 0], [3, 2, 0], [4, 2, 0], [5, 2, 0],
      [0, 3, 0], [1, 3, 0], [2, 3, 0], [3, 3, 0], [4, 3, 0], [5, 3, 0],
      [0, 4, 0], [1, 4, 0], [2, 4, 0], [3, 4, 0], [4, 4, 0], [5, 4, 0],
      // 기수
      [2, 5, 0], [3, 5, 0],
      [2, 6, 0], [3, 6, 0],
      [2, 7, 0], [3, 7, 0],
      [2, 8, 0], [3, 8, 0],
      // 말 다리
      [0, 0, 0], [0, 1, 0], [5, 0, 0], [5, 1, 0],
    ];
    
    // 유닛 타입별 분기
    if (unitTypeId >= 1300 && unitTypeId < 1400) {
      return cavalry; // 기병
    }
    
    return infantry; // 기본 보병
  }
  
  // ===== 머티리얼 관리 =====
  
  private getOrCreateMaterial(color: string): THREE.MeshStandardMaterial {
    if (this.materialCache.has(color)) {
      return this.materialCache.get(color)!;
    }
    
    const material = new THREE.MeshStandardMaterial({
      color: new THREE.Color(color),
      roughness: 0.7,
      metalness: 0.1,
    });
    
    this.materialCache.set(color, material);
    
    return material;
  }
  
  // ===== 위치 업데이트 =====
  
  /**
   * 모든 병사 위치 업데이트 (하이브리드 LOD)
   */
  updateAllPositions(soldiers: TWSoldier[], squads: TWSquad[]): void {
    // 프러스텀 매트릭스 업데이트
    this.camera.updateMatrixWorld();
    this.projScreenMatrix.multiplyMatrices(
      this.camera.projectionMatrix,
      this.camera.matrixWorldInverse
    );
    this.frustum.setFromProjectionMatrix(this.projScreenMatrix);
    
    // 카메라 위치
    const cameraPos = this.camera.position;
    
    // LOD별 인스턴스 카운터 초기화
    const lodCounts = new Map<string, { medium: number; low: number }>();
    
    // 근거리 복셀 모델 사용 추적
    const nearSoldiers = new Map<string, { soldier: TWSoldier; squad: TWSquad }[]>();
    
    for (const [typeKey, data] of this.unitTypeData) {
      lodCounts.set(typeKey, { medium: 0, low: 0 });
      nearSoldiers.set(typeKey, []);
      
      // 기존 활성 복셀 모델 초기화 (모두 숨김)
      for (const model of data.activeVoxelModels.values()) {
        model.visible = false;
      }
    }
    
    // 각 병사별로 LOD 결정
    let instancesRendered = 0;
    let voxelModelsUsed = 0;
    
    for (const soldier of soldiers) {
      if (soldier.state === 'dead') continue;
      
      const squad = squads.find(s => s.id === soldier.squadId);
      if (!squad) continue;
      
      const typeKey = `${squad.unitTypeId}-${squad.teamId}`;
      const data = this.unitTypeData.get(typeKey);
      if (!data) continue;
      
      const counts = lodCounts.get(typeKey)!;
      
      // 카메라와의 거리 계산
      this.tempPosition.set(soldier.position.x, 0.5, soldier.position.z);
      const distance = cameraPos.distanceTo(this.tempPosition);
      
      // LOD 결정
      if (distance < LOD_DISTANCES.high) {
        // 근거리: 상세 복셀 모델 사용
        nearSoldiers.get(typeKey)!.push({ soldier, squad });
      } else if (distance < LOD_DISTANCES.medium) {
        // 중거리: InstancedMesh
        const instanceIndex = counts.medium++;
        if (data.mediumLOD && instanceIndex < data.maxInstances) {
          this.tempPosition.set(soldier.position.x, 0, soldier.position.z);
          this.tempEuler.set(0, soldier.facing, 0);
          this.tempQuaternion.setFromEuler(this.tempEuler);
          this.tempMatrix.compose(this.tempPosition, this.tempQuaternion, this.tempScale);
          data.mediumLOD.setMatrixAt(instanceIndex, this.tempMatrix);
          instancesRendered++;
        }
      } else {
        // 원거리: InstancedMesh
        const instanceIndex = counts.low++;
        if (data.lowLOD && instanceIndex < data.maxInstances) {
          this.tempPosition.set(soldier.position.x, 0, soldier.position.z);
          this.tempEuler.set(0, soldier.facing, 0);
          this.tempQuaternion.setFromEuler(this.tempEuler);
          this.tempMatrix.compose(this.tempPosition, this.tempQuaternion, this.tempScale);
          data.lowLOD.setMatrixAt(instanceIndex, this.tempMatrix);
          instancesRendered++;
        }
      }
    }
    
    // 근거리 복셀 모델 배치
    for (const [typeKey, soldierList] of nearSoldiers) {
      const data = this.unitTypeData.get(typeKey);
      if (!data) continue;
      
      // 풀에서 모델 할당
      let poolIndex = 0;
      const newActiveModels = new Map<string, THREE.Group>();
      
      for (const { soldier, squad } of soldierList) {
        // 기존에 사용 중인 모델이 있으면 재사용
        let model = data.activeVoxelModels.get(soldier.id);
        
        if (!model && poolIndex < data.voxelModelPool.length) {
          // 풀에서 새 모델 할당
          model = data.voxelModelPool[poolIndex++];
        }
        
        if (model) {
          // 위치 및 회전 설정
          model.position.set(soldier.position.x, 0, soldier.position.z);
          model.rotation.y = soldier.facing;
          model.visible = true;
          newActiveModels.set(soldier.id, model);
          voxelModelsUsed++;
          instancesRendered++;
        }
      }
      
      // 활성 모델 맵 업데이트
      data.activeVoxelModels = newActiveModels;
    }
    
    // 인스턴스 카운트 업데이트 및 행렬 업데이트 플래그 설정
    for (const [typeKey, data] of this.unitTypeData) {
      const counts = lodCounts.get(typeKey)!;
      
      if (data.mediumLOD) {
        data.mediumLOD.count = counts.medium;
        if (counts.medium > 0) {
          data.mediumLOD.instanceMatrix.needsUpdate = true;
        }
        data.mediumLOD.visible = counts.medium > 0;
      }
      
      if (data.lowLOD) {
        data.lowLOD.count = counts.low;
        if (counts.low > 0) {
          data.lowLOD.instanceMatrix.needsUpdate = true;
        }
        data.lowLOD.visible = counts.low > 0;
      }
    }
    
    // 메트릭 업데이트
    this.metrics.instancesRendered = instancesRendered;
    this.metrics.instancesCulled = 0;
    this.metrics.drawCalls = this.countActiveMeshes() + voxelModelsUsed;
    this.metrics.lastUpdateTime = performance.now();
  }
  
  /**
   * 단일 병사 위치 업데이트 (최적화된 버전)
   * 주의: 하이브리드 LOD에서는 updateAllPositions 사용 권장
   */
  updateSoldierPosition(soldier: TWSoldier, squad: TWSquad): void {
    const typeKey = `${squad.unitTypeId}-${squad.teamId}`;
    const data = this.unitTypeData.get(typeKey);
    if (!data) return;
    
    // 거리 기반 LOD 결정
    const cameraPos = this.camera.position;
    this.tempPosition.set(soldier.position.x, 0.5, soldier.position.z);
    const distance = cameraPos.distanceTo(this.tempPosition);
    
    if (distance < LOD_DISTANCES.high) {
      // 근거리: 복셀 모델 위치 업데이트
      const model = data.activeVoxelModels.get(soldier.id);
      if (model) {
        model.position.set(soldier.position.x, 0, soldier.position.z);
        model.rotation.y = soldier.facing;
      }
    } else {
      // 중/원거리: InstancedMesh 업데이트
      const instanceIndex = data.instanceIndexMap.get(soldier.id);
      if (instanceIndex === undefined) return;
      
      let targetMesh: THREE.InstancedMesh | null = null;
      if (distance < LOD_DISTANCES.medium) {
        targetMesh = data.mediumLOD;
      } else {
        targetMesh = data.lowLOD;
      }
      
      if (!targetMesh) return;
      
      // 매트릭스 업데이트
      this.tempPosition.set(soldier.position.x, 0, soldier.position.z);
      this.tempEuler.set(0, soldier.facing, 0);
      this.tempQuaternion.setFromEuler(this.tempEuler);
      this.tempMatrix.compose(this.tempPosition, this.tempQuaternion, this.tempScale);
      
      targetMesh.setMatrixAt(instanceIndex, this.tempMatrix);
      targetMesh.instanceMatrix.needsUpdate = true;
    }
  }
  
  // ===== 병사 제거 =====
  
  /**
   * 죽은 병사를 인스턴스에서 제거 (페이드 아웃 후)
   */
  removeSoldier(soldierId: string, squad: TWSquad): void {
    const typeKey = `${squad.unitTypeId}-${squad.teamId}`;
    const data = this.unitTypeData.get(typeKey);
    if (!data) return;
    
    // 인덱스 매핑에서 제거
    data.instanceIndexMap.delete(soldierId);
    
    // 참고: 실제로는 다음 updateAllPositions 호출 시 자동으로 정리됨
  }
  
  // ===== 유틸리티 =====
  
  private countActiveMeshes(): number {
    let count = 0;
    for (const data of this.unitTypeData.values()) {
      // 근거리 복셀 모델은 updateAllPositions에서 별도 카운트
      if (data.mediumLOD && data.mediumLOD.visible && data.mediumLOD.count > 0) count++;
      if (data.lowLOD && data.lowLOD.visible && data.lowLOD.count > 0) count++;
    }
    return count;
  }
  
  /**
   * 성능 메트릭 조회
   */
  getMetrics(): typeof this.metrics {
    return { ...this.metrics };
  }
  
  /**
   * 리소스 정리
   */
  dispose(): void {
    // InstancedMesh 및 복셀 모델 제거
    for (const data of this.unitTypeData.values()) {
      // 복셀 모델 풀 정리
      for (const model of data.voxelModelPool) {
        this.scene.remove(model);
        model.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.geometry?.dispose();
            if (child.material instanceof THREE.Material) {
              child.material.dispose();
            }
          }
        });
      }
      
      // InstancedMesh 정리
      if (data.mediumLOD) {
        this.scene.remove(data.mediumLOD);
        data.mediumLOD.dispose();
      }
      if (data.lowLOD) {
        this.scene.remove(data.lowLOD);
        data.lowLOD.dispose();
      }
    }
    
    // 캐시 정리
    for (const geometry of this.geometryCache.values()) {
      geometry.dispose();
    }
    for (const material of this.materialCache.values()) {
      material.dispose();
    }
    
    this.unitTypeData.clear();
    this.geometryCache.clear();
    this.materialCache.clear();
  }
}

// ===== 유틸리티 함수 =====

/**
 * 부대 마커 생성 (기존 방식 유지)
 */
export function createSquadMarker(squad: TWSquad): THREE.Group {
  const markerGroup = new THREE.Group();
  
  const flagPoleGeometry = new THREE.CylinderGeometry(0.08, 0.08, 4, 8);
  const flagPoleMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
  const flagPole = new THREE.Mesh(flagPoleGeometry, flagPoleMaterial);
  flagPole.position.y = 2;
  markerGroup.add(flagPole);
  
  const flagGeometry = new THREE.PlaneGeometry(2.5, 1.5);
  const flagColor = squad.teamId === 'attacker' ? 0x2F4F4F : 0x8B0000;
  const flagMaterial = new THREE.MeshStandardMaterial({ 
    color: flagColor, 
    side: THREE.DoubleSide 
  });
  const flag = new THREE.Mesh(flagGeometry, flagMaterial);
  flag.position.set(1.25, 3.25, 0);
  markerGroup.add(flag);
  
  // 방향 화살표
  const arrowShape = new THREE.Shape();
  arrowShape.moveTo(0, 1.5);
  arrowShape.lineTo(-0.75, 0);
  arrowShape.lineTo(0.75, 0);
  arrowShape.closePath();
  
  const arrowGeometry = new THREE.ShapeGeometry(arrowShape);
  const arrowMaterial = new THREE.MeshBasicMaterial({ 
    color: flagColor, 
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.6,
  });
  const arrow = new THREE.Mesh(arrowGeometry, arrowMaterial);
  arrow.rotation.x = -Math.PI / 2;
  arrow.position.y = 0.1;
  arrow.scale.set(1.5, 1.5, 1.5);
  markerGroup.add(arrow);
  
  markerGroup.position.set(squad.position.x, 0, squad.position.z);
  markerGroup.rotation.y = squad.facing;
  
  return markerGroup;
}

