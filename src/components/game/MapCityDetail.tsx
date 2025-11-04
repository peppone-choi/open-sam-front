'use client';

import React from 'react';
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
  x: number;
  y: number;
  clickable: boolean;
}

interface MapCityDetailProps {
  city: MapCity;
  isMyCity: boolean;
  isFullWidth: boolean;
  hideCityName?: boolean;
  onMouseEnter?: (e: React.MouseEvent, city: MapCity) => void;
  onMouseLeave?: (e: React.MouseEvent) => void;
  onClick?: (e: React.MouseEvent, city: MapCity) => void;
}

// 이미지 경로 - 실제 이미지 서버 경로로 변경 필요
const IMAGE_PATH = '/image/game'; // TODO: 실제 이미지 경로로 변경

export default function MapCityDetail({
  city,
  isMyCity,
  isFullWidth,
  hideCityName = false,
  onMouseEnter,
  onMouseLeave,
  onClick,
}: MapCityDetailProps) {
  // 위치 계산 (PHP 원본과 동일: city.x - 20, city.y - 15)
  const cityPos = isFullWidth
    ? { left: `${city.x - 20}px`, top: `${city.y - 15}px` }
    : { left: `${(city.x - 20) * 0.714}px`, top: `${(city.y - 15) * 0.714}px` };

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onClick) {
      onClick(e, city);
    }
  };

  const handleMouseEnter = (e: React.MouseEvent) => {
    if (onMouseEnter) {
      onMouseEnter(e, city);
    }
  };

  const handleMouseLeave = (e: React.MouseEvent) => {
    if (onMouseLeave) {
      onMouseLeave(e);
    }
  };

  // 상태 번호를 CSS 클래스로 변환
  const getStateClass = (state: number): string => {
    // 3: 전쟁/공격, 41: 호황, 43: 공성전
    if (state === 3) return 'war';
    if (state === 41) return 'good';
    if (state === 43) return 'bad';
    // 기타 상태는 기본값
    return 'default';
  };

  // 도시 아이콘 크기 및 위치 반환
  const getCityImgSize = (level: number): { width: string; height: string; left: string; top: string } => {
    const sizes: Record<number, { width: string; height: string; left: string; top: string }> = {
      1: { width: '16px', height: '15px', left: '12px', top: '7.5px' },
      2: { width: '20px', height: '14px', left: '10px', top: '8px' },
      3: { width: '14px', height: '14px', left: '13px', top: '8px' },
      4: { width: '20px', height: '15px', left: '10px', top: '7.5px' },
      5: { width: '24px', height: '16px', left: '8px', top: '7px' },
      6: { width: '26px', height: '18px', left: '7px', top: '6px' },
      7: { width: '28px', height: '20px', left: '6px', top: '5px' },
      8: { width: '32px', height: '24px', left: '4px', top: '3px' },
    };
    return sizes[level] || sizes[8];
  };


  return (
    <div
      className={`city_base city_base_${city.id} city_level_${city.level}`}
      style={{
        ...cityPos,
        position: 'absolute',
      }}
    >
      {city.color && (
        <div
          className="city_bg"
          style={{
            backgroundColor: city.color,
            opacity: 0.2,
          }}
        />
      )}
      <a
        className="city_link"
        href="#"
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        data-text={city.name}
        data-nation={city.nation || ''}
        data-id={city.id}
        style={{
          cursor: city.clickable ? 'pointer' : 'default',
        }}
      >
        <div 
          className="city_img" 
          style={{ 
            backgroundColor: '#8b4513', 
            border: '2px solid #654321',
            position: 'absolute',
            width: city.level <= 8 ? getCityImgSize(city.level).width : '32px',
            height: city.level <= 8 ? getCityImgSize(city.level).height : '24px',
            left: city.level <= 8 ? getCityImgSize(city.level).left : '4px',
            top: city.level <= 8 ? getCityImgSize(city.level).top : '3px',
          }}
        >
          <div className={`city_filler ${isMyCity ? 'my_city' : ''}`} />
          {city.nationID && city.nationID > 0 && city.color && (
            <div 
              className={`city_flag ${city.supply ? 'city_flag_supply' : 'city_flag_no_supply'}`}
              style={{
                backgroundColor: city.color,
              }}
            >
              {city.isCapital && (
                <div className="city_capital">★</div>
              )}
            </div>
          )}
          {!hideCityName && <span className="city_detail_name">{city.name}</span>}
        </div>
        {city.state > 0 && (
          <div className={`city_state city_state_${getStateClass(city.state)}`} />
        )}
      </a>
    </div>
  );
}
