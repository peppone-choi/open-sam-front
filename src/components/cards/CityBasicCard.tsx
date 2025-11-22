'use client';

import React, { useMemo, useState } from 'react';
import SammoBar from '../game/SammoBar';
import NationFlag from '../common/NationFlag';
import { getNPCColor } from '@/utils/getNPCColor';
import { isBrightColor } from '@/utils/isBrightColor';
import styles from './CityBasicCard.module.css';
import type { ColorSystem } from '@/types/colorSystem';
import { getUnitDataFromStore } from '@/stores/unitStore';

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
      no?: number;
      name: string;
      npc: number;
    } | null>;
    defense?: {
      wall: [number, number];
      gate: [number, number];
      towerLevel?: number;
      repairRate?: number;
      lastDamageAt?: string;
      lastRepairAt?: string;
    } | null;
    garrison?: {
      totalTroops: number;
      stackCount: number;
      stacks: Array<{
        id: string;
        crewTypeId: number;
        crewTypeName?: string;
        troops: number;
        train: number;
        morale: number;
        updatedAt?: string;
      }>;
    };
  };
  cityConstMap?: {
    region?: Record<number | string, string | { id?: number; name?: string; label?: string }>;
    level?: Record<number, string>;
  };
  colorSystem?: ColorSystem;
}

