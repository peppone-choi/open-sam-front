'use client';
 
import React, { useMemo, useState } from 'react';

import { useParams, useSearchParams } from 'next/navigation';
import TopBackBar from '@/components/common/TopBackBar';
import { useBattleSocket, type BattleUnit, type BattleState } from '@/hooks/useBattleSocket';
import ThreeBattleMap, { type ThreeBattleUnit } from '@/components/battle/ThreeBattleMap';
import styles from '../page.module.css';

function mapBattleStateToThreeUnits(state: BattleState | null, myGeneralId: number | null): ThreeBattleUnit[] {
  if (!state) return [];

  const mapWidth = state.map.width || 800;
  const mapHeight = state.map.height || 600;

  const convertSide = (units: BattleUnit[], isAttacker: boolean): ThreeBattleUnit[] => {
    return units.map((u) => {
      const isSelf = myGeneralId !== null && u.generalId === myGeneralId;
      const relation: 'self' | 'ally' | 'neutral' | 'enemy' = isSelf ? 'self' : 'enemy';
      const color = isSelf ? 0x3b82f6 : isAttacker ? 0x60a5fa : 0xef4444;

      return {
        id: `${isAttacker ? 'A' : 'D'}-${u.generalId}`,
        generalId: u.generalId,
        x: u.position.x,
        y: u.position.y,
        color,
        troops: u.troops,
        maxTroops: u.maxTroops,
        relation,
      };
    });
  };

  return [
    ...convertSide(state.attackerUnits, true),
    ...convertSide(state.defenderUnits, false),
  ];
}

export default function ThreeBattlePage() {
  const params = useParams();
  const searchParams = useSearchParams();

  const battleId = params?.battleId as string;
  const generalIdParam = searchParams?.get('generalId');
  const myGeneralId = generalIdParam ? Number(generalIdParam) : null;

  const {
    battleState,
    isConnected,
    isJoined,
    moveUnit,
    attackUnit,
    fireVolley,
  } = useBattleSocket({ battleId, generalId: myGeneralId ?? undefined, token: undefined });

  const mapWidth = battleState?.map.width || 800;
  const mapHeight = battleState?.map.height || 600;

  const [lastTargetId, setLastTargetId] = useState<number | null>(null);
 
  const units = useMemo(() => mapBattleStateToThreeUnits(battleState, myGeneralId), [battleState, myGeneralId]);


  return (
    <div className={styles.container}>
      <TopBackBar title={`전술 전투 (three.js) - ${battleId}`} />
      <div className={styles.content}>
        <div style={{ marginBottom: '0.75rem', fontSize: '0.85rem', color: '#9ca3af' }}>
          <div>Socket 연결: {isConnected ? '연결됨' : '연결 안 됨'}</div>
          <div>전투 참가: {isJoined ? '참가 중' : '미참가'}</div>
          <div>유닛 수: {units.length}</div>
          <div>내 장수 ID: {myGeneralId ?? '쿼리 ?generalId= 로 지정 필요'}</div>
        </div>

        {!battleState && (
          <div style={{ color: '#9ca3af', fontSize: '0.85rem', marginBottom: '0.75rem' }}>
            전투 상태를 불러오는 중입니다...
          </div>
        )}

        {battleState && (
          <>
            <div style={{ marginBottom: '0.5rem', display: 'flex', gap: '0.5rem' }}>
              <button
                disabled={myGeneralId === null || lastTargetId === null}
                onClick={() => {
                  if (myGeneralId !== null && lastTargetId !== null) {
                    fireVolley(myGeneralId, lastTargetId);
                  }
                }}
              >
                일제 사격 (Volley)
              </button>
            </div>
            <ThreeBattleMap
              width={960}
              height={640}
              mapWidth={mapWidth}
              mapHeight={mapHeight}
              units={units}
              myGeneralId={myGeneralId}
              onMoveRequest={(pos) => {
                if (myGeneralId !== null) {
                  moveUnit(myGeneralId, pos);
                }
              }}
              onAttackRequest={(targetGeneralId) => {
                if (myGeneralId !== null) {
                  setLastTargetId(targetGeneralId);
                  attackUnit(myGeneralId, targetGeneralId);
                }
              }}
            />
          </>
        )}
      </div>
    </div>
  );
}
