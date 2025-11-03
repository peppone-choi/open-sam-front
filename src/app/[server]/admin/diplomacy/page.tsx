'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import TopBackBar from '@/components/common/TopBackBar';
import styles from './page.module.css';

export default function AdminDiplomacyPage() {
  const params = useParams();
  const serverID = params?.server as string;

  const [loading, setLoading] = useState(true);
  const [diplomacyList, setDiplomacyList] = useState<any[]>([]);

  useEffect(() => {
    loadDiplomacyList();
  }, [serverID]);

  async function loadDiplomacyList() {
    try {
      setLoading(true);
      // API 호출 로직 필요
      setDiplomacyList([]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.container}>
      <TopBackBar title="외 교 정 보" />
      {loading ? (
        <div className="center" style={{ padding: '2rem' }}>로딩 중...</div>
      ) : (
        <div className={styles.content}>
          <div className={styles.diplomacyList}>
            {diplomacyList.map((diplomacy) => (
              <div key={diplomacy.id} className={styles.diplomacyItem}>
                {/* 외교 정보 표시 */}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

