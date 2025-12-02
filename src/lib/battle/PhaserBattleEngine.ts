/**
 * Phaser 3 + 아이소메트릭 2.5D 전투 엔진
 * 
 * 토탈워 스타일 대규모 전투를 60fps로 안정적으로 처리
 */

import * as Phaser from 'phaser';

// ========================================
// 타입 정의
// ========================================

export interface Vector2 {
  x: number;
  y: number;
}

export type TeamId = 'attacker' | 'defender';
export type UnitCategory = 
  | 'ji_infantry' | 'sword_infantry' | 'halberd_infantry' | 'spear_guard'
  | 'archer' | 'crossbow' | 'horse_archer'
  | 'cavalry' | 'shock_cavalry';

export type SoldierState = 
  | 'idle' | 'moving' | 'charging' | 'fighting' 
  | 'pursuing' | 'wavering' | 'routing' | 'dead';

export type SquadState = 
  | 'idle' | 'moving' | 'charging' | 'engaging' 
  | 'wavering' | 'routing' | 'rallying' | 'destroyed';

// ========================================
// 유닛 스탯
// ========================================

export const UNIT_STATS: Record<UnitCategory, {
  hp: number;
  attack: number;
  defense: number;
  speed: number;
  range: number;
  isRanged: boolean;
  color: number;
  size: number;
}> = {
  ji_infantry: { hp: 100, attack: 35, defense: 40, speed: 80, range: 20, isRanged: false, color: 0x8B4513, size: 8 },
  sword_infantry: { hp: 90, attack: 45, defense: 35, speed: 90, range: 20, isRanged: false, color: 0xCD853F, size: 8 },
  halberd_infantry: { hp: 110, attack: 50, defense: 30, speed: 75, range: 25, isRanged: false, color: 0xA0522D, size: 8 },
  spear_guard: { hp: 120, attack: 30, defense: 50, speed: 70, range: 25, isRanged: false, color: 0xD2691E, size: 8 },
  archer: { hp: 60, attack: 40, defense: 15, speed: 85, range: 200, isRanged: true, color: 0x228B22, size: 7 },
  crossbow: { hp: 65, attack: 55, defense: 20, speed: 75, range: 250, isRanged: true, color: 0x006400, size: 7 },
  horse_archer: { hp: 70, attack: 35, defense: 20, speed: 140, range: 150, isRanged: true, color: 0x32CD32, size: 10 },
  cavalry: { hp: 100, attack: 50, defense: 35, speed: 150, range: 20, isRanged: false, color: 0x4169E1, size: 12 },
  shock_cavalry: { hp: 120, attack: 65, defense: 30, speed: 160, range: 20, isRanged: false, color: 0x0000CD, size: 14 },
};

// ========================================
// 병사 클래스 (최적화: 단순 원형 + 색상)
// ========================================

export class Soldier extends Phaser.GameObjects.Arc {
  public soldierId: string;
  public squadId: string;
  public teamId: TeamId;
  public category: UnitCategory;
  
  // 스탯
  public hp: number;
  public maxHp: number;
  public attack: number;
  public defense: number;
  public speed: number;
  public range: number;
  public isRanged: boolean;
  
  // 상태
  public state: SoldierState = 'idle';
  public morale: number = 100;
  public fatigue: number = 0;
  public engagedWith?: Soldier;
  public lastAttackTime: number = 0;
  
  // 이동
  public targetX: number;
  public targetY: number;
  public facing: number = 0;
  
  // 진형
  public formationOffsetX: number = 0;
  public formationOffsetY: number = 0;
  
