/**
 * 전투 데이터 어댑터 타입 정의
 * 
 * API 데이터와 복셀 엔진 데이터 간의 변환을 위한 타입들을 정의합니다.
 * 
 * @module BattleTypes
 */

import type { VoxelUnitSpec } from '@/components/battle/units/db/VoxelUnitDefinitions';
import type { VoxelCategory, AttackType } from '../CrewTypeVoxelMapping';

// ========================================
// API 데이터 타입 (게임 서버 → 어댑터)
// ========================================

/** API 전투 데이터 */
export interface ApiBattleData {
  /** 전투 고유 ID */
  battleId: string;
  /** 공격측 정보 */
  attacker: ApiSide;
  /** 방어측 정보 */
  defender: ApiSide;
  /** 전투 위치 (도시 ID) */
  cityId?: number;
  /** 계절 (1: 봄, 2: 여름, 3: 가을, 4: 겨울) */
  season?: number;
  /** 전투 타입 */
  battleType?: ApiBattleType;
}

/** 전투 타입 */
export type ApiBattleType = 'field' | 'siege' | 'ambush' | 'naval';

/** API 전투 측면 (공격/방어) */
export interface ApiSide {
  /** 장수 정보 */
  general: ApiGeneral;
  /** 병종 ID (units.json ID) */
  crewType: number;
  /** 병력 수 */
  crew: number;
  /** 사기 (0~100) */
  morale?: number;
  /** 훈련도 (0~100) */
  train?: number;
  /** 국가 ID */
  nationId?: number;
  /** 국가 색상 */
  nationColor?: string;
}

/** API 장수 정보 */
export interface ApiGeneral {
  /** 장수 ID */
  no: number;
  /** 장수 이름 */
  name: string;
  /** 통솔력 (1~100) */
  leadership: number;
  /** 무력 (1~100) */
  strength: number;
  /** 지력 (1~100) */
  intel: number;
  /** 정치력 (1~100) */
  politics?: number;
  /** 매력 (1~100) */
  charm?: number;
  /** 특기 ID */
  specialId?: number;
  /** 특기 이름 */
  specialName?: string;
  /** 무기 정보 */
  weapon?: ApiItem;
  /** 방어구 정보 */
  armor?: ApiItem;
  /** 기마 정보 */
  horse?: ApiItem;
  /** 장수 레벨 */
  level?: number;
  /** 경험치 */
  experience?: number;
}

/** API 아이템 정보 */
export interface ApiItem {
  /** 아이템 ID */
  id: number;
  /** 아이템 이름 */
  name: string;
  /** 아이템 등급 (0~5) */
  grade?: number;
  /** 능력치 보정 */
  bonus?: number;
}

// ========================================
// 복셀 엔진 데이터 타입 (어댑터 → 복셀 엔진)
// ========================================

/** 복셀 전투 초기화 데이터 */
export interface VoxelBattleInit {
  /** 전투 ID */
  battleId: string;
  /** 공격측 군대 */
  attacker: VoxelForce;
  /** 방어측 군대 */
  defender: VoxelForce;
  /** 지형 설정 */
  terrain: TerrainConfig;
  /** 날씨 */
  weather: WeatherType;
  /** 시간대 */
  timeOfDay?: TimeOfDay;
}

/** 복셀 군대 정보 */
export interface VoxelForce {
  /** 팀 ID */
  teamId: 'attacker' | 'defender';
  /** 세력 이름 */
  factionName: string;
  /** 세력 색상 */
  colors: {
    primary: string;
    secondary: string;
  };
  /** 장수 스탯 */
  generalStats: VoxelGeneralStats;
  /** 부대 목록 */
  squads: VoxelSquad[];
}

/** 복셀 장수 스탯 */
export interface VoxelGeneralStats {
  /** 장수 ID */
  generalId: number;
  /** 장수 이름 */
  name: string;
  /** 통솔력 보정 (부대 사기/이동속도 영향) */
  leadershipModifier: number;
  /** 무력 보정 (공격력/방어력 영향) */
  strengthModifier: number;
  /** 지력 보정 (특수능력 쿨다운/효과 영향) */
  intelligenceModifier: number;
  /** 특기 ID */
  specialSkillId?: number;
  /** 특기 이름 */
  specialSkillName?: string;
  /** 아이템 보정 */
  itemBonuses: ItemBonuses;
}

