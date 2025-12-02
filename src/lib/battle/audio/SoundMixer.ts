/**
 * SoundMixer - 오디오 믹서 시스템
 * 
 * 기능:
 * - 카테고리별 볼륨 제어
 * - 마스터 볼륨
 * - 음소거 토글
 * - 설정 저장/로드 (localStorage)
 * - 동적 덕킹 (음악 볼륨 자동 조절)
 */

// ========================================
// 타입 정의
// ========================================

/** 사운드 카테고리 */
export type SoundCategory = 
  | 'music'    // 배경 음악
  | 'ambient'  // 환경음
  | 'combat'   // 전투 효과음
  | 'ui'       // UI 효과음
  | 'voice';   // 음성 (선택)

/** 믹서 설정 */
export interface MixerSettings {
  masterVolume: number;
  categoryVolumes: Record<SoundCategory, number>;
  muted: boolean;
  categoryMuted: Record<SoundCategory, boolean>;
}

/** 덕킹 설정 */
export interface DuckingConfig {
  /** 덕킹 활성화 */
  enabled: boolean;
  /** 덕킹 대상 카테고리 */
  targetCategory: SoundCategory;
  /** 덕킹 트리거 카테고리 */
  triggerCategory: SoundCategory;
  /** 덕킹 볼륨 비율 (0-1) */
  duckRatio: number;
  /** 덕킹 전환 시간 (초) */
  transitionTime: number;
}

// ========================================
// 기본 설정
// ========================================

const DEFAULT_SETTINGS: MixerSettings = {
  masterVolume: 1.0,
  categoryVolumes: {
    music: 0.6,
    ambient: 0.5,
    combat: 0.8,
    ui: 0.7,
    voice: 0.9,
  },
  muted: false,
  categoryMuted: {
    music: false,
    ambient: false,
    combat: false,
    ui: false,
    voice: false,
  },
};

const STORAGE_KEY = 'voxel-battle-sound-settings';

// ========================================
// SoundMixer 클래스
// ========================================

export class SoundMixer {
  private audioContext: AudioContext;
  
  // 마스터 게인 노드
  private masterGain: GainNode;
  
  // 카테고리별 게인 노드
  private categoryGains: Map<SoundCategory, GainNode> = new Map();
  
  // 현재 설정
  private settings: MixerSettings;
  
  // 덕킹 상태
  private duckingActive = false;
  private duckingConfig: DuckingConfig | null = null;
  private preDuckVolume = 0;

  constructor(audioContext: AudioContext) {
    this.audioContext = audioContext;
    
    // 설정 로드
    this.settings = this.loadSettings();
    
    // 오디오 그래프 초기화
    this.initializeAudioGraph();
  }

  // ========================================
  // 초기화
  // ========================================

  /**
   * 오디오 그래프 초기화
   */
  private initializeAudioGraph(): void {
    // 마스터 게인 노드 생성
    this.masterGain = this.audioContext.createGain();
    this.masterGain.gain.value = this.settings.muted ? 0 : this.settings.masterVolume;
    this.masterGain.connect(this.audioContext.destination);

    // 카테고리별 게인 노드 생성
    const categories: SoundCategory[] = ['music', 'ambient', 'combat', 'ui', 'voice'];
    
    for (const category of categories) {
      const gainNode = this.audioContext.createGain();
      const volume = this.settings.categoryMuted[category] 
        ? 0 
        : this.settings.categoryVolumes[category];
      gainNode.gain.value = volume;
      gainNode.connect(this.masterGain);
      this.categoryGains.set(category, gainNode);
    }
  }

  // ========================================
  // 게인 노드 접근
  // ========================================

  /**
   * 카테고리별 게인 노드 반환
   */
  getGainNode(category: SoundCategory): GainNode {
    const node = this.categoryGains.get(category);
    if (!node) {
      // 존재하지 않으면 새로 생성
      const newNode = this.audioContext.createGain();
      newNode.gain.value = this.settings.categoryVolumes[category] ?? 0.5;
      newNode.connect(this.masterGain);
      this.categoryGains.set(category, newNode);
      return newNode;
    }
    return node;
  }

  /**
   * 마스터 게인 노드 반환
   */
  getMasterGainNode(): GainNode {
    return this.masterGain;
  }

  // ========================================
  // 볼륨 제어
  // ========================================

  /**
   * 마스터 볼륨 설정
   */
  setMasterVolume(volume: number): void {
    this.settings.masterVolume = Math.max(0, Math.min(1, volume));
    
    if (!this.settings.muted) {
      this.masterGain.gain.setValueAtTime(
        this.settings.masterVolume,
        this.audioContext.currentTime
      );
    }
    
    this.saveSettings();
  }

  /**
   * 마스터 볼륨 조회
   */
  getMasterVolume(): number {
    return this.settings.masterVolume;
  }

