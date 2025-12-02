'use client';

import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface MobileButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** 버튼 변형 */
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
  /** 버튼 크기 (모바일 터치 타겟 기준) */
  size?: 'sm' | 'md' | 'lg';
  /** 전체 너비 */
  fullWidth?: boolean;
  /** 로딩 상태 */
  loading?: boolean;
  /** 아이콘 (왼쪽) */
  leftIcon?: React.ReactNode;
  /** 아이콘 (오른쪽) */
  rightIcon?: React.ReactNode;
}

const variantClasses = {
  primary: cn(
    'bg-primary text-white',
    'hover:bg-primary-hover active:bg-primary-hover',
    'shadow-lg shadow-primary/20'
  ),
  secondary: cn(
    'bg-secondary text-white',
    'hover:bg-secondary-hover active:bg-secondary-hover',
    'shadow-lg shadow-secondary/20'
  ),
  ghost: cn(
    'bg-transparent text-foreground',
    'hover:bg-white/10 active:bg-white/20'
  ),
  danger: cn(
    'bg-red-600 text-white',
    'hover:bg-red-700 active:bg-red-700',
    'shadow-lg shadow-red-600/20'
  ),
  outline: cn(
    'bg-transparent text-foreground border-2 border-white/20',
    'hover:bg-white/10 hover:border-white/30',
    'active:bg-white/20'
  ),
};

// 터치 타겟 최소 44px 보장
const sizeClasses = {
  sm: 'min-h-[44px] px-3 py-2 text-sm',
  md: 'min-h-[48px] px-4 py-2.5 text-base',
  lg: 'min-h-[56px] px-6 py-3 text-lg',
};

/**
 * 모바일 최적화 버튼 컴포넌트
 * - 터치 타겟 크기 44px 이상 보장
 * - 터치 피드백 (active:scale)
 * - tap-highlight 제거
 */
const MobileButton = forwardRef<HTMLButtonElement, MobileButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      fullWidth = false,
      loading = false,
      leftIcon,
      rightIcon,
      disabled,
      children,
      className,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          // 기본 스타일
          'inline-flex items-center justify-center gap-2',
          'font-medium rounded-xl',
          'transition-all duration-200',
          // 터치 최적화
          'tap-highlight-none',
          'active:scale-[0.97]',
          'touch-manipulation',
          // 포커스 스타일
          'focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 focus:ring-offset-background-main',
          // 비활성화
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100',
          // 변형 및 크기
          variantClasses[variant],
          sizeClasses[size],
          fullWidth && 'w-full',
          className
        )}
        {...props}
      >
        {loading ? (
          <svg
            className="animate-spin h-5 w-5"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        ) : (
          <>
            {leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
            {children}
            {rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
          </>
        )}
      </button>
    );
  }
);

MobileButton.displayName = 'MobileButton';

export default MobileButton;


