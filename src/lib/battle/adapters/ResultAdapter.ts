/**
 * 결과 어댑터
 * 
 * 복셀 전투 결과를 API 포맷으로 역변환합니다.
 * 전투 결과를 게임 서버에 전송할 수 있는 형태로 변환합니다.
 * 
 * @module ResultAdapter
 */

import type {
  VoxelBattleResult,
  ApiBattleResult,
  SquadResult,
  BattleEvent,
  BattleEventType,
} from '../types/BattleTypes';
import { calculateCrewFromUnits, getUnitCategoryById } from './UnitAdapter';

// ========================================
// 상수 정의
// ========================================

/** 기본 경험치 (전투 참여) */
const BASE_EXPERIENCE = 50;

/** 승리 보너스 경험치 */
const VICTORY_BONUS_EXP = 100;

/** 킬당 추가 경험치 */
const KILL_BONUS_EXP = 2;

/** 전투 시간 보너스 (분당) */
const TIME_BONUS_EXP = 5;

/** 최대 경험치 */
const MAX_EXPERIENCE = 500;

// ========================================
// 결과 변환
// ========================================

/**
 * 복셀 전투 결과를 API 결과로 변환
 */
export function convertVoxelResultToApi(result: VoxelBattleResult): ApiBattleResult {
  // 승자 결정 (0: 무승부, 1: 공격자 승, 2: 방어자 승)
  const apiResult = convertWinnerToApiResult(result.winner);
  
  // 사상자 계산
  const attackerDead = calculateCasualties(
    result.attackerSquads,
    getInitialCrewCount(result.attackerSquads)
  );
  const defenderDead = calculateCasualties(
    result.defenderSquads,
    getInitialCrewCount(result.defenderSquads)
  );
  
  // 남은 병력 계산
  const attackerRemaining = result.attackerRemaining;
  const defenderRemaining = result.defenderRemaining;
  
  // 경험치 계산
  const exp = calculateExperience(result);
  
  // 전투 시간 (ms → 초)
  const battleTime = Math.round(result.duration / 1000);
  
  // 전투 로그 생성
  const logs = generateBattleLog(result.events);
  
  return {
    battleId: result.battleId,
    result: apiResult,
    attackerDead,
    defenderDead,
    attackerRemaining,
    defenderRemaining,
    exp,
    battleTime,
    logs,
  };
}

/**
 * 승자를 API 결과 코드로 변환
 */
export function convertWinnerToApiResult(
  winner: 'attacker' | 'defender' | 'draw'
): 0 | 1 | 2 {
  switch (winner) {
    case 'attacker': return 1;
    case 'defender': return 2;
    case 'draw': return 0;
    default: return 0;
  }
}

/**
 * API 결과 코드를 승자로 변환 (역변환)
 */
export function convertApiResultToWinner(
  result: 0 | 1 | 2
): 'attacker' | 'defender' | 'draw' {
  switch (result) {
    case 1: return 'attacker';
    case 2: return 'defender';
    case 0: return 'draw';
    default: return 'draw';
  }
}

// ========================================
// 사상자 계산
// ========================================

/**
 * 부대 결과에서 사상자 수 계산
 */
export function calculateCasualties(
  squads: SquadResult[],
  initialTotal: number
): number {
  const remaining = squads.reduce((sum, squad) => {
    const category = getUnitCategoryById(squad.unitTypeId);
    return sum + calculateCrewFromUnits(squad.survivingUnits, category);
  }, 0);
  
  return Math.max(0, initialTotal - remaining);
}

/**
 * 초기 총 병력 수 계산
 */
function getInitialCrewCount(squads: SquadResult[]): number {
  return squads.reduce((sum, squad) => {
    const category = getUnitCategoryById(squad.unitTypeId);
    return sum + calculateCrewFromUnits(squad.originalUnits, category);
  }, 0);
}

/**
 * 단일 부대의 사상자 계산
 */
export function calculateSquadCasualties(
  initial: number,
  remaining: number
): number {
  return Math.max(0, initial - remaining);
}

/**
 * 사상자 비율 계산 (0~1)
 */
export function calculateCasualtyRate(
  initial: number,
  remaining: number
): number {
  if (initial <= 0) return 0;
  return Math.min(1, Math.max(0, (initial - remaining) / initial));
}

// ========================================
// 경험치 계산
// ========================================

/**
 * 전투 결과에서 경험치 계산
 */
