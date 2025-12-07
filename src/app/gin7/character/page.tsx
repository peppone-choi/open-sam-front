'use client';

import { CharacterPanel } from '@/components/gin7/panels';
import { MainContent } from '@/components/gin7/layout';
import { useGin7Store } from '@/stores/gin7Store';
import { useGin7UserStore } from '@/stores/gin7UserStore';
import {
  ShieldCheckIcon,
  SparklesIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';

export default function Gin7CharacterPage() {
  const session = useGin7Store((state) => state.session);
  const loading = useGin7Store((state) => state.loading);
  const authorityCards = useGin7UserStore((state) => state.authorityCards);

  const cards = session?.cards || [];

  return (
    <MainContent
      title="내 캐릭터"
      subtitle="캐릭터 정보 및 권한 카드 관리"
    >
      {loading ? (
        <div className="h-[400px] rounded-2xl border border-white/5 bg-space-panel/50 flex items-center justify-center">
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-foreground-muted">캐릭터 정보 로딩 중...</span>
          </div>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[400px_1fr]">
          {/* 캐릭터 패널 */}
          <CharacterPanel />

          {/* 권한 카드 목록 */}
          <div className="space-y-4">
            <div className="rounded-2xl border border-white/10 bg-space-panel/50 backdrop-blur-sm p-4">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-4">
                <ShieldCheckIcon className="w-5 h-5" />
                보유 권한 카드
              </h3>

              {cards.length === 0 ? (
                <p className="text-sm text-foreground-muted text-center py-8">
                  보유한 권한 카드가 없습니다
                </p>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {cards.map((card) => (
                    <div
                      key={card.id}
                      className="p-4 rounded-xl border border-white/10 bg-black/30 hover:border-primary/30 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <SparklesIcon className="w-5 h-5 text-accent" />
                          <h4 className="text-sm font-semibold text-foreground">{card.title}</h4>
                        </div>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary">
                          {card.rank}
                        </span>
                      </div>
                      <p className="text-xs text-foreground-muted mb-3">
                        {card.faction} · {card.commandCodes?.length || 0}개 명령어
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {card.shortcuts?.slice(0, 3).map((shortcut, idx) => (
                          <span
                            key={idx}
                            className="text-[10px] px-2 py-0.5 rounded bg-white/5 text-foreground-dim"
                          >
                            {shortcut.label}
                          </span>
                        ))}
                        {(card.shortcuts?.length || 0) > 3 && (
                          <span className="text-[10px] px-2 py-0.5 rounded bg-white/5 text-foreground-dim">
                            +{card.shortcuts!.length - 3}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* CP 회복 정보 */}
            <div className="rounded-2xl border border-white/10 bg-space-panel/50 backdrop-blur-sm p-4">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-4">
                <ClockIcon className="w-5 h-5" />
                CP 회복 정보
              </h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="p-3 rounded-xl bg-black/30 border border-white/5">
                  <p className="text-xs text-foreground-muted mb-1">회복 주기</p>
                  <p className="text-lg font-bold text-foreground">
                    {session?.cpRegenSeconds ? `${Math.floor(session.cpRegenSeconds / 60)}분` : '—'}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-black/30 border border-white/5">
                  <p className="text-xs text-foreground-muted mb-1">다음 회복까지</p>
                  <p className="text-lg font-bold text-foreground">—</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </MainContent>
  );
}

