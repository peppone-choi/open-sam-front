'use client';

import { useCallback, useRef } from 'react';

/**
 * 전역 사운드 제어 훅
 * Phase 23 - 프론트엔드 프리미엄 폴리싱
 */
export function useSound() {
  const audioRefs = useRef<Record<string, HTMLAudioElement>>({});

  const playSound = useCallback((soundName: string, volume: number = 0.5) => {
    // 사운드 파일 경로 매핑 (public/sounds/...)
    const soundPath = `/sounds/${soundName}.mp3`;
    
    if (!audioRefs.current[soundName]) {
      audioRefs.current[soundName] = new Audio(soundPath);
    }
    
    const audio = audioRefs.current[soundName];
    audio.volume = volume;
    
    // 재생 중이면 처음으로 되돌림
    audio.currentTime = 0;
    audio.play().catch(err => {
      // 자동 재생 정책 등으로 실패할 수 있음 (로그 생략)
    });
  }, []);

  const playClick = useCallback(() => playSound('click', 0.3), [playSound]);
  const playNotification = useCallback(() => playSound('notify', 0.4), [playSound]);
  const playBattleStart = useCallback(() => playSound('battle_start', 0.6), [playSound]);
  const playSuccess = useCallback(() => playSound('success', 0.5), [playSound]);

  return {
    playSound,
    playClick,
    playNotification,
    playBattleStart,
    playSuccess
  };
}
