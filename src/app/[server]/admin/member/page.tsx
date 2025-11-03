'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import TopBackBar from '@/components/common/TopBackBar';
import styles from './page.module.css';

export default function AdminMemberPage() {
  const params = useParams();
  const serverID = params?.server as string;

  const [loading, setLoading] = useState(true);
  const [memberList, setMemberList] = useState<any[]>([]);

  useEffect(() => {
    loadMemberList();
  }, [serverID]);

  async function loadMemberList() {
    try {
      setLoading(true);
      // API 호출 로직 필요
      setMemberList([]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleAction(action: string, memberID?: number) {
    try {
      // API 호출 로직 필요
      alert('처리되었습니다.');
      await loadMemberList();
    } catch (err) {
      console.error(err);
      alert('처리에 실패했습니다.');
    }
  }

  return (
    <div className={styles.container}>
      <TopBackBar title="회 원 관 리" />
      {loading ? (
        <div className="center" style={{ padding: '2rem' }}>로딩 중...</div>
      ) : (
        <div className={styles.content}>
          <div className={styles.actionSection}>
            <button type="button" onClick={() => handleAction('allow_all')} className={styles.button}>
              전체 접속허용
            </button>
            <button type="button" onClick={() => handleAction('block_all')} className={styles.button}>
              전체 접속제한
            </button>
          </div>
          <div className={styles.memberList}>
            {memberList.map((member) => (
              <div key={member.no} className={styles.memberItem}>
                {member.name}
                {/* 회원 관리 버튼들 */}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

