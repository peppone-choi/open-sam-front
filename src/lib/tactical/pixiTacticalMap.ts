import * as PIXI from 'pixi.js';
import type { GridPos, UnitInstance, UnitVisualConfig } from './isoTacticalMap';

export interface PixiTacticalMapOptions {
  canvas: HTMLCanvasElement;
  width: number; // 픽셀 폭
  height: number; // 픽셀 높이
  logicalWidth: number; // 논리 그리드 폭 (예: 40)
  logicalHeight: number; // 논리 그리드 높이 (예: 40)
}

interface InternalUnitEntry {
  instance: UnitInstance;
  sprite: PIXI.Container;
}

export class PixiTacticalMapEngine {
  private app: PIXI.Application;
  private unitsLayer: PIXI.Container;
  private width: number;
  private height: number;
  private logicalWidth: number;
  private logicalHeight: number;
  private units: Map<string, InternalUnitEntry>;

  constructor(options: PixiTacticalMapOptions) {
    const { canvas, width, height, logicalWidth, logicalHeight } = options;

    this.width = width;
    this.height = height;
    this.logicalWidth = logicalWidth;
    this.logicalHeight = logicalHeight;

    console.log('[PixiTacticalMapEngine] init', { width, height, logicalWidth, logicalHeight });

    this.app = new PIXI.Application({
      view: canvas,
      width,
      height,
      background: 0x1f2937,
      antialias: true,
    });

    const root = this.app.stage;

    const gridLayer = new PIXI.Container();
    this.unitsLayer = new PIXI.Container();

    root.addChild(gridLayer);
    root.addChild(this.unitsLayer);

    this.units = new Map();

    this.drawGrid(gridLayer);
  }

  destroy(): void {
    // Pixi Application.destroy는 한 번만 안전하게 호출해야 함
    const appAny = this.app as any;
    if (!appAny || appAny._destroyed || !appAny.renderer) {
      return;
    }

    appAny.destroy(true, { children: true, texture: true, baseTexture: true });
    this.units.clear();
  }

  screenToGrid(x: number, y: number): GridPos {
    const cellW = this.width / this.logicalWidth;
    const cellH = this.height / this.logicalHeight;

    const col = clamp(Math.floor(x / cellW), 0, this.logicalWidth - 1);
    const row = clamp(Math.floor(y / cellH), 0, this.logicalHeight - 1);

    // 화면 좌표계(위 0, 아래 증가)를 그대로 row로 사용
    return { row, col };
  }

  upsertUnit(instance: UnitInstance): void {
    console.log('[PixiTacticalMapEngine] upsertUnit', instance.id, instance.gridPos);
    const existing = this.units.get(instance.id);
    if (existing) {
      existing.instance = instance;
      this.updateUnitSprite(existing.sprite, instance);
      return;
    }

    const sprite = this.createUnitSprite(instance.visual);
    this.updateUnitSprite(sprite, instance);

    this.unitsLayer.addChild(sprite);
    this.units.set(instance.id, { instance, sprite });
  }

  removeUnit(id: string): void {
    const entry = this.units.get(id);
    if (!entry) return;

    this.unitsLayer.removeChild(entry.sprite);
    entry.sprite.destroy();
    this.units.delete(id);
  }

  private drawGrid(layer: PIXI.Container): void {
    const g = new PIXI.Graphics();
    layer.addChild(g);

    g.clear();
    // 배경 채우기 (Deprecated API지만 렌더는 정상 동작)
    g.beginFill(0x1f2937);
    g.drawRect(0, 0, this.width, this.height);
    g.endFill();

    const cellW = this.width / this.logicalWidth;
    const cellH = this.height / this.logicalHeight;

    // 그리드 선 스타일 (배경과 확실히 대비되도록 흰색)
    g.lineStyle(1, 0xffffff, 0.9);

    // 세로선
    for (let c = 0; c <= this.logicalWidth; c += 1) {
      const x = c * cellW;
      g.moveTo(x, 0);
      g.lineTo(x, this.height);
    }

    // 가로선
    for (let r = 0; r <= this.logicalHeight; r += 1) {
      const y = r * cellH;
      g.moveTo(0, y);
      g.lineTo(this.width, y);
    }
  }

  private createUnitSprite(visual: UnitVisualConfig): PIXI.Container {
    const container = new PIXI.Container();
    const g = new PIXI.Graphics();
    container.addChild(g);

    const color = getUnitColor(visual);

    // Deprecated API지만 네모가 확실히 보이도록 간단하게 그린다
    g.beginFill(color);
    g.drawRoundedRect(-10, -10, 20, 20, 4);
    g.endFill();

    g.lineStyle(1, 0x000000, 0.8);
    g.drawRoundedRect(-10, -10, 20, 20, 4);

    return container;
  }

  private updateUnitSprite(sprite: PIXI.Container, instance: UnitInstance): void {
    const cellW = this.width / this.logicalWidth;
    const cellH = this.height / this.logicalHeight;

    const { row, col } = instance.gridPos;

    const x = (col + 0.5) * cellW;
    const y = (row + 0.5) * cellH;

    sprite.position.set(x, y);
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function getUnitColor(visual: UnitVisualConfig): number {
  const isElite = !!visual.isElite;
  const role = visual.role;
  const tags = visual.cultureTags || [];

  const isAttackerSide = tags.includes('Han');

  if (isAttackerSide) {
    if (role === 'cavalry') return isElite ? 0x4ade80 : 0x22c55e;
    if (role === 'archer') return isElite ? 0x60a5fa : 0x3b82f6;
    if (role === 'spear' || role === 'polearm') return isElite ? 0xfacc15 : 0xeab308;
    return isElite ? 0xf97316 : 0xf97316;
  }

  if (role === 'cavalry') return isElite ? 0xf97316 : 0xea580c;
  if (role === 'archer') return isElite ? 0x6366f1 : 0x4f46e5;
  if (role === 'spear' || role === 'polearm') return isElite ? 0xf97316 : 0xfbbf24;
  return isElite ? 0xef4444 : 0xdc2626;
}
