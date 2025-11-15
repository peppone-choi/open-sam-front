import * as PIXI from 'pixi.js';

// 기본 타입들
export type GridPos = { row: number; col: number };

export type CultureTag =
  | 'Han'
  | 'YellowTurban'
  | 'Wudoumi'
  | 'Bandit'
  | 'Nanman'
  | 'Wa'
  | 'Dongyi';

export type UnitRole =
  | 'infantry'
  | 'spear'
  | 'polearm'
  | 'archer'
  | 'cavalry'
  | 'scholar';

export type WeaponStyle =
  | 'short_spear'
  | 'long_spear'
  | 'halberd'
  | 'sword'
  | 'dao'
  | 'axe'
  | 'bow'
  | 'crossbow'
  | 'staff'
  | 'scroll';

export type ArmorStyle = 'unarmored' | 'leather' | 'lamellar' | 'heavy';

export type HeadStyle =
  | 'bare'
  | 'cloth'
  | 'cap'
  | 'helmet'
  | 'helmet_crest';

export interface UnitVisualConfig {
  id: string;
  role: UnitRole;
  cultureTags: CultureTag[];
  weaponStyle?: WeaponStyle;
  armorStyle?: ArmorStyle;
  headStyle?: HeadStyle;
  hasShield?: boolean;
  hasBanner?: boolean;
  isElite?: boolean;
}

export interface UnitInstance {
  id: string;
  visual: UnitVisualConfig;
  gridPos: GridPos;
}

export interface IsoConfig {
  tileWidth: number;
  tileHeight: number;
  originX: number;
  originY: number;
}

export const defaultIsoConfig: IsoConfig = {
  tileWidth: 64,
  tileHeight: 32,
  originX: 400,
  originY: 100,
};

export const isoPalette = {
  clay: 0x9b6b4a,
  darkClay: 0x5f3b29,
  armorIron: 0x5a5f66,
  armorLeather: 0x7a4f2b,
  cloth: 0xc8a878,
  accentRed: 0xa83232,
  accentYellow: 0xd9a81a,
  accentGreen: 0x3f7f4a,
  accentBlue: 0x3c6e9a,
  banditBrown: 0x70422a,
};

export class IsoTransform {
  private tileWidth: number;
  private tileHeight: number;
  private originX: number;
  private originY: number;

  constructor(config: IsoConfig) {
    this.tileWidth = config.tileWidth;
    this.tileHeight = config.tileHeight;
    this.originX = config.originX;
    this.originY = config.originY;
  }

  gridToScreen(pos: GridPos): { x: number; y: number } {
    const { row, col } = pos;
    const x = (col - row) * (this.tileWidth / 2) + this.originX;
    const y = (col + row) * (this.tileHeight / 2) + this.originY;
    return { x, y };
  }

  screenToGrid(x: number, y: number): GridPos {
    const localX = x - this.originX;
    const localY = y - this.originY;

    const col =
      (localY / (this.tileHeight / 2) + localX / (this.tileWidth / 2)) / 2;
    const row =
      (localY / (this.tileHeight / 2) - localX / (this.tileWidth / 2)) / 2;

    return {
      row: Math.round(row),
      col: Math.round(col),
    };
  }

  zIndexFor(pos: GridPos): number {
    return pos.row + pos.col;
  }
}

function getCulturePalette(tags: CultureTag[]): {
  clay: number;
  armor: number;
  cloth: number;
  accent?: number;
} {
  const base = {
    clay: isoPalette.clay,
    armor: isoPalette.armorIron,
    cloth: isoPalette.cloth,
  };

  if (tags.includes('YellowTurban')) {
    return {
      ...base,
      cloth: 0xc9b36b,
      accent: isoPalette.accentYellow,
    };
  }

  if (tags.includes('Bandit')) {
    return {
      clay: isoPalette.clay,
      armor: isoPalette.banditBrown,
      cloth: 0x9a6b43,
      accent: 0x3b1f10,
    };
  }

  if (tags.includes('Nanman')) {
    return {
      clay: isoPalette.clay,
      armor: isoPalette.armorLeather,
      cloth: 0x8c7c54,
      accent: isoPalette.accentGreen,
    };
  }

  if (tags.includes('Wa')) {
    return {
      clay: isoPalette.clay,
      armor: isoPalette.armorLeather,
      cloth: 0xb8b0a0,
      accent: isoPalette.accentBlue,
    };
  }

  if (tags.includes('Dongyi')) {
    return {
      clay: isoPalette.clay,
      armor: isoPalette.armorLeather,
      cloth: 0xa8b4c8,
      accent: isoPalette.accentBlue,
    };
  }

  if (tags.includes('Wudoumi')) {
    return {
      clay: isoPalette.clay,
      armor: isoPalette.armorLeather,
      cloth: 0xb9aa8a,
      accent: isoPalette.accentGreen,
    };
  }

  return {
    ...base,
    accent: isoPalette.accentRed,
  };
}

