'use client';

import React, { useMemo, useState } from 'react';
import SammoBar from '../game/SammoBar';

import NationFlag from '../common/NationFlag';
import { Badge } from "@/components/ui/badge";
import { Tooltip } from "@/components/ui/tooltip";
import { formatInjury } from '@/utils/formatInjury';
import { calcInjury } from '@/utils/calcInjury';
import { formatGeneralTypeCall } from '@/utils/formatGeneralTypeCall';
import { TroopIconDisplay } from '../common/TroopIconDisplay';
import type { ColorSystem } from '@/types/colorSystem';
import { getCrewTypeDisplayName } from '@/utils/unitTypeMapping';
import { useUnitConst } from '@/hooks/useUnitConst';

/** 아이템/특기 등의 상세 정보 타입 (Vue의 GameIActionInfo 대응) */
export interface ActionInfo {
  value: string;
  name: string;
  info?: string;
}

/** 아이템 정보 맵 타입 */
export interface ItemInfoMap {
  item?: Record<string, ActionInfo>;
  crewtype?: Record<string, ActionInfo>;
  personality?: Record<string, ActionInfo>;
  specialDomestic?: Record<string, ActionInfo>;
  specialWar?: Record<string, ActionInfo>;
}

interface GeneralBasicCardProps {
  general: {
    no: number;
    name: string;
    officerLevel: number;
    officerLevelText: string;
    injury?: number;
    leadership?: number;
    strength?: number;
    intel?: number;
    politics?: number;
    charm?: number;
    leadership_exp?: number;
    strength_exp?: number;
    intel_exp?: number;
    politics_exp?: number;
    charm_exp?: number;
    lbonus?: number;
    sbonus?: number;
    ibonus?: number;
    pbonus?: number;
    cbonus?: number;
    officer_city?: number;
    turntime?: string | Date;
    horse?: string;
    weapon?: string;
    book?: string;
    item?: string;
    gold?: number;
    rice?: number;
    crewtype?: string | number | { id: number; label: string };
    crew?: number;
    personal?: string;
    train?: number;
    atmos?: number;
    specialDomestic?: string;
    specialWar?: string;
    /** 내정 특기 습득 가능 연령 */
    specage?: number;
    /** 전투 특기 습득 가능 연령 */
    specage2?: number;
    explevel?: number;
    experience?: number;
    age?: number;
    city?: number;
    defence_train?: number;
    killturn?: number;
    troop?: number;
    refreshScoreTotal?: number;
    refreshScore?: number;
    picture?: string;
    imgsvr?: number;
    unitStacks?: {
      totalTroops?: number;
      stackCount?: number;
      averageTrain?: number;
      averageMorale?: number;
      stacks: Array<{
        id: string;
        crewTypeId: number;
        crewTypeName?: string;
        unitSize?: number;
        stackCount?: number;
        troops: number;
        train: number;
        morale: number;
        updatedAt?: string;
      }>;
    } | null;
    [key: string]: any;
  };
  nation?: {
    id: number;
    name: string;
    color: string;
    level?: number;
    [key: string]: any;
  };
  troopInfo?: {
    leader: {
      city: number;
      reservedCommand?: any;
    };
    name: string;
  } | number | string | null;
  turnTerm?: number;
  /** 마지막 턴 실행 시간 (서버 시간 기준) - Vue와 동일한 정확한 계산을 위해 */
  lastExecuted?: Date;
  gameConst?: {
    chiefStatMin?: number;
    statGradeLevel?: number;
    upgradeLimit?: number;
    retirementYear?: number;
  };
  cityConst?: Record<number, { name: string }>;
  colorSystem?: ColorSystem;
  /** 아이템/병종/성격/특기 상세 정보 (tooltip용) */
  itemInfo?: ItemInfoMap;
}

// 경험치 임계값 (기본값)
const STAT_UP_THRESHOLD = 1000;

// 다음 레벨 경험치 계산 (간단 버전)
function nextExpLevelRemain(experience: number, explevel: number): [number, number] {
  const nextLevelExp = (explevel + 1) * 1000;
  const remain = nextLevelExp - experience;
  return [remain > 0 ? remain : 0, nextLevelExp - (explevel * 1000)];
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

// 아이템 이름 가져오기 (간단 버전)
function getItemName(item: string | undefined | any): string {
  if (!item || item === 'None') return '-';
  // 객체인 경우 (예: {id, name, label} 구조)
  if (typeof item === 'object' && item !== null) {
    if ('label' in item && item.label) return String(item.label);
    if ('name' in item && item.name) return String(item.name);
    return '-';
  }
  return String(item);
}

/**
 * 아이템 정보 조회 (이름 + tooltip 정보)
 * Vue의 gameConstStore.iActionInfo 동작을 대체
 */
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
  
  return { name: getItemName(itemKey) };
}

