import { defineRouting } from 'next-intl/routing';

/**
 * i18n 라우팅 설정
 * - 지원 언어: 한국어(기본), 영어
 * - 기본 로케일은 URL에서 생략 가능
 */
export const routing = defineRouting({
  locales: ['ko', 'en'],
  defaultLocale: 'ko',
  // URL에서 기본 로케일 생략 (예: /game 대신 /ko/game)
  localePrefix: 'as-needed',
});

export type Locale = (typeof routing.locales)[number];


