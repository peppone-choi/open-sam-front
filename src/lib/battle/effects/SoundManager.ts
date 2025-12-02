/**
 * SoundManager - 전투 사운드 시스템
 * 
 * Web Audio API 기반 고성능 사운드 매니저
 * 
 * SFX:
 * - sword_clash: 검 충돌음
 * - arrow_shot: 화살 발사음
 * - charge_horn: 돌격 나팔
 * - death_cry: 사망 비명
 * - shield_block: 방패 방어음
 * - horse_gallop: 말 발굽 소리
 * - battle_cry: 함성
 * 
 * Music:
 * - battle_intro: 전투 시작
 * - battle_intense: 격렬한 전투
 * - victory: 승리
 * - defeat: 패배
 * 
 * 최적화:
 * - 사운드 풀링 (동시 재생 수 제한)
 * - 공간 오디오 (3D 위치 기반)
 * - 동적 믹싱 (상황에 따른 볼륨 조절)
 */

// ========================================
// 타입 정의
// ========================================

/** SFX 타입 */
export type SFXType = 
  | 'sword_clash'
  | 'arrow_shot'
  | 'charge_horn'
  | 'death_cry'
  | 'shield_block'
  | 'horse_gallop'
  | 'battle_cry'
  | 'footstep'
  | 'hit_flesh'
  | 'armor_hit';

/** BGM 타입 */
export type BGMType = 
  | 'battle_intro'
  | 'battle_intense'
  | 'victory'
  | 'defeat'
  | 'tension'
  | 'ambient';

/** 사운드 설정 */
export interface SoundConfig {
  volume: number;        // 0-1
  pitch?: number;        // 재생 속도 (1 = 기본)
  pitchVariance?: number; // 피치 변동 (랜덤)
  loop?: boolean;
  spatial?: boolean;     // 3D 공간 오디오
  maxDistance?: number;  // 공간 오디오 최대 거리
  position?: { x: number; y: number; z: number };
  priority?: number;     // 우선순위 (높을수록 중요)
}

/** 사운드 인스턴스 */
interface SoundInstance {
  id: string;
  source: AudioBufferSourceNode;
  gainNode: GainNode;
  pannerNode?: PannerNode;
  type: SFXType | BGMType;
  startTime: number;
  duration: number;
  priority: number;
  active: boolean;
}

/** SFX 기본 설정 */
const SFX_DEFAULTS: Record<SFXType, Partial<SoundConfig>> = {
  sword_clash: {
    volume: 0.7,
    pitch: 1,
    pitchVariance: 0.15,
    spatial: true,
    maxDistance: 50,
    priority: 5,
  },
  arrow_shot: {
    volume: 0.5,
    pitch: 1.1,
    pitchVariance: 0.1,
    spatial: true,
    maxDistance: 80,
    priority: 4,
  },
  charge_horn: {
    volume: 0.9,
    pitch: 1,
    pitchVariance: 0,
    spatial: true,
    maxDistance: 150,
    priority: 10,
  },
  death_cry: {
    volume: 0.6,
    pitch: 1,
    pitchVariance: 0.3,
    spatial: true,
    maxDistance: 40,
    priority: 3,
  },
  shield_block: {
    volume: 0.65,
    pitch: 0.9,
    pitchVariance: 0.1,
    spatial: true,
    maxDistance: 40,
    priority: 5,
  },
  horse_gallop: {
    volume: 0.5,
    pitch: 1,
    pitchVariance: 0.05,
    spatial: true,
    maxDistance: 60,
    priority: 2,
    loop: true,
  },
  battle_cry: {
    volume: 0.8,
    pitch: 1,
    pitchVariance: 0.2,
    spatial: true,
    maxDistance: 100,
    priority: 7,
  },
  footstep: {
    volume: 0.2,
    pitch: 1,
    pitchVariance: 0.2,
    spatial: true,
    maxDistance: 20,
    priority: 1,
  },
  hit_flesh: {
    volume: 0.55,
    pitch: 1,
    pitchVariance: 0.15,
    spatial: true,
    maxDistance: 30,
    priority: 4,
  },
  armor_hit: {
    volume: 0.6,
    pitch: 0.8,
    pitchVariance: 0.1,
    spatial: true,
    maxDistance: 40,
    priority: 5,
  },
};

