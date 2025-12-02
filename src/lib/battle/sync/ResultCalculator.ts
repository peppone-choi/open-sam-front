/**
 * 결과 계산기 (ResultCalculator)
 * 
 * 전투 결과를 분석하고 피해, 경험치, 승패를 계산합니다.
 * 
 * @module ResultCalculator
 */

import type {
  VoxelBattleResult,
  SquadResult,
  BattleStats,
  VoxelGeneralStats,
} from '../types/BattleTypes';
import type { SquadSnapshot } from './ResultCollector';

// ========================================
// 상수 정의
// ========================================

/** 경험치 계산 상수 */
const EXP_CONFIG = {
  /** 기본 전투 참여 경험치 */
  BASE_PARTICIPATION: 50,
  /** 승리 보너스 */
  VICTORY_BONUS: 100,
  /** 킬당 경험치 */
  PER_KILL: 2,
  /** 분당 전투 시간 경험치 */
  PER_MINUTE: 5,
  /** 치열한 전투 보너스 (총 사상자 1000명 이상) */
  FIERCE_BATTLE_BONUS: 50,
  /** 최대 경험치 */
  MAX_EXPERIENCE: 500,
  /** 패자 경험치 배율 */
  LOSER_MULTIPLIER: 0.5,
} as const;

/** 승패 판정 임계값 */
const VICTORY_CONFIG = {
  /** 전멸 판정 임계값 (생존율) */
  ANNIHILATION_THRESHOLD: 0,
  /** 사기 붕괴 임계값 */
  MORALE_COLLAPSE_THRESHOLD: 10,
  /** 무승부 판정 차이 */
  DRAW_MARGIN: 0.1,
  /** 시간 초과 기본값 (ms) */
  DEFAULT_TIME_LIMIT: 600000,
} as const;

/** 피해 계산 설정 */
const DAMAGE_CONFIG = {
  /** 병사당 기본 HP */
  HP_PER_SOLDIER: 100,
  /** 병력당 변환 비율 (API 병력 → 복셀 유닛) */
  CREW_TO_UNIT_RATIO: 25,
} as const;

// ========================================
// 타입 정의
// ========================================

/** 피해 집계 결과 */
export interface CasualtyReport {
  /** 초기 병력 */
  initialCount: number;
  /** 남은 병력 */
  remainingCount: number;
  /** 사상자 수 */
  casualties: number;
  /** 사상율 (0~1) */
  casualtyRate: number;
  /** 부대별 상세 */
  squadBreakdown: SquadCasualty[];
}

/** 부대별 사상자 */
export interface SquadCasualty {
  squadId: string;
  unitTypeId: number;
  name: string;
  initial: number;
  remaining: number;
  lost: number;
  lossRate: number;
}

/** 경험치 계산 결과 */
export interface ExperienceGain {
  /** 총 경험치 */
  total: number;
  /** 세부 내역 */
  breakdown: {
    participation: number;
    victory: number;
    kills: number;
    battleTime: number;
    fierce: number;
    penalty: number;
  };
}

/** 승패 판정 결과 */
export interface VictoryDetermination {
  /** 승자 */
  winner: 'attacker' | 'defender' | 'draw';
  /** 판정 타입 */
  type: 'annihilation' | 'morale' | 'time' | 'surrender' | 'objective';
  /** 판정 근거 */
  reason: string;
  /** 승패 점수 (0~100, 50이 무승부) */
  score: number;
  /** 결정적 요인 */
  decisiveFactor?: string;
}

/** 전투 영향 결과 */
export interface BattleConsequences {
  /** 장수 업데이트 */
  generalUpdates: GeneralConsequence[];
  /** 도시 업데이트 (공성전) */
  cityUpdate?: CityConsequence;
  /** 아이템 드롭 */
  lootItems?: LootItem[];
}

/** 장수 전투 결과 */
export interface GeneralConsequence {
  generalId: number;
  /** 병력 변화량 (음수) */
  crewChange: number;
  /** 경험치 획득 */
  expGain: number;
  /** 부상 확률 (0~1) */
  injuryChance: number;
  /** 포로 여부 */
  isCaptured: boolean;
  /** 전사 여부 */
  isKilled: boolean;
}

/** 도시 전투 결과 */
export interface CityConsequence {
  cityId: number;
  /** 성벽 피해량 */
  wallDamage: number;
  /** 점령 여부 */
  captured: boolean;
  /** 약탈 자원 */
  plundered?: { gold: number; rice: number };
}

