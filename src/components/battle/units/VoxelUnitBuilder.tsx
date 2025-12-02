'use client';

import {
  Group,
  BoxGeometry,
  MeshStandardMaterial,
  Color,
  InstancedMesh,
  Matrix4,
  Vector3,
} from 'three';
import { 
  VOXEL_UNIT_DATABASE, 
  VOXEL_PALETTE,
  VOXEL_ANIMATIONS,
  CATEGORY_ATTACK_ANIMATIONS,
  WEAPON_ATTACK_ANIMATIONS,
  WEAPON_ATTACK_TYPE_MAP,
  WEAPON_PROJECTILE_MAP,
  UNIT_PROJECTILE_OVERRIDE,
  PROJECTILE_DATABASE,
  type VoxelUnitSpec,
  type VoxelAnimationState,
  type VoxelAnimationSequence,
  type VoxelAnimationKeyframe,
  type ProjectileType,
  type ProjectileSpec,
  type WeaponAttackType,
} from './db/VoxelUnitDefinitions';

// ===== 타입 정의 =====
type VoxelData = [number, number, number, string][]; // [x, y, z, colorKey]

export interface VoxelBuildConfig {
  unitId: number;
  primaryColor?: string;
  secondaryColor?: string;
  scale?: number;
  animationState?: VoxelAnimationState;
  animationProgress?: number; // 0~1
}

// ===== 애니메이션 컨트롤러 =====
export interface VoxelAnimationController {
  currentState: VoxelAnimationState;
  progress: number;          // 0~1
  isPlaying: boolean;
  startTime: number;
  
  play: (state: VoxelAnimationState) => void;
  stop: () => void;
  update: (deltaTime: number) => void;
  getTransforms: () => VoxelAnimationKeyframe['transforms'];
  getColorOverlay: () => string | undefined;
  getScale: () => number;
}

// 애니메이션 컨트롤러 생성 (무기 타입 기반)
export function createAnimationController(
  category: VoxelUnitSpec['category'],
  weaponType?: VoxelUnitSpec['weapon']['type'],
  unitId?: number
): VoxelAnimationController {
  let currentState: VoxelAnimationState = 'idle';
  let progress = 0;
  let isPlaying = true;
  let startTime = Date.now();
  let currentSequence: VoxelAnimationSequence = VOXEL_ANIMATIONS.idle;
  
  // 무기 타입에 따른 공격 애니메이션 결정
  const getAttackAnimation = (): VoxelAnimationSequence => {
    if (weaponType && WEAPON_ATTACK_TYPE_MAP[weaponType]) {
      const attackType = WEAPON_ATTACK_TYPE_MAP[weaponType];
      return WEAPON_ATTACK_ANIMATIONS[attackType];
    }
    // 폴백: 카테고리 기본
    return CATEGORY_ATTACK_ANIMATIONS[category] || WEAPON_ATTACK_ANIMATIONS.slash;
  };
  
  const controller: VoxelAnimationController = {
    get currentState() { return currentState; },
    get progress() { return progress; },
    get isPlaying() { return isPlaying; },
    get startTime() { return startTime; },
    
    play(state: VoxelAnimationState) {
      currentState = state;
      progress = 0;
      isPlaying = true;
      startTime = Date.now();
      
      // 공격 애니메이션은 무기 타입에 따라 선택
      if (state === 'attack') {
        currentSequence = getAttackAnimation();
      } else {
        currentSequence = VOXEL_ANIMATIONS[state];
      }
    },
    
    stop() {
      isPlaying = false;
    },
    
    update(deltaTime: number) {
      if (!isPlaying) return;
      
      const elapsed = Date.now() - startTime;
      
      // 루프가 아니고 완료된 경우
      if (!currentSequence.loop && elapsed >= currentSequence.duration) {
        if (currentState === 'death') {
          // 사망은 마지막 프레임 유지
          progress = 1;
          isPlaying = false;
        } else {
          // 다른 애니메이션은 idle로 복귀
          progress = 0;
          controller.play('idle');
        }
        return;
      }
      
      // 진행률 계산
      if (currentSequence.loop) {
        progress = (elapsed % currentSequence.duration) / currentSequence.duration;
      } else {
        progress = Math.min(elapsed / currentSequence.duration, 1);
      }
    },
    
    getTransforms() {
      const keyframes = currentSequence.keyframes;
      
      // 현재 진행률에 해당하는 키프레임 찾기
      let prevFrame = keyframes[0];
      let nextFrame = keyframes[keyframes.length - 1];
      
      for (let i = 0; i < keyframes.length - 1; i++) {
        if (progress >= keyframes[i].time && progress <= keyframes[i + 1].time) {
          prevFrame = keyframes[i];
          nextFrame = keyframes[i + 1];
          break;
        }
      }
      
      // 두 키프레임 사이 보간
      const t = (progress - prevFrame.time) / (nextFrame.time - prevFrame.time || 1);
      return interpolateTransforms(prevFrame.transforms, nextFrame.transforms, t);
    },
    
    getColorOverlay() {
      const keyframes = currentSequence.keyframes;
      for (let i = keyframes.length - 1; i >= 0; i--) {
        if (progress >= keyframes[i].time && keyframes[i].colorOverlay) {
          return keyframes[i].colorOverlay;
        }
      }
      return undefined;
    },
    
    getScale() {
      const keyframes = currentSequence.keyframes;
      let scale = 1;
      
      for (let i = 0; i < keyframes.length - 1; i++) {
        if (progress >= keyframes[i].time && progress <= keyframes[i + 1].time) {
          const prevScale = keyframes[i].scale ?? 1;
          const nextScale = keyframes[i + 1].scale ?? 1;
          const t = (progress - keyframes[i].time) / (keyframes[i + 1].time - keyframes[i].time || 1);
          scale = prevScale + (nextScale - prevScale) * t;
          break;
        }
      }
      
      return scale;
    },
  };
  
  return controller;
}

// ===== 투사체 시스템 =====
export interface ProjectileInstance {
  id: string;
  spec: ProjectileSpec;
  position: Vector3;
  velocity: Vector3;
  rotation: number;
  age: number;         // 생존 시간 (ms)
  maxAge: number;      // 최대 생존 시간
  isActive: boolean;
  mesh?: Group;
}

// 투사체 매니저
export interface ProjectileManager {
  projectiles: ProjectileInstance[];
  spawn: (type: ProjectileType, start: Vector3, target: Vector3) => ProjectileInstance;
  update: (deltaTime: number) => void;
  remove: (id: string) => void;
  clear: () => void;
}

// 투사체 매니저 생성
export function createProjectileManager(): ProjectileManager {
  const projectiles: ProjectileInstance[] = [];
  let idCounter = 0;
  
  return {
    projectiles,
    
    spawn(type: ProjectileType, start: Vector3, target: Vector3): ProjectileInstance {
      const spec = PROJECTILE_DATABASE[type];
      const direction = target.clone().sub(start).normalize();
      
      // 포물선 계산을 위한 초기 속도 조정
      const distance = start.distanceTo(target);
      const flightTime = distance / spec.speed;
      const gravityCompensation = spec.gravity * flightTime * 0.5;
      
      const velocity = direction.multiplyScalar(spec.speed);
      velocity.y += gravityCompensation; // 중력 보정
      
      const projectile: ProjectileInstance = {
        id: `proj_${idCounter++}`,
        spec,
        position: start.clone(),
        velocity,
        rotation: Math.atan2(direction.x, direction.z),
        age: 0,
        maxAge: flightTime * 1000 + 2000, // 비행 시간 + 여유
        isActive: true,
      };
      
      projectiles.push(projectile);
      return projectile;
    },
    
    update(deltaTime: number) {
      const dt = deltaTime / 1000; // 초 단위로 변환
      
      for (const proj of projectiles) {
        if (!proj.isActive) continue;
        
        // 위치 업데이트
        proj.position.x += proj.velocity.x * dt;
        proj.position.y += proj.velocity.y * dt;
        proj.position.z += proj.velocity.z * dt;
        
        // 중력 적용
        proj.velocity.y -= proj.spec.gravity * 9.8 * dt;
        
        // 회전 업데이트 (투척 도끼 등)
        if (proj.spec.type === 'throwing_axe') {
          proj.rotation += dt * 15; // 빠르게 회전
        }
        
        // 나이 업데이트
        proj.age += deltaTime;
        
        // 수명 초과 또는 바닥 충돌
        if (proj.age > proj.maxAge || proj.position.y < 0) {
          proj.isActive = false;
        }
        
        // 메시 위치 동기화
        if (proj.mesh) {
          proj.mesh.position.copy(proj.position);
          proj.mesh.rotation.y = proj.rotation;
          
          // 비행 방향에 따른 기울기
          const velocityDir = proj.velocity.clone().normalize();
          proj.mesh.rotation.x = Math.asin(-velocityDir.y);
        }
      }
      
      // 비활성 투사체 제거
      for (let i = projectiles.length - 1; i >= 0; i--) {
        if (!projectiles[i].isActive) {
          projectiles.splice(i, 1);
        }
      }
    },
    
    remove(id: string) {
      const index = projectiles.findIndex(p => p.id === id);
      if (index !== -1) {
        projectiles[index].isActive = false;
      }
    },
    
    clear() {
      projectiles.length = 0;
    },
  };
}

// 투사체 복셀 메시 생성
export function buildProjectileMesh(spec: ProjectileSpec): Group {
  const group = new Group();
  const voxelSize = 0.02;
  
  // 투사체 타입별 복셀 데이터 생성
  const voxels: VoxelData = [];
  const [sizeX, sizeY, sizeZ] = spec.size;
  const voxelCountX = Math.ceil(sizeX / voxelSize);
  const voxelCountY = Math.ceil(sizeY / voxelSize);
  const voxelCountZ = Math.ceil(sizeZ / voxelSize);
  
  // 기본 형태 생성
  for (let x = 0; x < voxelCountX; x++) {
    for (let y = 0; y < voxelCountY; y++) {
      for (let z = 0; z < voxelCountZ; z++) {
        voxels.push([x, y, z, 'P']); // P = Primary
      }
    }
  }
  
  // 색상 매핑
  const colorMap: Record<string, string> = {
    'P': spec.color,
  };
  
  // 투사체별 특수 색상
  if (spec.trail?.enabled) {
    colorMap['T'] = spec.trail.color;
  }
  
  const mesh = buildVoxelGroup(voxels, colorMap, voxelSize);
  group.add(mesh);
  
  return group;
}

// 유닛의 투사체 타입 가져오기
export function getUnitProjectileType(unitId: number, weaponType: VoxelUnitSpec['weapon']['type']): ProjectileType | null {
  // 유닛별 오버라이드 확인
  if (UNIT_PROJECTILE_OVERRIDE[unitId]) {
    return UNIT_PROJECTILE_OVERRIDE[unitId];
  }
  
  // 무기별 투사체 확인
  if (WEAPON_PROJECTILE_MAP[weaponType]) {
    return WEAPON_PROJECTILE_MAP[weaponType] as ProjectileType;
  }
  
  return null; // 근접 무기는 투사체 없음
}

// 키프레임 보간 함수
function interpolateTransforms(
  prev: VoxelAnimationKeyframe['transforms'],
  next: VoxelAnimationKeyframe['transforms'],
  t: number
): VoxelAnimationKeyframe['transforms'] {
  const result: VoxelAnimationKeyframe['transforms'] = {};
  
  const parts = ['head', 'torso', 'rightArm', 'leftArm', 'rightLeg', 'leftLeg', 'weapon', 'shield', 'mount'] as const;
  
  for (const part of parts) {
    const prevPart = prev[part];
    const nextPart = next[part];
    
    if (prevPart || nextPart) {
      result[part] = {};
      const props = ['rotX', 'rotY', 'rotZ', 'posX', 'posY', 'posZ'] as const;
      
      for (const prop of props) {
        const prevVal = prevPart?.[prop as keyof typeof prevPart] ?? 0;
        const nextVal = nextPart?.[prop as keyof typeof nextPart] ?? 0;
        if (prevVal !== 0 || nextVal !== 0) {
          (result[part] as Record<string, number>)[prop] = prevVal + (nextVal - prevVal) * t;
        }
      }
    }
  }
  
  return result;
}

// 애니메이션 변환을 Group에 적용 (파츠별 + 전체 유닛 + 색상)
export function applyAnimationToUnit(
  unit: Group,
  transforms: VoxelAnimationKeyframe['transforms'],
  colorOverlay?: string,
  scale?: number
) {
  // 기본 스케일 저장 (최초 1회)
  if (unit.userData.baseScale === undefined || unit.userData.baseScale === null) {
    unit.userData.baseScale = unit.scale.x || 1; // 0이면 1로 설정
  }
  
  // 스케일 적용 (기본값 1)
  const targetScale = scale ?? 1;
  const finalScale = unit.userData.baseScale * targetScale;
  if (finalScale > 0) {
    unit.scale.setScalar(finalScale);
  }
  
  // 기본 위치/회전 저장 (최초 1회)
  if (!unit.userData.basePosition) {
    unit.userData.basePosition = unit.position.clone();
    unit.userData.baseRotation = unit.rotation.clone();
  }
  
  // 전체 유닛 변환 적용 (torso 변환을 전체에 적용)
  // 항상 기본값으로 리셋 후 적용
  unit.position.y = unit.userData.basePosition.y + (transforms.torso?.posY ?? 0);
  unit.rotation.x = (transforms.torso?.rotX ?? 0);
  unit.rotation.z = (transforms.torso?.rotZ ?? 0);
  // Y 회전은 자동 회전과 충돌하므로 건드리지 않음
  
  // 색상 오버레이 적용
  unit.traverse((child) => {
    if (child instanceof InstancedMesh) {
      const material = child.material as MeshStandardMaterial;
      if (colorOverlay) {
        const overlayColor = new Color(colorOverlay);
        material.emissive = overlayColor;
        material.emissiveIntensity = 0.5;
      } else {
        // 오버레이 제거
        material.emissive = new Color(0x000000);
        material.emissiveIntensity = 0;
      }
    }
  });
  
  // ===== 파츠별 애니메이션 적용 (unit.userData.parts가 있는 경우) =====
  const parts = unit.userData.parts as HumanPartsGroups | undefined;
  if (parts) {
    // 머리 변환
    if (parts.head && transforms.head) {
      applyPartTransform(parts.head, transforms.head);
    }
    
    // 몸통 변환 (전체 유닛에 이미 적용됨, 추가 회전만)
    if (parts.torso && transforms.torso) {
      applyPartTransform(parts.torso, transforms.torso);
    }
    
    // 오른팔 변환
    if (parts.rightArm && transforms.rightArm) {
      applyPartTransform(parts.rightArm, transforms.rightArm);
    }
    
    // 왼팔 변환
    if (parts.leftArm && transforms.leftArm) {
      applyPartTransform(parts.leftArm, transforms.leftArm);
    }
    
    // 오른다리 변환
    if (parts.rightLeg && transforms.rightLeg) {
      applyPartTransform(parts.rightLeg, transforms.rightLeg);
    }
    
    // 왼다리 변환
    if (parts.leftLeg && transforms.leftLeg) {
      applyPartTransform(parts.leftLeg, transforms.leftLeg);
    }
  }
  
  // 무기 변환 (weapon 이름 가진 자식 찾기)
  unit.traverse((child) => {
    if (child.name === 'weapon') {
      if (!child.userData.baseRotation) {
        child.userData.baseRotation = child.rotation.clone();
        child.userData.basePosition = child.position.clone();
      }
      
      // 항상 기본값 + 변환값 적용 (변환이 없으면 기본값으로 복귀)
      const weaponTransform = transforms.weapon ?? {};
      child.rotation.x = child.userData.baseRotation.x + (weaponTransform.rotX ?? 0);
      child.rotation.y = child.userData.baseRotation.y + (weaponTransform.rotY ?? 0);
      child.rotation.z = child.userData.baseRotation.z + (weaponTransform.rotZ ?? 0);
      child.position.x = child.userData.basePosition.x + (weaponTransform.posX ?? 0);
      child.position.y = child.userData.basePosition.y + (weaponTransform.posY ?? 0);
      child.position.z = child.userData.basePosition.z + (weaponTransform.posZ ?? 0);
    }
    
    // 방패 변환
    if (child.name === 'shield') {
      if (!child.userData.baseRotation) {
        child.userData.baseRotation = child.rotation.clone();
      }
      
      const shieldTransform = transforms.shield ?? {};
      child.rotation.x = child.userData.baseRotation.x + (shieldTransform.rotX ?? 0);
      child.rotation.y = child.userData.baseRotation.y + (shieldTransform.rotY ?? 0);
      child.rotation.z = child.userData.baseRotation.z + (shieldTransform.rotZ ?? 0);
    }
    
    // 탈것 변환
    if (child.name === 'mount') {
      if (!child.userData.basePosition) {
        child.userData.basePosition = child.position.clone();
        child.userData.baseRotation = child.rotation.clone();
      }
      
      const mountTransform = transforms.mount ?? {};
      child.position.y = child.userData.basePosition.y + (mountTransform.posY ?? 0);
      child.rotation.x = child.userData.baseRotation.x + (mountTransform.rotX ?? 0);
    }
  });
}

// 파츠 변환 헬퍼 함수
function applyPartTransform(
  part: Group,
  transform: { rotX?: number; rotY?: number; rotZ?: number; posX?: number; posY?: number; posZ?: number }
) {
  // 기본값 저장 (최초 1회)
  if (!part.userData.baseRotation) {
    part.userData.baseRotation = part.rotation.clone();
    part.userData.basePosition = part.position.clone();
  }
  
  // 회전 적용
  part.rotation.x = part.userData.baseRotation.x + (transform.rotX ?? 0);
  part.rotation.y = part.userData.baseRotation.y + (transform.rotY ?? 0);
  part.rotation.z = part.userData.baseRotation.z + (transform.rotZ ?? 0);
  
  // 위치 적용 (있는 경우)
  if (transform.posX !== undefined || transform.posY !== undefined || transform.posZ !== undefined) {
    part.position.x = part.userData.basePosition.x + (transform.posX ?? 0);
    part.position.y = part.userData.basePosition.y + (transform.posY ?? 0);
    part.position.z = part.userData.basePosition.z + (transform.posZ ?? 0);
  }
}

