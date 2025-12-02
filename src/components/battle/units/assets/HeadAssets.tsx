import {
  Group,
  Mesh,
  SphereGeometry,
  CylinderGeometry,
  ConeGeometry,
  BoxGeometry,
  TorusGeometry,
} from 'three';
import { MaterialFactory } from '../materials/MaterialFactory';

export const HeadAssets = {
  // H_01: 민초의 두건 (헝클어진 머리 + 낡은 천)
  createPeasantHead: (): Group => {
    const group = new Group();
    const headGeo = new SphereGeometry(0.09, 16, 16);
    const head = new Mesh(headGeo, MaterialFactory.get(MaterialFactory.PRESETS.SKIN, 'skin'));
    group.add(head);
    
    const hoodGeo = new SphereGeometry(0.095, 16, 16, 0, Math.PI * 2, 0, 1.2);
    const hood = new Mesh(hoodGeo, MaterialFactory.get('#8b7355', 'fabric'));
    hood.rotation.x = -0.2;
    group.add(hood);
    
    const knotGeo = new BoxGeometry(0.08, 0.04, 0.04);
    const knot = new Mesh(knotGeo, MaterialFactory.get('#8b7355', 'fabric'));
    knot.position.set(0, 0, -0.09);
    group.add(knot);
    return group;
  },

  // H_00: 헝클어진 머리 (도민병) [Voxel_Human_Poor]
  createMessyHair: (): Group => {
    const group = new Group();
    const headGeo = new SphereGeometry(0.09, 16, 16);
    headGeo.scale(0.9, 1.1, 1.0); // 뺨이 홀쭉한 텍스처 (형태로 표현)
    const head = new Mesh(headGeo, MaterialFactory.get(MaterialFactory.PRESETS.SKIN, 'skin'));
    group.add(head);

    const hairMat = MaterialFactory.get('#1a1a1a', 'fabric');
    for(let i=0; i<6; i++) {
      const hair = new Mesh(new TorusGeometry(0.09, 0.02, 8, 16, Math.PI), hairMat);
      hair.rotation.set(Math.random(), Math.random(), Math.random());
      group.add(hair);
    }
    return group;
  },

  // H_02: 무변 (납작한 가죽 모자) [Voxel_Human_Standard]
  createWuBian: (): Group => {
    const group = new Group();
    const head = new Mesh(new SphereGeometry(0.09, 16, 16), MaterialFactory.get(MaterialFactory.PRESETS.SKIN, 'skin'));
    group.add(head);

    const hatGeo = new CylinderGeometry(0.1, 0.1, 0.05, 16); // 납작한 모자
    const hat = new Mesh(hatGeo, MaterialFactory.get('#1a1a1a', 'leather'));
    hat.position.y = 0.08;
    group.add(hat);
    return group;
  },

  // H_03: 정규군 철모 (목 가리개 포함)
  createSoldierHelmet: (primaryColor: string): Group => {
    const group = new Group();
    const helmGeo = new SphereGeometry(0.1, 16, 16, 0, Math.PI * 2, 0, 1.6);
    helmGeo.scale(1, 0.8, 1.1);
    const helm = new Mesh(helmGeo, MaterialFactory.get(MaterialFactory.PRESETS.IRON, 'metal'));
    group.add(helm);
    
    const tasselGeo = new CylinderGeometry(0.01, 0.03, 0.12, 8);
    const tassel = new Mesh(tasselGeo, MaterialFactory.get(MaterialFactory.PRESETS.RED_TASSEL, 'fabric'));
    tassel.position.y = 0.1;
    group.add(tassel);
    
    // Aventail (목 가리개)
    const aventailGeo = new CylinderGeometry(0.11, 0.12, 0.1, 16, 1, true);
    const aventail = new Mesh(aventailGeo, MaterialFactory.get(MaterialFactory.PRESETS.LEATHER_BROWN, 'leather'));
    aventail.position.y = -0.08;
    group.add(aventail);
    return group;
  },

  // H_04: 황건 두건 (피 묻은 노란색) [Voxel_Human_Rebel]
  createYellowTurban: (): Group => {
    const group = new Group();
    const head = new Mesh(new SphereGeometry(0.09, 16, 16), MaterialFactory.get(MaterialFactory.PRESETS.SKIN, 'skin'));
    group.add(head);
    
    // 피 묻은 텍스처는 MaterialFactory에서 rust 타입 활용
    const bandMat = MaterialFactory.get(MaterialFactory.PRESETS.YELLOW_TURBAN, 'rust'); 
    const bandGeo = new CylinderGeometry(0.095, 0.095, 0.06, 16);
    const band = new Mesh(bandGeo, bandMat);
    band.position.y = 0.02;
    group.add(band);
    
    // 삐져나온 머리카락
    const hairGeo = new CylinderGeometry(0.03, 0.05, 0.08);
    const hair = new Mesh(hairGeo, MaterialFactory.get('#1a1a1a', 'fabric'));
    hair.position.y = 0.12;
    group.add(hair);
    return group;
  },

  // H_06: 중장 철투구 (T자형/일자형) [Voxel_Human_Heavy]
  createHeavyHelmet: (): Group => {
    const group = new Group();
    const helmGeo = new CylinderGeometry(0.09, 0.1, 0.18, 8);
    const helm = new Mesh(helmGeo, MaterialFactory.get(MaterialFactory.PRESETS.DARK_IRON, 'metal'));
    helm.position.y = 0.02;
    group.add(helm);
    
    // 눈 구멍 (어둡게 처리)
    const visor = new Mesh(new BoxGeometry(0.12, 0.02, 0.12), MaterialFactory.get('#000000', 'fabric'));
    visor.position.set(0, 0.02, 0.06);
    group.add(visor);
    return group;
  },

  // H_X: 통수개 (Tongxiukai) - 얼굴 전체 철판 [Voxel_Human_Elite_Heavy]
  createTongxiukai: (): Group => {
    const group = new Group();
    const ironMat = MaterialFactory.get(MaterialFactory.PRESETS.DARK_IRON, 'metal');

    const dome = new Mesh(new SphereGeometry(0.1, 16, 16, 0, Math.PI * 2, 0, 1.6), ironMat);
    group.add(dome);

    const mask = new Mesh(new CylinderGeometry(0.1, 0.1, 0.15, 16, 1, true), ironMat);
    mask.position.y = -0.05;
    group.add(mask);

    const visor = new Mesh(new BoxGeometry(0.12, 0.015, 0.12), MaterialFactory.get('#000000', 'fabric'));
    visor.position.set(0, -0.02, 0.05);
    group.add(visor);
    return group;
  },

  // H_07: 깃털 투구 (백이병)
  createFeatherHelmet: (): Group => {
    const group = new Group();
    const helm = new Mesh(new SphereGeometry(0.1, 16, 16), MaterialFactory.get(MaterialFactory.PRESETS.STEEL, 'metal'));
    group.add(helm);

    const featherGeo = new CylinderGeometry(0.01, 0.04, 0.25, 4);
    const featherMat = MaterialFactory.get('#ffffff', 'fabric');
    
    const lFeather = new Mesh(featherGeo, featherMat);
    lFeather.position.set(0.08, 0.1, 0);
    lFeather.rotation.z = -0.3;
    group.add(lFeather);

    const rFeather = new Mesh(featherGeo, featherMat);
    rFeather.position.set(-0.08, 0.1, 0);
    rFeather.rotation.z = 0.3;
    group.add(rFeather);
    return group;
  },

  // H_10: 등나무 투구 (Rattan) [Voxel_Human_Rattan]
  createRattanHelmet: (): Group => {
    const group = new Group();
    const rattanMat = MaterialFactory.get('#DAA520', 'wood'); // 누런색

    // 챙이 넓은 투구
    const hatGeo = new ConeGeometry(0.2, 0.15, 16);
    const hat = new Mesh(hatGeo, rattanMat);
    hat.position.y = 0.05;
    group.add(hat);

    // 얼굴 그림자 (검은 구체로 얼굴 덮음)
    const faceShadow = new Mesh(new SphereGeometry(0.08, 16, 16), MaterialFactory.get('#000000', 'fabric'));
    group.add(faceShadow);
    return group;
  },

  // H_09: 이민족 털모자 [Voxel_Human_Tribal_North]
  createFurHat: (): Group => {
    const group = new Group();
    const furMat = MaterialFactory.get('#3d2b1f', 'fabric'); // 털 질감

    const hat = new Mesh(new SphereGeometry(0.11, 16, 16, 0, Math.PI*2, 0, 1.6), furMat);
    group.add(hat);

    // 귀마개
    const lEar = new Mesh(new BoxGeometry(0.05, 0.1, 0.05), furMat);
    lEar.position.set(0.09, -0.05, 0);
    group.add(lEar);
    const rEar = new Mesh(new BoxGeometry(0.05, 0.1, 0.05), furMat);
    rEar.position.set(-0.09, -0.05, 0);
    group.add(rEar);
    return group;
  },

  // H_12: 판갑 투구 (가야식) [Voxel_Human_Gaya]
  createGayaHelmet: (): Group => {
    const group = new Group();
    const ironMat = MaterialFactory.get(MaterialFactory.PRESETS.IRON, 'metal');

    // 고깔 모양 투구
    const dome = new Mesh(new ConeGeometry(0.09, 0.15, 8), ironMat);
    group.add(dome);

    // 목 뒤를 감싸는 넓은 철판
    const neckGuard = new Mesh(new CylinderGeometry(0.12, 0.15, 0.1, 8, 1, true, Math.PI, Math.PI), ironMat);
    neckGuard.position.set(0, -0.08, 0);
    group.add(neckGuard);
    return group;
  },

  // H_11: 야수 탈 [Voxel_Beast_Rider]
  createBeastMask: (): Group => {
    const group = new Group();
    const head = new Mesh(new SphereGeometry(0.09, 16, 16), MaterialFactory.get(MaterialFactory.PRESETS.SKIN, 'skin'));
    group.add(head);

    const hoodMat = MaterialFactory.get('#5D4037', 'leather');
    const hood = new Mesh(new BoxGeometry(0.2, 0.15, 0.22), hoodMat);
    hood.position.set(0, 0.1, 0);
    group.add(hood);

    const snout = new Mesh(new CylinderGeometry(0, 0.06, 0.15, 4), hoodMat);
    snout.position.set(0, 0.1, 0.15);
    snout.rotation.x = -Math.PI / 2;
    group.add(snout);
    return group;
  },

  // H_14: 주술사 가면 [Voxel_Human_Tribal] - 나뭇잎 위장
  createTribalMask: (): Group => {
    const group = new Group();
    // 나뭇잎 위장
    const leafMat = MaterialFactory.get('#228B22', 'fabric'); // 숲색
    const head = new Mesh(new SphereGeometry(0.1, 8, 8), leafMat); // 거친 텍스처
    group.add(head);

    // 입에 문 대나무 관
    const pipe = new Mesh(new CylinderGeometry(0.01, 0.01, 0.3), MaterialFactory.get(MaterialFactory.PRESETS.BAMBOO, 'wood'));
    pipe.position.set(0, -0.05, 0.15);
    pipe.rotation.x = Math.PI / 2;
    group.add(pipe);
    
    return group;
  },

  // H_13: 관모 (문관)
  createOfficialHat: (color: string): Group => {
    const group = new Group();
    const baseGeo = new BoxGeometry(0.16, 0.08, 0.16);
    const base = new Mesh(baseGeo, MaterialFactory.get('#1a1a1a', 'fabric'));
    
    const topGeo = new BoxGeometry(0.12, 0.1, 0.12);
    const top = new Mesh(topGeo, MaterialFactory.get('#1a1a1a', 'fabric'));
    top.position.y = 0.09;
    group.add(base, top);
    
    const pinGeo = new CylinderGeometry(0.005, 0.005, 0.25);
    const pin = new Mesh(pinGeo, MaterialFactory.get(MaterialFactory.PRESETS.GOLD, 'gold'));
    pin.rotation.z = Math.PI / 2;
    pin.position.y = 0.09;
    group.add(pin);
    return group;
  }
};
