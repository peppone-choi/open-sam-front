/**
 * MobileOptimizer.ts
 * 
 * 모바일 최적화 시스템
 * - 디바이스 감지 및 분류
 * - 해상도 스케일링
 * - 터치 입력 최적화
 * - 배터리 절약 모드
 * - 단순화 셰이더
 * - 모바일 전용 품질 설정
 */

import * as THREE from 'three';
import { QualityManager, QualityPreset, QualitySettings, getQualityManager } from './QualityManager';

// ===== 타입 정의 =====

/** 디바이스 타입 */
export type DeviceType = 'desktop' | 'tablet' | 'mobile' | 'tv' | 'unknown';

/** 디바이스 성능 티어 */
export type PerformanceTier = 'high' | 'medium' | 'low' | 'veryLow';

/** 배터리 상태 */
export interface BatteryStatus {
  charging: boolean;
  level: number;         // 0-1
  chargingTime: number;  // 초
  dischargingTime: number;
}

/** 네트워크 상태 */
export interface NetworkStatus {
  online: boolean;
  type: 'wifi' | 'cellular' | 'ethernet' | 'unknown';
  effectiveType: '4g' | '3g' | '2g' | 'slow-2g' | 'unknown';
  downlink: number;      // Mbps
  rtt: number;           // ms
  saveData: boolean;
}

/** 디바이스 정보 */
export interface DeviceInfo {
  type: DeviceType;
  performanceTier: PerformanceTier;
  os: 'ios' | 'android' | 'windows' | 'macos' | 'linux' | 'unknown';
  osVersion: string;
  browser: string;
  browserVersion: string;
  screenWidth: number;
  screenHeight: number;
  pixelRatio: number;
  touchPoints: number;
  memory: number;        // GB
  hardwareConcurrency: number;
  gpu: string;
  supportsWebGL2: boolean;
  supportsInstancing: boolean;
  supportsFloatTextures: boolean;
}

/** 모바일 최적화 설정 */
export interface MobileOptimizerConfig {
  /** 자동 디바이스 감지 */
  autoDetect: boolean;
  /** 터치 쓰로틀링 (ms) */
  touchThrottling: number;
  /** 배터리 절약 활성화 임계값 (0-1) */
  batterySaveThreshold: number;
  /** 저전력 모드에서 FPS 제한 */
  lowPowerFpsLimit: number;
  /** 해상도 스케일 최소값 */
  minResolutionScale: number;
  /** 해상도 스케일 최대값 */
  maxResolutionScale: number;
  /** 메모리 제한 (MB) */
  memoryLimit: number;
  /** 최대 유닛 수 (모바일) */
  maxUnits: number;
  /** 간소화 렌더링 활성화 */
  simplifiedRendering: boolean;
}

/** 모바일 최적화 상태 */
export interface MobileOptimizerState {
  isActive: boolean;
  batterySaveMode: boolean;
  lowMemoryMode: boolean;
  currentResolutionScale: number;
  currentFpsLimit: number;
  networkOptimized: boolean;
}

// ===== 기본 설정 =====

const DEFAULT_CONFIG: MobileOptimizerConfig = {
  autoDetect: true,
  touchThrottling: 16, // ~60fps
  batterySaveThreshold: 0.2, // 20%
  lowPowerFpsLimit: 30,
  minResolutionScale: 0.5,
  maxResolutionScale: 1,
  memoryLimit: 300, // MB
  maxUnits: 500,
  simplifiedRendering: true,
};

// ===== 성능 티어별 설정 =====

const TIER_QUALITY_MAP: Record<PerformanceTier, QualityPreset> = {
  high: 'medium',
  medium: 'low',
  low: 'potato',
  veryLow: 'potato',
};

const TIER_SETTINGS: Record<PerformanceTier, Partial<QualitySettings>> = {
  high: {
    maxVisibleUnits: 500,
    animationQuality: 'reduced',
    particleMultiplier: 0.5,
    shadowQuality: 'low',
  },
  medium: {
    maxVisibleUnits: 300,
    animationQuality: 'minimal',
    particleMultiplier: 0.25,
    shadowQuality: 'off',
  },
  low: {
    maxVisibleUnits: 150,
    animationQuality: 'off',
    particleMultiplier: 0,
    shadowQuality: 'off',
    postProcessing: false,
    weatherEffects: false,
  },
  veryLow: {
    maxVisibleUnits: 100,
    animationQuality: 'off',
    particleMultiplier: 0,
    shadowQuality: 'off',
    postProcessing: false,
    weatherEffects: false,
    antialias: false,
  },
};

