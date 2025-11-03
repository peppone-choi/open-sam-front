'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import TopBackBar from '@/components/common/TopBackBar';
import styles from './page.module.css';

export default function DiplomacyProcessPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const serverID = params?.server as string;
  const action = searchParams?.get('action') || '';

  const [loading, setLoading] = useState(true);
  const [diplomacyData, setDiplomacyData] = useState<any>(null);

  useEffect(() => {
    loadDiplomacyData();
  }, [serverID, action]);

  async function loadDiplomacyData() {
    try {
      setLoading(true);
      // API 호출 로직 필요
      setDiplomacyData(null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(formData: any) {
    try {
      // API 호출 로직 필요
      alert('처리되었습니다.');
      window.location.href = `/${serverID}/diplomacy`;
    } catch (err) {
      console.error(err);
      alert('처리에 실패했습니다.');
    }
  }

  return (
    <div className={styles.container}>
      <TopBackBar title="외교 처리" />
      {loading ? (
        <div className="center" style={{ padding: '2rem' }}>로딩 중...</div>
      ) : (
        <div className={styles.content}>
          <div className={styles.diplomacyForm}>
            {/* 외교 처리 폼 */}
          </div>
        </div>
      )}
    </div>
  );
}


