/**
 * 복셀 전술 전투 엔진
 * 
 * 실시간 전투 시스템:
 * - 병종 상성
 * - 진형 보너스
 * - 사기/훈련도 영향
 * - 지형 효과
 * - 특기 시스템
 */

// ===== 타입 정의 =====

export enum UnitType {
  INFANTRY = 'infantry',     // 보병
  ARCHER = 'archer',         // 궁병
  CAVALRY = 'cavalry',       // 기병
  WIZARD = 'wizard',         // 책사/귀병
  SIEGE = 'siege',           // 공성
  REGIONAL = 'regional',     // 지역/이민족
}

export enum Formation {
  LINE = 'line',             // 횡진 - 기본
  COLUMN = 'column',         // 종진 - 돌파
  SQUARE = 'square',         // 방진 - 방어
  WEDGE = 'wedge',           // 쐐기 - 공격
  CRANE = 'crane',           // 학익진 - 포위
  FISH = 'fish',             // 어린진 - 유연
}

export enum Stance {
  AGGRESSIVE = 'aggressive', // 공격적
  DEFENSIVE = 'defensive',   // 방어적
  BALANCED = 'balanced',     // 균형
  SKIRMISH = 'skirmish',     // 산개
  RETREAT = 'retreat',       // 후퇴
}

export enum TerrainType {
  PLAIN = 'plain',           // 평지
  FOREST = 'forest',         // 숲
  HILL = 'hill',             // 언덕
  RIVER = 'river',           // 강
  MOUNTAIN = 'mountain',     // 산
  SWAMP = 'swamp',           // 늪
  CASTLE = 'castle',         // 성
}

export interface Position {
  x: number;
  z: number;
}

export interface BattleUnit {
  id: string;
  name: string;
  generalName: string;
  
  // 유닛 타입
  unitType: UnitType;
  unitTypeId: number;        // VoxelUnitDefinitions ID
  
  // 소속
  nation: string;
  teamId: 'attacker' | 'defender';
  
  // 위치/이동
  position: Position;
  targetPosition?: Position;
  heading: number;           // 방향 (라디안)
  moveSpeed: number;         // 이동 속도 (units/sec)
  
  // 스탯
  troops: number;            // 현재 병력
  maxTroops: number;         // 최대 병력
  morale: number;            // 사기 (0-100)
  training: number;          // 훈련도 (0-100)
  
  // 장수 능력치
  leadership: number;        // 통솔
  strength: number;          // 무력
  intelligence: number;      // 지력
  
  // 전투 상태
  formation: Formation;
  stance: Stance;
  state: 'idle' | 'moving' | 'attacking' | 'defending' | 'retreating' | 'dead';
  
  // 전투 정보
  targetId?: string;         // 공격 대상
  lastAttackTime: number;    // 마지막 공격 시간
  attackCooldown: number;    // 공격 쿨다운 (ms)
  attackRange: number;       // 공격 범위
  
  // 버프/디버프
  buffs: Buff[];
  debuffs: Debuff[];
}

export interface Buff {
  id: string;
  type: 'attack' | 'defense' | 'morale' | 'speed';
  value: number;             // 퍼센트 보너스
  duration: number;          // 남은 시간 (ms)
}

export interface Debuff {
  id: string;
  type: 'attack' | 'defense' | 'morale' | 'speed' | 'stun';
  value: number;
  duration: number;
}

export interface BattleEvent {
  type: 'attack' | 'damage' | 'death' | 'retreat' | 'morale_break' | 'skill' | 'projectile';
  timestamp: number;
  sourceId: string;
  targetId?: string;
  data: Record<string, any>;
}

export interface Projectile {
  id: string;
  type: 'arrow' | 'bolt' | 'stone' | 'fire' | 'javelin';
  position: Position;
  velocity: { x: number; z: number };
  sourceId: string;
  targetId: string;
  damage: number;
  createdAt: number;
}

export interface BattleState {
  id: string;
  turn: number;
  currentTime: number;       // 경과 시간 (ms)
  phase: 'preparation' | 'battle' | 'result';
  terrain: TerrainType;
  
  units: Map<string, BattleUnit>;
  projectiles: Projectile[];
  events: BattleEvent[];
  
