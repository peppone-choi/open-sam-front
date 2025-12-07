/**
 * LOGH 에셋 정의
 * 
 * Gineiden 모드에서 추출한 함선 에셋 목록
 */

export type ShipFaction = 'empire' | 'alliance' | 'neutral';
export type ShipType = 'standard' | 'flagship' | 'fighter' | 'station' | 'utility';

export interface ShipAsset {
  id: string;
  name: string;
  nameKo: string;
  faction: ShipFaction;
  type: ShipType;
  mesh: string;
  textures?: {
    diffuse?: string;
    bump?: string;
    data?: string;
  };
  commander?: string;
  description?: string;
}

// =====================================
// 제국군 함선
// =====================================
export const EMPIRE_ASSETS: ShipAsset[] = [
  // 전함
  {
    id: 'empire_battleship',
    name: 'Empire Battleship',
    nameKo: '제국군 전함',
    faction: 'empire',
    type: 'standard',
    mesh: 'GE_BS_Battleship',
    textures: {
      diffuse: 'GE_Battleship_diffuse.dds',
      bump: 'GE_Battleship_bump.dds',
    },
  },
  {
    id: 'empire_battleship_advanced',
    name: 'Empire Advanced Battleship',
    nameKo: '제국군 개량 전함',
    faction: 'empire',
    type: 'standard',
    mesh: 'GE_BS_Battleship_Advanced',
  },
  
  // 순양함
  {
    id: 'empire_cruiser',
    name: 'Empire Cruiser',
    nameKo: '제국군 순양함',
    faction: 'empire',
    type: 'standard',
    mesh: 'GE_FR_Cruiser',
    textures: {
      diffuse: 'GE_Cruiser_diffuse.dds',
    },
  },
  {
    id: 'empire_cruiser_heavy',
    name: 'Empire Heavy Cruiser',
    nameKo: '제국군 중순양함',
    faction: 'empire',
    type: 'standard',
    mesh: 'GE_HeavyCruiser',
  },
  
  // 구축함
  {
    id: 'empire_destroyer',
    name: 'Empire Destroyer',
    nameKo: '제국군 구축함',
    faction: 'empire',
    type: 'standard',
    mesh: 'GE_FF_Destroyer',
    textures: {
      diffuse: 'GE_Destroyer_diffuse.dds',
    },
  },
  {
    id: 'empire_destroyer_advanced',
    name: 'Empire Advanced Destroyer',
    nameKo: '제국군 개량 구축함',
    faction: 'empire',
    type: 'standard',
    mesh: 'GE_FF_Destroyer_Advanced',
  },
  
  // 항공모함
  {
    id: 'empire_carrier',
    name: 'Empire Carrier',
    nameKo: '제국군 항공모함',
    faction: 'empire',
    type: 'standard',
    mesh: 'GE_CV_Carrier',
    textures: {
      diffuse: 'GE_Carrier_diffuse.dds',
    },
  },
  {
    id: 'empire_carrier_advanced',
    name: 'Empire Advanced Carrier',
    nameKo: '제국군 개량 항공모함',
    faction: 'empire',
    type: 'standard',
    mesh: 'GE_CV_Carrier_Advanced',
  },
  
  // 정찰함
  {
    id: 'empire_scout',
    name: 'Empire Scout',
    nameKo: '제국군 정찰함',
    faction: 'empire',
    type: 'utility',
    mesh: 'GE_Scout',
  },
  
  // 공병함
  {
    id: 'empire_corvette',
    name: 'Empire Corvette',
    nameKo: '제국군 코르벳',
    faction: 'empire',
    type: 'standard',
    mesh: 'GE_Corvette',
  },
  
  // 수송선
  {
    id: 'empire_transport',
    name: 'Empire Transport',
    nameKo: '제국군 수송선',
    faction: 'empire',
    type: 'utility',
    mesh: 'GE_Transport',
  },
  
  // 식민선
  {
    id: 'empire_colony_ship',
    name: 'Empire Colony Ship',
    nameKo: '제국군 식민선',
    faction: 'empire',
    type: 'utility',
    mesh: 'GE_ColonyShip',
  },
  
  // 전투기
  {
    id: 'empire_fighter',
    name: 'Walküre',
    nameKo: '발키레',
    faction: 'empire',
    type: 'fighter',
    mesh: 'GE_Walkure',
    textures: {
      diffuse: 'GE_Walkure_diffuse.dds',
    },
    description: '제국군 주력 전투기',
  },
  {
    id: 'empire_fighter_bomber',
    name: 'Walküre Bomber',
    nameKo: '발키레 폭격기',
    faction: 'empire',
    type: 'fighter',
    mesh: 'GE_Walkure_Bomber',
  },
];

