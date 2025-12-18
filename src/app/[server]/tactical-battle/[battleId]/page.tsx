'use client';

/**
 * 전술전투 페이지
 * 20x20 격자 기반 전술 전투
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { TacticalBattleMap } from '@/components/tactical-battle';
import TopBackBar from '@/components/common/TopBackBar';
import { SammoAPI } from '@/lib/api/sammo';
import styles from './page.module.css';

interface Position {
  x: number;
  y: number;
}

export default function TacticalBattlePage() {
  const params = useParams();
  const router = useRouter();
  
  const server = params.server as string;
  const battleId = params.battleId as string;
  
  const [battleData, setBattleData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [playerSide, setPlayerSide] = useState<'attacker' | 'defender' | null>(null);
  
  // 전투 데이터 조회
  const fetchBattleData = useCallback(async () => {
    try {
      const response = await SammoAPI.TacticalBattle.getBattle(battleId);
      if (response?.success) {
        setBattleData(response.data);
        // TODO: 현재 유저의 국가를 기반으로 playerSide 결정
      }
    } catch (err: any) {
      setError(err.message || '전투 데이터를 불러오는데 실패했습니다');
    } finally {
      setLoading(false);
    }
  }, [battleId]);
  
  // 초기 로드
  useEffect(() => {
    fetchBattleData();
  }, [fetchBattleData]);
  
  // 폴링 (진행 중인 전투)
  useEffect(() => {
    if (!battleData || battleData.status === 'finished') return;
    
    const interval = setInterval(fetchBattleData, 3000);
    return () => clearInterval(interval);
  }, [battleData, fetchBattleData]);
  
  // 이동 처리
  const handleMove = useCallback(async (unitId: string, position: Position) => {
    try {
      await SammoAPI.TacticalBattle.moveUnit(battleId, unitId, position.x, position.y);
      fetchBattleData();
    } catch (err: any) {
      console.error('이동 실패:', err);
    }
  }, [battleId, fetchBattleData]);
  
  // 공격 처리
  const handleAttack = useCallback(async (unitId: string, targetId: string) => {
    try {
      await SammoAPI.TacticalBattle.attackUnit(battleId, unitId, targetId);
      fetchBattleData();
    } catch (err: any) {
      console.error('공격 실패:', err);
    }
  }, [battleId, fetchBattleData]);
  
  // 대기 처리
  const handleWait = useCallback(async (unitId: string) => {
    try {
      await SammoAPI.TacticalBattle.waitUnit(battleId, unitId);
      fetchBattleData();
    } catch (err: any) {
      console.error('대기 실패:', err);
    }
  }, [battleId, fetchBattleData]);
  
  // 턴 종료
  const handleEndTurn = useCallback(async (side: 'attacker' | 'defender') => {
    try {
      await SammoAPI.TacticalBattle.endTurn(battleId, side);
      fetchBattleData();
    } catch (err: any) {
      console.error('턴 종료 실패:', err);
    }
  }, [battleId, fetchBattleData]);
  
  // AI 턴 실행
  const handleAITurn = useCallback(async () => {
    try {
      await SammoAPI.TacticalBattle.aiTurn(battleId);
      fetchBattleData();
    } catch (err: any) {
      console.error('AI 턴 실패:', err);
    }
  }, [battleId, fetchBattleData]);
  
  // 전체 시뮬레이션
  const handleSimulate = useCallback(async () => {
    try {
      setLoading(true);
      await SammoAPI.TacticalBattle.simulate(battleId);
      fetchBattleData();
    } catch (err: any) {
      console.error('시뮬레이션 실패:', err);
    } finally {
      setLoading(false);
    }
  }, [battleId, fetchBattleData]);
  
  // 전투 시작
  const handleStartBattle = useCallback(async () => {
    try {
      await SammoAPI.TacticalBattle.startBattle(battleId);
      fetchBattleData();
    } catch (err: any) {
      console.error('전투 시작 실패:', err);
    }
  }, [battleId, fetchBattleData]);
  
  if (loading && !battleData) {
    return (
      <div className={styles.container}>
        <TopBackBar title="전술전투" backUrl={`/${server}/game`} />
        <div className={styles.loading}>전투 데이터 로딩 중...</div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className={styles.container}>
        <TopBackBar title="전술전투" backUrl={`/${server}/game`} />
        <div className={styles.error}>{error}</div>
      </div>
    );
  }
  
  if (!battleData) {
    return (
      <div className={styles.container}>
        <TopBackBar title="전술전투" backUrl={`/${server}/game`} />
        <div className={styles.error}>전투를 찾을 수 없습니다</div>
      </div>
    );
  }
  
  const isMyTurn = playerSide === battleData.currentSide;
  
  return (
    <div className={styles.container}>
      <TopBackBar title="전술전투" backUrl={`/${server}/game`} />
      
      {/* 상단 컨트롤 (관전/테스트용) */}
      <div className={styles.topControls}>
        {battleData.status === 'waiting' && (
          <button onClick={handleStartBattle} className={styles.actionBtn}>
            ▶️ 전투 시작
          </button>
        )}
        {battleData.status === 'ongoing' && (
          <>
            <button onClick={handleAITurn} className={styles.actionBtn}>
              🤖 AI 턴 실행
            </button>
            <button onClick={handleSimulate} className={styles.actionBtn}>
              ⏩ 시뮬레이션
            </button>
          </>
        )}
        {battleData.status === 'finished' && (
          <button onClick={() => router.push(`/${server}/game`)} className={styles.actionBtn}>
            🏠 게임으로 돌아가기
          </button>
        )}
      </div>
      
      {/* 전술전투 맵 */}
      <TacticalBattleMap
        battleData={battleData}
        onMove={handleMove}
        onAttack={handleAttack}
        onWait={handleWait}
        onEndTurn={handleEndTurn}
        playerSide={playerSide ?? undefined}
        isMyTurn={isMyTurn}
      />
      
      {/* 결과 표시 */}
      {battleData.status === 'finished' && battleData.result && (
        <div className={styles.resultPanel}>
          <h3>🏆 전투 결과</h3>
          <div className={styles.resultStats}>
            <div>
              <span>공격측 손실:</span>
              <strong>{battleData.result.attackerCasualties.toLocaleString()}명</strong>
            </div>
            <div>
              <span>방어측 손실:</span>
              <strong>{battleData.result.defenderCasualties.toLocaleString()}명</strong>
            </div>
            <div>
              <span>도시 점령:</span>
              <strong>{battleData.result.cityOccupied ? '성공' : '실패'}</strong>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


