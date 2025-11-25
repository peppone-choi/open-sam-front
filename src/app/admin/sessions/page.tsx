'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { SammoAPI } from '@/lib/api/sammo';
import { useToast } from '@/contexts/ToastContext';

export default function AdminSessionsPage() {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState<any[]>([]);
  const [creating, setCreating] = useState(false);
  const [resettingId, setResettingId] = useState<string | null>(null);
  const [scenarios, setScenarios] = useState<any[]>([]);
  const [selectedScenarioId, setSelectedScenarioId] = useState('');

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    try {
      setLoading(true);
      const [sessionList, scenarioList] = await Promise.all([
        SammoAPI.AdminSessionList(),
        SammoAPI.GetPhpScenarios().catch(() => ({ success: false, data: { scenarios: [] } })),
      ]);

      if (sessionList.success) {
        setSessions(sessionList.sessions || []);
      }
      if (scenarioList.success) {
        setScenarios(scenarioList.data.scenarios || []);
      }
    } catch (err) {
      console.error('세션/시나리오 로드 실패:', err);
      showToast('세션 정보를 불러오는데 실패했습니다.', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate() {
    if (!selectedScenarioId) {
      showToast('시나리오를 선택해주세요', 'warning');
      return;
    }

    const selectedScenario = scenarios.find((s) => s.id === selectedScenarioId);
    if (!selectedScenario) {
      showToast('선택한 시나리오를 찾을 수 없습니다.', 'error');
      return;
    }

    if (!confirm(`"${selectedScenario.title}" 시나리오로 새 세션을 생성하시겠습니까?`)) {
      return;
    }

    try {
      setCreating(true);
      const startYearForScenario = selectedScenario.startYear || 180;
      const safeScenarioId = selectedScenario.id.replace(/\//g, '_');
      const timestamp = Date.now();
      const sessionId = `${safeScenarioId}_${timestamp}`;

      const result = await SammoAPI.AdminSessionCreate({
        sessionId,
        scenario: selectedScenario.title,
        turnterm: 60,
        config: {
          startyear: startYearForScenario,
        },
      });

      if (!result.success) {
        showToast(result.message || '세션 생성에 실패했습니다', 'error');
        return;
      }

      showToast(`세션이 생성되었습니다: ${sessionId}`, 'success');
      await loadAll();
    } catch (err: any) {
      console.error(err);
      showToast(err.message || '세션 생성에 실패했습니다', 'error');
    } finally {
      setCreating(false);
    }
  }

  async function handleReset(sessionId: string) {
    const target = sessions.find((s) => s.sessionId === sessionId);
    const title = target?.scenario || sessionId;

    if (!confirm(`세션 "${title}" 을(를) 전역 리셋하시겠습니까?\n\n장수/국가/도시 등의 모든 게임 데이터가 삭제됩니다.`)) {
      return;
    }

    try {
      setResettingId(sessionId);
      const result = await SammoAPI.AdminSessionReset({ sessionId });
      if (!result.success) {
        showToast(result.message || '세션 리셋에 실패했습니다', 'error');
        return;
      }
      showToast('세션이 전역적으로 리셋되었습니다.', 'success');
      await loadAll();
    } catch (err: any) {
      console.error(err);
      showToast(err.message || '세션 리셋에 실패했습니다', 'error');
    } finally {
      setResettingId(null);
    }
  }

  const renderLoading = () => (
    <div className="flex min-h-screen items-center justify-center bg-gray-950 px-4 py-10 text-gray-100">
      <div className="rounded-3xl border border-white/10 bg-black/40 px-10 py-8 text-lg text-gray-300 shadow-2xl">
        로딩 중...
      </div>
    </div>
  );

  if (loading) {
    return renderLoading();
  }

  return (
    <div className="min-h-screen bg-gray-950 px-4 py-10 text-gray-100">
      <div className="mx-auto w-full max-w-6xl space-y-8">
        <div className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-black/40 p-6 shadow-2xl lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-orange-400/70">세션</p>
            <h1 className="mt-1 text-3xl font-bold text-white">전역 세션 관리</h1>
            <p className="text-sm text-gray-400">시나리오 기반 서버를 생성/초기화합니다.</p>
          </div>
          <Link
            href="/admin"
            className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/5 px-5 py-2 text-sm font-medium text-gray-200 transition hover:border-orange-400/60 hover:bg-orange-500/10"
          >
            ← 관리자 패널로 돌아가기
          </Link>
        </div>

        <section className="rounded-3xl border border-white/10 bg-black/40 p-6 shadow-2xl">
          <div className="flex flex-col gap-2 border-b border-white/10 pb-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-orange-400/70">실시간</p>
              <h2 className="text-2xl font-semibold text-white">세션 목록</h2>
            </div>
            <p className="text-sm text-gray-400">총 {sessions.length}개</p>
          </div>

          {sessions.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-10 text-center text-gray-400">
              등록된 세션이 없습니다.
            </div>
          ) : (
            <div className="mt-6 overflow-x-auto">
              <table className="min-w-full divide-y divide-white/10 text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-widest text-gray-400">
                    <th className="py-3 pr-4 font-semibold">세션 ID</th>
                    <th className="py-3 pr-4 font-semibold">시나리오</th>
                    <th className="py-3 pr-4 font-semibold">상태</th>
                    <th className="py-3 pr-4 font-semibold">턴 정보</th>
                    <th className="py-3 pr-4 font-semibold">액션</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-gray-200">
                  {sessions.map((s) => (
                    <tr key={s.sessionId} className="hover:bg-white/5">
                      <td className="py-3 pr-4 font-semibold text-white">{s.sessionId}</td>
                      <td className="py-3 pr-4">{s.scenario}</td>
                      <td className="py-3 pr-4 text-sm text-gray-300">{s.statusText}</td>
                      <td className="py-3 pr-4 text-sm text-gray-400">
                        {s.year ?? '-'}년 {s.month ?? '-'}월 / {s.turnterm ?? '-'}분턴
                      </td>
                      <td className="py-3 pr-4">
                        <button
                          type="button"
                          onClick={() => handleReset(s.sessionId)}
                          disabled={resettingId === s.sessionId}
                          className="rounded-full border border-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-white transition hover:border-red-400/60 hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          {resettingId === s.sessionId ? '리셋중...' : '전역 리셋'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="rounded-3xl border border-white/10 bg-black/40 p-6 shadow-2xl">
          <div className="border-b border-white/10 pb-4">
            <p className="text-sm uppercase tracking-[0.3em] text-orange-400/70">시나리오</p>
            <h2 className="text-2xl font-semibold text-white">새 세션 생성</h2>
          </div>
          <div className="mt-6 flex flex-col gap-4 lg:flex-row lg:items-center">
            <select
              value={selectedScenarioId}
              onChange={(e) => setSelectedScenarioId(e.target.value)}
              className="flex-1 rounded-2xl border border-white/10 bg-black/60 px-4 py-3 text-sm text-white shadow-inner focus:border-orange-400/60 focus:outline-none"
            >
              <option value="">-- 시나리오 선택 --</option>
              {scenarios.map((s) => (
                <option key={s.id} value={s.id} className="bg-gray-900 text-white">
                  {s.title} ({s.startYear}년)
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={handleCreate}
              disabled={creating}
              className="rounded-2xl border border-white/10 bg-orange-500/90 px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {creating ? '생성중...' : '선택한 시나리오로 새 세션 생성'}
            </button>
          </div>
          <p className="mt-4 text-sm text-gray-400">
            • 세션 ID는 시나리오 ID + 타임스탬프를 조합해 생성됩니다.
            <br />• 생성된 세션은 `/api/gateway/get-server-status` 와 데몬 sessions 컬렉션 기준으로 관리됩니다.
          </p>
        </section>
      </div>
    </div>
  );
}
