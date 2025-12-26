'use client';

/**
 * GameSessionProvider
 * 
 * 앱 전체에서 게임 세션과 웹소켓을 관리하는 프로바이더
 * - 웹소켓 연결 및 이벤트 처리
 * - 전역 스토어 자동 동기화
 * - 실시간 데이터 업데이트
 */

import React, { createContext, useContext, useEffect, useCallback, useRef } from 'react';
import { useParams, usePathname } from 'next/navigation';
import { useSocket } from '@/hooks/useSocket';
import { useGameSessionStore, type GameSessionState } from '@/stores/gameSessionStore';
import { SammoAPI } from '@/lib/api/sammo';

interface GameSessionContextValue {
  // 웹소켓 상태
  isConnected: boolean;
  
  // 세션 정보 (스토어에서 가져옴)
  serverID: string | null;
  generalID: number | null;
  generalName: string | null;
  nationID: number | null;
  officerLevel: number;
  
  // 헬퍼
  isLoggedIn: boolean;
  isChief: boolean;
  hasNation: boolean;
  
  // 액션
  refreshSession: () => Promise<void>;
  clearSession: () => void;
}

const GameSessionContext = createContext<GameSessionContextValue | null>(null);

interface GameSessionProviderProps {
  children: React.ReactNode;
}

export function GameSessionProvider({ children }: GameSessionProviderProps) {
  const params = useParams();
  const pathname = usePathname();
  const serverID = (params?.server as string) || null;
  const initRef = useRef(false);
  
  // 전역 스토어
  const store = useGameSessionStore();
  
  // 웹소켓 훅
  const { 
    isConnected, 
    onGameEvent, 
    onGeneralEvent, 
    onNationEvent,
    onTurnComplete 
  } = useSocket({
    sessionId: serverID || undefined,
    autoConnect: !!serverID,
  });

  // 세션 데이터 로드 (게임 페이지 진입 시)
  const refreshSession = useCallback(async () => {
    if (!serverID) return;
    
    try {
      const frontInfo = await SammoAPI.GetFrontInfo({
        serverID,
        lastNationNoticeDate: new Date().toISOString().slice(0, 19).replace('T', ' '),
        lastGeneralRecordID: 0,
        lastPersonalHistoryID: 0,
        lastGlobalHistoryID: 0,
      });

      if (frontInfo.success && frontInfo.general?.no) {
        store.setSession({
          serverID,
          generalID: frontInfo.general.no,
          generalName: frontInfo.general.name ?? null,
          nationID: frontInfo.nation?.id ?? null,
          nationName: frontInfo.nation?.name ?? null,
          officerLevel: frontInfo.general.officer_level ?? 0,
          cityID: frontInfo.general.city ?? null,
          cityName: frontInfo.city?.name ?? null,
          year: frontInfo.global?.year ?? null,
          month: frontInfo.global?.month ?? null,
          startYear: frontInfo.global?.startyear ?? null,
          turnTerm: frontInfo.global?.turnterm ?? null,
        });
      }
    } catch (error) {
      console.error('[GameSessionProvider] 세션 로드 실패:', error);
    }
  }, [serverID, store]);

  // 게임 페이지 진입 시 세션 초기화
  useEffect(() => {
    if (!serverID) return;
    
    // 서버 ID가 변경되었거나 스토어에 데이터가 없으면 로드
    if (store.serverID !== serverID || !store.generalID) {
      // 게임 관련 페이지인 경우에만 자동 로드
      const isGamePage = pathname?.includes('/game') || 
                        pathname?.includes('/chief') || 
                        pathname?.includes('/processing') ||
                        pathname?.includes('/diplomacy') ||
                        pathname?.includes('/world');
      
      if (isGamePage && !initRef.current) {
        initRef.current = true;
        refreshSession();
      }
    }
  }, [serverID, pathname, store.serverID, store.generalID, refreshSession]);

  // 웹소켓 이벤트 핸들러: 턴 완료
  useEffect(() => {
    if (!isConnected) return;
    
    const cleanup = onTurnComplete((data) => {
      console.log('[GameSessionProvider] 턴 완료:', data);
      // 턴이 완료되면 세션 데이터 새로고침
      refreshSession();
    });
    
    return cleanup;
  }, [isConnected, onTurnComplete, refreshSession]);

  // 웹소켓 이벤트 핸들러: 장수 업데이트
  useEffect(() => {
    if (!isConnected) return;
    
    const cleanup = onGeneralEvent('updated', (data: { generalId: number; updates?: Partial<GameSessionState> }) => {
      // 내 장수 정보가 업데이트되면 스토어 갱신
      if (data.generalId === store.generalID && data.updates) {
        console.log('[GameSessionProvider] 장수 업데이트:', data);
        store.setSession(data.updates);
      }
    });
    
    return cleanup;
  }, [isConnected, onGeneralEvent, store]);

  // 웹소켓 이벤트 핸들러: 게임 이벤트 (월 변경 등)
  useEffect(() => {
    if (!isConnected) return;
    
    const cleanup = onGameEvent('month', (data: { year: number; month: number }) => {
      console.log('[GameSessionProvider] 월 변경:', data);
      store.setGameEnv({ year: data.year, month: data.month });
    });
    
    return cleanup;
  }, [isConnected, onGameEvent, store]);

  // 웹소켓 이벤트 핸들러: 국가 이벤트
  useEffect(() => {
    if (!isConnected) return;
    
    const cleanup = onNationEvent('updated', (data: { nationId: number; updates?: { name?: string } }) => {
      if (data.nationId === store.nationID && data.updates?.name) {
        console.log('[GameSessionProvider] 국가 업데이트:', data);
        store.setSession({ nationName: data.updates.name });
      }
    });
    
    return cleanup;
  }, [isConnected, onNationEvent, store]);

  // 컨텍스트 값
  const contextValue: GameSessionContextValue = {
    isConnected,
    serverID: store.serverID,
    generalID: store.generalID,
    generalName: store.generalName,
    nationID: store.nationID,
    officerLevel: store.officerLevel,
    isLoggedIn: store.isLoggedIn(),
    isChief: store.isChief(),
    hasNation: store.hasNation(),
    refreshSession,
    clearSession: store.clearSession,
  };

  return (
    <GameSessionContext.Provider value={contextValue}>
      {children}
    </GameSessionContext.Provider>
  );
}

/**
 * 게임 세션 컨텍스트 훅
 */
export function useGameSession(): GameSessionContextValue {
  const context = useContext(GameSessionContext);
  if (!context) {
    throw new Error('useGameSession must be used within a GameSessionProvider');
  }
  return context;
}

/**
 * 게임 세션 컨텍스트 훅 (옵셔널 - Provider 없어도 동작)
 */
export function useGameSessionOptional(): GameSessionContextValue | null {
  return useContext(GameSessionContext);
}














