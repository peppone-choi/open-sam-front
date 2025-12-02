/**
 * FormationManager.ts
 * 역사적 군사 진형 시스템
 * 
 * 토탈워 스타일 전투에서 진형 배치, 전환, 효과를 관리합니다.
 * 
 * 지원 진형:
 * 1. Line (횡대): 넓은 전선, 많은 병사 동시 전투 참여
 * 2. Column (종대): 좁은 전선, 돌파력
 * 3. Square (방진): 전방위 방어, 기병 대응
 * 4. Wedge (쐐기): 돌격 특화, 적진 돌파
 * 5. Loose (산개): 원거리 피해 감소
 * 6. Testudo (거북이): 화살 방어 특화 (로마식)
 * 7. Shield Wall (방패벽): 정면 방어 특화 (게르만/바이킹식)
 */

import type { TWSquad, TWSoldier, TWFormation, Vector2 } from '../TotalWarEngine';
import { FORMATION_CONFIG } from '../TotalWarEngine';

// ========================================
// 타입 정의
// ========================================

/** 진형 전환 상태 */
export interface FormationTransition {
  squadId: string;
  fromFormation: TWFormation;
  toFormation: TWFormation;
  startTime: number;
  duration: number;
  progress: number;
  soldierTransitions: SoldierTransition[];
  isComplete: boolean;
}

/** 병사 개별 전환 상태 */
export interface SoldierTransition {
  soldierId: string;
  fromPosition: Vector2;
  toPosition: Vector2;
  fromSlot: { row: number; col: number };
  toSlot: { row: number; col: number };
}

/** 진형 효과 (버프/디버프) */
export interface FormationEffect {
  id: string;
  type: FormationEffectType;
  value: number;
  source: TWFormation;
  description: string;
}

export type FormationEffectType =
  | 'melee_attack'
  | 'melee_defense'
  | 'ranged_defense'
  | 'charge_defense'
  | 'speed'
  | 'morale'
  | 'fatigue_rate';

/** 진형별 슬롯 배치 옵션 */
export interface FormationLayoutOptions {
  totalSoldiers: number;
  spacing: number;
  facing: number;
  center: Vector2;
}

/** 진형 레이아웃 결과 */
export interface FormationLayout {
  formation: TWFormation;
  width: number;
  depth: number;
  slots: FormationSlot[];
  boundingBox: {
    minX: number;
    maxX: number;
    minZ: number;
    maxZ: number;
  };
}

/** 진형 슬롯 정보 */
export interface FormationSlot {
  row: number;
  col: number;
  localPosition: Vector2;
  worldPosition: Vector2;
  priority: number; // 전투 우선순위 (앞줄이 높음)
}

/** 이징 함수 타입 */
export type EasingFunction = (t: number) => number;

// ========================================
// 이징 함수 라이브러리
// ========================================

export const Easing = {
  /** 선형 */
  linear: (t: number): number => t,
  
  /** 부드러운 시작 (Quadratic) */
  easeInQuad: (t: number): number => t * t,
  
  /** 부드러운 끝 (Quadratic) */
  easeOutQuad: (t: number): number => t * (2 - t),
  
  /** 부드러운 시작과 끝 (Quadratic) */
  easeInOutQuad: (t: number): number => 
    t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
  
  /** 부드러운 시작과 끝 (Cubic) */
  easeInOutCubic: (t: number): number =>
    t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,
  
  /** 탄성 효과 */
  easeOutElastic: (t: number): number => {
    const c4 = (2 * Math.PI) / 3;
    return t === 0
      ? 0
      : t === 1
      ? 1
      : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
  },
  
  /** 군사 행진 느낌 (빠른 시작, 안정적 도착) */
  militaryMarch: (t: number): number => {
    // 빠르게 가속 후 안정적으로 감속
    return 1 - Math.pow(1 - t, 3);
  },
};

// ========================================
// 진형별 설정 확장 (역사적 근거 기반)
// ========================================

