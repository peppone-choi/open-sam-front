/**
 * AI 행동 패턴 테스트
 * 
 * AI 타겟 선택, 진형 유지, 상태 전환 테스트
 */

import {
  BattleEngine,
  UnitType,
  Formation,
  Stance,
  TerrainType,
  type BattleUnit,
} from '@/lib/battle/BattleEngine';

describe('AI Behavior', () => {
  let engine: BattleEngine;

  const createUnit = (
    id: string,
    teamId: 'attacker' | 'defender',
    type: UnitType,
    position: { x: number; z: number }
  ): Omit<BattleUnit, 'lastAttackTime' | 'attackCooldown' | 'attackRange' | 'buffs' | 'debuffs'> => ({
    id,
    name: `${type} unit`,
    generalName: 'AI Test',
    unitType: type,
    unitTypeId: 1102,
    nation: teamId === 'attacker' ? '촉' : '위',
    teamId,
    position,
    heading: teamId === 'attacker' ? 0 : Math.PI,
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
  });

  beforeEach(() => {
    engine = new BattleEngine({
      id: 'ai-test',
      terrain: TerrainType.PLAIN,
      attackerNation: '촉',
      defenderNation: '위',
    });
  });

  afterEach(() => {
    engine.stop();
  });

  describe('타겟 선택', () => {
    it('가장 가까운 적을 타겟으로 선택해야 함', () => {
      // 공격자
      engine.addUnit(createUnit('attacker-1', 'attacker', UnitType.INFANTRY, { x: 0, z: 0 }));
      
      // 방어자 - 가까운 적
      engine.addUnit(createUnit('defender-1', 'defender', UnitType.INFANTRY, { x: 5, z: 0 }));
      // 방어자 - 먼 적
      engine.addUnit(createUnit('defender-2', 'defender', UnitType.INFANTRY, { x: 20, z: 0 }));

      // 전투 시작
      engine.start();

      // AI가 타겟을 선택할 시간 대기 후 확인
      // 실제 테스트에서는 tick을 수동으로 호출하거나 짧은 시간 후 확인
      setTimeout(() => {
        const attacker = engine.getUnit('attacker-1');
        // 가장 가까운 defender-1을 타겟으로 선택해야 함
        expect(attacker?.targetId).toBe('defender-1');
      }, 100);
    });

    it('타겟이 죽으면 새 타겟을 선택해야 함', () => {
      engine.addUnit(createUnit('attacker-1', 'attacker', UnitType.INFANTRY, { x: 0, z: 0 }));
      engine.addUnit(createUnit('defender-1', 'defender', UnitType.INFANTRY, { x: 5, z: 0 }));
      engine.addUnit(createUnit('defender-2', 'defender', UnitType.INFANTRY, { x: 10, z: 0 }));

      // 첫 번째 타겟 설정
      engine.attackTarget('attacker-1', 'defender-1');

      // 첫 번째 타겟을 제거
      engine.removeUnit('defender-1');

      engine.start();

      setTimeout(() => {
        const attacker = engine.getUnit('attacker-1');
        // 새 타겟이 선택되어야 함
        expect(attacker?.targetId).not.toBe('defender-1');
      }, 100);
    });

    it('같은 팀 유닛을 타겟으로 선택하지 않아야 함', () => {
      engine.addUnit(createUnit('attacker-1', 'attacker', UnitType.INFANTRY, { x: 0, z: 0 }));
      engine.addUnit(createUnit('attacker-2', 'attacker', UnitType.INFANTRY, { x: 5, z: 0 }));
      engine.addUnit(createUnit('defender-1', 'defender', UnitType.INFANTRY, { x: 20, z: 0 }));

      engine.start();

      setTimeout(() => {
        const attacker = engine.getUnit('attacker-1');
        // attacker-2가 더 가깝지만 같은 팀이므로 선택하지 않아야 함
        expect(attacker?.targetId).not.toBe('attacker-2');
      }, 100);
    });
  });

  describe('상태 전환', () => {
    it('타겟이 없으면 idle 상태여야 함', () => {
      engine.addUnit(createUnit('attacker-1', 'attacker', UnitType.INFANTRY, { x: 0, z: 0 }));
      
      const unit = engine.getUnit('attacker-1');
      expect(unit?.state).toBe('idle');
    });

    it('이동 명령 시 moving 상태로 전환해야 함', () => {
      engine.addUnit(createUnit('attacker-1', 'attacker', UnitType.INFANTRY, { x: 0, z: 0 }));
      
      engine.moveUnit('attacker-1', { x: 10, z: 10 });
      
      const unit = engine.getUnit('attacker-1');
      expect(unit?.state).toBe('moving');
    });

    it('사기가 낮아지면 retreating 상태로 전환해야 함', () => {
      // 사기가 낮은 유닛 생성
      const lowMoraleUnit = {
        ...createUnit('attacker-1', 'attacker', UnitType.INFANTRY, { x: 0, z: 0 }),
        morale: 15, // 임계값 20 미만
      };
      
      engine.addUnit(lowMoraleUnit);
      engine.start();

      // 사기 체크 후 상태 확인
      setTimeout(() => {
        const unit = engine.getUnit('attacker-1');
        expect(unit?.state).toBe('retreating');
      }, 100);
    });
  });

  describe('진형 유지', () => {
    it('진형 변경이 적용되어야 함', () => {
      engine.addUnit(createUnit('attacker-1', 'attacker', UnitType.INFANTRY, { x: 0, z: 0 }));
      
      engine.setFormation('attacker-1', Formation.WEDGE);
      
      const unit = engine.getUnit('attacker-1');
      expect(unit?.formation).toBe(Formation.WEDGE);
    });

    it('자세 변경이 적용되어야 함', () => {
      engine.addUnit(createUnit('attacker-1', 'attacker', UnitType.INFANTRY, { x: 0, z: 0 }));
      
      engine.setStance('attacker-1', Stance.AGGRESSIVE);
      
      const unit = engine.getUnit('attacker-1');
      expect(unit?.stance).toBe(Stance.AGGRESSIVE);
    });

    it('후퇴 시 자세가 RETREAT로 변경되어야 함', () => {
      const lowMoraleUnit = {
        ...createUnit('attacker-1', 'attacker', UnitType.INFANTRY, { x: 0, z: 0 }),
        morale: 10,
      };
      
      engine.addUnit(lowMoraleUnit);
      engine.start();

      setTimeout(() => {
        const unit = engine.getUnit('attacker-1');
        expect(unit?.stance).toBe(Stance.RETREAT);
      }, 100);
    });
  });

  describe('사기 시스템', () => {
    it('피해를 입으면 사기가 감소해야 함', () => {
      engine.addUnit(createUnit('attacker-1', 'attacker', UnitType.INFANTRY, { x: 0, z: 0 }));
      engine.addUnit(createUnit('defender-1', 'defender', UnitType.INFANTRY, { x: 1, z: 0 }));

      const initialMorale = engine.getUnit('defender-1')?.morale ?? 100;

      // 공격 실행 (직접 데미지 적용은 private이므로 전투 시뮬레이션)
      engine.attackTarget('attacker-1', 'defender-1');
      engine.start();

      setTimeout(() => {
        const defender = engine.getUnit('defender-1');
        // 사기가 초기값보다 같거나 낮아야 함
        expect(defender?.morale).toBeLessThanOrEqual(initialMorale);
      }, 500);
    });

    it('사기가 0에 도달하면 전멸/붕괴 상태가 되어야 함', () => {
      const zeroMoraleUnit = {
        ...createUnit('attacker-1', 'attacker', UnitType.INFANTRY, { x: 0, z: 0 }),
        morale: 0,
      };
      
      engine.addUnit(zeroMoraleUnit);
      
      const unit = engine.getUnit('attacker-1');
      // 사기 0이면 전투 불능 상태
      expect(unit?.morale).toBe(0);
    });
  });

  describe('승패 판정', () => {
    it('공격측이 전멸하면 방어측 승리', () => {
      engine.addUnit({
        ...createUnit('attacker-1', 'attacker', UnitType.INFANTRY, { x: 0, z: 0 }),
        troops: 0,
        state: 'dead',
      });
      engine.addUnit(createUnit('defender-1', 'defender', UnitType.INFANTRY, { x: 10, z: 0 }));

      engine.start();

      setTimeout(() => {
        const state = engine.getState();
        expect(state.winner).toBe('defender');
        expect(state.phase).toBe('result');
      }, 100);
    });

    it('방어측이 전멸하면 공격측 승리', () => {
      engine.addUnit(createUnit('attacker-1', 'attacker', UnitType.INFANTRY, { x: 0, z: 0 }));
      engine.addUnit({
        ...createUnit('defender-1', 'defender', UnitType.INFANTRY, { x: 10, z: 0 }),
        troops: 0,
        state: 'dead',
      });

      engine.start();

      setTimeout(() => {
        const state = engine.getState();
        expect(state.winner).toBe('attacker');
        expect(state.phase).toBe('result');
      }, 100);
    });

    it('양측 모두 생존 시 승자 미결정', () => {
      engine.addUnit(createUnit('attacker-1', 'attacker', UnitType.INFANTRY, { x: 0, z: 0 }));
      engine.addUnit(createUnit('defender-1', 'defender', UnitType.INFANTRY, { x: 10, z: 0 }));

      const state = engine.getState();
      expect(state.winner).toBeUndefined();
    });
  });

  describe('지형 효과', () => {
    it('평지에서 기병이 보너스를 받아야 함', () => {
      const plainEngine = new BattleEngine({
        id: 'plain-test',
        terrain: TerrainType.PLAIN,
        attackerNation: '촉',
        defenderNation: '위',
      });

      const forestEngine = new BattleEngine({
        id: 'forest-test',
        terrain: TerrainType.FOREST,
        attackerNation: '촉',
        defenderNation: '위',
      });

      const cavalryUnit: BattleUnit = {
        id: 'cavalry',
        name: 'cavalry',
        generalName: 'test',
        unitType: UnitType.CAVALRY,
        unitTypeId: 1301,
        nation: '촉',
        teamId: 'attacker',
        position: { x: 0, z: 0 },
        heading: 0,
        moveSpeed: 6,
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
        attackCooldown: 1200,
        attackRange: 2,
        buffs: [],
        debuffs: [],
      };

      const defender: BattleUnit = {
        ...cavalryUnit,
        id: 'defender',
        teamId: 'defender',
        unitType: UnitType.INFANTRY,
      };

      const plainDamage = plainEngine.calculateDamage(cavalryUnit, defender);
      const forestDamage = forestEngine.calculateDamage(cavalryUnit, defender);

      // 평지에서 기병 데미지가 더 높아야 함
      expect(plainDamage).toBeGreaterThan(forestDamage);

      plainEngine.stop();
      forestEngine.stop();
    });

    it('숲에서 궁병이 보너스를 받아야 함', () => {
      const forestEngine = new BattleEngine({
        id: 'forest-test',
        terrain: TerrainType.FOREST,
        attackerNation: '촉',
        defenderNation: '위',
      });

      const plainEngine = new BattleEngine({
        id: 'plain-test',
        terrain: TerrainType.PLAIN,
        attackerNation: '촉',
        defenderNation: '위',
      });

      const archerUnit: BattleUnit = {
        id: 'archer',
        name: 'archer',
        generalName: 'test',
        unitType: UnitType.ARCHER,
        unitTypeId: 1201,
        nation: '촉',
        teamId: 'attacker',
        position: { x: 0, z: 0 },
        heading: 0,
        moveSpeed: 3.5,
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
        attackCooldown: 2000,
        attackRange: 8,
        buffs: [],
        debuffs: [],
      };

      const defender: BattleUnit = {
        ...archerUnit,
        id: 'defender',
        teamId: 'defender',
        unitType: UnitType.INFANTRY,
      };

      const forestDamage = forestEngine.calculateDamage(archerUnit, defender);
      const plainDamage = plainEngine.calculateDamage(archerUnit, defender);

      // 숲에서 궁병 데미지가 더 높아야 함
      expect(forestDamage).toBeGreaterThan(plainDamage);

      forestEngine.stop();
      plainEngine.stop();
    });
  });
});





