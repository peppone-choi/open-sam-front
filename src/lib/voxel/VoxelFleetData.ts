/**
 * 복셀 함대 데이터 정의
 * 1 유닛 = 300척
 * 함대 최대 60유닛 = 18,000척
 */

export const SHIPS_PER_UNIT = 300;

// 함선 타입별 복셀 크기 (상대적)
export const SHIP_VOXEL_SIZE: Record<string, number> = {
  battleship: 1.0,      // 전함: 기본 크기
  cruiser: 0.7,         // 순양함: 작음
  destroyer: 0.4,       // 구축함: 매우 작음
  carrier: 1.2,         // 항모: 큼
  flagship: 1.5,        // 기함: 가장 큼
};

// 진영별 색상
export const FACTION_COLORS = {
  empire: {
    primary: 0xffd700,    // 금색 (제국군 주력)
    secondary: 0xdc143c,  // 진홍색 (제국군 보조)
    flagship: 0xffffff,   // 흰색 (브륀힐트 등)
    laser: 0xff4444,      // 빨간 레이저
  },
  alliance: {
    primary: 0x4169e1,    // 로열블루 (동맹군 주력)
    secondary: 0x32cd32,  // 녹색 (동맹군 보조)
    flagship: 0x87ceeb,   // 하늘색 (히페리온 등)
    laser: 0x44ff44,      // 녹색 레이저
  },
  neutral: {
    primary: 0x808080,
    secondary: 0xa0a0a0,
    flagship: 0xc0c0c0,
    laser: 0xffff00,
  },
};

// 함선 배치 패턴 (진형)
export type FormationType = 
  | 'line'        // 횡대진 (일자)
  | 'wedge'       // 쐐기진 (화살촉)
  | 'sphere'      // 구형진 (방어)
  | 'spindle'     // 방추형진 (돌파)
  | 'crane'       // 학익진 (포위)
  | 'scattered';  // 산개진 (회피)

export interface VoxelFleetUnit {
  unitId: string;
  shipType: string;       // battleship, cruiser, etc.
  shipCount: number;      // 실제 함선 수 (최대 300)
  health: number;         // 0-100%
  position: { x: number; y: number; z: number };
}

export interface VoxelFleet {
  fleetId: string;
  name: string;
  faction: 'empire' | 'alliance' | 'neutral';
  commanderName?: string;
  
  units: VoxelFleetUnit[];
  totalShips: number;     // 총 함선 수
  
  // 전체 함대 위치/이동
  position: { x: number; y: number; z: number };
  velocity: { x: number; y: number; z: number };
  heading: number;        // 진행 방향 (라디안)
  
  formation: FormationType;
  
  // 전투 상태
  isEngaged: boolean;
  targetFleetId?: string;
}

/**
 * 진형에 따른 함선 배치 오프셋 계산
 * @param formation 진형 타입
 * @param index 함선 인덱스 (0부터)
 * @param total 총 함선 수
 * @param scale 배치 스케일
 */
export function getFormationOffset(
  formation: FormationType,
  index: number,
  total: number,
  scale: number = 1.0
): { x: number; y: number; z: number } {
  const t = total > 1 ? index / (total - 1) : 0.5;
  
  switch (formation) {
    case 'line': {
      // 횡대진: X축을 따라 일렬 배치
      const width = Math.sqrt(total) * scale * 2;
      return {
        x: (t - 0.5) * width,
        y: (Math.random() - 0.5) * scale * 0.3,
        z: (Math.random() - 0.5) * scale * 0.5,
      };
    }
    
    case 'wedge': {
      // 쐐기진: 화살촉 모양
      const row = Math.floor(Math.sqrt(index));
      const col = index - row * row;
      const rowWidth = (row + 1) * scale;
      return {
        x: (col - row / 2) * scale,
        y: (Math.random() - 0.5) * scale * 0.2,
        z: -row * scale,
      };
    }
    
    case 'sphere': {
      // 구형진: 3D 구 형태로 배치
      const phi = Math.acos(1 - 2 * (index + 0.5) / total);
      const theta = Math.PI * (1 + Math.sqrt(5)) * index;
      const radius = Math.cbrt(total) * scale * 0.5;
      return {
        x: radius * Math.sin(phi) * Math.cos(theta),
        y: radius * Math.sin(phi) * Math.sin(theta),
        z: radius * Math.cos(phi),
      };
    }
    
    case 'spindle': {
      // 방추형진: 앞뒤로 길쭉한 형태 (돌파용)
      const angle = (index / total) * Math.PI * 2;
      const zPos = (t - 0.5) * total * scale * 0.1;
      const radiusFactor = 1 - Math.abs(t - 0.5) * 2; // 중앙이 넓음
      const radius = radiusFactor * Math.sqrt(total) * scale * 0.3;
      return {
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius * 0.5,
        z: zPos,
      };
    }
    
    case 'crane': {
      // 학익진: 양 날개를 펼친 형태
      const isLeft = index % 2 === 0;
      const wingIndex = Math.floor(index / 2);
      const wingTotal = Math.ceil(total / 2);
      const wingT = wingTotal > 1 ? wingIndex / (wingTotal - 1) : 0.5;
      const angle = (isLeft ? 1 : -1) * wingT * Math.PI * 0.4;
      const dist = wingT * Math.sqrt(total) * scale;
      return {
        x: Math.sin(angle) * dist,
        y: (Math.random() - 0.5) * scale * 0.2,
        z: -Math.cos(angle) * dist + dist * 0.5,
      };
    }
    
    case 'scattered':
    default: {
      // 산개진: 랜덤 분산
      const spread = Math.sqrt(total) * scale;
      return {
        x: (Math.random() - 0.5) * spread,
        y: (Math.random() - 0.5) * spread * 0.3,
        z: (Math.random() - 0.5) * spread,
      };
    }
  }
}

/**
 * 유닛의 함선들을 복셀 위치로 변환
 */
export function generateShipPositions(
  unit: VoxelFleetUnit,
  formation: FormationType,
  fleetPosition: { x: number; y: number; z: number },
  heading: number,
  scale: number = 1.0
): Array<{ x: number; y: number; z: number; size: number }> {
  const positions: Array<{ x: number; y: number; z: number; size: number }> = [];
  const shipSize = SHIP_VOXEL_SIZE[unit.shipType] || 0.5;
  
  // 체력에 따라 표시할 함선 수 계산
  const visibleShips = Math.ceil(unit.shipCount * (unit.health / 100));
  
  for (let i = 0; i < visibleShips; i++) {
    const offset = getFormationOffset(formation, i, visibleShips, scale);
    
    // 헤딩 방향으로 회전
    const cos = Math.cos(heading);
    const sin = Math.sin(heading);
    const rotatedX = offset.x * cos - offset.z * sin;
    const rotatedZ = offset.x * sin + offset.z * cos;
    
    positions.push({
      x: fleetPosition.x + unit.position.x + rotatedX,
      y: fleetPosition.y + unit.position.y + offset.y,
      z: fleetPosition.z + unit.position.z + rotatedZ,
      size: shipSize * scale,
    });
  }
  
  return positions;
}









