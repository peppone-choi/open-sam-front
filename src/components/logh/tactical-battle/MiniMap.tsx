'use client';

/**
 * MiniMap.tsx
 * 미니맵 컴포넌트
 * 
 * 기능:
 * - 전체 전장 개요 표시
 * - 카메라 뷰포트 표시
 * - 클릭으로 카메라 이동
 * - 아군/적군 함대 표시
 */

import React, { useRef, useEffect, useCallback } from 'react';
import {
  Fleet,
  Camera,
  Position,
  MAP_SIZE,
  FACTION_COLORS,
  COLORS,
} from './types';

interface MiniMapProps {
  fleets: Fleet[];
  camera: Camera;
  selectedFleetIds: Set<string>;
  canvasSize: { width: number; height: number };
  onClick: (worldPos: Position) => void;
  size?: number;
}

export function MiniMap({
  fleets,
  camera,
  selectedFleetIds,
  canvasSize,
  onClick,
  size = 200,
}: MiniMapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scale = size / MAP_SIZE;
  
  // 렌더링
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // 크기 설정
    canvas.width = size;
    canvas.height = size;
    
    // 배경
    ctx.fillStyle = '#050510';
    ctx.fillRect(0, 0, size, size);
    
    // 격자
    ctx.strokeStyle = 'rgba(0, 212, 255, 0.1)';
    ctx.lineWidth = 0.5;
    const gridStep = size / 10;
    
    for (let i = 0; i <= 10; i++) {
      const pos = i * gridStep;
      ctx.beginPath();
      ctx.moveTo(pos, 0);
      ctx.lineTo(pos, size);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, pos);
      ctx.lineTo(size, pos);
      ctx.stroke();
    }
    
    // 중앙선
    ctx.strokeStyle = 'rgba(0, 212, 255, 0.2)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(size / 2, 0);
    ctx.lineTo(size / 2, size);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, size / 2);
    ctx.lineTo(size, size / 2);
    ctx.stroke();
    
    // 함대 표시
    fleets.forEach((fleet) => {
      const x = fleet.tacticalPosition.x * scale;
      const y = fleet.tacticalPosition.y * scale;
      const fleetSize = Math.max(2, Math.min(6, fleet.totalShips / 3000));
      
      const isSelected = selectedFleetIds.has(fleet.id);
      const factionColor = FACTION_COLORS[fleet.faction];
      
      // 선택된 함대 글로우
      if (isSelected) {
        ctx.shadowColor = COLORS.selection;
        ctx.shadowBlur = 5;
      }
      
      // 함대 점
      ctx.fillStyle = factionColor;
      ctx.beginPath();
      ctx.arc(x, y, fleetSize, 0, Math.PI * 2);
      ctx.fill();
      
      // 선택 링
      if (isSelected) {
        ctx.strokeStyle = COLORS.selection;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(x, y, fleetSize + 2, 0, Math.PI * 2);
        ctx.stroke();
      }
      
      ctx.shadowBlur = 0;
      
      // 기함 표시
      if (fleet.isFlagship) {
        ctx.fillStyle = '#ffd700';
        ctx.beginPath();
        ctx.arc(x, y - fleetSize - 2, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
    });
    
    // 카메라 뷰포트 표시
    const viewWidth = (canvasSize.width / camera.zoom) * scale;
    const viewHeight = (canvasSize.height / camera.zoom) * scale;
    const viewX = camera.x * scale - viewWidth / 2;
    const viewY = camera.y * scale - viewHeight / 2;
    
    ctx.strokeStyle = COLORS.neonGreen;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 2]);
    ctx.strokeRect(viewX, viewY, viewWidth, viewHeight);
    ctx.setLineDash([]);
    
    // 카메라 중심점
    ctx.fillStyle = COLORS.neonGreen;
    ctx.beginPath();
    ctx.arc(camera.x * scale, camera.y * scale, 2, 0, Math.PI * 2);
    ctx.fill();
  }, [fleets, camera, selectedFleetIds, canvasSize, size, scale]);
  
  // 클릭 핸들러
  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      // 미니맵 좌표 -> 월드 좌표
      const worldX = x / scale;
      const worldY = y / scale;
      
      onClick({ x: worldX, y: worldY });
    },
    [onClick, scale]
  );
  
  // 드래그 핸들러
  const isDragging = useRef(false);
  
  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      isDragging.current = true;
      handleClick(e);
    },
    [handleClick]
  );
  
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!isDragging.current) return;
      handleClick(e);
    },
    [handleClick]
  );
  
  const handleMouseUp = useCallback(() => {
    isDragging.current = false;
  }, []);
  
  // 범례
  const legends = [
    { color: FACTION_COLORS.alliance, label: '아군' },
    { color: FACTION_COLORS.empire, label: '적군' },
    { color: COLORS.neonGreen, label: '현재 화면' },
  ];
  
  return (
    <div className="bg-[#0a0a1a]/90 border border-cyan-500/30 rounded-lg overflow-hidden shadow-lg shadow-cyan-500/10 backdrop-blur-sm">
      {/* 헤더 */}
      <div className="px-2 py-1 bg-cyan-500/10 border-b border-cyan-500/20 flex items-center justify-between">
        <span className="text-cyan-400 text-xs font-mono tracking-wider">
          TACTICAL OVERVIEW
        </span>
        <span className="text-gray-500 text-xs">
          {MAP_SIZE.toLocaleString()}×{MAP_SIZE.toLocaleString()}
        </span>
      </div>
      
      {/* 미니맵 Canvas */}
      <canvas
        ref={canvasRef}
        width={size}
        height={size}
        className="block cursor-pointer"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      />
      
      {/* 범례 */}
      <div className="px-2 py-1 bg-[#0a0a2a] border-t border-cyan-500/20 flex justify-center gap-3">
        {legends.map((legend) => (
          <div key={legend.label} className="flex items-center gap-1">
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: legend.color }}
            />
            <span className="text-gray-500 text-xs">{legend.label}</span>
          </div>
        ))}
      </div>
      
      {/* 좌표 표시 */}
      <div className="px-2 py-1 bg-[#050510] border-t border-gray-800 flex justify-between">
        <span className="text-gray-600 text-xs font-mono">
          CAM: {Math.round(camera.x)}, {Math.round(camera.y)}
        </span>
        <span className="text-gray-600 text-xs font-mono">
          {Math.round(camera.zoom * 100)}%
        </span>
      </div>
    </div>
  );
}




