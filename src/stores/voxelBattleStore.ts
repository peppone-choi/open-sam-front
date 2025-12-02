/**
 * 복셀 전투 상태 관리 Zustand 스토어
 * @module voxelBattleStore
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import {
  VoxelBattleStore,
  VoxelBattleState,
  BattlePhase,
  BattleSpeed,
  BattleStats,
  BattleEvent,
  BattleResult,
  VoxelBattleInit,
  ForceState,
  SquadState,
  SoldierState,
  FormationType,
} from './voxelBattleTypes';

// ============================================================================
// 초기 상태
// ============================================================================

const initialStats: BattleStats = {
  elapsedTime: 0,
  attackerKills: 0,
  defenderKills: 0,
  attackerMorale: 100,
  defenderMorale: 100,
  attackerRemaining: 0,
  defenderRemaining: 0,
};

const initialState: VoxelBattleState = {
  battleId: null,
  phase: 'loading',
  speed: 1,
  terrain: null,
  weather: null,
  attackerForce: null,
  defenderForce: null,
  stats: { ...initialStats },
  events: [],
  maxEvents: 1000,
  result: null,
};

// ============================================================================
// 헬퍼 함수
// ============================================================================

/**
 * 고유 ID 생성
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * BattleForceInit을 ForceState로 변환
 */
function createForceState(init: VoxelBattleInit['attacker']): ForceState {
  const squads: SquadState[] = init.units.map((unit, index) => {
    // 각 병사 생성
    const soldiers: SoldierState[] = Array.from({ length: unit.count }, (_, i) => ({
      id: `soldier-${index}-${i}`,
      position: { x: 0, y: 0, z: 0 }, // 초기 위치는 엔진에서 설정
      health: 100,
      maxHealth: 100,
      isAlive: true,
      animation: 'idle',
    }));

    return {
      id: `squad-${index}-${unit.unitId}`,
      unitId: unit.unitId,
      unitName: `Unit ${unit.unitId}`, // 실제 이름은 매핑 테이블에서 가져옴
      soldiers,
      totalSoldiers: unit.count,
      aliveSoldiers: unit.count,
      formation: 'line' as FormationType,
      facing: 0,
      state: 'idle',
      position: { x: 0, y: 0, z: 0 },
      targetSquadId: null,
      morale: unit.morale,
      experience: unit.experience,
    };
  });

  const totalUnits = squads.reduce((sum, squad) => sum + squad.totalSoldiers, 0);

  return {
    generalId: init.generalId,
    generalName: init.generalName,
    nationId: init.nationId,
    squads,
    totalUnits,
    remainingUnits: totalUnits,
    morale: init.units.reduce((sum, u) => sum + u.morale, 0) / init.units.length || 100,
  };
}

/**
 * 부대 평균 사기 계산
 */
function calculateForceMorale(force: ForceState): number {
  const aliveSquads = force.squads.filter(s => s.aliveSoldiers > 0);
  if (aliveSquads.length === 0) return 0;
  
  const totalMorale = aliveSquads.reduce((sum, squad) => {
    return sum + (squad.morale * squad.aliveSoldiers);
  }, 0);
  const totalSoldiers = aliveSquads.reduce((sum, squad) => sum + squad.aliveSoldiers, 0);
  
  return totalSoldiers > 0 ? totalMorale / totalSoldiers : 0;
}

/**
 * 부대 잔존 병력 계산
 */
function calculateRemainingUnits(force: ForceState): number {
  return force.squads.reduce((sum, squad) => sum + squad.aliveSoldiers, 0);
}

// ============================================================================
// 스토어 생성
// ============================================================================

