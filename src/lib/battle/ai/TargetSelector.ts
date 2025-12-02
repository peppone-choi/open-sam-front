/**
 * TargetSelector.ts
 * 타겟 우선순위 시스템
 * 
 * 핵심 기능:
 * 1. 거리 점수 (가까울수록 높음)
 * 2. 상성 점수 (유리할수록 높음)
 * 3. 체력 점수 (낮을수록 높음)
 * 4. 위협도 점수 (높을수록 높음)
 * 5. 장수 보너스
 * 6. 종합 점수 계산
 */

import type { TWSquad, Vector2 } from '../TotalWarEngine';

// ========================================
// 상성 테이블
// ========================================

/** 유닛 카테고리 */
export type UnitCategory = 
  | 'sword_infantry'    // 검병
  | 'ji_infantry'       // 극병 (창병)
  | 'spear_guard'       // 창수 (대기병)
  | 'halberd_infantry'  // 극창병
  | 'archer'            // 궁병
  | 'crossbow'          // 노병
  | 'horse_archer'      // 기마궁수
  | 'cavalry'           // 기병
  | 'shock_cavalry'     // 중기병
  | 'chariot'           // 전차
  | 'siege'             // 공성
  | 'strategist';       // 책사

/** 상성 유리 (이 카테고리가 value 카테고리에 강함) */
export const UNIT_COUNTER: Partial<Record<string, string[]>> = {
  // 창병 계열 → 기병에 강함
  ji_infantry: ['cavalry', 'shock_cavalry', 'chariot'],
  spear_guard: ['cavalry', 'shock_cavalry', 'chariot'],
  halberd_infantry: ['cavalry', 'shock_cavalry', 'chariot'],
  
  // 기병 → 원거리, 공성에 강함
  cavalry: ['archer', 'crossbow', 'horse_archer', 'siege', 'strategist'],
  shock_cavalry: ['archer', 'crossbow', 'horse_archer', 'siege', 'strategist'],
  chariot: ['archer', 'crossbow', 'siege'],
  
  // 원거리 → 보병에 강함 (거리 유지 시)
  archer: ['sword_infantry', 'ji_infantry', 'spear_guard', 'halberd_infantry'],
  crossbow: ['sword_infantry', 'ji_infantry', 'spear_guard', 'halberd_infantry', 'cavalry'],
  horse_archer: ['sword_infantry', 'ji_infantry', 'spear_guard'],
  
  // 검병 → 경장 유닛에 강함
  sword_infantry: ['archer', 'crossbow', 'strategist'],
};

/** 상성 불리 (이 카테고리가 value 카테고리에 약함) */
export const UNIT_WEAKNESS: Partial<Record<string, string[]>> = {
  // 기병 → 창병에 약함
  cavalry: ['ji_infantry', 'spear_guard', 'halberd_infantry'],
  shock_cavalry: ['ji_infantry', 'spear_guard', 'halberd_infantry'],
  chariot: ['ji_infantry', 'spear_guard'],
  
  // 원거리 → 기병에 약함 (근접 시)
  archer: ['cavalry', 'shock_cavalry', 'chariot'],
  crossbow: ['cavalry', 'shock_cavalry'],
  horse_archer: ['shock_cavalry'],
  
  // 보병 → 원거리에 약함
  sword_infantry: ['archer', 'crossbow'],
  ji_infantry: ['archer', 'crossbow'],
  spear_guard: ['archer', 'crossbow'],
  
  // 공성/책사 → 거의 모든 유닛에 약함 (근접 시)
  siege: ['cavalry', 'shock_cavalry', 'sword_infantry', 'ji_infantry'],
  strategist: ['cavalry', 'shock_cavalry', 'sword_infantry'],
};

// ========================================
// 타겟 정보 타입
// ========================================

/** 타겟 정보 */
export interface TargetInfo {
  squadId: string;
  totalScore: number;
  
  // 개별 점수
  distanceScore: number;
  typeAdvantageScore: number;
  healthScore: number;
  threatScore: number;
  generalScore: number;
  moraleScore: number;
  
  // 추가 정보
  distance: number;
  isCounter: boolean;       // 상성상 유리
  isCountered: boolean;     // 상성상 불리
  threatLevel: number;      // 위협 수준 (0~100)
  priority: TargetPriority;
}

/** 타겟 우선순위 등급 */
export type TargetPriority = 'critical' | 'high' | 'medium' | 'low' | 'ignore';

