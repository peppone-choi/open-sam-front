'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { SammoAPI } from '@/lib/api/sammo';
import TopBackBar from '@/components/common/TopBackBar';
import BattleMap, { BattleUnit } from '@/components/battle/BattleMap';
import { useToast } from '@/contexts/ToastContext';
import { cn } from '@/lib/utils';
import { BattleModeSwitchToggle } from './components/BattleModeSwitch';
import { MugBattleLayout } from '@/components/battle/MugBattleLayout';

export default function BattleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const serverID = params?.server as string;
  const battleId = params?.battleId as string;
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [battleData, setBattleData] = useState<any>(null);
  const [units, setUnits] = useState<BattleUnit[]>([]);
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'2d' | 'voxel' | 'mug'>('2d');

  // 모드 전환 핸들러
  const handleModeChange = useCallback((mode: '2d' | 'voxel' | 'mug') => {
    if (mode === 'voxel') {
      router.push(`/${serverID}/battle/${battleId}/voxel`);
    } else {
      setViewMode(mode);
    }
  }, [router, serverID, battleId]);

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
      showToast('전투 정보를 불러오는데 실패했습니다.', 'error');
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

  const handleMugAction = useCallback(async (action: string) => {
    if (!battleId || !selectedUnitId) {
      showToast('명령을 내릴 장수를 선택해주세요.', 'info');
      return;
    }

    try {
      // 실제 구현 시 타겟 선택 로직이 필요할 수 있음
      // 여기서는 예시로 제출
      const result = await SammoAPI.SubmitBattleAction({
        battleId,
        generalId: Number(selectedUnitId.replace('unit-', '')), // 실제 ID로 변환 필요
        action: action.toLowerCase(),
      });

      if (result.success) {
        showToast(`${action} 명령이 제출되었습니다.`, 'success');
        loadBattleData(); // 상태 갱신
      } else {
        showToast(result.message || '명령 제출 실패', 'error');
      }
    } catch (err: any) {
      showToast(err.message || '오류 발생', 'error');
    }
  }, [battleId, selectedUnitId, showToast]);

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-4 md:p-6 lg:p-8 font-sans">
      <div className="max-w-[1400px] mx-auto space-y-6">
        <div className="flex items-center justify-between gap-4">
          <TopBackBar title={`전투 #${battleId}`} reloadable onReload={loadBattleData} />

          {/* 모드 전환 버튼 */}
          <BattleModeSwitchToggle
            currentMode={viewMode}
            onModeChange={handleModeChange}
          />
        </div>

        {loading ? (
          <div className="min-h-[50vh] flex items-center justify-center">
            <div className="animate-pulse text-gray-400 font-bold">로딩 중...</div>
          </div>
        ) : viewMode === 'mug' ? (
          <MugBattleLayout
            battleData={{
              ...battleData,
              units: new Map(units.map(u => [u.id, u])),
              actionOrder: units.map(u => u.id),
              activeUnitIndex: units.findIndex(u => u.id === selectedUnitId) >= 0
                ? units.findIndex(u => u.id === selectedUnitId)
                : 0,
              battleLog: battleData?.logs || []
            }}
            onAction={handleMugAction}
            onToggleMode={() => setViewMode('2d')}
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Battle Info & Map */}
            <div className="lg:col-span-8 space-y-6">
              {/* Battle Info Card */}
              <div className="bg-gray-900/50 backdrop-blur-sm border border-white/5 rounded-xl p-6 shadow-lg flex justify-between items-center">
                <h2 className="text-xl font-bold text-white">{battleData?.name || '전투'}</h2>
                <div className="flex gap-6 text-sm text-gray-400 font-mono">
                  <div>공격: <span className="text-red-400 font-bold">{units.filter((u) => u.type === 'attacker').length}</span></div>
                  <div>수비: <span className="text-blue-400 font-bold">{units.filter((u) => u.type === 'defender').length}</span></div>
                </div>
              </div>

              {/* Map Container */}
              <div className="bg-black/40 border border-white/10 rounded-xl overflow-hidden shadow-2xl flex flex-col items-center p-4">
                <div className="w-full flex justify-between items-center mb-4">
                  <h3 className="text-sm font-bold text-gray-300">40x40 전장</h3>
                  <div className="flex gap-2">
                    <button type="button" className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-white text-xs font-bold rounded border border-white/10 transition-colors">
                      초기화
                    </button>
                    <button type="button" className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded transition-colors shadow-lg shadow-blue-900/20">
                      저장
                    </button>
                  </div>
                </div>
                <div className="border border-white/5 rounded-lg overflow-hidden">
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
              </div>
            </div>

            {/* Right Column: Unit List */}
            <div className="lg:col-span-4">
              <div className="bg-gray-900/50 backdrop-blur-sm border border-white/5 rounded-xl p-4 shadow-lg h-full max-h-[calc(100vh-100px)] overflow-y-auto custom-scrollbar">
                <h3 className="text-sm font-bold text-gray-300 mb-4 px-2 border-b border-white/5 pb-2">참전 유닛 목록</h3>
                <div className="grid grid-cols-1 gap-2">
                  {units.map((unit) => (
                    <div
                      key={unit.id}
                      className={cn(
                        "p-3 rounded-lg border cursor-pointer transition-all duration-200 hover:bg-white/5",
                        selectedUnitId === unit.id
                          ? "bg-blue-900/20 border-blue-500/50"
                          : "bg-black/20 border-white/5",
                        unit.type === 'attacker' ? "hover:border-red-500/30" : "hover:border-blue-500/30"
                      )}
                      onClick={() => handleUnitClick(unit)}
                    >
                      <div className="flex justify-between items-center mb-1">
                        <div className={cn("font-bold", unit.type === 'attacker' ? "text-red-400" : "text-blue-400")}>
                          {unit.name}
                        </div>
                        <div className="text-[10px] text-gray-500 font-mono">
                          ({unit.x}, {unit.y})
                        </div>
                      </div>
                      {unit.crew !== undefined && (
                        <div className="text-xs text-gray-400">
                          병력: <span className="text-gray-200">{unit.crew.toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}




