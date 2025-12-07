import { create } from 'zustand';
import { Gin7Faction, Gin7AuthorityCard } from '@/types/gin7';

export interface Gin7UserCharacter {
  id: string;
  name: string;
  faction: Gin7Faction;
  rank: string;
  position?: string;
  pcp: number;
  maxPcp: number;
  mcp: number;
  maxMcp: number;
  portraitUrl?: string;
}

export interface Gin7Notification {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  manualRef?: string;
}

interface Gin7UserStoreState {
  // 현재 캐릭터
  character: Gin7UserCharacter | null;
  setCharacter: (character: Gin7UserCharacter | null) => void;

  // 권한 카드
  authorityCards: Gin7AuthorityCard[];
  setAuthorityCards: (cards: Gin7AuthorityCard[]) => void;
  activeCardId: string | null;
  setActiveCardId: (id: string | null) => void;

  // 알림
  notifications: Gin7Notification[];
  addNotification: (notification: Omit<Gin7Notification, 'id' | 'timestamp' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
  unreadCount: () => number;

  // CP 회복 타이머
  cpRegenRemaining: number;
  setCpRegenRemaining: (seconds: number) => void;

  // 설정
  settings: {
    soundEnabled: boolean;
    notificationsEnabled: boolean;
    theme: 'empire' | 'alliance' | 'neutral';
    compactMode: boolean;
  };
  updateSettings: (settings: Partial<Gin7UserStoreState['settings']>) => void;
}

export const useGin7UserStore = create<Gin7UserStoreState>((set, get) => ({
  // 현재 캐릭터
  character: null,
  setCharacter: (character) => set({ character }),

  // 권한 카드
  authorityCards: [],
  setAuthorityCards: (cards) => set({ authorityCards: cards }),
  activeCardId: null,
  setActiveCardId: (id) => set({ activeCardId: id }),

  // 알림
  notifications: [],

  addNotification: (notification) =>
    set((state) => ({
      notifications: [
        {
          ...notification,
          id: crypto.randomUUID(),
          timestamp: new Date().toISOString(),
          read: false,
        },
        ...state.notifications,
      ].slice(0, 100), // 최대 100개 유지
    })),

  markAsRead: (id) =>
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      ),
    })),

  markAllAsRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
    })),

  clearNotifications: () => set({ notifications: [] }),

  unreadCount: () => get().notifications.filter((n) => !n.read).length,

  // CP 회복 타이머
  cpRegenRemaining: 0,
  setCpRegenRemaining: (seconds) => set({ cpRegenRemaining: seconds }),

  // 설정
  settings: {
    soundEnabled: true,
    notificationsEnabled: true,
    theme: 'neutral',
    compactMode: false,
  },

  updateSettings: (newSettings) =>
    set((state) => ({
      settings: { ...state.settings, ...newSettings },
    })),
}));

// Window에 스토어 노출 (디버깅용)
if (typeof window !== 'undefined') {
  const globalWindow = window as Window & { __OPEN_SAM_STORES__?: Record<string, unknown> };
  globalWindow.__OPEN_SAM_STORES__ = globalWindow.__OPEN_SAM_STORES__ ?? {};
  globalWindow.__OPEN_SAM_STORES__.gin7User = useGin7UserStore;
}

