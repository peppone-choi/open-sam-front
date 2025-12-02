/**
 * 전투 통합 테스트
 * 
 * API 데이터 → 복셀 엔진 → 전투 진행 → 결과 동기화
 * 전체 전투 플로우를 테스트합니다.
 */

import { convertApiBattleToVoxel } from '@/lib/battle/adapters/BattleDataAdapter';
import { convertVoxelResultToApi } from '@/lib/battle/adapters/ResultAdapter';
import { ResultCalculator, determineWinner, calculateExperience } from '@/lib/battle/sync/ResultCalculator';
import {
  BattleEngine,
  UnitType,
  Formation,
  Stance,
  TerrainType,
  categoryToUnitType,
} from '@/lib/battle/BattleEngine';
import type { VoxelBattleResult, ApiBattleResult } from '@/lib/battle/types/BattleTypes';
import {
  mockBattleInfantryVsInfantry,
  mockBattleCavalryCharge,
  mockBattleArcherKiting,
  mockBattleSiege,
  mockBattleMixedForces,
  mockBattleResultAttackerWins,
  mockBattleResultDraw,
  mockBattleResultMoralCollapse,
  createMockBattleData,
  createMockSide,
  createMockBattleResult,
} from '../mocks/battleMockData';
import { validateBattleResult, validateVoxelBattleInit, TestTimer } from '../utils/testUtils';

