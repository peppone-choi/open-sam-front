/**
 * 알림 시스템 훅
 * 게임 내 다양한 이벤트 알림을 관리
 */

'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSocket } from './useSocket';

export type NotificationType = 
  | 'event'      // 게임 이벤트 (재해, 풍년 등)
  | 'diplomacy'  // 외교 제안
  | 'battle'     // 전투 결과
  | 'vote'       // 투표/설문
  | 'system'     // 시스템 알림
  | 'turn'       // 턴 관련
  | 'mail'       // 새 메일
  | 'chat';      // 새 채팅

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  createdAt: Date;
  priority: 'low' | 'medium' | 'high' | 'critical';
  icon?: string;
  data?: Record<string, unknown>;
  actionUrl?: string;
  expiresAt?: Date;
}

export interface NotificationEventData {
  type: string;
  title: string;
  message: string;
  severity?: 'info' | 'warning' | 'error' | 'success';
  data?: Record<string, unknown>;
}

// 이벤트 타입별 기본 아이콘
const EVENT_ICONS: Record<string, string> = {
  // 재해
  disaster: '🌊',
  earthquake: '🌍',
  plague: '🦠',
  locust: '🦗',
  drought: '☀️',
  flood: '🌊',
  fire: '🔥',
  
  // 풍년/번영
  harvest: '🌾',
  prosperity: '✨',
  blessing: '🎊',
  
  // 도적/반란
  bandit: '⚔️',
  rebellion: '🏴',
  
  // 외교
  diplomacy: '🤝',
  alliance: '🏳️',
  war: '⚔️',
  treaty: '📜',
  
  // 전투
  battle: '⚔️',
  victory: '🏆',
  defeat: '💀',
  siege: '🏰',
  
  // 투표
  vote: '🗳️',
  poll: '📊',
  
  // 시스템
  system: '⚙️',
  maintenance: '🔧',
  update: '📢',
  
  // 턴
  turn: '⏰',
  month: '📅',
  
  // 통신
  mail: '📬',
  chat: '💬',
};

// 이벤트 타입별 우선순위
const EVENT_PRIORITIES: Record<string, Notification['priority']> = {
  disaster: 'high',
  earthquake: 'high',
  plague: 'critical',
  battle: 'high',
  victory: 'medium',
  defeat: 'high',
  diplomacy: 'medium',
  war: 'critical',
  vote: 'medium',
  turn: 'low',
  mail: 'medium',
  chat: 'low',
  system: 'high',
};

interface UseNotificationsOptions {
  maxNotifications?: number;
  autoMarkReadDelay?: number;
  enableBrowserNotifications?: boolean;
  sessionId?: string;
}

