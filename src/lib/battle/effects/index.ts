/**
 * Battle Effects System
 * 
 * 토탈워 스타일 전투 VFX 시스템
 * 
 * - ParticleSystem: 파티클 효과 (피, 먼지, 연기, 불꽃 등)
 * - SoundManager: 사운드 효과 (SFX, BGM)
 * - CameraEffects: 카메라 효과 (흔들림, 슬로우모션, 줌 등)
 */

// 파티클 시스템
export {
  ParticleSystem,
  initParticleSystem,
  getParticleSystem,
  type ParticleType,
  type Particle,
  type ParticleEmitterConfig,
} from './ParticleSystem';

// 사운드 매니저
export {
  SoundManager,
  initSoundManager,
  getSoundManager,
  type SFXType,
  type BGMType,
  type SoundConfig,
} from './SoundManager';

// 카메라 효과
export {
  CameraEffects,
  initCameraEffects,
  getCameraEffects,
  Easing,
  type CameraEffectState,
  type ShakeConfig,
  type SlowMotionConfig,
  type ZoomConfig,
  type FadeConfig,
  type FlashConfig,
  type EasingFunction,
} from './CameraEffects';

// ========================================
// 통합 Battle VFX 매니저
// ========================================

import * as THREE from 'three';
import { ParticleSystem, initParticleSystem } from './ParticleSystem';
import { SoundManager, initSoundManager } from './SoundManager';
import { CameraEffects, initCameraEffects } from './CameraEffects';

/**
 * BattleVFX - 전투 VFX 통합 매니저
 * 
 * 모든 VFX 시스템을 통합 관리하고 전투 이벤트에 맞는 
 * 시각/청각 효과를 쉽게 트리거할 수 있습니다.
 */
export class BattleVFX {
  public particles: ParticleSystem;
  public sound: SoundManager;
  public camera: CameraEffects;
  
  private initialized = false;

  constructor(
    scene: THREE.Scene,
    camera: THREE.PerspectiveCamera,
    domElement?: HTMLElement
  ) {
    this.particles = initParticleSystem(scene);
    this.sound = new SoundManager();
    this.camera = initCameraEffects(camera, domElement);
  }
  
  /**
   * 사운드 시스템 초기화 (사용자 상호작용 후 호출)
   */
  async initializeSound(): Promise<void> {
    await this.sound.initialize();
    this.initialized = true;
  }
  
  /**
   * 프레임 업데이트
   */
  update(deltaTime: number): void {
    // 슬로우모션 적용된 델타 타임
    const scaledDeltaTime = this.camera.getScaledDeltaTime(deltaTime);
    
    // 파티클 업데이트
    this.particles.update(scaledDeltaTime);
    
    // 카메라 효과 업데이트
    this.camera.update(deltaTime);
  }
  
  // ========================================
  // 전투 이벤트 VFX
  // ========================================
  
  /**
   * 근접 공격 히트 (검/창/도끼 등)
   */
  meleeHit(
    position: THREE.Vector3,
    direction?: THREE.Vector3,
    isCritical: boolean = false,
    isArmored: boolean = false
  ): void {
    // 피 파티클
    this.particles.emitBlood(position, direction, isCritical ? 1.5 : 1);
    
    // 금속 불꽃 (갑옷 히트)
    if (isArmored) {
      this.particles.emitSparks(position, direction);
    }
    
    // 사운드
    if (isArmored) {
      this.sound.playSFX('armor_hit', { position: { x: position.x, y: position.y, z: position.z } });
    } else {
      this.sound.playSFX('hit_flesh', { position: { x: position.x, y: position.y, z: position.z } });
    }
    
    // 크리티컬 시 카메라 효과
    if (isCritical) {
      this.camera.shakeLight(0.2);
    }
  }
  
  /**
   * 검 충돌 (방패 방어 또는 검 vs 검)
   */
  swordClash(position: THREE.Vector3, direction?: THREE.Vector3): void {
    // 금속 불꽃
    this.particles.emitSparks(position, direction);
    
    // 사운드
    this.sound.playSwordClash({ x: position.x, y: position.y, z: position.z });
    
    // 가벼운 흔들림
    this.camera.shakeLight(0.15);
  }
  
  /**
   * 방패 방어
   */
  shieldBlock(position: THREE.Vector3): void {
    // 먼지
    this.particles.emitDust(position, 0.5);
    
    // 사운드
    this.sound.playShieldBlock({ x: position.x, y: position.y, z: position.z });
  }
  
  /**
   * 화살 발사
   */
  arrowShot(from: THREE.Vector3, to: THREE.Vector3): void {
    // 화살 궤적
    this.particles.emitArrowTrail(from, to);
    
    // 사운드
    this.sound.playArrowShot({ x: from.x, y: from.y, z: from.z });
  }
  
