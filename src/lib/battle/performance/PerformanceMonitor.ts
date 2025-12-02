/**
 * PerformanceMonitor.ts
 * 
 * 복셀 전투의 성능을 실시간으로 모니터링합니다.
 * - FPS 측정
 * - 프레임 타임 측정
 * - 드로우콜/삼각형 카운트
 * - 메모리 사용량
 * - 상세 타이밍 (로직, 렌더링, 물리)
 */

import * as THREE from 'three';

// ===== 타입 정의 =====

/** 성능 메트릭스 */
export interface PerformanceMetrics {
  // 기본 메트릭
  fps: number;
  frameTime: number;           // ms
  averageFrameTime: number;    // ms (최근 60프레임 평균)
  
  // 렌더링 메트릭
  drawCalls: number;
  triangles: number;
  textures: number;
  geometries: number;
  
  // 메모리 메트릭
  memoryUsage: number;         // MB (JS Heap)
  estimatedVRAM: number;       // MB (추정)
  
  // 상세 타이밍 (ms)
  updateTime: number;          // 로직 업데이트
  renderTime: number;          // 렌더링
  physicsTime: number;         // 물리 연산
  animationTime: number;       // 애니메이션
  
  // 유닛 관련
  totalUnits: number;
  visibleUnits: number;
  culledUnits: number;
  
  // LOD 분포
  lodDistribution: Record<number, number>;
  
  // 추가 정보
  timestamp: number;
  frameNumber: number;
}

/** 성능 경고 레벨 */
export type PerformanceWarningLevel = 'normal' | 'warning' | 'critical';

/** 성능 경고 */
export interface PerformanceWarning {
  level: PerformanceWarningLevel;
  metric: keyof PerformanceMetrics;
  message: string;
  value: number;
  threshold: number;
}

/** 성능 모니터 설정 */
export interface PerformanceMonitorConfig {
  /** 샘플 크기 (평균 계산용) */
  sampleSize: number;
  /** 경고 콜백 */
  onWarning?: (warning: PerformanceWarning) => void;
  /** 통계 콜백 (매 프레임) */
  onStats?: (metrics: PerformanceMetrics) => void;
  /** 경고 임계값 */
  thresholds: {
    fps: { warning: number; critical: number };
    frameTime: { warning: number; critical: number };
    drawCalls: { warning: number; critical: number };
    memory: { warning: number; critical: number };
  };
  /** 디버그 오버레이 활성화 */
  enableOverlay: boolean;
}

// ===== 기본 설정 =====

const DEFAULT_CONFIG: PerformanceMonitorConfig = {
  sampleSize: 60,
  thresholds: {
    fps: { warning: 45, critical: 30 },
    frameTime: { warning: 22, critical: 33 },
    drawCalls: { warning: 80, critical: 150 },
    memory: { warning: 400, critical: 600 },
  },
  enableOverlay: false,
};

// ===== 메인 클래스 =====

export class PerformanceMonitor {
  private config: PerformanceMonitorConfig;
  private renderer: THREE.WebGLRenderer | null = null;
  
  // 메트릭스
  private metrics: PerformanceMetrics;
  
  // FPS 계산
  private frameTimeSamples: number[] = [];
  private lastFrameTime: number = 0;
  private frameCount: number = 0;
  
  // 타이밍 마커
  private timingMarkers: Map<string, number> = new Map();
  private timingResults: Map<string, number> = new Map();
  
  // 경고 상태
  private lastWarnings: Map<string, number> = new Map();
  private warningCooldown: number = 1000; // ms
  
  // 디버그 오버레이
  private overlayElement: HTMLElement | null = null;
  
  // 히스토리 (차트용)
  private metricsHistory: PerformanceMetrics[] = [];
  private maxHistoryLength: number = 300; // 5초 @ 60fps
  
  constructor(config?: Partial<PerformanceMonitorConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    
    this.metrics = this.createEmptyMetrics();
    
    if (this.config.enableOverlay) {
      this.createOverlay();
    }
  }
  
  // ===== 초기화 =====
  
  /**
   * Three.js 렌더러 연결
   */
  setRenderer(renderer: THREE.WebGLRenderer): void {
    this.renderer = renderer;
  }
  
  private createEmptyMetrics(): PerformanceMetrics {
    return {
      fps: 60,
      frameTime: 16.67,
      averageFrameTime: 16.67,
      drawCalls: 0,
      triangles: 0,
      textures: 0,
      geometries: 0,
      memoryUsage: 0,
      estimatedVRAM: 0,
      updateTime: 0,
      renderTime: 0,
      physicsTime: 0,
      animationTime: 0,
      totalUnits: 0,
      visibleUnits: 0,
      culledUnits: 0,
      lodDistribution: {},
      timestamp: Date.now(),
      frameNumber: 0,
    };
  }
  
