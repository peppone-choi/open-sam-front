/**
 * Gin7 ParticleSystem - 파티클 효과 시스템
 * 
 * 기능:
 * - 파티클 풀 관리
 * - 이미터 설정 및 업데이트
 * - 다양한 파티클 프리셋 (폭발, 빔, 엔진 등)
 */

// ========================================
// 타입 정의
// ========================================

/** 파티클 */
export interface Particle {
  id: number;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  life: number;
  maxLife: number;
  size: number;
  sizeEnd: number;
  color: ParticleColor;
  colorEnd: ParticleColor;
  alpha: number;
  alphaEnd: number;
  rotation: number;
  rotationSpeed: number;
  active: boolean;
}

/** 파티클 색상 */
export interface ParticleColor {
  r: number;
  g: number;
  b: number;
}

/** 이미터 설정 */
export interface EmitterConfig {
  position: { x: number; y: number; z: number };
  direction: { x: number; y: number; z: number };
  spread: number;
  speed: { min: number; max: number };
  life: { min: number; max: number };
  size: { start: number; end: number };
  color: { start: ParticleColor; end: ParticleColor };
  alpha: { start: number; end: number };
  rate: number;
  burst?: number;
  gravity: { x: number; y: number; z: number };
  rotation: { min: number; max: number };
  rotationSpeed: { min: number; max: number };
}

/** 이미터 */
export interface Emitter {
  id: string;
  config: EmitterConfig;
  active: boolean;
  elapsed: number;
  duration: number;
  particleCount: number;
}

/** 파티클 프리셋 타입 */
export type ParticlePreset = 
  | 'beam_impact'
  | 'explosion_small'
  | 'explosion_large'
  | 'shield_hit'
  | 'shield_break'
  | 'engine_trail'
  | 'warp_effect'
  | 'debris'
  | 'spark';

// ========================================
// 프리셋 정의
// ========================================

