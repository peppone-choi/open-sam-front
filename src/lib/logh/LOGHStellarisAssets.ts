/**
 * LOGH Stellaris 에셋 정의
 * 
 * Stellaris LOGH Ships MOD에서 변환된 OBJ 모델 목록
 * - tgef_01: 은하제국 (Galactic Empire Force)
 * - tfpa_01: 자유행성동맹 (Free Planets Alliance)
 */

export type StellarisShipFaction = 'empire' | 'alliance';
export type StellarisShipClass = 
  | 'flagship'
  | 'battleship'
  | 'cruiser'
  | 'destroyer'
  | 'corvette'
  | 'carrier'
  | 'fighter'
  | 'titan'
  | 'juggernaut'
  | 'colossus'
  | 'station'
  | 'transport'
  | 'science'
  | 'construction'
  | 'colony';

export interface StellarisShipAsset {
  id: string;
  name: string;
  nameKo: string;
  faction: StellarisShipFaction;
  shipClass: StellarisShipClass;
  objFile: string;
  mtlFile?: string;
  textures: {
    diffuse?: string;
    normal?: string;
    specular?: string;
  };
  commander?: string;
  description?: string;
  scale?: number; // 커스텀 스케일 (기본: 1)
}

// =====================================
// 제국군 기함 (LOGH Flagships)
// 주의: flagship_01 = 바르바로사(붉은색), 브륜힐트는 battleship_01(흰색)
// =====================================
export const STELLARIS_EMPIRE_FLAGSHIPS: StellarisShipAsset[] = [
  {
    id: 'brunhild',
    name: 'Brunhild',
    nameKo: '브륜힐트',
    faction: 'empire',
    shipClass: 'flagship',
    objFile: 'tgef_01_battleship_01',  // 흰색 - 일반 전함 팩에 포함
    textures: {
      diffuse: 'tgef_01_battleship_01_diffuse.dds',
      normal: 'tgef_01_battleship_01_normal.dds',
      specular: 'tgef_01_battleship_01_specular.dds',
    },
    commander: '라인하르트 폰 로엔그람',
    description: '순백의 기함. 제국 최고의 기술력이 집약된 라인하르트의 전용함.',
  },
  {
    id: 'barbarossa',
    name: 'Barbarossa',
    nameKo: '바르바로사',
    faction: 'empire',
    shipClass: 'flagship',
    objFile: 'tgef_01_LoGHFlagship_01',  // 붉은색 - 원래 flagship_01이 바르바로사
    textures: {
      diffuse: 'tgef_01_LoGHFlagship_01_diffuse.dds',
      normal: 'tgef_01_LoGHFlagship_01_normal.dds',
      specular: 'tgef_01_LoGHFlagship_01_specular.dds',
    },
    commander: '지크프리트 키르히아이스',
    description: '적갈색의 기함. 키르히아이스의 전용함.',
  },
  {
    id: 'beowulf',
    name: 'Beowulf',
    nameKo: '베오울프',
    faction: 'empire',
    shipClass: 'flagship',
    objFile: 'tgef_01_LoGHFlagship_03',
    textures: {
      diffuse: 'tgef_01_LoGHFlagship_03_diffuse.dds',
      normal: 'tgef_01_LoGHFlagship_03_normal.dds',
      specular: 'tgef_01_LoGHFlagship_03_specular.dds',
    },
    commander: '볼프강 미터마이어',
    description: '질풍 볼프의 기함.',
  },
  {
    id: 'tristan',
    name: 'Tristan',
    nameKo: '트리스탄',
    faction: 'empire',
    shipClass: 'flagship',
    objFile: 'tgef_01_LoGHFlagship_04',
    textures: {
      diffuse: 'tgef_01_LoGHFlagship_04_diffuse.dds',
      normal: 'tgef_01_LoGHFlagship_04_normal.dds',
      specular: 'tgef_01_LoGHFlagship_04_specular.dds',
    },
    commander: '오스카 폰 로이엔탈',
    description: '금은요안의 기함.',
  },
  {
    id: 'koenigstiger',
    name: 'Königstiger',
    nameKo: '쾨니히스티거',
    faction: 'empire',
    shipClass: 'flagship',
    objFile: 'tgef_01_LoGHFlagship_05',
    textures: {
      diffuse: 'tgef_01_LoGHFlagship_05_diffuse.dds',
      normal: 'tgef_01_LoGHFlagship_05_normal.dds',
      specular: 'tgef_01_LoGHFlagship_05_specular.dds',
    },
    commander: '프리츠 요제프 비텐펠트',
    description: '흑색창기병함대 기함.',
  },
  {
    id: 'percival',
    name: 'Percival',
    nameKo: '퍼시발',
    faction: 'empire',
    shipClass: 'flagship',
    objFile: 'tgef_01_LoGHFlagship_06',
    textures: {
      diffuse: 'tgef_01_LoGHFlagship_06_diffuse.dds',
      normal: 'tgef_01_LoGHFlagship_06_normal.dds',
      specular: 'tgef_01_LoGHFlagship_06_specular.dds',
    },
    commander: '나이트하르트 뮐러',
    description: '철벽 뮐러의 기함.',
  },
  {
    id: 'gargantua',
    name: 'Gargantua',
    nameKo: '가르강튀아',
    faction: 'empire',
    shipClass: 'flagship',
    objFile: 'tgef_01_LoGHFlagship_07',
    textures: {
      diffuse: 'tgef_01_LoGHFlagship_07_diffuse.dds',
      normal: 'tgef_01_LoGHFlagship_07_normal.dds',
      specular: 'tgef_01_LoGHFlagship_07_specular.dds',
    },
    commander: '에른스트 폰 아이젠나흐',
    description: '침묵의 기함.',
  },
  {
    id: 'asgrimm',
    name: 'Asgrimm',
    nameKo: '아스그림',
    faction: 'empire',
    shipClass: 'flagship',
    objFile: 'tgef_01_LoGHFlagship_08',
    textures: {
      diffuse: 'tgef_01_LoGHFlagship_08_diffuse.dds',
      normal: 'tgef_01_LoGHFlagship_08_normal.dds',
      specular: 'tgef_01_LoGHFlagship_08_specular.dds',
    },
    commander: '아달베르트 폰 파렌하이트',
    description: '파렌하이트의 전용함.',
  },
  {
    id: 'quasar',
    name: 'Quasar',
    nameKo: '퀘이사',
    faction: 'empire',
    shipClass: 'flagship',
    objFile: 'tgef_01_LoGHFlagship_09',
    textures: {
      diffuse: 'tgef_01_LoGHFlagship_09_diffuse.dds',
      normal: 'tgef_01_LoGHFlagship_09_normal.dds',
      specular: 'tgef_01_LoGHFlagship_09_specular.dds',
    },
    commander: '에르네스트 메클링거',
    description: '예술제독의 기함.',
  },
];

