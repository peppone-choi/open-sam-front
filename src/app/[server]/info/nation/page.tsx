'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import TopBackBar from '@/components/common/TopBackBar';
import NationBasicCard from '@/components/cards/NationBasicCard';
import styles from './page.module.css';

export default function NationInfoPage() {
  const params = useParams();
  const serverID = params?.server as string;

  const [loading, setLoading] = useState(true);
  const [nationData, setNationData] = useState<any>(null);
  const [globalData, setGlobalData] = useState<any>(null);

  useEffect(() => {
    loadNationData();
  }, [serverID]);

  async function loadNationData() {
    try {
      setLoading(true);
      // API 호출 로직 필요
      setNationData(null);
      setGlobalData(null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.container}>
      <TopBackBar title="세 력 정 보" reloadable onReload={loadNationData} />
      {loading ? (
        <div className="center" style={{ padding: '2rem' }}>로딩 중...</div>
      ) : nationData && globalData ? (
        <div className={styles.content}>
          <NationBasicCard nation={nationData} global={globalData} />
        </div>
      ) : (
        <div className="center" style={{ padding: '2rem' }}>세력 정보를 불러올 수 없습니다.</div>
      )}
    </div>
  );
}

