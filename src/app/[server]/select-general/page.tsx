'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import TopBackBar from '@/components/common/TopBackBar';
import styles from './page.module.css';

export default function SelectGeneralPage() {
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

  async function handleSelect() {
    if (!selectedGeneral) return;
    try {
      // API 호출 로직 필요
      alert('장수 선택이 완료되었습니다.');
      window.location.href = `/${serverID}/game`;
    } catch (err) {
      console.error(err);
      alert('장수 선택에 실패했습니다.');
    }
  }

  return (
    <div className={styles.container}>
      <TopBackBar title="장수 선택" />
      {loading ? (
        <div className="center" style={{ padding: '2rem' }}>로딩 중...</div>
      ) : (
        <div className={styles.content}>
          <div className={styles.generalList}>
            {generalList.map((general) => (
              <div
                key={general.no}
                className={`${styles.generalItem} ${selectedGeneral === general.no ? styles.selected : ''}`}
                onClick={() => setSelectedGeneral(general.no)}
              >
                <div className={styles.generalIcon}>
                  <img src={`/images/gen_icon/${general.imgsvr}/${general.picture}.jpg`} alt={general.name} />
                </div>
                <div className={styles.generalName}>{general.name}</div>
                <div className={styles.generalStats}>
                  통:{general.leadership} 무:{general.strength} 지:{general.intel}
                </div>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={handleSelect}
            disabled={!selectedGeneral}
            className={styles.selectButton}
          >
            선택하기
          </button>
        </div>
      )}
    </div>
  );
}
