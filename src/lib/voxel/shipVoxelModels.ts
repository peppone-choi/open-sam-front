/**
 * LOGH 복셀 함선 모델 데이터
 * 
 * 각 함선은 복셀(3D 픽셀) 배열로 정의됨
 * [x, y, z] 좌표와 색상 정보를 포함
 */

export interface VoxelData {
  x: number;
  y: number;
  z: number;
  color?: number; // hex color, undefined면 기본 색상 사용
}

export interface ShipVoxelModel {
  id: string;
  name: string;
  voxels: VoxelData[];
  scale: number; // 기본 복셀 크기 배율
  baseColor: number; // 기본 색상
}

// 제국군 색상 팔레트
export const EMPIRE_COLORS = {
  hull: 0x2d2d2d,      // 어두운 회색 선체
  accent: 0xffd700,    // 금색 장식
  engine: 0xff4500,    // 주황빛 엔진
  bridge: 0xc0c0c0,    // 은색 함교
  weapon: 0xff6347,    // 붉은 무장
};

// 동맹군 색상 팔레트
export const ALLIANCE_COLORS = {
  hull: 0x1a1a2e,      // 짙은 남색 선체
  accent: 0x4169e1,    // 로열블루 장식
  engine: 0x00ffff,    // 청록 엔진
  bridge: 0x87ceeb,    // 하늘색 함교
  weapon: 0x32cd32,    // 녹색 무장
};

/**
 * 제국군 전함 (대형, 유선형)
 * 브륀힐트를 모티브로 한 우아한 곡선형 디자인
 */
export const EMPIRE_BATTLESHIP: ShipVoxelModel = {
  id: 'emp_bb',
  name: '제국군 전함',
  scale: 1.0,
  baseColor: EMPIRE_COLORS.hull,
  voxels: [
    // 선수 (앞부분) - 뾰족한 형태
    { x: 0, y: 0, z: 4, color: EMPIRE_COLORS.accent },
    { x: 0, y: 0, z: 3 },
    { x: -1, y: 0, z: 3 }, { x: 1, y: 0, z: 3 },
    
    // 중앙부 (넓은 선체)
    { x: 0, y: 0, z: 2 }, { x: -1, y: 0, z: 2 }, { x: 1, y: 0, z: 2 },
    { x: 0, y: 1, z: 2, color: EMPIRE_COLORS.bridge }, // 함교
    { x: -2, y: 0, z: 2 }, { x: 2, y: 0, z: 2 },
    
    { x: 0, y: 0, z: 1 }, { x: -1, y: 0, z: 1 }, { x: 1, y: 0, z: 1 },
    { x: -2, y: 0, z: 1 }, { x: 2, y: 0, z: 1 },
    { x: 0, y: 1, z: 1 },
    
    { x: 0, y: 0, z: 0 }, { x: -1, y: 0, z: 0 }, { x: 1, y: 0, z: 0 },
    { x: -2, y: 0, z: 0, color: EMPIRE_COLORS.weapon }, // 무장
    { x: 2, y: 0, z: 0, color: EMPIRE_COLORS.weapon },
    
    // 선미 (엔진부)
    { x: 0, y: 0, z: -1 }, { x: -1, y: 0, z: -1 }, { x: 1, y: 0, z: -1 },
    { x: 0, y: 0, z: -2, color: EMPIRE_COLORS.engine },
    { x: -1, y: 0, z: -2, color: EMPIRE_COLORS.engine },
    { x: 1, y: 0, z: -2, color: EMPIRE_COLORS.engine },
  ],
};

/**
 * 제국군 순양함 (중형)
 */
export const EMPIRE_CRUISER: ShipVoxelModel = {
  id: 'emp_ca',
  name: '제국군 순양함',
  scale: 0.8,
  baseColor: EMPIRE_COLORS.hull,
  voxels: [
    // 선수
    { x: 0, y: 0, z: 3, color: EMPIRE_COLORS.accent },
    { x: 0, y: 0, z: 2 },
    { x: -1, y: 0, z: 2 }, { x: 1, y: 0, z: 2 },
    
    // 중앙
    { x: 0, y: 0, z: 1 }, { x: -1, y: 0, z: 1 }, { x: 1, y: 0, z: 1 },
    { x: 0, y: 1, z: 1, color: EMPIRE_COLORS.bridge },
    
    { x: 0, y: 0, z: 0 }, { x: -1, y: 0, z: 0 }, { x: 1, y: 0, z: 0 },
    
    // 선미
    { x: 0, y: 0, z: -1, color: EMPIRE_COLORS.engine },
  ],
};

/**
 * 제국군 구축함 (소형, 기동성)
 */
export const EMPIRE_DESTROYER: ShipVoxelModel = {
  id: 'emp_dd',
  name: '제국군 구축함',
  scale: 0.5,
  baseColor: EMPIRE_COLORS.hull,
  voxels: [
    { x: 0, y: 0, z: 2, color: EMPIRE_COLORS.accent },
    { x: 0, y: 0, z: 1 },
    { x: 0, y: 0, z: 0 },
    { x: 0, y: 0, z: -1, color: EMPIRE_COLORS.engine },
  ],
};

