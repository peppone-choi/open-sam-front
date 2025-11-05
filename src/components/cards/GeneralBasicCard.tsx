'use client';

import React from 'react';
import SammoBar from '../game/SammoBar';
import { isBrightColor } from '@/utils/isBrightColor';
import { formatInjury } from '@/utils/formatInjury';
import { calcInjury } from '@/utils/calcInjury';
import { formatGeneralTypeCall } from '@/utils/formatGeneralTypeCall';
import { formatOfficerLevelText } from '@/utils/formatOfficerLevelText';
import styles from './GeneralBasicCard.module.css';

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
    leadership_exp?: number;
    strength_exp?: number;
    intel_exp?: number;
    lbonus?: number;
    officer_city?: number;
    turntime?: string | Date;
    horse?: string;
    weapon?: string;
    book?: string;
    item?: string;
    gold?: number;
    rice?: number;
    crewtype?: string;
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
  nation: {
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
function getItemName(item: string | undefined): string {
  if (!item || item === 'None') return '-';
  return item;
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
  cityConst 
}: GeneralBasicCardProps) {
  const textColor = isBrightColor(nation.color) ? '#000' : '#fff';

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
  const ageColor = age < retirementYear * 0.75 ? 'limegreen' : age < retirementYear ? 'yellow' : 'red';

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
  const cityName = general.officer_city && cityConst?.[general.officer_city]?.name || '';

  return (
    <div className={`${styles.generalCardBasic} bg2`}>
      <div
        className={styles.generalIcon}
        style={{
          backgroundImage: general.picture ? `url('${getIconPath(general.imgsvr || 0, general.picture)}')` : undefined,
        }}
      />

      <div
        className={styles.generalName}
        style={{
          color: textColor,
          backgroundColor: nation.color,
        }}
      >
        {general.name} 【
        {general.officer_city && cityName && (
          <>{cityName} </>
        )}
        {general.officerLevelText} | {generalTypeCall} |
        <span style={{ color: injuryInfo[1] }}>{injuryInfo[0]}</span>
        】 {typeof general.turntime === 'string' ? general.turntime.substring(11, 19) : ''}
      </div>

      <div className="bg1">통솔</div>
      <div>
        <div className={`${styles.row} ${styles.gx0}`}>
          <div className={styles.statValueCol}>
            <span style={{ color: injuryInfo[1] }}>
              {calcInjury('leadership', {
                leadership: general.leadership || 50,
                strength: general.strength || 50,
                intel: general.intel || 50,
                injury: general.injury || 0
              })}
            </span>
            {general.lbonus && general.lbonus > 0 && (
              <span style={{ color: 'cyan', marginLeft: '0.25rem' }}>+{general.lbonus}</span>
            )}
          </div>
          <div className={`${styles.statBarCol} ${styles.alignSelfCenter}`}>
            <SammoBar height={10} percent={((general.leadership_exp || 0) / statUpThreshold) * 100} />
          </div>
        </div>
      </div>

      <div className="bg1">무력</div>
      <div>
        <div className={`${styles.row} ${styles.gx0}`}>
          <div className={styles.statValueCol} style={{ color: injuryInfo[1] }}>
            {calcInjury('strength', {
              leadership: general.leadership || 50,
              strength: general.strength || 50,
              intel: general.intel || 50,
              injury: general.injury || 0
            })}
          </div>
          <div className={`${styles.statBarCol} ${styles.alignSelfCenter}`}>
            <SammoBar height={10} percent={((general.strength_exp || 0) / statUpThreshold) * 100} />
          </div>
        </div>
      </div>

      <div className="bg1">지력</div>
      <div>
        <div className={`${styles.row} ${styles.gx0}`}>
          <div className={styles.statValueCol} style={{ color: injuryInfo[1] }}>
            {calcInjury('intel', {
              leadership: general.leadership || 50,
              strength: general.strength || 50,
              intel: general.intel || 50,
              injury: general.injury || 0
            })}
          </div>
          <div className={`${styles.statBarCol} ${styles.alignSelfCenter}`}>
            <SammoBar height={10} percent={((general.intel_exp || 0) / statUpThreshold) * 100} />
          </div>
        </div>
      </div>

      <div className="bg1">명마</div>
      <div>{getItemName(general.horse)}</div>

      <div className="bg1">무기</div>
      <div>{getItemName(general.weapon)}</div>

      <div className="bg1">서적</div>
      <div>{getItemName(general.book)}</div>

      <div className="bg1">자금</div>
      <div>{(general.gold || 0).toLocaleString()}</div>

      <div className="bg1">군량</div>
      <div>{(general.rice || 0).toLocaleString()}</div>

      <div className="bg1">도구</div>
      <div>{getItemName(general.item)}</div>

      <div
        className={styles.generalCrewTypeIcon}
        style={{
          backgroundImage: general.crewtype && general.crewtype !== 'None' 
            ? `url('/images/crewtype${general.crewtype}.png')` 
            : undefined,
        }}
      />

      <div className="bg1">병종</div>
      <div>{getItemName(general.crewtype)}</div>

      <div className="bg1">병사</div>
      <div>{(general.crew || 0).toLocaleString()}</div>

      <div className="bg1">성격</div>
      <div>{getItemName(general.personal)}</div>

      <div className="bg1">훈련</div>
      <div>{general.train || 0}</div>

      <div className="bg1">사기</div>
      <div>{general.atmos || 50}</div>

      <div className="bg1">특기</div>
      <div>
        {getItemName(general.specialDomestic)} / {getItemName(general.specialWar)}
      </div>

      <div className="bg1">Lv</div>
      <div className={styles.generalExpLevel}>{general.explevel || 0}</div>
      <div className={`${styles.generalExpLevelBar} ${styles.dGrid}`}>
        <div className={styles.alignSelfCenter}>
          <SammoBar height={10} percent={(nextExp[0] / nextExp[1]) * 100} />
        </div>
      </div>

      <div className="bg1">연령</div>
      <div style={{ color: ageColor }}>{age}세</div>

      <div className="bg1">수비</div>
      <div className={styles.generalDefenceTrain}>
        {general.defence_train === 999 ? (
          <span style={{ color: 'red' }}>수비 안함</span>
        ) : (
          <span style={{ color: 'limegreen' }}>수비 함(훈사{general.defence_train || 0})</span>
        )}
      </div>

      <div className="bg1">삭턴</div>
      <div>{general.killturn || 0} 턴</div>

      <div className="bg1">실행</div>
      <div>{nextExecuteMinute}분 남음</div>

      <div className="bg1">부대</div>
      {!troopInfo ? (
        <div className={styles.generalTroop}>-</div>
      ) : (
        <div className={styles.generalTroop}>
          {troopInfo.leader.reservedCommand && troopInfo.leader.reservedCommand[0]?.action !== 'che_집합' ? (
            <s style={{ color: 'gray' }}>{troopInfo.name}</s>
          ) : troopInfo.leader.city === general.city ? (
            <span>{troopInfo.name}</span>
          ) : (
            <span style={{ color: 'orange' }}>
              {troopInfo.name}({cityConst?.[troopInfo.leader.city]?.name || troopInfo.leader.city})
            </span>
          )}
        </div>
      )}

      <div className="bg1">벌점</div>
      <div className={styles.generalRefreshScoreTotal}>
        {formatRefreshScore(general.refreshScoreTotal || 0)} {(general.refreshScoreTotal || 0).toLocaleString()}점({general.refreshScore || 0})
      </div>
    </div>
  );
}
