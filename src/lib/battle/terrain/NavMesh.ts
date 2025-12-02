/**
 * NavMesh.ts
 * 네비게이션 메시 및 경로 탐색 시스템
 * 
 * 주요 기능:
 * 1. 네비게이션 메시 생성
 * 2. 통과 가능 영역 계산
 * 3. A* 경로 탐색
 * 4. 장애물 회피
 */

import * as THREE from 'three';
import type { HeightMap } from './HeightMap';
import type { TerrainFeatures, Obstacle } from './TerrainFeatures';
import type { TerrainConfig, TerrainType } from './TerrainGenerator';

// ========================================
// 타입 정의
// ========================================

/** 네비게이션 노드 */
export interface NavNode {
  /** 노드 ID */
  id: number;
  /** 그리드 X 좌표 */
  gridX: number;
  /** 그리드 Z 좌표 */
  gridZ: number;
  /** 월드 X 좌표 */
  worldX: number;
  /** 월드 Z 좌표 */
  worldZ: number;
  /** 높이 */
  height: number;
  /** 통과 가능 여부 */
  walkable: boolean;
  /** 이동 비용 (1 = 기본) */
  moveCost: number;
  /** 인접 노드 ID 목록 */
  neighbors: number[];
  /** 지형 타입 */
  terrainType: TerrainType;
}

/** 경로 탐색 결과 */
export interface PathResult {
  /** 성공 여부 */
  found: boolean;
  /** 경로 노드 목록 */
  path: NavNode[];
  /** 월드 좌표 경로 */
  worldPath: THREE.Vector3[];
  /** 총 비용 */
  totalCost: number;
  /** 탐색에 걸린 시간 (ms) */
  searchTime: number;
}

/** A* 노드 데이터 */
interface AStarNode {
  id: number;
  gCost: number; // 시작점에서 이 노드까지의 비용
  hCost: number; // 이 노드에서 목표까지의 예상 비용
  fCost: number; // gCost + hCost
  parent: number | null;
}

/** 네비게이션 메시 설정 */
export interface NavMeshConfig {
  /** 그리드 셀 크기 */
  cellSize: number;
  /** 에이전트 반경 */
  agentRadius: number;
  /** 최대 경사 */
  maxSlope: number;
  /** 최대 점프 높이 */
  maxStepHeight: number;
  /** 대각선 이동 허용 */
  allowDiagonal: boolean;
  /** 기병 모드 (습지 등 통과 불가) */
  cavalryMode?: boolean;
}

// ========================================
// 메인 클래스
// ========================================

export class NavMesh {
  private config: NavMeshConfig;
  private width: number;
  private depth: number;
  
  // 그리드 데이터
  private nodes: Map<number, NavNode> = new Map();
  private gridWidth: number = 0;
  private gridDepth: number = 0;
  
  // 동적 장애물
  private dynamicObstacles: Set<string> = new Set();
  
  // 캐시
  private pathCache: Map<string, PathResult> = new Map();
  private cacheTimeout: number = 1000; // 캐시 유효 시간 (ms)
  private lastCacheTime: number = 0;
  
  constructor(
    terrainConfig: TerrainConfig,
    config: Partial<NavMeshConfig> = {}
  ) {
    this.width = terrainConfig.width;
    this.depth = terrainConfig.depth;
    
    this.config = {
      cellSize: config.cellSize ?? 2,
      agentRadius: config.agentRadius ?? 0.5,
      maxSlope: config.maxSlope ?? 0.5,
      maxStepHeight: config.maxStepHeight ?? 1.0,
      allowDiagonal: config.allowDiagonal ?? true,
      cavalryMode: config.cavalryMode ?? false,
    };
    
    this.gridWidth = Math.ceil(this.width / this.config.cellSize);
    this.gridDepth = Math.ceil(this.depth / this.config.cellSize);
  }
  
  // ========================================
  // 네비게이션 메시 생성
  // ========================================
  