export function calculateExperience(result: VoxelBattleResult): number {
  let exp = BASE_EXPERIENCE;
  
  // 승리 보너스
  if (result.winner === 'attacker') {
    exp += VICTORY_BONUS_EXP;
  }
  
  // 킬 보너스
  const totalKills = result.stats.totalKills.attacker;
  exp += Math.min(totalKills * KILL_BONUS_EXP, 200);
  
  // 전투 시간 보너스 (최대 10분)
  const battleMinutes = Math.min(10, result.duration / 60000);
  exp += Math.round(battleMinutes * TIME_BONUS_EXP);
  
  // 치열한 전투 보너스 (양측 사상자가 많은 경우)
  const attackerCasualties = getInitialCrewCount(result.attackerSquads) - result.attackerRemaining;
  const defenderCasualties = getInitialCrewCount(result.defenderSquads) - result.defenderRemaining;
  const totalCasualties = attackerCasualties + defenderCasualties;
  if (totalCasualties > 1000) {
    exp += 50;
  }
  
  return Math.min(MAX_EXPERIENCE, exp);
}

/**
 * 패자 측 경험치 계산
 */
export function calculateLoserExperience(result: VoxelBattleResult): number {
  // 패자도 기본 경험치와 전투 시간 보너스는 받음
  let exp = BASE_EXPERIENCE;
  
  // 전투 시간 보너스
  const battleMinutes = Math.min(10, result.duration / 60000);
  exp += Math.round(battleMinutes * TIME_BONUS_EXP * 0.5);
  
  // 선전 보너스 (상대에게 많은 피해를 입힌 경우)
  const kills = result.winner === 'attacker' 
    ? result.stats.totalKills.defender 
    : result.stats.totalKills.attacker;
  exp += Math.min(kills * KILL_BONUS_EXP * 0.5, 50);
  
  return Math.min(MAX_EXPERIENCE / 2, exp);
}

// ========================================
// 전투 로그 생성
// ========================================

/**
 * 전투 이벤트에서 로그 문자열 배열 생성
 */
export function generateBattleLog(events: BattleEvent[]): string[] {
  const logs: string[] = [];
  
  events.forEach(event => {
    const logEntry = eventToLogEntry(event);
    if (logEntry) {
      logs.push(logEntry);
    }
  });
  
  return logs;
}

/**
 * 단일 이벤트를 로그 문자열로 변환
 */
function eventToLogEntry(event: BattleEvent): string | null {
  const time = formatTime(event.timestamp);
  const data = event.data;
  
  switch (event.type) {
    case 'battle_started':
      return `[${time}] 전투가 시작되었습니다.`;
      
    case 'unit_killed':
      return `[${time}] ${data.squadName || '부대'}에서 ${data.count || 1}명이 전사했습니다.`;
      
    case 'squad_routed':
      return `[${time}] ${data.squadName || '부대'}가 붕괴되어 도주합니다!`;
      
    case 'squad_rallied':
      return `[${time}] ${data.squadName || '부대'}가 재집결했습니다.`;
      
    case 'charge_started':
      return `[${time}] ${data.squadName || '부대'}가 돌격을 시작합니다!`;
      
    case 'charge_impact':
      return `[${time}] 돌격이 적에게 ${data.damage || 0}의 피해를 입혔습니다.`;
      
    case 'flank_attack':
      return `[${time}] 측면 공격! ${data.bonus || 0}% 추가 피해.`;
      
    case 'rear_attack':
      return `[${time}] 후방 공격! ${data.bonus || 0}% 추가 피해.`;
      
    case 'ability_used':
      return `[${time}] ${data.generalName || '장수'}이(가) ${data.abilityName || '특기'}를 사용했습니다.`;
      
    case 'morale_broken':
      return `[${time}] ${data.squadName || '부대'}의 사기가 붕괴되었습니다!`;
      
    case 'battle_ended':
      const winner = data.winner === 'attacker' ? '공격측' : 
                     data.winner === 'defender' ? '방어측' : '무승부';
      return `[${time}] 전투 종료! ${winner} 승리.`;
      
    default:
      return null;
  }
}

/**
 * 밀리초를 시간 문자열로 변환 (mm:ss)
 */
function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

// ========================================
// 상세 결과 분석
// ========================================

/** 전투 결과 분석 */
export interface BattleAnalysis {
  /** 총 전투 시간 (초) */
  duration: number;
  /** 승자 */
  winner: 'attacker' | 'defender' | 'draw';
  /** 공격측 분석 */
  attackerAnalysis: SideAnalysis;
  /** 방어측 분석 */
  defenderAnalysis: SideAnalysis;
  /** 주요 이벤트 */
  keyEvents: string[];
  /** MVP 부대 */
  mvpSquad?: string;
}

/** 측면 분석 */
export interface SideAnalysis {
  /** 초기 병력 */
  initialCrew: number;
  /** 최종 병력 */
  finalCrew: number;
  /** 사상자 */
  casualties: number;
  /** 사상자 비율 */
  casualtyRate: number;
  /** 총 킬 수 */
  totalKills: number;
  /** 총 피해량 */
  totalDamage: number;
  /** 돌격 횟수 */
  chargeCount: number;
  /** 붕괴 횟수 */
  routCount: number;
}

