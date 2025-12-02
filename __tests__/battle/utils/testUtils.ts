/**
 * 전투 테스트 유틸리티 함수
 */

import type {
  ApiBattleData,
  VoxelBattleResult,
  VoxelBattleInit,
  VoxelForce,
  VoxelSquad,
} from '@/lib/battle/types/BattleTypes';

/**
 * 비동기 대기 유틸리티
 */
export function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 전투 결과 검증 유틸리티
 */
export function validateBattleResult(result: VoxelBattleResult): string[] {
  const errors: string[] = [];

  if (!result.battleId) {
    errors.push('battleId가 없습니다');
  }

  if (!['attacker', 'defender', 'draw'].includes(result.winner)) {
    errors.push(`유효하지 않은 winner: ${result.winner}`);
  }

  if (result.duration < 0) {
    errors.push(`duration은 0 이상이어야 합니다: ${result.duration}`);
  }

  if (result.attackerRemaining < 0) {
    errors.push(`attackerRemaining은 0 이상이어야 합니다: ${result.attackerRemaining}`);
  }

  if (result.defenderRemaining < 0) {
    errors.push(`defenderRemaining은 0 이상이어야 합니다: ${result.defenderRemaining}`);
  }

  if (!Array.isArray(result.attackerSquads)) {
    errors.push('attackerSquads는 배열이어야 합니다');
  }

  if (!Array.isArray(result.defenderSquads)) {
    errors.push('defenderSquads는 배열이어야 합니다');
  }

  return errors;
}

/**
 * 복셀 초기화 데이터 검증
 */
export function validateVoxelBattleInit(init: VoxelBattleInit): string[] {
  const errors: string[] = [];

  if (!init.battleId) {
    errors.push('battleId가 없습니다');
  }

  if (!init.attacker) {
    errors.push('attacker가 없습니다');
  } else {
    errors.push(...validateVoxelForce(init.attacker, '공격측'));
  }

  if (!init.defender) {
    errors.push('defender가 없습니다');
  } else {
    errors.push(...validateVoxelForce(init.defender, '방어측'));
  }

  if (!init.terrain) {
    errors.push('terrain이 없습니다');
  }

  return errors;
}

/**
 * 복셀 군대 검증
 */
export function validateVoxelForce(force: VoxelForce, prefix: string): string[] {
  const errors: string[] = [];

  if (!force.teamId) {
    errors.push(`${prefix}: teamId가 없습니다`);
  }

  if (!force.factionName) {
    errors.push(`${prefix}: factionName이 없습니다`);
  }

  if (!force.colors || !force.colors.primary || !force.colors.secondary) {
    errors.push(`${prefix}: colors가 유효하지 않습니다`);
  }

  if (!force.generalStats) {
    errors.push(`${prefix}: generalStats가 없습니다`);
  }

  if (!Array.isArray(force.squads) || force.squads.length === 0) {
    errors.push(`${prefix}: squads가 없거나 비어 있습니다`);
  } else {
    force.squads.forEach((squad, index) => {
      errors.push(...validateVoxelSquad(squad, `${prefix} 부대 ${index}`));
    });
  }

  return errors;
}

/**
 * 복셀 부대 검증
 */
export function validateVoxelSquad(squad: VoxelSquad, prefix: string): string[] {
  const errors: string[] = [];

  if (!squad.squadId) {
    errors.push(`${prefix}: squadId가 없습니다`);
  }

  if (!squad.name) {
    errors.push(`${prefix}: name이 없습니다`);
  }

  if (squad.unitCount <= 0) {
    errors.push(`${prefix}: unitCount는 0보다 커야 합니다`);
  }

  if (squad.morale < 0 || squad.morale > 100) {
    errors.push(`${prefix}: morale은 0~100 사이여야 합니다: ${squad.morale}`);
  }

  if (!squad.baseStats) {
    errors.push(`${prefix}: baseStats가 없습니다`);
  }

  return errors;
}

/**
 * 사상자 비율 계산
 */
export function calculateCasualtyRate(initial: number, remaining: number): number {
  if (initial <= 0) return 0;
  return (initial - remaining) / initial;
}

/**
 * 경험치 범위 검증
 */
export function isValidExperience(exp: number): boolean {
  return exp >= 0 && exp <= 500 && Number.isInteger(exp);
}

/**
 * 유닛 ID 범위 검증
 */
export function isValidUnitId(unitId: number): boolean {
  // 성벽
  if (unitId === 1000) return true;
  // 보병
  if (unitId >= 1100 && unitId <= 1128) return true;
  // 궁병
  if (unitId >= 1200 && unitId <= 1215) return true;
  // 기병
  if (unitId >= 1300 && unitId <= 1322) return true;
  // 귀병
  if (unitId >= 1400 && unitId <= 1424) return true;
  // 지역병
  if (unitId >= 1450 && unitId <= 1472) return true;
  // 공성
  if (unitId >= 1500 && unitId <= 1511) return true;
  
  return false;
}

/**
 * 테스트 타이머 래퍼
 */
export class TestTimer {
  private startTime: number = 0;
  private endTime: number = 0;

  start(): void {
    this.startTime = performance.now();
  }

  stop(): number {
    this.endTime = performance.now();
    return this.elapsed;
  }

  get elapsed(): number {
    return this.endTime - this.startTime;
  }
}

/**
 * 랜덤 시드 기반 테스트 데이터 생성기
 */
export class SeededRandom {
  private seed: number;

  constructor(seed: number = 12345) {
    this.seed = seed;
  }

  next(): number {
    const x = Math.sin(this.seed++) * 10000;
    return x - Math.floor(x);
  }

  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  nextBool(): boolean {
    return this.next() > 0.5;
  }
}

/**
 * 메모리 사용량 측정 (대략적)
 */
export function getApproximateMemoryUsage(): number {
  if (typeof performance !== 'undefined' && (performance as any).memory) {
    return (performance as any).memory.usedJSHeapSize;
  }
  return 0;
}

/**
 * 딥 비교 유틸리티
 */
export function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  
  if (typeof a !== typeof b) return false;
  
  if (typeof a !== 'object' || a === null || b === null) return false;
  
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  
  if (Array.isArray(a)) {
    if (a.length !== (b as unknown[]).length) return false;
    return a.every((item, index) => deepEqual(item, (b as unknown[])[index]));
  }
  
  const keysA = Object.keys(a);
  const keysB = Object.keys(b as object);
  
  if (keysA.length !== keysB.length) return false;
  
  return keysA.every(key => 
    deepEqual((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key])
  );
}





