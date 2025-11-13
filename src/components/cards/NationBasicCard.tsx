'use client';

import React from 'react';
import NationFlag from '../common/NationFlag';
import { getNPCColor } from '@/utils/getNPCColor';
import { formatOfficerLevelText } from '@/utils/formatOfficerLevelText';
import { isBrightColor } from '@/utils/isBrightColor';
import styles from './NationBasicCard.module.css';
import type { ColorSystem } from '@/types/colorSystem';

interface NationBasicCardProps {
  nation: {
    id: number;
    name: string;
    color: string;
    level?: number;
    type?: {
      raw?: string;
      name?: string;
      pros?: string;
      cons?: string;
    };
    topChiefs?: Record<number, {
      officer_level: number;
      no: number;
      name: string;
      npc: number;
    }>;
    population?: {
      cityCnt?: number;
      now?: number;
      max?: number;
    };
    crew?: {
      generalCnt?: number;
      now?: number;
      max?: number;
    };
    gold?: number;
    rice?: number;
    bill?: number | string;
    taxRate?: number;
    power?: number | Record<string, any>;
    tech?: number;
    strategicCmdLimit?: number | Record<string, any> | null;
    diplomaticLimit?: number;
    prohibitScout?: number;
    prohibitWar?: number;
    [key: string]: any;
  };
  global: {
    startyear?: number;
    year?: number;
    month?: number;
    [key: string]: any;
  };
  cityConstMap?: {
    officerTitles?: Record<string, Record<string, string>>;
    nationLevels?: Record<string, { level: number; name: string }>;
    [key: string]: any;
  };
  colorSystem?: ColorSystem;
}

