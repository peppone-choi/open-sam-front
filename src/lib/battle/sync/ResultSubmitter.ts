/**
 * 결과 제출기 (ResultSubmitter)
 * 
 * 전투 결과를 게임 서버 API로 전송합니다.
 * 재시도 로직과 에러 핸들링을 포함합니다.
 * 
 * @module ResultSubmitter
 */

import type {
  VoxelBattleResult,
  ApiBattleResult,
} from '../types/BattleTypes';
import type {
  BattleResultRequest,
  ParticipantResult,
  TroopResult,
  GeneralResult,
} from '../integration/BattleAPI';
import {
  convertVoxelResultToApi,
  generateBattleLog,
} from '../adapters/ResultAdapter';
import { ResultCalculator } from './ResultCalculator';

// ========================================
// 상수 정의
// ========================================

/** 제출 설정 */
const SUBMIT_CONFIG = {
  /** 최대 재시도 횟수 */
  MAX_RETRIES: 3,
  /** 재시도 간격 (ms) */
  RETRY_DELAY: 1000,
  /** 요청 타임아웃 (ms) */
  REQUEST_TIMEOUT: 10000,
  /** 오프라인 저장 키 */
  OFFLINE_STORAGE_KEY: 'pending_battle_results',
} as const;

/** API 엔드포인트 */
const API_ENDPOINTS = {
  /** 전투 결과 제출 */
  SUBMIT_RESULT: '/api/battle/result',
  /** 전투 결과 검증 */
  VALIDATE_RESULT: '/api/battle/validate',
  /** 전투 상태 업데이트 */
  UPDATE_STATUS: '/api/battle/status',
} as const;

// ========================================
// 타입 정의
// ========================================

/** 제출 옵션 */
export interface SubmitOptions {
  /** 재시도 횟수 */
  maxRetries?: number;
  /** 재시도 간격 (ms) */
  retryDelay?: number;
  /** 타임아웃 (ms) */
  timeout?: number;
  /** 오프라인 저장 여부 */
  saveOffline?: boolean;
  /** 헤더 */
  headers?: Record<string, string>;
}

/** 제출 결과 */
export interface SubmitResult {
  /** 성공 여부 */
  success: boolean;
  /** 오류 메시지 */
  error?: string;
  /** 서버 응답 */
  response?: SubmitResponse;
  /** 재시도 횟수 */
  retryCount: number;
  /** 오프라인 저장 여부 */
  savedOffline?: boolean;
}

/** 서버 응답 */
export interface SubmitResponse {
  /** 처리 성공 여부 */
  success: boolean;
  /** 메시지 */
  message?: string;
  /** 업데이트된 데이터 */
  updates?: {
    attackerExp?: number;
    defenderExp?: number;
    attackerCrew?: number;
    defenderCrew?: number;
  };
}

/** API 전투 결과 페이로드 */
export interface ApiBattleResultPayload {
  battleId: string;
  result: 0 | 1 | 2;  // 0: 무승부, 1: 공격자 승, 2: 방어자 승
  attackerDead: number;
  defenderDead: number;
  attackerExp: number;
  defenderExp: number;
  logs: string[];
  duration: number;
  timestamp: number;
}

/** 대기 중인 결과 */
export interface PendingResult {
  payload: ApiBattleResultPayload;
  timestamp: number;
  retryCount: number;
}

// ========================================
// ResultSubmitter 클래스
// ========================================

/**
 * 전투 결과 제출기
 */
export class ResultSubmitter {
  private baseUrl: string;
  private defaultOptions: SubmitOptions;
  
  constructor(baseUrl: string = '', options: SubmitOptions = {}) {
    this.baseUrl = baseUrl || (typeof window !== 'undefined' 
      ? window.location.origin 
      : 'http://localhost:8080');
    this.defaultOptions = {
      maxRetries: SUBMIT_CONFIG.MAX_RETRIES,
      retryDelay: SUBMIT_CONFIG.RETRY_DELAY,
      timeout: SUBMIT_CONFIG.REQUEST_TIMEOUT,
      saveOffline: true,
      ...options,
    };
  }
  
  // ========================================
  // 메인 제출 메서드
  // ========================================
  
  /**
   * VoxelBattleResult를 API로 제출
   */
  async submitVoxelResult(
    result: VoxelBattleResult,
    options?: SubmitOptions
  ): Promise<SubmitResult> {
    // 복셀 결과 → API 페이로드 변환
    const payload = this.convertToPayload(result);
    return this.submitPayload(payload, options);
  }
  
  /**
   * ApiBattleResult를 API로 제출
   */
  async submitApiResult(
    result: ApiBattleResult,
    options?: SubmitOptions
  ): Promise<SubmitResult> {
    const payload: ApiBattleResultPayload = {
      battleId: result.battleId,
      result: result.result,
      attackerDead: result.attackerDead,
      defenderDead: result.defenderDead,
      attackerExp: result.exp,
      defenderExp: Math.floor(result.exp * 0.5), // 패자는 절반
      logs: result.logs,
      duration: result.battleTime * 1000,
      timestamp: Date.now(),
    };
    
    return this.submitPayload(payload, options);
  }
  