// =====================================
// 제국 기함 (플래그십)
// =====================================
export const EMPIRE_FLAGSHIPS: ShipAsset[] = [
  // 라인하르트
  {
    id: 'brunhild',
    name: 'Brunhild',
    nameKo: '브륜힐트',
    faction: 'empire',
    type: 'flagship',
    mesh: 'Brunhild',
    textures: {
      diffuse: 'Brunhild_diffuse.dds',
      bump: 'Brunhild_bump.dds',
    },
    commander: '라인하르트 폰 로엔그람',
    description: '순백의 기함. 제국 최고의 기술력이 집약된 라인하르트의 전용함.',
  },
  
  // 키르히아이스
  {
    id: 'barbarossa',
    name: 'Barbarossa',
    nameKo: '바르바로사',
    faction: 'empire',
    type: 'flagship',
    mesh: 'Barbarossa',
    textures: {
      diffuse: 'Barbarossa_diffuse.dds',
    },
    commander: '지크프리트 키르히아이스',
    description: '적갈색의 기함. 키르히아이스의 전용함.',
  },
  
  // 미터마이어
  {
    id: 'beowulf',
    name: 'Beowulf',
    nameKo: '베오울프',
    faction: 'empire',
    type: 'flagship',
    mesh: 'Beowulf',
    textures: {
      diffuse: 'Beowulf_diffuse.dds',
    },
    commander: '볼프강 미터마이어',
    description: '질풍의 기함. 미터마이어의 전용함.',
  },
  
  // 로이엔탈
  {
    id: 'tristan',
    name: 'Tristan',
    nameKo: '트리스탄',
    faction: 'empire',
    type: 'flagship',
    mesh: 'Tristan',
    textures: {
      diffuse: 'Tristan_diffuse.dds',
    },
    commander: '오스카 폰 로이엔탈',
    description: '로이엔탈의 전용함.',
  },
  
  // 비텐펠트
  {
    id: 'koenigstiger',
    name: 'Königstiger',
    nameKo: '쾨니히스티거',
    faction: 'empire',
    type: 'flagship',
    mesh: 'Koenigstiger',
    textures: {
      diffuse: 'Koenigstiger_diffuse.dds',
    },
    commander: '프리츠 요제프 비텐펠트',
    description: '흑색창기병함대 기함. 비텐펠트의 전용함.',
  },
  
  // 뮐러
  {
    id: 'percival',
    name: 'Percival',
    nameKo: '퍼시발',
    faction: 'empire',
    type: 'flagship',
    mesh: 'Percival',
    textures: {
      diffuse: 'Percival_diffuse.dds',
    },
    commander: '나이트하르트 뮐러',
    description: '철벽 뮐러의 기함.',
  },
  
  // 아이젠나흐
  {
    id: 'gargantua',
    name: 'Gargantua',
    nameKo: '가르강튀아',
    faction: 'empire',
    type: 'flagship',
    mesh: 'Gargantua',
    commander: '에른스트 폰 아이젠나흐',
    description: '침묵의 기함.',
  },
  
  // 파렌하이트
  {
    id: 'asgrimm',
    name: 'Asgrimm',
    nameKo: '아스그림',
    faction: 'empire',
    type: 'flagship',
    mesh: 'Asgrimm',
    commander: '아달베르트 폰 파렌하이트',
    description: '파렌하이트의 전용함.',
  },
  
  // 메클링거
  {
    id: 'quasar',
    name: 'Quasar',
    nameKo: '퀘이사',
    faction: 'empire',
    type: 'flagship',
    mesh: 'Quasar',
    commander: '에르네스트 메클링거',
    description: '예술제독의 기함.',
  },
  
  // 오베르슈타인
  {
    id: 'skadi',
    name: 'Skadi',
    nameKo: '스카디',
    faction: 'empire',
    type: 'flagship',
    mesh: 'Skadi',
    commander: '파울 폰 오베르슈타인',
    description: '오베르슈타인의 전용함.',
  },
  
  // 켐프
  {
    id: 'salamander',
    name: 'Salamander',
    nameKo: '살라만더',
    faction: 'empire',
    type: 'flagship',
    mesh: 'Salamander',
    commander: '칼 구스타프 켐프',
    description: '켐프의 전용함.',
  },
  
  // 슈타인메츠
  {
    id: 'fafnir',
    name: 'Fafnir',
    nameKo: '파프니르',
    faction: 'empire',
    type: 'flagship',
    mesh: 'Fafnir',
    commander: '카를 로베르트 슈타인메츠',
    description: '슈타인메츠의 전용함.',
  },
  
  // 메르카츠
  {
    id: 'ostmark',
    name: 'Ostmark',
    nameKo: '오스트마르크',
    faction: 'empire',
    type: 'flagship',
    mesh: 'Ostmark',
    commander: '윌리발트 요아힘 폰 메르카츠',
    description: '메르카츠의 제국군 시절 기함.',
  },
  
  // 루츠
  {
    id: 'skirnir',
    name: 'Skirnir',
    nameKo: '스키르니르',
    faction: 'empire',
    type: 'flagship',
    mesh: 'Skirnir',
    commander: '코르넬리우스 루츠',
    description: '루츠의 전용함.',
  },
  
  // 크나펜슈타인
  {
    id: 'grausam',
    name: 'Grausam',
    nameKo: '그라우잠',
    faction: 'empire',
    type: 'flagship',
    mesh: 'Grausam',
    commander: '크나펜슈타인',
    description: '크나펜슈타인의 전용함.',
  },
  
  // 구 왕조
  {
    id: 'wilhelmina',
    name: 'Wilhelmina',
    nameKo: '빌헬미나',
    faction: 'empire',
    type: 'flagship',
    mesh: 'Wilhelmina',
    commander: '그레고르 폰 묵덴',
    description: '골든바움 왕조 말기의 기함.',
  },
];

