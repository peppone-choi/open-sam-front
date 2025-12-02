'use client';

import React, { useRef, useEffect, useMemo } from 'react';
import {
  Group,
  Mesh,
  MeshStandardMaterial,
  BoxGeometry,
  CylinderGeometry,
  SphereGeometry,
  ConeGeometry,
  TorusGeometry,
  Color,
  Vector3,
} from 'three';

// ===== 타입 정의 =====
export interface UnitConfig {
  // 병종
  unitType: 'infantry' | 'archer' | 'cavalry' | 'siege' | 'commander';
  
  // 세부 유형
  variant?: string; // 'spear', 'sword', 'halberd', 'crossbow', 'heavy', 'light'...
  
  // 색상 (국가)
  primaryColor: string;   // 주 색상 (갑옷)
  secondaryColor: string; // 보조 색상 (천/장식)
  
  // 장비
  weapon?: 'spear' | 'sword' | 'halberd' | 'bow' | 'crossbow' | 'staff' | 'axe' | 'none';
  shield?: boolean;
  helmet?: 'none' | 'cap' | 'helm' | 'crown' | 'hat';
  
  // 추가 장식
  banner?: boolean;
  cape?: boolean;
  
  // 크기
  scale?: number;
}

// ===== 색상 팔레트 =====
export const NATION_PALETTES: Record<string, { primary: string; secondary: string }> = {
  wei: { primary: '#1e40af', secondary: '#60a5fa' },     // 위 - 파랑
  shu: { primary: '#15803d', secondary: '#4ade80' },     // 촉 - 초록
  wu: { primary: '#b91c1c', secondary: '#fca5a5' },      // 오 - 빨강
  jin: { primary: '#7c3aed', secondary: '#c4b5fd' },     // 진 - 보라
  yellow: { primary: '#ca8a04', secondary: '#fde047' },  // 황건 - 노랑
  dong: { primary: '#374151', secondary: '#9ca3af' },    // 동탁 - 회색
  neutral: { primary: '#6b7280', secondary: '#d1d5db' }, // 중립 - 회색
};

// ===== 재질 생성 =====
function createMaterial(color: string, metalness = 0.3, roughness = 0.7): MeshStandardMaterial {
  return new MeshStandardMaterial({
    color: new Color(color),
    metalness,
    roughness,
  });
}

// ===== 인체 파츠 =====
function createHead(material: MeshStandardMaterial): Mesh {
  const geo = new SphereGeometry(0.15, 16, 16);
  const mesh = new Mesh(geo, material);
  return mesh;
}

function createTorso(material: MeshStandardMaterial): Mesh {
  const geo = new BoxGeometry(0.25, 0.35, 0.15);
  const mesh = new Mesh(geo, material);
  return mesh;
}

function createArm(material: MeshStandardMaterial, isLeft: boolean): Group {
  const arm = new Group();
  
  // 상완
  const upperGeo = new CylinderGeometry(0.04, 0.05, 0.18, 8);
  const upper = new Mesh(upperGeo, material);
  upper.position.y = -0.09;
  arm.add(upper);
  
  // 하완
  const lowerGeo = new CylinderGeometry(0.035, 0.04, 0.16, 8);
  const lower = new Mesh(lowerGeo, material);
  lower.position.y = -0.24;
  arm.add(lower);
  
  // 손
  const handGeo = new SphereGeometry(0.04, 8, 8);
  const skinMat = createMaterial('#deb887', 0, 0.9);
  const hand = new Mesh(handGeo, skinMat);
  hand.position.y = -0.32;
  arm.add(hand);
  
  arm.position.x = isLeft ? -0.17 : 0.17;
  arm.position.y = 0.12;
  
  return arm;
}

function createLeg(material: MeshStandardMaterial, isLeft: boolean): Group {
  const leg = new Group();
  
  // 허벅지
  const thighGeo = new CylinderGeometry(0.06, 0.05, 0.2, 8);
  const thigh = new Mesh(thighGeo, material);
  thigh.position.y = -0.1;
  leg.add(thigh);
  
  // 종아리
  const calfGeo = new CylinderGeometry(0.04, 0.05, 0.2, 8);
  const calf = new Mesh(calfGeo, material);
  calf.position.y = -0.28;
  leg.add(calf);
  
  // 발
  const footGeo = new BoxGeometry(0.06, 0.04, 0.1);
  const foot = new Mesh(footGeo, material);
  foot.position.set(0, -0.38, 0.02);
  leg.add(foot);
  
  leg.position.x = isLeft ? -0.08 : 0.08;
  leg.position.y = -0.17;
  
  return leg;
}

