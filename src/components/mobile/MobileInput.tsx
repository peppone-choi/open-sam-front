'use client';

import React, { forwardRef, useState } from 'react';
import { cn } from '@/lib/utils';

interface MobileInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  /** 라벨 */
  label?: string;
  /** 에러 메시지 */
  error?: string;
  /** 도움말 텍스트 */
  helperText?: string;
  /** 입력 크기 */
  size?: 'sm' | 'md' | 'lg';
  /** 왼쪽 아이콘/요소 */
  leftAddon?: React.ReactNode;
  /** 오른쪽 아이콘/요소 */
  rightAddon?: React.ReactNode;
  /** 전체 너비 */
  fullWidth?: boolean;
}

// 터치 타겟 최소 44px 보장
const sizeClasses = {
  sm: 'min-h-[44px] px-3 py-2 text-sm',
  md: 'min-h-[48px] px-4 py-2.5 text-base',
  lg: 'min-h-[56px] px-5 py-3 text-lg',
};

/**
 * 모바일 최적화 입력 컴포넌트
 * - 터치 타겟 크기 44px 이상 보장
 * - 모바일 키보드 최적화
 * - 접근성 지원
 */
const MobileInput = forwardRef<HTMLInputElement, MobileInputProps>(
  (
    {
      label,
      error,
      helperText,
      size = 'md',
      leftAddon,
      rightAddon,
      fullWidth = true,
      className,
      id,
      ...props
    },
    ref
  ) => {
    const [isFocused, setIsFocused] = useState(false);
    const inputId = id || `input-${Math.random().toString(36).slice(2, 9)}`;

    return (
      <div className={cn('flex flex-col gap-1.5', fullWidth && 'w-full')}>
        {/* Label */}
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-foreground-muted"
          >
            {label}
          </label>
        )}

        {/* Input Container */}
        <div
          className={cn(
            'relative flex items-center',
            'bg-background-tertiary/80 rounded-xl',
            'border-2 transition-all duration-200',
            isFocused
              ? 'border-primary ring-2 ring-primary/20'
              : error
              ? 'border-red-500'
              : 'border-white/10 hover:border-white/20',
            'tap-highlight-none'
          )}
        >
          {/* Left Addon */}
          {leftAddon && (
            <div className="flex-shrink-0 pl-3 text-foreground-muted">
              {leftAddon}
            </div>
          )}

          {/* Input */}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              'flex-1 bg-transparent text-foreground placeholder-foreground-muted/50',
              'focus:outline-none',
              // 모바일 최적화
              'touch-manipulation',
              // iOS 입력 줌 방지 (font-size 16px 이상)
              'text-[16px] sm:text-sm',
              sizeClasses[size],
              leftAddon && 'pl-2',
              rightAddon && 'pr-2',
              className
            )}
            onFocus={(e) => {
              setIsFocused(true);
              props.onFocus?.(e);
            }}
            onBlur={(e) => {
              setIsFocused(false);
              props.onBlur?.(e);
            }}
            aria-invalid={!!error}
            aria-describedby={
              error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined
            }
            {...props}
          />

          {/* Right Addon */}
          {rightAddon && (
            <div className="flex-shrink-0 pr-3 text-foreground-muted">
              {rightAddon}
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <p
            id={`${inputId}-error`}
            className="text-sm text-red-400 flex items-center gap-1"
            role="alert"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm-1-7v2h2v-2h-2zm0-8v6h2V7h-2z" />
            </svg>
            {error}
          </p>
        )}

        {/* Helper Text */}
        {!error && helperText && (
          <p id={`${inputId}-helper`} className="text-sm text-foreground-muted">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

MobileInput.displayName = 'MobileInput';

export default MobileInput;


