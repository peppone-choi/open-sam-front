'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import TopBackBar from '@/components/common/TopBackBar';
import styles from './page.module.css';

export default function ChiefPage() {
  const params = useParams();
  const serverID = params?.server as string;

  const [loading, setLoading] = useState(true);
  const [chiefData, setChiefData] = useState<any>(null);

  useEffect(() => {
    loadChiefData();
  }, [serverID]);

  async function loadChiefData() {
    try {
      setLoading(true);
      // API 호출 로직 필요
      setChiefData(null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.container}>
      <TopBackBar title="사 령 부" reloadable onReload={loadChiefData} />
      {loading ? (
        <div className="center" style={{ padding: '2rem' }}>로딩 중...</div>
      ) : (
        <div className={styles.content}>
          <div className={styles.chiefSubTable}>
            {/* 사령부 턴별 명령 표시 */}
          </div>
        </div>
      )}
    </div>
  );
}


