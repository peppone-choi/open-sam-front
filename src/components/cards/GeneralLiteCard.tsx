'use client';

import React, { useMemo } from 'react';
import { Badge } from "@/components/ui/badge";
import { Tooltip } from "@/components/ui/tooltip";
import { formatInjury } from '@/utils/formatInjury';
import { calcInjury } from '@/utils/calcInjury';
import { formatGeneralTypeCall } from '@/utils/formatGeneralTypeCall';
import { isBrightColor } from '@/utils/isBrightColor';
import type { ColorSystem } from '@/types/colorSystem';
import type { ActionInfo, ItemInfoMap } from './GeneralBasicCard';

interface GeneralLiteCardProps {
  general: {
    no: number;
    name: string;
    officerLevel?: number;
    officerLevelText: string;
    injury?: number;
    leadership?: number;
    strength?: number;
    intel?: number;
    lbonus?: number;
    sbonus?: number;
    ibonus?: number;
    gold?: number;
    rice?: number;
    personal?: string;
    specialDomestic?: string;
    specialWar?: string;
    explevel?: number;
    age?: number;
    killturn?: number;
    refreshScoreTotal?: number;
    picture?: string;
    imgsvr?: number;
    [key: string]: any;
  };
  nation?: {
    id: number;
    name: string;
    color: string;
    [key: string]: any;
  };
  gameConst?: {
    chiefStatMin?: number;
    statGradeLevel?: number;
    retirementYear?: number;
  };
  colorSystem?: ColorSystem;
  /** 아이템/성격/특기 상세 정보 (tooltip용) */
  itemInfo?: ItemInfoMap;
}

// 벌점 포맷
function formatRefreshScore(score: number): string {
  if (score >= 1000) return 'SS';
  if (score >= 500) return 'S';
  if (score >= 200) return 'A';
  if (score >= 100) return 'B';
  if (score >= 50) return 'C';
  if (score >= 20) return 'D';
  return 'E';
}

// 아이콘 경로 가져오기
function getIconPath(imgsvr: number | undefined, picture: string | undefined): string {
  if (!picture) return '/default_portrait.png';
  if (imgsvr && imgsvr > 0) {
    return `/api/general/icon/${imgsvr}/${picture}`;
  }
  return `/image/general/${picture}.png`;
}

// 아이템 정보 조회
function getItemInfo(
  itemKey: string | undefined,
  infoMap: Record<string, ActionInfo> | undefined
): { name: string; info?: string } {
  if (!itemKey || itemKey === 'None') {
    return { name: '-' };
  }
  
  if (infoMap && infoMap[itemKey]) {
    return {
      name: infoMap[itemKey].name,
      info: infoMap[itemKey].info || undefined
    };
  }
  
  return { name: itemKey };
}

/**
 * GeneralLiteCard - 장수 정보 간소화 카드
 * GeneralBasicCard보다 적은 정보를 표시하는 컴팩트 버전
 * Vue의 GeneralLiteCard.vue와 동등한 기능 제공
 */
