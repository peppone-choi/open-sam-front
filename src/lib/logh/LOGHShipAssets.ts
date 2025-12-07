/**
 * LOGH 함선 자산 매핑
 * 
 * Stellaris LOGH 모드의 함선별 메쉬/텍스처 매핑 정보
 */

export type StellarisShipFaction = 'empire' | 'alliance' | 'neutral';
export type StellarisShipType = 'flagship' | 'battleship' | 'cruiser' | 'destroyer' | 'corvette' | 
                       'carrier' | 'fighter' | 'transport' | 'construction' | 'science' | 
                       'colony' | 'titan' | 'juggernaut' | 'station' | 'fortress';

export interface StellarisShipTextures {
  diffuse: string;
  normal: string;
  specular: string;
}

export interface StellarisShipAssetDef {
  id: string;
  name: string;
  nameKo: string;
  faction: StellarisShipFaction;
  type: StellarisShipType;
  model: string;          // OBJ 파일명 (확장자 제외)
  textures: StellarisShipTextures;
  commander?: string;     // 기함의 경우 지휘관
  scale?: number;         // 스케일 조정 (기본 1.0)
}

// ===== 제국 기함 =====
export const STELLARIS_EMPIRE_FLAGSHIPS: StellarisShipAssetDef[] = [
  {
    id: 'brunhild',
    name: 'Brünhild',
    nameKo: '브륜힐트',
    faction: 'empire',
    type: 'flagship',
    model: 'tgef_01_LoGHFlagship_01',
    textures: {
      diffuse: 'tgef_01_loghflagship_01_diffuse.png',
      normal: 'tgef_01_loghflagship_01_normal.png',
      specular: 'tgef_01_loghflagship_01_specular.png',
    },
    commander: '라인하르트 폰 로엔그람',
  },
  {
    id: 'barbarossa',
    name: 'Barbarossa',
    nameKo: '바르바로사',
    faction: 'empire',
    type: 'flagship',
    model: 'tgef_01_LoGHFlagship_02',
    textures: {
      diffuse: 'tgef_01_loghflagship_02_diffuse.png',
      normal: 'tgef_01_loghflagship_02_normal.png',
      specular: 'tgef_01_loghflagship_02_specular.png',
    },
    commander: '지크프리트 키르히아이스',
  },
  {
    id: 'tristan',
    name: 'Tristan',
    nameKo: '트리스탄',
    faction: 'empire',
    type: 'flagship',
    model: 'tgef_01_LoGHFlagship_03',
    textures: {
      diffuse: 'tgef_01_loghflagship_03_diffuse.png',
      normal: 'tgef_01_loghflagship_03_normal.png',
      specular: 'tgef_01_loghflagship_03_specular.png',
    },
    commander: '오스카 폰 로이엔탈',
  },
  {
    id: 'perceval',
    name: 'Perceval',
    nameKo: '퍼시벌',
    faction: 'empire',
    type: 'flagship',
    model: 'tgef_01_LoGHFlagship_04',
    textures: {
      diffuse: 'tgef_01_loghflagship_04_diffuse.png',
      normal: 'tgef_01_loghflagship_04_normal.png',
      specular: 'tgef_01_loghflagship_04_specular.png',
    },
    commander: '볼프강 미터마이어',
  },
  {
    id: 'eisenach',
    name: 'Eisenach',
    nameKo: '아이젠나흐',
    faction: 'empire',
    type: 'flagship',
    model: 'tgef_01_LoGHFlagship_05',
    textures: {
      diffuse: 'tgef_01_loghflagship_05_diffuse.png',
      normal: 'tgef_01_loghflagship_05_normal.png',
      specular: 'tgef_01_loghflagship_05_specular.png',
    },
    commander: '어윈 요제프 비텐펠트',
  },
  {
    id: 'citoren',
    name: 'Citoren',
    nameKo: '시토렌',
    faction: 'empire',
    type: 'flagship',
    model: 'tgef_01_LoGHFlagship_06',
    textures: {
      diffuse: 'tgef_01_loghflagship_06_diffuse.png',
      normal: 'tgef_01_loghflagship_06_normal.png',
      specular: 'tgef_01_loghflagship_06_specular.png',
    },
    commander: '에른스트 폰 아이젠나흐',
  },
  {
    id: 'huberic',
    name: 'Hüberic',
    nameKo: '휴베릭',
    faction: 'empire',
    type: 'flagship',
    model: 'tgef_01_LoGHFlagship_07',
    textures: {
      diffuse: 'tgef_01_loghflagship_07_diffuse.png',
      normal: 'tgef_01_loghflagship_07_normal.png',
      specular: 'tgef_01_loghflagship_07_specular.png',
    },
    commander: '오귀스트 자무엘 바렌',
  },
  {
    id: 'manfred_ii',
    name: 'Manfred II',
    nameKo: '만프레트 2세',
    faction: 'empire',
    type: 'flagship',
    model: 'tgef_01_LoGHFlagship_08',
    textures: {
      diffuse: 'tgef_01_loghflagship_08_diffuse.png',
      normal: 'tgef_01_loghflagship_08_normal.png',
      specular: 'tgef_01_loghflagship_08_specular.png',
    },
    commander: '프리츠 요제프 비텐펠트',
  },
  {
    id: 'greif',
    name: 'Greif',
    nameKo: '그라이프',
    faction: 'empire',
    type: 'flagship',
    model: 'tgef_01_LoGHFlagship_09',
    textures: {
      diffuse: 'tgef_01_loghflagship_09_diffuse.png',
      normal: 'tgef_01_loghflagship_09_normal.png',
      specular: 'tgef_01_loghflagship_09_specular.png',
    },
    commander: '나이트하르트 뮐러',
  },
];

