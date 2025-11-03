'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import TopBackBar from '@/components/common/TopBackBar';
import styles from './page.module.css';

export default function AdminForceRehallPage() {
  const params = useParams();
  const serverID = params?.server as string;

  const [loading, setLoading] = useState(true);
  const [generalList, setGeneralList] = useState<any[]>([]);
  const [selectedGeneral, setSelectedGeneral] = useState<number | null>(null);

  useEffect(() => {
    loadGeneralList();
  }, [serverID]);

  async function loadGeneralList() {
    try {
      setLoading(true);
      // API 호출 로직 필요
      setGeneralList([]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleForceRehall() {
    if (!selectedGeneral) {
      alert('장수를 선택해주세요.');
      return;
    }
    if (!confirm('정말로 강제 재할당을 하시겠습니까?')) {
      return;
    }
    try {
      // API 호출 로직 필요
      alert('강제 재할당이 완료되었습니다.');
      await loadGeneralList();
    } catch (err) {
      console.error(err);
      alert('강제 재할당에 실패했습니다.');
    }
  }

  return (
    <div className={styles.container}>
      <TopBackBar title="강제 재할당" />
      {loading ? (
        <div className="center" style={{ padding: '2rem' }}>로딩 중...</div>
      ) : (
        <div className={styles.content}>
          <div className={styles.formSection}>
            <label>
              장수 선택:
              <select
                value={selectedGeneral || ''}
                onChange={(e) => setSelectedGeneral(Number(e.target.value))}
                className={styles.select}
              >
                <option value="">선택하세요</option>
                {generalList.map((general) => (
                  <option key={general.no} value={general.no}>
                    {general.name}
                  </option>
                ))}
              </select>
            </label>
            <button type="button" onClick={handleForceRehall} className={styles.button}>
              강제 재할당
            </button>
          </div>
        </div>
      )}
    </div>
  );
}


