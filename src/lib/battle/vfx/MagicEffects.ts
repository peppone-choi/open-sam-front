/**
 * MagicEffects - 마법 이펙트 시스템
 * 
 * 지원 타입:
 * - fireball: 화염구 (발사 → 비행 → 폭발)
 * - lightning: 번개 (즉발, 분기)
 * - heal_wave: 치유 파동 (확산형)
 * - curse_aura: 저주 오라 (지속형)
 * - shield: 보호막 (구형 쉴드)
 * - ice_bolt: 얼음 화살
 * - poison_cloud: 독 구름
 */

import * as THREE from 'three';
import { VFXParticleSystem } from './ParticleSystem';

// ========================================
// 타입 정의
// ========================================

export type MagicEffectType = 
  | 'fireball'
  | 'lightning'
  | 'heal_wave'
  | 'curse_aura'
  | 'shield'
  | 'ice_bolt'
  | 'poison_cloud';

/** 마법 이펙트 상태 */
type MagicEffectState = 'casting' | 'traveling' | 'active' | 'ending';

/** 마법 이펙트 인스턴스 */
interface MagicEffectInstance {
  id: string;
  type: MagicEffectType;
  state: MagicEffectState;
  
  // 위치
  position: THREE.Vector3;
  startPosition: THREE.Vector3;
  targetPosition: THREE.Vector3;
  velocity: THREE.Vector3;
  
  // 시간
  time: number;
  duration: number;
  stateDurations: Record<MagicEffectState, number>;
  
  // 시각 요소
  meshes: THREE.Object3D[];
  emitterId?: string;
  
  // 설정
  scale: number;
  color: number;
  
  // 콜백
  onHit?: (position: THREE.Vector3) => void;
  
  // 상태
  active: boolean;
}

/** 마법 이펙트 옵션 */
export interface MagicEffectOptions {
  color?: number;
  scale?: number;
  duration?: number;
  onHit?: (position: THREE.Vector3) => void;
}

// ========================================
// 마법 이펙트 설정
// ========================================

const MAGIC_CONFIGS: Record<MagicEffectType, {
  baseColor: number;
  travelSpeed: number;
  stateDurations: Record<MagicEffectState, number>;
  particleType: string;
}> = {
  fireball: {
    baseColor: 0xFF4500,
    travelSpeed: 15,
    stateDurations: { casting: 0.2, traveling: 0, active: 0.5, ending: 0.3 },
    particleType: 'fire',
  },
  lightning: {
    baseColor: 0x00BFFF,
    travelSpeed: 100, // 즉발
    stateDurations: { casting: 0.1, traveling: 0.05, active: 0.3, ending: 0.2 },
    particleType: 'spark',
  },
  heal_wave: {
    baseColor: 0x00FF7F,
    travelSpeed: 0, // 확산
    stateDurations: { casting: 0.2, traveling: 0, active: 1.5, ending: 0.5 },
    particleType: 'glow',
  },
  curse_aura: {
    baseColor: 0x9932CC,
    travelSpeed: 0,
    stateDurations: { casting: 0.3, traveling: 0, active: 3, ending: 0.5 },
    particleType: 'magic',
  },
  shield: {
    baseColor: 0x4169E1,
    travelSpeed: 0,
    stateDurations: { casting: 0.2, traveling: 0, active: 5, ending: 0.3 },
    particleType: 'glow',
  },
  ice_bolt: {
    baseColor: 0x87CEEB,
    travelSpeed: 20,
    stateDurations: { casting: 0.15, traveling: 0, active: 0.3, ending: 0.2 },
    particleType: 'glow',
  },
  poison_cloud: {
    baseColor: 0x228B22,
    travelSpeed: 5,
    stateDurations: { casting: 0.2, traveling: 0.5, active: 4, ending: 1 },
    particleType: 'smoke',
  },
};

// ========================================
// MagicEffects 클래스
// ========================================

export class MagicEffects {
  private scene: THREE.Scene;
  private particleSystem: VFXParticleSystem;
  
