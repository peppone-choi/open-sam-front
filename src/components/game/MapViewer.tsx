'use client';

import React, { useState, useEffect, useRef, useMemo, useLayoutEffect, useCallback, memo } from 'react';
import { SammoAPI, type GetMapResponse } from '@/lib/api/sammo';
import MapCityDetail from './MapCityDetail';
import MovementLayer from './MovementLayer';
import TerritoryOverlay from './TerritoryOverlay';
import RoadNetwork from './RoadNetwork';
import { TroopMovement, MovementFilterOptions } from '@/types/movement';
import styles from './MapViewer.module.css';

interface MapViewerProps {
  serverID: string;
  mapData: GetMapResponse;
  myCity?: number;
  myGeneralIds?: number[]; // 내 장수들의 ID
  onCityClick?: (cityId: number, event?: MouseEvent | React.MouseEvent) => void;
  isFullWidth?: boolean; // 전체 너비 사용 여부
  
  // 군대 이동 시각화
  movements?: TroopMovement[];
  showMovements?: boolean;
  movementFilter?: MovementFilterOptions;
  onMovementClick?: (movement: TroopMovement) => void;
  onCancelMovement?: (movementId: string) => Promise<void>;
  onGoToCommandScreen?: (generalId: number) => void; // 커맨드 예약 화면으로 이동
  onTrackMovement?: (movement: TroopMovement) => void;
  