/** BGM 기본 설정 */
const BGM_DEFAULTS: Record<BGMType, Partial<SoundConfig>> = {
  battle_intro: {
    volume: 0.6,
    loop: false,
    priority: 10,
  },
  battle_intense: {
    volume: 0.5,
    loop: true,
    priority: 10,
  },
  victory: {
    volume: 0.7,
    loop: false,
    priority: 10,
  },
  defeat: {
    volume: 0.6,
    loop: false,
    priority: 10,
  },
  tension: {
    volume: 0.4,
    loop: true,
    priority: 8,
  },
  ambient: {
    volume: 0.3,
    loop: true,
    priority: 5,
  },
};

// ========================================
// 절차적 사운드 생성 (Procedural Audio)
// ========================================

/**
 * 검 충돌음 생성
 */
function generateSwordClash(audioContext: AudioContext): AudioBuffer {
  const sampleRate = audioContext.sampleRate;
  const duration = 0.3;
  const length = sampleRate * duration;
  const buffer = audioContext.createBuffer(1, length, sampleRate);
  const data = buffer.getChannelData(0);
  
  for (let i = 0; i < length; i++) {
    const t = i / sampleRate;
    
    // 금속 충돌: 고주파 노이즈 + 감쇠
    const noise = (Math.random() * 2 - 1);
    const envelope = Math.exp(-t * 15);
    
    // 공명 주파수
    const metalRing = Math.sin(2 * Math.PI * 2500 * t) * 0.3;
    const metalRing2 = Math.sin(2 * Math.PI * 3200 * t) * 0.2;
    
    // 충격파
    const impact = t < 0.02 ? Math.sin(2 * Math.PI * 800 * t) * (0.02 - t) * 50 : 0;
    
    data[i] = (noise * 0.5 + metalRing + metalRing2 + impact) * envelope * 0.8;
  }
  
  return buffer;
}

/**
 * 화살 발사음 생성
 */
function generateArrowShot(audioContext: AudioContext): AudioBuffer {
  const sampleRate = audioContext.sampleRate;
  const duration = 0.2;
  const length = sampleRate * duration;
  const buffer = audioContext.createBuffer(1, length, sampleRate);
  const data = buffer.getChannelData(0);
  
  for (let i = 0; i < length; i++) {
    const t = i / sampleRate;
    
    // 시위 소리: 짧은 펑
    const stringSnap = t < 0.05 ? Math.sin(2 * Math.PI * 150 * t) * (0.05 - t) * 20 : 0;
    
    // 공기 가르는 소리: 휘이익
    const whoosh = Math.random() * 2 - 1;
    const whooshEnv = Math.sin(Math.PI * t / duration) * Math.exp(-t * 5);
    
    data[i] = (stringSnap + whoosh * whooshEnv * 0.3) * 0.7;
  }
  
  return buffer;
}

/**
 * 돌격 나팔 생성
 */
function generateChargeHorn(audioContext: AudioContext): AudioBuffer {
  const sampleRate = audioContext.sampleRate;
  const duration = 2.0;
  const length = sampleRate * duration;
  const buffer = audioContext.createBuffer(1, length, sampleRate);
  const data = buffer.getChannelData(0);
  
  for (let i = 0; i < length; i++) {
    const t = i / sampleRate;
    
    // 나팔 음: 기본 주파수 + 배음
    const baseFreq = 220; // A3
    const fundamental = Math.sin(2 * Math.PI * baseFreq * t);
    const harmonic2 = Math.sin(2 * Math.PI * baseFreq * 2 * t) * 0.5;
    const harmonic3 = Math.sin(2 * Math.PI * baseFreq * 3 * t) * 0.3;
    const harmonic4 = Math.sin(2 * Math.PI * baseFreq * 4 * t) * 0.2;
    
    // 엔벨로프: 점점 커졌다가 유지
    const attack = Math.min(1, t / 0.3);
    const release = t > 1.7 ? 1 - (t - 1.7) / 0.3 : 1;
    const envelope = attack * release;
    
    // 비브라토
    const vibrato = 1 + Math.sin(2 * Math.PI * 5 * t) * 0.02;
    
    data[i] = (fundamental + harmonic2 + harmonic3 + harmonic4) * envelope * vibrato * 0.5;
  }
  
  return buffer;
}

/**
 * 사망 비명 생성
 */