// ===== 동맹 기함 =====
export const STELLARIS_ALLIANCE_FLAGSHIPS: StellarisShipAssetDef[] = [
  {
    id: 'hyperion',
    name: 'Hyperion',
    nameKo: '히페리온',
    faction: 'alliance',
    type: 'flagship',
    model: 'tfpa_01_LoGHFlagship_01',
    textures: {
      diffuse: 'tfpa_01_loghflagship_01_diffuse.png',
      normal: 'tfpa_01_loghflagship_01_normal.png',
      specular: 'tfpa_01_loghflagship_01_specular.png',
    },
    commander: '양 웬리',
  },
  {
    id: 'triglav',
    name: 'Triglav',
    nameKo: '트리글라프',
    faction: 'alliance',
    type: 'flagship',
    model: 'tfpa_01_LoGHFlagship_02',
    textures: {
      diffuse: 'tfpa_01_loghflagship_02_diffuse.png',
      normal: 'tfpa_01_loghflagship_02_normal.png',
      specular: 'tfpa_01_loghflagship_02_specular.png',
    },
    commander: '알렉산드르 뷰코크',
  },
  {
    id: 'laiger',
    name: 'Laiger',
    nameKo: '라이거',
    faction: 'alliance',
    type: 'flagship',
    model: 'tfpa_01_LoGHFlagship_03',
    textures: {
      diffuse: 'tfpa_01_loghflagship_03_diffuse.png',
      normal: 'tfpa_01_loghflagship_03_normal.png',
      specular: 'tfpa_01_loghflagship_03_specular.png',
    },
    commander: '우란프',
  },
  {
    id: 'patroklos',
    name: 'Patroklos',
    nameKo: '파트로클로스',
    faction: 'alliance',
    type: 'flagship',
    model: 'tfpa_01_LoGHFlagship_04',
    textures: {
      diffuse: 'tfpa_01_loghflagship_04_diffuse.png',
      normal: 'tfpa_01_loghflagship_04_normal.png',
      specular: 'tfpa_01_loghflagship_04_specular.png',
    },
    commander: '더스티 아텐보로',
  },
  {
    id: 'moria',
    name: 'Moria',
    nameKo: '모리아',
    faction: 'alliance',
    type: 'flagship',
    model: 'tfpa_01_LoGHFlagship_05',
    textures: {
      diffuse: 'tfpa_01_loghflagship_05_diffuse.png',
      normal: 'tfpa_01_loghflagship_05_normal.png',
      specular: 'tfpa_01_loghflagship_05_specular.png',
    },
    commander: '에드윈 피셔',
  },
  {
    id: 'leonidas',
    name: 'Leonidas',
    nameKo: '레오니다스',
    faction: 'alliance',
    type: 'flagship',
    model: 'tfpa_01_LoGHFlagship_06',
    textures: {
      diffuse: 'tfpa_01_loghflagship_06_diffuse.png',
      normal: 'tfpa_01_loghflagship_06_normal.png',
      specular: 'tfpa_01_loghflagship_06_specular.png',
    },
    commander: '올리비에 포플랭',
  },
  {
    id: 'leda_ii',
    name: 'Leda II',
    nameKo: '레다 2세',
    faction: 'alliance',
    type: 'flagship',
    model: 'tfpa_01_LoGHFlagship_07',
    textures: {
      diffuse: 'tfpa_01_loghflagship_07_diffuse.png',
      normal: 'tfpa_01_loghflagship_07_normal.png',
      specular: 'tfpa_01_loghflagship_07_specular.png',
    },
    commander: '마리노',
  },
  {
    id: 'aias',
    name: 'Aias',
    nameKo: '아이아스',
    faction: 'alliance',
    type: 'flagship',
    model: 'tfpa_01_LoGHFlagship_08',
    textures: {
      diffuse: 'tfpa_01_loghflagship_08_diffuse.png',
      normal: 'tfpa_01_loghflagship_08_normal.png',
      specular: 'tfpa_01_loghflagship_08_specular.png',
    },
    commander: '왈터 폰 셴코프',
  },
  {
    id: 'massasoit',
    name: 'Massasoit',
    nameKo: '마사소이트',
    faction: 'alliance',
    type: 'flagship',
    model: 'tfpa_01_LoGHFlagship_09',
    textures: {
      diffuse: 'tfpa_01_loghflagship_09_diffuse.png',
      normal: 'tfpa_01_loghflagship_09_normal.png',
      specular: 'tfpa_01_loghflagship_09_specular.png',
    },
    commander: '몰튼',
  },
];

