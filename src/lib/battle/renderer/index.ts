// @ts-nocheck
/**
 * Voxel Battle Renderer - 최적화된 복셀 전투 렌더링 시스템
 * 
 * 목표: 1000 유닛 60fps, 드로우콜 < 100, 메모리 < 500MB
 * 
 * 핵심 기능:
 * - LOD (Level of Detail): 거리별 디테일 조절
 * - GPU 인스턴싱: 같은 유닛 타입 배치 렌더링
 * - 팀 색상 관리: 공격/방어 팀 색상 팔레트
 * - 특수 효과: 장수, 깃발병, 군악대 등 시각 효과
 * - 조명/그림자: 품질별 설정
 */

// ===== 모듈 내보내기 =====

export { VoxelUnitRenderer, type RendererConfig, type RendererStats } from './VoxelUnitRenderer';
export type { UnitRenderData, SquadRenderData, SoldierRole, SoldierState } from './VoxelUnitRenderer';

export { 
  OptimizedThreeVoxelRenderer, 
  type OptimizedRendererConfig,
  type PVSoldierCompat,
  type PVSquadCompat,
} from './OptimizedThreeVoxelRenderer';

export { VoxelLODSystem, DEFAULT_LOD_LEVELS, type LODLevel } from './VoxelLOD';

export { VoxelInstancer } from './VoxelInstancer';

export { 
  TeamColorManager, 
  NATION_PALETTES, 
  STATE_COLORS,
  type TeamId, 
  type TeamColors, 
  type NationColors 
} from './TeamColorManager';

export { 
  SpecialEffects, 
  type SpecialEffectType, 
  type UnitStateEffect 
} from './SpecialEffects';

// ===== 조명 설정 =====

import * as THREE from 'three';

export interface LightingConfig {
  ambient: {
    color: number;
    intensity: number;
  };
  directional: {
    color: number;
    intensity: number;
    position: THREE.Vector3;
    shadowMapSize: number;
    shadowBias: number;
    shadowRadius: number;
  };
  hemisphere?: {
    skyColor: number;
    groundColor: number;
    intensity: number;
  };
}

export const LIGHTING_PRESETS: Record<string, LightingConfig> = {
  daylight: {
    ambient: { color: 0xffffff, intensity: 0.5 },
    directional: {
      color: 0xffffff,
      intensity: 0.8,
      position: new THREE.Vector3(50, 100, 50),
      shadowMapSize: 2048,
      shadowBias: -0.0001,
      shadowRadius: 2,
    },
    hemisphere: {
      skyColor: 0x87CEEB,
      groundColor: 0x4A7023,
      intensity: 0.3,
    },
  },
  sunset: {
    ambient: { color: 0xfff5e6, intensity: 0.4 },
    directional: {
      color: 0xff9966,
      intensity: 0.7,
      position: new THREE.Vector3(-50, 30, 50),
      shadowMapSize: 2048,
      shadowBias: -0.0001,
      shadowRadius: 3,
    },
    hemisphere: {
      skyColor: 0xff7744,
      groundColor: 0x553311,
      intensity: 0.4,
    },
  },
  night: {
    ambient: { color: 0x334466, intensity: 0.3 },
    directional: {
      color: 0x6688aa,
      intensity: 0.4,
      position: new THREE.Vector3(30, 80, 30),
      shadowMapSize: 1024,
      shadowBias: -0.0002,
      shadowRadius: 4,
    },
    hemisphere: {
      skyColor: 0x112244,
      groundColor: 0x111122,
      intensity: 0.2,
    },
  },
  overcast: {
    ambient: { color: 0xcccccc, intensity: 0.6 },
    directional: {
      color: 0xdddddd,
      intensity: 0.5,
      position: new THREE.Vector3(0, 100, 0),
      shadowMapSize: 1024,
      shadowBias: -0.0001,
      shadowRadius: 5,
    },
  },
};

// ===== 품질 설정 =====

export interface QualitySettings {
  shadowQuality: 'off' | 'low' | 'medium' | 'high';
  lodEnabled: boolean;
  lodBias: number;  // LOD 전환 거리 배율 (1.0 = 기본)
  instancingEnabled: boolean;
  effectsEnabled: boolean;
  maxTextureSize: number;
  antialias: boolean;
  pixelRatio: number;
}