// ===== 국가 팔레트 =====
export const VOXEL_NATION_PALETTES: Record<string, { primary: string; secondary: string }> = {
  wei: { primary: '#1e40af', secondary: '#60a5fa' },
  shu: { primary: '#15803d', secondary: '#4ade80' },
  wu: { primary: '#b91c1c', secondary: '#fca5a5' },
  jin: { primary: '#7c3aed', secondary: '#c4b5fd' },
  yellow: { primary: '#ca8a04', secondary: '#fde047' },
  dong: { primary: '#374151', secondary: '#9ca3af' },
  nanman: { primary: '#92400e', secondary: '#fbbf24' },
  goguryeo: { primary: '#0f766e', secondary: '#5eead4' },
  neutral: { primary: '#6b7280', secondary: '#d1d5db' },
};

// ===== 7.5등신 상세 인체 복셀 (16x16x24 축소 스케일) =====
// 머리: y=20~24 (4 유닛)
// 목: y=19 (1 유닛)
// 상체: y=12~18 (7 유닛) 
// 하체: y=6~11 (6 유닛)
// 다리: y=0~5 (6 유닛)
// 총 24 유닛 = 7.5등신 (머리 4 + 몸 20 = 약 1:5 비율에서 7.5등신 근사)

// ===== 파츠별 인체 복셀 데이터 =====
export interface HumanBodyParts {
  head: VoxelData;      // 머리 + 목
  torso: VoxelData;     // 어깨 + 상체 + 허리/복부 + 골반
  rightArm: VoxelData;  // 오른팔 + 오른손
  leftArm: VoxelData;   // 왼팔 + 왼손
  rightLeg: VoxelData;  // 오른쪽 허벅지 + 종아리 + 발
  leftLeg: VoxelData;   // 왼쪽 허벅지 + 종아리 + 발
}

// 파츠별 피벗 포인트 (회전 중심, 복셀 좌표계)
export const HUMAN_PART_PIVOTS = {
  head: { x: 7.5, y: 19, z: 7.5 },      // 목 기준
  torso: { x: 7.5, y: 12, z: 7.5 },     // 허리 기준
  rightArm: { x: 11, y: 17, z: 7.5 },   // 오른쪽 어깨 기준
  leftArm: { x: 4, y: 17, z: 7.5 },     // 왼쪽 어깨 기준
  rightLeg: { x: 9, y: 10, z: 7.5 },    // 오른쪽 골반 기준
  leftLeg: { x: 6, y: 10, z: 7.5 },     // 왼쪽 골반 기준
};

function generateHeadPart(): VoxelData {
  const voxels: VoxelData = [];
  
  // 머리 (y=20~23)
  for (let y = 20; y <= 23; y++) {
    for (let x = 6; x <= 9; x++) {
      for (let z = 6; z <= 9; z++) {
        const isCorner = (x === 6 || x === 9) && (z === 6 || z === 9);
        const isTopCorner = y === 23 && isCorner;
        const isBottomFront = y === 20 && z === 6;
        
        if (!isTopCorner && !isBottomFront) {
          const color = z === 6 ? 'K' : (z === 9 || y === 23 ? 'H' : 'K');
          voxels.push([x, y, z, color]);
        }
      }
    }
  }
  
  // 목 (y=19)
  for (let x = 7; x <= 8; x++) {
    for (let z = 7; z <= 8; z++) {
      voxels.push([x, 19, z, 'K']);
    }
  }
  
  return voxels;
}

function generateTorsoPart(): VoxelData {
  const voxels: VoxelData = [];
  
  // 어깨 (y=18) - 팔 제외한 중앙 부분만
  for (let x = 5; x <= 10; x++) {
    for (let z = 6; z <= 9; z++) {
      voxels.push([x, 18, z, 'P']);
    }
  }
  
  // 상체 (y=14~17)
  for (let y = 14; y <= 17; y++) {
    const startX = y >= 16 ? 5 : 6;
    const endX = y >= 16 ? 10 : 9;
    
    for (let x = startX; x <= endX; x++) {
      for (let z = 6; z <= 9; z++) {
        voxels.push([x, y, z, 'P']);
      }
    }
  }
  
  // 허리/복부 (y=12~13)
  for (let y = 12; y <= 13; y++) {
    for (let x = 6; x <= 9; x++) {
      for (let z = 6; z <= 9; z++) {
        voxels.push([x, y, z, 'S']);
      }
    }
  }
  
  // 골반/엉덩이 (y=10~11)
  for (let y = 10; y <= 11; y++) {
    for (let x = 5; x <= 10; x++) {
      for (let z = 6; z <= 9; z++) {
        voxels.push([x, y, z, 'S']);
      }
    }
  }
  
  return voxels;
}

function generateRightArmPart(): VoxelData {
  const voxels: VoxelData = [];
  
  // 어깨 끝 (y=18)
  for (let z = 6; z <= 9; z++) {
    voxels.push([11, 18, z, 'K']);
    voxels.push([12, 18, z, 'K']);
  }
  
  // 오른팔 (y=13~17)
  for (let y = 13; y <= 17; y++) {
    for (let z = 7; z <= 8; z++) {
      const x = y >= 16 ? 12 : 11;
      voxels.push([x, y, z, 'K']);
      if (y >= 16) voxels.push([11, y, z, 'K']);
    }
  }
  
  // 오른손
  voxels.push([11, 12, 7, 'K']); voxels.push([11, 12, 8, 'K']);
  voxels.push([12, 12, 7, 'K']); voxels.push([12, 12, 8, 'K']);
  
  return voxels;
}

function generateLeftArmPart(): VoxelData {
  const voxels: VoxelData = [];
  
  // 어깨 끝 (y=18)
  for (let z = 6; z <= 9; z++) {
    voxels.push([3, 18, z, 'K']);
    voxels.push([4, 18, z, 'K']);
  }
  
  // 왼팔 (y=13~17)
  for (let y = 13; y <= 17; y++) {
    for (let z = 7; z <= 8; z++) {
      const x = y >= 16 ? 3 : 4;
      voxels.push([x, y, z, 'K']);
      if (y >= 16) voxels.push([4, y, z, 'K']);
    }
  }
  
  // 왼손
  voxels.push([3, 12, 7, 'K']); voxels.push([3, 12, 8, 'K']);
  voxels.push([4, 12, 7, 'K']); voxels.push([4, 12, 8, 'K']);
  
  return voxels;
}

function generateRightLegPart(): VoxelData {
  const voxels: VoxelData = [];
  
  // 오른쪽 허벅지 (y=6~9)
  for (let y = 6; y <= 9; y++) {
    for (let x = 8; x <= 10; x++) {
      for (let z = 6; z <= 9; z++) {
        if (!(x === 8 && (z === 6 || z === 9))) {
          voxels.push([x, y, z, 'P']);
        }
      }
    }
  }
  
  // 오른쪽 종아리 (y=2~5)
  for (let y = 2; y <= 5; y++) {
    for (let x = 9; x <= 10; x++) {
      for (let z = 6; z <= 8; z++) {
        voxels.push([x, y, z, 'P']);
      }
    }
  }
  
  // 오른발 (y=0~1)
  for (let z = 5; z <= 8; z++) {
    voxels.push([9, 0, z, 'B']); voxels.push([10, 0, z, 'B']);
    voxels.push([9, 1, z, 'B']); voxels.push([10, 1, z, 'B']);
  }
  
  return voxels;
}

function generateLeftLegPart(): VoxelData {
  const voxels: VoxelData = [];
  
  // 왼쪽 허벅지 (y=6~9)
  for (let y = 6; y <= 9; y++) {
    for (let x = 5; x <= 7; x++) {
      for (let z = 6; z <= 9; z++) {
        if (!(x === 7 && (z === 6 || z === 9))) {
          voxels.push([x, y, z, 'P']);
        }
      }
    }
  }
  
  // 왼쪽 종아리 (y=2~5)
  for (let y = 2; y <= 5; y++) {
    for (let x = 5; x <= 6; x++) {
      for (let z = 6; z <= 8; z++) {
        voxels.push([x, y, z, 'P']);
      }
    }
  }
  
  // 왼발 (y=0~1)
  for (let z = 5; z <= 8; z++) {
    voxels.push([5, 0, z, 'B']); voxels.push([6, 0, z, 'B']);
    voxels.push([5, 1, z, 'B']); voxels.push([6, 1, z, 'B']);
  }
  
  return voxels;
}

// 파츠별 인체 데이터 생성
function generateHumanBodyParts(): HumanBodyParts {
  return {
    head: generateHeadPart(),
    torso: generateTorsoPart(),
    rightArm: generateRightArmPart(),
    leftArm: generateLeftArmPart(),
    rightLeg: generateRightLegPart(),
    leftLeg: generateLeftLegPart(),
  };
}

// 기존 호환용: 모든 파츠를 합친 전체 인체 데이터
function generateDetailedHuman(): VoxelData {
  const parts = generateHumanBodyParts();
  return [
    ...parts.head,
    ...parts.torso,
    ...parts.rightArm,
    ...parts.leftArm,
    ...parts.rightLeg,
    ...parts.leftLeg,
  ];
}

export const VOXEL_HUMAN_PARTS = generateHumanBodyParts();
const VOXEL_HUMAN_DETAILED = generateDetailedHuman();

// ===== 상세 투구 데이터 =====
const VOXEL_HEADS_DETAILED: Record<string, VoxelData> = {
  // 무변 (납작한 가죽 모자)
  wubian: (() => {
    const v: VoxelData = [];
    // 넓은 챙
    for (let x = 4; x <= 11; x++) {
      for (let z = 4; z <= 11; z++) {
        if (!((x <= 5 || x >= 10) && (z <= 5 || z >= 10))) {
          v.push([x, 24, z, 'M']);
        }
      }
    }
    // 모자 몸체
    for (let x = 6; x <= 9; x++) {
      for (let z = 6; z <= 9; z++) {
        v.push([x, 25, z, 'M']);
      }
    }
    return v;
  })(),
  
  // 일반 철모
  soldier_helm: (() => {
    const v: VoxelData = [];
    // 투구 본체
    for (let y = 24; y <= 26; y++) {
      for (let x = 5; x <= 10; x++) {
        for (let z = 5; z <= 10; z++) {
          const isCorner = (x <= 5 || x >= 10) && (z <= 5 || z >= 10);
          if (!isCorner || y < 26) {
            v.push([x, y, z, 'M']);
          }
        }
      }
    }
    // 정수리 장식
    v.push([7, 27, 7, 'P']); v.push([8, 27, 7, 'P']);
    v.push([7, 27, 8, 'P']); v.push([8, 27, 8, 'P']);
    v.push([7, 28, 7, 'P']); v.push([8, 28, 8, 'P']);
    // 목가리개
    for (let x = 5; x <= 10; x++) {
      v.push([x, 19, 10, 'M']);
      v.push([x, 18, 10, 'M']);
    }
    return v;
  })(),
  
  // 중장 투구 (함진영 등)
  heavy_helm: (() => {
    const v: VoxelData = [];
    // 두꺼운 투구 본체
    for (let y = 24; y <= 27; y++) {
      for (let x = 4; x <= 11; x++) {
        for (let z = 4; z <= 11; z++) {
          const isCorner = (x <= 4 || x >= 11) && (z <= 4 || z >= 11);
          if (!isCorner || y < 27) {
            v.push([x, y, z, 'M']);
          }
        }
      }
    }
    // 볼가리개
    v.push([4, 22, 5, 'M']); v.push([4, 23, 5, 'M']);
    v.push([11, 22, 5, 'M']); v.push([11, 23, 5, 'M']);
    // 넓은 목가리개
    for (let y = 17; y <= 19; y++) {
      for (let x = 3; x <= 12; x++) {
        v.push([x, y, 10, 'M']);
        v.push([x, y, 11, 'M']);
      }
    }
    return v;
  })(),
  
  // 통수개 (얼굴 가리개)
  tongxiukai: (() => {
    const v: VoxelData = [];
    // 투구 본체
    for (let y = 24; y <= 27; y++) {
      for (let x = 4; x <= 11; x++) {
        for (let z = 4; z <= 11; z++) {
          v.push([x, y, z, 'M']);
        }
      }
    }
    // 얼굴 가리개 (앞면)
    for (let y = 20; y <= 23; y++) {
      for (let x = 5; x <= 10; x++) {
        // 눈 슬릿 제외
        if (!(y === 22 && x >= 6 && x <= 9)) {
          v.push([x, y, 5, 'M']);
        } else {
          v.push([x, y, 5, 'B']); // 눈 슬릿 (검정)
        }
      }
    }
    // 목가리개
    for (let y = 17; y <= 19; y++) {
      for (let x = 3; x <= 12; x++) {
        v.push([x, y, 10, 'M']);
        v.push([x, y, 11, 'M']);
      }
    }
    return v;
  })(),
  
  // 황건 두건
  yellow_turban: (() => {
    const v: VoxelData = [];
    // 두건 본체
    for (let y = 23; y <= 25; y++) {
      for (let x = 5; x <= 10; x++) {
        for (let z = 5; z <= 10; z++) {
          v.push([x, y, z, 'Y']);
        }
      }
    }
    // 매듭/장식
    v.push([7, 26, 7, 'Y']); v.push([8, 26, 7, 'Y']);
    // 늘어진 천
    v.push([5, 22, 10, 'Y']); v.push([10, 22, 10, 'Y']);
    v.push([5, 21, 10, 'Y']); v.push([10, 21, 10, 'Y']);
    return v;
  })(),
  
  // 등나무 삿갓
  rattan_hat: (() => {
    const v: VoxelData = [];
    // 넓은 원뿔형 챙
    for (let y = 24; y <= 26; y++) {
      const radius = 26 - y + 4; // 아래로 갈수록 넓어짐
      for (let x = 8 - radius; x <= 7 + radius; x++) {
        for (let z = 8 - radius; z <= 7 + radius; z++) {
          const dist = Math.sqrt((x - 7.5) ** 2 + (z - 7.5) ** 2);
          if (dist <= radius) {
            v.push([x, y, z, 'R']);
          }
        }
      }
    }
    return v;
  })(),
  
  // 고구려 투구 (절풍 포함)
  goguryeo_helm: (() => {
    const v: VoxelData = [];
    // 종형 투구 본체
    for (let y = 24; y <= 28; y++) {
      const shrink = Math.floor((y - 24) / 2);
      for (let x = 5 + shrink; x <= 10 - shrink; x++) {
        for (let z = 5; z <= 10; z++) {
          v.push([x, y, z, 'M']);
        }
      }
    }
    // 절풍 (새 깃털) - 양옆
    for (let y = 26; y <= 32; y++) {
      v.push([3, y, 7, 'W']); v.push([3, y, 8, 'W']);
      v.push([12, y, 7, 'W']); v.push([12, y, 8, 'W']);
    }
    // 목가리개
    for (let x = 4; x <= 11; x++) {
      v.push([x, 19, 10, 'M']);
      v.push([x, 18, 10, 'M']);
    }
    return v;
  })(),
  
  // 늑대 가죽 투구
  wolf_skin: (() => {
    const v: VoxelData = [];
    // 늑대 가죽 본체
    for (let y = 23; y <= 26; y++) {
      for (let x = 4; x <= 11; x++) {
        for (let z = 4; z <= 11; z++) {
          v.push([x, y, z, 'G']);
        }
      }
    }
    // 늑대 귀
    v.push([4, 27, 6, 'G']); v.push([4, 28, 6, 'G']); v.push([4, 29, 6, 'G']);
    v.push([11, 27, 6, 'G']); v.push([11, 28, 6, 'G']); v.push([11, 29, 6, 'G']);
    // 늑대 주둥이
    v.push([7, 22, 3, 'G']); v.push([8, 22, 3, 'G']);
    v.push([7, 21, 3, 'G']); v.push([8, 21, 3, 'G']);
    return v;
  })(),
  
  // 판갑 투구 (가야)
  plate_helm: (() => {
    const v: VoxelData = [];
    // 종형 투구
    for (let y = 24; y <= 27; y++) {
      for (let x = 5; x <= 10; x++) {
        for (let z = 5; z <= 10; z++) {
          v.push([x, y, z, 'M']);
        }
      }
    }
    // 소용돌이 장식
    v.push([7, 28, 7, 'X']); v.push([8, 28, 8, 'X']);
    v.push([7, 29, 8, 'X']); v.push([8, 29, 7, 'X']);
    // 넓은 목 뒤 철판
    for (let y = 17; y <= 20; y++) {
      for (let x = 3; x <= 12; x++) {
        v.push([x, y, 11, 'M']);
        v.push([x, y, 12, 'M']);
      }
    }
    return v;
  })(),
  
  // 터번
  turban: (() => {
    const v: VoxelData = [];
    // 감긴 천
    for (let y = 23; y <= 27; y++) {
      for (let x = 5; x <= 10; x++) {
        for (let z = 5; z <= 10; z++) {
          v.push([x, y, z, 'W']);
        }
      }
    }
    // 늘어진 천
    v.push([5, 22, 10, 'W']); v.push([5, 21, 10, 'W']); v.push([5, 20, 10, 'W']);
    return v;
  })(),
  
  // 기본 머리 (투구 없음)
  base_head: (() => {
    return []; // 기본 인체 머리 사용
  })(),
  
  // 헝클어진 머리 (도민병)
  messy_hair: (() => {
    const v: VoxelData = [];
    // 헝클어진 머리카락
    for (let y = 23; y <= 25; y++) {
      v.push([5, y, 7, 'H']); v.push([10, y, 7, 'H']);
      v.push([6, y, 5, 'H']); v.push([9, y, 5, 'H']);
    }
    v.push([7, 26, 6, 'H']); v.push([8, 26, 6, 'H']);
    v.push([6, 25, 10, 'H']); v.push([9, 25, 10, 'H']);
    return v;
  })(),
  
  // 두건 (수군 등)
  bandana: (() => {
    const v: VoxelData = [];
    for (let x = 5; x <= 10; x++) {
      for (let z = 5; z <= 10; z++) {
        v.push([x, 24, z, 'P']);
      }
    }
    // 매듭
    v.push([5, 23, 10, 'P']); v.push([5, 22, 10, 'P']);
    return v;
  })(),
  
  // 삿갓
  straw_hat: (() => {
    const v: VoxelData = [];
    // 넓은 원뿔형
    for (let y = 24; y <= 27; y++) {
      const radius = 27 - y + 5;
      for (let x = 8 - radius; x <= 7 + radius; x++) {
        for (let z = 8 - radius; z <= 7 + radius; z++) {
          const dist = Math.sqrt((x - 7.5) ** 2 + (z - 7.5) ** 2);
          if (dist <= radius) {
            v.push([x, y, z, 'Y']);
          }
        }
      }
    }
    return v;
  })(),
  
  // 모피 모자
  fur_cap: (() => {
    const v: VoxelData = [];
    for (let y = 23; y <= 26; y++) {
      for (let x = 5; x <= 10; x++) {
        for (let z = 5; z <= 10; z++) {
          v.push([x, y, z, 'D']);
        }
      }
    }
    // 귀덮개
    v.push([4, 22, 7, 'D']); v.push([4, 21, 7, 'D']);
    v.push([11, 22, 7, 'D']); v.push([11, 21, 7, 'D']);
    return v;
  })(),
  
  // 멧돼지 가죽
  boar_skin: (() => {
    const v: VoxelData = [];
    for (let y = 23; y <= 26; y++) {
      for (let x = 4; x <= 11; x++) {
        for (let z = 4; z <= 11; z++) {
          v.push([x, y, z, 'D']);
        }
      }
    }
    // 엄니
    v.push([5, 22, 4, 'I']); v.push([5, 21, 3, 'I']);
    v.push([10, 22, 4, 'I']); v.push([10, 21, 3, 'I']);
    return v;
  })(),
  
  // 정예 투구
  elite_helm: (() => {
    const v: VoxelData = [];
    for (let y = 24; y <= 27; y++) {
      for (let x = 5; x <= 10; x++) {
        for (let z = 5; z <= 10; z++) {
          v.push([x, y, z, 'M']);
        }
      }
    }
    // 장식
    v.push([7, 28, 7, 'X']); v.push([8, 28, 7, 'X']);
    v.push([7, 29, 7, 'X']); v.push([8, 29, 8, 'X']);
    // 목가리개
    for (let x = 5; x <= 10; x++) {
      v.push([x, 19, 10, 'M']); v.push([x, 18, 10, 'M']);
    }
    return v;
  })(),
  
  // 용 투구
  dragon_helm: (() => {
    const v: VoxelData = [];
    for (let y = 24; y <= 27; y++) {
      for (let x = 5; x <= 10; x++) {
        for (let z = 5; z <= 10; z++) {
          v.push([x, y, z, 'M']);
        }
      }
    }
    // 용 장식
    v.push([7, 28, 6, 'X']); v.push([8, 28, 6, 'X']);
    v.push([7, 29, 5, 'X']); v.push([8, 29, 5, 'X']);
    v.push([7, 30, 5, 'C']); v.push([8, 30, 5, 'C']);
    // 뿔
    v.push([5, 27, 6, 'X']); v.push([5, 28, 5, 'X']);
    v.push([10, 27, 6, 'X']); v.push([10, 28, 5, 'X']);
    return v;
  })(),
  
  // 황금 투구
  gold_helm: (() => {
    const v: VoxelData = [];
    for (let y = 24; y <= 27; y++) {
      for (let x = 5; x <= 10; x++) {
        for (let z = 5; z <= 10; z++) {
          v.push([x, y, z, 'Y']);
        }
      }
    }
    // 보석 장식
    v.push([7, 25, 5, 'C']); v.push([8, 25, 5, 'C']);
    // 깃털
    for (let y = 28; y <= 33; y++) {
      v.push([7, y, 8, 'W']); v.push([8, y, 8, 'W']);
    }
    return v;
  })(),
  
  // 주술사 가면
  shaman_mask: (() => {
    const v: VoxelData = [];
    // 가면 본체
    for (let y = 20; y <= 24; y++) {
      for (let x = 5; x <= 10; x++) {
        v.push([x, y, 5, 'W']);
      }
    }
    // 눈 구멍
    v.push([6, 22, 5, 'B']); v.push([9, 22, 5, 'B']);
    // 입
    v.push([7, 20, 5, 'C']); v.push([8, 20, 5, 'C']);
    // 장식
    v.push([5, 25, 5, 'P']); v.push([10, 25, 5, 'P']);
    return v;
  })(),
  
  // 호랑이 투구
  tiger_helm: (() => {
    const v: VoxelData = [];
    for (let y = 23; y <= 26; y++) {
      for (let x = 4; x <= 11; x++) {
        for (let z = 4; z <= 11; z++) {
          v.push([x, y, z, 'O']);
        }
      }
    }
    // 줄무늬
    v.push([5, 24, 5, 'B']); v.push([6, 25, 5, 'B']);
    v.push([9, 24, 5, 'B']); v.push([10, 25, 5, 'B']);
    // 귀
    v.push([4, 27, 6, 'O']); v.push([4, 28, 6, 'O']);
    v.push([11, 27, 6, 'O']); v.push([11, 28, 6, 'O']);
    return v;
  })(),
  
  // 노블 크라운 (commander)
  noble_crown: (() => {
    const v: VoxelData = [];
    // 관
    for (let x = 5; x <= 10; x++) {
      v.push([x, 24, 5, 'Y']); v.push([x, 24, 10, 'Y']);
    }
    for (let z = 5; z <= 10; z++) {
      v.push([5, 24, z, 'Y']); v.push([10, 24, z, 'Y']);
    }
    // 봉황 장식
    v.push([7, 25, 5, 'X']); v.push([8, 25, 5, 'X']);
    v.push([7, 26, 5, 'C']); v.push([8, 26, 5, 'C']);
    return v;
  })(),
  
  // 지휘관 투구
  commander_helm: (() => {
    const v: VoxelData = [];
    for (let y = 24; y <= 27; y++) {
      for (let x = 5; x <= 10; x++) {
        for (let z = 5; z <= 10; z++) {
          v.push([x, y, z, 'M']);
        }
      }
    }
    // 깃털 장식
    for (let y = 28; y <= 34; y++) {
      v.push([7, y, 7, 'C']); v.push([8, y, 7, 'C']);
    }
    return v;
  })(),
  
  // 깃털 투구 (고구려 대체)
  feather_helm: (() => {
    const v: VoxelData = [];
    for (let y = 24; y <= 27; y++) {
      for (let x = 5; x <= 10; x++) {
        for (let z = 5; z <= 10; z++) {
          v.push([x, y, z, 'M']);
        }
      }
    }
    // 양옆 깃털
    for (let y = 26; y <= 32; y++) {
      v.push([3, y, 7, 'W']); v.push([12, y, 7, 'W']);
    }
    return v;
  })(),
};

