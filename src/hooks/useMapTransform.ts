'use client';

import { useState, useCallback, useRef, useEffect, type RefObject } from 'react';

export interface TransformState {
  scale: number;
  translateX: number;
  translateY: number;
}

export interface UseMapTransformOptions {
  minScale?: number;
  maxScale?: number;
  initialScale?: number;
  /** 줌 변경 시 콜백 */
  onZoomChange?: (scale: number) => void;
}

interface TouchPoint {
  x: number;
  y: number;
}

export interface UseMapTransformReturn {
  transform: TransformState;
  containerRef: RefObject<HTMLDivElement | null>;
  contentRef: RefObject<HTMLDivElement | null>;
  transformStyle: React.CSSProperties;
  /** 줌 인 */
  zoomIn: () => void;
  /** 줌 아웃 */
  zoomOut: () => void;
  /** 줌 리셋 */
  resetZoom: () => void;
  /** 특정 스케일로 설정 */
  setScale: (scale: number) => void;
  /** 드래그 중인지 여부 */
  isDragging: boolean;
  /** 현재 줌 레벨 퍼센트 */
  zoomPercent: number;
}

/**
 * 지도 줌/팬 기능을 제공하는 커스텀 훅
 * - 마우스 휠 줌
 * - 드래그 팬
 * - 모바일 핀치 줌
 * - 더블 클릭/탭 줌
 */