  private unitColor: number;
  private unitSize: number;
  private lastState: SoldierState = 'idle';
  
  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    config: {
      soldierId: string;
      squadId: string;
      teamId: TeamId;
      category: UnitCategory;
    }
  ) {
    const stats = UNIT_STATS[config.category];
    const teamColor = config.teamId === 'attacker' ? 0xFF4444 : 0x4444FF;
    
    super(scene, x, y, stats.size, 0, 360, false, teamColor);
    
    this.soldierId = config.soldierId;
    this.squadId = config.squadId;
    this.teamId = config.teamId;
    this.category = config.category;
    
    this.hp = stats.hp;
    this.maxHp = stats.hp;
    this.attack = stats.attack;
    this.defense = stats.defense;
    this.speed = stats.speed;
    this.range = stats.range;
    this.isRanged = stats.isRanged;
    this.unitColor = stats.color;
    this.unitSize = stats.size;
    
    this.targetX = x;
    this.targetY = y;
    
    // 윤곽선 추가
    this.setStrokeStyle(1, 0x000000, 0.5);
    
    scene.add.existing(this);
  }
  
  updateVisual(): void {
    // 상태에 따른 색상 변경 (최소한의 업데이트)
    if (this.state === this.lastState && this.hp > 0) return;
    this.lastState = this.state;
    
    if (this.hp <= 0) {
      this.setFillStyle(0x333333, 0.5);
      this.setVisible(false);
    } else if (this.state === 'routing') {
      this.setFillStyle(0xFFFF00, 1);
    } else if (this.state === 'fighting') {
      this.setFillStyle(this.teamId === 'attacker' ? 0xFF0000 : 0x0000FF, 1);
    } else {
      this.setFillStyle(this.teamId === 'attacker' ? 0xFF6666 : 0x6666FF, 1);
    }
  }
  
  update(time: number, delta: number): void {
    if (this.state === 'dead' || this.hp <= 0) return;
    
    const deltaSeconds = delta / 1000;
    
    // 상태별 처리
    switch (this.state) {
      case 'moving':
      case 'charging':
        this.moveToTarget(deltaSeconds);
        break;
      case 'routing':
        this.handleRouting(deltaSeconds);
        break;
    }
    
    // 피로도 회복 (비전투 시)
    if (this.state !== 'fighting' && this.state !== 'charging') {
      this.fatigue = Math.max(0, this.fatigue - 0.5 * deltaSeconds);
    }
    
    // 시각 업데이트 (상태 변경 시에만)
    this.updateVisual();
  }
  
  private moveToTarget(deltaSeconds: number): void {
    const dx = this.targetX - this.x;
    const dy = this.targetY - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance < 2) {
      this.state = 'idle';
      return;
    }
    
    const speedMultiplier = this.state === 'charging' ? 1.5 : 1.0;
    const fatigueMultiplier = 1 - this.fatigue / 200;
    const moveSpeed = this.speed * speedMultiplier * fatigueMultiplier * deltaSeconds;
    
    const moveDistance = Math.min(moveSpeed, distance);
    this.x += (dx / distance) * moveDistance;
    this.y += (dy / distance) * moveDistance;
    
    this.facing = Math.atan2(dy, dx);
    
    // 피로도 증가
    if (this.state === 'charging') {
      this.fatigue = Math.min(100, this.fatigue + 2 * deltaSeconds);
    } else {
      this.fatigue = Math.min(100, this.fatigue + 0.5 * deltaSeconds);
    }
  }
  
  private handleRouting(deltaSeconds: number): void {
    // 도망 방향 (팀에 따라 반대 방향)
    const retreatDir = this.teamId === 'attacker' ? -1 : 1;
    const speed = this.speed * 1.5 * deltaSeconds;
    
    this.y += retreatDir * speed;
    this.x += (Math.random() - 0.5) * speed * 0.5;
    
    // 사기 회복 (도망 중)
    this.morale = Math.min(100, this.morale + 0.5 * deltaSeconds);
  }
  
  takeDamage(damage: number, attacker: Soldier): void {
    const actualDamage = Math.max(1, damage - this.defense * 0.3);
    this.hp -= actualDamage;
    
    // 사기 감소
    this.morale -= actualDamage * 0.3;
    
    if (this.hp <= 0) {
      this.hp = 0;
      this.state = 'dead';
      this.engagedWith = undefined;
      attacker.engagedWith = undefined;
    } else if (this.morale < 20 && this.state !== 'routing') {
      this.state = 'routing';
      this.engagedWith = undefined;
    }
  }
  
  getDistanceTo(other: Soldier): number {
    const dx = other.x - this.x;
    const dy = other.y - this.y;
    return Math.sqrt(dx * dx + dy * dy);
  }
}