// ===== 상세 무기 데이터 =====
const VOXEL_WEAPONS_DETAILED: Record<string, VoxelData> = {
  // 환수도 (고리 자루 칼)
  dao: (() => {
    const v: VoxelData = [];
    // 자루
    for (let y = 0; y <= 4; y++) {
      v.push([0, y, 0, 'W']); v.push([1, y, 0, 'W']);
    }
    // 코등이
    v.push([0, 5, 0, 'X']); v.push([1, 5, 0, 'X']); v.push([2, 5, 0, 'X']);
    // 칼날
    for (let y = 6; y <= 16; y++) {
      v.push([0, y, 0, 'M']); v.push([1, y, 0, 'M']);
      if (y >= 14) v.push([0, y, 0, 'M']); // 끝부분 좁게
    }
    // 환두 (고리)
    v.push([0, -1, 0, 'X']); v.push([-1, -1, 0, 'X']); v.push([-1, 0, 0, 'X']);
    v.push([-1, 1, 0, 'X']); v.push([0, 1, -1, 'X']);
    return v;
  })(),
  
  // 녹슨 환수도
  rusted_dao: (() => {
    const v: VoxelData = [];
    // 자루 (너덜너덜)
    for (let y = 0; y <= 3; y++) {
      v.push([0, y, 0, 'W']);
    }
    // 녹슨 코등이
    v.push([0, 4, 0, 'E']); v.push([1, 4, 0, 'E']);
    // 녹슨 칼날 (이빨 빠진)
    for (let y = 5; y <= 13; y++) {
      if (y !== 8 && y !== 11) { // 이빨 빠진 부분
        v.push([0, y, 0, 'E']);
      }
    }
    // 부러진 환두
    v.push([0, -1, 0, 'E']);
    return v;
  })(),
  
  // 극 (창+ㄱ자 날)
  ji: (() => {
    const v: VoxelData = [];
    // 긴 자루 (팔각형 단면 표현)
    for (let y = 0; y <= 24; y++) {
      v.push([0, y, 0, 'W']); v.push([1, y, 0, 'W']);
      v.push([0, y, 1, 'W']); v.push([1, y, 1, 'W']);
      // 청동 테 (5칸마다)
      if (y % 5 === 0) {
        v.push([0, y, 0, 'X']); v.push([1, y, 1, 'X']);
      }
    }
    // 창날 (버드나무 잎 형태)
    for (let y = 25; y <= 30; y++) {
      v.push([0, y, 0, 'M']); v.push([1, y, 0, 'M']);
      if (y <= 28) { v.push([0, y, 1, 'M']); }
    }
    // ㄱ자 옆날
    for (let x = 2; x <= 5; x++) {
      v.push([x, 22, 0, 'M']); v.push([x, 22, 1, 'M']);
    }
    v.push([5, 23, 0, 'M']); v.push([5, 24, 0, 'M']);
    // 뾰루비 (아래)
    v.push([0, -1, 0, 'X']); v.push([0, -2, 0, 'X']);
    return v;
  })(),
  
  // 참마검 (대검)
  zhanmadao: (() => {
    const v: VoxelData = [];
    // 긴 자루
    for (let y = 0; y <= 8; y++) {
      v.push([0, y, 0, 'W']); v.push([1, y, 0, 'W']);
      // 붉은 감개
      if (y >= 2 && y <= 6) {
        v.push([0, y, 0, 'C']); v.push([1, y, 0, 'C']);
      }
    }
    // 십자형 코등이
    v.push([-1, 9, 0, 'X']); v.push([0, 9, 0, 'X']); v.push([1, 9, 0, 'X']); v.push([2, 9, 0, 'X']);
    // 넓은 칼날
    for (let y = 10; y <= 28; y++) {
      v.push([0, y, 0, 'M']); v.push([1, y, 0, 'M']); v.push([2, y, 0, 'M']);
      // 피홈
      if (y >= 14 && y <= 24) {
        v.push([1, y, 1, 'B']);
      }
    }
    // 석구 (자루 끝)
    v.push([0, -1, 0, 'M']); v.push([1, -1, 0, 'M']);
    return v;
  })(),
  
  // 도끼창 (할버드)
  halberd: (() => {
    const v: VoxelData = [];
    // 자루
    for (let y = 0; y <= 22; y++) {
      v.push([0, y, 0, 'W']); v.push([1, y, 0, 'W']);
    }
    // 창촉
    for (let y = 23; y <= 28; y++) {
      v.push([0, y, 0, 'M']); v.push([1, y, 0, 'M']);
    }
    // 반달형 도끼날
    for (let x = 2; x <= 6; x++) {
      for (let y = 18; y <= 22; y++) {
        const dist = Math.sqrt((x - 2) ** 2 + (y - 20) ** 2);
        if (dist <= 4.5) {
          v.push([x, y, 0, 'M']);
        }
      }
    }
    // 반대편 스파이크
    v.push([-1, 20, 0, 'M']); v.push([-2, 20, 0, 'M']);
    return v;
  })(),
  
  // 창
  spear: (() => {
    const v: VoxelData = [];
    // 자루
    for (let y = 0; y <= 22; y++) {
      v.push([0, y, 0, 'W']);
    }
    // 창날
    for (let y = 23; y <= 28; y++) {
      v.push([0, y, 0, 'M']);
      if (y <= 26) { v.push([1, y, 0, 'M']); v.push([-1, y, 0, 'M']); }
    }
    return v;
  })(),
  
  // 기병창 (란스)
  lance: (() => {
    const v: VoxelData = [];
    // 긴 자루
    for (let y = 0; y <= 32; y++) {
      v.push([0, y, 0, 'W']); v.push([1, y, 0, 'W']);
    }
    // 창날
    for (let y = 33; y <= 40; y++) {
      v.push([0, y, 0, 'M']); v.push([1, y, 0, 'M']);
    }
    // 술 (빨간 말총)
    for (let i = 0; i < 4; i++) {
      v.push([2, 30, i - 1, 'C']); v.push([-1, 30, i - 1, 'C']);
      v.push([2, 29, i - 1, 'C']); v.push([-1, 29, i - 1, 'C']);
    }
    return v;
  })(),
  
  // 활 (각궁)
  composite_bow: (() => {
    const v: VoxelData = [];
    // 리커브 형태 (양끝이 반대로 휨)
    const bowShape: Array<[number, number, string]> = [
      [0, 0, 'W'], [0, 1, 'W'], [0, 2, 'W'], [0, 3, 'W'], [0, 4, 'W'],
      [0, 5, 'W'], [0, 6, 'W'], [0, 7, 'W'], [0, 8, 'W'], [0, 9, 'W'],
      [0, 10, 'W'],
      [-1, 0, 'W'], [-2, -1, 'W'], // 아래 리커브
      [-1, 10, 'W'], [-2, 11, 'W'], // 위 리커브
    ];
    bowShape.forEach(([x, y, c]) => v.push([x, y, 0, c]));
    
    // 시위
    for (let y = -1; y <= 11; y++) {
      v.push([-3, y, 0, 'T']);
    }
    return v;
  })(),
  
  // 쇠뇌
  crossbow: (() => {
    const v: VoxelData = [];
    // 총신
    for (let y = 0; y <= 8; y++) {
      v.push([0, y, 0, 'W']); v.push([1, y, 0, 'W']);
    }
    // 활대
    for (let x = -4; x <= 5; x++) {
      v.push([x, 7, 0, 'W']);
    }
    // 시위
    for (let x = -4; x <= 5; x++) {
      v.push([x, 6, 0, 'T']);
    }
    // 노기 (방아쇠)
    v.push([0, 3, 1, 'X']); v.push([1, 3, 1, 'X']);
    v.push([0, 2, 1, 'X']);
    // 발걸이
    v.push([0, 9, 0, 'M']); v.push([1, 9, 0, 'M']);
    return v;
  })(),
  
  // 연노 (연발 쇠뇌)
  repeater_crossbow: (() => {
    const v: VoxelData = [];
    // 총신
    for (let y = 0; y <= 8; y++) {
      v.push([0, y, 0, 'W']); v.push([1, y, 0, 'W']);
    }
    // 활대 (작음)
    for (let x = -3; x <= 4; x++) {
      v.push([x, 7, 0, 'W']);
    }
    // 탄창 박스
    for (let y = 4; y <= 8; y++) {
      for (let z = 1; z <= 3; z++) {
        v.push([0, y, z, 'W']); v.push([1, y, z, 'W']);
      }
    }
    // 레버
    v.push([0, 2, 3, 'W']); v.push([0, 1, 3, 'W']); v.push([0, 0, 3, 'W']);
    return v;
  })(),
  
  // 투석구
  sling: (() => {
    const v: VoxelData = [];
    // 끈
    for (let y = 0; y <= 6; y++) {
      v.push([0, y, 0, 'L']);
    }
    // 주머니
    v.push([0, 7, 0, 'L']); v.push([1, 7, 0, 'L']); v.push([-1, 7, 0, 'L']);
    v.push([0, 7, 1, 'L']);
    // 돌
    v.push([0, 8, 0, 'G']);
    return v;
  })(),
  
  // 취관 (대나무 관)
  blowgun: (() => {
    const v: VoxelData = [];
    for (let y = 0; y <= 16; y++) {
      v.push([0, y, 0, 'R']);
    }
    return v;
  })(),
  
  // 곡도 (시미터)
  scimitar: (() => {
    const v: VoxelData = [];
    // 자루
    for (let y = 0; y <= 3; y++) {
      v.push([0, y, 0, 'W']);
    }
    // 휜 칼날
    const curve = [[0, 4], [0, 5], [0, 6], [0, 7], [1, 8], [1, 9], [2, 10], [2, 11], [3, 12]];
    curve.forEach(([x, y]) => v.push([x, y, 0, 'M']));
    return v;
  })(),
  
  // 뼈 창
  bone_spear: (() => {
    const v: VoxelData = [];
    // 나무 자루
    for (let y = 0; y <= 14; y++) {
      v.push([0, y, 0, 'W']);
    }
    // 뼈 촉
    for (let y = 15; y <= 20; y++) {
      v.push([0, y, 0, 'I']);
    }
    return v;
  })(),
  
  // 단궁 (짧은 활)
  bow: (() => {
    const v: VoxelData = [];
    // 활 몸체
    for (let y = 0; y <= 8; y++) {
      v.push([0, y, 0, 'W']);
    }
    // 시위
    for (let y = 0; y <= 8; y++) {
      v.push([-2, y, 0, 'T']);
    }
    return v;
  })(),
  
  // 투창 (javelin)
  javelin: (() => {
    const v: VoxelData = [];
    // 자루
    for (let y = 0; y <= 14; y++) {
      v.push([0, y, 0, 'W']);
    }
    // 창촉
    v.push([0, 15, 0, 'M']); v.push([0, 16, 0, 'M']);
    v.push([1, 15, 0, 'M']); v.push([-1, 15, 0, 'M']);
    return v;
  })(),
  
  // 도끼
  axe: (() => {
    const v: VoxelData = [];
    // 자루
    for (let y = 0; y <= 12; y++) {
      v.push([0, y, 0, 'W']);
    }
    // 도끼 머리
    for (let y = 9; y <= 12; y++) {
      v.push([1, y, 0, 'M']); v.push([2, y, 0, 'M']);
      v.push([3, y, 0, 'M']);
    }
    v.push([4, 10, 0, 'M']); v.push([4, 11, 0, 'M']);
    return v;
  })(),
  
  // 철퇴 (mace)
  mace: (() => {
    const v: VoxelData = [];
    // 자루
    for (let y = 0; y <= 10; y++) {
      v.push([0, y, 0, 'W']);
    }
    // 철퇴 머리
    for (let y = 11; y <= 15; y++) {
      for (let x = -1; x <= 1; x++) {
        for (let z = -1; z <= 1; z++) {
          v.push([x, y, z, 'M']);
        }
      }
    }
    // 스파이크
    v.push([2, 13, 0, 'M']); v.push([-2, 13, 0, 'M']);
    v.push([0, 13, 2, 'M']); v.push([0, 13, -2, 'M']);
    v.push([0, 16, 0, 'M']);
    return v;
  })(),
  
  // 쌍검 (dual_swords)
  dual_swords: (() => {
    const v: VoxelData = [];
    // 왼쪽 검
    for (let y = 0; y <= 3; y++) { v.push([0, y, 0, 'W']); }
    for (let y = 4; y <= 12; y++) { v.push([0, y, 0, 'M']); }
    // 오른쪽 검
    for (let y = 0; y <= 3; y++) { v.push([3, y, 0, 'W']); }
    for (let y = 4; y <= 12; y++) { v.push([3, y, 0, 'M']); }
    return v;
  })(),
  
  // 죽창 (bamboo_spear)
  bamboo_spear: (() => {
    const v: VoxelData = [];
    // 대나무 자루
    for (let y = 0; y <= 22; y++) {
      v.push([0, y, 0, 'R']);
    }
    // 깎은 끝
    v.push([0, 23, 0, 'R']); v.push([0, 24, 0, 'R']);
    return v;
  })(),
  
  // 장창 (pike)
  pike: (() => {
    const v: VoxelData = [];
    // 매우 긴 자루
    for (let y = 0; y <= 36; y++) {
      v.push([0, y, 0, 'W']);
      v.push([1, y, 0, 'W']);
    }
    // 창날
    for (let y = 37; y <= 44; y++) {
      v.push([0, y, 0, 'M']); v.push([1, y, 0, 'M']);
    }
    return v;
  })(),
  
  // 강쇠뇌 (heavy_crossbow)
  heavy_crossbow: (() => {
    const v: VoxelData = [];
    // 총신 (더 두꺼움)
    for (let y = 0; y <= 10; y++) {
      v.push([0, y, 0, 'W']); v.push([1, y, 0, 'W']);
      v.push([0, y, 1, 'W']); v.push([1, y, 1, 'W']);
    }
    // 큰 활대
    for (let x = -6; x <= 7; x++) {
      v.push([x, 9, 0, 'W']); v.push([x, 9, 1, 'W']);
    }
    // 시위
    for (let x = -6; x <= 7; x++) {
      v.push([x, 8, 0, 'T']);
    }
    // 노기 (방아쇠)
    v.push([0, 4, 2, 'X']); v.push([1, 4, 2, 'X']);
    v.push([0, 3, 2, 'X']); v.push([1, 3, 2, 'X']);
    return v;
  })(),
  
  // 몽둥이 (club)
  club: (() => {
    const v: VoxelData = [];
    // 자루
    for (let y = 0; y <= 8; y++) {
      v.push([0, y, 0, 'W']);
    }
    // 두꺼운 머리
    for (let y = 9; y <= 16; y++) {
      const width = y <= 12 ? 1 : (y >= 14 ? 2 : 1);
      for (let x = -width; x <= width; x++) {
        for (let z = -width; z <= width; z++) {
          v.push([x, y, z, 'W']);
        }
      }
    }
    return v;
  })(),
  
  // 투척 도끼 (throwing_axe)
  throwing_axe: (() => {
    const v: VoxelData = [];
    // 자루
    for (let y = 0; y <= 6; y++) {
      v.push([0, y, 0, 'W']);
    }
    // 작은 도끼 머리
    v.push([1, 5, 0, 'M']); v.push([2, 5, 0, 'M']);
    v.push([1, 6, 0, 'M']); v.push([2, 6, 0, 'M']);
    v.push([1, 7, 0, 'M']); v.push([2, 7, 0, 'M']);
    return v;
  })(),
  
  // 저격용 장궁 (sniper_bow)
  sniper_bow: (() => {
    const v: VoxelData = [];
    // 긴 활 몸체
    for (let y = 0; y <= 14; y++) {
      v.push([0, y, 0, 'W']);
    }
    // 리커브
    v.push([-1, 0, 0, 'W']); v.push([-2, -1, 0, 'W']);
    v.push([-1, 14, 0, 'W']); v.push([-2, 15, 0, 'W']);
    // 시위
    for (let y = -1; y <= 15; y++) {
      v.push([-3, y, 0, 'T']);
    }
    return v;
  })(),
  
  // 기름 항아리 (oil_jar)
  oil_jar: (() => {
    const v: VoxelData = [];
    // 항아리 몸체
    for (let y = 0; y <= 5; y++) {
      const width = y <= 1 || y >= 4 ? 1 : 2;
      for (let x = -width; x <= width; x++) {
        for (let z = -width; z <= width; z++) {
          v.push([x, y, z, 'L']);
        }
      }
    }
    // 입구
    v.push([0, 6, 0, 'L']);
    return v;
  })(),
  
  // 지팡이 (staff)
  staff: (() => {
    const v: VoxelData = [];
    for (let y = 0; y <= 20; y++) {
      v.push([0, y, 0, 'W']);
    }
    // 장식
    v.push([0, 21, 0, 'X']); v.push([0, 22, 0, 'X']);
    v.push([-1, 21, 0, 'X']); v.push([1, 21, 0, 'X']);
    return v;
  })(),
  
  // 경전 (scripture)
  scripture: (() => {
    const v: VoxelData = [];
    // 책
    for (let y = 0; y <= 4; y++) {
      for (let x = -2; x <= 2; x++) {
        v.push([x, y, 0, 'W']);
        v.push([x, y, 1, 'W']);
      }
    }
    // 표지
    v.push([-2, 0, 2, 'C']); v.push([-2, 4, 2, 'C']);
    v.push([2, 0, 2, 'C']); v.push([2, 4, 2, 'C']);
    return v;
  })(),
  
  // 삼지창 (trident)
  trident: (() => {
    const v: VoxelData = [];
    // 자루
    for (let y = 0; y <= 20; y++) {
      v.push([0, y, 0, 'W']);
    }
    // 세 갈래 창날
    for (let y = 21; y <= 26; y++) {
      v.push([0, y, 0, 'M']);
    }
    for (let y = 21; y <= 24; y++) {
      v.push([-2, y, 0, 'M']);
      v.push([2, y, 0, 'M']);
    }
    return v;
  })(),
  
  // 화창 (fire_lance)
  fire_lance: (() => {
    const v: VoxelData = [];
    // 자루
    for (let y = 0; y <= 18; y++) {
      v.push([0, y, 0, 'W']);
    }
    // 창날
    v.push([0, 19, 0, 'M']); v.push([0, 20, 0, 'M']);
    // 화염통
    v.push([1, 16, 0, 'X']); v.push([1, 17, 0, 'X']);
    v.push([-1, 16, 0, 'X']); v.push([-1, 17, 0, 'X']);
    // 화염
    v.push([2, 17, 0, 'F']); v.push([-2, 17, 0, 'F']);
    v.push([2, 18, 0, 'O']); v.push([-2, 18, 0, 'O']);
    return v;
  })(),
};

