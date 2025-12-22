/**
 * 관직/작위 시스템 상수 및 유틸리티
 * 백엔드 config/scenarios/sangokushi/data/constants.json과 동기화
 */

// 국가 레벨 정보 (nationLevels)
export const NATION_LEVELS: Record<number, { level: number; name: string; chiefCount: number; minCities: number }> = {
  0: { level: 0, name: '유랑', chiefCount: 2, minCities: 0 },
  1: { level: 1, name: '정', chiefCount: 2, minCities: 1 },
  2: { level: 2, name: '현', chiefCount: 4, minCities: 3 },
  3: { level: 3, name: '군', chiefCount: 4, minCities: 6 },
  4: { level: 4, name: '주', chiefCount: 6, minCities: 10 },
  5: { level: 5, name: '주', chiefCount: 8, minCities: 15 },
  6: { level: 6, name: '공국', chiefCount: 10, minCities: 22 },
  7: { level: 7, name: '왕국', chiefCount: 12, minCities: 32 },
  8: { level: 8, name: '제국', chiefCount: 15, minCities: 45 },
};

// 관직 명칭 (officerTitles)
// 레벨 0-4: 도시 관직 (국가 레벨 무관)
// 레벨 5-12: 수뇌부 관직 (국가 레벨에 따라 다름)
export const OFFICER_TITLES: Record<number, Record<string, string>> = {
  0: { default: '재야' },
  1: { default: '일반' },
  2: { default: '종사' },
  3: { default: '군사' },
  4: { default: '성주' },
  5: {
    '0': '-', '1': '-', '2': '-', '3': '-', '4': '-', '5': '-',
    '6': '녹사', '7': '시랑', '8': '구경',
    bandits: '소두', taiping: '귀졸', taoism_religious: '의사',
    default: '-'
  },
  6: {
    '0': '-', '1': '-', '2': '-', '3': '-', '4': '-',
    '5': '도위', '6': '진동장군', '7': '전장군', '8': '거기장군',
    bandits: '교두', taiping: '거수', taoism_religious: '귀졸',
    default: '-'
  },
  7: {
    '0': '-', '1': '-', '2': '-', '3': '-',
    '4': '종사', '5': '공조', '6': '상서령', '7': '중서령', '8': '사공',
    bandits: '귀졸두', taiping: '소방', taoism_religious: '좌사',
    default: '-'
  },
  8: {
    '0': '-', '1': '-', '2': '-', '3': '-',
    '4': '비장', '5': '편장군', '6': '좌장군', '7': '위장군', '8': '사도',
    bandits: '행동대장', taiping: '방', taoism_religious: '도사',
    default: '-'
  },
  9: {
    '0': '-', '1': '-',
    '2': '주부', '3': '종사', '4': '주부', '5': '장사',
    '6': '시중', '7': '어사대부', '8': '태위',
    bandits: '두목', taiping: '대방', taoism_religious: '제주',
    default: '-'
  },
  10: {
    '0': '두령', '1': '위', '2': '위', '3': '사마',
    '4': '중랑장', '5': '호군', '6': '대도독', '7': '대장군', '8': '대사마',
    bandits: '두령', taiping: '인공장군', taoism_religious: '대제주',
    default: '장군'
  },
  11: {
    '0': '부거수', '1': '참모', '2': '승', '3': '장사',
    '4': '별가', '5': '치중', '6': '상', '7': '상국', '8': '승상',
    bandits: '부거수', taiping: '지공장군', taoism_religious: '사자',
    default: '참모'
  },
  12: {
    '0': '거수', '1': '정후', '2': '현후', '3': '태수',
    '4': '자사', '5': '목', '6': '공', '7': '왕', '8': '황제',
    bandits: '거수', taiping: '천공장군', taoism_religious: '천사',
    default: '군주'
  },
};

/**
 * 국가 레벨명 조회
 * @param nationLevel 국가 레벨 (0-8)
 */
export function getNationLevelName(nationLevel: number): string {
  return NATION_LEVELS[nationLevel]?.name || `레벨 ${nationLevel}`;
}

/**
 * 국가 레벨 정보 조회
 * @param nationLevel 국가 레벨 (0-8)
 */
export function getNationLevelInfo(nationLevel: number) {
  return NATION_LEVELS[nationLevel] || NATION_LEVELS[0];
}

/**
 * 관직 명칭 조회 (국가 레벨 기반)
 * 백엔드 rank-system.ts의 getOfficerTitle과 동일한 로직
 * 
 * @param officerLevel 관직 레벨 (0-12)
 * @param nationLevel 국가 레벨 (0-8)
 * @param nationType 국가 타입 (bandits, taiping, taoism_religious 등)
 */
export function getOfficerTitle(
  officerLevel: number,
  nationLevel: number = 0,
  nationType?: string
): string {
  const titles = OFFICER_TITLES[officerLevel];
  if (!titles) return '-';

  // 도시 관직 (0-4)은 국가 레벨 무관
  if (officerLevel >= 0 && officerLevel <= 4) {
    return titles.default || '재야';
  }

  // 특수 국가 타입 처리 (도적, 태평도, 오두미도 등)
  if (nationType && titles[nationType]) {
    return titles[nationType];
  }

  // 국가 레벨에 해당하는 관직
  const title = titles[String(nationLevel)];
  if (title && title !== '-') return title;

  // 해당 레벨에 관직이 없으면 가장 낮은 가용 레벨 반환
  for (let level = nationLevel; level >= 0; level--) {
    const t = titles[String(level)];
    if (t && t !== '-') return t;
  }

  return titles.default || '-';
}

/**
 * 군주 명칭 조회 (국가 레벨 기반)
 * @param nationLevel 국가 레벨 (0-8)
 */
export function getRulerTitle(nationLevel: number): string {
  return getOfficerTitle(12, nationLevel);
}

/**
 * 수뇌부 여부 확인
 * @param officerLevel 관직 레벨
 */
export function isChief(officerLevel: number): boolean {
  return officerLevel >= 5;
}

/**
 * 군주 여부 확인
 * @param officerLevel 관직 레벨
 */
export function isRuler(officerLevel: number): boolean {
  return officerLevel === 12;
}

/**
 * 도시 관직 여부 확인
 * @param officerLevel 관직 레벨
 */
export function isCityOfficer(officerLevel: number): boolean {
  return officerLevel >= 2 && officerLevel <= 4;
}

/**
 * 국가 레벨별 수뇌부 최대 인원 조회
 * @param nationLevel 국가 레벨 (0-8)
 */
export function getChiefCount(nationLevel: number): number {
  return NATION_LEVELS[nationLevel]?.chiefCount || 2;
}

// 도시 관직 레벨 상수
export const CITY_OFFICER_LEVELS = {
  GOVERNOR: 4,   // 성주
  ADVISOR: 3,    // 군사
  CLERK: 2,      // 종사
} as const;

// 수뇌부 관직 레벨 상수  
export const CHIEF_OFFICER_LEVELS = {
  RULER: 12,     // 군주
  PRIME: 11,     // 참모 (문1)
  GENERAL: 10,   // 장군 (무1)
  ADVISOR1: 9,   // 문2
  COMMANDER1: 8, // 무2
  ADVISOR2: 7,   // 문3
  COMMANDER2: 6, // 무3
  ADVISOR3: 5,   // 문4
} as const;