// ===== 투구/모자 파츠 =====
function createHelmet(type: string, material: MeshStandardMaterial): Group {
  const helmet = new Group();
  
  switch (type) {
    case 'helm': {
      // 병사 투구
      const baseGeo = new SphereGeometry(0.17, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2);
      const base = new Mesh(baseGeo, material);
      helmet.add(base);
      
      // 투구 테두리
      const rimGeo = new TorusGeometry(0.17, 0.02, 8, 16);
      const rim = new Mesh(rimGeo, material);
      rim.rotation.x = Math.PI / 2;
      helmet.add(rim);
      
      // 뿔/장식
      const hornGeo = new ConeGeometry(0.03, 0.12, 8);
      const horn = new Mesh(hornGeo, createMaterial('#fbbf24', 0.5, 0.3));
      horn.position.set(0, 0.12, 0);
      helmet.add(horn);
      break;
    }
    case 'cap': {
      // 두건/모자
      const capGeo = new SphereGeometry(0.16, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2);
      const cap = new Mesh(capGeo, material);
      helmet.add(cap);
      break;
    }
    case 'crown': {
      // 왕관/관모
      const baseGeo = new CylinderGeometry(0.12, 0.14, 0.08, 16);
      const base = new Mesh(baseGeo, createMaterial('#fbbf24', 0.7, 0.2));
      helmet.add(base);
      
      // 장식
      for (let i = 0; i < 5; i++) {
        const spikeGeo = new ConeGeometry(0.02, 0.08, 6);
        const spike = new Mesh(spikeGeo, createMaterial('#fbbf24', 0.7, 0.2));
        const angle = (i / 5) * Math.PI * 2;
        spike.position.set(Math.cos(angle) * 0.1, 0.08, Math.sin(angle) * 0.1);
        helmet.add(spike);
      }
      break;
    }
    case 'hat': {
      // 책사 모자
      const hatGeo = new ConeGeometry(0.2, 0.25, 16);
      const hat = new Mesh(hatGeo, material);
      hat.position.y = 0.05;
      helmet.add(hat);
      break;
    }
  }
  
  return helmet;
}

// ===== 무기 파츠 =====
function createWeapon(type: string, color: string): Group {
  const weapon = new Group();
  const metalMat = createMaterial('#6b7280', 0.8, 0.2);
  const woodMat = createMaterial('#92400e', 0.1, 0.9);
  const accentMat = createMaterial(color, 0.5, 0.5);
  
  switch (type) {
    case 'spear': {
      // 창대
      const shaftGeo = new CylinderGeometry(0.015, 0.02, 1.2, 8);
      const shaft = new Mesh(shaftGeo, woodMat);
      weapon.add(shaft);
      
      // 창날
      const bladeGeo = new ConeGeometry(0.04, 0.2, 8);
      const blade = new Mesh(bladeGeo, metalMat);
      blade.position.y = 0.7;
      weapon.add(blade);
      break;
    }
    case 'sword': {
      // 검신
      const bladeGeo = new BoxGeometry(0.04, 0.5, 0.01);
      const blade = new Mesh(bladeGeo, metalMat);
      blade.position.y = 0.25;
      weapon.add(blade);
      
      // 손잡이
      const hiltGeo = new CylinderGeometry(0.025, 0.025, 0.12, 8);
      const hilt = new Mesh(hiltGeo, woodMat);
      weapon.add(hilt);
      
      // 가드
      const guardGeo = new BoxGeometry(0.12, 0.02, 0.03);
      const guard = new Mesh(guardGeo, accentMat);
      guard.position.y = 0.05;
      weapon.add(guard);
      break;
    }
    case 'halberd': {
      // 장대
      const shaftGeo = new CylinderGeometry(0.02, 0.025, 1.4, 8);
      const shaft = new Mesh(shaftGeo, woodMat);
      weapon.add(shaft);
      
      // 도끼날
      const axeGeo = new BoxGeometry(0.2, 0.15, 0.02);
      const axe = new Mesh(axeGeo, metalMat);
      axe.position.set(0.1, 0.65, 0);
      weapon.add(axe);
      
      // 창끝
      const spikeGeo = new ConeGeometry(0.03, 0.15, 8);
      const spike = new Mesh(spikeGeo, metalMat);
      spike.position.y = 0.8;
      weapon.add(spike);
      break;
    }
    case 'bow': {
      // 활 몸체 (곡선)
      const bowGeo = new TorusGeometry(0.3, 0.015, 8, 16, Math.PI);
      const bow = new Mesh(bowGeo, woodMat);
      bow.rotation.z = Math.PI / 2;
      weapon.add(bow);
      
      // 활시위
      const stringGeo = new CylinderGeometry(0.003, 0.003, 0.6, 4);
      const string = new Mesh(stringGeo, createMaterial('#f5f5dc', 0, 1));
      weapon.add(string);
      break;
    }
    case 'crossbow': {
      // 노 몸체
      const bodyGeo = new BoxGeometry(0.08, 0.4, 0.04);
      const body = new Mesh(bodyGeo, woodMat);
      weapon.add(body);
      
      // 활 부분
      const bowGeo = new BoxGeometry(0.4, 0.03, 0.02);
      const bow = new Mesh(bowGeo, woodMat);
      bow.position.y = 0.15;
      weapon.add(bow);
      break;
    }
    case 'staff': {
      // 지팡이
      const staffGeo = new CylinderGeometry(0.02, 0.025, 1.0, 8);
      const staff = new Mesh(staffGeo, woodMat);
      weapon.add(staff);
      
      // 구슬
      const orbGeo = new SphereGeometry(0.06, 16, 16);
      const orb = new Mesh(orbGeo, createMaterial('#a855f7', 0.3, 0.4));
      orb.position.y = 0.55;
      weapon.add(orb);
      break;
    }
    case 'axe': {
      // 도끼자루
      const handleGeo = new CylinderGeometry(0.02, 0.025, 0.6, 8);
      const handle = new Mesh(handleGeo, woodMat);
      weapon.add(handle);
      
      // 도끼날
      const axeGeo = new BoxGeometry(0.2, 0.12, 0.02);
      const axe = new Mesh(axeGeo, metalMat);
      axe.position.set(0.1, 0.25, 0);
      weapon.add(axe);
      break;
    }
  }
  
  return weapon;
}

