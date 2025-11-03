'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import TopBackBar from '@/components/common/TopBackBar';
import styles from './page.module.css';

export default function GenListPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const serverID = params?.server as string;
  const type = searchParams?.get('type') ? Number(searchParams.get('type')) : 9;

  const [loading, setLoading] = useState(true);
  const [generalList, setGeneralList] = useState<any[]>([]);

  useEffect(() => {
    loadGeneralList();
  }, [serverID, type]);

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

  return (
    <div className={styles.container}>
      <TopBackBar title="장 수 일 람" />
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
              <option value={1}>국가</option>
              <option value={2}>통솔</option>
              <option value={3}>무력</option>
              <option value={4}>지력</option>
              <option value={5}>명성</option>
              <option value={6}>계급</option>
              <option value={7}>관직</option>
              <option value={8}>삭턴</option>
              <option value={9}>벌점</option>
              <option value={10}>Lv</option>
              <option value={11}>성격</option>
              <option value={12}>내특</option>
              <option value={13}>전특</option>
              <option value={14}>개특</option>
              <option value={15}>직특</option>
            </select>
          </label>
        </form>
      </div>
      {loading ? (
        <div className="center" style={{ padding: '2rem' }}>로딩 중...</div>
      ) : (
        <div className={styles.generalList}>
          {generalList.map((general) => (
            <div key={general.no} className={styles.generalItem}>
              <div className={styles.generalName}>{general.name}</div>
              <div className={styles.generalInfo}>
                {general.nationName} / 통:{general.leadership} 무:{general.strength} 지:{general.intel}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