// ===== 상세 갑옷 데이터 =====
const VOXEL_ARMOR_DETAILED: Record<string, VoxelData> = {
  // 양당개 (조끼형 찰갑) - 붉은 옻칠
  liang_dang: (() => {
    const v: VoxelData = [];
    // 가슴/등 보호대
    for (let y = 10; y <= 16; y++) {
      for (let x = 5; x <= 10; x++) {
        v.push([x, y, 5, 'A']); // 앞판
        v.push([x, y, 10, 'A']); // 뒷판
      }
    }
    // 어깨 끈
    v.push([5, 16, 6, 'S']); v.push([10, 16, 6, 'S']);
    v.push([5, 16, 9, 'S']); v.push([10, 16, 9, 'S']);
    return v;
  })(),
  
  // 전신 흑철 찰갑 (함진영)
  heavy_black: (() => {
    const v: VoxelData = [];
    // 가슴/등/옆구리 전체 보호
    for (let y = 8; y <= 18; y++) {
      for (let x = 4; x <= 11; x++) {
        for (let z = 5; z <= 10; z++) {
          const isEdge = x === 4 || x === 11 || z === 5 || z === 10;
          if (isEdge || y === 8 || y === 18) {
            v.push([x, y, z, 'A']);
          }
        }
      }
    }
    // 어깨 견갑
    for (let x = 2; x <= 4; x++) {
      v.push([x, 17, 7, 'A']); v.push([x, 17, 8, 'A']);
    }
    for (let x = 11; x <= 13; x++) {
      v.push([x, 17, 7, 'A']); v.push([x, 17, 8, 'A']);
    }
    return v;
  })(),
  
  // 가죽 갑옷 (경장)
  leather_light: (() => {
    const v: VoxelData = [];
    // 가슴만 보호
    for (let y = 11; y <= 15; y++) {
      for (let x = 6; x <= 9; x++) {
        v.push([x, y, 5, 'A']);
        v.push([x, y, 10, 'A']);
      }
    }
    return v;
  })(),
  
  // 등갑 (등나무 갑옷)
  rattan: (() => {
    const v: VoxelData = [];
    // 격자 무늬 패턴
    for (let y = 9; y <= 17; y++) {
      for (let x = 5; x <= 10; x++) {
        if ((x + y) % 2 === 0) {
          v.push([x, y, 5, 'A']);
          v.push([x, y, 10, 'A']);
        }
      }
    }
    return v;
  })(),
  
  // 판갑 (가야식)
  plate: (() => {
    const v: VoxelData = [];
    // 세로줄 무늬
    for (let y = 8; y <= 17; y++) {
      for (let x = 5; x <= 10; x++) {
        v.push([x, y, 5, 'A']);
        v.push([x, y, 10, 'A']);
        // 세로줄 강조
        if (x === 6 || x === 9) {
          v.push([x, y, 4, 'M']);
          v.push([x, y, 11, 'M']);
        }
      }
    }
    return v;
  })(),
  
  // 기본값 (갑옷 없음)
  standard: [],
  rag_poor: [],
};

// ===== 상세 방패 데이터 =====
const VOXEL_SHIELDS_DETAILED: Record<string, VoxelData> = {
  // 육각형 방패
  hex_shield: (() => {
    const v: VoxelData = [];
    // 방패 본체 (육각형)
    for (let y = 8; y <= 18; y++) {
      const width = y <= 10 ? y - 6 : (y >= 16 ? 20 - y : 4);
      for (let x = -width; x <= width; x++) {
        v.push([x, y, 0, 'W']);
        v.push([x, y, 1, 'W']);
      }
    }
    // 청동 엄브
    v.push([0, 13, 2, 'X']); v.push([1, 13, 2, 'X']);
    v.push([0, 14, 2, 'X']); v.push([1, 14, 2, 'X']);
    // 문양
    v.push([0, 15, 2, 'P']); v.push([0, 16, 2, 'P']);
    return v;
  })(),
  
  // 대형 탑 방패
  tower_shield: (() => {
    const v: VoxelData = [];
    // 방패 본체 (직사각형)
    for (let y = 4; y <= 20; y++) {
      for (let x = -3; x <= 3; x++) {
        v.push([x, y, 0, 'M']);
        v.push([x, y, 1, 'M']);
      }
    }
    // X자 보강
    for (let i = 0; i < 8; i++) {
      v.push([-3 + i, 6 + i, 2, 'M']);
      v.push([3 - i, 6 + i, 2, 'M']);
    }
    // V자 홈 (상단)
    v.push([0, 20, 0, 'B']);
    // 철제 엄브
    v.push([0, 12, 2, 'X']); v.push([1, 12, 2, 'X']);
    v.push([0, 13, 2, 'X']); v.push([1, 13, 2, 'X']);
    // 화살 박힌 흔적
    v.push([2, 16, 2, 'W']); v.push([2, 17, 2, 'W']);
    v.push([-2, 10, 2, 'W']); v.push([-2, 11, 2, 'W']);
    return v;
  })(),
  
  // 원형 방패
  round_shield: (() => {
    const v: VoxelData = [];
    // 원형 방패
    for (let y = 8; y <= 16; y++) {
      for (let x = -4; x <= 4; x++) {
        const dist = Math.sqrt(x ** 2 + (y - 12) ** 2);
        if (dist <= 4.5) {
          v.push([x, y, 0, 'P']);
          v.push([x, y, 1, 'P']);
        }
      }
    }
    // 엄브
    v.push([0, 12, 2, 'X']);
    return v;
  })(),
  
  // 파비스 (등에 메는 대형 방패)
  pavise: (() => {
    const v: VoxelData = [];
    // 방패 본체
    for (let y = 4; y <= 22; y++) {
      const width = y <= 6 ? y - 2 : (y >= 20 ? 24 - y : 4);
      for (let x = -width; x <= width; x++) {
        v.push([x, y, 0, 'W']);
        v.push([x, y, 1, 'W']);
      }
    }
    // 화살 박힌 흔적
    v.push([2, 12, 2, 'W']); v.push([2, 13, 2, 'W']);
    v.push([-1, 18, 2, 'W']); v.push([-1, 19, 2, 'W']);
    // 화염 그을음
    v.push([0, 8, 1, 'B']); v.push([1, 8, 1, 'B']); v.push([0, 9, 1, 'B']);
    return v;
  })(),
  
  // 화살통
  quiver: (() => {
    const v: VoxelData = [];
    // 통 본체
    for (let y = 0; y <= 8; y++) {
      v.push([0, y, 0, 'L']); v.push([1, y, 0, 'L']);
      v.push([0, y, 1, 'L']); v.push([1, y, 1, 'L']);
    }
    // 화살 깃
    for (let i = 0; i < 6; i++) {
      v.push([i % 2, 9 + i, i % 2, 'W']);
    }
    return v;
  })(),
};

// ===== 기병용 앉은 자세 인체 (파츠별 분리) =====
// 기본 인체와 같은 좌표계 사용 (-Z 방향을 봄)
// Y축 -90도 회전 적용하여 +X 방향을 보게 함
// 다리는 ±X 방향(좌우)으로 벌림 → 회전 후 ±Z (말의 양옆)

// 파츠별 피벗 포인트 (앉은 자세용)
export const SEATED_PART_PIVOTS = {
  head: { x: 7.5, y: 15, z: 7.5 },      // 목 기준
  torso: { x: 7.5, y: 9, z: 7.5 },      // 허리 기준
  rightArm: { x: 10, y: 13, z: 7.5 },   // 오른쪽 어깨 기준
  leftArm: { x: 5, y: 13, z: 7.5 },     // 왼쪽 어깨 기준
  rightLeg: { x: 9.5, y: 7, z: 7.5 },   // 오른쪽 골반 기준
  leftLeg: { x: 4.5, y: 7, z: 7.5 },    // 왼쪽 골반 기준
};

function generateSeatedHeadPart(): VoxelData {
  const voxels: VoxelData = [];
  
  // 머리 (y=16~20)
  for (let y = 16; y <= 20; y++) {
    for (let x = 6; x <= 9; x++) {
      for (let z = 6; z <= 9; z++) {
        const isCorner = (x === 6 || x === 9) && (z === 6 || z === 9);
        if (!isCorner || y < 20) {
          const color = z === 6 ? 'K' : (z === 9 || y === 20 ? 'H' : 'K');
          voxels.push([x, y, z, color]);
        }
      }
    }
  }
  
  // 목 (y=15)
  for (let x = 7; x <= 8; x++) {
    for (let z = 7; z <= 8; z++) {
      voxels.push([x, 15, z, 'K']);
    }
  }
  
  return voxels;
}

function generateSeatedTorsoPart(): VoxelData {
  const voxels: VoxelData = [];
  
  // 상체/어깨 (y=11~14) - 팔 제외한 중앙 부분
  for (let y = 11; y <= 14; y++) {
    for (let x = 6; x <= 9; x++) {
      for (let z = 6; z <= 9; z++) {
        voxels.push([x, y, z, 'P']);
      }
    }
  }
  
  // 허리 (y=9~10)
  for (let y = 9; y <= 10; y++) {
    for (let x = 6; x <= 9; x++) {
      for (let z = 6; z <= 9; z++) {
        voxels.push([x, y, z, 'S']);
      }
    }
  }
  
  // 엉덩이 (y=7~8)
  for (let y = 7; y <= 8; y++) {
    for (let x = 6; x <= 9; x++) {
      for (let z = 6; z <= 9; z++) {
        voxels.push([x, y, z, 'S']);
      }
    }
  }
  
  return voxels;
}

function generateSeatedRightArmPart(): VoxelData {
  const voxels: VoxelData = [];
  
  // 어깨 (y=11~14)
  for (let y = 11; y <= 14; y++) {
    voxels.push([10, y, 6, 'P']); voxels.push([10, y, 7, 'P']);
    voxels.push([10, y, 8, 'P']); voxels.push([10, y, 9, 'P']);
  }
  
  // 오른팔 (고삐 잡는 자세)
  for (let y = 12; y <= 14; y++) {
    voxels.push([11, y, 7, 'K']); voxels.push([11, y, 8, 'K']);
  }
  // 손 앞으로
  voxels.push([11, 11, 6, 'K']); voxels.push([11, 11, 5, 'K']);
  
  return voxels;
}

function generateSeatedLeftArmPart(): VoxelData {
  const voxels: VoxelData = [];
  
  // 어깨 (y=11~14)
  for (let y = 11; y <= 14; y++) {
    voxels.push([5, y, 6, 'P']); voxels.push([5, y, 7, 'P']);
    voxels.push([5, y, 8, 'P']); voxels.push([5, y, 9, 'P']);
  }
  
  // 왼팔 (고삐 잡는 자세)
  for (let y = 12; y <= 14; y++) {
    voxels.push([4, y, 7, 'K']); voxels.push([4, y, 8, 'K']);
  }
  // 손 앞으로
  voxels.push([4, 11, 6, 'K']); voxels.push([4, 11, 5, 'K']);
  
  return voxels;
}

function generateSeatedRightLegPart(): VoxelData {
  const voxels: VoxelData = [];
  
  // 오른쪽 허벅지 (옆으로 뻗음)
  for (let x = 9; x <= 10; x++) {
    voxels.push([x, 7, 7, 'P']); voxels.push([x, 7, 8, 'P']);
    voxels.push([x, 6, 7, 'P']); voxels.push([x, 6, 8, 'P']);
  }
  // 정강이 (아래로)
  for (let y = 1; y <= 5; y++) {
    voxels.push([9, y, 7, 'P']); voxels.push([9, y, 8, 'P']);
  }
  
  return voxels;
}

function generateSeatedLeftLegPart(): VoxelData {
  const voxels: VoxelData = [];
  
  // 왼쪽 허벅지 (옆으로 뻗음)
  for (let x = 4; x <= 5; x++) {
    voxels.push([x, 7, 7, 'P']); voxels.push([x, 7, 8, 'P']);
    voxels.push([x, 6, 7, 'P']); voxels.push([x, 6, 8, 'P']);
  }
  // 정강이 (아래로)
  for (let y = 1; y <= 5; y++) {
    voxels.push([4, y, 7, 'P']); voxels.push([4, y, 8, 'P']);
  }
  
  return voxels;
}

// 파츠별 앉은 자세 인체 데이터 생성
function generateSeatedBodyParts(): HumanBodyParts {
  return {
    head: generateSeatedHeadPart(),
    torso: generateSeatedTorsoPart(),
    rightArm: generateSeatedRightArmPart(),
    leftArm: generateSeatedLeftArmPart(),
    rightLeg: generateSeatedRightLegPart(),
    leftLeg: generateSeatedLeftLegPart(),
  };
}

