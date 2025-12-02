/**
 * voxelBattleStore 테스트
 * Zustand 스토어의 전투 상태 관리 테스트
 */

import { useVoxelBattleStore } from '@/stores/voxelBattleStore';
import type { VoxelBattleInit, BattleResult } from '@/stores/voxelBattleTypes';

describe('voxelBattleStore', () => {
  // 각 테스트 전 스토어 초기화
  beforeEach(() => {
    useVoxelBattleStore.getState().resetBattle();
  });

  // ============================================================================
  // 초기 상태 테스트
  // ============================================================================

  describe('초기 상태', () => {
    it('기본 상태값이 올바르게 설정되어야 함', () => {
      const state = useVoxelBattleStore.getState();
      
      expect(state.battleId).toBeNull();
      expect(state.phase).toBe('loading');
      expect(state.speed).toBe(1);
      expect(state.terrain).toBeNull();
      expect(state.weather).toBeNull();
      expect(state.attackerForce).toBeNull();
      expect(state.defenderForce).toBeNull();
      expect(state.result).toBeNull();
    });

    it('초기 통계값이 올바르게 설정되어야 함', () => {
      const state = useVoxelBattleStore.getState();
      
      expect(state.stats.elapsedTime).toBe(0);
      expect(state.stats.attackerKills).toBe(0);
      expect(state.stats.defenderKills).toBe(0);
      expect(state.stats.attackerMorale).toBe(100);
      expect(state.stats.defenderMorale).toBe(100);
    });

    it('이벤트 배열이 빈 배열이어야 함', () => {
      const state = useVoxelBattleStore.getState();
      expect(state.events).toEqual([]);
      expect(state.maxEvents).toBe(1000);
    });
  });

  // ============================================================================
  // 전투 라이프사이클 테스트
  // ============================================================================

  describe('전투 라이프사이클', () => {
    const mockBattleInit: VoxelBattleInit = {
      battleId: 'test-battle-001',
      attacker: {
        generalId: 1,
        generalName: '유비',
        nationId: 1,
        units: [
          { unitId: 1, count: 100, morale: 80, experience: 50 },
          { unitId: 2, count: 50, morale: 90, experience: 30 },
        ],
      },
      defender: {
        generalId: 2,
        generalName: '조조',
        nationId: 2,
        units: [
          { unitId: 3, count: 80, morale: 85, experience: 40 },
        ],
      },
      terrain: 'plains',
      weather: 'clear',
    };

    it('initBattle이 올바르게 전투를 초기화해야 함', () => {
      useVoxelBattleStore.getState().initBattle(mockBattleInit);
      
      const state = useVoxelBattleStore.getState();
      
      expect(state.battleId).toBe('test-battle-001');
      expect(state.phase).toBe('ready');
      expect(state.terrain).toBe('plains');
      expect(state.weather).toBe('clear');
      expect(state.attackerForce).not.toBeNull();
      expect(state.defenderForce).not.toBeNull();
      expect(state.attackerForce?.generalName).toBe('유비');
      expect(state.defenderForce?.generalName).toBe('조조');
    });

    it('initBattle이 공격자 부대를 올바르게 생성해야 함', () => {
      useVoxelBattleStore.getState().initBattle(mockBattleInit);
      
      const state = useVoxelBattleStore.getState();
      const attacker = state.attackerForce;
      
      expect(attacker?.squads.length).toBe(2);
      expect(attacker?.totalUnits).toBe(150); // 100 + 50
      expect(attacker?.remainingUnits).toBe(150);
    });

    it('startBattle이 ready 상태에서만 작동해야 함', () => {
      useVoxelBattleStore.getState().initBattle(mockBattleInit);
      useVoxelBattleStore.getState().startBattle();
      
      expect(useVoxelBattleStore.getState().phase).toBe('running');
    });

    it('startBattle이 loading 상태에서는 작동하지 않아야 함', () => {
      // 초기화하지 않고 바로 시작 시도
      useVoxelBattleStore.getState().startBattle();
      
      expect(useVoxelBattleStore.getState().phase).toBe('loading');
    });

    it('pauseBattle이 running 상태에서만 작동해야 함', () => {
      useVoxelBattleStore.getState().initBattle(mockBattleInit);
      useVoxelBattleStore.getState().startBattle();
      useVoxelBattleStore.getState().pauseBattle();
      
      expect(useVoxelBattleStore.getState().phase).toBe('paused');
    });

    it('pauseBattle이 ready 상태에서는 작동하지 않아야 함', () => {
      useVoxelBattleStore.getState().initBattle(mockBattleInit);
      useVoxelBattleStore.getState().pauseBattle();
      
      expect(useVoxelBattleStore.getState().phase).toBe('ready');
    });

    it('resumeBattle이 paused 상태에서만 작동해야 함', () => {
      useVoxelBattleStore.getState().initBattle(mockBattleInit);
      useVoxelBattleStore.getState().startBattle();
      useVoxelBattleStore.getState().pauseBattle();
      useVoxelBattleStore.getState().resumeBattle();
      
      expect(useVoxelBattleStore.getState().phase).toBe('running');
    });

    it('setSpeed가 속도를 올바르게 변경해야 함', () => {
      useVoxelBattleStore.getState().setSpeed(2);
      expect(useVoxelBattleStore.getState().speed).toBe(2);
      
      useVoxelBattleStore.getState().setSpeed(0.5);
      expect(useVoxelBattleStore.getState().speed).toBe(0.5);
    });

    it('endBattle이 전투를 종료하고 결과를 저장해야 함', () => {
      useVoxelBattleStore.getState().initBattle(mockBattleInit);
      useVoxelBattleStore.getState().startBattle();
      
      const result: BattleResult = {
        winner: 'attacker',
        attackerLosses: 20,
        defenderLosses: 80,
        attackerSurvivors: 130,
        defenderSurvivors: 0,
        duration: 60000,
        events: [],
        experienceGained: { attacker: 100, defender: 50 },
      };
      
      useVoxelBattleStore.getState().endBattle(result);
      
      const state = useVoxelBattleStore.getState();
      expect(state.phase).toBe('ended');
      expect(state.result).toEqual(result);
    });

    it('resetBattle이 상태를 초기화해야 함', () => {
      useVoxelBattleStore.getState().initBattle(mockBattleInit);
      useVoxelBattleStore.getState().startBattle();
      useVoxelBattleStore.getState().resetBattle();
      
      const state = useVoxelBattleStore.getState();
      expect(state.battleId).toBeNull();
      expect(state.phase).toBe('loading');
      expect(state.attackerForce).toBeNull();
    });
  });

  // ============================================================================
  // 부대 상태 업데이트 테스트
  // ============================================================================

  describe('부대 상태 업데이트', () => {
    const mockBattleInit: VoxelBattleInit = {
      battleId: 'test-battle-002',
      attacker: {
        generalId: 1,
        generalName: '유비',
        nationId: 1,
        units: [{ unitId: 1, count: 100, morale: 80, experience: 50 }],
      },
      defender: {
        generalId: 2,
        generalName: '조조',
        nationId: 2,
        units: [{ unitId: 2, count: 50, morale: 85, experience: 40 }],
      },
      terrain: 'plains',
      weather: 'clear',
    };

    beforeEach(() => {
      useVoxelBattleStore.getState().initBattle(mockBattleInit);
    });

    it('updateSquadState가 부대 상태를 업데이트해야 함', () => {
      const squadId = useVoxelBattleStore.getState().attackerForce?.squads[0].id!;
      
      useVoxelBattleStore.getState().updateSquadState('attacker', squadId, {
        state: 'fighting',
        facing: 90,
      });
      
      const squad = useVoxelBattleStore.getState().attackerForce?.squads[0];
      expect(squad?.state).toBe('fighting');
      expect(squad?.facing).toBe(90);
    });

    it('updateSoldierState가 병사 상태를 업데이트해야 함', () => {
      const state = useVoxelBattleStore.getState();
      const squadId = state.attackerForce?.squads[0].id!;
      const soldierId = state.attackerForce?.squads[0].soldiers[0].id!;
      
      useVoxelBattleStore.getState().updateSoldierState('attacker', squadId, soldierId, {
        health: 50,
        animation: 'hit',
      });
      
      const soldier = useVoxelBattleStore.getState().attackerForce?.squads[0].soldiers[0];
      expect(soldier?.health).toBe(50);
      expect(soldier?.animation).toBe('hit');
    });

    it('updateSquadState가 사기를 직접 업데이트해야 함', () => {
      const squadId = useVoxelBattleStore.getState().attackerForce?.squads[0].id!;
      
      // updateSquadState로 직접 사기 변경
      useVoxelBattleStore.getState().updateSquadState('attacker', squadId, { morale: 70 });
      let squad = useVoxelBattleStore.getState().attackerForce?.squads[0];
      expect(squad?.morale).toBe(70);
      
      // 0-100 범위 제한은 직접 적용 필요
      useVoxelBattleStore.getState().updateSquadState('attacker', squadId, { morale: 100 });
      squad = useVoxelBattleStore.getState().attackerForce?.squads[0];
      expect(squad?.morale).toBe(100);
      
      useVoxelBattleStore.getState().updateSquadState('attacker', squadId, { morale: 0 });
      squad = useVoxelBattleStore.getState().attackerForce?.squads[0];
      expect(squad?.morale).toBe(0);
    });

    it('removeUnit이 병사를 사망 처리하고 킬 수를 증가시켜야 함', () => {
      const state = useVoxelBattleStore.getState();
      const squadId = state.attackerForce?.squads[0].id!;
      const soldierId = state.attackerForce?.squads[0].soldiers[0].id!;
      
      useVoxelBattleStore.getState().removeUnit('attacker', squadId, soldierId);
      
      const newState = useVoxelBattleStore.getState();
      const soldier = newState.attackerForce?.squads[0].soldiers[0];
      
      expect(soldier?.isAlive).toBe(false);
      expect(soldier?.health).toBe(0);
      expect(newState.stats.defenderKills).toBe(1); // 상대편 킬 수 증가
    });

    it('destroySquad가 전체 부대를 파괴해야 함', () => {
      const squadId = useVoxelBattleStore.getState().attackerForce?.squads[0].id!;
      
      useVoxelBattleStore.getState().destroySquad('attacker', squadId);
      
      const squad = useVoxelBattleStore.getState().attackerForce?.squads[0];
      expect(squad?.state).toBe('dead');
      expect(squad?.aliveSoldiers).toBe(0);
      expect(squad?.soldiers.every(s => !s.isAlive)).toBe(true);
    });
  });

  // ============================================================================
  // 이벤트 관리 테스트
  // ============================================================================

  describe('이벤트 관리', () => {
    it('addEvent가 이벤트를 추가해야 함', () => {
      useVoxelBattleStore.getState().addEvent({ type: 'battle_start' });
      
      const events = useVoxelBattleStore.getState().events;
      expect(events.length).toBe(1);
      expect(events[0].type).toBe('battle_start');
      expect(events[0].id).toBeDefined();
      expect(events[0].timestamp).toBeDefined();
    });

    it('addEvent가 maxEvents를 초과하면 오래된 이벤트를 제거해야 함', () => {
      // maxEvents를 5로 임시 설정
      useVoxelBattleStore.setState({ maxEvents: 5 });
      
      // 7개의 이벤트 추가
      for (let i = 0; i < 7; i++) {
        useVoxelBattleStore.getState().addEvent({ type: 'battle_start' });
      }
      
      const events = useVoxelBattleStore.getState().events;
      expect(events.length).toBe(5); // maxEvents로 제한됨
    });

    it('clearEvents가 모든 이벤트를 제거해야 함', () => {
      useVoxelBattleStore.getState().addEvent({ type: 'battle_start' });
      useVoxelBattleStore.getState().addEvent({ type: 'battle_end', winner: 'attacker' });
      
      useVoxelBattleStore.getState().clearEvents();
      
      expect(useVoxelBattleStore.getState().events).toEqual([]);
    });
  });

  // ============================================================================
  // 통계 업데이트 테스트
  // ============================================================================

  describe('통계 업데이트', () => {
    it('updateStats가 통계를 부분 업데이트해야 함', () => {
      useVoxelBattleStore.getState().updateStats({
        elapsedTime: 5000,
        attackerKills: 10,
      });
      
      const stats = useVoxelBattleStore.getState().stats;
      expect(stats.elapsedTime).toBe(5000);
      expect(stats.attackerKills).toBe(10);
      expect(stats.defenderKills).toBe(0); // 변경되지 않음
    });

    it('incrementKills가 킬 수를 증가시켜야 함', () => {
      useVoxelBattleStore.getState().incrementKills('attacker', 5);
      expect(useVoxelBattleStore.getState().stats.attackerKills).toBe(5);
      
      useVoxelBattleStore.getState().incrementKills('attacker');
      expect(useVoxelBattleStore.getState().stats.attackerKills).toBe(6);
      
      useVoxelBattleStore.getState().incrementKills('defender', 3);
      expect(useVoxelBattleStore.getState().stats.defenderKills).toBe(3);
    });

    it('tick이 running 상태에서만 시간을 증가시켜야 함', () => {
      const mockInit: VoxelBattleInit = {
        battleId: 'test',
        attacker: {
          generalId: 1, generalName: 'A', nationId: 1,
          units: [{ unitId: 1, count: 10, morale: 100, experience: 0 }],
        },
        defender: {
          generalId: 2, generalName: 'B', nationId: 2,
          units: [{ unitId: 2, count: 10, morale: 100, experience: 0 }],
        },
        terrain: 'plains',
        weather: 'clear',
      };
      
      useVoxelBattleStore.getState().initBattle(mockInit);
      
      // ready 상태에서는 tick이 작동하지 않음
      useVoxelBattleStore.getState().tick(100);
      expect(useVoxelBattleStore.getState().stats.elapsedTime).toBe(0);
      
      // running 상태에서 tick 작동
      useVoxelBattleStore.getState().startBattle();
      useVoxelBattleStore.getState().tick(100);
      expect(useVoxelBattleStore.getState().stats.elapsedTime).toBe(100);
      
      useVoxelBattleStore.getState().tick(50);
      expect(useVoxelBattleStore.getState().stats.elapsedTime).toBe(150);
    });
  });

  // ============================================================================
  // 사기 시스템 테스트
  // ============================================================================

  describe('사기 시스템', () => {
    const mockInit: VoxelBattleInit = {
      battleId: 'morale-test',
      attacker: {
        generalId: 1, generalName: 'A', nationId: 1,
        units: [{ unitId: 1, count: 10, morale: 50, experience: 0 }],
      },
      defender: {
        generalId: 2, generalName: 'B', nationId: 2,
        units: [{ unitId: 2, count: 10, morale: 100, experience: 0 }],
      },
      terrain: 'plains',
      weather: 'clear',
    };

    beforeEach(() => {
      useVoxelBattleStore.getState().initBattle(mockInit);
    });

    it('updateSquadState로 패주 상태를 설정할 수 있어야 함', () => {
      const squadId = useVoxelBattleStore.getState().attackerForce?.squads[0].id!;
      
      // 패주 상태로 직접 설정
      useVoxelBattleStore.getState().updateSquadState('attacker', squadId, { 
        morale: 15, 
        state: 'routing' 
      });
      
      const squad = useVoxelBattleStore.getState().attackerForce?.squads[0];
      expect(squad?.state).toBe('routing');
      expect(squad?.morale).toBe(15);
    });

    it('updateSquadState로 패주 회복을 설정할 수 있어야 함', () => {
      const squadId = useVoxelBattleStore.getState().attackerForce?.squads[0].id!;
      
      // 먼저 패주 상태로 만듦
      useVoxelBattleStore.getState().updateSquadState('attacker', squadId, { 
        morale: 15, 
        state: 'routing' 
      });
      expect(useVoxelBattleStore.getState().attackerForce?.squads[0]?.state).toBe('routing');
      
      // 사기 회복 및 상태 변경
      useVoxelBattleStore.getState().updateSquadState('attacker', squadId, { 
        morale: 45, 
        state: 'idle' 
      });
      
      const squad = useVoxelBattleStore.getState().attackerForce?.squads[0];
      expect(squad?.state).toBe('idle');
      expect(squad?.morale).toBe(45);
    });
  });
});

