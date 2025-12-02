/**
 * QualityManager.ts
 * 
 * 품질 프리셋 관리 시스템
 * - Ultra/High/Medium/Low/Potato 5단계 프리셋
 * - 커스텀 설정 지원
 * - 설정 저장/불러오기
 */

import * as THREE from 'three';

// ===== 타입 정의 =====

/** 품질 프리셋 이름 */
export type QualityPreset = 'ultra' | 'high' | 'medium' | 'low' | 'potato';

/** 그림자 품질 */
export type ShadowQuality = 'off' | 'low' | 'medium' | 'high' | 'ultra';

/** 애니메이션 품질 */
export type AnimationQuality = 'full' | 'reduced' | 'minimal' | 'off';

/** VFX 품질 */
export type VFXQuality = 'full' | 'reduced' | 'minimal' | 'off';

/** 지형 디테일 */
export type TerrainDetail = 'ultra' | 'high' | 'medium' | 'low' | 'minimal';

/** 품질 설정 */
export interface QualitySettings {
  // === 렌더링 ===
  /** 그림자 품질 */
  shadowQuality: ShadowQuality;
  /** 그림자 맵 크기 */
  shadowMapSize: number;
  /** 안티 앨리어싱 */
  antialias: boolean;
  /** 픽셀 비율 (DPR) */
  pixelRatio: number;
  /** 최대 픽셀 비율 */
  maxPixelRatio: number;
  
  // === 유닛 ===
  /** 최대 표시 유닛 수 */
  maxVisibleUnits: number;
  /** 애니메이션 품질 */
  animationQuality: AnimationQuality;
  /** 애니메이션 업데이트 주기 (ms) */
  animationUpdateInterval: number;
  /** LOD 바이어스 (높을수록 더 낮은 LOD 사용) */
  lodBias: number;
  /** 인스턴싱 활성화 */
  enableInstancing: boolean;
  
  // === 이펙트 ===
  /** VFX 품질 */
  vfxQuality: VFXQuality;
  /** 파티클 수 배율 (0-1) */
  particleMultiplier: number;
  /** 최대 파티클 수 */
  maxParticles: number;
  /** 날씨 효과 */
  weatherEffects: boolean;
  /** 포스트 프로세싱 */
  postProcessing: boolean;
  /** 블룸 효과 */
  bloomEnabled: boolean;
  
  // === 지형 ===
  /** 지형 디테일 */
  terrainDetail: TerrainDetail;
  /** 풀/나무 밀도 (0-1) */
  vegetationDensity: number;
  /** 지형 텍스처 크기 */
  terrainTextureSize: number;
  
  // === 물리 ===
  /** 물리 업데이트 주기 (ms) */
  physicsUpdateInterval: number;
  /** 충돌 검사 정밀도 */
  collisionPrecision: 'full' | 'reduced' | 'minimal';
  
  // === 오디오 ===
  /** 동시 사운드 최대 수 */
  maxConcurrentSounds: number;
  /** 3D 오디오 활성화 */
  spatialAudio: boolean;
  
  // === 메모리 ===
  /** 텍스처 캐시 크기 (MB) */
  textureCacheSize: number;
  /** 지오메트리 캐시 크기 (MB) */
  geometryCacheSize: number;
  /** 오브젝트 풀 크기 */
  objectPoolSize: number;
}

/** 품질 변경 이벤트 */
export interface QualityChangeEvent {
  previousPreset: QualityPreset | 'custom';
  newPreset: QualityPreset | 'custom';
  previousSettings: QualitySettings;
  newSettings: QualitySettings;
  changedProperties: string[];
}

/** 품질 변경 콜백 */
export type QualityChangeCallback = (event: QualityChangeEvent) => void;

// ===== 프리셋 정의 =====

/** Ultra 프리셋 - 최고 품질 */
const ULTRA_PRESET: QualitySettings = {
  // 렌더링
  shadowQuality: 'ultra',
  shadowMapSize: 4096,
  antialias: true,
  pixelRatio: 1,
  maxPixelRatio: 2,
  
  // 유닛
  maxVisibleUnits: 2000,
  animationQuality: 'full',
  animationUpdateInterval: 16,
  lodBias: 0,
  enableInstancing: true,
  
  // 이펙트
  vfxQuality: 'full',
  particleMultiplier: 1,
  maxParticles: 10000,
  weatherEffects: true,
  postProcessing: true,
  bloomEnabled: true,
  
  // 지형
  terrainDetail: 'ultra',
  vegetationDensity: 1,
  terrainTextureSize: 2048,
  
  // 물리
  physicsUpdateInterval: 16,
  collisionPrecision: 'full',
  
  // 오디오
  maxConcurrentSounds: 32,
  spatialAudio: true,
  
  // 메모리
  textureCacheSize: 512,
  geometryCacheSize: 256,
  objectPoolSize: 500,
};

