'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useGameStore } from '@/stores/gameStore';

// Manual P.30 Grid System (100ly)
const CELL_SIZE = 50; // pixels per grid unit
const GRID_COLOR = '#1E90FF';
const EMPIRE_COLOR = '#C0C0C0';
const ALLIANCE_COLOR = '#4A5D23';
const UNIT_LIMIT_WARNING = 300; // Manual gin7manual.txt:1440-1495

export default function StarGrid() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { 
    viewport, 
    setViewport, 
    selectGrid, 
    starSystems, 
    fleets, 
    loadGalaxyData,
    isLoadingGalaxy,
    galaxyError 
  } = useGameStore();
  const [isDragging, setIsDragging] = useState(false);
  const [lastPos, setLastPos] = useState({ x: 0, y: 0 });
  const [gridUnitCounts, setGridUnitCounts] = useState<Map<string, { empire: number; alliance: number }>>(new Map());

  // Calculate unit counts per grid
  const calculateGridUnits = useCallback(() => {
    const counts = new Map<string, { empire: number; alliance: number }>();
    
    fleets.forEach(fleet => {
      const key = `${fleet.gridX},${fleet.gridY}`;
      const current = counts.get(key) || { empire: 0, alliance: 0 };
      
      const units = Math.ceil(fleet.size / 300); // 1 unit = 300 ships
      if (fleet.faction === 'empire') {
        current.empire += units;
      } else if (fleet.faction === 'alliance') {
        current.alliance += units;
      }
      
      counts.set(key, current);
    });
    
    setGridUnitCounts(counts);
  }, [fleets]);

  // Load real galaxy data
  useEffect(() => {
    const sessionId = typeof window !== 'undefined' ? localStorage.getItem('logh_sessionId') : null;
    loadGalaxyData(sessionId || undefined);
  }, [loadGalaxyData]);

  // Recalculate grid units when fleets change
  useEffect(() => {
    calculateGridUnits();
  }, [calculateGridUnits]);

  // Draw Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Resize canvas to container
    const parent = containerRef.current;
    if (parent) {
      canvas.width = parent.clientWidth;
      canvas.height = parent.clientHeight;
    }

    // Clear
    ctx.fillStyle = '#050510';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Apply Transformation (Viewport)
    ctx.save();
    ctx.translate(viewport.x, viewport.y);
    ctx.scale(viewport.zoom, viewport.zoom);

    // Draw Grid Lines
    ctx.strokeStyle = 'rgba(30, 144, 255, 0.1)';
    ctx.lineWidth = 1;
    const gridSize = 100; // 100x100 grid
    
    for (let x = 0; x <= gridSize; x++) {
      ctx.beginPath();
      ctx.moveTo(x * CELL_SIZE, 0);
      ctx.lineTo(x * CELL_SIZE, gridSize * CELL_SIZE);
      ctx.stroke();
    }
    for (let y = 0; y <= gridSize; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y * CELL_SIZE);
      ctx.lineTo(gridSize * CELL_SIZE, y * CELL_SIZE);
      ctx.stroke();
    }

    // Draw 300-unit limit warnings
    gridUnitCounts.forEach((counts, key) => {
      const [gx, gy] = key.split(',').map(Number);
      const x = gx * CELL_SIZE;
      const y = gy * CELL_SIZE;
      
      if (counts.empire >= UNIT_LIMIT_WARNING || counts.alliance >= UNIT_LIMIT_WARNING) {
        ctx.strokeStyle = 'rgba(255, 100, 100, 0.6)';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, CELL_SIZE, CELL_SIZE);
      }
    });

    // Draw Star Systems
    starSystems.forEach(sys => {
      const x = sys.gridX * CELL_SIZE + CELL_SIZE / 2;
      const y = sys.gridY * CELL_SIZE + CELL_SIZE / 2;
      
      // Faction overlay
      if (sys.faction && sys.faction !== 'none') {
        ctx.fillStyle = sys.faction === 'empire' ? 'rgba(192, 192, 192, 0.15)' : 'rgba(74, 93, 35, 0.15)';
        ctx.fillRect(sys.gridX * CELL_SIZE, sys.gridY * CELL_SIZE, CELL_SIZE, CELL_SIZE);
      }
      
      // Star Icon
      ctx.fillStyle = sys.faction === 'empire' ? EMPIRE_COLOR : sys.faction === 'alliance' ? ALLIANCE_COLOR : '#888888';
      ctx.beginPath();
      ctx.arc(x, y, 8, 0, Math.PI * 2);
      ctx.fill();
      
      // Label
      ctx.fillStyle = '#E0E0E0';
      ctx.font = '10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(sys.name, x, y + 15);
    });

    // Draw Fleets (Triangle)
    fleets.forEach(fleet => {
        const x = fleet.gridX * CELL_SIZE + CELL_SIZE / 2 + 10; // Offset slightly
        const y = fleet.gridY * CELL_SIZE + CELL_SIZE / 2 - 10;
        
        ctx.fillStyle = fleet.faction === 'empire' ? '#FFFFFF' : fleet.faction === 'alliance' ? '#87CEEB' : '#888888';
        ctx.beginPath();
        ctx.moveTo(x, y - 6);
        ctx.lineTo(x + 5, y + 6);
        ctx.lineTo(x - 5, y + 6);
        ctx.fill();

        ctx.fillStyle = '#FFFFFF';
        ctx.font = '8px monospace';
        ctx.fillText(fleet.commanderName, x, y - 10);
    });

    ctx.restore();
  }, [viewport, starSystems, fleets, gridUnitCounts]);

  // Interaction Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setLastPos({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      const dx = e.clientX - lastPos.x;
      const dy = e.clientY - lastPos.y;
      setViewport(viewport.x + dx, viewport.y + dy);
      setLastPos({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    const scaleAmount = -e.deltaY * 0.001;
    const newZoom = Math.max(0.1, Math.min(5, viewport.zoom + scaleAmount));
    setViewport(viewport.x, viewport.y, newZoom);
  };

  const handleClick = (e: React.MouseEvent) => {
    if (isDragging) return; // Don't select if dragging
    
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    // Calculate World Coordinates
    const clickX = (e.clientX - rect.left - viewport.x) / viewport.zoom;
    const clickY = (e.clientY - rect.top - viewport.y) / viewport.zoom;

    const gridX = Math.floor(clickX / CELL_SIZE);
    const gridY = Math.floor(clickY / CELL_SIZE);

    selectGrid(gridX, gridY);
  };

  return (
    <div 
      ref={containerRef} 
      className="w-full h-full overflow-hidden cursor-move relative bg-[#050510]"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
      onClick={handleClick}
    >
      {/* Loading State */}
      {isLoadingGalaxy && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/70 z-10">
          <div className="text-[#1E90FF] text-sm font-mono">Loading Galaxy Data...</div>
        </div>
      )}

      {/* Error State */}
      {galaxyError && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 bg-red-900/80 text-white text-xs p-3 font-mono rounded z-10 max-w-md">
          <div className="font-bold mb-1">Galaxy Data Error</div>
          <div>{galaxyError}</div>
          <button 
            onClick={() => {
              const sessionId = typeof window !== 'undefined' ? localStorage.getItem('logh_sessionId') : null;
              loadGalaxyData(sessionId || undefined);
            }}
            className="mt-2 px-3 py-1 bg-red-700 hover:bg-red-600 rounded text-xs"
          >
            Retry
          </button>
        </div>
      )}

      <canvas ref={canvasRef} className="block" data-testid="star-grid-canvas" />
      
      {/* Debug Info */}
      <div className="absolute top-2 right-2 bg-black/50 text-[#1E90FF] text-xs p-2 font-mono pointer-events-none">
        <div>Zoom: {viewport.zoom.toFixed(2)} | Pos: {viewport.x.toFixed(0)},{viewport.y.toFixed(0)}</div>
        <div className="mt-1">Systems: {starSystems.length} | Fleets: {fleets.length}</div>
      </div>

      {/* 300-Unit Limit Info */}
      {Array.from(gridUnitCounts.entries()).some(([_, counts]) => 
        counts.empire >= UNIT_LIMIT_WARNING || counts.alliance >= UNIT_LIMIT_WARNING
      ) && (
        <div className="absolute bottom-2 left-2 bg-red-900/80 text-white text-xs p-2 font-mono rounded pointer-events-none">
          ⚠️ 300-Unit Grid Limit Warning (Manual P.30)
          {Array.from(gridUnitCounts.entries())
            .filter(([_, counts]) => counts.empire >= UNIT_LIMIT_WARNING || counts.alliance >= UNIT_LIMIT_WARNING)
            .map(([key, counts]) => {
              const [gx, gy] = key.split(',');
              return (
                <div key={key} className="text-[10px] mt-1">
                  Grid ({gx},{gy}): Empire={counts.empire} Alliance={counts.alliance}
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
}
