/**
 * SoundManager - 전투 사운드 시스템 메인 매니저
 * 
 * Web Audio API 기반 고성능 사운드 시스템
 * - 모듈화된 아키텍처 (MusicPlayer, SoundEffects, SpatialAudio, SoundMixer)
 * - 전투 이벤트 연동
 * - 절차적 사운드 생성
 */

import { MusicPlayer, MusicTrack } from './MusicPlayer';
import { SoundEffects, SFXType } from './SoundEffects';
import { SpatialAudio, SpatialConfig } from './SpatialAudio';
import { SoundMixer, SoundCategory } from './SoundMixer';
import type { BattleEvent } from '../types/BattleTypes';

// ========================================
// 타입 정의
// ========================================

/** 전투 페이즈 */
export type BattlePhase = 
  | 'preparation'  // 준비
  | 'deployment'   // 배치
  | 'battle'       // 전투 중
  | 'victory'      // 승리
  | 'defeat'       // 패배
  | 'draw';        // 무승부

/** 사운드 매니저 설정 */
export interface SoundManagerConfig {
  masterVolume?: number;
  musicVolume?: number;
  sfxVolume?: number;
  ambientVolume?: number;
  uiVolume?: number;
  spatialEnabled?: boolean;
  autoPlayMusic?: boolean;
}

/** 사운드 매니저 상태 */
export interface SoundManagerState {
  initialized: boolean;
  suspended: boolean;
  currentPhase: BattlePhase;
  muted: boolean;
  metrics: SoundMetrics;
}

/** 사운드 메트릭 */
export interface SoundMetrics {
  activeSounds: number;
  totalPlayed: number;
  currentMusicTrack: string | null;
  audioContextState: AudioContextState;
  lastEventTime: number;
}

// ========================================
// SoundManager 클래스
// ========================================

export class SoundManager {
  private audioContext: AudioContext | null = null;
  
  // 서브 모듈
  private musicPlayer: MusicPlayer | null = null;
  private soundEffects: SoundEffects | null = null;
  private spatialAudio: SpatialAudio | null = null;
  private mixer: SoundMixer | null = null;
  
  // 상태
  private initialized = false;
  private currentPhase: BattlePhase = 'preparation';
  private config: Required<SoundManagerConfig>;
  
  // 이벤트 쿨다운 (동일 이벤트 중복 방지)
  private eventCooldowns: Map<string, number> = new Map();
  private readonly DEFAULT_COOLDOWN = 50; // ms
  
  // 메트릭
  private metrics: SoundMetrics = {
    activeSounds: 0,
    totalPlayed: 0,
    currentMusicTrack: null,
    audioContextState: 'suspended',
    lastEventTime: 0,
  };

  constructor(config: SoundManagerConfig = {}) {
    this.config = {
      masterVolume: config.masterVolume ?? 1,
      musicVolume: config.musicVolume ?? 0.6,
      sfxVolume: config.sfxVolume ?? 0.8,
      ambientVolume: config.ambientVolume ?? 0.5,
      uiVolume: config.uiVolume ?? 0.7,
      spatialEnabled: config.spatialEnabled ?? true,
      autoPlayMusic: config.autoPlayMusic ?? true,
    };
  }

  // ========================================
  // 초기화
  // ========================================

