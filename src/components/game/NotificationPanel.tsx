/**
 * 알림 패널 컴포넌트
 * 게임 내 모든 알림을 리스트 형태로 표시하는 패널
 */

'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { Notification, NotificationType } from '@/hooks/useNotifications';

// 타입별 라벨 및 아이콘
const TYPE_CONFIG: Record<NotificationType, { label: string; color: string }> = {
  event: { label: '이벤트', color: 'bg-amber-500' },
  diplomacy: { label: '외교', color: 'bg-blue-500' },
  battle: { label: '전투', color: 'bg-red-500' },
  vote: { label: '투표', color: 'bg-purple-500' },
  system: { label: '시스템', color: 'bg-slate-500' },
  turn: { label: '턴', color: 'bg-emerald-500' },
  mail: { label: '메일', color: 'bg-indigo-500' },
  chat: { label: '채팅', color: 'bg-cyan-500' },
};

interface NotificationPanelProps {
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onRemove: (id: string) => void;
  onClearAll: () => void;
  unreadCount: number;
  className?: string;
}

type FilterType = 'all' | NotificationType;

export function NotificationPanel({
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onRemove,
  onClearAll,
  unreadCount,
  className,
}: NotificationPanelProps) {
  const [filter, setFilter] = useState<FilterType>('all');
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);

  // 필터링된 알림 목록
  const filteredNotifications = useMemo(() => {
    return notifications.filter((n) => {
      if (showUnreadOnly && n.read) return false;
      if (filter !== 'all' && n.type !== filter) return false;
      return true;
    });
  }, [notifications, filter, showUnreadOnly]);

  // 타입별 카운트
  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = { all: notifications.length };
    notifications.forEach((n) => {
      counts[n.type] = (counts[n.type] || 0) + 1;
    });
    return counts;
  }, [notifications]);

  // 날짜별 그룹핑
  const groupedByDate = useMemo(() => {
    const groups: Record<string, Notification[]> = {};
    
    filteredNotifications.forEach((n) => {
      const dateKey = getDateKey(n.createdAt);
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(n);
    });
    
    return groups;
  }, [filteredNotifications]);

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* 헤더 */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-white/5">
        <div className="flex items-center gap-2">
          <h3 className="font-bold text-white text-sm flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
              <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
            </svg>
            알림
          </h3>
          {unreadCount > 0 && (
            <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-red-500 text-white">
              {unreadCount}
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onMarkAllAsRead}
            disabled={unreadCount === 0}
            className="text-[10px] px-2 py-1 rounded bg-white/10 hover:bg-white/20 
                       text-gray-400 hover:text-white transition-colors disabled:opacity-50"
          >
            모두 읽음
          </button>
          <button
            type="button"
            onClick={onClearAll}
            disabled={notifications.length === 0}
            className="text-[10px] px-2 py-1 rounded bg-red-500/20 hover:bg-red-500/30 
                       text-red-400 hover:text-red-300 transition-colors disabled:opacity-50"
          >
            모두 삭제
          </button>
        </div>
      </div>

      {/* 필터 탭 */}
      <div className="flex items-center gap-1 px-3 py-2 border-b border-white/5 overflow-x-auto scrollbar-hide">
        {(['all', 'event', 'diplomacy', 'battle', 'vote', 'system', 'turn', 'mail', 'chat'] as FilterType[]).map((type) => {
          const count = typeCounts[type] || 0;
          const isActive = filter === type;
          const config = type === 'all' ? null : TYPE_CONFIG[type];
          
          return (
            <button
              key={type}
              type="button"
              onClick={() => setFilter(type)}
              className={cn(
                'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium whitespace-nowrap transition-all',
                isActive
                  ? 'bg-white/20 text-white'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-gray-300',
              )}
            >
              {config && (
                <span className={cn('w-1.5 h-1.5 rounded-full', config.color)} />
              )}
              {type === 'all' ? '전체' : config?.label}
              {count > 0 && (
                <span className="text-[8px] opacity-60">({count})</span>
              )}
            </button>
          );
        })}
      </div>

      {/* 읽지 않은 것만 보기 토글 */}
      <div className="flex items-center justify-between px-4 py-2 bg-black/20">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={showUnreadOnly}
            onChange={(e) => setShowUnreadOnly(e.target.checked)}
            className="w-3.5 h-3.5 rounded border-gray-600 bg-gray-800 text-blue-500 focus:ring-blue-500"
          />
          <span className="text-[11px] text-gray-400">읽지 않은 알림만</span>
        </label>
        <span className="text-[10px] text-gray-500">
          {filteredNotifications.length}개
        </span>
      </div>

      {/* 알림 리스트 */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {filteredNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 py-12">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="opacity-30 mb-3"
            >
              <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
              <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
              <line x1="1" y1="1" x2="23" y2="23" />
            </svg>
            <p className="text-sm">알림이 없습니다</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {Object.entries(groupedByDate).map(([dateKey, items]) => (
              <div key={dateKey}>
                {/* 날짜 헤더 */}
                <div className="px-4 py-2 bg-black/30 sticky top-0 z-10">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                    {dateKey}
                  </span>
                </div>
                
                {/* 알림 아이템들 */}
                <AnimatePresence>
                  {items.map((notification) => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                      onMarkAsRead={onMarkAsRead}
                      onRemove={onRemove}
                    />
                  ))}
                </AnimatePresence>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// 개별 알림 아이템
interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  onRemove: (id: string) => void;
}

function NotificationItem({ notification, onMarkAsRead, onRemove }: NotificationItemProps) {
  const [isHovered, setIsHovered] = useState(false);
  const config = TYPE_CONFIG[notification.type];

  const handleClick = useCallback(() => {
    if (!notification.read) {
      onMarkAsRead(notification.id);
    }
    if (notification.actionUrl) {
      window.location.href = notification.actionUrl;
    }
  }, [notification, onMarkAsRead]);

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20, height: 0 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
      className={cn(
        'relative px-4 py-3 cursor-pointer transition-colors',
        notification.read 
          ? 'bg-transparent hover:bg-white/5' 
          : 'bg-white/5 hover:bg-white/10',
      )}
    >
      {/* 읽지 않음 인디케이터 */}
      {!notification.read && (
        <div className="absolute left-1.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-blue-500" />
      )}

      <div className="flex items-start gap-3">
        {/* 아이콘 */}
        <div className="flex-shrink-0 text-2xl mt-0.5">
          {notification.icon}
        </div>

        {/* 콘텐츠 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={cn(
              'px-1.5 py-0.5 rounded text-[9px] font-bold uppercase',
              config.color,
              'text-white',
            )}>
              {config.label}
            </span>
            <span className="text-[10px] text-gray-500">
              {formatRelativeTime(notification.createdAt)}
            </span>
          </div>
          
          <h4 className={cn(
            'font-medium text-sm mt-1',
            notification.read ? 'text-gray-400' : 'text-white',
          )}>
            {notification.title}
          </h4>
          
          <p className={cn(
            'text-xs mt-0.5 line-clamp-2',
            notification.read ? 'text-gray-500' : 'text-gray-400',
          )}>
            {notification.message}
          </p>

          {/* 우선순위 표시 */}
          {(notification.priority === 'high' || notification.priority === 'critical') && (
            <div className="flex items-center gap-1 mt-1.5">
              <span className={cn(
                'text-[9px] font-bold px-1.5 py-0.5 rounded',
                notification.priority === 'critical' 
                  ? 'bg-red-500/20 text-red-400' 
                  : 'bg-yellow-500/20 text-yellow-400',
              )}>
                {notification.priority === 'critical' ? '긴급' : '중요'}
              </span>
            </div>
          )}
        </div>

        {/* 액션 버튼 */}
        <AnimatePresence>
          {isHovered && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onRemove(notification.id);
              }}
              className="flex-shrink-0 p-1.5 rounded-full bg-red-500/20 hover:bg-red-500/40 
                         text-red-400 transition-colors"
              aria-label="삭제"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 6h18" />
                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
              </svg>
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// 날짜 키 생성
function getDateKey(date: Date): string {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const yesterdayOnly = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());

  if (dateOnly.getTime() === todayOnly.getTime()) return '오늘';
  if (dateOnly.getTime() === yesterdayOnly.getTime()) return '어제';

  return date.toLocaleDateString('ko-KR', {
    month: 'long',
    day: 'numeric',
  });
}

// 상대 시간 포맷
function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  if (diff < 60000) return '방금';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}분 전`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}시간 전`;
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}일 전`;

  return date.toLocaleDateString('ko-KR', {
    month: 'short',
    day: 'numeric',
  });
}

export default NotificationPanel;


