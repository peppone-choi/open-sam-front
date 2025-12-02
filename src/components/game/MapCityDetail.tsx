'use client';

import React, { memo, useCallback, useMemo } from 'react';
import NationFlag from './NationFlag';
import styles from './MapCityDetail.module.css';

interface MapCity {
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

interface MapCityDetailProps {
  city: MapCity;
  isMyCity: boolean;
  isSelected?: boolean;
  hideCityName?: boolean;
  onMouseEnter?: (e: React.MouseEvent, city: MapCity) => void;
  onMouseLeave?: (e: React.MouseEvent) => void;
  onClick?: (e: React.MouseEvent, city: MapCity) => void;
  onTouchStart?: (e: React.TouchEvent, city: MapCity) => void;
  onTouchEnd?: (e: React.TouchEvent, city: MapCity) => void;
  onToggleCityName?: () => void;
}

// 이미지 경로 - 실제 이미지 서버 경로
const IMAGE_PATH = '/image/game'; // 게임 이미지 경로

// 도시 아이콘 크기 상수 (메모이제이션 대상)
const CITY_ICON_SIZES: Record<number, { width: string; height: string }> = {
  0: { width: '20px', height: '11px' },
  1: { width: '20px', height: '11px' },
  2: { width: '25px', height: '15px' },
  3: { width: '28px', height: '16px' },
  4: { width: '14px', height: '12px' },
  5: { width: '20px', height: '16px' },
  6: { width: '28px', height: '16px' },
  7: { width: '29px', height: '17px' },
  8: { width: '27px', height: '18px' },
  9: { width: '36px', height: '21px' },
  10: { width: '41px', height: '25px' },
};

// 도시 아이콘 위치 상수
const CITY_ICON_POSITIONS: Record<number, { left: string; top: string }> = {
  0: { left: 'calc((40px - 20px) / 2)', top: 'calc((30px - 11px) / 2)' },
  1: { left: 'calc((40px - 20px) / 2)', top: 'calc((30px - 11px) / 2)' },
  2: { left: 'calc((40px - 25px) / 2)', top: 'calc((30px - 15px) / 2)' },
  3: { left: 'calc((40px - 28px) / 2)', top: 'calc((30px - 16px) / 2)' },
  4: { left: 'calc((40px - 14px) / 2)', top: 'calc((30px - 12px) / 2)' },
  5: { left: 'calc((40px - 20px) / 2)', top: 'calc((30px - 16px) / 2)' },
  6: { left: 'calc((40px - 28px) / 2)', top: 'calc((30px - 16px) / 2)' },
  7: { left: 'calc((40px - 29px) / 2)', top: 'calc((30px - 17px) / 2)' },
  8: { left: 'calc((40px - 27px) / 2)', top: 'calc((30px - 18px) / 2)' },
  9: { left: 'calc((40px - 36px) / 2)', top: 'calc((30px - 21px) / 2)' },
  10: { left: 'calc((40px - 41px) / 2)', top: 'calc((30px - 25px) / 2)' },
};

// 깃발 위치 상수
const FLAG_POSITIONS: Record<number, { right: string; top: string }> = {
  0: { right: '8px', top: '-2px' },
  1: { right: '8px', top: '-2px' },
  2: { right: '5px', top: '-3px' },
  3: { right: '3px', top: '-3px' },
  4: { right: '10px', top: '-2px' },
  5: { right: '8px', top: '-3px' },
  6: { right: '3px', top: '-3px' },
  7: { right: '2px', top: '-4px' },
  8: { right: '4px', top: '-4px' },
  9: { right: '-2px', top: '-5px' },
  10: { right: '-4px', top: '-6px' },
};

// 레벨 이름 상수
const LEVEL_NAMES: Record<number, string> = {
  0: '무', 1: '향', 2: '수', 3: '진', 4: '관',
  5: '이', 6: '소', 7: '중', 8: '대', 9: '특', 10: '경',
};

// 아이콘 경로 상수
const ICON_MAP: Record<number, string> = {
  0: '/sam_icon/00.png',
  1: '/sam_icon/00_hyang.png',
  2: '/sam_icon/00_su.png',
  3: '/sam_icon/00_jin.png',
  4: '/sam_icon/00_gwan.png',
  5: '/sam_icon/00_i.png',
  6: '/sam_icon/01.png',
  7: '/sam_icon/02.png',
  8: '/sam_icon/03.png',
};

// 헬퍼 함수들 (컴포넌트 외부로 이동)
const getCityIconImgSize = (level: number) => CITY_ICON_SIZES[level] || CITY_ICON_SIZES[8];
const getCityIconPosition = (level: number) => CITY_ICON_POSITIONS[level] || CITY_ICON_POSITIONS[8];
const getFlagPosition = (level: number) => FLAG_POSITIONS[level] || FLAG_POSITIONS[8];
const getCityLevelName = (level: number) => LEVEL_NAMES[level] || '대';
const getCityIconPath = (level: number): string => {
  if (level >= 9) return level === 9 ? '/sam_icon/04.png' : '/sam_icon/05.png';
  return ICON_MAP[level] || '/sam_icon/00.png';
};

const hexToRgb = (hex: string): string | null => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
    : null;
};

