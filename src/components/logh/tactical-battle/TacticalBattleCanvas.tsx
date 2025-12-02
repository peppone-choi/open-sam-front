'use client';

/**
 * TacticalBattleCanvas.tsx
 * 은하영웅전설 스타일 실시간 전술 맵 Canvas 컴포넌트
 * 
 * 기능:
 * - 10000x10000 연속좌표 전술 맵
 * - 함대 아이콘 (진형별 모양)
 * - 실시간 이동 애니메이션 (WebSocket)
 * - 사정거리 원 표시
 * - 줌/팬/박스 선택
 * - 60fps 렌더링
 */

import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { useSocket } from '@/hooks/useSocket';
import {
  Fleet,
  Camera,
  Position,
  BattleEffect,
  Formation,
  CommandType,
  MAP_SIZE,
  MIN_ZOOM,
  MAX_ZOOM,
  DEFAULT_ZOOM,
  COLORS,
} from './types';
import {
  worldToScreen,
  screenToWorld,
  generateStars,
  drawSpaceBackground,
  drawGrid,
  drawFleet,
  drawLaserEffect,
  drawExplosionEffect,
  hitTestFleet,
  findFleetsInBox,
} from './utils';
import { FleetHUD } from './FleetHUD';
import { CommandPanel } from './CommandPanel';
import { MiniMap } from './MiniMap';

// ===== Props =====
interface TacticalBattleCanvasProps {
  sessionId: string;
  battleId: string;
  playerId?: string;
  playerFaction?: 'empire' | 'alliance';
  initialFleets?: Fleet[];
  onClose?: () => void;
  onBattleEnd?: (winner: string) => void;
}

// ===== 내부 상태 타입 =====
interface TouchState {
  distance: number;
  startX: number;
  startY: number;
  isDragging: boolean;
  isPanning: boolean;
  isBoxSelecting: boolean;
  boxStartWorld: Position;
  boxEndWorld: Position;
  lastClickTime: number;
  lastClickFleetId: string | null;
  ctrlPressed: boolean;
  commandMode: CommandType | null;
}

