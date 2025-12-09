'use client';

import React, { useState, useCallback } from 'react';
import VoxelFleetBattle from '@/components/voxel/VoxelFleetBattle';
import { VoxelFleet, VoxelFleetUnit, FormationType, SHIPS_PER_UNIT } from '@/lib/voxel/VoxelFleetData';

// 샘플 함대 생성
function createSampleFleets(): VoxelFleet[] {
  // 제국군 함대 - 라인하르트 함대
  const empireFleet: VoxelFleet = {
    fleetId: 'empire-1',
    name: '제국군 제1함대',
    faction: 'empire',
    commanderName: '라인하르트 폰 로엔그람',
    units: [
      // 기함 브륀힐트
      {
        unitId: 'e1-flagship',
        shipType: 'flagship',
        shipCount: 1, // 기함 1척
        health: 100,
        position: { x: 0, y: 0, z: 0 },
      },
      // 전함 20유닛 = 6,000척
      ...Array.from({ length: 20 }, (_, i) => ({
        unitId: `e1-bb-${i}`,
        shipType: 'battleship',
        shipCount: SHIPS_PER_UNIT,
        health: 100,
        position: { x: (i % 5 - 2) * 15, y: 0, z: Math.floor(i / 5) * 10 },
      })),
      // 순양함 15유닛 = 4,500척
      ...Array.from({ length: 15 }, (_, i) => ({
        unitId: `e1-ca-${i}`,
        shipType: 'cruiser',
        shipCount: SHIPS_PER_UNIT,
        health: 100,
        position: { x: (i % 5 - 2) * 12, y: 0, z: 50 + Math.floor(i / 5) * 8 },
      })),
      // 구축함 10유닛 = 3,000척
      ...Array.from({ length: 10 }, (_, i) => ({
        unitId: `e1-dd-${i}`,
        shipType: 'destroyer',
        shipCount: SHIPS_PER_UNIT,
        health: 100,
        position: { x: (i % 5 - 2) * 10, y: 0, z: 80 + Math.floor(i / 5) * 6 },
      })),
    ],
    totalShips: 1 + 20 * 300 + 15 * 300 + 10 * 300, // 13,501척
    position: { x: -80, y: 0, z: 0 },
    velocity: { x: 0, y: 0, z: 0 },
    heading: 0,
    formation: 'wedge',
    isEngaged: false,
  };

  // 동맹군 함대 - 양 웬리 함대
  const allianceFleet: VoxelFleet = {
    fleetId: 'alliance-1',
    name: '동맹군 제13함대',
    faction: 'alliance',
    commanderName: '양 웬리',
    units: [
      // 기함 히페리온
      {
        unitId: 'a1-flagship',
        shipType: 'flagship',
        shipCount: 1,
        health: 100,
        position: { x: 0, y: 0, z: 0 },
      },
      // 전함 15유닛 = 4,500척
      ...Array.from({ length: 15 }, (_, i) => ({
        unitId: `a1-bb-${i}`,
        shipType: 'battleship',
        shipCount: SHIPS_PER_UNIT,
        health: 100,
        position: { x: (i % 5 - 2) * 15, y: 0, z: -Math.floor(i / 5) * 10 },
      })),
      // 순양함 20유닛 = 6,000척
      ...Array.from({ length: 20 }, (_, i) => ({
        unitId: `a1-ca-${i}`,
        shipType: 'cruiser',
        shipCount: SHIPS_PER_UNIT,
        health: 100,
        position: { x: (i % 5 - 2) * 12, y: 0, z: -50 - Math.floor(i / 5) * 8 },
      })),
      // 구축함 15유닛 = 4,500척
      ...Array.from({ length: 15 }, (_, i) => ({
        unitId: `a1-dd-${i}`,
        shipType: 'destroyer',
        shipCount: SHIPS_PER_UNIT,
        health: 100,
        position: { x: (i % 5 - 2) * 10, y: 0, z: -90 - Math.floor(i / 5) * 6 },
      })),
    ],
    totalShips: 1 + 15 * 300 + 20 * 300 + 15 * 300, // 15,001척
    position: { x: 80, y: 0, z: 0 },
    velocity: { x: 0, y: 0, z: 0 },
    heading: Math.PI, // 제국군 방향으로
    formation: 'crane',
    isEngaged: false,
  };

  return [empireFleet, allianceFleet];
}

