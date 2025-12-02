import { createNavigation } from 'next-intl/navigation';
import { routing } from './routing';

/**
 * 국제화된 네비게이션 API
 * - Link: 로케일 인식 링크 컴포넌트
 * - redirect: 로케일 인식 리다이렉트
 * - usePathname: 로케일 없는 경로 반환
 * - useRouter: 로케일 인식 라우터
 */
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);


