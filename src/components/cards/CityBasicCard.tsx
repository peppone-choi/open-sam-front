'use client';

import React, { useState } from 'react';
import SammoBar from '../game/SammoBar';
import NationFlag from '../common/NationFlag';
import { getNPCColor } from '@/utils/getNPCColor';
import { isBrightColor } from '@/utils/isBrightColor';
import type { ColorSystem } from '@/types/colorSystem';
import { getCrewTypeDisplayName } from '@/utils/unitTypeMapping';

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

  const garrisonSummary = garrison
    ? `${garrison.totalTroops.toLocaleString()}명 · ${garrison.stackCount}개 부대`
    : null;

  const handleToggleGarrison = () => setShowGarrison((prev) => !prev);

  const getCrewTypeLabel = (stack: { crewTypeId: number; crewTypeName?: string }) => {
    return getCrewTypeDisplayName(stack.crewTypeId, stack.crewTypeName);
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
      className="w-full h-auto min-h-[420px] flex flex-col bg-gray-900/60 backdrop-blur-md border border-white/10 rounded-xl shadow-2xl overflow-hidden text-gray-200 font-sans"
      style={{
        borderColor: colorSystem?.border,
      }}
    >
      <div className="grid grid-cols-2 border-b border-white/10">
        <div
          className="p-3 text-lg font-bold flex flex-col items-center justify-center bg-white/5 drop-shadow-sm"
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
              className="cursor-pointer transition-colors hover:text-white hover:shadow-[0_0_8px_rgba(255,255,255,0.5)]"
              onClick={() => window.location.href = `/city/${city.id}`}
              title="도시 상세 정보"
            >
              {city.name}
            </span>
          </div>
          {garrisonSummary && (
            <div className="mt-1.5 text-xs text-white/75 flex items-center gap-2 justify-center" style={{ color: cityTitleTextColor }}>
              <span className="opacity-80">{garrisonSummary}</span>
              <button
                type="button"
                className="bg-white/10 border border-white/20 text-[0.7rem] px-2 py-0.5 rounded-full cursor-pointer transition-all hover:bg-white/20 hover:border-white/35 active:scale-95"
                style={{ color: cityTitleTextColor, borderColor: 'rgba(255,255,255,0.3)' }}
                onClick={handleToggleGarrison}
              >
                {showGarrison ? '부대 닫기' : '부대 열기'}
              </button>
            </div>
          )}
        </div>
        <div
          className="p-3 text-lg font-bold flex items-center justify-center bg-white/5 drop-shadow-sm border-l border-white/10"
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

      <div className="grid grid-cols-[repeat(auto-fit,minmax(120px,1fr))] gap-2 p-3 pb-2 flex-1 overflow-y-auto">
        <div className="flex flex-col bg-white/5 rounded-lg p-2.5 border border-white/5 transition-all hover:bg-white/10 hover:border-white/10 hover:-translate-y-px min-h-[72px]">
          <div className="text-xs text-white/60 mb-1 font-semibold flex justify-between items-center">
            <span>주민</span>
            <span className="text-[0.7rem] text-white/55">{((city.pop[0] / city.pop[1]) * 100).toFixed(1)}%</span>
          </div>
          <div className="flex flex-col gap-0.5">
            <div className="text-[0.95rem] font-bold text-white">
              {city.pop[0].toLocaleString()} <span className="text-[0.7rem] text-white/55">/ {city.pop[1].toLocaleString()}</span>
            </div>
            <SammoBar height={7} percent={(city.pop[0] / city.pop[1]) * 100} barColor={nationColor} />
          </div>
        </div>

        <div className="flex flex-col bg-white/5 rounded-lg p-2.5 border border-white/5 transition-all hover:bg-white/10 hover:border-white/10 hover:-translate-y-px min-h-[72px]">
          <div className="text-xs text-white/60 mb-1 font-semibold flex justify-between items-center">
            <span>민심</span>
          </div>
          <div className="flex flex-col gap-0.5">
            <div className="text-[0.95rem] font-bold text-white">{city.trust.toFixed(1)}</div>
            <SammoBar height={7} percent={city.trust} barColor={nationColor} />
          </div>
        </div>

        <div className="flex flex-col bg-white/5 rounded-lg p-2.5 border border-white/5 transition-all hover:bg-white/10 hover:border-white/10 hover:-translate-y-px min-h-[72px]">
          <div className="text-xs text-white/60 mb-1 font-semibold flex justify-between items-center">
            <span>농업</span>
            <span className="text-[0.7rem] text-white/55">{((city.agri[0] / city.agri[1]) * 100).toFixed(1)}%</span>
          </div>
          <div className="flex flex-col gap-0.5">
            <div className="text-[0.95rem] font-bold text-white">
              {city.agri[0].toLocaleString()} <span className="text-[0.7rem] text-white/55">/ {city.agri[1].toLocaleString()}</span>
            </div>
            <SammoBar height={7} percent={(city.agri[0] / city.agri[1]) * 100} barColor={nationColor} />
          </div>
        </div>

        <div className="flex flex-col bg-white/5 rounded-lg p-2.5 border border-white/5 transition-all hover:bg-white/10 hover:border-white/10 hover:-translate-y-px min-h-[72px]">
          <div className="text-xs text-white/60 mb-1 font-semibold flex justify-between items-center">
            <span>상업</span>
            <span className="text-[0.7rem] text-white/55">{((city.comm[0] / city.comm[1]) * 100).toFixed(1)}%</span>
          </div>
          <div className="flex flex-col gap-0.5">
            <div className="text-[0.95rem] font-bold text-white">
              {city.comm[0].toLocaleString()} <span className="text-[0.7rem] text-white/55">/ {city.comm[1].toLocaleString()}</span>
            </div>
            <SammoBar height={7} percent={(city.comm[0] / city.comm[1]) * 100} barColor={nationColor} />
          </div>
        </div>

        <div className="flex flex-col bg-white/5 rounded-lg p-2.5 border border-white/5 transition-all hover:bg-white/10 hover:border-white/10 hover:-translate-y-px min-h-[72px]">
          <div className="text-xs text-white/60 mb-1 font-semibold flex justify-between items-center">
            <span>치안</span>
            <span className="text-[0.7rem] text-white/55">{((city.secu[0] / city.secu[1]) * 100).toFixed(1)}%</span>
          </div>
          <div className="flex flex-col gap-0.5">
            <div className="text-[0.95rem] font-bold text-white">
              {city.secu[0].toLocaleString()} <span className="text-[0.7rem] text-white/55">/ {city.secu[1].toLocaleString()}</span>
            </div>
            <SammoBar height={7} percent={(city.secu[0] / city.secu[1]) * 100} barColor={nationColor} />
          </div>
        </div>

        <div className="flex flex-col bg-white/5 rounded-lg p-2.5 border border-white/5 transition-all hover:bg-white/10 hover:border-white/10 hover:-translate-y-px min-h-[72px]">
          <div className="text-xs text-white/60 mb-1 font-semibold flex justify-between items-center">
            <span>수비</span>
            <span className="text-[0.7rem] text-white/55">{((city.def[0] / city.def[1]) * 100).toFixed(1)}%</span>
          </div>
          <div className="flex flex-col gap-0.5">
            <div className="text-[0.95rem] font-bold text-white">
              {city.def[0].toLocaleString()} <span className="text-[0.7rem] text-white/55">/ {city.def[1].toLocaleString()}</span>
            </div>
            <SammoBar height={7} percent={(city.def[0] / city.def[1]) * 100} barColor={nationColor} />
          </div>
        </div>

        <div className="flex flex-col bg-white/5 rounded-lg p-2.5 border border-white/5 transition-all hover:bg-white/10 hover:border-white/10 hover:-translate-y-px min-h-[72px]">
          <div className="text-xs text-white/60 mb-1 font-semibold flex justify-between items-center">
            <span>성벽</span>
            <span className="text-[0.7rem] text-white/55">{((city.wall[0] / Math.max(city.wall[1], 1)) * 100).toFixed(1)}%</span>
          </div>
          <div className="flex flex-col gap-0.5">
            <div className="text-[0.95rem] font-bold text-white">
              {city.wall[0].toLocaleString()} <span className="text-[0.7rem] text-white/55">/ {city.wall[1].toLocaleString()}</span>
            </div>
            <SammoBar height={7} percent={(city.wall[0] / Math.max(city.wall[1], 1)) * 100} barColor={nationColor} />
          </div>
        </div>

        <div className="flex flex-col bg-white/5 rounded-lg p-2.5 border border-white/5 transition-all hover:bg-white/10 hover:border-white/10 hover:-translate-y-px min-h-[72px]">
          <div className="text-xs text-white/60 mb-1 font-semibold flex justify-between items-center">
            <span>성문</span>
            {defense?.gate && defense.gate[1] > 0 && (
              <span className="text-[0.7rem] text-white/55">{((defense.gate[0] / Math.max(defense.gate[1], 1)) * 100).toFixed(1)}%</span>
            )}
          </div>
          <div className="flex flex-col gap-0.5">
            {defense?.gate && defense.gate[1] > 0 ? (
              <>
                <div className="text-[0.95rem] font-bold text-white">
                  {defense.gate[0].toLocaleString()} <span className="text-[0.7rem] text-white/55">/ {defense.gate[1].toLocaleString()}</span>
                </div>
                <div className="text-[0.7rem] text-white/55 mt-0.5">
                  {defense.towerLevel ? `포탑 Lv.${defense.towerLevel}` : '포탑 없음'}
                </div>
                <SammoBar height={7} percent={(defense.gate[0] / Math.max(defense.gate[1], 1)) * 100} barColor={nationColor} />
              </>
            ) : (
              <div className="text-[0.9rem] text-white/40">문 없음</div>
            )}
          </div>
        </div>

        <div className="flex flex-col bg-white/5 rounded-lg p-2.5 border border-white/5 transition-all hover:bg-white/10 hover:border-white/10 hover:-translate-y-px min-h-[72px]">
          <div className="text-xs text-white/60 mb-1 font-semibold flex justify-between items-center">
            <span>시세</span>
          </div>
          <div className="flex flex-col gap-0.5">
            <div className="text-[0.95rem] font-bold text-white">{tradeAltText}</div>
            <SammoBar height={7} percent={tradeBarPercent} altText={tradeAltText} barColor={nationColor} />
          </div>
        </div>

        {/* 관직 분리 */}
        <div className="flex flex-col bg-white/5 rounded-lg p-2.5 border border-white/5 transition-all hover:bg-white/10 hover:border-white/10 hover:-translate-y-px min-h-[72px]">
          <div className="text-xs text-white/60 mb-1 font-semibold flex justify-between items-center">
            <span>태수</span>
          </div>
          <div className="flex flex-col gap-0.5">
            <div className="text-base font-semibold text-white" style={{ color: getNPCColor(city.officerList[4]?.npc ?? 0) }}>
              {city.officerList[4] ? (
                <span 
                  className="cursor-pointer transition-colors hover:text-white hover:shadow-[0_0_8px_rgba(255,255,255,0.5)]"
                  onClick={() => window.location.href = `/general/${city.officerList[4]?.no || 0}`}
                >
                  {city.officerList[4]?.name}
                </span>
              ) : '-'}
            </div>
          </div>
        </div>

        <div className="flex flex-col bg-white/5 rounded-lg p-2.5 border border-white/5 transition-all hover:bg-white/10 hover:border-white/10 hover:-translate-y-px min-h-[72px]">
          <div className="text-xs text-white/60 mb-1 font-semibold flex justify-between items-center">
            <span>군사</span>
          </div>
          <div className="flex flex-col gap-0.5">
            <div className="text-base font-semibold text-white" style={{ color: getNPCColor(city.officerList[3]?.npc ?? 0) }}>
              {city.officerList[3] ? (
                <span 
                  className="cursor-pointer transition-colors hover:text-white hover:shadow-[0_0_8px_rgba(255,255,255,0.5)]"
                  onClick={() => window.location.href = `/general/${city.officerList[3]?.no || 0}`}
                >
                  {city.officerList[3]?.name}
                </span>
              ) : '-'}
            </div>
          </div>
        </div>

        <div className="flex flex-col bg-white/5 rounded-lg p-2.5 border border-white/5 transition-all hover:bg-white/10 hover:border-white/10 hover:-translate-y-px min-h-[72px]">
          <div className="text-xs text-white/60 mb-1 font-semibold flex justify-between items-center">
            <span>종사</span>
          </div>
          <div className="flex flex-col gap-0.5">
            <div className="text-base font-semibold text-white" style={{ color: getNPCColor(city.officerList[2]?.npc ?? 0) }}>
              {city.officerList[2] ? (
                <span 
                  className="cursor-pointer transition-colors hover:text-white hover:shadow-[0_0_8px_rgba(255,255,255,0.5)]"
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
        <div className="mx-3 mb-3 bg-black/25 rounded-lg border border-white/10 overflow-hidden shadow-inner">
          <div className="p-3 bg-white/5 border-b border-white/5 text-[0.95rem] font-bold text-white/90 flex justify-between items-center">
            <span>주둔군</span>
            <span style={{ fontSize: '0.8rem', fontWeight: 'normal', opacity: 0.8 }}>
              총 {garrison.totalTroops.toLocaleString()}명
            </span>
          </div>
          <div className="p-2">
            {garrison.stacks.length > 0 ? (
              <div className="flex flex-col gap-1">
                <div className="grid grid-cols-[2fr_1fr_1fr_1fr] sm:grid-cols-[2fr_1fr_1fr_1fr] gap-3 text-xs text-white/50 font-semibold uppercase tracking-wide p-1.5 border-b border-white/5 mb-1">
                  <span>병종</span>
                  <span className="text-right">병력</span>
                  <span className="text-right">훈련</span>
                  <span className="text-right hidden sm:block">사기</span>
                </div>
                {garrison.stacks.map((stack) => (
                  <div key={stack.id} className="grid grid-cols-[2fr_1fr_1fr_1fr] sm:grid-cols-[2fr_1fr_1fr_1fr] gap-3 text-sm p-2.5 rounded-md items-center transition-colors hover:bg-white/5">
                    <span className="text-left font-semibold text-white">{getCrewTypeLabel(stack)}</span>
                    <span className="text-right text-white/80">{stack.troops.toLocaleString()}</span>
                    <span className="text-right text-white/80">{Math.round(stack.train).toLocaleString()}</span>
                    <span className="text-right text-white/80 hidden sm:block">{Math.round(stack.morale).toLocaleString()}</span>
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
