'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import TopBackBar from '@/components/common/TopBackBar';
import styles from './page.module.css';

export default function ProcessingPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const serverID = params?.server as string;
  const commandType = searchParams?.get('command') || '';
  const turnList = searchParams?.get('turnList')?.split('_').map(Number) || [];
  const isChiefTurn = searchParams?.get('is_chief') === 'true';

  const [loading, setLoading] = useState(true);
  const [commandData, setCommandData] = useState<any>(null);

  useEffect(() => {
    if (commandType && turnList.length > 0) {
      loadCommandData();
    }
  }, [commandType, turnList, isChiefTurn]);

  async function loadCommandData() {
    try {
      setLoading(true);
      // API 호출 로직 필요
      setCommandData(null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit() {
    try {
      // API 호출 로직 필요
      window.location.href = `/${serverID}/game`;
    } catch (err) {
      console.error(err);
      alert('명령 등록에 실패했습니다.');
    }
  }

  if (!commandType || turnList.length === 0) {
    return (
      <div className={styles.container}>
        <TopBackBar title="명령 처리" />
        <div className="center" style={{ padding: '2rem' }}>잘못된 접근입니다.</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <TopBackBar title="명령 처리" />
      {loading ? (
        <div className="center" style={{ padding: '2rem' }}>로딩 중...</div>
      ) : (
        <div className={styles.content}>
          <div className={styles.commandForm}>
            <h2>{commandData?.name || commandType}</h2>
            {/* 명령별 입력 폼 */}
            <button type="button" onClick={handleSubmit} className={styles.submitBtn}>
              명령 등록
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
