/**
 * UISoundHook - UI 사운드를 위한 React Hook
 * 
 * 기능:
 * - 버튼 클릭 사운드
 * - 호버 사운드
 * - 알림/성공/에러 사운드
 * - 메뉴 열기/닫기 사운드
 */

import { useCallback, useEffect, useRef } from 'react';
import { getSoundManager, SoundManager } from './SoundManager';
import type { SFXType } from './SoundEffects';

// ========================================
// 타입 정의
// ========================================

/** UI 사운드 타입 */
export type UISoundType = 
  | 'click'
  | 'hover'
  | 'notification'
  | 'success'
  | 'error'
  | 'open'
  | 'close'
  | 'select'
  | 'toggle';

/** UI 사운드 옵션 */
export interface UISoundOptions {
  enabled?: boolean;
  volume?: number;
  hoverDebounce?: number;
}

/** useUISound 반환 타입 */
export interface UISoundHook {
  /** 클릭 사운드 재생 */
  playClick: () => void;
  /** 호버 사운드 재생 */
  playHover: () => void;
  /** 알림 사운드 재생 */
  playNotification: () => void;
  /** 성공 사운드 재생 */
  playSuccess: () => void;
  /** 에러 사운드 재생 */
  playError: () => void;
  /** 메뉴 열기 사운드 */
  playOpen: () => void;
  /** 메뉴 닫기 사운드 */
  playClose: () => void;
  /** 선택 사운드 */
  playSelect: () => void;
  /** 토글 사운드 */
  playToggle: () => void;
  /** 범용 UI 사운드 재생 */
  playUI: (type: UISoundType) => void;
  /** 사운드 활성화/비활성화 */
  setEnabled: (enabled: boolean) => void;
  /** 볼륨 설정 */
  setVolume: (volume: number) => void;
}

// ========================================
// UI 사운드 매핑
// ========================================

const UI_SOUND_MAP: Record<UISoundType, SFXType> = {
  click: 'ui_click',
  hover: 'ui_hover',
  notification: 'ui_notification',
  success: 'ui_success',
  error: 'ui_error',
  open: 'ui_click',
  close: 'ui_click',
  select: 'ui_click',
  toggle: 'ui_click',
};

// ========================================
// useUISound Hook
// ========================================

/**
 * UI 사운드를 위한 React Hook
 * 
 * @example
 * ```tsx
 * function MyButton() {
 *   const { playClick, playHover } = useUISound();
 *   
 *   return (
 *     <button
 *       onClick={() => {
 *         playClick();
 *         // 실제 클릭 동작...
 *       }}
 *       onMouseEnter={playHover}
 *     >
 *       Click me
 *     </button>
 *   );
 * }
 * ```
 */
export function useUISound(options: UISoundOptions = {}): UISoundHook {
  const {
    enabled: initialEnabled = true,
    volume: initialVolume = 0.7,
    hoverDebounce = 50,
  } = options;

  const enabledRef = useRef(initialEnabled);
  const volumeRef = useRef(initialVolume);
  const lastHoverTimeRef = useRef(0);
  const soundManagerRef = useRef<SoundManager | null>(null);

  // 사운드 매니저 참조 가져오기
  useEffect(() => {
    soundManagerRef.current = getSoundManager();
  }, []);

  // 범용 재생 함수
  const playUI = useCallback((type: UISoundType) => {
    if (!enabledRef.current || !soundManagerRef.current) return;

    const sfxType = UI_SOUND_MAP[type];
    soundManagerRef.current.playSFX(sfxType, undefined, {
      volume: volumeRef.current,
    });
  }, []);

  // 클릭 사운드
  const playClick = useCallback(() => {
    playUI('click');
  }, [playUI]);

  // 호버 사운드 (디바운스 적용)
  const playHover = useCallback(() => {
    if (!enabledRef.current) return;
    
    const now = Date.now();
    if (now - lastHoverTimeRef.current < hoverDebounce) return;
    lastHoverTimeRef.current = now;
    
    playUI('hover');
  }, [playUI, hoverDebounce]);

  // 알림 사운드
  const playNotification = useCallback(() => {
    playUI('notification');
  }, [playUI]);

  // 성공 사운드
  const playSuccess = useCallback(() => {
    playUI('success');
  }, [playUI]);

  // 에러 사운드
  const playError = useCallback(() => {
    playUI('error');
  }, [playUI]);

  // 메뉴 열기
  const playOpen = useCallback(() => {
    playUI('open');
  }, [playUI]);

  // 메뉴 닫기
  const playClose = useCallback(() => {
    playUI('close');
  }, [playUI]);

  // 선택 사운드
  const playSelect = useCallback(() => {
    playUI('select');
  }, [playUI]);

  // 토글 사운드
  const playToggle = useCallback(() => {
    playUI('toggle');
  }, [playUI]);

  // 활성화 설정
  const setEnabled = useCallback((enabled: boolean) => {
    enabledRef.current = enabled;
  }, []);

  // 볼륨 설정
  const setVolume = useCallback((volume: number) => {
    volumeRef.current = Math.max(0, Math.min(1, volume));
  }, []);

  return {
    playClick,
    playHover,
    playNotification,
    playSuccess,
    playError,
    playOpen,
    playClose,
    playSelect,
    playToggle,
    playUI,
    setEnabled,
    setVolume,
  };
}

// ========================================
// 컴포넌트 Props 헬퍼
// ========================================

/**
 * 버튼 사운드 Props 생성
 * 
 * @example
 * ```tsx
 * function MyButton() {
 *   const soundProps = useButtonSoundProps();
 *   return <button {...soundProps}>Click me</button>;
 * }
 * ```
 */
export function useButtonSoundProps(options?: UISoundOptions) {
  const { playClick, playHover } = useUISound(options);
  
  return {
    onClick: (e: React.MouseEvent) => {
      playClick();
      // 이벤트 전파는 유지
    },
    onMouseEnter: playHover,
  };
}

/**
 * 인터랙티브 요소 사운드 Props 생성
 */
export function useInteractiveSoundProps(options?: UISoundOptions) {
  const { playClick, playHover, playSelect } = useUISound(options);
  
  return {
    onClick: playClick,
    onMouseEnter: playHover,
    onFocus: playSelect,
  };
}

// ========================================
// 전역 UI 사운드 유틸리티
// ========================================

/**
 * 전역 UI 사운드 재생 (Hook 외부에서 사용)
 */
export function playGlobalUISound(type: UISoundType, volume = 0.7): void {
  const soundManager = getSoundManager();
  if (!soundManager) return;

  const sfxType = UI_SOUND_MAP[type];
  soundManager.playSFX(sfxType, undefined, { volume });
}

/**
 * 클릭 사운드 전역 재생
 */
export function playGlobalClick(volume = 0.7): void {
  playGlobalUISound('click', volume);
}

/**
 * 알림 사운드 전역 재생
 */
export function playGlobalNotification(volume = 0.7): void {
  playGlobalUISound('notification', volume);
}

/**
 * 성공 사운드 전역 재생
 */
export function playGlobalSuccess(volume = 0.7): void {
  playGlobalUISound('success', volume);
}

/**
 * 에러 사운드 전역 재생
 */
export function playGlobalError(volume = 0.7): void {
  playGlobalUISound('error', volume);
}

export default useUISound;





