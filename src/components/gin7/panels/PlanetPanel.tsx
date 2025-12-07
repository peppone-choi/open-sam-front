'use client';

import { useMemo } from 'react';
import { useGin7Store } from '@/stores/gin7Store';
import { useGin7MapStore } from '@/stores/gin7MapStore';
import {
  GlobeAltIcon,
  UserGroupIcon,
  BuildingOffice2Icon,
  CubeIcon,
} from '@heroicons/react/24/outline';

interface SystemInfo {
  systemId: string;
  name: string;
  faction: string;
  grid: { x: number; y: number };
  strategicValue?: string;
  territoryType?: string;
}

export default function PlanetPanel() {
  const strategySnapshot = useGin7Store((state) => state.strategySnapshot);
  const strategic = useGin7Store((state) => state.strategic);
  const selection = useGin7MapStore((state) => state.selection);
  const panTo = useGin7MapStore((state) => state.panTo);
  const setSelection = useGin7MapStore((state) => state.setSelection);

  const starSystems = useMemo(() => {
    return strategySnapshot?.map?.starSystems || [];
  }, [strategySnapshot]);

  const selectedSystem = useMemo(() => {
    if (selection.type === 'system' && selection.coordinates) {
      return starSystems.find(
        (s) => s.grid.x === selection.coordinates!.x && s.grid.y === selection.coordinates!.y
      );
    }
    return null;
  }, [selection, starSystems]);

  const factionColors: Record<string, string> = {
    empire: 'bg-empire-gold/20 text-empire-gold border-empire-gold/30',
    alliance: 'bg-alliance-blue/20 text-alliance-blue border-alliance-blue/30',
    phezzan: 'bg-pink-400/20 text-pink-400 border-pink-400/30',
    neutral: 'bg-white/10 text-foreground-muted border-white/20',
  };

  const handleSystemClick = (system: SystemInfo) => {
    setSelection({ type: 'system', id: system.systemId, coordinates: system.grid });
    panTo(system.grid.x - 5, system.grid.y - 5);
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-space-panel/50 backdrop-blur-sm overflow-hidden">
      {/* 헤더 */}
      <div className="p-4 border-b border-white/5">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <GlobeAltIcon className="w-5 h-5" />
            성계 정보
          </h3>
          <span className="text-xs text-foreground-muted">{starSystems.length}개</span>
        </div>
      </div>

      {/* 선택된 성계 상세 */}
      {selectedSystem ? (
        <div className="p-4 bg-gradient-to-b from-primary/5 to-transparent border-b border-white/5">
          <div className="flex items-start gap-3">
            <div className={`p-2 rounded-xl border ${factionColors[selectedSystem.faction] || factionColors.neutral}`}>
              <GlobeAltIcon className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h4 className="text-lg font-bold text-foreground">{selectedSystem.name}</h4>
              <p className="text-xs text-foreground-muted">
                좌표: ({selectedSystem.grid.x}, {selectedSystem.grid.y})
              </p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-black/30 border border-white/5">
              <div className="flex items-center gap-2 text-foreground-muted mb-1">
                <UserGroupIcon className="w-4 h-4" />
                <span className="text-xs">진영</span>
              </div>
              <p className="text-sm font-semibold text-foreground capitalize">
                {selectedSystem.faction || '중립'}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-black/30 border border-white/5">
              <div className="flex items-center gap-2 text-foreground-muted mb-1">
                <BuildingOffice2Icon className="w-4 h-4" />
                <span className="text-xs">전략 가치</span>
              </div>
              <p className="text-sm font-semibold text-foreground">
                {selectedSystem.strategicValue || '일반'}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-black/30 border border-white/5 col-span-2">
              <div className="flex items-center gap-2 text-foreground-muted mb-1">
                <CubeIcon className="w-4 h-4" />
                <span className="text-xs">영토 유형</span>
              </div>
              <p className="text-sm font-semibold text-foreground">
                {selectedSystem.territoryType || '—'}
              </p>
            </div>
          </div>

          <div className="mt-4 flex gap-2">
            <button className="flex-1 px-3 py-2 rounded-lg bg-primary/20 text-primary text-xs hover:bg-primary/30 transition-colors">
              함대 파견
            </button>
            <button className="flex-1 px-3 py-2 rounded-lg bg-white/5 text-foreground-muted text-xs hover:bg-white/10 transition-colors">
              상세 정보
            </button>
          </div>
        </div>
      ) : (
        <div className="p-4 text-center text-foreground-muted text-sm">
          지도에서 성계를 선택하세요
        </div>
      )}

      {/* 성계 목록 */}
      <div className="p-4 max-h-[300px] overflow-y-auto scrollbar-thin scrollbar-thumb-white/10">
        <h4 className="text-xs uppercase tracking-wide text-foreground-muted mb-3">전체 성계</h4>
        <div className="space-y-2">
          {starSystems.slice(0, 10).map((system) => (
            <button
              key={system.systemId}
              onClick={() => handleSystemClick(system)}
              className={`w-full text-left p-2 rounded-lg border transition-all ${
                selection.id === system.systemId
                  ? 'border-primary/50 bg-primary/10'
                  : 'border-white/5 bg-black/20 hover:bg-black/40'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm text-foreground">{system.name}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${factionColors[system.faction] || factionColors.neutral}`}>
                  {system.faction || '중립'}
                </span>
              </div>
              <p className="text-xs text-foreground-dim mt-1">
                ({system.grid.x}, {system.grid.y})
              </p>
            </button>
          ))}
          {starSystems.length > 10 && (
            <p className="text-xs text-foreground-dim text-center py-2">
              +{starSystems.length - 10}개 더 있음
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

