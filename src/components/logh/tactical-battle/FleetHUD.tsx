'use client';

/**
 * FleetHUD.tsx
 * 함대 정보 HUD 컴포넌트
 * 
 * 표시 정보:
 * - 함대명, 제독명
 * - HP, 사기, 보급 바
 * - 함선 수, 진형, 속도
 * - 제독 능력치
 */

import React from 'react';
import {
  Fleet,
  FORMATION_NAMES,
  FACTION_COLORS,
  FACTION_NAMES,
  Faction,
  COLORS,
} from './types';
import { getStatusColor } from './utils';

interface FleetHUDProps {
  selectedFleets: Fleet[];
  hoveredFleet: Fleet | null;
  playerFaction: Faction;
}

// ===== 상태 바 컴포넌트 =====
function StatusBar({
  label,
  value,
  max,
  showNumber = true,
  glowColor,
}: {
  label: string;
  value: number;
  max: number;
  showNumber?: boolean;
  glowColor?: string;
}) {
  const ratio = value / max;
  const color = getStatusColor(value, max);
  
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-gray-400">{label}</span>
        {showNumber && (
          <span className="font-mono" style={{ color }}>
            {value.toLocaleString()} / {max.toLocaleString()}
          </span>
        )}
      </div>
      <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
        <div
          className="h-full transition-all duration-300"
          style={{
            width: `${ratio * 100}%`,
            backgroundColor: color,
            boxShadow: glowColor ? `0 0 8px ${glowColor}` : `0 0 8px ${color}40`,
          }}
        />
      </div>
    </div>
  );
}

// ===== 능력치 표시 =====
function StatDisplay({ label, value }: { label: string; value: number }) {
  const color = value >= 80 ? COLORS.neonGreen : value >= 60 ? COLORS.neonYellow : COLORS.hpLow;
  
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-gray-500 text-xs">{label}</span>
      <div className="flex items-center gap-2">
        <div className="w-16 h-1.5 bg-gray-800 rounded-full overflow-hidden">
          <div
            className="h-full"
            style={{ width: `${value}%`, backgroundColor: color }}
          />
        </div>
        <span className="text-xs font-mono w-8 text-right" style={{ color }}>
          {value}
        </span>
      </div>
    </div>
  );
}

// ===== 함대 카드 =====
function FleetCard({
  fleet,
  isExpanded = false,
  isPrimary = false,
}: {
  fleet: Fleet;
  isExpanded?: boolean;
  isPrimary?: boolean;
}) {
  const factionColor = FACTION_COLORS[fleet.faction];
  
  return (
    <div
      className={`rounded-lg border transition-all ${
        isPrimary
          ? 'bg-[#0a0a2a] border-cyan-500/50 shadow-lg shadow-cyan-500/20'
          : 'bg-[#0a0a1a] border-gray-700/50'
      }`}
      style={{
        borderLeftWidth: '3px',
        borderLeftColor: factionColor,
      }}
    >
      {/* 헤더 */}
      <div className="p-3 border-b border-gray-700/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {fleet.isFlagship && (
              <span className="text-yellow-400 text-sm">★</span>
            )}
            <h3 className="font-bold text-sm" style={{ color: factionColor }}>
              {fleet.name}
            </h3>
          </div>
          <span
            className="text-xs px-2 py-0.5 rounded border"
            style={{
              color: factionColor,
              borderColor: `${factionColor}50`,
              backgroundColor: `${factionColor}10`,
            }}
          >
            {FACTION_NAMES[fleet.faction]}
          </span>
        </div>
        <div className="text-gray-400 text-xs mt-1">
          제독: <span className="text-gray-300">{fleet.commander.name}</span>
        </div>
      </div>
      
      {/* 상태 바 */}
      <div className="p-3 space-y-3">
        <StatusBar
          label="HP"
          value={fleet.hp}
          max={fleet.maxHp}
          glowColor={COLORS.neonRed}
        />
        <StatusBar
          label="사기 (Morale)"
          value={fleet.morale}
          max={100}
          showNumber={false}
        />
        <StatusBar
          label="보급 (Supply)"
          value={fleet.supply}
          max={100}
          showNumber={false}
        />
      </div>
      
      {/* 함대 정보 */}
      <div className="px-3 pb-3">
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
          <div className="flex justify-between">
            <span className="text-gray-500">함선</span>
            <span className="text-cyan-400 font-mono">
              {fleet.totalShips.toLocaleString()}척
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">진형</span>
            <span className="text-yellow-400">
              {FORMATION_NAMES[fleet.formation]}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">속도</span>
            <span className="text-green-400 font-mono">{fleet.speed}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">사정거리</span>
            <span className="text-orange-400 font-mono">{fleet.attackRange}</span>
          </div>
        </div>
      </div>
      
      {/* 함선 구성 (확장 시) */}
      {isExpanded && (
        <div className="px-3 pb-3 border-t border-gray-700/30 pt-3">
          <div className="text-xs text-gray-500 mb-2">함선 구성</div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-600">전함</span>
              <span className="text-gray-300 font-mono">
                {fleet.shipTypes.battleship}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">순양함</span>
              <span className="text-gray-300 font-mono">
                {fleet.shipTypes.cruiser}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">구축함</span>
              <span className="text-gray-300 font-mono">
                {fleet.shipTypes.destroyer}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">항모</span>
              <span className="text-gray-300 font-mono">
                {fleet.shipTypes.carrier}
              </span>
            </div>
          </div>
        </div>
      )}
      
      {/* 제독 능력치 (확장 시) */}
      {isExpanded && (
        <div className="px-3 pb-3 border-t border-gray-700/30 pt-3">
          <div className="text-xs text-gray-500 mb-2">제독 능력치</div>
          <StatDisplay label="통솔" value={fleet.commander.command} />
          <StatDisplay label="전투" value={fleet.commander.combat} />
          <StatDisplay label="지략" value={fleet.commander.intelligence} />
          <StatDisplay label="매력" value={fleet.commander.charisma} />
        </div>
      )}
      
      {/* 상태 아이콘 */}
      <div className="px-3 pb-3 flex gap-2">
        {fleet.isMoving && (
          <span className="text-xs px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded border border-blue-500/30">
            이동중
          </span>
        )}
        {fleet.isAttacking && (
          <span className="text-xs px-2 py-0.5 bg-red-500/20 text-red-400 rounded border border-red-500/30">
            전투중
          </span>
        )}
      </div>
    </div>
  );
}

