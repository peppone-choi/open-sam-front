/**
 * 삼국지 복셀 유닛 사양서 기반 정의
 * units.json과 동기화된 버전
 * 
 * Grid Scale:
 * - Human: 32(X) x 32(Y) x 48(Z) (1 Voxel ≈ 4~5cm)
 * - Horse/Cavalry: 48(X) x 80(Y) x 64(Z)
 * - Siege: 80(X) x 120(Y) x 90(Z)
 * 
 * 비율: 7.5등신 리얼 비율
 */

// ===== Material Palette (고증 기반) =====
export const VOXEL_PALETTE = {
  // 철/금속
  IRON_BASE: '#5A5A5A',
  IRON_HIGHLIGHT: '#808080',
  IRON_SHADOW: '#3E3E3E',
  
  // 녹/피
  RUST: '#8B4513',
  BLOOD: '#A0522D',
  
  // 옻칠 (갑옷)
  LACQUER_RED: '#8B0000',
  LACQUER_BLACK: '#111111',
  
  // 청동
  BRONZE: '#CD7F32',
  PATINA: '#2F4F4F',
  
  // 나무/등나무
  RATTAN: '#DAA520',
  WOOD_OLD: '#8B5A2B',
  WOOD_LIGHT: '#DEB887',
  
  // 천/가죽
  CLOTH_BROWN: '#C2B280',
  CLOTH_YELLOW: '#FFD700',
  CLOTH_WHITE: '#F5F5F5',
  CLOTH_BLUE: '#4169E1',
  CLOTH_GREEN: '#228B22',
  LEATHER_DARK: '#654321',
  
  // 피부
  SKIN: '#DEB887',
  SKIN_DARK: '#D2691E',
  
  // 머리카락
  HAIR_BLACK: '#1a1a1a',
  HAIR_BROWN: '#3D2314',
  
  // 특수
  POISON_PURPLE: '#8B008B',
  FLAME_RED: '#FF4500',
  FLAME_ORANGE: '#FFA500',
  WHITE: '#FFFFFF',
  STEAM: '#E0E0E0',
  GOLD: '#FFD700',
};

// ===== 복셀 유닛 정의 타입 =====
export interface VoxelUnitSpec {
  id: number;
  name: string;
  nameEn: string;
  category: 'castle' | 'infantry' | 'ranged' | 'cavalry' | 'regional' | 'siege' | 'wizard';
  head: VoxelHeadSpec;
  body: VoxelBodySpec;
  weapon: VoxelWeaponSpec;
  offHand?: VoxelOffHandSpec;
  mount?: VoxelMountSpec;
  accessories?: VoxelAccessorySpec[];
  effects?: VoxelEffectSpec[];
  forcedColors?: { primary?: string; secondary?: string; };
  description?: string;
}

export interface VoxelHeadSpec {
  type: 'messy_hair' | 'wubian' | 'soldier_helm' | 'tongxiukai' | 
        'heavy_helm' | 'yellow_turban' | 'rattan_hat' | 'turban' |
        'fur_cap' | 'feather_helm' | 'plate_helm' | 'goguryeo_helm' |
        'wolf_skin' | 'boar_skin' | 'base_head' | 'bandana' | 'straw_hat' |
        'noble_crown' | 'commander_helm' | 'dragon_helm' | 'gold_helm' |
        'shaman_mask' | 'tiger_helm' | 'elite_helm';
  details?: string;
  color?: string;
}

export interface VoxelBodySpec {
  type: 'rag_poor' | 'liang_dang' | 'lamellar' | 'heavy_lamellar' |
        'heavy_black' | 'muscle_exposed' | 'leather' | 'rattan' |
        'plate' | 'scale' | 'robe' | 'tribal' | 'naked' | 'sailor' |
        'elite_armor' | 'commander_armor' | 'gold_armor' | 'shaman_robe' |
        'mountain_gear' | 'cataphract';
  details?: string;
  color?: string;
}

export interface VoxelWeaponSpec {
  type: 'none' | 'rusted_dao' | 'dao' | 'ji' | 'zhanmadao' | 'halberd' |
        'spear' | 'bamboo_spear' | 'pike' | 'lance' | 'axe' | 'mace' |
        'dual_swords' | 'guandao' | 'bow' | 'composite_bow' | 'crossbow' |
        'repeater_crossbow' | 'sling' | 'blowgun' | 'scimitar' | 'bone_spear' |
        'trident' | 'club' | 'torch' | 'hook' | 'fire_lance' | 'javelin' |
        'throwing_axe' | 'oil_jar' | 'sniper_bow' | 'heavy_crossbow' | 
        'staff' | 'scripture';
  length?: number;
  details?: string;
}

export interface VoxelOffHandSpec {
  type: 'none' | 'hex_shield' | 'tower_shield' | 'round_shield' |
        'rect_shield' | 'quiver' | 'pavise' | 'hook' | 'flag' | 'torch';
  details?: string;
}

export interface VoxelMountSpec {
  type: 'none' | 'horse' | 'white_horse' | 'black_horse' | 'armored_horse' |
        'full_barding' | 'camel' | 'dire_wolf' | 'elephant' | 'tower_elephant' |
        'siege_ram' | 'trebuchet' | 'ballista' | 'siege_tower' | 'fire_beast' |
        'boat' | 'war_chariot' | 'tiger' | 'scout_horse';
  details?: string;
  color?: string;
}

export interface VoxelAccessorySpec {
  type: 'talisman' | 'pouch' | 'flag' | 'cape' | 'thumb_ring' |
        'leg_wrap' | 'gauntlet' | 'arrow_stuck' | 'blood_stain' |
        'poison_jar' | 'camouflage' | 'feather' | 'banner' | 'drum' | 'quiver';
  position?: string;
  color?: string;
}

export interface VoxelEffectSpec {
  type: 'steam_breath' | 'flame' | 'sling_motion' | 'poison_drip' |
        'dust' | 'wet_leather' | 'smoke' | 'splash' | 'curse_aura';
  details?: string;
}

// ===== 애니메이션 상태 타입 =====
export type VoxelAnimationState = 
  | 'idle'      // 대기: 기본 자세, 미세한 호흡/흔들림
  | 'attack'    // 공격: 무기 휘두르기/찌르기/발사
  | 'defend'    // 방어: 방패 들기/웅크리기
  | 'hit'       // 피해: 뒤로 밀림/붉은 플래시
  | 'death'     // 쓰러짐: 쓰러지는 애니메이션
  | 'walk'      // 이동: 걷기/달리기
  | 'charge';   // 돌격: 기병 돌격 자세

// ===== 애니메이션 키프레임 정의 =====
export interface VoxelAnimationKeyframe {
  time: number;        // 0~1 사이 타임라인 위치
  transforms: {
    // 파츠별 변환
    head?: { rotX?: number; rotY?: number; rotZ?: number; posY?: number };
    torso?: { rotX?: number; rotY?: number; rotZ?: number; posY?: number };
    rightArm?: { rotX?: number; rotY?: number; rotZ?: number };
    leftArm?: { rotX?: number; rotY?: number; rotZ?: number };
    rightLeg?: { rotX?: number; rotY?: number; rotZ?: number };
    leftLeg?: { rotX?: number; rotY?: number; rotZ?: number };
    weapon?: { rotX?: number; rotY?: number; rotZ?: number; posX?: number; posY?: number; posZ?: number };
    shield?: { rotX?: number; rotY?: number; rotZ?: number };
    mount?: { rotX?: number; posY?: number };
  };
  colorOverlay?: string;   // 색상 오버레이 (피해 시 붉은색 등)
  scale?: number;          // 전체 스케일 (쓰러짐 시 축소 등)
}

// ===== 애니메이션 시퀀스 정의 =====
export interface VoxelAnimationSequence {
  name: VoxelAnimationState;
  duration: number;        // 밀리초
  loop: boolean;           // 반복 여부
  keyframes: VoxelAnimationKeyframe[];
}

// ===== 기본 애니메이션 프리셋 =====
export const VOXEL_ANIMATIONS: Record<VoxelAnimationState, VoxelAnimationSequence> = {
  // 대기: 미세한 호흡 효과
  idle: {
    name: 'idle',
    duration: 2000,
    loop: true,
    keyframes: [
      { time: 0, transforms: { torso: { posY: 0 }, head: { rotX: 0 } } },
      { time: 0.5, transforms: { torso: { posY: 0.02 }, head: { rotX: -0.05 } } },
      { time: 1, transforms: { torso: { posY: 0 }, head: { rotX: 0 } } },
    ],
  },
  
  // 공격: 무기 휘두르기
  attack: {
    name: 'attack',
    duration: 600,
    loop: false,
    keyframes: [
      { time: 0, transforms: { 
        rightArm: { rotX: 0, rotZ: 0 }, 
        weapon: { rotX: 0, rotZ: 0 },
        torso: { rotY: 0 }
      }},
      { time: 0.2, transforms: { 
        rightArm: { rotX: -1.2, rotZ: -0.3 }, // 뒤로 젖힘
        weapon: { rotX: -1.2, rotZ: -0.3 },
        torso: { rotY: -0.2 }
      }},
      { time: 0.5, transforms: { 
        rightArm: { rotX: 0.8, rotZ: 0.5 }, // 앞으로 휘두름
        weapon: { rotX: 0.8, rotZ: 0.5 },
        torso: { rotY: 0.3 }
      }},
      { time: 1, transforms: { 
        rightArm: { rotX: 0, rotZ: 0 }, 
        weapon: { rotX: 0, rotZ: 0 },
        torso: { rotY: 0 }
      }},
    ],
  },
  
  // 방어: 방패 들기/웅크리기
  defend: {
    name: 'defend',
    duration: 400,
    loop: false,
    keyframes: [
      { time: 0, transforms: { 
        leftArm: { rotX: 0, rotZ: 0 },
        shield: { rotY: 0 },
        torso: { rotX: 0, posY: 0 }
      }},
      { time: 0.3, transforms: { 
        leftArm: { rotX: -0.5, rotZ: 0.8 }, // 방패 들어올림
        shield: { rotY: -0.3 },
        torso: { rotX: 0.2, posY: -0.03 } // 살짝 웅크림
      }},
      { time: 1, transforms: { 
        leftArm: { rotX: -0.5, rotZ: 0.8 },
        shield: { rotY: -0.3 },
        torso: { rotX: 0.2, posY: -0.03 }
      }},
    ],
  },
  
  // 피해: 뒤로 밀림 + 붉은 플래시
  hit: {
    name: 'hit',
    duration: 400,
    loop: false,
    keyframes: [
      { time: 0, transforms: { torso: { rotX: 0, posY: 0 } }, colorOverlay: undefined },
      { time: 0.2, transforms: { torso: { rotX: -0.3, posY: 0.02 } }, colorOverlay: '#ff0000' }, // 뒤로 젖힘 + 붉은 플래시
      { time: 0.5, transforms: { torso: { rotX: -0.15, posY: 0.01 } }, colorOverlay: '#ff6666' },
      { time: 1, transforms: { torso: { rotX: 0, posY: 0 } }, colorOverlay: undefined },
    ],
  },
  
  // 쓰러짐: 옆으로 쓰러짐
  death: {
    name: 'death',
    duration: 800,
    loop: false,
    keyframes: [
      { time: 0, transforms: { 
        torso: { rotX: 0, rotZ: 0, posY: 0 },
        head: { rotX: 0 },
        rightArm: { rotZ: 0 },
        leftArm: { rotZ: 0 }
      }, scale: 1 },
      { time: 0.3, transforms: { 
        torso: { rotX: 0.2, rotZ: 0.5, posY: -0.02 },
        head: { rotX: -0.3 },
        rightArm: { rotZ: 0.5 },
        leftArm: { rotZ: -0.3 }
      }, scale: 1 },
      { time: 0.6, transforms: { 
        torso: { rotX: 0.4, rotZ: 1.2, posY: -0.08 },
        head: { rotX: -0.5 },
        rightArm: { rotZ: 1.0 },
        leftArm: { rotZ: -0.5 }
      }, scale: 0.95 },
      { time: 1, transforms: { 
        torso: { rotX: 0.5, rotZ: 1.57, posY: -0.12 }, // 완전히 옆으로 누움
        head: { rotX: -0.6 },
        rightArm: { rotZ: 1.2 },
        leftArm: { rotZ: -0.6 }
      }, scale: 0.9, colorOverlay: '#666666' }, // 회색빛 (사망)
    ],
  },
  
  // 이동: 걷기
  walk: {
    name: 'walk',
    duration: 800,
    loop: true,
    keyframes: [
      { time: 0, transforms: { 
        rightLeg: { rotX: 0.4 }, leftLeg: { rotX: -0.4 },
        rightArm: { rotX: -0.3 }, leftArm: { rotX: 0.3 },
        torso: { posY: 0 }
      }},
      { time: 0.25, transforms: { 
        rightLeg: { rotX: 0 }, leftLeg: { rotX: 0 },
        rightArm: { rotX: 0 }, leftArm: { rotX: 0 },
        torso: { posY: 0.02 }
      }},
      { time: 0.5, transforms: { 
        rightLeg: { rotX: -0.4 }, leftLeg: { rotX: 0.4 },
        rightArm: { rotX: 0.3 }, leftArm: { rotX: -0.3 },
        torso: { posY: 0 }
      }},
      { time: 0.75, transforms: { 
        rightLeg: { rotX: 0 }, leftLeg: { rotX: 0 },
        rightArm: { rotX: 0 }, leftArm: { rotX: 0 },
        torso: { posY: 0.02 }
      }},
      { time: 1, transforms: { 
        rightLeg: { rotX: 0.4 }, leftLeg: { rotX: -0.4 },
        rightArm: { rotX: -0.3 }, leftArm: { rotX: 0.3 },
        torso: { posY: 0 }
      }},
    ],
  },
  
  // 돌격: 기병용 돌격 자세
  charge: {
    name: 'charge',
    duration: 600,
    loop: true,
    keyframes: [
      { time: 0, transforms: { 
        torso: { rotX: -0.3, posY: 0 }, // 앞으로 숙임
        rightArm: { rotX: -0.8 }, // 창 앞으로
        weapon: { rotX: -0.5 },
        mount: { posY: 0 }
      }},
      { time: 0.5, transforms: { 
        torso: { rotX: -0.35, posY: 0.03 },
        rightArm: { rotX: -0.85 },
        weapon: { rotX: -0.55 },
        mount: { posY: 0.05 } // 말 뛰는 동작
      }},
      { time: 1, transforms: { 
        torso: { rotX: -0.3, posY: 0 },
        rightArm: { rotX: -0.8 },
        weapon: { rotX: -0.5 },
        mount: { posY: 0 }
      }},
    ],
  },
};

