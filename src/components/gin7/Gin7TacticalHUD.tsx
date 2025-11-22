'use client';

import Gin7TacticalPrototype from './Gin7TacticalPrototype';
import { useGin7Store } from '@/stores/gin7Store';

// 참고: gin7manual.txt Chapter4 조타 패널 / 채팅 / 레이더

const energyFields: { key: 'beam' | 'gun' | 'shield' | 'engine' | 'warp' | 'sensor'; label: string; description: string }[] = [
  { key: 'beam', label: '빔', description: '레이저 출력' },
  { key: 'gun', label: '포', description: '포격/건 무장' },
  { key: 'shield', label: '방어막', description: '방어막 회복' },
  { key: 'engine', label: '기관', description: '추력/선회' },
  { key: 'warp', label: '워프', description: '철수 차지' },
  { key: 'sensor', label: '센서', description: '수색 범위' },
];

export default function Gin7TacticalHUD() {
  const tactical = useGin7Store((state) => state.tactical);
  const chat = useGin7Store((state) => state.chat);
  const telemetrySamples = useGin7Store((state) => state.telemetrySamples);
  const localTelemetry = useGin7Store((state) => state.localTelemetry);
  const tacticalLocalSample = localTelemetry?.['tactical'];
  const updateEnergy = useGin7Store((state) => state.updateEnergy);

  if (!tactical) {
    return (
      <section className="rounded-3xl border border-white/10 bg-[#05070f] p-4 text-white/60">
        전술 HUD를 초기화하는 중입니다...
      </section>
    );
  }

  const totalEnergy = Object.values(tactical.energy).reduce((acc, value) => acc + value, 0);

  return (
    <section className="rounded-3xl border border-white/10 bg-gradient-to-b from-[#05060f] to-[#090f1d] p-4 space-y-4 text-white" data-testid="gin7-tactical-hud">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-xs text-white/50">전술 HUD</p>
          <h2 className="text-lg font-semibold">전술 뷰 / RTS 프로토타입</h2>
        </div>
        <div className="text-right text-xs text-white/50">
          레이더 열기
          <div className="mt-1 h-2 w-32 rounded-full bg-white/10 overflow-hidden">
            <div className="h-full bg-gradient-to-r from-rose-500 to-orange-500" style={{ width: `${tactical.radarHeat * 100}%` }} />
          </div>
        </div>
      </header>

      <Gin7TacticalPrototype />

      <div className="rounded-2xl border border-white/10 bg-black/30 p-3">
        <div className="flex items-center justify-between">
          <p className="text-xs text-white/50">에너지 패널</p>
          <span className="text-[11px] text-white/40">총합 {totalEnergy}%</span>
        </div>
        <div className="mt-2 grid grid-cols-2 gap-3">
          {energyFields.map((field) => (
            <label key={field.key} className="text-xs text-white/60 space-y-1">
              <div className="flex items-center justify-between text-[11px]">
                <span>{field.label}</span>
                <span className="text-white/40">{field.description}</span>
              </div>
              <input
                type="range"
                min={0}
                max={40}
                value={tactical.energy[field.key]}
                onChange={(event) => updateEnergy(field.key, Number(event.target.value))}
                className="w-full accent-cyan-400"
              />
              <div className="text-right font-mono text-white text-xs">{tactical.energy[field.key]}%</div>
            </label>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-black/30 p-3 space-y-3">
        <div className="flex items-center justify-between text-xs text-white/50">
          <span>채팅 (전술)</span>
          <div className="space-x-2">
            <button className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] uppercase tracking-wide">전체</button>
            <button className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] uppercase tracking-wide">함대</button>
            <button className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] uppercase tracking-wide">동진영</button>
          </div>
        </div>
        <div className="space-y-2 max-h-48 overflow-y-auto text-xs">
          {chat.map((message) => (
            <div key={message.id} className="rounded-xl border border-white/5 bg-black/40 p-2">
              <div className="flex items-center justify-between text-[10px] text-white/40">
                <span>{message.channel.toUpperCase()}</span>
                <span>{new Date(message.timestamp).toLocaleTimeString()}</span>
              </div>
              <div className="mt-0.5 text-white">
                <span className="text-cyan-300 mr-1">{message.author}:</span>
                {message.text}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-black/30 p-3">
        <div className="flex items-center justify-between text-xs text-white/50">
          <span>텔레메트리 샘플</span>
          <span>최근 {telemetrySamples.length}건</span>
        </div>
        <div className="mt-2 space-y-2 text-xs text-white/70">
          {[...(tacticalLocalSample ? [tacticalLocalSample] : []), ...telemetrySamples]
            .slice(0, 5)
            .map((sample, index) => (
              <div key={`${sample.scene}-${sample.collectedAt}-${index}`} className="rounded-lg border border-white/10 bg-black/20 px-3 py-2">
                <div className="flex items-center justify-between text-white">
                  <span className="font-semibold">{sample.scene.toUpperCase()}</span>
                  <span className="text-[11px] text-white/50">{new Date(sample.collectedAt).toLocaleTimeString()}</span>
                </div>
                <p className="text-white/60">{sample.avgFps}fps · {sample.cpuPct}% CPU · {sample.memoryMb}MB</p>
              </div>
            ))}
        </div>
      </div>
    </section>
  );
}
