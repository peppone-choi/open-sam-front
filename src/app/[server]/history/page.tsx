'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { SammoAPI } from '@/lib/api/sammo';
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
      
      let year: number | undefined;
      let month: number | undefined;
      
      if (yearMonth) {
        // "202401" 형식 파싱
        const match = yearMonth.match(/^(\d{4})(\d{2})$/);
        if (match) {
          year = parseInt(match[1]);
          month = parseInt(match[2]);
        }
      }

      const result = await SammoAPI.GetHistory({
        year,
        month,
      });

      if (result.result) {
        setHistoryData(result.history);
      }
    } catch (err) {
      console.error(err);
      alert('연감 정보를 불러오는데 실패했습니다.');
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


