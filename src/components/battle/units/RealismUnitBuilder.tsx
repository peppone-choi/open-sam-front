'use client';

import { Group } from 'three';
import { HeadAssets } from './assets/HeadAssets';
import { BodyAssets } from './assets/BodyAssets';
import { WeaponAssets } from './assets/WeaponAssets';
import { MountAssets } from './assets/MountAssets';
import { SubAssets } from './assets/SubAssets'; // 추가
import { MaterialFactory } from './materials/MaterialFactory';
import { UnitDefinition, UNIT_DATABASE } from './db/UnitDefinitions';

// ===== 메인 빌더 =====
export function buildRealismUnit(config: UnitDefinition, primaryColor: string, secondaryColor: string): Group {
  const unitGroup = new Group();
  
  // 1. 탈것 생성
  let mountHeight = 0;
  if (config.mount && config.mount !== 'none') {
    let mount: Group | null = null;
    
    switch (config.mount) {
      case 'horse': mount = MountAssets.createHorse('#5D4037'); break;
      case 'white_horse': mount = MountAssets.createHorse('#f0f0f0'); break;
      case 'armored_horse': mount = MountAssets.createArmoredHorse(MaterialFactory.PRESETS.DARK_IRON); break;
      case 'heavy_horse': mount = MountAssets.createArmoredHorse(MaterialFactory.PRESETS.IRON); break;
      case 'fur_horse': mount = MountAssets.createHorse('#3d2b1f'); break;
      case 'camel': mount = MountAssets.createHorse('#c2b280'); break; // 낙타 임시
      case 'wolf': mount = MountAssets.createHorse('#5a5a5a'); break; // 늑대 임시
      case 'tiger': mount = MountAssets.createHorse('#ffa500'); break; // 호랑이 임시
      case 'elephant': mount = MountAssets.createArmoredHorse(MaterialFactory.PRESETS.DARK_IRON); break; // 코끼리 임시
      case 'cart': mount = MountAssets.createHorse('#8b4513'); break; // 수레 임시
      case 'ram': mount = MountAssets.createArmoredHorse(MaterialFactory.PRESETS.IRON); break; // 충차 임시
      case 'catapult': mount = MountAssets.createArmoredHorse(MaterialFactory.PRESETS.DARK_IRON); break; // 투석기 임시
      case 'tower': mount = MountAssets.createArmoredHorse(MaterialFactory.PRESETS.IRON); break; // 공성탑 임시
      case 'beast': mount = MountAssets.createHorse('#6b4226'); break; // 맹수 임시
      default: mount = MountAssets.createHorse(); 
    }

    if (mount) {
      unitGroup.add(mount);
      mountHeight = 0.9;
    }
  }

  // 2. 몸통 생성
  let body: Group;
  
  switch (config.body) {
    case 'rag': 
    case 'rag_poor': body = BodyAssets.createRags(secondaryColor); break;
    case 'leather': body = BodyAssets.createLamellarArmor(primaryColor); break; // 가죽 임시
    case 'lamellar':
    case 'liang_dang': body = BodyAssets.createLamellarArmor(primaryColor); break;
    case 'heavy_lamellar':
    case 'heavy_black': body = BodyAssets.createLamellarArmor(MaterialFactory.PRESETS.DARK_IRON); break;
    case 'plate': body = BodyAssets.createPlateArmor(MaterialFactory.PRESETS.IRON); break;
    case 'gold': body = BodyAssets.createPlateArmor(MaterialFactory.PRESETS.GOLD); break;
    case 'robe': body = BodyAssets.createRobe(primaryColor); break;
    case 'coat': body = BodyAssets.createLamellarArmor(primaryColor); break; // 호복 임시
    case 'rattan': body = BodyAssets.createLamellarArmor('#5c4033'); break; // 등갑 임시
    case 'naked':
    case 'muscle_light': body = BodyAssets.createBaseBody(); break;
    default: body = BodyAssets.createLamellarArmor(primaryColor);
  }
  
  // 인체 기본형
  if (config.body === 'naked') {
    // 이미 body에 할당됨
  } else {
    const baseBody = BodyAssets.createBaseBody();
    body.add(baseBody);
  }
  
  // 기수 자세 조정
  if (config.mount && config.mount !== 'none') {
    body.position.set(0, 0.25, 0.1);
    
    const baseBody = config.body === 'naked' ? body : body.children[body.children.length - 1];
    
    const lLeg = baseBody.children[3]; // BodyAssets 구조 의존
    if (lLeg) {
      lLeg.rotation.z = -0.5;
      lLeg.rotation.x = -0.8;
      const lJointGroup = lLeg.children[1];
      if (lJointGroup) lJointGroup.rotation.x = 1.5;
    }
    
    const rLeg = baseBody.children[4];
    if (rLeg) {
      rLeg.rotation.z = 0.5;
      rLeg.rotation.x = -0.8;
      const rJointGroup = rLeg.children[1];
      if (rJointGroup) rJointGroup.rotation.x = 1.5;
    }
  }
  
  unitGroup.add(body);

  // 3. 머리 장비
  let headGear: Group | null = null;
  
  switch (config.head) {
    case 'peasant': headGear = HeadAssets.createPeasantHead(); break;
    case 'soldier': headGear = HeadAssets.createSoldierHelmet(primaryColor); break;
    case 'yellow': headGear = HeadAssets.createYellowTurban(); break;
    case 'officer': headGear = HeadAssets.createSoldierHelmet(MaterialFactory.PRESETS.RED_TASSEL); break;
    case 'heavy': headGear = HeadAssets.createHeavyHelmet(); break;
    case 'official': headGear = HeadAssets.createOfficialHat(primaryColor); break;
    case 'hat': headGear = HeadAssets.createPeasantHead(); break; // 삿갓 임시
    case 'feather': headGear = HeadAssets.createSoldierHelmet(primaryColor); break; // 깃털 투구 임시
    case 'gold': headGear = HeadAssets.createHeavyHelmet(); break; // 황금 임시
    case 'rattan': headGear = HeadAssets.createPeasantHead(); break; // 등투구 임시
    case 'beast': headGear = HeadAssets.createYellowTurban(); break; // 야수 탈 임시
    case 'mask': headGear = HeadAssets.createYellowTurban(); break; // 주술사 가면 임시
    case 'fur': headGear = HeadAssets.createPeasantHead(); break; // 털모자 임시
    case 'plate': headGear = HeadAssets.createHeavyHelmet(); break; // 판갑 투구 임시
    default: headGear = HeadAssets.createSoldierHelmet(primaryColor);
  }
  
  if (headGear) {
    const bodyY = config.mount && config.mount !== 'none' ? 0.25 : 0;
    headGear.position.y = bodyY + 1.6; 
    unitGroup.add(headGear);
  }

  // 4. 무기 장착 (오른손)
  const bodyY = config.mount && config.mount !== 'none' ? 0.25 : 0;
  
  if (config.weapon && config.weapon !== 'none') {
    let weapon: Group | null = null;
    switch (config.weapon) {
      case 'spear': weapon = WeaponAssets.createSpear(); break;
      case 'bamboo': weapon = WeaponAssets.createBambooSpear(); break;
      case 'dao': weapon = WeaponAssets.createDao(); break;
      case 'sword': weapon = WeaponAssets.createDao(); break; // 검 임시
      case 'guandao': weapon = WeaponAssets.createGuandao(); break;
      case 'bow': weapon = WeaponAssets.createBow(); break;
      case 'composite_bow': weapon = WeaponAssets.createBow(); break;
      case 'crossbow': weapon = WeaponAssets.createCrossbow(); break;
      case 'repeater': weapon = WeaponAssets.createCrossbow(); break; // 연노 임시
      case 'lance': weapon = WeaponAssets.createLance(); break;
      case 'axe': weapon = WeaponAssets.createAxe(); break;
      case 'mace': weapon = WeaponAssets.createMace(); break;
      case 'fan': weapon = WeaponAssets.createFan(); break;
      case 'halberd': weapon = WeaponAssets.createHalberd(); break;
      default: weapon = WeaponAssets.createDao();
    }

    if (weapon) {
      const handX = -0.25;
      const handY = bodyY + 1.0;
      const handZ = 0.3;
      
      weapon.position.set(handX, handY, handZ);
      
      if (config.weapon.includes('bow') || config.weapon.includes('crossbow')) {
        weapon.rotation.y = Math.PI / 2;
      } else {
        weapon.rotation.x = Math.PI / 4; 
        weapon.rotation.z = -Math.PI / 4;
      }
      
      unitGroup.add(weapon);
    }
  }

  // 5. 보조 장비 장착 (왼손/등)
  if (config.offHand && config.offHand !== 'none') {
    let sub: Group | null = null;
    
    switch (config.offHand) {
      case 'shield_round': sub = SubAssets.createRoundShield('wood'); break;
      case 'shield_rect': sub = SubAssets.createRectShield(primaryColor); break;
      case 'shield_tower': sub = SubAssets.createTowerShield(); break;
      case 'quiver': sub = SubAssets.createQuiver(); break;
      case 'basket': sub = SubAssets.createQuiver(); break; // 바구니 임시
      default: break;
    }

    if (sub) {
      if (config.offHand === 'quiver') {
        // 등 뒤에 장착
        sub.position.set(0, bodyY + 1.1, -0.25);
        sub.rotation.z = -0.3;
      } else {
        // 왼손에 장착
        const handX = 0.25;
        const handY = bodyY + 1.0;
        const handZ = 0.3;
        
        sub.position.set(handX, handY, handZ);
        sub.rotation.y = Math.PI / 2; // 옆으로 들기
      }
      unitGroup.add(sub);
    }
  }

  return unitGroup;
}

// ID로 유닛 생성하는 헬퍼 함수
export function buildUnitById(id: number, primaryColor: string, secondaryColor: string): Group {
  const definition = UNIT_DATABASE[id];
  if (!definition) {
    console.warn(`Unit ID ${id} not found, using default.`);
    return buildRealismUnit(UNIT_DATABASE[1100], primaryColor, secondaryColor);
  }
  return buildRealismUnit(definition, primaryColor, secondaryColor);
}
