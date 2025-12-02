'use client';

import { useEffect, useRef, useCallback } from 'react';

interface UseFocusTrapOptions {
  /** 트랩 활성화 여부 */
  enabled?: boolean;
  /** 트랩 해제 시 포커스 복원 여부 */
  restoreFocus?: boolean;
  /** 초기 포커스할 요소 셀렉터 */
  initialFocusRef?: React.RefObject<HTMLElement>;
}

/**
 * 포커스 트랩 훅 - 모달, 다이얼로그 등에서 사용
 * 키보드 사용자가 컨테이너 내부에서만 탐색할 수 있도록 함
 */
export function useFocusTrap<T extends HTMLElement>(options: UseFocusTrapOptions = {}) {
  const { enabled = true, restoreFocus = true, initialFocusRef } = options;
  const containerRef = useRef<T>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  const getFocusableElements = useCallback(() => {
    if (!containerRef.current) return [];
    
    const focusableSelectors = [
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      'a[href]',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable="true"]',
    ].join(', ');

    return Array.from(
      containerRef.current.querySelectorAll<HTMLElement>(focusableSelectors)
    ).filter(el => el.offsetParent !== null); // visible only
  }, []);

  useEffect(() => {
    if (!enabled) return;

    // 이전 포커스 저장
    previousActiveElement.current = document.activeElement as HTMLElement;

    // 초기 포커스 설정
    const setInitialFocus = () => {
      if (initialFocusRef?.current) {
        initialFocusRef.current.focus();
      } else {
        const focusableElements = getFocusableElements();
        if (focusableElements.length > 0) {
          focusableElements[0].focus();
        } else {
          containerRef.current?.focus();
        }
      }
    };

    // 약간의 딜레이 후 포커스 설정 (애니메이션 고려)
    const timeoutId = setTimeout(setInitialFocus, 50);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      const focusableElements = getFocusableElements();
      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (e.shiftKey) {
        // Shift + Tab: 첫 번째 요소에서 마지막으로
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab: 마지막 요소에서 첫 번째로
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('keydown', handleKeyDown);
      
      // 포커스 복원
      if (restoreFocus && previousActiveElement.current) {
        previousActiveElement.current.focus();
      }
    };
  }, [enabled, restoreFocus, getFocusableElements, initialFocusRef]);

  return containerRef;
}

/**
 * 화살표 키 네비게이션 훅 - 메뉴, 리스트 등에서 사용
 */
export function useArrowKeyNavigation<T extends HTMLElement>(
  itemSelector: string,
  options: {
    /** 가로 방향 네비게이션 */
    horizontal?: boolean;
    /** 세로 방향 네비게이션 */
    vertical?: boolean;
    /** 순환 네비게이션 */
    wrap?: boolean;
    /** 항목 선택 콜백 */
    onSelect?: (index: number, element: HTMLElement) => void;
  } = {}
) {
  const { 
    horizontal = false, 
    vertical = true, 
    wrap = true,
    onSelect 
  } = options;
  
  const containerRef = useRef<T>(null);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!containerRef.current) return;

    const items = Array.from(
      containerRef.current.querySelectorAll<HTMLElement>(itemSelector)
    ).filter(el => !el.hasAttribute('disabled'));

    const currentIndex = items.findIndex(
      item => item === document.activeElement || item.contains(document.activeElement as Node)
    );

    if (currentIndex === -1) return;

    let nextIndex = currentIndex;
    const prevKeys = vertical ? ['ArrowUp'] : [];
    const nextKeys = vertical ? ['ArrowDown'] : [];
    if (horizontal) {
      prevKeys.push('ArrowLeft');
      nextKeys.push('ArrowRight');
    }

    if (prevKeys.includes(e.key)) {
      e.preventDefault();
      nextIndex = currentIndex - 1;
      if (nextIndex < 0) {
        nextIndex = wrap ? items.length - 1 : 0;
      }
    } else if (nextKeys.includes(e.key)) {
      e.preventDefault();
      nextIndex = currentIndex + 1;
      if (nextIndex >= items.length) {
        nextIndex = wrap ? 0 : items.length - 1;
      }
    } else if (e.key === 'Home') {
      e.preventDefault();
      nextIndex = 0;
    } else if (e.key === 'End') {
      e.preventDefault();
      nextIndex = items.length - 1;
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelect?.(currentIndex, items[currentIndex]);
      return;
    }

    if (nextIndex !== currentIndex) {
      items[nextIndex].focus();
    }
  }, [itemSelector, horizontal, vertical, wrap, onSelect]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('keydown', handleKeyDown as EventListener);
    return () => {
      container.removeEventListener('keydown', handleKeyDown as EventListener);
    };
  }, [handleKeyDown]);

  return containerRef;
}

/**
 * 스킵 링크 생성 훅
 */
export function useSkipLinks(targets: { id: string; label: string }[]) {
  return targets.map(({ id, label }) => ({
    href: `#${id}`,
    label,
    onClick: (e: React.MouseEvent) => {
      e.preventDefault();
      const element = document.getElementById(id);
      if (element) {
        element.focus();
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    },
  }));
}


