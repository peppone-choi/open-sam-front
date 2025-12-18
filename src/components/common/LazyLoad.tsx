// @ts-nocheck
'use client';

import React, { useState, useRef, useEffect, Suspense, ComponentType } from 'react';
import { cn } from '@/lib/utils';

interface LazyLoadProps {
  children: React.ReactNode;
  /** 뷰포트 진입 전 여백 (미리 로딩) */
  rootMargin?: string;
  /** 뷰포트 교차 임계값 */
  threshold?: number;
  /** 로딩 중 표시할 컴포넌트 */
  fallback?: React.ReactNode;
  /** 추가 클래스 */
  className?: string;
  /** 최소 높이 (CLS 방지) */
  minHeight?: number | string;
  /** 한 번 로드 후 계속 표시 */
  once?: boolean;
}

/**
 * 레이지 로딩 래퍼 컴포넌트
 * - Intersection Observer 기반
 * - CLS(Cumulative Layout Shift) 방지
 * - 커스텀 fallback 지원
 */
export default function LazyLoad({
  children,
  rootMargin = '200px',
  threshold = 0.1,
  fallback,
  className,
  minHeight = 100,
  once = true,
}: LazyLoadProps) {
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (once) {
            observer.disconnect();
          }
        } else if (!once) {
          setIsVisible(false);
        }
      },
      {
        rootMargin,
        threshold,
      }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [rootMargin, threshold, once]);

  return (
    <div
      ref={containerRef}
      className={cn(className)}
      style={{
        minHeight: isVisible ? 'auto' : typeof minHeight === 'number' ? `${minHeight}px` : minHeight,
      }}
    >
      {isVisible ? children : (fallback ?? <LoadingSkeleton minHeight={minHeight} />)}
    </div>
  );
}

/**
 * 기본 로딩 스켈레톤
 */
function LoadingSkeleton({ minHeight }: { minHeight: number | string }) {
  return (
    <div
      className="w-full bg-background-tertiary/50 animate-pulse rounded-lg"
      style={{
        minHeight: typeof minHeight === 'number' ? `${minHeight}px` : minHeight,
      }}
    />
  );
}

/**
 * 동적 임포트된 컴포넌트용 레이지 로딩
 */
interface LazyComponentProps<P = object> {
  /** 동적 임포트 함수 */
  importFn: () => Promise<{ default: ComponentType<P> }>;
  /** 컴포넌트에 전달할 props */
  componentProps?: P;
  /** 로딩 중 fallback */
  fallback?: React.ReactNode;
  /** 뷰포트 진입 여백 */
  rootMargin?: string;
}

export function LazyComponent<P = object>({
  importFn,
  componentProps,
  fallback,
  rootMargin = '200px',
}: LazyComponentProps<P>) {
  const [Component, setComponent] = useState<ComponentType<P> | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Intersection Observer
  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [rootMargin]);

  // 컴포넌트 로딩
  useEffect(() => {
    if (!isVisible) return;

    let mounted = true;

    importFn().then((module) => {
      if (mounted) {
        setComponent(() => module.default);
      }
    });

    return () => {
      mounted = false;
    };
  }, [isVisible, importFn]);

  return (
    <div ref={containerRef}>
      {Component ? (
        <Component {...(componentProps as P)} />
      ) : (
        fallback ?? <LoadingSkeleton minHeight={100} />
      )}
    </div>
  );
}

/**
 * 리스트 아이템 레이지 로딩
 * 가상화 없이 간단한 레이지 로딩 제공
 */
interface LazyListProps<T> {
  /** 렌더링할 아이템 배열 */
  items: T[];
  /** 아이템 렌더링 함수 */
  renderItem: (item: T, index: number) => React.ReactNode;
  /** 아이템 키 추출 함수 */
  keyExtractor: (item: T, index: number) => string | number;
  /** 초기 표시 개수 */
  initialCount?: number;
  /** 추가 로드 개수 */
  loadMoreCount?: number;
  /** 리스트 컨테이너 클래스 */
  className?: string;
  /** 아이템 컨테이너 클래스 */
  itemClassName?: string;
  /** 더 보기 버튼 표시 */
  showLoadMore?: boolean;
}

export function LazyList<T>({
  items,
  renderItem,
  keyExtractor,
  initialCount = 10,
  loadMoreCount = 10,
  className,
  itemClassName,
  showLoadMore = true,
}: LazyListProps<T>) {
  const [displayCount, setDisplayCount] = useState(initialCount);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // 자동 로드 (Intersection Observer)
  useEffect(() => {
    if (!showLoadMore || displayCount >= items.length) return;

    const element = loadMoreRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setDisplayCount((prev) => Math.min(prev + loadMoreCount, items.length));
        }
      },
      { rootMargin: '100px' }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [displayCount, items.length, loadMoreCount, showLoadMore]);

  const visibleItems = items.slice(0, displayCount);
  const hasMore = displayCount < items.length;

  return (
    <div className={cn('space-y-2', className)}>
      {visibleItems.map((item, index) => (
        <div key={keyExtractor(item, index)} className={itemClassName}>
          {renderItem(item, index)}
        </div>
      ))}
      
      {/* Load More Trigger */}
      {hasMore && showLoadMore && (
        <div ref={loadMoreRef} className="py-4 flex justify-center">
          <div className="h-8 w-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
}


