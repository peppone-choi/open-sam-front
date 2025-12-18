// @ts-nocheck
/**
 * Asset Optimizer - 텍스처/이미지 최적화 유틸리티
 * 
 * 기능:
 * - WebP 포맷 자동 전환 (지원 시)
 * - 디바이스 DPR에 따른 해상도 조정
 * - Lazy loading 지원
 * - 메모리 캐싱
 */

// WebP 지원 여부 캐싱
let webpSupported: boolean | null = null;

/**
 * WebP 지원 여부 확인
 */
export async function checkWebPSupport(): Promise<boolean> {
  if (webpSupported !== null) {
    return webpSupported;
  }
  
  if (typeof window === 'undefined') {
    webpSupported = false;
    return false;
  }
  
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
    // 1x1 WebP 테스트 이미지
    img.src = 'data:image/webp;base64,UklGRiIAAABXRUJQVlA4IBYAAAAwAQCdASoBAAEADsD+JaQAA3AAAAAA';
  });
}

/**
 * 디바이스 DPR (Device Pixel Ratio) 가져오기
 * 성능을 위해 최대 2로 제한
 */
export function getOptimalDPR(): number {
  if (typeof window === 'undefined') return 1;
  return Math.min(window.devicePixelRatio || 1, 2);
}

/**
 * 최적화된 이미지 URL 생성
 * - WebP 지원 시 .webp 확장자 사용
 * - DPR에 따른 @2x 이미지 사용
 */
export function getOptimizedImageUrl(
  basePath: string,
  options: {
    preferWebP?: boolean;
    respectDPR?: boolean;
    width?: number;
    quality?: number;
  } = {}
): string {
  const { preferWebP = true, respectDPR = true, width, quality } = options;
  
  let url = basePath;
  
  // DPR 기반 이미지 선택 (@2x)
  if (respectDPR && getOptimalDPR() >= 2) {
    const ext = basePath.match(/\.[^.]+$/)?.[0] || '';
    const nameWithoutExt = basePath.replace(/\.[^.]+$/, '');
    
    // @2x 버전이 있다고 가정
    if (!nameWithoutExt.endsWith('@2x')) {
      url = `${nameWithoutExt}@2x${ext}`;
    }
  }
  
  // WebP 변환 (서버에서 지원하는 경우)
  if (preferWebP && webpSupported) {
    url = url.replace(/\.(png|jpg|jpeg)$/i, '.webp');
  }
  
  // 이미지 리사이징 CDN 파라미터 (CDN 사용 시)
  if (width || quality) {
    const params = new URLSearchParams();
    if (width) params.set('w', String(width));
    if (quality) params.set('q', String(quality));
    const separator = url.includes('?') ? '&' : '?';
    url = `${url}${separator}${params.toString()}`;
  }
  
  return url;
}

/**
 * 이미지 프리로더
 * 주요 에셋을 미리 로드하여 로딩 지연 방지
 */
export class ImagePreloader {
  private cache = new Map<string, HTMLImageElement>();
  private pending = new Map<string, Promise<HTMLImageElement>>();
  
  /**
   * 이미지 프리로드
   */
  async preload(url: string): Promise<HTMLImageElement> {
    // 캐시 확인
    const cached = this.cache.get(url);
    if (cached) return cached;
    
    // 진행 중인 로딩 확인
    const pending = this.pending.get(url);
    if (pending) return pending;
    
    // 새로 로드
    const promise = new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        this.cache.set(url, img);
        this.pending.delete(url);
        resolve(img);
      };
      img.onerror = () => {
        this.pending.delete(url);
        reject(new Error(`Failed to load image: ${url}`));
      };
      img.src = url;
    });
    
    this.pending.set(url, promise);
    return promise;
  }
  
  /**
   * 여러 이미지 동시 프리로드
   */
  async preloadAll(urls: string[]): Promise<HTMLImageElement[]> {
    return Promise.all(urls.map(url => this.preload(url)));
  }
  
  /**
   * 캐시에서 이미지 가져오기
   */
  get(url: string): HTMLImageElement | undefined {
    return this.cache.get(url);
  }
  
  /**
   * 캐시 정리
   */
  clear(): void {
    this.cache.clear();
    this.pending.clear();
  }
  
  /**
   * 특정 이미지 캐시에서 제거
   */
  evict(url: string): void {
    this.cache.delete(url);
  }
  
  /**
   * 캐시 상태
   */
  get stats() {
    return {
      cached: this.cache.size,
      pending: this.pending.size,
    };
  }
}

/**
 * 텍스처 품질 설정
 */
export type TextureQuality = 'low' | 'medium' | 'high' | 'ultra';

/**
 * 디바이스 성능에 따른 텍스처 품질 자동 결정
 */