// =====================================
// 제국군 일반 함선
// 주의: battleship_01(흰색)은 브륜힐트로 사용됨
// =====================================
export const STELLARIS_EMPIRE_SHIPS: StellarisShipAsset[] = [
  // 전함 (battleship_01은 브륜힐트로 기함에 포함)
  {
    id: 'empire_battleship_02',
    name: 'Imperial Battleship Type II',
    nameKo: '제국군 전함 2형',
    faction: 'empire',
    shipClass: 'battleship',
    objFile: 'tgef_01_battleship_02',
    textures: {
      diffuse: 'tgef_01_battleship_02_diffuse.dds',
      normal: 'tgef_01_battleship_02_normal.dds',
      specular: 'tgef_01_battleship_02_specular.dds',
    },
  },
  {
    id: 'empire_battleship_03',
    name: 'Imperial Battleship Type III',
    nameKo: '제국군 전함 3형',
    faction: 'empire',
    shipClass: 'battleship',
    objFile: 'tgef_01_battleship_03',
    textures: {
      diffuse: 'tgef_01_battleship_03_diffuse.dds',
      normal: 'tgef_01_battleship_03_normal.dds',
      specular: 'tgef_01_battleship_03_specular.dds',
    },
  },
  {
    id: 'empire_battleship_04',
    name: 'Imperial Battleship Type IV',
    nameKo: '제국군 전함 4형',
    faction: 'empire',
    shipClass: 'battleship',
    objFile: 'tgef_01_battleship_04',
    textures: {
      diffuse: 'tgef_01_battleship_04_diffuse.dds',
      normal: 'tgef_01_battleship_04_normal.dds',
      specular: 'tgef_01_battleship_04_specular.dds',
    },
  },
  {
    id: 'empire_oldbattleship',
    name: 'Imperial Old Battleship',
    nameKo: '제국군 구형 전함',
    faction: 'empire',
    shipClass: 'battleship',
    objFile: 'tgef_01_oldbattleship',
    textures: {
      diffuse: 'tgef_01_oldbattleship_diffuse.dds',
      normal: 'tgef_01_oldbattleship_normal.dds',
      specular: 'tgef_01_oldbattleship_specular.dds',
    },
    description: '골든바움 왕조 시절의 구형 전함',
  },
  
  // 순양함
  {
    id: 'empire_cruiser_01',
    name: 'Imperial Cruiser Type I',
    nameKo: '제국군 순양함 1형',
    faction: 'empire',
    shipClass: 'cruiser',
    objFile: 'tgef_01_cruiser_01',
    textures: {
      diffuse: 'tgef_01_cruiser_01_diffuse.dds',
      normal: 'tgef_01_cruiser_01_normal.dds',
      specular: 'tgef_01_cruiser_01_specular.dds',
    },
  },
  {
    id: 'empire_cruiser_02',
    name: 'Imperial Cruiser Type II',
    nameKo: '제국군 순양함 2형',
    faction: 'empire',
    shipClass: 'cruiser',
    objFile: 'tgef_01_cruiser_02',
    textures: {
      diffuse: 'tgef_01_cruiser_02_diffuse.dds',
      normal: 'tgef_01_cruiser_02_normal.dds',
      specular: 'tgef_01_cruiser_02_specular.dds',
    },
  },
  
  // 구축함
  {
    id: 'empire_destroyer_01',
    name: 'Imperial Destroyer Type I',
    nameKo: '제국군 구축함 1형',
    faction: 'empire',
    shipClass: 'destroyer',
    objFile: 'tgef_01_destroyer_01',
    textures: {
      diffuse: 'tgef_01_destroyer_01_diffuse.dds',
      normal: 'tgef_01_destroyer_01_normal.dds',
      specular: 'tgef_01_destroyer_01_specular.dds',
    },
  },
  {
    id: 'empire_destroyer_02',
    name: 'Imperial Destroyer Type II',
    nameKo: '제국군 구축함 2형',
    faction: 'empire',
    shipClass: 'destroyer',
    objFile: 'tgef_01_destroyer_02',
    textures: {
      diffuse: 'tgef_01_destroyer_02_diffuse.dds',
      normal: 'tgef_01_destroyer_02_normal.dds',
      specular: 'tgef_01_destroyer_02_specular.dds',
    },
  },
  
  // 코르벳
  {
    id: 'empire_corvette_01',
    name: 'Imperial Corvette Type I',
    nameKo: '제국군 코르벳 1형',
    faction: 'empire',
    shipClass: 'corvette',
    objFile: 'tgef_01_corvette_01',
    textures: {
      diffuse: 'tgef_01_corvette_01_diffuse.dds',
      normal: 'tgef_01_corvette_01_normal.dds',
      specular: 'tgef_01_corvette_01_specular.dds',
    },
  },
  {
    id: 'empire_corvette_02',
    name: 'Imperial Corvette Type II',
    nameKo: '제국군 코르벳 2형',
    faction: 'empire',
    shipClass: 'corvette',
    objFile: 'tgef_01_corvette_02',
    textures: {
      diffuse: 'tgef_01_corvette_02_diffuse.dds',
      normal: 'tgef_01_corvette_02_normal.dds',
      specular: 'tgef_01_corvette_02_specular.dds',
    },
  },
  
  // 항공모함
  {
    id: 'empire_carrier',
    name: 'Imperial Carrier',
    nameKo: '제국군 항공모함',
    faction: 'empire',
    shipClass: 'carrier',
    objFile: 'tgef_01_carrier',
    textures: {
      diffuse: 'tgef_01_carrier_diffuse.dds',
      normal: 'tgef_01_carrier_normal.dds',
      specular: 'tgef_01_carrier_specular.dds',
    },
  },
  
  // 전투기 (발키레)
  {
    id: 'empire_fighter',
    name: 'Walküre',
    nameKo: '발키레',
    faction: 'empire',
    shipClass: 'fighter',
    objFile: 'tgef_01_fighter',
    textures: {
      diffuse: 'tgef_01_fighter_diffuse.dds',
      normal: 'tgef_01_fighter_normal.dds',
      specular: 'tgef_01_fighter_specular.dds',
    },
    description: '제국군 주력 우주전투기',
  },
  
  // 타이탄
  {
    id: 'empire_titan',
    name: 'Imperial Titan',
    nameKo: '제국군 타이탄',
    faction: 'empire',
    shipClass: 'titan',
    objFile: 'tgef_01_titan_bow',
    textures: {
      diffuse: 'tgef_01_titan_bow_diffuse.dds',
      normal: 'tgef_01_titan_bow_normal.dds',
      specular: 'tgef_01_titan_bow_specular.dds',
    },
  },
  
  // 저거넛
  {
    id: 'empire_juggernaut',
    name: 'Imperial Juggernaut',
    nameKo: '제국군 저거넛',
    faction: 'empire',
    shipClass: 'juggernaut',
    objFile: 'tgef_01_juggernaut',
    textures: {
      diffuse: 'tgef_01_juggernaut_diffuse.dds',
      normal: 'tgef_01_juggernaut_normal.dds',
      specular: 'tgef_01_juggernaut_specular.dds',
    },
  },
  
  // 콜로서스
  {
    id: 'empire_colossus',
    name: 'Imperial Colossus',
    nameKo: '제국군 콜로서스',
    faction: 'empire',
    shipClass: 'colossus',
    objFile: 'tgef_01_colossus',
    textures: {
      diffuse: 'tgef_01_colossus_diffuse.dds',
      normal: 'tgef_01_colossus_normal.dds',
      specular: 'tgef_01_colossus_specular.dds',
    },
  },
  
  // 유틸리티
  {
    id: 'empire_transport',
    name: 'Imperial Transport',
    nameKo: '제국군 수송선',
    faction: 'empire',
    shipClass: 'transport',
    objFile: 'tgef_01_transport',
    textures: {
      diffuse: 'tgef_01_transport_diffuse.dds',
      normal: 'tgef_01_transport_normal.dds',
      specular: 'tgef_01_transport_specular.dds',
    },
  },
  {
    id: 'empire_science',
    name: 'Imperial Science Ship',
    nameKo: '제국군 과학선',
    faction: 'empire',
    shipClass: 'science',
    objFile: 'tgef_01_science',
    textures: {
      diffuse: 'tgef_01_science_diffuse.dds',
      normal: 'tgef_01_science_normal.dds',
      specular: 'tgef_01_science_specular.dds',
    },
  },
  {
    id: 'empire_construction',
    name: 'Imperial Construction Ship',
    nameKo: '제국군 건설선',
    faction: 'empire',
    shipClass: 'construction',
    objFile: 'tgef_01_construction',
    textures: {
      diffuse: 'tgef_01_construction_diffuse.dds',
      normal: 'tgef_01_construction_normal.dds',
      specular: 'tgef_01_construction_specular.dds',
    },
  },
  {
    id: 'empire_colony',
    name: 'Imperial Colony Ship',
    nameKo: '제국군 식민선',
    faction: 'empire',
    shipClass: 'colony',
    objFile: 'tgef_01_colony',
    textures: {
      diffuse: 'tgef_01_colony_diffuse.dds',
      normal: 'tgef_01_colony_normal.dds',
      specular: 'tgef_01_colony_specular.dds',
    },
  },
];