  // 활성 이펙트
  private activeEffects: Map<string, MagicEffectInstance> = new Map();
  private idCounter = 0;
  
  // 메시 풀
  private fireballMeshPool: THREE.Group[] = [];
  private lightningMeshPool: THREE.Group[] = [];
  private healWaveMeshPool: THREE.Mesh[] = [];
  private curseAuraMeshPool: THREE.Group[] = [];
  private shieldMeshPool: THREE.Mesh[] = [];
  
  // 공유 리소스
  private sphereGeometry: THREE.SphereGeometry;
  private ringGeometry: THREE.RingGeometry;
  
  // 설정
  private readonly POOL_SIZE = 10;
  
  constructor(scene: THREE.Scene, particleSystem: VFXParticleSystem) {
    this.scene = scene;
    this.particleSystem = particleSystem;
    
    // 공유 지오메트리
    this.sphereGeometry = new THREE.SphereGeometry(1, 16, 16);
    this.ringGeometry = new THREE.RingGeometry(0.8, 1, 32);
    
    this.initMeshPools();
  }
  
  // ========================================
  // 초기화
  // ========================================
  
  private initMeshPools(): void {
    // 화염구 풀
    for (let i = 0; i < this.POOL_SIZE; i++) {
      const group = this.createFireballMesh();
      group.visible = false;
      this.scene.add(group);
      this.fireballMeshPool.push(group);
    }
    
    // 번개 풀
    for (let i = 0; i < this.POOL_SIZE; i++) {
      const group = this.createLightningMesh();
      group.visible = false;
      this.scene.add(group);
      this.lightningMeshPool.push(group);
    }
    
    // 치유 파동 풀
    for (let i = 0; i < this.POOL_SIZE; i++) {
      const mesh = this.createHealWaveMesh();
      mesh.visible = false;
      this.scene.add(mesh);
      this.healWaveMeshPool.push(mesh);
    }
    
    // 저주 오라 풀
    for (let i = 0; i < this.POOL_SIZE; i++) {
      const group = this.createCurseAuraMesh();
      group.visible = false;
      this.scene.add(group);
      this.curseAuraMeshPool.push(group);
    }
    
    // 보호막 풀
    for (let i = 0; i < this.POOL_SIZE; i++) {
      const mesh = this.createShieldMesh();
      mesh.visible = false;
      this.scene.add(mesh);
      this.shieldMeshPool.push(mesh);
    }
  }
  
  private createFireballMesh(): THREE.Group {
    const group = new THREE.Group();
    
    // 코어
    const core = new THREE.Mesh(
      new THREE.SphereGeometry(0.2, 12, 12),
      new THREE.MeshBasicMaterial({
        color: 0xFFFF00,
        transparent: true,
        opacity: 0.9,
        blending: THREE.AdditiveBlending,
      })
    );
    group.add(core);
    
    // 외부 불꽃
    const outer = new THREE.Mesh(
      new THREE.SphereGeometry(0.35, 12, 12),
      new THREE.MeshBasicMaterial({
        color: 0xFF4500,
        transparent: true,
        opacity: 0.6,
        blending: THREE.AdditiveBlending,
      })
    );
    group.add(outer);
    
    return group;
  }
  
  private createLightningMesh(): THREE.Group {
    const group = new THREE.Group();
    
    // 메인 볼트
    const points: THREE.Vector3[] = [];
    for (let i = 0; i < 20; i++) {
      const t = i / 19;
      points.push(new THREE.Vector3(
        (Math.random() - 0.5) * 0.3 * (1 - Math.abs(t - 0.5) * 2),
        t * 10,
        (Math.random() - 0.5) * 0.3 * (1 - Math.abs(t - 0.5) * 2)
      ));
    }
    
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({
      color: 0x00BFFF,
      transparent: true,
      opacity: 0.9,
    });
    
    const mainBolt = new THREE.Line(geometry, material);
    group.add(mainBolt);
    
    // 글로우 코어
    const glow = new THREE.Mesh(
      new THREE.CylinderGeometry(0.05, 0.05, 10, 8),
      new THREE.MeshBasicMaterial({
        color: 0xFFFFFF,
        transparent: true,
        opacity: 0.5,
        blending: THREE.AdditiveBlending,
      })
    );
    glow.position.y = 5;
    group.add(glow);
    
    return group;
  }
  