/** 진형별 상세 설정 (역사적 근거) */
export const FORMATION_DETAILS: Record<TWFormation, {
  name: string;
  koreanName: string;
  historicalOrigin: string;
  description: string;
  idealUnitTypes: string[];
  transitionTime: number; // ms
  minimumSoldiers: number;
  maximumEffectiveSoldiers: number;
}> = {
  line: {
    name: 'Line Formation',
    koreanName: '횡대',
    historicalOrigin: '고대 그리스 팔랑크스, 로마 군단, 중국 한나라 군제',
    description: '넓은 전선을 형성하여 최대한 많은 병사가 전투에 참여합니다.',
    idealUnitTypes: ['sword_infantry', 'halberd_infantry', 'archer'],
    transitionTime: 2000,
    minimumSoldiers: 4,
    maximumEffectiveSoldiers: 200,
  },
  column: {
    name: 'Column Formation',
    koreanName: '종대',
    historicalOrigin: '알렉산더 대왕의 마케도니아 기병대',
    description: '좁고 깊은 대형으로 적진 돌파에 효과적입니다.',
    idealUnitTypes: ['cavalry', 'shock_cavalry', 'ji_infantry'],
    transitionTime: 2500,
    minimumSoldiers: 3,
    maximumEffectiveSoldiers: 100,
  },
  square: {
    name: 'Square Formation',
    koreanName: '방진',
    historicalOrigin: '로마 군단 코호트, 중국 팔진도',
    description: '전방위 방어가 가능하며 기병 돌격에 강합니다.',
    idealUnitTypes: ['spear_guard', 'ji_infantry', 'sword_infantry'],
    transitionTime: 3000,
    minimumSoldiers: 9,
    maximumEffectiveSoldiers: 150,
  },
  wedge: {
    name: 'Wedge Formation',
    koreanName: '쐐기/학익진',
    historicalOrigin: '알렉산더의 기병 쐐기, 제갈량의 학익진',
    description: '삼각형 대형으로 적 대형을 쪼개는 돌파력이 있습니다.',
    idealUnitTypes: ['cavalry', 'shock_cavalry', 'chariot'],
    transitionTime: 3500,
    minimumSoldiers: 6,
    maximumEffectiveSoldiers: 80,
  },
  loose: {
    name: 'Loose Formation',
    koreanName: '산개진',
    historicalOrigin: '로마 벨리테스, 몽골 기마 궁수',
    description: '넓게 퍼져서 원거리 공격 피해를 줄입니다.',
    idealUnitTypes: ['archer', 'crossbow', 'horse_archer'],
    transitionTime: 1500,
    minimumSoldiers: 3,
    maximumEffectiveSoldiers: 150,
  },
  testudo: {
    name: 'Testudo Formation',
    koreanName: '거북이진',
    historicalOrigin: '로마 군단의 공성 대형',
    description: '방패로 상부를 덮어 화살과 투석에 극도로 강합니다.',
    idealUnitTypes: ['sword_infantry', 'spear_guard'],
    transitionTime: 4000,
    minimumSoldiers: 16,
    maximumEffectiveSoldiers: 100,
  },
  shield_wall: {
    name: 'Shield Wall Formation',
    koreanName: '방패벽',
    historicalOrigin: '바이킹 스비아폴크, 색슨 방패벽',
    description: '밀집한 방패벽으로 정면 방어력이 극대화됩니다.',
    idealUnitTypes: ['sword_infantry', 'spear_guard', 'ji_infantry'],
    transitionTime: 3000,
    minimumSoldiers: 8,
    maximumEffectiveSoldiers: 120,
  },
};

// ========================================
// FormationManager 클래스
// ========================================

export class FormationManager {
  /** 활성 전환 상태 맵 */
  private activeTransitions: Map<string, FormationTransition> = new Map();
  
  /** 전환 중 전투력 감소 비율 */
  private readonly TRANSITION_COMBAT_PENALTY = 0.3;
  
  /** 이징 함수 */
  private easing: EasingFunction = Easing.militaryMarch;
  
