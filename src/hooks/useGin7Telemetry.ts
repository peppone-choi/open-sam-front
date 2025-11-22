import { useEffect } from 'react';
import { gin7Api, Gin7TelemetryPayload } from '@/lib/api/gin7';
import { Gin7TelemetrySample } from '@/types/gin7';

interface TelemetryOptions {
  scene: string;
  enabled?: boolean;
  sampleIntervalMs?: number;
  skipNetwork?: boolean;
  onSample?: (sample: Gin7TelemetrySample) => void;
}

declare global {
  interface Window {
    __gin7Telemetry?: Record<string, Gin7TelemetryPayload & { collectedAt: string }>;
  }
}

export function useGin7Telemetry(options: TelemetryOptions) {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (options.enabled === false) return;

    let rafId: number;
    const state = {
      frames: 0,
      workTime: 0,
      last: performance.now(),
      start: performance.now(),
    };

    const tick = (now: number) => {
      const delta = now - state.last;
      state.frames += 1;
      state.workTime += delta;
      state.last = now;
      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);

    const interval = window.setInterval(async () => {
      const now = performance.now();
      const durationMs = now - state.start;
      if (durationMs <= 0 || state.frames === 0) {
        return;
      }

      const avgFps = Number(((state.frames / durationMs) * 1000).toFixed(2));
      const cpuPct = Number(Math.min(100, (state.workTime / durationMs) * 100).toFixed(2));
      const memory = (performance as any).memory?.usedJSHeapSize ?? 0;
      const memoryMb = memory ? Number((memory / (1024 * 1024)).toFixed(2)) : 0;

      const payload: Gin7TelemetryPayload = {
        scene: options.scene,
        avgFps,
        cpuPct,
        memoryMb,
        sampleCount: state.frames,
        durationMs: Math.round(durationMs),
      };

      const sample: Gin7TelemetrySample = {
        ...payload,
        collectedAt: new Date().toISOString(),
      };

      recordInWindow(sample);
      options.onSample?.(sample);

      state.frames = 0;
      state.workTime = 0;
      state.start = performance.now();
      state.last = state.start;

      if (options.skipNetwork) {
        return;
      }

      try {
        await gin7Api.submitTelemetry(payload);
      } catch (error) {
        console.warn('[gin7Telemetry] submit failed', error);
      }
    }, options.sampleIntervalMs ?? 10000);

    return () => {
      cancelAnimationFrame(rafId);
      window.clearInterval(interval);
    };
  }, [options.scene, options.enabled, options.sampleIntervalMs, options.skipNetwork, options.onSample]);
}

function recordInWindow(sample: Gin7TelemetrySample) {
  if (typeof window === 'undefined') return;
  if (!window.__gin7Telemetry) {
    window.__gin7Telemetry = {};
  }
  window.__gin7Telemetry[sample.scene] = sample;
}