// ===== 호버 프리뷰 =====
function HoverPreview({ fleet }: { fleet: Fleet }) {
  const factionColor = FACTION_COLORS[fleet.faction];
  
  return (
    <div className="p-3 border-t border-cyan-500/20 bg-cyan-500/5">
      <div className="text-xs text-cyan-400 mb-2 font-mono">HOVER TARGET</div>
      <div className="flex items-center gap-2 mb-2">
        <div
          className="w-3 h-3 rounded-full"
          style={{ backgroundColor: factionColor }}
        />
        <span className="text-gray-300 text-sm font-medium">{fleet.name}</span>
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
        <div className="flex justify-between">
          <span className="text-gray-500">HP</span>
          <span className="text-gray-300 font-mono">
            {Math.round((fleet.hp / fleet.maxHp) * 100)}%
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">함선</span>
          <span className="text-gray-300 font-mono">
            {fleet.totalShips.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
}

// ===== 메인 컴포넌트 =====
export function FleetHUD({
  selectedFleets,
  hoveredFleet,
  playerFaction,
}: FleetHUDProps) {
  // 아군/적군 분리
  const friendlyFleets = selectedFleets.filter((f) => f.faction === playerFaction);
  const enemyFleets = selectedFleets.filter((f) => f.faction !== playerFaction);
  
  return (
    <div className="h-full flex flex-col">
      {/* 헤더 */}
      <div className="p-3 border-b border-cyan-500/20">
        <div className="text-cyan-400 font-mono text-sm tracking-wider">
          FLEET STATUS
        </div>
        <div className="text-gray-500 text-xs mt-1">
          {selectedFleets.length > 0
            ? `${selectedFleets.length} 함대 선택됨`
            : '함대를 선택하세요'}
        </div>
      </div>
      
      {/* 함대 목록 */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {selectedFleets.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-600 text-6xl mb-4">🚀</div>
            <div className="text-gray-500 text-sm">
              함대를 클릭하여 선택하세요
            </div>
            <div className="text-gray-600 text-xs mt-2">
              Shift+드래그로 다중 선택
            </div>
          </div>
        ) : (
          <>
            {/* 아군 */}
            {friendlyFleets.length > 0 && (
              <div>
                <div className="text-xs text-gray-500 mb-2 flex items-center gap-2">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: FACTION_COLORS[playerFaction] }}
                  />
                  아군 ({friendlyFleets.length})
                </div>
                <div className="space-y-2">
                  {friendlyFleets.map((fleet, index) => (
                    <FleetCard
                      key={fleet.id}
                      fleet={fleet}
                      isPrimary={index === 0}
                      isExpanded={index === 0 && friendlyFleets.length === 1}
                    />
                  ))}
                </div>
              </div>
            )}
            
            {/* 적군 */}
            {enemyFleets.length > 0 && (
              <div className="mt-4">
                <div className="text-xs text-gray-500 mb-2 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-500" />
                  적군 ({enemyFleets.length})
                </div>
                <div className="space-y-2">
                  {enemyFleets.map((fleet) => (
                    <FleetCard key={fleet.id} fleet={fleet} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
      
      {/* 호버 프리뷰 */}
      {hoveredFleet && !selectedFleets.find((f) => f.id === hoveredFleet.id) && (
        <HoverPreview fleet={hoveredFleet} />
      )}
      
      {/* 총합 통계 */}
      {selectedFleets.length > 1 && (
        <div className="p-3 border-t border-cyan-500/20 bg-[#0a0a2a]">
          <div className="text-xs text-cyan-400 mb-2 font-mono">TOTAL STATS</div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-500">총 함선</span>
              <span className="text-cyan-400 font-mono">
                {selectedFleets
                  .reduce((sum, f) => sum + f.totalShips, 0)
                  .toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">평균 HP</span>
              <span className="text-green-400 font-mono">
                {Math.round(
                  selectedFleets.reduce((sum, f) => sum + (f.hp / f.maxHp) * 100, 0) /
                    selectedFleets.length
                )}
                %
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">평균 사기</span>
              <span className="text-yellow-400 font-mono">
                {Math.round(
                  selectedFleets.reduce((sum, f) => sum + f.morale, 0) /
                    selectedFleets.length
                )}
                %
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">평균 보급</span>
              <span className="text-orange-400 font-mono">
                {Math.round(
                  selectedFleets.reduce((sum, f) => sum + f.supply, 0) /
                    selectedFleets.length
                )}
                %
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}




