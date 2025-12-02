import {
  Group,
  Mesh,
  BoxGeometry,
  CylinderGeometry,
  CapsuleGeometry,
  SphereGeometry,
  Shape,
  ExtrudeGeometry,
  DoubleSide,
} from 'three';
import { MaterialFactory } from '../materials/MaterialFactory';

// 헬퍼 함수: 사지 생성 (Capsule + Joint)
function createLimb(
  upperLength: number, 
  lowerLength: number, 
  thickness: number, 
  material: any
): Group {
  const limb = new Group();

  const upper = new Mesh(new CapsuleGeometry(thickness, upperLength, 4, 8), material);
  upper.position.y = -upperLength / 2;
  limb.add(upper);

  const jointGroup = new Group();
  jointGroup.position.y = -upperLength;
  limb.add(jointGroup);

  const jointMesh = new Mesh(new SphereGeometry(thickness, 8, 8), material);
  jointGroup.add(jointMesh);

  const lower = new Mesh(new CapsuleGeometry(thickness * 0.85, lowerLength, 4, 8), material);
  lower.position.y = -lowerLength / 2;
  jointGroup.add(lower);

  return limb;
}

export const BodyAssets = {
  // 공통: 인체 기본형
  createBaseBody: (skinColor: string = MaterialFactory.PRESETS.SKIN): Group => {
    const group = new Group();
    const skinMat = MaterialFactory.get(skinColor, 'skin');

    const pelvis = new Mesh(new CylinderGeometry(0.13, 0.12, 0.15, 8), skinMat);
    pelvis.scale.set(1, 1, 0.8);
    pelvis.position.y = 0.95;
    group.add(pelvis);

    const torso = new Mesh(new CylinderGeometry(0.18, 0.14, 0.45, 8), skinMat);
    torso.scale.set(1, 1, 0.7);
    torso.position.y = 1.25;
    group.add(torso);

    const neck = new Mesh(new CylinderGeometry(0.05, 0.06, 0.1, 8), skinMat);
    neck.position.y = 1.5;
    group.add(neck);

    const lLeg = createLimb(0.45, 0.45, 0.065, skinMat);
    lLeg.position.set(0.12, 0.9, 0);
    lLeg.rotation.z = -0.05;
    group.add(lLeg);

    const rLeg = createLimb(0.45, 0.45, 0.065, skinMat);
    rLeg.position.set(-0.12, 0.9, 0);
    rLeg.rotation.z = 0.05;
    group.add(rLeg);

    const lArm = createLimb(0.35, 0.35, 0.05, skinMat);
    lArm.position.set(0.22, 1.4, 0);
    lArm.rotation.z = -0.2;
    group.add(lArm);

    const rArm = createLimb(0.35, 0.35, 0.05, skinMat);
    rArm.position.set(-0.22, 1.4, 0);
    rArm.rotation.z = 0.2;
    group.add(rArm);

    return group;
  },

  // B_01: 누더기 (Rag Poor)
  createRags: (color: string): Group => {
    const group = new Group();
    const fabricMat = MaterialFactory.get(color || '#8b7355', 'fabric');

    const tunic = new Mesh(new CylinderGeometry(0.19, 0.22, 0.6, 8), fabricMat);
    tunic.position.y = 1.2;
    group.add(tunic);

    const lPants = new Mesh(new CylinderGeometry(0.07, 0.06, 0.4, 8), fabricMat);
    lPants.position.set(0.12, 0.7, 0);
    lPants.rotation.z = -0.05;
    group.add(lPants);

    const rPants = new Mesh(new CylinderGeometry(0.07, 0.06, 0.4, 8), fabricMat);
    rPants.position.set(-0.12, 0.7, 0);
    rPants.rotation.z = 0.05;
    group.add(rPants);

    return group;
  },

  // B_02: 양당개 (Liang-dang) - 조끼형 찰갑
  createLiangDang: (primaryColor: string): Group => {
    const group = new Group();
    const armorMat = MaterialFactory.get(primaryColor, 'leather'); // 붉은 옻칠
    const fabricMat = MaterialFactory.get('#333333', 'fabric'); // 속옷

    // 속옷
    const tunic = new Mesh(new CylinderGeometry(0.18, 0.2, 0.5, 8), fabricMat);
    tunic.position.y = 1.2;
    group.add(tunic);

    // 양당개 (앞판)
    const frontPlate = new Mesh(new BoxGeometry(0.32, 0.4, 0.05), armorMat);
    frontPlate.position.set(0, 1.25, 0.1);
    group.add(frontPlate);

    // 양당개 (뒷판)
    const backPlate = new Mesh(new BoxGeometry(0.32, 0.4, 0.05), armorMat);
    backPlate.position.set(0, 1.25, -0.1);
    group.add(backPlate);

    // 어깨 끈
    const lStrap = new Mesh(new BoxGeometry(0.08, 0.02, 0.25), armorMat);
    lStrap.position.set(0.1, 1.45, 0);
    group.add(lStrap);

    const rStrap = new Mesh(new BoxGeometry(0.08, 0.02, 0.25), armorMat);
    rStrap.position.set(-0.1, 1.45, 0);
    group.add(rStrap);

    return group;
  },

  // B_04: 전신 흑철갑 (Heavy Black) - 함진영
  createHeavyBlackArmor: (): Group => {
    const group = new Group();
    const armorMat = MaterialFactory.get('#111111', 'metal');
    const skirtMat = MaterialFactory.get('#111111', 'leather');

    // 흉갑 (두꺼움)
    const chest = new Mesh(new BoxGeometry(0.4, 0.5, 0.25), armorMat);
    chest.position.y = 1.25;
    group.add(chest);

    // 어깨 견갑 (대형)
    const lPad = new Mesh(new BoxGeometry(0.2, 0.25, 0.2), armorMat);
    lPad.position.set(0.25, 1.4, 0);
    lPad.rotation.z = -0.3;
    group.add(lPad);

    const rPad = new Mesh(new BoxGeometry(0.2, 0.25, 0.2), armorMat);
    rPad.position.set(-0.25, 1.4, 0);
    rPad.rotation.z = 0.3;
    group.add(rPad);

    // 스커트 (긴 찰갑)
    const skirtGeo = new CylinderGeometry(0.22, 0.3, 0.5, 8, 1, true);
    // MaterialFactory에서 DoubleSide 처리됨
    const skirt = new Mesh(skirtGeo, skirtMat);
    skirt.position.y = 0.75;
    group.add(skirt);

    return group;
  },

  // B_XX: 근육 경갑 (Muscle Light) - 참마도수
  createMuscleLight: (): Group => {
    const group = new Group();
    const armorMat = MaterialFactory.get(MaterialFactory.PRESETS.LEATHER_BROWN, 'leather');
    
    // 흉갑 (작음, 근육 노출)
    const chest = new Mesh(new CylinderGeometry(0.2, 0.16, 0.3, 8), armorMat);
    chest.position.y = 1.25;
    group.add(chest);

    // 허리 보호대
    const belt = new Mesh(new CylinderGeometry(0.18, 0.18, 0.1, 8), armorMat);
    belt.position.y = 0.9;
    group.add(belt);

    // 팔뚝 보호대 (Vambrace)
    const lArm = new Mesh(new CylinderGeometry(0.06, 0.05, 0.2), armorMat);
    lArm.position.set(0.35, 1.15, 0.1); // 팔 위치 추정
    lArm.rotation.z = -0.2;
    lArm.rotation.x = 0.4;
    group.add(lArm);

    return group;
  },

  // B_03: 정규군 찰갑 (Lamellar) - 재사용
  createLamellarArmor: (primaryColor: string): Group => {
    const group = new Group();
    const armorMat = MaterialFactory.get(primaryColor, 'leather');
    const skirtMat = MaterialFactory.get(primaryColor, 'fabric');

    const chest = new Mesh(new BoxGeometry(0.36, 0.5, 0.22), armorMat);
    chest.position.y = 1.25;
    group.add(chest);

    const shoulderShape = new Shape();
    shoulderShape.moveTo(0, 0);
    shoulderShape.quadraticCurveTo(0.1, 0.1, 0.2, 0);
    shoulderShape.lineTo(0.2, -0.25);
    shoulderShape.quadraticCurveTo(0.1, -0.2, 0, -0.25);
    
    const shoulderGeo = new ExtrudeGeometry(shoulderShape, { depth: 0.02, bevelEnabled: false });
    
    const lPad = new Mesh(shoulderGeo, armorMat);
    lPad.position.set(0.2, 1.45, 0);
    lPad.rotation.y = -Math.PI/2;
    lPad.rotation.z = -0.3;
    group.add(lPad);

    const rPad = new Mesh(shoulderGeo, armorMat);
    rPad.position.set(-0.2, 1.45, 0);
    rPad.rotation.y = -Math.PI/2;
    rPad.rotation.z = 0.3;
    group.add(rPad);

    const skirtGeo = new CylinderGeometry(0.2, 0.25, 0.4, 8, 1, true);
    const skirt = new Mesh(skirtGeo, skirtMat);
    skirt.position.y = 0.8;
    group.add(skirt);

    return group;
  },

  // B_05: 전신 판금갑 (Plate)
  createPlateArmor: (color: string): Group => {
    const group = new Group();
    const metalMat = MaterialFactory.get(MaterialFactory.PRESETS.IRON, 'metal');

    const chest = new Mesh(new CylinderGeometry(0.2, 0.18, 0.5, 8), metalMat);
    chest.position.y = 1.25;
    chest.scale.set(1, 1, 0.8);
    group.add(chest);

    const shoulderGeo = new SphereGeometry(0.12, 8, 8, 0, Math.PI, 0, Math.PI/2);
    const lShoulder = new Mesh(shoulderGeo, metalMat);
    lShoulder.position.set(0.25, 1.4, 0);
    lShoulder.rotation.z = -0.5;
    group.add(lShoulder);

    const rShoulder = new Mesh(shoulderGeo, metalMat);
    rShoulder.position.set(-0.25, 1.4, 0);
    rShoulder.rotation.z = 0.5;
    group.add(rShoulder);

    const armGuard = new Mesh(new CylinderGeometry(0.06, 0.05, 0.25), metalMat);
    armGuard.position.set(0.28, 1.15, 0);
    armGuard.rotation.z = -0.2;
    group.add(armGuard);

    return group;
  },

  // B_07: 호복 (Coat)
  createCoat: (color: string): Group => {
    const group = new Group();
    const coatMat = MaterialFactory.get(color, 'leather');
    const furMat = MaterialFactory.get('#ffffff', 'fabric');

    const coat = new Mesh(new CylinderGeometry(0.2, 0.3, 0.8, 8), coatMat);
    coat.position.y = 1.1;
    group.add(coat);

    // 털 카라
    const collar = new Mesh(new BoxGeometry(0.4, 0.1, 0.4), furMat); // Torus 대신 Box로 간소화
    collar.position.y = 1.45;
    group.add(collar);

    return group;
  },

  // B_08: 등갑
  createRattanArmor: (): Group => {
    const group = new Group();
    const rattanMat = MaterialFactory.get('#8B5A2B', 'wood'); 

    const body = new Mesh(new CylinderGeometry(0.22, 0.2, 0.5, 8), rattanMat);
    body.position.y = 1.25;
    group.add(body);

    const shoulderGeo = new SphereGeometry(0.12, 8, 8, 0, Math.PI, 0, Math.PI/2);
    const lPad = new Mesh(shoulderGeo, rattanMat);
    lPad.position.set(0.22, 1.4, 0);
    lPad.rotation.z = -0.5;
    group.add(lPad);

    const rPad = new Mesh(shoulderGeo, rattanMat);
    rPad.position.set(-0.22, 1.4, 0);
    rPad.rotation.z = 0.5;
    group.add(rPad);

    return group;
  },

  // B_09: 도포
  createRobe: (color: string): Group => {
    const group = new Group();
    const mat = MaterialFactory.get(color, 'fabric');
    const accentMat = MaterialFactory.get(MaterialFactory.PRESETS.GOLD, 'gold');

    const robe = new Mesh(new CylinderGeometry(0.18, 0.35, 1.1, 8), mat);
    robe.position.y = 0.95;
    group.add(robe);

    const sleeveGeo = new CylinderGeometry(0.08, 0.18, 0.45, 8);
    const lSleeve = new Mesh(sleeveGeo, mat);
    lSleeve.position.set(0.3, 1.3, 0);
    lSleeve.rotation.z = -0.6;
    group.add(lSleeve);

    const rSleeve = new Mesh(sleeveGeo, mat);
    rSleeve.position.set(-0.3, 1.3, 0);
    rSleeve.rotation.z = 0.6;
    group.add(rSleeve);

    const belt = new Mesh(new BoxGeometry(0.38, 0.1, 0.22), accentMat);
    belt.position.y = 0.88;
    group.add(belt);

    return group;
  },
  
  // B_02: 가죽 흉갑 (Leather Breastplate)
  createLeatherArmor: (color: string): Group => {
    const group = new Group();
    const leatherMat = MaterialFactory.get(color, 'leather');
    const fabricMat = MaterialFactory.get('#5c4033', 'fabric'); 

    const tunic = new Mesh(new BoxGeometry(0.32, 0.6, 0.18), fabricMat);
    tunic.position.y = 1.1;
    group.add(tunic);

    const vest = new Mesh(new CylinderGeometry(0.2, 0.18, 0.4, 8), leatherMat);
    vest.position.y = 1.3;
    vest.scale.z = 0.8;
    group.add(vest);

    return group;
  }
};
