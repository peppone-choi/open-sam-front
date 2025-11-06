'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { SammoAPI } from '@/lib/api/sammo';
import TopBackBar from '@/components/common/TopBackBar';
import BattleMap, { BattleUnit } from '@/components/battle/BattleMap';
import styles from './page.module.css';

export default function BattleSimulatorPage() {
  const params = useParams();
  const serverID = params?.server as string;

  const [loading, setLoading] = useState(true);
  const [simulatorData, setSimulatorData] = useState<any>(null);
  const [battleConfig, setBattleConfig] = useState<any>({});
  const [units, setUnits] = useState<BattleUnit[]>([]);
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);

  useEffect(() => {
    loadSimulatorData();
  }, [serverID]);

  async function loadSimulatorData() {
    try {
      setLoading(true);
      // API 호출 로직 필요
      setSimulatorData(null);
      setBattleConfig({});
      // 임시 유닛 데이터
      setUnits([
        {
          id: 'attacker-1',
          x: 10,
          y: 20,
          name: '조조',
          type: 'attacker',
          crew: 5000,
          crewtype: 1403,
          leadership: 95,
          force: 72,
          intellect: 98,
        },
        {
          id: 'defender-1',
          x: 30,
          y: 20,
          name: '여포',
          type: 'defender',
          crew: 3000,
          crewtype: 1200,
          leadership: 24,
          force: 100,
          intellect: 18,
        },
        {
          id: 'attacker-2',
          x: 15,
          y: 25,
          name: '관우',
          type: 'attacker',
          crew: 4000,
          crewtype: 1100,
          leadership: 90,
          force: 98,
          intellect: 75,
        },
        {
          id: 'defender-2',
          x: 25,
          y: 15,
          name: '장합',
          type: 'defender',
          crew: 3500,
          crewtype: 1300,
          leadership: 80,
          force: 70,
          intellect: 65,
        },
        {
          id: 'attacker-3',
          x: 8,
          y: 18,
          name: '제갈량',
          type: 'attacker',
          crew: 1000,
          crewtype: 1701,
          leadership: 100,
          force: 20,
          intellect: 100,
        },
      ]);
    } catch (err) {
      console.error(err);
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

  function handleCombat(attackerId: string, defenderId: string) {
    const { calculateCombat, updateUnitsAfterCombat } = require('@/utils/battleUtils');
    
    const attacker = units.find(u => u.id === attackerId);
    const defender = units.find(u => u.id === defenderId);
    
    if (!attacker || !defender) return;
    
    const result = calculateCombat(attacker, defender);
    
    setTimeout(() => {
      const updatedUnits = updateUnitsAfterCombat(units, attackerId, defenderId, result);
      setUnits(updatedUnits);
      
      if (result.defenderDied) {
        console.log(`${defender.name} 전멸!`);
      }
      if (result.isCritical) {
        console.log('크리티컬 히트!');
      }
      if (result.isEvaded) {
        console.log('회피 성공!');
      }
    }, 2800);
  }

  async function handleSimulate() {
    try {
      const result = await SammoAPI.SimulateBattle({
        year: battleConfig.year || 200,
        month: battleConfig.month || 1,
        seed: battleConfig.seed || undefined,
        repeatCount: battleConfig.repeatCount || 1,
        units: units.map(u => ({ ...u, crew: u.crew || 0 })),
      });

      if (result.result) {
        setSimulatorData(result.simulation);
        alert('시뮬레이션이 완료되었습니다.');
      } else {
        alert(result.reason || '시뮬레이션에 실패했습니다.');
      }
    } catch (err) {
      console.error(err);
      alert('시뮬레이션에 실패했습니다.');
    }
  }

  return (
    <div className={styles.container}>
      <TopBackBar title="전투 시뮬레이터" />
      {loading ? (
        <div className="center" style={{ padding: '2rem' }}>로딩 중...</div>
      ) : (
        <div className={styles.content}>
          <div className={styles.globalSettings}>
            <h2>전역 설정</h2>
            <div className={styles.settingsForm}>
              <div className={styles.formRow}>
                <label>연도:</label>
                <input type="number" className={styles.input} defaultValue={200} />
              </div>
              <div className={styles.formRow}>
                <label>월:</label>
                <input type="number" className={styles.input} defaultValue={1} min={1} max={12} />
              </div>
              <div className={styles.formRow}>
                <label>시드:</label>
                <input type="text" className={styles.input} placeholder="랜덤" />
              </div>
              <div className={styles.formRow}>
                <label>반복 횟수:</label>
                <select className={styles.select}>
                  <option value={1}>1회 (로그 표기)</option>
                  <option value={1000}>1000회 (요약 표기)</option>
                </select>
              </div>
            </div>
          </div>

          <div className={styles.battleMapSection}>
            <h2>40x40 전투 맵</h2>
            <div className={styles.mapWrapper}>
              <BattleMap
                width={40}
                height={40}
                units={units}
                onUnitClick={handleUnitClick}
                onUnitMove={handleUnitMove}
                onCellClick={handleCellClick}
                onCombat={handleCombat}
                selectedUnitId={selectedUnitId}
                editable={true}
                showCutscenes={true}
              />
            </div>
          </div>

          <div className={styles.unitControls}>
            <h3>유닛 목록</h3>
            <div className={styles.unitList}>
              {units.map((unit) => (
                <div
                  key={unit.id}
                  className={`${styles.unitItem} ${selectedUnitId === unit.id ? styles.selected : ''}`}
                  onClick={() => handleUnitClick(unit)}
                >
                  <div className={styles.unitName}>{unit.name}</div>
                  <div className={styles.unitInfo}>
                    위치: ({unit.x}, {unit.y}) | 병력: {unit.crew?.toLocaleString() || 0}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button type="button" onClick={handleSimulate} className={styles.simulateButton}>
            시뮬레이션 실행
          </button>
        </div>
      )}
    </div>
  );
}