/** High 프리셋 - 고품질 */
const HIGH_PRESET: QualitySettings = {
  shadowQuality: 'high',
  shadowMapSize: 2048,
  antialias: true,
  pixelRatio: 1,
  maxPixelRatio: 1.5,
  
  maxVisibleUnits: 1500,
  animationQuality: 'full',
  animationUpdateInterval: 16,
  lodBias: 0.5,
  enableInstancing: true,
  
  vfxQuality: 'full',
  particleMultiplier: 0.8,
  maxParticles: 5000,
  weatherEffects: true,
  postProcessing: true,
  bloomEnabled: true,
  
  terrainDetail: 'high',
  vegetationDensity: 0.8,
  terrainTextureSize: 1024,
  
  physicsUpdateInterval: 16,
  collisionPrecision: 'full',
  
  maxConcurrentSounds: 24,
  spatialAudio: true,
  
  textureCacheSize: 384,
  geometryCacheSize: 192,
  objectPoolSize: 400,
};

/** Medium 프리셋 - 중간 품질 */
const MEDIUM_PRESET: QualitySettings = {
  shadowQuality: 'medium',
  shadowMapSize: 1024,
  antialias: true,
  pixelRatio: 1,
  maxPixelRatio: 1,
  
  maxVisibleUnits: 1000,
  animationQuality: 'reduced',
  animationUpdateInterval: 33,
  lodBias: 1,
  enableInstancing: true,
  
  vfxQuality: 'reduced',
  particleMultiplier: 0.5,
  maxParticles: 2000,
  weatherEffects: true,
  postProcessing: false,
  bloomEnabled: false,
  
  terrainDetail: 'medium',
  vegetationDensity: 0.5,
  terrainTextureSize: 512,
  
  physicsUpdateInterval: 33,
  collisionPrecision: 'reduced',
  
  maxConcurrentSounds: 16,
  spatialAudio: true,
  
  textureCacheSize: 256,
  geometryCacheSize: 128,
  objectPoolSize: 300,
};

/** Low 프리셋 - 저품질 */
const LOW_PRESET: QualitySettings = {
  shadowQuality: 'low',
  shadowMapSize: 512,
  antialias: false,
  pixelRatio: 1,
  maxPixelRatio: 1,
  
  maxVisibleUnits: 500,
  animationQuality: 'minimal',
  animationUpdateInterval: 50,
  lodBias: 2,
  enableInstancing: true,
  
  vfxQuality: 'minimal',
  particleMultiplier: 0.25,
  maxParticles: 500,
  weatherEffects: false,
  postProcessing: false,
  bloomEnabled: false,
  
  terrainDetail: 'low',
  vegetationDensity: 0.2,
  terrainTextureSize: 256,
  
  physicsUpdateInterval: 50,
  collisionPrecision: 'minimal',
  
  maxConcurrentSounds: 8,
  spatialAudio: false,
  
  textureCacheSize: 128,
  geometryCacheSize: 64,
  objectPoolSize: 200,
};

/** Potato 프리셋 - 최저 품질 (성능 우선) */
const POTATO_PRESET: QualitySettings = {
  shadowQuality: 'off',
  shadowMapSize: 0,
  antialias: false,
  pixelRatio: 0.75,
  maxPixelRatio: 1,
  
  maxVisibleUnits: 200,
  animationQuality: 'off',
  animationUpdateInterval: 100,
  lodBias: 4,
  enableInstancing: true,
  
  vfxQuality: 'off',
  particleMultiplier: 0,
  maxParticles: 0,
  weatherEffects: false,
  postProcessing: false,
  bloomEnabled: false,
  
  terrainDetail: 'minimal',
  vegetationDensity: 0,
  terrainTextureSize: 128,
  
  physicsUpdateInterval: 100,
  collisionPrecision: 'minimal',
  
  maxConcurrentSounds: 4,
  spatialAudio: false,
  
  textureCacheSize: 64,
  geometryCacheSize: 32,
  objectPoolSize: 100,
};

