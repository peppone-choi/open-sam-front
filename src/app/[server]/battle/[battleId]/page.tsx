'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { SammoAPI } from '@/lib/api/sammo';
import TopBackBar from '@/components/common/TopBackBar';
import BattleMap, { BattleUnit } from '@/components/battle/BattleMap';
import styles from './page.module.css';

export default function BattleDetailPage() {
  const params = useParams();
  const serverID = params?.server as string;
  const battleId = params?.battleId as string;

  const [loading, setLoading] = useState(true);
  const [battleData, setBattleData] = useState<any>(null);
  const [units, setUnits] = useState<BattleUnit[]>([]);
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);

  useEffect(() => {
    loadBattleData();
  }, [serverID, battleId]);

  async function loadBattleData() {
    if (!battleId) return;

    try {
      setLoading(true);
      const result = await SammoAPI.GetBattleDetail({
        battleID: Number(battleId),
      });

      if (result.result && result.battle) {
        setBattleData(result.battle);
        // 전투 유닛 데이터 변환
        const battleUnits: BattleUnit[] = (result.battle.units || []).map((unit: any) => ({
          id: unit.id || `unit-${unit.no}`,
          x: unit.x || 0,
          y: unit.y || 0,
          name: unit.name || '유닛',
          type: unit.type === 'attacker' ? 'attacker' : 'defender',
          crew: unit.crew || 0,
        }));
        setUnits(battleUnits);
      }
    } catch (err) {
      console.error(err);
      alert('전투 정보를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }

  function handleUnitClick(unit: BattleUnit) {
    setSelectedUnitId(unit.id);
  }

  function handleUnitMove(unitId: string, x: number, y: number) {
    setUnits((prev) =>
      prev.map((unit) =>
        unit.id === unitId ? { ...unit, x, y } : unit
      )
    );
  }

  function handleCellClick(x: number, y: number) {
    console.log('Cell clicked:', x, y);
  }

  return (
    <div className={styles.container}>
      <TopBackBar title={`전투 #${battleId}`} reloadable onReload={loadBattleData} />
      {loading ? (
        <div className="center" style={{ padding: '2rem' }}>로딩 중...</div>
      ) : (
        <div className={styles.content}>
          <div className={styles.battleInfo}>
            <h2>{battleData?.name || '전투'}</h2>
            <div className={styles.battleStats}>
              <div>공격 유닛: {units.filter((u) => u.type === 'attacker').length}</div>
              <div>수비 유닛: {units.filter((u) => u.type === 'defender').length}</div>
            </div>
          </div>

          <div className={styles.mapContainer}>
            <div className={styles.mapHeader}>
              <h3>40x40 전투 맵</h3>
              <div className={styles.mapControls}>
                <button type="button" className={styles.button}>
                  초기화
                </button>
                <button type="button" className={styles.button}>
                  저장
                </button>
              </div>
            </div>
            <BattleMap
              width={40}
              height={40}
              units={units}
              onUnitClick={handleUnitClick}
              onUnitMove={handleUnitMove}
              onCellClick={handleCellClick}
              selectedUnitId={selectedUnitId}
              editable={true}
            />
          </div>

          <div className={styles.unitList}>
            <h3>유닛 목록</h3>
            <div className={styles.unitListContent}>
              {units.map((unit) => (
                <div
                  key={unit.id}
                  className={`${styles.unitItem} ${selectedUnitId === unit.id ? styles.selected : ''}`}
                  onClick={() => handleUnitClick(unit)}
                >
                  <div className={styles.unitName}>{unit.name}</div>
                  <div className={styles.unitPos}>
                    위치: ({unit.x}, {unit.y})
                  </div>
                  {unit.crew !== undefined && (
                    <div className={styles.unitCrew}>병력: {unit.crew.toLocaleString()}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}