// 기존 호환용: 모든 파츠를 합친 전체 앉은 자세 인체 데이터
function generateSeatedHuman(): VoxelData {
  const parts = generateSeatedBodyParts();
  return [
    ...parts.head,
    ...parts.torso,
    ...parts.rightArm,
    ...parts.leftArm,
    ...parts.rightLeg,
    ...parts.leftLeg,
  ];
}

export const VOXEL_SEATED_PARTS = generateSeatedBodyParts();
const VOXEL_HUMAN_SEATED = generateSeatedHuman();

// 기병용 인체 색상 키 변환 (말과 색상 충돌 방지)
function mapCavalryRiderColorKey(colorKey: string): string {
  switch (colorKey) {
    case 'K': // 피부
      return 'R1'; // Rider primary (skin)
    case 'P': // 상체/다리 기본
    case 'S': // 장식/보조색
      return 'R2'; // Rider secondary (armor/robe)
    default:
      return colorKey; // 신발/가죽 등은 기존 키 유지
  }
}

// ===== 유닛 하드포인트 시스템 =====
// 월드 좌표 기반 하드포인트 (실제 렌더링 좌표)

interface WorldHardpointSet {
  head: { x: number; y: number; z: number };      // 투구 부착 (월드 좌표)
  torso: { x: number; y: number; z: number };     // 갑옷 부착
  rightHand: { x: number; y: number; z: number }; // 주무기 부착
  leftHand: { x: number; y: number; z: number };  // 방패/보조무기 부착
  back: { x: number; y: number; z: number };      // 화살통/등짐 부착
}

// 도보 유닛 하드포인트 (월드 좌표 - 기존 작동 좌표 기반)
const INFANTRY_HARDPOINTS: WorldHardpointSet = {
  head: { x: 0, y: 0.38, z: 0 },        // 투구 위치
  torso: { x: 0, y: 0.22, z: 0 },       // 갑옷 위치
  rightHand: { x: 0.28, y: 0.28, z: 0.04 },  // 무기 위치
  leftHand: { x: -0.08, y: 0.22, z: 0.05 },  // 방패 위치
  back: { x: 0.1, y: 0.25, z: 0.15 },   // 화살통/등짐 위치
};

// 기병용 하드포인트 (복셀 좌표 - 회전 변환 필요)
// VOXEL_HUMAN_SEATED 기준: 16x22x16 그리드, 중심 (7.5, 10, 7.5)
interface CavalryHardpointSet {
  head: { x: number; y: number; z: number };
  torso: { x: number; y: number; z: number };
  rightHand: { x: number; y: number; z: number };
  leftHand: { x: number; y: number; z: number };
  back: { x: number; y: number; z: number };
}

const CAVALRY_HARDPOINTS_VOXEL: CavalryHardpointSet = {
  head: { x: 7.5, y: 18, z: 7.5 },     // 머리 중심
  torso: { x: 7.5, y: 12, z: 7.5 },    // 상체 중심
  rightHand: { x: 11, y: 11, z: 5 },   // 오른손
  leftHand: { x: 4, y: 11, z: 5 },     // 왼손
  back: { x: 7.5, y: 12, z: 9 },       // 등
};

// 기병 하드포인트를 월드 좌표로 변환 (Y축 회전 적용)
function getCavalryHardpointWorld(
  hardpoint: { x: number; y: number; z: number },
  humanPosition: { x: number; y: number; z: number },
  voxelSize: number,
  scale: number,
  rotation: number
): { x: number; y: number; z: number } {
  // VOXEL_HUMAN_SEATED 중심
  const centerX = 7.5;
  const centerY = 10;
  const centerZ = 7.5;
  
  // 중심 기준 상대 좌표
  const relX = hardpoint.x - centerX;
  const relY = hardpoint.y - centerY;
  const relZ = hardpoint.z - centerZ;
  
  // Y축 회전 적용
  const cos = Math.cos(rotation);
  const sin = Math.sin(rotation);
  const rotX = relX * cos + relZ * sin;
  const rotY = relY;
  const rotZ = -relX * sin + relZ * cos;
  
  // 스케일 및 복셀 크기 적용
  return {
    x: humanPosition.x + rotX * voxelSize * scale,
    y: humanPosition.y + rotY * voxelSize * scale,
    z: humanPosition.z + rotZ * voxelSize * scale,
  };
}

// ===== 탈것 하드포인트 =====
// 각 탈것의 기수 탑승 위치 (복셀 좌표)
interface MountHardpoints {
  saddle: { x: number; y: number; z: number };  // 기수 앉는 위치
  scale?: number;  // 기수 스케일
  rotation?: number;  // 기수 Y축 회전 (라디안)
}

const MOUNT_HARDPOINTS: Record<string, MountHardpoints> = {
  // 일반 말
  horse: {
    saddle: { x: 6, y: 10, z: 5.5 },
    scale: 0.65,
    rotation: -Math.PI / 2,
  },
  // 정찰 말 (가벼움)
  scout_horse: {
    saddle: { x: 6, y: 9.5, z: 5.5 },
    scale: 0.6,
    rotation: -Math.PI / 2,
  },
  // 중장 말
  armored_horse: {
    saddle: { x: 6, y: 10.5, z: 5.5 },
    scale: 0.65,
    rotation: -Math.PI / 2,
  },
  // 낙타 (혹 사이)
  camel: {
    saddle: { x: 8, y: 14, z: 6 },
    scale: 0.6,
    rotation: -Math.PI / 2,
  },
  // 늑대
  dire_wolf: {
    saddle: { x: 6, y: 8, z: 5 },
    scale: 0.55,
    rotation: -Math.PI / 2,
  },
  // 호랑이
  tiger: {
    saddle: { x: 6, y: 7, z: 5 },
    scale: 0.55,
    rotation: -Math.PI / 2,
  },
  // 코끼리
  elephant: {
    saddle: { x: 8, y: 16, z: 8 },
    scale: 0.6,
    rotation: -Math.PI / 2,
  },
  // 전쟁 코끼리 (망루)
  tower_elephant: {
    saddle: { x: 8, y: 22, z: 8 },
    scale: 0.55,
    rotation: -Math.PI / 2,
  },
  // 전차 (서있음)
  war_chariot: {
    saddle: { x: 6, y: 6, z: 5 },
    scale: 0.75,
    // 전차도 말과 같은 +X 방향을 보도록 회전만 맞춘다 (자세는 서있는 상태 유지)
    rotation: -Math.PI / 2,
  },
  // 배
  boat: {
    // 수군은 갑판 중앙 기준으로 몸통의 절반 정도 왼쪽으로 치우치게 배치
    // → Z축을 2복셀 정도 음수 방향으로 이동
    saddle: { x: 8, y: 5, z: 4 },
    scale: 0.75,
    rotation: -Math.PI / 2,
  },
};

// 탈것 하드포인트를 월드 좌표로 변환
function getMountSaddlePosition(
  mountType: string,
  mountPosition: { x: number; y: number; z: number },
  voxelSize: number
): { position: { x: number; y: number; z: number }; scale: number; rotation: number } {
  const hp = MOUNT_HARDPOINTS[mountType] || MOUNT_HARDPOINTS.horse;
  
  return {
    position: {
      x: mountPosition.x + hp.saddle.x * voxelSize,
      y: mountPosition.y + hp.saddle.y * voxelSize,
      z: mountPosition.z + hp.saddle.z * voxelSize,
    },
    scale: hp.scale || 0.65,
    rotation: hp.rotation ?? -Math.PI / 2,
  };
}

// 서있는 유닛용 탈것 발판 하드포인트 (발이 닿는 위치, 복셀 좌표)
const STANDING_MOUNT_HARDPOINTS: Record<string, { x: number; y: number; z: number }> = {
  // 전차: 차체 바닥( y=4 ) 중앙 근처
  war_chariot: { x: 3, y: 4, z: 5 },
  // 배: 갑판( y=5 ) 중앙
  boat: { x: 0, y: 5, z: 0 },
  // 코끼리: 등 중앙 근처 (몸통 y=4~12)
  elephant: { x: 8, y: 12, z: 6 },
  // 전쟁 코끼리(망루): 망루 바닥( y≈13 ) 중앙
  tower_elephant: { x: 8, y: 13, z: 6 },
};

function getStandingMountPosition(
  mountType: string,
  mountPosition: { x: number; y: number; z: number },
  voxelSize: number
): { x: number; y: number; z: number } {
  const hp = STANDING_MOUNT_HARDPOINTS[mountType];
  if (!hp) {
    // 정의가 없으면 탈것 원점 위에 세우되 살짝 올려서 박히지 않게 함
    return {
      x: mountPosition.x,
      y: mountPosition.y + 0.08,
      z: mountPosition.z,
    };
  }
  return {
    x: mountPosition.x + hp.x * voxelSize,
    y: mountPosition.y + hp.y * voxelSize,
    z: mountPosition.z + hp.z * voxelSize,
  };
}

// 기병용 하드포인트 → 통합 복셀 좌표계 월드 좌표 변환
// (VOXEL_HUMAN_SEATED를 말 위에 회전/이동시킨 것과 동일한 변환을 적용)
function cavalryPointToWorld(
  point: { x: number; y: number; z: number },
  saddle: { x: number; y: number; z: number },
  voxelSize: number
): { x: number; y: number; z: number } {
  const centerX = 7.5;
  const centerY = 10;
  const centerZ = 7.5;
  const hipY = 7.5;
  const down = 2; // 엉덩이를 안장 안으로 조금 넣기

  // 중심 기준 상대 좌표
  const relX = point.x - centerX;
  const relZ = point.z - centerZ;

  // Y축 -90도 회전 (인체가 +X 방향을 보도록)
  const rotatedX = -relZ;
  const rotatedZ = relX;

  // 말 안장 좌표로 이동 + Y축 오프셋
  const offsetY = saddle.y - hipY - down;

  const worldX = (rotatedX + saddle.x) * voxelSize;
  const worldY = (point.y + offsetY) * voxelSize;
  const worldZ = (rotatedZ + saddle.z) * voxelSize;

  return { x: worldX, y: worldY, z: worldZ };
}

// ===== 말 파츠별 분리 =====
export interface HorseBodyParts {
  body: VoxelData;        // 몸통 + 안장
  head: VoxelData;        // 머리 + 목 + 귀 + 갈기
  tail: VoxelData;        // 꼬리
  frontLeftLeg: VoxelData;   // 앞왼쪽 다리
  frontRightLeg: VoxelData;  // 앞오른쪽 다리
  backLeftLeg: VoxelData;    // 뒤왼쪽 다리
  backRightLeg: VoxelData;   // 뒤오른쪽 다리
}

// 말 파츠별 피벗 포인트
export const HORSE_PART_PIVOTS = {
  body: { x: 6, y: 6, z: 5.5 },           // 몸통 중심
  head: { x: 13, y: 7, z: 5.5 },          // 목 시작점 (어깨)
  tail: { x: 0, y: 6, z: 5.5 },           // 꼬리 시작점 (엉덩이)
  frontLeftLeg: { x: 1.5, y: 4, z: 4 },   // 앞왼쪽 어깨
  frontRightLeg: { x: 1.5, y: 4, z: 7 },  // 앞오른쪽 어깨
  backLeftLeg: { x: 10.5, y: 4, z: 4 },   // 뒤왼쪽 골반
  backRightLeg: { x: 10.5, y: 4, z: 7 },  // 뒤오른쪽 골반
};

function generateHorseBodyPart(color: string, withArmor: boolean): VoxelData {
  const v: VoxelData = [];
  const c = withArmor ? 'M' : color;
  
  // 몸통 (가로로 긴 타원)
  for (let y = 4; y <= 8; y++) {
    for (let x = 0; x <= 12; x++) {
      for (let z = 3; z <= 8; z++) {
        const isEdge = (z === 3 || z === 8) && (x <= 1 || x >= 11);
        if (!isEdge) {
          v.push([x, y, z, c]);
        }
      }
    }
  }
  
  // 안장
  for (let x = 4; x <= 8; x++) {
    v.push([x, 9, 5, 'P']); v.push([x, 9, 6, 'P']);
  }
  // 안장 앞뒤 높임 (교량)
  v.push([4, 10, 5, 'P']); v.push([4, 10, 6, 'P']);
  v.push([8, 10, 5, 'P']); v.push([8, 10, 6, 'P']);
  
  // 마갑 (중장) - 몸통 부분만
  if (withArmor) {
    // 당흉 (가슴)
    for (let z = 3; z <= 8; z++) {
      v.push([12, 6, z, 'M']); v.push([12, 7, z, 'M']);
    }
    // 찰편 스커트
    for (let x = 0; x <= 12; x += 3) {
      v.push([x, 3, 2, 'M']); v.push([x, 2, 2, 'M']);
      v.push([x, 3, 9, 'M']); v.push([x, 2, 9, 'M']);
    }
  }
  
  return v;
}

function generateHorseHeadPart(color: string, withArmor: boolean): VoxelData {
  const v: VoxelData = [];
  const c = withArmor ? 'M' : color;
  
  // 목
  for (let y = 7; y <= 12; y++) {
    const xOffset = y - 7;
    v.push([13 + xOffset, y, 5, c]); v.push([13 + xOffset, y, 6, c]);
    v.push([14 + xOffset, y, 5, c]); v.push([14 + xOffset, y, 6, c]);
  }
  
  // 머리
  for (let y = 11; y <= 14; y++) {
    v.push([18, y, 5, c]); v.push([18, y, 6, c]);
    v.push([19, y, 5, c]); v.push([19, y, 6, c]);
  }
  // 코/주둥이
  v.push([20, 12, 5, c]); v.push([20, 12, 6, c]);
  v.push([20, 11, 5, c]); v.push([20, 11, 6, c]);
  
  // 귀
  v.push([18, 15, 4, c]); v.push([18, 15, 7, c]);
  
  // 갈기
  for (let x = 13; x <= 18; x++) {
    v.push([x, 13, 5, 'D']); v.push([x, 14, 5, 'D']);
  }
  
  // 마갑 (중장) - 머리/목 부분
  if (withArmor) {
    // 면갑
    v.push([19, 13, 4, 'M']); v.push([19, 13, 7, 'M']);
    v.push([19, 12, 4, 'M']); v.push([19, 12, 7, 'M']);
    // 계갑 (목)
    for (let y = 8; y <= 11; y++) {
      v.push([15, y, 4, 'M']); v.push([15, y, 7, 'M']);
    }
  }
  
  return v;
}

function generateHorseTailPart(): VoxelData {
  const v: VoxelData = [];
  for (let y = 5; y <= 8; y++) {
    v.push([-1, y, 5, 'D']); v.push([-1, y, 6, 'D']);
  }
  v.push([-2, 5, 5, 'D']); v.push([-2, 4, 5, 'D']);
  return v;
}

function generateHorseLegPart(color: string, startX: number, z: number): VoxelData {
  const v: VoxelData = [];
  for (let y = 0; y <= 3; y++) {
    v.push([startX, y, z, color]);
    v.push([startX + 1, y, z, color]);
  }
  // 발굽
  v.push([startX, 0, z, 'B']);
  return v;
}

function generateHorseBodyParts(color: string = 'H', withArmor: boolean = false): HorseBodyParts {
  const c = withArmor ? 'M' : color;
  return {
    body: generateHorseBodyPart(color, withArmor),
    head: generateHorseHeadPart(color, withArmor),
    tail: generateHorseTailPart(),
    frontLeftLeg: generateHorseLegPart(c, 1, 4),
    frontRightLeg: generateHorseLegPart(c, 1, 7),
    backLeftLeg: generateHorseLegPart(c, 10, 4),
    backRightLeg: generateHorseLegPart(c, 10, 7),
  };
}

// ===== 상세 말 데이터 (기존 호환용) =====
function generateDetailedHorse(color: string = 'H', withArmor: boolean = false): VoxelData {
  const parts = generateHorseBodyParts(color, withArmor);
  return [
    ...parts.body,
    ...parts.head,
    ...parts.tail,
    ...parts.frontLeftLeg,
    ...parts.frontRightLeg,
    ...parts.backLeftLeg,
    ...parts.backRightLeg,
  ];
}

// ===== 정찰마 (가벼운 말) =====
function generateScoutHorse(): VoxelData {
  const v: VoxelData = [];
  const c = 'H';
  
  // 날씬한 몸통
  for (let y = 4; y <= 7; y++) {
    for (let x = 1; x <= 10; x++) {
      for (let z = 4; z <= 7; z++) {
        v.push([x, y, z, c]);
      }
    }
  }
  
  // 안장 (최소화)
  v.push([4, 8, 5, 'P']); v.push([5, 8, 5, 'P']); v.push([6, 8, 5, 'P']);
  v.push([4, 8, 6, 'P']); v.push([5, 8, 6, 'P']); v.push([6, 8, 6, 'P']);
  
  // 목 (가늘고 김)
  for (let y = 6; y <= 11; y++) {
    v.push([11 + Math.floor((y - 6) / 2), y, 5, c]);
    v.push([11 + Math.floor((y - 6) / 2), y, 6, c]);
  }
  
  // 머리
  v.push([14, 10, 5, c]); v.push([14, 10, 6, c]);
  v.push([14, 11, 5, c]); v.push([14, 11, 6, c]);
  v.push([15, 10, 5, c]); v.push([15, 10, 6, c]);
  
  // 다리 (가늘게)
  for (let y = 0; y <= 3; y++) {
    v.push([2, y, 5, c]); v.push([9, y, 5, c]);
    v.push([2, y, 6, c]); v.push([9, y, 6, c]);
  }
  
  // 꼬리
  v.push([0, 5, 5, 'D']); v.push([0, 6, 5, 'D']); v.push([-1, 4, 5, 'D']);
  
  return v;
}

// ===== 호랑이 파츠별 분리 =====
export interface TigerBodyParts {
  body: VoxelData;
  head: VoxelData;
  tail: VoxelData;
  frontLeftLeg: VoxelData;
  frontRightLeg: VoxelData;
  backLeftLeg: VoxelData;
  backRightLeg: VoxelData;
}

export const TIGER_PART_PIVOTS = {
  body: { x: 5, y: 4.5, z: 5.5 },
  head: { x: 11, y: 5, z: 5.5 },
  tail: { x: 0, y: 5, z: 5.5 },
  frontLeftLeg: { x: 1.5, y: 3, z: 4 },
  frontRightLeg: { x: 1.5, y: 3, z: 7 },
  backLeftLeg: { x: 8.5, y: 3, z: 4 },
  backRightLeg: { x: 8.5, y: 3, z: 7 },
};