export function useNotifications(options: UseNotificationsOptions = {}) {
  const {
    maxNotifications = 50,
    autoMarkReadDelay = 0,
    enableBrowserNotifications = true,
    sessionId,
  } = options;

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [browserPermission, setBrowserPermission] = useState<NotificationPermission>('default');
  
  const socketOptions = useMemo(() => ({ 
    sessionId, 
    autoConnect: !!sessionId 
  }), [sessionId]);
  
  const { 
    socket, 
    isConnected, 
    onGameEvent, 
    onNationEvent, 
    onNewMail, 
    onNewChatMessage,
    onTurnComplete,
  } = useSocket(socketOptions);

  // 브라우저 알림 권한 요청
  const requestBrowserPermission = useCallback(async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    
    if (Notification.permission === 'granted') {
      setBrowserPermission('granted');
      return;
    }
    
    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      setBrowserPermission(permission);
    }
  }, []);

  // 브라우저 알림 표시
  const showBrowserNotification = useCallback((notification: Notification) => {
    if (!enableBrowserNotifications) return;
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;
    
    try {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/icons/game-icon.png',
        tag: notification.id,
        requireInteraction: notification.priority === 'critical',
      });
    } catch (error) {
      console.warn('브라우저 알림 표시 실패:', error);
    }
  }, [enableBrowserNotifications]);

  // 알림 추가
  const addNotification = useCallback((
    type: NotificationType,
    title: string,
    message: string,
    data?: Record<string, unknown>,
    customIcon?: string,
  ) => {
    const id = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const subType = (data?.subType as string) || type;
    
    const notification: Notification = {
      id,
      type,
      title,
      message,
      read: false,
      createdAt: new Date(),
      priority: EVENT_PRIORITIES[subType] || 'medium',
      icon: customIcon || EVENT_ICONS[subType] || EVENT_ICONS[type] || '📢',
      data,
    };

    setNotifications((prev) => {
      const updated = [notification, ...prev].slice(0, maxNotifications);
      return updated;
    });

    // 브라우저 알림
    if (notification.priority !== 'low') {
      showBrowserNotification(notification);
    }

    return notification;
  }, [maxNotifications, showBrowserNotification]);

  // 알림 읽음 처리
  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }, []);

  // 모든 알림 읽음 처리
  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  // 알림 삭제
  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  // 모든 알림 삭제
  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  // 읽지 않은 알림 수
  const unreadCount = useMemo(() => 
    notifications.filter((n) => !n.read).length
  , [notifications]);

  // 타입별 알림 필터
  const getNotificationsByType = useCallback((type: NotificationType) => 
    notifications.filter((n) => n.type === type)
  , [notifications]);

  // 우선순위별 알림 필터
  const getHighPriorityNotifications = useCallback(() =>
    notifications.filter((n) => n.priority === 'high' || n.priority === 'critical')
  , [notifications]);

  // 최신 읽지 않은 알림
  const latestUnread = useMemo(() =>
    notifications.find((n) => !n.read)
  , [notifications]);

  // 소켓 이벤트 리스너 등록
  useEffect(() => {
    if (!socket || !isConnected) return;

    // 게임 이벤트 (재해, 풍년 등)
    const cleanupGameEvent = onGameEvent('event', (data: NotificationEventData) => {
      addNotification(
        'event',
        data.title || '게임 이벤트',
        data.message,
        { subType: data.type, ...data.data }
      );
    });

    // 외교 이벤트
    const cleanupDiplomacy = onNationEvent('diplomacy', (data: NotificationEventData) => {
      addNotification(
        'diplomacy',
        data.title || '외교 제안',
        data.message,
        data.data
      );
    });

    // 전투 결과
    const cleanupBattle = onGameEvent('battle:result', (data: NotificationEventData) => {
      addNotification(
        'battle',
        data.title || '전투 결과',
        data.message,
        data.data
      );
    });

    // 투표/설문
    const cleanupVote = onGameEvent('vote:new', (data: NotificationEventData) => {
      addNotification(
        'vote',
        data.title || '새로운 투표',
        data.message,
        data.data
      );
    });

    // 턴 완료
    const cleanupTurn = onTurnComplete((data) => {
      addNotification(
        'turn',
        '턴 완료',
        `${data.turnNumber}턴이 완료되었습니다.`,
        { turnNumber: data.turnNumber }
      );
    });

    // 새 메일
    const cleanupMail = onNewMail((data) => {
      addNotification(
        'mail',
        '새 메일',
        `${data.fromName}님으로부터 메일이 도착했습니다.`,
        { mailId: data.mailId, subject: data.subject }
      );
    });

    // 새 채팅
    const cleanupChat = onNewChatMessage((data) => {
      addNotification(
        'chat',
        '새 메시지',
        `${data.senderName}: ${data.message.substring(0, 50)}${data.message.length > 50 ? '...' : ''}`,
        { messageId: data.messageId, channelType: data.channelType }
      );
    });

    return () => {
      cleanupGameEvent();
      cleanupDiplomacy();
      cleanupBattle();
      cleanupVote();
      cleanupTurn();
      cleanupMail();
      cleanupChat();
    };
  }, [socket, isConnected, onGameEvent, onNationEvent, onTurnComplete, onNewMail, onNewChatMessage, addNotification]);

  // 초기화 시 브라우저 알림 권한 확인
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setBrowserPermission(Notification.permission);
    }
  }, []);

  // 자동 읽음 처리
  useEffect(() => {
    if (autoMarkReadDelay <= 0) return;
    
    const timer = setTimeout(() => {
      markAllAsRead();
    }, autoMarkReadDelay);

    return () => clearTimeout(timer);
  }, [notifications, autoMarkReadDelay, markAllAsRead]);

  return {
    // 데이터
    notifications,
    unreadCount,
    latestUnread,
    browserPermission,
    isConnected,

    // 액션
    addNotification,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll,
    requestBrowserPermission,

    // 필터
    getNotificationsByType,
    getHighPriorityNotifications,
  };
}

export type { UseNotificationsOptions };


