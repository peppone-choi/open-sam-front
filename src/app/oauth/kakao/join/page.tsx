'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { SammoAPI } from '@/lib/api/sammo';
import styles from './page.module.css';

function KakaoJoinContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const oauthCode = searchParams?.get('code');
  
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!formData.username || !formData.password) {
      alert('계정명과 비밀번호를 입력해주세요.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      alert('비밀번호가 일치하지 않습니다.');
      return;
    }

    if (formData.password.length < 6) {
      alert('비밀번호는 최소 6자 이상이어야 합니다.');
      return;
    }

    if (!oauthCode) {
      alert('OAuth 코드가 없습니다.');
      router.push('/oauth/fail');
      return;
    }

    try {
      setLoading(true);
      const result = await SammoAPI.OAuthKakaoJoin({
        username: formData.username,
        password: formData.password,
        oauthID: oauthCode,
      });

      if (result.result) {
        alert('회원가입이 완료되었습니다.');
        router.push('/');
      } else {
        alert(result.reason || '회원가입에 실패했습니다.');
      }
    } catch (err) {
      console.error(err);
      alert('회원가입에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.container}>
      <h1>OpenSAM</h1>
      <div className={styles.joinCard}>
        <h3 className={styles.cardHeader}>회원가입</h3>
        <form onSubmit={handleSubmit} className={styles.joinForm}>
          <div className={styles.formGroup}>
            <label>계정명</label>
            <input
              type="text"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              placeholder="계정명"
              className={styles.input}
              required
            />
          </div>
          <div className={styles.formGroup}>
            <label>비밀번호</label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="비밀번호"
              className={styles.input}
              required
            />
          </div>
          <div className={styles.formGroup}>
            <label>비밀번호 확인</label>
            <input
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              placeholder="비밀번호 확인"
              className={styles.input}
              required
            />
          </div>
          <button type="submit" disabled={loading} className={styles.submitButton}>
            {loading ? '처리 중...' : '회원가입'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function KakaoJoinPage() {
  return (
    <Suspense fallback={<div className="center" style={{ padding: '2rem' }}>로딩 중...</div>}>
      <KakaoJoinContent />
    </Suspense>
  );
}





