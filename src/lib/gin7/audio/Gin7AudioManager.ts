/**
 * Gin7 AudioManager - 메인 오디오 매니저
 * 
 * 기능:
 * - WebAudio API 기반 오디오 시스템 총괄
 * - MusicPlayer, SoundEffects 통합 관리
 * - 볼륨 믹싱 및 설정
 * - 전투 이벤트 연동
 * - 3D 공간 오디오 지원
 */

import { Gin7MusicPlayer, type MusicCategory, GIN7_MUSIC_TRACKS } from './Gin7MusicPlayer';
import { Gin7SoundEffects, type Gin7SFXType, GIN7_SFX_DEFAULTS } from './Gin7SoundEffects';

// ========================================
// 타입 정의
// ========================================

/** 오디오 카테고리 */
export type AudioCategory = 'master' | 'music' | 'sfx' | 'ui' | 'ambient';

/** 오디오 매니저 설정 */
export interface Gin7AudioConfig {
  masterVolume?: number;
  musicVolume?: number;
  sfxVolume?: number;
  uiVolume?: number;
  ambientVolume?: number;
  spatialEnabled?: boolean;
  autoPlayMusic?: boolean;
}

/** 전투 페이즈 */
export type Gin7BattlePhase = 
  | 'none'
  | 'strategic'
  | 'tactical_calm'
  | 'tactical_tension'
  | 'tactical_battle'
  | 'victory'
  | 'defeat';

/** 오디오 매니저 상태 */
export interface Gin7AudioState {
  initialized: boolean;
  suspended: boolean;
  currentPhase: Gin7BattlePhase;
  muted: boolean;
  volumes: Record<AudioCategory, number>;
  metrics: Gin7AudioMetrics;
}

/** 오디오 메트릭 */
export interface Gin7AudioMetrics {
  activeSounds: number;
  totalPlayed: number;
  currentMusicTrack: string | null;
  audioContextState: AudioContextState;
  lastEventTime: number;
}

/** 3D 위치 */
export interface Position3D {
  x: number;
  y: number;
  z: number;
}

// ========================================
// Gin7AudioManager 클래스
// ========================================

export class Gin7AudioManager {
  private audioContext: AudioContext | null = null;
  
  // 게인 노드
  private masterGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private uiGain: GainNode | null = null;
  private ambientGain: GainNode | null = null;
  
  // 서브 모듈
  private musicPlayer: Gin7MusicPlayer | null = null;
  private soundEffects: Gin7SoundEffects | null = null;
  
  // 3D 오디오
  private listener: AudioListener | null = null;
  private spatialEnabled = true;
  
  // 상태
  private initialized = false;
  private muted = false;
  private currentPhase: Gin7BattlePhase = 'none';
  private config: Required<Gin7AudioConfig>;
  
  // 이벤트 쿨다운
  private eventCooldowns: Map<string, number> = new Map();
  private readonly DEFAULT_COOLDOWN = 50;
  
  // 메트릭
  private metrics: Gin7AudioMetrics = {
    activeSounds: 0,
    totalPlayed: 0,
    currentMusicTrack: null,
    audioContextState: 'suspended',
    lastEventTime: 0,
  };

  constructor(config: Gin7AudioConfig = {}) {
    this.config = {
      masterVolume: config.masterVolume ?? 1,
      musicVolume: config.musicVolume ?? 0.6,
      sfxVolume: config.sfxVolume ?? 0.8,
      uiVolume: config.uiVolume ?? 0.7,
      ambientVolume: config.ambientVolume ?? 0.5,
      spatialEnabled: config.spatialEnabled ?? true,
      autoPlayMusic: config.autoPlayMusic ?? true,
    };
  }

  // ========================================
  // 초기화
  // ========================================

