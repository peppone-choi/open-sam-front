/**
 * i18n 모듈 exports
 * 
 * 사용 예시:
 * 
 * // 서버 컴포넌트에서
 * import { getTranslations } from 'next-intl/server';
 * const t = await getTranslations('common');
 * <h1>{t('logout')}</h1>
 * 
 * // 클라이언트 컴포넌트에서
 * import { useTranslations } from 'next-intl';
 * const t = useTranslations('common');
 * <button>{t('cancel')}</button>
 * 
 * // 링크에서 (로케일 자동 처리)
 * import { Link } from '@/i18n/navigation';
 * <Link href="/game">게임</Link>
 */

export { routing, type Locale } from './routing';
export { Link, redirect, usePathname, useRouter, getPathname } from './navigation';

// 편의를 위한 re-export
export { useTranslations, useLocale } from 'next-intl';
export { getTranslations, getLocale } from 'next-intl/server';


