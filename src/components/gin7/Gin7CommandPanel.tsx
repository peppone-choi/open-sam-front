'use client';

import { useMemo } from 'react';
import { useGin7Store } from '@/stores/gin7Store';
import { useGameStore } from '@/stores/gameStore';
import { useCommandExecution } from '@/hooks/useCommandExecution';
import { cn } from '@/lib/utils';

// 참고: gin7manual.txt Chapter2 전략 게임 화면 / Chapter3 커맨드 포인트

function CPBar({ label, value, max, tone }: { label: string; value: number; max: number; tone: 'blue' | 'gold' }) {
  const pct = Math.min(100, Math.round((value / Math.max(1, max)) * 100));
  const gradient = tone === 'blue'
    ? 'from-cyan-400 via-blue-500 to-indigo-600'
    : 'from-amber-300 via-yellow-400 to-orange-500';
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs uppercase tracking-wide text-white/60">
        <span>{label}</span>
        <span className="font-mono text-white">{value}/{max}</span>
      </div>
      <div className="h-3 rounded bg-white/10 overflow-hidden">
        <div
          className={cn('h-full bg-gradient-to-r transition-all duration-500', gradient)}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default function Gin7CommandPanel() {
  const session = useGin7Store((state) => state.session);
  const sessionSnapshot = useGin7Store((state) => state.sessionSnapshot);
  const hoveredCell = useGin7Store((state) => state.hoveredCell);
  const { execute, isExecuting } = useCommandExecution();
  const profile = useGameStore((state) => state.userProfile);

  const regenLabel = useMemo(() => {
    if (!session) return '—';
    const minutes = Math.floor(session.cpRegenSeconds / 60);
    const seconds = session.cpRegenSeconds % 60;
    return `${minutes}분 ${seconds.toString().padStart(2, '0')}초`;
  }, [session]);

  const loopStats = sessionSnapshot?.clock.loopStats;
  const cardSummary = sessionSnapshot?.cards;
  const commandStats = sessionSnapshot?.commandPoints;
  const shortcutWatchlist = sessionSnapshot?.shortcuts ?? [];
  const recentAssignments = cardSummary?.recentAssignments ?? [];

  if (!session || !profile) {
    return (
      <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-slate-900 to-slate-950 p-4 text-sm text-white/70">
        GIN7 세션 정보를 불러오는 중...
      </div>
    );
  }

  const handleCommand = (cardId: string, command: any) => {
    const target = hoveredCell ? { gridX: hoveredCell.x, gridY: hoveredCell.y } : undefined;
    execute(cardId, command, target);
  };

  return (
    <section data-testid="gin7-command-panel" className="rounded-3xl border border-white/10 bg-gradient-to-b from-[#0f1324] to-[#090b18] p-5 shadow-[0_0_40px_rgba(0,0,0,0.35)] space-y-5">
      <header className="space-y-3">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-primary/60">세션 · GIN7</p>
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-black text-white">{profile.name}</h2>
              <p className="text-sm text-white/60">{profile.rank} · {profile.faction === 'empire' ? '은하제국군' : '자유행성동맹군'}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-white/50">CP 회복</p>
              <p className="font-mono text-lg text-emerald-300">{regenLabel}</p>
            </div>
          </div>
        </div>
        <div className="grid gap-3 text-xs text-white/60 sm:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
            <p className="text-[11px] uppercase tracking-wide text-white/40">루프 평균</p>
            <p className="mt-1 text-lg font-semibold text-cyan-300">{loopStats ? `${loopStats.avgTickDurationMs}ms` : '—'}</p>
            <p>최대 {loopStats?.maxTickDurationMs ?? '—'}ms · 샘플 {loopStats?.sampleCount ?? '—'}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
            <p className="text-[11px] uppercase tracking-wide text-white/40">최근 알림</p>
            <p className="mt-1 text-lg font-semibold text-white">
              {loopStats?.lastAlertAt ? new Date(loopStats.lastAlertAt).toLocaleString() : '감지 없음'}
            </p>
            <p>{loopStats?.lastAlertReason || '웹훅 정상 대기'}</p>
          </div>
        </div>
      </header>

      <div className="space-y-3">
        <CPBar label="PCP" value={profile.pcp} max={profile.maxPcp} tone="gold" />
        <CPBar label="MCP" value={profile.mcp} max={profile.maxMcp} tone="blue" />
      </div>

      {cardSummary && commandStats && (
        <div className="grid gap-3 text-xs text-white/70 md:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
            <p className="text-[11px] uppercase tracking-wide text-white/40">카드 재고</p>
            <p className="mt-1 text-lg font-semibold text-white">총 {cardSummary.total}장</p>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {Object.entries(cardSummary.byStatus).map(([status, count]) => (
                <div key={status} className="rounded-lg border border-white/10 bg-black/30 px-2 py-1 text-white">
                  <span className="text-[10px] text-white/40">{status.toUpperCase()}</span>
                  <p className="text-base font-semibold">{count}</p>
                </div>
              ))}
            </div>
            {recentAssignments.length > 0 && (
              <p className="mt-2 text-[11px] text-white/50">최근 발령: {recentAssignments[0].title}</p>
            )}
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
            <p className="text-[11px] uppercase tracking-wide text-white/40">지휘 포인트</p>
            <p className="mt-1 text-lg font-semibold text-white">
              평균 PCP {commandStats.average.pcp.toFixed(2)} · MCP {commandStats.average.mcp.toFixed(2)}
            </p>
            <p className="text-white/60">저장 인원 {commandStats.rosterSize}명 · 저용량 {commandStats.lowCapacity}명</p>
            <p className="text-white/50">대체 사용 {commandStats.substitutionDebt}명</p>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {session.cards.map((card) => (
          <div key={card.id} className="rounded-2xl border border-white/5 bg-white/5 backdrop-blur-sm p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-white/50">{card.rank}</p>
                <h3 className="text-lg font-semibold text-white">{card.title}</h3>
              </div>
                <div className="text-right text-xs text-white/50">
                  <p>단축키</p>
                  <p className="font-mono text-base text-cyan-300">
                    {card.shortcuts.map((s) => s.key.toUpperCase()).join(' · ')}
                  </p>
                </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {card.commands.map((command) => (
                <button
                  key={command}
                  className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-left text-sm text-white transition hover:border-primary/60 hover:bg-primary/10"
                  onClick={() => handleCommand(card.id, command)}
                >
                  <span className="block text-xs uppercase text-white/40">{command}</span>
                  <span className="font-semibold text-white">실행</span>
                </button>
              ))}
            </div>
            <div className="text-[11px] text-white/50 leading-snug">
              {card.shortcuts.map((shortcut) => (
                <div key={shortcut.key} className="flex items-center gap-2">
                  <span className="inline-flex h-5 w-5 items-center justify-center rounded border border-white/20 font-mono text-[10px] text-white">
                    {shortcut.key.toUpperCase()}
                  </span>
                  <span className="text-white/70">{shortcut.label}</span>
                  <span className="text-white/40">{shortcut.description}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {shortcutWatchlist.length > 0 && (
        <div className="rounded-2xl border border-white/10 bg-black/30 p-4 text-xs text-white/70">
          <p className="text-[11px] uppercase tracking-wide text-white/40">단축키 감시 목록</p>
          <div className="mt-2 space-y-2">
            {shortcutWatchlist.slice(0, 4).map((shortcut) => (
              <div key={shortcut.cardId} className="flex items-center justify-between rounded-xl border border-white/10 bg-black/20 px-3 py-2">
                <div>
                  <p className="text-white text-sm font-semibold">{shortcut.title}</p>
                  <p className="text-[11px] text-white/40">{shortcut.commandGroups?.join(' · ')}</p>
                </div>
                <div className="text-right text-white">
                  <p className="font-mono text-base text-cyan-300">{shortcut.commandCodes.slice(0, 2).join(', ')}</p>
                  <p className="text-[11px] text-white/40">{shortcut.status}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {isExecuting && (
        <div className="rounded-2xl border border-cyan-500/40 bg-cyan-500/10 px-4 py-2 text-center text-xs font-mono text-cyan-200 animate-pulse">
          명령 채널 · 전송 중...
        </div>
      )}
    </section>
  );
}