  attackerNation: string;
  defenderNation: string;
  winner?: 'attacker' | 'defender' | 'draw';
}

// ===== 상수 정의 =====

/** 병종 상성 테이블 (공격자 → 방어자) */
const UNIT_ADVANTAGE: Record<UnitType, Record<UnitType, number>> = {
  [UnitType.INFANTRY]: {
    [UnitType.INFANTRY]: 1.0,
    [UnitType.ARCHER]: 1.3,    // 보병 → 궁병 유리
    [UnitType.CAVALRY]: 0.8,   // 보병 → 기병 불리
    [UnitType.WIZARD]: 1.1,
    [UnitType.SIEGE]: 1.2,
    [UnitType.REGIONAL]: 1.0,
  },
  [UnitType.ARCHER]: {
    [UnitType.INFANTRY]: 0.9,
    [UnitType.ARCHER]: 1.0,
    [UnitType.CAVALRY]: 1.2,   // 궁병 → 기병 유리
    [UnitType.WIZARD]: 0.8,
    [UnitType.SIEGE]: 0.7,
    [UnitType.REGIONAL]: 1.0,
  },
  [UnitType.CAVALRY]: {
    [UnitType.INFANTRY]: 1.2,  // 기병 → 보병 유리
    [UnitType.ARCHER]: 1.4,    // 기병 → 궁병 매우 유리
    [UnitType.CAVALRY]: 1.0,
    [UnitType.WIZARD]: 1.3,
    [UnitType.SIEGE]: 1.5,     // 기병 → 공성 매우 유리
    [UnitType.REGIONAL]: 1.1,
  },
  [UnitType.WIZARD]: {
    [UnitType.INFANTRY]: 1.0,
    [UnitType.ARCHER]: 1.2,
    [UnitType.CAVALRY]: 0.9,
    [UnitType.WIZARD]: 1.0,
    [UnitType.SIEGE]: 1.3,
    [UnitType.REGIONAL]: 1.0,
  },
  [UnitType.SIEGE]: {
    [UnitType.INFANTRY]: 1.3,
    [UnitType.ARCHER]: 1.2,
    [UnitType.CAVALRY]: 0.6,   // 공성 → 기병 매우 불리
    [UnitType.WIZARD]: 0.8,
    [UnitType.SIEGE]: 1.0,
    [UnitType.REGIONAL]: 1.1,
  },
  [UnitType.REGIONAL]: {
    [UnitType.INFANTRY]: 1.0,
    [UnitType.ARCHER]: 1.0,
    [UnitType.CAVALRY]: 1.0,
    [UnitType.WIZARD]: 1.0,
    [UnitType.SIEGE]: 1.0,
    [UnitType.REGIONAL]: 1.0,
  },
};

/** 진형 보너스 */
const FORMATION_BONUS: Record<Formation, { attack: number; defense: number; speed: number }> = {
  [Formation.LINE]: { attack: 1.0, defense: 1.0, speed: 1.0 },
  [Formation.COLUMN]: { attack: 1.2, defense: 0.8, speed: 1.1 },
  [Formation.SQUARE]: { attack: 0.8, defense: 1.4, speed: 0.7 },
  [Formation.WEDGE]: { attack: 1.3, defense: 0.7, speed: 1.2 },
  [Formation.CRANE]: { attack: 1.1, defense: 0.9, speed: 0.9 },
  [Formation.FISH]: { attack: 1.0, defense: 1.0, speed: 1.1 },
};

/** 자세 보너스 */
const STANCE_BONUS: Record<Stance, { attack: number; defense: number; morale: number }> = {
  [Stance.AGGRESSIVE]: { attack: 1.3, defense: 0.7, morale: 1.1 },
  [Stance.DEFENSIVE]: { attack: 0.7, defense: 1.4, morale: 1.0 },
  [Stance.BALANCED]: { attack: 1.0, defense: 1.0, morale: 1.0 },
  [Stance.SKIRMISH]: { attack: 0.9, defense: 0.9, morale: 0.9 },
  [Stance.RETREAT]: { attack: 0.5, defense: 0.6, morale: 0.7 },
};

