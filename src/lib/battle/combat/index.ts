/**
 * Combat System Module
 * 토탈워 스타일 전투 계산 시스템
 * 
 * 주요 기능:
 * - 데미지 계산 (물리/관통/크리티컬)
 * - 명중률/회피율 계산
 * - 크리티컬 시스템
 * - 버프/디버프 시스템
 * - 측면/후방 공격 보너스
 * - 유닛 상성 시스템
 */

export {
  // 메인 계산기
  CombatCalculator,
  
  // 타입
  type CombatContext,
  type DamageResult,
  type DamageType,
  type BonusDamageBreakdown,
  type DamageBreakdown,
  type HitResult,
  type HitBreakdown,
  type CriticalResult,
  type CriticalType,
  
  // 버프 시스템
  type BuffType,
  type Buff,
  BUFF_TEMPLATES,
  
  // 유틸리티 함수
  getDistance,
  calculateAttackAngle,
} from './CombatCalculator';






