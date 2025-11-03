'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import TopBackBar from '@/components/common/TopBackBar';
import styles from './page.module.css';

export default function TournamentInfoPage() {
  const params = useParams();
  const serverID = params?.server as string;

  const [loading, setLoading] = useState(true);
  const [tournamentData, setTournamentData] = useState<any>(null);

  useEffect(() => {
    loadTournamentData();
  }, [serverID]);

  async function loadTournamentData() {
    try {
      setLoading(true);
      // API 호출 로직 필요
      setTournamentData(null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.container}>
      <TopBackBar title="토너먼트 정보" reloadable onReload={loadTournamentData} />
      {loading ? (
        <div className="center" style={{ padding: '2rem' }}>로딩 중...</div>
      ) : tournamentData ? (
        <div className={styles.content}>
          <div className={styles.tournamentInfo}>
            <h2>{tournamentData.name || '토너먼트'}</h2>
            <div className={styles.tournamentDetails}>
              {/* 토너먼트 상세 정보 */}
            </div>
          </div>
        </div>
      ) : (
        <div className="center" style={{ padding: '2rem' }}>토너먼트 정보를 불러올 수 없습니다.</div>
      )}
    </div>
  );
}