  /**
   * 페이로드 직접 제출
   */
  async submitPayload(
    payload: ApiBattleResultPayload,
    options?: SubmitOptions
  ): Promise<SubmitResult> {
    const opts = { ...this.defaultOptions, ...options };
    let retryCount = 0;
    let lastError: Error | null = null;
    
    while (retryCount <= (opts.maxRetries ?? SUBMIT_CONFIG.MAX_RETRIES)) {
      try {
        const response = await this.sendRequest(payload, opts);
        return {
          success: true,
          response,
          retryCount,
        };
      } catch (error) {
        lastError = error as Error;
        retryCount++;
        
        if (retryCount <= (opts.maxRetries ?? SUBMIT_CONFIG.MAX_RETRIES)) {
          // 재시도 전 대기
          await this.delay(opts.retryDelay ?? SUBMIT_CONFIG.RETRY_DELAY);
        }
      }
    }
    
    // 모든 재시도 실패
    const result: SubmitResult = {
      success: false,
      error: lastError?.message || '알 수 없는 오류',
      retryCount,
    };
    
    // 오프라인 저장
    if (opts.saveOffline) {
      const saved = this.saveOffline(payload, retryCount);
      result.savedOffline = saved;
    }
    
    return result;
  }
  
  // ========================================
  // HTTP 요청
  // ========================================
  