export default function NationBasicCard({ nation, global, cityConstMap, colorSystem }: NationBasicCardProps) {
  const hasNation = nation.id && nation.id !== 0;
  // 재야는 흰색, 국가는 국가 색상
  const displayColor = hasNation ? nation.color : '#FFFFFF';
  const textColor = isBrightColor(displayColor) ? 'black' : 'white';
  
  // 속성 헤더 공통 스타일
  const labelStyle = {
    backgroundColor: colorSystem?.borderLight,
    color: colorSystem?.text,
    fontWeight: '500' as const,
  };

  // 기술력 계산 (간단한 버전)
  const tech = nation.tech || 0;
  const currentTechLevel = Math.floor(tech / 1000) || 0; // 임시 계산

  // 전략 명령 제한
  const strategicLimit = typeof nation.strategicCmdLimit === 'number' 
    ? nation.strategicCmdLimit 
    : typeof nation.strategicCmdLimit === 'object' && nation.strategicCmdLimit !== null
    ? (nation.strategicCmdLimit.id || nation.strategicCmdLimit.value || Object.keys(nation.strategicCmdLimit).length > 0 ? 1 : 0)
    : 0;

  return (
    <div 
      className={`${styles.nationCardBasic} bg2`}
      style={{
        borderColor: colorSystem?.border,
        color: colorSystem?.text,
        backgroundColor: colorSystem?.pageBg,
      }}
    >
      <div
        className={`${styles.name} ${styles.tbTitle}`}
        style={{
          backgroundColor: displayColor,
          color: textColor,
          fontWeight: 'bold',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
        }}
      >
        {hasNation ? (
          <span 
            className={styles.clickable}
            onClick={() => window.location.href = `/nation/${nation.id}`}
            title="국가 상세 정보"
          >
            <NationFlag 
              nation={{
                name: nation.name,
                color: nation.color,
                flagImage: nation.flagImage,
                flagTextColor: nation.flagTextColor,
                flagBgColor: nation.flagBgColor,
                flagBorderColor: nation.flagBorderColor,
              }} 
              size={20} 
            />
          </span>
        ) : (
          <span>{nation.name}</span>
        )}
      </div>
      <div className={`${styles.typeHead} ${styles.tbHead} bg1`} style={labelStyle}>성향</div>
      <div className={`${styles.typeBody} ${styles.tbBody}`}>
        {hasNation && nation.type ? (
          <>
            {nation.type.name || '-'}
            {(nation.type.pros || nation.type.cons) && ' ('}
            {nation.type.pros && <span style={{ color: colorSystem?.success || 'cyan' }}>{nation.type.pros}</span>}
            {nation.type.pros && nation.type.cons && ' / '}
            {nation.type.cons && <span style={{ color: colorSystem?.error || 'red' }}>{nation.type.cons}</span>}
            {(nation.type.pros || nation.type.cons) && ')'}
          </>
        ) : '-'}
      </div>
      <div className={`${styles.c12Head} ${styles.tbHead} bg1`} style={labelStyle}>
        {hasNation ? formatOfficerLevelText(12, nation.level, cityConstMap?.officerTitles) : '-'}
      </div>
      <div className={`${styles.c12Body} ${styles.tbBody}`}>
        {hasNation ? (
          nation.topChiefs?.[12] ? (
            <span 
              className={styles.clickable}
              onClick={() => window.location.href = `/general/${nation.topChiefs?.[12]?.no || 0}`}
              title="장수 상세 정보"
              style={{ color: nation.topChiefs[12].npc === 0 ? colorSystem?.text : (getNPCColor(nation.topChiefs[12].npc) || colorSystem?.info) }}
            >
              {nation.topChiefs[12].name}
            </span>
          ) : '-'
        ) : '-'}
      </div>
      <div className={`${styles.c11Head} ${styles.tbHead} bg1`} style={labelStyle}>
        {hasNation ? formatOfficerLevelText(11, nation.level, cityConstMap?.officerTitles) : '-'}
      </div>
      <div className={`${styles.c11Body} ${styles.tbBody}`}>
        {hasNation ? (
          nation.topChiefs?.[11] ? (
            <span 
              className={styles.clickable}
              onClick={() => window.location.href = `/general/${nation.topChiefs?.[11]?.no || 0}`}
              title="장수 상세 정보"
              style={{ color: nation.topChiefs[11].npc === 0 ? colorSystem?.text : (getNPCColor(nation.topChiefs[11].npc) || colorSystem?.info) }}
            >
              {nation.topChiefs[11].name}
            </span>
          ) : '-'
        ) : '-'}
      </div>
      <div className={`${styles.popHead} ${styles.tbHead} bg1`} style={labelStyle}>총 주민</div>
      <div className={`${styles.popBody} ${styles.tbBody}`}>
        {hasNation && nation.population 
          ? `${(nation.population.now || 0).toLocaleString()} / ${(nation.population.max || 0).toLocaleString()}`
          : '해당 없음'}
      </div>
      <div className={`${styles.crewHead} ${styles.tbHead} bg1`} style={labelStyle}>총 병사</div>
      <div className={`${styles.crewBody} ${styles.tbBody}`}>
        {hasNation && nation.crew 
          ? `${(nation.crew.now || 0).toLocaleString()} / ${(nation.crew.max || 0).toLocaleString()}`
          : '해당 없음'}
      </div>
      <div className={`${styles.goldHead} ${styles.tbHead} bg1`} style={labelStyle}>국고</div>
      <div className={`${styles.goldBody} ${styles.tbBody}`}>
        {hasNation ? (nation.gold || 0).toLocaleString() : '해당 없음'}
      </div>
      <div className={`${styles.riceHead} ${styles.tbHead} bg1`} style={labelStyle}>병량</div>
      <div className={`${styles.riceBody} ${styles.tbBody}`}>
        {hasNation ? (nation.rice || 0).toLocaleString() : '해당 없음'}
      </div>
      <div className={`${styles.billHead} ${styles.tbHead} bg1`} style={labelStyle}>지급률</div>
      <div className={`${styles.billBody} ${styles.tbBody}`}>
        {hasNation ? `${nation.bill || 0}%` : '해당 없음'}
      </div>
      <div className={`${styles.taxRateHead} ${styles.tbHead} bg1`} style={labelStyle}>세율</div>
      <div className={`${styles.taxRateBody} ${styles.tbBody}`}>
        {hasNation ? `${nation.taxRate || 10}%` : '해당 없음'}
      </div>
      <div className={`${styles.cityCntHead} ${styles.tbHead} bg1`} style={labelStyle}>속령</div>
      <div className={`${styles.cityCntBody} ${styles.tbBody}`}>
        {hasNation && nation.population ? (nation.population.cityCnt || 0).toLocaleString() : '해당 없음'}
      </div>
      <div className={`${styles.genCntHead} ${styles.tbHead} bg1`} style={labelStyle}>장수</div>
      <div className={`${styles.genCntBody} ${styles.tbBody}`}>
        {hasNation && nation.crew ? (nation.crew.generalCnt || 0).toLocaleString() : '해당 없음'}
      </div>
      <div className={`${styles.powerHead} ${styles.tbHead} bg1`} style={labelStyle}>국력</div>
      <div className={`${styles.powerBody} ${styles.tbBody}`}>
        {hasNation ? (typeof nation.power === 'number' ? nation.power.toLocaleString() : '-') : '해당 없음'}
      </div>
      <div className={`${styles.techHead} ${styles.tbHead} bg1`} style={labelStyle}>기술력</div>
      <div className={`${styles.techBody} ${styles.tbBody}`}>
        {hasNation ? `${currentTechLevel}등급 / ${Math.floor(tech).toLocaleString()}` : '해당 없음'}
      </div>
      <div className={`${styles.strategicClgHead} ${styles.tbHead} bg1`} style={labelStyle}>전략</div>
      <div className={`${styles.strategicClgBody} ${styles.tbBody}`}>
        {hasNation ? (
          strategicLimit ? (
            <span style={{ color: colorSystem?.error || 'red' }}>{String(strategicLimit)}턴</span>
          ) : (
            <span style={{ color: colorSystem?.success || 'limegreen' }}>가능</span>
          )
        ) : '해당 없음'}
      </div>
      <div className={`${styles.diplomaticClgHead} ${styles.tbHead} bg1`} style={labelStyle}>외교</div>
      <div className={`${styles.diplomaticClgBody} ${styles.tbBody}`}>
        {hasNation ? (
          nation.diplomaticLimit ? (
            <span style={{ color: colorSystem?.error || 'red' }}>{String(nation.diplomaticLimit)}턴</span>
          ) : (
            <span style={{ color: colorSystem?.success || 'limegreen' }}>가능</span>
          )
        ) : '해당 없음'}
      </div>
      <div className={`${styles.prohibitScoutHead} ${styles.tbHead} bg1`} style={labelStyle}>임관</div>
      <div className={`${styles.prohibitScoutBody} ${styles.tbBody}`}>
        {hasNation ? (
          nation.prohibitScout ? (
            <span style={{ color: colorSystem?.error || 'red' }}>금지</span>
          ) : (
            <span style={{ color: colorSystem?.success || 'limegreen' }}>허가</span>
          )
        ) : '해당 없음'}
      </div>
      <div className={`${styles.prohibitWarHead} ${styles.tbHead} bg1`} style={labelStyle}>전쟁</div>
      <div className={`${styles.prohibitWarBody} ${styles.tbBody}`}>
        {hasNation ? (
          nation.prohibitWar ? (
            <span style={{ color: colorSystem?.error || 'red' }}>금지</span>
          ) : (
            <span style={{ color: colorSystem?.success || 'limegreen' }}>허가</span>
          )
        ) : '해당 없음'}
      </div>
    </div>
  );
}
