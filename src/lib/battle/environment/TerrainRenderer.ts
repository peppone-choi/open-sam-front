/**
 * TerrainRenderer.ts
 * Three.js 기반 지형 렌더링 시스템
 * 
 * TerrainSystem과 연동하여 3D 지형을 렌더링합니다.
 */

import * as THREE from 'three';
import {
  TerrainSystem,
  TerrainMap,
  TerrainType,
  TERRAIN_EFFECTS,
  WeatherType,
  WEATHER_EFFECTS,
} from './TerrainSystem';

// ========================================
// 타입 정의
// ========================================

/** 렌더링 모드 */
export type TerrainRenderMode = 
  | 'textured'    // 텍스처 기반
  | 'colored'     // 색상 기반 (기본)
  | 'heightmap'   // 높이 맵 시각화
  | 'debug';      // 디버그 모드 (타입별 색상)

/** 렌더러 옵션 */
export interface TerrainRendererOptions {
  /** 렌더링 모드 */
  mode?: TerrainRenderMode;
  /** 높이 스케일 */
  heightScale?: number;
  /** 셀 디테일 레벨 (1셀당 세그먼트 수) */
  detailLevel?: number;
  /** 물 효과 사용 */
  useWaterEffect?: boolean;
  /** 안개 효과 사용 */
  useFogEffect?: boolean;
  /** 그림자 사용 */
  useShadows?: boolean;
  /** 와이어프레임 표시 */
  showWireframe?: boolean;
  /** 그리드 표시 */
  showGrid?: boolean;
}

/** 날씨 효과 오브젝트 */
interface WeatherEffects {
  rain?: THREE.Points;
  snow?: THREE.Points;
  fog?: THREE.Fog;
  wind?: THREE.Group;
}

// ========================================
// 지형 렌더러 클래스
// ========================================

export class TerrainRenderer {
  private scene: THREE.Scene;
  private terrainSystem: TerrainSystem;
  private options: Required<TerrainRendererOptions>;
  
  // 렌더링 오브젝트
  private terrainMesh: THREE.Mesh | null = null;
  private waterMesh: THREE.Mesh | null = null;
  private gridHelper: THREE.GridHelper | null = null;
  private terrainGroup: THREE.Group;
  
  // 날씨 효과
  private weatherEffects: WeatherEffects = {};
  
  // 지형 타입별 메시 (숲 나무 등)
  private terrainDetails: Map<string, THREE.Group> = new Map();
  
  // 텍스처 (선택적)
  private textures: Map<TerrainType, THREE.Texture> = new Map();
  
  constructor(
    scene: THREE.Scene,
    terrainSystem: TerrainSystem,
    options: TerrainRendererOptions = {}
  ) {
    this.scene = scene;
    this.terrainSystem = terrainSystem;
    
    // 기본 옵션 설정
    this.options = {
      mode: options.mode ?? 'colored',
      heightScale: options.heightScale ?? 1.0,
      detailLevel: options.detailLevel ?? 2,
      useWaterEffect: options.useWaterEffect ?? true,
      useFogEffect: options.useFogEffect ?? true,
      useShadows: options.useShadows ?? true,
      showWireframe: options.showWireframe ?? false,
      showGrid: options.showGrid ?? false,
    };
    
    // 지형 그룹 생성
    this.terrainGroup = new THREE.Group();
    this.terrainGroup.name = 'terrain';
    this.scene.add(this.terrainGroup);
  }
  
  // ========================================
  // 지형 렌더링
  // ========================================
  
  /**
   * 지형 맵 렌더링
   */
  render(): void {
    const map = this.terrainSystem.getMap();
    if (!map) {
      console.warn('TerrainRenderer: No map to render');
      return;
    }
    
    // 기존 렌더링 제거
    this.clear();
    
    // 지형 메시 생성
    this.createTerrainMesh(map);
    
    // 물 효과 (강, 습지)
    if (this.options.useWaterEffect) {
      this.createWaterEffect(map);
    }
    
    // 지형 디테일 (숲 나무 등)
    this.createTerrainDetails(map);
    
    // 그리드 표시
    if (this.options.showGrid) {
      this.createGrid(map);
    }
    
    // 날씨 효과 적용
    this.applyWeatherEffects();
  }
  
