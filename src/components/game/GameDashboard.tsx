/**
 * 게임 대시보드 컴포넌트
 * 모든 게임 정보를 통합하여 표시하는 메인 대시보드
 */

'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useNotifications } from '@/hooks/useNotifications';
import { EventNotificationContainer } from './EventNotification';
import NotificationPanel from './NotificationPanel';
import NationPanel from './NationPanel';
import QuickVotePanel from './QuickVotePanel';
import type { ColorSystem } from '@/types/colorSystem';

interface GeneralInfo {
  no: number;
  name: string;
  nation: number;
  city: number;
  gold: number;
  rice: number;
  leadership: number;
  strength: number;
  intel: number;
  crew: number;
  train: number;
  atmos: number;
  turntime: number;
  killturn: number;
  permission?: number;
  officerLevel?: number;
  troop?: {
    name?: string;
    troopLeaderId?: number;
  };
  [key: string]: any;
}

interface NationInfo {
  id: number;
  name: string;
  color: string;
  level?: number;
  gold?: number;
  rice?: number;
  notice?: {
    msg?: string;
    date?: string;
  };
  [key: string]: any;
}

interface GlobalInfo {
  year: number;
  month: number;
  turnterm: number;
  serverName?: string;
  isLocked?: boolean;
  lastVoteID?: number;
  [key: string]: any;
}

interface CityInfo {
  id: number;
  name: string;
  region?: number;
  level?: number;
  [key: string]: any;
}

interface GameDashboardProps {
  serverID: string;
  general: GeneralInfo;
  nation: NationInfo;
  global: GlobalInfo;
  city: CityInfo;
  colorSystem: ColorSystem;
  className?: string;
  onRefresh?: () => void;
  isLoading?: boolean;
}

type DashboardTab = 'overview' | 'notifications' | 'nation' | 'vote';