/** 전리품 */
export interface LootItem {
  itemId: number;
  name: string;
  type: 'weapon' | 'armor' | 'horse' | 'special';
  quantity: number;
}

// ========================================
// ResultCalculator 클래스
// ========================================

/**
 * 전투 결과 계산기
 */
export class ResultCalculator {
  // ========================================
  // 피해 계산
  // ========================================
  
  /**
   * 사상자 집계
   */
  static calculateCasualties(
    initialSquads: SquadSnapshot[] | SquadResult[],
    finalSquads: SquadSnapshot[] | SquadResult[]
  ): CasualtyReport {
    const squadBreakdown: SquadCasualty[] = [];
    let totalInitial = 0;
    let totalRemaining = 0;
    
    // 각 부대별 사상자 계산
    initialSquads.forEach((initial: SquadSnapshot | SquadResult) => {
      const squadId = initial.squadId;
      const initialCount = 'initialCount' in initial 
        ? initial.initialCount 
        : initial.originalUnits;
      
      // 최종 상태에서 해당 부대 찾기
      const final = finalSquads.find((s: SquadSnapshot | SquadResult) => {
        return s.squadId === squadId;
      });
      
      const remainingCount = final 
        ? ('currentCount' in final ? final.currentCount : final.survivingUnits)
        : 0;
      
      const lost = initialCount - remainingCount;
      const lossRate = initialCount > 0 ? lost / initialCount : 0;
      
      squadBreakdown.push({
        squadId,
        unitTypeId: 'unitTypeId' in initial ? initial.unitTypeId : 0,
        name: 'name' in initial ? initial.name : squadId,
        initial: initialCount,
        remaining: remainingCount,
        lost,
        lossRate,
      });
      
      totalInitial += initialCount;
      totalRemaining += remainingCount;
    });
    
    const casualties = totalInitial - totalRemaining;
    const casualtyRate = totalInitial > 0 ? casualties / totalInitial : 0;
    
    return {
      initialCount: totalInitial,
      remainingCount: totalRemaining,
      casualties,
      casualtyRate,
      squadBreakdown,
    };
  }
  
  /**
   * API 병력 형식으로 사상자 변환
   */
  static convertToApiCasualties(
    unitCasualties: number,
    crewToUnitRatio: number = DAMAGE_CONFIG.CREW_TO_UNIT_RATIO
  ): number {
    return unitCasualties * crewToUnitRatio;
  }
  
  /**
   * 단순 사상자 수 계산
   */
  static calculateSimpleCasualties(
    initialCount: number,
    remainingCount: number
  ): number {
    return Math.max(0, initialCount - remainingCount);
  }
  
  // ========================================
  // 승패 판정
  // ========================================
  
  /**
   * 승패 판정
   */
  static determineWinner(
    attackerRemaining: number,
    defenderRemaining: number,
    attackerInitial: number,
    defenderInitial: number,
    attackerMorale?: number,
    defenderMorale?: number,
    elapsedTime?: number,
    timeLimit: number = VICTORY_CONFIG.DEFAULT_TIME_LIMIT
  ): VictoryDetermination {
    // 1. 전멸 체크
    if (attackerRemaining <= 0 && defenderRemaining <= 0) {
      return {
        winner: 'draw',
        type: 'annihilation',
        reason: '양측 전멸',
        score: 50,
      };
    }
    
    if (attackerRemaining <= 0) {
      return {
        winner: 'defender',
        type: 'annihilation',
        reason: '공격측 전멸',
        score: 0,
        decisiveFactor: '공격군 병력 전멸',
      };
    }
    
    if (defenderRemaining <= 0) {
      return {
        winner: 'attacker',
        type: 'annihilation',
        reason: '방어측 전멸',
        score: 100,
        decisiveFactor: '방어군 병력 전멸',
      };
    }
    
    // 2. 사기 붕괴 체크
    if (attackerMorale !== undefined && defenderMorale !== undefined) {
      if (attackerMorale < VICTORY_CONFIG.MORALE_COLLAPSE_THRESHOLD) {
        return {
          winner: 'defender',
          type: 'morale',
          reason: '공격측 사기 붕괴',
          score: this.calculateMoraleScore(attackerMorale, defenderMorale),
          decisiveFactor: `공격군 사기 ${attackerMorale.toFixed(0)}% - 전투 의지 상실`,
        };
      }
      
      if (defenderMorale < VICTORY_CONFIG.MORALE_COLLAPSE_THRESHOLD) {
        return {
          winner: 'attacker',
          type: 'morale',
          reason: '방어측 사기 붕괴',
          score: 100 - this.calculateMoraleScore(defenderMorale, attackerMorale),
          decisiveFactor: `방어군 사기 ${defenderMorale.toFixed(0)}% - 전투 의지 상실`,
        };
      }
    }
    
    // 3. 시간 초과 체크
    if (elapsedTime !== undefined && elapsedTime >= timeLimit) {
      return this.determineTimeoutWinner(
        attackerRemaining,
        defenderRemaining,
        attackerInitial,
        defenderInitial
      );
    }
    
    // 4. 전투 진행 중 (아직 승자 미결정)
    const attackerRatio = attackerRemaining / attackerInitial;
    const defenderRatio = defenderRemaining / defenderInitial;
    const score = this.calculateBattleScore(attackerRatio, defenderRatio);
    
    return {
      winner: 'draw',
      type: 'time',
      reason: '전투 진행 중',
      score,
    };
  }
  