// ========================================
// 부대 클래스
// ========================================

export class Squad {
  public id: string;
  public name: string;
  public teamId: TeamId;
  public category: UnitCategory;
  public soldiers: Soldier[] = [];
  public state: SquadState = 'idle';
  
  // 위치
  public x: number = 0;
  public y: number = 0;
  public facing: number = 0;
  
  // 통계
  public kills: number = 0;
  public losses: number = 0;
  
  constructor(config: {
    id: string;
    name: string;
    teamId: TeamId;
    category: UnitCategory;
  }) {
    this.id = config.id;
    this.name = config.name;
    this.teamId = config.teamId;
    this.category = config.category;
  }
  
  get aliveSoldiers(): number {
    return this.soldiers.filter(s => s.state !== 'dead').length;
  }
  
  get avgMorale(): number {
    const alive = this.soldiers.filter(s => s.state !== 'dead');
    if (alive.length === 0) return 0;
    return alive.reduce((acc, s) => acc + s.morale, 0) / alive.length;
  }
  
  updatePosition(): void {
    const alive = this.soldiers.filter(s => s.state !== 'dead');
    if (alive.length === 0) return;
    
    this.x = alive.reduce((acc, s) => acc + s.x, 0) / alive.length;
    this.y = alive.reduce((acc, s) => acc + s.y, 0) / alive.length;
  }
}

// ========================================
// 투사체 클래스 (최적화: Arc)
// ========================================

export class Projectile extends Phaser.GameObjects.Arc {
  public sourceId: string;
  public targetId: string;
  public damage: number;
  public startX: number;
  public startY: number;
  public endX: number;
  public endY: number;
  public progress: number = 0;
  public duration: number = 400; // ms
  public hit: boolean = false;
  
  constructor(scene: Phaser.Scene, config: {
    sourceId: string;
    targetId: string;
    damage: number;
    startX: number;
    startY: number;
    endX: number;
    endY: number;
    hit: boolean;
  }) {
    super(scene, config.startX, config.startY, 3, 0, 360, false, 0xFFFF00);
    
    this.sourceId = config.sourceId;
    this.targetId = config.targetId;
    this.damage = config.damage;
    this.startX = config.startX;
    this.startY = config.startY;
    this.endX = config.endX;
    this.endY = config.endY;
    this.hit = config.hit;
    
    scene.add.existing(this);
  }
  
  update(time: number, delta: number): boolean {
    this.progress += delta / this.duration;
    
    if (this.progress >= 1) {
      return true; // 완료
    }
    
    // 포물선 궤적
    const arcHeight = Math.sin(this.progress * Math.PI) * 30;
    this.x = this.startX + (this.endX - this.startX) * this.progress;
    this.y = this.startY + (this.endY - this.startY) * this.progress - arcHeight;
    
    return false;
  }
}

// ========================================
// 메인 전투 씬
// ========================================

export class BattleScene extends Phaser.Scene {
  // 게임 오브젝트
  public soldiers: Map<string, Soldier> = new Map();
  public squads: Map<string, Squad> = new Map();
  public projectiles: Projectile[] = [];
  
  // 공간 분할 (간단한 그리드)
  private gridCellSize: number = 50;
  private spatialGrid: Map<string, Set<string>> = new Map();
  
  // 전투 상태
  public battleState: 'preparing' | 'running' | 'paused' | 'ended' = 'preparing';
  public winner?: TeamId;
  
  // 통계
  public attackerStats = { alive: 0, total: 0, kills: 0 };
  public defenderStats = { alive: 0, total: 0, kills: 0 };
  
  // 콜백
  public onStatsUpdate?: (attacker: typeof this.attackerStats, defender: typeof this.defenderStats) => void;
  public onBattleEnd?: (winner: TeamId) => void;
  
  // 카메라
  private isDragging: boolean = false;
  private dragStartX: number = 0;
  private dragStartY: number = 0;
  
  constructor() {
    super({ key: 'BattleScene' });
  }
  