interface TinySoldierOptions {
  role: UnitRole;
  cultureTags: CultureTag[];
  weaponStyle: WeaponStyle;
  armorStyle: ArmorStyle;
  headStyle: HeadStyle;
  hasShield: boolean;
  hasBanner: boolean;
  isElite?: boolean;
}

export function createTinySoldier(opts: TinySoldierOptions): PIXI.Container {
  const container = new PIXI.Container();
  const g = new PIXI.Graphics();
  container.addChild(g);

  const pal = getCulturePalette(opts.cultureTags);
  const accent = pal.accent;

  const w = 10;
  const h = 14;

  // 다리
  g.beginFill(pal.clay);
  g.drawRect(4, h - 4, 2, 4);
  g.endFill();

  // 몸통/갑옷
  let bodyTop = h - 10;
  let bodyHeight = 6;
  let armorColor = pal.armor;

  switch (opts.armorStyle) {
    case 'unarmored': {
      armorColor = pal.cloth;
      bodyHeight = 5;
      break;
    }
    case 'leather': {
      armorColor = isoPalette.armorLeather;
      break;
    }
    case 'lamellar': {
      armorColor = pal.armor;
      bodyHeight = 7;
      break;
    }
    case 'heavy': {
      armorColor = isoPalette.armorIron;
      bodyHeight = 8;
      bodyTop = h - 11;
      break;
    }
  }

  g.beginFill(armorColor);
  g.drawRect(2, bodyTop, 6, bodyHeight);
  g.endFill();

  // lamellar 패턴 (간단한 가로줄)
  if (opts.armorStyle === 'lamellar' || opts.armorStyle === 'heavy') {
    g.lineStyle(0.5, isoPalette.darkClay, 0.6);
    const rows = opts.armorStyle === 'heavy' ? 3 : 2;
    for (let i = 1; i <= rows; i += 1) {
      const y = bodyTop + (bodyHeight * i) / (rows + 1);
      g.moveTo(2, y);
      g.lineTo(8, y);
    }
  }

  // 머리
  g.beginFill(pal.clay);
  g.drawCircle(5, h - 12, 2);
  g.endFill();

  // 머리 장식 / 투구 / 두건
  if (opts.headStyle === 'bare') {
    // nothing
  } else if (opts.headStyle === 'cloth') {
    g.beginFill(pal.cloth);
    g.drawRect(2, h - 14, 6, 2);
    g.endFill();
  } else if (opts.headStyle === 'cap') {
    g.beginFill(isoPalette.darkClay);
    g.drawRect(3, h - 14, 4, 2);
    g.endFill();
  } else if (opts.headStyle === 'helmet') {
    g.beginFill(armorColor);
    g.drawRect(2, h - 15, 6, 3);
    g.endFill();
  } else if (opts.headStyle === 'helmet_crest') {
    g.beginFill(armorColor);
    g.drawRect(2, h - 15, 6, 3);
    g.endFill();
    if (accent) {
      g.beginFill(accent);
      g.drawRect(4, h - 18, 2, 3);
      g.endFill();
    }
  }

  // 황건은 항상 머리 위에 천 띠
  if (opts.cultureTags.includes('YellowTurban') && accent) {
    g.beginFill(accent);
    g.drawRect(1, h - 16, 8, 2);
    g.endFill();
  }

  // 방패 (왼쪽)
  if (opts.hasShield) {
    g.beginFill(armorColor, 0.9);
    g.drawRect(0, h - 10, 2, 6);
    g.endFill();
  }

  // 무기
  g.lineStyle(1, isoPalette.armorIron);

  switch (opts.weaponStyle) {
    case 'short_spear': {
      g.moveTo(5, h - 9);
      g.lineTo(9, h - 13);
      break;
    }
    case 'long_spear': {
      g.moveTo(5, h - 8);
      g.lineTo(11, h - 15);
      break;
    }
    case 'halberd': {
      g.moveTo(5, h - 8);
      g.lineTo(11, h - 15);
      g.moveTo(10, h - 15);
      g.lineTo(12, h - 13);
      break;
    }
    case 'sword': {
      g.moveTo(6, h - 8);
      g.lineTo(9, h - 6);
      break;
    }
    case 'dao': {
      g.moveTo(6, h - 8);
      g.lineTo(10, h - 7);
      g.moveTo(10, h - 7);
      g.lineTo(9, h - 5);
      break;
    }
    case 'axe': {
      g.moveTo(6, h - 8);
      g.lineTo(9, h - 7);
      g.beginFill(isoPalette.darkClay);
      g.drawRect(9, h - 9, 2, 3);
      g.endFill();
      break;
    }
    case 'bow': {
      g.moveTo(1, h - 9);
      g.quadraticCurveTo(0, h - 6, 1, h - 3);
      break;
    }
    case 'crossbow': {
      g.moveTo(4, h - 9);
      g.lineTo(7, h - 9);
      g.moveTo(5.5, h - 10);
      g.lineTo(5.5, h - 7);
      break;
    }
    case 'staff': {
      g.moveTo(5, h - 9);
      g.lineTo(9, h - 14);
      break;
    }
    case 'scroll': {
      g.moveTo(6, h - 9);
      g.lineTo(9, h - 7);
      break;
    }
    default: {
      g.moveTo(5, h - 9);
      g.lineTo(8, h - 8);
      break;
    }
  }

  // 깃발 (뒤쪽)
  if (opts.hasBanner) {
    const bx = 9;
    const by = h - 12;
    g.lineStyle(0.5, isoPalette.darkClay);
    g.moveTo(bx, by);
    g.lineTo(bx, by - 6);
    if (accent) {
      g.beginFill(accent);
      g.moveTo(bx, by - 6);
      g.lineTo(bx + 3, by - 5);
      g.lineTo(bx, by - 4);
      g.closePath();
      g.endFill();
    }
  }

  return container;
}