export const PARTICLE_PRESETS: Record<ParticlePreset, Partial<EmitterConfig>> = {
  beam_impact: {
    spread: 45,
    speed: { min: 50, max: 150 },
    life: { min: 0.2, max: 0.5 },
    size: { start: 8, end: 2 },
    color: { 
      start: { r: 255, g: 100, b: 50 }, 
      end: { r: 255, g: 200, b: 100 } 
    },
    alpha: { start: 1, end: 0 },
    rate: 0,
    burst: 30,
    gravity: { x: 0, y: 0, z: 0 },
    rotation: { min: 0, max: 360 },
    rotationSpeed: { min: -180, max: 180 },
  },
  explosion_small: {
    spread: 180,
    speed: { min: 100, max: 300 },
    life: { min: 0.3, max: 0.8 },
    size: { start: 15, end: 5 },
    color: { 
      start: { r: 255, g: 200, b: 50 }, 
      end: { r: 255, g: 50, b: 0 } 
    },
    alpha: { start: 1, end: 0 },
    rate: 0,
    burst: 50,
    gravity: { x: 0, y: -20, z: 0 },
    rotation: { min: 0, max: 360 },
    rotationSpeed: { min: -360, max: 360 },
  },
  explosion_large: {
    spread: 180,
    speed: { min: 150, max: 500 },
    life: { min: 0.5, max: 1.5 },
    size: { start: 30, end: 10 },
    color: { 
      start: { r: 255, g: 255, b: 200 }, 
      end: { r: 255, g: 100, b: 0 } 
    },
    alpha: { start: 1, end: 0 },
    rate: 0,
    burst: 150,
    gravity: { x: 0, y: -10, z: 0 },
    rotation: { min: 0, max: 360 },
    rotationSpeed: { min: -180, max: 180 },
  },
  shield_hit: {
    spread: 90,
    speed: { min: 20, max: 80 },
    life: { min: 0.3, max: 0.6 },
    size: { start: 12, end: 4 },
    color: { 
      start: { r: 100, g: 200, b: 255 }, 
      end: { r: 50, g: 100, b: 255 } 
    },
    alpha: { start: 0.8, end: 0 },
    rate: 0,
    burst: 20,
    gravity: { x: 0, y: 0, z: 0 },
    rotation: { min: 0, max: 360 },
    rotationSpeed: { min: -90, max: 90 },
  },
  shield_break: {
    spread: 180,
    speed: { min: 100, max: 250 },
    life: { min: 0.4, max: 1.0 },
    size: { start: 20, end: 5 },
    color: { 
      start: { r: 100, g: 200, b: 255 }, 
      end: { r: 255, g: 255, b: 255 } 
    },
    alpha: { start: 1, end: 0 },
    rate: 0,
    burst: 80,
    gravity: { x: 0, y: 0, z: 0 },
    rotation: { min: 0, max: 360 },
    rotationSpeed: { min: -360, max: 360 },
  },
  engine_trail: {
    spread: 10,
    speed: { min: 20, max: 50 },
    life: { min: 0.2, max: 0.5 },
    size: { start: 6, end: 2 },
    color: { 
      start: { r: 100, g: 150, b: 255 }, 
      end: { r: 50, g: 80, b: 200 } 
    },
    alpha: { start: 0.7, end: 0 },
    rate: 50,
    gravity: { x: 0, y: 0, z: 0 },
    rotation: { min: 0, max: 360 },
    rotationSpeed: { min: 0, max: 0 },
  },
  warp_effect: {
    spread: 5,
    speed: { min: 500, max: 1000 },
    life: { min: 0.5, max: 1.0 },
    size: { start: 4, end: 20 },
    color: { 
      start: { r: 255, g: 255, b: 255 }, 
      end: { r: 100, g: 150, b: 255 } 
    },
    alpha: { start: 1, end: 0 },
    rate: 100,
    gravity: { x: 0, y: 0, z: 0 },
    rotation: { min: 0, max: 0 },
    rotationSpeed: { min: 0, max: 0 },
  },
  debris: {
    spread: 180,
    speed: { min: 50, max: 200 },
    life: { min: 1, max: 3 },
    size: { start: 5, end: 3 },
    color: { 
      start: { r: 150, g: 150, b: 150 }, 
      end: { r: 80, g: 80, b: 80 } 
    },
    alpha: { start: 1, end: 0.5 },
    rate: 0,
    burst: 30,
    gravity: { x: 0, y: -30, z: 0 },
    rotation: { min: 0, max: 360 },
    rotationSpeed: { min: -360, max: 360 },
  },
  spark: {
    spread: 60,
    speed: { min: 100, max: 200 },
    life: { min: 0.1, max: 0.3 },
    size: { start: 3, end: 1 },
    color: { 
      start: { r: 255, g: 255, b: 200 }, 
      end: { r: 255, g: 200, b: 100 } 
    },
    alpha: { start: 1, end: 0 },
    rate: 0,
    burst: 15,
    gravity: { x: 0, y: -50, z: 0 },
    rotation: { min: 0, max: 0 },
    rotationSpeed: { min: 0, max: 0 },
  },
};

// ========================================
// Gin7ParticleSystem 클래스
// ========================================

export class Gin7ParticleSystem {
  // 파티클 풀
  private pool: Particle[] = [];
  private maxParticles: number;
  private activeParticles: Particle[] = [];
  
  // 이미터
  private emitters: Map<string, Emitter> = new Map();
  private emitterIdCounter = 0;
  
  // 렌더링 콜백
  private renderCallback: ((particles: Particle[]) => void) | null = null;
  
  // 상태
  private paused = false;
  private lastUpdateTime = 0;

  constructor(maxParticles = 2000) {
    this.maxParticles = maxParticles;
    this.initializePool();
  }

  /**
   * 파티클 풀 초기화
   */
  private initializePool(): void {
    for (let i = 0; i < this.maxParticles; i++) {
      this.pool.push(this.createParticle(i));
    }
  }

