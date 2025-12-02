/**
 * Animation System - 복셀 유닛 애니메이션 시스템
 * 
 * 이 모듈은 복셀 기반 유닛의 애니메이션을 관리합니다.
 * 
 * 주요 컴포넌트:
 * - AnimationController: 개별 유닛 애니메이션 제어
 * - AnimationMixer: 다중 레이어 애니메이션 믹싱
 * - AnimationClips: 기본 상태 애니메이션
 * - WeaponAnimations: 무기별 공격 애니메이션
 * - SquadSync: 부대 동기화
 */

// ===== Core Exports =====

// AnimationController
export { 
  AnimationController,
  createAnimationControllerFromSpec,
  createSimpleAnimationController,
  interpolateTransforms,
  isMovementState,
  isCombatState,
  isInterruptible,
  type IAnimationController,
  type AnimationControllerConfig,
  type AnimationEventType,
  type AnimationEventCallback,
  type PlayOptions,
  type PartTransform,
  type PartsTransformMap,
} from './AnimationController';

// AnimationMixer
export {
  AnimationMixer,
  createAnimationMixer,
  createLayeredMixer,
  type IAnimationMixer,
  type AnimationMixerConfig,
  type AnimationLayer,
  type BlendMode,
  type AnimationClipInstance,
  type TransitionConfig,
  type EasingCurve,
  type PlayClipOptions,
} from './AnimationMixer';

// AnimationClips
export {
  ANIMATION_CLIPS,
  CLIP_VARIANTS,
  selectClipVariant,
  cloneAnimationSequence,
  scaleAnimationDuration,
  // Individual clips
  IDLE_BASIC,
  IDLE_ALERT,
  IDLE_TIRED,
  WALK_BASIC,
  WALK_CAREFUL,
  RUN_BASIC,
  RUN_SPRINT,
  HIT_BASIC,
  HIT_HEAVY,
  HIT_BLOCK,
  DEATH_BASIC,
  DEATH_FORWARD,
  DEATH_BACKWARD,
  DEFEND_BASIC,
  DEFEND_BRACE,
  CHARGE_CAVALRY,
  CHARGE_INFANTRY,
  RETREAT,
  HORSE_WALK,
  HORSE_RUN,
  HORSE_CHARGE,
  type AnimationClipName,
  type AnimationClipVariant,
} from './AnimationClips';

// WeaponAnimations
export {
  WEAPON_ANIMATION_DATABASE,
  WEAPON_ANIMATION_VARIANTS,
  getWeaponAnimation,
  selectWeaponAnimationVariant,
  getRandomVariant,
  // Individual animations
  SLASH_DIAGONAL,
  SLASH_HORIZONTAL,
  SLASH_UPWARD,
  SLASH_DUAL,
  THRUST_BASIC,
  THRUST_LUNGE,
  THRUST_JI,
  SWING_OVERHEAD,
  SWING_SIDE,
  SWING_SMASH,
  SHOOT_BOW_BASIC,
  SHOOT_BOW_RAPID,
  SHOOT_XBOW_BASIC,
  SHOOT_XBOW_REPEATING,
  THROW_BASIC,
  THROW_JAVELIN,
  CAST_BASIC,
  CAST_FIRE,
  CAST_CURSE,
  CHARGE_LANCE,
  SIEGE_OPERATE,
  type WeaponAnimationVariant,
} from './WeaponAnimations';

// SquadSync
export {
  SquadAnimationSync,
  SquadSyncManager,
  createSquadSync,
  getSquadSyncManager,
  type UnitSyncInfo,
  type SquadSyncConfig,
  type SquadState,
  type SquadEventType,
  type SquadEventCallback,
} from './SquadSync';

// ===== 특수 애니메이션 (Phase 7) =====

import type { VoxelAnimationSequence, VoxelAnimationKeyframe } from '@/components/battle/units/db/VoxelUnitDefinitions';

/** 키프레임 헬퍼 */
function keyframe(
  time: number, 
  transforms: VoxelAnimationKeyframe['transforms'],
  options?: { colorOverlay?: string; scale?: number }
): VoxelAnimationKeyframe {
  return {
    time,
    transforms,
    colorOverlay: options?.colorOverlay,
    scale: options?.scale,
  };
}

