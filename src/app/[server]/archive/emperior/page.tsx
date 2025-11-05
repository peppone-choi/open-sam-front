'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { SammoAPI } from '@/lib/api/sammo';
import TopBackBar from '@/components/common/TopBackBar';
import styles from './page.module.css';

export default function EmperiorPage() {
  const params = useParams();
  const serverID = params?.server as string;

  const [loading, setLoading] = useState(true);
  const [emperiorList, setEmperiorList] = useState<any[]>([]);
  const [currentNation, setCurrentNation] = useState<any>(null);

  useEffect(() => {
    loadEmperiorList();
  }, [serverID]);

  async function loadEmperiorList() {
    try {
      setLoading(true);
      const result = await SammoAPI.GetEmperiorList();
      if (result.result) {
        setEmperiorList(result.emperiorList || []);
        setCurrentNation(result.currentNation || null);
      }
    } catch (err) {
      console.error(err);
      alert('역대 왕조 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.container}>
      <TopBackBar title="역 대 왕 조" />
      {loading ? (
        <div className="center" style={{ padding: '2rem' }}>로딩 중...</div>
      ) : (
        <div className={styles.content}>
          {currentNation && (
            <div className={styles.currentNation}>
              <h2 className={styles.currentTitle}>
                현재 ({currentNation.year}年 {currentNation.month}月)
              </h2>
              <Link href={`/${serverID}/history`} className={styles.linkButton}>
                역사 보기
              </Link>
            </div>
          )}
          {emperiorList.map((emperior) => (
            <div key={emperior.no} className={styles.emperiorCard}>
              <h2 className={styles.phase}>{emperior.phase}</h2>
              <div className={styles.actions}>
                <Link href={`/${serverID}/archive/emperior/${emperior.no}`} className={styles.linkButton}>
                  자세히
                </Link>
                {emperior.server_id && (
                  <Link href={`/${serverID}/history?serverID=${emperior.server_id}`} className={styles.linkButton}>
                    역사 보기
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}




