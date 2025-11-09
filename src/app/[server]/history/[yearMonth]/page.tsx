'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { SammoAPI } from '@/lib/api/sammo';
import TopBackBar from '@/components/common/TopBackBar';
import MapViewer from '@/components/game/MapViewer';
import styles from './page.module.css';

function HistoryYearMonthContent() {
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
    if (!yearMonth) return;

    try {
      setLoading(true);
      // "202401" 형식 파싱
      const match = yearMonth.match(/^(\d{4})(\d{2})$/);
      let year: number | undefined;
      let month: number | undefined;

      if (match) {
        year = parseInt(match[1]);
        month = parseInt(match[2]);
      }

      const result = await SammoAPI.GetHistory({ year, month });
      if (result.result) {
        setHistoryData(result.history);
      }
    } catch (err) {
      console.error(err);
      alert('연감 정보를 불러오는데 실패했습니다.');
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

export default function HistoryYearMonthPage() {
  return (
    <Suspense fallback={<div className="center" style={{ padding: '2rem' }}>로딩 중...</div>}>
      <HistoryYearMonthContent />
    </Suspense>
  );
}