// ===== 방패 =====
function createShield(color: string): Mesh {
  const shieldGeo = new BoxGeometry(0.2, 0.3, 0.03);
  const shieldMat = createMaterial(color, 0.4, 0.6);
  const shield = new Mesh(shieldGeo, shieldMat);
  return shield;
}

// ===== 말 =====
function createHorse(color: string): Group {
  const horse = new Group();
  const bodyMat = createMaterial('#4a3728', 0.1, 0.8);
  const saddleMat = createMaterial(color, 0.3, 0.7);
  
  // 몸통
  const bodyGeo = new BoxGeometry(0.3, 0.25, 0.6);
  const body = new Mesh(bodyGeo, bodyMat);
  body.position.set(0, 0.35, 0);
  horse.add(body);
  
  // 머리
  const headGeo = new BoxGeometry(0.12, 0.15, 0.25);
  const head = new Mesh(headGeo, bodyMat);
  head.position.set(0, 0.5, 0.35);
  head.rotation.x = 0.3;
  horse.add(head);
  
  // 목
  const neckGeo = new CylinderGeometry(0.08, 0.1, 0.2, 8);
  const neck = new Mesh(neckGeo, bodyMat);
  neck.position.set(0, 0.45, 0.25);
  neck.rotation.x = 0.5;
  horse.add(neck);
  
  // 다리 4개
  const legPositions = [
    { x: -0.1, z: 0.2 },
    { x: 0.1, z: 0.2 },
    { x: -0.1, z: -0.2 },
    { x: 0.1, z: -0.2 },
  ];
  
  legPositions.forEach(pos => {
    const legGeo = new CylinderGeometry(0.04, 0.035, 0.35, 8);
    const leg = new Mesh(legGeo, bodyMat);
    leg.position.set(pos.x, 0.1, pos.z);
    horse.add(leg);
  });
  
  // 꼬리
  const tailGeo = new CylinderGeometry(0.02, 0.01, 0.25, 8);
  const tail = new Mesh(tailGeo, bodyMat);
  tail.position.set(0, 0.35, -0.35);
  tail.rotation.x = -0.5;
  horse.add(tail);
  
  // 안장
  const saddleGeo = new BoxGeometry(0.2, 0.05, 0.25);
  const saddle = new Mesh(saddleGeo, saddleMat);
  saddle.position.set(0, 0.5, 0);
  horse.add(saddle);
  
  return horse;
}

