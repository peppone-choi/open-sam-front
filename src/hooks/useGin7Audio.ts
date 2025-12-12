/**
 * Gin7 Audio & VFX React Hooks
 * 
 * 오디오 및 VFX 시스템을 React에서 쉽게 사용하기 위한 훅
 */

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { 
  initGin7Audio, 
  getGin7Audio, 
  disposeGin7Audio,
  type Gin7AudioManager,
  type Gin7BattlePhase,
  type Gin7SFXType,
} from '@/lib/gin7/audio';
import {
  initGin7VFX,
  getGin7VFX,
  disposeGin7VFX,
  type Gin7VFXManager,
  type Position3D,
} from '@/lib/gin7/vfx';
import { useGin7AudioStore } from '@/stores/gin7AudioStore';

// ========================================
// useGin7Audio - 오디오 시스템 훅
// ========================================

export interface UseGin7AudioReturn {
  // 초기화
  initialized: boolean;
  suspended: boolean;
  initialize: () => Promise<boolean>;
  resume: () => Promise<void>;
  
  // 음악
  playMusic: (trackId: string, fadeIn?: number) => void;
  stopMusic: (fadeOut?: number) => void;
  crossfadeMusic: (trackId: string, duration?: number) => void;
  pauseMusic: () => void;
  resumeMusic: () => void;
  
  // 효과음
  playSFX: (type: Gin7SFXType, position?: Position3D) => string | null;
  stopSFX: (id: string) => void;
  stopAllSFX: () => void;
  
  // UI 사운드
  playUIClick: () => void;
  playUIHover: () => void;
  playUINotification: () => void;
  playUIAlert: () => void;
  playUIConfirm: () => void;
  playUICancel: () => void;
  
  // 페이즈
  setPhase: (phase: Gin7BattlePhase) => void;
  currentPhase: Gin7BattlePhase;
  
  // 볼륨
  masterVolume: number;
  musicVolume: number;
  sfxVolume: number;
  muted: boolean;
  setMasterVolume: (volume: number) => void;
  setMusicVolume: (volume: number) => void;
  setSfxVolume: (volume: number) => void;
  toggleMute: () => void;
  
  // 이벤트
  onBattleEvent: (event: { type: string; data?: Record<string, unknown> }) => void;
}

