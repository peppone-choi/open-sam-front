import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

export default createMiddleware(routing);

export const config = {
  // 다음 경로는 미들웨어에서 제외:
  // - API 라우트 (/api, /trpc)
  // - Next.js 내부 경로 (/_next, /_vercel)
  // - 정적 파일 (favicon.ico, 이미지 등)
  // - 데모 경로 (/demo)
  // - 테스트 경로 (/test)
  // - 임시: 모든 경로 제외 (i18n [locale] 폴더 구조 미구현)
  matcher: [
    // 현재 [locale] 폴더 구조가 없으므로 모든 경로 제외
    // i18n 완전 구현 후 아래 주석 해제
    // '/((?!api|trpc|_next|_vercel|demo|test|.*\\..*).*)',
    '/(DISABLED_FOR_NOW)',
  ],
};

