'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface ResponsiveContainerProps {
  children: React.ReactNode;
  /** 최대 너비 */
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  /** 패딩 */
  padding?: 'none' | 'sm' | 'md' | 'lg';
  /** 중앙 정렬 */
  centered?: boolean;
  /** 수직 스크롤 활성화 */
  scrollable?: boolean;
  /** Safe Area 적용 */
  safeArea?: boolean;
  /** 추가 클래스 */
  className?: string;
  /** 하단 네비게이션 여백 (모바일) */
  bottomNavPadding?: boolean;
}

const maxWidthClasses = {
  sm: 'max-w-screen-sm',
  md: 'max-w-screen-md',
  lg: 'max-w-screen-lg',
  xl: 'max-w-screen-xl',
  '2xl': 'max-w-screen-2xl',
  full: 'max-w-full',
};

const paddingClasses = {
  none: '',
  sm: 'px-2 py-2 sm:px-4 sm:py-4',
  md: 'px-4 py-4 sm:px-6 sm:py-6',
  lg: 'px-4 py-6 sm:px-8 sm:py-8',
};

/**
 * 반응형 컨테이너 컴포넌트
 * - 모바일/태블릿/데스크톱 대응
 * - Safe Area 지원
 * - 하단 네비게이션 여백 지원
 */
export default function ResponsiveContainer({
  children,
  maxWidth = 'lg',
  padding = 'md',
  centered = true,
  scrollable = false,
  safeArea = false,
  bottomNavPadding = false,
  className,
}: ResponsiveContainerProps) {
  return (
    <div
      className={cn(
        'w-full',
        maxWidthClasses[maxWidth],
        paddingClasses[padding],
        centered && 'mx-auto',
        scrollable && 'overflow-y-auto overscroll-contain',
        safeArea && 'safe-area-inset-top safe-area-inset-bottom',
        // 하단 네비게이션 여백 (모바일에서만)
        bottomNavPadding && 'pb-20 lg:pb-4',
        className
      )}
    >
      {children}
    </div>
  );
}

/**
 * 모바일에서 숨기고 데스크톱에서 표시
 */
export function DesktopOnly({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('hidden lg:block', className)}>
      {children}
    </div>
  );
}

/**
 * 데스크톱에서 숨기고 모바일에서 표시
 */
export function MobileOnly({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('block lg:hidden', className)}>
      {children}
    </div>
  );
}

/**
 * 태블릿 이상에서만 표시
 */
export function TabletUp({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('hidden sm:block', className)}>
      {children}
    </div>
  );
}

/**
 * 태블릿 이하에서만 표시
 */
export function TabletDown({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('block sm:hidden', className)}>
      {children}
    </div>
  );
}


