// @ts-nocheck
/**
 * 모바일 성능 최적화 유틸리티
 */

/**
 * 디바운스 함수
 * 연속된 호출을 지연시켜 성능 최적화
 */
export function debounce<T extends (...args: Parameters<T>) => void>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

/**
 * 쓰로틀 함수
 * 일정 시간 간격으로만 함수 실행 허용
 */
export function throttle<T extends (...args: Parameters<T>) => void>(
  fn: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}

/**
 * requestIdleCallback 폴리필
 * 브라우저 유휴 시간에 작업 실행
 */
export function requestIdleCallback(
  callback: IdleRequestCallback,
  options?: IdleRequestOptions
): number {
  if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
    return window.requestIdleCallback(callback, options);
  }
  
  // 폴리필: setTimeout 사용
  const start = Date.now();
  return window.setTimeout(() => {
    callback({
      didTimeout: false,
      timeRemaining: () => Math.max(0, 50 - (Date.now() - start)),
    });
  }, options?.timeout ?? 1) as unknown as number;
}

/**
 * cancelIdleCallback 폴리필
 */
export function cancelIdleCallback(handle: number): void {
  if (typeof window !== 'undefined' && 'cancelIdleCallback' in window) {
    window.cancelIdleCallback(handle);
  } else {
    clearTimeout(handle);
  }
}

/**
 * 이미지 프리로딩
 */
export function preloadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/**
 * 여러 이미지 동시 프리로딩
 */
export async function preloadImages(
  srcs: string[],
  concurrency = 3
): Promise<HTMLImageElement[]> {
  const results: HTMLImageElement[] = [];
  const queue = [...srcs];
  
  const worker = async () => {
    while (queue.length > 0) {
      const src = queue.shift();
      if (src) {
        try {
          const img = await preloadImage(src);
          results.push(img);
        } catch {
          // 실패한 이미지 무시
        }
      }
    }
  };
  
  await Promise.all(
    Array(Math.min(concurrency, srcs.length))
      .fill(null)
      .map(worker)
  );
  
  return results;
}

/**
 * 이미지 WebP 지원 여부 확인
 */
let webpSupported: boolean | null = null;

export async function supportsWebP(): Promise<boolean> {
  if (webpSupported !== null) return webpSupported;
  
  if (typeof window === 'undefined') return false;
  
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      webpSupported = img.width > 0 && img.height > 0;
      resolve(webpSupported);
    };
    img.onerror = () => {
      webpSupported = false;
      resolve(false);
    };
    img.src = 'data:image/webp;base64,UklGRhoAAABXRUJQVlA4TA0AAAAvAAAAEAcQERGIiP4HAA==';
  });
}

/**
 * 이미지 URL을 WebP 버전으로 변환
 */
export function toWebPUrl(url: string, hasWebPVersion = true): string {
  if (!hasWebPVersion) return url;
  
  // 이미 WebP인 경우
  if (url.endsWith('.webp')) return url;
  
  // 지원되는 포맷만 변환
  const supportedExtensions = ['.jpg', '.jpeg', '.png'];
  const ext = supportedExtensions.find((e) => url.toLowerCase().endsWith(e));
  
  if (ext) {
    return url.slice(0, -ext.length) + '.webp';
  }
  
  return url;
}

/**
 * 반응형 이미지 srcset 생성
 */
export function generateSrcSet(
  baseSrc: string,
  widths: number[] = [320, 640, 960, 1280]
): string {
  // URL에서 확장자 분리
  const lastDot = baseSrc.lastIndexOf('.');
  const basePath = lastDot > 0 ? baseSrc.slice(0, lastDot) : baseSrc;
  const ext = lastDot > 0 ? baseSrc.slice(lastDot) : '';
  
  return widths
    .map((w) => `${basePath}-${w}w${ext} ${w}w`)
    .join(', ');
}

/**
 * 네트워크 상태 기반 이미지 품질 결정
 */
export function getImageQualityByNetwork(): 'low' | 'medium' | 'high' {
  if (typeof navigator === 'undefined') return 'high';
  
  const connection = (navigator as Navigator & { connection?: { effectiveType?: string; saveData?: boolean } }).connection;
  
  if (!connection) return 'high';
  
  // 데이터 절약 모드
  if (connection.saveData) return 'low';
  
  // 네트워크 타입에 따른 품질
  switch (connection.effectiveType) {
    case 'slow-2g':
    case '2g':
      return 'low';
    case '3g':
      return 'medium';
    case '4g':
    default:
      return 'high';
  }
}

/**
 * 메모리 절약을 위한 URL 해제 도우미
 */
export function revokeObjectURLs(urls: string[]): void {
  urls.forEach((url) => {
    if (url.startsWith('blob:')) {
      URL.revokeObjectURL(url);
    }
  });
}

/**
 * 디바이스 메모리 확인 (GB)
 */
export function getDeviceMemory(): number | undefined {
  if (typeof navigator === 'undefined') return undefined;
  return (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
}

/**
 * 저사양 디바이스 여부 확인
 */
export function isLowEndDevice(): boolean {
  const memory = getDeviceMemory();
  const cores = typeof navigator !== 'undefined' ? navigator.hardwareConcurrency : 4;
  
  // 4GB 미만 메모리 또는 2코어 이하
  return (memory !== undefined && memory < 4) || cores <= 2;
}

/**
 * 배터리 상태 확인 (배터리 절약 모드)
 */
export async function isBatterySavingMode(): Promise<boolean> {
  if (typeof navigator === 'undefined') return false;
  
  try {
    const battery = await (navigator as Navigator & { getBattery?: () => Promise<{ charging: boolean; level: number }> }).getBattery?.();
    if (battery) {
      // 충전 중이 아니고 20% 이하면 절약 모드
      return !battery.charging && battery.level <= 0.2;
    }
  } catch {
    // 지원하지 않는 브라우저
  }
  
  return false;
}

/**
 * 성능 메트릭 수집
 */
export function collectPerformanceMetrics(): {
  FCP?: number;
  LCP?: number;
  CLS?: number;
  FID?: number;
} {
  if (typeof window === 'undefined' || !('PerformanceObserver' in window)) {
    return {};
  }
  
  const metrics: { FCP?: number; LCP?: number; CLS?: number; FID?: number } = {};
  
  // 기존 측정값 가져오기
  const paintEntries = performance.getEntriesByType('paint');
  const fcpEntry = paintEntries.find((e) => e.name === 'first-contentful-paint');
  if (fcpEntry) {
    metrics.FCP = fcpEntry.startTime;
  }
  
  return metrics;
}


