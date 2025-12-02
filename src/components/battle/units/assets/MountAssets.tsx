import {
  Group,
  Mesh,
  BoxGeometry,
  CylinderGeometry,
  CapsuleGeometry,
  ConeGeometry,
  SphereGeometry,
  Shape,
  ExtrudeGeometry,
} from 'three';
import { MaterialFactory } from '../materials/MaterialFactory';

// 헬퍼: 바퀴 생성
function createWheel(radius: number, width: number): Mesh {
  const wheelGeo = new CylinderGeometry(radius, radius, width, 16);
  const wheelMat = MaterialFactory.get(MaterialFactory.PRESETS.WOOD, 'wood');
  const wheel = new Mesh(wheelGeo, wheelMat);
  wheel.rotation.z = Math.PI / 2;
  
  // 철제 테두리
  const rimGeo = new CylinderGeometry(radius + 0.01, radius + 0.01, width * 0.8, 16, 1, true);
  const rim = new Mesh(rimGeo, MaterialFactory.get(MaterialFactory.PRESETS.RUST, 'metal'));
  rim.rotation.z = Math.PI / 2;
  wheel.add(rim);
  
  return wheel;
}

export const MountAssets = {
  // M_01: 일반 말 [Voxel_Cavalry_Light]
  createHorse: (color: string = '#5D4037'): Group => {
    const group = new Group();
    const leatherMat = MaterialFactory.get(color, 'leather');
    const fabricMat = MaterialFactory.get('#1a1a1a', 'fabric'); 

    const chest = new Mesh(new CapsuleGeometry(0.32, 0.5, 4, 8), leatherMat);
    chest.rotation.z = Math.PI / 2;
    chest.position.z = 0.2;
    group.add(chest);

    const hips = new Mesh(new CapsuleGeometry(0.3, 0.45, 4, 8), leatherMat);
    hips.rotation.z = Math.PI / 2;
    hips.position.z = -0.35;
    group.add(hips);

    const neck = new Mesh(new CapsuleGeometry(0.18, 0.6, 4, 8), leatherMat);
    neck.position.set(0, 0.5, 0.55);
    neck.rotation.x = -Math.PI / 3.5;
    group.add(neck);

    const head = new Mesh(new BoxGeometry(0.18, 0.2, 0.38), leatherMat);
    head.position.set(0, 0.9, 0.75);
    head.rotation.x = 0.2;
    group.add(head);

    const legPositions = [
      {x: -0.22, z: 0.45, f: true}, {x: 0.22, z: 0.45, f: true},
      {x: -0.22, z: -0.45, f: false}, {x: 0.22, z: -0.45, f: false}
    ];

    legPositions.forEach(pos => {
      const upper = new Mesh(new CapsuleGeometry(0.09, 0.45, 4, 8), leatherMat);
      upper.position.set(pos.x, -0.1, pos.z);
      const lower = new Mesh(new CapsuleGeometry(0.06, 0.45, 4, 8), leatherMat);
      lower.position.y = -0.4;
      lower.rotation.x = pos.f ? -0.1 : 0.1;
      upper.add(lower);
      group.add(upper);
    });

    const tail = new Mesh(new CylinderGeometry(0.03, 0.1, 0.7, 8), fabricMat);
    tail.position.set(0, 0.2, -0.75);
    tail.rotation.x = -0.6;
    group.add(tail);

    const saddle = new Mesh(new BoxGeometry(0.45, 0.1, 0.45), MaterialFactory.get(MaterialFactory.PRESETS.LEATHER_BROWN, 'leather'));
    saddle.position.y = 0.35;
    group.add(saddle);

    group.position.y = 0.8;
    return group;
  },

  // M_04: 중장 마갑마 [Voxel_Cavalry_Cataphract]
  createArmoredHorse: (armorColor: string): Group => {
    const horse = MountAssets.createHorse('#1a1a1a');
    const armorMat = MaterialFactory.get(armorColor, 'metal');

    const barding = new Mesh(new BoxGeometry(0.8, 0.7, 1.5), armorMat);
    barding.position.y = 0.1;
    horse.add(barding);

    const neckArmor = new Mesh(new BoxGeometry(0.35, 0.6, 0.5), armorMat);
    neckArmor.position.set(0, 0.5, 0.5);
    neckArmor.rotation.x = -Math.PI / 3.5;
    horse.add(neckArmor);

    const faceArmor = new Mesh(new BoxGeometry(0.2, 0.22, 0.4), armorMat);
    faceArmor.position.set(0, 0.9, 0.75);
    faceArmor.rotation.x = 0.2;
    horse.add(faceArmor);

    return horse;
  },

  // M_06: 낙타 [Voxel_Camel_Rider]
  createCamel: (): Group => {
    const camel = MountAssets.createHorse('#c2b280');
    const humpMat = MaterialFactory.get('#c2b280', 'leather');

    const hump1 = new Mesh(new SphereGeometry(0.25, 8, 8), humpMat);
    hump1.position.set(0, 0.5, 0.2);
    camel.add(hump1);

    const hump2 = new Mesh(new SphereGeometry(0.25, 8, 8), humpMat);
    hump2.position.set(0, 0.5, -0.2);
    camel.add(hump2);
    return camel;
  },

  // M_07: 늑대 [Voxel_Beast_Rider]
  createWolf: (): Group => {
    const group = new Group();
    const furMat = MaterialFactory.get('#808080', 'fabric');

    const body = new Mesh(new CapsuleGeometry(0.25, 0.8, 4, 8), furMat);
    body.rotation.x = Math.PI / 2;
    group.add(body);

    const head = new Mesh(new BoxGeometry(0.2, 0.2, 0.25), furMat);
    head.position.set(0, 0.3, 0.5);
    group.add(head);

    const snout = new Mesh(new BoxGeometry(0.12, 0.1, 0.15), furMat);
    snout.position.set(0, 0.25, 0.65);
    group.add(snout);

    const legPositions = [
      {x: -0.15, z: 0.3}, {x: 0.15, z: 0.3},
      {x: -0.15, z: -0.3}, {x: 0.15, z: -0.3}
    ];
    legPositions.forEach(pos => {
      const leg = new Mesh(new CapsuleGeometry(0.06, 0.5, 4, 8), furMat);
      leg.position.set(pos.x, -0.3, pos.z);
      group.add(leg);
    });

    const tail = new Mesh(new CylinderGeometry(0.04, 0.08, 0.4), furMat);
    tail.position.set(0, 0, -0.5);
    tail.rotation.x = -0.5;
    group.add(tail);

    group.position.y = 0.5;
    return group;
  },

  // M_07b: 호랑이
  createTiger: (): Group => {
    const group = new Group();
    const skinMat = MaterialFactory.get('#FFA500', 'leather');

    const body = new Mesh(new CapsuleGeometry(0.35, 1.0, 4, 8), skinMat);
    body.rotation.x = Math.PI / 2;
    group.add(body);

    const head = new Mesh(new SphereGeometry(0.25, 8, 8), skinMat);
    head.position.set(0, 0.4, 0.6);
    group.add(head);

    const legPositions = [
      {x: -0.25, z: 0.4}, {x: 0.25, z: 0.4},
      {x: -0.25, z: -0.4}, {x: 0.25, z: -0.4}
    ];
    legPositions.forEach(pos => {
      const leg = new Mesh(new CapsuleGeometry(0.1, 0.6, 4, 8), skinMat);
      leg.position.set(pos.x, -0.3, pos.z);
      group.add(leg);
    });

    const tail = new Mesh(new CylinderGeometry(0.04, 0.06, 0.8), skinMat);
    tail.position.set(0, 0.2, -0.6);
    tail.rotation.x = -0.3;
    group.add(tail);

    group.position.y = 0.6;
    return group;
  },

  // M_08: 코끼리 [Voxel_Elephant_Siege]
  createElephant: (): Group => {
    const group = new Group();
    const skinMat = MaterialFactory.get('#808080', 'leather');

    const body = new Mesh(new BoxGeometry(1.2, 1.0, 1.8), skinMat);
    body.position.y = 0.5;
    group.add(body);

    const head = new Mesh(new BoxGeometry(0.8, 0.8, 0.8), skinMat);
    head.position.set(0, 0.8, 1.1);
    group.add(head);

    const trunk = new Mesh(new CylinderGeometry(0.1, 0.2, 1.0, 8), skinMat);
    trunk.position.set(0, 0.3, 1.6);
    trunk.rotation.x = 0.5;
    group.add(trunk);

    const tuskMat = MaterialFactory.get('#fffff0', 'skin');
    const lTusk = new Mesh(new ConeGeometry(0.08, 0.6, 8), tuskMat);
    lTusk.position.set(0.3, 0.6, 1.6);
    lTusk.rotation.x = 1.0;
    group.add(lTusk);
    const rTusk = new Mesh(new ConeGeometry(0.08, 0.6, 8), tuskMat);
    rTusk.position.set(-0.3, 0.6, 1.6);
    rTusk.rotation.x = 1.0;
    group.add(rTusk);

    const legGeo = new CylinderGeometry(0.25, 0.2, 1.2, 8);
    const legPositions = [
      {x: -0.4, z: 0.6}, {x: 0.4, z: 0.6},
      {x: -0.4, z: -0.6}, {x: 0.4, z: -0.6}
    ];
    legPositions.forEach(pos => {
      const leg = new Mesh(legGeo, skinMat);
      leg.position.set(pos.x, -0.1, pos.z);
      group.add(leg);
    });

    // 목재 망루 (Tower)
    const towerGeo = new BoxGeometry(0.8, 0.6, 0.8);
    const towerMat = MaterialFactory.get(MaterialFactory.PRESETS.WOOD, 'wood');
    const tower = new Mesh(towerGeo, towerMat);
    tower.position.y = 1.3;
    group.add(tower);

    group.position.y = 0.6;
    return group;
  },

  // M_09: 공성 수레 베이스
  createCart: (): Group => {
    const group = new Group();
    const woodMat = MaterialFactory.get(MaterialFactory.PRESETS.WOOD, 'wood');

    const base = new Mesh(new BoxGeometry(1.0, 0.1, 1.5), woodMat);
    group.add(base);

    const wheelPositions = [
      {x: -0.6, z: 0.5}, {x: 0.6, z: 0.5},
      {x: -0.6, z: -0.5}, {x: 0.6, z: -0.5}
    ];
    wheelPositions.forEach(pos => {
      const wheel = createWheel(0.3, 0.1);
      wheel.position.set(pos.x, 0, pos.z);
      wheel.rotation.z = Math.PI / 2;
      group.add(wheel);
    });

    return group;
  },

  // M_10: 충차 [Voxel_Machine_Ram]
  createRam: (): Group => {
    const group = MountAssets.createCart();
    const woodMat = MaterialFactory.get(MaterialFactory.PRESETS.WOOD, 'wood');
    const metalMat = MaterialFactory.get(MaterialFactory.PRESETS.IRON, 'metal');

    const roof = new Mesh(new BoxGeometry(1.0, 0.1, 1.6), woodMat);
    roof.position.y = 1.0;
    group.add(roof);

    const poleGeo = new CylinderGeometry(0.05, 0.05, 1.0);
    const poles = [
      {x: -0.4, z: 0.6}, {x: 0.4, z: 0.6},
      {x: -0.4, z: -0.6}, {x: 0.4, z: -0.6}
    ];
    poles.forEach(pos => {
      const pole = new Mesh(poleGeo, woodMat);
      pole.position.set(pos.x, 0.5, pos.z);
      group.add(pole);
    });

    const ram = new Mesh(new CylinderGeometry(0.15, 0.15, 2.0), woodMat);
    ram.rotation.x = Math.PI / 2;
    ram.position.y = 0.5;
    group.add(ram);

    // 용머리 (찌그러진 철제)
    const head = new Mesh(new ConeGeometry(0.2, 0.4, 8), metalMat);
    head.rotation.x = -Math.PI / 2;
    head.position.set(0, 0.5, 1.1);
    group.add(head);

    return group;
  },

  // M_11: 벽력거 (인력거) [Voxel_Machine_Trebuchet]
  createTrebuchet: (): Group => {
    const group = MountAssets.createCart();
    const woodMat = MaterialFactory.get(MaterialFactory.PRESETS.WOOD, 'wood');

    // 프레임
    const supportA = new Mesh(new BoxGeometry(0.1, 1.5, 0.1), woodMat);
    supportA.position.set(0.3, 0.75, 0);
    supportA.rotation.x = 0.2;
    group.add(supportA);
    
    const supportB = new Mesh(new BoxGeometry(0.1, 1.5, 0.1), woodMat);
    supportB.position.set(-0.3, 0.75, 0);
    supportB.rotation.x = 0.2;
    group.add(supportB);

    // 팔 (Arm)
    const arm = new Mesh(new BoxGeometry(0.1, 0.1, 3.0), woodMat);
    arm.position.set(0, 1.4, 0);
    arm.rotation.x = -0.3;
    group.add(arm);

    // 밧줄 뭉치 (Counterweight 대신)
    const ropes = new Mesh(new CylinderGeometry(0.2, 0.2, 0.4), MaterialFactory.get('#d4c4a8', 'fabric'));
    ropes.position.set(0, 1.2, -1.2);
    ropes.rotation.z = Math.PI / 2;
    group.add(ropes);

    return group;
  },

  // M_12: 공성탑 [Voxel_Machine_Tower]
  createTower: (): Group => {
    const group = MountAssets.createCart();
    const woodMat = MaterialFactory.get(MaterialFactory.PRESETS.WOOD, 'wood');
    // 젖은 가죽 텍스처 (어두운 가죽)
    const wetLeatherMat = MaterialFactory.get('#332211', 'leather');

    // 탑 본체 (가죽으로 덮임)
    const tower = new Mesh(new BoxGeometry(0.9, 3.0, 0.9), wetLeatherMat);
    tower.position.y = 1.5;
    group.add(tower);

    // 도개교 (다리)
    const bridge = new Mesh(new BoxGeometry(0.8, 1.2, 0.1), woodMat);
    bridge.position.set(0, 2.5, 0.5);
    bridge.rotation.x = -Math.PI / 4; 
    group.add(bridge);

    return group;
  },

  // [Voxel_Machine_Beast] 화수
  createFireBeast: (): Group => {
    const group = MountAssets.createCart();
    const bronzeMat = MaterialFactory.get('#CD7F32', 'metal'); // 청동
    const woodMat = MaterialFactory.get(MaterialFactory.PRESETS.WOOD, 'wood');

    // 몸통 (나무 뼈대)
    const body = new Mesh(new BoxGeometry(0.8, 0.8, 1.2), woodMat);
    body.position.y = 0.6;
    group.add(body);

    // 머리 (청동 괴수)
    const head = new Mesh(new BoxGeometry(0.6, 0.6, 0.6), bronzeMat);
    head.position.set(0, 0.8, 0.8);
    group.add(head);

    // 입 (화염 방사구 - 검게 그을림)
    const mouth = new Mesh(new CylinderGeometry(0.15, 0.15, 0.2), MaterialFactory.get('#111111', 'wood'));
    mouth.rotation.x = Math.PI / 2;
    mouth.position.set(0, 0.7, 1.15);
    group.add(mouth);

    return group;
  }
};
