'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { SammoAPI } from '@/lib/api/sammo';
import TopBackBar from '@/components/common/TopBackBar';
import styles from './page.module.css';

export default function BettingInfoPage() {
  const params = useParams();
  const serverID = params?.server as string;

  const [loading, setLoading] = useState(true);
  const [bettingList, setBettingList] = useState<any[]>([]);

  useEffect(() => {
    loadBettingList();
  }, [serverID]);

  async function loadBettingList() {
    try {
      setLoading(true);
      const result = await SammoAPI.GetBettingInfo({ session_id: serverID });

      if (result.result) {
        setBettingList(result.bettingList);
      }
    } catch (err) {
      console.error(err);
      alert('베팅 정보를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.container}>
      <TopBackBar title="베팅 정보" reloadable onReload={loadBettingList} />
      {loading ? (
        <div className="center" style={{ padding: '2rem' }}>로딩 중...</div>
      ) : (
        <div className={styles.content}>
          <div className={styles.bettingList}>
            {bettingList.map((betting) => (
              <div key={betting.id} className={styles.bettingItem}>
                <div className={styles.bettingTitle}>{betting.title}</div>
                <div className={styles.bettingInfo}>
                  {betting.description}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}