  constructor() {}
  
  // ========================================
  // 1. 진형 위치 계산
  // ========================================
  
  /**
   * 부대의 병사 진형 위치를 계산합니다.
   * @param squad 부대 정보
   * @param soldierIndex 병사 인덱스 (0부터 시작)
   * @returns 월드 좌표 (Vector2)
   */
  calculateFormationPosition(squad: TWSquad, soldierIndex: number): Vector2 {
    const config = FORMATION_CONFIG[squad.formation];
    const aliveSoldiers = squad.soldiers.filter(s => s.state !== 'dead').length;
    
    // 진형 크기 계산
    const { width, depth } = this.calculateFormationDimensions(
      squad.formation,
      aliveSoldiers
    );
    
    // 슬롯 위치 계산
    const row = Math.floor(soldierIndex / width);
    const col = soldierIndex % width;
    
    // 로컬 오프셋 계산
    const localOffset = this.calculateSlotOffset(
      squad.formation,
      row,
      col,
      width,
      depth,
      squad.spacing * config.spacingMultiplier
    );
    
    // 월드 좌표로 변환
    return this.localToWorld(localOffset, squad.position, squad.facing);
  }
  
  /**
   * 진형 전체 레이아웃을 계산합니다.
   * @param formation 진형 타입
   * @param options 레이아웃 옵션
   * @returns 진형 레이아웃 정보
   */
  calculateFormationLayout(
    formation: TWFormation,
    options: FormationLayoutOptions
  ): FormationLayout {
    const config = FORMATION_CONFIG[formation];
    const { totalSoldiers, spacing, facing, center } = options;
    
    // 진형 크기 계산
    const { width, depth } = this.calculateFormationDimensions(formation, totalSoldiers);
    const effectiveSpacing = spacing * config.spacingMultiplier;
    
    // 슬롯 생성
    const slots: FormationSlot[] = [];
    let slotIndex = 0;
    
    for (let row = 0; row < depth && slotIndex < totalSoldiers; row++) {
      const rowWidth = this.getRowWidth(formation, row, width, totalSoldiers - slotIndex);
      
      for (let col = 0; col < rowWidth && slotIndex < totalSoldiers; col++) {
        const localPosition = this.calculateSlotOffset(
          formation,
          row,
          col,
          width,
          depth,
          effectiveSpacing
        );
        
        const worldPosition = this.localToWorld(localPosition, center, facing);
        
        slots.push({
          row,
          col,
          localPosition,
          worldPosition,
          priority: depth - row, // 앞줄이 높은 우선순위
        });
        
        slotIndex++;
      }
    }
    
    // 바운딩 박스 계산
    const boundingBox = this.calculateBoundingBox(slots);
    
    return {
      formation,
      width,
      depth,
      slots,
      boundingBox,
    };
  }
  
  /**
   * 진형 크기 (가로/세로) 계산
   */
  calculateFormationDimensions(
    formation: TWFormation,
    soldierCount: number
  ): { width: number; depth: number } {
    const config = FORMATION_CONFIG[formation];
    const ratio = config.widthToDepthRatio;
    
    let width: number;
    let depth: number;
    
    switch (formation) {
      case 'wedge':
        // 쐐기: 삼각수로 계산 (1 + 2 + 3 + ... = n)
        depth = Math.ceil((-1 + Math.sqrt(1 + 8 * soldierCount)) / 2);
        width = depth;
        break;
        
      case 'square':
      case 'testudo':
        // 정사각형에 가깝게
        const side = Math.ceil(Math.sqrt(soldierCount));
        width = side;
        depth = Math.ceil(soldierCount / side);
        break;
        
      case 'line':
        // 횡대: 가로가 넓음
        width = Math.min(soldierCount, Math.ceil(Math.sqrt(soldierCount * ratio)));
        depth = Math.ceil(soldierCount / width);
        break;
        
      case 'column':
        // 종대: 세로가 김
        width = Math.max(2, Math.ceil(Math.sqrt(soldierCount / ratio)));
        depth = Math.ceil(soldierCount / width);
        break;
        
      case 'loose':
        // 산개: 넓게 퍼짐 (횡대와 유사하지만 간격이 넓음)
        width = Math.ceil(Math.sqrt(soldierCount * ratio));
        depth = Math.ceil(soldierCount / width);
        break;
        
      case 'shield_wall':
        // 방패벽: 얇고 넓게
        width = Math.min(soldierCount, Math.ceil(Math.sqrt(soldierCount * 3)));
        depth = Math.ceil(soldierCount / width);
        break;
        
      default:
        width = Math.ceil(Math.sqrt(soldierCount * ratio));
        depth = Math.ceil(soldierCount / width);
    }
    
    return { width: Math.max(1, width), depth: Math.max(1, depth) };
  }
  
