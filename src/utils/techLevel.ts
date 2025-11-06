/**
 * 기술 등급 관련 유틸리티 함수
 */

export const TECH_LEVEL_STEP = 1000;

/**
 * 현재 연도에서 허용되는 최대 기술 등급 계산
 */
export function getMaxRelativeTechLevel(
  startYear: number,
  year: number,
  maxTechLevel: number,
  initialAllowedTechLevel: number,
  techLevelIncYear: number
): number {
  const relYear = year - startYear;
  const calculated = Math.floor(relYear / techLevelIncYear) + initialAllowedTechLevel;
  return Math.max(1, Math.min(calculated, maxTechLevel));
}

/**
 * 초반 제한 기간의 남은 시간 계산
 */
export function getBeginGameLimitInfo(
  startYear: number,
  year: number,
  month: number
): { remainYear: number; remainMonth: number; limitYear: number } | null {
  const limitYear = startYear + 3;
  if (year > limitYear) return null;

  // 총 개월 수로 계산
  const currentTotalMonths = year * 12 + month;
  const limitTotalMonths = limitYear * 12 + 12; // 제한 연도 12월까지
  const remainTotalMonths = limitTotalMonths - currentTotalMonths;

  if (remainTotalMonths <= 0) return null;

  const remainYear = Math.floor(remainTotalMonths / 12);
  const remainMonth = remainTotalMonths % 12;

  return { remainYear, remainMonth, limitYear };
}
