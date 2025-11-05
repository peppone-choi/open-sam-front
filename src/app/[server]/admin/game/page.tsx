'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { SammoAPI } from '@/lib/api/sammo';
import TopBackBar from '@/components/common/TopBackBar';
import styles from './page.module.css';

export default function AdminGamePage() {
  const params = useParams();
  const serverID = params?.server as string;

  const [loading, setLoading] = useState(true);
  const [adminData, setAdminData] = useState<any>(null);
  const [formData, setFormData] = useState<any>({});
  const [systemStatus, setSystemStatus] = useState<any>(null);
  const [timeAdjustMinutes, setTimeAdjustMinutes] = useState<number>(60);

  useEffect(() => {
    loadAdminData();
    loadSystemStatus();
  }, [serverID]);

  async function loadAdminData() {
    try {
      setLoading(true);
      const result = await SammoAPI.AdminGetGameInfo();
      if (result.result) {
        setAdminData(result.gameInfo);
        setFormData(result.gameInfo || {});
      }
    } catch (err) {
      console.error(err);
      alert('게임 정보를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }

  async function loadSystemStatus() {
    try {
      const result = await SammoAPI.AdminGetSystemStatus();
      if (result.result) {
        setSystemStatus(result.status);
      }
    } catch (err) {
      console.error(err);
    }
  }

  async function handleSubmit(action: string) {
    try {
      const result = await SammoAPI.AdminUpdateGame({
        action,
        data: formData,
      });

      if (result.result) {
        alert('변경되었습니다.');
        await loadAdminData();
      } else {
        alert(result.reason || '변경에 실패했습니다.');
      }
    } catch (err) {
      console.error(err);
      alert('변경에 실패했습니다.');
    }
  }

  async function handleAdjustTime(type: 'turn_advance' | 'turn_delay' | 'tournament_advance' | 'tournament_delay') {
    try {
      const result = await SammoAPI.AdminAdjustTime({
        type,
        minutes: timeAdjustMinutes,
      });

      if (result.result) {
        alert(result.reason || '시간이 조정되었습니다.');
        await loadSystemStatus();
      } else {
        alert(result.reason || '시간 조정에 실패했습니다.');
      }
    } catch (err) {
      console.error(err);
      alert('시간 조정에 실패했습니다.');
    }
  }

  async function handleToggleLock(lock: boolean) {
    try {
      const result = await SammoAPI.AdminToggleLock({ lock });

      if (result.result) {
        alert(result.reason || '변경되었습니다.');
        await loadSystemStatus();
      } else {
        alert(result.reason || '변경에 실패했습니다.');
      }
    } catch (err) {
      console.error(err);
      alert('변경에 실패했습니다.');
    }
  }

  async function handlePaySalary(type: 'gold' | 'rice') {
    try {
      const result = await SammoAPI.AdminPaySalary({ type });

      if (result.result) {
        alert(result.reason || '지급되었습니다.');
      } else {
        alert(result.reason || '지급에 실패했습니다.');
      }
    } catch (err) {
      console.error(err);
      alert('지급에 실패했습니다.');
    }
  }

  return (
    <div className={styles.container}>
      <TopBackBar title="게 임 관 리" />
      {loading ? (
        <div className="center" style={{ padding: '2rem' }}>로딩 중...</div>
      ) : (
        <div className={styles.content}>
          <div className={styles.adminForm}>
            <div className={styles.formRow}>
              <label>운영자메세지</label>
              <input
                type="text"
                value={formData.msg || ''}
                onChange={(e) => setFormData({ ...formData, msg: e.target.value })}
                className={styles.input}
              />
              <button type="button" onClick={() => handleSubmit('msg')} className={styles.button}>
                변경
              </button>
            </div>

            <section className={styles.section}>
              <h2>시간 제어</h2>
              {systemStatus && (
                <div className={styles.statusInfo}>
                  <div>현재 턴 시간: {systemStatus.turntime ? new Date(systemStatus.turntime).toLocaleString('ko-KR') : 'N/A'}</div>
                  <div>토너먼트 시간: {systemStatus.tnmt_time ? new Date(systemStatus.tnmt_time).toLocaleString('ko-KR') : 'N/A'}</div>
                  <div>턴 주기: {systemStatus.turnterm}분</div>
                </div>
              )}
              <div className={styles.formRow}>
                <label>분 조정</label>
                <input
                  type="number"
                  value={timeAdjustMinutes}
                  onChange={(e) => setTimeAdjustMinutes(parseInt(e.target.value, 10) || 60)}
                  className={styles.input}
                  style={{ width: '100px' }}
                />
                <span>분</span>
              </div>
              <div className={styles.buttonGroup}>
                <button type="button" onClick={() => handleAdjustTime('turn_advance')} className={styles.button}>
                  턴 앞당김
                </button>
                <button type="button" onClick={() => handleAdjustTime('turn_delay')} className={styles.button}>
                  턴 지연
                </button>
                <button type="button" onClick={() => handleAdjustTime('tournament_advance')} className={styles.button}>
                  토너먼트 앞당김
                </button>
                <button type="button" onClick={() => handleAdjustTime('tournament_delay')} className={styles.button}>
                  토너먼트 지연
                </button>
              </div>
            </section>

            <section className={styles.section}>
              <h2>락 제어</h2>
              {systemStatus && (
                <div className={styles.statusInfo}>
                  <div>현재 상태: {systemStatus.plock > 0 ? '🔒 동결중' : '✅ 가동중'}</div>
                </div>
              )}
              <div className={styles.buttonGroup}>
                <button type="button" onClick={() => handleToggleLock(true)} className={styles.button}>
                  락 걸기 (동결)
                </button>
                <button type="button" onClick={() => handleToggleLock(false)} className={styles.button}>
                  락 풀기 (가동)
                </button>
              </div>
            </section>

            <section className={styles.section}>
              <h2>봉급 지급 (TODO)</h2>
              <div className={styles.buttonGroup}>
                <button type="button" onClick={() => handlePaySalary('gold')} className={styles.button}>
                  금 지급
                </button>
                <button type="button" onClick={() => handlePaySalary('rice')} className={styles.button}>
                  쌀 지급
                </button>
              </div>
            </section>
          </div>
        </div>
      )}
    </div>
  );
}




