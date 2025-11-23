'use client';

import { useEffect, useMemo, useState } from 'react';
import { useGin7Store } from '@/stores/gin7Store';
import { useGameStore } from '@/stores/gameStore';
import { useCommandExecution } from '@/hooks/useCommandExecution';
import { cn } from '@/lib/utils';
import { Gin7AuthorityCard, Gin7CommandMeta } from '@/types/gin7';

// 참고: gin7manual.txt Chapter2 전략 게임 화면 / Chapter3 커맨드 포인트

const GROUP_LABELS: Record<string, string> = {
  all: '전체',
  operation: '작전',
  tactical: '전술',
  command: '지휘',
  logistics: '병참',
  personnel: '인사',
  political: '정치',
  personal: '개인',
  intelligence: '정보',
};

const CARDS_PER_PAGE = 3;

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
  const commandCatalog = useGin7Store((state) => state.commandCatalog);
  const sessionSnapshot = useGin7Store((state) => state.sessionSnapshot);
  const hoveredCell = useGin7Store((state) => state.hoveredCell);
  const { execute, isExecuting } = useCommandExecution();
  const profile = useGameStore((state) => state.userProfile);
  const [selectedGroup, setSelectedGroup] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const cardTemplates = useMemo(() => {
    if (!commandCatalog) {
      return new Map<string, any>();
    }
    return new Map(commandCatalog.authorityCards.map((template) => [template.templateId, template]));
  }, [commandCatalog]);

  const groupFilters = useMemo(() => {
    if (!commandCatalog) return ['all'];
    const groups = new Set<string>(['all']);
    commandCatalog.authorityCards.forEach((template) => {
      (template.commandGroups || []).forEach((group) => groups.add(group));
    });
    return Array.from(groups);
  }, [commandCatalog]);

  const filteredCards = useMemo(() => {
    if (!session) return [];
    const term = searchTerm.trim().toLowerCase();
    return session.cards.filter((card) => {
      const template = cardTemplates.get(card.templateId);
      const matchesGroup =
        selectedGroup === 'all'
          ? true
          : Boolean(
              template?.commandGroups?.includes(selectedGroup) ||
                card.commandMeta.some((meta) => meta.group === selectedGroup)
            );
      if (!matchesGroup) {
        return false;
      }
      if (!term) {
        return true;
      }
      return (
        card.title.toLowerCase().includes(term) ||
        card.commandMeta.some(
          (meta) =>
            meta.label.toLowerCase().includes(term) ||
            meta.code.toLowerCase().includes(term)
        )
      );
    });
  }, [session, cardTemplates, selectedGroup, searchTerm]);

  const pageCount = Math.max(1, Math.ceil(filteredCards.length / CARDS_PER_PAGE));
  const currentPage = Math.min(page, pageCount - 1);
  const cardsToDisplay = filteredCards.slice(
    currentPage * CARDS_PER_PAGE,
    currentPage * CARDS_PER_PAGE + CARDS_PER_PAGE
  );

  useEffect(() => {
    setPage(0);
  }, [selectedGroup, searchTerm, session?.cards.length]);

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

  const handleCommand = (card: Gin7AuthorityCard, command: Gin7CommandMeta) => {
    const target = hoveredCell ? { gridX: hoveredCell.x, gridY: hoveredCell.y } : undefined;
    execute({ cardId: card.id, templateId: card.templateId, command, args: target });
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

      {commandCatalog && (
        <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-white/70 space-y-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-wide text-white/40">카탈로그</p>
              <p className="text-sm text-white">v{commandCatalog.version} · {commandCatalog.authorityCards.length}장 / {Object.keys(commandCatalog.commands).length}커맨드</p>
            </div>
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="카드·커맨드 검색"
              className="rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-primary/50 focus:outline-none"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {groupFilters.map((group) => (
              <button
                key={group}
                onClick={() => setSelectedGroup(group)}
                className={cn(
                  'rounded-full px-3 py-1 text-xs transition border',
                  selectedGroup === group
                    ? 'border-primary/60 bg-primary/20 text-primary-100'
                    : 'border-white/10 text-white/60 hover:border-primary/40 hover:text-white'
                )}
              >
                {GROUP_LABELS[group] || group}
              </button>
            ))}
          </div>
        </div>
      )}

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
        {cardsToDisplay.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-white/60">
            적용된 필터와 일치하는 직무 권한 카드가 없습니다.
          </div>
        ) : (
          cardsToDisplay.map((card) => {
            const template = cardTemplates.get(card.templateId);
            const term = searchTerm.trim().toLowerCase();
            const commandRows = card.commandMeta.filter((meta) => {
              const matchesGroup =
                selectedGroup === 'all' ||
                meta.group === selectedGroup ||
                template?.commandGroups?.includes(selectedGroup);
              if (!matchesGroup) return false;
              if (!term) return true;
              return (
                meta.label.toLowerCase().includes(term) ||
                meta.code.toLowerCase().includes(term)
              );
            });

            return (
              <div key={card.id} className="rounded-2xl border border-white/5 bg-white/5 backdrop-blur-sm p-4 space-y-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs text-white/50">{card.rank}</p>
                    <h3 className="text-lg font-semibold text-white">{card.title}</h3>
                    <p className="text-[11px] text-white/50">
                      요구 계급: {template?.minRank ?? '제한 없음'} · 소속:{' '}
                      {(template?.metadata as any)?.organizationName ?? '공용'}
                    </p>
                  </div>
                  <div className="text-right text-xs text-white/50">
                    <p>단축키</p>
                    <p className="font-mono text-base text-cyan-300">
                      {card.shortcuts.map((s) => s.key.toUpperCase()).join(' · ') || '—'}
                    </p>
                  </div>
                </div>

                <div className="space-y-2 text-xs text-white/60">
                  {commandRows.length === 0 ? (
                    <p>필터와 일치하는 명령이 없습니다.</p>
                  ) : (
                    commandRows.map((meta) => {
                      const shortcuts = card.shortcuts.filter((shortcut) => shortcut.commandCode === meta.code);
                      return (
                        <div
                          key={meta.code}
                          className="grid gap-3 rounded-xl border border-white/10 bg-black/30 p-3 text-white/80 md:grid-cols-[1.5fr,0.8fr,0.6fr,1fr,auto]"
                        >
                          <div>
                            <p className="text-sm font-semibold text-white">{meta.label}</p>
                            <p className="text-[11px] text-white/40">{meta.code}</p>
                          </div>
                          <div className="text-xs text-white/50">{GROUP_LABELS[meta.group] || meta.group}</div>
                          <div className="text-xs font-mono text-amber-200">
                            {meta.cpType ? `${meta.cpType} · ${meta.cpCost ?? '—'}` : '—'}
                          </div>
                          <div className="space-y-1">
                            {shortcuts.length === 0 && <span className="text-white/40">—</span>}
                            {shortcuts.map((shortcut) => (
                              <span
                                key={`${meta.code}-${shortcut.key}`}
                                className="inline-flex items-center gap-2 rounded-full border border-white/10 px-2 py-1 text-[11px] text-white/70"
                              >
                                <span className="inline-flex h-5 w-5 items-center justify-center rounded border border-white/20 font-mono text-[10px] text-white">
                                  {shortcut.key.toUpperCase()}
                                </span>
                                {shortcut.label}
                              </span>
                            ))}
                          </div>
                          <button
                            onClick={() => handleCommand(card, meta)}
                            disabled={isExecuting}
                            className="rounded-xl border border-primary/40 bg-primary/20 px-3 py-2 text-sm font-semibold text-primary-100 transition hover:border-primary/80 hover:bg-primary/30 disabled:opacity-50"
                          >
                            실행
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {pageCount > 1 && (
        <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/20 px-4 py-2 text-xs text-white/70">
          <button
            onClick={() => setPage((prev) => Math.max(0, prev - 1))}
            disabled={currentPage === 0}
            className="rounded-full border border-white/10 px-3 py-1 disabled:opacity-40"
          >
            이전
          </button>
          <p>
            페이지 {currentPage + 1} / {pageCount}
          </p>
          <button
            onClick={() => setPage((prev) => Math.min(pageCount - 1, prev + 1))}
            disabled={currentPage >= pageCount - 1}
            className="rounded-full border border-white/10 px-3 py-1 disabled:opacity-40"
          >
            다음
          </button>
        </div>
      )}

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