export function getRecommendedTextureQuality(): TextureQuality {
  if (typeof window === 'undefined') return 'medium';
  
  // GPU 정보 확인 (가능한 경우)
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
  
  if (gl) {
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    if (debugInfo) {
      const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
      
      // 고성능 GPU 체크
      const highEndGPUs = ['NVIDIA', 'GeForce RTX', 'Radeon RX', 'Apple M'];
      if (highEndGPUs.some(gpu => renderer.includes(gpu))) {
        return 'ultra';
      }
      
      // 저성능 GPU 체크
      const lowEndGPUs = ['Intel HD', 'Intel UHD', 'Mali', 'Adreno 5'];
      if (lowEndGPUs.some(gpu => renderer.includes(gpu))) {
        return 'low';
      }
    }
  }
  
  // 메모리 기반 추정
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const memory = (navigator as any).deviceMemory;
  if (memory) {
    if (memory >= 8) return 'high';
    if (memory >= 4) return 'medium';
    return 'low';
  }
  
  // 모바일 여부 체크
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
  
  return isMobile ? 'low' : 'medium';
}

/**
 * 텍스처 품질에 따른 최대 해상도
 */
export const TEXTURE_MAX_SIZE: Record<TextureQuality, number> = {
  low: 512,
  medium: 1024,
  high: 2048,
  ultra: 4096,
};

/**
 * 텍스처 품질에 따른 압축 품질 (0-100)
 */
export const TEXTURE_QUALITY_VALUE: Record<TextureQuality, number> = {
  low: 60,
  medium: 75,
  high: 85,
  ultra: 95,
};

// 싱글톤 인스턴스
export const globalImagePreloader = new ImagePreloader();

// WebP 지원 여부 초기화 (클라이언트 사이드)
if (typeof window !== 'undefined') {
  checkWebPSupport();
}

/**
 * Three.js 텍스처 최적화 헬퍼
 */
export function configureTextureForQuality(
  texture: { 
    minFilter?: number;
    magFilter?: number;
    generateMipmaps?: boolean;
    anisotropy?: number;
  },
  quality: TextureQuality,
  renderer?: { capabilities?: { getMaxAnisotropy?: () => number } }
): void {
  // Three.js 상수 (의존성 없이 사용)
  const LINEAR = 1006;
  const LINEAR_MIPMAP_LINEAR = 1008;
  const LINEAR_MIPMAP_NEAREST = 1007;
  const NEAREST_MIPMAP_NEAREST = 1004;
  
  switch (quality) {
    case 'ultra':
      texture.minFilter = LINEAR_MIPMAP_LINEAR;
      texture.magFilter = LINEAR;
      texture.generateMipmaps = true;
      texture.anisotropy = renderer?.capabilities?.getMaxAnisotropy?.() ?? 16;
      break;
      
    case 'high':
      texture.minFilter = LINEAR_MIPMAP_LINEAR;
      texture.magFilter = LINEAR;
      texture.generateMipmaps = true;
      texture.anisotropy = 8;
      break;
      
    case 'medium':
      texture.minFilter = LINEAR_MIPMAP_NEAREST;
      texture.magFilter = LINEAR;
      texture.generateMipmaps = true;
      texture.anisotropy = 4;
      break;
      
    case 'low':
      texture.minFilter = NEAREST_MIPMAP_NEAREST;
      texture.magFilter = LINEAR;
      texture.generateMipmaps = true;
      texture.anisotropy = 1;
      break;
  }
}

/**
 * Canvas 기반 이미지 리사이징 (클라이언트 사이드 최적화)
 */
export function resizeImage(
  img: HTMLImageElement,
  maxSize: number,
  quality: number = 0.85
): Promise<Blob | null> {
  return new Promise((resolve) => {
    if (typeof document === 'undefined') {
      resolve(null);
      return;
    }
    
    let width = img.width;
    let height = img.height;
    
    // 이미 충분히 작으면 리사이징 불필요
    if (width <= maxSize && height <= maxSize) {
      resolve(null);
      return;
    }
    
    // 비율 유지하며 리사이징
    if (width > height) {
      height = Math.round(height * (maxSize / width));
      width = maxSize;
    } else {
      width = Math.round(width * (maxSize / height));
      height = maxSize;
    }
    
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      resolve(null);
      return;
    }
    
    // 고품질 보간
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, width, height);
    
    // WebP 우선, 지원 안 되면 JPEG
    canvas.toBlob(
      (blob) => resolve(blob),
      webpSupported ? 'image/webp' : 'image/jpeg',
      quality
    );
  });
}

/**
 * 비트맵 텍스처 생성 (오프스크린 렌더링 지원)
 */
export async function createOptimizedBitmap(
  src: string,
  maxSize: number = 1024
): Promise<ImageBitmap | HTMLImageElement> {
  const img = await globalImagePreloader.preload(src);
  
  // createImageBitmap 지원 시 (더 빠른 텍스처 업로드)
  if (typeof createImageBitmap !== 'undefined') {
    const targetSize = Math.min(maxSize, Math.max(img.width, img.height));
    const scale = targetSize / Math.max(img.width, img.height);
    
    if (scale < 1) {
      return createImageBitmap(img, {
        resizeWidth: Math.round(img.width * scale),
        resizeHeight: Math.round(img.height * scale),
        resizeQuality: 'high',
      });
    }
    
    return createImageBitmap(img);
  }
  
  // 폴백: 기존 이미지 반환
  return img;
}

