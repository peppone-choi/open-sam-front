'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { SammoAPI } from '@/lib/api/sammo';
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
      const result = await SammoAPI.GetCurrentCity();
      if (result.result) {
        setCityData(result.city);
      }
    } catch (err) {
      console.error(err);
      alert('도시 정보를 불러오는데 실패했습니다.');
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




