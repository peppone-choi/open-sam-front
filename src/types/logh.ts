export type Faction = 'empire' | 'alliance';
export type Gender = 'male' | 'female';

// 제국군 출신: 귀족, 제국기사, 평민, 망명자
// 동맹군 출신: 시민, 망명자
export type Origin = 'noble' | 'knight' | 'commoner' | 'citizen' | 'exile';

export interface CharacterStats {
  leadership: number; // 통솔
  politics: number;   // 정치
  operations: number; // 운영
  intelligence: number; // 정보
  command: number;    // 지휘
  maneuver: number;   // 기동
  offense: number;    // 공격
  defense: number;    // 방어
}

export interface CharacterCreationParams {
  sessionId: string;
  name: string;
  gender: Gender;
  faction: Faction;
  origin: Origin;
  stats: CharacterStats;
  avatarId?: number; // 얼굴 이미지 ID
}

// 메뉴얼 기반 기본 설정값
export const ORIGIN_CONFIG = {
  empire: [
    { id: 'noble', name: '귀족', desc: '제국의 지배 계급. 높은 정치력과 명성을 가질 가능성이 큽니다.', bonus: { politics: 5, leadership: 5 } },
    { id: 'knight', name: '제국기사', desc: '무훈을 통해 작위를 수여받은 군人 계급. 군사 능력에 보너스가 있습니다.', bonus: { command: 5, offense: 5 } },
    { id: 'commoner', name: '평민', desc: '일반 시민. 능력치의 균형이 잡혀있습니다.', bonus: { operations: 5 } },
    { id: 'exile', name: '망명자', desc: '동맹에서 망명해온 자. 정보력에 특화되어 있을 수 있습니다.', bonus: { intelligence: 10 } },
  ],
  alliance: [
    { id: 'citizen', name: '시민', desc: '자유惑星동맹의 시민. 자유와 권리를 중시합니다.', bonus: { operations: 5, politics: 5 } },
    { id: 'exile', name: '망명자', desc: '제국에서 압제를 피해 망명해온 자. 제국 사정에 밝습니다.', bonus: { intelligence: 10 } },
  ]
} as const;

export const STAT_LABELS: Record<keyof CharacterStats, string> = {
  leadership: '통솔',
  politics: '정치',
  operations: '운영',
  intelligence: '정보',
  command: '지휘',
  maneuver: '기동',
  offense: '공격',
  defense: '방어',
};

export const STAT_DESCRIPTIONS: Record<keyof CharacterStats, string> = {
  leadership: '인재 활용 능력. 징세액, 정부지지율, 함대 최대 사기, 항복 권고 성공률에 영향.',
  politics: '정치력. 시민의 지지를 얻거나 정치 공작을 수행하는 능력.',
  operations: '사무 관리 능력. 행성 통치, 물자 관리 효율에 영향.',
  intelligence: '정보 수집 및 분석 능력. 첩보 활동 및 전술 삭적 능력에 영향.',
  command: '부대 지휘 능력. 함대의 신속한 행동과 사기 유지에 영향.',
  maneuver: '함대 이동 지휘 능력. 기민한 조함과 회피에 영향.',
  offense: '공격 지휘 능력. 함대 및 행성 방위 시 공격력에 영향.',
  defense: '방어 지휘 능력. 함대 및 행성 방위 시 방어력에 영향.',
};
