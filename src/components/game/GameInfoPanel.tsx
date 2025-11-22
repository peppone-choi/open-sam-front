'use client';

import React, { useMemo, useState, useEffect } from 'react';
import type { GetFrontInfoResponse } from '@/lib/api/sammo';
import type { ColorSystem } from '@/types/colorSystem';
import { cn } from '@/lib/utils';

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
  
  // 디버깅: 년월 확인
  useEffect(() => {
    console.log('[GameInfoPanel] 현재 년월:', {
      year: global.year,
      month: global.month,
      turnterm: global.turnterm
    });
  }, [global.year, global.month, global.turnterm]);

  // 다음 턴까지 남은 시간 계산
  const [timeUntilNextTurn, setTimeUntilNextTurn] = useState<string>('계산 중...');

  useEffect(() => {
    const calculateTimeLeft = () => {
      try {
        const turnterm = global.turnterm || 60; // 분
        const lastExec = lastExecuted.getTime();
        const nextTurnTime = lastExec + (turnterm * 60 * 1000);
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
    const kstDate = new Date(date.toLocaleString('en-US', { timeZone: 'Asia/Seoul' }));
    const hours = String(kstDate.getHours()).padStart(2, '0');
    const minutes = String(kstDate.getMinutes()).padStart(2, '0');
    const seconds = String(kstDate.getSeconds()).padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  }, []);
 
  // 기타 설정 텍스트
  const otherTextInfo = useMemo(() => {
    const parts: string[] = [];
    if (global.joinMode === 'onlyRandom') parts.push('랜덤 임관');
    if (global.autorunUser?.limit_minutes && global.autorunUser.limit_minutes > 0) {
      parts.push(`자동턴 ${global.autorunUser.limit_minutes}분`);
    }
    return parts.length > 0 ? parts.join(', ') : '표준';
  }, [global.joinMode, global.autorunUser?.limit_minutes]);
 
  // NPC 모드 텍스트
  const npcModeText = useMemo(() => {
    const map = ['불가', '가능', '선택생성'] as const;
    const value = global.npcMode ?? 0;
    return map[value] ?? '불가';
  }, [global.npcMode]);

  // 서버 이름 / 시나리오 이름 처리
  const hasCustomServerName = global.serverName && global.serverName !== serverName;
  const displayServerName = hasCustomServerName ? global.serverName : null;
  const scenarioName = global.scenarioText || '게임';
  
  const serverTitle = useMemo(() => {
    const parts: string[] = [];
    if (displayServerName) {
      parts.push(displayServerName);
    } else {
      parts.push(scenarioName);
    }
    if (global.serverCnt > 0) {
      parts.push(`${global.serverCnt}기`);
    }
    return parts.join(' ');
  }, [displayServerName, scenarioName, global.serverCnt]);
  
  return (
    <div 
      className="w-full rounded-xl bg-background-secondary/80 backdrop-blur-md border border-white/10 shadow-lg overflow-hidden transition-all hover:border-primary/30"
      style={{ borderColor: colorSystem?.border }}
    >
      <div className="bg-background-tertiary/50 px-4 py-2 border-b border-white/5 flex justify-between items-center">
        <h3 className="font-bold text-lg truncate flex items-center gap-2">
           <span className="w-2 h-2 rounded-full bg-primary shadow-[0_0_8px] shadow-primary"></span>
           <span style={{ color: colorSystem?.info }}>{serverTitle}</span>
        </h3>
        <div className="text-xs text-foreground-muted flex gap-2">
           <span>{global.isFiction ? '가상' : '사실'}</span>
           <span className="text-white/20">|</span>
           <span>{global.extendedGeneral ? '장수확장' : '기본'}</span>
        </div>
      </div>

      <div className="p-4 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 text-sm">
        {/* 1. 현재 시간 (가장 중요) */}
        <div className="col-span-2 md:col-span-2 lg:col-span-2 bg-background-main/50 rounded-lg p-3 border border-white/5 flex flex-col justify-center items-center relative group overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-yellow-500 to-transparent opacity-50"></div>
          <span className="text-xs text-foreground-muted mb-1">현재 년월 (턴: {global.turnterm}분)</span>
          <div className="text-2xl font-bold tabular-nums tracking-tight" style={{ color: colorSystem?.warning || '#facc15' }}>
            {global.year}年 {global.month}月
          </div>
        </div>

        {/* 2. 다음 턴 (가장 중요) */}
        <div className="col-span-2 md:col-span-2 lg:col-span-2 bg-background-main/50 rounded-lg p-3 border border-white/5 flex flex-col justify-center items-center relative group overflow-hidden">
           <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-green-500 to-transparent opacity-50"></div>
           <span className="text-xs text-foreground-muted mb-1">다음 턴까지</span>
           <div className="text-2xl font-bold tabular-nums tracking-tight" style={{ color: colorSystem?.success || '#4ade80' }}>
             {timeUntilNextTurn}
           </div>
        </div>

        {/* 3. 상세 정보들 (작은 카드) */}
        <div className="col-span-1 flex flex-col justify-center items-center p-2 rounded bg-white/5">
           <span className="text-xs text-foreground-muted">전쟁 개시</span>
           <span className="font-medium" style={{ color: colorSystem?.warning || 'orange' }}>{(global.startyear ?? 184) + 3}年~</span>
        </div>

        <div className="col-span-1 flex flex-col justify-center items-center p-2 rounded bg-white/5">
           <span className="text-xs text-foreground-muted">접속자</span>
           <span className="font-medium">{(global.onlineUserCnt || 0).toLocaleString()}명</span>
        </div>

        <div className="col-span-1 flex flex-col justify-center items-center p-2 rounded bg-white/5">
           <span className="text-xs text-foreground-muted">NPC 빙의</span>
           <span className="font-medium" style={{ color: colorSystem?.info }}>{npcModeText}</span>
        </div>

        <div className="col-span-1 flex flex-col justify-center items-center p-2 rounded bg-white/5">
           <span className="text-xs text-foreground-muted">최종 처리</span>
           <span className="font-medium tabular-nums" style={{ color: serverLocked ? (colorSystem?.special || '#e879f9') : (colorSystem?.info || '#22d3ee') }}>
             {formatTime(lastExecuted)}
           </span>
        </div>

        <div className="col-span-2 md:col-span-4 lg:col-span-6 flex gap-2 justify-center items-center text-xs text-foreground-dim bg-black/20 rounded py-1 mt-1">
           <span>{global.scenarioText}</span>
           <span>•</span>
           <span>{otherTextInfo}</span>
           {global.isTournamentActive && (
             <>
                <span>•</span>
                <span className="text-cyan-400 font-bold animate-pulse">토너먼트 진행 중</span>
             </>
           )}
        </div>
      </div>
    </div>
  );
}

export default React.memo(GameInfoPanel, (prevProps, nextProps) => {
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
