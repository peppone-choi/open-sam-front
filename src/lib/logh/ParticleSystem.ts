/**
 * LOGH 파티클 시스템
 * 
 * 엔진 분사, 무기 효과, 폭발 등 파티클 효과
 */

import * as THREE from 'three';

export interface ParticleConfig {
  count: number;
  size: number;
  color: THREE.Color | number;
  lifetime: number;
  speed: number;
  spread: number;
  opacity: number;
  fadeOut: boolean;
  gravity?: THREE.Vector3;
}

export interface Particle {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  age: number;
  lifetime: number;
  size: number;
  opacity: number;
}

/**
 * 기본 파티클 이미터
 */
export class ParticleEmitter {
  private particles: Particle[] = [];
  private geometry: THREE.BufferGeometry;
  private material: THREE.PointsMaterial;
  private points: THREE.Points;
  private config: ParticleConfig;
  private isEmitting = false;
  private emitRate = 10; // 초당 파티클 수
  private emitAccumulator = 0;
  
  constructor(config: Partial<ParticleConfig> = {}) {
    this.config = {
      count: config.count ?? 100,
      size: config.size ?? 2,
      color: config.color ?? 0xffffff,
      lifetime: config.lifetime ?? 1,
      speed: config.speed ?? 10,
      spread: config.spread ?? 0.5,
      opacity: config.opacity ?? 1,
      fadeOut: config.fadeOut ?? true,
      gravity: config.gravity,
    };
    
    // 지오메트리 생성
    this.geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(this.config.count * 3);
    const sizes = new Float32Array(this.config.count);
    const opacities = new Float32Array(this.config.count);
    
    this.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    this.geometry.setAttribute('opacity', new THREE.BufferAttribute(opacities, 1));
    
    // 재질 생성
    this.material = new THREE.PointsMaterial({
      color: this.config.color instanceof THREE.Color ? this.config.color : new THREE.Color(this.config.color),
      size: this.config.size,
      transparent: true,
      opacity: this.config.opacity,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    
    this.points = new THREE.Points(this.geometry, this.material);
  }
  
  getMesh(): THREE.Points {
    return this.points;
  }
  
  setPosition(position: THREE.Vector3): void {
    this.points.position.copy(position);
  }
  
  setEmitRate(rate: number): void {
    this.emitRate = rate;
  }
  
  start(): void {
    this.isEmitting = true;
  }
  
  stop(): void {
    this.isEmitting = false;
  }
  
  emit(count: number = 1): void {
    for (let i = 0; i < count && this.particles.length < this.config.count; i++) {
      const particle: Particle = {
        position: new THREE.Vector3(
          (Math.random() - 0.5) * this.config.spread,
          (Math.random() - 0.5) * this.config.spread,
          (Math.random() - 0.5) * this.config.spread
        ),
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * this.config.speed,
          (Math.random() - 0.5) * this.config.speed,
          (Math.random() - 0.5) * this.config.speed
        ),
        age: 0,
        lifetime: this.config.lifetime * (0.8 + Math.random() * 0.4),
        size: this.config.size * (0.5 + Math.random() * 0.5),
        opacity: this.config.opacity,
      };
      
      this.particles.push(particle);
    }
  }
  
  update(deltaTime: number): void {
    // 연속 방출
    if (this.isEmitting) {
      this.emitAccumulator += deltaTime * this.emitRate;
      while (this.emitAccumulator >= 1) {
        this.emit(1);
        this.emitAccumulator -= 1;
      }
    }
    
    // 파티클 업데이트
    const positions = this.geometry.attributes.position.array as Float32Array;
    const sizes = this.geometry.attributes.size.array as Float32Array;
    
    let aliveCount = 0;
    
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      p.age += deltaTime;
      
      if (p.age >= p.lifetime) {
        continue; // 죽은 파티클
      }
      
      // 위치 업데이트
      p.position.add(p.velocity.clone().multiplyScalar(deltaTime));
      
      // 중력 적용
      if (this.config.gravity) {
        p.velocity.add(this.config.gravity.clone().multiplyScalar(deltaTime));
      }
      
      // 페이드 아웃
      if (this.config.fadeOut) {
        p.opacity = this.config.opacity * (1 - p.age / p.lifetime);
      }
      
      // 버퍼 업데이트
      positions[aliveCount * 3] = p.position.x;
      positions[aliveCount * 3 + 1] = p.position.y;
      positions[aliveCount * 3 + 2] = p.position.z;
      sizes[aliveCount] = p.size * (1 - p.age / p.lifetime * 0.5);
      
      aliveCount++;
    }
    
    // 죽은 파티클 제거
    this.particles = this.particles.filter(p => p.age < p.lifetime);
    
    // 나머지 숨기기
    for (let i = aliveCount; i < this.config.count; i++) {
      positions[i * 3] = 0;
      positions[i * 3 + 1] = 0;
      positions[i * 3 + 2] = 0;
      sizes[i] = 0;
    }
    
    this.geometry.attributes.position.needsUpdate = true;
    this.geometry.attributes.size.needsUpdate = true;
  }
  
