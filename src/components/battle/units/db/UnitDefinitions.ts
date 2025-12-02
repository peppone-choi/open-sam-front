// 파츠 타입 정의 (사양서 기반)
export type HeadType = 
  | 'messy_hair' // 1100: 헝클어진 머리 (Y28~32)
  | 'wubian'     // 1102: 무변 (납작한 가죽 모자)
  | 'soldier'    // 1104: 정규군 철모 (목 가리개 포함)
  | 'yellow'     // 1113: 황건 두건 (피 묻은 노란색)
  | 'tongxiukai' // 1117: 통수개 (얼굴 가리는 철판)
  | 'heavy'      // 1106: 중장 철투구
  | 'peasant'    // 농민 두건
  | 'officer'    // 장교용
  | 'feather'    // 깃털
  | 'gold'       // 황금
  | 'fur'        // 털모자
  | 'rattan'     // 등나무
  | 'beast'      // 야수탈
  | 'official'   // 관모
  | 'mask'       // 가면
  | 'plate'      // 판갑 투구
  | 'hat';       // 삿갓

export type BodyType = 
  | 'rag_poor'      // 1100: 구멍 난 삼베옷
  | 'rag'           // 누더기
  | 'liang_dang'    // 1102: 양당개 (붉은 옻칠 조끼 찰갑)
  | 'lamellar'      // 1104: 정규 찰갑 + 견갑
  | 'heavy_lamellar' // 중장 찰갑
  | 'heavy_black'   // 1117: 전신 흑철갑 (빈틈없음)
  | 'muscle_light'  // 1121: 근육 강조 + 경량 갑옷
  | 'leather'
  | 'plate'
  | 'gold'
  | 'coat'
  | 'rattan'
  | 'robe'
  | 'naked';

export type WeaponType = 
  | 'none'          // 없음
  | 'rusted_dao'    // 1100: 녹슨 환수도
  | 'dao'           // 1102: 날카로운 환수도
  | 'ji'            // 1104: 극 (창날 + ㄱ자 날)
  | 'zhanmadao'     // 1121: 참마검 (대검)
  | 'halberd'       // 1117: 도끼창
  | 'spear'
  | 'bamboo'
  | 'pike'
  | 'lance'
  | 'axe'
  | 'mace'
  | 'dual_swords'
  | 'guandao'
  | 'bow'
  | 'composite_bow'
  | 'crossbow'
  | 'repeater'
  | 'sling'
  | 'blowgun'
  | 'fan'
  | 'sword'
  | 'great_sword';

export type OffHandType = 
  | 'none'
  | 'shield_hex'    // 1102: 긴 육각형 목제 방패
  | 'shield_tower'  // 1106: 대형 방패
  | 'shield_round'
  | 'shield_rect'
  | 'quiver'
  | 'throw_weapon'
  | 'basket'
  | 'book';

export type MountType = 
  | 'none'
  | 'horse'
  | 'white_horse'
  | 'armored_horse'
  | 'heavy_horse'
  | 'fur_horse'
  | 'camel'
  | 'beast'
  | 'elephant'
  | 'cart'
  | 'ram'
  | 'catapult'
  | 'tower'
  | 'wolf'
  | 'tiger';

export interface UnitDefinition {
  id: number;
  name: string;
  head: HeadType;
  body: BodyType;
  weapon: WeaponType;
  offHand: OffHandType;
  mount: MountType;
  primaryColor?: string;   // 강제 지정 색상 (없으면 국가 색상)
  secondaryColor?: string;
}

