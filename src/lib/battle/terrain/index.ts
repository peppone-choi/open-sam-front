/**
 * terrain/index.ts
 * 지형 시스템 모듈 통합 내보내기
 * 
 * 복셀 전투용 3D 지형 시스템의 모든 컴포넌트를 제공합니다.
 */

// ========================================
// TerrainGenerator - 메인 지형 생성기
// ========================================
export {
  TerrainGenerator,
  createTerrainGenerator,
  createBattlefieldTerrain,
  // 타입
  type TerrainType,
  type TerrainConfig,
  type TerrainTextureConfig,
  type TerrainChunk,
  // 상수
  TERRAIN_SPEED_MODIFIER,
  TERRAIN_DEFENSE_MODIFIER,
  TERRAIN_COLORS,
  TERRAIN_HEIGHT_SCALE,
} from './TerrainGenerator';

// ========================================
// HeightMap - 높이맵 처리
// ========================================
export {
  HeightMap,
  createHeightMap,
  createFlatHeightMap,
  createProceduralHeightMap,
  // 타입
  type HeightMapConfig,
  type NoiseConfig,
} from './HeightMap';

// ========================================
// TerrainFeatures - 지형 요소 (나무, 바위 등)
// ========================================
export {
  TerrainFeatures,
  createTerrainFeatures,
  // 타입
  type FeatureType,
  type TerrainFeatureConfig,
  type Obstacle,
} from './TerrainFeatures';

// ========================================
// WaterRenderer - 물/강 렌더링
// ========================================
export {
  WaterRenderer,
  createWaterRenderer,
  createRiverConfig,
  createSwampConfig,
  createLakeConfig,
  // 타입
  type WaterConfig,
} from './WaterRenderer';

// ========================================
// NavMesh - 네비게이션 메시
// ========================================
export {
  NavMesh,
  createNavMesh,
  createInfantryNavMesh,
  createCavalryNavMesh,
  // 타입
  type NavNode,
  type PathResult,
  type NavMeshConfig,
} from './NavMesh';

// ========================================
// 통합 지형 시스템 클래스
// ========================================

import * as THREE from 'three';
import { TerrainGenerator, type TerrainConfig } from './TerrainGenerator';
import { NavMesh, type NavMeshConfig } from './NavMesh';

/**
 * 통합 지형 시스템
 * TerrainGenerator와 NavMesh를 함께 관리합니다.
 */
export class TerrainSystem {
  private scene: THREE.Scene;
  private generator: TerrainGenerator | null = null;
  private navMesh: NavMesh | null = null;
  private navMeshInfantry: NavMesh | null = null;
  private navMeshCavalry: NavMesh | null = null;
  
  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }
  
  /**
   * 지형 생성
   */
  async generateTerrain(config: TerrainConfig): Promise<TerrainGenerator> {
    // 기존 지형 정리
    this.dispose();
    
    // 새 지형 생성
    this.generator = new TerrainGenerator(this.scene, config);
    await this.generator.generate();
    
    // NavMesh 생성
    this.generateNavMeshes(config);
    
    return this.generator;
  }
  
  /**
   * NavMesh 생성 (보병/기병 분리)
   */
  private generateNavMeshes(config: TerrainConfig): void {
    if (!this.generator) return;
    
    const heightMap = this.generator.getHeightMap();
    const features = this.generator.getFeatures();
    
    // 보병용 NavMesh
    this.navMeshInfantry = new NavMesh(config, {
      cellSize: 2,
      agentRadius: 0.5,
      maxSlope: 0.6,
      maxStepHeight: 1.5,
      allowDiagonal: true,
      cavalryMode: false,
    });
    this.navMeshInfantry.generate(heightMap, features);
    
    // 기병용 NavMesh
    this.navMeshCavalry = new NavMesh(config, {
      cellSize: 3,
      agentRadius: 1.0,
      maxSlope: 0.4,
      maxStepHeight: 1.0,
      allowDiagonal: true,
      cavalryMode: true,
    });
    this.navMeshCavalry.generate(heightMap, features);
    
    // 기본 NavMesh는 보병용
    this.navMesh = this.navMeshInfantry;
  }
  
  /**
   * 경로 탐색
   */
  findPath(
    startX: number,
    startZ: number,
    endX: number,
    endZ: number,
    isCavalry: boolean = false
  ): import('./NavMesh').PathResult | null {
    const mesh = isCavalry ? this.navMeshCavalry : this.navMeshInfantry;
    return mesh?.findPath(startX, startZ, endX, endZ) ?? null;
  }
  
  /**
   * 특정 위치의 높이 조회
   */
  getHeightAt(x: number, z: number): number {
    return this.generator?.getHeightAt(x, z) ?? 0;
  }
  
  /**
   * 특정 위치의 이동 속도 보정치 조회
   */
  getSpeedModifierAt(x: number, z: number): number {
    return this.generator?.getSpeedModifierAt(x, z) ?? 1;
  }
  
  /**
   * 특정 위치의 방어 보정치 조회
   */
  getDefenseModifierAt(x: number, z: number): number {
    return this.generator?.getDefenseModifierAt(x, z) ?? 1;
  }
  
  /**
   * 특정 위치가 통과 가능한지 확인
   */
  isWalkable(x: number, z: number, isCavalry: boolean = false): boolean {
    const mesh = isCavalry ? this.navMeshCavalry : this.navMeshInfantry;
    return mesh?.isWalkable(x, z) ?? false;
  }
  
  /**
   * 충돌 검사
   */
  checkCollision(position: THREE.Vector3, radius: number): import('./TerrainFeatures').Obstacle | null {
    return this.generator?.getFeatures().checkCollision(position, radius) ?? null;
  }
  
  /**
   * 가장 가까운 엄폐물 찾기
   */
  findNearestCover(position: THREE.Vector3, maxDistance?: number): import('./TerrainFeatures').Obstacle | null {
    return this.generator?.getFeatures().findNearestCover(position, maxDistance) ?? null;
  }
  
  /**
   * 업데이트 (애니메이션)
   */
  update(deltaTime: number): void {
    this.generator?.update(deltaTime);
  }
  
  /**
   * 지형 생성기 반환
   */
  getGenerator(): TerrainGenerator | null {
    return this.generator;
  }
  
  /**
   * NavMesh 반환
   */
  getNavMesh(isCavalry: boolean = false): NavMesh | null {
    return isCavalry ? this.navMeshCavalry : this.navMeshInfantry;
  }
  
  /**
   * 디버그 메시 생성
   */
  createDebugMesh(isCavalry: boolean = false): THREE.Group | null {
    const mesh = isCavalry ? this.navMeshCavalry : this.navMeshInfantry;
    return mesh?.createDebugMesh() ?? null;
  }
  
  /**
   * 리소스 해제
   */
  dispose(): void {
    this.generator?.dispose();
    this.navMeshInfantry?.dispose();
    this.navMeshCavalry?.dispose();
    
    this.generator = null;
    this.navMesh = null;
    this.navMeshInfantry = null;
    this.navMeshCavalry = null;
  }
}

/**
 * 통합 지형 시스템 생성
 */
export function createTerrainSystem(scene: THREE.Scene): TerrainSystem {
  return new TerrainSystem(scene);
}





