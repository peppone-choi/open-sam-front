'use client';

import React from 'react';
import Link from 'next/link';
import styles from './page.module.css';

export default function OAuthFailPage() {
  return (
    <div className={styles.container}>
      <h1>인증 실패</h1>
      <div className={styles.message}>
        <p>카카오 인증에 실패했습니다.</p>
        <p>다시 시도해주세요.</p>
      </div>
      <div className={styles.actions}>
        <Link href="/" className={styles.button}>
          메인으로 돌아가기
        </Link>
      </div>
    </div>
  );
}