  /**
   * 네비게이션 메시 생성
   */
  generate(heightMap: HeightMap, features?: TerrainFeatures): void {
    console.log(`🗺️ NavMesh 생성 시작: ${this.gridWidth}x${this.gridDepth}`);
    const startTime = Date.now();
    
    this.nodes.clear();
    
    // 1. 노드 생성
    this.createNodes(heightMap);
    
    // 2. 장애물 적용
    if (features) {
      this.applyObstacles(features.getBlockingObstacles());
    }
    
    // 3. 인접 노드 연결
    this.connectNeighbors();
    
    // 4. 경사면 기반 통과 가능성 업데이트
    this.updateWalkabilityBySlope(heightMap);
    
    const elapsed = Date.now() - startTime;
    console.log(`✅ NavMesh 생성 완료: ${this.nodes.size}개 노드, ${elapsed}ms`);
  }
  
  /**
   * 노드 생성
   */
  private createNodes(heightMap: HeightMap): void {
    let id = 0;
    
    for (let gz = 0; gz < this.gridDepth; gz++) {
      for (let gx = 0; gx < this.gridWidth; gx++) {
        // 월드 좌표 계산
        const worldX = (gx + 0.5) * this.config.cellSize - this.width / 2;
        const worldZ = (gz + 0.5) * this.config.cellSize - this.depth / 2;
        
        // 높이 조회
        const height = heightMap.getHeightAt(
          worldX + this.width / 2,
          worldZ + this.depth / 2
        );
        
        // 기본 통과 가능성 (물 등 낮은 지역은 통과 불가)
        let walkable = true;
        let moveCost = 1.0;
        let terrainType: TerrainType = 'plains';
        
        // 높이 기반 판단
        if (height < -0.3) {
          walkable = !this.config.cavalryMode; // 기병은 물 통과 불가
          moveCost = 3.0; // 물은 느림
          terrainType = 'river';
        } else if (height < 0) {
          walkable = !this.config.cavalryMode;
          moveCost = 2.5;
          terrainType = 'swamp';
        } else if (height > 8) {
          walkable = false; // 너무 높은 곳은 통과 불가
          terrainType = 'mountain';
        } else if (height > 3) {
          moveCost = 1.5;
          terrainType = 'forest';
        }
        
        const node: NavNode = {
          id,
          gridX: gx,
          gridZ: gz,
          worldX,
          worldZ,
          height,
          walkable,
          moveCost,
          neighbors: [],
          terrainType,
        };
        
        this.nodes.set(id, node);
        id++;
      }
    }
  }
  
  /**
   * 장애물 적용
   */
  private applyObstacles(obstacles: Obstacle[]): void {
    for (const obstacle of obstacles) {
      if (!obstacle.blocking) continue;
      
      // 장애물 바운딩 박스와 겹치는 노드 찾기
      const minX = obstacle.bounds.min.x;
      const maxX = obstacle.bounds.max.x;
      const minZ = obstacle.bounds.min.z;
      const maxZ = obstacle.bounds.max.z;
      
      // 에이전트 반경 고려
      const padding = this.config.agentRadius;
      
      this.nodes.forEach(node => {
        if (node.worldX > minX - padding && node.worldX < maxX + padding &&
            node.worldZ > minZ - padding && node.worldZ < maxZ + padding) {
          node.walkable = false;
        }
      });
    }
  }
  
  /**
   * 인접 노드 연결
   */
  private connectNeighbors(): void {
    const directions = this.config.allowDiagonal
      ? [
          [-1, -1], [0, -1], [1, -1],
          [-1,  0],          [1,  0],
          [-1,  1], [0,  1], [1,  1],
        ]
      : [
          [0, -1],
          [-1, 0], [1, 0],
          [0, 1],
        ];
    
    this.nodes.forEach(node => {
      if (!node.walkable) return;
      
      for (const [dx, dz] of directions) {
        const nx = node.gridX + dx;
        const nz = node.gridZ + dz;
        
        if (nx < 0 || nx >= this.gridWidth || nz < 0 || nz >= this.gridDepth) {
          continue;
        }
        
        const neighborId = nz * this.gridWidth + nx;
        const neighbor = this.nodes.get(neighborId);
        
        if (neighbor && neighbor.walkable) {
          // 높이 차이 체크
          const heightDiff = Math.abs(neighbor.height - node.height);
          if (heightDiff <= this.config.maxStepHeight) {
            node.neighbors.push(neighborId);
          }
        }
      }
    });
  }
  
