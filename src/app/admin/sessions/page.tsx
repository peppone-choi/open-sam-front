'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { SammoAPI } from '@/lib/api/sammo';
import { useToast } from '@/contexts/ToastContext';

type SessionStatus = 'running' | 'closed' | 'united' | 'preparing' | 'paused';

interface SessionData {
  sessionId: string;
  scenario: string;
  year?: number;
  month?: number;
  turnterm?: number;
  turntime?: string;
  status: SessionStatus;
  statusText: string;
  createdAt?: string;
  updatedAt?: string;
}

const STATUS_CONFIG: Record<SessionStatus, { label: string; color: string; icon: string }> = {
  running: { label: '운영중', color: 'text-emerald-400', icon: '🟢' },
  preparing: { label: '준비중', color: 'text-yellow-400', icon: '🟡' },
  paused: { label: '일시정지', color: 'text-amber-400', icon: '⏸️' },
  closed: { label: '폐쇄', color: 'text-gray-400', icon: '⚫' },
  united: { label: '천통', color: 'text-purple-400', icon: '👑' },
};

export default function AdminSessionsPage() {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [creating, setCreating] = useState(false);
  const [actioningId, setActioningId] = useState<string | null>(null);
  const [actionType, setActionType] = useState<string>('');
  const [scenarios, setScenarios] = useState<any[]>([]);
  const [selectedScenarioId, setSelectedScenarioId] = useState('');
  const [filterStatus, setFilterStatus] = useState<SessionStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

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

  async function handleSessionAction(sessionId: string, action: 'reset' | 'open' | 'close' | 'pause') {
    const target = sessions.find((s) => s.sessionId === sessionId);
    const title = target?.scenario || sessionId;

    const confirmMessages: Record<string, string> = {
      reset: `세션 "${title}" 을(를) 전역 리셋하시겠습니까?\n\n⚠️ 장수/국가/도시 등의 모든 게임 데이터가 삭제됩니다.`,
      open: `세션 "${title}" 을(를) 오픈하시겠습니까?\n\n게임이 시작되고 턴이 진행됩니다.`,
      close: `세션 "${title}" 을(를) 폐쇄하시겠습니까?\n\n신규 가입 및 턴 진행이 중단됩니다.`,
      pause: `세션 "${title}" 을(를) 일시정지하시겠습니까?\n\n턴 진행이 일시적으로 중단됩니다.`,
    };

    if (!confirm(confirmMessages[action])) {
      return;
    }

    try {
      setActioningId(sessionId);
      setActionType(action);

      let result;
      if (action === 'reset') {
        result = await SammoAPI.AdminSessionReset({ sessionId });
      } else if (action === 'open') {
        result = await SammoAPI.AdminSessionOpen({ sessionId });
      } else if (action === 'close') {
        result = await SammoAPI.AdminSessionClose({ sessionId });
      } else if (action === 'pause') {
        result = await SammoAPI.AdminUpdateGame({
          session_id: sessionId,
          action: 'status',
          data: { status: 'paused' },
        });
      }

      if (!result?.success && !result?.result) {
        showToast(result?.message || result?.reason || `${action} 실패`, 'error');
        return;
      }

      const successMessages: Record<string, string> = {
        reset: '세션이 리셋되었습니다.',
        open: '세션이 오픈되었습니다.',
        close: '세션이 폐쇄되었습니다.',
        pause: '세션이 일시정지되었습니다.',
      };
      showToast(successMessages[action], 'success');
      await loadAll();
    } catch (err: any) {
      console.error(err);
      showToast(err.message || `${action} 실패`, 'error');
    } finally {
      setActioningId(null);
      setActionType('');
    }
  }

  // 필터링된 세션 목록
  const filteredSessions = sessions.filter((s) => {
    const matchesStatus = filterStatus === 'all' || s.status === filterStatus;
    const matchesSearch =
      searchQuery === '' ||
      s.sessionId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.scenario.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  // 남은 턴 시간 계산
  function getRemainingTime(turntime?: string) {
    if (!turntime) return '-';
    const diff = new Date(turntime).getTime() - Date.now();
    if (diff <= 0) return '곧 실행';
    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    return `${minutes}분 ${seconds}초`;
  }

  const renderLoading = () => (
    <div className="flex min-h-screen items-center justify-center bg-gray-950 px-4 py-10 text-gray-100">
      <div className="rounded-3xl border border-white/10 bg-black/40 px-10 py-8 text-lg text-gray-300 shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-orange-400 border-t-transparent" />
          로딩 중...
        </div>
      </div>
    </div>
  );

  if (loading) {
    return renderLoading();
  }

  return (
    <div className="min-h-screen bg-gray-950 px-4 py-10 text-gray-100">
      <div className="mx-auto w-full max-w-7xl space-y-8">
        {/* 헤더 */}
        <div className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-black/40 p-6 shadow-2xl lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-orange-400/70">세션</p>
            <h1 className="mt-1 text-3xl font-bold text-white">전역 세션 관리</h1>
            <p className="text-sm text-gray-400">시나리오 기반 서버를 생성/관리합니다.</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={loadAll}
              className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-gray-200 transition hover:border-orange-400/60 hover:bg-orange-500/10"
            >
              🔄 새로고침
            </button>
            <Link
              href="/admin"
              className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/5 px-5 py-2 text-sm font-medium text-gray-200 transition hover:border-orange-400/60 hover:bg-orange-500/10"
            >
              ← 관리자 패널
            </Link>
          </div>
        </div>

        {/* 통계 카드 */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
          {(['all', 'running', 'preparing', 'paused', 'closed'] as const).map((status) => {
            const count = status === 'all' ? sessions.length : sessions.filter((s) => s.status === status).length;
            const config = status === 'all' ? { label: '전체', color: 'text-white', icon: '📊' } : STATUS_CONFIG[status];
            const isActive = filterStatus === status;

            return (
              <button
                key={status}
                type="button"
                onClick={() => setFilterStatus(status)}
                className={`rounded-2xl border p-4 text-left transition ${
                  isActive
                    ? 'border-orange-400/60 bg-orange-500/10'
                    : 'border-white/10 bg-black/40 hover:border-white/20 hover:bg-white/5'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-2xl">{config.icon}</span>
                  <span className="text-2xl font-bold text-white">{count}</span>
                </div>
                <p className={`mt-2 text-sm font-medium ${config.color}`}>{config.label}</p>
              </button>
            );
          })}
        </div>

        {/* 검색 */}
        <div className="flex gap-4">
          <div className="relative flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="세션 ID 또는 시나리오명으로 검색..."
              className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 pl-10 text-sm text-white placeholder-gray-500 focus:border-orange-400/60 focus:outline-none"
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">🔍</span>
          </div>
        </div>

        {/* 세션 목록 */}
        <section className="rounded-3xl border border-white/10 bg-black/40 p-6 shadow-2xl">
          <div className="flex flex-col gap-2 border-b border-white/10 pb-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-orange-400/70">실시간</p>
              <h2 className="text-2xl font-semibold text-white">세션 목록</h2>
            </div>
            <p className="text-sm text-gray-400">
              {filterStatus === 'all' ? `총 ${sessions.length}개` : `${filteredSessions.length}개 필터링됨`}
            </p>
          </div>

          {filteredSessions.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-10 text-center text-gray-400">
              {searchQuery || filterStatus !== 'all' ? '조건에 맞는 세션이 없습니다.' : '등록된 세션이 없습니다.'}
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
                    <th className="py-3 pr-4 font-semibold">다음 턴</th>
                    <th className="py-3 pr-4 font-semibold text-right">액션</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-gray-200">
                  {filteredSessions.map((s) => {
                    const statusConfig = STATUS_CONFIG[s.status] || STATUS_CONFIG.closed;
                    const isActioning = actioningId === s.sessionId;

                    return (
                      <tr key={s.sessionId} className="hover:bg-white/5">
                        <td className="py-3 pr-4">
                          <Link
                            href={`/${s.sessionId}/admin`}
                            className="font-semibold text-orange-400 hover:text-orange-300 hover:underline"
                          >
                            {s.sessionId}
                          </Link>
                        </td>
                        <td className="py-3 pr-4 text-gray-300">{s.scenario}</td>
                        <td className="py-3 pr-4">
                          <span className={`inline-flex items-center gap-1.5 text-sm font-medium ${statusConfig.color}`}>
                            <span>{statusConfig.icon}</span>
                            {statusConfig.label}
                          </span>
                        </td>
                        <td className="py-3 pr-4 text-sm text-gray-400">
                          {s.year ?? '-'}년 {s.month ?? '-'}월 / {s.turnterm ?? '-'}분턴
                        </td>
                        <td className="py-3 pr-4 text-sm text-gray-400">{getRemainingTime(s.turntime)}</td>
                        <td className="py-3 pr-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {/* 상태에 따른 버튼 표시 */}
                            {s.status === 'closed' && (
                              <button
                                type="button"
                                onClick={() => handleSessionAction(s.sessionId, 'open')}
                                disabled={isActioning}
                                className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-400 transition hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-40"
                              >
                                {isActioning && actionType === 'open' ? '처리중...' : '오픈'}
                              </button>
                            )}
                            {s.status === 'running' && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleSessionAction(s.sessionId, 'pause')}
                                  disabled={isActioning}
                                  className="rounded-full border border-yellow-400/30 bg-yellow-500/10 px-3 py-1.5 text-xs font-semibold text-yellow-400 transition hover:bg-yellow-500/20 disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                  {isActioning && actionType === 'pause' ? '처리중...' : '일시정지'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleSessionAction(s.sessionId, 'close')}
                                  disabled={isActioning}
                                  className="rounded-full border border-gray-400/30 bg-gray-500/10 px-3 py-1.5 text-xs font-semibold text-gray-400 transition hover:bg-gray-500/20 disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                  {isActioning && actionType === 'close' ? '처리중...' : '폐쇄'}
                                </button>
                              </>
                            )}
                            {s.status === 'paused' && (
                              <button
                                type="button"
                                onClick={() => handleSessionAction(s.sessionId, 'open')}
                                disabled={isActioning}
                                className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-400 transition hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-40"
                              >
                                {isActioning && actionType === 'open' ? '처리중...' : '재개'}
                              </button>
                            )}
                            {/* 리셋 버튼 (항상 표시) */}
                            <button
                              type="button"
                              onClick={() => handleSessionAction(s.sessionId, 'reset')}
                              disabled={isActioning}
                              className="rounded-full border border-red-400/30 bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-400 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              {isActioning && actionType === 'reset' ? '처리중...' : '리셋'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* 새 세션 생성 */}
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
              {creating ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  생성중...
                </span>
              ) : (
                '+ 새 세션 생성'
              )}
            </button>
          </div>
          <div className="mt-4 rounded-xl bg-white/5 p-4 text-sm text-gray-400">
            <p className="font-medium text-gray-300">💡 세션 생성 안내</p>
            <ul className="mt-2 list-inside list-disc space-y-1">
              <li>세션 ID는 시나리오 ID + 타임스탬프를 조합해 자동 생성됩니다.</li>
              <li>새로 생성된 세션은 폐쇄(closed) 상태로 시작합니다.</li>
              <li>오픈 버튼을 눌러 게임을 시작할 수 있습니다.</li>
            </ul>
          </div>
        </section>
      </div>
    </div>
  );
}
