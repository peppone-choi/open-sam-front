'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import TopBackBar from '@/components/common/TopBackBar';
import MapViewer from '@/components/game/MapViewer';
import styles from './page.module.css';

export default function HistoryYearMonthPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const serverID = params?.server as string;
  const yearMonth = params?.yearMonth as string;
  const queryServerID = searchParams?.get('serverID') || serverID;

  const [loading, setLoading] = useState(true);
  const [historyData, setHistoryData] = useState<any>(null);

  useEffect(() => {
    loadHistory();
  }, [serverID, yearMonth, queryServerID]);

  async function loadHistory() {
    try {
      setLoading(true);
      // API 호출 로직 필요
      setHistoryData(null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.container}>
      <TopBackBar title={`연감: ${yearMonth}`} reloadable onReload={loadHistory} />
      {loading ? (
        <div className="center" style={{ padding: '2rem' }}>로딩 중...</div>
      ) : historyData ? (
        <div className={styles.content}>
          <MapViewer
            serverID={queryServerID}
            mapData={historyData.map}
            onCityClick={() => {}}
          />
        </div>
      ) : (
        <div className="center" style={{ padding: '2rem' }}>연감 데이터를 불러올 수 없습니다.</div>
      )}
    </div>
  );
}

