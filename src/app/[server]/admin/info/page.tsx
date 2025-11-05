'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { SammoAPI } from '@/lib/api/sammo';
import TopBackBar from '@/components/common/TopBackBar';
import styles from './page.module.css';

export default function AdminInfoPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const serverID = params?.server as string;
  const type = searchParams?.get('type') ? Number(searchParams.get('type')) : 0;
  const type2 = searchParams?.get('type2') ? Number(searchParams.get('type2')) : 0;

  const [loading, setLoading] = useState(true);
  const [infoData, setInfoData] = useState<any[]>([]);

  useEffect(() => {
    loadInfoData();
  }, [serverID, type, type2]);

  async function loadInfoData() {
    try {
      setLoading(true);
      const result = await SammoAPI.AdminGetInfo({ type, type2 });
      if (result.result) {
        setInfoData(result.infoList);
      }
    } catch (err) {
      console.error(err);
      alert('정보를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.container}>
      <TopBackBar title="일 제 정 보" />
      <div className={styles.filterSection}>
        <form method="get" className={styles.filterForm}>
          <label>
            정렬순서:
            <select name="type" value={type} onChange={(e) => {
              const url = new URL(window.location.href);
              url.searchParams.set('type', e.target.value);
              window.location.href = url.toString();
            }} className={styles.select}>
              <option value={0}>기본</option>
              {/* 다른 옵션들 */}
            </select>
          </label>
        </form>
      </div>
      {loading ? (
        <div className="center" style={{ padding: '2rem' }}>로딩 중...</div>
      ) : (
        <div className={styles.content}>
          {/* 정보 목록 표시 */}
        </div>
      )}
    </div>
  );
}




