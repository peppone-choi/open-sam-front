/**
 * 복셀 전투 상태 셀렉터
 * 성능 최적화를 위한 메모이제이션 셀렉터 제공
 * @module voxelBattleSelectors
 */

import { useVoxelBattleStore } from './voxelBattleStore';
import type {
  VoxelBattleState,
  BattlePhase,
  BattleSpeed,
  BattleStats,
  BattleEvent,
  BattleResult,
  ForceState,
  SquadState,
  TerrainType,
  WeatherType,
} from './voxelBattleTypes';

// ============================================================================
// 기본 셀렉터
// ============================================================================

/** 전투 ID 셀렉터 */
export const selectBattleId = (state: VoxelBattleState): string | null => 
  state.battleId;

/** 현재 페이즈 셀렉터 */
export const selectPhase = (state: VoxelBattleState): BattlePhase => 
  state.phase;

/** 전투 속도 셀렉터 */
export const selectSpeed = (state: VoxelBattleState): BattleSpeed => 
  state.speed;

/** 지형 셀렉터 */
export const selectTerrain = (state: VoxelBattleState): TerrainType | null => 
  state.terrain;

/** 날씨 셀렉터 */
export const selectWeather = (state: VoxelBattleState): WeatherType | null => 
  state.weather;

// ============================================================================
// 부대 셀렉터
// ============================================================================

/** 공격자 부대 전체 셀렉터 */
export const selectAttackerForce = (state: VoxelBattleState): ForceState | null => 
  state.attackerForce;

/** 방어자 부대 전체 셀렉터 */
export const selectDefenderForce = (state: VoxelBattleState): ForceState | null => 
  state.defenderForce;

/** 공격자 장수 이름 */
export const selectAttackerGeneralName = (state: VoxelBattleState): string | null => 
  state.attackerForce?.generalName ?? null;

/** 방어자 장수 이름 */
export const selectDefenderGeneralName = (state: VoxelBattleState): string | null => 
  state.defenderForce?.generalName ?? null;

/** 공격자 부대 목록 */
export const selectAttackerSquads = (state: VoxelBattleState): SquadState[] => 
  state.attackerForce?.squads ?? [];

/** 방어자 부대 목록 */
export const selectDefenderSquads = (state: VoxelBattleState): SquadState[] => 
  state.defenderForce?.squads ?? [];

/** 공격자 총 병력 */
export const selectAttackerTotalUnits = (state: VoxelBattleState): number => 
  state.attackerForce?.totalUnits ?? 0;

/** 방어자 총 병력 */
export const selectDefenderTotalUnits = (state: VoxelBattleState): number => 
  state.defenderForce?.totalUnits ?? 0;

/** 공격자 잔존 병력 */
export const selectAttackerRemainingUnits = (state: VoxelBattleState): number => 
  state.attackerForce?.remainingUnits ?? 0;

/** 방어자 잔존 병력 */
export const selectDefenderRemainingUnits = (state: VoxelBattleState): number => 
  state.defenderForce?.remainingUnits ?? 0;

// ============================================================================
// 사기 셀렉터
// ============================================================================

/** 공격자 사기 */
export const selectAttackerMorale = (state: VoxelBattleState): number => 
  state.stats.attackerMorale;

/** 방어자 사기 */
export const selectDefenderMorale = (state: VoxelBattleState): number => 
  state.stats.defenderMorale;

// ============================================================================
// 통계 셀렉터
// ============================================================================

/** 전투 통계 전체 */
export const selectBattleStats = (state: VoxelBattleState): BattleStats => 
  state.stats;

/** 경과 시간 (밀리초) */
export const selectElapsedTime = (state: VoxelBattleState): number => 
  state.stats.elapsedTime;

