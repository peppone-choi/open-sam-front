/**
 * Lazy-loaded wrapper for ThreeTacticalMapEngine
 * Reduces initial bundle size by ~300KB by dynamically importing Three.js
 */

import type {
  GridPos,
  UnitInstance,
} from './isoTacticalMap';

export interface ThreeTacticalMapOptions {
  canvas: HTMLCanvasElement;
  width: number;
  height: number;
  logicalWidth: number;
  logicalHeight: number;
}

export interface ThreeTacticalMapEngine {
  destroy(): void;
  screenToGrid(x: number, y: number): GridPos;
  upsertUnit(instance: UnitInstance): void;
  removeUnit(id: string): void;
  spawnProjectileGrid(from: GridPos, to: GridPos, arcType: 'flat' | 'high', color: number): void;
}

let threeModule: any = null;
let engineModule: any = null;

/**
 * Dynamically loads Three.js and the engine implementation
 */
export async function createThreeTacticalMapEngine(
  options: ThreeTacticalMapOptions
): Promise<ThreeTacticalMapEngine> {
  // Load Three.js if not already loaded
  if (!threeModule) {
    threeModule = await import('three');
  }

  // Load engine implementation if not already loaded
  if (!engineModule) {
    engineModule = await import('./threeTacticalMap');
  }

  const { ThreeTacticalMapEngine } = engineModule;
  return new ThreeTacticalMapEngine(options);
}