export const QUALITY_PRESETS: Record<string, QualitySettings> = {
  low: {
    shadowQuality: 'off',
    lodEnabled: true,
    lodBias: 0.7,
    instancingEnabled: true,
    effectsEnabled: false,
    maxTextureSize: 512,
    antialias: false,
    pixelRatio: 1,
  },
  medium: {
    shadowQuality: 'low',
    lodEnabled: true,
    lodBias: 1.0,
    instancingEnabled: true,
    effectsEnabled: true,
    maxTextureSize: 1024,
    antialias: true,
    pixelRatio: 1,
  },
  high: {
    shadowQuality: 'medium',
    lodEnabled: true,
    lodBias: 1.2,
    instancingEnabled: true,
    effectsEnabled: true,
    maxTextureSize: 2048,
    antialias: true,
    pixelRatio: Math.min(window.devicePixelRatio, 2),
  },
  ultra: {
    shadowQuality: 'high',
    lodEnabled: true,
    lodBias: 1.5,
    instancingEnabled: true,
    effectsEnabled: true,
    maxTextureSize: 4096,
    antialias: true,
    pixelRatio: window.devicePixelRatio,
  },
};

// ===== 조명 헬퍼 =====

export class LightingManager {
  private scene: THREE.Scene;
  private ambientLight?: THREE.AmbientLight;
  private directionalLight?: THREE.DirectionalLight;
  private hemisphereLight?: THREE.HemisphereLight;
  private currentPreset: string = 'daylight';
  
  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }
  
  /**
   * 조명 프리셋 적용
   */
  applyPreset(preset: keyof typeof LIGHTING_PRESETS): void {
    const config = LIGHTING_PRESETS[preset];
    if (!config) return;
    
    this.currentPreset = preset;
    
    // 기존 조명 제거
    this.dispose();
    
    // 환경광
    this.ambientLight = new THREE.AmbientLight(config.ambient.color, config.ambient.intensity);
    this.scene.add(this.ambientLight);
    
    // 방향광 + 그림자
    this.directionalLight = new THREE.DirectionalLight(config.directional.color, config.directional.intensity);
    this.directionalLight.position.copy(config.directional.position);
    this.directionalLight.castShadow = true;
    this.directionalLight.shadow.mapSize.width = config.directional.shadowMapSize;
    this.directionalLight.shadow.mapSize.height = config.directional.shadowMapSize;
    this.directionalLight.shadow.camera.near = 0.5;
    this.directionalLight.shadow.camera.far = 500;
    this.directionalLight.shadow.camera.left = -100;
    this.directionalLight.shadow.camera.right = 100;
    this.directionalLight.shadow.camera.top = 100;
    this.directionalLight.shadow.camera.bottom = -100;
    this.directionalLight.shadow.bias = config.directional.shadowBias;
    this.directionalLight.shadow.radius = config.directional.shadowRadius;
    this.scene.add(this.directionalLight);
    
    // 반구광 (선택적)
    if (config.hemisphere) {
      this.hemisphereLight = new THREE.HemisphereLight(
        config.hemisphere.skyColor,
        config.hemisphere.groundColor,
        config.hemisphere.intensity
      );
      this.scene.add(this.hemisphereLight);
    }
  }
  
  /**
   * 그림자 품질 설정
   */
  setShadowQuality(quality: QualitySettings['shadowQuality']): void {
    if (!this.directionalLight) return;
    
    switch (quality) {
      case 'off':
        this.directionalLight.castShadow = false;
        break;
      case 'low':
        this.directionalLight.castShadow = true;
        this.directionalLight.shadow.mapSize.setScalar(512);
        break;
      case 'medium':
        this.directionalLight.castShadow = true;
        this.directionalLight.shadow.mapSize.setScalar(1024);
        break;
      case 'high':
        this.directionalLight.castShadow = true;
        this.directionalLight.shadow.mapSize.setScalar(2048);
        break;
    }
    
    this.directionalLight.shadow.map?.dispose();
    this.directionalLight.shadow.map = null;
  }
  
  /**
   * 방향광 위치 업데이트 (시간대 시뮬레이션)
   */
  updateSunPosition(timeOfDay: number): void {
    if (!this.directionalLight) return;
    
    // timeOfDay: 0-24 (시간)
    const angle = ((timeOfDay - 6) / 12) * Math.PI; // 6시 = 수평선, 12시 = 정점
    const height = Math.sin(angle) * 100;
    const distance = Math.cos(angle) * 100;
    
    this.directionalLight.position.set(distance, Math.max(10, height), 50);
    
    // 시간에 따른 색온도 변경
    if (timeOfDay < 6 || timeOfDay > 18) {
      this.directionalLight.color.setHex(0x6688aa); // 밤
      this.directionalLight.intensity = 0.3;
    } else if (timeOfDay < 8 || timeOfDay > 16) {
      this.directionalLight.color.setHex(0xff9966); // 일출/일몰
      this.directionalLight.intensity = 0.6;
    } else {
      this.directionalLight.color.setHex(0xffffff); // 낮
      this.directionalLight.intensity = 0.8;
    }
  }
  
  /**
   * 현재 프리셋 반환
   */
  getCurrentPreset(): string {
    return this.currentPreset;
  }
  
  /**
   * 정리
   */
  dispose(): void {
    if (this.ambientLight) {
      this.scene.remove(this.ambientLight);
      this.ambientLight = undefined;
    }
    if (this.directionalLight) {
      this.directionalLight.shadow.map?.dispose();
      this.scene.remove(this.directionalLight);
      this.directionalLight = undefined;
    }
    if (this.hemisphereLight) {
      this.scene.remove(this.hemisphereLight);
      this.hemisphereLight = undefined;
    }
  }
}

