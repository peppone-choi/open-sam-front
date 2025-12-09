/**
 * LOGH 사운드 매니저
 * 
 * 배경음악(BGM) + 효과음(SFX) 관리
 */

export type BGMCategory = 'battle' | 'quiet' | 'sad' | 'trouble' | 'upbeat' | 'opening';
export type SFXCategory = 'weapon' | 'voice' | 'ready' | 'ui';

interface SoundConfig {
  volume: number;
  loop: boolean;
}

class SoundManager {
  private audioContext: AudioContext | null = null;
  private bgmGainNode: GainNode | null = null;
  private sfxGainNode: GainNode | null = null;
  
  private currentBGM: HTMLAudioElement | null = null;
  private bgmVolume = 0.5;
  private sfxVolume = 0.7;
  private isMuted = false;
  
  private audioCache: Map<string, AudioBuffer> = new Map();
  private basePath = '/assets/logh/sounds';
  
  // BGM 트랙 목록
  private bgmTracks: Record<BGMCategory, string[]> = {
    battle: [
      'loghBATTLE01.ogg', 'loghBATTLE02.ogg', 'loghBATTLE03.ogg',
      'loghBATTLE04.ogg', 'loghBATTLE05.ogg', 'loghBATTLE06.ogg',
      'loghBATTLE07.ogg', 'loghBATTLE08.ogg', 'loghBATTLE09.ogg', 'loghBATTLE10.ogg',
    ],
    quiet: [
      'loghQUIET01.ogg', 'loghQUIET02.ogg', 'loghQUIET03.ogg',
      'loghQUIET04.ogg', 'loghQUIET05.ogg', 'loghQUIET06.ogg',
      'loghQUIET07.ogg', 'loghQUIET08.ogg', 'loghQUIET09.ogg', 'loghQUIET10.ogg',
    ],
    sad: ['loghSAD01.ogg', 'loghSAD02.ogg', 'loghSAD03.ogg'],
    trouble: ['loghTROUBLE01.ogg', 'loghTROUBLE02.ogg', 'loghTROUBLE03.ogg', 
              'loghTROUBLE04.ogg', 'loghTROUBLE05.ogg'],
    upbeat: ['loghUPBEAT01.ogg', 'loghUPBEAT02.ogg', 'loghUPBEAT03.ogg',
             'loghUPBEAT04.ogg', 'loghUPBEAT05.ogg'],
    opening: ['Empire Opening.ogg', 'FPA Opening.ogg'],
  };
  
  // 효과음 목록
  private sfxTracks: Record<string, string> = {
    // 무기
    'weapon.beamHeavy': 'Weapon_Beam_Heavy.ogg',
    'weapon.beamMedium': 'Weapon_Beam_Medium.ogg',
    'weapon.beamLight': 'Weapon_Beam_Light.ogg',
    'weapon.beamVeryLight': 'Weapon_Beam_VeryLight.ogg',
    'weapon.thorhammer': 'Effect_Thorhammer_Activate.ogg',
    
    // 음성
    'voice.attackConfirmed': 'gAttackConfirmed.ogg',
    'voice.attacking': 'gAttacking.ogg',
    'voice.generalOrder': 'gGeneralOrder.ogg',
    'voice.unitSelect': 'gUnitSelect.ogg',
    'voice.warpdrive': 'gWarpdrive.ogg',
    'voice.underAttack': 'gUnderAttack01.ogg',
    'voice.flagshipDamaged': 'gFlagshipDamaged.ogg',
    'voice.flagshipDestroyed': 'gFlagshipDestroyed.ogg',
    'voice.enemySpotted': 'gEnemySpotted.ogg',
    
    // 함선 준비
    'ready.battleship': 'gBSready.ogg',
    'ready.carrier': 'gCarrierReady.ogg',
    'ready.cruiser': 'gCruiserReady.ogg',
    'ready.destroyer': 'gDestroyerReady.ogg',
    'ready.flagship': 'gFlagshipReady.ogg',
    'ready.scout': 'gScoutReady.ogg',
    'ready.construction': 'gConstructionComplete.ogg',
    'ready.research': 'gResearchComplete.ogg',
    
    // UI
    'ui.hover': 'ButtonHover.ogg',
    'ui.klaxon': 'Klaxon.ogg',
    'ui.alarm': 'Effect_Alarm_0.ogg',
    'ui.beep': 'Effect_Beep_0.ogg',
    'ui.ping': 'Effect_Ping_0.ogg',
  };
  