  /**
   * 시간 초과 시 승자 결정
   */
  private static determineTimeoutWinner(
    attackerRemaining: number,
    defenderRemaining: number,
    attackerInitial: number,
    defenderInitial: number
  ): VictoryDetermination {
    const attackerRatio = attackerRemaining / attackerInitial;
    const defenderRatio = defenderRemaining / defenderInitial;
    const difference = attackerRatio - defenderRatio;
    
    const score = this.calculateBattleScore(attackerRatio, defenderRatio);
    
    if (Math.abs(difference) < VICTORY_CONFIG.DRAW_MARGIN) {
      return {
        winner: 'draw',
        type: 'time',
        reason: `시간 초과 - 무승부 (공격 ${(attackerRatio * 100).toFixed(0)}% vs 방어 ${(defenderRatio * 100).toFixed(0)}%)`,
        score,
      };
    }
    
    const winner = difference > 0 ? 'attacker' : 'defender';
    const winnerRatio = winner === 'attacker' ? attackerRatio : defenderRatio;
    
    return {
      winner,
      type: 'time',
      reason: `시간 초과 - ${winner === 'attacker' ? '공격' : '방어'}측 우세`,
      score,
      decisiveFactor: `${(winnerRatio * 100).toFixed(0)}% 생존율로 판정승`,
    };
  }
  
  /**
   * 사기 점수 계산
   */
  private static calculateMoraleScore(
    loserMorale: number,
    winnerMorale: number
  ): number {
    // 승자 기준 0~100 점수 (높을수록 승자 우세)
    const moraleDiff = winnerMorale - loserMorale;
    return Math.min(100, Math.max(0, 50 + moraleDiff / 2));
  }
  
  /**
   * 전투 점수 계산 (공격자 기준 0~100)
   */
  private static calculateBattleScore(
    attackerRatio: number,
    defenderRatio: number
  ): number {
    // 양측 생존율 기반 점수 (50이 무승부)
    const difference = attackerRatio - defenderRatio;
    return Math.min(100, Math.max(0, 50 + difference * 50));
  }
  
  // ========================================
  // 경험치 계산
  // ========================================
  
  /**
   * 승자 경험치 계산
   */
  static calculateWinnerExperience(
    result: VoxelBattleResult,
    generalStats?: VoxelGeneralStats
  ): ExperienceGain {
    const breakdown = {
      participation: EXP_CONFIG.BASE_PARTICIPATION,
      victory: EXP_CONFIG.VICTORY_BONUS,
      kills: 0,
      battleTime: 0,
      fierce: 0,
      penalty: 0,
    };
    
    // 킬 보너스 (최대 200)
    const kills = result.stats.totalKills.attacker + result.stats.totalKills.defender;
    const winnerKills = result.winner === 'attacker' 
      ? result.stats.totalKills.attacker 
      : result.stats.totalKills.defender;
    breakdown.kills = Math.min(winnerKills * EXP_CONFIG.PER_KILL, 200);
    
    // 전투 시간 보너스 (최대 10분)
    const battleMinutes = Math.min(10, result.duration / 60000);
    breakdown.battleTime = Math.round(battleMinutes * EXP_CONFIG.PER_MINUTE);
    
    // 치열한 전투 보너스
    const totalCasualties = this.getTotalCasualties(result);
    if (totalCasualties > 1000) {
      breakdown.fierce = EXP_CONFIG.FIERCE_BATTLE_BONUS;
    }
    
    // 지력 보정 (있는 경우)
    let intelligenceBonus = 1;
    if (generalStats) {
      intelligenceBonus = 1 + (generalStats.intelligenceModifier - 1) * 0.2;
    }
    
    const total = Math.min(
      EXP_CONFIG.MAX_EXPERIENCE,
      Math.round(
        (breakdown.participation + breakdown.victory + breakdown.kills + 
         breakdown.battleTime + breakdown.fierce) * intelligenceBonus
      )
    );
    
    return { total, breakdown };
  }
  