  /**
   * 빈 파티클 생성
   */
  private createParticle(id: number): Particle {
    return {
      id,
      x: 0, y: 0, z: 0,
      vx: 0, vy: 0, vz: 0,
      life: 0,
      maxLife: 1,
      size: 1,
      sizeEnd: 1,
      color: { r: 255, g: 255, b: 255 },
      colorEnd: { r: 255, g: 255, b: 255 },
      alpha: 1,
      alphaEnd: 0,
      rotation: 0,
      rotationSpeed: 0,
      active: false,
    };
  }

  /**
   * 풀에서 비활성 파티클 가져오기
   */
  private getFromPool(): Particle | null {
    for (const particle of this.pool) {
      if (!particle.active) {
        return particle;
      }
    }
    return null;
  }

  // ========================================
  // 이미터 관리
  // ========================================

  /**
   * 이미터 생성
   */
  createEmitter(
    preset: ParticlePreset,
    position: { x: number; y: number; z: number },
    direction: { x: number; y: number; z: number } = { x: 0, y: 1, z: 0 },
    duration = 0
  ): string {
    const presetConfig = PARTICLE_PRESETS[preset];
    
    const config: EmitterConfig = {
      position: { ...position },
      direction: { ...direction },
      spread: presetConfig.spread ?? 45,
      speed: presetConfig.speed ?? { min: 50, max: 100 },
      life: presetConfig.life ?? { min: 0.5, max: 1 },
      size: presetConfig.size ?? { start: 10, end: 2 },
      color: presetConfig.color ?? { 
        start: { r: 255, g: 255, b: 255 }, 
        end: { r: 255, g: 255, b: 255 } 
      },
      alpha: presetConfig.alpha ?? { start: 1, end: 0 },
      rate: presetConfig.rate ?? 0,
      burst: presetConfig.burst,
      gravity: presetConfig.gravity ?? { x: 0, y: 0, z: 0 },
      rotation: presetConfig.rotation ?? { min: 0, max: 0 },
      rotationSpeed: presetConfig.rotationSpeed ?? { min: 0, max: 0 },
    };

    const id = `emitter_${++this.emitterIdCounter}`;
    const emitter: Emitter = {
      id,
      config,
      active: true,
      elapsed: 0,
      duration,
      particleCount: 0,
    };

    this.emitters.set(id, emitter);

    // 버스트 모드면 즉시 방출
    if (config.burst && config.burst > 0) {
      this.emitBurst(emitter, config.burst);
    }

    return id;
  }

  /**
   * 이미터 제거
   */
  removeEmitter(id: string): void {
    this.emitters.delete(id);
  }

  /**
   * 모든 이미터 제거
   */
  clearEmitters(): void {
    this.emitters.clear();
  }

  /**
   * 버스트 방출
   */
  private emitBurst(emitter: Emitter, count: number): void {
    for (let i = 0; i < count; i++) {
      this.emitParticle(emitter);
    }
  }