function generateDeathCry(audioContext: AudioContext): AudioBuffer {
  const sampleRate = audioContext.sampleRate;
  const duration = 0.6;
  const length = sampleRate * duration;
  const buffer = audioContext.createBuffer(1, length, sampleRate);
  const data = buffer.getChannelData(0);
  
  for (let i = 0; i < length; i++) {
    const t = i / sampleRate;
    
    // 주파수가 떨어지는 비명
    const freq = 400 - t * 300;
    const cry = Math.sin(2 * Math.PI * freq * t);
    
    // 숨소리 노이즈
    const breath = (Math.random() * 2 - 1) * 0.2;
    
    // 엔벨로프: 빠르게 시작, 천천히 감소
    const envelope = Math.exp(-t * 3) * Math.min(1, t * 20);
    
    data[i] = (cry + breath) * envelope * 0.6;
  }
  
  return buffer;
}

/**
 * 방패 방어음 생성
 */
function generateShieldBlock(audioContext: AudioContext): AudioBuffer {
  const sampleRate = audioContext.sampleRate;
  const duration = 0.25;
  const length = sampleRate * duration;
  const buffer = audioContext.createBuffer(1, length, sampleRate);
  const data = buffer.getChannelData(0);
  
  for (let i = 0; i < length; i++) {
    const t = i / sampleRate;
    
    // 둔탁한 충격음
    const thud = Math.sin(2 * Math.PI * 100 * t) * Math.exp(-t * 20);
    
    // 나무/금속 울림
    const wood = Math.sin(2 * Math.PI * 300 * t) * Math.exp(-t * 10) * 0.5;
    
    // 노이즈
    const noise = (Math.random() * 2 - 1) * Math.exp(-t * 30) * 0.3;
    
    data[i] = (thud + wood + noise) * 0.7;
  }
  
  return buffer;
}

/**
 * 말 발굽 소리 생성
 */
function generateHorseGallop(audioContext: AudioContext): AudioBuffer {
  const sampleRate = audioContext.sampleRate;
  const duration = 1.0; // 1초 루프
  const length = sampleRate * duration;
  const buffer = audioContext.createBuffer(1, length, sampleRate);
  const data = buffer.getChannelData(0);
  
  // 4개의 발굽 (4박자 패턴)
  const hoofTimes = [0, 0.15, 0.5, 0.65];
  
  for (let i = 0; i < length; i++) {
    const t = i / sampleRate;
    
    let sample = 0;
    
    for (const hoofTime of hoofTimes) {
      const dt = Math.abs(t - hoofTime);
      if (dt < 0.1) {
        // 발굽 충격
        const impact = Math.sin(2 * Math.PI * 80 * dt) * Math.exp(-dt * 30);
        // 흙 튀는 소리
        const dirt = (Math.random() * 2 - 1) * Math.exp(-dt * 50) * 0.3;
        sample += (impact + dirt) * 0.5;
      }
    }
    
    data[i] = sample;
  }
  
  return buffer;
}

/**
 * 함성 생성
 */
function generateBattleCry(audioContext: AudioContext): AudioBuffer {
  const sampleRate = audioContext.sampleRate;
  const duration = 1.5;
  const length = sampleRate * duration;
  const buffer = audioContext.createBuffer(1, length, sampleRate);
  const data = buffer.getChannelData(0);
  
  for (let i = 0; i < length; i++) {
    const t = i / sampleRate;
    
    // 여러 음성 레이어
    const voice1 = Math.sin(2 * Math.PI * 180 * t);
    const voice2 = Math.sin(2 * Math.PI * 200 * t) * 0.7;
    const voice3 = Math.sin(2 * Math.PI * 160 * t) * 0.5;
    
    // 노이즈 (숨소리)
    const breath = (Math.random() * 2 - 1) * 0.15;
    
    // 엔벨로프: 점점 커졌다가 유지 후 감소
    const attack = Math.min(1, t / 0.2);
    const sustain = t > 1.2 ? 1 - (t - 1.2) / 0.3 : 1;
    const envelope = attack * sustain;
    
    data[i] = (voice1 + voice2 + voice3 + breath) * envelope * 0.4;
  }
  
  return buffer;
}

/**
 * 발소리 생성
 */