  /**
   * 경사면 기반 통과 가능성 업데이트
   */
  private updateWalkabilityBySlope(heightMap: HeightMap): void {
    this.nodes.forEach(node => {
      if (!node.walkable) return;
      
      const slope = heightMap.getSlopeAt(
        node.worldX + this.width / 2,
        node.worldZ + this.depth / 2
      );
      
      if (slope > this.config.maxSlope) {
        node.walkable = false;
      } else if (slope > this.config.maxSlope * 0.7) {
        // 급경사는 이동 비용 증가
        node.moveCost *= 1 + (slope / this.config.maxSlope);
      }
    });
  }
  
  // ========================================
  // 경로 탐색 (A* 알고리즘)
  // ========================================
  
  /**
   * 경로 탐색
   */
  findPath(
    startX: number,
    startZ: number,
    endX: number,
    endZ: number
  ): PathResult {
    const startTime = Date.now();
    
    // 캐시 체크
    const cacheKey = `${startX.toFixed(1)},${startZ.toFixed(1)}-${endX.toFixed(1)},${endZ.toFixed(1)}`;
    if (Date.now() - this.lastCacheTime < this.cacheTimeout) {
      const cached = this.pathCache.get(cacheKey);
      if (cached) return cached;
    } else {
      this.pathCache.clear();
      this.lastCacheTime = Date.now();
    }
    
    // 시작/끝 노드 찾기
    const startNode = this.getNodeAt(startX, startZ);
    const endNode = this.getNodeAt(endX, endZ);
    
    if (!startNode || !endNode) {
      return this.createEmptyResult(startTime);
    }
    
    if (!startNode.walkable || !endNode.walkable) {
      // 가장 가까운 통과 가능 노드 찾기
      const nearestEnd = this.findNearestWalkable(endX, endZ);
      if (nearestEnd && nearestEnd.id !== endNode.id) {
        return this.findPath(startX, startZ, nearestEnd.worldX, nearestEnd.worldZ);
      }
      return this.createEmptyResult(startTime);
    }
    
    if (startNode.id === endNode.id) {
      return {
        found: true,
        path: [startNode],
        worldPath: [new THREE.Vector3(startX, startNode.height, startZ)],
        totalCost: 0,
        searchTime: Date.now() - startTime,
      };
    }
    
    // A* 알고리즘
    const openSet: Map<number, AStarNode> = new Map();
    const closedSet: Set<number> = new Set();
    
    // 시작 노드
    openSet.set(startNode.id, {
      id: startNode.id,
      gCost: 0,
      hCost: this.heuristic(startNode, endNode),
      fCost: this.heuristic(startNode, endNode),
      parent: null,
    });
    
    while (openSet.size > 0) {
      // 가장 낮은 fCost 노드 선택
      let current: AStarNode | null = null;
      let lowestFCost = Infinity;
      
      openSet.forEach(node => {
        if (node.fCost < lowestFCost) {
          lowestFCost = node.fCost;
          current = node;
        }
      });
      
      if (!current) break;
      
      // 목표 도달
      if (current.id === endNode.id) {
        const result = this.reconstructPath(current, startTime);
        this.pathCache.set(cacheKey, result);
        return result;
      }
      
      openSet.delete(current.id);
      closedSet.add(current.id);
      
      // 이웃 노드 탐색
      const currentNavNode = this.nodes.get(current.id)!;
      
      for (const neighborId of currentNavNode.neighbors) {
        if (closedSet.has(neighborId)) continue;
        
        // 동적 장애물 체크
        if (this.dynamicObstacles.has(neighborId.toString())) continue;
        
        const neighborNavNode = this.nodes.get(neighborId)!;
        if (!neighborNavNode.walkable) continue;
        
        // 이동 비용 계산
        const isDiagonal = 
          Math.abs(neighborNavNode.gridX - currentNavNode.gridX) === 1 &&
          Math.abs(neighborNavNode.gridZ - currentNavNode.gridZ) === 1;
        
        const moveCost = isDiagonal ? 1.414 : 1.0;
        const gCost = current.gCost + moveCost * neighborNavNode.moveCost;
        
        const existing = openSet.get(neighborId);
        
        if (!existing || gCost < existing.gCost) {
          const hCost = this.heuristic(neighborNavNode, endNode);
          
          openSet.set(neighborId, {
            id: neighborId,
            gCost,
            hCost,
            fCost: gCost + hCost,
            parent: current.id,
          });
        }
      }
    }
    
    // 경로를 찾지 못함
    return this.createEmptyResult(startTime);
  }
  