function generateTigerBodyParts(): TigerBodyParts {
  const c = 'O';
  
  // 몸통
  const body: VoxelData = [];
  for (let y = 3; y <= 6; y++) {
    for (let x = 0; x <= 10; x++) {
      for (let z = 3; z <= 8; z++) {
        body.push([x, y, z, c]);
      }
    }
  }
  // 줄무늬
  for (let x = 1; x <= 9; x += 2) {
    body.push([x, 6, 3, 'B']); body.push([x, 6, 8, 'B']);
    body.push([x, 5, 3, 'B']); body.push([x, 5, 8, 'B']);
  }
  
  // 머리 + 목
  const head: VoxelData = [];
  // 목
  for (let y = 5; y <= 8; y++) {
    head.push([11, y, 4, c]); head.push([11, y, 5, c]); head.push([11, y, 6, c]); head.push([11, y, 7, c]);
    head.push([12, y, 5, c]); head.push([12, y, 6, c]);
  }
  // 머리
  for (let y = 7; y <= 10; y++) {
    head.push([13, y, 4, c]); head.push([13, y, 5, c]); head.push([13, y, 6, c]); head.push([13, y, 7, c]);
    head.push([14, y, 5, c]); head.push([14, y, 6, c]);
  }
  // 귀
  head.push([13, 11, 4, c]); head.push([13, 11, 7, c]);
  // 눈
  head.push([14, 9, 4, 'Y']); head.push([14, 9, 7, 'Y']);
  // 코/입
  head.push([15, 8, 5, 'W']); head.push([15, 8, 6, 'W']);
  
  // 꼬리
  const tail: VoxelData = [];
  for (let x = -1; x >= -5; x--) {
    tail.push([x, 5 + Math.abs(x) / 2, 5, c]);
    tail.push([x, 5 + Math.abs(x) / 2, 6, c]);
  }
  
  // 앞왼쪽 다리
  const frontLeftLeg: VoxelData = [];
  for (let y = 0; y <= 2; y++) {
    frontLeftLeg.push([1, y, 4, c]); frontLeftLeg.push([2, y, 4, c]);
  }
  frontLeftLeg.push([1, 0, 3, 'W']); // 발톱
  
  // 앞오른쪽 다리
  const frontRightLeg: VoxelData = [];
  for (let y = 0; y <= 2; y++) {
    frontRightLeg.push([1, y, 7, c]); frontRightLeg.push([2, y, 7, c]);
  }
  frontRightLeg.push([1, 0, 8, 'W']); // 발톱
  
  // 뒤왼쪽 다리
  const backLeftLeg: VoxelData = [];
  for (let y = 0; y <= 2; y++) {
    backLeftLeg.push([8, y, 4, c]); backLeftLeg.push([9, y, 4, c]);
  }
  backLeftLeg.push([9, 0, 3, 'W']); // 발톱
  
  // 뒤오른쪽 다리
  const backRightLeg: VoxelData = [];
  for (let y = 0; y <= 2; y++) {
    backRightLeg.push([8, y, 7, c]); backRightLeg.push([9, y, 7, c]);
  }
  backRightLeg.push([9, 0, 8, 'W']); // 발톱
  
  return { body, head, tail, frontLeftLeg, frontRightLeg, backLeftLeg, backRightLeg };
}

// ===== 호랑이 (기존 호환용) =====
function generateDetailedTiger(): VoxelData {
  const parts = generateTigerBodyParts();
  return [
    ...parts.body,
    ...parts.head,
    ...parts.tail,
    ...parts.frontLeftLeg,
    ...parts.frontRightLeg,
    ...parts.backLeftLeg,
    ...parts.backRightLeg,
  ];
}

// ===== 코끼리 파츠별 분리 =====
export interface ElephantBodyParts {
  body: VoxelData;
  head: VoxelData;         // 머리 + 귀 + 코 + 상아
  tail: VoxelData;
  frontLeftLeg: VoxelData;
  frontRightLeg: VoxelData;
  backLeftLeg: VoxelData;
  backRightLeg: VoxelData;
}

export const ELEPHANT_PART_PIVOTS = {
  body: { x: 8, y: 8, z: 6 },
  head: { x: 17, y: 10, z: 6 },
  tail: { x: 0, y: 8, z: 6 },
  frontLeftLeg: { x: 3.5, y: 4, z: 5.5 },
  frontRightLeg: { x: 3.5, y: 4, z: 8.5 },
  backLeftLeg: { x: 13.5, y: 4, z: 5.5 },
  backRightLeg: { x: 13.5, y: 4, z: 8.5 },
};

function generateElephantBodyParts(): ElephantBodyParts {
  const c = 'G';
  
  // 몸통
  const body: VoxelData = [];
  for (let y = 4; y <= 12; y++) {
    for (let x = 0; x <= 16; x++) {
      for (let z = 2; z <= 10; z++) {
        const isEdge = (z <= 3 || z >= 9) && (x <= 2 || x >= 14);
        if (!isEdge) {
          body.push([x, y, z, c]);
        }
      }
    }
  }
  
  // 머리 + 귀 + 코 + 상아
  const head: VoxelData = [];
  for (let y = 10; y <= 16; y++) {
    for (let x = 17; x <= 22; x++) {
      for (let z = 4; z <= 8; z++) {
        head.push([x, y, z, c]);
      }
    }
  }
  // 귀
  for (let y = 12; y <= 16; y++) {
    head.push([18, y, 2, c]); head.push([18, y, 3, c]);
    head.push([18, y, 9, c]); head.push([18, y, 10, c]);
    head.push([19, y, 2, c]); head.push([19, y, 10, c]);
  }
  // 코
  for (let y = 6; y <= 12; y++) {
    head.push([23, y, 5, c]); head.push([23, y, 6, c]); head.push([23, y, 7, c]);
    head.push([24, y, 5, c]); head.push([24, y, 6, c]); head.push([24, y, 7, c]);
  }
  head.push([24, 5, 5, c]); head.push([24, 5, 6, c]); head.push([24, 5, 7, c]);
  head.push([24, 4, 6, c]);
  // 상아
  head.push([22, 10, 3, 'I']); head.push([23, 9, 3, 'I']); head.push([24, 8, 3, 'I']); head.push([25, 7, 3, 'M']);
  head.push([22, 10, 9, 'I']); head.push([23, 9, 9, 'I']); head.push([24, 8, 9, 'I']); head.push([25, 7, 9, 'M']);
  
  // 꼬리
  const tail: VoxelData = [];
  tail.push([-1, 8, 6, c]); tail.push([-2, 7, 6, c]); tail.push([-2, 6, 6, 'D']);
  
  // 앞왼쪽 다리
  const frontLeftLeg: VoxelData = [];
  for (let y = 0; y <= 3; y++) {
    for (let dx = 0; dx <= 2; dx++) {
      for (let dz = 0; dz <= 2; dz++) {
        frontLeftLeg.push([2 + dx, y, 4 + dz, c]);
      }
    }
  }
  
  // 앞오른쪽 다리
  const frontRightLeg: VoxelData = [];
  for (let y = 0; y <= 3; y++) {
    for (let dx = 0; dx <= 2; dx++) {
      for (let dz = 0; dz <= 2; dz++) {
        frontRightLeg.push([2 + dx, y, 7 + dz, c]);
      }
    }
  }
  
  // 뒤왼쪽 다리
  const backLeftLeg: VoxelData = [];
  for (let y = 0; y <= 3; y++) {
    for (let dx = 0; dx <= 2; dx++) {
      for (let dz = 0; dz <= 2; dz++) {
        backLeftLeg.push([12 + dx, y, 4 + dz, c]);
      }
    }
  }
  
  // 뒤오른쪽 다리
  const backRightLeg: VoxelData = [];
  for (let y = 0; y <= 3; y++) {
    for (let dx = 0; dx <= 2; dx++) {
      for (let dz = 0; dz <= 2; dz++) {
        backRightLeg.push([12 + dx, y, 7 + dz, c]);
      }
    }
  }
  
  return { body, head, tail, frontLeftLeg, frontRightLeg, backLeftLeg, backRightLeg };
}

// ===== 코끼리 (기존 호환용) =====
function generateDetailedElephant(): VoxelData {
  const parts = generateElephantBodyParts();
  return [
    ...parts.body,
    ...parts.head,
    ...parts.tail,
    ...parts.frontLeftLeg,
    ...parts.frontRightLeg,
    ...parts.backLeftLeg,
    ...parts.backRightLeg,
  ];
}

// ===== 전쟁 코끼리 (망루 포함) =====
function generateWarElephant(): VoxelData {
  const v = generateDetailedElephant();
  
  // 등 위 망루
  for (let y = 13; y <= 18; y++) {
    // 바닥
    if (y === 13) {
      for (let x = 4; x <= 12; x++) {
        for (let z = 3; z <= 9; z++) {
          v.push([x, y, z, 'W']);
        }
      }
    }
    // 난간
    for (let x = 4; x <= 12; x++) {
      v.push([x, y, 3, 'W']); v.push([x, y, 9, 'W']);
    }
    for (let z = 3; z <= 9; z++) {
      v.push([4, y, z, 'W']); v.push([12, y, z, 'W']);
    }
  }
  
  // 담요/장식
  for (let x = 2; x <= 14; x++) {
    v.push([x, 12, 2, 'C']); v.push([x, 12, 10, 'C']);
    v.push([x, 11, 1, 'C']); v.push([x, 11, 11, 'C']);
  }
  
  // 이마 갑옷
  for (let y = 14; y <= 16; y++) {
    v.push([20, y, 5, 'M']); v.push([20, y, 6, 'M']); v.push([20, y, 7, 'M']);
    v.push([21, y, 5, 'M']); v.push([21, y, 6, 'M']); v.push([21, y, 7, 'M']);
  }
  
  return v;
}

// ===== 전차 =====
function generateWarChariot(): VoxelData {
  const v: VoxelData = [];
  
  // 바퀴 2개
  for (let angle = 0; angle < 12; angle++) {
    const rad = (angle / 12) * Math.PI * 2;
    const x = Math.round(Math.cos(rad) * 4);
    const y = Math.round(Math.sin(rad) * 4) + 4;
    v.push([x, y, 0, 'W']); v.push([x + 1, y, 0, 'W']);
    v.push([x, y, 10, 'W']); v.push([x + 1, y, 10, 'W']);
  }
  // 바퀴 중심
  v.push([0, 4, 0, 'X']); v.push([0, 4, 10, 'X']);
  
  // 차체 바닥
  for (let x = -2; x <= 8; x++) {
    for (let z = 1; z <= 9; z++) {
      v.push([x, 4, z, 'W']);
    }
  }
  
  // 난간
  for (let y = 5; y <= 8; y++) {
    for (let x = -2; x <= 8; x++) {
      v.push([x, y, 1, 'W']); v.push([x, y, 9, 'W']);
    }
    v.push([8, y, 2, 'W']); v.push([8, y, 8, 'W']);
  }
  
  // 말 연결봉
  for (let x = 9; x <= 16; x++) {
    v.push([x, 5, 4, 'W']); v.push([x, 5, 5, 'W']); v.push([x, 5, 6, 'W']);
  }
  
  // 말 2마리 (간략화)
  const horseOffset = 17;
  for (let h = 0; h < 2; h++) {
    const zOff = h === 0 ? 2 : 8;
    // 몸통
    for (let y = 4; y <= 7; y++) {
      for (let x = horseOffset; x <= horseOffset + 8; x++) {
        v.push([x, y, zOff, 'H']); v.push([x, y, zOff + 1, 'H']);
      }
    }
    // 머리
    v.push([horseOffset + 9, 8, zOff, 'H']); v.push([horseOffset + 9, 8, zOff + 1, 'H']);
    v.push([horseOffset + 10, 8, zOff, 'H']); v.push([horseOffset + 10, 8, zOff + 1, 'H']);
    // 다리
    for (let y = 0; y <= 3; y++) {
      v.push([horseOffset + 1, y, zOff, 'H']);
      v.push([horseOffset + 7, y, zOff, 'H']);
    }
  }
  
  return v;
}

// ===== 배 (수군용) =====
function generateBoat(): VoxelData {
  const v: VoxelData = [];
  
  // 선체 바닥 (뾰족한 형태, 기존보다 약간 더 큼)
  for (let y = 0; y <= 2; y++) {
    const width = 3 + y;
    for (let x = -9; x <= 9; x++) {
      const xWidth = Math.abs(x) < 7 ? width : Math.max(0, width - (Math.abs(x) - 6));
      for (let z = -xWidth; z <= xWidth; z++) {
        v.push([x, y, z, 'W']);
      }
    }
  }
  
  // 선체 측면
  for (let y = 3; y <= 4; y++) {
    for (let x = -9; x <= 9; x++) {
      const len = Math.abs(x) <= 7 ? 3 : Math.max(1, 4 - (Math.abs(x) - 7));
      v.push([x, y, -len, 'W']); v.push([x, y, len, 'W']);
    }
  }
  
  // 갑판 (더 넓게)
  for (let x = -7; x <= 7; x++) {
    for (let z = -3; z <= 3; z++) {
      v.push([x, 5, z, 'W']);
    }
  }
  
  // 돛대
  for (let y = 6; y <= 14; y++) {
    v.push([0, y, 0, 'W']);
  }
  
  // 돛
  for (let y = 8; y <= 12; y++) {
    for (let z = 1; z <= 3; z++) {
      v.push([0, y, z, 'W']);
    }
  }

  // 난간 장식 (배 가장자리)
  for (let x = -7; x <= 7; x++) {
    v.push([x, 6, -3, 'L']); // 앞/뒤 난간
    v.push([x, 6, 3, 'L']);
  }

  // 선미 캐빈/지휘대
  for (let y = 6; y <= 8; y++) {
    for (let x = -7; x <= -3; x++) {
      for (let z = -2; z <= 2; z++) {
        v.push([x, y, z, 'W']);
      }
    }
  }

  // 깃발 (선미)
  for (let y = 9; y <= 15; y++) {
    v.push([-7, y, 0, 'W']); // 깃대
  }
  for (let z = 0; z <= 2; z++) {
    for (let y = 11; y <= 14; y++) {
      v.push([-6, y, z, 'C']); // 붉은 깃발
    }
  }
  
  return v;
}

// ===== 충차 =====
function generateSiegeRam(): VoxelData {
  const v: VoxelData = [];
  
  // 바퀴 4개
  for (let wheelX of [-6, 6]) {
    for (let wheelZ of [0, 8]) {
      for (let angle = 0; angle < 8; angle++) {
        const rad = (angle / 8) * Math.PI * 2;
        const y = Math.round(Math.sin(rad) * 2) + 2;
        const dx = Math.round(Math.cos(rad) * 2);
        v.push([wheelX + dx, y, wheelZ, 'W']);
      }
      v.push([wheelX, 2, wheelZ, 'X']); // 중심
    }
  }
  
  // 차체 프레임
  for (let x = -7; x <= 7; x++) {
    for (let z = 0; z <= 8; z++) {
      v.push([x, 5, z, 'W']);
    }
  }
  
  // 지붕 (경사)
  for (let x = -7; x <= 7; x++) {
    for (let z = 0; z <= 8; z++) {
      const height = 10 - Math.abs(z - 4);
      v.push([x, height, z, 'W']);
    }
  }
  
  // 지붕에 박힌 화살
  v.push([2, 11, 3, 'W']); v.push([2, 12, 3, 'M']);
  v.push([-3, 10, 5, 'W']); v.push([-3, 11, 5, 'M']);
  
  // 공성퇴 (매달린 통나무)
  for (let x = -8; x <= 8; x++) {
    v.push([x, 7, 4, 'W']);
  }
  // 용머리 철촉
  v.push([9, 7, 3, 'M']); v.push([9, 7, 4, 'M']); v.push([9, 7, 5, 'M']);
  v.push([10, 7, 4, 'M']); v.push([10, 8, 4, 'M']); v.push([11, 7, 4, 'M']);
  
  // 사슬
  v.push([0, 8, 4, 'M']); v.push([0, 9, 4, 'M']);
  
  return v;
}

// ===== 투석기 (벽력거) =====
function generateTrebuchet(): VoxelData {
  const v: VoxelData = [];
  
  // 베이스 프레임
  for (let x = -6; x <= 6; x++) {
    v.push([x, 0, 0, 'W']); v.push([x, 0, 8, 'W']);
    v.push([x, 1, 0, 'W']); v.push([x, 1, 8, 'W']);
  }
  for (let z = 0; z <= 8; z++) {
    v.push([-6, 0, z, 'W']); v.push([6, 0, z, 'W']);
    v.push([-6, 1, z, 'W']); v.push([6, 1, z, 'W']);
  }
  
  // A자형 지지대
  for (let y = 2; y <= 12; y++) {
    const spread = Math.max(0, 4 - y / 3);
    v.push([-3 - spread, y, 4, 'W']); v.push([3 + spread, y, 4, 'W']);
  }
  
  // 투석대 (팔)
  for (let x = -10; x <= 10; x++) {
    v.push([x, 12, 4, 'W']);
  }
  
  // 견인줄 (여러 가닥)
  for (let i = 0; i < 6; i++) {
    v.push([-10, 11 - i, 4 - 1 + (i % 2), 'T']);
    v.push([-10, 10 - i, 4 - 1 + (i % 2), 'T']);
  }
  
  // 투석 주머니
  v.push([10, 11, 4, 'L']); v.push([11, 10, 4, 'L']);
  v.push([11, 11, 4, 'L']); v.push([12, 10, 4, 'L']);
  
  // 돌덩이
  v.push([11, 9, 4, 'G']);
  
  return v;
}

// ===== 공성탑 =====
function generateSiegeTower(): VoxelData {
  const v: VoxelData = [];
  
  // 바퀴 4개
  for (let wheelX of [-4, 4]) {
    for (let wheelZ of [0, 8]) {
      for (let angle = 0; angle < 8; angle++) {
        const rad = (angle / 8) * Math.PI * 2;
        const y = Math.round(Math.sin(rad) * 3) + 3;
        const dx = Math.round(Math.cos(rad) * 3);
        v.push([wheelX + dx, y, wheelZ, 'W']);
      }
    }
  }
  
  // 탑 프레임 (여러 층)
  for (let floor = 0; floor < 4; floor++) {
    const baseY = 6 + floor * 6;
    
    // 바닥
    for (let x = -4; x <= 4; x++) {
      for (let z = 0; z <= 8; z++) {
        v.push([x, baseY, z, 'W']);
      }
    }
    
    // 벽
    for (let y = baseY + 1; y <= baseY + 5; y++) {
      for (let x = -4; x <= 4; x++) {
        v.push([x, y, 0, 'L']); v.push([x, y, 8, 'L']); // 젖은 가죽
      }
      for (let z = 1; z <= 7; z++) {
        v.push([-4, y, z, 'L']); v.push([4, y, z, 'L']);
      }
      
      // 화살 구멍
      if (y === baseY + 3) {
        v.push([0, y, 0, 'B']); v.push([2, y, 0, 'B']); v.push([-2, y, 0, 'B']);
      }
    }
  }
  
  // 도개교 (접힘)
  for (let y = 24; y <= 28; y++) {
    for (let z = 2; z <= 6; z++) {
      v.push([5, y, z, 'W']);
    }
  }
  
  // 화살 박힌 흔적
  v.push([0, 15, 1, 'W']); v.push([0, 16, 1, 'M']);
  v.push([-2, 20, 1, 'W']); v.push([-2, 21, 1, 'M']);
  
  return v;
}

