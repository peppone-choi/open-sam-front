'use client';

import { useEffect, useRef, useState } from 'react';
import { Application, Container, Graphics } from 'pixi.js';
import { IsoTransform, type IsoConfig, type GridPos } from '@/lib/tactical/isoTacticalMap';

export interface PureTacticalUnit {
  id: string;
  x: number; // 논리 그리드 X (0..logicalWidth-1)
  y: number; // 논리 그리드 Y (0..logicalHeight-1)
  color: number; // 0xRRGGBB
}

export interface PureTacticalMapProps {
  logicalWidth: number;
  logicalHeight: number;
  units: PureTacticalUnit[];
  onCellClick?: (x: number, y: number) => void;
  onUnitClick?: (unitId: string) => void;
}

/**
 * Pixi v8 + React 순수 전술맵 컴포넌트
 * - 외부 컨텍스트에 의존하지 않고
 * - 논리 그리드 + 유닛 배열만 받아서 렌더링
 */
export default function PureTacticalMap({
  logicalWidth,
  logicalHeight,
  units,
  onCellClick,
  onUnitClick,
}: PureTacticalMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const appRef = useRef<Application | null>(null);
  const unitsLayerRef = useRef<Container | null>(null);
  const isoRef = useRef<IsoTransform | null>(null);
  const [engineReady, setEngineReady] = useState(false);

  // Pixi Application 초기화
  useEffect(() => {
    let app: Application | null = null;
    let destroyed = false;

    (async () => {
      if (!containerRef.current) return;

      app = new Application();
      await app.init({
        background: 0x111827,
        width: 720,
        height: 720,
        antialias: true,
      });

      // 등각 변환 설정 (격자를 화면 중앙 근처에 배치)
      const isoConfig: IsoConfig = {
        tileWidth: 64,
        tileHeight: 32,
        originX: app.screen.width / 2,
        originY: 80,
      };
      isoRef.current = new IsoTransform(isoConfig);

      if (destroyed) {
        app.destroy(true);
        return;
      }

      appRef.current = app;

      // React div 안에 Pixi canvas 부착
      containerRef.current.innerHTML = '';
      containerRef.current.appendChild(app.canvas as HTMLCanvasElement);

      // 그리드 레이어 (등각)
      const grid = new Graphics();
      const iso = isoRef.current;
      if (iso) {
        drawIsoGrid(grid, iso, logicalWidth, logicalHeight);
      }
      app.stage.addChild(grid);

      // 유닛 레이어
      const unitsLayer = new Container();
      app.stage.addChild(unitsLayer);
      unitsLayerRef.current = unitsLayer;

      // 엔진 준비 완료 표시
      setEngineReady(true);
    })();

    return () => {
      destroyed = true;
      if (app) {
        app.destroy(true);
        app = null;
      }
      appRef.current = null;
      unitsLayerRef.current = null;
      isoRef.current = null;
      setEngineReady(false);
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [logicalWidth, logicalHeight]);

  // 유닛 렌더링
  useEffect(() => {
    const app = appRef.current;
    const unitsLayer = unitsLayerRef.current;
    const iso = isoRef.current;
    if (!app || !unitsLayer || !iso || !engineReady) return;

    unitsLayer.removeChildren();

    units.forEach((u) => {
      const g = new Graphics();

      // 논리 좌표 (u.x, u.y)를 등각 좌표로 변환
      const pos: GridPos = { row: u.y, col: u.x };
      const screen = iso.gridToScreen(pos);

      // 유닛을 입체 큐브처럼 그리기
      drawIsoCube(g, u.color);
      g.position.set(screen.x, screen.y);

      g.eventMode = 'static';
      g.cursor = 'pointer';
      g.on('pointerdown', () => {
        onUnitClick?.(u.id);
      });

      unitsLayer.addChild(g);
    });
  }, [units, logicalWidth, logicalHeight, onUnitClick, engineReady]);

function drawIsoCube(g: Graphics, baseColor: number) {
  g.clear();

  // isoTacticalMap의 config와 맞춰서 tileHeight=32 기준으로 잡는다
  const tileHeight = 32;
  const tileHalf = tileHeight / 2; // 16

  const hw = 18;               // 윗면 다이아몬드 반폭
  const hh = tileHalf * 0.5;   // 윗면 다이아몬드 반높이 (8)

  // 간단한 명암: 윗면, 왼쪽, 오른쪽
  const topColor = baseColor;
  const leftColor = shadeColor(baseColor, -0.25);
  const rightColor = shadeColor(baseColor, -0.4);

  // 타일 세로 범위: [-tileHalf, +tileHalf] => [-16, +16]
  // 윗 꼭짓점을 타일 위 꼭짓점에, 바닥을 타일 아래 꼭짓점에 맞춘다
  const topTop = -tileHalf;      // 윗 꼭짓점 y (-16)
  const topY = topTop + hh;      // 윗면 중심 y (-8)
  const baseY = tileHalf;        // 바닥 y (+16)

  // 윗면 (다이아몬드)
  g.beginFill(topColor);
  g.moveTo(0, topY - hh);        // topTop
  g.lineTo(hw, topY);
  g.lineTo(0, topY + hh);
  g.lineTo(-hw, topY);
  g.lineTo(0, topY - hh);
  g.endFill();

  // 아래쪽 폭은 약간만 줄여서 옆면이 안쪽으로 살짝 모이게
  const bottomShrink = 0.85;
  const bottomLeftX = -hw * bottomShrink;
  const bottomRightX = hw * bottomShrink;

  // 왼쪽 면 (평행사변형)
  g.beginFill(leftColor);
  g.moveTo(-hw, topY);           // top-left
  g.lineTo(0, topY + hh);        // top-inner
  g.lineTo(0, baseY);            // bottom-inner
  g.lineTo(bottomLeftX, baseY);  // bottom-left
  g.lineTo(-hw, topY);
  g.endFill();

  // 오른쪽 면
  g.beginFill(rightColor);
  g.moveTo(hw, topY);            // top-right
  g.lineTo(0, topY + hh);        // top-inner
  g.lineTo(0, baseY);            // bottom-inner
  g.lineTo(bottomRightX, baseY); // bottom-right
  g.lineTo(hw, topY);
  g.endFill();

  // 테두리 가볍게
  g.lineStyle(1, 0x000000, 0.6);
  // 윗면 외곽
  g.moveTo(0, topY - hh);
  g.lineTo(hw, topY);
  g.lineTo(0, topY + hh);
  g.lineTo(-hw, topY);
  g.lineTo(0, topY - hh);

  // 옆면 모서리
  g.moveTo(-hw, topY);
  g.lineTo(bottomLeftX, baseY);
  g.moveTo(hw, topY);
  g.lineTo(bottomRightX, baseY);
}



function shadeColor(color: number, percent: number): number {
  const r = (color >> 16) & 0xff;
  const g = (color >> 8) & 0xff;
  const b = color & 0xff;

  const t = percent < 0 ? 0 : 255;
  const p = Math.abs(percent);

  const nr = Math.round((t - r) * p) + r;
  const ng = Math.round((t - g) * p) + g;
  const nb = Math.round((t - b) * p) + b;

  return (nr << 16) | (ng << 8) | nb;
}

  // 전체 판 클릭 → 셀 좌표 계산
  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const app = appRef.current;
    if (!app) return;

    const rect = app.canvas.getBoundingClientRect();
    const scaleX = app.screen.width / rect.width;
    const scaleY = app.screen.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    const cellW = app.screen.width / logicalWidth;
    const cellH = app.screen.height / logicalHeight;

    const col = Math.floor(x / cellW);
    const row = Math.floor(y / cellH);

    if (col < 0 || col >= logicalWidth || row < 0 || row >= logicalHeight) return;

    onCellClick?.(col, row);
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
        margin: '0 auto',
      }}
    />
  );
}

function drawIsoGrid(
  g: Graphics,
  iso: IsoTransform,
  logicalW: number,
  logicalH: number,
) {
  g.clear();
  g.beginFill(0x111827);
  g.drawRect(0, 0, 720, 720);
  g.endFill();

  const lineColor = 0x4b5563;

  // 각 셀의 diamond를 그린다
  for (let row = 0; row < logicalH; row += 1) {
    for (let col = 0; col < logicalW; col += 1) {
      const center = iso.gridToScreen({ row, col });
      const hw = 32; // tileWidth / 2
      const hh = 16; // tileHeight / 2

      g
        .moveTo(center.x, center.y - hh)
        .lineTo(center.x + hw, center.y)
        .lineTo(center.x, center.y + hh)
        .lineTo(center.x - hw, center.y)
        .lineTo(center.x, center.y - hh)
        .stroke({ color: lineColor, width: 1, alpha: 0.8 });
    }
  }
}