  /**
   * 휴리스틱 함수 (맨해튼 거리 + 유클리드 거리)
   */
  private heuristic(from: NavNode, to: NavNode): number {
    const dx = Math.abs(from.worldX - to.worldX);
    const dz = Math.abs(from.worldZ - to.worldZ);
    
    // 대각선 허용 시 유클리드 거리
    if (this.config.allowDiagonal) {
      return Math.sqrt(dx * dx + dz * dz);
    }
    
    // 맨해튼 거리
    return dx + dz;
  }
  
  /**
   * 경로 재구성
   */
  private reconstructPath(endNode: AStarNode, startTime: number): PathResult {
    const path: NavNode[] = [];
    const worldPath: THREE.Vector3[] = [];
    let totalCost = endNode.gCost;
    
    // 역추적
    const visited = new Map<number, AStarNode>();
    let current: AStarNode | null = endNode;
    
    // openSet/closedSet에서 모든 노드 정보 수집 필요
    // 여기서는 간단히 노드 데이터만 사용
    while (current) {
      const navNode = this.nodes.get(current.id);
      if (navNode) {
        path.unshift(navNode);
        worldPath.unshift(new THREE.Vector3(
          navNode.worldX,
          navNode.height,
          navNode.worldZ
        ));
      }
      
      if (current.parent !== null) {
        current = visited.get(current.parent) || null;
      } else {
        break;
      }
    }
    
    // 경로 스무딩
    const smoothedPath = this.smoothPath(worldPath);
    
    return {
      found: true,
      path,
      worldPath: smoothedPath,
      totalCost,
      searchTime: Date.now() - startTime,
    };
  }
  
  /**
   * 빈 결과 생성
   */
  private createEmptyResult(startTime: number): PathResult {
    return {
      found: false,
      path: [],
      worldPath: [],
      totalCost: 0,
      searchTime: Date.now() - startTime,
    };
  }
  
  /**
   * 경로 스무딩 (불필요한 웨이포인트 제거)
   */
  private smoothPath(path: THREE.Vector3[]): THREE.Vector3[] {
    if (path.length <= 2) return path;
    
    const smoothed: THREE.Vector3[] = [path[0]];
    let current = 0;
    
    while (current < path.length - 1) {
      let furthest = current + 1;
      
      // 직선으로 갈 수 있는 가장 먼 지점 찾기
      for (let i = current + 2; i < path.length; i++) {
        if (this.hasLineOfSight(path[current], path[i])) {
          furthest = i;
        }
      }
      
      smoothed.push(path[furthest]);
      current = furthest;
    }
    
    return smoothed;
  }
  