  dispose(): void {
    this.geometry.dispose();
    this.material.dispose();
  }
}

/**
 * 엔진 분사 효과
 */
export class EngineExhaustEffect {
  private emitter: ParticleEmitter;
  private direction: THREE.Vector3;
  
  constructor(faction: 'empire' | 'alliance' = 'empire') {
    const color = faction === 'empire' ? 0xff6600 : 0x00aaff;
    
    this.emitter = new ParticleEmitter({
      count: 200,
      size: 3,
      color,
      lifetime: 0.5,
      speed: 50,
      spread: 2,
      opacity: 0.8,
      fadeOut: true,
    });
    
    this.direction = new THREE.Vector3(0, 0, -1); // 후방으로 분사
    this.emitter.setEmitRate(100);
  }
  
  getMesh(): THREE.Points {
    return this.emitter.getMesh();
  }
  
  setPosition(position: THREE.Vector3): void {
    this.emitter.setPosition(position);
  }
  
  setDirection(direction: THREE.Vector3): void {
    this.direction.copy(direction).normalize();
  }
  
  start(): void {
    this.emitter.start();
  }
  
  stop(): void {
    this.emitter.stop();
  }
  
  update(deltaTime: number): void {
    this.emitter.update(deltaTime);
  }
  
  dispose(): void {
    this.emitter.dispose();
  }
}

/**
 * 레이저/빔 무기 효과
 */
export class BeamWeaponEffect {
  private line: THREE.Line;
  private material: THREE.LineBasicMaterial;
  private startPos: THREE.Vector3;
  private endPos: THREE.Vector3;
  private duration: number;
  private elapsed: number = 0;
  private isActive = false;
  
  constructor(color: number = 0xff4444, width: number = 2) {
    this.material = new THREE.LineBasicMaterial({
      color,
      transparent: true,
      opacity: 1,
      linewidth: width,
    });
    
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0, 0, 0, 0], 3));
    
    this.line = new THREE.Line(geometry, this.material);
    this.line.visible = false;
    
    this.startPos = new THREE.Vector3();
    this.endPos = new THREE.Vector3();
    this.duration = 0.3;
  }
  
  getMesh(): THREE.Line {
    return this.line;
  }
  
  fire(start: THREE.Vector3, end: THREE.Vector3, duration: number = 0.3): void {
    this.startPos.copy(start);
    this.endPos.copy(end);
    this.duration = duration;
    this.elapsed = 0;
    this.isActive = true;
    this.line.visible = true;
    
    // 위치 업데이트
    const positions = this.line.geometry.attributes.position.array as Float32Array;
    positions[0] = start.x;
    positions[1] = start.y;
    positions[2] = start.z;
    positions[3] = end.x;
    positions[4] = end.y;
    positions[5] = end.z;
    this.line.geometry.attributes.position.needsUpdate = true;
  }
  
  update(deltaTime: number): void {
    if (!this.isActive) return;
    
    this.elapsed += deltaTime;
    
    // 페이드 아웃
    const progress = this.elapsed / this.duration;
    this.material.opacity = 1 - progress;
    
    if (this.elapsed >= this.duration) {
      this.isActive = false;
      this.line.visible = false;
      this.material.opacity = 1;
    }
  }
  
  dispose(): void {
    this.line.geometry.dispose();
    this.material.dispose();
  }
}

/**
 * 폭발 효과
 */
