'use client';

import { useState, useEffect } from 'react';

interface ViewportSize {
  width: number;
  height: number;
  vw: number;  // 1vw in pixels
  vh: number;  // 1vh in pixels (모바일에서 실제 뷰포트 크기 반영)
  dvh: number; // dynamic viewport height (주소창 포함/제외 고려)
  svh: number; // small viewport height
  lvh: number; // large viewport height
}

/**
 * 뷰포트 크기 훅
 * 모바일 브라우저의 동적 뷰포트 크기를 정확하게 감지
 */
export function useViewportSize(): ViewportSize {
  const [size, setSize] = useState<ViewportSize>({
    width: typeof window !== 'undefined' ? window.innerWidth : 1920,
    height: typeof window !== 'undefined' ? window.innerHeight : 1080,
    vw: typeof window !== 'undefined' ? window.innerWidth / 100 : 19.2,
    vh: typeof window !== 'undefined' ? window.innerHeight / 100 : 10.8,
    dvh: typeof window !== 'undefined' ? window.innerHeight / 100 : 10.8,
    svh: typeof window !== 'undefined' ? window.innerHeight / 100 : 10.8,
    lvh: typeof window !== 'undefined' ? window.innerHeight / 100 : 10.8,
  });

  useEffect(() => {
    const updateSize = () => {
      // visualViewport API 사용 (모바일에서 더 정확)
      const visualViewport = window.visualViewport;
      const width = visualViewport?.width ?? window.innerWidth;
      const height = visualViewport?.height ?? window.innerHeight;

      // CSS 환경 변수에서 동적 뷰포트 값 가져오기
      const root = document.documentElement;
      const dvh = parseFloat(getComputedStyle(root).getPropertyValue('--1dvh')) || height / 100;
      const svh = parseFloat(getComputedStyle(root).getPropertyValue('--1svh')) || height / 100;
      const lvh = parseFloat(getComputedStyle(root).getPropertyValue('--1lvh')) || height / 100;

      setSize({
        width,
        height,
        vw: width / 100,
        vh: height / 100,
        dvh,
        svh,
        lvh,
      });
    };

    updateSize();

    // resize와 visualViewport resize 모두 리스닝
    window.addEventListener('resize', updateSize, { passive: true });
    
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', updateSize);
      window.visualViewport.addEventListener('scroll', updateSize);
    }

    return () => {
      window.removeEventListener('resize', updateSize);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', updateSize);
        window.visualViewport.removeEventListener('scroll', updateSize);
      }
    };
  }, []);

  return size;
}

/**
 * 키보드가 열려있는지 감지하는 훅
 * 모바일에서 폼 입력 시 레이아웃 조정에 유용
 */
export function useKeyboardOpen(): boolean {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    let initialHeight = window.innerHeight;

    const handleResize = () => {
      // 높이가 줄어들면 키보드가 열린 것으로 간주
      const currentHeight = window.visualViewport?.height ?? window.innerHeight;
      setIsOpen(currentHeight < initialHeight * 0.75);
    };

    // visualViewport API 우선 사용
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleResize);
    } else {
      window.addEventListener('resize', handleResize, { passive: true });
    }

    // 초기 높이 재설정 (방향 전환 등 대응)
    const handleOrientationChange = () => {
      setTimeout(() => {
        initialHeight = window.innerHeight;
      }, 100);
    };
    window.addEventListener('orientationchange', handleOrientationChange);

    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleResize);
      } else {
        window.removeEventListener('resize', handleResize);
      }
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, []);

  return isOpen;
}

export default useViewportSize;


