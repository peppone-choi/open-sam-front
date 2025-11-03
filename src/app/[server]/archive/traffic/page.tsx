'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import TopBackBar from '@/components/common/TopBackBar';
import styles from './page.module.css';

export default function TrafficPage() {
  const params = useParams();
  const serverID = params?.server as string;

  const [loading, setLoading] = useState(true);
  const [trafficData, setTrafficData] = useState<any>(null);

  useEffect(() => {
    loadTrafficData();
  }, [serverID]);

  async function loadTrafficData() {
    try {
      setLoading(true);
      // API 호출 로직 필요
      setTrafficData(null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.container}>
      <TopBackBar title="트래픽정보" />
      {loading ? (
        <div className="center" style={{ padding: '2rem' }}>로딩 중...</div>
      ) : trafficData ? (
        <div className={styles.content}>
          <div className={styles.statsSection}>
            <div className={styles.statItem}>
              <div className={styles.statLabel}>현재 접속자</div>
              <div className={styles.statValue}>{trafficData.currentOnline || 0}</div>
            </div>
            <div className={styles.statItem}>
              <div className={styles.statLabel}>최대 접속자</div>
              <div className={styles.statValue}>{trafficData.maxOnline || 0}</div>
            </div>
            <div className={styles.statItem}>
              <div className={styles.statLabel}>현재 갱신수</div>
              <div className={styles.statValue}>{trafficData.currentRefresh || 0}</div>
            </div>
            <div className={styles.statItem}>
              <div className={styles.statLabel}>최대 갱신수</div>
              <div className={styles.statValue}>{trafficData.maxRefresh || 0}</div>
            </div>
          </div>
          <div className={styles.trafficChart}>
            {/* 트래픽 차트 표시 */}
          </div>
        </div>
      ) : (
        <div className="center" style={{ padding: '2rem' }}>데이터를 불러올 수 없습니다.</div>
      )}
    </div>
  );
}

