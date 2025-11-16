'use client';

import React, { useEffect, useRef } from 'react';
import * as PIXI from 'pixi.js';

/**
 * Pixi 기반 추상적인 평화 시 성/도시 장면
 * - 큰 사각형: 성벽/성 내부
 * - 안쪽 작은 사각형/원: 건물/나무
 * - 작은 원들이 천천히 돌아다니는 사람들
 */

export default function PeacefulCastleScene() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const appRef = useRef<PIXI.Application | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const width = 640;
    const height = 360;

    const app = new PIXI.Application({
      width,
      height,
      background: 0x050814,
      antialias: true,
    });

    appRef.current = app;
    containerRef.current.appendChild(app.view as HTMLCanvasElement);

    const stage = app.stage;

    // 성벽/성 내부 (큰 사각형)
    const castle = new PIXI.Graphics();
    castle.beginFill(0x1f2937); // 진한 회색 성벽
    castle.drawRoundedRect(40, 40, width - 80, height - 80, 16);
    castle.endFill();
    stage.addChild(castle);

    // 안쪽 마당
    const yard = new PIXI.Graphics();
    yard.beginFill(0x111827);
    yard.drawRoundedRect(70, 70, width - 140, height - 140, 12);
    yard.endFill();
    stage.addChild(yard);

    // 간단한 건물/장식 (사각형/원 몇 개)
    const decoLayer = new PIXI.Container();
    stage.addChild(decoLayer);

    const addBuilding = (x: number, y: number, w: number, h: number, color: number) => {
      const g = new PIXI.Graphics();
      g.beginFill(color);
      g.drawRoundedRect(x, y, w, h, 4);
      g.endFill();
      decoLayer.addChild(g);
    };

    addBuilding(90, 90, 80, 40, 0x374151);
    addBuilding(width - 90 - 80, 90, 80, 40, 0x374151);
    addBuilding(90, height - 90 - 40, 80, 40, 0x374151);
    addBuilding(width - 90 - 80, height - 90 - 40, 80, 40, 0x374151);

    const addTree = (x: number, y: number) => {
      const g = new PIXI.Graphics();
      g.beginFill(0x14532d);
      g.drawCircle(0, 0, 6);
      g.endFill();
      g.x = x;
      g.y = y;
      decoLayer.addChild(g);
    };

    addTree(width / 2 - 40, height / 2);
    addTree(width / 2 + 40, height / 2 + 10);
    addTree(width / 2, height / 2 - 30);

    // 사람들 (작은 원들이 랜덤 경로로 천천히 움직임)
    type Walker = {
      gfx: PIXI.Graphics;
      speed: number;
      angle: number;
      centerX: number;
      centerY: number;
      radius: number;
      offset: number;
    };

    const walkers: Walker[] = [];
    const peopleLayer = new PIXI.Container();
    stage.addChild(peopleLayer);

    const createWalker = () => {
      const gfx = new PIXI.Graphics();
      gfx.beginFill(0xf9fafb);
      gfx.drawCircle(0, 0, 3);
      gfx.endFill();

      const centerX = 70 + Math.random() * (width - 140);
      const centerY = 70 + Math.random() * (height - 140);
      const radius = 10 + Math.random() * 40;
      const speed = 0.2 + Math.random() * 0.5;
      const angle = Math.random() * Math.PI * 2;
      const offset = Math.random() * Math.PI * 2;

      const walker: Walker = {
        gfx,
        speed,
        angle,
        centerX,
        centerY,
        radius,
        offset,
      };

      peopleLayer.addChild(gfx);
      walkers.push(walker);
    };

    for (let i = 0; i < 20; i++) {
      createWalker();
    }

    // 업데이트 루프
    app.ticker.add((delta) => {
      walkers.forEach((w) => {
        w.angle += (w.speed * delta) / 60;
        const a = w.angle + w.offset;
        w.gfx.x = w.centerX + Math.cos(a) * w.radius;
        w.gfx.y = w.centerY + Math.sin(a) * w.radius;
      });
    });

    // 리사이즈 대응: 뷰포트 너비에 맞춰 스케일 조정
    const resize = () => {
      if (!containerRef.current) return;
      const parentWidth = containerRef.current.clientWidth || width;
      const scale = Math.min(1, parentWidth / width);
      app.view.style.width = `${width * scale}px`;
      app.view.style.height = `${height * scale}px`;
    };

    resize();
    window.addEventListener('resize', resize);

    return () => {
      window.removeEventListener('resize', resize);
      const appAny = app as any;
      if (appAny && appAny.renderer && !appAny._destroyed) {
        appAny.destroy(true, { children: true });
      }
      appRef.current = null;
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        maxWidth: 800,
        margin: '0 auto',
        border: '1px solid #4b5563',
        borderRadius: 8,
        overflow: 'hidden',
        background: '#020617',
      }}
    />
  );
}