// =====================================
// 제국군 스테이션
// =====================================
export const STELLARIS_EMPIRE_STATIONS: StellarisShipAsset[] = [
  {
    id: 'empire_citadel',
    name: 'Imperial Citadel',
    nameKo: '제국군 시타델',
    faction: 'empire',
    shipClass: 'station',
    objFile: 'tgef_01_citadel',
    textures: {
      diffuse: 'tgef_01_citadel_diffuse.dds',
      normal: 'tgef_01_citadel_normal.dds',
      specular: 'tgef_01_citadel_specular.dds',
    },
  },
  {
    id: 'empire_starfort',
    name: 'Imperial Star Fortress',
    nameKo: '제국군 항성요새',
    faction: 'empire',
    shipClass: 'station',
    objFile: 'tgef_01_starfort',
    textures: {
      diffuse: 'tgef_01_starfort_diffuse.dds',
      normal: 'tgef_01_starfort_normal.dds',
      specular: 'tgef_01_starfort_specular.dds',
    },
  },
  {
    id: 'empire_starhold',
    name: 'Imperial Starhold',
    nameKo: '제국군 항성기지',
    faction: 'empire',
    shipClass: 'station',
    objFile: 'tgef_01_starhold',
    textures: {
      diffuse: 'tgef_01_starhold_diffuse.dds',
      normal: 'tgef_01_starhold_normal.dds',
      specular: 'tgef_01_starhold_specular.dds',
    },
  },
  {
    id: 'empire_starport',
    name: 'Imperial Starport',
    nameKo: '제국군 우주항',
    faction: 'empire',
    shipClass: 'station',
    objFile: 'tgef_01_starport',
    textures: {
      diffuse: 'tgef_01_starport_diffuse.dds',
      normal: 'tgef_01_starport_normal.dds',
      specular: 'tgef_01_starport_specular.dds',
    },
  },
  {
    id: 'empire_orbital_station',
    name: 'Imperial Orbital Station',
    nameKo: '제국군 궤도 스테이션',
    faction: 'empire',
    shipClass: 'station',
    objFile: 'tgef_01_orbital_station',
    textures: {
      diffuse: 'tgef_01_orbital_station_diffuse.dds',
      normal: 'tgef_01_orbital_station_normal.dds',
      specular: 'tgef_01_orbital_station_specular.dds',
    },
  },
  {
    id: 'empire_ion_cannon',
    name: 'Imperial Ion Cannon',
    nameKo: '제국군 이온포',
    faction: 'empire',
    shipClass: 'station',
    objFile: 'tgef_01_ion_cannon',
    textures: {
      diffuse: 'tgef_01_ion_cannon_diffuse.dds',
      normal: 'tgef_01_ion_cannon_normal.dds',
      specular: 'tgef_01_ion_cannon_specular.dds',
    },
    description: '토르의 망치 스타일 대형 레이저포',
  },
];

