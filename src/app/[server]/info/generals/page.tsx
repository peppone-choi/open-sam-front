'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { SammoAPI } from '@/lib/api/sammo';
import TopBackBar from '@/components/common/TopBackBar';
import styles from './page.module.css';

export default function GeneralsInfoPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const serverID = params?.server as string;
  const type = searchParams?.get('type') ? Number(searchParams.get('type')) : 7;

  const [loading, setLoading] = useState(true);
  const [generalList, setGeneralList] = useState<any[]>([]);

  useEffect(() => {
    loadGeneralList();
  }, [serverID, type]);

  async function loadGeneralList() {
    try {
      setLoading(true);
      const result = await SammoAPI.GetGeneralList({ type });
      if (result.result) {
        setGeneralList(result.generalList);
      }
    } catch (err) {
      console.error(err);
      alert('장수 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.container}>
      <TopBackBar title="암 행 부" />
      <div className={styles.filterSection}>
        <form method="get" className={styles.filterForm}>
          <label>
            정렬순서:
            <select
              name="type"
              value={type}
              onChange={(e) => {
                const url = new URL(window.location.href);
                url.searchParams.set('type', e.target.value);
                window.location.href = url.toString();
              }}
              className={styles.select}
            >
              <option value={1}>자금</option>
              <option value={2}>군량</option>
              <option value={3}>도시</option>
              <option value={4}>병종</option>
              <option value={5}>병사</option>
              <option value={6}>삭제턴</option>
              <option value={7}>턴</option>
              <option value={8}>부대</option>
            </select>
          </label>
        </form>
      </div>
      {loading ? (
        <div className="center" style={{ padding: '2rem' }}>로딩 중...</div>
      ) : (
        <div className={styles.content}>
          <div className={styles.generalList}>
            {generalList.map((general) => (
              <div key={general.no} className={styles.generalItem}>
                <div className={styles.generalName}>{general.name}</div>
                <div className={styles.generalInfo}>
                  {general.cityName} / 통:{general.leadership} 무:{general.strength} 지:{general.intel}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}




