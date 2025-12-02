/**
 * AnimationClips.ts
 * 기본 상태 애니메이션 클립 정의
 * 
 * 포함 애니메이션:
 * - idle: 대기 (호흡 움직임, 무기 흔들림)
 * - walk: 걷기 (다리 교차, 팔 스윙, 몸통 상하)
 * - run: 달리기 (빠른 다리 교차, 앞으로 기울임)
 * - hit: 피격 (뒤로 밀림, 붉은 플래시)
 * - death: 사망 (쓰러짐, 회색화)
 * - defend: 방어 (방패 들기, 웅크리기)
 * - charge: 돌격 (기병용)
 */

import type { VoxelAnimationSequence, VoxelAnimationKeyframe } from '@/components/battle/units/db/VoxelUnitDefinitions';

// ===== 타입 정의 =====

export type AnimationClipName = 
  | 'idle'
  | 'idle_alert'
  | 'idle_tired'
  | 'walk'
  | 'walk_careful'
  | 'run'
  | 'run_sprint'
  | 'hit'
  | 'hit_heavy'
  | 'hit_block'
  | 'death'
  | 'death_forward'
  | 'death_backward'
  | 'defend'
  | 'defend_brace'
  | 'charge'
  | 'charge_cavalry'
  | 'retreat';

export interface AnimationClipVariant {
  name: AnimationClipName;
  sequence: VoxelAnimationSequence;
  /** 이 변형이 적합한 조건 */
  condition?: {
    /** 기병 여부 */
    mounted?: boolean;
    /** 방패 장착 여부 */
    hasShield?: boolean;
    /** 무기 타입 */
    weaponType?: string[];
    /** 사기 범위 */
    moraleRange?: [number, number];
    /** 체력 비율 범위 */
    healthRange?: [number, number];
  };
}

// ===== 키프레임 헬퍼 함수 =====

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

// ===== IDLE 애니메이션 =====

/** 기본 대기 - 미세한 호흡 효과 */
export const IDLE_BASIC: VoxelAnimationSequence = {
  name: 'idle',
  duration: 2000,
  loop: true,
  keyframes: [
    keyframe(0, { 
      torso: { posY: 0 }, 
      head: { rotX: 0 },
      weapon: { rotZ: 0 },
    }),
    keyframe(0.25, { 
      torso: { posY: 0.01 }, 
      head: { rotX: -0.02 },
      weapon: { rotZ: 0.01 },
    }),
    keyframe(0.5, { 
      torso: { posY: 0.02 }, 
      head: { rotX: -0.05 },
      weapon: { rotZ: 0.02 },
    }),
    keyframe(0.75, { 
      torso: { posY: 0.01 }, 
      head: { rotX: -0.02 },
      weapon: { rotZ: 0.01 },
    }),
    keyframe(1, { 
      torso: { posY: 0 }, 
      head: { rotX: 0 },
      weapon: { rotZ: 0 },
    }),
  ],
};

/** 경계 대기 - 적 근처에서 긴장 */
export const IDLE_ALERT: VoxelAnimationSequence = {
  name: 'idle',
  duration: 1500,
  loop: true,
  keyframes: [
    keyframe(0, { 
      torso: { posY: 0, rotX: -0.05 }, 
      head: { rotX: 0, rotY: 0 },
      rightArm: { rotX: -0.1 },
      weapon: { rotX: -0.1 },
    }),
    keyframe(0.3, { 
      torso: { posY: 0.01, rotX: -0.05 }, 
      head: { rotX: -0.05, rotY: 0.1 },
      rightArm: { rotX: -0.12 },
      weapon: { rotX: -0.12 },
    }),
    keyframe(0.5, { 
      torso: { posY: 0.015, rotX: -0.05 }, 
      head: { rotX: -0.03, rotY: -0.1 },
      rightArm: { rotX: -0.1 },
      weapon: { rotX: -0.1 },
    }),
    keyframe(0.7, { 
      torso: { posY: 0.01, rotX: -0.05 }, 
      head: { rotX: -0.05, rotY: 0.05 },
      rightArm: { rotX: -0.12 },
      weapon: { rotX: -0.12 },
    }),
    keyframe(1, { 
      torso: { posY: 0, rotX: -0.05 }, 
      head: { rotX: 0, rotY: 0 },
      rightArm: { rotX: -0.1 },
      weapon: { rotX: -0.1 },
    }),
  ],
};

/** 피로 대기 - 사기 낮을 때 */
export const IDLE_TIRED: VoxelAnimationSequence = {
  name: 'idle',
  duration: 2500,
  loop: true,
  keyframes: [
    keyframe(0, { 
      torso: { posY: -0.02, rotX: 0.1 }, // 앞으로 숙임
      head: { rotX: 0.15 }, // 고개 숙임
      rightArm: { rotZ: 0.2 }, // 팔 늘어뜨림
      leftArm: { rotZ: -0.2 },
      weapon: { rotZ: 0.3 },
    }),
    keyframe(0.5, { 
      torso: { posY: -0.01, rotX: 0.08 },
      head: { rotX: 0.12 },
      rightArm: { rotZ: 0.18 },
      leftArm: { rotZ: -0.18 },
      weapon: { rotZ: 0.28 },
    }),
    keyframe(1, { 
      torso: { posY: -0.02, rotX: 0.1 },
      head: { rotX: 0.15 },
      rightArm: { rotZ: 0.2 },
      leftArm: { rotZ: -0.2 },
      weapon: { rotZ: 0.3 },
    }),
  ],
};