/** 아이템 보정치 */
export interface ItemBonuses {
  /** 공격력 보정 (%) */
  attackBonus: number;
  /** 방어력 보정 (%) */
  defenseBonus: number;
  /** 이동속도 보정 (%) */
  speedBonus: number;
  /** 기마 여부 */
  isMounted: boolean;
  /** 기마 등급 (0~5) */
  mountGrade?: number;
}

/** 복셀 부대 정보 */
export interface VoxelSquad {
  /** 부대 ID */
  squadId: string;
  /** 부대 이름 */
  name: string;
  /** 유닛 타입 ID (VoxelUnitDefinitions) */
  unitTypeId: number;
  /** 유닛 스펙 */
  unitSpec: VoxelUnitSpec;
  /** 유닛 카테고리 */
  category: VoxelCategory;
  /** 공격 타입 */
  attackType: AttackType;
  /** 유닛 수 */
  unitCount: number;
  /** 원래 병력 수 (API 기준) */
  originalCrewCount: number;
  /** 기본 스탯 */
  baseStats: UnitStats;
  /** 사기 (0~100) */
  morale: number;
  /** 경험치 레벨 (0~9) */
  experienceLevel: number;
}

/** 유닛 기본 스탯 */
export interface UnitStats {
  /** 공격력 */
  attack: number;
  /** 방어력 */
  defense: number;
  /** 이동속도 */
  speed: number;
  /** 사거리 (근접 = 1) */
  range: number;
  /** 돌격 보너스 */
  chargeBonus: number;
  /** 대기병 보너스 */
  antiCavalryBonus: number;
}

// ========================================
// 지형 및 환경 타입
// ========================================

/** 지형 설정 */
export interface TerrainConfig {
  /** 지형 타입 */
  type: TerrainType;
  /** 맵 크기 */
  mapSize: { width: number; height: number };
  /** 특수 지형 요소 */
  features?: TerrainFeature[];
  /** 지형 시드 (맵 생성용) */
  seed?: number;
}

/** 지형 타입 */
export type TerrainType = 
  | 'plains'      // 평원
  | 'forest'      // 숲
  | 'hills'       // 구릉
  | 'mountain'    // 산악
  | 'river'       // 강
  | 'swamp'       // 습지
  | 'desert'      // 사막
  | 'snow'        // 설원
  | 'city'        // 도시 (공성전)
  | 'naval';      // 해상

/** 지형 특징 */
export interface TerrainFeature {
  type: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  rotation?: number;
}

/** 날씨 타입 */
export type WeatherType = 
  | 'clear'       // 맑음
  | 'cloudy'      // 흐림
  | 'rain'        // 비
  | 'heavy_rain'  // 폭우
  | 'fog'         // 안개
  | 'snow'        // 눈
  | 'wind';       // 강풍

/** 시간대 */
export type TimeOfDay = 'dawn' | 'morning' | 'noon' | 'evening' | 'night';

// ========================================
// 전투 결과 타입
// ========================================

/** 복셀 전투 결과 (엔진 → 어댑터) */
export interface VoxelBattleResult {
  /** 전투 ID */
  battleId: string;
  /** 승자 */
  winner: 'attacker' | 'defender' | 'draw';
  /** 전투 시간 (ms) */
  duration: number;
  /** 공격측 생존 병력 */
  attackerRemaining: number;
  /** 방어측 생존 병력 */
  defenderRemaining: number;
  /** 공격측 부대 결과 */
  attackerSquads: SquadResult[];
  /** 방어측 부대 결과 */
  defenderSquads: SquadResult[];
  /** 전투 이벤트 목록 */
  events: BattleEvent[];
  /** 통계 */
  stats: BattleStats;
}

