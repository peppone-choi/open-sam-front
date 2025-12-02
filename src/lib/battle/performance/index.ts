/**
 * Performance Module Index
 * 
 * 복셀 전투의 성능 최적화 시스템을 통합합니다.
 * 
 * 목표:
 * - 데스크톱: 1000 유닛 60fps
 * - 모바일: 500 유닛 30fps
 * - 메모리: < 500MB
 * - 드로우콜: < 100
 */

// ===== 개별 모듈 내보내기 =====

export {
  PerformanceMonitor,
  getPerformanceMonitor,
  resetPerformanceMonitor,
  type PerformanceMetrics,
  type PerformanceWarning,
  type PerformanceWarningLevel,
  type PerformanceMonitorConfig,
} from './PerformanceMonitor';

export {
  QualityManager,
  getQualityManager,
  resetQualityManager,
  QUALITY_PRESETS,
  type QualityPreset,
  type QualitySettings,
  type QualityChangeEvent,
  type QualityChangeCallback,
  type ShadowQuality,
  type AnimationQuality,
  type VFXQuality,
  type TerrainDetail,
} from './QualityManager';

export {
  AdaptiveQuality,
  getAdaptiveQuality,
  resetAdaptiveQuality,
  type AdaptiveMode,
  type AdaptiveQualityConfig,
  type AdaptiveQualityState,
  type QualityDirection,
} from './AdaptiveQuality';

export {
  RenderOptimizer,
  createRenderOptimizer,
  type RenderOptimizerConfig,
  type RenderOptimizerStats,
  type CullingResult,
} from './RenderOptimizer';

export {
  MemoryManager,
  getMemoryManager,
  resetMemoryManager,
  type MemoryManagerConfig,
  type MemoryStats,
  type MemoryPressureEvent,
} from './MemoryManager';

export {
  MobileOptimizer,
  getMobileOptimizer,
  resetMobileOptimizer,
  type DeviceType,
  type PerformanceTier,
  type DeviceInfo,
  type BatteryStatus,
  type NetworkStatus,
  type MobileOptimizerConfig,
  type MobileOptimizerState,
} from './MobileOptimizer';

// ===== 통합 성능 시스템 =====

import * as THREE from 'three';
import { PerformanceMonitor, getPerformanceMonitor } from './PerformanceMonitor';
import { QualityManager, getQualityManager, QualityPreset } from './QualityManager';
import { AdaptiveQuality, getAdaptiveQuality, AdaptiveMode } from './AdaptiveQuality';
import { RenderOptimizer, createRenderOptimizer } from './RenderOptimizer';
import { MemoryManager, getMemoryManager } from './MemoryManager';
import { MobileOptimizer, getMobileOptimizer } from './MobileOptimizer';

/**
 * 통합 성능 시스템 설정
 */
export interface PerformanceSystemConfig {
  /** 초기 품질 프리셋 */
  initialQuality?: QualityPreset;
  /** 적응형 품질 모드 */
  adaptiveMode?: AdaptiveMode;
  /** 목표 FPS */
  targetFps?: number;
  /** 디버그 오버레이 표시 */
  showDebugOverlay?: boolean;
  /** 모바일 최적화 활성화 */
  enableMobileOptimization?: boolean;
  /** 자동 메모리 정리 */
  autoMemoryCleanup?: boolean;
}

/**
 * 통합 성능 시스템
 * 
 * 모든 성능 관련 모듈을 통합하여 일관된 인터페이스를 제공합니다.
 */
export class PerformanceSystem {
  // 서브시스템
  readonly monitor: PerformanceMonitor;
  readonly quality: QualityManager;
  readonly adaptive: AdaptiveQuality;
  readonly memory: MemoryManager;
  readonly mobile: MobileOptimizer;
  
  private renderOptimizer: RenderOptimizer | null = null;
  private renderer: THREE.WebGLRenderer | null = null;
  private isInitialized: boolean = false;
  
  constructor(config?: PerformanceSystemConfig) {
    const {
      initialQuality,
      adaptiveMode = 'balanced',
      targetFps = 60,
      showDebugOverlay = false,
      enableMobileOptimization = true,
      autoMemoryCleanup = true,
    } = config || {};
    
    // 모바일 최적화 (가장 먼저)
    this.mobile = getMobileOptimizer();
    
    // 품질 관리
    const detectedQuality = initialQuality ?? 
      (this.mobile.isMobile() || this.mobile.isTablet() 
        ? 'medium' 
        : this.mobile.getDeviceInfo().performanceTier === 'high' 
          ? 'high' 
          : 'medium');
    
    this.quality = getQualityManager(detectedQuality);
    
    // 성능 모니터링
    this.monitor = getPerformanceMonitor({
      enableOverlay: showDebugOverlay,
      onWarning: (warning) => {
        console.warn(`⚠️ 성능 경고: ${warning.message}`);
      },
    });
    
    // 적응형 품질
    this.adaptive = getAdaptiveQuality({
      mode: adaptiveMode,
      targetFps,
      onQualityChange: (from, to) => {
        console.log(`🎛️ 품질 변경: ${from} → ${to}`);
      },
    });
    
    // 메모리 관리
    this.memory = getMemoryManager({
      autoCleanup: autoMemoryCleanup,
    });
    
    // 메모리 압박 시 품질 저하
    this.memory.setOnMemoryPressure((event) => {
      console.warn(`⚠️ 메모리 압박: ${event.currentUsage}MB (${event.severity})`);
      
      if (event.severity === 'high') {
        const currentPreset = this.quality.getPreset();
        const lowerPreset = this.quality.getLowerPreset(currentPreset as QualityPreset);
        if (lowerPreset) {
          this.quality.setPreset(lowerPreset);
        }
      }
    });
    
    // 모바일 최적화 활성화
    if (enableMobileOptimization && (this.mobile.isMobile() || this.mobile.isTablet())) {
      this.mobile.activate();
    }
    
    console.log('🚀 PerformanceSystem 초기화 완료');
  }
  