function generateFootstep(audioContext: AudioContext): AudioBuffer {
  const sampleRate = audioContext.sampleRate;
  const duration = 0.15;
  const length = sampleRate * duration;
  const buffer = audioContext.createBuffer(1, length, sampleRate);
  const data = buffer.getChannelData(0);
  
  for (let i = 0; i < length; i++) {
    const t = i / sampleRate;
    
    // 둔탁한 충격
    const thud = Math.sin(2 * Math.PI * 50 * t) * Math.exp(-t * 20);
    
    // 흙/풀 소리
    const dirt = (Math.random() * 2 - 1) * Math.exp(-t * 30) * 0.3;
    
    data[i] = (thud + dirt) * 0.5;
  }
  
  return buffer;
}

/**
 * 타격음 (살) 생성
 */
function generateHitFlesh(audioContext: AudioContext): AudioBuffer {
  const sampleRate = audioContext.sampleRate;
  const duration = 0.2;
  const length = sampleRate * duration;
  const buffer = audioContext.createBuffer(1, length, sampleRate);
  const data = buffer.getChannelData(0);
  
  for (let i = 0; i < length; i++) {
    const t = i / sampleRate;
    
    // 둔탁한 충격
    const impact = Math.sin(2 * Math.PI * 70 * t) * Math.exp(-t * 15);
    
    // 질감
    const squelch = (Math.random() * 2 - 1) * Math.exp(-t * 20) * 0.4;
    
    data[i] = (impact + squelch) * 0.6;
  }
  
  return buffer;
}

/**
 * 갑옷 타격음 생성
 */
function generateArmorHit(audioContext: AudioContext): AudioBuffer {
  const sampleRate = audioContext.sampleRate;
  const duration = 0.25;
  const length = sampleRate * duration;
  const buffer = audioContext.createBuffer(1, length, sampleRate);
  const data = buffer.getChannelData(0);
  
  for (let i = 0; i < length; i++) {
    const t = i / sampleRate;
    
    // 금속 충격
    const metal = Math.sin(2 * Math.PI * 1800 * t) * Math.exp(-t * 12);
    
    // 울림
    const ring = Math.sin(2 * Math.PI * 2400 * t) * Math.exp(-t * 8) * 0.4;
    
    // 충격파
    const impact = t < 0.01 ? (0.01 - t) * 100 : 0;
    
    data[i] = (metal + ring + impact) * 0.5;
  }
  
  return buffer;
}

// ========================================
// SoundManager 클래스
// ========================================

export class SoundManager {
  private audioContext: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  
  // 사운드 버퍼 캐시
  private buffers: Map<string, AudioBuffer> = new Map();
  
  // 활성 사운드 인스턴스
  private activeInstances: SoundInstance[] = [];
  private instanceIdCounter = 0;
  
  // 현재 재생 중인 BGM
  private currentBGM: SoundInstance | null = null;
  
  // 리스너 위치 (카메라 위치)
  private listenerPosition = { x: 0, y: 0, z: 0 };
  
  // 설정
  private readonly MAX_CONCURRENT_SFX = 32;
  private masterVolume = 1;
  private sfxVolume = 1;
  private musicVolume = 0.7;
  private muted = false;
  
  // 메트릭
  private metrics = {
    activeSFX: 0,
    totalPlayed: 0,
    lastUpdateTime: 0,
  };

  constructor() {
    // 초기화는 사용자 상호작용 후 호출
  }

  // ========================================
  // 초기화
  // ========================================
  