// ===== 공성기 =====
function createSiegeEngine(type: string): Group {
  const siege = new Group();
  const woodMat = createMaterial('#92400e', 0.1, 0.9);
  const metalMat = createMaterial('#6b7280', 0.7, 0.3);
  
  // 기본 프레임
  const frameGeo = new BoxGeometry(0.5, 0.3, 0.8);
  const frame = new Mesh(frameGeo, woodMat);
  frame.position.y = 0.2;
  siege.add(frame);
  
  // 바퀴 4개
  const wheelPositions = [
    { x: -0.25, z: 0.3 },
    { x: 0.25, z: 0.3 },
    { x: -0.25, z: -0.3 },
    { x: 0.25, z: -0.3 },
  ];
  
  wheelPositions.forEach(pos => {
    const wheelGeo = new CylinderGeometry(0.12, 0.12, 0.04, 16);
    const wheel = new Mesh(wheelGeo, woodMat);
    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(pos.x, 0.1, pos.z);
    siege.add(wheel);
  });
  
  if (type === 'catapult') {
    // 투석기 팔
    const armGeo = new BoxGeometry(0.08, 0.6, 0.08);
    const arm = new Mesh(armGeo, woodMat);
    arm.position.set(0, 0.5, 0);
    arm.rotation.z = -0.5;
    siege.add(arm);
    
    // 바구니
    const bucketGeo = new SphereGeometry(0.1, 8, 8, 0, Math.PI * 2, 0, Math.PI / 2);
    const bucket = new Mesh(bucketGeo, woodMat);
    bucket.position.set(0.2, 0.75, 0);
    bucket.rotation.z = -0.5;
    siege.add(bucket);
  } else if (type === 'ram') {
    // 충차 - 지붕
    const roofGeo = new BoxGeometry(0.6, 0.1, 0.9);
    const roof = new Mesh(roofGeo, woodMat);
    roof.position.y = 0.5;
    siege.add(roof);
    
    // 파성추
    const ramGeo = new CylinderGeometry(0.06, 0.08, 0.7, 8);
    const ram = new Mesh(ramGeo, metalMat);
    ram.rotation.x = Math.PI / 2;
    ram.position.set(0, 0.25, 0.5);
    siege.add(ram);
  }
  
  return siege;
}

// ===== 메인 빌더 함수 =====
export function buildUnit(config: UnitConfig): Group {
  const unit = new Group();
  const scale = config.scale || 1;
  
  const primaryMat = createMaterial(config.primaryColor, 0.4, 0.6);
  const secondaryMat = createMaterial(config.secondaryColor, 0.2, 0.8);
  const skinMat = createMaterial('#deb887', 0, 0.9);
  
  // 병종별 조립
  switch (config.unitType) {
    case 'infantry':
    case 'archer':
    case 'commander': {
      // 인체 조립
      const person = new Group();
      
      // 다리
      person.add(createLeg(primaryMat, true));
      person.add(createLeg(primaryMat, false));
      
      // 몸통
      const torso = createTorso(primaryMat);
      person.add(torso);
      
      // 팔
      person.add(createArm(secondaryMat, true));
      person.add(createArm(secondaryMat, false));
      
      // 머리
      const head = createHead(skinMat);
      head.position.y = 0.35;
      person.add(head);
      
      // 투구
      if (config.helmet && config.helmet !== 'none') {
        const helmet = createHelmet(config.helmet, primaryMat);
        helmet.position.y = 0.4;
        person.add(helmet);
      }
      
      // 무기
      if (config.weapon && config.weapon !== 'none') {
        const weapon = createWeapon(config.weapon, config.primaryColor);
        weapon.position.set(0.25, 0.1, 0);
        weapon.rotation.z = -0.2;
        person.add(weapon);
      }
      
      // 방패
      if (config.shield) {
        const shield = createShield(config.primaryColor);
        shield.position.set(-0.25, 0.05, 0.1);
        person.add(shield);
      }
      
      person.position.y = 0.4;
      unit.add(person);
      break;
    }
    
    case 'cavalry': {
      // 말 추가
      const horse = createHorse(config.primaryColor);
      unit.add(horse);
      
      // 기수
      const rider = new Group();
      
      // 몸통
      const torso = createTorso(primaryMat);
      rider.add(torso);
      
      // 팔
      rider.add(createArm(secondaryMat, true));
      rider.add(createArm(secondaryMat, false));
      
      // 머리
      const head = createHead(skinMat);
      head.position.y = 0.25;
      rider.add(head);
      
      // 투구
      if (config.helmet && config.helmet !== 'none') {
        const helmet = createHelmet(config.helmet, primaryMat);
        helmet.position.y = 0.3;
        rider.add(helmet);
      }
      
      // 무기
      if (config.weapon && config.weapon !== 'none') {
        const weapon = createWeapon(config.weapon, config.primaryColor);
        weapon.position.set(0.25, 0, 0);
        weapon.rotation.z = -0.3;
        rider.add(weapon);
      }
      
      rider.position.set(0, 0.55, 0);
      unit.add(rider);
      break;
    }
    
    case 'siege': {
      const siegeType = config.variant === 'ram' ? 'ram' : 'catapult';
      const siege = createSiegeEngine(siegeType);
      unit.add(siege);
      
      // 조작병 추가
      const operator = new Group();
      const torso = createTorso(secondaryMat);
      operator.add(torso);
      const head = createHead(skinMat);
      head.position.y = 0.25;
      operator.add(head);
      
      operator.position.set(-0.3, 0.3, 0);
      operator.scale.setScalar(0.7);
      unit.add(operator);
      break;
    }
  }
  
  unit.scale.setScalar(scale);
  return unit;
}

