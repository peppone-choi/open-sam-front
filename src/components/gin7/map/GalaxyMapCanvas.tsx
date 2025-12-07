'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { useGin7Store } from '@/stores/gin7Store';
import { useGin7MapStore } from '@/stores/gin7MapStore';

const CELL_SIZE = 24;
const MIN_ZOOM = 0.25;
const MAX_ZOOM = 4;

function factionColor(faction: string) {
  switch (faction) {
    case 'empire':
      return '#fcd34d'; // Gold
    case 'alliance':
      return '#38bdf8'; // Sky blue
    case 'phezzan':
      return '#f472b6'; // Pink
    default:
      return '#94a3b8'; // Gray
  }
}

export default function GalaxyMapCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Gin7Store 상태
  const strategic = useGin7Store((state) => state.strategic);
  const selectedFleetId = useGin7Store((state) => state.selectedFleetId);
  const selectFleet = useGin7Store((state) => state.selectFleet);
  
  // MapStore 상태
  const viewport = useGin7MapStore((state) => state.viewport);
  const setViewport = useGin7MapStore((state) => state.setViewport);
  const hoveredCell = useGin7MapStore((state) => state.hoveredCell);
  const setHoveredCell = useGin7MapStore((state) => state.setHoveredCell);
  const setSelection = useGin7MapStore((state) => state.setSelection);
  const layers = useGin7MapStore((state) => state.layers);

  // 드래그 상태
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [viewportStart, setViewportStart] = useState({ x: 0, y: 0 });

  // 캔버스 렌더링
  useEffect(() => {
    if (!strategic || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const scaledCellSize = CELL_SIZE * viewport.zoom;
    const offsetX = viewport.x * scaledCellSize;
    const offsetY = viewport.y * scaledCellSize;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#04060f';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 그리드 셀 렌더링
    strategic.cells.forEach((cell) => {
      const px = cell.x * scaledCellSize - offsetX;
      const py = cell.y * scaledCellSize - offsetY;

      // 뷰포트 밖 셀 스킵 (청크 로딩 최적화)
      if (px + scaledCellSize < 0 || px > canvas.width || 
          py + scaledCellSize < 0 || py > canvas.height) {
        return;
      }

      // 셀 배경
      if (cell.type === 'impassable') {
        ctx.fillStyle = '#0f172a';
      } else if (cell.type === 'star_system') {
        ctx.fillStyle = cell.faction ? `${factionColor(cell.faction)}15` : '#1d2d54';
      } else {
        ctx.fillStyle = '#0b1120';
      }
      ctx.fillRect(px, py, scaledCellSize, scaledCellSize);

      // 성계 라벨
      if (cell.type === 'star_system' && layers.labels && viewport.zoom >= 0.5) {
        ctx.fillStyle = '#ffffff';
        ctx.font = `${Math.max(8, 10 * viewport.zoom)}px var(--font-mono, monospace)`;
        ctx.fillText(cell.label || '성계', px + 2, py + 12 * viewport.zoom);
      }

      // 호버 하이라이트
      if (hoveredCell && hoveredCell.x === cell.x && hoveredCell.y === cell.y) {
        ctx.strokeStyle = '#0ea5e9';
        ctx.lineWidth = 2;
        ctx.strokeRect(px + 1, py + 1, scaledCellSize - 2, scaledCellSize - 2);
      }
    });

    // 그리드 라인
    if (layers.grid && viewport.zoom >= 0.5) {
      ctx.strokeStyle = 'rgba(255,255,255,0.03)';
      ctx.lineWidth = 1;
      for (let x = 0; x <= strategic.gridWidth; x++) {
        const lineX = x * scaledCellSize - offsetX;
        if (lineX >= 0 && lineX <= canvas.width) {
          ctx.beginPath();
          ctx.moveTo(lineX, 0);
          ctx.lineTo(lineX, canvas.height);
          ctx.stroke();
        }
      }
      for (let y = 0; y <= strategic.gridHeight; y++) {
        const lineY = y * scaledCellSize - offsetY;
        if (lineY >= 0 && lineY <= canvas.height) {
          ctx.beginPath();
          ctx.moveTo(0, lineY);
          ctx.lineTo(canvas.width, lineY);
          ctx.stroke();
        }
      }
    }

    // 함대 렌더링
    if (layers.fleets) {
      strategic.fleets.forEach((fleet) => {
        const cx = fleet.x * scaledCellSize - offsetX + scaledCellSize / 2;
        const cy = fleet.y * scaledCellSize - offsetY + scaledCellSize / 2;

        // 뷰포트 밖 함대 스킵
        if (cx < -20 || cx > canvas.width + 20 || cy < -20 || cy > canvas.height + 20) {
          return;
        }

        const radius = (fleet.isFlagship ? 8 : 5) * viewport.zoom;
        
        ctx.fillStyle = factionColor(fleet.faction);
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.fill();

        // 선택된 함대 표시
        if (fleet.id === selectedFleetId) {
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(cx, cy, radius + 4, 0, Math.PI * 2);
          ctx.stroke();
        }

        // 이동 중인 함대 표시
        if (fleet.status === 'moving') {
          ctx.strokeStyle = '#22c55e';
          ctx.lineWidth = 1;
          ctx.setLineDash([2, 2]);
          ctx.beginPath();
          ctx.arc(cx, cy, radius + 2, 0, Math.PI * 2);
          ctx.stroke();
          ctx.setLineDash([]);
        }
      });
    }
  }, [strategic, hoveredCell, selectedFleetId, viewport, layers]);

  // 캔버스 크기 조정
  useEffect(() => {
    if (!containerRef.current || !canvasRef.current) return;
    const resizeObserver = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      canvasRef.current!.width = width;
      canvasRef.current!.height = height;
    });
    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  // 마우스 이동 (호버)
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!strategic || !canvasRef.current) return;
    
    if (isDragging) {
      const dx = (e.clientX - dragStart.x) / (CELL_SIZE * viewport.zoom);
      const dy = (e.clientY - dragStart.y) / (CELL_SIZE * viewport.zoom);
      setViewport({
        x: Math.max(0, Math.min(strategic.gridWidth - 10, viewportStart.x - dx)),
        y: Math.max(0, Math.min(strategic.gridHeight - 10, viewportStart.y - dy)),
      });
      return;
    }

    const rect = canvasRef.current.getBoundingClientRect();
    const scaledCellSize = CELL_SIZE * viewport.zoom;
    const x = Math.floor((e.clientX - rect.left + viewport.x * scaledCellSize) / scaledCellSize);
    const y = Math.floor((e.clientY - rect.top + viewport.y * scaledCellSize) / scaledCellSize);
    
    if (x >= 0 && x < strategic.gridWidth && y >= 0 && y < strategic.gridHeight) {
      setHoveredCell({ x, y });
    }
  }, [strategic, viewport, isDragging, dragStart, viewportStart, setViewport, setHoveredCell]);

  // 마우스 클릭
  const handleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!strategic || !canvasRef.current || isDragging) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const scaledCellSize = CELL_SIZE * viewport.zoom;
    const x = Math.floor((e.clientX - rect.left + viewport.x * scaledCellSize) / scaledCellSize);
    const y = Math.floor((e.clientY - rect.top + viewport.y * scaledCellSize) / scaledCellSize);
    
    // 함대 클릭 확인
    const fleet = strategic.fleets.find((f) => f.x === x && f.y === y);
    if (fleet) {
      selectFleet(fleet.id);
      setSelection({ type: 'fleet', id: fleet.id, coordinates: { x, y } });
    } else {
      // 셀 클릭
      const cell = strategic.cells.find((c) => c.x === x && c.y === y);
      if (cell?.type === 'star_system') {
        setSelection({ type: 'system', id: cell.label || `${x},${y}`, coordinates: { x, y } });
      } else {
        setSelection({ type: 'cell', id: `${x},${y}`, coordinates: { x, y } });
      }
      selectFleet(null);
    }
  }, [strategic, viewport, isDragging, selectFleet, setSelection]);

  // 마우스 드래그 시작
  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (e.button === 0) { // Left button
      setIsDragging(true);
      setDragStart({ x: e.clientX, y: e.clientY });
      setViewportStart({ x: viewport.x, y: viewport.y });
    }
  }, [viewport]);

  // 마우스 드래그 종료
  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // 마우스 휠 (줌)
  const handleWheel = useCallback((e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, viewport.zoom + delta));
    setViewport({ zoom: newZoom });
  }, [viewport.zoom, setViewport]);

  if (!strategic) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-space-panel/30 rounded-2xl">
        <span className="text-foreground-muted">지도 데이터 로딩 중...</span>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef} 
      className="relative w-full h-full overflow-hidden rounded-2xl border border-white/5 bg-black/40"
    >
      <canvas
        ref={canvasRef}
        className={`block w-full h-full ${isDragging ? 'cursor-grabbing' : 'cursor-crosshair'}`}
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => {
          setHoveredCell(null);
          setIsDragging(false);
        }}
        onClick={handleClick}
        onWheel={handleWheel}
      />
      
      {/* 좌표 정보 오버레이 */}
      {hoveredCell && (
        <div className="absolute left-4 bottom-4 rounded-xl bg-black/80 px-3 py-2 text-xs font-mono text-white shadow-lg backdrop-blur-sm">
          <span className="text-foreground-muted">좌표:</span> ({hoveredCell.x}, {hoveredCell.y})
          {strategic.cells.find(c => c.x === hoveredCell.x && c.y === hoveredCell.y)?.label && (
            <span className="ml-2 text-alliance-blue">
              {strategic.cells.find(c => c.x === hoveredCell.x && c.y === hoveredCell.y)?.label}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

