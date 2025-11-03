'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import TopBackBar from '@/components/common/TopBackBar';
import styles from './page.module.css';

interface Troop {
  troopID: number;
  troopName: string;
  troopLeader: {
    city: number;
    name: string;
    imgsvr: number;
    picture: number;
  };
  members: Array<{
    no: number;
    name: string;
    city: number;
  }>;
  reservedCommandBrief: string[];
  turnTime: string;
}

export default function TroopPage() {
  const params = useParams();
  const serverID = params?.server as string;

  const [troopList, setTroopList] = useState<Troop[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTroopName, setNewTroopName] = useState('');

  useEffect(() => {
    loadTroops();
  }, [serverID]);

  async function loadTroops() {
    try {
      setLoading(true);
      // API 호출 로직 필요
      setTroopList([]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function makeTroop() {
    if (!newTroopName.trim()) return;
    // API 호출 로직 필요
    setNewTroopName('');
    await loadTroops();
  }

  async function joinTroop(troopID: number) {
    // API 호출 로직 필요
    await loadTroops();
  }

  async function exitTroop() {
    // API 호출 로직 필요
    await loadTroops();
  }

  return (
    <div className={styles.container}>
      <TopBackBar title="부대 편성" reloadable onReload={loadTroops} />

      {loading ? (
        <div className="center" style={{ padding: '2rem' }}>로딩 중...</div>
      ) : (
        <>
          <div className={styles.troopList}>
            {troopList.map((troop) => (
              <div key={troop.troopID} className={styles.troopItem}>
                <div className={styles.troopInfo}>
                  {troop.troopName}
                </div>
                <div className={styles.troopTurn}>
                  【턴】 {troop.turnTime.slice(14, 19)}
                </div>
                <div className={styles.troopLeaderIcon}>
                  <img
                    width="64"
                    height="64"
                    src={`/api/general/icon/${troop.troopLeader.imgsvr}/${troop.troopLeader.picture}`}
                    alt={troop.troopLeader.name}
                  />
                </div>
                <div className={styles.troopLeaderName}>{troop.troopLeader.name}</div>
                <div className={styles.troopReservedCommand}>
                  {troop.reservedCommandBrief.map((brief, idx) => (
                    <div key={idx}>{`${idx + 1}: ${brief}`}</div>
                  ))}
                </div>
                <div className={styles.troopMembers}>
                  {troop.members.map((member, idx) => (
                    <span key={member.no}>
                      {idx > 0 && ', '}
                      {member.name}
                    </span>
                  ))}
                  ({troop.members.length}명)
                </div>
                <div className={styles.troopAction}>
                  <button type="button" onClick={() => joinTroop(troop.troopID)} className={styles.btn}>
                    부대 탑승
                  </button>
                  <button type="button" onClick={exitTroop} className={styles.btn}>
                    부대 탈퇴
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className={styles.makeTroopSection}>
            <div className={styles.makeTroopBox}>
              <div className={styles.makeTroopTitle}>부대 창설</div>
              <div className={styles.makeTroopForm}>
                <input
                  type="text"
                  value={newTroopName}
                  onChange={(e) => setNewTroopName(e.target.value)}
                  placeholder="부대명"
                  className={styles.input}
                />
                <button type="button" onClick={makeTroop} className={styles.btn}>
                  부대 창설
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

