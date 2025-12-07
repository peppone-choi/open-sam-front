'use client';

import { useMemo } from 'react';
import { useGin7Store } from '@/stores/gin7Store';
import { useGin7MapStore } from '@/stores/gin7MapStore';
import {
  RocketLaunchIcon,
  ArrowRightIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

interface FleetItemProps {
  id: string;
  name: string;
  faction: string;
  status: string;
  totalShips: number;
  position: { x: number; y: number };
  isSelected: boolean;
  onClick: () => void;
}

function FleetItem({ id, name, faction, status, totalShips, position, isSelected, onClick }: FleetItemProps) {
  const factionColor = {
    empire: 'border-empire-gold/50 bg-empire-gold/5',
    alliance: 'border-alliance-blue/50 bg-alliance-blue/5',
    phezzan: 'border-pink-400/50 bg-pink-400/5',
  }[faction] || 'border-white/10 bg-white/5';

  const statusIcon = {
    idle: <CheckCircleIcon className="w-4 h-4 text-hud-success" />,
    moving: <ArrowRightIcon className="w-4 h-4 text-alliance-blue animate-pulse" />,
    engaging: <ExclamationTriangleIcon className="w-4 h-4 text-hud-alert animate-pulse" />,
    retreating: <ArrowRightIcon className="w-4 h-4 text-yellow-500 rotate-180" />,
  }[status] || null;

  const statusLabel = {
    idle: '대기',
    moving: '이동 중',
    engaging: '교전 중',
    retreating: '후퇴 중',
  }[status] || status;

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full text-left p-3 rounded-xl border transition-all',
        factionColor,
        isSelected && 'ring-2 ring-primary border-primary/50'
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <RocketLaunchIcon className="w-5 h-5 text-foreground" />
          <div>
            <p className="text-sm font-semibold text-foreground">{name}</p>
            <p className="text-xs text-foreground-muted">
              함선 {totalShips.toLocaleString()}척
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {statusIcon}
          <span className="text-xs text-foreground-muted">{statusLabel}</span>
        </div>
      </div>
      <div className="mt-2 text-xs text-foreground-dim">
        위치: ({position.x}, {position.y})
      </div>
    </button>
  );
}

export default function FleetPanel() {
  const strategic = useGin7Store((state) => state.strategic);
  const strategySnapshot = useGin7Store((state) => state.strategySnapshot);
  const selectedFleetId = useGin7Store((state) => state.selectedFleetId);
  const selectFleet = useGin7Store((state) => state.selectFleet);
  const setSelection = useGin7MapStore((state) => state.setSelection);
  const panTo = useGin7MapStore((state) => state.panTo);

  const fleets = useMemo(() => {
    if (strategySnapshot?.fleets) {
      return strategySnapshot.fleets.map((f) => ({
        id: f.fleetId,
        name: f.name,
        faction: f.faction,
        status: f.status,
        totalShips: f.totalShips,
        position: f.position,
      }));
    }
    return (strategic?.fleets || []).map((f) => ({
      id: f.id,
      name: f.name,
      faction: f.faction,
      status: f.status,
      totalShips: f.totalShips,
      position: { x: f.x, y: f.y },
    }));
  }, [strategySnapshot, strategic]);

  const selectedFleet = fleets.find((f) => f.id === selectedFleetId);

  const handleFleetClick = (fleet: typeof fleets[0]) => {
    selectFleet(fleet.id);
    setSelection({ type: 'fleet', id: fleet.id, coordinates: fleet.position });
    panTo(fleet.position.x - 5, fleet.position.y - 5);
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-space-panel/50 backdrop-blur-sm overflow-hidden">
      {/* 헤더 */}
      <div className="p-4 border-b border-white/5">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <RocketLaunchIcon className="w-5 h-5" />
            함대 목록
          </h3>
          <span className="text-xs text-foreground-muted">{fleets.length}개</span>
        </div>
      </div>

      {/* 선택된 함대 상세 */}
      {selectedFleet && (
        <div className="p-4 bg-primary/5 border-b border-white/5">
          <h4 className="text-xs uppercase tracking-wide text-foreground-muted mb-2">선택된 함대</h4>
          <div className="space-y-2">
            <p className="text-lg font-bold text-foreground">{selectedFleet.name}</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-foreground-muted">상태:</span>
                <span className="ml-1 text-foreground">{selectedFleet.status}</span>
              </div>
              <div>
                <span className="text-foreground-muted">함선:</span>
                <span className="ml-1 text-foreground">{selectedFleet.totalShips.toLocaleString()}</span>
              </div>
              <div className="col-span-2">
                <span className="text-foreground-muted">위치:</span>
                <span className="ml-1 text-foreground">
                  ({selectedFleet.position.x}, {selectedFleet.position.y})
                </span>
              </div>
            </div>
            <div className="flex gap-2 mt-3">
              <button className="flex-1 px-3 py-1.5 rounded-lg bg-primary/20 text-primary text-xs hover:bg-primary/30 transition-colors">
                이동 명령
              </button>
              <button className="flex-1 px-3 py-1.5 rounded-lg bg-white/5 text-foreground-muted text-xs hover:bg-white/10 transition-colors">
                상세 정보
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 함대 목록 */}
      <div className="p-4 space-y-2 max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-white/10">
        {fleets.length === 0 ? (
          <p className="text-sm text-foreground-muted text-center py-4">
            표시할 함대가 없습니다
          </p>
        ) : (
          fleets.map((fleet) => (
            <FleetItem
              key={fleet.id}
              {...fleet}
              isSelected={fleet.id === selectedFleetId}
              onClick={() => handleFleetClick(fleet)}
            />
          ))
        )}
      </div>
    </div>
  );
}

