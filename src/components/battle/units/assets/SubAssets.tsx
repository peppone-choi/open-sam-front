import {
  Group,
  Mesh,
  BoxGeometry,
  CylinderGeometry,
  SphereGeometry,
  Shape,
  ExtrudeGeometry,
} from 'three';
import { MaterialFactory } from '../materials/MaterialFactory';

export const SubAssets = {
  // S_01: 원형 방패 (등패)
  createRoundShield: (type: 'wood' | 'rattan' | 'metal' = 'wood'): Group => {
    const group = new Group();
    
    let mat;
    if (type === 'rattan') mat = MaterialFactory.get(MaterialFactory.PRESETS.BAMBOO, 'wood');
    else if (type === 'metal') mat = MaterialFactory.get(MaterialFactory.PRESETS.IRON, 'metal');
    else mat = MaterialFactory.get(MaterialFactory.PRESETS.WOOD, 'wood');

    // 방패 본체 (약간 둥근 형태)
    const shieldGeo = new SphereGeometry(0.25, 16, 16, 0, Math.PI * 2, 0, 0.5);
    shieldGeo.scale(1, 1, 0.2); // 납작하게
    const shield = new Mesh(shieldGeo, mat);
    group.add(shield);

    // 중앙 징 (Boss)
    const bossGeo = new SphereGeometry(0.08, 16, 8, 0, Math.PI * 2, 0, 1.0);
    bossGeo.scale(1, 1, 0.5);
    const boss = new Mesh(bossGeo, MaterialFactory.get(MaterialFactory.PRESETS.IRON, 'metal'));
    boss.position.z = 0.05;
    group.add(boss);

    return group;
  },

  // S_02: 사각 방패 (장방패)
  createRectShield: (color: string): Group => {
    const group = new Group();
    const woodMat = MaterialFactory.get(color, 'wood');
    const metalMat = MaterialFactory.get(MaterialFactory.PRESETS.IRON, 'metal');

    // 방패 본체 (긴 육각형 느낌의 사각)
    const shape = new Shape();
    const w = 0.2;
    const h = 0.35;
    shape.moveTo(-w, -h + 0.05);
    shape.lineTo(-w, h - 0.05);
    shape.lineTo(0, h);
    shape.lineTo(w, h - 0.05);
    shape.lineTo(w, -h + 0.05);
    shape.lineTo(0, -h);
    
    const shieldGeo = new ExtrudeGeometry(shape, { depth: 0.03, bevelEnabled: true, bevelSize: 0.01, bevelThickness: 0.01 });
    const shield = new Mesh(shieldGeo, woodMat);
    group.add(shield);

    // 테두리 장식 (중앙 십자)
    const decorV = new Mesh(new BoxGeometry(0.05, 0.6, 0.04), metalMat);
    decorV.position.z = 0.02;
    group.add(decorV);
    
    const decorH = new Mesh(new BoxGeometry(0.35, 0.05, 0.04), metalMat);
    decorH.position.z = 0.02;
    group.add(decorH);

    return group;
  },

  // S_03: 대방패 (타워)
  createTowerShield: (): Group => {
    const group = new Group();
    const metalMat = MaterialFactory.get(MaterialFactory.PRESETS.DARK_IRON, 'metal');

    // 거대한 철판
    const shieldShape = new Shape();
    const w = 0.25;
    const h = 0.5;
    shapeToRect(shieldShape, w, h); // 헬퍼 함수 사용
    
    const shieldGeo = new ExtrudeGeometry(shieldShape, { depth: 0.05, bevelEnabled: false });
    
    // 약간 굽은 형태를 위해 버텍스 조작 대신 3개 판을 각도 주어 배치
    const center = new Mesh(new BoxGeometry(0.3, 1.0, 0.05), metalMat);
    group.add(center);
    
    const left = new Mesh(new BoxGeometry(0.15, 1.0, 0.05), metalMat);
    left.position.set(-0.2, 0, 0.05);
    left.rotation.y = 0.3;
    group.add(left);
    
    const right = new Mesh(new BoxGeometry(0.15, 1.0, 0.05), metalMat);
    right.position.set(0.2, 0, 0.05);
    right.rotation.y = -0.3;
    group.add(right);

    return group;
  },

  // S_04: 화살통 (Quiver)
  createQuiver: (): Group => {
    const group = new Group();
    const leatherMat = MaterialFactory.get(MaterialFactory.PRESETS.LEATHER_BROWN, 'leather');
    const featherMat = MaterialFactory.get('#ffffff', 'fabric');

    // 통
    const tube = new Mesh(new CylinderGeometry(0.08, 0.06, 0.5, 8), leatherMat);
    group.add(tube);

    // 화살 깃들
    for (let i = 0; i < 5; i++) {
      const arrow = new Mesh(new BoxGeometry(0.02, 0.15, 0.02), featherMat);
      arrow.position.set(
        (Math.random() - 0.5) * 0.1,
        0.3,
        (Math.random() - 0.5) * 0.1
      );
      arrow.rotation.z = (Math.random() - 0.5) * 0.5;
      arrow.rotation.x = (Math.random() - 0.5) * 0.5;
      group.add(arrow);
    }

    return group;
  }
};

function shapeToRect(shape: Shape, w: number, h: number) {
  shape.moveTo(-w, -h);
  shape.lineTo(-w, h);
  shape.lineTo(w, h);
  shape.lineTo(w, -h);
}

