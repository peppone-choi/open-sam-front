/**
 * HeightMap.ts
 * 높이맵 처리 및 생성 시스템
 * 
 * 주요 기능:
 * 1. 높이맵 로드 및 파싱
 * 2. 프로시저럴 높이맵 생성 (노이즈 기반)
 * 3. 위치별 높이 쿼리
 * 4. 경사면 계산
 */

import type { TerrainType } from './TerrainGenerator';

// ========================================
// 타입 정의
// ========================================

/** 높이맵 설정 */
export interface HeightMapConfig {
  /** 맵 너비 (월드 단위) */
  width: number;
  /** 맵 깊이 (월드 단위) */
  depth: number;
  /** 해상도 (샘플 수) */
  resolution: number;
  /** 랜덤 시드 */
  seed?: number;
  /** 높이 스케일 */
  heightScale?: number;
}

/** 노이즈 설정 */
export interface NoiseConfig {
  /** 옥타브 수 */
  octaves: number;
  /** 지속성 (amplitude 감쇠) */
  persistence: number;
  /** 라쿠나리티 (frequency 증가) */
  lacunarity: number;
  /** 기본 주파수 */
  frequency: number;
  /** 진폭 */
  amplitude: number;
}

// ========================================
// 메인 클래스
// ========================================

export class HeightMap {
  private config: Required<HeightMapConfig>;
  private data: Float32Array;
  private resolution: number;
  
  // 노이즈 설정
  private noiseConfig: NoiseConfig = {
    octaves: 6,
    persistence: 0.5,
    lacunarity: 2.0,
    frequency: 0.01,
    amplitude: 1.0,
  };
  
  // 시드 기반 랜덤
  private seed: number;
  
  constructor(config: HeightMapConfig) {
    this.config = {
      width: config.width,
      depth: config.depth,
      resolution: config.resolution,
      seed: config.seed ?? Date.now(),
      heightScale: config.heightScale ?? 1.0,
    };
    
    this.resolution = config.resolution;
    this.seed = this.config.seed;
    this.data = new Float32Array(this.resolution * this.resolution);
    
    // 기본값으로 초기화
    this.data.fill(0);
  }
  
  // ========================================
  // 높이맵 로드
  // ========================================
  
  /**
   * 2D 배열에서 높이맵 로드
   */
  loadFromArray(heightData: number[][]): void {
    const rows = heightData.length;
    const cols = heightData[0]?.length || 0;
    
    if (rows === 0 || cols === 0) {
      console.warn('빈 높이맵 데이터');
      return;
    }
    
    // 해상도에 맞게 리샘플링
    for (let z = 0; z < this.resolution; z++) {
      for (let x = 0; x < this.resolution; x++) {
        // 원본 데이터의 좌표 계산
        const srcX = (x / this.resolution) * (cols - 1);
        const srcZ = (z / this.resolution) * (rows - 1);
        
        // 바이리니어 보간
        const height = this.bilinearInterpolate(heightData, srcX, srcZ, cols, rows);
        this.data[z * this.resolution + x] = height * this.config.heightScale;
      }
    }
    
    console.log(`📊 높이맵 로드 완료: ${cols}x${rows} → ${this.resolution}x${this.resolution}`);
  }
  
  /**
   * 이미지에서 높이맵 로드
   */
  async loadFromImage(imagePath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = this.resolution;
        canvas.height = this.resolution;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas 2D context 생성 실패'));
          return;
        }
        
        // 이미지를 해상도에 맞게 그리기
        ctx.drawImage(img, 0, 0, this.resolution, this.resolution);
        
        // 픽셀 데이터 추출
        const imageData = ctx.getImageData(0, 0, this.resolution, this.resolution);
        const pixels = imageData.data;
        
        // 그레이스케일 값을 높이로 변환
        for (let i = 0; i < this.data.length; i++) {
          const pixelIndex = i * 4;
          // R, G, B 평균값 (0-255) → 0-1 → 스케일 적용
          const gray = (pixels[pixelIndex] + pixels[pixelIndex + 1] + pixels[pixelIndex + 2]) / 3;
          this.data[i] = (gray / 255) * this.config.heightScale;
        }
        