// ===== 장수 특기 애니메이션 =====

/** 장수 특기 발동 */
export const GENERAL_SKILL_ACTIVATE: VoxelAnimationSequence = {
  name: 'attack',
  duration: 1500,
  loop: false,
  keyframes: [
    keyframe(0, { 
      torso: { rotX: 0, posY: 0 },
      rightArm: { rotX: 0 },
      head: { rotX: 0 },
    }),
    keyframe(0.15, { 
      torso: { rotX: -0.2, posY: 0.05 },
      rightArm: { rotX: -0.8 },
      head: { rotX: -0.15 },
    }),
    keyframe(0.35, { 
      torso: { rotX: -0.25, posY: 0.08 },
      rightArm: { rotX: -1.0 },
      head: { rotX: -0.2 },
    }, { colorOverlay: '#ffdd00', scale: 1.05 }), // 황금빛
    keyframe(0.5, { 
      torso: { rotX: -0.3, posY: 0.1 },
      rightArm: { rotX: -1.1 },
      head: { rotX: -0.25 },
    }, { colorOverlay: '#ffff66', scale: 1.08 }),
    keyframe(0.65, { 
      torso: { rotX: 0.2, posY: -0.02 },
      rightArm: { rotX: 0.5 },
      head: { rotX: 0.1 },
    }, { colorOverlay: '#ffffff', scale: 1.1 }), // 발동!
    keyframe(0.8, { 
      torso: { rotX: 0.1, posY: 0 },
      rightArm: { rotX: 0.2 },
      head: { rotX: 0.05 },
    }),
    keyframe(1, { 
      torso: { rotX: 0, posY: 0 },
      rightArm: { rotX: 0 },
      head: { rotX: 0 },
    }),
  ],
};

/** 장수 시전 (책사 특기) */
export const GENERAL_CAST: VoxelAnimationSequence = {
  name: 'attack',
  duration: 2000,
  loop: false,
  keyframes: [
    keyframe(0, { 
      torso: { rotX: 0, posY: 0 },
      rightArm: { rotX: 0 },
      leftArm: { rotX: 0 },
    }),
    keyframe(0.2, { 
      torso: { rotX: -0.15, posY: 0.03 },
      rightArm: { rotX: -0.6 },
      leftArm: { rotX: -0.6 },
    }, { colorOverlay: '#4444ff' }),
    keyframe(0.4, { 
      torso: { rotX: -0.25, posY: 0.05 },
      rightArm: { rotX: -0.9 },
      leftArm: { rotX: -0.9 },
    }, { colorOverlay: '#6666ff' }),
    keyframe(0.6, { 
      torso: { rotX: -0.3, posY: 0.06 },
      rightArm: { rotX: -1.0 },
      leftArm: { rotX: -1.0 },
    }, { colorOverlay: '#8888ff', scale: 1.05 }),
    keyframe(0.75, { 
      torso: { rotX: 0.15, posY: -0.02 },
      rightArm: { rotX: 0.4 },
      leftArm: { rotX: 0.4 },
    }, { colorOverlay: '#aaaaff', scale: 1.08 }),
    keyframe(0.85, { 
      torso: { rotX: 0.08, posY: 0 },
      rightArm: { rotX: 0.2 },
      leftArm: { rotX: 0.2 },
    }),
    keyframe(1, { 
      torso: { rotX: 0, posY: 0 },
      rightArm: { rotX: 0 },
      leftArm: { rotX: 0 },
    }),
  ],
};

// ===== 깃발 애니메이션 =====

/** 깃발 흔들림 */
export const FLAG_WAVE: VoxelAnimationSequence = {
  name: 'idle',
  duration: 1500,
  loop: true,
  keyframes: [
    keyframe(0, { 
      weapon: { rotX: 0, rotY: 0, rotZ: 0 },
    }),
    keyframe(0.15, { 
      weapon: { rotX: 0.05, rotY: 0.1, rotZ: -0.08 },
    }),
    keyframe(0.35, { 
      weapon: { rotX: -0.03, rotY: -0.12, rotZ: 0.1 },
    }),
    keyframe(0.5, { 
      weapon: { rotX: 0.08, rotY: 0.08, rotZ: -0.05 },
    }),
    keyframe(0.7, { 
      weapon: { rotX: -0.05, rotY: -0.15, rotZ: 0.12 },
    }),
    keyframe(0.85, { 
      weapon: { rotX: 0.03, rotY: 0.05, rotZ: -0.03 },
    }),
    keyframe(1, { 
      weapon: { rotX: 0, rotY: 0, rotZ: 0 },
    }),
  ],
};

