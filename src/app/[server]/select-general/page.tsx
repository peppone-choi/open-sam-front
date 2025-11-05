'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { SammoAPI } from '@/lib/api/sammo';
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

  const router = useRouter();

  async function loadGeneralList() {
    try {
      setLoading(true);
      const result = await SammoAPI.GetSelectPool();
      if (result.result) {
        setGeneralList(result.pool || []);
      }
    } catch (err) {
      console.error(err);
      alert('장수 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }

  async function handleSelect() {
    if (!selectedGeneral) {
      alert('장수를 선택해주세요.');
      return;
    }
    
    try {
      const result = await SammoAPI.SelectPickedGeneral({
        generalID: selectedGeneral,
      });

      if (result.result) {
        alert('장수 선택이 완료되었습니다.');
        router.push(`/${serverID}/game`);
      } else {
        alert(result.reason || '장수 선택에 실패했습니다.');
      }
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
