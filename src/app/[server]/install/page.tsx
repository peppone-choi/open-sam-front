'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { SammoAPI } from '@/lib/api/sammo';
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

  const router = useRouter();

  async function loadData() {
    try {
      setLoading(true);
      const result = await SammoAPI.GetInstallConfig({ serverID });
      if (result.result) {
        setFormData(result.config || {});
      }
    } catch (err) {
      console.error(err);
      alert('설치 설정을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit() {
    try {
      const result = await SammoAPI.InstallGame({
        serverID,
        config: formData,
      });

      if (result.result) {
        alert('설치가 완료되었습니다.');
        router.push(`/${serverID}/game`);
      } else {
        alert(result.reason || '설치에 실패했습니다.');
      }
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




