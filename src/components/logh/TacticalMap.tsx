'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useSocket } from '@/hooks/useSocket';
import { LOGH_TEXT } from '@/constants/uiText';

/**
 * LOGH Tactical Map Component (Optimized)
 * - Uses RequestAnimationFrame (RAF) for rendering
 * - Uses Refs for mutable state to avoid React re-render overhead on every frame
 * - Supports Multitouch (Pinch Zoom, Pan)
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

interface CameraState {
  x: number;
  y: number;
  zoom: number;
}

interface Props {
  sessionId: string;
  tacticalMapId: string;
  onClose?: () => void;
}

export default function TacticalMap({ sessionId, tacticalMapId, onClose }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Mutable state for the Render Loop (Avoids React Render Cycle)
  const fleetsRef = useRef<TacticalFleet[]>([]);
  const cameraRef = useRef<CameraState>({ x: 5000, y: 5000, zoom: 0.1 });
  const selectedFleetIdRef = useRef<string | null>(null);
  
  // React State for UI Overlays (Throttled updates)
  const [selectedFleet, setSelectedFleet] = useState<TacticalFleet | null>(null);
  const [fleetCount, setFleetCount] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(10); // Display percentage

  // Animation Frame ID
  const rafId = useRef<number>(0);

  // Touch Handling State
  const touchState = useRef({
    distance: 0, // for pinch
    startX: 0,
    startY: 0,
    isDragging: false
  });

  const canvasWidth = 1200;
  const canvasHeight = 800;

  // Socket.IO
  const { socket } = useSocket({ sessionId, autoConnect: true });

  // 1. Initial Data Load
  useEffect(() => {
    async function loadTacticalMapData() {
      try {
        const response = await fetch(
          `/api/logh/tactical-maps/${tacticalMapId}?sessionId=${sessionId}`
        );
        const result = await response.json();
        if (result.success) {
          fleetsRef.current = result.data.fleets || [];
          setFleetCount(fleetsRef.current.length);
        }
      } catch (error) {
        console.error('Failed to load tactical map data:', error);
      }
    }
    loadTacticalMapData();
  }, [sessionId, tacticalMapId]);

  // 2. Socket Listeners (Direct Ref Mutation)
  useEffect(() => {
    if (!socket) return;

    const handleStateUpdate = (data: any) => {
      if (data.combats) {
        const combat = data.combats.find(
          (c: any) => c.tacticalMapId === tacticalMapId
        );
        if (combat) {
          fleetsRef.current = combat.fleets;
          // Sync UI state occasionally or if selection changes
          if (selectedFleetIdRef.current) {
            const found = combat.fleets.find((f: TacticalFleet) => f.fleetId === selectedFleetIdRef.current);
            if (found) setSelectedFleet(found);
          }
          setFleetCount(combat.fleets.length);
        }
      }
    };

    const handleCombatEnd = (data: any) => {
      if (data.tacticalMapId === tacticalMapId) {
        alert(`전투 종료! 승자: ${data.result.winner}`);
        onClose?.();
      }
    };

    socket.on('game:state-update', handleStateUpdate);
    socket.on('combat:ended', handleCombatEnd);

    return () => {
      socket.off('game:state-update', handleStateUpdate);
      socket.off('combat:ended', handleCombatEnd);
    };
  }, [socket, tacticalMapId, onClose]);

  // 3. Render Loop (RAF)
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Use Refs
    const camera = cameraRef.current;
    const fleets = fleetsRef.current;

    // Clear
    ctx.fillStyle = '#050510'; // Theme Space BG
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Stars (Static Background Optimization could be done here with a second canvas, but keeping simple for now)
    ctx.fillStyle = '#ffffff';
    // Using a pseudo-random seed based on index to keep stars static would be better, 
    // but for now we just redraw. To optimize, we should cache this background.
    // For this demo, let's just draw grid instead to save perf on random math
    
    // Grid
    ctx.strokeStyle = '#1e293b'; // Theme border color
    ctx.lineWidth = 1;
    const gridSize = 1000 * camera.zoom;
    const offsetX = (canvasWidth / 2) - (camera.x * camera.zoom);
    const offsetY = (canvasHeight / 2) - (camera.y * camera.zoom);

    // Vertical Lines
    for (let x = 0; x <= 10000; x += 1000) {
        const screenX = x * camera.zoom + offsetX;
        if (screenX >= 0 && screenX <= canvasWidth) {
            ctx.beginPath();
            ctx.moveTo(screenX, 0);
            ctx.lineTo(screenX, canvasHeight);
            ctx.stroke();
        }
    }
    // Horizontal Lines
    for (let y = 0; y <= 10000; y += 1000) {
        const screenY = y * camera.zoom + offsetY;
        if (screenY >= 0 && screenY <= canvasHeight) {
            ctx.beginPath();
            ctx.moveTo(0, screenY);
            ctx.lineTo(canvasWidth, screenY);
            ctx.stroke();
        }
    }

    // Fleets
    fleets.forEach((fleet) => {
      if (!fleet.tacticalPosition) return;

      const screenX = (fleet.tacticalPosition.x - camera.x) * camera.zoom + canvasWidth / 2;
      const screenY = (fleet.tacticalPosition.y - camera.y) * camera.zoom + canvasHeight / 2;

      // Culling
      if (screenX < -50 || screenX > canvasWidth + 50 || screenY < -50 || screenY > canvasHeight + 50) return;

      const size = Math.max(5, Math.min(30, fleet.totalShips / 100));

      ctx.save();
      ctx.translate(screenX, screenY);
      ctx.rotate((fleet.tacticalPosition.heading * Math.PI) / 180);

      // Color based on simple hash or ID for now (Theme colors should ideally be applied here)
      ctx.fillStyle = fleet.fleetId.includes('Empire') ? '#C0C0C0' : '#4A5D23'; // Empire vs Alliance
      
      // Triangle Ship
      ctx.beginPath();
      ctx.moveTo(size, 0);
      ctx.lineTo(-size / 2, size / 2);
      ctx.lineTo(-size / 2, -size / 2);
      ctx.closePath();
      ctx.fill();

      // Selection Ring
      if (selectedFleetIdRef.current === fleet.fleetId) {
        ctx.strokeStyle = '#FFD700'; // Gold selection
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, size + 5, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.restore();

      // Label
      if (camera.zoom > 0.08) {
        ctx.fillStyle = '#E0E0E0';
        ctx.font = '10px JetBrains Mono'; // Theme Monospace
        ctx.textAlign = 'center';
        ctx.fillText(fleet.fleetId.substring(0, 8), screenX, screenY + size + 15);
      }
    });

    rafId.current = requestAnimationFrame(render);
  }, []); // Dependencies are empty because we use Refs

  useEffect(() => {
    // Start Loop
    const canvas = canvasRef.current;
    if (canvas) {
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;
    }
    rafId.current = requestAnimationFrame(render);
    return () => cancelAnimationFrame(rafId.current);
  }, [render]);


  // 4. Input Handlers
  const handleWheel = useCallback((e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const newZoom = Math.max(0.01, Math.min(2.0, cameraRef.current.zoom + e.deltaY * -0.001));
    cameraRef.current.zoom = newZoom;
    setZoomLevel(Math.round(newZoom * 100)); // Update UI
  }, []);

  const handlePointerDown = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const isTouch = 'touches' in e;
    
    // Multi-touch Pinch Check
    if (isTouch && (e as React.TouchEvent).touches.length === 2) {
        const touch1 = (e as React.TouchEvent).touches[0];
        const touch2 = (e as React.TouchEvent).touches[1];
        const dist = Math.hypot(touch1.clientX - touch2.clientX, touch1.clientY - touch2.clientY);
        touchState.current.distance = dist;
        return;
    }

    const clientX = isTouch ? (e as React.TouchEvent).touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = isTouch ? (e as React.TouchEvent).touches[0].clientY : (e as React.MouseEvent).clientY;

    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    
    // Pan Start
    touchState.current.startX = clientX;
    touchState.current.startY = clientY;
    touchState.current.isDragging = true;

    // Check Click/Tap Selection
    const mouseX = clientX - rect.left;
    const mouseY = clientY - rect.top;
    const worldX = (mouseX - canvasWidth / 2) / cameraRef.current.zoom + cameraRef.current.x;
    const worldY = (mouseY - canvasHeight / 2) / cameraRef.current.zoom + cameraRef.current.y;

    const clickedFleet = fleetsRef.current.find((f) => {
        if (!f.tacticalPosition) return false;
        const dx = f.tacticalPosition.x - worldX;
        const dy = f.tacticalPosition.y - worldY;
        return Math.sqrt(dx * dx + dy * dy) < 200;
    });

    if (clickedFleet) {
        selectedFleetIdRef.current = clickedFleet.fleetId;
        setSelectedFleet(clickedFleet); // Trigger UI update
    } else {
        // Only deselect if not dragging (handled in move/up)
    }

    // Right Click Move Command
    if (!isTouch && (e as React.MouseEvent).button === 2 && selectedFleetIdRef.current && socket) {
        e.preventDefault();
        socket.emit('fleet:tactical-move', {
            fleetId: selectedFleetIdRef.current,
            x: worldX,
            y: worldY,
        });
    }
  }, [socket]);

  const handlePointerMove = useCallback((e: React.MouseEvent | React.TouchEvent) => {
     // Pinch Zoom
     if ('touches' in e && (e as React.TouchEvent).touches.length === 2) {
        const touch1 = (e as React.TouchEvent).touches[0];
        const touch2 = (e as React.TouchEvent).touches[1];
        const dist = Math.hypot(touch1.clientX - touch2.clientX, touch1.clientY - touch2.clientY);
        
        if (touchState.current.distance > 0) {
            const delta = dist - touchState.current.distance;
            const newZoom = Math.max(0.01, Math.min(2.0, cameraRef.current.zoom + delta * 0.005));
            cameraRef.current.zoom = newZoom;
            setZoomLevel(Math.round(newZoom * 100));
        }
        touchState.current.distance = dist;
        return;
     }

     if (!touchState.current.isDragging) return;

     const clientX = 'touches' in e ? (e as React.TouchEvent).touches[0].clientX : (e as React.MouseEvent).clientX;
     const clientY = 'touches' in e ? (e as React.TouchEvent).touches[0].clientY : (e as React.MouseEvent).clientY;

     const dx = (clientX - touchState.current.startX) / cameraRef.current.zoom;
     const dy = (clientY - touchState.current.startY) / cameraRef.current.zoom;

     cameraRef.current.x -= dx;
     cameraRef.current.y -= dy;

     touchState.current.startX = clientX;
     touchState.current.startY = clientY;
  }, []);

  const handlePointerUp = useCallback(() => {
    touchState.current.isDragging = false;
    touchState.current.distance = 0;
  }, []);

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
      <div className="relative w-full max-w-6xl bg-space-panel border border-white/20 rounded-xl overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex justify-between items-center p-4 bg-gray-800/50 backdrop-blur border-b border-white/10">
           <h3 className="text-lg font-bold text-white font-serif">Tactical Map <span className="text-sm font-mono text-gray-400">ID: {tacticalMapId}</span></h3>
           <button
             onClick={onClose}
             className="bg-hud-alert hover:bg-red-700 text-white px-4 py-2 rounded text-sm font-bold transition-colors font-mono"
           >
             CLOSE LINK
           </button>
        </div>

        <div className="relative">
          <canvas
            ref={canvasRef}
            data-testid="tactical-map-canvas"
            onMouseDown={handlePointerDown}
            onMouseMove={handlePointerMove}
            onMouseUp={handlePointerUp}
            onMouseLeave={handlePointerUp}
            onTouchStart={handlePointerDown}
            onTouchMove={handlePointerMove}
            onTouchEnd={handlePointerUp}
            onWheel={handleWheel}
            onContextMenu={(e) => e.preventDefault()}
            className="cursor-crosshair block w-full h-auto touch-none"
            style={{ height: '600px', backgroundColor: '#050510' }}
          />

          {/* HUD Overlay */}
          <div className="absolute bottom-4 left-4 pointer-events-none">
             <div className="bg-space-panel/90 text-space-text p-3 rounded border border-white/10 backdrop-blur-sm space-y-1">
               <div className="font-mono text-xs text-hud-success">SYS: ONLINE</div>
               <div className="font-mono text-xs">FLEETS: {fleetCount}</div>
               <div className="font-mono text-xs">ZOOM: {zoomLevel}%</div>
             </div>
          </div>

          {/* Selected Fleet Info */}
          {selectedFleet && (
            <div className="absolute top-4 right-4 bg-space-panel/90 text-space-text p-4 rounded min-w-[200px] border border-alliance-red/50 shadow-xl backdrop-blur-sm">
              <div className="font-bold mb-2 text-alliance-red border-b border-white/10 pb-1 font-mono">
                 {selectedFleet.fleetId}
              </div>
              <div className="text-sm space-y-1.5 font-mono">
                <div className="flex justify-between">
                   <span className="text-gray-400">SHIPS</span>
                   <span>{selectedFleet.totalShips.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                   <span className="text-gray-400">FORM</span>
                   <span className="text-yellow-400">{selectedFleet.formation}</span>
                </div>
                {selectedFleet.tacticalPosition && (
                  <div className="text-xs text-gray-500 mt-2 pt-2 border-t border-white/5 text-center">
                    POS: {Math.floor(selectedFleet.tacticalPosition.x)}, {Math.floor(selectedFleet.tacticalPosition.y)}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
