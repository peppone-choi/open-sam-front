'use client';

import React, { useState, useEffect, useRef, useMemo, useLayoutEffect, useCallback } from 'react';
import { type GetMapResponse } from '@/lib/api/sammo';
import MapCityDetail from './MapCityDetail';
import styles from './MapViewer.module.css';

interface MapViewerProps {
  serverID: string;
  mapData: GetMapResponse;
  myCity?: number;
  onCityClick?: (cityId: number) => void;
  isFullWidth?: boolean; // 전체 너비 사용 여부
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
  clickable: number;
}

export default function MapViewer({ serverID, mapData, myCity, onCityClick, isFullWidth = true }: MapViewerProps) {
  // serverID는 이미 props에 포함되어 있음
  const [hideCityName, setHideCityName] = useState(false);
  const [selectedCityId, setSelectedCityId] = useState<number | null>(null);
  const [activatedCity, setActivatedCity] = useState<{
    id: number;
    text: string;
    nation: string;
    nationColor: string;
    flagImage?: string;
    flagTextColor?: string;
    flagBgColor?: string;
    flagBorderColor?: string;
    region: number;
    level: number;
  } | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [mapBounds, setMapBounds] = useState({ width: 0, height: 0 });
  const [tooltipSize, setTooltipSize] = useState({ width: 0, height: 0 });
  const mapBodyRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const updateMapBounds = useCallback(() => {
    if (!mapBodyRef.current) {
      return;
    }
    const rect = mapBodyRef.current.getBoundingClientRect();
    setMapBounds({ width: rect.width, height: rect.height });
  }, []);

  useEffect(() => {
    updateMapBounds();
    window.addEventListener('resize', updateMapBounds);
    return () => {
      window.removeEventListener('resize', updateMapBounds);
    };
  }, [updateMapBounds]);

  // 도시 데이터 파싱
  const parsedCities = useMemo(() => {
    if (!mapData.cityList || !mapData.nationList) return [];

    // 국가 맵 생성 [id, name, color, capital]
    const nationMap = new Map<number, { name: string; color: string; capital: number }>();
    for (const nation of mapData.nationList) {
      const [id, name, color, capital] = nation;
      nationMap.set(id, { name, color, capital });
    }

    // shownByGeneralList를 Set으로 변환 (빠른 조회)
    const shownByGeneralSet = new Set(mapData.shownByGeneralList || []);
    
    // 도시 파싱 [city, level, state, nation, region, supply, name, x, y]
    return mapData.cityList.map((cityData): ParsedCity => {
      const [id, level, state, nationID, region, supply, name, x, y] = cityData;
      const nation = nationID > 0 ? nationMap.get(nationID) : undefined;

      // clickable 비트 연산 계산
      // clickable = (defaultCity << 4) | (remainSpy << 3) | (ourCity << 2) | (shownByGeneral << 1)
      let clickable = 16; // Bit 4: default flag
      
      // Bit 3: spy information (스파이 정보)
      if (mapData.spyList && id in mapData.spyList) {
        clickable |= mapData.spyList[id] << 3;
      }
      
      // Bit 2: own city (아군 도시)
      if (mapData.myNation && nationID === mapData.myNation) {
        clickable |= 4;
      }
      
      // Bit 1: shown by general list or my city (장수가 있는 도시 또는 내 도시)
      if (shownByGeneralSet.has(id) || (mapData.myCity && id === mapData.myCity)) {
        clickable |= 2;
      }

      const resolvedName = typeof name === 'string' ? name : name != null ? String(name) : undefined;

      return {
        id,
        name: resolvedName || `도시 ${id}`,
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
        clickable,
      };
    });
  }, [mapData]);

  function handleCityClick(e: React.MouseEvent, city: ParsedCity) {
    e.preventDefault();
    
    // 도시 ID가 0이거나 클릭 불가능한 경우 무시
    if (city.id === 0 || city.clickable === 0) {
      return;
    }
    
    // Ctrl+클릭 또는 Cmd+클릭 시 새 탭에서 열기
    if (e.ctrlKey || e.metaKey) {
      const url = `/${serverID}/info/current-city?cityId=${city.id}`;
      window.open(url, '_blank');
      return;
    }
    
    // 단일 탭으로 즉시 이동
    if (onCityClick) {
      onCityClick(city.id);
    }
  }

  function handleCityTouchEnd(e: React.TouchEvent, city: ParsedCity) {
    e.preventDefault();
    
    // 도시 ID가 0이거나 클릭 불가능한 경우 무시
    if (city.id === 0 || city.clickable === 0) {
      return;
    }
    
    // 단일 탭으로 즉시 이동
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
      0: '기타',
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

  const getContrastTextColor = (bgColor: string): string => {
    const hex = bgColor.replace('#', '');
    if (hex.length !== 6) {
      return '#ffffff';
    }
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness >= 150 ? '#000000' : '#ffffff';
  };

  const getContrastBorderColor = (bgColor: string): string => {
    const hex = bgColor.replace('#', '');
    if (hex.length !== 6) {
      return 'rgba(255, 255, 255, 0.8)';
    }
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness >= 200 ? 'rgba(0, 0, 0, 0.4)' : 'rgba(255, 255, 255, 0.8)';
  };

  function syncTooltipPosition(pointer: { x: number; y: number }) {
    if (!mapBodyRef.current) {
      return;
    }
    const rect = mapBodyRef.current.getBoundingClientRect();
    setTooltipPosition({ x: pointer.x - rect.left, y: pointer.y - rect.top });
    setMapBounds({ width: rect.width, height: rect.height });
  }

  function activateCityTooltip(city: ParsedCity) {
    if (!mapData) {
      return;
    }

    const nationInfo = city.nationID && mapData.nationList
      ? mapData.nationList.find((n) => n[0] === city.nationID)
      : undefined;

    const flagBgColor = nationInfo?.[6] || nationInfo?.[2] || city.color || '#ffffff';
    const rawFlagTextColor = nationInfo?.[5];
    const flagTextColor = rawFlagTextColor && rawFlagTextColor !== 'auto'
      ? rawFlagTextColor
      : getContrastTextColor(flagBgColor);
    const rawFlagBorderColor = nationInfo?.[7];
    const flagBorderColor = rawFlagBorderColor && rawFlagBorderColor !== 'auto'
      ? rawFlagBorderColor
      : getContrastBorderColor(flagBgColor);

    setActivatedCity({
      id: city.id,
      text: city.name,
      nation: city.nation || '무소속',
      nationColor: city.color || '#ffffff',
      flagImage: nationInfo?.[4],
      flagTextColor,
      flagBgColor,
      flagBorderColor,
      region: city.region,
      level: city.level,
    });
  }

  function handleCityMouseEnter(e: React.MouseEvent, city: ParsedCity) {
    syncTooltipPosition({ x: e.clientX, y: e.clientY });
    activateCityTooltip(city);
  }

  function handleCityTouchStart(e: React.TouchEvent, city: ParsedCity) {
    const primaryTouch = e.touches[0];
    if (primaryTouch) {
      syncTooltipPosition({ x: primaryTouch.clientX, y: primaryTouch.clientY });
    }
    activateCityTooltip(city);
  }

  function handleCityMouseLeave() {
    setActivatedCity(null);
  }

  useEffect(() => {
    setSelectedCityId(null);
  }, []);

  // 계절별 클래스 결정
  const getSeasonClass = () => {
    const month = mapData.month || 1;
    if (month <= 3) return 'map_spring';
    if (month <= 6) return 'map_summer';
    if (month <= 9) return 'map_fall';
    return 'map_winter';
  };

  const seasonClass = getSeasonClass();

  const backgroundImage = useMemo(() => {
    switch (seasonClass) {
      case 'map_spring':
        return '/bg_spring.webp';
      case 'map_summer':
        return '/bg_summer.webp';
      case 'map_fall':
        return '/bg_fall.webp';
      case 'map_winter':
      default:
        return '/bg_winter.webp';
    }
  }, [seasonClass]);

  useLayoutEffect(() => {
    if (!activatedCity || !tooltipRef.current) {
      return;
    }
    const rect = tooltipRef.current.getBoundingClientRect();
    if (rect.width !== tooltipSize.width || rect.height !== tooltipSize.height) {
      setTooltipSize({ width: rect.width, height: rect.height });
    }
  }, [activatedCity, tooltipPosition.x, tooltipPosition.y, tooltipSize.height, tooltipSize.width]);

  const clampedTooltipPosition = useMemo(() => {
    const baseLeft = tooltipPosition.x + 10;
    const baseTop = tooltipPosition.y + 30;
    if (mapBounds.width === 0 || mapBounds.height === 0 || tooltipSize.width === 0 || tooltipSize.height === 0) {
      return { left: baseLeft, top: baseTop };
    }

    const padding = 8;
    const maxLeft = Math.max(mapBounds.width - tooltipSize.width - padding, padding);
    const maxTop = Math.max(mapBounds.height - tooltipSize.height - padding, padding);

    return {
      left: Math.min(Math.max(baseLeft, padding), maxLeft),
      top: Math.min(Math.max(baseTop, padding), maxTop),
    };
  }, [mapBounds.height, mapBounds.width, tooltipPosition.x, tooltipPosition.y, tooltipSize.height, tooltipSize.width]);

  return (
    <div className={`world_map map_detail full_width_map ${seasonClass} ${hideCityName ? 'hide_cityname' : ''} ${styles.worldMap}`}>
      <div className={styles.mapTitle}>
        <span className={styles.mapTitleText}>
          {mapData.year}년 {mapData.month}월
        </span>
      </div>
      <div ref={mapBodyRef} className={styles.mapBody}>
        {/* 배경 레이어들 (먼저 렌더링) */}
        <div className={styles.mapBglayer1} style={{ backgroundImage: `url(${backgroundImage})` }}></div>
        <div className={styles.mapBglayer2}></div>
        <div className={styles.mapBgroad}></div>
        {/* 도시 마커들 (나중에 렌더링 - DOM 순서로 위에 표시) */}
        {parsedCities.length > 0 ? (
          parsedCities.map((city) => (
            <MapCityDetail
              key={city.id}
              city={city}
              isMyCity={city.id === myCity}
              isSelected={city.id === selectedCityId}
              hideCityName={hideCityName}
              onMouseEnter={handleCityMouseEnter}
              onMouseLeave={handleCityMouseLeave}
              onClick={handleCityClick}
              onTouchStart={handleCityTouchStart}
              onTouchEnd={handleCityTouchEnd}
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
            }}
          >
            도시명 표시: {hideCityName ? 'OFF' : 'ON'}
          </button>
          <button
            type="button"
            className="btn btn-primary btn-sm btn-minimum"
            onClick={() => {
              setSelectedCityId(null);
            }}
          >
            선택 해제
          </button>
        </div>
      </div>
      {activatedCity && (
        <div
          ref={tooltipRef}
          className={styles.cityTooltip}
          style={{
            display: 'block',
            position: 'absolute',
            left: `${clampedTooltipPosition.left}px`,
            top: `${clampedTooltipPosition.top}px`,
            zIndex: 10000,
          }}
        >
          <div className={styles.cityName}>
            [{getRegionText(activatedCity.region)}|{getLevelText(activatedCity.level)}] {activatedCity.text}
          </div>
          <div className={styles.nationFlag}>
            <div
              className={styles.flagIcon}
              style={{
                backgroundColor: activatedCity.flagBgColor,
                color: activatedCity.flagTextColor,
                borderColor: activatedCity.flagBorderColor,
                backgroundImage: activatedCity.flagImage ? `url(${activatedCity.flagImage})` : undefined,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            >
              {!activatedCity.flagImage && activatedCity.nation.charAt(0)}
            </div>
            <span className={styles.nationNameText}>{activatedCity.nation}</span>
          </div>
        </div>
      )}
    </div>
  );
}