// ===== 노거 (발리스타) =====
function generateBallista(): VoxelData {
  const v: VoxelData = [];
  
  // 바퀴 2개
  for (let wheelZ of [0, 8]) {
    for (let angle = 0; angle < 8; angle++) {
      const rad = (angle / 8) * Math.PI * 2;
      const y = Math.round(Math.sin(rad) * 2) + 2;
      const x = Math.round(Math.cos(rad) * 2);
      v.push([x, y, wheelZ, 'W']);
    }
    v.push([0, 2, wheelZ, 'X']);
  }
  
  // 플랫폼
  for (let x = -3; x <= 6; x++) {
    for (let z = 1; z <= 7; z++) {
      v.push([x, 4, z, 'W']);
    }
  }
  
  // 대형 쇠뇌 본체
  for (let x = 0; x <= 8; x++) {
    v.push([x, 5, 3, 'W']); v.push([x, 5, 4, 'W']); v.push([x, 5, 5, 'W']);
    v.push([x, 6, 4, 'W']);
  }
  
  // 활대
  for (let z = -2; z <= 10; z++) {
    v.push([8, 6, z, 'W']);
  }
  
  // 시위
  for (let z = -2; z <= 10; z++) {
    v.push([7, 6, z, 'T']);
  }
  
  // 윈치/톱니바퀴
  v.push([-1, 5, 4, 'X']); v.push([-1, 6, 4, 'X']);
  v.push([-2, 5, 4, 'X']); v.push([-2, 6, 4, 'M']);
  
  // 대형 볼트
  v.push([9, 6, 4, 'M']); v.push([10, 6, 4, 'M']); v.push([11, 6, 4, 'M']);
  
  return v;
}

// ===== 화수 (불 뿜는 괴수) =====
function generateFireBeast(): VoxelData {
  const v: VoxelData = [];
  
  // 바퀴 4개 (숨겨짐)
  for (let wheelX of [-4, 4]) {
    for (let wheelZ of [2, 8]) {
      v.push([wheelX, 1, wheelZ, 'W']);
    }
  }
  
  // 괴수 몸통 (사자/호랑이 형태)
  for (let y = 2; y <= 6; y++) {
    for (let x = -4; x <= 6; x++) {
      for (let z = 2; z <= 8; z++) {
        v.push([x, y, z, 'X']); // 청동색
      }
    }
  }
  
  // 머리
  for (let y = 5; y <= 9; y++) {
    for (let x = 7; x <= 11; x++) {
      for (let z = 3; z <= 7; z++) {
        v.push([x, y, z, 'X']);
      }
    }
  }
  
  // 눈 (붉은 보석)
  v.push([11, 8, 4, 'C']); v.push([11, 8, 6, 'C']);
  
  // 입 (벌린)
  for (let z = 4; z <= 6; z++) {
    v.push([12, 6, z, 'B']); // 그을린 입 주변
    v.push([12, 7, z, 'B']);
  }
  
  // 입에서 나오는 화염
  for (let x = 13; x <= 18; x++) {
    v.push([x, 6, 5, 'F']); v.push([x, 7, 5, 'F']);
    v.push([x, 6, 4, 'O']); v.push([x, 6, 6, 'O']);
    v.push([x, 7, 4, 'O']); v.push([x, 7, 6, 'O']);
  }
  
  // 이빨
  v.push([11, 6, 4, 'M']); v.push([11, 6, 5, 'M']); v.push([11, 6, 6, 'M']);
  
  // 다리 (짧게)
  for (let y = 0; y <= 1; y++) {
    v.push([-3, y, 3, 'X']); v.push([-3, y, 7, 'X']);
    v.push([5, y, 3, 'X']); v.push([5, y, 7, 'X']);
  }
  
  // 발톱
  v.push([-4, 0, 3, 'M']); v.push([-4, 0, 7, 'M']);
  v.push([6, 0, 3, 'M']); v.push([6, 0, 7, 'M']);
  
  // 비늘 패턴
  for (let x = -2; x <= 4; x += 2) {
    v.push([x, 6, 2, 'X']); v.push([x, 6, 8, 'X']);
  }
  
  return v;
}

// ===== 낙타 파츠별 분리 =====
export interface CamelBodyParts {
  body: VoxelData;
  head: VoxelData;
  frontLeftLeg: VoxelData;
  frontRightLeg: VoxelData;
  backLeftLeg: VoxelData;
  backRightLeg: VoxelData;
}

export const CAMEL_PART_PIVOTS = {
  body: { x: 5, y: 5.5, z: 5.5 },
  head: { x: 11, y: 6, z: 5.5 },
  frontLeftLeg: { x: 1, y: 4, z: 5 },
  frontRightLeg: { x: 1, y: 4, z: 6 },
  backLeftLeg: { x: 9, y: 4, z: 5 },
  backRightLeg: { x: 9, y: 4, z: 6 },
};

function generateCamelBodyParts(): CamelBodyParts {
  const c = 'C';
  
  // 몸통 + 혹 + 안장
  const body: VoxelData = [];
  for (let y = 4; y <= 7; y++) {
    for (let x = 0; x <= 10; x++) {
      for (let z = 3; z <= 8; z++) {
        body.push([x, y, z, c]);
      }
    }
  }
  // 혹 2개
  for (let y = 8; y <= 11; y++) {
    body.push([2, y, 5, c]); body.push([2, y, 6, c]);
    body.push([3, y, 5, c]); body.push([3, y, 6, c]);
    body.push([7, y, 5, c]); body.push([7, y, 6, c]);
    body.push([8, y, 5, c]); body.push([8, y, 6, c]);
  }
  // 안장
  body.push([4, 8, 5, 'P']); body.push([5, 8, 5, 'P']); body.push([6, 8, 5, 'P']);
  body.push([4, 8, 6, 'P']); body.push([5, 8, 6, 'P']); body.push([6, 8, 6, 'P']);
  
  // 머리 + 목
  const head: VoxelData = [];
  const neckCurve = [[11, 6], [12, 7], [12, 8], [12, 9], [13, 10], [13, 11], [14, 12], [14, 13]];
  neckCurve.forEach(([x, y]) => {
    head.push([x, y, 5, c]); head.push([x, y, 6, c]);
  });
  for (let y = 13; y <= 15; y++) {
    head.push([15, y, 5, c]); head.push([15, y, 6, c]);
    head.push([16, y, 5, c]); head.push([16, y, 6, c]);
  }
  
  // 앞왼쪽 다리
  const frontLeftLeg: VoxelData = [];
  for (let y = 0; y <= 3; y++) {
    frontLeftLeg.push([1, y, 5, c]);
  }
  frontLeftLeg.push([0, 0, 5, c]); frontLeftLeg.push([2, 0, 5, c]);
  
  // 앞오른쪽 다리
  const frontRightLeg: VoxelData = [];
  for (let y = 0; y <= 3; y++) {
    frontRightLeg.push([1, y, 6, c]);
  }
  frontRightLeg.push([0, 0, 6, c]); frontRightLeg.push([2, 0, 6, c]);
  
  // 뒤왼쪽 다리
  const backLeftLeg: VoxelData = [];
  for (let y = 0; y <= 3; y++) {
    backLeftLeg.push([9, y, 5, c]);
  }
  backLeftLeg.push([8, 0, 5, c]); backLeftLeg.push([10, 0, 5, c]);
  
  // 뒤오른쪽 다리
  const backRightLeg: VoxelData = [];
  for (let y = 0; y <= 3; y++) {
    backRightLeg.push([9, y, 6, c]);
  }
  backRightLeg.push([8, 0, 6, c]); backRightLeg.push([10, 0, 6, c]);
  
  return { body, head, frontLeftLeg, frontRightLeg, backLeftLeg, backRightLeg };
}

// ===== 낙타 (기존 호환용) =====
function generateDetailedCamel(): VoxelData {
  const parts = generateCamelBodyParts();
  return [
    ...parts.body,
    ...parts.head,
    ...parts.frontLeftLeg,
    ...parts.frontRightLeg,
    ...parts.backLeftLeg,
    ...parts.backRightLeg,
  ];
}

// ===== 늑대 파츠별 분리 =====
export interface WolfBodyParts {
  body: VoxelData;
  head: VoxelData;
  tail: VoxelData;
  frontLeftLeg: VoxelData;
  frontRightLeg: VoxelData;
  backLeftLeg: VoxelData;
  backRightLeg: VoxelData;
}

export const WOLF_PART_PIVOTS = {
  body: { x: 4, y: 4.5, z: 5 },
  head: { x: 9, y: 5, z: 5 },
  tail: { x: 0, y: 5, z: 5 },
  frontLeftLeg: { x: 1, y: 3, z: 4 },
  frontRightLeg: { x: 1, y: 3, z: 6 },
  backLeftLeg: { x: 7, y: 3, z: 4 },
  backRightLeg: { x: 7, y: 3, z: 6 },
};

function generateWolfBodyParts(): WolfBodyParts {
  const c = 'G';
  
  // 몸통
  const body: VoxelData = [];
  for (let y = 3; y <= 6; y++) {
    for (let x = 0; x <= 8; x++) {
      for (let z = 3; z <= 7; z++) {
        body.push([x, y, z, c]);
      }
    }
  }
  
  // 머리 + 목
  const head: VoxelData = [];
  for (let y = 5; y <= 8; y++) {
    head.push([9, y, 4, c]); head.push([9, y, 5, c]); head.push([9, y, 6, c]);
    head.push([10, y, 4, c]); head.push([10, y, 5, c]); head.push([10, y, 6, c]);
  }
  head.push([11, 7, 4, c]); head.push([11, 7, 5, c]); head.push([11, 7, 6, c]);
  head.push([11, 8, 4, c]); head.push([11, 8, 5, c]); head.push([11, 8, 6, c]);
  head.push([12, 7, 5, c]); // 주둥이
  // 귀
  head.push([11, 9, 3, c]); head.push([11, 10, 3, c]);
  head.push([11, 9, 7, c]); head.push([11, 10, 7, c]);
  // 이빨
  head.push([12, 6, 5, 'W']);
  // 눈
  head.push([11, 8, 4, 'Y']); head.push([11, 8, 6, 'Y']);
  // 침
  head.push([12, 5, 5, 'T']);
  
  // 꼬리
  const tail: VoxelData = [];
  tail.push([-1, 5, 5, c]); tail.push([-2, 6, 5, c]); tail.push([-3, 7, 5, c]);
  
  // 앞왼쪽 다리
  const frontLeftLeg: VoxelData = [];
  for (let y = 0; y <= 2; y++) {
    frontLeftLeg.push([1, y, 4, c]);
  }
  
  // 앞오른쪽 다리
  const frontRightLeg: VoxelData = [];
  for (let y = 0; y <= 2; y++) {
    frontRightLeg.push([1, y, 6, c]);
  }
  
  // 뒤왼쪽 다리
  const backLeftLeg: VoxelData = [];
  for (let y = 0; y <= 2; y++) {
    backLeftLeg.push([7, y, 4, c]);
  }
  
  // 뒤오른쪽 다리
  const backRightLeg: VoxelData = [];
  for (let y = 0; y <= 2; y++) {
    backRightLeg.push([7, y, 6, c]);
  }
  
  return { body, head, tail, frontLeftLeg, frontRightLeg, backLeftLeg, backRightLeg };
}

// ===== 늑대 (기존 호환용) =====
function generateDetailedWolf(): VoxelData {
  const parts = generateWolfBodyParts();
  return [
    ...parts.body,
    ...parts.head,
    ...parts.tail,
    ...parts.frontLeftLeg,
    ...parts.frontRightLeg,
    ...parts.backLeftLeg,
    ...parts.backRightLeg,
  ];
}

// ===== 색상 맵 =====
const COLOR_MAP: Record<string, string> = {
  P: 'primary',
  S: 'secondary',
  K: VOXEL_PALETTE.SKIN,
  H: VOXEL_PALETTE.HAIR_BLACK,
  W: VOXEL_PALETTE.WOOD_LIGHT,
  M: VOXEL_PALETTE.IRON_BASE,
  B: VOXEL_PALETTE.LACQUER_BLACK,
  R: VOXEL_PALETTE.RATTAN,
  Y: VOXEL_PALETTE.CLOTH_YELLOW,
  X: VOXEL_PALETTE.BRONZE,
  L: VOXEL_PALETTE.LEATHER_DARK,
  T: '#CCCCCC80',
  C: VOXEL_PALETTE.LACQUER_RED,
  G: '#696969',
  D: VOXEL_PALETTE.HAIR_BROWN,
  E: VOXEL_PALETTE.RUST,
  I: '#FFFFF0',
  F: VOXEL_PALETTE.FLAME_RED,
  O: VOXEL_PALETTE.FLAME_ORANGE,
};

// ===== 복셀 그룹 빌더 옵션 =====
interface BuildVoxelGroupOptions {
  pivot?: { x: number; y: number; z: number };  // 피벗 포인트 (지정 시 해당 좌표가 원점이 됨)
  centerMode?: 'auto' | 'pivot' | 'none';       // 정렬 모드
}

// ===== 복셀 그룹 빌더 =====
function buildVoxelGroup(
  voxels: VoxelData,
  colors: Record<string, string>,
  voxelSize: number = 0.025,
  options?: BuildVoxelGroupOptions
): Group {
  const group = new Group();
  if (voxels.length === 0) return group;
  
  const geometry = new BoxGeometry(voxelSize * 0.92, voxelSize * 0.92, voxelSize * 0.92);
  const centerMode = options?.centerMode ?? 'auto';
  
  // ===== 중심 정렬을 위한 바운딩 박스 계산 =====
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  let minZ = Infinity;
  let maxZ = -Infinity;

  voxels.forEach(([x, y, z]) => {
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
    if (z < minZ) minZ = z;
    if (z > maxZ) maxZ = z;
  });

  // 정렬 기준 계산
  let centerX: number, centerZ: number, baseY: number;
  
  if (centerMode === 'pivot' && options?.pivot) {
    // 피벗 포인트 기준 정렬 (파츠별 애니메이션용)
    centerX = options.pivot.x;
    centerZ = options.pivot.z;
    baseY = options.pivot.y;
  } else if (centerMode === 'none') {
    // 정렬 없음 (원본 좌표 유지)
    centerX = 0;
    centerZ = 0;
    baseY = 0;
  } else {
    // 자동 정렬 (가로 중앙, 세로 발바닥 기준)
    centerX = (minX + maxX) * 0.5;
    centerZ = (minZ + maxZ) * 0.5;
    baseY = minY;
  }

  const colorGroups: Record<string, Vector3[]> = {};
  
  voxels.forEach(([x, y, z, colorKey]) => {
    let color = colors[colorKey] || COLOR_MAP[colorKey] || '#888888';
    if (color === 'primary') color = colors.primary;
    if (color === 'secondary') color = colors.secondary;
    
    if (!colorGroups[color]) {
      colorGroups[color] = [];
    }
    const px = (x - centerX) * voxelSize;
    const py = (y - baseY) * voxelSize;
    const pz = (z - centerZ) * voxelSize;
    colorGroups[color].push(new Vector3(px, py, pz));
  });
  
  Object.entries(colorGroups).forEach(([color, positions]) => {
    const isTransparent = color.length > 7;
    const isMetal = color === VOXEL_PALETTE.IRON_BASE || color === VOXEL_PALETTE.BRONZE;
    
    const material = new MeshStandardMaterial({
      color: new Color(color.slice(0, 7)),
      roughness: isMetal ? 0.4 : 0.75,
      metalness: isMetal ? 0.5 : 0.1,
      transparent: isTransparent,
      opacity: isTransparent ? 0.5 : 1,
    });
    
    const instancedMesh = new InstancedMesh(geometry, material, positions.length);
    const matrix = new Matrix4();
    
    positions.forEach((pos, i) => {
      matrix.setPosition(pos);
      instancedMesh.setMatrixAt(i, matrix);
    });
    
    instancedMesh.instanceMatrix.needsUpdate = true;
    group.add(instancedMesh);
  });
  
  return group;
}

// ===== 파츠별 인체 그룹 빌더 =====
export interface HumanPartsGroups {
  head: Group;
  torso: Group;
  rightArm: Group;
  leftArm: Group;
  rightLeg: Group;
  leftLeg: Group;
}

function buildHumanPartsGroups(
  colors: Record<string, string>,
  voxelSize: number
): HumanPartsGroups {
  const parts = VOXEL_HUMAN_PARTS;
  const pivots = HUMAN_PART_PIVOTS;
  
  // 전체 인체의 중심 (발 중앙이 원점이 되도록)
  const globalCenterX = 7.5;
  const globalCenterZ = 7.5;
  const globalBaseY = 0;
  
  // 각 파츠를 피벗 기준으로 빌드하고, 전체 인체 내 위치로 이동
  const buildPartWithPivot = (
    partData: VoxelData, 
    pivot: { x: number; y: number; z: number },
    name: string
  ): Group => {
    const partGroup = buildVoxelGroup(partData, colors, voxelSize, {
      pivot,
      centerMode: 'pivot',
    });
    partGroup.name = name;
    
    // 피벗 위치를 전체 인체 좌표계로 변환하여 파츠 위치 설정
    partGroup.position.set(
      (pivot.x - globalCenterX) * voxelSize,
      (pivot.y - globalBaseY) * voxelSize,
      (pivot.z - globalCenterZ) * voxelSize
    );
    
    return partGroup;
  };
  
  return {
    head: buildPartWithPivot(parts.head, pivots.head, 'head'),
    torso: buildPartWithPivot(parts.torso, pivots.torso, 'torso'),
    rightArm: buildPartWithPivot(parts.rightArm, pivots.rightArm, 'rightArm'),
    leftArm: buildPartWithPivot(parts.leftArm, pivots.leftArm, 'leftArm'),
    rightLeg: buildPartWithPivot(parts.rightLeg, pivots.rightLeg, 'rightLeg'),
    leftLeg: buildPartWithPivot(parts.leftLeg, pivots.leftLeg, 'leftLeg'),
  };
}