/** 지형 보너스 (병종별) */
const TERRAIN_BONUS: Record<TerrainType, Record<UnitType, number>> = {
  [TerrainType.PLAIN]: {
    [UnitType.INFANTRY]: 1.0,
    [UnitType.ARCHER]: 1.0,
    [UnitType.CAVALRY]: 1.2,   // 평지에서 기병 유리
    [UnitType.WIZARD]: 1.0,
    [UnitType.SIEGE]: 1.1,
    [UnitType.REGIONAL]: 1.0,
  },
  [TerrainType.FOREST]: {
    [UnitType.INFANTRY]: 1.1,
    [UnitType.ARCHER]: 1.2,   // 숲에서 궁병 유리
    [UnitType.CAVALRY]: 0.7,  // 숲에서 기병 불리
    [UnitType.WIZARD]: 1.0,
    [UnitType.SIEGE]: 0.6,
    [UnitType.REGIONAL]: 1.1,
  },
  [TerrainType.HILL]: {
    [UnitType.INFANTRY]: 1.1,
    [UnitType.ARCHER]: 1.3,   // 언덕에서 궁병 매우 유리
    [UnitType.CAVALRY]: 0.8,
    [UnitType.WIZARD]: 1.1,
    [UnitType.SIEGE]: 0.9,
    [UnitType.REGIONAL]: 1.0,
  },
  [TerrainType.RIVER]: {
    [UnitType.INFANTRY]: 0.8,
    [UnitType.ARCHER]: 0.9,
    [UnitType.CAVALRY]: 0.6,
    [UnitType.WIZARD]: 1.0,
    [UnitType.SIEGE]: 0.5,
    [UnitType.REGIONAL]: 0.9,
  },
  [TerrainType.MOUNTAIN]: {
    [UnitType.INFANTRY]: 0.9,
    [UnitType.ARCHER]: 1.1,
    [UnitType.CAVALRY]: 0.5,
    [UnitType.WIZARD]: 1.0,
    [UnitType.SIEGE]: 0.4,
    [UnitType.REGIONAL]: 1.2,
  },
  [TerrainType.SWAMP]: {
    [UnitType.INFANTRY]: 0.7,
    [UnitType.ARCHER]: 0.8,
    [UnitType.CAVALRY]: 0.4,
    [UnitType.WIZARD]: 0.9,
    [UnitType.SIEGE]: 0.3,
    [UnitType.REGIONAL]: 1.0,
  },
  [TerrainType.CASTLE]: {
    [UnitType.INFANTRY]: 1.3,
    [UnitType.ARCHER]: 1.5,
    [UnitType.CAVALRY]: 0.6,
    [UnitType.WIZARD]: 1.2,
    [UnitType.SIEGE]: 0.8,
    [UnitType.REGIONAL]: 1.0,
  },
};

/** 병종별 기본 스탯 */
const UNIT_BASE_STATS: Record<UnitType, { 
  attack: number; 
  defense: number; 
  speed: number;
  range: number;
  cooldown: number;
}> = {
  [UnitType.INFANTRY]: { attack: 100, defense: 100, speed: 3, range: 1.5, cooldown: 1500 },
  [UnitType.ARCHER]: { attack: 80, defense: 60, speed: 3.5, range: 8, cooldown: 2000 },
  [UnitType.CAVALRY]: { attack: 120, defense: 80, speed: 6, range: 2, cooldown: 1200 },
  [UnitType.WIZARD]: { attack: 70, defense: 50, speed: 2.5, range: 6, cooldown: 2500 },
  [UnitType.SIEGE]: { attack: 150, defense: 120, speed: 1, range: 10, cooldown: 4000 },
  [UnitType.REGIONAL]: { attack: 100, defense: 90, speed: 3.5, range: 2, cooldown: 1500 },
};

// ===== 전투 엔진 클래스 =====

export class BattleEngine {
  private state: BattleState;
  private eventListeners: Map<string, ((event: BattleEvent) => void)[]> = new Map();
  private tickInterval: number | null = null;
  private lastTickTime: number = 0;

  constructor(config: {
    id: string;
    terrain: TerrainType;
    attackerNation: string;
    defenderNation: string;
  }) {
    this.state = {
      id: config.id,
      turn: 0,
      currentTime: 0,
      phase: 'preparation',
      terrain: config.terrain,
      units: new Map(),
      projectiles: [],
      events: [],
      attackerNation: config.attackerNation,
      defenderNation: config.defenderNation,
    };
  }

