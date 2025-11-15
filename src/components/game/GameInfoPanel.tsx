'use client';

import React, { useMemo, useState, useEffect } from 'react';
import type { GetFrontInfoResponse } from '@/lib/api/sammo';
import type { ColorSystem } from '@/types/colorSystem';
import styles from './GameInfoPanel.module.css';

interface GameInfoPanelProps {
  frontInfo: GetFrontInfoResponse;
  serverName?: string;
  serverLocked?: boolean;
  lastExecuted?: Date;
  nationColor?: string;
  colorSystem?: ColorSystem;
}

function GameInfoPanel({ 
  frontInfo, 
  serverName = '',
  serverLocked = false,
  lastExecuted = new Date(),
  nationColor,
  colorSystem
}: GameInfoPanelProps) {
  const global = frontInfo.global;
  const nation = frontInfo.nation;
  
  // 디버깅: 년월 확인
  console.log('[GameInfoPanel] 현재 년월:', {
    year: global.year,
    month: global.month,
    turnterm: global.turnterm
  });

  // 다음 턴까지 남은 시간 계산
  const [timeUntilNextTurn, setTimeUntilNextTurn] = useState<string>('계산 중...');

  useEffect(() => {
    const calculateTimeLeft = () => {
      try {
        // lastExecuted를 기준으로 다음 턴 시각 계산
        const turnterm = global.turnterm || 60; // 분
        const lastExec = lastExecuted.getTime();
        const nextTurnTime = lastExec + (turnterm * 60 * 1000); // 분을 밀리초로 변환
        const now = Date.now();
        const diff = nextTurnTime - now;

        if (diff <= 0) {
          setTimeUntilNextTurn('턴 처리 중...');
          return;
        }

        const minutes = Math.floor(diff / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);
        setTimeUntilNextTurn(`${minutes}분 ${seconds}초`);
      } catch (e) {
        setTimeUntilNextTurn('-');
      }
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, [lastExecuted, global.turnterm]);

  const formatTime = useMemo(() => (date: Date) => {
    // 한국 시간대(Asia/Seoul, UTC+9)로 변환
    const kstDate = new Date(date.toLocaleString('en-US', { timeZone: 'Asia/Seoul' }));
    const year = kstDate.getFullYear();
    const month = String(kstDate.getMonth() + 1).padStart(2, '0');
    const day = String(kstDate.getDate()).padStart(2, '0');
    const hours = String(kstDate.getHours()).padStart(2, '0');
    const minutes = String(kstDate.getMinutes()).padStart(2, '0');
    const seconds = String(kstDate.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  }, []);

  const calcTournamentTerm = useMemo(() => (turnterm: number) => {
    return Math.floor(turnterm / 2);
  }, []);

  // NPC 모드 텍스트
  const npcModeText = useMemo(() => ['불가능', '가능', '선택 생성'][global.npcMode || 0], [global.npcMode]);

  // 서버 이름: 세션 이름 (예: "삼국지 서버")
  // session.name이 설정되어 있으면 사용, 없으면 null
  const hasCustomServerName = global.serverName && global.serverName !== serverName;
  const displayServerName = hasCustomServerName ? global.serverName : null;
  
  // 시나리오 이름: 게임 데이터의 시나리오 텍스트 (예: "삼국지")
  const scenarioName = global.scenarioText || '게임';
  
  // 표시 형식: "서버이름 기수기" 또는 "시나리오 기수기" (예: "삼국지 서버 1기" 또는 "삼국지 1기")
  const serverTitle = useMemo(() => {
    const parts: string[] = [];
    
    // 서버 이름이 설정되어 있으면 사용, 없으면 시나리오 이름 사용
    if (displayServerName) {
      parts.push(displayServerName);
    } else {
      parts.push(scenarioName);
    }
    
    // 기수 추가
    if (global.serverCnt > 0) {
      parts.push(`${global.serverCnt}기`);
    }
    
    return parts.join(' ');
  }, [displayServerName, scenarioName, global.serverCnt]);
  
  return (
    <div 
      className={styles.gameInfoPanel}
      style={{
        borderColor: colorSystem?.border || '#555',
      }}
    >
      <h3 className={styles.scenarioName}>
        <span className={styles.avoidWrap} style={{ color: colorSystem?.info || 'cyan' }}>
          {serverTitle || '게임'}
        </span>
      </h3>
      <div className={styles.gameInfo} style={{ color: colorSystem?.text }}>
        <div className={`${styles.infoRow} ${styles.subScenarioName}`}>
          <span style={{ color: colorSystem?.info || 'cyan' }}>{global.scenarioText}</span>
        </div>
        <div className={`${styles.infoRow} ${styles.subNPCType}`}>
          <span style={{ color: colorSystem?.info || 'cyan' }}>
            NPC 수, 상성: {global.extendedGeneral ? '확장' : '표준'} {global.isFiction ? '가상' : '사실'}
          </span>
        </div>
        <div className={`${styles.infoRow} ${styles.subNPCMode}`}>
          <span style={{ color: colorSystem?.info || 'cyan' }}>NPC선택: {npcModeText}</span>
        </div>
        <div className={`${styles.infoRow} ${styles.subYearMonth}`}>
          현재: <span style={{ color: colorSystem?.warning || 'yellow', fontWeight: 'bold' }}>{global.year}年 {global.month}月</span> ({global.turnterm}분 턴)
        </div>
        <div className={`${styles.infoRow} ${styles.subNextTurn}`}>
          다음 턴: <span style={{ color: colorSystem?.success || 'lime', fontWeight: 'bold' }}>{timeUntilNextTurn}</span>
        </div>
        <div className={`${styles.infoRow} ${styles.subOnlineUserCnt}`}>
          접속자: {(global.onlineUserCnt || 0).toLocaleString()}명
        </div>
        <div className={`${styles.infoRow} ${styles.subLastExecuted}`} style={{ color: serverLocked ? (colorSystem?.special || 'magenta') : (colorSystem?.info || 'cyan'), fontSize: '0.9em' }}>
          최종 처리: {formatTime(lastExecuted).substring(11)} {/* 시:분:초만 표시 */}
        </div>
        {global.isTournamentActive && (
          <div className={`${styles.infoRow} ${styles.subTournamentState}`}>
            <span style={{ color: colorSystem?.info || 'cyan' }}>토너먼트 진행 중</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default React.memo(GameInfoPanel, (prevProps, nextProps) => {
  // 필요한 필드만 비교하여 불필요한 리렌더링 방지
  return (
    prevProps.serverName === nextProps.serverName &&
    prevProps.serverLocked === nextProps.serverLocked &&
    prevProps.lastExecuted?.getTime() === nextProps.lastExecuted?.getTime() &&
    prevProps.frontInfo.global.year === nextProps.frontInfo.global.year &&
    prevProps.frontInfo.global.month === nextProps.frontInfo.global.month &&
    prevProps.frontInfo.global.lastExecuted === nextProps.frontInfo.global.lastExecuted &&
    prevProps.frontInfo.global.onlineUserCnt === nextProps.frontInfo.global.onlineUserCnt &&
    prevProps.frontInfo.global.isTournamentActive === nextProps.frontInfo.global.isTournamentActive &&
    prevProps.frontInfo.nation?.id === nextProps.frontInfo.nation?.id &&
    prevProps.frontInfo.nation?.onlineGen === nextProps.frontInfo.nation?.onlineGen &&
    prevProps.frontInfo.nation?.notice?.msg === nextProps.frontInfo.nation?.notice?.msg
  );
});




