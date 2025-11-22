'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { SammoAPI } from '@/lib/api/sammo';
import TopBackBar from '@/components/common/TopBackBar';
import IsoTacticalBattleMap from '@/components/battle/IsoTacticalBattleMap';
import { BattleUnit } from '@/components/battle/BattleMap';
import { cn } from '@/lib/utils';

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
    if (selectedUnitId) {
      setUnits((prev) =>
        prev.map((unit) =>
          unit.id === selectedUnitId ? { ...unit, x, y } : unit,
        ),
      );
    } else {
      console.log('Cell clicked:', x, y);
    }
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
    <div className="min-h-screen bg-gray-950 text-gray-100 p-4 md:p-6 lg:p-8 font-sans">
      <div className="max-w-[1600px] mx-auto space-y-6">
        <TopBackBar title="전투 시뮬레이터" />
        
        {loading ? (
          <div className="min-h-[50vh] flex items-center justify-center">
             <div className="animate-pulse text-gray-400 font-bold">로딩 중...</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Settings & Unit List */}
            <div className="lg:col-span-3 space-y-6">
               {/* Global Settings */}
               <div className="bg-gray-900/50 backdrop-blur-sm border border-white/5 rounded-xl p-5 shadow-lg">
                  <h2 className="text-sm font-bold text-gray-300 mb-4 border-b border-white/5 pb-2">전역 설정</h2>
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-xs text-gray-500 uppercase font-bold">연도</label>
                      <input type="number" className="w-full bg-black/40 border border-white/10 rounded px-3 py-2 text-sm focus:border-blue-500/50 outline-none transition-colors" defaultValue={200} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-gray-500 uppercase font-bold">월</label>
                      <input type="number" className="w-full bg-black/40 border border-white/10 rounded px-3 py-2 text-sm focus:border-blue-500/50 outline-none transition-colors" defaultValue={1} min={1} max={12} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-gray-500 uppercase font-bold">시드</label>
                      <input type="text" className="w-full bg-black/40 border border-white/10 rounded px-3 py-2 text-sm focus:border-blue-500/50 outline-none transition-colors" placeholder="랜덤" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-gray-500 uppercase font-bold">반복 횟수</label>
                      <select className="w-full bg-black/40 border border-white/10 rounded px-3 py-2 text-sm focus:border-blue-500/50 outline-none transition-colors appearance-none">
                        <option value={1}>1회 (로그 표기)</option>
                        <option value={1000}>1000회 (요약 표기)</option>
                      </select>
                    </div>
                  </div>
                  <button 
                    type="button" 
                    onClick={handleSimulate} 
                    className="w-full mt-6 py-2.5 bg-red-600 hover:bg-red-500 text-white text-sm font-bold rounded-lg shadow-lg shadow-red-900/20 transition-colors"
                  >
                    시뮬레이션 실행
                  </button>
               </div>

                {/* 유닛 목록 */}

               <div className="bg-gray-900/50 backdrop-blur-sm border border-white/5 rounded-xl p-5 shadow-lg max-h-[600px] overflow-y-auto custom-scrollbar">
                  <h3 className="text-sm font-bold text-gray-300 mb-4 border-b border-white/5 pb-2">유닛 목록</h3>
                  <div className="space-y-2">
                    {units.map((unit) => (
                      <div
                        key={unit.id}
                        className={cn(
                           "p-3 rounded-lg border cursor-pointer transition-all duration-200 hover:bg-white/5",
                           selectedUnitId === unit.id 
                              ? "bg-blue-900/20 border-blue-500/50" 
                              : "bg-black/20 border-white/5",
                           unit.type === 'attacker' ? "border-l-2 border-l-red-500" : "border-l-2 border-l-blue-500"
                        )}
                        onClick={() => handleUnitClick(unit)}
                      >
                        <div className="font-bold text-sm text-white mb-1">{unit.name}</div>
                        <div className="text-xs text-gray-400 font-mono">
                          위치: ({unit.x}, {unit.y}) | 병력: {unit.crew?.toLocaleString() || 0}
                        </div>
                      </div>
                    ))}
                  </div>
               </div>
            </div>

             {/* 우측 컬럼: 전투 지도 */}
             <div className="lg:col-span-9">
                <div className="bg-black/60 border border-white/10 rounded-xl overflow-hidden shadow-2xl flex flex-col items-center p-4 h-[800px]">
                   <div className="w-full flex justify-between items-center mb-4 px-2">
                     <h2 className="text-lg font-bold text-white">전술 전투맵 (등각)</h2>
                     <div className="text-xs text-gray-500">40x40 등각 뷰</div>
                   </div>

                  <div className="w-full h-full border border-white/5 rounded-lg overflow-hidden bg-[#1a1a1a] relative">
                    <IsoTacticalBattleMap
                      width={40}
                      height={40}
                      units={units}
                      selectedUnitId={selectedUnitId}
                      onUnitClick={handleUnitClick}
                      onCellClick={handleCellClick}
                    />
                  </div>
               </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

