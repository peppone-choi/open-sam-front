/**
 * Gin7 Audio & VFX Zustand Store
 * 
 * 오디오 및 VFX 시스템 상태 관리
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { 
  type Gin7AudioConfig, 
  type Gin7BattlePhase,
  type AudioCategory 
} from '@/lib/gin7/audio';
import { type VFXQuality } from '@/lib/gin7/vfx';

// ========================================
// 타입 정의
// ========================================

interface Gin7AudioVFXState {
  // 초기화 상태
  initialized: boolean;
  suspended: boolean;
  
  // 오디오 설정
  masterVolume: number;
  musicVolume: number;
  sfxVolume: number;
  uiVolume: number;
  ambientVolume: number;
  muted: boolean;
  
  // VFX 설정
  vfxQuality: VFXQuality;
  particlesEnabled: boolean;
  screenEffectsEnabled: boolean;
  
  // 현재 상태
  currentPhase: Gin7BattlePhase;
  currentMusicTrack: string | null;
  
  // 메트릭
  activeSounds: number;
  activeParticles: number;
}

interface Gin7AudioVFXActions {
  // 초기화
  setInitialized: (initialized: boolean) => void;
  setSuspended: (suspended: boolean) => void;
  
  // 볼륨 제어
  setMasterVolume: (volume: number) => void;
  setMusicVolume: (volume: number) => void;
  setSfxVolume: (volume: number) => void;
  setUiVolume: (volume: number) => void;
  setAmbientVolume: (volume: number) => void;
  setVolume: (category: AudioCategory, volume: number) => void;
  toggleMute: () => void;
  setMuted: (muted: boolean) => void;
  
  // VFX 설정
  setVfxQuality: (quality: VFXQuality) => void;
  setParticlesEnabled: (enabled: boolean) => void;
  setScreenEffectsEnabled: (enabled: boolean) => void;
  
  // 상태 업데이트
  setCurrentPhase: (phase: Gin7BattlePhase) => void;
  setCurrentMusicTrack: (track: string | null) => void;
  
  // 메트릭 업데이트
  updateMetrics: (metrics: { activeSounds?: number; activeParticles?: number }) => void;
  
  // 전체 설정 가져오기
  getAudioConfig: () => Gin7AudioConfig;
  
  // 리셋
  reset: () => void;
}

type Gin7AudioVFXStore = Gin7AudioVFXState & Gin7AudioVFXActions;

// ========================================
// 초기 상태
// ========================================

const initialState: Gin7AudioVFXState = {
  initialized: false,
  suspended: true,
  
  masterVolume: 1,
  musicVolume: 0.6,
  sfxVolume: 0.8,
  uiVolume: 0.7,
  ambientVolume: 0.5,
  muted: false,
  
  vfxQuality: 'medium',
  particlesEnabled: true,
  screenEffectsEnabled: true,
  
  currentPhase: 'none',
  currentMusicTrack: null,
  
  activeSounds: 0,
  activeParticles: 0,
};

// ========================================
// Store 생성
// ========================================

export const useGin7AudioStore = create<Gin7AudioVFXStore>()(
  persist(
    (set, get) => ({
      ...initialState,
      
      // 초기화
      setInitialized: (initialized) => set({ initialized }),
      setSuspended: (suspended) => set({ suspended }),
      
      // 볼륨 제어
      setMasterVolume: (volume) => set({ masterVolume: Math.max(0, Math.min(1, volume)) }),
      setMusicVolume: (volume) => set({ musicVolume: Math.max(0, Math.min(1, volume)) }),
      setSfxVolume: (volume) => set({ sfxVolume: Math.max(0, Math.min(1, volume)) }),
      setUiVolume: (volume) => set({ uiVolume: Math.max(0, Math.min(1, volume)) }),
      setAmbientVolume: (volume) => set({ ambientVolume: Math.max(0, Math.min(1, volume)) }),
      
      setVolume: (category, volume) => {
        const normalizedVolume = Math.max(0, Math.min(1, volume));
        switch (category) {
          case 'master':
            set({ masterVolume: normalizedVolume });
            break;
          case 'music':
            set({ musicVolume: normalizedVolume });
            break;
          case 'sfx':
            set({ sfxVolume: normalizedVolume });
            break;
          case 'ui':
            set({ uiVolume: normalizedVolume });
            break;
          case 'ambient':
            set({ ambientVolume: normalizedVolume });
            break;
        }
      },
      
      toggleMute: () => set((state) => ({ muted: !state.muted })),
      setMuted: (muted) => set({ muted }),
      
      // VFX 설정
      setVfxQuality: (quality) => set({ vfxQuality: quality }),
      setParticlesEnabled: (enabled) => set({ particlesEnabled: enabled }),
      setScreenEffectsEnabled: (enabled) => set({ screenEffectsEnabled: enabled }),
      
      // 상태 업데이트
      setCurrentPhase: (phase) => set({ currentPhase: phase }),
      setCurrentMusicTrack: (track) => set({ currentMusicTrack: track }),
      
      // 메트릭 업데이트
      updateMetrics: (metrics) => set((state) => ({
        activeSounds: metrics.activeSounds ?? state.activeSounds,
        activeParticles: metrics.activeParticles ?? state.activeParticles,
      })),
      
      // 전체 설정 가져오기
      getAudioConfig: () => {
        const state = get();
        return {
          masterVolume: state.masterVolume,
          musicVolume: state.musicVolume,
          sfxVolume: state.sfxVolume,
          uiVolume: state.uiVolume,
          ambientVolume: state.ambientVolume,
        };
      },
      
      // 리셋
      reset: () => set(initialState),
    }),
    {
      name: 'gin7-audio-vfx-settings',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        // 저장할 설정만 선택
        masterVolume: state.masterVolume,
        musicVolume: state.musicVolume,
        sfxVolume: state.sfxVolume,
        uiVolume: state.uiVolume,
        ambientVolume: state.ambientVolume,
        muted: state.muted,
        vfxQuality: state.vfxQuality,
        particlesEnabled: state.particlesEnabled,
        screenEffectsEnabled: state.screenEffectsEnabled,
      }),
    }
  )
);

// ========================================
// 셀렉터
// ========================================

/** 볼륨 설정만 선택 */
export const selectVolumeSettings = (state: Gin7AudioVFXStore) => ({
  masterVolume: state.masterVolume,
  musicVolume: state.musicVolume,
  sfxVolume: state.sfxVolume,
  uiVolume: state.uiVolume,
  ambientVolume: state.ambientVolume,
  muted: state.muted,
});

/** VFX 설정만 선택 */
export const selectVfxSettings = (state: Gin7AudioVFXStore) => ({
  vfxQuality: state.vfxQuality,
  particlesEnabled: state.particlesEnabled,
  screenEffectsEnabled: state.screenEffectsEnabled,
});

/** 현재 상태만 선택 */
export const selectCurrentState = (state: Gin7AudioVFXStore) => ({
  initialized: state.initialized,
  suspended: state.suspended,
  currentPhase: state.currentPhase,
  currentMusicTrack: state.currentMusicTrack,
});

/** 메트릭만 선택 */
export const selectMetrics = (state: Gin7AudioVFXStore) => ({
  activeSounds: state.activeSounds,
  activeParticles: state.activeParticles,
});

export default useGin7AudioStore;













