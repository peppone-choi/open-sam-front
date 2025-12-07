
// 은하영웅전설 함선 데이터 (OVA 기준 + 매뉴얼 파생형)
// 단위: 미터 (m)

export interface ShipData {
  length: number;
  name: string;
  description?: string;
}

export const SHIP_DATA: Record<string, ShipData> = {
  // === 은하제국 (Galactic Empire) ===
  // 기함
  tgef_01_LoGHFlagship_01: { length: 1158, name: '바르바로사 (Barbarossa)' },
  tgef_01_LoGHFlagship_02: { length: 828, name: '베오울프 (Beowulf)' },
  tgef_01_LoGHFlagship_03_combined: { length: 950, name: '트리스탄 (Tristan)' },
  tgef_01_LoGHFlagship_03: { length: 950, name: '트리스탄 (Tristan)' },
  tgef_01_LoGHFlagship_04: { length: 1100, name: '쾨니히스 티거 (Konigs Tiger)' },
  tgef_01_LoGHFlagship_05: { length: 900, name: '바렌다운 (Warendown)' },
  tgef_01_LoGHFlagship_06: { length: 980, name: '살라만더 (Salamander)' },
  tgef_01_LoGHFlagship_07: { length: 886, name: '퍼시발 (Percival)' },
  tgef_01_LoGHFlagship_08: { length: 980, name: '가르가팔룸 (Garga Falmul)' },
  tgef_01_LoGHFlagship_09: { length: 980, name: '스키르니르 (Skirnir)' },
  GE_CommandShip_BrunhildUpgrade: { length: 1007, name: '브륜힐트 (Brunhild)' },
  GE_CommandShip_Jotunheim: { length: 1260, name: '요툰하임 (Jotunheim)' },
  GE_CommandShip_Nordlingen: { length: 900, name: '뇌르틀링겐 (Nordlingen)' },
  GE_CommandShip_Tristan: { length: 950, name: '트리스탄 (Tristan)' },
  GE_CommandShip_Vonkel: { length: 900, name: '폰켈 (Vonkel)' },
  GE_CommandShip_Wilhelmina: { length: 1180, name: '빌헬미나 (Wilhelmina)' },

  // 전함
  tgef_01_battleship_01: { length: 677, name: '전함 I (SS75)', description: '표준형.' },
  tgef_01_battleship_01_v2: { length: 677, name: '전함 II (SS75a)', description: '광자포 환장형.' },
  tgef_01_battleship_01_v3: { length: 677, name: '전함 III (SS75b)', description: '근접전용.' },
  tgef_01_battleship_01_v4: { length: 677, name: '전함 IV (SS75c)', description: '미사일전용.' },
  tgef_01_battleship_01_v5: { length: 677, name: '전함 V (SS75d)', description: '고속형.' },
  tgef_01_battleship_01_v6: { length: 677, name: '전함 VI (SS75e)', description: '방어형.' },
  tgef_01_battleship_01_v7: { length: 677, name: '전함 VII (SS75f)', description: '항공전함.' },
  tgef_01_battleship_01_v8: { length: 677, name: '전함 VIII (SS75g)', description: '자동화형.' },

  // 고속전함
  tgef_01_battleship_03: { length: 726, name: '고속전함 I (PK86)', description: '표준 고속전함.' },
  tgef_01_battleship_03_v2: { length: 726, name: '고속전함 II (PK86a)', description: '장사정 비ーム포.' },
  tgef_01_battleship_03_v3: { length: 726, name: '고속전함 III (PK86b)', description: '미사일 강화.' },
  tgef_01_battleship_03_v4: { length: 726, name: '고속전함 IV (PK86c)', description: '초고속형.' },
  tgef_01_battleship_03_v5: { length: 726, name: '고속전함 V (PK86d)', description: '함수 장갑 강화.' },
  tgef_01_battleship_03_v6: { length: 726, name: '고속전함 VI (PK86e)', description: '고속 항공전함.' },
  tgef_01_battleship_03_v7: { length: 726, name: '고속전함 VII (PK86f)', description: '강행 정찰형.' },
  tgef_01_battleship_03_v8: { length: 726, name: '고속전함 VIII (PK86g)', description: '근접전용.' },

  // 순양함
  tgef_01_cruiser_01: { length: 576, name: '순양함 I (SK80)', description: '표준 순양함.' },
  tgef_01_cruiser_01_v2: { length: 576, name: '순양함 II (SK80a)', description: '장사정 미사일형.' },
  tgef_01_cruiser_01_v3: { length: 576, name: '순양함 III (SK80b)', description: '경순양함.' },
  tgef_01_cruiser_01_v4: { length: 576, name: '순양함 IV (SK80c)', description: '중장갑형.' },
  tgef_01_cruiser_01_v5: { length: 576, name: '순양함 V (SK80d)', description: '항공순양함.' },
  tgef_01_cruiser_01_v6: { length: 576, name: '순양함 VI (SK80e)', description: '정찰순양함.' },
  tgef_01_cruiser_01_v7: { length: 576, name: '순양함 VII (SK80f)', description: '장거리 작전형.' },
  tgef_01_cruiser_01_v8: { length: 576, name: '순양함 VIII (SK80g)', description: '자동화형.' },

  // 구축함
  tgef_01_destroyer_01: { length: 208, name: '구축함 I (Z82)', description: '표준 구축함.' },
  tgef_01_destroyer_01_v2: { length: 208, name: '구축함 II (Z82a)', description: '초계 구축함.' },
  tgef_01_destroyer_01_v3: { length: 208, name: '구축함 III (Z82b)', description: '장거리 작전형.' },
  tgef_01_destroyer_01_v4: { length: 208, name: '구축함 IV (Z82c)', description: '고속형.' },
  tgef_01_destroyer_01_v5: { length: 208, name: '구축함 V (Z82d)', description: '초고속형.' },
  tgef_01_destroyer_01_v6: { length: 208, name: '구축함 VI (Z82e)', description: '유격형.' },
  tgef_01_destroyer_01_v7: { length: 208, name: '구축함 VII (Z82f)', description: '미사일 포함.' },
  tgef_01_destroyer_01_v8: { length: 208, name: '구축함 VIII (Z82g)', description: '강행 정찰형.' },

  // 전투정모함 (carrier)
  tgef_01_carrier: { length: 900, name: '전투정모함 I (FR88)', description: '표준형.' },
  tgef_01_carrier_v2: { length: 900, name: '전투정모함 II (FR88a)', description: '양산형.' },
  tgef_01_carrier_v3: { length: 900, name: '전투정모함 III (FR88b)', description: '탑재량 증가형.' },
  tgef_01_carrier_v4: { length: 900, name: '전투정모함 IV (FR88c)', description: '전시 급조형.' },

  // 뇌격정모함 (carrier 사용)
  tgef_01_carrier_tb1: { length: 900, name: '뇌격정모함 I (TR88)', description: '표준형.' },
  tgef_01_carrier_tb2: { length: 900, name: '뇌격정모함 II (TR88a)', description: '양산형.' },
  tgef_01_carrier_tb3: { length: 900, name: '뇌격정모함 III (TR88b)', description: '전시 급조형.' },
  tgef_01_carrier_tb4: { length: 900, name: '뇌격정모함 IV (TR88c)', description: '고속형.' },

  // 공작함 (construction -> carrier 대체)
  tgef_01_carrier_const1: { length: 800, name: '공작함 I (A76)', description: '표준형.' },
  tgef_01_carrier_const2: { length: 800, name: '공작함 II (A76a)', description: '자재 증량형.' },
  tgef_01_carrier_const3: { length: 800, name: '공작함 III (A76b)', description: '고속형.' },
  tgef_01_carrier_const4: { length: 800, name: '공작함 IV (A76c)', description: '전시 급조형.' },

  // 수송함 (colony)
  tgef_01_colony: { length: 800, name: '수송함 I (A74)', description: '표준형.' },
  tgef_01_colony_v2: { length: 800, name: '수송함 II (A74a)', description: '무장 생략형.' },
  tgef_01_colony_v3: { length: 800, name: '수송함 III (A74b)', description: '방공 강화형.' },
  tgef_01_colony_v4: { length: 800, name: '수송함 IV (A74c)', description: '고속형.' },

  // 병원선 (colony 사용)
  tgef_01_colony_hosp: { length: 800, name: '병원선' },

  // 양륙함 (transport)
  tgef_01_transport: { length: 800, name: '양륙함 I (A78)', description: '표준형.' },
  tgef_01_transport_v2: { length: 800, name: '양륙함 II (A78a)', description: '미사일 탑재형.' },
  tgef_01_transport_v3: { length: 800, name: '양륙함 III (A78b)', description: '고속형.' },
  tgef_01_transport_v4: { length: 800, name: '양륙함 IV (A78c)', description: '장갑 강화형.' },

  // 병원수송함 (transport 사용)
  tgef_01_transport_hosp: { length: 800, name: '병원수송함' },


  // === 자유행성동맹 (Free Planets Alliance) ===
  // 기함
  FPA_CommandShip_AbaiGeser: { length: 1150, name: '아바이 게셀 (Abai Geser)' },
  FPA_CommandShip_AirgetLamh: { length: 900, name: '애거트람 (Airgetlamh)' },
  FPA_CommandShip_CuChulainn: { length: 900, name: '쿠 훌린 (Cu Chulainn)' },
  FPA_CommandShip_Epimetheus: { length: 900, name: '에피메테우스 (Epimetheus)' },
  FPA_CommandShip_Flagship: { length: 900, name: '레오니다스급 기함' },
  FPA_CommandShip_Hector: { length: 900, name: '헥토르 (Hector)' },
  FPA_CommandShip_Hyperion: { length: 911, name: '휴페리온 (Hyperion)' },
  FPA_CommandShip_Leonidas: { length: 900, name: '레오니다스 (Leonidas)' },
  FPA_CommandShip_Palamedes: { length: 900, name: '팔라메데스 (Palamedes)' },
  FPA_CommandShip_Pergamon: { length: 1150, name: '페르가몬 (Pergamon)' },
  FPA_CommandShip_Perun: { length: 1150, name: '페룬 (Perun)' },
  FPA_CommandShip_Shiva: { length: 1000, name: '시바 (Shiva)' },
  tfpa_01_LoGHFlagship_01: { length: 924, name: '트리글라프 (Triglav)' },
  tfpa_01_LoGHFlagship_02: { length: 1150, name: '파트로크로스 (Patroklos)' },
  tfpa_01_LoGHFlagship_03: { length: 900, name: '레오니다스 (Leonidas)' },
  tfpa_01_LoGHFlagship_04: { length: 940, name: '리오 그란데 (Rio Grande)' },
  tfpa_01_LoGHFlagship_05: { length: 850, name: '뱅구 (Bang-goo)' },
  tfpa_01_LoGHFlagship_06: { length: 1150, name: '페르가몬 (Pergamon)' },
  tfpa_01_LoGHFlagship_08: { length: 967, name: '크리슈나 (Krishna)' },
  tfpa_01_LoGHFlagship_09: { length: 1150, name: '아이아스 (Ajax)' },

  // 전함
  tfpa_01_battleship_01: { length: 624, name: '전함 I (787년형)', description: '표준형.' },
  tfpa_01_battleship_01_v2: { length: 624, name: '전함 II (787 G型)', description: '근접전형.' },
  tfpa_01_battleship_01_v3: { length: 624, name: '전함 III (787 M型)', description: '장거리형.' },
  tfpa_01_battleship_01_v4: { length: 624, name: '전함 IV (787 L型)', description: '쾌속전함.' },
  tfpa_01_battleship_01_v5: { length: 624, name: '전함 V (787 H型)', description: '중장갑형.' },
  tfpa_01_battleship_01_v6: { length: 624, name: '전함 VI (787 R型)', description: '정찰형.' },
  tfpa_01_battleship_01_v7: { length: 624, name: '전함 VII (787 E型)', description: '전시 급조형.' },
  tfpa_01_battleship_01_v8: { length: 624, name: '전함 VIII (787 U型)', description: '무인함.' },

  // 순양함
  tfpa_01_cruiser_01: { length: 372, name: '순양함 I (795년형)', description: '표준형.' },
  tfpa_01_cruiser_01_v2: { length: 372, name: '순양함 II (795 B型)', description: '방어형.' },
  tfpa_01_cruiser_01_v3: { length: 372, name: '순양함 III (795 M型)', description: '미사일형.' },
  tfpa_01_cruiser_01_v4: { length: 372, name: '순양함 IV (795 L型)', description: '고속순양함.' },
  tfpa_01_cruiser_01_v5: { length: 372, name: '순양함 V (795 H型)', description: '중장갑형.' },
  tfpa_01_cruiser_01_v6: { length: 372, name: '순양함 VI (795 R型)', description: '정찰순양함.' },
  tfpa_01_cruiser_01_v7: { length: 372, name: '순양함 VII (795 Ri型)', description: '고성능 정찰함.' },
  tfpa_01_cruiser_01_v8: { length: 372, name: '순양함 VIII (795 C型)', description: '프리깃함.' },

  // 구축함
  tfpa_01_destroyer: { length: 186, name: '구축함 I (796년형)', description: '표준형.' },
  tfpa_01_destroyer_v2: { length: 186, name: '구축함 II (796 M型)', description: '미사일 증설형.' },
  tfpa_01_destroyer_v3: { length: 186, name: '구축함 III (796 L型)', description: '고속형.' },
  tfpa_01_destroyer_v4: { length: 186, name: '구축함 IV (796 H型)', description: '방어 강화형.' },
  tfpa_01_destroyer_v5: { length: 186, name: '구축함 V (796 C型)', description: '코르벳함.' },
  tfpa_01_destroyer_v6: { length: 186, name: '구축함 VI (796 R型)', description: '강행 정찰형.' },
  tfpa_01_destroyer_v7: { length: 186, name: '구축함 VII (796 A型)', description: '방공 구축함.' },
  tfpa_01_destroyer_v8: { length: 186, name: '구축함 VIII (796 E型)', description: '전시 급조형.' },

  // 전투정모함 (carrier)
  tfpa_01_carrier: { length: 800, name: '전투정모함 I (796년형)', description: '표준형.' },
  tfpa_01_carrier_v2: { length: 800, name: '전투정모함 II (796 A型)', description: '무장 생략형.' },
  tfpa_01_carrier_v3: { length: 800, name: '전투정모함 III (796 L型)', description: '고속형.' },
  tfpa_01_carrier_v4: { length: 800, name: '전투정모함 IV (796 H型)', description: '중장갑형.' },

  // 공작함 (construction 사용)
  tfpa_01_construction: { length: 700, name: '공작함 I (793년형)', description: '표준형.' },
  tfpa_01_construction_v2: { length: 700, name: '공작함 II (793 L型)', description: '고속형.' },
  tfpa_01_construction_v3: { length: 700, name: '공작함 III (793 E型)', description: '저성능형.' },
  tfpa_01_construction_v4: { length: 700, name: '공작함 IV (793 S型)', description: '자재 증량형.' },

  // 수송함 (colony)
  tfpa_01_colony: { length: 700, name: '수송함 I (792년형)', description: '표준형.' },
  tfpa_01_colony_v2: { length: 700, name: '수송함 II (792 A型)', description: '무장 생략형.' },
  tfpa_01_colony_v3: { length: 700, name: '수송함 III (792 S型)', description: '센서 간략형.' },
  tfpa_01_colony_v4: { length: 700, name: '수송함 IV (792 L型)', description: '고속형.' },

  // 병원선 (colony 사용)
  tfpa_01_colony_hosp: { length: 700, name: '병원선' },

  // 양륙함 (transport)
  tfpa_01_transport: { length: 700, name: '양륙함 I (795년형)', description: '표준형.' },
  tfpa_01_transport_v2: { length: 700, name: '양륙함 II (786 L型)', description: '고속형.' },
  tfpa_01_transport_v3: { length: 700, name: '양륙함 III (786 H型)', description: '장갑 강화형.' },
  tfpa_01_transport_v4: { length: 700, name: '양륙함 IV (786 F型)', description: '대요塞전용.' },

  // 병원수송함 (transport 사용)
  tfpa_01_transport_hosp: { length: 700, name: '병원수송함' },

  // 유지되는 모델
  tgef_01_corvette_01: { length: 150, name: '제국군 뇌격정' },
  tgef_01_corvette_02: { length: 150, name: '제국군 뇌격정 (흑색창기병)' },
  tfpa_01_corvette: { length: 120, name: '동맹군 특무통보함' },
  tfpa_01_fighter: { length: 32, name: '스파르타니언' },
};

export const DEFAULT_LENGTH = 500;