export class ExplosionEffect {
  private emitter: ParticleEmitter;
  private sphereMesh: THREE.Mesh;
  private duration: number;
  private elapsed: number = 0;
  private isActive = false;
  private maxRadius: number;
  
  constructor(size: 'small' | 'medium' | 'large' = 'medium') {
    const configs = {
      small: { particles: 50, maxRadius: 5, duration: 0.5 },
      medium: { particles: 150, maxRadius: 15, duration: 0.8 },
      large: { particles: 300, maxRadius: 30, duration: 1.2 },
    };
    
    const config = configs[size];
    this.maxRadius = config.maxRadius;
    this.duration = config.duration;
    
    // 파티클
    this.emitter = new ParticleEmitter({
      count: config.particles,
      size: size === 'large' ? 4 : size === 'medium' ? 2 : 1,
      color: 0xff6600,
      lifetime: config.duration,
      speed: config.maxRadius * 2,
      spread: config.maxRadius * 0.3,
      opacity: 1,
      fadeOut: true,
    });
    
    // 빛나는 구체
    const sphereGeo = new THREE.SphereGeometry(0.1, 16, 16);
    const sphereMat = new THREE.MeshBasicMaterial({
      color: 0xffff00,
      transparent: true,
      opacity: 1,
    });
    this.sphereMesh = new THREE.Mesh(sphereGeo, sphereMat);
    this.sphereMesh.visible = false;
  }
  
  getMeshes(): THREE.Object3D[] {
    return [this.emitter.getMesh(), this.sphereMesh];
  }
  
  trigger(position: THREE.Vector3): void {
    this.emitter.setPosition(position);
    this.sphereMesh.position.copy(position);
    
    this.elapsed = 0;
    this.isActive = true;
    this.sphereMesh.visible = true;
    
    // 파티클 버스트
    this.emitter.emit(50);
  }
  
  update(deltaTime: number): void {
    if (!this.isActive) return;
    
    this.elapsed += deltaTime;
    this.emitter.update(deltaTime);
    
    const progress = this.elapsed / this.duration;
    
    // 구체 확장 및 페이드
    const scale = this.maxRadius * Math.sin(progress * Math.PI);
    this.sphereMesh.scale.setScalar(scale);
    (this.sphereMesh.material as THREE.MeshBasicMaterial).opacity = 1 - progress;
    
    if (this.elapsed >= this.duration) {
      this.isActive = false;
      this.sphereMesh.visible = false;
    }
  }
  
  dispose(): void {
    this.emitter.dispose();
    this.sphereMesh.geometry.dispose();
    (this.sphereMesh.material as THREE.Material).dispose();
  }
}

/**
 * 토르 해머 효과
 */
export class ThorHammerEffect {
  private chargeEmitter: ParticleEmitter;
  private beamMesh: THREE.Mesh;
  private impactEmitter: ParticleEmitter;
  private state: 'idle' | 'charging' | 'firing' | 'impact' = 'idle';
  private elapsed: number = 0;
  