// ===== WALK 애니메이션 =====

/** 기본 걷기 */
export const WALK_BASIC: VoxelAnimationSequence = {
  name: 'walk',
  duration: 800,
  loop: true,
  keyframes: [
    keyframe(0, { 
      rightLeg: { rotX: 0.4 }, 
      leftLeg: { rotX: -0.4 },
      rightArm: { rotX: -0.3 }, 
      leftArm: { rotX: 0.3 },
      torso: { posY: 0, rotY: 0.02 },
      weapon: { rotX: -0.1 },
    }),
    keyframe(0.25, { 
      rightLeg: { rotX: 0 }, 
      leftLeg: { rotX: 0 },
      rightArm: { rotX: 0 }, 
      leftArm: { rotX: 0 },
      torso: { posY: 0.02, rotY: 0 },
      weapon: { rotX: 0 },
    }),
    keyframe(0.5, { 
      rightLeg: { rotX: -0.4 }, 
      leftLeg: { rotX: 0.4 },
      rightArm: { rotX: 0.3 }, 
      leftArm: { rotX: -0.3 },
      torso: { posY: 0, rotY: -0.02 },
      weapon: { rotX: 0.1 },
    }),
    keyframe(0.75, { 
      rightLeg: { rotX: 0 }, 
      leftLeg: { rotX: 0 },
      rightArm: { rotX: 0 }, 
      leftArm: { rotX: 0 },
      torso: { posY: 0.02, rotY: 0 },
      weapon: { rotX: 0 },
    }),
    keyframe(1, { 
      rightLeg: { rotX: 0.4 }, 
      leftLeg: { rotX: -0.4 },
      rightArm: { rotX: -0.3 }, 
      leftArm: { rotX: 0.3 },
      torso: { posY: 0, rotY: 0.02 },
      weapon: { rotX: -0.1 },
    }),
  ],
};

/** 신중한 걷기 - 방패 들고 */
export const WALK_CAREFUL: VoxelAnimationSequence = {
  name: 'walk',
  duration: 1000,
  loop: true,
  keyframes: [
    keyframe(0, { 
      rightLeg: { rotX: 0.3 }, 
      leftLeg: { rotX: -0.3 },
      rightArm: { rotX: -0.2 },
      leftArm: { rotX: -0.3, rotZ: 0.5 }, // 방패 들기
      torso: { posY: 0, rotX: 0.05 },
      shield: { rotY: -0.2 },
    }),
    keyframe(0.25, { 
      rightLeg: { rotX: 0 }, 
      leftLeg: { rotX: 0 },
      rightArm: { rotX: 0 },
      leftArm: { rotX: -0.3, rotZ: 0.5 },
      torso: { posY: 0.015, rotX: 0.05 },
      shield: { rotY: -0.2 },
    }),
    keyframe(0.5, { 
      rightLeg: { rotX: -0.3 }, 
      leftLeg: { rotX: 0.3 },
      rightArm: { rotX: 0.2 },
      leftArm: { rotX: -0.3, rotZ: 0.5 },
      torso: { posY: 0, rotX: 0.05 },
      shield: { rotY: -0.2 },
    }),
    keyframe(0.75, { 
      rightLeg: { rotX: 0 }, 
      leftLeg: { rotX: 0 },
      rightArm: { rotX: 0 },
      leftArm: { rotX: -0.3, rotZ: 0.5 },
      torso: { posY: 0.015, rotX: 0.05 },
      shield: { rotY: -0.2 },
    }),
    keyframe(1, { 
      rightLeg: { rotX: 0.3 }, 
      leftLeg: { rotX: -0.3 },
      rightArm: { rotX: -0.2 },
      leftArm: { rotX: -0.3, rotZ: 0.5 },
      torso: { posY: 0, rotX: 0.05 },
      shield: { rotY: -0.2 },
    }),
  ],
};

// ===== RUN 애니메이션 =====