  /**
   * Three.js 렌더러 및 씬 연결
   */
  initialize(
    renderer: THREE.WebGLRenderer,
    scene: THREE.Scene,
    camera: THREE.PerspectiveCamera
  ): void {
    this.renderer = renderer;
    
    // 렌더러 연결
    this.monitor.setRenderer(renderer);
    this.quality.setRenderer(renderer);
    this.mobile.setRenderer(renderer);
    
    // 렌더 최적화 생성
    this.renderOptimizer = createRenderOptimizer(scene, camera, {
      enableFrustumCulling: true,
      enableBatching: true,
      lodBias: this.quality.getSettings().lodBias,
    });
    
    // 품질 변경 시 렌더 최적화 업데이트
    this.quality.addChangeListener((event) => {
      this.renderOptimizer?.applyQualitySettings(event.newSettings);
    });
    
    this.isInitialized = true;
    
    console.log('🎮 PerformanceSystem 렌더러 연결 완료');
  }
  
  /**
   * 매 프레임 시작 시 호출
   */
  beginFrame(): void {
    this.monitor.beginFrame();
  }
  
  /**
   * 매 프레임 종료 시 호출
   */
  endFrame(): void {
    // 성능 모니터 업데이트
    this.monitor.endFrame();
    
    // 적응형 품질 업데이트
    const metrics = this.monitor.getMetrics();
    this.adaptive.update(metrics);
    
    // 렌더 최적화 업데이트
    this.renderOptimizer?.update();
  }
  
  /**
   * 렌더 최적화에 오브젝트 등록
   */
  registerObject(id: string, object: THREE.Object3D): void {
    this.renderOptimizer?.registerObject(id, object);
  }
  
  /**
   * 렌더 최적화에서 오브젝트 제거
   */
  unregisterObject(id: string): void {
    this.renderOptimizer?.unregisterObject(id);
  }
  
  /**
   * 유닛 통계 업데이트
   */
  setUnitStats(total: number, visible: number, lodDistribution: Record<number, number>): void {
    this.monitor.setUnitStats(total, visible, lodDistribution);
  }
  
  /**
   * 타이밍 마커 시작
   */
  startTiming(label: string): void {
    this.monitor.startTiming(label);
  }
  
  /**
   * 타이밍 마커 종료
   */
  endTiming(label: string): number {
    return this.monitor.endTiming(label);
  }
  
  /**
   * 디버그 오버레이 토글
   */
  toggleDebugOverlay(show?: boolean): void {
    this.monitor.toggleOverlay(show);
  }
  
  /**
   * 품질 프리셋 설정
   */
  setQuality(preset: QualityPreset): void {
    this.quality.setPreset(preset);
    this.adaptive.notifyUserChange();
  }
  
  /**
   * 적응형 품질 모드 설정
   */
  setAdaptiveMode(mode: AdaptiveMode): void {
    this.adaptive.setMode(mode);
  }
  
  /**
   * 현재 상태 요약
   */
  getSummary(): {
    fps: number;
    quality: QualityPreset | 'custom';
    drawCalls: number;
    memory: number;
    units: { total: number; visible: number };
    isMobile: boolean;
    batterySaveMode: boolean;
  } {
    const metrics = this.monitor.getMetrics();
    const mobileState = this.mobile.getState();
    
    return {
      fps: metrics.fps,
      quality: this.quality.getPreset(),
      drawCalls: metrics.drawCalls,
      memory: metrics.memoryUsage,
      units: {
        total: metrics.totalUnits,
        visible: metrics.visibleUnits,
      },
      isMobile: this.mobile.isMobile() || this.mobile.isTablet(),
      batterySaveMode: mobileState.batterySaveMode,
    };
  }
  
  /**
   * 전체 리포트 생성
   */
  generateReport(): string {
    return `
${this.monitor.generateReport()}

${this.memory.generateReport()}

${this.mobile.generateReport()}
    `.trim();
  }
  
  /**
   * 리포트 콘솔 출력
   */
  logReport(): void {
    console.log(this.generateReport());
  }
  
  /**
   * 정리
   */
  dispose(): void {
    this.renderOptimizer?.dispose();
    this.monitor.dispose();
    this.quality.dispose();
    this.adaptive.dispose();
    this.memory.dispose();
    this.mobile.dispose();
    
    this.isInitialized = false;
    
    console.log('🧹 PerformanceSystem 정리 완료');
  }
}

// ===== 전역 인스턴스 =====

let globalPerformanceSystem: PerformanceSystem | null = null;

/**
 * 전역 성능 시스템 가져오기
 */
export function getPerformanceSystem(config?: PerformanceSystemConfig): PerformanceSystem {
  if (!globalPerformanceSystem) {
    globalPerformanceSystem = new PerformanceSystem(config);
  }
  return globalPerformanceSystem;
}

/**
 * 전역 성능 시스템 초기화
 */
export function resetPerformanceSystem(): void {
  if (globalPerformanceSystem) {
    globalPerformanceSystem.dispose();
    globalPerformanceSystem = null;
  }
}

// ===== 기본 내보내기 =====

export default PerformanceSystem;