  constructor() {
    // 충전 파티클 (청백색)
    this.chargeEmitter = new ParticleEmitter({
      count: 500,
      size: 5,
      color: 0x88ffff,
      lifetime: 2,
      speed: 30,
      spread: 50,
      opacity: 0.8,
      fadeOut: true,
    });
    
    // 빔 (원뿔형)
    const beamGeo = new THREE.CylinderGeometry(5, 50, 500, 16);
    const beamMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.8,
    });
    this.beamMesh = new THREE.Mesh(beamGeo, beamMat);
    this.beamMesh.visible = false;
    this.beamMesh.rotation.x = Math.PI / 2;
    
    // 충격 파티클
    this.impactEmitter = new ParticleEmitter({
      count: 1000,
      size: 10,
      color: 0xffff00,
      lifetime: 2,
      speed: 100,
      spread: 100,
      opacity: 1,
      fadeOut: true,
    });
  }
  
  getMeshes(): THREE.Object3D[] {
    return [this.chargeEmitter.getMesh(), this.beamMesh, this.impactEmitter.getMesh()];
  }
  
  startCharge(position: THREE.Vector3): void {
    this.chargeEmitter.setPosition(position);
    this.chargeEmitter.start();
    this.state = 'charging';
    this.elapsed = 0;
  }
  
  fire(start: THREE.Vector3, end: THREE.Vector3): void {
    this.chargeEmitter.stop();
    
    // 빔 위치/방향 설정
    const direction = end.clone().sub(start);
    const length = direction.length();
    
    this.beamMesh.position.copy(start).add(direction.multiplyScalar(0.5));
    this.beamMesh.lookAt(end);
    this.beamMesh.scale.set(1, 1, length / 500);
    this.beamMesh.visible = true;
    
    this.state = 'firing';
    this.elapsed = 0;
  }
  
  impact(position: THREE.Vector3): void {
    this.beamMesh.visible = false;
    this.impactEmitter.setPosition(position);
    this.impactEmitter.emit(200);
    this.state = 'impact';
    this.elapsed = 0;
  }
  
  update(deltaTime: number): void {
    this.elapsed += deltaTime;
    
    switch (this.state) {
      case 'charging':
        this.chargeEmitter.update(deltaTime);
        break;
        
      case 'firing':
        // 빔 페이드
        (this.beamMesh.material as THREE.MeshBasicMaterial).opacity = 
          Math.max(0, 0.8 - this.elapsed * 2);
        
        if (this.elapsed > 0.4) {
          this.beamMesh.visible = false;
          this.state = 'idle';
        }
        break;
        
      case 'impact':
        this.impactEmitter.update(deltaTime);
        if (this.elapsed > 2) {
          this.state = 'idle';
        }
        break;
    }
  }
  
  dispose(): void {
    this.chargeEmitter.dispose();
    this.beamMesh.geometry.dispose();
    (this.beamMesh.material as THREE.Material).dispose();
    this.impactEmitter.dispose();
  }
}

/**
 * 미사일 효과
 */
export class MissileEffect {
  private mesh: THREE.Mesh;
  private trailEmitter: ParticleEmitter;
  private startPos: THREE.Vector3;
  private endPos: THREE.Vector3;
  private duration: number = 1.5;
  private elapsed: number = 0;
  private isActive = false;
  private onImpact?: (pos: THREE.Vector3) => void;
  
  constructor() {
    // 미사일 본체 (작은 원뿔)
    const geo = new THREE.ConeGeometry(2, 8, 6);
    const mat = new THREE.MeshBasicMaterial({ color: 0xcccccc });
    this.mesh = new THREE.Mesh(geo, mat);
    this.mesh.visible = false;
    
    // 꼬리 연기
    this.trailEmitter = new ParticleEmitter({
      count: 100,
      size: 3,
      color: 0xff8800,
      lifetime: 0.5,
      speed: 5,
      spread: 2,
      opacity: 0.8,
      fadeOut: true,
    });
    
    this.startPos = new THREE.Vector3();
    this.endPos = new THREE.Vector3();
  }
  
  getMeshes(): THREE.Object3D[] {
    return [this.mesh, this.trailEmitter.getMesh()];
  }
  
  fire(start: THREE.Vector3, end: THREE.Vector3, onImpact?: (pos: THREE.Vector3) => void): void {
    this.startPos.copy(start);
    this.endPos.copy(end);
    this.elapsed = 0;
    this.isActive = true;
    this.mesh.visible = true;
    this.onImpact = onImpact;
    
    // 방향 설정
    this.mesh.position.copy(start);
    this.mesh.lookAt(end);
    this.mesh.rotateX(Math.PI / 2);
    
    this.trailEmitter.start();
  }
  
  update(deltaTime: number): void {
    if (!this.isActive) return;
    
    this.elapsed += deltaTime;
    const t = Math.min(this.elapsed / this.duration, 1);
    
    // 곡선 경로 (약간 위로 올라갔다 내려옴)
    const pos = this.startPos.clone().lerp(this.endPos, t);
    pos.y += Math.sin(t * Math.PI) * 50; // 포물선
    
    this.mesh.position.copy(pos);
    this.mesh.lookAt(this.endPos);
    this.mesh.rotateX(Math.PI / 2);
    
    this.trailEmitter.setPosition(pos);
    this.trailEmitter.update(deltaTime);
    
    if (t >= 1) {
      this.isActive = false;
      this.mesh.visible = false;
      this.trailEmitter.stop();
      this.onImpact?.(this.endPos.clone());
    }
  }
  