  /**
   * 오디오 컨텍스트 초기화 (사용자 상호작용 필요)
   */
  async initialize(): Promise<void> {
    if (this.audioContext) return;
    
    try {
      this.audioContext = new (window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      
      // 마스터 게인 노드
      this.masterGain = this.audioContext.createGain();
      this.masterGain.gain.value = this.masterVolume;
      this.masterGain.connect(this.audioContext.destination);
      
      // SFX 게인 노드
      this.sfxGain = this.audioContext.createGain();
      this.sfxGain.gain.value = this.sfxVolume;
      this.sfxGain.connect(this.masterGain);
      
      // 음악 게인 노드
      this.musicGain = this.audioContext.createGain();
      this.musicGain.gain.value = this.musicVolume;
      this.musicGain.connect(this.masterGain);
      
      // 절차적 사운드 생성
      await this.generateProceduralSounds();
      
      console.log('🔊 SoundManager initialized');
    } catch (error) {
      console.error('Failed to initialize audio context:', error);
    }
  }
  
  /**
   * 절차적 사운드 생성 및 캐싱
   */
  private async generateProceduralSounds(): Promise<void> {
    if (!this.audioContext) return;
    
    const generators: Record<SFXType, (ctx: AudioContext) => AudioBuffer> = {
      sword_clash: generateSwordClash,
      arrow_shot: generateArrowShot,
      charge_horn: generateChargeHorn,
      death_cry: generateDeathCry,
      shield_block: generateShieldBlock,
      horse_gallop: generateHorseGallop,
      battle_cry: generateBattleCry,
      footstep: generateFootstep,
      hit_flesh: generateHitFlesh,
      armor_hit: generateArmorHit,
    };
    
    for (const [type, generator] of Object.entries(generators)) {
      const buffer = generator(this.audioContext);
      this.buffers.set(type, buffer);
    }
    
    console.log(`Generated ${this.buffers.size} procedural sounds`);
  }
  
  /**
   * 외부 사운드 파일 로드
   */
  async loadSound(url: string, id: string): Promise<void> {
    if (!this.audioContext) {
      await this.initialize();
    }
    if (!this.audioContext) return;
    
    try {
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
      this.buffers.set(id, audioBuffer);
    } catch (error) {
      console.error(`Failed to load sound: ${url}`, error);
    }
  }

  // ========================================
  // SFX 재생
  // ========================================
  
  /**
   * SFX 재생
   */
  playSFX(type: SFXType, config: Partial<SoundConfig> = {}): string | null {
    if (!this.audioContext || !this.sfxGain || this.muted) return null;
    
    // 동시 재생 제한
    if (this.activeInstances.length >= this.MAX_CONCURRENT_SFX) {
      this.removeLowestPriority();
    }
    
    const buffer = this.buffers.get(type);
    if (!buffer) {
      console.warn(`Sound not found: ${type}`);
      return null;
    }
    
    const defaults = SFX_DEFAULTS[type];
    const mergedConfig: SoundConfig = {
      volume: config.volume ?? defaults.volume ?? 0.5,
      pitch: config.pitch ?? defaults.pitch ?? 1,
      pitchVariance: config.pitchVariance ?? defaults.pitchVariance ?? 0,
      loop: config.loop ?? defaults.loop ?? false,
      spatial: config.spatial ?? defaults.spatial ?? false,
      maxDistance: config.maxDistance ?? defaults.maxDistance ?? 50,
      position: config.position,
      priority: config.priority ?? defaults.priority ?? 5,
    };
    
    // 피치 변동 적용
    const pitchVariance = mergedConfig.pitchVariance || 0;
    const pitch = (mergedConfig.pitch || 1) + (Math.random() - 0.5) * pitchVariance * 2;
    
    // 오디오 노드 생성
    const source = this.audioContext.createBufferSource();
    source.buffer = buffer;
    source.playbackRate.value = pitch;
    source.loop = mergedConfig.loop || false;
    
    // 게인 노드
    const gainNode = this.audioContext.createGain();
    gainNode.gain.value = mergedConfig.volume;
    
    // 공간 오디오
    let pannerNode: PannerNode | undefined;
    if (mergedConfig.spatial && mergedConfig.position) {
      pannerNode = this.audioContext.createPanner();
      pannerNode.panningModel = 'HRTF';
      pannerNode.distanceModel = 'inverse';
      pannerNode.refDistance = 1;
      pannerNode.maxDistance = mergedConfig.maxDistance || 50;
      pannerNode.rolloffFactor = 1;
      
      pannerNode.setPosition(
        mergedConfig.position.x,
        mergedConfig.position.y,
        mergedConfig.position.z
      );
      
      source.connect(gainNode);
      gainNode.connect(pannerNode);
      pannerNode.connect(this.sfxGain);
    } else {
      source.connect(gainNode);
      gainNode.connect(this.sfxGain);
    }
    
    // 인스턴스 등록
    const id = `sfx_${this.instanceIdCounter++}`;
    const instance: SoundInstance = {
      id,
      source,
      gainNode,
      pannerNode,
      type,
      startTime: this.audioContext.currentTime,
      duration: buffer.duration / pitch,
      priority: mergedConfig.priority || 5,
      active: true,
    };
    
    this.activeInstances.push(instance);
    this.metrics.activeSFX = this.activeInstances.length;
    this.metrics.totalPlayed++;
    
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
   * SFX 정지
   */
  stopSFX(id: string): void {
    const instance = this.activeInstances.find(i => i.id === id);
    if (instance) {
      try {
        instance.source.stop();
      } catch {
        // 이미 정지된 경우 무시
      }
      instance.active = false;
      this.removeInstance(id);
    }
  }
  
  private removeLowestPriority(): void {
    // 가장 낮은 우선순위의 인스턴스 제거
    let lowest: SoundInstance | null = null;
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
      } catch {
        // 무시
      }
      this.activeInstances.splice(lowestIndex, 1);
    }
  }
  
