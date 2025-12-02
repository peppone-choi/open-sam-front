/**
 * WeaponAnimations.ts
 * 무기 타입별 공격 애니메이션 정의
 * 
 * 무기 타입:
 * - slash: 베기 (도검류) - 대각선/수평 베기
 * - thrust: 찌르기 (창류) - 직선 찌르기
 * - swing: 휘두르기 (둔기류) - 오버헤드/측면 스윙
 * - shoot_bow: 활 쏘기 - 시위 당기기/발사 반동
 * - shoot_xbow: 쇠뇌 쏘기 - 조준/발사
 * - throw: 투척 - 던지기
 * - cast: 마법 시전 - 손 들기/시전 이펙트
 * - charge: 돌격 (기병) - 창 내밀기
 * - siege: 공성 - 장비 작동
 */

import type { 
  VoxelAnimationSequence, 
  VoxelAnimationKeyframe,
  WeaponAttackType,
} from '@/components/battle/units/db/VoxelUnitDefinitions';

// ===== 타입 정의 =====

export interface WeaponAnimationVariant {
  type: WeaponAttackType;
  variant: string;
  sequence: VoxelAnimationSequence;
  /** 이 변형에 적합한 무기들 */
  weapons?: string[];
  /** 설명 */
  description?: string;
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

// ===== SLASH (베기) 애니메이션 =====

/** 대각선 베기 - 기본 */
export const SLASH_DIAGONAL: VoxelAnimationSequence = {
  name: 'attack',
  duration: 550,
  loop: false,
  keyframes: [
    keyframe(0, { 
      torso: { rotX: 0, rotY: 0, rotZ: 0, posY: 0 }, 
      rightArm: { rotX: 0, rotZ: 0 },
      weapon: { rotX: 0, rotY: 0, rotZ: 0 },
    }),
    keyframe(0.15, { 
      torso: { rotX: -0.1, rotY: -0.25, rotZ: 0, posY: 0.02 }, // 준비
      rightArm: { rotX: -0.6, rotZ: -0.3 },
      weapon: { rotX: -0.7, rotY: 0, rotZ: -0.4 },
    }),
    keyframe(0.35, { 
      torso: { rotX: 0.15, rotY: 0.35, rotZ: 0.08, posY: -0.02 }, // 베기
      rightArm: { rotX: 0.5, rotZ: 0.4 },
      weapon: { rotX: 0.6, rotY: 0.25, rotZ: 0.7 },
    }),
    keyframe(0.5, { 
      torso: { rotX: 0.1, rotY: 0.2, rotZ: 0.04, posY: -0.01 }, // 팔로우스루
      rightArm: { rotX: 0.3, rotZ: 0.2 },
      weapon: { rotX: 0.3, rotY: 0.1, rotZ: 0.4 },
    }),
    keyframe(1, { 
      torso: { rotX: 0, rotY: 0, rotZ: 0, posY: 0 }, 
      rightArm: { rotX: 0, rotZ: 0 },
      weapon: { rotX: 0, rotY: 0, rotZ: 0 },
    }),
  ],
};

/** 수평 베기 */
export const SLASH_HORIZONTAL: VoxelAnimationSequence = {
  name: 'attack',
  duration: 500,
  loop: false,
  keyframes: [
    keyframe(0, { 
      torso: { rotX: 0, rotY: 0, posY: 0 }, 
      rightArm: { rotX: -0.3, rotY: 0, rotZ: 0 },
      weapon: { rotX: 0, rotY: 0, rotZ: 0 },
    }),
    keyframe(0.2, { 
      torso: { rotX: 0, rotY: -0.4, posY: 0.01 }, // 뒤로 젖힘
      rightArm: { rotX: -0.4, rotY: -0.5, rotZ: -0.2 },
      weapon: { rotX: 0, rotY: -0.4, rotZ: -0.3 },
    }),
    keyframe(0.4, { 
      torso: { rotX: 0.05, rotY: 0.5, posY: -0.01 }, // 휘두르기
      rightArm: { rotX: -0.2, rotY: 0.6, rotZ: 0.3 },
      weapon: { rotX: 0, rotY: 0.5, rotZ: 0.4 },
    }),
    keyframe(0.55, { 
      torso: { rotX: 0.03, rotY: 0.3, posY: 0 },
      rightArm: { rotX: -0.25, rotY: 0.35, rotZ: 0.15 },
      weapon: { rotX: 0, rotY: 0.3, rotZ: 0.2 },
    }),
    keyframe(1, { 
      torso: { rotX: 0, rotY: 0, posY: 0 }, 
      rightArm: { rotX: -0.3, rotY: 0, rotZ: 0 },
      weapon: { rotX: 0, rotY: 0, rotZ: 0 },
    }),
  ],
};

/** 올려치기 - 대검류 */
export const SLASH_UPWARD: VoxelAnimationSequence = {
  name: 'attack',
  duration: 600,
  loop: false,
  keyframes: [
    keyframe(0, { 
      torso: { rotX: 0.1, rotY: 0, posY: -0.02 }, // 살짝 숙임
      rightArm: { rotX: 0.3, rotZ: 0.2 },
      weapon: { rotX: 0.4, rotZ: 0.3 },
    }),
    keyframe(0.25, { 
      torso: { rotX: 0.15, rotY: -0.1, posY: -0.03 }, // 준비
      rightArm: { rotX: 0.5, rotZ: 0.4 },
      weapon: { rotX: 0.6, rotZ: 0.5 },
    }),
    keyframe(0.45, { 
      torso: { rotX: -0.2, rotY: 0.15, posY: 0.02 }, // 올려치기
      rightArm: { rotX: -0.8, rotZ: -0.2 },
      weapon: { rotX: -0.9, rotZ: -0.3 },
    }),
    keyframe(0.6, { 
      torso: { rotX: -0.1, rotY: 0.08, posY: 0.01 },
      rightArm: { rotX: -0.5, rotZ: -0.1 },
      weapon: { rotX: -0.6, rotZ: -0.15 },
    }),
    keyframe(1, { 
      torso: { rotX: 0.1, rotY: 0, posY: -0.02 },
      rightArm: { rotX: 0.3, rotZ: 0.2 },
      weapon: { rotX: 0.4, rotZ: 0.3 },
    }),
  ],
};

/** 쌍검 베기 */
export const SLASH_DUAL: VoxelAnimationSequence = {
  name: 'attack',
  duration: 450,
  loop: false,
  keyframes: [
    keyframe(0, { 
      torso: { rotX: 0, rotY: 0, posY: 0 }, 
      rightArm: { rotX: -0.2, rotZ: 0 },
      leftArm: { rotX: -0.2, rotZ: 0 },
      weapon: { rotX: 0, rotZ: 0 },
    }),
    keyframe(0.15, { 
      torso: { rotX: -0.05, rotY: -0.15, posY: 0.01 },
      rightArm: { rotX: -0.5, rotZ: -0.2 }, // 오른손 준비
      leftArm: { rotX: 0.1, rotZ: 0.1 },
      weapon: { rotX: -0.4, rotZ: -0.2 },
    }),
    keyframe(0.35, { 
      torso: { rotX: 0.08, rotY: 0.2, posY: -0.01 },
      rightArm: { rotX: 0.4, rotZ: 0.3 }, // 오른손 베기
      leftArm: { rotX: -0.5, rotZ: -0.2 }, // 왼손 준비
      weapon: { rotX: 0.5, rotZ: 0.4 },
    }),
    keyframe(0.55, { 
      torso: { rotX: 0.05, rotY: -0.15, posY: 0 },
      rightArm: { rotX: 0.1, rotZ: 0.1 },
      leftArm: { rotX: 0.4, rotZ: 0.3 }, // 왼손 베기
      weapon: { rotX: 0.2, rotZ: 0.2 },
    }),
    keyframe(1, { 
      torso: { rotX: 0, rotY: 0, posY: 0 }, 
      rightArm: { rotX: -0.2, rotZ: 0 },
      leftArm: { rotX: -0.2, rotZ: 0 },
      weapon: { rotX: 0, rotZ: 0 },
    }),
  ],
};

// ===== THRUST (찌르기) 애니메이션 =====

/** 기본 찌르기 */
export const THRUST_BASIC: VoxelAnimationSequence = {
  name: 'attack',
  duration: 480,
  loop: false,
  keyframes: [
    keyframe(0, { 
      torso: { rotX: 0, rotY: 0, posY: 0 }, 
      rightArm: { rotX: -0.3 },
      weapon: { rotX: 0, posX: 0, posZ: 0 },
    }),
    keyframe(0.15, { 
      torso: { rotX: 0.08, rotY: -0.12, posY: 0.01 }, // 뒤로 준비
      rightArm: { rotX: 0.15 },
      weapon: { rotX: 0.15, posX: -0.03, posZ: -0.02 },
    }),
    keyframe(0.35, { 
      torso: { rotX: -0.15, rotY: 0.18, posY: -0.02 }, // 앞으로 찌르기
      rightArm: { rotX: -0.7 },
      weapon: { rotX: -0.35, posX: 0.12, posZ: 0.08 },
    }),
    keyframe(0.5, { 
      torso: { rotX: -0.1, rotY: 0.12, posY: -0.01 },
      rightArm: { rotX: -0.55 },
      weapon: { rotX: -0.25, posX: 0.08, posZ: 0.05 },
    }),
    keyframe(1, { 
      torso: { rotX: 0, rotY: 0, posY: 0 }, 
      rightArm: { rotX: -0.3 },
      weapon: { rotX: 0, posX: 0, posZ: 0 },
    }),
  ],
};

/** 런지 찌르기 - 긴 창 */
export const THRUST_LUNGE: VoxelAnimationSequence = {
  name: 'attack',
  duration: 550,
  loop: false,
  keyframes: [
    keyframe(0, { 
      torso: { rotX: 0, rotY: 0, posY: 0 }, 
      rightArm: { rotX: -0.2 },
      rightLeg: { rotX: 0 },
      leftLeg: { rotX: 0 },
      weapon: { rotX: -0.1, posZ: 0 },
    }),
    keyframe(0.2, { 
      torso: { rotX: 0.1, rotY: -0.1, posY: 0.02 },
      rightArm: { rotX: 0.2 },
      rightLeg: { rotX: -0.2 }, // 뒤로 빠짐
      leftLeg: { rotX: 0.15 },
      weapon: { rotX: 0.1, posZ: -0.03 },
    }),
    keyframe(0.4, { 
      torso: { rotX: -0.25, rotY: 0.2, posY: -0.03 }, // 런지
      rightArm: { rotX: -0.8 },
      rightLeg: { rotX: 0.5 }, // 앞으로 런지
      leftLeg: { rotX: -0.4 },
      weapon: { rotX: -0.45, posZ: 0.15 },
    }),
    keyframe(0.55, { 
      torso: { rotX: -0.15, rotY: 0.12, posY: -0.02 },
      rightArm: { rotX: -0.6 },
      rightLeg: { rotX: 0.35 },
      leftLeg: { rotX: -0.25 },
      weapon: { rotX: -0.3, posZ: 0.1 },
    }),
    keyframe(1, { 
      torso: { rotX: 0, rotY: 0, posY: 0 }, 
      rightArm: { rotX: -0.2 },
      rightLeg: { rotX: 0 },
      leftLeg: { rotX: 0 },
      weapon: { rotX: -0.1, posZ: 0 },
    }),
  ],
};

/** 극 찌르기 - 측면 갈고리 */
export const THRUST_JI: VoxelAnimationSequence = {
  name: 'attack',
  duration: 600,
  loop: false,
  keyframes: [
    keyframe(0, { 
      torso: { rotX: 0, rotY: 0, posY: 0 }, 
      rightArm: { rotX: -0.2, rotZ: 0 },
      weapon: { rotX: 0, rotY: 0 },
    }),
    keyframe(0.2, { 
      torso: { rotX: 0.08, rotY: -0.15, posY: 0.01 },
      rightArm: { rotX: 0.1, rotZ: -0.1 },
      weapon: { rotX: 0.1, rotY: -0.2 },
    }),
    keyframe(0.4, { 
      torso: { rotX: -0.15, rotY: 0.2, posY: -0.02 }, // 찌르기
      rightArm: { rotX: -0.7, rotZ: 0 },
      weapon: { rotX: -0.4, rotY: 0.1 },
    }),
    keyframe(0.55, { 
      torso: { rotX: -0.1, rotY: 0.35, posY: -0.01 }, // 갈고리 당김
      rightArm: { rotX: -0.5, rotZ: 0.2 },
      weapon: { rotX: -0.2, rotY: 0.35 },
    }),
    keyframe(0.7, { 
      torso: { rotX: -0.05, rotY: 0.2, posY: 0 },
      rightArm: { rotX: -0.3, rotZ: 0.1 },
      weapon: { rotX: -0.1, rotY: 0.2 },
    }),
    keyframe(1, { 
      torso: { rotX: 0, rotY: 0, posY: 0 }, 
      rightArm: { rotX: -0.2, rotZ: 0 },
      weapon: { rotX: 0, rotY: 0 },
    }),
  ],
};

// ===== SWING (휘두르기) 애니메이션 =====

/** 오버헤드 스윙 */
export const SWING_OVERHEAD: VoxelAnimationSequence = {
  name: 'attack',
  duration: 650,
  loop: false,
  keyframes: [
    keyframe(0, { 
      torso: { rotX: 0, rotY: 0, posY: 0 }, 
      rightArm: { rotX: 0, rotZ: 0 },
      weapon: { rotX: 0, rotY: 0 },
    }),
    keyframe(0.2, { 
      torso: { rotX: -0.2, rotY: 0, posY: 0.03 }, // 뒤로 젖힘
      rightArm: { rotX: -1.1, rotZ: 0 },
      weapon: { rotX: -1.0, rotY: 0 },
    }),
    keyframe(0.35, { 
      torso: { rotX: -0.25, rotY: 0, posY: 0.04 }, // 최대 높이
      rightArm: { rotX: -1.3, rotZ: 0.1 },
      weapon: { rotX: -1.2, rotY: 0.1 },
    }),
    keyframe(0.5, { 
      torso: { rotX: 0.25, rotY: 0, posY: -0.03 }, // 내려치기
      rightArm: { rotX: 0.7, rotZ: -0.1 },
      weapon: { rotX: 0.8, rotY: -0.1 },
    }),
    keyframe(0.65, { 
      torso: { rotX: 0.15, rotY: 0, posY: -0.02 },
      rightArm: { rotX: 0.4, rotZ: 0 },
      weapon: { rotX: 0.45, rotY: 0 },
    }),
    keyframe(1, { 
      torso: { rotX: 0, rotY: 0, posY: 0 }, 
      rightArm: { rotX: 0, rotZ: 0 },
      weapon: { rotX: 0, rotY: 0 },
    }),
  ],
};

/** 측면 스윙 */
export const SWING_SIDE: VoxelAnimationSequence = {
  name: 'attack',
  duration: 580,
  loop: false,
  keyframes: [
    keyframe(0, { 
      torso: { rotX: 0, rotY: 0, posY: 0 }, 
      rightArm: { rotX: -0.3, rotY: 0, rotZ: 0 },
      weapon: { rotX: 0, rotY: 0 },
    }),
    keyframe(0.2, { 
      torso: { rotX: 0, rotY: -0.4, posY: 0.01 }, // 뒤로 회전
      rightArm: { rotX: -0.2, rotY: -0.6, rotZ: -0.3 },
      weapon: { rotX: 0, rotY: -0.5 },
    }),
    keyframe(0.45, { 
      torso: { rotX: 0.1, rotY: 0.5, posY: -0.02 }, // 휘두르기
      rightArm: { rotX: -0.1, rotY: 0.7, rotZ: 0.4 },
      weapon: { rotX: 0.1, rotY: 0.6 },
    }),
    keyframe(0.6, { 
      torso: { rotX: 0.05, rotY: 0.3, posY: -0.01 },
      rightArm: { rotX: -0.15, rotY: 0.4, rotZ: 0.2 },
      weapon: { rotX: 0.05, rotY: 0.35 },
    }),
    keyframe(1, { 
      torso: { rotX: 0, rotY: 0, posY: 0 }, 
      rightArm: { rotX: -0.3, rotY: 0, rotZ: 0 },
      weapon: { rotX: 0, rotY: 0 },
    }),
  ],
};

/** 스매시 - 거대 무기 */
export const SWING_SMASH: VoxelAnimationSequence = {
  name: 'attack',
  duration: 750,
  loop: false,
  keyframes: [
    keyframe(0, { 
      torso: { rotX: 0, rotY: 0, posY: 0 }, 
      rightArm: { rotX: 0, rotZ: 0.2 },
      leftArm: { rotX: 0, rotZ: -0.2 }, // 양손
      weapon: { rotX: 0, rotY: 0 },
    }),
    keyframe(0.15, { 
      torso: { rotX: -0.15, rotY: 0, posY: 0.02 },
      rightArm: { rotX: -0.8, rotZ: 0.1 },
      leftArm: { rotX: -0.8, rotZ: -0.1 },
      weapon: { rotX: -0.7, rotY: 0 },
    }),
    keyframe(0.3, { 
      torso: { rotX: -0.25, rotY: 0, posY: 0.04 }, // 최대
      rightArm: { rotX: -1.2, rotZ: 0 },
      leftArm: { rotX: -1.2, rotZ: 0 },
      weapon: { rotX: -1.1, rotY: 0 },
    }),
    keyframe(0.5, { 
      torso: { rotX: 0.35, rotY: 0, posY: -0.04 }, // 내려치기
      rightArm: { rotX: 0.8, rotZ: 0 },
      leftArm: { rotX: 0.8, rotZ: 0 },
      weapon: { rotX: 0.9, rotY: 0 },
    }, { scale: 1.02 }), // 충격
    keyframe(0.65, { 
      torso: { rotX: 0.2, rotY: 0, posY: -0.02 },
      rightArm: { rotX: 0.5, rotZ: 0.1 },
      leftArm: { rotX: 0.5, rotZ: -0.1 },
      weapon: { rotX: 0.55, rotY: 0 },
    }),
    keyframe(1, { 
      torso: { rotX: 0, rotY: 0, posY: 0 }, 
      rightArm: { rotX: 0, rotZ: 0.2 },
      leftArm: { rotX: 0, rotZ: -0.2 },
      weapon: { rotX: 0, rotY: 0 },
    }),
  ],
};

// ===== SHOOT_BOW (활 쏘기) 애니메이션 =====

/** 기본 활 쏘기 */
export const SHOOT_BOW_BASIC: VoxelAnimationSequence = {
  name: 'attack',
  duration: 950,
  loop: false,
  keyframes: [
    keyframe(0, { 
      torso: { rotX: 0, rotY: 0, posY: 0 }, 
      rightArm: { rotX: -0.3, rotZ: 0 },
      leftArm: { rotX: -0.3, rotZ: 0 },
      weapon: { rotX: 0, rotY: 0, rotZ: 0 },
    }),
    keyframe(0.15, { 
      torso: { rotX: -0.08, rotY: -0.25, posY: 0.01 }, // 몸 틀기
      rightArm: { rotX: -0.45, rotZ: -0.15 },
      leftArm: { rotX: -0.5, rotZ: 0.2 }, // 활 들기
      weapon: { rotX: -0.3, rotY: -0.15, rotZ: 0.15 },
    }),
    keyframe(0.4, { 
      torso: { rotX: -0.12, rotY: -0.35, posY: 0.02 }, // 조준
      rightArm: { rotX: -0.55, rotZ: -0.25 }, // 시위 당기기
      leftArm: { rotX: -0.6, rotZ: 0.25 },
      weapon: { rotX: -0.4, rotY: -0.25, rotZ: 0.25 },
    }),
    keyframe(0.65, { 
      torso: { rotX: -0.15, rotY: -0.4, posY: 0.02 }, // 최대 당김
      rightArm: { rotX: -0.65, rotZ: -0.35 },
      leftArm: { rotX: -0.65, rotZ: 0.3 },
      weapon: { rotX: -0.5, rotY: -0.3, rotZ: 0.3 },
    }),
    keyframe(0.72, { 
      torso: { rotX: 0.08, rotY: 0.08, posY: -0.01 }, // 발사! 반동
      rightArm: { rotX: -0.2, rotZ: 0.15 },
      leftArm: { rotX: -0.25, rotZ: 0.1 },
      weapon: { rotX: 0.15, rotY: 0.08, rotZ: -0.08 },
    }),
    keyframe(0.85, { 
      torso: { rotX: 0.04, rotY: 0.04, posY: 0 },
      rightArm: { rotX: -0.25, rotZ: 0.08 },
      leftArm: { rotX: -0.28, rotZ: 0.05 },
      weapon: { rotX: 0.08, rotY: 0.04, rotZ: 0 },
    }),
    keyframe(1, { 
      torso: { rotX: 0, rotY: 0, posY: 0 }, 
      rightArm: { rotX: -0.3, rotZ: 0 },
      leftArm: { rotX: -0.3, rotZ: 0 },
      weapon: { rotX: 0, rotY: 0, rotZ: 0 },
    }),
  ],
};

/** 빠른 사격 - 연사 */
export const SHOOT_BOW_RAPID: VoxelAnimationSequence = {
  name: 'attack',
  duration: 550,
  loop: false,
  keyframes: [
    keyframe(0, { 
      torso: { rotX: -0.1, rotY: -0.3, posY: 0 }, 
      rightArm: { rotX: -0.5, rotZ: -0.2 },
      leftArm: { rotX: -0.55, rotZ: 0.2 },
      weapon: { rotX: -0.35, rotY: -0.2 },
    }),
    keyframe(0.35, { 
      torso: { rotX: -0.12, rotY: -0.35, posY: 0.01 },
      rightArm: { rotX: -0.6, rotZ: -0.3 },
      leftArm: { rotX: -0.6, rotZ: 0.25 },
      weapon: { rotX: -0.45, rotY: -0.25 },
    }),
    keyframe(0.45, { 
      torso: { rotX: 0.05, rotY: 0.05, posY: -0.01 }, // 발사
      rightArm: { rotX: -0.25, rotZ: 0.1 },
      leftArm: { rotX: -0.3, rotZ: 0.08 },
      weapon: { rotX: 0.1, rotY: 0.05 },
    }),
    keyframe(1, { 
      torso: { rotX: -0.1, rotY: -0.3, posY: 0 }, 
      rightArm: { rotX: -0.5, rotZ: -0.2 },
      leftArm: { rotX: -0.55, rotZ: 0.2 },
      weapon: { rotX: -0.35, rotY: -0.2 },
    }),
  ],
};

// ===== SHOOT_XBOW (쇠뇌 쏘기) 애니메이션 =====

/** 기본 쇠뇌 사격 */
export const SHOOT_XBOW_BASIC: VoxelAnimationSequence = {
  name: 'attack',
  duration: 750,
  loop: false,
  keyframes: [
    keyframe(0, { 
      torso: { rotX: 0, rotY: 0, posY: 0 }, 
      rightArm: { rotX: -0.2 },
      leftArm: { rotX: -0.4 },
      weapon: { rotX: 0, rotY: 0 },
    }),
    keyframe(0.2, { 
      torso: { rotX: -0.08, rotY: -0.12, posY: 0.01 }, // 조준
      rightArm: { rotX: -0.3 },
      leftArm: { rotX: -0.5 },
      weapon: { rotX: -0.15, rotY: -0.08 },
    }),
    keyframe(0.55, { 
      torso: { rotX: -0.08, rotY: -0.12, posY: 0.01 }, // 조준 유지
      rightArm: { rotX: -0.3 },
      leftArm: { rotX: -0.5 },
      weapon: { rotX: -0.15, rotY: -0.08 },
    }),
    keyframe(0.65, { 
      torso: { rotX: 0.08, rotY: 0.04, posY: -0.01 }, // 발사 반동
      rightArm: { rotX: -0.15 },
      leftArm: { rotX: -0.35 },
      weapon: { rotX: 0.12, rotY: 0.04 },
    }),
    keyframe(1, { 
      torso: { rotX: 0, rotY: 0, posY: 0 }, 
      rightArm: { rotX: -0.2 },
      leftArm: { rotX: -0.4 },
      weapon: { rotX: 0, rotY: 0 },
    }),
  ],
};

/** 연노 연사 */
export const SHOOT_XBOW_REPEATING: VoxelAnimationSequence = {
  name: 'attack',
  duration: 350,
  loop: false,
  keyframes: [
    keyframe(0, { 
      torso: { rotX: -0.05, rotY: -0.1, posY: 0 }, 
      rightArm: { rotX: -0.25 },
      leftArm: { rotX: -0.45 },
      weapon: { rotX: -0.1, rotY: -0.05 },
    }),
    keyframe(0.4, { 
      torso: { rotX: -0.05, rotY: -0.1, posY: 0 },
      rightArm: { rotX: -0.25 },
      leftArm: { rotX: -0.45 },
      weapon: { rotX: -0.1, rotY: -0.05 },
    }),
    keyframe(0.5, { 
      torso: { rotX: 0.05, rotY: 0.02, posY: -0.01 }, // 발사
      rightArm: { rotX: -0.18 },
      leftArm: { rotX: -0.38 },
      weapon: { rotX: 0.08, rotY: 0.02 },
    }),
    keyframe(1, { 
      torso: { rotX: -0.05, rotY: -0.1, posY: 0 }, 
      rightArm: { rotX: -0.25 },
      leftArm: { rotX: -0.45 },
      weapon: { rotX: -0.1, rotY: -0.05 },
    }),
  ],
};

// ===== THROW (투척) 애니메이션 =====

/** 기본 투척 */
export const THROW_BASIC: VoxelAnimationSequence = {
  name: 'attack',
  duration: 550,
  loop: false,
  keyframes: [
    keyframe(0, { 
      torso: { rotX: 0, rotY: 0, rotZ: 0, posY: 0 }, 
      rightArm: { rotX: 0 },
      weapon: { rotX: 0, rotY: 0, posX: 0 },
    }),
    keyframe(0.2, { 
      torso: { rotX: -0.12, rotY: -0.35, rotZ: -0.08, posY: 0.02 }, // 뒤로 젖힘
      rightArm: { rotX: -0.75 },
      weapon: { rotX: -0.6, rotY: -0.25, posX: -0.04 },
    }),
    keyframe(0.4, { 
      torso: { rotX: 0.18, rotY: 0.28, rotZ: 0.08, posY: -0.02 }, // 던지기
      rightArm: { rotX: 0.55 },
      weapon: { rotX: 0.5, rotY: 0.35, posX: 0.08 },
    }),
    keyframe(0.55, { 
      torso: { rotX: 0.1, rotY: 0.18, rotZ: 0.04, posY: -0.01 },
      rightArm: { rotX: 0.3 },
      weapon: { rotX: 0.25, rotY: 0.18, posX: 0.04 },
    }),
    keyframe(1, { 
      torso: { rotX: 0, rotY: 0, rotZ: 0, posY: 0 }, 
      rightArm: { rotX: 0 },
      weapon: { rotX: 0, rotY: 0, posX: 0 },
    }),
  ],
};

/** 투창 던지기 */
export const THROW_JAVELIN: VoxelAnimationSequence = {
  name: 'attack',
  duration: 600,
  loop: false,
  keyframes: [
    keyframe(0, { 
      torso: { rotX: 0, rotY: 0, posY: 0 }, 
      rightArm: { rotX: -0.2, rotZ: 0 },
      rightLeg: { rotX: 0 },
      leftLeg: { rotX: 0 },
      weapon: { rotX: -0.1, posZ: 0 },
    }),
    keyframe(0.15, { 
      torso: { rotX: -0.1, rotY: -0.3, posY: 0.02 },
      rightArm: { rotX: -0.9, rotZ: 0 },
      rightLeg: { rotX: -0.2 },
      leftLeg: { rotX: 0.15 },
      weapon: { rotX: -0.7, posZ: -0.03 },
    }),
    keyframe(0.35, { 
      torso: { rotX: 0.2, rotY: 0.25, posY: -0.02 }, // 스텝 + 던지기
      rightArm: { rotX: 0.6, rotZ: 0.1 },
      rightLeg: { rotX: 0.4 },
      leftLeg: { rotX: -0.3 },
      weapon: { rotX: 0.5, posZ: 0.1 },
    }),
    keyframe(0.5, { 
      torso: { rotX: 0.1, rotY: 0.15, posY: -0.01 },
      rightArm: { rotX: 0.35, rotZ: 0.05 },
      rightLeg: { rotX: 0.2 },
      leftLeg: { rotX: -0.15 },
      weapon: { rotX: 0.25, posZ: 0.05 },
    }),
    keyframe(1, { 
      torso: { rotX: 0, rotY: 0, posY: 0 }, 
      rightArm: { rotX: -0.2, rotZ: 0 },
      rightLeg: { rotX: 0 },
      leftLeg: { rotX: 0 },
      weapon: { rotX: -0.1, posZ: 0 },
    }),
  ],
};

// ===== CAST (마법 시전) 애니메이션 =====

/** 기본 마법 시전 */
export const CAST_BASIC: VoxelAnimationSequence = {
  name: 'attack',
  duration: 1100,
  loop: false,
  keyframes: [
    keyframe(0, { 
      torso: { rotX: 0, rotY: 0, posY: 0 }, 
      rightArm: { rotX: 0 },
      leftArm: { rotX: 0 },
      weapon: { rotX: 0, rotY: 0 },
    }),
    keyframe(0.15, { 
      torso: { rotX: -0.12, rotY: 0, posY: 0.02 }, // 준비
      rightArm: { rotX: -0.45 },
      leftArm: { rotX: -0.45 },
      weapon: { rotX: -0.4, rotY: 0 },
    }),
    keyframe(0.35, { 
      torso: { rotX: -0.2, rotY: 0, posY: 0.03 }, // 집중
      rightArm: { rotX: -0.7 },
      leftArm: { rotX: -0.7 },
      weapon: { rotX: -0.65, rotY: 0.15 },
    }, { colorOverlay: '#6633ff' }),
    keyframe(0.55, { 
      torso: { rotX: -0.25, rotY: 0, posY: 0.04 }, // 최대 집중
      rightArm: { rotX: -0.85 },
      leftArm: { rotX: -0.85 },
      weapon: { rotX: -0.8, rotY: 0.25 },
    }, { colorOverlay: '#9966ff' }),
    keyframe(0.7, { 
      torso: { rotX: 0.12, rotY: 0, posY: -0.02 }, // 발사!
      rightArm: { rotX: 0.25 },
      leftArm: { rotX: 0.25 },
      weapon: { rotX: 0.25, rotY: -0.15 },
    }, { colorOverlay: '#cc99ff' }),
    keyframe(0.85, { 
      torso: { rotX: 0.06, rotY: 0, posY: -0.01 },
      rightArm: { rotX: 0.12 },
      leftArm: { rotX: 0.12 },
      weapon: { rotX: 0.12, rotY: -0.08 },
    }),
    keyframe(1, { 
      torso: { rotX: 0, rotY: 0, posY: 0 }, 
      rightArm: { rotX: 0 },
      leftArm: { rotX: 0 },
      weapon: { rotX: 0, rotY: 0 },
    }),
  ],
};

/** 화염 마법 */
export const CAST_FIRE: VoxelAnimationSequence = {
  name: 'attack',
  duration: 1000,
  loop: false,
  keyframes: [
    keyframe(0, { 
      torso: { rotX: 0, rotY: 0, posY: 0 }, 
      rightArm: { rotX: 0 },
      weapon: { rotX: 0 },
    }),
    keyframe(0.2, { 
      torso: { rotX: -0.15, rotY: 0, posY: 0.02 },
      rightArm: { rotX: -0.6 },
      weapon: { rotX: -0.5 },
    }, { colorOverlay: '#ff6600' }),
    keyframe(0.45, { 
      torso: { rotX: -0.2, rotY: 0, posY: 0.03 },
      rightArm: { rotX: -0.8 },
      weapon: { rotX: -0.7 },
    }, { colorOverlay: '#ff4400' }),
    keyframe(0.6, { 
      torso: { rotX: 0.15, rotY: 0, posY: -0.02 }, // 발사
      rightArm: { rotX: 0.3 },
      weapon: { rotX: 0.3 },
    }, { colorOverlay: '#ff2200' }),
    keyframe(1, { 
      torso: { rotX: 0, rotY: 0, posY: 0 }, 
      rightArm: { rotX: 0 },
      weapon: { rotX: 0 },
    }),
  ],
};

/** 저주 마법 */
export const CAST_CURSE: VoxelAnimationSequence = {
  name: 'attack',
  duration: 1200,
  loop: false,
  keyframes: [
    keyframe(0, { 
      torso: { rotX: 0, rotY: 0, posY: 0 }, 
      rightArm: { rotX: 0 },
      leftArm: { rotX: 0 },
      weapon: { rotX: 0 },
    }),
    keyframe(0.2, { 
      torso: { rotX: -0.1, rotY: 0, posY: 0.01 },
      rightArm: { rotX: -0.5 },
      leftArm: { rotX: -0.5 },
      weapon: { rotX: -0.4 },
    }, { colorOverlay: '#4b0082' }),
    keyframe(0.5, { 
      torso: { rotX: -0.15, rotY: 0, posY: 0.02 },
      rightArm: { rotX: -0.7 },
      leftArm: { rotX: -0.7 },
      weapon: { rotX: -0.6 },
    }, { colorOverlay: '#8b008b' }),
    keyframe(0.7, { 
      torso: { rotX: 0.1, rotY: 0.2, posY: -0.01 }, // 손 내밀기
      rightArm: { rotX: 0.4 },
      leftArm: { rotX: 0.2 },
      weapon: { rotX: 0.3 },
    }, { colorOverlay: '#9932cc' }),
    keyframe(1, { 
      torso: { rotX: 0, rotY: 0, posY: 0 }, 
      rightArm: { rotX: 0 },
      leftArm: { rotX: 0 },
      weapon: { rotX: 0 },
    }),
  ],
};

// ===== CHARGE (돌격) 애니메이션 =====

/** 기병 창 돌격 */
export const CHARGE_LANCE: VoxelAnimationSequence = {
  name: 'attack',
  duration: 450,
  loop: false,
  keyframes: [
    keyframe(0, { 
      torso: { rotX: -0.2, rotY: 0, posY: 0 }, 
      rightArm: { rotX: -0.6 },
      weapon: { rotX: -0.3, posX: 0 },
      mount: { posY: 0 },
    }),
    keyframe(0.25, { 
      torso: { rotX: -0.35, rotY: 0.12, posY: 0.02 }, // 앞으로 숙임
      rightArm: { rotX: -0.75 },
      weapon: { rotX: -0.5, posX: 0.08 },
      mount: { posY: 0.03 },
    }),
    keyframe(0.45, { 
      torso: { rotX: -0.4, rotY: 0.18, posY: 0.01 }, // 최대 돌격
      rightArm: { rotX: -0.8 },
      weapon: { rotX: -0.6, posX: 0.12 },
      mount: { posY: 0.02 },
    }),
    keyframe(0.6, { 
      torso: { rotX: -0.25, rotY: 0.08, posY: 0 },
      rightArm: { rotX: -0.65 },
      weapon: { rotX: -0.35, posX: 0.06 },
      mount: { posY: 0 },
    }),
    keyframe(1, { 
      torso: { rotX: -0.2, rotY: 0, posY: 0 }, 
      rightArm: { rotX: -0.6 },
      weapon: { rotX: -0.3, posX: 0 },
      mount: { posY: 0 },
    }),
  ],
};

// ===== SIEGE (공성) 애니메이션 =====

/** 공성 장비 작동 */
export const SIEGE_OPERATE: VoxelAnimationSequence = {
  name: 'attack',
  duration: 1400,
  loop: false,
  keyframes: [
    keyframe(0, { 
      torso: { rotX: 0, rotY: 0, posY: 0 },
    }),
    keyframe(0.25, { 
      torso: { rotX: -0.15, rotY: 0, posY: 0.02 }, // 준비
    }),
    keyframe(0.45, { 
      torso: { rotX: -0.25, rotY: 0, posY: 0.03 }, // 당김/조작
    }),
    keyframe(0.65, { 
      torso: { rotX: 0.12, rotY: 0, posY: -0.02 }, // 발사/작동
    }),
    keyframe(1, { 
      torso: { rotX: 0, rotY: 0, posY: 0 },
    }),
  ],
};

// ===== 무기 애니메이션 데이터베이스 =====

export const WEAPON_ANIMATION_DATABASE: Record<WeaponAttackType, VoxelAnimationSequence> = {
  slash: SLASH_DIAGONAL,
  thrust: THRUST_BASIC,
  swing: SWING_OVERHEAD,
  shoot_bow: SHOOT_BOW_BASIC,
  shoot_xbow: SHOOT_XBOW_BASIC,
  throw: THROW_BASIC,
  cast: CAST_BASIC,
  charge: CHARGE_LANCE,
  siege: SIEGE_OPERATE,
};

/** 무기 애니메이션 변형 목록 */
export const WEAPON_ANIMATION_VARIANTS: WeaponAnimationVariant[] = [
  // Slash 변형
  { type: 'slash', variant: 'diagonal', sequence: SLASH_DIAGONAL, weapons: ['dao', 'rusted_dao', 'scimitar'] },
  { type: 'slash', variant: 'horizontal', sequence: SLASH_HORIZONTAL, weapons: ['zhanmadao', 'guandao'] },
  { type: 'slash', variant: 'upward', sequence: SLASH_UPWARD, weapons: ['zhanmadao'] },
  { type: 'slash', variant: 'dual', sequence: SLASH_DUAL, weapons: ['dual_swords'] },
  
  // Thrust 변형
  { type: 'thrust', variant: 'basic', sequence: THRUST_BASIC, weapons: ['spear', 'bamboo_spear'] },
  { type: 'thrust', variant: 'lunge', sequence: THRUST_LUNGE, weapons: ['pike', 'lance'] },
  { type: 'thrust', variant: 'ji', sequence: THRUST_JI, weapons: ['ji', 'halberd'] },
  
  // Swing 변형
  { type: 'swing', variant: 'overhead', sequence: SWING_OVERHEAD, weapons: ['axe', 'mace'] },
  { type: 'swing', variant: 'side', sequence: SWING_SIDE, weapons: ['club'] },
  { type: 'swing', variant: 'smash', sequence: SWING_SMASH, weapons: ['guandao'] },
  
  // Shoot_bow 변형
  { type: 'shoot_bow', variant: 'basic', sequence: SHOOT_BOW_BASIC, weapons: ['bow', 'composite_bow'] },
  { type: 'shoot_bow', variant: 'rapid', sequence: SHOOT_BOW_RAPID, weapons: ['sniper_bow'] },
  
  // Shoot_xbow 변형
  { type: 'shoot_xbow', variant: 'basic', sequence: SHOOT_XBOW_BASIC, weapons: ['crossbow', 'heavy_crossbow'] },
  { type: 'shoot_xbow', variant: 'repeating', sequence: SHOOT_XBOW_REPEATING, weapons: ['repeater_crossbow'] },
  
  // Throw 변형
  { type: 'throw', variant: 'basic', sequence: THROW_BASIC, weapons: ['throwing_axe', 'oil_jar'] },
  { type: 'throw', variant: 'javelin', sequence: THROW_JAVELIN, weapons: ['javelin'] },
  
  // Cast 변형
  { type: 'cast', variant: 'basic', sequence: CAST_BASIC, weapons: ['staff', 'scripture'] },
  { type: 'cast', variant: 'fire', sequence: CAST_FIRE, weapons: ['torch'] },
  { type: 'cast', variant: 'curse', sequence: CAST_CURSE, weapons: ['scripture'] },
  
  // Charge
  { type: 'charge', variant: 'lance', sequence: CHARGE_LANCE },
  
  // Siege
  { type: 'siege', variant: 'operate', sequence: SIEGE_OPERATE },
];

// ===== 유틸리티 함수 =====

/** 무기 타입으로 애니메이션 가져오기 */
export function getWeaponAnimation(attackType: WeaponAttackType): VoxelAnimationSequence {
  return WEAPON_ANIMATION_DATABASE[attackType];
}

/** 특정 무기에 맞는 애니메이션 변형 선택 */
export function selectWeaponAnimationVariant(
  attackType: WeaponAttackType,
  weaponName?: string
): VoxelAnimationSequence {
  if (!weaponName) {
    return WEAPON_ANIMATION_DATABASE[attackType];
  }
  
  // 무기 이름에 맞는 변형 찾기
  const variant = WEAPON_ANIMATION_VARIANTS.find(
    v => v.type === attackType && v.weapons?.includes(weaponName)
  );
  
  return variant?.sequence ?? WEAPON_ANIMATION_DATABASE[attackType];
}

/** 랜덤 변형 선택 */
export function getRandomVariant(attackType: WeaponAttackType): VoxelAnimationSequence {
  const variants = WEAPON_ANIMATION_VARIANTS.filter(v => v.type === attackType);
  
  if (variants.length === 0) {
    return WEAPON_ANIMATION_DATABASE[attackType];
  }
  
  const randomIndex = Math.floor(Math.random() * variants.length);
  return variants[randomIndex].sequence;
}

export default WEAPON_ANIMATION_DATABASE;





