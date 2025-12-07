'use client';

import { useGin7Store } from '@/stores/gin7Store';
import { useGin7UserStore } from '@/stores/gin7UserStore';
import {
  UserCircleIcon,
  SparklesIcon,
  ShieldCheckIcon,
  BoltIcon,
} from '@heroicons/react/24/outline';

interface StatBarProps {
  label: string;
  current: number;
  max: number;
  color: string;
}

function StatBar({ label, current, max, color }: StatBarProps) {
  const percentage = max > 0 ? (current / max) * 100 : 0;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-foreground-muted">{label}</span>
        <span className="font-mono text-foreground">{current} / {max}</span>
      </div>
      <div className="h-2 bg-black/50 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${color}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

export default function CharacterPanel() {
  const session = useGin7Store((state) => state.session);
  const character = useGin7UserStore((state) => state.character);
  const authorityCards = useGin7UserStore((state) => state.authorityCards);

  // session.profile에서 캐릭터 정보 가져오기
  const profile = session?.profile;
  const displayName = character?.name || profile?.displayName || '알 수 없음';
  const faction = character?.faction || 'neutral';
  const rank = character?.rank || profile?.rank || '—';

  const pcp = character?.pcp ?? profile?.pcp ?? 0;
  const maxPcp = character?.maxPcp ?? profile?.maxPcp ?? 100;
  const mcp = character?.mcp ?? profile?.mcp ?? 0;
  const maxMcp = character?.maxMcp ?? profile?.maxMcp ?? 100;

  const factionLabel = {
    empire: '은하제국',
    alliance: '자유행성동맹',
    phezzan: '페잔',
    neutral: '중립',
  }[faction] || faction;

  const factionColor = {
    empire: 'text-empire-gold',
    alliance: 'text-alliance-blue',
    phezzan: 'text-pink-400',
    neutral: 'text-foreground-muted',
  }[faction] || 'text-foreground-muted';

  return (
    <div className="rounded-2xl border border-white/10 bg-space-panel/50 backdrop-blur-sm overflow-hidden">
      {/* 헤더 */}
      <div className="p-4 border-b border-white/5 bg-gradient-to-r from-primary/10 to-transparent">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <UserCircleIcon className="w-7 h-7 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-foreground">{displayName}</h3>
            <div className="flex items-center gap-2 text-xs">
              <span className={factionColor}>{factionLabel}</span>
              <span className="text-foreground-dim">·</span>
              <span className="text-foreground-muted">{rank}</span>
            </div>
          </div>
        </div>
      </div>

      {/* CP 상태 */}
      <div className="p-4 space-y-3">
        <StatBar
          label="PCP (개인 지휘 포인트)"
          current={pcp}
          max={maxPcp}
          color="bg-gradient-to-r from-empire-gold to-yellow-500"
        />
        <StatBar
          label="MCP (군사 지휘 포인트)"
          current={mcp}
          max={maxMcp}
          color="bg-gradient-to-r from-alliance-blue to-cyan-400"
        />
      </div>

      {/* 권한 카드 */}
      {authorityCards.length > 0 && (
        <div className="p-4 border-t border-white/5">
          <h4 className="text-xs uppercase tracking-wide text-foreground-muted mb-3 flex items-center gap-2">
            <ShieldCheckIcon className="w-4 h-4" />
            권한 카드
          </h4>
          <div className="space-y-2">
            {authorityCards.slice(0, 3).map((card) => (
              <div
                key={card.id}
                className="flex items-center justify-between p-2 rounded-lg bg-black/30 border border-white/5"
              >
                <div className="flex items-center gap-2">
                  <SparklesIcon className="w-4 h-4 text-accent" />
                  <span className="text-sm text-foreground">{card.title}</span>
                </div>
                <span className="text-xs text-foreground-muted">{card.rank}</span>
              </div>
            ))}
            {authorityCards.length > 3 && (
              <p className="text-xs text-foreground-dim text-center">
                +{authorityCards.length - 3}개 더 보기
              </p>
            )}
          </div>
        </div>
      )}

      {/* 퀵 액션 */}
      <div className="p-4 border-t border-white/5">
        <div className="grid grid-cols-2 gap-2">
          <button className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-primary/20 text-primary text-sm hover:bg-primary/30 transition-colors">
            <BoltIcon className="w-4 h-4" />
            CP 회복
          </button>
          <button className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-white/5 text-foreground-muted text-sm hover:bg-white/10 transition-colors">
            상세 보기
          </button>
        </div>
      </div>
    </div>
  );
}

