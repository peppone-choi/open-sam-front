'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { SammoAPI } from '@/lib/api/sammo';
import TopBackBar from '@/components/common/TopBackBar';
import styles from './page.module.css';

export default function BattleCenterPage() {
  const params = useParams();
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
                    <div>공격국: {battle.attackerNationId}</div>
                    <div>방어국: {battle.defenderNationId}</div>
                    <div>도시: {battle.targetCityId}</div>
                    {battle.currentPhase && <div>단계: {battle.currentPhase}</div>}
                    {battle.currentTurn && <div>턴: {battle.currentTurn}/{battle.maxTurns}</div>}
                  </div>
                  {battle.status === 'ongoing' && (
                    <button
                      type="button"
                      onClick={() => {
                        // TODO: 전투 상세 페이지로 이동
                        alert('전투 상세 페이지는 향후 구현 예정입니다.');
                      }}
                      className={styles.joinBtn}
                    >
                      참가
                    </button>
                  )}
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




