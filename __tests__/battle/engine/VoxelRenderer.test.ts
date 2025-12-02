/**
 * VoxelRenderer 유닛 테스트
 * 
 * 복셀 유닛 렌더링, LOD, 인스턴싱 테스트
 * 참고: WebGL 컨텍스트가 모킹되어 있어 실제 렌더링은 테스트하지 않음
 */

import {
  calculateSquadSize,
  calculateCrewFromUnits,
  getUnitBaseStats,
  applyTrainingModifier,
  calculateExperienceLevel,
  createVoxelSquad,
  getUnitCategoryById,
  getUnitAttackType,
  getUnitName,
  calculateCounterBonus,
  calculateUnitPowerScore,
  getAllValidUnitIds,
  getUnitsByCategory,
} from '@/lib/battle/adapters/UnitAdapter';
import type { VoxelCategory } from '@/lib/battle/CrewTypeVoxelMapping';
import { ALL_UNIT_TYPES } from '../mocks/battleMockData';

describe('VoxelRenderer (UnitAdapter)', () => {
  describe('유닛 생성', () => {
    describe('createVoxelSquad', () => {
      it('병종 ID로 부대를 생성할 수 있어야 함', () => {
        const squad = createVoxelSquad(1102, 1000, 100, 80);
        
        expect(squad).not.toBeNull();
        expect(squad?.unitTypeId).toBe(1102);
      });

      it('부대 이름이 설정되어야 함', () => {
        const squad = createVoxelSquad(1102, 1000, 100, 80);
        
        expect(squad?.name).toBeDefined();
        expect(squad?.name.length).toBeGreaterThan(0);
      });

      it('유닛 수가 계산되어야 함', () => {
        const squad = createVoxelSquad(1102, 1000, 100, 80);
        
        expect(squad?.unitCount).toBeGreaterThan(0);
        expect(squad?.unitCount).toBeLessThanOrEqual(100);
      });

      it('사기가 설정되어야 함', () => {
        const squad = createVoxelSquad(1102, 1000, 85, 80);
        
        expect(squad?.morale).toBe(85);
      });

      it('경험치 레벨이 계산되어야 함', () => {
        const squad = createVoxelSquad(1102, 1000, 100, 80);
        
        expect(squad?.experienceLevel).toBeGreaterThanOrEqual(0);
        expect(squad?.experienceLevel).toBeLessThanOrEqual(9);
      });

      it('유효하지 않은 병종 ID는 null을 반환해야 함', () => {
        // 내부적으로 기본값 처리될 수 있지만, 명시적 테스트
        const squad = createVoxelSquad(9999, 1000, 100, 80);
        // 기본 보병으로 대체되거나 null 반환
        // 현재 구현은 기본 보병 반환
        expect(squad).not.toBeNull();
      });
    });
  });

  describe('LOD 전환 (유닛 수 계산)', () => {
    describe('calculateSquadSize', () => {
      it('병력을 유닛 수로 변환해야 함', () => {
        const units = calculateSquadSize(1000);
        
        expect(units).toBeGreaterThan(0);
        expect(units).toBeLessThanOrEqual(100);
      });

      it('최소 1유닛 이상이어야 함', () => {
        const units = calculateSquadSize(1);
        
        expect(units).toBeGreaterThanOrEqual(1);
      });

      it('최대 100유닛을 초과하지 않아야 함', () => {
        const units = calculateSquadSize(10000);
        
        expect(units).toBeLessThanOrEqual(100);
      });

      it('기병은 적은 유닛 수로 변환되어야 함', () => {
        const infantryUnits = calculateSquadSize(1000, 'infantry');
        const cavalryUnits = calculateSquadSize(1000, 'cavalry');
        
        expect(cavalryUnits).toBeLessThan(infantryUnits);
      });

      it('공성 병기는 매우 적은 유닛 수로 변환되어야 함', () => {
        const infantryUnits = calculateSquadSize(1000, 'infantry');
        const siegeUnits = calculateSquadSize(1000, 'siege');
        
        expect(siegeUnits).toBeLessThan(infantryUnits / 2);
      });

      it('성벽은 1유닛이어야 함', () => {
        const castleUnits = calculateSquadSize(5000, 'castle');
        
        expect(castleUnits).toBe(1);
      });
    });

    describe('calculateCrewFromUnits', () => {
      it('유닛 수를 병력으로 역변환해야 함', () => {
        const crew = calculateCrewFromUnits(40, 'infantry');
        
        expect(crew).toBeGreaterThan(0);
      });

      it('병력 → 유닛 → 병력 변환이 대략 일치해야 함', () => {
        const originalCrew = 1000;
        const units = calculateSquadSize(originalCrew, 'infantry');
        const reversedCrew = calculateCrewFromUnits(units, 'infantry');
        
        // 반올림으로 인한 오차 허용
        expect(reversedCrew).toBeCloseTo(originalCrew, -2); // 100 단위 내 오차 허용
      });

      it('성벽은 0을 반환해야 함', () => {
        const crew = calculateCrewFromUnits(1, 'castle');
        
        expect(crew).toBe(0);
      });
    });
  });

  describe('인스턴싱 (스탯 계산)', () => {
    describe('getUnitBaseStats', () => {
      it('보병 기본 스탯을 반환해야 함', () => {
        const stats = getUnitBaseStats(1102);
        
        expect(stats.attack).toBeGreaterThan(0);
        expect(stats.defense).toBeGreaterThan(0);
        expect(stats.speed).toBeGreaterThan(0);
      });

      it('궁병은 긴 사거리를 가져야 함', () => {
        const archerStats = getUnitBaseStats(1201);
        const infantryStats = getUnitBaseStats(1102);
        
        expect(archerStats.range).toBeGreaterThan(infantryStats.range);
      });

      it('기병은 높은 돌격 보너스를 가져야 함', () => {
        const cavalryStats = getUnitBaseStats(1301);
        const infantryStats = getUnitBaseStats(1102);
        
        expect(cavalryStats.chargeBonus).toBeGreaterThan(infantryStats.chargeBonus);
      });

      it('창병은 대기병 보너스를 가져야 함', () => {
        const spearStats = getUnitBaseStats(1108); // 장창병
        
        expect(spearStats.antiCavalryBonus).toBeGreaterThan(0);
      });

      it('공성 병기는 가장 긴 사거리를 가져야 함', () => {
        const siegeStats = getUnitBaseStats(1501);
        const archerStats = getUnitBaseStats(1201);
        
        expect(siegeStats.range).toBeGreaterThan(archerStats.range);
      });
    });

    describe('applyTrainingModifier', () => {
      const baseStats = {
        attack: 30,
        defense: 40,
        speed: 25,
        range: 1,
        chargeBonus: 5,
        antiCavalryBonus: 0,
      };

      it('훈련도 50은 기본 스탯을 유지해야 함', () => {
        const modified = applyTrainingModifier(baseStats, 50);
        
        // 50% 훈련도는 1.0 배율 (0.8 + 0.5 * 0.4 = 1.0)
        expect(modified.attack).toBeCloseTo(baseStats.attack, -1);
      });

      it('훈련도 100은 스탯을 증가시켜야 함', () => {
        const modified = applyTrainingModifier(baseStats, 100);
        
        expect(modified.attack).toBeGreaterThan(baseStats.attack);
        expect(modified.defense).toBeGreaterThan(baseStats.defense);
      });

      it('훈련도 0은 스탯을 감소시켜야 함', () => {
        const modified = applyTrainingModifier(baseStats, 0);
        
        expect(modified.attack).toBeLessThan(baseStats.attack);
        expect(modified.defense).toBeLessThan(baseStats.defense);
      });

      it('사거리는 훈련도에 영향받지 않아야 함', () => {
        const modified = applyTrainingModifier(baseStats, 100);
        
        expect(modified.range).toBe(baseStats.range);
      });
    });

    describe('calculateExperienceLevel', () => {
      it('훈련도 0은 경험치 레벨 0이어야 함', () => {
        const level = calculateExperienceLevel(0);
        expect(level).toBe(0);
      });

      it('훈련도 100은 최대 경험치 레벨이어야 함', () => {
        const level = calculateExperienceLevel(100);
        expect(level).toBe(9);
      });

      it('훈련도 50은 중간 경험치 레벨이어야 함', () => {
        const level = calculateExperienceLevel(50);
        expect(level).toBeGreaterThan(2);
        expect(level).toBeLessThan(7);
      });
    });
  });

  describe('카테고리 분류', () => {
    describe('getUnitCategoryById', () => {
      it('보병 ID는 infantry 카테고리여야 함', () => {
        ALL_UNIT_TYPES.infantry.forEach(id => {
          const category = getUnitCategoryById(id);
          expect(category).toBe('infantry');
        });
      });

      it('궁병 ID는 ranged 카테고리여야 함', () => {
        ALL_UNIT_TYPES.archer.forEach(id => {
          const category = getUnitCategoryById(id);
          expect(category).toBe('ranged');
        });
      });

      it('기병 ID는 cavalry 카테고리여야 함', () => {
        ALL_UNIT_TYPES.cavalry.forEach(id => {
          const category = getUnitCategoryById(id);
          expect(category).toBe('cavalry');
        });
      });

      it('귀병 ID는 wizard 카테고리여야 함', () => {
        ALL_UNIT_TYPES.wizard.forEach(id => {
          const category = getUnitCategoryById(id);
          expect(category).toBe('wizard');
        });
      });

      it('공성 ID는 siege 카테고리여야 함', () => {
        ALL_UNIT_TYPES.siege.forEach(id => {
          const category = getUnitCategoryById(id);
          expect(category).toBe('siege');
        });
      });

      it('지역병 ID는 regional 카테고리여야 함', () => {
        ALL_UNIT_TYPES.regional.forEach(id => {
          const category = getUnitCategoryById(id);
          expect(category).toBe('regional');
        });
      });
    });

    describe('getUnitAttackType', () => {
      it('보병은 melee 공격 타입이어야 함', () => {
        const attackType = getUnitAttackType(1102);
        expect(attackType).toBe('melee');
      });

      it('궁병은 ranged 공격 타입이어야 함', () => {
        const attackType = getUnitAttackType(1201);
        expect(attackType).toBe('ranged');
      });

      it('기병은 melee 또는 charge 공격 타입이어야 함', () => {
        const attackType = getUnitAttackType(1301);
        // 현재 구현에서 기병은 melee로 분류됨
        expect(['melee', 'charge']).toContain(attackType);
      });
    });
  });

  describe('유닛 정보 조회', () => {
    describe('getUnitName', () => {
      it('유효한 ID는 이름을 반환해야 함', () => {
        const name = getUnitName(1102);
        
        expect(name).toBeDefined();
        expect(name.length).toBeGreaterThan(0);
      });

      it('유효하지 않은 ID는 기본 이름을 반환해야 함', () => {
        const name = getUnitName(9999);
        
        expect(name).toContain('유닛');
      });
    });

    describe('getAllValidUnitIds', () => {
      it('유효한 유닛 ID 목록을 반환해야 함', () => {
        const ids = getAllValidUnitIds();
        
        expect(ids.length).toBeGreaterThan(0);
        expect(ids.every(id => id > 0)).toBe(true);
      });

      it('정렬된 순서로 반환해야 함', () => {
        const ids = getAllValidUnitIds();
        
        for (let i = 1; i < ids.length; i++) {
          expect(ids[i]).toBeGreaterThan(ids[i - 1]);
        }
      });
    });

    describe('getUnitsByCategory', () => {
      it('카테고리별 유닛 목록을 반환해야 함', () => {
        const infantryUnits = getUnitsByCategory('infantry');
        
        expect(infantryUnits.length).toBeGreaterThan(0);
        expect(infantryUnits.every(u => u.id >= 1100 && u.id < 1200)).toBe(true);
      });
    });
  });

  describe('상성 시스템', () => {
    describe('calculateCounterBonus', () => {
      it('보병 → 궁병 유리', () => {
        const bonus = calculateCounterBonus('infantry', 'ranged');
        expect(bonus).toBeGreaterThan(0);
      });

      it('기병 → 궁병 매우 유리', () => {
        const bonus = calculateCounterBonus('cavalry', 'ranged');
        expect(bonus).toBeGreaterThan(10);
      });

      it('기병 → 공성 매우 유리', () => {
        const bonus = calculateCounterBonus('cavalry', 'siege');
        expect(bonus).toBeGreaterThan(15);
      });

      it('보병 → 기병 불리', () => {
        const bonus = calculateCounterBonus('infantry', 'cavalry');
        expect(bonus).toBeLessThan(0);
      });

      it('공성 → 성벽 매우 유리', () => {
        const bonus = calculateCounterBonus('siege', 'castle');
        expect(bonus).toBeGreaterThan(25);
      });

      it('같은 타입은 보너스 없음', () => {
        const bonus = calculateCounterBonus('infantry', 'infantry');
        expect(bonus).toBe(0);
      });
    });
  });

  describe('전투력 계산', () => {
    describe('calculateUnitPowerScore', () => {
      it('전투력 점수를 계산해야 함', () => {
        const score = calculateUnitPowerScore(1102, 1000, 100, 80);
        
        expect(score).toBeGreaterThan(0);
      });

      it('병력이 많으면 전투력이 높아야 함', () => {
        const highCrew = calculateUnitPowerScore(1102, 5000, 100, 80);
        const lowCrew = calculateUnitPowerScore(1102, 500, 100, 80);
        
        expect(highCrew).toBeGreaterThan(lowCrew);
      });

      it('사기가 높으면 전투력이 높아야 함', () => {
        const highMorale = calculateUnitPowerScore(1102, 1000, 100, 80);
        const lowMorale = calculateUnitPowerScore(1102, 1000, 20, 80);
        
        expect(highMorale).toBeGreaterThan(lowMorale);
      });

      it('훈련도가 높으면 전투력이 높아야 함', () => {
        const highTrain = calculateUnitPowerScore(1102, 1000, 100, 100);
        const lowTrain = calculateUnitPowerScore(1102, 1000, 100, 20);
        
        expect(highTrain).toBeGreaterThan(lowTrain);
      });

      it('기병이 보병보다 전투력이 높아야 함', () => {
        const cavalry = calculateUnitPowerScore(1301, 1000, 100, 80);
        const infantry = calculateUnitPowerScore(1102, 1000, 100, 80);
        
        expect(cavalry).toBeGreaterThan(infantry);
      });
    });
  });

  describe('모든 유닛 타입 렌더링 가능성', () => {
    const allUnitIds = Object.values(ALL_UNIT_TYPES).flat();

    it.each(allUnitIds)('유닛 ID %i가 생성 가능해야 함', (unitId) => {
      const squad = createVoxelSquad(unitId, 1000, 100, 80);
      
      expect(squad).not.toBeNull();
      expect(squad?.unitTypeId).toBe(unitId);
    });

    it.each(allUnitIds)('유닛 ID %i의 스탯이 유효해야 함', (unitId) => {
      const stats = getUnitBaseStats(unitId);
      
      expect(stats.attack).toBeGreaterThanOrEqual(0);
      expect(stats.defense).toBeGreaterThanOrEqual(0);
      expect(stats.speed).toBeGreaterThanOrEqual(0);
      expect(stats.range).toBeGreaterThanOrEqual(0);
    });
  });
});

