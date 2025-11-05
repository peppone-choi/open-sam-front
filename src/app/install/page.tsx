'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SammoAPI } from '@/lib/api/sammo';
import styles from './page.module.css';

export default function RootInstallPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [installStatus, setInstallStatus] = useState<any>(null);

  useEffect(() => {
    checkInstallStatus();
  }, []);

  async function checkInstallStatus() {
    try {
      setLoading(true);
      const result = await SammoAPI.CheckInstallStatus();
      if (result.result) {
        setInstallStatus({ installed: result.installed, status: result.status });
      }
    } catch (err) {
      console.error(err);
      // 설치 상태 확인 실패는 무시 (설치되지 않은 경우일 수 있음)
      setInstallStatus({ installed: false });
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>로딩 중...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>OpenSAM 설치</h1>
      <div className={styles.installCard}>
        <h3 className={styles.cardHeader}>설치 상태</h3>
        <div className={styles.content}>
          <p>시스템을 초기 설정합니다.</p>
          <button type="button" onClick={() => router.push('/install/setup')} className={styles.button}>
            설치 시작
          </button>
        </div>
      </div>
    </div>
  );
}




