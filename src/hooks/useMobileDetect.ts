'use client';

import { useState, useEffect, useCallback } from 'react';

interface MobileDetectResult {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isTouch: boolean;
  isLandscape: boolean;
  isPortrait: boolean;
  screenWidth: number;
  screenHeight: number;
  safeAreaInsets: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
}

const MOBILE_BREAKPOINT = 640;
const TABLET_BREAKPOINT = 1024;

/**
 * 모바일/터치 디바이스 감지 훅
 * 반응형 레이아웃 및 터치 인터랙션 최적화에 사용
 */
export function useMobileDetect(): MobileDetectResult {
  const [state, setState] = useState<MobileDetectResult>({
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    isTouch: false,
    isLandscape: true,
    isPortrait: false,
    screenWidth: typeof window !== 'undefined' ? window.innerWidth : 1920,
    screenHeight: typeof window !== 'undefined' ? window.innerHeight : 1080,
    safeAreaInsets: { top: 0, right: 0, bottom: 0, left: 0 },
  });

  const updateState = useCallback(() => {
    if (typeof window === 'undefined') return;

    const width = window.innerWidth;
    const height = window.innerHeight;
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    
    // CSS 환경 변수에서 safe area 가져오기
    const computedStyle = getComputedStyle(document.documentElement);
    const safeAreaInsets = {
      top: parseInt(computedStyle.getPropertyValue('--sat') || '0', 10) || 0,
      right: parseInt(computedStyle.getPropertyValue('--sar') || '0', 10) || 0,
      bottom: parseInt(computedStyle.getPropertyValue('--sab') || '0', 10) || 0,
      left: parseInt(computedStyle.getPropertyValue('--sal') || '0', 10) || 0,
    };

    setState({
      isMobile: width < MOBILE_BREAKPOINT,
      isTablet: width >= MOBILE_BREAKPOINT && width < TABLET_BREAKPOINT,
      isDesktop: width >= TABLET_BREAKPOINT,
      isTouch,
      isLandscape: width > height,
      isPortrait: width <= height,
      screenWidth: width,
      screenHeight: height,
      safeAreaInsets,
    });
  }, []);

  useEffect(() => {
    updateState();

    const handleResize = () => {
      // Debounce resize updates
      requestAnimationFrame(updateState);
    };

    const handleOrientationChange = () => {
      // 방향 변경 시 약간의 딜레이 후 업데이트 (iOS 이슈 대응)
      setTimeout(updateState, 100);
    };

    window.addEventListener('resize', handleResize, { passive: true });
    window.addEventListener('orientationchange', handleOrientationChange);
    
    // MediaQuery 리스너로 브레이크포인트 변경 감지
    const mobileQuery = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const tabletQuery = window.matchMedia(`(max-width: ${TABLET_BREAKPOINT - 1}px)`);
    
    mobileQuery.addEventListener('change', updateState);
    tabletQuery.addEventListener('change', updateState);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleOrientationChange);
      mobileQuery.removeEventListener('change', updateState);
      tabletQuery.removeEventListener('change', updateState);
    };
  }, [updateState]);

  return state;
}

/**
 * 터치 디바이스 여부만 빠르게 확인하는 훅
 */
export function useIsTouchDevice(): boolean {
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    setIsTouch('ontouchstart' in window || navigator.maxTouchPoints > 0);
  }, []);

  return isTouch;
}

/**
 * 화면 방향 감지 훅
 */
export function useOrientation(): 'portrait' | 'landscape' {
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');

  useEffect(() => {
    const updateOrientation = () => {
      if (typeof window !== 'undefined') {
        setOrientation(window.innerWidth > window.innerHeight ? 'landscape' : 'portrait');
      }
    };

    updateOrientation();
    
    window.addEventListener('resize', updateOrientation, { passive: true });
    window.addEventListener('orientationchange', () => {
      setTimeout(updateOrientation, 100);
    });

    return () => {
      window.removeEventListener('resize', updateOrientation);
      window.removeEventListener('orientationchange', updateOrientation);
    };
  }, []);

  return orientation;
}

export default useMobileDetect;


