'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from './page.module.css';

export default function InfoPage() {
  const params = useParams();
  const router = useRouter();
  const serverID = params?.server as string;
  const basePath = `/${serverID}/info`;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>정보 페이지</h1>
      </div>
      <div className={styles.content}>
        <div className={styles.menuGrid}>
          <Link href={`${basePath}/me`} className={styles.menuItem}>
            내 정보 &amp; 설정
          </Link>
          <Link href={`${basePath}/nation`} className={styles.menuItem}>
            세력 정보
          </Link>
          <Link href={`${basePath}/city`} className={styles.menuItem}>
            세력 도시
          </Link>
          <Link href={`${basePath}/current-city`} className={styles.menuItem}>
            현재 도시
          </Link>
          <Link href={`${basePath}/officer`} className={styles.menuItem}>
            인사 부
          </Link>
          <Link href={`${basePath}/generals`} className={styles.menuItem}>
            암행 부
          </Link>
          <Link href={`${basePath}/general`} className={styles.menuItem}>
            장수 정보
          </Link>
          <Link href={`${basePath}/tournament`} className={styles.menuItem}>
            토너먼트 정보
          </Link>
          <Link href={`${basePath}/betting`} className={styles.menuItem}>
            베팅 정보
          </Link>
        </div>
        <div className={styles.backButton}>
          <Link href={`/${serverID}/game`}>← 게임으로 돌아가기</Link>
        </div>
      </div>
    </div>
  );
}

