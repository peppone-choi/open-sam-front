/**
 * BattleEventSoundBridge - 전투 이벤트와 사운드 시스템 연동
 * 
 * 기능:
 * - BattleEngine 이벤트 → SoundManager 연결
 * - 이벤트 타입별 사운드 매핑
 * - 쿨다운 및 우선순위 관리
 * - 유닛 타입별 사운드 분기
 */

import { SoundManager } from './SoundManager';
import type { BattleEvent, BattleEventType } from '../types/BattleTypes';
import type { SFXType } from './SoundEffects';

// ========================================
// 타입 정의
// ========================================

/** 사운드 트리거 설정 */
export interface SoundTrigger {
  /** SFX 타입 */
  sfxType: SFXType;
  /** 볼륨 (0-1) */
  volume?: number;
  /** 피치 */
  pitch?: number;
  /** 쿨다운 (ms) */
  cooldown?: number;
  /** 우선순위 */
  priority?: number;
  /** 조건 함수 */
  condition?: (event: BattleEvent) => boolean;
  /** 위치 추출 함수 */
  getPosition?: (event: BattleEvent) => { x: number; y: number; z: number } | undefined;
}

/** 유닛 타입 */
export type UnitCategory = 'infantry' | 'archer' | 'cavalry' | 'wizard' | 'siege' | 'regional';

/** 무기 타입 */
export type WeaponType = 'sword' | 'spear' | 'bow' | 'crossbow' | 'axe' | 'staff' | 'default';

// ========================================
// 이벤트-사운드 매핑
// ========================================

/** 기본 이벤트-사운드 매핑 */
const DEFAULT_EVENT_MAPPING: Partial<Record<BattleEventType, SoundTrigger[]>> = {
  battle_started: [
    { sfxType: 'charge_horn', volume: 0.9, cooldown: 5000, priority: 10 },
    { sfxType: 'battle_cry', volume: 0.7, cooldown: 3000, priority: 8 },
  ],
  
  unit_killed: [
    { sfxType: 'death_cry', volume: 0.6, cooldown: 100, priority: 4 },
  ],
  
  squad_routed: [
    { sfxType: 'retreat_horn', volume: 0.8, cooldown: 2000, priority: 9 },
    { sfxType: 'death_cry', volume: 0.5, cooldown: 500, priority: 5 },
  ],
  
  squad_rallied: [
    { sfxType: 'battle_cry', volume: 0.8, cooldown: 1000, priority: 8 },
  ],
  
  charge_started: [
    { sfxType: 'charge_horn', volume: 0.85, cooldown: 3000, priority: 9 },
  ],
  
  charge_impact: [
    { sfxType: 'sword_clash', volume: 0.8, cooldown: 50, priority: 7 },
    { sfxType: 'shield_block', volume: 0.6, cooldown: 100, priority: 6 },
  ],
  
  flank_attack: [
    { sfxType: 'sword_clash', volume: 0.7, cooldown: 80, priority: 6 },
  ],
  
  rear_attack: [
    { sfxType: 'sword_clash', volume: 0.75, cooldown: 80, priority: 6 },
  ],
  
  ability_used: [
    { sfxType: 'special_ability', volume: 0.8, cooldown: 500, priority: 8 },
  ],
  
  morale_broken: [
    { sfxType: 'death_cry', volume: 0.65, cooldown: 200, priority: 5 },
  ],
  
  battle_ended: [
    // 승리/패배 음악은 SoundManager.setPhase에서 처리
  ],
};

/** 유닛 카테고리별 공격 사운드 */
const UNIT_ATTACK_SOUNDS: Record<UnitCategory, SFXType[]> = {
  infantry: ['sword_clash', 'sword_swing', 'shield_block'],
  archer: ['arrow_shot'],
  cavalry: ['sword_clash', 'horse_gallop'],
  wizard: ['special_ability', 'buff'],
  siege: ['crossbow_fire'],
  regional: ['sword_clash', 'spear_thrust'],
};

/** 유닛 카테고리별 피격 사운드 */
const UNIT_HIT_SOUNDS: Record<UnitCategory, SFXType[]> = {
  infantry: ['armor_hit', 'hit_flesh', 'shield_block'],
  archer: ['hit_flesh'],
  cavalry: ['armor_hit', 'horse_neigh'],
  wizard: ['hit_flesh'],
  siege: ['armor_hit'],
  regional: ['hit_flesh', 'armor_hit'],
};

/** 유닛 카테고리별 이동 사운드 */
const UNIT_MOVEMENT_SOUNDS: Record<UnitCategory, SFXType> = {
  infantry: 'march',
  archer: 'footstep',
  cavalry: 'horse_gallop',
  wizard: 'footstep',
  siege: 'footstep',
  regional: 'march',
};