  constructor() {
    // 브라우저에서만 초기화
    if (typeof window !== 'undefined') {
      this.initAudioContext();
    }
  }
  
  private initAudioContext(): void {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      this.bgmGainNode = this.audioContext.createGain();
      this.bgmGainNode.gain.value = this.bgmVolume;
      this.bgmGainNode.connect(this.audioContext.destination);
      
      this.sfxGainNode = this.audioContext.createGain();
      this.sfxGainNode.gain.value = this.sfxVolume;
      this.sfxGainNode.connect(this.audioContext.destination);
    } catch (error) {
      console.error('Failed to initialize AudioContext:', error);
    }
  }
  
  /**
   * 사용자 인터랙션 후 오디오 컨텍스트 재개
   */
  async resume(): Promise<void> {
    if (this.audioContext?.state === 'suspended') {
      await this.audioContext.resume();
    }
  }
  
  /**
   * 에셋 기본 경로 설정
   */
  setBasePath(path: string): void {
    this.basePath = path;
  }
  
  /**
   * BGM 볼륨 설정 (0-1)
   */
  setBGMVolume(volume: number): void {
    this.bgmVolume = Math.max(0, Math.min(1, volume));
    if (this.currentBGM) {
      this.currentBGM.volume = this.isMuted ? 0 : this.bgmVolume;
    }
  }
  
  /**
   * SFX 볼륨 설정 (0-1)
   */
  setSFXVolume(volume: number): void {
    this.sfxVolume = Math.max(0, Math.min(1, volume));
    if (this.sfxGainNode) {
      this.sfxGainNode.gain.value = this.isMuted ? 0 : this.sfxVolume;
    }
  }
  
  /**
   * 음소거 토글
   */
  toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    
    if (this.currentBGM) {
      this.currentBGM.volume = this.isMuted ? 0 : this.bgmVolume;
    }
    if (this.sfxGainNode) {
      this.sfxGainNode.gain.value = this.isMuted ? 0 : this.sfxVolume;
    }
    
    return this.isMuted;
  }
  
  /**
   * BGM 재생
   */
  async playBGM(category: BGMCategory, trackIndex?: number): Promise<void> {
    const tracks = this.bgmTracks[category];
    if (!tracks || tracks.length === 0) return;
    
    // 기존 BGM 정지
    this.stopBGM();
    
    // 트랙 선택 (지정하지 않으면 랜덤)
    const index = trackIndex ?? Math.floor(Math.random() * tracks.length);
    const trackName = tracks[index % tracks.length];
    const url = `${this.basePath}/${trackName}`;
    
    try {
      this.currentBGM = new Audio(url);
      this.currentBGM.volume = this.isMuted ? 0 : this.bgmVolume;
      this.currentBGM.loop = true;
      
      // 트랙 종료 시 다음 트랙 재생
      this.currentBGM.onended = () => {
        if (!this.currentBGM?.loop) {
          this.playBGM(category, (index + 1) % tracks.length);
        }
      };
      
      await this.currentBGM.play();
    } catch (error) {
      console.error('Failed to play BGM:', error);
    }
  }
  
  /**
   * BGM 재생 (진영별 오프닝)
   */
  async playOpeningBGM(faction: 'empire' | 'alliance'): Promise<void> {
    const trackName = faction === 'empire' ? 'Empire Opening.ogg' : 'FPA Opening.ogg';
    const url = `${this.basePath}/${trackName}`;
    
    this.stopBGM();
    
    try {
      this.currentBGM = new Audio(url);
      this.currentBGM.volume = this.isMuted ? 0 : this.bgmVolume;
      this.currentBGM.loop = false;
      await this.currentBGM.play();
    } catch (error) {
      console.error('Failed to play opening BGM:', error);
    }
  }
  
  /**
   * BGM 정지
   */
  stopBGM(): void {
    if (this.currentBGM) {
      this.currentBGM.pause();
      this.currentBGM.currentTime = 0;
      this.currentBGM = null;
    }
  }
  
  /**
   * BGM 페이드 아웃
   */
  async fadeOutBGM(duration: number = 1000): Promise<void> {
    if (!this.currentBGM) return;
    
    const startVolume = this.currentBGM.volume;
    const steps = 20;
    const stepDuration = duration / steps;
    const volumeStep = startVolume / steps;
    
    for (let i = 0; i < steps; i++) {
      await new Promise(resolve => setTimeout(resolve, stepDuration));
      if (this.currentBGM) {
        this.currentBGM.volume = Math.max(0, startVolume - volumeStep * (i + 1));
      }
    }
    
    this.stopBGM();
  }
  
  /**
   * 효과음 재생
   */
  async playSFX(sfxKey: string, volume?: number): Promise<void> {
    const trackName = this.sfxTracks[sfxKey];
    if (!trackName) {
      console.warn(`Unknown SFX: ${sfxKey}`);
      return;
    }
    
    const url = `${this.basePath}/${trackName}`;
    
    try {
      const audio = new Audio(url);
      audio.volume = (volume ?? 1) * (this.isMuted ? 0 : this.sfxVolume);
      await audio.play();
    } catch (error) {
      console.error('Failed to play SFX:', error);
    }
  }
  
  /**
   * 무기 효과음 재생
   */
  async playWeaponSound(type: 'heavy' | 'medium' | 'light' | 'veryLight' | 'thorhammer'): Promise<void> {
    const sfxKey = type === 'thorhammer' ? 'weapon.thorhammer' : `weapon.beam${type.charAt(0).toUpperCase() + type.slice(1)}`;
    await this.playSFX(sfxKey);
  }
  
  /**
   * 음성 재생
   */
  async playVoice(type: string): Promise<void> {
    await this.playSFX(`voice.${type}`);
  }
  
  /**
   * 함선 준비 완료 음성
   */
  async playReadySound(shipType: 'battleship' | 'carrier' | 'cruiser' | 'destroyer' | 'flagship' | 'scout'): Promise<void> {
    await this.playSFX(`ready.${shipType}`);
  }
  
  /**
   * 랜덤 유닛 선택 음성
   */
  async playUnitSelectSound(): Promise<void> {
    const sounds = ['gUnitSelect.ogg', 'gUnitSelect2.ogg', 'gUnitSelect3.ogg'];
    const url = `${this.basePath}/${sounds[Math.floor(Math.random() * sounds.length)]}`;
    
    try {
      const audio = new Audio(url);
      audio.volume = this.isMuted ? 0 : this.sfxVolume;
      await audio.play();
    } catch (error) {
      console.error('Failed to play unit select sound:', error);
    }
  }
  
  /**
   * 오디오 버퍼 사전 로드
   */
  async preloadSFX(sfxKeys: string[]): Promise<void> {
    if (!this.audioContext) return;
    
    const loadPromises = sfxKeys.map(async (key) => {
      const trackName = this.sfxTracks[key];
      if (!trackName || this.audioCache.has(key)) return;
      
      try {
        const response = await fetch(`${this.basePath}/${trackName}`);
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await this.audioContext!.decodeAudioData(arrayBuffer);
        this.audioCache.set(key, audioBuffer);
      } catch (error) {
        console.error(`Failed to preload ${key}:`, error);
      }
    });
    
    await Promise.all(loadPromises);
  }
  
  /**
   * 현재 상태 반환
   */
  getStatus(): { bgmVolume: number; sfxVolume: number; isMuted: boolean; isPlaying: boolean } {
    return {
      bgmVolume: this.bgmVolume,
      sfxVolume: this.sfxVolume,
      isMuted: this.isMuted,
      isPlaying: this.currentBGM !== null && !this.currentBGM.paused,
    };
  }
}

// 싱글톤 인스턴스
export const soundManager = new SoundManager();
export default soundManager;