export function GameDashboard({
  serverID,
  general,
  nation,
  global: globalInfo,
  city,
  colorSystem,
  className,
  onRefresh,
  isLoading = false,
}: GameDashboardProps) {
  const [activeTab, setActiveTab] = useState<DashboardTab>('overview');
  const [isMobile, setIsMobile] = useState(false);

  // 알림 훅
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll,
    requestBrowserPermission,
  } = useNotifications({ sessionId: serverID });

  // 모바일 감지
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // 브라우저 알림 권한 요청
  useEffect(() => {
    requestBrowserPermission();
  }, [requestBrowserPermission]);

  // 탭 정의
  const tabs = useMemo(() => [
    { key: 'overview' as const, label: '개요', icon: '📊', badge: null },
    { key: 'notifications' as const, label: '알림', icon: '🔔', badge: unreadCount > 0 ? unreadCount : null },
    { key: 'nation' as const, label: '국가', icon: '🏛️', badge: null },
    { key: 'vote' as const, label: '투표', icon: '🗳️', badge: null },
  ], [unreadCount]);

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* 이벤트 알림 토스트 */}
      <EventNotificationContainer
        notifications={notifications}
        onClose={removeNotification}
        onRead={markAsRead}
        maxVisible={3}
        position="top"
      />

      {/* 대시보드 헤더 */}
      <div
        className="px-4 py-3 border-b border-white/10 flex items-center justify-between"
        style={{ backgroundColor: colorSystem.buttonBg + '20' }}
      >
        <div className="flex items-center gap-3">
          <h2 className="font-bold text-white text-sm md:text-base">
            {general.name}
          </h2>
          {nation.id > 0 && (
            <span
              className="px-2 py-0.5 rounded text-xs font-medium"
              style={{
                backgroundColor: nation.color,
                color: colorSystem.buttonText,
              }}
            >
              {nation.name}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400 hidden sm:inline">
            {globalInfo.year}년 {globalInfo.month}월
          </span>
          <button
            type="button"
            onClick={onRefresh}
            disabled={isLoading}
            className={cn(
              'p-2 rounded-lg transition-colors',
              'bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white',
              'disabled:opacity-50 disabled:cursor-not-allowed',
            )}
            aria-label="새로고침"
          >
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
              className={cn(isLoading && 'animate-spin')}
            >
              <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <path d="M3 3v5h5" />
              <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
              <path d="M16 21h5v-5" />
            </svg>
          </button>
        </div>
      </div>

      {/* 탭 네비게이션 */}
      <div className="flex border-b border-white/10 bg-black/20 overflow-x-auto scrollbar-hide">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              'flex-1 min-w-fit px-4 py-2.5 text-xs font-medium transition-colors relative whitespace-nowrap',
              activeTab === tab.key
                ? 'text-white'
                : 'text-gray-400 hover:text-gray-300 hover:bg-white/5',
            )}
          >
            <span className="mr-1.5">{tab.icon}</span>
            {tab.label}
            {tab.badge && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center text-[10px] font-bold rounded-full bg-red-500 text-white">
                {tab.badge > 99 ? '99+' : tab.badge}
              </span>
            )}
            {activeTab === tab.key && (
              <motion.div
                layoutId="activeTab"
                className="absolute bottom-0 left-0 right-0 h-0.5"
                style={{ backgroundColor: colorSystem.accent }}
              />
            )}
          </button>
        ))}
      </div>

      {/* 탭 콘텐츠 */}
      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.15 }}
            className="h-full overflow-y-auto custom-scrollbar"
          >
            {activeTab === 'overview' && (
              <OverviewTab
                serverID={serverID}
                general={general}
                nation={nation}
                global={globalInfo}
                city={city}
                colorSystem={colorSystem}
                unreadCount={unreadCount}
                onTabChange={setActiveTab}
              />
            )}
            {activeTab === 'notifications' && (
              <NotificationPanel
                notifications={notifications}
                onMarkAsRead={markAsRead}
                onMarkAllAsRead={markAllAsRead}
                onRemove={removeNotification}
                onClearAll={clearAll}
                unreadCount={unreadCount}
              />
            )}
            {activeTab === 'nation' && (
              <div className="p-4">
                <NationPanel
                  serverID={serverID}
                  nationId={nation.id}
                  nationName={nation.name}
                  nationColor={nation.color}
                  colorSystem={colorSystem}
                />
              </div>
            )}
            {activeTab === 'vote' && (
              <div className="p-4">
                <QuickVotePanel
                  serverID={serverID}
                  colorSystem={colorSystem}
                />
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* 모바일 퀵 액션 바 */}
      {isMobile && (
        <div className="flex items-center justify-around py-2 px-4 border-t border-white/10 bg-black/40">
          <QuickActionButton
            icon="📋"
            label="명령"
            href={`/${serverID}/game`}
          />
          <QuickActionButton
            icon="🗺️"
            label="지도"
            href={`/${serverID}/map`}
          />
          <QuickActionButton
            icon="💬"
            label="통신"
            href={`/${serverID}/board`}
          />
          <QuickActionButton
            icon="📜"
            label="정보"
            href={`/${serverID}/info`}
          />
        </div>
      )}
    </div>
  );
}

