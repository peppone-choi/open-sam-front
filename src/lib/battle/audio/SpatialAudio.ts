/**
 * SpatialAudio - 3D 공간 오디오 시스템
 * 
 * 기능:
 * - 3D 위치 기반 사운드 재생
 * - 거리 감쇠 (롤오프)
 * - 리스너 위치/방향 업데이트
 * - HRTF 기반 패닝
 * - 도플러 효과 (선택)
 */

import { SFXType, SFX_DEFAULTS } from './SoundEffects';

// ========================================
// 타입 정의
// ========================================

/** 3D 벡터 */
export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

/** 공간 오디오 설정 */
export interface SpatialConfig {
  /** 최대 거리 (이 거리 이상에서는 들리지 않음) */
  maxDistance: number;
  /** 기준 거리 (이 거리에서 볼륨 = 1) */
  refDistance: number;
  /** 롤오프 팩터 (감쇠 속도) */
  rolloffFactor: number;
  /** 거리 모델 */
  distanceModel: DistanceModelType;
  /** 패닝 모델 */
  panningModel: PanningModelType;
  /** 내부 콘 각도 (degrees) */
  coneInnerAngle: number;
  /** 외부 콘 각도 (degrees) */
  coneOuterAngle: number;
  /** 외부 콘 게인 */
  coneOuterGain: number;
}

/** 공간 사운드 인스턴스 */
interface SpatialSoundInstance {
  id: string;
  type: SFXType | string;
  source: AudioBufferSourceNode;
  gainNode: GainNode;
  pannerNode: PannerNode;
  position: Vector3;
  startTime: number;
  duration: number;
  priority: number;
  active: boolean;
}

/** 리스너 상태 */
interface ListenerState {
  position: Vector3;
  forward: Vector3;
  up: Vector3;
}

// ========================================
// 기본 설정
// ========================================

export const DEFAULT_SPATIAL_CONFIG: SpatialConfig = {
  maxDistance: 100,
  refDistance: 1,
  rolloffFactor: 1,
  distanceModel: 'inverse',
  panningModel: 'HRTF',
  coneInnerAngle: 360,
  coneOuterAngle: 360,
  coneOuterGain: 0,
};

/** SFX별 공간 오디오 설정 */
const SFX_SPATIAL_CONFIG: Partial<Record<SFXType, Partial<SpatialConfig>>> = {
  sword_clash: { maxDistance: 50, refDistance: 1 },
  arrow_shot: { maxDistance: 80, refDistance: 2 },
  charge_horn: { maxDistance: 150, refDistance: 5 },
  death_cry: { maxDistance: 40, refDistance: 1 },
  shield_block: { maxDistance: 40, refDistance: 1 },
  horse_gallop: { maxDistance: 60, refDistance: 2 },
  battle_cry: { maxDistance: 100, refDistance: 3 },
  footstep: { maxDistance: 20, refDistance: 0.5 },
  hit_flesh: { maxDistance: 30, refDistance: 1 },
  armor_hit: { maxDistance: 40, refDistance: 1 },
};

// ========================================
// SpatialAudio 클래스
// ========================================

export class SpatialAudio {
  private audioContext: AudioContext;
  private outputNode: GainNode;
  
  // 버퍼 캐시 (SoundEffects와 공유하거나 별도 유지)
  private buffers: Map<string, AudioBuffer> = new Map();
  
  // 활성 인스턴스
  private activeInstances: SpatialSoundInstance[] = [];
  private instanceIdCounter = 0;
  
  // 리스너 상태
  private listenerState: ListenerState = {
    position: { x: 0, y: 0, z: 0 },
    forward: { x: 0, y: 0, z: -1 },
    up: { x: 0, y: 1, z: 0 },
  };
  
  // 설정
  private readonly MAX_INSTANCES = 32;
  private defaultConfig: SpatialConfig;
  
  // 쿨다운 (중복 재생 방지)
  private cooldowns: Map<string, number> = new Map();

