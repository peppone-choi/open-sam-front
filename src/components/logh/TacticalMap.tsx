'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useSocket } from '@/hooks/useSocket';

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
      ctx.fillRect(x, y, 1, 1);
    }

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
      ctx.fillText(fleet.fleetId.substring(0, 8), screenX + size + 5, screenY);
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
    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center">
      <div className="relative">
        {/* 닫기 버튼 */}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 z-10"
        >
          전술 맵 닫기
        </button>

        {/* 캔버스 */}
        <canvas
          ref={canvasRef}
          onClick={handleCanvasClick}
          onContextMenu={(e) => {
            e.preventDefault();
            handleCanvasClick(e as any);
          }}
          onWheel={handleWheel}
          className="border border-gray-700 cursor-crosshair"
        />

        {/* 안내 텍스트 */}
        <div className="absolute bottom-2 left-2 bg-black bg-opacity-80 text-white p-2 rounded text-sm">
          <div>좌클릭: 함대 선택</div>
          <div>우클릭: 이동 명령</div>
          <div>휠: 확대/축소</div>
        </div>

        {/* 선택된 함대 정보 */}
        {selectedFleet && (
          <div className="absolute top-16 right-2 bg-black bg-opacity-90 text-white p-3 rounded">
            <div className="font-bold mb-2">{selectedFleet.fleetId}</div>
            <div className="text-sm space-y-1">
              <div>함선: {selectedFleet.totalShips.toLocaleString()}</div>
              <div>진형: {selectedFleet.formation}</div>
              {selectedFleet.tacticalPosition && (
                <div className="text-xs text-gray-400">
                  ({Math.floor(selectedFleet.tacticalPosition.x)},{' '}
                  {Math.floor(selectedFleet.tacticalPosition.y)})
                </div>
              )}
            </div>
          </div>
        )}

        {/* 줌 레벨 */}
        <div className="absolute bottom-2 right-2 bg-black bg-opacity-80 text-white px-2 py-1 rounded text-xs">
          줌: {(camera.zoom * 100).toFixed(0)}%
        </div>
      </div>
    </div>
  );
}
