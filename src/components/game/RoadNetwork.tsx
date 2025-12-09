'use client';

import React, { useMemo, memo } from 'react';

interface CityPosition {
  id: number;
  name?: string;
  x: number;
  y: number;
  nationID?: number;
  region?: number;
}

// 도로 유형
type RoadType = 'road' | 'water' | 'mountain';

interface RoadNetworkProps {
  cities: CityPosition[];
  roads: [number, number][];  // [fromCity, toCity][]
  roadTypes?: Record<string, RoadType>;  // "fromId-toId" -> type (선택적 명시)
  nations?: Array<{ id: number; color: string }>;
  width?: number;
  height?: number;
  showNationColors?: boolean;
}

// 지역(region) 기반 도로 유형 정의
// regionId: 1=하북, 2=중원, 3=서북, 4=서촉, 5=남중, 6=초, 7=오월, 8=동이, 9=기타

// 산길 지역 (산악 지대) - 주황색
const MOUNTAIN_REGIONS = new Set([3, 4, 5, 8]);  // 서북, 서촉, 남중, 동이(한반도/만주)

// 수로 지역 (양자강 유역) - 파란색
const WATER_REGIONS = new Set([7]);  // 오월 (양자강 하류)

// 초(6)는 위치에 따라 다름 - 북쪽은 일반, 남쪽은 수로에 가까움
// 하북(1), 중원(2)은 일반 가도 - 회색

// 특수 도로 (지역 경계를 넘는 주요 도로)
const SPECIAL_WATER_ROADS = new Set([
  // 양자강 유역 주요 수로
  '6-89', '52-89', '52-91', '56-91', '56-82', '7-82',  // 양양~건업 수로
  '13-88', '45-88',  // 강릉~영안
  '7-83', '21-83',  // 건업~하비
  '15-92', '31-92', '31-57',  // 시상~회계
  '14-30', '30-55', '29-55',  // 장사~남해
  '29-59', '59-67', '57-67',  // 남해~회계
  
  // 동해/한반도 해상 수로
  '62-69', '69-94',  // 이도~왜~유구 (일본 열도)
  '59-94',  // 대~유구
  '34-62', '62-93',  // 계림~이도~탐라 (한반도 동해안~제주)
  '16-60', '16-79', '60-79',  // 안평~위례, 위례~동황, 안평~동황 (황해 연안)
  '33-93', '93-95',  // 사비~탐라, 금관~탐라 (남해 연안)
]);

const SPECIAL_MOUNTAIN_ROADS = new Set([
  // 관문/험로
  '3-72', '42-72', '42-73', '73-101', '4-101',  // 낙양~장안 함곡관/동관 루트
  '3-70', '23-70', '23-35',  // 낙양~진양 호관 루트
  '2-71', '10-71',  // 허창~완 호로관 루트
  '4-102', '24-102',  // 장안~한중 자오곡 루트
]);

// 특수 경로가 필요한 도로 (고정 경유점)
// 흉노(65)-선비(96): 진양(421,81), 계(521,47) 위쪽으로 지나가게
// 백랑(90)-오환(68): 부여(814,50) 위쪽으로 지나가게
const CUSTOM_ROAD_PATHS: Record<string, { x: number; y: number }[]> = {
  '65-96': [  // 흉노 → 선비 (위쪽 우회)
    { x: 257, y: 128 },   // 흉노
    { x: 350, y: 50 },    // 진양 위쪽 경유
    { x: 470, y: 25 },    // 계 위쪽 경유
    { x: 620, y: 40 },    // 선비
  ],
  '68-90': [  // 백랑 → 오환 (부여 위쪽 우회)
    { x: 757, y: 40 },    // 백랑
    { x: 814, y: 15 },    // 부여 위쪽 경유
    { x: 871, y: 27 },    // 오환
  ],
};

