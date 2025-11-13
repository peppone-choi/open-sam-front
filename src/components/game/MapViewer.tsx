'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { type GetMapResponse } from '@/lib/api/sammo';
import MapCityDetail from './MapCityDetail';
import { getMaxRelativeTechLevel, getBeginGameLimitInfo } from '@/utils/techLevel';
import styles from './MapViewer.module.css';

interface MapViewerProps {
  serverID: string;
  mapData: GetMapResponse;
  myCity?: number;
  onCityClick?: (cityId: number) => void;
  isFullWidth?: boolean;
  gameConst?: {
    maxTechLevel?: number;
    initialAllowedTechLevel?: number;
    techLevelIncYear?: number;
  };
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

export default function MapViewer({ serverID, mapData, myCity, onCityClick, isFullWidth = true, gameConst }: MapViewerProps) {
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
  const mapBodyRef = useRef<HTMLDivElement>(null);

  // 도시 데이터 파싱
  const parsedCities = useMemo(() => {
    if (!mapData.cityList || !mapData.nationList) return [];

    const nationMap = new Map<number, { 
      name: string; 
      color: string; 
      capital: number;
      flagImage?: string;
      flagTextColor?: string;
      flagBgColor?: string;
      flagBorderColor?: string;
    }>();
    for (const nation of mapData.nationList) {
      const [id, name, color, capital, flagImage, flagTextColor, flagBgColor, flagBorderColor] = nation;
      nationMap.set(id, { name, color, capital, flagImage, flagTextColor, flagBgColor, flagBorderColor });
      console.log('[MapViewer] 국가 정보:', { id, name, color, capital, flagImage, flagTextColor, flagBgColor, flagBorderColor });
    }

    const shownByGeneralSet = new Set(mapData.shownByGeneralList || []);

    return mapData.cityList.map((cityData): ParsedCity => {
      const [id, level, state, nationID, region, supply, name, x, y] = cityData;
      const nation = nationID > 0 ? nationMap.get(nationID) : undefined;

      let clickable = 16;
      
      if (mapData.spyList && id in mapData.spyList) {
        clickable |= mapData.spyList[id] << 3;
      }
      
      if (mapData.myNation && nationID === mapData.myNation) {
        clickable |= 4;
      }
      
      if (shownByGeneralSet.has(id) || (mapData.myCity && id === mapData.myCity)) {
        clickable |= 2;
      }

      return {
        id,
        name: String(name || `도시 ${id}`),
        level: level !== undefined ? level : 1,
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

  // 맵 타이틀 툴팁 생성
  const titleTooltip = useMemo(() => {
    const tooltips: string[] = [];
    
    // 초반 제한 기간 툴팁
    const beginLimit = getBeginGameLimitInfo(
      mapData.startYear,
      mapData.year,
      mapData.month
    );
    if (beginLimit) {
      const { remainYear, remainMonth, limitYear } = beginLimit;
      const remainText = remainYear > 0 
        ? `${remainYear}년${remainMonth > 0 ? ` ${remainMonth}개월` : ''}`
        : `${remainMonth}개월`;
      tooltips.push(`초반제한 기간: ${remainText} (${limitYear}년)`);
    }

    // 기술 등급 제한 툴팁
    if (gameConst) {
      const maxTechLevel = gameConst.maxTechLevel || 12;
      const initialAllowedTechLevel = gameConst.initialAllowedTechLevel || 1;
      const techLevelIncYear = gameConst.techLevelIncYear || 5;
      
      const currentTechLimit = getMaxRelativeTechLevel(
        mapData.startYear,
        mapData.year,
        maxTechLevel,
        initialAllowedTechLevel,
        techLevelIncYear
      );

      if (currentTechLimit >= maxTechLevel) {
        tooltips.push(`기술등급 제한: ${currentTechLimit}등급 (최종)`);
      } else {
        const nextTechLimitYear = currentTechLimit * techLevelIncYear + mapData.startYear;
        tooltips.push(`기술등급 제한: ${currentTechLimit}등급 (${nextTechLimitYear}년 해제)`);
      }
    }

    return tooltips.join('\n');
  }, [mapData.startYear, mapData.year, mapData.month, gameConst]);

  function handleCityClick(e: React.MouseEvent, city: ParsedCity) {
    e.preventDefault();
    
    if (city.id === 0 || !city.clickable) {
      return;
    }
    
    if (e.ctrlKey || e.metaKey) {
      const url = `/${serverID}/info/current-city?cityId=${city.id}`;
      window.open(url, '_blank');
      return;
    }
    
    // 단일 클릭으로 바로 이동
    if (onCityClick) {
      onCityClick(city.id);
    }
  }

  function handleCityTouchEnd(e: React.TouchEvent, city: ParsedCity) {
    e.preventDefault();
    
    if (city.id === 0 || !city.clickable) {
      return;
    }
    
    // 단일 터치로 바로 이동
    if (onCityClick) {
      onCityClick(city.id);
    }
  }

  const getLevelText = (level: number): string => {
    const levelMap: Record<number, string> = {
      0: '무', 1: '향', 2: '수', 3: '진', 4: '관',
      5: '이', 6: '소', 7: '중', 8: '대', 9: '특', 10: '경',
    };
    return levelMap[level] || '무';
  };

  const getRegionText = (region: number): string => {
    const regionMap: Record<number, string> = {
      1: '하북', 2: '중원', 3: '서북', 4: '서촉',
      5: '남중', 6: '초', 7: '오월', 8: '동이',
    };
    return regionMap[region] || `지역${region}`;
  };

  // 배경색 밝기 기반으로 텍스트 색상 자동 결정
  const getContrastTextColor = (bgColor: string): string => {
    // hex 색상을 RGB로 변환
    const hex = bgColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    // 밝기 계산 (YIQ 공식)
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    
    // 밝기가 128 이상이면 어두운 글자, 아니면 밝은 글자
    return brightness >= 128 ? '#000000' : '#ffffff';
  };

  // 배경색 밝기 기반으로 테두리 색상 자동 결정
  const getContrastBorderColor = (bgColor: string): string => {
    // hex 색상을 RGB로 변환
    const hex = bgColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    // 밝기 계산 (YIQ 공식)
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    
    // 밝기가 180 이상(밝은 색)이면 어두운 테두리, 아니면 밝은 테두리
    return brightness >= 180 ? 'rgba(0, 0, 0, 0.4)' : 'rgba(255, 255, 255, 0.8)';
  };

  function handleCityMouseEnter(e: React.MouseEvent, city: ParsedCity) {
    if (mapBodyRef.current) {
      const rect = mapBodyRef.current.getBoundingClientRect();
      setTooltipPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    }

    // 국가 정보에서 깃발 데이터 가져오기
    const nationInfo = city.nationID && mapData.nationList 
      ? mapData.nationList.find(n => n[0] === city.nationID)
      : undefined;

    const flagBgColor = nationInfo?.[6] || nationInfo?.[2] || city.color || '#ffffff';
    const rawFlagTextColor = nationInfo?.[5];
    const flagTextColor = (rawFlagTextColor && rawFlagTextColor !== 'auto') 
      ? rawFlagTextColor 
      : getContrastTextColor(flagBgColor);
    const rawFlagBorderColor = nationInfo?.[7];
    const flagBorderColor = (rawFlagBorderColor && rawFlagBorderColor !== 'auto')
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

  function handleCityMouseLeave() {
    setActivatedCity(null);
  }

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
      <div className={styles.mapTitle} title={titleTooltip}>
        <span className={styles.mapTitleText}>
          {mapData.year}年 {mapData.month}月
        </span>
      </div>
      <div 
        ref={mapBodyRef} 
        className={styles.mapBody}
        onClick={() => setSelectedCityId(null)}
      >
        <div className={styles.mapBglayer1}></div>
        <div className={styles.mapBglayer2}></div>
        <div className={styles.mapBgroad}></div>
        {parsedCities.length > 0 ? (
          parsedCities.map((city) => (
            <MapCityDetail
              key={city.id}
              city={city}
              isMyCity={city.id === myCity}
              isSelected={false}
              isFullWidth={isFullWidth}
              hideCityName={hideCityName}
              onMouseEnter={handleCityMouseEnter}
              onMouseLeave={handleCityMouseLeave}
              onClick={handleCityClick}
              onTouchEnd={handleCityTouchEnd}
              onToggleCityName={() => setHideCityName(!hideCityName)}
            />
          ))
        ) : (
          <div style={{ position: 'absolute', top: '10px', left: '10px', color: 'red', zIndex: 100 }}>
            도시가 없습니다. parsedCities: {parsedCities.length}
          </div>
        )}
        <div className={styles.mapButtonStack}>
          <button
            type="button"
            className={`${styles.mapToggleBtn} ${hideCityName ? styles.active : ''}`}
            onClick={() => {
              setHideCityName(!hideCityName);
              console.log('hideCityName:', !hideCityName);
            }}
          >
            🏷️ 도시명
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
