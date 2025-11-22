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
      className={styles.nationCardBasic}
      style={{
        borderColor: colorSystem?.border,
      }}
    >
      <div
        className={styles.headerSection}
        style={{
          backgroundColor: displayColor,
        }}
      >
        <div className={styles.nationNamePanel} style={{ color: textColor }}>
        {hasNation ? (
          <span 
            className={styles.clickable}
            onClick={() => window.location.href = `/nation/${nation.id}`}
            title="국가 상세 정보"
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
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
                size={24} 
            />
          </span>
        ) : (
          <span>{nation.name}</span>
        )}
      </div>
      </div>

      <div className={styles.statsGrid}>
        {/* 성향 및 공지 (전체 너비) */}
        <div className={`${styles.gPanel} ${styles.fullWidthPanel}`}>
          <div className={styles.gHead}>성향</div>
          <div className={styles.typeText}>
        {hasNation && nation.type ? (
          <>
                <span style={{ fontWeight: 'bold', marginRight: '0.5rem' }}>{nation.type.name || '-'}</span>
                <span style={{ fontSize: '0.85rem', opacity: 0.8 }}>
                  {nation.type.pros && <span style={{ color: colorSystem?.success || '#4CAF50', marginRight: '0.5rem' }}>{nation.type.pros}</span>}
                  {nation.type.cons && <span style={{ color: colorSystem?.error || '#F44336' }}>{nation.type.cons}</span>}
                </span>
          </>
        ) : '-'}
      </div>
        </div>

        {/* 군주 */}
        <div className={styles.gPanel}>
          <div className={styles.gHead}>
            {hasNation ? formatOfficerLevelText(12, nation.level, cityConstMap?.officerTitles) : '군주'}
      </div>
          <div className={styles.gBody}>
            {hasNation && nation.topChiefs?.[12] ? (
            <span 
              className={styles.clickable}
              onClick={() => window.location.href = `/general/${nation.topChiefs?.[12]?.no || 0}`}
              style={{ color: nation.topChiefs[12].npc === 0 ? colorSystem?.text : (getNPCColor(nation.topChiefs[12].npc) || colorSystem?.info) }}
            >
              {nation.topChiefs[12].name}
            </span>
        ) : '-'}
      </div>
        </div>

        {/* 승상 */}
        <div className={styles.gPanel}>
          <div className={styles.gHead}>
            {hasNation ? formatOfficerLevelText(11, nation.level, cityConstMap?.officerTitles) : '승상'}
      </div>
          <div className={styles.gBody}>
            {hasNation && nation.topChiefs?.[11] ? (
            <span 
              className={styles.clickable}
              onClick={() => window.location.href = `/general/${nation.topChiefs?.[11]?.no || 0}`}
              style={{ color: nation.topChiefs[11].npc === 0 ? colorSystem?.text : (getNPCColor(nation.topChiefs[11].npc) || colorSystem?.info) }}
            >
              {nation.topChiefs[11].name}
            </span>
        ) : '-'}
      </div>
        </div>

        {/* 인구 */}
        <div className={styles.gPanel}>
          <div className={styles.gHead}>총 주민</div>
          <div className={styles.gBody}>
        {hasNation && nation.population 
              ? (nation.population.now || 0).toLocaleString()
              : '-'}
            <span className={styles.subValue}>
              / {hasNation && nation.population ? (nation.population.max || 0).toLocaleString() : '-'}
            </span>
          </div>
      </div>

        {/* 병사 */}
        <div className={styles.gPanel}>
          <div className={styles.gHead}>총 병사</div>
          <div className={styles.gBody}>
        {hasNation && nation.crew 
              ? (nation.crew.now || 0).toLocaleString()
              : '-'}
            <span className={styles.subValue}>
              / {hasNation && nation.crew ? (nation.crew.max || 0).toLocaleString() : '-'}
            </span>
          </div>
        </div>

        {/* 국고 */}
        <div className={styles.gPanel}>
          <div className={styles.gHead}>국고</div>
          <div className={styles.gBody}>
            {hasNation ? (nation.gold || 0).toLocaleString() : '-'}
          </div>
        </div>

        {/* 병량 */}
        <div className={styles.gPanel}>
          <div className={styles.gHead}>병량</div>
          <div className={styles.gBody}>
            {hasNation ? (nation.rice || 0).toLocaleString() : '-'}
          </div>
        </div>

        {/* 국력 */}
        <div className={styles.gPanel}>
          <div className={styles.gHead}>국력</div>
          <div className={styles.gBody}>
            {hasNation ? (typeof nation.power === 'number' ? nation.power.toLocaleString() : '-') : '-'}
          </div>
        </div>

        {/* 기술력 */}
        <div className={styles.gPanel}>
          <div className={styles.gHead}>기술력</div>
          <div className={styles.gBody}>
            {hasNation ? (
              <>
                Lv.{currentTechLevel}
                <span className={styles.subValue}>({Math.floor(tech).toLocaleString()})</span>
              </>
            ) : '-'}
      </div>
      </div>

        {/* 속령/장수 */}
        <div className={styles.gPanel}>
          <div className={styles.gHead}>속령 / 장수</div>
          <div className={styles.gBody}>
            {hasNation && nation.population ? (nation.population.cityCnt || 0).toLocaleString() : '-'}
            <span className={styles.subValue}> / </span>
            {hasNation && nation.crew ? (nation.crew.generalCnt || 0).toLocaleString() : '-'}
      </div>
      </div>

        {/* 세율/지급률 */}
        <div className={styles.gPanel}>
          <div className={styles.gHead}>세율 / 지급률</div>
          <div className={styles.gBody}>
            {hasNation ? `${nation.taxRate || 10}%` : '-'}
            <span className={styles.subValue}> / </span>
            {hasNation ? `${nation.bill || 0}%` : '-'}
      </div>
      </div>

        {/* 상태 정보 (전략/외교/임관/전쟁) - 2칸 차지 */}
        <div className={`${styles.gPanel} ${styles.spanTwoCols}`}>
          <div className={styles.gHead}>상태</div>
          <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span className={`${styles.statusIndicator} ${!strategicLimit ? styles.statusOn : styles.statusOff}`}></span>
              <span>전략 {strategicLimit ? `${strategicLimit}턴` : '가능'}</span>
      </div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span className={`${styles.statusIndicator} ${!nation.diplomaticLimit ? styles.statusOn : styles.statusOff}`}></span>
              <span>외교 {nation.diplomaticLimit ? `${nation.diplomaticLimit}턴` : '가능'}</span>
      </div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span className={`${styles.statusIndicator} ${!nation.prohibitScout ? styles.statusOn : styles.statusOff}`}></span>
              <span>임관 {nation.prohibitScout ? '금지' : '허가'}</span>
      </div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span className={`${styles.statusIndicator} ${!nation.prohibitWar ? styles.statusOn : styles.statusOff}`}></span>
              <span>전쟁 {nation.prohibitWar ? '금지' : '허가'}</span>
      </div>
      </div>
      </div>
      </div>
    </div>
  );
}