/** 가중치 설정 */
export interface TargetPriorityWeights {
  distance: number;       // 거리 가중치
  typeAdvantage: number;  // 상성 가중치
  healthRatio: number;    // 체력 가중치
  threatLevel: number;    // 위협도 가중치
  isGeneral: number;      // 장수 가중치
  morale: number;         // 사기 가중치
}

/** 기본 가중치 */
export const DEFAULT_WEIGHTS: TargetPriorityWeights = {
  distance: 30,
  typeAdvantage: 25,
  healthRatio: 15,
  threatLevel: 15,
  isGeneral: 10,
  morale: 5,
};

// ========================================
// 타겟 선택 옵션
// ========================================

/** 타겟 선택 옵션 */
export interface TargetSelectorOptions {
  /** 최대 탐지 거리 */
  maxDetectionRange: number;
  /** 상성 보너스 배율 */
  counterBonusMultiplier: number;
  /** 상성 페널티 배율 */
  counteredPenaltyMultiplier: number;
  /** 장수 부대 보너스 */
  generalBonus: number;
  /** 낮은 사기 보너스 (마무리 타겟) */
  lowMoraleBonus: number;
  /** 낮은 체력 보너스 (마무리 타겟) */
  lowHealthBonus: number;
  /** 위협도 계산 기준 거리 */
  threatBaseDistance: number;
}

/** 기본 옵션 */
export const DEFAULT_OPTIONS: TargetSelectorOptions = {
  maxDetectionRange: 100,
  counterBonusMultiplier: 1.5,
  counteredPenaltyMultiplier: 0.6,
  generalBonus: 20,
  lowMoraleBonus: 15,
  lowHealthBonus: 10,
  threatBaseDistance: 30,
};

// ========================================
// 타겟 선택기 클래스
// ========================================

export class TargetSelector {
  private weights: TargetPriorityWeights;
  private options: TargetSelectorOptions;
  
  // 캐시
  private targetCache: Map<string, { targets: TargetInfo[]; timestamp: number }> = new Map();
  private cacheLifetime: number = 200; // ms
  