  /**
   * 실제 API 요청 전송
   */
  private async sendRequest(
    payload: ApiBattleResultPayload,
    options: SubmitOptions
  ): Promise<SubmitResponse> {
    const url = `${this.baseUrl}${API_ENDPOINTS.SUBMIT_RESULT}`;
    const timeout = options.timeout ?? SUBMIT_CONFIG.REQUEST_TIMEOUT;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data as SubmitResponse;
    } catch (error) {
      clearTimeout(timeoutId);
      
      if ((error as Error).name === 'AbortError') {
        throw new Error('요청 시간 초과');
      }
      
      throw error;
    }
  }
  
  // ========================================
  // 변환 메서드
  // ========================================
  
  /**
   * VoxelBattleResult → ApiBattleResultPayload 변환
   */
  convertToPayload(result: VoxelBattleResult): ApiBattleResultPayload {
    // 기존 어댑터 활용
    const apiResult = convertVoxelResultToApi(result);
    
    // 패자 경험치 계산
    const loserExp = ResultCalculator.calculateLoserExperience(result);
    
    return {
      battleId: result.battleId,
      result: apiResult.result,
      attackerDead: apiResult.attackerDead,
      defenderDead: apiResult.defenderDead,
      attackerExp: result.winner === 'attacker' ? apiResult.exp : loserExp.total,
      defenderExp: result.winner === 'defender' ? apiResult.exp : loserExp.total,
      logs: apiResult.logs,
      duration: result.duration,
      timestamp: Date.now(),
    };
  }
  
  /**
   * BattleResultRequest 형식으로 변환 (상세 버전)
   */
  convertToDetailedRequest(
    result: VoxelBattleResult,
    attackerFactionId: string,
    defenderFactionId: string
  ): BattleResultRequest {
    // 공격측 결과
    const attackerResult: ParticipantResult = {
      totalCasualties: this.calculateTotalCasualties(
        result.attackerSquads.map(s => s.originalUnits),
        result.attackerSquads.map(s => s.survivingUnits)
      ),
      survivingTroops: result.attackerSquads.map(squad => ({
        unitTypeId: squad.unitTypeId,
        survivors: squad.survivingUnits,
        originalCount: squad.originalUnits,
        moraleState: this.getMoraleState(squad.finalMorale),
        experienceGained: Math.floor(result.stats.totalKills.attacker / result.attackerSquads.length),
      })),
      generalResults: [],
      stats: {
        kills: result.stats.totalKills.attacker,
        damageDealt: result.stats.totalDamage.attacker,
        damageReceived: result.stats.totalDamage.defender,
        chargesLed: result.stats.chargeCount.attacker,
        routsCaused: result.stats.routCount.attacker,
      },
    };
    
    // 방어측 결과
    const defenderResult: ParticipantResult = {
      totalCasualties: this.calculateTotalCasualties(
        result.defenderSquads.map(s => s.originalUnits),
        result.defenderSquads.map(s => s.survivingUnits)
      ),
      survivingTroops: result.defenderSquads.map(squad => ({
        unitTypeId: squad.unitTypeId,
        survivors: squad.survivingUnits,
        originalCount: squad.originalUnits,
        moraleState: this.getMoraleState(squad.finalMorale),
        experienceGained: Math.floor(result.stats.totalKills.defender / result.defenderSquads.length),
      })),
      generalResults: [],
      stats: {
        kills: result.stats.totalKills.defender,
        damageDealt: result.stats.totalDamage.defender,
        damageReceived: result.stats.totalDamage.attacker,
        chargesLed: result.stats.chargeCount.defender,
        routsCaused: result.stats.routCount.defender,
      },
    };
    
    return {
      battleId: result.battleId,
      winner: result.winner,
      duration: result.duration,
      attackerResult,
      defenderResult,
    };
  }
  
  /**
   * 총 사상자 계산
   */
  private calculateTotalCasualties(
    originalCounts: number[],
    survivingCounts: number[]
  ): number {
    const total = originalCounts.reduce((sum, n) => sum + n, 0);
    const surviving = survivingCounts.reduce((sum, n) => sum + n, 0);
    return total - surviving;
  }
  
  /**
   * 사기 상태 결정
   */
  private getMoraleState(morale: number): 'healthy' | 'shaken' | 'broken' {
    if (morale >= 50) return 'healthy';
    if (morale >= 20) return 'shaken';
    return 'broken';
  }
  
  // ========================================
  // 오프라인 저장
  // ========================================
  
  /**
   * 결과 오프라인 저장
   */
  saveOffline(payload: ApiBattleResultPayload, retryCount: number): boolean {
    try {
      if (typeof window === 'undefined' || !window.localStorage) {
        return false;
      }
      
      const pendingResults = this.getPendingResults();
      
      pendingResults.push({
        payload,
        timestamp: Date.now(),
        retryCount,
      });
      
      localStorage.setItem(
        SUBMIT_CONFIG.OFFLINE_STORAGE_KEY,
        JSON.stringify(pendingResults)
      );
      
      return true;
    } catch {
      return false;
    }
  }
  
  /**
   * 대기 중인 결과 조회
   */
  getPendingResults(): PendingResult[] {
    try {
      if (typeof window === 'undefined' || !window.localStorage) {
        return [];
      }
      
      const stored = localStorage.getItem(SUBMIT_CONFIG.OFFLINE_STORAGE_KEY);
      if (!stored) return [];
      
      return JSON.parse(stored) as PendingResult[];
    } catch {
      return [];
    }
  }
  
  /**
   * 대기 중인 결과 동기화
   */
  async syncPendingResults(options?: SubmitOptions): Promise<{
    synced: number;
    failed: number;
    remaining: PendingResult[];
  }> {
    const pending = this.getPendingResults();
    const remaining: PendingResult[] = [];
    let synced = 0;
    let failed = 0;
    
    for (const item of pending) {
      const result = await this.submitPayload(item.payload, {
        ...options,
        saveOffline: false, // 이미 저장된 것이므로 중복 저장 방지
      });
      
      if (result.success) {
        synced++;
      } else {
        failed++;
        remaining.push({
          ...item,
          retryCount: item.retryCount + 1,
        });
      }
    }
    
    // 남은 결과 저장
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(
        SUBMIT_CONFIG.OFFLINE_STORAGE_KEY,
        JSON.stringify(remaining)
      );
    }
    
    return { synced, failed, remaining };
  }
  
  /**
   * 대기 중인 결과 삭제
   */
  clearPendingResults(): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem(SUBMIT_CONFIG.OFFLINE_STORAGE_KEY);
    }
  }
  
  // ========================================
  // 검증
  // ========================================
  
  /**
   * 결과 유효성 검증
   */
  validatePayload(payload: ApiBattleResultPayload): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];
    
    if (!payload.battleId) {
      errors.push('battleId가 필요합니다');
    }
    
    if (![0, 1, 2].includes(payload.result)) {
      errors.push('result는 0, 1, 2 중 하나여야 합니다');
    }
    
    if (payload.attackerDead < 0) {
      errors.push('attackerDead는 0 이상이어야 합니다');
    }
    
    if (payload.defenderDead < 0) {
      errors.push('defenderDead는 0 이상이어야 합니다');
    }
    
    if (payload.attackerExp < 0 || payload.defenderExp < 0) {
      errors.push('경험치는 0 이상이어야 합니다');
    }
    
    if (payload.duration < 0) {
      errors.push('duration은 0 이상이어야 합니다');
    }
    
    return {
      valid: errors.length === 0,
      errors,
    };
  }
  
  // ========================================
  // 유틸리티
  // ========================================
  
  /**
   * 지연 함수
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// ========================================
// 팩토리 함수 및 싱글톤
// ========================================

let defaultSubmitter: ResultSubmitter | null = null;

/**
 * 기본 ResultSubmitter 인스턴스 반환
 */
export function getResultSubmitter(baseUrl?: string): ResultSubmitter {
  if (!defaultSubmitter) {
    defaultSubmitter = new ResultSubmitter(baseUrl);
  }
  return defaultSubmitter;
}

/**
 * 새 ResultSubmitter 생성
 */
export function createResultSubmitter(
  baseUrl?: string,
  options?: SubmitOptions
): ResultSubmitter {
  return new ResultSubmitter(baseUrl, options);
}

/**
 * 빠른 결과 제출
 */
export async function submitBattleResult(
  result: VoxelBattleResult,
  options?: SubmitOptions
): Promise<SubmitResult> {
  const submitter = getResultSubmitter();
  return submitter.submitVoxelResult(result, options);
}






