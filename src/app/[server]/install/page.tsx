'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import TopBackBar from '@/components/common/TopBackBar';
import styles from './page.module.css';

export default function InstallPage() {
  const params = useParams();
  const serverID = params?.server as string;

  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState<any>({});

  useEffect(() => {
    loadData();
  }, [serverID]);

  async function loadData() {
    try {
      setLoading(true);
      // API 호출 로직 필요
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
      alert('설치가 완료되었습니다.');
      window.location.href = `/${serverID}/game`;
    } catch (err) {
      console.error(err);
      alert('설치에 실패했습니다.');
    }
  }

  return (
    <div className={styles.container}>
      <TopBackBar title="게임 설치/리셋" />
      {loading ? (
        <div className="center" style={{ padding: '2rem' }}>로딩 중...</div>
      ) : (
        <div className={styles.content}>
          <div className={styles.installForm}>
            <h2>환경 설정</h2>
            {/* 설치 폼 필드들 */}
            <button type="button" onClick={handleSubmit} className={styles.submitButton}>
              설치하기
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