// ===== 메인 클래스 =====

export class MobileOptimizer {
  private config: MobileOptimizerConfig;
  private qualityManager: QualityManager;
  private renderer: THREE.WebGLRenderer | null = null;
  
  // 디바이스 정보
  private deviceInfo: DeviceInfo;
  private batteryStatus: BatteryStatus | null = null;
  private networkStatus: NetworkStatus | null = null;
  
  // 상태
  private state: MobileOptimizerState = {
    isActive: false,
    batterySaveMode: false,
    lowMemoryMode: false,
    currentResolutionScale: 1,
    currentFpsLimit: 60,
    networkOptimized: false,
  };
  
  // 터치 관련
  private lastTouchTime: number = 0;
  private touchEventQueue: TouchEvent[] = [];
  
  // 콜백
  private onBatterySaveModeChange?: (enabled: boolean) => void;
  private onResolutionScaleChange?: (scale: number) => void;
  private onFpsLimitChange?: (fps: number) => void;
  
  constructor(config?: Partial<MobileOptimizerConfig>, qualityManager?: QualityManager) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.qualityManager = qualityManager ?? getQualityManager();
    
    // 디바이스 정보 수집
    this.deviceInfo = this.detectDeviceInfo();
    
    // 모바일/태블릿이면 활성화
    if (this.deviceInfo.type === 'mobile' || this.deviceInfo.type === 'tablet') {
      this.activate();
    }
    
