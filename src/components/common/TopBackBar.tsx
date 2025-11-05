'use client';

import React from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import styles from './TopBackBar.module.css';

interface TopBackBarProps {
  title: string;
  reloadable?: boolean;
  onReload?: () => void;
  onBack?: () => void;
}

export default function TopBackBar({ title, reloadable, onReload, onBack }: TopBackBarProps) {
  const params = useParams();
  const router = useRouter();
  const serverID = params?.server as string;

  function handleBack() {
    if (onBack) {
      onBack();
    } else {
      router.push(`/${serverID}/game`);
    }
  }

  function handleReload() {
    if (onReload) {
      onReload();
    } else {
      window.location.reload();
    }
  }

  return (
    <div className={styles.topBackBar}>
      <div className={styles.title}>{title}</div>
      <div className={styles.actions}>
        {reloadable && (
          <button type="button" onClick={handleReload} className={styles.btn}>
            갱신
          </button>
        )}
        <button type="button" onClick={handleBack} className={styles.btn}>
          뒤로
        </button>
      </div>
    </div>
  );
}