  /**
   * 특정 줄의 너비 계산 (쐐기 진형 등을 위해)
   */
  private getRowWidth(
    formation: TWFormation,
    row: number,
    maxWidth: number,
    remainingSoldiers: number
  ): number {
    switch (formation) {
      case 'wedge':
        // 쐐기: 줄이 내려갈수록 넓어짐
        return Math.min(row + 1, remainingSoldiers);
        
      default:
        return Math.min(maxWidth, remainingSoldiers);
    }
  }
  
  /**
   * 슬롯의 로컬 오프셋 계산
   */
  private calculateSlotOffset(
    formation: TWFormation,
    row: number,
    col: number,
    width: number,
    depth: number,
    spacing: number
  ): Vector2 {
    const halfWidth = (width - 1) / 2;
    
    let x = 0;
    let z = 0;
    
    switch (formation) {
      case 'wedge':
        // 쐐기: 삼각형 배치
        const rowWidth = row + 1;
        const rowHalfWidth = (rowWidth - 1) / 2;
        x = (col - rowHalfWidth) * spacing;
        z = -row * spacing * 0.866; // cos(30°) = 0.866
        break;
        
      case 'square':
        // 방진: 정사각형 중심 배치
        x = (col - halfWidth) * spacing;
        z = (row - (depth - 1) / 2) * spacing;
        break;
        
      case 'testudo':
        // 거북이진: 밀집 배치 (간격 좁음)
        x = (col - halfWidth) * spacing;
        z = -row * spacing;
        break;
        
      case 'loose':
        // 산개: 약간의 랜덤 오프셋 (결정론적)
        const jitterSeed = row * 1000 + col;
        const jitterX = (this.seededRandom(jitterSeed) - 0.5) * spacing * 0.3;
        const jitterZ = (this.seededRandom(jitterSeed + 1) - 0.5) * spacing * 0.3;
        x = (col - halfWidth) * spacing + jitterX;
        z = -row * spacing + jitterZ;
        break;
        
      case 'shield_wall':
        // 방패벽: 약간의 지그재그 배치 (더 밀집)
        const stagger = row % 2 === 0 ? 0 : spacing * 0.3;
        x = (col - halfWidth) * spacing + stagger;
        z = -row * spacing * 0.85;
        break;
        
      case 'column':
        // 종대: 세로로 긴 배치
        x = (col - halfWidth) * spacing;
        z = -row * spacing;
        break;
        
      case 'line':
      default:
        // 횡대: 기본 격자 배치
        x = (col - halfWidth) * spacing;
        z = -row * spacing;
        break;
    }
    
    return { x, z };
  }
  
  /**
   * 시드 기반 의사 랜덤 (결정론적)
   */
  private seededRandom(seed: number): number {
    const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
    return x - Math.floor(x);
  }
  
  /**
   * 로컬 좌표를 월드 좌표로 변환
   */
  private localToWorld(local: Vector2, origin: Vector2, facing: number): Vector2 {
    const cos = Math.cos(facing);
    const sin = Math.sin(facing);
    return {
      x: origin.x + local.x * cos - local.z * sin,
      z: origin.z + local.x * sin + local.z * cos,
    };
  }
  