// ===== 무기 타입별 공격 모션 =====
export type WeaponAttackType = 
  | 'slash'        // 베기 (도검류)
  | 'thrust'       // 찌르기 (창류)
  | 'swing'        // 휘두르기 (둔기류)
  | 'shoot_bow'    // 활 쏘기
  | 'shoot_xbow'   // 쇠뇌 쏘기
  | 'throw'        // 투척
  | 'cast'         // 시전 (책사)
  | 'charge'       // 돌격 (기병)
  | 'siege';       // 공성

// 무기 → 공격 타입 매핑
export const WEAPON_ATTACK_TYPE_MAP: Record<VoxelWeaponSpec['type'], WeaponAttackType> = {
  none: 'slash',
  rusted_dao: 'slash', dao: 'slash', dual_swords: 'slash', scimitar: 'slash',
  ji: 'thrust', halberd: 'thrust', spear: 'thrust', bamboo_spear: 'thrust',
  pike: 'thrust', lance: 'charge', trident: 'thrust', bone_spear: 'thrust',
  zhanmadao: 'swing', axe: 'swing', mace: 'swing', club: 'swing',
  guandao: 'swing',
  bow: 'shoot_bow', composite_bow: 'shoot_bow', sniper_bow: 'shoot_bow',
  crossbow: 'shoot_xbow', repeater_crossbow: 'shoot_xbow', heavy_crossbow: 'shoot_xbow',
  sling: 'throw', javelin: 'throw', throwing_axe: 'throw', oil_jar: 'throw',
  blowgun: 'shoot_xbow',
  torch: 'throw', fire_lance: 'thrust', hook: 'swing',
  staff: 'cast', scripture: 'cast',
};

// ===== 무기 타입별 공격 애니메이션 =====
// 현재 복셀 유닛은 하나의 덩어리이므로 torso(전체)와 weapon만 변환 가능
export const WEAPON_ATTACK_ANIMATIONS: Record<WeaponAttackType, VoxelAnimationSequence> = {
  // 베기 (도검류) - 대각선 베기
  slash: {
    name: 'attack', duration: 600, loop: false,
    keyframes: [
      { time: 0, transforms: { 
        torso: { rotX: 0, rotY: 0, rotZ: 0, posY: 0 }, 
        weapon: { rotX: 0, rotY: 0, rotZ: 0 } 
      }},
      { time: 0.2, transforms: { 
        torso: { rotX: -0.15, rotY: -0.3, rotZ: 0, posY: 0.02 }, // 뒤로 젖힘
        weapon: { rotX: -0.8, rotY: 0, rotZ: -0.5 } 
      }},
      { time: 0.45, transforms: { 
        torso: { rotX: 0.2, rotY: 0.4, rotZ: 0.1, posY: -0.02 }, // 앞으로 베기
        weapon: { rotX: 0.6, rotY: 0.3, rotZ: 0.8 } 
      }},
      { time: 0.6, transforms: { 
        torso: { rotX: 0.1, rotY: 0.2, rotZ: 0.05, posY: -0.01 },
        weapon: { rotX: 0.3, rotY: 0.15, rotZ: 0.4 } 
      }},
      { time: 1, transforms: { 
        torso: { rotX: 0, rotY: 0, rotZ: 0, posY: 0 }, 
        weapon: { rotX: 0, rotY: 0, rotZ: 0 } 
      }},
    ],
  },
  
  // 찌르기 (창류) - 직선 찌르기
  thrust: {
    name: 'attack', duration: 500, loop: false,
    keyframes: [
      { time: 0, transforms: { 
        torso: { rotX: 0, rotY: 0, posY: 0 }, 
        weapon: { rotX: 0, posX: 0, posZ: 0 } 
      }},
      { time: 0.15, transforms: { 
        torso: { rotX: 0.1, rotY: -0.15, posY: 0.01 }, // 뒤로 준비
        weapon: { rotX: 0.2, posX: -0.03, posZ: -0.02 } 
      }},
      { time: 0.35, transforms: { 
        torso: { rotX: -0.2, rotY: 0.2, posY: -0.02 }, // 앞으로 찌르기
        weapon: { rotX: -0.4, posX: 0.12, posZ: 0.08 } 
      }},
      { time: 0.5, transforms: { 
        torso: { rotX: -0.15, rotY: 0.15, posY: -0.01 },
        weapon: { rotX: -0.3, posX: 0.1, posZ: 0.06 } 
      }},
      { time: 1, transforms: { 
        torso: { rotX: 0, rotY: 0, posY: 0 }, 
        weapon: { rotX: 0, posX: 0, posZ: 0 } 
      }},
    ],
  },
  
  // 휘두르기 (둔기류) - 오버헤드 스윙
  swing: {
    name: 'attack', duration: 700, loop: false,
    keyframes: [
      { time: 0, transforms: { 
        torso: { rotX: 0, rotY: 0, posY: 0 }, 
        weapon: { rotX: 0, rotY: 0 } 
      }},
      { time: 0.25, transforms: { 
        torso: { rotX: -0.25, rotY: 0, posY: 0.03 }, // 뒤로 젖힘
        weapon: { rotX: -1.2, rotY: 0 } 
      }},
      { time: 0.45, transforms: { 
        torso: { rotX: 0.3, rotY: 0, posY: -0.03 }, // 내려치기
        weapon: { rotX: 0.8, rotY: 0 } 
      }},
      { time: 0.6, transforms: { 
        torso: { rotX: 0.2, rotY: 0, posY: -0.02 },
        weapon: { rotX: 0.5, rotY: 0 } 
      }},
      { time: 1, transforms: { 
        torso: { rotX: 0, rotY: 0, posY: 0 }, 
        weapon: { rotX: 0, rotY: 0 } 
      }},
    ],
  },
  
  // 활 쏘기 - 시위 당기고 발사 (torso + weapon으로 표현)
  shoot_bow: {
    name: 'attack', duration: 1000, loop: false,
    keyframes: [
      { time: 0, transforms: { 
        torso: { rotX: 0, rotY: 0, posY: 0 }, 
        weapon: { rotX: 0, rotY: 0, rotZ: 0 } 
      }},
      { time: 0.15, transforms: { 
        torso: { rotX: -0.1, rotY: -0.3, posY: 0.01 }, // 몸 틀기 시작
        weapon: { rotX: -0.3, rotY: -0.2, rotZ: 0.2 } // 활 들기
      }},
      { time: 0.4, transforms: { 
        torso: { rotX: -0.15, rotY: -0.4, posY: 0.02 }, // 조준 자세
        weapon: { rotX: -0.4, rotY: -0.3, rotZ: 0.3 } // 활 당기기
      }},
      { time: 0.7, transforms: { 
        torso: { rotX: -0.2, rotY: -0.45, posY: 0.02 }, // 최대 당김
        weapon: { rotX: -0.5, rotY: -0.35, rotZ: 0.35 }
      }},
      { time: 0.75, transforms: { 
        torso: { rotX: 0.1, rotY: 0.1, posY: -0.01 }, // 발사! 반동
        weapon: { rotX: 0.2, rotY: 0.1, rotZ: -0.1 }
      }},
      { time: 0.85, transforms: { 
        torso: { rotX: 0.05, rotY: 0.05, posY: 0 },
        weapon: { rotX: 0.1, rotY: 0.05, rotZ: 0 }
      }},
      { time: 1, transforms: { 
        torso: { rotX: 0, rotY: 0, posY: 0 }, 
        weapon: { rotX: 0, rotY: 0, rotZ: 0 } 
      }},
    ],
  },
  
  // 쇠뇌 쏘기 - 조준 후 발사
  shoot_xbow: {
    name: 'attack', duration: 800, loop: false,
    keyframes: [
      { time: 0, transforms: { 
        torso: { rotX: 0, rotY: 0, posY: 0 }, 
        weapon: { rotX: 0, rotY: 0 } 
      }},
      { time: 0.25, transforms: { 
        torso: { rotX: -0.1, rotY: -0.15, posY: 0.01 }, // 조준
        weapon: { rotX: -0.2, rotY: -0.1 } 
      }},
      { time: 0.6, transforms: { 
        torso: { rotX: -0.1, rotY: -0.15, posY: 0.01 }, // 유지
        weapon: { rotX: -0.2, rotY: -0.1 } 
      }},
      { time: 0.7, transforms: { 
        torso: { rotX: 0.1, rotY: 0.05, posY: -0.01 }, // 발사 반동
        weapon: { rotX: 0.15, rotY: 0.05 } 
      }},
      { time: 1, transforms: { 
        torso: { rotX: 0, rotY: 0, posY: 0 }, 
        weapon: { rotX: 0, rotY: 0 } 
      }},
    ],
  },
  
  // 투척 - 팔 휘두르며 던지기
  throw: {
    name: 'attack', duration: 600, loop: false,
    keyframes: [
      { time: 0, transforms: { 
        torso: { rotX: 0, rotY: 0, rotZ: 0, posY: 0 }, 
        weapon: { rotX: 0, rotY: 0, posX: 0 } 
      }},
      { time: 0.25, transforms: { 
        torso: { rotX: -0.15, rotY: -0.4, rotZ: -0.1, posY: 0.02 }, // 뒤로 젖힘
        weapon: { rotX: -0.8, rotY: -0.3, posX: -0.05 } 
      }},
      { time: 0.45, transforms: { 
        torso: { rotX: 0.2, rotY: 0.3, rotZ: 0.1, posY: -0.02 }, // 던지기
        weapon: { rotX: 0.6, rotY: 0.4, posX: 0.1 } 
      }},
      { time: 0.6, transforms: { 
        torso: { rotX: 0.1, rotY: 0.2, rotZ: 0.05, posY: -0.01 },
        weapon: { rotX: 0.3, rotY: 0.2, posX: 0.05 } 
      }},
      { time: 1, transforms: { 
        torso: { rotX: 0, rotY: 0, rotZ: 0, posY: 0 }, 
        weapon: { rotX: 0, rotY: 0, posX: 0 } 
      }},
    ],
  },
  
  // 시전 (책사) - 마법 시전
  cast: {
    name: 'attack', duration: 1200, loop: false,
    keyframes: [
      { time: 0, transforms: { 
        torso: { rotX: 0, rotY: 0, posY: 0 }, 
        weapon: { rotX: 0, rotY: 0 } 
      }},
      { time: 0.2, transforms: { 
        torso: { rotX: -0.15, rotY: 0, posY: 0.02 }, // 준비
        weapon: { rotX: -0.5, rotY: 0 } 
      }},
      { time: 0.4, transforms: { 
        torso: { rotX: -0.25, rotY: 0, posY: 0.03 }, // 집중
        weapon: { rotX: -0.8, rotY: 0.2 } 
      }, colorOverlay: '#6633ff' },
      { time: 0.6, transforms: { 
        torso: { rotX: -0.3, rotY: 0, posY: 0.04 }, // 최대 집중
        weapon: { rotX: -1.0, rotY: 0.3 } 
      }, colorOverlay: '#9966ff' },
      { time: 0.75, transforms: { 
        torso: { rotX: 0.15, rotY: 0, posY: -0.02 }, // 발사!
        weapon: { rotX: 0.3, rotY: -0.2 } 
      }, colorOverlay: '#cc99ff' },
      { time: 1, transforms: { 
        torso: { rotX: 0, rotY: 0, posY: 0 }, 
        weapon: { rotX: 0, rotY: 0 } 
      }},
    ],
  },
  
  // 돌격 (기병) - 창 내밀며 돌격
  charge: {
    name: 'attack', duration: 500, loop: false,
    keyframes: [
      { time: 0, transforms: { 
        torso: { rotX: -0.2, rotY: 0, posY: 0 }, 
        weapon: { rotX: -0.3, posX: 0 }, 
        mount: { posY: 0 } 
      }},
      { time: 0.3, transforms: { 
        torso: { rotX: -0.4, rotY: 0.15, posY: 0.02 }, // 앞으로 숙임
        weapon: { rotX: -0.6, posX: 0.1 }, 
        mount: { posY: 0.04 } // 말 뛰기
      }},
      { time: 0.5, transforms: { 
        torso: { rotX: -0.45, rotY: 0.2, posY: 0.01 }, // 최대 돌격
        weapon: { rotX: -0.7, posX: 0.15 }, 
        mount: { posY: 0.02 } 
      }},
      { time: 0.7, transforms: { 
        torso: { rotX: -0.3, rotY: 0.1, posY: 0 },
        weapon: { rotX: -0.4, posX: 0.08 }, 
        mount: { posY: 0 } 
      }},
      { time: 1, transforms: { 
        torso: { rotX: -0.2, rotY: 0, posY: 0 }, 
        weapon: { rotX: -0.3, posX: 0 }, 
        mount: { posY: 0 } 
      }},
    ],
  },
  
  // 공성 - 장비 작동
  siege: {
    name: 'attack', duration: 1500, loop: false,
    keyframes: [
      { time: 0, transforms: { 
        torso: { rotX: 0, rotY: 0, posY: 0 } 
      }},
      { time: 0.3, transforms: { 
        torso: { rotX: -0.2, rotY: 0, posY: 0.02 } // 준비
      }},
      { time: 0.5, transforms: { 
        torso: { rotX: -0.3, rotY: 0, posY: 0.03 } // 당김/조작
      }},
      { time: 0.7, transforms: { 
        torso: { rotX: 0.15, rotY: 0, posY: -0.02 } // 발사/작동
      }},
      { time: 1, transforms: { 
        torso: { rotX: 0, rotY: 0, posY: 0 } 
      }},
    ],
  },
};

// ===== 투사체 타입 =====
export type ProjectileType = 
  | 'arrow'           // 화살
  | 'fire_arrow'      // 불화살
  | 'bolt'            // 쇠뇌 화살
  | 'stone'           // 투석
  | 'javelin'         // 투창
  | 'throwing_axe'    // 투척 도끼
  | 'oil_jar'         // 기름 단지
  | 'poison_dart'     // 독침
  | 'fireball'        // 화염구 (마법)
  | 'lightning'       // 번개 (마법)
  | 'curse'           // 저주 (마법)
  | 'heal_wave'       // 치유파 (마법)
  | 'boulder'         // 투석기 바위
  | 'fire_boulder';   // 화염 투석

