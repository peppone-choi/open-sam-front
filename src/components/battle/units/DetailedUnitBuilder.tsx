'use client';

import {
  Group,
  Mesh,
  BoxGeometry,
  CylinderGeometry,
  SphereGeometry,
  ConeGeometry,
  MeshToonMaterial,
  Color,
  DoubleSide,
  Shape,
  ExtrudeGeometry,
} from 'three';

// ===== 타입 =====
export interface DetailedUnitConfig {
  type: 'infantry' | 'archer' | 'cavalry' | 'commander' | 'siege';
  armorType: 'light' | 'heavy' | 'robe';
  weaponType: 'spear' | 'sword' | 'bow' | 'guandao' | 'fan';
  headType: 'helmet' | 'turban' | 'hair' | 'crown';
  mount?: 'horse' | 'none';
  primaryColor: string;
  secondaryColor: string;
}

// ===== 재질 생성 (Toon Shader for Cartoon look) =====
function createToonMaterial(color: string): MeshToonMaterial {
  return new MeshToonMaterial({
    color: new Color(color),
    gradientMap: null, // 나중에 톤 맵핑 텍스처 추가 가능
  });
}

// ===== 메인 빌더 =====
export function buildDetailedUnit(config: DetailedUnitConfig): Group {
  const group = new Group();
  const scale = 1.0;

  const primaryMat = createToonMaterial(config.primaryColor);
  const secondaryMat = createToonMaterial(config.secondaryColor);
  const skinMat = createToonMaterial('#ffcc99');
  const metalMat = createToonMaterial('#8899a6');
  const woodMat = createToonMaterial('#8b5a2b');
  const darkMat = createToonMaterial('#333333');

  // === 기수/보병 조립 ===
  const human = new Group();

  // 1. 몸통 (갑옷 스타일에 따라 다름)
  if (config.armorType === 'heavy') {
    // 중갑: 두꺼운 상체 + 어깨 보호구
    const torsoGeo = new BoxGeometry(0.4, 0.5, 0.25);
    const torso = new Mesh(torsoGeo, primaryMat);
    torso.position.y = 0.5;
    human.add(torso);

    // 어깨 패드
    const padGeo = new BoxGeometry(0.2, 0.2, 0.25);
    const lPad = new Mesh(padGeo, primaryMat);
    lPad.position.set(0.25, 0.7, 0);
    lPad.rotation.z = -0.2;
    human.add(lPad);

    const rPad = new Mesh(padGeo, primaryMat);
    rPad.position.set(-0.25, 0.7, 0);
    rPad.rotation.z = 0.2;
    human.add(rPad);

    // 스커트 (갑옷 하의)
    const skirtGeo = new CylinderGeometry(0.22, 0.28, 0.4, 8);
    const skirt = new Mesh(skirtGeo, secondaryMat);
    skirt.position.y = 0.1;
    human.add(skirt);
  } else if (config.armorType === 'robe') {
    // 로브: 긴 옷
    const torsoGeo = new CylinderGeometry(0.15, 0.3, 0.9, 8);
    const torso = new Mesh(torsoGeo, primaryMat);
    torso.position.y = 0.45;
    human.add(torso);
    
    // 소매 (넓음)
    const sleeveGeo = new CylinderGeometry(0.08, 0.15, 0.4, 8);
    const lSleeve = new Mesh(sleeveGeo, primaryMat);
    lSleeve.position.set(0.25, 0.6, 0);
    lSleeve.rotation.z = -0.5;
    human.add(lSleeve);
    
    const rSleeve = new Mesh(sleeveGeo, primaryMat);
    rSleeve.position.set(-0.25, 0.6, 0);
    rSleeve.rotation.z = 0.5;
    human.add(rSleeve);
  } else {
    // 경갑: 기본 튜닉
    const torsoGeo = new BoxGeometry(0.3, 0.45, 0.2);
    const torso = new Mesh(torsoGeo, secondaryMat);
    torso.position.y = 0.5;
    human.add(torso);
    
    // 조끼
    const vestGeo = new BoxGeometry(0.32, 0.3, 0.22);
    const vest = new Mesh(vestGeo, primaryMat);
    vest.position.y = 0.55;
    human.add(vest);
  }

  // 2. 머리
  const headGeo = new SphereGeometry(0.12, 16, 16);
  const head = new Mesh(headGeo, skinMat);
  head.position.y = 0.85;
  human.add(head);

  // 투구/모자
  if (config.headType === 'helmet') {
    // 투구
    const helmGeo = new SphereGeometry(0.13, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2 + 0.2);
    const helm = new Mesh(helmGeo, metalMat);
    helm.position.y = 0.85;
    human.add(helm);
    // 장식 (술)
    const plumeGeo = new ConeGeometry(0.05, 0.2, 8);
    const plume = new Mesh(plumeGeo, primaryMat);
    plume.position.set(0, 1.05, 0);
    human.add(plume);
  } else if (config.headType === 'turban') {
    // 두건
    const turbanGeo = new SphereGeometry(0.135, 16, 8, 0, Math.PI * 2, 0, 1.5);
    const turban = new Mesh(turbanGeo, secondaryMat);
    turban.position.y = 0.86;
    turban.scale.y = 0.8;
    human.add(turban);
    // 매듭
    const knotGeo = new SphereGeometry(0.05, 8, 8);
    const knot = new Mesh(knotGeo, secondaryMat);
    knot.position.set(0.1, 0.85, -0.1);
    human.add(knot);
  } else if (config.headType === 'crown') {
    // 관모
    const crownGeo = new CylinderGeometry(0.08, 0.08, 0.1, 8);
    const crown = new Mesh(crownGeo, metalMat);
    crown.position.set(0, 1.0, 0);
    human.add(crown);
  } else {
    // 머리카락 (상투)
    const bunGeo = new SphereGeometry(0.06, 8, 8);
    const bun = new Mesh(bunGeo, darkMat);
    bun.position.set(0, 0.98, -0.05);
    human.add(bun);
  }

  // 3. 무기
  const weaponGroup = new Group();
  if (config.weaponType === 'spear') {
    // 창
    const shaft = new Mesh(new CylinderGeometry(0.015, 0.015, 1.8, 6), woodMat);
    const head = new Mesh(new ConeGeometry(0.04, 0.3, 4), metalMat);
    head.position.y = 0.9;
    weaponGroup.add(shaft, head);
    weaponGroup.position.set(0.3, 0.6, 0.2);
    weaponGroup.rotation.x = 0.2;
  } else if (config.weaponType === 'sword') {
    // 검
    const blade = new Mesh(new BoxGeometry(0.06, 0.7, 0.02), metalMat);
    blade.position.y = 0.35;
    const guard = new Mesh(new BoxGeometry(0.15, 0.03, 0.04), metalMat);
    const handle = new Mesh(new CylinderGeometry(0.02, 0.02, 0.15), woodMat);
    weaponGroup.add(blade, guard, handle);
    weaponGroup.position.set(0.3, 0.6, 0.2);
    weaponGroup.rotation.x = 0.5;
  } else if (config.weaponType === 'bow') {
    // 활
    const bowShape = new Shape();
    bowShape.absarc(0,0, 0.4, -Math.PI/2, Math.PI/2, false);
    // Simple curve approximation
    const bowGeo = new ExtrudeGeometry(bowShape, { depth: 0.03, bevelEnabled: false });
    const bow = new Mesh(bowGeo, woodMat);
    bow.rotation.z = -Math.PI/2;
    weaponGroup.add(bow);
    weaponGroup.position.set(0.3, 0.6, 0.2);
  } else if (config.weaponType === 'guandao') {
    // 청룡언월도 스타일
    const shaft = new Mesh(new CylinderGeometry(0.02, 0.02, 1.8, 6), woodMat);
    // 큰 날
    const bladeGeo = new BoxGeometry(0.25, 0.5, 0.02);
    const blade = new Mesh(bladeGeo, metalMat);
    blade.position.set(0.1, 0.7, 0);
    weaponGroup.add(shaft, blade);
    weaponGroup.position.set(0.3, 0.6, 0.2);
  } else if (config.weaponType === 'fan') {
    // 부채 (제갈량)
    const fanGeo = new ConeGeometry(0.2, 0.3, 8, 1, true);
    const fan = new Mesh(fanGeo, createToonMaterial('#ffffff'));
    fan.scale.z = 0.1;
    fan.position.y = 0.15;
    const handle = new Mesh(new CylinderGeometry(0.01, 0.01, 0.2), woodMat);
    weaponGroup.add(fan, handle);
    weaponGroup.position.set(0.3, 0.6, 0.2);
    weaponGroup.rotation.x = 0.3;
  }
  human.add(weaponGroup);

  // 4. 탈것 (말)
  if (config.mount === 'horse') {
    const horse = new Group();
    
    // 몸통
    const body = new Mesh(new BoxGeometry(0.4, 0.4, 0.9), createToonMaterial('#5d4037'));
    body.position.y = 0.6;
    horse.add(body);
    
    // 목 & 머리
    const neck = new Mesh(new BoxGeometry(0.2, 0.4, 0.3), createToonMaterial('#5d4037'));
    neck.position.set(0, 0.9, 0.4);
    neck.rotation.x = 0.5;
    horse.add(neck);
    
    const head = new Mesh(new BoxGeometry(0.2, 0.25, 0.35), createToonMaterial('#5d4037'));
    head.position.set(0, 1.1, 0.6);
    head.rotation.x = 0.2;
    horse.add(head);
    
    // 다리 4개
    const legGeo = new CylinderGeometry(0.06, 0.05, 0.6);
    const legPositions = [
      {x: -0.15, z: 0.3}, {x: 0.15, z: 0.3},
      {x: -0.15, z: -0.3}, {x: 0.15, z: -0.3}
    ];
    legPositions.forEach(pos => {
      const leg = new Mesh(legGeo, createToonMaterial('#5d4037'));
      leg.position.set(pos.x, 0.3, pos.z);
      horse.add(leg);
    });
    
    // 꼬리
    const tail = new Mesh(new CylinderGeometry(0.03, 0.08, 0.5), createToonMaterial('#1a1a1a'));
    tail.position.set(0, 0.6, -0.5);
    tail.rotation.x = -0.5;
    horse.add(tail);

    // 안장 (팀 색상)
    const saddle = new Mesh(new BoxGeometry(0.42, 0.1, 0.4), primaryMat);
    saddle.position.set(0, 0.82, 0);
    horse.add(saddle);

    group.add(horse);
    
    // 사람은 말 위에
    human.position.set(0, 0.7, 0);
    // 다리를 벌린 자세로 조정 필요하지만 여기선 생략 (치마가 가림)
  } else {
    // 보병 다리
    if (config.armorType !== 'robe') {
      const lLeg = new Mesh(new CylinderGeometry(0.07, 0.06, 0.45), darkMat);
      lLeg.position.set(0.12, 0.22, 0);
      const rLeg = new Mesh(new CylinderGeometry(0.07, 0.06, 0.45), darkMat);
      rLeg.position.set(-0.12, 0.22, 0);
      human.add(lLeg, rLeg);
    }
  }

  group.add(human);
  
  // 공성기 별도 처리
  if (config.type === 'siege') {
    group.clear(); // 사람 제거하고 기계만
    // 투석기 베이스
    const base = new Mesh(new BoxGeometry(0.8, 0.2, 1.0), woodMat);
    base.position.y = 0.3;
    
    // 바퀴
    const wheelGeo = new CylinderGeometry(0.25, 0.25, 0.1, 16);
    const w1 = new Mesh(wheelGeo, woodMat); w1.rotation.z=Math.PI/2; w1.position.set(0.45, 0.25, 0.3);
    const w2 = new Mesh(wheelGeo, woodMat); w2.rotation.z=Math.PI/2; w2.position.set(-0.45, 0.25, 0.3);
    const w3 = new Mesh(wheelGeo, woodMat); w3.rotation.z=Math.PI/2; w3.position.set(0.45, 0.25, -0.3);
    const w4 = new Mesh(wheelGeo, woodMat); w4.rotation.z=Math.PI/2; w4.position.set(-0.45, 0.25, -0.3);
    
    // 팔
    const arm = new Mesh(new BoxGeometry(0.1, 1.2, 0.1), woodMat);
    arm.position.set(0, 0.8, 0);
    arm.rotation.x = -0.5;
    
    group.add(base, w1, w2, w3, w4, arm);
  }

  return group;
}