  isRunning(): boolean {
    return this.isActive;
  }
  
  dispose(): void {
    this.mesh.geometry.dispose();
    (this.mesh.material as THREE.Material).dispose();
    this.trailEmitter.dispose();
  }
}

/**
 * 어뢰 효과 (광자어뢰 스타일)
 */
export class TorpedoEffect {
  private mesh: THREE.Mesh;
  private glowMesh: THREE.Mesh;
  private startPos: THREE.Vector3;
  private endPos: THREE.Vector3;
  private duration: number = 2.0;
  private elapsed: number = 0;
  private isActive = false;
  private color: number;
  private onImpact?: (pos: THREE.Vector3) => void;
  
  constructor(color: number = 0x00ffff) {
    this.color = color;
    
    // 어뢰 본체 (빛나는 구)
    const geo = new THREE.SphereGeometry(4, 8, 8);
    const mat = new THREE.MeshBasicMaterial({ 
      color: this.color,
      transparent: true,
      opacity: 0.9,
    });
    this.mesh = new THREE.Mesh(geo, mat);
    this.mesh.visible = false;
    
    // 글로우 효과
    const glowGeo = new THREE.SphereGeometry(8, 8, 8);
    const glowMat = new THREE.MeshBasicMaterial({
      color: this.color,
      transparent: true,
      opacity: 0.3,
    });
    this.glowMesh = new THREE.Mesh(glowGeo, glowMat);
    this.glowMesh.visible = false;
    
    this.startPos = new THREE.Vector3();
    this.endPos = new THREE.Vector3();
  }
  
  getMeshes(): THREE.Object3D[] {
    return [this.mesh, this.glowMesh];
  }
  
  fire(start: THREE.Vector3, end: THREE.Vector3, onImpact?: (pos: THREE.Vector3) => void): void {
    this.startPos.copy(start);
    this.endPos.copy(end);
    this.elapsed = 0;
    this.isActive = true;
    this.mesh.visible = true;
    this.glowMesh.visible = true;
    this.onImpact = onImpact;
    
    this.mesh.position.copy(start);
    this.glowMesh.position.copy(start);
  }
  
  update(deltaTime: number): void {
    if (!this.isActive) return;
    
    this.elapsed += deltaTime;
    const t = Math.min(this.elapsed / this.duration, 1);
    
    // 직선 이동 (가속)
    const easedT = t * t; // ease in
    const pos = this.startPos.clone().lerp(this.endPos, easedT);
    
    this.mesh.position.copy(pos);
    this.glowMesh.position.copy(pos);
    
    // 글로우 펄스
    const pulse = 1 + Math.sin(this.elapsed * 20) * 0.2;
    this.glowMesh.scale.setScalar(pulse);
    
    if (t >= 1) {
      this.isActive = false;
      this.mesh.visible = false;
      this.glowMesh.visible = false;
      this.onImpact?.(this.endPos.clone());
    }
  }
  
  isRunning(): boolean {
    return this.isActive;
  }
  
  dispose(): void {
    this.mesh.geometry.dispose();
    (this.mesh.material as THREE.Material).dispose();
    this.glowMesh.geometry.dispose();
    (this.glowMesh.material as THREE.Material).dispose();
  }
}

/**
 * 중성자탄 효과 (넓은 범위 공격)
 */
export class NeutronBeamEffect {
  private beamMesh: THREE.Mesh;
  private waveMesh: THREE.Mesh;
  private startPos: THREE.Vector3;
  private endPos: THREE.Vector3;
  private duration: number = 0.8;
  private elapsed: number = 0;
  private isActive = false;
  
  constructor() {
    // 굵은 빔 (원통형)
    const beamGeo = new THREE.CylinderGeometry(15, 15, 1, 16);
    const beamMat = new THREE.MeshBasicMaterial({
      color: 0xffff00,
      transparent: true,
      opacity: 0.8,
    });
    this.beamMesh = new THREE.Mesh(beamGeo, beamMat);
    this.beamMesh.visible = false;
    
    // 충격파
    const waveGeo = new THREE.RingGeometry(0, 50, 32);
    const waveMat = new THREE.MeshBasicMaterial({
      color: 0xffaa00,
      transparent: true,
      opacity: 0.5,
      side: THREE.DoubleSide,
    });
    this.waveMesh = new THREE.Mesh(waveGeo, waveMat);
    this.waveMesh.visible = false;
    
    this.startPos = new THREE.Vector3();
    this.endPos = new THREE.Vector3();
  }
  
