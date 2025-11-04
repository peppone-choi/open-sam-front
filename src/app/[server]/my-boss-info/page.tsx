'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { SammoAPI } from '@/lib/api/sammo';
import TopBackBar from '@/components/common/TopBackBar';
import GeneralBasicCard from '@/components/cards/GeneralBasicCard';
import styles from './page.module.css';

export default function MyBossInfoPage() {
  const params = useParams();
  const serverID = params?.server as string;

  const [loading, setLoading] = useState(true);
  const [bossData, setBossData] = useState<any>(null);
  const [nationData, setNationData] = useState<any>(null);

  useEffect(() => {
    loadBossData();
  }, [serverID]);

  async function loadBossData() {
    try {
      setLoading(true);
      
      const [bossResult, frontInfoResult] = await Promise.all([
        SammoAPI.GetMyBossInfo({ session_id: serverID }).catch(() => null),
        SammoAPI.GeneralGetFrontInfo({
          serverID: serverID || '',
          lastNationNoticeDate: new Date().toISOString().slice(0, 19).replace('T', ' '),
          lastGeneralRecordID: 0,
          lastWorldHistoryID: 0,
        }).catch(() => null),
      ]);

      if (bossResult?.result) {
        setBossData(bossResult.bossInfo);
      }

      if (frontInfoResult?.result && frontInfoResult.nation) {
        setNationData(frontInfoResult.nation);
      }
    } catch (err) {
      console.error(err);
      alert('상관 정보를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.container}>
      <TopBackBar title="내 상관 정보" reloadable onReload={loadBossData} />
      {loading ? (
        <div className="center" style={{ padding: '2rem' }}>로딩 중...</div>
      ) : bossData && nationData ? (
        <div className={styles.content}>
          <GeneralBasicCard
            general={bossData}
            nation={nationData}
            troopInfo={bossData.troopInfo}
            turnTerm={0}
            lastExecuted={new Date()}
          />
        </div>
      ) : (
        <div className="center" style={{ padding: '2rem' }}>상관 정보를 불러올 수 없습니다.</div>
      )}
    </div>
  );
}


