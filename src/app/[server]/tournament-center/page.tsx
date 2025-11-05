'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { SammoAPI } from '@/lib/api/sammo';
import TopBackBar from '@/components/common/TopBackBar';
import styles from './page.module.css';

export default function TournamentCenterPage() {
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
      const result = await SammoAPI.GetTournamentCenter();
      if (result.result) {
        setTournamentData(result.tournament);
      }
    } catch (err) {
      console.error(err);
      alert('토너먼트 정보를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.container}>
      <TopBackBar title="토너먼트 센터" reloadable onReload={loadTournamentData} />
      {loading ? (
        <div className="center" style={{ padding: '2rem' }}>로딩 중...</div>
      ) : (
        <div className={styles.content}>
          <div className={styles.tournamentInfo}>
            <h2>토너먼트 정보</h2>
            <div className={styles.status}>{tournamentData?.status || '진행중인 토너먼트가 없습니다.'}</div>
          </div>
        </div>
      )}
    </div>
  );
}




