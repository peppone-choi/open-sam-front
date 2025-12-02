/**
 * 전투 결과 동기화 모듈
 * 
 * 복셀 전투 결과를 수집, 계산, 전송하고 리플레이를 관리합니다.
 * 
 * @module sync
 * 
 * @example
 * ```typescript
 * import {
 *   ResultCollector,
 *   ResultCalculator,
 *   ResultSubmitter,
 *   LogGenerator,
 *   ReplayManager,
 *   submitBattleResult,
 * } from '@/lib/battle/sync';
 * 
 * // 1. 전투 시작 시 수집기 초기화
 * const collector = createResultCollector(battleId);
 * collector.initializeBattle(attackerSquads, defenderSquads);
 * 
 * // 2. 전투 중 상태 업데이트
 * collector.updateFromTWSquads(attackerSquads, defenderSquads);
 * collector.addEvent('charge_started', { squadId: 'squad_1' });
 * 
 * // 3. 전투 종료 시 결과 수집
 * const endCondition = collector.checkEndConditions();
 * if (endCondition) {
 *   const result = collector.finalizeBattle(endCondition);
 *   
 *   // 4. 결과 제출
 *   const submitResult = await submitBattleResult(result);
 *   
 *   // 5. 로그 생성
 *   const logs = generateBattleLog(result.events);
 *   
 *   // 6. 리플레이 저장 (선택)
 *   saveReplay(initialState, result.events, result);
 * }
 * ```
 */

// ========================================
// ResultCollector - 결과 수집
// ========================================

export {
  ResultCollector,
  createResultCollector,
  type SquadSnapshot,
  type BattleSnapshot,
  type EndCondition,
  type CollectorOptions,
} from './ResultCollector';

// ========================================
// ResultCalculator - 결과 계산
// ========================================

export {
  ResultCalculator,
  calculateCasualties,
  determineWinner,
  calculateExperience,
  type CasualtyReport,
  type SquadCasualty,
  type ExperienceGain,
  type VictoryDetermination,
  type BattleConsequences,
  type GeneralConsequence,
  type CityConsequence,
  type LootItem,
} from './ResultCalculator';

// ========================================
// ResultSubmitter - API 전송
// ========================================

export {
  ResultSubmitter,
  getResultSubmitter,
  createResultSubmitter,
  submitBattleResult,
  type SubmitOptions,
  type SubmitResult,
  type SubmitResponse,
  type ApiBattleResultPayload,
  type PendingResult,
} from './ResultSubmitter';

// ========================================
// LogGenerator - 로그 생성
// ========================================

export {
  LogGenerator,
  generateBattleLog,
  extractHighlights,
  generateBattleSummary,
  createLogGenerator,
  type BattleLogEntry,
  type BattleHighlight,
  type HighlightType,
  type BattleSummary,
  type LogFilterOptions,
} from './LogGenerator';

// ========================================
// ReplayManager - 리플레이 관리
// ========================================

export {
  ReplayManager,
  getReplayManager,
  createReplayManager,
  saveReplay,
  loadReplay,
  type ReplayData,
  type TimestampedEvent,
  type CompressedSnapshot,
  type ReplayMetadata,
  type ReplayInfo,
  type PlaybackState,
  type PlaybackEventHandler,
  type PlaybackOptions,
} from './ReplayManager';

// ========================================
// 통합 유틸리티
// ========================================

import { ResultCollector, createResultCollector } from './ResultCollector';
import { ResultCalculator } from './ResultCalculator';
import { ResultSubmitter, getResultSubmitter } from './ResultSubmitter';
import { LogGenerator, generateBattleSummary } from './LogGenerator';
import { ReplayManager, getReplayManager, saveReplay } from './ReplayManager';
import type { VoxelBattleResult, VoxelBattleInit, BattleEvent } from '../types/BattleTypes';
import type { TWSquad } from '../TotalWarEngine';
import type { BattleSnapshot, EndCondition } from './ResultCollector';

/**
 * 전투 결과 처리 파이프라인
 * 
 * 전투 결과를 한 번에 처리합니다:
 * 1. 결과 검증
 * 2. API 전송
 * 3. 로그 생성
 * 4. 리플레이 저장 (선택)
 */