/**
 * 전투 결과 상세 분석
 */
export function analyzeBattleResult(result: VoxelBattleResult): BattleAnalysis {
  const attackerInitial = getInitialCrewCount(result.attackerSquads);
  const defenderInitial = getInitialCrewCount(result.defenderSquads);
  
  const attackerCasualties = attackerInitial - result.attackerRemaining;
  const defenderCasualties = defenderInitial - result.defenderRemaining;
  
  // 주요 이벤트 추출
  const keyEvents = extractKeyEvents(result.events);
  
  // MVP 부대 찾기
  const mvpSquad = findMvpSquad(result.attackerSquads, result.defenderSquads);
  
  return {
    duration: Math.round(result.duration / 1000),
    winner: result.winner,
    attackerAnalysis: {
      initialCrew: attackerInitial,
      finalCrew: result.attackerRemaining,
      casualties: attackerCasualties,
      casualtyRate: calculateCasualtyRate(attackerInitial, result.attackerRemaining),
      totalKills: result.stats.totalKills.attacker,
      totalDamage: result.stats.totalDamage.attacker,
      chargeCount: result.stats.chargeCount.attacker,
      routCount: result.stats.routCount.attacker,
    },
    defenderAnalysis: {
      initialCrew: defenderInitial,
      finalCrew: result.defenderRemaining,
      casualties: defenderCasualties,
      casualtyRate: calculateCasualtyRate(defenderInitial, result.defenderRemaining),
      totalKills: result.stats.totalKills.defender,
      totalDamage: result.stats.totalDamage.defender,
      chargeCount: result.stats.chargeCount.defender,
      routCount: result.stats.routCount.defender,
    },
    keyEvents,
    mvpSquad,
  };
}

/**
 * 주요 이벤트 추출
 */
function extractKeyEvents(events: BattleEvent[]): string[] {
  const keyTypes: BattleEventType[] = [
    'charge_impact',
    'flank_attack',
    'rear_attack',
    'squad_routed',
    'ability_used',
  ];
  
  return events
    .filter(e => keyTypes.includes(e.type))
    .slice(0, 10) // 최대 10개
    .map(e => eventToLogEntry(e))
    .filter((s): s is string => s !== null);
}

/**
 * MVP 부대 찾기 (킬 수 기준)
 */
function findMvpSquad(
  attackerSquads: SquadResult[],
  defenderSquads: SquadResult[]
): string | undefined {
  const allSquads = [...attackerSquads, ...defenderSquads];
  if (allSquads.length === 0) return undefined;
  
  const mvp = allSquads.reduce((best, current) => 
    current.kills > best.kills ? current : best
  );
  
  return mvp.kills > 0 ? mvp.squadId : undefined;
}

// ========================================
// 결과 요약
// ========================================

/**
 * 전투 결과 요약 문자열 생성 (UI용)
 */
export function getBattleResultSummary(result: VoxelBattleResult): string {
  const analysis = analyzeBattleResult(result);
  const winnerText = result.winner === 'attacker' ? '공격측 승리' :
                     result.winner === 'defender' ? '방어측 승리' : '무승부';
  
  return [
    `[${winnerText}] 전투 시간: ${Math.floor(analysis.duration / 60)}분 ${analysis.duration % 60}초`,
    `공격측: ${analysis.attackerAnalysis.finalCrew}명 생존 (${analysis.attackerAnalysis.casualties}명 전사, ${Math.round(analysis.attackerAnalysis.casualtyRate * 100)}%)`,
    `방어측: ${analysis.defenderAnalysis.finalCrew}명 생존 (${analysis.defenderAnalysis.casualties}명 전사, ${Math.round(analysis.defenderAnalysis.casualtyRate * 100)}%)`,
  ].join('\n');
}

/**
 * 짧은 결과 문자열 생성 (알림용)
 */
export function getBattleResultShort(result: VoxelBattleResult): string {
  const winner = result.winner === 'attacker' ? '승리' :
                 result.winner === 'defender' ? '패배' : '무승부';
  return `${winner}! 생존: ${result.attackerRemaining}명`;
}

// ========================================
// 검증
// ========================================

/**
 * 결과 데이터 유효성 검증
 */
export function validateBattleResult(result: VoxelBattleResult): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  if (!result.battleId) {
    errors.push('battleId가 필요합니다');
  }
  
  if (!['attacker', 'defender', 'draw'].includes(result.winner)) {
    errors.push('유효하지 않은 winner 값입니다');
  }
  
  if (result.duration < 0) {
    errors.push('duration은 0 이상이어야 합니다');
  }
  
  if (result.attackerRemaining < 0) {
    errors.push('attackerRemaining은 0 이상이어야 합니다');
  }
  
  if (result.defenderRemaining < 0) {
    errors.push('defenderRemaining은 0 이상이어야 합니다');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}





