'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useSocket } from '@/hooks/useSocket';
import { cn } from '@/lib/utils';

/**
 * LOGH Strategic Map Component
 * 100x50 전략 맵 (Canvas 기반)
 */

interface Fleet {
  fleetId: string;
  name: string;
  faction: 'empire' | 'alliance' | 'neutral';
  strategicPosition: { x: number; y: number };
  status: string;
  isInCombat: boolean;
  totalShips: number;
}

interface MapGridData {
  gridSize: { width: number; height: number };
  grid: number[][];
}

interface Props {
  sessionId: string;
  onFleetClick?: (fleet: Fleet) => void;
  onCellClick?: (x: number, y: number) => void;
}

export default function StrategicMap({ sessionId, onFleetClick, onCellClick }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mapGrid, setMapGrid] = useState<MapGridData | null>(null);
  const [fleets, setFleets] = useState<Fleet[]>([]);
  const [selectedFleet, setSelectedFleet] = useState<Fleet | null>(null);
  const [hoveredCell, setHoveredCell] = useState<{ x: number; y: number } | null>(null);

  const cellWidth = 16; // 각 그리드 셀의 픽셀 크기
  const cellHeight = 16;

  // Socket.IO
  const { socket, isConnected } = useSocket({ sessionId, autoConnect: true });

  // 맵 데이터 로드
  useEffect(() => {
    loadMapData();
  }, [sessionId]);

  // WebSocket 이벤트 수신
  useEffect(() => {
    if (!socket) return;

    socket.on('game:state-update', (data: any) => {
      if (data.fleets) {
        setFleets(data.fleets);
      }
    });

    return () => {
      socket.off('game:state-update');
    };
  }, [socket]);

  async function loadMapData() {
    try {
      const response = await fetch(`/api/logh/map/grid?sessionId=${sessionId}`);
      const result = await response.json();
      if (result.success) {
        setMapGrid(result.data);
      }
    } catch (error) {
      console.error('Failed to load map data:', error);
    }
  }

  // 캔버스 렌더링
  useEffect(() => {
    if (!canvasRef.current || !mapGrid) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 캔버스 크기 설정
    canvas.width = mapGrid.gridSize.width * cellWidth;
    canvas.height = mapGrid.gridSize.height * cellHeight;

    // 배경 클리어
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 그리드 렌더링
    for (let y = 0; y < mapGrid.gridSize.height; y++) {
      for (let x = 0; x < mapGrid.gridSize.width; x++) {
        const isNavigable = mapGrid.grid[y][x] === 1;
        
        ctx.fillStyle = isNavigable ? '#1a1a2e' : '#0f0f1e';
        ctx.fillRect(x * cellWidth, y * cellHeight, cellWidth, cellHeight);

        // 호버된 셀 강조
        if (hoveredCell && hoveredCell.x === x && hoveredCell.y === y) {
          ctx.strokeStyle = '#00ffff';
          ctx.lineWidth = 2;
          ctx.strokeRect(x * cellWidth, y * cellHeight, cellWidth, cellHeight);
        }
      }
    }

    // 함대 렌더링
    fleets.forEach((fleet) => {
      const x = Math.floor(fleet.strategicPosition.x);
      const y = Math.floor(fleet.strategicPosition.y);

      // 함대 색상
      let color = '#888888';
      if (fleet.faction === 'empire') {
        color = '#ffcc00'; // 제국 - 황금색
      } else if (fleet.faction === 'alliance') {
        color = '#00ccff'; // 동맹 - 청록색
      }

      // 전투 중이면 빨간 테두리
      if (fleet.isInCombat) {
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(
          x * cellWidth - 2,
          y * cellHeight - 2,
          cellWidth + 4,
          cellHeight + 4
        );
      }

      // 함대 아이콘
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(
        x * cellWidth + cellWidth / 2,
        y * cellHeight + cellHeight / 2,
        cellWidth / 3,
        0,
        Math.PI * 2
      );
      ctx.fill();

      // 선택된 함대 강조
      if (selectedFleet && selectedFleet.fleetId === fleet.fleetId) {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(
          x * cellWidth + cellWidth / 2,
          y * cellHeight + cellHeight / 2,
          cellWidth / 2,
          0,
          Math.PI * 2
        );
        ctx.stroke();
      }
    });
  }, [mapGrid, fleets, selectedFleet, hoveredCell]);

  // 마우스 클릭 처리
  const handleCanvasClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!canvasRef.current) return;

      const rect = canvasRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const gridX = Math.floor(mouseX / cellWidth);
      const gridY = Math.floor(mouseY / cellHeight);

      // 클릭한 위치에 함대가 있는지 확인
      const clickedFleet = fleets.find((f) => {
        const fx = Math.floor(f.strategicPosition.x);
        const fy = Math.floor(f.strategicPosition.y);
        return fx === gridX && fy === gridY;
      });

      if (clickedFleet) {
        setSelectedFleet(clickedFleet);
        onFleetClick?.(clickedFleet);
      } else {
        onCellClick?.(gridX, gridY);
      }
    },
    [fleets, onFleetClick, onCellClick]
  );

  // 마우스 이동 처리
  const handleCanvasMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!canvasRef.current) return;

      const rect = canvasRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const gridX = Math.floor(mouseX / cellWidth);
      const gridY = Math.floor(mouseY / cellHeight);

      setHoveredCell({ x: gridX, y: gridY });
    },
    []
  );

  return (
    <div className="relative bg-black overflow-hidden rounded-lg">
      <canvas
        ref={canvasRef}
        data-testid="logh-strategic-canvas"
        onClick={handleCanvasClick}
        onMouseMove={handleCanvasMouseMove}
        onMouseLeave={() => setHoveredCell(null)}
        className="cursor-pointer block"
        style={{
          imageRendering: 'pixelated',
          width: '100%',
          height: '100%',
          maxWidth: '100%',
          maxHeight: '100%',
        }}
      />

      {/* 정보 패널 */}
      {hoveredCell && (
        <div className="absolute top-2 left-2 bg-black/80 text-white p-2 rounded text-sm font-mono border border-white/10 pointer-events-none">
          좌표: ({hoveredCell.x}, {hoveredCell.y})
        </div>
      )}

      {/* 선택된 함대 정보 */}
      {selectedFleet && (
        <div className="absolute top-2 right-2 bg-black/90 text-white p-3 rounded-lg min-w-[200px] border border-white/20 shadow-xl">
          <div className="font-bold text-lg mb-2 border-b border-white/10 pb-1">{selectedFleet.name}</div>
          <div className="text-sm space-y-1">
            <div>
              진영:{' '}
              <span
                className={cn(
                  "font-bold",
                  selectedFleet.faction === 'empire' ? 'text-yellow-400' : 'text-cyan-400'
                )}
              >
                {selectedFleet.faction === 'empire' ? '제국' : '동맹'}
              </span>
            </div>
            <div>함선: <span className="font-mono text-blue-300">{selectedFleet.totalShips.toLocaleString()}</span></div>
            <div>상태: <span className="text-gray-300">{selectedFleet.status}</span></div>
            {selectedFleet.isInCombat && (
              <div className="text-red-500 font-bold animate-pulse">⚔️ 전투 중</div>
            )}
          </div>
        </div>
      )}

      {/* 연결 상태 */}
      <div className="absolute bottom-2 right-2">
        <div className={cn(
          "px-2 py-1 rounded text-xs font-bold flex items-center gap-1",
          isConnected ? "bg-green-900/80 text-green-400 border border-green-500/30" : "bg-red-900/80 text-red-400 border border-red-500/30"
        )}>
          <span className={cn("w-2 h-2 rounded-full", isConnected ? "bg-green-500" : "bg-red-500")}></span>
          {isConnected ? 'LIVE' : 'OFFLINE'}
        </div>
      </div>
    </div>
  );
}