  /**
   * 바운딩 박스 계산
   */
  private calculateBoundingBox(slots: FormationSlot[]): {
    minX: number;
    maxX: number;
    minZ: number;
    maxZ: number;
  } {
    if (slots.length === 0) {
      return { minX: 0, maxX: 0, minZ: 0, maxZ: 0 };
    }
    
    let minX = Infinity, maxX = -Infinity;
    let minZ = Infinity, maxZ = -Infinity;
    
    for (const slot of slots) {
      minX = Math.min(minX, slot.worldPosition.x);
      maxX = Math.max(maxX, slot.worldPosition.x);
      minZ = Math.min(minZ, slot.worldPosition.z);
      maxZ = Math.max(maxZ, slot.worldPosition.z);
    }
    
    return { minX, maxX, minZ, maxZ };
  }
  
  // ========================================
  // 2. 진형 전환 애니메이션
  // ========================================
  
  /**
   * 진형 전환을 시작합니다.
   * @param squad 부대
   * @param newFormation 새 진형
   * @param currentTime 현재 시간 (ms)
   * @returns 전환 상태
   */
  startFormationTransition(
    squad: TWSquad,
    newFormation: TWFormation,
    currentTime: number
  ): FormationTransition {
    const fromFormation = squad.formation;
    const details = FORMATION_DETAILS[newFormation];
    
    // 기존 전환 취소
    if (this.activeTransitions.has(squad.id)) {
      this.activeTransitions.delete(squad.id);
    }
    
    // 새 진형 레이아웃 계산
    const aliveSoldiers = squad.soldiers.filter(s => s.state !== 'dead');
    const newLayout = this.calculateFormationLayout(newFormation, {
      totalSoldiers: aliveSoldiers.length,
      spacing: squad.spacing,
      facing: squad.facing,
      center: squad.position,
    });
    
    // 병사별 전환 정보 생성
    const soldierTransitions: SoldierTransition[] = [];
    
    for (let i = 0; i < aliveSoldiers.length; i++) {
      const soldier = aliveSoldiers[i];
      const newSlot = newLayout.slots[i];
      
      soldierTransitions.push({
        soldierId: soldier.id,
        fromPosition: { ...soldier.position },
        toPosition: { ...newSlot.worldPosition },
        fromSlot: { ...soldier.formationSlot },
        toSlot: { row: newSlot.row, col: newSlot.col },
      });
    }
    
    const transition: FormationTransition = {
      squadId: squad.id,
      fromFormation,
      toFormation: newFormation,
      startTime: currentTime,
      duration: details.transitionTime,
      progress: 0,
      soldierTransitions,
      isComplete: false,
    };
    
    this.activeTransitions.set(squad.id, transition);
    
    return transition;
  }
  
  /**
   * 진형 전환을 업데이트합니다.
   * @param squadId 부대 ID
   * @param currentTime 현재 시간 (ms)
   * @returns 업데이트된 전환 상태 또는 null (전환 없음)
   */
  updateFormationTransition(
    squadId: string,
    currentTime: number
  ): FormationTransition | null {
    const transition = this.activeTransitions.get(squadId);
    if (!transition) return null;
    
    // 진행률 계산
    const elapsed = currentTime - transition.startTime;
    const rawProgress = Math.min(1, elapsed / transition.duration);
    transition.progress = this.easing(rawProgress);
    
    // 완료 체크
    if (rawProgress >= 1) {
      transition.isComplete = true;
      this.activeTransitions.delete(squadId);
    }
    
    return transition;
  }
  
  /**
   * 전환 중인 병사의 현재 위치를 계산합니다.
   * @param transition 전환 상태
   * @param soldierId 병사 ID
   * @returns 보간된 위치
   */
  interpolateSoldierPosition(
    transition: FormationTransition,
    soldierId: string
  ): Vector2 | null {
    const soldierTransition = transition.soldierTransitions.find(
      st => st.soldierId === soldierId
    );
    
    if (!soldierTransition) return null;
    
    const t = transition.progress;
    
    return {
      x: soldierTransition.fromPosition.x + 
         (soldierTransition.toPosition.x - soldierTransition.fromPosition.x) * t,
      z: soldierTransition.fromPosition.z + 
         (soldierTransition.toPosition.z - soldierTransition.fromPosition.z) * t,
    };
  }
  