// ===== 제국 일반 함선 =====
export const STELLARIS_EMPIRE_SHIPS: StellarisShipAssetDef[] = [
  {
    id: 'empire_battleship_01',
    name: 'Imperial Battleship Type A',
    nameKo: '제국 전함 A형',
    faction: 'empire',
    type: 'battleship',
    model: 'tgef_01_battleship_01',
    textures: {
      diffuse: 'tgef_01_battleship_04_diffuse.png',
      normal: 'tgef_01_battleship_04_normal.png',
      specular: 'tgef_01_battleship_04_specular.png',
    },
  },
  {
    id: 'empire_battleship_02',
    name: 'Imperial Battleship Type B',
    nameKo: '제국 전함 B형',
    faction: 'empire',
    type: 'battleship',
    model: 'tgef_01_battleship_02',
    textures: {
      diffuse: 'tgef_01_battleship_02_diffuse.png',
      normal: 'tgef_01_battleship_02_normal.png',
      specular: 'tgef_01_battleship_02_specular.png',
    },
  },
  {
    id: 'empire_battleship_03',
    name: 'Imperial Battleship Type C',
    nameKo: '제국 전함 C형',
    faction: 'empire',
    type: 'battleship',
    model: 'tgef_01_battleship_03',
    textures: {
      diffuse: 'tgef_01_battleship_03_diffuse.png',
      normal: 'tgef_01_battleship_02_normal.png',
      specular: 'tgef_01_battleship_02_specular.png',
    },
  },
  {
    id: 'empire_battleship_04',
    name: 'Imperial Battleship Type D',
    nameKo: '제국 전함 D형',
    faction: 'empire',
    type: 'battleship',
    model: 'tgef_01_battleship_04',
    textures: {
      diffuse: 'tgef_01_battleship_04_diffuse.png',
      normal: 'tgef_01_battleship_04_normal.png',
      specular: 'tgef_01_battleship_04_specular.png',
    },
  },
  {
    id: 'empire_cruiser_01',
    name: 'Imperial Cruiser Type A',
    nameKo: '제국 순양함 A형',
    faction: 'empire',
    type: 'cruiser',
    model: 'tgef_01_cruiser_01',
    textures: {
      diffuse: 'tgef_01_cruiser_01_diffuse.png',
      normal: 'tgef_01_cruiser_normal.png',
      specular: 'tgef_01_cruiser_specular.png',
    },
  },
  {
    id: 'empire_cruiser_02',
    name: 'Imperial Cruiser Type B',
    nameKo: '제국 순양함 B형',
    faction: 'empire',
    type: 'cruiser',
    model: 'tgef_01_cruiser_02',
    textures: {
      diffuse: 'tgef_01_cruiser_02_diffuse.png',
      normal: 'tgef_01_cruiser_normal.png',
      specular: 'tgef_01_cruiser_specular.png',
    },
  },
  {
    id: 'empire_destroyer_01',
    name: 'Imperial Destroyer Type A',
    nameKo: '제국 구축함 A형',
    faction: 'empire',
    type: 'destroyer',
    model: 'tgef_01_destroyer_01',
    textures: {
      diffuse: 'tgef_01_destroyer_01_diffuse.png',
      normal: 'tgef_01_destroyer_01_normal.png',
      specular: 'tgef_01_destroyer_01_specular.png',
    },
  },
  {
    id: 'empire_destroyer_02',
    name: 'Imperial Destroyer Type B',
    nameKo: '제국 구축함 B형',
    faction: 'empire',
    type: 'destroyer',
    model: 'tgef_01_destroyer_02',
    textures: {
      diffuse: 'tgef_01_destroyer_02_diffuse.png',
      normal: 'tgef_01_destroyer_01_normal.png',
      specular: 'tgef_01_destroyer_01_specular.png',
    },
  },
  {
    id: 'empire_corvette_01',
    name: 'Imperial Corvette Type A',
    nameKo: '제국 초계함 A형',
    faction: 'empire',
    type: 'corvette',
    model: 'tgef_01_corvette_01',
    textures: {
      diffuse: 'tgef_01_corvette_01_diffuse.png',
      normal: 'tgef_01_corvette_01_normal.png',
      specular: 'tgef_01_corvette_01_specular.png',
    },
  },
  {
    id: 'empire_corvette_02',
    name: 'Imperial Corvette Type B',
    nameKo: '제국 초계함 B형',
    faction: 'empire',
    type: 'corvette',
    model: 'tgef_01_corvette_02',
    textures: {
      diffuse: 'tgef_01_corvette_02_diffuse.png',
      normal: 'tgef_01_corvette_01_normal.png',
      specular: 'tgef_01_corvette_01_specular.png',
    },
  },
  {
    id: 'empire_carrier',
    name: 'Imperial Carrier',
    nameKo: '제국 항공모함',
    faction: 'empire',
    type: 'carrier',
    model: 'tgef_01_carrier',
    textures: {
      diffuse: 'tgef_01_carrier_diffuse.png',
      normal: 'tgef_01_carrier_normal.png',
      specular: 'tgef_01_carrier_specular.png',
    },
  },
  {
    id: 'empire_fighter',
    name: 'Imperial Fighter',
    nameKo: '제국 전투기',
    faction: 'empire',
    type: 'fighter',
    model: 'tgef_01_fighter',
    textures: {
      diffuse: 'tgef_01_fighter_diffuse.png',
      normal: 'tgef_01_fighter_normal.png',
      specular: 'tgef_01_fighter_specular.png',
    },
  },
  {
    id: 'empire_transport',
    name: 'Imperial Transport',
    nameKo: '제국 수송선',
    faction: 'empire',
    type: 'transport',
    model: 'tgef_01_transport',
    textures: {
      diffuse: 'tgef_01_transport_pod_diffuse.png',
      normal: 'tgef_01_transport_pod_normal.png',
      specular: 'tgef_01_transport_pod_specular.png',
    },
  },
];

