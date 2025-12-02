/**
 * 데모용 샘플 데이터
 * 개발 및 테스트용 함대 데이터
 */

import { Fleet, Admiral, Faction, Formation } from './types';

// 샘플 제독 데이터
export const sampleAdmirals: Record<string, Admiral> = {
  // 자유행성동맹
  yangWenli: {
    id: 'admiral-yang',
    name: '양 웬리',
    portrait: '/portraits/yang.png',
    command: 95,
    combat: 75,
    intelligence: 100,
    politics: 60,
    charisma: 90,
    skills: ['기동전', '방어전', '지휘'],
  },
  attenborough: {
    id: 'admiral-attenborough',
    name: '더스티 아텐보로',
    portrait: '/portraits/attenborough.png',
    command: 80,
    combat: 70,
    intelligence: 75,
    politics: 50,
    charisma: 85,
    skills: ['선봉', '돌격'],
  },
  fischer: {
    id: 'admiral-fischer',
    name: '에드윈 피셔',
    portrait: '/portraits/fischer.png',
    command: 75,
    combat: 80,
    intelligence: 70,
    politics: 45,
    charisma: 70,
    skills: ['포격전', '방어'],
  },
  
  // 은하제국
  reinhard: {
    id: 'admiral-reinhard',
    name: '라인하르트 폰 로엔그람',
    portrait: '/portraits/reinhard.png',
    command: 100,
    combat: 90,
    intelligence: 95,
    politics: 85,
    charisma: 100,
    skills: ['천재전략가', '카리스마', '공격전'],
  },
  mittermeyer: {
    id: 'admiral-mittermeyer',
    name: '볼프강 미터마이어',
    portrait: '/portraits/mittermeyer.png',
    command: 90,
    combat: 85,
    intelligence: 80,
    politics: 60,
    charisma: 85,
    skills: ['질풍', '기동전', '돌격'],
  },
  reuenthal: {
    id: 'admiral-reuenthal',
    name: '오스카 폰 로이엔탈',
    portrait: '/portraits/reuenthal.png',
    command: 88,
    combat: 88,
    intelligence: 85,
    politics: 70,
    charisma: 90,
    skills: ['전술가', '공격전'],
  },
  bittenfeld: {
    id: 'admiral-bittenfeld',
    name: '프리츠 요제프 비텐펠트',
    portrait: '/portraits/bittenfeld.png',
    command: 82,
    combat: 95,
    intelligence: 65,
    politics: 40,
    charisma: 75,
    skills: ['흑색창기병', '돌격', '공격전'],
  },
};

// 함대 생성 헬퍼
function createFleet(
  id: string,
  name: string,
  faction: Faction,
  commander: Admiral,
  position: { x: number; y: number; heading: number },
  options: Partial<Fleet> = {}
): Fleet {
  const baseShips = 12000 + Math.floor(Math.random() * 6000);
  
  return {
    id,
    name,
    faction,
    commander,
    tacticalPosition: position,
    totalShips: baseShips,
    maxShips: 18000,
    shipTypes: {
      battleship: Math.floor(baseShips * 0.3),
      cruiser: Math.floor(baseShips * 0.25),
      destroyer: Math.floor(baseShips * 0.3),
      carrier: Math.floor(baseShips * 0.1),
      engineering: Math.floor(baseShips * 0.05),
    },
    hp: 85000 + Math.floor(Math.random() * 15000),
    maxHp: 100000,
    morale: 75 + Math.floor(Math.random() * 25),
    supply: 70 + Math.floor(Math.random() * 30),
    formation: 'fishScale' as Formation,
    speed: 100 + Math.floor(Math.random() * 50),
    attackRange: 800 + Math.floor(Math.random() * 400),
    isFlagship: false,
    isSelected: false,
    isMoving: false,
    isAttacking: false,
    ...options,
  };
}

// 자유행성동맹 함대
export const allianceFleets: Fleet[] = [
  createFleet(
    'fleet-13th',
    '제13함대',
    'alliance',
    sampleAdmirals.yangWenli,
    { x: 3000, y: 5000, heading: 0 },
    { isFlagship: true, formation: 'craneWing', totalShips: 16500, hp: 95000 }
  ),
  createFleet(
    'fleet-10th',
    '제10함대',
    'alliance',
    sampleAdmirals.attenborough,
    { x: 2500, y: 4200, heading: 15 },
    { formation: 'arrowhead' }
  ),
  createFleet(
    'fleet-5th',
    '제5함대',
    'alliance',
    sampleAdmirals.fischer,
    { x: 2500, y: 5800, heading: -10 },
    { formation: 'circular' }
  ),
];

// 은하제국 함대
export const empireFleets: Fleet[] = [
  createFleet(
    'fleet-schwarzenlanzen',
    '슈바르츠란첸',
    'empire',
    sampleAdmirals.reinhard,
    { x: 7000, y: 5000, heading: 180 },
    { isFlagship: true, formation: 'fishScale', totalShips: 18000, hp: 100000 }
  ),
  createFleet(
    'fleet-mittermeyer',
    '미터마이어 함대',
    'empire',
    sampleAdmirals.mittermeyer,
    { x: 7500, y: 4000, heading: 200 },
    { formation: 'arrowhead', speed: 150 }
  ),
  createFleet(
    'fleet-reuenthal',
    '로이엔탈 함대',
    'empire',
    sampleAdmirals.reuenthal,
    { x: 7500, y: 6000, heading: 160 },
    { formation: 'craneWing' }
  ),
  createFleet(
    'fleet-bittenfeld',
    '흑색창기병',
    'empire',
    sampleAdmirals.bittenfeld,
    { x: 8000, y: 5000, heading: 180 },
    { formation: 'fishScale', totalShips: 15000, speed: 130 }
  ),
];

// 전체 함대
export const allDemoFleets: Fleet[] = [...allianceFleets, ...empireFleets];

// 전투 시나리오
export const battleScenarios = {
  iserlohn: {
    name: '이제르론 회랑 전투',
    description: '양 웬리의 제13함대와 라인하르트 함대의 대결',
    allianceFleets: allianceFleets.slice(0, 3),
    empireFleets: empireFleets.slice(0, 4),
  },
  vermillion: {
    name: '버밀리온 성역 회전',
    description: '양 웬리 vs 라인하르트의 결전',
    allianceFleets: [allianceFleets[0]],
    empireFleets: empireFleets,
  },
};




