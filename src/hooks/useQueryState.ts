'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useCallback, useMemo } from 'react';

/**
 * URL 쿼리 파라미터와 동기화된 상태를 관리하는 훅
 * window.location.href 대신 Next.js router를 사용하여 페이지 새로고침 없이 URL 업데이트
 */
export function useQueryState<T extends string | number | undefined>(
  key: string,
  defaultValue?: T
): [T, (value: T) => void] {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const value = useMemo(() => {
    const param = searchParams?.get(key);
    if (param === null || param === undefined) {
      return defaultValue as T;
    }
    // 숫자 타입인 경우 변환
    if (typeof defaultValue === 'number') {
      return Number(param) as T;
    }
    return param as T;
  }, [searchParams, key, defaultValue]);

  const setValue = useCallback(
    (newValue: T) => {
      const params = new URLSearchParams(searchParams?.toString() || '');
      
      if (newValue === undefined || newValue === null || newValue === '') {
        params.delete(key);
      } else {
        params.set(key, String(newValue));
      }
      
      const queryString = params.toString();
      const newUrl = queryString ? `${pathname}?${queryString}` : pathname;
      router.push(newUrl, { scroll: false });
    },
    [router, pathname, searchParams, key]
  );

  return [value, setValue];
}

/**
 * 여러 쿼리 파라미터를 한번에 업데이트하는 훅
 */
export function useQueryParams() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const setParams = useCallback(
    (updates: Record<string, string | number | undefined | null>) => {
      const params = new URLSearchParams(searchParams?.toString() || '');
      
      Object.entries(updates).forEach(([key, value]) => {
        if (value === undefined || value === null || value === '') {
          params.delete(key);
        } else {
          params.set(key, String(value));
        }
      });
      
      const queryString = params.toString();
      const newUrl = queryString ? `${pathname}?${queryString}` : pathname;
      router.push(newUrl, { scroll: false });
    },
    [router, pathname, searchParams]
  );

  const getParam = useCallback(
    (key: string, defaultValue?: string) => {
      return searchParams?.get(key) ?? defaultValue;
    },
    [searchParams]
  );

  const getNumParam = useCallback(
    (key: string, defaultValue?: number) => {
      const value = searchParams?.get(key);
      if (value === null || value === undefined) return defaultValue;
      const num = Number(value);
      return Number.isFinite(num) ? num : defaultValue;
    },
    [searchParams]
  );

  return { setParams, getParam, getNumParam };
}


