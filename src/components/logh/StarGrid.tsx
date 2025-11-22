'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useGameStore } from '@/stores/gameStore';

// Manual P.30 Grid System (100ly)
const CELL_SIZE = 50; // pixels per grid unit
const GRID_COLOR = '#1E90FF';
const EMPIRE_COLOR = '#C0C0C0';
const ALLIANCE_COLOR = '#4A5D23';

export default function StarGrid() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { viewport, setViewport, selectGrid, starSystems, fleets, loadMockData } = useGameStore();
  const [isDragging, setIsDragging] = useState(false);
  const [lastPos, setLastPos] = useState({ x: 0, y: 0 });

  // Load initial mock data
  useEffect(() => {
    loadMockData();
  }, [loadMockData]);

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

    // Draw Star Systems
    starSystems.forEach(sys => {
      const x = sys.gridX * CELL_SIZE + CELL_SIZE / 2;
      const y = sys.gridY * CELL_SIZE + CELL_SIZE / 2;
      
      // Star Icon
      ctx.fillStyle = sys.faction === 'empire' ? EMPIRE_COLOR : ALLIANCE_COLOR;
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
        
        ctx.fillStyle = fleet.faction === 'empire' ? '#FFFFFF' : '#87CEEB';
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
  }, [viewport, starSystems, fleets]);

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
      <canvas ref={canvasRef} className="block" data-testid="star-grid-canvas" />
      
      {/* Debug Info */}
      <div className="absolute top-2 right-2 bg-black/50 text-[#1E90FF] text-xs p-2 font-mono pointer-events-none">
        Zoom: {viewport.zoom.toFixed(2)} | Pos: {viewport.x.toFixed(0)},{viewport.y.toFixed(0)}
      </div>
    </div>
  );
}
