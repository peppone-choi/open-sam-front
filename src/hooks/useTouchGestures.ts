'use client';

import { useRef, useCallback, useEffect } from 'react';

interface TouchGestureOptions {
  /** 스와이프 인식 최소 거리 (px) */
  swipeThreshold?: number;
  /** 롱 프레스 인식 시간 (ms) */
  longPressDelay?: number;
  /** 핀치 줌 활성화 */
  enablePinch?: boolean;
}

interface TouchGestureHandlers {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  onLongPress?: () => void;
  onPinchIn?: (scale: number) => void;
  onPinchOut?: (scale: number) => void;
  onDoubleTap?: () => void;
}

interface TouchState {
  startX: number;
  startY: number;
  startTime: number;
  lastTapTime: number;
  initialDistance: number;
}

const DEFAULT_OPTIONS: Required<TouchGestureOptions> = {
  swipeThreshold: 50,
  longPressDelay: 500,
  enablePinch: false,
};

/**
 * 터치 제스처 감지 훅
 * 스와이프, 롱 프레스, 핀치, 더블 탭 등을 지원
 */
export function useTouchGestures(
  handlers: TouchGestureHandlers,
  options: TouchGestureOptions = {}
) {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const touchState = useRef<TouchState>({
    startX: 0,
    startY: 0,
    startTime: 0,
    lastTapTime: 0,
    initialDistance: 0,
  });
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const getDistance = useCallback((touches: TouchList): number => {
    if (touches.length < 2) return 0;
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }, []);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    const touch = e.touches[0];
    const now = Date.now();

    // 더블 탭 감지
    if (now - touchState.current.lastTapTime < 300) {
      handlers.onDoubleTap?.();
      touchState.current.lastTapTime = 0;
      return;
    }

    touchState.current = {
      ...touchState.current,
      startX: touch.clientX,
      startY: touch.clientY,
      startTime: now,
    };

    // 핀치 줌 초기 거리 저장
    if (opts.enablePinch && e.touches.length === 2) {
      touchState.current.initialDistance = getDistance(e.touches);
    }

    // 롱 프레스 타이머 시작
    if (handlers.onLongPress) {
      longPressTimer.current = setTimeout(() => {
        handlers.onLongPress?.();
      }, opts.longPressDelay);
    }
  }, [handlers, opts, getDistance]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    // 롱 프레스 취소 (움직임 감지)
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }

    // 핀치 줌 감지
    if (opts.enablePinch && e.touches.length === 2) {
      const currentDistance = getDistance(e.touches);
      const scale = currentDistance / touchState.current.initialDistance;
      
      if (scale > 1.2) {
        handlers.onPinchOut?.(scale);
      } else if (scale < 0.8) {
        handlers.onPinchIn?.(scale);
      }
    }
  }, [handlers, opts, getDistance]);

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    // 롱 프레스 타이머 정리
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }

    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchState.current.startX;
    const deltaY = touch.clientY - touchState.current.startY;
    const absDeltaX = Math.abs(deltaX);
    const absDeltaY = Math.abs(deltaY);

    // 스와이프 감지
    if (absDeltaX > opts.swipeThreshold || absDeltaY > opts.swipeThreshold) {
      if (absDeltaX > absDeltaY) {
        // 수평 스와이프
        if (deltaX > 0) {
          handlers.onSwipeRight?.();
        } else {
          handlers.onSwipeLeft?.();
        }
      } else {
        // 수직 스와이프
        if (deltaY > 0) {
          handlers.onSwipeDown?.();
        } else {
          handlers.onSwipeUp?.();
        }
      }
    } else {
      // 탭으로 처리 (더블 탭 감지용)
      touchState.current.lastTapTime = Date.now();
    }
  }, [handlers, opts]);

  // ref를 반환하여 요소에 바인딩
  const bind = useCallback((element: HTMLElement | null) => {
    if (!element) return;

    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchmove', handleTouchMove, { passive: true });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  return { bind };
}

/**
 * 스와이프 제스처만 감지하는 간단한 훅
 */
export function useSwipe(
  onSwipeLeft?: () => void,
  onSwipeRight?: () => void,
  threshold = 50
) {
  return useTouchGestures(
    { onSwipeLeft, onSwipeRight },
    { swipeThreshold: threshold }
  );
}

/**
 * 풀 다운 새로고침을 위한 훅
 */
export function usePullToRefresh(
  onRefresh: () => Promise<void>,
  threshold = 100
) {
  const containerRef = useRef<HTMLElement | null>(null);
  const startY = useRef(0);
  const isPulling = useRef(false);
  const isRefreshing = useRef(false);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (containerRef.current?.scrollTop === 0) {
      startY.current = e.touches[0].clientY;
      isPulling.current = true;
    }
  }, []);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isPulling.current || isRefreshing.current) return;
    
    const currentY = e.touches[0].clientY;
    const pullDistance = currentY - startY.current;
    
    if (pullDistance > 0) {
      // 여기서 pull indicator 표시 로직 추가 가능
    }
  }, []);

  const handleTouchEnd = useCallback(async (e: TouchEvent) => {
    if (!isPulling.current || isRefreshing.current) return;
    
    const currentY = e.changedTouches[0].clientY;
    const pullDistance = currentY - startY.current;
    
    if (pullDistance > threshold) {
      isRefreshing.current = true;
      await onRefresh();
      isRefreshing.current = false;
    }
    
    isPulling.current = false;
  }, [onRefresh, threshold]);

  const bind = useCallback((element: HTMLElement | null) => {
    containerRef.current = element;
    if (!element) return;

    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchmove', handleTouchMove, { passive: true });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  return { bind };
}

export default useTouchGestures;


