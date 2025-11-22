'use client';

import { FormEvent, useState } from 'react';
import { useGin7Store } from '@/stores/gin7Store';

// 참고: gin7manual.txt Chapter3 작전 계획

const objectiveMap = {
  occupy: '점령 작전',
  defend: '방위 작전',
  sweep: '소탕 작전',
} as const;

type ObjectiveKey = keyof typeof objectiveMap;

export default function Gin7OperationPlanner() {
  const plans = useGin7Store((state) => state.plans);
  const savePlan = useGin7Store((state) => state.savePlan);
  const hotspots = useGin7Store((state) => state.strategySnapshot?.operationHotspots ?? []);
  const [objective, setObjective] = useState<ObjectiveKey>('occupy');
  const [target, setTarget] = useState('오딘');
  const [participants, setParticipants] = useState('라인하르트, 미터마이어');
  const [startAt, setStartAt] = useState('801-07-27T18:00');
  const [notes, setNotes] = useState('30일 이내 전 행성 장악');
  const [status, setStatus] = useState<'draft' | 'issued'>('draft');

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    await savePlan({
      objective,
      target,
      plannedStart: startAt,
      participants: participants.split(',').map((p) => p.trim()).filter(Boolean),
      status,
      notes,
    });
    setNotes('');
  };

  return (
    <section className="rounded-3xl border border-white/10 bg-[#0a0d1a] p-4 space-y-4">
      <header>
        <p className="text-xs text-white/40">작전 현황판</p>
        <h2 className="text-lg font-semibold text-white">작전 계획 · 명령 플래너</h2>
      </header>

      <form className="grid grid-cols-1 gap-3" onSubmit={handleSubmit}>
        <div className="grid grid-cols-2 gap-3">
          <label className="text-xs text-white/60 space-y-1">
            <span>작전 목적</span>
            <select value={objective} onChange={(e) => setObjective(e.target.value as ObjectiveKey)} className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-white text-sm">
              {Object.entries(objectiveMap).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </label>
          <label className="text-xs text-white/60 space-y-1">
            <span>상태</span>
            <select value={status} onChange={(e) => setStatus(e.target.value as 'draft' | 'issued')} className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-white text-sm">
              <option value="draft">준비 중</option>
              <option value="issued">발령</option>
            </select>
          </label>
        </div>
        <label className="text-xs text-white/60 space-y-1">
          <span>목표 성계</span>
          <input value={target} onChange={(e) => setTarget(e.target.value)} className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-white text-sm" />
        </label>
        <label className="text-xs text-white/60 space-y-1">
          <span>참가 함대</span>
          <input value={participants} onChange={(e) => setParticipants(e.target.value)} className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-white text-sm" />
        </label>
        <label className="text-xs text-white/60 space-y-1">
          <span>발동 예정 시각</span>
          <input type="datetime-local" value={startAt} onChange={(e) => setStartAt(e.target.value)} className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-white text-sm" />
        </label>
        <label className="text-xs text-white/60 space-y-1">
          <span>비고 / 작전 철회 조건</span>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-white text-sm" />
        </label>
        <button type="submit" className="rounded-2xl border border-emerald-400/40 bg-emerald-400/10 px-4 py-2 text-sm font-semibold text-emerald-200 hover:bg-emerald-400/20">
          작전 등록
        </button>
      </form>

      <div className="space-y-3">
        {plans.map((plan) => (
          <div key={plan.id} className="rounded-2xl border border-white/10 bg-black/30 p-3 text-sm text-white/80">
            <div className="flex items-center justify-between mb-1">
              <div className="font-semibold text-white">{objectiveMap[plan.objective]}</div>
              <span className="text-[10px] rounded-full border border-white/20 px-2 py-0.5 text-white/60">{plan.status.toUpperCase()}</span>
            </div>
            <div className="text-xs text-white/60">목표: {plan.target}</div>
            <div className="text-xs text-white/60">발동: {plan.plannedStart}</div>
            <div className="text-xs text-white/60">참가: {plan.participants.join(', ')}</div>
            {plan.notes && <div className="mt-1 text-[11px] text-white/50">{plan.notes}</div>}
          </div>
        ))}
      </div>

      {hotspots.length > 0 && (
        <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-xs text-white/70">
          <p className="text-[11px] uppercase tracking-wide text-white/40">실시간 작전</p>
          <div className="mt-2 space-y-2">
            {hotspots.map((op) => (
              <div key={op.operationId} className="rounded-xl border border-white/10 bg-black/30 px-3 py-2">
                <div className="flex items-center justify-between">
                  <span className="text-white font-semibold">{op.code}</span>
                  <span className="text-[10px] text-white/50">{op.status}</span>
                </div>
                <p className="text-white/60">{op.objectiveType} · Grid ({op.targetGrid.x}, {op.targetGrid.y})</p>
                <p className="text-white/40">발령 {op.issuedAt ? new Date(op.issuedAt).toLocaleString() : '—'} · 대기 {op.waitHours ?? 0}시간</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
