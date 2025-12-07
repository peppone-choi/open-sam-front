import type { TutorialSequence } from '@/types/gin7/tutorial';

/**
 * 기본 조작 튜토리얼 시퀀스
 * 새로운 플레이어를 위한 기초 UI 안내
 */
export const basicsTutorial: TutorialSequence = {
  id: 'gin7-basics',
  name: '기본 조작 튜토리얼',
  description: 'Gin7 게임의 기본 UI와 조작 방법을 알아봅니다.',
  category: 'basics',
  startStep: 'welcome',
  estimatedDuration: 120, // 2분
  repeatable: true,
  steps: [
    {
      id: 'welcome',
      title: 'Gin7에 오신 것을 환영합니다!',
      description: '은하 영웅전설의 세계로 오신 것을 환영합니다. 이 튜토리얼에서 기본 조작법을 알아보겠습니다.',
      action: 'wait',
      waitDuration: 3000,
      nextStep: 'topbar-intro',
      skippable: true,
    },
    {
      id: 'topbar-intro',
      title: '상단 바 소개',
      description: '상단 바에서는 현재 캐릭터 정보, 알림, 게임 시간을 확인할 수 있습니다.',
      targetElement: '[data-tutorial="topbar"]',
      action: 'hover',
      pointerPosition: 'bottom',
      nextStep: 'cp-display',
      highlightPadding: 4,
    },
    {
      id: 'cp-display',
      title: '커맨드 포인트 (CP)',
      description: 'PCP(개인 커맨드 포인트)와 MCP(군사 커맨드 포인트)는 행동의 비용입니다. 시간이 지나면 자동으로 회복됩니다.',
      targetElement: '[data-tutorial="cp-display"]',
      action: 'hover',
      pointerPosition: 'bottom',
      nextStep: 'notifications',
      highlightPadding: 8,
    },
    {
      id: 'notifications',
      title: '알림',
      description: '중요한 이벤트가 발생하면 알림으로 알려드립니다. 클릭하여 자세한 내용을 확인하세요.',
      targetElement: '[data-tutorial="notifications"]',
      action: 'hover',
      pointerPosition: 'bottom-left',
      nextStep: 'sidemenu-intro',
      highlightPadding: 4,
    },
    {
      id: 'sidemenu-intro',
      title: '사이드 메뉴',
      description: '왼쪽 사이드 메뉴에서 주요 기능에 빠르게 접근할 수 있습니다.',
      targetElement: '[data-tutorial="sidemenu"]',
      action: 'hover',
      pointerPosition: 'right',
      nextStep: 'map-menu',
      highlightPadding: 4,
    },
    {
      id: 'map-menu',
      title: '은하 지도',
      description: '은하 지도에서 성계와 행성을 확인하고 함대를 이동시킬 수 있습니다.',
      targetElement: '[data-tutorial="menu-map"]',
      action: 'click',
      pointerPosition: 'right',
      nextStep: 'map-zoom',
      highlightPadding: 4,
    },
    {
      id: 'map-zoom',
      title: '지도 조작',
      description: '마우스 휠로 줌인/줌아웃, 드래그로 이동할 수 있습니다. 성계를 클릭하면 상세 정보가 표시됩니다.',
      targetElement: '[data-tutorial="galaxy-map"]',
      action: 'wait',
      waitDuration: 4000,
      pointerPosition: 'top',
      nextStep: 'minimap-intro',
      highlightPadding: 0,
    },
    {
      id: 'minimap-intro',
      title: '미니맵',
      description: '우측 하단의 미니맵으로 현재 위치를 파악하고 빠르게 이동할 수 있습니다.',
      targetElement: '[data-tutorial="minimap"]',
      action: 'hover',
      pointerPosition: 'left',
      nextStep: 'fleet-menu',
      highlightPadding: 8,
    },
    {
      id: 'fleet-menu',
      title: '함대 관리',
      description: '함대 메뉴에서 보유한 함대를 확인하고 관리할 수 있습니다.',
      targetElement: '[data-tutorial="menu-fleet"]',
      action: 'click',
      pointerPosition: 'right',
      nextStep: 'character-menu',
      highlightPadding: 4,
    },
    {
      id: 'character-menu',
      title: '캐릭터 정보',
      description: '캐릭터 메뉴에서 자신의 능력치, 계급, 소속을 확인할 수 있습니다.',
      targetElement: '[data-tutorial="menu-character"]',
      action: 'click',
      pointerPosition: 'right',
      nextStep: 'complete',
      highlightPadding: 4,
    },
    {
      id: 'complete',
      title: '기본 조작 완료!',
      description: '축하합니다! 기본 조작을 모두 익혔습니다. 이제 은하를 탐험해보세요. 추가 튜토리얼은 도움말 메뉴에서 확인할 수 있습니다.',
      action: 'wait',
      waitDuration: 5000,
      skippable: true,
    },
  ],
};

