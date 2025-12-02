/**
 * MemoryManager.ts
 * 
 * 메모리 관리 시스템
 * - 오브젝트 풀링 (유닛 메시, 파티클, 투사체)
 * - 텍스처 캐시
 * - 지오메트리 캐시
 * - 자동 정리 스케줄링
 * - 메모리 압박 감지
 */

import * as THREE from 'three';

// ===== 타입 정의 =====

/** 풀 아이템 */
interface PoolItem<T> {
  item: T;
  inUse: boolean;
  lastUsed: number;
  createTime: number;
}

/** 캐시 아이템 */
interface CacheItem<T> {
  item: T;
  size: number; // 바이트
  lastAccessed: number;
  accessCount: number;
}

/** 메모리 관리자 설정 */
export interface MemoryManagerConfig {
  /** 텍스처 캐시 최대 크기 (MB) */
  textureCacheSizeMB: number;
  /** 지오메트리 캐시 최대 크기 (MB) */
  geometryCacheSizeMB: number;
  /** 오브젝트 풀 기본 크기 */
  defaultPoolSize: number;
  /** 풀 최대 크기 */
  maxPoolSize: number;
  /** 정리 주기 (ms) */
  cleanupInterval: number;
  /** 미사용 시간 임계값 (ms) */
  unusedThreshold: number;
  /** 메모리 압박 임계값 (MB) */
  memoryPressureThreshold: number;
  /** 자동 정리 활성화 */
  autoCleanup: boolean;
}

/** 메모리 통계 */
export interface MemoryStats {
  // 캐시 통계
  textureCacheSize: number;     // MB
  textureCacheCount: number;
  geometryCacheSize: number;    // MB
  geometryCacheCount: number;
  
  // 풀 통계
  poolStats: Map<string, { total: number; inUse: number; available: number }>;
  
  // 전체 메모리
  estimatedUsage: number;       // MB
  jsHeapSize: number;           // MB
  jsHeapLimit: number;          // MB
  
  // 정리 통계
  lastCleanupTime: number;
  itemsCleanedUp: number;
}

/** 메모리 압박 이벤트 */
export interface MemoryPressureEvent {
  currentUsage: number;
  threshold: number;
  severity: 'low' | 'medium' | 'high';
}

// ===== 기본 설정 =====

const DEFAULT_CONFIG: MemoryManagerConfig = {
  textureCacheSizeMB: 256,
  geometryCacheSizeMB: 128,
  defaultPoolSize: 100,
  maxPoolSize: 500,
  cleanupInterval: 30000, // 30초
  unusedThreshold: 60000, // 1분
  memoryPressureThreshold: 400, // 400MB
  autoCleanup: true,
};

// ===== 오브젝트 풀 =====

class ObjectPool<T> {
  private items: PoolItem<T>[] = [];
  private factory: () => T;
  private resetFn: (item: T) => void;
  private disposeFn: (item: T) => void;
  private maxSize: number;
  private name: string;
  
  constructor(
    name: string,
    factory: () => T,
    reset: (item: T) => void,
    dispose: (item: T) => void,
    initialSize: number,
    maxSize: number
  ) {
    this.name = name;
    this.factory = factory;
    this.resetFn = reset;
    this.disposeFn = dispose;
    this.maxSize = maxSize;
    
    // 초기 아이템 생성
    for (let i = 0; i < initialSize; i++) {
      this.items.push({
        item: factory(),
        inUse: false,
        lastUsed: 0,
        createTime: Date.now(),
      });
    }
  }
  
  /**
   * 아이템 획득
   */
  acquire(): T | null {
    // 사용 가능한 아이템 찾기
    for (const poolItem of this.items) {
      if (!poolItem.inUse) {
        poolItem.inUse = true;
        poolItem.lastUsed = Date.now();
        this.resetFn(poolItem.item);
        return poolItem.item;
      }
    }
    
    // 풀이 가득 차지 않았으면 새로 생성
    if (this.items.length < this.maxSize) {
      const newItem: PoolItem<T> = {
        item: this.factory(),
        inUse: true,
        lastUsed: Date.now(),
        createTime: Date.now(),
      };
      this.items.push(newItem);
      return newItem.item;
    }
    
    // 풀 한계 도달
    console.warn(`[ObjectPool:${this.name}] 풀 한계 도달 (${this.maxSize})`);
    return null;
  }
  