/** 기본 달리기 */
export const RUN_BASIC: VoxelAnimationSequence = {
  name: 'run',
  duration: 500,
  loop: true,
  keyframes: [
    keyframe(0, { 
      rightLeg: { rotX: 0.7 }, 
      leftLeg: { rotX: -0.6 },
      rightArm: { rotX: -0.5 }, 
      leftArm: { rotX: 0.5 },
      torso: { posY: 0, rotX: -0.15 }, // 앞으로 기울임
      head: { rotX: 0.1 },
      weapon: { rotX: -0.2 },
    }),
    keyframe(0.15, { 
      rightLeg: { rotX: 0.2 }, 
      leftLeg: { rotX: -0.1 },
      rightArm: { rotX: -0.1 }, 
      leftArm: { rotX: 0.1 },
      torso: { posY: 0.04, rotX: -0.15 }, // 뛰는 순간
      head: { rotX: 0.1 },
      weapon: { rotX: 0 },
    }),
    keyframe(0.5, { 
      rightLeg: { rotX: -0.6 }, 
      leftLeg: { rotX: 0.7 },
      rightArm: { rotX: 0.5 }, 
      leftArm: { rotX: -0.5 },
      torso: { posY: 0, rotX: -0.15 },
      head: { rotX: 0.1 },
      weapon: { rotX: 0.2 },
    }),
    keyframe(0.65, { 
      rightLeg: { rotX: -0.1 }, 
      leftLeg: { rotX: 0.2 },
      rightArm: { rotX: 0.1 }, 
      leftArm: { rotX: -0.1 },
      torso: { posY: 0.04, rotX: -0.15 },
      head: { rotX: 0.1 },
      weapon: { rotX: 0 },
    }),
    keyframe(1, { 
      rightLeg: { rotX: 0.7 }, 
      leftLeg: { rotX: -0.6 },
      rightArm: { rotX: -0.5 }, 
      leftArm: { rotX: 0.5 },
      torso: { posY: 0, rotX: -0.15 },
      head: { rotX: 0.1 },
      weapon: { rotX: -0.2 },
    }),
  ],
};

/** 전력 질주 - 최대 속도 */
export const RUN_SPRINT: VoxelAnimationSequence = {
  name: 'run',
  duration: 400,
  loop: true,
  keyframes: [
    keyframe(0, { 
      rightLeg: { rotX: 0.9 }, 
      leftLeg: { rotX: -0.8 },
      rightArm: { rotX: -0.7 }, 
      leftArm: { rotX: 0.7 },
      torso: { posY: 0, rotX: -0.25 }, // 더 많이 기울임
      head: { rotX: 0.15 },
    }),
    keyframe(0.15, { 
      rightLeg: { rotX: 0.3 }, 
      leftLeg: { rotX: -0.2 },
      rightArm: { rotX: -0.2 }, 
      leftArm: { rotX: 0.2 },
      torso: { posY: 0.06, rotX: -0.25 },
      head: { rotX: 0.15 },
    }),
    keyframe(0.5, { 
      rightLeg: { rotX: -0.8 }, 
      leftLeg: { rotX: 0.9 },
      rightArm: { rotX: 0.7 }, 
      leftArm: { rotX: -0.7 },
      torso: { posY: 0, rotX: -0.25 },
      head: { rotX: 0.15 },
    }),
    keyframe(0.65, { 
      rightLeg: { rotX: -0.2 }, 
      leftLeg: { rotX: 0.3 },
      rightArm: { rotX: 0.2 }, 
      leftArm: { rotX: -0.2 },
      torso: { posY: 0.06, rotX: -0.25 },
      head: { rotX: 0.15 },
    }),
    keyframe(1, { 
      rightLeg: { rotX: 0.9 }, 
      leftLeg: { rotX: -0.8 },
      rightArm: { rotX: -0.7 }, 
      leftArm: { rotX: 0.7 },
      torso: { posY: 0, rotX: -0.25 },
      head: { rotX: 0.15 },
    }),
  ],
};

// ===== HIT 애니메이션 =====

/** 기본 피격 */
export const HIT_BASIC: VoxelAnimationSequence = {
  name: 'hit',
  duration: 400,
  loop: false,
  keyframes: [
    keyframe(0, { 
      torso: { rotX: 0, posY: 0 },
      head: { rotX: 0 },
    }),
    keyframe(0.15, { 
      torso: { rotX: -0.25, posY: 0.02 }, // 뒤로 젖힘
      head: { rotX: -0.3 },
    }, { colorOverlay: '#ff0000' }), // 붉은 플래시
    keyframe(0.3, { 
      torso: { rotX: -0.15, posY: 0.01 },
      head: { rotX: -0.15 },
    }, { colorOverlay: '#ff6666' }),
    keyframe(0.6, { 
      torso: { rotX: -0.05, posY: 0 },
      head: { rotX: -0.05 },
    }, { colorOverlay: '#ffaaaa' }),
    keyframe(1, { 
      torso: { rotX: 0, posY: 0 },
      head: { rotX: 0 },
    }),
  ],
};

