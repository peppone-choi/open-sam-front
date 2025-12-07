'use client';

import { useCallback } from 'react';
import Gin7CommandPanel from '@/components/gin7/Gin7CommandPanel';
import Gin7StrategicMap from '@/components/gin7/Gin7StrategicMap';
import Gin7OperationPlanner from '@/components/gin7/Gin7OperationPlanner';
import Gin7TacticalHUD from '@/components/gin7/Gin7TacticalHUD';
import { MainContent } from '@/components/gin7/layout';
import { useGin7Store } from '@/stores/gin7Store';
import { GIN7_ALERT_THRESHOLD_MS, GIN7_ALERT_TARGET_LABEL, GIN7_ALERT_CHANNEL } from '@/config/gin7';

const LOOP_TEST_COMMAND = 'npx --prefix open-sam-backend jest src/services/logh/__tests__/Gin7StrategicLoop.service.test.ts';

export default function Gin7Page() {
  const loading = useGin7Store((state) => state.loading);
  const sessionId = useGin7Store((state) => state.sessionId);
  const loopStats = useGin7Store((state) => state.sessionSnapshot?.clock.loopStats);
  const strategyLoop = useGin7Store((state) => state.strategySnapshot?.clock?.loopStats);
  const telemetrySamples = useGin7Store((state) => state.telemetrySamples);
  const localStrategyTelemetry = useGin7Store((state) => state.localTelemetry['strategy']);

  const handleCopyChecklist = useCallback(() => {
    const sample = telemetrySamples[0];
    const template = [
      '## GIN7 루프 회귀 점검',
      `명령: ${LOOP_TEST_COMMAND}`,
      `세션: ${sessionId}`,
      `평균 틱: ${loopStats?.avgTickDurationMs ?? '—'} ms (최대 ${loopStats?.maxTickDurationMs ?? '—'} ms)`,
      `최근 텔레메트리: ${sample ? `${sample.scene} ${sample.avgFps}fps @ ${sample.cpuPct}% CPU` : '—'}`,
      '결과: <로그 또는 스크린샷 붙여넣기>',
    ].join('\n');
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(template);
    }
  }, [loopStats, sessionId, telemetrySamples]);

  const renderHealthPanel = () => (
    <section className="rounded-2xl border border-white/5 bg-space-panel/50 backdrop-blur-sm p-4 text-sm text-white/80">
      <div className="grid gap-4 md:grid-cols-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-foreground-muted">세션</p>
          <p className="text-lg font-semibold text-foreground">{sessionId}</p>
          <p className="text-xs text-foreground-dim">평균 틱 {loopStats?.avgTickDurationMs ?? '—'}ms · 최대 {loopStats?.maxTickDurationMs ?? '—'}ms</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-foreground-muted">알림 채널</p>
          <p className="text-lg font-semibold text-foreground">{GIN7_ALERT_CHANNEL}</p>
          <p className="text-xs text-foreground-dim">{GIN7_ALERT_TARGET_LABEL} · 임계값 {GIN7_ALERT_THRESHOLD_MS}ms · 최근 알림 {loopStats?.lastAlertAt ? new Date(loopStats.lastAlertAt).toLocaleString() : '없음'}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-foreground-muted">텔레메트리</p>
          <p className="text-lg font-semibold text-foreground">
            {localStrategyTelemetry ? `${localStrategyTelemetry.avgFps}fps / ${localStrategyTelemetry.cpuPct}% CPU` : '수집 대기'}
          </p>
          <p className="text-xs text-foreground-dim">전략 루프 평균 {strategyLoop?.avgTickDurationMs ?? '—'}ms</p>
          <button
            type="button"
            onClick={handleCopyChecklist}
            className="mt-2 rounded-full border border-white/20 px-3 py-1 text-xs text-foreground hover:border-white/50 hover:bg-white/5 transition-colors"
          >
            QA 로그 템플릿 복사
          </button>
        </div>
      </div>
    </section>
  );

  return (
    <MainContent
      title="전략/전술 통합 UI"
      subtitle="Chapter2~4 화면 구성과 조작계를 재현"
    >
      <div className="space-y-6">
        {!loading && renderHealthPanel()}

        {loading ? (
          <div className="rounded-2xl border border-white/5 bg-space-panel/50 p-8 text-center">
            <div className="inline-flex items-center gap-3">
              <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <span className="text-sm text-foreground-muted">GIN7 세션 데이터를 불러오는 중...</span>
            </div>
          </div>
        ) : (
          <div className="grid gap-6 xl:grid-cols-[340px_minmax(0,1fr)_360px]">
            <div className="space-y-5">
              <Gin7CommandPanel />
              <Gin7OperationPlanner />
            </div>
            <Gin7StrategicMap />
            <Gin7TacticalHUD />
          </div>
        )}
      </div>
    </MainContent>
  );
}