// ===== 동맹 일반 함선 =====
export const STELLARIS_ALLIANCE_SHIPS: StellarisShipAssetDef[] = [
  {
    id: 'alliance_battleship_01',
    name: 'Alliance Battleship Type A',
    nameKo: '동맹 전함 A형',
    faction: 'alliance',
    type: 'battleship',
    model: 'tfpa_01_battleship_01',
    textures: {
      diffuse: 'tfpa_01_battleship_01_diffuse.png',
      normal: 'tfpa_01_battleship_01_normal.png',
      specular: 'tfpa_01_battleship_01_specular.png',
    },
  },
  {
    id: 'alliance_battleship_02',
    name: 'Alliance Battleship Type B',
    nameKo: '동맹 전함 B형',
    faction: 'alliance',
    type: 'battleship',
    model: 'tfpa_01_battleship_02',
    textures: {
      diffuse: 'tfpa_01_battleship_02_diffuse.png',
      normal: 'tfpa_01_battleship_02_normal.png',
      specular: 'tfpa_01_battleship_02_specular.png',
    },
  },
  {
    id: 'alliance_cruiser_01',
    name: 'Alliance Cruiser Type A',
    nameKo: '동맹 순양함 A형',
    faction: 'alliance',
    type: 'cruiser',
    model: 'tfpa_01_cruiser_01',
    textures: {
      diffuse: 'tfpa_01_cruiser_01_diffuse.png',
      normal: 'tfpa_01_cruiser_01_normal.png',
      specular: 'tfpa_01_cruiser_01_specular.png',
    },
  },
  {
    id: 'alliance_cruiser_02',
    name: 'Alliance Cruiser Type B',
    nameKo: '동맹 순양함 B형',
    faction: 'alliance',
    type: 'cruiser',
    model: 'tfpa_01_cruiser_02',
    textures: {
      diffuse: 'tfpa_01_cruiser_02_diffuse.png',
      normal: 'tfpa_01_cruiser_02_normal.png',
      specular: 'tfpa_01_cruiser_02_specular.png',
    },
  },
  {
    id: 'alliance_destroyer',
    name: 'Alliance Destroyer',
    nameKo: '동맹 구축함',
    faction: 'alliance',
    type: 'destroyer',
    model: 'tfpa_01_destroyer',
    textures: {
      diffuse: 'tfpa_01_destroyer_diffuse.png',
      normal: 'tfpa_01_destroyer_normal.png',
      specular: 'tfpa_01_destroyer_specular.png',
    },
  },
  {
    id: 'alliance_corvette',
    name: 'Alliance Corvette',
    nameKo: '동맹 초계함',
    faction: 'alliance',
    type: 'corvette',
    model: 'tfpa_01_corvette',
    textures: {
      diffuse: 'tfpa_01_corvette_diffuse.png',
      normal: 'tfpa_01_corvette_normal.png',
      specular: 'tfpa_01_corvette_specular.png',
    },
  },
  {
    id: 'alliance_carrier',
    name: 'Alliance Carrier',
    nameKo: '동맹 항공모함',
    faction: 'alliance',
    type: 'carrier',
    model: 'tfpa_01_carrier',
    textures: {
      diffuse: 'tfpa_01_carrier_diffuse.png',
      normal: 'tfpa_01_carrier_normal.png',
      specular: 'tfpa_01_carrier_specular.png',
    },
  },
  {
    id: 'alliance_fighter',
    name: 'Alliance Fighter',
    nameKo: '동맹 전투기',
    faction: 'alliance',
    type: 'fighter',
    model: 'tfpa_01_fighter',
    textures: {
      diffuse: 'tfpa_01_fighter_diffuse.png',
      normal: 'tfpa_01_fighter_normal.png',
      specular: 'tfpa_01_fighter_specular.png',
    },
  },
  {
    id: 'alliance_transport',
    name: 'Alliance Transport',
    nameKo: '동맹 수송선',
    faction: 'alliance',
    type: 'transport',
    model: 'tfpa_01_transport',
    textures: {
      diffuse: 'tfpa_01_transport_diffuse.png',
      normal: 'tfpa_01_transport_normal.png',
      specular: 'tfpa_01_transport_specular.png',
    },
  },
];