/** 경과 시간 (초, 포맷팅) */
export const selectElapsedTimeFormatted = (state: VoxelBattleState): string => {
  const totalSeconds = Math.floor(state.stats.elapsedTime / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

/** 공격자 킬 수 */
export const selectAttackerKills = (state: VoxelBattleState): number => 
  state.stats.attackerKills;

/** 방어자 킬 수 */
export const selectDefenderKills = (state: VoxelBattleState): number => 
  state.stats.defenderKills;

// ============================================================================
// 이벤트 셀렉터
// ============================================================================

/** 전체 이벤트 목록 */
export const selectEvents = (state: VoxelBattleState): BattleEvent[] => 
  state.events;

/** 최근 N개 이벤트 */
export const selectRecentEvents = (count: number) => 
  (state: VoxelBattleState): BattleEvent[] => 
    state.events.slice(-count);

/** 이벤트 수 */
export const selectEventCount = (state: VoxelBattleState): number => 
  state.events.length;

/** 타입별 이벤트 필터 */
export const selectEventsByType = <T extends BattleEvent['type']>(eventType: T) =>
  (state: VoxelBattleState): BattleEvent[] =>
    state.events.filter(e => e.type === eventType);

// ============================================================================
// 결과 셀렉터
// ============================================================================

/** 전투 결과 */
export const selectResult = (state: VoxelBattleState): BattleResult | null => 
  state.result;

/** 승자 */
export const selectWinner = (state: VoxelBattleState): 'attacker' | 'defender' | 'draw' | null => 
  state.result?.winner ?? null;

// ============================================================================
// 상태 확인 셀렉터
// ============================================================================

/** 전투 진행 중 여부 */
export const selectIsRunning = (state: VoxelBattleState): boolean => 
  state.phase === 'running';

/** 전투 일시정지 여부 */
export const selectIsPaused = (state: VoxelBattleState): boolean => 
  state.phase === 'paused';

/** 전투 종료 여부 */
export const selectIsEnded = (state: VoxelBattleState): boolean => 
  state.phase === 'ended';

/** 전투 준비 완료 여부 */
export const selectIsReady = (state: VoxelBattleState): boolean => 
  state.phase === 'ready';

/** 전투 로딩 중 여부 */
export const selectIsLoading = (state: VoxelBattleState): boolean => 
  state.phase === 'loading';

/** 전투 활성화 여부 (running 또는 paused) */
export const selectIsActive = (state: VoxelBattleState): boolean => 
  state.phase === 'running' || state.phase === 'paused';

// ============================================================================
// 파생 셀렉터
// ============================================================================

/** 공격자 병력 비율 (0-1) */
export const selectAttackerUnitRatio = (state: VoxelBattleState): number => {
  const force = state.attackerForce;
  if (!force || force.totalUnits === 0) return 0;
  return force.remainingUnits / force.totalUnits;
};

/** 방어자 병력 비율 (0-1) */
export const selectDefenderUnitRatio = (state: VoxelBattleState): number => {
  const force = state.defenderForce;
  if (!force || force.totalUnits === 0) return 0;
  return force.remainingUnits / force.totalUnits;
};

/** 전투 요약 정보 */
export const selectBattleSummary = (state: VoxelBattleState) => ({
  battleId: state.battleId,
  phase: state.phase,
  terrain: state.terrain,
  weather: state.weather,
  attacker: state.attackerForce ? {
    generalName: state.attackerForce.generalName,
    remaining: state.attackerForce.remainingUnits,
    total: state.attackerForce.totalUnits,
    morale: state.stats.attackerMorale,
  } : null,
  defender: state.defenderForce ? {
    generalName: state.defenderForce.generalName,
    remaining: state.defenderForce.remainingUnits,
    total: state.defenderForce.totalUnits,
    morale: state.stats.defenderMorale,
  } : null,
  elapsedTime: state.stats.elapsedTime,
});

/** 특정 부대 셀렉터 팩토리 */
export const selectSquadById = (side: 'attacker' | 'defender', squadId: string) =>
  (state: VoxelBattleState): SquadState | null => {
    const force = side === 'attacker' ? state.attackerForce : state.defenderForce;
    return force?.squads.find(s => s.id === squadId) ?? null;
  };

/** 생존 부대만 선택 */
export const selectAliveSquads = (side: 'attacker' | 'defender') =>
  (state: VoxelBattleState): SquadState[] => {
    const force = side === 'attacker' ? state.attackerForce : state.defenderForce;
    return force?.squads.filter(s => s.aliveSoldiers > 0) ?? [];
  };

/** 패주 중인 부대 선택 */
export const selectRoutingSquads = (side: 'attacker' | 'defender') =>
  (state: VoxelBattleState): SquadState[] => {
    const force = side === 'attacker' ? state.attackerForce : state.defenderForce;
    return force?.squads.filter(s => s.state === 'routing') ?? [];
  };

// ============================================================================
// React Hook 래퍼
// ============================================================================

/** 전투 페이즈 훅 */
export const useBattlePhase = () => 
  useVoxelBattleStore(selectPhase);

/** 전투 속도 훅 */
export const useBattleSpeed = () => 
  useVoxelBattleStore(selectSpeed);

/** 공격자 부대 훅 */
export const useAttackerForce = () => 
  useVoxelBattleStore(selectAttackerForce);

/** 방어자 부대 훅 */
export const useDefenderForce = () => 
  useVoxelBattleStore(selectDefenderForce);

/** 공격자 사기 훅 */
export const useAttackerMorale = () => 
  useVoxelBattleStore(selectAttackerMorale);

/** 방어자 사기 훅 */
export const useDefenderMorale = () => 
  useVoxelBattleStore(selectDefenderMorale);

/** 전투 통계 훅 */
export const useBattleStats = () => 
  useVoxelBattleStore(selectBattleStats);

/** 전투 이벤트 훅 */
export const useBattleEvents = () => 
  useVoxelBattleStore(selectEvents);

/** 최근 이벤트 훅 */
export const useRecentBattleEvents = (count: number = 10) => 
  useVoxelBattleStore(selectRecentEvents(count));

/** 전투 진행 중 훅 */
export const useIsBattleRunning = () => 
  useVoxelBattleStore(selectIsRunning);

/** 전투 결과 훅 */
export const useBattleResult = () => 
  useVoxelBattleStore(selectResult);

/** 전투 요약 훅 */
export const useBattleSummary = () => 
  useVoxelBattleStore(selectBattleSummary);

/** 경과 시간 포맷 훅 */
export const useElapsedTimeFormatted = () => 
  useVoxelBattleStore(selectElapsedTimeFormatted);

// ============================================================================
// 액션 훅
// ============================================================================

/** 전투 제어 액션 훅 */
export const useBattleControls = () => {
  const startBattle = useVoxelBattleStore(state => state.startBattle);
  const pauseBattle = useVoxelBattleStore(state => state.pauseBattle);
  const resumeBattle = useVoxelBattleStore(state => state.resumeBattle);
  const setSpeed = useVoxelBattleStore(state => state.setSpeed);
  const resetBattle = useVoxelBattleStore(state => state.resetBattle);

  return {
    startBattle,
    pauseBattle,
    resumeBattle,
    setSpeed,
    resetBattle,
  };
};

/** 전투 초기화 액션 훅 */
export const useBattleInit = () => {
  const initBattle = useVoxelBattleStore(state => state.initBattle);
  const endBattle = useVoxelBattleStore(state => state.endBattle);

  return {
    initBattle,
    endBattle,
  };
};

/** 유닛 상태 업데이트 액션 훅 */
export const useUnitStateActions = () => {
  const updateSquadState = useVoxelBattleStore(state => state.updateSquadState);
  const updateSoldierState = useVoxelBattleStore(state => state.updateSoldierState);
  const updateMorale = useVoxelBattleStore(state => state.updateMorale);
  const removeUnit = useVoxelBattleStore(state => state.removeUnit);
  const destroySquad = useVoxelBattleStore(state => state.destroySquad);

  return {
    updateSquadState,
    updateSoldierState,
    updateMorale,
    removeUnit,
    destroySquad,
  };
};

/** 이벤트 관리 액션 훅 */
export const useEventActions = () => {
  const addEvent = useVoxelBattleStore(state => state.addEvent);
  const clearEvents = useVoxelBattleStore(state => state.clearEvents);

  return {
    addEvent,
    clearEvents,
  };
};





