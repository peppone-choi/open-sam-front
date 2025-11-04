'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { SammoAPI } from '@/lib/api/sammo';
import TopBackBar from '@/components/common/TopBackBar';
import styles from './page.module.css';

export default function InstallDBPage() {
  const params = useParams();
  const serverID = params?.server as string;

  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    db_host: 'localhost',
    db_name: '',
    db_user: '',
    db_password: '',
    full_reset: false,
  });

  useEffect(() => {
    setLoading(false);
  }, []);

  const router = useRouter();

  async function handleSubmit() {
    if (!formData.db_name || !formData.db_user) {
      alert('DB 이름과 사용자를 입력해주세요.');
      return;
    }

    try {
      const result = await SammoAPI.InstallDB({
        db_host: formData.db_host,
        db_name: formData.db_name,
        db_user: formData.db_user,
        db_password: formData.db_password,
        full_reset: formData.full_reset,
      });

      if (result.result) {
        alert('DB 설정이 완료되었습니다.');
        router.push(`/${serverID}/install`);
      } else {
        alert(result.reason || 'DB 설정에 실패했습니다.');
      }
    } catch (err) {
      console.error(err);
      alert('DB 설정에 실패했습니다.');
    }
  }

  return (
    <div className={styles.container}>
      <TopBackBar title="DB 설치" />
      <div className={styles.content}>
        <div className={styles.dbForm}>
          <h2>DB 설정</h2>
          <div className={styles.formGroup}>
            <label>DB 호스트</label>
            <input
              type="text"
              value={formData.db_host}
              onChange={(e) => setFormData({ ...formData, db_host: e.target.value })}
              className={styles.input}
              placeholder="localhost"
            />
          </div>
          <div className={styles.formGroup}>
            <label>DB 이름</label>
            <input
              type="text"
              value={formData.db_name}
              onChange={(e) => setFormData({ ...formData, db_name: e.target.value })}
              className={styles.input}
            />
          </div>
          <div className={styles.formGroup}>
            <label>DB 사용자</label>
            <input
              type="text"
              value={formData.db_user}
              onChange={(e) => setFormData({ ...formData, db_user: e.target.value })}
              className={styles.input}
            />
          </div>
          <div className={styles.formGroup}>
            <label>DB 비밀번호</label>
            <input
              type="password"
              value={formData.db_password}
              onChange={(e) => setFormData({ ...formData, db_password: e.target.value })}
              className={styles.input}
            />
          </div>
          <div className={styles.formGroup}>
            <label>
              <input
                type="checkbox"
                checked={formData.full_reset}
                onChange={(e) => setFormData({ ...formData, full_reset: e.target.checked })}
              />
              이전 DB 초기화
            </label>
          </div>
          <button type="button" onClick={handleSubmit} className={styles.submitButton}>
            DB 설정하기
          </button>
        </div>
      </div>
    </div>
  );
}