/**
 * 맵 탐색 튜토리얼 시퀀스
 */
export const mapNavigationTutorial: TutorialSequence = {
  id: 'gin7-map-navigation',
  name: '은하 지도 탐색',
  description: '은하 지도의 상세 기능을 알아봅니다.',
  category: 'map',
  startStep: 'map-intro',
  prerequisite: 'gin7-basics',
  estimatedDuration: 180, // 3분
  repeatable: true,
  steps: [
    {
      id: 'map-intro',
      title: '은하 지도 상세 기능',
      description: '은하 지도의 다양한 기능을 자세히 알아보겠습니다.',
      action: 'wait',
      waitDuration: 2500,
      nextStep: 'star-system-select',
    },
    {
      id: 'star-system-select',
      title: '성계 선택',
      description: '지도에서 성계를 클릭하면 해당 성계의 정보 패널이 열립니다.',
      targetElement: '[data-tutorial="star-system"]',
      action: 'click',
      pointerPosition: 'right',
      nextStep: 'system-info',
      highlightPadding: 8,
    },
    {
      id: 'system-info',
      title: '성계 정보',
      description: '성계 패널에서 소속 세력, 행성, 주둔 함대 등의 정보를 확인할 수 있습니다.',
      targetElement: '[data-tutorial="system-panel"]',
      action: 'hover',
      pointerPosition: 'left',
      nextStep: 'planet-select',
      highlightPadding: 4,
    },
    {
      id: 'planet-select',
      title: '행성 선택',
      description: '행성을 클릭하면 행성의 상세 정보와 가능한 행동을 볼 수 있습니다.',
      targetElement: '[data-tutorial="planet-item"]',
      action: 'click',
      pointerPosition: 'left',
      nextStep: 'travel-options',
      highlightPadding: 4,
    },
    {
      id: 'travel-options',
      title: '이동 명령',
      description: '함대를 선택하고 목적지를 지정하면 워프 경로가 계산됩니다.',
      targetElement: '[data-tutorial="travel-button"]',
      action: 'hover',
      pointerPosition: 'bottom',
      nextStep: 'filter-options',
      highlightPadding: 8,
    },
    {
      id: 'filter-options',
      title: '지도 필터',
      description: '지도 컨트롤에서 세력별 필터, 무역로 표시 등을 설정할 수 있습니다.',
      targetElement: '[data-tutorial="map-controls"]',
      action: 'hover',
      pointerPosition: 'bottom',
      nextStep: 'map-complete',
      highlightPadding: 4,
    },
    {
      id: 'map-complete',
      title: '지도 탐색 완료!',
      description: '이제 은하 지도를 자유롭게 탐색할 수 있습니다. 다음 튜토리얼에서 함대 이동을 배워보세요.',
      action: 'wait',
      waitDuration: 4000,
    },
  ],
};

/**
 * 함대 이동 튜토리얼 시퀀스
 */