// 투사체 정의
export interface ProjectileSpec {
  type: ProjectileType;
  speed: number;          // 초당 유닛 이동
  gravity: number;        // 중력 영향 (0 = 직선, 1 = 포물선)
  size: [number, number, number]; // 복셀 크기
  color: string;
  trail?: {               // 궤적 이펙트
    enabled: boolean;
    color: string;
    length: number;
  };
  impact?: {              // 충돌 이펙트
    type: 'none' | 'spark' | 'explosion' | 'splash' | 'magic';
    radius: number;
    color: string;
  };
}

// 투사체 데이터베이스
export const PROJECTILE_DATABASE: Record<ProjectileType, ProjectileSpec> = {
  arrow: {
    type: 'arrow', speed: 15, gravity: 0.3,
    size: [0.8, 0.05, 0.05], color: '#8B4513',
    trail: { enabled: true, color: '#D2B48C', length: 3 },
    impact: { type: 'spark', radius: 0.1, color: '#FFD700' },
  },
  fire_arrow: {
    type: 'fire_arrow', speed: 14, gravity: 0.3,
    size: [0.8, 0.05, 0.05], color: '#8B4513',
    trail: { enabled: true, color: '#FF4500', length: 5 },
    impact: { type: 'explosion', radius: 0.3, color: '#FF6600' },
  },
  bolt: {
    type: 'bolt', speed: 20, gravity: 0.1,
    size: [0.6, 0.06, 0.06], color: '#4A4A4A',
    trail: { enabled: true, color: '#808080', length: 2 },
    impact: { type: 'spark', radius: 0.1, color: '#C0C0C0' },
  },
  stone: {
    type: 'stone', speed: 10, gravity: 0.8,
    size: [0.15, 0.15, 0.15], color: '#696969',
    trail: { enabled: false, color: '', length: 0 },
    impact: { type: 'splash', radius: 0.15, color: '#A0A0A0' },
  },
  javelin: {
    type: 'javelin', speed: 12, gravity: 0.4,
    size: [1.2, 0.04, 0.04], color: '#8B4513',
    trail: { enabled: true, color: '#D2B48C', length: 2 },
    impact: { type: 'spark', radius: 0.1, color: '#FFD700' },
  },
  throwing_axe: {
    type: 'throwing_axe', speed: 11, gravity: 0.5,
    size: [0.3, 0.25, 0.08], color: '#4A4A4A',
    trail: { enabled: true, color: '#808080', length: 2 },
    impact: { type: 'spark', radius: 0.15, color: '#FF4500' },
  },
  oil_jar: {
    type: 'oil_jar', speed: 8, gravity: 0.9,
    size: [0.2, 0.25, 0.2], color: '#8B4513',
    trail: { enabled: false, color: '', length: 0 },
    impact: { type: 'explosion', radius: 0.5, color: '#FF6600' },
  },
  poison_dart: {
    type: 'poison_dart', speed: 18, gravity: 0.05,
    size: [0.4, 0.02, 0.02], color: '#228B22',
    trail: { enabled: true, color: '#9932CC', length: 4 },
    impact: { type: 'splash', radius: 0.1, color: '#9932CC' },
  },
  fireball: {
    type: 'fireball', speed: 12, gravity: 0,
    size: [0.25, 0.25, 0.25], color: '#FF4500',
    trail: { enabled: true, color: '#FFD700', length: 6 },
    impact: { type: 'explosion', radius: 0.6, color: '#FF6600' },
  },
  lightning: {
    type: 'lightning', speed: 50, gravity: 0,
    size: [0.1, 0.1, 2], color: '#00BFFF',
    trail: { enabled: true, color: '#87CEEB', length: 8 },
    impact: { type: 'magic', radius: 0.4, color: '#00BFFF' },
  },
  curse: {
    type: 'curse', speed: 8, gravity: 0,
    size: [0.3, 0.3, 0.3], color: '#9932CC',
    trail: { enabled: true, color: '#4B0082', length: 5 },
    impact: { type: 'magic', radius: 0.5, color: '#9932CC' },
  },
  heal_wave: {
    type: 'heal_wave', speed: 10, gravity: 0,
    size: [0.4, 0.4, 0.4], color: '#00FF7F',
    trail: { enabled: true, color: '#98FB98', length: 4 },
    impact: { type: 'magic', radius: 0.6, color: '#00FF7F' },
  },
  boulder: {
    type: 'boulder', speed: 8, gravity: 0.7,
    size: [0.5, 0.5, 0.5], color: '#696969',
    trail: { enabled: false, color: '', length: 0 },
    impact: { type: 'explosion', radius: 0.8, color: '#A0A0A0' },
  },
  fire_boulder: {
    type: 'fire_boulder', speed: 8, gravity: 0.7,
    size: [0.5, 0.5, 0.5], color: '#8B0000',
    trail: { enabled: true, color: '#FF4500', length: 5 },
    impact: { type: 'explosion', radius: 1.0, color: '#FF6600' },
  },
};

// 무기 → 투사체 매핑
export const WEAPON_PROJECTILE_MAP: Partial<Record<VoxelWeaponSpec['type'], ProjectileType>> = {
  bow: 'arrow',
  composite_bow: 'arrow',
  sniper_bow: 'arrow',
  crossbow: 'bolt',
  repeater_crossbow: 'bolt',
  heavy_crossbow: 'bolt',
  sling: 'stone',
  javelin: 'javelin',
  throwing_axe: 'throwing_axe',
  oil_jar: 'oil_jar',
  blowgun: 'poison_dart',
  torch: 'fire_arrow',
  staff: 'fireball',     // 기본 마법
  scripture: 'curse',    // 저주 마법
};

// 유닛별 특수 투사체 오버라이드 (특정 유닛만)
export const UNIT_PROJECTILE_OVERRIDE: Partial<Record<number, ProjectileType>> = {
  1211: 'fire_arrow',    // 화염궁병
  1212: 'poison_dart',   // 독침병
  1213: 'oil_jar',       // 기름단지병
  1408: 'curse',         // 마귀병
  1407: 'lightning',     // 천귀병
  1420: 'fireball',      // 화공대
  1469: 'fire_arrow',    // 화시병
  1501: 'boulder',       // 벽력거
  1507: 'fire_boulder',  // 화염투석기
};

// ===== 카테고리별 기본 공격 애니메이션 (무기 타입이 없을 때 폴백) =====
export const CATEGORY_ATTACK_ANIMATIONS: Partial<Record<VoxelUnitSpec['category'], VoxelAnimationSequence>> = {
  infantry: WEAPON_ATTACK_ANIMATIONS.slash,
  ranged: WEAPON_ATTACK_ANIMATIONS.shoot_bow,
  cavalry: WEAPON_ATTACK_ANIMATIONS.charge,
  wizard: WEAPON_ATTACK_ANIMATIONS.cast,
  siege: WEAPON_ATTACK_ANIMATIONS.siege,
  regional: WEAPON_ATTACK_ANIMATIONS.slash,
};