// 개요 탭
function OverviewTab({
  serverID,
  general,
  nation,
  global: globalInfo,
  city,
  colorSystem,
  unreadCount,
  onTabChange,
}: {
  serverID: string;
  general: GeneralInfo;
  nation: NationInfo;
  global: GlobalInfo;
  city: CityInfo;
  colorSystem: ColorSystem;
  unreadCount: number;
  onTabChange: (tab: DashboardTab) => void;
}) {
  return (
    <div className="p-4 space-y-4">
      {/* 상태 요약 카드 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatusCard
          icon="💰"
          label="자금"
          value={general.gold?.toLocaleString() || '0'}
          colorSystem={colorSystem}
        />
        <StatusCard
          icon="🌾"
          label="군량"
          value={general.rice?.toLocaleString() || '0'}
          colorSystem={colorSystem}
        />
        <StatusCard
          icon="⚔️"
          label="병사"
          value={general.crew?.toLocaleString() || '0'}
          colorSystem={colorSystem}
        />
        <StatusCard
          icon="⏰"
          label="턴"
          value={`${general.turntime || 0}`}
          colorSystem={colorSystem}
          highlight={general.turntime >= 2}
        />
      </div>

      {/* 스탯 바 */}
      <div className="bg-black/30 rounded-xl p-4 border border-white/5">
        <h4 className="text-xs font-bold text-gray-400 mb-3 uppercase tracking-wider">능력치</h4>
        <div className="space-y-2">
          <StatBar label="통솔" value={general.leadership || 0} max={100} color="#3B82F6" />
          <StatBar label="무력" value={general.strength || 0} max={100} color="#EF4444" />
          <StatBar label="지력" value={general.intel || 0} max={100} color="#22C55E" />
        </div>
      </div>

      {/* 부대 정보 */}
      <div className="bg-black/30 rounded-xl p-4 border border-white/5">
        <h4 className="text-xs font-bold text-gray-400 mb-3 uppercase tracking-wider">부대 상태</h4>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-500">훈련</span>
            <span className="text-sm font-medium text-white">{general.train || 0}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-500">사기</span>
            <span className="text-sm font-medium text-white">{general.atmos || 0}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-500">위치</span>
            <span className="text-sm font-medium text-white">{city?.name || '-'}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-500">소속 부대</span>
            <span className="text-sm font-medium text-white">{general.troop?.name || '없음'}</span>
          </div>
        </div>
      </div>

      {/* 빠른 링크 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <QuickLinkCard
          icon="🔔"
          label="알림"
          badge={unreadCount}
          onClick={() => onTabChange('notifications')}
        />
        <QuickLinkCard
          icon="🏛️"
          label="국가"
          href={`/${serverID}/nation`}
        />
        <QuickLinkCard
          icon="🗳️"
          label="투표"
          onClick={() => onTabChange('vote')}
        />
        <QuickLinkCard
          icon="📊"
          label="랭킹"
          href={`/${serverID}/info/rankings`}
        />
      </div>

      {/* 국가 방침 (있을 경우) */}
      {nation.id > 0 && nation.notice?.msg && (
        <div
          className="rounded-xl p-4 border"
          style={{
            backgroundColor: nation.color + '10',
            borderColor: nation.color + '30',
          }}
        >
          <h4 className="text-xs font-bold mb-2 uppercase tracking-wider" style={{ color: nation.color }}>
            국가 방침
          </h4>
          <p className="text-sm text-gray-300" dangerouslySetInnerHTML={{ __html: nation.notice.msg }} />
        </div>
      )}

      {/* 컴팩트 투표 패널 */}
      <QuickVotePanel
        serverID={serverID}
        colorSystem={colorSystem}
        compact
      />
    </div>
  );
}

// 상태 카드
function StatusCard({
  icon,
  label,
  value,
  colorSystem,
  highlight = false,
}: {
  icon: string;
  label: string;
  value: string;
  colorSystem: ColorSystem;
  highlight?: boolean;
}) {
  return (
    <div className={cn(
      'bg-black/30 rounded-xl p-3 border border-white/5',
      highlight && 'ring-2 ring-yellow-500/50 bg-yellow-500/5',
    )}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-gray-500">{label}</span>
        <span className="text-lg">{icon}</span>
      </div>
      <div className={cn(
        'text-lg font-bold',
        highlight ? 'text-yellow-400' : 'text-white',
      )}>
        {value}
      </div>
    </div>
  );
}

// 스탯 바
function StatBar({
  label,
  value,
  max,
  color,
}: {
  label: string;
  value: number;
  max: number;
  color: string;
}) {
  const percent = Math.min(100, (value / max) * 100);

  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-gray-500 w-10">{label}</span>
      <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>
      <span className="text-xs font-bold text-white w-8 text-right">{value}</span>
    </div>
  );
}

// 빠른 링크 카드
function QuickLinkCard({
  icon,
  label,
  href,
  badge,
  onClick,
}: {
  icon: string;
  label: string;
  href?: string;
  badge?: number;
  onClick?: () => void;
}) {
  const content = (
    <>
      <span className="text-2xl mb-1">{icon}</span>
      <span className="text-xs text-gray-400">{label}</span>
      {badge && badge > 0 && (
        <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center text-[10px] font-bold rounded-full bg-red-500 text-white">
          {badge > 99 ? '99+' : badge}
        </span>
      )}
    </>
  );

  const baseClass = cn(
    'relative flex flex-col items-center justify-center p-3 rounded-xl',
    'bg-white/5 border border-white/10 hover:bg-white/10 transition-colors cursor-pointer',
  );

  if (href) {
    return (
      <Link href={href} className={baseClass}>
        {content}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} className={baseClass}>
      {content}
    </button>
  );
}

// 퀵 액션 버튼 (모바일)
function QuickActionButton({
  icon,
  label,
  href,
}: {
  icon: string;
  label: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="flex flex-col items-center gap-1 py-1 px-3 rounded-lg hover:bg-white/5 transition-colors"
    >
      <span className="text-lg">{icon}</span>
      <span className="text-[10px] text-gray-400">{label}</span>
    </Link>
  );
}

export default GameDashboard;