  /**
   * 패자 경험치 계산
   */
  static calculateLoserExperience(
    result: VoxelBattleResult,
    generalStats?: VoxelGeneralStats
  ): ExperienceGain {
    const breakdown = {
      participation: EXP_CONFIG.BASE_PARTICIPATION,
      victory: 0,
      kills: 0,
      battleTime: 0,
      fierce: 0,
      penalty: 0,
    };
    
    // 킬 보너스 (승자의 절반)
    const loserKills = result.winner === 'attacker'
      ? result.stats.totalKills.defender
      : result.stats.totalKills.attacker;
    breakdown.kills = Math.min(loserKills * EXP_CONFIG.PER_KILL * EXP_CONFIG.LOSER_MULTIPLIER, 100);
    
    // 전투 시간 보너스 (승자의 절반)
    const battleMinutes = Math.min(10, result.duration / 60000);
    breakdown.battleTime = Math.round(battleMinutes * EXP_CONFIG.PER_MINUTE * EXP_CONFIG.LOSER_MULTIPLIER);
    
    // 패배 페널티 없음 (선전 보상으로 대체)
    
    const total = Math.min(
      EXP_CONFIG.MAX_EXPERIENCE * EXP_CONFIG.LOSER_MULTIPLIER,
      Math.round(breakdown.participation + breakdown.kills + breakdown.battleTime)
    );
    
    return { total, breakdown };
  }
  
  /**
   * 총 사상자 수 계산
   */
  private static getTotalCasualties(result: VoxelBattleResult): number {
    const attackerInitial = result.attackerSquads.reduce(
      (sum, s) => sum + s.originalUnits, 0
    );
    const defenderInitial = result.defenderSquads.reduce(
      (sum, s) => sum + s.originalUnits, 0
    );
    
    return (attackerInitial - result.attackerRemaining) + 
           (defenderInitial - result.defenderRemaining);
  }
  
  // ========================================
  // 전투 영향 계산
  // ========================================
  
  /**
   * 전투 결과에 따른 게임 상태 변경 계산
   */
  static calculateConsequences(
    result: VoxelBattleResult,
    attackerGeneralId: number,
    defenderGeneralId: number,
    isSiegeBattle: boolean = false,
    cityId?: number
  ): BattleConsequences {
    const generalUpdates: GeneralConsequence[] = [];
    
    // 공격자 결과
    const attackerInitial = result.attackerSquads.reduce(
      (sum, s) => sum + s.originalUnits, 0
    );
    const attackerLost = attackerInitial - result.attackerRemaining;
    const attackerWon = result.winner === 'attacker';
    
    generalUpdates.push({
      generalId: attackerGeneralId,
      crewChange: -this.convertToApiCasualties(attackerLost),
      expGain: attackerWon 
        ? this.calculateWinnerExperience(result).total
        : this.calculateLoserExperience(result).total,
      injuryChance: this.calculateInjuryChance(
        attackerLost / attackerInitial,
        !attackerWon
      ),
      isCaptured: !attackerWon && result.attackerRemaining === 0,
      isKilled: false, // 별도 로직
    });
    
    // 방어자 결과
    const defenderInitial = result.defenderSquads.reduce(
      (sum, s) => sum + s.originalUnits, 0
    );
    const defenderLost = defenderInitial - result.defenderRemaining;
    const defenderWon = result.winner === 'defender';
    
    generalUpdates.push({
      generalId: defenderGeneralId,
      crewChange: -this.convertToApiCasualties(defenderLost),
      expGain: defenderWon
        ? this.calculateWinnerExperience(result).total
        : this.calculateLoserExperience(result).total,
      injuryChance: this.calculateInjuryChance(
        defenderLost / defenderInitial,
        !defenderWon
      ),
      isCaptured: !defenderWon && result.defenderRemaining === 0,
      isKilled: false,
    });
    
    const consequences: BattleConsequences = { generalUpdates };
    
    // 공성전 결과
    if (isSiegeBattle && cityId !== undefined) {
      consequences.cityUpdate = this.calculateCityConsequences(
        result,
        cityId,
        attackerWon
      );
    }
    
    return consequences;
  }
  