// ===== 프리셋 유닛들 =====
export const UNIT_PRESETS: Record<string, Partial<UnitConfig>> = {
  // 보병
  spearman: { unitType: 'infantry', weapon: 'spear', helmet: 'helm', shield: true },
  swordsman: { unitType: 'infantry', weapon: 'sword', helmet: 'helm', shield: true },
  halberdier: { unitType: 'infantry', weapon: 'halberd', helmet: 'helm' },
  guard: { unitType: 'infantry', weapon: 'sword', helmet: 'helm', shield: true },
  
  // 궁병
  archer: { unitType: 'archer', weapon: 'bow', helmet: 'cap' },
  crossbowman: { unitType: 'archer', weapon: 'crossbow', helmet: 'cap' },
  
  // 기병
  lightCavalry: { unitType: 'cavalry', weapon: 'spear', helmet: 'cap' },
  heavyCavalry: { unitType: 'cavalry', weapon: 'halberd', helmet: 'helm' },
  
  // 특수
  strategist: { unitType: 'commander', weapon: 'staff', helmet: 'hat' },
  general: { unitType: 'commander', weapon: 'sword', helmet: 'crown' },
  
  // 공성
  catapult: { unitType: 'siege', variant: 'catapult' },
  ram: { unitType: 'siege', variant: 'ram' },
};

// ===== 병종 코드 -> 유닛 설정 매핑 =====
export function getUnitConfigFromCrewType(crewType: number, nationId?: string): UnitConfig {
  const palette = NATION_PALETTES[nationId || 'neutral'];
  const base: UnitConfig = {
    unitType: 'infantry',
    primaryColor: palette.primary,
    secondaryColor: palette.secondary,
    weapon: 'spear',
    helmet: 'helm',
  };
  
  // 1100~1116: 보병
  if (crewType >= 1100 && crewType <= 1116) {
    const variant = crewType - 1100;
    if (variant <= 5) {
      return { ...base, ...UNIT_PRESETS.spearman };
    } else if (variant <= 10) {
      return { ...base, ...UNIT_PRESETS.swordsman };
    } else {
      return { ...base, ...UNIT_PRESETS.halberdier };
    }
  }
  
  // 1200~1207: 궁병
  if (crewType >= 1200 && crewType <= 1207) {
    if (crewType <= 1203) {
      return { ...base, ...UNIT_PRESETS.archer };
    } else {
      return { ...base, ...UNIT_PRESETS.crossbowman };
    }
  }
  
  // 1300~1309: 기병
  if (crewType >= 1300 && crewType <= 1309) {
    if (crewType <= 1304) {
      return { ...base, ...UNIT_PRESETS.lightCavalry };
    } else {
      return { ...base, ...UNIT_PRESETS.heavyCavalry };
    }
  }
  
  // 1400~1403: 특수병
  if (crewType >= 1400 && crewType <= 1403) {
    return { ...base, ...UNIT_PRESETS.strategist };
  }
  
  // 1500~1503: 공성병기
  if (crewType >= 1500 && crewType <= 1503) {
    if (crewType <= 1501) {
      return { ...base, ...UNIT_PRESETS.catapult };
    } else {
      return { ...base, ...UNIT_PRESETS.ram };
    }
  }
  
  return base;
}


