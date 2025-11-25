'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SammoAPI } from '@/lib/api/sammo';
import TopBackBar from '@/components/common/TopBackBar';
import styles from './page.module.css';
import { useToast } from '@/contexts/ToastContext';

export default function DeleteAccountPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [globalSalt, setGlobalSalt] = useState<string>('');
  const [formData, setFormData] = useState({
    password: '',
    reason: '',
  });

  useEffect(() => {
    loadUserData();
  }, []);

  async function loadUserData() {
    try {
      setLoading(true);
      const result = await SammoAPI.GetUserInfo();
      if (result.result) {
        setGlobalSalt(result.global_salt);
      } else {
        showToast('로그인이 필요합니다.', 'warning');
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!formData.password) {
      showToast('비밀번호를 입력해주세요.', 'warning');
      return;
    }

    if (!confirm('정말로 계정을 탈퇴하시겠습니까?\n\n이 작업은 되돌릴 수 없으며, 1개월간 재가입이 불가능합니다.')) {
      return;
    }

    try {
      const result = await SammoAPI.DeleteMe({
        password: formData.password,
        globalSalt: globalSalt,
      });

      if (result.result) {
        showToast('계정이 탈퇴 처리되었습니다. 1개월간 정보가 보존되며, 재가입이 불가능합니다.', 'success');
        router.push('/');
      } else {
        showToast(result.reason || '계정 탈퇴에 실패했습니다.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('계정 탈퇴에 실패했습니다.', 'error');
    }
  }

  if (loading) {
    return (
      <div className={styles.container}>
        <TopBackBar title="회 원 탈 퇴" />
        <div className="center" style={{ padding: '2rem' }}>로딩 중...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <TopBackBar title="회 원 탈 퇴" />
      
      <div className={styles.content}>
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>탈퇴 안내</h2>
          <div className={styles.noticeBox}>
            <p className={styles.notice}>• 탈퇴 후 1개월간 회원정보가 보존됩니다.</p>
            <p className={styles.notice}>• 탈퇴 후 1개월간 재가입이 불가능합니다.</p>
            <p className={styles.notice}>• 모든 게임 데이터가 삭제되며 복구할 수 없습니다.</p>
            <p className={styles.notice}>• 게시한 글과 댓글은 자동으로 삭제되지 않습니다.</p>
            <p className={styles.warning}>• 이 작업은 되돌릴 수 없습니다.</p>
          </div>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>탈퇴 확인</h2>
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.formGroup}>
              <label>비밀번호 확인 <span className={styles.required}>*</span></label>
              <input
                type="password"
                autoComplete="current-password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className={styles.input}
                placeholder="현재 비밀번호를 입력하세요"
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label>탈퇴 사유 (선택)</label>
              <textarea
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                className={styles.textarea}
                placeholder="탈퇴 사유를 입력해주시면 서비스 개선에 도움이 됩니다. (선택사항)"
                rows={4}
              />
            </div>

            <div className={styles.buttonGroup}>
              <button 
                type="button" 
                onClick={() => router.back()} 
                className={styles.cancelButton}
              >
                취소
              </button>
              <button type="submit" className={styles.dangerButton}>
                탈퇴하기
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