  /**
   * 아이템 반환
   */
  release(item: T): boolean {
    for (const poolItem of this.items) {
      if (poolItem.item === item) {
        poolItem.inUse = false;
        poolItem.lastUsed = Date.now();
        return true;
      }
    }
    
    console.warn(`[ObjectPool:${this.name}] 반환 실패: 풀에 없는 아이템`);
    return false;
  }
  
  /**
   * 오래된 미사용 아이템 정리
   */
  cleanup(unusedThreshold: number): number {
    const now = Date.now();
    let cleanedCount = 0;
    
    // 최소 개수 유지
    const minSize = Math.ceil(this.maxSize * 0.2);
    
    this.items = this.items.filter(poolItem => {
      // 사용 중이면 유지
      if (poolItem.inUse) return true;
      
      // 최소 개수 유지
      if (this.items.length - cleanedCount <= minSize) return true;
      
      // 오래된 미사용 아이템 제거
      if (now - poolItem.lastUsed > unusedThreshold) {
        this.disposeFn(poolItem.item);
        cleanedCount++;
        return false;
      }
      
      return true;
    });
    
    return cleanedCount;
  }
  
  /**
   * 통계 반환
   */
  getStats(): { total: number; inUse: number; available: number } {
    const inUse = this.items.filter(i => i.inUse).length;
    return {
      total: this.items.length,
      inUse,
      available: this.items.length - inUse,
    };
  }
  
  /**
   * 전체 정리
   */
  disposeAll(): void {
    for (const poolItem of this.items) {
      this.disposeFn(poolItem.item);
    }
    this.items = [];
  }
}

// ===== LRU 캐시 =====

class LRUCache<T> {
  private cache: Map<string, CacheItem<T>> = new Map();
  private maxSizeBytes: number;
  private currentSizeBytes: number = 0;
  private onDispose: (item: T) => void;
  
  constructor(maxSizeMB: number, onDispose: (item: T) => void) {
    this.maxSizeBytes = maxSizeMB * 1024 * 1024;
    this.onDispose = onDispose;
  }
  
  /**
   * 아이템 추가/업데이트
   */
  set(key: string, item: T, sizeBytes: number): void {
    // 기존 아이템 제거
    if (this.cache.has(key)) {
      const old = this.cache.get(key)!;
      this.currentSizeBytes -= old.size;
      this.onDispose(old.item);
    }
    
    // 공간 확보
    while (this.currentSizeBytes + sizeBytes > this.maxSizeBytes && this.cache.size > 0) {
      this.evictLRU();
    }
    
    // 새 아이템 추가
    this.cache.set(key, {
      item,
      size: sizeBytes,
      lastAccessed: Date.now(),
      accessCount: 1,
    });
    this.currentSizeBytes += sizeBytes;
  }
  
  /**
   * 아이템 조회
   */
  get(key: string): T | undefined {
    const cacheItem = this.cache.get(key);
    if (cacheItem) {
      cacheItem.lastAccessed = Date.now();
      cacheItem.accessCount++;
      return cacheItem.item;
    }
    return undefined;
  }
  
  /**
   * 아이템 존재 여부
   */
  has(key: string): boolean {
    return this.cache.has(key);
  }
  
  /**
   * 아이템 삭제
   */
  delete(key: string): boolean {
    const cacheItem = this.cache.get(key);
    if (cacheItem) {
      this.currentSizeBytes -= cacheItem.size;
      this.onDispose(cacheItem.item);
      this.cache.delete(key);
      return true;
    }
    return false;
  }
  
  /**
   * LRU 제거
   */
  private evictLRU(): void {
    let oldest: string | null = null;
    let oldestTime = Infinity;
    
    for (const [key, item] of this.cache) {
      if (item.lastAccessed < oldestTime) {
        oldestTime = item.lastAccessed;
        oldest = key;
      }
    }
    
    if (oldest) {
      this.delete(oldest);
    }
  }
  
  /**
   * 통계
   */
  getStats(): { count: number; sizeMB: number; maxSizeMB: number } {
    return {
      count: this.cache.size,
      sizeMB: this.currentSizeBytes / 1024 / 1024,
      maxSizeMB: this.maxSizeBytes / 1024 / 1024,
    };
  }
  
  /**
   * 정리
   */
  clear(): void {
    for (const [, item] of this.cache) {
      this.onDispose(item.item);
    }
    this.cache.clear();
    this.currentSizeBytes = 0;
  }
}

// ===== 메인 클래스 =====

export class MemoryManager {
  private config: MemoryManagerConfig;
  
  // 오브젝트 풀
  private pools: Map<string, ObjectPool<unknown>> = new Map();
  