/** 프리셋 맵 */
export const QUALITY_PRESETS: Record<QualityPreset, QualitySettings> = {
  ultra: ULTRA_PRESET,
  high: HIGH_PRESET,
  medium: MEDIUM_PRESET,
  low: LOW_PRESET,
  potato: POTATO_PRESET,
};

// ===== 메인 클래스 =====

export class QualityManager {
  private currentPreset: QualityPreset | 'custom' = 'high';
  private currentSettings: QualitySettings;
  private renderer: THREE.WebGLRenderer | null = null;
  
  // 이벤트 리스너
  private changeListeners: Set<QualityChangeCallback> = new Set();
  
  // 저장 키
  private storageKey = 'voxel-battle-quality-settings';
  
  constructor(initialPreset?: QualityPreset) {
    // 저장된 설정 불러오기 시도
    const savedSettings = this.loadSettings();
    
    if (savedSettings) {
      this.currentSettings = savedSettings.settings;
      this.currentPreset = savedSettings.preset;
    } else {
      // 기본 프리셋 적용
      const preset = initialPreset ?? this.detectOptimalPreset();
      this.currentPreset = preset;
      this.currentSettings = { ...QUALITY_PRESETS[preset] };
    }
    
    console.log(`🎨 QualityManager 초기화: ${this.currentPreset} 프리셋`);
  }
  
  // ===== 렌더러 연결 =====
  
  /**
   * Three.js 렌더러 연결 및 설정 적용
   */
  setRenderer(renderer: THREE.WebGLRenderer): void {
    this.renderer = renderer;
    this.applyRendererSettings();
  }
  
  private applyRendererSettings(): void {
    if (!this.renderer) return;
    
    const settings = this.currentSettings;
    
    // 픽셀 비율
    const dpr = Math.min(
      window.devicePixelRatio * settings.pixelRatio,
      settings.maxPixelRatio
    );
    this.renderer.setPixelRatio(dpr);
    
    // 그림자
    if (settings.shadowQuality === 'off') {
      this.renderer.shadowMap.enabled = false;
    } else {
      this.renderer.shadowMap.enabled = true;
      
      // 그림자 타입
      switch (settings.shadowQuality) {
        case 'low':
          this.renderer.shadowMap.type = THREE.BasicShadowMap;
          break;
        case 'medium':
          this.renderer.shadowMap.type = THREE.PCFShadowMap;
          break;
        case 'high':
        case 'ultra':
          this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
          break;
      }
    }
  }
  
  // ===== 프리셋 관리 =====
  
  /**
   * 프리셋 적용
   */
  setPreset(preset: QualityPreset): void {
    const previousPreset = this.currentPreset;
    const previousSettings = { ...this.currentSettings };
    
    this.currentPreset = preset;
    this.currentSettings = { ...QUALITY_PRESETS[preset] };
    
    this.applyRendererSettings();
    this.saveSettings();
    
    // 이벤트 발생
    this.emitChangeEvent(previousPreset, preset, previousSettings, this.currentSettings);
    
    console.log(`🎨 품질 프리셋 변경: ${previousPreset} → ${preset}`);
  }
  
  /**
   * 현재 프리셋 반환
   */
  getPreset(): QualityPreset | 'custom' {
    return this.currentPreset;
  }
  
  /**
   * 현재 설정 반환
   */
  getSettings(): QualitySettings {
    return { ...this.currentSettings };
  }
  
  // ===== 개별 설정 관리 =====
  
  /**
   * 개별 설정 변경
   */
  setSetting<K extends keyof QualitySettings>(key: K, value: QualitySettings[K]): void {
    const previousSettings = { ...this.currentSettings };
    
    this.currentSettings[key] = value;
    
    // 커스텀 프리셋으로 변경
    const previousPreset = this.currentPreset;
    this.currentPreset = this.detectMatchingPreset() ?? 'custom';
    
    this.applyRendererSettings();
    this.saveSettings();
    
    this.emitChangeEvent(previousPreset, this.currentPreset, previousSettings, this.currentSettings);
  }
  
