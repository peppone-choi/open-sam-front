/**
 * 이벤트 알림 컴포넌트
 * 게임 내 발생하는 다양한 이벤트를 화면 상단에 토스트 형태로 표시
 */

'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { Notification, NotificationType } from '@/hooks/useNotifications';

// 이벤트 타입별 스타일 설정
const EVENT_STYLES: Record<NotificationType, {
  bg: string;
  border: string;
  icon: string;
  glow: string;
}> = {
  event: {
    bg: 'bg-gradient-to-r from-amber-900/90 to-orange-900/90',
    border: 'border-amber-500/50',
    icon: 'text-amber-300',
    glow: 'shadow-amber-500/20',
  },
  diplomacy: {
    bg: 'bg-gradient-to-r from-blue-900/90 to-cyan-900/90',
    border: 'border-blue-500/50',
    icon: 'text-blue-300',
    glow: 'shadow-blue-500/20',
  },
  battle: {
    bg: 'bg-gradient-to-r from-red-900/90 to-rose-900/90',
    border: 'border-red-500/50',
    icon: 'text-red-300',
    glow: 'shadow-red-500/20',
  },
  vote: {
    bg: 'bg-gradient-to-r from-purple-900/90 to-violet-900/90',
    border: 'border-purple-500/50',
    icon: 'text-purple-300',
    glow: 'shadow-purple-500/20',
  },
  system: {
    bg: 'bg-gradient-to-r from-slate-800/90 to-gray-800/90',
    border: 'border-slate-500/50',
    icon: 'text-slate-300',
    glow: 'shadow-slate-500/20',
  },
  turn: {
    bg: 'bg-gradient-to-r from-emerald-900/90 to-teal-900/90',
    border: 'border-emerald-500/50',
    icon: 'text-emerald-300',
    glow: 'shadow-emerald-500/20',
  },
  mail: {
    bg: 'bg-gradient-to-r from-indigo-900/90 to-blue-900/90',
    border: 'border-indigo-500/50',
    icon: 'text-indigo-300',
    glow: 'shadow-indigo-500/20',
  },
  chat: {
    bg: 'bg-gradient-to-r from-cyan-900/90 to-sky-900/90',
    border: 'border-cyan-500/50',
    icon: 'text-cyan-300',
    glow: 'shadow-cyan-500/20',
  },
};

// 우선순위별 스타일
const PRIORITY_STYLES: Record<Notification['priority'], string> = {
  low: 'opacity-90',
  medium: 'opacity-100',
  high: 'ring-2 ring-yellow-500/50',
  critical: 'ring-2 ring-red-500/50 animate-pulse',
};

interface EventNotificationProps {
  notification: Notification;
  onClose: () => void;
  onRead?: () => void;
  autoCloseDelay?: number;
  className?: string;
}

export function EventNotification({
  notification,
  onClose,
  onRead,
  autoCloseDelay = 5000,
  className,
}: EventNotificationProps) {
  const [isVisible, setIsVisible] = useState(true);
  const style = EVENT_STYLES[notification.type] || EVENT_STYLES.system;

  useEffect(() => {
    if (autoCloseDelay > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onClose, 300); // 애니메이션 완료 후 제거
      }, autoCloseDelay);
      
      return () => clearTimeout(timer);
    }
  }, [autoCloseDelay, onClose]);

  const handleClick = () => {
    if (onRead && !notification.read) {
      onRead();
    }
  };

  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -30, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          onClick={handleClick}
          className={cn(
            'relative backdrop-blur-md rounded-xl border shadow-2xl cursor-pointer',
            'transition-all duration-200 hover:scale-[1.02]',
            style.bg,
            style.border,
            style.glow,
            PRIORITY_STYLES[notification.priority],
            'max-w-md w-full mx-auto',
            className,
          )}
        >
          {/* 우선순위 인디케이터 */}
          {(notification.priority === 'high' || notification.priority === 'critical') && (
            <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-red-500 animate-ping" />
          )}

          <div className="flex items-start gap-3 p-4">
            {/* 아이콘 */}
            <div className={cn(
              'flex-shrink-0 text-3xl filter drop-shadow-lg',
              style.icon,
            )}>
              {notification.icon}
            </div>

            {/* 콘텐츠 */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <h4 className="font-bold text-white text-sm truncate">
                  {notification.title}
                </h4>
                <span className="text-[10px] text-white/60 whitespace-nowrap">
                  {formatTime(notification.createdAt)}
                </span>
              </div>
              <p className="text-white/80 text-xs mt-1 line-clamp-2">
                {notification.message}
              </p>
              
              {/* 추가 정보 */}
              {notification.data?.location !== undefined && notification.data?.location !== null && (
                <div className="mt-2 text-[10px] text-white/50">
                  📍 {String(notification.data.location as string)}
                </div>
              )}
            </div>

            {/* 닫기 버튼 */}
            <button
              type="button"
              onClick={handleClose}
              className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full 
                         bg-white/10 hover:bg-white/20 transition-colors text-white/70 hover:text-white"
              aria-label="알림 닫기"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </svg>
            </button>
          </div>

          {/* 진행 바 (자동 닫힘 시) */}
          {autoCloseDelay > 0 && (
            <motion.div
              className="absolute bottom-0 left-0 h-0.5 bg-white/30 rounded-b-xl"
              initial={{ width: '100%' }}
              animate={{ width: '0%' }}
              transition={{ duration: autoCloseDelay / 1000, ease: 'linear' }}
            />
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// 시간 포맷
function formatTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  
  if (diff < 60000) return '방금';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}분 전`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}시간 전`;
  
  return date.toLocaleTimeString('ko-KR', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: false,
  });
}

// 이벤트 알림 토스트 컨테이너
interface EventNotificationContainerProps {
  notifications: Notification[];
  onClose: (id: string) => void;
  onRead?: (id: string) => void;
  maxVisible?: number;
  position?: 'top' | 'top-right' | 'top-left';
}

export function EventNotificationContainer({
  notifications,
  onClose,
  onRead,
  maxVisible = 3,
  position = 'top',
}: EventNotificationContainerProps) {
  const visibleNotifications = notifications
    .filter((n) => !n.read)
    .slice(0, maxVisible);

  const positionClasses: Record<string, string> = {
    top: 'top-4 left-1/2 -translate-x-1/2',
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
  };

  return (
    <div
      className={cn(
        'fixed z-[100] flex flex-col gap-3 w-full max-w-md px-4',
        positionClasses[position],
      )}
    >
      <AnimatePresence>
        {visibleNotifications.map((notification, index) => (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ delay: index * 0.1 }}
          >
            <EventNotification
              notification={notification}
              onClose={() => onClose(notification.id)}
              onRead={() => onRead?.(notification.id)}
              autoCloseDelay={5000 + index * 1000}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

export default EventNotification;