  // ===== 타이밍 API =====
  
  /**
   * 타이밍 마커 시작
   */
  startTiming(label: string): void {
    this.timingMarkers.set(label, performance.now());
  }
  
  /**
   * 타이밍 마커 종료
   */
  endTiming(label: string): number {
    const startTime = this.timingMarkers.get(label);
    if (startTime === undefined) {
      console.warn(`[PerformanceMonitor] 타이밍 마커 '${label}' 없음`);
      return 0;
    }
    
    const elapsed = performance.now() - startTime;
    this.timingResults.set(label, elapsed);
    this.timingMarkers.delete(label);
    
    return elapsed;
  }
  
  /**
   * 타이밍 결과 조회
   */
  getTiming(label: string): number {
    return this.timingResults.get(label) ?? 0;
  }
  
  // ===== 프레임 업데이트 =====
  
  /**
   * 프레임 시작 시 호출
   */
  beginFrame(): void {
    this.lastFrameTime = performance.now();
    this.startTiming('frame');
  }
  
  /**
   * 프레임 종료 시 호출
   */
  endFrame(): void {
    const now = performance.now();
    const frameTime = now - this.lastFrameTime;
    this.frameCount++;
    
    // 프레임 타임 샘플 추가
    this.frameTimeSamples.push(frameTime);
    if (this.frameTimeSamples.length > this.config.sampleSize) {
      this.frameTimeSamples.shift();
    }
    
    // 메트릭스 업데이트
    this.updateMetrics(frameTime);
    
    // 경고 체크
    this.checkWarnings();
    
    // 콜백 호출
    if (this.config.onStats) {
      this.config.onStats(this.metrics);
    }
    
    // 히스토리 저장
    this.metricsHistory.push({ ...this.metrics });
    if (this.metricsHistory.length > this.maxHistoryLength) {
      this.metricsHistory.shift();
    }
    
    // 오버레이 업데이트
    if (this.overlayElement) {
      this.updateOverlay();
    }
    
    this.endTiming('frame');
  }
  
  private updateMetrics(frameTime: number): void {
    // 기본 메트릭
    this.metrics.frameTime = frameTime;
    this.metrics.fps = Math.round(1000 / frameTime);
    this.metrics.averageFrameTime = this.calculateAverageFrameTime();
    this.metrics.timestamp = Date.now();
    this.metrics.frameNumber = this.frameCount;
    
    // 상세 타이밍
    this.metrics.updateTime = this.getTiming('update');
    this.metrics.renderTime = this.getTiming('render');
    this.metrics.physicsTime = this.getTiming('physics');
    this.metrics.animationTime = this.getTiming('animation');
    
    // 렌더러 정보
    if (this.renderer) {
      const info = this.renderer.info;
      this.metrics.drawCalls = info.render.calls;
      this.metrics.triangles = info.render.triangles;
      this.metrics.textures = info.memory.textures;
      this.metrics.geometries = info.memory.geometries;
      
      // VRAM 추정 (대략적)
      this.metrics.estimatedVRAM = this.estimateVRAM(info);
    }
    
    // 메모리 사용량
    this.metrics.memoryUsage = this.getMemoryUsage();
    
    // 컬링 유닛 계산
    this.metrics.culledUnits = this.metrics.totalUnits - this.metrics.visibleUnits;
  }
  
  private calculateAverageFrameTime(): number {
    if (this.frameTimeSamples.length === 0) return 16.67;
    
    const sum = this.frameTimeSamples.reduce((a, b) => a + b, 0);
    return sum / this.frameTimeSamples.length;
  }
  
  private getMemoryUsage(): number {
    // Chrome의 performance.memory API 사용
    const perf = performance as Performance & { 
      memory?: { 
        usedJSHeapSize: number;
        totalJSHeapSize: number;
      } 
    };
    
    if (perf.memory) {
      return Math.round(perf.memory.usedJSHeapSize / 1024 / 1024);
    }
    
    return 0;
  }
  
  private estimateVRAM(info: THREE.WebGLInfo): number {
    // VRAM 추정 (매우 대략적)
    // 텍스처: 평균 2MB, 지오메트리: 평균 0.5MB
    const textureVRAM = info.memory.textures * 2;
    const geometryVRAM = info.memory.geometries * 0.5;
    return Math.round(textureVRAM + geometryVRAM);
  }
  
  // ===== 유닛 정보 업데이트 =====
  
  /**
   * 유닛 통계 업데이트
   */
  setUnitStats(total: number, visible: number, lodDistribution: Record<number, number>): void {
    this.metrics.totalUnits = total;
    this.metrics.visibleUnits = visible;
    this.metrics.lodDistribution = lodDistribution;
  }
  