// =====================================
// 동맹군 함선
// =====================================
export const ALLIANCE_ASSETS: ShipAsset[] = [
  // 전함
  {
    id: 'alliance_battleship',
    name: 'Alliance Battleship',
    nameKo: '동맹군 전함',
    faction: 'alliance',
    type: 'standard',
    mesh: 'FPA_BS_Battleship',
    textures: {
      diffuse: 'FPA_Battleship_diffuse.dds',
      bump: 'FPA_Battleship_bump.dds',
    },
  },
  {
    id: 'alliance_battleship_advanced',
    name: 'Alliance Advanced Battleship',
    nameKo: '동맹군 개량 전함',
    faction: 'alliance',
    type: 'standard',
    mesh: 'FPA_BS_Battleship_Advanced',
  },
  
  // 순양함
  {
    id: 'alliance_cruiser',
    name: 'Alliance Cruiser',
    nameKo: '동맹군 순양함',
    faction: 'alliance',
    type: 'standard',
    mesh: 'FPA_FR_Cruiser',
    textures: {
      diffuse: 'FPA_Cruiser_diffuse.dds',
    },
  },
  {
    id: 'alliance_cruiser_heavy',
    name: 'Alliance Heavy Cruiser',
    nameKo: '동맹군 중순양함',
    faction: 'alliance',
    type: 'standard',
    mesh: 'FPA_HeavyCruiser',
  },
  
  // 구축함
  {
    id: 'alliance_destroyer',
    name: 'Alliance Destroyer',
    nameKo: '동맹군 구축함',
    faction: 'alliance',
    type: 'standard',
    mesh: 'FPA_FF_Destroyer',
    textures: {
      diffuse: 'FPA_Destroyer_diffuse.dds',
    },
  },
  {
    id: 'alliance_destroyer_advanced',
    name: 'Alliance Advanced Destroyer',
    nameKo: '동맹군 개량 구축함',
    faction: 'alliance',
    type: 'standard',
    mesh: 'FPA_FF_Destroyer_Advanced',
  },
  
  // 항공모함
  {
    id: 'alliance_carrier',
    name: 'Alliance Carrier',
    nameKo: '동맹군 항공모함',
    faction: 'alliance',
    type: 'standard',
    mesh: 'FPA_CV_Carrier',
    textures: {
      diffuse: 'FPA_Carrier_diffuse.dds',
    },
  },
  {
    id: 'alliance_carrier_advanced',
    name: 'Alliance Advanced Carrier',
    nameKo: '동맹군 개량 항공모함',
    faction: 'alliance',
    type: 'standard',
    mesh: 'FPA_CV_Carrier_Advanced',
  },
  
  // 정찰함
  {
    id: 'alliance_scout',
    name: 'Alliance Scout',
    nameKo: '동맹군 정찰함',
    faction: 'alliance',
    type: 'utility',
    mesh: 'FPA_Scout',
  },
  
  // 코르벳
  {
    id: 'alliance_corvette',
    name: 'Alliance Corvette',
    nameKo: '동맹군 코르벳',
    faction: 'alliance',
    type: 'standard',
    mesh: 'FPA_Corvette',
  },
  
  // 수송선
  {
    id: 'alliance_transport',
    name: 'Alliance Transport',
    nameKo: '동맹군 수송선',
    faction: 'alliance',
    type: 'utility',
    mesh: 'FPA_Transport',
  },
  
  // 식민선
  {
    id: 'alliance_colony_ship',
    name: 'Alliance Colony Ship',
    nameKo: '동맹군 식민선',
    faction: 'alliance',
    type: 'utility',
    mesh: 'FPA_ColonyShip',
  },
  
  // 전투기
  {
    id: 'alliance_fighter',
    name: 'Spartanian',
    nameKo: '스파르타니안',
    faction: 'alliance',
    type: 'fighter',
    mesh: 'FPA_Spartanian',
    textures: {
      diffuse: 'FPA_Spartanian_diffuse.dds',
    },
    description: '동맹군 주력 전투기',
  },
  {
    id: 'alliance_fighter_bomber',
    name: 'Spartanian Bomber',
    nameKo: '스파르타니안 폭격기',
    faction: 'alliance',
    type: 'fighter',
    mesh: 'FPA_Spartanian_Bomber',
  },
];

