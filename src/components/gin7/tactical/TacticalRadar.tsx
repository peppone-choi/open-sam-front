'use client';

import { useMemo, useCallback, useRef, useEffect } from 'react';
import { useGin7TacticalStore } from '@/stores/gin7TacticalStore';
import type { Vector3 } from '@/types/gin7-tactical';

// ============================================================
// Constants
// ============================================================

const RADAR_SIZE = 200;
const UNIT_DOT_SIZE = 4;
const SELECTED_DOT_SIZE = 6;

const FACTION_COLORS: Record<string, string> = {
  empire: '#ffd700',
  alliance: '#1e90ff',
  phezzan: '#32cd32',
  neutral: '#808080',
};

// ============================================================
// Main Component
// ============================================================

export interface TacticalRadarProps {
  className?: string;
  size?: number;
}

export default function TacticalRadar({ className = '', size = RADAR_SIZE }: TacticalRadarProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const units = useGin7TacticalStore((s) => s.units);
  const selectedUnitIds = useGin7TacticalStore((s) => s.selectedUnitIds);
  const myFactionId = useGin7TacticalStore((s) => s.myFactionId);
  const mapSize = useGin7TacticalStore((s) => s.mapSize);
  const cameraPosition = useGin7TacticalStore((s) => s.cameraPosition);
  const setCameraPosition = useGin7TacticalStore((s) => s.setCameraPosition);
  
  // Convert world position to radar position
  const worldToRadar = useCallback(
    (pos: Vector3): { x: number; y: number } => {
      const halfWidth = mapSize.width / 2;
      const halfDepth = mapSize.depth / 2;
      
      const normalizedX = (pos.x + halfWidth) / mapSize.width;
      const normalizedZ = (pos.z + halfDepth) / mapSize.depth;
      
      return {
        x: normalizedX * size,
        y: normalizedZ * size,
      };
    },
    [mapSize.width, mapSize.depth, size]
  );
  
  // Convert radar position to world position
  const radarToWorld = useCallback(
    (radarX: number, radarY: number): Vector3 => {
      const halfWidth = mapSize.width / 2;
      const halfDepth = mapSize.depth / 2;
      
      const normalizedX = radarX / size;
      const normalizedZ = radarY / size;
      
      return {
        x: normalizedX * mapSize.width - halfWidth,
        y: 0,
        z: normalizedZ * mapSize.depth - halfDepth,
      };
    },
    [mapSize.width, mapSize.depth, size]
  );
  
  // Group units by faction for rendering
  const unitGroups = useMemo(() => {
    const groups: Record<string, { isSelected: boolean; isMine: boolean; pos: Vector3; id: string }[]> = {};
    
    units
      .filter((u) => !u.isDestroyed)
      .forEach((unit) => {
        const faction = unit.factionId;
        if (!groups[faction]) groups[faction] = [];
        groups[faction].push({
          id: unit.id,
          pos: unit.position,
          isSelected: selectedUnitIds.has(unit.id),
          isMine: unit.factionId === myFactionId,
        });
      });
    
    return groups;
  }, [units, selectedUnitIds, myFactionId]);
  
  // Draw radar
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear
    ctx.fillStyle = '#0a0f1a';
    ctx.fillRect(0, 0, size, size);
    
    // Draw grid
    ctx.strokeStyle = '#1a2a3a';
    ctx.lineWidth = 0.5;
    const gridStep = size / 8;
    for (let i = 0; i <= 8; i++) {
      ctx.beginPath();
      ctx.moveTo(i * gridStep, 0);
      ctx.lineTo(i * gridStep, size);
      ctx.stroke();
      
      ctx.beginPath();
      ctx.moveTo(0, i * gridStep);
      ctx.lineTo(size, i * gridStep);
      ctx.stroke();
    }
    
    // Draw units
    Object.entries(unitGroups).forEach(([faction, unitList]) => {
      const color = FACTION_COLORS[faction] || FACTION_COLORS.neutral;
      
      unitList.forEach(({ pos, isSelected, isMine }) => {
        const radarPos = worldToRadar(pos);
        const dotSize = isSelected ? SELECTED_DOT_SIZE : UNIT_DOT_SIZE;
        
        ctx.beginPath();
        ctx.arc(radarPos.x, radarPos.y, dotSize / 2, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
        
        if (isSelected) {
          ctx.strokeStyle = '#00ff00';
          ctx.lineWidth = 1.5;
          ctx.stroke();
        } else if (isMine) {
          ctx.strokeStyle = 'rgba(255,255,255,0.5)';
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      });
    });
    
    // Draw camera viewport indicator
    const camRadar = worldToRadar(cameraPosition);
    const viewportSize = 40; // Approximate viewport size on radar
    
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.strokeRect(
      camRadar.x - viewportSize / 2,
      camRadar.y - viewportSize / 2,
      viewportSize,
      viewportSize
    );
    
    // Draw center crosshair
    ctx.strokeStyle = '#ffffff33';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(size / 2 - 10, size / 2);
    ctx.lineTo(size / 2 + 10, size / 2);
    ctx.moveTo(size / 2, size / 2 - 10);
    ctx.lineTo(size / 2, size / 2 + 10);
    ctx.stroke();
  }, [unitGroups, cameraPosition, size, worldToRadar]);
  
  // Handle click to move camera
  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const worldPos = radarToWorld(x, y);
      setCameraPosition(worldPos);
    },
    [radarToWorld, setCameraPosition]
  );
  
  // Calculate unit counts
  const unitCounts = useMemo(() => {
    const myUnits = units.filter((u) => u.factionId === myFactionId && !u.isDestroyed);
    const enemyUnits = units.filter((u) => u.factionId !== myFactionId && !u.isDestroyed);
    return {
      mine: myUnits.length,
      enemy: enemyUnits.length,
      total: myUnits.length + enemyUnits.length,
    };
  }, [units, myFactionId]);
  
  return (
    <div className={`bg-slate-900/95 backdrop-blur border border-slate-700 rounded-xl p-3 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <h3 className="text-xs font-bold text-white">레이더</h3>
        </div>
        <div className="flex gap-2 text-[10px]">
          <span className="text-cyan-400">●{unitCounts.mine}</span>
          <span className="text-red-400">●{unitCounts.enemy}</span>
        </div>
      </div>
      
      {/* Canvas */}
      <div className="relative rounded-lg overflow-hidden border border-slate-700">
        <canvas
          ref={canvasRef}
          width={size}
          height={size}
          onClick={handleClick}
          className="cursor-crosshair"
          style={{ width: size, height: size }}
        />
        
        {/* Corner labels */}
        <div className="absolute top-1 left-1 text-[8px] text-white/30 font-mono">NW</div>
        <div className="absolute top-1 right-1 text-[8px] text-white/30 font-mono">NE</div>
        <div className="absolute bottom-1 left-1 text-[8px] text-white/30 font-mono">SW</div>
        <div className="absolute bottom-1 right-1 text-[8px] text-white/30 font-mono">SE</div>
      </div>
      
      {/* Legend */}
      <div className="mt-2 flex justify-center gap-3 text-[9px] text-white/60">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: FACTION_COLORS.empire }} />
          <span>제국</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: FACTION_COLORS.alliance }} />
          <span>동맹</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-1 h-3 border border-white/60" />
          <span>시야</span>
        </div>
      </div>
      
      {/* Click hint */}
      <div className="mt-1 text-center text-[8px] text-white/40">
        클릭하여 카메라 이동
      </div>
    </div>
  );
}