/** 강한 피격 - 큰 데미지 */
export const HIT_HEAVY: VoxelAnimationSequence = {
  name: 'hit',
  duration: 600,
  loop: false,
  keyframes: [
    keyframe(0, { 
      torso: { rotX: 0, rotZ: 0, posY: 0 },
      head: { rotX: 0 },
      rightArm: { rotZ: 0 },
      leftArm: { rotZ: 0 },
    }),
    keyframe(0.1, { 
      torso: { rotX: -0.35, rotZ: 0.1, posY: 0.03 },
      head: { rotX: -0.4 },
      rightArm: { rotZ: 0.3 },
      leftArm: { rotZ: -0.3 },
    }, { colorOverlay: '#ff0000', scale: 1.02 }),
    keyframe(0.25, { 
      torso: { rotX: -0.3, rotZ: 0.15, posY: 0.02 },
      head: { rotX: -0.35 },
      rightArm: { rotZ: 0.4 },
      leftArm: { rotZ: -0.4 },
    }, { colorOverlay: '#cc0000' }),
    keyframe(0.5, { 
      torso: { rotX: -0.1, rotZ: 0.05, posY: 0.01 },
      head: { rotX: -0.1 },
      rightArm: { rotZ: 0.15 },
      leftArm: { rotZ: -0.15 },
    }, { colorOverlay: '#ff6666' }),
    keyframe(1, { 
      torso: { rotX: 0, rotZ: 0, posY: 0 },
      head: { rotX: 0 },
      rightArm: { rotZ: 0 },
      leftArm: { rotZ: 0 },
    }),
  ],
};

/** 방패 막기 피격 */
export const HIT_BLOCK: VoxelAnimationSequence = {
  name: 'hit',
  duration: 350,
  loop: false,
  keyframes: [
    keyframe(0, { 
      torso: { rotX: 0.1, posY: -0.01 },
      leftArm: { rotX: -0.4, rotZ: 0.7 },
      shield: { rotY: -0.2 },
    }),
    keyframe(0.15, { 
      torso: { rotX: 0.15, posY: -0.02 },
      leftArm: { rotX: -0.5, rotZ: 0.8 },
      shield: { rotY: -0.3 },
    }, { colorOverlay: '#ffff00' }), // 노란 스파크
    keyframe(0.4, { 
      torso: { rotX: 0.12, posY: -0.015 },
      leftArm: { rotX: -0.45, rotZ: 0.75 },
      shield: { rotY: -0.25 },
    }),
    keyframe(1, { 
      torso: { rotX: 0.1, posY: -0.01 },
      leftArm: { rotX: -0.4, rotZ: 0.7 },
      shield: { rotY: -0.2 },
    }),
  ],
};

// ===== DEATH 애니메이션 =====

/** 기본 사망 - 옆으로 쓰러짐 */
export const DEATH_BASIC: VoxelAnimationSequence = {
  name: 'death',
  duration: 800,
  loop: false,
  keyframes: [
    keyframe(0, { 
      torso: { rotX: 0, rotZ: 0, posY: 0 },
      head: { rotX: 0 },
      rightArm: { rotZ: 0 },
      leftArm: { rotZ: 0 },
      rightLeg: { rotX: 0 },
      leftLeg: { rotX: 0 },
    }, { scale: 1 }),
    keyframe(0.2, { 
      torso: { rotX: 0.1, rotZ: 0.3, posY: -0.01 },
      head: { rotX: -0.2 },
      rightArm: { rotZ: 0.3 },
      leftArm: { rotZ: -0.2 },
      rightLeg: { rotX: 0.1 },
      leftLeg: { rotX: -0.1 },
    }, { scale: 1 }),
    keyframe(0.5, { 
      torso: { rotX: 0.3, rotZ: 0.9, posY: -0.06 },
      head: { rotX: -0.4 },
      rightArm: { rotZ: 0.7 },
      leftArm: { rotZ: -0.4 },
      rightLeg: { rotX: 0.3 },
      leftLeg: { rotX: -0.2 },
    }, { scale: 0.97 }),
    keyframe(0.7, { 
      torso: { rotX: 0.4, rotZ: 1.3, posY: -0.1 },
      head: { rotX: -0.5 },
      rightArm: { rotZ: 1.0 },
      leftArm: { rotZ: -0.5 },
      rightLeg: { rotX: 0.4 },
      leftLeg: { rotX: -0.3 },
    }, { scale: 0.94 }),
    keyframe(1, { 
      torso: { rotX: 0.5, rotZ: 1.57, posY: -0.12 }, // 완전히 옆으로 누움
      head: { rotX: -0.6 },
      rightArm: { rotZ: 1.2 },
      leftArm: { rotZ: -0.6 },
      rightLeg: { rotX: 0.5 },
      leftLeg: { rotX: -0.4 },
    }, { scale: 0.9, colorOverlay: '#666666' }), // 회색빛
  ],
};