export function useGin7Audio(): UseGin7AudioReturn {
  const audioRef = useRef<Gin7AudioManager | null>(null);
  const [initialized, setInitialized] = useState(false);
  const [suspended, setSuspended] = useState(true);
  
  const store = useGin7AudioStore();

  // 초기화
  const initialize = useCallback(async () => {
    if (audioRef.current?.isInitialized()) return true;
    
    try {
      const audio = await initGin7Audio(store.getAudioConfig());
      audioRef.current = audio;
      
      // 스토어에서 설정 적용
      audio.setMasterVolume(store.masterVolume);
      audio.setVolume('music', store.musicVolume);
      audio.setVolume('sfx', store.sfxVolume);
      audio.setVolume('ui', store.uiVolume);
      audio.setMuted(store.muted);
      
      setInitialized(true);
      setSuspended(false);
      store.setInitialized(true);
      store.setSuspended(false);
      
      return true;
    } catch (error) {
      console.error('[useGin7Audio] Failed to initialize:', error);
      return false;
    }
  }, [store]);

  // Resume
  const resume = useCallback(async () => {
    if (!audioRef.current) return;
    await audioRef.current.resume();
    setSuspended(false);
    store.setSuspended(false);
  }, [store]);

  // 음악 제어
  const playMusic = useCallback((trackId: string, fadeIn = 1) => {
    audioRef.current?.playMusic(trackId, fadeIn);
    store.setCurrentMusicTrack(trackId);
  }, [store]);

  const stopMusic = useCallback((fadeOut = 1) => {
    audioRef.current?.stopMusic(fadeOut);
    store.setCurrentMusicTrack(null);
  }, [store]);

  const crossfadeMusic = useCallback((trackId: string, duration = 2) => {
    audioRef.current?.crossfadeMusic(trackId, duration);
    store.setCurrentMusicTrack(trackId);
  }, [store]);

  const pauseMusic = useCallback(() => {
    audioRef.current?.pauseMusic();
  }, []);

  const resumeMusic = useCallback(() => {
    audioRef.current?.resumeMusic();
  }, []);

  // 효과음
  const playSFX = useCallback((type: Gin7SFXType, position?: Position3D) => {
    return audioRef.current?.playSFX(type, position) ?? null;
  }, []);

  const stopSFX = useCallback((id: string) => {
    audioRef.current?.stopSFX(id);
  }, []);

  const stopAllSFX = useCallback(() => {
    audioRef.current?.stopAllSFX();
  }, []);

  // UI 사운드
  const playUIClick = useCallback(() => {
    audioRef.current?.playUIClick();
  }, []);

  const playUIHover = useCallback(() => {
    audioRef.current?.playUIHover();
  }, []);

  const playUINotification = useCallback(() => {
    audioRef.current?.playUINotification();
  }, []);

  const playUIAlert = useCallback(() => {
    audioRef.current?.playUIAlert();
  }, []);

  const playUIConfirm = useCallback(() => {
    audioRef.current?.playUIConfirm();
  }, []);

  const playUICancel = useCallback(() => {
    audioRef.current?.playUICancel();
  }, []);

  // 페이즈
  const setPhase = useCallback((phase: Gin7BattlePhase) => {
    audioRef.current?.setPhase(phase);
    store.setCurrentPhase(phase);
  }, [store]);

  // 볼륨
  const setMasterVolume = useCallback((volume: number) => {
    audioRef.current?.setMasterVolume(volume);
    store.setMasterVolume(volume);
  }, [store]);

  const setMusicVolume = useCallback((volume: number) => {
    audioRef.current?.setVolume('music', volume);
    store.setMusicVolume(volume);
  }, [store]);

  const setSfxVolume = useCallback((volume: number) => {
    audioRef.current?.setVolume('sfx', volume);
    store.setSfxVolume(volume);
  }, [store]);

  const toggleMute = useCallback(() => {
    const newMuted = audioRef.current?.toggleMute() ?? !store.muted;
    store.setMuted(newMuted);
  }, [store]);

  // 이벤트
  const onBattleEvent = useCallback((event: { type: string; data?: Record<string, unknown> }) => {
    audioRef.current?.onBattleEvent(event);
  }, []);

  // 정리
  useEffect(() => {
    return () => {
      // 컴포넌트 언마운트 시 정리하지 않음 (전역 싱글톤)
      // disposeGin7Audio();
    };
  }, []);

  return {
    initialized,
    suspended,
    initialize,
    resume,
    playMusic,
    stopMusic,
    crossfadeMusic,
    pauseMusic,
    resumeMusic,
    playSFX,
    stopSFX,
    stopAllSFX,
    playUIClick,
    playUIHover,
    playUINotification,
    playUIAlert,
    playUIConfirm,
    playUICancel,
    setPhase,
    currentPhase: store.currentPhase,
    masterVolume: store.masterVolume,
    musicVolume: store.musicVolume,
    sfxVolume: store.sfxVolume,
    muted: store.muted,
    setMasterVolume,
    setMusicVolume,
    setSfxVolume,
    toggleMute,
    onBattleEvent,
  };
}

// ========================================
// useGin7VFX - VFX 시스템 훅
// ========================================

export interface UseGin7VFXReturn {
  // 초기화
  initialized: boolean;
  initialize: () => Gin7VFXManager;
  