// =====================================
// 동맹군 기함 (LOGH Flagships)
// =====================================
export const STELLARIS_ALLIANCE_FLAGSHIPS: StellarisShipAsset[] = [
  {
    id: 'hyperion',
    name: 'Hyperion',
    nameKo: '휴베리온',
    faction: 'alliance',
    shipClass: 'flagship',
    objFile: 'tfpa_01_LoGHFlagship_01',
    textures: {
      diffuse: 'tfpa_01_LoGHFlagship_01_diffuse.dds',
      normal: 'tfpa_01_LoGHFlagship_01_normal.dds',
      specular: 'tfpa_01_LoGHFlagship_01_specular.dds',
    },
    commander: '양 웬리',
    description: '마술사의 기함. 양 웬리의 전용함.',
  },
  {
    id: 'rio_grande',
    name: 'Rio Grande',
    nameKo: '리오 그란데',
    faction: 'alliance',
    shipClass: 'flagship',
    objFile: 'tfpa_01_LoGHFlagship_02',
    textures: {
      diffuse: 'tfpa_01_LoGHFlagship_02_diffuse.dds',
      normal: 'tfpa_01_LoGHFlagship_02_Normal.dds',
      specular: 'tfpa_01_LoGHFlagship_02_specular.dds',
    },
    commander: '알렉산드르 뷰코크',
    description: '동맹군 우주함대 총사령관의 기함.',
  },
  {
    id: 'ulysses',
    name: 'Ulysses',
    nameKo: '율리시즈',
    faction: 'alliance',
    shipClass: 'flagship',
    objFile: 'tfpa_01_LoGHFlagship_03',
    textures: {
      diffuse: 'tfpa_01_LoGHFlagship_03_diffuse.dds',
      normal: 'tfpa_01_LoGHFlagship_03_normal.dds',
      specular: 'tfpa_01_LoGHFlagship_03_specular.dds',
    },
    commander: '율리안 민츠',
    description: '율리안의 기함.',
  },
  {
    id: 'triglav',
    name: 'Triglav',
    nameKo: '트리글라프',
    faction: 'alliance',
    shipClass: 'flagship',
    objFile: 'tfpa_01_LoGHFlagship_04',
    textures: {
      diffuse: 'tfpa_01_LoGHFlagship_04_diffuse.dds',
      normal: 'tfpa_01_LoGHFlagship_04_Normal.dds',
      specular: 'tfpa_01_LoGHFlagship_04_specular.dds',
    },
    commander: '더스티 아텐보로',
    description: '아텐보로의 기함.',
  },
  {
    id: 'leyflir',
    name: 'Leyflir',
    nameKo: '레이플리르',
    faction: 'alliance',
    shipClass: 'flagship',
    objFile: 'tfpa_01_LoGHFlagship_05',
    textures: {
      diffuse: 'tfpa_01_LoGHFlagship_05_diffuse.dds',
      normal: 'tfpa_01_LoGHFlagship_05_normal.dds',
      specular: 'tfpa_01_LoGHFlagship_05_specular.dds',
    },
    commander: '에드윈 피셔',
    description: '피셔 제독의 기함.',
  },
  {
    id: 'patroclos',
    name: 'Patroclos',
    nameKo: '파트로클로스',
    faction: 'alliance',
    shipClass: 'flagship',
    objFile: 'tfpa_01_LoGHFlagship_06',
    textures: {
      diffuse: 'tfpa_01_LoGHFlagship_06_diffuse.dds',
      normal: 'tfpa_01_LoGHFlagship_06_normal.dds',
      specular: 'tfpa_01_LoGHFlagship_06_specular.dds',
    },
    commander: '파에타',
    description: '아스타르테 회전 당시 동맹군 기함.',
  },
  {
    id: 'aonikenk',
    name: 'Aonikenk',
    nameKo: '아오니켄크',
    faction: 'alliance',
    shipClass: 'flagship',
    objFile: 'tfpa_01_LoGHFlagship_07',
    textures: {
      diffuse: 'tfpa_01_LoGHFlagship_07_diffuse.dds',
      normal: 'tfpa_01_LoGHFlagship_07_normal.dds',
      specular: 'tfpa_01_LoGHFlagship_07_specular.dds',
    },
    commander: '비로라이넨',
    description: '비로라이넨의 기함.',
  },
  {
    id: 'maurya',
    name: 'Maurya',
    nameKo: '마우리아',
    faction: 'alliance',
    shipClass: 'flagship',
    objFile: 'tfpa_01_LoGHFlagship_08',
    textures: {
      diffuse: 'tfpa_01_LoGHFlagship_08_diffuse.dds',
      normal: 'tfpa_01_LoGHFlagship_08_normal.dds',
      specular: 'tfpa_01_LoGHFlagship_08_specular.dds',
    },
    commander: '응우옌 반 후에',
    description: '응우옌의 기함.',
  },
  {
    id: 'ulanbator',
    name: 'Ulan Bator',
    nameKo: '울란바토르',
    faction: 'alliance',
    shipClass: 'flagship',
    objFile: 'tfpa_01_LoGHFlagship_09',
    textures: {
      diffuse: 'tfpa_01_LoGHFlagship_09_diffuse.dds',
      normal: 'tfpa_01_LoGHFlagship_09_Normal.dds',
      specular: 'tfpa_01_LoGHFlagship_09_specular.dds',
    },
    commander: '우란프',
    description: '우란프의 기함.',
  },
];