// =====================================
// 동맹 기함 (플래그십)
// =====================================
export const ALLIANCE_FLAGSHIPS: ShipAsset[] = [
  // 양 웬리
  {
    id: 'hyperion',
    name: 'Hyperion',
    nameKo: '휴베리온',
    faction: 'alliance',
    type: 'flagship',
    mesh: 'Hyperion',
    textures: {
      diffuse: 'Hyperion_diffuse.dds',
      bump: 'Hyperion_bump.dds',
    },
    commander: '양 웬리',
    description: '마술사의 기함. 양 웬리의 전용함.',
  },
  
  // 뷰코크
  {
    id: 'rio_grande',
    name: 'Rio Grande',
    nameKo: '리오 그란데',
    faction: 'alliance',
    type: 'flagship',
    mesh: 'RioGrande',
    textures: {
      diffuse: 'RioGrande_diffuse.dds',
    },
    commander: '알렉산드르 뷰코크',
    description: '동맹군 우주함대 총사령관의 기함.',
  },
  
  // 율리안 (휴베리온 계승)
  {
    id: 'ulysses',
    name: 'Ulysses',
    nameKo: '율리시즈',
    faction: 'alliance',
    type: 'flagship',
    mesh: 'Ulysses',
    commander: '율리안 민츠',
    description: '율리안의 기함.',
  },
  
  // 아텐보로
  {
    id: 'triglav',
    name: 'Triglav',
    nameKo: '트리글라프',
    faction: 'alliance',
    type: 'flagship',
    mesh: 'Triglav',
    textures: {
      diffuse: 'Triglav_diffuse.dds',
    },
    commander: '더스티 아텐보로',
    description: '아텐보로의 기함.',
  },
  
  // 피셔
  {
    id: 'leyflir',
    name: 'Leyflir',
    nameKo: '레이플리르',
    faction: 'alliance',
    type: 'flagship',
    mesh: 'Leyflir',
    commander: '에드윈 피셔',
    description: '피셔 제독의 기함.',
  },
  
  // 파에타
  {
    id: 'paetta_flagship',
    name: 'Patroclos',
    nameKo: '파트로클로스',
    faction: 'alliance',
    type: 'flagship',
    mesh: 'Patroclos',
    commander: '파에타',
    description: '아스타르테 회전 당시 동맹군 기함.',
  },
  
  // 비로라이넨
  {
    id: 'aonikenk',
    name: 'Aonikenk',
    nameKo: '아오니켄크',
    faction: 'alliance',
    type: 'flagship',
    mesh: 'Aonikenk',
    commander: '비로라이넨',
    description: '비로라이넨의 기함.',
  },
  
  // 응우옌
  {
    id: 'maurya',
    name: 'Maurya',
    nameKo: '마우리아',
    faction: 'alliance',
    type: 'flagship',
    mesh: 'Maurya',
    commander: '응우옌 반 후에',
    description: '응우옌의 기함.',
  },
  
  // 우란프
  {
    id: 'ulanbator',
    name: 'Ulan Bator',
    nameKo: '울란바토르',
    faction: 'alliance',
    type: 'flagship',
    mesh: 'UlanBator',
    commander: '우란프',
    description: '우란프의 기함.',
  },
  
  // 보로딘
  {
    id: 'salamis',
    name: 'Salamis',
    nameKo: '살라미스',
    faction: 'alliance',
    type: 'flagship',
    mesh: 'Salamis',
    commander: '보로딘',
    description: '보로딘의 기함.',
  },
  
  // 그린힐
  {
    id: 'krishna',
    name: 'Krishna',
    nameKo: '크리슈나',
    faction: 'alliance',
    type: 'flagship',
    mesh: 'Krishna',
    commander: '드와이트 그린힐',
    description: '그린힐의 기함.',
  },
  
  // 쿠브르슬리
  {
    id: 'cu_chulainn',
    name: 'Cu Chulainn',
    nameKo: '쿠 훌린',
    faction: 'alliance',
    type: 'flagship',
    mesh: 'CuChulainn',
    commander: '쿠브르슬리',
    description: '쿠브르슬리의 기함.',
  },
  
  // 무어
  {
    id: 'epimetheus',
    name: 'Epimetheus',
    nameKo: '에피메테우스',
    faction: 'alliance',
    type: 'flagship',
    mesh: 'Epimetheus',
    commander: '무어',
    description: '무어의 기함.',
  },
  
  // 후레거
  {
    id: 'diomedes',
    name: 'Diomedes',
    nameKo: '디오메데스',
    faction: 'alliance',
    type: 'flagship',
    mesh: 'Diomedes',
    commander: '후레거',
    description: '후레거의 기함.',
  },
];

