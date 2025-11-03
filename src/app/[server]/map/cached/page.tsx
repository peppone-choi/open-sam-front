'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import MapViewer from '@/components/game/MapViewer';
import styles from './page.module.css';

export default function CachedMapPage() {
  const params = useParams();
  const serverID = params?.server as string;

  const [mapData, setMapData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMapData();
  }, [serverID]);

  async function loadMapData() {
    try {
      setLoading(true);
      // API 호출 로직 필요
      setMapData(null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.title}>최근 지도</div>
      {loading ? (
        <div className="center" style={{ padding: '2rem' }}>로딩 중...</div>
      ) : mapData ? (
        <MapViewer
          serverID={serverID}
          mapData={mapData}
          onCityClick={() => {}}
        />
      ) : (
        <div className="center" style={{ padding: '2rem' }}>지도 데이터를 불러올 수 없습니다.</div>
      )}
    </div>
  );
}


