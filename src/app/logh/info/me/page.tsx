'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from './page.module.css';

/**
 * LOGH - 내 제독 정보
 * 삼국지의 "내 장수 정보"와 대응
 */

interface Commander {
  no: number;
  name: string;
  faction: 'empire' | 'alliance';
  rank: string;
  stats: {
    command: number;      // 지휘력
    tactics: number;      // 전술
    strategy: number;     // 전략
    politics: number;     // 정치
  };
  experience: number;
  fleetId: string | null;
  position: {
    system: string;
    x: number;
    y: number;
    z: number;
  };
}

export default function MyCommanderInfoPage() {
  const [commander, setCommander] = useState<Commander | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCommanderInfo();
  }, []);

  async function loadCommanderInfo() {
    try {
      setLoading(true);
      // TODO: LOGH API 호출
      const response = await fetch('/api/logh/my-commander');
      const data = await response.json();
      setCommander(data.commander);
    } catch (err) {
      console.error(err);
      alert('제독 정보를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className={styles.container}>
        <div className="center">로딩 중...</div>
      </div>
    );
  }

  if (!commander) {
    return (
      <div className={styles.container}>
        <div className="center">제독 정보를 찾을 수 없습니다.</div>
      </div>
    );
  }

  const factionName = commander.faction === 'empire' ? '은하제국' : '자유행성동맹';

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>{commander.name} 제독</h1>
        <Link href="/logh/game" className={styles.backButton}>
          ← 전장으로
        </Link>
      </div>

      <div className={styles.infoSection}>
        <h2>기본 정보</h2>
        <table className={styles.infoTable}>
          <tbody>
            <tr>
              <th>이름</th>
              <td>{commander.name}</td>
            </tr>
            <tr>
              <th>소속</th>
              <td>{factionName}</td>
            </tr>
            <tr>
              <th>계급</th>
              <td>{commander.rank}</td>
            </tr>
            <tr>
              <th>경험치</th>
              <td>{commander.experience.toLocaleString()}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className={styles.statsSection}>
        <h2>능력치</h2>
        <table className={styles.statsTable}>
          <tbody>
            <tr>
              <th>지휘력</th>
              <td>
                <div className={styles.statBar}>
                  <div 
                    className={styles.statFill}
                    style={{ width: `${commander.stats.command}%` }}
                  />
                  <span>{commander.stats.command}</span>
                </div>
              </td>
            </tr>
            <tr>
              <th>전술</th>
              <td>
                <div className={styles.statBar}>
                  <div 
                    className={styles.statFill}
                    style={{ width: `${commander.stats.tactics}%` }}
                  />
                  <span>{commander.stats.tactics}</span>
                </div>
              </td>
            </tr>
            <tr>
              <th>전략</th>
              <td>
                <div className={styles.statBar}>
                  <div 
                    className={styles.statFill}
                    style={{ width: `${commander.stats.strategy}%` }}
                  />
                  <span>{commander.stats.strategy}</span>
                </div>
              </td>
            </tr>
            <tr>
              <th>정치</th>
              <td>
                <div className={styles.statBar}>
                  <div 
                    className={styles.statFill}
                    style={{ width: `${commander.stats.politics}%` }}
                  />
                  <span>{commander.stats.politics}</span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className={styles.positionSection}>
        <h2>현재 위치</h2>
        <p>성계: {commander.position.system}</p>
        <p>좌표: ({commander.position.x}, {commander.position.y}, {commander.position.z})</p>
      </div>
    </div>
  );
}
