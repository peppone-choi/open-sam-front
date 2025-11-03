'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import TopBackBar from '@/components/common/TopBackBar';
import styles from './page.module.css';

export default function AdminGamePage() {
  const params = useParams();
  const serverID = params?.server as string;

  const [loading, setLoading] = useState(true);
  const [adminData, setAdminData] = useState<any>(null);
  const [formData, setFormData] = useState<any>({});

  useEffect(() => {
    loadAdminData();
  }, [serverID]);

  async function loadAdminData() {
    try {
      setLoading(true);
      // API 호출 로직 필요
      setAdminData(null);
      setFormData({});
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(action: string) {
    try {
      // API 호출 로직 필요
      alert('변경되었습니다.');
      await loadAdminData();
    } catch (err) {
      console.error(err);
      alert('변경에 실패했습니다.');
    }
  }

  return (
    <div className={styles.container}>
      <TopBackBar title="게 임 관 리" />
      {loading ? (
        <div className="center" style={{ padding: '2rem' }}>로딩 중...</div>
      ) : (
        <div className={styles.content}>
          <div className={styles.adminForm}>
            <div className={styles.formRow}>
              <label>운영자메세지</label>
              <input
                type="text"
                value={formData.msg || ''}
                onChange={(e) => setFormData({ ...formData, msg: e.target.value })}
                className={styles.input}
              />
              <button type="button" onClick={() => handleSubmit('msg')} className={styles.button}>
                변경
              </button>
            </div>
            {/* 다른 관리 항목들 */}
          </div>
        </div>
      )}
    </div>
  );
}