  getMeshes(): THREE.Object3D[] {
    return [this.beamMesh, this.waveMesh];
  }
  
  fire(start: THREE.Vector3, end: THREE.Vector3): void {
    this.startPos.copy(start);
    this.endPos.copy(end);
    this.elapsed = 0;
    this.isActive = true;
    
    // 빔 설정
    const direction = end.clone().sub(start);
    const length = direction.length();
    const midPoint = start.clone().add(direction.clone().multiplyScalar(0.5));
    
    this.beamMesh.position.copy(midPoint);
    this.beamMesh.scale.set(1, length, 1);
    this.beamMesh.lookAt(end);
    this.beamMesh.rotateX(Math.PI / 2);
    this.beamMesh.visible = true;
    
    // 충격파 위치
    this.waveMesh.position.copy(end);
    this.waveMesh.lookAt(start);
    this.waveMesh.visible = true;
  }
  
  update(deltaTime: number): void {
    if (!this.isActive) return;
    
    this.elapsed += deltaTime;
    const t = this.elapsed / this.duration;
    
    // 빔 페이드
    (this.beamMesh.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 0.8 - t);
    
    // 충격파 확장
    const waveScale = 1 + t * 3;
    this.waveMesh.scale.setScalar(waveScale);
    (this.waveMesh.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 0.5 - t * 0.5);
    
    if (this.elapsed >= this.duration) {
      this.isActive = false;
      this.beamMesh.visible = false;
      this.waveMesh.visible = false;
      // 재질 리셋
      (this.beamMesh.material as THREE.MeshBasicMaterial).opacity = 0.8;
      (this.waveMesh.material as THREE.MeshBasicMaterial).opacity = 0.5;
      this.waveMesh.scale.setScalar(1);
    }
  }
  
  isRunning(): boolean {
    return this.isActive;
  }
  
  dispose(): void {
    this.beamMesh.geometry.dispose();
    (this.beamMesh.material as THREE.Material).dispose();
    this.waveMesh.geometry.dispose();
    (this.waveMesh.material as THREE.Material).dispose();
  }
}

/**
 * 파티클 매니저 (모든 효과 관리)
 */
export class ParticleManager {
  private scene: THREE.Scene;
  private effects: Map<string, { update: (dt: number) => void; dispose: () => void }> = new Map();
  private engineEffects: Map<string, EngineExhaustEffect> = new Map();
  private beamPool: BeamWeaponEffect[] = [];
  private explosionPool: ExplosionEffect[] = [];
  private missilePool: MissileEffect[] = [];
  private torpedoPool: TorpedoEffect[] = [];
  private neutronPool: NeutronBeamEffect[] = [];
  
  constructor(scene: THREE.Scene) {
    this.scene = scene;
    
    // 빔 풀 초기화
    for (let i = 0; i < 20; i++) {
      const beam = new BeamWeaponEffect();
      this.scene.add(beam.getMesh());
      this.beamPool.push(beam);
    }
    
    // 폭발 풀 초기화
    for (let i = 0; i < 10; i++) {
      const explosion = new ExplosionEffect('medium');
      explosion.getMeshes().forEach(m => this.scene.add(m));
      this.explosionPool.push(explosion);
    }
    
    // 미사일 풀 초기화
    for (let i = 0; i < 10; i++) {
      const missile = new MissileEffect();
      missile.getMeshes().forEach(m => this.scene.add(m));
      this.missilePool.push(missile);
    }
    
    // 어뢰 풀 초기화
    for (let i = 0; i < 10; i++) {
      const torpedo = new TorpedoEffect();
      torpedo.getMeshes().forEach(m => this.scene.add(m));
      this.torpedoPool.push(torpedo);
    }
    
    // 중성자탄 풀 초기화
    for (let i = 0; i < 5; i++) {
      const neutron = new NeutronBeamEffect();
      neutron.getMeshes().forEach(m => this.scene.add(m));
      this.neutronPool.push(neutron);
    }
  }
  
