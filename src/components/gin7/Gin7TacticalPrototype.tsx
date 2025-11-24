'use client';

import { useEffect, useRef, useState } from 'react';
import { createPixiTacticalMapEngine } from '@/lib/tactical/pixiTacticalMap.lazy';
import type { PixiTacticalMapEngine } from '@/lib/tactical/pixiTacticalMap.lazy';
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
  const [isLoading, setIsLoading] = useState(true);
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
    
    let cancelled = false;
    setIsLoading(true);

    createPixiTacticalMapEngine({
      canvas: canvasRef.current,
      width: 360,
      height: 360,
      logicalWidth: 24,
      logicalHeight: 24,
    }).then((engine) => {
      if (cancelled) {
        engine.destroy();
        return;
      }
      engineRef.current = engine;
      setIsLoading(false);
    }).catch((error) => {
      console.error('[Gin7TacticalPrototype] Failed to load Pixi.js engine:', error);
      setIsLoading(false);
    });

    return () => {
      cancelled = true;
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
    <div className="relative w-full">
      <canvas ref={canvasRef} data-testid="gin7-tactical-canvas" className="w-full rounded-2xl border border-white/5 bg-[#0b1020]" />
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#0b1020]/90 rounded-2xl">
          <div className="text-white/60 text-sm font-mono animate-pulse">
            Loading tactical map...
          </div>
        </div>
      )}
    </div>
  );
}
