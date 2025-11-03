'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import TopBackBar from '@/components/common/TopBackBar';
import styles from './page.module.css';

export default function CommandProcessingPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const serverID = params?.server as string;
  const command = params?.command as string;
  const turnList = searchParams?.get('turnList')?.split('_').map(Number) || [0];
  const isChief = searchParams?.get('is_chief') === 'true';

  const [loading, setLoading] = useState(true);
  const [commandData, setCommandData] = useState<any>(null);
  const [formData, setFormData] = useState<any>({});

  useEffect(() => {
    loadCommandData();
  }, [serverID, command, turnList, isChief]);

  async function loadCommandData() {
    try {
      setLoading(true);
      // API 호출 로직 필요
      setCommandData({
        name: command,
        turnList,
        isChief,
      });
      setFormData({});
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit() {
    try {
      // API 호출 로직 필요
      alert('명령이 등록되었습니다.');
      window.location.href = `/${serverID}/${isChief ? 'chief' : 'game'}`;
    } catch (err) {
      console.error(err);
      alert('명령 등록에 실패했습니다.');
    }
  }

  return (
    <div className={styles.container}>
      <TopBackBar title={commandData?.name || command || '명령 처리'} />
      {loading ? (
        <div className="center" style={{ padding: '2rem' }}>로딩 중...</div>
      ) : (
        <div className={styles.content}>
          <div className={styles.commandInfo}>
            <div>명령: {command}</div>
            <div>턴: {turnList.join(', ')}</div>
            <div>형태: {isChief ? '수뇌부' : '일반'}</div>
          </div>
          <div className={styles.commandForm}>
            <h2>명령 입력</h2>
            {/* 명령 타입에 따른 동적 폼 */}
            <button type="button" onClick={handleSubmit} className={styles.submitButton}>
              명령 등록
            </button>
          </div>
        </div>
      )}
    </div>
  );
}


