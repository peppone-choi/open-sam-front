'use client';

import { useEffect, useRef } from 'react';
import { PixiTacticalMapEngine } from '@/lib/tactical/pixiTacticalMap';
import { UnitInstance } from '@/lib/tactical/isoTacticalMap';
import { useGin7Store } from '@/stores/gin7Store';
import { useGin7Telemetry } from '@/hooks/useGin7Telemetry';

// Ref: gin7manual.txt 4장 전술 게임 기본 조작/레이더/에너지 패널

function toVisual(unitType: string, faction: string) {
  const base = faction === 'empire' ? ['Han'] : ['YellowTurban'];
  return {
    id: `${unitType}-${faction}`,
    role: unitType === 'escort' ? 'infantry' : 'cavalry',
    cultureTags: base as any,
    weaponStyle: unitType === 'flagship' ? 'long_spear' : 'short_spear',
    armorStyle: unitType === 'escort' ? 'lamellar' : 'heavy',
    headStyle: unitType === 'flagship' ? 'helmet_crest' : 'helmet',
    hasShield: unitType !== 'flagship',
    hasBanner: unitType === 'flagship',
    isElite: unitType === 'flagship',
  };
}

export default function Gin7TacticalPrototype() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<PixiTacticalMapEngine | null>(null);
  const previousIds = useRef<string[]>([]);
  const units = useGin7Store((state) => state.tactical?.units ?? []);
  const recordLocalTelemetry = useGin7Store((state) => state.recordLocalTelemetry);

  useGin7Telemetry({
    scene: 'tactical',
    enabled: units.length > 0,
    sampleIntervalMs: 5000,
    onSample: (sample) => recordLocalTelemetry('tactical', sample),
  });

  useEffect(() => {
    if (!canvasRef.current) return;
    engineRef.current = new PixiTacticalMapEngine({
      canvas: canvasRef.current,
      width: 360,
      height: 360,
      logicalWidth: 24,
      logicalHeight: 24,
    });
    return () => {
      engineRef.current?.destroy();
      engineRef.current = null;
    };
  }, []);

  useEffect(() => {
    const engine = engineRef.current;
    if (!engine) return;
    const newIds = units.map((unit) => unit.id);
    previousIds.current.forEach((id) => {
      if (!newIds.includes(id)) {
        engine.removeUnit(id);
      }
    });
    units.forEach((unit) => {
      const instance: UnitInstance = {
        id: unit.id,
        gridPos: unit.position,
        visual: toVisual(unit.type, unit.faction),
      } as UnitInstance;
      engine.upsertUnit(instance);
    });
    previousIds.current = newIds;
  }, [units]);

  return (
    <canvas ref={canvasRef} data-testid="gin7-tactical-canvas" className="w-full rounded-2xl border border-white/5 bg-[#0b1020]" />
  );
}