  // ===== 경고 시스템 =====
  
  private checkWarnings(): void {
    const now = Date.now();
    const warnings: PerformanceWarning[] = [];
    
    // FPS 경고
    if (this.metrics.fps < this.config.thresholds.fps.critical) {
      warnings.push({
        level: 'critical',
        metric: 'fps',
        message: `심각: FPS가 ${this.metrics.fps}로 떨어졌습니다`,
        value: this.metrics.fps,
        threshold: this.config.thresholds.fps.critical,
      });
    } else if (this.metrics.fps < this.config.thresholds.fps.warning) {
      warnings.push({
        level: 'warning',
        metric: 'fps',
        message: `경고: FPS가 ${this.metrics.fps}로 낮습니다`,
        value: this.metrics.fps,
        threshold: this.config.thresholds.fps.warning,
      });
    }
    
    // 프레임 타임 경고
    if (this.metrics.frameTime > this.config.thresholds.frameTime.critical) {
      warnings.push({
        level: 'critical',
        metric: 'frameTime',
        message: `심각: 프레임 타임이 ${this.metrics.frameTime.toFixed(1)}ms입니다`,
        value: this.metrics.frameTime,
        threshold: this.config.thresholds.frameTime.critical,
      });
    }
    
    // 드로우콜 경고
    if (this.metrics.drawCalls > this.config.thresholds.drawCalls.critical) {
      warnings.push({
        level: 'critical',
        metric: 'drawCalls',
        message: `심각: 드로우콜이 ${this.metrics.drawCalls}개입니다`,
        value: this.metrics.drawCalls,
        threshold: this.config.thresholds.drawCalls.critical,
      });
    } else if (this.metrics.drawCalls > this.config.thresholds.drawCalls.warning) {
      warnings.push({
        level: 'warning',
        metric: 'drawCalls',
        message: `경고: 드로우콜이 ${this.metrics.drawCalls}개로 많습니다`,
        value: this.metrics.drawCalls,
        threshold: this.config.thresholds.drawCalls.warning,
      });
    }
    
    // 메모리 경고
    if (this.metrics.memoryUsage > this.config.thresholds.memory.critical) {
      warnings.push({
        level: 'critical',
        metric: 'memoryUsage',
        message: `심각: 메모리 사용량이 ${this.metrics.memoryUsage}MB입니다`,
        value: this.metrics.memoryUsage,
        threshold: this.config.thresholds.memory.critical,
      });
    } else if (this.metrics.memoryUsage > this.config.thresholds.memory.warning) {
      warnings.push({
        level: 'warning',
        metric: 'memoryUsage',
        message: `경고: 메모리 사용량이 ${this.metrics.memoryUsage}MB로 높습니다`,
        value: this.metrics.memoryUsage,
        threshold: this.config.thresholds.memory.warning,
      });
    }
    
    // 경고 발송 (쿨다운 적용)
    for (const warning of warnings) {
      const lastTime = this.lastWarnings.get(warning.metric) ?? 0;
      if (now - lastTime > this.warningCooldown) {
        this.lastWarnings.set(warning.metric, now);
        this.config.onWarning?.(warning);
      }
    }
  }
  
  // ===== 성능 레벨 판단 =====
  
  /**
   * 현재 성능 레벨 반환
   */
  getPerformanceLevel(): PerformanceWarningLevel {
    const avgFPS = 1000 / this.metrics.averageFrameTime;
    
    if (avgFPS < this.config.thresholds.fps.critical) {
      return 'critical';
    } else if (avgFPS < this.config.thresholds.fps.warning) {
      return 'warning';
    }
    
    return 'normal';
  }
  
  /**
   * 품질 조절이 필요한지 확인
   */
  shouldAdjustQuality(): { needed: boolean; direction: 'up' | 'down' | 'none' } {
    const level = this.getPerformanceLevel();
    
    if (level === 'critical') {
      return { needed: true, direction: 'down' };
    } else if (level === 'warning') {
      return { needed: true, direction: 'down' };
    }
    
    // FPS가 목표치보다 충분히 높으면 품질 상향 가능
    const avgFPS = 1000 / this.metrics.averageFrameTime;
    if (avgFPS > 65 && this.metrics.drawCalls < 50) {
      return { needed: true, direction: 'up' };
    }
    
    return { needed: false, direction: 'none' };
  }
  
  // ===== 메트릭스 조회 =====
  