  /**
   * 부상 확률 계산
   */
  static calculateInjuryChance(
    casualtyRate: number,
    isLoser: boolean
  ): number {
    let chance = casualtyRate * 0.5; // 기본: 사상률의 50%
    
    if (isLoser) {
      chance += 0.1; // 패배 시 +10%
    }
    
    if (casualtyRate > 0.7) {
      chance += 0.2; // 70% 이상 손실 시 +20%
    }
    
    return Math.min(0.8, chance); // 최대 80%
  }
  
  /**
   * 도시 결과 계산
   */
  static calculateCityConsequences(
    result: VoxelBattleResult,
    cityId: number,
    attackerWon: boolean
  ): CityConsequence {
    // 성벽 피해 = 공격측 가한 피해 비례
    const totalDamage = result.stats.totalDamage.attacker;
    const wallDamage = Math.min(100, Math.floor(totalDamage / 100));
    
    return {
      cityId,
      wallDamage: attackerWon ? 100 : wallDamage,
      captured: attackerWon,
      plundered: attackerWon ? {
        gold: Math.floor(Math.random() * 1000) + 500,
        rice: Math.floor(Math.random() * 2000) + 1000,
      } : undefined,
    };
  }
  
  // ========================================
  // 유틸리티
  // ========================================
  
  /**
   * 결과 요약 문자열 생성
   */
  static getSummary(result: VoxelBattleResult): string {
    const winner = result.winner === 'attacker' ? '공격측 승리' :
                   result.winner === 'defender' ? '방어측 승리' : '무승부';
    const duration = Math.floor(result.duration / 1000);
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    
    return [
      `[${winner}]`,
      `전투 시간: ${minutes}분 ${seconds}초`,
      `공격측: ${result.attackerRemaining}명 생존`,
      `방어측: ${result.defenderRemaining}명 생존`,
    ].join(' | ');
  }
  
  /**
   * 결과를 API 결과 코드로 변환
   */
  static winnerToApiResult(winner: 'attacker' | 'defender' | 'draw'): 0 | 1 | 2 {
    switch (winner) {
      case 'attacker': return 1;
      case 'defender': return 2;
      case 'draw': return 0;
    }
  }
}

// ========================================
// 편의 함수
// ========================================

/**
 * 사상자 계산 (단순)
 */
export function calculateCasualties(initial: number, remaining: number): number {
  return ResultCalculator.calculateSimpleCasualties(initial, remaining);
}

/**
 * 승패 판정 (단순)
 */
export function determineWinner(
  attackerRemaining: number,
  defenderRemaining: number,
  attackerMorale?: number,
  defenderMorale?: number
): 'attacker' | 'defender' | 'draw' {
  // 빠른 판정
  if (attackerRemaining <= 0 && defenderRemaining <= 0) return 'draw';
  if (attackerRemaining <= 0) return 'defender';
  if (defenderRemaining <= 0) return 'attacker';
  
  if (attackerMorale !== undefined && defenderMorale !== undefined) {
    if (attackerMorale < VICTORY_CONFIG.MORALE_COLLAPSE_THRESHOLD) return 'defender';
    if (defenderMorale < VICTORY_CONFIG.MORALE_COLLAPSE_THRESHOLD) return 'attacker';
  }
  
  return 'draw';
}

/**
 * 경험치 계산 (단순)
 */
export function calculateExperience(
  kills: number,
  isWinner: boolean,
  durationMs: number
): number {
  let exp: number = EXP_CONFIG.BASE_PARTICIPATION;
  
  if (isWinner) {
    exp += EXP_CONFIG.VICTORY_BONUS;
  }
  
  exp += Math.min(kills * EXP_CONFIG.PER_KILL, 200);
  
  const minutes = Math.min(10, durationMs / 60000);
  exp += Math.round(minutes * EXP_CONFIG.PER_MINUTE);
  
  if (!isWinner) {
    exp = Math.round(exp * EXP_CONFIG.LOSER_MULTIPLIER);
  }
  
  return Math.min(EXP_CONFIG.MAX_EXPERIENCE, exp);
}