  create(): void {
    // 배경 (아이소메트릭 잔디)
    this.createBackground();
    
    // 카메라 설정
    this.cameras.main.setBounds(-500, -500, 2000, 2000);
    this.cameras.main.setZoom(0.8);
    this.cameras.main.centerOn(500, 400);
    
    // 입력 설정
    this.setupInput();
    
    console.log('🎮 BattleScene created');
  }
  
  private createBackground(): void {
    const graphics = this.add.graphics();
    
    // 아이소메트릭 잔디 타일
    const tileWidth = 64;
    const tileHeight = 32;
    
    for (let y = -10; y < 30; y++) {
      for (let x = -10; x < 30; x++) {
        const isoX = (x - y) * tileWidth / 2 + 500;
        const isoY = (x + y) * tileHeight / 2 + 200;
        
        // 체크무늬 잔디
        const color = (x + y) % 2 === 0 ? 0x4A7023 : 0x5C8A2E;
        
        graphics.fillStyle(color, 1);
        graphics.beginPath();
        graphics.moveTo(isoX, isoY - tileHeight / 2);
        graphics.lineTo(isoX + tileWidth / 2, isoY);
        graphics.lineTo(isoX, isoY + tileHeight / 2);
        graphics.lineTo(isoX - tileWidth / 2, isoY);
        graphics.closePath();
        graphics.fillPath();
      }
    }
  }
  
