'use client';

import React from 'react';
import type { GetFrontInfoResponse } from '@/lib/api/sammo';
import styles from './GameInfoPanel.module.css';

interface GameInfoPanelProps {
  frontInfo: GetFrontInfoResponse;
  serverName?: string;
  serverLocked?: boolean;
  lastExecuted?: Date;
}

export default function GameInfoPanel({ 
  frontInfo, 
  serverName = '',
  serverLocked = false,
  lastExecuted = new Date()
}: GameInfoPanelProps) {
  const global = frontInfo.global;
  const nation = frontInfo.nation;

  const formatTime = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  };

  const calcTournamentTerm = (turnterm: number) => {
    return Math.floor(turnterm / 2);
  };

  // NPC 모드 텍스트
  const npcModeText = ['불가능', '가능', '선택 생성'][global.npcMode || 0];

  return (
    <div className={styles.gameInfoPanel}>
      <h3 className={styles.scenarioName}>
        {serverName}{global.serverCnt}기
        <span className={styles.avoidWrap} style={{ color: 'cyan' }}>
          {global.scenarioText}
        </span>
      </h3>
      <div className={styles.gameInfo}>
        <div className={`${styles.infoRow} ${styles.subScenarioName}`}>
          <span style={{ color: 'cyan' }}>{global.scenarioText}</span>
        </div>
        <div className={`${styles.infoRow} ${styles.subNPCType}`}>
          <span style={{ color: 'cyan' }}>
            NPC 수, 상성: {global.extendedGeneral ? '확장' : '표준'} {global.isFiction ? '가상' : '사실'}
          </span>
        </div>
        <div className={`${styles.infoRow} ${styles.subNPCMode}`}>
          <span style={{ color: 'cyan' }}>NPC선택: {npcModeText}</span>
        </div>
        <div className={`${styles.infoRow} ${styles.subYearMonth}`}>
          현재: {global.year}年 {global.month}月 ({global.turnterm}분 턴 서버)
        </div>
        <div className={`${styles.infoRow} ${styles.subOnlineUserCnt}`}>
          전체 접속자 수: {(global.onlineUserCnt || 0).toLocaleString()}명
        </div>
        <div className={`${styles.infoRow} ${styles.subAPILimit}`}>
          턴당 갱신횟수: {global.apiLimit.toLocaleString()}회
        </div>
        <div className={`${styles.infoRow} ${styles.subLastExecuted}`} style={{ color: serverLocked ? 'magenta' : 'cyan' }}>
          동작 시각: {formatTime(lastExecuted).substring(5)}
        </div>
        {global.isTournamentActive && (
          <div className={`${styles.infoRow} ${styles.subTournamentState}`}>
            <span style={{ color: 'cyan' }}>토너먼트 진행 중</span>
          </div>
        )}
      </div>
      <div className={styles.onlineNations}>
        접속중인 국가: {global.onlineNations || '-'}
      </div>
      <div className={styles.onlineUsers}>
        【 접속자 】 {nation?.onlineGen || '-'}
      </div>
      {nation?.notice && (
        <div className={styles.nationNotice}>
          <div>【 국가방침 】</div>
          <div className={styles.nationNoticeBody} dangerouslySetInnerHTML={{ __html: nation.notice.msg || '' }} />
        </div>
      )}
    </div>
  );
}


