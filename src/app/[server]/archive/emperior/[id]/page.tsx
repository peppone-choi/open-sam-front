'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { SammoAPI } from '@/lib/api/sammo';
import TopBackBar from '@/components/common/TopBackBar';
import styles from './page.module.css';

export default function EmperiorDetailPage() {
  const params = useParams();
  const serverID = params?.server as string;
  const id = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [emperiorDetail, setEmperiorDetail] = useState<any>(null);

  useEffect(() => {
    if (id) {
      loadEmperiorDetail();
    }
  }, [id]);

  async function loadEmperiorDetail() {
    if (!id) return;
    
    try {
      setLoading(true);
      const result = await SammoAPI.GetEmperiorDetail({ id: Number(id) });
      if (result.result) {
        setEmperiorDetail(result.emperior);
      }
    } catch (err) {
      console.error(err);
      alert('왕조 상세 정보를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.container}>
      <TopBackBar title="왕 조 상 세" />
      {loading ? (
        <div className="center" style={{ padding: '2rem' }}>로딩 중...</div>
      ) : emperiorDetail ? (
        <div className={styles.content}>
          <div className={styles.detailCard}>
            <h2>{emperiorDetail.phase}</h2>
            <div className={styles.info}>
              {/* 왕조 상세 정보 */}
            </div>
          </div>
        </div>
      ) : (
        <div className="center" style={{ padding: '2rem' }}>데이터를 불러올 수 없습니다.</div>
      )}
    </div>
  );
}