/** 앞으로 쓰러짐 - 돌격 중 사망 */
export const DEATH_FORWARD: VoxelAnimationSequence = {
  name: 'death',
  duration: 700,
  loop: false,
  keyframes: [
    keyframe(0, { 
      torso: { rotX: -0.15, rotZ: 0, posY: 0 },
      head: { rotX: 0.1 },
      rightArm: { rotX: -0.3 },
      leftArm: { rotX: -0.3 },
    }, { scale: 1 }),
    keyframe(0.15, { 
      torso: { rotX: 0.1, rotZ: 0.1, posY: 0.02 },
      head: { rotX: -0.2 },
      rightArm: { rotX: 0, rotZ: 0.3 },
      leftArm: { rotX: 0, rotZ: -0.3 },
    }, { colorOverlay: '#ff0000' }),
    keyframe(0.4, { 
      torso: { rotX: 0.6, rotZ: 0.15, posY: -0.03 },
      head: { rotX: 0.3 },
      rightArm: { rotX: 0.5, rotZ: 0.5 },
      leftArm: { rotX: 0.5, rotZ: -0.5 },
    }, { scale: 0.96 }),
    keyframe(0.7, { 
      torso: { rotX: 1.2, rotZ: 0.2, posY: -0.1 },
      head: { rotX: 0.5 },
      rightArm: { rotX: 1.0, rotZ: 0.6 },
      leftArm: { rotX: 1.0, rotZ: -0.6 },
    }, { scale: 0.92 }),
    keyframe(1, { 
      torso: { rotX: 1.57, rotZ: 0.2, posY: -0.14 }, // 엎드림
      head: { rotX: 0.6 },
      rightArm: { rotX: 1.2, rotZ: 0.7 },
      leftArm: { rotX: 1.2, rotZ: -0.7 },
    }, { scale: 0.88, colorOverlay: '#666666' }),
  ],
};

/** 뒤로 쓰러짐 - 강한 충격 */
export const DEATH_BACKWARD: VoxelAnimationSequence = {
  name: 'death',
  duration: 750,
  loop: false,
  keyframes: [
    keyframe(0, { 
      torso: { rotX: 0, rotZ: 0, posY: 0 },
      head: { rotX: 0 },
      rightArm: { rotZ: 0 },
      leftArm: { rotZ: 0 },
    }, { scale: 1 }),
    keyframe(0.1, { 
      torso: { rotX: -0.2, rotZ: -0.05, posY: 0.02 },
      head: { rotX: -0.3 },
      rightArm: { rotZ: 0.4 },
      leftArm: { rotZ: -0.4 },
    }, { colorOverlay: '#ff0000', scale: 1.02 }),
    keyframe(0.35, { 
      torso: { rotX: -0.6, rotZ: -0.1, posY: -0.02 },
      head: { rotX: -0.5 },
      rightArm: { rotZ: 0.8 },
      leftArm: { rotZ: -0.8 },
    }, { scale: 0.97 }),
    keyframe(0.6, { 
      torso: { rotX: -1.1, rotZ: -0.15, posY: -0.08 },
      head: { rotX: -0.7 },
      rightArm: { rotZ: 1.1 },
      leftArm: { rotZ: -1.1 },
    }, { scale: 0.93 }),
    keyframe(1, { 
      torso: { rotX: -1.57, rotZ: -0.2, posY: -0.13 }, // 등을 땅에
      head: { rotX: -0.8 },
      rightArm: { rotZ: 1.3 },
      leftArm: { rotZ: -1.3 },
    }, { scale: 0.88, colorOverlay: '#666666' }),
  ],
};

// ===== DEFEND 애니메이션 =====

/** 기본 방어 */
export const DEFEND_BASIC: VoxelAnimationSequence = {
  name: 'defend',
  duration: 400,
  loop: false,
  keyframes: [
    keyframe(0, { 
      leftArm: { rotX: 0, rotZ: 0 },
      shield: { rotY: 0 },
      torso: { rotX: 0, posY: 0 },
    }),
    keyframe(0.3, { 
      leftArm: { rotX: -0.5, rotZ: 0.8 }, // 방패 들어올림
      shield: { rotY: -0.3 },
      torso: { rotX: 0.2, posY: -0.03 }, // 살짝 웅크림
    }),
    keyframe(1, { 
      leftArm: { rotX: -0.5, rotZ: 0.8 },
      shield: { rotY: -0.3 },
      torso: { rotX: 0.2, posY: -0.03 },
    }),
  ],
};

/** 버티기 방어 - 강한 공격에 대비 */
export const DEFEND_BRACE: VoxelAnimationSequence = {
  name: 'defend',
  duration: 500,
  loop: false,
  keyframes: [
    keyframe(0, { 
      leftArm: { rotX: 0, rotZ: 0 },
      rightArm: { rotX: 0 },
      shield: { rotY: 0 },
      torso: { rotX: 0, posY: 0 },
      rightLeg: { rotX: 0 },
      leftLeg: { rotX: 0 },
    }),
    keyframe(0.25, { 
      leftArm: { rotX: -0.6, rotZ: 0.9 },
      rightArm: { rotX: -0.2 }, // 무기로 보조
      shield: { rotY: -0.4 },
      torso: { rotX: 0.3, posY: -0.05 },
      rightLeg: { rotX: -0.2 }, // 다리 벌림
      leftLeg: { rotX: 0.2 },
    }),
    keyframe(1, { 
      leftArm: { rotX: -0.6, rotZ: 0.9 },
      rightArm: { rotX: -0.2 },
      shield: { rotY: -0.4 },
      torso: { rotX: 0.3, posY: -0.05 },
      rightLeg: { rotX: -0.2 },
      leftLeg: { rotX: 0.2 },
    }),
  ],
};