// ===== 메인 빌더 함수 =====
export function buildVoxelUnitFromSpec(config: VoxelBuildConfig): Group {
  const unitSpec = VOXEL_UNIT_DATABASE[config.unitId];
  if (!unitSpec) {
    console.warn(`Unit ID ${config.unitId} not found`);
    return new Group();
  }
  
  const unit = new Group();
  const scale = config.scale || 1;
  const voxelSize = 0.02 * scale;
  
  const primaryColor = unitSpec.forcedColors?.primary || config.primaryColor || VOXEL_PALETTE.LACQUER_RED;
  const secondaryColor = unitSpec.forcedColors?.secondary || config.secondaryColor || VOXEL_PALETTE.IRON_BASE;
  const colors: Record<string, string> = {
    primary: primaryColor,
    secondary: secondaryColor,
    P: primaryColor,
    S: secondaryColor,
  };
  
  // 탈것이 있는 경우
  let mountHeight = 0;
  let hasCavalryPose = false;
  let isSiegeMount = false;
  // 말/탈것이 실제로 배치된 월드 오프셋 (기수 정렬용)
  let mountOffset = { x: 0, y: 0, z: 0 };
  let mountData: VoxelData | null = null;
  // 특별 예외: 수군 계열은 mount 정의가 없어도 강제로 배를 탄다.
  const isPureBoatUnit = unitSpec.id === 1111 || unitSpec.id === 1464;
  // 특정 유닛(수군 등)은 명시적 mount가 없어도 강제로 탑승물 부여
  let mountType: string | null = unitSpec.mount?.type && unitSpec.mount.type !== 'none'
    ? unitSpec.mount.type
    : null;

  if (!mountType && isPureBoatUnit) {
    mountType = 'boat';
  }
  
  if (mountType && mountType !== 'none') {
    
    switch (mountType) {
      case 'horse':
      case 'white_horse':
      case 'black_horse':
        mountData = generateDetailedHorse(
          mountType === 'white_horse' ? 'W' : 
          mountType === 'black_horse' ? 'B' : 'H',
          false
        );
        mountHeight = 0.22 * scale;
        hasCavalryPose = true;
          break;
      case 'scout_horse':
        mountData = generateScoutHorse();
        mountHeight = 0.20 * scale;
        hasCavalryPose = true;
          break;
      case 'armored_horse':
      case 'full_barding':
        mountData = generateDetailedHorse('M', true);
        mountHeight = 0.24 * scale;
        hasCavalryPose = true;
          break;
      case 'camel':
        mountData = generateDetailedCamel();
        mountHeight = 0.28 * scale;
        hasCavalryPose = true;
          break;
      case 'dire_wolf':
        mountData = generateDetailedWolf();
        mountHeight = 0.18 * scale;
        hasCavalryPose = true;
        break;
      case 'tiger':
        mountData = generateDetailedTiger();
        mountHeight = 0.16 * scale;
        hasCavalryPose = true;
        break;
      case 'elephant':
        mountData = generateDetailedElephant();
        mountHeight = 0.32 * scale;
        hasCavalryPose = true;
        break;
      case 'tower_elephant':
        mountData = generateWarElephant();
        mountHeight = 0.45 * scale;
        hasCavalryPose = true;
        break;
      case 'war_chariot':
        mountData = generateWarChariot();
        mountHeight = 0.12 * scale;
      // 전차도 기병과 동일하게 "탈것+기수 한 덩어리"로 처리
      // (실제 고증상 서있지만, 시스템 상 기병 통합 파이프라인을 재사용)
      hasCavalryPose = true;
        break;
      case 'boat':
        mountData = generateBoat();
        mountHeight = 0.12 * scale;
        // 수군은 사람 없이 배만 출력하므로 앉은 자세는 사용하지 않는다.
        hasCavalryPose = !isPureBoatUnit;
        break;
      case 'siege_ram':
        mountData = generateSiegeRam();
        isSiegeMount = true;
        break;
      case 'trebuchet':
        mountData = generateTrebuchet();
        isSiegeMount = true;
        break;
      case 'siege_tower':
        mountData = generateSiegeTower();
        isSiegeMount = true;
        break;
      case 'ballista':
        mountData = generateBallista();
        isSiegeMount = true;
        break;
      case 'fire_beast':
        mountData = generateFireBeast();
        isSiegeMount = true;
          break;
      }
      
    if (mountData) {
      let mountScale = isSiegeMount ? voxelSize * 0.8 : voxelSize;
      // 순수 수군 유닛(배만 있는 경우)은 배를 약간 키운다.
      if (!isSiegeMount && mountType === 'boat' && isPureBoatUnit) {
        mountScale = voxelSize * 1.25;
      }
    const shouldCombineCavalry =
      hasCavalryPose && !isSiegeMount && mountData !== null;

      if (!shouldCombineCavalry) {
        // 도보 + 전차/배/공성 병기: 기존처럼 탈것을 별도 그룹으로 둔다.
        const mount = buildVoxelGroup(mountData, colors, mountScale);
        const mountX = isSiegeMount ? -0.2 : -0.1;
        mountOffset = { x: mountX, y: 0, z: -0.05 };
        mount.position.set(mountOffset.x, mountOffset.y, mountOffset.z);
        unit.add(mount);
      } else {
        // 기병 통합 모드에서는 mountOffset을 원점 기준으로 둔다.
        mountOffset = { x: 0, y: 0, z: 0 };
      }
    }
  }
  
  // 공성 기계가 아닌 경우에만 인체 생성
  if (unitSpec.category !== 'siege' && !isSiegeMount && !isPureBoatUnit) {
    const shouldCombineCavalry =
      hasCavalryPose && !isSiegeMount && mountData !== null;

    if (shouldCombineCavalry && mountData) {
      // ===== 기병 통합 모드: 말 + VOXEL_HUMAN_SEATED를 하나의 복셀 데이터로 병합 =====
      const saddleSource = mountType ? MOUNT_HARDPOINTS[mountType] : undefined;
      const saddle = saddleSource?.saddle ?? MOUNT_HARDPOINTS.horse.saddle;
      const combinedVoxels: VoxelData = [...mountData];

      // 기병용 인체 복셀 + 투구 복셀(있다면)을 하나의 라이더 데이터로 구성
      let riderVoxels: VoxelData = [...VOXEL_HUMAN_SEATED];

      if (unitSpec.head && unitSpec.head.type && VOXEL_HEADS_DETAILED[unitSpec.head.type]) {
        const headData = VOXEL_HEADS_DETAILED[unitSpec.head.type];
        // 서있는 인체 기준(머리 y=20~)으로 설계된 투구를
        // 앉은 인체 머리(y=16~)에 맞게 전체 y를 약간 낮춰서 붙인다.
        headData.forEach(([hx, hy, hz, hk]) => {
          const adjustedY = hy - 4; // 대략적인 오프셋 보정
          riderVoxels.push([hx, adjustedY, hz, hk]);
        });
      }

      // 전차병/수군 등은 하반신이 차체/선체 안에 가려지므로
      // 시각적으로 어색한 다리 복셀을 제거한다.
      if (mountType === 'war_chariot' || mountType === 'boat') {
        riderVoxels = riderVoxels.filter(([_, y, __, key]) => {
          // 무릎 아래(P/L)만 제거하고 상체/골반은 유지
          if (y <= 6 && (key === 'P' || key === 'L')) {
            return false;
          }
          return true;
        });
      }

      const centerX = 7.5;
      const centerZ = 7.5;
      const hipY = 7.5;
      const down = 2; // 엉덩이를 안장 안으로 약간 파고들게
      const offsetY = saddle.y - hipY - down;

      // 인체 복셀을 말 좌표계로 회전/이동하면서 색상 키도 분리
      riderVoxels.forEach(([x, y, z, key]) => {
        const relX = x - centerX;
        const relZ = z - centerZ;

        // Y축 -90도 회전 (기수가 +X 방향을 보도록)
        const rotatedX = -relZ;
        const rotatedZ = relX;

        const newX = rotatedX + saddle.x;
        const newY = y + offsetY;
        const newZ = rotatedZ + saddle.z;

        const mappedKey = mapCavalryRiderColorKey(key);
        combinedVoxels.push([newX, newY, newZ, mappedKey]);
      });

      // 말과 기수 색상 맵 통합 (R1/R2는 기수 전용 색상)
      const combinedColors: Record<string, string> = {
        ...colors,
        R1: VOXEL_PALETTE.SKIN,
        R2: unitSpec.body?.color || primaryColor,
        ...(unitSpec.head
          ? { M: unitSpec.head.color || VOXEL_PALETTE.IRON_BASE }
          : {}),
      };

      const cavalryGroup = buildVoxelGroup(combinedVoxels, combinedColors, voxelSize);
      unit.add(cavalryGroup);

      // 기수 중심 (VOXEL_HUMAN_SEATED 중심이 안장 위로 오도록 설정됨)
      const centerY = 10;
      const humanCenterWorld = {
        x: saddle.x * voxelSize,
        y: (centerY + offsetY) * voxelSize,
        z: saddle.z * voxelSize,
      };

      // ===== 무기 / 보조 장비 배치 (기병 전용 하드포인트 사용) =====
      if (unitSpec.weapon && unitSpec.weapon.type !== 'none') {
        const weaponData = VOXEL_WEAPONS_DETAILED[unitSpec.weapon.type];
      if (weaponData) {
          const weaponScale = 0.55;
          const weapon = buildVoxelGroup(weaponData, colors, voxelSize * weaponScale);
          weapon.name = 'weapon'; // 애니메이션용 이름 지정

          const handWorld = cavalryPointToWorld(
            CAVALRY_HARDPOINTS_VOXEL.rightHand,
            saddle,
            voxelSize
          );
          weapon.position.set(handWorld.x, handWorld.y, handWorld.z);
          weapon.rotation.y = -Math.PI / 2;
        weapon.rotation.z = -0.2;
          weapon.rotation.x = 0.1;
        unit.add(weapon);
        }
      }

      if (unitSpec.offHand && unitSpec.offHand.type !== 'none') {
        const offHandData = VOXEL_SHIELDS_DETAILED[unitSpec.offHand.type];
        if (offHandData) {
          const isBackItem =
            unitSpec.offHand.type === 'quiver' || unitSpec.offHand.type === 'pavise';
          const offHandScale = 0.45;
          const offHand = buildVoxelGroup(offHandData, colors, voxelSize * offHandScale);
          offHand.name = isBackItem ? 'quiver' : 'shield'; // 애니메이션용 이름 지정

          const hpPoint = isBackItem
            ? CAVALRY_HARDPOINTS_VOXEL.back
            : CAVALRY_HARDPOINTS_VOXEL.leftHand;
          const offWorld = cavalryPointToWorld(hpPoint, saddle, voxelSize);

          offHand.position.set(offWorld.x, offWorld.y, offWorld.z);
          offHand.rotation.y = -Math.PI / 2 + (isBackItem ? 0 : Math.PI / 2);
          unit.add(offHand);
        }
      }
    } else {
      // ===== 도보 / 전차·배 병사: 파츠별 분리 빌드 =====
      const humanColors: Record<string, string> = {
        ...colors,
        ...(unitSpec.head
          ? { M: unitSpec.head.color || VOXEL_PALETTE.IRON_BASE }
          : {}),
        ...(unitSpec.body && VOXEL_ARMOR_DETAILED[unitSpec.body.type]
          ? { A: unitSpec.body.color || primaryColor }
          : {}),
      };

      // 파츠별 그룹 생성
      const partsGroups = buildHumanPartsGroups(humanColors, voxelSize);
      
      // 투구 복셀을 머리 파츠에 추가
      if (unitSpec.head && unitSpec.head.type && VOXEL_HEADS_DETAILED[unitSpec.head.type]) {
        const headgearData = VOXEL_HEADS_DETAILED[unitSpec.head.type];
        if (headgearData.length > 0) {
          const headgear = buildVoxelGroup(headgearData, humanColors, voxelSize, {
            pivot: HUMAN_PART_PIVOTS.head,
            centerMode: 'pivot',
          });
          headgear.name = 'headgear';
          partsGroups.head.add(headgear);
        }
      }
      
      // 갑옷 복셀을 몸통 파츠에 추가
      if (unitSpec.body && VOXEL_ARMOR_DETAILED[unitSpec.body.type]) {
        const armorData = VOXEL_ARMOR_DETAILED[unitSpec.body.type];
        if (armorData.length > 0) {
          const armor = buildVoxelGroup(armorData, humanColors, voxelSize, {
            pivot: HUMAN_PART_PIVOTS.torso,
            centerMode: 'pivot',
          });
          armor.name = 'armor';
          partsGroups.torso.add(armor);
        }
      }

      // 인체 컨테이너 그룹 생성
      const human = new Group();
      human.name = 'humanBody';
      human.add(partsGroups.head);
      human.add(partsGroups.torso);
      human.add(partsGroups.rightArm);
      human.add(partsGroups.leftArm);
      human.add(partsGroups.rightLeg);
      human.add(partsGroups.leftLeg);
      
      // 파츠 참조를 userData에 저장 (애니메이션용)
      human.userData.parts = partsGroups;

      // 탈것이 있는 도보/비기병 유닛(전차, 배, 코끼리 등)만 발판 하드포인트 사용
      const hasStandingMount = mountHeight > 0 && mountType !== null;
      if (hasStandingMount) {
        const safeMountType = mountType || 'horse';
        const standPos = getStandingMountPosition(safeMountType, mountOffset, voxelSize);
        const saddleInfo = getMountSaddlePosition(safeMountType, mountOffset, voxelSize);

        human.rotation.y = saddleInfo.rotation;
        human.position.set(
          standPos.x,
          standPos.y,
          standPos.z
        );
        human.scale.set(saddleInfo.scale, saddleInfo.scale, saddleInfo.scale);
      }

      unit.add(human);
      
      // unit에도 파츠 참조 저장 (최상위에서 접근 가능하도록)
      unit.userData.parts = partsGroups;

      // 하드포인트 기반 장비 배치 (무기/보조 장비만 별도 그룹)
      const humanPos = { x: human.position.x, y: human.position.y, z: human.position.z };
      const getInfantryWorldPos = (offset: { x: number; y: number; z: number }) => ({
        x: humanPos.x + offset.x,
        y: humanPos.y + offset.y,
        z: humanPos.z + offset.z,
      });

      if (unitSpec.weapon && unitSpec.weapon.type !== 'none') {
        const weaponData = VOXEL_WEAPONS_DETAILED[unitSpec.weapon.type];
        if (weaponData) {
          const weaponScale = hasStandingMount ? 0.55 : 0.7;
          const weapon = buildVoxelGroup(weaponData, colors, voxelSize * weaponScale);
          weapon.name = 'weapon'; // 애니메이션용 이름 지정

          const handPos = getInfantryWorldPos(INFANTRY_HARDPOINTS.rightHand);
          weapon.position.set(handPos.x, handPos.y, handPos.z);
          weapon.rotation.y = hasStandingMount ? human.rotation.y : 0;
          weapon.rotation.z = -0.2;
          weapon.rotation.x = 0.1;
        unit.add(weapon);
      }
      }

      if (unitSpec.offHand && unitSpec.offHand.type !== 'none') {
        const offHandData = VOXEL_SHIELDS_DETAILED[unitSpec.offHand.type];
        if (offHandData) {
          const isBackItem =
            unitSpec.offHand.type === 'quiver' || unitSpec.offHand.type === 'pavise';
          const offHandScale = hasStandingMount ? 0.45 : 0.6;
          const offHand = buildVoxelGroup(offHandData, colors, voxelSize * offHandScale);
          offHand.name = isBackItem ? 'quiver' : 'shield'; // 애니메이션용 이름 지정

          const attachOffset = isBackItem ? INFANTRY_HARDPOINTS.back : INFANTRY_HARDPOINTS.leftHand;
          const pos = getInfantryWorldPos(attachOffset);
          offHand.position.set(pos.x, pos.y, pos.z);
          offHand.rotation.y = (hasStandingMount ? human.rotation.y : 0) + (isBackItem ? 0 : Math.PI / 2);
          unit.add(offHand);
        }
      }
    }
  }
  
  // 중심 맞추기
  unit.position.set(-0.08, -0.15, -0.08);
  
  return unit;
}

// ===== ID로 유닛 생성 (기존 API 호환) =====
export function buildVoxelUnitById(
  id: number, 
  primaryColor: string, 
  secondaryColor: string
): Group {
  return buildVoxelUnitFromSpec({
    unitId: id,
    primaryColor,
    secondaryColor,
    scale: 1.2,
  });
}

// ===== 기존 API 호환용 =====
export interface VoxelUnitConfig {
  unitType: 'infantry' | 'archer' | 'cavalry' | 'siege' | 'commander';
  weapon?: 'spear' | 'sword' | 'bow' | 'staff' | 'halberd';
  primaryColor: string;
  secondaryColor: string;
  skinColor?: string;
  scale?: number;
}

export function buildVoxelUnit(config: VoxelUnitConfig): Group {
  let unitId = 1100;
  
  switch (config.unitType) {
    case 'infantry':
      unitId = config.weapon === 'halberd' ? 1117 : 1102;
      break;
    case 'archer':
      unitId = 1201;
      break;
    case 'cavalry':
      unitId = config.weapon === 'halberd' ? 1305 : 1300;
      break;
    case 'siege':
      unitId = 1501;
      break;
    case 'commander':
      unitId = 1102;
      break;
  }
  
  return buildVoxelUnitFromSpec({
    unitId,
    primaryColor: config.primaryColor,
    secondaryColor: config.secondaryColor,
    scale: config.scale,
  });
}

export const VOXEL_UNIT_PRESETS: Record<string, Partial<VoxelUnitConfig>> = {
  spearman: { unitType: 'infantry', weapon: 'spear' },
  swordsman: { unitType: 'infantry', weapon: 'sword' },
  halberdier: { unitType: 'infantry', weapon: 'halberd' },
  archer: { unitType: 'archer', weapon: 'bow' },
  lightCavalry: { unitType: 'cavalry', weapon: 'spear' },
  heavyCavalry: { unitType: 'cavalry', weapon: 'halberd' },
  strategist: { unitType: 'commander', weapon: 'staff' },
  catapult: { unitType: 'siege' },
};