  /**
   * 오디오 시스템 초기화 (사용자 상호작용 필요)
   */
  async initialize(): Promise<boolean> {
    if (this.initialized) return true;

    try {
      // AudioContext 생성
      this.audioContext = new (window.AudioContext || 
        (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();

      // 게인 노드 생성
      this.masterGain = this.audioContext.createGain();
      this.musicGain = this.audioContext.createGain();
      this.sfxGain = this.audioContext.createGain();
      this.uiGain = this.audioContext.createGain();
      this.ambientGain = this.audioContext.createGain();

      // 연결: 각 카테고리 -> 마스터 -> destination
      this.musicGain.connect(this.masterGain);
      this.sfxGain.connect(this.masterGain);
      this.uiGain.connect(this.masterGain);
      this.ambientGain.connect(this.masterGain);
      this.masterGain.connect(this.audioContext.destination);

      // 초기 볼륨 설정
      this.masterGain.gain.value = this.config.masterVolume;
      this.musicGain.gain.value = this.config.musicVolume;
      this.sfxGain.gain.value = this.config.sfxVolume;
      this.uiGain.gain.value = this.config.uiVolume;
      this.ambientGain.gain.value = this.config.ambientVolume;

      // 3D 오디오 리스너
      this.listener = this.audioContext.listener;
      this.spatialEnabled = this.config.spatialEnabled;

      // 서브 모듈 초기화
      this.musicPlayer = new Gin7MusicPlayer(this.audioContext, this.musicGain);
      this.soundEffects = new Gin7SoundEffects(this.audioContext, this.sfxGain);

      // 절차적 사운드 생성
      await this.soundEffects.generateProceduralSounds();

      this.initialized = true;
      this.metrics.audioContextState = this.audioContext.state;
      
      console.log('🔊 [Gin7Audio] Initialized successfully');
      return true;
    } catch (error) {
      console.error('[Gin7Audio] Failed to initialize:', error);
      return false;
    }
  }

  /**
   * AudioContext 재개 (일시 중단된 경우)
   */
  async resume(): Promise<void> {
    if (this.audioContext?.state === 'suspended') {
      await this.audioContext.resume();
      this.metrics.audioContextState = this.audioContext.state;
      console.log('🔊 [Gin7Audio] Resumed');
    }
  }

  /**
   * 초기화 여부 확인
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  // ========================================
  // 전투 페이즈 전환
  // ========================================

  /**
   * 전투 페이즈 설정
   */
  setPhase(phase: Gin7BattlePhase): void {
    if (this.currentPhase === phase) return;
    this.currentPhase = phase;

    if (!this.config.autoPlayMusic || !this.musicPlayer) return;

    // 페이즈별 음악 전환
    const musicMap: Record<Gin7BattlePhase, string | null> = {
      none: null,
      strategic: 'strategic',
      tactical_calm: 'tactical_calm',
      tactical_tension: 'tactical_tension',
      tactical_battle: 'tactical_battle',
      victory: 'victory',
      defeat: 'defeat',
    };

    const trackId = musicMap[phase];
    if (trackId) {
      this.musicPlayer.crossfadeTo(trackId, phase === 'tactical_battle' ? 0.5 : 2);
    } else {
      this.musicPlayer.stop(2);
    }

    console.log(`🎵 [Gin7Audio] Phase changed: ${phase}`);
  }

  /**
   * 현재 페이즈 반환
   */
  getCurrentPhase(): Gin7BattlePhase {
    return this.currentPhase;
  }

  // ========================================
  // 전투 이벤트 핸들링
  // ========================================

  /**
   * 전투 이벤트에 따른 사운드 재생
   */
  onBattleEvent(event: { type: string; data?: Record<string, unknown> }): void {
    if (!this.initialized || !this.soundEffects) return;

    // 쿨다운 체크
    const sourceId = event.data?.sourceId as string | undefined;
    const eventKey = `${event.type}_${sourceId || ''}`;
    const lastTime = this.eventCooldowns.get(eventKey) || 0;
    const now = Date.now();
    
    if (now - lastTime < this.DEFAULT_COOLDOWN) return;
    this.eventCooldowns.set(eventKey, now);

    // 3D 위치 추출
    const position = event.data?.position as Position3D | undefined;

    // 이벤트 타입별 사운드 재생
    switch (event.type) {
      case 'BATTLE_START':
        this.playSFX('battle_start');
        break;
      case 'BATTLE_END':
        // 승패는 별도 처리
        break;
      case 'BEAM_FIRE':
        this.playSFX('beam_fire', position);
        break;
      case 'BEAM_CHARGE':
        this.playSFX('beam_charge', position);
        break;
      case 'MISSILE_LAUNCH':
        this.playSFX('missile_launch', position);
        break;
      case 'MISSILE_LOCK':
        this.playSFX('missile_lock');
        break;
      case 'RAILGUN_FIRE':
        this.playSFX('railgun_fire', position);
        break;
      case 'FIGHTER_LAUNCH':
        this.playSFX('fighter_launch', position);
        break;
      case 'SHIELD_HIT':
        this.playSFX('shield_hit', position);
        break;
      case 'SHIELD_BREAK':
        this.playSFX('shield_break', position);
        break;
      case 'ARMOR_HIT':
        this.playSFX('armor_hit', position);
        break;
      case 'HULL_BREACH':
        this.playSFX('hull_breach', position);
        break;
      case 'UNIT_DESTROYED':
        const size = event.data?.size as string;
        if (size === 'capital' || size === 'battleship') {
          this.playSFX('explosion_capital', position);
        } else if (size === 'large' || size === 'cruiser') {
          this.playSFX('explosion_large', position);
        } else if (size === 'medium' || size === 'destroyer') {
          this.playSFX('explosion_medium', position);
        } else {
          this.playSFX('explosion_small', position);
        }
        break;
      case 'WARP_IN':
        this.playSFX('warp_in', position);
        break;
      case 'WARP_OUT':
        this.playSFX('warp_out', position);
        break;
      case 'ENGINE_BOOST':
        this.playSFX('engine_boost', position);
        break;
      case 'UNIT_SELECT':
        this.playSFX('unit_select');
        break;
      case 'UNIT_ORDER':
        this.playSFX('unit_order');
        break;
    }

    this.metrics.lastEventTime = now;
    this.metrics.totalPlayed++;
  }

  // ========================================
  // SFX 재생
  // ========================================

  /**
   * 효과음 재생
   */
  playSFX(
    type: Gin7SFXType, 
    position?: Position3D,
    options?: { volume?: number; pitch?: number }
  ): string | null {
    if (!this.soundEffects) return null;
    
    // TODO: position이 있으면 3D 오디오 처리
    // 현재는 2D로만 재생
    
    return this.soundEffects.play(type, options);
  }

  /**
   * 효과음 정지
   */
  stopSFX(id: string): void {
    this.soundEffects?.stop(id);
  }

  /**
   * 모든 효과음 정지
   */
  stopAllSFX(): void {
    this.soundEffects?.stopAll();
  }

  // ========================================
  // 음악 제어
  // ========================================

  /**
   * 음악 재생
   */
  playMusic(trackId: string, fadeIn = 1): void {
    this.musicPlayer?.play(trackId, fadeIn);
    this.metrics.currentMusicTrack = trackId;
  }

  /**
   * 음악 정지
   */
  stopMusic(fadeOut = 1): void {
    this.musicPlayer?.stop(fadeOut);
    this.metrics.currentMusicTrack = null;
  }

  /**
   * 음악 크로스페이드
   */
  crossfadeMusic(trackId: string, duration = 2): void {
    this.musicPlayer?.crossfadeTo(trackId, duration);
    this.metrics.currentMusicTrack = trackId;
  }

  /**
   * 음악 일시정지
   */
  pauseMusic(): void {
    this.musicPlayer?.pause();
  }

  /**
   * 음악 재개
   */
  resumeMusic(): void {
    this.musicPlayer?.resume();
  }

  // ========================================
  // UI 사운드
  // ========================================

  /**
   * UI 클릭 사운드
   */
  playUIClick(): void {
    this.playSFXToUI('ui_click');
  }

  /**
   * UI 호버 사운드
   */
  playUIHover(): void {
    this.playSFXToUI('ui_hover');
  }

  /**
   * UI 알림 사운드
   */
  playUINotification(): void {
    this.playSFXToUI('ui_notification');
  }

  /**
   * UI 경고 사운드
   */
  playUIAlert(): void {
    this.playSFXToUI('ui_alert');
  }

  /**
   * UI 확인 사운드
   */
  playUIConfirm(): void {
    this.playSFXToUI('ui_confirm');
  }

  /**
   * UI 취소 사운드
   */
  playUICancel(): void {
    this.playSFXToUI('ui_cancel');
  }

  /**
   * UI 채널로 SFX 재생 (내부용)
   */
  private playSFXToUI(type: Gin7SFXType): void {
    // UI 사운드는 sfxGain 대신 uiGain 사용이 이상적이지만
    // 현재 구조에서는 sfxGain을 통해 재생
    this.soundEffects?.play(type);
  }

  // ========================================
  // 볼륨 제어
  // ========================================

  /**
   * 마스터 볼륨 설정
   */
  setMasterVolume(volume: number): void {
    this.config.masterVolume = Math.max(0, Math.min(1, volume));
    if (this.masterGain) {
      this.masterGain.gain.setValueAtTime(
        this.config.masterVolume, 
        this.audioContext?.currentTime ?? 0
      );
    }
  }

  /**
   * 카테고리별 볼륨 설정
   */
  setVolume(category: AudioCategory, volume: number): void {
    const normalizedVolume = Math.max(0, Math.min(1, volume));
    
    switch (category) {
      case 'master':
        this.setMasterVolume(normalizedVolume);
        break;
      case 'music':
        this.config.musicVolume = normalizedVolume;
        if (this.musicGain) {
          this.musicGain.gain.setValueAtTime(normalizedVolume, this.audioContext?.currentTime ?? 0);
        }
        break;
      case 'sfx':
        this.config.sfxVolume = normalizedVolume;
        if (this.sfxGain) {
          this.sfxGain.gain.setValueAtTime(normalizedVolume, this.audioContext?.currentTime ?? 0);
        }
        break;
      case 'ui':
        this.config.uiVolume = normalizedVolume;
        if (this.uiGain) {
          this.uiGain.gain.setValueAtTime(normalizedVolume, this.audioContext?.currentTime ?? 0);
        }
        break;
      case 'ambient':
        this.config.ambientVolume = normalizedVolume;
        if (this.ambientGain) {
          this.ambientGain.gain.setValueAtTime(normalizedVolume, this.audioContext?.currentTime ?? 0);
        }
        break;
    }
  }

  /**
   * 볼륨 조회
   */
  getVolume(category: AudioCategory): number {
    switch (category) {
      case 'master': return this.config.masterVolume;
      case 'music': return this.config.musicVolume;
      case 'sfx': return this.config.sfxVolume;
      case 'ui': return this.config.uiVolume;
      case 'ambient': return this.config.ambientVolume;
      default: return 1;
    }
  }

  /**
   * 음소거 토글
   */
  toggleMute(): boolean {
    this.muted = !this.muted;
    if (this.masterGain) {
      this.masterGain.gain.setValueAtTime(
        this.muted ? 0 : this.config.masterVolume,
        this.audioContext?.currentTime ?? 0
      );
    }
    return this.muted;
  }

  /**
   * 음소거 설정
   */
  setMuted(muted: boolean): void {
    this.muted = muted;
    if (this.masterGain) {
      this.masterGain.gain.setValueAtTime(
        this.muted ? 0 : this.config.masterVolume,
        this.audioContext?.currentTime ?? 0
      );
    }
  }

  /**
   * 음소거 상태 조회
   */
  isMuted(): boolean {
    return this.muted;
  }

  // ========================================
  // 3D 오디오
  // ========================================

  /**
   * 리스너 위치 업데이트 (카메라)
   */
  updateListenerPosition(x: number, y: number, z: number): void {
    if (!this.listener || !this.spatialEnabled) return;
    
    if (this.listener.positionX) {
      this.listener.positionX.setValueAtTime(x, this.audioContext?.currentTime ?? 0);
      this.listener.positionY.setValueAtTime(y, this.audioContext?.currentTime ?? 0);
      this.listener.positionZ.setValueAtTime(z, this.audioContext?.currentTime ?? 0);
    }
  }

  /**
   * 리스너 방향 업데이트
   */
  updateListenerOrientation(
    forwardX: number, forwardY: number, forwardZ: number,
    upX = 0, upY = 1, upZ = 0
  ): void {
    if (!this.listener || !this.spatialEnabled) return;
    
    if (this.listener.forwardX) {
      this.listener.forwardX.setValueAtTime(forwardX, this.audioContext?.currentTime ?? 0);
      this.listener.forwardY.setValueAtTime(forwardY, this.audioContext?.currentTime ?? 0);
      this.listener.forwardZ.setValueAtTime(forwardZ, this.audioContext?.currentTime ?? 0);
      this.listener.upX.setValueAtTime(upX, this.audioContext?.currentTime ?? 0);
      this.listener.upY.setValueAtTime(upY, this.audioContext?.currentTime ?? 0);
      this.listener.upZ.setValueAtTime(upZ, this.audioContext?.currentTime ?? 0);
    }
  }

  // ========================================
  // 상태 및 메트릭
  // ========================================

  /**
   * 현재 상태 조회
   */
  getState(): Gin7AudioState {
    return {
      initialized: this.initialized,
      suspended: this.audioContext?.state === 'suspended',
      currentPhase: this.currentPhase,
      muted: this.muted,
      volumes: {
        master: this.config.masterVolume,
        music: this.config.musicVolume,
        sfx: this.config.sfxVolume,
        ui: this.config.uiVolume,
        ambient: this.config.ambientVolume,
      },
      metrics: this.getMetrics(),
    };
  }

  /**
   * 메트릭 조회
   */
  getMetrics(): Gin7AudioMetrics {
    this.metrics.activeSounds = this.soundEffects?.getActiveSoundCount() ?? 0;
    this.metrics.audioContextState = this.audioContext?.state ?? 'closed';
    this.metrics.currentMusicTrack = this.musicPlayer?.getCurrentTrack() ?? null;
    
    return { ...this.metrics };
  }

  /**
   * 설정 조회
   */
  getConfig(): Required<Gin7AudioConfig> {
    return { ...this.config };
  }

  // ========================================
  // 정리
  // ========================================

  /**
   * 리소스 정리
   */
  dispose(): void {
    this.musicPlayer?.dispose();
    this.soundEffects?.dispose();

    // 게인 노드 정리
    this.masterGain?.disconnect();
    this.musicGain?.disconnect();
    this.sfxGain?.disconnect();
    this.uiGain?.disconnect();
    this.ambientGain?.disconnect();

    // AudioContext 종료
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    this.eventCooldowns.clear();
    this.initialized = false;
    
    console.log('🔊 [Gin7Audio] Disposed');
  }
}

// ========================================
// 싱글톤 인스턴스
// ========================================

let audioManagerInstance: Gin7AudioManager | null = null;

/**
 * 오디오 매니저 초기화 및 반환
 */
export async function initGin7Audio(config?: Gin7AudioConfig): Promise<Gin7AudioManager> {
  if (!audioManagerInstance) {
    audioManagerInstance = new Gin7AudioManager(config);
    await audioManagerInstance.initialize();
  }
  return audioManagerInstance;
}

/**
 * 오디오 매니저 인스턴스 반환
 */
export function getGin7Audio(): Gin7AudioManager | null {
  return audioManagerInstance;
}

/**
 * 오디오 매니저 정리
 */
export function disposeGin7Audio(): void {
  audioManagerInstance?.dispose();
  audioManagerInstance = null;
}

export default Gin7AudioManager;