/**
 * 동맹군 전함 (대형, 블록형)
 * 히페리온을 모티브로 한 직선적 디자인
 */
export const ALLIANCE_BATTLESHIP: ShipVoxelModel = {
  id: 'all_bb',
  name: '동맹군 전함',
  scale: 1.0,
  baseColor: ALLIANCE_COLORS.hull,
  voxels: [
    // 선수 (블록형)
    { x: 0, y: 0, z: 4 }, { x: -1, y: 0, z: 4 }, { x: 1, y: 0, z: 4 },
    { x: 0, y: 1, z: 4, color: ALLIANCE_COLORS.accent },
    
    // 중앙부
    { x: 0, y: 0, z: 3 }, { x: -1, y: 0, z: 3 }, { x: 1, y: 0, z: 3 },
    { x: -2, y: 0, z: 3, color: ALLIANCE_COLORS.weapon },
    { x: 2, y: 0, z: 3, color: ALLIANCE_COLORS.weapon },
    { x: 0, y: 1, z: 3, color: ALLIANCE_COLORS.bridge },
    
    { x: 0, y: 0, z: 2 }, { x: -1, y: 0, z: 2 }, { x: 1, y: 0, z: 2 },
    { x: -2, y: 0, z: 2 }, { x: 2, y: 0, z: 2 },
    { x: 0, y: 1, z: 2 },
    
    { x: 0, y: 0, z: 1 }, { x: -1, y: 0, z: 1 }, { x: 1, y: 0, z: 1 },
    { x: -2, y: 0, z: 1 }, { x: 2, y: 0, z: 1 },
    
    { x: 0, y: 0, z: 0 }, { x: -1, y: 0, z: 0 }, { x: 1, y: 0, z: 0 },
    
    // 선미 (쌍발 엔진)
    { x: -1, y: 0, z: -1, color: ALLIANCE_COLORS.engine },
    { x: 1, y: 0, z: -1, color: ALLIANCE_COLORS.engine },
    { x: -1, y: 0, z: -2, color: ALLIANCE_COLORS.engine },
    { x: 1, y: 0, z: -2, color: ALLIANCE_COLORS.engine },
  ],
};

/**
 * 동맹군 순양함 (중형)
 */
export const ALLIANCE_CRUISER: ShipVoxelModel = {
  id: 'all_ca',
  name: '동맹군 순양함',
  scale: 0.8,
  baseColor: ALLIANCE_COLORS.hull,
  voxels: [
    { x: 0, y: 0, z: 3 }, { x: -1, y: 0, z: 3 }, { x: 1, y: 0, z: 3 },
    { x: 0, y: 1, z: 3, color: ALLIANCE_COLORS.bridge },
    
    { x: 0, y: 0, z: 2 }, { x: -1, y: 0, z: 2 }, { x: 1, y: 0, z: 2 },
    { x: -1, y: 0, z: 2, color: ALLIANCE_COLORS.weapon },
    
    { x: 0, y: 0, z: 1 }, { x: -1, y: 0, z: 1 }, { x: 1, y: 0, z: 1 },
    
    { x: 0, y: 0, z: 0 },
    { x: 0, y: 0, z: -1, color: ALLIANCE_COLORS.engine },
  ],
};

/**
 * 동맹군 구축함 (소형)
 */
export const ALLIANCE_DESTROYER: ShipVoxelModel = {
  id: 'all_dd',
  name: '동맹군 구축함',
  scale: 0.5,
  baseColor: ALLIANCE_COLORS.hull,
  voxels: [
    { x: 0, y: 0, z: 2, color: ALLIANCE_COLORS.accent },
    { x: 0, y: 0, z: 1 },
    { x: -1, y: 0, z: 1 }, { x: 1, y: 0, z: 1 },
    { x: 0, y: 0, z: 0 },
    { x: 0, y: 0, z: -1, color: ALLIANCE_COLORS.engine },
  ],
};

// 함선 모델 레지스트리
export const SHIP_VOXEL_MODELS: Record<string, ShipVoxelModel> = {
  // 제국군
  'emp_bb': EMPIRE_BATTLESHIP,
  'emp_ca': EMPIRE_CRUISER,
  'emp_dd': EMPIRE_DESTROYER,
  // 동맹군
  'all_bb': ALLIANCE_BATTLESHIP,
  'all_ca': ALLIANCE_CRUISER,
  'all_dd': ALLIANCE_DESTROYER,
};

/**
 * 진영에 따른 기본 함선 모델 반환
 */
export function getDefaultShipModel(faction: 'empire' | 'alliance', shipClass: 'battleship' | 'cruiser' | 'destroyer'): ShipVoxelModel {
  const prefix = faction === 'empire' ? 'emp' : 'all';
  const suffix = shipClass === 'battleship' ? 'bb' : shipClass === 'cruiser' ? 'ca' : 'dd';
  return SHIP_VOXEL_MODELS[`${prefix}_${suffix}`] || EMPIRE_DESTROYER;
}