  // ===== 유닛 관리 =====

  addUnit(unit: Omit<BattleUnit, 'lastAttackTime' | 'attackCooldown' | 'attackRange' | 'buffs' | 'debuffs'>): void {
    const baseStats = UNIT_BASE_STATS[unit.unitType];
    
    const fullUnit: BattleUnit = {
      ...unit,
      lastAttackTime: 0,
      attackCooldown: baseStats.cooldown,
      attackRange: baseStats.range,
      buffs: [],
      debuffs: [],
    };
    
    this.state.units.set(unit.id, fullUnit);
  }

  removeUnit(unitId: string): void {
    this.state.units.delete(unitId);
  }

  getUnit(unitId: string): BattleUnit | undefined {
    return this.state.units.get(unitId);
  }

  getAllUnits(): BattleUnit[] {
    return Array.from(this.state.units.values());
  }

  // ===== 전투 시작/종료 =====

  start(): void {
    this.state.phase = 'battle';
    this.lastTickTime = Date.now();
    this.tickInterval = window.setInterval(() => this.tick(), 16) as unknown as number; // ~60fps
  }

  stop(): void {
    if (this.tickInterval) {
      clearInterval(this.tickInterval);
      this.tickInterval = null;
    }
  }

  pause(): void {
    this.stop();
  }

  resume(): void {
    this.lastTickTime = Date.now();
    this.tickInterval = window.setInterval(() => this.tick(), 16) as unknown as number;
  }

  // ===== 메인 틱 =====

  private tick(): void {
    const now = Date.now();
    const deltaTime = now - this.lastTickTime;
    this.lastTickTime = now;
    this.state.currentTime += deltaTime;

    if (this.state.phase !== 'battle') return;

    // 0. 자동 전투 AI
    this.runAutoBattleAI();

    // 1. 유닛 이동 업데이트
    this.updateMovement(deltaTime);

    // 2. 전투 처리
    this.processCombat(deltaTime);

    // 3. 투사체 업데이트
    this.updateProjectiles(deltaTime);

    // 4. 버프/디버프 업데이트
    this.updateBuffs(deltaTime);

    // 5. 사기 체크
    this.checkMorale();

    // 6. 승패 체크
    this.checkVictory();
  }

  // ===== 자동 전투 AI =====

  private runAutoBattleAI(): void {
    this.state.units.forEach(unit => {
      if (unit.state === 'dead' || unit.state === 'retreating') return;

      // 타겟 유효성 검사
      if (unit.targetId) {
        const currentTarget = this.state.units.get(unit.targetId);
        if (!currentTarget || currentTarget.state === 'dead') {
          // 타겟이 죽었으면 새 타겟 찾기
          unit.targetId = undefined;
          unit.targetPosition = undefined;
        }
      }

      // 타겟이 없으면 가장 가까운 적 찾기
      if (!unit.targetId) {
        const nearestEnemy = this.findNearestEnemy(unit);
        if (nearestEnemy) {
          unit.targetId = nearestEnemy.id;
        }
      }

      // 타겟이 있으면 사거리 체크 및 이동
      if (unit.targetId) {
        const target = this.state.units.get(unit.targetId);
        if (target && target.state !== 'dead') {
          const distance = this.getDistance(unit.position, target.position);
          
          // 사거리 밖이면 적을 향해 이동
          if (distance > unit.attackRange) {
            // 적의 현재 위치를 추적 (매 틱마다 갱신)
            unit.targetPosition = { ...target.position };
            unit.state = 'moving';
          } else {
            // 사거리 안에 들어왔으면 이동 중지
            unit.targetPosition = undefined;
            if (unit.state === 'moving') {
              unit.state = 'idle';
            }
          }
        }
      }
    });
  }

  private findNearestEnemy(unit: BattleUnit): BattleUnit | null {
    let nearest: BattleUnit | null = null;
    let nearestDistance = Infinity;

    this.state.units.forEach(other => {
      if (other.teamId === unit.teamId) return; // 같은 팀
      if (other.state === 'dead') return;

      const distance = this.getDistance(unit.position, other.position);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearest = other;
      }
    });