/** 깃발 휘두름 (승리/돌격) */
export const FLAG_SWING: VoxelAnimationSequence = {
  name: 'attack',
  duration: 800,
  loop: false,
  keyframes: [
    keyframe(0, { 
      rightArm: { rotX: -0.3 },
      weapon: { rotX: -0.2, rotZ: 0 },
    }),
    keyframe(0.25, { 
      rightArm: { rotX: -0.8 },
      weapon: { rotX: -0.7, rotZ: -0.3 },
    }),
    keyframe(0.5, { 
      rightArm: { rotX: 0.4 },
      weapon: { rotX: 0.5, rotZ: 0.4 },
    }),
    keyframe(0.75, { 
      rightArm: { rotX: -0.5 },
      weapon: { rotX: -0.4, rotZ: -0.2 },
    }),
    keyframe(1, { 
      rightArm: { rotX: -0.3 },
      weapon: { rotX: -0.2, rotZ: 0 },
    }),
  ],
};

// ===== 북 애니메이션 =====

/** 북 치기 */
export const DRUM_BEAT: VoxelAnimationSequence = {
  name: 'attack',
  duration: 400,
  loop: true,
  keyframes: [
    keyframe(0, { 
      rightArm: { rotX: -0.5, rotZ: 0 },
      leftArm: { rotX: 0.2, rotZ: 0 },
    }),
    keyframe(0.3, { 
      rightArm: { rotX: 0.3, rotZ: 0.1 }, // 내려침
      leftArm: { rotX: -0.5, rotZ: -0.1 },
    }),
    keyframe(0.5, { 
      rightArm: { rotX: 0.2, rotZ: 0 },
      leftArm: { rotX: 0.3, rotZ: 0.1 }, // 왼손 내려침
    }),
    keyframe(0.8, { 
      rightArm: { rotX: -0.5, rotZ: 0 },
      leftArm: { rotX: 0.2, rotZ: 0 },
    }),
    keyframe(1, { 
      rightArm: { rotX: -0.5, rotZ: 0 },
      leftArm: { rotX: 0.2, rotZ: 0 },
    }),
  ],
};

/** 북 연주 (빠른 템포) */
export const DRUM_RAPID: VoxelAnimationSequence = {
  name: 'attack',
  duration: 250,
  loop: true,
  keyframes: [
    keyframe(0, { 
      rightArm: { rotX: -0.4 },
      leftArm: { rotX: 0.2 },
    }),
    keyframe(0.25, { 
      rightArm: { rotX: 0.25 },
      leftArm: { rotX: -0.4 },
    }),
    keyframe(0.5, { 
      rightArm: { rotX: -0.4 },
      leftArm: { rotX: 0.25 },
    }),
    keyframe(0.75, { 
      rightArm: { rotX: 0.2 },
      leftArm: { rotX: -0.4 },
    }),
    keyframe(1, { 
      rightArm: { rotX: -0.4 },
      leftArm: { rotX: 0.2 },
    }),
  ],
};

// ===== 특수 애니메이션 데이터베이스 =====

export const SPECIAL_ANIMATIONS = {
  // 장수 특기
  generalSkill: GENERAL_SKILL_ACTIVATE,
  generalCast: GENERAL_CAST,
  
  // 깃발
  flagWave: FLAG_WAVE,
  flagSwing: FLAG_SWING,
  
  // 북
  drumBeat: DRUM_BEAT,
  drumRapid: DRUM_RAPID,
};

// ===== 최적화 시스템 (Phase 8) =====

/** LOD 레벨 */
export type LODLevel = 0 | 1 | 2 | 3;