export function useMapTransform(options: UseMapTransformOptions = {}): UseMapTransformReturn {
  const {
    minScale = 0.5,
    maxScale = 3,
    initialScale = 1,
    onZoomChange,
  } = options;

  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  
  const [transform, setTransform] = useState<TransformState>({
    scale: initialScale,
    translateX: 0,
    translateY: 0,
  });
  
  const [isDragging, setIsDragging] = useState(false);
  
  // 드래그 상태 ref (이벤트 핸들러에서 최신 상태 참조용)
  const dragStateRef = useRef({
    isDragging: false,
    lastX: 0,
    lastY: 0,
  });
  
  // 핀치 제스처 상태 ref
  const pinchStateRef = useRef({
    isPinching: false,
    initialDistance: 0,
    initialScale: 1,
    centerX: 0,
    centerY: 0,
    lastTouchTime: 0,
    lastTouchX: 0,
    lastTouchY: 0,
  });

  // 스케일 제한 함수
  const clampScale = useCallback((scale: number) => {
    return Math.min(Math.max(scale, minScale), maxScale);
  }, [minScale, maxScale]);

  // 이동 제한 함수 (지도가 컨테이너 밖으로 완전히 벗어나지 않도록)
  const clampTranslate = useCallback((tx: number, ty: number, scale: number) => {
    if (!containerRef.current || !contentRef.current) {
      return { x: tx, y: ty };
    }
    
    const containerRect = containerRef.current.getBoundingClientRect();
    const contentRect = contentRef.current.getBoundingClientRect();
    
    // 스케일된 컨텐츠 크기
    const scaledWidth = containerRect.width * scale;
    const scaledHeight = containerRect.height * scale;
    
    // 최대 이동 범위 (컨텐츠가 컨테이너 안에 30% 이상 보이도록)
    const maxTx = scaledWidth * 0.7;
    const maxTy = scaledHeight * 0.7;
    const minTx = containerRect.width - scaledWidth - maxTx;
    const minTy = containerRect.height - scaledHeight - maxTy;
    
    return {
      x: Math.min(Math.max(tx, minTx), maxTx),
      y: Math.min(Math.max(ty, minTy), maxTy),
    };
  }, []);

  // 줌 인
  const zoomIn = useCallback(() => {
    setTransform((prev) => {
      const newScale = clampScale(prev.scale * 1.2);
      onZoomChange?.(newScale);
      return { ...prev, scale: newScale };
    });
  }, [clampScale, onZoomChange]);

  // 줌 아웃
  const zoomOut = useCallback(() => {
    setTransform((prev) => {
      const newScale = clampScale(prev.scale / 1.2);
      onZoomChange?.(newScale);
      return { ...prev, scale: newScale };
    });
  }, [clampScale, onZoomChange]);

  // 줌 리셋
  const resetZoom = useCallback(() => {
    setTransform({
      scale: initialScale,
      translateX: 0,
      translateY: 0,
    });
    onZoomChange?.(initialScale);
  }, [initialScale, onZoomChange]);

  // 특정 스케일로 설정
  const setScale = useCallback((scale: number) => {
    const newScale = clampScale(scale);
    setTransform((prev) => ({ ...prev, scale: newScale }));
    onZoomChange?.(newScale);
  }, [clampScale, onZoomChange]);

  // 마우스 휠 줌
  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    
    if (!containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    setTransform((prev) => {
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      const newScale = clampScale(prev.scale * delta);
      
      // 마우스 위치를 중심으로 줌
      const scaleRatio = newScale / prev.scale;
      const newTranslateX = mouseX - scaleRatio * (mouseX - prev.translateX);
      const newTranslateY = mouseY - scaleRatio * (mouseY - prev.translateY);
      
      const clamped = clampTranslate(newTranslateX, newTranslateY, newScale);
      
      onZoomChange?.(newScale);
      
      return {
        scale: newScale,
        translateX: clamped.x,
        translateY: clamped.y,
      };
    });
  }, [clampScale, clampTranslate, onZoomChange]);

  // 마우스 다운 (드래그 시작)
  const handleMouseDown = useCallback((e: MouseEvent) => {
    // 좌클릭만 처리
    if (e.button !== 0) return;
    
    dragStateRef.current = {
      isDragging: true,
      lastX: e.clientX,
      lastY: e.clientY,
    };
    setIsDragging(true);
  }, []);

  // 마우스 이동 (드래그)
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!dragStateRef.current.isDragging) return;
    
    const dx = e.clientX - dragStateRef.current.lastX;
    const dy = e.clientY - dragStateRef.current.lastY;
    
    dragStateRef.current.lastX = e.clientX;
    dragStateRef.current.lastY = e.clientY;
    
    setTransform((prev) => {
      const clamped = clampTranslate(
        prev.translateX + dx,
        prev.translateY + dy,
        prev.scale
      );
      return {
        ...prev,
        translateX: clamped.x,
        translateY: clamped.y,
      };
    });
  }, [clampTranslate]);

  // 마우스 업 (드래그 종료)
  const handleMouseUp = useCallback(() => {
    dragStateRef.current.isDragging = false;
    setIsDragging(false);
  }, []);

  // 더블 클릭 줌
  const handleDoubleClick = useCallback((e: MouseEvent) => {
    if (!containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    setTransform((prev) => {
      // 이미 확대되어 있으면 리셋, 아니면 2배로 확대
      const newScale = prev.scale > 1.5 ? 1 : 2;
      
      if (newScale === 1) {
        onZoomChange?.(1);
        return { scale: 1, translateX: 0, translateY: 0 };
      }
      
      // 클릭 위치를 중심으로 줌
      const scaleRatio = newScale / prev.scale;
      const newTranslateX = mouseX - scaleRatio * (mouseX - prev.translateX);
      const newTranslateY = mouseY - scaleRatio * (mouseY - prev.translateY);
      
      const clamped = clampTranslate(newTranslateX, newTranslateY, newScale);
      
      onZoomChange?.(newScale);
      
      return {
        scale: newScale,
        translateX: clamped.x,
        translateY: clamped.y,
      };
    });
  }, [clampTranslate, onZoomChange]);

  // 두 터치 포인트 간의 거리 계산
  const getTouchDistance = (touches: TouchList): number => {
    const touch1 = touches[0];
    const touch2 = touches[1];
    return Math.hypot(touch2.clientX - touch1.clientX, touch2.clientY - touch1.clientY);
  };

  // 두 터치 포인트의 중심점 계산
  const getTouchCenter = (touches: TouchList): TouchPoint => {
    const touch1 = touches[0];
    const touch2 = touches[1];
    return {
      x: (touch1.clientX + touch2.clientX) / 2,
      y: (touch1.clientY + touch2.clientY) / 2,
    };
  };

  // 터치 시작
  const handleTouchStart = useCallback((e: TouchEvent) => {
    const now = Date.now();
    
    if (e.touches.length === 2) {
      // 핀치 줌 시작
      pinchStateRef.current = {
        isPinching: true,
        initialDistance: getTouchDistance(e.touches),
        initialScale: transform.scale,
        centerX: 0,
        centerY: 0,
        lastTouchTime: now,
        lastTouchX: 0,
        lastTouchY: 0,
      };
      
      const center = getTouchCenter(e.touches);
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        pinchStateRef.current.centerX = center.x - rect.left;
        pinchStateRef.current.centerY = center.y - rect.top;
      }
    } else if (e.touches.length === 1) {
      const touch = e.touches[0];
      
      // 더블 탭 감지 (300ms 이내)
      if (
        now - pinchStateRef.current.lastTouchTime < 300 &&
        Math.abs(touch.clientX - pinchStateRef.current.lastTouchX) < 30 &&
        Math.abs(touch.clientY - pinchStateRef.current.lastTouchY) < 30
      ) {
        // 더블 탭 - 줌 토글
        e.preventDefault();
        
        if (!containerRef.current) return;
        
        const rect = containerRef.current.getBoundingClientRect();
        const touchX = touch.clientX - rect.left;
        const touchY = touch.clientY - rect.top;
        
        setTransform((prev) => {
          const newScale = prev.scale > 1.5 ? 1 : 2;
          
          if (newScale === 1) {
            onZoomChange?.(1);
            return { scale: 1, translateX: 0, translateY: 0 };
          }
          
          const scaleRatio = newScale / prev.scale;
          const newTranslateX = touchX - scaleRatio * (touchX - prev.translateX);
          const newTranslateY = touchY - scaleRatio * (touchY - prev.translateY);
          
          const clamped = clampTranslate(newTranslateX, newTranslateY, newScale);
          
          onZoomChange?.(newScale);
          
          return {
            scale: newScale,
            translateX: clamped.x,
            translateY: clamped.y,
          };
        });
        
        pinchStateRef.current.lastTouchTime = 0;
        return;
      }
      
      // 단일 터치 드래그 시작
      pinchStateRef.current.lastTouchTime = now;
      pinchStateRef.current.lastTouchX = touch.clientX;
      pinchStateRef.current.lastTouchY = touch.clientY;
      
      dragStateRef.current = {
        isDragging: true,
        lastX: touch.clientX,
        lastY: touch.clientY,
      };
      setIsDragging(true);
    }
  }, [transform.scale, clampTranslate, onZoomChange]);

  // 터치 이동
  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (e.touches.length === 2 && pinchStateRef.current.isPinching) {
      e.preventDefault();
      
      const currentDistance = getTouchDistance(e.touches);
      const scaleRatio = currentDistance / pinchStateRef.current.initialDistance;
      const newScale = clampScale(pinchStateRef.current.initialScale * scaleRatio);
      
      const center = getTouchCenter(e.touches);
      
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const centerX = center.x - rect.left;
        const centerY = center.y - rect.top;
        
        setTransform((prev) => {
          const ratio = newScale / prev.scale;
          const newTranslateX = centerX - ratio * (centerX - prev.translateX);
          const newTranslateY = centerY - ratio * (centerY - prev.translateY);
          
          const clamped = clampTranslate(newTranslateX, newTranslateY, newScale);
          
          return {
            scale: newScale,
            translateX: clamped.x,
            translateY: clamped.y,
          };
        });
        
        onZoomChange?.(newScale);
      }
    } else if (e.touches.length === 1 && dragStateRef.current.isDragging) {
      // 단일 터치 드래그 (확대 상태에서만)
      const touch = e.touches[0];
      
      if (transform.scale > 1) {
        e.preventDefault();
        
        const dx = touch.clientX - dragStateRef.current.lastX;
        const dy = touch.clientY - dragStateRef.current.lastY;
        
        dragStateRef.current.lastX = touch.clientX;
        dragStateRef.current.lastY = touch.clientY;
        
        setTransform((prev) => {
          const clamped = clampTranslate(
            prev.translateX + dx,
            prev.translateY + dy,
            prev.scale
          );
          return {
            ...prev,
            translateX: clamped.x,
            translateY: clamped.y,
          };
        });
      }
    }
  }, [transform.scale, clampScale, clampTranslate, onZoomChange]);

  // 터치 종료
  const handleTouchEnd = useCallback(() => {
    pinchStateRef.current.isPinching = false;
    dragStateRef.current.isDragging = false;
    setIsDragging(false);
  }, []);

  // 이벤트 리스너 등록
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 패시브 옵션 설정 (스크롤 성능 향상, 단 preventDefault 필요한 경우 passive: false)
    const wheelOptions: AddEventListenerOptions = { passive: false };
    const touchOptions: AddEventListenerOptions = { passive: false };
    
    container.addEventListener('wheel', handleWheel, wheelOptions);
    container.addEventListener('mousedown', handleMouseDown);
    container.addEventListener('dblclick', handleDoubleClick);
    container.addEventListener('touchstart', handleTouchStart, touchOptions);
    container.addEventListener('touchmove', handleTouchMove, touchOptions);
    container.addEventListener('touchend', handleTouchEnd);
    
    // 전역 이벤트 (드래그가 컨테이너 밖으로 나가도 계속 동작)
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      container.removeEventListener('wheel', handleWheel);
      container.removeEventListener('mousedown', handleMouseDown);
      container.removeEventListener('dblclick', handleDoubleClick);
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [
    handleWheel,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleDoubleClick,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  ]);

  // CSS transform 스타일
  const transformStyle: React.CSSProperties = {
    transform: `translate(${transform.translateX}px, ${transform.translateY}px) scale(${transform.scale})`,
    transformOrigin: '0 0',
    transition: isDragging ? 'none' : 'transform 0.1s ease-out',
  };

  return {
    transform,
    containerRef,
    contentRef,
    transformStyle,
    zoomIn,
    zoomOut,
    resetZoom,
    setScale,
    isDragging,
    zoomPercent: Math.round(transform.scale * 100),
  };
}