  /**
   * 현재 메트릭스 반환
   */
  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }
  
  /**
   * 히스토리 반환
   */
  getHistory(): PerformanceMetrics[] {
    return [...this.metricsHistory];
  }
  
  /**
   * 성능 리포트 생성
   */
  generateReport(): string {
    const m = this.metrics;
    const avgFPS = 1000 / m.averageFrameTime;
    
    return `
=== 성능 리포트 ===
시간: ${new Date(m.timestamp).toLocaleString()}
프레임: #${m.frameNumber}

📊 기본 메트릭
  FPS: ${m.fps} (평균: ${avgFPS.toFixed(1)})
  프레임 타임: ${m.frameTime.toFixed(2)}ms (평균: ${m.averageFrameTime.toFixed(2)}ms)

🎨 렌더링
  드로우콜: ${m.drawCalls}
  삼각형: ${m.triangles.toLocaleString()}
  텍스처: ${m.textures}
  지오메트리: ${m.geometries}

💾 메모리
  JS Heap: ${m.memoryUsage}MB
  예상 VRAM: ${m.estimatedVRAM}MB

⏱️ 타이밍
  업데이트: ${m.updateTime.toFixed(2)}ms
  렌더링: ${m.renderTime.toFixed(2)}ms
  물리: ${m.physicsTime.toFixed(2)}ms
  애니메이션: ${m.animationTime.toFixed(2)}ms

🎖️ 유닛
  전체: ${m.totalUnits}
  표시: ${m.visibleUnits}
  컬링: ${m.culledUnits}

📈 LOD 분포
${Object.entries(m.lodDistribution)
  .map(([level, count]) => `  LOD ${level}: ${count}`)
  .join('\n')}
===================
    `.trim();
  }
  
  /**
   * 콘솔에 리포트 출력
   */
  logReport(): void {
    console.log(this.generateReport());
  }
  
  // ===== 디버그 오버레이 =====
  
  private createOverlay(): void {
    if (typeof document === 'undefined') return;
    
    this.overlayElement = document.createElement('div');
    this.overlayElement.id = 'performance-overlay';
    this.overlayElement.style.cssText = `
      position: fixed;
      top: 10px;
      left: 10px;
      background: rgba(0, 0, 0, 0.8);
      color: #0f0;
      font-family: 'Courier New', monospace;
      font-size: 12px;
      padding: 10px;
      border-radius: 4px;
      z-index: 10000;
      pointer-events: none;
      min-width: 200px;
    `;
    
    document.body.appendChild(this.overlayElement);
  }
  
  private updateOverlay(): void {
    if (!this.overlayElement) return;
    
    const m = this.metrics;
    const level = this.getPerformanceLevel();
    const levelColor = level === 'critical' ? '#f00' : level === 'warning' ? '#ff0' : '#0f0';
    
    this.overlayElement.innerHTML = `
      <div style="color: ${levelColor}; font-weight: bold;">
        FPS: ${m.fps} | ${m.frameTime.toFixed(1)}ms
      </div>
      <div>Draw: ${m.drawCalls} | Tri: ${(m.triangles / 1000).toFixed(1)}K</div>
      <div>Mem: ${m.memoryUsage}MB | VRAM: ~${m.estimatedVRAM}MB</div>
      <div>Units: ${m.visibleUnits}/${m.totalUnits}</div>
      <div style="font-size: 10px; color: #888;">
        U:${m.updateTime.toFixed(1)} R:${m.renderTime.toFixed(1)} P:${m.physicsTime.toFixed(1)}
      </div>
    `;
  }
  
  /**
   * 오버레이 표시/숨김 토글
   */
  toggleOverlay(show?: boolean): void {
    if (show === undefined) {
      show = !this.overlayElement;
    }
    
    if (show && !this.overlayElement) {
      this.createOverlay();
    } else if (!show && this.overlayElement) {
      this.overlayElement.remove();
      this.overlayElement = null;
    }
  }
  
  // ===== 정리 =====
  
  dispose(): void {
    if (this.overlayElement) {
      this.overlayElement.remove();
      this.overlayElement = null;
    }
    
    this.frameTimeSamples = [];
    this.metricsHistory = [];
    this.timingMarkers.clear();
    this.timingResults.clear();
    this.lastWarnings.clear();
    this.renderer = null;
    
    console.log('🧹 PerformanceMonitor 정리 완료');
  }
}

// ===== 싱글톤 인스턴스 =====

let globalMonitor: PerformanceMonitor | null = null;

/**
 * 전역 성능 모니터 가져오기
 */
export function getPerformanceMonitor(config?: Partial<PerformanceMonitorConfig>): PerformanceMonitor {
  if (!globalMonitor) {
    globalMonitor = new PerformanceMonitor(config);
  }
  return globalMonitor;
}

/**
 * 전역 성능 모니터 초기화
 */
export function resetPerformanceMonitor(): void {
  if (globalMonitor) {
    globalMonitor.dispose();
    globalMonitor = null;
  }
}

export default PerformanceMonitor;