// ===== 머티리얼 최적화 =====

export class MaterialManager {
  private materialCache: Map<string, THREE.Material> = new Map();
  private textureCache: Map<string, THREE.Texture> = new Map();
  
  /**
   * 캐시된 머티리얼 가져오기/생성
   */
  getMaterial(key: string, createFn: () => THREE.Material): THREE.Material {
    if (this.materialCache.has(key)) {
      return this.materialCache.get(key)!;
    }
    
    const material = createFn();
    this.materialCache.set(key, material);
    return material;
  }
  
  /**
   * 공유 머티리얼 생성
   */
  createSharedMaterial(color: number, options?: {
    roughness?: number;
    metalness?: number;
    transparent?: boolean;
    opacity?: number;
  }): THREE.MeshStandardMaterial {
    const key = `std-${color}-${JSON.stringify(options || {})}`;
    
    return this.getMaterial(key, () => new THREE.MeshStandardMaterial({
      color,
      roughness: options?.roughness ?? 0.8,
      metalness: options?.metalness ?? 0,
      transparent: options?.transparent ?? false,
      opacity: options?.opacity ?? 1,
    })) as THREE.MeshStandardMaterial;
  }
  
  /**
   * 텍스처 캐시 로드
   */
  loadTexture(url: string): THREE.Texture {
    if (this.textureCache.has(url)) {
      return this.textureCache.get(url)!;
    }
    
    const loader = new THREE.TextureLoader();
    const texture = loader.load(url);
    this.textureCache.set(url, texture);
    return texture;
  }
  
  /**
   * 정리
   */
  dispose(): void {
    this.materialCache.forEach(mat => mat.dispose());
    this.materialCache.clear();
    
    this.textureCache.forEach(tex => tex.dispose());
    this.textureCache.clear();
  }
}

// ===== 성능 모니터 =====

export class PerformanceMonitor {
  private frameCount = 0;
  private lastTime = performance.now();
  private fps = 60;
  private frameTimeHistory: number[] = [];
  private maxHistoryLength = 60;
  
  /**
   * 프레임 업데이트
   */
  update(): void {
    const now = performance.now();
    const frameTime = now - this.lastTime;
    this.lastTime = now;
    
    this.frameTimeHistory.push(frameTime);
    if (this.frameTimeHistory.length > this.maxHistoryLength) {
      this.frameTimeHistory.shift();
    }
    
    this.frameCount++;
  }
  
  /**
   * FPS 계산
   */
  getFPS(): number {
    if (this.frameTimeHistory.length === 0) return 60;
    
    const avgFrameTime = this.frameTimeHistory.reduce((a, b) => a + b, 0) / this.frameTimeHistory.length;
    return Math.round(1000 / avgFrameTime);
  }
  
  /**
   * 평균 프레임 시간 (ms)
   */
  getAverageFrameTime(): number {
    if (this.frameTimeHistory.length === 0) return 16.67;
    return this.frameTimeHistory.reduce((a, b) => a + b, 0) / this.frameTimeHistory.length;
  }
  
  /**
   * 메모리 사용량 (MB)
   */
  getMemoryUsage(): number {
    if (performance && (performance as Performance & { memory?: { usedJSHeapSize: number } }).memory) {
      return Math.round(
        (performance as Performance & { memory: { usedJSHeapSize: number } }).memory.usedJSHeapSize / 1024 / 1024
      );
    }
    return 0;
  }
  
  /**
   * 자동 품질 조절 제안
   */
  suggestQuality(): 'low' | 'medium' | 'high' | 'ultra' {
    const fps = this.getFPS();
    
    if (fps < 20) return 'low';
    if (fps < 40) return 'medium';
    if (fps < 55) return 'high';
    return 'ultra';
  }
  
  /**
   * 통계 리셋
   */
  reset(): void {
    this.frameCount = 0;
    this.frameTimeHistory = [];
  }
}

// ===== 기본 내보내기 =====

export default {
  VoxelUnitRenderer: () => import('./VoxelUnitRenderer'),
  VoxelLODSystem: () => import('./VoxelLOD'),
  VoxelInstancer: () => import('./VoxelInstancer'),
  TeamColorManager: () => import('./TeamColorManager'),
  SpecialEffects: () => import('./SpecialEffects'),
  LightingManager,
  MaterialManager,
  PerformanceMonitor,
  LIGHTING_PRESETS,
  QUALITY_PRESETS,
};

