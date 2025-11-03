'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import TopBackBar from '@/components/common/TopBackBar';
import styles from './page.module.css';

export default function NPCListPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const serverID = params?.server as string;
  const type = searchParams?.get('type') ? Number(searchParams.get('type')) : 1;

  const [loading, setLoading] = useState(true);
  const [npcList, setNpcList] = useState<any[]>([]);

  useEffect(() => {
    loadNPCList();
  }, [serverID, type]);

  async function loadNPCList() {
    try {
      setLoading(true);
      // API 호출 로직 필요
      setNpcList([]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.container}>
      <TopBackBar title="빙 의 일 람" />
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
              <option value={1}>이름</option>
              <option value={2}>국가</option>
              <option value={3}>종능</option>
              <option value={4}>통솔</option>
              <option value={5}>무력</option>
              <option value={6}>지력</option>
              <option value={7}>명성</option>
              <option value={8}>계급</option>
            </select>
          </label>
        </form>
      </div>
      {loading ? (
        <div className="center" style={{ padding: '2rem' }}>로딩 중...</div>
      ) : (
        <div className={styles.npcList}>
          {npcList.map((npc) => (
            <div key={npc.no} className={styles.npcItem}>
              <div className={styles.npcName}>{npc.name}</div>
              <div className={styles.npcInfo}>
                {npc.nationName} / 통:{npc.leadership} 무:{npc.strength} 지:{npc.intel}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


