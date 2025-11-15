'use client';

import React from 'react';
import SammoBar from '../game/SammoBar';
import NationFlag from '../common/NationFlag';
import { getNPCColor } from '@/utils/getNPCColor';
import { isBrightColor } from '@/utils/isBrightColor';
import { adjustColorForText } from '@/types/colorSystem';
import styles from './CityBasicCard.module.css';
import type { ColorSystem } from '@/types/colorSystem';

interface CityBasicCardProps {
  city: {
    id: number;
    name: string;
    region?: number | string;
    nationInfo: {
      id: number;
      name: string;
      color: string;
    } | null;
    level: number;
    trust: number;
    pop: [number, number];
    agri: [number, number];
    comm: [number, number];
    secu: [number, number];
    def: [number, number];
    wall: [number, number];
    trade: number | null;
    officerList: Record<2 | 3 | 4, {
      officer_level: 2 | 3 | 4;
      no: number;
      name: string;
      npc: number;
    } | null>;
  };
  cityConstMap?: {
    region?: Record<number | string, string | { id?: number; name?: string; label?: string }>;
    level?: Record<number, string>;
  };
  colorSystem?: ColorSystem;
}

function CityBasicCard({ city, cityConstMap, colorSystem }: CityBasicCardProps) {
  // 공백지(재야)는 흰색, 국가 소속은 국가 색상
  const nationColor = (city.nationInfo?.id && city.nationInfo.id > 0) 
    ? (city.nationInfo.color || '#808080')
    : '#FFFFFF';
  
  // 밝은 색상이면 자동으로 어둡게 보정
  const displayColor = adjustColorForText(nationColor);
  const textColor = '#FFFFFF'; // 보정된 색상은 항상 어두우므로 흰색 글자
  
  // 속성 헤더 공통 스타일
  const labelStyle = {
    backgroundColor: colorSystem?.borderLight,
    color: colorSystem?.text,
    fontWeight: '500' as const,
  };
  
  // 지역명 가져오기
  const regionData = cityConstMap?.region?.[city.region ?? 0];
  const cityRegionText = typeof regionData === 'object' && regionData !== null
    ? (regionData.label || regionData.name || '지역')
    : typeof regionData === 'string'
    ? regionData
    : '지역';
  
  const levelData = cityConstMap?.level?.[city.level];
  const cityLevelText = typeof levelData === 'string'
    ? levelData
    : ['무', '향', '수', '진', '관', '이', '소', '중', '대', '특', '경'][city.level] || '';
  
  const tradeAltText = city.trade ? `${city.trade}%` : '상인 없음';
  const tradeBarPercent = city.trade ? (city.trade - 95) * 10 : 0;

  return (
    <div 
      className={`${styles.cityCardBasic} bg2`}
      style={{
        borderColor: colorSystem?.border,
        color: colorSystem?.text,
        backgroundColor: colorSystem?.pageBg,
      }}
    >
      <div
        className={styles.cityNamePanel}
        style={{
          color: textColor,
          backgroundColor: displayColor,
        }}
      >
        <div>
          【 {cityRegionText} | {cityLevelText} 】 
          <span 
            className={styles.clickable}
            onClick={() => window.location.href = `/city/${city.id}`}
            title="도시 상세 정보"
          >
            {city.name}
          </span>
        </div>
      </div>
      <div
        className={styles.nationNamePanel}
        style={{
          color: textColor,
          backgroundColor: nationColor,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
        }}
      >
        {city.nationInfo?.id ? (
          <>
            지배 국가 【 
            <NationFlag 
              nation={{
                name: city.nationInfo.name,
                color: city.nationInfo.color,
              }} 
              size={16} 
            />
             】
          </>
        ) : (
          '공 백 지'
        )}
      </div>
      <div className={`${styles.gPanel} ${styles.popPanel}`}>
        <div className={`${styles.gHead} bg1`} style={labelStyle}>주민</div>
        <div className={styles.gBody}>
          <SammoBar height={7} percent={(city.pop[0] / city.pop[1]) * 100} barColor={nationColor} />
          <div className={styles.cellText}>
            {city.pop[0].toLocaleString()} / {city.pop[1].toLocaleString()}
          </div>
        </div>
      </div>
      <div className={`${styles.gPanel} ${styles.trustPanel}`}>
        <div className={`${styles.gHead} bg1`} style={labelStyle}>민심</div>
        <div className={styles.gBody}>
          <SammoBar height={7} percent={city.trust} barColor={nationColor} />
          <div className={styles.cellText}>{city.trust.toLocaleString(undefined, { maximumFractionDigits: 1 })}</div>
        </div>
      </div>
      <div className={`${styles.gPanel} ${styles.agriPanel}`}>
        <div className={`${styles.gHead} bg1`} style={labelStyle}>농업</div>
        <div className={styles.gBody}>
          <SammoBar height={7} percent={(city.agri[0] / city.agri[1]) * 100} barColor={nationColor} />
          <div className={styles.cellText}>
            {city.agri[0].toLocaleString()} / {city.agri[1].toLocaleString()}
          </div>
        </div>
      </div>
      <div className={`${styles.gPanel} ${styles.commPanel}`}>
        <div className={`${styles.gHead} bg1`} style={labelStyle}>상업</div>
        <div className={styles.gBody}>
          <SammoBar height={7} percent={(city.comm[0] / city.comm[1]) * 100} barColor={nationColor} />
          <div className={styles.cellText}>
            {city.comm[0].toLocaleString()} / {city.comm[1].toLocaleString()}
          </div>
        </div>
      </div>
      <div className={`${styles.gPanel} ${styles.secuPanel}`}>
        <div className={`${styles.gHead} bg1`} style={labelStyle}>치안</div>
        <div className={styles.gBody}>
          <SammoBar height={7} percent={(city.secu[0] / city.secu[1]) * 100} barColor={nationColor} />
          <div className={styles.cellText}>
            {city.secu[0].toLocaleString()} / {city.secu[1].toLocaleString()}
          </div>
        </div>
      </div>
      <div className={`${styles.gPanel} ${styles.defPanel}`}>
        <div className={`${styles.gHead} bg1`} style={labelStyle}>수비</div>
        <div className={styles.gBody}>
          <SammoBar height={7} percent={(city.def[0] / city.def[1]) * 100} barColor={nationColor} />
          <div className={styles.cellText}>
            {city.def[0].toLocaleString()} / {city.def[1].toLocaleString()}
          </div>
        </div>
      </div>
      <div className={`${styles.gPanel} ${styles.wallPanel}`}>
        <div className={`${styles.gHead} bg1`} style={labelStyle}>성벽</div>
        <div className={styles.gBody}>
          <SammoBar height={7} percent={(city.wall[0] / city.wall[1]) * 100} barColor={nationColor} />
          <div className={styles.cellText}>
            {city.wall[0].toLocaleString()} / {city.wall[1].toLocaleString()}
          </div>
        </div>
      </div>
      <div className={`${styles.gPanel} ${styles.tradePanel}`}>
        <div className={`${styles.gHead} bg1`} style={labelStyle}>시세</div>
        <div className={styles.gBody}>
          <SammoBar height={7} percent={tradeBarPercent} altText={tradeAltText} barColor={nationColor} />
          <div className={styles.cellText}>{tradeAltText}</div>
        </div>
      </div>
      <div className={`${styles.gPanel} ${styles.officer4Panel}`}>
        <div className={`${styles.gHead} bg1`} style={labelStyle}>태수</div>
        <div className={`${styles.gBody} ${styles.cellTextOnly}`} style={{ color: getNPCColor(city.officerList[4]?.npc ?? 0) }}>
          {city.officerList[4] ? (
            <span 
              className={styles.clickable}
              onClick={() => window.location.href = `/general/${city.officerList[4]?.no || 0}`}
              title="장수 상세 정보"
            >
              {city.officerList[4]?.name}
            </span>
          ) : '-'}
        </div>
      </div>
      <div className={`${styles.gPanel} ${styles.officer3Panel}`}>
        <div className={`${styles.gHead} bg1`} style={labelStyle}>군사</div>
        <div className={`${styles.gBody} ${styles.cellTextOnly}`} style={{ color: getNPCColor(city.officerList[3]?.npc ?? 0) }}>
          {city.officerList[3] ? (
            <span 
              className={styles.clickable}
              onClick={() => window.location.href = `/general/${city.officerList[3]?.no || 0}`}
              title="장수 상세 정보"
            >
              {city.officerList[3]?.name}
            </span>
          ) : '-'}
        </div>
      </div>
      <div className={`${styles.gPanel} ${styles.officer2Panel}`}>
        <div className={`${styles.gHead} bg1`} style={labelStyle}>종사</div>
        <div className={`${styles.gBody} ${styles.cellTextOnly}`} style={{ color: getNPCColor(city.officerList[2]?.npc ?? 0) }}>
          {city.officerList[2] ? (
            <span 
              className={styles.clickable}
              onClick={() => window.location.href = `/general/${city.officerList[2]?.no || 0}`}
              title="장수 상세 정보"
            >
              {city.officerList[2]?.name}
            </span>
          ) : '-'}
        </div>
      </div>
    </div>
  );
}

export default React.memo(CityBasicCard, (prevProps, nextProps) => {
  // 깊은 비교로 불필요한 리렌더링 방지
  return (
    prevProps.city.id === nextProps.city.id &&
    prevProps.city.name === nextProps.city.name &&
    prevProps.city.level === nextProps.city.level &&
    prevProps.city.trust === nextProps.city.trust &&
    prevProps.city.pop[0] === nextProps.city.pop[0] &&
    prevProps.city.pop[1] === nextProps.city.pop[1] &&
    prevProps.city.nationInfo?.id === nextProps.city.nationInfo?.id &&
    prevProps.city.nationInfo?.name === nextProps.city.nationInfo?.name &&
    prevProps.city.nationInfo?.color === nextProps.city.nationInfo?.color
  );
});
