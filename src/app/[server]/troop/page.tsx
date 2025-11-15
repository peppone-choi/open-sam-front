'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { SammoAPI } from '@/lib/api/sammo';
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
      // NationGeneralList API를 사용하여 부대 목록 가져오기
      const result = await SammoAPI.NationGeneralList({ serverID });
      if (result.success && result.troops && result.list) {
        // GeneralListService의 troops 형식을 Troop 형식으로 변환
        const troopListData: Troop[] = result.troops.map((troop: any) => {
          // 부대장 정보 찾기 (troop.id는 부대장 ID)
          const leader = result.list?.find((gen: any) => gen.no === troop.id);
          
          // 부대원 목록 찾기 (같은 부대에 속한 장수들)
          // troop.id는 부대장 ID이므로, 부대원 목록은 부대장을 포함한 모든 장수
          const members = result.list?.filter((gen: any) => {
            // 부대장이거나, 부대장의 troop 필드가 같은 경우
            return gen.no === troop.id || (gen.troop && gen.troop === troop.id);
          }) || [];
          
          // 예약된 커맨드는 부대장의 reservedCommand에서 가져와야 하지만
          // GeneralListService에서는 제공하지 않으므로 일단 빈 배열
          const reservedCommandBrief: string[] = [];
          
          return {
            troopID: troop.id,
            troopName: troop.name || '무명부대',
            troopLeader: {
              city: leader?.city || 0,
              name: leader?.name || '무명',
              imgsvr: leader?.imgsvr || 0,
              picture: leader?.picture || 0,
            },
            members: members.map((gen: any) => ({
              no: gen.no,
              name: gen.name,
              city: gen.city || 0,
            })),
            reservedCommandBrief,
            turnTime: troop.turntime || new Date().toISOString(),
          };
        });
        
        setTroopList(troopListData);
      } else {
        setTroopList([]);
      }
    } catch (err) {
      console.error(err);
      alert('부대 정보를 불러오는데 실패했습니다.');
      setTroopList([]);
    } finally {
      setLoading(false);
    }
  }

  async function makeTroop() {
    if (!newTroopName.trim()) {
      alert('부대명을 입력해주세요.');
      return;
    }

    try {
      const result = await SammoAPI.TroopNewTroop({
        name: newTroopName,
        session_id: serverID,
      });

      if (result.result) {
        setNewTroopName('');
        await loadTroops();
      } else {
        alert(result.reason || '부대 창설에 실패했습니다.');
      }
    } catch (err) {
      console.error(err);
      alert('부대 창설에 실패했습니다.');
    }
  }

  async function joinTroop(troopID: number) {
    try {
      const result = await SammoAPI.TroopJoinTroop({
        troopID: troopID,
      });

      if (result.result) {
        await loadTroops();
      } else {
        alert(result.reason || '부대 탑승에 실패했습니다.');
      }
    } catch (err) {
      console.error(err);
      alert('부대 탑승에 실패했습니다.');
    }
  }

  async function exitTroop() {
    if (!confirm('정말로 부대를 탈퇴하시겠습니까?')) {
      return;
    }

    try {
      const result = await SammoAPI.TroopExitTroop();
      if (result.result) {
        await loadTroops();
      } else {
        alert(result.reason || '부대 탈퇴에 실패했습니다.');
      }
    } catch (err) {
      console.error(err);
      alert('부대 탈퇴에 실패했습니다.');
    }
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




