'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useGin7Store } from '@/stores/gin7Store';
import { cn } from '@/lib/utils';
import { useGin7Telemetry } from '@/hooks/useGin7Telemetry';

// 참고: gin7manual.txt Chapter2 전략 게임 화면 설명 / 그리드

const CELL_SIZE = 24;

function factionColor(faction: string) {
  switch (faction) {
    case 'empire':
      return '#fcd34d';
    case 'alliance':
      return '#38bdf8';
    case 'phezzan':
      return '#f472b6';
    default:
      return '#94a3b8';
  }
}

export default function Gin7StrategicMap() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const miniMapRef = useRef<HTMLCanvasElement>(null);
  const strategic = useGin7Store((state) => state.strategic);
  const strategySnapshot = useGin7Store((state) => state.strategySnapshot);
  const hoveredCell = useGin7Store((state) => state.hoveredCell);
  const setHoveredCell = useGin7Store((state) => state.setHoveredCell);
  const selectFleet = useGin7Store((state) => state.selectFleet);
  const selectedFleetId = useGin7Store((state) => state.selectedFleetId);
  const recordLocalTelemetry = useGin7Store((state) => state.recordLocalTelemetry);

  useGin7Telemetry({
    scene: 'strategy',
    enabled: Boolean(strategic),
    sampleIntervalMs: 5000,
    onSample: (sample) => recordLocalTelemetry('strategy', sample),
  });

  useEffect(() => {
    if (!strategic || !canvasRef.current) return;
    const canvas = canvasRef.current;
    canvas.width = strategic.gridWidth * CELL_SIZE;
    canvas.height = strategic.gridHeight * CELL_SIZE;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#04060f';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    strategic.cells.forEach((cell) => {
      const px = cell.x * CELL_SIZE;
      const py = cell.y * CELL_SIZE;
      if (cell.type === 'impassable') {
        ctx.fillStyle = '#0f172a';
      } else if (cell.type === 'star_system') {
        ctx.fillStyle = '#1d2d54';
      } else {
        ctx.fillStyle = '#0b1120';
      }
      ctx.fillRect(px, py, CELL_SIZE, CELL_SIZE);

      if (cell.type === 'star_system') {
        ctx.fillStyle = '#ffffff';
        ctx.font = '10px var(--font-mono, monospace)';
        ctx.fillText(cell.label || '성계', px + 2, py + 12);
      }

      if (hoveredCell && hoveredCell.x === cell.x && hoveredCell.y === cell.y) {
        ctx.strokeStyle = '#0ea5e9';
        ctx.lineWidth = 2;
        ctx.strokeRect(px + 1, py + 1, CELL_SIZE - 2, CELL_SIZE - 2);
      }
    });

    ctx.strokeStyle = 'rgba(255,255,255,0.03)';
    ctx.lineWidth = 1;
    for (let x = 0; x <= strategic.gridWidth; x += 1) {
      ctx.beginPath();
      ctx.moveTo(x * CELL_SIZE, 0);
      ctx.lineTo(x * CELL_SIZE, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y <= strategic.gridHeight; y += 1) {
      ctx.beginPath();
      ctx.moveTo(0, y * CELL_SIZE);
      ctx.lineTo(canvas.width, y * CELL_SIZE);
      ctx.stroke();
    }

    strategic.fleets.forEach((fleet) => {
      ctx.fillStyle = factionColor(fleet.faction);
      const cx = fleet.x * CELL_SIZE + CELL_SIZE / 2;
      const cy = fleet.y * CELL_SIZE + CELL_SIZE / 2;
      ctx.beginPath();
      ctx.arc(cx, cy, fleet.isFlagship ? 8 : 5, 0, Math.PI * 2);
      ctx.fill();
      if (fleet.id === selectedFleetId) {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(cx, cy, 10, 0, Math.PI * 2);
        ctx.stroke();
      }
    });
  }, [strategic, hoveredCell, selectedFleetId]);

  useEffect(() => {
    if (!strategic || !miniMapRef.current) return;
    const canvas = miniMapRef.current;
    canvas.width = 200;
    canvas.height = 120;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#020617';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const scaleX = canvas.width / strategic.gridWidth;
    const scaleY = canvas.height / strategic.gridHeight;

    ctx.strokeStyle = '#1e293b';
    for (let x = 0; x <= strategic.gridWidth; x += 1) {
      ctx.beginPath();
      ctx.moveTo(x * scaleX, 0);
      ctx.lineTo(x * scaleX, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y <= strategic.gridHeight; y += 1) {
      ctx.beginPath();
      ctx.moveTo(0, y * scaleY);
      ctx.lineTo(canvas.width, y * scaleY);
      ctx.stroke();
    }

    strategic.fleets.forEach((fleet) => {
      ctx.fillStyle = factionColor(fleet.faction);
      ctx.fillRect(fleet.x * scaleX - 2, fleet.y * scaleY - 2, 4, 4);
    });

    ctx.strokeStyle = '#0ea5e9';
    ctx.strokeRect(
      strategic.viewport.x * scaleX,
      strategic.viewport.y * scaleY,
      scaleX * 8,
      scaleY * 6,
    );
  }, [strategic]);

  const mapMeta = strategySnapshot?.map.meta;
  const operationHotspots = strategySnapshot?.operationHotspots ?? [];

  const displayFleets = useMemo(() => {
    if (strategySnapshot?.fleets) {
      return strategySnapshot.fleets.map((fleet) => ({
        id: fleet.fleetId,
        name: fleet.name,
        status: fleet.status,
        detail: `함선 ${fleet.totalShips} · 사기 ${fleet.morale}`,
      }));
    }
    return (strategic?.fleets || []).map((fleet) => ({
      id: fleet.id,
      name: fleet.name,
      status: fleet.status,
      detail: `지휘 포인트 PCP ${fleet.cpLoad.pcp} / MCP ${fleet.cpLoad.mcp}`,
    }));
  }, [strategySnapshot, strategic]);

  const hoveredInfo = useMemo(() => {
    if (!strategic || !hoveredCell) return '좌표를 호버해서 정보를 확인하세요';
    const cell = strategic.cells.find((c) => c.x === hoveredCell.x && c.y === hoveredCell.y);
    if (!cell) return `${hoveredCell.x}, ${hoveredCell.y}`;
    const typeLabel = cell.type === 'star_system' ? '성계' : cell.type === 'impassable' ? '진입 불가' : '공간';
    return `${typeLabel} · (${cell.x}, ${cell.y}) ${cell.label || ''}`.trim();
  }, [strategic, hoveredCell]);

  const handleMouseMove: React.MouseEventHandler<HTMLCanvasElement> = (event) => {
    if (!canvasRef.current || !strategic) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const rawX = ((event.clientX - rect.left) / rect.width) * strategic.gridWidth;
    const rawY = ((event.clientY - rect.top) / rect.height) * strategic.gridHeight;
    const x = Math.max(0, Math.min(strategic.gridWidth - 1, Math.floor(rawX)));
    const y = Math.max(0, Math.min(strategic.gridHeight - 1, Math.floor(rawY)));
    setHoveredCell({ x, y });
  };

  const handleClick: React.MouseEventHandler<HTMLCanvasElement> = (event) => {
    if (!canvasRef.current || !strategic) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const rawX = ((event.clientX - rect.left) / rect.width) * strategic.gridWidth;
    const rawY = ((event.clientY - rect.top) / rect.height) * strategic.gridHeight;
    const x = Math.max(0, Math.min(strategic.gridWidth - 1, Math.floor(rawX)));
    const y = Math.max(0, Math.min(strategic.gridHeight - 1, Math.floor(rawY)));
    const fleet = strategic.fleets.find((f) => f.x === x && f.y === y);
    selectFleet(fleet ? fleet.id : null);
  };

  if (!strategic) {
    return (
      <div className="h-[520px] w-full rounded-3xl border border-white/5 bg-black/30" />
    );
  }

  return (
    <section className="rounded-3xl border border-white/10 bg-gradient-to-b from-[#030711] to-[#050b18] p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-white/50">메인 뷰</p>
          <h2 className="text-xl font-bold text-white">전략 그리드 투영</h2>
        </div>
        <div className="text-xs text-white/40">
          그리드 {strategic.gridWidth} × {strategic.gridHeight}
        </div>
      </div>

      {mapMeta && (
        <div className="grid gap-3 text-xs text-white/60 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-black/40 p-3">
            <p className="text-[11px] uppercase tracking-wide text-white/40">성계 수</p>
            <p className="mt-1 text-lg font-semibold text-white">{mapMeta.systemCount}</p>
            <p>워프 경로 {mapMeta.warpRouteCount}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/40 p-3">
            <p className="text-[11px] uppercase tracking-wide text-white/40">루프 평균</p>
            <p className="mt-1 text-lg font-semibold text-cyan-300">{strategySnapshot?.clock?.loopStats?.avgTickDurationMs ?? '—'}ms</p>
            <p>단계 {strategySnapshot?.clock?.phase || '—'}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/40 p-3">
            <p className="text-[11px] uppercase tracking-wide text-white/40">작전 수</p>
            <p className="mt-1 text-lg font-semibold text-white">{operationHotspots.length}</p>
            <p>발령 대기 중</p>
          </div>
        </div>
      )}

      <div className="relative rounded-2xl border border-white/5 bg-black/40 overflow-hidden">
        <canvas
          ref={canvasRef}
          data-testid="gin7-strategic-canvas"
          className="block w-full cursor-crosshair"
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoveredCell(null)}
          onClick={handleClick}
        />
        <div className="absolute left-4 bottom-4 rounded-xl bg-black/70 px-3 py-2 text-xs font-mono text-white shadow-lg">
          {hoveredInfo}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-white/10 bg-black/30 p-3">
          <p className="text-xs text-white/50 mb-2">은하 지도</p>
          <canvas ref={miniMapRef} className="w-full rounded-lg border border-white/5 bg-black/50" />
        </div>
        <div className="rounded-2xl border border-white/10 bg-black/30 p-3 col-span-2">
          <p className="text-xs text-white/50 mb-2">시스템 &amp; 메신저</p>
          <div className="grid grid-cols-2 gap-2 text-xs text-white/70">
            {displayFleets.map((fleet) => (
              <div key={fleet.id} className={cn('rounded-lg border border-white/5 p-2', fleet.id === selectedFleetId && 'border-cyan-400/60 bg-cyan-400/5')}>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-white">{fleet.name}</span>
                  <span className="text-[10px] text-white/50">{fleet.status?.toString().toUpperCase()}</span>
                </div>
                <div className="mt-1 text-[11px] text-white/50">
                  {fleet.detail}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {operationHotspots.length > 0 && (
        <div className="rounded-2xl border border-white/10 bg-black/30 p-4 text-xs text-white/70">
          <p className="text-[11px] uppercase tracking-wide text-white/40">예약된 작전</p>
          <div className="mt-2 space-y-2">
            {operationHotspots.map((op) => (
              <div key={op.operationId} className="rounded-xl border border-white/10 bg-black/20 px-3 py-2">
                <div className="flex items-center justify-between">
                  <span className="text-white font-semibold">{op.code}</span>
                  <span className="text-[10px] text-white/40">{op.status.toUpperCase()}</span>
                </div>
                <p className="text-white/60">{op.objectiveType} · 그리드 ({op.targetGrid.x}, {op.targetGrid.y})</p>
                <p className="text-white/40">발령 {op.issuedAt ? new Date(op.issuedAt).toLocaleString() : '—'} · 대기 {op.waitHours ?? 0}시간</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
