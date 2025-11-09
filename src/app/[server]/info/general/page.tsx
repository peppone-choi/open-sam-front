'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { SammoAPI } from '@/lib/api/sammo';
import TopBackBar from '@/components/common/TopBackBar';
import GeneralBasicCard from '@/components/cards/GeneralBasicCard';
import styles from './page.module.css';

function GeneralInfoContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const serverID = params?.server as string;
  const generalID = searchParams?.get('generalID') ? Number(searchParams.get('generalID')) : undefined;

  const [loading, setLoading] = useState(true);
  const [generalData, setGeneralData] = useState<any>(null);

  useEffect(() => {
    loadGeneralData();
  }, [serverID, generalID]);

  async function loadGeneralData() {
    try {
      setLoading(true);
      const result = await SammoAPI.GetGeneralInfo({ generalID });
      if (result.result) {
        setGeneralData(result.general);
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
      <TopBackBar title="장수 정보" reloadable onReload={loadGeneralData} />
      {loading ? (
        <div className="center" style={{ padding: '2rem' }}>로딩 중...</div>
      ) : generalData ? (
        <div className={styles.content}>
          <GeneralBasicCard general={generalData} />
        </div>
      ) : (
        <div className="center" style={{ padding: '2rem' }}>장수 정보를 불러올 수 없습니다.</div>
      )}
    </div>
  );
}

export default function GeneralInfoPage() {
  return (
    <Suspense fallback={<div className="center" style={{ padding: '2rem' }}>로딩 중...</div>}>
      <GeneralInfoContent />
    </Suspense>
  );
}