  /**
   * 단일 파티클 방출
   */
  private emitParticle(emitter: Emitter): void {
    const particle = this.getFromPool();
    if (!particle) return;

    const config = emitter.config;
    
    // 위치
    particle.x = config.position.x;
    particle.y = config.position.y;
    particle.z = config.position.z;

    // 방향 계산 (스프레드 적용)
    const spreadRad = (config.spread * Math.PI) / 180;
    const theta = Math.random() * spreadRad - spreadRad / 2;
    const phi = Math.random() * Math.PI * 2;
    
    const dirLength = Math.sqrt(
      config.direction.x ** 2 + 
      config.direction.y ** 2 + 
      config.direction.z ** 2
    ) || 1;
    
    const baseDir = {
      x: config.direction.x / dirLength,
      y: config.direction.y / dirLength,
      z: config.direction.z / dirLength,
    };

    // 스프레드 회전 적용 (간단한 구현)
    const randomDir = {
      x: baseDir.x + Math.sin(theta) * Math.cos(phi),
      y: baseDir.y + Math.cos(theta),
      z: baseDir.z + Math.sin(theta) * Math.sin(phi),
    };
    
    const speed = this.randomRange(config.speed.min, config.speed.max);
    particle.vx = randomDir.x * speed;
    particle.vy = randomDir.y * speed;
    particle.vz = randomDir.z * speed;

    // 수명
    particle.life = this.randomRange(config.life.min, config.life.max);
    particle.maxLife = particle.life;

    // 크기
    particle.size = config.size.start;
    particle.sizeEnd = config.size.end;

    // 색상
    particle.color = { ...config.color.start };
    particle.colorEnd = { ...config.color.end };

    // 투명도
    particle.alpha = config.alpha.start;
    particle.alphaEnd = config.alpha.end;

    // 회전
    particle.rotation = this.randomRange(config.rotation.min, config.rotation.max);
    particle.rotationSpeed = this.randomRange(config.rotationSpeed.min, config.rotationSpeed.max);

    particle.active = true;
    this.activeParticles.push(particle);
    emitter.particleCount++;
  }

  /**
   * 범위 내 랜덤 값
   */
  private randomRange(min: number, max: number): number {
    return min + Math.random() * (max - min);
  }

  // ========================================
  // 업데이트
  // ========================================

  /**
   * 시스템 업데이트
   */
  update(deltaTime: number): void {
    if (this.paused) return;

    // 이미터 업데이트
    for (const [id, emitter] of this.emitters) {
      if (!emitter.active) continue;

      emitter.elapsed += deltaTime;

      // 지속 시간 체크
      if (emitter.duration > 0 && emitter.elapsed >= emitter.duration) {
        emitter.active = false;
        this.emitters.delete(id);
        continue;
      }

      // 연속 방출
      if (emitter.config.rate > 0) {
        const particlesToEmit = emitter.config.rate * deltaTime;
        const whole = Math.floor(particlesToEmit);
        const fractional = particlesToEmit - whole;
        
        for (let i = 0; i < whole; i++) {
          this.emitParticle(emitter);
        }
        
        if (Math.random() < fractional) {
          this.emitParticle(emitter);
        }
      }
    }

    // 파티클 업데이트
    for (let i = this.activeParticles.length - 1; i >= 0; i--) {
      const particle = this.activeParticles[i];
      
      // 수명 감소
      particle.life -= deltaTime;
      
      if (particle.life <= 0) {
        particle.active = false;
        this.activeParticles.splice(i, 1);
        continue;
      }

      // 진행률
      const progress = 1 - particle.life / particle.maxLife;

      // 속도에 중력 적용
      const gravity = this.findEmitterGravity(particle);
      particle.vx += gravity.x * deltaTime;
      particle.vy += gravity.y * deltaTime;
      particle.vz += gravity.z * deltaTime;

      // 위치 업데이트
      particle.x += particle.vx * deltaTime;
      particle.y += particle.vy * deltaTime;
      particle.z += particle.vz * deltaTime;

      // 크기 보간
      particle.size = this.lerp(
        particle.size, 
        particle.sizeEnd, 
        progress * 0.1
      );

      // 색상 보간
      particle.color.r = this.lerp(particle.color.r, particle.colorEnd.r, progress * 0.1);
      particle.color.g = this.lerp(particle.color.g, particle.colorEnd.g, progress * 0.1);
      particle.color.b = this.lerp(particle.color.b, particle.colorEnd.b, progress * 0.1);

      // 투명도 보간
      particle.alpha = this.lerp(particle.alpha, particle.alphaEnd, progress * 0.1);

      // 회전
      particle.rotation += particle.rotationSpeed * deltaTime;
    }

    // 렌더링 콜백
    if (this.renderCallback) {
      this.renderCallback(this.activeParticles);
    }
  }

