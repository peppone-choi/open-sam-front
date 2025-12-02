'use client';

import React, { useMemo } from 'react';
import styles from './TerritoryOverlay.module.css';

interface City {
  id: number;
  name: string;
  nationID?: number;
  x: number;
  y: number;
}

interface Nation {
  id: number;
  name: string;
  color: string;
}

interface TerritoryOverlayProps {
  cities: City[];
  nations: Nation[];
  /** 투명도 (0-1, 기본 0.15) */
  opacity?: number;
  /** 표시할 국가 ID 필터 (없으면 전체 표시) */
  showNations?: number[];
  /** 내 국가 ID (강조 표시) */
  myNationId?: number;
}

interface NationTerritory {
  nationId: number;
  color: string;
  cities: { x: number; y: number }[];
  centroid: { x: number; y: number };
  bounds: { minX: number; maxX: number; minY: number; maxY: number };
}

/**
 * 세력 영역 표시 컴포넌트
 * 각 국가의 도시 분포를 기반으로 영역을 시각화
 */
export default function TerritoryOverlay({
  cities,
  nations,
  opacity = 0.15,
  showNations,
  myNationId,
}: TerritoryOverlayProps) {
  // 국가별 영역 계산
  const territories = useMemo(() => {
    const nationMap = new Map<number, Nation>();
    for (const nation of nations) {
      nationMap.set(nation.id, nation);
    }

    // 국가별 도시 그룹화
    const nationCities = new Map<number, { x: number; y: number }[]>();
    
    for (const city of cities) {
      if (!city.nationID || city.nationID <= 0) continue;
      if (showNations && !showNations.includes(city.nationID)) continue;
      
      const existing = nationCities.get(city.nationID) || [];
      existing.push({ x: city.x, y: city.y });
      nationCities.set(city.nationID, existing);
    }

    // 영역 데이터 생성
    const result: NationTerritory[] = [];
    
    for (const [nationId, citiesInNation] of nationCities) {
      const nation = nationMap.get(nationId);
      if (!nation || citiesInNation.length === 0) continue;

      // 중심점 계산
      const centroid = {
        x: citiesInNation.reduce((sum, c) => sum + c.x, 0) / citiesInNation.length,
        y: citiesInNation.reduce((sum, c) => sum + c.y, 0) / citiesInNation.length,
      };

      // 경계 계산
      const bounds = {
        minX: Math.min(...citiesInNation.map((c) => c.x)),
        maxX: Math.max(...citiesInNation.map((c) => c.x)),
        minY: Math.min(...citiesInNation.map((c) => c.y)),
        maxY: Math.max(...citiesInNation.map((c) => c.y)),
      };

      result.push({
        nationId,
        color: nation.color,
        cities: citiesInNation,
        centroid,
        bounds,
      });
    }

    return result;
  }, [cities, nations, showNations]);

  // SVG 경로 생성 (도시 주변을 연결하는 부드러운 영역)
  const generateTerritoryPath = (territory: NationTerritory): string => {
    const { cities } = territory;
    
    if (cities.length === 0) return '';
    
    if (cities.length === 1) {
      // 단일 도시: 원형 영역
      const { x, y } = cities[0];
      const r = 40; // 반경 (픽셀 단위, 맵 좌표 기준)
      return `M ${x - r} ${y} A ${r} ${r} 0 1 1 ${x + r} ${y} A ${r} ${r} 0 1 1 ${x - r} ${y}`;
    }
    
    if (cities.length === 2) {
      // 두 도시: 캡슐 모양
      const [c1, c2] = cities;
      const dx = c2.x - c1.x;
      const dy = c2.y - c1.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const r = 35;
      
      // 수직 방향 벡터
      const nx = -dy / dist;
      const ny = dx / dist;
      
      return `
        M ${c1.x + nx * r} ${c1.y + ny * r}
        L ${c2.x + nx * r} ${c2.y + ny * r}
        A ${r} ${r} 0 0 1 ${c2.x - nx * r} ${c2.y - ny * r}
        L ${c1.x - nx * r} ${c1.y - ny * r}
        A ${r} ${r} 0 0 1 ${c1.x + nx * r} ${c1.y + ny * r}
        Z
      `;
    }
    
    // 3개 이상: Convex Hull + 부드러운 곡선
    const hull = convexHull(cities);
    if (hull.length < 3) return '';
    
    // 외곽선에서 확장된 영역 생성
    const expandedHull = expandPolygon(hull, 30);
    
    // 부드러운 곡선으로 연결
    return smoothPolygonPath(expandedHull);
  };

  return (
    <div className={styles.overlay}>
      <svg
        className={styles.territorySvg}
        viewBox="0 0 1000 675"
        preserveAspectRatio="none"
      >
        <defs>
          {/* 각 국가별 그라디언트 정의 */}
          {territories.map((t) => (
            <radialGradient
              key={`gradient-${t.nationId}`}
              id={`territory-gradient-${t.nationId}`}
              cx="50%"
              cy="50%"
              r="60%"
            >
              <stop offset="0%" stopColor={t.color} stopOpacity={opacity * 1.5} />
              <stop offset="70%" stopColor={t.color} stopOpacity={opacity} />
              <stop offset="100%" stopColor={t.color} stopOpacity={0} />
            </radialGradient>
          ))}
        </defs>
        
        {/* 영역 렌더링 */}
        {territories.map((territory) => {
          const path = generateTerritoryPath(territory);
          const isMyNation = territory.nationId === myNationId;
          
          return (
            <g key={territory.nationId}>
              <path
                d={path}
                fill={`url(#territory-gradient-${territory.nationId})`}
                stroke={territory.color}
                strokeWidth={isMyNation ? 2 : 1}
                strokeOpacity={isMyNation ? 0.6 : 0.3}
                className={isMyNation ? styles.myTerritory : undefined}
              />
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// Convex Hull 알고리즘 (Graham Scan)
function convexHull(points: { x: number; y: number }[]): { x: number; y: number }[] {
  if (points.length < 3) return [...points];
  
  // 가장 아래쪽 점 찾기
  const sorted = [...points].sort((a, b) => {
    if (a.y !== b.y) return a.y - b.y;
    return a.x - b.x;
  });
  
  const start = sorted[0];
  
  // 각도 기준 정렬
  const rest = sorted.slice(1).sort((a, b) => {
    const angleA = Math.atan2(a.y - start.y, a.x - start.x);
    const angleB = Math.atan2(b.y - start.y, b.x - start.x);
    return angleA - angleB;
  });
  
  const hull: { x: number; y: number }[] = [start];
  
  for (const point of rest) {
    while (hull.length >= 2) {
      const last = hull[hull.length - 1];
      const secondLast = hull[hull.length - 2];
      const cross = 
        (last.x - secondLast.x) * (point.y - secondLast.y) -
        (last.y - secondLast.y) * (point.x - secondLast.x);
      
      if (cross <= 0) {
        hull.pop();
      } else {
        break;
      }
    }
    hull.push(point);
  }
  
  return hull;
}

// 폴리곤 확장 (각 꼭지점을 바깥쪽으로 이동)
function expandPolygon(
  points: { x: number; y: number }[],
  distance: number
): { x: number; y: number }[] {
  if (points.length < 3) return points;
  
  const result: { x: number; y: number }[] = [];
  const n = points.length;
  
  for (let i = 0; i < n; i++) {
    const prev = points[(i - 1 + n) % n];
    const curr = points[i];
    const next = points[(i + 1) % n];
    
    // 두 변의 방향 벡터
    const v1 = { x: curr.x - prev.x, y: curr.y - prev.y };
    const v2 = { x: next.x - curr.x, y: next.y - curr.y };
    
    // 정규화
    const len1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y) || 1;
    const len2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y) || 1;
    
    v1.x /= len1;
    v1.y /= len1;
    v2.x /= len2;
    v2.y /= len2;
    
    // 법선 벡터 (왼쪽 방향)
    const n1 = { x: -v1.y, y: v1.x };
    const n2 = { x: -v2.y, y: v2.x };
    
    // 평균 법선
    const avgN = {
      x: (n1.x + n2.x) / 2,
      y: (n1.y + n2.y) / 2,
    };
    const avgLen = Math.sqrt(avgN.x * avgN.x + avgN.y * avgN.y) || 1;
    avgN.x /= avgLen;
    avgN.y /= avgLen;
    
    result.push({
      x: curr.x + avgN.x * distance,
      y: curr.y + avgN.y * distance,
    });
  }
  
  return result;
}

// 부드러운 폴리곤 경로 생성 (Catmull-Rom 스플라인)
function smoothPolygonPath(points: { x: number; y: number }[]): string {
  if (points.length < 3) return '';
  
  const n = points.length;
  let path = `M ${points[0].x} ${points[0].y}`;
  
  for (let i = 0; i < n; i++) {
    const p0 = points[(i - 1 + n) % n];
    const p1 = points[i];
    const p2 = points[(i + 1) % n];
    const p3 = points[(i + 2) % n];
    
    // Catmull-Rom to Bezier 변환
    const cp1 = {
      x: p1.x + (p2.x - p0.x) / 6,
      y: p1.y + (p2.y - p0.y) / 6,
    };
    const cp2 = {
      x: p2.x - (p3.x - p1.x) / 6,
      y: p2.y - (p3.y - p1.y) / 6,
    };
    
    path += ` C ${cp1.x} ${cp1.y}, ${cp2.x} ${cp2.y}, ${p2.x} ${p2.y}`;
  }
  
  path += ' Z';
  return path;
}


