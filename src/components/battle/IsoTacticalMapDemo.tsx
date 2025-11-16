'use client';

import React, { useEffect, useRef } from 'react';
import type { UnitInstance, UnitVisualConfig } from '@/lib/tactical/isoTacticalMap';
import { IsoTacticalMapEngine } from '@/lib/tactical/isoTacticalMap';

/**
 * IsoTacticalMapEngine 기반 전술맵 데모 컴포넌트
 * - 고정 크기 캔버스에 몇 개의 예시 유닛을 배치해서 바로 확인용
 */

export default function IsoTacticalMapDemo() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<IsoTacticalMapEngine | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // 고정 데모 해상도 (나중에 필요하면 props로 뺄 수 있음)
    const width = 640;
    const height = 360;

    const engine = new IsoTacticalMapEngine({
      canvas,
      width,
      height,
    });

    engineRef.current = engine;

    // 간단한 데모 유닛 구성 (한 vs 황건 적군 느낌)
    const demoUnits: UnitInstance[] = createDemoUnits();
    demoUnits.forEach((unit) => {
      engine.upsertUnit(unit);
    });

    return () => {
      engine.destroy();
      engineRef.current = null;
    };
  }, []);

  return (
    <div
      style={{
        width: '100%',
        maxWidth: 720,
        margin: '0 auto',
        border: '1px solid #4b5563',
        borderRadius: 8,
        overflow: 'hidden',
        background: '#020617',
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          display: 'block',
          width: '100%',
          height: 'auto',
        }}
      />
    </div>
  );
}

function createDemoUnits(): UnitInstance[] {
  const hanInfantry: UnitVisualConfig = {
    id: 'han-infantry',
    role: 'infantry',
    cultureTags: ['Han'],
    isElite: false,
  };

  const hanEliteCavalry: UnitVisualConfig = {
    id: 'han-elite-cavalry',
    role: 'cavalry',
    cultureTags: ['Han'],
    isElite: true,
  };

  const yellowTurbanSpear: UnitVisualConfig = {
    id: 'yellow-turban-spear',
    role: 'spear',
    cultureTags: ['YellowTurban'],
    isElite: false,
  };

  const yellowTurbanArcher: UnitVisualConfig = {
    id: 'yellow-turban-archer',
    role: 'archer',
    cultureTags: ['YellowTurban'],
    isElite: false,
  };

  const nanmanWarrior: UnitVisualConfig = {
    id: 'nanman-warrior',
    role: 'polearm',
    cultureTags: ['Nanman'],
    isElite: true,
  };

  const units: UnitInstance[] = [
    // 한군 전열
    {
      id: 'han-front-1',
      visual: hanInfantry,
      gridPos: { row: 6, col: 3 },
    },
    {
      id: 'han-front-2',
      visual: hanInfantry,
      gridPos: { row: 6, col: 5 },
    },
    {
      id: 'han-front-3',
      visual: hanInfantry,
      gridPos: { row: 6, col: 7 },
    },
    // 한군 기병 (후열)
    {
      id: 'han-cavalry-1',
      visual: hanEliteCavalry,
      gridPos: { row: 8, col: 4 },
    },
    {
      id: 'han-cavalry-2',
      visual: hanEliteCavalry,
      gridPos: { row: 8, col: 6 },
    },
    // 황건 적군 전열
    {
      id: 'yt-front-1',
      visual: yellowTurbanSpear,
      gridPos: { row: 3, col: 4 },
    },
    {
      id: 'yt-front-2',
      visual: yellowTurbanSpear,
      gridPos: { row: 3, col: 6 },
    },
    // 황건 궁병 (후열)
    {
      id: 'yt-archer-1',
      visual: yellowTurbanArcher,
      gridPos: { row: 1, col: 3 },
    },
    {
      id: 'yt-archer-2',
      visual: yellowTurbanArcher,
      gridPos: { row: 1, col: 7 },
    },
    // 남만 전사 (측면)
    {
      id: 'nanman-1',
      visual: nanmanWarrior,
      gridPos: { row: 4, col: 1 },
    },
    {
      id: 'nanman-2',
      visual: nanmanWarrior,
      gridPos: { row: 4, col: 9 },
    },
  ];

  return units;
}