  constructor(
    weights: Partial<TargetPriorityWeights> = {},
    options: Partial<TargetSelectorOptions> = {}
  ) {
    this.weights = { ...DEFAULT_WEIGHTS, ...weights };
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  // ========================================
  // 메인 평가 함수
  // ========================================

  /**
   * 모든 적 부대에 대한 타겟 우선순위 평가
   * @param attacker 공격 부대
   * @param enemies 적 부대 목록
   * @param currentTime 현재 시간 (캐싱용)
   * @returns 우선순위 순으로 정렬된 타겟 정보
   */
  evaluateTargets(
    attacker: TWSquad,
    enemies: TWSquad[],
    currentTime: number
  ): TargetInfo[] {
    // 캐시 체크
    const cached = this.targetCache.get(attacker.id);
    if (cached && currentTime - cached.timestamp < this.cacheLifetime) {
      return cached.targets;
    }
    
    const targets: TargetInfo[] = [];
    
    for (const enemy of enemies) {
      // 제외 조건
      if (enemy.state === 'destroyed' || enemy.state === 'routed') continue;
      if (enemy.aliveSoldiers <= 0) continue;
      
      const distance = this.getDistance(attacker.position, enemy.position);
      if (distance > this.options.maxDetectionRange) continue;
      
      // 타겟 평가
      const targetInfo = this.evaluateTarget(attacker, enemy, distance);
      targets.push(targetInfo);
    }
    
    // 총점 순 정렬
    targets.sort((a, b) => b.totalScore - a.totalScore);
    
    // 캐시 저장
    this.targetCache.set(attacker.id, { targets, timestamp: currentTime });
    
    return targets;
  }

  /**
   * 단일 타겟 평가
   */
  private evaluateTarget(
    attacker: TWSquad,
    target: TWSquad,
    distance: number
  ): TargetInfo {
    // 1. 거리 점수 (가까울수록 높음)
    const distanceScore = this.calculateDistanceScore(distance);
    
    // 2. 상성 점수
    const { score: typeAdvantageScore, isCounter, isCountered } = 
      this.calculateTypeAdvantageScore(attacker.category, target.category);
    
    // 3. 체력 점수 (낮을수록 높음 - 마무리 타겟)
    const healthScore = this.calculateHealthScore(target);
    
    // 4. 위협도 점수
    const { score: threatScore, threatLevel } = 
      this.calculateThreatScore(attacker, target, distance);
    
    // 5. 장수 점수
    const generalScore = this.calculateGeneralScore(target);
    
    // 6. 사기 점수 (낮을수록 높음 - 붕괴 유도)
    const moraleScore = this.calculateMoraleScore(target);
    
    // 가중치 적용 총점 계산
    const totalScore = 
      distanceScore * this.weights.distance +
      typeAdvantageScore * this.weights.typeAdvantage +
      healthScore * this.weights.healthRatio +
      threatScore * this.weights.threatLevel +
      generalScore * this.weights.isGeneral +
      moraleScore * this.weights.morale;
    
    // 우선순위 등급 결정
    const priority = this.determinePriority(totalScore, isCounter, threatLevel);
    
    return {
      squadId: target.id,
      totalScore,
      distanceScore,
      typeAdvantageScore,
      healthScore,
      threatScore,
      generalScore,
      moraleScore,
      distance,
      isCounter,
      isCountered,
      threatLevel,
      priority,
    };
  }

  // ========================================
  // 개별 점수 계산
  // ========================================

  /**
   * 거리 점수 계산 (0~100)
   * 가까울수록 높은 점수
   */
  private calculateDistanceScore(distance: number): number {
    const maxRange = this.options.maxDetectionRange;
    
    if (distance <= 5) return 100;
    if (distance >= maxRange) return 0;
    
    // 비선형 감소 (가까울수록 급격히 증가)
    return 100 * Math.pow(1 - distance / maxRange, 1.5);
  }

  /**
   * 상성 점수 계산 (0~100)
   */
  private calculateTypeAdvantageScore(
    attackerCategory: string,
    targetCategory: string
  ): { score: number; isCounter: boolean; isCountered: boolean } {
    const counters = UNIT_COUNTER[attackerCategory] || [];
    const weaknesses = UNIT_WEAKNESS[attackerCategory] || [];
    
    const isCounter = counters.includes(targetCategory);
    const isCountered = weaknesses.includes(targetCategory);
    
    let score = 50; // 기본 점수
    
    if (isCounter) {
      score = 50 * this.options.counterBonusMultiplier;
    } else if (isCountered) {
      score = 50 * this.options.counteredPenaltyMultiplier;
    }
    
    return { score: Math.min(100, Math.max(0, score)), isCounter, isCountered };
  }

  /**
   * 체력 점수 계산 (0~100)
   * 체력이 낮을수록 높은 점수 (마무리 타겟)
   */
  private calculateHealthScore(target: TWSquad): number {
    const healthRatio = target.aliveSoldiers / Math.max(1, target.soldiers.length);
    
    // 체력이 낮을수록 높은 점수
    let score = (1 - healthRatio) * 100;
    
    // 매우 낮은 체력 보너스
    if (healthRatio < 0.3) {
      score += this.options.lowHealthBonus;
    }
    
    return Math.min(100, score);
  }

  /**
   * 위협도 점수 계산 (0~100)
   * 우리에게 위협적인 적일수록 높은 점수
   */
  private calculateThreatScore(
    attacker: TWSquad,
    target: TWSquad,
    distance: number
  ): { score: number; threatLevel: number } {
    let threatLevel = 50; // 기본 위협도
    
    // 거리 기반 위협 (가까울수록 위협)
    const distanceThreat = Math.max(0, (this.options.threatBaseDistance - distance) / this.options.threatBaseDistance) * 30;
    threatLevel += distanceThreat;
    
    // 병력 비율 위협
    const forceRatio = target.aliveSoldiers / Math.max(1, attacker.aliveSoldiers);
    if (forceRatio > 1.5) threatLevel += 20;
    else if (forceRatio > 1) threatLevel += 10;
    
    // 상성 불리 위협
    const weaknesses = UNIT_WEAKNESS[attacker.category] || [];
    if (weaknesses.includes(target.category)) {
      threatLevel += 15;
    }
    
    // 원거리 유닛 위협 (우리가 보병일 때)
    if (target.isRanged && !attacker.isRanged) {
      threatLevel += 10;
    }
    
    // 기병 위협 (우리가 원거리일 때)
    if (['cavalry', 'shock_cavalry', 'chariot'].includes(target.category) && attacker.isRanged) {
      threatLevel += 20;
    }
    
    // 범위 제한
    threatLevel = Math.max(0, Math.min(100, threatLevel));
    
    // 점수로 변환 (위협적일수록 높은 점수 = 우선 제거)
    const score = threatLevel;
    
    return { score, threatLevel };
  }

  /**
   * 장수 점수 계산 (0~100)
   * 장수 부대는 높은 우선순위
   */
  private calculateGeneralScore(target: TWSquad): number {
    // TODO: 장수 부대 판별 로직 필요
    // 임시로 이름에 '장수' 또는 특정 패턴이 있으면 장수 부대로 판단
    const isGeneralUnit = target.name.includes('장수') || 
                          target.tacticalRole === 'general_bodyguard';
    
    return isGeneralUnit ? this.options.generalBonus + 50 : 0;
  }

  /**
   * 사기 점수 계산 (0~100)
   * 사기가 낮을수록 높은 점수 (붕괴 유도)
   */
  private calculateMoraleScore(target: TWSquad): number {
    const morale = target.morale;
    
    // 사기가 낮을수록 높은 점수
    let score = (100 - morale);
    
    // 매우 낮은 사기 보너스
    if (morale < 40) {
      score += this.options.lowMoraleBonus;
    }
    
    return Math.min(100, score);
  }

  /**
   * 우선순위 등급 결정
   */
  private determinePriority(
    totalScore: number,
    isCounter: boolean,
    threatLevel: number
  ): TargetPriority {
    // 상성상 유리하고 위협적이면 critical
    if (isCounter && threatLevel > 70) return 'critical';
    
    // 높은 총점
    if (totalScore > 7000) return 'critical';
    if (totalScore > 5000) return 'high';
    if (totalScore > 3000) return 'medium';
    if (totalScore > 1000) return 'low';
    
    return 'ignore';
  }

  // ========================================
  // 특수 타겟 선택
  // ========================================

  /**
   * 가장 가까운 타겟 선택
   */
  selectNearestTarget(
    attacker: TWSquad,
    enemies: TWSquad[]
  ): TWSquad | null {
    let nearest: TWSquad | null = null;
    let minDistance = Infinity;
    
    for (const enemy of enemies) {
      if (enemy.state === 'destroyed' || enemy.state === 'routed') continue;
      
      const distance = this.getDistance(attacker.position, enemy.position);
      if (distance < minDistance) {
        minDistance = distance;
        nearest = enemy;
      }
    }
    
    return nearest;
  }

  /**
   * 가장 약한 타겟 선택 (마무리용)
   */
  selectWeakestTarget(
    attacker: TWSquad,
    enemies: TWSquad[],
    maxRange: number = Infinity
  ): TWSquad | null {
    let weakest: TWSquad | null = null;
    let lowestHealth = Infinity;
    
    for (const enemy of enemies) {
      if (enemy.state === 'destroyed' || enemy.state === 'routed') continue;
      
      const distance = this.getDistance(attacker.position, enemy.position);
      if (distance > maxRange) continue;
      
      const healthRatio = enemy.aliveSoldiers / Math.max(1, enemy.soldiers.length);
      if (healthRatio < lowestHealth) {
        lowestHealth = healthRatio;
        weakest = enemy;
      }
    }
    
    return weakest;
  }

  /**
   * 가장 위협적인 타겟 선택
   */
  selectMostThreateningTarget(
    attacker: TWSquad,
    enemies: TWSquad[],
    currentTime: number
  ): TWSquad | null {
    const targets = this.evaluateTargets(attacker, enemies, currentTime);
    
    // 위협도 순으로 정렬
    const byThreat = [...targets].sort((a, b) => b.threatLevel - a.threatLevel);
    
    if (byThreat.length > 0) {
      return enemies.find(e => e.id === byThreat[0].squadId) || null;
    }
    
    return null;
  }

  /**
   * 상성상 유리한 타겟 선택
   */
  selectCounterTarget(
    attacker: TWSquad,
    enemies: TWSquad[],
    currentTime: number
  ): TWSquad | null {
    const targets = this.evaluateTargets(attacker, enemies, currentTime);
    
    // 상성상 유리한 타겟만 필터링
    const counterTargets = targets.filter(t => t.isCounter);
    
    if (counterTargets.length > 0) {
      return enemies.find(e => e.id === counterTargets[0].squadId) || null;
    }
    
    return null;
  }

  /**
   * 측면 공격 타겟 선택
   * 교전 중인 적 중에서 측면이 노출된 타겟
   */
  selectFlankingTarget(
    attacker: TWSquad,
    enemies: TWSquad[]
  ): { target: TWSquad; flankDirection: 'left' | 'right' | 'rear' } | null {
    for (const enemy of enemies) {
      if (enemy.state === 'destroyed' || enemy.state === 'routed') continue;
      if (enemy.state !== 'engaging') continue; // 교전 중인 적만
      
      const distance = this.getDistance(attacker.position, enemy.position);
      if (distance > 40) continue;
      
      // 적의 facing과 우리 위치 비교
      const attackAngle = Math.atan2(
        attacker.position.z - enemy.position.z,
        attacker.position.x - enemy.position.x
      );
      
      let angleDiff = attackAngle - enemy.facing;
      while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
      while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;
      
      // 후방 (±150~180도)
      if (Math.abs(angleDiff) > Math.PI * 5 / 6) {
        return { target: enemy, flankDirection: 'rear' };
      }
      
      // 측면 (±60~120도)
      if (Math.abs(angleDiff) > Math.PI / 3) {
        return { 
          target: enemy, 
          flankDirection: angleDiff > 0 ? 'right' : 'left' 
        };
      }
    }
    
    return null;
  }

  // ========================================
  // 유틸리티
  // ========================================

  /**
   * 거리 계산
   */
  private getDistance(a: Vector2, b: Vector2): number {
    const dx = b.x - a.x;
    const dz = b.z - a.z;
    return Math.sqrt(dx * dx + dz * dz);
  }

  /**
   * 가중치 업데이트
   */
  updateWeights(weights: Partial<TargetPriorityWeights>): void {
    this.weights = { ...this.weights, ...weights };
  }

  /**
   * 옵션 업데이트
   */
  updateOptions(options: Partial<TargetSelectorOptions>): void {
    this.options = { ...this.options, ...options };
  }

  /**
   * 캐시 클리어
   */
  clearCache(): void {
    this.targetCache.clear();
  }

  /**
   * 특정 부대 캐시 무효화
   */
  invalidateCache(squadId: string): void {
    this.targetCache.delete(squadId);
  }

  /**
   * 타겟 평가 결과를 문자열로 출력 (디버그용)
   */
  getTargetReport(targets: TargetInfo[]): string {
    const lines = ['=== 타겟 우선순위 ==='];
    
    for (const target of targets.slice(0, 5)) {
      lines.push(`
[${target.priority.toUpperCase()}] ${target.squadId}
  총점: ${target.totalScore.toFixed(0)}
  거리: ${target.distance.toFixed(1)}m (점수: ${target.distanceScore.toFixed(0)})
  상성: ${target.isCounter ? '유리' : target.isCountered ? '불리' : '중립'} (${target.typeAdvantageScore.toFixed(0)})
  체력: ${target.healthScore.toFixed(0)} | 위협: ${target.threatLevel.toFixed(0)}
`);
    }
    
    return lines.join('\n');
  }
}

// ========================================
// 팩토리 함수
// ========================================

/**
 * 병종별 최적화된 타겟 선택기 생성
 */
export function createTargetSelectorForCategory(category: string): TargetSelector {
  let weights: Partial<TargetPriorityWeights> = {};
  
  // 기병: 상성 유리한 적(원거리) 우선
  if (['cavalry', 'shock_cavalry', 'chariot'].includes(category)) {
    weights = {
      typeAdvantage: 35,
      distance: 20,
      threatLevel: 20,
      healthRatio: 15,
      isGeneral: 5,
      morale: 5,
    };
  }
  
  // 원거리: 가까운 위협 제거 우선
  else if (['archer', 'crossbow', 'horse_archer'].includes(category)) {
    weights = {
      threatLevel: 30,
      distance: 30,
      typeAdvantage: 20,
      healthRatio: 10,
      isGeneral: 5,
      morale: 5,
    };
  }
  
  // 창병: 기병 우선 타겟팅
  else if (['ji_infantry', 'spear_guard', 'halberd_infantry'].includes(category)) {
    weights = {
      typeAdvantage: 40,
      distance: 25,
      threatLevel: 15,
      healthRatio: 10,
      isGeneral: 5,
      morale: 5,
    };
  }
  
  // 기본 보병
  else {
    weights = { ...DEFAULT_WEIGHTS };
  }
  
  return new TargetSelector(weights);
}

// ========================================
// Export
// ========================================

export default TargetSelector;





