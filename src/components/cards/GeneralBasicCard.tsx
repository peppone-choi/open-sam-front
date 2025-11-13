'use client';

import React from 'react';
import SammoBar from '../game/SammoBar';
import NationFlag from '../common/NationFlag';
import { isBrightColor } from '@/utils/isBrightColor';
import { formatInjury } from '@/utils/formatInjury';
import { calcInjury } from '@/utils/calcInjury';
import { formatGeneralTypeCall } from '@/utils/formatGeneralTypeCall';
import { formatOfficerLevelText } from '@/utils/formatOfficerLevelText';
import { TroopIconDisplay } from '../common/TroopIconDisplay';
import styles from './GeneralBasicCard.module.css';
import type { ColorSystem } from '@/types/colorSystem';

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
    explevel?: number;
    experience?: number;
    age?: number;
    defence_train?: number;
    killturn?: number;
    troop?: number;
    refreshScoreTotal?: number;
    refreshScore?: number;
    picture?: string;
    imgsvr?: number;
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
  };
  turnTerm?: number;
  gameConst?: {
    chiefStatMin?: number;
    statGradeLevel?: number;
    upgradeLimit?: number;
    retirementYear?: number;
  };
  cityConst?: Record<number, { name: string }>;
  colorSystem?: ColorSystem;
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

