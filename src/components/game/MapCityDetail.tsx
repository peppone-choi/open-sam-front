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
  region: number;
  x: number;
  y: number;
  clickable: number;
}

interface MapCityDetailProps {
  city: MapCity;
  isMyCity: boolean;
  isSelected?: boolean;
  isFullWidth: boolean;
  hideCityName?: boolean;
  onMouseEnter?: (e: React.MouseEvent, city: MapCity) => void;
  onMouseLeave?: (e: React.MouseEvent) => void;
  onClick?: (e: React.MouseEvent, city: MapCity) => void;
  onTouchEnd?: (e: React.TouchEvent, city: MapCity) => void;
  onToggleCityName?: () => void;
}

// 이미지 경로 - 실제 이미지 서버 경로
const IMAGE_PATH = '/image/game'; // 게임 이미지 경로

export default function MapCityDetail({
  city,
  isMyCity,
  isSelected = false,
  isFullWidth,
  hideCityName = false,
  onMouseEnter,
  onMouseLeave,
  onClick,
  onTouchEnd,
  onToggleCityName,
}: MapCityDetailProps) {
  // 위치 계산 - 도시 아이콘 중심 맞추기
  // 지도 크기: 700px → 740px (비율: 740/700 = 1.057)
  // 돈황(x=10)이 맵 왼쪽에 보이도록 오프셋 조정
  const LEFT_OFFSET = 10; // 돈황이 보이도록 조정
  const SCALE_X = 740 / 700; // 가로 스케일 비율
  const cityPos = isFullWidth
    ? { left: `${(city.x - LEFT_OFFSET) * SCALE_X}px`, top: `${city.y - 15}px` }
    : { left: `${(city.x - LEFT_OFFSET) * 0.714}px`, top: `${(city.y - 15) * 0.714}px` };

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

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (onTouchEnd) {
      onTouchEnd(e, city);
    }
  };

  // 도시 아이콘 이미지 크기 반환 (실제 이미지 크기)
  const getCityIconImgSize = (level: number): { width: string; height: string } => {
    const sizes: Record<number, { width: string; height: string }> = {
      0: { width: '28px', height: '16px' }, // 무 - 00.png
      1: { width: '28px', height: '16px' }, // 향 - 00_hyang.png
      2: { width: '28px', height: '16px' }, // 수 - 00_su.png
      3: { width: '28px', height: '16px' }, // 진 - 00_jin.png
      4: { width: '28px', height: '16px' }, // 관 - 00_gwan.png
      5: { width: '28px', height: '16px' }, // 이 - 00_i.png
      6: { width: '28px', height: '16px' }, // 소 - 01.png
      7: { width: '29px', height: '17px' }, // 중 - 02.png
      8: { width: '27px', height: '18px' }, // 대 - 03.png
      9: { width: '36px', height: '21px' }, // 특 - 04.png
      10: { width: '41px', height: '25px' }, // 특 - 05.png
    };
    return sizes[level] || sizes[8];
  };

  // 도시 아이콘 위치 반환 (CSS와 동일하게 중앙 정렬)
  const getCityIconPosition = (level: number): { left: string; top: string } => {
    const positions: Record<number, { left: string; top: string }> = {
      0: { left: 'calc((40px - 28px) / 2)', top: 'calc((30px - 16px) / 2)' },
      1: { left: 'calc((40px - 28px) / 2)', top: 'calc((30px - 16px) / 2)' },
      2: { left: 'calc((40px - 28px) / 2)', top: 'calc((30px - 16px) / 2)' },
      3: { left: 'calc((40px - 28px) / 2)', top: 'calc((30px - 16px) / 2)' },
      4: { left: 'calc((40px - 28px) / 2)', top: 'calc((30px - 16px) / 2)' },
      5: { left: 'calc((40px - 28px) / 2)', top: 'calc((30px - 16px) / 2)' },
      6: { left: 'calc((40px - 28px) / 2)', top: 'calc((30px - 16px) / 2)' },
      7: { left: 'calc((40px - 29px) / 2)', top: 'calc((30px - 17px) / 2)' },
      8: { left: 'calc((40px - 27px) / 2)', top: 'calc((30px - 18px) / 2)' },
      9: { left: 'calc((40px - 36px) / 2)', top: 'calc((30px - 21px) / 2)' },
      10: { left: 'calc((40px - 41px) / 2)', top: 'calc((30px - 25px) / 2)' },
    };
    return positions[level] || positions[8];
  };

  // 도시 레벨에 따른 아이콘 경로 반환
  const getCityIconPath = (level: number): string => {
    const iconMap: Record<number, string> = {
      0: '/sam_icon/00.png',      // 무
      1: '/sam_icon/00_hyang.png', // 향
      2: '/sam_icon/00_su.png',    // 수
      3: '/sam_icon/00_jin.png',   // 진
      4: '/sam_icon/00_gwan.png',  // 관
      5: '/sam_icon/00_i.png',     // 이
      6: '/sam_icon/01.png',       // 소
      7: '/sam_icon/02.png',       // 중
      8: '/sam_icon/03.png',       // 대
    };
    // 레벨 9 이상은 03.png 또는 04.png, 05.png 사용 가능
    if (level >= 9) {
      return level === 9 ? '/sam_icon/04.png' : '/sam_icon/05.png';
    }
    return iconMap[level] || '/sam_icon/00.png';
  };

  // 도시 레벨 이름 반환
  const getCityLevelName = (level: number): string => {
    const levelNames: Record<number, string> = {
      0: '무',
      1: '향',
      2: '수',
      3: '진',
      4: '관',
      5: '이', // 이민족
      6: '소',
      7: '중',
      8: '대',
      9: '특',
      10: '경',
    };
    return levelNames[level] || '대';
  };

  // 색상을 파일명 형식으로 변환 (#FF0000 -> FF0000)
  const getColorValue = (color?: string): string => {
    if (!color) return '';
    return color.substring(1).toUpperCase();
  };

  // 헥스 색상을 RGB로 변환 (오라 효과용)
  const hexToRgb = (hex: string): string | null => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
      : null;
  };

  const colorValue = city.color ? getColorValue(city.color) : '';
  const rgbColor = city.color ? hexToRgb(city.color) : null;

  // 오른쪽 끝 도시는 도시명을 왼쪽에 표시 (X 좌표 650 이상)
  const isRightEdge = city.x >= 650;
  // 계림은 중앙 아래에 표시
  const isCenterCity = city.name === '계림';

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
        onClick={(e) => {
          e.stopPropagation();
          if (onToggleCityName) {
            onToggleCityName();
          }
        }}
        style={{ 
          cursor: onToggleCityName ? 'pointer' : 'default',
          zIndex: 10,
          position: 'absolute',
          ...(isCenterCity
            ? { left: '50%', top: '30px', transform: 'translateX(-50%)' }  // 계림은 중앙 아래
            : isRightEdge 
              ? { right: '32px', top: '18px' }  // 오른쪽 끝 도시는 왼쪽에 표시
              : { left: '32px', top: '18px' }   // 일반 도시는 오른쪽에 표시
          ),
          fontSize: '10px',
          whiteSpace: 'nowrap',
          display: 'inline-block',
        }}
      >
        {city.name}
      </span>
      {/* city_bg 제거 - 아이콘 이미지에 오라 효과 적용 */}
      {/* 배경 레이어 - city_link 밖에 배치 (PHP 원본과 동일) */}
      {city.nationID && city.nationID > 0 && (
        <div
          className="city_bg"
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            width: '35px',
            height: '35px',
            background: 'radial-gradient(circle, rgba(255, 0, 0, 0.9) 0%, rgba(255, 0, 0, 0.7) 30%, rgba(255, 0, 0, 0.4) 60%, transparent 100%)',
            filter: 'blur(4px)',
            borderRadius: '50%',
            pointerEvents: 'none',
            transform: 'translate(-50%, -50%)',
          }}
        />
      )}
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
      {/* 자신의 거처 도시 강조 표시 */}
      {isMyCity && (
        <div className="city_home_indicator">
          <span style={{
            position: 'absolute',
            left: '-8px',
            top: '-8px',
            fontSize: '16px',
            zIndex: 10,
            filter: 'drop-shadow(0 0 2px rgba(0,0,0,0.8))',
            pointerEvents: 'none',
          }}>
            🏠
          </span>
        </div>
      )}
      {/* 수도 강조 표시 */}
      {city.isCapital && (
        <div className="city_capital_indicator">
          <span style={{
            position: 'absolute',
            left: '32px',
            top: '-8px',
            fontSize: '14px',
            zIndex: 10,
            filter: 'drop-shadow(0 0 2px rgba(255,215,0,0.8))',
            pointerEvents: 'none',
          }}>
            ⭐
          </span>
        </div>
      )}
      <a
        className="city_link"
        href="#"
        onClick={handleClick}
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
          <div className={`city_filler ${isMyCity ? 'my_city' : ''}`} />
          {city.nationID && city.nationID > 0 && city.color && (
            <div className="city_flag">
              <img 
                src={`${IMAGE_PATH}/${city.supply ? 'f' : 'd'}${colorValue}.gif`}
                alt="깃발"
              />
              {city.isCapital && (
                <div className="city_capital">
                  <img 
                    src={`${IMAGE_PATH}/event51.gif`}
                    alt="수도"
                  />
                </div>
              )}
            </div>
          )}
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