  /**
   * 엔진 효과 추가
   */
  addEngineEffect(id: string, position: THREE.Vector3, faction: 'empire' | 'alliance'): EngineExhaustEffect {
    const effect = new EngineExhaustEffect(faction);
    effect.setPosition(position);
    effect.start();
    this.scene.add(effect.getMesh());
    this.engineEffects.set(id, effect);
    return effect;
  }
  
  /**
   * 엔진 효과 제거
   */
  removeEngineEffect(id: string): void {
    const effect = this.engineEffects.get(id);
    if (effect) {
      this.scene.remove(effect.getMesh());
      effect.dispose();
      this.engineEffects.delete(id);
    }
  }
  
  /**
   * 빔 발사
   */
  fireBeam(start: THREE.Vector3, end: THREE.Vector3, color?: number): void {
    // 사용 가능한 빔 찾기
    for (const beam of this.beamPool) {
      if (!beam.getMesh().visible) {
        if (color) {
          (beam.getMesh().material as THREE.LineBasicMaterial).color.setHex(color);
        }
        beam.fire(start, end);
        return;
      }
    }
  }
  
  /**
   * 폭발 트리거
   */
  triggerExplosion(position: THREE.Vector3): void {
    for (const explosion of this.explosionPool) {
      // 비활성 폭발 찾기
      if (!explosion.getMeshes()[1].visible) {
        explosion.trigger(position);
        return;
      }
    }
  }
  
  /**
   * 미사일 발사
   */
  fireMissile(start: THREE.Vector3, end: THREE.Vector3): void {
    for (const missile of this.missilePool) {
      if (!missile.isRunning()) {
        missile.fire(start, end, (impactPos) => {
          this.triggerExplosion(impactPos);
        });
        return;
      }
    }
  }
  
  /**
   * 어뢰 발사
   */
  fireTorpedo(start: THREE.Vector3, end: THREE.Vector3, color?: number): void {
    for (const torpedo of this.torpedoPool) {
      if (!torpedo.isRunning()) {
        torpedo.fire(start, end, (impactPos) => {
          this.triggerExplosion(impactPos);
        });
        return;
      }
    }
  }
  
  /**
   * 중성자탄 발사
   */
  fireNeutronBeam(start: THREE.Vector3, end: THREE.Vector3): void {
    for (const neutron of this.neutronPool) {
      if (!neutron.isRunning()) {
        neutron.fire(start, end);
        return;
      }
    }
  }
  
  /**
   * 모든 효과 업데이트
   */
  update(deltaTime: number): void {
    // 엔진 효과
    this.engineEffects.forEach(effect => effect.update(deltaTime));
    
    // 빔
    this.beamPool.forEach(beam => beam.update(deltaTime));
    
    // 폭발
    this.explosionPool.forEach(explosion => explosion.update(deltaTime));
    
    // 미사일
    this.missilePool.forEach(missile => missile.update(deltaTime));
    
    // 어뢰
    this.torpedoPool.forEach(torpedo => torpedo.update(deltaTime));
    
    // 중성자탄
    this.neutronPool.forEach(neutron => neutron.update(deltaTime));
    
    // 커스텀 효과
    this.effects.forEach(effect => effect.update(deltaTime));
  }
  
  /**
   * 정리
   */
  dispose(): void {
    this.engineEffects.forEach(effect => {
      this.scene.remove(effect.getMesh());
      effect.dispose();
    });
    
    this.beamPool.forEach(beam => {
      this.scene.remove(beam.getMesh());
      beam.dispose();
    });
    
    this.explosionPool.forEach(explosion => {
      explosion.getMeshes().forEach(m => this.scene.remove(m));
      explosion.dispose();
    });
    
    this.missilePool.forEach(missile => {
      missile.getMeshes().forEach(m => this.scene.remove(m));
      missile.dispose();
    });
    
    this.torpedoPool.forEach(torpedo => {
      torpedo.getMeshes().forEach(m => this.scene.remove(m));
      torpedo.dispose();
    });
    
    this.neutronPool.forEach(neutron => {
      neutron.getMeshes().forEach(m => this.scene.remove(m));
      neutron.dispose();
    });
    
    this.effects.forEach(effect => effect.dispose());
  }
}

