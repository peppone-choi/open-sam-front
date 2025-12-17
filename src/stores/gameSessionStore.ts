/**
 * 게임 세션 스토어
 * 현재 접속 중인 서버/장수/국가 정보를 전역으로 관리
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// 알림 타입
export interface GameNotification {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success' | 'battle' | 'diplomacy' | 'message';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  data?: any;
}

export interface GameSessionState {
  // 현재 세션 정보
  serverID: string | null;
  generalID: number | null;
  generalName: string | null;
  nationID: number | null;
  nationName: string | null;
  officerLevel: number;
  cityID: number | null;
  cityName: string | null;

  // 게임 환경 정보
  year: number | null;
  month: number | null;
  startYear: number | null;
  turnTerm: number | null;

  // 웹소켓 연결 상태
  isSocketConnected: boolean;

  // 실시간 데이터
  notifications: GameNotification[];
  unreadCount: number;
  lastTurnCompleteAt: Date | null;

  // 액션
  setSession: (data: Partial<GameSessionState>) => void;
  setServerID: (serverID: string | null) => void;
  setGeneralID: (generalID: number | null) => void;
  setGeneral: (data: { id: number; name: string; nation?: number; nationName?: string; officerLevel?: number; city?: number; cityName?: string }) => void;
  setNation: (data: { id: number; name: string }) => void;
  setGameEnv: (data: { year?: number; month?: number; startYear?: number; turnTerm?: number }) => void;
  setSocketConnected: (connected: boolean) => void;
  clearSession: () => void;

  // 알림 액션
  addNotification: (notification: Omit<GameNotification, 'id' | 'timestamp' | 'read'>) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  clearNotifications: () => void;
  setLastTurnComplete: (date: Date) => void;
  
  // 헬퍼
  isLoggedIn: () => boolean;
  isChief: () => boolean;
  hasNation: () => boolean;
}

const initialState = {
  serverID: null,
  generalID: null,
  generalName: null,
  nationID: null,
  nationName: null,
  officerLevel: 0,
  cityID: null,
  cityName: null,
  year: null,
  month: null,
  startYear: null,
  turnTerm: null,
  isSocketConnected: false,
  notifications: [] as GameNotification[],
  unreadCount: 0,
  lastTurnCompleteAt: null,
};

export const useGameSessionStore = create<GameSessionState>()(
  persist(
    (set, get) => ({
      ...initialState,

      // 세션 전체 설정
      setSession: (data) => {
        set((state) => ({ ...state, ...data }));
      },

      // 서버 ID 설정
      setServerID: (serverID) => {
        set({ serverID });
      },

      // 장수 ID 설정
      setGeneralID: (generalID) => {
        set({ generalID });
      },

      // 장수 정보 설정
      setGeneral: (data) => {
        set({
          generalID: data.id,
          generalName: data.name,
          nationID: data.nation ?? null,
          nationName: data.nationName ?? null,
          officerLevel: data.officerLevel ?? 0,
          cityID: data.city ?? null,
          cityName: data.cityName ?? null,
        });
      },

      // 국가 정보 설정
      setNation: (data) => {
        set({
          nationID: data.id,
          nationName: data.name,
        });
      },

      // 게임 환경 정보 설정
      setGameEnv: (data) => {
        set({
          year: data.year ?? get().year,
          month: data.month ?? get().month,
          startYear: data.startYear ?? get().startYear,
          turnTerm: data.turnTerm ?? get().turnTerm,
        });
      },

      // 웹소켓 연결 상태 설정
      setSocketConnected: (connected) => {
        set({ isSocketConnected: connected });
      },

      // 세션 초기화
      clearSession: () => {
        set(initialState);
      },

      // 알림 추가
      addNotification: (notification) => {
        const newNotification: GameNotification = {
          ...notification,
          id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          timestamp: new Date(),
          read: false,
        };
        set((state) => ({
          notifications: [newNotification, ...state.notifications].slice(0, 50), // 최대 50개
          unreadCount: state.unreadCount + 1,
        }));
      },

      // 알림 읽음 처리
      markNotificationRead: (id) => {
        set((state) => {
          const notifications = state.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n
          );
          const unreadCount = notifications.filter((n) => !n.read).length;
          return { notifications, unreadCount };
        });
      },

      // 모든 알림 읽음 처리
      markAllNotificationsRead: () => {
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, read: true })),
          unreadCount: 0,
        }));
      },

      // 알림 초기화
      clearNotifications: () => {
        set({ notifications: [], unreadCount: 0 });
      },

      // 마지막 턴 완료 시간 설정
      setLastTurnComplete: (date) => {
        set({ lastTurnCompleteAt: date });
      },

      // 로그인 여부 확인
      isLoggedIn: () => {
        const state = get();
        return state.serverID !== null && state.generalID !== null;
      },

      // 수뇌 여부 확인 (officerLevel >= 5)
      isChief: () => {
        return get().officerLevel >= 5;
      },

      // 국가 소속 여부 확인
      hasNation: () => {
        const state = get();
        return state.nationID !== null && state.nationID > 0;
      },
    }),
    {
      name: 'game-session-storage',
      storage: createJSONStorage(() => sessionStorage), // 탭별로 분리
      // 알림, 웹소켓 상태는 persist하지 않음
      partialize: (state) => ({
        serverID: state.serverID,
        generalID: state.generalID,
        generalName: state.generalName,
        nationID: state.nationID,
        nationName: state.nationName,
        officerLevel: state.officerLevel,
        cityID: state.cityID,
        cityName: state.cityName,
        year: state.year,
        month: state.month,
        startYear: state.startYear,
        turnTerm: state.turnTerm,
        // isSocketConnected, notifications, unreadCount, lastTurnCompleteAt는 제외
      }),
    }
  )
);

// 전역 디버그 접근
if (typeof window !== 'undefined') {
  const globalWindow = window as Window & { __OPEN_SAM_STORES__?: Record<string, any> };
  globalWindow.__OPEN_SAM_STORES__ = globalWindow.__OPEN_SAM_STORES__ ?? {};
  globalWindow.__OPEN_SAM_STORES__.gameSession = useGameSessionStore;
}

/**
 * 현재 게임 세션 정보 가져오기 (비컴포넌트용)
 */
export function getGameSession(): GameSessionState {
  return useGameSessionStore.getState();
}

/**
 * API 호출 시 필요한 기본 파라미터 가져오기
 */
export function getAPIParams(): { serverID: string; generalID: number } | null {
  const state = useGameSessionStore.getState();
  if (!state.serverID || !state.generalID) {
    return null;
  }
  return {
    serverID: state.serverID,
    generalID: state.generalID,
  };
}

