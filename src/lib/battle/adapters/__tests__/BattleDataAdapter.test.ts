
import {
  convertApiBattleToVoxel,
  convertVoxelResultToApi,
  createVoxelForce,
} from '../BattleDataAdapter';
import {
  convertGeneralStats,
  calculateModifier,
} from '../GeneralAdapter';
import type {
  ApiBattleData,
  ApiSide,
  VoxelBattleInit,
  VoxelBattleResult,
} from '../../types/BattleTypes';

describe('BattleDataAdapter', () => {
  // Mock Data
  const mockAttackerGeneral = {
    no: 1,
    name: 'AttackerGen',
    leadership: 80,
    strength: 90,
    intel: 50,
    specialId: 1,
    specialName: '맹공',
  };

  const mockDefenderGeneral = {
    no: 2,
    name: 'DefenderGen',
    leadership: 70,
    strength: 60,
    intel: 85,
  };

  const mockAttackerSide: ApiSide = {
    general: mockAttackerGeneral,
    crewType: 1102, // 정규보병
    crew: 1000,
    morale: 100,
    train: 80,
    nationId: 1,
  };

  const mockDefenderSide: ApiSide = {
    general: mockDefenderGeneral,
    crewType: 1201, // 장궁병
    crew: 800,
    morale: 90,
    train: 60,
    nationId: 2,
  };

  const mockBattleData: ApiBattleData = {
    battleId: 'test_battle_01',
    attacker: mockAttackerSide,
    defender: mockDefenderSide,
    cityId: 101,
    season: 1,
    battleType: 'field',
  };

  // 1. Basic Infantry Battle Data Conversion
  test('should convert basic infantry battle data correctly', () => {
    const result: VoxelBattleInit = convertApiBattleToVoxel(mockBattleData);

    expect(result.battleId).toBe('test_battle_01');
    expect(result.weather).toBe('clear'); // Spring defaults to clear
    
    // Attacker Check
    expect(result.attacker.factionName).toBe('AttackerGen');
    expect(result.attacker.squads).toHaveLength(1);
    expect(result.attacker.squads[0].unitTypeId).toBe(1102);
    expect(result.attacker.squads[0].category).toBe('infantry');
    expect(result.attacker.squads[0].originalCrewCount).toBe(1000);

    // Defender Check
    expect(result.defender.factionName).toBe('DefenderGen');
    expect(result.defender.squads).toHaveLength(1);
    expect(result.defender.squads[0].unitTypeId).toBe(1201);
    expect(result.defender.squads[0].category).toBe('ranged');
    expect(result.defender.squads[0].originalCrewCount).toBe(800);
  });

  // 2. General Stats Conversion
  test('should convert general stats and apply modifiers', () => {
    const stats = convertGeneralStats(mockAttackerGeneral);
    
    expect(stats.generalId).toBe(1);
    expect(stats.name).toBe('AttackerGen');
    
    // 80 leadership -> 1 + (30 * 0.01) = 1.3
    expect(stats.leadershipModifier).toBeCloseTo(1.3);
    // 90 strength -> 1 + (40 * 0.01) = 1.4
    expect(stats.strengthModifier).toBeCloseTo(1.4);
    // 50 intel -> 1 + (0 * 0.01) = 1.0
    expect(stats.intelligenceModifier).toBe(1.0);
    
    expect(stats.specialSkillId).toBe(1);
  });

  // 3. Cavalry + Special Unit Conversion
  test('should handle cavalry and special units correctly', () => {
    const cavalryData: ApiBattleData = {
      ...mockBattleData,
      attacker: {
        ...mockAttackerSide,
        crewType: 1304, // 호표기 (Tiger Leopard Cavalry)
        crew: 500,
      },
      defender: {
        ...mockDefenderSide,
        crewType: 1400, // 귀병 (Strategist)
        crew: 200,
      }
    };

    const result = convertApiBattleToVoxel(cavalryData);

    // Attacker (Cavalry)
    const attackerSquad = result.attacker.squads[0];
    expect(attackerSquad.category).toBe('cavalry');
    expect(attackerSquad.unitSpec.name).toContain('호표기');
    // Cavalry usually has fewer units per crew, check if unit count is reasonable
    expect(attackerSquad.unitCount).toBeGreaterThan(0);

    // Defender (Wizard)
    const defenderSquad = result.defender.squads[0];
    expect(defenderSquad.category).toBe('wizard');
    expect(defenderSquad.attackType).toBe('magic');
  });

  // 4. Siege Battle Data Conversion
  test('should handle siege battle configuration', () => {
    const siegeData: ApiBattleData = {
      ...mockBattleData,
      battleType: 'siege',
      cityId: 1, // Assume city 1 exists
    };

    const result = convertApiBattleToVoxel(siegeData);

    expect(result.terrain.type).toBe('city');
    // Siege map usually has walls
    const hasWall = result.terrain.features?.some(f => f.type === 'wall');
    // Note: Implementation of determineTerrain might depend on CityTerrainMapping logic which might or might not return walls in features depending on mock/implementation detail.
    // Based on CityTerrainMapping.ts read earlier, it puts walls in 'structures', not 'features' directly in terrain config for VoxelBattleInit? 
    // Wait, VoxelBattleInit.terrain.features is TerrainFeature[].
    // CityTerrainMapping.ts generateSiegeStructures returns CityStructure[].
    // BattleDataAdapter.ts determineTerrain calls generateTerrainFeatures.
    // For 'siege' (city), determineTerrain sets type='city'. 
    // Actually, BattleDataAdapter's determineTerrain function for 'city' case adds 'wall' and 'gate' to features.
    expect(hasWall).toBe(true);
  });

  // 5. Result Reverse Conversion
  test('should convert voxel result back to API result', () => {
    const mockVoxelResult: VoxelBattleResult = {
      battleId: 'test_battle_01',
      winner: 'attacker',
      duration: 60000, // 1 minute
      attackerRemaining: 800,
      defenderRemaining: 0,
      attackerSquads: [
        {
          squadId: 'sq_atk_1',
          unitTypeId: 1102,
          survivingUnits: 32, // approx 800 crew
          originalUnits: 40,  // approx 1000 crew
          kills: 50,
          finalMorale: 100,
          status: 'active',
        }
      ],
      defenderSquads: [
        {
          squadId: 'sq_def_1',
          unitTypeId: 1201,
          survivingUnits: 0,
          originalUnits: 32, // approx 800 crew
          kills: 10,
          finalMorale: 0,
          status: 'destroyed',
        }
      ],
      events: [],
      stats: {
        totalKills: { attacker: 50, defender: 10 },
        totalDamage: { attacker: 5000, defender: 1000 },
        chargeCount: { attacker: 1, defender: 0 },
        routCount: { attacker: 0, defender: 1 },
      }
    };

    const apiResult = convertVoxelResultToApi(mockVoxelResult);

    expect(apiResult.battleId).toBe('test_battle_01');
    expect(apiResult.result).toBe(1); // 1 = Attacker Win
    expect(apiResult.attackerRemaining).toBe(800);
    expect(apiResult.defenderRemaining).toBe(0);
    
    // Check calculated exp
    expect(apiResult.exp).toBeGreaterThan(50); // Base 50 + Bonus
  });
});