  private removeInstance(id: string): void {
    const index = this.activeInstances.findIndex(i => i.id === id);
    if (index >= 0) {
      this.activeInstances.splice(index, 1);
      this.metrics.activeSFX = this.activeInstances.length;
    }
  }

  // ========================================
  // BGM 재생
  // ========================================
  
  /**
   * BGM 재생
   */
  playMusic(type: BGMType, fadeIn: number = 1): void {
    if (!this.audioContext || !this.musicGain || this.muted) return;
    
    const buffer = this.buffers.get(type);
    if (!buffer) {
      console.warn(`Music not found: ${type}. Generating placeholder...`);
      // BGM은 절차적 생성이 복잡하므로 스킵
      return;
    }
    
    // 이전 BGM 페이드 아웃
    if (this.currentBGM) {
      this.stopMusic(fadeIn * 0.5);
    }
    
    const defaults = BGM_DEFAULTS[type];
    
    const source = this.audioContext.createBufferSource();
    source.buffer = buffer;
    source.loop = defaults.loop ?? true;
    
    const gainNode = this.audioContext.createGain();
    gainNode.gain.value = 0;
    
    source.connect(gainNode);
    gainNode.connect(this.musicGain);
    
    // 페이드 인
    gainNode.gain.linearRampToValueAtTime(
      defaults.volume ?? 0.5,
      this.audioContext.currentTime + fadeIn
    );
    
    const instance: SoundInstance = {
      id: `bgm_${type}`,
      source,
      gainNode,
      type,
      startTime: this.audioContext.currentTime,
      duration: Infinity,
      priority: 10,
      active: true,
    };
    
    this.currentBGM = instance;
    
    source.start();
  }
  
  /**
   * BGM 정지
   */
  stopMusic(fadeOut: number = 1): void {
    if (!this.currentBGM || !this.audioContext) return;
    
    const instance = this.currentBGM;
    
    // 페이드 아웃
    instance.gainNode.gain.linearRampToValueAtTime(
      0,
      this.audioContext.currentTime + fadeOut
    );
    
    // 페이드 아웃 후 정지
    setTimeout(() => {
      try {
        instance.source.stop();
      } catch {
        // 무시
      }
      instance.active = false;
    }, fadeOut * 1000);
    
    this.currentBGM = null;
  }
  
  /**
   * BGM 전환
   */
  transitionMusic(type: BGMType, crossfade: number = 2): void {
    this.playMusic(type, crossfade);
  }

  // ========================================
  // 프리셋 사운드
  // ========================================
  
  /**
   * 검 충돌 사운드
   */
  playSwordClash(position?: { x: number; y: number; z: number }): void {
    this.playSFX('sword_clash', { position });
  }
  
  /**
   * 화살 발사 사운드
   */
  playArrowShot(position?: { x: number; y: number; z: number }): void {
    this.playSFX('arrow_shot', { position });
  }
  
  /**
   * 돌격 나팔
   */
  playChargeHorn(position?: { x: number; y: number; z: number }): void {
    this.playSFX('charge_horn', { position, volume: 0.9 });
  }
  
  /**
   * 사망 비명
   */
  playDeathCry(position?: { x: number; y: number; z: number }): void {
    this.playSFX('death_cry', { position });
  }
  
  /**
   * 방패 방어
   */
  playShieldBlock(position?: { x: number; y: number; z: number }): void {
    this.playSFX('shield_block', { position });
  }
  
  /**
   * 함성
   */
  playBattleCry(position?: { x: number; y: number; z: number }): void {
    this.playSFX('battle_cry', { position });
  }
  
