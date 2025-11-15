'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { SammoAPI } from '@/lib/api/sammo';
import styles from './page.module.css';

export default function AdminPage() {
  const router = useRouter();
  const [serverList, setServerList] = useState<any[]>([]);
  const [userInfo, setUserInfo] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      
      const [serverStatus, userInfoData] = await Promise.all([
        SammoAPI.GetServerStatus(),
        SammoAPI.GetUserInfo().catch(() => null),
      ]);

      if (serverStatus.result) {
        setServerList(serverStatus.server);
      }

      if (userInfoData?.result) {
        setUserInfo(userInfoData);
        const grade = parseInt(userInfoData.grade) || 0;
        const adminStatus = grade >= 5 || userInfoData.acl !== '-';
        setIsAdmin(adminStatus);
        
        if (!adminStatus) {
          router.push('/entrance');
          return;
        }
      } else {
        // 로그인하지 않은 경우
        router.push('/entrance');
        return;
      }
    } catch (err) {
      console.error(err);
      router.push('/entrance');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className={styles.container}>
        <div className="center" style={{ padding: '2rem' }}>로딩 중...</div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className={styles.container}>
        <div className="center" style={{ padding: '2rem', color: 'red' }}>
          권한이 없습니다.
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>관리자 패널</h1>
        <Link href="/entrance" className={styles.backLink}>
          ← 돌아가기
        </Link>
      </div>

      <div className={styles.serverList}>
        <h2>서버별 관리</h2>
        {serverList.length > 0 ? (
          <div className={styles.serverGrid}>
            {serverList.map((server) => (
              <Link
                key={server.name}
                href={`/${server.name}/admin`}
                className={styles.serverCard}
              >
                <div className={styles.serverName}>{server.korName}</div>
                <div className={styles.serverId}>{server.name}</div>
                <div className={styles.serverStatus}>
                  {server.enable ? '🟢 활성' : '🔴 비활성'}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p>서버가 없습니다.</p>
        )}
      </div>

      <div className={styles.globalAdmin}>
        <h2>전역 관리</h2>
        <div className={styles.adminLinks}>
          <Link href="/admin/userlist" className={styles.adminLink}>
            사용자 관리
          </Link>
          <Link href="/admin/error-log" className={styles.adminLink}>
            에러 로그
          </Link>
          <Link href="/admin/sessions" className={styles.adminLink}>
            세션 관리
          </Link>
        </div>
      </div>
    </div>
  );
}

