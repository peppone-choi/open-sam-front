'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

interface NavItem {
  /** 네비게이션 라벨 */
  label: string;
  /** 경로 */
  href: string;
  /** 아이콘 */
  icon: React.ReactNode;
  /** 배지 (알림 숫자 등) */
  badge?: number;
  /** 비활성화 */
  disabled?: boolean;
}

interface MobileBottomNavProps {
  /** 네비게이션 항목들 */
  items: NavItem[];
  /** 추가 클래스 */
  className?: string;
  /** 중앙 액션 버튼 */
  centerAction?: {
    icon: React.ReactNode;
    onClick: () => void;
    label: string;
    loading?: boolean;
  };
}

/**
 * 모바일 하단 네비게이션 컴포넌트
 * - 터치 타겟 크기 44px 이상 보장
 * - Safe Area 지원
 * - 배지 및 중앙 액션 버튼 지원
 */
export default function MobileBottomNav({
  items,
  className,
  centerAction,
}: MobileBottomNavProps) {
  const pathname = usePathname();

  // 중앙 액션 버튼이 있을 경우 아이템을 반으로 나눔
  const leftItems = centerAction ? items.slice(0, Math.floor(items.length / 2)) : items.slice(0, Math.ceil(items.length / 2));
  const rightItems = centerAction ? items.slice(Math.floor(items.length / 2)) : items.slice(Math.ceil(items.length / 2));

  const renderNavItem = (item: NavItem) => {
    const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
    
    if (item.disabled) {
      return (
        <div
          key={item.href}
          className={cn(
            'flex flex-col items-center justify-center gap-0.5',
            'min-w-[64px] min-h-[56px] px-2 py-1',
            'text-foreground-muted/40 cursor-not-allowed'
          )}
        >
          <div className="relative">
            {item.icon}
          </div>
          <span className="text-[10px] font-medium truncate max-w-[60px]">
            {item.label}
          </span>
        </div>
      );
    }

    return (
      <Link
        key={item.href}
        href={item.href}
        className={cn(
          'flex flex-col items-center justify-center gap-0.5',
          'min-w-[64px] min-h-[56px] px-2 py-1',
          'tap-highlight-none touch-manipulation',
          'transition-all duration-200',
          'active:scale-95',
          isActive
            ? 'text-primary'
            : 'text-foreground-muted hover:text-foreground'
        )}
      >
        <div className={cn(
          'relative p-1.5 rounded-xl transition-all duration-200',
          isActive && 'bg-primary/10 scale-110'
        )}>
          {item.icon}
          {/* Badge */}
          {item.badge !== undefined && item.badge > 0 && (
            <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-red-500 rounded-full">
              {item.badge > 99 ? '99+' : item.badge}
            </span>
          )}
        </div>
        <span className="text-[10px] font-medium truncate max-w-[60px]">
          {item.label}
        </span>
        {/* Active indicator */}
        {isActive && (
          <span className="absolute bottom-1.5 w-1 h-1 rounded-full bg-primary" />
        )}
      </Link>
    );
  };

  return (
    <nav
      className={cn(
        'fixed bottom-0 left-0 right-0 z-50',
        'bg-background-main/95 backdrop-blur-xl',
        'border-t border-white/10',
        'safe-area-inset-bottom',
        'lg:hidden', // 데스크톱에서 숨김
        className
      )}
    >
      <div className="flex items-center justify-around px-2 h-16">
        {/* Left Items */}
        {leftItems.map(renderNavItem)}

        {/* Center Action Button */}
        {centerAction && (
          <div className="relative -top-4">
            <button
              type="button"
              onClick={centerAction.onClick}
              disabled={centerAction.loading}
              className={cn(
                'w-14 h-14 rounded-full flex items-center justify-center',
                'shadow-lg border-4 border-background-main',
                'transition-all duration-200',
                'tap-highlight-none touch-manipulation',
                'active:scale-95',
                centerAction.loading
                  ? 'bg-background-tertiary animate-pulse'
                  : 'bg-primary hover:bg-primary-hover text-white'
              )}
              aria-label={centerAction.label}
            >
              {centerAction.loading ? (
                <svg
                  className="animate-spin h-6 w-6 text-white"
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
                centerAction.icon
              )}
            </button>
          </div>
        )}

        {/* Right Items */}
        {rightItems.map(renderNavItem)}
      </div>
    </nav>
  );
}


