'use client';

import React, { useMemo } from 'react';
import styles from './CitiesBasedOnDistance.module.css';

interface CityItem {
  name: string;
  info?: string;
}

interface CitiesBasedOnDistanceProps {
  /** 거리별 도시 ID 목록: { 1: [101, 102], 2: [103, 104], ... } */
  distanceList: Record<number, number[]>;
  /** 도시 ID -> 도시 정보 맵 */
  citiesMap: Map<number, CityItem>;
  /** 도시 선택 시 콜백 */
  onSelect: (cityId: number) => void;
}

/**
 * 거리 기반 도시 목록 컴포넌트
 * Vue의 CitiesBasedOnDistance.vue를 React로 변환
 */
export default function CitiesBasedOnDistance({
  distanceList,
  citiesMap,
  onSelect
}: CitiesBasedOnDistanceProps) {
  // 거리별로 정렬된 목록
  const sortedDistances = useMemo(() => {
    const distances = Object.keys(distanceList)
      .map(Number)
      .filter(d => distanceList[d]?.length > 0)
      .sort((a, b) => a - b);
    return distances;
  }, [distanceList]);

  // 거리에 따른 색상 클래스
  const getDistanceColorClass = (distance: number): string => {
    switch (distance) {
      case 1:
        return styles.distance1;
      case 2:
        return styles.distance2;
      case 3:
        return styles.distance3;
      default:
        return styles.distanceDefault;
    }
  };

  if (sortedDistances.length === 0) {
    return null;
  }

  return (
    <div className={styles.container}>
      {sortedDistances.map((distance) => {
        const cityIds = distanceList[distance];
        if (!cityIds || cityIds.length === 0) {
          return null;
        }

        return (
          <div key={distance} className={styles.distanceGroup}>
            <span className={styles.distanceLabel}>{distance}칸 떨어진 도시:</span>
            {cityIds.map((cityId, index) => {
              const city = citiesMap.get(cityId);
              const cityName = city?.name || `도시#${cityId}`;
              const colorClass = getDistanceColorClass(distance);

              return (
                <React.Fragment key={cityId}>
                  {index > 0 && <span className={styles.separator}>,</span>}
                  <a
                    className={`${styles.cityLink} ${colorClass}`}
                    onClick={() => onSelect(cityId)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        onSelect(cityId);
                      }
                    }}
                  >
                    {cityName}
                  </a>
                </React.Fragment>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