export default function GeneralLiteCard({ 
  general, 
  nation, 
  gameConst,
  colorSystem,
  itemInfo
}: GeneralLiteCardProps) {
  const nationColor = (nation && nation.id !== 0) ? (nation?.color ?? "#666") : "#FFFFFF";
  const textColor = isBrightColor(nationColor) ? '#000' : '#fff';

  const injuryInfo = formatInjury(general.injury || 0);

  const generalTypeCall = formatGeneralTypeCall(
    general.leadership || 50,
    general.strength || 50,
    general.intel || 50,
    gameConst
  );

  const retirementYear = gameConst?.retirementYear || 70;
  const age = general.age || 20;
  const ageColor = age < retirementYear * 0.75 
    ? (colorSystem?.success || 'limegreen') 
    : age < retirementYear 
      ? (colorSystem?.warning || 'yellow') 
      : (colorSystem?.error || 'red');

  // 성격/특기 정보
  const personalInfo = useMemo(() => 
    getItemInfo(general.personal, itemInfo?.personality),
    [general.personal, itemInfo?.personality]
  );
  const specialDomesticInfo = useMemo(() => 
    getItemInfo(general.specialDomestic, itemInfo?.specialDomestic),
    [general.specialDomestic, itemInfo?.specialDomestic]
  );
  const specialWarInfo = useMemo(() => 
    getItemInfo(general.specialWar, itemInfo?.specialWar),
    [general.specialWar, itemInfo?.specialWar]
  );

  return (
    <div 
      className="w-full flex flex-col bg-gray-900/60 backdrop-blur-md border border-white/10 rounded-lg shadow-lg overflow-hidden text-gray-200 font-sans text-sm"
      style={{ borderColor: colorSystem?.border }}
    >
      {/* 상단: 아이콘 + 기본 정보 */}
      <div className="flex">
        {/* 장수 아이콘 */}
        <div className="w-16 h-16 flex-shrink-0 bg-black/20">
          <img
            className="w-full h-full object-cover object-top"
            src={getIconPath(general.imgsvr, general.picture)}
            alt={general.name}
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/default_portrait.png';
            }}
          />
        </div>

        {/* 이름 + 정보 */}
        <div 
          className="flex-1 flex items-center justify-center px-3 py-2 font-bold text-center"
          style={{ backgroundColor: nationColor, color: textColor }}
        >
          <span 
            className="cursor-pointer transition-colors hover:opacity-80"
            onClick={() => window.location.href = `/general/${general.no}`}
            title="장수 상세 정보"
          >
            {general.name}
          </span>
          <span className="ml-2 font-normal text-xs opacity-90">
            【{general.officerLevelText} | {generalTypeCall} | 
            <span style={{ color: injuryInfo[1] }}>{injuryInfo[0]}</span>】
          </span>
        </div>
      </div>

      {/* 능력치 + 정보 그리드 */}
      <div className="grid grid-cols-6 gap-px bg-white/5 text-xs">
        {/* 능력치 행 */}
        <div className="bg-gray-800/80 p-1.5 text-center text-white/60">통솔</div>
        <div className="bg-gray-900/80 p-1.5 text-center">
          <span style={{ color: injuryInfo[1] }}>
            {calcInjury('leadership', {
              leadership: general.leadership ?? 0,
              strength: general.strength ?? 0,
              intel: general.intel ?? 0,
              injury: general.injury || 0
            })}
          </span>
          {typeof general.lbonus === 'number' && general.lbonus > 0 && (
            <span style={{ color: 'cyan' }}>+{general.lbonus}</span>
          )}
        </div>
        <div className="bg-gray-800/80 p-1.5 text-center text-white/60">무력</div>
        <div className="bg-gray-900/80 p-1.5 text-center" style={{ color: injuryInfo[1] }}>
          {calcInjury('strength', {
            leadership: general.leadership ?? 0,
            strength: general.strength ?? 0,
            intel: general.intel ?? 0,
            injury: general.injury || 0
          })}
        </div>
        <div className="bg-gray-800/80 p-1.5 text-center text-white/60">지력</div>
        <div className="bg-gray-900/80 p-1.5 text-center" style={{ color: injuryInfo[1] }}>
          {calcInjury('intel', {
            leadership: general.leadership ?? 0,
            strength: general.strength ?? 0,
            intel: general.intel ?? 0,
            injury: general.injury || 0
          })}
        </div>

        {/* 자금/군량/성격 행 */}
        <div className="bg-gray-800/80 p-1.5 text-center text-white/60">자금</div>
        <div className="bg-gray-900/80 p-1.5 text-center">{(general.gold || 0).toLocaleString()}</div>
        <div className="bg-gray-800/80 p-1.5 text-center text-white/60">군량</div>
        <div className="bg-gray-900/80 p-1.5 text-center">{(general.rice || 0).toLocaleString()}</div>
        <div className="bg-gray-800/80 p-1.5 text-center text-white/60">성격</div>
        <div className="bg-gray-900/80 p-1.5 text-center">
          <Tooltip content={personalInfo.info}>
            <span>{personalInfo.name}</span>
          </Tooltip>
        </div>

        {/* Lv/연령/특기 행 */}
        <div className="bg-gray-800/80 p-1.5 text-center text-white/60">Lv</div>
        <div className="bg-gray-900/80 p-1.5 text-center font-semibold" style={{ color: colorSystem?.success || '#4CAF50' }}>
          {general.explevel || 0}
        </div>
        <div className="bg-gray-800/80 p-1.5 text-center text-white/60">연령</div>
        <div className="bg-gray-900/80 p-1.5 text-center" style={{ color: ageColor }}>
          {age}세
        </div>
        <div className="bg-gray-800/80 p-1.5 text-center text-white/60">특기</div>
        <div className="bg-gray-900/80 p-1.5 text-center">
          <Tooltip content={specialDomesticInfo.info}>
            <span>{specialDomesticInfo.name}</span>
          </Tooltip>
          {' / '}
          <Tooltip content={specialWarInfo.info}>
            <span>{specialWarInfo.name}</span>
          </Tooltip>
        </div>

        {/* 삭턴/벌점 행 */}
        <div className="bg-gray-800/80 p-1.5 text-center text-white/60">삭턴</div>
        <div className="bg-gray-900/80 p-1.5 text-center">{general.killturn || 0} 턴</div>
        <div className="bg-gray-800/80 p-1.5 text-center text-white/60">벌점</div>
        <div className="col-span-3 bg-gray-900/80 p-1.5 text-center">
          {formatRefreshScore(general.refreshScoreTotal || 0)} {(general.refreshScoreTotal || 0).toLocaleString()}점
        </div>
      </div>
    </div>
  );
}