  // 캐시
  private textureCache: LRUCache<THREE.Texture>;
  private geometryCache: LRUCache<THREE.BufferGeometry>;
  
  // 정리 타이머
  private cleanupTimer: ReturnType<typeof setInterval> | null = null;
  
  // 메모리 압박 콜백
  private onMemoryPressure?: (event: MemoryPressureEvent) => void;
  
  // 통계
  private stats: MemoryStats;
  private itemsCleanedUp: number = 0;
  private lastCleanupTime: number = 0;
  
  constructor(config?: Partial<MemoryManagerConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    
    // 캐시 초기화
    this.textureCache = new LRUCache<THREE.Texture>(
      this.config.textureCacheSizeMB,
      texture => texture.dispose()
    );
    
    this.geometryCache = new LRUCache<THREE.BufferGeometry>(
      this.config.geometryCacheSizeMB,
      geometry => geometry.dispose()
    );
    
    // 통계 초기화
    this.stats = this.createEmptyStats();
    
    // 자동 정리 시작
    if (this.config.autoCleanup) {
      this.startAutoCleanup();
    }
    
    console.log('💾 MemoryManager 초기화 완료');
  }
  
  private createEmptyStats(): MemoryStats {
    return {
      textureCacheSize: 0,
      textureCacheCount: 0,
      geometryCacheSize: 0,
      geometryCacheCount: 0,
      poolStats: new Map(),
      estimatedUsage: 0,
      jsHeapSize: 0,
      jsHeapLimit: 0,
      lastCleanupTime: 0,
      itemsCleanedUp: 0,
    };
  }
  
  // ===== 오브젝트 풀 =====
  
  /**
   * 오브젝트 풀 생성
   */
  createPool<T>(
    name: string,
    factory: () => T,
    reset: (item: T) => void,
    dispose: (item: T) => void,
    initialSize?: number,
    maxSize?: number
  ): void {
    if (this.pools.has(name)) {
      console.warn(`[MemoryManager] 풀 '${name}' 이미 존재`);
      return;
    }
    
    const pool = new ObjectPool<T>(
      name,
      factory,
      reset,
      dispose,
      initialSize ?? this.config.defaultPoolSize,
      maxSize ?? this.config.maxPoolSize
    );
    
    this.pools.set(name, pool as ObjectPool<unknown>);
    console.log(`💾 풀 생성: ${name}`);
  }
  
  /**
   * 풀에서 아이템 획득
   */
  acquireFromPool<T>(name: string): T | null {
    const pool = this.pools.get(name) as ObjectPool<T> | undefined;
    if (!pool) {
      console.warn(`[MemoryManager] 풀 '${name}' 없음`);
      return null;
    }
    return pool.acquire();
  }
  
  /**
   * 풀에 아이템 반환
   */
  releaseToPool<T>(name: string, item: T): boolean {
    const pool = this.pools.get(name) as ObjectPool<T> | undefined;
    if (!pool) {
      console.warn(`[MemoryManager] 풀 '${name}' 없음`);
      return false;
    }
    return pool.release(item);
  }
  
  // ===== 미리 정의된 풀 =====
  
  /**
   * 유닛 메시 풀 생성
   */
  createUnitMeshPool(
    name: string,
    createMesh: () => THREE.Group,
    initialSize: number = 50
  ): void {
    this.createPool<THREE.Group>(
      name,
      createMesh,
      (mesh) => {
        mesh.visible = false;
        mesh.position.set(0, -1000, 0);
      },
      (mesh) => {
        mesh.traverse(obj => {
          if ((obj as THREE.Mesh).isMesh) {
            const m = obj as THREE.Mesh;
            m.geometry.dispose();
            const material = m.material;
            if (Array.isArray(material)) {
              material.forEach(mat => mat.dispose());
            } else {
              (material as THREE.Material).dispose();
            }
          }
        });
      },
      initialSize
    );
  }
  
  /**
   * 파티클 풀 생성
   */
  createParticlePool(initialSize: number = 100): void {
    this.createPool<THREE.Points>(
      'particles',
      () => {
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(3);
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        const material = new THREE.PointsMaterial({ size: 0.5 });
        return new THREE.Points(geometry, material);
      },
      (points) => {
        points.visible = false;
      },
      (points) => {
        points.geometry.dispose();
        (points.material as THREE.Material).dispose();
      },
      initialSize
    );
  }
  
