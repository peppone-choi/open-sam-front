/**
 * Game Asset Paths
 * Centralized registry for all game assets, mapped by Unit ID.
 * IDs correspond to open-sam-backend/config/scenarios/sangokushi/data/units.json
 */

export const UNIT_ASSETS: Record<number, { icon: string; voxel: string }> = {
    // CASTLE
    1000: { icon: '/assets/game/troops/1000_castle.png', voxel: '/assets/game/troops/voxel_1000_castle.png' }, // 성벽

    // FOOTMAN (보병)
    1100: { icon: '/assets/game/troops/1100_footman.png', voxel: '/assets/game/troops/voxel_1100_footman.png' }, // 도민병 (Standard)
    1101: { icon: '/assets/game/troops/1101_spear.png', voxel: '/assets/game/troops/voxel_1101_spear.png' }, // 창민병 (Spear)
    1102: { icon: '/assets/game/troops/1102_qingzhou.png', voxel: '/assets/game/troops/voxel_1102_qingzhou.png' }, // 청주병
    1103: { icon: '/assets/game/troops/1103_danyang.png', voxel: '/assets/game/troops/voxel_1103_danyang.png' }, // 단양병
    1104: { icon: '/assets/game/troops/1104_heavy.png', voxel: '/assets/game/troops/voxel_1104_heavy.png' }, // 함진영 (Heavy)
    1105: { icon: '/assets/game/troops/1105_white_eared.png', voxel: '/assets/game/troops/voxel_1105_white_eared.png' }, // 백이병
    1106: { icon: '/assets/game/troops/1106_flying_bear.png', voxel: '/assets/game/troops/voxel_1106_flying_bear.png' }, // 무당비군 (Flying Bear)
    1107: { icon: '/assets/game/troops/1107_dongzhou.png', voxel: '/assets/game/troops/voxel_1107_dongzhou.png' }, // 동주병
    1108: { icon: '/assets/game/troops/1108_falcon.png', voxel: '/assets/game/troops/voxel_1108_falcon.png' }, // 칭건병
    1109: { icon: '/assets/game/troops/1109_tiger.png', voxel: '/assets/game/troops/voxel_1109_tiger.png' }, // 해번병
    1110: { icon: '/assets/game/troops/1110_yellow.png', voxel: '/assets/game/troops/voxel_1110_yellow.png' }, // 황건역사
    1111: { icon: '/assets/game/troops/1111_royal.png', voxel: '/assets/game/troops/voxel_1111_royal.png' }, // 금군
    1112: { icon: '/assets/game/troops/1112_rattan.png', voxel: '/assets/game/troops/voxel_1112_rattan.png' }, // 등갑병
    1113: { icon: '/assets/game/troops/1113_mountain.png', voxel: '/assets/game/troops/voxel_1113_mountain.png' }, // 산월병
    1114: { icon: '/assets/game/troops/1114_wako.png', voxel: '/assets/game/troops/voxel_1114_wako.png' }, // 왜구
    1115: { icon: '/assets/game/troops/1115_gaya.png', voxel: '/assets/game/troops/voxel_1115_gaya.png' }, // 가야철검수
    1116: { icon: '/assets/game/troops/1116_samhan.png', voxel: '/assets/game/troops/voxel_1116_samhan.png' }, // 삼한장창병

    // ARCHER (궁병)
    1200: { icon: '/assets/game/troops/1200_archer.png', voxel: '/assets/game/troops/voxel_1200_archer.png' }, // 궁병
    1201: { icon: '/assets/game/troops/1201_crossbow.png', voxel: '/assets/game/troops/voxel_1201_crossbow.png' }, // 노병
    1202: { icon: '/assets/game/troops/1202_white_horse_archer.png', voxel: '/assets/game/troops/voxel_1202_white_horse_archer.png' }, // 백마의종
    1203: { icon: '/assets/game/troops/1203_repeating.png', voxel: '/assets/game/troops/voxel_1203_repeating.png' }, // 연노병
    1204: { icon: '/assets/game/troops/1204_tiger_archer.png', voxel: '/assets/game/troops/voxel_1204_tiger_archer.png' }, // 호사
    1205: { icon: '/assets/game/troops/1205_mac_archer.png', voxel: '/assets/game/troops/voxel_1205_mac_archer.png' }, // 맥궁병
    1206: { icon: '/assets/game/troops/1206_eupru.png', voxel: '/assets/game/troops/voxel_1206_eupru.png' }, // 읍루독궁
    1207: { icon: '/assets/game/troops/1207_seon.png', voxel: '/assets/game/troops/voxel_1207_seon.png' }, // 선등사

    // CAVALRY (기병)
    1300: { icon: '/assets/game/troops/1300_cavalry.png', voxel: '/assets/game/troops/voxel_1300_cavalry.png' }, // 기병
    1301: { icon: '/assets/game/troops/1301_leopard.png', voxel: '/assets/game/troops/voxel_1301_leopard.png' }, // 호표기
    1302: { icon: '/assets/game/troops/1302_wuhuan.png', voxel: '/assets/game/troops/voxel_1302_wuhuan.png' }, // 오환돌기
    1303: { icon: '/assets/game/troops/1303_bear.png', voxel: '/assets/game/troops/voxel_1303_bear.png' }, // 비웅군
    1304: { icon: '/assets/game/troops/1304_xiliang.png', voxel: '/assets/game/troops/voxel_1304_xiliang.png' }, // 서량철기
    1305: { icon: '/assets/game/troops/1305_xiongnu.png', voxel: '/assets/game/troops/voxel_1305_xiongnu.png' }, // 흉노기병
    1306: { icon: '/assets/game/troops/1306_elephant.png', voxel: '/assets/game/troops/voxel_1306_elephant.png' }, // 남만상병
    1307: { icon: '/assets/game/troops/1307_xianbei.png', voxel: '/assets/game/troops/voxel_1307_xianbei.png' }, // 선비기마대
    1308: { icon: '/assets/game/troops/1308_buyeo.png', voxel: '/assets/game/troops/voxel_1308_buyeo.png' }, // 부여기병
    1309: { icon: '/assets/game/troops/1309_jiang.png', voxel: '/assets/game/troops/voxel_1309_jiang.png' }, // 강족약탈자

    // WIZARD/STRATEGIST (책사/도사)
    1400: { icon: '/assets/game/troops/1400_strategist.png', voxel: '/assets/game/troops/voxel_1400_strategist.png' }, // 책사
    1401: { icon: '/assets/game/troops/1401_taoist.png', voxel: '/assets/game/troops/voxel_1401_taoist.png' }, // 태평도인
    1402: { icon: '/assets/game/troops/1402_five_pecks.png', voxel: '/assets/game/troops/voxel_1402_five_pecks.png' }, // 오두미도사
    1403: { icon: '/assets/game/troops/1403_poison.png', voxel: '/assets/game/troops/voxel_1403_poison.png' }, // 독진주술사

    // SIEGE (공성병기)
    1500: { icon: '/assets/game/troops/1500_catapult.png', voxel: '/assets/game/troops/voxel_1500_catapult.png' }, // 벽력거
    1501: { icon: '/assets/game/troops/1501_ram.png', voxel: '/assets/game/troops/voxel_1501_ram.png' }, // 충차
    1502: { icon: '/assets/game/troops/1502_ballista.png', voxel: '/assets/game/troops/voxel_1502_ballista.png' }, // 연노거
    1503: { icon: '/assets/game/troops/1503_flame.png', voxel: '/assets/game/troops/voxel_1503_flame.png' }, // 화수
};

export const TERRAIN_TILES = {
    PLAIN: '/assets/game/terrain/plain.png',
    FOREST: '/assets/game/terrain/forest.png',
    HILL: '/assets/game/terrain/hill.png',
    WATER: '/assets/game/terrain/water.png',
    ROAD: '/assets/game/terrain/road.png',
} as const;

export const TACTICAL_OBJECTS = {
    WALL: '/assets/game/objects/wall.png',
    GATE: '/assets/game/objects/gate.png',
    TOWER: '/assets/game/objects/tower.png',
    THRONE: '/assets/game/objects/throne.png',
} as const;