// ===== 요새/기지 =====
export const STELLARIS_STATIONS: StellarisShipAssetDef[] = [
  {
    id: 'iserlohn',
    name: 'Iserlohn Fortress',
    nameKo: '이제르론 요새',
    faction: 'empire',
    type: 'fortress',
    model: 'tgef_01_citadel',
    textures: {
      diffuse: 'iserlohn_core_diffuse.png',
      normal: 'iserlohn_core_normal.png',
      specular: 'iserlohn_core_specular.png',
    },
  },
  {
    id: 'gaisburg',
    name: 'Gaisburg Fortress',
    nameKo: '가이에스부르크 요새',
    faction: 'empire',
    type: 'fortress',
    model: 'tgef_01_military_station_large',
    textures: {
      diffuse: 'gaisburg _lod_01_diffuse.png',
      normal: 'gaisburg _lod_01_normal.png',
      specular: 'gaisburg _lod_01_specular.png',
    },
  },
  {
    id: 'artemis',
    name: 'Artemis Necklace',
    nameKo: '아르테미스의 목걸이',
    faction: 'empire',
    type: 'station',
    model: 'tgef_01_ion_cannon',
    textures: {
      diffuse: 'artemis_diffuse.png',
      normal: 'artemis_normal.png',
      specular: 'artemis_specular.png',
    },
  },
];

