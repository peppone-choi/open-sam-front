'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import TopBackBar from '@/components/common/TopBackBar';
import styles from './page.module.css';

export default function AdminMainPage() {
  const params = useParams();
  const serverID = params?.server as string;

  const adminMenus = [
    {
      title: '일제 정보',
      description: '전체 게임 상태를 한눈에 확인',
      href: `/${serverID}/admin/info`,
      icon: '📊',
    },
    {
      title: '게임 설정',
      description: '게임 규칙 및 설정 관리',
      href: `/${serverID}/admin/game`,
      icon: '⚙️',
    },
    {
      title: '유저 관리',
      description: '유저 및 캐릭터 관리',
      href: `/${serverID}/admin/member`,
      icon: '👥',
    },
    {
      title: '장수 관리',
      description: '장수 상태 및 정보 관리',
      href: `/${serverID}/admin/general`,
      icon: '🎭',
    },
    {
      title: '외교 관리',
      description: '국가 간 외교 관계 관리',
      href: `/${serverID}/admin/diplomacy`,
      icon: '🤝',
    },
    {
      title: '시간 제어',
      description: '게임 시간 및 턴 제어',
      href: `/${serverID}/admin/time-control`,
      icon: '⏰',
    },
    {
      title: '전당 재구성',
      description: '명예의 전당 재계산',
      href: `/${serverID}/admin/force-rehall`,
      icon: '🏆',
    },
  ];

  return (
    <div className={styles.container}>
      <TopBackBar 
        title="관 리 자  패 널" 
        backUrl="/entrance"
      />
      
      <div className={styles.menuGrid}>
        {adminMenus.map((menu) => (
          <Link
            key={menu.href}
            href={menu.href}
            className={styles.menuCard}
          >
            <div className={styles.menuIcon}>{menu.icon}</div>
            <div className={styles.menuTitle}>{menu.title}</div>
            <div className={styles.menuDescription}>{menu.description}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
