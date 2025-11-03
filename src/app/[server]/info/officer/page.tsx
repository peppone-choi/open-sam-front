'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import TopBackBar from '@/components/common/TopBackBar';
import styles from './page.module.css';

export default function OfficerPage() {
  const params = useParams();
  const serverID = params?.server as string;

  const [loading, setLoading] = useState(true);
  const [officerData, setOfficerData] = useState<any>(null);

  useEffect(() => {
    loadOfficerData();
  }, [serverID]);

  async function loadOfficerData() {
    try {
      setLoading(true);
      // API 호출 로직 필요
      setOfficerData(null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.container}>
      <TopBackBar title="인 사 부" reloadable onReload={loadOfficerData} />
      {loading ? (
        <div className="center" style={{ padding: '2rem' }}>로딩 중...</div>
      ) : (
        <div className={styles.content}>
          <div className={styles.officerCard}>
            <h2>{officerData?.name || '-'}</h2>
            <div className={styles.officeName}>{officerData?.officeName || '-'}</div>
            <div className={styles.statsSection}>
              <h3>능력치</h3>
              <div className={styles.statsGrid}>
                <div className={styles.statItem}>
                  <div className={styles.statLabel}>통솔</div>
                  <div className={styles.statValue}>{officerData?.leadership || '-'}</div>
                </div>
                <div className={styles.statItem}>
                  <div className={styles.statLabel}>무력</div>
                  <div className={styles.statValue}>{officerData?.strength || '-'}</div>
                </div>
                <div className={styles.statItem}>
                  <div className={styles.statLabel}>지력</div>
                  <div className={styles.statValue}>{officerData?.intel || '-'}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