export interface BattleResultPipeline {
  /** 결과 제출 성공 여부 */
  submitted: boolean;
  /** 로그 배열 */
  logs: string[];
  /** 요약 정보 */
  summary: ReturnType<typeof generateBattleSummary>;
  /** 리플레이 ID (저장된 경우) */
  replayId?: string;
  /** 오류 (있는 경우) */
  errors: string[];
}

/**
 * 전투 결과 처리 파이프라인 실행
 */
export async function processBattleResult(
  result: VoxelBattleResult,
  options?: {
    saveReplay?: boolean;
    initialState?: VoxelBattleInit;
    snapshots?: BattleSnapshot[];
  }
): Promise<BattleResultPipeline> {
  const errors: string[] = [];
  let submitted = false;
  let replayId: string | undefined;
  
  // 1. API 전송
  const submitter = getResultSubmitter();
  const submitResult = await submitter.submitVoxelResult(result);
  submitted = submitResult.success;
  
  if (!submitted && submitResult.error) {
    errors.push(`API 전송 실패: ${submitResult.error}`);
  }
  
  // 2. 로그 생성
  const logGenerator = new LogGenerator(result.events);
  const logs = logGenerator.getLogStrings();
  const summary = logGenerator.generateSummary(result);
  
  // 3. 리플레이 저장 (선택)
  if (options?.saveReplay && options.initialState) {
    const replayResult = saveReplay(
      options.initialState,
      result.events,
      result,
      options.snapshots
    );
    
    if (replayResult.success) {
      replayId = replayResult.replayId;
    } else if (replayResult.error) {
      errors.push(`리플레이 저장 실패: ${replayResult.error}`);
    }
  }
  
  return {
    submitted,
    logs,
    summary,
    replayId,
    errors,
  };
}

/**
 * 전투 결과 동기화 관리자
 * 
 * 전체 전투 주기를 관리하는 통합 클래스
 */
export class BattleSyncManager {
  private collector: ResultCollector;
  private submitter: ResultSubmitter;
  private logGenerator: LogGenerator;
  private replayManager: ReplayManager;
  
  private initialState?: VoxelBattleInit;
  private battleId: string;
  
  constructor(battleId: string) {
    this.battleId = battleId;
    this.collector = createResultCollector(battleId);
    this.submitter = getResultSubmitter();
    this.logGenerator = new LogGenerator();
    this.replayManager = getReplayManager();
  }
  
  /**
   * 전투 시작
   */
  startBattle(
    initialState: VoxelBattleInit,
    attackerSquads: TWSquad[],
    defenderSquads: TWSquad[]
  ): void {
    this.initialState = initialState;
    this.collector.initializeBattle(attackerSquads, defenderSquads);
  }
  
  /**
   * 상태 업데이트
   */
  update(attackerSquads: TWSquad[], defenderSquads: TWSquad[]): EndCondition | null {
    this.collector.updateFromTWSquads(attackerSquads, defenderSquads);
    return this.collector.checkEndConditions();
  }
  
  /**
   * 이벤트 추가
   */
  addEvent(type: BattleEvent['type'], data: Record<string, unknown> = {}): void {
    this.collector.addEvent(type, data);
  }
  
  /**
   * 전투 종료 및 결과 처리
   */
  async finishBattle(
    condition: EndCondition,
    options?: { saveReplay?: boolean }
  ): Promise<BattleResultPipeline> {
    // 결과 수집
    const result = this.collector.finalizeBattle(condition);
    
    // 파이프라인 실행
    return processBattleResult(result, {
      saveReplay: options?.saveReplay,
      initialState: this.initialState,
      snapshots: this.collector.getSnapshotHistory(),
    });
  }
  
  /**
   * 현재 상태 조회
   */
  getStatus(): {
    battleId: string;
    elapsedTime: number;
    troops: { attacker: number; defender: number };
    events: BattleEvent[];
  } {
    return {
      battleId: this.battleId,
      elapsedTime: this.collector.getElapsedTime(),
      troops: this.collector.getCurrentTroops(),
      events: this.collector.getEvents(),
    };
  }
}

/**
 * BattleSyncManager 생성 팩토리
 */
export function createBattleSyncManager(battleId: string): BattleSyncManager {
  return new BattleSyncManager(battleId);
}






