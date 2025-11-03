'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import TopBackBar from '@/components/common/TopBackBar';
import styles from './page.module.css';

export default function UserInfoPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<any>(null);
  const [formData, setFormData] = useState({
    password: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    loadUserData();
  }, []);

  async function loadUserData() {
    try {
      setLoading(true);
      // API 호출 로직 필요
      setUserData(null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleChangePassword() {
    if (formData.newPassword !== formData.confirmPassword) {
      alert('새 비밀번호가 일치하지 않습니다.');
      return;
    }
    try {
      // API 호출 로직 필요
      alert('비밀번호가 변경되었습니다.');
      setFormData({ password: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      console.error(err);
      alert('비밀번호 변경에 실패했습니다.');
    }
  }

  async function handleDeleteAccount() {
    if (!confirm('정말로 계정을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
      return;
    }
    try {
      // API 호출 로직 필요
      alert('계정이 삭제되었습니다.');
      router.push('/');
    } catch (err) {
      console.error(err);
      alert('계정 삭제에 실패했습니다.');
    }
  }

  return (
    <div className={styles.container}>
      <TopBackBar title="계 정 관 리" />
      {loading ? (
        <div className="center" style={{ padding: '2rem' }}>로딩 중...</div>
      ) : (
        <div className={styles.content}>
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>비밀번호 변경</h2>
            <div className={styles.form}>
              <div className={styles.formGroup}>
                <label>현재 비밀번호</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className={styles.input}
                />
              </div>
              <div className={styles.formGroup}>
                <label>새 비밀번호</label>
                <input
                  type="password"
                  value={formData.newPassword}
                  onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                  className={styles.input}
                />
              </div>
              <div className={styles.formGroup}>
                <label>새 비밀번호 확인</label>
                <input
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className={styles.input}
                />
              </div>
              <button type="button" onClick={handleChangePassword} className={styles.button}>
                비밀번호 변경
              </button>
            </div>
          </div>

          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>계정 탈퇴</h2>
            <button type="button" onClick={handleDeleteAccount} className={styles.dangerButton}>
              계정 삭제
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

