'use client';

import React, { useState } from 'react';
import Image from 'next/image';

// 유닛 ID -> 아이콘 매핑 (units.json 기반)
// 아이콘 이미지는 /assets/icons/{unitId}.png 형태로 저장됨
export const UNIT_IDS = {
  // 성벽
  CASTLE: 1000,
  
  // 보병 (FOOTMAN)
  MILITIA: 1100,        // 도민병
  SPEARMAN: 1101,       // 창민병
  CHEONGJU: 1102,       // 청주병
  DANYANG: 1103,        // 단양병
  HAMJIN: 1104,         // 함진영
  BAEKI: 1105,          // 백이병
  MUDANG: 1106,         // 무당비군
  DONGJU: 1107,         // 동주병
  CHEONGGEON: 1108,     // 청건병
  HAEBEON: 1109,        // 해번병
  HWANGGON: 1110,       // 황건역사
  GEUMGUN: 1111,        // 금군
  DEUNGGAP: 1112,       // 등갑병
  SANWOL: 1113,         // 산월병
  WAEGU: 1114,          // 왜구
  GAYA: 1115,           // 가야철검수
  SAMHAN: 1116,         // 삼한장창병

  // 궁병 (ARCHER)
  ARCHER: 1200,         // 궁병
  CROSSBOW: 1201,       // 노병
  WHITE_HORSE: 1202,    // 백마의종
  REPEATER: 1203,       // 연노병
  HOSA: 1204,           // 호사
  MAEKGUNG: 1205,       // 맥궁병
  EUPRU: 1206,          // 읍루독궁
  SEONDENG: 1207,       // 선등사

  // 기병 (CAVALRY)
  CAVALRY: 1300,        // 기병
  TIGER: 1301,          // 호표기
  OHWAN: 1302,          // 오환돌기
  BIUNG: 1303,          // 비웅군
  SEORYANG: 1304,       // 서량철기
  HYUNGNO: 1305,        // 흉노기병
  NAMMAN: 1306,         // 남만상병
  SEONBI: 1307,         // 선비기마대
  BUYEO: 1308,          // 부여기병
  GANGZOK: 1309,        // 강족약탈자

  // 특수병 (WIZARD)
  STRATEGIST: 1400,     // 책사
  TAEPYEONG: 1401,      // 태평도인
  ODUMI: 1402,          // 오두미도사
  DOKCHIM: 1403,        // 독전주술사

  // 공성병기 (SIEGE)
  CATAPULT: 1500,       // 벽력거
  RAM: 1501,            // 충차
  BALLISTA: 1502,       // 연노거
  FIRE: 1503,           // 화수
} as const;

export type UnitId = typeof UNIT_IDS[keyof typeof UNIT_IDS];

// 유닛 이름 매핑
export const UNIT_NAMES: Record<number, string> = {
  1000: '성벽',
  1100: '도민병', 1101: '창민병', 1102: '청주병', 1103: '단양병', 1104: '함진영',
  1105: '백이병', 1106: '무당비군', 1107: '동주병', 1108: '청건병', 1109: '해번병',
  1110: '황건역사', 1111: '금군', 1112: '등갑병', 1113: '산월병', 1114: '왜구',
  1115: '가야철검수', 1116: '삼한장창병',
  1200: '궁병', 1201: '노병', 1202: '백마의종', 1203: '연노병', 1204: '호사',
  1205: '맥궁병', 1206: '읍루독궁', 1207: '선등사',
  1300: '기병', 1301: '호표기', 1302: '오환돌기', 1303: '비웅군', 1304: '서량철기',
  1305: '흉노기병', 1306: '남만상병', 1307: '선비기마대', 1308: '부여기병', 1309: '강족약탈자',
  1400: '책사', 1401: '태평도인', 1402: '오두미도사', 1403: '독전주술사',
  1500: '벽력거', 1501: '충차', 1502: '연노거', 1503: '화수',
};

// 유닛 타입 (병종)
export type UnitType = 'CASTLE' | 'FOOTMAN' | 'ARCHER' | 'CAVALRY' | 'WIZARD' | 'SIEGE';

export function getUnitType(unitId: number): UnitType {
  if (unitId === 1000) return 'CASTLE';
  if (unitId >= 1100 && unitId <= 1116) return 'FOOTMAN';
  if (unitId >= 1200 && unitId <= 1207) return 'ARCHER';
  if (unitId >= 1300 && unitId <= 1309) return 'CAVALRY';
  if (unitId >= 1400 && unitId <= 1403) return 'WIZARD';
  if (unitId >= 1500 && unitId <= 1503) return 'SIEGE';
  return 'FOOTMAN';
}

export function getUnitName(unitId: number): string {
  return UNIT_NAMES[unitId] || `유닛 ${unitId}`;
}

interface UnitSpriteProps {
  unitId: number;
  size?: number;
  showName?: boolean;
  className?: string;
}

export default function UnitSprite({
  unitId,
  size = 48,
  showName = false,
  className = '',
}: UnitSpriteProps) {
  const [imageError, setImageError] = useState(false);
  const unitName = getUnitName(unitId);

  // 아이콘 이미지 경로
  const iconPath = `/assets/icons/${unitId}.png`;

  if (imageError) {
    // 이미지 로드 실패 시 텍스트로 표시
    return (
      <div
        className={className}
        style={{
          width: size,
          height: size,
          backgroundColor: '#333',
          borderRadius: '4px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#888',
          fontSize: size * 0.25,
          textAlign: 'center',
          padding: '4px',
        }}
        title={unitName}
      >
        {unitName.substring(0, 2)}
      </div>
    );
  }

  return (
    <div
      className={className}
      style={{
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '4px',
      }}
      title={unitName}
    >
      <div
        style={{
          width: size,
          height: size,
          position: 'relative',
          borderRadius: '4px',
          overflow: 'hidden',
        }}
      >
        <Image
          src={iconPath}
          alt={unitName}
          fill
          style={{ objectFit: 'contain' }}
          onError={() => setImageError(true)}
          draggable={false}
        />
      </div>
      {showName && (
        <span
          style={{
            fontSize: '11px',
            color: '#aaa',
            whiteSpace: 'nowrap',
          }}
        >
          {unitName}
        </span>
      )}
    </div>
  );
}