export const fleetMovementTutorial: TutorialSequence = {
  id: 'gin7-fleet-movement',
  name: '함대 이동',
  description: '함대를 선택하고 이동시키는 방법을 알아봅니다.',
  category: 'fleet',
  startStep: 'fleet-intro',
  prerequisite: 'gin7-map-navigation',
  estimatedDuration: 150, // 2.5분
  repeatable: true,
  steps: [
    {
      id: 'fleet-intro',
      title: '함대 이동하기',
      description: '함대를 선택하고 목적지로 이동시키는 방법을 배워봅시다.',
      action: 'wait',
      waitDuration: 2500,
      nextStep: 'select-fleet',
    },
    {
      id: 'select-fleet',
      title: '함대 선택',
      description: '함대 패널에서 이동시킬 함대를 선택하세요.',
      targetElement: '[data-tutorial="fleet-list"]',
      action: 'click',
      pointerPosition: 'right',
      nextStep: 'fleet-details',
      highlightPadding: 4,
    },
    {
      id: 'fleet-details',
      title: '함대 정보 확인',
      description: '선택한 함대의 전력, 현재 위치, 상태를 확인할 수 있습니다.',
      targetElement: '[data-tutorial="fleet-details"]',
      action: 'hover',
      pointerPosition: 'left',
      nextStep: 'set-destination',
      highlightPadding: 8,
    },
    {
      id: 'set-destination',
      title: '목적지 설정',
      description: '지도에서 목적지 성계를 클릭하여 선택하세요.',
      targetElement: '[data-tutorial="galaxy-map"]',
      action: 'click',
      pointerPosition: 'top',
      nextStep: 'confirm-route',
      highlightPadding: 0,
    },
    {
      id: 'confirm-route',
      title: '경로 확인',
      description: '워프 경로와 예상 소요 시간을 확인하고 이동 명령을 내리세요.',
      targetElement: '[data-tutorial="route-confirm"]',
      action: 'click',
      pointerPosition: 'bottom',
      nextStep: 'movement-complete',
      highlightPadding: 8,
    },
    {
      id: 'movement-complete',
      title: '함대 이동 완료!',
      description: '함대가 목적지를 향해 출발했습니다. 도착까지의 진행 상황은 함대 패널에서 확인할 수 있습니다.',
      action: 'wait',
      waitDuration: 4000,
    },
  ],
};

/**
 * 전투 참여 튜토리얼 시퀀스
 */
export const combatTutorial: TutorialSequence = {
  id: 'gin7-combat-basics',
  name: '전투 시스템 기초',
  description: '전투의 기본 개념과 참여 방법을 알아봅니다.',
  category: 'combat',
  startStep: 'combat-intro',
  prerequisite: 'gin7-fleet-movement',
  estimatedDuration: 200, // 약 3.5분
  repeatable: true,
  steps: [
    {
      id: 'combat-intro',
      title: '전투 시스템',
      description: '적 함대와 조우하면 전투가 시작됩니다. 전투의 기본 흐름을 알아봅시다.',
      action: 'wait',
      waitDuration: 3000,
      nextStep: 'tactical-view',
    },
    {
      id: 'tactical-view',
      title: '전술 화면',
      description: '전투 중에는 전술 화면이 표시됩니다. 아군과 적군 함대의 위치와 상태를 확인하세요.',
      targetElement: '[data-tutorial="tactical-map"]',
      action: 'hover',
      pointerPosition: 'top',
      nextStep: 'command-panel',
      highlightPadding: 4,
    },
    {
      id: 'command-panel',
      title: '명령 패널',
      description: '명령 패널에서 함대에게 전술 지시를 내릴 수 있습니다.',
      targetElement: '[data-tutorial="command-panel"]',
      action: 'hover',
      pointerPosition: 'left',
      nextStep: 'formation-command',
      highlightPadding: 8,
    },
    {
      id: 'formation-command',
      title: '진형 변경',
      description: '진형을 변경하여 공격력과 방어력의 균형을 조절할 수 있습니다.',
      targetElement: '[data-tutorial="formation-select"]',
      action: 'hover',
      pointerPosition: 'bottom',
      nextStep: 'special-attack',
      highlightPadding: 4,
    },
    {
      id: 'special-attack',
      title: '특수 공격',
      description: '지휘관의 능력에 따라 특수 공격을 사용할 수 있습니다. MCP를 소모합니다.',
      targetElement: '[data-tutorial="special-attack"]',
      action: 'hover',
      pointerPosition: 'bottom',
      nextStep: 'retreat-option',
      highlightPadding: 4,
    },
    {
      id: 'retreat-option',
      title: '퇴각',
      description: '불리한 상황에서는 퇴각을 선택할 수 있습니다. 손실을 최소화하세요.',
      targetElement: '[data-tutorial="retreat-button"]',
      action: 'hover',
      pointerPosition: 'bottom',
      nextStep: 'combat-complete',
      highlightPadding: 8,
    },
    {
      id: 'combat-complete',
      title: '전투 기초 완료!',
      description: '전투의 기본을 익혔습니다. 실전에서 경험을 쌓으며 전략을 발전시켜 보세요!',
      action: 'wait',
      waitDuration: 4000,
    },
  ],
};

