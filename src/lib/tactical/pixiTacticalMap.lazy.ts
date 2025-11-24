/**
 * Lazy-loaded wrapper for PixiTacticalMapEngine
 * Reduces initial bundle size by ~150KB by dynamically importing Pixi.js
 */

import type {
  GridPos,
  UnitInstance,
} from './isoTacticalMap';

export interface PixiTacticalMapOptions {
  canvas: HTMLCanvasElement;
  width: number;
  height: number;
  logicalWidth: number;
  logicalHeight: number;
}

export interface PixiTacticalMapEngine {
  destroy(): void;
  screenToGrid(x: number, y: number): GridPos;
  upsertUnit(instance: UnitInstance): void;
  removeUnit(id: string): void;
}

let pixiModule: any = null;
let engineModule: any = null;

/**
 * Dynamically loads Pixi.js and the engine implementation
 */
export async function createPixiTacticalMapEngine(
  options: PixiTacticalMapOptions
): Promise<PixiTacticalMapEngine> {
  // Load Pixi.js if not already loaded
  if (!pixiModule) {
    pixiModule = await import('pixi.js');
  }

  // Load engine implementation if not already loaded
  if (!engineModule) {
    engineModule = await import('./pixiTacticalMap');
  }

  const { PixiTacticalMapEngine } = engineModule;
  return new PixiTacticalMapEngine(options);
}
