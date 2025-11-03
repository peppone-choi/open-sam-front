'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';

export default function FileInstallPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [installStep, setInstallStep] = useState<'db' | 'config' | 'complete'>('db');
  const [formData, setFormData] = useState({
    db_host: 'localhost',
    db_name: '',
    db_user: '',
    db_password: '',
  });

  async function handleDBSubmit() {
    try {
      setLoading(true);
      // API 호출 로직 필요
      setInstallStep('config');
    } catch (err) {
      console.error(err);
      alert('DB 설정에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }

  async function handleConfigSubmit() {
    try {
      setLoading(true);
      // API 호출 로직 필요
      setInstallStep('complete');
    } catch (err) {
      console.error(err);
      alert('설정에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }

  if (installStep === 'complete') {
    return (
      <div className={styles.container}>
        <h1>설치 완료</h1>
        <div className={styles.message}>
          <p>설치가 성공적으로 완료되었습니다.</p>
          <button type="button" onClick={() => router.push('/')} className={styles.button}>
            메인으로 이동
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>삼국지 모의전투 HiDCHe 설치</h1>
      {installStep === 'db' ? (
        <div className={styles.installCard}>
          <h3 className={styles.cardHeader}>DB 설정</h3>
          <div className={styles.formContent}>
            <div className={styles.formGroup}>
              <label>DB 호스트</label>
              <input
                type="text"
                value={formData.db_host}
                onChange={(e) => setFormData({ ...formData, db_host: e.target.value })}
                className={styles.input}
                placeholder="localhost"
              />
            </div>
            <div className={styles.formGroup}>
              <label>DB 이름</label>
              <input
                type="text"
                value={formData.db_name}
                onChange={(e) => setFormData({ ...formData, db_name: e.target.value })}
                className={styles.input}
              />
            </div>
            <div className={styles.formGroup}>
              <label>DB 사용자</label>
              <input
                type="text"
                value={formData.db_user}
                onChange={(e) => setFormData({ ...formData, db_user: e.target.value })}
                className={styles.input}
              />
            </div>
            <div className={styles.formGroup}>
              <label>DB 비밀번호</label>
              <input
                type="password"
                value={formData.db_password}
                onChange={(e) => setFormData({ ...formData, db_password: e.target.value })}
                className={styles.input}
              />
            </div>
            <button
              type="button"
              onClick={handleDBSubmit}
              disabled={loading}
              className={styles.submitButton}
            >
              {loading ? '처리 중...' : '다음'}
            </button>
          </div>
        </div>
      ) : (
        <div className={styles.installCard}>
          <h3 className={styles.cardHeader}>환경 설정</h3>
          <div className={styles.formContent}>
            <p>환경 설정 폼을 여기에 추가하세요.</p>
            <button
              type="button"
              onClick={handleConfigSubmit}
              disabled={loading}
              className={styles.submitButton}
            >
              {loading ? '처리 중...' : '설치 완료'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}


