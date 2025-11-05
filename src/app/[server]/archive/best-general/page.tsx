'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { SammoAPI } from '@/lib/api/sammo';
import TopBackBar from '@/components/common/TopBackBar';
import styles from './page.module.css';

export default function BestGeneralPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const serverID = params?.server as string;
  const btn = searchParams?.get('btn') || '유저 보기';

  const [loading, setLoading] = useState(true);
  const [bestGeneralList, setBestGeneralList] = useState<any[]>([]);

  useEffect(() => {
    loadBestGeneralList();
  }, [serverID, btn]);

  async function loadBestGeneralList() {
    try {
      setLoading(true);
      const result = await SammoAPI.GetBestGeneralList({ btn });
      if (result.result) {
        setBestGeneralList(result.generalList);
      }
    } catch (err) {
      console.error(err);
      alert('명장 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.container}>
      <TopBackBar title="명 장 일 람" />
      <div className={styles.filterSection}>
        <form method="get" className={styles.filterForm}>
          <button type="submit" name="btn" value="유저 보기" className={btn === '유저 보기' ? styles.active : ''}>
            유저 보기
          </button>
          <button type="submit" name="btn" value="NPC 보기" className={btn === 'NPC 보기' ? styles.active : ''}>
            NPC 보기
          </button>
        </form>
      </div>
      {loading ? (
        <div className="center" style={{ padding: '2rem' }}>로딩 중...</div>
      ) : (
        <div className={styles.rankList}>
          {bestGeneralList.map((general, idx) => (
            <div key={general.no} className={styles.rankItem}>
              <div className={styles.rank}>{idx + 1}위</div>
              <div className={styles.generalName}>{general.name}</div>
              <div className={styles.generalInfo}>
                {general.nationName} / {general.value}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}




