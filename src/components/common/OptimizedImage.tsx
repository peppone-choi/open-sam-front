'use client';

import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface OptimizedImageProps {
  /** 이미지 소스 */
  src: string;
  /** 대체 텍스트 */
  alt: string;
  /** 너비 */
  width?: number | string;
  /** 높이 */
  height?: number | string;
  /** 레이지 로딩 활성화 */
  lazy?: boolean;
  /** 로딩 중 표시할 플레이스홀더 */
  placeholder?: 'blur' | 'skeleton' | 'none';
  /** 블러 플레이스홀더 데이터 URL */
  blurDataUrl?: string;
  /** 폴백 이미지 */
  fallbackSrc?: string;
  /** object-fit 스타일 */
  objectFit?: 'cover' | 'contain' | 'fill' | 'none';
  /** 추가 클래스 */
  className?: string;
  /** 우선순위 로딩 (LCP 이미지용) */
  priority?: boolean;
  /** 클릭 핸들러 */
  onClick?: () => void;
  /** 로드 완료 콜백 */
  onLoad?: () => void;
  /** 에러 콜백 */
  onError?: () => void;
}

/**
 * 최적화된 이미지 컴포넌트
 * - 레이지 로딩 (Intersection Observer)
 * - 플레이스홀더 (blur/skeleton)
 * - 에러 폴백
 * - 반응형 지원
 */
export default function OptimizedImage({
  src,
  alt,
  width,
  height,
  lazy = true,
  placeholder = 'skeleton',
  blurDataUrl,
  fallbackSrc = '/images/placeholder.png',
  objectFit = 'cover',
  className,
  priority = false,
  onClick,
  onLoad,
  onError,
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(!lazy || priority);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  // Intersection Observer로 뷰포트 진입 감지
  useEffect(() => {
    if (!lazy || priority || !imgRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: '100px', // 100px 전에 미리 로딩 시작
        threshold: 0.1,
      }
    );

    observer.observe(imgRef.current);

    return () => observer.disconnect();
  }, [lazy, priority]);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setHasError(true);
    onError?.();
  };

  const imageSrc = hasError ? fallbackSrc : src;

  // 스켈레톤 플레이스홀더
  const renderSkeleton = () => (
    <div
      className={cn(
        'absolute inset-0 bg-background-tertiary animate-pulse',
        isLoaded && 'opacity-0 transition-opacity duration-300'
      )}
    />
  );

  // 블러 플레이스홀더
  const renderBlur = () => (
    <div
      className={cn(
        'absolute inset-0 bg-cover bg-center blur-xl scale-110',
        isLoaded && 'opacity-0 transition-opacity duration-300'
      )}
      style={{
        backgroundImage: blurDataUrl ? `url(${blurDataUrl})` : undefined,
        backgroundColor: blurDataUrl ? undefined : 'var(--color-surface)',
      }}
    />
  );

  return (
    <div
      ref={imgRef}
      className={cn(
        'relative overflow-hidden',
        onClick && 'cursor-pointer',
        className
      )}
      style={{
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
      }}
      onClick={onClick}
    >
      {/* Placeholder */}
      {placeholder === 'skeleton' && renderSkeleton()}
      {placeholder === 'blur' && renderBlur()}

      {/* Image */}
      {isInView && (
        <img
          src={imageSrc}
          alt={alt}
          className={cn(
            'w-full h-full transition-opacity duration-300',
            !isLoaded && 'opacity-0',
            isLoaded && 'opacity-100',
            objectFit === 'cover' && 'object-cover',
            objectFit === 'contain' && 'object-contain',
            objectFit === 'fill' && 'object-fill',
            objectFit === 'none' && 'object-none'
          )}
          loading={lazy && !priority ? 'lazy' : 'eager'}
          decoding="async"
          onLoad={handleLoad}
          onError={handleError}
        />
      )}
    </div>
  );
}

/**
 * 프로필/아바타용 최적화 이미지
 */
interface AvatarImageProps extends Omit<OptimizedImageProps, 'width' | 'height'> {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

const avatarSizes = {
  xs: 24,
  sm: 32,
  md: 40,
  lg: 56,
  xl: 80,
};

export function AvatarImage({
  size = 'md',
  className,
  ...props
}: AvatarImageProps) {
  const pixelSize = avatarSizes[size];
  
  return (
    <OptimizedImage
      {...props}
      width={pixelSize}
      height={pixelSize}
      className={cn('rounded-full', className)}
      objectFit="cover"
      placeholder="skeleton"
    />
  );
}

/**
 * 게임 아이콘용 최적화 이미지
 */
interface GameIconProps extends Omit<OptimizedImageProps, 'lazy' | 'placeholder'> {
  /** 픽셀 아트 스타일 렌더링 */
  pixelated?: boolean;
}

export function GameIcon({
  pixelated = true,
  className,
  ...props
}: GameIconProps) {
  return (
    <OptimizedImage
      {...props}
      lazy={false}
      placeholder="none"
      className={cn(
        pixelated && 'rendering-pixelated',
        className
      )}
      style={{
        imageRendering: pixelated ? 'pixelated' : 'auto',
      } as React.CSSProperties}
    />
  );
}


