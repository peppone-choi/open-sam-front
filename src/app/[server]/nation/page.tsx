'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';

export default function NationPage() {
  const params = useParams();
  const router = useRouter();
  const serverID = params?.server as string;
  const basePath = `/${serverID}/nation`;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>국가 관리</h1>
      </div>
      <div className={styles.content}>
        <div className={styles.menuGrid}>
          <Link href={`${basePath}/stratfinan`} className={styles.menuItem}>
            내무 부
          </Link>
          <Link href={`${basePath}/generals`} className={styles.menuItem}>
            세력 장수
          </Link>
          <Link href={`${basePath}/betting`} className={styles.menuItem}>
            국가 베팅
          </Link>
        </div>
        <div className={styles.backButton}>
          <Link href={`/${serverID}/game`}>← 게임으로 돌아가기</Link>
        </div>
      </div>
    </div>
  );
}

