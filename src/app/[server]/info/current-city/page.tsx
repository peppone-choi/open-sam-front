'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import TopBackBar from '@/components/common/TopBackBar';
import CityBasicCard from '@/components/cards/CityBasicCard';
import styles from './page.module.css';

export default function CurrentCityPage() {
  const params = useParams();
  const serverID = params?.server as string;

  const [loading, setLoading] = useState(true);
  const [cityData, setCityData] = useState<any>(null);

  useEffect(() => {
    loadCityData();
  }, [serverID]);

  async function loadCityData() {
    try {
      setLoading(true);
      // API 호출 로직 필요
      setCityData(null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.container}>
      <TopBackBar title="현재 도시" reloadable onReload={loadCityData} />
      {loading ? (
        <div className="center" style={{ padding: '2rem' }}>로딩 중...</div>
      ) : cityData ? (
        <div className={styles.content}>
          <CityBasicCard city={cityData} />
        </div>
      ) : (
        <div className="center" style={{ padding: '2rem' }}>도시 정보를 불러올 수 없습니다.</div>
      )}
    </div>
  );
}