const getColorValue = (color?: string): string => {
  if (!color) return '';
  return color.substring(1).toUpperCase();
};

function MapCityDetailComponent({
  city,
  isMyCity,
  isSelected = false,
  hideCityName = false,
  onMouseEnter,
  onMouseLeave,
  onClick,
  onTouchStart,
  onTouchEnd,
  onToggleCityName,
}: MapCityDetailProps) {
  // 위치 오프셋 상수
  const LEFT_OFFSET = 14;
  const TOP_OFFSET = 20;

  // 반응형 좌표 계산 (메모이제이션)
  const cityPos = useMemo(() => {
    const xPercent = ((city.x - LEFT_OFFSET) / 1000) * 100;
    const yPercent = ((city.y - TOP_OFFSET) / 675) * 100;
    return { 
      left: `${xPercent}%`, 
      top: `${yPercent}%`, 
      zIndex: 1 + Math.floor(city.y)
    };
  }, [city.x, city.y]);

  // 이벤트 핸들러 (useCallback으로 메모이제이션)
  const handleClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onClick?.(e, city);
  }, [onClick, city]);

  const handleMouseEnter = useCallback((e: React.MouseEvent) => {
    onMouseEnter?.(e, city);
  }, [onMouseEnter, city]);

  const handleMouseLeave = useCallback((e: React.MouseEvent) => {
    onMouseLeave?.(e);
  }, [onMouseLeave]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    onTouchStart?.(e, city);
  }, [onTouchStart, city]);
 
  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    onTouchEnd?.(e, city);
  }, [onTouchEnd, city]);

  const handleCityNameClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleCityName?.();
  }, [onToggleCityName]);

  // 색상 계산 (메모이제이션)
  const { displayColor, rgbColor } = useMemo(() => {
    const display = (city.nationID && city.nationID > 0) ? city.color : '#FFFFFF';
    const rgb = display ? hexToRgb(display) : null;
    return { displayColor: display, rgbColor: rgb };
  }, [city.nationID, city.color]);

  // 도시명 위치 계산 (메모이제이션)
  const { isRightEdge, isCenterCity, cityNamePosition } = useMemo(() => {
    const rightEdge = city.x >= 650;
    const centerCity = city.name === '계림';
    const nameTop = 18;
    const nameLeft = 22;
    const nameRight = 22;
    
    const position = rightEdge 
      ? { right: `${nameRight}px`, top: `${nameTop}px` }
      : { left: `${nameLeft}px`, top: `${nameTop}px` };
    
    return { isRightEdge: rightEdge, isCenterCity: centerCity, cityNamePosition: position };
  }, [city.x, city.name]);

  // 배경 오라 스타일 (메모이제이션)
  const bgStyle = useMemo(() => {
    if (!city.nationID || city.nationID <= 0 || !rgbColor) return null;
    return {
      position: 'absolute' as const,
      left: '50%',
      top: '50%',
      width: '40px',
      height: '40px',
      background: `radial-gradient(circle, rgba(${rgbColor}, 1.0) 0%, rgba(${rgbColor}, 0.95) 20%, rgba(${rgbColor}, 0.8) 40%, rgba(${rgbColor}, 0.6) 60%, rgba(${rgbColor}, 0.3) 80%, transparent 100%)`,
      filter: 'blur(3px)',
      borderRadius: '50%',
      pointerEvents: 'none' as const,
      transform: 'translate(-50%, -50%)',
      boxShadow: `0 0 10px rgba(${rgbColor}, 0.8), 0 0 20px rgba(${rgbColor}, 0.4)`,
    };
  }, [city.nationID, rgbColor]);

  return (
    <div
      className={`city_base city_base_${city.id} city_level_${city.level}`}
      style={{
        ...cityPos,
        position: 'absolute',
      }}
    >
      {/* 도시명을 DOM 첫번째에 배치 - z-index보다 DOM 순서 우선 */}
      <span 
        className="city_detail_name"
        onClick={handleCityNameClick}
        style={{ 
          cursor: onToggleCityName ? 'pointer' : 'default',
          zIndex: 10,
          position: 'absolute',
          ...(isCenterCity
            ? { left: '50%', top: '30px', transform: 'translateX(-50%)' }
            : cityNamePosition
          ),
          fontSize: '10px',
          whiteSpace: 'nowrap',
          display: 'inline-block',
        }}
      >
        {city.name}
      </span>
      {/* 배경 레이어 - 국가 색상 오라 효과 */}
      {bgStyle && <div className="city_bg" style={bgStyle} />}
      {/* 선택된 도시 하이라이트 */}
      {isSelected && (
        <div
          className="city_selected"
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            width: '45px',
            height: '45px',
            background: 'radial-gradient(circle, rgba(255, 255, 0, 0.6) 0%, rgba(255, 255, 0, 0.4) 50%, transparent 100%)',
            border: '2px solid rgba(255, 255, 0, 0.8)',
            borderRadius: '50%',
            pointerEvents: 'none',
            transform: 'translate(-50%, -50%)',
            animation: 'pulse 1s ease-in-out infinite',
          }}
        />
      )}
      {/* 자신의 거처 도시 강조 표시 - 도시 아이콘을 둘러싸는 테두리 */}
      {isMyCity && (
        <div className="city_home_indicator" style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          width: '48px',
          height: '38px',
          transform: 'translate(-50%, -50%)',
          border: '2px solid #FFD700',
          borderRadius: '4px',
          boxShadow: '0 0 8px rgba(255, 215, 0, 0.8), inset 0 0 8px rgba(255, 215, 0, 0.3)',
          zIndex: 3,
          pointerEvents: 'none',
          animation: 'pulse-border 2s ease-in-out infinite',
        }}
      />
      )}

      <a
        className="city_link"
        href="#"
        role="button"
        tabIndex={city.clickable ? 0 : -1}
        aria-label={`${city.name}, ${getCityLevelName(city.level)}급, ${city.nation || '무소속'}`}
        onClick={handleClick}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        data-text={city.name}
        data-nation={city.nation || ''}
        data-id={city.id}
        style={{
          cursor: city.clickable ? 'pointer' : 'default',
          opacity: city.clickable ? 1 : 0.6,
        }}
      >
        <div className="city_img">
          {/* 도시 아이콘 이미지 */}
          <img 
            src={getCityIconPath(city.level)}
            alt={`${getCityLevelName(city.level)}도시`}
            style={{
              position: 'absolute',
              ...getCityIconImgSize(city.level),
              ...getCityIconPosition(city.level),
              objectFit: 'contain',
              display: 'block',
            }}
          />
          <div 
            className={`city_filler ${isMyCity ? 'my_city' : ''}`}
            style={{
              // @ts-ignore - CSS 변수
              '--nation-color': city.color || '#ff0000'
            }}
          />
          {/* 깃발 - 모든 도시에 표시 (공백지는 흰색) */}
          <div className="city_flag" style={{ 
            position: 'absolute',
            ...getFlagPosition(city.level),
            zIndex: 5,
            pointerEvents: 'none'
          }}>
            <NationFlag 
              color={city.nationID && city.nationID > 0 && city.color ? city.color : '#FFFFFF'} 
              size={16}
              animate={true}  // 모든 도시 애니메이션
            />
            {city.isCapital && (
              <div className="city_capital" style={{
                position: 'absolute',
                left: '-2px',
                top: '14px',
              }}>
                <img 
                  src="/sam_icon/event/event51.gif"
                  alt="수도"
                  width={12}
                  height={12}
                  style={{
                    imageRendering: 'pixelated'
                  }}
                />
              </div>
            )}
          </div>
        </div>
        {city.state > 0 && (
          <div className="city_state">
            <img 
              src={`${IMAGE_PATH}/event${city.state}.gif`}
              alt={`도시 상태 ${city.state}`}
            />
          </div>
        )}
      </a>
    </div>
  );
}

// React.memo로 최적화 - 도시 데이터가 변경되지 않으면 리렌더링 방지
const MapCityDetail = memo(MapCityDetailComponent, (prevProps, nextProps) => {
  // 도시 정보가 동일하면 리렌더링 하지 않음
  return (
    prevProps.city.id === nextProps.city.id &&
    prevProps.city.level === nextProps.city.level &&
    prevProps.city.state === nextProps.city.state &&
    prevProps.city.nationID === nextProps.city.nationID &&
    prevProps.city.color === nextProps.city.color &&
    prevProps.city.isCapital === nextProps.city.isCapital &&
    prevProps.isMyCity === nextProps.isMyCity &&
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.hideCityName === nextProps.hideCityName
  );
});

export default MapCityDetail;