// ===== 프리셋 =====
export const DETAILED_UNIT_PRESETS: Record<string, Partial<DetailedUnitConfig>> = {
  heavyInfantry: {
    type: 'infantry',
    armorType: 'heavy',
    headType: 'helmet',
    weaponType: 'spear',
    mount: 'none',
  },
  lightInfantry: {
    type: 'infantry',
    armorType: 'light',
    headType: 'turban',
    weaponType: 'sword',
    mount: 'none',
  },
  archer: {
    type: 'archer',
    armorType: 'light',
    headType: 'turban',
    weaponType: 'bow',
    mount: 'none',
  },
  cavalry: {
    type: 'cavalry',
    armorType: 'heavy',
    headType: 'helmet',
    weaponType: 'guandao',
    mount: 'horse',
  },
  general: {
    type: 'commander',
    armorType: 'robe',
    headType: 'crown',
    weaponType: 'fan', // 제갈량 스타일
    mount: 'none',
  },
  siege: {
    type: 'siege',
    armorType: 'light',
    headType: 'turban',
    weaponType: 'sword',
    mount: 'none',
  },
};

export const NATION_PALETTES: Record<string, { primary: string; secondary: string }> = {
  wei: { primary: '#1e40af', secondary: '#60a5fa' },
  shu: { primary: '#15803d', secondary: '#4ade80' },
  wu: { primary: '#b91c1c', secondary: '#fca5a5' },
  jin: { primary: '#7c3aed', secondary: '#c4b5fd' },
  yellow: { primary: '#ca8a04', secondary: '#fde047' },
  dong: { primary: '#374151', secondary: '#9ca3af' },
};

