'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SammoAPI } from '@/lib/api/sammo';
import TopBackBar from '@/components/common/TopBackBar';
import styles from './page.module.css';

export default function DeleteAccountPage() {
  const router = useRouter();
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
        alert('로그인이 필요합니다.');
        router.push('/entrance');
      }
    } catch (err) {
      console.error(err);
      alert('사용자 정보를 불러오는데 실패했습니다.');
      router.push('/entrance');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!formData.password) {
      alert('비밀번호를 입력해주세요.');
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
        alert('계정이 탈퇴 처리되었습니다.\n1개월간 정보가 보존되며, 1개월간 재가입이 불가능합니다.');
        router.push('/');
      } else {
        alert(result.reason || '계정 탈퇴에 실패했습니다.');
      }
    } catch (err) {
      console.error(err);
      alert('계정 탈퇴에 실패했습니다.');
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
