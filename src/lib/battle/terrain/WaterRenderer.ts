/**
 * WaterRenderer.ts
 * 물/강 렌더링 시스템
 * 
 * 주요 기능:
 * 1. 반투명 수면 렌더링
 * 2. 파문 효과 (선택)
 * 3. 흐름 애니메이션
 * 4. 반사 효과 (선택)
 */

import * as THREE from 'three';

// ========================================
// 타입 정의
// ========================================

/** 물 설정 */
export interface WaterConfig {
  /** 수면 너비 */
  width: number;
  /** 수면 깊이 */
  depth: number;
  /** 수면 높이 (Y 위치) */
  level: number;
  /** 물 색상 */
  color: string;
  /** 불투명도 (0~1) */
  opacity: number;
  /** 흐름 방향 및 속도 */
  flow: { x: number; y: number };
  /** 파문 효과 사용 */
  ripples: boolean;
  /** 반사 사용 (성능 영향) */
  reflection?: boolean;
  /** 굴절 사용 (성능 영향) */
  refraction?: boolean;
  /** 파도 높이 */
  waveHeight?: number;
  /** 파도 속도 */
  waveSpeed?: number;
}

/** 파문 데이터 */
interface Ripple {
  /** 위치 */
  position: THREE.Vector2;
  /** 크기 */
  radius: number;
  /** 강도 */
  intensity: number;
  /** 생성 시간 */
  startTime: number;
  /** 지속 시간 */
  duration: number;
}

// ========================================
// 셰이더
// ========================================

/** 물 버텍스 셰이더 */
const waterVertexShader = `
  uniform float uTime;
  uniform float uWaveHeight;
  uniform float uWaveSpeed;
  uniform vec2 uFlow;
  
  varying vec2 vUv;
  varying vec3 vWorldPosition;
  varying float vWaveHeight;
  
  void main() {
    vUv = uv;
    
    // 파도 계산
    vec3 pos = position;
    float wave1 = sin(pos.x * 0.5 + uTime * uWaveSpeed) * uWaveHeight;
    float wave2 = sin(pos.y * 0.3 + uTime * uWaveSpeed * 0.8) * uWaveHeight * 0.5;
    float wave3 = sin((pos.x + pos.y) * 0.2 + uTime * uWaveSpeed * 1.2) * uWaveHeight * 0.3;
    
    pos.z += wave1 + wave2 + wave3;
    vWaveHeight = pos.z;
    
    // 흐름 효과 (UV 이동)
    vUv += uFlow * uTime * 0.1;
    
    vec4 worldPosition = modelMatrix * vec4(pos, 1.0);
    vWorldPosition = worldPosition.xyz;
    
    gl_Position = projectionMatrix * viewMatrix * worldPosition;
  }
`;

/** 물 프래그먼트 셰이더 */
const waterFragmentShader = `
  uniform vec3 uColor;
  uniform float uOpacity;
  uniform float uTime;
  uniform sampler2D uRippleMap;
  uniform bool uUseRipples;
  
  varying vec2 vUv;
  varying vec3 vWorldPosition;
  varying float vWaveHeight;
  
  void main() {
    vec3 color = uColor;
    float alpha = uOpacity;
    
    // 깊이에 따른 색상 변화
    float depth = 1.0 - smoothstep(-0.5, 0.5, vWaveHeight);
    color = mix(color, color * 0.7, depth * 0.3);
    
    // 하이라이트 (파도 꼭대기)
    float highlight = smoothstep(0.0, 0.1, vWaveHeight);
    color += vec3(0.1, 0.15, 0.2) * highlight;
    
    // 파문 효과
    if (uUseRipples) {
      vec4 ripple = texture2D(uRippleMap, vUv);
      color += ripple.rgb * ripple.a * 0.3;
      alpha = mix(alpha, 1.0, ripple.a * 0.2);
    }
    
    // 프레넬 효과 (가장자리 반투명)
    vec3 viewDir = normalize(cameraPosition - vWorldPosition);
    float fresnel = pow(1.0 - max(dot(viewDir, vec3(0.0, 1.0, 0.0)), 0.0), 2.0);
    alpha = mix(alpha, alpha * 0.5, fresnel);
    
    gl_FragColor = vec4(color, alpha);
  }
`;

// ========================================
// 메인 클래스
// ========================================

export class WaterRenderer {
  private parentGroup: THREE.Group;
  private config: WaterConfig | null = null;
  