function getFormationLayout(count: number): { x: number; y: number }[] {
  const result: { x: number; y: number }[] = [];
  const cols = 3;
  const rows = Math.ceil(count / cols);
  const cellW = 10;
  const cellH = 8;
  const baseX = 6;
  const baseY = 10;

  for (let i = 0; i < count; i += 1) {
    const cx = i % cols;
    const cy = Math.floor(i / cols);
    const x = baseX + cx * cellW - cy * 2;
    const y = baseY + cy * cellH;
    result.push({ x, y });
  }

  return result;
}

function deriveTinySoldierOptions(
  visual: UnitVisualConfig,
  isFrontRow: boolean,
): TinySoldierOptions {
  const baseWeapon: WeaponStyle = (() => {
    if (visual.weaponStyle) return visual.weaponStyle;
    switch (visual.role) {
      case 'spear':
        return visual.isElite ? 'long_spear' : 'short_spear';
      case 'polearm':
        return 'halberd';
      case 'archer':
        return 'bow';
      case 'cavalry':
        return 'spear';
      case 'scholar':
        return 'scroll';
      case 'infantry':
      default:
        return visual.isElite ? 'dao' : 'sword';
    }
  })() as WeaponStyle;

  const armorStyle: ArmorStyle =
    visual.armorStyle ??
    (visual.isElite
      ? 'lamellar'
      : visual.role === 'scholar'
      ? 'unarmored'
      : 'leather');

  const headStyle: HeadStyle = visual.headStyle ?? (() => {
    if (visual.role === 'scholar') return 'cloth';
    if (visual.isElite) return 'helmet_crest';
    return 'helmet';
  })();

  const hasShield = visual.hasShield ?? visual.role === 'infantry';
  const hasBanner = visual.hasBanner ?? (visual.isElite && isFrontRow);

  return {
    role: visual.role,
    cultureTags: visual.cultureTags,
    weaponStyle: baseWeapon,
    armorStyle,
    headStyle,
    hasShield,
    hasBanner,
    isElite: visual.isElite && isFrontRow,
  };
}