// ========================================
// BattleEventSoundBridge 클래스
// ========================================

export class BattleEventSoundBridge {
  private soundManager: SoundManager;
  
  // 쿨다운 추적
  private eventCooldowns: Map<string, number> = new Map();
  
  // 커스텀 매핑
  private customMapping: Map<BattleEventType, SoundTrigger[]> = new Map();
  
  // 활성화 상태
  private enabled = true;
  
  // 전역 볼륨 스케일
  private volumeScale = 1;

  constructor(soundManager: SoundManager) {
    this.soundManager = soundManager;
  }

  // ========================================
  // 이벤트 처리
  // ========================================

  /**
   * 전투 이벤트 처리
   */
  handleEvent(event: BattleEvent): void {
    if (!this.enabled) return;

    // 커스텀 매핑 우선 확인
    const customTriggers = this.customMapping.get(event.type);
    const triggers = customTriggers || DEFAULT_EVENT_MAPPING[event.type] || [];

    for (const trigger of triggers) {
      this.processTrigger(event, trigger);
    }

    // 특수 이벤트 처리
    this.processSpecialEvents(event);
  }

  /**
   * 사운드 트리거 처리
   */
  private processTrigger(event: BattleEvent, trigger: SoundTrigger): void {
    // 조건 체크
    if (trigger.condition && !trigger.condition(event)) {
      return;
    }

    // 쿨다운 체크
    const cooldownKey = `${event.type}_${trigger.sfxType}`;
    const now = Date.now();
    const lastTime = this.eventCooldowns.get(cooldownKey) || 0;
    const cooldown = trigger.cooldown ?? 50;
    
    if (now - lastTime < cooldown) {
      return;
    }
    this.eventCooldowns.set(cooldownKey, now);

    // 위치 추출
    const position = trigger.getPosition 
      ? trigger.getPosition(event)
      : this.extractPosition(event);

    // 사운드 재생
    const volume = (trigger.volume ?? 0.7) * this.volumeScale;
    this.soundManager.playSFX(trigger.sfxType, position, {
      volume,
      pitch: trigger.pitch,
    });
  }

  /**
   * 특수 이벤트 처리 (유닛 타입별 분기 등)
   */
  private processSpecialEvents(event: BattleEvent): void {
    const { type, data } = event;

    // 공격 이벤트 - 무기/유닛 타입별 분기
    if (data?.eventSubType === 'attack' || type === 'charge_impact') {
      const unitCategory = data?.unitCategory as UnitCategory | undefined;
      const weaponType = data?.weaponType as WeaponType | undefined;
      
      if (unitCategory) {
        this.playUnitAttackSound(unitCategory, this.extractPosition(event));
      } else if (weaponType) {
        this.playWeaponSound(weaponType, this.extractPosition(event));
      }
    }

    // 피격 이벤트
    if (data?.eventSubType === 'hit' || data?.eventSubType === 'damage') {
      const unitCategory = data?.targetCategory as UnitCategory | undefined;
      const hasArmor = data?.hasArmor as boolean | undefined;
      
      if (unitCategory) {
        this.playUnitHitSound(unitCategory, hasArmor, this.extractPosition(event));
      }
    }

    // 이동 이벤트
    if (data?.eventSubType === 'movement') {
      const unitCategory = data?.unitCategory as UnitCategory | undefined;
      if (unitCategory) {
        this.playMovementSound(unitCategory, this.extractPosition(event));
      }
    }
  }

  /**
   * 이벤트에서 위치 추출
   */
  private extractPosition(event: BattleEvent): { x: number; y: number; z: number } | undefined {
    const { data } = event;
    
    if (data?.position) {
      const pos = data.position as { x: number; y?: number; z: number };
      return {
        x: pos.x,
        y: pos.y ?? 0,
        z: pos.z,
      };
    }
    
    if (data?.x !== undefined && data?.z !== undefined) {
      return {
        x: data.x as number,
        y: (data.y as number) ?? 0,
        z: data.z as number,
      };
    }
    
    return undefined;
  }

  // ========================================
  // 유닛/무기별 사운드
  // ========================================

  /**
   * 유닛 공격 사운드 재생
   */
  playUnitAttackSound(
    category: UnitCategory,
    position?: { x: number; y: number; z: number }
  ): void {
    const sounds = UNIT_ATTACK_SOUNDS[category] || UNIT_ATTACK_SOUNDS.infantry;
    const sfxType = sounds[Math.floor(Math.random() * sounds.length)];
    
    this.soundManager.playSFX(sfxType, position, { volume: 0.7 * this.volumeScale });
  }

