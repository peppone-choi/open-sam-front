'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { SammoAPI } from '@/lib/api/sammo';
import TopBackBar from '@/components/common/TopBackBar';
import styles from './page.module.css';

export default function NationBettingPage() {
  const params = useParams();
  const serverID = params?.server as string;

  const [loading, setLoading] = useState(true);
  const [bettingData, setBettingData] = useState<any>(null);

  useEffect(() => {
    loadBettingData();
  }, [serverID]);

  async function loadBettingData() {
    try {
      setLoading(true);
      const result = await SammoAPI.NationGetBetting();
      if (result.result) {
        setBettingData({ bettings: result.bettings });
      }
    } catch (err) {
      console.error(err);
      alert('국가 베팅 정보를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.container}>
      <TopBackBar title="국가 베팅장" reloadable onReload={loadBettingData} />
      {loading ? (
        <div className="center" style={{ padding: '2rem' }}>로딩 중...</div>
      ) : (
        <div className={styles.content}>
          <div className={styles.bettingList}>
            {/* 국가별 베팅 목록 */}
          </div>
        </div>
      )}
    </div>
  );
}


