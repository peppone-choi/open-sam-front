'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { SammoAPI } from '@/lib/api/sammo';
import styles from '../page.module.css';

export default function AdminSessionsPage() {
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
      alert('세션 정보를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate() {
    if (!selectedScenarioId) {
      alert('시나리오를 선택해주세요');
      return;
    }

    const selectedScenario = scenarios.find((s) => s.id === selectedScenarioId);
    if (!selectedScenario) {
      alert('선택한 시나리오를 찾을 수 없습니다.');
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
        alert(result.message || '세션 생성에 실패했습니다');
        return;
      }

      alert(`세션이 생성되었습니다: ${sessionId}`);
      await loadAll();
    } catch (err: any) {
      console.error(err);
      alert(err.message || '세션 생성에 실패했습니다');
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
        alert(result.message || '세션 리셋에 실패했습니다');
        return;
      }
      alert('세션이 전역적으로 리셋되었습니다.');
      await loadAll();
    } catch (err: any) {
      console.error(err);
      alert(err.message || '세션 리셋에 실패했습니다');
    } finally {
      setResettingId(null);
    }
  }

  if (loading) {
    return (
      <div className={styles.container}>
        <div className="center" style={{ padding: '2rem' }}>로딩 중...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>전역 세션 관리</h1>
        <Link href="/admin" className={styles.backLink}>
          ← 관리자 패널로 돌아가기
        </Link>
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <h2>세션 목록</h2>
        {sessions.length === 0 ? (
          <p>등록된 세션이 없습니다.</p>
        ) : (
          <table className="tb_layout bg0" style={{ width: '100%', marginTop: '0.5rem' }}>
            <thead>
              <tr className="bg2">
                <th>세션 ID</th>
                <th>시나리오</th>
                <th>상태</th>
                <th>턴 정보</th>
                <th>액션</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((s) => (
                <tr key={s.sessionId}>
                  <td>{s.sessionId}</td>
                  <td>{s.scenario}</td>
                  <td>{s.statusText}</td>
                  <td>
                    {s.year ?? '-'}년 {s.month ?? '-'}월 / {s.turnterm ?? '-'}분턴
                  </td>
                  <td>
                    <button
                      type="button"
                      onClick={() => handleReset(s.sessionId)}
                      disabled={resettingId === s.sessionId}
                      style={{
                        padding: '0.2rem 0.8rem',
                        backgroundColor: '#b71c1c',
                        color: 'white',
                        border: '1px solid #666',
                        cursor: 'pointer',
                        fontSize: '0.85em',
                      }}
                    >
                      {resettingId === s.sessionId ? '리셋중...' : '전역 리셋'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div>
        <h2>새 세션 생성</h2>
        <div style={{ marginBottom: '0.5rem' }}>
          <select
            value={selectedScenarioId}
            onChange={(e) => setSelectedScenarioId(e.target.value)}
            style={{
              width: '400px',
              backgroundColor: 'black',
              color: 'white',
              border: '1px solid #666',
              padding: '0.4rem',
              marginRight: '0.5rem',
            }}
          >
            <option value="">-- 시나리오 선택 --</option>
            {scenarios.map((s) => (
              <option key={s.id} value={s.id}>
                {s.title} ({s.startYear}년)
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={handleCreate}
            disabled={creating}
            style={{
              padding: '0.4rem 1.2rem',
              backgroundColor: '#1976d2',
              color: 'white',
              border: '1px solid #666',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '0.9em',
            }}
          >
            {creating ? '생성중...' : '선택한 시나리오로 새 세션 생성'}
          </button>
        </div>
        <div style={{ color: '#aaa', fontSize: '0.85em' }}>
          - 세션 ID는 시나리오 ID와 시간 정보를 조합해 자동으로 생성됩니다.
          <br />- 생성된 세션은 `/api/gateway/get-server-status`와 데몬에서 사용하는 sessions 컬렉션 기준으로 관리됩니다.
        </div>
      </div>
    </div>
  );
}