// 아이콘 경로 가져오기
function getIconPath(imgsvr: number, picture: string): string {
  if (!picture) return '';
  // 실제 이미지 서버 경로 구성
  // imgsvr이 있으면 해당 서버 사용, 없으면 기본 경로
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
  gameConst,
  cityConst,
  colorSystem
}: GeneralBasicCardProps) {
  // 재야는 흰색, 국가는 국가 색상
  const displayColor = (nation && nation.id !== 0) ? (nation?.color ?? "#666") : "#FFFFFF";
  const textColor = isBrightColor(displayColor) ? '#000' : '#fff';

  // 부상 정보
  const injuryInfo = formatInjury(general.injury || 0);

  // 타입 호칭
  const generalTypeCall = formatGeneralTypeCall(
    general.leadership || 50,
    general.strength || 50,
    general.intel || 50,
    gameConst
  );

  // 경험치 임계값
  const statUpThreshold = gameConst?.upgradeLimit || STAT_UP_THRESHOLD;

  // 연령 색상
  const retirementYear = gameConst?.retirementYear || 70;
  const age = general.age || 20;
  const ageColor = age < retirementYear * 0.75 
    ? (colorSystem?.success || 'limegreen') 
    : age < retirementYear 
      ? (colorSystem?.warning || 'yellow') 
      : (colorSystem?.error || 'red');

  // 다음 실행 시간 계산 (PHP 버전과 동일한 로직)
  // 장수의 turntime과 현재 시간을 비교하여 남은 시간 계산
  // lastExecuted는 세션 전체 기준이므로 장수 개별 턴 시간 계산에는 사용하지 않음
  const nextExecuteMinute = React.useMemo(() => {
    if (!general.turntime) {
      // turntime이 없으면 0 반환
      return 0;
    }
    
    const turnTime = typeof general.turntime === 'string' 
      ? new Date(general.turntime) 
      : (general.turntime instanceof Date ? general.turntime : new Date());
    
    // 현재 시간과 비교
    const now = new Date();
    const remainingMs = turnTime.getTime() - now.getTime();
    
    // turnTime이 과거면 다음 턴 시간으로 계산 (표시용만)
    if (remainingMs <= 0) {
      // turnTerm만큼 더한 시간으로 계산
      const nextTurnTime = new Date(turnTime.getTime() + turnTerm * 60000);
      const nextRemainingMs = nextTurnTime.getTime() - now.getTime();
      return Math.max(0, Math.floor(nextRemainingMs / 60000));
    }
    
    return Math.max(0, Math.floor(remainingMs / 60000));
  }, [general.turntime, turnTerm]);

  // 경험치 레벨 계산
  const nextExp = nextExpLevelRemain(general.experience || 0, general.explevel || 0);

  // 도시명 가져오기
  // officer_city는 관직을 맡은 도시 (태수, 도독 등)
  const officerCityName = general.officer_city && cityConst?.[general.officer_city]?.name || '';

  return (
    <div 
      className={styles.generalCardContainer}
      style={{
        borderColor: colorSystem?.border,
        color: colorSystem?.text,
        backgroundColor: colorSystem?.pageBg,
      }}
    >
      {/* 상단 카드: 기본 정보 + 능력치 */}
      <div 
        className={`${styles.generalCardTop} bg2`}
        style={{
          borderColor: colorSystem?.border,
          color: colorSystem?.text,
          backgroundColor: colorSystem?.pageBg,
        }}
      >
        <div
          className={styles.generalIcon}
          style={{
            backgroundImage: general.picture ? `url('${getIconPath(general.imgsvr || 0, general.picture)}')` : undefined,
          }}
        />

        <div 
          className={styles.infoRow}
          style={{
            backgroundColor: colorSystem?.buttonBg,
            color: colorSystem?.buttonText,
          }}
        >
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
              size={16} 
            />
          ) : (
            <span>재야</span>
          )}
          <span>|</span>
          <span>{generalTypeCall}</span>
          <span>|</span>
          <span>{injuryInfo[0]}</span>
          {general.turntime && (
            <>
              <span>|</span>
              <span>
                {typeof general.turntime === 'string' 
                  ? (general.turntime.includes('T') 
                      ? new Date(general.turntime).toLocaleTimeString('ko-KR', { hour12: false })
                      : general.turntime.substring(11, 19))
                  : general.turntime instanceof Date
                    ? general.turntime.toLocaleTimeString('ko-KR', { hour12: false })
                    : ''}
              </span>
            </>
          )}
        </div>

        <div className={styles.statsRow}>
        <div>
        <div className={styles.statBox} style={{ backgroundColor: colorSystem?.borderLight, borderRadius: '4px', padding: '4px 4px 6px 4px' }}>
          <div className={styles.statLabel} style={{ color: colorSystem?.text, fontWeight: 'bold' }}>통솔</div>
          <div className={styles.statValue}>
            <span style={{ color: injuryInfo[1] }}>
              {calcInjury('leadership', {
                leadership: general.leadership ?? 0,
                strength: general.strength ?? 0,
                intel: general.intel ?? 0,
                injury: general.injury || 0
              })}
            </span>
            {typeof general.lbonus === 'number' && general.lbonus !== 0 && (
              <span style={{ color: general.lbonus > 0 ? (colorSystem?.success || 'cyan') : (colorSystem?.error || 'red'), fontSize: '0.8em' }}>
                ({general.lbonus > 0 ? '+' : ''}{general.lbonus})
              </span>
            )}
          </div>
          <div className={styles.statBar}>
            <SammoBar height={8} percent={((general.leadership_exp || 0) / statUpThreshold) * 100} barColor={displayColor} />
          </div>
        </div>

        <div className={styles.statBox} style={{ backgroundColor: colorSystem?.borderLight, borderRadius: '4px', padding: '4px 4px 6px 4px' }}>
          <div className={styles.statLabel} style={{ color: colorSystem?.text, fontWeight: 'bold' }}>무력</div>
          <div className={styles.statValue}>
            <span style={{ color: injuryInfo[1] }}>
              {calcInjury('strength', {
                leadership: general.leadership ?? 0,
                strength: general.strength ?? 0,
                intel: general.intel ?? 0,
                injury: general.injury || 0
              })}
            </span>
            {typeof general.sbonus === 'number' && general.sbonus !== 0 && (
              <span style={{ color: general.sbonus > 0 ? (colorSystem?.success || 'cyan') : (colorSystem?.error || 'red'), fontSize: '0.8em' }}>
                ({general.sbonus > 0 ? '+' : ''}{general.sbonus})
              </span>
            )}
          </div>
          <div className={styles.statBar}>
            <SammoBar height={8} percent={((general.strength_exp || 0) / statUpThreshold) * 100} barColor={displayColor} />
          </div>
        </div>

        <div className={styles.statBox} style={{ backgroundColor: colorSystem?.borderLight, borderRadius: '4px', padding: '4px 4px 6px 4px' }}>
          <div className={styles.statLabel} style={{ color: colorSystem?.text, fontWeight: 'bold' }}>지력</div>
          <div className={styles.statValue}>
            <span style={{ color: injuryInfo[1] }}>
              {calcInjury('intel', {
                leadership: general.leadership ?? 0,
                strength: general.strength ?? 0,
                intel: general.intel ?? 0,
                injury: general.injury || 0
              })}
            </span>
            {typeof general.ibonus === 'number' && general.ibonus !== 0 && (
              <span style={{ color: general.ibonus > 0 ? (colorSystem?.success || 'cyan') : (colorSystem?.error || 'red'), fontSize: '0.8em' }}>
                ({general.ibonus > 0 ? '+' : ''}{general.ibonus})
              </span>
            )}
          </div>
          <div className={styles.statBar}>
            <SammoBar height={8} percent={((general.intel_exp || 0) / statUpThreshold) * 100} barColor={displayColor} />
          </div>
        </div>

        <div className={styles.statBox} style={{ backgroundColor: colorSystem?.borderLight, borderRadius: '4px', padding: '4px 4px 6px 4px' }}>
          <div className={styles.statLabel} style={{ color: colorSystem?.text, fontWeight: 'bold' }}>정치</div>
          <div className={styles.statValue}>
            <span style={{ color: injuryInfo[1] }}>
              {general.politics ?? 0}
            </span>
            {typeof general.pbonus === 'number' && general.pbonus !== 0 && (
              <span style={{ color: general.pbonus > 0 ? (colorSystem?.success || 'cyan') : (colorSystem?.error || 'red'), fontSize: '0.8em' }}>
                ({general.pbonus > 0 ? '+' : ''}{general.pbonus})
              </span>
            )}
          </div>
          <div className={styles.statBar}>
            <SammoBar height={8} percent={((general.politics_exp || 0) / statUpThreshold) * 100} barColor={displayColor} />
          </div>
        </div>

        <div className={styles.statBox} style={{ backgroundColor: colorSystem?.borderLight, borderRadius: '4px', padding: '4px 4px 6px 4px' }}>
          <div className={styles.statLabel} style={{ color: colorSystem?.text, fontWeight: 'bold' }}>매력</div>
          <div className={styles.statValue}>
            <span style={{ color: injuryInfo[1] }}>
              {general.charm ?? 0}
            </span>
            {typeof general.cbonus === 'number' && general.cbonus !== 0 && (
              <span style={{ color: general.cbonus > 0 ? (colorSystem?.success || 'cyan') : (colorSystem?.error || 'red'), fontSize: '0.8em' }}>
                ({general.cbonus > 0 ? '+' : ''}{general.cbonus})
              </span>
            )}
          </div>
          <div className={styles.statBar}>
            <SammoBar height={8} percent={((general.charm_exp || 0) / statUpThreshold) * 100} barColor={displayColor} />
          </div>
        </div>
        </div>
      </div>

      <div
        className={styles.generalNameCell}
        style={{
          color: textColor,
          backgroundColor: displayColor,
        }}
      >
        <span 
          className={styles.clickable}
          onClick={() => window.location.href = `/general/${general.no}`}
          title="장수 상세 정보"
        >
          {general.name}
        </span>
        {officerCityName && (
          <> 【{officerCityName} {general.officerLevelText}】</>
        )}
      </div>

      <div className={styles.detailGrid}>
      <div className="bg1" style={{ backgroundColor: colorSystem?.borderLight, color: colorSystem?.text, fontWeight: '500' }}>명마</div>
      <div>{getItemName(general.horse)}</div>

      <div className="bg1" style={{ backgroundColor: colorSystem?.borderLight, color: colorSystem?.text, fontWeight: '500' }}>무기</div>
      <div>{getItemName(general.weapon)}</div>

      <div className="bg1" style={{ backgroundColor: colorSystem?.borderLight, color: colorSystem?.text, fontWeight: '500' }}>서적</div>
      <div>{getItemName(general.book)}</div>

      <div className="bg1" style={{ backgroundColor: colorSystem?.borderLight, color: colorSystem?.text, fontWeight: '500' }}>자금</div>
      <div>{(general.gold || 0).toLocaleString()}</div>

      <div className="bg1" style={{ backgroundColor: colorSystem?.borderLight, color: colorSystem?.text, fontWeight: '500' }}>군량</div>
      <div>{(general.rice || 0).toLocaleString()}</div>

      <div className="bg1" style={{ backgroundColor: colorSystem?.borderLight, color: colorSystem?.text, fontWeight: '500' }}>도구</div>
      <div>{getItemName(general.item)}</div>

      <div className="bg1" style={{ backgroundColor: colorSystem?.borderLight, color: colorSystem?.text, fontWeight: '500' }}>훈련</div>
      <div>{general.train || 0}</div>

      <div className="bg1" style={{ backgroundColor: colorSystem?.borderLight, color: colorSystem?.text, fontWeight: '500' }}>사기</div>
      <div>{general.atmos || 50}</div>

      <div className="bg1" style={{ backgroundColor: colorSystem?.borderLight, color: colorSystem?.text, fontWeight: '500' }}>성격</div>
      <div>{getItemName(general.personal)}</div>

      <div className="bg1" style={{ backgroundColor: colorSystem?.borderLight, color: colorSystem?.text, fontWeight: '500' }}>특기</div>
      <div>
        {getItemName(general.specialDomestic)} / {getItemName(general.specialWar)}
      </div>

      <div className="bg1" style={{ backgroundColor: colorSystem?.borderLight, color: colorSystem?.text, fontWeight: '500' }}>연령</div>
      <div style={{ color: ageColor }}>{age}세</div>

      <div className="bg1" style={{ backgroundColor: colorSystem?.borderLight, color: colorSystem?.text, fontWeight: '500' }}>수비</div>
      <div className={styles.generalDefenceTrain}>
        {general.defence_train === 999 ? (
          <span style={{ color: colorSystem?.error || 'red' }}>수비 안함</span>
        ) : (
          <span style={{ color: colorSystem?.success || 'limegreen' }}>수비 함(훈사{general.defence_train || 0})</span>
        )}
      </div>

      <div className="bg1" style={{ backgroundColor: colorSystem?.borderLight, color: colorSystem?.text, fontWeight: '500' }}>삭턴</div>
      <div>{general.killturn || 0} 턴</div>

      <div className="bg1" style={{ backgroundColor: colorSystem?.borderLight, color: colorSystem?.text, fontWeight: '500' }}>실행</div>
      <div>{nextExecuteMinute}분 남음</div>

      <div className="bg1" style={{ backgroundColor: colorSystem?.borderLight, color: colorSystem?.text, fontWeight: '500' }}>부대</div>
      {!troopInfo ? (
        <div className={styles.generalTroop}>-</div>
      ) : (
        <div className={styles.generalTroop}>
          {troopInfo.leader.reservedCommand && troopInfo.leader.reservedCommand[0]?.action !== 'che_집합' ? (
            <s style={{ color: 'gray' }}>{troopInfo.name}</s>
          ) : troopInfo.leader.city === general.city ? (
            <span 
              className={styles.clickable}
              onClick={() => window.location.href = '/troop'}
              title="부대 정보"
            >
              {troopInfo.name}
            </span>
          ) : (
            <span 
              className={styles.clickable}
              style={{ color: colorSystem?.warning || 'orange' }}
              onClick={() => window.location.href = '/troop'}
              title="부대 정보"
            >
              {troopInfo.name}({cityConst?.[troopInfo.leader.city]?.name || troopInfo.leader.city})
            </span>
          )}
        </div>
      )}

      <div className="bg1" style={{ backgroundColor: colorSystem?.borderLight, color: colorSystem?.text, fontWeight: '500' }}>병종</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        {general.crewtype && general.crewtype !== 'None' ? (
          <>
            <TroopIconDisplay 
              crewtype={
                typeof general.crewtype === 'object' && general.crewtype !== null && 'id' in general.crewtype
                  ? general.crewtype.id
                  : typeof general.crewtype === 'string' 
                    ? parseInt(general.crewtype) 
                    : general.crewtype
              } 
              size={20} 
            />
            <span>
              {typeof general.crewtype === 'object' && general.crewtype !== null && 'label' in general.crewtype 
                ? general.crewtype.label 
                : getItemName(general.crewtype)}
            </span>
          </>
        ) : (
          <span style={{ color: colorSystem?.textMuted }}>미편성</span>
        )}
      </div>

      <div className="bg1" style={{ backgroundColor: colorSystem?.borderLight, color: colorSystem?.text, fontWeight: '500' }}>병사</div>
      <div>{(general.crew || 0).toLocaleString()}명</div>

      <div className="bg1" style={{ backgroundColor: colorSystem?.borderLight, color: colorSystem?.text, fontWeight: '500' }}>벌점</div>
      <div className={styles.generalRefreshScoreTotal}>
        {formatRefreshScore(general.refreshScoreTotal || 0)} {(general.refreshScoreTotal || 0).toLocaleString()}점({general.refreshScore || 0})
      </div>
      </div>

      {/* 레벨 정보 */}
      <div className={styles.crewInfo}>
        <div style={{ display: 'flex', alignItems: 'center', width: '100%', padding: '0.75rem 1rem', gap: '0.5rem' }}>
          <span style={{ fontWeight: 'bold', color: colorSystem?.success || '#4CAF50', fontSize: '1em', minWidth: '50px' }}>Lv.{general.explevel || 0}</span>
          <div style={{ flex: 1 }}>
            <SammoBar height={10} percent={((general.experience || 0) % nextExp[1]) / nextExp[1] * 100} barColor={displayColor} />
          </div>
          <span style={{ fontSize: '0.85em', color: colorSystem?.textMuted || '#aaa', whiteSpace: 'nowrap' }}>
            {nextExp[0].toLocaleString()} / {nextExp[1].toLocaleString()}
          </span>
        </div>
      </div>
      </div>
    </div>
  );
}
