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
  backUrl?: string; // 뒤로 가기 URL 직접 지정
}

export default function TopBackBar({ title, reloadable, onReload, onBack, backUrl }: TopBackBarProps) {
  const params = useParams();
  const router = useRouter();
  const serverID = params?.server as string;

  function handleBack() {
    if (onBack) {
      onBack();
    } else if (backUrl) {
      router.push(backUrl);
    } else {
      // 현재 경로에 따라 판단
      const currentPath = window.location.pathname;
      if (currentPath.includes('/admin')) {
        // /[server]/admin/xxx → /[server]/admin
        // /[server]/admin → /entrance
        const pathParts = currentPath.split('/').filter(Boolean);
        const adminIndex = pathParts.indexOf('admin');
        
        if (adminIndex >= 0 && adminIndex < pathParts.length - 1) {
          // 하위 관리 페이지 → 관리자 메인
          router.push(`/${serverID}/admin`);
        } else {
          // 관리자 메인 → entrance
          router.push('/entrance');
        }
      } else {
        // 게임 페이지에서는 game으로
        router.push(`/${serverID}/game`);
      }
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