  /**
   * 부대가 진형 전환 중인지 확인합니다.
   */
  isTransitioning(squadId: string): boolean {
    return this.activeTransitions.has(squadId);
  }
  
  /**
   * 현재 전환 진행률을 반환합니다.
   */
  getTransitionProgress(squadId: string): number {
    const transition = this.activeTransitions.get(squadId);
    return transition ? transition.progress : 1;
  }
  
  /**
   * 진형 전환 중 전투력 페널티를 반환합니다.
   * @param squadId 부대 ID
   * @returns 전투력 배율 (0.7 = 30% 감소)
   */
  getTransitionCombatMultiplier(squadId: string): number {
    const transition = this.activeTransitions.get(squadId);
    if (!transition) return 1;
    
    // 전환 중간에 가장 큰 페널티
    const penaltyFactor = Math.sin(transition.progress * Math.PI);
    return 1 - (this.TRANSITION_COMBAT_PENALTY * penaltyFactor);
  }
  
  /**
   * 이징 함수를 설정합니다.
   */
  setEasing(easing: EasingFunction): void {
    this.easing = easing;
  }
  
  // ========================================
  // 3. 진형 효과 적용
  // ========================================
  
  /**
   * 진형에 따른 효과 목록을 반환합니다.
   * @param formation 진형 타입
   * @returns 효과 목록
   */
  getFormationEffects(formation: TWFormation): FormationEffect[] {
    const config = FORMATION_CONFIG[formation];
    const effects: FormationEffect[] = [];
    
    // 근접 공격 보너스
    if (config.meleeAttackBonus !== 1) {
      effects.push({
        id: `${formation}-melee-attack`,
        type: 'melee_attack',
        value: config.meleeAttackBonus,
        source: formation,
        description: config.meleeAttackBonus > 1 
          ? `근접 공격력 +${Math.round((config.meleeAttackBonus - 1) * 100)}%`
          : `근접 공격력 ${Math.round((config.meleeAttackBonus - 1) * 100)}%`,
      });
    }
    
    // 근접 방어 보너스
    if (config.meleeDefenseBonus !== 1) {
      effects.push({
        id: `${formation}-melee-defense`,
        type: 'melee_defense',
        value: config.meleeDefenseBonus,
        source: formation,
        description: config.meleeDefenseBonus > 1
          ? `근접 방어력 +${Math.round((config.meleeDefenseBonus - 1) * 100)}%`
          : `근접 방어력 ${Math.round((config.meleeDefenseBonus - 1) * 100)}%`,
      });
    }
    
    // 원거리 방어 보너스
    if (config.rangedDefenseBonus !== 1) {
      effects.push({
        id: `${formation}-ranged-defense`,
        type: 'ranged_defense',
        value: config.rangedDefenseBonus,
        source: formation,
        description: config.rangedDefenseBonus > 1
          ? `원거리 피해 ${Math.round((1 - 1/config.rangedDefenseBonus) * 100)}% 감소`
          : `원거리 피해 +${Math.round((1/config.rangedDefenseBonus - 1) * 100)}%`,
      });
    }
    
    // 돌격 방어 보너스
    if (config.chargeDefenseBonus !== 1) {
      effects.push({
        id: `${formation}-charge-defense`,
        type: 'charge_defense',
        value: config.chargeDefenseBonus,
        source: formation,
        description: config.chargeDefenseBonus > 1
          ? `기병 돌격 피해 ${Math.round((1 - 1/config.chargeDefenseBonus) * 100)}% 감소`
          : `기병 돌격 피해 +${Math.round((1/config.chargeDefenseBonus - 1) * 100)}%`,
      });
    }
    
    // 속도 보너스
    if (config.speedMultiplier !== 1) {
      effects.push({
        id: `${formation}-speed`,
        type: 'speed',
        value: config.speedMultiplier,
        source: formation,
        description: config.speedMultiplier > 1
          ? `이동 속도 +${Math.round((config.speedMultiplier - 1) * 100)}%`
          : `이동 속도 ${Math.round((config.speedMultiplier - 1) * 100)}%`,
      });
    }
    
    return effects;
  }
  
