const OfficerLevelMapDefault: Record<number, string> = {
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

const OfficerLevelMapByNationLevel: Record<number, Record<number, string>> = {
  7: {
    12: '황제',
    11: '승상',
    10: '표기장군',
    9: '사공',
    8: '거기장군',
    7: '태위',
    6: '위장군',
    5: '사도'
  },
  6: {
    12: '왕',
    11: '광록훈',
    10: '좌장군',
    9: '상서령',
    8: '우장군',
    7: '중서령',
    6: '전장군',
    5: '비서령'
  },
  5: {
    12: '공',
    11: '광록대부',
    10: '안국장군',
    9: '집금오',
    8: '파로장군',
    7: '소부'
  },
  4: {
    12: '주목',
    11: '태사령',
    10: '아문장군',
    9: '낭중',
    8: '호군',
    7: '종사중랑'
  },
  3: {
    12: '주자사',
    11: '주부',
    10: '편장군',
    9: '간의대부'
  },
  2: {
    12: '군벌',
    11: '참모',
    10: '비장군',
    9: '부참모'
  },
  1: {
    12: '영주',
    11: '참모'
  },
  0: {
    12: '두목',
    11: '부두목'
  },
};

export function formatOfficerLevelText(officerLevel: number, nationLevel?: number): string {
  if (officerLevel < 5) {
    return OfficerLevelMapDefault[officerLevel] ?? '???';
  }

  const nationMap = nationLevel === undefined
    ? OfficerLevelMapDefault
    : (OfficerLevelMapByNationLevel[nationLevel] ?? OfficerLevelMapDefault);

  return nationMap[officerLevel] ?? (OfficerLevelMapDefault[officerLevel] ?? '???');
}