// ===== 전체 자산 맵 =====
export const STELLARIS_ALL_SHIPS: StellarisShipAssetDef[] = [
  ...STELLARIS_EMPIRE_FLAGSHIPS,
  ...STELLARIS_ALLIANCE_FLAGSHIPS,
  ...STELLARIS_EMPIRE_SHIPS,
  ...STELLARIS_ALLIANCE_SHIPS,
  ...STELLARIS_STATIONS,
];

// ID로 함선 찾기
export function getStellarisShipById(id: string): StellarisShipAssetDef | undefined {
  return STELLARIS_ALL_SHIPS.find(ship => ship.id === id);
}

// 진영별 함선 목록
export function getStellarisShipsByFaction(faction: StellarisShipFaction): StellarisShipAssetDef[] {
  return STELLARIS_ALL_SHIPS.filter(ship => ship.faction === faction);
}

// 타입별 함선 목록
export function getStellarisShipsByType(type: StellarisShipType): StellarisShipAssetDef[] {
  return STELLARIS_ALL_SHIPS.filter(ship => ship.type === type);
}

// 기함 목록
export function getStellarisAllFlagships(): StellarisShipAssetDef[] {
  return [...STELLARIS_EMPIRE_FLAGSHIPS, ...STELLARIS_ALLIANCE_FLAGSHIPS];
}

// 지휘관으로 기함 찾기
export function getStellarisFlagshipByCommander(commanderName: string): StellarisShipAssetDef | undefined {
  return getStellarisAllFlagships().find(ship => 
    ship.commander?.toLowerCase().includes(commanderName.toLowerCase())
  );
}

