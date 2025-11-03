'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!username || !password) {
      setError('계정명과 비밀번호를 입력해주세요.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      // API 호출 로직 필요
      // 로그인 성공 시
      router.push('/sangokushi_default/game');
    } catch (err) {
      setError(err instanceof Error ? err.message : '로그인에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.container}>
      <nav className={styles.navbar}>
        <div className={styles.navbarBrand}>삼국지 모의전투 HiDCHe</div>
      </nav>

      <div className={styles.mainContainer}>
        <h1 className={styles.title}>삼국지 모의전투 HiDCHe</h1>
        <div className={styles.loginCard}>
          <h3 className={styles.cardHeader}>로그인</h3>
          <form onSubmit={handleLogin} className={styles.loginForm}>
            <div className={styles.formGroup}>
              <label htmlFor="username">계정명</label>
              <input
                type="text"
                id="username"
                name="username"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="계정명"
                autoFocus
                className={styles.input}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="password">비밀번호</label>
              <input
                type="password"
                id="password"
                name="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="비밀번호"
                className={styles.input}
              />
            </div>

            {error && <div className={styles.error}>{error}</div>}

            <div className={styles.buttonGroup}>
              <button type="submit" disabled={loading} className={styles.loginButton}>
                {loading ? '로그인 중...' : '로그인'}
              </button>
              <button type="button" className={styles.dropdownToggle}>▼</button>
            </div>
          </form>
        </div>
      </div>

      <div className={styles.footer}>
        <a href="/terms.2.html">개인정보처리방침</a> & <a href="/terms.1.html">이용약관</a>
        <br />
        © 2023 • HideD
        <br />
        크롬, 엣지, 파이어폭스에 최적화되어있습니다.
      </div>
    </div>
  );
}
