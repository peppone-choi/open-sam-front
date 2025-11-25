/**
 * 관직명 포맷 함수
 * 백엔드에서 전달받은 officerTitles 데이터를 사용합니다.
 * 
 * @param officerLevel - 관직 레벨 (0-12)
 * @param nationLevel - 국가 레벨 (0-8)
 * @param officerTitles - 백엔드에서 전달받은 관직명 맵 (선택)
 */
export function formatOfficerLevelText(
  officerLevel: number, 
  nationLevel?: number,
  officerTitles?: Record<string | number, string | Record<string, string>>
): string {
  // 백엔드에서 officerTitles를 받은 경우
  if (officerTitles && officerTitles[String(officerLevel)]) {
    const levelMap = officerTitles[String(officerLevel)];
    
    // levelMap이 문자열인 경우 직접 반환
    if (typeof levelMap === 'string') {
      return levelMap;
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
  
  // 폴백: 하드코딩된 기본값
  const fallbackMap: Record<number, string> = {
    12: '군주',
    11: '참모',
    10: '제1장군',
    9: '제1모사',
    8: '제2장군',
    7: '제2모사',
    6: '제3장군',
    5: '제3모사',
    4: '태수',
    3: '군사',
    2: '종사',
    1: '일반',
    0: '재야',
  };
  
  return fallbackMap[officerLevel] ?? '???';
}




