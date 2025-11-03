'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from './page.module.css';

interface Server {
  serverID: string;
  name: string;
  korName: string;
  color: string;
  exists: boolean;
  enable: boolean;
  generals?: Array<{ name: string; nation: string }>;
}

export default function EntrancePage() {
  const router = useRouter();
  const [serverList, setServerList] = useState<Server[]>([]);
  const [loading, setLoading] = useState(true);
  const [userInfo, setUserInfo] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      // API 호출 로직 필요
      setServerList([]);
      setUserInfo(null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    // 로그아웃 로직
    router.push('/');
  }

  return (
    <div className={styles.container}>
      <nav className={styles.navbar}>
        <Link href="/" className={styles.navbarBrand}>
          삼국지 모의전투 HiDCHe
        </Link>
      </nav>

      <div className={styles.content}>
        <div className={styles.notice}>
          <span className={styles.noticeText}>공지사항</span>
        </div>

        <table className={`${styles.serverListTable} tb_layout`}>
          <caption className={`${styles.caption} bg2`}>서 버 선 택</caption>
          <thead>
            <tr>
              <th className="bg1">서 버</th>
              <th className="bg1">정 보</th>
              <th className="bg1" colSpan={2}>캐 릭 터</th>
              <th className="bg1">선 택</th>
            </tr>
          </thead>
          <tbody>
            {serverList.map((server) => (
              <tr key={server.serverID}>
                <td className={styles.serverName}>{server.name}</td>
                <td>{server.korName}</td>
                <td>
                  {server.generals?.map((gen, idx) => (
                    <div key={idx}>{gen.name}</div>
                  ))}
                </td>
                <td>
                  {server.generals?.map((gen, idx) => (
                    <div key={idx}>{gen.nation}</div>
                  ))}
                </td>
                <td>
                  {server.exists && server.enable ? (
                    <Link href={`/${server.serverID}/game`} className={styles.selectBtn}>
                      입 장
                    </Link>
                  ) : (
                    <span className={styles.disabled}>-</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={5} className="bg0">
                <div className={styles.footerInfo}>
                  ★ 1명이 2개 이상의 계정을 사용하거나 타 유저의 턴을 대신 입력하는 것이 적발될 경우 차단 될 수 있습니다.
                  <br />
                  계정은 한번 등록으로 계속 사용합니다. 각 서버 리셋시 캐릭터만 새로 생성하면 됩니다.
                </div>
              </td>
            </tr>
          </tfoot>
        </table>

        <div className={styles.userInfo}>
          <div className={`${styles.sectionTitle} bg2`}>계 정 관 리</div>
          <div className={styles.actions}>
            <Link href="/user_info" className={styles.btn}>
              비밀번호 &amp; 전콘 &amp; 탈퇴
            </Link>
            <button type="button" onClick={handleLogout} className={styles.btn}>
              로 그 아 웃
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

