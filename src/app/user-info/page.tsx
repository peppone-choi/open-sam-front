'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { SammoAPI } from '@/lib/api/sammo';
import TopBackBar from '@/components/common/TopBackBar';
import styles from './page.module.css';

export default function UserInfoPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<any>(null);
  const [globalSalt, setGlobalSalt] = useState<string>('');
  const [formData, setFormData] = useState({
    password: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [deletePassword, setDeletePassword] = useState('');

  useEffect(() => {
    loadUserData();
  }, []);

  async function loadUserData() {
    try {
      setLoading(true);
      const result = await SammoAPI.GetUserInfo();
      if (result.result) {
        setUserData(result);
        setGlobalSalt(result.global_salt);
      }
    } catch (err) {
      console.error(err);
      alert('사용자 정보를 불러오는데 실패했습니다.');
      router.push('/entrance');
    } finally {
      setLoading(false);
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    
    if (!formData.password || !formData.newPassword) {
      alert('모든 필드를 입력해주세요.');
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      alert('새 비밀번호가 일치하지 않습니다.');
      return;
    }

    if (formData.newPassword.length < 6) {
      alert('새 비밀번호는 최소 6자 이상이어야 합니다.');
      return;
    }

    try {
      const result = await SammoAPI.ChangePassword({
        password: formData.password,
        newPassword: formData.newPassword,
        globalSalt: globalSalt,
      });

      if (result.result) {
        alert('비밀번호가 변경되었습니다.');
        setFormData({ password: '', newPassword: '', confirmPassword: '' });
      } else {
        alert(result.reason || '비밀번호 변경에 실패했습니다.');
      }
    } catch (err) {
      console.error(err);
      alert('비밀번호 변경에 실패했습니다.');
    }
  }

  async function handleDeleteAccount(e: React.FormEvent) {
    e.preventDefault();

    if (!deletePassword) {
      alert('비밀번호를 입력해주세요.');
      return;
    }

    if (!confirm('정말로 계정을 삭제하시겠습니까? 이 작업은 되돌릴 수 없으며, 1개월간 재가입이 불가능합니다.')) {
      return;
    }

    try {
      const result = await SammoAPI.DeleteMe({
        password: deletePassword,
        globalSalt: globalSalt,
      });

      if (result.result) {
        alert('계정이 삭제되었습니다.');
        router.push('/');
      } else {
        alert(result.reason || '계정 삭제에 실패했습니다.');
      }
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
      ) : userData ? (
        <div className={styles.content}>
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>회 원 정 보</h2>
            <div className={styles.infoTable}>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>ID:</span>
                <span className={styles.infoValue}>{userData.id}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>닉네임:</span>
                <span className={styles.infoValue}>{userData.name}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>등급:</span>
                <span className={styles.infoValue}>{userData.grade}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>가입일시:</span>
                <span className={styles.infoValue}>{userData.join_date}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>인증 방식:</span>
                <span className={styles.infoValue}>{userData.oauth_type || '일반'}</span>
              </div>
              {userData.acl && userData.acl !== '-' && (
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>권한:</span>
                  <span className={styles.infoValue} dangerouslySetInnerHTML={{ __html: userData.acl }} />
                </div>
              )}
            </div>
          </div>

          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>비밀번호 변경</h2>
            <form onSubmit={handleChangePassword} className={styles.form}>
              <div className={styles.formGroup}>
                <label>현재 비밀번호</label>
                <input
                  type="password"
                  autoComplete="current-password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className={styles.input}
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label>새 비밀번호</label>
                <input
                  type="password"
                  autoComplete="new-password"
                  value={formData.newPassword}
                  onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                  className={styles.input}
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label>새 비밀번호 확인</label>
                <input
                  type="password"
                  autoComplete="new-password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className={styles.input}
                  required
                />
              </div>
              <button type="submit" className={styles.button}>
                비밀번호 변경
              </button>
            </form>
          </div>

          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>계정 탈퇴</h2>
            <p className={styles.warning}>
              탈퇴시 1개월간 정보가 보존되며, 1개월간 재가입이 불가능합니다.
            </p>
            <form onSubmit={handleDeleteAccount} className={styles.form}>
              <div className={styles.formGroup}>
                <label>현재 비밀번호</label>
                <input
                  type="password"
                  autoComplete="current-password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  className={styles.input}
                  required
                />
              </div>
              <button type="submit" className={styles.dangerButton}>
                계정 삭제
              </button>
            </form>
          </div>
        </div>
      ) : (
        <div className="center" style={{ padding: '2rem' }}>사용자 정보를 불러올 수 없습니다.</div>
      )}
    </div>
  );
}


