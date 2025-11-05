'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { type GetMapResponse } from '@/lib/api/sammo';
import MapCityDetail from './MapCityDetail';
import styles from './MapViewer.module.css';

interface MapViewerProps {
  serverID: string;
  mapData: GetMapResponse;
  myCity?: number;
  onCityClick?: (cityId: number) => void;
}

interface ParsedCity {
  id: number;
  name: string;
  level: number;
  state: number;
  nationID?: number;
  nation?: string;
  color?: string;
  isCapital: boolean;
  supply: boolean;
  region: number;
  x: number;
  y: number;
  clickable: boolean;
}

export default function MapViewer({ serverID, mapData, myCity, onCityClick }: MapViewerProps) {
  const [hideCityName, setHideCityName] = useState(false);
  const [activatedCity, setActivatedCity] = useState<{
    id: number;
    text: string;
    nation: string;
    region: number;
    level: number;
  } | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const mapBodyRef = useRef<HTMLDivElement>(null);
  const isFullWidth = true; // 맵은 항상 전체 너비 사용

  // 도시 데이터 파싱
  const parsedCities = useMemo(() => {
    if (!mapData.cityList || !mapData.nationList) return [];

    // 국가 맵 생성 [id, name, color, capital]
    const nationMap = new Map<number, { name: string; color: string; capital: number }>();
    for (const nation of mapData.nationList) {
      const [id, name, color, capital] = nation;
      nationMap.set(id, { name, color, capital });
    }

    // 도시 파싱 [city, level, state, nation, region, supply, name, x, y]
    return mapData.cityList.map((cityData): ParsedCity => {
      const [id, level, state, nationID, region, supply, name, x, y] = cityData;
      const nation = nationID > 0 ? nationMap.get(nationID) : undefined;

      return {
        id,
        name: name || `도시 ${id}`,
        level: level !== undefined ? level : 1, // level이 0일 수 있으므로 !== undefined 사용
        state: state !== undefined ? state : 0,
        nationID: nationID > 0 ? nationID : undefined,
        nation: nation?.name,
        color: nation?.color,
        isCapital: nation?.capital === id,
        supply: supply !== 0,
        region: region !== undefined ? region : 0,
        x: x !== undefined ? x : 0,
        y: y !== undefined ? y : 0,
        clickable: true,
      };
    });
  }, [mapData]);

  function handleCityClick(e: React.MouseEvent, city: ParsedCity) {
    e.preventDefault();
    if (onCityClick) {
      onCityClick(city.id);
    }
  }

  // 레벨을 텍스트로 변환
  const getLevelText = (level: number): string => {
    const levelMap: Record<number, string> = {
      0: '무',
      1: '향',
      2: '수',
      3: '진',
      4: '관',
      5: '이',
      6: '소',
      7: '중',
      8: '대',
      9: '특',
      10: '경',
    };
    return levelMap[level] || '무';
  };

  // 지역 ID를 지역 이름으로 변환
  const getRegionText = (region: number): string => {
    const regionMap: Record<number, string> = {
      1: '하북',
      2: '중원',
      3: '서북',
      4: '서촉',
      5: '남중',
      6: '초',
      7: '오월',
      8: '동이',
    };
    return regionMap[region] || `지역${region}`;
  };

  function handleCityMouseEnter(e: React.MouseEvent, city: ParsedCity) {
    if (mapBodyRef.current) {
      const rect = mapBodyRef.current.getBoundingClientRect();
      setTooltipPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    }
    setActivatedCity({
      id: city.id,
      text: city.name,
      nation: city.nation || '무소속',
      region: city.region,
      level: city.level,
    });
  }

  function handleCityMouseLeave() {
    setActivatedCity(null);
  }

  // 계절별 클래스 결정
  const getSeasonClass = () => {
    const month = mapData.month || 1;
    if (month <= 3) return 'map_spring';
    if (month <= 6) return 'map_summer';
    if (month <= 9) return 'map_fall';
    return 'map_winter';
  };

  const seasonClass = getSeasonClass();

  return (
    <div className={`world_map map_detail full_width_map ${seasonClass} ${hideCityName ? 'hide_cityname' : ''} ${styles.worldMap}`}>
      <div className={styles.mapTitle}>
        <span className={styles.mapTitleText}>
          {mapData.year}年 {mapData.month}月
        </span>
      </div>
      <div ref={mapBodyRef} className={styles.mapBody}>
        {/* 배경 레이어들 (먼저 렌더링) */}
        <div className={styles.mapBglayer1}></div>
        <div className={styles.mapBglayer2}></div>
        <div className={styles.mapBgroad}></div>
        {/* 도시 마커들 (나중에 렌더링 - DOM 순서로 위에 표시) */}
        {parsedCities.length > 0 ? (
          parsedCities.map((city) => (
            <MapCityDetail
              key={city.id}
              city={city}
              isMyCity={city.id === myCity}
              isFullWidth={isFullWidth}
              hideCityName={hideCityName}
              onMouseEnter={handleCityMouseEnter}
              onMouseLeave={handleCityMouseLeave}
              onClick={handleCityClick}
              onToggleCityName={() => setHideCityName(!hideCityName)}
            />
          ))
        ) : (
          <div style={{ position: 'absolute', top: '10px', left: '10px', color: 'red', zIndex: 100 }}>
            도시가 없습니다. parsedCities: {parsedCities.length}
          </div>
        )}
        {/* 버튼 스택 (가장 위) */}
        <div className={styles.mapButtonStack}>
          <button
            type="button"
            className={`btn btn-primary btn-sm btn-minimum ${hideCityName ? 'active' : ''}`}
            onClick={() => {
              setHideCityName(!hideCityName);
              console.log('hideCityName:', !hideCityName);
            }}
          >
            도시명 표기
          </button>
        </div>
      </div>
      {activatedCity && (
        <div
          className={styles.cityTooltip}
          style={{
            display: 'block',
            position: 'absolute',
            left: `${tooltipPosition.x + 10}px`,
            top: `${tooltipPosition.y + 30}px`,
            zIndex: 16,
          }}
        >
          <div className={styles.cityName}>
            [{getRegionText(activatedCity.region)}|{getLevelText(activatedCity.level)}] {activatedCity.text}
          </div>
          <div className={styles.nationName}>{activatedCity.nation}</div>
        </div>
      )}
    </div>
  );
}
