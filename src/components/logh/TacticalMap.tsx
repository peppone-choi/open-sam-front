'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useSocket } from '@/hooks/useSocket';
import { cn } from '@/lib/utils';
import { LOGH_TEXT } from '@/constants/uiText';

/**
 * LOGH Tactical Map Component
 * 10000x10000 전술 맵 (실수 좌표계)
 */

interface TacticalFleet {
  fleetId: string;
  tacticalPosition?: {
    x: number;
    y: number;
    heading: number;
  };
  totalShips: number;
  formation: string;
}

interface Props {
  sessionId: string;
  tacticalMapId: string;
  onClose?: () => void;
}

export default function TacticalMap({ sessionId, tacticalMapId, onClose }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fleets, setFleets] = useState<TacticalFleet[]>([]);
  const [selectedFleet, setSelectedFleet] = useState<TacticalFleet | null>(null);
  const [camera, setCamera] = useState({ x: 5000, y: 5000, zoom: 0.1 });

  const canvasWidth = 1200;
  const canvasHeight = 800;

  // Socket.IO
  const { socket } = useSocket({ sessionId, autoConnect: true });

  // 전술 맵 데이터 로드
  useEffect(() => {
    loadTacticalMapData();
  }, [tacticalMapId]);

  // WebSocket 이벤트 수신
  useEffect(() => {
    if (!socket) return;

    socket.on('game:state-update', (data: any) => {
      if (data.combats) {
        const combat = data.combats.find(
          (c: any) => c.tacticalMapId === tacticalMapId
        );
        if (combat) {
          setFleets(combat.fleets);
        }
      }
    });

    socket.on('combat:ended', (data: any) => {
      if (data.tacticalMapId === tacticalMapId) {
        alert(`전투 종료! 승자: ${data.result.winner}`);
        onClose?.();
      }
    });

    return () => {
      socket.off('game:state-update');
      socket.off('combat:ended');
    };
  }, [socket, tacticalMapId, onClose]);

  async function loadTacticalMapData() {
    try {
      const response = await fetch(
        `/api/logh/tactical-maps/${tacticalMapId}?sessionId=${sessionId}`
      );
      const result = await response.json();
      if (result.success) {
        setFleets(result.data.fleets);
      }
    } catch (error) {
      console.error('Failed to load tactical map data:', error);
    }
  }

  // 캔버스 렌더링
  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    // 배경
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 별 배경 (간단)
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 100; i++) {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      ctx.globalAlpha = Math.random() * 0.8 + 0.2;
      ctx.fillRect(x, y, 1, 1);
    }
    ctx.globalAlpha = 1.0;

    // 그리드 (옵션)
    ctx.strokeStyle = '#222222';
    ctx.lineWidth = 1;
    for (let i = 0; i < 10; i++) {
      const x = (i / 10) * canvas.width;
      const y = (i / 10) * canvas.height;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    // 함대 렌더링
    fleets.forEach((fleet) => {
      if (!fleet.tacticalPosition) return;

      // 월드 좌표 → 스크린 좌표 변환
      const screenX =
        ((fleet.tacticalPosition.x - camera.x) * camera.zoom +
          canvasWidth / 2);
      const screenY =
        ((fleet.tacticalPosition.y - camera.y) * camera.zoom +
          canvasHeight / 2);

      // 화면 밖이면 스킵
      if (
        screenX < -50 ||
        screenX > canvasWidth + 50 ||
        screenY < -50 ||
        screenY > canvasHeight + 50
      ) {
        return;
      }

      // 함대 크기 (함선 수에 비례)
      const size = Math.max(5, Math.min(30, fleet.totalShips / 100));

      // 함대 색상 (진영별)
      // TODO: 진영 정보 추가 필요
      ctx.fillStyle = '#00ccff';

      // 함대 그리기 (삼각형)
      ctx.save();
      ctx.translate(screenX, screenY);
      ctx.rotate((fleet.tacticalPosition.heading * Math.PI) / 180);

      ctx.beginPath();
      ctx.moveTo(size, 0);
      ctx.lineTo(-size / 2, size / 2);
      ctx.lineTo(-size / 2, -size / 2);
      ctx.closePath();
      ctx.fill();

      // 선택된 함대 강조
      if (selectedFleet && selectedFleet.fleetId === fleet.fleetId) {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, size + 5, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.restore();

      // 함대 이름 (옵션)
      ctx.fillStyle = '#ffffff';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(fleet.fleetId.substring(0, 8), screenX, screenY + size + 15);
    });
  }, [fleets, camera, selectedFleet]);

  // 마우스 클릭 처리
  const handleCanvasClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!canvasRef.current) return;

      const rect = canvasRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      // 스크린 좌표 → 월드 좌표 변환
      const worldX = (mouseX - canvasWidth / 2) / camera.zoom + camera.x;
      const worldY = (mouseY - canvasHeight / 2) / camera.zoom + camera.y;

      // 우클릭: 선택된 함대 이동
      if (e.button === 2 && selectedFleet && socket) {
        e.preventDefault();
        socket.emit('fleet:tactical-move', {
          fleetId: selectedFleet.fleetId,
          x: worldX,
          y: worldY,
        });
        return;
      }

      // 좌클릭: 함대 선택
      const clickedFleet = fleets.find((f) => {
        if (!f.tacticalPosition) return false;
        const dx = f.tacticalPosition.x - worldX;
        const dy = f.tacticalPosition.y - worldY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < 200; // 클릭 허용 범위
      });

      if (clickedFleet) {
        setSelectedFleet(clickedFleet);
      }
    },
    [fleets, selectedFleet, camera, socket]
  );

  // 마우스 휠 줌
  const handleWheel = useCallback((e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    setCamera((prev) => ({
      ...prev,
      zoom: Math.max(0.05, Math.min(1, prev.zoom + e.deltaY * -0.001)),
    }));
  }, []);

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
      <div className="relative w-full max-w-6xl bg-gray-900 border border-gray-800 rounded-xl overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex justify-between items-center p-4 bg-gray-800 border-b border-gray-700">
           <h3 className="text-lg font-bold text-white">전술 지도 (Tactical Map)</h3>
           <button
             onClick={onClose}
             className="bg-red-600/80 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors"
           >
             전투 종료 / 닫기
           </button>
        </div>

        <div className="relative">
          {/* 캔버스 */}
          <canvas
            ref={canvasRef}
            data-testid="tactical-map-canvas"
            onClick={handleCanvasClick}
            onContextMenu={(e) => {
              e.preventDefault();
              handleCanvasClick(e as any);
            }}
            onWheel={handleWheel}
            className="cursor-crosshair block w-full h-auto"
            style={{
               height: '600px',
               backgroundColor: '#000000'
            }}
          />

          {/* 안내 텍스트 */}
          <div className="absolute bottom-4 left-4 bg-black/80 text-gray-300 p-3 rounded-lg text-xs border border-white/10 backdrop-blur-sm">
            <div className="flex items-center gap-2"><span className="text-blue-400">{LOGH_TEXT.pointerGuide.leftClick.label}</span> {LOGH_TEXT.pointerGuide.leftClick.action}</div>
            <div className="flex items-center gap-2"><span className="text-red-400">{LOGH_TEXT.pointerGuide.rightClick.label}</span> {LOGH_TEXT.pointerGuide.rightClick.action}</div>
            <div className="flex items-center gap-2"><span className="text-yellow-400">{LOGH_TEXT.pointerGuide.wheel.label}</span> {LOGH_TEXT.pointerGuide.wheel.action}</div>
          </div>

          {/* 선택된 함대 정보 */}
          {selectedFleet && (
            <div className="absolute top-4 right-4 bg-black/90 text-white p-4 rounded-lg min-w-[200px] border border-blue-500/30 shadow-xl backdrop-blur-sm">
              <div className="font-bold mb-2 text-blue-300 border-b border-white/10 pb-1">
                 {selectedFleet.fleetId}
              </div>
              <div className="text-sm space-y-1.5">
                <div className="flex justify-between">
                   <span className="text-gray-400">함선</span>
                   <span className="font-mono">{selectedFleet.totalShips.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                   <span className="text-gray-400">진형</span>
                   <span className="text-yellow-400">{selectedFleet.formation}</span>
                </div>
                {selectedFleet.tacticalPosition && (
                  <div className="text-xs text-gray-500 mt-2 pt-2 border-t border-white/5 font-mono text-center">
                    {LOGH_TEXT.positionLabel}: {Math.floor(selectedFleet.tacticalPosition.x)}, {Math.floor(selectedFleet.tacticalPosition.y)}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 줌 레벨 */}
          <div className="absolute bottom-4 right-4 bg-black/80 text-white px-3 py-1.5 rounded-full text-xs border border-white/10 font-mono">
            {LOGH_TEXT.zoomPrefix}: {(camera.zoom * 100).toFixed(0)}%
          </div>
        </div>
      </div>
    </div>
  );
}