/** LOD 설정 */
export interface LODConfig {
  /** 거리 임계값 (유닛 단위) */
  distances: [number, number, number]; // LOD 1, 2, 3 전환 거리
  /** LOD별 업데이트 간격 (ms) */
  updateIntervals: [number, number, number, number]; // LOD 0~3
  /** LOD별 키프레임 스킵 */
  keyframeSkip: [number, number, number, number]; // 0, 1, 2, 4 등
}

const DEFAULT_LOD_CONFIG: LODConfig = {
  distances: [30, 60, 100],
  updateIntervals: [16, 32, 64, 128], // 60fps, 30fps, 15fps, 8fps
  keyframeSkip: [0, 1, 2, 4],
};

/** 애니메이션 최적화 매니저 */
export class AnimationOptimizer {
  private config: LODConfig;
  private lastUpdateTimes: Map<string, number> = new Map();
  private visibleUnits: Set<string> = new Set();
  private lodLevels: Map<string, LODLevel> = new Map();
  
  constructor(config: Partial<LODConfig> = {}) {
    this.config = { ...DEFAULT_LOD_CONFIG, ...config };
  }
  
  /** 유닛의 LOD 레벨 계산 */
  calculateLOD(unitId: string, distanceToCamera: number): LODLevel {
    const { distances } = this.config;
    
    if (distanceToCamera <= distances[0]) return 0;
    if (distanceToCamera <= distances[1]) return 1;
    if (distanceToCamera <= distances[2]) return 2;
    return 3;
  }
  
  /** LOD 레벨 설정 */
  setLOD(unitId: string, level: LODLevel): void {
    this.lodLevels.set(unitId, level);
  }
  
  /** LOD 레벨 가져오기 */
  getLOD(unitId: string): LODLevel {
    return this.lodLevels.get(unitId) ?? 0;
  }
  
  /** 유닛 가시성 설정 */
  setVisible(unitId: string, visible: boolean): void {
    if (visible) {
      this.visibleUnits.add(unitId);
    } else {
      this.visibleUnits.delete(unitId);
    }
  }
  
  /** 유닛이 가시적인지 확인 */
  isVisible(unitId: string): boolean {
    return this.visibleUnits.has(unitId);
  }
  
  /** 유닛 업데이트 필요 여부 확인 */
  shouldUpdate(unitId: string, currentTime: number): boolean {
    // 화면 밖이면 업데이트 안함
    if (!this.isVisible(unitId)) {
      return false;
    }
    
    const lastUpdate = this.lastUpdateTimes.get(unitId) ?? 0;
    const lodLevel = this.getLOD(unitId);
    const interval = this.config.updateIntervals[lodLevel];
    
    if (currentTime - lastUpdate >= interval) {
      this.lastUpdateTimes.set(unitId, currentTime);
      return true;
    }
    
    return false;
  }
  
  /** LOD별 애니메이션 진행률 조정 */
  adjustProgress(progress: number, lodLevel: LODLevel): number {
    const skip = this.config.keyframeSkip[lodLevel];
    
    if (skip <= 0) return progress;
    
    // 키프레임 스킵으로 단순화
    const steps = 1 / (skip + 1);
    return Math.floor(progress / steps) * steps;
  }
  
  /** 최적화 통계 */
  getStats(): {
    totalUnits: number;
    visibleUnits: number;
    lodDistribution: Record<LODLevel, number>;
  } {
    const lodDistribution: Record<LODLevel, number> = { 0: 0, 1: 0, 2: 0, 3: 0 };
    
    for (const level of this.lodLevels.values()) {
      lodDistribution[level]++;
    }
    
    return {
      totalUnits: this.lodLevels.size,
      visibleUnits: this.visibleUnits.size,
      lodDistribution,
    };
  }
  
  /** 유닛 정리 */
  removeUnit(unitId: string): void {
    this.lastUpdateTimes.delete(unitId);
    this.visibleUnits.delete(unitId);
    this.lodLevels.delete(unitId);
  }
  
  /** 전체 정리 */
  clear(): void {
    this.lastUpdateTimes.clear();
    this.visibleUnits.clear();
    this.lodLevels.clear();
  }
}

/** 배치 업데이트 매니저 */
export class BatchAnimationUpdater {
  private controllers: Map<string, import('./AnimationController').AnimationController> = new Map();
  private updateQueue: string[] = [];
  private batchSize: number = 50;
  private optimizer: AnimationOptimizer;
  