// 도로 유형 결정 함수
function determineRoadType(
  fromCity: CityPosition,
  toCity: CityPosition,
  roadTypes?: Record<string, RoadType>
): RoadType {
  // 1. 명시적으로 정의된 유형이 있으면 사용
  const pairKey = `${Math.min(fromCity.id, toCity.id)}-${Math.max(fromCity.id, toCity.id)}`;
  if (roadTypes && roadTypes[pairKey]) {
    return roadTypes[pairKey];
  }
  
  // 2. 특수 도로 체크
  if (SPECIAL_WATER_ROADS.has(pairKey)) {
    return 'water';
  }
  if (SPECIAL_MOUNTAIN_ROADS.has(pairKey)) {
    return 'mountain';
  }
  
  // 3. 지역(region) 기반 판단
  const fromRegion = fromCity.region || 0;
  const toRegion = toCity.region || 0;
  
  // 양쪽 모두 수로 지역이면 수로
  if (WATER_REGIONS.has(fromRegion) && WATER_REGIONS.has(toRegion)) {
    return 'water';
  }
  
  // 양쪽 모두 산길 지역이면 산길
  if (MOUNTAIN_REGIONS.has(fromRegion) && MOUNTAIN_REGIONS.has(toRegion)) {
    return 'mountain';
  }
  
  // 한쪽이 수로 지역(오월)이고 다른 쪽이 초(6)면 수로 (양자강 연결)
  if ((WATER_REGIONS.has(fromRegion) && toRegion === 6) ||
      (WATER_REGIONS.has(toRegion) && fromRegion === 6)) {
    return 'water';
  }
  
  // 한쪽이 수로 지역이면 수로 (오월 진입로)
  if (WATER_REGIONS.has(fromRegion) || WATER_REGIONS.has(toRegion)) {
    return 'water';
  }
  
  // 한쪽이 산길 지역이면 산길 (산악 지대 진입로)
  if (MOUNTAIN_REGIONS.has(fromRegion) || MOUNTAIN_REGIONS.has(toRegion)) {
    return 'mountain';
  }
  
  // 기본값: 일반 가도
  return 'road';
}

// 시드 기반 의사 난수 생성기 (일관된 곡선을 위해)
function seededRandom(seed: number): number {
  const x = Math.sin(seed * 12.9898 + seed * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

// 두 점 사이의 베지어 곡선 제어점 계산
function calculateControlPoint(
  x1: number, y1: number,
  x2: number, y2: number,
  seed: number,
  curvature: number = 0.15
): { cx: number; cy: number } {
  const midX = (x1 + x2) / 2;
  const midY = (y1 + y2) / 2;
  
  // 두 점 사이의 거리
  const dx = x2 - x1;
  const dy = y2 - y1;
  const distance = Math.sqrt(dx * dx + dy * dy);
  
  // 수직 방향 벡터 (정규화)
  const perpX = -dy / distance;
  const perpY = dx / distance;
  
  // 시드 기반으로 곡률 방향과 강도 결정
  const randomFactor = seededRandom(seed) - 0.5;  // -0.5 ~ 0.5
  const offset = distance * curvature * randomFactor * 2;
  
  return {
    cx: midX + perpX * offset,
    cy: midY + perpY * offset
  };
}

// 맵 경계 (좌표 클램핑용)
const MAP_BOUNDS = { minX: 10, maxX: 990, minY: 10, maxY: 665 };

// 좌표를 맵 경계 내로 제한
function clampToMap(x: number, y: number): { x: number; y: number } {
  return {
    x: Math.max(MAP_BOUNDS.minX, Math.min(MAP_BOUNDS.maxX, x)),
    y: Math.max(MAP_BOUNDS.minY, Math.min(MAP_BOUNDS.maxY, y)),
  };
}

// 자연스러운 도로 경로 생성 (여러 제어점 사용)
function generateNaturalPath(
  x1: number, y1: number,
  x2: number, y2: number,
  seed: number
): string {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const distance = Math.sqrt(dx * dx + dy * dy);
  
  // 곡률 설정 (너무 크지 않게 제한)
  const curvature = Math.min(0.2, 0.08 + distance / 800);
  
  // 중간 경유점들 생성 (긴 도로는 여러 굴곡)
  if (distance > 120) {
    const points: { x: number; y: number }[] = [
      { x: x1, y: y1 },
    ];
    
    // 거리에 따라 경유점 수 결정
    let segments: number;
    if (distance > 300) {
      segments = 3;
    } else if (distance > 200) {
      segments = 2;
    } else {
      segments = 1;
    }
    
    for (let i = 1; i <= segments; i++) {
      const t = i / (segments + 1);
      const baseX = x1 + dx * t;
      const baseY = y1 + dy * t;
      
      // 수직 방향으로 오프셋
      const perpX = -dy / distance;
      const perpY = dx / distance;
      
      // 오프셋 계산 (최대값 제한)
      const maxOffset = Math.min(60, distance * curvature);
      const offset = (seededRandom(seed + i * 100) - 0.5) * maxOffset * 2;
      
      // 경계 내로 클램핑
      const point = clampToMap(
        baseX + perpX * offset,
        baseY + perpY * offset
      );
      
      points.push(point);
    }
    
    points.push({ x: x2, y: y2 });
    
    // Catmull-Rom 스플라인을 SVG 경로로 변환
    return generateSmoothPath(points);
  }
  
  // 짧은 거리: 단일 베지어 곡선
  const cp = calculateControlPoint(x1, y1, x2, y2, seed, curvature);
  const clampedCp = clampToMap(cp.cx, cp.cy);
  return `M ${x1} ${y1} Q ${clampedCp.x} ${clampedCp.y} ${x2} ${y2}`;
}

// 여러 점을 부드럽게 연결하는 경로 생성
function generateSmoothPath(points: { x: number; y: number }[]): string {
  if (points.length < 2) return '';
  if (points.length === 2) {
    return `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`;
  }
  
  let path = `M ${points[0].x} ${points[0].y}`;
  
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(points.length - 1, i + 2)];
    
    // Catmull-Rom to Bezier 변환
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    
    path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
  }
  
  return path;
}

