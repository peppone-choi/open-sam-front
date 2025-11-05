'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { SammoAPI } from '@/lib/api/sammo';
import TopBackBar from '@/components/common/TopBackBar';
import styles from './page.module.css';

export default function AdminGeneralPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const serverID = params?.server as string;
  const queryType = searchParams?.get('query_type') || 'turntime';

  const [loading, setLoading] = useState(true);
  const [generalList, setGeneralList] = useState<any[]>([]);

  useEffect(() => {
    loadGeneralList();
  }, [serverID, queryType]);

  async function loadGeneralList() {
    try {
      setLoading(true);
      const result = await SammoAPI.AdminGetGeneral({});
      if (result.result) {
        setGeneralList(Array.isArray(result.general) ? result.general : [result.general]);
      }
    } catch (err) {
      console.error(err);
      alert('장수 정보를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.container}>
      <TopBackBar title="장 수 정 보" />
      <div className={styles.filterSection}>
        <form method="get" className={styles.filterForm}>
          <label>
            정렬순서:
            <select
              name="query_type"
              value={queryType}
              onChange={(e) => {
                const url = new URL(window.location.href);
                url.searchParams.set('query_type', e.target.value);
                window.location.href = url.toString();
              }}
              className={styles.select}
            >
              <option value="turntime">최근턴</option>
              <option value="recent_war">최근전투</option>
              <option value="name">장수명</option>
              <option value="warnum">전투수</option>
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
                {general.name}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}