  // 렌더링 오브젝트
  private waterMesh: THREE.Mesh | null = null;
  private waterMaterial: THREE.ShaderMaterial | null = null;
  
  // 파문 시스템
  private ripples: Ripple[] = [];
  private rippleTexture: THREE.DataTexture | null = null;
  private rippleData: Uint8Array | null = null;
  private rippleResolution: number = 256;
  
  // 시간
  private startTime: number = Date.now();
  
  constructor(parentGroup: THREE.Group) {
    this.parentGroup = parentGroup;
  }
  
  // ========================================
  // 물 생성
  // ========================================
  
  /**
   * 물 메시 생성
   */
  create(config: WaterConfig): THREE.Mesh {
    this.config = config;
    
    // 기존 정리
    this.dispose();
    
    // 지오메트리
    const segments = Math.max(32, Math.floor(Math.max(config.width, config.depth) / 4));
    const geometry = new THREE.PlaneGeometry(
      config.width,
      config.depth,
      segments,
      segments
    );
    
    // 파문 텍스처 생성
    this.createRippleTexture();
    
    // 셰이더 머티리얼
    this.waterMaterial = new THREE.ShaderMaterial({
      vertexShader: waterVertexShader,
      fragmentShader: waterFragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uColor: { value: new THREE.Color(config.color) },
        uOpacity: { value: config.opacity },
        uWaveHeight: { value: config.waveHeight ?? 0.1 },
        uWaveSpeed: { value: config.waveSpeed ?? 1.0 },
        uFlow: { value: new THREE.Vector2(config.flow.x, config.flow.y) },
        uRippleMap: { value: this.rippleTexture },
        uUseRipples: { value: config.ripples },
      },
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    
    // 메시 생성
    this.waterMesh = new THREE.Mesh(geometry, this.waterMaterial);
    this.waterMesh.rotation.x = -Math.PI / 2;
    this.waterMesh.position.y = config.level;
    this.waterMesh.name = 'water-surface';
    this.waterMesh.renderOrder = 1; // 투명 객체 렌더링 순서
    
    this.parentGroup.add(this.waterMesh);
    
    console.log(`💧 물 렌더러 생성: ${config.width}x${config.depth}`);
    
    return this.waterMesh;
  }
  
  /**
   * 간단한 물 생성 (셰이더 없이)
   */
  createSimple(config: WaterConfig): THREE.Mesh {
    this.config = config;
    
    // 기존 정리
    this.dispose();
    
    // 지오메트리
    const geometry = new THREE.PlaneGeometry(config.width, config.depth, 32, 32);
    
    // 기본 머티리얼
    const material = new THREE.MeshStandardMaterial({
      color: config.color,
      transparent: true,
      opacity: config.opacity,
      roughness: 0.1,
      metalness: 0.3,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    
    // 메시 생성
    this.waterMesh = new THREE.Mesh(geometry, material);
    this.waterMesh.rotation.x = -Math.PI / 2;
    this.waterMesh.position.y = config.level;
    this.waterMesh.name = 'water-surface-simple';
    this.waterMesh.renderOrder = 1;
    
    this.parentGroup.add(this.waterMesh);
    
    return this.waterMesh;
  }
  
  /**
   * 파문 텍스처 생성
   */
  private createRippleTexture(): void {
    const size = this.rippleResolution;
    this.rippleData = new Uint8Array(size * size * 4);
    
    // 투명하게 초기화
    this.rippleData.fill(0);
    
    this.rippleTexture = new THREE.DataTexture(
      this.rippleData,
      size,
      size,
      THREE.RGBAFormat
    );
    this.rippleTexture.needsUpdate = true;
  }
  
  // ========================================
  // 파문 효과
  // ========================================
  
  /**
   * 파문 추가
   */
  addRipple(worldX: number, worldZ: number, intensity: number = 1.0): void {
    if (!this.config || !this.config.ripples) return;
    
    // 월드 좌표 → 텍스처 UV
    const u = (worldX + this.config.width / 2) / this.config.width;
    const v = (worldZ + this.config.depth / 2) / this.config.depth;
    
    // 범위 체크
    if (u < 0 || u > 1 || v < 0 || v > 1) return;
    
    this.ripples.push({
      position: new THREE.Vector2(u, v),
      radius: 0,
      intensity,
      startTime: Date.now(),
      duration: 2000, // 2초
    });
  }
  
  /**
   * 파문 텍스처 업데이트
   */
  private updateRipples(): void {
    if (!this.rippleData || !this.rippleTexture) return;
    
    const now = Date.now();
    const size = this.rippleResolution;
    
    // 텍스처 초기화
    this.rippleData.fill(0);
    
    // 활성 파문 업데이트
    this.ripples = this.ripples.filter(ripple => {
      const elapsed = now - ripple.startTime;
      if (elapsed > ripple.duration) return false;
      
      // 진행률 (0~1)
      const progress = elapsed / ripple.duration;
      const radius = progress * 0.3; // 최대 반경
      const fadeOut = 1 - progress;
      
      // 파문 그리기
      const centerX = Math.floor(ripple.position.x * size);
      const centerY = Math.floor(ripple.position.y * size);
      const pixelRadius = Math.floor(radius * size);
      
      for (let dy = -pixelRadius; dy <= pixelRadius; dy++) {
        for (let dx = -pixelRadius; dx <= pixelRadius; dx++) {
          const x = centerX + dx;
          const y = centerY + dy;
          
          if (x < 0 || x >= size || y < 0 || y >= size) continue;
          
          const dist = Math.sqrt(dx * dx + dy * dy) / pixelRadius;
          if (dist > 1) continue;
          
          // 링 형태의 파문
          const ringDist = Math.abs(dist - 0.8);
          const ringIntensity = Math.max(0, 1 - ringDist * 5);
          const intensity = ringIntensity * fadeOut * ripple.intensity;
          
          const idx = (y * size + x) * 4;
          this.rippleData[idx] = Math.min(255, this.rippleData[idx] + intensity * 100);     // R
          this.rippleData[idx + 1] = Math.min(255, this.rippleData[idx + 1] + intensity * 150); // G
          this.rippleData[idx + 2] = Math.min(255, this.rippleData[idx + 2] + intensity * 255); // B
          this.rippleData[idx + 3] = Math.min(255, this.rippleData[idx + 3] + intensity * 255); // A
        }
      }
      
      return true;
    });
    
    this.rippleTexture.needsUpdate = true;
  }
  
  // ========================================
  // 업데이트
  // ========================================
  
  /**
   * 물 애니메이션 업데이트
   */
  update(deltaTime: number): void {
    if (!this.waterMaterial || !this.config) return;
    
    // 시간 업데이트
    const elapsed = (Date.now() - this.startTime) / 1000;
    this.waterMaterial.uniforms.uTime.value = elapsed;
    
    // 파문 업데이트
    if (this.config.ripples) {
      this.updateRipples();
    }
    
    // 간단한 물 (셰이더 없음)의 경우 지오메트리 변형
    if (this.waterMesh && !this.waterMaterial.isShaderMaterial) {
      this.updateSimpleWater(elapsed);
    }
  }
  
  /**
   * 간단한 물 애니메이션
   */
  private updateSimpleWater(time: number): void {
    if (!this.waterMesh || !this.config) return;
    
    const geometry = this.waterMesh.geometry as THREE.PlaneGeometry;
    const positions = geometry.attributes.position;
    const waveHeight = this.config.waveHeight ?? 0.1;
    const waveSpeed = this.config.waveSpeed ?? 1.0;
    
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const y = positions.getY(i);
      
      // 파도 계산
      const wave1 = Math.sin(x * 0.5 + time * waveSpeed) * waveHeight;
      const wave2 = Math.sin(y * 0.3 + time * waveSpeed * 0.8) * waveHeight * 0.5;
      
      positions.setZ(i, wave1 + wave2);
    }
    
    positions.needsUpdate = true;
    geometry.computeVertexNormals();
  }
  
  // ========================================
  // 설정 변경
  // ========================================
  
  /**
   * 물 색상 변경
   */
  setColor(color: string): void {
    if (this.waterMaterial?.uniforms) {
      this.waterMaterial.uniforms.uColor.value.set(color);
    }
    
    if (this.config) {
      this.config.color = color;
    }
  }
  
  /**
   * 불투명도 변경
   */
  setOpacity(opacity: number): void {
    if (this.waterMaterial?.uniforms) {
      this.waterMaterial.uniforms.uOpacity.value = opacity;
    }
    
    if (this.config) {
      this.config.opacity = opacity;
    }
  }
  
  /**
   * 흐름 방향 변경
   */
  setFlow(x: number, y: number): void {
    if (this.waterMaterial?.uniforms) {
      this.waterMaterial.uniforms.uFlow.value.set(x, y);
    }
    
    if (this.config) {
      this.config.flow = { x, y };
    }
  }
  
  /**
   * 파도 설정 변경
   */
  setWaveParams(height: number, speed: number): void {
    if (this.waterMaterial?.uniforms) {
      this.waterMaterial.uniforms.uWaveHeight.value = height;
      this.waterMaterial.uniforms.uWaveSpeed.value = speed;
    }
    
    if (this.config) {
      this.config.waveHeight = height;
      this.config.waveSpeed = speed;
    }
  }
  
  /**
   * 수면 높이 변경
   */
  setLevel(level: number): void {
    if (this.waterMesh) {
      this.waterMesh.position.y = level;
    }
    
    if (this.config) {
      this.config.level = level;
    }
  }
  
  // ========================================
  // 쿼리
  // ========================================
  
  /**
   * 특정 위치가 물 위인지 확인
   */
  isAboveWater(x: number, y: number, z: number): boolean {
    if (!this.config || !this.waterMesh) return false;
    
    // 범위 체크
    const halfWidth = this.config.width / 2;
    const halfDepth = this.config.depth / 2;
    
    if (x < -halfWidth || x > halfWidth || z < -halfDepth || z > halfDepth) {
      return false;
    }
    
    return y > this.config.level;
  }
  
  /**
   * 특정 위치의 수심 조회
   */
  getWaterDepth(x: number, z: number): number {
    if (!this.config) return 0;
    
    // 물 위치 밖이면 0
    const halfWidth = this.config.width / 2;
    const halfDepth = this.config.depth / 2;
    
    if (x < -halfWidth || x > halfWidth || z < -halfDepth || z > halfDepth) {
      return 0;
    }
    
    // 간단한 수심 반환 (실제로는 지형 높이를 고려해야 함)
    return Math.max(0, this.config.level + 1);
  }
  
  /**
   * 물 메시 반환
   */
  getMesh(): THREE.Mesh | null {
    return this.waterMesh;
  }
  
  /**
   * 설정 반환
   */
  getConfig(): WaterConfig | null {
    return this.config;
  }
  
  // ========================================
  // 정리
  // ========================================
  
  /**
   * 리소스 해제
   */
  dispose(): void {
    if (this.waterMesh) {
      this.waterMesh.geometry.dispose();
      if (this.waterMesh.material instanceof THREE.Material) {
        this.waterMesh.material.dispose();
      }
      this.parentGroup.remove(this.waterMesh);
      this.waterMesh = null;
    }
    
    if (this.rippleTexture) {
      this.rippleTexture.dispose();
      this.rippleTexture = null;
    }
    
    this.waterMaterial = null;
    this.rippleData = null;
    this.ripples = [];
    this.config = null;
  }
}

// ========================================
// 팩토리 함수
// ========================================

/**
 * 물 렌더러 생성
 */
export function createWaterRenderer(parentGroup: THREE.Group): WaterRenderer {
  return new WaterRenderer(parentGroup);
}

/**
 * 강 설정 프리셋
 */
export function createRiverConfig(
  width: number,
  depth: number,
  options: Partial<WaterConfig> = {}
): WaterConfig {
  return {
    width,
    depth,
    level: options.level ?? 0.2,
    color: options.color ?? '#4169e1',
    opacity: options.opacity ?? 0.7,
    flow: options.flow ?? { x: 0.1, y: 0 },
    ripples: options.ripples ?? true,
    waveHeight: options.waveHeight ?? 0.15,
    waveSpeed: options.waveSpeed ?? 1.2,
  };
}

/**
 * 늪지 설정 프리셋
 */
export function createSwampConfig(
  width: number,
  depth: number,
  options: Partial<WaterConfig> = {}
): WaterConfig {
  return {
    width,
    depth,
    level: options.level ?? -0.1,
    color: options.color ?? '#556b2f',
    opacity: options.opacity ?? 0.5,
    flow: options.flow ?? { x: 0.02, y: 0.01 },
    ripples: options.ripples ?? false,
    waveHeight: options.waveHeight ?? 0.05,
    waveSpeed: options.waveSpeed ?? 0.3,
  };
}

/**
 * 호수 설정 프리셋
 */
export function createLakeConfig(
  width: number,
  depth: number,
  options: Partial<WaterConfig> = {}
): WaterConfig {
  return {
    width,
    depth,
    level: options.level ?? 0,
    color: options.color ?? '#1e90ff',
    opacity: options.opacity ?? 0.8,
    flow: options.flow ?? { x: 0, y: 0 },
    ripples: options.ripples ?? true,
    waveHeight: options.waveHeight ?? 0.08,
    waveSpeed: options.waveSpeed ?? 0.5,
  };
}