// 도로 유형별 스타일 설정 (기존 che_road.png 색상 참고)
const ROAD_STYLES: Record<RoadType, {
  borderColor: string;
  mainColor: string;
  highlightColor: string;
  borderWidth: number;
  mainWidth: number;
  highlightWidth: number;
  dashArray?: string;
}> = {
  road: {
    // 회색 (중원 일반 가도)
    borderColor: '#4A4A4A',      // 진한 회색 테두리
    mainColor: '#808080',        // 회색
    highlightColor: '#A0A0A0',   // 밝은 회색
    borderWidth: 6,
    mainWidth: 4,
    highlightWidth: 1.5,
    dashArray: '8 12',
  },
  water: {
    // 파란색 (동쪽 수로)
    borderColor: '#1565C0',      // 진한 파랑 테두리
    mainColor: '#2196F3',        // 파랑 (수로)
    highlightColor: '#64B5F6',   // 연한 파랑 하이라이트
    borderWidth: 6,
    mainWidth: 4,
    highlightWidth: 1.5,
    dashArray: '6 10',
  },
  mountain: {
    // 주황색 (서쪽 산길)
    borderColor: '#B8860B',      // 진한 금색/주황 테두리 (다크 골든로드)
    mainColor: '#DAA520',        // 골든로드 (주황/금색)
    highlightColor: '#F4C430',   // 밝은 금색
    borderWidth: 6,
    mainWidth: 4,
    highlightWidth: 1.5,
    dashArray: '6 10',
  },
};

