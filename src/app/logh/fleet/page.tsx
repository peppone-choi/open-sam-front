'use client';

import { useState, useEffect } from 'react';
import TopBackBar from '@/components/common/TopBackBar';
import { cn } from '@/lib/utils';

interface ShipClass {
  id: string;
  name: string;
  type: 'battleship' | 'cruiser' | 'destroyer' | 'carrier';
  attack: number;
  defense: number;
  mobility: number;
  cost: number;
}

const SHIP_CLASSES: ShipClass[] = [
  { id: 'std_battleship', name: '표준 전함', type: 'battleship', attack: 100, defense: 80, mobility: 40, cost: 1000 },
  { id: 'fast_cruiser', name: '고속 순양함', type: 'cruiser', attack: 60, defense: 50, mobility: 80, cost: 600 },
  { id: 'destroyer', name: '구축함', type: 'destroyer', attack: 40, defense: 30, mobility: 90, cost: 300 },
  { id: 'carrier', name: '우주모함', type: 'carrier', attack: 150, defense: 60, mobility: 30, cost: 2000 },
];

const SHIP_TYPE_LABELS: Record<ShipClass['type'], string> = {
  battleship: '전함',
  cruiser: '순양함',
  destroyer: '구축함',
  carrier: '항모',
};

interface FleetUnit {
  id: string;
  shipClassId: string;
  count: number;
  experience: number;
  morale: number;
}

export default function LoghFleetPage() {
  const [activeTab, setActiveTab] = useState<'status' | 'formation' | 'ships'>('status');
  const [fleetUnits, setFleetUnits] = useState<FleetUnit[]>([
    { id: 'u1', shipClassId: 'std_battleship', count: 5000, experience: 80, morale: 95 },
    { id: 'u2', shipClassId: 'fast_cruiser', count: 3000, experience: 75, morale: 90 },
    { id: 'u3', shipClassId: 'destroyer', count: 8000, experience: 60, morale: 85 },
  ]);

  const getShipClass = (id: string) => SHIP_CLASSES.find(c => c.id === id);

  const totalShips = fleetUnits.reduce((sum, unit) => sum + unit.count, 0);
  const totalCombatPower = fleetUnits.reduce((sum, unit) => {
    const ship = getShipClass(unit.shipClassId);
    return sum + (ship ? (ship.attack + ship.defense) * unit.count * (unit.experience / 100) : 0);
  }, 0);

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 font-sans p-4 md:p-6 lg:p-8">
      <TopBackBar title="함대 관리" backUrl="/logh/game" />
      
      <div className="max-w-6xl mx-auto space-y-6">
        {/* 함대 헤더 */}
        <div className="bg-gray-900/50 backdrop-blur-sm border border-white/5 rounded-xl p-6 shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              제 13 함대
              <span className="text-sm font-normal px-2 py-1 bg-blue-900/50 text-blue-300 rounded border border-blue-500/30">
                자유혹성동맹
              </span>
            </h1>
            <div className="text-gray-400 mt-2 flex gap-4">
              <span>사령관: <span className="text-white font-bold">양 웬리</span></span>
              <span>기함: <span className="text-yellow-400 font-bold">휴페리온</span></span>
            </div>
          </div>
          
          <div className="flex gap-4 text-center">
            <div className="bg-black/40 px-4 py-2 rounded-lg border border-white/5">
              <div className="text-xs text-gray-500 uppercase">총 함선</div>
              <div className="text-xl font-mono font-bold text-blue-400">{totalShips.toLocaleString()}</div>
            </div>
            <div className="bg-black/40 px-4 py-2 rounded-lg border border-white/5">
              <div className="text-xs text-gray-500 uppercase">전투력</div>
              <div className="text-xl font-mono font-bold text-red-400">{Math.floor(totalCombatPower).toLocaleString()}</div>
            </div>
          </div>
        </div>

        {/* 탭 */}
        <div className="flex border-b border-white/10">
          {[
            { id: 'status', label: '함대 현황' },
            { id: 'formation', label: '진형 설정' },
            { id: 'ships', label: '함선 건조/편성' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "px-6 py-3 text-sm font-bold transition-all border-b-2",
                activeTab === tab.id 
                  ? "border-blue-500 text-blue-400 bg-blue-500/10" 
                  : "border-transparent text-gray-400 hover:text-gray-200 hover:bg-white/5"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* 콘텐츠 영역 */}
        <div className="bg-gray-900/50 backdrop-blur-sm border border-white/5 rounded-b-xl p-6 min-h-[500px]">
          {activeTab === 'status' && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-white mb-4">편성된 함선 목록</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {fleetUnits.map((unit) => {
                  const ship = getShipClass(unit.shipClassId);
                  return (
                    <div key={unit.id} className="bg-black/40 border border-white/10 rounded-xl p-4 hover:border-blue-500/30 transition-colors">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <div className="font-bold text-lg text-white">{ship?.name}</div>
                          <div className="text-xs text-gray-500 uppercase">{ship ? SHIP_TYPE_LABELS[ship.type] : ''}</div>
                        </div>
                        <div className="text-2xl font-bold text-blue-400 font-mono">
                          {unit.count.toLocaleString()}
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">숙련도</span>
                          <div className="flex items-center gap-2">
                            <div className="w-20 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                              <div className="h-full bg-yellow-500" style={{ width: `${unit.experience}%` }}></div>
                            </div>
                            <span className="text-yellow-500 font-mono">{unit.experience}</span>
                          </div>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">사기</span>
                          <div className="flex items-center gap-2">
                            <div className="w-20 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                              <div className="h-full bg-green-500" style={{ width: `${unit.morale}%` }}></div>
                            </div>
                            <span className="text-green-500 font-mono">{unit.morale}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'formation' && (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 py-20">
              <div className="w-64 h-64 border-2 border-dashed border-gray-700 rounded-full flex items-center justify-center mb-4">
                <span className="text-4xl">💠</span>
              </div>
              <p className="text-lg">진형 편집 기능 준비 중</p>
            </div>
          )}

          {activeTab === 'ships' && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-white mb-4">건조 가능한 함선</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {SHIP_CLASSES.map((ship) => (
                  <div key={ship.id} className="bg-black/40 border border-white/10 rounded-xl p-4 flex justify-between items-center">
                    <div>
                      <div className="font-bold text-white">{ship.name}</div>
                      <div className="text-sm text-gray-400 mt-1 space-x-3">
                        <span>공격 {ship.attack}</span>
                        <span>방어 {ship.defense}</span>
                        <span>기동 {ship.mobility}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-yellow-500 font-mono font-bold">{ship.cost.toLocaleString()} G</div>
                      <button className="mt-2 px-4 py-1.5 bg-blue-600/80 hover:bg-blue-600 text-white text-sm rounded transition-colors">
                        건조
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