export default function VoxelBattlePage() {
  const [fleets, setFleets] = useState<VoxelFleet[]>(createSampleFleets);
  const [selectedFleetId, setSelectedFleetId] = useState<string | null>(null);

  const handleFleetSelect = useCallback((fleetId: string) => {
    setSelectedFleetId(fleetId);
  }, []);

  const handleFormationChange = useCallback((fleetId: string, formation: FormationType) => {
    setFleets(prev => prev.map(fleet => 
      fleet.fleetId === fleetId ? { ...fleet, formation } : fleet
    ));
  }, []);

  const handleAdvance = useCallback((fleetId: string) => {
    setFleets(prev => prev.map(fleet => {
      if (fleet.fleetId !== fleetId) return fleet;
      
      const moveX = Math.cos(fleet.heading) * 10;
      const moveZ = -Math.sin(fleet.heading) * 10;
      
      return {
        ...fleet,
        position: {
          x: fleet.position.x + moveX,
          y: fleet.position.y,
          z: fleet.position.z + moveZ,
        },
      };
    }));
  }, []);

  const selectedFleet = fleets.find(f => f.fleetId === selectedFleetId);

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <VoxelFleetBattle
        width={typeof window !== 'undefined' ? window.innerWidth : 1200}
        height={typeof window !== 'undefined' ? window.innerHeight - 120 : 700}
        fleets={fleets}
        onFleetSelect={handleFleetSelect}
      />

      {/* 하단 컨트롤 패널 */}
      <div className="fixed bottom-0 left-0 right-0 bg-gray-800/90 border-t border-gray-700 p-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          {/* 선택된 함대 정보 */}
          {selectedFleet ? (
            <div className="flex items-center gap-6">
              <div>
                <div className="text-lg font-bold">{selectedFleet.name}</div>
                <div className="text-sm text-gray-400">
                  {selectedFleet.commanderName} | {selectedFleet.totalShips.toLocaleString()}척
                </div>
              </div>

              {/* 진형 변경 */}
              <div className="flex gap-2">
                <span className="text-gray-400 self-center">진형:</span>
                {(['line', 'wedge', 'sphere', 'spindle', 'crane', 'scattered'] as FormationType[]).map(f => (
                  <button
                    key={f}
                    onClick={() => handleFormationChange(selectedFleet.fleetId, f)}
                    className={`px-3 py-1 rounded text-sm ${
                      selectedFleet.formation === f
                        ? 'bg-blue-600'
                        : 'bg-gray-700 hover:bg-gray-600'
                    }`}
                  >
                    {f === 'line' && '횡대'}
                    {f === 'wedge' && '쐐기'}
                    {f === 'sphere' && '구형'}
                    {f === 'spindle' && '방추'}
                    {f === 'crane' && '학익'}
                    {f === 'scattered' && '산개'}
                  </button>
                ))}
              </div>

              {/* 이동 */}
              <button
                onClick={() => handleAdvance(selectedFleet.fleetId)}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded"
              >
                전진
              </button>
            </div>
          ) : (
            <div className="text-gray-400">함대를 선택하세요</div>
          )}

          {/* 전투 정보 */}
          <div className="text-right text-sm">
            <div className="text-yellow-400">제국군: {fleets.find(f => f.faction === 'empire')?.totalShips.toLocaleString()}척</div>
            <div className="text-blue-400">동맹군: {fleets.find(f => f.faction === 'alliance')?.totalShips.toLocaleString()}척</div>
          </div>
        </div>
      </div>
    </div>
  );
}









