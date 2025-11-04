'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { SammoAPI } from '@/lib/api/sammo';
import TopBackBar from '@/components/common/TopBackBar';
import styles from './page.module.css';

export default function NationStratFinanPage() {
  const params = useParams();
  const serverID = params?.server as string;

  const [loading, setLoading] = useState(true);
  const [nationData, setNationData] = useState<any>(null);

  useEffect(() => {
    loadNationData();
  }, [serverID]);

  async function loadNationData() {
    try {
      setLoading(true);
      const result = await SammoAPI.NationGetStratFinan();
      if (result.result) {
        setNationData(result.stratFinan);
      }
    } catch (err) {
      console.error(err);
      alert('내무부 정보를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.container}>
      <TopBackBar title="내 무 부" reloadable onReload={loadNationData} />
      {loading ? (
        <div className="center" style={{ padding: '2rem' }}>로딩 중...</div>
      ) : (
        <div className={styles.content}>
          <div className={styles.section}>
            <h2>국가 재정</h2>
            <div className={styles.financeGrid}>
              <div className={styles.financeItem}>
                <div className={styles.financeLabel}>국고</div>
                <div className={styles.financeValue}>{nationData?.gold?.toLocaleString() || '-'}</div>
              </div>
              <div className={styles.financeItem}>
                <div className={styles.financeLabel}>병량</div>
                <div className={styles.financeValue}>{nationData?.rice?.toLocaleString() || '-'}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}




