'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import TopBackBar from '@/components/common/TopBackBar';
import styles from './page.module.css';

export default function AdminTimeControlPage() {
  const params = useParams();
  const serverID = params?.server as string;

  const [loading, setLoading] = useState(true);
  const [timeData, setTimeData] = useState<any>(null);
  const [minute, setMinute] = useState('');
  const [minute2, setMinute2] = useState('');

  useEffect(() => {
    loadTimeData();
  }, [serverID]);

  async function loadTimeData() {
    try {
      setLoading(true);
      // API 호출 로직 필요
      setTimeData(null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleTimeControl(action: string) {
    try {
      // API 호출 로직 필요
      alert('처리되었습니다.');
      await loadTimeData();
    } catch (err) {
      console.error(err);
      alert('처리에 실패했습니다.');
    }
  }

  return (
    <div className={styles.container}>
      <TopBackBar title="시간 조정" />
      {loading ? (
        <div className="center" style={{ padding: '2rem' }}>로딩 중...</div>
      ) : (
        <div className={styles.content}>
          <div className={styles.timeControlForm}>
            <div className={styles.formRow}>
              <label>시간조정 (분)</label>
              <input
                type="number"
                value={minute}
                onChange={(e) => setMinute(e.target.value)}
                className={styles.input}
                size={3}
              />
              <button type="button" onClick={() => handleTimeControl('forward')} className={styles.button}>
                분당김
              </button>
              <button type="button" onClick={() => handleTimeControl('backward')} className={styles.button}>
                분지연
              </button>
              <span>최종갱신: {timeData?.turntime || '-'}</span>
            </div>
            <div className={styles.formRow}>
              <label>토너먼트 시간조정 (분)</label>
              <input
                type="number"
                value={minute2}
                onChange={(e) => setMinute2(e.target.value)}
                className={styles.input}
                size={3}
              />
              <button type="button" onClick={() => handleTimeControl('tnmt_forward')} className={styles.button}>
                토너분당김
              </button>
              <button type="button" onClick={() => handleTimeControl('tnmt_backward')} className={styles.button}>
                토너분지연
              </button>
              <span>토너먼트: {timeData?.tnmt_time || '-'}</span>
            </div>
            <div className={styles.formRow}>
              <button type="button" onClick={() => handleTimeControl('gold_payment')} className={styles.button}>
                금지급
              </button>
              <button type="button" onClick={() => handleTimeControl('rice_payment')} className={styles.button}>
                쌀지급
              </button>
            </div>
            <div className={styles.formRow}>
              <button type="button" onClick={() => handleTimeControl('lock')} className={styles.button}>
                락걸기
              </button>
              <button type="button" onClick={() => handleTimeControl('unlock')} className={styles.button}>
                락풀기
              </button>
              <span>현재: {timeData?.plock > 0 ? '동결중' : '가동중'}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