  /**
   * 화살 히트
   */
  arrowHit(position: THREE.Vector3, isArmored: boolean = false): void {
    // 파티클
    if (isArmored) {
      this.particles.emitSparks(position);
      this.sound.playSFX('armor_hit', { position: { x: position.x, y: position.y, z: position.z }, volume: 0.4 });
    } else {
      this.particles.emitBlood(position, undefined, 0.5);
      this.sound.playSFX('hit_flesh', { position: { x: position.x, y: position.y, z: position.z }, volume: 0.4 });
    }
  }
  
  /**
   * 돌격 시작
   */
  chargeStart(position: THREE.Vector3, direction: THREE.Vector3): string {
    // 돌격 나팔
    this.sound.playChargeHorn({ x: position.x, y: position.y, z: position.z });
    
    // 먼지 이미터 생성
    return this.particles.emitChargeDust(position, direction);
  }
  
  /**
   * 돌격 충돌 (기병 vs 보병)
   */
  chargeImpact(position: THREE.Vector3, intensity: number = 1): void {
    // 먼지 폭발
    this.particles.emitDust(position, intensity * 2);
    
    // 피 (대규모)
    this.particles.emitBlood(position, undefined, intensity);
    
    // 사운드 (강한 충격)
    this.sound.playSFX('hit_flesh', { position: { x: position.x, y: position.y, z: position.z }, volume: 0.8 });
    
    // 카메라 충격
    this.camera.shakeImpact();
  }
  
  /**
   * 병사 사망
   */
  soldierDeath(position: THREE.Vector3): void {
    // 사망 이펙트 (피 + 먼지)
    this.particles.emitDeath(position);
    
    // 사망 비명
    this.sound.playDeathCry({ x: position.x, y: position.y, z: position.z });
  }
  
  /**
   * 폭발 (공성 무기, 화염병 등)
   */
  explosion(position: THREE.Vector3, size: number = 1): void {
    // 폭발 파티클
    this.particles.emitExplosion(position, size);
    
    // 카메라 효과
    this.camera.explosion(size);
    
    // 사운드 (TODO: 폭발음 추가)
    // this.sound.playSFX('explosion', { position });
  }
  
  /**
   * 화재
   */
  startFire(position: THREE.Vector3): string {
    return this.particles.emitFire(position);
  }
  
  /**
   * 연기
   */
  startSmoke(position: THREE.Vector3): string {
    return this.particles.emitSmoke(position);
  }
  
  /**
   * 함성 (전투 시작, 돌격 등)
   */
  battleCry(position: THREE.Vector3): void {
    this.sound.playBattleCry({ x: position.x, y: position.y, z: position.z });
  }
  
  // ========================================
  // 게임 상태 VFX
  // ========================================
  
  /**
   * 전투 시작
   */
  battleStart(): void {
    // BGM 시작
    // this.sound.playMusic('battle_intro');
    
    // 페이드 인
    this.camera.fadeFromBlack(1);
  }
  
  /**
   * 격렬한 전투 (BGM 전환)
   */
  battleIntense(): void {
    // this.sound.transitionMusic('battle_intense', 2);
  }
  
  /**
   * 승리
   */
  async victory(focusTarget?: THREE.Vector3): Promise<void> {
    // BGM 전환
    // this.sound.playMusic('victory');
    
    // 시네마틱 효과
    if (focusTarget) {
      await this.camera.victoryEffect(focusTarget);
    } else {
      await this.camera.fadeToBlack(2, 1);
    }
  }
  
  /**
   * 패배
   */
  async defeat(): Promise<void> {
    // BGM 전환
    // this.sound.playMusic('defeat');
    
    // 페이드 아웃
    await this.camera.fadeToBlack(3, 1);
  }
  
  /**
   * 킬캠 (결정적 타격)
   */
  async killcam(target: THREE.Vector3): Promise<void> {
    await this.camera.killEffect(target);
  }
  
  // ========================================
  // 유틸리티
  // ========================================
  
  /**
   * 이미터 제거
   */
  removeEmitter(id: string): void {
    this.particles.removeEmitter(id);
  }
  
  /**
   * 리스너 위치 업데이트 (카메라 위치)
   */
  updateListenerPosition(position: THREE.Vector3): void {
    this.sound.updateListenerPosition(position.x, position.y, position.z);
  }
  
  /**
   * 모든 효과 정리
   */
  clear(): void {
    this.particles.clear();
    this.camera.stopAllEffects();
  }
  
  /**
   * 리소스 해제
   */
  dispose(): void {
    this.particles.dispose();
    this.sound.dispose();
    this.camera.dispose();
  }
}

// ========================================
// 싱글톤 헬퍼
// ========================================

let battleVFXInstance: BattleVFX | null = null;

export function initBattleVFX(
  scene: THREE.Scene,
  camera: THREE.PerspectiveCamera,
  domElement?: HTMLElement
): BattleVFX {
  if (battleVFXInstance) {
    battleVFXInstance.dispose();
  }
  battleVFXInstance = new BattleVFX(scene, camera, domElement);
  return battleVFXInstance;
}

export function getBattleVFX(): BattleVFX | null {
  return battleVFXInstance;
}





