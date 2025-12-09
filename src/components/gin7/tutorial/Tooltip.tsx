'use client';

import { useState, useRef, useCallback, useEffect, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { TooltipDefinition } from '@/types/gin7/tutorial';

interface TooltipProps {
  /** 툴팁 내용 - 문자열 또는 TooltipDefinition */
  content: string | TooltipDefinition;
  /** 자식 요소 */
  children: ReactNode;
  /** 트리거 방식 */
  trigger?: 'hover' | 'click';
  /** 표시 위치 */
  position?: 'top' | 'bottom' | 'left' | 'right';
  /** 표시 지연 (ms) */
  delay?: number;
  /** 추가 클래스 */
  className?: string;
  /** 비활성화 */
  disabled?: boolean;
}

const categoryConfig = {
  stat: { color: 'text-blue-400', label: '능력치' },
  command: { color: 'text-purple-400', label: '명령' },
  term: { color: 'text-amber-400', label: '용어' },
  unit: { color: 'text-green-400', label: '유닛' },
  faction: { color: 'text-red-400', label: '세력' },
};

export default function Tooltip({
  content,
  children,
  trigger = 'hover',
  position = 'top',
  delay = 200,
  className,
  disabled = false,
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();

  // 위치 계산
  const calculatePosition = useCallback(() => {
    if (!triggerRef.current || !tooltipRef.current) return;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    const margin = 8;

    let x = 0;
    let y = 0;

    switch (position) {
      case 'top':
        x = triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2;
        y = triggerRect.top - tooltipRect.height - margin;
        break;
      case 'bottom':
        x = triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2;
        y = triggerRect.bottom + margin;
        break;
      case 'left':
        x = triggerRect.left - tooltipRect.width - margin;
        y = triggerRect.top + triggerRect.height / 2 - tooltipRect.height / 2;
        break;
      case 'right':
        x = triggerRect.right + margin;
        y = triggerRect.top + triggerRect.height / 2 - tooltipRect.height / 2;
        break;
    }

    // 화면 경계 체크
    const padding = 8;
    x = Math.max(padding, Math.min(x, window.innerWidth - tooltipRect.width - padding));
    y = Math.max(padding, Math.min(y, window.innerHeight - tooltipRect.height - padding));

    setCoords({ x, y });
  }, [position]);

  // 표시
  const show = useCallback(() => {
    if (disabled) return;
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
    }, delay);
  }, [delay, disabled]);

  // 숨기기
  const hide = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
  }, []);

  // 토글
  const toggle = useCallback(() => {
    if (disabled) return;
    setIsVisible(prev => !prev);
  }, [disabled]);

  // 위치 업데이트
  useEffect(() => {
    if (isVisible) {
      calculatePosition();
      window.addEventListener('scroll', calculatePosition, true);
      window.addEventListener('resize', calculatePosition);
    }
    return () => {
      window.removeEventListener('scroll', calculatePosition, true);
      window.removeEventListener('resize', calculatePosition);
    };
  }, [isVisible, calculatePosition]);

  // 클린업
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // 클릭 외부 감지 (click 트리거용)
  useEffect(() => {
    if (trigger !== 'click' || !isVisible) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node) &&
        tooltipRef.current &&
        !tooltipRef.current.contains(e.target as Node)
      ) {
        hide();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [trigger, isVisible, hide]);

  const isDefinition = typeof content !== 'string';

  return (
    <>
      {/* 트리거 요소 */}
      <div
        ref={triggerRef}
        className={cn('inline-block', className)}
        onMouseEnter={trigger === 'hover' ? show : undefined}
        onMouseLeave={trigger === 'hover' ? hide : undefined}
        onClick={trigger === 'click' ? toggle : undefined}
      >
        {children}
      </div>

      {/* 툴팁 */}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            ref={tooltipRef}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="fixed z-[300] pointer-events-none"
            style={{ left: coords.x, top: coords.y }}
          >
            {isDefinition ? (
              <DefinitionTooltip definition={content as TooltipDefinition} />
            ) : (
              <SimpleTooltip text={content as string} />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

/** 단순 텍스트 툴팁 */
function SimpleTooltip({ text }: { text: string }) {
  return (
    <div className="px-3 py-2 rounded-lg bg-slate-900/95 border border-white/10 shadow-xl backdrop-blur-sm">
      <p className="text-sm text-foreground">{text}</p>
    </div>
  );
}

/** 정의형 툴팁 (용어 사전) */
function DefinitionTooltip({ definition }: { definition: TooltipDefinition }) {
  const config = categoryConfig[definition.category];

  return (
    <div className="w-[280px] rounded-xl bg-slate-900/95 border border-white/10 shadow-xl backdrop-blur-sm overflow-hidden">
      {/* 헤더 */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-white/5 bg-white/5">
        {definition.icon && (
          <span className="text-lg">{definition.icon}</span>
        )}
        <div className="flex-1">
          <h4 className="font-semibold text-foreground">{definition.term}</h4>
          <span className={cn('text-xs', config.color)}>
            {config.label}
          </span>
        </div>
      </div>

      {/* 설명 */}
      <div className="px-3 py-2">
        <p className="text-sm text-foreground-muted leading-relaxed">
          {definition.description}
        </p>
      </div>

      {/* 링크 (있는 경우) */}
      {definition.link && (
        <div className="px-3 py-2 border-t border-white/5 bg-white/5">
          <a
            href={definition.link}
            className="text-xs text-primary hover:underline pointer-events-auto"
          >
            자세히 보기 →
          </a>
        </div>
      )}
    </div>
  );
}

/** 용어 자동 툴팁 래퍼 */
interface TooltipTermProps {
  term: string;
  definition: TooltipDefinition;
  className?: string;
}

export function TooltipTerm({ term, definition, className }: TooltipTermProps) {
  const config = categoryConfig[definition.category];

  return (
    <Tooltip content={definition} trigger="hover">
      <span
        className={cn(
          'border-b border-dotted cursor-help',
          config.color,
          className
        )}
      >
        {term}
      </span>
    </Tooltip>
  );
}