// ===== 컴포넌트 =====
export default function TacticalBattleCanvas({
  sessionId,
  battleId,
  playerId,
  playerFaction = 'alliance',
  initialFleets = [],
  onClose,
  onBattleEnd,
}: TacticalBattleCanvasProps) {
  // Canvas 참조
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // 뮤터블 상태 (렌더링 루프용)
  const fleetsRef = useRef<Fleet[]>(initialFleets);
  const cameraRef = useRef<Camera>({ x: MAP_SIZE / 2, y: MAP_SIZE / 2, zoom: DEFAULT_ZOOM });
  const selectedFleetIdsRef = useRef<Set<string>>(new Set());
  const effectsRef = useRef<BattleEffect[]>([]);
  const starsRef = useRef<Position[]>([]);
  const rafIdRef = useRef<number>(0);
  
  // 터치/마우스 상태
  const touchState = useRef<TouchState>({
    distance: 0,
    startX: 0,
    startY: 0,
    isDragging: false,
    isPanning: false,
    isBoxSelecting: false,
    boxStartWorld: { x: 0, y: 0 },
    boxEndWorld: { x: 0, y: 0 },
    lastClickTime: 0,
    lastClickFleetId: null,
    ctrlPressed: false,
    commandMode: null,
  });
  
  // React 상태 (UI용)
  const [selectedFleets, setSelectedFleets] = useState<Fleet[]>([]);
  const [hoveredFleet, setHoveredFleet] = useState<Fleet | null>(null);
  const [zoomLevel, setZoomLevel] = useState(Math.round(DEFAULT_ZOOM * 100));
  const [fleetCount, setFleetCount] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [commandMode, setCommandMode] = useState<CommandType | null>(null);
  const [showMinimap, setShowMinimap] = useState(true);
  
  // Canvas 크기
  const [canvasSize, setCanvasSize] = useState({ width: 1400, height: 900 });
  
  // 별 생성 (초기화)
  useEffect(() => {
    starsRef.current = generateStars(500);
  }, []);
  
  // Canvas 크기 조정
  useEffect(() => {
    function handleResize() {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setCanvasSize({
          width: Math.floor(rect.width),
          height: Math.floor(rect.height),
        });
      }
    }
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Socket.IO 연결
  const { socket } = useSocket({ sessionId, autoConnect: true });
  
  // 초기 데이터 로드
  useEffect(() => {
    async function loadBattleData() {
      try {
        const response = await fetch(
          `/api/logh/battles/${battleId}?sessionId=${sessionId}`
        );
        const result = await response.json();
        if (result.success && result.data?.fleets) {
          fleetsRef.current = result.data.fleets;
          setFleetCount(result.data.fleets.length);
        }
      } catch (error) {
        console.error('[TacticalBattle] Failed to load battle data:', error);
      }
    }
    
    if (initialFleets.length === 0) {
      loadBattleData();
    } else {
      fleetsRef.current = initialFleets;
      setFleetCount(initialFleets.length);
    }
  }, [sessionId, battleId, initialFleets]);
  
  // Socket 이벤트 리스너
  useEffect(() => {
    if (!socket) return;
    
    const handleStateUpdate = (data: any) => {
      if (data.battleId === battleId && data.fleets) {
        fleetsRef.current = data.fleets;
        setFleetCount(data.fleets.length);
        
        // 선택된 함대 정보 업데이트
        if (selectedFleetIdsRef.current.size > 0) {
          const selectedList = data.fleets.filter((f: Fleet) =>
            selectedFleetIdsRef.current.has(f.id)
          );
          setSelectedFleets(selectedList);
        }
      }
    };
    
    const handleBattleEnd = (data: any) => {
      if (data.battleId === battleId) {
        onBattleEnd?.(data.winner);
      }
    };
    
    const handleEffect = (data: any) => {
      if (data.battleId === battleId) {
        effectsRef.current.push({
          id: `effect-${Date.now()}`,
          type: data.type,
          startPosition: data.startPosition,
          endPosition: data.endPosition,
          startTime: Date.now(),
          duration: data.duration || 500,
          color: data.color || COLORS.neonRed,
        });
      }
    };
    
    socket.on('battle:state-update', handleStateUpdate);
    socket.on('battle:ended', handleBattleEnd);
    socket.on('battle:effect', handleEffect);
    
    return () => {
      socket.off('battle:state-update', handleStateUpdate);
      socket.off('battle:ended', handleBattleEnd);
      socket.off('battle:effect', handleEffect);
    };
  }, [socket, battleId, onBattleEnd]);
  
  // ===== 렌더링 루프 =====
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const { width, height } = canvasSize;
    const camera = cameraRef.current;
    const fleets = fleetsRef.current;
    const stars = starsRef.current;
    const effects = effectsRef.current;
    
    // 배경
    drawSpaceBackground(ctx, camera, stars, width, height);
    
    // 그리드
    drawGrid(ctx, camera, width, height);
    
    // 함대 렌더링
    fleets.forEach((fleet) => {
      const isSelected = selectedFleetIdsRef.current.has(fleet.id);
      drawFleet(ctx, fleet, camera, width, height, isSelected, isSelected);
    });
    
    // 이펙트 렌더링
    const currentTime = Date.now();
    effectsRef.current = effects.filter((effect) => {
      const elapsed = currentTime - effect.startTime;
      const progress = elapsed / effect.duration;
      
      if (progress >= 1) return false;
      
      if (effect.type === 'laser' && effect.endPosition) {
        drawLaserEffect(
          ctx,
          effect.startPosition,
          effect.endPosition,
          camera,
          width,
          height,
          progress,
          effect.color
        );
      } else if (effect.type === 'explosion') {
        drawExplosionEffect(
          ctx,
          effect.startPosition,
          camera,
          width,
          height,
          progress
        );
      }
      
      return true;
    });
    
    // 박스 선택 렌더링
    if (touchState.current.isBoxSelecting) {
      const startScreen = worldToScreen(
        touchState.current.boxStartWorld,
        camera,
        width,
        height
      );
      const endScreen = worldToScreen(
        touchState.current.boxEndWorld,
        camera,
        width,
        height
      );
      
      ctx.strokeStyle = COLORS.neonGreen;
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 6]);
      ctx.strokeRect(
        startScreen.x,
        startScreen.y,
        endScreen.x - startScreen.x,
        endScreen.y - startScreen.y
      );
      ctx.setLineDash([]);
      
      ctx.fillStyle = 'rgba(0, 255, 136, 0.1)';
      ctx.fillRect(
        startScreen.x,
        startScreen.y,
        endScreen.x - startScreen.x,
        endScreen.y - startScreen.y
      );
    }
    
    // 명령 모드 커서 표시
    if (commandMode === 'move' || commandMode === 'attack') {
      ctx.fillStyle = commandMode === 'move' ? COLORS.neonGreen : COLORS.neonRed;
      ctx.font = '14px monospace';
      ctx.fillText(
        commandMode === 'move' ? '📍 이동 위치 클릭' : '🎯 공격 대상 클릭',
        20,
        height - 20
      );
    }
    
    rafIdRef.current = requestAnimationFrame(render);
  }, [canvasSize, commandMode]);
  
  // 렌더링 루프 시작
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.width = canvasSize.width;
      canvas.height = canvasSize.height;
    }
    
    rafIdRef.current = requestAnimationFrame(render);
    return () => cancelAnimationFrame(rafIdRef.current);
  }, [render, canvasSize]);
  
  // ===== 입력 핸들러 =====
  
  // 휠 줌
  const handleWheel = useCallback((e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, cameraRef.current.zoom + delta * cameraRef.current.zoom));
    cameraRef.current.zoom = newZoom;
    setZoomLevel(Math.round(newZoom * 100));
  }, []);
  
  // 마우스 다운
  const handlePointerDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const worldPos = screenToWorld(
      { x: mouseX, y: mouseY },
      cameraRef.current,
      canvasSize.width,
      canvasSize.height
    );
    
    touchState.current.ctrlPressed = e.ctrlKey || e.metaKey;
    
    // 오른쪽 클릭: 이동 명령
    if (e.button === 2 && selectedFleetIdsRef.current.size > 0 && socket) {
      e.preventDefault();
      selectedFleetIdsRef.current.forEach((fleetId) => {
        socket.emit('fleet:tactical-move', {
          battleId,
          fleetId,
          x: worldPos.x,
          y: worldPos.y,
        });
      });
      return;
    }
    
    // 명령 모드 처리
    if (commandMode === 'move' && selectedFleetIdsRef.current.size > 0 && socket) {
      selectedFleetIdsRef.current.forEach((fleetId) => {
        socket.emit('fleet:tactical-move', {
          battleId,
          fleetId,
          x: worldPos.x,
          y: worldPos.y,
        });
      });
      setCommandMode(null);
      touchState.current.commandMode = null;
      return;
    }
    
    if (commandMode === 'attack') {
      const targetFleet = fleetsRef.current.find((f) =>
        hitTestFleet(mouseX, mouseY, f, cameraRef.current, canvasSize.width, canvasSize.height)
      );
      
      if (targetFleet && targetFleet.faction !== playerFaction && socket) {
        selectedFleetIdsRef.current.forEach((fleetId) => {
          socket.emit('fleet:tactical-attack', {
            battleId,
            fleetId,
            targetFleetId: targetFleet.id,
          });
        });
      }
      setCommandMode(null);
      touchState.current.commandMode = null;
      return;
    }
    
    // 왼쪽 클릭
    if (e.button === 0) {
      // 함대 클릭 체크
      const clickedFleet = fleetsRef.current.find((f) =>
        hitTestFleet(mouseX, mouseY, f, cameraRef.current, canvasSize.width, canvasSize.height)
      );
      
      // 더블 클릭 감지
      const currentTime = Date.now();
      const isDoubleClick =
        currentTime - touchState.current.lastClickTime < 300 &&
        touchState.current.lastClickFleetId === clickedFleet?.id;
      
      touchState.current.lastClickTime = currentTime;
      touchState.current.lastClickFleetId = clickedFleet?.id || null;
      
      if (isDoubleClick && clickedFleet) {
        // 더블 클릭: 기함이면 같은 진영 전체 선택
        if (clickedFleet.isFlagship) {
          const friendlyFleets = fleetsRef.current.filter(
            (f) => f.faction === clickedFleet.faction
          );
          selectedFleetIdsRef.current.clear();
          friendlyFleets.forEach((f) => selectedFleetIdsRef.current.add(f.id));
          setSelectedFleets(friendlyFleets);
        } else {
          // 카메라 포커스
          cameraRef.current.x = clickedFleet.tacticalPosition.x;
          cameraRef.current.y = clickedFleet.tacticalPosition.y;
        }
        return;
      }
      
      if (clickedFleet) {
        // Ctrl+클릭: 토글 선택
        if (touchState.current.ctrlPressed) {
          if (selectedFleetIdsRef.current.has(clickedFleet.id)) {
            selectedFleetIdsRef.current.delete(clickedFleet.id);
          } else {
            selectedFleetIdsRef.current.add(clickedFleet.id);
          }
        } else {
          // 일반 클릭: 단일 선택
          selectedFleetIdsRef.current.clear();
          selectedFleetIdsRef.current.add(clickedFleet.id);
        }
        
        const selectedList = fleetsRef.current.filter((f) =>
          selectedFleetIdsRef.current.has(f.id)
        );
        setSelectedFleets(selectedList);
      } else {
        // 빈 공간 클릭: 박스 선택 또는 패닝
        touchState.current.startX = e.clientX;
        touchState.current.startY = e.clientY;
        touchState.current.isDragging = true;
        
        if (e.shiftKey) {
          // Shift: 박스 선택
          touchState.current.isBoxSelecting = true;
          touchState.current.boxStartWorld = worldPos;
          touchState.current.boxEndWorld = worldPos;
        } else {
          // 일반: 패닝
          touchState.current.isPanning = true;
        }
        
        // Ctrl 없이 빈 공간 클릭: 선택 해제
        if (!touchState.current.ctrlPressed && !e.shiftKey) {
          selectedFleetIdsRef.current.clear();
          setSelectedFleets([]);
        }
      }
    }
  }, [socket, battleId, canvasSize, commandMode, playerFaction]);
  
  // 마우스 이동
  const handlePointerMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    // 호버 함대 체크
    const hovered = fleetsRef.current.find((f) =>
      hitTestFleet(mouseX, mouseY, f, cameraRef.current, canvasSize.width, canvasSize.height)
    );
    setHoveredFleet(hovered || null);
    
    // 드래그 중
    if (touchState.current.isDragging) {
      if (touchState.current.isPanning) {
        // 패닝
        const dx = (e.clientX - touchState.current.startX) / cameraRef.current.zoom;
        const dy = (e.clientY - touchState.current.startY) / cameraRef.current.zoom;
        
        cameraRef.current.x -= dx;
        cameraRef.current.y -= dy;
        
        // 경계 제한
        cameraRef.current.x = Math.max(0, Math.min(MAP_SIZE, cameraRef.current.x));
        cameraRef.current.y = Math.max(0, Math.min(MAP_SIZE, cameraRef.current.y));
        
        touchState.current.startX = e.clientX;
        touchState.current.startY = e.clientY;
      } else if (touchState.current.isBoxSelecting) {
        // 박스 선택
        const worldPos = screenToWorld(
          { x: mouseX, y: mouseY },
          cameraRef.current,
          canvasSize.width,
          canvasSize.height
        );
        touchState.current.boxEndWorld = worldPos;
      }
    }
  }, [canvasSize]);
  
  // 마우스 업
  const handlePointerUp = useCallback(() => {
    if (touchState.current.isBoxSelecting) {
      // 박스 선택 완료
      const fleetsInBox = findFleetsInBox(
        fleetsRef.current,
        touchState.current.boxStartWorld,
        touchState.current.boxEndWorld
      );
      
      if (touchState.current.ctrlPressed) {
        fleetsInBox.forEach((f) => selectedFleetIdsRef.current.add(f.id));
      } else {
        selectedFleetIdsRef.current.clear();
        fleetsInBox.forEach((f) => selectedFleetIdsRef.current.add(f.id));
      }
      
      const selectedList = fleetsRef.current.filter((f) =>
        selectedFleetIdsRef.current.has(f.id)
      );
      setSelectedFleets(selectedList);
    }
    
    touchState.current.isDragging = false;
    touchState.current.isPanning = false;
    touchState.current.isBoxSelecting = false;
  }, []);
  
  // 키보드 단축키
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!socket || selectedFleetIdsRef.current.size === 0) {
        // ESC로 명령 모드 취소
        if (e.key === 'Escape') {
          setCommandMode(null);
          touchState.current.commandMode = null;
        }
        return;
      }
      
      const key = e.key.toLowerCase();
      const selectedIds = Array.from(selectedFleetIdsRef.current);
      
      switch (key) {
        case 'f': // 이동
          setCommandMode('move');
          touchState.current.commandMode = 'move';
          break;
          
        case 'd': // 평행이동
          selectedIds.forEach((fleetId) => {
            socket.emit('fleet:tactical-command', {
              battleId,
              fleetId,
              command: 'parallelMove',
            });
          });
          break;
          
        case 's': // 선회
          selectedIds.forEach((fleetId) => {
            socket.emit('fleet:tactical-command', {
              battleId,
              fleetId,
              command: 'turn',
            });
          });
          break;
          
        case 'a': // 정지
          selectedIds.forEach((fleetId) => {
            socket.emit('fleet:tactical-command', {
              battleId,
              fleetId,
              command: 'stop',
            });
          });
          break;
          
        case 'r': // 공격
          setCommandMode('attack');
          touchState.current.commandMode = 'attack';
          break;
          
        case 'e': // 일제 사격
          selectedIds.forEach((fleetId) => {
            socket.emit('fleet:tactical-command', {
              battleId,
              fleetId,
              command: 'volleyAttack',
            });
          });
          break;
          
        case 'w': // 연속 공격
          selectedIds.forEach((fleetId) => {
            socket.emit('fleet:tactical-command', {
              battleId,
              fleetId,
              command: 'continuousAttack',
            });
          });
          break;
          
        case 'q': // 공격 중지
          selectedIds.forEach((fleetId) => {
            socket.emit('fleet:tactical-command', {
              battleId,
              fleetId,
              command: 'stopAttack',
            });
          });
          break;
          
        case 'z': // 진형 변경
          selectedIds.forEach((fleetId) => {
            socket.emit('fleet:tactical-command', {
              battleId,
              fleetId,
              command: 'changeFormation',
            });
          });
          break;
          
        case 't': // 후퇴
          selectedIds.forEach((fleetId) => {
            socket.emit('fleet:tactical-command', {
              battleId,
              fleetId,
              command: 'retreat',
            });
          });
          break;
          
        case 'escape':
          setCommandMode(null);
          touchState.current.commandMode = null;
          selectedFleetIdsRef.current.clear();
          setSelectedFleets([]);
          break;
          
        case ' ': // 일시정지
          setIsPaused((p) => !p);
          socket.emit('battle:toggle-pause', { battleId });
          break;
          
        default:
          return;
      }
      
      e.preventDefault();
    },
    [socket, battleId]
  );
  
  // 키보드 이벤트 등록
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
  
  // ===== 명령 핸들러 =====
  const handleCommand = useCallback(
    (command: CommandType, data?: any) => {
      if (!socket) return;
      
      const selectedIds = Array.from(selectedFleetIdsRef.current);
      if (selectedIds.length === 0) return;
      
      switch (command) {
        case 'move':
          setCommandMode('move');
          break;
          
        case 'attack':
          setCommandMode('attack');
          break;
          
        case 'changeFormation':
          if (data?.formation) {
            selectedIds.forEach((fleetId) => {
              socket.emit('fleet:change-formation', {
                battleId,
                fleetId,
                formation: data.formation,
              });
            });
          }
          break;
          
        case 'retreat':
          selectedIds.forEach((fleetId) => {
            socket.emit('fleet:tactical-command', {
              battleId,
              fleetId,
              command: 'retreat',
            });
          });
          break;
          
        default:
          selectedIds.forEach((fleetId) => {
            socket.emit('fleet:tactical-command', {
              battleId,
              fleetId,
              command,
            });
          });
      }
    },
    [socket, battleId]
  );
  
  // 미니맵 클릭 핸들러
  const handleMinimapClick = useCallback((pos: Position) => {
    cameraRef.current.x = pos.x;
    cameraRef.current.y = pos.y;
  }, []);
  
  // 줌 컨트롤
  const handleZoomIn = useCallback(() => {
    const newZoom = Math.min(MAX_ZOOM, cameraRef.current.zoom * 1.2);
    cameraRef.current.zoom = newZoom;
    setZoomLevel(Math.round(newZoom * 100));
  }, []);
  
  const handleZoomOut = useCallback(() => {
    const newZoom = Math.max(MIN_ZOOM, cameraRef.current.zoom / 1.2);
    cameraRef.current.zoom = newZoom;
    setZoomLevel(Math.round(newZoom * 100));
  }, []);
  
  // 메모이즈된 선택 함대
  const primarySelectedFleet = useMemo(() => {
    return selectedFleets.length > 0 ? selectedFleets[0] : null;
  }, [selectedFleets]);
  
  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* 헤더 */}
      <header className="flex items-center justify-between px-4 py-2 bg-gradient-to-r from-[#0a0a1a] via-[#1a1a3a] to-[#0a0a1a] border-b border-cyan-500/30">
        <div className="flex items-center gap-4">
          <h1 className="text-cyan-400 font-bold text-lg tracking-wider">
            TACTICAL BATTLE
          </h1>
          <span className="text-gray-500 font-mono text-sm">
            ID: {battleId.substring(0, 8)}
          </span>
          {isPaused && (
            <span className="text-yellow-400 font-mono text-sm animate-pulse">
              ▌▌ PAUSED
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowMinimap((s) => !s)}
            className={`px-3 py-1 rounded text-sm font-mono transition-colors ${
              showMinimap
                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50'
                : 'bg-gray-800 text-gray-400 border border-gray-700'
            }`}
          >
            MINIMAP
          </button>
          <button
            onClick={onClose}
            className="px-4 py-1 bg-red-500/20 hover:bg-red-500/40 text-red-400 border border-red-500/50 rounded text-sm font-mono transition-colors"
          >
            EXIT
          </button>
        </div>
      </header>
      
      {/* 메인 영역 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 좌측: 함대 HUD */}
        <aside className="w-72 bg-[#0a0a1a]/90 border-r border-cyan-500/20 overflow-y-auto">
          <FleetHUD
            selectedFleets={selectedFleets}
            hoveredFleet={hoveredFleet}
            playerFaction={playerFaction}
          />
        </aside>
        
        {/* 중앙: Canvas */}
        <main ref={containerRef} className="flex-1 relative">
          <canvas
            ref={canvasRef}
            className="block w-full h-full cursor-crosshair touch-none"
            style={{ backgroundColor: '#050510' }}
            onMouseDown={handlePointerDown}
            onMouseMove={handlePointerMove}
            onMouseUp={handlePointerUp}
            onMouseLeave={handlePointerUp}
            onWheel={handleWheel}
            onContextMenu={(e) => e.preventDefault()}
          />
          
          {/* 줌 컨트롤 */}
          <div className="absolute bottom-4 right-4 flex flex-col gap-2">
            <button
              onClick={handleZoomIn}
              className="w-10 h-10 bg-[#0a0a1a]/80 border border-cyan-500/50 text-cyan-400 rounded-lg flex items-center justify-center text-xl font-bold hover:bg-cyan-500/20 transition-colors shadow-lg shadow-cyan-500/20"
            >
              +
            </button>
            <div className="text-center text-cyan-400 font-mono text-xs py-1">
              {zoomLevel}%
            </div>
            <button
              onClick={handleZoomOut}
              className="w-10 h-10 bg-[#0a0a1a]/80 border border-cyan-500/50 text-cyan-400 rounded-lg flex items-center justify-center text-xl font-bold hover:bg-cyan-500/20 transition-colors shadow-lg shadow-cyan-500/20"
            >
              −
            </button>
          </div>
          
          {/* 상태 표시 */}
          <div className="absolute top-4 left-4 bg-[#0a0a1a]/80 border border-cyan-500/30 rounded-lg px-3 py-2 backdrop-blur-sm">
            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-green-400">ONLINE</span>
            </div>
            <div className="text-gray-400 text-xs font-mono mt-1">
              FLEETS: {fleetCount}
            </div>
            <div className="text-gray-400 text-xs font-mono">
              SELECTED: {selectedFleets.length}
            </div>
          </div>
          
          {/* 미니맵 */}
          {showMinimap && (
            <div className="absolute top-4 right-4">
              <MiniMap
                fleets={fleetsRef.current}
                camera={cameraRef.current}
                selectedFleetIds={selectedFleetIdsRef.current}
                canvasSize={canvasSize}
                onClick={handleMinimapClick}
              />
            </div>
          )}
          
          {/* 단축키 힌트 */}
          <div className="absolute bottom-4 left-4 bg-[#0a0a1a]/70 border border-gray-700 rounded-lg px-3 py-2 backdrop-blur-sm">
            <div className="text-gray-500 text-xs font-mono">
              <div>F: Move | R: Attack | A: Stop</div>
              <div>E: Volley | W: Continuous | Q: Stop Attack</div>
              <div>Z: Formation | T: Retreat | Space: Pause</div>
              <div className="text-gray-600 mt-1">
                Shift+Drag: Box Select | Ctrl+Click: Multi-Select
              </div>
            </div>
          </div>
        </main>
        
        {/* 우측: 명령 패널 */}
        <aside className="w-64 bg-[#0a0a1a]/90 border-l border-cyan-500/20">
          <CommandPanel
            selectedFleets={selectedFleets}
            commandMode={commandMode}
            onCommand={handleCommand}
            onCancelCommand={() => {
              setCommandMode(null);
              touchState.current.commandMode = null;
            }}
          />
        </aside>
      </div>
    </div>
  );
}