export function createUnitIcon(visual: UnitVisualConfig): PIXI.Container {
  const container = new PIXI.Container();
  const g = new PIXI.Graphics();
  container.addChild(g);

  const size = 32;

  g.lineStyle(1, 0x111111);
  g.beginFill(0x14110f);
  g.drawRect(0, 0, size, size);
  g.endFill();

  const borderColor =
    getCulturePalette(visual.cultureTags).accent ?? isoPalette.accentRed;

  g.lineStyle(2, borderColor);
  g.drawRect(1, 1, size - 2, size - 2);

  const soldiers = visual.role === 'cavalry' ? 4 : 6;
  const layout = getFormationLayout(soldiers);

  for (let i = 0; i < soldiers; i += 1) {
    const isFrontRow = i < 3;
    const opts = deriveTinySoldierOptions(visual, isFrontRow);
    const soldier = createTinySoldier(opts);
    const pos = layout[i];
    soldier.x = pos.x;
    soldier.y = pos.y;
    container.addChild(soldier);
  }

  container.pivot.set(size / 2, size / 2);

  return container;
}

export class EffectsLayer {
  private container: PIXI.Container;
  private app: PIXI.Application;

  constructor(app: PIXI.Application) {
    this.app = app;
    this.container = new PIXI.Container();
  }

  get root(): PIXI.Container {
    return this.container;
  }

  shootArrow(
    from: { x: number; y: number },
    to: { x: number; y: number },
    options?: { speed?: number; arc?: number },
  ): void {
    const speed = options?.speed ?? 900;
    const arcHeight = options?.arc ?? 16;

    const g = new PIXI.Graphics();
    g.beginFill(0xd8c2a0);
    g.moveTo(0, 0);
    g.lineTo(-4, 2);
    g.lineTo(-4, -2);
    g.closePath();
    g.endFill();

    const arrow = new PIXI.Container();
    arrow.addChild(g);
    arrow.x = from.x;
    arrow.y = from.y;

    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const distance = Math.hypot(dx, dy);
    const duration = distance / speed;
    const angle = Math.atan2(dy, dx);
    arrow.rotation = angle;

    this.container.addChild(arrow);

    let elapsed = 0;

    const ticker = (delta: number) => {
      const dt = delta / 60;
      elapsed += dt;
      const t = Math.min(elapsed / duration, 1);

      const nx = from.x + dx * t;
      const ny = from.y + dy * t;
      const arcOffset = Math.sin(t * Math.PI) * arcHeight;

      arrow.x = nx;
      arrow.y = ny - arcOffset;

      if (t >= 1) {
        this.app.ticker.remove(ticker);
        this.container.removeChild(arrow);
        arrow.destroy();
        this.spawnHitEffect(to);
      }
    };

    this.app.ticker.add(ticker);
  }

  spawnHitEffect(pos: { x: number; y: number }): void {
    const g = new PIXI.Graphics();
    const c = new PIXI.Container();
    c.addChild(g);
    c.x = pos.x;
    c.y = pos.y;

    this.container.addChild(c);

    let elapsed = 0;
    const duration = 0.25;

    const ticker = (delta: number) => {
      const dt = delta / 60;
      elapsed += dt;
      const t = Math.min(elapsed / duration, 1);
      const radius = 4 + 8 * t;
      const alpha = 1 - t;

      g.clear();
      g.lineStyle(2, 0xfff1c0, alpha);
      g.drawCircle(0, 0, radius);

      if (t >= 1) {
        this.app.ticker.remove(ticker);
        this.container.removeChild(c);
        c.destroy();
      }
    };

    this.app.ticker.add(ticker);
  }
}

export interface IsoTacticalMapOptions {
  canvas: HTMLCanvasElement;
  width: number;
  height: number;
  isoConfig?: IsoConfig;
}

export class IsoTacticalMapEngine {
  private app: PIXI.Application;
  private iso: IsoTransform;
  private unitsLayer: PIXI.Container;
  private effects: EffectsLayer;
  private units: Map<string, { instance: UnitInstance; sprite: PIXI.Container }>;

  constructor(options: IsoTacticalMapOptions) {
    const { canvas, width, height, isoConfig = defaultIsoConfig } = options;

    this.app = new PIXI.Application({
      view: canvas,
      width,
      height,
      backgroundAlpha: 0,
      antialias: false,
    });

    this.iso = new IsoTransform(isoConfig);

    const backgroundLayer = new PIXI.Container();
    const unitsLayer = new PIXI.Container();
    const effectsLayer = new PIXI.Container();

    this.app.stage.addChild(backgroundLayer, unitsLayer, effectsLayer);

    this.unitsLayer = unitsLayer;
    this.effects = new EffectsLayer(this.app);
    effectsLayer.addChild(this.effects.root);

    this.units = new Map();

    this.drawGrid(backgroundLayer, width, height, isoConfig);
  }

