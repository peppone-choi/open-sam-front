'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import TopBackBar from '@/components/common/TopBackBar';
import GeneralBasicCard from '@/components/cards/GeneralBasicCard';
import styles from './page.module.css';

export default function MyGenInfoPage() {
  const params = useParams();
  const serverID = params?.server as string;

  const [loading, setLoading] = useState(true);
  const [generalData, setGeneralData] = useState<any>(null);
  const [nationData, setNationData] = useState<any>(null);

  useEffect(() => {
    loadGeneralData();
  }, [serverID]);

  async function loadGeneralData() {
    try {
      setLoading(true);
      // API 호출 로직 필요
      setGeneralData(null);
      setNationData(null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.container}>
      <TopBackBar title="내 장수 정보" reloadable onReload={loadGeneralData} />
      {loading ? (
        <div className="center" style={{ padding: '2rem' }}>로딩 중...</div>
      ) : generalData && nationData ? (
        <div className={styles.content}>
          <GeneralBasicCard
            general={generalData}
            nation={nationData}
            troopInfo={generalData.troopInfo}
            turnTerm={0}
            lastExecuted={new Date()}
          />
        </div>
      ) : (
        <div className="center" style={{ padding: '2rem' }}>데이터를 불러올 수 없습니다.</div>
      )}
    </div>
  );
}