  /**
   * 여러 설정 한 번에 변경
   */
  setSettings(settings: Partial<QualitySettings>): void {
    const previousSettings = { ...this.currentSettings };
    const previousPreset = this.currentPreset;
    
    Object.assign(this.currentSettings, settings);
    
    this.currentPreset = this.detectMatchingPreset() ?? 'custom';
    
    this.applyRendererSettings();
    this.saveSettings();
    
    this.emitChangeEvent(previousPreset, this.currentPreset, previousSettings, this.currentSettings);
  }
  
  /**
   * 현재 설정이 어떤 프리셋과 일치하는지 확인
   */
  private detectMatchingPreset(): QualityPreset | null {
    for (const [preset, settings] of Object.entries(QUALITY_PRESETS)) {
      if (this.settingsEqual(this.currentSettings, settings)) {
        return preset as QualityPreset;
      }
    }
    return null;
  }
  
  private settingsEqual(a: QualitySettings, b: QualitySettings): boolean {
    const keys = Object.keys(a) as (keyof QualitySettings)[];
    return keys.every(key => a[key] === b[key]);
  }
  
  // ===== 최적 프리셋 감지 =====
  
  /**
   * 디바이스에 맞는 최적 프리셋 감지
   */
  detectOptimalPreset(): QualityPreset {
    // GPU 정보 확인
    const gpuTier = this.detectGPUTier();
    
    // 메모리 확인
    const memoryGB = this.detectMemory();
    
    // 모바일 확인
    const isMobile = this.detectMobile();
    
    // 프리셋 결정
    if (isMobile) {
      if (gpuTier === 'high') return 'medium';
      if (gpuTier === 'medium') return 'low';
      return 'potato';
    }
    
    if (gpuTier === 'high' && memoryGB >= 8) return 'ultra';
    if (gpuTier === 'high' || (gpuTier === 'medium' && memoryGB >= 8)) return 'high';
    if (gpuTier === 'medium' && memoryGB >= 4) return 'medium';
    if (memoryGB >= 4) return 'low';
    
    return 'potato';
  }
  
  private detectGPUTier(): 'high' | 'medium' | 'low' {
    if (typeof document === 'undefined') return 'medium';
    
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    
    if (!gl) return 'low';
    
    const webgl = gl as WebGLRenderingContext;
    const debugInfo = webgl.getExtension('WEBGL_debug_renderer_info');
    
    if (!debugInfo) return 'medium';
    
    const renderer = webgl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
    const rendererLower = renderer.toLowerCase();
    
    // 고성능 GPU 키워드
    const highEndKeywords = [
      'rtx', 'rx 6', 'rx 7', 'radeon pro', 'quadro',
      'geforce gtx 10', 'geforce gtx 16', 'geforce gtx 20',
      'm1', 'm2', 'm3', 'apple gpu'
    ];
    
    // 저성능 GPU 키워드
    const lowEndKeywords = [
      'intel hd', 'intel uhd', 'iris', 'mali', 'adreno 5',
      'powervr', 'videocore'
    ];
    
    for (const keyword of highEndKeywords) {
      if (rendererLower.includes(keyword)) return 'high';
    }
    
    for (const keyword of lowEndKeywords) {
      if (rendererLower.includes(keyword)) return 'low';
    }
    
    return 'medium';
  }
  
  private detectMemory(): number {
    // navigator.deviceMemory는 Chrome/Edge에서만 지원
    const nav = navigator as Navigator & { deviceMemory?: number };
    if (nav.deviceMemory) {
      return nav.deviceMemory;
    }
    
    // 기본값
    return 4;
  }
  