  /**
   * 부대에 진형 효과를 적용합니다.
   * @param squad 부대
   * @returns 효과가 적용된 스탯 배율
   */
  applyFormationEffects(squad: TWSquad): {
    meleeAttackMultiplier: number;
    meleeDefenseMultiplier: number;
    rangedDefenseMultiplier: number;
    chargeDefenseMultiplier: number;
    speedMultiplier: number;
  } {
    const config = FORMATION_CONFIG[squad.formation];
    const transitionMultiplier = this.getTransitionCombatMultiplier(squad.id);
    
    return {
      meleeAttackMultiplier: config.meleeAttackBonus * transitionMultiplier,
      meleeDefenseMultiplier: config.meleeDefenseBonus * transitionMultiplier,
      rangedDefenseMultiplier: config.rangedDefenseBonus,
      chargeDefenseMultiplier: config.chargeDefenseBonus,
      speedMultiplier: config.speedMultiplier * (this.isTransitioning(squad.id) ? 0.5 : 1),
    };
  }
  
  /**
   * 진형의 특수 능력을 반환합니다.
   */
  getFormationSpecialAbilities(formation: TWFormation): string[] {
    const abilities: string[] = [];
    
    switch (formation) {
      case 'testudo':
        abilities.push('투사체 방어 극대화');
        abilities.push('공성 시 유리');
        break;
      case 'wedge':
        abilities.push('첫 타격 보너스');
        abilities.push('적진 분리');
        break;
      case 'square':
        abilities.push('전방위 방어');
        abilities.push('기병 돌격 무력화');
        break;
      case 'shield_wall':
        abilities.push('정면 절대 방어');
        abilities.push('후퇴 불가');
        break;
      case 'loose':
        abilities.push('원거리 회피');
        abilities.push('빠른 재배치');
        break;
      case 'column':
        abilities.push('빠른 이동');
        abilities.push('좁은 지형 통과');
        break;
      case 'line':
        abilities.push('최대 전선');
        abilities.push('안정적 전투');
        break;
    }
    
    return abilities;
  }
  
  // ========================================
  // 4. 동적 크기 조절
  // ========================================
  
  /**
   * 병사 수 변화에 따라 진형을 재계산합니다.
   * @param squad 부대
   * @param currentTime 현재 시간
   * @returns 새 슬롯 배치
   */
  recalculateFormationForCasualties(
    squad: TWSquad,
    currentTime: number
  ): FormationSlot[] {
    const aliveSoldiers = squad.soldiers.filter(s => s.state !== 'dead');
    const soldierCount = aliveSoldiers.length;
    
    // 최소 병력 체크
    const details = FORMATION_DETAILS[squad.formation];
    let effectiveFormation = squad.formation;
    
    if (soldierCount < details.minimumSoldiers) {
      // 최소 병력 미달 시 기본 진형(횡대)으로 전환
      effectiveFormation = 'line';
    }
    
    // 새 레이아웃 계산
    const layout = this.calculateFormationLayout(effectiveFormation, {
      totalSoldiers: soldierCount,
      spacing: squad.spacing,
      facing: squad.facing,
      center: squad.position,
    });
    
    return layout.slots;
  }
  
  /**
   * 병사 슬롯을 재배치합니다 (죽은 병사 자리 메움).
   * @param squad 부대
   * @returns 재배치된 슬롯 정보
   */
  reassignSlots(squad: TWSquad): Map<string, FormationSlot> {
    const aliveSoldiers = squad.soldiers.filter(s => s.state !== 'dead');
    const newSlots = this.recalculateFormationForCasualties(squad, 0);
    
    const slotAssignments = new Map<string, FormationSlot>();
    
    // 병사별로 새 슬롯 할당
    for (let i = 0; i < aliveSoldiers.length && i < newSlots.length; i++) {
      slotAssignments.set(aliveSoldiers[i].id, newSlots[i]);
    }
    
    return slotAssignments;
  }
  