  constructor(
    audioContext: AudioContext, 
    outputNode: GainNode,
    config?: Partial<SpatialConfig>
  ) {
    this.audioContext = audioContext;
    this.outputNode = outputNode;
    this.defaultConfig = { ...DEFAULT_SPATIAL_CONFIG, ...config };
    
    // 리스너 초기화
    this.initializeListener();
  }

  // ========================================
  // 리스너 관리
  // ========================================

  /**
   * 리스너 초기화
   */
  private initializeListener(): void {
    const listener = this.audioContext.listener;
    
    // 초기 위치 설정
    if (listener.positionX) {
      listener.positionX.value = 0;
      listener.positionY.value = 0;
      listener.positionZ.value = 0;
      listener.forwardX.value = 0;
      listener.forwardY.value = 0;
      listener.forwardZ.value = -1;
      listener.upX.value = 0;
      listener.upY.value = 1;
      listener.upZ.value = 0;
    } else {
      // 레거시 API
      listener.setPosition(0, 0, 0);
      listener.setOrientation(0, 0, -1, 0, 1, 0);
    }
  }

  /**
   * 리스너 위치 업데이트 (카메라 위치)
   */
  updateListenerPosition(x: number, y: number, z: number): void {
    this.listenerState.position = { x, y, z };
    
    const listener = this.audioContext.listener;
    
    if (listener.positionX) {
      // 현대 API (AudioParam)
      const currentTime = this.audioContext.currentTime;
      listener.positionX.setValueAtTime(x, currentTime);
      listener.positionY.setValueAtTime(y, currentTime);
      listener.positionZ.setValueAtTime(z, currentTime);
    } else {
      // 레거시 API
      listener.setPosition(x, y, z);
    }
  }

  /**
   * 리스너 방향 업데이트
   */
  updateListenerOrientation(
    forwardX: number, forwardY: number, forwardZ: number,
    upX = 0, upY = 1, upZ = 0
  ): void {
    this.listenerState.forward = { x: forwardX, y: forwardY, z: forwardZ };
    this.listenerState.up = { x: upX, y: upY, z: upZ };
    
    const listener = this.audioContext.listener;
    
    if (listener.forwardX) {
      // 현대 API
      const currentTime = this.audioContext.currentTime;
      listener.forwardX.setValueAtTime(forwardX, currentTime);
      listener.forwardY.setValueAtTime(forwardY, currentTime);
      listener.forwardZ.setValueAtTime(forwardZ, currentTime);
      listener.upX.setValueAtTime(upX, currentTime);
      listener.upY.setValueAtTime(upY, currentTime);
      listener.upZ.setValueAtTime(upZ, currentTime);
    } else {
      // 레거시 API
      listener.setOrientation(forwardX, forwardY, forwardZ, upX, upY, upZ);
    }
  }

  /**
   * 카메라에서 리스너 업데이트 (Three.js Camera 호환)
   */
  updateFromCamera(camera: {
    position: Vector3;
    getWorldDirection?: (target: Vector3) => Vector3;
    up?: Vector3;
  }): void {
    // 위치 업데이트
    this.updateListenerPosition(
      camera.position.x,
      camera.position.y,
      camera.position.z
    );
    
    // 방향 업데이트
    if (camera.getWorldDirection) {
      const direction = { x: 0, y: 0, z: 0 };
      camera.getWorldDirection(direction);
      const up = camera.up || { x: 0, y: 1, z: 0 };
      
      this.updateListenerOrientation(
        direction.x, direction.y, direction.z,
        up.x, up.y, up.z
      );
    }
  }

  // ========================================
  // 버퍼 관리
  // ========================================

  /**
   * 외부 버퍼 캐싱
   */
  cacheBuffer(id: string, buffer: AudioBuffer): void {
    this.buffers.set(id, buffer);
  }

