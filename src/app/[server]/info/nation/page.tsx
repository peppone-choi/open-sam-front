'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { SammoAPI } from '@/lib/api/sammo';
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
      
      const [nationResult, frontInfoResult] = await Promise.all([
        SammoAPI.NationGetNationInfo().catch(() => null),
        SammoAPI.GeneralGetFrontInfo({
          serverID: serverID || '',
          lastNationNoticeDate: new Date().toISOString().slice(0, 19).replace('T', ' '),
          lastGeneralRecordID: 0,
          lastWorldHistoryID: 0,
        }).catch(() => null),
      ]);

      if (nationResult?.result) {
        setNationData(nationResult.nation);
      } else if (frontInfoResult?.result && frontInfoResult.nation) {
        setNationData(frontInfoResult.nation);
      }

      if (frontInfoResult?.result) {
        setGlobalData(frontInfoResult.global);
      }
    } catch (err) {
      console.error(err);
      alert('세력 정보를 불러오는데 실패했습니다.');
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