  /**
   * 타격음 (무기 종류에 따라)
   */
  playHit(armorHit: boolean, position?: { x: number; y: number; z: number }): void {
    if (armorHit) {
      this.playSFX('armor_hit', { position });
    } else {
      this.playSFX('hit_flesh', { position });
    }
  }

  // ========================================
  // 볼륨 컨트롤
  // ========================================
  
  /**
   * 마스터 볼륨 설정
   */
  setMasterVolume(volume: number): void {
    this.masterVolume = Math.max(0, Math.min(1, volume));
    if (this.masterGain) {
      this.masterGain.gain.value = this.masterVolume;
    }
  }
  
  /**
   * SFX 볼륨 설정
   */
  setSFXVolume(volume: number): void {
    this.sfxVolume = Math.max(0, Math.min(1, volume));
    if (this.sfxGain) {
      this.sfxGain.gain.value = this.sfxVolume;
    }
  }
  
  /**
   * 음악 볼륨 설정
   */
  setMusicVolume(volume: number): void {
    this.musicVolume = Math.max(0, Math.min(1, volume));
    if (this.musicGain) {
      this.musicGain.gain.value = this.musicVolume;
    }
  }
  
  /**
   * 음소거 토글
   */
  toggleMute(): boolean {
    this.muted = !this.muted;
    if (this.masterGain) {
      this.masterGain.gain.value = this.muted ? 0 : this.masterVolume;
    }
    return this.muted;
  }
  
  /**
   * 음소거 설정
   */
  setMuted(muted: boolean): void {
    this.muted = muted;
    if (this.masterGain) {
      this.masterGain.gain.value = muted ? 0 : this.masterVolume;
    }
  }

  // ========================================
  // 공간 오디오
  // ========================================
  
  /**
   * 리스너 위치 업데이트 (카메라 위치)
   */
  updateListenerPosition(x: number, y: number, z: number): void {
    this.listenerPosition = { x, y, z };
    
    if (this.audioContext?.listener) {
      const listener = this.audioContext.listener;
      if (listener.positionX) {
        listener.positionX.value = x;
        listener.positionY.value = y;
        listener.positionZ.value = z;
      } else {
        listener.setPosition(x, y, z);
      }
    }
  }
  
  /**
   * 리스너 방향 업데이트
   */
  updateListenerOrientation(
    forwardX: number, forwardY: number, forwardZ: number,
    upX: number = 0, upY: number = 1, upZ: number = 0
  ): void {
    if (this.audioContext?.listener) {
      const listener = this.audioContext.listener;
      if (listener.forwardX) {
        listener.forwardX.value = forwardX;
        listener.forwardY.value = forwardY;
        listener.forwardZ.value = forwardZ;
        listener.upX.value = upX;
        listener.upY.value = upY;
        listener.upZ.value = upZ;
      } else {
        listener.setOrientation(forwardX, forwardY, forwardZ, upX, upY, upZ);
      }
    }
  }

  // ========================================
  // 유틸리티
  // ========================================
  
  /**
   * 활성 상태 체크 (오디오 컨텍스트 재개)
   */
  async resume(): Promise<void> {
    if (this.audioContext?.state === 'suspended') {
      await this.audioContext.resume();
    }
  }
  
  /**
   * 메트릭 조회
   */
  getMetrics(): typeof this.metrics {
    return { ...this.metrics };
  }
  
  /**
   * 정리
   */
  dispose(): void {
    // 모든 사운드 정지
    for (const instance of this.activeInstances) {
      try {
        instance.source.stop();
      } catch {
        // 무시
      }
    }
    this.activeInstances = [];
    
    // BGM 정지
    if (this.currentBGM) {
      try {
        this.currentBGM.source.stop();
      } catch {
        // 무시
      }
      this.currentBGM = null;
    }
    
    // 오디오 컨텍스트 닫기
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    
    this.buffers.clear();
    this.masterGain = null;
    this.sfxGain = null;
    this.musicGain = null;
  }
}

// ========================================
// 싱글톤 헬퍼
// ========================================

let soundManagerInstance: SoundManager | null = null;

export async function initSoundManager(): Promise<SoundManager> {
  if (!soundManagerInstance) {
    soundManagerInstance = new SoundManager();
    await soundManagerInstance.initialize();
  }
  return soundManagerInstance;
}

export function getSoundManager(): SoundManager | null {
  return soundManagerInstance;
}





