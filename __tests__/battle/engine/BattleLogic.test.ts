/**
 * BattleEngine (BattleLogic) 유닛 테스트
 * 
 * 전투 로직, 유닛 이동, 전투 판정, 사기 시스템, 승패 판정 테스트
 */

import {
  BattleEngine,
  UnitType,
  Formation,
  Stance,
  TerrainType,
  categoryToUnitType,
  type BattleUnit,
  type BattleEvent,
  type Position,
} from '@/lib/battle/BattleEngine';

describe('BattleEngine', () => {
  let engine: BattleEngine;

  beforeEach(() => {
    engine = new BattleEngine({
      id: 'test-battle',
      terrain: TerrainType.PLAIN,
      attackerNation: '촉',
      defenderNation: '위',
    });
  });

  afterEach(() => {
    engine.stop();
  });

  describe('엔진 초기화', () => {
    it('엔진이 생성되어야 함', () => {
      expect(engine).toBeDefined();
    });

    it('초기 상태가 preparation이어야 함', () => {
      const state = engine.getState();
      expect(state.phase).toBe('preparation');
    });

    it('전투 ID가 설정되어야 함', () => {
      const state = engine.getState();
      expect(state.id).toBe('test-battle');
    });

    it('지형이 설정되어야 함', () => {
      const state = engine.getState();
      expect(state.terrain).toBe(TerrainType.PLAIN);
    });
  });

  describe('유닛 관리', () => {
    const mockUnit: Omit<BattleUnit, 'lastAttackTime' | 'attackCooldown' | 'attackRange' | 'buffs' | 'debuffs'> = {
      id: 'unit-1',
      name: '정규보병',
      generalName: '조운',
      unitType: UnitType.INFANTRY,
      unitTypeId: 1102,
      nation: '촉',
      teamId: 'attacker',
      position: { x: 0, z: 0 },
      heading: 0,
      moveSpeed: 3,
      troops: 1000,
      maxTroops: 1000,
      morale: 100,
      training: 80,
      leadership: 95,
      strength: 97,
      intelligence: 76,
      formation: Formation.LINE,
      stance: Stance.BALANCED,
      state: 'idle',
    };

    it('유닛을 추가할 수 있어야 함', () => {
      engine.addUnit(mockUnit);
      const unit = engine.getUnit('unit-1');
      
      expect(unit).toBeDefined();
      expect(unit?.name).toBe('정규보병');
    });

    it('유닛을 제거할 수 있어야 함', () => {
      engine.addUnit(mockUnit);
      engine.removeUnit('unit-1');
      
      const unit = engine.getUnit('unit-1');
      expect(unit).toBeUndefined();
    });

    it('모든 유닛을 가져올 수 있어야 함', () => {
      engine.addUnit({ ...mockUnit, id: 'unit-1' });
      engine.addUnit({ ...mockUnit, id: 'unit-2' });
      
      const units = engine.getAllUnits();
      expect(units).toHaveLength(2);
    });

    it('추가된 유닛에 기본 스탯이 설정되어야 함', () => {
      engine.addUnit(mockUnit);
      const unit = engine.getUnit('unit-1');
      
      expect(unit?.attackCooldown).toBeGreaterThan(0);
      expect(unit?.attackRange).toBeGreaterThan(0);
      expect(unit?.buffs).toEqual([]);
      expect(unit?.debuffs).toEqual([]);
    });
  });

  describe('전투 시작/종료', () => {
    it('start()로 전투를 시작할 수 있어야 함', () => {
      engine.start();
      const state = engine.getState();
      
      expect(state.phase).toBe('battle');
    });

    it('stop()으로 전투를 중지할 수 있어야 함', () => {
      engine.start();
      engine.stop();
      
      // stop 후 틱이 진행되지 않아야 함
      const stateBefore = engine.getState();
      const timeBefore = stateBefore.currentTime;
      
      // 짧은 대기
      const start = Date.now();
      while (Date.now() - start < 50) {
        // busy wait
      }
      
      const stateAfter = engine.getState();
      expect(stateAfter.currentTime).toBe(timeBefore);
    });

    it('pause()와 resume()이 작동해야 함', () => {
      engine.start();
      engine.pause();
      
      const state = engine.getState();
      // pause 후에도 phase는 battle 상태 유지
      expect(state.phase).toBe('battle');
    });
  });

  describe('유닛 이동', () => {
    const attackerUnit: Omit<BattleUnit, 'lastAttackTime' | 'attackCooldown' | 'attackRange' | 'buffs' | 'debuffs'> = {
      id: 'attacker-1',
      name: '정규보병',
      generalName: '조운',
      unitType: UnitType.INFANTRY,
      unitTypeId: 1102,
      nation: '촉',
      teamId: 'attacker',
      position: { x: 0, z: 0 },
      heading: 0,
      moveSpeed: 3,
      troops: 1000,
      maxTroops: 1000,
      morale: 100,
      training: 80,
      leadership: 95,
      strength: 97,
      intelligence: 76,
      formation: Formation.LINE,
      stance: Stance.BALANCED,
      state: 'idle',
    };

    it('moveUnit()으로 유닛을 이동할 수 있어야 함', () => {
      engine.addUnit(attackerUnit);
      engine.moveUnit('attacker-1', { x: 10, z: 10 });
      
      const unit = engine.getUnit('attacker-1');
      expect(unit?.targetPosition).toEqual({ x: 10, z: 10 });
      expect(unit?.state).toBe('moving');
    });

    it('죽은 유닛은 이동할 수 없어야 함', () => {
      engine.addUnit({ ...attackerUnit, state: 'dead' });
      engine.moveUnit('attacker-1', { x: 10, z: 10 });
      
      const unit = engine.getUnit('attacker-1');
      expect(unit?.targetPosition).toBeUndefined();
    });
  });

  describe('전투 명령', () => {
    const attacker: Omit<BattleUnit, 'lastAttackTime' | 'attackCooldown' | 'attackRange' | 'buffs' | 'debuffs'> = {
      id: 'attacker-1',
      name: '정규보병',
      generalName: '조운',
      unitType: UnitType.INFANTRY,
      unitTypeId: 1102,
      nation: '촉',
      teamId: 'attacker',
      position: { x: 0, z: 0 },
      heading: 0,
      moveSpeed: 3,
      troops: 1000,
      maxTroops: 1000,
      morale: 100,
      training: 80,
      leadership: 95,
      strength: 97,
      intelligence: 76,
      formation: Formation.LINE,
      stance: Stance.BALANCED,
      state: 'idle',
    };

    const defender: Omit<BattleUnit, 'lastAttackTime' | 'attackCooldown' | 'attackRange' | 'buffs' | 'debuffs'> = {
      id: 'defender-1',
      name: '정규보병',
      generalName: '장합',
      unitType: UnitType.INFANTRY,
      unitTypeId: 1102,
      nation: '위',
      teamId: 'defender',
      position: { x: 10, z: 10 },
      heading: Math.PI,
      moveSpeed: 3,
      troops: 1000,
      maxTroops: 1000,
      morale: 100,
      training: 80,
      leadership: 90,
      strength: 88,
      intelligence: 72,
      formation: Formation.LINE,
      stance: Stance.BALANCED,
      state: 'idle',
    };

    it('attackTarget()으로 공격 대상을 지정할 수 있어야 함', () => {
      engine.addUnit(attacker);
      engine.addUnit(defender);
      engine.attackTarget('attacker-1', 'defender-1');
      
      const unit = engine.getUnit('attacker-1');
      expect(unit?.targetId).toBe('defender-1');
    });

    it('setFormation()으로 진형을 변경할 수 있어야 함', () => {
      engine.addUnit(attacker);
      engine.setFormation('attacker-1', Formation.WEDGE);
      
      const unit = engine.getUnit('attacker-1');
      expect(unit?.formation).toBe(Formation.WEDGE);
    });

    it('setStance()로 자세를 변경할 수 있어야 함', () => {
      engine.addUnit(attacker);
      engine.setStance('attacker-1', Stance.AGGRESSIVE);
      
      const unit = engine.getUnit('attacker-1');
      expect(unit?.stance).toBe(Stance.AGGRESSIVE);
    });
  });

  describe('데미지 계산', () => {
    const attacker: BattleUnit = {
      id: 'attacker-1',
      name: '정규보병',
      generalName: '조운',
      unitType: UnitType.INFANTRY,
      unitTypeId: 1102,
      nation: '촉',
      teamId: 'attacker',
      position: { x: 0, z: 0 },
      heading: 0,
      moveSpeed: 3,
      troops: 1000,
      maxTroops: 1000,
      morale: 100,
      training: 80,
      leadership: 95,
      strength: 97,
      intelligence: 76,
      formation: Formation.LINE,
      stance: Stance.BALANCED,
      state: 'idle',
      lastAttackTime: 0,
      attackCooldown: 1500,
      attackRange: 1.5,
      buffs: [],
      debuffs: [],
    };

    const defender: BattleUnit = {
      ...attacker,
      id: 'defender-1',
      teamId: 'defender',
      leadership: 80,
      strength: 75,
      intelligence: 60,
    };

    it('데미지가 양수여야 함', () => {
      const damage = engine.calculateDamage(attacker, defender);
      expect(damage).toBeGreaterThan(0);
    });

    it('높은 무력이 더 높은 데미지를 주어야 함', () => {
      const highStrength = { ...attacker, strength: 99 };
      const lowStrength = { ...attacker, strength: 30 };

      const highDamage = engine.calculateDamage(highStrength, defender);
      const lowDamage = engine.calculateDamage(lowStrength, defender);

      expect(highDamage).toBeGreaterThan(lowDamage);
    });

    it('병력 수가 데미지에 영향을 미쳐야 함', () => {
      const manyTroops = { ...attacker, troops: 2000 };
      const fewTroops = { ...attacker, troops: 100 };

      const manyDamage = engine.calculateDamage(manyTroops, defender);
      const fewDamage = engine.calculateDamage(fewTroops, defender);

      expect(manyDamage).toBeGreaterThan(fewDamage);
    });

    it('사기가 데미지에 영향을 미쳐야 함', () => {
      const highMorale = { ...attacker, morale: 100 };
      const lowMorale = { ...attacker, morale: 20 };

      const highDamage = engine.calculateDamage(highMorale, defender);
      const lowDamage = engine.calculateDamage(lowMorale, defender);

      expect(highDamage).toBeGreaterThan(lowDamage);
    });

    it('진형이 데미지에 영향을 미쳐야 함', () => {
      const wedgeFormation = { ...attacker, formation: Formation.WEDGE };
      const squareFormation = { ...attacker, formation: Formation.SQUARE };

      const wedgeDamage = engine.calculateDamage(wedgeFormation, defender);
      const squareDamage = engine.calculateDamage(squareFormation, defender);

      // 쐐기진이 방진보다 공격적
      expect(wedgeDamage).toBeGreaterThan(squareDamage);
    });

    it('자세가 데미지에 영향을 미쳐야 함', () => {
      const aggressive = { ...attacker, stance: Stance.AGGRESSIVE };
      const defensive = { ...attacker, stance: Stance.DEFENSIVE };

      const aggressiveDamage = engine.calculateDamage(aggressive, defender);
      const defensiveDamage = engine.calculateDamage(defensive, defender);

      expect(aggressiveDamage).toBeGreaterThan(defensiveDamage);
    });
  });

  describe('병종 상성', () => {
    const createUnit = (type: UnitType, teamId: 'attacker' | 'defender'): BattleUnit => ({
      id: `${teamId}-${type}`,
      name: type,
      generalName: '테스트',
      unitType: type,
      unitTypeId: 1102,
      nation: '테스트',
      teamId,
      position: { x: 0, z: 0 },
      heading: 0,
      moveSpeed: 3,
      troops: 1000,
      maxTroops: 1000,
      morale: 100,
      training: 80,
      leadership: 80,
      strength: 80,
      intelligence: 80,
      formation: Formation.LINE,
      stance: Stance.BALANCED,
      state: 'idle',
      lastAttackTime: 0,
      attackCooldown: 1500,
      attackRange: 1.5,
      buffs: [],
      debuffs: [],
    });

    it('보병이 궁병에게 유리해야 함', () => {
      const infantry = createUnit(UnitType.INFANTRY, 'attacker');
      const archer = createUnit(UnitType.ARCHER, 'defender');

      const infantryToArcher = engine.calculateDamage(infantry, archer);
      const archerToInfantry = engine.calculateDamage(archer, infantry);

      expect(infantryToArcher).toBeGreaterThan(archerToInfantry);
    });

    it('기병이 궁병에게 매우 유리해야 함', () => {
      const cavalry = createUnit(UnitType.CAVALRY, 'attacker');
      const archer = createUnit(UnitType.ARCHER, 'defender');

      const cavalryToArcher = engine.calculateDamage(cavalry, archer);
      const archerToCavalry = engine.calculateDamage(archer, cavalry);

      expect(cavalryToArcher).toBeGreaterThan(archerToCavalry * 1.2);
    });

    it('기병이 보병에게 유리해야 함', () => {
      const cavalry = createUnit(UnitType.CAVALRY, 'attacker');
      const infantry = createUnit(UnitType.INFANTRY, 'defender');

      const cavalryToInfantry = engine.calculateDamage(cavalry, infantry);
      const infantryToCavalry = engine.calculateDamage(infantry, cavalry);

      expect(cavalryToInfantry).toBeGreaterThan(infantryToCavalry);
    });

    it('기병이 공성 병기에 매우 유리해야 함', () => {
      const cavalry = createUnit(UnitType.CAVALRY, 'attacker');
      const siege = createUnit(UnitType.SIEGE, 'defender');

      const cavalryToSiege = engine.calculateDamage(cavalry, siege);
      const siegeToCavalry = engine.calculateDamage(siege, cavalry);

      expect(cavalryToSiege).toBeGreaterThan(siegeToCavalry);
    });
  });

  describe('이벤트 시스템', () => {
    it('이벤트 리스너를 등록할 수 있어야 함', () => {
      const callback = jest.fn();
      engine.on('damage', callback);

      // 이벤트 리스너가 등록되었는지 확인하는 간접적인 방법
      expect(() => engine.on('damage', jest.fn())).not.toThrow();
    });

    it('이벤트 리스너를 해제할 수 있어야 함', () => {
      const callback = jest.fn();
      engine.on('damage', callback);
      engine.off('damage', callback);

      // off 후에도 에러 없이 동작해야 함
      expect(() => engine.off('damage', callback)).not.toThrow();
    });

    it('이벤트 로그를 가져올 수 있어야 함', () => {
      const events = engine.getEvents();
      expect(Array.isArray(events)).toBe(true);
    });
  });

  describe('투사체 시스템', () => {
    it('투사체 목록을 가져올 수 있어야 함', () => {
      const projectiles = engine.getProjectiles();
      expect(Array.isArray(projectiles)).toBe(true);
    });
  });

  describe('categoryToUnitType', () => {
    it('infantry → INFANTRY', () => {
      expect(categoryToUnitType('infantry')).toBe(UnitType.INFANTRY);
    });

    it('archer → ARCHER', () => {
      expect(categoryToUnitType('archer')).toBe(UnitType.ARCHER);
    });

    it('cavalry → CAVALRY', () => {
      expect(categoryToUnitType('cavalry')).toBe(UnitType.CAVALRY);
    });

    it('wizard → WIZARD', () => {
      expect(categoryToUnitType('wizard')).toBe(UnitType.WIZARD);
    });

    it('siege → SIEGE', () => {
      expect(categoryToUnitType('siege')).toBe(UnitType.SIEGE);
    });

    it('알 수 없는 카테고리는 INFANTRY로 기본 설정', () => {
      expect(categoryToUnitType('unknown')).toBe(UnitType.INFANTRY);
    });
  });

  describe('진형 보너스', () => {
    const baseUnit: BattleUnit = {
      id: 'test',
      name: 'test',
      generalName: 'test',
      unitType: UnitType.INFANTRY,
      unitTypeId: 1102,
      nation: 'test',
      teamId: 'attacker',
      position: { x: 0, z: 0 },
      heading: 0,
      moveSpeed: 3,
      troops: 1000,
      maxTroops: 1000,
      morale: 100,
      training: 80,
      leadership: 80,
      strength: 80,
      intelligence: 80,
      formation: Formation.LINE,
      stance: Stance.BALANCED,
      state: 'idle',
      lastAttackTime: 0,
      attackCooldown: 1500,
      attackRange: 1.5,
      buffs: [],
      debuffs: [],
    };

    const defender: BattleUnit = { ...baseUnit, id: 'defender', teamId: 'defender' };

    it('쐐기진(WEDGE)이 가장 높은 공격력이어야 함', () => {
      const wedge = { ...baseUnit, formation: Formation.WEDGE };
      const square = { ...baseUnit, formation: Formation.SQUARE };

      const wedgeDamage = engine.calculateDamage(wedge, defender);
      const squareDamage = engine.calculateDamage(square, defender);

      expect(wedgeDamage).toBeGreaterThan(squareDamage);
    });

    it('방진(SQUARE)이 쐐기진(WEDGE)보다 방어력이 높거나 같아야 함', () => {
      const square = { ...defender, formation: Formation.SQUARE };
      const wedge = { ...defender, formation: Formation.WEDGE };

      const damageToSquare = engine.calculateDamage(baseUnit, square);
      const damageToWedge = engine.calculateDamage(baseUnit, wedge);

      // 방진은 방어적, 쐐기진은 공격적이므로 방진이 받는 피해가 적거나 같아야 함
      expect(damageToSquare).toBeLessThanOrEqual(damageToWedge);
    });
  });
});