/** 부대 결과 */
export interface SquadResult {
  /** 부대 ID */
  squadId: string;
  /** 유닛 타입 ID */
  unitTypeId: number;
  /** 생존 유닛 수 */
  survivingUnits: number;
  /** 원래 유닛 수 */
  originalUnits: number;
  /** 처치 수 */
  kills: number;
  /** 최종 사기 */
  finalMorale: number;
  /** 상태 */
  status: 'active' | 'routed' | 'destroyed';
}

/** 전투 통계 */
export interface BattleStats {
  /** 총 처치 수 */
  totalKills: { attacker: number; defender: number };
  /** 총 피해량 */
  totalDamage: { attacker: number; defender: number };
  /** 돌격 횟수 */
  chargeCount: { attacker: number; defender: number };
  /** 붕괴 횟수 */
  routCount: { attacker: number; defender: number };
}

/** 전투 이벤트 */
export interface BattleEvent {
  /** 이벤트 타입 */
  type: BattleEventType;
  /** 발생 시간 (ms) */
  timestamp: number;
  /** 이벤트 데이터 */
  data: Record<string, unknown>;
}

/** 전투 이벤트 타입 */
export type BattleEventType = 
  | 'battle_started'      // 전투 시작
  | 'unit_killed'         // 유닛 사망
  | 'squad_routed'        // 부대 붕괴
  | 'squad_rallied'       // 부대 재집결
  | 'charge_started'      // 돌격 시작
  | 'charge_impact'       // 돌격 충돌
  | 'flank_attack'        // 측면 공격
  | 'rear_attack'         // 후방 공격
  | 'ability_used'        // 특수능력 사용
  | 'morale_broken'       // 사기 붕괴
  | 'battle_ended';       // 전투 종료

// ========================================
// API 결과 타입 (어댑터 → 게임 서버)
// ========================================

/** API 전투 결과 */
export interface ApiBattleResult {
  /** 전투 ID */
  battleId: string;
  /** 결과 (0: 무승부, 1: 공격자 승, 2: 방어자 승) */
  result: 0 | 1 | 2;
  /** 공격측 사망자 */
  attackerDead: number;
  /** 방어측 사망자 */
  defenderDead: number;
  /** 공격측 남은 병력 */
  attackerRemaining: number;
  /** 방어측 남은 병력 */
  defenderRemaining: number;
  /** 획득 경험치 */
  exp: number;
  /** 전투 시간 (초) */
  battleTime: number;
  /** 전투 로그 */
  logs: string[];
}

// ========================================
// 특기 관련 타입
// ========================================

/** 특기 효과 */
export interface SpecialSkillEffect {
  /** 특기 ID */
  skillId: number;
  /** 특기 이름 */
  skillName: string;
  /** 효과 타입 */
  effectType: SkillEffectType;
  /** 효과 값 */
  value: number;
  /** 대상 */
  target: SkillTarget;
  /** 조건 */
  condition?: SkillCondition;
}

/** 특기 효과 타입 */
export type SkillEffectType = 
  | 'attack_bonus'        // 공격력 증가
  | 'defense_bonus'       // 방어력 증가
  | 'speed_bonus'         // 속도 증가
  | 'morale_bonus'        // 사기 증가
  | 'charge_bonus'        // 돌격 보너스
  | 'anti_cavalry'        // 대기병 보너스
  | 'anti_ranged'         // 대궁병 보너스
  | 'terrain_bonus'       // 지형 보너스
  | 'weather_immunity'    // 날씨 면역
  | 'heal'                // 치유
  | 'damage_aura';        // 피해 오라

/** 특기 대상 */
export type SkillTarget = 'self' | 'squad' | 'all_allies' | 'enemy' | 'all_enemies';

/** 특기 조건 */
export interface SkillCondition {
  type: 'terrain' | 'weather' | 'morale' | 'health' | 'enemy_type';
  value: string | number;
}

// ========================================
// 유틸리티 타입
// ========================================

/** 좌표 */
export interface Vector2 {
  x: number;
  y: number;
}

/** 3D 좌표 */
export interface Vector3 extends Vector2 {
  z: number;
}

/** 색상 쌍 */
export interface ColorPair {
  primary: string;
  secondary: string;
}

/** 범위 */
export interface Range {
  min: number;
  max: number;
}





