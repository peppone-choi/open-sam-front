'use client';

import React, { useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  /** 드로어 위치 */
  position?: 'bottom' | 'left' | 'right';
  /** 드로어 높이/너비 (bottom일 때 높이, left/right일 때 너비) */
  size?: 'sm' | 'md' | 'lg' | 'full' | 'auto';
  /** 닫기 핸들 표시 (드래그로 닫기 지원) */
  showHandle?: boolean;
  /** 배경 클릭으로 닫기 */
  closeOnBackdrop?: boolean;
  /** 헤더 영역 */
  header?: React.ReactNode;
  /** 푸터 영역 */
  footer?: React.ReactNode;
  /** 추가 클래스 */
  className?: string;
}

const sizeClasses = {
  bottom: {
    sm: 'max-h-[30vh]',
    md: 'max-h-[50vh]',
    lg: 'max-h-[75vh]',
    full: 'max-h-[95vh]',
    auto: 'max-h-[85vh]',
  },
  left: {
    sm: 'w-[250px]',
    md: 'w-[300px]',
    lg: 'w-[350px]',
    full: 'w-[90vw]',
    auto: 'w-auto min-w-[280px] max-w-[85vw]',
  },
  right: {
    sm: 'w-[250px]',
    md: 'w-[300px]',
    lg: 'w-[350px]',
    full: 'w-[90vw]',
    auto: 'w-auto min-w-[280px] max-w-[85vw]',
  },
};

const positionClasses = {
  bottom: 'bottom-0 left-0 right-0 rounded-t-2xl',
  left: 'left-0 top-0 bottom-0 rounded-r-2xl',
  right: 'right-0 top-0 bottom-0 rounded-l-2xl',
};

const translateClasses = {
  bottom: { open: 'translate-y-0', closed: 'translate-y-full' },
  left: { open: 'translate-x-0', closed: '-translate-x-full' },
  right: { open: 'translate-x-0', closed: 'translate-x-full' },
};

export default function MobileDrawer({
  isOpen,
  onClose,
  children,
  position = 'bottom',
  size = 'auto',
  showHandle = true,
  closeOnBackdrop = true,
  header,
  footer,
  className,
}: MobileDrawerProps) {
  const drawerRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const startX = useRef(0);
  const currentTranslate = useRef(0);

  // 드래그로 닫기 핸들러
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!showHandle) return;
    startY.current = e.touches[0].clientY;
    startX.current = e.touches[0].clientX;
    currentTranslate.current = 0;
  }, [showHandle]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!showHandle || !drawerRef.current) return;
    
    const deltaY = e.touches[0].clientY - startY.current;
    const deltaX = e.touches[0].clientX - startX.current;
    
    if (position === 'bottom' && deltaY > 0) {
      currentTranslate.current = deltaY;
      drawerRef.current.style.transform = `translateY(${deltaY}px)`;
    } else if (position === 'left' && deltaX < 0) {
      currentTranslate.current = Math.abs(deltaX);
      drawerRef.current.style.transform = `translateX(${deltaX}px)`;
    } else if (position === 'right' && deltaX > 0) {
      currentTranslate.current = deltaX;
      drawerRef.current.style.transform = `translateX(${deltaX}px)`;
    }
  }, [showHandle, position]);

  const handleTouchEnd = useCallback(() => {
    if (!showHandle || !drawerRef.current) return;
    
    const threshold = position === 'bottom' ? 100 : 80;
    
    if (currentTranslate.current > threshold) {
      onClose();
    } else {
      drawerRef.current.style.transform = '';
    }
  }, [showHandle, position, onClose]);

  // ESC 키로 닫기
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  // 포커스 트랩
  useEffect(() => {
    if (!isOpen || !drawerRef.current) return;

    const focusableElements = drawerRef.current.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault();
        lastElement?.focus();
      } else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault();
        firstElement?.focus();
      }
    };

    document.addEventListener('keydown', handleTabKey);
    firstElement?.focus();

    return () => {
      document.removeEventListener('keydown', handleTabKey);
    };
  }, [isOpen]);

  if (typeof window === 'undefined') return null;

  const drawerContent = (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          'fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] transition-opacity duration-300',
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        onClick={closeOnBackdrop ? onClose : undefined}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        className={cn(
          'fixed z-[101] bg-background-secondary shadow-2xl flex flex-col',
          'transition-transform duration-300 ease-out',
          positionClasses[position],
          sizeClasses[position][size],
          isOpen ? translateClasses[position].open : translateClasses[position].closed,
          className
        )}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Handle */}
        {showHandle && position === 'bottom' && (
          <div className="flex justify-center py-3 cursor-grab active:cursor-grabbing">
            <div className="w-12 h-1.5 bg-white/20 rounded-full" />
          </div>
        )}

        {/* Header */}
        {header && (
          <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
            {header}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-full hover:bg-white/10 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label="닫기"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto overscroll-contain p-4 safe-area-inset-bottom">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="px-4 py-3 border-t border-white/10 safe-area-inset-bottom">
            {footer}
          </div>
        )}
      </div>
    </>
  );

  return createPortal(drawerContent, document.body);
}


