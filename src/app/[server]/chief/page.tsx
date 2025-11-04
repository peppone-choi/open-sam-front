'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { SammoAPI } from '@/lib/api/sammo';
import TopBackBar from '@/components/common/TopBackBar';
import styles from './page.module.css';

export default function ChiefPage() {
  const params = useParams();
  const serverID = params?.server as string;

  const [loading, setLoading] = useState(true);
  const [chiefData, setChiefData] = useState<any>(null);

  useEffect(() => {
    loadChiefData();
  }, [serverID]);

  async function loadChiefData() {
    try {
      setLoading(true);
      const result = await SammoAPI.GetChiefCenter();
      if (result.result) {
        setChiefData({ commands: result.commands });
      }
    } catch (err) {
      console.error(err);
      alert('사령부 정보를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.container}>
      <TopBackBar title="사 령 부" reloadable onReload={loadChiefData} />
      {loading ? (
        <div className="center" style={{ padding: '2rem' }}>로딩 중...</div>
      ) : (
        <div className={styles.content}>
          <div className={styles.chiefSubTable}>
            {/* 사령부 턴별 명령 표시 */}
          </div>
        </div>
      )}
    </div>
  );
}