// ===== CHARGE 애니메이션 =====

/** 기병 돌격 */
export const CHARGE_CAVALRY: VoxelAnimationSequence = {
  name: 'charge',
  duration: 600,
  loop: true,
  keyframes: [
    keyframe(0, { 
      torso: { rotX: -0.3, posY: 0 }, // 앞으로 숙임
      rightArm: { rotX: -0.8 }, // 창 앞으로
      weapon: { rotX: -0.5 },
      mount: { posY: 0 },
    }),
    keyframe(0.25, { 
      torso: { rotX: -0.32, posY: 0.02 },
      rightArm: { rotX: -0.82 },
      weapon: { rotX: -0.52 },
      mount: { posY: 0.03 }, // 말 뛰는 동작
    }),
    keyframe(0.5, { 
      torso: { rotX: -0.35, posY: 0.03 },
      rightArm: { rotX: -0.85 },
      weapon: { rotX: -0.55 },
      mount: { posY: 0.05 },
    }),
    keyframe(0.75, { 
      torso: { rotX: -0.32, posY: 0.02 },
      rightArm: { rotX: -0.82 },
      weapon: { rotX: -0.52 },
      mount: { posY: 0.03 },
    }),
    keyframe(1, { 
      torso: { rotX: -0.3, posY: 0 },
      rightArm: { rotX: -0.8 },
      weapon: { rotX: -0.5 },
      mount: { posY: 0 },
    }),
  ],
};

/** 보병 돌격 */
export const CHARGE_INFANTRY: VoxelAnimationSequence = {
  name: 'charge',
  duration: 450,
  loop: true,
  keyframes: [
    keyframe(0, { 
      rightLeg: { rotX: 0.8 }, 
      leftLeg: { rotX: -0.7 },
      rightArm: { rotX: -0.7 }, 
      leftArm: { rotX: 0.6 },
      torso: { posY: 0, rotX: -0.2 },
      head: { rotX: 0.15 },
      weapon: { rotX: -0.4 },
    }),
    keyframe(0.15, { 
      rightLeg: { rotX: 0.3 }, 
      leftLeg: { rotX: -0.2 },
      rightArm: { rotX: -0.2 }, 
      leftArm: { rotX: 0.2 },
      torso: { posY: 0.05, rotX: -0.2 },
      head: { rotX: 0.15 },
      weapon: { rotX: -0.2 },
    }),
    keyframe(0.5, { 
      rightLeg: { rotX: -0.7 }, 
      leftLeg: { rotX: 0.8 },
      rightArm: { rotX: 0.6 }, 
      leftArm: { rotX: -0.7 },
      torso: { posY: 0, rotX: -0.2 },
      head: { rotX: 0.15 },
      weapon: { rotX: 0.2 },
    }),
    keyframe(0.65, { 
      rightLeg: { rotX: -0.2 }, 
      leftLeg: { rotX: 0.3 },
      rightArm: { rotX: 0.2 }, 
      leftArm: { rotX: -0.2 },
      torso: { posY: 0.05, rotX: -0.2 },
      head: { rotX: 0.15 },
      weapon: { rotX: -0.1 },
    }),
    keyframe(1, { 
      rightLeg: { rotX: 0.8 }, 
      leftLeg: { rotX: -0.7 },
      rightArm: { rotX: -0.7 }, 
      leftArm: { rotX: 0.6 },
      torso: { posY: 0, rotX: -0.2 },
      head: { rotX: 0.15 },
      weapon: { rotX: -0.4 },
    }),
  ],
};

// ===== RETREAT 애니메이션 =====

/** 후퇴 */
export const RETREAT: VoxelAnimationSequence = {
  name: 'walk',
  duration: 600,
  loop: true,
  keyframes: [
    keyframe(0, { 
      rightLeg: { rotX: -0.3 }, // 뒤로 걷기
      leftLeg: { rotX: 0.3 },
      rightArm: { rotX: 0.2 }, 
      leftArm: { rotX: -0.2 },
      torso: { posY: 0, rotX: 0.1 }, // 뒤로 젖힘
      head: { rotY: 0.3 }, // 뒤 돌아봄
    }),
    keyframe(0.25, { 
      rightLeg: { rotX: 0 }, 
      leftLeg: { rotX: 0 },
      rightArm: { rotX: 0 }, 
      leftArm: { rotX: 0 },
      torso: { posY: 0.015, rotX: 0.1 },
      head: { rotY: 0.2 },
    }),
    keyframe(0.5, { 
      rightLeg: { rotX: 0.3 }, 
      leftLeg: { rotX: -0.3 },
      rightArm: { rotX: -0.2 }, 
      leftArm: { rotX: 0.2 },
      torso: { posY: 0, rotX: 0.1 },
      head: { rotY: 0.4 },
    }),
    keyframe(0.75, { 
      rightLeg: { rotX: 0 }, 
      leftLeg: { rotX: 0 },
      rightArm: { rotX: 0 }, 
      leftArm: { rotX: 0 },
      torso: { posY: 0.015, rotX: 0.1 },
      head: { rotY: 0.3 },
    }),
    keyframe(1, { 
      rightLeg: { rotX: -0.3 }, 
      leftLeg: { rotX: 0.3 },
      rightArm: { rotX: 0.2 }, 
      leftArm: { rotX: -0.2 },
      torso: { posY: 0, rotX: 0.1 },
      head: { rotY: 0.3 },
    }),
  ],
};