  /**
   * 사운드 시스템 초기화 (사용자 상호작용 필요)
   */
  async initialize(): Promise<boolean> {
    if (this.initialized) return true;

    try {
      // AudioContext 생성
      this.audioContext = new (window.AudioContext || 
        (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();

      // 믹서 초기화 (가장 먼저)
      this.mixer = new SoundMixer(this.audioContext);
      this.mixer.setMasterVolume(this.config.masterVolume);
      this.mixer.setVolume('music', this.config.musicVolume);
      this.mixer.setVolume('combat', this.config.sfxVolume);
      this.mixer.setVolume('ambient', this.config.ambientVolume);
      this.mixer.setVolume('ui', this.config.uiVolume);

      // 서브 모듈 초기화
      this.musicPlayer = new MusicPlayer(this.audioContext, this.mixer.getGainNode('music'));
      this.soundEffects = new SoundEffects(this.audioContext, this.mixer.getGainNode('combat'));
      this.spatialAudio = new SpatialAudio(this.audioContext, this.mixer.getGainNode('combat'));

      // 절차적 사운드 생성
      await this.soundEffects.generateProceduralSounds();

      this.initialized = true;
      this.metrics.audioContextState = this.audioContext.state;
      
      console.log('🔊 SoundManager initialized successfully');
      return true;
    } catch (error) {
      console.error('Failed to initialize SoundManager:', error);
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
    }
  }

  /**
   * 외부 오디오 파일 프리로드
   */
  async preloadAudio(files: { id: string; url: string; category: SoundCategory }[]): Promise<void> {
    if (!this.initialized) await this.initialize();

    const loadPromises = files.map(async ({ id, url, category }) => {
      try {
        const response = await fetch(url);
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await this.audioContext!.decodeAudioData(arrayBuffer);
        
        if (category === 'music') {
          this.musicPlayer?.cacheBuffer(id, audioBuffer);
        } else {
          this.soundEffects?.cacheBuffer(id, audioBuffer);
        }
      } catch (error) {
        console.warn(`Failed to load audio: ${url}`, error);
      }
    });

    await Promise.all(loadPromises);
  }

  // ========================================
  // 전투 페이즈 전환
  // ========================================

  /**
   * 전투 페이즈에 따른 음악 전환
   */
  setPhase(phase: BattlePhase): void {
    if (this.currentPhase === phase) return;
    this.currentPhase = phase;

    if (!this.config.autoPlayMusic || !this.musicPlayer) return;

    switch (phase) {
      case 'preparation':
        this.musicPlayer.crossfadeTo('preparation', 2);
        break;
      case 'deployment':
        this.musicPlayer.crossfadeTo('tension', 1.5);
        break;
      case 'battle':
        this.musicPlayer.crossfadeTo('battle_intense', 1);
        break;
      case 'victory':
        this.musicPlayer.crossfadeTo('victory', 0.5);
        break;
      case 'defeat':
        this.musicPlayer.crossfadeTo('defeat', 0.5);
        break;
      case 'draw':
        this.musicPlayer.crossfadeTo('tension', 1);
        break;
    }
  }

  // ========================================
  // 전투 이벤트 핸들링
  // ========================================

  /**
   * 전투 이벤트에 따른 사운드 재생
   */
  onBattleEvent(event: BattleEvent): void {
    if (!this.initialized || !this.soundEffects) return;

    // 쿨다운 체크
    const eventKey = `${event.type}_${event.data?.sourceId || ''}`;
    const lastTime = this.eventCooldowns.get(eventKey) || 0;
    const now = Date.now();
    
    if (now - lastTime < this.DEFAULT_COOLDOWN) return;
    this.eventCooldowns.set(eventKey, now);

    // 3D 위치 추출
    const position = event.data?.position as { x: number; y: number; z: number } | undefined;

    switch (event.type) {
      case 'battle_started':
        this.playSFX('charge_horn', position);
        break;

      case 'unit_killed':
        this.playSFX('death_cry', position);
        break;

      case 'charge_started':
        this.playSFX('charge_horn', position);
        break;

      case 'charge_impact':
        this.playSFX('sword_clash', position);
        this.playSFX('shield_block', position);
        break;

      case 'squad_routed':
        this.playSFX('retreat_horn', position);
        break;

      case 'squad_rallied':
        this.playSFX('battle_cry', position);
        break;

      case 'morale_broken':
        this.playSFX('death_cry', position);
        break;

      case 'battle_ended':
        // 음악 전환은 setPhase에서 처리
        break;

      case 'ability_used':
        this.playSFX('special_ability', position);
        break;

      case 'flank_attack':
      case 'rear_attack':
        this.playSFX('sword_clash', position);
        break;
    }

    this.metrics.lastEventTime = now;
  }

  /**
   * 무기 타입에 따른 공격 사운드
   */
  playWeaponSound(weaponType: string, position?: { x: number; y: number; z: number }): void {
    if (!this.soundEffects) return;

    switch (weaponType) {
      case 'sword':
      case 'blade':
        this.playSFX('sword_clash', position);
        break;
      case 'spear':
      case 'lance':
        this.playSFX('spear_thrust', position);
        break;
      case 'bow':
        this.playSFX('arrow_shot', position);
        break;
      case 'crossbow':
        this.playSFX('crossbow_fire', position);
        break;
      case 'axe':
      case 'mace':
        this.playSFX('shield_block', position);
        break;
      default:
        this.playSFX('sword_clash', position);
    }
  }

  /**
   * 타격 사운드 (대상 타입에 따라)
   */
  playHitSound(targetType: string, position?: { x: number; y: number; z: number }): void {
    if (!this.soundEffects) return;

    switch (targetType) {
      case 'armor':
      case 'heavy':
        this.playSFX('armor_hit', position);
        break;
      case 'shield':
        this.playSFX('shield_block', position);
        break;
      default:
        this.playSFX('hit_flesh', position);
    }
  }

  /**
   * 유닛 타입에 따른 사망 사운드
   */
  playDeathSound(unitType: string, position?: { x: number; y: number; z: number }): void {
    this.playSFX('death_cry', position);
    
    // 기병이면 말 울음 추가
    if (unitType === 'cavalry') {
      setTimeout(() => this.playSFX('horse_neigh', position), 100);
    }
  }

  // ========================================
  // SFX 재생
  // ========================================

  /**
   * SFX 재생 (3D 위치 지원)
   */
  playSFX(
    type: SFXType, 
    position?: { x: number; y: number; z: number },
    options?: { volume?: number; pitch?: number }
  ): string | null {
    if (!this.soundEffects) return null;

    // 공간 오디오 사용
    if (position && this.config.spatialEnabled && this.spatialAudio) {
      return this.spatialAudio.playAt(type, position, options);
    }

    // 일반 재생
    return this.soundEffects.play(type, options);
  }

  /**
   * SFX 정지
   */
  stopSFX(id: string): void {
    this.soundEffects?.stop(id);
    this.spatialAudio?.stop(id);
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
   * 음악 일시정지/재개
   */
  pauseMusic(): void {
    this.musicPlayer?.pause();
  }

  resumeMusic(): void {
    this.musicPlayer?.resume();
  }

  // ========================================
  // 볼륨 제어
  // ========================================

  /**
   * 마스터 볼륨 설정
   */
  setMasterVolume(volume: number): void {
    this.config.masterVolume = Math.max(0, Math.min(1, volume));
    this.mixer?.setMasterVolume(this.config.masterVolume);
  }

  /**
   * 카테고리별 볼륨 설정
   */
  setVolume(category: SoundCategory, volume: number): void {
    this.mixer?.setVolume(category, volume);
    
    // 설정 동기화
    switch (category) {
      case 'music':
        this.config.musicVolume = volume;
        break;
      case 'combat':
        this.config.sfxVolume = volume;
        break;
      case 'ambient':
        this.config.ambientVolume = volume;
        break;
      case 'ui':
        this.config.uiVolume = volume;
        break;
    }
  }

  /**
   * 음소거 토글
   */
  toggleMute(): boolean {
    return this.mixer?.toggleMute() ?? false;
  }

  /**
   * 음소거 설정
   */
  setMuted(muted: boolean): void {
    this.mixer?.setMuted(muted);
  }

  // ========================================
  // 공간 오디오
  // ========================================

  /**
   * 리스너 위치 업데이트 (카메라)
   */
  updateListenerPosition(x: number, y: number, z: number): void {
    this.spatialAudio?.updateListenerPosition(x, y, z);
  }

  /**
   * 리스너 방향 업데이트
   */
  updateListenerOrientation(
    forwardX: number, forwardY: number, forwardZ: number,
    upX = 0, upY = 1, upZ = 0
  ): void {
    this.spatialAudio?.updateListenerOrientation(
      forwardX, forwardY, forwardZ,
      upX, upY, upZ
    );
  }

  // ========================================
  // UI 사운드
  // ========================================

  /**
   * UI 클릭 사운드
   */
  playUIClick(): void {
    this.playSFX('ui_click');
  }

  /**
   * UI 호버 사운드
   */
  playUIHover(): void {
    this.playSFX('ui_hover');
  }

  /**
   * 알림 사운드
   */
  playNotification(): void {
    this.playSFX('ui_notification');
  }

  // ========================================
  // 상태 및 메트릭
  // ========================================

  /**
   * 현재 상태 조회
   */
  getState(): SoundManagerState {
    return {
      initialized: this.initialized,
      suspended: this.audioContext?.state === 'suspended',
      currentPhase: this.currentPhase,
      muted: this.mixer?.isMuted() ?? false,
      metrics: this.getMetrics(),
    };
  }

  /**
   * 메트릭 조회
   */
  getMetrics(): SoundMetrics {
    this.metrics.activeSounds = 
      (this.soundEffects?.getActiveSoundCount() ?? 0) +
      (this.spatialAudio?.getActiveSoundCount() ?? 0);
    
    this.metrics.audioContextState = this.audioContext?.state ?? 'closed';
    
    return { ...this.metrics };
  }

  /**
   * 설정 조회
   */
  getConfig(): Required<SoundManagerConfig> {
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
    this.spatialAudio?.dispose();
    this.mixer?.dispose();

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    this.eventCooldowns.clear();
    this.initialized = false;
    
    console.log('🔊 SoundManager disposed');
  }
}

// ========================================
// 싱글톤 인스턴스
// ========================================

let soundManagerInstance: SoundManager | null = null;

/**
 * 사운드 매니저 초기화 및 반환
 */
export async function initSoundManager(config?: SoundManagerConfig): Promise<SoundManager> {
  if (!soundManagerInstance) {
    soundManagerInstance = new SoundManager(config);
    await soundManagerInstance.initialize();
  }
  return soundManagerInstance;
}

/**
 * 사운드 매니저 인스턴스 반환
 */
export function getSoundManager(): SoundManager | null {
  return soundManagerInstance;
}

/**
 * 사운드 매니저 정리
 */
export function disposeSoundManager(): void {
  soundManagerInstance?.dispose();
  soundManagerInstance = null;
}

export default SoundManager;





