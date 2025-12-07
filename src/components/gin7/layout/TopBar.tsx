'use client';

import { useEffect, useState } from 'react';
import { useGin7Store } from '@/stores/gin7Store';
import { 
  ClockIcon, 
  CurrencyDollarIcon, 
  UserGroupIcon, 
  BellIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import { BellAlertIcon } from '@heroicons/react/24/solid';

interface ResourceDisplayProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color?: string;
}

function ResourceDisplay({ icon, label, value, color = 'text-foreground' }: ResourceDisplayProps) {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-space-panel/50 rounded-lg border border-white/5 hover:border-white/10 transition-colors">
      <span className="text-foreground-muted">{icon}</span>
      <div className="flex flex-col">
        <span className="text-[10px] uppercase tracking-wider text-foreground-muted">{label}</span>
        <span className={`text-sm font-mono font-semibold ${color}`}>{value}</span>
      </div>
    </div>
  );
}

export default function TopBar() {
  const sessionSnapshot = useGin7Store((state) => state.sessionSnapshot);
  const session = useGin7Store((state) => state.session);
  const loading = useGin7Store((state) => state.loading);
  const [hasNewNotifications, setHasNewNotifications] = useState(false);

  // 알림 체크
  useEffect(() => {
    if (sessionSnapshot?.session?.notifications?.length) {
      setHasNewNotifications(true);
    }
  }, [sessionSnapshot?.session?.notifications]);

  // 게임 시간 파싱
  const gameTimeStr = sessionSnapshot?.clock?.gameTime || '---';
  const phase = sessionSnapshot?.clock?.phase || 'unknown';

  // 자원 정보 (commandPoints에서 가져옴)
  const cp = sessionSnapshot?.commandPoints;
  const totalPcp = cp?.totals?.pcp ?? 0;
  const totalMcp = cp?.totals?.mcp ?? 0;
  const rosterSize = cp?.rosterSize ?? 0;

  // 세션 정보
  const sessionTitle = sessionSnapshot?.session?.title || session?.profile?.displayName || 'GIN7';
  const factions = sessionSnapshot?.session?.factions ?? [];
  const totalPlayers = factions.reduce((sum, f) => sum + f.activePlayers, 0);

  return (
    <header className="sticky top-0 z-50 h-14 bg-space-bg/95 backdrop-blur-sm border-b border-white/5">
      <div className="flex items-center justify-between h-full px-4">
        {/* Left: Logo & Session Title */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-empire-blue to-alliance-blue rounded-lg flex items-center justify-center">
              <SparklesIcon className="w-5 h-5 text-white" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-sm font-bold text-foreground">GIN7</h1>
              <p className="text-[10px] text-foreground-muted truncate max-w-[120px]">{sessionTitle}</p>
            </div>
          </div>
        </div>

        {/* Center: Game Time */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 px-4 py-1.5 bg-space-panel rounded-xl border border-white/10">
            <ClockIcon className="w-5 h-5 text-alliance-blue" />
            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-wider text-foreground-muted">게임 시간</span>
              <span className="text-sm font-mono font-bold text-foreground">
                {loading ? '로딩중...' : gameTimeStr}
              </span>
            </div>
            <div className={`ml-2 px-2 py-0.5 rounded-full text-[10px] font-medium uppercase ${
              phase === 'running' ? 'bg-hud-success/20 text-hud-success' :
              phase === 'paused' ? 'bg-yellow-500/20 text-yellow-400' :
              'bg-white/10 text-foreground-muted'
            }`}>
              {phase}
            </div>
          </div>
        </div>

        {/* Right: Resources & Notifications */}
        <div className="flex items-center gap-3">
          {/* CP 정보 */}
          <div className="hidden lg:flex items-center gap-2">
            <ResourceDisplay
              icon={<span className="text-xs font-bold text-empire-gold">P</span>}
              label="PCP"
              value={totalPcp.toLocaleString()}
              color="text-empire-gold"
            />
            <ResourceDisplay
              icon={<span className="text-xs font-bold text-alliance-blue">M</span>}
              label="MCP"
              value={totalMcp.toLocaleString()}
              color="text-alliance-blue"
            />
          </div>

          {/* 플레이어 수 */}
          <ResourceDisplay
            icon={<UserGroupIcon className="w-4 h-4" />}
            label="접속자"
            value={`${totalPlayers}/${rosterSize}`}
          />

          {/* 알림 버튼 */}
          <button
            className="relative p-2 rounded-lg bg-space-panel/50 border border-white/5 hover:border-white/20 transition-colors"
            onClick={() => setHasNewNotifications(false)}
          >
            {hasNewNotifications ? (
              <BellAlertIcon className="w-5 h-5 text-hud-alert animate-pulse" />
            ) : (
              <BellIcon className="w-5 h-5 text-foreground-muted" />
            )}
            {hasNewNotifications && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-hud-alert rounded-full" />
            )}
          </button>

          {/* 프로필 아바타 */}
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-xs font-bold text-white">
            {session?.profile?.displayName?.[0]?.toUpperCase() || 'G'}
          </div>
        </div>
      </div>
    </header>
  );
}