// ===== 말 애니메이션 =====

/** 말 걷기 */
export const HORSE_WALK: VoxelAnimationSequence = {
  name: 'walk',
  duration: 1000,
  loop: true,
  keyframes: [
    keyframe(0, {
      mount: { posY: 0 },
      // 앞다리
      rightArm: { rotX: 0.3 },  // 오른쪽 앞다리
      leftArm: { rotX: -0.3 }, // 왼쪽 앞다리
      // 뒷다리
      rightLeg: { rotX: -0.3 }, // 오른쪽 뒷다리
      leftLeg: { rotX: 0.3 },  // 왼쪽 뒷다리
    }),
    keyframe(0.25, {
      mount: { posY: 0.01 },
      rightArm: { rotX: 0 },
      leftArm: { rotX: 0 },
      rightLeg: { rotX: 0 },
      leftLeg: { rotX: 0 },
    }),
    keyframe(0.5, {
      mount: { posY: 0 },
      rightArm: { rotX: -0.3 },
      leftArm: { rotX: 0.3 },
      rightLeg: { rotX: 0.3 },
      leftLeg: { rotX: -0.3 },
    }),
    keyframe(0.75, {
      mount: { posY: 0.01 },
      rightArm: { rotX: 0 },
      leftArm: { rotX: 0 },
      rightLeg: { rotX: 0 },
      leftLeg: { rotX: 0 },
    }),
    keyframe(1, {
      mount: { posY: 0 },
      rightArm: { rotX: 0.3 },
      leftArm: { rotX: -0.3 },
      rightLeg: { rotX: -0.3 },
      leftLeg: { rotX: 0.3 },
    }),
  ],
};

/** 말 달리기 */
export const HORSE_RUN: VoxelAnimationSequence = {
  name: 'run',
  duration: 500,
  loop: true,
  keyframes: [
    keyframe(0, {
      mount: { posY: 0, rotX: -0.05 },
      rightArm: { rotX: 0.6 },
      leftArm: { rotX: -0.5 },
      rightLeg: { rotX: -0.5 },
      leftLeg: { rotX: 0.6 },
    }),
    keyframe(0.15, {
      mount: { posY: 0.04, rotX: -0.08 }, // 공중
      rightArm: { rotX: 0.2 },
      leftArm: { rotX: -0.1 },
      rightLeg: { rotX: -0.1 },
      leftLeg: { rotX: 0.2 },
    }),
    keyframe(0.4, {
      mount: { posY: 0.02, rotX: -0.03 },
      rightArm: { rotX: -0.5 },
      leftArm: { rotX: 0.6 },
      rightLeg: { rotX: 0.6 },
      leftLeg: { rotX: -0.5 },
    }),
    keyframe(0.65, {
      mount: { posY: 0.04, rotX: -0.08 },
      rightArm: { rotX: -0.1 },
      leftArm: { rotX: 0.2 },
      rightLeg: { rotX: 0.2 },
      leftLeg: { rotX: -0.1 },
    }),
    keyframe(1, {
      mount: { posY: 0, rotX: -0.05 },
      rightArm: { rotX: 0.6 },
      leftArm: { rotX: -0.5 },
      rightLeg: { rotX: -0.5 },
      leftLeg: { rotX: 0.6 },
    }),
  ],
};

/** 말 돌격 */
export const HORSE_CHARGE: VoxelAnimationSequence = {
  name: 'charge',
  duration: 400,
  loop: true,
  keyframes: [
    keyframe(0, {
      mount: { posY: 0, rotX: -0.1 },
      rightArm: { rotX: 0.8 },
      leftArm: { rotX: -0.7 },
      rightLeg: { rotX: -0.7 },
      leftLeg: { rotX: 0.8 },
    }),
    keyframe(0.2, {
      mount: { posY: 0.06, rotX: -0.15 },
      rightArm: { rotX: 0.3 },
      leftArm: { rotX: -0.2 },
      rightLeg: { rotX: -0.2 },
      leftLeg: { rotX: 0.3 },
    }),
    keyframe(0.5, {
      mount: { posY: 0.03, rotX: -0.08 },
      rightArm: { rotX: -0.7 },
      leftArm: { rotX: 0.8 },
      rightLeg: { rotX: 0.8 },
      leftLeg: { rotX: -0.7 },
    }),
    keyframe(0.7, {
      mount: { posY: 0.06, rotX: -0.15 },
      rightArm: { rotX: -0.2 },
      leftArm: { rotX: 0.3 },
      rightLeg: { rotX: 0.3 },
      leftLeg: { rotX: -0.2 },
    }),
    keyframe(1, {
      mount: { posY: 0, rotX: -0.1 },
      rightArm: { rotX: 0.8 },
      leftArm: { rotX: -0.7 },
      rightLeg: { rotX: -0.7 },
      leftLeg: { rotX: 0.8 },
    }),
  ],
};

