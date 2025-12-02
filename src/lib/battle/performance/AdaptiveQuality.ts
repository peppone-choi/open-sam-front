/**
 * AdaptiveQuality.ts
 * 
 * 자동 품질 조절 시스템
 * - FPS 기반 실시간 품질 조절
 * - 히스테리시스로 품질 떨림 방지
 * - 사용자 설정 존중
 * - 점진적 품질 변경
 */

import { 
  QualityManager, 
  QualityPreset, 
  QualitySettings,
  getQualityManager 
} from './QualityManager';
import { 
  PerformanceMonitor, 
  PerformanceMetrics,
  getPerformanceMonitor 
} from './PerformanceMonitor';

// ===== 타입 정의 =====

/** 적응형 품질 모드 */
export type AdaptiveMode = 'auto' | 'performance' | 'quality' | 'balanced' | 'disabled';

/** 품질 조절 방향 */
export type QualityDirection = 'up' | 'down' | 'stable';

/** 적응형 품질 설정 */
export interface AdaptiveQualityConfig {
  /** 모드 */
  mode: AdaptiveMode;
  
  /** 목표 FPS */
  targetFps: number;
  
  /** FPS 허용 오차 (%) */
  fpsTolerance: number;
  
  /** 품질 변경 쿨다운 (ms) */
  adjustmentCooldown: number;
  
  /** 히스테리시스 시간 (ms) - 품질 떨림 방지 */
  hysteresisTime: number;
  
  /** 최소 프리셋 (이 이하로 내려가지 않음) */
  minPreset: QualityPreset;
  
  /** 최대 프리셋 (이 이상으로 올라가지 않음) */
  maxPreset: QualityPreset;
  
  /** 점진적 조절 활성화 */
  gradualAdjustment: boolean;
  
  /** 메모리 압박 시 품질 저하 */
  memoryPressureReduction: boolean;
  
  /** 메모리 임계값 (MB) */
  memoryThreshold: number;
  
  /** 콜백 */
  onQualityChange?: (from: QualityPreset | 'custom', to: QualityPreset) => void;
}

/** 적응형 품질 상태 */
export interface AdaptiveQualityState {
  currentDirection: QualityDirection;
  lastAdjustmentTime: number;
  consecutiveLowFrames: number;
  consecutiveHighFrames: number;
  averageFps: number;
  isStable: boolean;
  pendingChange: QualityPreset | null;
}

// ===== 기본 설정 =====

const DEFAULT_CONFIG: AdaptiveQualityConfig = {
  mode: 'balanced',
  targetFps: 60,
  fpsTolerance: 10, // 10% = 54-66 FPS 허용
  adjustmentCooldown: 3000, // 3초
  hysteresisTime: 2000, // 2초
  minPreset: 'potato',
  maxPreset: 'ultra',
  gradualAdjustment: true,
  memoryPressureReduction: true,
  memoryThreshold: 450, // 450MB
};

// ===== 프리셋 순서 =====

const PRESET_ORDER: QualityPreset[] = ['potato', 'low', 'medium', 'high', 'ultra'];

// ===== 메인 클래스 =====

export class AdaptiveQuality {
  private config: AdaptiveQualityConfig;
  private qualityManager: QualityManager;
  private performanceMonitor: PerformanceMonitor;
  
  // 상태
  private state: AdaptiveQualityState = {
    currentDirection: 'stable',
    lastAdjustmentTime: 0,
    consecutiveLowFrames: 0,
    consecutiveHighFrames: 0,
    averageFps: 60,
    isStable: true,
    pendingChange: null,
  };
  
  // FPS 히스토리 (히스테리시스용)
  private fpsHistory: number[] = [];
  private maxHistoryLength = 60; // 1초 @ 60fps
  
  // 활성화 상태
  private isEnabled = true;
  
  // 사용자 잠금 (사용자가 수동으로 설정한 경우 자동 조절 일시 중지)
  private userLocked = false;
  private userLockTimeout: ReturnType<typeof setTimeout> | null = null;
  