    console.log(`📱 MobileOptimizer 초기화: ${this.deviceInfo.type} (${this.deviceInfo.performanceTier})`);
  }
  
  // ===== 디바이스 감지 =====
  
  private detectDeviceInfo(): DeviceInfo {
    const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
    
    // OS 감지
    const os = this.detectOS(ua);
    const osVersion = this.detectOSVersion(ua, os);
    
    // 브라우저 감지
    const browser = this.detectBrowser(ua);
    const browserVersion = this.detectBrowserVersion(ua, browser);
    
    // 화면 정보
    const screenWidth = typeof window !== 'undefined' ? window.screen.width : 1920;
    const screenHeight = typeof window !== 'undefined' ? window.screen.height : 1080;
    const pixelRatio = typeof window !== 'undefined' ? window.devicePixelRatio : 1;
    
    // 터치 지원
    const touchPoints = typeof navigator !== 'undefined' ? navigator.maxTouchPoints : 0;
    
    // 디바이스 타입 판단
    const type = this.determineDeviceType(ua, screenWidth, touchPoints);
    
    // 성능 정보
    const memory = this.detectMemory();
    const hardwareConcurrency = typeof navigator !== 'undefined' 
      ? navigator.hardwareConcurrency : 4;
    
    // GPU 정보
    const gpuInfo = this.detectGPU();
    
    // 성능 티어 결정
    const performanceTier = this.determinePerformanceTier(
      type,
      memory,
      hardwareConcurrency,
      gpuInfo.tier
    );
    
    return {
      type,
      performanceTier,
      os,
      osVersion,
      browser,
      browserVersion,
      screenWidth,
      screenHeight,
      pixelRatio,
      touchPoints,
      memory,
      hardwareConcurrency,
      gpu: gpuInfo.name,
      supportsWebGL2: gpuInfo.webgl2,
      supportsInstancing: gpuInfo.instancing,
      supportsFloatTextures: gpuInfo.floatTextures,
    };
  }
  
  private detectOS(ua: string): DeviceInfo['os'] {
    if (/iPad|iPhone|iPod/.test(ua)) return 'ios';
    if (/Android/.test(ua)) return 'android';
    if (/Windows/.test(ua)) return 'windows';
    if (/Mac OS/.test(ua)) return 'macos';
    if (/Linux/.test(ua)) return 'linux';
    return 'unknown';
  }
  
  private detectOSVersion(ua: string, os: DeviceInfo['os']): string {
    const patterns: Record<string, RegExp> = {
      ios: /OS (\d+[._]\d+)/,
      android: /Android (\d+(\.\d+)?)/,
      windows: /Windows NT (\d+\.\d+)/,
      macos: /Mac OS X (\d+[._]\d+)/,
    };
    
    const pattern = patterns[os];
    if (pattern) {
      const match = ua.match(pattern);
      if (match) return match[1].replace('_', '.');
    }
    
    return 'unknown';
  }
  
  private detectBrowser(ua: string): string {
    if (/Chrome/.test(ua) && !/Edg/.test(ua)) return 'chrome';
    if (/Safari/.test(ua) && !/Chrome/.test(ua)) return 'safari';
    if (/Firefox/.test(ua)) return 'firefox';
    if (/Edg/.test(ua)) return 'edge';
    if (/OPR|Opera/.test(ua)) return 'opera';
    return 'unknown';
  }
  
  private detectBrowserVersion(ua: string, browser: string): string {
    const patterns: Record<string, RegExp> = {
      chrome: /Chrome\/(\d+)/,
      safari: /Version\/(\d+)/,
      firefox: /Firefox\/(\d+)/,
      edge: /Edg\/(\d+)/,
      opera: /OPR\/(\d+)|Opera\/(\d+)/,
    };
    
    const pattern = patterns[browser];
    if (pattern) {
      const match = ua.match(pattern);
      if (match) return match[1] || match[2] || 'unknown';
    }
    
    return 'unknown';
  }
  
  private determineDeviceType(ua: string, screenWidth: number, touchPoints: number): DeviceType {
    // 모바일 UA 체크
    if (/Android.*Mobile|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua)) {
      return 'mobile';
    }
    
    // 태블릿 체크
    if (/iPad|Android(?!.*Mobile)/i.test(ua) || (touchPoints > 0 && screenWidth >= 768)) {
      return 'tablet';
    }
    
    // TV 체크
    if (/TV|SmartTV|SMART-TV/i.test(ua)) {
      return 'tv';
    }
    
    // 터치 있고 작은 화면이면 모바일
    if (touchPoints > 0 && screenWidth < 768) {
      return 'mobile';
    }
    
    return 'desktop';
  }
  
  private detectMemory(): number {
    const nav = navigator as Navigator & { deviceMemory?: number };
    return nav.deviceMemory ?? 4;
  }
  
  private detectGPU(): {
    name: string;
    tier: 'high' | 'medium' | 'low';
    webgl2: boolean;
    instancing: boolean;
    floatTextures: boolean;
  } {
    if (typeof document === 'undefined') {
      return {
        name: 'unknown',
        tier: 'medium',
        webgl2: true,
        instancing: true,
        floatTextures: true,
      };
    }
    
    const canvas = document.createElement('canvas');
    const gl2 = canvas.getContext('webgl2');
    const gl = gl2 || canvas.getContext('webgl');
    
    let gpuName = 'unknown';
    let tier: 'high' | 'medium' | 'low' = 'medium';
    let instancing = false;
    let floatTextures = false;
    
    if (gl) {
      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      if (debugInfo) {
        gpuName = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
      }
      
      // 인스턴싱 지원 확인
      if (gl2) {
        instancing = true;
      } else {
        instancing = !!gl.getExtension('ANGLE_instanced_arrays');
      }
      
      // Float 텍스처 지원
      floatTextures = !!gl.getExtension('OES_texture_float');
      
      // GPU 티어 결정
      const gpuLower = gpuName.toLowerCase();
      
      const highEndPatterns = ['apple gpu', 'adreno 6', 'adreno 7', 'mali-g7', 'mali-g8'];
      const lowEndPatterns = ['adreno 3', 'adreno 4', 'mali-4', 'mali-t', 'powervr', 'videocore'];
      
      for (const pattern of highEndPatterns) {
        if (gpuLower.includes(pattern)) {
          tier = 'high';
          break;
        }
      }
      
      for (const pattern of lowEndPatterns) {
        if (gpuLower.includes(pattern)) {
          tier = 'low';
          break;
        }
      }
    }
    
    return {
      name: gpuName,
      tier,
      webgl2: !!gl2,
      instancing,
      floatTextures,
    };
  }
  
  private determinePerformanceTier(
    type: DeviceType,
    memory: number,
    cores: number,
    gpuTier: 'high' | 'medium' | 'low'
  ): PerformanceTier {
    // 데스크톱은 최소 medium
    if (type === 'desktop') {
      if (gpuTier === 'high' && memory >= 8 && cores >= 8) return 'high';
      return 'medium';
    }
    
    // 모바일/태블릿
    if (gpuTier === 'high' && memory >= 6) return 'high';
    if (gpuTier === 'medium' || memory >= 4) return 'medium';
    if (gpuTier === 'low' || memory >= 2) return 'low';
    
    return 'veryLow';
  }
  
  // ===== 활성화/비활성화 =====
  
  /**
   * 모바일 최적화 활성화
   */
  activate(): void {
    if (this.state.isActive) return;
    
    this.state.isActive = true;
    
    // 품질 설정 적용
    const qualityPreset = TIER_QUALITY_MAP[this.deviceInfo.performanceTier];
    this.qualityManager.setPreset(qualityPreset);
    
    // 티어별 추가 설정
    const tierSettings = TIER_SETTINGS[this.deviceInfo.performanceTier];
    this.qualityManager.setSettings(tierSettings);
    
    // 배터리 모니터링 시작
    this.startBatteryMonitoring();
    
    // 네트워크 모니터링 시작
    this.startNetworkMonitoring();
    
    // 해상도 스케일 적용
    this.applyResolutionScale();
    
    console.log(`📱 모바일 최적화 활성화: ${qualityPreset} 프리셋`);
  }
  
  /**
   * 모바일 최적화 비활성화
   */
  deactivate(): void {
    this.state.isActive = false;
    this.state.batterySaveMode = false;
    
    // 원래 품질로 복원
    this.qualityManager.resetSettings();
    
    console.log('📱 모바일 최적화 비활성화');
  }
  
  // ===== 렌더러 연결 =====
  
  /**
   * Three.js 렌더러 연결
   */
  setRenderer(renderer: THREE.WebGLRenderer): void {
    this.renderer = renderer;
    
    if (this.state.isActive) {
      this.applyResolutionScale();
    }
  }
  
  // ===== 해상도 스케일링 =====
  
  private applyResolutionScale(): void {
    if (!this.renderer) return;
    
    // 성능 티어에 따른 스케일 결정
    let scale = 1;
    
    switch (this.deviceInfo.performanceTier) {
      case 'high':
        scale = 1;
        break;
      case 'medium':
        scale = 0.85;
        break;
      case 'low':
        scale = 0.7;
        break;
      case 'veryLow':
        scale = 0.5;
        break;
    }
    
    // 배터리 절약 모드면 추가 감소
    if (this.state.batterySaveMode) {
      scale *= 0.8;
    }
    
    // 범위 제한
    scale = Math.max(this.config.minResolutionScale, Math.min(this.config.maxResolutionScale, scale));
    
    // 적용
    const dpr = this.deviceInfo.pixelRatio * scale;
    this.renderer.setPixelRatio(Math.min(dpr, 2));
    
    this.state.currentResolutionScale = scale;
    this.onResolutionScaleChange?.(scale);
  }
  
  /**
   * 해상도 스케일 수동 설정
   */
  setResolutionScale(scale: number): void {
    this.state.currentResolutionScale = Math.max(
      this.config.minResolutionScale,
      Math.min(this.config.maxResolutionScale, scale)
    );
    
    if (this.renderer) {
      const dpr = this.deviceInfo.pixelRatio * this.state.currentResolutionScale;
      this.renderer.setPixelRatio(Math.min(dpr, 2));
    }
    
    this.onResolutionScaleChange?.(this.state.currentResolutionScale);
  }
  
  // ===== 배터리 모니터링 =====
  
  private async startBatteryMonitoring(): Promise<void> {
    if (!('getBattery' in navigator)) return;
    
    try {
      const battery = await (navigator as Navigator & { 
        getBattery: () => Promise<BatteryManager> 
      }).getBattery();
      
      const updateBattery = () => {
        this.batteryStatus = {
          charging: battery.charging,
          level: battery.level,
          chargingTime: battery.chargingTime,
          dischargingTime: battery.dischargingTime,
        };
        
        this.checkBatterySaveMode();
      };
      
      battery.addEventListener('chargingchange', updateBattery);
      battery.addEventListener('levelchange', updateBattery);
      
      updateBattery();
    } catch (e) {
      console.warn('배터리 API 사용 불가:', e);
    }
  }
  
  private checkBatterySaveMode(): void {
    if (!this.batteryStatus) return;
    
    const shouldEnable = 
      !this.batteryStatus.charging && 
      this.batteryStatus.level <= this.config.batterySaveThreshold;
    
    if (shouldEnable !== this.state.batterySaveMode) {
      this.state.batterySaveMode = shouldEnable;
      
      if (shouldEnable) {
        this.enableBatterySaveMode();
      } else {
        this.disableBatterySaveMode();
      }
      
      this.onBatterySaveModeChange?.(shouldEnable);
    }
  }
  
  private enableBatterySaveMode(): void {
    console.log('🔋 배터리 절약 모드 활성화');
    
    // FPS 제한
    this.state.currentFpsLimit = this.config.lowPowerFpsLimit;
    this.onFpsLimitChange?.(this.config.lowPowerFpsLimit);
    
    // 품질 추가 저하
    this.qualityManager.setSettings({
      animationQuality: 'off',
      particleMultiplier: 0,
      weatherEffects: false,
      postProcessing: false,
    });
    
    // 해상도 저하
    this.applyResolutionScale();
  }
  
  private disableBatterySaveMode(): void {
    console.log('🔋 배터리 절약 모드 비활성화');
    
    // FPS 제한 해제
    this.state.currentFpsLimit = 60;
    this.onFpsLimitChange?.(60);
    
    // 품질 복원
    const tierSettings = TIER_SETTINGS[this.deviceInfo.performanceTier];
    this.qualityManager.setSettings(tierSettings);
    
    // 해상도 복원
    this.applyResolutionScale();
  }
  
  // ===== 네트워크 모니터링 =====
  
  private startNetworkMonitoring(): void {
    if (!('connection' in navigator)) return;
    
    const connection = (navigator as Navigator & {
      connection: NetworkInformation;
    }).connection;
    
    const updateNetwork = () => {
      this.networkStatus = {
        online: navigator.onLine,
        type: this.getConnectionType(connection),
        effectiveType: (connection.effectiveType as NetworkStatus['effectiveType']) || 'unknown',
        downlink: connection.downlink || 0,
        rtt: connection.rtt || 0,
        saveData: connection.saveData || false,
      };
      
      this.checkNetworkOptimization();
    };
    
    connection.addEventListener('change', updateNetwork);
    window.addEventListener('online', updateNetwork);
    window.addEventListener('offline', updateNetwork);
    
    updateNetwork();
  }
  
  private getConnectionType(conn: NetworkInformation): NetworkStatus['type'] {
    if (conn.type === 'wifi') return 'wifi';
    if (conn.type === 'cellular') return 'cellular';
    if (conn.type === 'ethernet') return 'ethernet';
    return 'unknown';
  }
  
  private checkNetworkOptimization(): void {
    if (!this.networkStatus) return;
    
    // 데이터 절약 모드 또는 느린 연결
    const shouldOptimize = 
      this.networkStatus.saveData ||
      this.networkStatus.effectiveType === 'slow-2g' ||
      this.networkStatus.effectiveType === '2g';
    
    this.state.networkOptimized = shouldOptimize;
  }
  
  // ===== 터치 최적화 =====
  
  /**
   * 터치 이벤트 쓰로틀링
   */
  throttleTouchEvent(event: TouchEvent): TouchEvent | null {
    const now = performance.now();
    
    if (now - this.lastTouchTime < this.config.touchThrottling) {
      this.touchEventQueue.push(event);
      return null;
    }
    
    this.lastTouchTime = now;
    this.touchEventQueue = [];
    return event;
  }
  
  /**
   * 터치 이벤트 핸들러 래퍼
   */
  wrapTouchHandler<T extends (event: TouchEvent) => void>(handler: T): T {
    return ((event: TouchEvent) => {
      const throttled = this.throttleTouchEvent(event);
      if (throttled) {
        handler(throttled);
      }
    }) as T;
  }
  
  // ===== 상태 및 정보 =====
  
  /**
   * 디바이스 정보 반환
   */
  getDeviceInfo(): DeviceInfo {
    return { ...this.deviceInfo };
  }
  
  /**
   * 배터리 상태 반환
   */
  getBatteryStatus(): BatteryStatus | null {
    return this.batteryStatus ? { ...this.batteryStatus } : null;
  }
  
  /**
   * 네트워크 상태 반환
   */
  getNetworkStatus(): NetworkStatus | null {
    return this.networkStatus ? { ...this.networkStatus } : null;
  }
  
  /**
   * 현재 상태 반환
   */
  getState(): MobileOptimizerState {
    return { ...this.state };
  }
  
  /**
   * 모바일 디바이스인지 확인
   */
  isMobile(): boolean {
    return this.deviceInfo.type === 'mobile';
  }
  
  /**
   * 태블릿 디바이스인지 확인
   */
  isTablet(): boolean {
    return this.deviceInfo.type === 'tablet';
  }
  
  /**
   * 터치 지원 확인
   */
  isTouchDevice(): boolean {
    return this.deviceInfo.touchPoints > 0;
  }
  
  // ===== 콜백 설정 =====
  
  /**
   * 배터리 절약 모드 변경 콜백
   */
  setOnBatterySaveModeChange(callback: (enabled: boolean) => void): void {
    this.onBatterySaveModeChange = callback;
  }
  
  /**
   * 해상도 스케일 변경 콜백
   */
  setOnResolutionScaleChange(callback: (scale: number) => void): void {
    this.onResolutionScaleChange = callback;
  }
  
  /**
   * FPS 제한 변경 콜백
   */
  setOnFpsLimitChange(callback: (fps: number) => void): void {
    this.onFpsLimitChange = callback;
  }
  
  // ===== 설정 =====
  
  /**
   * 설정 변경
   */
  setConfig(config: Partial<MobileOptimizerConfig>): void {
    Object.assign(this.config, config);
  }
  
  /**
   * 설정 반환
   */
  getConfig(): MobileOptimizerConfig {
    return { ...this.config };
  }
  
  // ===== 리포트 =====
  
  /**
   * 디바이스 리포트 생성
   */
  generateReport(): string {
    const info = this.deviceInfo;
    const battery = this.batteryStatus;
    const network = this.networkStatus;
    
    return `
=== 모바일 최적화 리포트 ===
📱 디바이스
  타입: ${info.type}
  성능 티어: ${info.performanceTier}
  OS: ${info.os} ${info.osVersion}
  브라우저: ${info.browser} ${info.browserVersion}

📺 화면
  해상도: ${info.screenWidth}x${info.screenHeight}
  픽셀 비율: ${info.pixelRatio}
  터치 포인트: ${info.touchPoints}

💪 성능
  메모리: ${info.memory}GB
  코어: ${info.hardwareConcurrency}
  GPU: ${info.gpu}
  WebGL2: ${info.supportsWebGL2 ? '지원' : '미지원'}
  인스턴싱: ${info.supportsInstancing ? '지원' : '미지원'}

🔋 배터리
  충전 중: ${battery?.charging ?? 'N/A'}
  레벨: ${battery ? Math.round(battery.level * 100) + '%' : 'N/A'}
  절약 모드: ${this.state.batterySaveMode ? '활성화' : '비활성화'}

🌐 네트워크
  온라인: ${network?.online ?? 'N/A'}
  타입: ${network?.type ?? 'N/A'}
  속도: ${network?.effectiveType ?? 'N/A'}
  데이터 절약: ${network?.saveData ?? 'N/A'}

⚙️ 현재 상태
  활성화: ${this.state.isActive}
  해상도 스케일: ${(this.state.currentResolutionScale * 100).toFixed(0)}%
  FPS 제한: ${this.state.currentFpsLimit}
===========================
    `.trim();
  }
  
  // ===== 정리 =====
  
  dispose(): void {
    this.state.isActive = false;
    this.renderer = null;
    
    console.log('🧹 MobileOptimizer 정리 완료');
  }
}

// ===== 타입 확장 =====

interface BatteryManager {
  charging: boolean;
  level: number;
  chargingTime: number;
  dischargingTime: number;
  addEventListener(type: string, listener: () => void): void;
}

interface NetworkInformation {
  type?: string;
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
  saveData?: boolean;
  addEventListener(type: string, listener: () => void): void;
}

// ===== 싱글톤 =====

let globalMobileOptimizer: MobileOptimizer | null = null;

/**
 * 전역 모바일 최적화 인스턴스 가져오기
 */
export function getMobileOptimizer(config?: Partial<MobileOptimizerConfig>): MobileOptimizer {
  if (!globalMobileOptimizer) {
    globalMobileOptimizer = new MobileOptimizer(config);
  }
  return globalMobileOptimizer;
}

/**
 * 전역 모바일 최적화 인스턴스 초기화
 */
export function resetMobileOptimizer(): void {
  if (globalMobileOptimizer) {
    globalMobileOptimizer.dispose();
    globalMobileOptimizer = null;
  }
}

export default MobileOptimizer;