/**
 * 특기 정보 조회 (특기가 없으면 습득 가능 연령 표시)
 * Vue의 specialDomestic/specialWar 처리 로직 대체
 */
function getSpecialInfo(
  specialKey: string | undefined,
  age: number,
  specage: number | undefined,
  infoMap: Record<string, ActionInfo> | undefined
): { name: string; info?: string } {
  if (!specialKey || specialKey === 'None') {
    // 특기가 없으면 습득 가능 연령 표시 (Vue 동작과 동일)
    const targetAge = Math.max(age + 1, specage || 0);
    return { name: `${targetAge}세`, info: '특기 습득 가능 연령' };
  }
  
  if (infoMap && infoMap[specialKey]) {
    return {
      name: infoMap[specialKey].name,
      info: infoMap[specialKey].info || undefined
    };
  }
  
  return { name: getItemName(specialKey) };
}

function getCrewtypeId(crewtype: GeneralBasicCardProps['general']['crewtype']): number | null {
  if (!crewtype || crewtype === 'None') return null;
  if (typeof crewtype === 'object' && crewtype !== null) {
    return typeof crewtype.id === 'number' ? crewtype.id : Number(crewtype.id) || null;
  }
  if (typeof crewtype === 'string') {
    const parsed = Number(crewtype);
    return Number.isFinite(parsed) ? parsed : null;
  }
  if (typeof crewtype === 'number') {
    return crewtype;
  }
  return null;
}

function formatCrewtypeLabel(
  crewtype: GeneralBasicCardProps['general']['crewtype'],
  unitConst?: Record<string, { name?: string }>,
  extraFallbackName?: string
): string {
  if (!crewtype || crewtype === 'None') {
    return '미편성';
  }

  const crewtypeId = getCrewtypeId(crewtype);
  const fallbackLabel = typeof crewtype === 'object' && crewtype !== null
    ? (('label' in crewtype && crewtype.label) ? String(crewtype.label) : ('name' in crewtype && crewtype.name ? String(crewtype.name) : undefined))
    : undefined;
  const combinedFallback = fallbackLabel ?? extraFallbackName;

  if (crewtypeId !== null && crewtypeId !== undefined) {
    const matchedName = unitConst?.[String(crewtypeId)]?.name;
    if (matchedName) {
      return matchedName;
    }
    return getCrewTypeDisplayName(crewtypeId, combinedFallback);
  }

  if (combinedFallback) {
    return combinedFallback;
  }

  return getItemName(crewtype);
}

function resolveStackLabel(
  crewTypeId: number,
  fallbackName?: string,
  unitConst?: Record<string, { name?: string }>
) {
  const matchedName = unitConst?.[String(crewTypeId)]?.name;
  if (matchedName) {
    return matchedName;
  }
  return getCrewTypeDisplayName(crewTypeId, fallbackName);
}

// 아이콘 경로 가져오기
function getIconPath(imgsvr: number, picture: string): string {
  if (!picture) return '';
  if (imgsvr && imgsvr > 0) {
    return `/api/general/icon/${imgsvr}/${picture}`;
  }
  return `/image/general/${picture}.png`;
}