  /**
   * 무기 사운드 재생
   */
  playWeaponSound(
    weaponType: WeaponType,
    position?: { x: number; y: number; z: number }
  ): void {
    const sfxMap: Record<WeaponType, SFXType> = {
      sword: 'sword_clash',
      spear: 'spear_thrust',
      bow: 'arrow_shot',
      crossbow: 'crossbow_fire',
      axe: 'axe_hit',
      staff: 'special_ability',
      default: 'sword_clash',
    };
    
    const sfxType = sfxMap[weaponType] || 'sword_clash';
    this.soundManager.playSFX(sfxType, position, { volume: 0.7 * this.volumeScale });
  }

  /**
   * 유닛 피격 사운드 재생
   */
  playUnitHitSound(
    category: UnitCategory,
    hasArmor?: boolean,
    position?: { x: number; y: number; z: number }
  ): void {
    const sounds = UNIT_HIT_SOUNDS[category] || UNIT_HIT_SOUNDS.infantry;
    
    // 갑옷 여부에 따라 사운드 선택
    let sfxType: SFXType;
    if (hasArmor) {
      sfxType = sounds.find(s => s === 'armor_hit' || s === 'shield_block') || 'armor_hit';
    } else {
      sfxType = sounds.find(s => s === 'hit_flesh') || sounds[0];
    }
    
    this.soundManager.playSFX(sfxType, position, { volume: 0.6 * this.volumeScale });
  }

  /**
   * 이동 사운드 재생
   */
  playMovementSound(
    category: UnitCategory,
    position?: { x: number; y: number; z: number }
  ): string | null {
    const sfxType = UNIT_MOVEMENT_SOUNDS[category] || 'footstep';
    return this.soundManager.playSFX(sfxType, position, { volume: 0.3 * this.volumeScale });
  }

  // ========================================
  // 편의 메서드
  // ========================================

  /**
   * 검 충돌 사운드
   */
  playSwordClash(position?: { x: number; y: number; z: number }): void {
    this.soundManager.playSFX('sword_clash', position, { volume: 0.7 * this.volumeScale });
  }

  /**
   * 화살 발사 사운드
   */
  playArrowShot(position?: { x: number; y: number; z: number }): void {
    this.soundManager.playSFX('arrow_shot', position, { volume: 0.5 * this.volumeScale });
  }

  /**
   * 돌격 나팔
   */
  playChargeHorn(position?: { x: number; y: number; z: number }): void {
    this.soundManager.playSFX('charge_horn', position, { volume: 0.9 * this.volumeScale });
  }

  /**
   * 전투 함성
   */
  playBattleCry(position?: { x: number; y: number; z: number }): void {
    this.soundManager.playSFX('battle_cry', position, { volume: 0.8 * this.volumeScale });
  }

  /**
   * 사망 비명
   */
  playDeathCry(position?: { x: number; y: number; z: number }): void {
    this.soundManager.playSFX('death_cry', position, { volume: 0.6 * this.volumeScale });
  }

  /**
   * 말 발굽
   */
  playHorseGallop(position?: { x: number; y: number; z: number }): string | null {
    return this.soundManager.playSFX('horse_gallop', position, { volume: 0.5 * this.volumeScale });
  }

  // ========================================
  // 설정
  // ========================================

  /**
   * 활성화/비활성화
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  /**
   * 볼륨 스케일 설정
   */
  setVolumeScale(scale: number): void {
    this.volumeScale = Math.max(0, Math.min(2, scale));
  }

  /**
   * 커스텀 이벤트 매핑 추가
   */
  addCustomMapping(eventType: BattleEventType, triggers: SoundTrigger[]): void {
    this.customMapping.set(eventType, triggers);
  }

  /**
   * 커스텀 매핑 제거
   */
  removeCustomMapping(eventType: BattleEventType): void {
    this.customMapping.delete(eventType);
  }

  /**
   * 모든 커스텀 매핑 초기화
   */
  clearCustomMappings(): void {
    this.customMapping.clear();
  }

  // ========================================
  // 정리
  // ========================================

  /**
   * 쿨다운 초기화
   */
  resetCooldowns(): void {
    this.eventCooldowns.clear();
  }

  /**
   * 리소스 정리
   */
  dispose(): void {
    this.eventCooldowns.clear();
    this.customMapping.clear();
  }
}

// ========================================
// BattleEngine 연동 헬퍼
// ========================================

/**
 * BattleEngine에 사운드 브릿지 연결
 */
export function connectBattleEngineToSound(
  engine: { on: (event: string, callback: (event: BattleEvent) => void) => void },
  soundManager: SoundManager
): BattleEventSoundBridge {
  const bridge = new BattleEventSoundBridge(soundManager);
  
  // 모든 이벤트 타입에 리스너 등록
  engine.on('all', (event: BattleEvent) => {
    bridge.handleEvent(event);
  });
  
  return bridge;
}

export default BattleEventSoundBridge;





