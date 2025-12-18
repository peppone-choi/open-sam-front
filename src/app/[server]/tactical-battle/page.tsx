'use client';

/**
 * 전술전투 목록 페이지
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import TopBackBar from '@/components/common/TopBackBar';
import { SammoAPI } from '@/lib/api/sammo';
import styles from './page.module.css';

interface BattleSummary {
  battleId: string;
  cityId: number;
  cityName: string;
  status: 'waiting' | 'ready' | 'ongoing' | 'finished';
  attacker: {
    nationId: number;
    nationName: string;
    isUserControlled: boolean;
    generalCount: number;
  };
  defender: {
    nationId: number;
    nationName: string;
    isUserControlled: boolean;
    generalCount: number;
  };
  currentTurn: number;
  currentSide: 'attacker' | 'defender';
  createdAt: string;
}

export default function TacticalBattleListPage() {
  const params = useParams();
  const router = useRouter();
  
  const server = params.server as string;
  
  const [battles, setBattles] = useState<BattleSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // 전투 목록 조회
  const fetchBattles = useCallback(async () => {
    try {
      const response = await SammoAPI.TacticalBattle.getBattles(server);
      if (response?.success) {
        setBattles(response.data || []);
      }
    } catch (err: any) {
      setError(err.message || '전투 목록을 불러오는데 실패했습니다');
    } finally {
      setLoading(false);
    }
  }, [server]);
  
  useEffect(() => {
    fetchBattles();
  }, [fetchBattles]);
  
  // 폴링
  useEffect(() => {
    const interval = setInterval(fetchBattles, 10000);
    return () => clearInterval(interval);
  }, [fetchBattles]);
  
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'waiting': return '대기 중';
      case 'ready': return '시작 준비';
      case 'ongoing': return '진행 중';
      case 'finished': return '종료';
      default: return status;
    }
  };
  
  const getStatusClass = (status: string) => {
    switch (status) {
      case 'waiting': return styles.statusWaiting;
      case 'ready': return styles.statusReady;
      case 'ongoing': return styles.statusOngoing;
      case 'finished': return styles.statusFinished;
      default: return '';
    }
  };
  
  return (
    <div className={styles.container}>
      <TopBackBar title="전술전투 목록" backUrl={`/${server}/game`} />
      
      <div className={styles.content}>
        <div className={styles.header}>
          <h2>⚔️ 진행 중인 전투</h2>
          <button onClick={fetchBattles} className={styles.refreshBtn}>
            🔄 새로고침
          </button>
        </div>
        
        {loading && !battles.length && (
          <div className={styles.loading}>로딩 중...</div>
        )}
        
        {error && (
          <div className={styles.error}>{error}</div>
        )}
        
        {!loading && battles.length === 0 && (
          <div className={styles.empty}>
            <p>진행 중인 전술전투가 없습니다.</p>
            <p className={styles.hint}>
              출병 시 전술전투가 활성화되어 있으면 여기에 표시됩니다.
            </p>
          </div>
        )}
        
        <div className={styles.battleList}>
          {battles.map(battle => (
            <Link
              key={battle.battleId}
              href={`/${server}/tactical-battle/${battle.battleId}`}
              className={styles.battleCard}
            >
              <div className={styles.battleHeader}>
                <span className={styles.cityName}>🏰 {battle.cityName}</span>
                <span className={`${styles.status} ${getStatusClass(battle.status)}`}>
                  {getStatusLabel(battle.status)}
                </span>
              </div>
              
              <div className={styles.versus}>
                <div className={styles.nation}>
                  <span className={styles.nationName}>{battle.attacker.nationName}</span>
                  <span className={styles.generalCount}>{battle.attacker.generalCount}명</span>
                </div>
                <span className={styles.vs}>VS</span>
                <div className={styles.nation}>
                  <span className={styles.nationName}>{battle.defender.nationName}</span>
                  <span className={styles.generalCount}>{battle.defender.generalCount}명</span>
                </div>
              </div>
              
              {battle.status === 'ongoing' && (
                <div className={styles.turnInfo}>
                  <span>턴 {battle.currentTurn}</span>
                  <span className={battle.currentSide === 'attacker' ? styles.attackerTurn : styles.defenderTurn}>
                    {battle.currentSide === 'attacker' ? '공격측' : '방어측'} 차례
                  </span>
                </div>
              )}
              
              <div className={styles.createdAt}>
                {new Date(battle.createdAt).toLocaleString('ko-KR')}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}


