'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { SammoAPI } from '@/lib/api/sammo';
import TopBackBar from '@/components/common/TopBackBar';
import styles from './page.module.css';

export default function NationGeneralsPage() {
  const params = useParams();
  const serverID = params?.server as string;

  const [loading, setLoading] = useState(true);
  const [generals, setGenerals] = useState<any[]>([]);

  useEffect(() => {
    loadGenerals();
  }, [serverID]);

  async function loadGenerals() {
    try {
      setLoading(true);
      const result = await SammoAPI.NationGetGenerals();
      if (result.result) {
        setGenerals(result.generals);
      }
    } catch (err) {
      console.error(err);
      alert('세력 장수 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.container}>
      <TopBackBar title="세력 장수" reloadable onReload={loadGenerals} />
      {loading ? (
        <div className="center" style={{ padding: '2rem' }}>로딩 중...</div>
      ) : (
        <div className={styles.content}>
          <div className={styles.generalsList}>
            {generals.map((general) => (
              <div key={general.no} className={styles.generalItem}>
                <div className={styles.generalName}>{general.name}</div>
                <div className={styles.generalInfo}>
                  {general.cityName} / {general.officerLevelText}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}


