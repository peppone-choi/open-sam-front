'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useSocket } from '@/hooks/useSocket';
import { cn } from '@/lib/utils';
import WarpDialog from './WarpDialog';

/**
 * LOGH Strategic Map Component
 * 100x50 전략 맵 (Canvas 기반)
 * Manual P.31 - ワープ航行の概念
 */

interface Fleet {
  fleetId: string;
  name: string;
  faction: 'empire' | 'alliance' | 'neutral';
  strategicPosition: { x: number; y: number };
  destination?: { x: number; y: number };
  status: string;
  isInCombat: boolean;
  isMoving?: boolean;
  totalShips: number;
}

interface MapGridData {
  gridSize: { width: number; height: number };
  grid: number[][];
}

interface WarpOutcome {
  terrainType: string;
  hazardLevel: number;
  errorVector: { x: number; y: number };
  finalDestination: { x: number; y: number };
}

interface Props {
  sessionId: string;
  characterId?: string; // Required for warp commands
  onFleetClick?: (fleet: Fleet) => void;
  onCellClick?: (x: number, y: number) => void;
}

export default function StrategicMap({ sessionId, characterId, onFleetClick, onCellClick }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mapGrid, setMapGrid] = useState<MapGridData | null>(null);
  const [fleets, setFleets] = useState<Fleet[]>([]);
  const [selectedFleet, setSelectedFleet] = useState<Fleet | null>(null);
  const [hoveredCell, setHoveredCell] = useState<{ x: number; y: number } | null>(null);
  const [hoveredTerrain, setHoveredTerrain] = useState<{ terrainType: string; hazardLevel: number } | null>(null);
  const [warpDialogOpen, setWarpDialogOpen] = useState(false);
  const [warpTarget, setWarpTarget] = useState<{ x: number; y: number } | null>(null);
  const [lastWarpOutcome, setLastWarpOutcome] = useState<WarpOutcome | null>(null);

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
      if (data.warpOutcome) {
        setLastWarpOutcome(data.warpOutcome);
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
        const cellValue = mapGrid.grid[y][x];
        
        // Terrain-based coloring (GAL-245)
        let cellColor = '#0f0f1e'; // void
        if (cellValue === 1) {
          cellColor = '#1a1a2e'; // space
        } else if (cellValue === 2) {
          cellColor = '#4a1a1a'; // plasma-storm (red tint)
        } else if (cellValue === 3) {
          cellColor = '#1a2a4a'; // nebula (blue tint)
        } else if (cellValue === 4) {
          cellColor = '#2a2a1a'; // asteroid-field (brown tint)
        }
        
        ctx.fillStyle = cellColor;
        ctx.fillRect(x * cellWidth, y * cellHeight, cellWidth, cellHeight);

        // Hazard badges for dangerous terrain
        if (cellValue === 2) {
          // Plasma storm - high hazard
          ctx.fillStyle = '#ff4444';
          ctx.beginPath();
          ctx.arc(x * cellWidth + 4, y * cellHeight + 4, 2, 0, Math.PI * 2);
          ctx.fill();
        } else if (cellValue === 3 || cellValue === 4) {
          // Nebula/Asteroid - medium hazard
          ctx.fillStyle = '#ffaa44';
          ctx.beginPath();
          ctx.arc(x * cellWidth + 4, y * cellHeight + 4, 1.5, 0, Math.PI * 2);
          ctx.fill();
        }

        // 호버된 셀 강조
        if (hoveredCell && hoveredCell.x === x && hoveredCell.y === y) {
          ctx.strokeStyle = '#00ffff';
          ctx.lineWidth = 2;
          ctx.strokeRect(x * cellWidth, y * cellHeight, cellWidth, cellHeight);
        }
      }
    }

    // Render warp error visualization (Manual P.31)
    if (lastWarpOutcome && lastWarpOutcome.errorVector && (lastWarpOutcome.errorVector.x !== 0 || lastWarpOutcome.errorVector.y !== 0)) {
      const finalX = Math.floor(lastWarpOutcome.finalDestination.x);
      const finalY = Math.floor(lastWarpOutcome.finalDestination.y);
      
      // Draw warning indicator at final destination
      ctx.strokeStyle = '#ff00ff';
      ctx.lineWidth = 2;
      ctx.strokeRect(finalX * cellWidth, finalY * cellHeight, cellWidth, cellHeight);
      
      // Draw error vector arrow (simplified)
      ctx.strokeStyle = '#ffaa00';
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 2]);
      ctx.beginPath();
      const centerX = finalX * cellWidth + cellWidth / 2;
      const centerY = finalY * cellHeight + cellHeight / 2;
      ctx.moveTo(centerX - lastWarpOutcome.errorVector.x * cellWidth, centerY - lastWarpOutcome.errorVector.y * cellHeight);
      ctx.lineTo(centerX, centerY);
      ctx.stroke();
      ctx.setLineDash([]);
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
        // Right-click or Shift+Click to open warp dialog
        if (e.button === 2 || e.shiftKey) {
          if (selectedFleet && characterId) {
            setWarpTarget({ x: gridX, y: gridY });
            setWarpDialogOpen(true);
          }
        } else {
          onCellClick?.(gridX, gridY);
        }
      }
    },
    [fleets, selectedFleet, characterId, onFleetClick, onCellClick]
  );

  // 마우스 이동 처리
  const handleCanvasMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!canvasRef.current || !mapGrid) return;

      const rect = canvasRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const gridX = Math.floor(mouseX / cellWidth);
      const gridY = Math.floor(mouseY / cellHeight);

      setHoveredCell({ x: gridX, y: gridY });

      // Fetch terrain info for hovered cell
      if (gridY >= 0 && gridY < mapGrid.gridSize.height && gridX >= 0 && gridX < mapGrid.gridSize.width) {
        const cellValue = mapGrid.grid[gridY][gridX];
        const terrainLookup: Record<number, { terrainType: string; hazardLevel: number }> = {
          0: { terrainType: 'void', hazardLevel: 10 },
          1: { terrainType: 'space', hazardLevel: 0 },
          2: { terrainType: 'plasma-storm', hazardLevel: 2 },
          3: { terrainType: 'nebula', hazardLevel: 1 },
          4: { terrainType: 'asteroid-field', hazardLevel: 1 },
        };
        setHoveredTerrain(terrainLookup[cellValue] || { terrainType: 'unknown', hazardLevel: 0 });
      }
    },
    [mapGrid]
  );

  // Handle warp dialog complete
  const handleWarpComplete = useCallback((result: any) => {
    if (result.warpOutcome) {
      setLastWarpOutcome(result.warpOutcome);
      
      // Show notification
      console.log('Warp executed:', result);
      
      // Clear after 10 seconds
      setTimeout(() => {
        setLastWarpOutcome(null);
      }, 10000);
    }
  }, []);

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

      {/* 정보 패널 - Terrain & Hazard Info */}
      {hoveredCell && hoveredTerrain && (
        <div className="absolute top-2 left-2 bg-black/90 text-white p-3 rounded-lg text-sm font-mono border border-white/20 pointer-events-none shadow-xl space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-gray-400">座標:</span>
            <span className="text-cyan-300 font-bold">({hoveredCell.x}, {hoveredCell.y})</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-400">地形:</span>
            <span className={cn(
              "font-bold",
              hoveredTerrain.hazardLevel >= 2 ? "text-red-400" : 
              hoveredTerrain.hazardLevel === 1 ? "text-yellow-400" : "text-green-400"
            )}>
              {hoveredTerrain.terrainType === 'space' ? '通常空間' :
               hoveredTerrain.terrainType === 'plasma-storm' ? 'プラズマ嵐' :
               hoveredTerrain.terrainType === 'nebula' ? '星雲' :
               hoveredTerrain.terrainType === 'asteroid-field' ? '小惑星帯' :
               hoveredTerrain.terrainType === 'void' ? '航行不能' : '未知'}
            </span>
          </div>
          {hoveredTerrain.hazardLevel > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-gray-400">危険:</span>
              <span className={cn(
                "font-bold",
                hoveredTerrain.hazardLevel >= 2 ? "text-red-400" : "text-yellow-400"
              )}>
                {hoveredTerrain.hazardLevel >= 2 ? '⚠️ 高' : hoveredTerrain.hazardLevel === 1 ? '⚡ 中' : '✓ 低'}
                {hoveredTerrain.hazardLevel > 0 && ` (±${hoveredTerrain.hazardLevel})`}
              </span>
            </div>
          )}
          {selectedFleet && characterId && (
            <div className="text-xs text-cyan-300 mt-2 pt-2 border-t border-white/10">
              💡 Shift+Click でワープ
            </div>
          )}
        </div>
      )}

      {/* 선택된 함대 정보 */}
      {selectedFleet && (
        <div className="absolute top-2 right-2 bg-black/90 text-white p-3 rounded-lg min-w-[220px] border border-white/20 shadow-xl">
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
                {selectedFleet.faction === 'empire' ? '제国' : '同盟'}
              </span>
            </div>
            <div>艦船数: <span className="font-mono text-blue-300">{selectedFleet.totalShips.toLocaleString()}</span></div>
            <div>現在位置: <span className="font-mono text-gray-300">({Math.floor(selectedFleet.strategicPosition.x)}, {Math.floor(selectedFleet.strategicPosition.y)})</span></div>
            {selectedFleet.destination && (
              <div>目標: <span className="font-mono text-cyan-300">({Math.floor(selectedFleet.destination.x)}, {Math.floor(selectedFleet.destination.y)})</span></div>
            )}
            <div>状態: <span className={cn(
              "font-bold",
              selectedFleet.isMoving ? "text-cyan-400" : "text-gray-300"
            )}>{selectedFleet.isMoving ? '🛸 移動中' : selectedFleet.status}</span></div>
            {selectedFleet.isInCombat && (
              <div className="text-red-500 font-bold animate-pulse">⚔️ 戦闘中</div>
            )}
            {characterId && !selectedFleet.isInCombat && (
              <button
                onClick={() => setWarpDialogOpen(true)}
                className="mt-2 w-full px-3 py-1.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded font-bold transition-all text-xs shadow-lg shadow-cyan-500/30"
              >
                🛸 ワープ航行
              </button>
            )}
          </div>
        </div>
      )}

      {/* Warp Error Outcome Display */}
      {lastWarpOutcome && (lastWarpOutcome.errorVector.x !== 0 || lastWarpOutcome.errorVector.y !== 0) && (
        <div className="absolute bottom-16 left-2 bg-orange-900/90 border-2 border-orange-500 text-white p-3 rounded-lg max-w-[280px] shadow-2xl animate-pulse">
          <div className="font-bold text-sm mb-1 flex items-center gap-2">
            <span className="text-xl">⚠️</span>
            <span>ワープ誤差発生!</span>
          </div>
          <div className="text-xs space-y-1">
            <div>誤差ベクトル: ({lastWarpOutcome.errorVector.x > 0 ? '+' : ''}{lastWarpOutcome.errorVector.x}, {lastWarpOutcome.errorVector.y > 0 ? '+' : ''}{lastWarpOutcome.errorVector.y})</div>
            <div>実際の到着: ({Math.floor(lastWarpOutcome.finalDestination.x)}, {Math.floor(lastWarpOutcome.finalDestination.y)})</div>
            <div className="text-orange-300 mt-1">地形: {lastWarpOutcome.terrainType}</div>
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

      {/* Warp Dialog */}
      {warpDialogOpen && selectedFleet && characterId && (
        <WarpDialog
          isOpen={warpDialogOpen}
          onClose={() => {
            setWarpDialogOpen(false);
            setWarpTarget(null);
          }}
          fleet={selectedFleet}
          targetCoordinates={warpTarget}
          sessionId={sessionId}
          characterId={characterId}
          onWarpComplete={handleWarpComplete}
        />
      )}
    </div>
  );
}