  private createHealWaveMesh(): THREE.Mesh {
    const geometry = new THREE.RingGeometry(0.1, 1, 32);
    const material = new THREE.MeshBasicMaterial({
      color: 0x00FF7F,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    });
    
    const mesh = new THREE.Mesh(geometry, material);
    mesh.rotation.x = -Math.PI / 2;
    
    return mesh;
  }
  
  private createCurseAuraMesh(): THREE.Group {
    const group = new THREE.Group();
    
    // 중심 구체
    const core = new THREE.Mesh(
      new THREE.SphereGeometry(0.3, 12, 12),
      new THREE.MeshBasicMaterial({
        color: 0x9932CC,
        transparent: true,
        opacity: 0.7,
        blending: THREE.AdditiveBlending,
      })
    );
    group.add(core);
    
    // 회전 링
    for (let i = 0; i < 3; i++) {
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(0.6 + i * 0.2, 0.02, 8, 24),
        new THREE.MeshBasicMaterial({
          color: 0x4B0082,
          transparent: true,
          opacity: 0.5,
          blending: THREE.AdditiveBlending,
        })
      );
      ring.rotation.x = Math.PI / 2;
      ring.rotation.z = (i / 3) * Math.PI;
      group.add(ring);
    }
    
    return group;
  }
  
  private createShieldMesh(): THREE.Mesh {
    const geometry = new THREE.SphereGeometry(1, 32, 32);
    const material = new THREE.MeshBasicMaterial({
      color: 0x4169E1,
      transparent: true,
      opacity: 0.3,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      wireframe: false,
    });
    
    return new THREE.Mesh(geometry, material);
  }
  
  // ========================================
  // 마법 이펙트 생성
  // ========================================
  
  /**
   * 범용 마법 이펙트 생성
   */
  spawn(
    type: MagicEffectType,
    caster: THREE.Vector3,
    target: THREE.Vector3,
    options?: MagicEffectOptions
  ): string {
    switch (type) {
      case 'fireball':
        return this.spawnFireball(caster, target, options);
      case 'lightning':
        return this.spawnLightning(caster, target, options);
      case 'heal_wave':
        return this.spawnHealWave(target, options?.scale ?? 3, options);
      case 'curse_aura':
        return this.spawnCurseAura(target, options);
      case 'shield':
        return this.spawnShield(target, options?.scale ?? 1.5, options);
      case 'ice_bolt':
        return this.spawnIceBolt(caster, target, options);
      case 'poison_cloud':
        return this.spawnPoisonCloud(target, options);
      default:
        return '';
    }
  }
  
  /**
   * 화염구
   */
  spawnFireball(
    from: THREE.Vector3,
    to: THREE.Vector3,
    options?: MagicEffectOptions & { scale?: number; onHit?: (pos: THREE.Vector3) => void }
  ): string {
    const config = MAGIC_CONFIGS.fireball;
    const id = `fireball_${this.idCounter++}`;
    const scale = options?.scale ?? 1;
    
    // 메시 획득
    const mesh = this.acquireFireballMesh();
    if (!mesh) return '';
    
    mesh.position.copy(from);
    mesh.scale.setScalar(scale);
    mesh.visible = true;
    
    // 속도 계산
    const direction = to.clone().sub(from).normalize();
    const velocity = direction.multiplyScalar(config.travelSpeed);
    
    // 파티클 이미터
    const emitterId = this.particleSystem.createEmitter({
      type: 'fire',
      position: from.clone(),
      direction: direction.clone().negate(),
      spread: Math.PI / 6,
      speed: 3,
      size: 0.2 * scale,
      life: 0.3,
      color: 0xFF4500,
      count: 3,
      continuous: true,
      emitRate: 30,
    });
    
    // 인스턴스 등록
    const distance = from.distanceTo(to);
    const travelTime = distance / config.travelSpeed;
    
    this.activeEffects.set(id, {
      id,
      type: 'fireball',
      state: 'traveling',
      position: from.clone(),
      startPosition: from.clone(),
      targetPosition: to.clone(),
      velocity,
      time: 0,
      duration: travelTime + 0.5,
      stateDurations: {
        casting: 0,
        traveling: travelTime,
        active: 0.5,
        ending: 0.3,
      },
      meshes: [mesh],
      emitterId,
      scale,
      color: options?.color ?? config.baseColor,
      onHit: options?.onHit,
      active: true,
    });
    
    return id;
  }
  
  /**
   * 번개
   */
  spawnLightning(
    from: THREE.Vector3,
    to: THREE.Vector3,
    options?: { branches?: number; duration?: number }
  ): string {
    const config = MAGIC_CONFIGS.lightning;
    const id = `lightning_${this.idCounter++}`;
    const branches = options?.branches ?? 2;
    
    // 메시 획득
    const mesh = this.acquireLightningMesh();
    if (!mesh) return '';
    
    // 위치 및 방향 설정
    mesh.position.copy(from);
    const direction = to.clone().sub(from);
    const length = direction.length();
    direction.normalize();
    
    // 메시 회전 (타겟 방향)
    mesh.lookAt(to);
    mesh.rotateX(Math.PI / 2);
    mesh.scale.y = length / 10;
    mesh.visible = true;
    
    // 분기 번개 업데이트
    this.updateLightningBranches(mesh, branches);
    
    // 파티클 효과 (시작점, 끝점)
    this.particleSystem.emit('spark', from, 15, { color: 0x00BFFF });
    this.particleSystem.emit('spark', to, 25, { color: 0x00BFFF });
    
    // 인스턴스 등록
    this.activeEffects.set(id, {
      id,
      type: 'lightning',
      state: 'active',
      position: from.clone(),
      startPosition: from.clone(),
      targetPosition: to.clone(),
      velocity: new THREE.Vector3(),
      time: 0,
      duration: options?.duration ?? 0.5,
      stateDurations: config.stateDurations,
      meshes: [mesh],
      scale: 1,
      color: config.baseColor,
      active: true,
    });
    
    return id;
  }
  
  private updateLightningBranches(group: THREE.Group, branchCount: number): void {
    const mainBolt = group.children[0] as THREE.Line;
    if (!mainBolt) return;
    
    // 기존 번개 경로 랜덤화
    const positions = mainBolt.geometry.attributes.position;
    if (positions) {
      for (let i = 1; i < positions.count - 1; i++) {
        const t = i / (positions.count - 1);
        const jitter = 0.3 * (1 - Math.abs(t - 0.5) * 2);
        positions.setX(i, (Math.random() - 0.5) * jitter);
        positions.setZ(i, (Math.random() - 0.5) * jitter);
      }
      positions.needsUpdate = true;
    }
  }
  
  /**
   * 치유 파동
   */
  spawnHealWave(
    center: THREE.Vector3,
    radius: number = 3,
    options?: { duration?: number }
  ): string {
    const config = MAGIC_CONFIGS.heal_wave;
    const id = `healwave_${this.idCounter++}`;
    
    // 메시 획득
    const mesh = this.acquireHealWaveMesh();
    if (!mesh) return '';
    
    mesh.position.copy(center);
    mesh.position.y = 0.1;
    mesh.scale.setScalar(0.1);
    mesh.visible = true;
    
    // 파티클 이미터
    const emitterId = this.particleSystem.createEmitter({
      type: 'glow',
      position: center.clone(),
      spread: Math.PI,
      speed: 2,
      size: 0.15,
      life: 0.8,
      color: 0x00FF7F,
      count: 5,
      continuous: true,
      emitRate: 20,
    });
    
    // 인스턴스 등록
    this.activeEffects.set(id, {
      id,
      type: 'heal_wave',
      state: 'active',
      position: center.clone(),
      startPosition: center.clone(),
      targetPosition: center.clone(),
      velocity: new THREE.Vector3(),
      time: 0,
      duration: options?.duration ?? 2,
      stateDurations: config.stateDurations,
      meshes: [mesh],
      emitterId,
      scale: radius,
      color: config.baseColor,
      active: true,
    });
    
    return id;
  }
  
  /**
   * 저주 오라
   */
  spawnCurseAura(
    target: THREE.Vector3,
    options?: { duration?: number; radius?: number }
  ): string {
    const config = MAGIC_CONFIGS.curse_aura;
    const id = `curse_${this.idCounter++}`;
    const radius = options?.radius ?? 1.5;
    
    // 메시 획득
    const mesh = this.acquireCurseAuraMesh();
    if (!mesh) return '';
    
    mesh.position.copy(target);
    mesh.scale.setScalar(radius);
    mesh.visible = true;
    
    // 파티클 이미터
    const emitterId = this.particleSystem.createEmitter({
      type: 'magic',
      position: target.clone(),
      spread: Math.PI,
      speed: 1.5,
      size: 0.12,
      life: 1.5,
      color: 0x9932CC,
      count: 3,
      continuous: true,
      emitRate: 15,
    });
    
    // 인스턴스 등록
    this.activeEffects.set(id, {
      id,
      type: 'curse_aura',
      state: 'active',
      position: target.clone(),
      startPosition: target.clone(),
      targetPosition: target.clone(),
      velocity: new THREE.Vector3(),
      time: 0,
      duration: options?.duration ?? 3,
      stateDurations: config.stateDurations,
      meshes: [mesh],
      emitterId,
      scale: radius,
      color: config.baseColor,
      active: true,
    });
    
    return id;
  }
  
  /**
   * 보호막
   */
  spawnShield(
    target: THREE.Vector3,
    radius: number = 1.5,
    options?: { duration?: number; color?: number }
  ): string {
    const config = MAGIC_CONFIGS.shield;
    const id = `shield_${this.idCounter++}`;
    
    // 메시 획득
    const mesh = this.acquireShieldMesh();
    if (!mesh) return '';
    
    mesh.position.copy(target);
    mesh.scale.setScalar(radius);
    mesh.visible = true;
    
    if (options?.color) {
      (mesh.material as THREE.MeshBasicMaterial).color.setHex(options.color);
    }
    
    // 인스턴스 등록
    this.activeEffects.set(id, {
      id,
      type: 'shield',
      state: 'active',
      position: target.clone(),
      startPosition: target.clone(),
      targetPosition: target.clone(),
      velocity: new THREE.Vector3(),
      time: 0,
      duration: options?.duration ?? 5,
      stateDurations: config.stateDurations,
      meshes: [mesh],
      scale: radius,
      color: options?.color ?? config.baseColor,
      active: true,
    });
    
    return id;
  }
  
  /**
   * 얼음 화살
   */
  spawnIceBolt(
    from: THREE.Vector3,
    to: THREE.Vector3,
    options?: MagicEffectOptions
  ): string {
    // fireball과 유사하지만 색상/파티클 다름
    const config = MAGIC_CONFIGS.ice_bolt;
    const id = `icebolt_${this.idCounter++}`;
    const scale = options?.scale ?? 1;
    
    // 화염구 메시 재활용 (색상 변경)
    const mesh = this.acquireFireballMesh();
    if (!mesh) return '';
    
    mesh.position.copy(from);
    mesh.scale.setScalar(scale * 0.8);
    mesh.visible = true;
    
    // 색상 변경
    mesh.children.forEach((child) => {
      if ((child as THREE.Mesh).isMesh) {
        ((child as THREE.Mesh).material as THREE.MeshBasicMaterial).color.setHex(0x87CEEB);
      }
    });
    
    // 속도 계산
    const direction = to.clone().sub(from).normalize();
    const velocity = direction.multiplyScalar(config.travelSpeed);
    
    // 파티클 이미터
    const emitterId = this.particleSystem.createEmitter({
      type: 'glow',
      position: from.clone(),
      direction: direction.clone().negate(),
      spread: Math.PI / 8,
      speed: 2,
      size: 0.1 * scale,
      life: 0.2,
      color: 0x87CEEB,
      count: 2,
      continuous: true,
      emitRate: 25,
    });
    
    const distance = from.distanceTo(to);
    const travelTime = distance / config.travelSpeed;
    
    this.activeEffects.set(id, {
      id,
      type: 'ice_bolt',
      state: 'traveling',
      position: from.clone(),
      startPosition: from.clone(),
      targetPosition: to.clone(),
      velocity,
      time: 0,
      duration: travelTime + 0.3,
      stateDurations: {
        casting: 0,
        traveling: travelTime,
        active: 0.3,
        ending: 0.2,
      },
      meshes: [mesh],
      emitterId,
      scale,
      color: config.baseColor,
      onHit: options?.onHit,
      active: true,
    });
    
    return id;
  }
  
  /**
   * 독 구름
   */
  spawnPoisonCloud(
    target: THREE.Vector3,
    options?: { duration?: number; radius?: number }
  ): string {
    const config = MAGIC_CONFIGS.poison_cloud;
    const id = `poison_${this.idCounter++}`;
    const radius = options?.radius ?? 2;
    
    // 파티클 이미터 (메시 대신 파티클만)
    const emitterId = this.particleSystem.createEmitter({
      type: 'smoke',
      position: target.clone(),
      positionVariance: new THREE.Vector3(radius, 0.5, radius),
      spread: Math.PI / 4,
      speed: 0.5,
      size: 0.6,
      life: 2,
      color: 0x228B22,
      count: 5,
      continuous: true,
      emitRate: 15,
    });
    
    this.activeEffects.set(id, {
      id,
      type: 'poison_cloud',
      state: 'active',
      position: target.clone(),
      startPosition: target.clone(),
      targetPosition: target.clone(),
      velocity: new THREE.Vector3(),
      time: 0,
      duration: options?.duration ?? 5,
      stateDurations: config.stateDurations,
      meshes: [],
      emitterId,
      scale: radius,
      color: config.baseColor,
      active: true,
    });
    
    return id;
  }
  
  // ========================================
  // 메시 풀 관리
  // ========================================
  
  private acquireFireballMesh(): THREE.Group | undefined {
    for (const mesh of this.fireballMeshPool) {
      if (!mesh.visible) return mesh;
    }
    return undefined;
  }
  
  private acquireLightningMesh(): THREE.Group | undefined {
    for (const mesh of this.lightningMeshPool) {
      if (!mesh.visible) return mesh;
    }
    return undefined;
  }
  
  private acquireHealWaveMesh(): THREE.Mesh | undefined {
    for (const mesh of this.healWaveMeshPool) {
      if (!mesh.visible) return mesh;
    }
    return undefined;
  }
  
  private acquireCurseAuraMesh(): THREE.Group | undefined {
    for (const mesh of this.curseAuraMeshPool) {
      if (!mesh.visible) return mesh;
    }
    return undefined;
  }
  
  private acquireShieldMesh(): THREE.Mesh | undefined {
    for (const mesh of this.shieldMeshPool) {
      if (!mesh.visible) return mesh;
    }
    return undefined;
  }
  
  private releaseMesh(mesh: THREE.Object3D): void {
    mesh.visible = false;
    mesh.scale.setScalar(1);
  }
  
  // ========================================
  // 업데이트
  // ========================================
  
  /**
   * 프레임 업데이트
   */
  update(deltaTime: number): void {
    const toRemove: string[] = [];
    
    for (const [id, effect] of this.activeEffects) {
      effect.time += deltaTime;
      
      // 수명 체크
      if (effect.time >= effect.duration) {
        toRemove.push(id);
        continue;
      }
      
      // 타입별 업데이트
      switch (effect.type) {
        case 'fireball':
        case 'ice_bolt':
          this.updateProjectileMagic(effect, deltaTime);
          break;
        case 'lightning':
          this.updateLightning(effect, deltaTime);
          break;
        case 'heal_wave':
          this.updateHealWave(effect, deltaTime);
          break;
        case 'curse_aura':
          this.updateCurseAura(effect, deltaTime);
          break;
        case 'shield':
          this.updateShield(effect, deltaTime);
          break;
      }
    }
    
    // 완료된 이펙트 제거
    for (const id of toRemove) {
      this.removeEffect(id);
    }
  }
  
  private updateProjectileMagic(effect: MagicEffectInstance, deltaTime: number): void {
    const mesh = effect.meshes[0];
    if (!mesh) return;
    
    if (effect.state === 'traveling') {
      // 이동
      effect.position.addScaledVector(effect.velocity, deltaTime);
      mesh.position.copy(effect.position);
      
      // 이미터 위치 업데이트
      if (effect.emitterId) {
        this.particleSystem.updateEmitterPosition(effect.emitterId, effect.position);
      }
      
      // 목표 도달 체크
      if (effect.position.distanceTo(effect.targetPosition) < 0.5) {
        effect.state = 'active';
        
        // 콜백 실행
        if (effect.onHit) {
          effect.onHit(effect.position.clone());
        }
        
        // 충돌 이펙트
        this.particleSystem.emit(
          effect.type === 'fireball' ? 'fire' : 'glow',
          effect.position,
          30,
          { speed: 8, size: 0.3 }
        );
        
        // 이미터 제거
        if (effect.emitterId) {
          this.particleSystem.removeEmitter(effect.emitterId);
          effect.emitterId = undefined;
        }
      }
    } else if (effect.state === 'active') {
      // 폭발/충돌 애니메이션
      const stateTime = effect.time - effect.stateDurations.traveling;
      const t = stateTime / effect.stateDurations.active;
      
      const scale = THREE.MathUtils.lerp(effect.scale, effect.scale * 2, t);
      mesh.scale.setScalar(scale);
      
      // 페이드아웃
      mesh.children.forEach((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mat = (child as THREE.Mesh).material as THREE.MeshBasicMaterial;
          mat.opacity = THREE.MathUtils.lerp(0.8, 0, t);
        }
      });
    }
  }
  
  private updateLightning(effect: MagicEffectInstance, deltaTime: number): void {
    const mesh = effect.meshes[0] as THREE.Group;
    if (!mesh) return;
    
    const t = effect.time / effect.duration;
    
    // 번개 깜빡임
    const flicker = Math.random() > 0.3 ? 1 : 0.5;
    mesh.children.forEach((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mat = (child as THREE.Mesh).material as THREE.MeshBasicMaterial;
        mat.opacity = THREE.MathUtils.lerp(0.9, 0, t) * flicker;
      } else if ((child as THREE.Line).isLine) {
        const mat = (child as THREE.Line).material as THREE.LineBasicMaterial;
        mat.opacity = THREE.MathUtils.lerp(0.9, 0, t) * flicker;
      }
    });
    
    // 분기 업데이트
    if (Math.random() > 0.7) {
      this.updateLightningBranches(mesh, 2);
    }
  }
  
  private updateHealWave(effect: MagicEffectInstance, deltaTime: number): void {
    const mesh = effect.meshes[0] as THREE.Mesh;
    if (!mesh) return;
    
    const t = effect.time / effect.duration;
    
    // 확산
    const scale = THREE.MathUtils.lerp(0.1, effect.scale, Math.min(t * 2, 1));
    mesh.scale.setScalar(scale);
    
    // 페이드
    const mat = mesh.material as THREE.MeshBasicMaterial;
    mat.opacity = THREE.MathUtils.lerp(0.6, 0, Math.pow(t, 2));
    
    // 이미터 위치 업데이트 (위아래 펄스)
    if (effect.emitterId) {
      const pulseY = Math.sin(effect.time * 4) * 0.3 + 0.5;
      const pos = effect.position.clone();
      pos.y = pulseY;
      this.particleSystem.updateEmitterPosition(effect.emitterId, pos);
    }
  }
  
  private updateCurseAura(effect: MagicEffectInstance, deltaTime: number): void {
    const mesh = effect.meshes[0] as THREE.Group;
    if (!mesh) return;
    
    const t = effect.time / effect.duration;
    
    // 회전
    mesh.rotation.y += deltaTime * 2;
    
    // 링 개별 회전
    mesh.children.forEach((child, i) => {
      if (i > 0) {
        child.rotation.x += deltaTime * (1 + i * 0.5);
        child.rotation.z += deltaTime * (0.5 + i * 0.3);
      }
    });
    
    // 페이드
    mesh.children.forEach((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mat = (child as THREE.Mesh).material as THREE.MeshBasicMaterial;
        if (t > 0.8) {
          mat.opacity = THREE.MathUtils.lerp(0.7, 0, (t - 0.8) / 0.2);
        }
      }
    });
  }
  
  private updateShield(effect: MagicEffectInstance, deltaTime: number): void {
    const mesh = effect.meshes[0] as THREE.Mesh;
    if (!mesh) return;
    
    const t = effect.time / effect.duration;
    const mat = mesh.material as THREE.MeshBasicMaterial;
    
    // 펄스 효과
    const pulse = Math.sin(effect.time * 3) * 0.05 + 1;
    mesh.scale.setScalar(effect.scale * pulse);
    
    // 시작/끝 페이드
    if (t < 0.1) {
      mat.opacity = THREE.MathUtils.lerp(0, 0.3, t / 0.1);
    } else if (t > 0.9) {
      mat.opacity = THREE.MathUtils.lerp(0.3, 0, (t - 0.9) / 0.1);
    }
    
    // 회전
    mesh.rotation.y += deltaTime * 0.5;
  }
  
  private removeEffect(id: string): void {
    const effect = this.activeEffects.get(id);
    if (!effect) return;
    
    // 메시 해제
    for (const mesh of effect.meshes) {
      this.releaseMesh(mesh);
    }
    
    // 이미터 제거
    if (effect.emitterId) {
      this.particleSystem.removeEmitter(effect.emitterId);
    }
    
    this.activeEffects.delete(id);
  }
  
  // ========================================
  // 유틸리티
  // ========================================
  
  /**
   * 활성 이펙트 수
   */
  getActiveCount(): number {
    return this.activeEffects.size;
  }
  
  /**
   * 이펙트 제거
   */
  remove(id: string): void {
    this.removeEffect(id);
  }
  
  /**
   * 모든 이펙트 제거
   */
  clear(): void {
    for (const id of this.activeEffects.keys()) {
      this.removeEffect(id);
    }
  }
  
  /**
   * 리소스 정리
   */
  dispose(): void {
    this.clear();
    
    // 메시 풀 정리
    const allPools = [
      this.fireballMeshPool,
      this.lightningMeshPool,
      this.healWaveMeshPool,
      this.curseAuraMeshPool,
      this.shieldMeshPool,
    ];
    
    for (const pool of allPools) {
      for (const mesh of pool) {
        this.scene.remove(mesh);
        if ((mesh as THREE.Mesh).isMesh) {
          ((mesh as THREE.Mesh).material as THREE.Material).dispose();
        } else if ((mesh as THREE.Group).isGroup) {
          mesh.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
              ((child as THREE.Mesh).material as THREE.Material).dispose();
            }
          });
        }
      }
    }
    
    // 공유 리소스 정리
    this.sphereGeometry.dispose();
    this.ringGeometry.dispose();
    
    console.log('🧹 MagicEffects disposed');
  }
}

export default MagicEffects;





