'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import TopBackBar from '@/components/common/TopBackBar';
import styles from './page.module.css';

export default function KingdomListPage() {
  const params = useParams();
  const serverID = params?.server as string;

  const [loading, setLoading] = useState(true);
  const [kingdomList, setKingdomList] = useState<any[]>([]);

  useEffect(() => {
    loadKingdomList();
  }, [serverID]);

  async function loadKingdomList() {
    try {
      setLoading(true);
      // API 호출 로직 필요
      setKingdomList([]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.container}>
      <TopBackBar title="세 력 일 람" />
      {loading ? (
        <div className="center" style={{ padding: '2rem' }}>로딩 중...</div>
      ) : (
        <div className={styles.content}>
          {kingdomList.map((kingdom) => (
            <div key={kingdom.nation} className={styles.kingdomCard}>
              <div
                className={styles.kingdomName}
                style={{
                  backgroundColor: kingdom.color,
                  color: kingdom.isBright ? '#000' : '#fff',
                }}
              >
                {kingdom.name}
              </div>
              <div className={styles.kingdomInfo}>
                <div>전력: {kingdom.power}</div>
                <div>도시: {kingdom.cities?.length || 0}</div>
                <div>장수: {kingdom.generals?.length || 0}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