  private detectMobile(): boolean {
    if (typeof window === 'undefined') return false;
    
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );
  }
  
  // ===== 이벤트 =====
  
  /**
   * 품질 변경 리스너 등록
   */
  addChangeListener(callback: QualityChangeCallback): void {
    this.changeListeners.add(callback);
  }
  
  /**
   * 품질 변경 리스너 제거
   */
  removeChangeListener(callback: QualityChangeCallback): void {
    this.changeListeners.delete(callback);
  }
  
  private emitChangeEvent(
    previousPreset: QualityPreset | 'custom',
    newPreset: QualityPreset | 'custom',
    previousSettings: QualitySettings,
    newSettings: QualitySettings
  ): void {
    const changedProperties = this.getChangedProperties(previousSettings, newSettings);
    
    const event: QualityChangeEvent = {
      previousPreset,
      newPreset,
      previousSettings,
      newSettings,
      changedProperties,
    };
    
    for (const listener of this.changeListeners) {
      try {
        listener(event);
      } catch (e) {
        console.warn('[QualityManager] 리스너 오류:', e);
      }
    }
  }
  
  private getChangedProperties(a: QualitySettings, b: QualitySettings): string[] {
    const changed: string[] = [];
    const keys = Object.keys(a) as (keyof QualitySettings)[];
    
    for (const key of keys) {
      if (a[key] !== b[key]) {
        changed.push(key);
      }
    }
    
    return changed;
  }
  
  // ===== 저장/불러오기 =====
  
  /**
   * 설정 저장
   */
  saveSettings(): void {
    if (typeof localStorage === 'undefined') return;
    
    try {
      const data = {
        preset: this.currentPreset,
        settings: this.currentSettings,
        timestamp: Date.now(),
      };
      
      localStorage.setItem(this.storageKey, JSON.stringify(data));
    } catch (e) {
      console.warn('[QualityManager] 설정 저장 실패:', e);
    }
  }
  
  /**
   * 설정 불러오기
   */
  private loadSettings(): { preset: QualityPreset | 'custom'; settings: QualitySettings } | null {
    if (typeof localStorage === 'undefined') return null;
    
    try {
      const data = localStorage.getItem(this.storageKey);
      if (!data) return null;
      
      const parsed = JSON.parse(data);
      
      // 유효성 검사
      if (!parsed.settings || !parsed.preset) return null;
      
      return {
        preset: parsed.preset,
        settings: { ...QUALITY_PRESETS.high, ...parsed.settings },
      };
    } catch (e) {
      console.warn('[QualityManager] 설정 불러오기 실패:', e);
      return null;
    }
  }
  
  /**
   * 저장된 설정 초기화
   */
  resetSettings(): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(this.storageKey);
    }
    
    const optimalPreset = this.detectOptimalPreset();
    this.setPreset(optimalPreset);
  }
  
  // ===== 유틸리티 =====
  
  /**
   * 프리셋 목록 반환
   */
  getAvailablePresets(): QualityPreset[] {
    return ['ultra', 'high', 'medium', 'low', 'potato'];
  }
  
  /**
   * 프리셋 설명 반환
   */
  getPresetDescription(preset: QualityPreset): string {
    const descriptions: Record<QualityPreset, string> = {
      ultra: '최고 품질 - 고사양 PC 권장 (RTX 3060 이상)',
      high: '고품질 - 일반 게이밍 PC',
      medium: '중간 품질 - 밸런스 (권장)',
      low: '저품질 - 저사양 PC/노트북',
      potato: '최저 품질 - 성능 우선 (모바일/구형 PC)',
    };
    
    return descriptions[preset];
  }
  
  /**
   * 설정 비교 (A가 B보다 높은 품질인지)
   */
  isHigherQuality(a: QualityPreset, b: QualityPreset): boolean {
    const order: QualityPreset[] = ['potato', 'low', 'medium', 'high', 'ultra'];
    return order.indexOf(a) > order.indexOf(b);
  }
  
  /**
   * 다음 낮은 프리셋 반환
   */
  getLowerPreset(preset: QualityPreset): QualityPreset | null {
    const order: QualityPreset[] = ['potato', 'low', 'medium', 'high', 'ultra'];
    const index = order.indexOf(preset);
    return index > 0 ? order[index - 1] : null;
  }
  
  /**
   * 다음 높은 프리셋 반환
   */
  getHigherPreset(preset: QualityPreset): QualityPreset | null {
    const order: QualityPreset[] = ['potato', 'low', 'medium', 'high', 'ultra'];
    const index = order.indexOf(preset);
    return index < order.length - 1 ? order[index + 1] : null;
  }
  
  // ===== 정리 =====
  
  dispose(): void {
    this.changeListeners.clear();
    this.renderer = null;
    console.log('🧹 QualityManager 정리 완료');
  }
}

// ===== 싱글톤 =====

let globalQualityManager: QualityManager | null = null;

/**
 * 전역 품질 관리자 가져오기
 */
export function getQualityManager(initialPreset?: QualityPreset): QualityManager {
  if (!globalQualityManager) {
    globalQualityManager = new QualityManager(initialPreset);
  }
  return globalQualityManager;
}

/**
 * 전역 품질 관리자 초기화
 */
export function resetQualityManager(): void {
  if (globalQualityManager) {
    globalQualityManager.dispose();
    globalQualityManager = null;
  }
}

export default QualityManager;