  /**
   * SoundEffects에서 버퍼 연결
   */
  linkBuffers(soundEffects: { buffers: Map<string, AudioBuffer> }): void {
    // SoundEffects의 버퍼를 참조
    this.buffers = soundEffects.buffers;
  }

  // ========================================
  // 3D 사운드 재생
  // ========================================

  /**
   * 3D 위치에서 사운드 재생
   */
  playAt(
    type: SFXType | string,
    position: Vector3,
    options?: {
      volume?: number;
      pitch?: number;
      config?: Partial<SpatialConfig>;
    }
  ): string | null {
    const buffer = this.buffers.get(type);
    if (!buffer) {
      console.warn(`Spatial sound buffer not found: ${type}`);
      return null;
    }

    // 쿨다운 체크
    const sfxType = type as SFXType;
    const defaults = SFX_DEFAULTS[sfxType];
    if (defaults) {
      const now = Date.now();
      const lastPlayed = this.cooldowns.get(type) || 0;
      if (now - lastPlayed < defaults.cooldown) {
        return null;
      }
      this.cooldowns.set(type, now);
    }

    // 리스너와의 거리 계산
    const distance = this.getDistance(position, this.listenerState.position);
    const spatialConfig = SFX_SPATIAL_CONFIG[sfxType] || {};
    const maxDistance = options?.config?.maxDistance ?? spatialConfig.maxDistance ?? this.defaultConfig.maxDistance;
    
    // 너무 먼 경우 재생하지 않음
    if (distance > maxDistance) {
      return null;
    }

    // 인스턴스 제한 체크
    if (this.activeInstances.length >= this.MAX_INSTANCES) {
      this.removeLowestPriorityInstance();
    }

    // 설정 병합
    const config: SpatialConfig = {
      ...this.defaultConfig,
      ...spatialConfig,
      ...options?.config,
    };

    // 피치 계산
    const pitchVariance = defaults?.pitchVariance ?? 0;
    const pitch = (options?.pitch ?? defaults?.pitch ?? 1) + (Math.random() - 0.5) * pitchVariance * 2;

    // 오디오 노드 생성
    const source = this.audioContext.createBufferSource();
    source.buffer = buffer;
    source.playbackRate.value = pitch;
    source.loop = defaults?.loop ?? false;

    // 게인 노드
    const gainNode = this.audioContext.createGain();
    gainNode.gain.value = options?.volume ?? defaults?.volume ?? 0.5;

    // 패너 노드 (3D 위치 지정)
    const pannerNode = this.audioContext.createPanner();
    this.configurePanner(pannerNode, config);
    pannerNode.setPosition(position.x, position.y, position.z);

    // 노드 연결
    source.connect(gainNode);
    gainNode.connect(pannerNode);
    pannerNode.connect(this.outputNode);

    // 인스턴스 등록
    const id = `spatial_${this.instanceIdCounter++}`;
    const instance: SpatialSoundInstance = {
      id,
      type,
      source,
      gainNode,
      pannerNode,
      position: { ...position },
      startTime: this.audioContext.currentTime,
      duration: buffer.duration / pitch,
      priority: defaults?.priority ?? 5,
      active: true,
    };

    this.activeInstances.push(instance);

    // 재생 완료 콜백
    source.onended = () => {
      instance.active = false;
      this.removeInstance(id);
    };

    // 재생 시작
    source.start();

    return id;
  }

  /**
   * 패너 노드 설정
   */
  private configurePanner(panner: PannerNode, config: SpatialConfig): void {
    panner.panningModel = config.panningModel;
    panner.distanceModel = config.distanceModel;
    panner.refDistance = config.refDistance;
    panner.maxDistance = config.maxDistance;
    panner.rolloffFactor = config.rolloffFactor;
    panner.coneInnerAngle = config.coneInnerAngle;
    panner.coneOuterAngle = config.coneOuterAngle;
    panner.coneOuterGain = config.coneOuterGain;
  }