/**
 * 내정 튜토리얼 시퀀스
 */
export const economyTutorial: TutorialSequence = {
  id: 'gin7-economy-basics',
  name: '내정 관리 기초',
  description: '행성 관리와 자원 생산의 기초를 알아봅니다.',
  category: 'economy',
  startStep: 'economy-intro',
  prerequisite: 'gin7-basics',
  estimatedDuration: 180, // 3분
  repeatable: true,
  steps: [
    {
      id: 'economy-intro',
      title: '내정 관리',
      description: '행성을 관리하고 자원을 생산하는 방법을 알아봅시다.',
      action: 'wait',
      waitDuration: 2500,
      nextStep: 'planet-overview',
    },
    {
      id: 'planet-overview',
      title: '행성 개요',
      description: '행성 패널에서 인구, 자원, 시설 현황을 확인할 수 있습니다.',
      targetElement: '[data-tutorial="planet-panel"]',
      action: 'hover',
      pointerPosition: 'left',
      nextStep: 'resource-display',
      highlightPadding: 4,
    },
    {
      id: 'resource-display',
      title: '자원 현황',
      description: '식량, 광물, 연료 등의 생산량과 소비량을 확인하세요.',
      targetElement: '[data-tutorial="resource-display"]',
      action: 'hover',
      pointerPosition: 'bottom',
      nextStep: 'facility-build',
      highlightPadding: 8,
    },
    {
      id: 'facility-build',
      title: '시설 건설',
      description: '시설을 건설하여 생산량을 늘리고 특수 기능을 해금할 수 있습니다.',
      targetElement: '[data-tutorial="build-button"]',
      action: 'click',
      pointerPosition: 'right',
      nextStep: 'budget-allocation',
      highlightPadding: 4,
    },
    {
      id: 'budget-allocation',
      title: '예산 배분',
      description: '국가 예산을 군사, 개발, 복지에 배분하여 성장 방향을 설정할 수 있습니다.',
      targetElement: '[data-tutorial="budget-panel"]',
      action: 'hover',
      pointerPosition: 'left',
      nextStep: 'economy-complete',
      highlightPadding: 8,
    },
    {
      id: 'economy-complete',
      title: '내정 기초 완료!',
      description: '내정 관리의 기초를 익혔습니다. 효율적인 자원 관리가 승리의 기반입니다!',
      action: 'wait',
      waitDuration: 4000,
    },
  ],
};

/**
 * 모든 튜토리얼 시퀀스
 */
export const allTutorials: TutorialSequence[] = [
  basicsTutorial,
  mapNavigationTutorial,
  fleetMovementTutorial,
  combatTutorial,
  economyTutorial,
];

/**
 * 튜토리얼 ID로 시퀀스 찾기
 */
export function getTutorialById(id: string): TutorialSequence | undefined {
  return allTutorials.find(t => t.id === id);
}

/**
 * 카테고리별 튜토리얼 그룹
 */
export function getTutorialsByCategory(category: string): TutorialSequence[] {
  return allTutorials.filter(t => t.category === category);
}