  /**
   * 카테고리별 볼륨 설정
   */
  setVolume(category: SoundCategory, volume: number): void {
    this.settings.categoryVolumes[category] = Math.max(0, Math.min(1, volume));
    
    const gainNode = this.categoryGains.get(category);
    if (gainNode && !this.settings.categoryMuted[category]) {
      gainNode.gain.setValueAtTime(
        this.settings.categoryVolumes[category],
        this.audioContext.currentTime
      );
    }
    
    this.saveSettings();
  }

  /**
   * 카테고리별 볼륨 조회
   */
  getVolume(category: SoundCategory): number {
    return this.settings.categoryVolumes[category];
  }

  /**
   * 모든 카테고리 볼륨 조회
   */
  getAllVolumes(): Record<SoundCategory, number> {
    return { ...this.settings.categoryVolumes };
  }

  // ========================================
  // 음소거 제어
  // ========================================

  /**
   * 마스터 음소거 토글
   */
  toggleMute(): boolean {
    this.settings.muted = !this.settings.muted;
    
    const targetVolume = this.settings.muted ? 0 : this.settings.masterVolume;
    this.masterGain.gain.setValueAtTime(targetVolume, this.audioContext.currentTime);
    
    this.saveSettings();
    return this.settings.muted;
  }

  /**
   * 마스터 음소거 설정
   */
  setMuted(muted: boolean): void {
    this.settings.muted = muted;
    
    const targetVolume = muted ? 0 : this.settings.masterVolume;
    this.masterGain.gain.setValueAtTime(targetVolume, this.audioContext.currentTime);
    
    this.saveSettings();
  }

  /**
   * 마스터 음소거 상태 조회
   */
  isMuted(): boolean {
    return this.settings.muted;
  }

  /**
   * 카테고리별 음소거 토글
   */
  toggleCategoryMute(category: SoundCategory): boolean {
    this.settings.categoryMuted[category] = !this.settings.categoryMuted[category];
    
    const gainNode = this.categoryGains.get(category);
    if (gainNode) {
      const targetVolume = this.settings.categoryMuted[category] 
        ? 0 
        : this.settings.categoryVolumes[category];
      gainNode.gain.setValueAtTime(targetVolume, this.audioContext.currentTime);
    }
    
    this.saveSettings();
    return this.settings.categoryMuted[category];
  }

  /**
   * 카테고리별 음소거 설정
   */
  setCategoryMuted(category: SoundCategory, muted: boolean): void {
    this.settings.categoryMuted[category] = muted;
    
    const gainNode = this.categoryGains.get(category);
    if (gainNode) {
      const targetVolume = muted ? 0 : this.settings.categoryVolumes[category];
      gainNode.gain.setValueAtTime(targetVolume, this.audioContext.currentTime);
    }
    
    this.saveSettings();
  }

  /**
   * 카테고리별 음소거 상태 조회
   */
  isCategoryMuted(category: SoundCategory): boolean {
    return this.settings.categoryMuted[category];
  }

  // ========================================
  // 페이드 효과
  // ========================================

  /**
   * 마스터 볼륨 페이드
   */
  fadeMasterVolume(targetVolume: number, duration: number): void {
    const clampedVolume = Math.max(0, Math.min(1, targetVolume));
    const currentTime = this.audioContext.currentTime;
    
    this.masterGain.gain.setValueAtTime(
      this.masterGain.gain.value,
      currentTime
    );
    this.masterGain.gain.linearRampToValueAtTime(
      this.settings.muted ? 0 : clampedVolume,
      currentTime + duration
    );
    
    this.settings.masterVolume = clampedVolume;
    this.saveSettings();
  }

  /**
   * 카테고리 볼륨 페이드
   */
  fadeCategoryVolume(category: SoundCategory, targetVolume: number, duration: number): void {
    const gainNode = this.categoryGains.get(category);
    if (!gainNode) return;

    const clampedVolume = Math.max(0, Math.min(1, targetVolume));
    const currentTime = this.audioContext.currentTime;
    
    gainNode.gain.setValueAtTime(gainNode.gain.value, currentTime);
    gainNode.gain.linearRampToValueAtTime(
      this.settings.categoryMuted[category] ? 0 : clampedVolume,
      currentTime + duration
    );
    
    this.settings.categoryVolumes[category] = clampedVolume;
    this.saveSettings();
  }

  // ========================================
  // 덕킹 (Ducking)
  // ========================================

  /**
   * 덕킹 활성화 (예: 전투 시 음악 볼륨 낮추기)
   */
  startDucking(config: DuckingConfig): void {
    if (!config.enabled || this.duckingActive) return;

    this.duckingConfig = config;
    this.duckingActive = true;

    const targetGain = this.categoryGains.get(config.targetCategory);
    if (!targetGain) return;

    this.preDuckVolume = this.settings.categoryVolumes[config.targetCategory];
    const duckedVolume = this.preDuckVolume * config.duckRatio;

    const currentTime = this.audioContext.currentTime;
    targetGain.gain.setValueAtTime(targetGain.gain.value, currentTime);
    targetGain.gain.linearRampToValueAtTime(duckedVolume, currentTime + config.transitionTime);
  }

