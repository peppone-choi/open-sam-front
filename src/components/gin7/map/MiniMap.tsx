'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useGin7Store } from '@/stores/gin7Store';
import { useGin7MapStore } from '@/stores/gin7MapStore';

function factionColor(faction: string) {
  switch (faction) {
    case 'empire': return '#fcd34d';
    case 'alliance': return '#38bdf8';
    case 'phezzan': return '#f472b6';
    default: return '#94a3b8';
  }
}

export default function MiniMap() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const strategic = useGin7Store((state) => state.strategic);
  const viewport = useGin7MapStore((state) => state.viewport);
  const setViewport = useGin7MapStore((state) => state.setViewport);

  useEffect(() => {
    if (!strategic || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#020617';
    ctx.fillRect(0, 0, width, height);

    const scaleX = width / strategic.gridWidth;
    const scaleY = height / strategic.gridHeight;

    // 성계 표시
    strategic.cells.forEach((cell) => {
      if (cell.type === 'star_system') {
        ctx.fillStyle = cell.faction ? factionColor(cell.faction) : '#4a5568';
        ctx.fillRect(cell.x * scaleX, cell.y * scaleY, Math.max(2, scaleX), Math.max(2, scaleY));
      }
    });

    // 그리드 라인
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 0.5;
    for (let x = 0; x <= strategic.gridWidth; x += 5) {
      ctx.beginPath();
      ctx.moveTo(x * scaleX, 0);
      ctx.lineTo(x * scaleX, height);
      ctx.stroke();
    }
    for (let y = 0; y <= strategic.gridHeight; y += 5) {
      ctx.beginPath();
      ctx.moveTo(0, y * scaleY);
      ctx.lineTo(width, y * scaleY);
      ctx.stroke();
    }

    // 함대 표시
    strategic.fleets.forEach((fleet) => {
      ctx.fillStyle = factionColor(fleet.faction);
      ctx.beginPath();
      ctx.arc(
        fleet.x * scaleX + scaleX / 2,
        fleet.y * scaleY + scaleY / 2,
        fleet.isFlagship ? 3 : 2,
        0,
        Math.PI * 2
      );
      ctx.fill();
    });

    // 뷰포트 표시
    const viewportWidth = (canvas.parentElement?.clientWidth || 800) / (24 * viewport.zoom);
    const viewportHeight = (canvas.parentElement?.clientHeight || 600) / (24 * viewport.zoom);
    
    ctx.strokeStyle = '#0ea5e9';
    ctx.lineWidth = 2;
    ctx.strokeRect(
      viewport.x * scaleX,
      viewport.y * scaleY,
      viewportWidth * scaleX,
      viewportHeight * scaleY
    );
  }, [strategic, viewport]);

  const handleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!strategic || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * strategic.gridWidth;
    const y = ((e.clientY - rect.top) / rect.height) * strategic.gridHeight;
    setViewport({ x: Math.max(0, x - 5), y: Math.max(0, y - 5) });
  }, [strategic, setViewport]);

  if (!strategic) return null;

  return (
    <div className="rounded-xl border border-white/10 bg-black/30 p-2">
      <p className="text-[10px] uppercase tracking-wide text-foreground-muted mb-2">미니맵</p>
      <canvas
        ref={canvasRef}
        width={200}
        height={120}
        className="w-full rounded-lg border border-white/5 bg-black/50 cursor-pointer"
        onClick={handleClick}
      />
    </div>
  );
}