  /**
   * 두 점 사이 직선 시야 체크
   */
  private hasLineOfSight(from: THREE.Vector3, to: THREE.Vector3): boolean {
    const dx = to.x - from.x;
    const dz = to.z - from.z;
    const distance = Math.sqrt(dx * dx + dz * dz);
    const steps = Math.ceil(distance / (this.config.cellSize * 0.5));
    
    for (let i = 1; i < steps; i++) {
      const t = i / steps;
      const x = from.x + dx * t;
      const z = from.z + dz * t;
      
      const node = this.getNodeAt(x, z);
      if (!node || !node.walkable) {
        return false;
      }
    }
    
    return true;
  }
  
  // ========================================
  // 노드 쿼리
  // ========================================
  
  /**
   * 월드 좌표에서 노드 조회
   */
  getNodeAt(worldX: number, worldZ: number): NavNode | null {
    const gx = Math.floor((worldX + this.width / 2) / this.config.cellSize);
    const gz = Math.floor((worldZ + this.depth / 2) / this.config.cellSize);
    
    if (gx < 0 || gx >= this.gridWidth || gz < 0 || gz >= this.gridDepth) {
      return null;
    }
    
    const id = gz * this.gridWidth + gx;
    return this.nodes.get(id) || null;
  }
  
  /**
   * 가장 가까운 통과 가능 노드 찾기
   */
  findNearestWalkable(worldX: number, worldZ: number, maxRadius: number = 20): NavNode | null {
    let nearest: NavNode | null = null;
    let nearestDist = Infinity;
    
    const searchRadius = Math.ceil(maxRadius / this.config.cellSize);
    const centerGx = Math.floor((worldX + this.width / 2) / this.config.cellSize);
    const centerGz = Math.floor((worldZ + this.depth / 2) / this.config.cellSize);
    
    for (let dz = -searchRadius; dz <= searchRadius; dz++) {
      for (let dx = -searchRadius; dx <= searchRadius; dx++) {
        const gx = centerGx + dx;
        const gz = centerGz + dz;
        
        if (gx < 0 || gx >= this.gridWidth || gz < 0 || gz >= this.gridDepth) {
          continue;
        }
        
        const id = gz * this.gridWidth + gx;
        const node = this.nodes.get(id);
        
        if (node && node.walkable) {
          const dist = Math.sqrt(
            (node.worldX - worldX) ** 2 + (node.worldZ - worldZ) ** 2
          );
          
          if (dist < nearestDist) {
            nearestDist = dist;
            nearest = node;
          }
        }
      }
    }
    
    return nearest;
  }
  
  /**
   * 특정 위치가 통과 가능한지 확인
   */
  isWalkable(worldX: number, worldZ: number): boolean {
    const node = this.getNodeAt(worldX, worldZ);
    return node?.walkable ?? false;
  }
  
  /**
   * 특정 위치의 이동 비용 조회
   */
  getMoveCost(worldX: number, worldZ: number): number {
    const node = this.getNodeAt(worldX, worldZ);
    return node?.moveCost ?? Infinity;
  }
  
  // ========================================
  // 동적 장애물
  // ========================================
  
  /**
   * 동적 장애물 추가
   */
  addDynamicObstacle(worldX: number, worldZ: number, radius: number): string[] {
    const affectedIds: string[] = [];
    const gridRadius = Math.ceil(radius / this.config.cellSize);
    
    const centerGx = Math.floor((worldX + this.width / 2) / this.config.cellSize);
    const centerGz = Math.floor((worldZ + this.depth / 2) / this.config.cellSize);
    
    for (let dz = -gridRadius; dz <= gridRadius; dz++) {
      for (let dx = -gridRadius; dx <= gridRadius; dx++) {
        const gx = centerGx + dx;
        const gz = centerGz + dz;
        
        if (gx < 0 || gx >= this.gridWidth || gz < 0 || gz >= this.gridDepth) {
          continue;
        }
        
        const id = gz * this.gridWidth + gx;
        const node = this.nodes.get(id);
        
        if (node) {
          const dist = Math.sqrt(
            (node.worldX - worldX) ** 2 + (node.worldZ - worldZ) ** 2
          );
          
          if (dist <= radius) {
            this.dynamicObstacles.add(id.toString());
            affectedIds.push(id.toString());
          }
        }
      }
    }
    
    // 캐시 무효화
    this.pathCache.clear();
    
    return affectedIds;
  }
  
