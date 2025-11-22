'use client';

import React from 'react';
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

export default function MapCityDetail({
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
  // 위치 계산 - 도시 아이콘 중심 맞추기
  // 지도 크기: 1000px x 675px (표준 해상도)
  // 데이터가 이미 1000x675 기준으로 변환되어 있음
  
  // 돈황 등 좌측 끝 도시가 잘리지 않도록 오프셋 조정 (10px * 1.428 ≈ 14px)
  const LEFT_OFFSET = 14; 
  // 상단 오프셋 조정 (15px * 1.35 ≈ 20px)
  const TOP_OFFSET = 20;

  // 반응형 좌표 계산 (백분율)
  const xPercent = ((city.x - LEFT_OFFSET) / 1000) * 100;
  const yPercent = ((city.y - TOP_OFFSET) / 675) * 100;

  const cityPos = { 
    left: `${xPercent}%`, 
    top: `${yPercent}%`, 
    zIndex: 1 + Math.floor(city.y) // z-index는 정수여야 함
  };

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

  const handleTouchStart = (e: React.TouchEvent) => {
    if (onTouchStart) {
      onTouchStart(e, city);
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
      0: { width: '20px', height: '11px' }, // 무 - 00.png
      1: { width: '20px', height: '11px' }, // 향 - 00_hyang.png
      2: { width: '25px', height: '15px' }, // 수 - 00_su.png
      3: { width: '28px', height: '16px' }, // 진 - 00_jin.png
      4: { width: '14px', height: '12px' }, // 관 - 00_gwan.png
      5: { width: '20px', height: '16px' }, // 이 - 00_i.png
      6: { width: '28px', height: '16px' }, // 소 - 01.png
      7: { width: '29px', height: '17px' }, // 중 - 02.png
      8: { width: '27px', height: '18px' }, // 대 - 03.png
      9: { width: '36px', height: '21px' }, // 특 - 04.png
      10: { width: '41px', height: '25px' }, // 경 - 05.png
    };
    return sizes[level] || sizes[8];
  };

  // 도시 아이콘 위치 반환 (CSS와 동일하게 중앙 정렬)
  const getCityIconPosition = (level: number): { left: string; top: string } => {
    const positions: Record<number, { left: string; top: string }> = {
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

  // 도시 레벨별 깃발 위치 반환 (아이콘 오른쪽 위에 맞춤)
  const getFlagPosition = (level: number): { right: string; top: string } => {
    const positions: Record<number, { right: string; top: string }> = {
      0: { right: '8px', top: '-2px' },    // 무 (20x11)
      1: { right: '8px', top: '-2px' },    // 향 (20x11)
      2: { right: '5px', top: '-3px' },    // 수 (25x15)
      3: { right: '3px', top: '-3px' },    // 진 (28x16)
      4: { right: '10px', top: '-2px' },   // 관 (14x12)
      5: { right: '8px', top: '-3px' },    // 이 (20x16)
      6: { right: '3px', top: '-3px' },    // 소 (28x16)
      7: { right: '2px', top: '-4px' },    // 중 (29x17)
      8: { right: '4px', top: '-4px' },    // 대 (27x18)
      9: { right: '-2px', top: '-5px' },   // 특 (36x21)
      10: { right: '-4px', top: '-6px' },  // 경 (41x25)
    };
    return positions[level] || positions[8];
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
  // 공백지는 흰색, 그 외는 국가 색상
  const displayColor = (city.nationID && city.nationID > 0) ? city.color : '#FFFFFF';
  const rgbColor = displayColor ? hexToRgb(displayColor) : null;

  // 디버깅: 수도 정보 로그 (업 도시만)
  if (city.name === '업') {
    console.log('[MapCityDetail] 업 도시 정보:', {
      cityId: city.id,
      cityName: city.name,
      nationID: city.nationID,
      nation: city.nation,
      isCapital: city.isCapital,
      color: city.color
    });
  }

  // 오른쪽 끝 도시는 도시명을 왼쪽에 표시 (X 좌표 650 이상)
  const isRightEdge = city.x >= 650;
  // 계림은 중앙 아래에 표시
  const isCenterCity = city.name === '계림';

  // 도시명 위치 계산 (아이콘 크기와 무관하게 고정 위치)
  const getCityNamePosition = (): { left?: string; right?: string; top: string } => {
    // 40x30 컨테이너 기준
    const containerWidth = 40;
    
    // 도시명을 컨테이너 중앙에서 오른쪽으로 고정 간격 배치
    const nameLeft = 22; // 컨테이너 중앙(20px)에서 2px 오른쪽
    const nameTop = 18; // 컨테이너 하단 근처 고정
    
    if (isRightEdge) {
      // 오른쪽 끝 도시는 왼쪽에 고정 간격 배치
      const nameRight = 22;
      return { right: `${nameRight}px`, top: `${nameTop}px` };
    } else {
      return { left: `${nameLeft}px`, top: `${nameTop}px` };
    }
  };

  const cityNamePosition = getCityNamePosition();

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
            : cityNamePosition
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
      {city.nationID && city.nationID > 0 && rgbColor && (
        <div
          className="city_bg"
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            width: '40px',
            height: '40px',
            background: `radial-gradient(circle, rgba(${rgbColor}, 1.0) 0%, rgba(${rgbColor}, 0.95) 20%, rgba(${rgbColor}, 0.8) 40%, rgba(${rgbColor}, 0.6) 60%, rgba(${rgbColor}, 0.3) 80%, transparent 100%)`,
            filter: 'blur(3px)',
            borderRadius: '50%',
            pointerEvents: 'none',
            transform: 'translate(-50%, -50%)',
            boxShadow: `0 0 10px rgba(${rgbColor}, 0.8), 0 0 20px rgba(${rgbColor}, 0.4)`,
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
