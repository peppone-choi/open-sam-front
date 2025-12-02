'use client';

import React, { useState, useRef, useEffect, ReactNode, useId } from 'react';

interface TooltipProps {
  content: ReactNode;
  children: ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
  className?: string;
}

/**
 * 접근성을 갖춘 CSS 기반 Tooltip 컴포넌트
 * - role="tooltip" 적용
 * - aria-describedby로 트리거와 연결
 * - 포커스/블러 이벤트 지원
 */
export function Tooltip({ 
  content, 
  children, 
  position = 'top', 
  delay = 200,
  className = ''
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const triggerRef = useRef<HTMLSpanElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const tooltipId = useId();

  const showTooltip = () => {
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
    }, delay);
  };

  const hideTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
  };

  useEffect(() => {
    if (isVisible && triggerRef.current && tooltipRef.current) {
      const triggerRect = triggerRef.current.getBoundingClientRect();
      const tooltipRect = tooltipRef.current.getBoundingClientRect();
      
      let x = 0;
      let y = 0;
      
      switch (position) {
        case 'top':
          x = triggerRect.left + (triggerRect.width / 2) - (tooltipRect.width / 2);
          y = triggerRect.top - tooltipRect.height - 8;
          break;
        case 'bottom':
          x = triggerRect.left + (triggerRect.width / 2) - (tooltipRect.width / 2);
          y = triggerRect.bottom + 8;
          break;
        case 'left':
          x = triggerRect.left - tooltipRect.width - 8;
          y = triggerRect.top + (triggerRect.height / 2) - (tooltipRect.height / 2);
          break;
        case 'right':
          x = triggerRect.right + 8;
          y = triggerRect.top + (triggerRect.height / 2) - (tooltipRect.height / 2);
          break;
      }
      
      // 화면 밖으로 나가지 않도록 조정
      const padding = 8;
      x = Math.max(padding, Math.min(x, window.innerWidth - tooltipRect.width - padding));
      y = Math.max(padding, Math.min(y, window.innerHeight - tooltipRect.height - padding));
      
      setCoords({ x, y });
    }
  }, [isVisible, position]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // content가 없거나 빈 문자열이면 tooltip 표시하지 않음
  if (!content) {
    return <>{children}</>;
  }

  return (
    <>
      <span
        ref={triggerRef}
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
        onFocus={showTooltip}
        onBlur={hideTooltip}
        aria-describedby={isVisible ? tooltipId : undefined}
        className={`inline-block ${className}`}
      >
        {children}
      </span>
      {isVisible && (
        <div
          ref={tooltipRef}
          id={tooltipId}
          role="tooltip"
          aria-hidden={!isVisible}
          className="fixed z-[9999] px-3 py-2 text-xs font-medium text-white bg-gray-900/95 rounded-lg shadow-lg backdrop-blur-sm border border-white/10 max-w-xs pointer-events-none animate-fadeIn"
          style={{
            left: coords.x,
            top: coords.y,
          }}
        >
          {content}
          {/* 화살표 */}
          <div 
            className={`absolute w-2 h-2 bg-gray-900/95 border-white/10 transform rotate-45 ${
              position === 'top' ? 'bottom-[-5px] left-1/2 -translate-x-1/2 border-r border-b' :
              position === 'bottom' ? 'top-[-5px] left-1/2 -translate-x-1/2 border-l border-t' :
              position === 'left' ? 'right-[-5px] top-1/2 -translate-y-1/2 border-t border-r' :
              'left-[-5px] top-1/2 -translate-y-1/2 border-b border-l'
            }`}
            aria-hidden="true"
          />
        </div>
      )}
    </>
  );
}

/**
 * 간단한 inline 스타일 Tooltip (title 속성 대체)
 * 더 가벼운 버전
 */
export function SimpleTooltip({ 
  content, 
  children,
  className = ''
}: { 
  content: string | undefined; 
  children: ReactNode;
  className?: string;
}) {
  if (!content) {
    return <>{children}</>;
  }

  return (
    <span 
      className={`relative group inline-block ${className}`}
    >
      {children}
      <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-900/95 rounded whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 pointer-events-none">
        {content}
        <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900/95" />
      </span>
    </span>
  );
}

export default Tooltip;