// ===== 클립 데이터베이스 =====

export const ANIMATION_CLIPS: Record<AnimationClipName, VoxelAnimationSequence> = {
  idle: IDLE_BASIC,
  idle_alert: IDLE_ALERT,
  idle_tired: IDLE_TIRED,
  walk: WALK_BASIC,
  walk_careful: WALK_CAREFUL,
  run: RUN_BASIC,
  run_sprint: RUN_SPRINT,
  hit: HIT_BASIC,
  hit_heavy: HIT_HEAVY,
  hit_block: HIT_BLOCK,
  death: DEATH_BASIC,
  death_forward: DEATH_FORWARD,
  death_backward: DEATH_BACKWARD,
  defend: DEFEND_BASIC,
  defend_brace: DEFEND_BRACE,
  charge: CHARGE_INFANTRY,
  charge_cavalry: CHARGE_CAVALRY,
  retreat: RETREAT,
};

/** 클립 변형 목록 */
export const CLIP_VARIANTS: AnimationClipVariant[] = [
  // Idle 변형
  { name: 'idle', sequence: IDLE_BASIC },
  { name: 'idle_alert', sequence: IDLE_ALERT },
  { name: 'idle_tired', sequence: IDLE_TIRED, condition: { moraleRange: [0, 30] } },
  
  // Walk 변형
  { name: 'walk', sequence: WALK_BASIC },
  { name: 'walk_careful', sequence: WALK_CAREFUL, condition: { hasShield: true } },
  
  // Run 변형
  { name: 'run', sequence: RUN_BASIC },
  { name: 'run_sprint', sequence: RUN_SPRINT },
  
  // Hit 변형
  { name: 'hit', sequence: HIT_BASIC },
  { name: 'hit_heavy', sequence: HIT_HEAVY },
  { name: 'hit_block', sequence: HIT_BLOCK, condition: { hasShield: true } },
  
  // Death 변형
  { name: 'death', sequence: DEATH_BASIC },
  { name: 'death_forward', sequence: DEATH_FORWARD },
  { name: 'death_backward', sequence: DEATH_BACKWARD },
  
  // Defend 변형
  { name: 'defend', sequence: DEFEND_BASIC, condition: { hasShield: true } },
  { name: 'defend_brace', sequence: DEFEND_BRACE, condition: { hasShield: true } },
  
  // Charge 변형
  { name: 'charge', sequence: CHARGE_INFANTRY },
  { name: 'charge_cavalry', sequence: CHARGE_CAVALRY, condition: { mounted: true } },
  
  // Retreat
  { name: 'retreat', sequence: RETREAT },
];

// ===== 유틸리티 함수 =====

/** 조건에 맞는 클립 변형 선택 */
export function selectClipVariant(
  baseName: 'idle' | 'walk' | 'run' | 'hit' | 'death' | 'defend' | 'charge',
  context: {
    mounted?: boolean;
    hasShield?: boolean;
    weaponType?: string;
    morale?: number;
    healthRatio?: number;
  }
): VoxelAnimationSequence {
  const candidates = CLIP_VARIANTS.filter(v => v.name.startsWith(baseName));
  
  // 조건에 맞는 변형 찾기
  for (const variant of candidates) {
    if (!variant.condition) continue;
    
    const { mounted, hasShield, moraleRange, healthRange } = variant.condition;
    
    // 조건 체크
    if (mounted !== undefined && mounted !== context.mounted) continue;
    if (hasShield !== undefined && hasShield !== context.hasShield) continue;
    if (moraleRange && context.morale !== undefined) {
      if (context.morale < moraleRange[0] || context.morale > moraleRange[1]) continue;
    }
    if (healthRange && context.healthRatio !== undefined) {
      if (context.healthRatio < healthRange[0] || context.healthRatio > healthRange[1]) continue;
    }
    
    // 조건 통과
    return variant.sequence;
  }
  
  // 기본 반환
  return ANIMATION_CLIPS[baseName];
}

/** 애니메이션 시퀀스 복사 */
export function cloneAnimationSequence(sequence: VoxelAnimationSequence): VoxelAnimationSequence {
  return {
    ...sequence,
    keyframes: sequence.keyframes.map(kf => ({
      ...kf,
      transforms: { ...kf.transforms },
    })),
  };
}

/** 애니메이션 속도 조절 */
export function scaleAnimationDuration(
  sequence: VoxelAnimationSequence, 
  scale: number
): VoxelAnimationSequence {
  return {
    ...sequence,
    duration: sequence.duration * scale,
  };
}

export default ANIMATION_CLIPS;