  /**
   * 지형 메시 생성
   */
  private createTerrainMesh(map: TerrainMap): void {
    const worldWidth = map.width * map.cellSize;
    const worldHeight = map.height * map.cellSize;
    const segments = map.width * this.options.detailLevel;
    
    // 지형 지오메트리
    const geometry = new THREE.PlaneGeometry(
      worldWidth,
      worldHeight,
      segments - 1,
      segments - 1
    );
    
    // 정점 높이 및 색상 설정
    const positions = geometry.attributes.position;
    const colors = new Float32Array(positions.count * 3);
    
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const z = positions.getY(i); // PlaneGeometry는 XY 평면
      
      // 월드 좌표로 변환 (지형 시스템은 중심이 0,0)
      const worldX = x;
      const worldZ = z;
      
      // 지형 셀 조회
      const cell = this.terrainSystem.getTerrainAt(worldX, worldZ);
      
      if (cell) {
        // 높이 설정
        const height = cell.height * this.options.heightScale;
        positions.setZ(i, height);
        
        // 색상 설정
        const effect = TERRAIN_EFFECTS[cell.type];
        const color = new THREE.Color(effect.color);
        colors[i * 3] = color.r;
        colors[i * 3 + 1] = color.g;
        colors[i * 3 + 2] = color.b;
      } else {
        // 기본값 (평지)
        positions.setZ(i, 0);
        const color = new THREE.Color(TERRAIN_EFFECTS.plains.color);
        colors[i * 3] = color.r;
        colors[i * 3 + 1] = color.g;
        colors[i * 3 + 2] = color.b;
      }
    }
    
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.computeVertexNormals();
    
