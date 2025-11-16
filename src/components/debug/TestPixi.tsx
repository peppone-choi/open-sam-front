'use client';

import { useEffect, useRef } from 'react';
import { Application, Graphics } from 'pixi.js';

/**
 * Pixi v8 + React 전술맵 최소 예제
 * - 10x10 그리드 + 네모 1개만 올려서
 * - 전술판 기본 렌더링이 정상인지 확인용
 */
export default function TestPixi() {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let app: Application | null = null;
    let destroyed = false;

    (async () => {
      if (!containerRef.current) return;

      // Pixi v8 권장 패턴: 생성 후 init 호출
      app = new Application();
      await app.init({
        background: 0x111827,
        width: 480,
        height: 480,
        antialias: true,
      });

      if (destroyed) {
        app.destroy(true);
        return;
      }

      // React div 안에 Pixi가 만든 canvas를 붙인다
      containerRef.current.innerHTML = '';
      containerRef.current.appendChild(app.canvas as HTMLCanvasElement);

      // 10x10 그리드 그리기
      const grid = new Graphics();
      const logicalSize = 10;
      const cellW = app.screen.width / logicalSize;
      const cellH = app.screen.height / logicalSize;

      // Pixi v8 스타일: 각 선마다 stroke 호출
      // 선이 확실히 보이도록 흰색 + 두껍게
      const lineColor = 0xffffff;

      // 세로선
      for (let c = 0; c <= logicalSize; c += 1) {
        const x = c * cellW;
        grid
          .moveTo(x, 0)
          .lineTo(x, app.screen.height)
          .stroke({ color: lineColor, width: 1.5, alpha: 0.9 });
      }

      // 가로선
      for (let r = 0; r <= logicalSize; r += 1) {
        const y = r * cellH;
        grid
          .moveTo(0, y)
          .lineTo(app.screen.width, y)
          .stroke({ color: lineColor, width: 1.5, alpha: 0.9 });
      }

      app.stage.addChild(grid);

      // 전술 유닛 하나 (파란 네모)
      const unit = new Graphics();
      unit.beginFill(0x3b82f6);
      unit.drawRoundedRect(-12, -12, 24, 24, 4);
      unit.endFill();

      unit.lineStyle(1, 0x000000, 0.9);
      unit.drawRoundedRect(-12, -12, 24, 24, 4);

      // 논리 좌표 (3, 4) 위치에 배치
      const ux = (3 + 0.5) * cellW;
      const uy = (4 + 0.5) * cellH;
      unit.position.set(ux, uy);

      app.stage.addChild(unit);
    })();

    return () => {
      destroyed = true;
      if (app) {
        app.destroy(true);
        app = null;
      }
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        maxWidth: 480,
        height: 480,
        border: '1px solid #4b5563',
        borderRadius: 8,
        overflow: 'hidden',
        background: '#020617',
        margin: '0 auto',
      }}
    />
  );
}
