'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { SammoAPI } from '@/lib/api/sammo';
import styles from './page.module.css';

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!formData.username || !formData.password) {
      setError('계정명과 비밀번호를 입력해주세요.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }

    if (formData.password.length < 6) {
      setError('비밀번호는 최소 6자 이상이어야 합니다.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const result = await SammoAPI.Register({
        username: formData.username,
        password: formData.password,
      });

      if (result.result) {
        alert('회원가입이 완료되었습니다. 로그인해주세요.');
        router.push('/');
      } else {
        setError(result.reason || '회원가입에 실패했습니다.');
      }
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : '회원가입에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.container}>
      <nav className={styles.navbar}>
        <Link href="/" className={styles.navbarBrand}>
          OpenSAM
        </Link>
      </nav>

      <div className={styles.mainContainer}>
        <h1 className={styles.title}>OpenSAM</h1>
        <div className={styles.registerCard}>
          <h3 className={styles.cardHeader}>회원가입</h3>
          <form onSubmit={handleSubmit} className={styles.registerForm}>
            <div className={styles.formGroup}>
              <label htmlFor="username">계정명</label>
              <input
                type="text"
                id="username"
                name="username"
                autoComplete="username"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                placeholder="계정명"
                autoFocus
                className={styles.input}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="password">비밀번호</label>
              <input
                type="password"
                id="password"
                name="password"
                autoComplete="new-password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="비밀번호 (최소 6자)"
                className={styles.input}
                required
                minLength={6}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="confirmPassword">비밀번호 확인</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                autoComplete="new-password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                placeholder="비밀번호 확인"
                className={styles.input}
                required
                minLength={6}
              />
            </div>

            {error && <div className={styles.error}>{error}</div>}

            <button type="submit" disabled={loading} className={styles.submitButton}>
              {loading ? '처리 중...' : '회원가입'}
            </button>
          </form>

          <div className={styles.loginLink}>
            <Link href="/" className={styles.loginLinkText}>
              이미 계정이 있으신가요? 로그인
            </Link>
          </div>
        </div>
      </div>

      <div className={styles.footer}>
        <a href="/terms.2.html">개인정보처리방침</a> & <a href="/terms.1.html">이용약관</a>
        <br />
        © 2025 • 빼뽀네 + 팀 빼벤저스
        <br />
        크롬, 엣지, 파이어폭스에 최적화되어있습니다.
      </div>
    </div>
  );
}