  /**
   * 동적 장애물 제거
   */
  removeDynamicObstacle(ids: string[]): void {
    for (const id of ids) {
      this.dynamicObstacles.delete(id);
    }
    this.pathCache.clear();
  }
  
  /**
   * 모든 동적 장애물 제거
   */
  clearDynamicObstacles(): void {
    this.dynamicObstacles.clear();
    this.pathCache.clear();
  }
  
  // ========================================
  // 디버그 시각화
  // ========================================
  
  /**
   * 디버그 메시 생성
   */
  createDebugMesh(): THREE.Group {
    const group = new THREE.Group();
    group.name = 'navmesh-debug';
    
    // 통과 가능/불가 노드 시각화
    const walkableGeometry = new THREE.PlaneGeometry(
      this.config.cellSize * 0.8,
      this.config.cellSize * 0.8
    );
    
    const walkableMaterial = new THREE.MeshBasicMaterial({
      color: 0x00ff00,
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide,
    });
    
    const unwalkableMaterial = new THREE.MeshBasicMaterial({
      color: 0xff0000,
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide,
    });
    
    this.nodes.forEach(node => {
      const material = node.walkable ? walkableMaterial : unwalkableMaterial;
      const mesh = new THREE.Mesh(walkableGeometry, material);
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.set(node.worldX, node.height + 0.1, node.worldZ);
      group.add(mesh);
    });
    
    return group;
  }
  
  /**
   * 경로 시각화 메시 생성
   */
  createPathMesh(path: THREE.Vector3[]): THREE.Line {
    const points = path.map(p => new THREE.Vector3(p.x, p.y + 0.5, p.z));
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    
    const material = new THREE.LineBasicMaterial({
      color: 0xffff00,
      linewidth: 3,
    });
    
    return new THREE.Line(geometry, material);
  }
  
  // ========================================
  // 유틸리티
  // ========================================
  
  /**
   * 모든 노드 반환
   */
  getAllNodes(): NavNode[] {
    return Array.from(this.nodes.values());
  }
  
  /**
   * 통과 가능 노드만 반환
   */
  getWalkableNodes(): NavNode[] {
    return this.getAllNodes().filter(n => n.walkable);
  }
  
  /**
   * 그리드 크기 반환
   */
  getGridSize(): { width: number; depth: number } {
    return { width: this.gridWidth, depth: this.gridDepth };
  }
  
  /**
   * 설정 반환
   */
  getConfig(): NavMeshConfig {
    return this.config;
  }
  
  /**
   * 캐시 무효화
   */
  invalidateCache(): void {
    this.pathCache.clear();
  }
  
  /**
   * 리소스 해제
   */
  dispose(): void {
    this.nodes.clear();
    this.dynamicObstacles.clear();
    this.pathCache.clear();
  }
}

// ========================================
// 팩토리 함수
// ========================================

/**
 * 네비게이션 메시 생성
 */
export function createNavMesh(
  terrainConfig: TerrainConfig,
  config?: Partial<NavMeshConfig>
): NavMesh {
  return new NavMesh(terrainConfig, config);
}

/**
 * 보병용 NavMesh 생성
 */
export function createInfantryNavMesh(terrainConfig: TerrainConfig): NavMesh {
  return new NavMesh(terrainConfig, {
    cellSize: 2,
    agentRadius: 0.5,
    maxSlope: 0.6,
    maxStepHeight: 1.5,
    allowDiagonal: true,
    cavalryMode: false,
  });
}

/**
 * 기병용 NavMesh 생성
 */
export function createCavalryNavMesh(terrainConfig: TerrainConfig): NavMesh {
  return new NavMesh(terrainConfig, {
    cellSize: 3,
    agentRadius: 1.0,
    maxSlope: 0.4,
    maxStepHeight: 1.0,
    allowDiagonal: true,
    cavalryMode: true,
  });
}