export const useVoxelBattleStore = create<VoxelBattleStore>()(
  subscribeWithSelector((set, get) => ({
    // 초기 상태
    ...initialState,

    // ========================================================================
    // 전투 라이프사이클 액션
    // ========================================================================

    initBattle: (data: VoxelBattleInit) => {
      const attackerForce = createForceState(data.attacker);
      const defenderForce = createForceState(data.defender);

      set({
        battleId: data.battleId,
        phase: 'ready',
        terrain: data.terrain,
        weather: data.weather,
        attackerForce,
        defenderForce,
        stats: {
          elapsedTime: 0,
          attackerKills: 0,
          defenderKills: 0,
          attackerMorale: attackerForce.morale,
          defenderMorale: defenderForce.morale,
          attackerRemaining: attackerForce.totalUnits,
          defenderRemaining: defenderForce.totalUnits,
        },
        events: [],
        result: null,
      });
    },

    startBattle: () => {
      const { phase, addEvent } = get();
      if (phase !== 'ready' && phase !== 'paused') return;

      set({ phase: 'running' });
      
      // 전투 시작 이벤트 추가
      if (phase === 'ready') {
        addEvent({ type: 'battle_start' });
      }
    },

    pauseBattle: () => {
      const { phase } = get();
      if (phase !== 'running') return;
      set({ phase: 'paused' });
    },

    resumeBattle: () => {
      const { phase } = get();
      if (phase !== 'paused') return;
      set({ phase: 'running' });
    },

    setSpeed: (speed: BattleSpeed) => {
      set({ speed });
    },

    endBattle: (result: BattleResult) => {
      const { addEvent } = get();
      
      addEvent({ 
        type: 'battle_end', 
        winner: result.winner 
      });

      set({
        phase: 'ended',
        result,
      });
    },

    resetBattle: () => {
      set({ ...initialState });
    },

    // ========================================================================
    // 부대 상태 업데이트 액션
    // ========================================================================

    updateSquadState: (side, squadId, updates) => {
      set((state) => {
        const forceKey = side === 'attacker' ? 'attackerForce' : 'defenderForce';
        const force = state[forceKey];
        if (!force) return state;

        const updatedSquads = force.squads.map((squad) => {
          if (squad.id !== squadId) return squad;
          return { ...squad, ...updates };
        });

        const updatedForce = {
          ...force,
          squads: updatedSquads,
          remainingUnits: calculateRemainingUnits({ ...force, squads: updatedSquads }),
          morale: calculateForceMorale({ ...force, squads: updatedSquads }),
        };

        return {
          [forceKey]: updatedForce,
          stats: {
            ...state.stats,
            [`${side}Morale`]: updatedForce.morale,
            [`${side}Remaining`]: updatedForce.remainingUnits,
          },
        };
      });
    },

    updateSoldierState: (side, squadId, soldierId, updates) => {
      set((state) => {
        const forceKey = side === 'attacker' ? 'attackerForce' : 'defenderForce';
        const force = state[forceKey];
        if (!force) return state;

        const updatedSquads = force.squads.map((squad) => {
          if (squad.id !== squadId) return squad;

          const updatedSoldiers = squad.soldiers.map((soldier) => {
            if (soldier.id !== soldierId) return soldier;
            return { ...soldier, ...updates };
          });

          const aliveSoldiers = updatedSoldiers.filter(s => s.isAlive).length;

          return {
            ...squad,
            soldiers: updatedSoldiers,
            aliveSoldiers,
            state: aliveSoldiers === 0 ? 'dead' : squad.state,
          };
        });

        const updatedForce = {
          ...force,
          squads: updatedSquads,
          remainingUnits: calculateRemainingUnits({ ...force, squads: updatedSquads }),
          morale: calculateForceMorale({ ...force, squads: updatedSquads }),
        };

        return {
          [forceKey]: updatedForce,
          stats: {
            ...state.stats,
            [`${side}Morale`]: updatedForce.morale,
            [`${side}Remaining`]: updatedForce.remainingUnits,
          },
        };
      });
    },

    updateMorale: (side, squadId, morale) => {
      const { updateSquadState, addEvent } = get();
      
      set((state) => {
        const forceKey = side === 'attacker' ? 'attackerForce' : 'defenderForce';
        const force = state[forceKey];
        if (!force) return state;

        const squad = force.squads.find(s => s.id === squadId);
        if (!squad) return state;

        const oldMorale = squad.morale;
        const newMorale = Math.max(0, Math.min(100, morale));

        // 사기 변화 이벤트
        if (Math.abs(oldMorale - newMorale) >= 5) {
          addEvent({
            type: 'morale_change',
            squadId,
            oldMorale,
            newMorale,
            reason: newMorale > oldMorale ? 'rally' : 'demoralized',
          });
        }

        // 패주 체크
        if (newMorale < 20 && squad.state !== 'routing') {
          addEvent({
            type: 'squad_routing',
            squadId,
            side,
          });
          updateSquadState(side, squadId, { morale: newMorale, state: 'routing' });
        } else if (newMorale >= 40 && squad.state === 'routing') {
          addEvent({
            type: 'squad_rallied',
            squadId,
            side,
          });
          updateSquadState(side, squadId, { morale: newMorale, state: 'idle' });
        } else {
          updateSquadState(side, squadId, { morale: newMorale });
        }

        return state;
      });
    },

    removeUnit: (side, squadId, soldierId) => {
      const { updateSoldierState, incrementKills, addEvent } = get();
      
      // 해당 병사 사망 처리
      updateSoldierState(side, squadId, soldierId, { isAlive: false, health: 0 });
      
      // 상대편 킬 수 증가
      const killerSide = side === 'attacker' ? 'defender' : 'attacker';
      incrementKills(killerSide);

      // 이벤트 추가
      addEvent({
        type: 'unit_killed',
        victimId: soldierId,
        victimSquadId: squadId,
        killerId: null,
        killerSquadId: null,
      });
    },

    destroySquad: (side, squadId) => {
      const { addEvent } = get();
      
      set((state) => {
        const forceKey = side === 'attacker' ? 'attackerForce' : 'defenderForce';
        const force = state[forceKey];
        if (!force) return state;

        const updatedSquads = force.squads.map((squad) => {
          if (squad.id !== squadId) return squad;
          return {
            ...squad,
            state: 'dead' as const,
            aliveSoldiers: 0,
            soldiers: squad.soldiers.map(s => ({ ...s, isAlive: false, health: 0 })),
          };
        });

        const updatedForce = {
          ...force,
          squads: updatedSquads,
          remainingUnits: calculateRemainingUnits({ ...force, squads: updatedSquads }),
          morale: calculateForceMorale({ ...force, squads: updatedSquads }),
        };

        return {
          [forceKey]: updatedForce,
        };
      });

      addEvent({
        type: 'squad_destroyed',
        squadId,
        side,
      });
    },

    // ========================================================================
    // 이벤트 관리 액션
    // ========================================================================

    addEvent: (eventData) => {
      set((state) => {
        const event: BattleEvent = {
          ...eventData,
          id: generateId(),
          timestamp: Date.now(),
        } as BattleEvent;

        const events = [...state.events, event];
        
        // 최대 이벤트 수 초과 시 오래된 것부터 제거
        if (events.length > state.maxEvents) {
          events.splice(0, events.length - state.maxEvents);
        }

        return { events };
      });
    },

    clearEvents: () => {
      set({ events: [] });
    },

    // ========================================================================
    // 통계 업데이트 액션
    // ========================================================================

    updateStats: (updates) => {
      set((state) => ({
        stats: { ...state.stats, ...updates },
      }));
    },

    incrementKills: (side, count = 1) => {
      set((state) => ({
        stats: {
          ...state.stats,
          [`${side}Kills`]: state.stats[`${side}Kills` as keyof BattleStats] as number + count,
        },
      }));
    },

    tick: (deltaTime) => {
      const { phase } = get();
      if (phase !== 'running') return;

      set((state) => ({
        stats: {
          ...state.stats,
          elapsedTime: state.stats.elapsedTime + deltaTime,
        },
      }));
    },
  }))
);

// ============================================================================
// 디버그용 전역 노출 (개발 환경)
// ============================================================================

if (typeof window !== 'undefined') {
  const globalWindow = window as Window & { __OPEN_SAM_STORES__?: Record<string, unknown> };
  globalWindow.__OPEN_SAM_STORES__ = globalWindow.__OPEN_SAM_STORES__ ?? {};
  globalWindow.__OPEN_SAM_STORES__.voxelBattle = useVoxelBattleStore;
}

// ============================================================================
// 타입 export
// ============================================================================

export type { VoxelBattleStore, VoxelBattleState };