  // 파티클 효과
  beamImpact: (position: Position3D, direction: Position3D) => string | null;
  missileImpact: (position: Position3D) => string | null;
  shieldHit: (position: Position3D, normal: Position3D) => string | null;
  shieldBreak: (position: Position3D) => string | null;
  unitDestroyed: (position: Position3D, size?: string) => void;
  warpIn: (position: Position3D, direction: Position3D) => string | null;
  warpOut: (position: Position3D, direction: Position3D) => string | null;
  
  // 화면 효과
  shake: (intensity?: number, duration?: number) => string | null;
  flash: (color?: { r: number; g: number; b: number }, duration?: number) => string | null;
  danger: (duration?: number) => string | null;
  victory: () => void;
  defeat: () => void;
  
  // 업데이트
  update: (deltaTime: number) => void;
  
  // 설정
  setQuality: (quality: 'low' | 'medium' | 'high') => void;
  setParticlesEnabled: (enabled: boolean) => void;
  setScreenEffectsEnabled: (enabled: boolean) => void;
  
  // 이벤트
  onBattleEvent: (event: { type: string; data?: Record<string, unknown> }) => void;
  
  // 정리
  stopAll: () => void;
}

export function useGin7VFX(): UseGin7VFXReturn {
  const vfxRef = useRef<Gin7VFXManager | null>(null);
  const [initialized, setInitialized] = useState(false);
  const store = useGin7AudioStore();

  // 초기화
  const initialize = useCallback(() => {
    if (vfxRef.current) return vfxRef.current;
    
    const vfx = initGin7VFX({
      quality: store.vfxQuality,
      particlesEnabled: store.particlesEnabled,
      screenEffectsEnabled: store.screenEffectsEnabled,
    });
    vfxRef.current = vfx;
    setInitialized(true);
    return vfx;
  }, [store]);

  // 파티클 효과
  const beamImpact = useCallback((position: Position3D, direction: Position3D) => {
    return vfxRef.current?.beamImpact(position, direction) ?? null;
  }, []);

  const missileImpact = useCallback((position: Position3D) => {
    return vfxRef.current?.missileImpact(position) ?? null;
  }, []);

  const shieldHit = useCallback((position: Position3D, normal: Position3D) => {
    return vfxRef.current?.shieldHit(position, normal) ?? null;
  }, []);

  const shieldBreak = useCallback((position: Position3D) => {
    return vfxRef.current?.shieldBreak(position) ?? null;
  }, []);

  const unitDestroyed = useCallback((position: Position3D, size?: string) => {
    vfxRef.current?.unitDestroyed(position, size);
  }, []);

  const warpIn = useCallback((position: Position3D, direction: Position3D) => {
    return vfxRef.current?.warpIn(position, direction) ?? null;
  }, []);

  const warpOut = useCallback((position: Position3D, direction: Position3D) => {
    return vfxRef.current?.warpOut(position, direction) ?? null;
  }, []);

  // 화면 효과
  const shake = useCallback((intensity?: number, duration?: number) => {
    return vfxRef.current?.shake(intensity, duration) ?? null;
  }, []);

  const flash = useCallback((color?: { r: number; g: number; b: number }, duration?: number) => {
    return vfxRef.current?.flash(color, duration) ?? null;
  }, []);

  const danger = useCallback((duration?: number) => {
    return vfxRef.current?.danger(duration) ?? null;
  }, []);

  const victory = useCallback(() => {
    vfxRef.current?.victory();
  }, []);

  const defeat = useCallback(() => {
    vfxRef.current?.defeat();
  }, []);

  // 업데이트
  const update = useCallback((deltaTime: number) => {
    vfxRef.current?.update(deltaTime);
  }, []);

  // 설정
  const setQuality = useCallback((quality: 'low' | 'medium' | 'high') => {
    vfxRef.current?.setQuality(quality);
    store.setVfxQuality(quality);
  }, [store]);

  const setParticlesEnabled = useCallback((enabled: boolean) => {
    vfxRef.current?.setParticlesEnabled(enabled);
    store.setParticlesEnabled(enabled);
  }, [store]);

  const setScreenEffectsEnabled = useCallback((enabled: boolean) => {
    vfxRef.current?.setScreenEffectsEnabled(enabled);
    store.setScreenEffectsEnabled(enabled);
  }, [store]);

  // 이벤트
  const onBattleEvent = useCallback((event: { type: string; data?: Record<string, unknown> }) => {
    vfxRef.current?.onBattleEvent(event);
  }, []);

  // 정리
  const stopAll = useCallback(() => {
    vfxRef.current?.stopAll();
  }, []);

  return {
    initialized,
    initialize,
    beamImpact,
    missileImpact,
    shieldHit,
    shieldBreak,
    unitDestroyed,
    warpIn,
    warpOut,
    shake,
    flash,
    danger,
    victory,
    defeat,
    update,
    setQuality,
    setParticlesEnabled,
    setScreenEffectsEnabled,
    onBattleEvent,
    stopAll,
  };
}

