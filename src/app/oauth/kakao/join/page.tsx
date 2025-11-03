'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';

export default function KakaoJoinPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      alert('비밀번호가 일치하지 않습니다.');
      return;
    }
    try {
      setLoading(true);
      // API 호출 로직 필요
      alert('회원가입이 완료되었습니다.');
      router.push('/');
    } catch (err) {
      console.error(err);
      alert('회원가입에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.container}>
      <h1>삼국지 모의전투 HiDCHe</h1>
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


