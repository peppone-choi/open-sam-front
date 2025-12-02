import {
  Group,
  Mesh,
  BoxGeometry,
  CylinderGeometry,
  Shape,
  ExtrudeGeometry,
  SphereGeometry,
} from 'three';
import { MaterialFactory } from '../materials/MaterialFactory';

export const WeaponAssets = {
  // W_01: 환수도
  createDao: (): Group => {
    const group = new Group();
    const metalMat = MaterialFactory.get(MaterialFactory.PRESETS.STEEL, 'metal');
    const woodMat = MaterialFactory.get(MaterialFactory.PRESETS.WOOD_DARK, 'wood');

    const bladeShape = new Shape();
    bladeShape.moveTo(0, 0);
    bladeShape.lineTo(0.04, 0.6);
    bladeShape.lineTo(0.02, 0.65);
    bladeShape.lineTo(-0.02, 0);
    const bladeGeo = new ExtrudeGeometry(bladeShape, { depth: 0.01, bevelEnabled: false });
    const blade = new Mesh(bladeGeo, metalMat);
    blade.position.y = 0.15;
    group.add(blade);

    const handle = new Mesh(new CylinderGeometry(0.015, 0.015, 0.15), woodMat);
    group.add(handle);

    const ring = new Mesh(new CylinderGeometry(0.025, 0.025, 0.01, 8, 1, true), metalMat);
    ring.position.y = -0.08;
    ring.rotation.x = Math.PI / 2;
    group.add(ring);

    return group;
  },

  // W_02: 죽창
  createBambooSpear: (): Group => {
    const group = new Group();
    const bambooMat = MaterialFactory.get(MaterialFactory.PRESETS.BAMBOO, 'wood');
    const burnedMat = MaterialFactory.get('#333333', 'wood');

    const shaft = new Mesh(new CylinderGeometry(0.012, 0.015, 2.0, 6), bambooMat);
    group.add(shaft);

    const tip = new Mesh(new CylinderGeometry(0, 0.012, 0.3, 6), burnedMat);
    tip.position.y = 1.15;
    group.add(tip);

    return group;
  },

  // W_03: 정규 창
  createSpear: (): Group => {
    const group = new Group();
    const woodMat = MaterialFactory.get(MaterialFactory.PRESETS.WOOD, 'wood');
    const metalMat = MaterialFactory.get(MaterialFactory.PRESETS.IRON, 'metal');

    const shaft = new Mesh(new CylinderGeometry(0.015, 0.015, 2.2, 8), woodMat);
    group.add(shaft);

    const head = new Mesh(new CylinderGeometry(0, 0.03, 0.4, 4), metalMat);
    head.position.y = 1.3;
    group.add(head);

    const tassel = new Mesh(new CylinderGeometry(0.04, 0.01, 0.15, 8), MaterialFactory.get(MaterialFactory.PRESETS.RED_TASSEL, 'fabric'));
    tassel.position.y = 1.1;
    group.add(tassel);

    return group;
  },

  // W_04: 극 (Halberd)
  createHalberd: (): Group => {
    const group = new Group();
    const woodMat = MaterialFactory.get(MaterialFactory.PRESETS.WOOD, 'wood');
    const metalMat = MaterialFactory.get(MaterialFactory.PRESETS.IRON, 'metal');

    const shaft = new Mesh(new CylinderGeometry(0.015, 0.015, 2.2, 8), woodMat);
    group.add(shaft);

    const spearHead = new Mesh(new CylinderGeometry(0, 0.025, 0.3, 4), metalMat);
    spearHead.position.y = 1.25;
    group.add(spearHead);

    const bladeShape = new Shape();
    bladeShape.moveTo(0, 0);
    bladeShape.lineTo(0.15, 0.1);
    bladeShape.lineTo(0.15, -0.1);
    bladeShape.lineTo(0, 0);
    const bladeGeo = new ExtrudeGeometry(bladeShape, { depth: 0.01, bevelEnabled: false });
    const blade = new Mesh(bladeGeo, metalMat);
    blade.position.set(0, 1.15, -0.005);
    group.add(blade);

    return group;
  },

  // W_05: 장창 (Pike) - 4m급
  createPike: (): Group => {
    const group = new Group();
    const woodMat = MaterialFactory.get(MaterialFactory.PRESETS.WOOD, 'wood');
    const metalMat = MaterialFactory.get(MaterialFactory.PRESETS.STEEL, 'metal');

    // 매우 긴 자루
    const shaft = new Mesh(new CylinderGeometry(0.015, 0.02, 4.0, 8), woodMat);
    group.add(shaft);

    // 작은 창날
    const head = new Mesh(new CylinderGeometry(0, 0.02, 0.2, 4), metalMat);
    head.position.y = 2.1;
    group.add(head);

    return group;
  },

  // W_06: 기병창 (Lance)
  createLance: (): Group => {
    const group = new Group();
    const woodMat = MaterialFactory.get(MaterialFactory.PRESETS.WOOD_DARK, 'wood');
    const metalMat = MaterialFactory.get(MaterialFactory.PRESETS.STEEL, 'metal');

    const shaft = new Mesh(new CylinderGeometry(0.02, 0.03, 3.0, 8), woodMat);
    group.add(shaft);

    const head = new Mesh(new CylinderGeometry(0, 0.04, 0.6, 4), metalMat);
    head.position.y = 1.8;
    group.add(head);

    return group;
  },

  // W_07: 도끼 (Axe)
  createAxe: (): Group => {
    const group = new Group();
    const woodMat = MaterialFactory.get(MaterialFactory.PRESETS.WOOD, 'wood');
    const metalMat = MaterialFactory.get(MaterialFactory.PRESETS.IRON, 'metal');

    const handle = new Mesh(new CylinderGeometry(0.02, 0.02, 0.8), woodMat);
    group.add(handle);

    const bladeShape = new Shape();
    bladeShape.moveTo(0, -0.1);
    bladeShape.quadraticCurveTo(0.2, -0.2, 0.25, 0);
    bladeShape.quadraticCurveTo(0.2, 0.2, 0, 0.1);
    const bladeGeo = new ExtrudeGeometry(bladeShape, { depth: 0.03, bevelEnabled: false });
    const blade = new Mesh(bladeGeo, metalMat);
    blade.position.set(0, 0.35, -0.015);
    group.add(blade);

    return group;
  },

  // W_08: 철퇴 (Mace)
  createMace: (): Group => {
    const group = new Group();
    const metalMat = MaterialFactory.get(MaterialFactory.PRESETS.IRON, 'metal');
    const woodMat = MaterialFactory.get(MaterialFactory.PRESETS.WOOD_DARK, 'wood');

    const handle = new Mesh(new CylinderGeometry(0.02, 0.02, 0.7), woodMat);
    group.add(handle);

    const head = new Mesh(new BoxGeometry(0.15, 0.15, 0.15), metalMat);
    head.position.y = 0.3;
    const spike = new Mesh(new BoxGeometry(0.22, 0.22, 0.22), metalMat);
    spike.position.y = 0.3;
    spike.rotation.set(Math.PI/4, Math.PI/4, 0);
    group.add(head, spike);

    return group;
  },

  // W_09: 쌍검 (Dual Swords)
  createDualSwords: (): Group => {
    const group = new Group();
    // 왼손, 오른손용 두 개의 검 그룹
    // 여기서는 하나의 Group에 두 개를 배치하지 않고, RealismUnitBuilder에서 두 번 호출하여 양손에 쥐여주는 것이 맞음.
    // 따라서 단일 검 생성 함수(createDao)를 재사용하되, 조금 더 얇고 날카롭게 만듦.
    
    const metalMat = MaterialFactory.get(MaterialFactory.PRESETS.STEEL, 'metal');
    const woodMat = MaterialFactory.get(MaterialFactory.PRESETS.WOOD_DARK, 'wood');

    const bladeShape = new Shape();
    bladeShape.moveTo(0, 0);
    bladeShape.lineTo(0.03, 0.7); // 더 김
    bladeShape.lineTo(0, 0.75);
    bladeShape.lineTo(-0.03, 0.7);
    bladeShape.lineTo(0, 0);
    
    const bladeGeo = new ExtrudeGeometry(bladeShape, { depth: 0.008, bevelEnabled: false });
    const blade = new Mesh(bladeGeo, metalMat);
    blade.position.y = 0.15;
    group.add(blade);

    const handle = new Mesh(new CylinderGeometry(0.012, 0.012, 0.15), woodMat);
    group.add(handle);

    return group;
  },

  // W_10: 참마도 (Great Sword)
  createGreatSword: (): Group => {
    const group = new Group();
    const metalMat = MaterialFactory.get(MaterialFactory.PRESETS.STEEL, 'metal');
    const leatherMat = MaterialFactory.get(MaterialFactory.PRESETS.LEATHER_BLACK, 'leather');

    // 거대한 검신
    const blade = new Mesh(new BoxGeometry(0.12, 1.5, 0.02), metalMat);
    blade.position.y = 0.9;
    group.add(blade);

    // 긴 손잡이
    const handle = new Mesh(new CylinderGeometry(0.025, 0.025, 0.5), leatherMat);
    handle.position.y = -0.1;
    group.add(handle);

    // 가드
    const guard = new Mesh(new BoxGeometry(0.3, 0.05, 0.05), metalMat);
    guard.position.y = 0.15;
    group.add(guard);

    return group;
  },

  // W_11: 언월도
  createGuandao: (): Group => {
    const group = new Group();
    const woodMat = MaterialFactory.get(MaterialFactory.PRESETS.WOOD_DARK, 'wood');
    const metalMat = MaterialFactory.get(MaterialFactory.PRESETS.STEEL, 'metal');

    const shaft = new Mesh(new CylinderGeometry(0.025, 0.025, 2.0, 8), woodMat);
    group.add(shaft);

    const bladeShape = new Shape();
    bladeShape.moveTo(0, 0);
    bladeShape.quadraticCurveTo(0.2, 0.2, 0.15, 0.7);
    bladeShape.lineTo(-0.05, 0.7);
    bladeShape.lineTo(-0.05, 0);
    const bladeGeo = new ExtrudeGeometry(bladeShape, { depth: 0.015, bevelEnabled: false });
    const blade = new Mesh(bladeGeo, metalMat);
    blade.position.set(0, 0.8, -0.0075);
    group.add(blade);

    return group;
  },

  // W_12: 활
  createBow: (): Group => {
    const group = new Group();
    const woodMat = MaterialFactory.get(MaterialFactory.PRESETS.WOOD, 'wood');
    const stringMat = MaterialFactory.get('#eeeeee', 'fabric');
    
    const bowShape = new Shape();
    bowShape.moveTo(0, 0);
    bowShape.lineTo(0.02, 0);
    bowShape.bezierCurveTo(0.05, 0.2, 0.15, 0.4, 0.1, 0.6);
    bowShape.bezierCurveTo(0.08, 0.7, 0.02, 0.75, -0.05, 0.8);
    bowShape.lineTo(-0.07, 0.8);
    bowShape.bezierCurveTo(0.0, 0.75, 0.06, 0.7, 0.08, 0.6);
    bowShape.bezierCurveTo(0.13, 0.4, 0.03, 0.2, 0, 0);

    bowShape.lineTo(0.02, 0);
    bowShape.bezierCurveTo(0.05, -0.2, 0.15, -0.4, 0.1, -0.6);
    bowShape.bezierCurveTo(0.08, -0.7, 0.02, -0.75, -0.05, -0.8);
    bowShape.lineTo(-0.07, -0.8);
    bowShape.bezierCurveTo(0.0, -0.75, 0.06, -0.7, 0.08, -0.6);
    bowShape.bezierCurveTo(0.13, -0.4, 0.03, -0.2, 0, 0);

    const bowGeo = new ExtrudeGeometry(bowShape, { depth: 0.03, bevelEnabled: false });
    const bow = new Mesh(bowGeo, woodMat);
    bow.rotation.y = Math.PI / 2;
    group.add(bow);

    const string = new Mesh(new CylinderGeometry(0.002, 0.002, 1.5, 4), stringMat);
    string.position.set(-0.06, 0, 0);
    group.add(string);

    return group;
  },

  // W_14: 쇠뇌
  createCrossbow: (): Group => {
    const group = new Group();
    const woodMat = MaterialFactory.get(MaterialFactory.PRESETS.WOOD_DARK, 'wood');
    const metalMat = MaterialFactory.get(MaterialFactory.PRESETS.IRON, 'metal');

    const stock = new Mesh(new BoxGeometry(0.08, 0.06, 0.6), woodMat);
    group.add(stock);

    const bowLimb = new Mesh(new BoxGeometry(0.5, 0.04, 0.05), woodMat);
    bowLimb.position.set(0, 0, 0.25);
    bowLimb.scale.z = 1.2;
    group.add(bowLimb);

    const trigger = new Mesh(new BoxGeometry(0.04, 0.08, 0.04), metalMat);
    trigger.position.set(0, 0.05, -0.1);
    group.add(trigger);

    return group;
  },

  // W_15: 연노 (Repeater Crossbow)
  createRepeater: (): Group => {
    const group = WeaponAssets.createCrossbow(); // 기본 쇠뇌 베이스
    const woodMat = MaterialFactory.get(MaterialFactory.PRESETS.WOOD, 'wood');
    const metalMat = MaterialFactory.get(MaterialFactory.PRESETS.IRON, 'metal');

    // 탄창 박스 (상단)
    const magazine = new Mesh(new BoxGeometry(0.08, 0.15, 0.3), woodMat);
    magazine.position.set(0, 0.12, 0.1);
    group.add(magazine);

    // 장전 레버
    const lever = new Mesh(new BoxGeometry(0.02, 0.2, 0.02), metalMat);
    lever.position.set(0, 0.2, -0.1);
    lever.rotation.x = -0.5;
    group.add(lever);

    return group;
  },

  // W_16: 투석구 (Sling)
  createSling: (): Group => {
    const group = new Group();
    const leatherMat = MaterialFactory.get(MaterialFactory.PRESETS.LEATHER_BROWN, 'leather');
    
    // 끈 (회전하는 모습 표현을 위해 원형 궤적)
    const stringShape = new Shape();
    stringShape.absarc(0, 0, 0.3, 0, Math.PI * 1.5, false);
    const stringGeo = new ExtrudeGeometry(stringShape, { depth: 0.01, bevelEnabled: false });
    const string = new Mesh(stringGeo, leatherMat);
    string.rotation.x = Math.PI / 2;
    group.add(string);

    // 돌 (끝부분)
    const stone = new Mesh(new SphereGeometry(0.05, 8, 8), MaterialFactory.get('#888888', 'metal'));
    stone.position.set(0.3, 0, 0);
    group.add(stone);

    return group;
  },

  // W_17: 바람총 (Blowgun)
  createBlowgun: (): Group => {
    const group = new Group();
    const bambooMat = MaterialFactory.get(MaterialFactory.PRESETS.BAMBOO, 'wood');

    // 긴 대나무 관
    const tube = new Mesh(new CylinderGeometry(0.015, 0.015, 1.2, 8), bambooMat);
    group.add(tube);

    // 입 대는 부분 (약간 두껍게)
    const mouthPiece = new Mesh(new CylinderGeometry(0.02, 0.02, 0.05), bambooMat);
    mouthPiece.position.y = -0.55;
    group.add(mouthPiece);

    return group;
  },

  // W_18: 부채
  createFan: (): Group => {
    const group = new Group();
    const featherMat = MaterialFactory.get('#ffffff', 'fabric');
    const woodMat = MaterialFactory.get(MaterialFactory.PRESETS.WOOD, 'wood');

    const handle = new Mesh(new CylinderGeometry(0.01, 0.01, 0.25), woodMat);
    group.add(handle);

    const fanShape = new Shape();
    fanShape.moveTo(0, 0);
    fanShape.lineTo(0.2, 0.3);
    fanShape.quadraticCurveTo(0, 0.4, -0.2, 0.3);
    fanShape.lineTo(0, 0);
    
    const fanGeo = new ExtrudeGeometry(fanShape, { depth: 0.01, bevelEnabled: false });
    const fan = new Mesh(fanGeo, featherMat);
    fan.position.y = 0.1;
    fan.position.z = -0.005;
    group.add(fan);

    return group;
  }
};
