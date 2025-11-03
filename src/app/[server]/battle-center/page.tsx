'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import TopBackBar from '@/components/common/TopBackBar';
import styles from './page.module.css';

export default function BattleCenterPage() {
  const params = useParams();
  const serverID = params?.server as string;

  const [loading, setLoading] = useState(true);
  const [battleData, setBattleData] = useState<any>(null);

  useEffect(() => {
    loadBattleData();
  }, [serverID]);

  async function loadBattleData() {
    try {
      setLoading(true);
      // API 호출 로직 필요
      setBattleData(null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.container}>
      <TopBackBar title="감 찰 부" reloadable onReload={loadBattleData} />
      {loading ? (
        <div className="center" style={{ padding: '2rem' }}>로딩 중...</div>
      ) : (
        <div className={styles.content}>
          <div className={styles.battleList}>
            {/* 전투 목록 표시 */}
          </div>
        </div>
      )}
    </div>
  );
}