  destroy(): void {
    this.app.destroy(true, { children: true, texture: true, baseTexture: true });
    this.units.clear();
  }

  private drawGrid(
    layer: PIXI.Container,
    width: number,
    height: number,
    isoConfig: IsoConfig,
  ): void {
    const g = new PIXI.Graphics();
    layer.addChild(g);

    g.clear();
    g.beginFill(0x14110f);
    g.drawRect(0, 0, width, height);
    g.endFill();

    const rows = 12;
    const cols = 12;

    g.lineStyle(1, 0x2b241f, 0.7);

    for (let row = 0; row < rows; row += 1) {
      for (let col = 0; col < cols; col += 1) {
        const { x, y } = this.iso.gridToScreen({ row, col });
        this.drawIsoTile(g, x, y, isoConfig.tileWidth, isoConfig.tileHeight);
      }
    }
  }

  private drawIsoTile(
    g: PIXI.Graphics,
    x: number,
    y: number,
    tileWidth: number,
    tileHeight: number,
  ): void {
    const hw = tileWidth / 2;
    const hh = tileHeight / 2;

    g.moveTo(x, y - hh);
    g.lineTo(x + hw, y);
    g.lineTo(x, y + hh);
    g.lineTo(x - hw, y);
    g.lineTo(x, y - hh);
  }

  upsertUnit(instance: UnitInstance): void {
    const existing = this.units.get(instance.id);
    if (existing) {
      existing.instance = instance;
      this.updateUnitSprite(existing.sprite, instance);
      return;
    }

    const sprite = createUnitIcon(instance.visual);

    const screen = this.iso.gridToScreen(instance.gridPos);
    sprite.x = screen.x;
    sprite.y = screen.y;
    sprite.zIndex = this.iso.zIndexFor(instance.gridPos);

    this.unitsLayer.addChild(sprite);
    this.unitsLayer.sortChildren();

    this.units.set(instance.id, { instance, sprite });
  }

  private updateUnitSprite(sprite: PIXI.Container, instance: UnitInstance): void {
    const screen = this.iso.gridToScreen(instance.gridPos);
    sprite.x = screen.x;
    sprite.y = screen.y;
    sprite.zIndex = this.iso.zIndexFor(instance.gridPos);
    this.unitsLayer.sortChildren();
  }

  removeUnit(id: string): void {
    const entry = this.units.get(id);
    if (!entry) return;

    this.unitsLayer.removeChild(entry.sprite);
    entry.sprite.destroy();
    this.units.delete(id);
  }

  moveUnit(
    id: string,
    to: GridPos,
    options?: { duration?: number; onComplete?: () => void },
  ): void {
    const entry = this.units.get(id);
    if (!entry) return;

    const sprite = entry.sprite;
    const fromScreen = this.iso.gridToScreen(entry.instance.gridPos);
    const toScreen = this.iso.gridToScreen(to);

    const duration = options?.duration ?? 0.3;
    const start = { x: fromScreen.x, y: fromScreen.y };
    const dx = toScreen.x - start.x;
    const dy = toScreen.y - start.y;

    let elapsed = 0;

    const ticker = (delta: number) => {
      const dt = delta / 60;
      elapsed += dt;
      const t = Math.min(elapsed / duration, 1);

      sprite.x = start.x + dx * t;
      sprite.y = start.y + dy * t;
      sprite.zIndex = this.iso.zIndexFor(to);
      this.unitsLayer.sortChildren();

      if (t >= 1) {
        this.app.ticker.remove(ticker);
        entry.instance.gridPos = to;
        if (options?.onComplete) {
          options.onComplete();
        }
      }
    };

    this.app.ticker.add(ticker);
  }

  playRangedAttack(attackerId: string, defenderId: string): void {
    const attacker = this.units.get(attackerId);
    const defender = this.units.get(defenderId);

    if (!attacker || !defender) return;

    const from = { x: attacker.sprite.x, y: attacker.sprite.y - 12 };
    const to = { x: defender.sprite.x, y: defender.sprite.y - 12 };

    this.effects.shootArrow(from, to);
  }
}