  /**
   * 투사체 풀 생성
   */
  createProjectilePool(initialSize: number = 50): void {
    this.createPool<THREE.Mesh>(
      'projectiles',
      () => {
        const geometry = new THREE.SphereGeometry(0.1, 8, 8);
        const material = new THREE.MeshBasicMaterial({ color: 0xffff00 });
        return new THREE.Mesh(geometry, material);
      },
      (mesh) => {
        mesh.visible = false;
        mesh.position.set(0, -1000, 0);
      },
      (mesh) => {
        mesh.geometry.dispose();
        (mesh.material as THREE.Material).dispose();
      },
      initialSize
    );
  }
  
  // ===== 텍스처 캐시 =====
  
  /**
   * 텍스처 캐시에 저장
   */
  cacheTexture(key: string, texture: THREE.Texture): void {
    // 텍스처 크기 추정 (width * height * 4 bytes per pixel)
    const image = texture.image as { width?: number; height?: number } | undefined;
    const sizeBytes = (image?.width || 256) * (image?.height || 256) * 4;
    this.textureCache.set(key, texture, sizeBytes);
  }
  
  /**
   * 텍스처 캐시에서 조회
   */
  getCachedTexture(key: string): THREE.Texture | undefined {
    return this.textureCache.get(key);
  }
  
  /**
   * 텍스처 캐시 여부
   */
  hasTexture(key: string): boolean {
    return this.textureCache.has(key);
  }
  
  // ===== 지오메트리 캐시 =====
  
  /**
   * 지오메트리 캐시에 저장
   */
  cacheGeometry(key: string, geometry: THREE.BufferGeometry): void {
    // 지오메트리 크기 추정
    const position = geometry.getAttribute('position');
    const sizeBytes = position ? position.array.byteLength * 3 : 1024; // position, normal, uv 대략
    this.geometryCache.set(key, geometry, sizeBytes);
  }
  
  /**
   * 지오메트리 캐시에서 조회
   */
  getCachedGeometry(key: string): THREE.BufferGeometry | undefined {
    return this.geometryCache.get(key);
  }
  
  /**
   * 지오메트리 캐시 여부
   */
  hasGeometry(key: string): boolean {
    return this.geometryCache.has(key);
  }
  
  // ===== 정리 =====
  
