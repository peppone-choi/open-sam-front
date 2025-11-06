'use client';

import React from 'react';
import SammoBar from '../game/SammoBar';
import { getNPCColor } from '@/utils/getNPCColor';
import { isBrightColor } from '@/utils/isBrightColor';
import styles from './CityBasicCard.module.css';

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
    region?: Record<number | string, string>;
    level?: Record<number, string>;
  };
}

function CityBasicCard({ city, cityConstMap }: CityBasicCardProps) {
  const nationColor = city.nationInfo?.color || '#808080';
  const textColor = isBrightColor(nationColor) ? 'black' : 'white';
  
  // 지역명 가져오기
  const cityRegionText = cityConstMap?.region?.[city.region ?? 0] || '지역';
  const cityLevelText = cityConstMap?.level?.[city.level] || ['무', '향', '수', '진', '관', '이', '소', '중', '대', '특', '경'][city.level] || '';
  
  const tradeAltText = city.trade ? `${city.trade}%` : '상인 없음';
  const tradeBarPercent = city.trade ? (city.trade - 95) * 10 : 0;

  return (
    <div className={`${styles.cityCardBasic} bg2`}>
      <div
        className={styles.cityNamePanel}
        style={{
          color: textColor,
          backgroundColor: nationColor,
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
        }}
      >
        {city.nationInfo?.id ? `지배 국가 【 ${city.nationInfo.name} 】` : '공 백 지'}
      </div>
      <div className={`${styles.gPanel} ${styles.popPanel}`}>
        <div className={`${styles.gHead} bg1`}>주민</div>
        <div className={styles.gBody}>
          <SammoBar height={7} percent={(city.pop[0] / city.pop[1]) * 100} />
          <div className={styles.cellText}>
            {city.pop[0].toLocaleString()} / {city.pop[1].toLocaleString()}
          </div>
        </div>
      </div>
      <div className={`${styles.gPanel} ${styles.trustPanel}`}>
        <div className={`${styles.gHead} bg1`}>민심</div>
        <div className={styles.gBody}>
          <SammoBar height={7} percent={city.trust} />
          <div className={styles.cellText}>{city.trust.toLocaleString(undefined, { maximumFractionDigits: 1 })}</div>
        </div>
      </div>
      <div className={`${styles.gPanel} ${styles.agriPanel}`}>
        <div className={`${styles.gHead} bg1`}>농업</div>
        <div className={styles.gBody}>
          <SammoBar height={7} percent={(city.agri[0] / city.agri[1]) * 100} />
          <div className={styles.cellText}>
            {city.agri[0].toLocaleString()} / {city.agri[1].toLocaleString()}
          </div>
        </div>
      </div>
      <div className={`${styles.gPanel} ${styles.commPanel}`}>
        <div className={`${styles.gHead} bg1`}>상업</div>
        <div className={styles.gBody}>
          <SammoBar height={7} percent={(city.comm[0] / city.comm[1]) * 100} />
          <div className={styles.cellText}>
            {city.comm[0].toLocaleString()} / {city.comm[1].toLocaleString()}
          </div>
        </div>
      </div>
      <div className={`${styles.gPanel} ${styles.secuPanel}`}>
        <div className={`${styles.gHead} bg1`}>치안</div>
        <div className={styles.gBody}>
          <SammoBar height={7} percent={(city.secu[0] / city.secu[1]) * 100} />
          <div className={styles.cellText}>
            {city.secu[0].toLocaleString()} / {city.secu[1].toLocaleString()}
          </div>
        </div>
      </div>
      <div className={`${styles.gPanel} ${styles.defPanel}`}>
        <div className={`${styles.gHead} bg1`}>수비</div>
        <div className={styles.gBody}>
          <SammoBar height={7} percent={(city.def[0] / city.def[1]) * 100} />
          <div className={styles.cellText}>
            {city.def[0].toLocaleString()} / {city.def[1].toLocaleString()}
          </div>
        </div>
      </div>
      <div className={`${styles.gPanel} ${styles.wallPanel}`}>
        <div className={`${styles.gHead} bg1`}>성벽</div>
        <div className={styles.gBody}>
          <SammoBar height={7} percent={(city.wall[0] / city.wall[1]) * 100} />
          <div className={styles.cellText}>
            {city.wall[0].toLocaleString()} / {city.wall[1].toLocaleString()}
          </div>
        </div>
      </div>
      <div className={`${styles.gPanel} ${styles.tradePanel}`}>
        <div className={`${styles.gHead} bg1`}>시세</div>
        <div className={styles.gBody}>
          <SammoBar height={7} percent={tradeBarPercent} altText={tradeAltText} />
          <div className={styles.cellText}>{tradeAltText}</div>
        </div>
      </div>
      <div className={`${styles.gPanel} ${styles.officer4Panel}`}>
        <div className={`${styles.gHead} bg1`}>태수</div>
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
        <div className={`${styles.gHead} bg1`}>군사</div>
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
        <div className={`${styles.gHead} bg1`}>종사</div>
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