        console.log(`🖼️ 이미지에서 높이맵 로드 완료: ${imagePath}`);
        resolve();
      };
      
      img.onerror = () => {
        reject(new Error(`이미지 로드 실패: ${imagePath}`));
      };
      
      img.src = imagePath;
    });
  }
  
  // ========================================
  // 프로시저럴 생성
  // ========================================
  
  /**
   * 프로시저럴 높이맵 생성
   */
  generateProcedural(terrainType: TerrainType = 'plains'): void {
    // 지형 타입별 노이즈 설정
    this.configureNoiseForTerrain(terrainType);
    
    // 노이즈 생성
    for (let z = 0; z < this.resolution; z++) {
      for (let x = 0; x < this.resolution; x++) {
        const worldX = (x / this.resolution) * this.config.width;
        const worldZ = (z / this.resolution) * this.config.depth;
        
        let height = this.fbmNoise(worldX, worldZ);
        
        // 지형 타입별 후처리
        height = this.postProcessHeight(height, worldX, worldZ, terrainType);
        
        this.data[z * this.resolution + x] = height * this.config.heightScale;
      }
    }
    
    // 에지 스무딩 (맵 가장자리)
    this.smoothEdges();
    
    console.log(`🎲 프로시저럴 높이맵 생성 완료: ${terrainType}`);
  }
  
  /**
   * 지형 타입별 노이즈 설정
   */
  private configureNoiseForTerrain(type: TerrainType): void {
    switch (type) {
      case 'plains':
        this.noiseConfig = {
          octaves: 4,
          persistence: 0.4,
          lacunarity: 2.0,
          frequency: 0.005,
          amplitude: 2.0,
        };
        break;
      case 'forest':
        this.noiseConfig = {
          octaves: 5,
          persistence: 0.5,
          lacunarity: 2.0,
          frequency: 0.008,
          amplitude: 3.0,
        };
        break;
      case 'mountain':
        this.noiseConfig = {
          octaves: 8,
          persistence: 0.6,
          lacunarity: 2.2,
          frequency: 0.01,
          amplitude: 10.0,
        };
        break;
      case 'river':
        this.noiseConfig = {
          octaves: 4,
          persistence: 0.4,
          lacunarity: 2.0,
          frequency: 0.005,
          amplitude: 1.5,
        };
        break;
      case 'desert':
        this.noiseConfig = {
          octaves: 3,
          persistence: 0.3,
          lacunarity: 2.5,
          frequency: 0.003,
          amplitude: 2.5,
        };
        break;
      case 'snow':
        this.noiseConfig = {
          octaves: 6,
          persistence: 0.55,
          lacunarity: 2.0,
          frequency: 0.01,
          amplitude: 8.0,
        };
        break;
      case 'swamp':
        this.noiseConfig = {
          octaves: 4,
          persistence: 0.35,
          lacunarity: 2.0,
          frequency: 0.004,
          amplitude: 1.0,
        };
        break;
      case 'city':
        this.noiseConfig = {
          octaves: 2,
          persistence: 0.3,
          lacunarity: 2.0,
          frequency: 0.002,
          amplitude: 0.5,
        };
        break;
    }
  }
  
  /**
   * FBM (Fractal Brownian Motion) 노이즈
   */
  private fbmNoise(x: number, z: number): number {
    let value = 0;
    let amplitude = this.noiseConfig.amplitude;
    let frequency = this.noiseConfig.frequency;
    
    for (let o = 0; o < this.noiseConfig.octaves; o++) {
      value += this.noise2D(x * frequency, z * frequency) * amplitude;
      amplitude *= this.noiseConfig.persistence;
      frequency *= this.noiseConfig.lacunarity;
    }
    
    return value;
  }
  
  /**
   * 2D 노이즈 (간단한 Perlin 근사)
   */
  private noise2D(x: number, z: number): number {
    // 시드 기반 해시
    const hash = (n: number): number => {
      const s = this.seed;
      return Math.abs(Math.sin((n + s) * 12.9898 + (n * s) * 78.233) * 43758.5453) % 1;
    };
    
    // 정수 좌표
    const ix = Math.floor(x);
    const iz = Math.floor(z);
    
    // 소수 부분
    const fx = x - ix;
    const fz = z - iz;
    
    // 부드러운 보간 함수
    const smoothstep = (t: number): number => t * t * (3 - 2 * t);
    const u = smoothstep(fx);
    const v = smoothstep(fz);
    
    // 4개의 코너 값
    const n00 = hash(ix + iz * 57);
    const n10 = hash(ix + 1 + iz * 57);
    const n01 = hash(ix + (iz + 1) * 57);
    const n11 = hash(ix + 1 + (iz + 1) * 57);
    
    // 바이리니어 보간
    const nx0 = n00 * (1 - u) + n10 * u;
    const nx1 = n01 * (1 - u) + n11 * u;
    
    return (nx0 * (1 - v) + nx1 * v) * 2 - 1; // -1 ~ 1
  }
  
  /**
   * 지형 타입별 높이 후처리
   */
  private postProcessHeight(height: number, x: number, z: number, type: TerrainType): number {
    const centerX = this.config.width / 2;
    const centerZ = this.config.depth / 2;
    const distFromCenter = Math.sqrt((x - centerX) ** 2 + (z - centerZ) ** 2);
    const maxDist = Math.sqrt(centerX ** 2 + centerZ ** 2);
    const normalizedDist = distFromCenter / maxDist;
    
    switch (type) {
      case 'mountain':
        // 중앙에 산맥 형성
        const ridgeNoise = this.noise2D(x * 0.02, z * 0.02);
        if (Math.abs(ridgeNoise) < 0.3) {
          height *= 1.5 + (0.3 - Math.abs(ridgeNoise)) * 3;
        }
        break;
        
      case 'river':
        // 강줄기 생성 (사인 곡선)
        const riverWidth = 15;
        const riverPath = Math.sin(z * 0.02 + this.seed * 0.01) * 30;
        const distFromRiver = Math.abs(x - centerX - riverPath);
        if (distFromRiver < riverWidth) {
          height = -1 - (1 - distFromRiver / riverWidth) * 0.5;
        }
        break;
        
      case 'swamp':
        // 낮은 지대, 물웅덩이
        height = Math.min(height * 0.3, 0.5);
        if (this.noise2D(x * 0.05, z * 0.05) > 0.3) {
          height = Math.min(height, -0.2);
        }
        break;
        
      case 'city':
        // 평탄화
        height *= 0.2;
        break;
        
      case 'desert':
        // 부드러운 모래 언덕
        height = Math.abs(height) * 0.5;
        break;
    }
    
    // 가장자리 감쇠 (맵 끝으로 갈수록 낮아짐)
    if (normalizedDist > 0.8) {
      const edgeFade = 1 - (normalizedDist - 0.8) / 0.2;
      height *= edgeFade;
    }
    
    return height;
  }
  
  /**
   * 에지 스무딩
   */
  private smoothEdges(): void {
    const edgeWidth = Math.floor(this.resolution * 0.1);
    
    for (let z = 0; z < this.resolution; z++) {
      for (let x = 0; x < this.resolution; x++) {
        let fade = 1.0;
        
        // 왼쪽 가장자리
        if (x < edgeWidth) {
          fade = Math.min(fade, x / edgeWidth);
        }
        // 오른쪽 가장자리
        if (x > this.resolution - edgeWidth) {
          fade = Math.min(fade, (this.resolution - x) / edgeWidth);
        }
        // 위쪽 가장자리
        if (z < edgeWidth) {
          fade = Math.min(fade, z / edgeWidth);
        }
        // 아래쪽 가장자리
        if (z > this.resolution - edgeWidth) {
          fade = Math.min(fade, (this.resolution - z) / edgeWidth);
        }
        
        // 부드러운 감쇠 적용
        fade = fade * fade * (3 - 2 * fade); // smoothstep
        this.data[z * this.resolution + x] *= fade;
      }
    }
  }
  
  // ========================================
  // 쿼리 API
  // ========================================
  
  /**
   * 특정 위치의 높이 조회
   */
  getHeightAt(x: number, z: number): number {
    // 월드 좌표 → 샘플 인덱스
    const sampleX = (x / this.config.width) * (this.resolution - 1);
    const sampleZ = (z / this.config.depth) * (this.resolution - 1);
    
    // 범위 체크
    if (sampleX < 0 || sampleX >= this.resolution - 1 ||
        sampleZ < 0 || sampleZ >= this.resolution - 1) {
      return 0;
    }
    
    // 바이리니어 보간
    const ix = Math.floor(sampleX);
    const iz = Math.floor(sampleZ);
    const fx = sampleX - ix;
    const fz = sampleZ - iz;
    
    const h00 = this.data[iz * this.resolution + ix];
    const h10 = this.data[iz * this.resolution + ix + 1];
    const h01 = this.data[(iz + 1) * this.resolution + ix];
    const h11 = this.data[(iz + 1) * this.resolution + ix + 1];
    
    const hx0 = h00 * (1 - fx) + h10 * fx;
    const hx1 = h01 * (1 - fx) + h11 * fx;
    
    return hx0 * (1 - fz) + hx1 * fz;
  }
  
  /**
   * 특정 위치의 경사면 계산 (0 = 평탄, 1 = 90도)
   */
  getSlopeAt(x: number, z: number): number {
    const delta = 1.0; // 샘플 간격
    
    // 주변 4개 지점의 높이
    const hL = this.getHeightAt(x - delta, z);
    const hR = this.getHeightAt(x + delta, z);
    const hD = this.getHeightAt(x, z - delta);
    const hU = this.getHeightAt(x, z + delta);
    
    // 그래디언트 계산
    const dx = (hR - hL) / (2 * delta);
    const dz = (hU - hD) / (2 * delta);
    
    // 경사 크기 (0 ~ 1로 정규화)
    const slope = Math.sqrt(dx * dx + dz * dz);
    return Math.min(slope / 2, 1); // 최대값 클램핑
  }
  
  /**
   * 특정 위치의 법선 벡터 계산
   */
  getNormalAt(x: number, z: number): { x: number; y: number; z: number } {
    const delta = 1.0;
    
    const hL = this.getHeightAt(x - delta, z);
    const hR = this.getHeightAt(x + delta, z);
    const hD = this.getHeightAt(x, z - delta);
    const hU = this.getHeightAt(x, z + delta);
    
    // 법선 계산
    const nx = hL - hR;
    const nz = hD - hU;
    const ny = 2 * delta;
    
    // 정규화
    const length = Math.sqrt(nx * nx + ny * ny + nz * nz);
    
    return {
      x: nx / length,
      y: ny / length,
      z: nz / length,
    };
  }
  
  /**
   * 높이맵 데이터 직접 접근
   */
  getData(): Float32Array {
    return this.data;
  }
  
  /**
   * 특정 인덱스의 높이 설정
   */
  setHeightAt(x: number, z: number, height: number): void {
    const sampleX = Math.floor((x / this.config.width) * (this.resolution - 1));
    const sampleZ = Math.floor((z / this.config.depth) * (this.resolution - 1));
    
    if (sampleX >= 0 && sampleX < this.resolution &&
        sampleZ >= 0 && sampleZ < this.resolution) {
      this.data[sampleZ * this.resolution + sampleX] = height;
    }
  }
  
  /**
   * 높이맵 블러 (스무딩)
   */
  blur(iterations: number = 1): void {
    const temp = new Float32Array(this.data.length);
    
    for (let iter = 0; iter < iterations; iter++) {
      for (let z = 1; z < this.resolution - 1; z++) {
        for (let x = 1; x < this.resolution - 1; x++) {
          const idx = z * this.resolution + x;
          
          // 3x3 가우시안 블러
          temp[idx] = (
            this.data[idx] * 0.25 +
            this.data[idx - 1] * 0.125 +
            this.data[idx + 1] * 0.125 +
            this.data[idx - this.resolution] * 0.125 +
            this.data[idx + this.resolution] * 0.125 +
            this.data[idx - this.resolution - 1] * 0.0625 +
            this.data[idx - this.resolution + 1] * 0.0625 +
            this.data[idx + this.resolution - 1] * 0.0625 +
            this.data[idx + this.resolution + 1] * 0.0625
          );
        }
      }
      
      // 결과 복사
      for (let i = 0; i < this.data.length; i++) {
        this.data[i] = temp[i] || this.data[i];
      }
    }
  }
  
  /**
   * 높이 범위 조회
   */
  getHeightRange(): { min: number; max: number } {
    let min = Infinity;
    let max = -Infinity;
    
    for (let i = 0; i < this.data.length; i++) {
      if (this.data[i] < min) min = this.data[i];
      if (this.data[i] > max) max = this.data[i];
    }
    
    return { min, max };
  }
  
  /**
   * 높이맵 정규화 (0~1 범위로)
   */
  normalize(): void {
    const { min, max } = this.getHeightRange();
    const range = max - min;
    
    if (range === 0) return;
    
    for (let i = 0; i < this.data.length; i++) {
      this.data[i] = (this.data[i] - min) / range;
    }
  }
  
  /**
   * 높이맵 스케일 적용
   */
  scale(factor: number): void {
    for (let i = 0; i < this.data.length; i++) {
      this.data[i] *= factor;
    }
  }
  
  /**
   * 해상도 조회
   */
  getResolution(): number {
    return this.resolution;
  }
  
  /**
   * 설정 조회
   */
  getConfig(): Required<HeightMapConfig> {
    return this.config;
  }
  
  // ========================================
  // 유틸리티
  // ========================================
  
  /**
   * 바이리니어 보간
   */
  private bilinearInterpolate(
    data: number[][],
    x: number,
    z: number,
    width: number,
    height: number
  ): number {
    const x0 = Math.floor(x);
    const z0 = Math.floor(z);
    const x1 = Math.min(x0 + 1, width - 1);
    const z1 = Math.min(z0 + 1, height - 1);
    
    const fx = x - x0;
    const fz = z - z0;
    
    const v00 = data[z0][x0] || 0;
    const v10 = data[z0][x1] || 0;
    const v01 = data[z1][x0] || 0;
    const v11 = data[z1][x1] || 0;
    
    const vx0 = v00 * (1 - fx) + v10 * fx;
    const vx1 = v01 * (1 - fx) + v11 * fx;
    
    return vx0 * (1 - fz) + vx1 * fz;
  }
  
  /**
   * 2D 배열로 내보내기
   */
  toArray(): number[][] {
    const result: number[][] = [];
    
    for (let z = 0; z < this.resolution; z++) {
      result[z] = [];
      for (let x = 0; x < this.resolution; x++) {
        result[z][x] = this.data[z * this.resolution + x];
      }
    }
    
    return result;
  }
  
  /**
   * 디버그용 캔버스 렌더링
   */
  renderToCanvas(): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = this.resolution;
    canvas.height = this.resolution;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return canvas;
    
    const imageData = ctx.createImageData(this.resolution, this.resolution);
    const { min, max } = this.getHeightRange();
    const range = max - min || 1;
    
    for (let i = 0; i < this.data.length; i++) {
      const normalized = ((this.data[i] - min) / range) * 255;
      const pixelIndex = i * 4;
      imageData.data[pixelIndex] = normalized;     // R
      imageData.data[pixelIndex + 1] = normalized; // G
      imageData.data[pixelIndex + 2] = normalized; // B
      imageData.data[pixelIndex + 3] = 255;        // A
    }
    
    ctx.putImageData(imageData, 0, 0);
    return canvas;
  }
  
  /**
   * 리소스 해제
   */
  dispose(): void {
    this.data = new Float32Array(0);
  }
}

// ========================================
// 팩토리 함수
// ========================================

/**
 * 높이맵 생성
 */
export function createHeightMap(config: HeightMapConfig): HeightMap {
  return new HeightMap(config);
}

/**
 * 평탄한 높이맵 생성
 */
export function createFlatHeightMap(
  width: number,
  depth: number,
  resolution: number = 64
): HeightMap {
  return new HeightMap({
    width,
    depth,
    resolution,
    heightScale: 0,
  });
}

/**
 * 프로시저럴 높이맵 생성
 */
export function createProceduralHeightMap(
  width: number,
  depth: number,
  terrainType: TerrainType,
  resolution: number = 128
): HeightMap {
  const heightMap = new HeightMap({
    width,
    depth,
    resolution,
    heightScale: 1.0,
    seed: Date.now(),
  });
  
  heightMap.generateProcedural(terrainType);
  return heightMap;
}





