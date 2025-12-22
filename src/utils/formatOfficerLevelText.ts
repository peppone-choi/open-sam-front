/**
 * 관직명 포맷 함수
 * 백엔드와 동일한 로직을 사용합니다.
 * 
 * @param officerLevel - 관직 레벨 (0-12)
 * @param nationLevel - 국가 레벨 (0-8)
 * @param officerTitles - 백엔드에서 전달받은 관직명 맵 (선택, 있으면 우선 사용)
 * @param nationType - 국가 타입 (bandits, taiping, taoism_religious 등)
 */
import { getOfficerTitle as getTitle } from '@/constants/officerTitles';

export function formatOfficerLevelText(
  officerLevel: number, 
  nationLevel?: number,
  officerTitles?: Record<string | number, string | Record<string, string>>,
  nationType?: string
): string {
  // 백엔드에서 officerTitles를 받은 경우 우선 사용
  if (officerTitles && officerTitles[String(officerLevel)]) {
    const levelMap = officerTitles[String(officerLevel)];
    
    // levelMap이 문자열인 경우 직접 반환
    if (typeof levelMap === 'string') {
      return levelMap;
    }
    
    // nationType이 있고 해당 타입의 관직명이 있으면 반환
    if (nationType && levelMap[nationType]) {
      return levelMap[nationType];
    }
    
    // nationLevel이 있고 해당 레벨의 관직명이 있으면 반환
    if (nationLevel !== undefined && levelMap[String(nationLevel)]) {
      return levelMap[String(nationLevel)];
    }
    
    // nationLevel이 없거나 해당 레벨의 관직명이 없으면 default 반환
    if (levelMap['default']) {
      return levelMap['default'];
    }
  }
  
  // 프론트엔드 상수 사용 (백엔드와 동일한 로직)
  return getTitle(officerLevel, nationLevel ?? 0, nationType);
}

// 백엔드와 동일한 함수명으로도 내보내기
export { getOfficerTitle, getNationLevelName, getRulerTitle, isChief, isRuler, isCityOfficer, getChiefCount, getNationLevelInfo, NATION_LEVELS, OFFICER_TITLES, CITY_OFFICER_LEVELS, CHIEF_OFFICER_LEVELS } from '@/constants/officerTitles';
