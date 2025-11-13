'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { SammoAPI } from '@/lib/api/sammo';
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
      
      const [genResult, frontInfoResult] = await Promise.all([
        SammoAPI.GetMyGenInfo().catch(() => null),
        SammoAPI.GeneralGetFrontInfo({
          serverID: serverID || '',
          lastNationNoticeDate: new Date().toISOString().slice(0, 19).replace('T', ' '),
          lastGeneralRecordID: 0,
          lastGlobalHistoryID: 0,
        }).catch(() => null),
      ]);

      if (genResult?.result) {
        setGeneralData(genResult.general);
      } else if (frontInfoResult?.result && frontInfoResult.general) {
        setGeneralData(frontInfoResult.general);
      }

      if (frontInfoResult?.result && frontInfoResult.nation) {
        setNationData(frontInfoResult.nation);
      }
    } catch (err) {
      console.error(err);
      alert('장수 정보를 불러오는데 실패했습니다.');
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
          />
        </div>
      ) : (
        <div className="center" style={{ padding: '2rem' }}>데이터를 불러올 수 없습니다.</div>
      )}
    </div>
  );
}




