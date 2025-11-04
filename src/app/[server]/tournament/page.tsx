'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { SammoAPI } from '@/lib/api/sammo';
import TopBackBar from '@/components/common/TopBackBar';
import styles from './page.module.css';

export default function TournamentPage() {
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
      const result = await SammoAPI.GetTournament();
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

  async function handleJoin() {
    try {
      const result = await SammoAPI.JoinTournament();
      if (result.result) {
        alert('토너먼트에 참가 신청되었습니다.');
        await loadTournamentData();
      } else {
        alert(result.reason || '참가 신청에 실패했습니다.');
      }
    } catch (err) {
      console.error(err);
      alert('참가 신청에 실패했습니다.');
    }
  }

  return (
    <div className={styles.container}>
      <TopBackBar title="토 너 먼 트" reloadable onReload={loadTournamentData} />
      {loading ? (
        <div className="center" style={{ padding: '2rem' }}>로딩 중...</div>
      ) : (
        <div className={styles.content}>
          <div className={styles.tournamentInfo}>
            <h2>토너먼트 정보</h2>
            <div className={styles.status}>{tournamentData?.status || '진행중인 토너먼트가 없습니다.'}</div>
            {tournamentData?.canJoin && (
              <button type="button" onClick={handleJoin} className={styles.joinButton}>
                참가 신청
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}




