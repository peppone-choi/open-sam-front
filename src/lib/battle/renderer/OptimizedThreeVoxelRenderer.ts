/**
 * OptimizedThreeVoxelRenderer - 최적화된 Three.js 복셀 렌더러
 * 
 * PhaserVoxelEngine과 통합하기 위한 래퍼 클래스
 * 기존 ThreeVoxelRenderer를 대체하여 성능 최적화 제공
 * 
 * 목표: 1000 유닛 60fps, 드로우콜 < 100
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { VoxelUnitRenderer, RendererConfig, RendererStats, UnitRenderData, SquadRenderData, SoldierRole, SoldierState } from './VoxelUnitRenderer';
import { LightingManager, PerformanceMonitor, LIGHTING_PRESETS, QUALITY_PRESETS } from './index';
import { TeamId } from './TeamColorManager';

// ===== PVSquad/PVSoldier 호환 타입 =====

export interface PVSoldierCompat {
  id: string;
  squadId: string;
  teamId: TeamId;
  role: SoldierRole;
  position: { x: number; y: number };
  facing: number;
  state: SoldierState;
  hp: number;
  maxHp: number;
  morale: number;
}

export interface PVSquadCompat {
  id: string;
  teamId: TeamId;
  unitTypeId: number;
  category: string;
  soldiers: PVSoldierCompat[];
}

// ===== 렌더러 설정 =====

export interface OptimizedRendererConfig {
  quality: 'low' | 'medium' | 'high' | 'ultra';
  lightingPreset: keyof typeof LIGHTING_PRESETS;
  enableStats: boolean;
  autoQuality: boolean;  // 자동 품질 조절
}

const DEFAULT_CONFIG: OptimizedRendererConfig = {
  quality: 'high',
  lightingPreset: 'daylight',
  enableStats: true,
  autoQuality: false,
};

// ===== OptimizedThreeVoxelRenderer 클래스 =====

export class OptimizedThreeVoxelRenderer {
  // Three.js 기본 객체
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public renderer: THREE.WebGLRenderer;
  public controls: OrbitControls;
  
  // 최적화된 렌더러 시스템
  private voxelRenderer?: VoxelUnitRenderer;
  private lightingManager: LightingManager;
  private performanceMonitor: PerformanceMonitor;
  
  // 설정
  private config: OptimizedRendererConfig;
  
  // 지형
  private ground?: THREE.Mesh;
  private grid?: THREE.GridHelper;
  
  // 데이터 변환용 캐시
  private unitDataCache: Map<string, UnitRenderData> = new Map();
  private squadDataCache: Map<string, SquadRenderData> = new Map();
  
  // 레거시 호환성
  private useOptimizedRenderer: boolean = true;
  private soldierMeshes: Map<string, THREE.Group> = new Map(); // 폴백용
  
  // 리사이즈 핸들러
  private resizeHandler: () => void;
  private container: HTMLElement;
  
  constructor(container: HTMLElement, config?: Partial<OptimizedRendererConfig>) {
    this.container = container;
    this.config = { ...DEFAULT_CONFIG, ...config };
    
    // Three.js 씬 초기화
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x87CEEB);
    
    // 카메라
    this.camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    this.camera.position.set(0, 100, 120);
    this.camera.lookAt(0, 0, 0);
    
    // 렌더러
    const qualitySettings = QUALITY_PRESETS[this.config.quality];
    this.renderer = new THREE.WebGLRenderer({ 
      antialias: qualitySettings.antialias,
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(qualitySettings.pixelRatio);
    this.renderer.shadowMap.enabled = qualitySettings.shadowQuality !== 'off';
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(this.renderer.domElement);
    
    // 컨트롤
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.maxPolarAngle = Math.PI / 2.2;
    this.controls.minDistance = 20;
    this.controls.maxDistance = 300;
    
    // 조명 매니저
    this.lightingManager = new LightingManager(this.scene);
    this.lightingManager.applyPreset(this.config.lightingPreset);
    this.lightingManager.setShadowQuality(qualitySettings.shadowQuality);
    
    // 성능 모니터
    this.performanceMonitor = new PerformanceMonitor();
    
    // 지형 생성
    this.createTerrain();
    
    // 리사이즈 핸들러
    this.resizeHandler = () => this.handleResize();
    window.addEventListener('resize', this.resizeHandler);
    
    console.log('✅ OptimizedThreeVoxelRenderer 초기화 완료');
  }
  
  // ===== 지형 =====
  
  private createTerrain(): void {
    // 바닥
    const groundGeometry = new THREE.PlaneGeometry(300, 300);
    const groundMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x4A7023,
      roughness: 0.9,
    });
    this.ground = new THREE.Mesh(groundGeometry, groundMaterial);
    this.ground.rotation.x = -Math.PI / 2;
    this.ground.receiveShadow = true;
    this.scene.add(this.ground);
    
    // 그리드
    this.grid = new THREE.GridHelper(300, 30, 0x000000, 0x333333);
    this.grid.position.y = 0.01;
    (this.grid.material as THREE.Material).opacity = 0.2;
    (this.grid.material as THREE.Material).transparent = true;
    this.scene.add(this.grid);
  }
  
  // ===== 렌더러 초기화 =====
  
  /**
   * 부대 데이터로 렌더러 초기화
   * PhaserVoxelEngine.initInstancedRenderer() 대체
   */
  initInstancedRenderer(squads: Map<string, PVSquadCompat>): void {
    console.log('📦 최적화된 복셀 유닛 렌더링 초기화');
    
    // 데이터 변환
    this.convertSquadData(squads);
    
    // 최적화된 렌더러 생성
    const rendererConfig: Partial<RendererConfig> = {
      maxUnits: this.getTotalSoldierCount(squads) + 100,
      enableShadows: QUALITY_PRESETS[this.config.quality].shadowQuality !== 'off',
      enableLOD: QUALITY_PRESETS[this.config.quality].lodEnabled,
      enableInstancing: QUALITY_PRESETS[this.config.quality].instancingEnabled,
      enableSpecialEffects: QUALITY_PRESETS[this.config.quality].effectsEnabled,
      qualityPreset: this.config.quality,
    };
    
    this.voxelRenderer = new VoxelUnitRenderer(this.scene, this.camera, rendererConfig);
    this.voxelRenderer.initialize(this.squadDataCache);
    
    this.useOptimizedRenderer = true;
  }
  
  private getTotalSoldierCount(squads: Map<string, PVSquadCompat>): number {
    let total = 0;
    squads.forEach(squad => {
      total += squad.soldiers.length;
    });
    return total;
  }
  
  private convertSquadData(squads: Map<string, PVSquadCompat>): void {
    this.unitDataCache.clear();
    this.squadDataCache.clear();
    
    squads.forEach((squad, squadId) => {
      const squadRenderData: SquadRenderData = {
        id: squadId,
        teamId: squad.teamId,
        unitTypeId: squad.unitTypeId,
        category: squad.category,
        soldiers: [],
      };
      
      squad.soldiers.forEach(soldier => {
        const unitData: UnitRenderData = {
          id: soldier.id,
          squadId: soldier.squadId,
          teamId: soldier.teamId,
          unitTypeId: squad.unitTypeId,
          role: soldier.role,
          position: { x: soldier.position.x, y: soldier.position.y },
          facing: soldier.facing,
          state: soldier.state,
          hp: soldier.hp,
          maxHp: soldier.maxHp,
          morale: soldier.morale,
        };
        
        this.unitDataCache.set(soldier.id, unitData);
        squadRenderData.soldiers.push(unitData);
      });
      
      this.squadDataCache.set(squadId, squadRenderData);
    });
  }
  
  // ===== 업데이트 =====
  
  /**
   * 병사 데이터 업데이트
   * PhaserVoxelEngine.updateSoldiers() 대체
   */
  updateSoldiers(soldiers: Map<string, PVSoldierCompat>, squads: Map<string, PVSquadCompat>): void {
    // 성능 모니터링
    this.performanceMonitor.update();
    
    // 자동 품질 조절
    if (this.config.autoQuality) {
      this.checkAutoQuality();
    }
    
    // 데이터 업데이트
    this.updateUnitData(soldiers, squads);
    
    // 렌더러 업데이트
    if (this.useOptimizedRenderer && this.voxelRenderer) {
      this.voxelRenderer.update(this.unitDataCache, this.squadDataCache);
    }
  }
  
  private updateUnitData(soldiers: Map<string, PVSoldierCompat>, squads: Map<string, PVSquadCompat>): void {
    // 부대 데이터 업데이트
    squads.forEach((squad, squadId) => {
      const existing = this.squadDataCache.get(squadId);
      if (existing) {
        existing.soldiers = [];
      }
    });
    
    // 유닛 데이터 업데이트
    soldiers.forEach((soldier, id) => {
      let unitData = this.unitDataCache.get(id);
      const squad = squads.get(soldier.squadId);
      
      if (!unitData && squad) {
        // 새 유닛
        unitData = {
          id: soldier.id,
          squadId: soldier.squadId,
          teamId: soldier.teamId,
          unitTypeId: squad.unitTypeId,
          role: soldier.role,
          position: { x: soldier.position.x, y: soldier.position.y },
          facing: soldier.facing,
          state: soldier.state,
          hp: soldier.hp,
          maxHp: soldier.maxHp,
          morale: soldier.morale,
        };
        this.unitDataCache.set(id, unitData);
      } else if (unitData) {
        // 기존 유닛 업데이트
        unitData.position.x = soldier.position.x;
        unitData.position.y = soldier.position.y;
        unitData.facing = soldier.facing;
        unitData.state = soldier.state;
        unitData.hp = soldier.hp;
        unitData.morale = soldier.morale;
      }
      
      // 부대에 유닛 추가
      if (unitData) {
        const squadData = this.squadDataCache.get(soldier.squadId);
        if (squadData) {
          squadData.soldiers.push(unitData);
        }
      }
    });
    
    // 제거된 유닛 정리
    const validIds = new Set(soldiers.keys());
    this.unitDataCache.forEach((_, id) => {
      if (!validIds.has(id)) {
        this.unitDataCache.delete(id);
      }
    });
  }
  
  // ===== 자동 품질 조절 =====
  
  private checkAutoQuality(): void {
    const suggestedQuality = this.performanceMonitor.suggestQuality();
    
    if (suggestedQuality !== this.config.quality) {
      console.log(`⚡ 자동 품질 조절: ${this.config.quality} → ${suggestedQuality}`);
      this.setQuality(suggestedQuality);
    }
  }
  
  // ===== 렌더링 =====
  
  /**
   * 프레임 렌더링
   */
  render(): void {
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }
  
  // ===== 설정 =====
  
  /**
   * 품질 설정 변경
   */
  setQuality(quality: 'low' | 'medium' | 'high' | 'ultra'): void {
    this.config.quality = quality;
    const qualitySettings = QUALITY_PRESETS[quality];
    
    // 렌더러 설정 업데이트
    this.renderer.setPixelRatio(qualitySettings.pixelRatio);
    this.renderer.shadowMap.enabled = qualitySettings.shadowQuality !== 'off';
    
    // 조명 그림자 품질
    this.lightingManager.setShadowQuality(qualitySettings.shadowQuality);
    
    // VoxelUnitRenderer 품질
    if (this.voxelRenderer) {
      this.voxelRenderer.setQuality(quality);
    }
    
    console.log(`📊 품질 설정 변경: ${quality}`);
  }
  
  /**
   * 조명 프리셋 변경
   */
  setLightingPreset(preset: keyof typeof LIGHTING_PRESETS): void {
    this.config.lightingPreset = preset;
    this.lightingManager.applyPreset(preset);
  }
  
  /**
   * 시간대 변경 (동적 조명)
   */
  setTimeOfDay(hour: number): void {
    this.lightingManager.updateSunPosition(hour);
  }
  
  // ===== 통계 =====
  
  /**
   * 렌더링 통계 반환
   */
  getStats(): RendererStats & { fps: number; memory: number } {
    const voxelStats = this.voxelRenderer?.getStats() || {
      totalUnits: 0,
      visibleUnits: 0,
      drawCalls: 0,
      triangles: 0,
      fps: 0,
      memoryUsage: 0,
      lodDistribution: {},
    };
    
    return {
      ...voxelStats,
      fps: this.performanceMonitor.getFPS(),
      memory: this.performanceMonitor.getMemoryUsage(),
    };
  }
  
  /**
   * 성능 정보 로깅
   */
  logPerformance(): void {
    const stats = this.getStats();
    console.log('📊 렌더링 성능:', {
      FPS: stats.fps,
      '유닛 수': `${stats.visibleUnits}/${stats.totalUnits}`,
      '드로우콜': stats.drawCalls,
      '메모리': `${stats.memory}MB`,
      'LOD 분포': stats.lodDistribution,
    });
  }
  
  // ===== 리사이즈 =====
  
  private handleResize(): void {
    this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
  }
  
  // ===== 정리 =====
  
  dispose(): void {
    // 이벤트 리스너 제거
    window.removeEventListener('resize', this.resizeHandler);
    
    // 렌더러 정리
    if (this.voxelRenderer) {
      this.voxelRenderer.dispose();
    }
    
    // 조명 정리
    this.lightingManager.dispose();
    
    // 지형 정리
    if (this.ground) {
      this.ground.geometry.dispose();
      (this.ground.material as THREE.Material).dispose();
      this.scene.remove(this.ground);
    }
    if (this.grid) {
      this.scene.remove(this.grid);
    }
    
    // 캐시 정리
    this.unitDataCache.clear();
    this.squadDataCache.clear();
    this.soldierMeshes.clear();
    
    // Three.js 정리
    this.renderer.dispose();
    this.controls.dispose();
    
    console.log('🧹 OptimizedThreeVoxelRenderer 정리 완료');
  }
}

export default OptimizedThreeVoxelRenderer;





