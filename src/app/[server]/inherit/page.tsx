'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import TopBackBar from '@/components/common/TopBackBar';
import styles from './page.module.css';

export default function InheritPage() {
  const params = useParams();
  const serverID = params?.server as string;

  const [loading, setLoading] = useState(true);
  const [inheritData, setInheritData] = useState<any>(null);

  useEffect(() => {
    loadInheritData();
  }, [serverID]);

  async function loadInheritData() {
    try {
      setLoading(true);
      // API 호출 로직 필요
      setInheritData(null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.container}>
      <TopBackBar title="유산 관리" reloadable onReload={loadInheritData} />
      {loading ? (
        <div className="center" style={{ padding: '2rem' }}>로딩 중...</div>
      ) : (
        <div className={styles.content}>
          <div className={styles.inheritInfo}>
            <h2>유산 포인트</h2>
            <div className={styles.pointValue}>{inheritData?.totalPoint || 0}</div>
          </div>
        </div>
      )}
    </div>
  );
}

