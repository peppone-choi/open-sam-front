'use client';

'use client';

import { useCallback, useEffect } from 'react';
import Gin7CommandPanel from '@/components/gin7/Gin7CommandPanel';
import Gin7StrategicMap from '@/components/gin7/Gin7StrategicMap';
import Gin7OperationPlanner from '@/components/gin7/Gin7OperationPlanner';
import Gin7TacticalHUD from '@/components/gin7/Gin7TacticalHUD';
import { useGin7Store } from '@/stores/gin7Store';
import { GIN7_ALERT_THRESHOLD_MS, GIN7_ALERT_TARGET_LABEL, GIN7_ALERT_CHANNEL } from '@/config/gin7';

const LOOP_TEST_COMMAND = 'npx --prefix open-sam-backend jest src/services/logh/__tests__/Gin7StrategicLoop.service.test.ts';

export default function Gin7Page() {
  const hydrate = useGin7Store((state) => state.hydrate);
  const loading = useGin7Store((state) => state.loading);
  const sessionId = useGin7Store((state) => state.sessionId);
  const loopStats = useGin7Store((state) => state.sessionSnapshot?.clock.loopStats);
  const strategyLoop = useGin7Store((state) => state.strategySnapshot?.clock?.loopStats);
  const telemetrySamples = useGin7Store((state) => state.telemetrySamples);
  const localStrategyTelemetry = useGin7Store((state) => state.localTelemetry['strategy']);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

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
    <section className="rounded-3xl border border-white/5 bg-black/30 p-4 text-sm text-white/80">
      <div className="grid gap-4 md:grid-cols-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-white/40">세션</p>
          <p className="text-lg font-semibold text-white">{sessionId}</p>
          <p className="text-xs text-white/50">평균 틱 {loopStats?.avgTickDurationMs ?? '—'}ms · 최대 {loopStats?.maxTickDurationMs ?? '—'}ms</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-white/40">알림 채널</p>
          <p className="text-lg font-semibold text-white">{GIN7_ALERT_CHANNEL}</p>
          <p className="text-xs text-white/50">{GIN7_ALERT_TARGET_LABEL} · 임계값 {GIN7_ALERT_THRESHOLD_MS}ms · 최근 알림 {loopStats?.lastAlertAt ? new Date(loopStats.lastAlertAt).toLocaleString() : '없음'}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-white/40">텔레메트리</p>
          <p className="text-lg font-semibold text-white">
            {localStrategyTelemetry ? `${localStrategyTelemetry.avgFps}fps / ${localStrategyTelemetry.cpuPct}% CPU` : '수집 대기'}
          </p>
          <p className="text-xs text-white/50">전략 루프 평균 {strategyLoop?.avgTickDurationMs ?? '—'}ms</p>
          <button
            type="button"
            onClick={handleCopyChecklist}
            className="mt-2 rounded-full border border-white/20 px-3 py-1 text-xs text-white hover:border-white/50"
          >
            QA 로그 템플릿 복사
          </button>
        </div>
      </div>
    </section>
  );

  return (
    <div className="min-h-screen bg-[#01030a] py-6 px-4 md:px-8 text-white">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="space-y-1">
          <p className="text-xs uppercase tracking-[0.4em] text-blue-400/70">GIN7 모드</p>
          <h1 className="text-3xl font-black">은하영웅전설Ⅶ · 전략/전술 통합 UI</h1>
          <p className="text-sm text-white/60">Chapter2~4 화면 구성과 조작계를 Next.js 다크 UI로 재현</p>
        </header>

        {!loading && renderHealthPanel()}

        {loading ? (
          <div className="rounded-3xl border border-white/5 bg-black/40 p-6 text-center text-sm text-white/60">
            GIN7 세션 데이터를 불러오는 중...
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
    </div>
  );
}