  /**
   * 자동 정리 시작
   */
  startAutoCleanup(): void {
    if (this.cleanupTimer) return;
    
    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, this.config.cleanupInterval);
  }
  
  /**
   * 자동 정리 중지
   */
  stopAutoCleanup(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }
  
  /**
   * 수동 정리
   */
  cleanup(): void {
    const startTime = performance.now();
    let totalCleaned = 0;
    
    // 풀 정리
    for (const [name, pool] of this.pools) {
      const cleaned = pool.cleanup(this.config.unusedThreshold);
      totalCleaned += cleaned;
      if (cleaned > 0) {
        console.log(`💾 풀 '${name}' 정리: ${cleaned}개`);
      }
    }
    
    this.lastCleanupTime = Date.now();
    this.itemsCleanedUp += totalCleaned;
    
    // 메모리 압박 체크
    this.checkMemoryPressure();
    
    console.log(`💾 정리 완료: ${totalCleaned}개 (${(performance.now() - startTime).toFixed(1)}ms)`);
  }
  
  /**
   * 강제 정리 (메모리 부족 시)
   */
  forceCleanup(): void {
    console.log('💾 강제 정리 시작...');
    
    // 모든 캐시 정리
    this.textureCache.clear();
    this.geometryCache.clear();
    
    // 풀 최소화
    for (const pool of this.pools.values()) {
      pool.cleanup(0); // 모든 미사용 아이템 제거
    }
    
    // GC 힌트
    if (typeof globalThis !== 'undefined' && (globalThis as typeof globalThis & { gc?: () => void }).gc) {
      (globalThis as typeof globalThis & { gc: () => void }).gc();
    }
    
    console.log('💾 강제 정리 완료');
  }
  
  // ===== 메모리 압박 =====
  
  /**
   * 메모리 압박 콜백 설정
   */
  setOnMemoryPressure(callback: (event: MemoryPressureEvent) => void): void {
    this.onMemoryPressure = callback;
  }
  
  private checkMemoryPressure(): void {
    const memoryInfo = this.getMemoryInfo();
    
    if (memoryInfo.jsHeapSize > this.config.memoryPressureThreshold) {
      const severity = this.calculatePressureSeverity(memoryInfo.jsHeapSize);
      
      const event: MemoryPressureEvent = {
        currentUsage: memoryInfo.jsHeapSize,
        threshold: this.config.memoryPressureThreshold,
        severity,
      };
      
      console.warn(`⚠️ 메모리 압박 감지: ${memoryInfo.jsHeapSize}MB (${severity})`);
      
      this.onMemoryPressure?.(event);
      
      // 심각하면 강제 정리
      if (severity === 'high') {
        this.forceCleanup();
      }
    }
  }
  
  private calculatePressureSeverity(currentMB: number): 'low' | 'medium' | 'high' {
    const threshold = this.config.memoryPressureThreshold;
    
    if (currentMB > threshold * 1.5) return 'high';
    if (currentMB > threshold * 1.2) return 'medium';
    return 'low';
  }
  
  private getMemoryInfo(): { jsHeapSize: number; jsHeapLimit: number } {
    const perf = performance as Performance & {
      memory?: {
        usedJSHeapSize: number;
        totalJSHeapSize: number;
        jsHeapSizeLimit: number;
      };
    };
    
    if (perf.memory) {
      return {
        jsHeapSize: Math.round(perf.memory.usedJSHeapSize / 1024 / 1024),
        jsHeapLimit: Math.round(perf.memory.jsHeapSizeLimit / 1024 / 1024),
      };
    }
    
    return { jsHeapSize: 0, jsHeapLimit: 0 };
  }
  
  // ===== 통계 =====
  
  /**
   * 통계 반환
   */
  getStats(): MemoryStats {
    const textureStats = this.textureCache.getStats();
    const geometryStats = this.geometryCache.getStats();
    const memoryInfo = this.getMemoryInfo();
    
    const poolStats = new Map<string, { total: number; inUse: number; available: number }>();
    for (const [name, pool] of this.pools) {
      poolStats.set(name, pool.getStats());
    }
    
    return {
      textureCacheSize: textureStats.sizeMB,
      textureCacheCount: textureStats.count,
      geometryCacheSize: geometryStats.sizeMB,
      geometryCacheCount: geometryStats.count,
      poolStats,
      estimatedUsage: textureStats.sizeMB + geometryStats.sizeMB + memoryInfo.jsHeapSize,
      jsHeapSize: memoryInfo.jsHeapSize,
      jsHeapLimit: memoryInfo.jsHeapLimit,
      lastCleanupTime: this.lastCleanupTime,
      itemsCleanedUp: this.itemsCleanedUp,
    };
  }
  
  /**
   * 리포트 생성
   */
  generateReport(): string {
    const stats = this.getStats();
    
    let poolReport = '';
    for (const [name, poolStat] of stats.poolStats) {
      poolReport += `\n  ${name}: ${poolStat.inUse}/${poolStat.total} (사용/전체)`;
    }
    
    return `
=== 메모리 리포트 ===
📦 캐시
  텍스처: ${stats.textureCacheCount}개, ${stats.textureCacheSize.toFixed(1)}MB
  지오메트리: ${stats.geometryCacheCount}개, ${stats.geometryCacheSize.toFixed(1)}MB

🏊 오브젝트 풀${poolReport}

💾 메모리
  JS Heap: ${stats.jsHeapSize}MB / ${stats.jsHeapLimit}MB
  예상 사용량: ${stats.estimatedUsage.toFixed(1)}MB

🧹 정리
  마지막 정리: ${stats.lastCleanupTime ? new Date(stats.lastCleanupTime).toLocaleString() : 'N/A'}
  정리된 아이템: ${stats.itemsCleanedUp}개
===================
    `.trim();
  }
  
  // ===== 정리 =====
  
  dispose(): void {
    this.stopAutoCleanup();
    
    // 풀 정리
    for (const pool of this.pools.values()) {
      pool.disposeAll();
    }
    this.pools.clear();
    
    // 캐시 정리
    this.textureCache.clear();
    this.geometryCache.clear();
    
    console.log('🧹 MemoryManager 정리 완료');
  }
}

// ===== 싱글톤 =====

let globalMemoryManager: MemoryManager | null = null;

/**
 * 전역 메모리 관리자 가져오기
 */
export function getMemoryManager(config?: Partial<MemoryManagerConfig>): MemoryManager {
  if (!globalMemoryManager) {
    globalMemoryManager = new MemoryManager(config);
  }
  return globalMemoryManager;
}

/**
 * 전역 메모리 관리자 초기화
 */
export function resetMemoryManager(): void {
  if (globalMemoryManager) {
    globalMemoryManager.dispose();
    globalMemoryManager = null;
  }
}

export default MemoryManager;




