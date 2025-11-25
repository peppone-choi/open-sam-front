'use client';

import React from 'react';
import NationFlag from '../common/NationFlag';
import { Badge } from "@/components/ui/badge";
import { getNPCColor } from '@/utils/getNPCColor';
import { formatOfficerLevelText } from '@/utils/formatOfficerLevelText';
import { isBrightColor } from '@/utils/isBrightColor';
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
    officerTitles?: Record<string | number, string | Record<string, string>>;
    nationLevels?: Record<string | number, string | { level: number; name: string }>;
    region?: Record<string | number, string | { id?: number; name?: string; label?: string }>;
    level?: Record<number, string>;
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
      className="w-full h-auto min-h-[420px] flex flex-col bg-gray-900/60 backdrop-blur-md border border-white/10 rounded-xl shadow-2xl overflow-hidden text-gray-200 font-sans"
      style={{
        borderColor: colorSystem?.border,
      }}
    >
      <div
        className="flex items-center justify-center p-3 bg-white/5 border-b border-white/10"
        style={{
          backgroundColor: displayColor,
        }}
      >
        <div className="text-lg font-bold flex items-center gap-3 drop-shadow-sm" style={{ color: textColor }}>
        {hasNation ? (
          <span 
            className="cursor-pointer transition-colors hover:text-white hover:shadow-[0_0_8px_rgba(255,255,255,0.5)] flex items-center gap-2"
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
                size={24} 
            />
          </span>
        ) : (
          <span>{nation.name}</span>
        )}
      </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-[repeat(auto-fit,minmax(130px,1fr))] gap-2.5 p-3 flex-1 overflow-y-auto">
        {/* 성향 및 공지 (전체 너비) */}
        <div className="col-span-full flex flex-col bg-white/5 rounded-lg p-2.5 border border-white/5 transition-all hover:bg-white/10 hover:border-white/10 hover:-translate-y-px">
          <div className="text-xs text-white/60 mb-1 font-semibold">성향</div>
          <div className="text-sm leading-snug flex flex-wrap gap-1">
        {hasNation && nation.type ? (
          <>
            {nation.type.name && <Badge variant="default">{nation.type.name}</Badge>}
            {nation.type.pros && <Badge variant="success">{nation.type.pros}</Badge>}
            {nation.type.cons && <Badge variant="destructive">{nation.type.cons}</Badge>}
          </>
        ) : '-'}
      </div>
        </div>

        {/* 군주 */}
        <div className="flex flex-col bg-white/5 rounded-lg p-2.5 border border-white/5 transition-all hover:bg-white/10 hover:border-white/10 hover:-translate-y-px">
          <div className="text-xs text-white/60 mb-1 font-semibold">
            {hasNation ? formatOfficerLevelText(12, nation.level, cityConstMap?.officerTitles) : '군주'}
      </div>
          <div className="text-base font-bold text-white flex items-center gap-1 flex-wrap">
            {hasNation && nation.topChiefs?.[12] ? (
            <span 
              className="cursor-pointer transition-colors hover:text-white hover:shadow-[0_0_8px_rgba(255,255,255,0.5)]"
              onClick={() => window.location.href = `/general/${nation.topChiefs?.[12]?.no || 0}`}
              style={{ color: nation.topChiefs[12].npc === 0 ? colorSystem?.text : (getNPCColor(nation.topChiefs[12].npc) || colorSystem?.info) }}
            >
              {nation.topChiefs[12].name}
            </span>
        ) : '-'}
      </div>
        </div>

        {/* 승상 */}
        <div className="flex flex-col bg-white/5 rounded-lg p-2.5 border border-white/5 transition-all hover:bg-white/10 hover:border-white/10 hover:-translate-y-px">
          <div className="text-xs text-white/60 mb-1 font-semibold">
            {hasNation ? formatOfficerLevelText(11, nation.level, cityConstMap?.officerTitles) : '승상'}
      </div>
          <div className="text-base font-bold text-white flex items-center gap-1 flex-wrap">
            {hasNation && nation.topChiefs?.[11] ? (
            <span 
              className="cursor-pointer transition-colors hover:text-white hover:shadow-[0_0_8px_rgba(255,255,255,0.5)]"
              onClick={() => window.location.href = `/general/${nation.topChiefs?.[11]?.no || 0}`}
              style={{ color: nation.topChiefs[11].npc === 0 ? colorSystem?.text : (getNPCColor(nation.topChiefs[11].npc) || colorSystem?.info) }}
            >
              {nation.topChiefs[11].name}
            </span>
        ) : '-'}
      </div>
        </div>

        {/* 인구 */}
        <div className="flex flex-col bg-white/5 rounded-lg p-2.5 border border-white/5 transition-all hover:bg-white/10 hover:border-white/10 hover:-translate-y-px">
          <div className="text-xs text-white/60 mb-1 font-semibold">총 주민</div>
          <div className="text-base font-bold text-white flex items-center gap-1 flex-wrap">
        {hasNation && nation.population 
              ? (nation.population.now || 0).toLocaleString()
              : '-'}
            <span className="text-xs text-white/55 font-normal">
              / {hasNation && nation.population ? (nation.population.max || 0).toLocaleString() : '-'}
            </span>
          </div>
      </div>

        {/* 병사 */}
        <div className="flex flex-col bg-white/5 rounded-lg p-2.5 border border-white/5 transition-all hover:bg-white/10 hover:border-white/10 hover:-translate-y-px">
          <div className="text-xs text-white/60 mb-1 font-semibold">총 병사</div>
          <div className="text-base font-bold text-white flex items-center gap-1 flex-wrap">
        {hasNation && nation.crew 
              ? (nation.crew.now || 0).toLocaleString()
              : '-'}
            <span className="text-xs text-white/55 font-normal">
              / {hasNation && nation.crew ? (nation.crew.max || 0).toLocaleString() : '-'}
            </span>
          </div>
        </div>

        {/* 국고 */}
        <div className="flex flex-col bg-white/5 rounded-lg p-2.5 border border-white/5 transition-all hover:bg-white/10 hover:border-white/10 hover:-translate-y-px">
          <div className="text-xs text-white/60 mb-1 font-semibold">국고</div>
          <div className="text-base font-bold text-white flex items-center gap-1 flex-wrap">
            {hasNation ? (nation.gold || 0).toLocaleString() : '-'}
          </div>
        </div>

        {/* 병량 */}
        <div className="flex flex-col bg-white/5 rounded-lg p-2.5 border border-white/5 transition-all hover:bg-white/10 hover:border-white/10 hover:-translate-y-px">
          <div className="text-xs text-white/60 mb-1 font-semibold">병량</div>
          <div className="text-base font-bold text-white flex items-center gap-1 flex-wrap">
            {hasNation ? (nation.rice || 0).toLocaleString() : '-'}
          </div>
        </div>

        {/* 국력 */}
        <div className="flex flex-col bg-white/5 rounded-lg p-2.5 border border-white/5 transition-all hover:bg-white/10 hover:border-white/10 hover:-translate-y-px">
          <div className="text-xs text-white/60 mb-1 font-semibold">국력</div>
          <div className="text-base font-bold text-white flex items-center gap-1 flex-wrap">
            {hasNation ? (typeof nation.power === 'number' ? nation.power.toLocaleString() : '-') : '-'}
          </div>
        </div>

        {/* 기술력 */}
        <div className="flex flex-col bg-white/5 rounded-lg p-2.5 border border-white/5 transition-all hover:bg-white/10 hover:border-white/10 hover:-translate-y-px">
          <div className="text-xs text-white/60 mb-1 font-semibold">기술력</div>
          <div className="text-base font-bold text-white flex items-center gap-1 flex-wrap">
            {hasNation ? (
              <>
                Lv.{currentTechLevel}
                <span className="text-xs text-white/55 font-normal">({Math.floor(tech).toLocaleString()})</span>
              </>
            ) : '-'}
      </div>
      </div>

        {/* 속령/장수 */}
        <div className="flex flex-col bg-white/5 rounded-lg p-2.5 border border-white/5 transition-all hover:bg-white/10 hover:border-white/10 hover:-translate-y-px">
          <div className="text-xs text-white/60 mb-1 font-semibold">속령 / 장수</div>
          <div className="text-base font-bold text-white flex items-center gap-1 flex-wrap">
            {hasNation && nation.population ? (nation.population.cityCnt || 0).toLocaleString() : '-'}
            <span className="text-xs text-white/55 font-normal"> / </span>
            {hasNation && nation.crew ? (nation.crew.generalCnt || 0).toLocaleString() : '-'}
      </div>
      </div>

        {/* 세율/지급률 */}
        <div className="flex flex-col bg-white/5 rounded-lg p-2.5 border border-white/5 transition-all hover:bg-white/10 hover:border-white/10 hover:-translate-y-px">
          <div className="text-xs text-white/60 mb-1 font-semibold">세율 / 지급률</div>
          <div className="text-base font-bold text-white flex items-center gap-1 flex-wrap">
            {hasNation ? `${nation.taxRate || 10}%` : '-'}
            <span className="text-xs text-white/55 font-normal"> / </span>
            {hasNation ? `${nation.bill || 0}%` : '-'}
      </div>
      </div>

        {/* 상태 정보 (전략/외교/임관/전쟁) - 2칸 차지 */}
        <div className="col-span-full sm:col-span-2 flex flex-col bg-white/5 rounded-lg p-2.5 border border-white/5 transition-all hover:bg-white/10 hover:border-white/10 hover:-translate-y-px">
          <div className="text-xs text-white/60 mb-1 font-semibold">상태</div>
          <div className="flex gap-2 flex-wrap">
            <Badge variant={!strategicLimit ? 'success' : 'destructive'}>
              전략 {strategicLimit ? `${strategicLimit}턴` : '가능'}
            </Badge>
            <Badge variant={!nation.diplomaticLimit ? 'success' : 'destructive'}>
              외교 {nation.diplomaticLimit ? `${nation.diplomaticLimit}턴` : '가능'}
            </Badge>
            <Badge variant={!nation.prohibitScout ? 'success' : 'destructive'}>
              임관 {nation.prohibitScout ? '금지' : '허가'}
            </Badge>
            <Badge variant={!nation.prohibitWar ? 'success' : 'destructive'}>
              전쟁 {nation.prohibitWar ? '금지' : '허가'}
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );
}
