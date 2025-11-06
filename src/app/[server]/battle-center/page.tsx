'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { SammoAPI } from '@/lib/api/sammo';
import TopBackBar from '@/components/common/TopBackBar';
import styles from './page.module.css';

export default function BattleCenterPage() {
  const params = useParams();
  const router = useRouter();
  const serverID = params?.server as string;

  const [loading, setLoading] = useState(true);
  const [battleData, setBattleData] = useState<any>(null);

  useEffect(() => {
    loadBattleData();
  }, [serverID]);

  async function loadBattleData() {
    try {
      setLoading(true);
      const result = await SammoAPI.GetBattleCenter({ serverID });
      if (result.success && result.battles) {
        setBattleData({ battles: result.battles });
      } else {
        setBattleData({ battles: [] });
      }
    } catch (err) {
      console.error(err);
      alert('전투 정보를 불러오는데 실패했습니다.');
      setBattleData({ battles: [] });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.container}>
      <TopBackBar title="감 찰 부" reloadable onReload={loadBattleData} />
      {loading ? (
        <div className="center" style={{ padding: '2rem' }}>로딩 중...</div>
      ) : (
        <div className={styles.content}>
          {battleData && battleData.battles && Array.isArray(battleData.battles) && battleData.battles.length > 0 ? (
            <div className={styles.battleList}>
              {battleData.battles.map((battle: any) => (
                <div key={battle.battleId} className={styles.battleItem}>
                  <div className={styles.battleHeader}>
                    <div className={styles.battleId}>전투 #{battle.battleId}</div>
                    <div className={styles.battleStatus}>{battle.status}</div>
                  </div>
                  <div className={styles.battleInfo}>
                    {battle.type === 'general' && (
                      <>
                        <div>장수: {battle.generalId}</div>
                        <div>국가: {battle.nationId}</div>
                      </>
                    )}
                    {battle.type === 'world' && (
                      <div>국가: {battle.nationId}</div>
                    )}
                    <div>내용: {battle.text}</div>
                    <div>날짜: {new Date(battle.date).toLocaleString('ko-KR')}</div>
                  </div>
                  <div className={styles.buttonGroup}>
                    <button
                      type="button"
                      onClick={() => {
                        router.push(`/${serverID}/battle/${battle.battleId || battle.id}`);
                      }}
                      className={styles.joinBtn}
                    >
                      상세보기
                    </button>
                    {battle.type === 'active' && (
                      <button
                        type="button"
                        onClick={() => {
                          router.push(`/${serverID}/battle-simulator?battleId=${battle.battleId}`);
                        }}
                        className={styles.simulateBtn}
                      >
                        시뮬레이터
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="center" style={{ padding: '2rem' }}>진행 중인 전투가 없습니다.</div>
          )}
        </div>
      )}
    </div>
  );
}