function RoadNetworkComponent({
  cities,
  roads,
  roadTypes,
  nations = [],
  width = 1000,
  height = 675,
  showNationColors = false,
}: RoadNetworkProps) {
  // 도시 ID -> 위치 매핑
  const cityMap = useMemo(() => {
    const map = new Map<number, CityPosition>();
    for (const city of cities) {
      map.set(city.id, city);
    }
    return map;
  }, [cities]);

  // 국가 ID -> 색상 매핑
  const nationColorMap = useMemo(() => {
    const map = new Map<number, string>();
    for (const nation of nations) {
      map.set(nation.id, nation.color);
    }
    return map;
  }, [nations]);

  // 도로 경로 데이터 생성
  const roadPaths = useMemo(() => {
    const paths = roads.map(([fromId, toId]) => {
      const pairKey = `${Math.min(fromId, toId)}-${Math.max(fromId, toId)}`;
      
      const from = cityMap.get(fromId);
      const to = cityMap.get(toId);
      
      if (!from || !to) return null;
      
      // 거리 계산
      const dx = to.x - from.x;
      const dy = to.y - from.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // 경로 생성: 커스텀 경로가 있으면 사용, 없으면 자동 생성
      let pathData: string;
      if (CUSTOM_ROAD_PATHS[pairKey]) {
        // 커스텀 경유점 사용
        pathData = generateSmoothPath(CUSTOM_ROAD_PATHS[pairKey]);
      } else {
        // 시드: 두 도시 ID의 조합 (일관된 곡선)
        const seed = Math.min(fromId, toId) * 1000 + Math.max(fromId, toId);
        pathData = generateNaturalPath(from.x, from.y, to.x, to.y, seed);
      }
      
      // 도로 유형 결정
      const roadType = determineRoadType(from, to, roadTypes);
      const style = ROAD_STYLES[roadType];
      
      // 국가 색상 적용 (선택적)
      let mainColor = style.mainColor;
      if (showNationColors && from.nationID && from.nationID === to.nationID) {
        mainColor = nationColorMap.get(from.nationID) || mainColor;
      }
      
      return {
        key: `road-${fromId}-${toId}`,
        path: pathData,
        type: roadType,
        style,
        mainColor,
        distance,
        fromNation: from.nationID,
        toNation: to.nationID,
      };
    }).filter(Boolean);
    
    // 긴 도로를 먼저 렌더링 (아래에 깔림) - 거리 내림차순 정렬
    return paths.sort((a, b) => (b?.distance || 0) - (a?.distance || 0));
  }, [roads, cityMap, nationColorMap, showNationColors, roadTypes]);

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
      }}
      preserveAspectRatio="none"
    >
      <defs>
        {/* 수로 물결 효과 필터 */}
        <filter id="water-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="1" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        
        {/* 산길 거친 효과 */}
        <filter id="mountain-rough" x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence type="turbulence" baseFrequency="0.05" numOctaves="2" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="1" />
        </filter>
      </defs>
      
      {/* 도로 그림자/테두리 (먼저 그려서 아래에) */}
      <g className="road-borders">
        {roadPaths.map((road) => road && (
          <path
            key={`${road.key}-border`}
            d={road.path}
            fill="none"
            stroke={road.style.borderColor}
            strokeWidth={road.style.borderWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={road.type === 'water' ? 0.7 : 0.6}
          />
        ))}
      </g>
      
      {/* 메인 도로 */}
      <g className="road-main">
        {roadPaths.map((road) => road && (
          <path
            key={road.key}
            d={road.path}
            fill="none"
            stroke={road.mainColor}
            strokeWidth={road.style.mainWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
            filter={road.type === 'water' ? 'url(#water-glow)' : undefined}
          />
        ))}
      </g>
      
      {/* 도로 중앙선 (하이라이트) */}
      <g className="road-highlight">
        {roadPaths.map((road) => road && (
          <path
            key={`${road.key}-highlight`}
            d={road.path}
            fill="none"
            stroke={road.style.highlightColor}
            strokeWidth={road.style.highlightWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={road.type === 'water' ? 0.7 : 0.5}
            strokeDasharray={road.style.dashArray}
          />
        ))}
      </g>
      
      {/* 수로 추가 물결 효과 */}
      <g className="water-waves">
        {roadPaths.filter(road => road?.type === 'water').map((road) => road && (
          <path
            key={`${road.key}-wave`}
            d={road.path}
            fill="none"
            stroke="#E3F2FD"
            strokeWidth="0.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.4"
            strokeDasharray="2 10"
          />
        ))}
      </g>
    </svg>
  );
}

const RoadNetwork = memo(RoadNetworkComponent);

export default RoadNetwork;

