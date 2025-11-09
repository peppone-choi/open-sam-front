'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { SammoAPI } from '@/lib/api/sammo';
import TopBackBar from '@/components/common/TopBackBar';
import styles from './page.module.css';

function ErrorLogContent() {
  const searchParams = useSearchParams();
  const from = searchParams?.get('from') ? Number(searchParams.get('from')) : 0;

  const [loading, setLoading] = useState(true);
  const [errorLogs, setErrorLogs] = useState<any[]>([]);

  useEffect(() => {
    loadErrorLogs();
  }, [from]);

  async function loadErrorLogs() {
    try {
      setLoading(true);
      const result = await SammoAPI.AdminGetErrorLog({
        from,
        limit: 100,
      });
      if (result.result) {
        setErrorLogs(result.errorLogs);
      }
    } catch (err) {
      console.error(err);
      alert('에러 로그를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }

  function handleNext() {
    const url = new URL(window.location.href);
    url.searchParams.set('from', String(from + 100));
    window.location.href = url.toString();
  }

  function handlePrev() {
    if (from >= 100) {
      const url = new URL(window.location.href);
      url.searchParams.set('from', String(from - 100));
      window.location.href = url.toString();
    }
  }

  return (
    <div className={styles.container}>
      <TopBackBar title="에러 로그" />
      {loading ? (
        <div className="center" style={{ padding: '2rem' }}>로딩 중...</div>
      ) : (
        <div className={styles.content}>
          <div className={styles.pagination}>
            <button type="button" onClick={handlePrev} disabled={from === 0} className={styles.button}>
              이전
            </button>
            <span className={styles.pageInfo}>페이지: {Math.floor(from / 100) + 1}</span>
            <button type="button" onClick={handleNext} className={styles.button}>
              다음
            </button>
          </div>
          <div className={styles.errorList}>
            {errorLogs.map((log, idx) => (
              <div key={idx} className={styles.errorItem}>
                <div className={styles.errorDate}>{log.date}</div>
                <div className={styles.errorMessage}>{log.errstr}</div>
                <div className={styles.errorPath}>{log.errpath}</div>
                {log.trace && (
                  <details className={styles.errorTrace}>
                    <summary>스택 트레이스</summary>
                    <pre>{log.trace}</pre>
                  </details>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function ErrorLogPage() {
  return (
    <Suspense fallback={<div className="center" style={{ padding: '2rem' }}>로딩 중...</div>}>
      <ErrorLogContent />
    </Suspense>
  );
}