// ========================================
// useGin7UISound - UI 사운드 간편 훅
// ========================================

export interface UseGin7UISoundReturn {
  playClick: () => void;
  playHover: () => void;
  playNotification: () => void;
  playAlert: () => void;
  playConfirm: () => void;
  playCancel: () => void;
}

export function useGin7UISound(): UseGin7UISoundReturn {
  const playClick = useCallback(() => {
    getGin7Audio()?.playUIClick();
  }, []);

  const playHover = useCallback(() => {
    getGin7Audio()?.playUIHover();
  }, []);

  const playNotification = useCallback(() => {
    getGin7Audio()?.playUINotification();
  }, []);

  const playAlert = useCallback(() => {
    getGin7Audio()?.playUIAlert();
  }, []);

  const playConfirm = useCallback(() => {
    getGin7Audio()?.playUIConfirm();
  }, []);

  const playCancel = useCallback(() => {
    getGin7Audio()?.playUICancel();
  }, []);

  return {
    playClick,
    playHover,
    playNotification,
    playAlert,
    playConfirm,
    playCancel,
  };
}

// ========================================
// useGin7AudioVFX - 통합 훅
// ========================================

export interface UseGin7AudioVFXReturn {
  audio: UseGin7AudioReturn;
  vfx: UseGin7VFXReturn;
  uiSound: UseGin7UISoundReturn;
  
  // 통합 초기화
  initializeAll: () => Promise<boolean>;
  
  // 전투 이벤트 통합 핸들러
  onBattleEvent: (event: { type: string; data?: Record<string, unknown> }) => void;
}

export function useGin7AudioVFX(): UseGin7AudioVFXReturn {
  const audio = useGin7Audio();
  const vfx = useGin7VFX();
  const uiSound = useGin7UISound();

  // 통합 초기화
  const initializeAll = useCallback(async () => {
    const audioResult = await audio.initialize();
    vfx.initialize();
    return audioResult;
  }, [audio, vfx]);

  // 전투 이벤트 통합 핸들러
  const onBattleEvent = useCallback((event: { type: string; data?: Record<string, unknown> }) => {
    audio.onBattleEvent(event);
    vfx.onBattleEvent(event);
  }, [audio, vfx]);

  return {
    audio,
    vfx,
    uiSound,
    initializeAll,
    onBattleEvent,
  };
}

// ========================================
// 버튼 사운드 Props 훅
// ========================================

export interface ButtonSoundProps {
  onClick: () => void;
  onMouseEnter: () => void;
}

/**
 * 버튼에 사운드를 추가하는 props 반환
 */
export function useGin7ButtonSound(onClick?: () => void): ButtonSoundProps {
  const { playClick, playHover } = useGin7UISound();

  const handleClick = useCallback(() => {
    playClick();
    onClick?.();
  }, [playClick, onClick]);

  const handleMouseEnter = useCallback(() => {
    playHover();
  }, [playHover]);

  return {
    onClick: handleClick,
    onMouseEnter: handleMouseEnter,
  };
}

export default useGin7Audio;















