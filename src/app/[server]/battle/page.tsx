'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import styles from './page.module.css';

export default function BattlePage() {
  const params = useParams();
  const serverID = params?.server as string;
  const basePath = `/${serverID}`;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>전투</h1>
      </div>
      <div className={styles.content}>
        <div className={styles.message}>
          <p>전투 목록을 보려면 특정 전투 ID가 필요합니다.</p>
          <p>전투는 게임 내에서 자동으로 생성되거나, 전투 센터에서 시작할 수 있습니다.</p>
        </div>
        <div className={styles.menuGrid}>
          <Link href={`${basePath}/battle-center`} className={styles.menuItem}>
            전투 센터
          </Link>
          <Link href={`${basePath}/battle-simulator`} className={styles.menuItem}>
            전투 시뮬레이터
          </Link>
        </div>
        <div className={styles.backButton}>
          <Link href={`/${serverID}/game`}>← 게임으로 돌아가기</Link>
        </div>
      </div>
    </div>
  );
}