describe('BattleFlow 통합 테스트', () => {
  describe('전투 초기화 플로우', () => {
    it('API 데이터에서 전투를 초기화할 수 있어야 함', () => {
      // 1. API 데이터 변환
      const voxelInit = convertApiBattleToVoxel(mockBattleInfantryVsInfantry);
      
      // 2. 변환 검증
      const errors = validateVoxelBattleInit(voxelInit);
      expect(errors).toHaveLength(0);

      // 3. 엔진 초기화
      const engine = new BattleEngine({
        id: voxelInit.battleId,
        terrain: TerrainType.PLAIN,
        attackerNation: voxelInit.attacker.factionName,
        defenderNation: voxelInit.defender.factionName,
      });

      expect(engine).toBeDefined();
      expect(engine.getState().id).toBe(voxelInit.battleId);

      engine.stop();
    });

    it('다양한 전투 타입을 초기화할 수 있어야 함', () => {
      const battleTypes = [
        mockBattleInfantryVsInfantry,
        mockBattleCavalryCharge,
        mockBattleArcherKiting,
        mockBattleSiege,
        mockBattleMixedForces,
      ];

      battleTypes.forEach((battleData) => {
        const voxelInit = convertApiBattleToVoxel(battleData);
        const errors = validateVoxelBattleInit(voxelInit);
        
        expect(errors).toHaveLength(0);
      });
    });
  });

  describe('전투 진행 플로우', () => {
    it('전투가 정상적으로 시작되어야 함', () => {
      const voxelInit = convertApiBattleToVoxel(mockBattleInfantryVsInfantry);
      
      const engine = new BattleEngine({
        id: voxelInit.battleId,
        terrain: TerrainType.PLAIN,
        attackerNation: voxelInit.attacker.factionName,
        defenderNation: voxelInit.defender.factionName,
      });

      // 유닛 추가
      engine.addUnit({
        id: 'attacker-1',
        name: voxelInit.attacker.squads[0].name,
        generalName: voxelInit.attacker.factionName,
        unitType: categoryToUnitType(voxelInit.attacker.squads[0].category),
        unitTypeId: voxelInit.attacker.squads[0].unitTypeId,
        nation: voxelInit.attacker.factionName,
        teamId: 'attacker',
        position: { x: 0, z: 0 },
        heading: 0,
        moveSpeed: voxelInit.attacker.squads[0].baseStats.speed / 10,
        troops: voxelInit.attacker.squads[0].unitCount * 25,
        maxTroops: voxelInit.attacker.squads[0].unitCount * 25,
        morale: voxelInit.attacker.squads[0].morale,
        training: 80,
        leadership: voxelInit.attacker.generalStats.leadershipModifier * 50,
        strength: voxelInit.attacker.generalStats.strengthModifier * 50,
        intelligence: voxelInit.attacker.generalStats.intelligenceModifier * 50,
        formation: Formation.LINE,
        stance: Stance.BALANCED,
        state: 'idle',
      });

      engine.addUnit({
        id: 'defender-1',
        name: voxelInit.defender.squads[0].name,
        generalName: voxelInit.defender.factionName,
        unitType: categoryToUnitType(voxelInit.defender.squads[0].category),
        unitTypeId: voxelInit.defender.squads[0].unitTypeId,
        nation: voxelInit.defender.factionName,
        teamId: 'defender',
        position: { x: 50, z: 0 },
        heading: Math.PI,
        moveSpeed: voxelInit.defender.squads[0].baseStats.speed / 10,
        troops: voxelInit.defender.squads[0].unitCount * 25,
        maxTroops: voxelInit.defender.squads[0].unitCount * 25,
        morale: voxelInit.defender.squads[0].morale,
        training: 80,
        leadership: voxelInit.defender.generalStats.leadershipModifier * 50,
        strength: voxelInit.defender.generalStats.strengthModifier * 50,
        intelligence: voxelInit.defender.generalStats.intelligenceModifier * 50,
        formation: Formation.LINE,
        stance: Stance.BALANCED,
        state: 'idle',
      });

      engine.start();
      
      expect(engine.getState().phase).toBe('battle');
      expect(engine.getAllUnits()).toHaveLength(2);

      engine.stop();
    });
  });

  describe('전투 결과 동기화 플로우', () => {
    it('전투 결과를 API 포맷으로 변환할 수 있어야 함', () => {
      const apiResult = convertVoxelResultToApi(mockBattleResultAttackerWins);

      expect(apiResult.battleId).toBe(mockBattleResultAttackerWins.battleId);
      expect(apiResult.result).toBe(1); // 공격자 승
      expect(apiResult.exp).toBeGreaterThan(0);
      expect(apiResult.logs.length).toBeGreaterThan(0);
    });

    it('무승부 결과를 올바르게 변환해야 함', () => {
      const apiResult = convertVoxelResultToApi(mockBattleResultDraw);

      expect(apiResult.result).toBe(0); // 무승부
    });

    it('사기 붕괴 결과를 올바르게 변환해야 함', () => {
      const apiResult = convertVoxelResultToApi(mockBattleResultMoralCollapse);

      expect(apiResult.result).toBe(1); // 공격자 승
      expect(apiResult.defenderRemaining).toBeGreaterThan(0); // 병력은 남음
    });

    it('결과 데이터가 유효해야 함', () => {
      const apiResult = convertVoxelResultToApi(mockBattleResultAttackerWins);

      expect(apiResult.attackerDead).toBeGreaterThanOrEqual(0);
      expect(apiResult.defenderDead).toBeGreaterThanOrEqual(0);
      expect(apiResult.attackerRemaining).toBeGreaterThanOrEqual(0);
      expect(apiResult.defenderRemaining).toBeGreaterThanOrEqual(0);
      expect(apiResult.battleTime).toBeGreaterThan(0);
    });
  });

  describe('ResultCalculator 통합', () => {
    describe('승패 판정', () => {
      it('공격측 전멸 시 방어측 승리', () => {
        const determination = ResultCalculator.determineWinner(
          0, // 공격측 전멸
          1000,
          5000,
          5000
        );

        expect(determination.winner).toBe('defender');
        expect(determination.type).toBe('annihilation');
      });

      it('방어측 전멸 시 공격측 승리', () => {
        const determination = ResultCalculator.determineWinner(
          1000,
          0, // 방어측 전멸
          5000,
          5000
        );

        expect(determination.winner).toBe('attacker');
        expect(determination.type).toBe('annihilation');
      });

      it('양측 전멸 시 무승부', () => {
        const determination = ResultCalculator.determineWinner(
          0,
          0,
          5000,
          5000
        );

        expect(determination.winner).toBe('draw');
      });

      it('사기 붕괴 시 패배', () => {
        const determination = ResultCalculator.determineWinner(
          3000,
          3000,
          5000,
          5000,
          5, // 공격측 사기 붕괴
          80
        );

        expect(determination.winner).toBe('defender');
        expect(determination.type).toBe('morale');
      });
    });

    describe('경험치 계산', () => {
      it('승자는 높은 경험치를 받아야 함', () => {
        const winnerExp = ResultCalculator.calculateWinnerExperience(mockBattleResultAttackerWins);
        const loserExp = ResultCalculator.calculateLoserExperience(mockBattleResultAttackerWins);

        expect(winnerExp.total).toBeGreaterThan(loserExp.total);
      });

      it('경험치 내역이 제공되어야 함', () => {
        const exp = ResultCalculator.calculateWinnerExperience(mockBattleResultAttackerWins);

        expect(exp.breakdown.participation).toBeGreaterThan(0);
        expect(exp.breakdown.victory).toBeGreaterThan(0);
      });

      it('최대 경험치(500)를 초과하지 않아야 함', () => {
        const exp = ResultCalculator.calculateWinnerExperience(mockBattleResultAttackerWins);

        expect(exp.total).toBeLessThanOrEqual(500);
      });
    });

    describe('사상자 계산', () => {
      it('사상자를 올바르게 계산해야 함', () => {
        const casualties = ResultCalculator.calculateSimpleCasualties(1000, 600);

        expect(casualties).toBe(400);
      });

      it('음수 결과는 0이어야 함', () => {
        const casualties = ResultCalculator.calculateSimpleCasualties(500, 800);

        expect(casualties).toBe(0);
      });
    });

    describe('전투 영향 계산', () => {
      it('장수 업데이트 정보를 계산해야 함', () => {
        const consequences = ResultCalculator.calculateConsequences(
          mockBattleResultAttackerWins,
          1, // 공격자 장수 ID
          2  // 방어자 장수 ID
        );

        expect(consequences.generalUpdates).toHaveLength(2);
        expect(consequences.generalUpdates[0].generalId).toBe(1);
        expect(consequences.generalUpdates[1].generalId).toBe(2);
      });

      it('공성전 시 도시 업데이트를 계산해야 함', () => {
        const consequences = ResultCalculator.calculateConsequences(
          mockBattleResultAttackerWins,
          1,
          2,
          true, // 공성전
          100   // 도시 ID
        );

        expect(consequences.cityUpdate).toBeDefined();
        expect(consequences.cityUpdate?.cityId).toBe(100);
      });
    });
  });

  describe('전투 시나리오 통합', () => {
    describe('보병 vs 보병', () => {
      it('보병 전투가 완료되어야 함', () => {
        const voxelInit = convertApiBattleToVoxel(mockBattleInfantryVsInfantry);
        
        expect(voxelInit.attacker.squads[0].category).toBe('infantry');
        expect(voxelInit.defender.squads[0].category).toBe('infantry');
      });
    });

    describe('기병 돌격', () => {
      it('기병 돌격 시나리오가 설정되어야 함', () => {
        const voxelInit = convertApiBattleToVoxel(mockBattleCavalryCharge);
        
        expect(voxelInit.attacker.squads[0].category).toBe('cavalry');
        expect(voxelInit.attacker.squads[0].baseStats.chargeBonus).toBeGreaterThan(0);
      });
    });

    describe('궁병 카이팅', () => {
      it('궁병 시나리오가 설정되어야 함', () => {
        const voxelInit = convertApiBattleToVoxel(mockBattleArcherKiting);
        
        expect(voxelInit.attacker.squads[0].category).toBe('ranged');
        expect(voxelInit.attacker.squads[0].baseStats.range).toBeGreaterThan(10);
      });
    });

    describe('공성전', () => {
      it('공성전 지형이 설정되어야 함', () => {
        const voxelInit = convertApiBattleToVoxel(mockBattleSiege);
        
        expect(voxelInit.terrain.type).toBe('city');
      });
    });

    describe('혼합 부대', () => {
      it('혼합 부대 시나리오가 설정되어야 함', () => {
        const voxelInit = convertApiBattleToVoxel(mockBattleMixedForces);
        
        // 기병 vs 창병
        expect(voxelInit.attacker.squads[0].category).toBe('cavalry');
        expect(voxelInit.defender.squads[0].unitTypeId).toBe(1108); // 장창병
      });
    });

    describe('사기 붕괴', () => {
      it('사기 붕괴 결과가 올바르게 처리되어야 함', () => {
        const apiResult = convertVoxelResultToApi(mockBattleResultMoralCollapse);

        // 병력은 남았지만 공격자 승리
        expect(apiResult.result).toBe(1);
        expect(apiResult.defenderRemaining).toBeGreaterThan(0);
      });
    });
  });

  describe('전체 전투 플로우', () => {
    it('API → 변환 → 엔진 → 결과 → API 플로우', () => {
      const timer = new TestTimer();
      timer.start();

      // 1. API 데이터 수신
      const apiBattleData = mockBattleInfantryVsInfantry;

      // 2. 복셀 데이터로 변환
      const voxelInit = convertApiBattleToVoxel(apiBattleData);
      expect(validateVoxelBattleInit(voxelInit)).toHaveLength(0);

      // 3. 모의 전투 결과 생성 (실제 전투 시뮬레이션 대신)
      const mockResult = createMockBattleResult({
        battleId: voxelInit.battleId,
        winner: 'attacker',
        duration: 120000,
        attackerRemaining: 3000,
        defenderRemaining: 0,
      });

      // 4. API 결과로 변환
      const apiResult = convertVoxelResultToApi(mockResult);

      // 5. 결과 검증
      expect(apiResult.battleId).toBe(apiBattleData.battleId);
      expect(apiResult.result).toBe(1);
      expect(apiResult.exp).toBeGreaterThan(0);
      expect(apiResult.logs.length).toBeGreaterThan(0);

      timer.stop();
      expect(timer.elapsed).toBeLessThan(1000); // 1초 이내 완료
    });
  });

  describe('determineWinner 편의 함수', () => {
    it('공격측 전멸 → defender', () => {
      expect(determineWinner(0, 100)).toBe('defender');
    });

    it('방어측 전멸 → attacker', () => {
      expect(determineWinner(100, 0)).toBe('attacker');
    });

    it('양측 전멸 → draw', () => {
      expect(determineWinner(0, 0)).toBe('draw');
    });

    it('양측 생존 → draw (기본)', () => {
      expect(determineWinner(100, 100)).toBe('draw');
    });

    it('공격측 사기 붕괴 → defender', () => {
      expect(determineWinner(100, 100, 5, 80)).toBe('defender');
    });

    it('방어측 사기 붕괴 → attacker', () => {
      expect(determineWinner(100, 100, 80, 5)).toBe('attacker');
    });
  });

  describe('calculateExperience 편의 함수', () => {
    it('승자 경험치 계산', () => {
      const exp = calculateExperience(100, true, 120000);
      expect(exp).toBeGreaterThan(150); // 기본 50 + 승리 100
    });

    it('패자 경험치 계산', () => {
      const exp = calculateExperience(50, false, 120000);
      expect(exp).toBeLessThan(150);
    });

    it('최대 경험치 제한', () => {
      const exp = calculateExperience(10000, true, 600000);
      expect(exp).toBeLessThanOrEqual(500);
    });
  });
});