  constructor(
    config?: Partial<AdaptiveQualityConfig>,
    qualityManager?: QualityManager,
    performanceMonitor?: PerformanceMonitor
  ) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.qualityManager = qualityManager ?? getQualityManager();
    this.performanceMonitor = performanceMonitor ?? getPerformanceMonitor();
    
    // 모드에 따른 목표 FPS 조정
    this.applyModeSettings();
    
    console.log(`🎛️ AdaptiveQuality 초기화: ${this.config.mode} 모드, 목표 ${this.config.targetFps} FPS`);
  }
  
  // ===== 모드 설정 =====
  
  private applyModeSettings(): void {
    switch (this.config.mode) {
      case 'performance':
        this.config.targetFps = 60;
        this.config.fpsTolerance = 5;
        this.config.minPreset = 'low';
        break;
        
      case 'quality':
        this.config.targetFps = 45;
        this.config.fpsTolerance = 15;
        this.config.maxPreset = 'ultra';
        break;
        
      case 'balanced':
        this.config.targetFps = 60;
        this.config.fpsTolerance = 10;
        break;
        
      case 'disabled':
        this.isEnabled = false;
        break;
    }
  }
  
  /**
   * 모드 변경
   */
  setMode(mode: AdaptiveMode): void {
    this.config.mode = mode;
    this.applyModeSettings();
    
    if (mode === 'disabled') {
      this.isEnabled = false;
    } else {
      this.isEnabled = true;
    }
    
    this.resetState();
    console.log(`🎛️ AdaptiveQuality 모드 변경: ${mode}`);
  }
  
  /**
   * 현재 모드 반환
   */
  getMode(): AdaptiveMode {
    return this.config.mode;
  }
  
  // ===== 업데이트 =====
  
  /**
   * 매 프레임 호출
   */
  update(metrics: PerformanceMetrics): void {
    if (!this.isEnabled || this.userLocked) return;
    
    const now = performance.now();
    
    // FPS 히스토리 업데이트
    this.fpsHistory.push(metrics.fps);
    if (this.fpsHistory.length > this.maxHistoryLength) {
      this.fpsHistory.shift();
    }
    
    // 평균 FPS 계산
    this.state.averageFps = this.calculateAverageFps();
    
    // 쿨다운 체크
    if (now - this.state.lastAdjustmentTime < this.config.adjustmentCooldown) {
      return;
    }
    
    // 품질 조절 필요성 판단
    const direction = this.determineDirection();
    this.state.currentDirection = direction;
    
    // 히스테리시스 적용
    if (direction !== 'stable') {
      this.handleQualityChange(direction, now);
    } else {
      this.state.consecutiveLowFrames = 0;
      this.state.consecutiveHighFrames = 0;
      this.state.isStable = true;
    }
    
    // 메모리 압박 체크
    if (this.config.memoryPressureReduction) {
      this.checkMemoryPressure(metrics);
    }
  }
  
  private calculateAverageFps(): number {
    if (this.fpsHistory.length === 0) return 60;
    
    // 상위/하위 10% 제외한 평균 (이상치 제거)
    const sorted = [...this.fpsHistory].sort((a, b) => a - b);
    const trimCount = Math.floor(sorted.length * 0.1);
    const trimmed = sorted.slice(trimCount, sorted.length - trimCount);
    
    if (trimmed.length === 0) return 60;
    
    return trimmed.reduce((a, b) => a + b, 0) / trimmed.length;
  }
  
  private determineDirection(): QualityDirection {
    const { targetFps, fpsTolerance } = this.config;
    const avgFps = this.state.averageFps;
    
    const lowerBound = targetFps * (1 - fpsTolerance / 100);
    const upperBound = targetFps * (1 + fpsTolerance / 100);
    
    // 최근 FPS 추세 분석
    const recentFps = this.fpsHistory.slice(-30); // 최근 0.5초
    const recentAvg = recentFps.length > 0
      ? recentFps.reduce((a, b) => a + b, 0) / recentFps.length
      : avgFps;
    
    // FPS가 목표보다 낮음
    if (avgFps < lowerBound || recentAvg < lowerBound * 0.9) {
      return 'down';
    }
    
    // FPS가 목표보다 충분히 높고 안정적
    if (avgFps > upperBound * 1.1 && recentAvg > upperBound) {
      return 'up';
    }
    
    return 'stable';
  }
  
  private handleQualityChange(direction: QualityDirection, now: number): void {
    const currentPreset = this.qualityManager.getPreset();
    
    if (currentPreset === 'custom') {
      // 커스텀 설정은 건드리지 않음
      return;
    }
    
    if (direction === 'down') {
      this.state.consecutiveLowFrames++;
      this.state.consecutiveHighFrames = 0;
      
      // 히스테리시스 시간 동안 지속적으로 낮아야 변경
      const requiredFrames = Math.ceil(this.config.hysteresisTime / 16.67);
      
      if (this.state.consecutiveLowFrames >= requiredFrames) {
        const lowerPreset = this.getLowerPreset(currentPreset as QualityPreset);
        
        if (lowerPreset) {
          this.applyQualityChange(currentPreset as QualityPreset, lowerPreset, now);
        }
      }
    } else if (direction === 'up') {
      this.state.consecutiveHighFrames++;
      this.state.consecutiveLowFrames = 0;
      
      // 품질 향상은 더 오래 기다림 (5초)
      const requiredFrames = Math.ceil(5000 / 16.67);
      
      if (this.state.consecutiveHighFrames >= requiredFrames) {
        const higherPreset = this.getHigherPreset(currentPreset as QualityPreset);
        
        if (higherPreset) {
          this.applyQualityChange(currentPreset as QualityPreset, higherPreset, now);
        }
      }
    }
    
    this.state.isStable = false;
  }
  
  private applyQualityChange(from: QualityPreset, to: QualityPreset, now: number): void {
    // 점진적 조절이 활성화되어 있으면 한 단계씩만 변경
    if (this.config.gradualAdjustment) {
      const fromIndex = PRESET_ORDER.indexOf(from);
      const toIndex = PRESET_ORDER.indexOf(to);
      
      if (Math.abs(toIndex - fromIndex) > 1) {
        // 한 단계만 변경
        to = PRESET_ORDER[fromIndex + (toIndex > fromIndex ? 1 : -1)];
      }
    }
    
    // 제한 체크
    if (!this.isPresetAllowed(to)) {
      return;
    }
    
    console.log(`🎛️ 자동 품질 조절: ${from} → ${to} (평균 FPS: ${this.state.averageFps.toFixed(1)})`);
    
    this.qualityManager.setPreset(to);
    this.state.lastAdjustmentTime = now;
    this.state.consecutiveLowFrames = 0;
    this.state.consecutiveHighFrames = 0;
    
    // 콜백 호출
    this.config.onQualityChange?.(from, to);
  }
  
  private getLowerPreset(current: QualityPreset): QualityPreset | null {
    const index = PRESET_ORDER.indexOf(current);
    const minIndex = PRESET_ORDER.indexOf(this.config.minPreset);
    
    if (index > minIndex) {
      return PRESET_ORDER[index - 1];
    }
    
    return null;
  }
  
  private getHigherPreset(current: QualityPreset): QualityPreset | null {
    const index = PRESET_ORDER.indexOf(current);
    const maxIndex = PRESET_ORDER.indexOf(this.config.maxPreset);
    
    if (index < maxIndex) {
      return PRESET_ORDER[index + 1];
    }
    
    return null;
  }
  
  private isPresetAllowed(preset: QualityPreset): boolean {
    const index = PRESET_ORDER.indexOf(preset);
    const minIndex = PRESET_ORDER.indexOf(this.config.minPreset);
    const maxIndex = PRESET_ORDER.indexOf(this.config.maxPreset);
    
    return index >= minIndex && index <= maxIndex;
  }
  
  // ===== 메모리 압박 =====
  
  private checkMemoryPressure(metrics: PerformanceMetrics): void {
    if (metrics.memoryUsage > this.config.memoryThreshold) {
      const currentPreset = this.qualityManager.getPreset();
      
      if (currentPreset !== 'custom' && currentPreset !== 'potato') {
        const lowerPreset = this.getLowerPreset(currentPreset as QualityPreset);
        
        if (lowerPreset) {
          console.log(`⚠️ 메모리 압박 감지 (${metrics.memoryUsage}MB), 품질 저하: ${currentPreset} → ${lowerPreset}`);
          this.qualityManager.setPreset(lowerPreset);
          this.state.lastAdjustmentTime = performance.now();
        }
      }
    }
  }
  
  // ===== 사용자 잠금 =====
  
  /**
   * 사용자가 수동으로 품질 변경 시 호출
   * 일정 시간 동안 자동 조절 일시 중지
   */
  notifyUserChange(duration: number = 10000): void {
    this.userLocked = true;
    
    if (this.userLockTimeout) {
      clearTimeout(this.userLockTimeout);
    }
    
    this.userLockTimeout = setTimeout(() => {
      this.userLocked = false;
      this.resetState();
    }, duration);
  }
  
  /**
   * 사용자 잠금 해제
   */
  unlockUserChange(): void {
    this.userLocked = false;
    
    if (this.userLockTimeout) {
      clearTimeout(this.userLockTimeout);
      this.userLockTimeout = null;
    }
  }
  
  // ===== 상태 =====
  
  /**
   * 현재 상태 반환
   */
  getState(): AdaptiveQualityState {
    return { ...this.state };
  }
  
  /**
   * 상태 초기화
   */
  resetState(): void {
    this.state = {
      currentDirection: 'stable',
      lastAdjustmentTime: 0,
      consecutiveLowFrames: 0,
      consecutiveHighFrames: 0,
      averageFps: 60,
      isStable: true,
      pendingChange: null,
    };
    
    this.fpsHistory = [];
  }
  
  /**
   * 활성화/비활성화
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    
    if (!enabled) {
      this.resetState();
    }
  }
  
  /**
   * 활성화 상태 확인
   */
  isActive(): boolean {
    return this.isEnabled && !this.userLocked;
  }
  
  // ===== 설정 =====
  
  /**
   * 목표 FPS 설정
   */
  setTargetFps(fps: number): void {
    this.config.targetFps = Math.max(24, Math.min(144, fps));
  }
  
  /**
   * 프리셋 제한 설정
   */
  setPresetLimits(min: QualityPreset, max: QualityPreset): void {
    const minIndex = PRESET_ORDER.indexOf(min);
    const maxIndex = PRESET_ORDER.indexOf(max);
    
    if (minIndex <= maxIndex) {
      this.config.minPreset = min;
      this.config.maxPreset = max;
    }
  }
  
  /**
   * 설정 반환
   */
  getConfig(): AdaptiveQualityConfig {
    return { ...this.config };
  }
  
  /**
   * 설정 변경
   */
  setConfig(config: Partial<AdaptiveQualityConfig>): void {
    Object.assign(this.config, config);
    
    if (config.mode) {
      this.applyModeSettings();
    }
  }
  
  // ===== 정리 =====
  
  dispose(): void {
    if (this.userLockTimeout) {
      clearTimeout(this.userLockTimeout);
    }
    
    this.fpsHistory = [];
    this.isEnabled = false;
    
    console.log('🧹 AdaptiveQuality 정리 완료');
  }
}

// ===== 싱글톤 =====

let globalAdaptiveQuality: AdaptiveQuality | null = null;

/**
 * 전역 적응형 품질 관리자 가져오기
 */
export function getAdaptiveQuality(config?: Partial<AdaptiveQualityConfig>): AdaptiveQuality {
  if (!globalAdaptiveQuality) {
    globalAdaptiveQuality = new AdaptiveQuality(config);
  }
  return globalAdaptiveQuality;
}

/**
 * 전역 적응형 품질 관리자 초기화
 */
export function resetAdaptiveQuality(): void {
  if (globalAdaptiveQuality) {
    globalAdaptiveQuality.dispose();
    globalAdaptiveQuality = null;
  }
}

export default AdaptiveQuality;