  /**
   * 파티클의 중력 찾기 (간단한 구현)
   */
  private findEmitterGravity(_particle: Particle): { x: number; y: number; z: number } {
    // 첫 번째 활성 이미터의 중력 사용 (단순화)
    for (const emitter of this.emitters.values()) {
      if (emitter.active) {
        return emitter.config.gravity;
      }
    }
    return { x: 0, y: 0, z: 0 };
  }

  /**
   * 선형 보간
   */
  private lerp(start: number, end: number, t: number): number {
    return start + (end - start) * t;
  }

  // ========================================
  // 편의 메서드
  // ========================================

  /**
   * 폭발 효과
   */
  explode(
    position: { x: number; y: number; z: number },
    size: 'small' | 'large' = 'small'
  ): string {
    const preset = size === 'large' ? 'explosion_large' : 'explosion_small';
    return this.createEmitter(preset, position, { x: 0, y: 1, z: 0 });
  }

  /**
   * 빔 충격 효과
   */
  beamImpact(
    position: { x: number; y: number; z: number },
    direction: { x: number; y: number; z: number }
  ): string {
    return this.createEmitter('beam_impact', position, direction);
  }

  /**
   * 쉴드 피격 효과
   */
  shieldHit(
    position: { x: number; y: number; z: number },
    normal: { x: number; y: number; z: number }
  ): string {
    return this.createEmitter('shield_hit', position, normal);
  }

  /**
   * 쉴드 붕괴 효과
   */
  shieldBreak(position: { x: number; y: number; z: number }): string {
    return this.createEmitter('shield_break', position, { x: 0, y: 0, z: 0 });
  }

  /**
   * 엔진 트레일
   */
  createEngineTrail(
    position: { x: number; y: number; z: number },
    direction: { x: number; y: number; z: number }
  ): string {
    return this.createEmitter('engine_trail', position, direction, Infinity);
  }

  /**
   * 와프 효과
   */
  warpEffect(
    position: { x: number; y: number; z: number },
    direction: { x: number; y: number; z: number }
  ): string {
    return this.createEmitter('warp_effect', position, direction, 1.5);
  }

  /**
   * 파편 효과
   */
  debris(position: { x: number; y: number; z: number }): string {
    return this.createEmitter('debris', position, { x: 0, y: 1, z: 0 });
  }

  /**
   * 스파크 효과
   */
  spark(
    position: { x: number; y: number; z: number },
    direction: { x: number; y: number; z: number }
  ): string {
    return this.createEmitter('spark', position, direction);
  }

  // ========================================
  // 제어
  // ========================================

  /**
   * 일시정지
   */
  pause(): void {
    this.paused = true;
  }

  /**
   * 재개
   */
  resume(): void {
    this.paused = false;
  }

  /**
   * 렌더링 콜백 설정
   */
  setRenderCallback(callback: (particles: Particle[]) => void): void {
    this.renderCallback = callback;
  }

  // ========================================
  // 상태 조회
  // ========================================

  /**
   * 활성 파티클 수
   */
  getActiveParticleCount(): number {
    return this.activeParticles.length;
  }

  /**
   * 활성 이미터 수
   */
  getActiveEmitterCount(): number {
    return this.emitters.size;
  }

  /**
   * 활성 파티클 배열 반환
   */
  getActiveParticles(): ReadonlyArray<Particle> {
    return this.activeParticles;
  }

  // ========================================
  // 정리
  // ========================================

  /**
   * 모든 파티클 정리
   */
  clear(): void {
    for (const particle of this.activeParticles) {
      particle.active = false;
    }
    this.activeParticles = [];
    this.emitters.clear();
  }

  /**
   * 리소스 정리
   */
  dispose(): void {
    this.clear();
    this.pool = [];
    this.renderCallback = null;
    console.log('✨ [Gin7Particle] Disposed');
  }
}

export default Gin7ParticleSystem;