  // 경로 표시
  highlightPath?: number[]; // 강조할 도시 ID 배열 (이동 경로)
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

function MapViewerComponent({ 
  serverID, 
  mapData, 
  myCity, 
  myGeneralIds = [],
  onCityClick, 
  isFullWidth = true,
  movements = [],
  showMovements = true,
  movementFilter,
  onMovementClick,
  onCancelMovement,
  onGoToCommandScreen,
  onTrackMovement,
  highlightPath = [],
}: MapViewerProps) {
  // serverID는 이미 props에 포함되어 있음
  const [hideCityName, setHideCityName] = useState(false);
  const [showMovementLayer, setShowMovementLayer] = useState(showMovements);
  const [showTerritory, setShowTerritory] = useState(false);
  const [showRoads, setShowRoads] = useState(true);  // 도로 표시 여부
  const [selectedCityId, setSelectedCityId] = useState<number | null>(null);
  const [fetchedRoadList, setFetchedRoadList] = useState<[number, number][] | null>(null);
  const [roadListLoading, setRoadListLoading] = useState(false);
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

  // roadList가 없으면 별도로 가져오기 (히스토리 페이지 등에서 사용)
  useEffect(() => {
    const hasRoadList = mapData.roadList && mapData.roadList.length > 0;
    if (!hasRoadList && !fetchedRoadList && !roadListLoading && serverID) {
      setRoadListLoading(true);
      SammoAPI.GlobalGetMap({ serverID, neutralView: 1 })
        .then((result) => {
          if (result.roadList && result.roadList.length > 0) {
            setFetchedRoadList(result.roadList);
          }
        })
        .catch((err) => {
          console.warn('Failed to fetch roadList:', err);
        })
        .finally(() => {
          setRoadListLoading(false);
        });
    }
  }, [mapData.roadList, fetchedRoadList, roadListLoading, serverID]);

  // 실제 사용할 roadList (props 우선, 없으면 fetch한 것 사용)
  const effectiveRoadList = useMemo(() => {
    if (mapData.roadList && mapData.roadList.length > 0) {
      return mapData.roadList;
    }
    return fetchedRoadList || [];
  }, [mapData.roadList, fetchedRoadList]);

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

  // 클릭된 도시 상태 (시각적 피드백용)
  const [clickedCityId, setClickedCityId] = useState<number | null>(null);

  const handleCityClick = useCallback((e: React.MouseEvent, city: ParsedCity) => {
    e.preventDefault();
    
    // 도시 ID가 0이거나 클릭 불가능한 경우 무시
    if (city.id === 0 || city.clickable === 0) {
      return;
    }
    
    // 시각적 피드백 - 클릭된 도시 강조
    setClickedCityId(city.id);
    setTimeout(() => setClickedCityId(null), 300);
    
    // Ctrl+클릭 또는 Cmd+클릭 시 새 탭에서 열기
    if (e.ctrlKey || e.metaKey) {
      const url = `/${serverID}/info/current-city?cityId=${city.id}`;
      window.open(url, '_blank');
      return;
    }
    
    // 이벤트 객체와 함께 콜백 호출
    onCityClick?.(city.id, e);
  }, [serverID, onCityClick]);

  const handleCityTouchEnd = useCallback((e: React.TouchEvent, city: ParsedCity) => {
    e.preventDefault();
    
    // 도시 ID가 0이거나 클릭 불가능한 경우 무시
    if (city.id === 0 || city.clickable === 0) {
      return;
    }
    
    // 시각적 피드백
    setClickedCityId(city.id);
    setTimeout(() => setClickedCityId(null), 300);
    
    // 콜백 호출
    onCityClick?.(city.id);
  }, [onCityClick]);

  // 도시가 경로에 포함되어 있는지 확인
  const isInHighlightPath = useCallback((cityId: number) => {
    return highlightPath.includes(cityId);
  }, [highlightPath]);

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
      {/* 맵 컨테이너 */}
      <div 
        ref={mapBodyRef}
        className={styles.mapBody}
      >
        {/* 맵 컨텐츠 레이어 */}
        <div className={styles.zoomableContent}>
          {/* 배경 레이어들 (먼저 렌더링) */}
          <div className={styles.mapBglayer1} style={{ backgroundImage: `url(${backgroundImage})` }}></div>
          <div className={styles.mapBglayer2}></div>
          
          {/* 동적 도로 네트워크 (roadList가 있으면 동적, 없으면 정적 이미지) */}
          {showRoads && effectiveRoadList.length > 0 ? (
            <RoadNetwork
              cities={parsedCities.map(c => ({
                id: c.id,
                name: c.name,
                x: c.x,
                y: c.y,
                nationID: c.nationID,
                region: c.region,
              }))}
              roads={effectiveRoadList}
              nations={mapData.nationList?.map(n => ({
                id: n[0],
                color: n[2],
              }))}
              showNationColors={false}
            />
          ) : showRoads && !roadListLoading ? (
            <div className={styles.mapBgroad}></div>
          ) : null}
          
          {/* 세력 영역 오버레이 */}
          {showTerritory && mapData.nationList && (
            <TerritoryOverlay
              cities={parsedCities.map((c) => ({
                id: c.id,
                name: c.name,
                nationID: c.nationID,
                x: c.x,
                y: c.y,
              }))}
              nations={mapData.nationList.map((n) => ({
                id: n[0],
                name: n[1],
                color: n[2],
              }))}
              opacity={0.2}
              myNationId={mapData.myNation}
            />
          )}
          {/* 경로 표시 레이어 (도시 마커 아래에 렌더링) */}
          {highlightPath.length > 1 && (
            <svg 
              className={styles.pathLayer}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'none',
                zIndex: 0,
              }}
            >
              <defs>
                <marker
                  id="arrowhead"
                  markerWidth="10"
                  markerHeight="7"
                  refX="9"
                  refY="3.5"
                  orient="auto"
                >
                  <polygon points="0 0, 10 3.5, 0 7" fill="#FFD700" />
                </marker>
              </defs>
              {highlightPath.slice(0, -1).map((cityId, idx) => {
                const fromCity = parsedCities.find(c => c.id === cityId);
                const toCity = parsedCities.find(c => c.id === highlightPath[idx + 1]);
                if (!fromCity || !toCity) return null;
                
                const LEFT_OFFSET = 14;
                const TOP_OFFSET = 20;
                const x1 = ((fromCity.x - LEFT_OFFSET) / 1000) * 100;
                const y1 = ((fromCity.y - TOP_OFFSET) / 675) * 100;
                const x2 = ((toCity.x - LEFT_OFFSET) / 1000) * 100;
                const y2 = ((toCity.y - TOP_OFFSET) / 675) * 100;
                
                return (
                  <line
                    key={`path-${cityId}-${highlightPath[idx + 1]}`}
                    x1={`${x1}%`}
                    y1={`${y1}%`}
                    x2={`${x2}%`}
                    y2={`${y2}%`}
                    stroke="#FFD700"
                    strokeWidth="3"
                    strokeDasharray="8,4"
                    markerEnd="url(#arrowhead)"
                    style={{
                      filter: 'drop-shadow(0 0 4px rgba(255, 215, 0, 0.8))',
                    }}
                  />
                );
              })}
            </svg>
          )}
          {/* 도시 마커들 (나중에 렌더링 - DOM 순서로 위에 표시) */}
          {parsedCities.length > 0 ? (
            parsedCities.map((city) => (
              <MapCityDetail
                key={city.id}
                city={city}
                isMyCity={city.id === myCity}
                isSelected={city.id === selectedCityId || city.id === clickedCityId || isInHighlightPath(city.id)}
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
          {/* 군대 이동 레이어 */}
          {showMovementLayer && movements.length > 0 && (
            <MovementLayer
              movements={movements}
              currentTurn={(mapData as any).turn ?? 0}
              myNationId={mapData.myNation ?? undefined}
              myGeneralIds={myGeneralIds}
              filter={movementFilter}
              isFullWidth={isFullWidth}
              onMovementClick={onMovementClick}
              onCancelMovement={onCancelMovement}
              onGoToCommandScreen={onGoToCommandScreen}
              onTrackOnMap={onTrackMovement}
            />
          )}
        </div>
        
        {/* 버튼 스택 (가장 위) */}
        <div className={styles.mapButtonStack}>
          <button
            type="button"
            className={`btn btn-primary btn-sm btn-minimum ${hideCityName ? 'active' : ''}`}
            onClick={() => {
              setHideCityName(!hideCityName);
            }}
          >
            도시명: {hideCityName ? 'OFF' : 'ON'}
          </button>
          <button
            type="button"
            className={`btn btn-secondary btn-sm btn-minimum ${showRoads ? 'active' : ''}`}
            onClick={() => {
              setShowRoads(!showRoads);
            }}
          >
            가도: {showRoads ? 'ON' : 'OFF'}
          </button>
          <button
            type="button"
            className={`btn btn-secondary btn-sm btn-minimum ${showTerritory ? 'active' : ''}`}
            onClick={() => {
              setShowTerritory(!showTerritory);
            }}
          >
            세력권: {showTerritory ? 'ON' : 'OFF'}
          </button>
          {movements.length > 0 && (
            <button
              type="button"
              className={`btn btn-secondary btn-sm btn-minimum ${showMovementLayer ? 'active' : ''}`}
              onClick={() => {
                setShowMovementLayer(!showMovementLayer);
              }}
            >
              이동: {showMovementLayer ? 'ON' : 'OFF'}
            </button>
          )}
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

// React.memo로 최적화 - 지도 데이터가 변경되지 않으면 리렌더링 방지
const MapViewer = memo(MapViewerComponent, (prevProps, nextProps) => {
  return (
    prevProps.serverID === nextProps.serverID &&
    prevProps.myCity === nextProps.myCity &&
    prevProps.isFullWidth === nextProps.isFullWidth &&
    prevProps.showMovements === nextProps.showMovements &&
    prevProps.mapData.year === nextProps.mapData.year &&
    prevProps.mapData.month === nextProps.mapData.month &&
    prevProps.movements?.length === nextProps.movements?.length &&
    prevProps.highlightPath?.length === nextProps.highlightPath?.length &&
    JSON.stringify(prevProps.highlightPath) === JSON.stringify(nextProps.highlightPath)
  );
});

export default MapViewer;
