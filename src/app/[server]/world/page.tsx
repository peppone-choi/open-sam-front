'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { SammoAPI } from '@/lib/api/sammo';
import TopBackBar from '@/components/common/TopBackBar';
import styles from './page.module.css';

export default function WorldPage() {
  const params = useParams();
  const serverID = params?.server as string;

  const [loading, setLoading] = useState(true);
  const [diplomacyData, setDiplomacyData] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, [serverID]);

  async function loadData() {
    try {
      setLoading(true);
      const result = await SammoAPI.GetWorldInfo();
      if (result.result) {
        setDiplomacyData(result.world);
      }
    } catch (err) {
      console.error(err);
      alert('중원 정보를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.container}>
      <TopBackBar title="중원 정보" reloadable onReload={loadData} />
      {loading ? (
        <div className="center" style={{ padding: '2rem' }}>로딩 중...</div>
      ) : (
        <div className={styles.content}>
          <div className={styles.description}>전 세계 국가들의 외교 관계를 확인할 수 있습니다.</div>
          <div className={styles.diplomacyGrid}>
            {/* 국가별 외교 관계 표시 */}
          </div>
        </div>
      )}
    </div>
  );
}