    // 머티리얼
    const material = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.8,
      metalness: 0.1,
      wireframe: this.options.showWireframe,
      flatShading: this.options.mode === 'debug',
    });
    
    // 메시 생성
    this.terrainMesh = new THREE.Mesh(geometry, material);
    this.terrainMesh.rotation.x = -Math.PI / 2;
    this.terrainMesh.receiveShadow = this.options.useShadows;
    this.terrainMesh.name = 'terrain-ground';
    
    this.terrainGroup.add(this.terrainMesh);
  }
  
  /**
   * 물 효과 생성 (강, 습지)
   */
  private createWaterEffect(map: TerrainMap): void {
    const waterPositions: number[] = [];
    
    for (let z = 0; z < map.height; z++) {
      for (let x = 0; x < map.width; x++) {
        const cell = map.cells[z][x];
        if (cell.type === 'river' || cell.type === 'swamp') {
          const worldX = (x - map.width / 2) * map.cellSize;
          const worldZ = (z - map.height / 2) * map.cellSize;
          
          // 물 표면 위치
          waterPositions.push(worldX, 0.1, worldZ);
        }
      }
    }
    
    if (waterPositions.length === 0) return;
    
    // 물 지오메트리 (인스턴스드 메시로 최적화 가능)
    const waterGeometry = new THREE.PlaneGeometry(map.cellSize, map.cellSize);
    const waterMaterial = new THREE.MeshStandardMaterial({
      color: 0x4169e1,
      transparent: true,
      opacity: 0.7,
      roughness: 0.1,
      metalness: 0.3,
    });
    
    // 물 타일 그룹
    const waterGroup = new THREE.Group();
    waterGroup.name = 'water';
    
    for (let i = 0; i < waterPositions.length; i += 3) {
      const waterTile = new THREE.Mesh(waterGeometry, waterMaterial);
      waterTile.rotation.x = -Math.PI / 2;
      waterTile.position.set(
        waterPositions[i],
        waterPositions[i + 1],
        waterPositions[i + 2]
      );
      waterGroup.add(waterTile);
    }
    
    this.terrainGroup.add(waterGroup);
  }
  
  /**
   * 지형 디테일 생성 (숲 나무 등)
   */
  private createTerrainDetails(map: TerrainMap): void {
    // 숲 나무 생성
    this.createForestTrees(map);
    
    // 언덕 바위 생성
    this.createHillRocks(map);
    
    // 진영 깃발/텐트 생성
    this.createCampDetails(map);
  }
  
  /**
   * 숲 나무 생성
   */
  private createForestTrees(map: TerrainMap): void {
    const treeGroup = new THREE.Group();
    treeGroup.name = 'forest-trees';
    
    // 나무 지오메트리 (간단한 형태)
    const trunkGeometry = new THREE.CylinderGeometry(0.2, 0.3, 2, 8);
    const trunkMaterial = new THREE.MeshStandardMaterial({ color: 0x8b4513 });
    
    const foliageGeometry = new THREE.ConeGeometry(1.5, 3, 8);
    const foliageMaterial = new THREE.MeshStandardMaterial({ color: 0x228b22 });
    
    for (let z = 0; z < map.height; z++) {
      for (let x = 0; x < map.width; x++) {
        const cell = map.cells[z][x];
        if (cell.type === 'forest') {
          const worldX = (x - map.width / 2) * map.cellSize;
          const worldZ = (z - map.height / 2) * map.cellSize;
          
          // 셀당 2~4개의 나무
          const treeCount = 2 + Math.floor(Math.random() * 3);
          
          for (let t = 0; t < treeCount; t++) {
            const tree = new THREE.Group();
            
            const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
            trunk.position.y = 1;
            trunk.castShadow = this.options.useShadows;
            tree.add(trunk);
            
            const foliage = new THREE.Mesh(foliageGeometry, foliageMaterial);
            foliage.position.y = 3.5;
            foliage.castShadow = this.options.useShadows;
            tree.add(foliage);
            
            // 랜덤 위치 (셀 내)
            const offsetX = (Math.random() - 0.5) * map.cellSize * 0.8;
            const offsetZ = (Math.random() - 0.5) * map.cellSize * 0.8;
            tree.position.set(worldX + offsetX, 0, worldZ + offsetZ);
            
            // 랜덤 스케일
            const scale = 0.7 + Math.random() * 0.6;
            tree.scale.setScalar(scale);
            
            treeGroup.add(tree);
          }
        }
      }
    }
    
    this.terrainGroup.add(treeGroup);
    this.terrainDetails.set('forest', treeGroup);
  }
  
  /**
   * 언덕 바위 생성
   */
  private createHillRocks(map: TerrainMap): void {
    const rockGroup = new THREE.Group();
    rockGroup.name = 'hill-rocks';
    
    const rockGeometry = new THREE.DodecahedronGeometry(0.5, 0);
    const rockMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x808080,
      roughness: 0.9,
    });
    
    for (let z = 0; z < map.height; z++) {
      for (let x = 0; x < map.width; x++) {
        const cell = map.cells[z][x];
        if (cell.type === 'hill' && Math.random() < 0.3) {
          const worldX = (x - map.width / 2) * map.cellSize;
          const worldZ = (z - map.height / 2) * map.cellSize;
          
          const rock = new THREE.Mesh(rockGeometry, rockMaterial);
          rock.position.set(
            worldX + (Math.random() - 0.5) * map.cellSize,
            cell.height * this.options.heightScale,
            worldZ + (Math.random() - 0.5) * map.cellSize
          );
          rock.rotation.set(
            Math.random() * Math.PI,
            Math.random() * Math.PI,
            Math.random() * Math.PI
          );
          rock.scale.setScalar(0.5 + Math.random());
          rock.castShadow = this.options.useShadows;
          
          rockGroup.add(rock);
        }
      }
    }
    
    this.terrainGroup.add(rockGroup);
    this.terrainDetails.set('rocks', rockGroup);
  }
  
  /**
   * 진영 디테일 생성
   */
  private createCampDetails(map: TerrainMap): void {
    const campGroup = new THREE.Group();
    campGroup.name = 'camp-details';
    
    // 텐트 지오메트리
    const tentGeometry = new THREE.ConeGeometry(2, 3, 4);
    const tentMaterial = new THREE.MeshStandardMaterial({ color: 0xf5deb3 });
    
    // 깃발 지오메트리
    const poleGeometry = new THREE.CylinderGeometry(0.1, 0.1, 5, 8);
    const poleMaterial = new THREE.MeshStandardMaterial({ color: 0x8b4513 });
    const flagGeometry = new THREE.PlaneGeometry(2, 1.5);
    const flagMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xff0000,
      side: THREE.DoubleSide,
    });
    
    for (let z = 0; z < map.height; z++) {
      for (let x = 0; x < map.width; x++) {
        const cell = map.cells[z][x];
        if (cell.type === 'camp') {
          const worldX = (x - map.width / 2) * map.cellSize;
          const worldZ = (z - map.height / 2) * map.cellSize;
          
          // 텐트
          const tent = new THREE.Mesh(tentGeometry, tentMaterial);
          tent.position.set(worldX, 1.5, worldZ);
          tent.rotation.y = Math.PI / 4;
          tent.castShadow = this.options.useShadows;
          campGroup.add(tent);
          
          // 깃발
          const pole = new THREE.Mesh(poleGeometry, poleMaterial);
          pole.position.set(worldX + 3, 2.5, worldZ);
          campGroup.add(pole);
          
          const flag = new THREE.Mesh(flagGeometry, flagMaterial);
          flag.position.set(worldX + 4, 4, worldZ);
          campGroup.add(flag);
        }
      }
    }
    
    this.terrainGroup.add(campGroup);
    this.terrainDetails.set('camp', campGroup);
  }
  
  /**
   * 그리드 생성
   */
  private createGrid(map: TerrainMap): void {
    const worldWidth = map.width * map.cellSize;
    
    this.gridHelper = new THREE.GridHelper(
      worldWidth,
      map.width,
      0x000000,
      0x333333
    );
    this.gridHelper.position.y = 0.05;
    (this.gridHelper.material as THREE.Material).opacity = 0.3;
    (this.gridHelper.material as THREE.Material).transparent = true;
    
    this.terrainGroup.add(this.gridHelper);
  }
  
  // ========================================
  // 날씨 효과
  // ========================================
  
  /**
   * 날씨 효과 적용
   */
  applyWeatherEffects(): void {
    const weather = this.terrainSystem.getWeather();
    const weatherEffect = WEATHER_EFFECTS[weather];
    
    // 기존 효과 제거
    this.clearWeatherEffects();
    
    // 장면 배경색 변경
    if (this.scene.background instanceof THREE.Color) {
      this.scene.background.setHex(weatherEffect.skyColor);
    }
    
    // 안개 효과
    if (this.options.useFogEffect && weatherEffect.fogDensity > 0) {
      this.scene.fog = new THREE.Fog(
        weatherEffect.fogColor,
        50 * (1 - weatherEffect.fogDensity),
        200 * (1 - weatherEffect.fogDensity)
      );
      this.weatherEffects.fog = this.scene.fog;
    } else {
      this.scene.fog = null;
    }
    
    // 날씨별 파티클 효과
    switch (weather) {
      case 'rain':
        this.createRainEffect();
        break;
      case 'snow':
        this.createSnowEffect();
        break;
      case 'wind':
        this.createWindEffect();
        break;
    }
  }
  
  /**
   * 비 효과 생성
   */
  private createRainEffect(): void {
    const rainCount = 5000;
    const positions = new Float32Array(rainCount * 3);
    
    for (let i = 0; i < rainCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 400;
      positions[i * 3 + 1] = Math.random() * 100;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 400;
    }
    
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    
    const material = new THREE.PointsMaterial({
      color: 0xaaaaaa,
      size: 0.3,
      transparent: true,
      opacity: 0.6,
    });
    
    this.weatherEffects.rain = new THREE.Points(geometry, material);
    this.scene.add(this.weatherEffects.rain);
  }
  
  /**
   * 눈 효과 생성
   */
  private createSnowEffect(): void {
    const snowCount = 3000;
    const positions = new Float32Array(snowCount * 3);
    
    for (let i = 0; i < snowCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 400;
      positions[i * 3 + 1] = Math.random() * 100;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 400;
    }
    
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    
    const material = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.5,
      transparent: true,
      opacity: 0.8,
    });
    
    this.weatherEffects.snow = new THREE.Points(geometry, material);
    this.scene.add(this.weatherEffects.snow);
  }
  
  /**
   * 바람 효과 생성 (바람 방향 표시)
   */
  private createWindEffect(): void {
    const windDirection = this.terrainSystem.getWindDirection();
    
    const group = new THREE.Group();
    
    // 바람 화살표 생성
    const arrowGeometry = new THREE.ConeGeometry(2, 5, 8);
    const arrowMaterial = new THREE.MeshBasicMaterial({
      color: 0xcccccc,
      transparent: true,
      opacity: 0.3,
    });
    
    for (let i = 0; i < 10; i++) {
      const arrow = new THREE.Mesh(arrowGeometry, arrowMaterial);
      arrow.position.set(
        (Math.random() - 0.5) * 200,
        50 + Math.random() * 20,
        (Math.random() - 0.5) * 200
      );
      arrow.rotation.z = Math.PI / 2;
      arrow.rotation.y = windDirection;
      group.add(arrow);
    }
    
    this.weatherEffects.wind = group;
    this.scene.add(group);
  }
  
  /**
   * 날씨 효과 제거
   */
  private clearWeatherEffects(): void {
    if (this.weatherEffects.rain) {
      this.scene.remove(this.weatherEffects.rain);
      this.weatherEffects.rain.geometry.dispose();
      (this.weatherEffects.rain.material as THREE.Material).dispose();
      this.weatherEffects.rain = undefined;
    }
    
    if (this.weatherEffects.snow) {
      this.scene.remove(this.weatherEffects.snow);
      this.weatherEffects.snow.geometry.dispose();
      (this.weatherEffects.snow.material as THREE.Material).dispose();
      this.weatherEffects.snow = undefined;
    }
    
    if (this.weatherEffects.wind) {
      this.scene.remove(this.weatherEffects.wind);
      this.weatherEffects.wind = undefined;
    }
    
    this.scene.fog = null;
  }
  
  /**
   * 날씨 효과 애니메이션 업데이트 (매 프레임 호출)
   */
  updateWeatherAnimation(deltaTime: number): void {
    // 비 애니메이션
    if (this.weatherEffects.rain) {
      const positions = this.weatherEffects.rain.geometry.attributes.position;
      for (let i = 0; i < positions.count; i++) {
        let y = positions.getY(i);
        y -= deltaTime * 0.05; // 낙하 속도
        if (y < 0) y = 100;
        positions.setY(i, y);
      }
      positions.needsUpdate = true;
    }
    
    // 눈 애니메이션
    if (this.weatherEffects.snow) {
      const positions = this.weatherEffects.snow.geometry.attributes.position;
      const windDirection = this.terrainSystem.getWindDirection();
      
      for (let i = 0; i < positions.count; i++) {
        let x = positions.getX(i);
        let y = positions.getY(i);
        let z = positions.getZ(i);
        
        // 눈 낙하 + 바람 영향
        y -= deltaTime * 0.01;
        x += Math.cos(windDirection) * deltaTime * 0.005;
        z += Math.sin(windDirection) * deltaTime * 0.005;
        
        // 흔들림
        x += Math.sin(Date.now() * 0.001 + i) * 0.01;
        
        if (y < 0) {
          y = 100;
          x = (Math.random() - 0.5) * 400;
          z = (Math.random() - 0.5) * 400;
        }
        
        positions.setX(i, x);
        positions.setY(i, y);
        positions.setZ(i, z);
      }
      positions.needsUpdate = true;
    }
  }
  
  // ========================================
  // 유틸리티
  // ========================================
  
  /**
   * 지형 높이 조회 (레이캐스팅)
   * @param worldX 월드 X 좌표
   * @param worldZ 월드 Z 좌표
   */
  getHeightAt(worldX: number, worldZ: number): number {
    if (!this.terrainMesh) return 0;
    
    const raycaster = new THREE.Raycaster(
      new THREE.Vector3(worldX, 100, worldZ),
      new THREE.Vector3(0, -1, 0)
    );
    
    const intersects = raycaster.intersectObject(this.terrainMesh);
    if (intersects.length > 0) {
      return intersects[0].point.y;
    }
    
    return 0;
  }
  
  /**
   * 렌더링 옵션 업데이트
   */
  setOptions(options: Partial<TerrainRendererOptions>): void {
    Object.assign(this.options, options);
    
    // 와이어프레임 토글
    if (this.terrainMesh && options.showWireframe !== undefined) {
      (this.terrainMesh.material as THREE.MeshStandardMaterial).wireframe = options.showWireframe;
    }
    
    // 그리드 토글
    if (options.showGrid !== undefined) {
      if (this.gridHelper) {
        this.gridHelper.visible = options.showGrid;
      } else if (options.showGrid) {
        const map = this.terrainSystem.getMap();
        if (map) this.createGrid(map);
      }
    }
  }
  
  /**
   * 렌더링 제거
   */
  clear(): void {
    // 지형 메시 제거
    if (this.terrainMesh) {
      this.terrainGroup.remove(this.terrainMesh);
      this.terrainMesh.geometry.dispose();
      (this.terrainMesh.material as THREE.Material).dispose();
      this.terrainMesh = null;
    }
    
    // 물 메시 제거
    if (this.waterMesh) {
      this.terrainGroup.remove(this.waterMesh);
      this.waterMesh = null;
    }
    
    // 그리드 제거
    if (this.gridHelper) {
      this.terrainGroup.remove(this.gridHelper);
      this.gridHelper = null;
    }
    
    // 디테일 제거
    this.terrainDetails.forEach(group => {
      this.terrainGroup.remove(group);
    });
    this.terrainDetails.clear();
    
    // 그룹 내 모든 자식 제거
    while (this.terrainGroup.children.length > 0) {
      const child = this.terrainGroup.children[0];
      this.terrainGroup.remove(child);
    }
    
    // 날씨 효과 제거
    this.clearWeatherEffects();
  }
  
  /**
   * 리소스 해제
   */
  dispose(): void {
    this.clear();
    this.scene.remove(this.terrainGroup);
    
    // 텍스처 해제
    this.textures.forEach(texture => texture.dispose());
    this.textures.clear();
  }
  
  /**
   * 지형 그룹 반환 (외부에서 조작용)
   */
  getTerrainGroup(): THREE.Group {
    return this.terrainGroup;
  }
}

// ========================================
// 팩토리 함수
// ========================================

/**
 * 지형 렌더러 생성
 */
export function createTerrainRenderer(
  scene: THREE.Scene,
  terrainSystem: TerrainSystem,
  options?: TerrainRendererOptions
): TerrainRenderer {
  return new TerrainRenderer(scene, terrainSystem, options);
}





