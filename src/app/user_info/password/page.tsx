'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SammoAPI } from '@/lib/api/sammo';
import TopBackBar from '@/components/common/TopBackBar';
import styles from './page.module.css';
import { useToast } from '@/contexts/ToastContext';

export default function ChangePasswordPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [globalSalt, setGlobalSalt] = useState<string>('');
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    loadUserInfo();
  }, []);

  async function loadUserInfo() {
    try {
      setLoading(true);
      const result = await SammoAPI.GetUserInfo();
      if (result.result) {
        setGlobalSalt(result.global_salt);
      } else {
        showToast('사용자 정보를 불러오는데 실패했습니다.', 'error');
        router.push('/entrance');
      }
    } catch (err) {
      console.error(err);
      showToast('사용자 정보를 불러오는데 실패했습니다.', 'error');
      router.push('/entrance');
    } finally {
      setLoading(false);
    }
  }

  function validateForm(): boolean {
    if (!formData.currentPassword || !formData.newPassword || !formData.confirmPassword) {
      showToast('모든 필드를 입력해주세요.', 'warning');
      return false;
    }

    if (formData.newPassword.length < 6) {
      showToast('새 비밀번호는 최소 6자 이상이어야 합니다.', 'warning');
      return false;
    }

    if (formData.newPassword.length > 50) {
      showToast('새 비밀번호는 최대 50자 이하여야 합니다.', 'warning');
      return false;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      showToast('새 비밀번호가 일치하지 않습니다.', 'warning');
      return false;
    }

    if (formData.currentPassword === formData.newPassword) {
      showToast('새 비밀번호는 현재 비밀번호와 달라야 합니다.', 'warning');
      return false;
    }

    return true;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      const result = await SammoAPI.ChangePassword({
        password: formData.currentPassword,
        newPassword: formData.newPassword,
        globalSalt: globalSalt,
      });

      if (result.result) {
        showToast('비밀번호가 변경되었습니다.', 'success');
        setFormData({ 
          currentPassword: '', 
          newPassword: '', 
          confirmPassword: '' 
        });
        router.push('/user-info');
      } else {
        showToast(result.reason || '비밀번호 변경에 실패했습니다.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('비밀번호 변경에 실패했습니다.', 'error');
    }
  }

  if (loading) {
    return (
      <div className={styles.container}>
        <TopBackBar title="비밀번호 변경" />
        <div className="center" style={{ padding: '2rem' }}>로딩 중...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <TopBackBar title="비밀번호 변경" />
      <div className={styles.content}>
        <div className={styles.section}>
          <div className={styles.instructions}>
            <p>• 비밀번호는 최소 6자 이상, 최대 50자 이하여야 합니다.</p>
            <p>• 새 비밀번호는 현재 비밀번호와 달라야 합니다.</p>
          </div>

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.formGroup}>
              <label htmlFor="currentPassword">현재 비밀번호</label>
              <input
                id="currentPassword"
                type="password"
                autoComplete="current-password"
                value={formData.currentPassword}
                onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                className={styles.input}
                required
                maxLength={50}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="newPassword">새 비밀번호</label>
              <input
                id="newPassword"
                type="password"
                autoComplete="new-password"
                value={formData.newPassword}
                onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                className={styles.input}
                required
                minLength={6}
                maxLength={50}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="confirmPassword">새 비밀번호 확인</label>
              <input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                className={styles.input}
                required
                minLength={6}
                maxLength={50}
              />
            </div>

            <div className={styles.buttonGroup}>
              <button type="submit" className={styles.button}>
                비밀번호 변경
              </button>
              <button 
                type="button" 
                className={styles.cancelButton}
                onClick={() => router.push('/user-info')}
              >
                취소
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