  /**
   * 진형 너비를 동적으로 조절합니다.
   * @param squad 부대
   * @param targetWidth 목표 너비 (병사 수)
   */
  adjustFormationWidth(
    squad: TWSquad,
    targetWidth: number
  ): { width: number; depth: number } {
    const aliveSoldiers = squad.soldiers.filter(s => s.state !== 'dead');
    const soldierCount = aliveSoldiers.length;
    
    // 너비 제한
    const actualWidth = Math.max(1, Math.min(targetWidth, soldierCount));
    const depth = Math.ceil(soldierCount / actualWidth);
    
    return { width: actualWidth, depth };
  }
  
  /**
   * 진형 밀집도를 조절합니다.
   * @param baseSpacing 기본 간격
   * @param densityFactor 밀집도 (0.5 = 50% 밀집, 2.0 = 200% 확장)
   */
  adjustFormationDensity(baseSpacing: number, densityFactor: number): number {
    return baseSpacing * Math.max(0.4, Math.min(2.5, densityFactor));
  }
  
  // ========================================
  // 유틸리티 메서드
  // ========================================
  
  /**
   * 진형 추천을 반환합니다.
   * @param unitCategory 유닛 카테고리
   * @param situation 상황 ('attack', 'defend', 'move', 'ambush')
   */
  recommendFormation(
    unitCategory: string,
    situation: 'attack' | 'defend' | 'move' | 'ambush'
  ): TWFormation {
    // 기병
    if (unitCategory.includes('cavalry') || unitCategory === 'chariot') {
      switch (situation) {
        case 'attack': return 'wedge';
        case 'defend': return 'square';
        case 'move': return 'column';
        case 'ambush': return 'line';
      }
    }
    
    // 궁병/노병
    if (unitCategory === 'archer' || unitCategory === 'crossbow' || 
        unitCategory === 'horse_archer') {
      switch (situation) {
        case 'attack': return 'line';
        case 'defend': return 'loose';
        case 'move': return 'column';
        case 'ambush': return 'loose';
      }
    }
    
    // 창병 계열
    if (unitCategory.includes('infantry') && 
        (unitCategory.includes('ji') || unitCategory.includes('spear'))) {
      switch (situation) {
        case 'attack': return 'line';
        case 'defend': return 'square';
        case 'move': return 'column';
        case 'ambush': return 'shield_wall';
      }
    }
    
    // 기본 보병
    switch (situation) {
      case 'attack': return 'line';
      case 'defend': return 'shield_wall';
      case 'move': return 'column';
      case 'ambush': return 'line';
    }
    
    return 'line';
  }
  
  /**
   * 진형 정보를 반환합니다.
   */
  getFormationInfo(formation: TWFormation): typeof FORMATION_DETAILS[TWFormation] {
    return FORMATION_DETAILS[formation];
  }
  
  /**
   * 모든 진형 목록을 반환합니다.
   */
  getAllFormations(): TWFormation[] {
    return ['line', 'column', 'square', 'wedge', 'loose', 'testudo', 'shield_wall'];
  }
  
  /**
   * 활성 전환 목록을 반환합니다.
   */
  getActiveTransitions(): FormationTransition[] {
    return Array.from(this.activeTransitions.values());
  }
  
  /**
   * 모든 전환을 정리합니다.
   */
  clearAllTransitions(): void {
    this.activeTransitions.clear();
  }
}

// ========================================
// Export
// ========================================

/** 기본 FormationManager 인스턴스 */
export const formationManager = new FormationManager();

/** 팩토리 함수 */
export function createFormationManager(): FormationManager {
  return new FormationManager();
}

export default FormationManager;





