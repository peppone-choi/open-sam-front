'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import TopBackBar from '@/components/common/TopBackBar';
import styles from './page.module.css';

export default function HistoryPage() {
  const params = useParams();
  const serverID = params?.server as string;

  const [loading, setLoading] = useState(true);
  const [historyData, setHistoryData] = useState<any>(null);
  const [yearMonth, setYearMonth] = useState<string>('');

  useEffect(() => {
    loadHistory();
  }, [serverID, yearMonth]);

  async function loadHistory() {
    try {
      setLoading(true);
      // API 호출 로직 필요
      setHistoryData(null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.container}>
      <TopBackBar title="연감" reloadable onReload={loadHistory} />
      {loading ? (
        <div className="center" style={{ padding: '2rem' }}>로딩 중...</div>
      ) : (
        <div className={styles.content}>
          <div className={styles.controls}>
            <div className={styles.formGroup}>
              <label>년월 선택</label>
              <input
                type="text"
                value={yearMonth}
                onChange={(e) => setYearMonth(e.target.value)}
                placeholder="예: 202401"
                className={styles.input}
              />
            </div>
            <button type="button" onClick={loadHistory} className={styles.btn}>
              조회
            </button>
          </div>
          <div className={styles.historyContent}>
            {/* 연감 내용 표시 */}
          </div>
        </div>
      )}
    </div>
  );
}