  private setupInput(): void {
    // 마우스 드래그로 카메라 이동
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (pointer.rightButtonDown()) {
        this.isDragging = true;
        this.dragStartX = pointer.x;
        this.dragStartY = pointer.y;
      }
    });
    
    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (this.isDragging) {
        const dx = pointer.x - this.dragStartX;
        const dy = pointer.y - this.dragStartY;
        this.cameras.main.scrollX -= dx / this.cameras.main.zoom;
        this.cameras.main.scrollY -= dy / this.cameras.main.zoom;
        this.dragStartX = pointer.x;
        this.dragStartY = pointer.y;
      }
    });
    
    this.input.on('pointerup', () => {
      this.isDragging = false;
    });
    
    // 마우스 휠로 줌
    this.input.on('wheel', (pointer: Phaser.Input.Pointer, gameObjects: any[], deltaX: number, deltaY: number) => {
      const zoom = this.cameras.main.zoom;
      const newZoom = Phaser.Math.Clamp(zoom - deltaY * 0.001, 0.3, 2);
      this.cameras.main.setZoom(newZoom);
    });
  }
  
  // ========================================
  // 부대/병사 생성
  // ========================================
  
  createSquad(config: {
    name: string;
    teamId: TeamId;
    category: UnitCategory;
    soldierCount: number;
    x: number;
    y: number;
    facing: number;
  }): Squad {
    const squadId = `squad_${this.squads.size}`;
    const squad = new Squad({
      id: squadId,
      name: config.name,
      teamId: config.teamId,
      category: config.category,
    });
    
    squad.x = config.x;
    squad.y = config.y;
    squad.facing = config.facing;
    
    // 병사 생성 (진형)
    const cols = Math.ceil(Math.sqrt(config.soldierCount * 2));
    const rows = Math.ceil(config.soldierCount / cols);
    const spacing = 15;
    
    let soldierIndex = 0;
    for (let row = 0; row < rows && soldierIndex < config.soldierCount; row++) {
      for (let col = 0; col < cols && soldierIndex < config.soldierCount; col++) {
        const offsetX = (col - cols / 2) * spacing;
        const offsetY = (row - rows / 2) * spacing;
        
        // 아이소메트릭 변환
        const isoX = config.x + offsetX - offsetY * 0.5;
        const isoY = config.y + offsetY * 0.5 + offsetX * 0.25;
        
        const soldier = new Soldier(this, isoX, isoY, {
          soldierId: `${squadId}_soldier_${soldierIndex}`,
          squadId,
          teamId: config.teamId,
          category: config.category,
        });
        
        soldier.formationOffsetX = offsetX;
        soldier.formationOffsetY = offsetY;
        soldier.facing = config.facing;
        
        squad.soldiers.push(soldier);
        this.soldiers.set(soldier.soldierId, soldier);
        
        soldierIndex++;
      }
    }
    
    this.squads.set(squadId, squad);
    
    // 통계 업데이트
    if (config.teamId === 'attacker') {
      this.attackerStats.total += config.soldierCount;
      this.attackerStats.alive += config.soldierCount;
    } else {
      this.defenderStats.total += config.soldierCount;
      this.defenderStats.alive += config.soldierCount;
    }
    
    return squad;
  }
  
  // ========================================
  // 게임 루프
  // ========================================
  
  update(time: number, delta: number): void {
    if (this.battleState !== 'running') return;
    
    // 1. 공간 그리드 재구축
    this.rebuildSpatialGrid();
    
    // 2. 병사 AI 업데이트
    this.updateSoldierAI(time, delta);
    
    // 3. 전투 처리
    this.processCombat(time, delta);
    
    // 4. 투사체 업데이트
    this.updateProjectiles(time, delta);
    
    // 5. 사기 업데이트
    this.updateMorale(delta);
    
    // 6. 부대 상태 업데이트
    this.updateSquads();
    
    // 7. 통계 업데이트
    this.updateStats();
    
    // 8. 승패 체크
    this.checkVictory();
  }
  
  private rebuildSpatialGrid(): void {
    this.spatialGrid.clear();
    
    this.soldiers.forEach((soldier, id) => {
      if (soldier.state === 'dead') return;
      
      const cellX = Math.floor(soldier.x / this.gridCellSize);
      const cellY = Math.floor(soldier.y / this.gridCellSize);
      const key = `${cellX},${cellY}`;
      
      if (!this.spatialGrid.has(key)) {
        this.spatialGrid.set(key, new Set());
      }
      this.spatialGrid.get(key)!.add(id);
    });
  }
  
  private getNearbyEntities(x: number, y: number, radius: number): Soldier[] {
    const result: Soldier[] = [];
    const cellRadius = Math.ceil(radius / this.gridCellSize);
    const centerCellX = Math.floor(x / this.gridCellSize);
    const centerCellY = Math.floor(y / this.gridCellSize);
    
    for (let dx = -cellRadius; dx <= cellRadius; dx++) {
      for (let dy = -cellRadius; dy <= cellRadius; dy++) {
        const key = `${centerCellX + dx},${centerCellY + dy}`;
        const cell = this.spatialGrid.get(key);
        
        if (cell) {
          cell.forEach(id => {
            const soldier = this.soldiers.get(id);
            if (soldier && soldier.state !== 'dead') {
              const dist = Math.sqrt((soldier.x - x) ** 2 + (soldier.y - y) ** 2);
              if (dist <= radius) {
                result.push(soldier);
              }
            }
          });
        }
      }
    }
    
    return result;
  }
  
  private updateSoldierAI(time: number, delta: number): void {
    this.soldiers.forEach(soldier => {
      soldier.update(time, delta);
      
      if (soldier.state === 'dead' || soldier.state === 'routing') return;
      
      // 이미 교전 중이면 스킵
      if (soldier.engagedWith && soldier.engagedWith.state !== 'dead') {
        soldier.state = 'fighting';
        return;
      }
      
      // 가까운 적 찾기
      const nearby = this.getNearbyEntities(soldier.x, soldier.y, soldier.range);
      const enemies = nearby.filter(s => 
        s.teamId !== soldier.teamId && 
        s.state !== 'dead' && 
        s.state !== 'routing'
      );
      
      if (enemies.length === 0) {
        // 적이 없으면 대기 또는 진형 복귀
        if (soldier.state !== 'moving') {
          soldier.state = 'idle';
        }
        return;
      }
      
      // 가장 가까운 적
      let closest: Soldier | null = null;
      let minDist = Infinity;
      
      for (const enemy of enemies) {
        const dist = soldier.getDistanceTo(enemy);
        if (dist < minDist) {
          minDist = dist;
          closest = enemy;
        }
      }
      
      if (!closest) return;
      
      if (soldier.isRanged) {
        // 원거리 유닛: 사거리 내면 사격
        if (minDist <= soldier.range) {
          soldier.state = 'fighting';
          soldier.facing = Math.atan2(closest.y - soldier.y, closest.x - soldier.x);
        } else {
          // 사거리 밖이면 이동
          soldier.targetX = closest.x;
          soldier.targetY = closest.y;
          soldier.state = 'moving';
        }
      } else {
        // 근접 유닛
        if (minDist <= 20) {
          // 교전 거리 내
          soldier.engagedWith = closest;
          closest.engagedWith = soldier;
          soldier.state = 'fighting';
          closest.state = 'fighting';
        } else if (minDist <= 100) {
          // 돌격
          soldier.targetX = closest.x;
          soldier.targetY = closest.y;
          soldier.state = 'charging';
        } else {
          // 이동
          soldier.targetX = closest.x;
          soldier.targetY = closest.y;
          soldier.state = 'moving';
        }
      }
    });
  }
  
  private processCombat(time: number, delta: number): void {
    const attackCooldown = 1000; // 1초
    
    this.soldiers.forEach(soldier => {
      if (soldier.state !== 'fighting') return;
      if (time - soldier.lastAttackTime < attackCooldown) return;
      
      soldier.lastAttackTime = time;
      
      if (soldier.isRanged) {
        this.processRangedAttack(soldier);
      } else {
        this.processMeleeAttack(soldier);
      }
    });
  }
  
  private processMeleeAttack(attacker: Soldier): void {
    const target = attacker.engagedWith;
    if (!target || target.state === 'dead') {
      attacker.engagedWith = undefined;
      attacker.state = 'idle';
      return;
    }
    
    // 데미지 계산
    const baseDamage = attacker.attack;
    const fatigueMultiplier = 1 - attacker.fatigue / 200;
    const damage = baseDamage * fatigueMultiplier * (0.8 + Math.random() * 0.4);
    
    target.takeDamage(damage, attacker);
    
    // 킬 기록 (hp로 체크)
    if (target.hp <= 0) {
      const attackerSquad = this.squads.get(attacker.squadId);
      const targetSquad = this.squads.get(target.squadId);
      if (attackerSquad) attackerSquad.kills++;
      if (targetSquad) targetSquad.losses++;
    }
    
    // 피로도 증가
    attacker.fatigue = Math.min(100, attacker.fatigue + 1);
  }
  
  private processRangedAttack(attacker: Soldier): void {
    // 가장 가까운 적 찾기
    const nearby = this.getNearbyEntities(attacker.x, attacker.y, attacker.range);
    const enemies = nearby.filter(s => 
      s.teamId !== attacker.teamId && 
      s.state !== 'dead'
    );
    
    if (enemies.length === 0) return;
    
    // 가장 가까운 적
    let target: Soldier | null = null;
    let minDist = Infinity;
    
    for (const enemy of enemies) {
      const dist = attacker.getDistanceTo(enemy);
      if (dist < minDist) {
        minDist = dist;
        target = enemy;
      }
    }
    
    if (!target) return;
    
    // 명중률 계산
    const baseAccuracy = 0.6;
    const distancePenalty = minDist / attacker.range * 0.3;
    const accuracy = Math.max(0.1, baseAccuracy - distancePenalty);
    const hit = Math.random() < accuracy;
    
    // 투사체 생성
    const projectile = new Projectile(this, {
      sourceId: attacker.soldierId,
      targetId: target.soldierId,
      damage: attacker.attack * 0.8,
      startX: attacker.x,
      startY: attacker.y - 10,
      endX: target.x,
      endY: target.y - 5,
      hit,
    });
    
    this.projectiles.push(projectile);
    
    // 피로도 증가
    attacker.fatigue = Math.min(100, attacker.fatigue + 0.5);
  }
  
  private updateProjectiles(time: number, delta: number): void {
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const proj = this.projectiles[i];
      const completed = proj.update(time, delta);
      
      if (completed) {
        // 명중 처리
        if (proj.hit) {
          const target = this.soldiers.get(proj.targetId);
          const source = this.soldiers.get(proj.sourceId);
          
          if (target && source && target.hp > 0) {
            target.takeDamage(proj.damage, source);
            
            // 킬 기록 (hp로 체크)
            if (target.hp <= 0) {
              const attackerSquad = this.squads.get(source.squadId);
              const targetSquad = this.squads.get(target.squadId);
              if (attackerSquad) attackerSquad.kills++;
              if (targetSquad) targetSquad.losses++;
            }
          }
        }
        
        // 투사체 제거
        proj.destroy();
        this.projectiles.splice(i, 1);
      }
    }
  }
  
  private updateMorale(delta: number): void {
    const deltaSeconds = delta / 1000;
    
    this.soldiers.forEach(soldier => {
      if (soldier.state === 'dead') return;
      
      // 주변 아군/적군 수에 따른 사기 변화
      const nearby = this.getNearbyEntities(soldier.x, soldier.y, 100);
      const nearbyAllies = nearby.filter(s => s.teamId === soldier.teamId && s.state !== 'dead').length;
      const nearbyEnemies = nearby.filter(s => s.teamId !== soldier.teamId && s.state !== 'dead').length;
      
      if (nearbyEnemies > nearbyAllies * 2) {
        soldier.morale -= 2 * deltaSeconds;
      } else if (nearbyAllies > nearbyEnemies * 2) {
        soldier.morale += 1 * deltaSeconds;
      }
      
      // 사기 범위 제한
      soldier.morale = Phaser.Math.Clamp(soldier.morale, 0, 100);
      
      // 패주 체크
      if (soldier.morale < 20 && soldier.state !== 'routing') {
        soldier.state = 'routing';
        soldier.engagedWith = undefined;
      }
    });
  }
  
  private updateSquads(): void {
    this.squads.forEach(squad => {
      squad.updatePosition();
      
      // 부대 상태 결정
      const alive = squad.aliveSoldiers;
      
      if (alive === 0) {
        squad.state = 'destroyed';
      } else if (squad.avgMorale < 20) {
        squad.state = 'routing';
      } else if (squad.avgMorale < 40) {
        squad.state = 'wavering';
      }
    });
  }
  
  private updateStats(): void {
    let attackerAlive = 0, attackerKills = 0;
    let defenderAlive = 0, defenderKills = 0;
    
    this.squads.forEach(squad => {
      if (squad.teamId === 'attacker') {
        attackerAlive += squad.aliveSoldiers;
        attackerKills += squad.kills;
      } else {
        defenderAlive += squad.aliveSoldiers;
        defenderKills += squad.kills;
      }
    });
    
    this.attackerStats.alive = attackerAlive;
    this.attackerStats.kills = attackerKills;
    this.defenderStats.alive = defenderAlive;
    this.defenderStats.kills = defenderKills;
    
    this.onStatsUpdate?.(this.attackerStats, this.defenderStats);
  }
  
  private checkVictory(): void {
    if (this.attackerStats.alive === 0) {
      this.battleState = 'ended';
      this.winner = 'defender';
      this.onBattleEnd?.(this.winner);
    } else if (this.defenderStats.alive === 0) {
      this.battleState = 'ended';
      this.winner = 'attacker';
      this.onBattleEnd?.(this.winner);
    }
  }
  
  // ========================================
  // 외부 API
  // ========================================
  
  startBattle(): void {
    this.battleState = 'running';
    console.log('⚔️ Battle started!');
  }
  
  pauseBattle(): void {
    this.battleState = this.battleState === 'running' ? 'paused' : 'running';
  }
  
  setSpeed(speed: number): void {
    this.time.timeScale = speed;
  }
}

// ========================================
// Phaser 게임 설정
// ========================================

export const createBattleGame = (parent: HTMLElement): Phaser.Game => {
  const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    parent,
    width: parent.clientWidth || 1200,
    height: parent.clientHeight || 800,
    backgroundColor: '#2d572c',
    scene: [BattleScene],
    physics: {
      default: 'arcade',
      arcade: {
        debug: false,
      },
    },
    render: {
      antialias: true,
      pixelArt: false,
    },
    fps: {
      target: 60,
      forceSetTimeOut: true,
    },
  };
  
  return new Phaser.Game(config);
};