  constructor(batchSize: number = 50, optimizer?: AnimationOptimizer) {
    this.batchSize = batchSize;
    this.optimizer = optimizer ?? new AnimationOptimizer();
  }
  
  /** 컨트롤러 등록 */
  register(unitId: string, controller: import('./AnimationController').AnimationController): void {
    this.controllers.set(unitId, controller);
    this.updateQueue.push(unitId);
  }
  
  /** 컨트롤러 제거 */
  unregister(unitId: string): void {
    this.controllers.delete(unitId);
    this.updateQueue = this.updateQueue.filter(id => id !== unitId);
    this.optimizer.removeUnit(unitId);
  }
  
  /** 배치 업데이트 */
  update(deltaTime: number): void {
    const now = performance.now();
    let updatedCount = 0;
    
    // 큐 순서대로 업데이트
    for (let i = 0; i < this.updateQueue.length && updatedCount < this.batchSize; i++) {
      const unitId = this.updateQueue[i];
      
      // 최적화 체크
      if (!this.optimizer.shouldUpdate(unitId, now)) {
        continue;
      }
      
      const controller = this.controllers.get(unitId);
      if (controller) {
        controller.update(deltaTime);
        updatedCount++;
      }
    }
    
    // 큐 회전 (라운드 로빈)
    if (this.updateQueue.length > 0) {
      const head = this.updateQueue.shift()!;
      this.updateQueue.push(head);
    }
  }
  
  /** 유닛 가시성 업데이트 */
  updateVisibility(visibleUnitIds: Set<string>): void {
    for (const unitId of this.controllers.keys()) {
      this.optimizer.setVisible(unitId, visibleUnitIds.has(unitId));
    }
  }
  
  /** LOD 업데이트 */
  updateLOD(unitId: string, distanceToCamera: number): void {
    const level = this.optimizer.calculateLOD(unitId, distanceToCamera);
    this.optimizer.setLOD(unitId, level);
  }
  
  /** 통계 */
  getStats(): ReturnType<AnimationOptimizer['getStats']> & { queueSize: number } {
    return {
      ...this.optimizer.getStats(),
      queueSize: this.updateQueue.length,
    };
  }
  
  /** 정리 */
  dispose(): void {
    for (const controller of this.controllers.values()) {
      controller.dispose();
    }
    this.controllers.clear();
    this.updateQueue = [];
    this.optimizer.clear();
  }
}

// ===== 싱글톤 인스턴스 =====

let globalOptimizer: AnimationOptimizer | null = null;
let globalBatchUpdater: BatchAnimationUpdater | null = null;

export function getAnimationOptimizer(): AnimationOptimizer {
  if (!globalOptimizer) {
    globalOptimizer = new AnimationOptimizer();
  }
  return globalOptimizer;
}

export function getBatchAnimationUpdater(): BatchAnimationUpdater {
  if (!globalBatchUpdater) {
    globalBatchUpdater = new BatchAnimationUpdater();
  }
  return globalBatchUpdater;
}

// ===== 편의 함수 =====

/** 빠른 애니메이션 컨트롤러 생성 */
export function quickController(
  category: 'infantry' | 'ranged' | 'cavalry' | 'wizard' | 'siege',
  options?: Partial<import('./AnimationController').AnimationControllerConfig>
): import('./AnimationController').AnimationController {
  const { AnimationController } = require('./AnimationController');
  return new AnimationController({
    category,
    ...options,
  });
}

/** 애니메이션 시스템 전체 정리 */
export function disposeAnimationSystem(): void {
  if (globalOptimizer) {
    globalOptimizer.clear();
    globalOptimizer = null;
  }
  if (globalBatchUpdater) {
    globalBatchUpdater.dispose();
    globalBatchUpdater = null;
  }
  
  // SquadSync 매니저도 정리
  const { getSquadSyncManager } = require('./SquadSync');
  getSquadSyncManager().dispose();
}

export default {
  AnimationController: require('./AnimationController').AnimationController,
  AnimationMixer: require('./AnimationMixer').AnimationMixer,
  SquadAnimationSync: require('./SquadSync').SquadAnimationSync,
  AnimationOptimizer,
  BatchAnimationUpdater,
};





