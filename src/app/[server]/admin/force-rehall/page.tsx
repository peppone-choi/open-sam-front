'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { SammoAPI } from '@/lib/api/sammo';
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
      // 일반 장수 목록 가져오기
      const result = await SammoAPI.GetGeneralList({});
      if (result.result && result.generalList) {
        setGeneralList(result.generalList);
      }
    } catch (err) {
      console.error(err);
      alert('장수 목록을 불러오는데 실패했습니다.');
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
      const result = await SammoAPI.AdminForceRehall({
        generalID: selectedGeneral,
      });
      
      if (result.result) {
        alert('강제 재할당이 완료되었습니다.');
        setSelectedGeneral(null);
        await loadGeneralList();
      } else {
        alert(result.reason || '강제 재할당에 실패했습니다.');
      }
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




