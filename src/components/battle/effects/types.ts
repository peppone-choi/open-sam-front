/**
 * Battle Effects System - Types
 * 전투 이펙트 시스템 타입 정의
 */

// ===== 기본 타입 =====
export interface Position {
  x: number;
  y: number;
}

// ===== 스킬 컷인 타입 =====
export interface SkillCutInProps {
  generalName: string;
  skillName: string;
  portraitUrl?: string;
  nationColor?: string;
  skillType?: 'attack' | 'defense' | 'strategy' | 'support';
  onComplete?: () => void;
  duration?: number;
}

// ===== 데미지 플로터 타입 =====
export type DamageType = 'normal' | 'critical' | 'heal' | 'miss' | 'fire' | 'poison' | 'true';

export interface DamageFloaterProps {
  id: string;
  value: number | string;
  position: Position;
  type: DamageType;
  delay?: number;
}

// ===== 상태 이상 타입 =====
export type StatusEffectType = 
  | 'fire'      // 화계
  | 'confusion' // 혼란
  | 'fear'      // 공포
  | 'stun'      // 기절
  | 'poison'    // 중독
  | 'buff'      // 버프
  | 'debuff'    // 디버프
  | 'shield'    // 방어
  | 'rage';     // 격노

export interface StatusOverlayProps {
  type: StatusEffectType;
  position: Position;
  duration?: number;
  intensity?: 'low' | 'medium' | 'high';
}

// ===== 이펙트 큐 타입 =====
export type EffectPriority = 'immediate' | 'high' | 'normal' | 'low';
export type EffectPlayMode = 'sequential' | 'parallel';

export interface QueuedEffect {
  id: string;
  type: 'skill_cutin' | 'damage' | 'status' | 'combo' | 'custom';
  priority: EffectPriority;
  data: SkillCutInProps | DamageFloaterProps | StatusOverlayProps | CustomEffectData;
  playMode?: EffectPlayMode;
  groupId?: string;
  timestamp: number;
}

export interface CustomEffectData {
  component: React.ComponentType<unknown>;
  props: Record<string, unknown>;
  duration?: number;
}

// ===== 이펙트 매니저 상태 =====
export interface EffectManagerState {
  queue: QueuedEffect[];
  activeEffects: QueuedEffect[];
  isProcessing: boolean;
  isPaused: boolean;
}

// ===== 이펙트 매니저 액션 =====
export type EffectManagerAction =
  | { type: 'ADD_EFFECT'; effect: QueuedEffect }
  | { type: 'ADD_EFFECTS'; effects: QueuedEffect[] }
  | { type: 'REMOVE_EFFECT'; id: string }
  | { type: 'CLEAR_ALL' }
  | { type: 'CLEAR_GROUP'; groupId: string }
  | { type: 'START_PROCESSING' }
  | { type: 'STOP_PROCESSING' }
  | { type: 'PAUSE' }
  | { type: 'RESUME' }
  | { type: 'PROCESS_NEXT' }
  | { type: 'EFFECT_COMPLETE'; id: string };