// ===== units.json 동기화 유닛 데이터베이스 =====
export const VOXEL_UNIT_DATABASE: Record<number, VoxelUnitSpec> = {
  // ============================================
  // 0. 성 (Castle): 1000
  // ============================================
  1000: { id: 1000, name: '성벽', nameEn: 'Castle Wall', category: 'castle',
    head: { type: 'base_head' }, body: { type: 'plate' }, weapon: { type: 'none' },
    description: '도시를 방어하는 성벽입니다.'
  },

  // ============================================
  // 1. 보병 (Infantry): 1100 ~ 1128 (Voxels 사양서 기반)
  // Grid: 32(X) x 32(Y) x 48(Z), 6~6.5등신
  // ============================================
  
  // [1100] 도민병 - 빈곤한 농민 징집병
  1100: { id: 1100, name: '도민병', nameEn: 'Peasant Militia', category: 'infantry',
    head: { type: 'messy_hair', details: '헝클어진 머리, 맨발', color: VOXEL_PALETTE.HAIR_BLACK },
    body: { type: 'rag_poor', details: '누더기 삼베옷, 상의 탈의/찢어짐, 신발 없음', color: VOXEL_PALETTE.CLOTH_BROWN },
    weapon: { type: 'rusted_dao', length: 90, details: '녹슨 낫/괭이' },
    forcedColors: { primary: VOXEL_PALETTE.CLOTH_BROWN },
    description: '[빈곤] 굶주린 농민, 절망적 표정'
  },
  
  // [1101] 창민병 - 저항하는 농민병
  1101: { id: 1101, name: '창민병', nameEn: 'Bamboo Spearman', category: 'infantry',
    head: { type: 'bandana', details: '머리에 띠를 두름', color: VOXEL_PALETTE.CLOTH_BROWN },
    body: { type: 'rag_poor', details: '갈색 삼베옷, 짚신', color: VOXEL_PALETTE.CLOTH_BROWN },
    weapon: { type: 'bamboo_spear', length: 200, details: '죽창(대나무 마디 표현, 황금색 #DAA520)' },
    description: '[저항] 도민병보다 나은 복장'
  },
  
  // [1102] 정규보병 - 규율있는 한나라 병사
  1102: { id: 1102, name: '정규보병', nameEn: 'Standard Infantry', category: 'infantry',
    head: { type: 'wubian', details: '무변(납작한 가죽 모자)', color: VOXEL_PALETTE.LACQUER_BLACK },
    body: { type: 'liang_dang', details: '붉은 양당개(옻칠 찰갑), 검은 옷 위', color: VOXEL_PALETTE.LACQUER_RED },
    weapon: { type: 'dao', length: 90, details: '환수도(고리자루 칼)' },
    offHand: { type: 'round_shield', details: '둥근 목재 방패' },
    forcedColors: { primary: VOXEL_PALETTE.LACQUER_RED },
    description: '[규율] 훈련받은 한나라 정규군'
  },
  
  // [1103] 정규창병 - 방어형 창병
  1103: { id: 1103, name: '정규창병', nameEn: 'Regular Spearman', category: 'infantry',
    head: { type: 'soldier_helm', details: '정규군 철모 + 볼가리개' },
    body: { type: 'liang_dang', details: '붉은 양당개 + 팔 보호대(완갑)', color: VOXEL_PALETTE.LACQUER_RED },
    weapon: { type: 'spear', length: 240, details: '붉은 술이 달린 긴 창' },
    description: '[방어] 기병 돌격을 저지'
  },
  
  // [1104] 정규극병 - 후한의 상징
  1104: { id: 1104, name: '정규극병', nameEn: 'Ji Halberdier', category: 'infantry',
    head: { type: 'soldier_helm', details: '철모 + 작은 붉은 장식', color: VOXEL_PALETTE.LACQUER_RED },
    body: { type: 'lamellar', details: '양당개 + 가죽 견갑', color: VOXEL_PALETTE.LACQUER_RED },
    weapon: { type: 'ji', length: 240, details: '극(ㄱ자 창+낫 형태)' },
    description: '[후한의 상징] 극 무기 강조'
  },
  
  // [1105] 방패보병 - 방벽
  1105: { id: 1105, name: '방패보병', nameEn: 'Shieldbearer', category: 'infantry',
    head: { type: 'soldier_helm', details: '철모' },
    body: { type: 'liang_dang', details: '양당개 + 어깨 보강', color: VOXEL_PALETTE.LACQUER_RED },
    weapon: { type: 'dao', details: '한손검' },
    offHand: { type: 'rect_shield', details: '직사각형 목재 방패' },
    description: '[방벽] 몸을 가리는 방패'
  },
  
  // [1106] 대방패병 - 철벽
  1106: { id: 1106, name: '대방패병', nameEn: 'Tower Shield Infantry', category: 'infantry',
    head: { type: 'heavy_helm', details: '얼굴 가리는 철제 투구', color: VOXEL_PALETTE.IRON_BASE },
    body: { type: 'heavy_lamellar', details: '중장 양당개, 철판 보강', color: VOXEL_PALETTE.IRON_BASE },
    weapon: { type: 'spear', length: 180, details: '짧은 창' },
    offHand: { type: 'tower_shield', details: '타워 실드(철판 보강 #708090)' },
    description: '[철벽] 아군을 보호하는 철벽'
  },
  
  // [1107] 양손도끼병 - 파괴
  1107: { id: 1107, name: '양손도끼병', nameEn: 'Two-Handed Axeman', category: 'infantry',
    head: { type: 'soldier_helm', details: '철모' },
    body: { type: 'muscle_exposed', details: '근육질 체형, 갑옷 최소화', color: VOXEL_PALETTE.SKIN },
    weapon: { type: 'axe', details: '양손 대형 도끼(날이 넓음)' },
    description: '[파괴] 공격성 부각, 방어력 포기'
  },
  
  // [1108] 장창병 - 대기병
  1108: { id: 1108, name: '장창병', nameEn: 'Pikeman', category: 'infantry',
    head: { type: 'soldier_helm', details: '철모' },
    body: { type: 'lamellar', details: '찰갑, 다리 감싸개' },
    weapon: { type: 'pike', length: 400, details: '장창(유닛 키의 2배, 창끝 낮게)' },
    description: '[대기병] 창을 낮게 든 자세'
  },
  
  // [1109] 쌍검병 - 민첩
  1109: { id: 1109, name: '쌍검병', nameEn: 'Dual Swordsman', category: 'infantry',
    head: { type: 'soldier_helm', details: '경량 투구' },
    body: { type: 'leather', details: '가벼운 가죽 갑옷, 망토/긴 옷자락 휘날림', color: VOXEL_PALETTE.LEATHER_DARK },
    weapon: { type: 'dual_swords', details: '양손에 얇은 환수도' },
    accessories: [{ type: 'cape', color: VOXEL_PALETTE.CLOTH_BROWN }],
    description: '[민첩] 빠른 속도'
  },
  
  // [1110] 철퇴병 - 타격
  1110: { id: 1110, name: '철퇴병', nameEn: 'Mace Infantry', category: 'infantry',
    head: { type: 'heavy_helm', details: '중장 투구' },
    body: { type: 'heavy_lamellar', details: '두꺼운 철제 견갑, 묵직한 실루엣', color: VOXEL_PALETTE.IRON_BASE },
    weapon: { type: 'mace', details: '육각 철퇴' },
    offHand: { type: 'round_shield', details: '소형 방패' },
    description: '[타격] 중장갑 적에게 효과적'
  },
  
  // [1111] 수군 - 해상 (배만 표시)
  1111: { id: 1111, name: '수군', nameEn: 'Marine', category: 'infantry',
    head: { type: 'bandana', details: '두건', color: VOXEL_PALETTE.CLOTH_BLUE },
    body: { type: 'sailor', details: '푸른색 활동복(#4682B4), 갑옷 대신', color: VOXEL_PALETTE.CLOTH_BLUE },
    weapon: { type: 'dao', details: '짧은 검' },
    offHand: { type: 'hook', details: '갈고리' },
    mount: { type: 'boat', details: '배' },
    description: '[해상] 수전 전문'
  },
  
  // [1112] 둔전병 - 반농반병
  1112: { id: 1112, name: '둔전병', nameEn: 'Militia Farmer', category: 'infantry',
    head: { type: 'straw_hat', details: '삿갓' },
    body: { type: 'rag_poor', details: '군복 바지 + 농민 상의, 농기구 주머니', color: VOXEL_PALETTE.CLOTH_BROWN },
    weapon: { type: 'spear', details: '창' },
    accessories: [{ type: 'pouch', position: '허리' }],
    description: '[반농반병] 평시 농사, 전시 전투'
  },
  
  // [1113] 황건신도 - 광신
  1113: { id: 1113, name: '황건신도', nameEn: 'Yellow Turban Zealot', category: 'infantry',
    head: { type: 'yellow_turban', details: '노란 두건(#FFD700) 필수', color: VOXEL_PALETTE.CLOTH_YELLOW },
    body: { type: 'rag_poor', details: '찢어진 옷, 부적 붙임', color: VOXEL_PALETTE.CLOTH_BROWN },
    weapon: { type: 'club', details: '농기구/몽둥이' },
    accessories: [{ type: 'talisman', position: '가슴' }],
    forcedColors: { primary: VOXEL_PALETTE.CLOTH_YELLOW },
    description: '[광신] 죽음을 두려워하지 않는 광신도'
  },
  
  // [1114] 황건역사 - 괴력
  1114: { id: 1114, name: '황건역사', nameEn: 'Yellow Turban Elite', category: 'infantry',
    head: { type: 'yellow_turban', details: '노란 두건', color: VOXEL_PALETTE.CLOTH_YELLOW },
    body: { type: 'muscle_exposed', details: '상체 근육 과장, 거대화 버전', color: VOXEL_PALETTE.SKIN },
    weapon: { type: 'club', details: '거대한 나무 기둥/철봉' },
    forcedColors: { primary: VOXEL_PALETTE.CLOTH_YELLOW },
    description: '[괴력] 황건신도의 거대화 버전'
  },
  
  // [1115] 청주병 - 정예화
  1115: { id: 1115, name: '청주병', nameEn: 'Qingzhou Soldier', category: 'infantry',
    head: { type: 'soldier_helm', details: '정규군 투구' },
    body: { type: 'lamellar', details: '조조군 검은색 정규 갑옷', color: VOXEL_PALETTE.LACQUER_BLACK },
    weapon: { type: 'spear', details: '잘 관리된 창' },
    accessories: [{ type: 'banner', position: '팔', color: VOXEL_PALETTE.CLOTH_YELLOW }],
    forcedColors: { primary: VOXEL_PALETTE.LACQUER_BLACK, secondary: VOXEL_PALETTE.CLOTH_YELLOW },
    description: '[정예화] 황건 두건 + 조조군 갑옷'
  },
  
  // [1116] 단양병 - 산악
  1116: { id: 1116, name: '단양병', nameEn: 'Danyang Mountain Soldier', category: 'infantry',
    head: { type: 'soldier_helm', details: '경량 투구' },
    body: { type: 'mountain_gear', details: '팔다리 보호대, 짚신/부츠, 녹색/갈색 위장톤', color: VOXEL_PALETTE.CLOTH_GREEN },
    weapon: { type: 'dual_swords', details: '쌍검 또는 창' },
    description: '[산악] 산악 이동 전문'
  },
  
  // [1117] 함진영 - 중장갑
  1117: { id: 1117, name: '함진영', nameEn: 'Xianjin Elite', category: 'infantry',
    head: { type: 'tongxiukai', details: '전신 흑철 투구 + 면갑(얼굴 가림)', color: VOXEL_PALETTE.LACQUER_BLACK },
    body: { type: 'heavy_black', details: '전신 흑철 갑옷, 묵직한 느낌', color: VOXEL_PALETTE.LACQUER_BLACK },
    weapon: { type: 'halberd', length: 200, details: '도끼/철퇴' },
    offHand: { type: 'tower_shield', details: '대형 방패' },
    forcedColors: { primary: VOXEL_PALETTE.LACQUER_BLACK },
    description: '[중장갑] 고순의 적진 함락 부대'
  },
  
  // [1118] 백이병 - 친위대
  1118: { id: 1118, name: '백이병', nameEn: 'White Feather Guard', category: 'infantry',
    head: { type: 'feather_helm', details: '백색 깃털 장식 투구', color: VOXEL_PALETTE.WHITE },
    body: { type: 'scale', details: '은색 찰갑(#D3D3D3)', color: '#D3D3D3' },
    weapon: { type: 'spear', details: '긴 창' },
    offHand: { type: 'hex_shield', details: '정교한 방패' },
    accessories: [{ type: 'feather', position: '투구', color: VOXEL_PALETTE.WHITE }],
    description: '[친위대] 유비 호위 철벽 방어'
  },
  
  // [1119] 해번병 - 강동
  1119: { id: 1119, name: '해번병', nameEn: 'Haifan Guard', category: 'infantry',
    head: { type: 'elite_helm', details: '장식이 큰 투구', color: VOXEL_PALETTE.GOLD },
    body: { type: 'elite_armor', details: '붉은색/금색 화려한 갑옷', color: VOXEL_PALETTE.LACQUER_RED },
    weapon: { type: 'guandao', details: '언월도 또는 창' },
    offHand: { type: 'hex_shield' },
    forcedColors: { primary: VOXEL_PALETTE.LACQUER_RED, secondary: VOXEL_PALETTE.GOLD },
    description: '[강동] 손권의 친위대'
  },
  
  // [1120] 금군 - 황실
  1120: { id: 1120, name: '금군', nameEn: 'Imperial Guard', category: 'infantry',
    head: { type: 'gold_helm', details: '황금색 테두리 투구', color: VOXEL_PALETTE.GOLD },
    body: { type: 'gold_armor', details: '황금색(#FFD700) 테두리 화려한 갑옷, 붉은 망토', color: VOXEL_PALETTE.GOLD },
    weapon: { type: 'halberd', details: '의장용 도끼/창(화려함)' },
    accessories: [{ type: 'cape', color: VOXEL_PALETTE.LACQUER_RED }],
    forcedColors: { primary: VOXEL_PALETTE.GOLD },
    description: '[황실] 황실 수호 최정예'
  },
  
  // [1121] 참마도수 - 대검
  1121: { id: 1121, name: '참마도수', nameEn: 'Zhanmadao Slayer', category: 'infantry',
    head: { type: 'soldier_helm', details: '철모' },
    body: { type: 'leather', details: '가벼운 갑옷', color: VOXEL_PALETTE.LEATHER_DARK },
    weapon: { type: 'zhanmadao', length: 150, details: '참마도(유닛 키만큼 거대한 양손검)' },
    description: '[대검] 말을 베는 거대한 검'
  },
  
  // [1122] 진주룡대 - 기동
  1122: { id: 1122, name: '진주룡대', nameEn: 'Pearl Dragon Unit', category: 'infantry',
    head: { type: 'dragon_helm', details: '용 문양 투구', color: VOXEL_PALETTE.IRON_BASE },
    body: { type: 'lamellar', details: '용 문양 가벼운 갑옷', color: VOXEL_PALETTE.IRON_BASE },
    weapon: { type: 'spear', details: '창' },
    offHand: { type: 'quiver', details: '활 복합 무장' },
    description: '[기동] 날렵한 투구'
  },
  
  // [1123] 황룡대 - 돌격
  1123: { id: 1123, name: '황룡대', nameEn: 'Golden Dragon Unit', category: 'infantry',
    head: { type: 'dragon_helm', details: '황금 용 투구', color: VOXEL_PALETTE.GOLD },
    body: { type: 'gold_armor', details: '황색 용 문양 흉갑, 어깨 넓은 실루엣', color: VOXEL_PALETTE.GOLD },
    weapon: { type: 'axe', details: '대형 도끼/철퇴' },
    forcedColors: { primary: VOXEL_PALETTE.GOLD },
    description: '[돌격] 황색 용 문양'
  },
  
  // [1124] 흑산적 - 도적
  1124: { id: 1124, name: '흑산적', nameEn: 'Black Mountain Bandit', category: 'infantry',
    head: { type: 'bandana', details: '검은색 복면', color: VOXEL_PALETTE.LACQUER_BLACK },
    body: { type: 'leather', details: '검은색 옷, 털가죽 장식', color: VOXEL_PALETTE.LACQUER_BLACK },
    weapon: { type: 'axe', details: '마구잡이 무장(도끼 등)' },
    forcedColors: { primary: VOXEL_PALETTE.LACQUER_BLACK },
    description: '[도적] 검은 옷, 복면'
  },
  
  // [1125] 묵협 - 묵가
  1125: { id: 1125, name: '묵협', nameEn: 'Mohist Warrior', category: 'infantry',
    head: { type: 'straw_hat', details: '삿갓' },
    body: { type: 'robe', details: '검소한 검은색(#2F2F2F) 옷, 등 뒤 공구/짐', color: '#2F2F2F' },
    weapon: { type: 'dao', details: '평범한 철검' },
    accessories: [{ type: 'pouch', position: '등' }],
    description: '[묵가] 검소한 검은 옷'
  },
  
  // [1126] 유협 - 협객
  1126: { id: 1126, name: '유협', nameEn: 'Wandering Knight', category: 'infantry',
    head: { type: 'base_head', details: '긴 머리끈', color: VOXEL_PALETTE.HAIR_BLACK },
    body: { type: 'robe', details: '화려한 사복', color: VOXEL_PALETTE.CLOTH_BLUE },
    weapon: { type: 'dao', details: '장식이 있는 검' },
    accessories: [{ type: 'pouch', position: '허리' }],
    description: '[협객] 술병을 허리에 참'
  },
  
  // [1127] 촉한무위군 - 수호
  1127: { id: 1127, name: '촉한무위군', nameEn: 'Shu Han Guard', category: 'infantry',
    head: { type: 'soldier_helm', details: '촉나라 투구' },
    body: { type: 'lamellar', details: '녹색/황색 배색 갑옷', color: VOXEL_PALETTE.CLOTH_GREEN },
    weapon: { type: 'spear', details: '창' },
    offHand: { type: 'hex_shield', details: '촉 문양 대형 방패' },
    forcedColors: { primary: VOXEL_PALETTE.CLOTH_GREEN, secondary: VOXEL_PALETTE.CLOTH_YELLOW },
    description: '[수호] 촉나라 특유 녹색/황색'
  },
  
  // [1128] 자객 - 암살
  1128: { id: 1128, name: '자객', nameEn: 'Assassin', category: 'infantry',
    head: { type: 'bandana', details: '얼굴 복면', color: VOXEL_PALETTE.LACQUER_BLACK },
    body: { type: 'leather', details: '전신 검은색 타이즈 형태', color: VOXEL_PALETTE.LACQUER_BLACK },
    weapon: { type: 'dual_swords', details: '쌍단검/비수' },
    forcedColors: { primary: VOXEL_PALETTE.LACQUER_BLACK },
    description: '[암살] 전신 검은색, 복면'
  },

  // ============================================
  // 2. 궁수/원거리 (Ranged): 1200 ~ 1215 (Voxels 사양서 기반)
  // ============================================
  
  // [1200] 단궁병 - 기본 궁병
  1200: { id: 1200, name: '단궁병', nameEn: 'Shortbowman', category: 'ranged',
    head: { type: 'messy_hair', details: '가벼운 복장' },
    body: { type: 'rag_poor', details: '간단한 옷', color: VOXEL_PALETTE.CLOTH_BROWN },
    weapon: { type: 'bow', details: '짧은 활(Short bow)' },
    offHand: { type: 'quiver', details: '엉덩이 화살통' },
    description: '[기본] 활이 작고 단순함'
  },
  
  // [1201] 장궁병 - 숙련 궁병
  1201: { id: 1201, name: '장궁병', nameEn: 'Longbowman', category: 'ranged',
    head: { type: 'soldier_helm', details: '윗옷 한쪽만 걸침(활쏘기 편하게)' },
    body: { type: 'leather', details: '가죽 갑옷', color: VOXEL_PALETTE.LEATHER_DARK },
    weapon: { type: 'composite_bow', length: 120, details: '각궁(Composite bow, 리커브 형태)' },
    offHand: { type: 'quiver', details: '등 화살통' },
    accessories: [{ type: 'thumb_ring', position: '오른손 엄지', color: VOXEL_PALETTE.BRONZE }],
    description: '[숙련] 깍지(엄지 반지) 표현'
  },
  
  // [1202] 노병 - 기계식 쇠뇌
  1202: { id: 1202, name: '노병', nameEn: 'Crossbowman', category: 'ranged',
    head: { type: 'wubian', details: '무변 모자' },
    body: { type: 'liang_dang', details: '양당개 + 가죽 토시', color: VOXEL_PALETTE.LACQUER_RED },
    weapon: { type: 'crossbow', length: 90, details: '쇠뇌(Crossbow), 앉아 쏴 자세' },
    offHand: { type: 'quiver', details: '네모난 화살통' },
    description: '[기계] 한눈 감고 조준'
  },
  
  // [1203] 연노병 - 연사 쇠뇌
  1203: { id: 1203, name: '연노병', nameEn: 'Repeating Crossbowman', category: 'ranged',
    head: { type: 'soldier_helm', details: '경장 철모' },
    body: { type: 'leather', details: '경장 흉갑', color: VOXEL_PALETTE.LEATHER_DARK },
    weapon: { type: 'repeater_crossbow', details: '제갈노(네모난 탄창 박스 필수)' },
    offHand: { type: 'quiver', details: '추가 탄창' },
    description: '[연사] 쇠뇌 위 네모난 탄창'
  },
  
  // [1204] 강노병 - 중장 쇠뇌
  1204: { id: 1204, name: '강노병', nameEn: 'Heavy Crossbowman', category: 'ranged',
    head: { type: 'heavy_helm', details: '중장 투구' },
    body: { type: 'heavy_lamellar', details: '중갑 착용', color: VOXEL_PALETTE.IRON_BASE },
    weapon: { type: 'heavy_crossbow', details: '대형 쇠뇌(Arbalest급)' },
    offHand: { type: 'quiver', details: '볼트 화살통' },
    description: '[중장] 쇠뇌가 매우 크고 두꺼움'
  },
  
  // [1205] 흑룡대 - 전설적 궁병
  1205: { id: 1205, name: '흑룡대', nameEn: 'Black Dragon Archer', category: 'ranged',
    head: { type: 'dragon_helm', details: '흑색 갑옷, 활에 용 장식', color: VOXEL_PALETTE.LACQUER_BLACK },
    body: { type: 'elite_armor', details: '흑색 갑옷과 망토', color: VOXEL_PALETTE.LACQUER_BLACK },
    weapon: { type: 'composite_bow', details: '검은색 대형 활' },
    offHand: { type: 'quiver' },
    accessories: [{ type: 'cape', color: VOXEL_PALETTE.LACQUER_BLACK }],
    forcedColors: { primary: VOXEL_PALETTE.LACQUER_BLACK },
    description: '[전설] 눈이 빛나는 연출(선택)'
  },
  
  // [1206] 선등사 - 특수 공성 궁병
  1206: { id: 1206, name: '선등사', nameEn: 'Vanguard Crossbowman', category: 'ranged',
    head: { type: 'heavy_helm', details: '철제 투구' },
    body: { type: 'heavy_lamellar', details: '중장갑', color: VOXEL_PALETTE.IRON_BASE },
    weapon: { type: 'crossbow', details: '쇠뇌' },
    offHand: { type: 'pavise', details: '거대한 파비스 방패(등에 멤)' },
    accessories: [{ type: 'blood_stain' }, { type: 'arrow_stuck' }],
    description: '[특수] 등 뒤에 거대한 방패'
  },
  
  // [1207] 업군강노수 - 하북 정예
  1207: { id: 1207, name: '업군강노수', nameEn: 'Ye City Crossbowman', category: 'ranged',
    head: { type: 'gold_helm', details: '원소군 황금색 투구 장식', color: VOXEL_PALETTE.GOLD },
    body: { type: 'lamellar', details: '정예 갑옷' },
    weapon: { type: 'heavy_crossbow', details: '정교한 튼튼한 쇠뇌' },
    offHand: { type: 'quiver' },
    forcedColors: { secondary: VOXEL_PALETTE.GOLD },
    description: '[하북] 원소군 특유의 황금 장식'
  },
  
  // [1208] 투창병 - 투척
  1208: { id: 1208, name: '투창병', nameEn: 'Javelin Thrower', category: 'ranged',
    head: { type: 'soldier_helm', details: '철모' },
    body: { type: 'leather', details: '가죽 갑옷, 운동선수 체형', color: VOXEL_PALETTE.LEATHER_DARK },
    weapon: { type: 'javelin', details: '짧은 투창(Javelin)' },
    accessories: [{ type: 'quiver', position: '등', color: VOXEL_PALETTE.WOOD_OLD }],
    description: '[투척] 등 뒤에 창 3~4개 통'
  },
  
  // [1209] 도끼투척병 - 남만
  1209: { id: 1209, name: '도끼투척병', nameEn: 'Axe Thrower', category: 'ranged',
    head: { type: 'base_head', details: '상의 탈의, 문신', color: VOXEL_PALETTE.SKIN_DARK },
    body: { type: 'tribal', details: '남만 복장, 상의 탈의', color: VOXEL_PALETTE.SKIN_DARK },
    weapon: { type: 'throwing_axe', details: '투척용 손도끼' },
    accessories: [{ type: 'pouch', position: '허리' }],
    description: '[남만] 허리춤에 손도끼 여러 개'
  },
  
  // [1210] 투석병 - 원시
  1210: { id: 1210, name: '투석병', nameEn: 'Slinger', category: 'ranged',
    head: { type: 'base_head', details: '머리 노출' },
    body: { type: 'rag_poor', details: '매우 허름한 복장', color: VOXEL_PALETTE.CLOTH_BROWN },
    weapon: { type: 'sling', details: '투석구(Sling), 돌리기 위한 끈' },
    accessories: [{ type: 'pouch', position: '허리' }],
    effects: [{ type: 'sling_motion' }],
    description: '[원시] 손에 돌리기 위한 끈'
  },
  
  // [1211] 화염궁병 - 화공
  1211: { id: 1211, name: '화염궁병', nameEn: 'Fire Archer', category: 'ranged',
    head: { type: 'soldier_helm', details: '철모' },
    body: { type: 'leather', details: '가죽 갑옷' },
    weapon: { type: 'bow', details: '활' },
    offHand: { type: 'torch', details: '기름통 휴대' },
    effects: [{ type: 'flame' }],
    forcedColors: { primary: VOXEL_PALETTE.FLAME_RED },
    description: '[화공] 화살촉 붉은색/주황색(#FF4500)'
  },
  
  // [1212] 독침병 - 밀림
  1212: { id: 1212, name: '독침병', nameEn: 'Poison Dart Blower', category: 'ranged',
    head: { type: 'base_head', details: '풀/나뭇잎 위장복' },
    body: { type: 'tribal', details: '밀림 위장복', color: VOXEL_PALETTE.CLOTH_GREEN },
    weapon: { type: 'blowgun', length: 120, details: '대나무 취관(Blowgun), 입에 대나무 관' },
    accessories: [{ type: 'poison_jar' }, { type: 'camouflage' }],
    effects: [{ type: 'poison_drip' }],
    forcedColors: { primary: VOXEL_PALETTE.POISON_PURPLE },
    description: '[밀림] 풀이나 나뭇잎 위장'
  },
  
  // [1213] 기름단지병 - 특수
  1213: { id: 1213, name: '기름단지병', nameEn: 'Oil Jar Thrower', category: 'ranged',
    head: { type: 'soldier_helm', details: '철모' },
    body: { type: 'lamellar', details: '찰갑, 옷에 검은 얼룩(기름)' },
    weapon: { type: 'oil_jar', details: '둥근 항아리' },
    offHand: { type: 'torch', details: '다른 손에 횃불' },
    effects: [{ type: 'flame' }],
    description: '[특수] 손에 둥근 항아리'
  },
  
  // [1214] 저격수 - 은밀
  1214: { id: 1214, name: '저격수', nameEn: 'Sniper', category: 'ranged',
    head: { type: 'base_head', details: '얼굴 숨김' },
    body: { type: 'leather', details: '위장 망토(엎드린 자세)', color: VOXEL_PALETTE.CLOTH_GREEN },
    weapon: { type: 'sniper_bow', details: '매우 긴 활' },
    offHand: { type: 'quiver' },
    accessories: [{ type: 'camouflage' }],
    description: '[은밀] 엎드린 자세에 적합한 위장 망토'
  },
  
  // [1215] 원융노병 - 북방
  1215: { id: 1215, name: '원융노병', nameEn: 'Long Range Crossbowman', category: 'ranged',
    head: { type: 'fur_cap', details: '털가죽 모자' },
    body: { type: 'leather', details: '두꺼운 가죽 갑옷', color: VOXEL_PALETTE.LEATHER_DARK },
    weapon: { type: 'heavy_crossbow', details: '땅에 닿을 만큼 거대한 쇠뇌' },
    offHand: { type: 'quiver' },
    description: '[북방] 쇠뇌가 땅에 닿을 만큼 거대함'
  },

  // ============================================
  // 3. 기병 (Cavalry): 1300 ~ 1322 (Voxels 사양서 기반)
  // 말+기수 통합 복셀, 기수 다리 제거
  // ============================================
  
  // [1300] 경기병 - 속도
  1300: { id: 1300, name: '경기병', nameEn: 'Light Cavalry', category: 'cavalry',
    head: { type: 'base_head', details: '가벼운 옷' },
    body: { type: 'leather', details: '가벼운 가죽 조끼', color: VOXEL_PALETTE.LEATHER_DARK },
    weapon: { type: 'dao', details: '사브르(기병도)' },
    mount: { type: 'horse', details: '갈색 말, 갑옷 없음', color: VOXEL_PALETTE.WOOD_OLD },
    description: '[속도] 말 갑옷 없음, 기수도 가벼운 옷'
  },
  
  // [1301] 중기병 - 충격
  1301: { id: 1301, name: '중기병', nameEn: 'Heavy Cavalry', category: 'cavalry',
    head: { type: 'heavy_helm', details: '중장 투구' },
    body: { type: 'heavy_lamellar', details: '철갑', color: VOXEL_PALETTE.IRON_BASE },
    weapon: { type: 'lance', length: 300, details: '긴 창' },
    mount: { type: 'armored_horse', details: '검은 말, 가죽 마갑(가슴)', color: VOXEL_PALETTE.LACQUER_BLACK },
    description: '[충격] 말 앞부분에 가죽 갑옷'
  },
  
  // [1302] 창기병 - 돌격
  1302: { id: 1302, name: '창기병', nameEn: 'Lancer', category: 'cavalry',
    head: { type: 'soldier_helm', details: '철모' },
    body: { type: 'lamellar', details: '찰갑' },
    weapon: { type: 'lance', length: 350, details: '매우 긴 란스(350cm), 수평으로 들고 돌격' },
    mount: { type: 'horse', details: '군마' },
    description: '[돌격] 창이 매우 길어 앞으로 튀어나옴'
  },
  
  // [1303] 궁기병 - 유목
  1303: { id: 1303, name: '궁기병', nameEn: 'Horse Archer', category: 'cavalry',
    head: { type: 'fur_cap', details: '모피 모자' },
    body: { type: 'leather', details: '가죽 갑옷' },
    weapon: { type: 'composite_bow', details: '각궁' },
    offHand: { type: 'quiver', details: '안장 화살통' },
    mount: { type: 'horse', details: '날렵한 말' },
    description: '[유목] 파르티안 샷(몸을 돌려 쏘는 자세)'
  },
  
  // [1304] 호표기 - 조조 최정예
  1304: { id: 1304, name: '호표기', nameEn: 'Tiger Leopard Cavalry', category: 'cavalry',
    head: { type: 'tongxiukai', details: '검은 투구', color: VOXEL_PALETTE.LACQUER_BLACK },
    body: { type: 'heavy_black', details: '표범 무늬 텍스처 갑옷', color: VOXEL_PALETTE.LACQUER_BLACK },
    weapon: { type: 'lance', length: 300, details: '긴 창' },
    mount: { type: 'black_horse', details: '검은 명마, 표범 무늬 마갑', color: VOXEL_PALETTE.LACQUER_BLACK },
    accessories: [{ type: 'cape', color: VOXEL_PALETTE.LACQUER_RED }],
    forcedColors: { primary: VOXEL_PALETTE.LACQUER_BLACK, secondary: VOXEL_PALETTE.LACQUER_RED },
    description: '[조조] 투구와 말 안장에 표범 무늬, 붉은 망토'
  },
  
  // [1305] 서량철기 - 중장 카타프랙트
  1305: { id: 1305, name: '서량철기', nameEn: 'Iron Cavalry', category: 'cavalry',
    head: { type: 'heavy_helm', details: '서역식 뾰족 투구' },
    body: { type: 'cataphract', details: '전신 철갑(Lamellar)', color: VOXEL_PALETTE.IRON_BASE },
    weapon: { type: 'lance', length: 350, details: '무거운 란스' },
    mount: { type: 'full_barding', details: '철갑 말(Cataphract), 말 얼굴 금속 마스크', color: VOXEL_PALETTE.IRON_BASE },
    effects: [{ type: 'steam_breath' }],
    description: '[중장] 마갑이 말 전체를 덮음, 기수도 전신 철갑'
  },
  
  // [1306] 백마의종 - 공손찬
  1306: { id: 1306, name: '백마의종', nameEn: 'White Horse Fellow', category: 'cavalry',
    head: { type: 'base_head', details: '은색 갑옷, 흰 망토', color: VOXEL_PALETTE.WHITE },
    body: { type: 'lamellar', details: '은색 갑옷', color: VOXEL_PALETTE.WHITE },
    weapon: { type: 'composite_bow', length: 100, details: '활, 흰 깃털 화살' },
    offHand: { type: 'quiver', details: '안장 화살통' },
    mount: { type: 'white_horse', details: '순백 백마', color: VOXEL_PALETTE.WHITE },
    accessories: [{ type: 'cape', color: VOXEL_PALETTE.WHITE }],
    forcedColors: { primary: VOXEL_PALETTE.WHITE },
    description: '[공손찬] 기수와 말 모두 백색 테마'
  },
  
  // [1307] 비웅군 - 동탁
  1307: { id: 1307, name: '비웅군', nameEn: 'Flying Bear Army', category: 'cavalry',
    head: { type: 'boar_skin', details: '곰 가죽 투구, 덩치 큼' },
    body: { type: 'heavy_lamellar', details: '곰 가죽 두른 갑옷', color: VOXEL_PALETTE.LEATHER_DARK },
    weapon: { type: 'lance', details: '기병창' },
    mount: { type: 'black_horse', details: '거대 흑마, 무서운 마스크', color: VOXEL_PALETTE.LACQUER_BLACK },
    description: '[동탁] 곰 가죽을 두른 기수, 어둡고 피비린내 분위기'
  },
  
  // [1308] 흉노기병 - 오랑캐
  1308: { id: 1308, name: '흉노기병', nameEn: 'Xiongnu Cavalry', category: 'cavalry',
    head: { type: 'fur_cap', details: '털모자, 변발' },
    body: { type: 'leather', details: '모피 조끼' },
    weapon: { type: 'composite_bow', details: '각궁' },
    offHand: { type: 'quiver' },
    mount: { type: 'horse', details: '조랑말(다리가 짧음)' },
    description: '[오랑캐] 활 중심 무장, 야생 초원 느낌'
  },
  
  // [1309] 서북고원기병 - 강족
  1309: { id: 1309, name: '서북고원기병', nameEn: 'Qiang Cavalry', category: 'cavalry',
    head: { type: 'fur_cap', details: '양가죽 조끼' },
    body: { type: 'leather', details: '양털 조끼, 청록 보석 장식' },
    weapon: { type: 'spear', details: '투박한 창' },
    mount: { type: 'horse', details: '고원 말' },
    description: '[강족] 거친 고원 느낌'
  },
  
  // [1310] 낙타기병 - 사막
  1310: { id: 1310, name: '낙타기병', nameEn: 'Camel Cavalry', category: 'cavalry',
    head: { type: 'turban', details: '터번, 사막 로브', color: VOXEL_PALETTE.WHITE },
    body: { type: 'robe', details: '사막 로브', color: VOXEL_PALETTE.CLOTH_BROWN },
    weapon: { type: 'scimitar', details: '곡도' },
    mount: { type: 'camel', details: '쌍봉낙타, 기수가 혹 사이에 앉음', color: VOXEL_PALETTE.CLOTH_BROWN },
    effects: [{ type: 'dust' }],
    description: '[사막] 쌍봉낙타 모델링'
  },
  
  // [1311] 늑대기수 - 판타지/야만
  1311: { id: 1311, name: '늑대기수', nameEn: 'Wolf Rider', category: 'cavalry',
    head: { type: 'wolf_skin', details: '늑대 털모자, 뼈 장식' },
    body: { type: 'tribal', details: '모피 조끼, 뼈 목걸이', color: VOXEL_PALETTE.LEATHER_DARK },
    weapon: { type: 'scimitar', details: '곡도' },
    mount: { type: 'dire_wolf', details: '거대한 회색 늑대', color: VOXEL_PALETTE.IRON_BASE },
    description: '[판타지/야만] 말이 아닌 거대한 늑대'
  },
  
  // [1312] 맹수기수 - 남만
  1312: { id: 1312, name: '맹수기수', nameEn: 'Beast Rider', category: 'cavalry',
    head: { type: 'tiger_helm', details: '최소 옷, 문신' },
    body: { type: 'tribal', details: '남만 최소 복장', color: VOXEL_PALETTE.SKIN_DARK },
    weapon: { type: 'spear', details: '창' },
    mount: { type: 'tiger', details: '호랑이 또는 표범', color: VOXEL_PALETTE.FLAME_ORANGE },
    description: '[남만] 호랑이/표범 탑승, 맹렬한 밀림 분위기'
  },
  
  // [1313] 제국창기병 - 황실
  1313: { id: 1313, name: '제국창기병', nameEn: 'Imperial Lancer', category: 'cavalry',
    head: { type: 'gold_helm', details: '화려한 금장 투구' },
    body: { type: 'gold_armor', details: '화려한 금장 갑옷', color: VOXEL_PALETTE.GOLD },
    weapon: { type: 'lance', details: '의장용 깃발 달린 창' },
    mount: { type: 'armored_horse', details: '금장 마갑 백마', color: VOXEL_PALETTE.GOLD },
    accessories: [{ type: 'banner', position: '창' }],
    forcedColors: { primary: VOXEL_PALETTE.GOLD },
    description: '[황실] 화려한 금장 마갑, 의장용 깃발 달린 창'
  },
  
  // [1314] 옥룡대 - 전설
  1314: { id: 1314, name: '옥룡대', nameEn: 'Jade Dragon Cavalry', category: 'cavalry',
    head: { type: 'dragon_helm', details: '옥색 빛 투구', color: '#40E0D0' },
    body: { type: 'elite_armor', details: '옥색(#40E0D0) 빛 갑옷, 용 문양', color: '#40E0D0' },
    weapon: { type: 'halberd', details: '극' },
    mount: { type: 'armored_horse', details: '옥색 장식 말', color: '#40E0D0' },
    forcedColors: { primary: '#40E0D0' },
    description: '[전설] 옥색(#40E0D0) 빛이 감도는 갑옷과 마갑'
  },
  
  // [1315] 오환돌기 - 돌격
  1315: { id: 1315, name: '오환돌기', nameEn: 'Wuhuan Cavalry', category: 'cavalry',
    head: { type: 'base_head', details: '삭발 또는 독특한 헤어' },
    body: { type: 'leather', details: '가죽 갑옷' },
    weapon: { type: 'dual_swords', details: '쌍검이나 도끼' },
    mount: { type: 'black_horse', details: '흑마' },
    description: '[돌격] 머리를 삭발하거나 독특한 헤어'
  },
  
  // [1316] 선비궁기병 - 북방
  1316: { id: 1316, name: '선비궁기병', nameEn: 'Xianbei Archer', category: 'cavalry',
    head: { type: 'fur_cap', details: '두꺼운 털옷' },
    body: { type: 'leather', details: '두꺼운 털옷' },
    weapon: { type: 'composite_bow', details: '강력한 각궁(장력 강해 보임)' },
    offHand: { type: 'quiver' },
    mount: { type: 'horse', details: '북방 말' },
    description: '[북방] 두꺼운 털옷, 강력한 활'
  },
  
  // [1317] 쌍검기병 - 근접
  1317: { id: 1317, name: '쌍검기병', nameEn: 'Dual Blade Cavalry', category: 'cavalry',
    head: { type: 'soldier_helm', details: '철모' },
    body: { type: 'lamellar', details: '찰갑' },
    weapon: { type: 'dual_swords', details: '양손에 검(고삐 놓고)' },
    mount: { type: 'horse', details: '군마' },
    description: '[근접] 고삐를 놓고 양손에 검을 든 자세'
  },
  
  // [1318] 전차병 - 고대 (다리 제거)
  1318: { id: 1318, name: '전차병', nameEn: 'Chariot', category: 'cavalry',
    head: { type: 'soldier_helm', details: '투구' },
    body: { type: 'lamellar', details: '찰갑' },
    weapon: { type: 'halberd', details: '극' },
    mount: { type: 'war_chariot', details: '2륜 전차(말 2필), 청동 장식' },
    description: '[고대] 말이 끄는 2륜 전차, 기수 1명 + 창병 1명 탑승'
  },
  
  // [1319] 정찰기병 - 시야
  1319: { id: 1319, name: '정찰기병', nameEn: 'Scout Cavalry', category: 'cavalry',
    head: { type: 'base_head', details: '무장 최소화' },
    body: { type: 'leather', details: '경장' },
    weapon: { type: 'dao', details: '환수도' },
    offHand: { type: 'flag', details: '횃불이나 깃발' },
    mount: { type: 'scout_horse', details: '빠른 말' },
    description: '[시야] 무장 최소화, 횃불이나 깃발'
  },
  
  // [1320] 양마기병 - 산악
  1320: { id: 1320, name: '양마기병', nameEn: 'Liangzhou Horse', category: 'cavalry',
    head: { type: 'soldier_helm', details: '서량 스타일' },
    body: { type: 'lamellar', details: '서역 스타일 갑옷' },
    weapon: { type: 'spear', details: '창' },
    mount: { type: 'horse', details: '서량마(다리가 굵고 튼튼함, 지구력)' },
    description: '[산악] 말의 다리가 굵고 튼튼함'
  },
  
  // [1321] 돌기병 - 자폭
  1321: { id: 1321, name: '돌기병', nameEn: 'Blind Charge Cavalry', category: 'cavalry',
    head: { type: 'soldier_helm', details: '중장 투구' },
    body: { type: 'heavy_lamellar', details: '중장갑' },
    weapon: { type: 'bamboo_spear', details: '죽창/폭탄' },
    mount: { type: 'horse', details: '눈 가린 말(공포 제거)' },
    description: '[자폭] 말의 눈을 가림, 기수는 죽창/폭탄'
  },
  
  // [1322] 상병 - 남만 코끼리
  1322: { id: 1322, name: '상병', nameEn: 'Elephant Rider', category: 'cavalry',
    head: { type: 'rattan_hat', details: '남만 투구' },
    body: { type: 'tribal', details: '남만 복장', color: VOXEL_PALETTE.SKIN_DARK },
    weapon: { type: 'spear', details: '창, 코끼리 몰이 막대' },
    mount: { type: 'elephant', details: '소형 코끼리, 상아에 철 장식', color: VOXEL_PALETTE.IRON_BASE },
    description: '[남만] 코끼리, 상아에 철 장식, 기수는 목 위에 탑승'
  },

  // ============================================
  // 4. 귀병/책사 (Wizard/Strategist): 1400 ~ 1424 (Voxels 사양서 기반)
  // 무기보다는 부채, 지팡이, 책, 붓 등. 의복(Robes) 위주.
  // ============================================
  
  // [1400] 귀병 - 학자
  1400: { id: 1400, name: '귀병', nameEn: 'Strategist', category: 'wizard',
    head: { type: 'base_head', details: '평범한 관복' },
    body: { type: 'robe', details: '회색 한복 도포', color: VOXEL_PALETTE.IRON_BASE },
    weapon: { type: 'staff', details: '부채' },
    description: '[학자] 평범한 관복, 부채'
  },
  
  // [1401] 신귀병 - 은밀
  1401: { id: 1401, name: '신귀병', nameEn: 'Shadow Strategist', category: 'wizard',
    head: { type: 'bandana', details: '얼굴 가림', color: VOXEL_PALETTE.CLOTH_BLUE },
    body: { type: 'robe', details: '검은색/남색 도포', color: VOXEL_PALETTE.CLOTH_BLUE },
    weapon: { type: 'dual_swords', details: '부적, 비수' },
    accessories: [{ type: 'talisman' }],
    description: '[은밀] 검은색/남색 도포, 얼굴 가림'
  },
  
  // [1402] 백귀병 - 순수
  1402: { id: 1402, name: '백귀병', nameEn: 'White Robe Strategist', category: 'wizard',
    head: { type: 'base_head', details: '긴 수염', color: VOXEL_PALETTE.WHITE },
    body: { type: 'robe', details: '전신 백색 도포', color: VOXEL_PALETTE.WHITE },
    weapon: { type: 'staff', details: '백색 부채' },
    forcedColors: { primary: VOXEL_PALETTE.WHITE },
    description: '[순수] 전신 백색 도포, 긴 수염'
  },
  
  // [1403] 흑귀병 - 저주
  1403: { id: 1403, name: '흑귀병', nameEn: 'Dark Strategist', category: 'wizard',
    head: { type: 'base_head', details: '검은 두건' },
    body: { type: 'robe', details: '전신 흑색 도포', color: VOXEL_PALETTE.LACQUER_BLACK },
    weapon: { type: 'staff', details: '해골 장식 지팡이' },
    forcedColors: { primary: VOXEL_PALETTE.LACQUER_BLACK },
    description: '[저주] 전신 흑색 도포, 해골 장식 지팡이'
  },
  
  // [1404] 악귀병 - 전투
  1404: { id: 1404, name: '악귀병', nameEn: 'Battle Mage', category: 'wizard',
    head: { type: 'soldier_helm', details: '투구' },
    body: { type: 'lamellar', details: '도포 위에 갑옷', color: VOXEL_PALETTE.LACQUER_RED },
    weapon: { type: 'dao', details: '검 + 부적' },
    accessories: [{ type: 'talisman' }],
    description: '[전투] 도포 위에 갑옷을 걸침'
  },
  
  // [1405] 남귀병 - 이민족
  1405: { id: 1405, name: '남귀병', nameEn: 'Southern Shaman', category: 'wizard',
    head: { type: 'shaman_mask', details: '화려한 깃털 장식, 가면' },
    body: { type: 'tribal', details: '남만 복장', color: VOXEL_PALETTE.FLAME_ORANGE },
    weapon: { type: 'staff', details: '지팡이 + 방울' },
    accessories: [{ type: 'feather', color: VOXEL_PALETTE.FLAME_ORANGE }],
    description: '[이민족] 화려한 깃털 장식, 가면'
  },
  
  // [1406] 황귀병 - 고위
  1406: { id: 1406, name: '황귀병', nameEn: 'Imperial Strategist', category: 'wizard',
    head: { type: 'noble_crown', details: '화려한 관(Headgear)', color: VOXEL_PALETTE.GOLD },
    body: { type: 'robe', details: '황금색 관복', color: VOXEL_PALETTE.GOLD },
    weapon: { type: 'scripture', details: '옥새, 두루마리' },
    forcedColors: { primary: VOXEL_PALETTE.GOLD },
    description: '[고위] 황금색 관복, 화려한 관'
  },
  
  // [1407] 천귀병 - 성직
  1407: { id: 1407, name: '천귀병', nameEn: 'Heavenly Strategist', category: 'wizard',
    head: { type: 'base_head', details: '하늘 상징' },
    body: { type: 'robe', details: '푸른색/구름 무늬 도포', color: VOXEL_PALETTE.CLOTH_BLUE },
    weapon: { type: 'staff', details: '별자리 판' },
    forcedColors: { primary: VOXEL_PALETTE.CLOTH_BLUE },
    description: '[성직] 하늘을 상징하는 푸른색/구름 무늬 도포'
  },
  
  // [1408] 마귀병 - 강령
  1408: { id: 1408, name: '마귀병', nameEn: 'Sorcerer', category: 'wizard',
    head: { type: 'base_head', details: '찢어진 도포' },
    body: { type: 'robe', details: '찢어진 도포', color: VOXEL_PALETTE.POISON_PURPLE },
    weapon: { type: 'staff', details: '뼈 지팡이' },
    effects: [{ type: 'curse_aura' }],
    forcedColors: { primary: VOXEL_PALETTE.POISON_PURPLE },
    description: '[강령] 찢어진 도포, 보라색 오라'
  },
  
  // [1409] 음귀병 - 현혹
  1409: { id: 1409, name: '음귀병', nameEn: 'Sound Strategist', category: 'wizard',
    head: { type: 'base_head', details: '악기 연주자' },
    body: { type: 'robe', details: '우아한 도포', color: VOXEL_PALETTE.CLOTH_GREEN },
    weapon: { type: 'staff', details: '악기(비파, 피리)' },
    description: '[현혹] 악기(비파, 피리)를 들고 있음'
  },
  
  // [1410] 향귀병 - 향
  1410: { id: 1410, name: '향귀병', nameEn: 'Incense Strategist', category: 'wizard',
    head: { type: 'base_head', details: '향로 연기' },
    body: { type: 'robe', details: '도포', color: VOXEL_PALETTE.POISON_PURPLE },
    weapon: { type: 'oil_jar', details: '향로' },
    effects: [{ type: 'smoke' }],
    description: '[향] 손에 향로를 들고 연기가 나는 연출'
  },
  
  // [1411] 무희 - 춤
  1411: { id: 1411, name: '무희', nameEn: 'Dancer', category: 'wizard',
    head: { type: 'base_head', details: '여성형' },
    body: { type: 'robe', details: '긴 소매(Water sleeves) 휘날림', color: VOXEL_PALETTE.LACQUER_RED },
    weapon: { type: 'staff', details: '긴 소매, 부채' },
    description: '[춤] 긴 소매가 휘날리는 형태, 여성형'
  },
  
  // [1412] 독전주술사 - 주술
  1412: { id: 1412, name: '독전주술사', nameEn: 'War Drummer', category: 'wizard',
    head: { type: 'shaman_mask', details: '주술사 가면' },
    body: { type: 'tribal', details: '동물 가죽', color: VOXEL_PALETTE.LEATHER_DARK },
    weapon: { type: 'staff', details: '북, 채' },
    accessories: [{ type: 'drum' }],
    effects: [{ type: 'curse_aura' }, { type: 'poison_drip' }],
    description: '[주술] 북(Drum)을 메고 있거나 두드림'
  },
  
  // [1413] 태평도사 - 장각
  1413: { id: 1413, name: '태평도사', nameEn: 'Taiping Taoist', category: 'wizard',
    head: { type: 'yellow_turban', details: '노란 두건, 긴 수염', color: VOXEL_PALETTE.CLOTH_YELLOW },
    body: { type: 'robe', details: '노란 도포', color: VOXEL_PALETTE.CLOTH_YELLOW },
    weapon: { type: 'staff', details: '지팡이, 경전' },
    forcedColors: { primary: VOXEL_PALETTE.CLOTH_YELLOW },
    description: '[장각] 노란 두건, 지팡이, 긴 수염'
  },
  
  // [1414] 오두미도사 - 장로
  1414: { id: 1414, name: '오두미도사', nameEn: 'Five Pecks Taoist', category: 'wizard',
    head: { type: 'straw_hat', details: '도교 복장' },
    body: { type: 'robe', details: '도교 복장', color: VOXEL_PALETTE.CLOTH_BLUE },
    weapon: { type: 'dao', details: '칠성검' },
    accessories: [{ type: 'pouch', position: '쌀자루' }],
    description: '[장로] 도교 복장, 쌀자루(오두미) 형상화'
  },
  
  // [1415] 방사 - 신선
  1415: { id: 1415, name: '방사', nameEn: 'Alchemist', category: 'wizard',
    head: { type: 'base_head', details: '등 뒤에 호리병' },
    body: { type: 'robe', details: '구름 무늬 옷', color: VOXEL_PALETTE.WHITE },
    weapon: { type: 'oil_jar', details: '호리병' },
    description: '[신선] 등 뒤에 호리병, 구름 무늬 옷'
  },
  
  // [1416] 암송대 - 경전
  1416: { id: 1416, name: '암송대', nameEn: 'Chanter', category: 'wizard',
    head: { type: 'base_head', details: '책을 펼쳐 들고 읽는 자세' },
    body: { type: 'robe', details: '도포', color: VOXEL_PALETTE.CLOTH_BROWN },
    weapon: { type: 'scripture', details: '책(죽간)' },
    description: '[경전] 책을 펼쳐 들고 읽는 자세'
  },
  
  // [1417] 유세객 - 외교
  1417: { id: 1417, name: '유세객', nameEn: 'Diplomat', category: 'wizard',
    head: { type: 'noble_crown', details: '화려한 양반 복장' },
    body: { type: 'robe', details: '화려한 양반 복장', color: VOXEL_PALETTE.CLOTH_BLUE },
    weapon: { type: 'scripture', details: '두루마리' },
    description: '[외교] 화려한 양반 복장, 손짓 제스처'
  },
  
  // [1418] 세작 - 첩자
  1418: { id: 1418, name: '세작', nameEn: 'Spy', category: 'wizard',
    head: { type: 'straw_hat', details: '평범한 농민/상인 복장' },
    body: { type: 'rag_poor', details: '평범한 농민/상인 복장', color: VOXEL_PALETTE.CLOTH_BROWN },
    weapon: { type: 'dual_swords', details: '품에 단검' },
    description: '[첩자] 평범한 농민/상인 복장이지만 품에 단검'
  },
  
  // [1419] 군사참모 - 지휘
  1419: { id: 1419, name: '군사참모', nameEn: 'Military Advisor', category: 'wizard',
    head: { type: 'soldier_helm', details: '깃발을 등 뒤에 꽂음' },
    body: { type: 'lamellar', details: '갑옷 위에 도포', color: VOXEL_PALETTE.LACQUER_RED },
    weapon: { type: 'staff', details: '지휘봉' },
    accessories: [{ type: 'banner', position: '등' }],
    description: '[지휘] 깃발을 등 뒤에 꽂고 지휘봉을 듬'
  },
  
  // [1420] 화공대 - 화염
  1420: { id: 1420, name: '화공대', nameEn: 'Fire Strategist', category: 'wizard',
    head: { type: 'soldier_helm', details: '철모' },
    body: { type: 'leather', details: '등에 기름통', color: VOXEL_PALETTE.LEATHER_DARK },
    weapon: { type: 'staff', details: '횃불' },
    offHand: { type: 'torch' },
    effects: [{ type: 'flame' }],
    description: '[화염] 등에 기름통, 손에 횃불'
  },
  
  // [1421] 수공대 - 수리
  1421: { id: 1421, name: '수공대', nameEn: 'Water Strategist', category: 'wizard',
    head: { type: 'straw_hat', details: '삿갓' },
    body: { type: 'rag_poor', details: '작업복', color: VOXEL_PALETTE.CLOTH_BROWN },
    weapon: { type: 'staff', details: '삽, 곡괭이' },
    effects: [{ type: 'splash' }],
    description: '[수리] 삽이나 곡괭이, 둑을 무너뜨리는 도구'
  },
  
  // [1422] 기문둔갑사 - 진법
  1422: { id: 1422, name: '기문둔갑사', nameEn: 'Formation Master', category: 'wizard',
    head: { type: 'base_head', details: '바닥에 팔괘 이펙트' },
    body: { type: 'robe', details: '도교 도포', color: VOXEL_PALETTE.CLOTH_BLUE },
    weapon: { type: 'scripture', details: '나침반(패철)' },
    description: '[진법] 바닥에 팔괘(8각형) 이펙트나 장식'
  },
  
  // [1423] 태일도사 - 제사
  1423: { id: 1423, name: '태일도사', nameEn: 'Grand Ritualist', category: 'wizard',
    head: { type: 'noble_crown', details: '제단 의식용 복장' },
    body: { type: 'robe', details: '제단 의식용 복장, 엄숙함', color: VOXEL_PALETTE.WHITE },
    weapon: { type: 'oil_jar', details: '제기(그릇)' },
    description: '[제사] 제단 의식용 복장, 엄숙함'
  },
  
  // [1424] 묵자 - 기술
  1424: { id: 1424, name: '묵자', nameEn: 'Mohist Engineer', category: 'wizard',
    head: { type: 'base_head', details: '공구 벨트' },
    body: { type: 'leather', details: '실용적인 짧은 옷', color: VOXEL_PALETTE.LEATHER_DARK },
    weapon: { type: 'staff', details: '목공 도구' },
    accessories: [{ type: 'pouch', position: '공구 벨트' }],
    description: '[기술] 공구 벨트, 실용적인 짧은 옷'
  },

  // ============================================
  // 5. 이민족 & 지역병 (Regional): 1450 ~ 1472 (Voxels 사양서 기반)
  // 한나라 정규군과 확연히 다른 실루엣(털가죽, 판갑, 문신 등)
  // ============================================
  
  // [1450] 남만전사 - 야만
  1450: { id: 1450, name: '남만전사', nameEn: 'Nanman Warrior', category: 'regional',
    head: { type: 'rattan_hat', details: '상의 탈의' },
    body: { type: 'tribal', details: '상의 탈의, 호피 무늬 하의, 뼈 장식', color: VOXEL_PALETTE.SKIN_DARK },
    weapon: { type: 'dao', details: '밀림 마체테' },
    description: '[야만] 상의 탈의, 호피 무늬 하의, 뼈 장식'
  },
  
  // [1451] 등갑병 - 특수
  1451: { id: 1451, name: '등갑병', nameEn: 'Rattan Armor Soldier', category: 'regional',
    head: { type: 'rattan_hat', details: '등나무 투구', color: VOXEL_PALETTE.RATTAN },
    body: { type: 'rattan', details: '등나무 갑옷(노란색/갈색, 엮은 모양)', color: VOXEL_PALETTE.RATTAN },
    weapon: { type: 'dao', details: '만도' },
    offHand: { type: 'round_shield', details: '등나무 방패' },
    forcedColors: { primary: VOXEL_PALETTE.RATTAN },
    description: '[특수] 노란색/갈색 등나무 갑옷(비늘 아님, 엮은 모양)'
  },
  
  // [1452] 코끼리병 - 기병
  1452: { id: 1452, name: '코끼리병', nameEn: 'Elephant Cavalry', category: 'regional',
    head: { type: 'rattan_hat', details: '남방식 투구' },
    body: { type: 'tribal', details: '남만 복장, 기수 목에 앉음', color: VOXEL_PALETTE.SKIN_DARK },
    weapon: { type: 'spear', details: '창' },
    mount: { type: 'elephant', details: '중형 코끼리, 간단한 하네스', color: VOXEL_PALETTE.IRON_BASE },
    description: '[기병] 1322보다 더 무장된 코끼리, 기수 2명 탑승'
  },
  
  // [1453] 전쟁코끼리 - 요새
  1453: { id: 1453, name: '전쟁코끼리', nameEn: 'War Elephant', category: 'regional',
    head: { type: 'rattan_hat', details: '남방식 투구' },
    body: { type: 'tribal', details: '남만 복장', color: VOXEL_PALETTE.SKIN_DARK },
    weapon: { type: 'spear', details: '긴 창' },
    mount: { type: 'tower_elephant', details: '코끼리 등 위에 망루(집), 3명 이상 탑승, 머리에 철갑', color: VOXEL_PALETTE.IRON_BASE },
    effects: [{ type: 'dust' }],
    description: '[요새] 코끼리 등 위에 망루(집)가 있음'
  },
  
  // [1454] 개마무사 - 고구려
  1454: { id: 1454, name: '개마무사', nameEn: 'Goguryeo Cataphract', category: 'regional',
    head: { type: 'goguryeo_helm', details: '종형 투구 + 절풍(깃털)' },
    body: { type: 'scale', details: '비늘 갑옷(찰갑), 빈틈없이 덮임', color: VOXEL_PALETTE.IRON_BASE },
    weapon: { type: 'pike', length: 400, details: '매우 긴 창' },
    mount: { type: 'full_barding', details: '개마(말과 기수 동일 비늘 갑옷)', color: VOXEL_PALETTE.IRON_BASE },
    accessories: [{ type: 'feather', position: '투구 양옆' }],
    description: '[고구려] 말과 기수 모두 비늘 갑옷(찰갑)으로 빈틈없이 덮임'
  },
  
  // [1455] 맥궁사 - 동예
  1455: { id: 1455, name: '맥궁사', nameEn: 'Maek Archer', category: 'regional',
    head: { type: 'fur_cap', details: '호랑이 가죽 모자' },
    body: { type: 'leather', details: '가죽 갑옷' },
    weapon: { type: 'composite_bow', details: '맥궁(유난히 큰 활)' },
    offHand: { type: 'quiver' },
    description: '[동예] 호랑이 가죽 모자, 활이 유난히 큼'
  },
  
  // [1456] 가야판갑병 - 가야
  1456: { id: 1456, name: '가야판갑병', nameEn: 'Gaya Plate Armor', category: 'regional',
    head: { type: 'plate_helm', details: '종형 투구, 소용돌이 문양' },
    body: { type: 'plate', details: '판갑(세로로 긴 철판 이어 붙임)', color: VOXEL_PALETTE.IRON_BASE },
    weapon: { type: 'dao', length: 100, details: '환두대도' },
    offHand: { type: 'round_shield', details: '원형 방패' },
    description: '[가야] 세로로 긴 철판을 이어 붙인 판갑(일본 사무라이 원형)'
  },
  
  // [1457] 삼한장창병 - 삼한
  1457: { id: 1457, name: '삼한장창병', nameEn: 'Samhan Pikeman', category: 'regional',
    head: { type: 'soldier_helm', details: '투박한 투구' },
    body: { type: 'leather', details: '짚으로 엮은 갑옷/투박한 가죽' },
    weapon: { type: 'pike', details: '매우 긴 대나무 창' },
    description: '[삼한] 짚으로 엮은 갑옷이나 투박한 가죽'
  },
  
  // [1458] 마한전사 - 문신
  1458: { id: 1458, name: '마한전사', nameEn: 'Mahan Warrior', category: 'regional',
    head: { type: 'base_head', details: '얼굴에 문신, 상투' },
    body: { type: 'tribal', details: '문신, 상투', color: VOXEL_PALETTE.SKIN },
    weapon: { type: 'spear', details: '창' },
    offHand: { type: 'round_shield', details: '둥근 목방패' },
    description: '[문신] 얼굴에 문신, 머리를 상투 틂'
  },
  
  // [1459] 읍루독궁병 - 독
  1459: { id: 1459, name: '읍루독궁병', nameEn: 'Yilou Poison Archer', category: 'regional',
    head: { type: 'boar_skin', details: '멧돼지 가죽 투구' },
    body: { type: 'tribal', details: '털옷', color: VOXEL_PALETTE.LEATHER_DARK },
    weapon: { type: 'bow', details: '단궁, 독화살' },
    offHand: { type: 'quiver', details: '가죽 화살통' },
    effects: [{ type: 'poison_drip' }],
    forcedColors: { primary: VOXEL_PALETTE.POISON_PURPLE },
    description: '[독] 털옷, 화살촉에서 보라색 액체(독)가 떨어짐'
  },
  
  // [1460] 강족약탈자 - 유목
  1460: { id: 1460, name: '강족약탈자', nameEn: 'Qiang Raider', category: 'regional',
    head: { type: 'fur_cap', details: '양가죽 옷' },
    body: { type: 'leather', details: '양가죽 옷, 약탈품 보따리', color: VOXEL_PALETTE.LEATHER_DARK },
    weapon: { type: 'scimitar', details: '곡도' },
    mount: { type: 'horse', details: '강족 말' },
    accessories: [{ type: 'pouch', position: '등' }],
    description: '[유목] 양가죽 옷, 약탈품 보따리를 메고 있음'
  },
  
  // [1461] 동예단궁병 - 산악
  1461: { id: 1461, name: '동예단궁병', nameEn: 'Dongye Archer', category: 'regional',
    head: { type: 'fur_cap', details: '표범 가죽 조끼' },
    body: { type: 'leather', details: '표범 가죽 조끼', color: VOXEL_PALETTE.LEATHER_DARK },
    weapon: { type: 'bow', details: '활이 짧음' },
    offHand: { type: 'quiver' },
    description: '[산악] 표범 가죽 조끼, 활이 짧음'
  },
  
  // [1462] 산월전사 - 게릴라
  1462: { id: 1462, name: '산월전사', nameEn: 'Shanyue Warrior', category: 'regional',
    head: { type: 'messy_hair', details: '머리가 산발' },
    body: { type: 'tribal', details: '나뭇잎 위장', color: VOXEL_PALETTE.CLOTH_GREEN },
    weapon: { type: 'spear', details: '창' },
    accessories: [{ type: 'camouflage' }],
    description: '[게릴라] 나뭇잎 위장, 머리가 산발'
  },
  
  // [1463] 파촉산악병 - 험지
  1463: { id: 1463, name: '파촉산악병', nameEn: 'Bashu Mountain Infantry', category: 'regional',
    head: { type: 'soldier_helm', details: '짚신' },
    body: { type: 'mountain_gear', details: '다리 근육 강조, 등짐', color: VOXEL_PALETTE.LEATHER_DARK },
    weapon: { type: 'spear', details: '창' },
    accessories: [{ type: 'pouch', position: '등짐' }],
    description: '[험지] 짚신, 다리 근육 강조, 등짐을 지고 있음'
  },
  
  // [1464] 강동수군 - 오 (배만 표시)
  1464: { id: 1464, name: '강동수군', nameEn: 'Jiangdong Marine', category: 'regional',
    head: { type: 'bandana', details: '붉은 머리띠', color: VOXEL_PALETTE.LACQUER_RED },
    body: { type: 'sailor', details: '가죽 조끼', color: VOXEL_PALETTE.LACQUER_RED },
    weapon: { type: 'dao', details: '환수도' },
    mount: { type: 'boat', details: '배' },
    forcedColors: { primary: VOXEL_PALETTE.LACQUER_RED },
    description: '[오] 1111번의 정예 버전, 붉은 머리띠, 가죽 조끼'
  },
  
  // [1465] 형주강궁병 - 수성
  1465: { id: 1465, name: '형주강궁병', nameEn: 'Jingzhou Archer', category: 'regional',
    head: { type: 'soldier_helm', details: '철모' },
    body: { type: 'leather', details: '물에 강한 가죽 옷', color: VOXEL_PALETTE.LEATHER_DARK },
    weapon: { type: 'heavy_crossbow', details: '강력한 쇠뇌' },
    offHand: { type: 'quiver' },
    effects: [{ type: 'wet_leather' }],
    description: '[수성] 1204번과 유사하나 물에 강한 가죽 옷'
  },
  
  // [1466] 여남황건 - 잔당
  1466: { id: 1466, name: '여남황건', nameEn: 'Runan Yellow Turbans', category: 'regional',
    head: { type: 'yellow_turban', details: '노란 두건, 더 낡고 지저분', color: VOXEL_PALETTE.CLOTH_YELLOW },
    body: { type: 'rag_poor', details: '농민복, 붕대 감음', color: VOXEL_PALETTE.CLOTH_BROWN },
    weapon: { type: 'axe', details: '도끼' },
    accessories: [{ type: 'blood_stain' }],
    forcedColors: { primary: VOXEL_PALETTE.CLOTH_YELLOW },
    description: '[잔당] 1113번보다 더 낡고 지저분함, 붕대 감음'
  },
  
  // [1467] 광전사 - 폭주
  1467: { id: 1467, name: '광전사', nameEn: 'Berserker', category: 'regional',
    head: { type: 'messy_hair', details: '눈이 붉음, 입에 거품(하얀 복셀)' },
    body: { type: 'muscle_exposed', details: '근육질 상체 노출', color: VOXEL_PALETTE.SKIN },
    weapon: { type: 'axe', details: '무기를 질질 끔' },
    effects: [{ type: 'curse_aura' }],
    description: '[폭주] 눈이 붉음, 입에 거품, 무기를 질질 끔'
  },
  
  // [1468] 계림전사 - 신라
  1468: { id: 1468, name: '계림전사', nameEn: 'Gyerim Warrior', category: 'regional',
    head: { type: 'feather_helm', details: '닭 깃털 장식 투구' },
    body: { type: 'lamellar', details: '찰갑' },
    weapon: { type: 'dao', details: '날렵한 철검' },
    description: '[신라] 닭 깃털 장식 투구, 날렵한 철검'
  },
  
  // [1469] 화시병 - 불
  1469: { id: 1469, name: '화시병', nameEn: 'Fire Arrow Soldier', category: 'regional',
    head: { type: 'soldier_helm', details: '철모' },
    body: { type: 'lamellar', details: '붉은 갑옷', color: VOXEL_PALETTE.LACQUER_RED },
    weapon: { type: 'bow', details: '활' },
    offHand: { type: 'quiver', details: '화살통 자체가 불타고 있음' },
    effects: [{ type: 'flame' }],
    forcedColors: { primary: VOXEL_PALETTE.FLAME_RED },
    description: '[불] 1211번의 정예 버전, 화살통 자체가 불타고 있음'
  },
  
  // [1470] 변군전사 - 변한
  1470: { id: 1470, name: '변군전사', nameEn: 'Byeonhan Warrior', category: 'regional',
    head: { type: 'plate_helm', details: '판갑 투구' },
    body: { type: 'plate', details: '철기 문명 강조', color: VOXEL_PALETTE.IRON_BASE },
    weapon: { type: 'zhanmadao', details: '유난히 크고 날카로운 무기' },
    description: '[변한] 철기 문명 강조, 무기가 유난히 크고 날카로움'
  },
  
  // [1471] 부여보병 - 북방
  1471: { id: 1471, name: '부여보병', nameEn: 'Buyeo Infantry', category: 'regional',
    head: { type: 'fur_cap', details: '두꺼운 모피 모자' },
    body: { type: 'leather', details: '두꺼운 백색/회색 털옷', color: VOXEL_PALETTE.WHITE },
    weapon: { type: 'spear', details: '창' },
    offHand: { type: 'round_shield', details: '둥근 방패' },
    forcedColors: { primary: VOXEL_PALETTE.WHITE },
    description: '[북방] 두꺼운 백색/회색 털옷, 둥근 방패'
  },
  
  // [1472] 부여기병 - 북방
  1472: { id: 1472, name: '부여기병', nameEn: 'Buyeo Cavalry', category: 'regional',
    head: { type: 'fur_cap', details: '두꺼운 모피 모자' },
    body: { type: 'leather', details: '두꺼운 털옷', color: VOXEL_PALETTE.WHITE },
    weapon: { type: 'axe', details: '창 대신 도끼나 철퇴' },
    mount: { type: 'horse', details: '말에도 털가죽을 씌움' },
    forcedColors: { primary: VOXEL_PALETTE.WHITE },
    description: '[북방] 말에도 털가죽을 씌움, 창 대신 도끼나 철퇴'
  },

  // ============================================
  // 6. 공성병기 (Siege): 1500 ~ 1511 (Voxels 사양서 기반)
  // ============================================
  
  // [1500] 충차 - 성문 파괴
  1500: { id: 1500, name: '충차', nameEn: 'Battering Ram', category: 'siege',
    head: { type: 'soldier_helm' }, body: { type: 'lamellar' }, weapon: { type: 'none' },
    mount: { type: 'siege_ram', details: '지붕 있는 수레, 앞부분 철제 양 머리 장식, 거대한 통나무', color: VOXEL_PALETTE.WOOD_OLD },
    effects: [{ type: 'dust' }],
    description: '거대한 통나무가 달린 지붕 있는 수레, 철제 양 머리 장식'
  },
  
  // [1501] 벽력거 - 투석기
  1501: { id: 1501, name: '벽력거', nameEn: 'Catapult', category: 'siege',
    head: { type: 'soldier_helm' }, body: { type: 'lamellar' }, weapon: { type: 'none' },
    mount: { type: 'trebuchet', details: '지렛대 원리 투석기(인력 당김식), 돌덩이 장전', color: VOXEL_PALETTE.WOOD_OLD },
    description: '지렛대 원리의 투석기(Trebuchet 아님, 인력 당김식)'
  },
  
  // [1502] 정란 - 이동식 망루
  1502: { id: 1502, name: '정란', nameEn: 'Siege Platform', category: 'siege',
    head: { type: 'soldier_helm' }, body: { type: 'lamellar' }, weapon: { type: 'none' },
    mount: { type: 'siege_tower', details: '바퀴 달린 높은 망루, 꼭대기에 궁수 배치 공간' },
    description: '바퀴 달린 높은 망루, 꼭대기에 궁수 배치'
  },
  
  // [1503] 연노거 - 수레 위 거대 쇠뇌
  1503: { id: 1503, name: '연노거', nameEn: 'Ballista Cart', category: 'siege',
    head: { type: 'soldier_helm' }, body: { type: 'lamellar' }, weapon: { type: 'none' },
    mount: { type: 'ballista', details: '수레 위에 거대한 쇠뇌 설치', color: VOXEL_PALETTE.WOOD_OLD },
    description: '수레 위에 거대한 쇠뇌 설치'
  },
  
  // [1504] 화수 - 불 뿜는 괴수
  1504: { id: 1504, name: '화수', nameEn: 'Fire Beast', category: 'siege',
    head: { type: 'soldier_helm' }, body: { type: 'lamellar' }, weapon: { type: 'none' },
    mount: { type: 'fire_beast', details: '불을 뿜는 짐승 머리 모양 장식 수레, 가시 바퀴', color: VOXEL_PALETTE.BRONZE },
    effects: [{ type: 'flame' }],
    description: '불을 뿜는 짐승 머리 모양 장식이 달린 수레'
  },
  
  // [1505] 다연장노포 - 부채꼴 발사
  1505: { id: 1505, name: '다연장노포', nameEn: 'Multi-Bolt Crossbow', category: 'siege',
    head: { type: 'soldier_helm' }, body: { type: 'lamellar' }, weapon: { type: 'none' },
    mount: { type: 'ballista', details: '쇠뇌 하나에 화살 여러 개(부채꼴)' },
    description: '쇠뇌 하나에 화살이 여러 개(부채꼴) 걸려 있음'
  },
  
  // [1506] 공성탑 - 대형 공성탑
  1506: { id: 1506, name: '공성탑', nameEn: 'Grand Siege Tower', category: 'siege',
    head: { type: 'soldier_helm' }, body: { type: 'lamellar' }, weapon: { type: 'none' },
    mount: { type: 'siege_tower', details: '정란보다 훨씬 크고 넓음, 성벽 붙는 다리, 젖은 가죽 외피', color: VOXEL_PALETTE.WOOD_OLD },
    effects: [{ type: 'wet_leather' }],
    description: '정란보다 훨씬 크고 넓음, 성벽에 붙는 다리가 있음'
  },
  
  // [1507] 화염투석기 - 불타는 투석
  1507: { id: 1507, name: '화염투석기', nameEn: 'Fire Catapult', category: 'siege',
    head: { type: 'soldier_helm' }, body: { type: 'lamellar' }, weapon: { type: 'none' },
    mount: { type: 'trebuchet', details: '벽력거 투석구에 불타는 공' },
    effects: [{ type: 'flame' }, { type: 'smoke' }],
    description: '벽력거 투석구에 불타는 공이 들어있음'
  },
  
  // [1508] 쇠뇌차 - 경량화 쇠뇌
  1508: { id: 1508, name: '쇠뇌차', nameEn: 'Light Ballista', category: 'siege',
    head: { type: 'soldier_helm' }, body: { type: 'lamellar' }, weapon: { type: 'none' },
    mount: { type: 'ballista', details: '연노거의 경량화 버전, 앞에 방패판' },
    description: '연노거의 경량화 버전, 방패판이 앞에 있음'
  },
  
  // [1509] 화공차 - 자폭 수레
  1509: { id: 1509, name: '화공차', nameEn: 'Fire Cart', category: 'siege',
    head: { type: 'soldier_helm' }, body: { type: 'lamellar' }, weapon: { type: 'none' },
    mount: { type: 'fire_beast', details: '수레 가득 짚단과 기름통' },
    effects: [{ type: 'flame' }],
    description: '수레 가득 짚단과 기름통이 실려 있음'
  },
  
  // [1510] 목우유마 - 기계
  1510: { id: 1510, name: '목우유마', nameEn: 'Wooden Ox', category: 'siege',
    head: { type: 'soldier_helm' }, body: { type: 'lamellar' }, weapon: { type: 'none' },
    mount: { type: 'siege_ram', details: '나무로 만든 소/말 모양 기계 장치, 톱니바퀴 노출', color: VOXEL_PALETTE.WOOD_OLD },
    description: '[기계] 나무로 만든 소/말 모양의 기계 장치, 톱니바퀴 노출'
  },
  
  // [1511] 화륜차 - 불타는 바퀴
  1511: { id: 1511, name: '화륜차', nameEn: 'Fire Wheel Cart', category: 'siege',
    head: { type: 'soldier_helm' }, body: { type: 'lamellar' }, weapon: { type: 'none' },
    mount: { type: 'fire_beast', details: '바퀴 자체가 불타는 거대한 가시 바퀴 2개' },
    effects: [{ type: 'flame' }],
    description: '바퀴 자체가 불타는 거대한 가시 바퀴 2개'
  },
};

// ===== 유틸리티 함수 =====
export function getVoxelUnit(id: number): VoxelUnitSpec | undefined {
  return VOXEL_UNIT_DATABASE[id];
}

export function getVoxelUnitsByCategory(category: VoxelUnitSpec['category']): VoxelUnitSpec[] {
  return Object.values(VOXEL_UNIT_DATABASE).filter(unit => unit.category === category);
}

export function getAllVoxelUnitIds(): number[] {
  return Object.keys(VOXEL_UNIT_DATABASE).map(Number).sort((a, b) => a - b);
}

// ===== 카테고리별 유닛 그룹 (Voxels 사양서 기반) =====
export const VOXEL_UNIT_CATEGORIES = {
  infantry: { name: '보병', icon: '🗡️', range: [1100, 1128] },
  ranged: { name: '궁수', icon: '🏹', range: [1200, 1215] },
  cavalry: { name: '기병', icon: '🐴', range: [1300, 1322] },
  wizard: { name: '책사', icon: '📿', range: [1400, 1424] },
  regional: { name: '지역/이민족', icon: '🏯', range: [1450, 1472] },
  siege: { name: '공성', icon: '⚙️', range: [1500, 1511] },
};