// =====================================
// 특수 함선 / 스테이션 / 기타
// =====================================
export const SPECIAL_ASSETS: ShipAsset[] = [
  // 이제르론 요새
  {
    id: 'iserlohn',
    name: 'Iserlohn Fortress',
    nameKo: '이제르론 요새',
    faction: 'neutral',
    type: 'station',
    mesh: 'Iserlohn',
    textures: {
      diffuse: 'Iserlohn_diffuse.dds',
    },
    description: '난공불락의 요새. 토르의 망치 장착.',
  },
  
  // 가이에스부르크 요새
  {
    id: 'geiersburg',
    name: 'Geiersburg Fortress',
    nameKo: '가이에스부르크 요새',
    faction: 'empire',
    type: 'station',
    mesh: 'Geiersburg',
    textures: {
      diffuse: 'Geiersburg_diffuse.dds',
    },
    description: '이동 요새로 개조된 제국 요새.',
  },
  
  // 페잔 스테이션
  {
    id: 'fezzan_station',
    name: 'Fezzan Station',
    nameKo: '페잔 스테이션',
    faction: 'neutral',
    type: 'station',
    mesh: 'FezzanStation',
    description: '페잔 자치령의 주요 우주 정거장.',
  },
  
  // 아르테미스의 목걸이
  {
    id: 'artemis_necklace',
    name: 'Artemis Necklace',
    nameKo: '아르테미스의 목걸이',
    faction: 'alliance',
    type: 'station',
    mesh: 'ArtemisNecklace',
    description: '하이네센을 보호하는 방어 위성 시스템.',
  },
  
  // 토르 해머 유닛
  {
    id: 'thor_hammer',
    name: 'Thor Hammer',
    nameKo: '토르의 망치',
    faction: 'neutral',
    type: 'station',
    mesh: 'ThorHammer',
    textures: {
      diffuse: 'ThorHammer_diffuse.dds',
    },
    description: '이제르론 요새의 주포.',
  },
];

// 모든 에셋
export const ALL_ASSETS: ShipAsset[] = [
  ...EMPIRE_ASSETS,
  ...EMPIRE_FLAGSHIPS,
  ...ALLIANCE_ASSETS,
  ...ALLIANCE_FLAGSHIPS,
  ...SPECIAL_ASSETS,
];

// 함선 ID로 검색
export function getShipById(id: string): ShipAsset | undefined {
  return ALL_ASSETS.find(ship => ship.id === id);
}

// 메쉬 이름으로 검색
export function getShipByMesh(meshName: string): ShipAsset | undefined {
  return ALL_ASSETS.find(ship => 
    ship.mesh.toLowerCase() === meshName.toLowerCase()
  );
}

// 진영별 필터
export function getShipsByFaction(faction: ShipFaction): ShipAsset[] {
  return ALL_ASSETS.filter(ship => ship.faction === faction);
}

// 유형별 필터
export function getShipsByType(type: ShipType): ShipAsset[] {
  return ALL_ASSETS.filter(ship => ship.type === type);
}

// 기함만 가져오기
export function getFlagships(): ShipAsset[] {
  return [...EMPIRE_FLAGSHIPS, ...ALLIANCE_FLAGSHIPS];
}

// 기함 지휘관으로 검색
export function getShipByCommander(commander: string): ShipAsset | undefined {
  return getFlagships().find(ship => 
    ship.commander?.includes(commander)
  );
}
