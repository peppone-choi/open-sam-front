// 게임 관련 유틸리티 함수들

/**
 * NPC 색상 반환
 */
export function getNPCColor(npc: number | undefined): string {
  if (!npc && npc !== 0) return '#ccc';
  if (npc === 0) return '#0f0'; // 플레이어
  if (npc === 1) return '#fff'; // 일반 NPC
  if (npc === 5) return '#f00'; // 적대 NPC
  return '#ccc';
}

/**
 * 밝은 색상인지 확인
 */
export function isBrightColor(color: number | string | undefined): boolean {
  if (!color) return false;
  const hex = typeof color === 'number' 
    ? color.toString(16).padStart(6, '0') 
    : color.replace('#', '');
  if (hex.length !== 6) return false;
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 128;
}

/**
 * 관직 레벨 텍스트 포맷
 */
export function formatOfficerLevelText(level: number, nationLevel: number): string {
  if (nationLevel === 12) {
    const levelMap: { [key: number]: string } = {
      12: '황제',
      11: '대신',
      10: '장군',
      9: '대도독',
      8: '도독',
      7: '태수',
      6: '도위',
      5: '종사',
      4: '태수',
      3: '군사',
      2: '종사',
      1: '평민'
    };
    return levelMap[level] || `레벨${level}`;
  } else if (nationLevel === 10) {
    const levelMap: { [key: number]: string } = {
      10: '왕',
      9: '대도독',
      8: '도독',
      7: '태수',
      6: '도위',
      5: '종사',
      4: '태수',
      3: '군사',
      2: '종사',
      1: '평민'
    };
    return levelMap[level] || `레벨${level}`;
  } else {
    const levelMap: { [key: number]: string } = {
      8: '공',
      7: '태수',
      6: '도위',
      5: '종사',
      4: '태수',
      3: '군사',
      2: '종사',
      1: '평민'
    };
    return levelMap[level] || `레벨${level}`;
  }
}

/**
 * 부상 정보 포맷
 */
export function formatInjury(injury: number): [string, string] {
  if (injury >= 100) return ['건강', 'limegreen'];
  if (injury >= 80) return ['경상', 'yellow'];
  if (injury >= 50) return ['중상', 'orange'];
  if (injury >= 20) return ['중태', 'red'];
  return ['위독', 'magenta'];
}

/**
 * 부상 반영 능력치 계산
 */
export function calcInjury(stat: 'leadership' | 'strength' | 'intel', general: any): number {
  const baseStat = general[stat] || 0;
  const injury = general.injury || 100;
  return Math.floor(baseStat * (injury / 100));
}

/**
 * 장수 타입 호출명 포맷
 */
export function formatGeneralTypeCall(leadership: number, strength: number, intel: number, gameConst?: any): string {
  const total = leadership + strength + intel;
  if (total >= 270) return '영웅';
  if (total >= 240) return '호걸';
  if (total >= 210) return '용장';
  if (total >= 180) return '명장';
  if (total >= 150) return '장수';
  return '평민';
}

/**
 * 다음 레벨까지 남은 경험치 계산
 */
export function nextExpLevelRemain(experience: number, explevel: number): [number, number] {
  // 간단한 계산식 (원본 로직에 맞게 조정 필요)
  const nextLevelExp = (explevel + 1) * 1000;
  const currentLevelExp = explevel * 1000;
  const remain = experience - currentLevelExp;
  const need = nextLevelExp - currentLevelExp;
  return [remain, need];
}

/**
 * 벌점 포맷
 */
export function formatRefreshScore(score: number): string {
  if (score >= 100) return '★';
  if (score >= 50) return '▲';
  if (score >= 20) return '●';
  if (score >= 10) return '○';
  return '';
}


