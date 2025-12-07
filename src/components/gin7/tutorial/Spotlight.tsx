'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { SpotlightPointerPosition, TutorialStep } from '@/types/gin7/tutorial';

interface SpotlightProps {
  /** 활성화 여부 */
  isActive: boolean;
  /** 타겟 요소 CSS 선택자 */
  targetSelector?: string;
  /** 현재 튜토리얼 단계 */
  step?: TutorialStep;
  /** 하이라이트 패딩 */
  padding?: number;
  /** 다음 단계로 진행 */
  onNext?: () => void;
  /** 튜토리얼 스킵 */
  onSkip?: () => void;
  /** 닫기/완료 */
  onClose?: () => void;
  /** 현재 단계 번호 */
  currentStepNumber?: number;
  /** 전체 단계 수 */
  totalSteps?: number;
}

interface TargetRect {
  top: number;
  left: number;
  width: number;
  height: number;
  centerX: number;
  centerY: number;
}

export default function Spotlight({
  isActive,
  targetSelector,
  step,
  padding = 8,
  onNext,
  onSkip,
  onClose,
  currentStepNumber = 1,
  totalSteps = 1,
}: SpotlightProps) {
  const [targetRect, setTargetRect] = useState<TargetRect | null>(null);
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });

  // 윈도우 크기 추적
  useEffect(() => {
    const updateSize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // 타겟 요소 위치 계산
  const calculateTargetRect = useCallback(() => {
    if (!targetSelector) {
      setTargetRect(null);
      return;
    }

    const element = document.querySelector(targetSelector);
    if (!element) {
      setTargetRect(null);
      return;
    }

    const rect = element.getBoundingClientRect();
    setTargetRect({
      top: rect.top - padding,
      left: rect.left - padding,
      width: rect.width + padding * 2,
      height: rect.height + padding * 2,
      centerX: rect.left + rect.width / 2,
      centerY: rect.top + rect.height / 2,
    });
  }, [targetSelector, padding]);

  // 타겟 위치 업데이트
  useEffect(() => {
    if (!isActive) return;

    calculateTargetRect();
    
    // ResizeObserver로 타겟 요소 변화 감지
    const observer = new MutationObserver(calculateTargetRect);
    observer.observe(document.body, { childList: true, subtree: true, attributes: true });

    // 스크롤 시에도 업데이트
    const handleScroll = () => calculateTargetRect();
    window.addEventListener('scroll', handleScroll, true);

    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [isActive, calculateTargetRect]);

  // 포인터 위치 계산
  const pointerStyle = useMemo(() => {
    if (!targetRect || !step?.pointerPosition) return {};

    const pos = step.pointerPosition;
    const arrowSize = 12;

    const positions: Record<SpotlightPointerPosition, React.CSSProperties> = {
      top: {
        left: targetRect.centerX,
        top: targetRect.top - arrowSize - 8,
        transform: 'translateX(-50%) rotate(180deg)',
      },
      bottom: {
        left: targetRect.centerX,
        top: targetRect.top + targetRect.height + 8,
        transform: 'translateX(-50%)',
      },
      left: {
        left: targetRect.left - arrowSize - 8,
        top: targetRect.centerY,
        transform: 'translateY(-50%) rotate(90deg)',
      },
      right: {
        left: targetRect.left + targetRect.width + 8,
        top: targetRect.centerY,
        transform: 'translateY(-50%) rotate(-90deg)',
      },
      'top-left': {
        left: targetRect.left + 20,
        top: targetRect.top - arrowSize - 8,
        transform: 'rotate(180deg)',
      },
      'top-right': {
        left: targetRect.left + targetRect.width - 20,
        top: targetRect.top - arrowSize - 8,
        transform: 'rotate(180deg)',
      },
      'bottom-left': {
        left: targetRect.left + 20,
        top: targetRect.top + targetRect.height + 8,
      },
      'bottom-right': {
        left: targetRect.left + targetRect.width - 20,
        top: targetRect.top + targetRect.height + 8,
      },
    };

    return positions[pos];
  }, [targetRect, step?.pointerPosition]);

  // 다이얼로그 위치 계산
  const dialogPosition = useMemo(() => {
    if (!targetRect) {
      // 중앙 모달
      return {
        position: 'fixed' as const,
        left: '50%',
        top: '50%',
        transform: 'translate(-50%, -50%)',
      };
    }

    const dialogWidth = 360;
    const dialogHeight = 200;
    const margin = 16;

    // 가장 넓은 공간 찾기
    const spaces = {
      bottom: windowSize.height - (targetRect.top + targetRect.height) - margin,
      top: targetRect.top - margin,
      right: windowSize.width - (targetRect.left + targetRect.width) - margin,
      left: targetRect.left - margin,
    };

    const bestPosition = Object.entries(spaces).reduce((a, b) => 
      spaces[a[0] as keyof typeof spaces] > spaces[b[0] as keyof typeof spaces] ? a : b
    )[0] as keyof typeof spaces;

    const positions = {
      bottom: {
        left: Math.min(
          Math.max(margin, targetRect.centerX - dialogWidth / 2),
          windowSize.width - dialogWidth - margin
        ),
        top: targetRect.top + targetRect.height + margin + 12,
      },
      top: {
        left: Math.min(
          Math.max(margin, targetRect.centerX - dialogWidth / 2),
          windowSize.width - dialogWidth - margin
        ),
        top: targetRect.top - dialogHeight - margin - 12,
      },
      right: {
        left: targetRect.left + targetRect.width + margin + 12,
        top: Math.min(
          Math.max(margin, targetRect.centerY - dialogHeight / 2),
          windowSize.height - dialogHeight - margin
        ),
      },
      left: {
        left: targetRect.left - dialogWidth - margin - 12,
        top: Math.min(
          Math.max(margin, targetRect.centerY - dialogHeight / 2),
          windowSize.height - dialogHeight - margin
        ),
      },
    };

    return {
      position: 'fixed' as const,
      ...positions[bestPosition],
    };
  }, [targetRect, windowSize]);

  // 키보드 이벤트
  useEffect(() => {
    if (!isActive) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Enter':
        case 'Space':
          e.preventDefault();
          onNext?.();
          break;
        case 'Escape':
          e.preventDefault();
          onSkip?.();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isActive, onNext, onSkip]);

  if (!isActive || !step) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] pointer-events-auto"
      >
        {/* 오버레이 마스크 */}
        <svg className="absolute inset-0 w-full h-full">
          <defs>
            <mask id="spotlight-mask">
              <rect x="0" y="0" width="100%" height="100%" fill="white" />
              {targetRect && (
                <motion.rect
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  x={targetRect.left}
                  y={targetRect.top}
                  width={targetRect.width}
                  height={targetRect.height}
                  rx="8"
                  fill="black"
                />
              )}
            </mask>
          </defs>
          <rect
            x="0"
            y="0"
            width="100%"
            height="100%"
            fill="rgba(0, 0, 0, 0.75)"
            mask="url(#spotlight-mask)"
          />
        </svg>

        {/* 하이라이트 테두리 */}
        {targetRect && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute rounded-lg ring-2 ring-primary ring-offset-2 ring-offset-transparent pointer-events-none"
            style={{
              top: targetRect.top,
              left: targetRect.left,
              width: targetRect.width,
              height: targetRect.height,
            }}
          >
            {/* 펄스 애니메이션 */}
            <div className="absolute inset-0 rounded-lg animate-pulse bg-primary/20" />
          </motion.div>
        )}

        {/* 화살표 포인터 */}
        {targetRect && step.pointerPosition && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="absolute pointer-events-none"
            style={pointerStyle}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              className="text-primary drop-shadow-glow"
            >
              <path
                d="M12 4L4 16h16L12 4z"
                fill="currentColor"
              />
            </svg>
          </motion.div>
        )}

        {/* 튜토리얼 다이얼로그 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ delay: 0.1 }}
          className={cn(
            'w-[360px] rounded-2xl border border-white/10 bg-space-panel/95 backdrop-blur-xl shadow-2xl',
            'pointer-events-auto'
          )}
          style={dialogPosition}
        >
          {/* 헤더 */}
          <div className="flex items-center justify-between p-4 border-b border-white/5">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                <span className="text-primary font-bold">{currentStepNumber}</span>
              </div>
              <h3 className="font-semibold text-foreground">{step.title}</h3>
            </div>
            <span className="text-sm text-foreground-muted">
              {currentStepNumber} / {totalSteps}
            </span>
          </div>

          {/* 내용 */}
          <div className="p-4">
            <p className="text-foreground-muted leading-relaxed">
              {step.description}
            </p>
          </div>

          {/* 푸터 */}
          <div className="flex items-center justify-between p-4 border-t border-white/5">
            <button
              onClick={onSkip}
              className="text-sm text-foreground-muted hover:text-foreground transition-colors"
            >
              튜토리얼 건너뛰기
            </button>

            <div className="flex gap-2">
              {step.nextStep ? (
                <button
                  onClick={onNext}
                  className={cn(
                    'px-4 py-2 rounded-lg font-medium transition-all',
                    'bg-primary text-primary-foreground hover:bg-primary/90',
                    'focus:outline-none focus:ring-2 focus:ring-primary/50'
                  )}
                >
                  다음 →
                </button>
              ) : (
                <button
                  onClick={onClose}
                  className={cn(
                    'px-4 py-2 rounded-lg font-medium transition-all',
                    'bg-green-600 text-white hover:bg-green-500',
                    'focus:outline-none focus:ring-2 focus:ring-green-500/50'
                  )}
                >
                  완료 ✓
                </button>
              )}
            </div>
          </div>

          {/* 프로그레스 바 */}
          <div className="h-1 bg-white/5 rounded-b-2xl overflow-hidden">
            <motion.div
              className="h-full bg-primary"
              initial={{ width: 0 }}
              animate={{ width: `${(currentStepNumber / totalSteps) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}