// =====================================
// 동맹군 일반 함선
// =====================================
export const STELLARIS_ALLIANCE_SHIPS: StellarisShipAsset[] = [
  // 전함
  {
    id: 'alliance_battleship_01',
    name: 'Alliance Battleship Type I',
    nameKo: '동맹군 전함 1형',
    faction: 'alliance',
    shipClass: 'battleship',
    objFile: 'tfpa_01_battleship_01',
    textures: {
      diffuse: 'tfpa_01_battleship_01_diffuse.dds',
      normal: 'tfpa_01_battleship_01_normal.dds',
      specular: 'tfpa_01_battleship_01_specular.dds',
    },
  },
  {
    id: 'alliance_battleship_02',
    name: 'Alliance Battleship Type II',
    nameKo: '동맹군 전함 2형',
    faction: 'alliance',
    shipClass: 'battleship',
    objFile: 'tfpa_01_battleship_02',
    textures: {
      diffuse: 'tfpa_01_battleship_02_diffuse.dds',
      normal: 'tfpa_01_battleship_02_normal.dds',
      specular: 'tfpa_01_battleship_02_specular.dds',
    },
  },
  {
    id: 'alliance_oldbattleship',
    name: 'Alliance Old Battleship',
    nameKo: '동맹군 구형 전함',
    faction: 'alliance',
    shipClass: 'battleship',
    objFile: 'tfpa_01_oldbattleship',
    textures: {
      diffuse: 'tfpa_01_oldbattleship_diffuse.dds',
      normal: 'tfpa_01_oldbattleship_normal.dds',
      specular: 'tfpa_01_oldbattleship_specular.dds',
    },
    description: '초기형 동맹군 전함',
  },
  
  // 순양함
  {
    id: 'alliance_cruiser_01',
    name: 'Alliance Cruiser Type I',
    nameKo: '동맹군 순양함 1형',
    faction: 'alliance',
    shipClass: 'cruiser',
    objFile: 'tfpa_01_cruiser_01',
    textures: {
      diffuse: 'tfpa_01_cruiser_01_diffuse.dds',
      normal: 'tfpa_01_cruiser_01_normal.dds',
      specular: 'tfpa_01_cruiser_01_specular.dds',
    },
  },
  {
    id: 'alliance_cruiser_02',
    name: 'Alliance Cruiser Type II',
    nameKo: '동맹군 순양함 2형',
    faction: 'alliance',
    shipClass: 'cruiser',
    objFile: 'tfpa_01_cruiser_02',
    textures: {
      diffuse: 'tfpa_01_cruiser_02_diffuse.dds',
      normal: 'tfpa_01_cruiser_02_normal.dds',
      specular: 'tfpa_01_cruiser_02_specular.dds',
    },
  },
  
  // 구축함
  {
    id: 'alliance_destroyer',
    name: 'Alliance Destroyer',
    nameKo: '동맹군 구축함',
    faction: 'alliance',
    shipClass: 'destroyer',
    objFile: 'tfpa_01_destroyer',
    textures: {
      diffuse: 'tfpa_01_destroyer_diffuse.dds',
      normal: 'tfpa_01_destroyer_normal.dds',
      specular: 'tfpa_01_destroyer_specular.dds',
    },
  },
  
  // 코르벳
  {
    id: 'alliance_corvette',
    name: 'Alliance Corvette',
    nameKo: '동맹군 코르벳',
    faction: 'alliance',
    shipClass: 'corvette',
    objFile: 'tfpa_01_corvette',
    textures: {
      diffuse: 'tfpa_01_corvette_diffuse.dds',
      normal: 'tfpa_01_corvette_normal.dds',
      specular: 'tfpa_01_corvette_specular.dds',
    },
  },
  
  // 항공모함
  {
    id: 'alliance_carrier',
    name: 'Alliance Carrier',
    nameKo: '동맹군 항공모함',
    faction: 'alliance',
    shipClass: 'carrier',
    objFile: 'tfpa_01_carrier',
    textures: {
      diffuse: 'tfpa_01_carrier_diffuse.dds',
      normal: 'tfpa_01_carrier_normal.dds',
      specular: 'tfpa_01_carrier_specular.dds',
    },
  },
  
  // 전투기 (스파르타니안)
  {
    id: 'alliance_fighter',
    name: 'Spartanian',
    nameKo: '스파르타니안',
    faction: 'alliance',
    shipClass: 'fighter',
    objFile: 'tfpa_01_fighter',
    textures: {
      diffuse: 'tfpa_01_fighter_diffuse.dds',
      normal: 'tfpa_01_fighter_normal.dds',
      specular: 'tfpa_01_fighter_specular.dds',
    },
    description: '동맹군 주력 우주전투기',
  },
  
  // 타이탄
  {
    id: 'alliance_titan',
    name: 'Alliance Titan',
    nameKo: '동맹군 타이탄',
    faction: 'alliance',
    shipClass: 'titan',
    objFile: 'tfpa_01_titan_bow',
    textures: {
      diffuse: 'tfpa_01_titan_bow_diffuse.dds',
      normal: 'tfpa_01_titan_bow_normal.dds',
      specular: 'tfpa_01_titan_bow_specular.dds',
    },
  },
  
  // 저거넛
  {
    id: 'alliance_juggernaut',
    name: 'Alliance Juggernaut',
    nameKo: '동맹군 저거넛',
    faction: 'alliance',
    shipClass: 'juggernaut',
    objFile: 'tfpa_01_juggernaut',
    textures: {
      diffuse: 'tfpa_01_juggernaut_diffuse.dds',
      normal: 'tfpa_01_juggernaut_normal.dds',
      specular: 'tfpa_01_juggernaut_specular.dds',
    },
  },
  
  // 콜로서스
  {
    id: 'alliance_colossus',
    name: 'Alliance Colossus',
    nameKo: '동맹군 콜로서스',
    faction: 'alliance',
    shipClass: 'colossus',
    objFile: 'tfpa_01_colossus',
    textures: {
      diffuse: 'tfpa_01_colossus_diffuse.dds',
      normal: 'tfpa_01_colossus_normal.dds',
      specular: 'tfpa_01_colossus_specular.dds',
    },
  },
  
  // 유틸리티
  {
    id: 'alliance_transport',
    name: 'Alliance Transport',
    nameKo: '동맹군 수송선',
    faction: 'alliance',
    shipClass: 'transport',
    objFile: 'tfpa_01_transport',
    textures: {
      diffuse: 'tfpa_01_transport_diffuse.dds',
      normal: 'tfpa_01_transport_normal.dds',
      specular: 'tfpa_01_transport_specular.dds',
    },
  },
  {
    id: 'alliance_science',
    name: 'Alliance Science Ship',
    nameKo: '동맹군 과학선',
    faction: 'alliance',
    shipClass: 'science',
    objFile: 'tfpa_01_science',
    textures: {
      diffuse: 'tfpa_01_science_diffuse.dds',
      normal: 'tfpa_01_science_normal.dds',
      specular: 'tfpa_01_science_specular.dds',
    },
  },
  {
    id: 'alliance_construction',
    name: 'Alliance Construction Ship',
    nameKo: '동맹군 건설선',
    faction: 'alliance',
    shipClass: 'construction',
    objFile: 'tfpa_01_construction',
    textures: {
      diffuse: 'tfpa_01_construction_diffuse.dds',
      normal: 'tfpa_01_construction_normal.dds',
      specular: 'tfpa_01_construction_specular.dds',
    },
  },
  {
    id: 'alliance_colony',
    name: 'Alliance Colony Ship',
    nameKo: '동맹군 식민선',
    faction: 'alliance',
    shipClass: 'colony',
    objFile: 'tfpa_01_colony',
    textures: {
      diffuse: 'tfpa_01_colony_diffuse.dds',
      normal: 'tfpa_01_colony_normal.dds',
      specular: 'tfpa_01_colony_specular.dds',
    },
  },
];