    return nearest;
  }

  // ===== 이동 처리 =====

  private updateMovement(deltaTime: number): void {
    this.state.units.forEach(unit => {
      if (unit.state === 'dead' || !unit.targetPosition) return;

      const dx = unit.targetPosition.x - unit.position.x;
      const dz = unit.targetPosition.z - unit.position.z;
      const distance = Math.sqrt(dx * dx + dz * dz);

      if (distance < 0.1) {
        // 도착
        unit.position = { ...unit.targetPosition };
        unit.targetPosition = undefined;
        if (unit.state === 'moving') {
          unit.state = 'idle';
        }
        return;
      }

      // 이동 속도 계산
      const baseSpeed = UNIT_BASE_STATS[unit.unitType].speed;
      const formationMod = FORMATION_BONUS[unit.formation].speed;
      const stanceMod = unit.stance === Stance.RETREAT ? 1.3 : 1.0;
      const terrainMod = TERRAIN_BONUS[this.state.terrain][unit.unitType];
      
      const effectiveSpeed = baseSpeed * formationMod * stanceMod * terrainMod * (unit.moveSpeed / 3);

      // 이동
      const moveDistance = effectiveSpeed * (deltaTime / 1000);
      const ratio = Math.min(moveDistance / distance, 1);
      
      unit.position.x += dx * ratio;
      unit.position.z += dz * ratio;
      
      // 방향 업데이트
      unit.heading = Math.atan2(dx, dz);
      unit.state = 'moving';
    });
  }

  // ===== 전투 처리 =====

  private processCombat(deltaTime: number): void {
    this.state.units.forEach(unit => {
      if (unit.state === 'dead' || unit.state === 'retreating') return;
      if (!unit.targetId) return;

      const target = this.state.units.get(unit.targetId);
      if (!target || target.state === 'dead') {
        unit.targetId = undefined;
        unit.state = 'idle';
        return;
      }

      // 거리 체크
      const distance = this.getDistance(unit.position, target.position);
      
      if (distance > unit.attackRange) {
        // 사거리 밖 - 접근
        unit.targetPosition = { ...target.position };
        return;
      }

      // 쿨다운 체크
      if (this.state.currentTime - unit.lastAttackTime < unit.attackCooldown) {
        return;
      }

      // 공격 실행
      this.executeAttack(unit, target);
    });
  }

  private executeAttack(attacker: BattleUnit, defender: BattleUnit): void {
    attacker.lastAttackTime = this.state.currentTime;
    attacker.state = 'attacking';
    defender.state = 'defending';

    // 원거리 유닛은 투사체 생성
    if (attacker.unitType === UnitType.ARCHER || attacker.unitType === UnitType.SIEGE) {
      this.createProjectile(attacker, defender);
      return;
    }

    // 근접 공격 - 즉시 데미지
    const damage = this.calculateDamage(attacker, defender);
    this.applyDamage(defender, damage, attacker.id);
  }

  // ===== 데미지 계산 =====

  calculateDamage(attacker: BattleUnit, defender: BattleUnit): number {
    const baseStats = UNIT_BASE_STATS[attacker.unitType];
    
    // 1. 기본 공격력
    let attackPower = baseStats.attack;
    
    // 2. 능력치 가중
    const statBonus = (
      attacker.leadership * 0.3 +
      attacker.strength * 0.4 +
      attacker.intelligence * 0.3
    ) / 100;
    attackPower *= (1 + statBonus);

    // 3. 병력 수 반영 (제곱근)
    const troopFactor = Math.sqrt(attacker.troops / 100);
    attackPower *= troopFactor;

    // 4. 사기/훈련도
    const moraleBonus = 0.5 + (attacker.morale / 100) * 0.5;
    const trainingBonus = 0.7 + (attacker.training / 100) * 0.3;
    attackPower *= moraleBonus * trainingBonus;

    // 5. 병종 상성
    const typeAdvantage = UNIT_ADVANTAGE[attacker.unitType][defender.unitType];
    attackPower *= typeAdvantage;

    // 6. 진형 보너스
    const formationAttack = FORMATION_BONUS[attacker.formation].attack;
    const formationDefense = FORMATION_BONUS[defender.formation].defense;
    attackPower *= formationAttack;

    // 7. 자세 보너스
    const stanceAttack = STANCE_BONUS[attacker.stance].attack;
    const stanceDefense = STANCE_BONUS[defender.stance].defense;
    attackPower *= stanceAttack;

    // 8. 지형 보너스
    const terrainBonus = TERRAIN_BONUS[this.state.terrain][attacker.unitType];
    attackPower *= terrainBonus;

    // 9. 방어력 계산
    const defenderStats = UNIT_BASE_STATS[defender.unitType];
    let defensePower = defenderStats.defense;
    defensePower *= (1 + (defender.leadership * 0.2 + defender.strength * 0.3) / 100);
    defensePower *= formationDefense * stanceDefense;

    // 10. 최종 데미지
    const rawDamage = Math.max(10, attackPower - defensePower * 0.5);
    const variance = 0.9 + Math.random() * 0.2;
    const finalDamage = Math.floor(rawDamage * variance);

    // 11. 병사 손실로 변환
    const troopLoss = Math.floor(finalDamage / 10);
    return Math.min(troopLoss, defender.troops);
  }

  private applyDamage(unit: BattleUnit, damage: number, sourceId: string): void {
    unit.troops -= damage;
    
    // 사기 감소
    const moraleLoss = Math.floor(damage / unit.maxTroops * 30);
    unit.morale = Math.max(0, unit.morale - moraleLoss);

    // 이벤트 발생
    this.emitEvent({
      type: 'damage',
      timestamp: this.state.currentTime,
      sourceId,
      targetId: unit.id,
      data: { damage, remainingTroops: unit.troops, morale: unit.morale },
    });

    // 전멸 체크
    if (unit.troops <= 0) {
      unit.troops = 0;
      unit.state = 'dead';
      this.emitEvent({
        type: 'death',
        timestamp: this.state.currentTime,
        sourceId,
        targetId: unit.id,
        data: {},
      });
    }
  }

  // ===== 투사체 처리 =====

  private createProjectile(attacker: BattleUnit, target: BattleUnit): void {
    const dx = target.position.x - attacker.position.x;
    const dz = target.position.z - attacker.position.z;
    const distance = Math.sqrt(dx * dx + dz * dz);
    
    const speed = 15; // units/sec
    const velocity = {
      x: (dx / distance) * speed,
      z: (dz / distance) * speed,
    };

    const projectileType = attacker.unitType === UnitType.ARCHER ? 'arrow' : 'stone';
    const damage = this.calculateDamage(attacker, target);

    const projectile: Projectile = {
      id: `proj-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: projectileType,
      position: { ...attacker.position },
      velocity,
      sourceId: attacker.id,
      targetId: target.id,
      damage,
      createdAt: this.state.currentTime,
    };

    this.state.projectiles.push(projectile);

    this.emitEvent({
      type: 'projectile',
      timestamp: this.state.currentTime,
      sourceId: attacker.id,
      targetId: target.id,
      data: { projectileId: projectile.id, type: projectile.type },
    });
  }

  private updateProjectiles(deltaTime: number): void {
    const toRemove: string[] = [];

    this.state.projectiles.forEach(proj => {
      // 이동
      proj.position.x += proj.velocity.x * (deltaTime / 1000);
      proj.position.z += proj.velocity.z * (deltaTime / 1000);

      // 타겟 체크
      const target = this.state.units.get(proj.targetId);
      if (!target) {
        toRemove.push(proj.id);
        return;
      }

      const distance = this.getDistance(proj.position, target.position);
      if (distance < 0.5) {
        // 명중
        this.applyDamage(target, proj.damage, proj.sourceId);
        toRemove.push(proj.id);
      }

      // 타임아웃 (5초)
      if (this.state.currentTime - proj.createdAt > 5000) {
        toRemove.push(proj.id);
      }
    });

    this.state.projectiles = this.state.projectiles.filter(p => !toRemove.includes(p.id));
  }

  // ===== 버프/디버프 =====

  private updateBuffs(deltaTime: number): void {
    this.state.units.forEach(unit => {
      unit.buffs = unit.buffs.filter(buff => {
        buff.duration -= deltaTime;
        return buff.duration > 0;
      });

      unit.debuffs = unit.debuffs.filter(debuff => {
        debuff.duration -= deltaTime;
        return debuff.duration > 0;
      });
    });
  }

  // ===== 사기 체크 =====

  private checkMorale(): void {
    this.state.units.forEach(unit => {
      if (unit.state === 'dead') return;

      // 사기 붕괴
      if (unit.morale <= 20 && unit.state !== 'retreating') {
        unit.state = 'retreating';
        unit.stance = Stance.RETREAT;
        
        // 후퇴 방향 설정 (적 반대 방향)
        const retreatDir = unit.teamId === 'attacker' ? -1 : 1;
        unit.targetPosition = {
          x: unit.position.x + retreatDir * 20,
          z: unit.position.z,
        };

        this.emitEvent({
          type: 'morale_break',
          timestamp: this.state.currentTime,
          sourceId: unit.id,
          data: { morale: unit.morale },
        });
      }

      // 사기 자연 회복 (전투 중이 아닐 때)
      if (unit.state === 'idle' && unit.morale < 100) {
        unit.morale = Math.min(100, unit.morale + 0.01);
      }
    });
  }

  // ===== 승패 체크 =====

  private checkVictory(): void {
    const attackerUnits = this.getAllUnits().filter(u => u.teamId === 'attacker' && u.state !== 'dead');
    const defenderUnits = this.getAllUnits().filter(u => u.teamId === 'defender' && u.state !== 'dead');

    if (attackerUnits.length === 0) {
      this.state.winner = 'defender';
      this.state.phase = 'result';
      this.stop();
    } else if (defenderUnits.length === 0) {
      this.state.winner = 'attacker';
      this.state.phase = 'result';
      this.stop();
    }
  }

  // ===== 명령 =====

  moveUnit(unitId: string, target: Position): void {
    const unit = this.state.units.get(unitId);
    if (!unit || unit.state === 'dead') return;
    
    unit.targetPosition = target;
    unit.state = 'moving';
  }

  attackTarget(unitId: string, targetId: string): void {
    const unit = this.state.units.get(unitId);
    const target = this.state.units.get(targetId);
    if (!unit || !target || unit.state === 'dead' || target.state === 'dead') return;
    
    unit.targetId = targetId;
  }

  setFormation(unitId: string, formation: Formation): void {
    const unit = this.state.units.get(unitId);
    if (!unit) return;
    unit.formation = formation;
  }

  setStance(unitId: string, stance: Stance): void {
    const unit = this.state.units.get(unitId);
    if (!unit) return;
    unit.stance = stance;
  }

  // ===== 유틸리티 =====

  private getDistance(pos1: Position, pos2: Position): number {
    const dx = pos2.x - pos1.x;
    const dz = pos2.z - pos1.z;
    return Math.sqrt(dx * dx + dz * dz);
  }

  // ===== 이벤트 시스템 =====

  on(eventType: string, callback: (event: BattleEvent) => void): void {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, []);
    }
    this.eventListeners.get(eventType)!.push(callback);
  }

  off(eventType: string, callback: (event: BattleEvent) => void): void {
    const listeners = this.eventListeners.get(eventType);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  private emitEvent(event: BattleEvent): void {
    this.state.events.push(event);
    
    const listeners = this.eventListeners.get(event.type);
    if (listeners) {
      listeners.forEach(cb => cb(event));
    }

    // 'all' 리스너
    const allListeners = this.eventListeners.get('all');
    if (allListeners) {
      allListeners.forEach(cb => cb(event));
    }
  }

  // ===== 상태 접근 =====

  getState(): BattleState {
    return this.state;
  }

  getProjectiles(): Projectile[] {
    return this.state.projectiles;
  }

  getEvents(): BattleEvent[] {
    return this.state.events;
  }
}

// ===== 유틸리티 함수 =====

/** VoxelUnitDefinitions의 category를 UnitType으로 변환 */
export function categoryToUnitType(category: string): UnitType {
  const mapping: Record<string, UnitType> = {
    infantry: UnitType.INFANTRY,
    archer: UnitType.ARCHER,
    cavalry: UnitType.CAVALRY,
    wizard: UnitType.WIZARD,
    siege: UnitType.SIEGE,
    regional: UnitType.REGIONAL,
  };
  return mapping[category] || UnitType.INFANTRY;
}

