'use client';

import React, { useEffect, useRef, useCallback, useMemo } from 'react';
import type { BattleUnit } from './BattleMap';
import {
  Application as PixiApplication,
  Graphics as PixiGraphics,
  Container as PixiContainer,
  type Application,
  type Graphics,
  type Container,
} from 'pixi.js';

interface IsoTacticalBattleMapProps {
  width: number; // 논리 그리드 폭 (예: 40)
  height: number; // 논리 그리드 높이 (예: 40)
  units: BattleUnit[];
  selectedUnitId?: string | null;
  onUnitClick?: (unit: BattleUnit) => void;
  onCellClick?: (x: number, y: number) => void;
}

/**
 * Graphics 오브젝트 풀 - Pixi Graphics 재사용
 * 매 프레임마다 new Graphics() 대신 풀에서 가져옴
 */
class GraphicsPool {
  private available: Graphics[] = [];
  private inUse: Set<Graphics> = new Set();
  
  acquire(): Graphics {
    let g = this.available.pop();
    if (!g) {
      g = new PixiGraphics();
    }
    this.inUse.add(g);
    return g;
  }
  
  release(g: Graphics): void {
    if (!this.inUse.has(g)) return;
    this.inUse.delete(g);
    g.clear();
    g.removeAllListeners();
    this.available.push(g);
  }
  
  releaseAll(container: Container): void {
    // 컨테이너의 모든 자식을 풀로 반환
    while (container.children.length > 0) {
      const child = container.children[0];
      container.removeChild(child);
      if (child instanceof PixiGraphics) {
        this.release(child);
      }
    }
  }
  
  destroy(): void {
    this.available.forEach(g => g.destroy());
    this.inUse.forEach(g => g.destroy());
    this.available = [];
    this.inUse.clear();
  }
  
  get stats() {
    return {
      available: this.available.length,
      inUse: this.inUse.size,
    };
  }
}