// =====================================
// 모든 에셋 통합
// =====================================
export const ALL_STELLARIS_ASSETS: StellarisShipAsset[] = [
  ...STELLARIS_EMPIRE_FLAGSHIPS,
  ...STELLARIS_EMPIRE_SHIPS,
  ...STELLARIS_EMPIRE_STATIONS,
  ...STELLARIS_ALLIANCE_FLAGSHIPS,
  ...STELLARIS_ALLIANCE_SHIPS,
];

// =====================================
// 검색/필터 유틸리티
// =====================================

export function getStellarisShipById(id: string): StellarisShipAsset | undefined {
  return ALL_STELLARIS_ASSETS.find(ship => ship.id === id);
}

export function getStellarisShipByObjFile(objFile: string): StellarisShipAsset | undefined {
  return ALL_STELLARIS_ASSETS.find(ship => ship.objFile === objFile);
}

export function getStellarisShipsByFaction(faction: StellarisShipFaction): StellarisShipAsset[] {
  return ALL_STELLARIS_ASSETS.filter(ship => ship.faction === faction);
}

export function getStellarisShipsByClass(shipClass: StellarisShipClass): StellarisShipAsset[] {
  return ALL_STELLARIS_ASSETS.filter(ship => ship.shipClass === shipClass);
}

export function getStellarisFlagships(): StellarisShipAsset[] {
  return [...STELLARIS_EMPIRE_FLAGSHIPS, ...STELLARIS_ALLIANCE_FLAGSHIPS];
}

export function getStellarisShipByCommander(commander: string): StellarisShipAsset | undefined {
  return getStellarisFlagships().find(ship => 
    ship.commander?.includes(commander)
  );
}

// 진영별 색상
export const STELLARIS_FACTION_COLORS = {
  empire: {
    primary: 0x1a1a2e,    // 어두운 남색
    secondary: 0xffd700,  // 금색
    accent: 0xff4500,     // 주황
  },
  alliance: {
    primary: 0x0d1b2a,    // 짙은 청색
    secondary: 0x00bfff,  // 청록
    accent: 0x32cd32,     // 녹색
  },
};


