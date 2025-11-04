'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { SammoAPI } from '@/lib/api/sammo';
import styles from './page.module.css';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);

  // 토큰이 있으면 입장 페이지로 리다이렉트
  useEffect(() => {
    async function checkToken() {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          // 토큰이 유효한지 확인
          try {
            const userInfo = await SammoAPI.GetUserInfo();
            if (userInfo.result) {
              router.push('/entrance');
              return;
            }
          } catch {
            // 토큰이 유효하지 않으면 삭제
            localStorage.removeItem('token');
          }
        }
      } catch (err) {
        // 에러가 발생해도 로그인 페이지 표시
        console.error('토큰 체크 실패:', err);
      } finally {
        setChecking(false);
      }
    }
    checkToken();
  }, [router]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!username || !password) {
      setError('계정명과 비밀번호를 입력해주세요.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const result = await SammoAPI.LoginByID({
        username,
        password,
      });

      if (result.result) {
        // 로그인 성공
        if (result.reqOTP) {
          // OTP 필요
          setError('인증 코드가 필요합니다.');
          // OTP 모달 표시 로직 추가 필요
        } else {
          // 토큰 저장
          if (result.token) {
            localStorage.setItem('token', result.token);
          }
          // 성공 - entrance 페이지로 이동
          router.push('/entrance');
        }
      } else {
        setError(result.reason || '로그인에 실패했습니다.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '로그인에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.container}>
      <nav className={styles.navbar}>
        <div className={styles.navbarBrand}>OpenSAM</div>
      </nav>

      <div className={styles.mainContainer}>
        <h1 className={styles.title}>OpenSAM</h1>
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
              <button type="submit" disabled={loading || checking} className={styles.loginButton}>
                {loading ? '로그인 중...' : '로그인'}
              </button>
              <button type="button" className={styles.dropdownToggle}>▼</button>
            </div>
          </form>
          
          <div className={styles.registerLink}>
            <Link href="/register" className={styles.registerButton}>
              회원가입
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