// 유닛 데이터베이스 (사양서 Voxels 파일 기준)
export const UNIT_DATABASE: Record<number, UnitDefinition> = {
  // === 1. 보병 (Infantry) ===
  1100: { 
    id: 1100, name: '도민병', 
    head: 'messy_hair', body: 'rag_poor', weapon: 'rusted_dao', offHand: 'none', mount: 'none',
    primaryColor: '#C2B280' // 갈색 삼베
  },
  1101: { // 창민병 (도민병 파생)
    id: 1101, name: '창민병', 
    head: 'peasant', body: 'rag_poor', weapon: 'bamboo', offHand: 'none', mount: 'none' 
  },
  1102: { 
    id: 1102, name: '정규보병', 
    head: 'wubian', body: 'liang_dang', weapon: 'dao', offHand: 'shield_hex', mount: 'none',
    primaryColor: '#8B0000' // 붉은 옻칠
  },
  1103: { // 정규창병
    id: 1103, name: '정규창병',
    head: 'soldier', body: 'liang_dang', weapon: 'spear', offHand: 'none', mount: 'none'
  },
  1104: { 
    id: 1104, name: '정규극병', 
    head: 'soldier', body: 'lamellar', weapon: 'ji', offHand: 'none', mount: 'none' 
  },
  1105: { // 방패보병
    id: 1105, name: '방패보병',
    head: 'soldier', body: 'liang_dang', weapon: 'dao', offHand: 'shield_round', mount: 'none'
  },
  1106: { 
    id: 1106, name: '대방패병', 
    head: 'heavy', body: 'heavy_black', weapon: 'spear', offHand: 'shield_tower', mount: 'none' 
  },
  1113: { 
    id: 1113, name: '황건신도', 
    head: 'yellow', body: 'rag_poor', weapon: 'axe', offHand: 'none', mount: 'none',
    primaryColor: '#FFD700' // 노란색
  },
  1117: { 
    id: 1117, name: '함진영', 
    head: 'tongxiukai', body: 'heavy_black', weapon: 'halberd', offHand: 'shield_tower', mount: 'none',
    primaryColor: '#111111' // 검은색
  },
  1121: { 
    id: 1121, name: '참마도수', 
    head: 'soldier', body: 'muscle_light', weapon: 'zhanmadao', offHand: 'none', mount: 'none' 
  },

  // === 2. 원거리 (Ranged) ===
  1200: { id: 1200, name: '단궁병', head: 'peasant', body: 'rag_poor', weapon: 'bow', offHand: 'quiver', mount: 'none' },
  1201: { 
    id: 1201, name: '장궁병', 
    head: 'soldier', body: 'leather', weapon: 'composite_bow', offHand: 'quiver', mount: 'none' 
  },
  1202: { 
    id: 1202, name: '노병', 
    head: 'wubian', body: 'liang_dang', weapon: 'crossbow', offHand: 'quiver', mount: 'none' 
  },
  1203: { 
    id: 1203, name: '연노병', 
    head: 'soldier', body: 'lamellar', weapon: 'repeater', offHand: 'quiver', mount: 'none' 
  },
  1206: { 
    id: 1206, name: '선등사', 
    head: 'heavy', body: 'heavy_black', weapon: 'crossbow', offHand: 'shield_tower', mount: 'none' 
  },
  1210: { 
    id: 1210, name: '투석병', 
    head: 'peasant', body: 'rag_poor', weapon: 'sling', offHand: 'none', mount: 'none' 
  },
  1212: { 
    id: 1212, name: '독침병', 
    head: 'rattan', body: 'rag_poor', weapon: 'blowgun', offHand: 'none', mount: 'none' 
  },

  // === 3. 기병 (Cavalry) ===
  1300: { 
    id: 1300, name: '경기병', 
    head: 'peasant', body: 'leather', weapon: 'spear', offHand: 'none', mount: 'horse' 
  },
  1304: { 
    id: 1304, name: '호표기', 
    head: 'tongxiukai', body: 'heavy_black', weapon: 'lance', offHand: 'none', mount: 'heavy_horse',
    primaryColor: '#111111'
  },
  1305: { 
    id: 1305, name: '서량철기', 
    head: 'heavy', body: 'heavy_black', weapon: 'lance', offHand: 'none', mount: 'heavy_horse' 
  },
  1306: { 
    id: 1306, name: '백마의종', 
    head: 'feather', body: 'leather', weapon: 'bow', offHand: 'quiver', mount: 'white_horse' 
  },
  1310: { 
    id: 1310, name: '낙타기병', 
    head: 'fur', body: 'coat', weapon: 'spear', offHand: 'none', mount: 'camel' 
  },
  1311: { 
    id: 1311, name: '늑대기수', 
    head: 'beast', body: 'muscle_light', weapon: 'axe', offHand: 'none', mount: 'wolf' 
  },

  // === 4. 지역 (Regional) ===
  1401: { 
    id: 1401, name: '등갑병', 
    head: 'rattan', body: 'rattan', weapon: 'dao', offHand: 'shield_round', mount: 'none',
    primaryColor: '#DAA520' 
  },
  1404: { 
    id: 1404, name: '전쟁코끼리', 
    head: 'rattan', body: 'muscle_light', weapon: 'spear', offHand: 'none', mount: 'elephant' 
  },
  1405: { 
    id: 1405, name: '개마무사', 
    head: 'feather', body: 'plate', weapon: 'lance', offHand: 'none', mount: 'heavy_horse' 
  },
  1407: { 
    id: 1407, name: '가야판갑병', 
    head: 'plate', body: 'plate', weapon: 'spear', offHand: 'shield_rect', mount: 'none' 
  },
  1410: { 
    id: 1410, name: '읍루독궁병', 
    head: 'fur', body: 'coat', weapon: 'bow', offHand: 'quiver', mount: 'none' 
  },

  // === 5. 공성 (Siege) ===
  1500: { id: 1500, name: '충차', head: 'soldier', body: 'lamellar', weapon: 'none', offHand: 'none', mount: 'ram' },
  1501: { id: 1501, name: '벽력거', head: 'soldier', body: 'lamellar', weapon: 'none', offHand: 'none', mount: 'catapult' },
  1503: { id: 1503, name: '연노거', head: 'soldier', body: 'lamellar', weapon: 'none', offHand: 'none', mount: 'cart' },
  1504: { id: 1504, name: '화수', head: 'soldier', body: 'lamellar', weapon: 'none', offHand: 'none', mount: 'cart' },
  1506: { id: 1506, name: '공성탑', head: 'soldier', body: 'lamellar', weapon: 'none', offHand: 'none', mount: 'tower' },
};