  /**
   * 사운드 위치 업데이트 (이동하는 소스)
   */
  updatePosition(id: string, position: Vector3): void {
    const instance = this.activeInstances.find(i => i.id === id);
    if (!instance) return;

    instance.position = { ...position };
    instance.pannerNode.setPosition(position.x, position.y, position.z);
  }

  /**
   * 사운드 정지
   */
  stop(id: string): void {
    const instance = this.activeInstances.find(i => i.id === id);
    if (!instance) return;

    try {
      instance.source.stop();
    } catch {
      // 이미 정지된 경우 무시
    }
    instance.active = false;
    this.removeInstance(id);
  }

  /**
   * 모든 공간 사운드 정지
   */
  stopAll(): void {
    for (const instance of this.activeInstances) {
      try {
        instance.source.stop();
      } catch {
        // 무시
      }
    }
    this.activeInstances = [];
  }

  // ========================================
  // 거리 기반 유틸리티
  // ========================================

  /**
   * 두 점 사이 거리 계산
   */
  private getDistance(a: Vector3, b: Vector3): number {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const dz = b.z - a.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  /**
   * 특정 거리 내 활성 사운드 수 조회
   */
  getSoundsWithinDistance(position: Vector3, distance: number): number {
    return this.activeInstances.filter(i => 
      this.getDistance(i.position, position) <= distance
    ).length;
  }

  /**
   * 리스너 위치 기준 가장 가까운 사운드
   */
  getNearestSound(): SpatialSoundInstance | null {
    if (this.activeInstances.length === 0) return null;

    let nearest: SpatialSoundInstance | null = null;
    let minDistance = Infinity;

    for (const instance of this.activeInstances) {
      const dist = this.getDistance(instance.position, this.listenerState.position);
      if (dist < minDistance) {
        minDistance = dist;
        nearest = instance;
      }
    }

    return nearest;
  }

  // ========================================
  // 인스턴스 관리
  // ========================================

  private removeInstance(id: string): void {
    const index = this.activeInstances.findIndex(i => i.id === id);
    if (index >= 0) {
      const instance = this.activeInstances[index];
      try {
        instance.source.disconnect();
        instance.gainNode.disconnect();
        instance.pannerNode.disconnect();
      } catch {
        // 무시
      }
      this.activeInstances.splice(index, 1);
    }
  }

  private removeLowestPriorityInstance(): void {
    let lowest: SpatialSoundInstance | null = null;
    let lowestIndex = -1;

    for (let i = 0; i < this.activeInstances.length; i++) {
      const instance = this.activeInstances[i];
      if (!lowest || instance.priority < lowest.priority) {
        lowest = instance;
        lowestIndex = i;
      }
    }

    if (lowest && lowestIndex >= 0) {
      try {
        lowest.source.stop();
        lowest.source.disconnect();
        lowest.gainNode.disconnect();
        lowest.pannerNode.disconnect();
      } catch {
        // 무시
      }
      this.activeInstances.splice(lowestIndex, 1);
    }
  }

  // ========================================
  // 상태 조회
  // ========================================

  /**
   * 활성 사운드 수 반환
   */
  getActiveSoundCount(): number {
    return this.activeInstances.length;
  }

  /**
   * 리스너 상태 반환
   */
  getListenerState(): ListenerState {
    return { ...this.listenerState };
  }

  /**
   * 활성 인스턴스 목록 반환 (디버깅용)
   */
  getActiveInstances(): Array<{
    id: string;
    type: string;
    position: Vector3;
    distance: number;
  }> {
    return this.activeInstances.map(i => ({
      id: i.id,
      type: i.type as string,
      position: { ...i.position },
      distance: this.getDistance(i.position, this.listenerState.position),
    }));
  }

  // ========================================
  // 정리
  // ========================================

  /**
   * 리소스 정리
   */
  dispose(): void {
    this.stopAll();
    this.buffers.clear();
    this.cooldowns.clear();
  }
}

export default SpatialAudio;