  /**
   * 덕킹 해제
   */
  stopDucking(): void {
    if (!this.duckingActive || !this.duckingConfig) return;

    const targetGain = this.categoryGains.get(this.duckingConfig.targetCategory);
    if (!targetGain) return;

    const currentTime = this.audioContext.currentTime;
    targetGain.gain.setValueAtTime(targetGain.gain.value, currentTime);
    targetGain.gain.linearRampToValueAtTime(
      this.preDuckVolume,
      currentTime + this.duckingConfig.transitionTime
    );

    this.duckingActive = false;
    this.duckingConfig = null;
  }

  /**
   * 전투 중 음악 덕킹 (편의 메서드)
   */
  duckMusicForCombat(enabled: boolean): void {
    if (enabled) {
      this.startDucking({
        enabled: true,
        targetCategory: 'music',
        triggerCategory: 'combat',
        duckRatio: 0.4,
        transitionTime: 0.5,
      });
    } else {
      this.stopDucking();
    }
  }

  // ========================================
  // 설정 저장/로드
  // ========================================

  /**
   * 설정 저장 (localStorage)
   */
  private saveSettings(): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.settings));
      }
    } catch (error) {
      console.warn('Failed to save sound settings:', error);
    }
  }

  /**
   * 설정 로드 (localStorage)
   */
  private loadSettings(): MixerSettings {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          // 기본값과 병합 (새 카테고리 추가 대비)
          return {
            ...DEFAULT_SETTINGS,
            ...parsed,
            categoryVolumes: {
              ...DEFAULT_SETTINGS.categoryVolumes,
              ...parsed.categoryVolumes,
            },
            categoryMuted: {
              ...DEFAULT_SETTINGS.categoryMuted,
              ...parsed.categoryMuted,
            },
          };
        }
      }
    } catch (error) {
      console.warn('Failed to load sound settings:', error);
    }
    return { ...DEFAULT_SETTINGS };
  }

  /**
   * 설정 초기화
   */
  resetSettings(): void {
    this.settings = { ...DEFAULT_SETTINGS };
    
    // 모든 노드에 적용
    this.masterGain.gain.setValueAtTime(
      this.settings.masterVolume,
      this.audioContext.currentTime
    );
    
    for (const [category, gainNode] of this.categoryGains) {
      gainNode.gain.setValueAtTime(
        this.settings.categoryVolumes[category],
        this.audioContext.currentTime
      );
    }
    
    this.saveSettings();
  }

  /**
   * 현재 설정 반환
   */
  getSettings(): MixerSettings {
    return { ...this.settings };
  }

  /**
   * 설정 직접 적용
   */
  applySettings(settings: Partial<MixerSettings>): void {
    if (settings.masterVolume !== undefined) {
      this.setMasterVolume(settings.masterVolume);
    }
    
    if (settings.muted !== undefined) {
      this.setMuted(settings.muted);
    }
    
    if (settings.categoryVolumes) {
      for (const [category, volume] of Object.entries(settings.categoryVolumes)) {
        this.setVolume(category as SoundCategory, volume);
      }
    }
    
    if (settings.categoryMuted) {
      for (const [category, muted] of Object.entries(settings.categoryMuted)) {
        this.setCategoryMuted(category as SoundCategory, muted);
      }
    }
  }

  // ========================================
  // 프리셋
  // ========================================

  /**
   * 배경 음악 중심 프리셋
   */
  applyMusicFocusPreset(): void {
    this.setVolume('music', 0.8);
    this.setVolume('ambient', 0.3);
    this.setVolume('combat', 0.5);
    this.setVolume('ui', 0.6);
  }

  /**
   * 전투 중심 프리셋
   */
  applyCombatFocusPreset(): void {
    this.setVolume('music', 0.4);
    this.setVolume('ambient', 0.2);
    this.setVolume('combat', 1.0);
    this.setVolume('ui', 0.5);
  }

  /**
   * 균형 프리셋
   */
  applyBalancedPreset(): void {
    this.setVolume('music', 0.6);
    this.setVolume('ambient', 0.5);
    this.setVolume('combat', 0.8);
    this.setVolume('ui', 0.7);
  }

  /**
   * 조용한 프리셋
   */
  applyQuietPreset(): void {
    this.setVolume('music', 0.3);
    this.setVolume('ambient', 0.2);
    this.setVolume('combat', 0.4);
    this.setVolume('ui', 0.4);
  }

  // ========================================
  // 정리
  // ========================================

  /**
   * 리소스 정리
   */
  dispose(): void {
    this.stopDucking();
    
    // 모든 게인 노드 연결 해제
    for (const gainNode of this.categoryGains.values()) {
      gainNode.disconnect();
    }
    this.categoryGains.clear();
    
    this.masterGain.disconnect();
  }
}

export default SoundMixer;