function CityBasicCard({ city, cityConstMap, colorSystem }: CityBasicCardProps) {
  const [showGarrison, setShowGarrison] = useState(false);
  // 공백지(재야)는 흰색, 국가 소속은 국가 색상
  const nationColor = (city.nationInfo?.id && city.nationInfo.id > 0) 
    ? (city.nationInfo.color || '#808080')
    : '#FFFFFF';
  
  // 도시 이름 패널: 국가색을 그대로 사용
  const displayColor = nationColor;
  const cityTitleTextColor = isBrightColor(displayColor) ? '#111827' : '#FFFFFF';

  // 지배 국가 패널: 국가색을 그대로 배경으로 쓰되, 밝기에 따라 글자색 자동 선택
  const nationTextColor = isBrightColor(nationColor) ? '#000000' : '#FFFFFF';
  
  const defense = city.defense;
  const garrison = city.garrison;
  const unitConst = useMemo(() => getUnitDataFromStore(), []);

  const garrisonSummary = garrison
    ? `${garrison.totalTroops.toLocaleString()}명 · ${garrison.stackCount}개 부대`
    : null;

  const handleToggleGarrison = () => setShowGarrison((prev) => !prev);

  const getCrewTypeLabel = (stack: { crewTypeId: number; crewTypeName?: string }) => {
    if (stack.crewTypeName) return stack.crewTypeName;
    const lookup = unitConst?.[String(stack.crewTypeId)];
    return lookup?.name || `병종 ${stack.crewTypeId}`;
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
      className={styles.cityCardBasic}
      style={{
        borderColor: colorSystem?.border,
      }}
    >
      <div className={styles.headerSection}>
        <div
          className={styles.cityNamePanel}
          style={{
            color: cityTitleTextColor,
            backgroundColor: displayColor,
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
            <span style={{ fontSize: '0.75rem', opacity: 0.8, fontWeight: 'normal', marginBottom: '0.2rem' }}>
              {cityRegionText} | {cityLevelText}
            </span>
            <span 
              className={styles.clickable}
              onClick={() => window.location.href = `/city/${city.id}`}
              title="도시 상세 정보"
            >
              {city.name}
            </span>
          </div>
          {garrisonSummary && (
            <div className={styles.garrisonSummary}>
              <span>{garrisonSummary}</span>
              <button
                type="button"
                className={styles.toggleButton}
                onClick={handleToggleGarrison}
              >
                {showGarrison ? '부대 닫기' : '부대 열기'}
              </button>
            </div>
          )}
        </div>
        <div
          className={styles.nationNamePanel}
          style={{
            color: nationTextColor,
            backgroundColor: nationColor,
          }}
        >
          {city.nationInfo?.id ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <NationFlag 
                nation={{
                  name: city.nationInfo.name,
                  color: city.nationInfo.color,
                }} 
                size={20} 
              />
            </div>
          ) : (
            '공 백 지'
          )}
        </div>
      </div>

      <div className={styles.statsGrid}>
        <div className={styles.gPanel}>
          <div className={styles.gHead}>
            <span>주민</span>
            <span className={styles.statSubValue}>{((city.pop[0] / city.pop[1]) * 100).toFixed(1)}%</span>
          </div>
          <div className={styles.gBody}>
            <div className={styles.statValue}>
              {city.pop[0].toLocaleString()} <span className={styles.statSubValue}>/ {city.pop[1].toLocaleString()}</span>
            </div>
            <SammoBar height={7} percent={(city.pop[0] / city.pop[1]) * 100} barColor={nationColor} />
          </div>
        </div>

        <div className={styles.gPanel}>
          <div className={styles.gHead}>
            <span>민심</span>
          </div>
          <div className={styles.gBody}>
            <div className={styles.statValue}>{city.trust.toFixed(1)}</div>
            <SammoBar height={7} percent={city.trust} barColor={nationColor} />
          </div>
        </div>

        <div className={styles.gPanel}>
          <div className={styles.gHead}>
            <span>농업</span>
            <span className={styles.statSubValue}>{((city.agri[0] / city.agri[1]) * 100).toFixed(1)}%</span>
          </div>
          <div className={styles.gBody}>
            <div className={styles.statValue}>
              {city.agri[0].toLocaleString()} <span className={styles.statSubValue}>/ {city.agri[1].toLocaleString()}</span>
            </div>
            <SammoBar height={7} percent={(city.agri[0] / city.agri[1]) * 100} barColor={nationColor} />
          </div>
        </div>

        <div className={styles.gPanel}>
          <div className={styles.gHead}>
            <span>상업</span>
            <span className={styles.statSubValue}>{((city.comm[0] / city.comm[1]) * 100).toFixed(1)}%</span>
          </div>
          <div className={styles.gBody}>
            <div className={styles.statValue}>
              {city.comm[0].toLocaleString()} <span className={styles.statSubValue}>/ {city.comm[1].toLocaleString()}</span>
            </div>
            <SammoBar height={7} percent={(city.comm[0] / city.comm[1]) * 100} barColor={nationColor} />
          </div>
        </div>

        <div className={styles.gPanel}>
          <div className={styles.gHead}>
            <span>치안</span>
            <span className={styles.statSubValue}>{((city.secu[0] / city.secu[1]) * 100).toFixed(1)}%</span>
          </div>
          <div className={styles.gBody}>
            <div className={styles.statValue}>
              {city.secu[0].toLocaleString()} <span className={styles.statSubValue}>/ {city.secu[1].toLocaleString()}</span>
            </div>
            <SammoBar height={7} percent={(city.secu[0] / city.secu[1]) * 100} barColor={nationColor} />
          </div>
        </div>

        <div className={styles.gPanel}>
          <div className={styles.gHead}>
            <span>수비</span>
            <span className={styles.statSubValue}>{((city.def[0] / city.def[1]) * 100).toFixed(1)}%</span>
          </div>
          <div className={styles.gBody}>
            <div className={styles.statValue}>
              {city.def[0].toLocaleString()} <span className={styles.statSubValue}>/ {city.def[1].toLocaleString()}</span>
            </div>
            <SammoBar height={7} percent={(city.def[0] / city.def[1]) * 100} barColor={nationColor} />
          </div>
        </div>

        <div className={styles.gPanel}>
          <div className={styles.gHead}>
            <span>성벽</span>
            <span className={styles.statSubValue}>{((city.wall[0] / Math.max(city.wall[1], 1)) * 100).toFixed(1)}%</span>
          </div>
          <div className={styles.gBody}>
            <div className={styles.statValue}>
              {city.wall[0].toLocaleString()} <span className={styles.statSubValue}>/ {city.wall[1].toLocaleString()}</span>
            </div>
            <SammoBar height={7} percent={(city.wall[0] / Math.max(city.wall[1], 1)) * 100} barColor={nationColor} />
          </div>
        </div>

        <div className={styles.gPanel}>
          <div className={styles.gHead}>
            <span>성문</span>
            {defense?.gate && defense.gate[1] > 0 && (
              <span className={styles.statSubValue}>{((defense.gate[0] / Math.max(defense.gate[1], 1)) * 100).toFixed(1)}%</span>
            )}
          </div>
          <div className={styles.gBody}>
            {defense?.gate && defense.gate[1] > 0 ? (
              <>
                <div className={styles.statValue}>
                  {defense.gate[0].toLocaleString()} <span className={styles.statSubValue}>/ {defense.gate[1].toLocaleString()}</span>
                </div>
                <div className={styles.statSubValue} style={{ fontSize: '0.7rem', marginTop: '0.1rem' }}>
                  {defense.towerLevel ? `포탑 Lv.${defense.towerLevel}` : '포탑 없음'}
                </div>
                <SammoBar height={7} percent={(defense.gate[0] / Math.max(defense.gate[1], 1)) * 100} barColor={nationColor} />
              </>
            ) : (
              <div className={styles.statValue} style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.9rem' }}>문 없음</div>
            )}
          </div>
        </div>

        <div className={styles.gPanel}>
          <div className={styles.gHead}>
            <span>시세</span>
          </div>
          <div className={styles.gBody}>
            <div className={styles.statValue}>{tradeAltText}</div>
            <SammoBar height={7} percent={tradeBarPercent} altText={tradeAltText} barColor={nationColor} />
          </div>
        </div>

        {/* 관직 분리 */}
        <div className={styles.gPanel}>
          <div className={styles.gHead}>
            <span>태수</span>
          </div>
          <div className={styles.gBody}>
            <div className={styles.officerName} style={{ color: getNPCColor(city.officerList[4]?.npc ?? 0) }}>
              {city.officerList[4] ? (
                <span 
                  className={styles.clickable}
                  onClick={() => window.location.href = `/general/${city.officerList[4]?.no || 0}`}
                >
                  {city.officerList[4]?.name}
                </span>
              ) : '-'}
            </div>
          </div>
        </div>

        <div className={styles.gPanel}>
          <div className={styles.gHead}>
            <span>군사</span>
          </div>
          <div className={styles.gBody}>
            <div className={styles.officerName} style={{ color: getNPCColor(city.officerList[3]?.npc ?? 0) }}>
              {city.officerList[3] ? (
                <span 
                  className={styles.clickable}
                  onClick={() => window.location.href = `/general/${city.officerList[3]?.no || 0}`}
                >
                  {city.officerList[3]?.name}
                </span>
              ) : '-'}
            </div>
          </div>
        </div>

        <div className={styles.gPanel}>
          <div className={styles.gHead}>
            <span>종사</span>
          </div>
          <div className={styles.gBody}>
            <div className={styles.officerName} style={{ color: getNPCColor(city.officerList[2]?.npc ?? 0) }}>
              {city.officerList[2] ? (
                <span 
                  className={styles.clickable}
                  onClick={() => window.location.href = `/general/${city.officerList[2]?.no || 0}`}
                >
                  {city.officerList[2]?.name}
                </span>
              ) : '-'}
            </div>
          </div>
        </div>
      </div>

      {garrison && showGarrison && (
        <div className={styles.garrisonPanel}>
          <div className={styles.garrisonHeader}>
            <span>주둔군</span>
            <span style={{ fontSize: '0.8rem', fontWeight: 'normal', opacity: 0.8 }}>
              총 {garrison.totalTroops.toLocaleString()}명
            </span>
          </div>
          <div className={styles.garrisonBody}>
            {garrison.stacks.length > 0 ? (
              <div className={styles.garrisonList}>
                <div className={`${styles.garrisonRow} ${styles.headerRow}`}>
                  <span>병종</span>
                  <span>병력</span>
                  <span>훈련</span>
                  <span>사기</span>
                </div>
                {garrison.stacks.map((stack) => (
                  <div key={stack.id} className={styles.garrisonRow}>
                    <span>{getCrewTypeLabel(stack)}</span>
                    <span>{stack.troops.toLocaleString()}</span>
                    <span>{Math.round(stack.train).toLocaleString()}</span>
                    <span>{Math.round(stack.morale).toLocaleString()}</span>
                  </div>
                ))}
                {garrison.stackCount > garrison.stacks.length && (
                  <div style={{ textAlign: 'center', fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', marginTop: '0.5rem' }}>
                    + {garrison.stackCount - garrison.stacks.length}개 부대 더 있음
                  </div>
                )}
              </div>
            ) : (
              <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.5)', padding: '1rem' }}>
                주둔 병력이 없습니다.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default CityBasicCard;