export default function GeneralBasicCard({ 
  general, 
  nation, 
  troopInfo,
  turnTerm = 60,
  lastExecuted,
  gameConst,
  cityConst,
  colorSystem,
  itemInfo
}: GeneralBasicCardProps) {
  const [showStacks, setShowStacks] = useState(false);
  const normalizedTroopInfo = useMemo(() => {
    if (troopInfo && typeof troopInfo === 'object' && 'name' in troopInfo) {
      return troopInfo as { name: string; leader?: { city?: number; reservedCommand?: any[] } };
    }
    return null;
  }, [troopInfo]);
  const fallbackTroopName = useMemo(() => {
    if (!troopInfo) return null;
    if (typeof troopInfo === 'string') return troopInfo;
    if (typeof troopInfo === 'number') {
      return troopInfo > 0 ? `부대 ${troopInfo}` : null;
    }
    if (typeof troopInfo === 'object' && troopInfo !== null && 'name' in troopInfo) {
      return (troopInfo as any).name;
    }
    return null;
  }, [troopInfo]);
  const troopLeaderInfo = normalizedTroopInfo?.leader;
  const troopLeaderCity = troopLeaderInfo?.city;
  const troopReserved = Array.isArray(troopLeaderInfo?.reservedCommand) ? troopLeaderInfo!.reservedCommand : null;
  const firstReservedCommand = troopReserved?.[0];
  const nationColor = (nation && nation.id !== 0) ? (nation?.color ?? "#666") : "#FFFFFF";
  const displayColor = nationColor;

  const injuryInfo = formatInjury(general.injury || 0);

  const generalTypeCall = formatGeneralTypeCall(
    general.leadership || 50,
    general.strength || 50,
    general.intel || 50,
    gameConst
  );

  const statUpThreshold = gameConst?.upgradeLimit || STAT_UP_THRESHOLD;
  const retirementYear = gameConst?.retirementYear || 70;
  const age = general.age || 20;
  const ageColor = age < retirementYear * 0.75 
    ? (colorSystem?.success || 'limegreen') 
    : age < retirementYear 
      ? (colorSystem?.warning || 'yellow') 
      : (colorSystem?.error || 'red');

  // Vue와 동일한 nextExecuteMinute 계산 로직
  // lastExecuted가 있으면 서버 시간 기준으로 정확히 계산
  const nextExecuteMinute = useMemo(() => {
    if (!general.turntime) return 0;
    
    let turnTime: Date;
    if (typeof general.turntime === 'string') {
      // "YYYY-MM-DD HH:MM:SS" 형식 파싱
      turnTime = new Date(general.turntime.replace(' ', 'T'));
      if (isNaN(turnTime.getTime())) {
        turnTime = new Date(general.turntime);
      }
    } else if (general.turntime instanceof Date) {
      turnTime = general.turntime;
    } else {
      return 0;
    }
    
    // Vue 로직: lastExecuted가 있으면 서버 시간 기준으로 계산
    if (lastExecuted) {
      if (turnTime.getTime() < lastExecuted.getTime()) {
        // turntime이 lastExecuted보다 이전이면 turnTerm만큼 더함
        turnTime = new Date(turnTime.getTime() + turnTerm * 60000);
      }
      const remainingMs = turnTime.getTime() - lastExecuted.getTime();
      return Math.max(0, Math.min(999, Math.floor(remainingMs / 60000)));
    }
    
    // lastExecuted가 없으면 클라이언트 시간 기준으로 계산 (fallback)
    const now = new Date();
    const remainingMs = turnTime.getTime() - now.getTime();
    
    if (remainingMs <= 0) {
      const nextTurnTime = new Date(turnTime.getTime() + turnTerm * 60000);
      const nextRemainingMs = nextTurnTime.getTime() - now.getTime();
      return Math.max(0, Math.min(999, Math.floor(nextRemainingMs / 60000)));
    }
    
    return Math.max(0, Math.min(999, Math.floor(remainingMs / 60000)));
  }, [general.turntime, turnTerm, lastExecuted]);

  const nextExp = nextExpLevelRemain(general.experience || 0, general.explevel || 0);

  const officerCityName = general.officer_city && cityConst?.[general.officer_city]?.name || '';

  // 아이템 정보 (이름 + tooltip)
  const horseInfo = useMemo(() => getItemInfo(general.horse, itemInfo?.item), [general.horse, itemInfo?.item]);
  const weaponInfo = useMemo(() => getItemInfo(general.weapon, itemInfo?.item), [general.weapon, itemInfo?.item]);
  const bookInfo = useMemo(() => getItemInfo(general.book, itemInfo?.item), [general.book, itemInfo?.item]);
  const itemInfoData = useMemo(() => getItemInfo(general.item, itemInfo?.item), [general.item, itemInfo?.item]);
  const personalInfo = useMemo(() => getItemInfo(general.personal, itemInfo?.personality), [general.personal, itemInfo?.personality]);
  const crewtypeInfo = useMemo(() => getItemInfo(
    typeof general.crewtype === 'string' ? general.crewtype : 
    typeof general.crewtype === 'number' ? String(general.crewtype) : 
    general.crewtype?.id ? String(general.crewtype.id) : undefined,
    itemInfo?.crewtype
  ), [general.crewtype, itemInfo?.crewtype]);

  // 특기 정보 (특기가 없으면 습득 가능 연령 표시)
  const specialDomesticInfo = useMemo(() => 
    getSpecialInfo(general.specialDomestic, age, general.specage, itemInfo?.specialDomestic),
    [general.specialDomestic, age, general.specage, itemInfo?.specialDomestic]
  );
  const specialWarInfo = useMemo(() => 
    getSpecialInfo(general.specialWar, age, general.specage2, itemInfo?.specialWar),
    [general.specialWar, age, general.specage2, itemInfo?.specialWar]
  );
  const unitStacks = general.unitStacks;
  const totalStackTroops = unitStacks?.totalTroops;
  const totalStackCount = unitStacks?.stackCount ?? unitStacks?.stacks?.length ?? 0;
  const hasStackDetail = Boolean(unitStacks && unitStacks.stacks && unitStacks.stacks.length);
  const visibleStacks = hasStackDetail ? unitStacks!.stacks.slice(0, 3) : [];
  const hasExtraStacks = hasStackDetail && unitStacks!.stacks.length > visibleStacks.length;
  const unitConst = useUnitConst();
  // unitStacks의 첫 번째 스택에서 crewtype 정보를 우선적으로 사용
  const primaryStackCrewTypeId = unitStacks?.stacks?.[0]?.crewTypeId;
  const primaryStackName = unitStacks?.stacks?.[0]?.crewTypeName;
  const effectiveCrewtype = primaryStackCrewTypeId && primaryStackCrewTypeId > 0
    ? { id: primaryStackCrewTypeId, label: primaryStackName || `병종 ${primaryStackCrewTypeId}` }
    : general.crewtype;
  const crewtypeId = getCrewtypeId(effectiveCrewtype);
  const crewtypeLabel = formatCrewtypeLabel(effectiveCrewtype, unitConst ?? undefined, primaryStackName);
  const displayTrain = typeof unitStacks?.averageTrain === 'number'
    ? unitStacks.averageTrain
    : (general.train || 0);
  const displayAtmos = typeof unitStacks?.averageMorale === 'number'
    ? unitStacks.averageMorale
    : (general.atmos || 50);
  const soldierSummary = typeof totalStackTroops === 'number'
    ? `${totalStackTroops.toLocaleString()}명${totalStackCount ? ` · ${totalStackCount.toLocaleString()}부대` : ''}`
    : `${(general.crew || 0).toLocaleString()}명`;
  const canToggleStacks = Boolean(hasStackDetail);
  const extraStackCount = hasExtraStacks ? unitStacks!.stacks.length - visibleStacks.length : 0;
  const handleStackToggle = () => {
    if (!canToggleStacks) return;
    setShowStacks((prev) => !prev);
  };

  return (
    <div 
      className="w-full h-full flex flex-col bg-gray-900/60 backdrop-blur-md border border-white/10 rounded-xl shadow-2xl overflow-hidden text-gray-200 font-sans"
      style={{
        borderColor: colorSystem?.border,
      }}
    >
      {/* 상단 카드: 기본 정보 + 능력치 */}
      <div className="grid grid-cols-[100px_1fr] md:grid-cols-[120px_1fr] grid-rows-[auto_auto_1fr_auto] w-full h-full">
        <div className="col-start-1 row-span-4 w-full h-full relative overflow-hidden border-r border-white/10 flex flex-col justify-start bg-black/20 group">
          <img
            className="w-full h-auto max-h-[140px] md:max-h-[160px] aspect-[3/4] object-cover object-top transition-transform duration-500 group-hover:scale-105"
            src={general.picture ? getIconPath(general.imgsvr || 0, general.picture) : '/default_portrait.png'}
            alt={general.name}
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/default_portrait.png';
            }}
          />
          <div className="relative w-full py-2 px-1 bg-gradient-to-b from-white/5 to-transparent text-white text-center font-bold text-base shadow-sm z-10 border-t border-white/5">
            <span 
              className="cursor-pointer transition-colors duration-200 hover:text-white hover:shadow-[0_0_8px_rgba(255,255,255,0.5)]"
              onClick={() => window.location.href = `/general/${general.no}`}
              title="장수 상세 정보"
            >
              {general.name}
            </span>
            {officerCityName && (
              <span className="block text-xs font-normal mt-1 opacity-90">
                {officerCityName} {general.officerLevelText}
              </span>
            )}
            <div className="mt-2 flex flex-col gap-1.5 items-center">
              {visibleStacks.length > 0 ? (
                <div className="flex flex-wrap gap-1 justify-center">
                  {visibleStacks.map((stack) => (
                    <Badge key={stack.id} variant="outline" className="gap-1 font-normal">
                      <TroopIconDisplay crewtype={stack.crewTypeId} size={14} />
                      <span className="text-white/85">
                        {resolveStackLabel(stack.crewTypeId, stack.crewTypeName, unitConst ?? undefined)}
                      </span>
                      <span className="text-white/65 font-semibold ml-1">{stack.troops.toLocaleString()}</span>
                    </Badge>
                  ))}
                </div>
              ) : (
                <Tooltip content={crewtypeInfo.info}>
                  <Badge variant="outline" className="gap-1.5 font-normal cursor-help">
                    {crewtypeId ? <TroopIconDisplay crewtype={crewtypeId} size={16} /> : null}
                    <span>{crewtypeLabel}</span>
                  </Badge>
                </Tooltip>
              )}
              {canToggleStacks ? (
                <button 
                  type="button" 
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-white/20 bg-white/10 text-white/85 text-xs cursor-pointer transition-colors hover:bg-white/20 hover:border-white/35 active:scale-95"
                  onClick={handleStackToggle}
                >
                  <span className="text-white/75">
                    {hasExtraStacks ? `외 ${extraStackCount}부대` : soldierSummary}
                  </span>
                  <span className="text-white/80">{showStacks ? '▴' : '▾'}</span>
                </button>
              ) : (
                <span className="text-xs text-white/75">{soldierSummary}</span>
              )}
            </div>
          </div>
        </div>

        <div className="col-start-2 row-start-1 flex items-center gap-3 px-4 py-2 text-sm font-semibold border-b border-white/10 bg-white/5 text-white/90">
          {nation && nation.id !== 0 ? (
            <NationFlag 
              nation={{
                name: nation.name,
                color: nation.color,
                flagImage: nation.flagImage,
                flagTextColor: nation.flagTextColor,
                flagBgColor: nation.flagBgColor,
                flagBorderColor: nation.flagBorderColor,
              }} 
              size={18} 
            />
          ) : (
            <span>재야</span>
          )}
          <span>{generalTypeCall}</span>
          <span style={{ color: injuryInfo[1] }}>{injuryInfo[0]}</span>
          {general.turntime && (
            <span className="ml-auto text-xs text-gray-400">
              {typeof general.turntime === 'string' 
                ? (general.turntime.includes('T') 
                    ? new Date(general.turntime).toLocaleTimeString('ko-KR', { hour12: false })
                    : general.turntime.substring(11, 19))
                : general.turntime instanceof Date
                  ? general.turntime.toLocaleTimeString('ko-KR', { hour12: false })
                  : ''}
            </span>
          )}
        </div>

        <div className="col-start-2 row-start-2 px-4 py-2 border-b border-white/10 grid grid-cols-5 gap-2 bg-black/10">
          <div className="flex flex-col items-center justify-center bg-white/5 rounded p-1 transition-all duration-200 border border-transparent hover:bg-white/10 hover:border-white/10 hover:-translate-y-px">
            <div className="text-[10px] text-white/50 mb-1 font-medium tracking-wide">통솔</div>
            <div className="text-base font-bold text-white flex items-center gap-0.5 leading-none">
              <span style={{ color: injuryInfo[1] }}>
                {calcInjury('leadership', {
                  leadership: general.leadership ?? 0,
                  strength: general.strength ?? 0,
                  intel: general.intel ?? 0,
                  injury: general.injury || 0
                })}
              </span>
              {typeof general.lbonus === 'number' && general.lbonus !== 0 && (
                <span className="text-[0.7em]" style={{ color: general.lbonus > 0 ? (colorSystem?.success || 'cyan') : (colorSystem?.error || 'red') }}>
                  {general.lbonus > 0 ? '+' : ''}{general.lbonus}
                </span>
              )}
            </div>
            <div className="w-full h-[3px] bg-white/10 rounded-sm mt-1 overflow-hidden">
              <SammoBar height={7} percent={((general.leadership_exp || 0) / statUpThreshold) * 100} barColor={displayColor} />
            </div>
          </div>

          <div className="flex flex-col items-center justify-center bg-white/5 rounded p-1 transition-all duration-200 border border-transparent hover:bg-white/10 hover:border-white/10 hover:-translate-y-px">
            <div className="text-[10px] text-white/50 mb-1 font-medium tracking-wide">무력</div>
            <div className="text-base font-bold text-white flex items-center gap-0.5 leading-none">
              <span style={{ color: injuryInfo[1] }}>
                {calcInjury('strength', {
                  leadership: general.leadership ?? 0,
                  strength: general.strength ?? 0,
                  intel: general.intel ?? 0,
                  injury: general.injury || 0
                })}
              </span>
              {typeof general.sbonus === 'number' && general.sbonus !== 0 && (
                <span className="text-[0.7em]" style={{ color: general.sbonus > 0 ? (colorSystem?.success || 'cyan') : (colorSystem?.error || 'red') }}>
                  {general.sbonus > 0 ? '+' : ''}{general.sbonus}
                </span>
              )}
            </div>
            <div className="w-full h-[3px] bg-white/10 rounded-sm mt-1 overflow-hidden">
              <SammoBar height={7} percent={((general.strength_exp || 0) / statUpThreshold) * 100} barColor={displayColor} />
            </div>
          </div>

          <div className="flex flex-col items-center justify-center bg-white/5 rounded p-1 transition-all duration-200 border border-transparent hover:bg-white/10 hover:border-white/10 hover:-translate-y-px">
            <div className="text-[10px] text-white/50 mb-1 font-medium tracking-wide">지력</div>
            <div className="text-base font-bold text-white flex items-center gap-0.5 leading-none">
              <span style={{ color: injuryInfo[1] }}>
                {calcInjury('intel', {
                  leadership: general.leadership ?? 0,
                  strength: general.strength ?? 0,
                  intel: general.intel ?? 0,
                  injury: general.injury || 0
                })}
              </span>
              {typeof general.ibonus === 'number' && general.ibonus !== 0 && (
                <span className="text-[0.7em]" style={{ color: general.ibonus > 0 ? (colorSystem?.success || 'cyan') : (colorSystem?.error || 'red') }}>
                  {general.ibonus > 0 ? '+' : ''}{general.ibonus}
                </span>
              )}
            </div>
            <div className="w-full h-[3px] bg-white/10 rounded-sm mt-1 overflow-hidden">
              <SammoBar height={7} percent={((general.intel_exp || 0) / statUpThreshold) * 100} barColor={displayColor} />
            </div>
          </div>

          <div className="flex flex-col items-center justify-center bg-white/5 rounded p-1 transition-all duration-200 border border-transparent hover:bg-white/10 hover:border-white/10 hover:-translate-y-px">
            <div className="text-[10px] text-white/50 mb-1 font-medium tracking-wide">정치</div>
            <div className="text-base font-bold text-white flex items-center gap-0.5 leading-none">
              <span style={{ color: injuryInfo[1] }}>
                {general.politics ?? 0}
              </span>
              {typeof general.pbonus === 'number' && general.pbonus !== 0 && (
                <span className="text-[0.7em]" style={{ color: general.pbonus > 0 ? (colorSystem?.success || 'cyan') : (colorSystem?.error || 'red') }}>
                  {general.pbonus > 0 ? '+' : ''}{general.pbonus}
                </span>
              )}
            </div>
            <div className="w-full h-[3px] bg-white/10 rounded-sm mt-1 overflow-hidden">
              <SammoBar height={7} percent={((general.politics_exp || 0) / statUpThreshold) * 100} barColor={displayColor} />
            </div>
          </div>

          <div className="flex flex-col items-center justify-center bg-white/5 rounded p-1 transition-all duration-200 border border-transparent hover:bg-white/10 hover:border-white/10 hover:-translate-y-px">
            <div className="text-[10px] text-white/50 mb-1 font-medium tracking-wide">매력</div>
            <div className="text-base font-bold text-white flex items-center gap-0.5 leading-none">
              <span style={{ color: injuryInfo[1] }}>
                {general.charm ?? 0}
              </span>
              {typeof general.cbonus === 'number' && general.cbonus !== 0 && (
                <span className="text-[0.7em]" style={{ color: general.cbonus > 0 ? (colorSystem?.success || 'cyan') : (colorSystem?.error || 'red') }}>
                  {general.cbonus > 0 ? '+' : ''}{general.cbonus}
                </span>
              )}
            </div>
            <div className="w-full h-[3px] bg-white/10 rounded-sm mt-1 overflow-hidden">
              <SammoBar height={7} percent={((general.charm_exp || 0) / statUpThreshold) * 100} barColor={displayColor} />
            </div>
          </div>
        </div>

        <div className="col-start-2 row-start-3 grid grid-cols-[auto_1fr] content-start px-4 py-3 gap-y-1.5 gap-x-4 text-xs overflow-y-auto sm:grid-cols-[auto_1fr_auto_1fr] md:grid-cols-[auto_1fr_auto_1fr_auto_1fr_auto_1fr]">
          <div className="text-white/40 font-medium text-right pr-1 whitespace-nowrap">명마</div>
          <div className="text-white/90 font-medium truncate">
            <Tooltip content={horseInfo.info}>
              <span>{horseInfo.name}</span>
            </Tooltip>
          </div>

          <div className="text-white/40 font-medium text-right pr-1 whitespace-nowrap">무기</div>
          <div className="text-white/90 font-medium truncate">
            <Tooltip content={weaponInfo.info}>
              <span>{weaponInfo.name}</span>
            </Tooltip>
          </div>

          <div className="text-white/40 font-medium text-right pr-1 whitespace-nowrap">서적</div>
          <div className="text-white/90 font-medium truncate">
            <Tooltip content={bookInfo.info}>
              <span>{bookInfo.name}</span>
            </Tooltip>
          </div>

          <div className="text-white/40 font-medium text-right pr-1 whitespace-nowrap">자금</div>
          <div className="text-white/90 font-medium truncate">{(general.gold || 0).toLocaleString()}</div>

          <div className="text-white/40 font-medium text-right pr-1 whitespace-nowrap">군량</div>
          <div className="text-white/90 font-medium truncate">{(general.rice || 0).toLocaleString()}</div>

          <div className="text-white/40 font-medium text-right pr-1 whitespace-nowrap">도구</div>
          <div className="text-white/90 font-medium truncate">
            <Tooltip content={itemInfoData.info}>
              <span>{itemInfoData.name}</span>
            </Tooltip>
          </div>

          <div className="text-white/40 font-medium text-right pr-1 whitespace-nowrap">훈련</div>
          <div className="text-white/90 font-medium truncate">{Math.round(displayTrain).toLocaleString()}</div>
 
          <div className="text-white/40 font-medium text-right pr-1 whitespace-nowrap">사기</div>
          <div className="text-white/90 font-medium truncate">{Math.round(displayAtmos).toLocaleString()}</div>

          <div className="text-white/40 font-medium text-right pr-1 whitespace-nowrap">성격</div>
          <div className="text-white/90 font-medium truncate">
            {general.personal && general.personal !== 'None' ? (
              <Tooltip content={personalInfo.info}>
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-5 cursor-help">
                  {personalInfo.name}
                </Badge>
              </Tooltip>
            ) : '-'}
          </div>

          <div className="text-white/40 font-medium text-right pr-1 whitespace-nowrap">특기</div>
          <div className="text-white/90 font-medium truncate flex gap-1 items-center">
            {/* 내정 특기 - 없으면 습득 가능 연령 표시 */}
            <Tooltip content={specialDomesticInfo.info}>
              <Badge 
                variant="secondary" 
                className={`text-[10px] px-1.5 py-0 h-5 cursor-help ${
                  (!general.specialDomestic || general.specialDomestic === 'None') 
                    ? 'opacity-60' : ''
                }`}
              >
                {specialDomesticInfo.name}
              </Badge>
            </Tooltip>
            <span className="text-white/30">/</span>
            {/* 전투 특기 - 없으면 습득 가능 연령 표시 */}
            <Tooltip content={specialWarInfo.info}>
              <Badge 
                variant="secondary" 
                className={`text-[10px] px-1.5 py-0 h-5 cursor-help ${
                  (!general.specialWar || general.specialWar === 'None') 
                    ? 'opacity-60' : ''
                }`}
              >
                {specialWarInfo.name}
              </Badge>
            </Tooltip>
          </div>

          <div className="text-white/40 font-medium text-right pr-1 whitespace-nowrap">연령</div>
          <div className="font-medium truncate" style={{ color: ageColor }}>{age}세</div>

          <div className="text-white/40 font-medium text-right pr-1 whitespace-nowrap">수비</div>
          <div className="font-semibold truncate">
            {general.defence_train === 999 ? (
              <span style={{ color: colorSystem?.error || 'red' }}>수비 안함</span>
            ) : (
              <span style={{ color: colorSystem?.success || 'limegreen' }}>수비 함(훈사{general.defence_train || 0})</span>
            )}
          </div>

          <div className="text-white/40 font-medium text-right pr-1 whitespace-nowrap">삭턴</div>
          <div className="text-white/90 font-medium truncate">{general.killturn || 0} 턴</div>

          <div className="text-white/40 font-medium text-right pr-1 whitespace-nowrap">실행</div>
          <div className="text-white/90 font-medium truncate">{nextExecuteMinute}분 남음</div>

          <div className="text-white/40 font-medium text-right pr-1 whitespace-nowrap">부대</div>
          <div className="text-white/90 font-medium truncate">
            {!normalizedTroopInfo && !fallbackTroopName ? (
              '-'
            ) : normalizedTroopInfo ? (
              firstReservedCommand && firstReservedCommand.action !== 'che_집합' ? (
                <s style={{ color: 'gray' }}>{normalizedTroopInfo.name}</s>
              ) : troopLeaderCity && troopLeaderCity === general.city ? (
                <span
                  className="cursor-pointer transition-colors hover:text-white hover:shadow-[0_0_8px_rgba(255,255,255,0.5)]"
                  onClick={() => window.location.href = '/troop'}
                  title="부대 정보"
                >
                  {normalizedTroopInfo.name}
                </span>
              ) : (
                <span
                  className="cursor-pointer transition-colors hover:text-white hover:shadow-[0_0_8px_rgba(255,255,255,0.5)]"
                  style={{ color: colorSystem?.warning || 'orange' }}
                  onClick={() => window.location.href = '/troop'}
                  title="부대 정보"
                >
                  {normalizedTroopInfo.name}
                  {troopLeaderCity ? `(${cityConst?.[troopLeaderCity]?.name || troopLeaderCity})` : ''}
                </span>
              )
            ) : (
              <span>{fallbackTroopName}</span>
            )}
          </div>

          <div className="text-white/40 font-medium text-right pr-1 whitespace-nowrap">벌점</div>
          <div className="text-white/90 font-medium truncate">
            {formatRefreshScore(general.refreshScoreTotal || 0)} {(general.refreshScoreTotal || 0).toLocaleString()}점({general.refreshScore || 0})
          </div>
        </div>

        {/* 레벨 정보 */}
        <div className="col-start-2 row-start-4 px-4 py-2 border-t border-white/10 flex items-center justify-between bg-black/20">
          <div style={{ display: 'flex', alignItems: 'center', width: '100%', gap: '0.75rem' }}>
            <span className="font-bold text-[1.1em] min-w-[50px]" style={{ color: colorSystem?.success || '#4CAF50' }}>Lv.{general.explevel || 0}</span>
            <div style={{ flex: 1 }}>
              <SammoBar height={7} percent={((general.experience || 0) % nextExp[1]) / nextExp[1] * 100} barColor={displayColor} />
            </div>
            <span className="text-xs text-gray-400 whitespace-nowrap">
              {nextExp[0].toLocaleString()} / {nextExp[1].toLocaleString()}
            </span>
          </div>
        </div>
        
        {hasStackDetail && showStacks && unitStacks && (
          <div className="col-span-full m-0 bg-black/30 border-t border-white/10 p-3 animate-slideDown">
            <div className="flex justify-between items-center mb-2 text-sm text-white/80 pb-1.5 border-b border-white/5">
              <div>
                총 <strong>{(unitStacks.totalTroops || 0).toLocaleString()}명</strong>
                {totalStackCount ? (
                  <span className="ml-1.5 text-gray-400">
                    ({totalStackCount.toLocaleString()}부대)
                  </span>
                ) : null}
              </div>
              <div className="text-xs text-gray-400">
                평균 훈련 {unitStacks.averageTrain ?? '-'} | 평균 사기 {unitStacks.averageMorale ?? '-'}
              </div>
            </div>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-2 max-h-[200px] overflow-y-auto pr-2">
              {unitStacks.stacks.map((stack) => (
                <div key={stack.id} className="grid grid-cols-[auto_1fr_auto_auto] items-center gap-3 p-2.5 bg-white/5 rounded-lg border border-white/5 transition-all hover:bg-white/10 hover:border-white/10 hover:-translate-y-px">
                  <div className="flex items-center gap-2 font-semibold text-white text-sm">
                    <TroopIconDisplay crewtype={stack.crewTypeId} size={24} />
                    <span>{resolveStackLabel(stack.crewTypeId, stack.crewTypeName, unitConst ?? undefined)}</span>
                  </div>
                  <div className="flex flex-col items-center min-w-[36px]">
                    <span className="text-[0.6rem] text-white/40 uppercase mb-0.5">병력</span>
                    <strong className="text-sm text-white/90 font-semibold">{stack.troops.toLocaleString()}</strong>
                  </div>
                  <div className="flex flex-col items-center min-w-[36px]">
                    <span className="text-[0.6rem] text-white/40 uppercase mb-0.5">훈련</span>
                    <strong className="text-sm text-white/90 font-semibold">{Math.round(stack.train).toLocaleString()}</strong>
                  </div>
                  <div className="flex flex-col items-center min-w-[36px]">
                    <span className="text-[0.6rem] text-white/40 uppercase mb-0.5">사기</span>
                    <strong className="text-sm text-white/90 font-semibold">{Math.round(stack.morale).toLocaleString()}</strong>
                  </div>
                  <div className="col-span-full mt-1.5 pt-1.5 border-t border-white/5 text-[0.7rem] text-white/40 flex justify-between">
                    {stack.unitSize}명 × {stack.stackCount}스택
                    {stack.updatedAt ? ` · ${new Date(stack.updatedAt).toLocaleString()}` : ''}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