export default function IsoTacticalBattleMap({
  width,
  height,
  units,
  selectedUnitId,
  onUnitClick,
  onCellClick,
}: IsoTacticalBattleMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const appRef = useRef<Application | null>(null);
  const unitsLayerRef = useRef<Container | null>(null);
  const graphicsPoolRef = useRef<GraphicsPool | null>(null);

  // Pixi Application 초기화 (v8 패턴)
  useEffect(() => {
    let app: Application | null = null;
    let destroyed = false;
    console.log('[IsoTacticalBattleMap] init effect start');
    const init = async () => {
      if (!containerRef.current) return;

      const pixiApp = new PixiApplication();
      await pixiApp.init({
        background: 0x1f2937,
        width: 720,
        height: 720,
        antialias: true,
      });
      console.log('[IsoTacticalBattleMap] Pixi app initialized', pixiApp.screen.width, pixiApp.screen.height);

      if (destroyed) {
        pixiApp.destroy(true);
        return;
      }

      app = pixiApp;
      appRef.current = pixiApp;

      // React div 안에 Pixi가 만든 canvas를 붙인다
      containerRef.current.innerHTML = '';
      containerRef.current.appendChild(pixiApp.canvas as HTMLCanvasElement);
      console.log('[IsoTacticalBattleMap] canvas attached to DOM');

      // 그리드 레이어 + 유닛 레이어 구성
      const gridLayer: Graphics = new PixiGraphics();
      drawGrid(gridLayer, pixiApp.screen.width, pixiApp.screen.height, width, height);
      pixiApp.stage.addChild(gridLayer);
      console.log('[IsoTacticalBattleMap] grid drawn');

      const unitsLayer: Container = new PixiContainer();
      pixiApp.stage.addChild(unitsLayer);
      unitsLayerRef.current = unitsLayer;
      
      // Graphics 풀 초기화
      graphicsPoolRef.current = new GraphicsPool();
    };

    init();

    return () => {
      destroyed = true;
      
      // 풀 정리
      if (graphicsPoolRef.current) {
        graphicsPoolRef.current.destroy();
        graphicsPoolRef.current = null;
      }
      
      if (app) {
        app.destroy(true);
        app = null;
      }
      appRef.current = null;
      unitsLayerRef.current = null;
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [width, height]);

  // 유닛 반영 (풀링 사용)
  useEffect(() => {
    const app = appRef.current;
    const unitsLayer = unitsLayerRef.current;
    const pool = graphicsPoolRef.current;
    if (!app || !unitsLayer || !pool) return;

    const W = app.screen.width;
    const H = app.screen.height;
    const cellW = W / width;
    const cellH = H / height;

    // 기존 Graphics를 풀로 반환 (destroy 대신 재활용)
    pool.releaseAll(unitsLayer);

    units.forEach((unit) => {
      // 풀에서 Graphics 가져오기
      const g = pool.acquire();

      const color = getUnitColor(unit);
      const isSelected = selectedUnitId === unit.id;
      
      // 네모 하나
      g.beginFill(color);
      g.drawRoundedRect(-10, -10, 20, 20, 4);
      g.endFill();

      // 선택된 유닛 강조
      const strokeColor = isSelected ? 0xffffff : 0x000000;
      const strokeWidth = isSelected ? 2 : 1;
      g.lineStyle(strokeWidth, strokeColor, 0.8);
      g.drawRoundedRect(-10, -10, 20, 20, 4);

      // 논리 좌표 (unit.x, unit.y)를 Pixi 좌표로 매핑
      const x = (unit.x + 0.5) * cellW;
      const y = (unit.y + 0.5) * cellH;

      g.position.set(x, y);
      g.eventMode = 'static';
      g.cursor = 'pointer';
      g.on('pointerdown', () => {
        if (onUnitClick) {
          onUnitClick(unit);
        }
      });

      unitsLayer.addChild(g);
    });
  }, [units, width, height, selectedUnitId, onUnitClick]);

  // 캔버스 클릭 → 셀 좌표 계산
  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const app = appRef.current;
    if (!app) return;

    const rect = app.canvas.getBoundingClientRect();
    const scaleX = app.screen.width / rect.width;
    const scaleY = app.screen.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    const cellW = app.screen.width / width;
    const cellH = app.screen.height / height;

    const col = Math.floor(x / cellW);
    const row = Math.floor(y / cellH);

    if (col < 0 || col >= width || row < 0 || row >= height) return;

    if (onCellClick) {
      onCellClick(col, row);
    }
  };

  return (
    <div
      ref={containerRef}
      onClick={handleClick}
      style={{
        width: '100%',
        maxWidth: 720,
        height: 720,
        border: '1px solid #4b5563',
        borderRadius: 8,
        overflow: 'hidden',
        background: '#020617',
        cursor: 'pointer',
      }}
    />
  );
}

// 그리드 그리기 (논리 width x height)
function drawGrid(
  g: Graphics,
  canvasW: number,
  canvasH: number,
  logicalW: number,
  logicalH: number,
) {
  const cellW = canvasW / logicalW;
  const cellH = canvasH / logicalH;

  g.clear();
  g.beginFill(0x1f2937);
  g.drawRect(0, 0, canvasW, canvasH);
  g.endFill();

  const lineColor = 0xffffff;

  // 세로선
  for (let c = 0; c <= logicalW; c += 1) {
    const x = c * cellW;
    g
      .moveTo(x, 0)
      .lineTo(x, canvasH)
      .stroke({ color: lineColor, width: 1, alpha: 0.4 });
  }

  // 가로선
  for (let r = 0; r <= logicalH; r += 1) {
    const y = r * cellH;
    g
      .moveTo(0, y)
      .lineTo(canvasW, y)
      .stroke({ color: lineColor, width: 1, alpha: 0.4 });
  }
}


function getUnitColor(unit: BattleUnit): number {
  const isAttacker = unit.type === 'attacker';
  const elite = (unit.leadership || 0) >= 90;

  if (isAttacker) {
    if (elite) return 0x22c55e; // 공격군 엘리트: 녹색
    return 0x3b82f6; // 공격군 일반: 파랑
  }
  if (elite) return 0xf97316; // 방어군 엘리트: 주황
  return 0xef4444; // 방어군 일반: 빨강
}
